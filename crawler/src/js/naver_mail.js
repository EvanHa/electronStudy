const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({
        headless : false
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1366,
        height: 768
    });
    const naver_id = "frb843_evan";
    const naver_pw = "!spdlqjAudghks19";
    await page.goto('https://nid.naver.com/nidlogin.login');
    await page.evaluate((id, pw) => {
        document.querySelector('#id').value = id;
        document.querySelector('#pw').value = pw;
    }, naver_id, naver_pw);
    await page.click('.btn_global');
    await page.waitForNavigation();
    await page.goto('https://mail.naver.com');

    let data = [];
    let lineCount = 30;
    const maxCount = 30;
    const allMail = await page.$eval("#headTotalNum", (data) => data.textContent);
    let pageCount = parseInt(allMail/30 + 1);
    console.log('pageCount : '+pageCount);

    for (let index = 1; index <= pageCount; index++) {
        await page.goto(`https://mail.naver.com/#%7B%22fClass%22%3A%22list%22%2C%22oParameter%22%3A%7B%22page%22%3A%22${index}%22%2C%22sortField%22%3A%221%22%2C%22sortType%22%3A%220%22%2C%22folderSN%22%3A%220%22%2C%22type%22%3A%22%22%2C%22isUnread%22%3Afalse%7D%7D`);
        data.push(await getAll(page, index));
        await page.waitFor(1000);
    }
    console.log(data);

    await page.waitFor(1000);
    await browser.close();
})();

async function getAll(page, index) {
    let data = [];
    let lineCount = 30;
    const maxCount = 30;
    const allMail = await page.$eval("#headTotalNum", (data) => data.textContent);
    let pageCount = parseInt(allMail/30 + 1);
    if(index === pageCount){
        lineCount = (allMail%30);
    } else {
        lineCount = maxCount;
    }

    for (let index = 0; index < lineCount; index++) {
        data.push(await getOne(page, index + 1));
    }

    return Promise.resolve(data);
}

async function getOne(page, index) {

    let data = {};

    data.title = await page.$eval(`#list_for_view > ol > li:nth-child(${index}) > div > div.subject > a > span > strong`, (data) => data.textContent);

    data.link = await page.$eval(`#list_for_view > ol > li:nth-child(${index}) > div > div.subject > a`, (data) => data.href);

    data.from = await page.$eval(`#list_for_view > ol > li:nth-child(${index}) > div > div > a`, (data) => data.textContent);

    return Promise.resolve(data);
}