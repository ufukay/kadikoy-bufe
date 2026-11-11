// Geçici düzen denetimi (oyuna dahil değil): dokunulabilir öğelerin çakışmasını ve ekrandan taşmasını ölçer
function auditOverlap(label) {
  const app = document.querySelector('#app').getBoundingClientRect();
  const scr = document.querySelector('.screen.active');
  const els = [...scr.querySelectorAll('button, .cust .bubble, .visitor, .banner.show, .combo, .coach')].filter((e) => {
    if (e.closest('[hidden]')) return false;
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  });
  const name = (e) => (e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ').slice(0, 2).join('.') + (e.textContent ? '"' + e.textContent.trim().slice(0, 12) + '"' : '');
  const out = [];
  for (let i = 0; i < els.length; i++) {
    const a = els[i], ra = a.getBoundingClientRect();
    if (ra.right > app.right + 1 || ra.left < app.left - 1 || ra.bottom > app.bottom + 1) out.push(`TAŞMA ${name(a)} [${Math.round(ra.left)},${Math.round(ra.top)},${Math.round(ra.right)},${Math.round(ra.bottom)}] ekran ${Math.round(app.right)}x${Math.round(app.bottom)}`);
    for (let j = i + 1; j < els.length; j++) {
      const b = els[j];
      if (a.contains(b) || b.contains(a)) continue;
      if (a.closest('.boardwrap') && b.closest('.boardwrap')) continue;   // tezgâh köşe düğmeleri bilerek üstünde
      if ([a, b].some((e) => getComputedStyle(e).pointerEvents === 'none')) continue;   // dokunulmayan geçici yazılar
      const rb = b.getBoundingClientRect();
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (w > 5 && h > 5) out.push(`ÇAKIŞMA ${name(a)} × ${name(b)} ${Math.round(w)}x${Math.round(h)}px`);
    }
  }
  return { label, n: els.length, issues: out };
}
