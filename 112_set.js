// ═══════════════════════════════════════════════════════════════════
// 112_set.js — Mengen und Intervalle: Intervalle auf der Zahlengeraden, Schreibweisen, Mengenoperationen
//
// Rechenkern (SetI, ohne DOM): Intervall {a, b, ca, cb} (a, b dürfen ±Infinity sein; ca/cb: Randpunkt gehört dazu),
// Mengen als sortierte Listen solcher Intervalle; Schnitt, Vereinigung, Differenz, Komplement in ℝ; Schreibweisen.
// Bild und Oberfläche wie 111_lop_ui.js (Hilfsfunktionen aus 61/62_dif, Karte #dif-card). Zustand SET.
// Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «set»).
// ═══════════════════════════════════════════════════════════════════

const SetI = (function () {
  const mk = (a, b, ca, cb) => ({ a, b, ca: isFinite(a) ? !!ca : false, cb: isFinite(b) ? !!cb : false });
  const empty = I => !I || I.a > I.b || (I.a === I.b && !(I.ca && I.cb));
  function inter1(I, J) {
    const a = Math.max(I.a, J.a), b = Math.min(I.b, J.b);
    const ca = I.a > J.a ? I.ca : J.a > I.a ? J.ca : I.ca && J.ca, cb = I.b < J.b ? I.cb : J.b < I.b ? J.cb : I.cb && J.cb;
    const R = mk(a, b, ca, cb); return empty(R) ? null : R;
  }
  function union(list) {
    const L = list.filter(I => !empty(I)).map(I => Object.assign({}, I)).sort((u, v) => u.a - v.a || (v.ca - u.ca)), out = [];
    L.forEach(I => {
      const c = out[out.length - 1];
      if (c && (I.a < c.b || (I.a === c.b && (c.cb || I.ca)))) { if (I.b > c.b) { c.b = I.b; c.cb = I.cb; } else if (I.b === c.b) c.cb = c.cb || I.cb; }
      else out.push(I);
    });
    return out;
  }
  function inter(A, B) { const out = []; A.forEach(I => B.forEach(J => { const R = inter1(I, J); if (R) out.push(R); })); return union(out); }
  function comp(A) {
    const L = union(A), out = []; let a = -Infinity, ca = false;
    L.forEach(I => { const R = mk(a, I.a, ca, !I.ca); if (!empty(R) && !(R.a === -Infinity && I.a === -Infinity)) out.push(R); a = I.b; ca = !I.cb; });
    if (!(L.length && L[L.length - 1].b === Infinity)) { const R = mk(a, Infinity, ca, false); if (!empty(R)) out.push(R); }
    return union(out);
  }
  const diff = (A, B) => inter(A, comp(B));
  const OPS = [['and', 'A ∩ B (Schnittmenge)'], ['or', 'A ∪ B (Vereinigung)'], ['amb', 'A \\ B (Differenz)'], ['bma', 'B \\ A (Differenz)'], ['ca', 'Ā (Komplement von A)']];
  const OPTEX = { and: 'A\\cap B', or: 'A\\cup B', amb: 'A\\setminus B', bma: 'B\\setminus A', ca: '\\overline{A}' };
  const apply = (op, A, B) => (op === 'and' ? inter([A], [B]) : op === 'or' ? union([A, B]) : op === 'amb' ? diff([A], [B]) : op === 'bma' ? diff([B], [A]) : comp([A]));
  // Schreibweisen; st 'r': (a, b]   st 'f': ]a; b]
  const num = v => (v === Infinity ? '\\infty' : v === -Infinity ? '-\\infty' : (typeof linFmt === 'function' ? linFmt(v) : String(Math.round(v * 1e4) / 1e4)));
  function ivTex(I, st) {
    if (I.a === I.b) return '\\{' + num(I.a) + '\\}';
    // geschweifte Klammern: Klammern und Zahlen als gewöhnliche Zeichen (sonst setzt TeX bei ]-2 ein binäres Minus)
    if (st === 'f') return '{{' + (I.ca ? '[' : ']') + '}{' + num(I.a) + '};\\,{' + num(I.b) + '}{' + (I.cb ? ']' : '[') + '}}';
    return (I.ca ? '[' : '(') + num(I.a) + ',\\,' + num(I.b) + (I.cb ? ']' : ')');
  }
  const setTex = (L, st) => (!L.length ? '\\{\\,\\}' : L.length === 1 && L[0].a === -Infinity && L[0].b === Infinity ? '\\mathbb{R}' : L.map(I => ivTex(I, st)).join('\\cup '));
  function ineqTex(I, v) {
    v = v || 'x';
    if (I.a === -Infinity && I.b === Infinity) return v + '\\in\\mathbb{R}';
    if (I.a === I.b) return v + '=' + num(I.a);
    if (I.a === -Infinity) return v + (I.cb ? '\\le ' : '<') + num(I.b);
    if (I.b === Infinity) return v + (I.ca ? '\\ge ' : '>') + num(I.a);
    return num(I.a) + (I.ca ? '\\le ' : '<') + v + (I.cb ? '\\le ' : '<') + num(I.b);
  }
  const ineqSet = L => (!L.length ? '\\text{keine Zahl}' : L.map(I => ineqTex(I)).join('\\ \\text{oder}\\ '));
  const builder = L => (!L.length ? '\\{\\,\\}' : '\\{x\\in\\mathbb{R}\\mid ' + ineqSet(L) + '\\}');
  const DEF = { and: 'Die **Schnittmenge** $A\\cap B$ enthält alle Zahlen, die in $A$ **und** in $B$ liegen.', or: 'Die **Vereinigungsmenge** $A\\cup B$ enthält alle Zahlen, die in $A$ **oder** in $B$ (oder in beiden) liegen.', amb: 'Die **Differenzmenge** $A\\setminus B$ enthält alle Zahlen aus $A$, die **nicht** in $B$ liegen.', bma: 'Die **Differenzmenge** $B\\setminus A$ enthält alle Zahlen aus $B$, die **nicht** in $A$ liegen.', ca: 'Das **Komplement** $\\overline{A}=\\mathbb{R}\\setminus A$ enthält alle reellen Zahlen, die **nicht** in $A$ liegen.' };
  function ivDoc(I, st) {
    const d = Dif.DOC(), A = num(I.a), B = num(I.b);
    d.h('Intervall und Schreibweisen');
    d.p('Ein **Intervall** ist die Menge aller reellen Zahlen zwischen zwei Randpunkten. Eckige Klammer ' + (st === 'f' ? '$[\\ ]$: Randpunkt gehört dazu; nach aussen gedreht $]\\ [$: gehört nicht dazu.' : '$[\\ ]$: Randpunkt gehört dazu; runde Klammer $(\\ )$: gehört nicht dazu.') + ' Bei $\\pm\\infty$ ist die Klammer immer offen.');
    d.e('\\text{Intervall:}\\quad ' + ivTex(I, st));
    d.e('\\text{Ungleichung:}\\quad ' + ineqTex(I));
    d.e('\\text{Mengenschreibweise:}\\quad ' + builder([I]));
    const rd = (v, c, s) => (!isFinite(v) ? '$' + num(v) + '$ ist keine Zahl, darum offen' : '$' + num(v) + '$ ' + (c ? 'gehört dazu (gefüllter Punkt)' : 'gehört nicht dazu (leerer Punkt)'));
    d.p('**Linker Rand:** ' + rd(I.a, I.ca) + '. **Rechter Rand:** ' + rd(I.b, I.cb) + '.');
    if (isFinite(I.a) && isFinite(I.b)) d.p('Das Intervall ist **beschränkt**; seine Länge ist $' + B + '-' + (I.a < 0 ? '(' + A + ')' : A) + '=' + num(I.b - I.a) + '$.');
    else d.p('Das Intervall ist **unbeschränkt** (es reicht bis ins Unendliche).');
    d.res('$' + ivTex(I, st) + '=' + builder([I]) + '$');
    return d;
  }
  function opDoc(A, B, op, st) {
    const d = Dif.DOC(), R = apply(op, A, B);
    d.h('Operationen mit Intervallen');
    d.e('A=' + ivTex(A, st) + ',\\qquad B=' + ivTex(B, st));
    d.p(DEF[op]);
    d.p('**Vorgehen:** Beide Intervalle untereinander auf der Zahlengeraden einzeichnen, die gesuchten Bereiche ablesen und bei jedem Randpunkt prüfen, ob er dazugehört.');
    d.e(OPTEX[op] + '=' + setTex(R, st));
    if (R.length) d.e(OPTEX[op] + '=' + builder(R));
    if (!R.length) d.note('Die Intervalle haben keine gemeinsamen Zahlen: Das Ergebnis ist die leere Menge.');
    if (R.length > 1) d.note('Das Ergebnis besteht aus ' + R.length + ' getrennten Teilen.');
    d.p('**Alle Operationen auf einen Blick:**');
    d.b.push({ k: 'tab', head: ['Operation', 'Ergebnis'], rows: OPS.map(([k]) => ['$' + OPTEX[k] + '$', '$' + setTex(apply(k, A, B), st) + '$']) });
    d.res('$' + OPTEX[op] + '=' + setTex(R, st) + '$');
    return d;
  }
  return { mk, empty, inter, union, comp, diff, apply, OPS, OPTEX, ivTex, setTex, ineqTex, builder, ivDoc, opDoc, num };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = SetI;

// ═════════════ Bild: Zahlengeraden ═════════════
// Rahmen ohne Gitter: nur x-Abbildung (für Ziehen und Zuschneiden)
function setFrame(S, r, win, C, title) {
  const fs = C.fs, L = r.x + fs * 1.4, R = r.x + r.w - fs * 1.4, T = r.y + fs * 2.4, B = r.y + r.h - fs * 0.8;
  const m = { L, R, T, B, win, r, X: x => L + (x - win.x0) / (win.x1 - win.x0) * (R - L), Y: () => (T + B) / 2, IX: p => win.x0 + (p - L) / (R - L) * (win.x1 - win.x0), IY: () => 0 };
  (S.frames || (S.frames = [])).push([L, T, R, B, r.x, r.y, r.x + r.w, r.y + r.h]);
  if (typeof stKeepFrame === 'function') stKeepFrame(r);
  if (title) S.rich(L, r.y + fs * 1.1, title, { size: fs * 1.05, col: 'T', al: 'l', bs: 'm' });
  return m;
}
// eine Zahlengerade bei Höhe y mit Menge L (Liste von Intervallen); ids: Randpunkte ziehbar
function setLine(S, m, y, L, col, C, o) {
  o = o || {}; const fs = C.fs, w = m.win, st = Stat.niceStep(w.x1 - w.x0, Math.max(4, Math.min(16, (m.R - m.L) / (fs * 3.2))));
  S.line(m.L - fs * 0.6, y, m.R + fs * 0.6, y, { col: 'L', lw: 1.4 });
  S.poly([[m.R + fs * 0.6, y], [m.R + fs * 0.1, y - fs * 0.35], [m.R + fs * 0.1, y + fs * 0.35]], { fill: 'L', col: 'L', close: true, lw: 0.5 });
  for (let k = Math.ceil(w.x0 / st); k * st <= w.x1 + 1e-9; k++) { const x = m.X(k * st); S.line(x, y - fs * 0.3, x, y + fs * 0.3, { col: 'L', lw: 1 }); if (!o.noNum) S.text(x, y + fs * 1.0, stTickLabel(k * st, st).replace('-', '−'), { size: fs * 0.78, col: 'M', al: 'c', bs: 'm' }); }
  if (o.name) S.rich(m.L - fs * 0.2, y - fs * 1.1, o.name, { size: fs * 1.05, col: col, al: 'l', bs: 'm' });
  L.forEach((I, k) => {
    const x0 = Math.max(m.L - fs * 0.6, isFinite(I.a) ? m.X(I.a) : -1e9), x1 = Math.min(m.R + fs * 0.6, isFinite(I.b) ? m.X(I.b) : 1e9);
    if (x1 >= x0) { S.line(x0, y, x1, y, { col, lw: 6, a: 0.85 }); if (o.hl) shl(S, o.hl, [[x0, y], [x1, y]]); }
    [[I.a, I.ca, 0], [I.b, I.cb, 1]].forEach(([v, c, e]) => {
      if (!isFinite(v)) { const xe = e ? m.R + fs * 0.6 : m.L - fs * 0.6; S.poly([[xe, y], [xe + (e ? -1 : 1) * fs * 0.6, y - fs * 0.45], [xe + (e ? -1 : 1) * fs * 0.6, y + fs * 0.45]], { fill: col, col, close: true, lw: 0.5 }); return; }
      const px = m.X(v); if (px < m.L - 2 || px > m.R + 2) return;
      S.circ(px, y, 6, { fill: c ? col : 'W', stroke: col, lw: 2.2 }); if (o.ends) shlC(S, o.ends, px, y, 11);
      if (o.ids && L.length === 1 && I.a !== I.b) S.pts.push({ id: o.ids[e], x: px, y, r: 12 });
      if (o.lab) difLabel(S, m, px, y - fs * 1.15, '\\col{' + o.lab + '}{' + SetI.num(v) + '}', C, { size: 0.85 });
    });
  });
}
function setWin(list, C) {
  const w = C.win; if (w && isFinite(w.x0) && isFinite(w.x1) && w.x1 > w.x0) return { x0: w.x0, x1: w.x1 };
  const v = []; list.forEach(I => { if (isFinite(I.a)) v.push(I.a); if (isFinite(I.b)) v.push(I.b); });
  if (!v.length) v.push(-3, 3);
  let lo = Math.min(...v), hi = Math.max(...v); const sp = Math.max(4, hi - lo); lo -= sp * 0.25 + 0.5; hi += sp * 0.25 + 0.5;
  return { x0: lo, x1: hi };
}
const setI = (o, k) => SetI.mk(o[k + 'a'], o[k + 'b'], o[k + 'ca'], o[k + 'cb']);
function setSceneIv(S, W, H, C) {
  const fs = C.fs, I = setI(C, 'i'), R = stLayout(W, H, [{ w: 1, rows: [1] }]);
  const m = setFrame(S, R[0], setWin([I], C), C, '\\text{Intervall } I=' + SetI.ivTex(I, C.st));
  S.maps.main = m;
  const y0 = m.T + (m.B - m.T) * 0.38;
  setLine(S, m, y0, [I], ST_B, C, { ids: ['I0', 'I1'], hl: 'iv', ends: 'ends', lab: 'b' });
  // die drei Schreibweisen unter der Zahlengeraden
  const rows = [['Intervallschreibweise:', '\\col{b}{' + SetI.ivTex(I, C.st) + '}', 'iv'], ['Ungleichung:', SetI.ineqTex(I)], ['Mengenschreibweise:', SetI.builder([I])]];
  const sz = fs * 1.05, dy = Math.min(fs * 2.2, (m.B - y0 - fs * 3) / 4), xt = m.L + fs * 0.4, xv = m.L + fs * 12.5;
  rows.forEach(([t, v, h], k) => { const y = y0 + fs * 3.2 + dy * k; S.rich(xt, y, '\\text{' + t + '}', { size: sz * 0.92, col: 'M', al: 'l', bs: 'm' }); S.rich(xv, y, v, { size: sz, col: 'T', al: 'l', bs: 'm' }); if (h) shlBox(S, h, xv - 4, y - sz * 0.8, xv + fs * 8, y + sz * 0.8); });
  S.rich(xt, y0 + fs * 3.2 + dy * 3, '\\text{gefüllter Punkt: Rand gehört dazu, leerer Punkt: gehört nicht dazu}', { size: sz * 0.8, col: 'M', al: 'l', bs: 'm' });
}
// im Bild: Komplement als ℝ∖A (die Bildschrift kennt kein \overline)
const setOpTex = k => (k === 'ca' ? '\\mathbb{R}\\setminus A' : SetI.OPTEX[k]);
function setSceneOp(S, W, H, C) {
  const fs = C.fs, A = setI(C, 'a'), B = setI(C, 'b'), Rs = SetI.apply(C.op, A, B), R = stLayout(W, H, [{ w: 1, rows: [1.5, 0.9] }]);
  const all = [A, B].concat(Rs), m = setFrame(S, R[0], setWin(all, C), C, null);
  S.maps.main = m;
  const h = (m.B - m.T) / 3, y = k => m.T + h * (k + 0.55);
  setLine(S, m, y(0), [A], ST_B, C, { ids: ['A0', 'A1'], hl: 'Aiv', name: '\\col{b}{A=' + SetI.ivTex(A, C.st) + '}', noNum: true });
  setLine(S, m, y(1), [B], ST_O, C, { ids: ['B0', 'B1'], hl: 'Biv', name: '\\col{o}{B=' + SetI.ivTex(B, C.st) + '}', noNum: true });
  setLine(S, m, y(2), Rs, ST_G, C, { hl: 'res', name: '\\col{g}{' + setOpTex(C.op) + '=' + SetI.setTex(Rs, C.st) + '}' });
  // senkrechte Hilfslinien an allen Randpunkten
  const xs = []; [A, B].forEach(I => [I.a, I.b].forEach(v => { if (isFinite(v) && xs.indexOf(v) < 0) xs.push(v); }));
  xs.forEach(v => { const px = m.X(v); if (px > m.L && px < m.R) S.line(px, y(0) - fs * 0.8, px, y(2) + fs * 0.4, { col: 'M', lw: 0.8, dash: true, a: 0.6 }); });
  difLines(S, R[1], SetI.OPS.map(([k]) => ({ s: (k === C.op ? '\\col{g}{' : '') + setOpTex(k) + '=' + SetI.setTex(SetI.apply(k, A, B), C.st) + (k === C.op ? '}' : ''), bold: k === C.op, hl: k === C.op ? 'res' : undefined, size: 0.95 })), C, { max: fs * 1.15 });
}
const SET_SCENES = { iv: setSceneIv, op: setSceneOp, venn: setSceneVenn, ex: setSceneEx };
function setBuildScene(W, H, C) { const S = linScene(), fn = SET_SCENES[C.view]; if (fn) fn(S, W, H, C); return S; }

// ═════════════ Oberfläche ═════════════
const SET_VIEWS = [['iv', 'Intervalle und Schreibweisen'], ['op', 'Operationen mit Intervallen'], ['venn', 'Mengenoperationen im Venn-Diagramm'], ['ex', 'Übungen']];
const SET_DESC = {
  iv: ['Ziehe die {{Randpunkte|I0,I1}} auf der Zahlengeraden und lege links fest, ob sie {{dazugehören|ends}} oder bis ±∞ reichen: Das {{Intervall|iv}} erscheint in Intervallschreibweise, als Ungleichung und in Mengenschreibweise.', 'Ein Intervall ist die Menge aller reellen Zahlen zwischen zwei Randpunkten. Gehört ein Randpunkt dazu, steht eine eckige Klammer nach innen und ein gefüllter Punkt; sonst eine nach aussen gedrehte (oder runde) Klammer und ein leerer Punkt. Bei ±∞ ist das Intervall offen.'],
  op: ['Ziehe die Randpunkte von {{A|A0,A1,Aiv}} und {{B|B0,B1,Biv}} und wähle eine Operation: Die {{Ergebnismenge|res}} zeigt, welche Zahlen in A und B liegen (Schnittmenge), in A oder B (Vereinigung), in A, aber nicht in B (Differenz) oder nicht in A (Komplement).', 'Mit Intervallen rechnet man wie mit Mengen: A ∩ B (und), A ∪ B (oder), A \\ B (ohne) und das Komplement Ā (alle anderen reellen Zahlen). Am einfachsten zeichnet man beide Intervalle untereinander und liest das Ergebnis ab; an jedem Randpunkt entscheidet man, ob er dazugehört.'],
  venn: ['Wähle links eine Operation oder tippe einen Term wie (A ∪ B) ∩ C: Die {{schraffierten Felder|res}} bilden die Ergebnismenge («▶ Term Schritt für Schritt schraffieren» baut sie von innen nach aussen auf). Mit Elementen oder Anzahlen in den {{Feldern|reg}} liest du das Ergebnis direkt ab; die Mengen {{A|A}}, {{B|B}} und {{C|C}} liegen in der {{Grundmenge G|G}}.', 'Vereinigung A ∪ B: in A oder B. Schnitt A ∩ B: in A und B. Differenz A \\ B: in A, aber nicht in B. Komplement Ā: in G, aber nicht in A. Bei drei Mengen gibt es acht Felder; man füllt sie von der Mitte nach aussen. Gesetze von De Morgan: (A ∪ B)‾ = Ā ∩ B̄ und (A ∩ B)‾ = Ā ∪ B̄.'],
  ex: ['Wähle links die Aufgabenart und löse die Aufgabe: Tippe die Antwort ein oder klicke im {{Venn-Diagramm|venn}} die Felder an, die zur Menge gehören. «Prüfen» zeigt, ob es stimmt; danach steht rechts der Lösungsweg.', 'Übungen zu Intervallen (Schreibweisen, Schnitt, Vereinigung, Differenz, Komplement) und zu Mengenoperationen mit zwei oder drei Mengen im Venn-Diagramm. Jede Aufgabe wird neu erzeugt; «Lösung zeigen» zeigt den Weg.']
};
// Venn-Beispiele: [Anzeige, Zustand]
const SET_VENN_EX = [
  ['A = {1, 2, 3, 4}, B = {2, 4, 6}: Schnitt', { vn: 2, vx: 'A∩B', vm: 'el', vA: '1, 2, 3, 4', vB: '2, 4, 6', vG: '' }],
  ['A = {1, 2, 3, 4}, B = {2, 4, 6}: Differenz B \\ A', { vn: 2, vx: 'B\\A', vm: 'el', vA: '1, 2, 3, 4', vB: '2, 4, 6', vG: '' }],
  ['Komplement in G = {0, …, 10}', { vn: 2, vx: "A'", vm: 'el', vA: '3, 4, 5, 6, 7, 8, 9, 10', vB: '0, 1, 2, 3, 4, 5', vG: '0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10' }],
  ['De Morgan: (A ∪ B)‾ = Ā ∩ B̄', { vn: 2, vx: "(A∪B)'", vm: 'none' }],
  ['A = {1, 2, 3, 4}, B = {2, 4, 6}, C = {3, 6, 9}: A ∩ (B ∪ C)', { vn: 3, vx: 'A∩(B∪C)', vm: 'el', vA: '1, 2, 3, 4', vB: '2, 4, 6', vC: '3, 6, 9', vG: '' }],
  ['Drei Mengen: (A ∪ B) \\ (B \\ C)', { vn: 3, vx: '(A∪B)\\(B\\C)', vm: 'el', vA: '1, 2, 3, 4', vB: '2, 4, 6', vC: '3, 6, 9', vG: '' }],
  ['Sprachen im Tessin: Italienisch oder Deutsch', { vn: 3, vx: 'A∪B', vm: 'cnt', vK: [0, 127, 8, 27, 2, 14, 1, 4] }],
  ['Sprachen im Tessin: Deutsch, aber nicht Französisch', { vn: 3, vx: 'B\\C', vm: 'cnt', vK: [0, 127, 8, 27, 2, 14, 1, 4] }],
  ['Drei Mengen: nur A', { vn: 3, vx: "A∩B'∩C'", vm: 'none' }]
];
const SET_VENN_OPS = { 2: ['A∩B', 'A∪B', 'A\\B', 'B\\A', "A'", "(A∪B)'", "A'∩B'", "(A∩B)'"], 3: ['A∩B∩C', 'A∪B∪C', 'A∩(B∪C)', '(A∩B)∪C', '(A∪B)∩C', 'A\\(B∪C)', '(A∩B)\\C', "(A∪B∪C)'"] };
// Beispiele: [Anzeige, a, b, ca, cb]  bzw.  [Anzeige, A…, B…, Operation]
const SET_IV_EX = [['[−2, 3]', -2, 3, 1, 1], ['(1, 5]', 1, 5, 0, 1], ['[0, ∞)', 0, Infinity, 1, 0], ['(−∞, 4)', -Infinity, 4, 0, 0], ['(−3, 3)', -3, 3, 0, 0], ['[2.5, 7)', 2.5, 7, 1, 0]];
const SET_OP_EX = [['A = [−2, 3], B = [1, 5]: Schnittmenge', [-2, 3, 1, 1], [1, 5, 1, 1], 'and'], ['A = [−2, 1), B = (3, 6]: Vereinigung (getrennt)', [-2, 1, 1, 0], [3, 6, 0, 1], 'or'], ['A = [0, 6], B = (2, 4): Differenz (Loch)', [0, 6, 1, 1], [2, 4, 0, 0], 'amb'], ['A = [1, 2], B = [2, 5]: Schnitt in einem Punkt', [1, 2, 1, 1], [2, 5, 1, 1], 'and'], ['A = (−∞, 3], Komplement', [-Infinity, 3, 0, 1], [0, 4, 1, 1], 'ca'], ['A = [−4, 4], B = [−1, 1]: B liegt in A', [-4, 4, 1, 1], [-1, 1, 1, 1], 'bma']];
const SET_WIN0 = { x0: null, x1: null };
function setDefaults() { return { vn: 2, vx: 'A∩B', vm: 'el', vA: '1, 2, 3, 4', vB: '2, 4, 6', vC: '3, 6, 9', vG: '', vK: [0, 127, 8, 27, 2, 14, 1, 4], xk: 'shade', xt: null, xa: '', xs: 0, xr: null, xsc: { n: 0, ok: 0 }, view: 'iv', st: 'r', ia: -2, ib: 3, ica: true, icb: false, aa: -2, ab: 3, aca: true, acb: true, ba: 1, bb: 5, bca: false, bcb: true, op: 'and', win: Object.assign({}, SET_WIN0), show: { card: true } }; }
const SET = Object.assign(setDefaults(), { ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0 });
function setActive() { return typeof ENV !== 'undefined' && ENV.cur === 'set'; }
const setR6 = x => (isFinite(x) ? Math.round(x * 1e6) / 1e6 + 0 : x);

function setCardDoc() {
  try {
    if (SET.view === 'iv') return { t: 'Rechenweg: Intervall', d: SetI.ivDoc(setI(SET, 'i'), SET.st) };
    if (SET.view === 'venn') return { t: 'Rechenweg: Venn-Diagramm', d: setVennDoc(SET) };
    if (SET.view === 'ex') { if (!SET.xt) return null; if (SET.xr === 'ok' || SET.xr === 'shown') return { t: 'Lösung', d: SetEx.doc(SET.xt) }; const d = Dif.DOC(); d.h('Aufgabe'); d.p(SetEx.prompt(SET.xt)); d.note(SET.xt.kind === 'shade' ? 'Tipp: Zuerst die Klammern. Ein Feld gehört dazu, wenn seine Punkte die Bedingung erfüllen.' : SET.xt.kind === 'cnt' ? 'Tipp: Beginne in der Mitte (alle drei), dann die Felder mit genau zwei, dann die mit genau einer Menge.' : SET.xt.kind === 'el' ? 'Tipp: Trage die Elemente zuerst ins Venn-Diagramm ein.' : 'Tipp: Zeichne die Intervalle auf der Zahlengeraden und prüfe jeden Randpunkt.'); return { t: 'Aufgabe', d }; }
    return { t: 'Rechenweg: Mengenoperation', d: SetI.opDoc(setI(SET, 'a'), setI(SET, 'b'), SET.op, SET.st) };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
const setKeyOf = () => JSON.stringify([SET.view, SET.st, SET.op, SET.vn, SET.vx, SET.vm, SET.vA, SET.vB, SET.vC, SET.vG, SET.vK, SET.xt, SET.xr, ['ia', 'ib', 'ica', 'icb', 'aa', 'ab', 'aca', 'acb', 'ba', 'bb', 'bca', 'bcb'].map(k => String(SET[k]))]);
function setCardSoon() { clearTimeout(SET.cardT); SET.cardT = setTimeout(setCardRender, 40); }
function setCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = setActive() && SET.show.card;
  if (setActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = setKeyOf(); if (key === SET.cardKey) return;
  SET.cardKey = key;
  const r = setCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d); else body.innerHTML = '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}
// Zustand (±∞ als Zeichenkette, damit JSON es behält)
const setEnc = v => (v === Infinity ? 'inf' : v === -Infinity ? '-inf' : v), setDec = v => (v === 'inf' ? Infinity : v === '-inf' ? -Infinity : Number(v));
function setCapture() { const o = { view: SET.view, st: SET.st, op: SET.op, win: SET.win, show: SET.show }; SET_VX_KEYS.forEach(k => { o[k] = SET[k]; }); ['ia', 'ib', 'aa', 'ab', 'ba', 'bb'].forEach(k => { o[k] = setEnc(SET[k]); }); ['ica', 'icb', 'aca', 'acb', 'bca', 'bcb'].forEach(k => { o[k] = SET[k]; }); return difCopy(o); }
function setApply(s) {
  SET.anim = null;                                                       // laufende Animation beenden (Rückgängig, Laden, Zurücksetzen)
  const d = setDefaults();
  if (s && typeof s === 'object') {
    if (SET_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    if (s.st === 'f' || s.st === 'r') d.st = s.st;
    if (SetI.OPS.some(o => o[0] === s.op)) d.op = s.op;
    [['ia', 'ib'], ['aa', 'ab'], ['ba', 'bb']].forEach(([ka, kb]) => { const a = setDec(s[ka]), b = setDec(s[kb]); if (!isNaN(a) && !isNaN(b) && a < b && a !== Infinity && b !== -Infinity) { d[ka] = a; d[kb] = b; } });
    ['ica', 'icb', 'aca', 'acb', 'bca', 'bcb'].forEach(k => { if (k in s) d[k] = !!s[k]; });
    if (s.win && isFinite(Number(s.win.x0)) && isFinite(Number(s.win.x1)) && s.win.x0 !== null && Number(s.win.x1) > Number(s.win.x0)) d.win = { x0: Number(s.win.x0), x1: Number(s.win.x1) };
    if (s.show && typeof s.show === 'object' && 'card' in s.show) d.show.card = !!s.show.card;
    if (s.vn === 2 || s.vn === 3) d.vn = s.vn;
    ['vx', 'vA', 'vB', 'vC', 'vG', 'xa'].forEach(k => { if (typeof s[k] === 'string') d[k] = s[k].slice(0, 200); });
    if (['el', 'cnt', 'none'].includes(s.vm)) d.vm = s.vm;
    if (Array.isArray(s.vK) && s.vK.length === 8) d.vK = s.vK.map(v => Math.max(0, Math.round(+v) || 0));
    if (SetEx.KINDS.some(k => k[0] === s.xk)) d.xk = s.xk;
    if (s.xt && typeof s.xt === 'object' && s.xt.kind === d.xk) d.xt = difCopy(s.xt);
    d.xs = Number.isInteger(s.xs) ? s.xs : 0; d.xr = ['ok', 'bad', 'shown'].includes(s.xr) ? s.xr : null;
    if (s.xsc && typeof s.xsc === 'object') d.xsc = { n: +s.xsc.n || 0, ok: +s.xsc.ok || 0 };
  }
  SET.drag = null; Object.keys(d).forEach(k => { SET[k] = d[k]; }); SET.cardKey = '';
  setRefreshUI(); difRedraw(); setCardSoon();
}
const SET_VX_KEYS = ['vn', 'vx', 'vm', 'vA', 'vB', 'vC', 'vG', 'vK', 'xk', 'xt', 'xa', 'xs', 'xr', 'xsc'];
function setCtx(W, H, exp) { const c = { view: SET.view, st: SET.st, op: SET.op, win: SET.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, show: SET.show, vAnim: SET.anim && SET.view === 'venn' && !exp ? SET.anim.i : null }; SET_VX_KEYS.forEach(k => { c[k] = SET[k]; }); ['ia', 'ib', 'ica', 'icb', 'aa', 'ab', 'aca', 'acb', 'ba', 'bb', 'bca', 'bcb'].forEach(k => { c[k] = SET[k]; }); return c; }
const setDock = w => (SET.show.card && w >= 760 ? stCardW(w, 0.36) : 0);
const setDockH = (w, h) => (SET.show.card && w < 760 ? Math.round(h * 0.5) : 0);
function setDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  const card = $dif('dif-card'); if (card) { const dock = setDock(w), dh = setDockH(w, h); card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh); card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : ''; }
  setCardRender();
  const W = w - setDock(w), Hs = h - setDockH(w, h);
  const S = stSoloBuild(setBuildScene, W, Hs, setCtx(W, Hs), 'set|' + SET.view + '|' + SET.show.card, W < w || Hs < h);
  SET.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}
function setLatex() { const W = 760, H = SET.view === 'op' || SET.view === 'venn' ? 460 : SET.view === 'ex' ? 420 : 360; return stSceneTex(setBuildScene(W, H, setCtx(W, H, { fs: 11 })), W, H, (SET_VIEWS.find(q => q[0] === SET.view) || [0, ''])[1], 11); }
function setCardLatex() { const r = setCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.'; return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d); }
function setMakeLatex(which) { const ui = SET.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? setCardLatex() : setLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function setResolvedWin() { const m = SET.S && SET.S.maps.main; return m ? Object.assign({}, m.win) : (SET.win.x0 !== null ? Object.assign({}, SET.win) : { x0: -5, x1: 5 }); }

function setBuildUI() {
  if (SET.ui || !$dif('set-panel')) return;
  const ui = SET.ui = {}, body = $dif('set-body');
  ui.sel = $dif('set-view');
  SET_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { SET.view = ui.sel.value; SET.anim = null; SET.cardKey = ''; SET.win = Object.assign({}, SET_WIN0); setRefreshUI(); difRedraw(); setCardSoon(); difCommit(); });
  ui.desc = $dif('set-desc'); ui.ex = $dif('set-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec'); det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => setMakeLatex('pic')); ui.br.addEventListener('click', () => setMakeLatex('calc'));
  ui.bc.addEventListener('click', () => { if (!ui.ta.value) setMakeLatex('pic'); const done = () => { ui.msg.textContent = 'Kopiert'; setTimeout(() => { ui.msg.textContent = ''; }, 2500); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ui.ta.value).then(done).catch(() => { ui.ta.select(); document.execCommand('copy'); done(); }); else { ui.ta.select(); document.execCommand('copy'); done(); } });
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!setActive()) return; SET.show.card = false; setRefreshUI(); difRedraw(); setCardRender(); difCommit(); });
  setRefreshUI();
}
function setRefreshUI() {
  const ui = SET.ui; if (!ui) return;
  const v = SET.view;
  ui.sel.value = v;
  const dd = SET_DESC[v]; ui.desc.replaceChildren(difEl('div', null, dd[1])); if (typeof envHint === 'function') envHint('set', dd[0], () => SET.S);
  ui.ex.replaceChildren(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
  ui.ex.style.display = v === 'ex' ? 'none' : '';
  (v === 'iv' ? SET_IV_EX : v === 'op' ? SET_OP_EX : v === 'venn' ? SET_VENN_EX : []).forEach((e, i) => { const o = difEl('option', null, e[0]); o.value = String(i); o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const e = (v === 'iv' ? SET_IV_EX : v === 'op' ? SET_OP_EX : SET_VENN_EX)[+i];
    if (v === 'venn') { Object.keys(e[1]).forEach(k => { SET[k] = difCopy(e[1][k]); }); }
    else if (v === 'iv') { SET.ia = e[1]; SET.ib = e[2]; SET.ica = !!e[3]; SET.icb = !!e[4]; }
    else { [SET.aa, SET.ab, SET.aca, SET.acb] = [e[1][0], e[1][1], !!e[1][2], !!e[1][3]]; [SET.ba, SET.bb, SET.bca, SET.bcb] = [e[2][0], e[2][1], !!e[2][2], !!e[2][3]]; SET.op = e[3]; }
    SET.win = Object.assign({}, SET_WIN0); SET.cardKey = ''; setRefreshUI(); difRedraw(); setCardSoon(); difCommit();
  };
  const P = ui.params; P.replaceChildren();
  const redo = () => { SET.cardKey = ''; setRefreshUI(); difRedraw(); setCardSoon(); difCommit(); };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const select = (label, opts, get, set) => { const row = difEl('div', 'settings-row'); row.style.gap = '8px'; const lb = difEl('label', null, label), sel = difEl('select'); opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] }))); sel.value = get(); sel.addEventListener('change', () => { set(sel.value); redo(); }); row.append(lb, sel); P.appendChild(row); };
  // Randpunkt: Zahl, «gehört dazu», «unendlich»
  const endRow = (label, k, kc, side) => {
    const row = difEl('div', 'settings-row'); row.style.cssText = 'gap:5px;flex-wrap:wrap;';
    const lb = difEl('label', null, label); lb.style.minWidth = '64px';
    const inf = !isFinite(SET[k]), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.value = inf ? (side < 0 ? '−∞' : '∞') : difFmtIn(SET[k]); inp.style.cssText = 'width:62px;'; inp.disabled = inf;
    inp.addEventListener('change', () => { const x = difParseNum(inp.value); const o = k.slice(0, 1) + (side < 0 ? 'b' : 'a'); if (isFinite(x) && (side < 0 ? x < SET[o] : x > SET[o])) { SET[k] = setR6(x); } redo(); });
    const c1 = difEl('label'), cb = difEl('input'); cb.type = 'checkbox'; cb.checked = !!SET[kc]; cb.disabled = inf; c1.append(cb, document.createTextNode(' gehört dazu')); cb.addEventListener('change', () => { SET[kc] = cb.checked; redo(); });
    const c2 = difEl('label'), ci = difEl('input'); ci.type = 'checkbox'; ci.checked = inf; c2.append(ci, document.createTextNode(side < 0 ? ' −∞' : ' ∞')); ci.addEventListener('change', () => { const o = k.slice(0, 1) + (side < 0 ? 'b' : 'a'); if (ci.checked) SET[k] = side < 0 ? -Infinity : Infinity; else SET[k] = isFinite(SET[o]) ? SET[o] + side * 3 : side * 3; SET[kc] = false; redo(); });
    row.append(lb, inp, c1, c2); P.appendChild(row);
  };
  if (v === 'venn') { setVennUI(P, redo, group, select); return; }
  if (v === 'ex') { setExUI(P, redo, group, select); return; }
  select('Schreibweise', [['r', '(a, b)  (runde Klammer)'], ['f', ']a; b[  (nach aussen gedrehte Klammer)']], () => SET.st, x => { SET.st = x; });
  if (v === 'iv') { group('Intervall I'); endRow('linker Rand', 'ia', 'ica', -1); endRow('rechter Rand', 'ib', 'icb', 1); }
  else {
    select('Operation', SetI.OPS, () => SET.op, x => { SET.op = x; });
    group('Intervall A'); endRow('linker Rand', 'aa', 'aca', -1); endRow('rechter Rand', 'ab', 'acb', 1);
    group('Intervall B'); endRow('linker Rand', 'ba', 'bca', -1); endRow('rechter Rand', 'bb', 'bcb', 1);
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  const zoom = f => { const w = setResolvedWin(), c = (w.x0 + w.x1) / 2; SET.win = { x0: c - (c - w.x0) * f, x1: c + (w.x1 - c) * f }; redo(); };
  zr.append(difBtn('＋', () => zoom(0.7), 'Hineinzoomen'), difBtn('－', () => zoom(1 / 0.7), 'Herauszoomen'), difBtn('⟲ Ausschnitt', () => { SET.win = Object.assign({}, SET_WIN0); redo(); }, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  const row = difEl('div', 'settings-row'); const lb = difEl('label'), cb = difEl('input'); cb.type = 'checkbox'; cb.checked = SET.show.card; lb.append(cb, document.createTextNode(' Rechenweg als Karte anzeigen')); cb.addEventListener('change', () => { SET.show.card = cb.checked; redo(); }); row.appendChild(lb); P.appendChild(row);
}
function setCardCheck(P, redo) { const row = difEl('div', 'settings-row'); const lb = difEl('label'), cb = difEl('input'); cb.type = 'checkbox'; cb.checked = SET.show.card; lb.append(cb, document.createTextNode(' Rechenweg als Karte anzeigen')); cb.addEventListener('change', () => { SET.show.card = cb.checked; redo(); }); row.appendChild(lb); P.appendChild(row); }
// ── Eingabe wie überall: MathLive-Feld (math-field) und Tastatur im Stil des Panels «Tastatur» ──
// LaTeX des Feldes → einfacher Text für die Leser (SetV.parse, SetEx.parseIv, SetV.parseEls)
function setTexPlain(s) {
  s = String(s || '');
  for (let k = 0; k < 30; k++) {                                       // \overline{…} → (…)'  bzw. A'
    const i = s.indexOf('\\overline{'); if (i < 0) break;
    let d = 0, j = i + 9; for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (!d) break; } }
    const inner = s.slice(i + 10, j), one = /^\s*[A-Za-z]\s*$/.test(inner);
    s = s.slice(0, i) + (one ? inner.trim() : '(' + inner + ')') + "'" + s.slice(j + 1);
  }
  s = s.replace(/\\left|\\right|\\mathrm|\\text|\\mathbb|\\operatorname/g, '').replace(/\\[,;:! ]/g, '').replace(/\\cdot/g, '')
    .replace(/\\\{|\\lbrace/g, '⦃').replace(/\\\}|\\rbrace/g, '⦄').replace(/\\lbrack/g, '[').replace(/\\rbrack/g, ']')
    .replace(/\\cup/g, '∪').replace(/\\cap/g, '∩').replace(/\\infty/g, '∞').replace(/\\emptyset|\\varnothing/g, '∅')
    .replace(/\^\{?\\prime\}?|\\prime/g, "'").replace(/\^\{?c\}?/g, "'").replace(/\\setminus|\\smallsetminus|\\backslash/g, '\\');
  return s.replace(/\{,\}/g, ',').replace(/[{}]/g, '').replace(/⦃/g, '{').replace(/⦄/g, '}').replace(/\s+/g, ' ').trim();
}
// einfacher Text → LaTeX (Anfangswert des Feldes)
function setPlainTex(s, n) {
  if (n) { const r = SetV.parse(s, n); if (r.ok) return SetV.tex(r.t); }
  return String(s || '').replace(/∪/g, '\\cup ').replace(/∩/g, '\\cap ').replace(/∞/g, '\\infty ').replace(/∅/g, '\\emptyset ').replace(/\{/g, '\\{').replace(/\}/g, '\\}').replace(/\[/g, '\\lbrack ').replace(/\]/g, '\\rbrack ').replace(/'/g, '^{\\prime}');
}
function setMathField(tex, ph, onInput, onEnter) {
  const mf = document.createElement('math-field');
  mf.className = 'func-inp-ce alg-inp'; mf.setAttribute('translate', 'no');
  mf.style.cssText = 'font-size:15px;padding:4px 8px;border:1px solid var(--border-input);border-radius:6px;background:var(--bg-input);color:var(--text);width:100%;box-sizing:border-box;margin:2px 0;';
  mf.mathVirtualKeyboardPolicy = 'manual'; mf.setAttribute('placeholder', ph || '');
  mf.textContent = tex || '';
  try { mf.smartFence = false; } catch (e) { /* ältere MathLive */ }   // [ und ) dürfen gemischt werden (halboffene Intervalle)
  mf.addEventListener('focusin', () => { mf.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(mf, -1); });
  mf.addEventListener('focusout', () => { mf.style.borderColor = ''; });
  const val = () => { try { return mf.getValue('latex'); } catch (e) { return mf.value || ''; } };
  mf.addEventListener('input', () => onInput(setTexPlain(val())));
  mf.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (onEnter) onEnter(setTexPlain(val())); } });
  mf.plain = () => setTexPlain(val());
  return mf;
}
// Tastatur: [Beschriftung, LaTeX, Art (kv/ko/kp/kf), Hinweis]; ⌫ löscht, «Feld leeren» leert
function setKeys(P, mf, keys, onChange) {
  const kb = difEl('div', 'kbd set-keys'); kb.style.marginTop = '4px';
  const run = f => { try { mf.focus(); f(); } catch (e) { /* MathLive noch nicht bereit */ } if (typeof mlEnsureFocusAfterInsert === 'function') mlEnsureFocusAfterInsert(mf); onChange(mf.plain()); };
  keys.concat([['⌫', null, 'kp', 'Zeichen löschen'], ['Feld leeren', null, 'kf kwide', 'Eingabe löschen']]).forEach(([lab, tex, cls, tip]) => {
    const b = difEl('button', cls || 'kp', lab); b.type = 'button'; b.setAttribute('translate', 'no'); if (tip) b.title = tip;
    b.addEventListener('mousedown', e => e.preventDefault());                     // Cursor im Feld behalten
    b.addEventListener('click', () => run(() => {
      if (lab === '⌫') mf.executeCommand('deleteBackward');
      else if (tex === null) mf.setValue('');
      else mf.insert(tex, { insertionMode: 'replaceSelection', selectionMode: 'placeholder', focus: true });
    }));
    kb.appendChild(b);
  });
  P.appendChild(kb);
  return kb;
}
// Venn-Diagramm: Anzahl Mengen, Term, Elemente oder Anzahlen
// ── Animation (Venn-Diagramm): der Term wird Schritt für Schritt schraffiert ──
function setAnimStop() { if (SET.anim) { SET.anim = null; setRefreshUI(); difRedraw(); } }
function setAnimToggle() {
  if (SET.anim) { setAnimStop(); return; }
  const pr = SetV.parse(SET.vx, SET.vn); if (!pr.ok) return;
  SET.anim = { last: 0, i: 0, n: setVennSeq(pr.t, SET.vn).length, wait: 1.7 };
  setRefreshUI(); difRedraw(); requestAnimationFrame(setAnimFrame);
}
function setAnimFrame(ts) {
  const a = SET.anim; if (!a) return;
  if (!setActive() || SET.view !== 'venn') { SET.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  a.wait -= dt;
  if (a.wait <= 0) { a.i++; a.wait = 1.7; if (a.i >= a.n) { setAnimStop(); return; } difRedraw(); }
  requestAnimationFrame(setAnimFrame);
}
function setVennUI(P, redo, group, select) {
  const n = SET.vn;
  group('Mengen und Term');
  select('Mengen', [['2', '2 Mengen (A, B)'], ['3', '3 Mengen (A, B, C)']], () => String(n), x => { SET.vn = +x; const ok = SetV.parse(SET.vx, SET.vn).ok; if (!ok) SET.vx = SET.vn === 2 ? 'A∩B' : 'A∩B∩C'; });
  const ops = SET_VENN_OPS[n], cur = ops.indexOf(SET.vx) >= 0 ? SET.vx : '';
  select('Operation', [['', 'eigener Term …']].concat(ops.map(o => [o, o.replace(/'/g, 'ᶜ').replace(/\\/g, ' \\ ')])), () => cur, x => { if (x) SET.vx = x; });
  const err = difEl('div', 'td-err'), showErr = () => { const pr = SetV.parse(SET.vx, n); err.textContent = pr.ok || !SET.vx ? '' : pr.err; };
  const onT = v => { SET.vx = v; showErr(); SET.cardKey = ''; difRedraw(); setCardSoon(); clearTimeout(SET._kt); SET._kt = setTimeout(difCommit, 700); };
  const lbT = difEl('div', 'subpanel-label', 'Term'); lbT.style.marginTop = '6px'; P.appendChild(lbT);
  const mf = setMathField(setPlainTex(SET.vx, n), "(A∪B)∩C'", onT, v => { onT(v); redo(); });
  P.appendChild(mf);
  setKeys(P, mf, (n === 3 ? ['A', 'B', 'C'] : ['A', 'B']).map(k => [k, k, 'kv']).concat([['(', '(', 'kp'], [')', ')', 'kp'], ['∪', '\\cup ', 'ko', 'Vereinigung (oder)'], ['∩', '\\cap ', 'ko', 'Schnitt (und)'], ['\\', '\\setminus ', 'ko', 'Differenz (ohne)'], ['Ā', '\\overline{#@}', 'ko', 'Komplement: nach der Menge oder Klammer drücken (oder zuerst markieren)']]), onT);
  const hk = difEl('div', 'act-hint', 'Mit der Computertastatur: u = ∪, n = ∩, − = \\, \' = Komplement.'); hk.style.margin = '2px'; P.appendChild(hk);
  P.appendChild(err); showErr();
  { const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(SET.anim ? '⏸ Pause' : '▶ Term Schritt für Schritt schraffieren', setAnimToggle)); P.appendChild(ab); }
  select('In den Feldern', [['el', 'Elemente'], ['cnt', 'Anzahlen'], ['none', 'nichts (nur Flächen)']], () => SET.vm, x => { SET.vm = x; });
  const txt = (label, k, ph) => { const r = difEl('div', 'settings-row'); r.style.gap = '8px'; const l = difEl('label', null, label); l.style.minWidth = '64px'; const i = difEl('input'); i.type = 'text'; i.value = SET[k]; i.style.width = '150px'; i.setAttribute('translate', 'no'); if (ph) i.placeholder = ph; i.addEventListener('change', () => { SET[k] = i.value; redo(); }); r.append(l, i); P.appendChild(r); };
  if (SET.vm === 'el') { group('Elemente'); txt('A', 'vA', '1, 2, 3'); txt('B', 'vB', '2, 4, 6'); if (n === 3) txt('C', 'vC', '3, 6, 9'); txt('G', 'vG', 'leer: alle Elemente von A, B' + (n === 3 ? ', C' : '')); }
  if (SET.vm === 'cnt') {
    group('Anzahl Elemente je Feld');
    for (let m = (1 << n) - 1; m >= 0; m--) {
      const r = difEl('div', 'settings-row'); r.style.gap = '8px'; const l = difEl('label', null, SetV.regionName(m, n)); l.style.cssText = 'min-width:150px;font-size:12px;';
      const i = difEl('input'); i.type = 'text'; i.inputMode = 'numeric'; i.value = String(SET.vK[m] || 0); i.style.width = '56px';
      i.addEventListener('change', () => { const x = Math.round(+i.value.replace(',', '.')); if (x >= 0) SET.vK[m] = x; redo(); }); r.append(l, i); P.appendChild(r);
    }
  }
  setCardCheck(P, redo);
}
// Rechenweg zum Venn-Diagramm
function setVennDoc(C) {
  const D = setVennData(C), d = Dif.DOC();
  d.h('Mengenoperationen im Venn-Diagramm');
  if (!D.P.ok) { d.p('Der Term ist nicht lesbar: ' + D.P.err + '.'); return d; }
  const T = D.P.t, used = new Set(); (function walk(t) { if (!t) return; used.add(t.k); walk(t.a); walk(t.b); })(T);
  const DEF = { or: '**Vereinigung** $A\\cup B$: alle Elemente, die in $A$ **oder** in $B$ liegen.', and: '**Schnitt** $A\\cap B$: alle Elemente, die in $A$ **und** in $B$ liegen.', diff: '**Differenz** $A\\setminus B$: alle Elemente von $A$, die **nicht** in $B$ liegen.', not: '**Komplement** $\\overline{A}$: alle Elemente der Grundmenge $G$, die nicht in $A$ liegen.' };
  ['or', 'and', 'diff', 'not'].forEach(k => { if (used.has(k)) d.p(DEF[k]); });
  if (C.vm === 'el') { D.sets.forEach((S, k) => d.e(SetV.NAMES[k] + '=' + SetV.elsTex(S))); d.e('G=' + SetV.elsTex(D.U)).op(D.G.length ? '' : 'alle Elemente'); }
  d.p('**Schritt für Schritt** (zuerst die Klammern):');
  SetV.steps(T).forEach(u => { const b = SetV.val(u, D.n); if (C.vm === 'el') d.e(SetV.tex(u) + '=' + SetV.elsTex(SetV.elsOf(b, D.sets, D.U))); else if (C.vm === 'cnt') d.e('|' + SetV.tex(u) + '|=' + SetEx.sum(C.vK, b)); else d.e(SetV.tex(u)).op(setVBitsWords(b, D.n)); });
  d.p('Schraffierte Felder: ' + setVBitsWords(D.bits, D.n) + '.');
  if (used.has('not')) d.note('Gesetze von De Morgan: $\\overline{A\\cup B}=\\overline{A}\\cap\\overline{B}$ und $\\overline{A\\cap B}=\\overline{A}\\cup\\overline{B}$.');
  d.res('$' + SetV.tex(T) + (C.vm === 'el' ? '=' + SetV.elsTex(SetV.elsOf(D.bits, D.sets, D.U)) : C.vm === 'cnt' ? ',\\ \\text{Anzahl } ' + SetEx.sum(C.vK, D.bits) : '') + '$');
  return d;
}
// Übungen: Aufgabenart, Aufgabe, Antwort, Prüfen, Lösung, neue Aufgabe
function setExNew() { SET.xt = SetEx.make(SET.xk); SET.xa = ''; SET.xs = 0; SET.xr = null; SET._counted = false; SET._fb = ''; SET.cardKey = ''; }
function setExCheck() {
  const t = SET.xt; if (!t) return;
  const r = SetEx.check(t, SET.xa, SET.xs); SET._fb = r.msg; SET.xr = r.ok ? 'ok' : 'bad';
  if (!SET._counted) { SET.xsc.n++; if (r.ok) SET.xsc.ok++; SET._counted = true; }
  SET.cardKey = ''; setRefreshUI(); difRedraw(); setCardSoon(); difCommit();
}
function setExUI(P, redo, group, select) {
  if (!SET.xt || SET.xt.kind !== SET.xk) setExNew();
  const t = SET.xt;
  select('Aufgabe', SetEx.KINDS, () => SET.xk, x => { SET.xk = x; setExNew(); });
  if (t.kind === 'ivw' || t.kind === 'ivop') select('Schreibweise', [['r', '(a, b)  (runde Klammer)'], ['f', ']a; b[  (nach aussen gedrehte Klammer)']], () => SET.st, x => { SET.st = x; });
  const box = difEl('div', 'alg-ptask'); box.style.cssText = 'margin:8px 2px 4px;font-size:13px;line-height:1.45;';
  try { const d = Dif.DOC(); d.p(SetEx.prompt(t)); box.innerHTML = ST.renderDoc(d); } catch (e) { box.textContent = SetEx.prompt(t); }
  P.appendChild(box);
  if (t.kind !== 'shade') {
    const ph = t.kind === 'el' ? '{2, 4, 6}' : t.kind === 'cnt' ? 'Anzahl' : '[−2, 3)';
    const mf = setMathField(setPlainTex(SET.xa), ph, v => { SET.xa = v; }, v => { SET.xa = v; setExCheck(); });
    P.appendChild(mf);
    const K = t.kind === 'el' ? [['{', '\\{', 'kp'], ['}', '\\}', 'kp'], [',', ',', 'ko'], ['∅', '\\emptyset ', 'kv', 'leere Menge']] : t.kind === 'cnt' ? null
      : [['[', '\\lbrack ', 'kp'], [']', '\\rbrack ', 'kp'], ['(', '(', 'kp'], [')', ')', 'kp'], [',', ',', 'ko'], ['−', '-', 'ko'], ['∞', '\\infty ', 'kv'], ['∪', '\\cup ', 'ko', 'Vereinigung'], ['∅', '\\emptyset ', 'kv', 'leere Menge']];
    if (K) setKeys(P, mf, K, v => { SET.xa = v; });
    if (t.kind === 'ivw' || t.kind === 'ivop') { const h = difEl('div', 'act-hint', 'Beide Schreibweisen gehen: [−2, 3) oder [−2; 3[. Für ∞, ∪ und ∅ die Tasten benutzen.'); h.style.margin = '2px'; P.appendChild(h); }
  } else { const h = difEl('div', 'act-hint', 'Klicke im Bild auf ein Feld, um es zu schraffieren; nochmals klicken entfernt die Schraffur.'); h.style.margin = '2px'; P.appendChild(h); }
  const btns = difEl('div', 'alg-pbtns');
  const b1 = difEl('button', 'pri', 'Prüfen'); b1.type = 'button'; b1.addEventListener('click', setExCheck);
  const b2 = difEl('button', '', 'Lösung zeigen'); b2.type = 'button'; b2.addEventListener('click', () => { if (!SET._counted) { SET.xsc.n++; SET._counted = true; } SET.xr = 'shown'; SET._fb = ''; redo(); });
  const b3 = difEl('button', '', 'Neue Aufgabe'); b3.type = 'button'; b3.addEventListener('click', () => { setExNew(); redo(); });
  btns.append(b1, b2, b3);
  if (t.kind === 'shade') { const b4 = difEl('button', '', 'Auswahl löschen'); b4.type = 'button'; b4.addEventListener('click', () => { SET.xs = 0; SET.xr = null; SET._fb = ''; redo(); }); btns.appendChild(b4); }
  P.appendChild(btns);
  const ok = SET.xr === 'ok', fb = difEl('div', 'alg-pfb' + (SET.xr === 'ok' ? ' ok' : SET.xr === 'bad' ? ' bad' : ''), SET._fb || (SET.xr === 'shown' ? 'Lösung: siehe Bild und Rechenweg.' : '')); void ok;
  P.appendChild(fb);
  P.appendChild(difEl('div', 'alg-pscore', 'Richtig: ' + SET.xsc.ok + ' von ' + SET.xsc.n));
  setCardCheck(P, redo);
}
// Klick ins Venn-Diagramm einer Schraffier-Übung: Feld umschalten
function setVennClick(p) {
  const S = SET.S, V = S && S.maps.venn, t = SET.xt;
  if (SET.view !== 'ex' || !t || t.kind !== 'shade' || !V || !V.inG(p.x, p.y) || SET.xr === 'shown') return false;
  const m = setVMask(V.n, V.ux(p.x), V.uy(p.y));
  SET.xs ^= 1 << m; SET.xr = null; SET._fb = ''; SET.cardKey = '';
  setRefreshUI(); difRedraw(); setCardSoon(); difCommit();
  return true;
}
// Maus: Randpunkte ziehen (Raster je nach Ausschnitt, Umschalttaste frei), sonst verschieben
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L - 10 && p.x <= m.R + 10 && p.y >= m.r.y && p.y <= m.r.y + m.r.h;
  const near = p => { const S = SET.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + 4 && d < bd) { bd = d; best = q; } }); return best; };
  const down = e => {
    if (!setActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = SET.S; if (!S) return; if (SET.anim) setAnimStop(); const p = pos(e), q = near(p), m = S.maps.main;
    if (setVennClick(p)) return;
    if (q) { SET.drag = { type: q.id }; if (SET.win.x0 === null) { SET.win = setResolvedWin(); SET.drag.auto = true; } }
    else if (inMap(m, p)) SET.drag = { type: 'pan', px: p.x, w: setResolvedWin() };
    if (SET.drag) cv.style.cursor = SET.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!setActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = SET.S; if (!S) return; const p = pos(e), d = SET.drag, m = S.maps.main;
    if (!d) { const V = S.maps.venn, sh = SET.view === 'ex' && SET.xt && SET.xt.kind === 'shade' && V && V.inG(p.x, p.y); cv.style.cursor = near(p) || sh ? 'pointer' : (inMap(m, p) ? 'grab' : ''); return; }
    if (d.type === 'pan') { const dx = (p.x - d.px) / (m.R - m.L) * (d.w.x1 - d.w.x0); SET.win = { x0: d.w.x0 - dx, x1: d.w.x1 - dx }; }
    else {
      const map = { I0: ['ia', 'ib', -1], I1: ['ib', 'ia', 1], A0: ['aa', 'ab', -1], A1: ['ab', 'aa', 1], B0: ['ba', 'bb', -1], B1: ['bb', 'ba', 1] }[d.type];
      if (map) { const st = e.shiftKey ? 0.01 : Math.max(0.5, Stat.niceStep(m.win.x1 - m.win.x0, 40)); let x = Math.round(m.IX(p.x) / st) * st; const o = SET[map[1]]; if (map[2] < 0 ? x < o : x > o) SET[map[0]] = setR6(x); SET.cardKey = ''; }
    }
    difRedraw(); if (d.type !== 'pan') setCardSoon();
  };
  const up = e => {
    if (!setActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !SET.drag) return;
    if (SET.drag) { if (SET.drag.auto) SET.win = Object.assign({}, SET_WIN0); SET.drag = null; cv.style.cursor = ''; setRefreshUI(); difRedraw(); setCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!setActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = SET.S; if (!S) return; const p = pos(e), m = S.maps.main; if (!inMap(m, p)) return;
    const w = setResolvedWin(), cx = m.IX(p.x), f = stWheelF(e); SET.win = { x0: cx - (cx - w.x0) * f, x1: cx + (w.x1 - cx) * f }; difRedraw();
    clearTimeout(SET._wt); SET._wt = setTimeout(() => { setRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!setActive()) return; e.stopImmediatePropagation(); e.preventDefault(); SET.win = Object.assign({}, SET_WIN0); setRefreshUI(); difRedraw(); difCommit(); };
  const stop = e => { if (setActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();
document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { SET.cardKey = ''; if (setActive()) { setCardRender(); setRefreshUI(); difRedraw(); } }, ms)); });
setBuildUI();
