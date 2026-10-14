import {
  Action,
  ActionPanel,
  getPreferenceValues,
  List,
  showToast,
  Toast,
} from '@raycast/api'
import type { LaunchProps } from '@raycast/api'
import { useEffect, useState } from 'react'
import { runShortcut } from './shortcut'
import type { Suggestion } from './shortcut'

export const Command = ({
  arguments: args,
}: LaunchProps<{ arguments: { text: string } }>) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [attempt, setAttempt] = useState(0)
  const { shortcutName: preferredShortcutName } = getPreferenceValues<{
    shortcutName?: string
  }>()
  const shortcutName = preferredShortcutName?.trim() || 'spelling'
  const text = args.text.trim()

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)
    setSuggestions([])
    const check = async () => {
      try {
        if (!text) throw new Error('Enter some text to spell-check.')
        const results = await runShortcut(text, shortcutName, controller.signal)
        if (!controller.signal.aborted) setSuggestions(results)
      } catch (cause) {
        if (controller.signal.aborted) return
        const message = cause instanceof Error ? cause.message : String(cause)
        setError(message)
        await showToast({
          style: Toast.Style.Failure,
          title: 'Could not check spelling',
          message,
        })
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void check()
    return () => controller.abort()
  }, [text, shortcutName, attempt])

  let emptyTitle = 'No matching suggestions'
  let emptyDescription = 'Try a different filter.'
  if (loading) {
    emptyTitle = 'Checking spelling…'
    emptyDescription = `Running ${shortcutName}`
  } else if (error) {
    emptyTitle = 'Could not check spelling'
    emptyDescription = error
  }

  const retry = (
    <Action
      title="Try Again"
      onAction={() => setAttempt((value) => value + 1)}
      shortcut={{ modifiers: ['cmd'], key: 'r' }}
    />
  )
  return (
    <List
      isLoading={loading}
      navigationTitle="Spelling Suggestions"
      searchBarPlaceholder="Filter suggestions…"
    >
      <List.EmptyView
        title={emptyTitle}
        description={emptyDescription}
        actions={!loading ? <ActionPanel>{retry}</ActionPanel> : undefined}
      />
      <List.Section
        title="Suggestions"
        subtitle={
          !loading && suggestions.length < 3
            ? `${suggestions.length} distinct suggestions returned`
            : undefined
        }
      >
        {suggestions.map(({ suggestion, definition }) => (
          <List.Item
            key={suggestion}
            title={suggestion}
            keywords={[definition]}
            subtitle={definition}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard
                  title="Copy Correction"
                  content={suggestion}
                />
                <Action.Paste
                  title="Paste Correction"
                  content={suggestion}
                  shortcut={{ modifiers: ['cmd'], key: 'return' }}
                />
                {retry}
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  )
}

// Raycast loads commands through their default export.
export default Command
