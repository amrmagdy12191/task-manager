<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git workflow

- Use one local branch per product phase in `PLAN.md`, following the branch map in README.md.
- The user requires explicit approval before pushing any branch to GitHub. Keep work local
  until approval covering the intended branch or branches is given. Do not interpret local
  implementation, branch creation, or commit requests as permission to push.
- Before requesting push approval, present the destination repository, branch names,
  commits/changes to publish, and relevant validation results.
- Preserve existing staged and unstaged changes when switching branches. Never reset or
  overwrite phase branches to align their histories without the user's instruction.
