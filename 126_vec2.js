// ═══════════════════════════════════════════════════════════════════
// 126_vec2.js — Vektoren in der Ebene (Thema aus dem Baukasten 120_kit.js)
//
// V2: Rechenkern ohne DOM (Betrag, Skalarprodukt, Winkel, Gerade in Parameterform, Lotfusspunkt, Rechenwege).
// Punkte und Vektoren sind Paare [x, y]; beim Ziehen auf halbe Einheiten gerastet, Bereich ±50.
// ═══════════════════════════════════════════════════════════════════
const V2 = (function () {
  const LIM = 50, TMAX = 6;
  const trim = s => { s = String(parseFloat(s)); return s === '-0' ? '0' : s; };
  const fmt = v => (v === null || !isFinite(v) ? '?' : trim((+v).toFixed(Math.abs(v) >= 100 ? 1 : 3)));
  const eq = v => (Math.abs(v - parseFloat(fmt(v))) < 1e-9 * Math.max(1, Math.abs(v)) ? '=' : '\\approx ') + fmt(v);
  const pn = v => (v < 0 ? '(' + fmt(v) + ')' : fmt(v));
  const eqA = v => { const s = trim((+v).toFixed(1)); return (Math.abs(v - parseFloat(s)) < 1e-9 ? '=' : '\\approx ') + s + '^\\circ'; };   // Winkel in Grad, eine Nachkommastelle
  const sg = v => (v < 0 ? '-' : '+') + fmt(Math.abs(v));
  const pm = v => '\\begin{pmatrix}' + fmt(v[0]) + '\\\\' + fmt(v[1]) + '\\end{pmatrix}';     // Spaltenvektor im Rechenweg
  const bn = v => '\\binom{' + fmt(v[0]) + '}{' + fmt(v[1]) + '}';                               // Spaltenvektor im Bild
  const pt = (n, p) => n + '(' + fmt(p[0]) + '\\,|\\,' + fmt(p[1]) + ')';
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (r, a) => [r * a[0] + 0, r * a[1] + 0];
  const len = v => Math.hypot(v[0], v[1]), dot = (a, b) => a[0] * b[0] + a[1] * b[1], det = (a, b) => a[0] * b[1] - a[1] * b[0];
  const zero = v => len(v) < 1e-9;
  const R6 = v => Math.round(v * 1e6) / 1e6 + 0;
  const snap = v => Math.max(-LIM, Math.min(LIM, Math.round(v * 2) / 2 + 0));
  const ptOk = p => (Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number' && isFinite(p[0]) && isFinite(p[1]) ? [Math.max(-LIM, Math.min(LIM, R6(p[0]))), Math.max(-LIM, Math.min(LIM, R6(p[1])))] : null);
  const dirAngle = v => (zero(v) ? null : (Math.atan2(v[1], v[0]) * 180 / Math.PI + 360) % 360);          // Richtungswinkel 0° … 360°
  const between = (a, b) => (zero(a) || zero(b) ? null : Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b))))) * 180 / Math.PI);
  // Gerade A + t·v: Normalenvektor n = (v₂, −v₁), Koordinatengleichung n₁·x + n₂·y = c, Steigung m und Achsenabschnitt q (null, wenn senkrecht)
  function lineOf(A, v) { const n = [v[1] + 0, -v[0] + 0], c = dot(n, A), m = Math.abs(v[0]) < 1e-9 ? null : v[1] / v[0]; return { n, c, m, q: m === null ? null : A[1] - m * A[0] }; }
  // Lotfusspunkt von P auf die Gerade A + t·v
  function foot(A, v, P) { const w = sub(P, A), t = dot(w, v) / dot(v, v), F = add(A, mul(t, v)); return { t, F, d: len(sub(P, F)) }; }
  // Summanden und Ergebnis für Summe, Differenz, Linearkombination
  function combo(P) { const p1 = P.mode === 'lin' ? mul(P.r, P.a) : P.a, p2 = P.mode === 'lin' ? mul(P.s, P.b) : P.mode === 'sub' ? mul(-1, P.b) : P.b; return { p1, p2, res: add(p1, p2) }; }
  const comboTex = P => (P.mode === 'lin' ? fmt(P.r) + '\\cdot \\vec{a}' + (P.s < 0 ? '-' : '+') + fmt(Math.abs(P.s)) + '\\cdot \\vec{b}' : P.mode === 'sub' ? '\\vec{a}-\\vec{b}' : '\\vec{a}+\\vec{b}');
  const lineTex = (A, v, f) => 'g:\\ \\vec{r}=' + f(A) + '+t\\cdot ' + f(v);
  const WORD = { acute: 'Spitzer Winkel: Das Skalarprodukt ist positiv.', right: 'Rechter Winkel: Das Skalarprodukt ist null.', obtuse: 'Stumpfer Winkel: Das Skalarprodukt ist negativ.', none: 'Ein Nullvektor hat keine Richtung.' };
  const dotWord = (a, b) => (zero(a) || zero(b) ? WORD.none : Math.abs(dot(a, b)) < 1e-9 ? WORD.right : dot(a, b) > 0 ? WORD.acute : WORD.obtuse);

  // ── Rechenwege ──
  const mk = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const lenTex = (name, v) => '|' + name + '|=\\sqrt{' + pn(v[0]) + '^2+' + pn(v[1]) + '^2}=\\sqrt{' + fmt(dot(v, v)) + '}' + (Number.isInteger(Math.sqrt(dot(v, v))) ? '=' + fmt(len(v)) : '\\approx ' + fmt(len(v)));
  function docComp(P) {
    const B = mk(), v = sub(P.B, P.A), L = len(v);
    B.p('**Komponenten:** Koordinaten des Endpunkts minus Koordinaten des Anfangspunkts.');
    B.e('\\vec{AB}=\\begin{pmatrix}' + fmt(P.B[0]) + '-' + pn(P.A[0]) + '\\\\' + fmt(P.B[1]) + '-' + pn(P.A[1]) + '\\end{pmatrix}=' + pm(v), 'b');
    if (zero(v)) { B.note('A und B fallen zusammen: Das ist der Nullvektor. Er hat die Länge 0 und keine Richtung.'); B.res('$\\vec{AB}=' + pm(v) + '$ ist der Nullvektor'); return { title: 'Vektor und Betrag', st: B.st }; }
    B.p('**Betrag (Länge):** Satz des Pythagoras im Dreieck aus den beiden Komponenten.');
    B.e(lenTex('\\vec{AB}', v), 'b');
    const phi = dirAngle(v);
    B.p('**Richtungswinkel:** Winkel zwischen der positiven x-Richtung und dem Vektor, im Gegenuhrzeigersinn gemessen.');
    if (Math.abs(v[0]) < 1e-9) B.e('\\varphi' + eqA(phi), 'v');
    else B.e('\\tan\\varphi=\\frac{' + fmt(v[1]) + '}{' + fmt(v[0]) + '}\\quad\\Rightarrow\\quad \\varphi' + eqA(phi), 'v');
    if (v[0] < -1e-9) B.note('Der Vektor zeigt nach links: Zum Wert des Taschenrechners kommen $180^\\circ$ dazu.');
    B.p('**Einheitsvektor:** Der Vektor wird durch seinen Betrag geteilt; so bleibt die Richtung, und die Länge wird 1.');
    B.e('\\vec{e}=\\frac{1}{' + fmt(L) + '}\\cdot ' + pm(v) + '\\approx ' + pm(mul(1 / L, v)), 'v');
    B.p('**Gegenvektor:** gleiche Länge, entgegengesetzte Richtung.');
    B.e('\\vec{BA}=-\\vec{AB}=' + pm(mul(-1, v)), 'o');
    B.res('$\\vec{AB}=' + pm(v) + '$ mit dem Betrag $' + fmt(L) + '$');
    return { title: 'Vektor und Betrag', st: B.st };
  }
  function docAdd(P) {
    const B = mk(), a = P.a, b = P.b, c = combo(P);
    B.p('**Gegeben:**'); B.e('\\vec{a}=' + pm(a) + ',\\quad \\vec{b}=' + pm(b), 'b');
    if (P.mode === 'add') {
      B.p('**Summe:** Die Komponenten werden einzeln addiert. Im Bild wird $\\vec{b}$ an die Spitze von $\\vec{a}$ gehängt.');
      B.e('\\vec{a}+\\vec{b}=\\begin{pmatrix}' + fmt(a[0]) + '+' + pn(b[0]) + '\\\\' + fmt(a[1]) + '+' + pn(b[1]) + '\\end{pmatrix}=' + pm(c.res), 'r');
      B.note('Die Reihenfolge spielt keine Rolle: $\\vec{a}+\\vec{b}=\\vec{b}+\\vec{a}$. Beide Wege führen im Parallelogramm zur selben Ecke.');
    } else if (P.mode === 'sub') {
      B.p('**Differenz:** Die Komponenten werden einzeln subtrahiert. Das ist dasselbe wie die Summe mit dem Gegenvektor $-\\vec{b}$.');
      B.e('\\vec{a}-\\vec{b}=\\begin{pmatrix}' + fmt(a[0]) + '-' + pn(b[0]) + '\\\\' + fmt(a[1]) + '-' + pn(b[1]) + '\\end{pmatrix}=' + pm(c.res), 'r');
      B.note('$\\vec{a}-\\vec{b}$ führt von der Spitze von $\\vec{b}$ zur Spitze von $\\vec{a}$.');
    } else {
      B.p('**Vielfache:** Jede Komponente wird mit der Zahl multipliziert.');
      B.e(fmt(P.r) + '\\cdot \\vec{a}=' + pm(c.p1) + ',\\quad ' + fmt(P.s) + '\\cdot \\vec{b}=' + pm(c.p2), 'b');
      B.p('**Linearkombination:** Die beiden Vielfachen werden addiert.');
      B.e(comboTex(P) + '=' + pm(c.p1) + '+' + pm(c.p2) + '=' + pm(c.res), 'r');
      if (Math.abs(det(a, b)) < 1e-9) B.note('$\\vec{a}$ und $\\vec{b}$ sind parallel: Alle Linearkombinationen liegen auf einer Geraden.');
      else B.note('$\\vec{a}$ und $\\vec{b}$ sind nicht parallel: Mit passenden Faktoren lässt sich jeder Vektor der Ebene erreichen.');
    }
    B.p('**Betrag des Ergebnisses:**'); B.e(lenTex(comboTex(P), c.res), 'r');
    B.res('$' + comboTex(P) + '=' + pm(c.res) + '$');
    return { title: 'Rechnen mit Vektoren', st: B.st };
  }
  function docDot(P) {
    const B = mk(), a = P.a, b = P.b, d = dot(a, b);
    B.p('**Skalarprodukt:** Die Komponenten werden paarweise multipliziert und die Produkte addiert. Das Ergebnis ist eine Zahl.');
    B.e('\\vec{a}\\cdot \\vec{b}=' + fmt(a[0]) + '\\cdot ' + pn(b[0]) + '+' + pn(a[1]) + '\\cdot ' + pn(b[1]) + '=' + fmt(d), 'v');
    if (zero(a) || zero(b)) { B.note('Einer der Vektoren ist der Nullvektor: Ein Winkel lässt sich nicht angeben.'); B.res('$\\vec{a}\\cdot \\vec{b}=0$'); return { title: 'Skalarprodukt und Winkel', st: B.st }; }
    B.p('**Beträge:**'); B.e(lenTex('\\vec{a}', a), 'b'); B.e(lenTex('\\vec{b}', b), 'g');
    const phi = between(a, b);
    B.p('**Winkel:** Das Skalarprodukt ist auch $|\\vec{a}|\\cdot |\\vec{b}|\\cdot \\cos\\varphi$. Auflösen nach $\\cos\\varphi$:');
    B.e('\\cos\\varphi=\\frac{\\vec{a}\\cdot \\vec{b}}{|\\vec{a}|\\cdot |\\vec{b}|}=\\frac{' + fmt(d) + '}{' + fmt(len(a)) + '\\cdot ' + fmt(len(b)) + '}' + eq(d / (len(a) * len(b))) + '\\quad\\Rightarrow\\quad \\varphi' + eqA(phi), 'v');
    if (Math.abs(d) < 1e-9) B.note('Das Skalarprodukt ist null: Die beiden Vektoren stehen senkrecht aufeinander.');
    B.p('**Projektion von b auf a:** Länge des Schattens von $\\vec{b}$ in Richtung von $\\vec{a}$ (negativ, wenn er in die Gegenrichtung zeigt).');
    B.e('b_a=\\frac{\\vec{a}\\cdot \\vec{b}}{|\\vec{a}|}=\\frac{' + fmt(d) + '}{' + fmt(len(a)) + '}' + eq(d / len(a)), 'o');
    B.p('**Fläche des Parallelogramms**, das die beiden Vektoren aufspannen:');
    B.e('A=|a_1\\cdot b_2-a_2\\cdot b_1|=|' + fmt(a[0]) + '\\cdot ' + pn(b[1]) + '-' + pn(a[1]) + '\\cdot ' + pn(b[0]) + '|=' + fmt(Math.abs(det(a, b))));
    B.res('$\\vec{a}\\cdot \\vec{b}=' + fmt(d) + '$, Winkel $\\varphi' + eqA(phi) + '$');
    return { title: 'Skalarprodukt und Winkel', st: B.st };
  }
  function lineDoc(B, A, v) {
    const L = lineOf(A, v);
    B.p('**Normalenvektor:** Die Komponenten des Richtungsvektors werden vertauscht, und eine wechselt das Vorzeichen. So wird das Skalarprodukt mit $\\vec{v}$ null.');
    B.e('\\vec{n}=' + pm(L.n) + ',\\qquad \\vec{n}\\cdot \\vec{v}=' + fmt(L.n[0]) + '\\cdot ' + pn(v[0]) + '+' + pn(L.n[1]) + '\\cdot ' + pn(v[1]) + '=0', 'o');
    B.p('**Koordinatengleichung:** Für jeden Punkt der Geraden hat das Skalarprodukt mit $\\vec{n}$ denselben Wert wie für A.');
    B.e(fmt(L.n[0]) + '\\cdot x' + sg(L.n[1]) + '\\cdot y=' + fmt(L.n[0]) + '\\cdot ' + pn(A[0]) + sg(L.n[1]) + '\\cdot ' + pn(A[1]) + '=' + fmt(L.c), 'o');
    if (L.m === null) B.note('Der Richtungsvektor hat keine x-Komponente: Die Gerade ist senkrecht und hat die Gleichung $x=' + fmt(A[0]) + '$.');
    else {
      B.p('**Funktionsgleichung:** Die Steigung ist das Verhältnis der Komponenten des Richtungsvektors.');
      B.e('m=\\frac{v_2}{v_1}=\\frac{' + fmt(v[1]) + '}{' + fmt(v[0]) + '}' + eq(L.m) + ',\\qquad q=' + fmt(A[1]) + '-' + pn(L.m) + '\\cdot ' + pn(A[0]) + eq(L.q), 'g');
      B.e('y=' + fmt(L.m) + '\\cdot x' + (Math.abs(L.q) < 1e-12 ? '' : sg(L.q)), 'g');
    }
  }
  function docLine(P) {
    const B = mk(), A = P.A, v = P.v, Q = add(A, mul(P.t, v));
    B.p('**Parameterform:** Vom Stützpunkt A aus geht man das t-Fache des Richtungsvektors.');
    B.e(lineTex(A, v, pm), 'b');
    B.p('**Punkt zum Parameter** $t=' + fmt(P.t) + '$:');
    B.e('\\vec{OP}=' + pm(A) + (P.t < 0 ? '-' : '+') + fmt(Math.abs(P.t)) + '\\cdot ' + pm(v) + '=' + pm(Q) + '\\quad\\Rightarrow\\quad ' + pt('P', Q), 'v');
    lineDoc(B, A, v);
    B.res('$' + pt('P', Q) + '$ liegt für $t=' + fmt(P.t) + '$ auf $g$');
    return { title: 'Gerade in Parameterform', st: B.st };
  }
  function docDist(P) {
    const B = mk(), A = P.A, v = P.v, Q = P.P, w = sub(Q, A), f = foot(A, v, Q);
    B.p('**Gerade:**'); B.e(lineTex(A, v, pm), 'b');
    B.p('**Verbindungsvektor** vom Stützpunkt zum Punkt P:');
    B.e('\\vec{AP}=\\begin{pmatrix}' + fmt(Q[0]) + '-' + pn(A[0]) + '\\\\' + fmt(Q[1]) + '-' + pn(A[1]) + '\\end{pmatrix}=' + pm(w), 'v');
    B.p('**Parameter des Lotfusspunkts:** $\\vec{AP}$ wird auf den Richtungsvektor projiziert.');
    B.e('t_F=\\frac{\\vec{AP}\\cdot \\vec{v}}{\\vec{v}\\cdot \\vec{v}}=\\frac{' + fmt(w[0]) + '\\cdot ' + pn(v[0]) + '+' + pn(w[1]) + '\\cdot ' + pn(v[1]) + '}{' + pn(v[0]) + '^2+' + pn(v[1]) + '^2}=\\frac{' + fmt(dot(w, v)) + '}{' + fmt(dot(v, v)) + '}' + eq(f.t), 'o');
    B.p('**Lotfusspunkt:** $t_F$ in die Geradengleichung einsetzen.');
    B.e('\\vec{OF}=' + pm(A) + (f.t < 0 ? '-' : '+') + fmt(Math.abs(f.t)) + '\\cdot ' + pm(v) + (Math.abs(f.F[0] - parseFloat(fmt(f.F[0]))) + Math.abs(f.F[1] - parseFloat(fmt(f.F[1]))) < 1e-9 ? '=' : '\\approx ') + pm(f.F), 'o');
    B.p('**Abstand:** Länge des Vektors von P zum Lotfusspunkt.');
    const u = sub(f.F, Q);
    B.e('d=|\\vec{PF}|=\\sqrt{' + pn(u[0]) + '^2+' + pn(u[1]) + '^2}' + eq(f.d), 'r');
    B.p('**Kontrolle:** Fläche des Parallelogramms aus $\\vec{AP}$ und $\\vec{v}$, geteilt durch die Grundseite $|\\vec{v}|$.');
    B.e('d=\\frac{|' + fmt(w[0]) + '\\cdot ' + pn(v[1]) + '-' + pn(w[1]) + '\\cdot ' + pn(v[0]) + '|}{\\sqrt{' + fmt(dot(v, v)) + '}}' + eq(Math.abs(det(w, v)) / len(v)), 'r');
    if (P.sym) { B.p('**Spiegelpunkt:** Von P aus geht man zweimal den Weg zum Lotfusspunkt.'); B.e('\\vec{OP\'}=\\vec{OP}+2\\cdot \\vec{PF}=' + pm(add(Q, mul(2, u))), 'v'); }
    if (f.d < 1e-9) B.note('P liegt auf der Geraden: Der Abstand ist 0, und der Lotfusspunkt ist P selbst.');
    B.res('Abstand $d' + eq(f.d) + '$, Lotfusspunkt $' + pt('F', f.F) + '$');
    return { title: 'Abstand eines Punktes von einer Geraden', st: B.st };
  }
  const doc = (v, P) => ({ comp: docComp, add: docAdd, dot: docDot, line: docLine, dist: docDist })[v](P);
  return { LIM, TMAX, fmt, eq, eqA, pm, bn, pt, add, sub, mul, len, dot, det, zero, snap, ptOk, dirAngle, between, lineOf, foot, combo, comboTex, lineTex, WORD, dotWord, doc };
})();

// ── Bilder ──
let v2Hold = null;                                                    // Ausschnitt, solange gezogen wird
function v2Frame(S, W, H, C, pts, o) {
  // Ausschnitt um alle Punkte und den Ursprung, gleicher Massstab in x und y
  const fs = C.fs; let x0 = 0, x1 = 0, y0 = 0, y1 = 0; pts.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
  let c = { cx: Math.round(x0 + x1) / 2, cy: Math.round(y0 + y1) / 2, half: Math.max(4, Math.ceil(Math.max(x1 - x0, y1 - y0) / 2 + 1.5)) };
  if (!C.exp) { if (C.hover && v2Hold && v2Hold.v === C.view) c = v2Hold.c; else v2Hold = { v: C.view, c }; }
  return kitFrameSq(S, { x: fs * 0.4, y: fs * 0.9, w: W - fs * 0.8, h: H - fs * 1.2 }, C, c.cx, c.cy, c.half, o);
}
const v2Arrow = (S, m, a, b, col, o) => kitArrow(S, m, a[0], a[1], b[0], b[1], Object.assign({ col, lw: 2.6 }, o || {}));
// Beschriftung neben der Mitte einer Strecke (seitlich versetzt)
function v2Lab(S, m, C, a, b, s, side, o) {
  const ax = m.X(a[0]), ay = m.Y(a[1]), bx = m.X(b[0]), by = m.Y(b[1]), L = Math.hypot(bx - ax, by - ay); if (!(L > 6)) return;
  const nx = -(by - ay) / L, ny = (bx - ax) / L, k = (side || 1) * C.fs * ((o && o.off) || 1.25), px = (ax + bx) / 2 + nx * k, py = (ay + by) / 2 + ny * k;
  if (difInside(m, px, py, 2)) difLabel(S, m, px, py, s, C, o || {});
}
// Beschriftung seitlich neben einem Punkt q einer Geraden mit Richtung dir (side: +1 oder −1, off in Schrifthöhen)
function v2Side(S, m, C, q, dir, s, side, off, o) {
  const L = V2.len(dir); if (L < 1e-9) return;
  const px = m.X(q[0]) + dir[1] / L * side * off * C.fs, py = m.Y(q[1]) + dir[0] / L * side * off * C.fs;
  if (difInside(m, px, py, 2)) difLabel(S, m, px, py, s, C, o || {});
}
// Ziehbarer Punkt mit Namen
function v2Pt(S, m, C, id, p, col, name, set, o) {
  o = o || {};
  kitDragPt(S, m, C, id, p[0], p[1], { col, hl: o.hl, step: 0.5, r: o.r }, set);
  if (name && difInside(m, m.X(p[0]), m.Y(p[1]), 2)) difLabel(S, m, m.X(p[0]) + C.fs * (o.dx === undefined ? 0.9 : o.dx), m.Y(p[1]) + C.fs * (o.dy === undefined ? -1.0 : o.dy), o.c ? '\\col{' + o.c + '}{' + name + '}' : name, C, {});
}
// Zeichen für den rechten Winkel bei F zwischen den Richtungen u und w (Weltkoordinaten)
function v2Right(S, m, F, u, w, C) {
  const lu = V2.len(u), lw = V2.len(w); if (lu < 1e-9 || lw < 1e-9) return;
  const s = C.fs * 0.75, fx = m.X(F[0]), fy = m.Y(F[1]), ux = u[0] / lu * s, uy = -u[1] / lu * s, wx = w[0] / lw * s, wy = -w[1] / lw * s;
  S.poly([[fx + ux, fy + uy], [fx + ux + wx, fy + uy + wy], [fx + wx, fy + wy]], { col: 'M', lw: 1.3 });
}
// Gerade durch A mit Richtung v über den ganzen Rahmen
function v2Line(S, m, A, v, o) {
  const L = V2.len(v); if (L < 1e-9) return;
  const R = (Math.hypot(m.win.x1 - m.win.x0, m.win.y1 - m.win.y0) + Math.hypot(A[0], A[1]) + Math.abs(m.win.x0) + Math.abs(m.win.y0)) * 1.5, u = [v[0] / L, v[1] / L];
  difSeg(S, m, A[0] - u[0] * R, A[1] - u[1] * R, A[0] + u[0] * R, A[1] + u[1] * R, o);
}
const v2Set = (P, k) => (x, y) => { P[k] = [V2.snap(x), V2.snap(y)]; };

function v2SceneComp(S, W, H, C) {
  const P = C.P, fs = C.fs, A = P.A, B = P.B, v = V2.sub(B, A), F = V2.fmt, L = V2.len(v), K = [B[0], A[1]];
  const m = v2Frame(S, W, H, C, [A, B], { title: '\\col{b}{\\vec{AB}=' + V2.bn(v) + '}', info: '\\col{b}{|\\vec{AB}|' + V2.eq(L) + '}' });
  // Dreieck aus den Komponenten
  difSeg(S, m, A[0], A[1], K[0], K[1], { col: ST_O, lw: 2, dash: [6, 4], hl: 'comp' }); difSeg(S, m, K[0], K[1], B[0], B[1], { col: ST_O, lw: 2, dash: [6, 4], hl: 'comp' });
  if (Math.abs(v[0]) > 1e-9 && Math.abs(v[1]) > 1e-9) v2Right(S, m, K, [-v[0], 0], [0, v[1]], C);
  if (Math.abs(v[0]) > 1e-9) v2Lab(S, m, C, A, K, '\\col{o}{' + F(v[0]) + '}', v[0] * v[1] >= 0 ? 1 : -1, { off: 1.0 });
  if (Math.abs(v[1]) > 1e-9) v2Lab(S, m, C, K, B, '\\col{o}{' + F(v[1]) + '}', v[0] * v[1] >= 0 ? 1 : -1, { off: 1.3 });
  if (P.ang && L > 1e-9) {
    const phi = V2.dirAngle(v) * Math.PI / 180; difSeg(S, m, A[0], A[1], A[0] + Math.max(1.5, Math.abs(v[0])), A[1], { col: 'M', lw: 1, dash: [3, 3] });
    kitArc(S, m, A[0], A[1], 0, phi, fs * 2.3, { col: ST_V, lw: 1.8 });
    difLabel(S, m, m.X(A[0]) + fs * 3.4 * Math.cos(phi / 2), m.Y(A[1]) - fs * 3.4 * Math.sin(phi / 2), '\\col{v}{\\varphi' + V2.eqA(V2.dirAngle(v)) + '}', C, {});
  }
  v2Arrow(S, m, A, B, ST_B, { lw: 3, hl: 'v' });
  v2Lab(S, m, C, A, B, '\\col{b}{\\vec{AB}}', v[0] * v[1] >= 0 ? -1 : 1);
  if (P.unit && L > 1e-9) { const e = V2.add(A, V2.mul(1 / L, v)); v2Arrow(S, m, A, e, ST_V, { lw: 4.5, head: 9 }); }
  v2Pt(S, m, C, 'A', A, 'T', 'A', v2Set(P, 'A'), { hl: 'A', dx: v[0] >= 0 ? -0.9 : 0.9, dy: v[1] >= 0 ? 0.9 : -0.9 });
  v2Pt(S, m, C, 'B', B, 'T', 'B', v2Set(P, 'B'), { hl: 'B', dx: v[0] >= 0 ? 0.9 : -0.9, dy: v[1] >= 0 ? -0.9 : 0.9 });
}
function v2SceneAdd(S, W, H, C) {
  const P = C.P, a = P.a, b = P.b, c = V2.combo(P), O = [0, 0], lin = P.mode === 'lin';
  const m = v2Frame(S, W, H, C, [a, b, c.p1, c.p2, c.res], { title: '\\col{r}{' + V2.comboTex(P) + '=' + V2.bn(c.res) + '}', info: '\\col{b}{\\vec{a}=' + V2.bn(a) + '}\\ \\ \\col{g}{\\vec{b}=' + V2.bn(b) + '}' });
  // Parallelogramm aus den beiden Summanden
  const X = (p) => [m.X(p[0]), m.Y(p[1])];
  shl(S, 'par', [X(O), X(c.p1), X(c.res), X(c.p2)], true);
  v2Arrow(S, m, c.p2, c.res, ST_B, { lw: 1.6, dash: [6, 4], a: 0.6 });
  v2Arrow(S, m, c.p1, c.res, ST_G, { lw: 2.2, dash: [6, 4] });
  if (lin || P.mode === 'sub') { v2Arrow(S, m, O, c.p2, ST_G, { lw: 3.6, a: 0.4 }); if (lin) v2Arrow(S, m, O, c.p1, ST_B, { lw: 3.6, a: 0.4 }); }
  if (P.mode === 'sub') v2Arrow(S, m, b, a, ST_R, { lw: 1.6, dash: [3, 4], a: 0.7 });
  v2Arrow(S, m, O, a, ST_B, { lw: lin ? 2 : 2.8 }); v2Arrow(S, m, O, b, ST_G, { lw: lin ? 2 : 2.8 });
  v2Arrow(S, m, O, c.res, ST_R, { lw: 3.2, hl: 'res' });
  v2Lab(S, m, C, O, a, '\\col{b}{\\vec{a}}', V2.det(a, b) >= 0 ? 1 : -1, { off: 1.0 }); v2Lab(S, m, C, O, b, '\\col{g}{\\vec{b}}', V2.det(a, b) >= 0 ? -1 : 1, { off: 1.0 });
  if (!V2.zero(c.res)) difLabel(S, m, m.X(c.res[0]) + C.fs * (c.res[0] >= 0 ? 1 : -1) * 2.6, m.Y(c.res[1]) + C.fs * (c.res[1] >= 0 ? -1.1 : 1.1), '\\col{r}{' + V2.comboTex(P) + '}', C, {});
  v2Pt(S, m, C, 'a', a, ST_B, '', v2Set(P, 'a'), { hl: 'a' }); v2Pt(S, m, C, 'b', b, ST_G, '', v2Set(P, 'b'), { hl: 'b' });
}
function v2SceneDot(S, W, H, C) {
  const P = C.P, fs = C.fs, a = P.a, b = P.b, O = [0, 0], d = V2.dot(a, b), F = V2.fmt, ok = !V2.zero(a) && !V2.zero(b);
  const m = v2Frame(S, W, H, C, [a, b], { title: '\\col{b}{\\vec{a}=' + V2.bn(a) + '}\\ \\ \\col{g}{\\vec{b}=' + V2.bn(b) + '}', info: '\\col{v}{\\vec{a}\\cdot \\vec{b}=' + F(d) + '}' });
  if (P.area && ok) { const s = V2.add(a, b); S.poly([[m.X(0), m.Y(0)], [m.X(a[0]), m.Y(a[1])], [m.X(s[0]), m.Y(s[1])], [m.X(b[0]), m.Y(b[1])]], { col: 'M', fill: 'M', lw: 1, close: true, a: 0.12 }); }
  if (ok) {
    const t = d / V2.dot(a, a), f = V2.mul(t, a);
    if (P.proj) {
      if (t < 0 || t > 1) v2Line(S, m, O, a, { col: ST_B, lw: 1, dash: [3, 4] });
      difSeg(S, m, b[0], b[1], f[0], f[1], { col: 'M', lw: 1.4, dash: [5, 4] });
      difSeg(S, m, 0, 0, f[0], f[1], { col: ST_O, lw: 5, a: 0.75, hl: 'proj' });
      if (Math.abs(V2.det(a, b)) > 1e-9 && Math.abs(t) > 1e-9) v2Right(S, m, f, V2.mul(-Math.sign(t), a), V2.sub(b, f), C);
    }
    const a0 = Math.atan2(a[1], a[0]), a1 = Math.atan2(b[1], b[0]); let dl = a1 - a0; while (dl > Math.PI) dl -= 2 * Math.PI; while (dl < -Math.PI) dl += 2 * Math.PI;
    kitArc(S, m, 0, 0, a0, a0 + dl, fs * 2.4, { col: ST_V, lw: 2, hl: 'phi' });
    difLabel(S, m, m.X(0) + fs * 4.2 * Math.cos(a0 + dl / 2), m.Y(0) - fs * 4.2 * Math.sin(a0 + dl / 2), '\\col{v}{\\varphi' + V2.eqA(V2.between(a, b)) + '}', C, {});
  }
  v2Arrow(S, m, O, a, ST_B, { lw: 3 }); v2Arrow(S, m, O, b, ST_G, { lw: 3 });
  v2Lab(S, m, C, O, a, '\\col{b}{\\vec{a}}', V2.det(a, b) >= 0 ? 1 : -1, { off: 1.0 }); v2Lab(S, m, C, O, b, '\\col{g}{\\vec{b}}', V2.det(a, b) >= 0 ? -1 : 1, { off: 1.0 });
  v2Pt(S, m, C, 'a', a, ST_B, '', v2Set(P, 'a'), { hl: 'a' }); v2Pt(S, m, C, 'b', b, ST_G, '', v2Set(P, 'b'), { hl: 'b' });
  S.text(m.L + fs * 2.4, m.B - fs * 1.1, V2.dotWord(a, b), { size: fs * 0.95, col: 'M', al: 'l', bs: 'm' });
}
function v2SceneLine(S, W, H, C) {
  const P = C.P, fs = C.fs, A = P.A, v = P.v, tip = V2.add(A, v), Q = V2.add(A, V2.mul(P.t, v)), L = V2.lineOf(A, v), F = V2.fmt;
  const m = v2Frame(S, W, H, C, [A, tip, Q], { title: '\\col{b}{' + V2.lineTex(A, v, V2.bn) + '}', info: '\\col{v}{t=' + F(P.t) + ':\\ ' + V2.pt('P', Q) + '}' });
  v2Line(S, m, A, v, { col: ST_B, lw: 2.2, hl: 'g' });
  for (let k = -V2.TMAX; k <= V2.TMAX; k++) { const q = V2.add(A, V2.mul(k, v)), d = difDot(S, m, q[0], q[1], { fill: ST_B, r: 2.6 }); if (d && k >= -1 && k <= 3 && k !== 0 && Math.abs(k - P.t) > 0.3) v2Side(S, m, C, q, v, 't=' + k, -1, 1.2, { size: 0.85, col: 'M' }); }
  v2Arrow(S, m, [0, 0], A, 'M', { lw: 1.4, dash: [4, 4] });
  if (P.norm) { const n = L.n, e = V2.add(A, n); v2Arrow(S, m, A, e, ST_O, { lw: 2.4, hl: 'n' }); v2Right(S, m, A, v, n, C); v2Lab(S, m, C, A, e, '\\col{o}{\\vec{n}}', 1, { off: 1.0 }); }
  v2Arrow(S, m, A, tip, ST_G, { lw: 3.2, hl: 'v' }); v2Lab(S, m, C, A, tip, '\\col{g}{\\vec{v}}', 1, { off: 1.0 });
  v2Pt(S, m, C, 'A', A, 'T', '', v2Set(P, 'A'), { hl: 'A' }); v2Side(S, m, C, A, v, 'A', -1, 1.3, {});
  v2Pt(S, m, C, 'v', tip, ST_G, '', (x, y) => { const w = [V2.snap(x) - A[0], V2.snap(y) - A[1]]; if (!V2.zero(w)) P.v = w; }, {});
  kitDragPt(S, m, C, 'P', Q[0], Q[1], { col: ST_V, hl: 'P', r: 6.5 }, (x, y) => { const t = V2.dot([x - A[0], y - A[1]], v) / V2.dot(v, v); P.t = kitClamp(Math.round(t * 4) / 4, -V2.TMAX, V2.TMAX); });
  v2Side(S, m, C, Q, v, '\\col{v}{P}', -1, 1.3, {});
}
function v2SceneDist(S, W, H, C) {
  const P = C.P, fs = C.fs, A = P.A, v = P.v, Q = P.P, tip = V2.add(A, v), f = V2.foot(A, v, Q), F = V2.fmt, Qs = V2.add(Q, V2.mul(2, V2.sub(f.F, Q)));
  const m = v2Frame(S, W, H, C, [A, tip, Q, f.F].concat(P.sym ? [Qs] : []), { title: '\\col{b}{' + V2.lineTex(A, v, V2.bn) + '}', info: '\\col{r}{d' + V2.eq(f.d) + '}' });
  v2Line(S, m, A, v, { col: ST_B, lw: 2.2, hl: 'g' });
  if (P.sym) { difSeg(S, m, f.F[0], f.F[1], Qs[0], Qs[1], { col: ST_R, lw: 1.6, dash: [5, 4] }); const q = difDot(S, m, Qs[0], Qs[1], { fill: 'W', stroke: ST_V, r: 5.5, lw: 2 }); if (q) difLabel(S, m, q[0] + fs * 1.1, q[1] - fs * 0.9, "\\col{v}{P'}", C, {}); }
  difSeg(S, m, A[0], A[1], Q[0], Q[1], { col: ST_V, lw: 1.2, dash: [3, 4] });
  difSeg(S, m, Q[0], Q[1], f.F[0], f.F[1], { col: ST_R, lw: 3, hl: 'd' });
  if (f.d > 1e-9) { v2Right(S, m, f.F, V2.mul(f.t >= 0 ? -1 : 1, v), V2.sub(Q, f.F), C); v2Lab(S, m, C, Q, f.F, '\\col{r}{d}', 1, { off: 0.9 }); }
  v2Arrow(S, m, A, tip, ST_G, { lw: 3.2 }); v2Lab(S, m, C, A, tip, '\\col{g}{\\vec{v}}', V2.det(v, V2.sub(Q, A)) >= 0 ? -1 : 1, { off: 1.0 });
  const q = difDot(S, m, f.F[0], f.F[1], { fill: ST_O, r: 5.5 });
  if (q) { shlC(S, 'F', q[0], q[1], 13); const u = V2.sub(f.F, Q), lu = V2.len(u) || 1; difLabel(S, m, q[0] + (u[0] / lu) * fs * 1.2 + fs * 0.2, q[1] - (u[1] / lu) * fs * 1.2, '\\col{o}{' + (C.exp || W < 520 ? 'F' : V2.pt('F', f.F)) + '}', C, {}); }
  v2Pt(S, m, C, 'A', A, 'T', '', v2Set(P, 'A'), { hl: 'A' }); v2Side(S, m, C, A, v, 'A', V2.det(v, V2.sub(Q, A)) >= 0 ? 1 : -1, 1.3, {});
  v2Pt(S, m, C, 'v', tip, ST_G, '', (x, y) => { const w = [V2.snap(x) - A[0], V2.snap(y) - A[1]]; if (!V2.zero(w)) P.v = w; }, {});
  v2Pt(S, m, C, 'P', Q, ST_V, 'P', v2Set(P, 'P'), { hl: 'P', c: 'v', r: 6.5 });
}
// Genaue Eingabe der Koordinaten im Panel
function v2Coords(box, api, P, keys) {
  box.appendChild(api.el('div', 'subpanel-label', 'Koordinaten'));
  keys.forEach(([k, name]) => {
    const row = api.el('div', 'settings-row'); row.style.gap = '6px';
    const lb = api.el('label', null, name); lb.setAttribute('translate', 'no'); lb.style.minWidth = '26px'; lb.setAttribute('for', 'vec2-' + k + '-0');
    const mkInp = j => { const inp = api.el('input'); inp.type = 'number'; inp.id = 'vec2-' + k + '-' + j; inp.step = '0.5'; inp.value = String(P[k][j]); inp.style.width = '78px'; inp.setAttribute('aria-label', name + (j ? ' y' : ' x'));
      inp.addEventListener('change', () => { const x = parseFloat(inp.value); if (isFinite(x)) { const q = P[k].slice(); q[j] = Math.max(-V2.LIM, Math.min(V2.LIM, x)); P[k] = q; } api.changed(true); }); return inp; };
    row.append(lb, mkInp(0), mkInp(1)); box.appendChild(row);
  });
}

kitDefine({
  id: 'vec2', icon: '⇀', title: 'Vektoren in der Ebene', group: 'geo',
  desc: 'Vektor mit Komponenten, Betrag und Richtungswinkel, Addition, Subtraktion und Linearkombination, Skalarprodukt mit Winkel und Projektion, Gerade in Parameterform mit Normalenvektor und Koordinatengleichung, Abstand eines Punktes von einer Geraden',
  about: 'Vektoren als Pfeile in der Ebene: Komponenten und Länge, Rechnen mit Vektoren, Skalarprodukt und Winkel, Geraden in Parameterform und der Abstand eines Punktes von einer Geraden.',
  tip: 'Ziehe die Punkte und Pfeilspitzen; sie rasten auf halbe Einheiten ein. Unter «Koordinaten» gibst du Werte genau ein.',
  help: ['Punkte und Pfeilspitzen verschiebst du mit der Maus oder dem Finger. Die leere Fläche verschiebt den Ausschnitt, das Mausrad zoomt.',
    'Unter «Koordinaten» stehen die Werte als Zahlen; dort gibst du auch Werte ein, die nicht auf dem Raster liegen.',
    'Spaltenvektoren stehen im Bild in Klammern übereinander: oben die x-Komponente, unten die y-Komponente.'],
  kw: { comp: 'Vektor Pfeil Komponenten Betrag Länge Richtungswinkel Einheitsvektor Gegenvektor Ortsvektor Verschiebung', add: 'Vektoraddition Summe Differenz Vielfaches Linearkombination Parallelogramm Kräfte', dot: 'Skalarprodukt Winkel zwischen Vektoren senkrecht orthogonal Projektion Kosinus Flächeninhalt Parallelogramm', line: 'Gerade Parameterform Stützvektor Stützpunkt Richtungsvektor Parameter Normalenvektor Koordinatengleichung Normalenform', dist: 'Abstand Punkt Gerade Lot Lotfusspunkt Projektion Spiegelpunkt Spiegelung' },
  views: [['comp', 'Vektor, Komponenten und Betrag'], ['add', 'Addieren, Subtrahieren, Vielfache'], ['dot', 'Skalarprodukt und Winkel'], ['line', 'Gerade in Parameterform'], ['dist', 'Abstand Punkt – Gerade']],
  quiz: ['comp', 'add', 'dot', 'line', 'dist'],
  descs: {
    comp: ['Ziehe {{Anfangspunkt A|A}} und {{Endpunkt B|B}}: Der {{Vektor von A nach B|v}} hat zwei {{Komponenten (orange)|comp}}, «so weit nach rechts» und «so weit nach oben». Seine Länge, der Betrag, ist die Hypotenuse im rechtwinkligen Dreieck.',
      'Ein Vektor beschreibt eine Verschiebung: Er hat eine Richtung und eine Länge, aber keinen festen Ort. Alle Pfeile mit denselben Komponenten stellen denselben Vektor dar.'],
    add: ['Ziehe die Spitzen der Vektoren {{a (blau)|a}} und {{b (grün)|b}}: Hängt man den zweiten Pfeil an die Spitze des ersten, zeigt der {{rote Ergebnisvektor|res}} vom Anfang zum Ende. Das {{gestrichelte Parallelogramm|par}} zeigt, dass die Reihenfolge keine Rolle spielt. Wähle links Summe, Differenz oder Linearkombination.',
      'Vektoren werden komponentenweise addiert, subtrahiert und mit Zahlen multipliziert. Ein Vielfaches r · a hat dieselbe Richtung wie a (bei negativem r die Gegenrichtung) und die |r|-fache Länge.'],
    dot: ['Ziehe die Spitzen der Vektoren {{a (blau)|a}} und {{b (grün)|b}}: Das Skalarprodukt ist positiv bei spitzem, null bei rechtem und negativ bei stumpfem {{Zwischenwinkel φ|phi}}. Der {{orange Schatten von b auf a|proj}} zeigt, welcher Teil von b in Richtung von a wirkt.',
      'Skalarprodukt: a · b = a₁ · b₁ + a₂ · b₂ = |a| · |b| · cos φ. Es ist eine Zahl, kein Vektor. Ist es null, stehen die Vektoren senkrecht aufeinander.'],
    line: ['Die {{blaue Gerade g|g}} ist durch den {{Stützpunkt A|A}} und den {{Richtungsvektor v|v}} festgelegt. Ziehe den {{Punkt P auf der Geraden|P}} oder stelle links den Parameter t ein: Bei t = 1 liegt P an der Spitze von v, bei t = 2 doppelt so weit. Der {{Normalenvektor n|n}} steht senkrecht auf der Geraden und liefert die Koordinatengleichung.',
      'Parameterform: r = A + t · v. Jeder Wert von t gibt genau einen Punkt der Geraden. Stützpunkt und Richtungsvektor sind nicht eindeutig: Jeder Punkt der Geraden und jedes Vielfache von v beschreiben dieselbe Gerade.'],
    dist: ['Ziehe den {{Punkt P neben der Geraden|P}}: Der kürzeste Weg zur {{Geraden durch A|g}} steht senkrecht auf ihr und endet im {{Fusspunkt F des Lots|F}}. Die {{Länge des roten Lots|d}} ist der Abstand. Auch den {{Stützpunkt der Geraden|A}} und die Spitze des Richtungsvektors kannst du ziehen.',
      'Abstand eines Punktes von einer Geraden: Der Verbindungsvektor vom Stützpunkt zu P wird auf den Richtungsvektor projiziert; das ergibt den Lotfusspunkt F. Der Abstand ist die Länge der Strecke von P nach F.']
  },
  def: {
    comp: { A: [1, 1], B: [5, 4], unit: false, ang: false, win: null },
    add: { a: [4, 1], b: [1, 3], mode: 'add', r: 2, s: -1, win: null },
    dot: { a: [5, 1], b: [2, 4], proj: true, area: false, win: null },
    line: { A: [1, 2], v: [2, 1], t: 2, norm: true, win: null },
    dist: { A: [-4, -1], v: [4, 2], P: [0, 6], sym: false, win: null }
  },
  controls(v, P) {
    if (v === 'comp') return [{ k: 'unit', t: 'check', l: 'Einheitsvektor zeigen' }, { k: 'ang', t: 'check', l: 'Richtungswinkel zeigen' }];
    if (v === 'add') return [{ k: 'mode', t: 'select', l: 'Rechnung', o: [['add', 'Summe a + b'], ['sub', 'Differenz a − b'], ['lin', 'Linearkombination r · a + s · b']] },
      { k: 'r', t: 'range', l: 'Faktor r', min: -3, max: 3, step: 0.25, d: 2, show: P.mode === 'lin' }, { k: 's', t: 'range', l: 'Faktor s', min: -3, max: 3, step: 0.25, d: 2, show: P.mode === 'lin' }];
    if (v === 'dot') return [{ k: 'proj', t: 'check', l: 'Projektion von b auf a zeigen' }, { k: 'area', t: 'check', l: 'Parallelogramm zeigen' }];
    if (v === 'line') return [{ k: 't', t: 'range', l: 'Parameter t', min: -V2.TMAX, max: V2.TMAX, step: 0.25, d: 2 }, { k: 'norm', t: 'check', l: 'Normalenvektor zeigen' }];
    return [{ k: 'sym', t: 'check', l: 'Spiegelpunkt zeigen' }];
  },
  presets: {
    comp: [['Dreieck mit den Seiten 3, 4 und 5', { A: [1, 1], B: [5, 4] }], ['Nach links unten', { A: [4, 3], B: [-2, -1] }], ['Waagrechter Vektor', { A: [-3, 2], B: [4, 2] }], ['Ortsvektor eines Punktes', { A: [0, 0], B: [3, -4], ang: true }], ['Mit Einheitsvektor', { A: [-2, -1], B: [4, 2], unit: true }]],
    add: [['Summe zweier Vektoren', { a: [4, 1], b: [1, 3], mode: 'add' }], ['Differenz zweier Vektoren', { a: [4, 1], b: [1, 3], mode: 'sub' }], ['Linearkombination: zweimal a minus b', { a: [2, 1], b: [1, 3], mode: 'lin', r: 2, s: -1 }], ['Vektor und Gegenvektor', { a: [3, 2], b: [-3, -2], mode: 'add' }], ['Parallele Vektoren', { a: [2, 1], b: [-4, -2], mode: 'lin', r: 1.5, s: 0.5 }]],
    dot: [['Spitzer Winkel', { a: [5, 1], b: [2, 4] }], ['Rechter Winkel', { a: [4, 2], b: [-1, 2] }], ['Stumpfer Winkel', { a: [4, 1], b: [-3, 2] }], ['Gleiche Richtung', { a: [2, 1], b: [4, 2] }], ['Gegenrichtung', { a: [3, 1], b: [-3, -1] }], ['Fläche des Parallelogramms', { a: [4, 0], b: [1, 3], area: true, proj: false }]],
    line: [['Steigende Gerade', { A: [1, 2], v: [2, 1], t: 2 }], ['Fallende Gerade', { A: [-2, 4], v: [3, -2], t: 1.5 }], ['Senkrechte Gerade', { A: [3, -1], v: [0, 2], t: 1 }], ['Gerade durch den Ursprung', { A: [0, 0], v: [1, 2], t: -1.5 }], ['Negativer Parameter', { A: [2, 1], v: [1, 1], t: -3 }]],
    dist: [['Punkt neben einer schrägen Geraden', { A: [-4, -1], v: [4, 2], P: [0, 6] }], ['Waagrechte Gerade', { A: [-3, 1], v: [2, 0], P: [2, 5] }], ['Punkt auf der Geraden', { A: [0, 1], v: [2, 1], P: [4, 3] }], ['Lotfusspunkt hinter dem Stützpunkt', { A: [1, 1], v: [2, 1], P: [-4, 3] }], ['Mit Spiegelpunkt', { A: [-3, -2], v: [3, 1], P: [1, 4], sym: true }]]
  },
  sanitize(v, P, src) { ({ comp: ['A', 'B'], add: ['a', 'b'], dot: ['a', 'b'], line: ['A', 'v'], dist: ['A', 'v', 'P'] })[v].forEach(k => { P[k] = V2.ptOk(src[k]) || P[k]; }); },
  fix(v, P) {
    ({ comp: ['A', 'B'], add: ['a', 'b'], dot: ['a', 'b'], line: ['A', 'v'], dist: ['A', 'v', 'P'] })[v].forEach(k => { if (!V2.ptOk(P[k])) P[k] = [1, 1]; });
    if ((v === 'line' || v === 'dist') && V2.zero(P.v)) P.v = [1, 0];
    if (v === 'line') P.t = kitClamp(Math.round(P.t * 4) / 4, -V2.TMAX, V2.TMAX);
  },
  extra(v, P, box, api) { v2Coords(box, api, P, ({ comp: [['A', 'A'], ['B', 'B']], add: [['a', 'a'], ['b', 'b']], dot: [['a', 'a'], ['b', 'b']], line: [['A', 'A'], ['v', 'v']], dist: [['A', 'A'], ['v', 'v'], ['P', 'P']] })[v]); },
  scene: { comp: v2SceneComp, add: v2SceneAdd, dot: v2SceneDot, line: v2SceneLine, dist: v2SceneDist },
  doc: (v, P) => V2.doc(v, P)
});

if (typeof module !== 'undefined' && module.exports) module.exports = { V2 };
