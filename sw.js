// sw.js — 先回快取秒開，背景更新，重開兩次內收到新版。由 pack.py 產生。
const CACHE_NAME = 'tokyo-family-guide-202607081734';
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
      // 刪掉所有舊版本快取，只留當前版
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(event.request).then(function (cached) {
        // 背景抓新版：成功就更新快取（下次開啟生效），離線就用快取
        var refresh = fetch(event.request).then(function (response) {
          if (response && response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(function () { return cached; });
        return cached || refresh;
      });
    })
  );
});
