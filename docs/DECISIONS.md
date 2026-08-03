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

## Phase 2

- 原圖與thumbnail保存在`public/`之外，資料庫只存相對路徑；stored filename由server產生UUID，不使用原始檔名組路徑。
- 上傳route在server重新驗證數量、大小、magic bytes及Sharp解碼；browser的`accept`與MIME只作使用體驗提示。
- EXIF由exifr讀取；沒有有效GPS仍保存照片。Thumbnail由Sharp自動旋轉並輸出寬度最多360px、高度等比例縮放的JPEG，且不複製metadata。
- Thumbnail僅透過authenticated owner-only API提供；查詢同時使用Photo ID與session user ID，避免洩漏他人照片是否存在。
- 每張照片獨立處理並回傳結果；database寫入失敗時清除該次檔案，避免orphan storage。

## Phase 3

- 地圖使用MapLibre與OpenFreeMap；style URL由`NEXT_PUBLIC_MAP_STYLE_URL`提供，未設定時使用相同的公開OpenFreeMap預設值。
- MapLibre精確鎖定為`5.12.0`；6.1.0的ESM worker URL在目前Next/Turbopack組合中解析錯誤，導致TileJSON載入後沒有vector tile請求。
- Browser透過authenticated `GET /api/photos`取得安全DTO；Prisma query同時限制session user ID與完整GPS，response不包含任何內部storage欄位。
- MapLibre留在Client Component，protected page及API授權仍由server負責；地圖座標固定使用`[longitude, latitude]`。
- 空資料顯示Upload入口、單點zoom 14、多點fit bounds；marker popup只透過owner-only API讀取thumbnail。
- 不提前加入clustering或Playwright，並保留OpenFreeMap／OpenStreetMap attribution。
