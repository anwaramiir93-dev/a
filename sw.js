const CACHE_NAME = 'student-management-v10-final-ui';
const APP_VERSION = '10';

const ASSETS = [
  './', './index.html', './css/style.css', './css/andalusian.css', './css/premium-andalusian.css',
  './js/storage.js', './js/data.js', './js/dashboard.js', './js/students.js', './js/groups.js',
  './js/attendance.js', './js/grades.js', './js/homework.js', './js/payments.js', './js/reports.js',
  './js/notifications.js', './js/settings.js', './js/icons.js', './js/app.js', './js/app-enhancements.js',
  './js/whatsapp-report.js', './js/guardian-whatsapp.js', './js/report-downloads.js',
  './assets/logo.png', './assets/logo-small.png', './assets/favicon.png', './assets/icon-192.png', './assets/icon-512.png', './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(ASSETS.map(async asset => {
      try {
        const response = await fetch(`${asset}?v=${APP_VERSION}`, {cache:'reload'});
        if (response.ok) await cache.put(asset, response.clone());
      } catch (_) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
    // Refresh already-open app tabs once so the newest UI reaches users automatically.
    const clients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    await Promise.all(clients.map(client => {
      try { return client.navigate(client.url); } catch (_) { return null; }
    }));
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
    return caches.match(request);
  }
}

async function themedIndex(request) {
  try {
    const response = await fetch(request, {cache:'no-store'});
    const html = await response.text();
    const injected = html.replace('</body>', `\n      <script src="./js/app-enhancements.js?v=${APP_VERSION}"></script>\n    </body>`);
    const result = new Response(injected, {
      status: response.status,
      statusText: response.statusText,
      headers: {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}
    });
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, result.clone());
    return result;
  } catch (_) {
    return caches.match(request);
  }
}

async function themedCss(request) {
  try {
    const [base, heritage, premium] = await Promise.all([
      fetch(`./css/style.css?v=${APP_VERSION}`, {cache:'no-store'}),
      fetch(`./css/andalusian.css?v=${APP_VERSION}`, {cache:'no-store'}),
      fetch(`./css/premium-andalusian.css?v=${APP_VERSION}`, {cache:'no-store'})
    ]);
    const css = `${await base.text()}\n/* Andalusian Heritage */\n${await heritage.text()}\n/* Premium Modern EdTech */\n${await premium.text()}`;
    return new Response(css, {status:200, headers:{'Content-Type':'text/css; charset=utf-8','Cache-Control':'no-store'}});
  } catch (_) {
    return caches.match(request);
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/index.html') || /\/a\/?$/.test(url.pathname)) {
    event.respondWith(themedIndex(event.request));
    return;
  }
  if (url.pathname.endsWith('/css/style.css')) {
    event.respondWith(themedCss(event.request));
    return;
  }
  event.respondWith(networkFirst(event.request));
});
