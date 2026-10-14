import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

export type Suggestion = { suggestion: string; definition: string }
const execute = promisify(execFile)

export function parseSuggestions(raw: string): Suggestion[] {
  const text = raw.trim().replace(/^\uFEFF/, '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('The Shortcut returned invalid JSON. Ask it to return an array of word and definition objects.')
  }
  const rows = Array.isArray(parsed) ? parsed :
    parsed && typeof parsed === 'object' && 'suggestions' in parsed ? parsed.suggestions : null
  if (!Array.isArray(rows)) throw new Error('The Shortcut response must contain an array of suggestions.')
  const seen = new Set<string>()
  const results: Suggestion[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object' || typeof row.definition !== 'string') continue
    const value = typeof row.word === 'string' ? row.word : row.suggestion
    if (typeof value !== 'string') continue
    const suggestion = value.trim()
    const definition = row.definition.trim()
    const key = suggestion.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ')
    if (!suggestion || !definition || seen.has(key)) continue
    seen.add(key)
    results.push({ suggestion, definition })
    if (results.length === 3) break
  }
  if (!results.length) throw new Error('The Shortcut returned no valid suggestions with definitions.')
  return results
}

export async function runShortcut(text: string, shortcutName: string, signal?: AbortSignal): Promise<Suggestion[]> {
  signal?.throwIfAborted()
  const directory = await mkdtemp(path.join(tmpdir(), 'ai-spell-'))
  try {
    const input = path.join(directory, 'input.txt')
    await writeFile(input, text, { encoding: 'utf8', mode: 0o600 })
    const output = path.join(directory, 'output.txt')
    const args = ['run', shortcutName, '--input-path', input, '--output-path', output, '--output-type', 'public.plain-text']
    const options = { encoding: 'utf8' as const, timeout: 120_000, maxBuffer: 1024 * 1024, signal }
    const { stdout } = await execute('/usr/bin/shortcuts', args, options)
    let raw = stdout
    try {
      const fileOutput = await readFile(output, 'utf8')
      if (fileOutput.trim()) raw = fileOutput
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    if (!raw.trim()) throw new Error('The Shortcut returned no text. Make sure its final action outputs the JSON response.')
    return parseSuggestions(raw)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
