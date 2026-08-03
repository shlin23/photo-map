# Photo Map：Codex軟體專案規格

> 狀態：MVP規格  
> 目標平台：iPhone Safari為優先的responsive web app  
> 開發環境：Windows 11 + VS Code；建議以WSL2執行Node.js與Codex  
> 文件用途：Codex與Claude Code共用的產品與工程source of truth

## 1. 專案目標

建立一個mobile-first照片地圖web app。使用者以Google帳號登入後，可以一次上傳一張或多張照片；server保存原始照片、抽取EXIF中的GPS座標，再將屬於該使用者且具有GPS的照片顯示在互動式地圖上。

本專案同時是教學專案。AI coding agent應採「用到再教」的方式，每次只完成一個可執行、可驗證的小增量，並讓開發者理解資料流、驗證方式與重要安全邊界。

## 2. MVP範圍

### 必須完成

1. 使用Google帳號登入與登出。
2. 未登入者無法開啟Upload、Map或照片檔案。
3. 一次上傳1–10張照片，每張上限15 MiB。
4. Server將原始檔案存入本機持久化資料夾，不存入Git。
5. Server抽取EXIF的latitude、longitude與拍攝時間。
6. 無GPS的照片仍可保存，並在Upload結果中清楚標為「無GPS資訊」。
7. Map只顯示目前登入者自己的地理標記照片。
8. 點選marker可看到thumbnail、拍攝時間與座標。
9. 地圖不得使用Google Maps或需要信用卡／用量計費的圖磚服務。
10. iPhone直向畫面寬度390px時，登入、上傳與地圖均可正常操作。

### 暫不完成

- 原生iOS App或App Store上架。
- 讀取Gmail信件或Google Drive；Google帳號只用於登入。
- 公開分享地圖、多人協作、社群功能。
- 照片編輯、相簿、標籤、路線軌跡。
- 背景上傳、離線上傳、完整offline PWA。
- 雲端object storage、CDN、付費地圖服務。
- AI影像辨識。

## 3. 已決定的技術架構

| 層級 | 技術 | 決策理由 |
| --- | --- | --- |
| Full-stack framework | Next.js App Router + TypeScript | 前後端同一專案，適合小型教學MVP |
| Authentication | Auth.js的Google provider | 使用成熟OAuth/OIDC library，不自行實作登入協定 |
| Database | Prisma + SQLite | 本機與單機部署容易理解；保留未來換PostgreSQL的可能 |
| File storage | `storage/uploads/<userId>/` | 符合server folder需求；必須在`public/`之外 |
| EXIF | `exifr` | Server端抽取GPS與拍攝時間 |
| Thumbnail | `sharp` | 產生不含EXIF的JPEG thumbnail，避免原始GPS metadata外洩 |
| Map renderer | MapLibre GL JS | 開源、可顯示marker與popup |
| Map tiles/style | OpenFreeMap public instance | 不需帳號或API key；style URL使用`https://tiles.openfreemap.org/styles/liberty` |
| Unit tests | Vitest | 測試GPS轉換、驗證與storage service |
| End-to-end tests | Playwright（Phase 4再加入） | 驗證iPhone viewport與主要操作 |

初始化專案時使用當下latest stable版本，建立並提交lockfile；後續不可在同一個feature中順便做major upgrade。

### 重要部署限制

本MVP依賴本機SQLite與server folder，因此目標是self-hosted Node.js server或具有persistent volume的Docker環境。不可直接部署到會清除local filesystem的serverless平台，除非先另開需求將資料庫與照片改成持久化外部服務。

## 4. 使用者流程

### 4.1 登入

1. 未登入者進入首頁。
2. 點選「使用Google帳號登入」。
3. 完成Google OAuth/OIDC。
4. 登入成功後進入Dashboard。
5. 應用程式只要求登入所需的`openid email profile`，不要求Gmail內容權限。

### 4.2 上傳

1. 使用者在Upload頁選擇1–10張照片。
2. Client先顯示檔名、數量與明確限制，但server仍須重新驗證。
3. Server逐檔驗證、產生不可猜測的stored filename、保存原圖。
4. Server抽取EXIF GPS與拍攝時間，並產生移除metadata的JPEG thumbnail。
5. Database保存metadata與相對路徑。
6. 回傳每一張照片的成功／失敗／無GPS結果；部分失敗不得讓其他成功檔案消失。

### 4.3 地圖

1. 使用者開啟Map頁。
2. Server只回傳此登入者、且具有有效GPS的照片metadata。
3. 前端以MapLibre顯示marker。
4. 地圖初始範圍自動fit到所有marker；若只有一點，使用合理zoom；若沒有點，顯示說明與Upload連結。
5. 點選marker顯示受保護的thumbnail、拍攝時間與座標。

## 5. 頁面與UX

| Route | 權限 | 內容 |
| --- | --- | --- |
| `/` | 公開 | 專案說明、登入按鈕；已登入者可進Dashboard |
| `/dashboard` | 登入 | Upload與Map兩張主要操作卡片、照片數量摘要 |
| `/upload` | 登入 | 多檔選擇、限制說明、進度／結果列表 |
| `/map` | 登入 | 全螢幕優先的地圖、marker、popup、空狀態 |
| `/api/photos` | 登入 | 上傳或取得目前使用者照片metadata |
| `/api/photos/:id/thumbnail` | 登入且為擁有者 | 回傳thumbnail |

UX規則：

- Mobile-first；先驗證390×844 viewport，再驗證desktop。
- 主要按鈕touch target至少44×44 CSS pixels。
- 上傳中不可重複送出。
- 每個錯誤提供下一步，例如「這張照片沒有GPS，可在iPhone相機的定位服務開啟後重新拍攝」。
- 不以顏色作為唯一狀態提示。
- 地圖必須顯示資料來源attribution。

## 6. 資料模型

Auth.js adapter需要的User、Account、Session等資料表由官方整合方式建立。額外建立：

```text
Photo
- id: string, UUID
- userId: string, foreign key -> User
- originalName: string
- storedName: string, unique
- mimeType: string
- sizeBytes: integer
- relativePath: string
- thumbnailPath: string | null
- latitude: float | null
- longitude: float | null
- altitude: float | null
- takenAt: datetime | null
- createdAt: datetime
```

規則：

- Database只能保存相對路徑，不保存依賴單一機器的absolute path。
- `originalName`只供顯示，不可參與filesystem path。
- 有效latitude範圍為-90到90；longitude範圍為-180到180。
- 所有Photo query必須包含目前登入者的`userId`條件。

## 7. Storage規則

```text
storage/
├── uploads/
│   └── <userId>/
│       └── <uuid>.<validated-extension>
└── thumbnails/
    └── <userId>/
        └── <uuid>.jpg
```

- `storage/`、SQLite檔案、`.env.local`必須加入`.gitignore`。
- 建立路徑時只可使用server產生且已驗證的user ID、UUID與extension。
- 儲存採先寫temporary file、驗證／處理成功後再atomic rename。
- 若database寫入失敗，清除本次建立的檔案，避免orphan files。
- 若thumbnail失敗，可保存原圖並回報部分成功，但不得把原圖直接公開。

## 8. Upload與影像安全

- Client提供的MIME、extension與filename一律不可信。
- 同時檢查允許的MIME、magic bytes／實際影像解碼結果與檔案大小。
- MVP允許JPEG與HEIC/HEIF；若目前runtime無法安全解碼某HEIC，該檔應個別失敗並顯示原因，不可讓整批500。
- 拒絕SVG與非影像檔。
- 使用`sharp`預設的input safety limits，不可設定`unlimited: true`。
- thumbnail寬度上限為360px，高度依原始比例縮放，輸出JPEG，且不複製原始EXIF metadata。
- 限制單次最多10檔、每檔15 MiB，並保留日後加rate limit的位置。
- API與log不可輸出OAuth token、secret、完整session或不必要的GPS資料。

## 9. Authentication與隱私

- Google client ID、client secret、Auth.js secret只放在`.env.local`。
- `.env.example`只列變數名稱與無效範例，不得有真實secret。
- 開發callback URL預期為`http://localhost:3000/api/auth/callback/google`；正式環境使用HTTPS domain的對應URL。
- 每個photo metadata與thumbnail request都必須先驗證session，再驗證`photo.userId === session.user.id`。
- Server response不可包含`relativePath`、`storedName`或其他內部檔案位置。
- Map預設只顯示登入者本人資料，不提供公開URL。

## 10. 建議專案結構

```text
.
├── AGENTS.md
├── CLAUDE.md
├── codex.md
├── .env.example
├── .gitignore
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── dashboard/
│   │   ├── map/
│   │   └── upload/
│   ├── components/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── exif/
│   │   └── storage/
│   └── types/
├── storage/
├── tests/
└── docs/
    ├── DECISIONS.md
    └── LEARNING_LOG.md
```

模組邊界：

- Route handler只負責HTTP、session與輸入輸出。
- `src/lib/storage`負責安全路徑、寫檔、刪檔與thumbnail。
- `src/lib/exif`負責解析與座標正規化。
- Database access集中在可測試的service／repository函式。
- React component不可直接讀取filesystem或database。

## 11. 開發階段與驗收條件

### Phase 0：開發環境與空殼

工作：

- 初始化Git與Next.js TypeScript專案。
- 建立`.nvmrc`並提交`package-lock.json`，讓本機與CI使用一致的Node.js／dependency來源。
- 加入本規格指定的lint、typecheck、test、build scripts。
- 建立頁面空殼、mobile navigation、`.env.example`、`.gitignore`。
- 建立`docs/DECISIONS.md`與`docs/LEARNING_LOG.md`。

驗收：

- `npm run dev`可啟動。
- `/`、`/dashboard`、`/upload`、`/map`可顯示placeholder。
- lint、typecheck、test、build全部通過。
- Git未追蹤任何secret、database或`storage/`內容。

### Phase 0B：GitHub與Continuous Integration

工作：

- 將本機Git repository建立為private GitHub repository。
- 在`.github/workflows/ci.yml`建立最小CI。
- CI使用`.nvmrc`與`npm ci`，依序執行lint、typecheck、unit test與build。
- workflow只給`contents: read`權限，不進行部署，也不使用production credential。

驗收：

- push與針對`main`的pull request都會觸發CI。
- GitHub Actions的quality job在乾淨Ubuntu runner通過。
- repository不包含`.env.local`、OAuth secret、照片、thumbnail、SQLite或`node_modules`。
- 學習者能說明workflow、job、runner、step、CI與CD的差異。

### Phase 1：Google登入

工作：

- 依Auth.js官方Google provider方式完成登入。
- 建立SQLite schema與必要migration。
- 保護Dashboard、Upload與Map。

驗收：

- 未登入存取受保護頁面時會被導向登入。
- Google登入成功可看到email與登出按鈕。
- 登出後不可再開啟受保護頁面。
- 不要求Gmail讀取權限。

### Phase 2：多照片Upload與EXIF

工作：

- 完成multi-file upload與server-side validation。
- 安全保存原圖、抽取EXIF、產生thumbnail、寫入database。
- 顯示逐檔結果。

驗收：

- 1張與多張JPEG可上傳。
- 至少以一張含GPS與一張無GPS測試；結果正確。
- HEIC能處理時成功；runtime不支援時給個別、可理解錯誤。
- 假副檔名、超過大小、超過數量與非影像檔會被拒絕。
- 原始檔與thumbnail都不能透過猜測靜態URL取得。

### Phase 3：Map

工作：

- 取得目前使用者有GPS的Photo資料。
- 以MapLibre + OpenFreeMap顯示marker與popup。
- 完成fit bounds、單點與空狀態。

驗收：

- marker數量等於目前使用者具有有效GPS的照片數量。
- 點marker可看到正確thumbnail與拍攝時間。
- 使用者A無法讀取使用者B的metadata或thumbnail。
- 地圖顯示attribution，不需要Google Maps key或付費帳號。

### Phase 4：iPhone品質與回歸測試

工作：

- 加入Playwright主要流程與390×844 viewport。
- 補齊loading、error、empty state與accessibility。
- 建立web manifest與Apple touch icon；offline不是MVP要求。

驗收：

- iPhone viewport沒有水平捲動或無法點擊的控制項。
- Upload、Map與popup的主要操作可用鍵盤完成。
- 自動化測試涵蓋upload validation、GPS parse、ownership與map空狀態。
- lint、typecheck、test、build與主要e2e皆通過。

## 12. 測試資料與測試策略

建立不含私人資訊的fixtures：

- `gps-valid.jpg`：已知latitude與longitude。
- `no-gps.jpg`：沒有GPS block。
- `fake-image.jpg`：內容不是影像。
- `oversized`：由測試程式產生，不提交大型binary。

至少測試：

1. GPS有值、無值與超出範圍。
2. 不可信filename無法path traversal。
3. 每批數量與單檔大小限制。
4. Authenticated owner成功讀取thumbnail。
5. Anonymous與另一位user得到401/403或不洩漏存在性的404。
6. API response不含server內部路徑。

## 13. 環境變數

`.env.example`應至少包含：

```dotenv
AUTH_SECRET=replace-with-a-random-development-secret
AUTH_GOOGLE_ID=replace-with-google-oauth-client-id
AUTH_GOOGLE_SECRET=replace-with-google-oauth-client-secret
DATABASE_URL=file:./dev.db
UPLOAD_ROOT=./storage
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

Codex不得替使用者發明真實credential。需要Google Cloud Console設定時，停在明確步驟並請使用者自行建立與貼入本機`.env.local`；不要要求使用者把secret貼進chat。

## 14. Codex執行契約

### 開始一個phase前

Codex必須：

1. 讀取`AGENTS.md`與本文件。
2. 檢查目前repository狀態與已完成phase。
3. 列出本次目標、不做事項與驗收方式。
4. 若有會影響架構、資料模型或外部帳號的未決問題，先詢問。

### 實作中

- 一次完成一個vertical slice，例如「upload一張JPEG並保存metadata」，不要先鋪滿所有抽象層。
- 每個slice都應可啟動或測試。
- 先重現問題再修bug；修正後加最小regression test。
- 若官方API或套件行為可能已變動，先查官方文件，不可憑記憶猜參數。

### 結束時

回報格式：

```text
完成：
- ...

你應理解：
- ...

驗證：
- npm run ...：PASS/FAIL

尚未完成／風險：
- ...

下一個建議prompt：
- ...
```

## 15. 第一輪可直接交給Codex的prompts

### Prompt A：只規劃，不改檔

```text
/plan
請先閱讀AGENTS.md與codex.md，檢查目前資料夾狀態。
針對Phase 0提出可執行計畫，不要修改任何檔案。
請指出需要我決定的事項；若規格已經決定，就不要重問。
最後列出完成Phase 0時會執行的驗證命令。
```

### Prompt B：執行Phase 0

```text
請依已確認的計畫完成codex.md的Phase 0。
採教學模式，每完成一個小步驟就說明目的，但不中斷等待，除非需要credential、
新增規格外的runtime dependency，或遇到會改變架構的選擇。
完成後執行lint、typecheck、test、build並依AGENTS.md格式回報。
```

### Prompt C：執行Google登入

```text
/plan
閱讀AGENTS.md、codex.md與目前Phase 0程式碼，規劃Phase 1的Google登入。
先說明Google OAuth client要由我在Google Cloud Console設定的欄位、localhost callback URL，
以及哪些步驟Codex可以直接完成。此回合只規劃，不要要求我在chat貼secret。
```

### Prompt D：逐步完成功能

```text
請只完成codex.md Phase 2的第一個vertical slice：
登入者上傳一張JPEG，server安全保存檔案、抽取GPS、寫入database並顯示結果。
先不要做HEIC、多檔或Map。先讀現有程式與測試，完成後執行相關驗證並教我資料流。
```

## 16. 規格變更方式

任何需求變更先更新本文件的：

1. MVP範圍或非目標。
2. 架構決策。
3. 對應phase與驗收條件。
4. Security／privacy影響。

不要只在chat中口頭改需求而讓文件失真。若Codex重複犯同一錯誤，先做簡短retrospective，再把可重用且具體的規則更新到`AGENTS.md`。
