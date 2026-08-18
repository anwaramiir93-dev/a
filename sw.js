const CACHE_NAME = 'moallemi-v14';
const APP_VERSION = '14';

const ASSETS = [
  './', './index.html', './css/style.css',
  './js/core.js',
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
        const response = await fetch(`${asset}?v=${APP_VERSION}`, { cache: 'reload' });
        if (response.ok) await cache.put(asset, response.clone());
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return caches.match(request);
  }
}

async function appShellResponse(request) {
  const response = await networkFirst(request);
  if (!response || !response.ok) return response;

  // Inject the shared runtime without requiring every HTML deployment
  // to remember another script tag. This keeps the legacy vanilla-JS
  // architecture intact while giving all modules one runtime layer.
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  try {
    const source = await response.text();
    if (source.includes('js/core.js')) return new Response(source, response);

    const injected = source.replace(
      /<\/body>/i,
      '    <script src="js/core.js?v=14" defer></script>\n</body>'
    );

    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    return new Response(injected, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (_) {
    return response;
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(appShellResponse(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});
