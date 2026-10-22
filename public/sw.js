/* ARXUM Fest — service worker dos módulos offline (jurado, apuração, caixa).
 * - Arquivos estáticos do Next (/_next/static) → cache primeiro (têm hash no nome).
 * - Telas offline → rede primeiro; sem rede, usa a última versão guardada.
 * - Dados não passam por aqui: ficam no IndexedDB de cada módulo.
 */
const VERSAO = "v1";
const CACHE_ESTATICO = `arxum-estatico-${VERSAO}`;
const CACHE_PAGINAS = `arxum-paginas-${VERSAO}`;
const BASE = "/fest";
const TELAS_OFFLINE = ["/jurado", "/jurados/apuracao", "/caixa", "/bilheteria"];

const ehTelaOffline = (url) =>
  TELAS_OFFLINE.some((t) => url.pathname === BASE + t || url.pathname.startsWith(BASE + t + "/"));

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes.filter((n) => n.startsWith("arxum-") && !n.endsWith(VERSAO)).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith(BASE + "/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_ESTATICO).then(async (cache) => {
        const guardado = await cache.match(req);
        if (guardado) return guardado;
        const resp = await fetch(req);
        if (resp.ok) cache.put(req, resp.clone());
        return resp;
      })
    );
    return;
  }

  if (req.mode === "navigate" && ehTelaOffline(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_PAGINAS);
        try {
          const resp = await fetch(req);
          // Só guarda telas realmente carregadas (não redirecionamentos para login)
          if (resp.ok && !resp.redirected) cache.put(url.pathname, resp.clone());
          return resp;
        } catch {
          const guardado = await cache.match(url.pathname);
          if (guardado) return guardado;
          return new Response(
            "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'>" +
              "<body style='font-family:sans-serif;background:#07090c;color:#d8e4f0;padding:24px'>" +
              "<h1 style='font-size:20px'>Sem conexão</h1><p>Esta tela ainda não foi preparada para uso offline neste aparelho. " +
              "Abra-a uma vez com internet.</p></body>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        }
      })()
    );
  }
});

// Mensagens da página: guardar a tela atual e seus arquivos; limpar ao sair da conta
self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.tipo === "guardar") {
    event.waitUntil(
      (async () => {
        const estatico = await caches.open(CACHE_ESTATICO);
        const paginas = await caches.open(CACHE_PAGINAS);
        await Promise.all(
          (msg.arquivos || []).map((u) =>
            estatico.match(u).then((ja) => ja || fetch(u).then((r) => r.ok && estatico.put(u, r)).catch(() => {}))
          )
        );
        if (msg.pagina) {
          const r = await fetch(msg.pagina, { credentials: "include" }).catch(() => null);
          if (r && r.ok && !r.redirected) await paginas.put(new URL(msg.pagina).pathname, r);
        }
        if (event.source) event.source.postMessage({ tipo: "guardado" });
      })()
    );
  }
  if (msg.tipo === "limpar") {
    event.waitUntil(caches.keys().then((ns) => Promise.all(ns.filter((n) => n.startsWith("arxum-")).map((n) => caches.delete(n)))));
  }
});
