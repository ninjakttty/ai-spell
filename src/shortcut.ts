import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

export type Suggestion = {
  suggestion: string
  definition: string
}

const execute = promisify(execFile)

export const parseSuggestions = (raw: string): Suggestion[] => {
  const text = raw
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch (cause) {
    throw new Error(
      'The Shortcut returned invalid JSON. Ask it to return an array of word and definition objects.',
      { cause },
    )
  }

  const response = parsed
  const hasSuggestionsWrapper =
    response !== null &&
    typeof response === 'object' &&
    'suggestions' in response &&
    !Array.isArray(response)
  const rows = hasSuggestionsWrapper ? response.suggestions : response

  if (!Array.isArray(rows))
    throw new Error(
      'The Shortcut response must contain an array of suggestions.',
    )

  const seen = new Set<string>()
  const results: Suggestion[] = []

  for (const row of rows) {
    const isValidRow =
      row !== null &&
      typeof row === 'object' &&
      typeof row.word === 'string' &&
      typeof row.definition === 'string'

    if (!isValidRow) continue

    const suggestion = row.word.trim()
    const definition = row.definition.trim()
    const key = suggestion.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ')

    const isUsableSuggestion =
      suggestion.length > 0 && definition.length > 0 && !seen.has(key)

    if (!isUsableSuggestion) continue

    seen.add(key)
    results.push({ suggestion, definition })

    if (results.length === 3) break
  }

  if (!results.length)
    throw new Error(
      'The Shortcut returned no valid suggestions with definitions.',
    )

  return results
}

export const runShortcut = async (
  text: string,
  shortcutName: string,
  signal?: AbortSignal,
) => {
  signal?.throwIfAborted()

  const directory = await mkdtemp(path.join(tmpdir(), 'ai-spell-'))

  try {
    // The Shortcut cannot return its response directly to the extension, so we read it from a file.
    // Input also uses a file to pass arbitrary text without command-line length or quoting constraints.
    const input = path.join(directory, 'input.txt')
    await writeFile(input, text, { encoding: 'utf8', mode: 0o600 })

    const output = path.join(directory, 'output.txt')
    const args = [
      'run',
      shortcutName,
      '--input-path',
      input,
      '--output-path',
      output,
      '--output-type',
      'public.plain-text',
    ]
    const options = {
      encoding: 'utf8' as const,
      timeout: 120_000,
      maxBuffer: 1024 * 1024,
      signal,
    }

    const { stdout } = await execute('/usr/bin/shortcuts', args, options)
    let raw = stdout

    try {
      const fileOutput = await readFile(output, 'utf8')
      if (fileOutput.trim()) raw = fileOutput
    } catch (error) {
      // A Shortcut may return stdout without creating the requested output file.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }

    if (!raw.trim())
      throw new Error(
        'The Shortcut returned no text. Make sure its final action outputs the JSON response.',
      )

    return parseSuggestions(raw)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
