/* Service worker do Guia 1305C (Next.js)
   - Documento (HTML): network-first — sempre a versão nova quando online.
   - Assets estáticos (/_next/static, imagens, ícones): cache-first.
   - Vídeo (.mp4): não intercepta (não cacheia os 14 MB; toca direto do CDN).
*/
const CACHE = "guia-1305c-v4";
const ASSETS = ["/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // deixa terceiros passarem

  // vídeo: não intercepta (evita cachear arquivo grande e quebrar range requests)
  if (req.destination === "video" || url.pathname.endsWith(".mp4")) return;

  const isDoc = req.mode === "navigate" || req.destination === "document";

  if (isDoc) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("/")),
        ),
    );
    return;
  }

  // cache-first para o restante (assets hasheados do Next, imagens, ícones).
  // Match EXATO (com query): as imagens são servidas por /_next/image?url=... — mesmo
  // path, só a query muda. Com ignoreSearch todas colapsariam na 1ª cacheada (o hero).
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
