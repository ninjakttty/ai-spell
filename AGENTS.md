# Repository instructions

These instructions apply throughout this repository unless a more specific `AGENTS.md` provides different guidance. Keep this file at the project root when adopting it.

AI Spell is intentionally a small Raycast utility. Preserve the Raycast → macOS Shortcuts → Apple Intelligence integration and the existing functionality. Do not replace Shortcuts with a direct model API.

## Follow the project

- Follow established project conventions, architecture, formatting, and tooling. They take precedence over the default preferences below.
- Read relevant project instructions and nearby code before making changes.
- Use the project's existing package manager, dependencies, and validation commands.
- Stay framework-agnostic: do not introduce a framework, library, or architectural pattern without a concrete need.

## Formatting and code style

- In JavaScript and TypeScript, omit semicolons and use single quotes for strings. Use template literals when interpolation or multiline content warrants them.
- Double quotes in JSX and HTML.
- Use 2-space indentation by default.
- Trailing commas wherever supported.
- Prefer arrow functions in JavaScript and TypeScript when they fit the existing code and do not change required behavior, such as `this` binding or hoisting.
- Put one blank line between adjacent function declarations, function expressions assigned to variables, and class methods.
- Put one blank line between distinct logical blocks inside a function, such as input validation, preparation, the main operation, and the return value.
- Do not insert blank lines between tightly related statements or add multiple consecutive blank lines.
- Use clear, descriptive names and follow the naming conventions of the surrounding code.
- Respect the repository's Prettier and ESLint configurations. Update them when necessary to maintain these conventions. Let the configured formatter and linter resolve formatting conflicts. Do not reformat unrelated code.
- Do not manually edit generated `raycast-env.d.ts` or format generated files and assets excluded by `.prettierignore`.

## JavaScript and TypeScript

- Prefer `const`; use `let` only when reassignment is required.
- Prefer destructuring, but avoid excessively deep destructuring.
- Use optional chaining and nullish coalescing where appropriate. Preserve intentional fallbacks for empty strings, such as the Shortcut-name preference.
- Prefer `async/await` over promise chains.
- Prefer array methods over explicit loops when they improve readability. Keep loops when early exit or stateful validation is clearer.
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

## Implementation

- Prefer guard clauses and early returns to deeply nested conditionals.
- Never use a bare `return`. Return an explicit value appropriate to the function's contract, such as `null`, `false`, or `undefined`.
- Omit curly braces for single-statement conditional bodies. Keep simple guard clauses on one line, for example `if (!isValidRow) return null`. Use braces for bodies with multiple statements.
- Extract compound or multiline conditions into descriptively named boolean variables so `if` statements stay simple. For example, compute `isValidRow` from the row checks, then use `if (!isValidRow)` as the guard clause. Keep straightforward single checks inline.
- Keep functions focused on a single responsibility and control flow easy to follow.
- Choose the simplest implementation that meets the requirements. Avoid speculative abstractions and premature optimization.
- Reuse existing helpers and patterns before adding new ones.
- Handle errors explicitly where they can be handled meaningfully and preserve useful diagnostic information.
- Never silently swallow unexpected errors. Treat cancellation and an absent optional output file as explicit, documented cases.
- Prefer established dependencies over reinventing functionality. Add dependencies only when their benefit justifies the cost and existing tools cannot reasonably solve the problem.
- Add comments to explain intent, constraints, or non-obvious decisions, rather than restating the code.
- Do not log submitted text or model responses.
- Do not claim that model output is guaranteed to follow the JSON schema or that the entire workflow is private or on-device without verification.

## Tests and validation

- Add or update meaningful tests for new behavior and bug fixes, using the project's existing test tools and conventions.
- For bug fixes, add a regression test when practical.
- Test observable behavior and relevant edge cases. Avoid tests that merely mirror the implementation.
- Do not add tests solely for formatting, documentation, or other changes with no executable behavior.
- Follow the existing Node test-runner conventions in `tests/shortcut.test.cjs`. Mock Shortcut execution in automated tests.
- Run relevant tests and required project checks, including linting or type checking where applicable. The available validation commands are:

  ```sh
  npm run format:check
  npm run lint
  npm run typecheck
  npm test
  npm run build
  ```

- Use `npm run format` to apply formatting when needed.
- The build writes to Raycast's local extensions directory and may require additional filesystem permission.
- If a check fails, determine whether the failure comes from the change or is pre-existing. Fix failures introduced by the change.
- If validation cannot run, state what was not checked and why. Never claim an unperformed check passed.
- Report anything that cannot be verified automatically, including interactive import or copy/paste behavior.
- Update documentation when the change affects documented behavior or usage.

## Scope and changes

- Make focused, incremental changes that directly address the request.
- Do not introduce unnecessary architectural changes or unrelated features.
- Preserve public APIs and existing behavior outside the requested scope.
- Avoid unrelated cleanup, broad refactoring, file renames, and dependency upgrades.
- Preserve the user's existing work. Do not overwrite or revert unrelated changes.
- Resolve routine implementation details using project context. Ask for clarification when an ambiguity materially affects the outcome.
- Respect existing conventions where changing them would introduce unnecessary disruption.
- Remove debugging statements and temporary code.
- Do not invent details about how Codex was used during original development. Document only established or user-confirmed uses.
- Do not commit, push, or publish unless the user explicitly requests it.

## Communication

- Keep progress updates concise and useful. Share meaningful findings, blockers, and decisions.
- In the final response, briefly explain what changed and how it was validated.
- Mention significant decisions, trade-offs, remaining limitations, or required follow-up when relevant.
- Avoid lengthy walkthroughs or implementation detail unless requested or needed to understand the result.
