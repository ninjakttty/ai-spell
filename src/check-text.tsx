import { Action, ActionPanel, getPreferenceValues, LaunchProps, List, showToast, Toast } from '@raycast/api'
import { useEffect, useState } from 'react'
import { runShortcut, Suggestion } from './shortcut'

export default function Command({ arguments: args }: LaunchProps<{ arguments: { text: string } }>) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [attempt, setAttempt] = useState(0)
  const shortcutName = getPreferenceValues<{ shortcutName?: string }>().shortcutName?.trim() || 'spelling'
  const text = args.text.trim()

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)
    setSuggestions([])
    async function check() {
      try {
        if (!text) throw new Error('Enter some text to spell-check.')
        const results = await runShortcut(text, shortcutName, controller.signal)
        if (!controller.signal.aborted) setSuggestions(results)
      } catch (cause) {
        if (controller.signal.aborted) return
        const message = cause instanceof Error ? cause.message : String(cause)
        setError(message)
        await showToast({ style: Toast.Style.Failure, title: 'Could not check spelling', message })
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void check()
    return () => controller.abort()
  }, [text, shortcutName, attempt])

  const retry = <Action title="Try Again" onAction={() => setAttempt((value) => value + 1)} shortcut={{ modifiers: ['cmd'], key: 'r' }} />
  return (
    <List isLoading={loading} navigationTitle="Spelling Suggestions" searchBarPlaceholder="Filter suggestions…">
      <List.EmptyView title={loading ? 'Checking spelling…' : 'Could not check spelling'} description={error || `Running ${shortcutName}`} actions={!loading ? <ActionPanel>{retry}</ActionPanel> : undefined} />
      <List.Section title="Suggestions" subtitle={!loading && suggestions.length < 3 ? `${suggestions.length} distinct suggestions returned` : undefined}>
        {suggestions.map((item) => (
          <List.Item
            key={item.suggestion}
            title={item.suggestion}
            keywords={[item.definition]}
            subtitle={item.definition}
            actions={<ActionPanel>
              <Action.CopyToClipboard title="Copy Correction" content={item.suggestion} />
              <Action.Paste title="Paste Correction" content={item.suggestion} shortcut={{ modifiers: ['cmd'], key: 'return' }} />
              {retry}
            </ActionPanel>}
          />
        ))}
      </List.Section>
    </List>
  )
}
