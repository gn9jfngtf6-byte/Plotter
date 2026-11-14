// ═══════════════════════════════════════════════════════════════════
// 123_invest.js — Investitionsrechnung (Thema aus dem Baukasten 120_kit.js)
//
// Ivr: Rechenkern ohne DOM (Barwert, Kapitalwert, interner Zinssatz, Amortisation, Annuität,
// Rechenwege). Eine Investition besteht aus der Auszahlung I₀ heute und den Rückflüssen am
// Ende der Jahre 1 … n (höchstens 8). Beträge in ganzen Franken.
// ═══════════════════════════════════════════════════════════════════
const Ivr = (function () {
  const NMAX = 8;
  const q = i => 1 + i / 100;
  const pv = (c, t, i) => c / Math.pow(q(i), t);
  const npv = (I0, cf, i) => cf.reduce((s, c, k) => s + pv(c, k + 1, i), -I0);
  // erster Zinssatz in [0 %, 100 %], bei dem der Kapitalwert das Vorzeichen wechselt (Bisektion); null, wenn es keinen gibt
  function irr(I0, cf) {
    let a = 0, fa = npv(I0, cf, 0); if (!I0 && !cf.some(c => c)) return null; if (fa === 0) return 0;
    for (let b = 0.5; b <= 100 + 1e-9; b += 0.5) {
      const fb = npv(I0, cf, b);
      if (fa * fb <= 0) { let x = a, y = b, fx = fa; for (let k = 0; k < 60; k++) { const m = (x + y) / 2, fm = npv(I0, cf, m); if (fx * fm <= 0) y = m; else { x = m; fx = fm; } } return (x + y) / 2; }
      a = b; fa = fb;
    }
    return null;
  }
  const cum = (I0, cf, i) => { const o = [-I0]; cf.forEach((c, k) => o.push(o[k] + pv(c, k + 1, i))); return o; };   // aufsummierte (abgezinste) Zahlungen
  // Amortisationszeit: erster Übergang von negativ zu nicht negativ, im Jahr linear interpoliert
  function payback(cu) { if (cu[0] >= 0) return 0; for (let t = 1; t < cu.length; t++) if (cu[t - 1] < 0 && cu[t] >= 0) return t - 1 + (-cu[t - 1]) / (cu[t] - cu[t - 1]); return null; }
  const annuity = (K, i, n) => (i ? K * Math.pow(q(i), n) * (q(i) - 1) / (Math.pow(q(i), n) - 1) : K / n);
  // Zinssatz, bei dem zwei Investitionen denselben Kapitalwert haben (interner Zinssatz der Differenz)
  function cross(IA, cfA, IB, cfB) { const n = Math.max(cfA.length, cfB.length), d = []; for (let k = 0; k < n; k++) d.push((cfA[k] || 0) - (cfB[k] || 0)); return d.some(v => v) || IA !== IB ? irr(IA - IB, d) : null; }
  const cfOk = a => (Array.isArray(a) ? a.filter(v => Number.isFinite(Number(v))).slice(0, NMAX).map(v => Math.max(-1e7, Math.min(1e7, Math.round(Number(v))))) : []);
  // Formelsatz
  const M = v => (typeof finRMr === 'function' ? finRMr(Math.round(v) + 0) : String(Math.round(v)));
  const sM = v => (v < 0 ? '-' : '+') + M(Math.abs(v));
  const F = (v, d) => { const s = String(parseFloat((+v).toFixed(d === undefined ? 2 : d))); return s === '-0' ? '0' : s; };
  const pc = (v, d) => F(v, d) + '\\,\\%';

  // ── Rechenwege ──
  const mk = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  function docNpv(P) {
    const B = mk(), n = P.cf.length, K = npv(P.I0, P.cf, P.i), qq = q(P.i);
    B.p('**Abzinsen:** Geld, das erst in $t$ Jahren fliesst, ist heute weniger wert. Jede Zahlung wird darum durch $q^t$ geteilt, mit dem Zinsfaktor $q=1+\\frac{i}{100}$.');
    B.e('q=1+\\frac{' + F(P.i) + '}{100}=' + F(qq, 4), 'b');
    P.cf.forEach((c, k) => B.e('t=' + (k + 1) + ':\\quad\\frac{' + M(c) + '}{' + F(qq, 4) + '^{' + (k + 1) + '}}=' + M(pv(c, k + 1, P.i)), c < 0 ? 'r' : 'g'));
    B.p('**Kapitalwert:** die Summe aller Barwerte, vermindert um die Investition.');
    const terms = P.cf.map((c, k) => sM(pv(c, k + 1, P.i)));
    B.e('K_0=-' + M(P.I0) + terms.slice(0, 3).join(''), 'v'); if (terms.length > 3) B.e('\\qquad' + terms.slice(3, 7).join(''), 'v'); if (terms.length > 7) B.e('\\qquad' + terms.slice(7).join(''), 'v');
    B.e('K_0=' + M(K), 'v');
    B.p('**Entscheid:** Ein positiver Kapitalwert heisst, dass die Investition mehr einbringt als eine Anlage zum Kalkulationszinssatz.');
    if (n) { B.p('**Annuität:** der Kapitalwert, umgerechnet in einen gleich hohen Betrag am Ende jedes Jahres.'); B.e(P.i ? 'A=K_0\\cdot\\frac{q^n\\cdot(q-1)}{q^n-1}=' + M(K) + '\\cdot\\frac{' + F(qq, 4) + '^{' + n + '}\\cdot ' + F(qq - 1, 4) + '}{' + F(qq, 4) + '^{' + n + '}-1}=' + M(annuity(K, P.i, n)) : 'A=\\frac{K_0}{n}=\\frac{' + M(K) + '}{' + n + '}=' + M(K / n), 'o'); }
    B.res(Math.round(K) > 0 ? 'Kapitalwert $K_0=' + M(K) + '$ CHF: Die Investition lohnt sich' : Math.round(K) < 0 ? 'Kapitalwert $K_0=' + M(K) + '$ CHF: Die Investition lohnt sich nicht' : 'Kapitalwert $K_0=0$: Die Investition bringt genau die verlangte Verzinsung');
    return { title: 'Kapitalwert', st: B.st };
  }
  function docIrr(P) {
    const B = mk(), r = irr(P.I0, P.cf);
    B.p('**Interner Zinssatz:** der Zinssatz, bei dem der Kapitalwert genau 0 ist. Er gibt an, zu wie viel Prozent sich das eingesetzte Kapital verzinst.');
    B.e('K_0(i)=-I_0+\\frac{C_1}{q}+\\frac{C_2}{q^2}+\\dots+\\frac{C_n}{q^n}=0', 'b');
    if (r === null) { B.note('Zwischen $0\\,\\%$ und $100\\,\\%$ wechselt der Kapitalwert sein Vorzeichen nicht: Es gibt dort keinen internen Zinssatz.'); B.res(npv(P.I0, P.cf, 0) > 0 ? 'Der Kapitalwert ist bei jedem Zinssatz positiv' : npv(P.I0, P.cf, 0) < 0 ? 'Der Kapitalwert ist bei jedem Zinssatz negativ' : 'Der Kapitalwert ist bei jedem Zinssatz null'); return { title: 'Interner Zinssatz', st: B.st }; }
    const i1 = Math.abs(r - Math.round(r)) < 1e-6 ? Math.max(0, Math.round(r) - 1) : Math.floor(r), i2 = Math.abs(r - Math.round(r)) < 1e-6 ? Math.round(r) + 1 : Math.ceil(r), K1 = npv(P.I0, P.cf, i1), K2 = npv(P.I0, P.cf, i2);
    B.p('**Probieren:** Die Gleichung lässt sich meist nicht nach $i$ auflösen. Man sucht zwei Zinssätze, zwischen denen der Kapitalwert das Vorzeichen wechselt.');
    B.e('K_0(' + pc(i1) + ')=' + M(K1) + ',\\qquad K_0(' + pc(i2) + ')=' + M(K2), 'g');
    B.p('**Linear interpolieren:** Zwischen den beiden Punkten wird die Kurve durch eine Gerade ersetzt.');
    B.e('i^*\\approx i_1+\\frac{K_1}{K_1-K_2}\\cdot(i_2-i_1)=' + F(i1) + '+\\frac{' + M(K1) + '}{' + M(K1) + sM(-K2) + '}\\cdot ' + F(i2 - i1) + '\\approx ' + pc(i1 + K1 / (K1 - K2) * (i2 - i1)), 'r');
    B.note('Genauer Wert (mit weiteren Schritten): $i^*\\approx ' + pc(r, 3) + '$.');
    B.p('**Entscheid:** Liegt der interne Zinssatz über dem Kalkulationszinssatz, lohnt sich die Investition.');
    B.e('i^*\\approx ' + pc(r) + (r > P.i ? '>' : r < P.i ? '<' : '=') + pc(P.i), 'v');
    B.res('Interner Zinssatz $i^*\\approx ' + pc(r) + '$: Die Investition lohnt sich ' + (r > P.i ? '' : 'nicht ') + 'bei einem Kalkulationszinssatz von $' + pc(P.i) + '$');
    return { title: 'Interner Zinssatz', st: B.st };
  }
  function docPay(P) {
    const B = mk(), cs = cum(P.I0, P.cf, 0), cd = cum(P.I0, P.cf, P.i), ts = payback(cs), td = payback(cd);
    const rows = c => { const L = c.map((v, t) => 't=' + t + ':\\ ' + M(v)); for (let k = 0; k < L.length; k += 3) B.e(L.slice(k, k + 3).join(',\\quad ')); };
    const ipo = (c, T, sc) => { const t = Math.min(c.length - 2, Math.ceil(T - 1e-9) - 1); if (T > 0 && t >= 0 && c[t] < 0) B.e('T=' + t + '+\\frac{' + M(-c[t]) + '}{' + M(c[t + 1] - c[t]) + '}\\approx ' + F(T) + '\\text{ Jahre}', sc); };
    B.p('**Statisch:** Die Zahlungen werden ohne Zins aufsummiert, bis die Investition zurückgeflossen ist.');
    rows(cs);
    if (ts === null) B.note('Die Rückflüsse decken die Investition nicht.'); else { B.p('Im Jahr des Vorzeichenwechsels wird ein gleichmässiger Zufluss angenommen:'); ipo(cs, ts, 'o'); }
    B.p('**Dynamisch:** Dasselbe mit den abgezinsten Zahlungen. Spätere Rückflüsse zählen weniger, darum dauert die Amortisation länger.');
    rows(cd);
    if (td === null) B.note('Mit Zins gerechnet fliesst die Investition in der Laufzeit nicht zurück.'); else ipo(cd, td, 'b');
    B.note('Die Amortisationszeit misst das Risiko, nicht den Gewinn: Zahlungen nach diesem Zeitpunkt werden nicht beachtet.');
    B.res('Amortisationszeit: statisch ' + (ts === null ? 'nie' : '$' + F(ts) + '$ Jahre') + ', dynamisch ' + (td === null ? 'nie' : '$' + F(td) + '$ Jahre'));
    return { title: 'Amortisation', st: B.st };
  }
  function docCmp(P) {
    const B = mk(), KA = npv(P.IA, P.cfA, P.i), KB = npv(P.IB, P.cfB, P.i), rA = irr(P.IA, P.cfA), rB = irr(P.IB, P.cfB), x = cross(P.IA, P.cfA, P.IB, P.cfB);
    B.p('**Kapitalwerte beim Kalkulationszinssatz** $i=' + pc(P.i) + '$:');
    B.e('K_0^A=' + M(KA), 'b'); B.e('K_0^B=' + M(KB), 'g');
    B.p('**Interne Zinssätze:**');
    B.e('i_A^*' + (rA === null ? '\\text{ gibt es nicht}' : '\\approx ' + pc(rA)) + ',\\qquad i_B^*' + (rB === null ? '\\text{ gibt es nicht}' : '\\approx ' + pc(rB)));
    if (x !== null && x > 0) { B.p('**Gleichstand:** Bei diesem Zinssatz haben beide Investitionen denselben Kapitalwert. Darunter ist die eine besser, darüber die andere.'); B.e('i\\approx ' + pc(x) + ':\\quad K_0^A=K_0^B\\approx ' + M(npv(P.IA, P.cfA, x)), 'o'); }
    if (rA !== null && rB !== null && Math.round(KA) !== Math.round(KB) && (KA > KB) !== (rA > rB)) B.note('Kapitalwert und interner Zinssatz führen hier zu verschiedenen Rangfolgen. Massgebend ist der Kapitalwert beim eigenen Kalkulationszinssatz.');
    B.p('**Entscheid:** Gewählt wird die Investition mit dem grösseren Kapitalwert, sofern er positiv ist.');
    const best = Math.max(KA, KB);
    B.res(Math.round(best) <= 0 ? 'Bei $i=' + pc(P.i) + '$ lohnt sich keine der beiden Investitionen' : Math.round(KA) === Math.round(KB) ? 'Bei $i=' + pc(P.i) + '$ sind beide Investitionen gleich gut' : 'Bei $i=' + pc(P.i) + '$ ist Investition ' + (KA > KB ? 'A' : 'B') + ' besser');
    return { title: 'Zwei Investitionen vergleichen', st: B.st };
  }
  const doc = (v, P) => ({ npv: docNpv, irr: docIrr, pay: docPay, cmp: docCmp })[v](P);
  return { NMAX, q, pv, npv, irr, cum, payback, annuity, cross, cfOk, M, F, pc, doc };
})();

// ── Bilder ──
function ivrArrowV(S, x, y0, y1, col, lw) {                    // senkrechter Pfeil in Pixeln
  const d = y1 < y0 ? -1 : 1, hl = Math.min(9, Math.abs(y1 - y0) * 0.6);
  if (Math.abs(y1 - y0) < 1.5) { S.circ(x, y0, 3, { fill: col, stroke: col }); return; }
  S.line(x, y0, x, y1 - d * hl * 0.8, { col, lw: lw || 2.6 });
  S.poly([[x, y1], [x - hl * 0.5, y1 - d * hl], [x + hl * 0.5, y1 - d * hl]], { col, fill: col, lw: 1, close: true });
}
function ivrSceneNpv(S, W, H, C) {
  const P = C.P, fs = C.fs, n = P.cf.length, M = Ivr.M, all = [-P.I0].concat(P.cf), pvs = all.map((c, t) => Ivr.pv(c, t, P.i)), K = Ivr.npv(P.I0, P.cf, P.i);
  const xL = fs * 4.2, xR = W - fs * 3.2, X = t => xL + (xR - xL) * t / Math.max(1, n), mx = Math.max.apply(null, all.map(Math.abs).concat([1]));
  const yA = H * 0.2, yB = H * 0.66, LA = H * 0.16, fz = Math.min(fs, (xR - xL) / Math.max(1, n) / 4.6), bw = Math.min(fs * 2.4, (xR - xL) / Math.max(1, n) * 0.42);
  S.text(fs * 0.7, fs * 1.2, 'Zahlungen in CHF', { size: fs * 0.95, col: 'M', al: 'l', bs: 'm', bold: true });
  if (H > fs * 34) S.text(fs * 0.7, yB - LA - fs * 2.6, 'Barwerte: auf heute abgezinst', { size: fs * 0.95, col: 'M', al: 'l', bs: 'm', bold: true });
  S.line(xL - fs, yA, xR + fs * 1.6, yA, { col: 'L', lw: 1.8 }); S.line(xL - fs, yB, xR + fs * 1.6, yB, { col: 'L', lw: 1.2 });
  S.text(xR + fs * 2.9, yA + fs * 1.1, 'Jahr', { size: fs * 0.85, col: 'M', al: 'r', bs: 'm' });
  all.forEach((c, t) => {
    const x = X(t), up = c >= 0, col = up ? ST_G : ST_R, la = LA * Math.abs(c) / mx, lb = LA * Math.abs(pvs[t]) / mx, hot = C.hover === 'y' + t;
    if (hot && !C.exp) S.rect(x - bw * 0.9, fs * 2, bw * 1.8, yB + LA + fs * 2.2 - fs * 2, { fill: ST_V, a: 0.08 });
    S.line(x, yA - 4, x, yA + 4, { col: 'L', lw: 1.4 }); S.text(x + (c < 0 ? fs * 0.9 : 0), yA + (c < 0 ? -1 : 1) * fs * 1.1, String(t), { size: fs * 0.85, col: 'M', al: 'c', bs: 'm', notr: true });
    ivrArrowV(S, x, yA, yA + (up ? -1 : 1) * la, col);
    S.rich(x, yA + (up ? -1 : 1) * (la + fz * 1.0), M(c), { size: fz, col, al: 'c', bs: 'm' });
    shlBox(S, t ? 'pay' : 'I0', x - bw, yA - (up ? la + fz * 1.8 : 0), x + bw, yA + (up ? 0 : la + fz * 1.8));
    if (t) { S.line(x, yA + (up ? fs * 1.9 : la + fz * 1.9), x, yB - (pvs[t] >= 0 ? lb + fz * 1.9 : fs * 0.3) - fz * 1.7, { col: 'M', lw: 1, dash: [3, 4] }); S.rich(x, yB - (pvs[t] >= 0 ? lb + fz * 1.9 : fs * 0.3) - fz * 0.75, '\\div ' + Ivr.F(Ivr.q(P.i), 4) + '^{' + t + '}', { size: fz * 0.85, col: 'M', al: 'c', bs: 'm' }); }
    S.rect(x - bw / 2, pvs[t] >= 0 ? yB - lb : yB, bw, Math.max(1, lb), { fill: col, stroke: col, lw: 1.2, a: 0.3 });
    S.rich(x, yB + (pvs[t] >= 0 ? -1 : 1) * (lb + fz * 0.95), M(pvs[t]), { size: fz, col, al: 'c', bs: 'm', bold: true });
    shlBox(S, 'pv', x - bw, yB - (pvs[t] >= 0 ? lb + fz * 1.8 : 0), x + bw, yB + (pvs[t] >= 0 ? 0 : lb + fz * 1.8));
    if (!C.exp) S.hits.push({ id: 'y' + t, x: x - bw, y: fs * 2, w: bw * 2, h: yB + LA + fs });
  });
  const y0 = yB + LA + fs * 2.4, kc = Math.round(K) > 0 ? 'g' : Math.round(K) < 0 ? 'r' : 'v';
  const yE = difLines(S, { x: fs * 1.2, y: y0, w: W - fs * 2.4, h: Math.max(fs * 3, H - y0 - fs * 0.6) }, [{ s: 'K_0=' + pvs.map((v, t) => (t ? (v < 0 ? '-' : '+') : (v < 0 ? '-' : '')) + M(Math.abs(v))).join('') },
    { s: '\\col{' + kc + '}{K_0=' + M(K) + '\\text{ CHF}}', bold: true, size: 1.25 }], C, { al: 'c', oneCol: true });
  shlBox(S, 'k0', W * 0.2, y0 - 2, W * 0.8, yE + 2);
}
// Kapitalwert in Abhängigkeit vom Zinssatz: gemeinsamer Rahmen für «Interner Zinssatz» und «Vergleichen»
function ivrFrame(S, W, H, C, fns, roots, o) {
  const fs = C.fs, imax = Math.min(100, Math.max(30, Math.ceil(Math.max.apply(null, roots.filter(r => r !== null).concat([0])) * 1.4 / 5) * 5));
  let lo = 0, hi = 0; fns.forEach(f => { for (let k = 0; k <= 60; k++) { const v = f(imax * k / 60); lo = Math.min(lo, v); hi = Math.max(hi, v); } });
  if (hi - lo < 1) hi = lo + 1;
  const pad = (hi - lo) * 0.12;
  return kitFrame(S, { x: fs * 0.4, y: fs * 0.3, w: W - fs * 0.8, h: H - fs * 0.6 }, C, { x0: -imax * 0.03, x1: imax, y0: lo - pad, y1: hi + pad }, Object.assign({ xlab: 'i\\text{ in }\\%', ylab: 'K_0' }, o));
}
function ivrSceneIrr(S, W, H, C) {
  const P = C.P, fs = C.fs, f = i => Ivr.npv(P.I0, P.cf, i), r = Ivr.irr(P.I0, P.cf), K = f(P.i);
  const m = ivrFrame(S, W, H, C, [f], [r], { title: r === null ? '\\col{r}{\\text{kein interner Zinssatz bis }100\\,\\%}' : '\\col{r}{i^*\\approx ' + Ivr.pc(r) + '}', info: '\\col{v}{K_0(' + Ivr.pc(P.i) + ')=' + Ivr.M(K) + '}' });
  difCurve(S, m, f, { colorAt: x => (f(x) >= 0 ? ST_G : ST_R), hl: 'f', exp: C.exp });
  difSeg(S, m, P.i, m.win.y0, P.i, m.win.y1, { col: ST_V, lw: 1.2, dash: [4, 4] });
  if (r !== null) { const q = difDot(S, m, r, 0, { fill: ST_R, r: 5.5 }); if (q) { shlC(S, 'irr', q[0], q[1], 13); difLabel(S, m, q[0] + fs * 2.6, q[1] - fs * 1.1, '\\col{r}{i^*\\approx ' + Ivr.pc(r) + '}', C, {}); } }
  kitDragPt(S, m, C, 'P', P.i, K, { col: ST_V, hl: 'P', step: 0.25 }, x => { P.i = kitClamp(x, 0, 25); });
  if (difInside(m, m.X(P.i), m.Y(K), 2)) difLabel(S, m, m.X(P.i) + fs * 3.4, m.Y(K) - fs * 1.1, '\\col{v}{K_0=' + Ivr.M(K) + '}', C, {});
}
function ivrScenePay(S, W, H, C) {
  const P = C.P, fs = C.fs, n = P.cf.length, cs = Ivr.cum(P.I0, P.cf, 0), cd = Ivr.cum(P.I0, P.cf, P.i), ts = Ivr.payback(cs), td = Ivr.payback(cd), all = cs.concat(cd);
  let lo = Math.min.apply(null, all.concat([0])), hi = Math.max.apply(null, all.concat([0])); if (hi - lo < 1) hi = lo + 1;
  const pad = (hi - lo) * 0.12;
  const m = kitFrame(S, { x: fs * 0.4, y: fs * 0.3, w: W - fs * 0.8, h: H - fs * 0.6 }, C, { x0: -0.25, x1: Math.max(1, n) + 0.3, y0: lo - pad, y1: hi + pad }, { xlab: 't\\text{ in Jahren}', ylab: '\\text{CHF}', xstep: 1,
    title: '\\col{o}{T_{stat}' + (ts === null ? '=\\text{–}' : '\\approx ' + Ivr.F(ts)) + '},\\quad\\col{b}{T_{dyn}' + (td === null ? '=\\text{–}' : '\\approx ' + Ivr.F(td)) + '}' });
  [[cs, ST_O, 'stat'], [cd, ST_B, 'dyn']].forEach(([c, col, id]) => { difPath(S, m, c.map((v, t) => [t, v]), { col, lw: 2.4, hl: id }); c.forEach((v, t) => difDot(S, m, t, v, { fill: col, r: 3.6 })); });
  [[ts, ST_O, 'ts', 'T_{stat}', 1], [td, ST_B, 'td', 'T_{dyn}', -1]].forEach(([T, col, id, lab, sd]) => { if (T === null) return; const q = difDot(S, m, T, 0, { fill: col, stroke: 'W', r: 6 }); if (q) { shlC(S, id, q[0], q[1], 13); difLabel(S, m, q[0], q[1] + sd * fs * 1.25, '\\col{' + (col === ST_O ? 'o' : 'b') + '}{' + lab + '}', C, {}); } });
  const lx = m.L + fs * 1.6, ly = m.T + fs * 1.5;
  S.line(lx, ly, lx + fs * 1.6, ly, { col: ST_O, lw: 3 }); S.text(lx + fs * 2.1, ly, 'ohne Zins (statisch)', { size: fs * 0.9, col: ST_O, al: 'l', bs: 'm' });
  S.line(lx, ly + fs * 1.5, lx + fs * 1.6, ly + fs * 1.5, { col: ST_B, lw: 3 }); S.text(lx + fs * 2.1, ly + fs * 1.5, 'abgezinst (dynamisch)', { size: fs * 0.9, col: ST_B, al: 'l', bs: 'm' });
}
function ivrSceneCmp(S, W, H, C) {
  const P = C.P, fs = C.fs, fA = i => Ivr.npv(P.IA, P.cfA, i), fB = i => Ivr.npv(P.IB, P.cfB, i), rA = Ivr.irr(P.IA, P.cfA), rB = Ivr.irr(P.IB, P.cfB), x = Ivr.cross(P.IA, P.cfA, P.IB, P.cfB), KA = fA(P.i), KB = fB(P.i);
  const m = ivrFrame(S, W, H, C, [fA, fB], [rA, rB, x], { title: '\\col{b}{K_0^A(' + Ivr.pc(P.i) + ')=' + Ivr.M(KA) + '}', info: '\\col{g}{K_0^B(' + Ivr.pc(P.i) + ')=' + Ivr.M(KB) + '}' });
  difSeg(S, m, P.i, m.win.y0, P.i, m.win.y1, { col: ST_V, lw: 1.2, dash: [4, 4] });
  difCurve(S, m, fA, { col: ST_B, hl: 'A', exp: C.exp }); difCurve(S, m, fB, { col: ST_G, hl: 'B', exp: C.exp });
  difLabel(S, m, m.X(0) + fs * 1.4, m.Y(fA(0)) + (fA(0) >= fB(0) ? -1 : 1) * fs * 1.0, '\\col{b}{A}', C, {}); difLabel(S, m, m.X(0) + fs * 1.4, m.Y(fB(0)) + (fB(0) > fA(0) ? -1 : 1) * fs * 1.0, '\\col{g}{B}', C, {});
  if (rA !== null) difDot(S, m, rA, 0, { fill: ST_B, r: 4.5 }); if (rB !== null) difDot(S, m, rB, 0, { fill: ST_G, r: 4.5 });
  if (x !== null && x > 0) { const q = difDot(S, m, x, fA(x), { fill: ST_O, stroke: 'W', r: 6 }); if (q) { shlC(S, 'x', q[0], q[1], 13); difSeg(S, m, x, 0, x, fA(x), { col: ST_O, lw: 1.2, dash: [4, 4] }); difLabel(S, m, q[0] + fs * 3.2, q[1] - fs * 1.0, '\\col{o}{' + Ivr.pc(x) + '}', C, {}); } }
  difDot(S, m, P.i, Math.min(KA, KB), { fill: KA <= KB ? ST_B : ST_G, r: 4.5 });
  kitDragPt(S, m, C, 'P', P.i, Math.max(KA, KB), { col: KA >= KB ? ST_B : ST_G, hl: 'P', step: 0.25 }, xx => { P.i = kitClamp(xx, 0, 25); });
}

// Liste der Rückflüsse (ein Feld pro Jahr, Jahr hinzufügen und entfernen)
function ivrList(box, api, arr, title, idp) {
  box.appendChild(api.el('div', 'subpanel-label', title));
  arr.forEach((c, k) => {
    const row = api.el('div', 'settings-row'); row.style.gap = '8px';
    const lb = api.el('label', null, 'Jahr ' + (k + 1)); lb.setAttribute('for', idp + k);
    const inp = api.el('input'); inp.type = 'number'; inp.id = idp + k; inp.step = 1000; inp.value = String(c); inp.style.width = '110px';
    const set = () => { const v = parseFloat(inp.value); if (isFinite(v)) arr[k] = Math.max(-1e7, Math.min(1e7, Math.round(v))); };
    inp.addEventListener('change', () => { set(); api.changed(false); });
    row.append(lb, inp);
    if (arr.length > 1 && k === arr.length - 1) row.appendChild(api.btn('×', () => { arr.pop(); api.changed(true); }, 'Letztes Jahr entfernen'));
    box.appendChild(row);
  });
  if (arr.length < Ivr.NMAX) { const row = api.el('div', 'settings-row'); row.appendChild(api.btn('+ Jahr', () => { arr.push(arr[arr.length - 1] || 0); api.changed(true); })); box.appendChild(row); }
}

(function () {
  const ONE = [['Maschine: 100 000 Franken, vier Jahre', { I0: 100000, cf: [30000, 35000, 40000, 30000], i: 8 }], ['Solaranlage: acht gleiche Erträge', { I0: 24000, cf: [3500, 3500, 3500, 3500, 3500, 3500, 3500, 3500], i: 5 }],
    ['Lieferwagen mit Restwert am Schluss', { I0: 45000, cf: [12000, 12000, 12000, 12000, 22000], i: 6 }], ['Mit einer Nachinvestition im dritten Jahr', { I0: 60000, cf: [25000, 25000, -10000, 25000, 25000], i: 7 }], ['Rückflüsse zu klein', { I0: 80000, cf: [20000, 20000, 20000, 15000], i: 4 }]];
  const def = () => ({ I0: 100000, i: 8, cf: [30000, 35000, 40000, 30000] });
  const head = () => [{ k: 'I0', t: 'num', l: 'Investition I₀ (CHF)', min: 0, max: 1e7, step: 1000 }, { k: 'i', t: 'range', l: 'Kalkulationszinssatz i', min: 0, max: 25, step: 0.25, u: '%', d: 2 }];
  kitDefine({
    id: 'invest', icon: 'K₀', title: 'Investitionsrechnung', group: 'app',
    desc: 'Kapitalwert mit abgezinsten Zahlungen am Zeitstrahl, interner Zinssatz als Nullstelle der Kapitalwertkurve, statische und dynamische Amortisation, Annuität, Vergleich zweier Investitionen',
    about: 'Lohnt sich eine Investition? Zahlungen am Zeitstrahl abzinsen, den Kapitalwert und den internen Zinssatz bestimmen, die Amortisationszeit ablesen und zwei Investitionen vergleichen.',
    tip: 'Trage links die Investition und die Rückflüsse der einzelnen Jahre ein. Der Kalkulationszinssatz lässt sich im Bild ziehen.',
    help: ['Die Investition wird heute bezahlt (Zeitpunkt 0), jeder Rückfluss am Ende seines Jahres. Ein negativer Rückfluss ist eine weitere Auszahlung.',
      'Die Ansichten «Kapitalwert», «Interner Zinssatz» und «Amortisation» zeigen dieselbe Investition; Änderungen gelten in allen dreien.',
      'Der interne Zinssatz wird zwischen 0 % und 100 % gesucht. Wechseln die Zahlungen mehrmals das Vorzeichen, kann es mehrere geben; gezeigt wird der kleinste.'],
    kw: { npv: 'Kapitalwert Barwert abzinsen Kalkulationszinssatz Investition Rückfluss Annuität Net Present Value', irr: 'interner Zinssatz interner Zinsfuss Rendite Kapitalwertkurve Nullstelle Interpolation', pay: 'Amortisation Payback Amortisationszeit statisch dynamisch Rückflussdauer', cmp: 'Investitionen vergleichen Kapitalwert interner Zinssatz Rangfolge Gleichstand' },
    views: [['npv', 'Kapitalwert'], ['irr', 'Interner Zinssatz'], ['pay', 'Amortisation (Payback)'], ['cmp', 'Zwei Investitionen vergleichen']],
    quiz: ['npv', 'irr', 'pay', 'cmp'], shared: ['I0', 'cf', 'i'],
    descs: {
      npv: ['Trage links die {{Investition heute|I0}} und die {{Rückflüsse der Jahre|pay}} ein: Jede Zahlung wird mit dem Kalkulationszinssatz zu ihrem {{Barwert|pv}} abgezinst. Die Summe aller Barwerte ist der {{Kapitalwert K₀|k0}}; ist er positiv, lohnt sich die Investition.', 'Kapitalwertmethode: Geld, das später fliesst, ist heute weniger wert, weil man es in der Zwischenzeit zum Kalkulationszinssatz anlegen könnte. Darum werden alle Zahlungen auf den Zeitpunkt der Investition abgezinst und erst dann zusammengezählt.'],
      irr: ['Ziehe den {{Kalkulationszinssatz|P}} entlang der {{Kapitalwertkurve|f}}: Je höher der Zinssatz, desto kleiner der Kapitalwert. Beim {{internen Zinssatz i*|irr}} ist der Kapitalwert genau null; liegt er über dem Kalkulationszinssatz, lohnt sich die Investition.', 'Der interne Zinssatz ist die Verzinsung, die eine Investition selbst erbringt. Man findet ihn durch Probieren und Interpolieren, weil sich die Gleichung meist nicht nach dem Zinssatz auflösen lässt.'],
      pay: ['Die {{orange Linie|stat}} summiert die Zahlungen ohne Zins, die {{blaue Linie|dyn}} die abgezinsten Zahlungen. Wo eine Linie die Nulllinie kreuzt, ist die Investition zurückgeflossen: nach der {{statischen|ts}} und nach der {{dynamischen Amortisationszeit|td}}.', 'Die Amortisationszeit (Payback) sagt, wie lange das Kapital gebunden ist, und damit etwas über das Risiko. Über den Gewinn sagt sie nichts, denn Zahlungen nach der Amortisation werden nicht beachtet.'],
      cmp: ['Vergleiche {{Investition A|A}} und {{Investition B|B}}: Ziehe den {{Punkt beim Kalkulationszinssatz|P}} und lies ab, welche den grösseren Kapitalwert hat. Am {{Schnittpunkt der Kurven|x}} sind beide gleich gut; links und rechts davon ist jeweils eine andere besser.', 'Kapitalwert und interner Zinssatz können verschiedene Rangfolgen liefern: Späte, grosse Rückflüsse leiden stärker unter einem hohen Zinssatz als frühe. Massgebend ist der Kapitalwert beim eigenen Kalkulationszinssatz.']
    },
    def: { npv: def(), irr: Object.assign(def(), { win: null }), pay: def(), cmp: { i: 8, IA: 100000, cfA: [60000, 40000, 20000, 10000], IB: 100000, cfB: [10000, 20000, 50000, 70000], win: null } },
    controls(v) { return v === 'cmp' ? [head()[1], { k: 'IA', t: 'num', l: 'A: Investition (CHF)', min: 0, max: 1e7, step: 1000 }, { k: 'IB', t: 'num', l: 'B: Investition (CHF)', min: 0, max: 1e7, step: 1000 }] : head(); },
    presets: { npv: ONE, irr: ONE, pay: ONE, cmp: [['Früh oder spät: gleiche Investition', { IA: 100000, cfA: [60000, 40000, 20000, 10000], IB: 100000, cfB: [10000, 20000, 50000, 70000], i: 8 }], ['Klein und rasch gegen gross und langsam', { IA: 40000, cfA: [25000, 25000], IB: 120000, cfB: [35000, 35000, 35000, 35000, 35000], i: 6 }], ['Zwei Maschinen', { IA: 80000, cfA: [30000, 30000, 30000, 30000], IB: 110000, cfB: [38000, 38000, 38000, 38000], i: 8 }]] },
    sanitize(v, P, src) { (v === 'cmp' ? ['cfA', 'cfB'] : ['cf']).forEach(k => { const a = Ivr.cfOk(src[k]); if (a.length) P[k] = a; }); },
    fix(v, P) { ['I0', 'IA', 'IB'].forEach(k => { if (k in P) P[k] = Math.round(P[k]); }); P.i = kitClamp(Math.round(P.i * 4) / 4, 0, 25); },
    extra(v, P, box, api) { if (v === 'cmp') { ivrList(box, api, P.cfA, 'A: Rückflüsse am Jahresende (CHF)', 'invest-a-'); ivrList(box, api, P.cfB, 'B: Rückflüsse am Jahresende (CHF)', 'invest-b-'); } else ivrList(box, api, P.cf, 'Rückflüsse am Jahresende (CHF)', 'invest-cf-'); },
    scene: { npv: ivrSceneNpv, irr: ivrSceneIrr, pay: ivrScenePay, cmp: ivrSceneCmp },
    doc: (v, P) => Ivr.doc(v, P)
  });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { Ivr };
