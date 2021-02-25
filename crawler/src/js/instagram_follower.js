const puppeteer = require('puppeteer');
const path = require('path');
const dotenv = require('dotenv');

const instagram_url = 'https://www.instagram.com/accounts/login/';
const root_path = path.join(__dirname, '../../');
const env_path = path.join(root_path, '.env');
let env = dotenv.config({path: env_path});

const instagram_follower_crawler = async (id, password) => {
    try {
        //console.log('root_path : '+ root_path);
        const browser = await puppeteer.launch({
            ignoreHTTPSErrors: true,
            headless : false,
            args: ["--window-size=1920,1080", "--disable-notifications"],
            devtools: true,
        });

        const page = await browser.newPage();
        page.setViewport({
            width: 1080,
            height: 1080,
        });

        // Define a window.onCustomEvent function on the page.
        await page.exposeFunction('onCustomEvent', (e) => {
            console.log(`${e.type} fired`, e.detail || '');
        });

        /**
        * Attach an event listener to page to capture a custom event on page load/navigation.
        * @param {string} type Event name.
        * @returns {!Promise}
        */
        function listenFor(type) {
            return page.evaluateOnNewDocument((type) => {
            document.addEventListener(type, (e) => {
                window.onCustomEvent({ type, detail: e.detail });
            });
            }, type);
        }

        await listenFor('app-ready'); // Listen for "app-ready" custom event on page load.

        await page.goto(instagram_url, {waitUntil: 'networkidle2'});
        await page.waitForSelector('input[name="username"]');
        
        await page.focus('input[name="username"]');
        await page.keyboard.type(id);
        
        await page.focus('input[name="password"]');
        await page.keyboard.type(password);

        await page.click('button[type="submit"]');
        
        await page.waitForResponse(
            response => response.url() === 'https://www.instagram.com/accounts/onetap/?next=%2F' && 
                        response.status() === 200
        );

        await page.goto(instagram_url, {waitUntil: 'networkidle2'});

        await page.waitForSelector('a[class="gmFkV"]');
        await page.click('a[class="gmFkV"]');

        await page.waitForSelector('span[class="g47SY "]');
        const follower_count = await page.waitForSelector('span[class="g47SY "]').value;
        console.log('follower_count : '+follower_count);

        await page.waitForSelector('a[class="-nal3 "]');
        await page.click('a[class="-nal3 "]');

        
        let user_list = document.querySelector(".PZuss");
        console.log(user_list);


        //browser.close();
    } catch(e) {
        console.log(e);
    }
}

module.exports = {
    instagram_follower_crawler
}

instagram_follower_crawler(env.parsed.INSTA_ID,env.parsed.INSTA_PW);

