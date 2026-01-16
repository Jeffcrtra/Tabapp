const CACHE_NAME = "adoranza-v5";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("supabase")) return;

  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
