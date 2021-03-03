
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const path = require('path');
const dotenv = require('dotenv');
const { Parser } = require('json2csv');
const fs = require('file-system');

const instagram_url = 'https://www.instagram.com/';
const instagram_login_url = 'https://www.instagram.com/accounts/login/';
const root_path = path.join(__dirname, '../../');
const env_path = path.join(root_path, '.env');
let env = dotenv.config({path: env_path});
let contents_num;
let followers_num;
let followings_num;

const follower_crawling_to_csv = async (id, password) => {
    try {
        // TODO:
        // 1. 브라우져 생성
        const browser = await puppeteer.launch({
            ignoreHTTPSErrors: true,
            headless : false,
            args: ["--window-size=1920,1080", "--disable-notifications"],
            devtools: true,
        });

        // 2. 페이지 생성
        const page = await browser.newPage();
        page.setViewport({
            width: 1080,
            height: 1080,
        });
        // Define a window.onCustomEvent function on the page.
        await page.exposeFunction('onCustomEvent', (e) => {
            console.log(`${e.type} fired`, e.detail || '');
        });

        function listenFor(type) {
            return page.evaluateOnNewDocument((type) => {
            document.addEventListener(type, (e) => {
                window.onCustomEvent({ type, detail: e.detail });
            });
            }, type);
        }

        await listenFor('app-ready');

        // 3. 인스타그램 오픈
        await page.goto(instagram_login_url, {waitUntil: 'networkidle2'});

        // 4. 로그인
        await page.waitForSelector('input[name="username"]');
        await page.focus('input[name="username"]');
        await page.keyboard.type(id);
        await page.focus('input[name="password"]');
        await page.keyboard.type(password);
        await page.click('button[type="submit"]');
        // 4-1. 로그인 확인
        await page.waitForResponse(
            response => response.url() === 'https://www.instagram.com/accounts/onetap/?next=%2F' && 
                        response.status() === 200
        );
        // 5. 내 계정으로 이동
        await page.goto(instagram_url, {waitUntil: 'networkidle2'});
        await page.waitForSelector('a[class="gmFkV"]');

        const my_id = await page.evaluate(() => {
            let _id = document.querySelector('.gmFkV').innerText;
            return _id;
        });
        console.log('id :' + my_id);
        //await page.click('a[class="gmFkV"]');
        let my_page_url = instagram_url+my_id;
        await page.goto(my_page_url, {waitUntil: 'networkidle2'});

        // 6. Followers 숫자 확인
        await page.waitForSelector('.-nal3 ');

        const content = await page.content();
        const $ = cheerio.load(content);
        const lists = await $('.-nal3 ');
        console.log('lists : '+ lists);

        function removeComma(str)
        {
            return parseInt(str.replace(/,/g,""));
        }
        
        lists.each((index, list) => {
            if (list.children[0].data === '게시물 ') {
                contents_num = list.children[1].children[0].data;
            } else if (list.children[0].data === '팔로워 ') {
                followers_num = list.children[1].children[0].data;
            } else if (list.children[0].data === '팔로우 ') {
                followings_num = list.children[1].children[0].data;
            } else {
            }
        });
        followings_num = removeComma(followings_num);
        console.log('contents number : ' + contents_num);
        console.log('followers number : ' + followers_num);
        console.log('followings number : ' + followings_num);

        // 7. Followings ID, NickName 확인
        const my_following_link = `a[href="/${my_id}/following/"]`;
        await page.click(my_following_link);

        let following_list = [];
        let user_id;
        let user_nick;


        await page.waitForSelector('.isgrP');
        let followings_box_len = 0;
        let followings_items_num = 0;

        while(followings_num > followings_items_num) {
            await page.waitForSelector('.isgrP');

            followings_box_len = await page.evaluate(()=>{
                const len = document.querySelector('.isgrP').scrollHeight;
                document.querySelector('.isgrP').scrollTo(0, len);
                return len;
            });
            console.log('followings_box_len 1 : ' + followings_box_len);

            await page.waitFor(3000);
            await page.waitForSelector('.PZuss');
            
            followings_items_num = await page.evaluate(()=>{
                return document.querySelectorAll('.wo9IH').length;
            });
            console.log('followings_items_num : '+followings_items_num);
        }

        await page.waitForSelector('a[class="FPmhX notranslate  _0imsa "]');
        let followings_list = await page.evaluate(function () {
            let items = [...document.querySelectorAll('.FPmhX.notranslate._0imsa')];
            //console.log('items :' +items);
            return items.map((item) => item.textContent.trim());
        });

        console.log('followings_list : '+ followings_list);
        console.log('followings_list len : ' + followings_list.length);

        // 자료 수집

        for(let i=0; i < followings_list.length; i++) {
            // 8. Following 계정으로 이동
            let following_url = instagram_url+followings_list[i];
            console.log('go to : ' + following_url);
            await page.goto(following_url, {waitUntil: 'networkidle2'});

            // 9. id, nick, 게시물, 팔로워, 팔로잉 숫자 확인
            // id
            let user = {};
            user.id = followings_list[i];
            
            // nick
            //await page.waitForSelector('h1[class="rhpdm"]');
            user.nick = await page.evaluate(()=>{
                if (document.querySelector('.rhpdm') == null) {
                    return "";
                }
                return document.querySelector('.rhpdm').innerText;
            });

            // 게시물, 팔로워, 팔로잉
            await page.waitForSelector('.-nal3 ');

            const content = await page.content();
            const $ = cheerio.load(content);
            const lists = await $('.-nal3 ');
            console.log('lists : '+ lists);
            
            lists.each((index, list) => {
                if (list.children[0].data === '게시물 ') {
                    user.contents = list.children[1].children[0].data;
                } else if (list.children[0].data === '팔로워 ') {
                    user.follower = list.children[1].children[0].data;
                } else if (list.children[0].data === '팔로우 ') {
                    user.following = list.children[1].children[0].data;
                } else {
                }
            });
            console.log('id : ' + user.id);
            console.log('nick : ' + user.nick);
            console.log('contents : ' + user.contents);
            console.log('follower : ' + user.follower);
            console.log('following : ' + user.following);

            // 10. Followers 숫자 만큼 8번부터 다시 수행
            following_list.push(user);
        }
        console.log(following_list);
        
        // 11. json to csv
        const fields = ['id', 'nick', 'contents', 'follower', 'following'];
        const json2csvParser = new Parser({fields});
        const csv = json2csvParser.parse(following_list);

        console.log(csv);
        fs.writeFileSync('./following-users.csv', csv);

        browser.close();
    } catch(err) {
        console.error(err);
    }
}

const test_module = async () => {
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

    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

    await page.goto('https://yangeok.github.io/node.js/2019/09/11/puppeteer-crawler-scroll.html', {waitUntil: 'networkidle2'});

    await page.waitForSelector('.language-js');

    const followings_list = [];
    let following_list = [];

    console.log('followings_list len : ' + followings_list.length);

    for(let i=0; i < followings_list.length; i++) {
        // 8. Following 계정으로 이동
        let following_url = instagram_url+followings_list[i];
        console.log('go to : ' + following_url);
        await page.goto(following_url, {waitUntil: 'networkidle2'});

        // 9. id, nick, 게시물, 팔로워, 팔로잉 숫자 확인
        // id
        let user = {};
        user.id = followings_list[i];
        
        // nick
        //await page.waitForSelector('h1[class="rhpdm"]');
        user.nick = await page.evaluate(()=>{
            if (document.querySelector('.rhpdm') == null) {
                return "";
            }
            return document.querySelector('.rhpdm').innerText;
        });

        // 게시물, 팔로워, 팔로잉
        await page.waitForSelector('.-nal3 ');

        const content = await page.content();
        const $ = cheerio.load(content);
        const lists = await $('.-nal3 ');
        console.log('lists : '+ lists);
        
        lists.each((index, list) => {
            if (list.children[0].data === '게시물 ') {
                user.contents = list.children[1].children[0].data;
            } else if (list.children[0].data === '팔로워 ') {
                user.follower = list.children[1].children[0].data;
            } else if (list.children[0].data === '팔로우 ') {
                user.following = list.children[1].children[0].data;
            } else {
            }
        });
        console.log('id : ' + user.id);
        console.log('nick : ' + user.nick);
        console.log('contents : ' + user.contents);
        console.log('follower : ' + user.follower);
        console.log('following : ' + user.following);

        // 10. Followers 숫자 만큼 8번부터 다시 수행
        following_list.push(user);
    }
    console.log(following_list);
    
    // 11. json to csv
    const fields = ['id', 'nick', 'contents', 'follower', 'following'];
    const json2csvParser = new Parser({fields});
    const csv = json2csvParser.parse(following_list);

    console.log(csv);
    fs.writeFileSync('./following-users.csv', csv);

    browser.close();
}

module.exports = {
    follower_crawling_to_csv
}

follower_crawling_to_csv(env.parsed.INSTA_ID, env.parsed.INSTA_PW);
//test_module();
