const $ = require('jquery');
const { clipboard } = require('electron');
const getCode = require('../js/get-code');

$(document).ready(() => {
  const $url = $('#url');
  const $go = $('#go');
  const $crawling_btn = $('#go_crawling');
  const $web = $('#web');
  const $code = $('#code');

  $web[0].addEventListener('console-message', ({ message = '' }) => {
    const match = 'CRAWLER_GENERATOR_SELECTOR:'
    if (!message.startsWith(match)) return ;
    const code = getCode($url.val(), message.substr(match.length));
    $code.text(code);
    clipboard.writeText(code);
    alert('Code has been copied to your clipboard!');
  })
  // $web[0].addEventListener('did-stop-loading', () => {
  //   $web[0].openDevTools()
  // })
  $url.on('keyup', function (e) {
    if (e.keyCode === 13) {
      $go.click();
    }
  })

  $go.click(() => {
    console.log('go?');
    $web[0].src = $url.val();
  });

  $crawling_btn.click(()=>{
    console.log('hello world');

  });
})
