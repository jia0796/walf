# 尋香魅影／覺醒預言家｜FV57交付與驗收報告

2026-10-14。依main `ffe0f48` 最後一段57.1～57.13定稿，沿用App `f076b54`。沒有重建App，沒有合併程式到main。程式 [62316d7](https://github.com/jia0796/wolf_Emcee/commit/62316d7d3c78bc0c5dfbf9231130f9b37b4ffe25) 已部署。

## 完成功能

- 10／12人特殊板子、獨立角色ID、正確角色數與房規、首夜登記及不同首／次夜順序。
- 首夜只抽一次普通狼，認狼值整局固定；其餘綁定／死亡／消耗／警徽等依完整快照回退。
- 雙向雙人綁定、可選自己、不綁定不耗用、下夜到期、觸發永久耗用、施法者死後舊綁定有效；普通狼全滅後原狼人階段接刀。
- 覺醒預言家雙查驗，原手勢與動畫，復盤好人／壞人文字；普通預言家保持單查。
- 防護後才確定原死亡及殉情，同批結清後判勝，毒／槍分批，狼人同批優先，終局停止後操作。
- 雙人綁定／雙查驗／實際觸發者殉情／接刀復盤；核准人物融入背景，原主持座位維持文字／SVG及圖鑑入口，不新增人物技能卡。
- 「空恐」按鈕僅更名「不恐懼」。

## 檔案與用途

| 檔案 | 用途 |
|---|---|
| public/fragrance.js | 獨立綁定資料、一次認狼、雙向原子殉情 |
| public/data.js | 角色逐字文案、兩板、房規、素材與夜序 |
| public/engine.js | 新階段、雙選、回退／v21遷移、批次提交、合法公告 |
| public/night.js | 既有防護後接入綁定、獨立後批、接刀actor |
| public/records.js、recap.js | 當時真實身分、新事件與雙人原畫卡 |
| public/app.js | 原選座與手勢、必要選擇、私密提示及單一按鈕更名 |
| public/sw.js、cache-manifest.js | v21與新資源、91項摘要；暖快取架構未改 |
| 新PNG／WebP／SVG、docs/fv57-assets.json | 原檔匯入、縮圖、校正版來源／摘要 |
| 新兩個測試檔 | 53項技能、特殊情境、兩個完整引擎劇本 |
| 其他測試／腳本 | 新配置數量、版本與合法操作驅動；原技能斷言保留 |

實際程式提交清單：

- `docs/fv57-assets.json`
- `public/app.js`
- `public/art/catalog/awakenedSeer.png`
- `public/art/catalog/fragrance.png`
- `public/art/thumbs/awakenedSeer.webp`
- `public/art/thumbs/fragrance.webp`
- `public/cache-manifest.js`
- `public/data.js`
- `public/engine.js`
- `public/fragrance.js`
- `public/night.js`
- `public/recap.js`
- `public/records.js`
- `public/skills/icon-bond.svg`
- `public/sw.js`
- `scripts/followup-ui.mjs`
- `scripts/fv57-ui.mjs`
- `scripts/next-ui-regression.mjs`
- `scripts/ui-regression.mjs`
- `scripts/verify-deployment.mjs`
- `test/beauty.test.js`
- `test/classic.test.js`
- `test/complete-recap.test.js`
- `test/council.test.js`
- `test/engine.test.js`
- `test/fragrance-e2e.test.js`
- `test/fragrance.test.js`
- `test/masquerade.test.js`
- `test/nightmare.test.js`
- `test/pwa.test.js`
- `test/readme48.test.js`
- `test/special-boards.test.js`
- `test/stress.test.js`
- `test/ui54.test.js`
- `test/votes.test.js`

文件交付另更新：

- `README.md`：72行入口索引。
- `docs/specification-current.md`：完整定稿與歷史交付狀態。
- `docs/archive/fragrance-spec-initial.md`：較早第57章原文。
- `docs/fv57-report.md`、`docs/fv57-validation.json`：逐項結果與原始數據。
- `test/next-update.test.js`：原文斷言改讀完整規格，並加兩新角色。
- `scripts/fv57-ui.mjs`、`scripts/verify-deployment.mjs`：正式站驗收等待／並發及新分類檢查加強。

C01原文斷言移至完整規格來源，八段舊角色文字仍逐字檢查，再加兩新角色；沒有刪舊技能／勝負斷言。

## FV57逐項驗收

| 編號 | 結果 | 範圍 |
|---|---|---|
| FV57-01 | 通過（模型／桌面） | 配置、特殊分類、屠邊、房規 |
| FV57-02 | 通過（模型／桌面） | 首夜／次夜不同順序 |
| FV57-03 | 通過（模型／桌面） | 一次認狼、刷新／回退固定、無認狼卡 |
| FV57-04 | 通過（模型／桌面） | 雙選上限、自己、取消、第三人不更動、必要選擇 |
| FV57-05 | 通過（模型／桌面） | 不綁定不耗用、跨夜到期、同組再綁建卡 |
| FV57-06 | 通過（模型／桌面） | 實際首夜登記延後傷害至女巫救治機會 |
| FV57-07 | 通過（模型／桌面） | 次夜先綁後刀當晚生效 |
| FV57-08 | 通過（模型／桌面） | 自綁雙向、防護原傷害、連動不可再擋 |
| FV57-09 | 通過（模型／桌面） | 同批各自死亡與重複來源去重、無假殉情 |
| FV57-10 | 通過（模型／桌面） | 永久消耗、已使用頁、接刀不受影響 |
| FV57-11 | 通過（模型／桌面） | 施法者死亡保留舊綁定，白天放逐連動 |
| FV57-12 | 通過（模型／桌面） | 全普通狼死接刀、空／自／正常刀、禁爆、回退恢復 |
| FV57-13 | 通過（模型／桌面） | 雙查好好／好狼、自己、上限、回退重算 |
| FV57-14 | 通過（模型／桌面） | 夜間手勢、復盤好人／壞人文字及SVG、兩真實目標 |
| FV57-15 | 通過（模型／桌面） | 綁定／實際觸發者殉情／接刀快照、原畫融合 |
| FV57-16 | 通過（模型／桌面） | 狼刀與殉情同批、毒與後續槍擊獨立批 |
| FV57-17 | 通過（模型／桌面） | 同批狼人優先、前批終局停止後操作 |
| FV57-18 | 通過（模型／桌面） | 12人殉情獵人禁槍、原狼刀合法槍、槍擊連動 |
| FV57-19 | 通過（模型／桌面） | 夜間不公開死因、日間殉情無遺言、未終局移徽 |
| FV57-20 | 通過（模型／桌面） | 技能、死亡、徽、接刀、終局回退與去重 |
| FV57-21 | 通過（模型／桌面） | 舊板、單查預言家、狼美人、魔術師、舊存檔與票型回歸 |
| FV57-22 | 通過（模型／桌面） | 10人指定完整劇本好人勝 |
| FV57-23 | 通過（模型／桌面） | 12人指定劇本移徽、獵人槍、接刀狼人勝 |
| FV57-24 | 部分通過；真機待驗收 | 不恐懼原功能、桌面版面及完整快取離線；真機待驗收 |

FV57-01～23為模型／桌面已覆蓋情境；雙板共用項均測兩人數，獵人為12人專屬。24文字、桌面模擬與完整資源離線通過，真機未宣稱通過。

## 實測數據

- 最終 **702／702** 自動測試，含53項新增模型／指定劇本。
- 全26配置各18局：**468局／50,402次引擎腳本推進**；新兩板偏移5700各50局：**100局／10,336次**，全數終局。開發中重跑不混入此數。
- 26配置＋9特殊情境：**35局／3,101次主持腳本推進**；指定10／12人DOM劇本另2局（77／100次）。計數為主要流程推進，不是所有觸控／點選次數。
- 第56章票型、草稿、鎖定、PK、回退13組結果通過。
- 320×568、390×844／150%、768×1024／200%、1024×768及模擬安全區，仍2欄×6排、底部按鈕可見。
- 本機55項離線素材正常；正式站新模組／SVG／兩人物離線與兩完整劇本通過，67項部署SHA256吻合。
- public JS語法及91項快取摘要核對通過。沒有獨立build或TypeScript設定，未宣稱執行不存在的建置。

## 素材

兩張1060×1484核准PNG原位元組未改；420×588 WebP只作縮圖，復盤與大圖用原PNG。來源及SHA256見 [fv57-assets.json](fv57-assets.json)。綁定採校正版 `icon-bond-fixed-v2.svg`（Drive `1cUHJVB0zbdGqC9Ak1814-2vflz-RkOAr`），正式檔名 `icon-bond.svg`；完整視覺檢查雙手連接、對稱、尺寸及與殉情SVG一致性。Drive原icon-bond本輪下載已與v2同位元組，仍明確使用v2來源。未修改Drive。殉情／查驗／狼刀SVG沿用。

## 發現、修正與失敗紀錄

1. v4歷史重建沒有新欄位導致空值存取：修正可選鏈條件，原兩項遷移測試通過，未刪歷史。
2. 首夜綁定必須留女巫救治機會：補實際首夜登記的救／不救斷言，避免提前耗用綁定。
3. 通用DOM腳本未列新角色放逐目標：原24板完成後停下；補尋香魅影合法目標，續跑11局通過。未改遊戲判定／預期勝方。
4. 正式站大量摘要請求逾時：改三檔一批、60秒，逐檔原SHA斷言不變；特殊分類預期加明確的新板。
5. 首次正式站離線失敗：診斷顯示僅CORE已快取，三新素材尚未就緒，原工具的非同步等待沒有確實確認完整資源。回首頁讓既有暖快取續作，逐檔等待完整回應內容再斷網，原四個200斷言通過。未修改正式快取機制；首次日誌保留。

## 版本、限制與風險

App分支 `feat/eclipse-host-app`；存檔v21相容v1～v20與完整歷史，快取 `council-v21-1`。[CI](https://github.com/jia0796/wolf_Emcee/actions/runs/38559789847)／[部署](https://github.com/jia0796/wolf_Emcee/actions/runs/38559789851) 成功。[正式App](https://jia0796.github.io/wolf_Emcee/)。main只更新文件。

已覆蓋情境未見尚存規則／死亡／勝負Bug，不能保證沒有未知情況。實體iPhone Safari／iOS PWA／Android／低階裝置、雙指縮放與真機長局未驗收。首次使用須連線完成資源快取；圖鑑／主持前景按既有機制暫停大圖預取，資源未完成即斷網可能缺圖。完整快照仍用localStorage，極長局容量風險保留，未擅改IndexedDB／多分頁同步或刪減歷史。

完整數據：[fv57-validation.json](fv57-validation.json)。README整理成入口索引，定稿角色、字幕、規則完整保留；重複的較早57章另存歷史，不當現行優先版本。
