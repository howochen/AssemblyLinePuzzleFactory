# Web Mobile 建置與驗證報告

日期：2026-10-09（Asia/Taipei）
專案：《流水線解謎工廠》MVP v0.1 / Cocos Creator 3.8.8

## 結果

已完成 Web Mobile 完整建置，最終 Creator 退出碼為 **36**。
輸出包在 `build/web-mobile`。已使用本機 HTTP 伺服器執行該輸出包，並在 390×844 瀏覽器視窗實際點擊遊玩三關。
最終建置日誌顯示建置階段約 48 秒；首次引擎建置約 5 分鐘，初始化編輯器時間不含在此數字內。

## 修改及定位

- 先前命令列使用舊 `--path` 參數，改用官方 3.8 的 `--project` 與 `--build configPath=...`。
- 新增 `tools/web-mobile-build.json`，以 JSON 原生布林值設定 debug、來源對照檔、入口場景及 portrait 模式，避免字串型別警告。
- 補齊專案預設解析度 720×1280，fitWidth / fitHeight 皆啟用；輸出設定 policy=2。遊戲仍維持 SHOW_ALL。
- 輸出檢查發現一次建置讀取了修改前的 1280×720 設定，已重新啟動建置器，最終輸出為 720×1280 / portrait。
- 新增 `tools/build-web-mobile.ps1`，確認主建置程序退出碼及入口 HTML。改以 WaitForExit 等待主程序，避免 Start-Process -Wait 被殘留 Electron 子程序阻塞。
- 手機實際畫面發現 debug 統計面板覆蓋按鈕；FactoryGame.onLoad 使用 Cocos profiler.hideStats 隱藏面板，最終輸出包已目視確認修正生效。
- 新增 loopback 靜態伺服器 `tools/serve-build.cjs`、輸出檢查 `tests/build-test.cjs`，以及 README 使用說明。
- 沒有刪除或覆蓋既有重要場景與資源。

## 已實際驗證

| 項目 | 結果 |
| --- | --- |
| npm run typecheck | 通過；遊戲 TypeScript 無型別錯誤 |
| npm test | 22 項玩法邏輯檢查通過 |
| 最終完整建置 | Creator 退出碼 36；本次退出碼檔案更新於 2026-10-09 01:35:48 |
| npm run test:build | 通過；必要啟動檔案、引擎版本、入口場景、直向解析度、資源包及退出碼皆正確 |
| 建置版載入 | 成功，直接執行 build/web-mobile 的檔案，沒有依賴編輯器即時場景 |
| 點擊旋轉輸送帶 | 第一至第三關實際點擊驗證 |
| 貨箱移動 | 三關均沿正確路線到達出口，包括轉角及向上運送 |
| 完成判定 | 三關均顯示成功提示 |
| 關卡切換 | 1→2→3→1 均通過 |
| 未完成禁止切關 | 顯示提示並停留本關 |
| 錯誤路線失敗 | 貨箱偏離後顯示失敗提示 |
| 失敗後重新配置 | 還原貨箱、箭頭及準備狀態 |
| 390×844 手機尺寸 | 棋盤、文字及按鈕完整可見；統計面板已隱藏 |
| 瀏覽器 error / warn | 完整三關測試後為空 |

此次互動使用桌面瀏覽器點擊模擬觸控，並非手機實機測試。

## 證據與執行

- 截圖：`docs/web-mobile-preview.png`、`docs/web-mobile-level1-complete.png`、`docs/web-mobile-level3-complete.png`。
- 最終建置記錄：`build/creator-build.log`、`build/web-mobile-build.log`、`build/creator-build-exit-code.txt`。
- 本次使用 `http://127.0.0.1:8089` 測試；伺服器僅綁定本機，沒有对外發布。
- 重建：在 PowerShell 執行 `./tools/build-web-mobile.ps1`。
- 檢查：`npm run test:build`。
- 本機啟動：`npm run preview:build`，預設埠 8088；如需 8089，先設 `$env:FACTORY_PREVIEW_PORT = '8089'`。

## 尚未驗證及已知限制

- Android / iOS 原生建置、安裝包、手機實機觸控、安全區與低階裝置效能仍未驗證。
- 建置版目前是 debug + sourceMaps 測試包，尚未驗證 release 壓縮及正式發布流程。
- 桌面 Electron 建置程序的 stderr 有 GPU / disk cache 建立失敗訊息；它們未阻止建置成功或瀏覽器遊玩。本報告不將它們描述為完全消除。
- 遊戲仍為三關 MVP，沒有音效、存檔或進度持久化。

參考：[官方命令列建置文件](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-in-command-line.html)、[官方 Web 建置選項](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-web.html)。
