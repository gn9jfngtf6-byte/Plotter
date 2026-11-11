// ═════════════════════════════════════════════════════════════════
// MODUL 70b: int_docs — Rechenwege der Integralrechnung (ohne DOM, node-testbar)
//
//   Int.sumDoc(F, a, b)        Ober-/Untersumme mit Summenformeln (Polynome exakt), Grenzwert n → ∞
//   Int.defDoc(F, a, b)        bestimmtes Integral mit der Stammfunktion (Hauptsatz)
//   Int.antiDoc(F)             Stammfunktion Schritt für Schritt mit benannten Regeln
//   Int.hsDoc(F, a, x)         Integralfunktion F_a(x) und Hauptsatz
//   Int.areaDoc(F, G, a, b)    Fläche zwischen f und g (G = null: x-Achse) mit Schnittstellen
//   Int.rotDoc(F, a, b)        Rotationsvolumen um die x-Achse
//
// Ergebnis ist jeweils ein SV.Doc (Blöcke h/p/e/res/note/sub/tab), dargestellt mit ST.renderDoc und für den
// LaTeX-Export mit Dif.docTex in Text umgewandelt.
// ═════════════════════════════════════════════════════════════════
(function () {
  const E = Dif.E, S = Dif.S, { num, bin, neg, call, idn } = S;
  const { tx, txRaw, DOC, fmtT, qOf, hasX, simp, polyAst } = Dif;
  const q0 = E.q0, q1 = E.q1;

  const bt = x => { const q = qOf(x); return q ? E.qTex(q) : fmtT(x, 4); };            // Grenze als Bruch/Zahl (LaTeX)
  const lp = t => '\\left(' + t + '\\right)';
  const polTex = P => E.pTex(P, 'x');
  const feT = fe => E.feTex(fe);
  const feAbsV = fe => (E.feSgn(fe) < 0 ? E.feNeg(fe) : fe);
  const eP = n => bt(n);
  const antiTex = F => { const A = Int.anti(F); if (!A) return null; return F.P ? polTex(F._PI) : tx(A); };
  const xAt = (A, v) => txRaw(calcSubstitute(A, 'x', typeof v === 'number' ? (qOf(v) ? E.astQ(qOf(v)) : num(String(v))) : v));
  // Zahl (Näherung) für Anzeige
  const nv = v => fmtT(v, 4);

  // ───────────────────── Ober- und Untersumme ─────────────────────
  function uTex(c) {                                      // Polynom in u = 1/n → LaTeX
    let out = '';
    c.forEach((q, m) => {
      if (E.qIsZero(q)) return;
      const ng = q.n < 0n, a = E.qAbs(q);
      let body;
      if (m === 0) body = E.qTex(a);
      else body = '\\frac{' + String(a.n) + '}{' + (a.d === 1n ? '' : String(a.d)) + 'n' + (m > 1 ? '^{' + m + '}' : '') + '}';
      out += out === '' ? (ng ? '-' : '') + body : (ng ? '-' : '+') + body;
    });
    return out || '0';
  }
  function sumDoc(F, a, b) {
    const d = DOC(), X = Int.sumExact(F, a, b), at = bt(a), btx = bt(b);
    d.h('Ober- und Untersumme mit $n$ Streifen');
    d.e('f(x)=' + tx(F.ast) + ',\\qquad [a;b]=[' + at + ';' + btx + ']');
    if (!X) {
      d.p('Das Intervall wird in $n$ gleich breite Streifen der Breite $\\Delta x=\\frac{b-a}{n}$ geteilt. Die **Untersumme** nimmt in jedem Streifen den kleinsten, die **Obersumme** den grössten Funktionswert als Höhe des Rechtecks.');
      d.e('U_n=\\sum_{i=1}^{n}m_i\\cdot\\Delta x\\ \\le\\ \\int_{a}^{b}f(x)\\,dx\\ \\le\\ \\sum_{i=1}^{n}M_i\\cdot\\Delta x=O_n');
      const T = Int.sumTable(F, a, b);
      d.b.push({ k: 'tab', head: ['$n$', '$U_n$', '$O_n$', '$O_n-U_n$'], rows: T.rows.map(r => ['$' + r.n + '$', '$' + nv(r.lo) + '$', '$' + nv(r.up) + '$', '$' + nv(r.diff) + '$']) });
      if (isFinite(T.integral.val)) d.res('Für $n\\to\\infty$ streben beide Summen gegen $\\int_{' + at + '}^{' + btx + '}f(x)\\,dx\\approx' + nv(T.integral.val) + '$.');
      else d.note('Hier existiert das Integral nicht (die Funktion ist im Intervall nicht überall definiert).');
      return d;
    }
    const Ltx = E.qTex(X.L), inc = X.inc;
    d.p('**Schritt 1:** Das Intervall wird in $n$ gleich breite Streifen geteilt.');
    { const mid = E.qTex(X.qb) + (E.qIsZero(X.qa) ? '' : '-' + E.qTexP(X.qa)); d.e('\\Delta x=\\frac{b-a}{n}=' + (mid === Ltx ? '' : '\\frac{' + mid + '}{n}=') + '\\frac{' + Ltx + '}{n}'); }
    d.e('x_k=a+k\\cdot\\Delta x=' + E.qTex(X.qa) + '+k\\cdot\\frac{' + Ltx + '}{n}');
    d.p('**Schritt 2:** Auf $[' + at + ';' + btx + ']$ ' + (inc ? 'wächst' : 'fällt') + ' $f$. Darum ist der ' + (inc ? 'rechte' : 'linke') + ' Randpunkt eines Streifens der höchste.');
    d.e(inc ? 'O_n=\\Delta x\\cdot\\left(f(x_1)+f(x_2)+\\dots+f(x_n)\\right)' : 'O_n=\\Delta x\\cdot\\left(f(x_0)+f(x_1)+\\dots+f(x_{n-1})\\right)');
    d.e(inc ? 'U_n=\\Delta x\\cdot\\left(f(x_0)+f(x_1)+\\dots+f(x_{n-1})\\right)' : 'U_n=\\Delta x\\cdot\\left(f(x_1)+f(x_2)+\\dots+f(x_n)\\right)');
    const need = X.g.map((q, i) => (i > 0 && !E.qIsZero(q) ? i : 0)).filter(i => i > 0);
    d.p('**Schritt 3:** $x_k$ einsetzen, ausmultiplizieren' + (need.length ? ' und die Summenformeln verwenden:' : '.'));
    need.forEach(i => d.e(i === 1 ? '\\sum_{k=1}^{n}k=\\frac{n(n+1)}{2}' : i === 2 ? '\\sum_{k=1}^{n}k^{2}=\\frac{n(n+1)(2n+1)}{6}' : '\\sum_{k=1}^{n}k^{3}=\\left(\\frac{n(n+1)}{2}\\right)^{2}'));
    d.e('O_n=' + uTex(X.O));
    d.e('U_n=' + uTex(X.U));
    d.p('**Schritt 4:** Grenzwert für $n\\to\\infty$: Alle Summanden mit $\\frac{1}{n}$ gehen gegen $0$.');
    d.e('\\lim_{n\\to\\infty}O_n=' + E.qTex(X.A0) + ',\\qquad \\lim_{n\\to\\infty}U_n=' + E.qTex(X.A0));
    d.res('$\\int_{' + at + '}^{' + btx + '}f(x)\\,dx=' + E.qTex(X.A0) + '$');
    const A = Int.antiPoly(F);
    if (A) d.note('Kontrolle mit der Stammfunktion: ' + '$F(' + btx + ')-F(' + at + ')=' + E.qTex(E.qSub(E.pEvalQ(A, X.qb), E.pEvalQ(A, X.qa))) + '$.');
    return d;
  }

  // ───────────────────── bestimmtes Integral ─────────────────────
  function defDoc(F, a, b) {
    const d = DOC(), at = bt(a), btx = bt(b), A = Int.anti(F);
    d.h('Bestimmtes Integral mit der Stammfunktion');
    d.e('\\int_{' + at + '}^{' + btx + '}\\left(' + tx(F.ast) + '\\right)dx');
    if (!A) {
      const D = Int.def(F, a, b);
      d.p('Mit den Grundregeln (Potenz-, Summen-, Konstantenregel) findet das Programm hier keine Stammfunktion: Dafür bräuchte es partielle Integration oder Substitution, bei manchen Funktionen gibt es gar keine geschlossene Form. Das Integral wird numerisch berechnet.');
      if (isFinite(D.val)) d.res('$\\int_{' + at + '}^{' + btx + '}f(x)\\,dx\\approx' + nv(D.val) + '$');
      return d;
    }
    d.p('**Schritt 1:** Stammfunktion bestimmen.');
    d.e('F(x)=' + antiTex(F));
    d.p('**Schritt 2:** Hauptsatz: Obere Grenze einsetzen, untere Grenze einsetzen, subtrahieren.');
    d.e('\\int_{' + at + '}^{' + btx + '}f(x)\\,dx=\\Big[F(x)\\Big]_{' + at + '}^{' + btx + '}=F(' + btx + ')-F(' + at + ')');
    const D = Int.def(F, a, b);
    const fa = S.evalNum(A, a), fb = S.evalNum(A, b);
    if (D.q) {
      const Pp = Int.antiPoly(F), qa = qOf(a), qb = qOf(b), va = E.pEvalQ(Pp, qa), vb = E.pEvalQ(Pp, qb);
      d.e('F(' + btx + ')=' + xAt(polyAst(Pp), E.astQ(qb)) + '=' + E.qTex(vb));
      d.e('F(' + at + ')=' + xAt(polyAst(Pp), E.astQ(qa)) + '=' + E.qTex(va));
      d.e('F(' + btx + ')-F(' + at + ')=' + E.qTex(vb) + '-' + E.qTexP(va) + '=' + E.qTex(D.q));
      d.res('$\\int_{' + at + '}^{' + btx + '}f(x)\\,dx=' + E.qTex(D.q) + (D.q.d === 1n ? '' : '\\approx' + nv(D.val)) + '$');
    } else {
      d.e('F(' + btx + ')\\approx' + nv(fb) + ',\\qquad F(' + at + ')\\approx' + nv(fa));
      d.res('$\\int_{' + at + '}^{' + btx + '}f(x)\\,dx\\approx' + nv(D.val) + '$');
    }
    return d;
  }

  // ───────────────────── Stammfunktion mit Regeln ─────────────────────
  const RULES = {
    const: ['Konstantenregel', '\\int c\\,dx=c\\cdot x+C'],
    power: ['Potenzregel', '\\int x^{n}\\,dx=\\frac{x^{n+1}}{n+1}+C\\quad(n\\neq-1)'],
    factor: ['Faktorregel', '\\int c\\cdot f(x)\\,dx=c\\cdot\\int f(x)\\,dx'],
    sum: ['Summenregel', '\\int\\left(f(x)\\pm g(x)\\right)dx=\\int f(x)\\,dx\\pm\\int g(x)\\,dx'],
    ln: ['Stammfunktion von 1/x', '\\int\\frac{1}{x}\\,dx=\\ln|x|+C'],
    exp: ['Stammfunktion von e hoch x', '\\int e^{x}\\,dx=e^{x}+C'],
    expa: ['Stammfunktion von a hoch x', '\\int a^{x}\\,dx=\\frac{a^{x}}{\\ln a}+C'],
    sin: ['Stammfunktion von Sinus', '\\int\\sin x\\,dx=-\\cos x+C'],
    cos: ['Stammfunktion von Kosinus', '\\int\\cos x\\,dx=\\sin x+C'],
    lin: ['Lineare Substitution', '\\int g(mx+k)\\,dx=\\frac{1}{m}\\,G(mx+k)+C'],
    other: ['Partielle Integration oder Substitution', '']
  };
  const isX = n => n.type === 'id' && n.v === 'x';
  const antiRaw = n => { try { const r = calcAntiderivRaw(calcDesugar(n), 'x'); return r ? calcSimplify(r) : null; } catch (e) { return null; } };
  function flatSum(n, s, out) {
    if (n.type === 'add') { flatSum(n.a, s, out); flatSum(n.b, s, out); }
    else if (n.type === 'sub') { flatSum(n.a, s, out); flatSum(n.b, -s, out); }
    else out.push({ s, n });
    return out;
  }
  function factorSplit(n) {
    if (n.type === 'neg' && hasX(n.x)) return { c: num(-1), g: n.x, neg: true };
    if (n.type === 'mul') {
      if (!hasX(n.a) && hasX(n.b)) return { c: n.a, g: n.b };
      if (hasX(n.a) && !hasX(n.b)) return { c: n.b, g: n.a };
    }
    if (n.type === 'div' && !hasX(n.b) && hasX(n.a)) return { c: bin('div', num(1), n.b), g: n.a, den: n.b };
    return null;
  }
  function linInner(u) { try { const l = calcIsLinear(u, 'x'); return l && !isX(u) ? l : null; } catch (e) { return null; } }
  // Regelname einer Grundform (ohne konstanten Faktor)
  function classify(g) {
    if (!hasX(g)) return 'const';
    if (isX(g)) return 'power';
    if (g.type === 'pow' && isX(g.a) && !hasX(g.b)) { const e = E.exactQ(g.b); return e && E.qEq(e, E.qNeg(q1)) ? 'ln' : 'power'; }
    if (g.type === 'div' && !hasX(g.a)) { if (isX(g.b)) return 'ln'; if (g.b.type === 'pow' && isX(g.b.a)) return 'power'; if (linInner(g.b)) return 'lin'; }
    if (g.type === 'pow' && !hasX(g.a) && isX(g.b)) return g.a.type === 'id' && g.a.v === 'EC' ? 'exp' : 'expa';
    if (g.type === 'call' && g.args.length === 1) {
      const u = g.args[0];
      if (isX(u)) return g.name === 'sin' ? 'sin' : g.name === 'cos' ? 'cos' : g.name === 'exp' ? 'exp' : g.name === 'sqrt' ? 'power' : g.name === 'log' ? 'other' : 'other';
      if (linInner(u)) return 'lin';
    }
    if (g.type === 'pow' && linInner(g.a) && !hasX(g.b)) return 'lin';
    return 'other';
  }
  const names = ks => ks.filter((k, i) => ks.indexOf(k) === i).map(k => RULES[k][0]).join(' und ');

  function antiDoc(F) {
    const d = DOC(), ast = F.ast, used = new Set(), body = DOC();
    d.h('Die Funktion'); d.e('f(x)=' + tx(ast));
    const total = Int.anti(F);
    // Polynome zuerst ausmultiplizieren
    let work = ast;
    if (F.P && !Dif.isExpanded(ast)) { work = polyAst(F.P); body.e('f(x)=' + tx(ast) + '=' + polTex(F.P), 'Ausmultiplizieren'); }
    const terms = flatSum(work, 1, []);
    const sg = (t, i) => (i === 0 ? (t.s < 0 ? '-' : '') : (t.s < 0 ? '-' : '+'));
    if (terms.length > 1) { used.add('sum'); body.e('\\int f(x)\\,dx=' + terms.map((t, i) => sg(t, i) + '\\int ' + lp(tx(t.n)) + '\\,dx').join(''), 'Summenregel'); }
    let allOk = true; const parts = [];
    terms.forEach(t => {
      const n = t.n, sp = factorSplit(n), g = sp ? sp.g : n, c = sp ? sp.c : null;
      const key = classify(g), Ag = antiRaw(g);
      if (!Ag || key === 'other') { allOk = false; parts.push(null); return; }
      used.add(key); if (sp) used.add('factor');
      const full = simp(c ? (sp.den ? bin('div', Ag, sp.den) : bin('mul', c, Ag)) : Ag);
      const ct = !sp ? '' : sp.neg ? '-' : sp.den ? '' : txRaw(simp(c)) + '\\cdot ';
      let chain;
      if (!sp) chain = '\\int ' + tx(n) + '\\,dx=' + tx(Ag);
      else if (sp.den) chain = '\\int \\frac{' + tx(g) + '}{' + txRaw(sp.den) + '}\\,dx=\\frac{1}{' + txRaw(sp.den) + '}\\cdot\\int ' + tx(g) + '\\,dx=\\frac{' + tx(Ag) + '}{' + txRaw(sp.den) + '}=' + tx(full);
      else chain = '\\int ' + tx(n) + '\\,dx=' + ct + '\\int ' + tx(g) + '\\,dx=' + ct + (/[+\-]/.test(tx(Ag).replace(/^-/, '')) ? lp(tx(Ag)) : tx(Ag)) + '=' + tx(full);
      body.e(chain, names(sp ? ['factor', key] : [key]));
      parts.push({ t, full });
    });
    if (!allOk) {
      if (!total) { d.p('Mit den Grundregeln (Potenz-, Summen-, Konstantenregel) findet das Programm hier keine Stammfunktion: Dafür bräuchte es partielle Integration oder Substitution (siehe die Ansichten dazu); bei manchen Funktionen wie $e^{-x^{2}}$ gibt es gar keine geschlossene Form. Das bestimmte Integral wird numerisch berechnet.'); return d; }
      used.add('other');
      body.e('\\int f(x)\\,dx=' + tx(total), names(['other']));
    }
    d.h('Verwendete Regeln');
    ['const', 'power', 'factor', 'sum', 'ln', 'exp', 'expa', 'sin', 'cos', 'lin', 'other'].filter(k => used.has(k)).forEach(k => d.p('**' + RULES[k][0] + ':**' + (RULES[k][1] ? ' $' + RULES[k][1] + '$' : '')));
    d.h('Rechnung');
    body.b.forEach(b => d.b.push(b));
    const fin = total ? tx(total) : '';
    d.res('$F(x)=' + fin + '+C$');
    // Probe durch Ableiten
    try {
      const dd = calcDiffOwn(total, 'x');
      if (tx(dd).replace(/\s/g, '') === tx(ast).replace(/\s/g, '')) d.e("F'(x)=" + tx(dd) + '=f(x)', 'Probe durch Ableiten');
      else if (Int.derivOk(total, F.f(0))) d.p('Probe: Leitet man $F(x)$ ab, erhält man wieder $f(x)$.');
    } catch (e) { /* keine Probe */ }
    return d;
  }

  // ───────────────────── Integralfunktion und Hauptsatz ─────────────────────
  function hsDoc(F, a, x) {
    const d = DOC(), at = bt(a), xt = bt(x), A = Int.anti(F);
    d.h('Integralfunktion und Hauptsatz');
    d.p('Die **Integralfunktion** sammelt die Fläche zwischen $f$ und der $x$-Achse ab der festen Stelle $a=' + at + '$. Oberhalb der Achse wächst sie, unterhalb nimmt sie ab.');
    d.e('F_a(x)=\\int_{' + at + '}^{x}f(t)\\,dt');
    if (!A) { d.note('Mit den Grundregeln findet das Programm hier keine Stammfunktion (partielle Integration oder Substitution nötig, oder es gibt keine geschlossene Form); die Integralfunktion wird numerisch berechnet.'); return d; }
    d.p('**Schritt 1:** Eine Stammfunktion $G$ von $f$ bestimmen.');
    d.e('G(x)=' + antiTex(F));
    d.p('**Schritt 2:** Hauptsatz der Differential- und Integralrechnung.');
    d.e('F_a(x)=\\Big[G(t)\\Big]_{' + at + '}^{x}=G(x)-G(' + at + ')');
    const qa = qOf(a);
    if (F.P && qa) {
      const ga = E.pEvalQ(F._PI, qa), P2 = E.pSub(F._PI, E.pConst ? E.pConst(ga) : [ga]);
      if (E.qIsZero(ga)) d.e('F_a(x)=' + polTex(F._PI));
      else d.e('F_a(x)=' + polTex(F._PI) + (ga.n < 0n ? '+' : '-') + E.qTex(E.qAbs(ga)) + '=' + polTex(P2));
    }
    const Dv = Int.def(F, a, x);
    if (isFinite(Dv.val)) d.e('F_a(' + xt + ')=' + (Dv.q ? E.qTex(Dv.q) + (Dv.q.d === 1n ? '' : '\\approx' + nv(Dv.val)) : '\\approx' + nv(Dv.val)));
    d.p('**Schritt 3:** Ableiten der Integralfunktion gibt die Funktion zurück:');
    d.e("F_a'(x)=G'(x)=f(x)");
    const fx = F.f(0)(x);
    if (isFinite(fx)) d.res("Die Steigung von $F_a$ an der Stelle $x=" + xt + '$ ist $f(' + xt + ')=' + nv(fx) + '$.');
    return d;
  }

  // ───────────────────── Fläche zwischen Kurven ─────────────────────
  function areaDoc(F, G, a, b) {
    const d = DOC(), R = Int.areas(F, G, a, b), at = bt(R.a), btx = bt(R.b);
    d.h(G ? 'Fläche zwischen $f$ und $g$' : 'Fläche zwischen $f$ und der $x$-Achse');
    d.e('f(x)=' + tx(F.ast) + (G ? ',\\qquad g(x)=' + tx(G.ast) : '') + ',\\qquad [' + at + ';' + btx + ']');
    const inner = R.pts.slice(1, -1);
    d.p('**Schritt 1:** ' + (G ? 'Schnittstellen von $f$ und $g$ im Intervall suchen ($f(x)=g(x)$).' : 'Nullstellen von $f$ im Intervall suchen ($f(x)=0$).'));
    if (R.H && G) d.e('h(x)=f(x)-g(x)=' + polTex(R.H));
    if (!inner.length) d.p('Im Inneren des Intervalls gibt es keine ' + (G ? 'Schnittstelle' : 'Nullstelle') + ', also wechselt das Vorzeichen nicht.');
    else inner.forEach((p, i) => d.e('x_{' + (i + 1) + '}=' + (p.tex || nv(p.x))));
    d.p('**Schritt 2:** Das Intervall an diesen Stellen teilen und jedes Stück einzeln integrieren. Unterhalb der Achse (bzw. von $g$) ist das Integral negativ, die Fläche ist sein Betrag.');
    const PH = R.H ? Int.pInt(R.H) : (!G && F.P ? Int.pInt(E.pTrim(F.P)) : null);
    let exact = !!PH, tot = null;
    const rows = [], lines = [];
    R.parts.forEach((p, i) => {
      const ends = [p.p0, p.p1].map((e, k) => e.fe || (qOf(k ? p.x1 : p.x0) ? E.feQ(qOf(k ? p.x1 : p.x0)) : null));
      let v = null;
      if (PH && ends[0] && ends[1]) { const v1 = E.pEvalFe(PH, ends[1]), v0 = E.pEvalFe(PH, ends[0]); if (v1 && v0) v = E.feSub(v1, v0); }
      const x0t = R.pts[i].tex || (qOf(p.x0) ? E.qTex(qOf(p.x0)) : nv(p.x0)), x1t = R.pts[i + 1].tex || (qOf(p.x1) ? E.qTex(qOf(p.x1)) : nv(p.x1));
      if (v) {
        const av = feAbsV(v); tot = tot ? E.feAdd(tot, av) : av; if (!tot) exact = false;
        rows.push(['$[' + x0t + ';' + x1t + ']$', '$' + feT(v) + '$', '$' + feT(av) + '$']);
        lines.push('A_{' + (i + 1) + '}=\\left|\\int_{' + x0t + '}^{' + x1t + '}h(x)\\,dx\\right|=\\left|' + feT(v) + '\\right|=' + feT(av));
      } else {
        exact = false;
        rows.push(['$[' + x0t + ';' + x1t + ']$', '$' + nv(p.val) + '$', '$' + nv(p.area) + '$']);
        lines.push('A_{' + (i + 1) + '}=\\left|\\int_{' + x0t + '}^{' + x1t + '}h(x)\\,dx\\right|\\approx' + nv(p.area));
      }
    });
    if (PH) d.e('H(x)=' + polTex(PH), 'Stammfunktion von ' + (G ? 'h' : 'f'));
    d.b.push({ k: 'tab', head: ['Intervall', '$\\int h\\,dx$', 'Fläche'], rows });
    if (R.parts.length > 1 || lines.length) d.p('**Schritt 3:** Die Teilflächen addieren.');
    lines.forEach(l => d.e(l));
    if (R.parts.length > 1) d.e('A=' + R.parts.map((p, i) => 'A_{' + (i + 1) + '}').join('+') + (exact && tot ? '=' + feT(tot) : '\\approx' + nv(R.total)));
    d.res('$A=' + (exact && tot ? feT(tot) + (E.feIsRat(tot) && tot.p.d === 1n ? '' : '\\approx' + nv(R.total)) : '\\approx' + nv(R.total)) + '$');
    d.note('Das Integral ohne Betrag würde die Teilflächen mit ihrem Vorzeichen verrechnen: ' + (isFinite(R.parts.reduce((s, p) => s + p.val, 0)) ? '$' + nv(R.parts.reduce((s, p) => s + p.val, 0)) + '$.' : ''));
    return d;
  }

  // ───────────────────── Rotationskörper ─────────────────────
  function rotDoc(F, a, b) {
    if (!(b > a)) { const t = a; a = b; b = t; }
    const d = DOC(), at = bt(a), btx = bt(b), P = F.P ? E.pTrim(F.P) : null;
    d.h('Rotationskörper um die $x$-Achse');
    d.p('Dreht man den Graphen von $f$ zwischen $a$ und $b$ um die $x$-Achse, entsteht ein Körper aus lauter dünnen Kreisscheiben mit dem Radius $f(x)$ und der Dicke $dx$. Jede Scheibe hat das Volumen $\\pi\\cdot f(x)^{2}\\,dx$.');
    d.e('V=\\pi\\int_{' + at + '}^{' + btx + '}\\left(f(x)\\right)^{2}dx');
    d.e('f(x)=' + tx(F.ast));
    const qa = qOf(a), qb = qOf(b);
    let Pf = P;
    if (!Pf) { try { const sq = calcSimplify({ type: 'pow', a: F.ast, b: num(2) }); Pf = null; const p2 = E.polyFromAst(sq, 'x'); if (p2) { F._sq = E.pTrim(p2); } } catch (e) { /* kein Polynom */ } }
    if ((Pf || F._sq) && qa && qb) {
      const P2 = Pf ? E.pMul(Pf, Pf) : F._sq, PI = Int.pInt(P2), vb = E.pEvalQ(PI, qb), va = E.pEvalQ(PI, qa), D = E.qSub(vb, va);
      d.p('**Schritt 1:** $f(x)$ quadrieren.');
      d.e('\\left(f(x)\\right)^{2}=' + (Pf ? '\\left(' + tx(F.ast) + '\\right)^{2}=' : '') + polTex(P2));
      d.p('**Schritt 2:** Stammfunktion von $f(x)^{2}$ bestimmen.');
      d.e('H(x)=' + polTex(PI));
      d.p('**Schritt 3:** Grenzen einsetzen.');
      d.e('V=\\pi\\cdot\\Big[H(x)\\Big]_{' + at + '}^{' + btx + '}=\\pi\\cdot\\left(' + E.qTex(vb) + '-' + E.qTexP(va) + '\\right)=\\pi\\cdot' + E.qTexP(D));
      d.res('$V=' + (E.qEq(D, q1) ? '\\pi' : E.qTex(D) + '\\,\\pi') + '\\approx' + nv(Math.PI * E.qNum(D)) + '$');
      return d;
    }
    const V = Int.volume(F, a, b);
    d.p('Das Integral von $f(x)^{2}$ wird hier numerisch berechnet.');
    if (isFinite(V)) d.res('$V\\approx' + nv(V) + '$'); else d.note('Die Funktion ist im Intervall nicht überall definiert.');
    return d;
  }

  // ───────────────────── Partielle Integration (mit Bild) ─────────────────────
  // U, V: Funktionen (Dif.makeFn) für u(x) und v(x); gesucht ∫ u·v′ dx auf [a; b]. pre (optional): {G, Gop} Stammfunktion
  // von u′·v als Rohausdruck, falls die Regeln sie nicht finden (z.B. nochmals partiell integrieren oder Substitution).
  function simpson(f, a, b, n) { n = n || 400; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }
  function piNums(U, V, a, b) {
    const u = U.f(0), v = V.f(0), u1 = U.f(1), v1 = V.f(1);
    const I1 = simpson(x => u(x) * v1(x), a, b), I2 = simpson(x => v(x) * u1(x), a, b);
    return { ua: u(a), ub: u(b), va: v(a), vb: v(b), I1, I2 };
  }
  function piDoc(U, V, a, b, pre) {
    const d = DOC(), bnd = x => (Math.abs(x - Math.E) < 1e-9 ? 'e' : bt(x)), A = bnd(a), B = bnd(b);
    const u1 = U.deriv(1), v1 = V.deriv(1), N = piNums(U, V, a, b), par = t => (/^-/.test(t) ? lp(t) : t);
    const eqv = v => (Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-7 ? '=' : '\\approx ');        // «=» nur, wenn die Zahl nicht gerundet ist
    const ut = tx(U.ast), vt = tx(V.ast), u1t = u1 ? tx(u1) : '?', v1t = v1 ? tx(v1) : '?';
    const prodT = v1 ? tx(simp(bin('mul', U.ast, v1))) : par(ut) + '\\cdot ' + par(v1t);
    d.h('Partielle Integration');
    d.p('**Regel:** Aus der Produktregel $(u\\cdot v)\'=u\'\\cdot v+u\\cdot v\'$ folgt durch Integrieren von $a$ bis $b$:');
    d.e('\\int_a^b u(x)\\,v\'(x)\\,dx=\\Big[u(x)\\cdot v(x)\\Big]_a^b-\\int_a^b u\'(x)\\,v(x)\\,dx');
    d.p('**Im Bild:** Die Kurve mit den Punkten $(u(x)\\,|\\,v(x))$ läuft von $x=a$ bis $x=b$. Die blaue Fläche zwischen Kurve und $v$-Achse ist $\\int u\\,dv=\\int_a^b u\\,v\'\\,dx$, die grüne Fläche zwischen Kurve und $u$-Achse ist $\\int v\\,du=\\int_a^b v\\,u\'\\,dx$. Zusammen füllen sie das grosse Rechteck $u(b)\\cdot v(b)$ ohne das kleine Rechteck $u(a)\\cdot v(a)$:');
    d.e('\\int u\\,dv+\\int v\\,du=u(b)\\,v(b)-u(a)\\,v(a)');
    d.e(nv(N.I1) + '+' + par(nv(N.I2)) + '\\approx ' + nv(N.ub * N.vb) + '-' + par(nv(N.ua * N.va)));
    const mono = (() => { const u = U.f(0), v = V.f(0); let pu = u(a), pv = v(a), ok = pu >= -1e-12 && pv >= -1e-12; for (let i = 1; i <= 60 && ok; i++) { const x = a + (b - a) * i / 60, cu = u(x), cv = v(x); if (!(cu >= pu - 1e-12 && cv >= pv - 1e-12 && cu >= -1e-12 && cv >= -1e-12)) ok = false; pu = cu; pv = cv; } return ok; })();
    if (!mono) d.note('Hier sind $u$ oder $v$ nicht durchgehend positiv und wachsend: Die Flächen zählen dann mit Vorzeichen (oder überdecken sich), die Gleichung gilt trotzdem.');
    d.p('**Zuordnung:** Den Faktor, der beim Ableiten einfacher wird, nimmt man als $u$; vom anderen Faktor $v\'$ braucht man eine Stammfunktion $v$.');
    d.e('u(x)=' + ut + ',\\qquad v\'(x)=' + v1t);
    d.e('u\'(x)=' + u1t + ',\\qquad v(x)=' + vt);
    d.p('**Einsetzen:**');
    const rest = u1 ? simp(bin('mul', u1, V.ast)) : null, restT = rest ? tx(rest) : par(u1t) + '\\cdot ' + par(vt);
    d.e('\\int_{' + A + '}^{' + B + '}' + prodT + '\\,dx=\\Big[' + tx(simp(bin('mul', U.ast, V.ast))) + '\\Big]_{' + A + '}^{' + B + '}-\\int_{' + A + '}^{' + B + '}' + restT + '\\,dx');
    const bd = N.ub * N.vb - N.ua * N.va;
    d.p('**Randterm:**');
    d.e('\\Big[u\\cdot v\\Big]_{' + A + '}^{' + B + '}=' + nv(N.ub * N.vb) + '-' + par(nv(N.ua * N.va)) + eqv(bd) + nv(bd));
    // übriges Integral ∫ u′·v dx: mit den Regeln, sonst mit der mitgelieferten Stammfunktion, sonst numerisch
    let Gast = null, Gop = '';
    try { const W = rest ? Dif.makeFn(miToRaw(rest, 0)) : null; if (W) { const Ga = Int.anti(W); if (Ga) { Gast = W.P ? polyAst(W._PI) : Ga; Gop = 'Stammfunktion'; } } } catch (e) { Gast = null; }
    if (!Gast && pre && pre.G) { const GF = Dif.makeFn(pre.G); if (GF) { Gast = GF.ast; Gop = pre.Gop || 'Stammfunktion'; } }
    let I2 = N.I2;
    d.p('**Übriges Integral:**');
    if (Gast) {
      const g = x => S.evalNum(Gast, x), val = g(b) - g(a);
      if (isFinite(val) && Math.abs(val - N.I2) < 1e-5 * Math.max(1, Math.abs(N.I2))) {
        I2 = val;
        d.e('\\int ' + restT + '\\,dx=' + tx(Gast) + '+C', Gop);
        d.e('\\int_{' + A + '}^{' + B + '}' + restT + '\\,dx=\\Big[' + tx(Gast) + '\\Big]_{' + A + '}^{' + B + '}=' + nv(g(b)) + '-' + par(nv(g(a))) + eqv(val) + nv(val));
      } else Gast = null;
    }
    if (!Gast) {
      d.e('\\int_{' + A + '}^{' + B + '}' + restT + '\\,dx\\approx ' + nv(N.I2));
      d.note('Dieses Integral lässt sich hier nicht direkt mit den Grundregeln lösen; es wird numerisch berechnet. Oft hilft es, nochmals partiell zu integrieren.');
    }
    const I = bd - I2;
    d.e('\\int_{' + A + '}^{' + B + '}' + prodT + '\\,dx=' + nv(bd) + '-' + par(nv(I2)) + eqv(I) + nv(I));
    d.res('$\\int_{' + A + '}^{' + B + '}' + prodT + '\\,dx' + eqv(I) + nv(I) + '$ (blaue Fläche)');
    return d;
  }

  // ───────────────────── Substitution (mit Streifen-Bild) ─────────────────────
  // Fo: äussere Funktion f (in der Variablen x gespeichert, angezeigt mit u), G: innere Funktion g(x).
  // subFn(Fo, G) → Funktion des Integranden f(g(x))·g′(x) (Dif.makeFn) oder null
  function subAst(Fo, G) { const g1 = G.deriv(1); if (!g1) return null; return bin('mul', calcSubstitute(Fo.ast, 'x', G.ast), g1); }
  function subFn(Fo, G) { try { const A = subAst(Fo, G); return A ? Dif.makeFn(miToRaw(A, 0)) : null; } catch (e) { return null; } }
  const uTx = A => { try { return tx(calcSubstitute(A, 'x', idn('u'))); } catch (e) { return tx(A); } };
  function subDoc(Fo, G, a, b) {
    const d = DOC(), f = Fo.f(0), g = G.f(0), g1 = G.deriv(1), ga = g(a), gb = g(b);
    const bnd = x => (Math.abs(x - Math.E) < 1e-9 ? 'e' : bt(x)), A = bnd(a), B = bnd(b);
    const gB = (x, v) => {                                  // u-Grenze: Bruch, sonst g(x) symbolisch (z.B. ln(4)), sonst Näherung
      if (Math.abs(v - Math.E) < 1e-9) return 'e';
      const q = qOf(v); if (q && q.d <= 1000n) return E.qTex(q);
      try { const qx = qOf(x), t = tx(simp(calcSubstitute(G.ast, 'x', qx ? E.astQ(qx) : num(String(x))))); if (t && !/NaN|undefined/.test(t)) return t; } catch (e) { /* Näherung */ }
      return nv(v);
    };
    const GA = gB(a, ga), GB = gB(b, gb);
    const eqv = v => (Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-7 ? '=' : '\\approx ');
    const par = t => (/^-/.test(t) ? lp(t) : t);
    const In = subAst(Fo, G), inT = In ? tx(simp(In)) : '?', fT = uTx(Fo.ast), gT = tx(G.ast), g1T = g1 ? tx(g1) : '?';
    const fOfg = tx(calcSubstitute(Fo.ast, 'x', G.ast));
    const IF = subFn(Fo, G), Ix = IF ? simpson(IF.f(0), a, b, 600) : NaN, Iu = simpson(f, ga, gb, 600);
    d.h('Substitution');
    d.p('**Regel:** Steht im Integranden eine Verkettung $f(g(x))$ zusammen mit der inneren Ableitung $g\'(x)$, so ersetzt man $u=g(x)$:');
    d.e('\\int_a^b f\\big(g(x)\\big)\\cdot g\'(x)\\,dx=\\int_{g(a)}^{g(b)} f(u)\\,du');
    d.p('**Im Bild:** Links ist die Fläche unter $f(g(x))\\cdot g\'(x)$ in gleich breite Streifen der Breite $\\Delta x$ geteilt. Die Abbildung $u=g(x)$ in der Mitte bringt jeden Streifen nach rechts unter den Graphen von $f$. Dort ist er $g\'(x)$-mal so breit, aber nur $f(u)$ hoch statt $f(g(x))\\cdot g\'(x)$. Die Fläche bleibt gleich. Mit dem Regler «Verformung» sieht man den Übergang fliessend: Jeder Streifen wird $g\'(x)$-mal so breit und dafür $g\'(x)$-mal so niedrig.');
    d.e('\\Delta u\\approx g\'(x)\\cdot\\Delta x\\quad\\Rightarrow\\quad f\\big(g(x)\\big)\\cdot g\'(x)\\cdot\\Delta x\\approx f(u)\\cdot\\Delta u');
    d.p('**Substitution:**');
    d.e('u=g(x)=' + gT + ',\\qquad \\frac{du}{dx}=g\'(x)=' + g1T + '\\quad\\Rightarrow\\quad du=' + par(g1T) + '\\,dx');
    d.e('\\int_{' + A + '}^{' + B + '}' + inT + '\\,dx=\\int_{' + A + '}^{' + B + '}' + fOfg.replace(/^/, '') + '\\cdot ' + par(g1T) + '\\,dx');
    d.p('**Grenzen umrechnen:**');
    d.e('x=' + A + '\\ \\Rightarrow\\ u=g(' + A + ')' + eqv(ga) + nv(ga) + ',\\qquad x=' + B + '\\ \\Rightarrow\\ u=g(' + B + ')' + eqv(gb) + nv(gb));
    d.e('\\int_{' + A + '}^{' + B + '}' + inT + '\\,dx=\\int_{' + GA + '}^{' + GB + '}' + fT + '\\,du');
    d.p('**Integrieren:**');
    let val = Iu, exact = false;
    try {
      const Fa = Int.anti(Fo);
      if (Fa) {
        const Fast = Fo.P ? polyAst(Fo._PI) : Fa, Fu = x => S.evalNum(Fast, x), v2 = Fu(gb) - Fu(ga);
        if (isFinite(v2) && Math.abs(v2 - Iu) < 1e-5 * Math.max(1, Math.abs(Iu))) {
          val = v2; exact = true;
          const FT = uTx(Fast).replace(/^([^+\-]+?)\\cdot \\frac\{1\}\{(\d+)\}$/, '\\frac{$1}{$2}');
          d.e('\\int ' + fT + '\\,du=' + FT + '+C', 'Stammfunktion');
          d.e('\\int_{' + GA + '}^{' + GB + '}' + fT + '\\,du=\\Big[' + FT + '\\Big]_{' + GA + '}^{' + GB + '}=' + nv(Fu(gb)) + '-' + par(nv(Fu(ga))) + eqv(v2) + nv(v2));
        }
      }
    } catch (e) { exact = false; }
    if (!exact) { d.e('\\int_{' + GA + '}^{' + GB + '}' + fT + '\\,du\\approx ' + nv(Iu)); d.note('Für $f$ gibt es hier keine Stammfunktion mit den Grundregeln; der Wert wird numerisch berechnet.'); }
    if (isFinite(Ix)) d.e('\\text{Probe: Fläche links}\\approx ' + nv(Ix) + ',\\qquad\\text{Fläche rechts}\\approx ' + nv(Iu));
    if (gb < ga) d.note('Hier ist $g(b)<g(a)$: Die Grenzen rechts sind vertauscht, die Streifen werden dabei gespiegelt (Fläche mit Vorzeichen).');
    d.res('$\\int_{' + A + '}^{' + B + '}' + inT + '\\,dx' + eqv(val) + nv(val) + '$');
    return d;
  }

  Object.assign(Int, { sumDoc, defDoc, antiDoc, hsDoc, areaDoc, rotDoc, piDoc, piNums, subDoc, subFn, INT_RULES: RULES });
})();
