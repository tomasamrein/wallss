// Service worker mínimo: solo habilita la instalación como PWA.
// Estrategia network-only (passthrough): NO cachea HTML ni JS, para evitar
// servir contenido viejo (chunks stale). La app necesita datos en vivo igual.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  // Passthrough explícito (requisito para que el navegador la considere instalable).
  event.respondWith(fetch(event.request));
});
