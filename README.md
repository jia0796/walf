# 月下議會｜狼人殺主持工具

真人法官PWA：固定字幕、座位角色／技能、夜間傷害與勝負、警長／PK／票型、發言計時、上一步、重整恢復及完整復盤。

[開啟App](https://jia0796.github.io/wolf_Emcee/) · [UI-01～33驗收報告](docs/ui33-report.md) · [原始驗證資料](docs/ui33-validation.json)

## 目前版本

**UI-01～UI-33已實作並保留於 `feat/ui-01-33-redesign`，依使用者要求已回退正式網站。** 現在線上為 `feat/eclipse-host-app` 的 `aee428d`，其全部 App 檔案與改版前備份 `359a66b` 完全一致（[回退部署紀錄](https://github.com/jia0796/wolf_Emcee/actions/runs/38693357409)）。新版未合併至原開發分支或 main，備份與新版提交均保留。

存檔維持 **v22**，v1～v21相容及完整回退歷史不變。快取維持 `council-v22-2`，沿原有下載、續載及更新策略；未新增遷移、圖片或SVG。

回退前 UI33 正式站曾逐檔核對 HTML／JS／CSS，UI33 線上15組通過；接刀15組、可達性12組通過。最後補正慢渲染時的首頁雙擊連跳，220ms忙碌情境與五尺寸回歸通過；791項及26板468局再次通過。完整問題與測試紀錄見驗收報告。

## 本輪已新增及調整

| 區域 | UI編號／方案 | 已實作 |
| --- | --- | --- |
| 首頁 | 01～05／AAAAA | 原入口、暗紫藍古金玻璃、短轉場、防連點、原問題回報 |
| 人數 | 06～08／AAA | 10／12人垂直卡、動態板子資訊、彈性字級 |
| 板子 | 09～11／AAA | 完整名稱、一般／特殊分段、獨立捲動清單 |
| 配置與房規 | 12～15／ABBA | 狼／好雙欄、一般／專屬摺疊、條件夜序分頁、固定雙按鈕 |
| 主持 | 16～21／AAAAAA | 原2×6座位、字幕優先、可捲法官及座位區、雙層底欄、儲存失敗警示 |
| 圖鑑 | 22～25／CAAC | 三欄完整原畫、固定分類、長文翻面、遮罩關閉及焦點／捲動恢復 |
| 結束／復盤 | 26～29／BAAA | 勝利結果置頂、日夜時間軸、逐事件融合背景、收合三欄身分及固定雙按鈕 |
| 計時器 | 30～33／AAAA | 中央雙模式、44px滾輪、圓環倒數、狀態文字、250ms轉場及減少動態 |

**舊版視覺規格以本輪定案取代**：最終身分不再使用舊雙欄常駐版型；改為單一預設收合三欄面板。房規改一般／專屬分組，板子顯示完整名稱。舊報告的歷史測試結論保留；遊戲規則、字幕、文案及正式資料沒有因此改動。

## 支援板子與不變功能

共26配置：[完整板子與角色資料](https://github.com/jia0796/wolf_Emcee/blob/feat/ui-01-33-redesign/public/data.js)。

| 人數 | 一般 | 特殊 |
| --- | --- | --- |
| 10人 | 8款 | 覺醒石像鬼／守墓人、種狼／隱狼、尋香魅影／覺醒預言家 |
| 12人 | 10款 | 覺醒石像鬼／守墓人、種狼／隱狼、狼兄狼弟／黑市商人、假面／舞者、尋香魅影／覺醒預言家 |

既有角色配置、房規預設、夜日順序、技能、防護、死亡批次、狼刀在先、勝負、警長／PK／票型資格及全部回退歷史不變。

- 女巫固定「今晚他死了，你要使用解藥嗎？」；藥用完仍保留字幕，同晚不能用兩瓶。
- 四角色在專屬階段接基本刀，閉眼下一步才提交；接刀後狼人階段仍完整顯示襲擊字幕，不能再次選刀或重複記錄。
- 機械狼額外刀維持在技能階段，與基本刀獨立；女巫只得知基本刀刀口。
- 尋香魅影能力用完仍保留字幕；白天先公告原出局者再公告殉情；攝夢連攝標記保留x2。
- 計時器原預設01:00；重置回當次已開始的設定，重設回01:00；關閉視窗不擅自停表。重新一局及回首頁仍先確認，清除語意不變。

完整接刀規格及歷史發布文字已移至 [現行功能規格](docs/takeover-current-spec.md)；[接刀報告](docs/takeover-nightknife-report.md)保留原始驗收與補正紀錄。

## 執行與測試

Node.js 22以上；沒有執行期套件依賴。

```sh
git switch feat/ui-01-33-redesign
npm start
npm test
```

本機 `http://localhost:5173/`。原生JS靜態PWA，沒有獨立build或TypeScript檢查。瀏覽器驗收使用Playwright；指定現有模組路徑至 `COUNCIL_PLAYWRIGHT_MODULE`，可執行 `scripts/ui33-ui.mjs`、`scripts/ui33-accessibility.mjs`、`scripts/ui-regression.mjs`。分階段與完整執行命令、結果見報告。

## 架構與規格入口

| 檔案 | 責任 |
| --- | --- |
| public/index.html、style.css、app.js | UI、導覽及法官操作呈現 |
| public/recap.js | 既有復盤資料模型與本輪時間軸／卡片呈現 |
| public/data.js | 正式角色原文、板子、房規及素材；本輪不改 |
| public/engine.js、night.js、takeover.js、fragrance.js | 階段、回退、保存、技能、傷害及勝負；本輪不改 |
| public/records.js、votes.js、vote-ui.js | 正式事件、票型與投票介面；本輪不改 |
| public/timer.js、sw.js、cache-manifest.js | 原計時器狀態機及分批快取；本輪不改 |

- [UI-01～33設計定案](docs/ui-01-33-design-spec.md)及[原Codex工作單](docs/codex-ui-01-33.md)：A/B/C方案維持原定案；實作結果以報告為準。
- [第1～47章](docs/specification.md)、[第48～57章](docs/specification-current.md)、[第56章票型](docs/specification-current.md#chapter-56)、[第57章尋香魅影](docs/specification-current.md#chapter-57)：規則與正式字幕依最新定稿，歷史視覺由UI33取代。
- [較早第57章歷史](docs/archive/fragrance-spec-initial.md)、[尋香魅影報告](docs/fv57-report.md)、[完整復盤歷史報告](docs/complete-recap-report.md)：保留，不把舊測試數字改作本輪結果。

## 本輪驗收、限制與回退

791項自動化測試全部通過；最終26配置×18種子共468局、35局完整介面對局及45組既有檢查、15組UI33定向、15組接刀、13組票型、兩種人數尋香魅影完整對局、40晚40天五尺寸復盤、計時器T01～T08及12組放大文字／安全區／模擬縮放檢查通過。詳見[逐項驗收及失敗修正紀錄](docs/ui33-report.md)。

**真機未驗收**：iPhone Safari、iOS安裝PWA、Android、低階裝置的動態工具列、安全區、慣性捲動、真實雙指縮放、長局存檔及玻璃效果效能。首次離線需先連線完成原有快取；localStorage長局容量及單主持分頁限制保留，不刪回退歷史來降低用量。

**唯讀原始備份**：[backup/pre-ui33-20261015](https://github.com/jia0796/wolf_Emcee/tree/backup/pre-ui33-20261015)，Commit `359a66b66f61ba5dfdb56b1c3a1992de6150073b`。禁止修改、刪除、重置或強推。六階段獨立Commit與安全反向提交方法見報告；不直接用備份覆蓋後續工作。
