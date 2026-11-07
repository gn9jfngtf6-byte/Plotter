// ═══════════════════════════════════════════════════════════════════
// 43_stat_urn.js — Wahrscheinlichkeit und Statistik: Urnenmodelle (Szenen)
//
// k Kugeln aus einer Urne mit n nummerierten Kugeln. Zwei Fragen legen das Modell fest:
//   Wird zurückgelegt?  Zählt die Reihenfolge?
//     mit Zurücklegen,  mit Reihenfolge  → Variation mit Wiederholung     n^k
//     ohne Zurücklegen, mit Reihenfolge  → Variation ohne Wiederholung    n!/(n−k)!
//     ohne Zurücklegen, ohne Reihenfolge → Kombination ohne Wiederholung  (n über k)
//     mit Zurücklegen,  ohne Reihenfolge → Kombination mit Wiederholung   (n+k−1 über k)
// Rechenkern: 40_stat.js (Stat.urn…). Zwei Ansichten: «one» (eine Variante erklärt) und «cmp» (alle vier nebeneinander).
// Formeln sind Rich-Text (51_fin_draw.js: \frac, \binom, \cdot …), Wörter in Absätzen werden vor dem Umbrechen übersetzt.
// ═══════════════════════════════════════════════════════════════════
const URN_INFO = {
  vmw: { name: 'Variation mit Wiederholung', sub: 'mit Zurücklegen, mit Reihenfolge',
    expl: 'Jede gezogene Kugel wird zurückgelegt, darum hat man bei jedem der k Züge wieder n Möglichkeiten. Die Reihenfolge zählt: (1, 2) und (2, 1) sind verschieden. Multiplikationsprinzip: n · n · … · n mit k Faktoren.' },
  vow: { name: 'Variation ohne Wiederholung', sub: 'ohne Zurücklegen, mit Reihenfolge',
    expl: 'Gezogene Kugeln bleiben draussen. Beim ersten Zug hat man n Möglichkeiten, beim zweiten n − 1, … beim k-ten n − k + 1. Die Reihenfolge zählt. Multiplikationsprinzip: n · (n − 1) · … · (n − k + 1) = n!/(n − k)!.' },
  kow: { name: 'Kombination ohne Wiederholung', sub: 'ohne Zurücklegen, ohne Reihenfolge',
    expl: 'Es zählt nur, welche Kugeln gezogen wurden (wie bei einem Griff in die Urne). Jede Auswahl von k Kugeln lässt sich auf k! Arten anordnen. Darum teilt man die Zahl der Variationen n!/(n − k)! durch k!. Das ist der Binomialkoeffizient «n über k».' },
  kmw: { name: 'Kombination mit Wiederholung', sub: 'mit Zurücklegen, ohne Reihenfolge',
    expl: 'Die Kugeln werden zurückgelegt, aber nur die gezogene Menge zählt: Kugeln dürfen mehrfach vorkommen, die Reihenfolge nicht. Zählen mit Sternen und Strichen: k Kugeln («Sterne») und n − 1 Trennstriche zwischen den n Nummern ergeben n + k − 1 Plätze, auf denen man k für die Sterne wählt.' }
};
const URN_KINDS = ['vow', 'vmw', 'kow', 'kmw'];          // Reihenfolge im Vergleich: ohne Zurücklegen | mit Zurücklegen; je mit | ohne Reihenfolge
const URN_HUES = [ST_B, ST_R, ST_G, ST_O, ST_V, ST_T];
const urnHue = v => URN_HUES[(v - 1) % URN_HUES.length];

// ── Zahlen und Teile für Rich-Text ──
function urnRInt(v) { const s = String(Math.round(v)); return s.length >= 5 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : s; }
function urnPInt(v) { const s = String(Math.round(v)); return s.length >= 5 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s; }
function urnPct(p) {                                     // Prozentzahl mit 2 gültigen Ziffern, ohne Exponentialschreibweise
  const v = p * 100; if (!(v > 0)) return '0';
  const d = v >= 10 ? 1 : Math.min(9, 1 - Math.floor(Math.log10(v)));
  let s = v.toFixed(d); if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, ''); return s;
}
function urnTerms(a, b, max) {                           // a·(a−1)·…·b als Rich-Text, lange Folgen gekürzt
  const t = []; for (let v = a; v >= b; v--) t.push(String(v));
  return t.length <= (max || 4) ? t.join('\\cdot ') : t.slice(0, 2).join('\\cdot ') + '\\cdot\\ldots\\cdot ' + t[t.length - 1];
}
const urnSeq = d => '(' + d.join(',\\,') + ')';
const urnSet = d => '\\{' + d.slice().sort((a, b) => a - b).join(',\\,') + '\\}';

// Formelzeilen für ein Modell: { gen: allgemeine Formel, ins: Einsetzen und Ergebnis, res: Ergebnis }
function urnFormula(kind, n, k) {
  const cnt = Stat.urnCount({ n, k, repl: kind === 'vmw' || kind === 'kmw', ord: kind === 'vmw' || kind === 'vow' }), R = urnRInt(cnt);
  switch (kind) {
    case 'vmw': return { gen: 'n^{k}', ins: '=' + n + '^{' + k + '}=' + R, res: cnt };
    case 'vow': return { gen: '\\frac{n!}{(n-k)!}', ins: '=\\frac{' + n + '!}{' + (n - k) + '!}' + (k > 1 ? '=' + urnTerms(n, n - k + 1) : '') + '=' + R, res: cnt };
    case 'kow': return { gen: '\\binom{n}{k}=\\frac{n!}{k!\\,(n-k)!}', ins: '=\\binom{' + n + '}{' + k + '}=\\frac{' + urnTerms(n, n - k + 1) + '}{' + urnTerms(k, 1) + '}=' + R, res: cnt };
    default: return { gen: '\\binom{n+k-1}{k}', ins: '=\\binom{' + n + '+' + k + '-1}{' + k + '}=\\binom{' + (n + k - 1) + '}{' + k + '}=' + R, res: cnt };
  }
}

// ── Bausteine ──
function urnBall(S, x, y, r, v, o) {
  o = o || {};
  if (o.ghost) { S.circ(x, y, r, { stroke: 'M', lw: 1.2, dash: true, a: 0.7 }); S.text(x, y, String(v), { size: r * 0.95, col: 'M', al: 'c', bs: 'm' }); return; }
  S.circ(x, y, r, { fill: urnHue(v), a: 0.92, stroke: o.ring ? ST_V : undefined, lw: o.ring ? 2.5 : 1 });
  S.text(x, y, String(v), { size: r * 1.0, col: '#ffffff', al: 'c', bs: 'm', bold: true });
}
// Absatz mit Zeilenumbruch: erst übersetzen, dann umbrechen (fertige Zeilen werden nicht nochmals übersetzt)
function urnPara(S, x, y, w, text, size, o) {
  o = o || {}; const tr = typeof statTr === 'function' ? statTr(text) : text, words = String(tr).split(/\s+/), lines = []; let cur = '';
  words.forEach(wd => { const t = cur ? cur + ' ' + wd : wd; if (cur && finMeasure(t, size, !!o.bold) > w) { lines.push(cur); cur = wd; } else cur = t; });
  if (cur) lines.push(cur);
  lines.forEach((ln, i) => S.text(x, y + size * (0.7 + 1.4 * i), ln, { size, col: o.col || 'T', al: 'l', bs: 'm', bold: !!o.bold, notr: true }));
  return y + size * 1.4 * lines.length + size * 0.1;
}
// Rich-Zeile, die bei Bedarf verkleinert wird, damit sie in die Breite passt; liefert die Höhe der Zeile
function urnRich(S, x, y, s, size, maxW, o) {
  const m = finRichSize(s, size), f = m.w > maxW ? maxW / m.w : 1, sz = size * Math.max(0.6, f);
  S.rich(x, y, s, Object.assign({ size: sz, col: 'T', al: 'l', bs: 't' }, o || {}));
  return (m.a + m.d) * Math.max(0.6, f);
}

// ── Urne mit Kugeln und gezogenem Ergebnis ──
function urnPicture(S, r, C) {
  const P = C.P, fs = C.fs, n = P.n, k = P.k, draw = C.D.draw || [], kind = Stat.urnKind(P);
  S.text(r.x + r.w / 2, r.y + fs * 0.9, k === 1 ? 'Urne mit ' + n + ' Kugeln, eine wird gezogen' : 'Urne mit ' + n + ' Kugeln, ' + k + ' werden gezogen', { size: fs * 0.95, col: 'T', al: 'c', bs: 'm', bold: true });
  const uh = Math.min((r.h - fs * 2) * 0.42, r.w * 0.42), uw = Math.min(r.w * 0.55, uh * 1.25), ux = r.x + (r.w - uw) / 2, uy = r.y + fs * 2.1;
  S.rect(ux, uy + uh * 0.1, uw, uh * 0.9, { fill: 'G', a: 0.28, stroke: 'L', lw: 2, r: uw * 0.1 });
  S.rect(ux - uw * 0.04, uy, uw * 1.08, uh * 0.11, { fill: 'G', a: 0.5, stroke: 'L', lw: 2, r: 3 });
  const cols = n <= 4 ? n : n <= 8 ? 4 : 5, rows = Math.ceil(n / cols), br = Math.min(uw / (cols * 2 + 1.4), uh * 0.84 / (rows * 2 + 0.6)), gx = uw / cols;
  const drawn = {}; draw.forEach(v => { drawn[v] = true; });
  for (let v = 1; v <= n; v++) {
    const i = v - 1, row = Math.floor(i / cols), inRow = row === rows - 1 ? n - row * cols : cols, col = i % cols;
    const x = ux + uw / 2 + (col - (inRow - 1) / 2) * gx, y = uy + uh - br * 1.2 - row * br * 1.95;
    urnBall(S, x, y, br, v, { ghost: !P.repl && drawn[v], ring: P.repl && drawn[v] });
  }
  // Pfeile: ziehen (nach unten), zurücklegen (nach oben)
  const ay0 = uy + uh + fs * 0.2, ay1 = ay0 + fs * 2.2, ax = ux + uw * (P.repl ? 0.36 : 0.5), arrow = (x, a, b, lab, left, col) => {
    S.line(x, a, x, b, { col, lw: 2 }); const d = b > a ? 1 : -1; S.poly([[x - 5, b - d * 8], [x, b], [x + 5, b - d * 8]], { col, lw: 2, close: false });
    S.text(x + (left ? -8 : 8), (a + b) / 2, lab, { size: fs * 0.82, col, al: left ? 'r' : 'l', bs: 'm' });
  };
  arrow(ax, ay0, ay1, 'ziehen', true, 'M');
  if (P.repl) arrow(ux + uw * 0.64, ay1, ay0, 'zurücklegen', false, ST_V);
  // Ergebnis: Folge (Plätze 1., 2., …) oder Menge
  const ss = Math.max(fs * 1.6, Math.min(r.w / (k + 0.6) * 0.82, fs * 3.4, r.y + r.h - (ay1 + fs * 0.5) - fs * 4.8)), gap = ss * 0.22, tot = k * ss + (k - 1) * gap, sy = ay1 + fs * 0.5;
  const x0 = r.x + (r.w - tot) / 2, ordered = P.ord, shown = ordered ? draw : draw.slice().sort((a, b) => a - b);
  if (ordered) {
    shown.forEach((v, i) => {
      const cx = x0 + i * (ss + gap) + ss / 2;
      S.rect(cx - ss / 2, sy, ss, ss, { stroke: 'L', lw: 1.5, r: ss * 0.14, fill: 'G', a: 0.2 });
      urnBall(S, cx, sy + ss / 2, ss * 0.38, v, {});
      S.text(cx, sy + ss + fs * 0.75, (i + 1) + '.', { size: fs * 0.8, col: 'M', al: 'c', bs: 'm' });
    });
  } else {
    S.rect(x0 - ss * 0.3, sy, tot + ss * 0.6, ss, { stroke: ST_V, lw: 2, r: ss * 0.5, fill: ST_V, a: 0.07 });
    shown.forEach((v, i) => urnBall(S, x0 + i * (ss + gap) + ss / 2, sy + ss / 2, ss * 0.38, v, {}));
  }
  const capY = sy + ss + fs * (ordered ? 2.3 : 1.1);
  S.text(r.x + r.w / 2, capY, ordered ? 'Folge der gezogenen Kugeln (Reihenfolge zählt)' : 'Menge der gezogenen Kugeln (Reihenfolge egal)', { size: fs * 0.85, col: 'M', al: 'c', bs: 'm' });
  S.rich(r.x + r.w / 2, capY + fs * 1.8, ordered ? urnSeq(draw) : urnSet(draw), { size: fs * 1.15, col: ST_V, al: 'c', bs: 'm', bold: true });
}

// ── Erklärung, Formel und Wahrscheinlichkeit einer Variante ──
function urnText(S, r, C, fs) {
  const P = C.P, n = P.n, k = P.k, draw = C.D.draw || [], kind = Stat.urnKind(P), info = URN_INFO[kind], F = urnFormula(kind, n, k), pr = Stat.urnProb(P, draw), pv = pr.num / pr.den;
  let y = r.y; const x = r.x + fs * 0.3, w = r.w - fs * 0.6;
  S.text(x, y + fs * 0.8, info.name, { size: fs * 1.25, col: 'T', al: 'l', bs: 'm', bold: true }); y += fs * 1.7;
  S.text(x, y + fs * 0.5, info.sub, { size: fs * 0.9, col: ST_V, al: 'l', bs: 'm', bold: true }); y += fs * 1.6;
  y = urnPara(S, x, y, w, info.expl, fs * 0.92, { col: 'M' }) + fs * 0.7;
  S.text(x, y + fs * 0.5, 'Anzahl Möglichkeiten:', { size: fs * 0.92, col: 'T', al: 'l', bs: 'm', bold: true }); y += fs * 1.5;
  y += urnRich(S, x, y + fs * 0.2, F.gen, fs * 1.2, w) + fs * 0.9;
  y += urnRich(S, x, y, F.ins, fs * 1.2, w, { bold: false }) + fs * 0.9;
  if (kind === 'vow' && k === n) { S.text(x, y + fs * 0.4, 'k = n: Alle Kugeln werden gezogen (Permutation).', { size: fs * 0.85, col: 'M', al: 'l', bs: 'm' }); y += fs * 1.4; }
  y += fs * 0.5;
  S.text(x, y + fs * 0.5, 'Wahrscheinlichkeit für das gezogene Ergebnis:', { size: fs * 0.92, col: 'T', al: 'l', bs: 'm', bold: true }); y += fs * 1.6;
  if (kind === 'kmw') {
    y = urnPara(S, x, y, w, 'Die Möglichkeiten sind nicht gleich wahrscheinlich: Mengen mit verschiedenen Kugeln kommen häufiger vor.', fs * 0.85, { col: 'M' }) + fs * 0.4;
    const c = Stat.urnMult(P, draw).filter(v => v > 0), den = urnRInt(pr.den);
    const dn = c.filter(v => v > 1).map(v => v + '!').join('\\cdot '), mult = dn ? '\\frac{' + k + '!}{' + dn + '}' : k + '!';
    y += urnRich(S, x, y, 'P=' + mult + '\\cdot\\frac{1}{' + n + '^{' + k + '}}=\\frac{' + pr.num + '}{' + den + '}\\approx\\col{v}{' + urnPct(pv) + '\\,\\%}', fs * 1.1, w) + fs * 0.3;
  } else {
    y = urnPara(S, x, y, w, 'Alle ' + urnPInt(pr.den) + ' Möglichkeiten sind gleich wahrscheinlich.', fs * 0.85, { col: 'M' }) + fs * 0.4;
    y += urnRich(S, x, y, 'P=\\frac{1}{' + urnRInt(pr.den) + '}\\approx\\col{v}{' + urnPct(pv) + '\\,\\%}', fs * 1.2, w) + fs * 0.3;
  }
  return y - r.y;
}

// ── Einzelne Variante ──
function stSceneUrnOne(S, W, H, C) {
  const R = stLayout(W, H, [{ w: 0.46, rows: [1.15] }, { w: 0.54, rows: [1] }]);
  urnPicture(S, R[0], C);
  const r = R[1]; let fs = C.fs * 1.05;
  for (let it = 0; it < 3; it++) {                    // Schrift so wählen, dass die Texte in die Fläche passen
    const t = stScene(); const h = urnText(t, r, C, fs);
    if (h <= r.h * 0.98) break; fs *= Math.max(0.6, r.h * 0.96 / h);
  }
  urnText(S, r, C, fs);
}

// ── Vergleich aller vier Modelle ──
function stSceneUrnCmp(S, W, H, C) {
  const P = C.P, fs = C.fs, n = P.n, k = P.k, cur = Stat.urnKind(P), pad = Math.round(fs * 0.8);
  S.text(W / 2, pad + fs * 0.4, 'Die vier Urnenmodelle im Vergleich: ' + n + ' Kugeln, ' + k + ' werden gezogen', { size: fs * 1.05, col: 'T', al: 'c', bs: 'm', bold: true });
  const wide = W >= 820, gy = pad * 1.3 + fs * 1.6, hdr = wide ? fs * 2.2 : 0, band = fs * 2.0, foot = fs * 8.2;
  const cw = wide ? (W - 3 * pad) / 2 : W - 2 * pad, ch = wide ? (H - gy - foot - hdr - 2 * band - pad) / 2 : (H - gy - foot - 4 * band - pad * 3) / 4;
  const x0 = pad, y0 = gy + hdr;
  const rowY = i => (wide ? y0 + band + i * (ch + band + pad / 2) : gy + band + i * (ch + band + pad / 3));
  if (wide) ['mit Reihenfolge', 'ohne Reihenfolge'].forEach((t, j) => S.text(x0 + j * (cw + pad) + cw / 2, gy + hdr / 2, t, { size: fs * 0.95, col: 'M', al: 'c', bs: 'm', bold: true }));
  (wide ? ['ohne Zurücklegen', 'mit Zurücklegen'] : []).forEach((t, i) => S.text(x0, rowY(i) - band / 2, t, { size: fs * 0.95, col: 'M', al: 'l', bs: 'm', bold: true }));
  const counts = {};
  URN_KINDS.forEach((kind, idx) => {
    // vow (0): oben links, vmw (1): unten links, kow (2): oben rechts, kmw (3): unten rechts
    const i = wide ? idx % 2 : idx, j = wide ? (idx >> 1) : 0, x = wide ? x0 + j * (cw + pad) : x0, y = rowY(i);
    const info = URN_INFO[kind], on = kind === cur, repl = kind === 'vmw' || kind === 'kmw', ord = kind === 'vmw' || kind === 'vow', Q = { n, k, repl: repl ? 1 : 0, ord: ord ? 1 : 0 };
    const possible = repl || k <= n, F = possible ? urnFormula(kind, n, k) : null; counts[kind] = possible ? F.res : 0;
    S.rect(x, y, cw, ch, { fill: on ? ST_V : 'G', a: on ? 0.1 : 0.14, stroke: on ? ST_V : 'L', lw: on ? 2.5 : 1, r: 8 });
    S.text(x + fs * 0.7, y + fs * 1.1, info.name, { size: fs * 0.98, col: on ? ST_V : 'T', al: 'l', bs: 'm', bold: true });
    S.text(x + fs * 0.7, y + fs * 2.4, info.sub, { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
    if (!possible) { S.text(x + fs * 0.7, y + ch * 0.62, 'nicht möglich (k > n)', { size: fs * 0.95, col: ST_R, al: 'l', bs: 'm', bold: true }); return; }
    const rg = Stat.makeRng(7919 * n + 104729 * k + (idx + 1) * 31), ex = Stat.urnDraw(Q, rg), mw = cw - fs * 1.4;
    const fy = y + fs * 3.3, used = urnRich(S, x + fs * 0.7, fy, F.gen, fs * 1.05, mw);
    urnRich(S, x + fs * 0.7, fy + used + fs * 0.4, F.ins, fs * 1.05, mw);
    const rowEnd = y + ch - fs * 0.6;
    S.rich(x + fs * 0.7, rowEnd - fs * 0.2, '\\col{v}{' + urnRInt(F.res) + '}', { size: fs * 1.35, col: 'T', al: 'l', bs: 'b', bold: true });
    S.text(x + cw - fs * 0.7, rowEnd - fs * 2.2, 'Beispiel:', { size: fs * 0.78, col: 'M', al: 'r', bs: 'b' });
    S.rich(x + cw - fs * 0.7, rowEnd - fs * 0.2, ord ? urnSeq(ex) : urnSet(ex), { size: fs * 0.98, col: 'T', al: 'r', bs: 'b' });
  });
  // Zusammenhänge
  const fy = rowY(wide ? 1 : 3) + ch + fs * 0.7, mw = W - 2 * pad;
  if (k <= n) {
    const lineA = 'k!\\cdot\\binom{' + n + '}{' + k + '}=' + urnRInt(Stat.fact(k)) + '\\cdot' + urnRInt(counts.kow) + '=' + urnRInt(counts.vow);
    const hA = urnPara(S, pad, fy, mw, 'Ohne Zurücklegen: Jede Auswahl lässt sich auf k! Arten anordnen. Variationen = k! · Kombinationen:', fs * 0.88, { col: 'M' });
    urnRich(S, pad + fs * 0.3, hA, lineA, fs * 1.05, mw);
  } else urnPara(S, pad, fy, mw, 'Ohne Zurücklegen kann man nicht mehr Kugeln ziehen, als in der Urne liegen (k ≤ n).', fs * 0.88, { col: 'M' });
  urnPara(S, pad, fy + fs * 5.6, mw, 'Mit Zurücklegen gibt es meistens mehr Möglichkeiten als ohne.', fs * 0.88, { col: 'M' });
}

ST_SCENES.urn = (S, W, H, C) => { if (C.P.view === 'cmp') stSceneUrnCmp(S, W, H, C); else stSceneUrnOne(S, W, H, C); };
