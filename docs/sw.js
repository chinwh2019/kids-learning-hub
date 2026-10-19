// Keeps Qissa Time working offline. build.mjs fills in the version and the file list,
// so every new build gets a fresh cache and phones pick up new stories on their next visit.
const CACHE = 'qissa-time-4ce1ea9663';
const FILES = ["./","manifest.webmanifest","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon.svg"];
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('qissa-time-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // The page itself: try the network first so new stories show up, fall back to the saved copy.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); return res; })
      .catch(() => caches.match('./')));
    return;
  }
  // Icons, the manifest and the Google fonts: use the saved copy, and save anything new.
  if (url.origin === location.origin || FONTS.test(req.url)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
  }
});
