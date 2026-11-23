// GRÃO — Service Worker v3
const CACHE = 'grao-v20';
const ASSETS = [
  '/grao/',
  '/grao/index.html',
  '/grao/manifest.json',
  '/grao/icon-192.png',
  '/grao/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first — sempre busca versão mais recente
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── Notificações push ──
// Sempre mostramos uma notificação a cada push recebido (exigência do iPhone).
self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (_) { try { p = { data: { body: e.data.text() } }; } catch (__) {} }
  const d = p.data || {}, n = p.notification || {};
  const title = d.title || n.title || 'Projeto Grão';
  const body = d.body || n.body || '';
  const url = d.url || '/grao/';
  e.waitUntil((async () => {
    await self.registration.showNotification(title, {
      body, icon: '/grao/icon-192.png', badge: '/grao/icon-192.png', data: { url }
    });
    // bolinha no ícone do app: quantas notificações ainda não foram vistas
    try {
      const n = (await self.registration.getNotifications()).length;
      if (self.navigator && self.navigator.setAppBadge) await self.navigator.setAppBadge(n);
    } catch (_) {}
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/grao/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if (c.url.includes('/grao/') && 'focus' in c) { if (/aprovar=1/.test(url)) c.postMessage({ go: 'aprovar' }); return c.focus(); } }
      return clients.openWindow(url);
    })
  );
});
