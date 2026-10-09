# 執行與接管
規格來源：main README.md（57f1d62）。App 基礎：feat/eclipse-host-app（d7f08b1）。新增功能在 feat/brothers-merchant-recap；未合併、未部署。

Node.js 22+，不需安裝套件。執行 `npm start`，開啟 http://127.0.0.1:5173；`npm test` 執行測試。專案為靜態 PWA，沒有獨立編譯／build 命令，發布內容仍是 public/。測試及發布流程不可自行改成自動發布這個分支。

- public/data.js：五款人數配置、角色與圖鑑原文；狼兄狼弟／商人只有 12 人。
- public/night.js：共用交換映射、狼隊參與資格、偽裝查驗、復仇與幸運兒技能合法性、獨立傷害、真實陣營勝負及勝利原因。
- public/engine.js：同一日夜狀態機、必要選擇、技能額度、死亡連鎖、逐槍判勝負、回退、v6 存檔升級。既有警長／PK／吞徽流程共用。
- public/records.js：操作確認快照、夜間正式死亡、按板子／夜晚階段排序的復盤資料。事件不依最後死者反推。
- public/recap.js：主持技能卡／復盤卡共用正式圖示和人物背景，結束頁獨立展開夜晚。
- public/app.js、index.html、style.css：保留座位布局，新增技能操作、結束頁、固定按鈕與確認、首頁參考背景、三排計時器。
- public/timer.js：時間邊界及冷啟／刷新判斷。完整遊戲在 localStorage；分頁畫面在 sessionStorage。
- public/art／skills：核准原檔；來源與 SHA256 見 docs/assets.json。舊六款 SVG 本次重新下載比對，完全一致；新增三款 SVG 和三張角色 PNG 未改繪。
- public/sw.js：v6 快取，包含全部新模块及正式素材。
- test/brothers.test.js、recap.test.js：新增規則、疊加／回退、復盤／刷新／重新一局／正式素材驗證。
- test/stress.test.js：五個配置各 18 局，用公開選擇／前進／回退 API 走完整遊戲，穿插 JSON 保存／刷新。

詳細驗收、實際修改檔案、已知限制與待確認規則，見 [功能驗收報告](docs/feature-report.md)。118 項測試包含 90 局完整對局；真實 Safari、iOS PWA 冷啟／離線與安全區仍待真機驗收。

舊版不具完整操作快照，不能保證追回升級前復盤；保留舊遊戲狀態及歷史，明示缺失。長局仍完整保存快照，未裁切回退歷史或更換資料庫。多分頁同時主持仍可能互相覆蓋本機存檔，應只用一個主持分頁。
