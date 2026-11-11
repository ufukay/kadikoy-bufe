// Önce ağ, olmazsa önbellek: güncellemeler hemen gelir, çevrimdışı da açılır
const CACHE = 'kadikoy-bufe-v6';
const FILES = ["./", "index.html", "style.css", "game.js", "manifest.webmanifest", "art/ayran.png", "art/ayvalik.png", "art/bg.jpg", "art/cay.png", "art/ciger.png", "art/cop.png", "art/doner.png", "art/esnaf.png", "art/gazoz.png", "art/i_ciger.png", "art/i_doner.png", "art/i_ekmek.png", "art/i_kasar.png", "art/i_patates.png", "art/i_portakal.png", "art/i_salam.png", "art/i_sandvic.png", "art/i_sosis.png", "art/i_sucuk.png", "art/k_banknot.png", "art/k_bozuk.png", "art/k_kasa.png", "art/k_pos.png", "art/k_rulo.png", "art/k_tepsi.png", "art/kahve.png", "art/karisik.png", "art/kasarli.png", "art/kedi.png", "art/kizarmis.png", "art/limonata.png", "art/marti.png", "art/mutfak.jpg", "art/ogrenci.png", "art/patso.png", "art/plaza.png", "art/portakal.png", "art/salgam.png", "art/simit.png", "art/sis.png", "art/soda.png", "art/sosisli.png", "art/su.png", "art/sucuklu.png", "art/taraftar.png", "art/teyze.png", "art/turist.png", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
