
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
            await page.waitForSelector('h1[class="rhpdm"]');
            user.nick = await page.evaluate(()=>{
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

    let tmp = [
  {
    id: 'hoyachoe',
    nick: '호야초',
    contents: '88',
    follower: '867',
    following: '25'
  },
  {
    id: 'harry_hjh',
    nick: 'Jonghwa Hong Harry',
    contents: '779',
    follower: '961',
    following: '953'
  },
  {
    id: 'a.hyunki',
    nick: '조현기',
    contents: '69',
    follower: '1,279',
    following: '411'
  },
  {
    id: 'ragbateom',
    nick: '락바텀 급등주',
    contents: '51',
    follower: '484',
    following: '1,413'
  },
  {
    id: 'goldeggtv',
    nick: "깨알같은 꿀팁 알'TV",
    contents: '1',
    follower: '279',
    following: '1,049'
  },
  {
    id: 'zeroway8318',
    nick: '정영길',
    contents: '269',
    follower: '522',
    following: '455'
  },
  {
    id: 'jdyb_tv',
    nick: "주식은 '장대양봉TV'!! Youtube 검색!!!",
    contents: '39',
    follower: '1,178',
    following: '5,445'
  },
  {
    id: 'hjj45655',
    nick: 'hjj4565’',
    contents: '0',
    follower: '475',
    following: '2,358'
  },
  {
    id: '1998wealth',
    nick: '평범한군인',
    contents: '223',
    follower: '2,856',
    following: '4,382'
  },
  {
    id: 'ilpyung',
    nick: '일평 주식(비평 코인)-가치투자',
    contents: '4,670',
    follower: '50.9천',
    following: '4,153'
  },
  {
    id: 'equity0214',
    nick: '주식 투자 재테크 - 전소미 🎓 비트코인 해외선물',
    contents: '670',
    follower: '60.7천',
    following: '4'
  },
  {
    id: 'bowlchang_hachan',
    nick: 'khj',
    contents: '62',
    follower: '633',
    following: '521'
  },
  {
    id: 'seungwan85',
    nick: 'SEUNGWAN CHOI',
    contents: '3',
    follower: '26',
    following: '20'
  },
  {
    id: 'luciatune',
    nick: '심규선',
    contents: '473',
    follower: '28.5천',
    following: '0'
  },
  {
    id: 'jackwill.i.ams',
    nick: 'Jack Williams',
    contents: '1,305',
    follower: '5,436',
    following: '2,416'
  },
  {
    id: 'kaylee_cho',
    nick: 'Kaylee Cho',
    contents: '408',
    follower: '190',
    following: '238'
  },
  {
    id: 'oceansno5',
    nick: 'Dae-Yang OH',
    contents: '0',
    follower: '99',
    following: '97'
  },
  {
    id: 'bbaxer7',
    nick: '권순필',
    contents: '112',
    follower: '486',
    following: '723'
  },
  {
    id: 'taegyeong441',
    nick: '오태경',
    contents: '0',
    follower: '70',
    following: '68'
  },
  {
    id: 'lee_wookhee',
    nick: 'LeeWookhee',
    contents: '7',
    follower: '99',
    following: '152'
  },
  {
    id: 'brightest.jina',
    nick: 'Jin A',
    contents: '254',
    follower: '214',
    following: '235'
  },
  {
    id: 'shihsung307',
    nick: 'Shihyung Sung',
    contents: '281',
    follower: '145',
    following: '151'
  },
  {
    id: 'gmfcno16',
    nick: '이원재',
    contents: '59',
    follower: '112',
    following: '147'
  },
  {
    id: 'jjy900829',
    nick: 'Ji Yong Jang',
    contents: '149',
    follower: '821',
    following: '757'
  },
  {
    id: 'giantpengsoo',
    nick: '펭수',
    contents: '106',
    follower: '531천',
    following: '2'
  },
  {
    id: 'zorba729',
    nick: '유정아',
    contents: '67',
    follower: '136',
    following: '148'
  },
  {
    id: 'donghun9650',
    nick: '강동훈',
    contents: '43',
    follower: '106',
    following: '102'
  },
  {
    id: 'kozypop',
    nick: 'KozyPop',
    contents: '147',
    follower: '21.9천',
    following: '7'
  },
  {
    id: 'forwild',
    nick: '박민석',
    contents: '13',
    follower: '245',
    following: '1,418'
  },
  {
    id: 'myunghwan__',
    nick: 'Myung Hwan Ha',
    contents: '0',
    follower: '27',
    following: '0'
  },
  {
    id: 'jjck_kim',
    nick: 'JJack Kim l Backpackerini',
    contents: '214',
    follower: '4,124',
    following: '458'
  },
  {
    id: 'hongsemin',
    nick: 'Se Min Hong',
    contents: '287',
    follower: '192',
    following: '523'
  },
  {
    id: 'bep',
    nick: 'Black Eyed Peas',
    contents: '1,155',
    follower: '855천',
    following: '153'
  }
];

    const fields = ['id', 'nick', 'contents', 'follower', 'following'];
    const json2csvParser = new Parser({fields});
    const csv = json2csvParser.parse(tmp);

    console.log(csv);

    fs.writeFileSync('./following-users.csv', csv);

    browser.close();
}

module.exports = {
    follower_crawling_to_csv
}

follower_crawling_to_csv(env.parsed.INSTA_ID, env.parsed.INSTA_PW);
//test_module();
