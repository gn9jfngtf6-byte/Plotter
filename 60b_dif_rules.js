// ═════════════════════════════════════════════════════════════════
// MODUL 60b: dif_rules — Rechenwege der Differentialrechnung (ohne DOM, node-testbar)
//
//   Dif.hMethodDoc(F, x0|null)   h-Methode: an der Stelle x0 (Zahl) oder an einer beliebigen Stelle x (null)
//   Dif.rulesDoc(F)              Ableiten mit benannten Regeln, Schritt für Schritt
//   Dif.tangentDoc(F, x0)        Tangente und Normale
//
// Ergebnis ist jeweils ein SV.Doc (Blöcke h/p/e/res/note/sub) — wird in der Oberfläche mit ST.renderDoc
// dargestellt und für den LaTeX-Export in Text umgewandelt (Dif.docTex).
// ═════════════════════════════════════════════════════════════════
(function () {
  const E = Dif.E, S = Dif.S, { num, bin, neg, call, idn } = S;
  const { tx, txP, txRaw, tex, T, simp, hasX, DOC, polyAst, fmt, fmtT, qOf } = Dif;
  const q0 = E.q0, q1 = E.q1;

  // ───────────────────── Ableitungsregeln (Namen und Formeln) ─────────────────────
  const RULES = {
    const: ['Konstantenregel', "(c)'=0"],
    power: ['Potenzregel', "(x^{n})'=n\\cdot x^{n-1}"],
    factor: ['Faktorregel', "(c\\cdot f)'=c\\cdot f'"],
    sum: ['Summenregel', "(f\\pm g)'=f'\\pm g'"],
    prod: ['Produktregel', "(u\\cdot v)'=u'\\cdot v+u\\cdot v'"],
    quot: ['Quotientenregel', "\\left(\\frac{u}{v}\\right)'=\\frac{u'\\cdot v-u\\cdot v'}{v^{2}}"],
    chain: ['Kettenregel', "\\left(g(u(x))\\right)'=g'(u(x))\\cdot u'(x)"],
    sin: ['Ableitung von Sinus', "(\\sin x)'=\\cos x"],
    cos: ['Ableitung von Kosinus', "(\\cos x)'=-\\sin x"],
    tan: ['Ableitung von Tangens', "(\\tan x)'=\\frac{1}{\\cos^{2}x}"],
    exp: ['Ableitung von e hoch x', "(e^{x})'=e^{x}"],
    expa: ['Ableitung von a hoch x', "(a^{x})'=a^{x}\\cdot\\ln a"],
    ln: ['Ableitung von Logarithmus', "(\\ln x)'=\\frac{1}{x}"],
    sqrt: ['Ableitung der Wurzel', "(\\sqrt{x})'=\\frac{1}{2\\sqrt{x}}"],
    atan: ['Ableitung von Arkustangens', "(\\arctan x)'=\\frac{1}{1+x^{2}}"],
    asin: ['Ableitung von Arkussinus', "(\\arcsin x)'=\\frac{1}{\\sqrt{1-x^{2}}}"],
    acos: ['Ableitung von Arkuskosinus', "(\\arccos x)'=-\\frac{1}{\\sqrt{1-x^{2}}}"],
    gen: ['Logarithmisches Ableiten', "(u^{v})'=u^{v}\\cdot\\left(v'\\cdot\\ln u+v\\cdot\\frac{u'}{u}\\right)"]
  };
  const X = idn('x');
  const isX = n => n.type === 'id' && n.v === 'x';
  const qNode = q => E.astQ(q);
  const mul = (a, b) => bin('mul', a, b), add = (a, b) => bin('add', a, b), sub = (a, b) => bin('sub', a, b), div = (a, b) => bin('div', a, b), pw = (a, b) => bin('pow', a, b);

  // Ableitung einer Grundform, deren Argument genau x ist → {d, key} | null
  function basic(n) {
    if (isX(n)) return { d: num(1), key: 'power' };
    if (n.type === 'pow' && isX(n.a) && !hasX(n.b)) {
      const e = E.exactQ(n.b);
      let d;
      if (e) {
        const em = E.qSub(e, q1);
        const xp = E.qIsZero(em) ? num(1) : E.qEq(em, q1) ? X : pw(X, qNode(em));
        d = E.qEq(e, q1) ? num(1) : E.qIsZero(e) ? num(0) : (E.qIsZero(em) ? qNode(e) : mul(qNode(e), xp));
      } else d = mul(n.b, pw(X, sub(n.b, num(1))));
      return { d: simp(d), key: 'power' };
    }
    if (n.type === 'pow' && !hasX(n.a) && isX(n.b)) {
      if (n.a.type === 'id' && n.a.v === 'EC') return { d: n, key: 'exp' };
      return { d: mul(n, call('log', n.a)), key: 'expa' };
    }
    if (n.type === 'call' && n.args.length === 1 && isX(n.args[0])) {
      switch (n.name) {
        case 'sin': return { d: call('cos', X), key: 'sin' };
        case 'cos': return { d: neg(call('sin', X)), key: 'cos' };
        case 'tan': return { d: div(num(1), pw(call('cos', X), num(2))), key: 'tan' };
        case 'log': return { d: div(num(1), X), key: 'ln' };
        case 'exp': return { d: n, key: 'exp' };
        case 'sqrt': return { d: div(num(1), mul(num(2), call('sqrt', X))), key: 'sqrt' };
        case 'atan': return { d: div(num(1), add(num(1), pw(X, num(2)))), key: 'atan' };
        case 'asin': return { d: div(num(1), call('sqrt', sub(num(1), pw(X, num(2))))), key: 'asin' };
        case 'acos': return { d: neg(div(num(1), call('sqrt', sub(num(1), pw(X, num(2)))))), key: 'acos' };
        default: return null;
      }
    }
    return null;
  }

  // Summanden einer Summe/Differenz mit Vorzeichen
  function flatSum(n, s, out) {
    if (n.type === 'add') { flatSum(n.a, s, out); flatSum(n.b, s, out); }
    else if (n.type === 'sub') { flatSum(n.a, s, out); flatSum(n.b, -s, out); }
    else out.push({ s, n });
    return out;
  }
  // c/x^k und c/x → c·x^(−k) (Umschreiben, damit die Potenzregel greift)
  function rewriteNeg(n) {
    if (n.type === 'div' && !hasX(n.a)) {
      const b = n.b;
      if (isX(b)) return { n: mul(n.a, pw(X, neg(num(1)))), changed: true };
      if (b.type === 'pow' && isX(b.a) && !hasX(b.b)) return { n: mul(n.a, pw(X, neg(b.b))), changed: true };
    }
    return { n, changed: false };
  }
  const isOneNum = n => n.type === 'num' && parseFloat(n.v) === 1;
  // konstanter Faktor c·g bzw. g/c bzw. −g: {c, g, div}
  function factorSplit(n) {
    if (n.type === 'neg' && hasX(n.x)) return { c: num(-1), g: n.x, kind: 'neg' };
    if (n.type === 'mul') {
      if (!hasX(n.a) && hasX(n.b)) return { c: n.a, g: n.b };
      if (hasX(n.a) && !hasX(n.b)) return { c: n.b, g: n.a };
    }
    if (n.type === 'div' && !hasX(n.b) && hasX(n.a)) return { c: div(num(1), n.b), g: n.a, kind: 'div', den: n.b };
    return null;
  }
  const cTex = c => txRaw(simp(c));
  const dTex = n => tx(simp(n));
  const lp = t => '\\left(' + t + '\\right)';
  const dOf = t => lp(t) + "'";
  const parA = t => (/^[0-9A-Za-z.]+(\^\{[^{}]*\})?$/.test(t) ? t : lp(t));

  // Äussere Funktion g(z) einer Verkettung: {g (in x), gd (in x), key, inner}
  function outer(n) {
    if (n.type === 'pow' && hasX(n.a) && !hasX(n.b) && !isX(n.a)) { const g = pw(X, n.b), b = basic(g); return b && { g, gd: b.d, key: b.key, inner: n.a }; }
    if (n.type === 'pow' && !hasX(n.a) && hasX(n.b) && !isX(n.b)) { const g = pw(n.a, X), b = basic(g); return b && { g, gd: b.d, key: b.key, inner: n.b }; }
    if (n.type === 'call' && n.args.length === 1 && hasX(n.args[0]) && !isX(n.args[0])) { const g = call(n.name, X), b = basic(g); return b && { g, gd: b.d, key: b.key, inner: n.args[0] }; }
    return null;
  }
  const inZ = n => calcSubstitute(n, 'x', idn('z'));

  // ───────────────────── Ableitung mit Regeln ─────────────────────
  // Rückgabe: {d (AST), sub (Doc|null), tex (einzeilige Kette, falls «inline»)}
  // Eine Grundform bzw. c·Grundform wird in einer Zeile erledigt; alles andere bekommt einen eigenen Block.
  function inlineDeriv(n, used) {
    if (!hasX(n)) { used.add('const'); return { d: num(0), chain: ['0'], rules: ['const'] }; }
    const b = basic(n);
    if (b) { used.add(b.key); return { d: b.d, chain: [dTex(b.d)], rules: [b.key] }; }
    const f = factorSplit(n);
    if (f) {
      const gb = basic(f.g);
      if (gb) {
        used.add('factor'); used.add(gb.key);
        const dg = gb.d, tot = simp(f.kind === 'div' ? div(dg, f.den) : mul(f.c, dg));
        const ct = f.kind === 'neg' ? '-' : f.kind === 'div' ? '' : cTex(f.c) + '\\cdot ';
        const mid = f.kind === 'div' ? '\\frac{' + dOf(tx(f.g)) + '}{' + txRaw(f.den) + '}=\\frac{' + dTex(dg) + '}{' + txRaw(f.den) + '}' : ct + dOf(tx(f.g)) + '=' + ct + (/[+\-]/.test(dTex(dg).replace(/^-/, '')) ? lp(dTex(dg)) : dTex(dg));
        return { d: tot, chain: [mid, dTex(tot)], rules: ['factor', gb.key] };
      }
    }
    return null;
  }
  const ruleNames = keys => keys.filter((k, i) => keys.indexOf(k) === i).map(k => RULES[k][0]).join(' und ');

  function part(n, label, used) {
    const il = inlineDeriv(n, used);
    if (il) return { d: il.d, il };
    const sd = DOC();
    sd.p('Ableitung von $' + label + '=' + tx(n) + '$:');
    const d = trace(n, label + "'", sd, used);
    return { d, sub: sd };
  }

  // Ableitung von n; schreibt die Zeilen in doc, lhs = linke Seite (LaTeX)
  function trace(n, lhs, doc, used) {
    const il = inlineDeriv(n, used);
    if (il) { doc.e(lhs + '=' + il.chain.join('='), ruleNames(il.rules)); return il.d; }
    // Summe / Differenz
    if (n.type === 'add' || n.type === 'sub') {
      used.add('sum');
      const terms = flatSum(n, 1, []).map(t => { const rw = rewriteNeg(t.n); return Object.assign({}, t, { n: rw.n, rw: rw.changed, orig: t.n }); });
      const sgn = (t, i) => (i === 0 ? (t.s < 0 ? '-' : '') : (t.s < 0 ? '-' : '+'));
      if (terms.some(t => t.rw)) { used.add('power'); doc.e(lhs.replace(/'/, '') + '=' + terms.map((t, i) => sgn(t, i) + (t.rw ? tx(t.n) : tx(t.orig))).join(''), 'Umschreiben mit negativen Hochzahlen'); }
      doc.e(lhs + '=' + terms.map((t, i) => (i === 0 ? (t.s < 0 ? '-' : '') : (t.s < 0 ? '-' : '+')) + dOf(tx(t.n))).join(''), 'Summenregel');
      const ds = terms.map((t, i) => ({ t, p: part(t.n, 't_{' + (i + 1) + '}', used) }));
      ds.forEach(({ t, p }) => {
        if (p.il) doc.e(dOf(tx(t.n)) + '=' + p.il.chain.join('='), ruleNames(p.il.rules));
        else doc.sub(p.sub);
      });
      let tot = null;
      ds.forEach(({ t, p }) => { tot = tot === null ? (t.s < 0 ? neg(p.d) : p.d) : bin(t.s < 0 ? 'sub' : 'add', tot, p.d); });
      tot = simp(tot);
      const mid = terms.map((t, i) => { const dt = dTex(ds[i].p.d); return sgn(t, i) + (/^-/.test(dt) && i > 0 ? '(' + dt + ')' : dt); }).join(''), fin = tx(tot);
      doc.e(lhs + '=' + mid + (mid.replace(/\s/g, '') === fin.replace(/\s/g, '') ? '' : '=' + fin));
      return tot;
    }
    // Produkt
    if (n.type === 'mul') {
      used.add('prod');
      const u = n.a, v = n.b, pu = part(u, 'u', used), pv = part(v, 'v', used);
      doc.e('u=' + tx(u) + ',\\quad v=' + tx(v), 'Produktregel');
      if (pu.il) doc.e("u'=" + pu.il.chain.join('='), ruleNames(pu.il.rules)); else doc.sub(pu.sub);
      if (pv.il) doc.e("v'=" + pv.il.chain.join('='), ruleNames(pv.il.rules)); else doc.sub(pv.sub);
      const comb = add(mul(pu.d, v), mul(u, pv.d)), res = simp(comb);
      doc.e(lhs + "=u'\\cdot v+u\\cdot v'=" + txP(pu.d) + '\\cdot ' + txP(v) + '+' + txP(u) + '\\cdot ' + txP(pv.d) + '=' + tx(res));
      return res;
    }
    // Quotient
    if (n.type === 'div') {
      used.add('quot');
      const u = n.a, v = n.b, pu = part(u, 'u', used), pv = part(v, 'v', used);
      doc.e('u=' + tx(u) + ',\\quad v=' + tx(v), 'Quotientenregel');
      if (pu.il) doc.e("u'=" + pu.il.chain.join('='), ruleNames(pu.il.rules)); else doc.sub(pu.sub);
      if (pv.il) doc.e("v'=" + pv.il.chain.join('='), ruleNames(pv.il.rules)); else doc.sub(pv.sub);
      const comb = div(sub(mul(pu.d, v), mul(u, pv.d)), pw(v, num(2))), res = simp(comb);
      doc.e(lhs + "=\\frac{u'\\cdot v-u\\cdot v'}{v^{2}}=\\frac{" + txP(pu.d) + '\\cdot ' + txP(v) + '-' + txP(u) + '\\cdot ' + txP(pv.d) + '}{' + (parA(tx(v)) + '^{2}') + '}=' + tx(res));
      return res;
    }
    // Verkettung
    const o = outer(n);
    if (o) {
      used.add('chain'); used.add(o.key);
      const pu = part(o.inner, 'u', used);
      doc.p('Äussere Funktion $g(z)=' + txRaw(inZ(o.g)) + '$, innere Funktion $u(x)=' + tx(o.inner) + '$.');
      doc.e("g'(z)=" + txRaw(inZ(simp(o.gd))), ruleNames([o.key]));
      if (pu.il) doc.e("u'(x)=" + pu.il.chain.join('='), ruleNames(pu.il.rules)); else doc.sub(pu.sub);
      const gdu = calcSubstitute(o.gd, 'x', o.inner), res = simp(mul(gdu, pu.d));
      doc.e(lhs + "=g'(u(x))\\cdot u'(x)=" + txRaw(simp(gdu)) + '\\cdot ' + txP(pu.d) + '=' + tx(res));
      return res;
    }
    // c · (zusammengesetzt)
    const f = factorSplit(n);
    if (f) {
      used.add('factor');
      const pg = part(f.g, 'g', used);
      const ct = f.kind === 'neg' ? '-' : f.kind === 'div' ? '' : cTex(f.c) + '\\cdot ';
      doc.e(lhs + '=' + (f.kind === 'div' ? '\\frac{' + dOf(tx(f.g)) + '}{' + txRaw(f.den) + '}' : ct + dOf(tx(f.g))), 'Faktorregel');
      if (pg.il) doc.e("g'=" + pg.il.chain.join('='), ruleNames(pg.il.rules)); else doc.sub(pg.sub);
      const res = simp(f.kind === 'div' ? div(pg.d, f.den) : mul(f.c, pg.d));
      doc.e(lhs + '=' + (f.kind === 'div' ? '\\frac{' + tx(pg.d) + '}{' + txRaw(f.den) + '}' : ct + txP(pg.d)) + '=' + tx(res));
      return res;
    }
    // sonst: allgemeiner Fall (u^v mit x in Basis und Exponent …)
    used.add('gen');
    let d;
    try { d = calcDiffOwn(n, 'x'); } catch (e) { d = num(0); }
    doc.e(lhs + '=' + tx(d), 'Logarithmisches Ableiten');
    return d;
  }

  function rulesDoc(F) {
    const d = DOC(), used = new Set(), body = DOC();
    const ast = F.ast;
    d.h('Die Funktion'); d.e('f(x)=' + tx(ast));
    const res = trace(ast, "f'(x)", body, used);
    const order = ['const', 'power', 'factor', 'sum', 'prod', 'quot', 'chain', 'sin', 'cos', 'tan', 'exp', 'expa', 'ln', 'sqrt', 'atan', 'asin', 'acos', 'gen'];
    d.h('Verwendete Regeln');
    order.filter(k => used.has(k)).forEach(k => d.p('**' + RULES[k][0] + ':** $' + RULES[k][1] + '$'));
    d.h('Rechnung');
    body.b.forEach(b => d.b.push(b));
    const fin = tx(res);
    d.res("$f'(x)=" + fin + '$');
    if (F.P) { const ex = E.pTex(E.pDeriv(F.P), 'x'); if (ex.replace(/\s/g, '') !== fin.replace(/\s/g, '')) d.e('=' + ex, 'ausmultipliziert'); }
    const d2 = F.deriv(2);
    if (d2) d.p('Zweite Ableitung: $f\'\'(x)=' + tx(d2) + '$');
    return d;
  }

  // ───────────────────── Tangente und Normale ─────────────────────
  // x0 als Fe (exakt), Funktionswerte exakt, wenn möglich
  function valAt(ast, fe, x0) {
    let v = null; try { v = E.evalFe(ast, fe); } catch (e) { v = null; }
    if (v) return { fe: v, exact: true, num: E.feNum(v) };
    const nv = S.evalNum(ast, x0);
    return { fe: null, exact: false, num: nv };
  }
  function linTex(m, q) {      // y = m·x + q mit Fe-Koeffizienten
    const mt = E.feIsZero(m) ? '' : E.qEq(m.p, q1) && E.feIsRat(m) ? 'x' : (E.feIsRat(m) && E.qEq(m.p, E.qNeg(q1))) ? '-x' : E.feTexP(m) + 'x';
    let qt = '';
    if (!E.feIsZero(q)) qt = (mt ? (E.feSgn(q) < 0 ? '-' : '+') + E.feTex(E.feSgn(q) < 0 ? E.feNeg(q) : q) : E.feTex(q));
    return (mt + qt) || '0';
  }
  function tangentDoc(F, x0) {
    const d = DOC(), ast = F.ast, d1 = F.deriv(1);
    const a = qOf(x0), fe0 = a ? E.feQ(a) : null;
    const xt = a ? E.qTex(a) : fmtT(x0, 4);
    d.h('Tangente und Normale im Punkt $P(x_0\\,|\\,f(x_0))$ mit $x_0=' + xt + '$');
    d.p('Tangente: $t\\colon\\ y=f\'(x_0)\\cdot(x-x_0)+f(x_0)$. Die Normale steht senkrecht auf der Tangente und hat die Steigung $-\\frac{1}{f\'(x_0)}$.');
    const fv = fe0 ? valAt(ast, fe0, x0) : { exact: false, num: S.evalNum(ast, x0) };
    const dv = d1 ? (fe0 ? valAt(d1, fe0, x0) : { exact: false, num: S.evalNum(d1, x0) }) : { exact: false, num: NaN };
    if (!isFinite(fv.num) || !isFinite(dv.num)) { d.note('An dieser Stelle ist die Funktion nicht definiert oder nicht ableitbar.'); return d; }
    const sf = fv.exact ? E.feTex(fv.fe) : '\\approx ' + fmtT(fv.num, 4), sd = dv.exact ? E.feTex(dv.fe) : '\\approx ' + fmtT(dv.num, 4);
    d.h('Schritt 1: Funktionswert');
    d.e('f(' + xt + ')=' + (fe0 ? txRaw(calcSubstitute(ast, 'x', E.astQ(a))) + '=' : '') + sf.replace(/^\\approx /, '\\approx '));
    d.h('Schritt 2: Steigung');
    d.e("f'(x)=" + tx(d1));
    d.e("f'(" + xt + ')=' + (fe0 ? txRaw(calcSubstitute(d1, 'x', E.astQ(a))) + '=' : '') + sd);
    d.h('Schritt 3: Tangentengleichung');
    if (fv.exact && dv.exact) {
      const m = dv.fe, x0e = fe0, q = E.feSub(fv.fe, E.feMul(m, x0e));
      d.e('t\\colon\\ y=' + E.feTexP(m) + '\\cdot\\left(x' + (E.qIsZero(a) ? '' : (a.n < 0n ? '+' : '-') + E.qTex(E.qAbs(a))) + '\\right)' + (E.feSgn(fv.fe) < 0 ? '-' : '+') + E.feTex(E.feSgn(fv.fe) < 0 ? E.feNeg(fv.fe) : fv.fe));
      d.res('$t\\colon\\ y=' + linTex(m, q) + '$');
      d.h('Schritt 4: Normale');
      if (E.feIsZero(m)) { d.res('Die Tangente ist waagrecht, die Normale ist die senkrechte Gerade $x=' + xt + '$.'); }
      else {
        const mn = E.feDiv(E.feInt(-1), m), qn = E.feSub(fv.fe, E.feMul(mn, x0e));
        d.e("m_n=-\\frac{1}{f'(" + xt + ')}=' + E.feTex(mn));
        d.res('$n\\colon\\ y=' + linTex(mn, qn) + '$');
      }
    } else {
      const m = dv.num, q = fv.num - m * x0;
      d.res('$t\\colon\\ y\\approx' + fmtT(m, 4) + 'x' + (q < 0 ? '-' : '+') + fmtT(Math.abs(q), 4) + '$');
      d.h('Schritt 4: Normale');
      if (Math.abs(m) < 1e-12) d.res('Die Tangente ist waagrecht, die Normale ist die senkrechte Gerade $x=' + xt + '$.');
      else { const mn = -1 / m, qn = fv.num - mn * x0; d.res('$n\\colon\\ y\\approx' + fmtT(mn, 4) + 'x' + (qn < 0 ? '-' : '+') + fmtT(Math.abs(qn), 4) + '$'); }
      d.note('Näherungswerte, weil die Werte hier nicht exakt als Bruch oder Wurzel darstellbar sind.');
    }
    return d;
  }

  // ───────────────────── h-Methode ─────────────────────
  // Koeffizienten von P(a+h) als Polynom in h
  function shiftPoly(P, a) {
    const c = []; let cur = P;
    for (let k = 0; k <= E.pDeg(P); k++) {
      const v = E.pEvalQ(cur, a);
      c.push(E.qDiv(v, E.Q(Dif.fact(k))));
      cur = E.pDeriv(cur);
    }
    return c;
  }
  // zweivariable Terme x^i·h^j mit Q-Koeffizienten → LaTeX (x absteigend, h aufsteigend)
  function bpTex(map) {
    const keys = Object.keys(map).filter(k => !E.qIsZero(map[k])).sort((A, B) => { const [ai, aj] = A.split(',').map(Number), [bi, bj] = B.split(',').map(Number); return bi - ai || aj - bj; });
    if (!keys.length) return '0';
    let out = '';
    keys.forEach((k, idx) => {
      const [i, j] = k.split(',').map(Number), c = map[k], ng = c.n < 0n, a = E.qAbs(c);
      const mono = (i ? 'x' + (i > 1 ? '^{' + i + '}' : '') : '') + (j ? 'h' + (j > 1 ? '^{' + j + '}' : '') : '');
      const term = !mono ? E.qTex(a) : (E.qEq(a, q1) ? '' : E.qTex(a)) + mono;
      out += idx === 0 ? (ng ? '-' : '') + term : (ng ? '-' : '+') + term;
    });
    return out;
  }
  function hMethodDoc(F, x0) {
    const d = DOC(), ast = F.ast, P = F.P;
    const poly = P && E.pDeg(P) >= 0 && E.pDeg(P) <= 6;
    // beliebige Stelle x
    if (x0 === null) {
      if (!poly) { d.p('Bei dieser Funktion lässt sich der Differenzenquotient nicht zu einem Term vereinfachen, der sich durch $h$ kürzen lässt. Die Ableitungsfunktion findest du mit den Ableitungsregeln.'); return d; }
      d.h('Ableitungsfunktion mit der $h$-Methode');
      d.e('f(x)=' + tx(ast));
      const n = E.pDeg(P);
      const full = {}, diff = {}, quo = {};
      for (let k = 0; k <= n; k++) {
        const a = P[k]; if (E.qIsZero(a)) continue;
        for (let j = 0; j <= k; j++) {
          const key = (k - j) + ',' + j, c = E.qMul(a, E.Q(Dif.binom(k, j)));
          full[key] = full[key] ? E.qAdd(full[key], c) : c;
          if (j >= 1) { diff[key] = full[key]; quo[(k - j) + ',' + (j - 1)] = quo[(k - j) + ',' + (j - 1)] ? E.qAdd(quo[(k - j) + ',' + (j - 1)], c) : c; }
        }
      }
      d.p('**Schritt 1:** $f(x+h)$ einsetzen und ausmultiplizieren.');
      d.e('f(x+h)=' + txRaw(calcSubstitute(ast, 'x', add(X, idn('h')))));
      d.e('=' + bpTex(full));
      d.p('**Schritt 2:** Differenz $f(x+h)-f(x)$ bilden (die Summanden ohne $h$ heben sich weg).');
      d.e('f(x+h)-f(x)=' + bpTex(diff));
      d.p('**Schritt 3:** Durch $h$ dividieren: zuerst $h$ ausklammern, dann kürzen.');
      d.e("\\frac{f(x+h)-f(x)}{h}=\\frac{h\\cdot\\left(" + bpTex(quo) + '\\right)}{h}=' + bpTex(quo));
      d.p('**Schritt 4:** Grenzwert $h\\to0$ bilden: alle Summanden mit $h$ fallen weg.');
      d.e("f'(x)=\\lim_{h\\to0}\\left(" + bpTex(quo) + '\\right)=' + E.pTex(E.pDeriv(P), 'x'));
      d.res("$f'(x)=" + E.pTex(E.pDeriv(P), 'x') + '$');
      return d;
    }
    const a = qOf(x0);
    if (!poly || !a) {
      d.h('Differenzenquotient und Grenzwert');
      d.e('f(x)=' + tx(ast));
      d.p('Bei dieser Funktion lässt sich der Differenzenquotient nicht zu einem Term vereinfachen, der sich durch $h$ kürzen lässt. Die Tabelle zeigt, wohin die Differenzenquotienten streben. Die Ableitung berechnest du mit den Ableitungsregeln.');
      const dv = F.f(1)(x0);
      if (isFinite(dv)) d.res("$f'(" + (a ? E.qTex(a) : fmtT(x0, 4)) + ')\\approx' + fmtT(dv, 4) + '$');
      return d;
    }
    const at = E.qTex(a), g = shiftPoly(P, a), f0 = g[0];
    const gd = g.slice(); gd[0] = q0;
    const quo = gd.slice(1);                                      // gd / h
    d.h('Die $h$-Methode an der Stelle $x_0=' + at + '$');
    d.e('f(x)=' + tx(ast));
    d.p('**Schritt 1:** $f(x_0)$ und $f(x_0+h)$ berechnen.');
    d.e('f(' + at + ')=' + txRaw(calcSubstitute(ast, 'x', E.astQ(a))) + '=' + E.qTex(f0));
    d.e('f(' + at + '+h)=' + txRaw(calcSubstitute(ast, 'x', add(E.astQ(a), idn('h')))) + '=' + E.pTex(g, 'h'));
    d.p('**Schritt 2:** Differenz $f(x_0+h)-f(x_0)$ bilden und vereinfachen.');
    d.e('f(' + at + '+h)-f(' + at + ')=' + E.pTex(g, 'h') + (E.qIsZero(f0) ? '' : (f0.n < 0n ? '+' : '-') + E.qTexP(E.qAbs(f0)).replace(/^-/, '')) + '=' + E.pTex(gd, 'h'));
    d.p('**Schritt 3:** Durch $h$ dividieren (zuerst $h$ ausklammern und kürzen).');
    if (E.pIsZero(gd)) d.e('\\frac{0}{h}=0');
    else d.e('\\frac{' + E.pTex(gd, 'h') + '}{h}=\\frac{h\\cdot\\left(' + E.pTex(quo, 'h') + '\\right)}{h}=' + E.pTex(quo, 'h'));
    d.p('**Schritt 4:** Grenzwert $h\\to0$ bilden.');
    const slope = quo.length ? quo[0] : q0;
    d.e("f'(" + at + ')=\\lim_{h\\to0}\\left(' + E.pTex(quo, 'h') + '\\right)=' + E.qTex(slope));
    d.res('Der Graph von $f$ hat im Punkt $(' + at + '\\,|\\,' + E.qTex(f0) + ')$ die Steigung $' + E.qTex(slope) + '$.');
    return d;
  }

  // Differenzenquotient an der Stelle x0 gekürzt (für die Ansicht Sekante → Tangente bei h = 0); null, wenn nicht exakt möglich
  function hLimit(F, x0) {
    const P = F && F.P, a = qOf(x0);
    if (!P || !a || E.pDeg(P) < 0 || E.pDeg(P) > 6) return null;
    const g = shiftPoly(P, a), gd = g.slice(); gd[0] = q0;
    const quo = gd.slice(1), slope = quo.length ? quo[0] : q0;
    const zero = E.pIsZero(gd), qt = zero ? '0' : E.pTex(quo, 'h');
    return { zero, gdTex: E.pTex(gd, 'h'), quoTex: qt, slopeTex: E.qTex(slope), slope: Number(slope.n) / Number(slope.d) };
  }

  // ───────────────────── Doc → LaTeX (Rechenweg im Export) ─────────────────────
  const escTxt = t => String(t).replace(/\\/g, '\\textbackslash{}').replace(/([&%#_{}])/g, '\\$1').replace(/~/g, '\\~{}').replace(/\^/g, '\\^{}').replace(/</g, '\\textless{}').replace(/>/g, '\\textgreater{}');
  const texInline = t => String(t).split(/(\$[^$]+\$)/).map(part => (part.length > 1 && part.charAt(0) === '$' && part.slice(-1) === '$')
    ? part
    : escTxt(part).replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}')).join('');
  const opTex = op => (/^[A-Za-z]/.test(op) && !/\\/.test(op) ? '\\text{\\small ' + escTxt(op) + '}' : '{\\scriptstyle ' + op.replace(/^\$|\$$/g, '') + '}');
  function docTex(d, depth) {
    const out = [];
    d.b.forEach(b => {
      switch (b.k) {
        case 'h': out.push('\\medskip\\noindent\\textbf{' + texInline(b.t) + '}\\par'); break;
        case 'p': out.push('\\noindent ' + texInline(b.t) + '\\par'); break;
        case 'e': out.push('\\[ ' + b.t + (b.op ? '\\qquad ' + opTex(b.op) : '') + ' \\]'); break;
        case 'res': out.push('\\noindent\\fbox{\\parbox{0.92\\linewidth}{' + texInline(b.t) + '}}\\par\\medskip'); break;
        case 'note': out.push('\\noindent\\emph{' + texInline(b.t) + '}\\par'); break;
        case 'sub': out.push('\\begin{quote}', docTex({ b: b.b }, (depth || 0) + 1), '\\end{quote}'); break;
        case 'tab': {
          const n = b.head.length;
          out.push('\\begin{center}\\renewcommand{\\arraystretch}{1.3}\\begin{tabular}{|' + 'c|'.repeat(n) + '}\\hline',
            b.head.map(texInline).join(' & ') + '\\\\\\hline',
            b.rows.map(r => r.map(texInline).join(' & ') + '\\\\\\hline').join('\n'), '\\end{tabular}\\end{center}');
          break;
        }
      }
    });
    return out.join('\n');
  }

  Object.assign(Dif, { RULES, rulesDoc, tangentDoc, hMethodDoc, hLimit, trace, basic, linTex, docTex });
})();
