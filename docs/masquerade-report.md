# 假面／舞者與特殊板子分類｜實作、Bug 與驗收報告

## 規格與架構

依 main@625c490、App README@61fe445 第 52 章實作。使用者本輪補充確認：完整角色順序採「舞者 → 假面 → 狼人 → 女巫 → 預言家 → 白痴（僅首夜）」；復盤沿用先前夜間事件卡版型。這兩項補充優先於原文未列順序／未決卡片呈現方式，不改寫角色技能與固定字幕。

既有純 JavaScript PWA：data.js 提供板子及角色；engine.js 管主持／選擇／快照；night.js 管傷害及勝負；records.js 保存事件；recap.js 顯示復盤；app.js 操作現有介面。新增 masquerade.js 僅提供本板候選人、接刀資格及判定陣營輔助，沒有另建死亡或白天引擎。

## 已完成

- 僅 12 人假面／舞者：3 普通狼＋假面、舞者／預言家／女巫／白痴、4 平民；固定屠邊。假面存活不因普通狼全滅誤判好人勝。
- 首夜僅在各自睜眼階段登記舞者／假面，普通狼人只登記三狼。第二晚起舞者必選三名存活、不同、整局未共舞者，可選自己；不足三名跳過選擇頁，仍保留睜閉眼。死亡角色保留可執行的既定字幕，操作停用。
- 共舞三人同判定陣營無死亡、兩比一少數死亡；舞者參與則三人免狼刀。舞者及假面免毒，毒藥合法使用仍消耗及留事件。
- 假面查驗必選，結果僅「有參與共舞／未參與共舞」；賦面可選任意合法存活玩家，自己／未共舞者均合法，可空過。查驗與賦面分開記連續限制，空過只重置賦面。
- 賦面只反轉當晚共舞判定陣營；真實身分、預言家結果、狼位／神位／民位及勝負計數不變。
- 普通狼正式全滅後下一合法夜晚假面接基本刀，同晚仍查驗、賦面；不能自爆或自刀。普通狼人仍可合法選擇假面為刀口。
- 新板先保存合法夜間選擇，於正式結算先套防護／解藥及狼刀並判勝負；未終局再結算共舞＋毒藥，同一批死亡去重但保留來源。其他板子的原結算時點不變。
- 狼刀提前終局後，共舞／賦面／毒藥未結算者標示「未結算（遊戲已結束）」；不生成後續死亡或反轉。已選刀不因當晚後續施法者死亡而取消。
- 新房規「白痴翻牌後仍計入存活神職」預設關閉。翻牌保持實際存活，關閉時不計入存活神職，可能立即狼勝；開啟時仍計入。沿用禁票／禁再放逐／警徽流程。
- 「覺醒板子」改稱「特殊板子」；10 人包含覺醒石像鬼／守墓人、種狼／隱狼；12 人另含狼兄狼弟／黑市商人、假面／舞者。一般清單移出已搬移板子，其餘相對排序維持，板子 ID 不變。
- 正式兩張 PNG、藍框共舞 SVG、紅框面具 SVG 整合圖鑑、技能操作／座位標記與復盤；主持無人物背景。圖鑑技能／目標、7 句新字幕與 README 逐字比對。
- 復盤共舞卡列三名身分、真實／判定陣營、舞者參與／免刀與結果；假面查驗、賦面、接刀分開保存事件快照，不以終局身分倒推。保留遊戲結束置頂、好人神職先於平民及原人物背景融合版型。
- 存檔 v16 相容 v1～v15 與全部歷史快照；完整回退、刷新及重新一局。快取 council-v16-1，57 正式素材摘要；新規則模組為 CORE，人物／SVG 保留靜默分階段快取。

## 本輪修正與驗證發現

1. 分類移動後測試腳本仍從一般清單找種狼，調整選取入口與清單預期。
2. 防止三人選擇提交後，已參與名單立即使當前流程移除選擇頁而返回錯誤階段；當晚已確認流程保持穩定。
3. 引擎拒絕重複座位的偽造／恢復共舞資料，不能只依 UI 三人上限。
4. 未共舞者賦面仍合法，不把選擇等同反轉成功；空過卡不產生「未記錄玩家」假對象。
5. 共舞死亡來源明確記夜間，狼刀提前勝利時不把預測共舞死亡放進正式死亡資料。
6. 不把普通狼人刀假面與假面自刀混為同一禁選限制。
7. 死亡角色保留字幕、首夜登記補法官提示；不足三名才依新規格省略共舞選擇。
8. 舊素材清單測試由 20 更新為 22 張，新增素材皆維持原始 PNG／SVG 位元組，未重繪。

## 驗收與實測

- 最終 `node --test`：**607／607 通過、0 失敗**，其中假面／舞者 25 項定向測試；覆蓋 MD-01～MD-21 的規則、共用流程及來源比對。
- 額外三輪固定 seed 壓力：**864 局、95,399 次公開 API 操作**，全部終局。測試刷新、上一步重播、房規、隨機合法技能、自爆、決鬥及重新一局。
- 最後字幕調整後，新板再測 **36 局／4,615 次操作**；最大全局 UTF-8 JSON 3,267,568 bytes。本輪三輪全板最大 3,776,193 bytes，數值不代表瀏覽器容量或無限長局效能驗收。
- 全板完整 DOM 黑箱：**33 局／3,027 次操作**（24 配置＋9 特殊情境）、0 JavaScript 錯誤。最後只影響新角色字幕的調整後再跑新板完整 DOM。
- 定向 DOM 五尺寸：三人必選、假面查驗、未共舞賦面、SVG、原 PNG、回退、刷新、免刀後毒殺、事件復盤及待死亡座位均通過。復盤尺寸測試使用已實際執行事件的完成頁 fixture；全板黑箱則真正玩到終局。
- 五尺寸×10／12 人共 **200 輪**分類切換、選板、房規、返回及 150% 字級操作通過；分類回復正確、底部僅按鍵、無水平溢出。
- 圖鑑 28 角色、22 張 catalog 原 PNG、**52 項現用素材離線**通過；cache-manifest 57 項摘要檢查通過。
- `git diff --check` 及修改 JS 語法檢查通過；本專案沒有獨立 TypeScript 或打包 build，部署沿用既有 public/ 工作流程。

| README 驗收 | 狀態／證據 |
|---|---|
| MD-01～MD-16 | test/masquerade.test.js；配置、首夜、共舞、免毒、查驗、賦面、接刀、狼刀優先、同批雙勝與白痴開關 |
| MD-17 | masquerade-copy-check.json、masquerade-assets.json、圖鑑 DOM、正式 PNG／SVG |
| MD-18～MD-19 | masquerade-ui.mjs 五尺寸、原共用復盤測試；事件快照、真假陣營、未結算結果 |
| MD-20 | v15／歷史快照遷移、上一步、改選、刷新、重新一局；全局 API 壓力及 DOM |
| MD-21 | 全部既有板子 607 測試與 33 局 DOM；夜間、白天、警長／PK、勝負及復盤回歸 |
| MD-22 | 桌面 Edge 五尺寸／模擬安全區／離線通過；**實體 iPhone Safari、iOS PWA、Android、雙指縮放與長局效能尚未驗收** |

## 修改檔案

程式：public/data.js、app.js、engine.js、night.js、records.js、recap.js、index.html、sw.js、cache-manifest.js；新增 public/masquerade.js、art/catalog/mask.png、dancer.png、skills/icon-mask.svg、icon-dance.svg。

測試：新增 test/masquerade.test.js、special-boards.test.js、scripts/masquerade-ui.mjs、special-boards-ui.mjs；更新 scripts/ui-regression.mjs、verify-deployment.mjs、hidden-registration-ui.mjs、rules50-ui.mjs、rules51-stress.mjs、cache-regression.mjs、next-ui-regression.mjs；更新 test/stress.test.js、readme48.test.js、council.test.js、pwa.test.js、complete-recap.test.js、beauty.test.js、classic.test.js、engine.test.js、nightmare.test.js 的分類／素材／快取／版本相容預期。

既有角色原文、主持字幕、底部無框按鈕、一般 UI 與正式素材不做其他更改；新板技能模組與新場景所需變更為本輪範圍。

## 待驗收與優化建議

- MD-22 真機項目待驗收；沿用使用者先部署供真機驗收的授權，沒有宣稱實體裝置通過。
- 壓力測得完整 history 快照可超過 3 MB。建議下一輪在真機量測儲存容量、序列化與回退速度，再討論縮減重複快照；本輪未擅自改快照格式／回退語意。
- 延用先前事件卡是本輪使用者確認；不另建未定稿的玩家個人卡版型。

## 執行與部署

Node.js 22 以上：`npm test`、`npm start`。額外壓力可設定 STRESS_SEEDS／STRESS_OFFSET 後跑 `node --test test/stress.test.js`；瀏覽器需可取得 Playwright，跑 `scripts/ui-regression.mjs`、`scripts/masquerade-ui.mjs`、`scripts/special-boards-ui.mjs`。本次使用隔離 Edge，沒有讀寫個人瀏覽器資料。

程式：43f6de44c153b731b8113c86effa848e184a0c1a，feat/eclipse-host-app。[測試 CI](https://github.com/jia0796/wolf_Emcee/actions/runs/38257255109)／[部署](https://github.com/jia0796/wolf_Emcee/actions/runs/38257254728) 成功。[正式站](https://jia0796.github.io/wolf_Emcee/) 28 項程式／素材 SHA256 與本地一致，特殊清單、假面舞者首夜登記、白痴房規開關／保存、刷新、種狼與計時器回歸、council-v16-1 快取通過，0 JavaScript 錯誤；main 僅更新文件，不合併 App。

## 實際 DOM 截圖

![320×568 主持中的賦面與座位標記](masquerade-host-320.png)

![390×844 共舞、假面查驗事件復盤](masquerade-recap-390.png)

截圖為隔離桌面 Edge 的實際 DOM。復盤圖片來自定向 fixture，用於驗證版型，不宣稱圖中的勝負為完整黑箱對局結果；真正終局由上述完整 DOM 黑箱另行驗證。
