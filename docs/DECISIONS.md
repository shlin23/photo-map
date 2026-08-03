# 架構決策

## Phase 0

- 使用 Next.js App Router 與嚴格 TypeScript，符合 `codex.md` 的既定架構。
- 使用 npm 與 `package-lock.json` 固定 dependency，Node.js 版本固定為 `.nvmrc` 中的 `24.18.1`。
- 空殼介面使用 plain CSS，不提前加入 UI framework 或 Tailwind。
- 單元測試使用 Vitest；Playwright 留到 Phase 4。
- Phase 0 的受保護頁面僅為 placeholder，登入與權限保護留到 Phase 1。

## Phase 1

- 使用 Auth.js Google Provider，僅採預設的 `openid email profile`，不要求 Gmail 或 Google Drive 權限。
- 使用 Prisma 7、官方 `better-sqlite3` adapter 與本機 SQLite，session strategy 明確設為 database。
- `Session.user.id` 對應資料庫 User ID，作為後續所有 Photo ownership query 的安全邊界。
- `/dashboard`、`/upload`、`/map` 放在共用 `(protected)` route group，由 server layout 驗證 session；`/` 與 Auth.js callback 保持公開。
- 登入與登出採 server action，不加入 client-side SessionProvider。
