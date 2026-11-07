// ═══════════════════════════════════════════════════════════════════
// 36_alg_root.js — Algebra: Wurzeln und rationale Hochzahlen (ohne DOM, node-testbar)
//
// Darstellung 'root': √a, ⁿ√a, a^(m/n), Wurzelgesetze, Wurzeln vereinfachen und addieren,
// Nenner rational machen. Zahlen werden in Primfaktoren zerlegt, Buchstaben stehen für positive
// Zahlen. Bild: Eine Hochzahl m/n ist eine Reihe von m «Bruchbausteinen» der Breite 1/n; n davon
// ergeben einen ganzen Baustein.
// Einstieg: wird bei AlgMore registriert (AlgMore.process(text, 'root', …)).
// ═══════════════════════════════════════════════════════════════════
(function () {
  const M = (typeof AlgMore !== 'undefined') ? AlgMore : require('./35_alg_more.js');
  const C = M.C, fail = M.fail, strip = M.strip, Scene = M.Scene;
  const { q, qadd, qmul, qneg, qinv, qeq, qzero, qnum, qabs, qsgn, qint, qTex, ONE } = C;
  const qpowInt = (a, n) => { let r = ONE; for (let i = 0; i < Math.abs(n); i++) r = qmul(r, a); return n < 0 ? qinv(r) : r; };
  const qfloor = a => Math.floor(a[0] / a[1]);

  // ── Monomial: Vorzeichen und Hochzahlen je Basis (Primzahl oder Buchstabe) ──
  const mOne = () => ({ s: 1, z: false, ex: new Map() });
  function mMul(a, b) {
    const ex = new Map(a.ex);
    b.ex.forEach((e, k) => { const v = ex.has(k) ? qadd(ex.get(k), e) : e; if (qzero(v)) ex.delete(k); else ex.set(k, v); });
    return { s: a.s * b.s, z: a.z || b.z, ex };
  }
  function mInv(a) {
    if (a.z) fail('Division durch 0');
    const ex = new Map(); a.ex.forEach((e, k) => ex.set(k, qneg(e)));
    return { s: a.s, z: false, ex };
  }
  function mNum(v) {
    if (qzero(v)) return { s: 1, z: true, ex: new Map() };
    const m = mOne(); m.s = qsgn(v);
    const add = (n, sg) => { if (n > 1e9) fail('Zahl zu gross'); M.primeFactors(n).forEach(([p, e]) => m.ex.set('n:' + p, q(sg * e))); };
    add(Math.abs(v[0]), 1);
    M.primeFactors(v[1]).forEach(([p, e]) => { const k = 'n:' + p; m.ex.set(k, m.ex.has(k) ? qadd(m.ex.get(k), q(-e)) : q(-e)); });
    m.ex.forEach((e, k) => { if (qzero(e)) m.ex.delete(k); });
    return m;
  }
  function mPow(a, e) {
    if (a.z) { if (qsgn(e) > 0) return a; fail('Division durch 0'); }
    if (qint(e)) {
      if (Math.abs(e[0]) > 60) fail('Hochzahl zu gross');
      const ex = new Map(); a.ex.forEach((v, k) => ex.set(k, qmul(v, e)));
      return { s: e[0] % 2 === 0 ? 1 : a.s, z: false, ex };
    }
    if (a.s < 0) fail('Wurzeln aus negativen Zahlen gibt es hier nicht');
    const ex = new Map(); a.ex.forEach((v, k) => ex.set(k, qmul(v, e)));
    return { s: 1, z: false, ex };
  }
  const constOf = n => { const p = M.toPoly(n); const c = M.pConstVal(p); if (!c) fail('Hochzahlen: hier nur Zahlen'); return c; };
  function evalM(n) {
    switch (n.t) {
      case 'num': return mNum(n.v);
      case 'var': { const m = mOne(); m.ex.set('l:' + n.n, ONE); return m; }
      case 'neg': { const m = evalM(n.a); return { s: -m.s, z: m.z, ex: m.ex }; }
      case 'paren': { const i = strip(n); if (i.t === 'add') fail('Summen unter einer Wurzel oder in einer Potenz gibt es hier nicht'); return evalM(n.a); }
      case 'mul': return n.a.map(evalM).reduce(mMul);
      case 'div': return mMul(evalM(n.a), mInv(evalM(n.b)));
      case 'pow': return mPow(evalM(n.a), constOf(n.e));
      case 'add': fail('Summen gehören hier ins oberste Niveau, nicht in Klammern');
      case 'call': fail('Logarithmen gibt man in der Darstellung «Logarithmen» ein');
      case 'eq': fail('Hier keine Gleichungen');
    }
    fail('Unbekannter Term');
  }

  // ── Normalform: Zahlenfaktor c, Buchstaben L (ganze Hochzahlen), Wurzeln R ──
  function normal(m) {
    if (m.z) return { z: true, s: 1, c: q(0), L: new Map(), R: [] };
    let c = ONE; const L = new Map(), R = [];
    const keys = [...m.ex.keys()].sort((a, b) => (a[0] === b[0] ? (a[0] === 'n' ? parseInt(a.slice(2), 10) - parseInt(b.slice(2), 10) : (a < b ? -1 : 1)) : (a[0] === 'n' ? -1 : 1)));
    keys.forEach(k => {
      const e = m.ex.get(k), fl = qfloor(e), f = qadd(e, q(-fl)), kind = k[0], base = k.slice(2);
      if (kind === 'n') c = qmul(c, qpowInt(q(parseInt(base, 10)), fl)); else if (fl) L.set(base, fl);
      if (!qzero(f)) R.push({ key: k, base, kind, f });
    });
    return { z: false, s: m.s, c, L, R };
  }
  const sigOf = t => t.R.map(r => r.key + ':' + r.f[0] + '/' + r.f[1]).join('|') + '#' + [...t.L.entries()].map(([k, v]) => k + v).join(',');

  // ── Schreibweisen ──
  const rootTex = (idx, r) => (idx === 2 ? '\\sqrt{' + r + '}' : '\\sqrt[' + idx + ']{' + r + '}');
  const powT = (b, e) => (e === 1 ? b : b + '^{' + e + '}');
  function radicals(R) { // gleiche Wurzelexponenten in einer Wurzel
    const byIdx = new Map();
    R.forEach(r => { const n = r.f[1]; if (!byIdx.has(n)) byIdx.set(n, []); byIdx.get(n).push(r); });
    return [...byIdx.keys()].sort((a, b) => a - b).map(n => {
      const list = byIdx.get(n); let num = 1; const lets = [];
      list.forEach(r => { if (r.kind === 'n') num *= Math.pow(parseInt(r.base, 10), r.f[0]); else lets.push(powT(r.base, r.f[0])); });
      return rootTex(n, (num > 1 ? String(num) : '') + lets.join('') || '1');
    });
  }
  function termTex(t, o) {
    o = o || {};
    if (t.z) return '0';
    const numP = [], denP = [];
    if (t.c[0] !== 1) numP.push(String(t.c[0]));
    if (t.c[1] !== 1) denP.push(String(t.c[1]));
    [...t.L.keys()].sort().forEach(k => { const v = t.L.get(k); if (v > 0) numP.push(powT(k, v)); else denP.push(powT(k, -v)); });
    const rads = radicals(t.R);
    let num = numP.join('');
    if (rads.length) num += (num && /\d$/.test(num) ? '' : '') + rads.join('\\cdot ');
    if (!num) num = '1';
    const body = denP.length ? '\\frac{' + num + '}{' + denP.join('') + '}' : num;
    return (t.s < 0 && !o.noSign ? '-' : '') + body;
  }
  function monoTex(m) { // Primfaktoren mit rationalen Hochzahlen
    if (m.z) return '0';
    const keys = [...m.ex.keys()].sort((a, b) => (a[0] === b[0] ? (a[0] === 'n' ? parseInt(a.slice(2), 10) - parseInt(b.slice(2), 10) : (a < b ? -1 : 1)) : (a[0] === 'n' ? -1 : 1)));
    const num = [], den = [];
    keys.forEach(k => { const e = m.ex.get(k), b = k.slice(2), neg = qsgn(e) < 0, ea = qabs(e); const t = b + (qeq(ea, ONE) ? '' : '^{' + qTex(ea) + '}'); (neg ? den : num).push(t); });
    const j = a => a.map((t, i) => (i && /^[0-9]/.test(t) ? '\\cdot ' : '') + t).join('') || '1';
    return (m.s < 0 ? '-' : '') + (den.length ? '\\frac{' + j(num) + '}{' + j(den) + '}' : j(num));
  }

  // ── Umschreiben des Eingabeterms ──
  function mapAst(n, f) {
    const g = f(n); if (g) return g;
    switch (n.t) {
      case 'neg': case 'paren': return { t: n.t, a: mapAst(n.a, f) };
      case 'add': case 'mul': return { t: n.t, a: n.a.map(x => mapAst(x, f)) };
      case 'div': return { t: 'div', a: mapAst(n.a, f), b: mapAst(n.b, f) };
      case 'pow': return Object.assign({}, n, { a: mapAst(n.a, f) });
      default: return n;
    }
  }
  const hasRoot = n => { let r = false; mapAst(n, x => { if (x.t === 'pow' && x.sqrt) r = true; return null; }); return r; };
  const asPower = n => mapAst(n, x => asPowerFn(x));
  const asPowerFn = x => { if (x.t === 'pow' && x.sqrt) { const a = strip(x.a); const base = (a.t === 'var' || a.t === 'num') ? a : { t: 'paren', a: mapAst(a, asPowerFn) }; return { t: 'pow', a: base, e: x.e }; } return null; };
  const isComposite = v => { if (!qint(v) || v[0] < 4) return false; const f = M.primeFactors(v[0]); return !(f.length === 1 && f[0][1] === 1); };
  let anyComposite = false;
  const primeForm = n => mapAst(n, x => {
    if (x.t === 'pow') return Object.assign({}, x, { a: mapAst(x.a, primeFormFn) });
    return primeFormFn(x);
  });
  function primeFormFn(x) {
    if (x.t === 'num' && isComposite(x.v)) {
      anyComposite = true;
      const f = M.primeFactors(x.v[0]).map(([p, e]) => (e === 1 ? { t: 'num', v: q(p) } : { t: 'pow', a: { t: 'num', v: q(p) }, e: { t: 'num', v: q(e) } }));
      return { t: 'paren', a: f.length === 1 ? f[0] : { t: 'mul', a: f } };
    }
    if (x.t === 'pow') return Object.assign({}, x, { a: mapAst(x.a, primeFormFn) });
    return null;
  }

  // ── Bild: Bruchbausteine ──
  const gcd = (a, b) => (b ? gcd(b, a % b) : a), lcm = (a, b) => a / gcd(a, b) * b;
  function occs(n, mult, out) {
    n = n.t === 'paren' ? strip(n) : n;
    switch (n.t) {
      case 'num': { const m = mNum(n.v); m.ex.forEach((e, k) => out.push({ key: k, e: qmul(e, mult) })); return; }
      case 'var': out.push({ key: 'l:' + n.n, e: mult }); return;
      case 'neg': occs(n.a, mult, out); return;
      case 'mul': n.a.forEach(x => occs(x, mult, out)); return;
      case 'div': occs(n.a, mult, out); occs(n.b, qneg(mult), out); return;
      case 'pow': occs(n.a, qmul(mult, constOf(n.e)), out); return;
      default: throw new Error('no');
    }
  }
  function figure(ast) {
    try {
      const list = []; occs(strip(ast), ONE, list);
      const byKey = new Map(); list.forEach(o => { if (!byKey.has(o.key)) byKey.set(o.key, []); byKey.get(o.key).push(o.e); });
      const cand = [...byKey.entries()].filter(([k, es]) => es.every(e => qsgn(e) > 0) && (es.length > 1 || es.some(e => !qint(e))));
      cand.sort((a, b) => b[1].filter(e => !qint(e)).length - a[1].filter(e => !qint(e)).length);
      const S = Scene(); let y = 0, drawn = 0;
      for (const [key, es] of cand) {
        if (drawn >= 2) break;
        const D = es.reduce((a, e) => lcm(a, e[1]), 1); if (D > 12) continue;
        const N = es.map(e => e[0] * (D / e[1])), T = N.reduce((a, b) => a + b, 0); if (T > 28 || T < 1) continue;
        const base = key.slice(2), U = 2.0, st = U / D, w = st * 0.9;
        const label = (e) => (qeq(e, ONE) ? base : (e[0] === 1 && !qint(e) ? rootTex(e[1], base) : powT(base, qTex(e))));
        let x = 0; const hues = [0, 3, 1, 4, 2];
        es.forEach((e, i) => {
          const x0 = x, units = Math.ceil(N[i] / D);
          for (let j = 0; j < N[i]; j++) S.chip(x0 + j * st, y, w, '', hues[i % 5], '');
          for (let u = 0; u < units; u++) S.rr(x0 + u * U - 0.06, y - 0.1, U - (st - w) + 0.12, 1.2, { hue: -1, dash: true });
          S.br(x0, x0 + units * U - (st - w), y - 0.3, 'u', label(e));
          x = x0 + units * U;
          if (i < es.length - 1) { x += 0.45; S.text(x - 0.05, y + 0.5, '\\cdot', { big: true }); x += 0.5; }
        });
        const W = x - (U - (st - w));
        const y2 = y + 2.9;
        S.line(W / 2, y + 1.3, W / 2, y2 - 0.3, { arrow: true });
        let x2 = 0;
        es.forEach((e, i) => { for (let j = 0; j < N[i]; j++) { S.chip(x2, y2, w, '', hues[i % 5], ''); x2 += st; } });
        const unitsT = Math.ceil(T / D);
        for (let u = 0; u < unitsT; u++) S.rr(u * U - 0.06, y2 - 0.1, U - (st - w) + 0.12, 1.2, { hue: -1, dash: u * D + D > T });
        const tot = q(T, D);
        const tl = qint(tot) ? (tot[0] === 1 ? base : powT(base, tot[0])) : powT(base, qTex(tot));
        const eq = key[0] === 'n' && qint(tot) && tot[0] > 1 && tot[0] <= 8 ? '=' + Math.pow(parseInt(base, 10), tot[0]) : '';
        S.br(0, unitsT * U - (st - w), y2 + 1.4, 'd', tl + eq);
        y = y2 + 3.4; drawn++;
      }
      return drawn ? S.fig() : null;
    } catch (e) { return null; }
  }

  // Zahl hoch m/n, wenn die Basis eine n-te Potenz ist (8^(2/3), 16^(3/4), 4^(-1/2) …):
  // in n gleiche Faktoren zerlegen, m davon nehmen
  function rootPowerFig(ast) {
    try {
      const t = strip(ast); if (t.t !== 'pow' || t.sqrt) return null;
      const b = strip(t.a); if (b.t !== 'num' || b.v[1] !== 1 || b.v[0] < 2) return null;
      const q = constOf(t.e); if (!q || q[1] < 2) return null;
      const B = b.v[0], n = q[1], m = Math.abs(q[0]), neg = q[0] < 0;
      const r = Math.round(Math.pow(B, 1 / n)); if (r < 2 || Math.pow(r, n) !== B || n > 6 || m > 8) return null;
      const S = Scene(), w = 1.15, st = 1.4, W = Math.max(n, m) * st - (st - w);
      const row = (y, k, hue, cuts) => { for (let i = 0; i < k; i++) S.chip(i * st, y, w, String(r), i < (cuts || 0) ? -1 : hue, i < (cuts || 0) ? 'cut' : ''); };
      row(0, n, 0);
      S.br(0, n * st - (st - w), 1.35, 'd', B + '=' + r + '^{' + n + '}');
      S.line(W / 2, 2.1, W / 2, 3.1, { arrow: true });
      row(3.4, n, 2, n - 1);
      S.br(0, n * st - (st - w), 4.75, 'd', B + '^{\\frac{1}{' + n + '}}=' + r);
      S.line(W / 2, 5.5, W / 2, 6.5, { arrow: true });
      row(6.8, m, 1);
      const val = Math.pow(r, m);
      S.br(0, m * st - (st - w), 8.15, 'd', B + '^{\\frac{' + m + '}{' + n + '}}=' + r + '^{' + m + '}=' + val);
      if (neg) S.text(W / 2, 9.7, B + '^{-\\frac{' + m + '}{' + n + '}}=\\frac{1}{' + val + '}', { hue: 4, big: true });
      return S.fig();
    } catch (e) { return null; }
  }

  // Zahlenstrahl: wo der Wert liegt (wenn kein Bausteinbild passt, z. B. 1/√2 oder 8^(2/3))
  function valueLine(v, given, rs) {
    try {
      if (!(v > 0) || v > 40) return null;
      const S = Scene(), mx = Math.max(2, Math.ceil(v + 0.6)), step = mx > 12 ? 5 : mx > 8 ? 2 : 1, U = Math.min(2.6, 12 / mx), X = t => t * U;
      S.line(X(0) - 0.3, 0, X(mx) + 0.4, 0, { hue: -1, arrow: true });
      for (let t = 0; t <= mx; t++) if (t % step === 0) { S.line(X(t), -0.14, X(t), 0.14, { hue: -1 }); S.text(X(t), 0.7, String(t), { muted: true }); }
      S.line(X(v), -1.6, X(v), -0.15, { hue: 0, dash: true });
      S.dot(X(v), 0, { hue: 0 });
      S.text(X(v), -2.3, given + '=' + rs, { hue: 0, big: true });
      return S.fig();
    } catch (e) { return null; }
  }

  // ── Hauptfunktion ──
  const fmt = v => String(Math.round(v * 10000) / 10000);
  function approxOf(t) {
    if (t.L.size || t.R.some(r => r.kind === 'l')) return null;
    let v = t.s * qnum(t.c); t.R.forEach(r => { v *= Math.pow(parseInt(r.base, 10), qnum(r.f)); }); return v;
  }
  function processRoot(ast, text, vals, opt) {
    const out = { steps: [], hints: [], vars: [], kind: 'root' };
    const given = M.astTex(ast), root = strip(ast);
    const push = (label, tex) => { const l = out.steps[out.steps.length - 1]; if (l && l.tex === tex) return; out.steps.push({ label, tex }); };
    push('Gegeben', given);
    const items = root.t === 'add' ? root.a : [root];
    const monos = items.map(evalM), terms = monos.map(normal);
    const letters = new Set(); items.forEach(it => mapAst(it, x => { if (x.t === 'var') letters.add(x.n); return null; }));
    if (letters.size) out.hints.push('Buchstaben stehen hier für positive Zahlen.');
    const rt = hasRoot(ast);
    let radHere = terms.some(t => t.R.length);
    // Gesetze
    const exps = ast0 => { let n = 0; mapAst(ast0, x => { if (x.t === 'pow' && !x.sqrt) n++; return null; }); return n; };
    if (rt) out.steps.push({ label: 'Wurzel als Potenz', tex: '\\sqrt[n]{a^{m}}=a^{\\frac{m}{n}}' });
    let needLaws = false;
    try { const lst = []; items.forEach(it => occs(strip(it), ONE, lst)); const seen = new Set(); lst.forEach(o => { if (seen.has(o.key) || qsgn(o.e) < 0) needLaws = true; seen.add(o.key); }); if (items.some(it => { let d = false; mapAst(it, x => { if (x.t === 'pow' && x.a && strip(x.a).t === 'pow') d = true; return null; }); return d; })) needLaws = true; } catch (e) { needLaws = true; }
    if (needLaws && items.length === 1) out.steps.push({ label: 'Potenzgesetze', tex: 'a^{m}\\cdot a^{n}=a^{m+n},\\quad \\left(a^{m}\\right)^{n}=a^{m\\cdot n},\\quad a^{-n}=\\frac{1}{a^{n}}' });
    if (rt) push('Wurzeln als Potenzen', M.astTex(asPower(ast)));
    anyComposite = false; const pf = primeForm(ast);
    if (anyComposite) push('In Primfaktoren zerlegen', M.astTex(pf));
    if (items.length === 1) {
      const m = monos[0];
      const mt = monoTex(m);
      if (m.z) { push('Ergebnis', '0'); out.caption = given + ' = 0'; return out; }
      push('Potenzgesetze anwenden', mt);
      const t = terms[0];
      if ([...m.ex.values()].some(e => qsgn(e) < 0 && !qint(e))) out.steps.push({ label: 'Nenner rational machen', tex: '\\frac{1}{\\sqrt{a}}=\\frac{\\sqrt{a}}{a}' });
      const rs = termTex(t);
      if (radHere || mt !== rs) push(radHere ? 'Als Wurzel schreiben' : 'Ergebnis', rs);
      const ap = approxOf(t);
      if (ap !== null && t.R.length) push('Näherung', rs + '\\approx ' + fmt(ap));
      let res = rs; if (ap !== null && t.R.length) res += ' \\approx ' + fmt(ap);
      out.caption = given + ' = ' + res;
      out.fig = rootPowerFig(ast) || figure(ast);
      if (!out.fig && ap !== null && !t.L.size) out.fig = valueLine(ap, given, rs);
      if (out.steps.length === 1) out.hints.push('Der Term ist schon vereinfacht.');
      const L = out.steps.length; if (L > 2 && (out.steps[L - 1].label === 'Als Wurzel schreiben' || out.steps[L - 1].label === 'Ergebnis') && out.steps[L - 2].tex === out.steps[L - 1].tex) out.steps.splice(L - 2, 1);
      return out;
    }
    // Summe
    const single = terms.map(t => termTex(t));
    const sumFmt = ts => ts.map((s, i) => (i === 0 ? s : (s[0] === '-' ? ' - ' + s.slice(1) : ' + ' + s))).join('');
    const nz = terms.filter(t => !t.z);
    if (!nz.length) { push('Ergebnis', '0'); out.caption = given + ' = 0'; return out; }
    push('Einzelne Terme vereinfachen', sumFmt(nz.map(t => termTex(t))));
    const groups = new Map(); nz.forEach(t => { const k = sigOf(t); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); });
    const merged = [];
    groups.forEach(g => {
      let c = q(0); g.forEach(t => { c = qadd(c, qmul(q(t.s), t.c)); });
      if (!qzero(c)) merged.push(Object.assign({}, g[0], { s: qsgn(c), c: qabs(c) }));
    });
    if (groups.size < nz.length) {
      const parts = [...groups.values()].map(g => { if (g.length === 1) return termTex(g[0]); const base = Object.assign({}, g[0], { c: ONE, s: 1 }); const bt = termTex(base); const cs = g.map((t, i) => (i === 0 ? (t.s < 0 ? '-' : '') : (t.s < 0 ? '-' : '+')) + (t.c[0] === 1 && t.c[1] === 1 ? '1' : qTex(t.c))).join(''); return '(' + cs + ')' + bt; });
      push('Gleichartige Wurzeln zusammenfassen', sumFmt(parts));
    }
    const fin = merged.length ? sumFmt(merged.map(t => termTex(t))) : '0';
    push('Ergebnis', fin);
    let res = fin;
    if (merged.length && merged.every(t => approxOf(t) !== null) && merged.some(t => t.R.length)) { const v = merged.reduce((a, t) => a + approxOf(t), 0); push('Näherung', '\\approx ' + fmt(v)); res += ' \\approx ' + fmt(v); }
    out.caption = given + ' = ' + res;
    out.fig = figureSum(groups);
    return out;
  }
  function figureSum(groups) {
    try {
      const gl = [...groups.values()].filter(g => g.length > 1).sort((a, b) => b.length - a.length)[0];
      if (!gl || gl.some(t => !qint(t.c) || t.c[0] > 12)) return null;
      const total = gl.reduce((a, t) => a + t.c[0], 0); if (total > 24) return null;
      const unit = termTex(Object.assign({}, gl[0], { c: ONE, s: 1 })), w = Math.max(1.5, M.chipW(unit) * 0.9), st = w * 1.12;
      const S = Scene(); let x = 0; const hues = [0, 3, 1, 4, 2];
      gl.forEach((t, i) => {
        const x0 = x;
        for (let j = 0; j < t.c[0]; j++) { S.chip(x, 0, w, unit, hues[i % 5], t.s < 0 ? 'cut' : ''); x += st; }
        S.br(x0, x - st + w, -0.25, 'u', (t.s < 0 ? '-' : '') + termTex(Object.assign({}, t, { s: 1 })));
        if (i < gl.length - 1) { x += 0.7; S.text(x - 0.45, 0.5, gl[i + 1].s < 0 ? '-' : '+', { big: true }); }
      });
      const W = x - st + w;
      let net = 0; gl.forEach(t => { net += t.s * t.c[0]; });
      const y2 = 3.0;
      S.line(W / 2, 1.3, W / 2, y2 - 0.3, { arrow: true });
      const k = Math.abs(net); let x2 = 0;
      for (let j = 0; j < k; j++) { S.chip(x2, y2, w, unit, 3, ''); x2 += st; }
      if (k) S.br(0, x2 - st + w, y2 + 1.4, 'd', termTex(Object.assign({}, gl[0], { c: q(k), s: net < 0 ? -1 : 1 })));
      else S.text(W / 2, y2 + 0.5, '0', { big: true });
      return S.fig();
    } catch (e) { return null; }
  }
  function canon(ast) {
    const root = strip(ast), items = root.t === 'add' ? root.a : [root];
    const terms = items.map(it => normal(evalM(it)));
    if (items.length === 1) return termTex(terms[0]);
    const nz = terms.filter(t => !t.z); if (!nz.length) return '0';
    const groups = new Map(); nz.forEach(t => { const k = sigOf(t); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); });
    const merged = [];
    groups.forEach(g => { let c = q(0); g.forEach(t => { c = qadd(c, qmul(q(t.s), t.c)); }); if (!qzero(c)) merged.push(Object.assign({}, g[0], { s: qsgn(c), c: qabs(c) })); });
    return merged.length ? merged.map((t, i) => { const x = termTex(t); return i === 0 ? x : (x[0] === '-' ? ' - ' + x.slice(1) : ' + ' + x); }).join('') : '0';
  }
  M.register('root', processRoot);
  M.Root = { processRoot, evalM, normal, termTex, canon };
})();
