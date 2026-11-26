// Keeps the app itself available offline. API responses are never cached here.
const CACHE = "locoman-shell-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        const page = await fetch("/", { cache: "reload" });
        const html = await page.clone().text();
        await cache.put("/", page);
        const files = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);
        await cache.addAll(files);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// These are public files that do not differ per request, so "Vary" headers are ignored.
const saved = (key) => caches.match(key, { ignoreVary: true });

async function save(key, response) {
  if (response.ok) await (await caches.open(CACHE)).put(key, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Pages: newest from the network, saved copy when offline.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((r) => save("/", r), () => saved("/")));
    return;
  }
  // Built files have unique names, so a saved copy never goes stale.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(saved(request).then((hit) => hit || fetch(request).then((r) => save(request, r))));
    return;
  }
  event.respondWith(fetch(request).then((r) => save(request, r), () => saved(request)));
});
