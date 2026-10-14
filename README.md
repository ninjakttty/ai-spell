# AI Spell

Spell-check text in Raycast using the macOS Shortcut `spelling` and Apple's on-device model.

## Use

Run **AI Spell**, enter text in its argument, and select a suggestion. **Enter** copies the correction; **Cmd+Enter** pastes it into the active app. **Cmd+R** retries. Definitions appear inline as subtitles beside each suggestion.

The Shortcut must accept text input and return plain text containing exactly three objects:

```json
[
  { "word": "their", "definition": "Belonging to them." },
  { "word": "there", "definition": "In or at that place." },
  { "word": "they’re", "definition": "A contraction of they are." }
]
```

The extension accepts a JSON array or an object with a `suggestions` array, including Markdown-fenced JSON. Invalid entries and duplicate suggestions are skipped, with at most three distinct results displayed. Fewer than three valid results are shown honestly rather than padded. Invalid or empty responses show an error and a retry action.

Change the Shortcut name in the command's **Siri Shortcut Name** preference if needed.

## Shortcut prompt

The `spelling` Shortcut uses this prompt:

```text
Provide spelling suggestions for the following Shortcut Input:

Return exactly 3 suggestions as valid JSON using this schema:

[
  {
    "word": "suggested spelling",
    "definition": "brief definition"
  }
]

Return only the JSON array. Do not include Markdown, code fences, explanations, or any other text.

Rank suggestions from most likely to least likely.
```

The extension accepts `word` from this prompt and also supports the older `suggestion` field. If both fields are strings, `word` takes precedence. Suggestions retain the order returned by the Shortcut.

## Implementation

Input is written to a private temporary file for `shortcuts run spelling --input-path …`. Stdout is preferred. If it is empty, the Shortcut is run again with a temporary output path and plain-text output type. Each invocation has a two-minute timeout. Temporary files are removed in `finally`, including on errors or cancellation. The command does not log submitted text or model responses.

## Development

```sh
npm install
npm run typecheck
npm run build
npm run dev
```

`typecheck` validates TypeScript. `build` bundles the extension for Raycast, and `dev` starts development with live rebuilding. No separate linter is configured. Open the AI Spell command in Raycast to verify copy/paste interaction.

The extension only needs Node.js and the macOS Shortcut; no Python environment or downloaded model is required. The editable icon source and its PNG live in `assets/`.
