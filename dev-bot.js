// Geçici test oyuncusu (oyuna dahil değil)
function botAct() {
  const pc = D.customers.find((c) => c.pay && !c.leaving && (c.pay.run || c.pay.age > 0.8));
  if (D.pos) {
    if (D.pos.stage === 'amount') { for (const ch of String(D.pos.c.pay.total)) posKey(ch); posEnter(); return 1; }
    if (D.pos.stage === 'retry') { posEnter(); return 1; }
  }
  if (pc && !S.crew.kasiyer) {
    if (pc.pay.card) { if (D.pos) return 0; posOpen(pc); return 1; }
    if (pc.pay.qr) { if (!pc.pay.qrT) pc.el.querySelector('.chg').click(); return 0; }
    const chk = pc.el.querySelector('.chg.chk');
    if (chk) { chk.click(); return 1; }
    (pc.el.querySelector('.chg[data-ok="1"]') || pc.el.querySelector('.chg')).click(); return 1;
  }
  for (const s of D.slots) if (s.state === 'press' || s.state === 'burnt') { tapSlot(D.slots.indexOf(s)); return 1; }
  if (D.fryer && D.fryer.state === 'burnt') { tapFryer(); return 1; }
  if (!$('#cat').hidden) { tapCat(); return 1; }
  if (!$('#gull').hidden) { tapGull(); return 1; }
  const open = [];
  for (const c of D.customers) if (!c.leaving && !c.pay) for (const o of c.order) if (!o.done) open.push(o);
  if (D.plate) {
    const p = D.plate, w = open.filter((o) => o.item === p.dish);
    if (!w.length) { clearBoard(); return 1; }
    if (needsCut(p.dish) && !p.cut) { tapBoard(); return 1; }
    if (SAUCED.includes(p.dish)) {
      const t = w.find((o) => [...p.sauce].every((x) => o.sauce.includes(x)));
      if (!t) { clearBoard(); return 1; }
      const miss = [...t.sauce].find((x) => !p.sauce.includes(x));
      if (miss) { addSauce(miss); return 1; }
    }
    tapBoard(); return 1;
  }
  if (D.board.length && !open.some((o) => DISHES[o.item].recipe && D.board.every((x) => DISHES[o.item].recipe.includes(x)) && !D.slots.some((s) => s.dish === o.item && s.state !== 'empty' && s.state !== 'burnt'))) { clearBoard(); return 1; }
  for (const o of open) {
    const id = o.item, d = DISHES[id];
    if (d.kind === 'ready') { if (S.stock[id] > 0) { tapProduct(id); return 1; } continue; }
    if (d.kind === 'pour') {
      if (S.stock[id] <= 0 || D.demT) continue;
      pourStart(id);
      if (D.pour.on) { D.pour.v = 0.6 + Math.random() * 0.45; pourEnd(); }
      return 1;
    }
    if (d.kind === 'squeeze') { if (D.sq.ready || D.sq.v > 0 || S.stock.portakal >= 2) { tapSqueeze(); return 1; } continue; }
    if (d.cook) {
      const want = o.well ? 'over' : 'ready';
      const i = D.slots.findIndex((s) => s.dish === id && (s.state === want || s.state === 'over'));
      if (i >= 0) { if (needsPlate(id) && D.board.length) { clearBoard(); return 1; } tapSlot(i); return 1; }
      if (D.slots.some((s) => s.dish === id && s.state !== 'empty' && s.state !== 'burnt')) continue;
      if (boardDish() === id) { if (D.slots.some((s) => s.state === 'empty')) { tapBoard(); return 1; } continue; }
      if (D.board.length && !D.board.every((x) => d.recipe.includes(x))) continue;
      const need = d.recipe.filter((x) => x !== o.no).find((x) => !D.board.includes(x));
      const use = need === 'ekmek' && o.bread && S.stock[o.bread] > 0 ? o.bread : need;
      if (need && S.stock[use] > 0 && !boardReject(need)) { tapIng(use); return 1; }
      continue;
    }
    const st = id === 'patso'
      ? { ready: D.fryer.state === 'ready', busy: D.fryer.state === 'fry', take: tapFryer, start: () => { if (S.stock.patates > 0 && D.fryer.state === 'empty') { tapIng('patates'); return 1; } return 0; } }
      : { ready: D.doner.ready, busy: false, take: tapDoner, start: () => { if (D.doner.v > 0 || S.stock.doner > 0) { tapDoner(); return 1; } return 0; } };
    if (st.ready) { if (!D.board.length) { if (S.stock.sandvic > 0) { tapIng('sandvic'); return 1; } } else if (D.board.join() === 'sandvic') { st.take(); return 1; } continue; }
    if (!st.busy && st.start()) return 1;
  }
  return 0;
}
function botDay(every = 11) {
  startDay(); setPaused(false);
  let g = 0; const sold = {};
  while (running && g++ < 9000) {
    if (g % every === 0) botAct();
    for (const c of D.customers) for (const o of c.order) if (o.done) sold[o.item] = 1;
    tick(0.05);
  }
  const st = D.st;
  return { day: S.day - 1, served: st.served, lost: st.lost, rev: st.rev, tips: st.tips, perfect: st.perfect, burnt: st.burnt, fines: st.fines, regUp: st.regUp.length, regDown: st.regDown.length, cash: S.cash, rep: +S.rep.toFixed(2), sold: Object.keys(sold).length, screen: document.querySelector('.screen.active').id };
}
function botWeek(days = 7, ups = ['sucuk', 'fritoz', 'dolap', 'semaver', 'cezve', 'doner', 'kasap', 'grill2', 'sikacak']) {
  const out = [];
  for (let d = 0; d < days; d++) {
    if (d > 0) {
      $('#btnNext').click(); renderMorning();
      for (const u of ups) if (!S.up[u] && S.cash > UPGRADES[u].cost + 1300) { S.cash -= UPGRADES[u].cost; S.up[u] = true; break; }
      for (const id of Object.keys(STOCK).filter(stockOpen)) buy(id, Math.max(0, (id === 'fis' ? 40 : 12) - S.stock[id]));
      if (S.coins < 8) S.coins = 20;
    }
    out.push(botDay());
    if (document.querySelector('.screen.active').id === 'gameover') break;
  }
  return out;
}

// ---- Denge ölçümü: tohumlu, tedbirli bir oyuncu (kepengi kilitler, tahmine göre mal alır) ----
// every: iki hamle arası tik (11 ≈ 0,55 sn hızlı · 22 ≈ 1,1 sn orta · 44 ≈ 2,2 sn yavaş)
const rng32 = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function smartBuy() {
  const ev = EVENTS[S.event];
  const crowd = ev.spawn * POLICY[S.policy].spawn * LOCS[S.loc].spawn * season().spawn * (S.up.tabela ? 1.15 : 1);
  const est = Math.min(nSlots() * 13, Math.round(dayLen() / ((7.6 - S.rep * 0.7) / crowd) * 0.8));
  const ids = menu().filter((id) => !S.menuOff[id]);
  const W = ids.map((id) => DISHES[id].w * (ev.w[id] || 1) * (season().w[id] || 1));
  const sum = W.reduce((a, b) => a + b, 0), need = {};
  ids.forEach((id, i) => {
    const q = est * 1.7 * W[i] / sum, d = DISHES[id];
    if (d.recipe) d.recipe.forEach((x) => { need[x] = (need[x] || 0) + q; });
    else if (d.kind === 'squeeze') need.portakal = (need.portakal || 0) + 2 * q;
    else need[id] = (need[id] || 0) + q;
  });
  for (const id in need) if (STOCK[id] && stockOpen(id)) buy(id, Math.max(0, Math.min(capOf(id), Math.ceil(need[id] * 1.25) + 1) - S.stock[id]));
  buy('fis', Math.max(0, est + 10 - S.stock.fis));
}
// Dönen: iflas günü (0 = ayakta), kurtarma kredisi sayısı, haftalık ortalamalar (op = kira öncesi günlük kazanç)
function botSeason(every = 22, days = 30, seed = 1, o = {}) {
  const ups = o.ups || ['sucuk', 'semaver', 'dolap', 'grill2', 'fritoz', 'tente', 'kamera', 'pos', 'tabela', 'kasap', 'vitrin', 'doner', 'cezve', 'sikacak'];
  const keep = { diff: prefs.diff, real: prefs.real, rnd: Math.random };
  prefs.diff = o.diff || 'normal'; prefs.real = false; Math.random = rng32(seed);
  S = newGame(); S.notice = null; if (o.story) S.story = { paid: 0, seen: {} };
  startMorning();
  const out = []; let loans = 0, dead = 0;
  for (let d = 1; d <= days; d++) {
    if (d > 1) { S.locked = true; $('#btnNext').click(); }
    for (const el of document.querySelectorAll('.overlay:not([hidden])')) el.hidden = true;
    renderMorning();
    const cm = S.cash; let spent = 0;
    for (const u of ups) if (!S.up[u] && S.cash > UPGRADES[u].cost + rent(S.day) + 600) { S.cash -= UPGRADES[u].cost; S.up[u] = true; spent += UPGRADES[u].cost; break; }
    if (S.story && !S.story.done) { const a = Math.min(storyLeft(), Math.floor((S.cash - rent(S.day) - 800) / 100) * 100); if (a > 0) { S.cash -= a; S.story.paid += a; spent += a; } }
    smartBuy();
    if (S.coins < 8) S.coins = 20;
    const r = rent(S.day), inst = S.loan ? Math.min(S.loan.pay, S.loan.left) : 0;
    const res = botDay(every);
    out.push({ d, r, rev: res.rev, op: S.cash - cm + spent + r + inst, cash: Math.round(S.cash), served: res.served });
    if (document.querySelector('.screen.active').id === 'gameover') {
      if (!$('#btnRescue').hidden) { $('#btnRescue').click(); loans++; } else { dead = d; break; }
    }
  }
  Math.random = keep.rnd; prefs.diff = keep.diff; prefs.real = keep.real;
  const avg = (w, k) => { const x = out.filter((e) => Math.ceil(e.d / 7) === w); return x.length ? Math.round(x.reduce((s, e) => s + e[k], 0) / x.length) : null; };
  const weeks = [...new Set(out.map((e) => Math.ceil(e.d / 7)))];
  return { every, seed, dead, loans, ups: Object.keys(S.up).length, story: S.story ? S.story.paid : null, cash: out[out.length - 1].cash, op: weeks.map((w) => avg(w, 'op')), rent: weeks.map((w) => avg(w, 'r')), served: weeks.map((w) => avg(w, 'served')) };
}
