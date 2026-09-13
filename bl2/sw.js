/* ビジ法2級ドリル Service Worker
   更新時はCACHE_VERの数字を上げて配布する */
var CACHE_VER = 'bizlaw2-v6'; /* 2026-09-13 ダーク化＋下の列に「ドリル一覧」を追加。内容は382問のまま（接頭辞で絞る作りは維持） */
var CACHE_PREFIX = 'bizlaw2-';
var ASSETS = ['./', './index.html', './manifest.json', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_VER).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

/* 【重要】消すのは、このアプリ自身の古いキャッシュだけに限る。
   drillbox-7k.github.io には /spi/（SPI非言語ドリル）が同居しており、
   接頭辞で絞らないと、更新のたびに相手のオフライン用キャッシュまで消してしまう */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE_VER;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* 画面(HTML)はネットワーク優先（常に最新の問題データを取得）、
   失敗時（オフライン）はキャッシュで起動 */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_VER).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () { return caches.match('./index.html'); })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_VER).then(function (c) { c.put(req, copy); });
        return res;
      });
    })
  );
});
