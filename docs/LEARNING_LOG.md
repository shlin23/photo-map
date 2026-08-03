# 學習紀錄

## Phase 0：可啟動、可測試的空殼

本階段建立四個 App Router 頁面、mobile navigation，以及 lint、typecheck、test、build 的品質檢查入口。

應理解的三個概念：

1. `package.json` scripts 為開發與驗證提供一致的命令入口。
2. `src/app/<route>/page.tsx` 的資料夾結構會對應瀏覽器 URL。
3. `.gitignore` 可避免 secret、照片、資料庫與 generated files 被 Git 追蹤，但不能取代應用程式授權。

下一階段才會加入 Google 登入、session、SQLite 與受保護頁面。
