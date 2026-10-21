// Offline support: always try the network first so updates show up, fall back to cache offline.
const CACHE = "konqord-v3";
const FILES = ["./", "index.html", "styles.css", "manifest.webmanifest", "favicon.png", "apple-touch-icon.png", "icon-1024.png", "icon-192.png", "icon-512.png", "sprites/index.json", "sprites/emzi.png",
  "js/data.js", "js/sprites.js", "js/state.js", "js/battle.js", "js/ui.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.open(CACHE).then(c =>
    fetch(e.request)
      .then(r => { if (r.ok && new URL(e.request.url).origin === location.origin) c.put(e.request, r.clone()); return r; })
      .catch(() => c.match(e.request, { ignoreSearch: true }))
  ));
});
