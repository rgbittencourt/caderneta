/* Caderneta — service worker: guarda o app no aparelho para abrir sem internet.
   Mude VERSAO a cada publicação para os aparelhos pegarem a versão nova. */
const VERSAO = "caderneta-v29";
const FONTES = "caderneta-fontes";
const LIBS = "caderneta-libs-2";
const APP = ["./", "./index.html", "./manifest.webmanifest", "./config.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./leitor.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(APP)));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => (k.startsWith("caderneta-v") && k !== VERSAO) || k === "caderneta-libs").map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });

/* rede primeiro; se não houver internet, a cópia guardada */
function redePrimeiro(req, chave, modo) {
  const pedido = modo ? new Request(req.url, { cache: modo, credentials: "same-origin" }) : req;
  return fetch(pedido).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(VERSAO).then(c => c.put(chave || req, cp)); }
    return r;
  }).catch(() => caches.match(chave || req));
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  /* fontes do Google: guarda depois da primeira vez */
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTES).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }
      catch (err) { return Response.error(); }
    }));
    return;
  }
  /* bibliotecas do leitor de documentos (versões fixas): guarda depois da primeira vez */
  if (/^(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net)$/.test(url.hostname)) {
    e.respondWith(caches.open(LIBS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      /* pede como CORS: a mesma resposta serve ao <script> e ao worker do pdf.js, e pode ser guardada */
      try { const r = await fetch(new Request(req.url, { mode: "cors", credentials: "omit" })); if (r.ok) c.put(req, r.clone()); return r; }
      catch (err) { try { return await fetch(req); } catch (e2) { return Response.error(); } }
    }));
    return;
  }
  /* login e Drive: sempre pela rede, nunca guardados */
  if (url.origin !== self.location.origin) return;

  /* a página e a configuração: rede primeiro, para pegar atualizações */
  if (req.mode === "navigate") { e.respondWith(redePrimeiro(req, "./index.html", "no-cache")); return; }
  if (url.pathname.endsWith("/config.js")) { e.respondWith(redePrimeiro(req, null, "no-store")); return; }

  /* ícones e o resto: cópia guardada primeiro */
  e.respondWith(caches.match(req).then(hit => hit || redePrimeiro(req)));
});
