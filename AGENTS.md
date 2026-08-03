# Codex repository instructions

## Source of truth

- Before planning or editing, read `codex.md`.
- Treat `codex.md` as the product, architecture, security, and acceptance-test specification.
- If existing code conflicts with `codex.md`, stop and explain the conflict before changing architecture or data.
- Keep this file short. Put detailed product decisions in `codex.md`.

## Teaching mode

The developer is learning. Help them learn just in time while still producing working software.

For every implementation task:

1. Inspect the relevant files first.
2. Explain the goal and the 1–3 concepts needed for this step in Traditional Chinese.
3. Propose a small plan of 3–6 steps.
4. Implement only the requested phase or vertical slice.
5. Run the relevant checks.
6. Summarize:
   - what changed and why;
   - the important files and request/data flow;
   - commands the developer should run;
   - verification results and remaining limitations;
   - two short questions the developer should be able to answer.

Do not generate the entire application in one task unless the user explicitly requests it.
Do not hide errors. Explain the likely cause, the evidence, and the smallest next diagnostic.

For beginner-facing instructions:

- Label every command block with the exact execution environment: Administrator PowerShell, ordinary PowerShell, Ubuntu/WSL, VS Code WSL terminal, or Codex sidebar.
- Explain why the command is needed, the expected success signal, and the first safe troubleshooting check.
- Explain placeholders such as `<WindowsUser>` and state that angle brackets are not typed literally.
- Never assume the learner knows what the current working directory is; use `pwd` and state the expected project path when location matters.
- Introduce at most 1–3 new concepts per vertical slice, then ask the learner to explain the data flow or safety boundary in their own words.
- Do not treat copied commands as evidence of learning; require an observable result, test output, or short explanation.

## Engineering rules

- Use TypeScript with strict type checking. Avoid `any` unless documented and unavoidable.
- Prefer simple, readable code over premature abstraction.
- Keep secrets only in `.env.local`; maintain `.env.example` with placeholder names.
- Never commit credentials, uploaded photos, generated thumbnails, database files, or production data.
- Do not add a runtime dependency outside the approved stack in `codex.md` without explaining why and obtaining approval.
- Do not change the framework, authentication method, database, storage model, or map provider without approval.
- Never use destructive Git commands. Do not commit or push unless explicitly asked.
- Keep user-facing text in Traditional Chinese.
- Add comments only where the reason is not obvious from the code.

## Required verification

After a meaningful code change, run the applicable commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

If a command does not exist during Phase 0, create the script. If a check cannot run, report the exact reason rather than claiming success.

## Definition of done

A task is complete only when:

- the requested acceptance criteria in `codex.md` pass;
- authorization and ownership checks cover every affected photo operation;
- lint, type checking, relevant tests, and build pass;
- documentation and `.env.example` reflect configuration changes;
- no secret or uploaded user file is tracked by Git.

## Code review rules

- Flag any route that reads or serves a photo without checking the authenticated user's ownership.
- Flag path construction that uses an original filename or other untrusted input.
- Flag uploads stored under `public/` or any path that bypasses authorization.
- Flag unrestricted upload size, count, file type, or image dimensions.
- Flag exposure of exact GPS coordinates outside the owning user's authenticated session.
- Flag production deployment to ephemeral/serverless storage while the app still relies on a local upload folder.
