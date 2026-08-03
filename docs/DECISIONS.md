# 架構決策

## Phase 0

- 使用 Next.js App Router 與嚴格 TypeScript，符合 `codex.md` 的既定架構。
- 使用 npm 與 `package-lock.json` 固定 dependency，Node.js 版本固定為 `.nvmrc` 中的 `24.18.1`。
- 空殼介面使用 plain CSS，不提前加入 UI framework 或 Tailwind。
- 單元測試使用 Vitest；Playwright 留到 Phase 4。
- Phase 0 的受保護頁面僅為 placeholder，登入與權限保護留到 Phase 1。
