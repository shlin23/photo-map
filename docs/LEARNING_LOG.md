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

## Phase 2：照片上傳、EXIF與private thumbnail

本階段建立多檔上傳、內容驗證、EXIF抽取、原圖private storage、去metadata thumbnail與owner-only讀取API。

應理解的三個概念：

1. Browser傳來的檔名與MIME都不可信；server必須檢查限制、檔案signature並實際解碼。
2. Authentication只證明「是誰」，ownership query才證明「這張照片屬於他」。讀取thumbnail時兩者缺一不可。
3. 檔案系統與database是兩套狀態；任一後段步驟失敗，都必須清理本次已寫入的檔案，避免orphan data。

下一階段才會把有GPS的照片顯示在MapLibre地圖；真實iPhone HEIC／HEIF與GPS照片仍需人工驗收。

## Phase 3：Owner-only照片地圖

本階段建立安全map metadata API、MapLibre Client Component、OpenFreeMap style、marker popup與三種viewport策略。

應理解的三個概念：

1. 地圖API仍是隱私邊界：database query必須先用session user ID過濾，不能把所有GPS送到browser再過濾。
2. MapLibre需要browser DOM，因此放在Client Component；認證、ownership與資料縮減仍留在server。
3. 地圖定位使用`[longitude, latitude]`，與平常口語的「緯度、經度」順序相反。

下一階段才加入Playwright與390×844自動化回歸；真實OpenFreeMap網路、手機GPS照片與跨使用者隔離仍需browser人工驗收。
