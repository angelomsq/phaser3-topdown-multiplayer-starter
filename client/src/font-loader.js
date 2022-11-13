window.WebFontConfig = {
  google: { families: ['Press Start 2P', 'Rajdhani'] },
  custom: {
    families: ['m3x6'],
    urls: ['/src/assets/fonts/fonts.css']
  }
};

(function() {
  var wf = document.createElement('script');
  wf.src =
    ('https:' == document.location.protocol ? 'https' : 'http') +
    '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
  wf.type = 'text/javascript';
  wf.async = 'true';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(wf, s);
})();
