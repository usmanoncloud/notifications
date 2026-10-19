const CACHE="eid-v5",SHELL=["./","./index.html","./manifest.json","./firebase-config.js","./icons/icon-192.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});
self.addEventListener("push",e=>{
  let p={};try{p=e.data?e.data.json():{}}catch(_){}
  const n=p.notification||p.data||{};
  e.waitUntil(self.registration.showNotification(n.title||"Eid Prayer Finder",{body:n.body||"New Eid prayer information available.",icon:"icons/icon-192.png",badge:"icons/icon-192.png",tag:(p.data&&p.data.tag)||undefined,data:{url:(p.data&&p.data.url)||"./"}}));
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>{for(const c of l){if("focus" in c)return c.focus()}return clients.openWindow(e.notification.data.url||"./")}));
});
