const CACHE_NAME = 'student-management-v4-premium-andalusian';

const ASSETS_TO_CACHE = [
  './', './index.html', './css/style.css', './css/andalusian.css', './css/premium-andalusian.css',
  './js/storage.js', './js/data.js', './js/dashboard.js', './js/students.js', './js/groups.js',
  './js/attendance.js', './js/grades.js', './js/homework.js', './js/payments.js', './js/reports.js',
  './js/notifications.js', './js/settings.js', './js/icons.js', './js/app.js',
  './assets/logo.png', './assets/logo-small.png', './assets/favicon.png', './assets/icon-192.png',
  './assets/icon-512.png', './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(
    names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
  )));
  self.clients.claim();
});

async function getNetworkOrCache(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return caches.match(request);
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Keep the existing CSS architecture intact, then layer the Andalusian system on top.
  if (url.pathname.endsWith('/css/style.css')) {
    event.respondWith((async () => {
      try {
        const responses = await Promise.all([
          fetch(event.request),
          fetch(new URL('./css/andalusian.css', self.location.origin)),
          fetch(new URL('./css/premium-andalusian.css', self.location.origin))
        ]);
        const base = await responses[0].text();
        const heritage = await responses[1].text();
        const premium = await responses[2].text();
        return new Response(base + '\n\n/* Andalusian Heritage */\n' + heritage + '\n\n/* Premium Modern EdTech */\n' + premium, {
          status: 200,
          headers: {'Content-Type':'text/css; charset=utf-8','Cache-Control':'no-cache'}
        });
      } catch (_) {
        return caches.match(event.request);
      }
    })());
    return;
  }

  event.respondWith(getNetworkOrCache(event.request));
});
