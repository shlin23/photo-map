# 學習紀錄

## Phase 0：可啟動、可測試的空殼

本階段建立四個 App Router 頁面、mobile navigation，以及 lint、typecheck、test、build 的品質檢查入口。

應理解的三個概念：

1. `package.json` scripts 為開發與驗證提供一致的命令入口。
2. `src/app/<route>/page.tsx` 的資料夾結構會對應瀏覽器 URL。
3. `.gitignore` 可避免 secret、照片、資料庫與 generated files 被 Git 追蹤，但不能取代應用程式授權。

下一階段才會加入 Google 登入、session、SQLite 與受保護頁面。

## Phase 1：Google 登入與 database session

本階段建立 Auth.js、Prisma SQLite schema、Google 登入／登出，以及三個受保護頁面的共用 server-side guard。

應理解的三個概念：

1. OAuth client secret 只放在 server 的 `.env.local`，browser 與 chat 都不應取得。
2. Browser 保存 HttpOnly session token；server 再用它向 SQLite 查詢 Session 與 User。
3. 隱藏連結不是授權。受保護 layout 必須在 server render 前檢查 `session.user.id`。

Google Cloud Console、真實 credential 與 consent 畫面由學習者親自操作；Phase 2 才開始照片上傳。
