# MVP v0.1 建立與驗證報告

> 2026-10-09 更新：Web Mobile 完整建置及建置版三關實玩已完成；詳見 [最新建置報告](docs/web-mobile-validation-2026-10-09.md)。下文保留 2026-10-08 的原始驗證紀錄。

日期：2026-10-08（Asia/Taipei）
專案：D:\CocosProject\AssemblyLinePuzzleFactory

## 本次交付

從空白專案建立 Cocos Creator 3.8.8 / TypeScript 可玩的三關 MVP。
新增 Factory.scene、FactoryGame.ts、PuzzleModel.ts、關卡邏輯測試、README 及實際預覽截圖。
畫面以 Cocos Graphics 原生繪製，720×1280 直向，深色工廠、輸送帶陰影及金色貨箱。
沒有刪除既有資源或覆蓋使用者重要場景。

## 已實際驗證

| 項目 | 結果 |
| --- | --- |
| Creator 3.8.8 載入 Factory.scene | 成功；Canvas 的 FactoryGame 已正確掛載 |
| Cocos 預覽編譯及瀏覽器執行 | 成功；乾淨預覽的 error / warn 日誌為空 |
| TypeScript 檢查 | npm run typecheck 通過；skipLibCheck 僅跳過引擎宣告檔 |
| 關卡邏輯 | npm test 通過 22 項檢查 |
| 輸送帶點擊旋轉 | 實際點擊驗證；每次順時針 90° |
| 貨箱移動 | 三關實際沿正確路線到出口，包括轉角與向上運送 |
| 完成判定 | 三關皆顯示貨箱送達成功提示 |
| 切換關卡 | 1→2→3→1 全部實際驗證 |
| 未完成禁止切關 | 實際顯示阻止切關提示 |
| 錯誤路線 | 貨箱偏離輸送帶後顯示失敗提示 |
| 失敗後重置 | 還原方向、貨箱及準備狀態 |
| 開始後立即重置 | 回到準備狀態，未被舊流程覆寫 |
| 手機尺寸版面 | 390×844 瀏覽器視窗已目視確認，棋盤及按鈕皆完整可見 |

## 定位與修正

1. 原始 FactoryGame 的 UI 建立方法名 node 與 Component.node 衝突：改名 makeNode，重新型別檢查及預覽通過。
2. 場景腳本使用完整 UUID 導致 Missing Class：改用 Cocos 實際產生的壓縮 class ID，重新載入、儲存及預覽通過。
3. 第二關實玩發現上下方向與箭頭相反：統一格子 y 向下遞增，新增方向映射測試，重新實際通關三關。
4. 重置會清除貨箱 Tween，替換 UI 前停用舊 root；貨箱仍在動畫中時禁止切關，避免舊動畫回呼污染新关卡。
5. 引擎 .d.ts 全量檢查出現 WebGPU 等缺失宣告：設定 skipLibCheck，遊戲腳本仍進行型別檢查。

編輯器舊日誌保留了修正前的錯誤；最終乾淨預覽未出現新的錯誤或警告。

## 尚未驗證與限制

- 尚未完成完整 web-mobile 輸出包驗證。命令列建置嘗試未產生輸出包，因此不能宣稱正式建置成功；本次已完成 Cocos 預覽編譯及執行驗證。
- Android / iOS 安裝包、真機觸控、安全區、低階裝置效能與長時間測試尚未驗證。
- 目前為原生繪圖的偽 3D MVP，沒有音效、存檔與進度持久化。
- 編輯器預覽工具列仍顯示其預設 1280×720；遊戲 onLoad 設為 720×1280，實際遊戲畫面已直向。
- UI 在執行時建立，未進入預覽的場景編輯視窗只显示 Canvas。

## 使用

在 Cocos Creator 3.8.8 開啟 assets/scenes/Factory.scene，按預覽。
點擊輸送帶配置方向，按開始運送，成功後按下一關。
測試：npm test；型別檢查：npm run typecheck。
截圖：docs/mvp-preview.png、docs/mvp-mobile-preview.png。
