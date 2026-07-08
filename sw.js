// sw.js — 快取策略 v2：先回快取（秒開），背景抓最新版更新快取，下次開啟就是新版。
// 教訓：v1 用固定版本名＋純 cache-first，導致已安裝的 App 永遠停在第一次快取的版本。
const CACHE_NAME = 'tokyo-family-guide-v6-20260708';
const URLS_TO_CACHE = ['./', './index.html'];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      // 刪掉所有舊版本的快取，只留當前版
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(event.request).then(function (cached) {
        // 背景抓新版：成功就更新快取（下次開啟生效），失敗（離線）就算了
        var refresh = fetch(event.request).then(function (response) {
          if (response && response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(function () { return cached; });
        // 有快取先回快取（秒開＋離線可用）；沒快取才等網路
        return cached || refresh;
      });
    })
  );
});
