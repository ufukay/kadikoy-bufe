'use strict';

/* =========================================================
   Kadıköy Büfe
   Döngü: Mahalle (izometrik) → Toptancı → Büfenin içi (servis + mutfak) → Akşam özeti
   ========================================================= */

// ---------- Veri ----------
// Toptancıdan alınanlar: hazır ürünler ve malzemeler
const STOCK = {
  su:       { name: 'Su',             short: 'Su',      emoji: '💧', cost: 5,  ready: true },
  simit:    { name: 'Simit',          short: 'Simit',   emoji: '🥯', cost: 10, ready: true, spoils: true },
  ayran:    { name: 'Ayran',          short: 'Ayran',   emoji: '🥛', cost: 12, ready: true },
  gazoz:    { name: 'Gazoz',          short: 'Gazoz',   emoji: '🥤', cost: 18, ready: true },
  ekmek:    { name: 'Tost Ekmeği',    short: 'Ekmek',   emoji: '🍞', cost: 8,  note: 'tost için' },
  kasar:    { name: 'Kaşar',          short: 'Kaşar',   emoji: '🧀', cost: 22, note: 'tost için' },
  salgam:   { name: 'Şalgam',         short: 'Şalgam',  emoji: '🟣', cost: 14, ready: true, needs: ['dolap'] },
  limonata: { name: 'Limonata',       short: 'Limonata', emoji: '🍋', cost: 16, ready: true, needs: ['dolap'] },
  soda:     { name: 'Maden Suyu',     short: 'Soda',    emoji: '🟢', cost: 9,  ready: true, needs: ['dolap'] },
  sucuk:    { name: 'Sucuk',          short: 'Sucuk',   emoji: '🥓', cost: 25, note: 'sucuklu, karışık, Ayvalık', needs: ['sucuk'] },
  salam:    { name: 'Salam',          short: 'Salam',   emoji: '🥩', cost: 15, note: 'Ayvalık tostu için', needs: ['sucuk'] },
  sandvic:  { name: 'Sandviç Ekmeği', short: 'Sandviç', emoji: '🥖', cost: 8,  note: 'sosisli, patso, ciğer, döner', needs: ['sucuk', 'fritoz', 'kasap', 'doner'] },
  sosis:    { name: 'Sosis',          short: 'Sosis',   emoji: '🌭', cost: 18, note: 'sosisli için', needs: ['sucuk'] },
  ciger:    { name: 'Ciğer',          short: 'Ciğer',   emoji: '🍢', cost: 40, note: 'ciğer ekmek için', needs: ['kasap'] },
  doner:    { name: 'Döner Eti',      short: 'Döner',   emoji: '🥙', cost: 45, note: 'porsiyon; ocakta sen kesersin', needs: ['doner'] },
  patates:  { name: 'Patates',        short: 'Patates', emoji: '🥔', cost: 15, note: 'patso için, fritözde kızarır', needs: ['fritoz'] },
  cay:      { name: 'Çay',            short: 'Çay',     emoji: '🍵', cost: 4,  note: 'bardak başı', needs: ['semaver'] },
  portakal: { name: 'Portakal',       short: 'Portakal', emoji: '🍊', cost: 15, note: '2 adet = 1 bardak', needs: ['sikacak'] },
  kahve:    { name: 'Türk Kahvesi',   short: 'Kahve',   emoji: '☕', cost: 12, note: 'fincan başı', needs: ['cezve'] },
  fis:      { name: 'Fiş Rulosu',     short: 'Fiş',     emoji: '🧾', cost: 2,  note: 'müşteri başı 1 fiş; fişsiz satışa maliye ceza keser', noArt: true, cap: 100 },
};
// Son dokunuş: tostlar kesilir, sosisli ve patsoya müşterinin istediği sos sıkılır
const SAUCED = ['sosisli', 'patso'];
const SAUCE_NAME = { '': 'sade', k: 'ketçap', m: 'mayonez', km: 'ketçap + mayonez' };
const needsCut = (id) => DISHES[id].recipe && DISHES[id].recipe[0] === 'ekmek';
const needsPlate = (id) => needsCut(id) || SAUCED.includes(id);
const INGREDIENTS = ['ekmek', 'kasar', 'sucuk', 'salam', 'sandvic', 'sosis', 'ciger', 'patates'];

// Müşterinin sipariş ettikleri
const DISHES = {
  su:       { name: 'Su',            emoji: '💧', price: 15,  w: 3, kind: 'ready' },
  simit:    { name: 'Simit',         emoji: '🥯', price: 25,  w: 4, kind: 'ready' },
  ayran:    { name: 'Ayran',         emoji: '🥛', price: 30,  w: 3, kind: 'ready' },
  gazoz:    { name: 'Gazoz',         emoji: '🥤', price: 40,  w: 3, kind: 'ready' },
  salgam:   { name: 'Şalgam',        emoji: '🟣', price: 35,  w: 2, kind: 'ready', needs: 'dolap' },
  limonata: { name: 'Limonata',      emoji: '🍋', price: 45,  w: 3, kind: 'ready', needs: 'dolap' },
  soda:     { name: 'Maden Suyu',    short: 'Soda', emoji: '🟢', price: 25, w: 2, kind: 'ready', needs: 'dolap' },
  cay:      { name: 'Çay',           emoji: '🍵', price: 25,  w: 5, kind: 'pour', needs: 'semaver' },
  kahve:    { name: 'Türk Kahvesi',  short: 'Kahve', emoji: '☕', price: 60, w: 3, kind: 'pour', needs: 'cezve' },
  sucuklu:  { name: 'Sucuklu Tost',  short: 'Sucuklu', emoji: '🥪', price: 100, w: 3, kind: 'board', needs: 'sucuk', recipe: ['ekmek', 'sucuk'], cook: { time: 6, label: 'Bastır' } },
  ayvalik:  { name: 'Ayvalık Tostu', short: 'Ayvalık', emoji: '🥪', price: 180, w: 3, kind: 'board', needs: 'sucuk', recipe: ['ekmek', 'kasar', 'sucuk', 'salam'], cook: { time: 8, label: 'Bastır' } },
  ciger:    { name: 'Ciğer Ekmek',   short: 'Ciğer',   emoji: '🍢', price: 150, w: 4, kind: 'board', needs: 'kasap', recipe: ['sandvic', 'ciger'], cook: { time: 6, label: 'Çevir' } },
  doner:    { name: 'Döner',         short: 'Döner',   emoji: '🥙', price: 150, w: 5, kind: 'board', needs: 'doner', recipe: ['sandvic', 'doner'] },
  kasarli:  { name: 'Kaşarlı Tost',  short: 'Kaşarlı', emoji: '🥪', price: 90, w: 5, kind: 'board', recipe: ['ekmek', 'kasar'], cook: { time: 6, label: 'Bastır' } },
  karisik:  { name: 'Karışık Tost',  short: 'Karışık', emoji: '🥪', price: 130, w: 4, kind: 'board', needs: 'sucuk', recipe: ['ekmek', 'kasar', 'sucuk'], cook: { time: 7, label: 'Bastır' } },
  sosisli:  { name: 'Sosisli',       short: 'Sosisli', emoji: '🌭', price: 100, w: 4, kind: 'board', needs: 'sucuk', recipe: ['sandvic', 'sosis'], cook: { time: 5, label: 'Çevir' } },
  patso:    { name: 'Patso',         short: 'Patso',   emoji: '🍟', price: 105, w: 4, kind: 'board', needs: 'fritoz', recipe: ['sandvic', 'patates'] },
  portakal: { name: 'Portakal Suyu', short: 'P. Suyu', emoji: '🧃', price: 95, w: 3, kind: 'squeeze', needs: 'sikacak' },
};

const UPGRADES = {
  semaver: { name: 'Semaver',             emoji: '🫖', cost: 500, desc: 'Çay satışını açar. Bardağı sen doldurursun.' },
  sucuk:   { name: 'Şarküteri Anlaşması', emoji: '🥓', cost: 450, desc: 'Sucuk, salam ve sosis: sucuklu, karışık, Ayvalık tostu ve sosisli.' },
  dolap:   { name: 'Büyük Buzdolabı',     emoji: '🧊', cost: 400, desc: 'Yeni içecekler: şalgam, limonata, maden suyu.' },
  kasap:   { name: 'Kasap Anlaşması',     emoji: '🍢', cost: 700, desc: 'Ciğer gelir: ızgarada ciğer ekmek.' },
  doner:   { name: 'Döner Ocağı',         emoji: '🥙', cost: 1200, desc: 'Eti kendin kesersin: ekmek arası döner.' },
  fritoz:  { name: 'Fritöz',              emoji: '🍟', cost: 600, desc: 'Patates kızartırsın: patso menüye girer.' },
  cezve:   { name: 'Cezve Takımı',        emoji: '☕', cost: 450, desc: 'Türk kahvesi: köpüğü taşırmadan pişir.' },
  tente:   { name: 'Geniş Tente',         emoji: '⛱️', cost: 650, desc: 'Müşteriler %25 daha sabırlı bekler.' },
  grill2:  { name: 'Çift Tost Makinesi',  emoji: '♨️', cost: 700, desc: 'Izgara gözü 2 → 4.' },
  depo:    { name: 'Arka Depo',           emoji: '📦', cost: 800, desc: 'Stok kapasitesi 20 → 40.' },
  sikacak: { name: 'Portakal Sıkacağı',   emoji: '🍊', cost: 900, desc: 'Portakalı kendin sıkar, taze satarsın.' },
  mama:    { name: 'Mama Kabı',           emoji: '🐟', cost: 300, desc: 'Sokak kedisi günde 3 kez uğrar.' },
  pos:     { name: 'POS Cihazı',          emoji: '💳', cost: 600, desc: 'Kartla ödeme alırsın: müşteri %10 artar, kartlılar tam bahşiş bırakır. Banka %2 komisyon keser.' },
  tabela:  { name: 'Neon Tabela',         emoji: '💡', cost: 750, desc: 'Müşteri akışı %15 artar.' },
};

const POLICY = [
  { name: 'Ucuz',   mult: 0.85, spawn: 1.25, rep: 1.4, desc: 'Fiyatlar %15 düşük. Daha çok müşteri, itibar hızlı artar.' },
  { name: 'Normal', mult: 1,    spawn: 1,    rep: 1,   desc: 'Mahalle ortalaması fiyatlar.' },
  { name: 'Pahalı', mult: 1.2,  spawn: 0.78, rep: 0.7, desc: 'Fiyatlar %20 yüksek. Müşteri azalır, itibar yavaş artar.' },
];

const EVENTS = {
  normal:   { name: 'Güneşli Gün',     icon: '☀️', desc: 'Sıradan bir Kadıköy günü. Vapurlar dolu, martılar aç.', spawn: 1, pat: 1, tip: 1, w: {} },
  yagmur:   { name: 'Yağmurlu Gün',    icon: '🌧️', desc: 'Sokaklar tenha ama gelen sıcak bir şey ister: tost (ve varsa çay) stokla.', spawn: 0.8, pat: 1.1, tip: 1, w: { cay: 2.5, kasarli: 1.7, karisik: 1.7, su: 0.4, gazoz: 0.5 } },
  mac:      { name: 'Maç Günü',        icon: '⚽', desc: 'Stada akın var! Kalabalık ve sabırsız. Gazoz, su, tost ve sosisli kapış kapış.', spawn: 1.45, pat: 0.85, tip: 1, w: { gazoz: 2, su: 2, kasarli: 1.5, sosisli: 2, patso: 1.5, doner: 1.5 } },
  lodos:    { name: 'Lodos',           icon: '🌬️', desc: 'Vapur seferleri iptal. Müşteri az; fazla mal alma, simit bayatlar.', spawn: 0.7, pat: 1, tip: 1, noFerry: true, w: {} },
  festival: { name: 'Sokak Festivali', icon: '🎶', desc: 'Moda yolu şenlik yeri. Herkes keyifli, bahşişler iki katı!', spawn: 1.3, pat: 1.1, tip: 2, w: { ayran: 1.5, portakal: 1.8, simit: 1.5, patso: 1.5, limonata: 2 } },
};
Object.assign(EVENTS, {
  ramazan: { name: 'Ramazan',     icon: '🌙', desc: 'Gündüz sakin; iftar vakti (akşam) büyük kalabalık. Çay ve tost hazır olsun.', spawn: 1, pat: 1, tip: 1.2, w: { cay: 2, simit: 1.5 }, curve: (p) => (p < 0.66 ? 0.35 : 2.4) },
  bayram:  { name: 'Bayram',      icon: '🎉', desc: 'Herkes sokakta, cömert ve keyifli. Bahşişler 1,5 kat.', spawn: 1.35, pat: 1.15, tip: 1.5, w: { limonata: 1.5, doner: 1.3 } },
  secim:   { name: 'Seçim Günü',  icon: '🗳️', desc: 'Sandık sırası bekleyenler çay, simit ve su ister.', spawn: 1.15, pat: 1.1, tip: 1, w: { cay: 2, simit: 2, su: 1.5 } },
  kar:     { name: 'Kar Tatili',  icon: '⛄', desc: 'Okullar tatil, sokaklar boş; gelen ısınmak ister. Vapur seferleri aksıyor.', spawn: 0.6, pat: 1.2, tip: 1.2, noFerry: true, w: { cay: 2.5, kahve: 2, kasarli: 1.5, su: 0.3, limonata: 0.2 } },
});
// Özel müşteriler: paket siparişi alan kurye (ön ödemeli, büyük sipariş)
const COURIER = { id: 'esnaf', name: 'Kurye', tag: '📦 Paket', pat: 1.7, tip: 0, min: 3, max: 3, w: {} };
// Dükkânı büyütme basamakları
const TIERS = [
  { name: 'Büfe' },
  { name: 'Çift Pencere', cost: 4000,  desc: 'İkinci servis penceresi: aynı anda 4 müşteri.' },
  { name: 'Oturma Alanı', cost: 9000,  desc: 'Tabureler ve masa: müşteriler %20 daha sabırlı, bahşiş %20 fazla.' },
  { name: 'Lokanta',      cost: 20000, desc: 'Büfe lokanta oldu: fiyatlar %15 yüksek, müşteri %15 fazla.' },
];
const DIFF = {
  rahat:  { name: 'Rahat',  pat: 1.3, rent: 0.7, cash: 1500 },
  normal: { name: 'Normal', pat: 1,   rent: 1,   cash: 1000 },
  usta:   { name: 'Usta',   pat: 0.8, rent: 1.3, cash: 800 },
};
// Komşu esnaf: tost gönderdikçe kalp kazanır (0-5), karşılığında takas ve iyilik gelir
const NB = {
  cayci:  { name: 'Çaycı Hasan',  emoji: '🫖', perk: 'Müşteri yollar: kalp başına %3 fazla müşteri.', gift: () => { if (S.up.semaver) { S.stock.cay = Math.min(capOf('cay'), S.stock.cay + 4); return '4 bardaklık çay yolladı'; } S.cash += 30; return 'çay parası niyetine ₺30 bıraktı'; } },
  bakkal: { name: 'Bakkal Ayşe',  emoji: '🛒', perk: 'Toptan fiyatına verir: kalp başına %3 ucuz alışveriş.', gift: () => { S.stock.su = Math.min(capOf('su'), S.stock.su + 3); S.stock.gazoz = Math.min(capOf('gazoz'), S.stock.gazoz + 3); return '3 su, 3 gazoz yolladı'; } },
  berber: { name: 'Berber Cemal', emoji: '💈', perk: 'Bekleyenleri oyalar: kalp başına %2 sabır, her akşam biraz itibar.', gift: () => { S.rep = clamp(S.rep + 0.05, 0, 5); return 'dükkânda seni övdü (+itibar)'; } },
};
// Kişiselleştirme
const AWNS = [
  { name: 'Kırmızı',  c: '#e5383b', hue: -18 },
  { name: 'Lacivert', c: '#1d3f8f', hue: 195 },
  { name: 'Yeşil',    c: '#2a9d5c', hue: 100 },
  { name: 'Sarı',     c: '#f2b01e', hue: 22 },
  { name: 'Mor',      c: '#7b3fb5', hue: 255 },
];
const DECOS = [['Yok', '', ''], ['Çiçek', 'low', '🌷 💐 🌼 💐 🌷'], ['Flama', 'high', '🚩🏳️🚩🏳️🚩🏳️🚩🏳️🚩'], ['Işıklar', 'high lights', '💡 💡 💡 💡 💡 💡 💡']];
const PREFS_KEY = 'kadikoy-bufe-prefs', SCORES_KEY = 'kadikoy-bufe-scores';
const FIRST_WEEK = ['normal', 'yagmur', 'mac', 'festival', 'lodos', 'normal', 'mac'];

// Müşteri tipleri: sabır, bahşiş ve damak zevki farklı
const TYPES = [
  { id: 'ogrenci',  name: 'Öğrenci',  faces: ['🧑‍🎓', '🧑‍💻', '👩‍🎤'], pat: 1.1,  tip: 0.5, max: 2, wt: 4, w: { simit: 2, cay: 1.5, su: 1.3, patso: 1.5, doner: 1.4 } },
  { id: 'teyze',    name: 'Teyze',    faces: ['👵', '🧕', '👴'],       pat: 1.5,  tip: 1,   max: 2, wt: 3, w: { cay: 2, ayran: 1.5, limonata: 1.5 } },
  { id: 'esnaf',    name: 'Esnaf',    faces: ['👷', '🧔', '👨‍🍳'],      pat: 0.9,  tip: 1,   wt: 3, w: { kasarli: 1.6, karisik: 1.6, ayran: 1.5, ciger: 2, doner: 1.5, salgam: 2 } },
  { id: 'plaza',    name: 'Plazacı',  faces: ['👨‍💼', '👩‍💼'],           pat: 0.7,  tip: 2.5, max: 2, wt: 2, w: { portakal: 2, karisik: 1.5 } },
  { id: 'turist',   name: 'Turist',   faces: ['🤠', '👱‍♀️', '🧑‍🦰'],      pat: 1,    tip: 2,   min: 2, wt: 1.5, w: { doner: 2, ayvalik: 1.8 } },
  { id: 'taraftar', name: 'Taraftar', faces: ['🥳', '🙋‍♂️'],            pat: 0.8,  tip: 1,   wt: 6, only: 'mac', w: { gazoz: 2.5, su: 1.5, sosisli: 1.5 } },
];

// Konumlar: her birinin kirası, kalabalığı ve müşteri kitlesi farklı
const LOCS = {
  carsi:    { name: 'Kadıköy Çarşı', cost: 0,    rent: 0,   spawn: 1,    pat: 1,    tip: 1,   desc: 'Dengeli. Herkes uğrar.', tw: {} },
  iskele:   { name: 'İskele',        cost: 3000, rent: 150, spawn: 1.25, pat: 0.85, tip: 1,   desc: 'Vapur sık yanaşır; kalabalık ama aceleci.', tw: { plaza: 2, turist: 2 }, ferries: [12, 32, 52, 72, 92] },
  bahariye: { name: 'Bahariye',      cost: 4500, rent: 250, spawn: 1.4,  pat: 1,    tip: 0.8, desc: 'Öğrenci akını: çok müşteri, az bahşiş.', tw: { ogrenci: 3 } },
  moda:     { name: 'Moda Sahili',   cost: 6500, rent: 400, spawn: 0.9,  pat: 1.25, tip: 1.8, desc: 'Keyifli ve cömert müşteriler; kira yüksek.', tw: { turist: 2, teyze: 1.5, plaza: 1.5 } },
};

// Mevsim her 7 günde değişir
const SEASONS = [
  { name: 'Yaz',      icon: '☀️', spawn: 1,   w: { limonata: 1.6, su: 1.5, gazoz: 1.4, ayran: 1.4, salgam: 1.2, portakal: 1.3, cay: 0.6, kahve: 0.7 } },
  { name: 'Sonbahar', icon: '🍂', spawn: 1,   w: { cay: 1.3, kahve: 1.3 } },
  { name: 'Kış',      icon: '❄️', spawn: 0.9, w: { cay: 1.8, kahve: 1.5, kasarli: 1.3, karisik: 1.3, ayvalik: 1.3, sucuklu: 1.3, su: 0.6, limonata: 0.4, gazoz: 0.6 } },
  { name: 'İlkbahar', icon: '🌸', spawn: 1.1, w: { simit: 1.3, portakal: 1.4, limonata: 1.2 } },
];
// Mevsim: normalde 7 günde bir değişir; "gerçek hava ve mevsim" açıksa takvime göre
const season = () => {
  if (prefs.real) { const m = new Date().getMonth(); return SEASONS[m >= 5 && m <= 8 ? 0 : m >= 9 && m <= 10 ? 1 : m >= 2 && m <= 4 ? 3 : 2]; }
  return SEASONS[Math.floor((S.day - 1) / 7) % 4];
};
const nbH = (id) => (S.nb && S.nb[id]) || 0;
const costOf = (id) => Math.max(1, Math.round(STOCK[id].cost * (1 - 0.03 * nbH('bakkal'))));
const wxMode = () => (S.event === 'yagmur' ? 'rain' : S.event === 'kar' ? 'snow' : null);

// Müdavimler: hep aynı şeyi ister, iyi hizmetle sadakati (0-5 kalp) artar
const REGULARS = [
  { id: 'nermin', name: 'Nermin Teyze', type: 'teyze',   order: ['cay', 'simit'], alt: ['ayran', 'simit'] },
  { id: 'kemal',  name: 'Kemal Usta',   type: 'esnaf',   order: ['kasarli', 'ayran'] },
  { id: 'deniz',  name: 'Deniz',        type: 'ogrenci', order: ['simit', 'su'] },
  { id: 'selin',  name: 'Selin Hanım',  type: 'plaza',   order: ['kasarli', 'gazoz'] },
];

// Rakip büfenin kampanya yaptığı kategoriler
const RIVAL = {
  tost:    { name: 'tostta',    test: (id) => needsCut(id) },
  sandvic: { name: 'sandviçte', test: (id) => !!DISHES[id].recipe && DISHES[id].recipe[0] === 'sandvic' },
  icecek:  { name: 'içecekte',  test: (id) => DISHES[id].kind !== 'board' && id !== 'simit' },
};

const DAY_LEN = 110;           // saniye (08:00 → 22:00)
const NIGHT_LEN = 35;          // gece vardiyası (22:00 → 02:00)
const NIGHT_COST = 150, CAMPAIGN_COST = 200, FINE = 150;
const POS_FEE = 0.02;                  // kartlı satıştan banka komisyonu
const CARD_RATE = { teyze: 0.15, plaza: 0.75, turist: 0.7 };   // tipine göre kartla ödeme eğilimi (diğerleri 0.45)
const LOAN_RATE = 0.2, LOAN_DAYS = 5;   // banka: %20 faiz, 5 günlük taksit
const COLD = 15;               // tabakta bekleyen yemek kaç saniyede soğur
const DEM = 6;                 // bir demlikten kaç bardak çay çıkar
// Üç iş: mutfak, servis, kasa. Hepsini kendin yapabilir ya da eleman tutup birine odaklanabilirsin.
const CREW = {
  asci:    { name: 'Aşçı',    emoji: '👨‍🍳', wage: 450, desc: 'Mutfakta çalışır: tostu hazırlar, pişirir, keser, sosunu sıkar.' },
  garson:  { name: 'Garson',  emoji: '🤵', wage: 250, desc: 'Serviste çalışır: hazır ürünleri ve pişen yemekleri müşteriye götürür.' },
  kasiyer: { name: 'Kasiyer', emoji: '💁', wage: 200, desc: 'Kasada çalışır: hesabı alır, para üstünü verir.' },
};
const wages = () => Object.keys(CREW).reduce((a, k) => a + (S.crew[k] ? CREW[k].wage : 0), 0);
const SAVE_KEY = 'kadikoy-bufe-v2';
const BEST_KEY = 'kadikoy-bufe-best';

// ---------- Yardımcılar ----------
// Çizimler art/ klasöründe: yemekler kendi adıyla, çiğ malzemeler i_ önekiyle
const pic = (name, cls = '') => `<img class="spr ${cls}" src="art/${name}.png" alt="" draggable="false">`;
const dPic = (id) => pic((DISHES[id] && DISHES[id].art) || id);
const sPic = (id) => (STOCK[id].noArt ? `<span class="emj">${STOCK[id].emoji}</span>` : pic(STOCK[id].ready || id === 'cay' || id === 'kahve' ? id : 'i_' + id));
const onBoardPic = (id) => pic(id === 'patates' ? 'kizarmis' : 'i_' + id);
const $ = (s) => document.querySelector(s);
const tl = (n) => (n < 0 ? '−' : '') + '₺' + Math.abs(Math.round(n)).toLocaleString('tr-TR');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round5 = (n) => Math.round(n / 5) * 5;
function h(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
let prefs = { diff: 'normal', vib: true, left: false, big: false, real: false };
function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key));
    if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val));
  } catch (e) { /* özel sekme vb. */ }
  return null;
}

// Günlük görevler
const GOALS = {
  serve:   { make: (d, k) => clamp(Math.round((9 + d * 1.2) * k), 6, 28), text: (n) => `${n} müşteriyi memnun et`, val: (st) => st.served },
  rev:     { make: (d, k) => Math.min(3500, Math.round((650 + 150 * d) * k / 50) * 50), text: (n) => `${tl(n)} ciro yap`, val: (st) => st.rev, money: true },
  tips:    { make: (d, k) => Math.min(300, round5((50 + 20 * d) * k)), text: (n) => `${tl(n)} bahşiş topla`, val: (st) => st.tips, money: true },
  combo:   { make: (d) => Math.min(12, 4 + d), text: (n) => `${n} müşterilik seri yakala`, val: (st) => st.bestCombo },
  tost:    { make: (d) => Math.min(12, 3 + d), text: (n) => `Hiç yakmadan ${n} tost sat`, val: (st) => (st.burnt ? 0 : st.tost) },
  perfect: { make: (d) => Math.min(14, 4 + d), text: (n) => `${n} ürünü tam kıvamında çıkar`, val: (st) => st.perfect },
  loss:    { make: () => 2, text: (n) => `En fazla ${n} müşteri kaçır`, ok: (st, n) => st.lost + st.sent <= n && st.served >= 6, prog: (st) => `${st.lost + st.sent} kaçtı` },
};
const goalText = (g) => GOALS[g.id].text(g.n);
const goalOk = (g, st) => (GOALS[g.id].ok ? GOALS[g.id].ok(st, g.n) : GOALS[g.id].val(st) >= g.n);
function goalProg(g, st) {
  const G = GOALS[g.id];
  if (G.prog) return G.prog(st);
  const v = Math.min(G.val(st), g.n);
  return G.money ? `${tl(v)} / ${tl(g.n)}` : `${v} / ${g.n}`;
}
function pickGoals() {
  const ids = Object.keys(GOALS).sort(() => Math.random() - 0.5).slice(0, 2);
  const k = EVENTS[S.event].spawn;
  return ids.map((id) => ({ id, n: GOALS[id].make(S.day, k), reward: Math.min(400, 150 + 25 * S.day) }));
}

// Başarımlar: oyunlar arasında kalıcıdır, her biri ₺100 kazandırır
const ACH_KEY = 'kadikoy-bufe-ach', DAILY_KEY = 'kadikoy-bufe-daily';
const ACH = {
  ilk:     { name: 'İlk Siftah',        desc: 'İlk müşterini memnun et',                 test: () => S.total.served >= 1 },
  yuz:     { name: 'Yüz Müşteri',       desc: 'Toplam 100 müşteriye hizmet ver',         test: () => S.total.served >= 100 },
  seri:    { name: 'Seri Usta',         desc: 'Bir günde 10 müşterilik seri yakala',     test: (st) => st.bestCombo >= 10 },
  kivam:   { name: 'Kıvam Ustası',      desc: 'Bir günde 15 ürünü kıvamında çıkar',      test: (st) => st.perfect >= 15 },
  temiz:   { name: 'Kimse Küsmedi',     desc: 'En az 10 müşterili günü kayıpsız bitir',  test: (st) => st.served >= 10 && st.lost + st.sent === 0 },
  hafta:   { name: 'İlk Hafta',         desc: '7. günü tamamla',                         test: () => S.day >= 7 },
  zengin:  { name: 'Kasa Doldu',        desc: 'Kasada ₺10.000 biriktir',                 test: () => S.cash >= 10000 },
  yildiz:  { name: 'Beş Yıldız',        desc: 'İtibarı 5.0 yap',                         test: () => S.rep >= 4.995 },
  mudavim: { name: 'Mahallenin Büfesi', desc: 'Bir müdavimi 5 kalbe çıkar',              test: () => Object.values(S.reg).some((v) => v >= 5) },
  sube:    { name: 'Şube Açtım',        desc: 'İkinci bir konum aç',                     test: () => Object.keys(S.locs).length >= 2 },
  menu:    { name: 'Dolu Menü',         desc: '15 farklı ürün sat',                      test: () => Object.keys(S.sold).length >= 15 },
  kedi:    { name: 'Kedi Dostu',        desc: 'Kediyi 10 kez sev',                       test: () => (S.total.cats || 0) >= 10 },
  gece:    { name: 'Gece Kuşu',         desc: 'Bir gece vardiyasını tamamla',            test: () => S.night },
  zabita:  { name: 'Tertemiz',          desc: 'Zabıta denetiminden cezasız çık',         test: (st) => st.inspClean },
};
// Her takvim günü ilk girişte: ₺100 × üst üste gün (en çok ₺500)
function claimDaily() {
  const day = (ms) => new Date(ms).toLocaleDateString('sv');
  const rec = store(DAILY_KEY) || {}, today = day(Date.now());
  if (rec.date === today) return null;
  const streak = rec.date === day(Date.now() - 864e5) ? (rec.streak || 0) + 1 : 1;
  store(DAILY_KEY, { date: today, streak });
  return { amount: Math.min(500, 100 * streak), streak };
}
function enterGame() {
  applyCustom();
  const d = claimDaily();
  S.notice = null;
  if (d) { S.cash += d.amount; S.notice = `🎁 Günlük ödül: +${tl(d.amount)} (${d.streak}. gün)`; }
  startMorning();
}

// ---------- Ses ----------
let actx = null;
let muted = store('kadikoy-bufe-mute') === true;
function beep(freq, dur = 0.08, type = 'square', vol = 0.05, delay = 0) {
  if (muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    const t = actx.currentTime + delay;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + dur);
  } catch (e) { /* ses yoksa sessiz devam */ }
}
const sfx = {
  coin: () => { beep(880, 0.07); beep(1320, 0.1, 'square', 0.05, 0.07); },
  tip: () => { beep(1046, 0.06); beep(1318, 0.06, 'square', 0.05, 0.06); beep(1568, 0.12, 'square', 0.05, 0.12); },
  err: () => beep(160, 0.12, 'sawtooth', 0.04),
  ready: () => beep(660, 0.12, 'triangle', 0.08),
  put: () => beep(300, 0.05, 'triangle', 0.06),
  angry: () => { beep(220, 0.12, 'sawtooth', 0.05); beep(150, 0.2, 'sawtooth', 0.05, 0.1); },
  horn: () => beep(140, 0.5, 'sawtooth', 0.05),
  meow: () => { beep(700, 0.1, 'sine', 0.08); beep(520, 0.18, 'sine', 0.08, 0.1); },
};
// Izgara cızırtısı: süzülmüş gürültü, pişen ürün sayısına göre yükselir
let sizzle = null;
function setSizzle(level) {
  try {
    if (!actx || muted) { if (sizzle) sizzle.gain.value = 0; return; }
    if (!sizzle) {
      const buf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
      src.buffer = buf; src.loop = true; f.type = 'highpass'; f.frequency.value = 3800; g.gain.value = 0;
      src.connect(f).connect(g).connect(actx.destination); src.start();
      sizzle = g;
    }
    sizzle.gain.value = level;
  } catch (e) { /* ses yoksa sessiz devam */ }
}
// Fon müziği: hicaz dizisinde küçük bir döngü
let musicOn = store('kadikoy-bufe-music') !== false, beatT = 0, beatI = 0;
const N = { D: 293.7, E: 311.1, F: 370, G: 392, A: 440, B: 466.2, C: 523.3, d: 587.3 };
const TUNE = 'A.BAG.FGA.dCBAGF' + 'D.FGA.GFE.D.FGA.' + 'A.BAG.FGA.dCBAGF' + 'G.FED.EFG.A.G.D.';
const BASS = [146.8, 146.8, 196, 220, 146.8, 196, 146.8, 146.8];
function musicTick(dt) {
  if (!musicOn || muted) return;
  beatT -= dt;
  if (beatT > 0) return;
  beatT += 0.27;
  const n = TUNE[beatI % TUNE.length];
  if (n !== '.') beep(N[n], 0.3, 'triangle', 0.022);
  if (beatI % 8 === 0) beep(BASS[(beatI / 8) % BASS.length], 0.9, 'sine', 0.03);
  beatI++;
}
const buzz = (ms) => { try { prefs.vib && navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* yok say */ } };

// ---------- Durum ----------
let S = null;   // kalıcı oyun durumu
let D = null;   // o günün geçici durumu
let morningBase = {};

function newGame() {
  const stock = {};
  for (const id in STOCK) stock[id] = 0;
  Object.assign(stock, { su: 10, simit: 10, ayran: 8, gazoz: 8, ekmek: 10, kasar: 10, fis: 30 });
  return {
    day: 1, cash: DIFF[prefs.diff].cash, diff: prefs.diff, tier: 0, mgr: {}, seasonServed: 0, trophies: 0,
    rep: 2.5, policy: 1, event: 'normal', stock,
    up: {}, spent: { goods: 0, invest: 0 }, total: { served: 0, cats: 0 },
    staff: false, goals: null, goalsDay: 0,
    loc: 'carsi', locs: { carsi: true }, reg: {}, night: false, rival: null, campaign: false,
    ach: {}, sold: {}, tut: false, loan: null, crew: {},
    coins: 20, savings: 0, weekRev: 0,
    prep: 0, prepDone: false, skill: {}, custom: null,
    nb: {}, nbDay: {}, style: { awn: 0, sign: 'BÜFE', deco: 0, cat: 'Tekir' },
  };
}
const dishOpen = (id) => !DISHES[id].needs || !!S.up[DISHES[id].needs];
const stockOpen = (id) => !STOCK[id].needs || STOCK[id].needs.some((u) => S.up[u]);
const menu = () => Object.keys(DISHES).filter(dishOpen);
const cap = () => (S.up.depo ? 40 : 20);
const capOf = (id) => STOCK[id].cap || cap();
const price = (id) => round5(DISHES[id].price * POLICY[S.policy].mult * (S.tier >= 3 ? 1.15 : 1));
const nSlots = () => (S.tier >= 1 ? 4 : 3);
const slotX = (i) => (nSlots() === 4 ? [12.5, 37.5, 62.5, 87.5] : [17.5, 50, 82.5])[i];
const franchise = () => Object.keys(S.mgr || {}).filter((id) => S.mgr[id] && S.locs[id] && id !== S.loc).reduce((a, id) => a + round5((150 + S.rep * 90) * LOCS[id].spawn), 0);
const rent = (day) => Math.round((300 + 75 * (day - 1) + LOCS[S.loc].rent) * DIFF[S.diff || 'normal'].rent);
// Banka: limit itibara bağlı; borç günlük taksitle kapanır
const loanLimit = () => Math.round((1500 + S.rep * 700) / 500) * 500;
const loanRoom = () => Math.max(0, loanLimit() - (S.loan ? Math.ceil(S.loan.left / (1 + LOAN_RATE)) : 0));
function takeLoan(a) {
  const left = (S.loan ? S.loan.left : 0) + Math.round(a * (1 + LOAN_RATE));
  S.loan = { left, pay: Math.ceil(left / LOAN_DAYS / 5) * 5 };
  S.cash += a;
  sfx.coin();
}
// Ustalık: bir yemeği kıvamında çıkardıkça seviye atlar (en çok 5), her seviye pişirmeyi %5 hızlandırır
const skillLvl = (id) => Math.min(5, Math.floor(Math.sqrt(((S.skill || {})[id] || 0) / 4)));
// Açılış hazırlığı (0-3 yıldız) her yıldızda %10 hızlandırır
const cookTime = (id) => DISHES[id].cook.time * (1 - 0.1 * (S.prep || 0)) * (1 - 0.05 * skillLvl(id));
// Tarif defteri: oyuncunun kendi tostu menüye 'ozel' olarak girer
const FILLINGS = ['kasar', 'sucuk', 'salam'];
function applyCustom() {
  delete DISHES.ozel;
  const cu = S && S.custom;
  if (!cu) return;
  const cost = 8 + cu.fill.reduce((a, x) => a + STOCK[x].cost, 0);
  DISHES.ozel = { name: cu.name, short: cu.name.slice(0, 9), price: round5(cost * 2.7), w: 5, kind: 'board', needs: 'sucuk', recipe: ['ekmek', ...cu.fill], cook: { time: 6.5, label: 'Bastır' }, art: cu.fill.length >= 2 ? 'karisik' : 'sucuklu' };
}
const dayLen = () => DAY_LEN + (S.night ? NIGHT_LEN : 0);
const rivalHits = (id) => !!S.rival && !S.campaign && RIVAL[S.rival].test(id);
const cookQ = (o, over) => (o && o.well ? (over ? 'perfect' : 'ok') : (over ? 'flaw' : 'perfect'));
const pickEvent = (day) => FIRST_WEEK[day - 1] || Object.keys(EVENTS)[Math.floor(Math.random() * Object.keys(EVENTS).length)];

// ---------- Hava efekti: gerçek damlalar, sıçramalar, şimşek; karda taneler ----------
const fx = { cv: null, raf: 0, mode: null };
let rainSnd = null;
function setRainSound(on) {
  try {
    if (!actx || muted || !on) { if (rainSnd) rainSnd.gain.value = 0; return; }
    if (!rainSnd) {
      const buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
      src.buffer = buf; src.loop = true; f.type = 'lowpass'; f.frequency.value = 1700; g.gain.value = 0;
      src.connect(f).connect(g).connect(actx.destination); src.start();
      rainSnd = g;
    }
    rainSnd.gain.value = 0.045;
  } catch (e) { /* ses yoksa sessiz devam */ }
}
function setWeatherFx(host, mode) {
  cancelAnimationFrame(fx.raf);
  if (fx.cv) fx.cv.remove();
  fx.cv = null; fx.mode = mode || null;
  setRainSound(mode === 'rain');
  if (!host || !mode) return;
  const cv = h('canvas', 'fxcanvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
  host.insertBefore(cv, host.querySelector('.counter') || null);
  const W = cv.clientWidth || host.clientWidth, H = cv.clientHeight || host.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  fx.cv = cv;
  const inShop = host.id === 'scene';                 // dükkânın içinden bakış: damlalar kaldırıma düşer
  const rain = mode === 'rain', parts = [], splashes = [];
  const reset = (p, first) => {
    p.z = 0.3 + Math.random() * 0.7;                  // derinlik: uzak damla kısa, yavaş, soluk
    p.x = Math.random() * (W + 80);
    p.y = first ? Math.random() * H : -20 - Math.random() * 60;
    p.ground = inShop ? H * (0.56 + 0.3 * p.z) : H * (0.35 + 0.65 * Math.random());
    if (rain) { p.spd = (560 + Math.random() * 260) * p.z; p.len = (11 + Math.random() * 15) * p.z; }
    else { p.spd = (26 + Math.random() * 40) * p.z; p.r = (1 + Math.random() * 2.4) * p.z; p.ph = Math.random() * 6.28; }
  };
  for (let i = 0; i < (rain ? 190 : 120); i++) { const p = {}; reset(p, true); parts.push(p); }
  let last = performance.now(), flash = 0, nextFlash = 6 + Math.random() * 14;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, W, H);
    if (rain) {
      ctx.fillStyle = 'rgba(190, 205, 220, 0.07)';    // ince sis
      ctx.fillRect(0, H * 0.3, W, H * 0.7);
      ctx.lineCap = 'round';
      for (const p of parts) {
        p.y += p.spd * dt; p.x -= p.spd * 0.2 * dt;   // rüzgârla hafif yatık
        if (p.y >= p.ground) { splashes.push({ x: p.x, y: p.ground, t: 0, r: 2.5 + 4 * p.z }); reset(p); continue; }
        ctx.strokeStyle = `rgba(215, 228, 242, ${(0.22 + 0.5 * p.z).toFixed(2)})`;
        ctx.lineWidth = 0.8 + p.z * 0.9;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.len * 0.2, p.y - p.len); ctx.stroke();
      }
      for (let i = splashes.length - 1; i >= 0; i--) {  // yere çarpan damlanın halkası
        const sp = splashes[i];
        sp.t += dt;
        if (sp.t > 0.28) { splashes.splice(i, 1); continue; }
        const k = sp.t / 0.28;
        ctx.strokeStyle = `rgba(230, 240, 250, ${(0.55 * (1 - k)).toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(sp.x, sp.y, sp.r * (0.4 + k * 1.6), sp.r * (0.15 + k * 0.5), 0, 0, 6.28); ctx.stroke();
      }
      if ((nextFlash -= dt) <= 0) {                   // şimşek ve gök gürültüsü
        nextFlash = 10 + Math.random() * 22; flash = 1;
        beep(70, 0.9, 'sawtooth', 0.05, 0.35); beep(48, 1.3, 'sawtooth', 0.04, 0.6);
      }
      if (flash > 0) { ctx.fillStyle = `rgba(255, 255, 255, ${(flash * 0.38).toFixed(2)})`; ctx.fillRect(0, 0, W, H); flash -= dt * (flash > 0.6 ? 6 : 1.6); }
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      for (const p of parts) {
        p.y += p.spd * dt; p.ph += dt * 1.6; p.x += Math.sin(p.ph) * 14 * dt;
        if (p.y >= p.ground) { reset(p); continue; }
        ctx.globalAlpha = 0.45 + 0.5 * p.z;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    fx.raf = requestAnimationFrame(frame);
  };
  fx.raf = requestAnimationFrame(frame);
}

function show(id) {
  if (id !== 'day' && id !== 'hub') setWeatherFx(null);
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

// =========================================================
// ANA MENÜ
// =========================================================
function applyPrefs() {
  $('#app').classList.toggle('lefty', !!prefs.left);
  $('#app').classList.toggle('bigbtn', !!prefs.big);
}
function openSettings() {
  const seg = $('#diffSeg'); seg.innerHTML = '';
  Object.entries(DIFF).forEach(([id, d]) => {
    const b = h('button', prefs.diff === id ? 'on' : '', d.name);
    b.onclick = () => { prefs.diff = id; store(PREFS_KEY, prefs); openSettings(); };
    seg.append(b);
  });
  $('#diffNote').textContent = running || S ? 'Zorluk yeni oyunda geçerli olur.' : 'Rahat: sabırlı müşteri, düşük kira. Usta: tam tersi.';
  const box = $('#prefBtns'); box.innerHTML = '';
  [['vib', 'Titreşim'], ['left', 'Sol el düzeni'], ['big', 'Büyük düğmeler'], ['real', 'Gerçek hava ve mevsim']].forEach(([k, label]) => {
    const b = h('button', 'btn', `${label}: ${prefs[k] ? 'Açık' : 'Kapalı'}`);
    b.onclick = () => { prefs[k] = !prefs[k]; store(PREFS_KEY, prefs); applyPrefs(); openSettings(); };
    box.append(b);
  });
  $('#settings').hidden = false;
}

function renderTitle() {
  const save = store(SAVE_KEY);
  $('#btnContinue').hidden = !save;
  if (save) $('#btnContinue').textContent = `Devam Et · Gün ${save.day}`;
  const best = store(BEST_KEY);
  $('#bestLine').textContent = best ? `En iyi ilk hafta kasası: ${tl(best)}` : 'İlk haftayı çıkar, mahallenin efsanesi ol.';
  show('title');
}

// =========================================================
// MAHALLE (izometrik)
// =========================================================
function isoScene() {
  const TW = 32, TH = 16, ZH = 26;
  const P = (x, y, z = 0) => [(x - y) * TW, (x + y) * TH - z * ZH];
  const str = (a) => a.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const poly = (a, fill, extra = '') => `<polygon points="${str(a)}" fill="${fill}" ${extra}/>`;
  const top = (x0, y0, x1, y1, z, fill) => poly([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], fill);
  const faceL = (x0, x1, y, z0, z1, fill) => poly([P(x0, y, z1), P(x1, y, z1), P(x1, y, z0), P(x0, y, z0)], fill);   // y sabit (sol-ön yüz)
  const faceR = (x, y0, y1, z0, z1, fill) => poly([P(x, y0, z1), P(x, y1, z1), P(x, y1, z0), P(x, y0, z0)], fill);   // x sabit (sağ-ön yüz)
  const box = (x0, y0, x1, y1, z0, z1, c) => top(x0, y0, x1, y1, z1, c[0]) + faceL(x0, x1, y1, z0, z1, c[1]) + faceR(x1, y0, y1, z0, z1, c[2]);
  const line = (a, b, stroke, w = 1) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${stroke}" stroke-width="${w}"/>`;
  const text = (x, y, z, s, size, fill, face) => {
    const [px, py] = P(x, y, z);
    const m = face === 'L' ? '1,0.5,0,1' : face === 'R' ? '1,-0.5,0,1' : '1,0,0,1';
    return `<text transform="matrix(${m},${px.toFixed(1)},${py.toFixed(1)})" font-size="${size}" font-weight="900" fill="${fill}">${s}</text>`;
  };
  const emoji = (x, y, z, e, size) => { const [px, py] = P(x, y, z); return `<text x="${px.toFixed(1)}" y="${py.toFixed(1)}" font-size="${size}" text-anchor="middle">${e}</text>`; };
  const building = (x0, y0, x1, y1, floors, c) => {
    let s = box(x0, y0, x1, y1, 0, floors * 0.8 + 0.25, c);
    for (let f = 0; f < floors; f++) {
      const z = 0.3 + f * 0.8;
      for (let u = x0 + 0.2; u < x1 - 0.3; u += 0.5) s += faceL(u, u + 0.28, y1, z, z + 0.42, '#fff3c4');
      for (let v = y0 + 0.2; v < y1 - 0.3; v += 0.5) s += faceR(x1, v, v + 0.28, z, z + 0.42, '#e3cf8f');
    }
    return s;
  };
  const tree = (x, y) => {
    const [px, py] = P(x, y, 0);
    return `<rect x="${px - 2}" y="${py - 22}" width="4" height="22" fill="#7c4a25"/><circle cx="${px}" cy="${py - 30}" r="14" fill="#3f9b57"/><circle cx="${px - 5}" cy="${py - 35}" r="8" fill="#5cb872"/>`;
  };

  // --- Zemin ---
  let g = box(0, 0, 9, 9, -0.5, 0, ['#d9cfbb', '#b9a98c', '#a39176']);
  g += top(0, 0, 9, 2, 0, '#2c9fb5') + top(0, 2, 9, 3, 0, '#eee3cc') + top(0, 3, 9, 4, 0, '#5b6170') + top(0, 4, 9, 9, 0, '#d9cfbb');
  g += faceR(9, 0, 2, -0.5, 0, '#1b7f95');
  for (let i = 5; i < 9; i++) g += line(P(0, i), P(9, i), 'rgba(0,0,0,.07)');
  for (let j = 1; j < 9; j++) g += line(P(j, 4), P(j, 9), 'rgba(0,0,0,.07)');
  g += line(P(0, 3.35), P(9, 3.35), '#8d93a3', 1.5) + line(P(0, 3.65), P(9, 3.65), '#8d93a3', 1.5);
  for (const [wx, wy] of [[1, 0.5], [6.5, 0.4], [7.6, 1.3], [0.8, 1.5], [5.8, 1.6]]) g += line(P(wx, wy), P(wx + 0.5, wy), 'rgba(255,255,255,.55)', 1.5);
  g += box(6, 1.4, 6.7, 2.1, 0, 0.12, ['#c9a26b', '#a8824f', '#8d6a3d']);   // iskele

  // --- Vapur ---
  const W = ['#ffffff', '#e6ebf2', '#cfd6e0'];
  g += '<g class="iso-ferry">' + box(2, 0.5, 5.2, 1.4, 0, 0.35, W) + box(2.5, 0.65, 4.7, 1.25, 0.35, 0.8, ['#fdf6e3', '#f1e4bf', '#dccf9f']) +
    faceL(2.7, 4.5, 1.25, 0.48, 0.68, '#2a4d7a') + box(3.4, 0.85, 3.8, 1.05, 0.8, 1.25, ['#ffc93c', '#14213d', '#0d1730']) + '</g>';

  // --- Tramvay ve yayalar ---
  g += '<g class="iso-tram">' + box(0, 3.22, 1.9, 3.78, 0.1, 0.95, ['#fdf6e3', '#d62f2f', '#b32020']) + faceL(0.15, 1.75, 3.78, 0.5, 0.82, '#cfe9f5') +
    faceR(1.9, 3.3, 3.7, 0.5, 0.82, '#a9d3e6') + '</g>';
  g += `<g class="iso-walk">${emoji(0, 4.4, 0, '🚶', 18)}</g><g class="iso-walk w2">${emoji(0, 4.7, 0, '🚶‍♀️', 18)}</g>`;

  // --- Nesneler (arkadan öne) ---
  const objs = [];
  const add = (depth, s) => objs.push({ depth, s });
  add(1.9 + 6.5, building(0.3, 5, 1.9, 6.5, 4, ['#f7d7bd', '#f0b48c', '#d6946b']));
  add(8.7 + 6.2, `<g data-go="bank" class="tap">${building(7.1, 4.8, 8.7, 6.2, 3, ['#cfe3ef', '#a9cbe0', '#86aec8'])}${box(7.25, 6.2, 8.55, 6.3, 0.95, 1.3, ['#1d2f57', '#14213d', '#0d1730'])}${text(7.36, 6.3, 1.02, 'BANKA', 8.5, '#ffc93c', 'L')}</g>`);
  add(2.9 + 5.0, tree(2.9, 5.0));
  add(6.4 + 5.2, tree(6.4, 5.2));
  add(3.1 + 8.4, tree(3.1, 8.4));
  add(8.3 + 7.6, tree(8.3, 7.6));

  // Büfe
  const bx0 = 3.7, by0 = 5.6, bx1 = 5.7, by1 = 6.9, bh = 1.25;
  const awD = S.up.tente ? 0.95 : 0.6, awZ = S.up.tente ? 0.46 : 0.32;
  let b = '';
  if (S.up.depo) b += box(bx0 - 0.75, by0 + 0.15, bx0 - 0.1, by0 + 0.95, 0, 0.5, ['#e9c07a', '#c99a50', '#a87c38']) + box(bx0 - 0.6, by0 + 0.25, bx0 - 0.2, by0 + 0.75, 0.5, 0.85, ['#f0cf8e', '#d4a85c', '#b28a44']);
  b += box(bx0, by0, bx1, by1, 0, bh, ['#fff6e5', '#ffe2b0', '#eec88a']);
  b += faceL(bx0 + 0.2, bx1 - 0.2, by1, 0.55, 1.05, '#3b2a1a');                                   // servis penceresi
  b += emoji(bx0 + 1.0, by1, 0.62, '🧑‍🍳', 13);
  b += box(bx0 + 0.15, by1, bx1 - 0.15, by1 + 0.16, 0.47, 0.55, ['#c98a55', '#a86b3c', '#7c4a25']);   // tezgâh
  b += faceR(bx1, by0 + 0.35, by0 + 0.85, 0, 0.95, '#7c4a25');                                    // kapı
  for (let i = 0; i < 8; i++) {                                                                   // tente
    const u0 = bx0 + (i * (bx1 - bx0)) / 8, u1 = bx0 + ((i + 1) * (bx1 - bx0)) / 8;
    b += poly([P(u0, by1, bh), P(u1, by1, bh), P(u1, by1 + awD, bh - awZ), P(u0, by1 + awD, bh - awZ)], i % 2 ? '#ffffff' : AWNS[S.style.awn].c);
  }
  const neon = !!S.up.tabela;
  b += `<g class="${neon ? 'neon' : ''}">` + box(bx0 + 0.25, by1 - 0.2, bx1 - 0.25, by1 - 0.05, bh, bh + 0.5, neon ? ['#ff8fb3', '#e5386b', '#b3204a'] : ['#1d2f57', '#14213d', '#0d1730']);   // tabela
  const sg = S.style.sign || 'BÜFE';
  b += text(bx0 + 0.42, by1 - 0.05, bh + 0.12, sg, sg.length > 6 ? 7.5 : sg.length > 4 ? 10 : 13, neon ? '#fff7c2' : '#ffc93c', 'L') + '</g>';
  const puff = (x, y, d) => { const [px, py] = P(x, y, bh + 0.2); return `<circle class="puff" style="animation-delay:${d}s" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="#fff" opacity=".8"/>`; };
  if (S.up.semaver || S.up.cezve) b += puff(bx0 + 0.5, by0 + 0.5, 0);
  if (S.up.fritoz) b += puff(bx0 + 1.1, by0 + 0.4, -0.7);
  if (S.up.grill2) b += puff(bx0 + 1.6, by0 + 0.6, -1.3);
  add(bx1 + by1, `<g data-go="bufe" class="tap">${b}</g>`);
  const sprite = (x, y, name, hgt, ratio) => { const [px, py] = P(x, y, 0); return `<image href="art/${name}.png" x="${(px - hgt * ratio / 2).toFixed(1)}" y="${(py - hgt).toFixed(1)}" width="${(hgt * ratio).toFixed(1)}" height="${hgt}"/>`; };
  add(6.2 + 6.9, sprite(6.2, 6.9, 'kedi', 24, 0.74));
  add(7.9 + 2.6, sprite(7.9, 2.6, 'marti', 22, 0.85));
  if (S.up.doner) add(bx1 + by1 + 0.3, sprite(bx1 + 0.35, by1 + 0.1, 'sis', 34, 0.54));
  if (S.up.mama) { const [mx, my] = P(6.55, 7.05, 0); add(6.55 + 7.05, `<ellipse cx="${mx}" cy="${my}" rx="6" ry="3.2" fill="#3b82c4"/><ellipse cx="${mx}" cy="${my - 1}" rx="4.4" ry="2" fill="#c98a55"/>`); }

  // Toptancı
  let t = box(0.5, 7.2, 2.3, 8.4, 0, 1.3, ['#dff0d8', '#9ccf9a', '#74b377']);
  t += faceL(0.7, 1.4, 8.4, 0, 0.85, '#2f5d3a') + faceL(1.55, 2.15, 8.4, 0.4, 0.85, '#d6f0ff');
  t += text(0.62, 8.4, 0.98, 'TOPTANCI', 8.5, '#1d4d2a', 'L');
  t += box(0.6, 8.5, 1.0, 8.85, 0, 0.3, ['#e9c07a', '#c99a50', '#a87c38']) + box(1.15, 8.5, 1.55, 8.85, 0, 0.3, ['#ffb347', '#e08a1e', '#b96d10']);
  add(2.3 + 8.85, `<g data-go="market" class="tap">${t}</g>`);

  // Boğa heykeli
  add(6.9 + 8.3, box(6.3, 7.7, 6.9, 8.3, 0, 0.45, ['#cfcfcf', '#a9a9a9', '#8c8c8c']) + emoji(6.6, 8.0, 0.5, '🐂', 22));

  objs.sort((a, c) => a.depth - c.depth);
  g += objs.map((o) => o.s).join('');

  // --- Etiketler ---
  const pin = (x, y, z, label, go, w) => {
    const [px, py] = P(x, y, z);
    return `<g data-go="${go}" class="tap" transform="translate(${px.toFixed(1)},${py.toFixed(1)})"><g class="pinbob">` +
      `<rect x="${-w / 2}" y="-25" width="${w}" height="22" rx="11" fill="#14213d"/><path d="M-6,-4 L6,-4 L0,4z" fill="#14213d"/>` +
      `<text y="-10" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">${label}</text></g></g>`;
  };
  g += pin(4.7, 6.25, 2.3, 'Dükkâna gir 🔑', 'bufe', 104) + pin(1.4, 7.8, 1.75, '🛒 Toptancı', 'market', 86) + pin(7.9, 5.5, 3.1, '🏦 Banka', 'bank', 74);

  return `<svg class="iso" viewBox="-272 -42 544 350" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
}

let entering = false;
function renderHub() {
  const ev = EVENTS[S.event];
  $('#uDay').textContent = `Gün ${S.day}`;
  $('#uEvent').textContent = `${season().icon} ${season().name} · ${LOCS[S.loc].name} · ${TIERS[S.tier || 0].name}`;
  $('#uCash').textContent = tl(S.cash);
  $('#hubScene').innerHTML = isoScene();
  $('#hubScene').classList.toggle('grey', S.event === 'yagmur' || S.event === 'kar');
  const hr = new Date().getHours();
  $('#hubScene').classList.toggle('night', prefs.real && (hr >= 19 || hr < 6));
  const news = [];
  if (S.notice) news.push(S.notice);
  if (S.rival) news.push(S.campaign ? '📣 Kampanyan sayesinde rakibin etkisi yok.' : `⚔️ Rakip büfe bugün ${RIVAL[S.rival].name} kampanya yapıyor. Toptancıdan karşı kampanya başlatabilirsin.`);
  const out = missingStock();
  if (out.length) news.push(`⚠️ Stokta hiç yok: ${out.join(', ')}. Önce toptancıya uğra.`);
  if (S.day >= 2 && S.coins <= 5) news.push(`🪙 Kasada ${S.coins} bozukluk kaldı; bitince para üstü veremezsin. Bankadan al.`);
  if (franchise()) news.push(`🧑‍💼 Şubelerin bugün yaklaşık ${tl(franchise())} getirecek.`);
  if (S.loan) news.push(`🏦 Banka borcun ${tl(S.loan.left)} · akşam taksiti ${tl(Math.min(S.loan.pay, S.loan.left))}.`);
  if (S.day === 2) news.push('💵 Bugünden itibaren hesabı sen alıyorsun: müşterinin verdiği paraya göre doğru para üstünü seç.');
  if (S.day >= 2 && !S.up.pos) news.push('💳 Kartla ödemek isteyenler var. POS cihazın yok; nakit veriyorlar ama bahşişleri yarım.');
  if (S.prepDone) news.push(`🔪 Açılış hazırlığı: ${'★'.repeat(S.prep)}${'☆'.repeat(3 - S.prep)} · pişirme %${S.prep * 10} hızlı.`);
  if (S.night) news.push('🌙 Bu gece vardiyası var: 02:00’ye kadar açıksın.');
  $('#uGoals').innerHTML = `<b>Bugün: ${ev.icon} ${ev.name}</b><p class="muted small">${ev.desc}</p>` + news.map((n) => `<p class="news">${n}</p>`).join('') +
    S.goals.map((g) => `<div class="goal"><span>🎯 ${goalText(g)}</span><em>+${tl(g.reward)}</em></div>`).join('');
  // Komşular: günde bir kez tost gönder (1 ekmek + 1 kaşar), karşılığında takas gelir
  const nbBox = $('#uNb'); nbBox.innerHTML = '<b>Komşu esnaf</b>';
  Object.entries(NB).forEach(([id, n]) => {
    const hearts = nbH(id), done = S.nbDay[id] === S.day;
    const r = h('div', 'nbrow', `<span class="nbe">${n.emoji}</span><span class="nbt"><b>${n.name}</b> <i>${'♥'.repeat(hearts)}${'♡'.repeat(5 - hearts)}</i><small>${n.perk}</small></span>`);
    const b = h('button', 'buy' + (done ? ' on' : ''), done ? 'Gönderildi ✓' : 'Tost gönder');
    b.disabled = done || S.stock.ekmek < 1 || S.stock.kasar < 1;
    b.onclick = () => {
      S.stock.ekmek--; S.stock.kasar--;
      S.nb[id] = Math.min(5, hearts + 1); S.nbDay[id] = S.day;
      S.notice = `${n.emoji} ${n.name} tostu çok sevdi; ${n.gift()}.`;
      sfx.tip(); store(SAVE_KEY, S); renderHub();
    };
    r.append(b); nbBox.append(r);
  });
  $('#uHelp').hidden = S.day !== 1;
  $('#btnPrep').hidden = !!S.prepDone;
  $('#uRent').textContent = `Akşam ödenecek: kira ${tl(rent(S.day))}${wages() ? ` + yevmiye ${tl(wages())}` : ''} · İtibar ★ ${S.rep.toFixed(1)}`;
  show('hub');
  setWeatherFx($('#hubScene'), wxMode());
}

const missingStock = () => Object.keys(STOCK).filter((id) => stockOpen(id) && S.stock[id] <= 0).map((id) => STOCK[id].name);

// Eksik malzemeyle açmadan önce sor
function tryEnter() {
  const out = missingStock();
  if (!out.length) return enterShop();
  $('#warnText').textContent = `Stokta hiç yok: ${out.join(', ')}. Bunları isteyen müşteri eli boş döner.`;
  $('#warn').hidden = false;
}

// Açılış hazırlığı: her gün farklı bir mini oyun; yıldız sayısı o gün pişirmeyi hızlandırır
const MINI = [
  { id: 'slice', name: 'Kaşar Dilimleme', hint: 'Tahtaya hızlı hızlı dokun: 6 saniyede kaç dilim? İlk dokunuşla süre başlar.', unit: 'dilim', stars: [10, 20, 30] },
  { id: 'simit', name: 'Simit Çevirme', hint: 'İbre yeşil bölgedeyken dokun: simidi tam zamanında çevir. 8 simit var.', unit: 'isabet', stars: [3, 5, 7] },
  { id: 'doner', name: 'Döner Bileme', hint: 'Bıçağı bile: bir sol, bir sağ, sırayla. 6 saniyen var; aynı tarafa iki kez basarsan sayılmaz.', unit: 'bileme', stars: [9, 17, 26] },
];
let prepRun = null;
function openPrep() {
  const g = MINI[S.day % 3];
  clearInterval(prepRun && prepRun.iv);
  prepRun = { g, n: 0, t: 6, on: false, tries: 0, pos: 0, dir: 1, zone: 0.4, last: '', iv: 0, done: false };
  $('#prepTitle').textContent = '🔪 ' + g.name;
  $('#prepCount').textContent = '0'; $('#prepUnit').textContent = g.unit;
  $('#prepBar').style.width = '100%';
  $('#prepMsg').textContent = g.hint;
  $('#prepTap').hidden = g.id === 'doner'; $('#mgLR').hidden = g.id !== 'doner'; $('#mgBar').hidden = g.id !== 'simit';
  $('#btnPrepDone').hidden = true;
  $('#prep').hidden = false;
  if (g.id === 'simit') {                              // ibre sürekli gidip gelir
    const R = prepRun;
    $('#mgZone').style.left = R.zone * 100 + '%';
    R.iv = setInterval(() => {
      R.pos += R.dir * 0.03; if (R.pos >= 1 || R.pos <= 0) R.dir *= -1;
      $('#mgMark').style.left = clamp(R.pos, 0, 1) * 100 + '%';
    }, 20);
  }
}
function prepFinish() {
  const R = prepRun, [a, b, c] = R.g.stars;
  clearInterval(R.iv); R.done = true;
  S.prep = R.n >= c ? 3 : R.n >= b ? 2 : R.n >= a ? 1 : 0;
  S.prepDone = true;
  $('#prepMsg').textContent = `${R.n} ${R.g.unit} · ${'★'.repeat(S.prep)}${'☆'.repeat(3 - S.prep)} · bugün pişirme %${S.prep * 10} daha hızlı.`;
  $('#prepTap').hidden = true; $('#mgLR').hidden = true; $('#mgBar').hidden = true; $('#btnPrepDone').hidden = false;
  store(SAVE_KEY, S); sfx.tip();
}
function prepTap(side) {
  const R = prepRun;
  if (!R || R.done) return;
  if (R.g.id === 'simit') {
    const hit = R.pos >= R.zone && R.pos <= R.zone + 0.22;
    if (hit) { R.n++; sfx.ready(); } else sfx.err();
    $('#prepCount').textContent = R.n;
    R.zone = 0.05 + Math.random() * 0.7; $('#mgZone').style.left = R.zone * 100 + '%';
    $('#prepBar').style.width = (1 - ++R.tries / 8) * 100 + '%';
    return R.tries >= 8 ? prepFinish() : undefined;
  }
  if (!R.on) {
    R.on = true;
    R.iv = setInterval(() => {
      R.t -= 0.1;
      $('#prepBar').style.width = Math.max(0, R.t / 6 * 100) + '%';
      if (R.t <= 0) prepFinish();
    }, 100);
  }
  if (R.g.id === 'doner') { if (side === R.last) return sfx.err(); R.last = side; }
  R.n++;
  $('#prepCount').textContent = R.n;
  beep(500 + (R.n % 5) * 60, 0.03, 'square', 0.04); buzz(5);
}

// Seçilen tente rengi ve süsler dükkânın içinde de görünür
function applyStyle() {
  const st = S.style, a = AWNS[st.awn] || AWNS[0], d = DECOS[st.deco] || DECOS[0];
  $('#awnLayer').style.filter = `hue-rotate(${a.hue}deg) saturate(1.3)`;
  $('#deco').className = 'deco ' + d[1];
  $('#deco').textContent = d[2];
}

function openBank() {
  const room = loanRoom(), L = S.loan;
  $('#bankInfo').innerHTML =
    `<p>Kredi limitin <b>${tl(loanLimit())}</b> (itibarın arttıkça yükselir). Faiz %${LOAN_RATE * 100}; borç ${LOAN_DAYS} günde, her akşam taksitle ödenir.</p>` +
    (L ? `<p>Borcun <b>${tl(L.left)}</b> · günlük taksit <b>${tl(Math.min(L.pay, L.left))}</b></p>` : '<p>Şu an borcun yok.</p>') +
    `<p>Birikimin <b>${tl(S.savings)}</b> (günde %1 faiz) · Kasadaki bozukluk <b>🪙 ${S.coins}</b></p>` +
    `<p class="muted small">Kasa: ${tl(S.cash)} · Çekebileceğin kredi: ${tl(room)}</p>`;
  const box = $('#bankBtns'); box.innerHTML = '';
  [1000, 2500, 5000].forEach((a) => {
    const b = h('button', 'btn', `${tl(a)} çek <small>geri ödeme ${tl(a * (1 + LOAN_RATE))}</small>`);
    b.disabled = a > room;
    b.onclick = () => { takeLoan(a); store(SAVE_KEY, S); renderHub(); openBank(); };
    box.append(b);
  });
  if (L) {
    const b = h('button', 'btn', `Borcu kapat (${tl(L.left)})`);
    b.disabled = S.cash < L.left;
    b.onclick = () => { S.cash -= L.left; S.loan = null; sfx.coin(); store(SAVE_KEY, S); renderHub(); openBank(); };
    box.append(b);
  }
  const act = (label, disabled, fn) => { const b = h('button', 'btn', label); b.disabled = disabled; b.onclick = () => { fn(); sfx.coin(); store(SAVE_KEY, S); renderHub(); openBank(); }; box.append(b); };
  act('🪙 Bozukluk al <small>kasayı 20 para üstüne tamamla, ücretsiz</small>', S.coins >= 20, () => { S.coins = 20; });
  act(`${tl(1000)} biriktir <small>günde %1 faiz</small>`, S.cash < 1000, () => { S.cash -= 1000; S.savings += 1000; });
  if (S.savings > 0) act(`Birikimi çek (${tl(S.savings)})`, false, () => { S.cash += S.savings; S.savings = 0; });
  $('#bank').hidden = false;
}

function enterShop() {
  entering = true;
  $('#hubScene svg').classList.add('enter');
  beep(520, 0.1, 'triangle', 0.07); beep(780, 0.15, 'triangle', 0.07, 0.1);
  setTimeout(() => { entering = false; startDay(); }, 650);
}

// =========================================================
// SABAH: TOPTANCI
// =========================================================
// Gerçek hava (isteğe bağlı): Kadıköy'ün o anki havası yağmur, kar ya da fırtınaysa gün ona döner.
// Yalnızca sabit Kadıköy koordinatı gönderilir; saatte bir kez sorulur.
let wxCache = null;
async function realWeather() {
  const hourKey = new Date().toISOString().slice(0, 13);
  if (wxCache && wxCache.key === hourKey) return wxCache.ev;
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.99&longitude=29.03&current=weather_code,wind_speed_10m', { signal: ctl.signal });
    const cur = (await r.json()).current, code = cur.weather_code;
    const ev = (code >= 71 && code <= 77) || code === 85 || code === 86 ? 'kar'
      : (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95 ? 'yagmur'
      : cur.wind_speed_10m >= 40 ? 'lodos' : 'normal';
    wxCache = { key: hourKey, ev };
    return ev;
  } catch (e) { return null; } finally { clearTimeout(tm); }
}

function startMorning() {
  S.spent = { goods: 0, invest: 0 };
  morningBase = { ...S.stock };
  if (!S.goals || S.goalsDay !== S.day) { S.goals = pickGoals(); S.goalsDay = S.day; }
  store(SAVE_KEY, S);
  renderHub();
  const dayAsked = S.day;
  if (prefs.real && ['normal', 'yagmur', 'lodos', 'kar'].includes(S.event)) realWeather().then((ev) => {
    if (!ev || ev === S.event || S.day !== dayAsked || !$('#hub').classList.contains('active')) return;
    S.event = ev; S.notice = `🌦️ Kadıköy'de şu an hava: ${EVENTS[ev].name}.`;
    store(SAVE_KEY, S); renderHub();
  });
}

function renderMorning() {
  $('#mDay').textContent = `Gün ${S.day}`;
  $('#mCash').textContent = tl(S.cash);
  $('#mMenu').innerHTML = '<b>Menü</b><div class="chips">' +
    menu().map((id) => `<span>${dPic(id)} ${DISHES[id].name} <b>${tl(price(id))}</b>${skillLvl(id) ? ` <i class="lvl">★${skillLvl(id)}</i>` : ''}</span>`).join('') + '</div>';

  // Tarif defteri: şarküteri anlaşması varsa kendi tostunu tasarla
  const rc = $('#mRecipe');
  $('#hRecipe').hidden = rc.hidden = !S.up.sucuk;
  if (S.up.sucuk) {
    const sel = renderMorning.sel || (renderMorning.sel = new Set(S.custom ? S.custom.fill : ['salam']));
    rc.innerHTML = (S.custom ? `<b>Menüde: ${S.custom.name}</b> <span class="muted small">(${S.custom.fill.map((x) => STOCK[x].short).join(' + ')})</span>` : '<b>Kendi tostunu tasarla</b>') +
      '<p class="muted small">İç malzemeyi seç, isim ver. Menüdeki tostlardan farklı bir karışım olmalı.</p><div class="seg" id="rFill"></div>' +
      `<input id="rName" maxlength="14" placeholder="Tostun adı" value="${S.custom ? S.custom.name : ''}"><div class="rbtns"><button class="btn primary" id="rSave">Menüye koy</button>${S.custom ? '<button class="btn ghost" id="rDel">Kaldır</button>' : ''}</div>`;
    FILLINGS.forEach((x) => {
      const b = h('button', sel.has(x) ? 'on' : '', STOCK[x].short);
      b.onclick = () => { sel.has(x) ? sel.delete(x) : sel.add(x); renderMorning(); };
      $('#rFill').append(b);
    });
    $('#rSave').onclick = () => {
      const fill = FILLINGS.filter((x) => sel.has(x));
      const name = $('#rName').value.replace(/[<>&"`]/g, '').trim();
      const clash = Object.entries(DISHES).some(([id, d]) => id !== 'ozel' && d.recipe && d.recipe[0] === 'ekmek' && d.recipe.length === fill.length + 1 && fill.every((x) => d.recipe.includes(x)));
      if (!fill.length || !name) return toastM('İsim ve en az bir malzeme gerekli');
      if (clash) return toastM('Bu karışım zaten menüde var');
      S.custom = { name, fill }; applyCustom(); sfx.coin(); renderMorning();
    };
    if (S.custom) $('#rDel').onclick = () => { S.custom = null; applyCustom(); renderMorning(); };
  }

  // Büfeni süsle
  const stl = $('#mStyle'), st = S.style;
  stl.innerHTML = '<b>Tente rengi</b><div class="swatches" id="sAwn"></div><b>Tabela yazısı</b><input id="sSign" maxlength="8" value="' + st.sign + '"><b>Tezgâh süsü</b><div class="seg four" id="sDeco"></div><b>Kedinin adı</b><input id="sCat" maxlength="10" value="' + st.cat + '">';
  AWNS.forEach((a, i) => { const b = h('button', 'sw' + (st.awn === i ? ' on' : '')); b.style.background = `repeating-linear-gradient(90deg, ${a.c} 0 9px, #fff 9px 18px)`; b.title = a.name; b.onclick = () => { st.awn = i; renderMorning(); }; $('#sAwn').append(b); });
  DECOS.forEach((d, i) => { const b = h('button', st.deco === i ? 'on' : '', d[0]); b.onclick = () => { st.deco = i; renderMorning(); }; $('#sDeco').append(b); });
  const clean = (v, fb) => v.replace(/[<>&"`]/g, '').trim() || fb;
  $('#sSign').onchange = (e) => { st.sign = clean(e.target.value, 'BÜFE').toLocaleUpperCase('tr-TR'); renderMorning(); };
  $('#sCat').onchange = (e) => { st.cat = clean(e.target.value, 'Tekir'); renderMorning(); };

  const pol = $('#mPolicy'); pol.innerHTML = '';
  POLICY.forEach((p, i) => {
    const b = h('button', i === S.policy ? 'on' : '', p.name);
    b.onclick = () => { S.policy = i; renderMorning(); };
    pol.append(b);
  });
  $('#mPolicyDesc').textContent = POLICY[S.policy].desc;

  const mk = $('#mMarket'); mk.innerHTML = '';
  Object.keys(STOCK).filter(stockOpen).forEach((id) => {
    const it = STOCK[id];
    const row = h('div', 'row');
    const meta = it.ready ? `Alış ${tl(costOf(id))} · Satış <b>${tl(price(id))}</b>${it.spoils ? ' · bayatlar' : ''}` : `Alış ${tl(costOf(id))} · ${it.note}`;
    row.append(h('div', 'emo', sPic(id)), h('div', '', `<div class="nm">${it.name}</div><div class="meta">${meta}</div>`));
    const q = h('div', 'qty');
    const minus = h('button', '', '−');
    minus.disabled = S.stock[id] <= (morningBase[id] || 0);
    minus.onclick = () => buy(id, -1);
    const n = h('div', 'n', `${S.stock[id]}/${capOf(id)}`);
    const p1 = h('button', 'plus', '+1'); p1.onclick = () => buy(id, 1);
    const p5 = h('button', 'plus', '+5'); p5.onclick = () => buy(id, 5);
    p1.disabled = p5.disabled = S.stock[id] >= capOf(id) || S.cash < costOf(id);
    q.append(minus, n, p1, p5);
    row.append(q);
    mk.append(row);
  });

  const stf = $('#mStaff'); stf.innerHTML = '';
  Object.entries(CREW).forEach(([id, w]) => {
    const on = !!S.crew[id];
    const r = h('div', 'row');
    r.append(h('div', 'emo', w.emoji), h('div', '', `<div class="nm">${w.name}</div><div class="meta">${w.desc} Yevmiye ${tl(w.wage)}.</div>`));
    const b = h('button', 'buy' + (on ? ' on' : ''), on ? 'Çalışıyor ✓' : 'İşe al');
    b.onclick = () => { S.crew[id] = !on; beep(on ? 400 : 600, 0.05); renderMorning(); };
    r.append(b); stf.append(r);
  });
  // Gece vardiyası ve kampanya
  const extra = (emo, name, desc, label, on, disabled, fn) => {
    const r = h('div', 'row');
    r.append(h('div', 'emo', emo), h('div', '', `<div class="nm">${name}</div><div class="meta">${desc}</div>`));
    const b = h('button', 'buy' + (on ? ' on' : ''), label);
    b.disabled = disabled; b.onclick = fn;
    r.append(b); stf.append(r);
  };
  if (S.day >= 3) extra('🌙', 'Gece Vardiyası', `22:00–02:00 arası da açık kal. Gececiler sabırsız ama bahşişi bol. Elektrik ${tl(NIGHT_COST)}.`, S.night ? 'Açık ✓' : 'Aç', S.night, false, () => { S.night = !S.night; beep(S.night ? 600 : 400, 0.05); renderMorning(); });
  if (S.day >= 4) extra('📣', 'Kampanya', 'El ilanı dağıt: bugün müşteri %25 artar, rakibin kampanyası boşa gider.', S.campaign ? 'Başladı ✓' : tl(CAMPAIGN_COST), S.campaign, S.campaign || S.cash < CAMPAIGN_COST, () => { S.cash -= CAMPAIGN_COST; S.spent.invest += CAMPAIGN_COST; S.campaign = true; sfx.coin(); renderMorning(); });

  // Konumlar
  const lc = $('#mLocs'); lc.innerHTML = '';
  Object.entries(LOCS).forEach(([id, L]) => {
    const owned = !!S.locs[id], here = S.loc === id;
    const r = h('div', 'row');
    r.append(h('div', 'emo', '📍'), h('div', '', `<div class="nm">${L.name}</div><div class="meta">${L.desc}${L.rent ? ` Kira +${tl(L.rent)}.` : ''}</div>`));
    const b = h('button', 'buy' + (here ? ' on' : ''), here ? 'Buradasın ✓' : owned ? 'Taşın' : tl(L.cost));
    b.disabled = here || (!owned && S.cash < L.cost);
    b.onclick = () => {
      if (!owned) { S.cash -= L.cost; S.spent.invest += L.cost; S.locs[id] = true; sfx.coin(); }
      S.loc = id; renderMorning();
    };
    r.append(b); lc.append(r);
  });

  // Şubelere müdür: orada değilken pasif gelir
  Object.entries(LOCS).forEach(([id, L]) => {
    if (!S.locs[id] || Object.keys(S.locs).length < 2) return;
    const on = !!S.mgr[id], inc = round5((150 + S.rep * 90) * L.spawn);
    const r = h('div', 'row');
    r.append(h('div', 'emo', '🧑‍💼'), h('div', '', `<div class="nm">${L.name} müdürü</div><div class="meta">Sen başka konumdayken şubeyi çevirir: günde yaklaşık ${tl(inc)} net gelir.</div>`));
    const b = h('button', 'buy' + (on ? ' on' : ''), on ? 'Atandı ✓' : tl(2000));
    b.disabled = on || S.cash < 2000;
    b.onclick = () => { S.cash -= 2000; S.spent.invest += 2000; S.mgr[id] = true; sfx.coin(); renderMorning(); };
    r.append(b); lc.append(r);
  });

  const up = $('#mUpgrades'); up.innerHTML = '';
  const nt = TIERS[S.tier + 1];
  if (nt) {                                           // dükkânı büyüt
    const r = h('div', 'row');
    r.append(h('div', 'emo', '🏗️'), h('div', '', `<div class="nm">Büyüt: ${nt.name}</div><div class="meta">${nt.desc}</div>`));
    const b = h('button', 'buy', tl(nt.cost));
    b.disabled = S.cash < nt.cost;
    b.onclick = () => { S.cash -= nt.cost; S.spent.invest += nt.cost; S.tier++; sfx.tip(); renderMorning(); };
    r.append(b); up.append(r);
  }
  Object.entries(UPGRADES).forEach(([id, u]) => {
    const owned = !!S.up[id];
    const row = h('div', 'row' + (owned ? ' owned' : ''));
    row.append(h('div', 'emo', u.emoji), h('div', '', `<div class="nm">${u.name}</div><div class="meta">${u.desc}</div>`));
    const b = h('button', 'buy', owned ? 'Alındı ✓' : tl(u.cost));
    b.disabled = owned || S.cash < u.cost;
    b.onclick = () => {
      S.cash -= u.cost; S.spent.invest += u.cost; S.up[id] = true;
      sfx.coin(); renderMorning();
    };
    row.append(b);
    up.append(row);
  });
}

function toastM(msg) { const m = $('#mMsg'); m.textContent = msg; m.hidden = false; clearTimeout(toastM.t); toastM.t = setTimeout(() => { m.hidden = true; }, 1800); sfx.err(); }

function buy(id, n) {
  const it = STOCK[id];
  if (n > 0) {
    n = Math.min(n, capOf(id) - S.stock[id], Math.floor(S.cash / costOf(id)));
    if (n <= 0) return;
  } else {
    n = -Math.min(-n, S.stock[id] - (morningBase[id] || 0));
    if (n === 0) return;
  }
  S.stock[id] += n;
  S.cash -= n * costOf(id);
  S.spent.goods += n * costOf(id);
  beep(n > 0 ? 600 : 400, 0.04);
  renderMorning();
}

// =========================================================
// GÜN: BÜFENİN İÇİ
// =========================================================
let running = false, paused = false, lastT = 0, toastTimer = 0, bannerTimer = 0;

function startDay() {
  store(SAVE_KEY, S);
  const ev = EVENTS[S.event];
  D = {
    t: 0, spawnT: 1.5, rushUntil: 0, nextId: 1,
    customers: [], slots: [], board: [],
    fryer: S.up.fritoz ? { state: 'empty', t: 0 } : null,
    doner: S.up.doner ? { v: 0, ready: false } : null,
    pour: { v: 0, on: false, id: null }, sq: { v: 0, ready: false }, dem: DEM, demT: 0,
    ferries: ev.noFerry ? [] : (LOCS[S.loc].ferries || [18, 52, 86]).slice(),
    regs: REGULARS.slice().sort(() => Math.random() - 0.5).slice(0, S.day > 5 ? 3 : 2).map((r, i) => ({ r, at: 14 + i * 32 + Math.random() * 14 })),
    inspAt: S.day >= 3 && Math.random() < 0.3 ? 30 + Math.random() * 50 : 0, inspDue: 0,
    cats: (S.up.mama ? [12, 48, 82] : [15 + Math.random() * 65]).map((t) => t + Math.random() * 10), catUntil: 0,
    gulls: S.event === 'yagmur' ? [] : [22 + Math.random() * 25, 66 + Math.random() * 30].slice(0, Math.random() < 0.5 ? 1 : 2), gullUntil: 0,
    blackAt: S.day >= 2 && Math.random() < 0.35 ? 25 + Math.random() * 55 : 0, blackUntil: 0,
    combo: 0, target: null, gT: 3, aT: 2, plate: null, dirt: 0,
    couriers: S.day >= 3 ? [34 + Math.random() * 16, 74 + Math.random() * 16] : [],
    schoolAt: S.day % 7 !== 6 && S.day % 7 !== 0 && S.event !== 'kar' ? 62 : 0, schoolUntil: 0,
    visitAt: Math.random() < 0.6 ? 18 + Math.random() * 65 : 0, visit: null, flower: false,
    breakAt: S.day >= 4 && Math.random() < 0.22 ? 25 + Math.random() * 50 : 0,
    repStart: S.rep,
    st: { rev: 0, tips: 0, served: 0, lost: 0, sent: 0, burnt: 0, tost: 0, perfect: 0, bestCombo: 0, stolen: 0, fines: 0, regUp: [], regDown: [], cats: 0, payBad: 0, card: 0, cardN: 0, meal: 0, qrN: 0, fake: 0, fisless: 0, runaway: 0, refund: 0, packs: 0 },
    pos: null,
  };
  for (let i = 0; i < (S.up.grill2 ? 4 : 2); i++) D.slots.push({ dish: null, t: 0, w: 0, state: 'empty' });

  $('#customers').innerHTML = '';
  $('#cat').hidden = true;
  $('#gull').hidden = true;
  $('#pos').hidden = true;
  $('#visitor').hidden = true;
  $('#stations').classList.remove('blackout');
  $('#scene').classList.toggle('rainy', S.event === 'yagmur');
  $('#hDay').textContent = `Gün ${S.day} · ${ev.icon}${Object.keys(CREW).filter((k) => S.crew[k]).map((k) => ' ' + CREW[k].emoji).join('')}`;
  D.coach = S.day === 1 && !S.tut; D.coachT = null;
  $('#coach').hidden = true;
  buildKitchen();
  paintDirt();
  paintCombo();
  updateHud();
  show('day');
  setWeatherFx($('#scene'), wxMode());
  applyStyle();
  banner(`${ev.icon} ${ev.name}`);
  running = true; paused = false; $('#pause').hidden = true;
  lastT = performance.now();
  requestAnimationFrame(loop);
}

// ---------- Mutfak arayüzü ----------
function buildKitchen() {
  const row = $('#stations'); row.innerHTML = '';
  D.slots.forEach((s, i) => {
    s.el = h('button', 'slot');
    s.el.onclick = () => tapSlot(i);
    s.el.dataset.drop = 'slot'; s.el.dataset.i = i;
    makeDraggable(s.el, () => (['ready', 'over', 'burnt'].includes(s.state) ? { kind: 'slot', i, dish: s.state === 'burnt' ? null : s.dish, html: `<span class="food">${dPic(s.dish)}</span>`, b: s.state === 'burnt' ? 1.7 : s.el.style.getPropertyValue('--b') } : null));
    row.append(s.el);
    paintSlot(s);
  });
  if (D.fryer) {
    D.fryer.el = h('button', 'slot');
    D.fryer.el.onclick = tapFryer;
    D.fryer.el.dataset.drop = 'fryer';
    makeDraggable(D.fryer.el, () => (D.fryer.state === 'ready' || D.fryer.state === 'burnt' ? { kind: 'fryer', html: pic('kizarmis') } : null));
    row.append(D.fryer.el);
    paintFryer();
  }
  if (D.doner) {
    D.doner.el = h('button', 'slot');
    D.doner.el.onclick = tapDoner;
    makeDraggable(D.doner.el, () => (D.doner.ready ? { kind: 'doner', html: pic('i_doner') } : null));
    row.append(D.doner.el);
    paintDoner();
  }

  const ings = $('#ings'); ings.innerHTML = '';
  D.ingEls = {};
  INGREDIENTS.filter(stockOpen).forEach((id) => {
    const b = h('button', 'ing', `<span class="pe">${sPic(id)}</span>${STOCK[id].short}<span class="st"></span>`);
    b.onclick = () => tapIng(id);
    makeDraggable(b, () => (S.stock[id] > 0 ? { kind: 'ing', id, html: sPic(id) } : null));
    D.ingEls[id] = b;
    ings.append(b);
  });

  const shelf = $('#shelf'); shelf.innerHTML = '';
  D.prodEls = {};
  menu().filter((id) => DISHES[id].kind !== 'board').forEach((id) => {
    const d = DISHES[id];
    const hint = d.kind === 'pour' ? 'basılı tut' : d.kind === 'squeeze' ? 'dokun, sık' : tl(price(id));
    const b = h('button', 'prod ' + d.kind, `<i class="gauge"></i><span class="pe">${dPic(id)}</span><span class="pn">${d.short || d.name}</span><span class="pp">${hint}</span><span class="st"></span>`);
    if (d.kind === 'pour') {
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); pourStart(id); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((n) => b.addEventListener(n, pourEnd));
      b.oncontextmenu = (e) => e.preventDefault();
    } else if (d.kind === 'squeeze') {
      b.onclick = tapSqueeze;
      makeDraggable(b, () => (D.sq.ready ? { kind: 'prod', id, dish: id, html: dPic(id) } : null));
    } else {
      b.onclick = () => tapProduct(id);
      makeDraggable(b, () => (S.stock[id] > 0 ? { kind: 'prod', id, dish: id, html: dPic(id) } : null));
    }
    D.prodEls[id] = b;
    shelf.append(b);
  });
  const sauces = menu().some((id) => SAUCED.includes(id));
  $('#sauceK').hidden = $('#sauceM').hidden = !sauces;
  shelf.classList.toggle('dense', shelf.children.length > 6);   // çok ürün varsa sıkı diz
  paintStock();
  paintBoard();
  paintGauges();
}

// Tezgâhtaki görüntü: tarif tamamsa yemeğin kendisi (pişecekse çiğ hâli), değilse üst üste malzemeler
function stackHTML(ids, dish) {
  if (dish) return `<span class="food${DISHES[dish].cook ? ' raw' : ''}">${dPic(dish)}</span>`;
  return `<span class="pile">${ids.map(onBoardPic).join('')}</span>`;
}

const SLOT_LABEL = { cook1: 'Pişiyor', cook2: 'Pişiyor', ready: 'KIVAMINDA', over: 'Fazla kızardı', burnt: 'Yandı · at' };
function paintSlot(s) {
  s.el.className = 'slot ' + s.state;
  if (s.state === 'broken') { s.el.innerHTML = `<span class="se" style="font-size:24px">🔧</span>Arıza · onar ${s.fix}/6`; s.bar = null; return; }
  if (s.state === 'empty') s.el.innerHTML = '<span class="se" style="opacity:.35">♨️</span>Izgara';
  else {
    const d = DISHES[s.dish];
    s.el.innerHTML = `<span class="food">${dPic(s.dish)}</span><span class="sl">${s.state === 'press' ? d.cook.label + '!' : SLOT_LABEL[s.state]}</span><i class="bar"></i>`;
  }
  s.bar = s.el.querySelector('.bar');
}
function paintFryer() {
  const f = D.fryer;
  f.el.className = 'slot ' + f.state;
  const label = { empty: 'Fritöz', fry: 'Kızarıyor', ready: 'HAZIR · al', burnt: 'Yandı · at' }[f.state];
  f.el.innerHTML = `<span class="se"${f.state === 'empty' ? ' style="opacity:.4"' : ''}>${pic('kizarmis')}</span>${label}<i class="bar"></i>`;
  f.bar = f.el.querySelector('.bar');
}
function paintDoner() {
  const q = D.doner;
  q.el.className = 'slot ' + (q.ready ? 'ready' : q.v > 0 ? 'cook1' : 'doner');
  q.el.innerHTML = `<span class="se">${pic(q.ready ? 'i_doner' : 'sis')}</span>${q.ready ? 'HAZIR · al' : `Kes · ${S.stock.doner}`}<i class="bar" style="width:${q.ready ? 0 : q.v * 100}%"></i>`;
}

function paintStock() {
  for (const id in D.prodEls) {
    const n = id === 'portakal' ? Math.floor(S.stock.portakal / 2) : S.stock[id];
    D.prodEls[id].querySelector('.st').textContent = n;
    D.prodEls[id].classList.toggle('out', n <= 0);
  }
  for (const id in D.ingEls) {
    D.ingEls[id].querySelector('.st').textContent = S.stock[id];
    D.ingEls[id].classList.toggle('out', S.stock[id] <= 0);
  }
}

// Tezgâhtaki malzemeler hangi tarife denk geliyor?
function boardDish() {
  const b = D.board;
  return menu().find((id) => {
    const r = DISHES[id].recipe;
    return r && r.length === b.length && r.every((x) => b.includes(x));
  }) || null;
}
const sauceMarks = (z) => (z === undefined ? '' : `<span class="sau">${z ? [...z].map((x) => `<i class="dot ${x}"></i>`).join('') : 'sade'}</span>`);
function plateHTML(p) {
  const img = p.cut ? dPic(p.dish).replace('class="spr ', 'class="spr h1 ') + dPic(p.dish).replace('class="spr ', 'class="spr h2 ') : dPic(p.dish);
  return `<span class="food cooked${p.cut ? ' cutv' : ''}" style="--b:${p.q === 'flaw' ? 0.85 : 0.5}">${img}</span>`;
}
// Tezgâh kirlenir: 8'i geçince bahşiş düşer ve zabıta ceza keser; süngerle silinir
function addDirt(n) { D.dirt += n; paintDirt(); }
function paintDirt() {
  const lvl = D.dirt >= 8 ? 2 : D.dirt >= 4 ? 1 : 0;
  $('#sponge').dataset.lvl = lvl;
  $('.boardwrap').classList.toggle('dirty', lvl === 2);
}
function cleanUp() {
  if (!live()) return;
  if (D.dirt <= 0) return toast('Tezgâh zaten temiz ✨');
  D.dirt = 0; paintDirt();
  toast('Tezgâh silindi ✨'); beep(1200, 0.1, 'sine', 0.05); buzz(10);
}
function toPlate(dish, q) {
  addDirt(1);
  D.plate = { dish, q, cut: false, sauce: '', t: 0 };
  D.board = [];
  paintBoard();
}
// Pişmeyen tarifler (patso, döner) tamamlanınca doğrudan tabağa geçer
function settle() {
  const id = boardDish();
  if (id && !DISHES[id].cook) toPlate(id, 'ok');
}

function paintBoard() {
  const el = $('#board'), b = D.board, id = boardDish();
  if (D.plate) {
    const p = D.plate, d = DISHES[p.dish];
    const todo = needsCut(p.dish) && !p.cut;
    const hint = p.t >= COLD ? 'soğudu 🥶' : todo ? 'dokun: ikiye kes 🔪' : SAUCED.includes(p.dish) ? `sos: ${SAUCE_NAME[p.sauce]}` : p.t >= 9 ? 'soğuyor…' : 'müşteriye sürükle';
    el.className = 'board plated' + (todo ? ' todo' : ' done') + (p.t >= COLD ? ' cold' : '');
    el.innerHTML = `${plateHTML(p)}<span class="blabel">${d.name}<small>${hint}</small></span>`;
    return;
  }
  if (!b.length) {
    el.className = 'board';
    el.innerHTML = '<span class="bhint">Tezgâh<small>malzemeyi buraya sürükle</small></span>';
    return;
  }
  el.className = 'board' + (id ? ' done' : '');
  el.innerHTML = `${stackHTML(b, id)}<span class="blabel">${id ? `${DISHES[id].name}<small>${DISHES[id].cook ? 'ızgaraya sürükle' : 'müşteriye sürükle'}</small>` : '<small>malzeme ekle…</small>'}</span>`;
}

function updateHud() {
  $('#hCash').textContent = tl(S.cash);
  $('#hRep').textContent = '★ ' + S.rep.toFixed(1);
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1200);
}
function banner(msg) {
  const b = $('#banner');
  b.textContent = msg; b.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => b.classList.remove('show'), 2200);
}
function floatText(text, slotIdx, cls = '') {
  const f = h('div', 'float ' + cls, text);
  f.style.left = slotX(slotIdx) + '%';
  f.style.bottom = '55%';
  $('#scene').append(f);
  setTimeout(() => f.remove(), 900);
}
function nope(el, msg) {
  toast(msg); sfx.err();
  if (!el) return;
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
}
function addRep(d) { S.rep = clamp(S.rep + d, 0, 5); updateHud(); }

// Seri: üst üste memnun müşteri → bahşiş çarpanı
const comboMult = () => 1 + Math.min(D.combo, 10) * 0.05;
function setCombo(n) {
  D.combo = n;
  D.st.bestCombo = Math.max(D.st.bestCombo, n);
  paintCombo();
}
function paintCombo() {
  const c = $('#combo');
  c.hidden = D.combo < 2;
  c.textContent = `🔥 Seri ${D.combo} · bahşiş x${comboMult().toFixed(1)}`;
}
function setTarget(c) {
  if (D.target) D.target.el.classList.remove('ask');
  D.target = c;
  if (c) c.el.classList.add('ask');
}

// ---------- Müşteri ----------
function pickType() {
  if (D.t < D.schoolUntil) return TYPES[0];          // okul çıkışı: öğrenci akını
  const pool = TYPES.filter((t) => !t.only || t.only === S.event);
  const wt = (t) => t.wt * (LOCS[S.loc].tw[t.id] || 1);
  let x = Math.random() * pool.reduce((a, t) => a + wt(t), 0);
  for (const t of pool) if ((x -= wt(t)) <= 0) return t;
  return pool[0];
}

function makeOrder(type, night, forceN) {
  const ev = EVENTS[S.event];
  const pool = menu().map((id) => ({ id, w: DISHES[id].w * (ev.w[id] || 1) * (type.w[id] || 1) * (season().w[id] || 1) * (rivalHits(id) ? 0.5 : 1) }));
  const r = Math.random();
  const count = Math.min(pool.length, forceN || clamp(r < 0.5 ? 1 : r < 0.85 ? 2 : 3, night ? 2 : type.min || 1, night ? 3 : type.max || 3));
  const order = [];
  for (let i = 0; i < count; i++) {
    const total = pool.reduce((a, p) => a + p.w, 0);
    let x = Math.random() * total, k = 0;
    while (k < pool.length - 1 && (x -= pool[k].w) > 0) k++;
    const o = { item: pool[k].id, done: false };
    if (SAUCED.includes(o.item)) { const z = Math.random(); o.sauce = z < 0.35 ? 'k' : z < 0.65 ? 'km' : z < 0.85 ? 'm' : ''; }
    if (DISHES[o.item].cook && S.day >= 2 && Math.random() < 0.18) o.well = true;   // özel istek: iyi pişmiş
    order.push(o);
    pool.splice(k, 1);
  }
  return order;
}

function spawnCustomer(reg, special) {
  const used = D.customers.map((c) => c.slot);
  const free = Array.from({ length: nSlots() }, (_, i) => i).filter((i) => !used.includes(i));
  if (!free.length) return false;
  const slot = free[Math.floor(Math.random() * free.length)];
  const ev = EVENTS[S.event];
  const night = D.t >= DAY_LEN;
  const type = special || (reg ? TYPES.find((t) => t.id === reg.type) : pickType());
  const group = !reg && !special && !night && S.day >= 3 && Math.random() < 0.06 ? 4 + Math.floor(Math.random() * 2) : 0;   // kalabalık grup
  const loy = reg ? S.reg[reg.id] || 0 : 0;
  const order = reg
    ? (reg.order.every(dishOpen) ? reg.order : reg.alt || reg.order.filter(dishOpen)).map((item) => ({ item, done: false }))
    : makeOrder(type, night, group);
  const effort = order.filter((o) => DISHES[o.item].kind !== 'ready').length;
  const maxP = (22 + 5 * (order.length - 1) + 12 * effort) * ev.pat * type.pat * LOCS[S.loc].pat * (S.up.tente ? 1.25 : 1) * (S.policy === 2 ? 0.9 : 1) * (reg ? 1.2 : 1) * (night ? 0.85 : 1) * (group ? 1.5 : 1) * (S.tier >= 2 ? 1.2 : 1) * DIFF[S.diff || 'normal'].pat * (1 + 0.02 * nbH('berber'));
  const c = { id: D.nextId++, slot, type, order, p: maxP, maxP, leaving: 0, paid: 0, perfect: 0, flaw: false, reg: reg || null, night, group, prepaid: !!special };

  const e = h('div', `cust s${slot}`);
  e.style.left = slotX(slot) + '%';
  if (nSlots() === 4) e.style.width = '25%';
  const bubble = h('div', 'bubble');
  order.forEach((o) => {
    const d = DISHES[o.item];
    o.el = h('span', 'oi', dPic(o.item) + (d.short ? `<small>${d.short}</small>` : '') + sauceMarks(o.sauce) + (o.well ? '<span class="sau well">🔥 iyi pişmiş</span>' : ''));
    bubble.append(o.el);
  });
  const send = h('button', 'send', 'Kusura bakma ✋');
  send.onclick = (evn) => { evn.stopPropagation(); dismiss(c); };
  e.append(bubble, h('div', 'face', pic(type.id)), h('div', 'tag' + (reg ? ' reg' : ''), reg ? `${reg.name} ${'♥'.repeat(loy)}` : special ? special.tag : group ? `Grup ×${group}` : night ? 'Gececi' : type.name), h('div', 'pbar', '<i></i>'), send);
  e.onclick = () => { if (!c.leaving && !c.pay) setTarget(D.target === c ? null : c); };
  c.el = e; c.bar = e.querySelector('.pbar i');
  e.dataset.drop = 'cust'; e._c = c;
  $('#customers').append(e);
  D.customers.push(c);
  return true;
}

function leave(c, mood) {
  if (c.leaving) return;
  c.leaving = 0.5;
  if (D.target === c) D.target = null;
  c.el.classList.remove('ask');
  c.el.classList.add(mood);
}

// Müdavim küstü: bir kalp gider
function regFail(c) {
  if (!c.reg) return;
  S.reg[c.reg.id] = Math.max(0, (S.reg[c.reg.id] || 0) - 1);
  D.st.regDown.push(c.reg.name);
}

function dismiss(c) {
  if (c.leaving) return;
  regFail(c);
  D.st.sent++;
  setCombo(0);
  addRep(-0.04);
  floatText('Yine beklerim…', c.slot, 'bad');
  leave(c, 'angry');
}

function findTaker(dishId) {
  const wants = (c) => !c.leaving && c.order.some((o) => o.item === dishId && !o.done);
  if (D.target && wants(D.target)) return D.target;   // oyuncunun seçtiği müşteri önce
  return D.customers.find(wants);
}

// q: 'ok' | 'perfect' (tam kıvamında) | 'flaw' (fazla kızarmış, yarım bardak…)
function deliver(c, dishId, q = 'ok', ord) {
  const o = ord || c.order.find((x) => x.item === dishId && !x.done);
  S.sold[dishId] = 1;
  o.done = true; o.el.classList.add('done');
  const p = price(dishId);
  S.cash += p; D.st.rev += p; c.paid += p;
  if (q === 'perfect' && DISHES[dishId].cook) {
    const before = skillLvl(dishId);
    S.skill[dishId] = (S.skill[dishId] || 0) + 1;
    if (skillLvl(dishId) > before) setTimeout(() => toast(`⭐ ${DISHES[dishId].name} ustalığı ${skillLvl(dishId)}. seviye`), 900);
  }
  if (q === 'perfect') { D.st.perfect++; c.perfect++; floatText(`Kıvamında! +${tl(p)}`, c.slot, 'tip'); }
  else if (q === 'flaw' && !c.prepaid && Math.random() < 0.25) {   // zor müşteri: beğenmedi, parasını geri istedi
    c.flaw = true; S.cash -= p; D.st.rev -= p; c.paid -= p; D.st.refund += p;
    floatText('Beğenmedi, iade istedi 😤', c.slot, 'bad');
  }
  else if (q === 'flaw') { c.flaw = true; floatText(`Eh işte… +${tl(p)}`, c.slot, 'bad'); }
  else floatText('+' + tl(p), c.slot);
  sfx.coin(); buzz(10);
  if (DISHES[dishId].recipe && DISHES[dishId].recipe[0] === 'ekmek') D.st.tost++;

  if (c.order.every((x) => x.done)) {
    if (S.stock.fis > 0) S.stock.fis--; else D.st.fisless++;   // her müşteriye bir fiş
    const happy = c.p / c.maxP > 0.5 && !c.flaw;
    D.st.served++; S.total.served++;
    if (c.prepaid) D.st.packs++;
    if (happy) {
      setCombo(D.combo + 1);
      const tip = Math.max(5, round5(c.paid * 0.1 * c.type.tip * EVENTS[S.event].tip * comboMult() * (1 + 0.15 * c.perfect) * LOCS[S.loc].tip * (c.night ? 1.5 : 1) * (c.reg ? 1 + 0.25 * (S.reg[c.reg.id] || 0) : 1) * (D.dirt >= 8 ? 0.8 : 1) * (S.tier >= 2 ? 1.2 : 1) * (c.group ? 1.5 : 1) * (D.flower ? 1.15 : 1)));
      c.tip = tip;
    }
    if (c.reg && happy) {
      if ((S.reg[c.reg.id] || 0) < 5) { S.reg[c.reg.id] = (S.reg[c.reg.id] || 0) + 1; D.st.regUp.push(c.reg.name); }
      addRep(0.05);
      setTimeout(() => floatText('♥ Müdavim memnun', c.slot, 'tip'), 700);
    } else if (c.reg) regFail(c);
    addRep((happy ? 0.09 : 0.05) * POLICY[S.policy].rep - (c.flaw ? 0.03 : 0));
    askPay(c);
  }
  updateHud();
}

// ---------- Kasa: hesap ve para üstü ----------
function payTip(c) {
  if (!c.tip) return;
  S.cash += c.tip; D.st.tips += c.tip;
  floatText(`Üstü kalsın +${tl(c.tip)}`, c.slot, 'tip'); sfx.tip();
  updateHud();
}
function payBubble(c, html) {
  if (D.target === c) setTarget(null);
  c.el.classList.add('paying');
  const b = c.el.querySelector('.bubble');
  b.innerHTML = html;
  return b;
}
function payBtn(bubble, label, fn, cls = 'posbtn') {
  const b = h('button', 'chg ' + cls, label);
  b.onclick = (e) => { e.stopPropagation(); if (live()) fn(b); };
  bubble.append(b);
  return b;
}
function askPay(c) {
  const total = c.paid;
  if (c.prepaid || S.day < 2) { payTip(c); return leave(c, 'happy'); }   // ilk gün ve ön ödemeli paket: kasa işi yok

  // Hesabı ödemeden kaçmaya çalışan: 2,5 saniyede yakala
  if (Math.random() < 0.04) {
    c.pay = { run: true, total, t: 2.5, age: 0 };
    payBtn(payBubble(c, `<span class="paynote">🏃 Ödemeden kaçıyor!<small>hesap ${tl(total)}</small></span>`), 'Yakala!', () => {
      if (!c.pay) return;
      c.pay = null; addRep(0.03);
      floatText('Yakaladın, ödedi 👮', c.slot, 'tip'); sfx.coin();
      leave(c, 'angry');
    });
    return;
  }

  if (Math.random() < (CARD_RATE[c.type.id] || 0.45)) {
    const m = Math.random();
    if (m < 0.25) {                                // QR: cihaz gerekmez, komisyon yok
      c.pay = { qr: true, total, t: 10, age: 0, qrT: 0 };
      payBtn(payBubble(c, `<span class="paynote">📱 QR ile ödeyecek<small>hesap ${tl(total)}</small></span>`), 'QR göster', (b) => {
        if (!c.pay || c.pay.qrT) return;
        c.pay.qrT = 1.2; b.textContent = 'Okutuluyor…'; beep(1000, 0.05, 'square', 0.04);
      });
      return;
    }
    if (S.up.pos) {                                // kart ya da yemek kartı: POS cihazından tutar girilir
      const meal = m > 0.8;
      c.pay = { card: true, meal, total, t: 14, age: 0 };
      payBtn(payBubble(c, `<span class="paynote">${meal ? '🍽️ Yemek kartıyla' : '💳 Kartla'} ödeyecek<small>hesap ${tl(total)}</small></span>`), 'POS’u aç', () => posOpen(c));
      return;
    }
    if (c.tip) { c.tip = round5(c.tip / 2); if (Math.random() < 0.4) floatText('Kart geçmiyor mu? 😕', c.slot, 'bad'); }   // POS yok: nakit verir, bahşiş yarım
  }

  const note = [50, 100, 200, 500, 1000, 2000].find((n) => n >= total);
  if (!note || note === total) { payTip(c); return leave(c, 'happy'); }   // tam para
  if (S.coins <= 0) {                                // bozukluk bitti: para üstü verilemiyor
    c.tip = 0; D.st.payBad++; sfx.err();
    floatText('Bozuk paran yok! 🪙', c.slot, 'bad');
    return leave(c, 'angry');
  }
  const change = note - total, opts = new Set([change]);
  while (opts.size < 3) {
    const v = change + [5, 10, 20, 50][Math.floor(Math.random() * 4)] * (Math.random() < 0.5 ? -1 : 1);
    if (v > 0) opts.add(v);
  }
  c.pay = { change, note, total, fake: note >= 200 && Math.random() < 0.08, checked: false, t: 10, age: 0 };
  const bubble = payBubble(c, `<span class="paynote">💵 ${tl(note)} verdi<small>hesap ${tl(total)} · para üstü? · 🪙${S.coins}</small></span>`);
  const row = h('span', 'chgs');
  [...opts].sort(() => Math.random() - 0.5).forEach((a) => {
    const b = h('button', 'chg', tl(a));
    b.dataset.ok = a === change ? '1' : '';
    b.onclick = (e) => { e.stopPropagation(); if (live()) resolvePay(c, a === change); };
    row.append(b);
  });
  bubble.append(row);
  if (note >= 200) payBtn(bubble, '🔍 Parayı kontrol et', (b) => {   // sahte banknot olabilir
    if (!c.pay || c.pay.checked) return;
    c.pay.checked = true; b.remove();
    if (c.pay.fake) { c.pay.fake = false; addRep(0.02); floatText('Sahteydi! Gerçeğini verdi 🔍', c.slot, 'tip'); sfx.ready(); }
    else floatText('Para gerçek ✓', c.slot);
  }, 'chk');
}
// ok: true doğru para üstü, false yanlış, null kasada bekletildi
function resolvePay(c, ok) {
  if (!c.pay || c.leaving) return;
  const pay = c.pay;
  c.pay = null;
  if (pay.run) {                                   // yakalanamadı
    S.cash -= pay.total; D.st.rev -= pay.total; D.st.runaway += pay.total; D.st.payBad++; updateHud();
    floatText(`Kaçtı! −${tl(pay.total)}`, c.slot, 'bad'); sfx.angry();
    return leave(c, 'angry');
  }
  if (pay.change != null) S.coins = Math.max(0, S.coins - 1);
  if (pay.fake && ok !== null) {                   // kontrol edilmeden alınan sahte banknot
    S.cash -= pay.note; D.st.fake += pay.note; D.st.payBad++; updateHud();
    floatText(`Sahte para! −${tl(pay.note)}`, c.slot, 'bad'); sfx.angry();
    return leave(c, 'happy');
  }
  if (ok) payTip(c);
  else {
    if (ok === false) addRep(-0.05);
    floatText(ok === false ? 'Para üstü yanlış! 😬' : 'Kasada bekledi… 😒', c.slot, 'bad');
    sfx.err();
    D.st.payBad++;
  }
  leave(c, ok ? 'happy' : 'angry');
}

// ---------- POS cihazı ----------
function posPaint() {
  const P = D.pos, el = $('#pos');
  el.hidden = !P;
  if (!P) return;
  const total = P.c.pay ? P.c.pay.total : 0;
  $('#posAmt').textContent = '₺' + (P.typed || '0');
  $('#posMsg').textContent = { amount: `Hesap ${tl(total)} · tutarı gir, yeşile bas`, card: 'Kart okutuluyor…', pin: 'Müşteri şifresini giriyor…', retry: 'BAĞLANTI HATASI · yeşile tekrar bas', ok: 'ONAYLANDI ✓' }[P.stage];
  el.dataset.stage = P.stage;
}
function posOpen(c) {
  if (!live() || !c.pay || !c.pay.card) return;
  if (D.pos && D.pos.c === c) return;                                   // zaten bu müşteri için açık
  if (D.pos && D.pos.stage !== 'amount') return nope(c.el, 'POS meşgul, bekle');
  D.pos = { c, typed: '', stage: 'amount', t: 0, failed: false };
  beep(1000, 0.05, 'square', 0.04);
  posPaint();
}
function posClose() { D.pos = null; posPaint(); }
function posKey(k) {
  const P = D.pos;
  if (!live() || !P || P.stage !== 'amount') return;
  if (k === 'C') P.typed = P.typed.slice(0, -1);
  else if (P.typed.length < 4 && !(P.typed === '' && k === '0')) P.typed += k;
  beep(1100, 0.03, 'square', 0.04); buzz(6);
  posPaint();
}
function posEnter() {
  const P = D.pos;
  if (!live() || !P || (P.stage !== 'amount' && P.stage !== 'retry')) return;
  if (!P.typed) return nope($('#pos .pos-body'), 'Önce tutarı gir');
  P.stage = 'card'; P.t = 0.9;
  beep(700, 0.08, 'square', 0.05);
  posPaint();
}
function posTick(dt) {
  const P = D.pos;
  if (!P) return;
  if (!P.c.pay || P.c.leaving) return posClose();        // müşteri gitti ya da kasiyer halletti
  if (P.stage === 'amount' || P.stage === 'retry') return;
  if ((P.t -= dt) > 0) return;
  if (P.stage === 'card') {
    if (!P.failed && Math.random() < 0.12) { P.failed = true; P.stage = 'retry'; sfx.err(); }
    else if (P.c.pay.total >= 300 || Math.random() < 0.3) { P.stage = 'pin'; P.t = 1.1; }
    else { P.stage = 'ok'; P.t = 0.6; sfx.ready(); }
  } else if (P.stage === 'pin') { P.stage = 'ok'; P.t = 0.6; sfx.ready(); }
  else {
    const c = P.c, total = c.pay.total, amt = +P.typed, key = c.pay.meal ? 'meal' : 'card';
    posClose();
    D.st.cardN++;
    if (amt === total) { D.st[key] += total; return resolvePay(c, true); }
    c.pay = null; D.st.payBad++; sfx.err();
    if (amt < total) {                                   // eksik çekildi: fark cebinden
      const d = total - amt;
      S.cash -= d; D.st.rev -= d; D.st[key] += amt; updateHud();
      floatText(`Eksik çektin −${tl(d)}`, c.slot, 'bad');
      return leave(c, 'happy');
    }
    D.st[key] += total;                                  // fazla çekildi: müşteri fark etti, iade
    addRep(-0.08);
    floatText('Fazla çektin! 😬', c.slot, 'bad');
    return leave(c, 'angry');
  }
  posPaint();
}

// ---------- Elemanlar ----------
function openOrders() {
  const open = [];
  for (const c of D.customers) if (!c.leaving && !c.pay) for (const o of c.order) if (!o.done) open.push(o);
  return open;
}
// Garson: bitmiş tabağı, ızgaradan doğrudan çıkanı ve raftaki hazır ürünü götürür
function garsonAct() {
  if (D.plate && !(needsCut(D.plate.dish) && !D.plate.cut)) { const c = plateTaker(); if (c) return servePlate(c); }
  for (let i = 0; i < D.slots.length; i++) {
    const s = D.slots[i];
    if ((s.state !== 'ready' && s.state !== 'over') || needsPlate(s.dish)) continue;
    const c = findTaker(s.dish);
    if (!c) continue;
    const o = c.order.find((x) => x.item === s.dish && !x.done);
    if (o.well && s.state === 'ready') continue;       // iyi pişmiş isteyene biraz daha bekletir
    return tapSlot(i);
  }
  if (D.sq.ready && findTaker('portakal')) return tapSqueeze();
  for (const c of D.customers) {
    if (c.leaving || c.pay) continue;
    const o = c.order.find((x) => !x.done && DISHES[x.item].kind === 'ready' && S.stock[x.item] > 0);
    if (o) { S.stock[o.item]--; paintStock(); return deliver(c, o.item); }
  }
}
// Aşçı: sırayla bir iş yapar (bastır, tabağa al, kes, sos sık, malzeme koy, ızgaraya at)
function asciAct() {
  const open = openOrders();
  if (D.dirt >= 6) return cleanUp();
  const br = D.slots.findIndex((x) => x.state === 'broken');
  if (br >= 0) return tapSlot(br);
  let i = D.slots.findIndex((x) => x.state === 'press' || x.state === 'burnt');
  if (i >= 0) return tapSlot(i);
  if (D.fryer && D.fryer.state === 'burnt') return tapFryer();
  if (D.plate) {
    const p = D.plate, w = open.filter((o) => o.item === p.dish);
    if (!w.length) return p.t >= COLD ? clearBoard() : undefined;
    if (needsCut(p.dish) && !p.cut) return tapBoard();
    if (SAUCED.includes(p.dish)) {
      const t = w.find((o) => [...p.sauce].every((x) => o.sauce.includes(x)));
      const miss = t && [...t.sauce].find((x) => !p.sauce.includes(x));
      if (miss) return addSauce(miss);
    }
    return;                                              // servis bekliyor
  }
  if (!D.board.length) {
    i = D.slots.findIndex((x) => (x.state === 'ready' || x.state === 'over') && needsPlate(x.dish) && (x.state === 'over' || open.some((o) => o.item === x.dish && !o.well) || !open.some((o) => o.item === x.dish)));
    if (i >= 0) return tapSlot(i);
  }
  if (D.board.length) {
    const id = boardDish();
    if (id && DISHES[id].cook) return D.slots.some((x) => x.state === 'empty') ? tapBoard() : undefined;
    const target = open.map((o) => o.item).find((d) => DISHES[d].recipe && DISHES[d].recipe.length > D.board.length && D.board.every((x) => DISHES[d].recipe.includes(x)));
    if (!target) return;
    const need = DISHES[target].recipe.find((x) => !D.board.includes(x));
    if (need === 'patates') {
      if (D.fryer.state === 'ready') return tapFryer();
      return D.fryer.state === 'empty' && S.stock.patates > 0 ? tapIng('patates') : undefined;
    }
    if (need === 'doner') return D.doner.ready || D.doner.v > 0 || S.stock.doner > 0 ? tapDoner() : undefined;
    return S.stock[need] > 0 && !boardReject(need) ? tapIng(need) : undefined;
  }
  const inWork = (id) => D.slots.filter((x) => x.dish === id && x.state !== 'empty' && x.state !== 'burnt').length;
  const count = {};
  for (const o of open) if (DISHES[o.item].recipe) count[o.item] = (count[o.item] || 0) + 1;
  for (const id in count) {
    const d = DISHES[id];
    if (inWork(id) >= count[id]) continue;
    if (d.cook && !D.slots.some((x) => x.state === 'empty')) continue;
    if (S.stock[d.recipe[0]] > 0 && d.recipe.every((x) => x === 'patates' || x === 'doner' || S.stock[x] > 0)) return tapIng(d.recipe[0]);
  }
}

// ---------- Oyuncu girdileri ----------
const live = () => running && !paused;

function tapProduct(id) {
  if (!live()) return;
  const d = DISHES[id], el = D.prodEls[id];
  if (S.stock[id] <= 0) return nope(el, `${d.name} bitti!`);
  const c = findTaker(id);
  if (!c) return nope(el, `${d.name} isteyen yok`);
  S.stock[id]--;
  paintStock();
  deliver(c, id);
}

function tapIng(id) {
  if (!live()) return;
  const el = D.ingEls[id];
  if (S.stock[id] <= 0) return nope(el, `${STOCK[id].name} bitti!`);
  if (id === 'patates') {
    if (D.fryer.state !== 'empty') return nope(el, 'Fritöz dolu!');
    S.stock.patates--;
    D.fryer.state = 'fry'; D.fryer.t = 0;
    paintFryer(); paintStock(); sfx.put();
    return;
  }
  const err = boardReject(id);
  if (err) return nope(el, err);
  S.stock[id]--;
  D.board.push(id);
  settle();
  paintBoard(); paintStock(); sfx.put();
}

function boardReject(id) {
  if (D.plate) return 'Tezgâhta hazır yemek var';
  const b = D.board, bread = id === 'ekmek' || id === 'sandvic';
  if (!b.length && !bread) return 'Önce ekmeği koy';
  if (b.length && bread) return 'Tezgâhta zaten ekmek var';
  if (b.includes(id)) return 'Onu zaten koydun';
  const next = [...b, id];
  const fits = menu().some((d) => DISHES[d].recipe && next.every((x) => DISHES[d].recipe.includes(x)));
  return fits ? null : 'Bu ikisi birlikte olmaz';
}

function clearBoard() {
  if (!live() || (!D.board.length && !D.plate)) return;
  D.board = []; D.plate = null;
  paintBoard();
  toast('Tezgâh boşaltıldı 🗑️');
}

// Tabaktaki yemeği kim alır? Soslularda sos tam tutmalı
function plateTaker() {
  const p = D.plate;
  if (!SAUCED.includes(p.dish)) return findTaker(p.dish);
  const fits = (c) => !c.leaving && c.order.some((o) => o.item === p.dish && !o.done && o.sauce === p.sauce);
  if (D.target && fits(D.target)) return D.target;
  return D.customers.find(fits);
}
function servePlate(c) {
  const p = D.plate, sauced = SAUCED.includes(p.dish);
  const open = (x) => x.item === p.dish && !x.done;
  const o = c.order.find((x) => open(x) && (!sauced || x.sauce === p.sauce)) || c.order.find(open);
  let q = p.q === 'ok' ? 'ok' : cookQ(o, p.q === 'flaw');
  if (sauced) {
    if (o.sauce !== p.sauce) { q = 'flaw'; toast('Sosu yanlış oldu'); }
    else if (q === 'ok') q = 'perfect';
  }
  if (p.t >= COLD) { q = 'flaw'; toast('Soğumuş bu 🥶'); }
  D.plate = null;
  paintBoard();
  deliver(c, p.dish, q, o);
}
function tapPlate() {
  const p = D.plate, el = $('#board');
  if (needsCut(p.dish) && !p.cut) {
    p.cut = true;
    beep(1400, 0.04, 'square', 0.05); beep(500, 0.06, 'triangle', 0.07, 0.04); buzz(12);
    return paintBoard();
  }
  const c = plateTaker();
  if (!c) return nope(el, SAUCED.includes(p.dish) ? `${SAUCE_NAME[p.sauce]} isteyen yok` : `${DISHES[p.dish].name} isteyen yok`);
  servePlate(c);
}
function addSauce(x) {
  if (!live()) return;
  const p = D.plate, el = $(x === 'k' ? '#sauceK' : '#sauceM');
  if (!p || !SAUCED.includes(p.dish)) return nope(el, 'Sos sıkacak bir şey yok');
  if (p.sauce.includes(x)) return nope(el, 'Onu zaten sıktın');
  p.sauce = [...(p.sauce + x)].sort().join('');
  beep(x === 'k' ? 320 : 260, 0.12, 'sawtooth', 0.05); buzz(10);
  paintBoard();
}

function tapBoard() {
  if (!live()) return;
  if (D.plate) return tapPlate();
  const el = $('#board'), id = boardDish();
  if (!D.board.length) return nope(el, 'Önce ekmeği koy');
  if (!id) return nope(el, 'Tarif eksik');
  if (DISHES[id].cook) {
    const s = D.slots.find((x) => x.state === 'empty');
    if (!s) return nope(el, 'Izgara dolu!');
    return toGrill(s, id);
  }
  const c = findTaker(id);
  if (!c) return nope(el, `${DISHES[id].name} isteyen yok`);
  D.board = [];
  paintBoard();
  deliver(c, id);
}

function toGrill(s, id) {
  s.dish = id; s.t = 0; s.w = 0; s.state = 'cook1';
  s.el.style.setProperty('--b', 0);
  D.board = [];
  paintBoard(); paintSlot(s); sfx.put();
}

function tapSlot(i) {
  if (!live()) return;
  const s = D.slots[i];
  if (s.state === 'broken') {                        // dokuna dokuna onar
    s.fix++;
    beep(300 + s.fix * 90, 0.06, 'square', 0.05); buzz(12);
    if (s.fix >= 6) { s.state = 'empty'; toast('Onarıldı 🔧'); sfx.ready(); }
    return paintSlot(s);
  }
  const reset = () => { s.dish = null; s.state = 'empty'; paintSlot(s); };
  if (s.state === 'empty') {
    const id = boardDish();
    if (!id) return nope(s.el, D.board.length ? 'Tarif eksik' : 'Önce tezgâhta hazırla');
    if (!DISHES[id].cook) return nope(s.el, 'Bu ızgaraya girmez');
    return toGrill(s, id);
  }
  if (s.state === 'press') { s.state = 'cook2'; paintSlot(s); beep(420, 0.07, 'triangle', 0.08); buzz(15); return; }
  if ((s.state === 'ready' || s.state === 'over') && needsPlate(s.dish)) {   // önce tezgâha: kes ya da sos sık
    if (D.board.length || D.plate) return nope(s.el, 'Önce tezgâhı boşalt');
    const id = s.dish, q = s.state === 'ready' ? 'perfect' : 'flaw';
    reset();
    toPlate(id, q);
    return sfx.put();
  }
  if (s.state === 'ready' || s.state === 'over') {
    const c = findTaker(s.dish);
    if (!c) return nope(s.el, `${DISHES[s.dish].name} isteyen yok`);
    const id = s.dish, q = s.state === 'ready' ? 'perfect' : 'flaw';
    reset();
    const o = c.order.find((x) => x.item === id && !x.done);
    return deliver(c, id, cookQ(o, q === 'flaw'), o);
  }
  if (s.state === 'burnt') { reset(); return toast('Çöpe gitti 🗑️'); }
  nope(s.el, 'Daha pişmedi');
}

function tapFryer() {
  if (!live()) return;
  const f = D.fryer;
  if (f.state === 'ready') {
    const err = boardReject('patates');
    if (err) return nope(f.el, D.board.length ? err : 'Tezgâha sandviç ekmeği koy');
    D.board.push('patates');
    settle();
    f.state = 'empty'; paintFryer(); paintBoard(); sfx.put();
  } else if (f.state === 'burnt') { f.state = 'empty'; paintFryer(); toast('Çöpe gitti 🗑️'); }
  else if (f.state === 'fry') nope(f.el, 'Daha kızarmadı');
  else nope(f.el, 'Patatese dokun');
}

// Döner: her dokunuş bir kesim; porsiyon dolunca sandviç ekmeğine konur
function tapDoner() {
  if (!live()) return;
  const q = D.doner;
  if (q.ready) {
    const err = boardReject('doner');
    if (err) return nope(q.el, D.board.length ? err : 'Tezgâha sandviç ekmeği koy');
    D.board.push('doner');
    settle();
    q.ready = false; q.v = 0;
    paintDoner(); paintBoard(); sfx.put();
    return;
  }
  if (q.v === 0) {
    if (S.stock.doner <= 0) return nope(q.el, 'Döner eti bitti!');
    S.stock.doner--;
  }
  q.v = Math.min(1, q.v + 0.25);
  beep(260 + q.v * 200, 0.05, 'sawtooth', 0.05); buzz(8);
  if (q.v >= 1) { q.ready = true; sfx.ready(); }
  paintDoner();
}

// Çay ve kahve: basılı tut, yeşil çizgide bırak. Demlik DEM bardakta biter, yeniden demlenir.
function pourStart(id) {
  if (!live() || D.pour.on) return;
  const el = D.prodEls[id], d = DISHES[id];
  if (S.stock[id] <= 0) return nope(el, `${d.name} bitti!`);
  if (id === 'cay' && D.dem <= 0) {
    if (D.demT) return nope(el, 'Demleniyor, bekle');
    D.demT = 5; toast('Çay demleniyor… ⏳'); sfx.put(); paintGauges();
    return;
  }
  if (!findTaker(id)) return nope(el, `${d.name} isteyen yok`);
  D.pour.on = true; D.pour.v = 0; D.pour.id = id;
}
function pourEnd() {
  if (!D || !D.pour.on) return;
  const v = D.pour.v, id = D.pour.id;
  D.pour.on = false; D.pour.v = 0;
  paintGauges();
  if (v < 0.45) return toast(id === 'cay' ? 'Çok az doldu, baştan' : 'Daha köpürmedi, baştan');
  const c = findTaker(id);
  if (!c) return;
  S.stock[id]--;
  if (id === 'cay') D.dem--;
  paintStock(); paintGauges();
  deliver(c, id, v >= 0.75 ? 'perfect' : 'flaw');
}

// Portakal: her dokunuş bir sıkım
function tapSqueeze() {
  if (!live()) return;
  const q = D.sq, el = D.prodEls.portakal;
  if (!q.ready) {
    if (q.v === 0) {
      if (S.stock.portakal < 2) return nope(el, 'Portakal bitti!');
      S.stock.portakal -= 2;
      paintStock();
    }
    q.v = Math.min(1, q.v + 0.2);
    beep(500 + q.v * 400, 0.05, 'triangle', 0.07); buzz(8);
    if (q.v < 1) return paintGauges();
    q.ready = true;
    sfx.ready();
  }
  paintGauges();
  const c = findTaker('portakal');
  if (!c) return toast('Bardak hazır, isteyen bekleniyor');
  q.v = 0; q.ready = false;
  paintGauges();
  deliver(c, 'portakal', 'perfect');
}

function paintGauges() {
  const se = D.prodEls.portakal;
  for (const id of ['cay', 'kahve']) {
    const el = D.prodEls[id];
    if (!el) continue;
    el.querySelector('.gauge').style.height = (D.pour.on && D.pour.id === id ? Math.min(100, D.pour.v * 100) : 0) + '%';
    if (id === 'cay') el.querySelector('.pp').textContent = D.demT ? 'demleniyor…' : D.dem <= 0 ? 'dokun: demle' : `dem ${D.dem}/${DEM}`;
  }
  if (se) { se.querySelector('.gauge').style.height = D.sq.v * 100 + '%'; se.classList.toggle('full', D.sq.ready); }
}

function tapCat() {
  if ($('#cat').hidden) return;
  $('#cat').hidden = true; D.catUntil = 0;
  addRep(0.08);
  D.st.cats++; S.total.cats = (S.total.cats || 0) + 1;
  floatText(`${S.style.cat || 'Kedi'}: Miyav ❤️`, nSlots() - 1, 'tip');
  sfx.meow(); buzz(15);
}
function tapGull() {
  if ($('#gull').hidden) return;
  $('#gull').hidden = true; D.gullUntil = 0;
  floatText('Kışt! 🖐️', 1, 'tip');
  beep(900, 0.08, 'triangle', 0.07);
}

// ---------- Sürükle-bırak ----------
// Dokunma kısayolu hâlâ çalışır; sürükleyince hedefi sen seçersin.
let drag = null, suppressClick = false;

function makeDraggable(el, getPayload) {
  el.addEventListener('pointerdown', (e) => {
    if (drag || !live()) return;
    const p = getPayload();
    if (p) drag = { el, p, x: e.clientX, y: e.clientY, pid: e.pointerId, ghost: null };
  });
}

const wants = (c, dishId) => !c.leaving && c.order.some((o) => o.item === dishId && !o.done);

// Bu yük nereye bırakılabilir?
function dropTargets(p) {
  const custs = (dish) => D.customers.filter((c) => wants(c, dish)).map((c) => c.el);
  const trash = $('#trash');
  if (p.kind === 'ing') return p.id === 'patates' ? (D.fryer.state === 'empty' ? [D.fryer.el] : []) : (boardReject(p.id) ? [] : [$('#board')]);
  if (p.kind === 'board') {
    if (!p.dish) return [trash];
    return DISHES[p.dish].cook ? [...D.slots.filter((s) => s.state === 'empty').map((s) => s.el), trash] : [...custs(p.dish), trash];
  }
  if (p.kind === 'plate') return needsCut(p.dish) && !D.plate.cut ? [trash] : [...custs(p.dish), trash];
  if (p.kind === 'slot') {
    if (!p.dish) return [trash];
    return needsPlate(p.dish) ? (D.board.length || D.plate ? [trash] : [$('#board'), trash]) : [...custs(p.dish), trash];
  }
  if (p.kind === 'fryer') return D.fryer.state === 'ready' && !boardReject('patates') ? [$('#board'), trash] : [trash];
  if (p.kind === 'doner') return boardReject('doner') ? [] : [$('#board')];
  return custs(p.dish);
}

function moveDrag(e) {
  if (!drag || e.pointerId !== drag.pid) return;
  if (!drag.ghost) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 10) return;
    drag.ghost = h('div', 'dragghost', drag.p.html || drag.p.emoji);
    if (drag.p.b != null) drag.ghost.style.setProperty('--b', drag.p.b);
    document.body.append(drag.ghost);
    drag.el.classList.add('dragging');
    drag.marks = dropTargets(drag.p);
    drag.marks.forEach((m) => m.classList.add('drop-ok'));
  }
  drag.ghost.style.left = e.clientX + 'px';
  drag.ghost.style.top = e.clientY + 'px';
}

function endDrag(e) {
  if (!drag || e.pointerId !== drag.pid) return;
  const d = drag;
  drag = null;
  if (!d.ghost) return;                       // sürüklenmedi: normal dokunuş
  d.ghost.remove();
  d.el.classList.remove('dragging');
  d.marks.forEach((m) => m.classList.remove('drop-ok'));
  suppressClick = true;
  setTimeout(() => { suppressClick = false; }, 80);
  if (e.type === 'pointercancel' || !live()) return;
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const zone = under && under.closest('[data-drop]');
  if (zone) drop(d.p, zone);
}

// Belirli bir müşteriye servis: istemiyorsa geri çevir
function serveTo(c, dishId, fn) {
  if (!c || c.leaving) return;
  if (!wants(c, dishId)) return nope(c.el, `${DISHES[dishId].name} istemedi`);
  const old = D.target;
  D.target = c;
  fn();
  D.target = old && !old.leaving ? old : null;
}

function drop(p, zone) {
  const kind = zone.dataset.drop;
  if (p.kind === 'ing') {
    if (p.id === 'patates') {
      if (kind === 'fryer') tapIng('patates');
      else if (kind === 'board') nope(zone, 'Önce fritözde kızart');
    } else if (kind === 'board') tapIng(p.id);
    return;
  }
  if (p.kind === 'plate') {
    if (kind === 'trash') return clearBoard();
    if (kind !== 'cust' || !D.plate) return;
    if (needsCut(p.dish) && !D.plate.cut) return nope(zone, 'Önce ikiye kes');
    const c = zone._c;
    if (!c || c.leaving) return;
    if (!wants(c, p.dish)) return nope(c.el, `${DISHES[p.dish].name} istemedi`);
    return servePlate(c);
  }
  if (p.kind === 'board') {
    if (kind === 'trash') return clearBoard();
    if (!p.dish) return;
    const cook = DISHES[p.dish].cook;
    if (kind === 'slot') {
      const s = D.slots[+zone.dataset.i];
      if (!cook) return nope(zone, 'Bu ızgaraya girmez');
      if (s.state !== 'empty') return nope(zone, 'Bu göz dolu');
      return toGrill(s, p.dish);
    }
    if (kind === 'cust') return cook ? nope(zone, 'Önce ızgarada pişir') : serveTo(zone._c, p.dish, tapBoard);
    return;
  }
  if (p.kind === 'slot') {
    const s = D.slots[p.i];
    if (kind === 'trash') { s.dish = null; s.state = 'empty'; paintSlot(s); return toast('Çöpe gitti 🗑️'); }
    if (kind === 'board') return p.dish && needsPlate(p.dish) ? tapSlot(p.i) : nope(zone, p.dish ? 'Bunu doğrudan müşteriye ver' : 'Yanmış bu!');
    if (kind === 'cust') {
      if (!p.dish) return nope(zone, 'Yanmış bu!');
      if (needsPlate(p.dish)) return nope(zone, needsCut(p.dish) ? 'Önce tezgâhta kes' : 'Önce tezgâhta sosunu sık');
      return serveTo(zone._c, p.dish, () => tapSlot(p.i));
    }
    return;
  }
  if (p.kind === 'fryer') {
    if (kind === 'board') return tapFryer();
    if (kind === 'trash') { D.fryer.state = 'empty'; paintFryer(); toast('Çöpe gitti 🗑️'); }
    return;
  }
  if (p.kind === 'doner') { if (kind === 'board') tapDoner(); return; }
  if (p.kind === 'prod' && kind === 'cust') serveTo(zone._c, p.dish, p.id === 'portakal' ? tapSqueeze : () => tapProduct(p.id));
}

document.addEventListener('pointermove', moveDrag);
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);
document.addEventListener('click', (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);

// ---------- Tezgâha uğrayanlar: dilenci, simitçi, çiçekçi ----------
const VISITORS = {
  dilenci: { text: '🧓 “Evladım, bir simit verir misin?”', btn: 'Simit ver', act: () => {
    if (S.stock.simit <= 0) return 'Simit kalmamış';
    S.stock.simit--; paintStock(); addRep(0.1); toast('“Allah razı olsun” 🙏 +itibar');
  } },
  simitci: { text: '🥯 Simitçi: “Sıcak simit! 8 tanesi ₺50”', btn: 'Al (₺50)', act: () => {
    if (S.cash < 50) return 'Paran yetmiyor';
    S.cash -= 50; S.spent.goods += 50; S.stock.simit = Math.min(capOf('simit'), S.stock.simit + 8); paintStock(); updateHud(); toast('8 sıcak simit rafta 🥯');
  } },
  cicekci: { text: '💐 Çiçekçi: “Tezgâha bir demet? ₺40”', btn: 'Al (₺40)', act: () => {
    if (S.cash < 40) return 'Paran yetmiyor';
    S.cash -= 40; D.flower = true; addRep(0.12); updateHud(); toast('Tezgâh çiçek açtı 💐 bugün bahşiş %15 fazla');
  } },
};
function showVisitor() {
  const kind = Object.keys(VISITORS)[Math.floor(Math.random() * 3)];
  D.visit = { kind, until: D.t + 9 };
  $('#visText').textContent = VISITORS[kind].text;
  $('#visBtn').textContent = VISITORS[kind].btn;
  $('#visitor').hidden = false;
  beep(620, 0.1, 'triangle', 0.06);
}
function visitAct() {
  if (!live() || !D.visit) return;
  const err = VISITORS[D.visit.kind].act();
  if (err) return nope($('#visitor'), err);
  sfx.coin();
  D.visit = null; $('#visitor').hidden = true;
}

// ---------- Öğretici (yalnızca ilk gün) ----------
// O anki duruma bakıp sıradaki adımı söyler
function coachText() {
  const open = [];
  for (const c of D.customers) if (!c.leaving) for (const o of c.order) if (!o.done) open.push(o);
  if (D.slots.some((x) => x.state === 'press')) return '“Bastır!” yazan ızgaraya dokun';
  if (D.plate) return needsCut(D.plate.dish) && !D.plate.cut ? 'Tabaktaki tosta dokun: ikiye kes' : 'Şimdi tostu isteyen müşteriye sürükle';
  if (D.slots.some((x) => x.state === 'ready' || x.state === 'over')) return 'Kıvamında! Tostu ızgaradan tezgâha sürükle';
  const busy = D.slots.some((x) => x.state !== 'empty');
  if (open.some((o) => o.item === 'kasarli') && !busy) {
    if (!D.board.length) return 'Tost istendi: ekmeği tezgâha sürükle';
    return boardDish() === 'kasarli' ? 'Hazır: tezgâhtaki tostu ızgaraya sürükle' : 'Şimdi kaşarı tezgâha ekle';
  }
  const rd = open.find((o) => DISHES[o.item].kind === 'ready' && S.stock[o.item] > 0);
  if (rd) return `${DISHES[rd.item].name} istendi: raftan müşteriye sürükle`;
  if (busy) return 'Tost pişiyor… gözün ızgarada olsun';
  return open.length ? '' : 'Müşteri bekleniyor…';
}

// ---------- Döngü ----------
function spawnInterval() {
  if (D.t < D.rushUntil) return 0.9;
  const crowd = EVENTS[S.event].spawn * POLICY[S.policy].spawn * (S.up.tabela ? 1.15 : 1) * LOCS[S.loc].spawn * season().spawn * (S.campaign ? 1.25 : S.rival ? 0.88 : 1) * (D.t >= DAY_LEN ? 1.2 : 1) * (S.up.pos ? 1.1 : 1) * (S.tier >= 3 ? 1.15 : 1) * (EVENTS[S.event].curve ? EVENTS[S.event].curve(D.t / DAY_LEN) : 1) * (1 + 0.03 * nbH('cayci'));
  const base = (7.6 - S.rep * 0.7) / crowd;
  return base * (0.7 + Math.random() * 0.6);
}

function loop(now) {
  if (!running) return;
  const dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;
  if (!paused) tick(dt);
  requestAnimationFrame(loop);
}

function tick(dt) {
  const wasDay = D.t < DAY_LEN;
  D.t += dt;
  const open = D.t < dayLen();
  if (wasDay && D.t >= DAY_LEN && S.night) banner('🌙 Gece vardiyası başladı');

  if (open) {
    D.spawnT -= dt;
    if (D.spawnT <= 0) { spawnCustomer(); D.spawnT = spawnInterval(); }
    if (D.ferries.length && D.t >= D.ferries[0]) {
      D.ferries.shift();
      D.rushUntil = D.t + 3; D.spawnT = 0.4;
      banner('⛴️ Vapur yanaştı!'); sfx.horn();
    }
    // Müdavim uğradı (tezgâh doluysa boşalınca gelir)
    if (D.regs.length && D.t >= D.regs[0].at && spawnCustomer(D.regs[0].r)) D.regs.shift();
    // Zabıta denetimi: 7 saniye önceden haber gelir
    if (D.inspAt && D.t >= D.inspAt) {
      D.inspAt = 0; D.inspDue = D.t + 7;
      banner('🚨 Zabıta geliyor! Yanıkları at'); sfx.horn();
    }
    // Paket siparişi (kurye), okul çıkışı, tezgâha uğrayanlar
    if (D.couriers.length && D.t >= D.couriers[0] && spawnCustomer(null, COURIER)) { D.couriers.shift(); banner('📦 Paket siparişi geldi'); }
    if (D.schoolAt && D.t >= D.schoolAt) { D.schoolAt = 0; D.schoolUntil = D.t + 8; D.rushUntil = D.t + 3; D.spawnT = 0.4; banner('🎒 Okul çıkışı!'); }
    if (D.visitAt && D.t >= D.visitAt) { D.visitAt = 0; showVisitor(); }
    // Arıza: boş bir ızgara gözü bozulur
    if (D.breakAt && D.t >= D.breakAt) {
      const sb = D.slots.find((x) => x.state === 'empty');
      if (sb) { D.breakAt = 0; sb.state = 'broken'; sb.fix = 0; paintSlot(sb); banner('🔧 Tost makinesi arızalandı!'); sfx.err(); }
      else if (D.t > D.breakAt + 20) D.breakAt = 0;
    }
    if (D.cats.length && D.t >= D.cats[0]) {
      D.cats.shift(); D.catUntil = D.t + 7;
      $('#cat').hidden = false;
    }
    // Martı simide göz dikti
    if (D.gulls.length && D.t >= D.gulls[0]) {
      D.gulls.shift();
      if (S.stock.simit > 0) { D.gullUntil = D.t + 4.5; $('#gull').hidden = false; beep(1500, 0.12, 'sawtooth', 0.04); beep(1150, 0.2, 'sawtooth', 0.04, 0.13); beep(1400, 0.15, 'sawtooth', 0.03, 0.4); }
    }
    // Elektrik kesintisi: ızgara ve fritöz durur
    if (D.blackAt && D.t >= D.blackAt) {
      D.blackAt = 0; D.blackUntil = D.t + 7;
      $('#stations').classList.add('blackout');
      banner('⚡ Elektrik kesildi!'); sfx.err();
    }
  }
  if (D.visit && D.t > D.visit.until) { D.visit = null; $('#visitor').hidden = true; }
  if (D.catUntil && D.t > D.catUntil) { D.catUntil = 0; $('#cat').hidden = true; }
  if (D.gullUntil && D.t > D.gullUntil) {
    D.gullUntil = 0; $('#gull').hidden = true;
    const n = Math.min(2, S.stock.simit);
    if (n > 0) { S.stock.simit -= n; D.st.stolen += n; paintStock(); toast(`Martı ${n} simit kaptı! 🕊️`); sfx.err(); }
  }
  if (D.inspDue && D.t >= D.inspDue) {
    D.inspDue = 0;
    const dirty = D.slots.filter((x) => x.state === 'burnt').length + (D.fryer && D.fryer.state === 'burnt' ? 1 : 0) + (D.plate && D.plate.t >= COLD ? 1 : 0) + (D.dirt >= 8 ? 1 : 0);
    if (dirty) {
      const fine = FINE * dirty;
      S.cash -= fine; D.st.fines += fine; updateHud();
      banner(`🚨 Zabıta ${tl(fine)} ceza kesti`); sfx.angry();
    } else { addRep(0.1); D.st.inspClean = true; banner('🚨 Zabıta: tertemiz 👍'); sfx.tip(); }
  }
  // Tabaktaki yemek soğur, demlik demlenir
  if (D.plate) {
    const was = D.plate.t;
    D.plate.t += dt;
    if ((was < 9 && D.plate.t >= 9) || (was < COLD && D.plate.t >= COLD)) paintBoard();
  }
  if (D.demT) {
    D.demT -= dt;
    if (D.demT <= 0) { D.demT = 0; D.dem = DEM; toast('Çay demlendi 🍵'); sfx.ready(); paintGauges(); }
  }
  const blackout = D.t < D.blackUntil;
  if (!blackout && D.blackUntil) {
    D.blackUntil = 0;
    $('#stations').classList.remove('blackout');
    banner('💡 Elektrik geldi');
  }

  posTick(dt);
  // Elemanlar kendi işini yapar
  if (S.crew.garson && (D.gT -= dt) <= 0) { D.gT = 2.2; garsonAct(); }
  if (S.crew.asci && (D.aT -= dt) <= 0) { D.aT = 1.1; asciAct(); }

  // Müşteri sabrı
  for (let i = D.customers.length - 1; i >= 0; i--) {
    const c = D.customers[i];
    if (c.leaving) {
      c.leaving -= dt;
      if (c.leaving <= 0) { c.el.remove(); D.customers.splice(i, 1); }
      continue;
    }
    if (c.pay) {                                  // kasada: hesabı bekliyor
      c.pay.t -= dt; c.pay.age += dt;
      c.bar.style.width = Math.max(0, c.pay.t * 10) + '%';
      c.bar.className = c.pay.t > 4 ? '' : 'low';
      if (S.crew.kasiyer && c.pay.age > 1.2) {            // kasiyer: kaçağı tutar, parayı kontrol eder, POS'u kullanır
        const y = c.pay;
        if (y.run) { c.pay = null; leave(c, 'angry'); continue; }
        y.fake = false;
        if (y.card) { D.st[y.meal ? 'meal' : 'card'] += y.total; D.st.cardN++; }
        if (y.qr) D.st.qrN++;
        resolvePay(c, true);
      } else if (c.pay.qrT && (c.pay.qrT -= dt) <= 0) { D.st.qrN++; resolvePay(c, true); }
      else if (c.pay.t <= 0) resolvePay(c, null);
      continue;
    }
    c.p -= dt;
    const r = Math.max(0, c.p / c.maxP);
    c.bar.style.width = (r * 100) + '%';
    c.bar.className = r > 0.5 ? '' : r > 0.25 ? 'mid' : 'low';
    if (c.p <= 0) {
      regFail(c);
      D.st.lost++;
      setCombo(0);
      addRep(-0.2);
      floatText('Bu ne ya! 😤', c.slot, 'bad');
      sfx.angry(); buzz(40);
      leave(c, 'angry');
    }
  }

  // Izgara: pişir → bastır/çevir → kıvamında → fazla kızardı → yandı
  if (!blackout) {
    for (const s of D.slots) {
      if (s.state === 'empty' || s.state === 'press' || s.state === 'burnt' || s.state === 'broken') continue;
      const time = cookTime(s.dish);
      if (s.state === 'cook1' || s.state === 'cook2') {
        s.t += dt;
        if (s.state === 'cook1' && s.t >= time / 2) { s.state = 'press'; paintSlot(s); sfx.ready(); }
        else if (s.state === 'cook2' && s.t >= time) { s.state = 'ready'; s.w = 0; paintSlot(s); sfx.ready(); }
        s.bar.style.width = Math.min(100, (s.t / time) * 100) + '%';
        s.el.style.setProperty('--b', (Math.min(1, s.t / time) * 0.5).toFixed(3));
      } else {
        s.w += dt;
        if (s.w >= 5) {
          s.w = 0;
          if (s.state === 'ready') s.state = 'over'; else { s.state = 'burnt'; D.st.burnt++; addDirt(2); sfx.err(); }
          paintSlot(s);
        }
        s.bar.style.width = (s.w / 5) * 100 + '%';
        if (s.state !== 'burnt') s.el.style.setProperty('--b', (s.state === 'ready' ? 0.5 + (s.w / 5) * 0.15 : 0.65 + (s.w / 5) * 0.35).toFixed(3));
      }
    }
    const f = D.fryer;
    if (f && (f.state === 'fry' || f.state === 'ready')) {
      f.t += dt;
      const lim = f.state === 'fry' ? 5 * (1 - 0.1 * (S.prep || 0)) : 8;
      if (f.t >= lim) {
        f.t = 0;
        if (f.state === 'fry') { f.state = 'ready'; sfx.ready(); } else { f.state = 'burnt'; D.st.burnt++; addDirt(2); sfx.err(); }
        paintFryer();
      }
      f.bar.style.width = (f.t / lim) * 100 + '%';
      const k = f.t / lim;   // soluk → altın → koyu
      f.el.querySelector('.se').style.filter = f.state === 'fry' ? `grayscale(${(0.7 * (1 - k)).toFixed(2)}) brightness(${(1.25 - 0.25 * k).toFixed(2)})` : f.state === 'ready' ? `brightness(${(1 - 0.35 * k).toFixed(2)}) sepia(${(0.6 * k).toFixed(2)})` : '';
    }
  }

  // Çay bardağı doluyor
  if (D.pour.on) {
    D.pour.v += dt / 1.4;
    if (D.pour.v > 1.06) {
      D.pour.on = false; D.pour.v = 0;
      S.stock[D.pour.id]--; if (D.pour.id === 'cay') D.dem--;
      paintStock();
      nope(D.prodEls[D.pour.id], 'Taştı! 🫗');
    }
    paintGauges();
  }

  if (D.coach) {
    const t = coachText();
    if (t !== D.coachT) { D.coachT = t; $('#coach').textContent = '👉 ' + t; $('#coach').hidden = !t; }
  }
  // Izgara cızırtısı ve fon müziği
  const hot = D.slots.filter((x) => x.state === 'cook1' || x.state === 'cook2' || x.state === 'ready' || x.state === 'over').length + (D.fryer && D.fryer.state === 'fry' ? 1 : 0);
  if (hot !== D.hot) { D.hot = hot; setSizzle(hot && !blackout ? 0.01 + 0.006 * hot : 0); }
  musicTick(dt);

  paintScene();
  if (!open && D.customers.length === 0) endDay();
}

// Gün ışığı: sabah sıcak → öğlen berrak → gün batımı turuncu → akşam lacivert (çizimin üstüne ton)
const TINT = [
  [0.00, [255, 170, 90, 0.24]],
  [0.20, [255, 220, 160, 0]],
  [0.65, [255, 200, 140, 0]],
  [0.86, [255, 110, 50, 0.3]],
  [1.00, [22, 24, 80, 0.58]],
];
function paintScene() {
  const p = clamp(D.t / DAY_LEN, 0, 1);
  const mins = D.t < DAY_LEN
    ? 8 * 60 + Math.floor(p * 14 * 60 / 10) * 10
    : (22 * 60 + Math.floor(Math.min(1, (D.t - DAY_LEN) / NIGHT_LEN) * 24) * 10) % 1440;
  $('#hClock').textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
  let i = 0;
  while (i < TINT.length - 2 && p > TINT[i + 1][0]) i++;
  const a = TINT[i], b = TINT[i + 1], k = (p - a[0]) / (b[0] - a[0]);
  const c = a[1].map((v, j) => v + (b[1][j] - v) * k);
  $('#sky').style.background = S.event === 'yagmur'
    ? 'rgba(70, 82, 104, 0.5)'
    : `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`;
}

// =========================================================
// AKŞAM
// =========================================================
function endDay() {
  running = false;
  D.event = S.event;
  setSizzle(0);
  const st = D.st, r = rent(S.day);
  const notes = [];

  let stale = 0;
  for (const id in STOCK) if (STOCK[id].spoils && S.stock[id] > 0) { stale += S.stock[id]; S.stock[id] = 0; }
  if (stale) notes.push(`🥯 ${stale} simit bayatladı, martılara gitti.`);
  if (st.perfect) notes.push(`👌 ${st.perfect} ürünü tam kıvamında çıkardın.`);
  if (st.burnt) notes.push(`🔥 ${st.burnt} ürün yandı.`);
  if (st.lost) notes.push(`😤 ${st.lost} müşteri beklemekten sıkılıp gitti.`);
  if (st.sent) notes.push(`✋ ${st.sent} müşteriyi eli boş yolladın.`);
  if (st.stolen) notes.push(`🕊️ Martılar ${st.stolen} simit kaptı.`);
  if (st.bestCombo >= 3) notes.push(`🔥 En uzun seri: ${st.bestCombo} müşteri.`);
  if (!st.lost && st.served > 0) notes.push('👏 Kimseyi küstürmedin. Mahalle seni konuşuyor.');
  if (st.regUp.length) notes.push(`♥ ${[...new Set(st.regUp)].join(', ')} artık daha sadık.`);
  if (st.regDown.length) notes.push(`💔 ${[...new Set(st.regDown)].join(', ')} küstü, bir kalp gitti.`);
  if (st.fines) notes.push('🚨 Zabıta yanık ya da bayat ürün buldu.');
  if (st.payBad) notes.push(`💵 Kasada ${st.payBad} müşteri bahşiş bırakmadan gitti.`);

  let reward = 0;
  const goalLines = (S.goals || []).map((g) => {
    const ok = goalOk(g, st);
    if (ok) { reward += g.reward; addRep(0.1); }
    return `<p>${ok ? '✅' : '❌'} ${goalText(g)}${ok ? ` · <b>+${tl(g.reward)}</b>` : ` (${goalProg(g, st)})`}</p>`;
  });
  const wage = wages();
  const nightCost = S.night ? NIGHT_COST : 0;
  const got = store(ACH_KEY) || {};
  const fresh = Object.entries(ACH).filter(([id, a]) => !got[id] && a.test(st));
  fresh.forEach(([id]) => { got[id] = true; });
  if (fresh.length) store(ACH_KEY, got);
  const achCash = fresh.length * 100;
  notes.unshift(...fresh.map(([, a]) => `🏅 Başarım açıldı: ${a.name} · +${tl(100)}`));

  const fee = Math.round(st.card * POS_FEE + st.meal * 0.06);
  if (st.cardN) notes.push(`💳 ${st.cardN} müşteri kartla ödedi (${tl(st.card + st.meal)}${st.meal ? `; yemek kartı komisyonu %6` : ''}).`);
  if (st.qrN) notes.push(`📱 ${st.qrN} müşteri QR ile ödedi (komisyonsuz).`);
  if (st.fake) notes.push(`💸 Kontrol etmediğin sahte paralar ${tl(st.fake)} zarar yazdırdı.`);
  if (st.runaway) notes.push(`🏃 Ödemeden kaçanlar: ${tl(st.runaway)}.`);
  // Maliye: fişsiz satış varsa denetimde ceza
  const taxFine = st.fisless && S.day >= 3 && Math.random() < 0.4 ? Math.min(1000, 60 * st.fisless) : 0;
  if (taxFine) notes.push(`🧾 Maliye denetimi: ${st.fisless} fişsiz satış için ceza kesildi. Fiş rulosu almayı unutma.`);
  else if (st.fisless) notes.push(`🧾 ${st.fisless} satışta fiş kesemedin (rulo bitti). Maliye yakalarsa ceza keser.`);
  // Haftalık vergi ve birikim faizi
  S.weekRev = (S.weekRev || 0) + st.rev;
  const tax = S.day % 7 === 0 ? Math.round(S.weekRev * 0.06) : 0;
  if (S.day % 7 === 0) S.weekRev = 0;
  if (S.savings > 0) { const f = Math.round(S.savings * 0.01); S.savings += f; notes.push(`🏦 Birikimine ${tl(f)} faiz işledi (toplam ${tl(S.savings)}).`); }
  if (st.refund) notes.push(`😤 Beğenmeyip iade isteyenler: ${tl(st.refund)}.`);
  if (st.packs) notes.push(`📦 ${st.packs} paket siparişi teslim ettin.`);
  // Komşular: berber övgüsü itibar getirir; ilgilenmezsen 4 günde bir kalp gider
  if (nbH('berber')) addRep(0.02 * nbH('berber'));
  if (S.day % 4 === 0) for (const id in S.nb) if ((S.nbDay[id] || 0) < S.day - 2 && S.nb[id] > 0) { S.nb[id]--; notes.push(`${NB[id].emoji} ${NB[id].name} ile aran soğudu, bir kalp gitti.`); }
  // Şube geliri ve mevsim ödülü
  const fr = franchise();
  S.seasonServed = (S.seasonServed || 0) + st.served;
  let prize = 0;
  if (S.day % 7 === 0) {
    if (S.rep >= 4.5 && S.seasonServed >= 110) { prize = 1000; S.trophies = (S.trophies || 0) + 1; notes.unshift(`🏆 ${season().name} mevsiminin en iyi büfesi seçildin! Ödül ${tl(prize)}.`); }
    else notes.push(`🏆 Mevsim ödülü kaçtı: itibar ${S.rep.toFixed(1)}/4.5, müşteri ${S.seasonServed}/110.`);
    S.seasonServed = 0;
  }
  const inst = S.loan ? Math.min(S.loan.pay, S.loan.left) : 0;
  if (inst) { S.loan.left -= inst; if (S.loan.left <= 0) { S.loan = null; notes.push('🏦 Banka borcun bitti.'); } }

  const extraCost = inst + fee + taxFine + tax;
  S.cash += reward + achCash + fr + prize - r - wage - nightCost - extraCost;
  const net = st.rev + st.tips + reward + achCash + fr + prize - S.spent.goods - r - wage - nightCost - st.fines - st.fake - extraCost;
  const dRep = S.rep - D.repStart;

  const line = (k, v, cls = '') => `<div class="line ${cls}"><span>${k}</span><b>${v}</b></div>`;
  $('#sTitle').textContent = `Gün ${S.day} Sonu`;
  $('#sTable').innerHTML =
    line(`Satış (${st.served} müşteri)`, '+' + tl(st.rev), 'pos') +
    line('Bahşiş', '+' + tl(st.tips), 'pos') +
    (reward ? line('Görev ödülü', '+' + tl(reward), 'pos') : '') +
    (achCash ? line('Başarım ödülü', '+' + tl(achCash), 'pos') : '') +
    (fr ? line('Şube geliri', '+' + tl(fr), 'pos') : '') +
    (prize ? line('Mevsim ödülü', '+' + tl(prize), 'pos') : '') +
    line('Mal alımı', '−' + tl(S.spent.goods), 'neg') +
    line('Kira', '−' + tl(r), 'neg') +
    (wage ? line('Personel yevmiyesi', '−' + tl(wage), 'neg') : '') +
    (nightCost ? line('Gece elektriği', '−' + tl(nightCost), 'neg') : '') +
    (st.fines ? line('Zabıta cezası', '−' + tl(st.fines), 'neg') : '') +
    (fee ? line('POS komisyonu', '−' + tl(fee), 'neg') : '') +
    (st.fake ? line('Sahte para', '−' + tl(st.fake), 'neg') : '') +
    (taxFine ? line('Maliye cezası', '−' + tl(taxFine), 'neg') : '') +
    (tax ? line('Haftalık vergi (%6)', '−' + tl(tax), 'neg') : '') +
    (inst ? line('Kredi taksiti', '−' + tl(inst), 'neg') : '') +
    (S.spent.invest ? line('Yatırım', '−' + tl(S.spent.invest), 'neg') : '') +
    line('Günün kârı', (net >= 0 ? '+' : '−') + tl(Math.abs(net)), 'total ' + (net >= 0 ? 'pos' : 'neg')) +
    line('Kasa', tl(S.cash)) +
    line('İtibar', `★ ${S.rep.toFixed(1)} (${dRep >= 0 ? '+' : ''}${dRep.toFixed(2)})`);

  D.pending = { notes, goalLines };
  if (S.cash < 0) {
    // Kasa ekside: banka limiti yetiyorsa krediyle devam edilebilir
    const need = Math.ceil((-S.cash + 300) / 500) * 500;
    const ok = loanRoom() >= need;
    if (!ok) store(SAVE_KEY, null);
    $('#gTitle').textContent = ok ? 'Kasa Ekside 😿' : 'Kepenk İndi 😿';
    $('#gText').innerHTML = `<p>Gün ${S.day} akşamı ödemeleri karşılayamadın. Kasa: <b>${tl(S.cash)}</b></p>` +
      (ok ? `<p>Banka sana güveniyor: <b>${tl(need)}</b> kredi çekip devam edebilirsin. ${LOAN_DAYS} günde toplam ${tl(need * (1 + LOAN_RATE))} geri ödersin.</p>`
          : `<p>Banka da kredi vermiyor. Toplam ${S.total.served} müşteriye hizmet verdin. Kadıköy seni unutmayacak… belki.</p>`);
    const b = $('#btnRescue');
    b.hidden = !ok;
    b.textContent = `Kredi çek (${tl(need)}) ve devam et`;
    b.onclick = () => { takeLoan(need); D.pending.notes.unshift(`🏦 ${tl(need)} kredi çektin; kasa şimdi ${tl(S.cash)}.`); closeDay(); };
    show('gameover');
    return;
  }
  closeDay();
}

// Gün sonu kartı: tuvale çizilir, paylaşılır ya da indirilir
function shareDay() {
  const st = D.st, day = S.day - 1, W = 1080, H = 1350;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1f2456'); g.addColorStop(1, '#4a3a6e');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const aw = AWNS[S.style.awn].c;
  for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? '#fff' : aw; x.fillRect(i * 90, 0, 90, 150); x.beginPath(); x.arc(i * 90 + 45, 150, 45, 0, Math.PI); x.fill(); }
  x.textAlign = 'center'; x.fillStyle = '#ffc93c'; x.font = '900 120px system-ui, sans-serif';
  x.fillText(S.style.sign || 'BÜFE', W / 2, 360);
  x.fillStyle = '#fff'; x.font = '700 46px system-ui, sans-serif';
  x.fillText(`Kadıköy · Gün ${day} · ${EVENTS[D.event] ? EVENTS[D.event].name : ''}`, W / 2, 430);
  const rows = [['Müşteri', st.served], ['Ciro', tl(st.rev)], ['Bahşiş', tl(st.tips)], ['Kıvamında', st.perfect], ['En uzun seri', st.bestCombo], ['Kasa', tl(S.cash)], ['İtibar', '★ ' + S.rep.toFixed(1)]];
  x.fillStyle = 'rgba(255,255,255,.96)'; x.beginPath(); x.roundRect(90, 500, W - 180, rows.length * 84 + 60, 40); x.fill();
  rows.forEach(([k, v], i) => {
    const y = 590 + i * 84;
    x.textAlign = 'left'; x.fillStyle = '#23262f'; x.font = '700 48px system-ui, sans-serif'; x.fillText(k, 150, y);
    x.textAlign = 'right'; x.fillStyle = '#2a9d5c'; x.font = '900 52px system-ui, sans-serif'; x.fillText(String(v), W - 150, y);
  });
  const img = new Image();
  img.onload = () => {
    const w = 300, hgt = w * img.height / img.width;
    x.drawImage(img, W / 2 - w / 2, 1180 - hgt / 2, w, hgt);
    x.textAlign = 'center'; x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '700 34px system-ui, sans-serif';
    x.fillText(S.custom ? `İmza tostum: ${S.custom.name}` : 'Kadıköy Büfe', W / 2, 1320);
    cv.toBlob(async (blob) => {
      const file = new File([blob], `kadikoy-bufe-gun-${day}.png`, { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) return await navigator.share({ files: [file], title: 'Kadıköy Büfe' });
      } catch (e) { if (e.name === 'AbortError') return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    });
  };
  img.src = `art/${S.custom && DISHES.ozel ? DISHES.ozel.art : 'kasarli'}.png`;
}

// Günü kapat: notları yaz, ertesi güne geç
function closeDay() {
  const { notes, goalLines } = D.pending;
  if (S.day === 7) {
    const sc = (store(SCORES_KEY) || []).concat({ cash: S.cash, diff: S.diff || 'normal', date: new Date().toLocaleDateString('tr-TR') }).sort((a, b) => b.cash - a.cash).slice(0, 5);
    store(SCORES_KEY, sc);
    const best = store(BEST_KEY) || 0;
    if (S.cash > best) store(BEST_KEY, S.cash);
    notes.unshift(`🏆 İlk haftayı çıkardın! Kasa: ${tl(S.cash)}${S.cash > best ? ' — yeni rekor!' : ''}`);
  }
  $('#sGoals').innerHTML = '<b>Görevler</b>' + goalLines.join('');
  $('#sNotes').innerHTML = notes.map((n) => `<p>${n}</p>`).join('') || '<p>Sakin bir gündü.</p>';

  S.tut = true;
  S.notice = null;
  S.prep = 0; S.prepDone = false;
  S.day++;
  S.event = pickEvent(S.day);
  S.rival = S.day >= 4 && Math.random() < 0.4 ? Object.keys(RIVAL)[Math.floor(Math.random() * 3)] : null;
  S.campaign = false;
  S.spent = { goods: 0, invest: 0 };
  store(SAVE_KEY, S);
  show('summary');
}


// =========================================================
// Bağlantılar
// =========================================================
function setPaused(v) {
  if (!running) return;
  if (v) { pourEnd(); setSizzle(0); D.hot = -1; }
  setRainSound(!v && fx.mode === 'rain');
  paused = v; $('#pause').hidden = !v;
  if (v) $('#pGoals').innerHTML = S.goals.map((g) => `<p>${goalOk(g, D.st) ? '✅' : '🎯'} ${goalText(g)} <span class="muted">(${goalProg(g, D.st)})</span></p>`).join('');
  lastT = performance.now();
}
function paintMute() {
  $('#btnMute').textContent = 'Ses: ' + (muted ? 'Kapalı' : 'Açık');
  $('#btnMusic').textContent = 'Müzik: ' + (musicOn ? 'Açık' : 'Kapalı');
}

$('#btnNew').onclick = () => { S = newGame(); enterGame(); };
$('#btnAch').onclick = () => {
  const got = store(ACH_KEY) || {};
  const sc = store(SCORES_KEY) || [];
  $('#achList').innerHTML = (sc.length ? '<p class="got"><b>🏆 En iyi ilk haftalar (bu cihaz)</b>' + sc.map((x, i) => `<span>${i + 1}. ${tl(x.cash)} · ${DIFF[x.diff] ? DIFF[x.diff].name : ''} · ${x.date}</span>`).join('') + '</p>' : '') + Object.entries(ACH).map(([id, a]) => `<p class="${got[id] ? 'got' : ''}">${got[id] ? '🏅' : '🔒'} <b>${a.name}</b><span>${a.desc}</span></p>`).join('');
  $('#achv').hidden = false;
};
$('#btnSet').onclick = openSettings;
$('#btnSet2').onclick = openSettings;
$('#btnSetClose').onclick = () => { $('#settings').hidden = true; };
$('#visBtn').onclick = visitAct;
$('#btnAchClose').onclick = () => { $('#achv').hidden = true; };
$('#btnContinue').onclick = () => {
  const save = store(SAVE_KEY);
  if (!save) return;
  S = Object.assign(newGame(), save);
  S.stock = Object.assign(newGame().stock, save.stock);
  S.total = Object.assign({ served: 0, cats: 0 }, save.total);
  S.style = Object.assign(newGame().style, save.style);
  if (save.staff) S.crew.garson = true;   // eski kayıttaki çırak artık garson
  enterGame();
};
$('#hubScene').onclick = (e) => {
  const g = e.target.closest('[data-go]');
  if (!g || entering) return;
  if (g.dataset.go === 'market') goMarket();
  else if (g.dataset.go === 'bank') openBank();
  else tryEnter();
};
function goMarket() { renderMorning(); show('morning'); $('.m-scroll').scrollTop = 0; }
$('#btnPrep').onclick = openPrep;
$('#prepTap').addEventListener('pointerdown', (e) => { e.preventDefault(); prepTap(); });
$('#mgL').addEventListener('pointerdown', (e) => { e.preventDefault(); prepTap('L'); });
$('#mgR').addEventListener('pointerdown', (e) => { e.preventDefault(); prepTap('R'); });
$('#btnShare').onclick = shareDay;
$('#btnPrepDone').onclick = () => { $('#prep').hidden = true; renderHub(); };
$('#btnBankClose').onclick = () => { $('#bank').hidden = true; };
$('#btnWarnGo').onclick = () => { $('#warn').hidden = true; goMarket(); };
$('#btnWarnOpen').onclick = () => { $('#warn').hidden = true; enterShop(); };
$('#btnBack').onclick = renderHub;
$('#btnNext').onclick = startMorning;
$('#btnRestart').onclick = () => { S = newGame(); enterGame(); };
$('#btnPause').onclick = () => setPaused(true);
$('#btnResume').onclick = () => setPaused(false);
$('#btnQuit').onclick = () => { running = false; renderTitle(); };
$('#btnMute').onclick = () => { muted = !muted; store('kadikoy-bufe-mute', muted); paintMute(); };
$('#btnMusic').onclick = () => { musicOn = !musicOn; store('kadikoy-bufe-music', musicOn); paintMute(); };
$('#board').onclick = tapBoard;
$('#trash').onclick = clearBoard;
$('#sponge').onclick = cleanUp;
makeDraggable($('#board'), () => (D.plate ? { kind: 'plate', dish: D.plate.dish, html: plateHTML(D.plate) } : D.board.length ? { kind: 'board', dish: boardDish(), html: stackHTML(D.board, boardDish()) } : null));
$('#sauceK').onclick = () => addSauce('k');
$('#sauceM').onclick = () => addSauce('m');
// POS tuş takımı
['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].forEach((k) => {
  const b = h('button', 'pk' + (k === '✓' ? ' ok' : k === 'C' ? ' del' : ''), k === 'C' ? '⌫' : k);
  b.onclick = () => (k === '✓' ? posEnter() : posKey(k));
  $('#posKeys').append(b);
});
$('#posX').onclick = posClose;
$('#cat').onclick = tapCat;
$('#gull').onclick = tapGull;
document.addEventListener('visibilitychange', () => { if (document.hidden && running) setPaused(true); });

prefs = Object.assign(prefs, store(PREFS_KEY) || {});
if (!DIFF[prefs.diff]) prefs.diff = 'normal';
applyPrefs();
paintMute();
renderTitle();

// Telefona kurulabilir sürüm: çevrimdışı da açılır
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
// Tarayıcılar sesi ilk dokunuşa kadar bekletir
document.addEventListener('pointerdown', () => { if (actx && actx.state === 'suspended') actx.resume(); });
