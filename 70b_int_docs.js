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
      d.p('Für diese Funktion gibt es keine Stammfunktion in einfacher Form. Das Integral wird numerisch berechnet.');
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
      if (!total) { d.p('Für diese Funktion gibt es keine Stammfunktion in einfacher Form (z. B. $e^{-x^{2}}$ oder $\\frac{\\sin x}{x}$). Das bestimmte Integral wird numerisch berechnet.'); return d; }
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
    if (!A) { d.note('Für diese Funktion gibt es keine Stammfunktion in einfacher Form; die Integralfunktion wird numerisch berechnet.'); return d; }
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

  Object.assign(Int, { sumDoc, defDoc, antiDoc, hsDoc, areaDoc, rotDoc, INT_RULES: RULES });
})();
