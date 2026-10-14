const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs/promises')
const path = require('node:path')
const vm = require('node:vm')
const { promisify } = require('node:util')
const ts = require('typescript')

// Compile in memory with the existing compiler; never invoke a real Shortcut.
const loadShortcut = async (execute) => {
  const source = await fs.readFile(
    path.join(__dirname, '../src/shortcut.ts'),
    'utf8',
  )
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  })

  const execFile = () => {
    throw new Error('Unexpected subprocess invocation')
  }

  execFile[promisify.custom] = execute ?? execFile
  const context = {
    exports: {},
    require: (name) =>
      name === 'node:child_process' ? { execFile } : require(name),
  }

  vm.runInNewContext(outputText, context)

  return context.exports
}

const row = (word) => ({ word, definition: `Definition of ${word}` })

const json = (rows) => JSON.stringify(rows)

const plain = (value) => JSON.parse(JSON.stringify(value))

test('accepts the word and definition schema, preserving rank', async () => {
  const { parseSuggestions } = await loadShortcut()

  assert.deepEqual(
    plain(
      parseSuggestions(
        json([row('their'), { word: 'there', definition: 'A place' }]),
      ),
    ),
    [
      { suggestion: 'their', definition: 'Definition of their' },
      { suggestion: 'there', definition: 'A place' },
    ],
  )
})

test('accepts BOM, code fences, and a suggestions wrapper', async () => {
  const { parseSuggestions } = await loadShortcut()

  assert.equal(
    parseSuggestions(
      '\uFEFF```json\n' + json({ suggestions: [row('their')] }) + '\n```',
    )[0].suggestion,
    'their',
  )
})

test('skips invalid rows, normalizes duplicates, and caps results at three', async () => {
  const { parseSuggestions } = await loadShortcut()
  const result = parseSuggestions(
    json([
      null,
      {},
      { word: 'x', definition: 3 },
      row(' '),
      row(' Ａ '),
      row('a'),
      row('two  words'),
      row('TWO WORDS'),
      row('third'),
      row('fourth'),
    ]),
  )

  assert.deepEqual(
    plain(result).map((item) => item.suggestion),
    ['Ａ', 'two  words', 'third'],
  )
})

test('rejects malformed JSON, wrong shapes, and responses without valid rows', async () => {
  const { parseSuggestions } = await loadShortcut()

  assert.throws(
    () => parseSuggestions('Here are the suggestions: []'),
    (error) => {
      assert.match(error.message, /invalid JSON/)
      assert.equal(error.cause?.name, 'SyntaxError')

      return true
    },
  )

  for (const input of ['null', '{}', '{"suggestions":{}}']) {
    assert.throws(() => parseSuggestions(input), /must contain an array/)
  }

  for (const input of [
    '[]',
    '[{"word":"their"}]',
    '[{"word":42,"definition":"x"}]',
    '[{"suggestion":"their","definition":"x"}]',
  ]) {
    assert.throws(() => parseSuggestions(input), /no valid suggestions/)
  }
})

for (const mode of ['file', 'stdout', 'blank-file']) {
  test(`runs once, reads ${mode} output, and removes temporary files`, async () => {
    let directory
    let calls = 0
    const { runShortcut } = await loadShortcut(
      async (executable, args, options) => {
        calls++
        assert.equal(executable, '/usr/bin/shortcuts')
        assert.equal(args[1], 'spelling with spaces')

        const input = args[args.indexOf('--input-path') + 1]
        const output = args[args.indexOf('--output-path') + 1]
        directory = path.dirname(input)

        assert.equal(await fs.readFile(input, 'utf8'), 'their')
        assert.equal((await fs.stat(input)).mode & 0o777, 0o600)
        assert.equal(options.timeout, 120_000)
        assert.equal(options.maxBuffer, 1024 * 1024)

        if (mode !== 'stdout') {
          await fs.writeFile(
            output,
            mode === 'file' ? json([row('their')]) : '  ',
          )
        }

        return {
          stdout: mode === 'file' ? 'ignored stdout' : json([row('there')]),
          stderr: '',
        }
      },
    )

    const result = await runShortcut('their', 'spelling with spaces')

    assert.equal(result[0].suggestion, mode === 'file' ? 'their' : 'there')
    assert.equal(calls, 1)

    await assert.rejects(fs.stat(directory), { code: 'ENOENT' })
  })
}

for (const mode of ['process-error', 'timeout', 'empty', 'invalid', 'cancel']) {
  test(`cleans up after ${mode}`, async () => {
    let directory
    const controller = new AbortController()
    const expected = new Error(mode)
    const isExecutionFailure = mode === 'process-error' || mode === 'timeout'

    const { runShortcut } = await loadShortcut(
      async (_executable, args, options) => {
        directory = path.dirname(args[args.indexOf('--input-path') + 1])
        assert.equal(options.signal, controller.signal)

        if (isExecutionFailure) throw expected

        if (mode === 'cancel') {
          controller.abort()
          throw controller.signal.reason
        }

        return { stdout: mode === 'empty' ? '' : 'invalid JSON', stderr: '' }
      },
    )

    await assert.rejects(
      runShortcut('their', 'spelling', controller.signal),
      (error) => {
        if (isExecutionFailure) return error === expected
        if (mode === 'cancel') return error === controller.signal.reason

        return /no text|invalid JSON/.test(error.message)
      },
    )

    await assert.rejects(fs.stat(directory), { code: 'ENOENT' })
  })
}

test('does not start a subprocess when already cancelled', async () => {
  const { runShortcut } = await loadShortcut()
  const controller = new AbortController()
  controller.abort()

  await assert.rejects(runShortcut('their', 'spelling', controller.signal), {
    name: 'AbortError',
  })
})
