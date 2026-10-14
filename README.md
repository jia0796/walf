# 月下議會｜狼人殺主持工具

真人法官PWA：固定字幕、座位角色／技能、夜間死亡與勝負、警長／PK／選用票型、發言計時、上一步、重整恢復及完整復盤。

[開啟App](https://jia0796.github.io/wolf_Emcee/) · [本輪報告](docs/fv57-report.md) · [FV57逐項驗收](docs/fv57-validation.json)

## 目前版本

2026-10-14：**10／12人尋香魅影／覺醒預言家已實作部署**，程式 `62316d7`。App在 `feat/eclipse-host-app`；main只保存規格與文件，沒有合併程式。存檔v21，快取 `council-v21-1`。

- 首夜一次認狼固定保存；雙人綁定／不綁定、下夜到期及永久消耗。
- 第一晚：守衛 → 狼人 → 尋香魅影 → 女巫 → 覺醒預言家 → 獵人（12人）。
- 次晚起：守衛 → 尋香魅影 → 狼人 → 女巫 → 覺醒預言家 → 獵人（12人）。
- 普通狼全滅後，原狼人階段由尋香魅影接刀；雙查驗沿用手勢，復盤好人／壞人。
- 同批死亡及殉情結清後判勝，狼人同批優先，毒／槍分批，終局停止後續操作。
- 核准原畫及校正版綁定SVG已接入；原主持座位、SVG與圖鑑入口維持。
- 夢魘「空恐」按鈕改「不恐懼」，功能不變。

## 支援板子

共26個配置，完整數量及分類見 [data.js](https://github.com/jia0796/wolf_Emcee/blob/feat/eclipse-host-app/public/data.js)。

| 人數 | 一般板子 | 特殊板子 |
|---|---:|---|
| 10人 | 8款 | 覺醒石像鬼／守墓人、種狼／隱狼、尋香魅影／覺醒預言家 |
| 12人 | 10款 | 覺醒石像鬼／守墓人、種狼／隱狼、狼兄狼弟／黑市商人、假面／舞者、尋香魅影／覺醒預言家 |

既有黑狼王／魔術師、機械狼／通靈師、夢魘／攝夢人、預女獵白（混）、狼美人／騎士、血月／獵魔等維持原配置。新兩板固定屠邊，其餘房規沿用對應人數設定。

## 執行與測試

在App分支使用Node.js 22以上，沒有執行期套件依賴。

```sh
git switch feat/eclipse-host-app
npm start
npm test
```

本機 `http://localhost:5173/`。獨立瀏覽器驗收須提供Playwright環境，腳本為 `scripts/fv57-ui.mjs`、`scripts/ui-regression.mjs`、`scripts/ui56-ui.mjs`。沒有獨立build或TypeScript檢查。

## 架構與接手

| 檔案 | 責任 |
|---|---|
| public/data.js | 角色原文、板子、房規與素材 |
| public/engine.js | 階段、必要選擇、回退與存檔遷移 |
| public/night.js | 共用防護、傷害批次、陣營與勝負 |
| public/fragrance.js | 新板獨立綁定／殉情，不套狼美人規則 |
| public/records.js、recap.js | 當時真實身分與日夜復盤 |
| public/app.js、style.css | 原法官介面、2欄×6排、手勢及固定按鈕 |
| public/votes.js、vote-ui.js | 第56章草稿、完成統計、鎖定與PK票型 |
| public/timer.js、sw.js | 計時與分批離線快取 |

先讀最新定稿，再查現有代碼與測試；沿用共用引擎。不得自行改字幕、房規及核准人物／SVG，保留女巫「今晚他死了，你要使用解藥嗎？」。舊存檔缺少的歷史不得補造。

## 完整規格與歷史

README只作索引，完整文字保留在文件，沒有刪除遊戲規則。

- [第1～47章](docs/specification.md)：基礎字幕、角色、死亡、勝負與白天流程。
- [第48～57章與既有紀錄](docs/specification-current.md)：最新明確修訂優先。
- [第57章定稿](docs/specification-current.md#chapter-57)：57.1～57.13完整原文及本輪完成註記。
- [第56章票型](docs/specification-current.md#chapter-56)；[第52章假面／舞者](docs/specification-current.md#chapter-52)。
- [較早第57章歷史原文](docs/archive/fragrance-spec-initial.md)：保留劇本與早期規格，避免重複章號；現行以最後定稿為準。
- [上一輪報告](docs/ui56-implementation-report.md)；其他原報告仍保留於docs。

## 驗收及待辦

702項測試全通過；全配置468局壓力，另100局新板不同種子；35局全板畫面回歸＋兩指定劇本，第56章票型13組通過。正式站67項摘要及新板操作通過。

FV57-01～23模型／桌面通過；24文字、版面及完整資源離線通過，**實體iPhone Safari／iOS PWA／Android／低階裝置仍待驗收**。首次使用需連線完成快取；極長局localStorage容量風險保留。首次失敗與修正／重跑原因見 [報告](docs/fv57-report.md)，不以桌面數據冒充真機。
