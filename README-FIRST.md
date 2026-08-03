# 先讀我：在VS Code中使用這份規格

這個starter pack現在包含完整初學者教案。第一次使用請依序閱讀：

1. `CASE-STUDY-GUIDE.md`：從Windows 11、WSL2、VS Code、Codex、Git到GitHub CI的逐步課程。
2. `AGENTS.md`：Codex每次自動讀取的repository工作與教學規則。
3. `codex.md`：照片地圖的產品、架構、安全、Phase與驗收規格。
4. `CLAUDE.md`：若同時使用Claude Code，讓它指向相同source of truth。

不要從下面的濃縮版步驟直接跳過環境課；`CASE-STUDY-GUIDE.md`會說明每個command應在哪個terminal執行、原因、成功訊號與排錯方式。

## 建議檔案角色

- `AGENTS.md`：Codex會自動讀取的repository工作規則。
- `codex.md`：完整產品、架構、資安、階段與驗收規格。
- `CLAUDE.md`：讓Claude Code也指向同一套規格，避免雙份內容分歧。

不要只建立`codex.md`後期待Codex一定自動載入。保留root-level `AGENTS.md`，並由它要求Codex先讀`codex.md`。

## Windows 11濃縮流程

1. 安裝WSL2 Ubuntu，並確認`wsl --list --verbose`顯示VERSION 2。
2. 在Ubuntu安裝Git、Node.js、GitHub CLI與基本編譯工具。
3. 在Windows安裝VS Code，以及Microsoft WSL與OpenAI Codex extensions。
4. 將專案放在WSL的`~/code/photo-map`，不要放在`/mnt/c`作為主要工作目錄。
5. 從WSL project directory執行`code .`，確認左下角顯示`WSL: Ubuntu`。
6. 將本資料夾的文件直接放到project root，避免多包一層資料夾。
7. 在project root執行：

   ```bash
   git init
   code .
   ```

8. 開啟Codex sidebar，先送出`codex.md`中的Prompt A。
9. 審閱Plan後，再送出Prompt B。

本case study統一以WSL2授課，避免學生同時維護Windows與Linux兩套Node.js、Git與dependency。

## 每個功能的工作節奏

1. 新開一個chat，只處理一個明確成果。
2. 先用`/plan`，確認範圍與驗收方式。
3. 要Codex完成一個vertical slice。
4. 檢查diff與實際執行結果。
5. 使用`/review`檢查未提交變更。
6. 自己確認後建立Git commit，作為可回復checkpoint。

## 規格寫作公式

未來其他專案也可沿用：

```text
目標
+ 使用者與使用情境
+ 必做／不做
+ 已決定技術與不可任意變更事項
+ 資料與安全邊界
+ 頁面／API／資料模型
+ 階段性vertical slices
+ 每階段可觀察的驗收條件
+ 測試與完成定義
+ AI如何教、何時詢問、何時可以自行執行
```

好的規格不是把每一行程式預先寫死，而是讓agent清楚知道「要達到什麼結果、不能破壞什麼、如何證明完成」。
