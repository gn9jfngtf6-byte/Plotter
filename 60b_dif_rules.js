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
      if (!isFinite(F.f(0)(x0))) return d;                    // f ist hier nicht definiert: das steht schon im Abschnitt «Sekante und Tangente»
      d.h('Differenzenquotient und Grenzwert');
      d.e('f(x)=' + tx(ast));
      // Knick, senkrechte Tangente, kein Grenzwert: Hier fehlt die Ableitung, weil die einseitigen Grenzwerte nicht zusammenpassen – nicht, weil sich h nicht kürzen lässt.
      const T = Dif.dqTable(F, x0), xs = a ? E.qTex(a) : fmtT(x0, 4), none = () => d.res("$f'(" + xs + ')\\text{ existiert nicht}$');
      if (T.status === 'kink') {
        const f = F.f(0), isAbs0 = x0 === 0 && [-2.5, -1, -0.3, 0.4, 1, 3].every(t => f(t) === Math.abs(t));
        if (isAbs0) {
          d.p('Für $h>0$ ist $|h|=h$, für $h<0$ ist $|h|=-h$. Der Differenzenquotient lässt sich auf beiden Seiten kürzen, ergibt aber verschiedene Werte:');
          d.e('h>0:\\quad\\frac{|0+h|-|0|}{h}=\\frac{h}{h}=1'); d.e('h<0:\\quad\\frac{|0+h|-|0|}{h}=\\frac{-h}{h}=-1');
        } else d.p('Die Differenzenquotienten streben von rechts und von links gegen verschiedene Werte:');
        d.e('\\lim_{h\\to0^+}\\frac{f(x_0+h)-f(x_0)}{h}=' + fmtT(T.limR, 4) + ',\\qquad\\lim_{h\\to0^-}\\frac{f(x_0+h)-f(x_0)}{h}=' + fmtT(T.limL, 4));
        d.p('Die **rechtsseitige** und die **linksseitige Ableitung** stimmen nicht überein. Darum hat der Differenzenquotient für $h\\to0$ keinen Grenzwert.');
        none(); return d;
      }
      if (T.status === 'steep') { d.p('Die Differenzenquotienten wachsen für $h\\to0$ über alle Grenzen: Der Graph hat an dieser Stelle eine senkrechte Tangente.'); none(); return d; }
      if (T.status === 'undef') { d.p('Die Differenzenquotienten haben für $h\\to0$ keinen endlichen Grenzwert.'); none(); return d; }
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
  // «…» im Export als \flqq/\frqq: läuft so auch in Dokumenten ohne T1-Schrift und ohne babel
  const TEX_GUIL = '\\providecommand{\\flqq}{{\\fontencoding{T1}\\selectfont\\guillemotleft}}\\providecommand{\\frqq}{{\\fontencoding{T1}\\selectfont\\guillemotright}}';
  function texGuil(s) {
    let hit = false;
    const out = String(s).split('\n').map(l => (/^\s*%/.test(l) ? l : l.replace(/[«»]/g, c => { hit = true; return c === '«' ? '\\flqq{}' : '\\frqq{}'; }))).join('\n');
    return hit ? out.replace(/^((?:%.*\n)*)/, m => m + TEX_GUIL + '\n') : out;
  }
  const GREEK_RE = /[\u0370-\u03FF\u1F00-\u1FFF]/;   // einzelne griechische Buchstaben sind Formelzeichen, in griechischen Wörtern bleiben sie Text
  const escTxt = t => String(t).replace(/[\\&%#_{}]/g, c => (c === '\\' ? '\\textbackslash{}' : '\\' + c)).replace(/~/g, '\\~{}').replace(/\^/g, '\\^{}').replace(/</g, '\\textless{}').replace(/>/g, '\\textgreater{}').replace(/−/g, '$-$').replace(/√/g, '$\\sqrt{\\phantom{x}}$').replace(/≈/g, '$\\approx$').replace(/·/g, '$\\cdot$').replace(/≤/g, '$\\le$').replace(/≥/g, '$\\ge$').replace(/→/g, '$\\to$').replace(/[σμπφαβγλΦΔ±∪∩∖∅∈]/g, (c, i, str) => (GREEK_RE.test(str.charAt(i - 1)) || GREEK_RE.test(str.charAt(i + 1))) ? c : '$' + ({ '∪': '\\cup', '∩': '\\cap', '∖': '\\setminus', '∅': '\\emptyset', '∈': '\\in', 'σ': '\\sigma', 'μ': '\\mu', 'π': '\\pi', 'φ': '\\varphi', 'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'λ': '\\lambda', 'Φ': '\\Phi', 'Δ': '\\Delta', '±': '\\pm' })[c] + '$');   // griechische Buchstaben im Fliesstext (pdflatex kennt sie sonst nicht)
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
        case 'e':
          if (b.op && b.op.length > 48 && /^[A-Za-z]/.test(b.op) && !/\\/.test(b.op)) out.push('\\[ ' + b.t + ' \\]', '{\\centering\\small ' + escTxt(b.op) + '\\par}');   // langer Text neben der Formel: darunter, sonst ragt die Zeile über den Rand
          else out.push('\\[ ' + b.t + (b.op ? '\\qquad ' + opTex(b.op) : '') + ' \\]');
          break;
        case 'res': out.push('\\noindent\\fbox{\\parbox{0.92\\linewidth}{' + texInline(b.t) + '}}\\par\\medskip'); break;
        case 'note': out.push('\\noindent\\emph{' + texInline(b.t) + '}\\par'); break;
        case 'sit': out.push('\\noindent\\fbox{\\parbox{0.92\\linewidth}{\\textbf{Situation:} ' + texInline(b.t) + (b.q ? '\\\\[2pt]\\textbf{Gefragt:} ' + texInline(b.q) : '') + '}}\\par\\medskip'); break;
        case 'sub': out.push('\\begin{quote}', docTex({ b: b.b }, (depth || 0) + 1), '\\end{quote}'); break;
        case 'tab': {
          // liegende Tabellen mit vielen Spalten (Vorzeichentabellen) auf mehrere Teile verteilen, damit sie auf die Seite passen
          const n = b.head.length, all = [b.head].concat(b.rows);
          const cw = c => 12 + 5 * Math.max.apply(null, all.map(r => String(r[c] === undefined ? '' : r[c]).replace(/\\[A-Za-z]+/g, 'x').replace(/[${}\\]/g, '').length));
          const parts = [[]]; let w = 0;
          for (let c = 1; c < n; c++) { const x = cw(c), cur = parts[parts.length - 1]; if (b.rows.length <= 3 && cur.length && w + x > 330 - cw(0)) { parts.push([c]); w = x; } else { cur.push(c); w += x; } }
          parts.forEach(cs => {
            const ix = [0].concat(cs), line = r => ix.map(c => texInline(r[c] === undefined ? '' : r[c])).join(' & ') + '\\\\\\hline';
            out.push('\\begin{center}\\renewcommand{\\arraystretch}{1.3}\\begin{tabular}{|' + 'c|'.repeat(ix.length) + '}\\hline', line(b.head), b.rows.map(line).join('\n'), '\\end{tabular}\\end{center}');
          });
          break;
        }
      }
    });
    const tex = out.join('\n').replace(/=\s*\\approx/g, '\\approx');   // «=≈» aus zwei Teilen → «≈»
    return depth ? tex : texGuil(tex);
  }

  // Schrittlisten {title, st} der Themen (Quad.st.…, Pow.st.… usw.): als Dokument für Karte und Export bzw. als Zeilen im Bild
  function stDoc(r) {
    const d = DOC(); d.h(r.title);
    r.st.forEach(s => { if (s.k === 'h') d.h(s.s); else if (s.k === 'p') d.p(s.s); else if (s.k === 'e') d.e(s.s); else if (s.k === 'res') d.res(s.s); else if (s.k === 'note') d.note(s.s); });
    return d;
  }
  function stLines(r) {
    const out = [];
    r.st.forEach(s => {
      if (!s.sc || (s.k !== 'e' && s.k !== 'res')) return;
      const body = s.k === 'res' ? s.s.replace(/\$/g, '') : s.s;
      out.push({ s: typeof s.sc === 'string' && s.sc !== 'true' ? '\\col{' + s.sc + '}{' + body + '}' : body, bold: s.k === 'res' });
    });
    return out;
  }

  // Sachverhalt einer Anwendung als Kasten «Situation» (+ «Gefragt») direkt unter die Überschrift des Rechenwegs setzen
  function withSit(d, t, q) {
    if (!d || !d.b || !t) return d;
    const i = d.b.length && d.b[0].k === 'h' ? 1 : 0;
    d.b.splice(i, 0, { k: 'sit', t, q: q || '' });
    return d;
  }
  // Sekante → Tangente: Sekantensteigung zum aktuellen h und Wertetabellen h → 0 von rechts und links
  function secDoc(F, x0, h) {
    const d = DOC(), f = F.f(0), T = Dif.dqTable(F, x0), f0 = T.f0, n = v => fmt(v, 4), nd = v => (isFinite(v) ? n(v) : '\\text{n.d.}');
    const par = t => (/^-/.test(t) ? '\\left(' + t + '\\right)' : t);
    d.h('Sekante und Tangente');
    if (!isFinite(f0)) { d.p('An der Stelle $x_0=' + n(x0) + '$ ist $f$ nicht definiert.'); return d; }
    d.p('Die Sekante geht durch $P\\big(x_0\\,|\\,f(x_0)\\big)$ und $Q\\big(x_0+h\\,|\\,f(x_0+h)\\big)$. Ihre Steigung ist der Differenzenquotient:');
    d.e('m_s=\\frac{\\Delta y}{h}=\\frac{f(x_0+h)-f(x_0)}{h}');
    const x1 = x0 + h, f1 = f(x1);
    if (h !== 0 && isFinite(f1)) {
      d.e('x_0=' + n(x0) + ',\\ h=' + n(h) + ':\\quad m_s=\\frac{f(' + n(x1) + ')-f(' + n(x0) + ')}{' + n(h) + '}=\\frac{' + n(f1) + '-' + par(n(f0)) + '}{' + n(h) + '}=' + n((f1 - f0) / h));
    } else if (h === 0 && isFinite(T.fp)) d.p('Für $h=0$ fällt $Q$ auf $P$: Aus der Sekante wird die Tangente mit der Steigung $f\'(x_0)=' + n(T.fp) + '$.');
    const tab = (rows, side) => {
      d.p(side > 0 ? '**Von rechts** ($h>0$, $Q$ rechts von $P$):' : '**Von links** ($h<0$, $Q$ links von $P$):');
      d.b.push({ k: 'tab', head: ['$h$', '$f(x_0+h)$', '$\\Delta y$', '$m_s$'], rows: rows.map(r => { const cur = Math.abs(r.h - h) < 1e-12, c = t => '$' + (cur ? '\\mathbf{' + t + '}' : t) + '$'; return [c(n(r.h)), c(nd(r.y)), c(nd(r.y - f0)), c(nd(r.dq))]; }) });
      const L = side > 0 ? T.limR : T.limL;
      d.e(isFinite(L) ? 'h\\to 0' + (side > 0 ? '^+' : '^-') + ':\\quad m_s\\to ' + fmt(L, 3) : '\\text{kein Grenzwert}');
    };
    tab(T.right, 1); tab(T.left, -1);
    if (T.status === 'kink') d.note('Die Grenzwerte von links und rechts sind verschieden: An dieser Stelle ist $f$ nicht differenzierbar (Knick).');
    else if (T.status === 'undef') d.note('Hier gibt es keine endliche Steigung.');
    else if (T.status === 'steep') d.note('Die Steigung wird beliebig gross: senkrechte Tangente, $f$ ist hier nicht differenzierbar.');
    else d.p('Beide Grenzwerte sind gleich: $f\'(' + n(x0) + ')=' + n(T.fp) + '$ ist die Steigung der Tangente.');
    return d;
  }

  // ───────────────────── Grenzwerte von Funktionen ─────────────────────
  // Zahlenreihe von links/rechts (x → a) bzw. für grosse |x| (x → ±∞); Grenzwert numerisch geschätzt
  const LIM_H = [1, 0.1, 0.01, 0.001, 0.0001];
  function limNum(f, a, side) {                         // side −1/+1; a = ±Infinity: x → ±∞
    const at = t => (isFinite(a) ? f(a + side * t) : f(side / t));
    const y1 = at(1e-5), y2 = at(1e-7);
    if (!isFinite(y1) || !isFinite(y2)) {                               // Überlauf (z. B. x·e^{−x} für x → −∞): Vorzeichen aus näheren Werten
      for (const [h0, h1] of [[1e-3, 1e-4], [1e-2, 1e-3], [1e-1, 1e-2]]) {
        const y0 = at(h0), y01 = at(h1);
        if (isFinite(y0) && isFinite(y01)) return Math.abs(y01) > Math.abs(y0) * 5 && Math.abs(y01) > 1e3 && Math.sign(y01) === Math.sign(y0) ? { kind: 'inf', sign: Math.sign(y01) } : { kind: 'none' };
      }
      return { kind: 'none' };
    }
    if (Math.abs(y2) > 1e6 && Math.abs(y2) > Math.abs(y1) * 5) return { kind: 'inf', sign: Math.sign(y2) };
    if (Math.abs(y2 - y1) <= 1e-3 * Math.max(1, Math.abs(y2))) { const r = Math.round(y2 * 1e6) / 1e6; return { kind: 'fin', v: Math.abs(r - Math.round(r)) < 1e-5 ? Math.round(r) : r }; }
    return { kind: 'none' };
  }
  const limTxt = L => (L.kind === 'fin' ? fmt(L.v, 4) : L.kind === 'inf' ? (L.sign > 0 ? '\\infty' : '-\\infty') : '\\text{existiert nicht}');
  function limDoc(F, a, inf) {
    const d = DOC(), f = F.f(0), n = v => fmt(v, 4), fT = tx(F.ast);
    let R = null; try { R = E.ratFromAst(F.ast); } catch (e) { R = null; }
    const P = p => E.pTex(p, 'x');
    const tab = (side) => {
      // sehr grosse Werte als Zehnerpotenz, Überlauf als ±∞ (ohne Vorzeichen: nicht definiert)
      const big = y => (Math.abs(y) >= 1e9 ? (+y.toExponential(3).split('e')[0]) + '\\cdot10^{' + (+y.toExponential(3).split('e')[1]) + '}' : n(y));
      const rows = LIM_H.map(h => { const x = inf ? side / h : a + side * h, y = f(x); return ['$' + n(x) + '$', '$' + (isFinite(y) ? big(y) : y === Infinity ? '\\infty' : y === -Infinity ? '-\\infty' : '\\text{n.d.}') + '$']; });
      d.b.push({ k: 'tab', head: ['$x$', '$f(x)$'], rows });
    };
    if (inf) {
      d.h('Grenzwert für $x\\to\\pm\\infty$');
      d.e('f(x)=' + fT);
      if (R && R.N.length && R.D.length) {
        const dn = E.pDeg(R.N), dd = E.pDeg(R.D), ln = R.N[dn], ld = R.D[dd];
        if (dd === 0) {
          d.p('$f$ ist ein Polynom: Für grosse $|x|$ entscheidet das Glied mit der höchsten Potenz.');
          const s1 = E.qSgn(ln), s2 = E.qSgn(ln) * (dn % 2 ? -1 : 1);
          d.e('\\lim_{x\\to\\infty}f(x)=' + (dn === 0 ? E.qTex(ln) : s1 > 0 ? '\\infty' : '-\\infty') + ',\\qquad \\lim_{x\\to-\\infty}f(x)=' + (dn === 0 ? E.qTex(ln) : s2 > 0 ? '\\infty' : '-\\infty'));
        } else {
          d.p('**Zähler und Nenner durch die höchste Potenz des Nenners teilen** ($x^{' + dd + '}$): Alle Glieder mit $\\frac{1}{x^k}$ streben gegen 0.');
          d.e('f(x)=\\frac{' + P(R.N) + '}{' + P(R.D) + '}');
          if (dn < dd) { d.p('Der Zähler hat den kleineren Grad: Der Bruch strebt gegen 0.'); d.e('\\lim_{x\\to\\pm\\infty}f(x)=0'); d.p('Waagrechte Asymptote: $y=0$.'); }
          else if (dn === dd) { const L = E.qDiv(ln, ld); d.p('Gleicher Grad: Es bleibt der Quotient der Leitkoeffizienten.'); d.e('\\lim_{x\\to\\pm\\infty}f(x)=\\frac{' + E.qTex(ln) + '}{' + E.qTex(ld) + '}=' + E.qTex(L)); d.p('Waagrechte Asymptote: $y=' + E.qTex(L) + '$.'); }
          else { const s1 = E.qSgn(E.qDiv(ln, ld)), s2 = s1 * ((dn - dd) % 2 ? -1 : 1); d.p('Der Zähler hat den grösseren Grad: Der Betrag wächst über alle Grenzen.'); d.e('\\lim_{x\\to\\infty}f(x)=' + (s1 > 0 ? '\\infty' : '-\\infty') + ',\\qquad \\lim_{x\\to-\\infty}f(x)=' + (s2 > 0 ? '\\infty' : '-\\infty')); if (dn === dd + 1) d.note('Grad Zähler = Grad Nenner + 1: Es gibt eine schiefe Asymptote (Polynomdivision).'); }
        }
      } else d.p('Für diese Funktion wird der Grenzwert mit einer Zahlenreihe geschätzt.');
      d.p('**Zahlenreihe** für $x\\to\\infty$:'); tab(1);
      d.p('**Zahlenreihe** für $x\\to-\\infty$:'); tab(-1);
      const Lp = limNum(f, Infinity, 1), Lm = limNum(f, -Infinity, -1);
      d.res('$\\lim_{x\\to\\infty}f(x)=' + limTxt(Lp) + '$, $\\lim_{x\\to-\\infty}f(x)=' + limTxt(Lm) + '$');
      return d;
    }
    const A = n(a), qa = qOf(a);
    d.h('Grenzwert für $x\\to ' + A + '$');
    d.e('f(x)=' + fT);
    let done = null;
    if (R && qa) {
      let N = R.N, D = R.D;
      const Nv = E.pEvalQ(N, qa), Dv = E.pEvalQ(D, qa);
      d.p('**Einsetzen** von $x=' + A + '$' + (E.pDeg(D) === 0 ? ':' : ' in Zähler und Nenner:'));
      if (E.pDeg(D) === 0) { const v = E.qDiv(Nv, D[0]); d.e('f(' + A + ')=' + E.qTex(v)); d.p('$f$ ist an dieser Stelle definiert und stetig: Der Grenzwert ist der Funktionswert.'); done = { kind: 'fin', v: E.qNum(v), t: E.qTex(v) }; }
      else {
        d.e('\\text{Zähler: }' + E.qTex(Nv) + ',\\qquad \\text{Nenner: }' + E.qTex(Dv));
        if (!E.qIsZero(Dv)) { const v = E.qDiv(Nv, Dv); d.p('Der Nenner ist nicht 0: Man darf einsetzen.'); d.e('\\lim_{x\\to ' + A + '}f(x)=\\frac{' + E.qTex(Nv) + '}{' + E.qTex(Dv) + '}=' + E.qTex(v)); done = { kind: 'fin', v: E.qNum(v), t: E.qTex(v) }; }
        else if (!E.qIsZero(Nv)) { d.p('Der Nenner wird 0, der Zähler nicht: **Polstelle**. Die Funktionswerte wachsen dem Betrag nach über alle Grenzen.'); }
        else {
          d.p('Zähler und Nenner werden 0: **unbestimmter Ausdruck** $\\frac{0}{0}$. Beide enthalten den Faktor $(x' + (E.qSgn(qa) <= 0 ? '+' + E.qTex(E.qAbs(qa)) : '-' + E.qTex(qa)) + ')$, den man kürzt:');
          const lin = [E.qNeg(qa), q1], fill = p => { for (let i = 0; i < p.length; i++) if (!p[i]) p[i] = q0; return E.pTrim(p); };
          let guard = 0;
          while (guard++ < 6 && E.qIsZero(E.pEvalQ(N, qa)) && E.qIsZero(E.pEvalQ(D, qa)) && E.pDeg(D) > 0) {
            const N1 = fill(E.pDivmod(N, lin).q), D1 = fill(E.pDivmod(D, lin).q), fx = '(' + P(lin) + ')';
            const one = E.pDeg(D1) === 0 && E.qEq(D1[0], q1);
            d.e('\\frac{' + P(N) + '}{' + P(D) + '}=\\frac{' + fx + '\\cdot(' + P(N1) + ')}{' + fx + (one ? '' : '\\cdot(' + P(D1) + ')') + '}=' + (one ? P(N1) : '\\frac{' + P(N1) + '}{' + P(D1) + '}'));
            N = N1; D = D1;
          }
          const Nv2 = E.pEvalQ(N, qa), Dv2 = E.pEvalQ(D, qa);
          if (!E.qIsZero(Dv2)) { const v = E.qDiv(Nv2, Dv2); d.p('Jetzt darf man einsetzen:'); d.e('\\lim_{x\\to ' + A + '}f(x)=' + (E.qEq(Dv2, q1) ? '' : '\\frac{' + E.qTex(Nv2) + '}{' + E.qTex(Dv2) + '}=') + E.qTex(v)); d.note('An der Stelle $x=' + A + '$ selbst ist $f$ nicht definiert: Der Graph hat dort ein Loch (hebbare Definitionslücke).'); done = { kind: 'fin', v: E.qNum(v), t: E.qTex(v) }; }
          else d.p('Nach dem Kürzen bleibt der Nenner 0: Polstelle.');
        }
      }
    } else d.p('Für diese Funktion wird der Grenzwert mit einer Zahlenreihe von links und von rechts geschätzt.');
    d.p('**Von links** ($x<' + A + '$):'); tab(-1);
    d.p('**Von rechts** ($x>' + A + '$):'); tab(1);
    const Ll = limNum(f, a, -1), Lr = limNum(f, a, 1);
    d.e('\\lim_{x\\to ' + A + '^-}f(x)=' + limTxt(Ll) + ',\\qquad \\lim_{x\\to ' + A + '^+}f(x)=' + limTxt(Lr));
    if (done) d.res('$\\lim_{x\\to ' + A + '}f(x)=' + done.t + '$');
    else if (Ll.kind === 'fin' && Lr.kind === 'fin' && Math.abs(Ll.v - Lr.v) < 1e-4) d.res('$\\lim_{x\\to ' + A + '}f(x)\\approx ' + fmt(Ll.v, 4) + '$');
    else d.res('Links- und rechtsseitiger Grenzwert ' + (Ll.kind === 'inf' && Lr.kind === 'inf' ? 'sind unendlich: Polstelle, der Grenzwert existiert nicht.' : 'stimmen nicht überein: Der Grenzwert existiert nicht.'));
    return d;
  }

  // ───────────────────── Extremwertprobleme ─────────────────────
  // Jedes Problem: Parameter, Zielfunktion als Rohausdruck in x, Definitionsbereich, Texte; Bild in 61_dif_draw.js
  const EXT = {
    rect: { t: 'Rechteck mit festem Umfang', pn: ['U'], pv: [20], unit: 'cm', sit: p => 'Ein Rechteck hat den Umfang $U=' + fmt(p[0], 4) + '$. Wie lang müssen die Seiten sein, damit die Fläche möglichst gross ist?',
      vx: 'x = eine Seite', nb: p => '2x+2y=' + fmt(p[0], 4) + '\\ \\Rightarrow\\ y=' + fmt(p[0] / 2, 4) + '-x', zn: 'A', raw: p => 'x*(' + p[0] / 2 + '-x)', zt: p => 'A(x)=x\\cdot(' + fmt(p[0] / 2, 4) + '-x)', dom: p => [0, p[0] / 2], goal: 'max' },
    fence: { t: 'Weide an einer Mauer', pn: ['L'], pv: [40], unit: 'm', sit: p => 'Mit $L=' + fmt(p[0], 4) + '$ m Zaun wird an einer Mauer eine rechteckige Weide eingezäunt (die Mauer bildet eine Seite). Wie gross wird die Weide höchstens?',
      vx: 'x = Seite senkrecht zur Mauer', nb: p => '2x+y=' + fmt(p[0], 4) + '\\ \\Rightarrow\\ y=' + fmt(p[0], 4) + '-2x', zn: 'A', raw: p => 'x*(' + p[0] + '-2*x)', zt: p => 'A(x)=x\\cdot(' + fmt(p[0], 4) + '-2x)', dom: p => [0, p[0] / 2], goal: 'max' },
    box: { t: 'Schachtel aus einem Karton', pn: ['a', 'b'], pv: [30, 20], unit: 'cm', sit: p => 'Aus einem Karton ' + fmt(p[0], 4) + ' cm × ' + fmt(p[1], 4) + ' cm schneidet man an den Ecken gleich grosse Quadrate aus und faltet eine offene Schachtel. Wann ist ihr Volumen am grössten?',
      vx: 'x = Seite der ausgeschnittenen Quadrate (Höhe der Schachtel)', nb: p => '\\text{Länge }' + fmt(p[0], 4) + '-2x,\\quad \\text{Breite }' + fmt(p[1], 4) + '-2x', zn: 'V', raw: p => 'x*(' + p[0] + '-2*x)*(' + p[1] + '-2*x)', zt: p => 'V(x)=x\\cdot(' + fmt(p[0], 4) + '-2x)\\cdot(' + fmt(p[1], 4) + '-2x)', dom: p => [0, Math.min(p[0], p[1]) / 2], goal: 'max' },
    can: { t: 'Dose mit kleinster Oberfläche', pn: ['V'], pv: [1000], unit: 'cm', sit: p => 'Eine zylinderförmige Dose soll $V=' + fmt(p[0], 4) + '$ cm³ fassen. Bei welchem Radius braucht sie am wenigsten Blech (kleinste Oberfläche)?',
      vx: 'x = Radius r', nb: p => '\\pi x^2 h=' + fmt(p[0], 4) + '\\ \\Rightarrow\\ h=\\frac{' + fmt(p[0], 4) + '}{\\pi x^2}', zn: 'O', raw: p => '2*pi*x^2+' + 2 * p[0] + '/x', zt: p => 'O(x)=2\\pi x^2+2\\pi x\\cdot h=2\\pi x^2+\\frac{' + fmt(2 * p[0], 4) + '}{x}', dom: p => [0, 2.2 * Math.cbrt(p[0] / (2 * Math.PI))], goal: 'min' },
    para: { t: 'Rechteck unter einer Parabel', pn: ['c'], pv: [9], unit: '', sit: p => 'Unter der Parabel $y=' + fmt(p[0], 4) + '-x^2$ liegt ein zur y-Achse symmetrisches Rechteck auf der x-Achse. Wann ist seine Fläche am grössten?',
      vx: 'x = halbe Breite (rechte untere Ecke bei x)', nb: p => '\\text{Höhe } y=' + fmt(p[0], 4) + '-x^2,\\quad \\text{Breite } 2x', zn: 'A', raw: p => '2*x*(' + p[0] + '-x^2)', zt: p => 'A(x)=2x\\cdot(' + fmt(p[0], 4) + '-x^2)', dom: p => [0, Math.sqrt(p[0])], goal: 'max' }
  };
  function extSolve(k, p) {
    const E0 = EXT[k]; if (!E0) return null;
    const F = makeFnSafe(E0.raw(p)); if (!F) return null;
    const dm = E0.dom(p), K = Dif.kd(F, [dm[0] + 1e-9, dm[1] - 1e-9]);
    const c = (K.crit || []).filter(q => q.x > dm[0] + 1e-9 && q.x < dm[1] - 1e-9 && q.type === E0.goal);
    const best = c.length ? c.reduce((u, v) => (E0.goal === 'max' ? (F.f(0)(v.x) > F.f(0)(u.x) ? v : u) : (F.f(0)(v.x) < F.f(0)(u.x) ? v : u))) : null;
    return { E: E0, F, dom: dm, K, best };
  }
  const makeFnSafe = raw => { try { return Dif.makeFn(raw); } catch (e) { return null; } };
  function extDoc(k, p) {
    const r = extSolve(k, p), d = DOC(); if (!r) return d;
    const E0 = r.E, z = E0.zn, f = r.F.f(0), n = v => fmt(v, 4), u = E0.unit ? '\\,\\text{' + E0.unit + '}' : '';
    d.b.push({ k: 'sit', t: E0.sit(p), q: (E0.goal === 'max' ? { A: 'grösste Fläche', V: 'grösstes Volumen', O: 'grösste Oberfläche' } : { A: 'kleinste Fläche', V: 'kleinstes Volumen', O: 'kleinste Oberfläche' })[z] });
    d.h('1. Variable und Nebenbedingung');
    d.p('Wähle $' + E0.vx.replace(/ = /, '$ = ').replace(/^x\$/, 'x$') + '.');
    d.e(E0.nb(p));
    d.h('2. Zielfunktion und Definitionsbereich');
    d.e(E0.zt(p));
    d.e(n(r.dom[0]) + '<x<' + n(r.dom[1]));
    d.h('3. Ableiten und null setzen');
    d.e(z + "'(x)=" + tx(r.F.deriv(1)));
    if (!r.best) { d.note('Im Definitionsbereich gibt es keine passende Extremstelle.'); return d; }
    const xb = r.best.x, f2 = r.F.f(2)(xb);
    d.e(z + "'(x)=0\\quad\\Rightarrow\\quad x=" + r.best.xTex + (r.best.exact && !/^-?\d+$/.test(r.best.xTex) ? '\\approx ' + n(xb) : ''));
    d.h('4. Art des Extremums');
    d.e(z + "''(" + n(xb) + ')\\approx ' + n(f2) + (f2 < 0 ? '<0\\ \\Rightarrow\\ \\text{Maximum}' : '>0\\ \\Rightarrow\\ \\text{Minimum}'));
    d.h('5. Ergebnis');
    d.res('Für $x\\approx ' + n(xb) + u + '$ ist $' + z + '$ ' + (E0.goal === 'max' ? 'maximal' : 'minimal') + ': $' + z + '\\approx ' + n(f(xb)) + '$.');
    return d;
  }

  // ───────────────────── Polynom aus Bedingungen (Steckbriefaufgabe) ─────────────────────
  // Bedingungen: {t, x, y}  t: 'p' Punkt (x|y), 's' Steigung f′(x) = y, 'e' Extrempunkt (x|y), 'w' Wendepunkt (x|y), 'ex' Extremstelle x, 'wx' Wendestelle x
  const STB_T = [['p', 'Punkt P(x | y)'], ['e', 'Extrempunkt (x | y)'], ['w', 'Wendepunkt (x | y)'], ['s', 'Steigung f′(x) = m'], ['ex', 'Extremstelle x'], ['wx', 'Wendestelle x']];
  const STB_U = ['a', 'b', 'c', 'd', 'e'];
  function stbRows(n, cs) {                             // Gleichungen: {k (Ableitung), x, y}
    const out = [];
    cs.forEach(c => {
      if (c.t === 'p') out.push({ k: 0, x: c.x, y: c.y });
      else if (c.t === 's') out.push({ k: 1, x: c.x, y: c.y });
      else if (c.t === 'e') { out.push({ k: 0, x: c.x, y: c.y }); out.push({ k: 1, x: c.x, y: 0 }); }
      else if (c.t === 'w') { out.push({ k: 0, x: c.x, y: c.y }); out.push({ k: 2, x: c.x, y: 0 }); }
      else if (c.t === 'ex') out.push({ k: 1, x: c.x, y: 0 });
      else if (c.t === 'wx') out.push({ k: 2, x: c.x, y: 0 });
    });
    return out;
  }
  // Koeffizient von a_j (Potenz j) in der k-ten Ableitung an der Stelle x
  const stbCoef = (j, k, xq) => { if (j < k) return q0; let f = 1n; for (let i = 0; i < k; i++) f *= BigInt(j - i); return E.qMul(E.Q(f, 1n), E.qPow(xq, j - k)); };
  function stbSolve(n, cs) {
    const rows = stbRows(n, cs), m = n + 1;
    if (rows.length !== m) return { ok: false, rows, need: m };
    const A = rows.map(r => { const xq = qOf(r.x) || q0; return Array.from({ length: m }, (u, i) => stbCoef(n - i, r.k, xq)).concat([qOf(r.y) || q0]); });
    const M = A.map(r => r.slice());
    for (let c = 0; c < m; c++) {
      let piv = -1; for (let r = c; r < m; r++) if (!E.qIsZero(M[r][c])) { piv = r; break; }
      if (piv < 0) return { ok: false, rows, A, singular: true };
      [M[c], M[piv]] = [M[piv], M[c]];
      const pv = M[c][c]; M[c] = M[c].map(v => E.qDiv(v, pv));
      for (let r = 0; r < m; r++) if (r !== c && !E.qIsZero(M[r][c])) { const fct = M[r][c]; M[r] = M[r].map((v, i) => E.qSub(v, E.qMul(fct, M[c][i]))); }
    }
    const coef = M.map(r => r[m]);                      // a_n … a_0
    return { ok: true, rows, A, coef, P: coef.slice().reverse() };
  }
  function stbDoc(n, cs) {
    const d = DOC(), r = stbSolve(n, cs), un = STB_U.slice(0, n + 1), q = v => E.qTex(v);
    const ans = un.map((u, i) => (n - i === 0 ? u : u + (n - i === 1 ? 'x' : 'x^{' + (n - i) + '}'))).join('+');
    d.h('Polynom aus Bedingungen');
    d.p('**Ansatz:** Polynom vom Grad ' + n + ' mit ' + (n + 1) + ' Unbekannten:');
    d.e('f(x)=' + ans);
    const der = k => un.map((u, i) => { const j = n - i; if (j < k) return null; let fct = 1; for (let t = 0; t < k; t++) fct *= j - t; const pw = j - k; return (fct === 1 ? '' : fct) + u + (pw === 0 ? '' : pw === 1 ? 'x' : 'x^{' + pw + '}'); }).filter(Boolean).join('+');
    d.e("f'(x)=" + der(1) + (n >= 2 ? ",\\qquad f''(x)=" + der(2) : ''));
    d.p('**Bedingungen → Gleichungen:**');
    const names = { p: 'Punkt', e: 'Extrempunkt', w: 'Wendepunkt', s: 'Steigung', ex: 'Extremstelle', wx: 'Wendestelle' };
    cs.forEach(c => {
      const X = fmt(c.x, 4), Y = fmt(c.y, 4);
      const eqs = c.t === 'p' ? ['f(' + X + ')=' + Y] : c.t === 's' ? ["f'(" + X + ')=' + Y] : c.t === 'e' ? ['f(' + X + ')=' + Y, "f'(" + X + ')=0'] : c.t === 'w' ? ['f(' + X + ')=' + Y, "f''(" + X + ')=0'] : c.t === 'ex' ? ["f'(" + X + ')=0'] : ["f''(" + X + ')=0'];
      d.e('\\text{' + names[c.t] + ':}\\quad ' + eqs.join(',\\quad '));
    });
    if (!r.A) { d.note('Für ' + (n + 1) + ' Unbekannte braucht es genau ' + (n + 1) + ' Gleichungen; im Moment sind es ' + r.rows.length + '.'); return d; }
    d.p('**Gleichungssystem:**');
    r.A.forEach(row => { let s = ''; row.slice(0, n + 1).forEach((c, i) => { if (E.qIsZero(c)) return; const ng = E.qSgn(c) < 0, ab = E.qAbs(c), one = E.qEq(ab, q1); s += (ng ? '-' : s ? '+' : '') + (one ? '' : q(ab)) + un[i]; }); d.e((s || '0') + '=' + q(row[n + 1])); });
    if (!r.ok) { d.note('Das Gleichungssystem hat keine eindeutige Lösung: Die Bedingungen widersprechen sich oder legen das Polynom nicht fest.'); return d; }
    d.p('**Lösung** (z. B. mit dem Additions- oder Einsetzungsverfahren):');
    d.e(un.map((u, i) => u + '=' + q(r.coef[i])).join(',\\quad '));
    d.res('$f(x)=' + E.pTex(r.P, 'x') + '$');
    return d;
  }

  Object.assign(Dif, { RULES, rulesDoc, tangentDoc, hMethodDoc, secDoc, limDoc, limNum, LIM_H, EXT, extSolve, extDoc, STB_T, stbSolve, stbDoc, hLimit, trace, basic, linTex, docTex, texInline, texGuil, withSit, stDoc, stLines });
})();
