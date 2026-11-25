// Service worker: permite abrir la app sin conexión.
// Sube el número de versión cada vez que publiques cambios.
const CACHE = 'finanzas-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Páginas: primero red (para recibir actualizaciones), si falla usa la copia guardada.
  // Solo la app (no la página de presentación ni la vista demo) se guarda para usarse sin conexión.
  const url = new URL(req.url);
  const root = new URL('./', self.registration.scope).pathname;
  const isApp = url.pathname === root || url.pathname === root + 'index.html';
  if (req.mode === 'navigate' && (!isApp || url.searchParams.has('demo'))) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Íconos y manifest: primero caché.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
