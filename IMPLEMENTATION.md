# 月下議會：執行與接管

規格來源：main README.md，0db34c1，第 1–45 章。程式分支：feat/eclipse-host-app，沿用原有靜態 JavaScript PWA。本次使用者已授權部署程式分支，沒有合併 main 或修改 README。完整結果見 [整合驗收報告](docs/readme45-bug-report.md)。

Node.js 22+，不需安裝套件。npm start 啟動 http://127.0.0.1:5173；npm test 執行 285 項測試。本專案沒有 TypeScript 或獨立 build；GitHub Pages 發布 public/。

- data.js：十七配置、逐字圖鑑文案、正式素材對照、品牌及首頁選單。
- night.js：共用狼隊權限、交換、防護、分批傷害、血月封鎖、狩獵及真實陣營勝負。
- engine.js：主持狀態機、首夜辨識、必要選擇、死亡連鎖、提前終局、v10 完整快照及 v1–v9 升級。
- records.js／recap.js：實際使用事件與原始／實際目標、人物融合卡片、獨立血月最後一刀。
- app.js／style.css／index.html：新品牌首頁、動態人數／短板名、既有 2 欄×6 排主持座位、正式 SVG 標記；主持頁沒有人物背景卡。
- sw.js：council-v10-1 快取，清除舊版快取；正式素材離線使用。
- docs/assets.json：49 個原檔的來源、大小及 SHA256；圖片展示裁切不改原始位元組。
- test/council.test.js：新六款板子、全域終局交叉、素材及回退。
- test/stress.test.js：十七配置各十八局，公開 API 操作、JSON 刷新、回退及重新一局。
- scripts/ui-regression.mjs：獨立 Playwright／Edge 瀏覽器驗收。另行準備 Playwright，環境變數 COUNCIL_PLAYWRIGHT_MODULE 可指定其 index.mjs 路徑，執行 node scripts/ui-regression.mjs；不需要將 Playwright 加入 App 正式依賴。

本機完整歷史不裁切，長局存檔可能增加；只使用單一主持分頁。舊版沒有的歷史不能補造。桌面 Edge 離線與手機／平板尺寸已驗證，實際 Safari／iOS PWA／Android 真機仍需驗收。
新增 identity.js 共用真陣營、接刀原技能權、環狀鄰接與放逐資訊。test/readme45.test.js 驗證新板及第 43 章遺言／字幕；STRESS_SEEDS、STRESS_OFFSET 可指定獨立壓力種子，UI_BOARDS 可指定 UI 重測板子清單。所有正式原 PNG／SVG 保持位元組，五個 WebP 為 README 授權的顯示衍生檔。
