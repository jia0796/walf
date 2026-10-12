# 第 51 章介面調整與詳細規則移除報告

## 最新定稿與範圍

依 main@98bd0d5 讀取第 51 章；使用者隨後明確指定「那直接移除詳細規則吧」，本輪以此最新指示取代三個詳細規則閱讀入口需求；後續又確認「上一步 開始主持 不要做框了 直接留按鍵」，底欄僅保留按鍵。正式原稿未取得，不自行替代或重寫。獵魔人復盤結果保留使用者確認的「狩獵成功／狩獵失敗」。

## 已修正

- 移除板子預覽的「詳細規則」卡片，以及初始化時載入正文的程式；不建立三個閱讀視窗。
- 原有可操作的「特殊房規」及獨立「夜間順序」仍保留，主持中的「本局規則」仍可查看。
- 12 人一般板子前三張為預女獵白、預女獵白混、狼美人／騎士；其餘相對排序、10 人及覺醒分類不變。
- 板子預覽底部移除底板／外框／模糊效果，僅保留金色「開始主持」與「上一步」按鍵；行為不變，底欄仍保留獨立高度。
- PWA 快取更新為 council-v15-2；存檔維持 v15。沿用遠端已更新的「機械守衛守護規則」名稱。

未修改主持字幕、角色圖鑑、角色配置、技能、死亡結算、勝負引擎、復盤結果文字或正式 PNG／SVG。保留歷史 board-rules.js 及其歷史文字供追溯，但 App 已不再匯入或顯示；不宣稱這份歷史文案為核准原稿。

## 程式與驗證檔案

- public/app.js、index.html：移除卡片與載入呼叫。
- public/data.js：僅調整 beauty12 的清單位置。
- public/style.css：清除被移除卡片的專用樣式、調整預覽底欄。
- public/sw.js：更新快取版本。
- scripts/rules50-ui.mjs：保留原房規、盾、舊局測試，依最新指示更新預覽驗收。
- scripts/rules51-stress.mjs、test/rules51.test.js：新增移除入口與反覆操作驗證。
- scripts/ui-regression.mjs、verify-deployment.mjs、cache-regression.mjs、next-ui-regression.mjs；test/readme48.test.js、pwa.test.js、complete-recap.test.js：同步預期排序、入口及快取版本。

## 執行方式

既有純 JavaScript 靜態 App，Node.js 22 以上執行 `npm test`、`npm start`。本專案未設獨立型別檢查或打包建置；已對修改的前端及測試腳本執行 Node 語法檢查與 `git diff --check`，GitHub Pages 工作流程上傳既有 public/。

瀏覽器回歸：`node scripts/rules50-ui.mjs`、`node scripts/rules51-stress.mjs`；完整主持：設定 UI_INFECTION_SCENARIOS、UI_MECHANICAL_SCENARIOS、UI_KNIGHT_SCENARIOS 為 1 後執行 `node scripts/ui-regression.mjs`。使用可取得的 Playwright／隔離 Edge，不使用個人瀏覽器資料。

## 測試

- 原有 574 項測試全數通過；新增移除入口測試 1 項通過，共 575 項。
- 31 項 DOM 驗證通過：全部 23 配置、五尺寸及字級放大、房規預設及操作、開始主持、兩種盾模式、刷新／回退、舊屠城存檔。
- 五尺寸各 40 輪，共 200 輪反覆切板、調房規、展開、捲動及返回；0 JavaScript 錯誤，未意外建立遊戲資料，底部按鈕可見，無水平溢出。
- 32 局完整主持 DOM 黑箱全數通過（23 配置＋9 特殊情境），涵蓋刷新、上一步、重新一局、感染、毒殺、機械狼學通靈師、騎士反彈及免疫房規；四尺寸主持座位、角色素材與 48 項離線資源通過。最終移除底欄框後，另重跑 200 輪預覽驗證。GitHub 測試與部署成功；正式站 23 項程式／樣式／素材 SHA256 與本地一致，入口移除、板子排序、房規、隱狼登記、刷新、計時器及 council-v15-2 快取通過，0 JavaScript 錯誤。

尺寸：320×568、390×844、844×390、768×1024、1024×768。截圖及機器統計可重跑對應 scripts；彙整見 rules51-validation.json。

## 尚未驗收與優化建議

- iPhone Safari、實體 iOS PWA、Android、雙指縮放與動態工具列仍須真機驗收。本輪沿用使用者「先部署供真機驗收，報告明列尚未驗收」授權，不把桌面模擬宣稱真機通過。
- 長局的真機 localStorage 容量及效能未量測；200 輪測的是預覽操作，不代表無限長局負載能力。
- 第 51 章原三閱讀視窗及逐字稿驗收已被使用者最新移除指示取代，無待接入正文。

## 最終實際 DOM 截圖

以下為隔離 Edge 的實際 App 預覽，已移除詳細規則及底欄容器框；字級放大 150%，捲動至底部。不是設計示意或真機 Safari 截圖。

![390×844 預覽](rules51-preview-390.png)

![320×568 預覽](rules51-preview-320.png)

程式提交：fb29bb372f249234e0a3426378f3cc12188dde74（feat/eclipse-host-app）。

## 部署結果

[開啟 App](https://jia0796.github.io/wolf_Emcee/) · [測試 CI](https://github.com/jia0796/wolf_Emcee/actions/runs/38227064507) · [部署](https://github.com/jia0796/wolf_Emcee/actions/runs/38227064528)。兩個工作流程皆成功，程式提交 fb29bb3 已上線供真機驗收；正式站核對已完成，主分支只更新文件，沒有合併 App 程式。
