# 狼美人／騎士更新與黑箱、壓力驗收報告

日期：2026-10-12。需求基準 main@1758ef4351b3a0b4eb7f843db14a88895e11943b；App 基底 feat/eclipse-host-app@0a14cf26e31f70aad82fd243592a57ad997a9b3b。保留基底的特殊接刀者名稱修正。程式測試已完成，部署資訊待正式站驗證後補記。

## 完成功能與修正

| 項目 | 完成內容 |
|---|---|
| 兩個一般板子 | beauty10／beauty12 精確角色配置、首頁選擇、首夜先認狼美人、最後認騎士；次夜不再認騎士 |
| 狼美人 | 共同狼刀、禁止自刀／自爆、空魅惑、不能連續同目標、隔空魅可再選、原始座位標記跨階段保留 |
| 殉情 | 合法毒／放逐／槍擊觸發；兩個房規獨立持久化；同批判勝負且狼人優先；夜間死亡公告不揭露死因 |
| 去重與獵人 | 既有正式死亡不重複死亡／記卡；狼刀後同夜殉情禁槍但不造卡；合法已開出的槍不取消；殉情無遺言 |
| 白天公告 | 放逐／合法槍擊後有實際殉情才顯示獨立公告；既定遺言後按下一步；終局不補警徽 |
| 騎士 | 正常白天投票前獨立入口；選他人、二次確認；取消不扣技能；確認結算一次；結果頁下一步不重算 |
| 決鬥續接 | 成功略過投票到下一夜；失敗回原白天／發言進度；未終局警徽處置；決鬥狼美人不殉情、無遺言 |
| 正式素材與復盤 | 原始 Drive 兩圖／三 SVG，逐檔 SHA256；魅惑與實際殉情各一張卡、決鬥一張成敗卡；公開主持不洩露目標職業 |
| UI 修正 | 初次進復盤正確定位頂端，手動捲動不反覆拉回；空魅惑選取狀態正確；首夜辨識提示明確先點狼美人；房規置於原本「本局規則」；保留雙欄座位與固定底欄 |
| 恢復 | v14 相容 v1～v13，完整歷史快照／重新整理／重新一局，不補舊局缺漏事件 |
| PWA | council-v14-1；beauty.js 屬核心離線檔；正式圖示／PNG 加入靜默分批預載與雜湊版本清單 |

## 測試結果

- 全套 `node --test`：546 項通過，0 失敗、跳過。含新板 42 項定向測試；既有全部板子、狼刀在先、女巫、警長、PK、投票、死亡連鎖、混血兒、幸運兒與回退回歸通過。
- 額外 API 黑箱壓力三輪，seed offset 1000／2000／3000，各 23 配置×12 局：共 828 局、90,234 次 API 操作。操作由公開 API 完成，混合屠邊／屠城、警長、自爆、感染、魅惑、決鬥及間歇刷新／回退；三輪全部通過。
- 專項 DOM：四組 10／12 人決鬥成功／失敗、取消、刷新、完整回退；四種主持尺寸 320×568、390×844、768×1024、1024×768；終局殉情獨立公告與復盤卡、恢復頂端；五個正式素材 HTTP SHA256 比對。這些使用明列的存檔 fixture；另用完整新局黑箱驗證主持主流程。
- 長復盤 fixture：40 晚／40 天、五尺寸（含 844×390）、150% 字級、固定底欄、雙欄最終身分、共用背景與刷新通過。這是版面 fixture，不宣稱 40 天真實對局。
- 完整瀏覽器黑箱：32 局，涵蓋全部 23 配置，以及感染／毒殺感染者、機械通靈、惡靈反傷／夜槍免疫專項；回退／刷新／重新一局全部通過。26 角色圖鑑逐字核對、4 種主持版面、20 張更新圖鑑原畫與 48 個現用素材離線 HTTP 載入通過，0 pageerror。首夜提示校對後另重跑 10／12 人新板完整黑箱、圖鑑與離線通過。
- JavaScript 語法檢查、快取雜湊檢查與 `git diff --check`；靜態原生 JavaScript 專案，未配置額外 TypeScript 或 bundler 建置。部署 CI 執行相同測試並打包 public。

初輪失敗項已分類處理：舊測試 v13／21 板基準更新；壓力 harness 遇到已判勝但尚須殉情公告的流程不應提前停止；提前狼刀測試需於合法防護階段測試而非返回已結算階段；素材載入測試採正式新圖數量與原尺寸。未因此改寫字幕或既定遊戲規則。

## 規格衝突與未驗收

第 49 章允許已觸發的白天殉情公告在終局畫面前展示，優先於舊「終局立即跳畫面」的概括敘述；仍禁止補執行技能與警徽。其餘未發現需要新增規則才能實作的衝突。

實體 iPhone Safari、已安裝 iOS PWA、Android、低階手機、雙指縮放／慣性捲動尚未驗收。本輪依使用者先部署供真機驗收的授權進行；桌面 Edge 與尺寸模擬不能代替真機。

壓力測得最大 JSON 存檔 3,690,878 bytes。後續優化先量測真機儲存耗時、配額與長局延遲，再評估快照儲存方式；本輪不減少回退歷史，不任意更換保存架構。

## 修改檔案

- 引擎／資料：public/beauty.js（新增）、engine.js、night.js、data.js、records.js、recap.js。
- 介面／離線：public/app.js、index.html、sw.js、cache-manifest.js。
- 素材：public/art/catalog/beauty.png、duelist.png；public/skills/icon-charm.svg、icon-heartbreak.svg、icon-duel.svg（五檔新增，正式原始 bytes）。
- 測試：test/beauty.test.js（新增）、stress.test.js、classic.test.js、nightmare.test.js、engine.test.js、readme48.test.js、council.test.js、complete-recap.test.js、pwa.test.js。
- DOM／快取驗收：scripts/beauty-ui-regression.mjs（新增）、ui-regression.mjs、cache-regression.mjs、next-ui-regression.mjs、verify-deployment.mjs。
- 文件：README.md、docs/assets.json、beauty-assets.json、beauty-validation.json、beauty-report.md。

## 重跑方式

`npm test`；`node scripts/update-cache-manifest.mjs --check`。瀏覽器驗收需 Playwright 與 Edge：`node scripts/ui-regression.mjs`、`node scripts/beauty-ui-regression.mjs`、`node scripts/complete-recap-ui.mjs`。獨立專項由 UI_INFECTION_SCENARIOS／UI_MECHANICAL_SCENARIOS／UI_KNIGHT_SCENARIOS 啟用；壓力由 STRESS_SEEDS／STRESS_OFFSET 控制。Playwright 路徑可透過 COUNCIL_PLAYWRIGHT_MODULE 設定；使用獨立無頭瀏覽器，不操作使用者個人 profile。
