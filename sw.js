const CACHE_NAME = 'student-management-v3-lucide';

const ASSETS_TO_CACHE = [
  './', './index.html', './css/style.css', './css/andalusian.css', './js/icons.js',
  './js/storage.js', './js/data.js', './js/dashboard.js', './js/students.js',
  './js/groups.js', './js/attendance.js', './js/grades.js', './js/homework.js',
  './js/payments.js', './js/reports.js', './js/notifications.js', './js/settings.js', './js/app.js',
  './assets/logo.png', './assets/logo-small.png', './assets/favicon.png',
  './assets/icon-192.png', './assets/icon-512.png', './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
    ))
  );
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

async function getHtmlWithIconSystem(request) {
  try {
    const response = await fetch(request);
    if (!response || !response.ok) return response;
    let html = await response.text();
    if (!html.includes('js/icons.js')) {
      html = html.replace('</body>', '    <script src="js/icons.js"></script>\n</body>');
    }
    const transformed = new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }
    });
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, transformed.clone());
    return transformed;
  } catch (_) {
    return caches.match(request);
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Inject the icon runtime without changing the existing application layout.
  if (event.request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    event.respondWith(getHtmlWithIconSystem(event.request));
    return;
  }

  // Compose the original stylesheet with the Andalusian visual layer.
  if (url.pathname.endsWith('/css/style.css')) {
    event.respondWith((async () => {
      try {
        const [baseResponse, andalusianResponse] = await Promise.all([
          fetch(event.request),
          fetch(new URL('./css/andalusian.css', self.location.origin))
        ]);
        const base = await baseResponse.text();
        const layer = await andalusianResponse.text();
        return new Response(base + '\n\n/* Andalusian UI */\n' + layer, {
          status: 200,
          headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-cache' }
        });
      } catch (_) {
        return caches.match(event.request);
      }
    })());
    return;
  }

  event.respondWith(getNetworkOrCache(event.request));
});
