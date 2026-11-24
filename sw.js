// sw.js — lets the game open without internet. Online it always takes the newest files (so updates show up on the next launch);
// offline it uses the copies saved the last time it was online.
const BUILD = 1;
const CACHE = 'moy-aeroport-cache';
const EXTRA = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'assets/map.webp?v=1',
  'fonts/Inter-500.woff', 'fonts/Inter-600.woff', 'fonts/Inter-700.woff', 'fonts/Inter-800.woff'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let urls = EXTRA.slice();
    try {
      const html = await (await fetch('index.html', { cache: 'reload' })).text();
      for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) urls.push(m[1]);
    } catch (_) {}
    urls = [...new Set(urls)];
    await Promise.all(urls.map(u => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([
        fetch(req, { cache: 'no-cache' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000)),
      ]);
      if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
      if (hit) return hit;
      throw err;
    }
  })());
});
