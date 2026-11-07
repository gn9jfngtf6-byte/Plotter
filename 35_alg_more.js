// ═══════════════════════════════════════════════════════════════════
// 35_alg_more.js — Algebra: Potenzen, Logarithmen, Bruchterme (ohne DOM, node-testbar)
//
// Ergänzt 33_alg_core.js (AlgCore) um drei weitere Darstellungen:
//   'pow'  Potenzgesetze   — Hochzahlen als «Bausteine» (Chips), Rechnen mit Hochzahlen
//   'log'  Logarithmen     — Logarithmus als Strecke auf einer logarithmischen Skala
//   'frac' Bruchterme      — Faktor-Bausteine: Kürzen, Hauptnenner, Definitionsmenge
// Einstieg: AlgMore.process(text, mode, vals, opt) → gleiche Ergebnisform wie
// AlgCore.process (ok, error, steps[{label,tex}], caption, fig, hints …).
// Bilder («Szene»): fig = {scene:true, prims, W, H, X0, Y0}; Primitive:
//   chip {x,y,w,h,s,hue,st}  text {x,y,s,ax,ay,hue,big}  line {x1,y1,x2,y2,dash,hue,thick,arrow}
//   dot {x,y,open,hue}  br {x1,x2,y,dir,s}  vbr {y1,y2,x,dir,s}  rr {x,y,w,h,hue,dash}
// Die Schritt-Texte (label) sind feste deutsche Wörter (werden übersetzt), tex ist LaTeX.
// ═══════════════════════════════════════════════════════════════════
const AlgMore = (function () {
  const C = (typeof AlgCore !== 'undefined') ? AlgCore : require('./33_alg_core.js');
  const { q, qadd, qmul, qneg, qinv, qeq, qzero, qnum, qabs, qsgn, qint, qpow, qsub, qdiv, qTex, ONE, ZERO } = C;
  const fail = msg => { throw new C.AlgError(msg); };
  const pOne = C.pConst(ONE);
  const wrapPar = t => '(' + t + ')';

  // ── Eingabe lesen ──────────────────────────────────────────────────
  // LaTeX aus dem Eingabefeld → einfacher Text (\frac{a}{b} → (a)/(b), \cdot → * …)
  function normalize(src) {
    let s = String(src == null ? '' : src);
    s = s.replace(/\\left|\\right/g, '').replace(/\\[,;:! ]/g, ' ').replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/');
    // Kurzschreibweisen von MathLive: \frac23, \sqrt2, \frac{x}2
    s = s.replace(/\\sqrt(?!\[)\s*([A-Za-z0-9])/g, '\\sqrt{$1}');
    s = s.replace(/\\frac\s*([A-Za-z0-9])\s*([A-Za-z0-9])/g, '\\frac{$1}{$2}').replace(/\\frac\s*([A-Za-z0-9])\s*\{/g, '\\frac{$1}{').replace(/(\\frac\{[^{}]*\})\s*([A-Za-z0-9])/g, '$1{$2}');
    for (let guard = 0; guard < 60; guard++) {
      const i = s.indexOf('\\frac'); if (i < 0) break;
      const grp = from => { let d = 0, j = from; if (s[j] !== '{') return null; for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (!d) break; } } return d ? null : { t: s.slice(from + 1, j), end: j + 1 }; };
      const A = grp(i + 5); if (!A) break; const Bg = grp(A.end); if (!Bg) break;
      s = s.slice(0, i) + '(' + A.t + ')/(' + Bg.t + ')' + s.slice(Bg.end);
    }
    return s;
  }
  // Text für das Eingabefeld (LaTeX)
  function fieldLatex(src) {
    const one = t => { try { return astTex(parse(t)).replace(/\\mathbb\{[A-Z]\}/g, ''); } catch (e) { return String(t == null ? '' : t); } };
    const str = String(src == null ? '' : src);
    if (/;|\\\\/.test(str) && !/root\(/.test(str)) return str.split(/\s*(?:;|\\;|\\\\|\n)\s*/).filter(x => x.trim()).map(one).join(';\\;');   // Gleichungssystem
    return one(str);
  }
  function tokenize(src) {
    let s = normalize(src)
      .replace(/\\(log|ln|lg|sqrt)/g, '$1').replace(/\\cdot/g, '*').replace(/\\left|\\right/g, '')
      .replace(/[−–—]/g, '-').replace(/[·×⋅]/g, '*').replace(/[÷:]/g, '/').replace(/√/g, 'sqrt')
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/\s+/g, '');
    const toks = []; let i = 0;
    while (i < s.length) {
      const rest = s.slice(i);
      let m = /^\d+(?:[.,]\d+)?/.exec(rest);
      if (m) { toks.push({ t: 'num', v: m[0].replace(',', '.') }); i += m[0].length; continue; }
      m = /^root\((\d+)[,;]/.exec(rest);
      if (m) { toks.push({ t: 'fn', v: 'sqrt', idx: parseInt(m[1], 10) }); toks.push({ t: 'op', v: '(' }); i += m[0].length; continue; }
      m = /^cbrt/.exec(rest);
      if (m) { toks.push({ t: 'fn', v: 'sqrt', idx: 3 }); i += 4; continue; }
      m = /^sqrt(?:\[(\d+)\])?/.exec(rest);
      if (m) { toks.push({ t: 'fn', v: 'sqrt', idx: m[1] ? parseInt(m[1], 10) : 2 }); i += m[0].length; continue; }
      m = /^(log|ln|lg)(?:_\{(\d+)\}|_\((\d+)\)|_(\d+)|(\d+)(?=\())?/.exec(rest);
      if (m) {
        const b = m[2] || m[3] || m[4] || m[5];
        toks.push({ t: 'fn', v: m[1], base: b ? parseInt(b, 10) : null }); i += m[0].length; continue;
      }
      m = /^[A-Za-z]/.exec(rest);
      if (m) { toks.push({ t: 'id', v: m[0] }); i++; continue; }
      if ('+-*/^()='.indexOf(s[i]) >= 0) { toks.push({ t: 'op', v: s[i] }); i++; continue; }
      if (s[i] === '{' || s[i] === '}') { toks.push({ t: 'op', v: s[i] === '{' ? '(' : ')' }); i++; continue; }
      fail('Unbekanntes Zeichen «' + s[i] + '»');
    }
    return toks;
  }
  function decimalToQ(str) {
    const [a, b] = str.split('.');
    if (!b) return q(parseInt(a, 10));
    return q(parseInt(a + b, 10), Math.pow(10, b.length));
  }
  // AST: num{v} var{n} neg{a} add{a[]} mul{a[]} div{a,b} pow{a,e,sqrt?} paren{a} call{fn,base,a} eq{l,r}
  function parse(src) {
    const toks = tokenize(src); let pos = 0;
    const peek = () => toks[pos];
    const isOp = v => peek() && peek().t === 'op' && peek().v === v;
    const startsPrimary = () => { const k = peek(); return k && (k.t === 'num' || k.t === 'id' || k.t === 'fn' || (k.t === 'op' && k.v === '(')); };
    function equation() { const l = expr(); if (isOp('=')) { pos++; const r = expr(); return { t: 'eq', l, r }; } return l; }
    function expr() {
      const items = []; let sign = 1;
      if (isOp('-')) { pos++; sign = -1; } else if (isOp('+')) pos++;
      let t = term(); items.push(sign < 0 ? { t: 'neg', a: t } : t);
      while (isOp('+') || isOp('-')) {
        const neg = peek().v === '-'; pos++;
        t = term(); items.push(neg ? { t: 'neg', a: t } : t);
      }
      return items.length === 1 ? items[0] : { t: 'add', a: items };
    }
    const mulNode = (a, b) => (a.t === 'mul' ? { t: 'mul', a: a.a.concat([b]) } : { t: 'mul', a: [a, b] });
    function term() {
      let left = unary();
      for (;;) {
        if (isOp('*')) { pos++; left = mulNode(left, unary()); }
        else if (isOp('/')) { pos++; left = { t: 'div', a: left, b: unary() }; }
        else if (startsPrimary()) left = mulNode(left, power());
        else break;
      }
      return left;
    }
    function unary() {
      if (isOp('-')) { pos++; return { t: 'neg', a: unary() }; }
      if (isOp('+')) { pos++; return unary(); }
      return power();
    }
    function power() {
      const b = primary();
      if (isOp('^')) {
        pos++;
        let e;
        if (isOp('(')) { pos++; e = expr(); if (!isOp(')')) fail('Klammer fehlt'); pos++; }
        else {
          let neg = false; if (isOp('-')) { pos++; neg = true; } else if (isOp('+')) pos++;
          const k = peek();
          if (k && k.t === 'num') { pos++; e = { t: 'num', v: decimalToQ(k.v) }; }
          else if (k && k.t === 'id') { pos++; e = { t: 'var', n: k.v }; }
          else fail('Hochzahl fehlt');
          if (neg) e = { t: 'neg', a: e };
        }
        return { t: 'pow', a: b, e };
      }
      return b;
    }
    function primary() {
      const k = peek();
      if (!k) fail('Term unvollständig');
      if (k.t === 'num') { pos++; return { t: 'num', v: decimalToQ(k.v) }; }
      if (k.t === 'id') { pos++; return { t: 'var', n: k.v }; }
      if (k.t === 'fn') {
        pos++;
        let arg;
        if (isOp('(')) { pos++; arg = expr(); if (!isOp(')')) fail('Klammer fehlt'); pos++; }
        else { const sv = pos; arg = power(); if (pos === sv) fail('Term unvollständig'); }
        if (k.v === 'sqrt') { const ix = k.idx || 2; if (ix < 2 || ix > 12) fail('Der Wurzelexponent muss zwischen 2 und 12 liegen'); return { t: 'pow', a: { t: 'paren', a: arg }, e: { t: 'num', v: q(1, ix) }, sqrt: true, idx: ix }; }
        return { t: 'call', fn: k.v, base: k.base, a: arg };
      }
      if (isOp('(')) { pos++; const e = expr(); if (!isOp(')')) fail('Klammer fehlt'); pos++; return { t: 'paren', a: e }; }
      fail('Unerwartetes Zeichen «' + k.v + '»');
    }
    if (!toks.length) fail('Bitte einen Term eingeben');
    const e = equation();
    if (pos < toks.length) fail('Unerwartetes Zeichen «' + toks[pos].v + '»');
    return e;
  }
  const strip = n => { while (n && n.t === 'paren') n = n.a; return n; };

  // ── LaTeX des eingegebenen Terms ───────────────────────────────────
  const baseTexOf = (fn, base) => (fn === 'ln' ? '\\ln' : (base === null || base === undefined || base === 10 ? '\\log_{10}' : '\\log_{' + base + '}'));
  function astTex(n) {
    switch (n.t) {
      case 'num': return qTex(n.v);
      case 'var': return n.n;
      case 'paren': return '(' + astTex(n.a) + ')';
      case 'neg': return '-' + astTex(n.a);
      case 'add': return n.a.map((it, i) => (it.t === 'neg' ? (i ? ' - ' : '-') + astTex(it.a) : (i ? ' + ' : '') + astTex(it))).join('');
      case 'mul': {
        let s = '';
        n.a.forEach((p, i) => {
          const t = astTex(p);
          if (i && (/^[0-9]/.test(t) || p.t === 'num' || (p.t === 'pow' && n.a[i - 1].t === 'pow') || p.t === 'div' || n.a[i - 1].t === 'div')) s += '\\cdot ';
          s += t;
        });
        return s;
      }
      case 'div': {
        if (n.a.t === 'mul' && n.a.a.length >= 2 && n.a.a.some(p => p.t === 'div')) return astTex({ t: 'mul', a: n.a.a.slice(0, -1).concat([{ t: 'div', a: n.a.a[n.a.a.length - 1], b: n.b }]) });
        return '\\frac{' + astTex(strip(n.a)) + '}{' + astTex(strip(n.b)) + '}';
      }
      case 'pow': {
        if (n.sqrt) return (n.idx > 2 ? '\\sqrt[' + n.idx + ']{' : '\\sqrt{') + astTex(strip(n.a)) + '}';
        const b = n.a, bt = astTex(b);
        const needs = ['neg', 'add', 'mul', 'div', 'pow'].indexOf(b.t) >= 0 || (b.t === 'num' && (b.v[0] < 0 || b.v[1] !== 1));
        return (needs ? wrapPar(bt) : bt) + '^{' + astTex(strip(n.e)) + '}';
      }
      case 'call': {
        const a = strip(n.a);
        const simple = a.t === 'num' || a.t === 'var' || (a.t === 'pow' && (a.a.t === 'var' || a.a.t === 'num') && !a.sqrt);
        return baseTexOf(n.fn, n.base) + (simple ? ' ' + astTex(a) : '(' + astTex(a) + ')');
      }
      case 'eq': return astTex(n.l) + ' = ' + astTex(n.r);
    }
    return '';
  }

  // ── Hilfen ─────────────────────────────────────────────────────────
  function toPoly(n) { // Polynom aus AST (für Hochzahlen und Summen in Klammern)
    switch (n.t) {
      case 'num': return C.pConst(n.v);
      case 'var': return C.pVar(n.n);
      case 'paren': return toPoly(n.a);
      case 'neg': return C.pNeg(toPoly(n.a));
      case 'add': return n.a.map(toPoly).reduce(C.pAdd, []);
      case 'mul': return n.a.map(toPoly).reduce(C.pMul, pOne);
      case 'div': { const d = toPoly(n.b); if (!d.length || !C.pIsConst(d)) fail('Hier wird nur durch Zahlen geteilt'); return C.pScale(toPoly(n.a), qinv(d[0].c)); }
      case 'pow': {
        const e = toPoly(n.e);
        if (!e.length || !C.pIsConst(e) || !qint(e[0].c) || e[0].c[0] < 0 || e[0].c[0] > 20) fail('Hier nur ganze Hochzahlen von 0 bis 20');
        return C.pPow(toPoly(n.a), e[0].c[0]);
      }
    }
    fail('Hier nicht erlaubt');
  }
  const pConstVal = p => (p.length === 0 ? ZERO : (C.pIsConst(p) ? p[0].c : null));
  function primeFactors(n) {
    const out = []; n = Math.abs(n);
    if (n < 2) return out;
    for (let p = 2; p * p <= n; p += (p === 2 ? 1 : 2)) {
      if (n % p === 0) { let e = 0; while (n % p === 0) { n /= p; e++; } out.push([p, e]); }
    }
    if (n > 1) out.push([n, 1]);
    return out;
  }
  const simpleTex = t => /^[A-Za-z0-9.]$|^\d+$|^[A-Za-z]$/.test(t);
  const hasTopSign = t => { let d = 0; for (let i = 1; i < t.length; i++) { const c = t[i]; if (c === '(' || c === '{') d++; else if (c === ')' || c === '}') d--; else if (d === 0 && (c === '+' || c === '-')) return true; } return false; };
  const wrapMul = t => (hasTopSign(t) || /^-/.test(t) ? wrapPar(t) : t);
  const joinMul = (a, b) => (a === '1' ? b : b === '1' ? a : wrapMul(a) + '\\cdot ' + wrapMul(b));
  const negTex = t => (t[0] === '-' ? t.slice(1) : (hasTopSign(t) ? '-' + wrapPar(t) : '-' + t));
  const fmtQ = a => qTex(a);
  const cmpNum = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  // ── Szene (Bild als Primitive) ─────────────────────────────────────
  function Scene() {
    const prims = []; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const bb = (a, b, c, d) => { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c); y1 = Math.max(y1, d); };
    const S = {
      prims,
      chip(x, y, w, s, hue, st) { prims.push({ k: 'chip', x, y, w, h: 1, s, hue: hue || 0, st: st || '' }); bb(x, y, x + w, y + 1); return S; },
      text(x, y, s, o) { prims.push(Object.assign({ k: 'text', x, y, s, ax: 'c', ay: 'm' }, o || {})); bb(x, y, x, y); return S; },
      line(x1_, y1_, x2_, y2_, o) { prims.push(Object.assign({ k: 'line', x1: x1_, y1: y1_, x2: x2_, y2: y2_ }, o || {})); bb(Math.min(x1_, x2_), Math.min(y1_, y2_), Math.max(x1_, x2_), Math.max(y1_, y2_)); return S; },
      dot(x, y, o) { prims.push(Object.assign({ k: 'dot', x, y }, o || {})); bb(x, y, x, y); return S; },
      br(xa, xb, y, dir, s) { prims.push({ k: 'br', x1: xa, x2: xb, y, dir, s }); bb(xa, y - 0.3, xb, y + 0.3); return S; },
      vbr(ya, yb, x, dir, s) { prims.push({ k: 'vbr', y1: ya, y2: yb, x, dir, s }); bb(x - 0.3, ya, x + 0.3, yb); return S; },
      curve(pts, o) { prims.push(Object.assign({ k: 'curve', pts }, o || {})); pts.forEach(pt => bb(pt[0], pt[1], pt[0], pt[1])); return S; },
      fpoly(pts, o) { prims.push(Object.assign({ k: 'fpoly', pts }, o || {})); pts.forEach(pt => bb(pt[0], pt[1], pt[0], pt[1])); return S; },
      rr(x, y, w, h, o) { prims.push(Object.assign({ k: 'rr', x, y, w, h }, o || {})); bb(x, y, x + w, y + h); return S; },
      fig() { if (x0 === Infinity) { x0 = 0; y0 = 0; x1 = 1; y1 = 1; } return { scene: true, prims, W: Math.max(x1 - x0, 1e-6), H: Math.max(y1 - y0, 1e-6), X0: x0, Y0: y0 }; }
    };
    return S;
  }
  const chipW = s => { const t = String(s).replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}^_]/g, ''); return Math.max(1, 0.42 * t.length + 0.62); };

  // ══════════════════════════════════════════════════════════════════
  // Potenzen
  // ══════════════════════════════════════════════════════════════════
  // MG = {c, cn[], cd[], occ[]}: Zahlenfaktor c (mit Vorzeichen), Zahlen im Zähler/Nenner (nur zur Anzeige),
  // occ = Potenzen {key, base(tex), kind 'L'|'N'|'S', val, e(Polynom), term(tex), den}
  const mgOne = () => ({ c: ONE, cn: [], cd: [], occ: [] });
  const mgMul = (a, b) => ({ c: qmul(a.c, b.c), cn: a.cn.concat(b.cn), cd: a.cd.concat(b.cd), occ: a.occ.concat(b.occ) });
  const mgInv = a => ({ c: qinv(a.c), cn: a.cd.slice(), cd: a.cn.slice(), occ: a.occ.map(o => Object.assign({}, o, { den: !o.den })) });
  const letterOcc = n => ({ key: 'l:' + n, base: n, kind: 'L', e: pOne, term: '1', den: false });
  const numOcc = v => ({ key: 'n:' + v, base: String(v), kind: 'N', val: v, e: pOne, term: '1', den: false });
  const litPow = (t, n) => (n === 1 ? t : (/^\d+$/.test(t) ? t : wrapPar(t)) + '^{' + n + '}');

  function evalPow(n, F) {
    switch (n.t) {
      case 'num': { const g = mgOne(); g.c = n.v; g.cn.push(qTex(qabs(n.v))); return g; }
      case 'var': { const g = mgOne(); g.occ.push(letterOcc(n.n)); return g; }
      case 'neg': { const g = evalPow(n.a, F); g.c = qneg(g.c); return g; }
      case 'paren': {
        const inner = strip(n);
        if (inner.t === 'add') {
          const p = toPoly(inner), g = mgOne(), cv = pConstVal(p);
          if (cv) { g.c = cv; g.cn.push(qTex(qabs(cv))); return g; }
          g.occ.push({ key: 's:' + C.polyTxt(p), base: '(' + C.polyTex(p) + ')', kind: 'S', e: pOne, term: '1', den: false });
          return g;
        }
        return evalPow(n.a, F);
      }
      case 'add': fail('Hier nur Produkte, Quotienten und Potenzen – Summen gehören in Klammern');
      case 'mul': return n.a.map(x => evalPow(x, F)).reduce(mgMul);
      case 'div': F.div = true; return mgMul(evalPow(n.a, F), mgInv(evalPow(n.b, F)));
      case 'pow': return powNode(n, F);
      case 'call': fail('Logarithmen gibt man in der Darstellung «Logarithmen» ein');
      case 'eq': fail('Hier keine Gleichungen');
    }
    fail('Unbekannter Term');
  }
  function powNode(n, F) {
    const ep = toPoly(n.e), epc = pConstVal(ep), ept = astTex(strip(n.e));
    const negConst = epc && qsgn(epc) < 0;
    const b0 = strip(n.a);
    if (!n.sqrt && b0.t === 'num' && qint(b0.v) && b0.v[0] >= 2) {
      const g = mgOne(), o = numOcc(b0.v[0]);
      o.e = negConst ? C.pNeg(ep) : ep; o.term = negConst ? qTex(qabs(epc)) : ept; o.den = !!negConst;
      if (negConst) F.neg = true;
      g.occ.push(o); return g;
    }
    if (b0.t === 'num' && qzero(b0.v)) fail('Die Basis 0 wird hier nicht behandelt');
    let g = evalPow(n.a, F);
    const atom = g.occ.length === 1 && g.occ[0].term === '1' && !g.occ[0].den && qeq(g.c, ONE) && !g.cn.length && !g.cd.length;
    if (!atom) {
      if (g.occ.some(o => o.term !== '1')) F.powpow = true;
      const numItems = g.occ.filter(o => !o.den).length + (g.cn.length ? 1 : 0), denItems = g.occ.filter(o => o.den).length + (g.cd.length ? 1 : 0);
      if (numItems >= 2 || denItems >= 2) F.powprod = true;
      if (denItems >= 1) F.powquot = true;
    }
    if (!epc && !qeq(g.c, ONE)) { // Zahlenfaktor mit symbolischer Hochzahl: Zahl wird Basis
      if (!qint(g.c) || g.c[0] < 2) fail('Zahlenfaktor mit Variablen-Hochzahl: nur positive ganze Zahlen');
      g = { c: ONE, cn: [], cd: [], occ: g.occ.concat([numOcc(g.c[0])]) };
    }
    if (epc && !qint(epc) && !qeq(g.c, ONE)) fail('Wurzeln aus Zahlenfaktoren rechnet man hier nicht');
    const mulPoly = negConst ? C.pNeg(ep) : ep, mulTex = negConst ? qTex(qabs(epc)) : ept;
    if (negConst) F.neg = true;
    const out = { c: g.c, cn: g.cn, cd: g.cd, occ: g.occ.map(o => Object.assign({}, o, { e: C.pMul(o.e, mulPoly), term: joinMul(o.term, mulTex), den: negConst ? !o.den : o.den })) };
    if (epc && qint(epc)) {
      const k = Math.abs(epc[0]); if (k > 60) fail('Hochzahl zu gross');
      let c = qpow(g.c, k), cn = g.cn.map(t => litPow(t, k)), cd = g.cd.map(t => litPow(t, k));
      if (negConst) { c = qinv(c); const t = cn; cn = cd; cd = t; }
      out.c = c; out.cn = cn; out.cd = cd;
    }
    return out;
  }

  const occTex = o => o.base + (o.term === '1' ? '' : '^{' + o.term + '}');
  const sideTex = parts => (parts.length ? parts.join('\\cdot ') : '1');
  function distTex(g) {
    const num = g.cn.concat(g.occ.filter(o => !o.den).map(occTex));
    const den = g.cd.concat(g.occ.filter(o => o.den).map(occTex));
    const body = den.length ? '\\frac{' + sideTex(num) + '}{' + sideTex(den) + '}' : sideTex(num);
    return (qsgn(g.c) < 0 ? '-' : '') + body;
  }
  function baseRoot(v) {
    for (let k = 2; Math.pow(2, k) <= v; k++) {
      const r = Math.round(Math.pow(v, 1 / k));
      if (r >= 2 && Math.pow(r, k) === v) { const [r2, k2] = baseRoot(r); return [r2, k * k2]; }
    }
    return [v, 1];
  }
  const expTex = E => { const c = pConstVal(E); return c ? (qeq(c, ONE) ? '' : qTex(c)) : C.polyTex(E); };
  const powBaseTex = (o, E) => { const t = expTex(E); return o.base + (t === '' ? '' : '^{' + t + '}'); };
  const kindRank = k => (k === 'N' ? 0 : k === 'S' ? 1 : 2);
  function joinProd(parts) {
    let s = '';
    parts.forEach((p, i) => { if (i && /^[0-9]/.test(p)) s += '\\cdot '; s += p; });
    return s;
  }
  function coefParts(c) { return qeq(qabs(c), ONE) ? [] : [qTex(qabs(c))]; }
  function resultTex(c, groups, splitNeg) {
    // groups: [{o, E}] (E ≠ 0) → Text; mit splitNeg werden negative Hochzahlen in den Nenner verschoben
    const isNeg = G => { const cv = pConstVal(G.E); return cv && qsgn(cv) < 0; };
    const numG = groups.filter(G => !(splitNeg && isNeg(G))), denG = splitNeg ? groups.filter(isNeg) : [];
    const sign = qsgn(c) < 0 ? '-' : '';
    const ca = qabs(c);
    const numParts = (ca[0] !== 1 ? [String(ca[0])] : []).concat(numG.map(G => powBaseTex(G.o, G.E)));
    const denParts = (ca[1] !== 1 ? [String(ca[1])] : []).concat(denG.map(G => powBaseTex(G.o, C.pNeg(G.E))));
    if (!splitNeg) {
      const parts = (qeq(ca, ONE) ? [] : [qTex(ca)]).concat(groups.map(G => powBaseTex(G.o, G.E)));
      return sign + (parts.length ? joinProd(parts) : '1');
    }
    if (!denParts.length) return sign + (numParts.length ? joinProd(numParts) : '1');
    return sign + '\\frac{' + (numParts.length ? joinProd(numParts) : '1') + '}{' + joinProd(denParts) + '}';
  }

  function processPow(ast, text, vals, opt) {
    const F = {};
    let g = evalPow(ast, F);
    const out = { steps: [], hints: [], vars: [], kind: 'pow' };
    const given = astTex(ast);
    const dt0 = distTex(g);
    const push = (label, tex) => { const l = out.steps[out.steps.length - 1]; if (l && l.tex === tex && label !== 'Wert') return; out.steps.push({ label, tex }); };
    push('Gegeben', given);
    if (qzero(g.c)) { out.caption = given + ' = 0'; out.captionTxt = '0'; push('Ergebnis', '0'); return out; }
    // Gesetze
    const grp0 = new Map();
    g.occ.forEach(o => { if (!grp0.has(o.key)) grp0.set(o.key, []); grp0.get(o.key).push(o); });
    // Zahlenbasen auf gleiche Basis bringen
    const rewrites = [];
    const nv = [...new Set(g.occ.filter(o => o.kind === 'N').map(o => o.val))];
    if (nv.length > 1) {
      const byRoot = new Map(); nv.forEach(v => { const [r, k] = baseRoot(v); if (!byRoot.has(r)) byRoot.set(r, []); byRoot.get(r).push([v, k]); });
      byRoot.forEach((arr, r) => { if (arr.length > 1) arr.forEach(([v, k]) => { if (v !== r) rewrites.push([v, r, k]); }); });
      if (rewrites.length) {
        g = Object.assign({}, g, { occ: g.occ.map(o => {
          const rw = o.kind === 'N' && rewrites.find(x => x[0] === o.val);
          if (!rw) return o;
          return Object.assign({}, numOcc(rw[1]), { e: C.pMul(o.e, C.pConst(q(rw[2]))), term: joinMul(String(rw[2]), o.term), den: o.den });
        }) });
        F.rewrite = true;
      }
    }
    const groups0 = new Map();
    g.occ.forEach(o => { if (!groups0.has(o.key)) groups0.set(o.key, []); groups0.get(o.key).push(o); });
    let prodL = false, quotL = false;
    groups0.forEach(os => { const p = os.filter(o => !o.den).length, d = os.filter(o => o.den).length; if (p >= 2 || d >= 2) prodL = true; if (p >= 1 && d >= 1) quotL = true; });
    const laws = [];
    const L = (k, label, tex) => laws.push({ k, label, tex });
    if (prodL) L('prod', 'Produktregel', 'a^{m}\\cdot a^{n}=a^{m+n}');
    if (quotL) L('quot', 'Quotientenregel', '\\frac{a^{m}}{a^{n}}=a^{m-n}');
    if (F.powpow) L('powpow', 'Potenz einer Potenz', '\\left(a^{m}\\right)^{n}=a^{m\\cdot n}');
    if (F.powprod) L('powprod', 'Potenz eines Produkts', '(a\\cdot b)^{n}=a^{n}\\cdot b^{n}');
    if (F.powquot) L('powquot', 'Potenz eines Quotienten', '\\left(\\frac{a}{b}\\right)^{n}=\\frac{a^{n}}{b^{n}}');
    if (F.neg) L('neg', 'Negative Hochzahl', 'a^{-n}=\\frac{1}{a^{n}}');
    // Gruppen, Hochzahlen
    const groups = [];
    groups0.forEach((os, key) => {
      let E = [];
      os.forEach(o => { E = C.pAdd(E, o.den ? C.pNeg(o.e) : o.e); });
      groups.push({ key, os, o: os[0], E, kind: os[0].kind });
    });
    const zeroG = groups.filter(G => !G.E.length);
    if (zeroG.length) L('zero', 'Hochzahl null', 'a^{0}=1');
    // Reihenfolge der Schritte
    laws.forEach(l => out.steps.push({ label: l.label, tex: l.tex }));
    if ((F.powpow || F.powprod || F.powquot) && dt0 !== given) push('Klammern auflösen', dt0);
    if (rewrites.length) {
      push('Auf gleiche Basis bringen', rewrites.map(([v, r, k]) => v + '=' + r + '^{' + k + '}').join(',\\;'));
    }
    // Zusammenfassen
    const signedTerm = (o) => { let t = o.term, neg = !!o.den; if (t[0] === '-') { t = t.slice(1); neg = !neg; } if (hasTopSign(t) && (neg || false)) t = wrapPar(t); return { neg, t }; };
    const sumStr = os => os.map(signedTerm).map((s, i) => (i === 0 ? (s.neg ? '-' : '') : (s.neg ? '-' : '+')) + s.t).join('');
    const cparts = []; if (g.cn.length || g.cd.length) { cparts.push('\\frac{' + sideTex(g.cn) + '}{' + sideTex(g.cd) + '}'); }
    const needCombine = groups.some(G => G.os.length > 1);
    const combTex = (qsgn(g.c) < 0 ? '-' : '') + joinProd(cparts.concat(groups.map(G => G.o.base + (sumStr(G.os) === '1' ? '' : '^{' + sumStr(G.os) + '}'))));
    if (needCombine || cparts.length) {
      if (g.cd.length === 0 && !needCombine) { /* nur Zahlen – wird unten ausgerechnet */ }
      else push('Gleiche Basen zusammenfassen', combTex);
    }
    // Hochzahlen ausrechnen
    const live = groups.filter(G => G.E.length).sort((a, b) => kindRank(a.kind) - kindRank(b.kind) || (a.kind === 'N' ? cmpNum(a.o.val, b.o.val) : cmpNum(a.o.base, b.o.base)));
    const evalTex = resultTex(g.c, live, false);
    const anyNeg = live.some(G => { const cv = pConstVal(G.E); return cv && qsgn(cv) < 0; });
    if (needCombine || !anyNeg) push('Ausrechnen', evalTex);
    let finalTex = evalTex;
    if (anyNeg) { finalTex = resultTex(g.c, live, true); push('Negative Hochzahlen in den Nenner', finalTex); }
    else if (!qint(g.c) && live.length) { finalTex = resultTex(g.c, live, true); }
    if (out.steps.length === 1) out.hints.push('Der Term ist schon vereinfacht.');
    if (zeroG.length) out.hints.push('Eine Potenz mit Hochzahl 0 ist 1 (die Basis darf nicht 0 sein).');
    // Zahlenwert
    const numeric = live.every(G => G.kind === 'N' && pConstVal(G.E) && qint(pConstVal(G.E)));
    let valueTex = null;
    if (numeric) {
      try {
        let v = g.c;
        for (const G of live) { const e = pConstVal(G.E)[0]; if (Math.abs(e) > 60) throw new Error('big'); const p = qpow(q(G.o.val), Math.abs(e)); v = qmul(v, e >= 0 ? p : qinv(p)); }
        valueTex = qTex(v);
        if (live.length && valueTex !== finalTex) out.steps.push({ label: 'Wert', tex: finalTex + '=' + valueTex });
        else if (!live.length) finalTex = valueTex;
      } catch (e) { valueTex = null; }
    }
    out.caption = given + ' = ' + finalTex + (valueTex && valueTex !== finalTex && live.length ? ' = ' + valueTex : '');
    out.captionTxt = given;
    out.fig = powFigure(ast, groups, g);
    out.law = laws.map(l => l.k);
    return out;
  }

  // ── Bilder zu den Potenzen ─────────────────────────────────────────
  const GAP = 1.14;
  function atomOf(n) {
    n = strip(n);
    if (n.t === 'var') return { key: 'l:' + n.n, lab: n.n };
    if (n.t === 'num' && qint(n.v) && n.v[0] >= 2) return { key: 'n:' + n.v[0], lab: String(n.v[0]) };
    return null;
  }
  const smallInt = (n, lo, hi) => { try { const c = pConstVal(toPoly(n)); return c && qint(c) && c[0] >= lo && c[0] <= hi ? c[0] : null; } catch (e) { return null; } };
  function powInt(n, hi) { // atom oder atom^m
    n = strip(n);
    const a = atomOf(n); if (a) return { a, m: 1, plain: true };
    if (n.t === 'pow' && !n.sqrt) { const a2 = atomOf(n.a), m = smallInt(n.e, 1, hi || 12); if (a2 && m) return { a: a2, m }; }
    return null;
  }
  const pw = (lab, e) => lab + (e === 1 ? '' : '^{' + e + '}');
  function chipRow(S, x, y, n, lab, hue, st) { for (let i = 0; i < n; i++) S.chip(x + i * GAP, y, 1, lab, hue, st || ''); return x + n * GAP - (GAP - 1); }

  function powFigure(ast, groups, g) {
    try {
      const s = strip(ast), S = Scene();
      if (s.t === 'mul') {
        const parts = s.a.map(x => powInt(x, 14));
        if (parts.length >= 2 && parts.every(p => p && p.a.key === parts[0].a.key) && parts.reduce((a, p) => a + p.m, 0) <= 26) return figProduct(S, parts);
      }
      if (s.t === 'div') {
        const a = powInt(s.a, 14), b = powInt(s.b, 14);
        if (a && b && a.a.key === b.a.key) return figQuot(S, a, b);
      }
      if (s.t === 'pow' && !s.sqrt) {
        const n = smallInt(s.e, -8, 8), b = strip(s.a);
        if (n !== null && n !== 0) {
          if (b.t === 'pow' && !b.sqrt) { const pi = powInt(b, 8); if (pi && n > 0) return figPowPow(S, pi, n); }
          const at = atomOf(b); if (at) return n > 0 ? figProduct(S, [{ a: at, m: n }]) : figNeg(S, at, -n);
          if (b.t === 'mul' && n > 0 && n <= 6) { const at2 = b.a.map(x => atomOf(x)); if (at2.length >= 2 && at2.length <= 3 && at2.every(Boolean)) return figPowProd(S, at2, n, false); }
          if (b.t === 'div' && n > 0 && n <= 6) { const a1 = atomOf(b.a), b1 = atomOf(b.b); if (a1 && b1) return figPowProd(S, [a1, b1], n, true); }
        }
      }
    } catch (e) { /* kein Bild */ }
    return powBalance(groups);
  }
  function figProduct(S, parts) {
    const lab = parts[0].a.lab, T = parts.reduce((a, p) => a + p.m, 0);
    let x = 0; const gapG = 1.1;
    parts.forEach((p, gi) => {
      const x0 = x; x = chipRow(S, x, 0, p.m, lab, gi);
      S.br(x0, x, 1.25, 'd', pw(lab, p.m));
      if (gi < parts.length - 1) { S.text(x + gapG / 2 + 0.07, 0.5, '\\cdot', { big: true }); x += gapG + 0.14; }
    });
    const W = x;
    const y2 = 3.3; let cx = 0;
    parts.forEach((p, gi) => { cx = chipRow(S, cx, y2, p.m, lab, gi) + (GAP - 1); });
    S.line(W / 2, 2.0, W / 2, 3.0, { arrow: true });
    const sum = parts.map(p => p.m).join('+');
    S.br(0, T * GAP - (GAP - 1), y2 + 1.25, 'd', parts.length > 1 ? pw(lab, '{' + sum + '}').replace('^{{', '^{').replace('}}', '}') + '=' + pw(lab, T) : pw(lab, T));
    return S.fig();
  }
  function figQuot(S, a, b) {
    const lab = a.a.lab, m = a.m, n = b.m, k = Math.min(m, n), w = Math.max(m, n) * GAP;
    chipRow(S, 0, 0, k, lab, 0, 'cut'); chipRow(S, k * GAP, 0, m - k, lab, 0, 'new');
    chipRow(S, 0, 1.9, k, lab, 1, 'cut'); chipRow(S, k * GAP, 1.9, n - k, lab, 1, 'new');
    S.line(-0.3, 1.45, w + 0.1, 1.45, { thick: true });
    S.text(-0.5, 0.5, pw(lab, m), { ax: 'r' }); S.text(-0.5, 2.4, pw(lab, n), { ax: 'r' });
    const res = m > n ? pw(lab, m - n) : m === n ? '1' : '\\frac{1}{' + pw(lab, n - m) + '}';
    S.text(w / 2, 3.9, '\\frac{' + pw(lab, m) + '}{' + pw(lab, n) + '}=' + pw(lab, '{' + m + '-' + n + '}').replace('^{{', '^{').replace('}}', '}') + '=' + res, { big: true });
    return S.fig();
  }
  function figPowPow(S, pi, n) {
    const lab = pi.a.lab, m = pi.m;
    for (let r = 0; r < n; r++) { chipRow(S, 0, r * GAP, m, lab, r); S.text(-0.45, r * GAP + 0.5, pw(lab, m), { ax: 'r' }); }
    const W = m * GAP - (GAP - 1), H = n * GAP - (GAP - 1);
    S.br(0, W, -0.3, 'u', 'm');
    S.vbr(0, H, W + 0.3, 'r', 'n');
    S.br(0, W, H + 0.3, 'd', '\\left(' + pw(lab, m) + '\\right)^{' + n + '}=' + pw(lab, m + '\\cdot ' + n) + '=' + pw(lab, m * n));
    return S.fig();
  }
  function figPowProd(S, ats, n, quot) {
    const k = ats.length, gw = k * GAP, step = gw + 0.6;
    if (!quot) {
      for (let i = 0; i < n; i++) {
        const x0 = i * step; ats.forEach((a, j) => S.chip(x0 + j * GAP, 0, 1, a.lab, j));
        S.rr(x0 - 0.12, -0.12, gw - (GAP - 1) + 0.24, 1.24, { dash: false });
      }
      const W = n * step - 0.6;
      S.line(W / 2, 1.4, W / 2, 2.2, { arrow: true });
      ats.forEach((a, j) => { const y = 2.6 + j * 1.5; chipRow(S, 0, y, n, a.lab, j); S.text(-0.5, y + 0.5, pw(a.lab, n), { ax: 'r' }); });
    } else {
      const [a, b] = ats;
      for (let i = 0; i < n; i++) {
        const x0 = i * (GAP + 0.6);
        S.chip(x0, 0, 1, a.lab, 0); S.line(x0 - 0.1, 1.5, x0 + 1.1, 1.5, { thick: true }); S.chip(x0, 1.95, 1, b.lab, 1);
      }
      const W = n * (GAP + 0.6) - 0.6;
      S.line(W / 2, 3.2, W / 2, 3.9, { arrow: true });
      chipRow(S, 0, 4.3, n, a.lab, 0); S.line(-0.2, 5.8, n * GAP + 0.1, 5.8, { thick: true }); chipRow(S, 0, 6.25, n, b.lab, 1);
      S.text(-0.5, 4.8, pw(a.lab, n), { ax: 'r' }); S.text(-0.5, 6.75, pw(b.lab, n), { ax: 'r' });
    }
    return S.fig();
  }
  function figNeg(S, at, n) {
    const lab = at.lab, w = n * GAP - (GAP - 1);
    S.text(w / 2, 0.4, '1', { big: true });
    S.line(-0.3, 1.0, w + 0.3, 1.0, { thick: true });
    chipRow(S, 0, 1.5, n, lab, 0);
    S.br(0, w, 2.75, 'd', pw(lab, n));
    S.text(w / 2, 4.5, pw(lab, '{-' + n + '}').replace('^{{', '^{').replace('}}', '}') + '=\\frac{1}{' + pw(lab, n) + '}', { big: true });
    return S.fig();
  }
  // Allgemein: Exponenten-Leiste je Basis (Strecken aneinandergehängt)
  function powBalance(groups) {
    const S = Scene();
    const rows = groups.filter(G => G.E.length && G.os.every(o => { const c = pConstVal(o.e); return c && qint(c) && Math.abs(c[0]) <= 24; }));
    if (!rows.length || rows.length !== groups.filter(G => G.E.length).length) return null;
    let y = 0; const u = 0.9; let hueN = 0;
    rows.forEach(G => {
      S.chip(-1.6, y, 1, G.o.base, G.o.kind === 'N' ? 3 : 0);
      let cur = 0; const xs = [];
      G.os.forEach(o => {
        const v = pConstVal(o.e)[0] * (o.den ? -1 : 1); if (v === 0) return;
        S.line(cur * u, y + 0.5, (cur + v) * u, y + 0.5, { arrow: true, hue: hueN % 6, thick: true });
        S.text((cur + v / 2) * u, y - 0.15, String(v > 0 ? '+' + v : v), { ay: 'b', hue: hueN % 6 }); cur += v; hueN++;
      });
      S.line(cur * u, y - 0.25, cur * u, y + 1.15, { dash: true });
      S.text(cur * u, y + 1.5, pw(G.o.base, cur === 1 ? '' : cur) + '', { ay: 't' });
      y += 3;
    });
    return S.fig();
  }

  // ══════════════════════════════════════════════════════════════════
  // Bruchterme
  // ══════════════════════════════════════════════════════════════════
  // FG = {s, z, num[], den[]}: Vorzeichen, «ist 0», Faktoren {key, p, e, c?} (c = Primzahl, sonst Polynom p)
  const fgOne = () => ({ s: 1, z: false, num: [], den: [] });
  const fgMul = (a, b) => ({ s: a.s * b.s, z: a.z || b.z, num: a.num.concat(b.num), den: a.den.concat(b.den) });
  const fgInv = a => { if (a.z) fail('Division durch 0'); return { s: a.s, z: false, num: a.den, den: a.num }; };
  function fgPow(a, n) {
    if (n === 0) return fgOne();
    const k = Math.abs(n), sc = l => l.map(f => Object.assign({}, f, { e: f.e * k }));
    const r = { s: (a.s < 0 && k % 2) ? -1 : 1, z: a.z, num: sc(a.num), den: sc(a.den) };
    return n < 0 ? fgInv(r) : r;
  }
  const cfac = (pr, e) => ({ key: 'c:' + pr, p: C.pConst(q(pr)), e, c: pr });
  const pfac = (p, e) => ({ key: 'p:' + C.polyTxt(p), p, e });
  function fgFromRat(v) {
    const g = fgOne();
    if (qzero(v)) { g.z = true; return g; }
    if (v[0] < 0) g.s = -1;
    if (Math.abs(v[0]) > 1e9 || v[1] > 1e9) fail('Zahl zu gross');
    primeFactors(Math.abs(v[0])).forEach(([p, e]) => g.num.push(cfac(p, e)));
    primeFactors(v[1]).forEach(([p, e]) => g.den.push(cfac(p, e)));
    return g;
  }
  function fgFromPoly(p) {
    if (!p.length) { const g = fgOne(); g.z = true; return g; }
    if (C.pIsConst(p)) return fgFromRat(p[0].c);
    const fi = C.factorPolyEx(p), g = fgFromRat(fi.k);
    fi.fac.forEach(f => g.num.push(pfac(f.p, f.e)));
    return g;
  }
  const cmpFac = (a, b) => (a.c ? 0 : 1) - (b.c ? 0 : 1) || (a.c && b.c ? a.c - b.c : (C.pDegree(a.p) - C.pDegree(b.p) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)));
  function mergeSide(list) {
    const m = new Map();
    list.forEach(f => { const o = m.get(f.key); if (o) o.e += f.e; else m.set(f.key, Object.assign({}, f)); });
    return [...m.values()].sort(cmpFac);
  }
  function normFG(g) {
    const m = new Map();
    g.num.forEach(f => { const o = m.get(f.key) || { f, e: 0 }; o.e += f.e; m.set(f.key, o); });
    g.den.forEach(f => { const o = m.get(f.key) || { f, e: 0 }; o.e -= f.e; m.set(f.key, o); });
    const num = [], den = [];
    m.forEach(({ f, e }) => { if (e > 0) num.push(Object.assign({}, f, { e })); else if (e < 0) den.push(Object.assign({}, f, { e: -e })); });
    return { s: g.s, z: g.z, num: num.sort(cmpFac), den: den.sort(cmpFac) };
  }
  const polyOf = list => list.reduce((p, f) => C.pMul(p, C.pPow(f.p, f.e)), pOne);

  function evalFrac(n, ctx) {
    const noteDiv = g => { g.num.concat(g.den).forEach(f => { if (!f.c) ctx.excl.push(f); }); };
    switch (n.t) {
      case 'num': return fgFromRat(n.v);
      case 'var': { const g = fgOne(); g.num.push(pfac(C.pVar(n.n), 1)); return g; }
      case 'neg': { const g = evalFrac(n.a, ctx); return Object.assign({}, g, { s: -g.s }); }
      case 'paren': return evalFrac(n.a, ctx);
      case 'mul': return n.a.map(x => evalFrac(x, ctx)).reduce(fgMul);
      case 'div': { const a = evalFrac(n.a, ctx), b = evalFrac(n.b, ctx); noteDiv(b); return fgMul(a, fgInv(b)); }
      case 'pow': {
        if (n.sqrt) fail('Wurzeln gibt es hier nicht – bitte mit Potenzen schreiben');
        const e = pConstVal(toPoly(n.e));
        if (!e || !qint(e) || Math.abs(e[0]) > 20) fail('Hier nur ganze Hochzahlen bis 20');
        const b = evalFrac(n.a, ctx); if (e[0] < 0) noteDiv(b);
        return fgPow(b, e[0]);
      }
      case 'add': return sumFG(n.a.map(x => evalFrac(x, ctx)));
      case 'call': fail('Logarithmen gibt man in der Darstellung «Logarithmen» ein');
      case 'eq': fail('Hier keine Gleichungen – ein Bruchterm genügt');
    }
    fail('Unbekannter Term');
  }
  function sumDetails(fgs) {
    const its = fgs.filter(g => !g.z).map(normFG);
    const lcm = new Map();
    const dens = its.map(g => { const m = new Map(); g.den.forEach(f => m.set(f.key, { f, e: f.e })); return m; });
    dens.forEach(m => m.forEach((o, k) => { const c = lcm.get(k); if (!c || c.e < o.e) lcm.set(k, { f: o.f, e: o.e }); }));
    const lcmList = [...lcm.values()].map(o => Object.assign({}, o.f, { e: o.e })).sort(cmpFac);
    const ext = its.map((g, i) => lcmList.map(L => { const have = dens[i].get(L.key); const e = L.e - (have ? have.e : 0); return e > 0 ? Object.assign({}, L, { e }) : null; }).filter(Boolean));
    const numPolys = its.map((g, i) => C.pScale(C.pMul(polyOf(g.num), polyOf(ext[i])), q(g.s)));
    let S = []; numPolys.forEach(p => { S = C.pAdd(S, p); });
    return { its, lcmList, ext, numPolys, S };
  }
  function sumFG(fgs) {
    const d = sumDetails(fgs);
    const g = fgFromPoly(d.S);
    if (g.z) return g;
    return normFG({ s: g.s, z: false, num: g.num, den: g.den.concat(d.lcmList) });
  }

  // Schreibweise
  function partsOf(list, o) {
    o = o || {}; const canc = o.canc ? new Map(o.canc) : new Map(); const parts = [];
    const consts = list.filter(f => f.c), rest = list.filter(f => !f.c);
    if (consts.length) {
      const split = o.split || consts.some(f => canc.has(f.key));
      if (split) consts.forEach(f => { for (let i = 0; i < f.e; i++) { const k = canc.get(f.key) || 0; if (k > 0) { canc.set(f.key, k - 1); parts.push({ t: String(f.c), cancel: true }); } else parts.push({ t: String(f.c) }); } });
      else { let v = 1; consts.forEach(f => { v *= Math.pow(f.c, f.e); }); parts.push({ t: String(v) }); }
    }
    const solo = !!o.bare && list.length === 1 && !list[0].c && list[0].e === 1;
    rest.forEach(f => {
      const base = f.p.length > 1 && !solo ? '(' + C.polyTex(f.p) + ')' : C.polyTex(f.p);
      const k = canc.get(f.key) || 0;
      if (k > 0) {
        parts.push({ t: (f.p.length > 1 ? '(' + C.polyTex(f.p) + ')' : C.polyTex(f.p)) + (k > 1 ? '^{' + k + '}' : ''), cancel: true });
        if (f.e - k > 0) parts.push({ t: base + (f.e - k > 1 ? '^{' + (f.e - k) + '}' : '') });
      } else parts.push({ t: base + (f.e > 1 ? '^{' + f.e + '}' : '') });
    });
    return parts;
  }
  function joinParts(parts) {
    if (!parts.length) return '1';
    let s = '';
    parts.forEach((p, i) => { const t = p.cancel ? '\\cancel{' + p.t + '}' : p.t; if (i && /^[0-9]/.test(p.t) && /[0-9}]$/.test(parts[i - 1].t)) s += '\\cdot '; s += t; });
    return s;
  }
  const sideStr = (list, o) => joinParts(partsOf(list, o));
  function fracStr(g, o) {
    o = o || {};
    const num = sideStr(g.num, { split: o.split, canc: o.cancN, bare: true }), den = sideStr(g.den, { split: o.split, canc: o.cancD, bare: true });
    const body = g.den.length ? '\\frac{' + num + '}{' + den + '}' : num;
    return (g.s < 0 ? '-' : '') + body;
  }
  // Definitionsmenge
  function hasRealRoots(p, v) {
    const a = (p.find(t => t.m[v] === 2) || { c: ZERO }).c, b = (p.find(t => t.m[v] === 1) || { c: ZERO }).c, c = (p.find(t => !Object.keys(t.m).length) || { c: ZERO }).c;
    const disc = qadd(qmul(b, b), qneg(qmul(q(4), qmul(a, c))));
    return qsgn(disc) >= 0;
  }
  function domainInfo(excl) {
    const seen = new Map(); excl.forEach(f => { if (!f.c && !seen.has(f.key)) seen.set(f.key, f.p); });
    const roots = [], conds = [];
    seen.forEach(p => {
      const vs = C.pVars(p);
      if (vs.length === 1 && C.pDegree(p) === 1) {
        const v = vs[0], a = p.find(t => t.m[v] === 1).c, bt = p.find(t => !Object.keys(t.m).length), b = bt ? bt.c : ZERO;
        roots.push({ v, r: qneg(qmul(b, qinv(a))) });
      } else if (vs.length === 1 && C.pDegree(p) === 2 && !hasRealRoots(p, vs[0])) { /* nie 0 */ }
      else conds.push(p);
    });
    roots.sort((a, b) => qnum(a.r) - qnum(b.r));
    return { roots, conds };
  }
  function domainTex(d) {
    if (!d.roots.length && !d.conds.length) return null;
    const vars = new Set(d.roots.map(r => r.v));
    if (!d.conds.length && vars.size === 1) return '\\mathbb{D}=\\mathbb{R}\\setminus\\{' + d.roots.map(r => qTex(r.r)).join(';\\,') + '\\}';
    return d.roots.map(r => r.v + '\\neq ' + qTex(r.r)).concat(d.conds.map(p => '(' + C.polyTex(p) + ')\\neq 0')).join(',\\;');
  }

  function processFrac(ast, text, vals, opt) {
    const ctx = { excl: [] }, out = { steps: [], hints: [], vars: [], kind: 'frac' };
    const given = astTex(ast), root = strip(ast);
    const push = (label, tex) => { const l = out.steps[out.steps.length - 1]; if (l && l.tex === tex) return; out.steps.push({ label, tex }); };
    push('Gegeben', given);
    const pure = !/[A-Za-z]/.test(text.replace(/\\[a-z]+/g, ''));   // nur Zahlen
    let items = null, raw, details = null, res, seq = null;
    if (root.t === 'add') {
      items = root.a.map(x => evalFrac(x, ctx));
      raw = null;
      try { details = sumDetails(items); res = sumFG(items); }
      catch (e) {
        // Der Hauptnenner aller Terme auf einmal wird zu gross → Term für Term addieren und nach jedem Schritt kürzen
        if (!(e instanceof C.AlgError) || !/zu gross/.test(e.message) || items.length < 3) throw e;
        seq = []; details = null;
        try { let acc = normFG(items[0]); items.slice(1).forEach(g => { acc = sumFG([acc, normFG(g)]); seq.push(acc); }); res = acc; }
        catch (e2) { if (e2 instanceof C.AlgError && /zu gross/.test(e2.message)) fail('Das Ergebnis wird zu gross (Zahlen über 9·10^15) – bitte weniger Terme oder Terme mit gemeinsamen Nennerfaktoren eingeben'); throw e2; }
      }
    } else {
      raw = evalFrac(ast, ctx); res = normFG(raw);
    }
    const hasFrac = ctx.excl.length || (raw ? raw.den.length : items.some(g => g.den.length));
    if (!hasFrac) fail('Das ist kein Bruchterm – es kommt kein Bruch vor');
    const dom = domainInfo(ctx.excl), dt = domainTex(dom);
    if (dt) push('Definitionsmenge', dt);
    const split = pure;
    if (res.z) { out.caption = given + ' = 0'; push('Ergebnis', '0'); out.captionTxt = given; return out; }
    const uniqPolys = [];
    let figData;
    if (seq) {
      seq.forEach(g => push('Schrittweise zusammenfassen und nach jedem Schritt kürzen', fracStr(g, {})));
      const fin = fracStr(res, {});
      push('Ergebnis', fin);
      out.caption = given + ' = ' + fin; out.captionTxt = given;
      out.hints.push('Der gemeinsame Hauptnenner aller Terme wäre zu gross; deshalb wird Term für Term addiert und gekürzt.');
      return out;
    }
    if (!items) {
      const N = mergeSide(raw.num), D = mergeSide(raw.den);
      const base = { s: raw.s, num: N, den: D };
      push('In Faktoren zerlegen', fracStr(base, { split }));
      const cancN = new Map(), cancD = new Map();
      N.forEach(f => { const d = D.find(x => x.key === f.key); if (d) { const k = Math.min(f.e, d.e); cancN.set(f.key, k); cancD.set(f.key, k); } });
      if (cancN.size) push('Gemeinsame Faktoren kürzen', fracStr(base, { split: split || [...cancN.keys()].some(k => k[0] === 'c'), cancN, cancD }));
      else out.hints.push('Es gibt keinen gemeinsamen Faktor – der Bruch ist schon gekürzt.');
      const fin = fracStr(res, { split: false });
      push('Ergebnis', fin);
      out.caption = given + ' = ' + fin;
      figData = { kind: 'cancel', N, D, s: raw.s, cancN, cancD, res, dom };
    } else {
      const d = details;
      const termStrs = (g, i, withExt) => {
        const ext = d.ext[i];
        const numStr = sideStr(g.num, { split, bare: !withExt });
        const numT = withExt && ext.length ? (g.num.length ? numStr : '1') + '\\cdot ' + sideStr(ext, { split }) : numStr;
        const denT = withExt ? (g.den.length ? sideStr(g.den, { split }) + (ext.length ? '\\cdot ' + sideStr(ext, { split }) : '') : sideStr(ext, { split })) : sideStr(g.den, { split, bare: true });
        return g.den.length || withExt ? '\\frac{' + numT + '}{' + denT + '}' : numT;
      };
      const join = fn => d.its.map((g, i) => (i === 0 ? (g.s < 0 ? '-' : '') : (g.s < 0 ? ' - ' : ' + ')) + fn(g, i)).join('');
      push('Nenner in Faktoren zerlegen', join((g, i) => termStrs(g, i, false)));
      const Hs = sideStr(d.lcmList, { split }), Hc = sideStr(d.lcmList, { split: false });
      push('Hauptnenner', Hs === Hc ? Hc : Hs + '=' + Hc);
      push('Auf den Hauptnenner erweitern', join((g, i) => termStrs(g, i, true)));
      const numSum = d.its.map((g, i) => {
        let t = sideStr(g.num, { split }); const e = d.ext[i].length ? sideStr(d.ext[i], { split }) : '';
        if (e) t = (g.num.length ? t : '1') + '\\cdot ' + e;
        return (i === 0 ? (g.s < 0 ? '-' : '') : (g.s < 0 ? ' - ' : ' + ')) + t;
      }).join('');
      const H = Hs;
      push('Zähler zusammenfassen', '\\frac{' + numSum + '}{' + H + '}');
      push('Zähler ausrechnen', '\\frac{' + C.polyTex(d.S) + '}{' + Hc + '}');
      const fg = fgFromPoly(d.S);
      const cancN = new Map(), cancD = new Map();
      fg.num.forEach(f => { const l = d.lcmList.find(x => x.key === f.key); if (l) { const k = Math.min(f.e, l.e); cancN.set(f.key, k); cancD.set(f.key, k); } });
      const gN = mergeSide(fg.num), gD = mergeSide(d.lcmList);
      const fbase = { s: fg.s, num: gN, den: gD };
      let fin;
      if (cancN.size) {
        push('Zähler in Faktoren zerlegen', fracStr(fbase, { split }));
        push('Gemeinsame Faktoren kürzen', fracStr(fbase, { split: split || [...cancN.keys()].some(k => k[0] === 'c'), cancN, cancD }));
        fin = fracStr(res, { split: false });
      } else fin = res.den.length ? '\\frac{' + C.polyTex(d.S) + '}{' + Hc + '}' : fracStr(res, {});
      push('Ergebnis', fin);
      out.caption = given + ' = ' + fin;
      figData = { kind: 'sum', d, items: d.its, fg, cancN, cancD, gN, gD, res, dom };
    }
    out.captionTxt = given;
    try { out.fig = fracFigure(figData); } catch (e) { out.fig = null; }
    return out;
  }
  function polyOrFrac(res) { return fracStr(res, {}); }

  // ── Bilder zu den Bruchtermen ──────────────────────────────────────
  function fracFigure(fd) {
    const S = Scene(), hm = new Map();
    const hueOf = key => { if (!hm.has(key)) hm.set(key, hm.size % 6); return hm.get(key); };
    const labelOf = f => (f.c ? String(f.c) : C.polyTex(f.p));
    function chipsOf(list, canc, st) {
      const out = [];
      list.forEach(f => {
        const cutN = (canc && canc.get(f.key)) || 0;
        if (!f.c && f.e > 4) { out.push({ s: labelOf(f) + '^{' + f.e + '}', key: f.key, hue: hueOf(f.key), st: cutN >= f.e ? 'cut' : (st || '') }); return; }
        for (let i = 0; i < f.e; i++) out.push({ s: labelOf(f), key: f.key, hue: hueOf(f.key), st: i < cutN ? 'cut' : (st || '') });
      });
      return out;
    }
    const one = () => [{ s: '1', key: 'one', hue: -1, st: '' }];
    const rowW = ch => ch.reduce((w, c) => w + chipW(c.s) + 0.14, -0.14);
    function place(ch, x, y) { let cx = x; ch.forEach(c => { const w = chipW(c.s); S.chip(cx, y, w, c.s, c.hue, c.st); cx += w + 0.14; }); }
    function blockW(b) { const n = b.n.length ? b.n : one(); return Math.max(rowW(n), b.d.length ? rowW(b.d) : 0, 1); }
    function drawBlock(b, x, y) {
      const n = b.n.length ? b.n : one(), w = blockW(b);
      if (!b.d.length) { place(n, x + (w - rowW(n)) / 2, y + 0.95); return w; }
      place(n, x + (w - rowW(n)) / 2, y); S.line(x - 0.2, y + 1.45, x + w + 0.2, y + 1.45, { thick: true });
      place(b.d, x + (w - rowW(b.d)) / 2, y + 1.9); return w;
    }
    const OPW = 1.7;
    const lines = []; // {blocks:[{n,d,sign}], ops:[], eq}
    const signOf = g => (g.s < 0 ? '-' : '');
    if (fd.kind === 'cancel') {
      lines.push({ blocks: [{ n: chipsOf(fd.N, fd.cancN), d: chipsOf(fd.D, fd.cancD) }], neg: fd.s < 0 });
      if (fd.cancN.size || fd.res.den.length !== fd.D.length) lines.push({ blocks: [{ n: chipsOf(fd.res.num, null, 'new'), d: chipsOf(fd.res.den, null, 'new') }], neg: fd.res.s < 0, eq: true });
    } else {
      const d = fd.d;
      lines.push({ blocks: d.its.map(g => ({ n: chipsOf(g.num), d: chipsOf(g.den) })), ops: d.its.map(g => (g.s < 0 ? '-' : '+')), neg0: d.its[0].s < 0 });
      lines.push({ blocks: d.its.map((g, i) => ({ n: chipsOf(g.num).concat(chipsOf(d.ext[i], null, 'new')), d: chipsOf(g.den).concat(chipsOf(d.ext[i], null, 'new')) })), ops: d.its.map(g => (g.s < 0 ? '-' : '+')), neg0: d.its[0].s < 0, eq: true });
      const sLab = C.polyTex(d.S);
      lines.push({ blocks: [{ n: [{ s: sLab, key: 'S', hue: 3, st: '' }], d: chipsOf(d.lcmList) }], eq: true });
      if (fd.cancN.size) {
        lines.push({ blocks: [{ n: chipsOf(fd.gN, fd.cancN), d: chipsOf(fd.gD, fd.cancD) }], neg: fd.fg.s < 0, eq: true });
        lines.push({ blocks: [{ n: chipsOf(fd.res.num, null, 'new'), d: chipsOf(fd.res.den, null, 'new') }], neg: fd.res.s < 0, eq: true });
      }
    }
    const widthOf = L => L.blocks.reduce((w, b) => w + blockW(b), 0) + (L.blocks.length - 1) * OPW;
    const Wmax = Math.max(...lines.map(widthOf));
    const STEP = 4.3;
    lines.forEach((L, li) => {
      const y = li * STEP, w = widthOf(L); let x = (Wmax - w) / 2;
      if (L.eq) S.text(x - 1.5, y + 1.45, '=', { big: true });
      if (L.neg) S.text(x - 0.65, y + 1.45, '-', { big: true });
      if (L.neg0) S.text(x - 0.65, y + 1.45, '-', { big: true });
      L.blocks.forEach((b, bi) => {
        const bw = drawBlock(b, x, y); x += bw;
        if (bi < L.blocks.length - 1) { S.text(x + OPW / 2, y + 1.45, L.ops[bi + 1] === '-' ? '-' : '+', { big: true }); x += OPW; }
      });
    });
    // Definitionsmenge: Zahlengerade mit Lücken
    const dom = fd.dom;
    if (dom && dom.roots.length && !dom.conds.length && new Set(dom.roots.map(r => r.v)).size === 1) {
      const rs = dom.roots.map(r => qnum(r.r)), lo = Math.floor(Math.min(...rs)) - 2, hi = Math.ceil(Math.max(...rs)) + 2;
      const u = Math.min(1, 14 / (hi - lo)), yL = lines.length * STEP + 0.8, cx = Wmax / 2 - ((lo + hi) / 2) * u;
      S.line(cx + lo * u, yL, cx + hi * u, yL, { thick: true, arrow: true });
      for (let i = Math.ceil(lo); i <= hi; i++) { S.line(cx + i * u, yL - 0.12, cx + i * u, yL + 0.12, {}); if (hi - lo <= 24) S.text(cx + i * u, yL + 0.7, String(i), { muted: true }); }
      dom.roots.forEach((r, i) => { S.dot(cx + rs[i] * u, yL, { open: true, hue: 4 }); S.text(cx + rs[i] * u, yL - 0.9, dom.roots[0].v + '\\neq ' + qTex(r.r), { hue: 4 }); });
      S.text(cx + hi * u + 0.5, yL - 0.7, dom.roots[0].v, { ax: 'l' });
    }
    return S.fig();
  }

  // ══════════════════════════════════════════════════════════════════
  // Logarithmen
  // ══════════════════════════════════════════════════════════════════
  const lgSym = B => (B === 'e' ? '\\ln' : B === 10 ? '\\log_{10}' : '\\log_{' + B + '}');
  const simpleArg = a => /^[A-Za-z0-9]+(\^\{[^{}]*\})?$/.test(a);
  const logOf = (B, a) => lgSym(B) + (simpleArg(a) ? ' ' + a : '(' + a + ')');
  const lnum = (B, r) => Math.log(typeof r === 'number' ? r : qnum(r)) / (B === 'e' ? 1 : Math.log(B));
  const fmtNum = v => String(Math.round(v * 10000) / 10000);
  const LEN = [1.3, 0.9, 1.6, 1.1, 1.4];
  const powT = (t, e) => (e === 1 ? t : t + '^{' + e + '}');
  const sumTex = parts => parts.map((p, i) => (i === 0 ? (p.neg ? '-' : '') : (p.neg ? ' - ' : ' + ')) + p.tex).join('') || '0';
  const leConst = k => ({ k, terms: [] });
  const leScale = (a, c) => ({ k: qmul(a.k, c), terms: a.terms.map(t => Object.assign({}, t, { c: qmul(t.c, c) })) });
  const leAdd = (a, b) => ({ k: qadd(a.k, b.k), terms: a.terms.concat(b.terms) });

  function argOf(node) {
    const g = evalPow(node, {});
    if (qsgn(g.c) <= 0) fail('Das Argument eines Logarithmus muss positiv sein');
    let r = g.c; const atoms = new Map();
    g.occ.forEach(o => {
      const e = pConstVal(o.e); if (!e || !qint(e)) fail('Hochzahlen im Argument: nur ganze Zahlen');
      const ex = e[0] * (o.den ? -1 : 1);
      if (o.kind === 'N') { if (Math.abs(ex) > 40) fail('Hochzahl zu gross'); const p = qpow(q(o.val), Math.abs(ex)); r = qmul(r, ex >= 0 ? p : qinv(p)); }
      else { const a = atoms.get(o.key) || { key: o.key, base: o.base, e: 0 }; a.e += ex; atoms.set(o.key, a); }
    });
    [...atoms.keys()].forEach(k => { if (atoms.get(k).e === 0) atoms.delete(k); });
    return { r, atoms };
  }
  function evalLog(n) {
    switch (n.t) {
      case 'num': return leConst(n.v);
      case 'neg': return leScale(evalLog(n.a), q(-1));
      case 'paren': return evalLog(n.a);
      case 'add': return n.a.map(evalLog).reduce(leAdd);
      case 'mul': {
        const ls = n.a.map(evalLog), withT = ls.filter(l => l.terms.length);
        if (withT.length > 1) fail('Das Produkt von Logarithmen wird hier nicht umgeformt');
        let r = withT[0] || leConst(ONE);
        ls.forEach(l => { if (l !== withT[0]) { if (l.terms.length) fail('Unerwarteter Term'); r = leScale(r, l.k); } });
        return withT.length ? r : leConst(ls.reduce((a, l) => qmul(a, l.k), ONE));
      }
      case 'div': {
        const a = evalLog(n.a), b = evalLog(n.b);
        if (b.terms.length || qzero(b.k)) fail('Durch Logarithmen wird hier nicht geteilt');
        return leScale(a, qinv(b.k));
      }
      case 'call': {
        let B = n.fn === 'ln' ? 'e' : (n.base === null || n.base === undefined ? 10 : n.base);
        if (B !== 'e' && (B < 2 || !Number.isInteger(B))) fail('Die Basis muss eine ganze Zahl ab 2 sein');
        return { k: ZERO, terms: [{ base: B, c: ONE, arg: argOf(n.a) }] };
      }
      case 'var': fail('Variablen stehen hier nur im Argument eines Logarithmus');
      case 'pow': fail('Potenzen gehören hier ins Argument des Logarithmus');
    }
    fail('Unbekannter Term');
  }
  function peel(B, r) {
    if (B === 'e') return { k: 0, rest: r };
    let n = r[0], d = r[1], k = 0;
    while (n % B === 0) { n /= B; k++; }
    while (d % B === 0) { d /= B; k--; }
    return { k, rest: q(n, d) };
  }
  function decompose(B, arg) {
    const pk = peel(B, arg.r), rest = pk.rest, items = [];
    let k = pk.k;
    const isE = a => B === 'e' && a.base === 'e';          // ln(e^3): das e im Argument ist die Basis selbst
    [...arg.atoms.values()].forEach(a => { if (isE(a)) k += a.e; });
    if (k) items.push({ kind: 'base', tex: B === 'e' ? 'e' : String(B), e: k });
    primeFactors(rest[0]).forEach(([p, e]) => items.push({ kind: 'num', tex: String(p), e, val: p }));
    primeFactors(rest[1]).forEach(([p, e]) => items.push({ kind: 'num', tex: String(p), e: -e, val: p }));
    [...arg.atoms.values()].filter(a => !isE(a)).sort((a, b) => (a.base < b.base ? -1 : 1)).forEach(a => items.push({ kind: 'atom', tex: a.base, e: a.e }));
    return { items, k, rest };
  }
  function lsum(B, k, ts) { // k + Σ c·log_B(a)
    const parts = [];
    if (!qzero(k)) parts.push({ neg: qsgn(k) < 0, tex: qTex(qabs(k)) });
    ts.forEach(t => { const c = qabs(t.c); parts.push({ neg: qsgn(t.c) < 0, tex: (qeq(c, ONE) ? '' : qTex(c)) + logOf(B, t.a) }); });
    return sumTex(parts);
  }
  const argTexNum = (r) => (r[1] === 1 ? String(r[0]) : '\\frac{' + r[0] + '}{' + r[1] + '}');
  function argTex(arg, pw) { // Argument als Text (optional hoch pw)
    const parts = [];
    let rt = null;
    if (!qeq(arg.r, ONE)) rt = pw && !qeq(pw, ONE) ? (qint(pw) && Math.abs(pw[0]) <= 12 ? qpow(arg.r, Math.abs(pw[0])) : null) : arg.r;
    const pwq = pw || ONE;
    if (rt) parts.push(rt[1] === 1 ? String(rt[0]) : '\\frac{' + rt[0] + '}{' + rt[1] + '}');
    else if (!qeq(arg.r, ONE)) parts.push('(' + argTexNum(arg.r) + ')^{' + qTex(pw) + '}');
    [...arg.atoms.values()].sort((a, b) => (a.base < b.base ? -1 : 1)).forEach(a => { const e = qmul(q(a.e), pwq); parts.push(a.base + (qeq(e, ONE) ? '' : '^{' + qTex(e) + '}')); });
    return parts.length ? parts.join('\\cdot ') : '1';
  }
  const bpowTex = (B, e) => (B === 'e' ? 'e' : String(B)) + (e === 1 ? '' : '^{' + e + '}');

  function processLog(ast, text, vals, opt) {
    const out = { steps: [], hints: [], vars: [], kind: 'log' };
    const given = astTex(ast), root = strip(ast);
    const push = (label, tex) => { const l = out.steps[out.steps.length - 1]; if (l && l.tex === tex) return; out.steps.push({ label, tex }); };
    push('Gegeben', given);
    if (root.t === 'eq') return logEquation(root, out, given, push);
    const le = evalLog(ast);
    if (!le.terms.length) fail('Hier fehlt ein Logarithmus, z. B. log_2(8)');
    out.captionTxt = given;
    const bases = new Set(le.terms.map(t => t.base));
    const single = le.terms.length === 1 && qeq(le.terms[0].c, ONE) && qzero(le.k);
    if (single) return logExpand(le.terms[0], out, given, push);
    if (bases.size > 1) return logMixed(le, out, given, push);
    return logCondense(le, out, given, push);
  }
  // ── ein einzelner Logarithmus: ausrechnen bzw. zerlegen ──
  function logExpand(term, out, given, push) {
    const B = term.base, arg = term.arg, dec = decompose(B, arg), items = dec.items;
    const rTex = qTex(arg.r);
    const numeric = arg.atoms.size === 0;
    const onlyBase = items.every(it => it.kind === 'base');
    if (numeric && qeq(arg.r, ONE)) {
      push('Frage', (B === 'e' ? 'e' : B) + '^{x}=1');
      push('Ergebnis', logOf(B, '1') + '=0');
      out.caption = given + ' = 0'; out.fig = logLadder(B, 0, '1', given) || logFigure({ B, chain: [], total: { label: given }, numeric: true }); return out;
    }
    if (numeric && onlyBase && B !== 'e') { // exakt: Hochzahl ablesen
      const k = dec.k;
      push('Frage', B + '^{x}=' + rTex + '\\;\\Rightarrow\\;x=' + logOf(B, rTex));
      if (Math.abs(k) <= 8) { const l = []; for (let i = 1; i <= Math.abs(k); i++) l.push(B + '^{' + (k < 0 ? -i : i) + '}=' + qTex(k < 0 ? qinv(qpow(q(B), i)) : qpow(q(B), i))); push('Potenzen von ' + B, l.join(',\\;')); }
      push('Ergebnis', logOf(B, rTex) + '=' + k);
      out.caption = given + ' = ' + k;
      out.fig = logLadder(B, k, rTex, given) || logFigure({ B, chain: [{ c: q(k), label: String(k), len: Math.abs(k), kind: 'num' }], total: { label: given }, numeric: true }); return out;
    }
    if (numeric && items.length === 1 && items[0].kind === 'num' && Math.abs(items[0].e) === 1 && !dec.k) { // eine Primzahl: einschachteln
      const v = lnum(B, arg.r), n = Math.floor(v);
      push('Frage', (B === 'e' ? 'e' : B) + '^{x}=' + rTex + '\\;\\Rightarrow\\;x=' + logOf(B, rTex));
      const bp = k => (B === 'e' ? 'e' : B) + '^{' + k + '}';
      const val = k => (B === 'e' ? '\\approx ' + fmtNum(Math.exp(k)) : '=' + (k >= 0 ? qTex(qpow(q(B), k)) : qTex(qinv(qpow(q(B), -k)))));
      push('Einschachteln', B === 'e' ? bp(n) + val(n) + '<' + rTex + '<' + bp(n + 1) + val(n + 1) : bp(n) + val(n) + '<' + rTex + '<' + val(n + 1).slice(1) + '=' + bp(n + 1));
      if (B !== 'e' && B !== 10) push('Basiswechsel', logOf(B, rTex) + '=\\frac{\\log_{10} ' + rTex + '}{\\log_{10} ' + B + '}');
      push('Näherung', logOf(B, rTex) + '\\approx ' + fmtNum(v));
      out.caption = given + ' \\approx ' + fmtNum(v);
      out.fig = (B !== 'e' || true) && Math.abs(n) < 8 ? logBracketFig(B, n, rTex, v) : logFigure({ B, chain: [{ c: ONE, label: given, len: v, kind: 'num' }], total: { label: given }, numeric: true, marks: [{ pos: v, label: rTex }] }); return out;
    }
    // Gesetze anwenden
    const laws = [];
    const pos = items.filter(i => i.e > 0).length, neg = items.filter(i => i.e < 0).length;
    if (items.length >= 2) laws.push(['Produktregel', '\\log_b(u\\cdot v)=\\log_b u+\\log_b v']);
    if (neg) laws.push(['Quotientenregel', '\\log_b\\frac{u}{v}=\\log_b u-\\log_b v']);
    if (items.some(i => Math.abs(i.e) > 1)) laws.push(['Potenzregel', '\\log_b(u^{n})=n\\cdot\\log_b u']);
    if (dec.k) laws.push(['Logarithmus der Basis', '\\log_b b=1']);
    laws.forEach(l => out.steps.push({ label: l[0], tex: l[1] }));
    if (numeric && !qeq(arg.r, ONE) && (items.length > 1 || items[0].kind === 'base' || Math.abs(items[0].e) > 1)) {
      const dp = items.map(it => powT(it.tex, Math.abs(it.e)));
      const num = items.filter(i => i.e > 0).map(i => powT(i.tex, i.e)).join('\\cdot ') || '1', den = items.filter(i => i.e < 0).map(i => powT(i.tex, -i.e)).join('\\cdot ');
      push('Argument zerlegen', rTex + '=' + (den ? '\\frac{' + num + '}{' + den + '}' : num));
    }
    const mk = (f) => sumTex(items.map(it => ({ neg: it.e < 0, tex: f(it, Math.abs(it.e)) })));
    const Sa = mk((it, a) => logOf(B, powT(it.tex, a)));
    if (Sa !== given) push('Zerlegen', Sa);
    const Sb = mk((it, a) => (a === 1 ? '' : a + '\\cdot ') + logOf(B, it.tex));
    push('Hochzahlen nach vorne', Sb);
    if (dec.k) push('Logarithmus der Basis einsetzen', mk((it, a) => (it.kind === 'base' ? String(a) : (a === 1 ? '' : a + '\\cdot ') + logOf(B, it.tex))));
    // Ergebnis zusammenfassen
    const ts = items.filter(i => i.kind !== 'base').map(i => ({ c: q(i.e), a: i.tex }));
    const fin = lsum(B, q(dec.k), ts);
    push('Ergebnis', fin);
    out.caption = given + ' = ' + fin;
    // Näherung bei Zahlen
    if (numeric) {
      let v = dec.k; items.filter(i => i.kind === 'num').forEach(i => { v += i.e * lnum(B, i.val); });
      push('Näherung', '\\approx ' + fmtNum(v)); out.caption += ' \\approx ' + fmtNum(v);
    }
    // Bild: Kette
    const chain = [];
    if (dec.k) chain.push({ c: q(dec.k), label: String(dec.k), len: Math.abs(dec.k), kind: 'num', sign: 1 });
    const lens = new Map(); let li = 0;
    items.filter(i => i.kind !== 'base').forEach(i => {
      const len = i.kind === 'num' ? lnum(B, i.val) : (lens.has(i.tex) ? lens.get(i.tex) : (lens.set(i.tex, LEN[li++ % LEN.length]), lens.get(i.tex)));
      chain.push({ c: q(i.e), label: logOf(B, i.tex), len, kind: i.kind });
    });
    out.fig = logFigure({ B, chain, total: { label: given }, numeric });
    return out;
  }
  // ── Summe von Logarithmen: zusammenfassen ──
  function logCondense(le, out, given, push) {
    const B = le.terms[0].base, ts = le.terms;
    const numericAll = ts.every(t => t.arg.atoms.size === 0);
    const pieces = ts.map(t => ({ c: t.c, arg: t.arg }));
    if (!qzero(le.k)) {
      if (!qint(le.k)) fail('Eine Zahl, die kein Logarithmus ist, muss ganzzahlig sein, damit man sie als Logarithmus schreiben kann');
      pieces.push({ c: le.k, arg: { r: qpow(q(B === 'e' ? 1 : B), 0), atoms: new Map() }, constant: true });
    }
    // Zahl als Logarithmus
    const constPiece = pieces.find(p => p.constant);
    if (constPiece) {
      if (B === 'e') fail('Bei ln lässt sich eine Zahl nur als e^k schreiben – bitte zuerst k als ln(e^k) schreiben');
      const k = le.k[0]; constPiece.c = ONE; constPiece.arg = { r: k >= 0 ? q(Math.pow(B, k)) : q(1, Math.pow(B, -k)), atoms: new Map() }; constPiece.k = k;
    }
    // Gesetze
    const posN = pieces.filter(p => qsgn(p.c) > 0).length, negN = pieces.filter(p => qsgn(p.c) < 0).length;
    const laws = [];
    if (pieces.some(p => !qeq(qabs(p.c), ONE))) laws.push(['Potenzregel', 'n\\cdot\\log_b u=\\log_b(u^{n})']);
    if (posN >= 2 || negN >= 2) laws.push(['Produktregel', '\\log_b u+\\log_b v=\\log_b(u\\cdot v)']);
    if (posN && negN || negN) laws.push(['Quotientenregel', '\\log_b u-\\log_b v=\\log_b\\frac{u}{v}']);
    if (constPiece) laws.push(['Zahl als Logarithmus', 'n=\\log_b b^{n}']);
    laws.forEach(l => out.steps.push({ label: l[0], tex: l[1] }));
    if (constPiece) push('Zahl als Logarithmus schreiben', le.k[0] + '=' + logOf(B, bpowTex(B, le.k[0])) + (qeq(constPiece.arg.r, q(0)) ? '' : '=' + logOf(B, argTexNum(constPiece.arg.r))));
    const pTex = p => logOf(B, argTex(p.arg, qabs(p.c)));
    const Sa = sumTex(pieces.map(p => ({ neg: qsgn(p.c) < 0, tex: constPiece && p === constPiece ? logOf(B, argTexNum(p.arg.r)) : pTex(p) })));
    push('Faktoren in die Hochzahl', Sa);
    // Produkt / Quotient
    const merged = { num: { r: ONE, atoms: new Map() }, den: { r: ONE, atoms: new Map() } };
    let ok = true;
    pieces.forEach(p => {
      const side = qsgn(p.c) > 0 ? merged.num : merged.den, c = qabs(p.c);
      if (!qeq(p.arg.r, ONE)) { if (!qint(c)) { ok = false; return; } side.r = qmul(side.r, qpow(p.arg.r, c[0])); }
      p.arg.atoms.forEach(a => { const o = side.atoms.get(a.key) || { key: a.key, base: a.base, e: ZERO }; o.e = qadd(o.e, qmul(q(a.e), c)); side.atoms.set(a.key, o); });
    });
    if (!ok) fail('Rationale Faktoren vor einem Logarithmus von Zahlen: bitte ganzzahlig wählen');
    const side = (m) => { const parts = []; if (!qeq(m.r, ONE)) parts.push(argTexNum(m.r)); [...m.atoms.values()].sort((a, b) => (a.base < b.base ? -1 : 1)).forEach(a => parts.push(a.base + (qeq(a.e, ONE) ? '' : '^{' + qTex(a.e) + '}'))); return parts; };
    const posP = pieces.filter(p => qsgn(p.c) > 0), negP = pieces.filter(p => qsgn(p.c) < 0);
    const partTex = p => (p.arg.atoms.size === 0 && p === constPiece ? argTexNum(p.arg.r) : argTex(p.arg, qabs(p.c)));
    if (posN >= 2) {
      const prod = posP.map(p => { const t = partTex(p); return /\\cdot|\\frac/.test(t) && posP.length > 1 ? '(' + t + ')' : t; }).join('\\cdot ');
      const rest = negP.map(p => ({ neg: true, tex: pTex(p) }));
      push('Summe zu Produkt', sumTex([{ neg: false, tex: logOf(B, prod) }].concat(rest)));
    }
    // Endergebnis
    const net = new Map();
    merged.num.atoms.forEach(a => net.set(a.key, Object.assign({}, a)));
    merged.den.atoms.forEach(a => { const o = net.get(a.key) || { key: a.key, base: a.base, e: ZERO }; o.e = qsub(o.e, a.e); net.set(a.key, o); });
    const rr = qdiv(merged.num.r, merged.den.r);
    const numP = [], denP = [];
    if (rr[0] !== 1) numP.push(String(rr[0])); if (rr[1] !== 1) denP.push(String(rr[1]));
    [...net.values()].filter(a => !qzero(a.e)).sort((a, b) => (a.base < b.base ? -1 : 1)).forEach(a => { const e = qsgn(a.e) > 0 ? a.e : qneg(a.e); (qsgn(a.e) > 0 ? numP : denP).push(a.base + (qeq(e, ONE) ? '' : '^{' + qTex(e) + '}')); });
    const finArg = denP.length ? '\\frac{' + (numP.length ? numP.join('\\cdot ') : '1') + '}{' + denP.join('\\cdot ') + '}' : (numP.length ? numP.join('\\cdot ') : '1');
    if (negN) push('Differenz zu Quotient', logOf(B, (() => { const nn = posP.length ? posP.map(p => partTex(p)).join('\\cdot ') : '1', dd = negP.map(p => partTex(p)).join('\\cdot '); return '\\frac{' + nn + '}{' + dd + '}'; })()));
    const finTex = logOf(B, finArg);
    push('Zusammengefasst', finTex);
    out.caption = given + ' = ' + finTex;
    // ln: e^k im Argument ist e hoch k, also ln e^k = k
    if (B === 'e' && qeq(rr, ONE)) {
      const eA = [...net.values()].find(a => a.base === 'e'), other = [...net.values()].filter(a => a.base !== 'e' && !qzero(a.e));
      if (eA && !other.length) {
        const kq = eA.e, argE = qzero(kq) ? '1' : 'e' + (qeq(kq, ONE) ? '' : '^{' + qTex(kq) + '}');
        push('Ergebnis', logOf('e', argE) + '=' + qTex(kq)); out.caption += ' = ' + qTex(kq);
      }
    }
    const allNum = net.size === 0;
    if (allNum) {
      const r = rr, pl = peel(B, r);
      if (qeq(pl.rest, ONE) && B !== 'e') { push('Ergebnis', logOf(B, argTexNum(r)) + '=' + pl.k); out.caption += ' = ' + pl.k; }
      else { const v = lnum(B, r); push('Näherung', '\\approx ' + fmtNum(v)); out.caption += ' \\approx ' + fmtNum(v); }
    }
    // Bild
    const lens = new Map(); let li = 0;
    const lenOf = p => { let v = 0; if (!qeq(p.arg.r, ONE)) v += lnum(B, p.arg.r); p.arg.atoms.forEach(a => { if (!lens.has(a.key)) lens.set(a.key, LEN[li++ % LEN.length]); v += a.e * lens.get(a.key); }); return v; };
    const chain = pieces.map(p => ({ c: constPiece && p === constPiece ? q(le.k[0]) : p.c, label: constPiece && p === constPiece ? String(le.k[0]) : (qeq(qabs(p.c), ONE) ? '' : qTex(qabs(p.c))) + logOf(B, argTex(p.arg)), len: constPiece && p === constPiece ? 1 : lenOf(p), kind: constPiece && p === constPiece ? 'num' : 'log', constant: p === constPiece }));
    out.fig = logFigure({ B, chain, total: { label: finTex }, numeric: numericAll });
    return out;
  }
  function logMixed(le, out, given, push) {
    if (le.terms.some(t => t.arg.atoms.size)) fail('Zum Zusammenfassen braucht man dieselbe Basis');
    let v = qnum(le.k);
    push('Einzelne Logarithmen', le.terms.map(t => logOf(t.base, argTexNum(t.arg.r)) + '\\approx ' + fmtNum(lnum(t.base, t.arg.r))).join(',\\;'));
    le.terms.forEach(t => { v += qnum(t.c) * lnum(t.base, t.arg.r); });
    push('Näherung', '\\approx ' + fmtNum(v));
    out.caption = given + ' \\approx ' + fmtNum(v); out.hints.push('Verschiedene Basen lassen sich nur mit dem Basiswechsel zusammenfassen.');
    return out;
  }
  // ── Gleichungen ──
  function splitCoef(n) { // → {k, rest} mit Zahlenfaktor k
    n = strip(n);
    if (n.t === 'neg') { const r = splitCoef(n.a); return { k: qneg(r.k), rest: r.rest }; }
    if (n.t === 'mul') {
      let k = ONE; const rest = [];
      n.a.forEach(p => { const s = strip(p); if (s.t === 'num') k = qmul(k, s.v); else if (s.t === 'neg' && strip(s.a).t === 'num') k = qmul(k, qneg(strip(s.a).v)); else rest.push(p); });
      if (rest.length === 1) return { k, rest: rest[0] };
      if (!rest.length) return { k, rest: null };
      return { k, rest: { t: 'mul', a: rest } };
    }
    if (n.t === 'div') { const d = strip(n.b); if (d.t === 'num') { const r = splitCoef(n.a); return { k: qdiv(r.k, d.v), rest: r.rest }; } }
    return { k: ONE, rest: n };
  }
  const numOfNode = n => { try { const p = toPoly(n); return pConstVal(p); } catch (e) { return null; } };
  function linForm(n, v) { // α·v + β
    const p = toPoly(n), vs = C.pVars(p);
    if (vs.length !== 1 || (v && vs[0] !== v) || C.pDegree(p) !== 1) fail('Hier nur Gleichungen, in denen die Variable einmal vorkommt (linear in Hochzahl bzw. Argument)');
    const a = p.find(t => t.m[vs[0]] === 1).c, bt = p.find(t => !Object.keys(t.m).length);
    return { v: vs[0], a, b: bt ? bt.c : ZERO };
  }
  function logEquation(root, out, given, push) {
    let L = root.l, R = root.r;
    if (numOfNode(L) !== null && numOfNode(R) === null) { const t = L; L = R; R = t; }
    const cv = numOfNode(R); if (cv === null) fail('Eine Seite der Gleichung muss eine Zahl sein');
    const sc = splitCoef(L);
    if (!sc.rest) fail('In der Gleichung fehlt die Variable');
    const rest = strip(sc.rest);
    const c = qdiv(cv, sc.k);   // Potenz bzw. Logarithmus allein
    // b^(α x + β) = c
    if (rest.t === 'pow' && !rest.sqrt) {
      const bn = strip(rest.a); let B = null;
      if (bn.t === 'num' && qint(bn.v) && bn.v[0] >= 2) B = bn.v[0]; else if (bn.t === 'var' && bn.n === 'e') B = 'e';
      if (B === null) fail('Die Basis der Potenz muss eine ganze Zahl ab 2 (oder e) sein');
      const lf = linForm(rest.e), v = lf.v, expoTex = astTex(strip(rest.e));
      if (qsgn(c) <= 0) fail('Keine Lösung: eine Potenz ist immer positiv');
      if (!qeq(sc.k, ONE)) push('Potenz isolieren', bpowTex(B, '{' + expoTex + '}').replace('^{{', '^{').replace('}}', '}') + '=\\frac{' + qTex(cv) + '}{' + qTex(sc.k) + '}=' + qTex(c));
      const lg = logOf(B, qTex(c));
      push('Logarithmus anwenden', expoTex + '=' + lg);
      const pl = peel(B, c), exact = qeq(pl.rest, ONE) && B !== 'e';
      const y = lnum(B, c), yq = exact ? q(pl.k) : null;
      push('Logarithmus ausrechnen', expoTex + (exact ? '=' + pl.k : '=' + lg + '\\approx ' + fmtNum(y)));
      // x = (y - β)/α
      const xv = (y - qnum(lf.b)) / qnum(lf.a);
      let solTex;
      if (exact) { const xq = qdiv(qsub(yq, lf.b), lf.a); solTex = v + '=' + (qzero(lf.b) && qeq(lf.a, ONE) ? '' : (lf.a[0] === 1 && lf.a[1] === 1 ? pl.k + (qsgn(lf.b) > 0 ? '-' : '+') + qTex(qabs(lf.b)) + '=' : '\\frac{' + pl.k + (qsgn(lf.b) > 0 ? '-' : '+') + qTex(qabs(lf.b)) + '}{' + qTex(lf.a) + '}=')) + qTex(xq); if (qzero(lf.b)) solTex = v + '=' + (qeq(lf.a, ONE) ? '' : '\\frac{' + pl.k + '}{' + qTex(lf.a) + '}=') + qTex(xq); }
      else solTex = v + (qzero(lf.b) && qeq(lf.a, ONE) ? '' : '=\\frac{' + lg + (qsgn(lf.b) > 0 ? '-' : '+') + qTex(qabs(lf.b)) + '}{' + qTex(lf.a) + '}') + '\\approx ' + fmtNum(xv);
      if (!qzero(lf.b) || !qeq(lf.a, ONE)) push('Nach ' + v + ' auflösen', solTex); else if (exact) push('Lösung', v + '=' + pl.k);
      out.caption = given + ' \\;\\Rightarrow\\; ' + (exact ? v + '=' + qTex(qdiv(qsub(yq, lf.b), lf.a)) : v + '\\approx ' + fmtNum(xv));
      out.captionTxt = given;
      out.fig = logFigure({ B, chain: [{ c: ONE, label: lg, len: Math.abs(y), kind: 'num', neg: y < 0 }], total: { label: expoTex === v ? v : expoTex }, numeric: true, marks: [{ pos: y, label: qTex(c) }], eq: true });
      return out;
    }
    // log_b(α x + β) = c
    if (rest.t === 'call') {
      const B = rest.fn === 'ln' ? 'e' : (rest.base === null || rest.base === undefined ? 10 : rest.base);
      const lf = linForm(rest.a), v = lf.v, argT = astTex(strip(rest.a));
      push('Logarithmus als Hochzahl', argT + '=' + bpowTex(B, '{' + qTex(c) + '}').replace('^{{', '^{').replace('}}', '}'));
      const val = B === 'e' ? Math.exp(qnum(c)) : Math.pow(B, qnum(c));
      const exactV = B !== 'e' && qint(c) && Math.abs(c[0]) <= 12 ? (c[0] >= 0 ? q(Math.pow(B, c[0])) : q(1, Math.pow(B, -c[0]))) : null;
      push('Ausrechnen', argT + '=' + (exactV ? qTex(exactV) : '\\approx ' + fmtNum(val)));
      const xv = (val - qnum(lf.b)) / qnum(lf.a);
      if (exactV) {
        const xq = qdiv(qsub(exactV, lf.b), lf.a);
        if (!qzero(lf.b) || !qeq(lf.a, ONE)) push('Nach ' + v + ' auflösen', v + '=' + (qeq(lf.a, ONE) ? '' : '\\frac{' + qTex(exactV) + (qsgn(lf.b) > 0 ? '-' : '+') + qTex(qabs(lf.b)) + '}{' + qTex(lf.a) + '}=').replace('+0','') + qTex(xq));
        push('Probe', argT.replace(new RegExp(v, 'g'), '(' + qTex(xq) + ')') + '=' + qTex(exactV) + '>0');
        out.caption = given + ' \\;\\Rightarrow\\; ' + v + '=' + qTex(xq);
      } else { push('Nach ' + v + ' auflösen', v + '\\approx ' + fmtNum(xv)); out.caption = given + ' \\;\\Rightarrow\\; ' + v + '\\approx ' + fmtNum(xv); }
      out.captionTxt = given;
      out.fig = logFigure({ B, chain: [{ c: ONE, label: qTex(c), len: Math.abs(qnum(c)), kind: 'num', neg: qsgn(c) < 0 }], total: { label: logOf(B, argT) }, numeric: true, marks: [{ pos: qnum(c), label: exactV ? qTex(exactV) : fmtNum(val) }], eq: true });
      return out;
    }
    fail('Diese Gleichung erkenne ich nicht – erwartet: b^(…) = c oder log_b(…) = c');
  }
  // ── Frage-Bild: «B hoch wie viel ergibt a?» als Potenzleiter ──
  function logLadder(B, k, rTex, given) {
    try {
      const S = Scene(), bl = B === 'e' ? 'e' : String(B), W = 1.8, ST = 2.5;
      const k0 = Math.min(0, k), k1 = Math.max(0, k); if (k1 - k0 > 9) return null;
      const val = j => { if (B === 'e') return j === 0 ? '1' : 'e^{' + j + '}'; const v = j >= 0 ? q(Math.pow(B, j)) : q(1, Math.pow(B, -j)); return qTex(v); };
      const yC = 2.2;
      S.text((k1 - k0) * ST / 2 + W / 2, 0.2, bl + '^{\\,?}=' + rTex, { big: true, hue: 3 });
      for (let j = k0; j <= k1; j++) {
        const x = (j - k0) * ST, hit = j === k;
        S.chip(x, yC, W, val(j), hit ? 3 : 0, '');
        S.text(x + W / 2, yC + 1.7, bl + '^{' + j + '}', { muted: !hit, hue: hit ? 3 : -1 });
        if (j < k1) { S.line(x + W + 0.08, yC + 0.5, x + ST - 0.08, yC + 0.5, { arrow: true, hue: -1 }); S.text(x + (W + ST) / 2, yC - 0.1, '\\cdot ' + bl, { muted: true, ay: 'b' }); }
      }
      const xt = (k - k0) * ST + W / 2;
      S.line(xt, yC + 2.2, xt, yC + 3.1, { arrow: true, hue: 3 });
      S.text(xt, yC + 3.9, '\\log_{' + bl + '}' + (/^[0-9a-z]$/.test(rTex) ? ' ' : '') + '(' + rTex + ')=' + k, { big: true, hue: 3 });
      return S.fig();
    } catch (e) { return null; }
  }
  function logBracketFig(B, n, rTex, v) {
    try {
      const S = Scene(), bl = B === 'e' ? 'e' : String(B), W = 1.8, ST = 2.9;
      const val = j => (B === 'e' ? '\\approx ' + fmtNum(Math.exp(j)) : (j >= 0 ? qTex(q(Math.pow(B, j))) : qTex(q(1, Math.pow(B, -j)))));
      const yC = 2.2;
      S.text(ST + W / 2, 0.2, bl + '^{\\,?}=' + rTex, { big: true, hue: 3 });
      [[n, 0, 0], [null, 1, 3], [n + 1, 2, 0]].forEach(([j, i, hue]) => {
        const x = i * ST;
        if (j === null) { S.chip(x, yC, W, rTex, 3, 'new'); S.text(x + W / 2, yC + 1.7, bl + '^{\\,?}', { hue: 3 }); }
        else { S.chip(x, yC, W, B === 'e' ? bl + '^{' + j + '}' : val(j), hue, ''); S.text(x + W / 2, yC + 1.7, bl + '^{' + j + '}', { muted: true }); }
      });
      S.text(ST + W / 2, yC + 3.4, n + '<\\log_{' + bl + '}(' + rTex + ')<' + (n + 1), { big: true, hue: 3 });
      S.text(ST + W / 2, yC + 4.6, '\\approx ' + fmtNum(v), { big: true, hue: 3 });
      return S.fig();
    } catch (e) { return null; }
  }
  // ── Bild: Strecken auf der logarithmischen Skala ──
  function logFigure(o) {
    try {
      const S = Scene(), B = o.B, chain = o.chain || [];
      let pos = 0, lo = 0, hi = 0; const segs = [], ends = [], starts = [];
      chain.forEach((it, i) => {
        const c = it.c, ac = qabs(c), dir = (qsgn(c) < 0 ? -1 : 1) * (it.neg ? -1 : 1);
        const copies = qint(ac) && ac[0] >= 1 && ac[0] <= 4 && !it.constant ? ac[0] : 1;
        const each = it.len * (copies === 1 ? qnum(ac) : 1);
        starts[i] = pos;
        for (let k = 0; k < copies; k++) { segs.push({ a: pos, b: pos + dir * each, i, hue: i % 6, last: k === copies - 1, label: it.label, copies }); pos += dir * each; lo = Math.min(lo, pos); hi = Math.max(hi, pos); }
        ends[i] = pos;
      });
      const T = pos;
      if (o.marks) o.marks.forEach(m => { lo = Math.min(lo, m.pos); hi = Math.max(hi, m.pos); });
      const span = Math.max(hi - lo, 1), U = span < 8 ? Math.min(8 / span, 4) : 1;
      const X = p => p * U;
      const rowH = 1.3, yTot = 0, yCh0 = 2.0, yAx = yCh0 + Math.max(chain.length, 1) * rowH + 0.4;
      S.line(X(Math.min(lo, 0) - 0.2), yAx, X(Math.max(hi, 0) + 0.3), yAx, { thick: true });
      if (o.numeric) {
        const tk = k => { if (B === 'e') return 'e^{' + k + '}'; const v = k >= 0 ? q(Math.pow(B, k)) : q(1, Math.pow(B, -k)); return Math.abs(k) <= 6 ? qTex(v) : B + '^{' + k + '}'; };
        for (let k = Math.ceil(Math.min(lo, 0) - 0.01); k <= Math.floor(Math.max(hi, 0) + 0.01); k++) { S.line(X(k), yAx - 0.15, X(k), yAx + 0.15, {}); S.text(X(k), yAx + 0.75, tk(k), { muted: true }); }
      } else { S.line(0, yAx - 0.15, 0, yAx + 0.15, {}); S.text(0, yAx + 0.75, '1', { muted: true }); }
      segs.forEach(sg => {
        const yy = yCh0 + sg.i * rowH;
        S.line(X(sg.a), yy, X(sg.b), yy, { arrow: true, hue: sg.hue, thick: true });
        if (sg.copies > 1 && !sg.last) S.line(X(sg.b), yy - 0.22, X(sg.b), yy + 0.22, { hue: sg.hue });
        if (sg.last) S.text((X(starts[sg.i]) + X(sg.b)) / 2, yy - 0.45, sg.label, { hue: sg.hue, ay: 'b' });
      });
      chain.forEach((it, i) => { if (i < chain.length - 1) S.line(X(ends[i]), yCh0 + i * rowH, X(ends[i]), yCh0 + (i + 1) * rowH, { dash: true, hue: i % 6 }); });
      if (chain.length) S.line(X(T), yCh0 + (chain.length - 1) * rowH, X(T), yAx, { dash: true });
      if (o.total) {
        S.line(0, yTot, X(T), yTot, { arrow: true, hue: 3, thick: true });
        S.text(X(T) / 2, yTot - 0.5, o.total.label, { ay: 'b', hue: 3 });
        S.line(X(T), yTot, X(T), yCh0, { dash: true, hue: 3 });
      }
      if (o.numeric && !o.eq) { const val = B === 'e' ? Math.exp(T) : Math.pow(B, T); if (isFinite(val)) { S.dot(X(T), yAx, { hue: 3 }); S.text(X(T), yAx - 0.6, fmtNum(val), { hue: 3, ay: 'b' }); } }
      if (o.marks) o.marks.forEach(m => { S.dot(X(m.pos), yAx, { hue: 3 }); S.text(X(m.pos), yAx - 0.7, m.label, { hue: 3, ay: 'b' }); S.line(X(m.pos), yTot, X(m.pos), yAx, { dash: true, hue: 3 }); });
      return S.fig();
    } catch (e) { return null; }
  }

  // ══════════════════════════════════════════════════════════════════
  // Einstieg
  // ══════════════════════════════════════════════════════════════════
  const EXT = {};
  function register(mode, fn) { EXT[mode] = fn; }
  // Kommt eine Wurzel oder eine gebrochene Hochzahl vor? (dann rechnet das Wurzel-Modul)
  function constQ(e) {
    e = strip(e);
    if (e.t === 'num') return e.v;
    if (e.t === 'neg') { const q = constQ(e.a); return q ? [-q[0], q[1]] : null; }
    if (e.t === 'div') { const a = constQ(e.a), b = constQ(e.b); return a && b && b[0] ? [a[0] * b[1], a[1] * b[0]] : null; }
    return null;
  }
  function hasRootish(ast) {
    let r = false;
    (function w(x) {
      if (!x || r || typeof x !== 'object') return;
      if (x.t === 'pow') {
        if (x.sqrt) { r = true; return; }
        const q = constQ(x.e); if (q && q[0] % q[1] !== 0) { r = true; return; }
      }
      ['a', 'b', 'e'].forEach(k => { const c = x[k]; if (Array.isArray(c)) c.forEach(w); else if (c && typeof c === 'object' && c.t) w(c); });
    })(ast);
    return r;
  }

  function process(text, mode, vals, opt) {
    opt = opt || {}; vals = vals || {};
    const out = { ok: false, error: null, text, mode, steps: [], fig: null, caption: '', vars: [], kind: 'none', hints: [] };
    try {
      let r, ast = null;
      if (mode === 'sys' && EXT.sys) { r = EXT.sys(null, text, vals, opt); Object.assign(out, r); out.ok = true; out.steps.forEach(s => { s.tex = C.bigParens(s.tex); }); if (out.caption) out.caption = C.bigParens(out.caption); out.lineTxt = out.captionTxt || text; return out; }
      ast = parse(text);
      if (mode === 'pow' && EXT.root && hasRootish(ast)) r = EXT.root(ast, text, vals, opt);   // Wurzeln, gebrochene Hochzahlen (36_alg_root.js)
      else if (mode === 'pow') r = processPow(ast, text, vals, opt);
      else if (mode === 'frac') r = processFrac(ast, text, vals, opt);
      else if (mode === 'log') r = processLog(ast, text, vals, opt);
      else if (EXT[mode]) r = EXT[mode](ast, text, vals, opt);
      else fail('Unbekannte Darstellung');
      Object.assign(out, r); out.ok = true;
      if (mode === 'log' || mode === 'frac') out.fig = null;   // hier nur der Rechenweg (kein Bild)
    } catch (e) {
      if (e instanceof C.AlgError) { out.error = e.message; out.ok = false; out.fig = null; out.steps = []; out.caption = ''; return out; }
      throw e;
    }
    out.steps.forEach(s => { s.tex = C.bigParens(s.tex); });
    if (out.caption) out.caption = C.bigParens(out.caption);
    out.lineTxt = out.captionTxt || text;
    return out;
  }

  return { register, normalize, fieldLatex, process, processPow, processFrac, processLog, tokenize, parse, astTex, strip, toPoly, primeFactors, Scene, chipW, C, fail, fmtNum, wrapPar, hasTopSign, pConstVal };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = AlgMore;
