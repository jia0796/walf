# 第 56 章實作、修復與部署報告

規格依據：main `c79723942e492fa2dc74e60ba63508d05593135e` 的完整 README 與第 56 章；App 起點 `6d7fe59aee5d4c0f0871326ed04c83044348390d`。沿用既有 `votes`／`vote-ui`、主持引擎、日間事件與復盤元件。Drive App 資料夾仍是既有 v1.0～v1.2 參考文件；本章沒有新素材需求。對話中的選用入口及不顯示同票標籤與 README 一致，未發現需另猜遊戲規則的衝突。

## 完成行為

1. 首輪警長排除全體原上警／退水者；兩種 PK 均排除本輪 PK 玩家。非 PK 警長 1.5 票、合法自投、死亡／白痴投票限制沿用共用資格。
2. 兩種模式共用本次草稿，開啟／改票不改正式遊戲。完成統計原子性保存票型、結果、鎖定；不自行進 PK、不自行殺人或選出警長。
3. 最高票及同最高票正式套用。可部分提交；未紀錄不當棄票。只有棄票或空白不提交，也不選零票玩家。
4. ×／Esc 只捨棄當次草稿；重編輯再完成才更新。明確放棄票型須確認，只清本輪並恢復手動。結果鎖定時不能單獨改結果。
5. 既有下一步、上一頁快照、刷新、重開保留完整一致性；存檔升至 v20。v19 舊草稿因從未正式提交，載入時捨棄；已完成的歷史紀錄以 legacy 保存，不追溯改票數或舊結果。
6. 只有正式且已由原流程確認的票型進入復盤。PK 分輪、票數分組、不新增同票標籤；原事件卡 HTML、插畫與配色沒有修改。
7. 修復上一報告 A55-01 的鍵盤焦點；A55-02 的小橫向視窗編輯區；A55-03 的失敗提交提示與原子性撤回。長局歷史結構未重寫。

## 檔案清單

- `public/app.js`
- `public/engine.js`
- `public/index.html`
- `public/style.css`
- `public/sw.js`
- `public/vote-ui.js`
- `public/votes.js`
- `scripts/followup-ui.mjs`
- `scripts/next-ui-regression.mjs`
- `scripts/ui-regression.mjs`
- `scripts/ui56-ui.mjs`
- `scripts/verify-deployment.mjs`
- `test/beauty.test.js`
- `test/classic.test.js`
- `test/complete-recap.test.js`
- `test/engine.test.js`
- `test/masquerade.test.js`
- `test/nightmare.test.js`
- `test/pwa.test.js`
- `test/readme48.test.js`
- `test/ui54.test.js`
- `test/votes.test.js`

7 個 public 程式檔；其他為測試／驗收腳本與版本期待更新。夜間結算 `night.js`、角色 `data.js`、`records.js`、`recap.js`、正式圖片／SVG、主持固定字幕、計時器及房規未改。主引擎只加入票型結果一致性守門與存檔升級。

## 實測

- 639 項自動測試全過，含 16 項本輪票型模型／歷史／資格測試。
- 引擎 24 配置各 18 局，共 432 局、46,643 操作；所有局終局。
- 33 局、2,914 次完整主持 DOM 操作；包括 24 款板子及 9 組感染、機械、騎士特殊情境。未發現原技能、女巫、獵人、警長、放逐、PK、勝負回歸錯誤。
- 新功能定點驗收 13 組結果（8 組功能／儲存情境、5 種版面），本機及正式站皆過；使用階段夾具，不算完整對局；發布前保存失敗案例採注入 Storage API 配額錯誤，實際配額壓力留待第三步只讀稽核。測試草稿取消、結果鎖定、更新／放棄、PK、回退、復盤、儲存失敗重試與警徽權重。
- 320×568、390×844、568×320／200% 字體、768×1024／200%、150px 模擬安全區通過。桌面 Edge 模擬，不能代替實體行動瀏覽器驗收。
- 所有 public JS 語法與 86 項素材快取摘要核對通過；52 項離線素材取得正常。專案為靜態 ES modules，沒有獨立 build 或 TypeScript 檢查，沒有虛報此類建置。
- [CI](https://github.com/jia0796/wolf_Emcee/actions/runs/38368831969)／[部署](https://github.com/jia0796/wolf_Emcee/actions/runs/38368832008) 成功，正式站 61 項原始檔／素材摘要與操作驗收通過。

## 交付界線

程式 commit：[b7a7e01](https://github.com/jia0796/wolf_Emcee/commit/b7a7e01de890fd0f507028cb3150c40659b6642c)；App 分支 `feat/eclipse-host-app`。[正式 App](https://jia0796.github.io/wolf_Emcee/)。main 僅更新 README 與本報告／驗收資料，沒有合併程式。

實體 iPhone Safari／iOS PWA／Android／Instagram 仍未驗收。使用者已授權先部署供真機驗收。第 55 章舊定點腳本只對應舊流程；本輪使用 `scripts/ui56-ui.mjs`，不以舊結果冒充新規格測試。完整數據見 [validation](ui56-implementation-validation.json)。

步驟三的只讀測試與待討論問題會另與上一份報告合併交付；不將其新發現寫回原程式或本 README。
