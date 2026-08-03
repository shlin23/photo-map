# AI Coding入門Case Study：從Windows 11到照片地圖專案

> Case study：Google登入、批次上傳iPhone照片、抽取EXIF GPS，並以免費地圖顯示照片位置  
> 適用對象：會基本電腦操作，但尚未熟悉Linux、Git、VS Code或CI/CD的初學者  
> 建議環境：Windows 11、WSL2 Ubuntu、VS Code、Codex、GitHub  
> 文件日期：2026-08-02

這不是「請AI一次生出整個網站」的示範。課程目標是讓學習者能夠自己描述需求、判讀AI的計畫、驗證程式、讀懂重要資料流，並在AI出錯時提供足以重現問題的資訊。

## 0. 完成這個case study後，學生應該會什麼

學生應能：

1. 說明Windows、WSL2、Ubuntu、VS Code與Codex各自的角色。
2. 在WSL2內建立專案，避免Windows與Linux各放一份程式。
3. 用`AGENTS.md`規定AI如何工作，用`codex.md`定義產品要做什麼。
4. 把大功能拆成可執行、可驗收的vertical slice。
5. 用Goal、Context、Constraints、Done when撰寫prompt。
6. 要求Codex先規劃，再實作、測試、review。
7. 看懂`git status`、`git diff`與基本commit，知道checkpoint的價值。
8. 將程式推到GitHub，讓GitHub Actions自動執行CI。
9. 知道secret、照片與GPS資料為何不能提交到GitHub。
10. 分辨「AI說完成」與「測試證明完成」。

## 1. 全課程地圖

| 單元 | 可觀察成果 | 核心概念 |
| --- | --- | --- |
| 1 | WSL2 Ubuntu可啟動 | OS、Linux shell、虛擬化 |
| 2 | VS Code在WSL內開啟資料夾 | local UI與remote environment |
| 3 | Node.js、Git、GitHub CLI可用 | runtime、版本控制、remote repository |
| 4 | Codex讀到`AGENTS.md`與`codex.md` | durable instructions、specification |
| 5 | Phase 0空殼可啟動且測試通過 | plan、vertical slice、acceptance criteria |
| 6 | 第一個GitHub repository與CI綠燈 | commit、push、workflow、runner |
| 7 | Google登入 | OAuth/OIDC、secret、callback |
| 8 | 照片上傳與EXIF | untrusted input、filesystem、metadata |
| 9 | 地圖顯示自己的照片 | authorization、MapLibre、OpenFreeMap |
| 10 | iPhone測試與PR review | responsive、regression、code review |

前六個單元是環境與AI coding方法；後四個單元才是產品功能。初學者若跳過前六個單元，遇到錯誤時很容易分不清是程式、環境、權限或Git造成的。

---

# 第一部分：建立正確的開發環境

## 2. 先理解：為什麼使用WSL2

### 2.1 五個名詞的關係

| 名詞 | 在本課程中的角色 | 不是什麼 |
| --- | --- | --- |
| Windows 11 | 顯示桌面、瀏覽器、VS Code視窗 | 不是本專案主要執行環境 |
| WSL2 | 在Windows內提供真正的Linux環境 | 不是另一台要遠端登入的實體電腦 |
| Ubuntu | 本課程選用的Linux distribution | 不是VS Code外掛 |
| VS Code | 編輯程式、看Terminal、操作Codex的介面 | 不負責取代Node.js或Git |
| Codex | 讀取專案、修改程式、執行命令與測試的coding agent | 不替使用者決定所有需求或承擔驗收責任 |

本專案使用`sharp`等native dependency，未來也可能用Docker與Linux server。把Node.js與專案都放在WSL2，能讓開發環境更接近正式Linux部署環境，並減少Windows與Linux在路徑、權限、shell語法上的差異。

### 2.2 專案應放在哪裡

本課程把專案放在：

```text
/home/<你的Linux帳號>/code/photo-map
```

也就是Ubuntu內的`~/code/photo-map`。不要把主要專案放在：

```text
C:\Users\...\photo-map
/mnt/c/Users/.../photo-map
```

原因是WSL在Linux filesystem中的大量小檔案I/O通常較快，也較少遇到permission、symlink與檔名大小寫差異。Windows若要查看Linux檔案，可在檔案總管輸入：

```text
\\wsl$\Ubuntu\home\<你的Linux帳號>\code
```

> 教學檢核：請學生用自己的話回答：「程式到底只有一份，放在哪裡？」正確答案應是只有一份，放在WSL的Linux home之下。

## 3. 安裝WSL2與Ubuntu

### Step 3.1：確認Windows版本

執行位置：`Windows`。

1. 按`Win + R`。
2. 輸入`winver`後按Enter。
3. 確認是Windows 11。

原因：`wsl --install`需要受支援的Windows版本。Windows 11符合本課程需求。

成功訊號：畫面顯示Windows 11及版本資訊。

### Step 3.2：以系統管理員身分開啟PowerShell

執行位置：`系統管理員PowerShell`，不是Ubuntu。

1. 按Windows鍵。
2. 搜尋`PowerShell`。
3. 右鍵選擇「以系統管理員身分執行」。
4. 在User Account Control視窗按「是」。

如何辨認：視窗標題應包含「Administrator」或「系統管理員」。

原因：啟用WSL與虛擬機平台屬於Windows系統層級變更，需要管理權限。

### Step 3.3：安裝WSL與Ubuntu

執行位置：`系統管理員PowerShell`。

```powershell
wsl --install -d Ubuntu
```

這個命令會啟用WSL需要的Windows功能，並安裝Ubuntu。新安裝通常預設為WSL2。

成功訊號：PowerShell顯示安裝完成並要求重新啟動，或Ubuntu開始安裝。

若只顯示WSL說明文字，可先執行：

```powershell
wsl --list --online
wsl --install -d Ubuntu
```

若下載卡在`0.0%`，可嘗試官方提供的web download方式：

```powershell
wsl --install --web-download -d Ubuntu
```

### Step 3.4：重新啟動Windows

不要只關閉PowerShell。請實際重新啟動Windows，讓虛擬機相關功能完成設定。

### Step 3.5：建立Ubuntu帳號

重新登入Windows後，從開始功能表開啟`Ubuntu`。第一次啟動會解壓縮檔案，接著要求：

```text
Enter new UNIX username:
New password:
Retype new password:
```

注意：

- Linux username建議使用小寫英文字母，例如`student01`。
- 輸入password時畫面不會出現星號，也不會顯示游標移動，這是Linux正常的安全設計。
- 這是Ubuntu的本機密碼，不一定等同Windows或Microsoft帳號密碼。
- 之後使用`sudo`安裝軟體時會用到，請自行保存，不要貼到AI對話。

成功訊號：最後看到類似以下prompt：

```text
student01@computer:~$
```

其中`~`表示目前位於Linux使用者的home directory。

### Step 3.6：確認真的是WSL2

執行位置：`一般PowerShell`，不需要系統管理員。

```powershell
wsl --list --verbose
```

預期看到：

```text
NAME      STATE           VERSION
Ubuntu    Running         2
```

若VERSION是`1`，轉換成WSL2：

```powershell
wsl --set-version Ubuntu 2
```

再執行一次`wsl --list --verbose`驗證。

### Step 3.7：更新Ubuntu套件索引

執行位置：`Ubuntu terminal`。

```bash
sudo apt update
sudo apt upgrade -y
```

概念：

- `sudo`：暫時以管理權限執行下一個命令。
- `apt update`：更新「有哪些套件版本」的清單，不等於安裝全部軟體。
- `apt upgrade -y`：更新已安裝套件；`-y`表示同意安裝提示。

成功訊號：命令結束後回到`$`prompt，且沒有紅色error。

若出現password提示，輸入Step 3.5建立的Ubuntu password；畫面仍不會顯示字元。

## 4. 在Ubuntu安裝基本開發工具

執行位置：`Ubuntu terminal`。

```bash
sudo apt install -y git curl build-essential unzip gh
```

各工具用途：

| 工具 | 用途 |
| --- | --- |
| `git` | 追蹤每次程式修改與建立checkpoint |
| `curl` | 從HTTPS網址取得安裝程式或測試API |
| `build-essential` | 編譯某些Node.js native dependency |
| `unzip` | 解開starter pack |
| `gh` | 從terminal登入與操作GitHub |

逐一驗證：

```bash
git --version
curl --version
gcc --version
unzip -v
gh --version
```

初學者不必理解每一行版本資訊，只要每個command都有輸出版本，而且沒有`command not found`。

## 5. 安裝Node.js：為什麼透過nvm

Node.js是執行Next.js與開發工具的JavaScript runtime；npm是安裝project dependency與執行scripts的工具。

本課程不直接使用Ubuntu可能偏舊的`apt install nodejs`，而使用nvm管理Node版本。當專案日後改用另一個LTS版本時，可以切換，不必破壞整台電腦的設定。

### Step 5.1：安裝nvm

執行位置：`Ubuntu terminal`。

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash
```

安全與教學說明：這行會下載並執行nvm專案的安裝script；正式課堂執行前，教師應再次對照nvm官方README的current version。不要任意把網路上不明網址換進這種pipe-to-shell命令。

讓目前terminal重新載入設定：

```bash
source ~/.bashrc
```

驗證：

```bash
command -v nvm
```

預期輸出：

```text
nvm
```

不要用`which nvm`作為唯一判斷，因為nvm是shell function，不是一般binary。

### Step 5.2：安裝Node.js LTS

執行位置：`Ubuntu terminal`。

```bash
nvm install --lts
nvm alias default 'lts/*'
```

驗證：

```bash
node --version
npm --version
```

成功訊號：兩者都顯示版本號。課程不要硬背版本號；repository建立後應用`.nvmrc`與lockfile固定可重現的版本範圍。

若重新開啟Ubuntu後出現`nvm: command not found`：

```bash
source ~/.bashrc
command -v nvm
```

若這樣有效，表示shell啟動設定尚未正確載入；請讓Codex協助檢查`~/.bashrc`，但不要讓它直接覆寫整份檔案。

## 6. 安裝與連接VS Code

### Step 6.1：在Windows安裝VS Code

執行位置：`一般PowerShell`。

```powershell
winget install --id Microsoft.VisualStudioCode -e
```

也可以從VS Code官方網站下載Windows installer。VS Code桌面程式安裝在Windows；程式碼與Node.js則放在WSL。

成功訊號：Windows開始功能表可以開啟Visual Studio Code。

### Step 6.2：安裝兩個必要extension

在VS Code：

1. 按`Ctrl + Shift + X`開啟Extensions。
2. 搜尋`WSL`，確認publisher是Microsoft，按Install。
3. 搜尋`Codex – OpenAI's coding agent`，確認extension ID為`openai.chatgpt`，按Install。
4. 不要用名稱相似的第三方ChatGPT/Codex extension取代官方extension。

原因：WSL extension讓Windows上的VS Code UI連入Ubuntu；Codex extension則提供coding agent側欄。

### Step 6.3：建立Linux專案資料夾

執行位置：`Ubuntu terminal`。

```bash
mkdir -p ~/code/photo-map
cd ~/code/photo-map
pwd
```

預期`pwd`輸出類似：

```text
/home/student01/code/photo-map
```

命令拆解：

- `mkdir -p`建立資料夾；上層不存在時也一起建立。
- `cd`切換目前工作目錄。
- `pwd`顯示目前所在位置，能避免在錯誤資料夾執行Codex或Git。

### Step 6.4：從WSL開啟VS Code

仍在`~/code/photo-map`時執行：

```bash
code .
```

`.`表示目前資料夾。第一次執行可能會安裝VS Code Server，請等待完成。

成功訊號：

1. VS Code開啟`photo-map`資料夾。
2. 左下角顯示`WSL: Ubuntu`。
3. 在VS Code選單選`Terminal > New Terminal`後，prompt是Linux格式。
4. 在該terminal執行：

   ```bash
   echo "$WSL_DISTRO_NAME"
   pwd
   node --version
   ```

5. 預期分別看到`Ubuntu`、`/home/.../code/photo-map`與Node版本。

若左下角沒有`WSL: Ubuntu`：按`Ctrl + Shift + P`，選`WSL: Reopen Folder in WSL`。

> 重要：從現在起，課程中的`npm`、`git`、`gh`、`codex`都在WSL/VS Code的Linux terminal執行，不要另開Windows PowerShell執行同一套project commands。

## 7. 將starter pack放入專案

starter pack包含：

```text
AGENTS.md
codex.md
CLAUDE.md
README-FIRST.md
CASE-STUDY-GUIDE.md
```

如果ZIP下載在Windows的`Downloads`，有兩種方式。課堂統一選一種即可。

### 方式A：使用Windows檔案總管

1. 在Ubuntu terminal執行`whoami`，記下Linux帳號。
2. 在Windows檔案總管網址列輸入：

   ```text
   \\wsl$\Ubuntu\home\<Linux帳號>\code\photo-map
   ```

3. 解壓starter pack。
4. 把pack內檔案複製到上述`photo-map`資料夾。
5. 不要多包一層`photo-map-codex-starter`，`AGENTS.md`必須直接位於project root。

### 方式B：使用Ubuntu command

先找出Windows下載資料夾。將以下`<Windows帳號>`換成實際名稱；尖括號本身不要輸入：

```bash
ls /mnt/c/Users
ls "/mnt/c/Users/<Windows帳號>/Downloads"
```

看到ZIP檔後：

```bash
unzip "/mnt/c/Users/<Windows帳號>/Downloads/photo-map-codex-starter.zip" -d /tmp/photo-map-starter
cp -a /tmp/photo-map-starter/photo-map-codex-starter/. ~/code/photo-map/
```

驗證project root：

```bash
cd ~/code/photo-map
pwd
ls -la
```

應直接看到`AGENTS.md`與`codex.md`。若只看到一個子資料夾，代表多包了一層，Codex不一定會從你預期的root讀到指令。

---

# 第二部分：讓Codex成為可驗證的協作工程師

## 8. 安裝與登入Codex

### 8.1 VS Code extension

1. 在VS Code點Codex圖示開啟sidebar。
2. 選擇以ChatGPT帳號登入。
3. 依瀏覽器流程完成授權。
4. 回到VS Code後輸入`/status`。

成功訊號：Codex sidebar可建立chat，`/status`能顯示目前session資訊。

不要把OpenAI API key貼進課堂chat。IDE extension可用ChatGPT帳號登入；OpenAI API key是另一種API使用與計費情境。

### 8.2 Codex CLI（建議安裝，用於理解terminal workflow）

執行位置：`WSL terminal`。

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

重新開啟terminal後驗證：

```bash
which codex || echo "codex not found"
codex --version
```

若CLI找不到，不影響先使用VS Code extension；但請先確認命令是在WSL而非PowerShell執行。

## 9. 三種文件不是同一件事

| 位置 | 回答的問題 | 範例 |
| --- | --- | --- |
| `AGENTS.md` | AI在這個repository應如何工作？ | 修改後要跑哪些測試、不能提交secret |
| `codex.md` | 產品要做什麼？ | 上傳1–10張照片、Map只顯示自己的照片 |
| 當次prompt | 這一輪只做什麼？ | 只規劃Phase 0，不修改檔案 |

Codex會自動探索`AGENTS.md`；`codex.md`不是預設自動指令檔，因此root `AGENTS.md`明確要求先讀它。

### Step 9.1：確認Codex讀到正確文件

在VS Code Codex sidebar輸入：

```text
請不要修改檔案。請說明你目前的workspace root，列出你讀到的repository instructions，
並用五點摘要AGENTS.md與codex.md最重要的限制。如果沒有讀到其中任一檔，請直接說明。
```

學生要檢查：

- workspace root是否是`photo-map`。
- 是否提到每次只做一個phase或vertical slice。
- 是否知道照片不得放在`public/`。
- 是否知道Map只能回傳目前登入者自己的照片。
- 是否知道修改後要執行lint、typecheck、test與build。

若Codex回答錯誤，不要立刻叫它寫程式。先檢查VS Code開啟的folder層級與檔案名稱大小寫。

## 10. 初學者與Codex的標準互動循環

每個功能都使用同一個循環：

1. **Observe**：查看目前程式、Git狀態與錯誤。
2. **Plan**：Codex只讀分析，提出小範圍計畫。
3. **Approve**：使用者確認目標、限制與驗收方式。
4. **Implement**：Codex只實作一個vertical slice。
5. **Verify**：執行程式、tests與人工操作。
6. **Review**：檢查diff、安全與規格符合度。
7. **Explain**：Codex解釋資料流，學生回答理解題。
8. **Commit**：建立可回復的Git checkpoint。

### 10.1 Prompt的四個欄位

```text
Goal：這一輪要完成的可觀察成果。
Context：相關規格、檔案、錯誤與重現步驟。
Constraints：不得改動的範圍、技術與安全邊界。
Done when：哪些command、測試與畫面結果證明完成。
```

不佳prompt：

```text
幫我做照片網站。
```

可執行prompt：

```text
Goal：只完成Phase 0的Next.js空殼，四個route可顯示placeholder。
Context：先讀AGENTS.md、codex.md與目前空資料夾。
Constraints：不實作Google登入、Upload或Map；不更換既定架構。
Done when：npm run lint、typecheck、test、build全部通過，且我能用npm run dev開啟四個route。
先進入Plan mode，不要修改檔案。
```

## 11. 第一次Plan：讓AI先想，不先寫

在Codex sidebar輸入`/plan`，再貼上：

```text
請閱讀AGENTS.md、codex.md與目前資料夾狀態。

本次Goal：規劃Phase 0，建立可啟動、可測試的Next.js TypeScript空殼。
現在只分析，不修改檔案、不安裝套件。

請回答：
1. 目前專案狀態與workspace root。
2. 預計建立或修改哪些檔案，各自目的為何。
3. 會執行哪些命令，以及每個命令的作用。
4. 哪些工作明確不在本次範圍。
5. 如何驗收四個route、lint、typecheck、test與build。
6. 是否有真正需要我決定的事項；規格已有答案的問題不要重問。
7. 初學者在執行前應理解的三個概念。
```

### 11.1 學生如何review AI的Plan

不要只看文字是否專業。逐項檢查：

- 有沒有偷做Phase 1的Google登入？有就退回縮小範圍。
- 有沒有任意換成別的framework、database或map library？有就要求遵守規格。
- 是否先建立`.gitignore`，避免後續誤提交secret與generated data？
- 是否明確列出驗證command？
- 是否提出規格已回答的無效問題？
- 安裝dependency前是否會說明用途？

### 11.2 確認Plan後才實作

```text
依剛才確認的計畫完成Phase 0。

工作規則：
- 一次只處理Phase 0。
- 執行command前標明用途；command失敗要保留錯誤證據並分析，不可假裝成功。
- 不提前實作Google登入、照片處理或地圖。
- 不修改AGENTS.md與codex.md已決定的架構。
- 完成後執行lint、typecheck、test、build。
- 回報實際修改檔案、測試結果與仍未完成事項。

教學要求：
- 用五句話說明本次成果如何運作。
- 解釋package.json scripts、App Router route與.gitignore。
- 告訴我如何人工開啟四個route驗收。
- 最後出三題短問題確認我是否理解。
```

## 12. 人工驗收Phase 0

Codex做完後，學生自己執行，不只讀AI摘要。

執行位置：`VS Code的WSL terminal`。

```bash
pwd
npm run dev
```

成功時terminal通常顯示local URL，例如`http://localhost:3000`。在Windows瀏覽器逐一開啟：

```text
http://localhost:3000/
http://localhost:3000/dashboard
http://localhost:3000/upload
http://localhost:3000/map
```

按`Ctrl + C`停止development server。`Ctrl + C`不是複製，它在terminal中表示中止目前process。

再執行：

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

只有四個command都成功，而且四個頁面可開啟，Phase 0才算完成。

## 13. 使用`/review`檢查未提交修改

在Codex輸入`/review`，選擇review uncommitted changes，並加上：

```text
請依AGENTS.md與codex.md review目前未提交修改，優先檢查：
1. 是否超出Phase 0。
2. .gitignore是否排除.env.local、storage、SQLite與generated files。
3. package scripts是否真的可執行。
4. 是否留下會妨礙Phase 1到4的結構問題。
5. 是否有secret或使用者資料可能被Git追蹤。
先列出具體finding與證據，不要進行大規模重構。
```

學生應學會：review是另一個檢查角度，不等於所有finding都必須照單全收。先看finding能否用規格、程式或測試證明。

---

# 第三部分：用Git與GitHub建立可回復、可自動驗證的流程

## 14. 初始化Git

若Codex尚未初始化，執行位置：`VS Code的WSL terminal`。

```bash
cd ~/code/photo-map
git init -b main
git status
```

概念：

- working tree：目前資料夾的檔案狀態。
- staging area：準備放入下一個commit的修改。
- commit：一個有訊息、可比較、可回復的checkpoint。
- `main`：本課程的主要branch名稱。

設定提交者資訊；請換成自己的資料：

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
git config --global init.defaultBranch main
```

這不是GitHub登入。它只是寫入commit的作者資訊。

## 15. 建立第一個checkpoint

先看哪些檔案會被提交：

```bash
git status
git diff
```

加入檔案後再次檢查：

```bash
git add .
git status
git diff --cached
```

在commit前確認沒有：

- `.env.local`
- 真實OAuth secret
- `storage/`內照片
- SQLite database
- `node_modules/`

建立commit：

```bash
git commit -m "feat: scaffold photo map application"
git log --oneline -5
```

成功訊號：`git log`顯示剛才的commit hash與message。

## 16. 登入GitHub CLI

執行位置：`WSL terminal`。

```bash
gh auth login
```

建議互動選項：

1. `GitHub.com`
2. `HTTPS`
3. 使用browser登入

依畫面顯示的一次性code在瀏覽器授權。不要把token或code貼給AI。

完成後：

```bash
gh auth status
gh auth setup-git
```

`gh auth setup-git`讓Git在存取GitHub HTTPS remote時使用GitHub CLI的credential helper。

## 17. 建立remote repository並push

為避免初學時不小心公開照片或設定，case study先建立private repository：

```bash
gh repo create photo-map --private --source=. --remote=origin --push
```

命令拆解：

- `photo-map`：GitHub repository名稱。
- `--private`：不公開。
- `--source=.`：以目前資料夾為來源。
- `--remote=origin`：將GitHub位置命名為`origin`。
- `--push`：建立後上傳目前branch與commit。

驗證：

```bash
git remote -v
git status
gh repo view --web
```

預期GitHub網頁能看到程式與文件，但看不到secret、照片、database與`node_modules`。

## 18. 建立第一個CI workflow

CI（Continuous Integration）表示每次push或PR，GitHub用一台乾淨runner重新安裝dependency、檢查程式並build。它能抓到「我的電腦可以，但乾淨環境不行」的問題。

CI不是CD。CD是把通過檢查的版本部署到正式環境。本MVP使用本機SQLite與server folder，因此尚未選定persistent deployment前，不應假裝已完成CD。

建立`.github/workflows/ci.yml`：

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Unit tests
        run: npm test

      - name: Build
        run: npm run build
```

必要前提：repository內要有`.nvmrc`、`package-lock.json`與對應的npm scripts。若Phase 0沒有建立，先要求Codex提出最小修正，不要把版本散落寫死在多個地方。

可交給Codex的prompt：

```text
Goal：為Phase 0加入最小GitHub Actions CI。
Context：先讀AGENTS.md、codex.md、package.json、.nvmrc與package-lock.json。
Constraints：只執行lint、typecheck、unit test與build；不部署、不加入OpenAI API、不使用production secret。
Done when：workflow YAML可解析，本機四項檢查通過；push後GitHub Actions的quality job成功。
先規劃，再實作。完成後逐段教我workflow、job、runner、step與npm ci的意思。
```

提交workflow：

```bash
git add .github/workflows/ci.yml .nvmrc
git diff --cached
git commit -m "ci: add project quality checks"
git push
```

查看結果：

```bash
gh run list --limit 5
gh run watch
```

GitHub網頁也可點repository的`Actions`頁籤查看。綠色勾表示全部steps成功；紅色叉號時，點進失敗step讀取第一個真正的error，不要只把整頁log丟給AI。

## 19. 標準branch與Pull Request流程

從Phase 1開始不要直接在`main`實驗：

```bash
git switch main
git pull --ff-only
git switch -c phase-1-google-auth
```

功能完成、測試通過後：

```bash
git status
git diff
git add .
git commit -m "feat: add Google authentication"
git push -u origin phase-1-google-auth
gh pr create --fill
gh pr checks --watch
```

流程概念：

1. branch隔離尚未完成的修改。
2. PR讓人與AI看見「相對main改了什麼」。
3. CI提供機械化檢查。
4. Codex review與人工review檢查風險與規格。
5. 通過後才merge。

若已在GitHub設定Codex cloud code review，可在PR留言：

```text
@codex review
```

Codex review不取代CI、branch protection或人工驗收。

---

# 第四部分：各產品Phase如何教，而不是只讓AI做

## 20. Phase 1：Google登入

### 學習目標

- 分辨authentication（你是誰）與authorization（你可讀哪張照片）。
- 理解OAuth client ID可以出現在client設定，client secret不可提交。
- 理解callback URL必須完全一致。
- 知道Google登入不等於讀取Gmail信件。

### 教學拆分

1. **1A：資料模型與Auth.js空架構**，先不放真實credential。
2. **1B：教師示範Google Cloud Console設定**，學生只把值放入本機`.env.local`。
3. **1C：登入、登出與protected route**。
4. **1D：測試匿名使用者與登入者的差異**。

### Plan prompt

```text
/plan
閱讀AGENTS.md、codex.md與Phase 0程式碼，規劃Phase 1A到1D。
請先畫出browser、Google、Auth.js、database與session之間的資料流。
列出哪些檔案Codex可以建立，哪些Google Cloud Console步驟必須由我完成。
不要要求我把client secret貼進chat，也不要要求Gmail讀取權限。
本回合只規劃，不修改檔案。
```

### 人工驗收

- 無痕視窗進入`/dashboard`會被導向登入。
- 登入後只看到基本profile，不出現Gmail內容權限同意。
- 登出後重新進入protected route失敗。
- `git status --ignored`確認`.env.local`被忽略。

## 21. Phase 2：照片Upload與EXIF

### 學習目標

- Browser提供的filename、MIME與副檔名都不可信。
- 原始照片與thumbnail為何要放在`public/`之外。
- EXIF GPS是敏感metadata；顯示照片與公開原檔是兩件事。
- 批次上傳應逐檔回報，單檔失敗不應讓全部消失。

### 依序做四個vertical slice

1. **2A：一張JPEG**：驗證、server安全命名、存檔、database metadata。
2. **2B：EXIF**：含GPS與無GPS各一張，結果清楚。
3. **2C：thumbnail**：使用`sharp`輸出不複製EXIF的JPEG。
4. **2D：多檔與HEIC**：1–10張、逐檔成功/失敗、runtime不支援時可理解。

不要一開始同時做多檔、HEIC、EXIF、thumbnail與Map。若失敗，會難以判斷是哪個邊界造成。

### Debug prompt格式

```text
問題：上傳一張iPhone HEIC後收到HTTP 500。
重現步驟：登入 → /upload → 選IMG_1234.HEIC → 上傳。
預期：該檔保存或顯示明確不支援訊息，不影響同批其他照片。
實際：畫面顯示Internal Server Error。
環境：WSL2 Ubuntu、Node版本請從.nvmrc與node --version確認。
證據：以下是terminal第一個error與相關request log：……

請先重現並找root cause，不要先換library或大幅重構。
找到原因後提出最小修正與regression test，等我確認再改。
```

## 22. Phase 3：免費地圖

### 學習目標

- MapLibre是rendering library；OpenFreeMap提供style/tiles，兩者角色不同。
- map API只回傳目前登入者且有GPS的照片。
- 前端隱藏marker不是authorization；server必須先過濾。
- attribution是地圖資料使用條件的一部分。

### Vertical slices

1. **3A：靜態測試marker**，確認MapLibre能載入。
2. **3B：自己的GPS metadata API**。
3. **3C：marker與fit bounds**。
4. **3D：受保護thumbnail popup、空狀態與單點zoom**。
5. **3E：使用者A/B ownership測試**。

### 安全review prompt

```text
/review
優先檢查所有Photo query、metadata API與thumbnail route：
- 是否先驗證session；
- 是否以session userId限制query；
- 是否可能用猜測ID讀到他人照片；
- response是否洩漏relativePath、storedName或server路徑；
- 原始GPS是否出現在不必要的log或公開response。
請提供file與具體證據，不要只給一般性安全建議。
```

## 23. Phase 4：iPhone品質與回歸測試

### 學習目標

- responsive不是把desktop畫面縮小，而是重新安排touch操作。
- unit test與end-to-end test回答不同問題。
- regression test把修過的bug固定成未來的自動檢查。

### 驗收

- Playwright使用390×844 viewport。
- 頁面沒有水平捲動。
- 主要touch target至少44×44 CSS pixels。
- Upload、Map與popup有loading、error與empty state。
- lint、typecheck、unit test、build、e2e全部通過。
- iPhone實機Safari完成至少一次登入、上傳與地圖操作。

---

# 第五部分：教師如何判斷學生真的學會

## 24. 每個Phase的學習紀錄

要求學生在`docs/LEARNING_LOG.md`每次填寫：

```md
## Phase / 日期

### 我本來以為
- ...

### Codex提出的計畫
- ...

### 我修改或否決了什麼，為什麼
- ...

### 實際驗證證據
- command：結果
- 人工操作：結果

### 我現在能解釋
- 資料流：...
- 安全邊界：...

### 仍不理解
- ...
```

如果紀錄只有「AI幫我完成」，代表還沒有達到學習目標。

## 25. 建議評量rubric（100分）

| 面向 | 配分 | 可觀察證據 |
| --- | ---: | --- |
| 問題與規格拆解 | 15 | prompt有Goal/Context/Constraints/Done when |
| AI plan判讀 | 15 | 能指出超出範圍或架構偏移 |
| Git過程 | 10 | 小commit、可讀message、無secret |
| 功能正確性 | 20 | Phase acceptance criteria通過 |
| 測試與CI | 15 | 本機與GitHub Actions皆通過 |
| 安全與隱私 | 15 | ownership、upload、EXIF、secret正確 |
| 理解與反思 | 10 | 能口頭解釋資料流與debug證據 |

## 26. 初學者常見錯誤與排查順序

| 現象 | 先檢查 | 不要先做 |
| --- | --- | --- |
| `npm: command not found` | 是否在WSL、`node --version`、`source ~/.bashrc` | 重裝整個VS Code |
| VS Code terminal是`C:\...` | 左下角是否`WSL: Ubuntu` | 在Windows與WSL各裝一份dependency |
| Codex沒讀到規格 | workspace root、`AGENTS.md`位置與大小寫 | 重複把410行規格貼進每個prompt |
| `git status`出現`.env.local` | `.gitignore`規則、是否曾被track | 直接commit後再想辦法刪secret |
| 本機成功、CI失敗 | lockfile、Node版本、第一個失敗step | 無證據地重跑很多次 |
| Google登入redirect mismatch | callback URL字元是否完全一致 | 變更Auth library |
| 上傳整批HTTP 500 | server log第一個error、逐檔處理邊界 | 一次重寫全部upload flow |
| 地圖沒有marker | API response、GPS null、browser console | 先更換map provider |
| 他人照片可被猜ID讀取 | thumbnail route的session與ownership | 只在前端隱藏按鈕 |

## 27. 兩次修正仍失敗時的AI互動規則

同一錯誤修兩次仍未解決，不要再說「繼續試」。改用：

```text
停止繼續修改。請重新建立問題模型：
1. 列出已知事實與實際證據。
2. 列出三個最可能root cause，依機率排序。
3. 為每個root cause設計一個最小、可區分的diagnostic。
4. 說明前兩次修正為何沒有解決問題。
5. 先執行不會破壞資料的diagnostic，不做新重構。
```

這能訓練學生從「讓AI猜答案」轉成「用證據縮小問題空間」。

## 28. 教師每堂課的固定收尾

1. 學生展示可操作成果，不只展示程式碼。
2. 學生執行或出示測試與CI證據。
3. 學生說明一條主要資料流。
4. 學生指出一個安全或隱私邊界。
5. 學生展示本次Git diff與commit。
6. 學生回答Codex出的理解題。
7. 教師確認下一堂課只增加一個新vertical slice。

---

# 附錄A：課堂command位置速查

| Command | 執行位置 |
| --- | --- |
| `wsl --install`、`wsl --set-version` | Windows PowerShell |
| `sudo apt ...` | Ubuntu/WSL |
| `nvm`、`node`、`npm` | Ubuntu/WSL |
| `code .` | Ubuntu/WSL的project directory |
| `git`、`gh` | VS Code的WSL terminal |
| `/plan`、`/review`、`/status` | VS Code Codex sidebar |
| `npm run dev`、測試commands | VS Code的WSL terminal |

# 附錄B：官方參考資料

- [Microsoft：安裝WSL](https://learn.microsoft.com/windows/wsl/install)
- [Microsoft：設定WSL開發環境](https://learn.microsoft.com/windows/wsl/setup/environment)
- [VS Code：Remote Development in WSL](https://code.visualstudio.com/docs/remote/wsl-tutorial)
- [OpenAI：Codex IDE](https://developers.openai.com/codex/ide)
- [OpenAI：Codex最佳實務](https://learn.chatgpt.com/guides/best-practices)
- [OpenAI：AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [OpenAI：Codex WSL](https://learn.chatgpt.com/docs/windows/wsl)
- [OpenAI：GitHub code review](https://learn.chatgpt.com/docs/third-party/github)
- [nvm官方repository](https://github.com/nvm-sh/nvm)
- [GitHub：Adding locally hosted code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [GitHub：Understanding GitHub Actions](https://docs.github.com/actions/about-github-actions/understanding-github-actions)
- [GitHub：Building and testing Node.js](https://docs.github.com/actions/automating-builds-and-tests/building-and-testing-nodejs)

# 附錄C：這份教案刻意不做的事

- 不把ChatGPT Plus與OpenAI API用量混為一談。
- 不要求學生把OAuth secret、API key、password或token貼進AI對話。
- 不要求Codex一回合產生Phase 0到4全部程式。
- 不因為有AI就省略Git、tests、CI或人工操作驗收。
- 不把暫時可執行的serverless部署當成可永久保存照片的production方案。
- 不使用Google Maps，避免本case study產生計費與信用卡需求。
- 不把「能解釋AI產生的摘要」誤當成「能解釋實際程式資料流」。
