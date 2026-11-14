// ═══════════════════════════════════════════════════════════════════
// 125_reg.js — Regression und Korrelation (Thema aus dem Baukasten 120_kit.js)
//
// Reg: Rechenkern ohne DOM (Kennzahlen einer Punktwolke, Regressionsgerade, Rechenwege).
// Summen der Abweichungen: S_xx = Σ(x − x̄)², S_yy = Σ(y − ȳ)², S_xy = Σ(x − x̄)(y − ȳ);
// r = S_xy / √(S_xx · S_yy), Regressionsgerade ŷ = m·x + q mit m = S_xy / S_xx, q = ȳ − m·x̄.
// Die Punkte gelten für alle Ansichten (spec.shared).
// ═══════════════════════════════════════════════════════════════════
const Reg = (function () {
  const NMAX = 20, LIM = 1e6;
  const trim = s => { s = String(parseFloat(s)); return s === '-0' ? '0' : s; };
  function fmt(v) {
    if (v === null || !isFinite(v)) return '?';
    const a = Math.abs(v);
    if (a >= 1e7) { const e = Math.floor(Math.log10(a)); return trim((v / Math.pow(10, e)).toFixed(2)) + '\\cdot 10^{' + e + '}'; }
    if (a !== 0 && a < 0.1) return trim(v.toPrecision(3));
    return trim(v.toFixed(a >= 1000 ? 0 : a >= 100 ? 1 : a >= 10 ? 2 : 3));
  }
  const eq = v => { const s = fmt(v); return (s.indexOf('cdot') < 0 && Math.abs(v - parseFloat(s)) < 1e-9 * Math.max(1, Math.abs(v)) ? '=' : '\\approx ') + s; };
  const pn = v => (v < 0 ? '(' + fmt(v) + ')' : fmt(v));
  const sg = v => (v < 0 ? '-' : '+') + fmt(Math.abs(v));
  const lineTex = (m, q) => fmt(m) + '\\cdot x' + (Math.abs(q) < 1e-12 ? '' : sg(q));
  const snapTo = (v, s) => { const r = s > 0 ? Math.round(v / s) * s : v; return Math.max(-LIM, Math.min(LIM, Math.round(r * 1e6) / 1e6 + 0)); };

  // Datenreihen [x, y]; own: einfache Zahlen für eigene Versuche
  const DS = {
    shoe: { name: 'Körpergrösse x in cm und Schuhgrösse y', pts: [[158, 37], [162, 38], [165, 38], [168, 40], [170, 39], [173, 41], [175, 42], [178, 42], [181, 44], [185, 45], [188, 45], [192, 47]] },
    learn: { name: 'Lernzeit x in Stunden und Note y', pts: [[0.5, 3], [1, 3.5], [1.5, 3.5], [2, 4], [2.5, 4.5], [3, 4], [3.5, 5], [4, 4.5], [5, 5.5], [6, 5.5]] },
    ice: { name: 'Temperatur x in °C und verkaufte Glacekugeln y', pts: [[14, 120], [16, 150], [18, 190], [20, 240], [22, 260], [24, 330], [26, 360], [28, 410], [30, 480], [32, 500]] },
    car: { name: 'Alter x in Jahren und Wert y eines Autos in 1000 Franken', pts: [[1, 32], [2, 27], [3, 24], [4, 20], [5, 18], [6, 15], [8, 11], [10, 8], [12, 6]] },
    brake: { name: 'Geschwindigkeit x in km/h und Bremsweg y in m', pts: [[30, 9], [40, 16], [50, 25], [60, 36], [70, 49], [80, 64], [90, 81], [100, 100]] },
    none: { name: 'Hausnummer x und Note y', pts: [[3, 4.5], [8, 3.5], [12, 5], [15, 4], [21, 5.5], [27, 3], [30, 4.5], [34, 4], [40, 5], [45, 3.5]] },
    own: { name: 'Eigene Daten', pts: [[1, 2], [2, 3], [3, 5], [4, 4], [5, 6]] }
  };
  const copy = a => a.map(p => [p[0], p[1]]);
  // Punkte aus gespeicherten Daten: höchstens NMAX endliche Paare, mindestens zwei
  function ptsOk(a) {
    if (!Array.isArray(a)) return null;
    const o = [];
    for (const p of a) { if (o.length >= NMAX) break; if (Array.isArray(p) && p.length >= 2) { const x = Number(p[0]), y = Number(p[1]); if (isFinite(x) && isFinite(y) && Math.abs(x) <= LIM && Math.abs(y) <= LIM && typeof p[0] !== 'boolean' && typeof p[1] !== 'boolean' && p[0] !== null && p[1] !== null) o.push([x, y]); } }
    return o.length >= 2 ? o : null;
  }
  // Kennzahlen; r, m, q sind null, wenn sie nicht definiert sind (alle x oder alle y gleich)
  function stats(pts) {
    const n = pts.length; let sx = 0, sy = 0; pts.forEach(p => { sx += p[0]; sy += p[1]; });
    const mx = sx / n, my = sy / n; let sxx = 0, syy = 0, sxy = 0;
    pts.forEach(p => { const dx = p[0] - mx, dy = p[1] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    const tol = 1e-12, okx = sxx > tol * Math.max(1, mx * mx), oky = syy > tol * Math.max(1, my * my);
    const m = okx ? sxy / sxx : null, q = okx ? my - m * mx : null;
    let r = okx && oky ? sxy / Math.sqrt(sxx * syy) : null; if (r !== null) r = Math.max(-1, Math.min(1, r));
    const sse = okx ? Math.max(0, pts.reduce((s, p) => { const e = p[1] - (m * p[0] + q); return s + e * e; }, 0)) : null;
    const r2 = okx && oky ? Math.max(0, Math.min(1, 1 - sse / syy)) : null;
    return { n, sumx: sx, sumy: sy, mx, my, sxx, syy, sxy, m, q, r, sse, r2 };
  }
  const sseOf = (pts, m, q) => pts.reduce((s, p) => { const e = p[1] - (m * p[0] + q); return s + e * e; }, 0);
  function ext(pts) { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; pts.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }); return { x0, x1, y0, y1 }; }
  // Ausschnitt um alle Punkte (und Zusatzpunkte) mit Rand
  function win(pts, more) {
    const e = ext(pts.concat(more || []));
    if (!(e.x1 - e.x0 > 1e-9)) { const h = Math.max(1, Math.abs(e.x0) * 0.1); e.x0 -= h; e.x1 += h; }
    if (!(e.y1 - e.y0 > 1e-9)) { const h = Math.max(1, Math.abs(e.y0) * 0.1); e.y0 -= h; e.y1 += h; }
    const rx = e.x1 - e.x0, ry = e.y1 - e.y0;
    return { x0: e.x0 - rx * 0.13, x1: e.x1 + rx * 0.13, y0: e.y0 - ry * 0.16, y1: e.y1 + ry * 0.18 };
  }
  // Raster beim Ziehen: Zehnerpotenz, die die Spannweite in 20 bis 200 Schritte teilt
  function snap(pts) {
    const e = ext(pts), f = R => (R > 1e-9 ? Math.pow(10, Math.floor(Math.log10(R / 20) + 1e-9)) : 0.1);
    return [f(e.x1 - e.x0), f(e.y1 - e.y0)];
  }
  const WORD = {
    sp: 'starker positiver linearer Zusammenhang', mp: 'mittlerer positiver linearer Zusammenhang', wp: 'schwacher positiver linearer Zusammenhang',
    sn: 'starker negativer linearer Zusammenhang', mn: 'mittlerer negativer linearer Zusammenhang', wn: 'schwacher negativer linearer Zusammenhang',
    no: 'kein linearer Zusammenhang erkennbar', nd: 'r ist nicht definiert'
  };
  function word(r) { if (r === null) return WORD.nd; const a = Math.abs(r); if (a < 0.2) return WORD.no; return WORD[(a >= 0.8 ? 's' : a >= 0.5 ? 'm' : 'w') + (r > 0 ? 'p' : 'n')]; }
  const fr = r => (r === null ? '?' : trim(r.toFixed(3)));
  const eqr = r => (r === null ? '=?' : (Math.abs(r - parseFloat(r.toFixed(3))) < 1e-12 ? '=' : '\\approx ') + fr(r));

  // ── Rechenwege ──
  const mk = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const undef = B => B.note('Alle Punkte haben denselben x-Wert oder denselben y-Wert: Korrelationskoeffizient und Regressionsgerade sind dann nicht definiert.');
  function sums(B, s) {
    B.p('**Summen über alle Punkte:** Abweichungen vom Mittelwert miteinander multiplizieren oder quadrieren und zusammenzählen.');
    B.e('S_{xy}=\\sum (x_i-\\bar x)(y_i-\\bar y)' + eq(s.sxy), 'b');
    B.e('S_{xx}=\\sum (x_i-\\bar x)^2' + eq(s.sxx) + ',\\quad S_{yy}=\\sum (y_i-\\bar y)^2' + eq(s.syy));
  }
  function means(B, s) {
    B.p('**Mittelwerte:** Summe aller Werte geteilt durch die Anzahl $n=' + s.n + '$.');
    B.e('\\bar x=\\frac{' + fmt(s.sumx) + '}{' + s.n + '}' + eq(s.mx) + ',\\quad \\bar y=\\frac{' + fmt(s.sumy) + '}{' + s.n + '}' + eq(s.my), 'o');
  }
  function docCloud(P) {
    const B = mk(), pts = P.pts, s = stats(pts), p1 = pts[0], d1 = (p1[0] - s.mx) * (p1[1] - s.my);
    means(B, s);
    B.p('**Abweichungen vom Mittelwert:** Für jeden Punkt wird das Produkt der beiden Abweichungen gebildet. Es ist positiv, wenn der Punkt rechts oben oder links unten vom Mittelpunkt liegt, sonst negativ. Hier für den ersten Punkt:');
    B.e('(x_1-\\bar x)\\cdot (y_1-\\bar y)=(' + fmt(p1[0]) + '-' + pn(s.mx) + ')\\cdot (' + fmt(p1[1]) + '-' + pn(s.my) + ')' + eq(d1), d1 >= 0 ? 'b' : 'r');
    sums(B, s);
    if (s.r === null) { undef(B); return { title: 'Korrelationskoeffizient', st: B.st }; }
    B.p('**Korrelationskoeffizient:** Die Summe der Produkte wird durch die Wurzel aus dem Produkt der beiden Quadratsummen geteilt. So liegt $r$ immer zwischen $-1$ und $1$.');
    B.e('r=\\frac{S_{xy}}{\\sqrt{S_{xx}\\cdot S_{yy}}}=\\frac{' + fmt(s.sxy) + '}{\\sqrt{' + fmt(s.sxx) + '\\cdot ' + fmt(s.syy) + '}}' + eqr(s.r), 'v');
    B.note('Als Faustregel: Ab $|r|=0.8$ spricht man von einem starken, ab $0.5$ von einem mittleren Zusammenhang. Eine hohe Korrelation beweist keine Ursache.');
    B.res('$r' + eqr(s.r) + '$: ' + word(s.r));
    return { title: 'Korrelationskoeffizient', st: B.st };
  }
  function lineSteps(B, s) {
    B.p('**Steigung:** Summe der Produkte geteilt durch die Quadratsumme der x-Abweichungen.');
    B.e('m=\\frac{S_{xy}}{S_{xx}}=\\frac{' + fmt(s.sxy) + '}{' + fmt(s.sxx) + '}' + eq(s.m), 'b');
    B.p('**Achsenabschnitt:** Die Gerade geht durch den Schwerpunkt $(\\bar x\\,|\\,\\bar y)$.');
    B.e('q=\\bar y-m\\cdot \\bar x=' + fmt(s.my) + '-' + pn(s.m) + '\\cdot ' + pn(s.mx) + eq(s.q), 'o');
  }
  function docLine(P) {
    const B = mk(), pts = P.pts, s = stats(pts), e = ext(pts);
    B.p('**Methode der kleinsten Quadrate:** Gesucht ist die Gerade, bei der die Summe der quadrierten senkrechten Abstände zu den Punkten am kleinsten ist.');
    B.e('\\hat{y}=m\\cdot x+q,\\qquad \\sum (y_i-\\hat{y}_i)^2\\to \\min', 'b');
    means(B, s); sums(B, s);
    if (s.m === null) { undef(B); return { title: 'Regressionsgerade und Vorhersage', st: B.st }; }
    lineSteps(B, s);
    B.e('\\hat{y}=' + lineTex(s.m, s.q), 'b');
    const x0 = P.x0, yh = s.m * x0 + s.q;
    B.p('**Vorhersage:** $x_0=' + fmt(x0) + '$ in die Gleichung einsetzen.');
    B.e('\\hat{y}(' + fmt(x0) + ')=' + fmt(s.m) + '\\cdot ' + pn(x0) + (Math.abs(s.q) < 1e-12 ? '' : sg(s.q)) + eq(yh), 'v');
    if (x0 < e.x0 - 1e-9 || x0 > e.x1 + 1e-9) B.note('Dieser x-Wert liegt ausserhalb der Daten (Extrapolation). Die Vorhersage ist unsicher, weil niemand weiss, ob der Zusammenhang dort noch gilt.');
    B.p('**Summe der Abstandsquadrate** der Regressionsgeraden:');
    B.e('\\sum (y_i-\\hat{y}_i)^2' + eq(s.sse), 'g');
    if (P.own && P.h) {
      const h = P.h, dx = h[1][0] - h[0][0];
      if (Math.abs(dx) > 1e-9) {
        const m2 = (h[1][1] - h[0][1]) / dx, q2 = h[0][1] - m2 * h[0][0], s2 = sseOf(pts, m2, q2);
        B.p('**Eigene Gerade** durch die beiden roten Punkte:');
        B.e('y=' + lineTex(m2, q2) + ',\\qquad \\sum (y_i-y(x_i))^2' + eq(s2), 'r');
        B.note('Kleiner als bei der Regressionsgeraden kann diese Summe nicht werden.');
      } else B.note('Die eigene Gerade steht senkrecht: Ziehe einen der roten Punkte zur Seite.');
    }
    B.res('Regressionsgerade $\\hat{y}=' + lineTex(s.m, s.q) + '$');
    return { title: 'Regressionsgerade und Vorhersage', st: B.st };
  }
  function docFit(P) {
    const B = mk(), pts = P.pts, s = stats(pts);
    if (s.r2 === null) { means(B, s); sums(B, s); undef(B); return { title: 'Bestimmtheitsmass', st: B.st }; }
    const p1 = pts[0], yh1 = s.m * p1[0] + s.q;
    B.p('**Regressionsgerade:**'); B.e('\\hat{y}=' + lineTex(s.m, s.q), 'b');
    B.p('**Gesamte Streuung:** Summe der quadrierten Abweichungen der y-Werte von ihrem Mittelwert $\\bar y' + eq(s.my) + '$.');
    B.e('S_{yy}=\\sum (y_i-\\bar y)^2' + eq(s.syy));
    B.p('**Residuen:** Abweichung jedes Punktes von der Geraden, hier für den ersten Punkt.');
    B.e('e_1=y_1-\\hat{y}_1=' + fmt(p1[1]) + '-' + pn(yh1) + eq(p1[1] - yh1), 'g');
    B.p('**Nicht erklärte Streuung:** Summe der quadrierten Residuen.');
    B.e('\\sum e_i^2' + eq(s.sse), 'g');
    B.p('**Bestimmtheitsmass:** Anteil der Streuung, den die Gerade erklärt.');
    B.e('r^2=1-\\frac{\\sum e_i^2}{S_{yy}}=1-\\frac{' + fmt(s.sse) + '}{' + fmt(s.syy) + '}' + eqr(s.r2), 'b');
    B.p('Das ist das Quadrat des Korrelationskoeffizienten $r' + eqr(s.r) + '$.');
    B.note('Ein hohes $r^2$ allein genügt nicht: Liegen die Residuen auf einem Bogen, wäre eine Kurve das bessere Modell.');
    B.res('Die Gerade erklärt rund ' + trim((s.r2 * 100).toFixed(1)) + ' % der Streuung der y-Werte');
    return { title: 'Bestimmtheitsmass', st: B.st };
  }
  function docOut(P) {
    const B = mk(), pts = P.pts, Q = [P.qx, P.qy], s0 = stats(pts), s1 = stats(pts.concat([Q]));
    if (s0.m === null || s1.m === null || s0.r === null || s1.r === null) { undef(B); return { title: 'Einfluss eines Ausreissers', st: B.st }; }
    B.p('**Ohne den Punkt Q:**');
    B.e('\\hat{y}=' + lineTex(s0.m, s0.q) + ',\\qquad r' + eqr(s0.r), 'b');
    B.p('**Mit dem Punkt Q:** $Q(' + fmt(Q[0]) + '\\,|\\,' + fmt(Q[1]) + ')$ zählt als weiterer Datenpunkt.');
    B.e('\\hat{y}=' + lineTex(s1.m, s1.q) + ',\\qquad r' + eqr(s1.r), 'r');
    B.p('**Hebel:** Abstand von Q zum Mittelwert der übrigen x-Werte. Je grösser er ist, desto stärker dreht Q die Gerade.');
    B.e('|x_Q-\\bar x|=|' + fmt(Q[0]) + '-' + pn(s0.mx) + '|' + eq(Math.abs(Q[0] - s0.mx)), 'o');
    B.p('**Abweichung:** Abstand von Q zur Geraden ohne Q.');
    B.e('y_Q-\\hat{y}(x_Q)=' + fmt(Q[1]) + '-' + pn(s0.m * Q[0] + s0.q) + eq(Q[1] - (s0.m * Q[0] + s0.q)), 'g');
    B.note('Ein Ausreisser wird nicht einfach gestrichen: Zuerst prüft man, ob ein Mess- oder Tippfehler vorliegt.');
    B.res('Steigung ohne Q $' + fmt(s0.m) + '$, mit Q $' + fmt(s1.m) + '$; $r$ ohne Q $' + fr(s0.r) + '$, mit Q $' + fr(s1.r) + '$');
    return { title: 'Einfluss eines Ausreissers', st: B.st };
  }
  const doc = (v, P) => ({ cloud: docCloud, line: docLine, fit: docFit, out: docOut })[v](P);
  return { NMAX, LIM, fmt, eq, fr, eqr, lineTex, snapTo, DS, copy, ptsOk, stats, sseOf, ext, win, snap, word, WORD, doc };
})();

// ── Bilder ──
// Rahmen mit dem Namen der Datenreihe; ein Klick in die leere Fläche setzt einen Punkt
let regHold = null;                                                   // Ausschnitt, solange ein Punkt gezogen wird (sonst läuft er dem Zeiger davon)
function regFrame(S, r, C, more, o) {
  const P = C.P, pts = P.pts, D = Reg.DS[P.ds] || Reg.DS.own, sn = Reg.snap(pts);
  let win = Reg.win(pts, more);
  if (!C.exp) { const hk = C.view + '|' + P.ds + '|' + pts.length; if (C.hover && regHold && regHold.k === hk) win = regHold.win; else regHold = { k: hk, win }; }
  const m = kitFrame(S, r, C, win, Object.assign({ title: '\\text{' + D.name + '}' }, o || {}));
  if (!C.exp) S.hits.push({ id: 'bg', bg: true, x: m.L, y: m.T, w: m.R - m.L, h: m.B - m.T, on: (px, py) => {
    if (pts.length >= Reg.NMAX) return;
    if (S.hits.some(h => h.move && px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h)) return;
    pts.push([Reg.snapTo(m.IX(px), sn[0]), Reg.snapTo(m.IY(py), sn[1])]);
  } });
  m.sn = sn; return m;
}
// Datenpunkte (ziehbar)
function regDots(S, m, C, pts, o) {
  o = o || {};
  pts.forEach((p, i) => {
    const px = m.X(p[0]), py = m.Y(p[1]); if (!isFinite(px) || !isFinite(py)) return;
    const id = 'p' + i, hot = C.hover === id, r = 5 + (hot ? 2 : 0);
    if (difInside(m, px, py, 2)) {
      if (hot && !C.exp) S.circ(px, py, r + 5, { fill: 'T', stroke: 'T', lw: 0, a: 0.15 });
      S.circ(px, py, C.exp ? 3 : r, { fill: o.col || 'T', stroke: 'W', lw: 1.5 }); shlC(S, 'pts', px, py, 9);
    }
    if (C.exp) return;
    S.hits.push({ id, x: px - 14, y: py - 14, w: 28, h: 28, move: (qx, qy) => { pts[i] = [Reg.snapTo(m.IX(kitClamp(qx, m.L, m.R)), m.sn[0]), Reg.snapTo(m.IY(kitClamp(qy, m.T, m.B)), m.sn[1])]; } });
  });
}
// Kasten mit Textzeilen (Rich) in einer Ecke des Rahmens
function regBox(S, m, C, lines, right, hl, wEm) {
  const fs = C.fs, bw = fs * (wEm || 13), bh = fs * (1.5 * lines.length + 0.7), bx = right ? m.R - bw - fs * 0.6 : m.L + fs * 2.2, by = m.T + fs * 0.6;
  S.rect(bx, by, bw, bh, { fill: 'W', stroke: 'G', lw: 1, a: 0.9 }); if (hl) shlBox(S, hl, bx, by, bx + bw, by + bh);
  lines.forEach((l, i) => { const y = by + fs * (1.1 + 1.5 * i); if (l.t) S.text(bx + fs * 0.6, y, l.t, { size: fs * (l.size || 0.9), col: l.col || 'M', al: 'l', bs: 'm', bold: !!l.bold }); else S.rich(bx + fs * 0.6, y, l.s, { size: fs * (l.size || 1), col: l.col || 'T', al: 'l', bs: 'm', bold: !!l.bold }); });
}
const regRect = (W, H, C) => ({ x: C.fs * 0.4, y: C.fs * 0.3, w: W - C.fs * 0.8, h: H - C.fs * 0.6 });
const regLineTitle = s => (s.m === null ? '' : '\\col{b}{\\hat{y}=' + Reg.lineTex(s.m, s.q) + '}');

function regSceneCloud(S, W, H, C) {
  const P = C.P, fs = C.fs, pts = P.pts, s = Reg.stats(pts), F = Reg.fmt;
  const m = regFrame(S, regRect(W, H, C), C, null, {});
  if (P.rect) pts.forEach(p => {
    const a = [kitClamp(m.X(s.mx), m.L, m.R), kitClamp(m.Y(s.my), m.T, m.B)], b = [kitClamp(m.X(p[0]), m.L, m.R), kitClamp(m.Y(p[1]), m.T, m.B)];
    const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), w = Math.abs(a[0] - b[0]), h = Math.abs(a[1] - b[1]); if (w < 0.5 || h < 0.5) return;
    const pos = (p[0] - s.mx) * (p[1] - s.my) > 0, col = pos ? ST_B : ST_R;
    S.rect(x, y, w, h, { fill: col, stroke: col, lw: 1, a: 0.13 }); shlBox(S, pos ? 'pos' : 'neg', x, y, x + w, y + h);
  });
  difSeg(S, m, s.mx, m.win.y0, s.mx, m.win.y1, { col: ST_O, lw: 1.5, dash: [6, 4], hl: 'mean' });
  difSeg(S, m, m.win.x0, s.my, m.win.x1, s.my, { col: ST_O, lw: 1.5, dash: [6, 4], hl: 'mean' });
  if (difInside(m, m.X(s.mx), m.B, 1)) difLabel(S, m, m.X(s.mx) + fs * 2.4, m.B - fs * 0.8, '\\col{o}{\\bar x' + Reg.eq(s.mx) + '}', C, {});
  if (difInside(m, m.R, m.Y(s.my), 1)) difLabel(S, m, m.R - fs * 3, m.Y(s.my) - fs * 0.8, '\\col{o}{\\bar y' + Reg.eq(s.my) + '}', C, {});
  regDots(S, m, C, pts);
  regBox(S, m, C, [{ s: '\\col{v}{r' + Reg.eqr(s.r) + '}', size: 1.15, bold: true }, { t: Reg.word(s.r) }], s.r !== null && s.r < 0, 'r', 17);
}
function regSceneLine(S, W, H, C) {
  const P = C.P, fs = C.fs, pts = P.pts, s = Reg.stats(pts), F = Reg.fmt, ok = s.m !== null;
  const yh = ok ? s.m * P.x0 + s.q : null, more = (ok ? [[P.x0, yh]] : []).concat(P.own && P.h ? P.h : []);
  const m = regFrame(S, regRect(W, H, C), C, more, { info: regLineTitle(s) });
  if (ok) {
    pts.forEach(p => {
      const y1 = s.m * p[0] + s.q, px = m.X(p[0]), a = m.Y(p[1]), b = m.Y(y1), d = Math.abs(a - b);
      if (P.sq && d > 1 && difInside(m, px, a, 1) && difInside(m, px, b, 1)) { const left = px + d > m.R; S.rect(left ? px - d : px, Math.min(a, b), d, d, { fill: ST_G, stroke: ST_G, lw: 1, a: 0.14 }); }
      difSeg(S, m, p[0], p[1], p[0], y1, { col: ST_G, lw: 2.2, hl: 'res' });
    });
    difLine(S, m, 0, s.q, s.m, { col: ST_B, lw: 2.4, hl: 'reg' });
  }
  let own = null;
  if (P.own && P.h) {
    const h = P.h, dx = h[1][0] - h[0][0];
    if (Math.abs(dx) > 1e-9) { const m2 = (h[1][1] - h[0][1]) / dx, q2 = h[0][1] - m2 * h[0][0]; difLine(S, m, 0, q2, m2, { col: ST_R, lw: 2, dash: [7, 4] }); own = Reg.sseOf(pts, m2, q2); }
  }
  const q0 = difDot(S, m, s.mx, s.my, { fill: ST_O, r: 5.5 });
  if (q0) { shlC(S, 'mean', q0[0], q0[1], 13); difLabel(S, m, q0[0] + fs * 3.4, q0[1] + fs * 1.0, '\\col{o}{(\\bar x\\,|\\,\\bar y)}', C, {}); }
  regDots(S, m, C, pts);
  if (P.own && P.h) P.h.forEach((h, k) => kitDragPt(S, m, C, 'h' + k, h[0], h[1], { col: ST_R, r: 6 }, (x, y) => { P.h[k] = [Reg.snapTo(x, m.sn[0] / 2), Reg.snapTo(y, m.sn[1] / 2)]; }));
  if (ok) {
    difSeg(S, m, P.x0, m.win.y0, P.x0, yh, { col: ST_V, lw: 1.2, dash: [4, 4] }); difSeg(S, m, m.win.x0, yh, P.x0, yh, { col: ST_V, lw: 1.2, dash: [4, 4] });
    kitDragPt(S, m, C, 'X', P.x0, yh, { col: ST_V, hl: 'X' }, x => { P.x0 = Reg.snapTo(x, m.sn[0]); });
    if (difInside(m, m.X(P.x0), m.Y(yh), 2)) difLabel(S, m, m.X(P.x0), m.Y(yh) + (s.m >= 0 ? 1 : -1) * fs * 1.3 + 0, '\\col{v}{X:\\ \\hat{y}(' + F(P.x0) + ')' + Reg.eq(yh) + '}', C, { dx: fs * 4.2 });
    const L = [{ t: 'Summe der Abstandsquadrate' }, { s: '\\col{b}{\\text{Regressionsgerade:}\\ ' + F(s.sse) + '}' }];
    if (own !== null) L.push({ s: '\\col{r}{\\text{eigene Gerade:}\\ ' + F(own) + '}' });
    regBox(S, m, C, L, s.m < 0, 'sum', 17);
  }
}
function regSceneFit(S, W, H, C) {
  const P = C.P, fs = C.fs, pts = P.pts, s = Reg.stats(pts), F = Reg.fmt, ok = s.r2 !== null;
  const top = fs * 3.1, h1 = (H - top - fs * 0.3) * 0.6, r1 = { x: fs * 0.4, y: top, w: W - fs * 0.8, h: h1 }, r2 = { x: fs * 0.4, y: top + h1, w: W - fs * 0.8, h: H - top - h1 - fs * 0.3 };
  const m = regFrame(S, r1, C, null, { info: regLineTitle(s) });
  // Balken: erklärter und nicht erklärter Anteil der Streuung
  const bx = m.L, bw = m.R - m.L, by = fs * 1.75, bh = fs * 0.95;
  if (ok) {
    const w1 = bw * s.r2;
    S.rect(bx, by, w1, bh, { fill: ST_B, stroke: ST_B, lw: 1, a: 0.85 }); S.rect(bx + w1, by, bw - w1, bh, { fill: ST_G, stroke: ST_G, lw: 1, a: 0.35 });
    shlBox(S, 'bar', bx, by, bx + Math.max(w1, 6), by + bh);
    S.rich(bx, fs * 0.95, '\\col{b}{r^2' + Reg.eqr(s.r2) + '\\ \\ \\text{erklärte Streuung}}', { size: fs, col: ST_B, al: 'l', bs: 'm' });
    S.rich(bx + bw, fs * 0.95, '\\col{g}{\\text{nicht erklärt:}\\ ' + Reg.fr(1 - s.r2) + '}', { size: fs, col: ST_G, al: 'r', bs: 'm' });
  } else S.text(bx, fs * 1.4, 'Für diese Punkte ist keine Regressionsgerade definiert.', { size: fs, col: 'M', al: 'l', bs: 'm' });
  if (ok) {
    pts.forEach(p => difSeg(S, m, p[0], p[1], p[0], s.m * p[0] + s.q, { col: ST_G, lw: 2.2, hl: 'res' }));
    difLine(S, m, 0, s.q, s.m, { col: ST_B, lw: 2.4, hl: 'reg' });
  }
  regDots(S, m, C, pts);
  if (!ok) return;
  // Residuenplot mit derselben x-Achse
  const E = pts.map(p => [p[0], p[1] - (s.m * p[0] + s.q)]), em = Math.max.apply(null, E.map(e => Math.abs(e[1])).concat([1e-9])) * 1.35;
  const m2 = difFrame(S, r2, { x0: m.win.x0, x1: m.win.x1, y0: -em, y1: em }, C, { title: '\\col{g}{e=y-\\hat{y}}', ylab: 'e' });
  difSeg(S, m2, m2.win.x0, 0, m2.win.x1, 0, { col: ST_B, lw: 1.8, hl: 'zero' });
  E.forEach(e => { difSeg(S, m2, e[0], 0, e[0], e[1], { col: ST_G, lw: 2 }); const q = difDot(S, m2, e[0], e[1], { fill: ST_G, r: 4 }); if (q) shlC(S, 'rp', q[0], q[1], 8); });
}
function regSceneOut(S, W, H, C) {
  const P = C.P, fs = C.fs, pts = P.pts, Q = [P.qx, P.qy], s0 = Reg.stats(pts), s1 = Reg.stats(pts.concat([Q])), F = Reg.fmt;
  const m = regFrame(S, regRect(W, H, C), C, [Q], { info: '\\col{r}{Q(' + F(Q[0]) + '\\,|\\,' + F(Q[1]) + ')}' });
  if (s0.m !== null) difLine(S, m, 0, s0.q, s0.m, { col: ST_B, lw: 2, dash: [7, 4], hl: 'l0' });
  if (s1.m !== null) difLine(S, m, 0, s1.q, s1.m, { col: ST_R, lw: 2.4, hl: 'l1' });
  regDots(S, m, C, pts);
  kitDragPt(S, m, C, 'Q', Q[0], Q[1], { col: ST_R, hl: 'Q', r: 7 }, (x, y) => { P.qx = Reg.snapTo(x, m.sn[0]); P.qy = Reg.snapTo(y, m.sn[1]); });
  if (difInside(m, m.X(Q[0]), m.Y(Q[1]), 2)) difLabel(S, m, m.X(Q[0]) - fs * 0.9, m.Y(Q[1]) - fs * 1.1, '\\col{r}{Q}', C, {});
  const row = (t, s, c) => ({ s: '\\col{' + c + '}{\\text{' + t + '}\\ \\ r' + Reg.eqr(s.r) + ',\\ \\ m' + (s.m === null ? '=?' : Reg.eq(s.m)) + '}' });
  regBox(S, m, C, [row('ohne Q:', s0, 'b'), row('mit Q:', s1, 'r')], s0.m !== null && s0.m < 0, 'box', 19);
}
// Liste der Datenpunkte im Panel (genaue Eingabe, Entfernen, Hinzufügen)
let regListOpen = false;
function regList(box, api, P) {
  const pts = P.pts, det = api.el('details', 'geo-box td-sec'); det.open = regListOpen; det.addEventListener('toggle', () => { regListOpen = det.open; });
  det.appendChild(api.el('summary', null, 'Datenpunkte (x | y)'));
  pts.forEach((p, k) => {
    const row = api.el('div', 'settings-row'); row.style.gap = '6px';
    const lb = api.el('label', null, 'P' + (k + 1)); lb.setAttribute('translate', 'no'); lb.style.minWidth = '26px'; lb.setAttribute('for', 'reg-x-' + k);
    const mkInp = (j, t) => { const inp = api.el('input'); inp.type = 'number'; inp.id = 'reg-' + t + '-' + k; inp.step = 'any'; inp.value = String(p[j]); inp.style.width = '78px'; inp.title = t; inp.setAttribute('aria-label', t + ' P' + (k + 1));
      inp.addEventListener('change', () => { const v = parseFloat(inp.value); if (isFinite(v)) pts[k][j] = Math.max(-Reg.LIM, Math.min(Reg.LIM, v)); api.changed(false); }); return inp; };
    row.append(lb, mkInp(0, 'x'), mkInp(1, 'y'));
    if (pts.length > 2) row.appendChild(api.btn('×', () => { pts.splice(k, 1); api.changed(true); }, 'Punkt entfernen'));
    det.appendChild(row);
  });
  if (pts.length < Reg.NMAX) { const row = api.el('div', 'settings-row'); row.appendChild(api.btn('+ Punkt', () => { const s = Reg.stats(pts), sn = Reg.snap(pts); pts.push([Reg.snapTo(s.mx, sn[0]), Reg.snapTo(s.my, sn[1])]); api.changed(true); })); det.appendChild(row); }
  box.appendChild(det);
}

(function () {
  const D = Reg.DS, set = (k, more) => Object.assign({ ds: k, pts: Reg.copy(D[k].pts) }, more || {});
  const NAME = { shoe: 'Körpergrösse und Schuhgrösse', learn: 'Lernzeit und Note', ice: 'Temperatur und Glaceverkauf', car: 'Alter und Wert eines Autos', brake: 'Geschwindigkeit und Bremsweg', none: 'Hausnummer und Note (kein Zusammenhang)', own: 'Eigene Daten: fünf Punkte' };
  const pre = L => L.map(k => [NAME[k], set(k)]);
  const spec = {
    id: 'reg', icon: 'ŷ', title: 'Regression und Korrelation', group: 'sto',
    desc: 'Punktwolke und Korrelationskoeffizient mit den Rechtecken um den Schwerpunkt, Regressionsgerade nach der Methode der kleinsten Quadrate mit Vorhersage, Bestimmtheitsmass und Residuenplot, Einfluss von Ausreissern',
    about: 'Zwei Merkmale im Zusammenhang: Wie stark hängen sie zusammen, welche Gerade passt am besten, wie gut erklärt sie die Daten, und was richtet ein einzelner Ausreisser an?',
    tip: 'Ziehe die Punkte oder klicke in die Fläche, um einen neuen zu setzen. Über «Beispiel wählen …» lädst du eine Datenreihe.',
    help: ['Punkte verschiebst du mit der Maus oder dem Finger; ein Klick in die leere Fläche setzt einen neuen Punkt. In der Liste «Datenpunkte (x | y)» gibst du Werte genau ein oder entfernst Punkte (höchstens 20).',
      'Die Daten gelten für alle Ansichten: Was du in der Punktwolke änderst, siehst du auch bei der Regressionsgeraden.',
      'Korrelationskoeffizient und Regressionsgerade beschreiben nur lineare Zusammenhänge. Ob eine Gerade passt, zeigt der Residuenplot.'],
    kw: { cloud: 'Punktwolke Streudiagramm Korrelation Korrelationskoeffizient Pearson Kovarianz Zusammenhang Merkmale bivariat', line: 'Regression Regressionsgerade Ausgleichsgerade Trendlinie kleinste Quadrate Vorhersage Prognose Interpolation Extrapolation Residuum', fit: 'Bestimmtheitsmass r Quadrat Residuen Residuenplot Streuung erklärt Güte Anpassung', out: 'Ausreisser Hebelpunkt Einfluss robust Messfehler' },
    views: [['cloud', 'Punktwolke und Korrelation'], ['line', 'Regressionsgerade und Vorhersage'], ['fit', 'Bestimmtheitsmass und Residuen'], ['out', 'Einfluss eines Ausreissers']],
    quiz: ['cloud', 'line', 'fit', 'out'], shared: ['pts', 'ds'],
    descs: {
      cloud: ['Ziehe die {{Punkte der Punktwolke|pts}} oder klicke in die Fläche, um einen Punkt zu setzen. Das {{Kreuz der Mittelwerte|mean}} teilt die Ebene in vier Felder: Die {{blauen Rechtecke|pos}} zählen positiv, die {{roten Rechtecke|neg}} negativ. Aus ihrer Summe entsteht der {{Korrelationskoeffizient r|r}}.',
        'Der Korrelationskoeffizient r misst, wie gut die Punkte zu einer Geraden passen. Bei r = 1 oder r = −1 liegen alle Punkte genau auf einer steigenden oder fallenden Geraden; bei r nahe 0 ist kein linearer Zusammenhang erkennbar. Eine hohe Korrelation beweist nicht, dass die eine Grösse die andere verursacht.'],
      line: ['Die {{Regressionsgerade|reg}} macht die Summe der Quadrate der {{senkrechten Abstände|res}} so klein wie möglich und geht immer durch den {{Schwerpunkt der Daten|mean}}. Ziehe den {{violetten Punkt X|X}} für eine Vorhersage, oder schalte links eine eigene Gerade ein und vergleiche die {{Summen der Abstandsquadrate|sum}}.',
        'Methode der kleinsten Quadrate: Steigung m = S_xy / S_xx, Achsenabschnitt q = ȳ − m · x̄. Mit der Geraden sagt man y-Werte vorher. Innerhalb der Daten (Interpolation) ist das verlässlich, ausserhalb (Extrapolation) unsicher.'],
      fit: ['Die {{Gerade der kleinsten Quadrate|reg}} erklärt nur einen Teil der Streuung der y-Werte: Der {{blaue Teil des Balkens|bar}} ist das Bestimmtheitsmass r². Unten sind die {{Residuen|rp}} einzeln aufgetragen. Liegen sie ohne Muster um die {{Nulllinie|zero}}, passt eine Gerade; bilden sie einen Bogen, wäre eine Kurve besser.',
        'Das Bestimmtheitsmass r² ist der Anteil der Streuung der y-Werte, den die Regressionsgerade erklärt; es ist das Quadrat des Korrelationskoeffizienten. Der Residuenplot zeigt, was die Gerade nicht erklärt.'],
      out: ['Ziehe den {{roten Punkt Q|Q}}: Die {{gestrichelte Gerade|l0}} gehört zu den Daten ohne Q, die {{rote Gerade mit Q|l1}} zu allen Punkten. Liegt Q in x-Richtung weit aussen, wirkt er wie ein Hebel. Der {{Vergleich mit und ohne Q|box}} zeigt, wie stark sich r und die Steigung ändern.',
        'Ein Ausreisser ist ein Punkt, der weit von den übrigen entfernt liegt. Besonders stark beeinflusst er die Regressionsgerade, wenn er in x-Richtung weit vom Mittelwert liegt (Hebelpunkt). Ausreisser streicht man nicht einfach: Zuerst wird geprüft, ob ein Messfehler vorliegt.']
    },
    def: {
      cloud: set('learn', { rect: true, win: null }),
      line: set('learn', { x0: null, sq: false, own: false, h: null, dk: null, win: null }),
      fit: set('learn', { win: null }),
      out: set('learn', { qx: null, qy: null, dk: null, win: null })
    },
    controls(v, P) {
      const L = Reg.LIM;
      if (v === 'cloud') return [{ k: 'rect', t: 'check', l: 'Rechtecke zum Schwerpunkt zeigen' }];
      if (v === 'line') return [{ k: 'x0', t: 'num', l: 'Vorhersage bei x₀', min: -L, max: L, step: 'any' }, { k: 'sq', t: 'check', l: 'Abstandsquadrate zeigen' }, { k: 'own', t: 'check', l: 'Eigene Gerade zum Vergleich' }];
      if (v === 'out') return [{ k: 'qx', t: 'num', l: 'Q: x-Wert', min: -L, max: L, step: 'any' }, { k: 'qy', t: 'num', l: 'Q: y-Wert', min: -L, max: L, step: 'any' }];
      return [];
    },
    presets: {
      cloud: pre(['shoe', 'learn', 'ice', 'car', 'none']).concat([['Alle Punkte auf einer Geraden', { ds: 'own', pts: [[1, 1], [2, 3], [3, 5], [4, 7], [5, 9]] }], [NAME.own, set('own')]]),
      line: pre(['shoe', 'learn', 'ice', 'car', 'own']),
      fit: pre(['brake', 'car', 'ice', 'shoe', 'none']),
      out: [['Tippfehler: Schuhgrösse 24 statt 42', set('shoe', { qx: 175, qy: 24, dk: 'shoe' })], ['Hebelpunkt weit rechts', set('ice', { qx: 40, qy: 200, dk: 'ice' })], ['Ein Punkt täuscht einen Zusammenhang vor', set('none', { qx: 150, qy: 1, dk: 'none' })], ['Punkt weit aussen, aber auf der Geraden', set('shoe', { qx: 210, qy: 51.5, dk: 'shoe' })]]
    },
    sanitize(v, P, src) {
      P.pts = Reg.ptsOk(src.pts) || P.pts; P.ds = typeof src.ds === 'string' && Object.prototype.hasOwnProperty.call(Reg.DS, src.ds) ? src.ds : P.ds;
      if (v === 'line') { const h = Reg.ptsOk(src.h); P.h = h && h.length === 2 ? h : null; }
      if (v === 'line' || v === 'out') P.dk = typeof src.dk === 'string' ? src.dk : null;
    },
    fix(v, P) {
      const okp = Reg.ptsOk(P.pts); if (!okp || okp.length !== P.pts.length) P.pts = okp || Reg.copy(Reg.DS.learn.pts);
      const e = Reg.ext(P.pts), sn = Reg.snap(P.pts), rx = Math.max(e.x1 - e.x0, sn[0]), ry = Math.max(e.y1 - e.y0, sn[1]), s = Reg.stats(P.pts);
      const num = x => typeof x === 'number' && isFinite(x), cx = (x, k) => kitClamp(x, e.x0 - k * rx, e.x1 + k * rx), cy = (y, k) => kitClamp(y, e.y0 - k * ry, e.y1 + k * ry);
      // Vorhersagestelle, eigene Gerade und Q gehören zu einer Datenreihe (dk); bei einer anderen Reihe beginnen sie neu
      if (v === 'line') {
        const fresh = P.dk !== P.ds; P.dk = P.ds;
        P.x0 = fresh || !num(P.x0) ? Reg.snapTo(e.x0 + rx * 0.7, sn[0]) : cx(P.x0, 1);
        if (fresh || !P.h) P.h = [[Reg.snapTo(e.x0, sn[0]), Reg.snapTo(s.my, sn[1])], [Reg.snapTo(e.x1, sn[0]), Reg.snapTo(s.my, sn[1])]];
        else P.h = P.h.map(h => [cx(h[0], 1.5), cy(h[1], 2.5)]);
      }
      if (v === 'out') {
        const fresh = P.dk !== P.ds; P.dk = P.ds;
        if (fresh || !num(P.qx) || !num(P.qy)) { P.qx = Reg.snapTo(e.x1 + rx * 0.3, sn[0]); P.qy = Reg.snapTo(s.r !== null && s.r < 0 ? e.y1 : e.y0, sn[1]); }
        else { P.qx = cx(P.qx, 3); P.qy = cy(P.qy, 3); }
      }
    },
    extra(v, P, box, api) { regList(box, api, P); },
    scene: { cloud: regSceneCloud, line: regSceneLine, fit: regSceneFit, out: regSceneOut },
    doc: (v, P) => Reg.doc(v, P)
  };
  Object.keys(spec.def).forEach(v => spec.fix(v, spec.def[v]));   // Anfangswerte, die von den Daten abhängen (x₀, Q, eigene Gerade)
  kitDefine(spec);
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { Reg };
