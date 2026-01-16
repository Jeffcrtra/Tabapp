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

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("supabase")) return;

  // ✅ Para el HTML principal: Network-first (evita quedar pegado en builds viejos)
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // ✅ Para assets: cache-first normal
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
