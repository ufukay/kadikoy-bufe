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
      const need = d.recipe.find((x) => !D.board.includes(x));
      if (need && S.stock[need] > 0 && !boardReject(need)) { tapIng(need); return 1; }
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
