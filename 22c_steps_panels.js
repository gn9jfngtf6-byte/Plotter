// ═══════════════════════════════════════════════════════════════════
// MODUL 22c: Lösungswege der Funktions-Panels (Gerade / Parabel)
//
// Ersetzt die drei alten Lösungsweg-Kästen in der Seitenleiste
//   📋 Lösungsweg   (Gerade: 2 Punkte, Senkrechte, Mittelsenkrechte)   → showLoesungsweg()
//   📐 Scheitelpunkt (Parabel)                                         → showQuadScheitelpunkt()
//   📋 Nullstellen   (Parabel)                                         → showQuadNullstellen()
// durch Lösungswege im selben Stil wie alle anderen: Karte oben rechts im Plot
// (#solve-tooltip), Schrift wie im Eingabefeld, Randnotizen, Ergebnis-Box.
//
// Robustheit wie bei den anderen Lösungswegen:
//  • alles wird EXAKT gerechnet (Brüche, Wurzeln; 20_exact.js / 21_solver.js) –
//    keine Fliesskomma-Anzeige, kein "−0", kein "x − −8";
//  • die Form (Normal-/Scheitelpunkt-/Nullstellenform) wird an der STRUKTUR des
//    Ausdrucks erkannt (Syntaxbaum), nicht mit Textmustern;
//  • Punkte/Senkrechte/Mittelsenkrechte werden nur gezeigt, wenn sie wirklich zur
//    aktuellen Funktion passen (sonst: einfache Form m, q, Nullstelle);
//  • versagt die Engine, springt die alte Darstellung ein (Rückfall).
// ═══════════════════════════════════════════════════════════════════
(function () {
  'use strict';
  if (typeof EX === 'undefined' || typeof SV === 'undefined' || typeof ST === 'undefined') return;
  const E = EX, S = SV, Doc = S.Doc;
  const Q0 = E.q0, Q1 = E.q1, QM1 = E.qNeg(E.q1), Q2 = E.Q(2), Q4 = E.Q(4);
  const qT = E.qTex, qP = E.qTexP;
  const { coord, fName } = ST;

  // ───────────────────── Kleine Helfer ─────────────────────
  const prec = () => Math.max((typeof precision === 'number' && isFinite(precision)) ? precision : 2, 2);
  // Zahl (Float) → exakter Bruch; "schön", sonst auf `precision` Stellen gerundet
  function rq(v) {
    if (!isFinite(v)) return null;
    const q = E.qFromFloat(v);
    if (q) return { q, rounded: false };
    const dec = E.qFromDec(Math.abs(v).toFixed(prec()));
    if (!dec) return null;
    return { q: v < 0 ? E.qNeg(dec) : dec, rounded: true };
  }
  const isInt = q => q.d === 1n;
  const eq = (a, b) => E.qEq(a, b);
  const isZ = a => E.qIsZero(a);
  const num = q => E.qNum(q);
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  function getP(P, k) { return P[k] || Q0; }
  // a : b  als Bruch, bei Bruch-Zahlen mit ":" (vermeidet verschachtelte Doppelbrüche)
  const divTex = (a, b) => (isInt(a) && isInt(b)) ? '\\frac{' + qT(a) + '}{' + qT(b) + '}' : qP(a) + ':' + qP(b);
  // Operation "q abziehen" als Randnotiz:  q>0 → "-q",  q<0 → "+|q|"
  const subOp = q => (q.n < 0n ? '+' : '-') + qT(E.qAbs(q));
  const lineTex = (m, q) => E.pTex([q, m], 'x');
  const pt = (name, x, y) => name + coord(qT(x), qT(y));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ───────────────────── Formerkennung (Syntaxbaum) ─────────────────────
  const cq = n => { try { return n && !S.containsX(n) ? E.exactQ(n) : null; } catch (e) { return null; } };
  // Summanden mit Vorzeichen:  a − (b + c) → [a, −b, −c]
  function flattenSum(n, sign, out) {
    sign = sign || 1; out = out || [];
    if (n.type === 'add') { flattenSum(n.a, sign, out); flattenSum(n.b, sign, out); }
    else if (n.type === 'sub') { flattenSum(n.a, sign, out); flattenSum(n.b, -sign, out); }
    else if (n.type === 'neg') flattenSum(n.x, -sign, out);
    else out.push({ sign, n });
    return out;
  }
  // Produkt: konstanter Faktor k und x-abhängige Faktoren
  function factorsOf(n) {
    let k = Q1; const xs = [];
    (function rec(m) {
      if (m.type === 'mul') { rec(m.a); rec(m.b); return; }
      if (m.type === 'neg') { k = E.qNeg(k); rec(m.x); return; }
      if (m.type === 'div') { const d = cq(m.b); if (d && !isZ(d)) { k = E.qDiv(k, d); rec(m.a); return; } }
      const c = cq(m);
      if (c) { k = E.qMul(k, c); return; }
      xs.push(m);
    })(n);
    return { k, xs };
  }
  // → { t:'vertex', a, s, tq } | { t:'roots', a, r1, r2 } | { t:'normal' }
  function classify(ast, P) {
    const a = getP(P, 2);
    try {
      // Nullstellenform: a·(x − x₁)·(x − x₂)
      const f = factorsOf(ast);
      if (f.xs.length === 2) {
        const lin = f.xs.map(g => E.polyFromAst(g));
        if (lin.every(p => p && E.pDeg(p) === 1)) {
          const r1 = E.qDiv(E.qNeg(lin[0][0]), lin[0][1]), r2 = E.qDiv(E.qNeg(lin[1][0]), lin[1][1]);
          const lead = E.qMul(f.k, E.qMul(lin[0][1], lin[1][1]));
          if (eq(lead, a)) return { t: 'roots', a, r1, r2 };
        }
      }
      // Scheitelpunktform: a·(x − s)² + t   (genau ein Quadrat-Summand + Konstanten)
      let sq = null, tq = Q0, ok = true;
      flattenSum(ast).forEach(({ sign, n }) => {
        const c = cq(n);
        if (c) { tq = sign > 0 ? E.qAdd(tq, c) : E.qSub(tq, c); return; }
        const ft = factorsOf(n);
        if (ft.xs.length === 1 && ft.xs[0].type === 'pow' && !sq) {
          const ex = cq(ft.xs[0].b), g = E.polyFromAst(ft.xs[0].a);
          if (ex && eq(ex, Q2) && g && E.pDeg(g) === 1 && (eq(g[1], Q1) || eq(g[1], QM1))) {
            sq = { k: sign > 0 ? ft.k : E.qNeg(ft.k), g }; return;
          }
        }
        ok = false;
      });
      if (ok && sq && eq(sq.k, a)) return { t: 'vertex', a, s: E.qDiv(E.qNeg(sq.g[0]), sq.g[1]), tq };
    } catch (e) { /* → Normalform */ }
    return { t: 'normal' };
  }
  // a·(x − s)² + t  als LaTeX
  const baseTex = s => isZ(s) ? 'x' : '\\left(x' + (s.n < 0n ? '+' : '-') + qT(E.qAbs(s)) + '\\right)';
  function vertexTex(a, s, t) {
    const pre = eq(a, Q1) ? '' : eq(a, QM1) ? '-' : qT(a) + '\\cdot ';
    let out = pre + baseTex(s) + '^{2}';
    if (!isZ(t)) out += (t.n < 0n ? '-' : '+') + qT(E.qAbs(t));
    return out;
  }

  // ───────────────────── Funktionen holen ─────────────────────
  const visible = fn => fn && fn.expr && fn.expr.trim() && fn.visible !== false;
  function polyOf(fi) {
    const ast = ST.astOf(fi); if (!ast) return null;
    let P; try { P = E.polyFromAst(ast); } catch (e) { return null; }
    if (!P) return null;
    return { ast, P: E.pTrim(P) };
  }
  // Kopfzeile: Normalform/Geraden schulgerecht (2x+1), Scheitelpunkt-/Nullstellenform wie eingegeben
const header = (fi, ast, P) => '$' + fName(fi, 0) + '(x)=' + (P ? E.pTex(P, 'x') : S.T(ast)) + '$';

  // ═══════════════════════════ GERADE ═══════════════════════════
  // Zwei Punkte der Geraden herausfinden (nur wenn sie WIRKLICH zur Funktion passen)
  function twoPointsFor(fi, P) {
    const fn = functions[fi];
    const m = getP(P, 1), c = getP(P, 0);
    const cands = [];
    const ll = (typeof linkedLines !== 'undefined') ? linkedLines.find(l => l.fi === fi) : null;
    if (ll && points[ll.pi1] && points[ll.pi2]) cands.push({ a: points[ll.pi1], b: points[ll.pi2], fromFn: false });
    if (fn && fn.fitType === 'linear' && Array.isArray(fn.fitPts) && fn.fitPts.length >= 2) cands.push({ a: fn.fitPts[0], b: fn.fitPts[1], fromFn: false });
    const st = (typeof slopeTriPtsMap !== 'undefined') ? slopeTriPtsMap[fi] : null;
    if (st && st.length === 2) cands.push({ a: { x: st[0].x }, b: { x: st[1].x }, fromFn: true });
    if (!cands.length) return null;
    for (const cd of cands) {
      const pts = [cd.a, cd.b].map(p => {
        const rx = rq(p.x); if (!rx) return null;
        const yEx = E.qAdd(E.qMul(m, rx.q), c);                  // y exakt auf der Geraden
        if (cd.fromFn || p.y === undefined) return { x: rx.q, y: yEx, rounded: rx.rounded };
        const ry = rq(p.y); if (!ry) return null;
        return { x: rx.q, y: ry.q, rounded: rx.rounded || ry.rounded };
      });
      if (!pts[0] || !pts[1]) continue;
      const dx = E.qSub(pts[1].x, pts[0].x); if (isZ(dx)) continue;
      const md = E.qDiv(E.qSub(pts[1].y, pts[0].y), dx);
      const qd = E.qSub(pts[0].y, E.qMul(md, pts[0].x));
      const fm = num(m), fc = num(c);
      if (!near(num(md), fm, 2e-3 * (1 + Math.abs(fm))) || !near(num(qd), fc, 2e-3 * (1 + Math.abs(fc)))) continue;
      return { A: pts[0], B: pts[1], m: md, q: qd, rounded: pts[0].rounded || pts[1].rounded };
    }
    return null;
  }

  // Zeilen "Steigung m aus zwei Punkten" + "y-Achsenabschnitt q" (gemeinsam für Gerade durch 2 Punkte)
  function slopeFromPoints(d, A, B, m, label1, label2) {
    const dy = E.qSub(B.y, A.y), dx = E.qSub(B.x, A.x);
    d.p('**Steigung** aus den beiden Punkten:');
    d.e('m=\\frac{y_{2}-y_{1}}{x_{2}-x_{1}}');
    d.e('m=\\frac{' + qT(B.y) + '-' + qP(A.y) + '}{' + qT(B.x) + '-' + qP(A.x) + '}');
    const frac = divTex(dy, dx), mt = qT(m);
    d.e('m=' + frac + (frac !== mt ? '=' + mt : ''));
  }
  function interceptFromPoint(d, Pnt, m, q, label) {
    d.p('**y-Achsenabschnitt** $q$: den Punkt $' + label + '$ in $y=m\\cdot x+q$ einsetzen:');
    if (isZ(Pnt.x)) {
      d.e(qT(Pnt.y) + '=' + qP(m) + '\\cdot 0+q');
      d.e('q=' + qT(q));
      return;
    }
    d.e(qT(Pnt.y) + '=' + qP(m) + '\\cdot ' + qP(Pnt.x) + '+q');
    const prod = E.qMul(m, Pnt.x);
    d.op(subOp(prod));
    d.e('q=' + qT(Pnt.y) + '-' + qP(prod) + '=' + qT(q));
  }

  // Einfache Form: m, q, Nullstelle ablesen
  function linPlain(d, fi, ast, P) {
    const m = getP(P, 1), q = getP(P, 0);
    d.h(header(fi, ast, P));
    d.p('Aus der Geradengleichung $y=m\\cdot x+q$ lassen sich Steigung und y-Achsenabschnitt direkt ablesen:');
    d.e('m=' + qT(m));
    d.e('q=' + qT(q));
    d.p('Die Gerade schneidet die y-Achse im Punkt $S_y' + coord('0', qT(q)) + '$.');
    if (isZ(m)) {
      d.p(isZ(q) ? 'Die Gerade ist die $x$-Achse selbst — jede Stelle ist eine Nullstelle.' : '**Nullstelle**: Die Gerade ist waagrecht ($m=0$) und verläuft parallel zur $x$-Achse — **keine Nullstelle**.');
    } else {
      d.p('**Nullstelle** ($y=0$ setzen):');
      const sub = new Doc();
      const r = S.solvePoly(sub, [q, m], { v: 'x' });
      sub.b.forEach(b => d.b.push(b));
      if (r.roots.length) d.res('Nullstelle: $N' + coord(r.roots[0].tex, '0') + '$');
    }
  }

  // Gerade durch zwei Punkte
  function linTwoPoints(d, fi, ast, P, tp) {
    const { A, B, m, q } = tp;
    d.h('$' + fName(fi, 0) + '$: Gerade durch $' + pt('P_{1}', A.x, A.y) + '$ und $' + pt('P_{2}', B.x, B.y) + '$');
    slopeFromPoints(d, A, B, m);
    interceptFromPoint(d, A, m, q, 'P_{1}');
    if (tp.rounded) d.note('Die Koordinaten sind auf ' + prec() + ' Nachkommastellen gerundet.');
    d.res('Geradengleichung: $' + fName(fi, 0) + '(x)=' + lineTex(m, q) + '$');
  }

  // Senkrechte durch Q zu einer Referenzgeraden
  function linPerp(d, fi, ast, P, meta) {
    const m2f = getP(P, 1), qf = getP(P, 0);
    const ref = polyOf(meta.refFi);
    let m1 = null;
    if (ref && E.pDeg(ref.P) === 1) m1 = ref.P[1];
    else { const r = rq(meta.m0); m1 = r && r.q; }
    if (!m1 || isZ(m1)) return false;
    const rx = rq(meta.throughPt.x), ry = rq(meta.throughPt.y);
    if (!rx || !ry) return false;
    const m2 = E.qNeg(E.qInv(m1));
    const q = E.qSub(ry.q, E.qMul(m2, rx.q));
    if (!near(num(m2), num(m2f), 2e-3 * (1 + Math.abs(num(m2f)))) || !near(num(q), num(qf), 2e-3 * (1 + Math.abs(num(qf))))) return false;
    d.h('$' + fName(fi, 0) + '$: Senkrechte zu $' + fName(meta.refFi, 0) + '$ durch $' + pt('Q', rx.q, ry.q) + '$');
    d.p('**Steigung**: Zwei Geraden stehen genau dann senkrecht aufeinander, wenn $m_{1}\\cdot m_{2}=-1$ gilt. Mit $m_{1}=' + qT(m1) + '$ folgt:');
    { const st = '-\\frac{1}{' + qP(m1) + '}'; d.e('m_{2}=-\\frac{1}{m_{1}}=' + st + (st !== qT(m2) ? '=' + qT(m2) : '')); }
    interceptFromPoint(d, { x: rx.q, y: ry.q }, m2, q, 'Q');
    d.e('m_{1}\\cdot m_{2}=' + qP(m1) + '\\cdot ' + qP(m2) + '=' + qT(E.qMul(m1, m2)) + '\\ \\checkmark', 'Probe');
    if (rx.rounded || ry.rounded) d.note('Die Koordinaten sind auf ' + prec() + ' Nachkommastellen gerundet.');
    d.res('Senkrechte: $' + fName(fi, 0) + '(x)=' + lineTex(m2, q) + '$');
    return true;
  }

  // Mittelsenkrechte einer Strecke AB
  function linBisector(d, fi, ast, P, meta) {
    if (!meta.ptA || !meta.ptB) return false;
    const m2f = getP(P, 1), qf = getP(P, 0);
    const ax = rq(meta.ptA.x), ay = rq(meta.ptA.y), bx = rq(meta.ptB.x), by = rq(meta.ptB.y);
    if (!ax || !ay || !bx || !by) return false;
    const A = { x: ax.q, y: ay.q }, B = { x: bx.q, y: by.q };
    const mid = { x: E.qDiv(E.qAdd(A.x, B.x), Q2), y: E.qDiv(E.qAdd(A.y, B.y), Q2) };
    const rounded = ax.rounded || ay.rounded || bx.rounded || by.rounded;
    const dx = E.qSub(B.x, A.x), dy = E.qSub(B.y, A.y);
    const head = () => d.h('$' + fName(fi, 0) + '$: Mittelsenkrechte der Strecke $AB$ mit $' + pt('A', A.x, A.y) + '$ und $' + pt('B', B.x, B.y) + '$');
    const midLines = () => {
      d.p('**Mittelpunkt** $M$ der Strecke $AB$:');
      d.e('M\\left(\\frac{x_{A}+x_{B}}{2}\\,|\\,\\frac{y_{A}+y_{B}}{2}\\right)');
      d.e('M\\left(\\frac{' + qT(A.x) + '+' + qP(B.x) + '}{2}\\,|\\,\\frac{' + qT(A.y) + '+' + qP(B.y) + '}{2}\\right)=' + pt('M', mid.x, mid.y));
    };
    if (isZ(dx)) {                                  // AB senkrecht → Mittelsenkrechte waagrecht
      if (!isZ(m2f) || !near(num(mid.y), num(qf), 2e-3 * (1 + Math.abs(num(qf))))) return false;
      head(); midLines();
      d.p('Die Strecke $AB$ ist senkrecht ($x_{A}=x_{B}$). Die Mittelsenkrechte steht darauf senkrecht, ist also **waagrecht** und geht durch $M$:');
      d.e('y=' + qT(mid.y));
      if (rounded) d.note('Die Koordinaten sind auf ' + prec() + ' Nachkommastellen gerundet.');
      d.res('Mittelsenkrechte: $' + fName(fi, 0) + '(x)=' + qT(mid.y) + '$');
      return true;
    }
    if (isZ(dy)) return false;                      // AB waagrecht → Mittelsenkrechte senkrecht (keine Funktion)
    const mAB = E.qDiv(dy, dx), m2 = E.qNeg(E.qInv(mAB));
    const q = E.qSub(mid.y, E.qMul(m2, mid.x));
    if (!near(num(m2), num(m2f), 2e-3 * (1 + Math.abs(num(m2f)))) || !near(num(q), num(qf), 2e-3 * (1 + Math.abs(num(qf))))) return false;
    head(); midLines();
    d.p('**Steigung**: Die Strecke $AB$ hat die Steigung');
    d.e('m_{1}=\\frac{y_{B}-y_{A}}{x_{B}-x_{A}}=\\frac{' + qT(B.y) + '-' + qP(A.y) + '}{' + qT(B.x) + '-' + qP(A.x) + '}=' + qT(mAB));
    d.p('Senkrechte Geraden erfüllen $m_{1}\\cdot m_{2}=-1$, also:');
    { const st = '-\\frac{1}{' + qP(mAB) + '}'; d.e('m_{2}=-\\frac{1}{m_{1}}=' + st + (st !== qT(m2) ? '=' + qT(m2) : '')); }
    interceptFromPoint(d, mid, m2, q, 'M');
    d.e('m_{1}\\cdot m_{2}=' + qP(mAB) + '\\cdot ' + qP(m2) + '=' + qT(E.qMul(mAB, m2)) + '\\ \\checkmark', 'Probe');
    if (rounded) d.note('Die Koordinaten sind auf ' + prec() + ' Nachkommastellen gerundet.');
    d.res('Mittelsenkrechte: $' + fName(fi, 0) + '(x)=' + lineTex(m2, q) + '$');
    return true;
  }

  // mode 'lines': gewöhnliche Geraden | 'perp': nur Senkrechte/Mittelsenkrechte (eigener Knopf)
  function buildLines(mode) {
    const d = new Doc(); let n = 0, first = -1, kind = '';
    (functions || []).forEach((fn, fi) => {
      if (!visible(fn)) return;
      const po = polyOf(fi);
      if (!po || E.pDeg(po.P) > 1) return;
      const meta = (typeof perpMeta !== 'undefined') ? perpMeta[fi] : null;
      if (mode === 'perp' ? !meta : !!meta) return;
      const mark = d.b.length;
      let done = false;
      try {
        if (meta && meta.kind === 'perp') done = linPerp(d, fi, po.ast, po.P, meta);
        else if (meta && meta.kind === 'bisector') done = linBisector(d, fi, po.ast, po.P, meta);
        else {
          const tp = twoPointsFor(fi, po.P);
          if (tp) { linTwoPoints(d, fi, po.ast, po.P, tp); done = true; }
        }
      } catch (e) { done = false; if (window.console) console.warn('Lösungsweg Gerade:', e); }
      if (!done) { d.b.length = mark; linPlain(d, fi, po.ast, po.P); }
      else if (meta) kind = meta.kind;
      if (n === 0) first = fi;
      n++;
    });
    return n ? { d, n, first, kind } : null;
  }

  // ═══════════════════════════ PARABEL ═══════════════════════════
  function quadFuncs() {
    const out = [];
    (functions || []).forEach((fn, fi) => {
      if (!visible(fn)) return;
      const po = polyOf(fi);
      if (po && E.pDeg(po.P) === 2) out.push({ fi, ast: po.ast, P: po.P, cl: classify(po.ast, po.P) });
    });
    return out;
  }
  // y-Zeile "prefix = f(s) = Einsetzen = Wert" – exakt, mit Gegenprobe gegen das Polynom
  function yLine(prefix, fi, ast, P, s) {
    const tq = E.pEvalQ(P, s);
    const root = { val: num(s), fe: E.feQ(s), ast: E.astQ(s), tex: qT(s), exact: true };
    try {
      const v = ST.valueAt(ast, root);
      if (v.exact && isFinite(v.val) && near(v.val, num(tq), 1e-9 * (1 + Math.abs(num(tq))))) return { tex: ST.chainTex(prefix + '=' + fName(fi, 0) + '(' + qT(s) + ')', v), t: tq };
    } catch (e) { /* → direkt */ }
    return { tex: prefix + '=' + fName(fi, 0) + '(' + qT(s) + ')=' + qT(tq), t: tq };
  }

  function vertexDoc(d, fi, ast, P, cl) {
    const a = getP(P, 2), b = getP(P, 1), c = getP(P, 0);
    d.h(header(fi, ast, cl.t === 'normal' ? P : null));
    let s, t;
    if (cl.t === 'vertex') {
      s = cl.s; t = cl.tq;
      d.p('Die Funktion steht in **Scheitelpunktform** $f(x)=a\\cdot(x-x_{S})^{2}+y_{S}$ — der Scheitelpunkt lässt sich direkt ablesen:');
      if (s.n < 0n) d.p('Achtung: $(x+' + qT(E.qAbs(s)) + ')=(x-(' + qT(s) + '))$ — das Vorzeichen in der Klammer ist umgekehrt.');
      d.e('x_{S}=' + qT(s) + '\\quad,\\quad y_{S}=' + qT(t));
    } else if (cl.t === 'roots') {
      const lo = E.qCmp(cl.r1, cl.r2) <= 0 ? cl.r1 : cl.r2, hi = lo === cl.r1 ? cl.r2 : cl.r1;
      s = E.qDiv(E.qAdd(lo, hi), Q2);
      d.p('Die Funktion steht in **Nullstellenform** $f(x)=a\\cdot(x-x_{1})\\cdot(x-x_{2})$. Die Parabel ist symmetrisch — der Scheitelpunkt liegt genau in der Mitte zwischen den Nullstellen:');
      d.e('x_{1}=' + qT(lo) + '\\quad,\\quad x_{2}=' + qT(hi));
      d.e('x_{S}=\\frac{x_{1}+x_{2}}{2}=\\frac{' + qT(lo) + '+' + qP(hi) + '}{2}=' + qT(s));
      const y = yLine('y_{S}', fi, ast, P, s); t = y.t;
      d.p('$y_{S}$ erhält man, indem man $x_{S}$ in die Funktion einsetzt:');
      d.e(y.tex);
    } else {
      d.p('Die Funktion steht in **Normalform** $f(x)=ax^{2}+bx+c$ mit $a=' + qT(a) + ',\\ b=' + qT(b) + ',\\ c=' + qT(c) + '$. Die Scheitelstelle ist:');
      s = E.qDiv(E.qNeg(b), E.qMul(Q2, a));
      const tw = qT(E.qMul(Q2, a)), nb = qT(E.qNeg(b));
      let l = 'x_{S}=-\\frac{b}{2a}=\\frac{-' + qP(b) + '}{2\\cdot ' + qP(a) + '}=\\frac{' + nb + '}{' + tw + '}';
      if (qT(s) !== '\\frac{' + nb + '}{' + tw + '}') l += '=' + qT(s);
      d.e(l);
      const y = yLine('y_{S}', fi, ast, P, s); t = y.t;
      d.p('$y_{S}$ erhält man, indem man $x_{S}$ in die Funktion einsetzt:');
      d.e(y.tex);
    }
    if (cl.t !== 'vertex') {
      d.p('**Scheitelpunktform**:');
      d.e(fName(fi, 0) + '(x)=' + vertexTex(a, s, t));
    }
    d.p(E.qSgn(a) > 0 ? 'Wegen $a=' + qT(a) + '>0$ ist die Parabel nach oben geöffnet — der Scheitelpunkt ist der **Tiefpunkt**.'
                      : 'Wegen $a=' + qT(a) + '<0$ ist die Parabel nach unten geöffnet — der Scheitelpunkt ist der **Hochpunkt**.');
    d.res('Scheitelpunkt: $S' + coord(qT(s), qT(t)) + '$');
    d.meta = { x: num(s), y: num(t) };
  }

  function finishZeros(d, roots, P, exact) {
    const D = E.qSub(E.qMul(getP(P, 1), getP(P, 1)), E.qMul(Q4, E.qMul(getP(P, 2), getP(P, 0))));
    if (!roots.length) d.res('**Keine reelle Nullstelle** — die Parabel schneidet die $x$-Achse nicht.');
    else if (roots.length === 1 || isZ(D)) d.res('Doppelte Nullstelle: $N' + coord(roots[0].tex, '0') + '$');
    else d.res('Alle Nullstellen: $' + ST.listRoots(roots, 'x') + '$');
    if (exact === false) ST.approxNote(d);
  }

  function zerosDoc(d, fi, ast, P, cl) {
    d.h(header(fi, ast, cl.t === 'normal' ? P : null));
    const a = getP(P, 2);
    if (cl.t === 'vertex') {
      const s = cl.s, t = cl.tq, base = baseTex(s);
      d.p('Die Funktion steht in **Scheitelpunktform**. Setze $' + fName(fi, 0) + '(x)=0$ und stelle nach $(x-x_{S})^{2}$ um:');
      d.e(vertexTex(a, s, t) + '=0');
      const pre = eq(a, Q1) ? '' : eq(a, QM1) ? '-' : qT(a) + '\\cdot ';
      if (!isZ(t)) { d.op(subOp(t)); d.e(pre + base + '^{2}=' + qT(E.qNeg(t))); }
      const k = E.qDiv(E.qNeg(t), a);
      if (!eq(a, Q1)) { d.op(':' + qP(a)); d.e(base + '^{2}=' + qT(k)); }
      let roots = [];
      if (E.qSgn(k) < 0) {
        d.p('Ein Quadrat ist nie negativ — die Gleichung hat **keine reelle Lösung**.');
      } else if (isZ(k)) {
        d.op('\\sqrt{\\ }');
        d.e((isZ(s) ? 'x' : 'x' + (s.n < 0n ? '+' : '-') + qT(E.qAbs(s))) + '=0');
        if (!isZ(s)) { d.op(subOp(E.qNeg(s))); d.e('x=' + qT(s)); }
        roots = [S.rootFe(E.feQ(s))];
      } else {
        const sq = S.sqrtTexSimplified(k), sd = E.feSqrtQ(k);
        d.op('\\sqrt{\\ }');
        d.e((isZ(s) ? 'x' : 'x' + (s.n < 0n ? '+' : '-') + qT(E.qAbs(s))) + '=\\pm' + sq.plain + (sq.changed ? '=\\pm' + sq.simp : ''));
        if (!isZ(s)) { d.op(subOp(E.qNeg(s))); d.e('x=' + qT(s) + '\\pm' + (sq.changed ? sq.simp : sq.plain)); }
        const x1 = E.feSub(E.feQ(s), sd), x2 = E.feAdd(E.feQ(s), sd);
        roots = S.sortDedupe([S.rootFe(x1), S.rootFe(x2)]);
      }
      finishZeros(d, roots, P, true);
      d.meta = roots.length ? { x: roots[0].val, y: 0 } : null;
      return;
    }
    d.p(cl.t === 'roots' ? 'Die Funktion steht in **Nullstellenform**. Setze $' + fName(fi, 0) + '(x)=0$:' : 'Nullstellen: Funktionswert $0$ setzen, also $' + fName(fi, 0) + '(x)=0$ lösen.');
    const sub = new Doc();
    const r = S.solveZero(sub, ast, { window: ST.winFor(0) });
    sub.b.forEach(b => d.b.push(b));
    finishZeros(d, r.roots, P, r.exact);
    d.meta = r.roots.length ? { x: r.roots[0].val, y: 0 } : null;
  }

  function buildQuad(kind) {
    const list = quadFuncs();
    if (!list.length) return null;
    const d = new Doc();
    list.forEach(q => {
      const mark = d.b.length;
      try { (kind === 'vertex' ? vertexDoc : zerosDoc)(d, q.fi, q.ast, q.P, q.cl); }
      catch (e) { d.b.length = mark; throw e; }
    });
    return { d, n: list.length, first: list[0].fi };
  }

  // ═══════════════════════════ Karte anzeigen ═══════════════════════════
  const tip = () => ({
    box: document.getElementById('solve-tooltip'),
    title: document.getElementById('solve-tooltip-title'),
    content: document.getElementById('solve-tooltip-content')
  });
  function showCard(kind, fi, titleHtml, bodyHtml) {
    const { box, title, content } = tip();
    if (!box || !title || !content) return false;
    const fn = fi >= 0 ? functions[fi] : null;
    title.innerHTML = titleHtml;
    title.style.color = fn ? (fn.color || '') : '';
    content.innerHTML = bodyHtml;
    window._activeTooltipPt = { fi: fi, kind: kind };
    box.style.display = 'block';
    return true;
  }
  const isActive = kind => {
    const { box } = tip();
    return !!(box && box.style.display !== 'none' && window._activeTooltipPt && window._activeTooltipPt.kind === kind);
  };
  const emptyCard = (kind, titleTxt, msg) =>
    showCard(kind, -1, titleTxt, '<div class="sv"><div class="sv-p">' + esc(msg) + '</div></div>');
  const fsub = fi => 'f<sub>' + (fi + 1) + '</sub>&thinsp;';

  const KINDS = {
    plin: {
      legacy: window.showLoesungsweg, boxId: 'loesungsweg-box',
      build: () => buildLines('lines'),
      title: r => r.n === 1 ? fsub(r.first) + 'Gerade' : 'Geraden'
    },
    pperp: {
      legacy: window.showLoesungsweg, boxId: 'loesungsweg-box',
      build: () => buildLines('perp'),
      title: r => r.n === 1 ? fsub(r.first) + (r.kind === 'bisector' ? 'Mittelsenkrechte' : 'Senkrechte') : 'Senkrechte & Mittelsenkrechte'
    },
    pvertex: {
      legacy: window.showQuadScheitelpunkt, boxId: 'quad-sp-box',
      build: () => buildQuad('vertex'),
      title: r => r.n === 1 ? fsub(r.first) + 'Scheitelpunkt' : 'Scheitelpunkte'
    },
    pzeros: {
      legacy: window.showQuadNullstellen, boxId: 'quad-ns-box',
      build: () => buildQuad('zeros'),
      title: r => r.n === 1 ? fsub(r.first) + 'Nullstellen' : 'Nullstellen'
    }
  };

  // → true wenn die Engine die Karte gezeigt hat; false → alter Kasten
  function render(kind, toggle) {
    const K = KINDS[kind];
    if (toggle && isActive(kind)) { if (typeof hideSolveTooltip === 'function') hideSolveTooltip(); return true; }
    let r = null;
    try { r = K.build(); } catch (e) { if (window.console) console.warn('Lösungsweg-Engine (' + kind + '):', e); return false; }
    if (!r) {
      // keine passende Funktion (oder Engine kann sie nicht): nur dann Hinweis, wenn auch der alte Weg nichts findet
      return false;
    }
    const legacyBox = document.getElementById(K.boxId);
    if (legacyBox) { legacyBox.style.display = ''; legacyBox.innerHTML = ''; }
    return showCard(kind, r.n === 1 ? r.first : -1, K.title(r), ST.renderDoc(r.d));
  }

  const noneMsg = {
    plin: () => (typeof t === 'function' ? t('no_line_yet') : 'Noch keine Gerade vorhanden.'),
    pperp: () => 'Noch keine Senkrechte oder Mittelsenkrechte erstellt.',
    pvertex: () => 'Keine quadratische Funktion vorhanden.',
    pzeros: () => 'Keine quadratische Funktion vorhanden.'
  };
  const noneTitle = { plin: 'Gerade', pperp: 'Senkrechte & Mittelsenkrechte', pvertex: 'Scheitelpunkt', pzeros: 'Nullstellen' };
  function hasCandidates(kind) {
    try {
      const isMeta = fi => typeof perpMeta !== 'undefined' && !!perpMeta[fi];
      if (kind === 'plin') return (functions || []).some((fn, fi) => visible(fn) && !isMeta(fi) && isLinearFunc(fn.expr));
      if (kind === 'pperp') return (functions || []).some((fn, fi) => visible(fn) && isMeta(fi) && isLinearFunc(fn.expr));
      return (functions || []).some(fn => visible(fn) && isQuadraticFunc(fn.expr));
    } catch (e) { return false; }
  }
  function entry(kind, legacyName) {
    return function () {
      if (render(kind, true)) return;
      // Engine ohne Ergebnis: gibt es überhaupt etwas Passendes?
      if (!hasCandidates(kind)) {
        if (isActive(kind)) { hideSolveTooltip(); return; }
        emptyCard(kind, noneTitle[kind], noneMsg[kind]());
        return;
      }
      const lg = KINDS[kind].legacy;
      if (typeof lg === 'function') lg.apply(this, arguments);   // Rückfall: alter Kasten
    };
  }

  // Karte live aktualisieren (nach Änderungen an Punkten/Funktionen)
  window.refreshPanelCard = function (kind) {
    if (kind) { if (isActive(kind)) render(kind, false); return; }
    ['plin', 'pperp', 'pvertex', 'pzeros'].forEach(k => { if (isActive(k)) render(k, false); });
  };

  window.showLoesungsweg = entry('plin');
  window.showPerpLoesungsweg = entry('pperp');
  window.showQuadScheitelpunkt = entry('pvertex');
  window.showQuadNullstellen = entry('pzeros');

  // Senkrechte / Mittelsenkrechte: Karte nach dem Erzeugen auffrischen
  ['linAddPerp', 'linAddBisector'].forEach(name => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      const res = orig.apply(this, arguments);
      try { window.refreshPanelCard('plin'); window.refreshPanelCard('pperp'); } catch (e) { /* ignorieren */ }
      return res;
    };
  });
})();
