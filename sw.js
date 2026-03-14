const V='v28';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(['./index.html','./',])));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // GitHub API などの外部リクエストはスルー
  if(url.origin!==location.origin)return;
  // キャッシュファースト + バックグラウンド更新（stale-while-revalidate）
  e.respondWith(
    caches.open(V).then(cache=>
      cache.match(e.request).then(cached=>{
        const fresh=fetch(e.request).then(r=>{cache.put(e.request,r.clone());return r;});
        return cached||fresh; // キャッシュあれば即返す、なければネット待ち
      })
    )
  );
});
