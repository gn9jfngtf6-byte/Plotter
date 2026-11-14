// ═══════════════════════════════════════════════════════════════════
// 31b_vg.js — 3D-Raum: Vektorgeometrie. Ansichten neben «Ebenen entdecken» (30_3d_ui.js):
// Punkte und Vektoren, Geraden, Skalarprodukt und Winkel, Abstände, Kugel.
//
// Jede Ansicht baut eine Liste von 3D-Objekten (vgObjects): Punkt, Pfeil, Strecke, Gerade, Vieleck,
// Kreis, Kugel, Winkelbogen. Dieselbe Liste wird auf den Canvas gezeichnet (vgDraw, aufgerufen von
// td3dDraw) und als TikZ ausgegeben (vgTex, aufgerufen von td3dLatex). Rechenweg in der Karte #dif-card.
// Zustand: TD.view (Ansicht) und VG (Eingaben); beides in tdCapture/tdApply (Undo, Speichern).
// ═══════════════════════════════════════════════════════════════════

const VG_VIEWS = [['pl', 'Ebenen entdecken'], ['vec', 'Punkte und Vektoren'], ['line', 'Geraden: Lage und Schnittpunkt'], ['dot', 'Skalarprodukt und Winkel'], ['dist', 'Abstände: Punkt–Ebene, Punkt–Gerade'], ['sph', 'Kugel']];
const VG_DESC = {
  pl: ['Gib links eine {{Ebene|E}} in Koordinatenform ein (z. B. 2x + 3y − z = 6) und drehe den Raum mit der Maus: {{Achsenabschnitte|ac}} und {{Spurgeraden|sp}} zeigen, wo sie die Achsen und Koordinatenebenen trifft. Mit zwei oder drei Ebenen erscheinen {{Schnittgerade|sg}} und {{Schnittpunkt|S}}.', 'Eine Ebene im Raum hat die Koordinatenform a·x + b·y + c·z = d. Der Normalenvektor (a | b | c) steht senkrecht auf ihr. Achsenabschnitte: zwei Koordinaten null setzen. Buchstaben in der Gleichung werden zu Schiebern.'],
  // «Ebene entdecken» in drei Stufen (tdDiscStage in 30_3d_ui.js): a Balken, b nur Punkte, c die Ebene ist sichtbar geworden
  plA: ['Drehe den Raum mit der Maus: Über jedem {{Gitterpunkt (x | y)|gp}} steht ein {{Balken|bal}}, dessen {{Höhe z|h}} aus der Gleichung folgt (Beispiele rechts). Schalte danach links «Nur Punkte (ohne Balken)» ein.'],
  plB: ['Verkleinere links den Gitterabstand Schritt für Schritt: Von jedem Balken ist nur die Spitze geblieben, der {{Punkt (x | y | z)|h}}. Was entsteht, wenn diese Punkte immer dichter liegen?'],
  plC: ['Aus den Punkten ist die {{ganze Ebene|E}} entstanden: Sie besteht aus allen Punkten (x | y | z), die die Gleichung erfüllen. Schalte links unter «Anzeigen» Achsenabschnitte und Spurgeraden ein oder gib eine weitere Ebene ein.'],
  vec: ['Gib links die Punkte A und B ein und drehe den Raum: Der {{Vektor AB|ab}} führt von A nach B; seine {{Komponenten|comp}} sind die Schritte in x-, y- und z-Richtung. Dazu die {{Ortsvektoren|pos}} und der {{Mittelpunkt M|M}}.', 'Ein Punkt A(a₁ | a₂ | a₃) hat den Ortsvektor OA. Der Verbindungsvektor ist AB = B − A (Spitze minus Fuss). Seine Länge |AB| = √(v₁² + v₂² + v₃²) ist der Abstand der Punkte, der Mittelpunkt ist M = ½(A + B).'],
  line: ['Gib links die Geraden g und h in Parameterform ein und drehe den Raum: Schneiden sie sich im {{Schnittpunkt S|S}}, sind sie parallel oder {{windschief|ws}}? Die {{Richtungsvektoren|dir}} entscheiden zuerst. Mit den Reglern t und s (oder «▶ t und s laufen lassen») wandern die Punkte {{X|X}} und {{Y|Y}} auf den Geraden: Jeder Parameterwert gibt genau einen Punkt.', 'Gerade in Parameterform: X = P + t·u mit Stützpunkt P und Richtungsvektor u. Zwei Geraden sind identisch, echt parallel, schneidend oder windschief. Prüfen: Sind u und v Vielfache? Sonst gleichsetzen: zwei Gleichungen lösen, die dritte prüfen.'],
  dot: ['Gib links die Vektoren a und b ein und drehe den Raum: Der {{Winkel φ|phi}} zwischen ihnen folgt aus dem Skalarprodukt. Ist a · b = 0, stehen sie senkrecht. Das {{Vektorprodukt a × b|cr}} steht senkrecht auf beiden.', 'Skalarprodukt: a · b = a₁b₁ + a₂b₂ + a₃b₃ = |a|·|b|·cos φ. Daraus der Winkel: cos φ = a · b / (|a|·|b|). Senkrecht genau dann, wenn a · b = 0. Vektorprodukt a × b: senkrecht zu a und b, Länge = Fläche des Parallelogramms.'],
  dist: ['Gib links den Punkt X und die Ebene oder Gerade ein und drehe den Raum: Der {{Abstand d|d}} ist die Länge des Lots vom Punkt X zum {{Lotfusspunkt F|F}}.', 'Abstand Punkt–Ebene mit der Hesseschen Normalform: d = |a·x₀ + b·y₀ + c·z₀ − d| / |n|. Abstand Punkt–Gerade: Lotfusspunkt F auf der Geraden so, dass XF senkrecht zum Richtungsvektor steht, dann d = |XF|.'],
  sph: ['Gib links Mittelpunkt und Radius ein und drehe den Raum: Liegt der {{Punkt X|X}} innen, auf oder ausserhalb der {{Kugel|K}}? Die {{Ebene|E}} schneidet sie in einem {{Schnittkreis|sk}}, berührt sie oder verfehlt sie.', 'Kugel mit Mittelpunkt M(m₁ | m₂ | m₃) und Radius r: (x − m₁)² + (y − m₂)² + (z − m₃)² = r². Lage eines Punktes: Abstand zu M mit r vergleichen. Lage einer Ebene: Abstand d von M zur Ebene; für d < r Schnittkreis mit Radius √(r² − d²).']
};
const VG_EX = {
  vec: [['A(3 | 1 | 2), B(−1 | 4 | 5)', { vA: [3, 1, 2], vB: [-1, 4, 5] }], ['A(0 | 0 | 0), B(2 | 3 | 6): Länge 7', { vA: [0, 0, 0], vB: [2, 3, 6] }], ['A(1 | −2 | 4), B(5 | 2 | 2)', { vA: [1, -2, 4], vB: [5, 2, 2] }], ['Raumdiagonale im Würfel: A(0 | 0 | 0), B(4 | 4 | 4)', { vA: [0, 0, 0], vB: [4, 4, 4] }]],
  line: [['Schneidend', { gP: [1, 0, 2], gu: [1, 2, -1], gQ: [1, 6, -2], gv: [1, -1, 1] }], ['Windschief', { gP: [1, 0, 2], gu: [1, 2, -1], gQ: [3, 1, 0], gv: [0, 1, 1] }], ['Echt parallel', { gP: [0, 0, 1], gu: [2, 1, 1], gQ: [1, 3, 0], gv: [-4, -2, -2] }], ['Identisch', { gP: [0, 0, 1], gu: [2, 1, 1], gQ: [4, 2, 3], gv: [-2, -1, -1] }], ['Senkrecht schneidend', { gP: [-3, 0, 0], gu: [1, 0, 0], gQ: [0, -3, 2], gv: [0, 3, -2] }]],
  dot: [['a = (3 | 1 | 2), b = (−1 | 2 | 4)', { sa: [3, 1, 2], sb: [-1, 2, 4] }], ['Senkrecht: a = (2 | 1 | −2), b = (1 | 2 | 2)', { sa: [2, 1, -2], sb: [1, 2, 2] }], ['Stumpfer Winkel: a = (4 | 0 | 1), b = (−3 | 2 | 1)', { sa: [4, 0, 1], sb: [-3, 2, 1] }], ['Vektorprodukt: a = (3 | 0 | 0), b = (1 | 2 | 0)', { sa: [3, 0, 0], sb: [1, 2, 0], sCross: true }]],
  dist: [['Punkt–Ebene: X(4 | 4 | 5), E: 2x + y + 2z = 6', { dm: 'pe', dX: [4, 4, 5], dE: '2x+y+2z=6' }], ['Punkt–Ebene: X(1 | 2 | 6), E: z = 2', { dm: 'pe', dX: [1, 2, 6], dE: 'z=2' }], ['Punkt–Gerade: X(3 | −2 | 4), g: (0 | 1 | 1) + t·(1 | 1 | 1)', { dm: 'pg', dX: [3, -2, 4], dP: [0, 1, 1], du: [1, 1, 1] }], ['Punkt–Gerade: X(4 | 0 | 3), g: z-Achse', { dm: 'pg', dX: [4, 0, 3], dP: [0, 0, 0], du: [0, 0, 1] }]],
  sph: [['M(1 | 2 | 1), r = 3; Ebene z = 3 schneidet', { kM: [1, 2, 1], kr: 3, kX: [3, 4, 2], kE: 'z=3', kPl: true }], ['Tangentialebene: M(0 | 0 | 0), r = 3, E: z = 3', { kM: [0, 0, 0], kr: 3, kX: [1, 1, 1], kE: 'z=3', kPl: true }], ['Ebene verfehlt die Kugel', { kM: [0, 0, 0], kr: 2, kX: [3, 0, 0], kE: 'x+y+z=6', kPl: true }], ['Punkt innen: M(1 | 1 | 1), r = 4, X(2 | 3 | 0)', { kM: [1, 1, 1], kr: 4, kX: [2, 3, 0], kE: 'x=0', kPl: false }]]
};
function vgDefaults() {
  return { vA: [3, 1, 2], vB: [-1, 4, 5], vPos: true, vQuad: true, gP: [1, 0, 2], gu: [1, 2, -1], gQ: [1, 6, -2], gv: [1, -1, 1], gt: 1, gs: 1, gPts: true, sa: [3, 1, 2], sb: [-1, 2, 4], sCross: false,
    dm: 'pe', dX: [4, 4, 5], dE: '2x+y+2z=6', dP: [0, 1, 1], du: [1, 1, 1], kM: [1, 2, 1], kr: 3, kX: [3, 4, 2], kE: 'z=3', kPl: true, show: { card: true } };
}
const VG = Object.assign(vgDefaults(), { S: null, ui: null, anim: null, cardKey: '', cardT: 0 });
const VG_KEYS = Object.keys(vgDefaults());
const vgOn = () => typeof TD !== 'undefined' && TD.on && TD.view && TD.view !== 'pl';
// Karte mit Rechenweg: in den Ansichten der Vektorgeometrie und beim Entdecken der Ebene (Balken über dem Gitter)
const vgCardOn = () => vgOn() || (typeof TD !== 'undefined' && TD.on && typeof tdDisc === 'function' && !!tdDisc());
// Überschrift: beim Entdecken der Ebene je nach Stufe, sonst die der Ansicht
function vgHeadText() { const v = TD.view || 'pl', st = v === 'pl' && typeof tdDiscStage === 'function' ? tdDiscStage() : ''; return (st ? VG_DESC['pl' + st.toUpperCase()] : VG_DESC[v])[0]; }
function vgHead() { if (typeof envHint === 'function') envHint('3d', vgHeadText(), () => VG.S); }

// ── Zahlen und Vektoren als Text ──
const vgS = x => tdFrac(x);                                                  // Anzeige im Bild (Unicode-Minus)
const vgT = x => tdFrac(x).replace(/−/g, '-').replace(/^(-?)(\d+)\/(\d+)$/, '$1\\frac{$2}{$3}');   // LaTeX
const vgPt = p => '(' + p.map(vgS).join(' | ') + ')';
const vgPtT = p => '(' + p.map(vgT).join('\\,|\\,') + ')';
const vgCol = v => '\\begin{pmatrix}' + v.map(vgT).join('\\\\') + '\\end{pmatrix}';
const vgPar = x => (x < 0 ? '(' + vgT(x) + ')' : vgT(x));
// √q exakt: k·√m, wenn q ganzzahlig ist; sonst nur gerundet
function vgSqrt(q) {
  const r = Math.sqrt(q), n = Math.round(q);
  if (Math.abs(q - n) < 1e-9 && n >= 0) {
    if (Math.abs(r - Math.round(r)) < 1e-9) return vgT(Math.round(r));
    let k = 1, m = n; for (let i = 2; i * i <= m; i++) while (m % (i * i) === 0) { m /= i * i; k *= i; }
    return (k > 1 ? k : '') + '\\sqrt{' + m + '}\\approx ' + tdNum(r, 3).replace('−', '-');
  }
  return '\\sqrt{' + vgT(q) + '}\\approx ' + tdNum(r, 3).replace('−', '-');
}
const vgLenSq = v => V3.dot(v, v);
// Eine Koordinate bzw. Zahl lesen: Dezimalzahl mit Punkt oder Komma ODER Bruch «3/2». Die Felder zeigen ihre Werte
// selbst als Brüche an (tdFrac); parseFloat las davon nur den Zähler — aus «3/2 | 2 | 3» wurde beim nächsten
// Übernehmen stillschweigend (3 | 2 | 3).
const vgNum = x => {
  x = String(x).trim().replace(/−/g, '-');
  if (/^[-+]?(\d+([.,]\d*)?|[.,]\d+)$/.test(x)) return parseFloat(x.replace(',', '.'));
  const m = /^([-+]?\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/.exec(x);
  if (m) { const d = parseFloat(m[2].replace(',', '.')); return d ? parseFloat(m[1].replace(',', '.')) / d : NaN; }
  return typeof difParseNum === 'function' ? difParseNum(x) : NaN;
};
const vgParse3 = s => { s = String(s).replace(/[()]/g, ' ').replace(/−/g, '-').trim(); const a = (/[|;]/.test(s) ? s.split(/[|;]/) : s.split(/[\s,]+/)).map(x => x.trim()).filter(Boolean).map(vgNum); return a.length === 3 && a.every(isFinite) ? a.map(tdClean) : null; };
const vgPlane = s => { const p = tdParsePlane(s, {}); return p && !p.error ? p : null; };

// ═════════════ Rechnungen ═════════════
function vgLines(P, u, Q, v) {
  const c = V3.cross(u, v), w = V3.sub(Q, P), sc = V3.len(u) * V3.len(v);
  if (V3.len(c) < 1e-9 * sc) {
    const same = V3.len(V3.cross(w, u)) < 1e-9 * (V3.len(w) * V3.len(u) + 1e-12);
    const t = V3.dot(w, u) / V3.dot(u, u), F = V3.add(P, V3.mul(u, t));
    return { kind: same ? 'same' : 'par', k: V3.dot(u, v) / V3.dot(v, v), d: V3.dist(Q, F), F };
  }
  // zwei Gleichungen mit Determinante ≠ 0 lösen: t·u_i − s·v_i = w_i
  let best = null;
  [[0, 1], [0, 2], [1, 2]].forEach(([i, j]) => { const D = -u[i] * v[j] + u[j] * v[i]; if (!best || Math.abs(D) > Math.abs(best.D)) best = { i, j, D }; });
  const { i, j, D } = best, t = (-w[i] * v[j] + w[j] * v[i]) / D, s = (u[i] * w[j] - u[j] * w[i]) / D, k = 3 - i - j;
  const res = t * u[k] - s * v[k] - w[k];
  if (Math.abs(res) < 1e-9 * (1 + Math.abs(w[k]))) return { kind: 'cut', t: tdClean(t), s: tdClean(s), S: V3.add(P, V3.mul(u, t)).map(tdClean), eq: [i, j, k], ang: Math.acos(Math.min(1, Math.abs(V3.dot(u, v)) / sc)) * 180 / Math.PI };
  const d = Math.abs(V3.dot(w, c)) / V3.len(c);
  // Lotfusspunkte der gemeinsamen Senkrechten
  const a = V3.dot(u, u), b = V3.dot(u, v), cc = V3.dot(v, v), dd = V3.dot(u, w), e = V3.dot(v, w), den = a * cc - b * b;
  const t2 = (dd * cc - b * e) / den, s2 = (b * dd - a * e) / den;
  return { kind: 'ws', t: tdClean(t), s: tdClean(s), eq: [i, j, k], res, d, F1: V3.add(P, V3.mul(u, t2)), F2: V3.add(Q, V3.mul(v, s2)) };
}
function vgPtPlane(X, E) { const n = [E.a, E.b, E.c], v = V3.dot(n, X) - E.d, nn = V3.dot(n, n); return { n, v, d: Math.abs(v) / Math.sqrt(nn), F: V3.sub(X, V3.mul(n, v / nn)).map(tdClean), nn }; }
function vgPtLine(X, P, u) { const t = V3.dot(V3.sub(X, P), u) / V3.dot(u, u), F = V3.add(P, V3.mul(u, t)).map(tdClean); return { t: tdClean(t), F, d: V3.dist(X, F) }; }

// Ebene entdecken: z = p·x + q·y + r und Beispiele an Gitterpunkten (Abstand step, sichtbar bis ±R)
function vgDiscCalc(E, step, R) {
  const p = tdClean(-E.a / E.c), q = tdClean(-E.b / E.c), r = tdClean(E.d / E.c), Z = (x, y) => tdClean(p * x + q * y + r);
  // Summe aus Gliedern [Koeffizient, Faktor als Text]: «2x+3y-6» bzw. eingesetzt «2\cdot 2+3\cdot 2-6»
  const sum = ts => { let o = ''; ts.forEach(([c, f]) => { if (Math.abs(c) < 1e-12) return; const a = Math.abs(c), one = Math.abs(a - 1) < 1e-9; o += (c < 0 ? '-' : o ? '+' : '') + (f === '' ? vgT(a) : one ? f : vgT(a) + (/^[a-z]$/.test(f) ? '' : '\\cdot ') + f); }); return o || '0'; };
  const lin = sum([[p, 'x'], [q, 'y'], [r, '']]), lhs = tdPlaneTex(E).split('=')[0].trim();
  // Beispiele auf dem gezeichneten Gitter; bei feinem Gitter das kleinste Vielfache des Abstands ab 1, damit die Zahlen einfach bleiben
  const s = step >= 1 ? step : step > 0 ? tdClean(Math.ceil(1 / step - 1e-9) * step) : 1, c = [[0, 0], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [-1, 1], [1, -1], [-1, -1], [2, 0], [0, 2], [2, 1], [1, 2]].map(([i, j]) => [tdClean(i * s), tdClean(j * s)]).filter(([x, y]) => Math.abs(x) <= R && Math.abs(y) <= R);
  const vis = c.filter(([x, y]) => Math.abs(Z(x, y)) <= R + 1e-9), nz = vis.filter(([x, y]) => Math.abs(Z(x, y)) > 1e-9);
  const pick = []; [nz, vis, c].forEach(l => l.forEach(g => { if (pick.length < 3 && !pick.includes(g)) pick.push(g); }));
  const eq = (l, v) => (l === v ? 'z=' : l + '=') + v;      // «3=3» (Ebene z = 3) wäre keine Rechnung
  const ex = pick.map(([x, y]) => { const z = Z(x, y);
    return { x, y, z, tex: '({' + vgT(x) + '}\\,|\\,{' + vgT(y) + '})\\colon\\quad ' + (l => (l === vgT(z) ? '' : 'z=' + l + '=') + (l === vgT(z) ? 'z=' : '') + vgT(z))(sum([[p, vgPar(x)], [q, vgPar(y)], [r, '']])),
      check: eq(sum([[E.a, vgPar(x)], [E.b, vgPar(y)], [E.c, vgPar(z)]]), vgT(tdClean(E.a * x + E.b * y + E.c * z))) };
  });
  return { p, q, r, lin, solve: (lhs === 'z' ? '' : tdPlaneTex(E) + '\\quad\\Rightarrow\\quad ') + 'z=' + lin, ex };
}

// ═════════════ Rechenwege ═════════════
function vgDoc() {
  const d = Dif.DOC(), V = VG, v = TD.view;
  if ((v || 'pl') === 'pl') {
    // Ebene entdecken: Gleichung nach z auflösen, Höhen über einigen Gitterpunkten ausrechnen, Probe mit einem Punkt
    const it = tdDisc(); if (!it) return null;
    const q = vgDiscCalc(it.pl, TD.bar.step, TD.range);
    d.h('Höhe über einem Gitterpunkt');
    d.p('Die Gleichung der Ebene nach $z$ auflösen:');
    d.e(q.solve);
    d.p('Die Koordinaten eines Gitterpunkts $(x\\,|\\,y)$ einsetzen. Das Ergebnis $z$ ist die **Höhe** des Balkens über diesem Punkt:');
    q.ex.forEach(e => d.e(e.tex));
    if (q.ex.some(e => e.z < 0)) d.p('Ist $z$ negativ, zeigt der Balken nach unten.');
    const e0 = q.ex[q.ex.length - 1];
    d.p('Die Spitze des Balkens ist der Punkt $(x\\,|\\,y\\,|\\,z)$. Probe mit dem Punkt $(' + [e0.x, e0.y, e0.z].map(c => '{' + vgT(c) + '}').join('\\,|\\,') + ')$:');
    d.e(e0.check);
    d.res('Die Koordinaten jeder Balkenspitze erfüllen die Gleichung.');
    if (!(TD.bar.step > 0.5)) d.p('Je kleiner der Gitterabstand, desto dichter liegen die Punkte. Alle Punkte, deren Koordinaten die Gleichung erfüllen, bilden zusammen die **Ebene**.');
  } else if (v === 'vec') {
    const A = V.vA, B = V.vB, ab = V3.sub(B, A), M = V3.mul(V3.add(A, B), 0.5);
    d.h('Punkte und Vektoren');
    d.p('**Verbindungsvektor:** Spitze minus Fuss, also $\\overrightarrow{AB}=\\vec b-\\vec a$ (Ortsvektoren von $B$ und $A$).');
    d.e('\\overrightarrow{AB}=' + vgCol(B) + '-' + vgCol(A) + '=' + vgCol(ab));
    d.p('**Länge** (Betrag) mit dem Satz des Pythagoras im Raum: Sie ist der Abstand der Punkte $A$ und $B$.');
    d.e('|\\overrightarrow{AB}|=\\sqrt{' + ab.map(vgPar).map(x => x + '^2').join('+') + '}=' + vgSqrt(vgLenSq(ab)));
    d.p('**Mittelpunkt** der Strecke $AB$: Mittelwert der Koordinaten.');
    d.e('M=\\frac{1}{2}(\\vec a+\\vec b)=' + vgPtT(M));
    d.res('$\\overrightarrow{AB}=' + vgCol(ab) + ',\\ |\\overrightarrow{AB}|=' + vgSqrt(vgLenSq(ab)) + ',\\ M' + vgPtT(M) + '$');
  } else if (v === 'line') {
    const r = vgLines(V.gP, V.gu, V.gQ, V.gv), xyz = ['x', 'y', 'z'];
    d.h('Lage zweier Geraden');
    d.e('g\\colon\\ \\vec x=' + vgCol(V.gP) + '+t\\cdot' + vgCol(V.gu) + ',\\qquad h\\colon\\ \\vec x=' + vgCol(V.gQ) + '+s\\cdot' + vgCol(V.gv));
    d.p('**1. Richtungsvektoren vergleichen:** Ist $\\vec u$ ein Vielfaches von $\\vec v$?');
    if (r.kind === 'same' || r.kind === 'par') {
      d.p('Ja: $\\vec u=' + vgT(r.k) + '\\cdot\\vec v$. Die Geraden sind parallel oder identisch. **2. Punktprobe:** Liegt $Q$ auf $g$?');
      d.p(r.kind === 'same' ? 'Ja, $Q$ liegt auf $g$: Die Geraden sind **identisch**.' : 'Nein, $Q$ liegt nicht auf $g$: Die Geraden sind **echt parallel**. Ihr Abstand ist $d\\approx ' + tdNum(r.d, 3).replace('−', '-') + '$.');
      d.res('$g$ und $h$ sind ' + (r.kind === 'same' ? 'identisch' : 'echt parallel') + '.');
    } else {
      d.p('Nein: Die Geraden schneiden sich oder sind windschief. **2. Gleichsetzen:** $P+t\\cdot\\vec u=Q+s\\cdot\\vec v$ ergibt drei Gleichungen.');
      const lin = (a, c, x) => { const cs = c === 0 ? '' : (c === 1 ? '' : c === -1 ? '-' : vgT(c)) + x; return a === 0 ? (cs || '0') : vgT(a) + (cs ? (c > 0 ? '+' : '') + cs : ''); };
      [0, 1, 2].forEach(k => d.e(lin(V.gP[k], V.gu[k], 't') + '=' + lin(V.gQ[k], V.gv[k], 's')).op('(' + xyz[k] + ')'));
      d.p('Aus den Gleichungen (' + xyz[r.eq[0]] + ') und (' + xyz[r.eq[1]] + ') folgt $t=' + vgT(r.t) + '$, $s=' + vgT(r.s) + '$. **3. Probe** in (' + xyz[r.eq[2]] + '):');
      const k = r.eq[2], lhs = V.gP[k] + V.gu[k] * r.t, rhs = V.gQ[k] + V.gv[k] * r.s;
      d.e(vgT(lhs) + (r.kind === 'cut' ? '=' : '\\ne ') + vgT(rhs));
      if (r.kind === 'cut') { d.p('Die Probe stimmt: Die Geraden **schneiden** sich. $t$ in $g$ einsetzen:'); d.e('S=' + vgPtT(r.S)); d.note('Schnittwinkel: $\\cos\\varphi=\\frac{|\\vec u\\cdot\\vec v|}{|\\vec u|\\cdot|\\vec v|}$, also $\\varphi\\approx ' + tdNum(r.ang, 2) + '^\\circ$.'); d.res('Schnittpunkt $S' + vgPtT(r.S) + '$'); }
      else { d.p('Widerspruch: Die Geraden sind **windschief** (nicht parallel und ohne Schnittpunkt).'); d.note('Abstand: $d=\\frac{|(Q-P)\\cdot(\\vec u\\times\\vec v)|}{|\\vec u\\times\\vec v|}\\approx ' + tdNum(r.d, 3).replace('−', '-') + '$.'); d.res('$g$ und $h$ sind windschief.'); }
    }
  } else if (v === 'dot') {
    const a = V.sa, b = V.sb, sp = V3.dot(a, b), la = V3.len(a), lb = V3.len(b), c = sp / (la * lb), phi = Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
    d.h('Skalarprodukt und Winkel');
    d.e('\\vec a\\cdot\\vec b=' + a.map((x, i) => vgPar(x) + '\\cdot' + vgPar(b[i])).join('+') + '=' + vgT(sp));
    d.e('|\\vec a|=' + vgSqrt(vgLenSq(a)) + ',\\qquad|\\vec b|=' + vgSqrt(vgLenSq(b)));
    d.p('**Winkel:** Aus $\\vec a\\cdot\\vec b=|\\vec a|\\cdot|\\vec b|\\cdot\\cos\\varphi$ folgt');
    d.e('\\cos\\varphi=\\frac{' + vgT(sp) + '}{\\sqrt{' + vgT(vgLenSq(a)) + '}\\cdot\\sqrt{' + vgT(vgLenSq(b)) + '}}\\approx ' + tdNum(c, 4).replace('−', '-') + '\\quad\\Rightarrow\\quad\\varphi\\approx ' + tdNum(phi, 2) + '^\\circ');
    d.p(Math.abs(sp) < 1e-9 ? 'Das Skalarprodukt ist $0$: Die Vektoren stehen **senkrecht** aufeinander.' : sp > 0 ? 'Das Skalarprodukt ist positiv: Der Winkel ist **spitz**.' : 'Das Skalarprodukt ist negativ: Der Winkel ist **stumpf**.');
    if (V.sCross) {
      const cr = V3.cross(a, b).map(tdClean);
      d.p('**Vektorprodukt:** steht senkrecht auf $\\vec a$ und $\\vec b$; seine Länge ist die Fläche des Parallelogramms.');
      d.e('\\vec a\\times\\vec b=' + vgCol([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]) + ',\\qquad A=|\\vec a\\times\\vec b|=' + vgSqrt(vgLenSq(cr)));
    }
    d.res('$\\vec a\\cdot\\vec b=' + vgT(sp) + ',\\ \\varphi\\approx ' + tdNum(phi, 2) + '^\\circ$');
  } else if (v === 'dist') {
    const X = V.dX;
    if (V.dm === 'pe') {
      const E = vgPlane(V.dE); d.h('Abstand Punkt–Ebene');
      if (!E) { d.p('Die Ebene ist nicht lesbar.'); return d; }
      const r = vgPtPlane(X, E);
      d.p('Ebene $E\\colon ' + tdPlaneTex(E) + '$ mit Normalenvektor $\\vec n=' + vgCol(r.n) + '$, $|\\vec n|=' + vgSqrt(r.nn) + '$. **Hessesche Normalform:** Punkt einsetzen und durch $|\\vec n|$ teilen.');
      d.e('d=\\frac{|' + r.n.map((c, i) => vgPar(c) + '\\cdot' + vgPar(X[i])).join('+') + '-' + vgPar(E.d) + '|}{' + vgSqrt(r.nn).split('\\approx')[0] + '}=\\frac{' + vgT(Math.abs(r.v)) + '}{' + vgSqrt(r.nn).split('\\approx')[0] + '}\\approx ' + tdNum(r.d, 3).replace('−', '-'));
      d.p('**Lotfusspunkt:** Vom Punkt $X$ aus in Richtung $\\vec n$ bis zur Ebene: $F=X-\\frac{' + vgT(r.v) + '}{' + vgT(r.nn) + '}\\cdot\\vec n$.');
      d.e('F=' + vgPtT(r.F));
      if (r.d < 1e-9) d.note('Der Punkt liegt in der Ebene.');
      d.res('$d(X,E)\\approx ' + tdNum(r.d, 3).replace('−', '-') + '$');
    } else {
      const P = V.dP, u = V.du, r = vgPtLine(X, P, u); d.h('Abstand Punkt–Gerade');
      d.e('g\\colon\\ \\vec x=' + vgCol(P) + '+t\\cdot' + vgCol(u) + ',\\qquad X' + vgPtT(X));
      d.p('**Lotfusspunkt** $F=P+t\\cdot\\vec u$: Der Vektor $\\overrightarrow{FX}$ muss senkrecht auf $\\vec u$ stehen, also $(X-P-t\\vec u)\\cdot\\vec u=0$.');
      d.e('t=\\frac{(X-P)\\cdot\\vec u}{\\vec u\\cdot\\vec u}=\\frac{' + vgT(V3.dot(V3.sub(X, P), u)) + '}{' + vgT(V3.dot(u, u)) + '}=' + vgT(r.t) + '\\quad\\Rightarrow\\quad F=' + vgPtT(r.F));
      d.e('d=|\\overrightarrow{FX}|=' + vgSqrt(vgLenSq(V3.sub(X, r.F))));
      d.res('$d(X,g)\\approx ' + tdNum(r.d, 3).replace('−', '-') + '$');
    }
  } else if (v === 'sph') {
    const M = V.kM, r = V.kr, X = V.kX, mx = V3.dist(M, X);
    d.h('Kugel');
    d.e('K\\colon\\ ' + M.map((m, i) => '(' + 'xyz'[i] + (m ? (m > 0 ? '-' : '+') + vgT(Math.abs(m)) : '') + ')^2').join('+') + '=' + vgT(r * r));
    d.p('**Lage des Punktes** $X' + vgPtT(X) + '$: Abstand zum Mittelpunkt mit dem Radius $r=' + vgT(r) + '$ vergleichen.');
    d.e('|\\overrightarrow{MX}|=' + vgSqrt(vgLenSq(V3.sub(X, M))) + (Math.abs(mx - r) < 1e-9 ? '=' : mx < r ? '<' : '>') + vgT(r));
    d.p('$X$ liegt ' + (Math.abs(mx - r) < 1e-9 ? '**auf** der Kugel.' : mx < r ? '**innerhalb** der Kugel.' : '**ausserhalb** der Kugel.'));
    const E = V.kPl ? vgPlane(V.kE) : null;
    if (E) {
      const q = vgPtPlane(M, E);
      d.p('**Lage der Ebene** $E\\colon ' + tdPlaneTex(E) + '$: Abstand des Mittelpunkts zur Ebene (Hessesche Normalform).');
      d.e('d(M,E)\\approx ' + tdNum(q.d, 3).replace('−', '-') + (Math.abs(q.d - r) < 1e-9 ? '=' : q.d < r ? '<' : '>') + vgT(r));
      if (Math.abs(q.d - r) < 1e-9) d.p('$E$ ist eine **Tangentialebene**; sie berührt die Kugel im Punkt $B' + vgPtT(q.F) + '$.');
      else if (q.d < r) { d.p('$E$ schneidet die Kugel in einem **Schnittkreis** mit Mittelpunkt $F' + vgPtT(q.F) + '$ (Lotfusspunkt von $M$) und Radius'); d.e('\\rho=\\sqrt{r^2-d^2}=' + vgSqrt(r * r - q.d * q.d)); }
      else d.p('$E$ hat **keinen** gemeinsamen Punkt mit der Kugel.');
    }
    d.res('$K\\colon\\ M' + vgPtT(M) + ',\\ r=' + vgT(r) + '$');
  }
  return d;
}

// ═════════════ 3D-Objekte ═════════════
// {k:'pt'|'arr'|'seg'|'line'|'poly'|'circ'|'sph'|'arc'|'lab', …, col, hl, lab}
const VG_C = { a: '#2f6fed', b: '#e8590c', g: '#2b9348', v: '#9c36b5', r: '#d6336c', t: '#0c8599' };
function vgCirclePts(c, n, r, N) {
  const nn = V3.mul(n, 1 / V3.len(n)), h = Math.abs(nn[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = V3.cross(nn, h), l1 = V3.len(e1), u = V3.mul(e1, 1 / l1), w = V3.cross(nn, u), out = [];
  for (let i = 0; i <= (N || 72); i++) { const a = 2 * Math.PI * i / (N || 72); out.push(V3.add(c, V3.add(V3.mul(u, r * Math.cos(a)), V3.mul(w, r * Math.sin(a))))); }
  return out;
}
function vgObjects() {
  const V = VG, v = TD.view, O = [], R = TD.range, box = { x: [-R, R], y: [-R, R], z: [-R, R] }, lbox = { x: [-R * 1.15, R * 1.15], y: [-R * 1.15, R * 1.15], z: [-R * 1.15, R * 1.15] };   // Geraden bis knapp über den Bereich hinaus
  const pt = (p, col, lab, hl) => O.push({ k: 'pt', p, col, lab, hl });
  if (v === 'vec') {
    const A = V.vA, B = V.vB, M = V3.mul(V3.add(A, B), 0.5);
    if (V.vPos) { O.push({ k: 'arr', a: [0, 0, 0], b: A, col: VG_C.t, w: 1.6, hl: 'pos' }); O.push({ k: 'arr', a: [0, 0, 0], b: B, col: VG_C.t, w: 1.6, hl: 'pos' }); }
    if (V.vQuad) { const P1 = [B[0], A[1], A[2]], P2 = [B[0], B[1], A[2]]; [[A, P1, VG_C.r], [P1, P2, VG_C.g], [P2, B, VG_C.a]].forEach(([p, q, c]) => { if (V3.dist(p, q) > 1e-9) O.push({ k: 'seg', a: p, b: q, col: c, w: 2.2, dash: true, hl: 'comp' }); }); }
    O.push({ k: 'arr', a: A, b: B, col: VG_C.b, w: 3, hl: 'ab', lab: 'AB', labCol: VG_C.b });
    pt(A, '#222', 'A' + vgPt(A), 'A'); pt(B, '#222', 'B' + vgPt(B), 'B'); pt(M, VG_C.v, 'M' + vgPt(M), 'M');
  } else if (v === 'line') {
    const r = vgLines(V.gP, V.gu, V.gQ, V.gv);
    O.push({ k: 'line', P: V.gP, u: V.gu, col: VG_C.a, w: 2.4, lab: 'g', hl: 'g', box: lbox });
    O.push({ k: 'line', P: V.gQ, u: V.gv, col: VG_C.b, w: 2.4, lab: 'h', hl: 'h', box: lbox, dash: r.kind === 'same' });
    O.push({ k: 'arr', a: V.gP, b: V3.add(V.gP, V.gu), col: VG_C.a, w: 3, hl: 'dir', lab: 'u', labCol: VG_C.a });
    O.push({ k: 'arr', a: V.gQ, b: V3.add(V.gQ, V.gv), col: VG_C.b, w: 3, hl: 'dir', lab: 'v', labCol: VG_C.b });
    pt(V.gP, VG_C.a, 'P', 'P'); pt(V.gQ, VG_C.b, 'Q', 'Q');
    if (V.gPts) {                                                            // wandernde Punkte: X = P + t·u auf g, Y = Q + s·v auf h
      const X = V3.add(V.gP, V3.mul(V.gu, V.gt)), Y = V3.add(V.gQ, V3.mul(V.gv, V.gs));
      O.push({ k: 'seg', a: V.gP, b: X, col: VG_C.a, w: 5, hl: 'X' }); O.push({ k: 'seg', a: V.gQ, b: Y, col: VG_C.b, w: 5, hl: 'Y' });
      const r2 = q => q.map(c => Math.round(c * 100) / 100 + 0);
      pt(X, VG_C.a, 'X' + vgPt(r2(X)) + ', t = ' + tdNum(V.gt, 2), 'X'); pt(Y, VG_C.b, 'Y' + vgPt(r2(Y)) + ', s = ' + tdNum(V.gs, 2), 'Y');
    }
    if (r.kind === 'cut') pt(r.S, VG_C.g, 'S' + vgPt(r.S), 'S');
    if (r.kind === 'ws') { O.push({ k: 'seg', a: r.F1, b: r.F2, col: VG_C.r, w: 2, dash: true, hl: 'ws', lab: 'd ≈ ' + tdNum(r.d, 2) }); pt(r.F1, VG_C.r, null, 'ws'); pt(r.F2, VG_C.r, null, 'ws'); }
    if (r.kind === 'par') O.push({ k: 'seg', a: V.gQ, b: r.F, col: VG_C.r, w: 2, dash: true, lab: 'd ≈ ' + tdNum(r.d, 2) });
  } else if (v === 'dot') {
    const a = V.sa, b = V.sb, o = [0, 0, 0], la = V3.len(a), lb = V3.len(b);
    if (V.sCross) { const c = V3.cross(a, b); O.push({ k: 'poly', pts: [o, a, V3.add(a, b), b], col: VG_C.v, a: 0.18, hl: 'cr' }); O.push({ k: 'arr', a: o, b: c, col: VG_C.v, w: 3, lab: 'a×b', labCol: VG_C.v, hl: 'cr' }); }
    if (la > 1e-9 && lb > 1e-9) O.push({ k: 'arc', c: o, a, b, r: Math.min(la, lb) * 0.35, col: VG_C.g, hl: 'phi', lab: 'φ ≈ ' + tdNum(Math.acos(Math.max(-1, Math.min(1, V3.dot(a, b) / (la * lb)))) * 180 / Math.PI, 1) + '°' });
    O.push({ k: 'arr', a: o, b: a, col: VG_C.a, w: 3, lab: 'a', labCol: VG_C.a, hl: 'a' });
    O.push({ k: 'arr', a: o, b: b, col: VG_C.b, w: 3, lab: 'b', labCol: VG_C.b, hl: 'b' });
  } else if (v === 'dist') {
    const X = V.dX;
    if (V.dm === 'pe') {
      const E = vgPlane(V.dE);
      if (E) { const r = vgPtPlane(X, E), poly = tdPlanePolygon(E, box); if (poly.length >= 3) O.push({ k: 'poly', pts: poly, col: VG_C.a, a: 0.22, lab: 'E', hl: 'E' }); O.push({ k: 'seg', a: X, b: r.F, col: VG_C.r, w: 3, hl: 'd', lab: 'd ≈ ' + tdNum(r.d, 2) }); pt(r.F, VG_C.g, 'F' + vgPt(r.F), 'F'); }
    } else {
      const r = vgPtLine(X, V.dP, V.du);
      O.push({ k: 'line', P: V.dP, u: V.du, col: VG_C.a, w: 2.4, lab: 'g', hl: 'g', box: lbox });
      O.push({ k: 'seg', a: X, b: r.F, col: VG_C.r, w: 3, hl: 'd', lab: 'd ≈ ' + tdNum(r.d, 2) }); pt(r.F, VG_C.g, 'F' + vgPt(r.F), 'F');
    }
    pt(X, '#222', 'X' + vgPt(X), 'X');
  } else if (v === 'sph') {
    const M = V.kM, r = V.kr, E = V.kPl ? vgPlane(V.kE) : null;
    O.push({ k: 'sph', c: M, r, col: VG_C.a, hl: 'K' });
    if (E) {
      const q = vgPtPlane(M, E), poly = tdPlanePolygon(E, box);
      if (poly.length >= 3) O.push({ k: 'poly', pts: poly, col: VG_C.b, a: 0.16, lab: 'E', hl: 'E' });
      if (q.d < r - 1e-9) { O.push({ k: 'circ', pts: vgCirclePts(q.F, q.n, Math.sqrt(r * r - q.d * q.d)), col: VG_C.g, w: 3, hl: 'sk' }); pt(q.F, VG_C.g, null, 'sk'); }
      else if (Math.abs(q.d - r) < 1e-9) pt(q.F, VG_C.g, 'B' + vgPt(q.F), 'sk');
    }
    O.push({ k: 'seg', a: M, b: V3.add(M, [0, r, 0]), col: VG_C.a, w: 1.8, lab: 'r = ' + vgS(r) });
    O.push({ k: 'seg', a: M, b: V.kX, col: VG_C.r, w: 1.4, dash: true });
    pt(M, VG_C.a, 'M' + vgPt(M), 'M'); pt(V.kX, VG_C.r, 'X' + vgPt(V.kX), 'X');
  }
  return O;
}
// Gerade auf den Würfel zuschneiden
function vgClip(o) { const t = tdClipLine(o.P, o.u, o.box); return t && t[1] - t[0] > 1e-9 ? [V3.add(o.P, V3.mul(o.u, t[0])), V3.add(o.P, V3.mul(o.u, t[1]))] : null; }
function vgArcPts(o) {
  const ea = V3.mul(o.a, 1 / V3.len(o.a)), bp = V3.sub(o.b, V3.mul(ea, V3.dot(o.b, ea))), lb = V3.len(bp), phi = Math.acos(Math.max(-1, Math.min(1, V3.dot(o.a, o.b) / (V3.len(o.a) * V3.len(o.b))))), out = [];
  if (lb < 1e-9) return [];
  const eb = V3.mul(bp, 1 / lb);
  for (let i = 0; i <= 30; i++) { const t = phi * i / 30; out.push(V3.add(o.c, V3.add(V3.mul(ea, o.r * Math.cos(t)), V3.mul(eb, o.r * Math.sin(t))))); }
  return out;
}

// ── Zeichnen auf den Canvas (aus td3dDraw, nach Gitter und Achsen) ──
function vgDraw(h) {
  const { P, line, text, dot, arrow, lw, dark } = h, S = VG.S = { pts: [], hl: [] };
  const hlP = (id, pts3, close) => { if (id) S.hl.push({ id, pts: pts3.map(p => { const q = P(p); return [q.x, q.y]; }), close: !!close }); };
  const hlC = (id, p3, r) => { if (id) { const q = P(p3); S.hl.push({ id, c: [q.x, q.y, r || 10] }); } };
  const poly = (pts3, col, a, stroke) => { ctx.beginPath(); pts3.forEach((p3, k) => { const q = P(p3); if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); if (a) { ctx.closePath(); ctx.globalAlpha = dark ? a * 1.2 : a; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1; } if (stroke) { ctx.strokeStyle = col; ctx.lineWidth = lw(stroke); ctx.stroke(); } };
  const labs = [];
  const O = vgObjects();
  O.forEach(o => {
    if (o.k === 'poly') { poly(o.pts, o.col, o.a, 1.4); hlP(o.hl, o.pts, true); if (o.lab) { let best = null; o.pts.forEach(p3 => { const q = P(p3); if (!best || q.x * 0.35 - q.y > best.s) best = { q, s: q.x * 0.35 - q.y }; }); labs.push([o.lab, best.q.x - 14, best.q.y + 12, o.col, 14, true]); } }
    else if (o.k === 'sph') {
      const c = P(o.c), rr = o.r * h.g.s;
      ctx.beginPath(); ctx.arc(c.x, c.y, rr, 0, 7); ctx.globalAlpha = dark ? 0.16 : 0.1; ctx.fillStyle = o.col; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = o.col; ctx.lineWidth = lw(2); ctx.stroke();
      S.hl.push({ id: o.hl, c: [c.x, c.y, rr] });
      ctx.globalAlpha = 0.55; poly(vgCirclePts(o.c, [0, 0, 1], o.r), o.col, 0, 1); ctx.setLineDash([4, 4]); poly(vgCirclePts(o.c, [1, 0, 0], o.r), o.col, 0, 1); ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    else if (o.k === 'circ') { poly(o.pts, o.col, 0, o.w || 2.4); hlP(o.hl, o.pts); }
    else if (o.k === 'line') { const ab = vgClip(o); if (!ab) return; line(ab[0], ab[1], o.col, o.w || 2.4, o.dash ? [7, 5] : null); hlP(o.hl, ab); if (o.lab) { const q = P(V3.add(ab[0], V3.mul(V3.sub(ab[1], ab[0]), 0.88))); labs.push([o.lab, q.x + 10, q.y - 10, o.col, 15, true]); } }
    else if (o.k === 'seg') { line(o.a, o.b, o.col, o.w || 2, o.dash ? [6, 4] : null); hlP(o.hl, [o.a, o.b]); if (o.lab) { const q = P(V3.mul(V3.add(o.a, o.b), 0.5)); labs.push([o.lab, q.x + 8, q.y - 10, o.col, 12, true, 'left']); } }
    else if (o.k === 'arr') { if (V3.dist(o.a, o.b) < 1e-9) return; arrow(o.a, o.b, o.col, o.w || 2.4, 11); hlP(o.hl, [o.a, o.b]); if (o.lab) { const q = P(V3.add(o.a, V3.mul(V3.sub(o.b, o.a), 0.55))), pa = P(o.a), pb = P(o.b), dx = pb.x - pa.x, dy = pb.y - pa.y, dl = Math.hypot(dx, dy) || 1; labs.push([o.lab, q.x - dy / dl * 13, q.y + dx / dl * 13, o.labCol || o.col, 15, true]); } }
    else if (o.k === 'arc') { const pts = vgArcPts(o); if (pts.length) { poly([o.c].concat(pts), o.col, 0.25, 0); poly(pts, o.col, 0, 2.2); hlP(o.hl, [o.c].concat(pts), true); const q = P(pts[15]); labs.push([o.lab, q.x + 8, q.y - 8, o.col, 12, true, 'left']); } }
  });
  O.forEach(o => { if (o.k !== 'pt') return; dot(o.p, o.col, 4.5); hlC(o.hl, o.p, 11); if (o.lab) { const q = P(o.p); labs.push([o.lab, q.x + 7, q.y - 11, o.col === '#222' ? C.anno : o.col, 12, true, 'left']); } });
  labs.forEach(l => text(l[0], l[1], l[2], l[3], l[4], l[6] || 'center', l[5]));
}

// ── TikZ (aus td3dLatex, nach den Achsen) ──
function vgTex(L, h) {
  const { c3, f, lbl } = h, cols = {}, cn = col => { if (col === '#222') return 'black'; if (!cols[col]) { const nm = 'vg' + Object.keys(cols).length; cols[col] = nm; L.push('\\definecolor{' + nm + '}{RGB}{' + [1, 3, 5].map(k => parseInt(col.substr(k, 2), 16)).join(',') + '}'); } return cols[col]; };
  const tx = s => String(s).replace(/−/g, '-').replace(/ \| /g, '\\,|\\,').replace('≈', '\\approx').replace('φ', '\\varphi').replace('°', '^\\circ').replace('×', '\\times');
  const path = pts => pts.map(c3).join(' -- ');
  const O = vgObjects();
  L.push('  % ' + (VG_VIEWS.find(q => q[0] === TD.view) || ['', ''])[1]);
  O.forEach(o => {
    if (o.k === 'poly') L.push('  \\filldraw[fill=' + cn(o.col) + ', fill opacity=' + (o.a || 0.2) + ', draw=' + cn(o.col) + '] ' + path(o.pts) + ' -- cycle;');
    else if (o.k === 'sph') { L.push('  \\draw[' + cn(o.col) + ', thick, fill=' + cn(o.col) + ', fill opacity=0.08] ' + c3(o.c) + ' circle (' + f(o.r * h.u) + 'cm);'); L.push('  \\draw[' + cn(o.col) + ', opacity=0.6] ' + path(vgCirclePts(o.c, [0, 0, 1], o.r, 48)) + ';'); L.push('  \\draw[' + cn(o.col) + ', opacity=0.6, dashed] ' + path(vgCirclePts(o.c, [1, 0, 0], o.r, 48)) + ';'); }
    else if (o.k === 'circ') L.push('  \\draw[' + cn(o.col) + ', very thick] ' + path(o.pts.filter((_, i) => i % 2 === 0)) + ' -- cycle;');
    else if (o.k === 'line') { const ab = vgClip(o); if (ab) L.push('  \\draw[' + cn(o.col) + ', thick' + (o.dash ? ', dashed' : '') + '] ' + c3(ab[0]) + ' -- ' + c3(ab[1]) + (o.lab ? ' node[pos=0.9, anchor=south west, ' + lbl + '] {$' + o.lab + '$}' : '') + ';'); }
    else if (o.k === 'seg') L.push('  \\draw[' + cn(o.col) + ', thick' + (o.dash ? ', dashed' : '') + '] ' + c3(o.a) + ' -- ' + c3(o.b) + (o.lab ? ' node[midway, anchor=south west, font=\\small, ' + lbl + '] {$' + tx(o.lab) + '$}' : '') + ';');
    else if (o.k === 'arr') { if (V3.dist(o.a, o.b) > 1e-9) L.push('  \\draw[->, ' + cn(o.col) + ', very thick] ' + c3(o.a) + ' -- ' + c3(o.b) + (o.lab ? ' node[pos=0.55, anchor=south east, ' + lbl + '] {$\\vec{' + o.lab.replace('×', '}\\times\\vec{') + '}$}' : '') + ';'); }
    else if (o.k === 'arc') { const pts = vgArcPts(o); if (pts.length) L.push('  \\filldraw[' + cn(o.col) + ', fill opacity=0.25] ' + c3(o.c) + ' -- ' + path(pts) + ' -- cycle node[pos=0.5] {};'); if (pts.length) L.push('  \\node[' + cn(o.col) + ', anchor=south west, font=\\small, ' + lbl + '] at ' + c3(pts[15]) + ' {$' + tx(o.lab) + '$};'); }
  });
  O.forEach(o => { if (o.k === 'pt') L.push('  \\fill[' + cn(o.col) + '] ' + c3(o.p) + ' circle (1.8pt)' + (o.lab ? ' node[anchor=south west, font=\\small, ' + lbl + '] {$' + tx(o.lab) + '$}' : '') + ';'); });
}

// ═════════════ Karte, Zustand, Oberfläche ═════════════
// Platz für die Karte; gibt [Breite, Höhe] zurück, die der Raum abgibt
function vgDock(w, h) {
  const card = document.getElementById('dif-card'); if (!card) return [0, 0];
  if (!vgOn()) VG.S = null;
  if (!vgCardOn()) { if (TD.on) card.style.display = 'none'; return [0, 0]; }
  const show = VG.show.card; card.style.display = show ? 'flex' : 'none';
  if (!show) return [0, 0];
  const dock = w >= 760 ? stCardW(w, 0.36) : 0, dh = w < 760 ? Math.round(h * 0.5) : 0;
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh); card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
  vgCardRender();
  return [dock, dh];
}
function vgCardRender() {
  const body = document.getElementById('dif-card-body'); if (!body || !vgCardOn() || !VG.show.card) return;
  const disc = vgOn() ? null : tdDisc();
  const key = JSON.stringify(disc ? ['pl', disc.p.eq, disc.p.par, TD.bar.step, TD.range] : [TD.view, VG_KEYS.filter(k => k !== 'gt' && k !== 'gs').map(k => VG[k])]); if (key === VG.cardKey) return;   // t und s (wandernde Punkte) ändern den Rechenweg nicht
  VG.cardKey = key;
  let d = null; try { d = vgDoc(); } catch (e) { d = null; }
  document.getElementById('dif-card-title').textContent = 'Rechenweg: ' + (VG_VIEWS.find(q => q[0] === (TD.view || 'pl')) || ['', ''])[1];
  body.innerHTML = d && typeof ST !== 'undefined' ? ST.renderDoc(d) : '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}
function vgCardLatex() { if (!vgCardOn()) return ''; try { return '% Rechenweg aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(vgDoc()); } catch (e) { return '% Fehler beim Erzeugen: ' + e.message; } }
function vgCapture() { const o = {}; VG_KEYS.forEach(k => { o[k] = VG[k]; }); return JSON.parse(JSON.stringify(o)); }
function vgFix(o) {
  const d = vgDefaults();
  ['vA', 'vB', 'gP', 'gu', 'gQ', 'gv', 'sa', 'sb', 'dX', 'dP', 'du', 'kM', 'kX'].forEach(k => { if (!(Array.isArray(o[k]) && o[k].length === 3 && o[k].every(x => isFinite(+x)))) o[k] = d[k]; o[k] = o[k].map(Number); });
  ['gu', 'gv', 'du'].forEach(k => { if (V3.len(o[k]) < 1e-9) o[k] = d[k]; });
  ['vPos', 'vQuad', 'sCross', 'kPl', 'gPts'].forEach(k => { o[k] = !!o[k]; });
  ['gt', 'gs'].forEach(k => { o[k] = isFinite(+o[k]) && Math.abs(+o[k]) <= 50 ? +o[k] : 1; });
  if (o.dm !== 'pg') o.dm = 'pe'; o.kr = +o.kr > 0 ? +o.kr : d.kr;
  ['dE', 'kE'].forEach(k => { o[k] = String(o[k] || d[k]); });
  o.show = { card: !(o.show && o.show.card === false) };
  return o;
}
function vgApply(s) { VG.anim = null; const d = vgDefaults(); if (s && typeof s === 'object') VG_KEYS.forEach(k => { if (k in s) d[k] = JSON.parse(JSON.stringify(s[k])); }); vgFix(d); Object.keys(d).forEach(k => { VG[k] = d[k]; }); VG.cardKey = ''; vgRefreshUI(); }
// Bereich so wählen, dass alle Eingaben sichtbar sind
function vgFitRange() {
  const V = VG, v = TD.view, pts = v === 'vec' ? [V.vA, V.vB] : v === 'line' ? [V.gP, V.gQ, V3.add(V.gP, V.gu), V3.add(V.gQ, V.gv)] : v === 'dot' ? [V.sa, V.sb].concat(V.sCross ? [V3.cross(V.sa, V.sb)] : []) : v === 'dist' ? [V.dX, V.dP] : v === 'sph' ? [V3.add(V.kM, [V.kr, V.kr, V.kr]), V3.sub(V.kM, [V.kr, V.kr, V.kr]), V.kX] : [];
  if (!pts.length) return;
  let m = Math.max(...pts.map(p => Math.max(...p.map(Math.abs))));
  // Geraden: bei Schnittpunkt / Lotfusspunkten auch diese einbeziehen und den Raum etwas grösser lassen, damit die Geraden lang genug sind
  if (v === 'line') { const r = vgLines(V.gP, V.gu, V.gQ, V.gv); [r.S, r.F1, r.F2, r.F].forEach(q => { if (q) m = Math.max(m, ...q.map(Math.abs)); }); m *= 1.3; }
  if (v === 'dist' && V.dm === 'pg') m = Math.max(m, ...vgPtLine(V.dX, V.dP, V.du).F.map(Math.abs)) * 1.2;
  TD.range = Math.max(5, Math.min(60, Math.ceil(m * 1.2)));
}
// ── Geraden: Parameter laufen lassen ──
// Zielwerte: Schnittpunkt (t, s), bei windschiefen Geraden die Punkte kleinsten Abstands; parallel: kein Ziel.
function vgParTargets() {
  const V = VG, r = vgLines(V.gP, V.gu, V.gQ, V.gv), par = (X, P, u) => V3.dot(V3.sub(X, P), u) / V3.dot(u, u);
  if (r.kind === 'cut') return { t: par(r.S, V.gP, V.gu), s: par(r.S, V.gQ, V.gv), kind: r.kind };
  if (r.kind === 'ws') return { t: par(r.F1, V.gP, V.gu), s: par(r.F2, V.gQ, V.gv), kind: r.kind };
  return { t: null, s: null, kind: r.kind };
}
// Erst läuft t (X wandert auf g), dann s (Y wandert auf h). Schneiden sich die Geraden, treffen sich X und Y im Schnittpunkt –
// mit im Allgemeinen verschiedenen Werten von t und s.
function vgAnimToggle() {
  if (VG.anim) { VG.anim = null; vgChanged(); return; }
  const tr = vgParTargets(), c = v => Math.round(v * 100) / 100;
  const t1 = tr.t === null ? 3 : c(tr.t), s1 = tr.s === null ? 3 : c(tr.s);
  VG.gPts = true; VG.gt = Math.min(-2, t1 - 3); VG.gs = Math.min(-2, s1 - 3);
  VG.anim = { last: 0, i: 0, wait: 0.5, steps: [['gt', t1], ['gs', s1]] };
  vgRefreshUI(); scheduleDraw(); requestAnimationFrame(vgAnimFrame);
}
function vgAnimFrame(ts) {
  const a = VG.anim; if (!a) return;
  if (!vgOn() || TD.view !== 'line') { VG.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (a.wait > 0) { a.wait -= dt; requestAnimationFrame(vgAnimFrame); return; }
  const [k, to] = a.steps[a.i], d = to - VG[k], st = 1.1 * dt;
  if (Math.abs(d) <= st) { VG[k] = to; a.i++; a.wait = 1.0; } else VG[k] = Math.round((VG[k] + Math.sign(d) * st) * 1000) / 1000;
  const u = VG.ui && VG.ui['sl_' + k]; if (u) { u[0].value = VG[k]; u[1].textContent = tdNum(VG[k], 2); }
  scheduleDraw();
  if (a.i >= a.steps.length) { VG.anim = null; vgChanged(); return; }
  requestAnimationFrame(vgAnimFrame);
}
function vgChanged() { VG.cardKey = ''; if (typeof tdChanged === 'function') tdChanged(); else scheduleDraw(); vgRefreshUI(); }

function vgBuildUI() {
  const panel = document.getElementById('td-panel'); if (!panel || VG.ui) return;
  const ui = VG.ui = {};
  ui.sel = document.getElementById('td-view'); ui.desc = document.getElementById('td-vg-desc'); ui.ex = document.getElementById('td-vg-ex'); ui.body = document.getElementById('td-vg-body');
  if (!ui.sel) return;
  VG_VIEWS.forEach(([id, nm]) => { const o = document.createElement('option'); o.value = id; o.textContent = nm; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { TD.view = ui.sel.value; if (TD.view !== 'pl') vgFitRange(); vgChanged(); });
  ui.ex.addEventListener('change', () => { const i = ui.ex.value; ui.ex.value = ''; const e = (VG_EX[TD.view] || [])[+i]; if (!e) return; Object.keys(e[1]).forEach(k => { VG[k] = JSON.parse(JSON.stringify(e[1][k])); }); if (TD.view === 'dot' && !('sCross' in e[1])) VG.sCross = false; vgFix(VG); vgFitRange(); vgChanged(); });
  const cl = document.getElementById('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!vgCardOn()) return; VG.show.card = false; vgChanged(); });
  vgRefreshUI();
}
function vgRefreshUI() {
  const ui = VG.ui; if (!ui || !ui.sel) return;
  const v = TD.view || 'pl', pl = v === 'pl';
  ui.sel.value = v;
  const dd = VG_DESC[v]; ui.desc.textContent = dd[1];
  vgHead();
  ['td-pl-ui', 'td-pl-bars'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = pl ? '' : 'none'; });
  document.querySelectorAll('#td-panel .td-pl-only').forEach(e => { e.style.display = pl ? '' : 'none'; });
  ui.ex.style.display = pl ? 'none' : ''; ui.body.style.display = pl ? 'none' : '';
  if (typeof tdLegend === 'function') tdLegend();
  if (pl) return;
  ui.ex.replaceChildren(Object.assign(document.createElement('option'), { value: '', textContent: 'Beispiel wählen …' }));
  (VG_EX[v] || []).forEach((e, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = e[0]; ui.ex.appendChild(o); });
  const B = ui.body; B.replaceChildren();
  const group = t => { const g = document.createElement('div'); g.className = 'subpanel-label'; g.style.marginTop = '8px'; g.textContent = t; B.appendChild(g); };
  const row = (label, el) => { const r = document.createElement('div'); r.className = 'settings-row'; r.style.gap = '8px'; const lb = document.createElement('label'); lb.textContent = label; lb.style.minWidth = '64px'; r.append(lb, el); B.appendChild(r); return r; };
  const vec = (label, k, nonzero) => { const inp = document.createElement('input'); inp.type = 'text'; inp.value = VG[k].map(x => tdFrac(x).replace('−', '-')).join(' | '); inp.style.width = '130px'; inp.setAttribute('translate', 'no'); inp.placeholder = '1 | 2 | 3'; inp.addEventListener('change', () => { const p = vgParse3(inp.value); if (p && (!nonzero || V3.len(p) > 1e-9)) { VG[k] = p; vgFitRange(); } vgChanged(); }); row(label, inp); };
  const txt = (label, k) => { const inp = document.createElement('input'); inp.type = 'text'; inp.value = VG[k]; inp.style.width = '130px'; inp.setAttribute('translate', 'no'); inp.addEventListener('change', () => { if (vgPlane(inp.value)) VG[k] = inp.value.trim(); vgChanged(); }); row(label, inp); };
  const num = (label, k) => { const inp = document.createElement('input'); inp.type = 'text'; inp.value = tdFrac(VG[k]).replace('−', '-'); inp.style.width = '70px'; inp.addEventListener('change', () => { const x = vgNum(inp.value); if (x > 0) { VG[k] = x; vgFitRange(); } vgChanged(); }); row(label, inp); };
  const check = (label, k) => { const r = document.createElement('div'), lb = document.createElement('label'), cb = document.createElement('input'); r.className = 'settings-row'; cb.type = 'checkbox'; cb.checked = !!VG[k]; lb.append(cb, document.createTextNode(' ' + label)); cb.addEventListener('change', () => { VG[k] = cb.checked; if (k === 'sCross') vgFitRange(); vgChanged(); }); r.appendChild(lb); B.appendChild(r); };
  if (v === 'vec') { group('Punkte'); vec('A', 'vA'); vec('B', 'vB'); check('Ortsvektoren zeigen', 'vPos'); check('Komponenten (Weg entlang der Achsen)', 'vQuad'); }
  else if (v === 'line') {
    group('Gerade g: X = P + t·u'); vec('P', 'gP'); vec('u', 'gu', true); group('Gerade h: X = Q + s·v'); vec('Q', 'gQ'); vec('v', 'gv', true);
    group('Parameter: Punkte auf den Geraden'); check('Punkte X (auf g) und Y (auf h) zeigen', 'gPts');
    if (VG.gPts) {
      const tr = vgParTargets(), mx = Math.max(4, Math.ceil(Math.max(Math.abs(tr.t || 0), Math.abs(tr.s || 0), Math.abs(VG.gt), Math.abs(VG.gs))) + 1);
      const sld = (label, k) => { const w = document.createElement('div'); w.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;'; const sl = document.createElement('input'), val = document.createElement('b'); sl.type = 'range'; sl.min = -mx; sl.max = mx; sl.step = 0.05; sl.value = VG[k]; sl.style.flex = '1'; val.style.cssText = 'min-width:38px;text-align:right;font-size:12px;'; val.textContent = tdNum(VG[k], 2); val.setAttribute('translate', 'no');
        sl.addEventListener('input', () => { VG.anim = null; VG[k] = Math.round(parseFloat(sl.value) * 100) / 100; val.textContent = tdNum(VG[k], 2); scheduleDraw(); });
        sl.addEventListener('change', () => { vgChanged(); });
        w.append(sl, val); row(label, w); VG.ui['sl_' + k] = [sl, val]; };
      sld('t', 'gt'); sld('s', 'gs');
      const bt2 = document.createElement('button'); bt2.type = 'button'; bt2.textContent = VG.anim ? '⏸ Pause' : '▶ t und s laufen lassen'; bt2.style.cssText = 'margin-top:6px;width:100%;'; bt2.addEventListener('click', vgAnimToggle); B.appendChild(bt2);
    }
  }
  else if (v === 'dot') { group('Vektoren'); vec('a', 'sa'); vec('b', 'sb'); check('Vektorprodukt a × b zeigen', 'sCross'); }
  else if (v === 'dist') {
    group('Punkt und Objekt');
    const sel = document.createElement('select'); [['pe', 'Punkt–Ebene'], ['pg', 'Punkt–Gerade']].forEach(([a, b]) => sel.appendChild(Object.assign(document.createElement('option'), { value: a, textContent: b }))); sel.value = VG.dm; sel.addEventListener('change', () => { VG.dm = sel.value; vgFitRange(); vgChanged(); }); row('Abstand', sel);
    vec('X', 'dX'); if (VG.dm === 'pe') txt('Ebene E', 'dE'); else { vec('P', 'dP'); vec('u', 'du', true); }
  } else if (v === 'sph') { group('Kugel, Punkt, Ebene'); vec('M', 'kM'); num('Radius r', 'kr'); vec('X', 'kX'); check('Ebene zeigen', 'kPl'); if (VG.kPl) txt('Ebene E', 'kE'); }
  const r = document.createElement('div'), lb = document.createElement('label'), cb = document.createElement('input'); r.className = 'settings-row'; cb.type = 'checkbox'; cb.checked = VG.show.card; lb.append(cb, document.createTextNode(' Rechenweg als Karte anzeigen')); cb.addEventListener('change', () => { VG.show.card = cb.checked; vgChanged(); }); r.appendChild(lb); B.appendChild(r);
  const bt = document.createElement('button'); bt.type = 'button'; bt.textContent = 'LaTeX (Rechenweg)'; bt.style.marginTop = '6px';
  bt.addEventListener('click', () => { const ta = document.getElementById('td-latex-out'); if (ta) { ta.value = vgCardLatex(); const det = ta.closest('details'); if (det) det.open = true; } });
  B.appendChild(bt);
}
document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { VG.cardKey = ''; if (TD.on) { vgRefreshUI(); scheduleDraw(); } }, ms)); });
vgBuildUI();
