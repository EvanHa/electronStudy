const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({
        headless : false
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1370,
        height: 1446
    });
    const naver_id = "네이버 아이디";
    const naver_pw = "네이버 비번";
    await page.goto('https://nid.naver.com/nidlogin.login');
    await page.evaluate((id, pw) => {
        document.querySelector('#id').value = id;
        document.querySelector('#pw').value = pw;
    }, naver_id, naver_pw);
    await page.click('.btn_global');
    await page.waitForNavigation();
    //await page.goto('https://brand.naver.com/xbox/products/5411907759');
    await page.goto('https://brand.naver.com/xbox/products/5529168638');
    await page.waitForTimeout(1000);
    await page.waitForSelector('a[class="OgETmrvExa"]');
    await page.click('a[class="OgETmrvExa"]');
    await page.waitForTimeout(3000);
    //await page.waitForSelector('span[class="checkbox-mark"]');
    //await page.click('span[class="checkbox-mark"]');
    await page.waitForSelector('.s_checkbox .checkbox');
    await page.click('.s_checkbox .checkbox');
    await page.waitForSelector('.agree_required .checkbox-mark');
    await page.click('.agree_required .checkbox-mark');
    await page.waitForSelector('.btn_payment');
    await page.click('.btn_payment');

    // await browser.close();
})();
