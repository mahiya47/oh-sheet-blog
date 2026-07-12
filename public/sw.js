const CACHE_NAME = "ohsheet-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch handler — required for Chrome to consider this
// installable as a PWA, even without real offline caching yet.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
