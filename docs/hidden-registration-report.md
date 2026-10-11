# 隱狼登記時機修正與宣傳圖交付

規格依據：main@f96e362 README；實作沿用 feat/eclipse-host-app。已部署程式 [ec058db](https://github.com/jia0796/wolf_Emcee/commit/ec058dbe613fa462eb6c4d659f9faa341f66c6bd)，[CI](https://github.com/jia0796/wolf_Emcee/actions/runs/38138753094) 與 [部署](https://github.com/jia0796/wolf_Emcee/actions/runs/38138753092) 均成功。正式站實測隱狼必選、未登記狼刀目標、刷新及 council-v13-2 通過，沒有 pageerror。

## 修正

1. 開局確認不再要求隱狼；角色仍留待辨識，不自動分配。
2. 首夜「隱狼請睜眼」點選恰好一名合法未辨識玩家；未選／取消時鎖住下一步，已登記的其他角色不可選。
3. 狼刀可以先指定待登記座位，登記身分後按原規則結算。守護、救藥、同守同救、查驗為好人與公告前仍存活均經驗證。
4. 上一步、換座位、刷新保留或撤銷完整狀態；第二晚不再認隱狼；既有預先選過隱狼的 v13 存檔相容。
5. PWA 快取更新 council-v13-2 與資源摘要；黑箱／壓力／線上驗證脚本同步登記時機。圖鑑文案測試容許 Windows CRLF，不改定稿文案。
6. README 執行指令的目錄改為 wolf_Emcee，修正儲存庫更名後 clone 指令的目錄不一致。

## 驗收

| 項目 | 實際結果 |
|---|---|
| 全部 Node 測試 | 454 通過、0 失敗、0 跳過，含 12 個新增定向案例 |
| 三組不同種子壓力 | 1,512 完整局、164,688 次公開 API 操作，最大存檔 1,725,030 bytes |
| 瀏覽器黑箱 | 21 配置全部完成終局、回退、刷新、重新一局；沒有 pageerror |
| N03／N04 專項 | 10／12 人開局不預選、待辨識狼刀、必要選擇鎖定、刷新與回退重選均通過 |
| UI／素材 | 四種手机／平板尺寸、24 圖鑑、既有素材及離線檢查沿用黑箱腳本通過 |
| 建置／型別 | 原生 JS 靜態網站，專案沒有獨立 build 或 TypeScript 檢查 |

實測細節見 [validation.json](hidden-registration-validation.json)。沒有將桌面測試宣稱為手機真機通過。

## 宣傳圖

以本版實際擷取的首頁、角色圖鑑、12 人選板、黑狼王／魔術師確認頁、第二晚主持頁及終局復盤製作六畫面宣傳圖。原始截圖與生成成果保存在 output/promo，沒有修改 App 的已核准人物原圖。

內建 image_gen 生成，成果 moon-council-promo.png（1536 × 1024），提示詞記於 output/promo/prompt.md。圖片是本機交付檔，不混入 App 執行素材。

## 限制與後續優化

- 實體 iPhone Safari、iOS 安裝 PWA、Android／低階裝置與表單實際收件仍未驗收；依既有授權先部署供真機驗收。
- 儲存庫更名已改變 App URL 路徑；舊 /walf/ 的主持存檔、PWA 安裝與離線快取移轉沒有自動驗證，不承諾自動搬移。
- 長局資料量仍需真機量測；IndexedDB、多分頁同步尚未定稿，未擅自加入。
- 宣傳圖為生成的排版，細小 UI 字體以實際截圖與 App 為準。

## 修改檔案

public/engine.js、app.js、sw.js、cache-manifest.js；test/hidden-registration.test.js、next-update.test.js、pwa.test.js、readme48.test.js、stress.test.js；scripts/ui-regression.mjs、hidden-registration-ui.mjs、verify-deployment.mjs、cache-regression.mjs、next-ui-regression.mjs、capture-promo-reference.mjs；README.md 與本輪規格／報告／統計。沒有修改角色人物、正式 SVG 或傷害引擎規則。
