const CACHE_NAME = "adoranza-v5";

// Helper: resuelve rutas relativas al scope del SW (GitHub Pages friendly)
const SCOPE = new URL(self.registration.scope).pathname; // ej: "/Ofrendas/"
const toScoped = (p) => new URL(p, self.registration.scope).toString();

const ASSETS = [
  toScoped("./"),
  toScoped("./index.html"),
  toScoped("./manifest.json"),
  toScoped("./icons/icon-192.png"),
  toScoped("./icons/icon-512.png")
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // No uses addAll directo: si 1 falla, explota todo.
      await Promise.allSettled(
        ASSETS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            if (res.ok) await cache.put(url, res);
          } catch (_) {}
        })
      );
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // limpia caches viejos
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("supabase")) return;

  const url = new URL(e.request.url);

  // Solo manejar requests dentro del mismo origin y dentro del scope del SW
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SCOPE)) return;

  // Navegación (HTML): network-first con fallback
  if (e.request.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const res = await fetch(e.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(toScoped("./index.html"), res.clone());
        return res;
      } catch (_) {
        return (await caches.match(toScoped("./index.html"))) || Response.error();
      }
    })());
    return;
  }

  // Assets: cache-first, luego network
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
