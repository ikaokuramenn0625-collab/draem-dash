const V='v112';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(['./index.html','./','./manifest.json','./music-hub.html','./music-hub-sync.json'])));
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
  if(url.pathname.endsWith('/music-hub-sync.json')){
    e.respondWith(
      fetch(e.request,{cache:'no-store'})
        .then(r=>r.ok ? caches.open(V).then(cache=>{cache.put(e.request,r.clone()); return r;}) : r)
        .catch(()=>caches.match(e.request).then(r=>r||new Response('{"gistId":"","updated":""}',{headers:{'Content-Type':'application/json'}})))
    );
    return;
  }
  const isHTML=e.request.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');
  if(isHTML){
    // HTML はネット優先（更新を最速反映）
    e.respondWith(
      fetch(e.request)
        .then(r=>caches.open(V).then(cache=>{cache.put('./index.html',r.clone());return r;}))
        .catch(()=>caches.match('./index.html').then(r=>r||caches.match('./')))
    );
    return;
  }
  // JS/CSS/画像はキャッシュ優先 + 裏で更新
  e.respondWith(
    caches.open(V).then(cache=>
      cache.match(e.request).then(cached=>{
        const fresh=fetch(e.request).then(r=>{cache.put(e.request,r.clone());return r;}).catch(()=>cached);
        return cached||fresh;
      })
    )
  );
});
