const {chromium}=await import(process.env.COUNCIL_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage({viewport:{width:1250,height:1840},deviceScaleFactor:1});await page.goto(new URL('../output/promo/screens/reference-gallery.html',import.meta.url).href);await page.locator('img').evaluateAll(async images=>Promise.all(images.map(i=>i.decode())));await page.screenshot({path:new URL('../output/promo/reference-gallery.png',import.meta.url).pathname.slice(1),fullPage:true});}finally{await browser.close();}
