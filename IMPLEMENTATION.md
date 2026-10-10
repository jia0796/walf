# 執行與接管

規格：main README.md，1efd09f。基礎：feat/eclipse-host-app，c8cbda4。工作分支：feat/eclipse-host-app，使用者已確認行動資格並授權合併部署。狀態與驗收事項見 [白痴／混血兒驗收報告](docs/classic-report.md)。

Node.js 22+，不需安裝套件。執行 `npm start`，開啟 http://127.0.0.1:5173；`npm test` 執行測試。這是原有 JavaScript 靜態 PWA，無 TypeScript 或獨立建置命令。發布內容為 public/，不得擴大部署工作流程的分支範圍。

- data.js：九種配置、角色圖鑑原文及核定圖片。
- night.js：共用狼隊權限、交換、恐懼、夢遊防護、分批傷害、真實陣營勝負。
- engine.js：同一主持狀態機、選擇鎖定、死亡連鎖、提前終局、首夜辨識、v8 完整回退與 v1–v7 升級。
- records.js：當下操作與結算快照、逐板子排序、執行狀態、原始／實際目標、獨立白天事件。
- recap.js：結束頁復盤卡片；主持頁不使用人物背景技能卡。
- app.js／style.css：精簡法官控制、既有 2 欄×6 排座位、正式技能標記、圖鑑與復盤。
- sw.js：v8-1 快取、白痴 PNG、混血兒 JPEG 與榜樣 SVG。
- docs/assets.json：核定素材來源／大小／SHA256，原檔不改繪。
- test/classic.test.js：第 36／37 章；test/nightmare.test.js：第 35 章技能、結算、回退、素材與兼容測試；其他測試保留原板子回歸。
- test/stress.test.js：九種配置各 18 局，走公開選擇／前進／回退 API，穿插 JSON 保存／刷新。

v6 存檔保留原局與復盤；v1–v5 缺少的操作快照不能補造。長局不裁切歷史，多分頁同時主持仍可能互相覆蓋本機存檔。Safari／iOS PWA 冷啟、離線與安全區仍需真機驗收。
