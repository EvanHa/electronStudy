const finder = require('@medv/finder').default

pingHost = (channel, args) => {
  console.log('CRAWLER_GENERATOR_SELECTOR:' + channel)
}

document.addEventListener("DOMContentLoaded", function (event) {
  let cur;
  document.addEventListener('click', function (event) {
    if (!cur) {
      cur = event.target;
      highlight(cur);
      return ;
    }

    if (event.target == cur) {
      offHighlight(cur);
      pingHost(finder(cur));
      cur = undefined;
      return ;
    }

    offHighlight(cur);
    cur = event.target;
    highlight(cur);
  })


  function highlight(el) {
    el.setAttribute('data-style', el.getAttribute('style') || '')
    el.setAttribute('style', el.getAttribute('style') + ';border: 1px solid red;')
  }

  function offHighlight(el) {
    el.setAttribute('style', el.getAttribute('data-style'))
  }
});
