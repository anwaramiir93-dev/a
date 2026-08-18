const CACHE_NAME = 'student-management-v8-auto-refresh';
const APP_VERSION = '8';

const ASSETS_TO_CACHE = [
  './', './index.html', './css/style.css', './css/andalusian.css', './css/premium-andalusian.css',
  './js/storage.js', './js/data.js', './js/dashboard.js', './js/students.js', './js/groups.js',
  './js/attendance.js', './js/grades.js', './js/homework.js', './js/payments.js', './js/reports.js',
  './js/notifications.js', './js/settings.js', './js/icons.js', './js/whatsapp-report.js', './js/guardian-whatsapp.js', './js/report-downloads.js', './js/app.js',
  './assets/logo.png', './assets/logo-small.png', './assets/favicon.png', './assets/icon-192.png',
  './assets/icon-512.png', './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS_TO_CACHE.map(path => `${path}?v=${APP_VERSION}`).map(url => new Request(url, {cache:'reload'})).map(async request => {
      try { return await fetch(request); } catch (_) { return null; }
    }).map(async result => result));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    clients.forEach(client => client.postMessage({type:'APP_UPDATED', version:APP_VERSION}));
  })());
});

async function networkFirst(request) {
  try {
    const response = await fetch(request, {cache:'no-store'});
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return caches.match(request) || caches.match(new Request('./index.html'));
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('/css/style.css')) {
    event.respondWith((async () => {
      try {
        const [baseResponse, heritageResponse, premiumResponse] = await Promise.all([
          fetch(`${new URL('./css/style.css', self.location.origin)}?v=${APP_VERSION}`, {cache:'no-store'}),
          fetch(`${new URL('./css/andalusian.css', self.location.origin)}?v=${APP_VERSION}`, {cache:'no-store'}),
          fetch(`${new URL('./css/premium-andalusian.css', self.location.origin)}?v=${APP_VERSION}`, {cache:'no-store'})
        ]);
        const base = await baseResponse.text();
        const heritage = await heritageResponse.text();
        const premium = await premiumResponse.text();
        return new Response(`${base}\n/* Andalusian Heritage */\n${heritage}\n/* Premium Modern EdTech */\n${premium}`, {
          status:200,
          headers:{'Content-Type':'text/css; charset=utf-8','Cache-Control':'no-store'}
        });
      } catch (_) { return caches.match(event.request); }
    })());
    return;
  }

  if (url.pathname.endsWith('/index.html') || /\/a\/?$/.test(url.pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});
