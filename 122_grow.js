// ═══════════════════════════════════════════════════════════════════
// 122_grow.js — Wachstumsmodelle (Thema aus dem Baukasten 120_kit.js)
//
// Grow: Rechenkern ohne DOM (vier Modelle, Kennzeiten, Abweichung von Daten, Rechenwege).
// Zeit in Schritten (eine Zeiteinheit): linear B₀ + k·t, exponentiell B₀·qᵗ, beschränkt
// S − (S − B₀)·(1 − k)ᵗ, logistisch S / (1 + a·e^(−k·t)).
// ═══════════════════════════════════════════════════════════════════
const Grow = (function () {
  const fmtD = (v, d) => { const s = String(parseFloat((+v).toFixed(d))); return s === '-0' ? '0' : s; };
  function fmt(v) {
    if (!isFinite(v)) return '?';
    const a = Math.abs(v);
    if (a >= 1e7) { const e = Math.floor(Math.log10(a)); return fmtD(v / Math.pow(10, e), 2) + '\\cdot 10^{' + e + '}'; }
    return fmtD(v, a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : 3);
  }
  const eq = v => { const s = fmt(v); return (s.indexOf('cdot') < 0 && Math.abs(v - parseFloat(s)) < 1e-9 * Math.max(1, Math.abs(v)) ? '=' : '\\approx ') + s; };
  const pn = v => (v < 0 ? '(' + fmt(v) + ')' : fmt(v));
  const sg = v => (v < 0 ? '-' : '+') + fmt(Math.abs(v));
  const M = {
    lin: P => t => P.B0 + P.k * t,
    exp: P => t => P.B0 * Math.pow(1 + P.p / 100, t),
    bnd: P => t => P.S - (P.S - P.B0) * Math.pow(1 - P.k / 100, t),
    log: P => t => P.S / (1 + (P.S - P.B0) / P.B0 * Math.exp(-P.k * t))
  };
  // Änderungsrate in Abhängigkeit vom Bestand (Richtungsfeld)
  const RATE = {
    lin: P => () => P.k, exp: P => B => Math.log(1 + P.p / 100) * B,
    bnd: P => B => -Math.log(1 - P.k / 100) * (P.S - B), log: P => B => P.k * B * (1 - B / P.S)
  };
  const tDouble = p => (p ? Math.log(p > 0 ? 2 : 0.5) / Math.log(1 + p / 100) : null);     // Verdopplungs- bzw. Halbwertszeit
  const tHalfGap = k => Math.log(0.5) / Math.log(1 - k / 100);                              // Halbwertszeit des Abstands zur Schranke
  const tTurn = P => { const a = (P.S - P.B0) / P.B0; return a > 1 ? Math.log(a) / P.k : null; };   // Wendepunkt (nur wenn B₀ < S/2)
  // Messreihen [t, B] für den Vergleich
  const DATA = {
    sun: { name: 'Sonnenblume: Höhe in cm nach t Wochen', pts: [[1, 17.93], [2, 36.36], [3, 67.76], [4, 98.1], [5, 131], [6, 169.5], [7, 205.5], [8, 228.3], [9, 247.1], [10, 250.5], [11, 253.8], [12, 254.5]] },
    bak: { name: 'Bakterienkultur: Anzahl nach t Stunden', pts: [[0, 100], [1, 135], [2, 180], [3, 245], [4, 330], [5, 445], [6, 600]] },
    kaffee: { name: 'Kaffee: Temperatur in °C nach t Minuten', pts: [[0, 80], [5, 62], [10, 49.5], [15, 40], [20, 34.5], [30, 27], [40, 23]] },
    kerze: { name: 'Kerze: Länge in mm nach t Minuten', pts: [[0, 200], [10, 184], [20, 169], [30, 152], [40, 137], [50, 121], [60, 105]] }
  };
  const dev = (f, pts) => pts.reduce((s, q) => s + Math.abs(f(q[0]) - q[1]), 0) / pts.length;   // mittlere Abweichung
  const cmpFns = P => ({ lin: M.lin({ B0: P.B0, k: P.k }), exp: M.exp({ B0: P.B0, p: P.p }), bnd: M.bnd({ B0: P.B0, S: P.S, k: P.kb }), log: M.log({ B0: P.B0, S: P.S, k: P.kl }) });
  const CMP = [['lin', 'sl', 'b', 'linear'], ['exp', 'se', 'r', 'exponentiell'], ['bnd', 'sb', 'g', 'beschränkt'], ['log', 'sg', 'v', 'logistisch']];
  // Ausschnitt: Zeit 0 … N, Bestand so, dass alle Werte (und die Schranke) hineinpassen
  function win(N, vals) {
    let lo = 0, hi = 0; vals.forEach(v => { if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    if (hi - lo < 1e-9) hi = lo + 1;
    const pad = (hi - lo) * 0.1;
    return { x0: -N * 0.04, x1: N * 1.03, y0: lo - pad * (lo < 0 ? 1 : 0.45), y1: hi + pad };
  }
  const sample = (f, N) => { const o = []; for (let i = 0; i <= 80; i++) o.push(f(N * i / 80)); return o; };
  // Formeln der Modelle (LaTeX)
  const T = {
    lin: P => fmt(P.B0) + sg(P.k) + '\\cdot t',
    exp: P => fmt(P.B0) + '\\cdot ' + fmt(1 + P.p / 100) + '^{t}',
    bnd: P => fmt(P.S) + sg(-(P.S - P.B0)) + '\\cdot ' + fmt(1 - P.k / 100) + '^{t}',
    log: P => '\\frac{' + fmt(P.S) + '}{1' + sg((P.S - P.B0) / P.B0) + '\\cdot e^{-' + fmt(P.k) + '\\,t}}'
  };

  // ── Rechenwege ──
  const mk = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const stepsOf = (f, L) => L.map(t => 'B(' + fmt(t) + ')' + eq(f(t))).join(',\\quad ');
  const steps = (B, f, sc) => { B.e(stepsOf(f, [0, 1]), sc); B.e(stepsOf(f, [2, 3]), sc); };
  function docLin(P) {
    const B = mk(), f = M.lin(P), t = Math.min(P.t, P.N);
    B.p('**Lineares Wachstum:** In gleichen Zeitschritten ändert sich der Bestand immer um denselben Betrag $k$. Für $k<0$ nimmt er ab.');
    B.e('B(t+1)=B(t)+k,\\qquad B(t)=B_0+k\\cdot t=' + T.lin(P), 'b');
    B.p('**Schritt für Schritt:** Jeder Wert entsteht aus dem vorigen durch Addieren von $k$.');
    steps(B, f, 'g');
    B.p('**Wert zu einem beliebigen Zeitpunkt:** $t$ in die Formel einsetzen.');
    B.e('B(' + fmt(t) + ')=' + fmt(P.B0) + '+' + pn(P.k) + '\\cdot ' + fmt(t) + eq(f(t)), 'v');
    if (P.k < 0 && P.B0 > 0) { B.p('**Aufgebraucht:** Der Bestand ist 0, wenn $B_0+k\\cdot t=0$ gilt.'); B.e('t=-\\frac{B_0}{k}=-\\frac{' + fmt(P.B0) + '}{' + fmt(P.k) + '}' + eq(-P.B0 / P.k)); }
    B.res('Die Punkte liegen auf einer Geraden mit der Steigung $k=' + fmt(P.k) + '$ und dem Anfangswert $B_0=' + fmt(P.B0) + '$');
    return { title: 'Lineares Wachstum', st: B.st };
  }
  function docExp(P) {
    const B = mk(), f = M.exp(P), q = 1 + P.p / 100, t = Math.min(P.t, P.N), T2 = tDouble(P.p);
    B.p('**Exponentielles Wachstum:** In gleichen Zeitschritten wird der Bestand immer mit demselben Faktor $q$ multipliziert. Der Zuwachs ist darum proportional zum Bestand.');
    B.e('q=1+\\frac{p}{100}=1+\\frac{' + fmt(P.p) + '}{100}=' + fmt(q), 'b');
    B.e('B(t+1)=q\\cdot B(t),\\qquad B(t)=B_0\\cdot q^t=' + T.exp(P), 'b');
    B.p('**Schritt für Schritt:** Jeder Wert entsteht aus dem vorigen durch Multiplizieren mit $q$.');
    steps(B, f, 'g');
    B.p('**Wert zu einem beliebigen Zeitpunkt:** $t$ in die Formel einsetzen.');
    B.e('B(' + fmt(t) + ')=' + fmt(P.B0) + '\\cdot ' + fmt(q) + '^{' + fmt(t) + '}' + eq(f(t)), 'v');
    if (T2 === null) B.note('Für $p=0$ ist $q=1$: Der Bestand bleibt konstant.');
    else {
      B.p(P.p > 0 ? '**Verdopplungszeit:** Sie hängt nur vom Faktor $q$ ab, nicht vom Anfangswert.' : '**Halbwertszeit:** Sie hängt nur vom Faktor $q$ ab, nicht vom Anfangswert.');
      B.e('q^{T}=' + (P.p > 0 ? '2' : '\\frac12') + '\\quad\\Rightarrow\\quad T=\\frac{\\ln ' + (P.p > 0 ? '2' : '0.5') + '}{\\ln ' + fmt(q) + '}' + eq(T2), 'o');
    }
    B.res(P.p > 0 ? 'Der Bestand wächst pro Zeitschritt um $' + fmt(P.p) + '\\,\\%$ und verdoppelt sich alle $' + fmt(T2) + '$ Zeitschritte' : P.p < 0 ? 'Der Bestand nimmt pro Zeitschritt um $' + fmt(-P.p) + '\\,\\%$ ab und halbiert sich alle $' + fmt(T2) + '$ Zeitschritte' : 'Der Bestand bleibt bei $' + fmt(P.B0) + '$');
    return { title: 'Exponentielles Wachstum', st: B.st };
  }
  function docBnd(P) {
    const B = mk(), f = M.bnd(P), k = P.k / 100, t = Math.min(P.t, P.N), D = P.S - P.B0;
    B.p('**Beschränktes Wachstum:** Der Bestand nähert sich einer Schranke $S$. In jedem Zeitschritt kommt derselbe Anteil $k$ des Abstands zur Schranke dazu.');
    B.e('B(t+1)=B(t)+k\\cdot\\big(S-B(t)\\big)=B(t)+' + fmt(k) + '\\cdot\\big(' + fmt(P.S) + '-B(t)\\big)', 'b');
    B.p('**Abstand zur Schranke:** Er schrumpft in jedem Schritt mit dem Faktor $1-k$, also exponentiell.');
    B.e('S-B(t)=(S-B_0)\\cdot(1-k)^t\\quad\\Rightarrow\\quad B(t)=' + T.bnd(P), 'b');
    B.p('**Schritt für Schritt:**');
    steps(B, f, 'g');
    B.p('**Wert zu einem beliebigen Zeitpunkt:** $t$ in die Formel einsetzen.');
    B.e('B(' + fmt(t) + ')=' + fmt(P.S) + '-' + pn(D) + '\\cdot ' + fmt(1 - k) + '^{' + fmt(t) + '}' + eq(f(t)), 'v');
    if (Math.abs(D) < 1e-9) B.note('Der Anfangswert liegt genau auf der Schranke: Der Bestand ändert sich nicht.');
    else {
      B.p('**Halbwertszeit des Abstands:** Nach dieser Zeit ist der Abstand zur Schranke jeweils nur noch halb so gross.');
      B.e('(1-k)^{T}=\\frac12\\quad\\Rightarrow\\quad T=\\frac{\\ln 0.5}{\\ln ' + fmt(1 - k) + '}' + eq(tHalfGap(P.k)), 'o');
    }
    B.res(Math.abs(D) < 1e-9 ? 'Der Bestand bleibt bei $S=' + fmt(P.S) + '$' : 'Der Bestand nähert sich der Schranke $S=' + fmt(P.S) + '$ von ' + (D > 0 ? 'unten' : 'oben') + ', ohne sie zu erreichen');
    return { title: 'Beschränktes Wachstum', st: B.st };
  }
  function docLog(P) {
    const B = mk(), f = M.log(P), a = (P.S - P.B0) / P.B0, t = Math.min(P.t, P.N), tw = tTurn(P);
    B.p('**Logistisches Wachstum:** Anfangs wächst der Bestand fast exponentiell, dann bremst die Schranke $S$. Die Änderungsrate ist proportional zum Bestand und zum noch freien Anteil.');
    B.e('B\'(t)=k\\cdot B(t)\\cdot\\left(1-\\frac{B(t)}{S}\\right)', 'b');
    B.e('B(t)=\\frac{S}{1+a\\cdot e^{-k\\,t}}\\quad\\text{mit}\\quad a=\\frac{S-B_0}{B_0}', 'b');
    B.e('a=\\frac{' + fmt(P.S) + '-' + fmt(P.B0) + '}{' + fmt(P.B0) + '}' + eq(a), 'b');
    B.p('**Werte:** $t$ in die Formel einsetzen.');
    steps(B, f, 'g');
    B.e('B(' + fmt(t) + ')=' + T.log(P).replace('\\,t}', '\\cdot ' + fmt(t) + '}') + eq(f(t)), 'v');
    if (tw !== null) {
      B.p('**Wendepunkt:** Am schnellsten wächst der Bestand, wenn er die halbe Schranke erreicht. Danach wird die Kurve wieder flacher.');
      B.e('B(t_W)=\\frac{S}{2}=' + fmt(P.S / 2) + '\\quad\\text{bei}\\quad t_W=\\frac{\\ln a}{k}=\\frac{\\ln ' + fmt(a) + '}{' + fmt(P.k) + '}' + eq(tw), 'r');
    } else if (a > 0) B.note('Der Anfangswert liegt schon über der halben Schranke: Das Wachstum wird von Anfang an langsamer.');
    else if (a < 0) B.note('Der Anfangswert liegt über der Schranke: Der Bestand nimmt ab und nähert sich $S$ von oben.');
    else B.note('Der Anfangswert liegt genau auf der Schranke: Der Bestand ändert sich nicht.');
    B.res('S-förmige Kurve von $B_0=' + fmt(P.B0) + '$ zur Schranke $S=' + fmt(P.S) + '$');
    return { title: 'Logistisches Wachstum', st: B.st };
  }
  function docCmp(P) {
    const B = mk(), F = cmpFns(P), D = DATA[P.data], on = CMP.filter(c => P[c[1]]);
    const par = { lin: { B0: P.B0, k: P.k }, exp: { B0: P.B0, p: P.p }, bnd: { B0: P.B0, S: P.S, k: P.kb }, log: { B0: P.B0, S: P.S, k: P.kl } };
    B.p('**Gleicher Anfangswert, verschiedene Modelle:**');
    if (!on.length) B.note('Schalte links mindestens ein Modell ein.');
    on.forEach(c => B.e('\\text{' + c[3] + ':}\\quad B(t)=' + T[c[0]](par[c[0]]), c[2]));
    B.p('**Woran man sie unterscheidet:** linear: gleiche Differenzen in gleichen Zeitschritten; exponentiell: gleiche Quotienten; beschränkt: der Abstand zur Schranke hat gleiche Quotienten; logistisch: S-förmig, erst fast exponentiell, dann beschränkt.');
    if (on.length) {
      B.p('**Werte im Vergleich:** am Anfang, in der Mitte und am Ende des Zeitraums.');
      on.forEach(c => B.e(stepsOf(F[c[0]], [0, P.N / 2, P.N]), c[2]));
    }
    if (D && on.length) {
      B.p('**Abweichung von den Daten:** Für jedes Modell wird der mittlere Abstand zwischen Messwert und Modellwert berechnet. Je kleiner, desto besser passt das Modell.');
      const L = on.map(c => [c, dev(F[c[0]], D.pts)]).sort((x, y) => x[1] - y[1]);
      L.forEach(q => B.e('\\text{' + q[0][3] + ':}\\quad ' + fmt(q[1]), q[0][2]));
      B.res('Mit diesen Einstellungen passt das Modell «' + L[0][0][3] + '» am besten');
    }
    return { title: 'Modelle vergleichen', st: B.st };
  }
  const doc = (v, P) => ({ lin: docLin, exp: docExp, bnd: docBnd, log: docLog, cmp: docCmp })[v](P);
  return { fmt, eq, M, RATE, T, DATA, CMP, dev, cmpFns, win, sample, tDouble, tHalfGap, tTurn, doc };
})();

// ── Bilder ──
// Richtungsfeld: kurze Striche mit der Steigung, die zum Bestand gehört
function growField(S, m, rate, C) {
  const nx = Math.max(6, Math.round((m.R - m.L) / (C.fs * 3.2))), ny = Math.max(5, Math.round((m.B - m.T) / (C.fs * 2.6))), L = C.fs * 0.85;
  const sx = (m.R - m.L) / (m.win.x1 - m.win.x0), sy = (m.B - m.T) / (m.win.y1 - m.win.y0);
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
    const px = m.L + (m.R - m.L) * (i + 0.5) / (nx + 1), py = m.T + (m.B - m.T) * (j + 0.5) / (ny + 1), k = rate(m.IY(py)); if (!isFinite(k)) continue;
    const vx = sx, vy = -k * sy, n = Math.hypot(vx, vy) || 1;
    S.line(px - vx / n * L / 2, py - vy / n * L / 2, px + vx / n * L / 2, py + vy / n * L / 2, { col: 'M', lw: 1.1, a: 0.6 });
  }
}
// Gemeinsames Bild der vier Einzelmodelle: Rahmen, Schranke, Stufen, Kurve, Punkte, Anfangswert, ziehbarer Punkt P
function growBase(S, W, H, C, kind, o) {
  const P = C.P, fs = C.fs, N = P.N, f = Grow.M[kind](P), t = Math.min(P.t, N), y = f(t), F = Grow.fmt;
  const win = Grow.win(N, Grow.sample(f, N).concat(o.S !== undefined ? [o.S] : []));
  const m = kitFrame(S, { x: fs * 0.4, y: fs * 0.3, w: W - fs * 0.8, h: H - fs * 0.6 }, C, win, { xlab: 't', ylab: 'B', title: '\\col{b}{B(t)=' + Grow.T[kind](P) + '}', info: '\\col{v}{B(' + F(t) + ')' + Grow.eq(y) + '}' });
  if (P.field) growField(S, m, Grow.RATE[kind](P), C);
  if (o.S !== undefined) { difSeg(S, m, m.win.x0, o.S, m.win.x1, o.S, { col: ST_R, lw: 1.6, dash: [6, 4], hl: 'S' }); difLabel(S, m, m.R - fs * 3, m.Y(o.S) + (P.B0 <= o.S ? -1 : 1) * fs * 0.85, '\\col{r}{S=' + F(o.S) + '}', C, {}); }
  if (P.steps && N <= 40) for (let i = 0; i < N; i++) { const a = f(i), b = f(i + 1); difSeg(S, m, i, a, i + 1, a, { col: 'M', lw: 1 }); difSeg(S, m, i + 1, a, i + 1, b, { col: ST_G, lw: 2.6, hl: 'step' }); }
  if (o.extra) o.extra(m, f);
  difCurve(S, m, difRaw(f, o.raw), { col: ST_B, hl: 'f', exp: C.exp });
  if (N <= 40) for (let i = 0; i <= N; i++) { const q = difDot(S, m, i, f(i), { fill: ST_B, r: 3.2 }); if (q) shlC(S, 'pts', q[0], q[1], 8); }
  const q0 = difDot(S, m, 0, f(0), { fill: ST_O, r: 5 });
  if (q0) { shlC(S, 'B0', q0[0], q0[1], 12); difLabel(S, m, q0[0] + fs * 3, q0[1] + (f(Math.min(1, N)) >= f(0) ? 1 : -1) * fs * 1.0, '\\col{o}{B_0=' + F(f(0)) + '}', C, {}); }
  difSeg(S, m, t, 0, t, y, { col: ST_V, lw: 1.2, dash: [4, 4] }); difSeg(S, m, 0, y, t, y, { col: ST_V, lw: 1.2, dash: [4, 4] });
  kitDragPt(S, m, C, 'P', t, y, { col: ST_V, hl: 'P', step: 0.5 }, x => { P.t = kitClamp(x, 0, P.N); });
  if (difInside(m, m.X(t), m.Y(y), 2)) difLabel(S, m, m.X(t) - fs * 0.9, m.Y(y) - fs * 1.1, '\\col{v}{P}', C, {});
  return m;
}
const growRN = v => difRN(kitR(v, 9));
function growSceneLin(S, W, H, C) { const P = C.P; growBase(S, W, H, C, 'lin', { raw: growRN(P.B0) + '+' + growRN(P.k) + '*x' }); }
function growSceneExp(S, W, H, C) {
  const P = C.P, fs = C.fs, q = 1 + P.p / 100, T2 = Grow.tDouble(P.p);
  growBase(S, W, H, C, 'exp', { raw: growRN(P.B0) + '*' + growRN(q) + '^x', extra: (m, f) => {
    if (T2 === null || T2 > P.N) return; const tv = P.B0 * (P.p > 0 ? 2 : 0.5);
    difSeg(S, m, 0, tv, T2, tv, { col: ST_O, lw: 1.3, dash: [5, 4], hl: 'T2' }); difSeg(S, m, T2, 0, T2, tv, { col: ST_O, lw: 1.3, dash: [5, 4], hl: 'T2' });
    difLabel(S, m, m.X(T2) + fs * 2.4, m.Y(0) - fs * 0.9, '\\col{o}{T' + Grow.eq(T2) + '}', C, {});
  } });
}
function growSceneBnd(S, W, H, C) { const P = C.P; growBase(S, W, H, C, 'bnd', { S: P.S, raw: growRN(P.S) + '-' + growRN(P.S - P.B0) + '*' + growRN(1 - P.k / 100) + '^x' }); }
function growSceneLog(S, W, H, C) {
  const P = C.P, fs = C.fs, tw = Grow.tTurn(P), a = (P.S - P.B0) / P.B0;
  const m = growBase(S, W, H, C, 'log', { S: P.S, raw: growRN(P.S) + '/(1+' + growRN(a) + '*exp(-' + growRN(P.k) + '*x))' });
  if (tw === null || tw > P.N) return;
  difSeg(S, m, 0, P.S / 2, tw, P.S / 2, { col: ST_O, lw: 1.3, dash: [5, 4] });
  const q = difDot(S, m, tw, P.S / 2, { fill: ST_O, r: 5 }); if (q) { shlC(S, 'W', q[0], q[1], 13); difLabel(S, m, q[0] + fs * 3.6, q[1] + fs * 0.9, '\\col{o}{W(' + Grow.fmt(tw) + '\\,|\\,' + Grow.fmt(P.S / 2) + ')}', C, {}); }
}
function growSceneCmp(S, W, H, C) {
  const P = C.P, fs = C.fs, N = P.N, D = Grow.DATA[P.data] || null, F = Grow.cmpFns(P), COL = { b: ST_B, r: ST_R, g: ST_G, v: ST_V };
  const on = Grow.CMP.filter(c => P[c[1]]);
  let base = [P.B0]; if (D) base = base.concat(D.pts.map(q => q[1]));
  on.forEach(c => { if (c[0] === 'lin') base = base.concat(Grow.sample(F.lin, N)); if (c[0] === 'bnd' || c[0] === 'log') base = base.concat(Grow.sample(F[c[0]], N), [P.S]); });
  const hb = Math.max.apply(null, base.map(Math.abs).concat([1]));
  if (P.se) base = base.concat(Grow.sample(F.exp, N).map(v => Math.min(v, 2.2 * hb)));
  const m = kitFrame(S, { x: fs * 0.4, y: fs * 0.3, w: W - fs * 0.8, h: H - fs * 0.6 }, C, Grow.win(N, base), { xlab: 't', ylab: 'B', title: D ? '\\text{' + D.name + '}' : '\\text{Vier Modelle mit demselben Anfangswert}' });
  if ((P.sb || P.sg) && isFinite(P.S)) difSeg(S, m, m.win.x0, P.S, m.win.x1, P.S, { col: 'M', lw: 1.2, dash: [6, 4] });
  const raw = { lin: growRN(P.B0) + '+' + growRN(P.k) + '*x', exp: growRN(P.B0) + '*' + growRN(1 + P.p / 100) + '^x', bnd: growRN(P.S) + '-' + growRN(P.S - P.B0) + '*' + growRN(1 - P.kb / 100) + '^x', log: growRN(P.S) + '/(1+' + growRN((P.S - P.B0) / P.B0) + '*exp(-' + growRN(P.kl) + '*x))' };
  on.forEach(c => difCurve(S, m, difRaw(F[c[0]], raw[c[0]]), { col: COL[c[2]], hl: c[0], exp: C.exp }));
  if (D) D.pts.forEach(q => { const p = difDot(S, m, q[0], q[1], { fill: 'T', r: 4.2 }); if (p) shlC(S, 'data', p[0], p[1], 9); });
  const q0 = difDot(S, m, 0, P.B0, { fill: ST_O, r: 5 }); if (q0) shlC(S, 'B0', q0[0], q0[1], 12);
  // Legende mit mittlerer Abweichung (oben links; bei fallendem Verlauf oben rechts)
  if (!on.length) return;
  const L = on.map(c => [c, D ? Grow.dev(F[c[0]], D.pts) : null]), best = D ? Math.min.apply(null, L.map(q => q[1])) : null;
  const bw = fs * (D ? 13.5 : 8), bh = fs * (1.5 * L.length + (D ? 2.2 : 0.7)), right = m.Y(P.B0) < (m.T + m.B) / 2, bx = right ? m.R - bw - fs * 0.6 : m.L + fs * 2.2, by = m.T + fs * 0.6;
  S.rect(bx, by, bw, bh, { fill: 'W', stroke: 'G', lw: 1, a: 0.88 }); shlBox(S, 'dev', bx, by, bx + bw, by + bh);
  let yy = by + fs * 1.1;
  if (D) { S.text(bx + fs * 0.6, yy, 'Mittlere Abweichung', { size: fs * 0.9, col: 'M', al: 'l', bs: 'm' }); yy += fs * 1.5; }
  L.forEach(q => {
    S.line(bx + fs * 0.6, yy, bx + fs * 2.2, yy, { col: COL[q[0][2]], lw: 3 });
    S.text(bx + fs * 2.8, yy, q[0][3], { size: fs * 0.95, col: COL[q[0][2]], al: 'l', bs: 'm', bold: D && q[1] === best });
    if (D) S.rich(bx + bw - fs * 0.6, yy, Grow.fmt(q[1]), { size: fs * 0.95, col: 'T', al: 'r', bs: 'm', bold: q[1] === best });
    yy += fs * 1.5;
  });
}

kitDefine({
  id: 'grow', icon: '↗', title: 'Wachstumsmodelle', group: 'fn',
  desc: 'Lineares, exponentielles, beschränktes und logistisches Wachstum mit Rekursion, Formel und Richtungsfeld; Verdopplungs- und Halbwertszeit, Schranke und Wendepunkt; Modelle vergleichen und an Messdaten anpassen',
  about: 'Vier Arten, wie ein Bestand wächst oder abnimmt: linear, exponentiell, beschränkt und logistisch. Jedes Modell Schritt für Schritt und als Formel, dazu der Vergleich an echten Messreihen.',
  tip: 'Verändere links Anfangswert und Wachstum und ziehe den Punkt P auf der Kurve. Unter «Modelle vergleichen» passt du die Modelle an Messdaten an.',
  help: ['Die Zeit läuft in Schritten von einer Zeiteinheit (Stunde, Tag, Jahr …); die grünen Stufen zeigen den Zuwachs pro Schritt.',
    'Das Richtungsfeld zeigt für jeden Bestand, wie steil die Kurve dort verläuft: Jede Lösungskurve folgt den kleinen Strichen.',
    'Unter «Modelle vergleichen» lädst du über «Beispiel wählen …» eine Messreihe; die mittlere Abweichung sagt, wie gut ein Modell passt.'],
  kw: { lin: 'lineares Wachstum Abnahme Rekursion gleicher Zuwachs Gerade Steigung Anfangswert', exp: 'exponentielles Wachstum Zerfall Wachstumsfaktor Prozent Verdopplungszeit Halbwertszeit Zinseszins', bnd: 'beschränktes Wachstum Schranke Sättigung Grenze Abkühlung Erwärmung', log: 'logistisches Wachstum Schranke Kapazität Wendepunkt S-Kurve Ausbreitung Population', cmp: 'Wachstumsmodelle vergleichen Daten anpassen Modellwahl Messreihe Abweichung Sonnenblume Bakterien' },
  views: [['lin', 'Lineares Wachstum'], ['exp', 'Exponentielles Wachstum'], ['bnd', 'Beschränktes Wachstum'], ['log', 'Logistisches Wachstum'], ['cmp', 'Modelle vergleichen']],
  quiz: ['lin', 'exp', 'bnd', 'log', 'cmp'],
  descs: {
    lin: ['Stelle {{Anfangswert|B0}} und Zuwachs pro Zeitschritt ein: Die {{grünen Stufen|step}} sind alle gleich hoch, die {{blauen Punkte|pts}} liegen auf einer {{Geraden mit der Steigung k|f}}. Ziehe den {{violetten Punkt P|P}}, um den Bestand zu einem beliebigen Zeitpunkt abzulesen.', 'Lineares Wachstum: In gleichen Zeitabständen ändert sich der Bestand immer um denselben Betrag. Rekursiv heisst das B(t + 1) = B(t) + k, als Formel B(t) = B₀ + k · t. Beispiele: Sparen ohne Zins, eine Kerze brennt ab, ein Tank wird gefüllt.'],
    exp: ['Stelle {{Anfangswert|B0}} und Prozentsatz ein: Jede der {{grünen Stufen|step}} ist um denselben Faktor höher als die vorige, die {{blaue Kurve|f}} wird immer steiler. Die {{Verdopplungs- oder Halbwertszeit T|T2}} ist überall gleich lang. Ziehe den {{violetten Punkt P|P}}.', 'Exponentielles Wachstum: In gleichen Zeitabständen ändert sich der Bestand immer um denselben Prozentsatz, also mit demselben Faktor q. Rekursiv B(t + 1) = q · B(t), als Formel B(t) = B₀ · qᵗ. Ist q grösser als 1, wächst der Bestand, sonst zerfällt er. Beispiele: Zinseszins, Bakterien, radioaktiver Zerfall.'],
    bnd: ['Stelle {{Anfangswert|B0}}, {{Schranke S|S}} und Anteil k ein: Jede der {{grünen Stufen|step}} schliesst denselben Anteil der Lücke bis zur Schranke. Die {{blaue Kurve|f}} wird immer flacher und kommt der Schranke beliebig nahe. Ziehe den {{violetten Punkt P|P}}.', 'Beschränktes Wachstum: Der Zuwachs ist proportional zum Abstand von der Schranke S. Rekursiv B(t + 1) = B(t) + k · (S − B(t)). Liegt der Anfangswert über der Schranke, nähert sich der Bestand von oben. Beispiele: Abkühlen und Erwärmen, Medikament bei Dauerinfusion, Lernkurve.'],
    log: ['Stelle {{Anfangswert|B0}}, {{Schranke S|S}} und Wachstumskonstante ein: Die {{blaue Kurve|f}} wächst zuerst fast exponentiell, am {{Wendepunkt W|W}} bei halber Schranke am schnellsten und nähert sich dann der Schranke. Ziehe den {{violetten Punkt P|P}}.', 'Logistisches Wachstum: Die Änderungsrate ist proportional zum Bestand und zum noch freien Platz. Daraus entsteht eine S-förmige Kurve. Beispiele: Ausbreitung einer Krankheit oder eines Gerüchts, Population mit begrenztem Lebensraum, Höhe einer Pflanze.'],
    cmp: ['Alle Modelle starten beim selben {{Anfangswert|B0}}: {{linear|lin}}, {{exponentiell|exp}}, {{beschränkt|bnd}} und {{logistisch|log}}. Verstelle die Regler, bis ein Modell die {{Messpunkte|data}} trifft; die {{mittlere Abweichung|dev}} zeigt, welches am besten passt.', 'Welches Modell passt, erkennt man an den Daten: Gleiche Differenzen sprechen für lineares, gleiche Quotienten für exponentielles Wachstum. Nähern sich die Werte einer Grenze, ist das Wachstum beschränkt oder, bei S-förmigem Verlauf, logistisch.']
  },
  def: {
    lin: { B0: 100, k: 40, N: 12, t: 7.5, steps: true, field: false, win: null },
    exp: { B0: 100, p: 20, N: 12, t: 7.5, steps: true, field: false, win: null },
    bnd: { B0: 100, S: 1000, k: 15, N: 20, t: 7.5, steps: true, field: false, win: null },
    log: { B0: 20, S: 1000, k: 0.5, N: 20, t: 12, field: false, win: null },
    cmp: { data: 'sun', B0: 12, k: 22, p: 30, S: 260, kb: 10, kl: 0.6, N: 13, sl: true, se: true, sb: true, sg: true, win: null }
  },
  controls(v, P) {
    const N = { k: 'N', t: 'range', l: 'Zeitraum (Anzahl Zeitschritte)', min: 5, max: v === 'cmp' ? 60 : 40, step: 1, d: 0 }, t = { k: 't', t: 'num', l: 'Zeitpunkt t von P', min: 0, max: 60, step: 0.5 };
    const st = { k: 'steps', t: 'check', l: 'Stufen zeigen' }, fd = { k: 'field', t: 'check', l: 'Richtungsfeld zeigen' };
    const B0 = (lo, hi) => ({ k: 'B0', t: 'range', l: 'Anfangswert B₀', min: lo, max: hi, step: lo === 1 ? 1 : 10, d: 0 }), Sc = (hi, stp) => ({ k: 'S', t: 'range', l: 'Schranke S', min: stp, max: hi, step: stp, d: 0 });
    if (v === 'lin') return [B0(0, 1000), { k: 'k', t: 'range', l: 'Zuwachs k pro Zeitschritt', min: -100, max: 100, step: 5 }, N, t, st, fd];
    if (v === 'exp') return [B0(1, 1000), { k: 'p', t: 'range', l: 'Änderung p pro Zeitschritt', min: -50, max: 100, step: 0.5, u: '%' }, N, t, st, fd];
    if (v === 'bnd') return [B0(0, 2000), Sc(2000, 10), { k: 'k', t: 'range', l: 'Anteil k pro Zeitschritt', min: 1, max: 60, step: 1, u: '%' }, N, t, st, fd];
    if (v === 'log') return [B0(1, 2000), Sc(2000, 10), { k: 'k', t: 'range', l: 'Wachstumskonstante k', min: 0.05, max: 2, step: 0.05 }, N, t, fd];
    return [B0(1, 1000), { k: 'sl', t: 'check', l: 'linear' }, { k: 'k', t: 'range', l: 'linear: Zuwachs k', min: -100, max: 100, step: 0.1, show: P.sl },
      { k: 'se', t: 'check', l: 'exponentiell' }, { k: 'p', t: 'range', l: 'exponentiell: Änderung p', min: -20, max: 60, step: 0.1, u: '%', show: P.se },
      { k: 'sb', t: 'check', l: 'beschränkt' }, { k: 'kb', t: 'range', l: 'beschränkt: Anteil k', min: 0.5, max: 40, step: 0.1, u: '%', show: P.sb },
      { k: 'sg', t: 'check', l: 'logistisch' }, { k: 'kl', t: 'range', l: 'logistisch: Konstante k', min: 0.01, max: 1.5, step: 0.01, show: P.sg },
      { k: 'S', t: 'range', l: 'Schranke S (beschränkt und logistisch)', min: 1, max: 1500, step: 1, d: 0, show: P.sb || P.sg }, N];
  },
  presets: {
    lin: [['Sparschwein: jede Woche 15 Franken dazu', { B0: 40, k: 15, N: 12, t: 8 }], ['Kerze brennt ab', { B0: 200, k: -15, N: 14, t: 6 }], ['Wassertank wird gefüllt', { B0: 0, k: 60, N: 15, t: 10 }], ['Vorrat wird aufgebraucht', { B0: 900, k: -75, N: 12, t: 4 }]],
    exp: [['Zinseszins: 5 % pro Jahr', { B0: 1000, p: 5, N: 30, t: 14 }], ['Bakterien: 40 % mehr pro Stunde', { B0: 50, p: 40, N: 12, t: 6 }], ['Zerfall: 10 % weniger pro Jahr', { B0: 800, p: -10, N: 30, t: 6.5 }], ['Verdopplung in jedem Schritt', { B0: 1, p: 100, N: 10, t: 5 }]],
    bnd: [['Kaffee kühlt auf Zimmertemperatur ab', { B0: 80, S: 20, k: 7, N: 40, t: 10 }], ['Kaltes Getränk erwärmt sich', { B0: 10, S: 30, k: 10, N: 30, t: 6.5 }], ['Medikament bei Dauerinfusion', { B0: 0, S: 500, k: 20, N: 20, t: 3 }], ['Vokabeln lernen', { B0: 0, S: 1200, k: 5, N: 40, t: 14 }]],
    log: [['Sonnenblume: Höhe in cm', { B0: 12, S: 260, k: 0.6, N: 14, t: 5 }], ['Gerücht an einer Schule', { B0: 2, S: 800, k: 0.9, N: 16, t: 6.5 }], ['Fische im Teich', { B0: 50, S: 1000, k: 0.3, N: 30, t: 10 }], ['Start über der Schranke', { B0: 1500, S: 1000, k: 0.3, N: 20, t: 5 }]],
    cmp: [['Sonnenblume', { data: 'sun', B0: 12, k: 22, p: 30, S: 260, kb: 10, kl: 0.6, N: 13 }], ['Bakterienkultur', { data: 'bak', B0: 100, k: 80, p: 35, S: 1500, kb: 5, kl: 0.4, N: 8 }], ['Kaffee kühlt ab', { data: 'kaffee', B0: 80, k: -1.5, p: -3, S: 20, kb: 5, kl: 0.1, N: 42, sg: false }], ['Kerze brennt ab', { data: 'kerze', B0: 200, k: -1.6, p: -1, S: 1, kb: 1, kl: 0.1, N: 60, sb: false, sg: false }], ['Ohne Daten: vier Modelle im Vergleich', { data: 'none', B0: 50, k: 40, p: 20, S: 1000, kb: 12, kl: 0.45, N: 20 }]]
  },
  sanitize(v, P, src) { if (v === 'cmp') P.data = src.data === 'none' || Grow.DATA[src.data] ? src.data : P.data; },
  fix(v, P) {
    P.N = kitClamp(Math.round(P.N), 5, v === 'cmp' ? 60 : 40);
    if ('t' in P) P.t = kitClamp(Math.round(P.t * 2) / 2, 0, P.N);
    if (v === 'exp' || v === 'log' || v === 'cmp') P.B0 = Math.max(1, P.B0);
  },
  scene: { lin: growSceneLin, exp: growSceneExp, bnd: growSceneBnd, log: growSceneLog, cmp: growSceneCmp },
  doc: (v, P) => Grow.doc(v, P)
});

if (typeof module !== 'undefined' && module.exports) module.exports = { Grow };
