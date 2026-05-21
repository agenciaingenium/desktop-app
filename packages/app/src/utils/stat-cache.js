// extracted from: https://gist.github.com/paulcbetts/da85dd246db944c32427d72026192b41
//
// Only applies in Node.js environments (main process / worker).
// The renderer uses target: web and doesn't have fs.

try {
  var fs = require('fs');
  if (fs && fs.lstatSync) {
    var lru = require('lru-cache')({
      max: 2048, maxAge: 3000/*ms*/
    });

    var origLstat = fs.lstatSync.bind(fs);

    fs.lstatSync = function(p) {
      let r = lru.get(p);
      if (r) return r;

      r = origLstat(p);
      lru.set(p, r);
      return r;
    };
  }
} catch (e) {
  // fs not available (renderer with target: web)
}