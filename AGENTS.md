# Repository instructions

AI Spell is intentionally a small Raycast utility. Preserve the Raycast → macOS Shortcuts → Apple Intelligence integration and the existing functionality. Do not replace Shortcuts with a direct model API.

## Formatting

- No semicolons.
- Single quotes in JavaScript and TypeScript.
- Double quotes in JSX and HTML.
- Two-space indentation.
- Trailing commas wherever supported.
- Use blank lines to separate logical blocks of code.
- Respect the repository's Prettier and ESLint configurations. Update them when necessary to maintain these conventions.
- Do not manually edit generated `raycast-env.d.ts` or format generated files and assets excluded by `.prettierignore`.

## JavaScript and TypeScript

- Prefer arrow functions unless a regular function is semantically necessary.
- Prefer `const`; use `let` only when reassignment is required.
- Prefer destructuring, but avoid excessively deep destructuring.
- Use optional chaining and nullish coalescing where appropriate. Preserve intentional fallbacks for empty strings, such as the Shortcut-name preference.
- Prefer `async/await` over promise chains.
- Prefer array methods over explicit loops when they improve readability. Keep loops when early exit or stateful validation is clearer.
- Use guard clauses and early returns instead of deeply nested conditionals.
- Avoid complicated nested ternaries.
- Use TypeScript pragmatically. Prefer inference over unnecessary explicit annotations.
- Avoid overly complex generic types and unnecessary type abstractions.

## Naming and organization

- Use lowercase kebab-case filenames.
- Use PascalCase for React components and define them with arrow functions.
- Prefer named exports. Keep the default export required by Raycast command entry points.
- Prefer absolute imports through existing path aliases. There are currently no path aliases; keep relative imports rather than introducing aliases solely for style.
- Organize code pragmatically, using feature directories when appropriate.
- Avoid unnecessary barrel files and premature abstractions.

## React

- Prefer local component state unless shared state is genuinely necessary.
- Avoid unnecessary `useEffect` usage. Preserve the effect that manages asynchronous Shortcut execution and cancellation unless an equivalent lifecycle is provided.
- Extract small components when doing so improves readability or reuse.
- Prefer TanStack Query for server state where applicable. This extension currently has no server state that requires it.
- Prefer Tailwind CSS for web interfaces, keeping utility classes inline unless reuse justifies extraction. This project uses Raycast native UI components; do not add Tailwind for them.
- Maintain accessibility and keyboard actions.

## Code quality

- Keep functions focused and readable.
- Avoid premature abstraction and remove unnecessary complexity and duplication.
- Write comments explaining why, not narrating what.
- Handle errors defensively and preserve useful diagnostic information.
- Never silently swallow unexpected errors. Treat cancellation and an absent optional output file as explicit, documented cases.
- Prefer established dependencies over reinventing functionality, but do not introduce dependencies unnecessarily.
- Do not log submitted text or model responses.
- Do not claim that model output is guaranteed to follow the JSON schema or that the entire workflow is private or on-device without verification.

## Testing and validation

- Preserve existing behavior.
- Add or update tests when behavior changes.
- Focus tests on observable behavior and meaningful edge cases.
- Follow the existing Node test-runner conventions in `tests/shortcut.test.cjs`. Mock Shortcut execution in automated tests.
- Run the relevant validation commands before finishing:

  ```sh
  npm run format:check
  npm run lint
  npm run typecheck
  npm test
  npm run build
  ```

- Use `npm run format` to apply formatting when needed.
- The build writes to Raycast's local extensions directory and may require additional filesystem permission.
- Report failed checks and anything that cannot be verified automatically, including interactive import or copy/paste behavior.

## Scope and delivery

- Make focused, incremental changes.
- Do not introduce unnecessary architectural changes or unrelated features.
- Preserve public APIs and existing functionality.
- Respect existing conventions where changing them would introduce unnecessary disruption.
- Update documentation when behavior or APIs change.
- Remove debugging statements and temporary code.
- Do not invent details about how Codex was used during original development. Document only established or user-confirmed uses.
- Do not commit, push, or publish unless the user explicitly requests it.
- Finish with a concise summary of changes, significant decisions or trade-offs, and validation results.
