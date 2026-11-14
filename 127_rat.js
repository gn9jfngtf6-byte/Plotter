// ═══════════════════════════════════════════════════════════════════
// 127_rat.js — Gebrochenrationale Funktionen (Thema aus dem Baukasten 120_kit.js)
//
// Rat: Rechenkern ohne DOM. Zähler und Nenner werden als Text eingegeben (x, Zahlen, + − ·, Klammern,
// Potenzen) und zu Koeffizientenlisten [a₀, a₁, …] ausgerechnet. Daraus: Nullstellen mit Vielfachheit,
// Polstellen und hebbare Lücken, gekürzter Term, Polynomdivision mit Schritten, Asymptote, Vorzeichen.
// ═══════════════════════════════════════════════════════════════════
const Rat = (function () {
  const NMAX = 4, MMAX = 3, CMAX = 1e4;
  const R = v => Math.round(v * 1e10) / 1e10 + 0;
  const tr = c => { c = c.map(R); while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-9) c.pop(); return c.length ? c : [0]; };
  const deg = c => c.length - 1, isZero = c => c.length === 1 && Math.abs(c[0]) < 1e-9;
  const pAdd = (a, b) => { const o = []; for (let i = 0; i < Math.max(a.length, b.length); i++) o.push((a[i] || 0) + (b[i] || 0)); return tr(o); };
  const pScale = (a, k) => tr(a.map(v => v * k));
  const pMul = (a, b) => { const o = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { o[i + j] += x * y; })); return tr(o); };
  const pEval = (c, x) => { let s = 0; for (let i = c.length - 1; i >= 0; i--) s = s * x + c[i]; return s; };
  const pDer = c => tr(c.length > 1 ? c.slice(1).map((v, i) => v * (i + 1)) : [0]);
  // ── Eingabe: Text → {c: Koeffizienten, tex} oder null ──
  const MEMO = new Map();
  function clean(text) { return typeof text === 'string' && text.length <= 60 ? text.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[·⋅×]/g, '*').replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4').replace(/,/g, '.').replace(/X/g, 'x') : null; }
  function parse(text) {
    const s = clean(text); if (!s || /[^0-9x+\-*^().]/.test(s)) return null;
    if (MEMO.has(s)) return MEMO.get(s);
    let i = 0, bad = false;
    const fail = () => { bad = true; return { c: [0], tex: '' }; };
    function base() {
      const ch = s[i];
      if (ch === 'x') { i++; return { c: [0, 1], tex: 'x' }; }
      if (ch === '(') { i++; const e = expr(); if (s[i] !== ')') return fail(); i++; return { c: e.c, tex: '(' + e.tex + ')' }; }
      const m = /^\d+(\.\d+)?|^\.\d+/.exec(s.slice(i)); if (!m) return fail();
      i += m[0].length; const v = parseFloat(m[0]); if (!(Math.abs(v) <= CMAX)) return fail();
      return { c: [v], tex: String(v), num: true };
    }
    function factor() {
      const b = base(); if (bad || s[i] !== '^') return b;
      i++; const m = /^\d+/.exec(s.slice(i)); if (!m) return fail(); i += m[0].length; const n = parseInt(m[0], 10); if (n > 6) return fail();
      let c = [1]; for (let k = 0; k < n; k++) c = pMul(c, b.c);
      return { c, tex: b.tex + '^{' + n + '}' };
    }
    function term() {
      const f = factor(); let c = f.c, tex = f.tex;
      while (!bad && i < s.length) {
        const ch = s[i]; let star = false;
        if (ch === '*') { i++; star = true; } else if (!(ch === 'x' || ch === '(')) break;
        const g = factor(); c = pMul(c, g.c); if (deg(c) > 12) return fail();
        tex += (star && g.num ? '\\cdot ' : '') + g.tex;
      }
      return { c, tex };
    }
    function expr() {
      let neg = false; if (s[i] === '-') { neg = true; i++; } else if (s[i] === '+') i++;
      const t = term(); let c = neg ? pScale(t.c, -1) : t.c, tex = (neg ? '-' : '') + t.tex;
      while (!bad && (s[i] === '+' || s[i] === '-')) { const op = s[i++], u = term(); c = pAdd(c, op === '+' ? u.c : pScale(u.c, -1)); tex += op + u.tex; }
      return { c, tex };
    }
    const e = expr(); let out = null;
    if (!bad && i === s.length && e.c.every(v => isFinite(v) && Math.abs(v) <= CMAX * 100)) {
      let tex = e.tex;
      // ein Klammerpaar um den ganzen Term weglassen
      if (tex[0] === '(' && tex[tex.length - 1] === ')') { let d = 0, whole = true; for (let k = 0; k < tex.length - 1; k++) { if (tex[k] === '(') d++; if (tex[k] === ')') d--; if (d === 0) { whole = false; break; } } if (whole) tex = tex.slice(1, -1); }
      out = { c: tr(e.c), tex, s };
    }
    if (MEMO.size > 300) MEMO.clear(); MEMO.set(s, out); return out;
  }
  const okNum = t => { const p = parse(t); return p && deg(p.c) <= NMAX ? p.s : null; };
  const okDen = t => { const p = parse(t); return p && deg(p.c) <= MMAX && !isZero(p.c) ? p.s : null; };

  // ── Zahlen und Terme als TeX ──
  function snapQ(v) { for (let b = 1; b <= 24; b++) { const a = Math.round(v * b); if (Math.abs(v - a / b) < 1e-7) return [a, b]; } return null; }
  function nf(v) {
    if (!isFinite(v)) return '?'; const q = snapQ(v);
    if (q) return q[1] === 1 ? String(q[0] + 0) : (q[0] < 0 ? '-' : '') + '\\frac{' + Math.abs(q[0]) + '}{' + q[1] + '}';
    const s = String(parseFloat(v.toFixed(3))); return s === '-0' ? '0' : s;
  }
  const dec = v => { const s = String(parseFloat((+v).toFixed(3))); return s === '-0' ? '0' : s; };
  const eqd = v => (Math.abs(v - parseFloat(dec(v))) < 1e-9 * Math.max(1, Math.abs(v)) ? '=' : '\\approx ') + dec(v);
  const nfp = v => (v < 0 ? '(' + nf(v) + ')' : nf(v));
  const monoTex = (a, k, lead) => { const ab = Math.abs(a), co = k > 0 && Math.abs(ab - 1) < 1e-9 ? '' : nf(ab); return (a < 0 ? '-' : lead ? '' : '+') + co + (k === 0 ? '' : k === 1 ? 'x' : 'x^{' + k + '}'); };
  function polyTex(c) { let s = ''; for (let k = c.length - 1; k >= 0; k--) if (Math.abs(c[k]) > 1e-9) s += monoTex(c[k], k, s === ''); return s || '0'; }
  const par = c => { const s = polyTex(c); return c.filter(v => Math.abs(v) > 1e-9).length > 1 || s[0] === '-' ? '(' + s + ')' : s; };
  const fracTex = (a, b) => (deg(b) === 0 && Math.abs(b[0] - 1) < 1e-9 ? polyTex(a) : '\\frac{' + polyTex(a) + '}{' + polyTex(b) + '}');
  // Term für pgfplots (LaTeX-Export)
  const rawPoly = c => '(' + c.map((v, k) => '(' + String(+v.toPrecision(12)) + ')' + (k ? '*x^' + k : '')).join('+') + ')';

  // ── Nullstellen mit Vielfachheit ──
  function rootsRaw(c) {
    c = tr(c); const n = deg(c); if (n < 1) return [];
    if (n === 1) return [-c[0] / c[1]];
    const sc = c.reduce((s, v) => s + Math.abs(v), 0);
    if (n === 2) { const D = c[1] * c[1] - 4 * c[2] * c[0]; if (Math.abs(D) < 1e-9 * sc * sc) return [-c[1] / (2 * c[2])]; if (D < 0) return []; const w = Math.sqrt(D); return [(-c[1] - w) / (2 * c[2]), (-c[1] + w) / (2 * c[2])].sort((a, b) => a - b); }
    const B = 1 + Math.max.apply(null, c.slice(0, n).map(v => Math.abs(v / c[n]))), cr = rootsRaw(pDer(c)).filter(x => Math.abs(x) < B), pts = [-B].concat(cr, [B]), out = [];
    const f = x => pEval(c, x), tol = x => 1e-9 * c.reduce((s, v, i) => s + Math.abs(v) * Math.pow(Math.abs(x), i), 0) + 1e-13;   // Grösse der Rundungsfehler an der Stelle x
    cr.forEach(x => { if (Math.abs(f(x)) < tol(x)) out.push(x); });
    for (let i = 0; i + 1 < pts.length; i++) {
      let a = pts[i], b = pts[i + 1], fa = f(a), fb = f(b); if (Math.abs(fa) < tol(a) || Math.abs(fb) < tol(b) || fa * fb > 0) continue;
      for (let k = 0; k < 80; k++) { const mid = (a + b) / 2, fm = f(mid); if (fa * fm <= 0) { b = mid; fb = fm; } else { a = mid; fa = fm; } }
      out.push((a + b) / 2);
    }
    return out.sort((a, b) => a - b).filter((x, i, L) => i === 0 || Math.abs(x - L[i - 1]) > 1e-6);
  }
  const deflate = (c, r) => { const o = new Array(c.length - 1); let s = 0; for (let i = c.length - 1; i >= 1; i--) { s = s * r + c[i]; o[i - 1] = s; } return tr(o); };
  function mult(c, r) { let k = 0, d = tr(c); const sz = q => q.reduce((s, v, i) => s + Math.abs(v) * Math.pow(Math.abs(r), i), 0); while (deg(d) >= 1 && Math.abs(pEval(d, r)) < 1e-6 * sz(d) + 1e-10 && k < 12) { d = deflate(d, r); k++; } return k; }
  function roots(c) { return rootsRaw(c).map(x => { const q = snapQ(x); return q && Math.abs(pEval(c, q[0] / q[1])) < 1e-7 * (1 + c.reduce((s, v) => s + Math.abs(v), 0)) ? q[0] / q[1] : R(x); }).map(x => ({ x, m: Math.max(1, mult(c, x)) })); }
  // ── Polynomdivision p : q mit Schritten ──
  function divmod(p, q) {
    let rem = tr(p.slice()); const steps = [], dq = deg(q), quot = new Array(Math.max(1, deg(p) - dq + 1)).fill(0);
    while (deg(rem) >= dq && !isZero(rem) && steps.length < 12) {
      const k = deg(rem) - dq, a = rem[deg(rem)] / q[dq], t = new Array(k + 1).fill(0); t[k] = a;
      const prod = pMul(t, q), before = rem; rem = pAdd(rem, pScale(prod, -1)); if (deg(rem) >= deg(before) && !isZero(rem)) { rem = tr(rem.slice(0, deg(before))); }
      quot[k] = a; steps.push({ a: R(a), k, lead: [before[deg(before)], deg(before)], prod, rem });
    }
    return { quot: tr(quot), rem, steps };
  }
  // ── Untersuchung von f = p/q ──
  const INFO = new Map();
  function info(numT, denT) {
    const key = numT + '|' + denT; if (INFO.has(key)) return INFO.get(key);
    const pn = parse(numT), pd = parse(denT); let I = null;
    if (pn && pd && !isZero(pd.c)) {
      const p = pn.c, q = pd.c, zq = roots(q), zp = roots(p); let pr = p, qr = q;
      const gaps = zq.map(z => { const mp = isZero(p) ? 99 : mult(p, z.x), k = Math.min(mp, z.m); for (let j = 0; j < k && !isZero(pr); j++) { pr = deflate(pr, z.x); qr = deflate(qr, z.x); } return { x: z.x, mq: z.m, mp: Math.min(mp, 12) }; });
      const fr = x => pEval(pr, x) / pEval(qr, x);
      gaps.forEach(g => { if (g.mp >= g.mq) { g.kind = 'hole'; g.lim = isZero(p) ? 0 : R(fr(g.x)); } else { g.kind = 'pole'; g.order = g.mq - g.mp; g.flip = g.order % 2 === 1; } });
      const zeros = isZero(p) ? [] : zp.filter(z => !gaps.some(g => Math.abs(g.x - z.x) < 1e-7));
      const D = divmod(p, q), n = deg(p), m = deg(q);
      const asy = isZero(p) ? { kind: 'zero', s: [0] } : m === 0 ? null : n < m ? { kind: 'zero', s: [0] } : n === m ? { kind: 'const', s: D.quot } : n === m + 1 ? { kind: 'line', s: D.quot } : { kind: 'curve', s: D.quot };
      // Vorzeichen: kritische Stellen (Nullstellen und Polstellen des gekürzten Terms, hebbare Lücken) und Abschnitte dazwischen
      const crit = [];
      (isZero(pr) ? [] : roots(pr)).forEach(z => crit.push({ x: z.x, kind: gaps.some(g => Math.abs(g.x - z.x) < 1e-7) ? 'hole' : 'zero', flip: z.m % 2 === 1 }));
      gaps.forEach(g => { if (g.kind === 'pole') crit.push({ x: g.x, kind: 'pole', flip: g.flip }); else if (!crit.some(c => Math.abs(c.x - g.x) < 1e-7)) crit.push({ x: g.x, kind: 'hole', flip: false }); });
      crit.sort((a, b) => a.x - b.x);
      const iv = []; for (let i = 0; i <= crit.length; i++) { const a = i === 0 ? null : crit[i - 1].x, b = i === crit.length ? null : crit[i].x, t = a === null ? (b === null ? 0 : Math.floor(b) - 1) : b === null ? Math.ceil(a) + 1 : niceBetween(a, b); iv.push({ a, b, t, v: fr(t), s: isZero(p) ? 0 : Math.sign(fr(t)) }); }
      I = { p, q, pt: pn.tex, qt: pd.tex, pr, qr, fr, gaps, zeros, zp, zq, D, asy, crit, iv, n, m, reduced: deg(qr) < deg(q), zeroP: isZero(p) };
    }
    if (INFO.size > 200) INFO.clear(); INFO.set(key, I); return I;
  }
  function niceBetween(a, b) { const mid = (a + b) / 2; for (const st of [1, 0.5, 0.25, 0.1]) { const t = Math.round(mid / st) * st; if (t > a + 1e-9 && t < b - 1e-9) return R(t); } return R(mid); }
  // Ausschnitt: alle besonderen Stellen, Höhe nach den Funktionswerten abseits der Polstellen
  function win(I) {
    const xs = I.gaps.map(g => g.x).concat(I.zeros.map(z => z.x), [0]); let x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    const w = Math.max(12, (x1 - x0) + 7), cx = (x0 + x1) / 2; x0 = Math.max(-60, cx - w / 2); x1 = Math.min(60, cx + w / 2);
    const vals = []; for (let i = 0; i <= 240; i++) { const x = x0 + (x1 - x0) * i / 240; if (I.gaps.some(g => g.kind === 'pole' && Math.abs(x - g.x) < (x1 - x0) * 0.03)) continue; const y = I.fr(x); if (isFinite(y)) vals.push(Math.abs(y)); }
    vals.sort((a, b) => a - b); let h = vals.length ? vals[Math.floor(vals.length * 0.8)] * 1.7 : 6;
    I.gaps.forEach(g => { if (g.kind === 'hole') h = Math.max(h, Math.abs(g.lim) + 1.5); });
    let cy = 0; if (I.asy && I.asy.kind === 'const') { cy = I.asy.s[0]; }
    h = Math.max(5, Math.min(60, h)); if (Math.abs(cy) > 60) cy = 0;
    return { x0, x1, y0: Math.min(cy - h, -1.5), y1: Math.max(cy + h, 1.5) };
  }

  // ── Rechenwege ──
  const mk = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const fTex = I => 'f(x)=\\frac{' + I.pt + '}{' + I.qt + '}';
  const xList = L => L.map((z, i) => 'x' + (L.length > 1 ? '_{' + (i + 1) + '}' : '') + '=' + nf(z.x)).join(',\\quad ');
  const domTex = I => (I.gaps.length ? 'D=\\mathbb{R}\\setminus \\{' + I.gaps.map(g => nf(g.x)).join(';\\,') + '\\}' : 'D=\\mathbb{R}');
  const asyTex = I => (I.asy ? 'y=' + polyTex(I.asy.s) : '');
  const WORD = {
    poleFlip: 'Polstelle mit Vorzeichenwechsel', poleKeep: 'Polstelle ohne Vorzeichenwechsel', hole: 'hebbare Lücke',
    zero: 'Die x-Achse ist waagrechte Asymptote.', cst: 'Waagrechte Asymptote', line: 'Schiefe Asymptote', curve: 'Näherungskurve', none: 'Ganzrationale Funktion: keine Asymptote'
  };
  function head(B, I) { B.e(fTex(I) + (I.pt !== polyTex(I.p) || I.qt !== polyTex(I.q) ? '=\\frac{' + polyTex(I.p) + '}{' + polyTex(I.q) + '}' : ''), 'b'); }
  function docGaps(P) {
    const B = mk(), I = info(P.num, P.den); head(B, I);
    B.p('**Nenner null setzen:** Dort ist die Funktion nicht definiert.');
    if (!I.gaps.length) { B.e(polyTex(I.q) + '\\neq 0', 'r'); B.note(I.m === 0 ? 'Der Nenner ist eine Zahl: Das ist eine ganzrationale Funktion ohne Definitionslücken.' : 'Der Nenner wird für keine reelle Zahl null: Die Funktion ist überall definiert.'); }
    else B.e(polyTex(I.q) + '=0\\quad\\Rightarrow\\quad ' + xList(I.gaps), 'r');
    B.e(domTex(I));
    I.gaps.forEach(g => {
      const pv = pEval(I.p, g.x);
      if (g.kind === 'pole' && g.mp === 0) { B.p('**Stelle** $x=' + nf(g.x) + '$: Der Zähler ist dort nicht null.'); B.e('p(' + nf(g.x) + ')=' + nf(pv) + '\\neq 0', 'r'); B.note(g.flip ? 'Polstelle mit Vorzeichenwechsel: Der Graph verschwindet auf der einen Seite nach oben, auf der anderen nach unten.' : 'Polstelle ohne Vorzeichenwechsel: Der Nenner hat hier eine doppelte Nullstelle, der Graph verschwindet auf beiden Seiten in dieselbe Richtung.'); }
      else if (g.kind === 'pole') { B.p('**Stelle** $x=' + nf(g.x) + '$: Zähler und Nenner sind beide null, aber der Nenner öfter. Nach dem Kürzen bleibt der Faktor im Nenner stehen.'); B.note(g.flip ? 'Polstelle mit Vorzeichenwechsel.' : 'Polstelle ohne Vorzeichenwechsel.'); }
      else { B.p('**Stelle** $x=' + nf(g.x) + '$: Auch der Zähler ist dort null. Der gemeinsame Faktor $' + par([-g.x, 1]) + '$ lässt sich kürzen.'); B.e('p(' + nf(g.x) + ')=0,\\qquad \\lim_{x\\to ' + nf(g.x) + '}f(x)=' + nf(g.lim), 'o'); B.note('Hebbare Lücke: Im Graphen fehlt nur der Punkt $(' + nf(g.x) + '\\,|\\,' + nf(g.lim) + ')$.'); }
    });
    if (I.reduced) { B.p('**Gekürzter Term:** Er stimmt ausserhalb der Lücken mit $f$ überein.'); B.e('f(x)=' + fracTex(I.pr, I.qr), 'b'); }
    B.p('**Nullstellen:** Der Zähler ist null, der Nenner nicht.');
    if (I.zeros.length) B.e(xList(I.zeros), 'g'); else B.note(I.zeroP ? 'Der Zähler ist überall null: Die Funktion hat ausserhalb der Lücken überall den Wert 0.' : 'Es gibt keine Nullstellen.');
    const np = I.gaps.filter(g => g.kind === 'pole').length, nh = I.gaps.length - np;
    B.res(I.gaps.length ? 'Polstellen: ' + np + ', hebbare Lücken: ' + nh + ', Nullstellen: ' + I.zeros.length : 'Keine Definitionslücken, Nullstellen: ' + I.zeros.length);
    return { title: 'Definitionslücken und Nullstellen', st: B.st };
  }
  function divLines(B, I) {
    I.D.steps.forEach((s, i) => B.e(monoTex(s.lead[0], s.lead[1], true) + ':' + monoTex(I.q[I.m], I.m, true) + '=' + monoTex(s.a, s.k, true) + ',\\qquad ' + par(i === 0 ? I.p : I.D.steps[i - 1].rem) + '-' + monoTex(s.a, s.k, true).replace(/^-(.*)$/, '(-$1)') + '\\cdot ' + par(I.q) + '=' + polyTex(s.rem), i % 2 ? 'g' : 'b'));
  }
  function docAsym(P) {
    const B = mk(), I = info(P.num, P.den); head(B, I);
    B.p('**Grade vergleichen:** Der Zähler hat den Grad $' + (I.zeroP ? 0 : I.n) + '$, der Nenner den Grad $' + I.m + '$.');
    if (!I.asy) { B.note('Der Nenner ist eine Zahl: Das ist eine ganzrationale Funktion. Sie hat keine Asymptote.'); B.res(WORD.none); return { title: 'Verhalten im Unendlichen', st: B.st }; }
    if (I.asy.kind === 'zero') { B.p('**Zählergrad kleiner:** Für grosse $|x|$ wächst der Nenner schneller als der Zähler, der Bruch geht gegen 0.'); B.e('\\lim_{x\\to \\pm \\infty}f(x)=0\\quad\\Rightarrow\\quad y=0', 'o'); }
    else if (I.asy.kind === 'const') { B.p('**Gleicher Grad:** Für grosse $|x|$ zählen nur die höchsten Potenzen; ihr Verhältnis ist der Grenzwert.'); B.e('\\lim_{x\\to \\pm \\infty}f(x)=\\frac{' + nf(I.p[I.n]) + '}{' + nf(I.q[I.m]) + '}=' + nf(I.asy.s[0]) + '\\quad\\Rightarrow\\quad ' + asyTex(I), 'o'); }
    else {
      B.p(I.asy.kind === 'line' ? '**Zählergrad um eins grösser:** Die Polynomdivision spaltet eine Gerade ab, die schiefe Asymptote.' : '**Zählergrad um mehr als eins grösser:** Die Polynomdivision spaltet eine ganzrationale Funktion ab; an ihren Graphen schmiegt sich die Kurve.');
      divLines(B, I);
    }
    if (I.asy.kind !== 'zero') {
      B.p('**Zerlegung:** ganzrationaler Teil plus Restbruch. Der Restbruch geht für grosse $|x|$ gegen 0.');
      B.e('f(x)=' + polyTex(I.D.quot) + (isZero(I.D.rem) ? '' : '+\\frac{' + polyTex(I.D.rem) + '}{' + polyTex(I.q) + '}'), 'b');
      if (isZero(I.D.rem)) B.note('Die Division geht ohne Rest auf: Ausserhalb der Lücken ist der Graph genau diese ' + (I.asy.kind === 'curve' ? 'Kurve' : 'Gerade') + '.');
    }
    const x0 = P.x0, fx = I.fr(x0), sx = pEval(I.asy.s, x0);
    if (isFinite(fx)) { B.p('**Abstand zur Asymptote** an der Stelle $x_0=' + dec(x0) + '$: Funktionswert minus Wert der Asymptote.'); B.e(dec(fx) + '-' + (sx < 0 ? '(' + dec(sx) + ')' : dec(sx)) + eqd(fx - sx), 'v'); }
    B.res(({ zero: WORD.zero, const: WORD.cst + ' $' + asyTex(I) + '$', line: WORD.line + ' $' + asyTex(I) + '$', curve: WORD.curve + ' $' + asyTex(I) + '$' })[I.asy.kind]);
    return { title: 'Verhalten im Unendlichen', st: B.st };
  }
  function docDiv(P) {
    const B = mk(), I = info(P.dn, P.dd), D = I.D;
    B.e('(' + polyTex(I.p) + '):(' + polyTex(I.q) + ')', 'b');
    if (!D.steps.length) { B.note('Der Zähler hat einen kleineren Grad als der Nenner: Es gibt nichts zu teilen, der Bruch ist schon der Rest.'); B.res('$\\frac{' + polyTex(I.p) + '}{' + polyTex(I.q) + '}$ bleibt, wie es ist'); return { title: 'Polynomdivision', st: B.st }; }
    D.steps.forEach((s, i) => {
      const before = i === 0 ? I.p : D.steps[i - 1].rem;
      B.p('**Schritt ' + (i + 1) + ':** höchste Potenzen teilen, zurückmultiplizieren, abziehen.');
      B.e(monoTex(s.lead[0], s.lead[1], true) + ':' + monoTex(I.q[I.m], I.m, true) + '=' + monoTex(s.a, s.k, true), 'g');
      B.e(monoTex(s.a, s.k, true).replace(/^-(.*)$/, '(-$1)') + '\\cdot ' + par(I.q) + '=' + polyTex(s.prod), 'r');
      B.e(par(before) + '-(' + polyTex(s.prod) + ')=' + polyTex(s.rem), 'b');
    });
    B.p(isZero(D.rem) ? '**Ende:** Der Rest ist 0, die Division geht auf.' : '**Ende:** Der Rest hat einen kleineren Grad als der Nenner. Er bleibt als Bruch stehen.');
    B.e('\\frac{' + polyTex(I.p) + '}{' + polyTex(I.q) + '}=' + polyTex(D.quot) + (isZero(D.rem) ? '' : '+\\frac{' + polyTex(D.rem) + '}{' + polyTex(I.q) + '}'), 'b');
    B.p('**Probe:** Quotient mal Nenner plus Rest ergibt den Zähler.');
    B.e(par(D.quot) + '\\cdot ' + par(I.q) + (isZero(D.rem) ? '' : '+' + par(D.rem)) + '=' + polyTex(pAdd(pMul(D.quot, I.q), D.rem)), 'o');
    B.res('Quotient $' + polyTex(D.quot) + '$, Rest $' + polyTex(D.rem) + '$');
    return { title: 'Polynomdivision', st: B.st };
  }
  function docSign(P) {
    const B = mk(), I = info(P.num, P.den); head(B, I);
    B.p('**Stellen, an denen das Vorzeichen wechseln kann:** Nullstellen des Zählers und des Nenners.');
    if (!I.crit.length) B.note('Es gibt weder Nullstellen noch Definitionslücken: Die Funktion hat überall dasselbe Vorzeichen.');
    else B.e(I.crit.map((c, i) => 'x' + (I.crit.length > 1 ? '_{' + (i + 1) + '}' : '') + '=' + nf(c.x)).join(',\\quad '), 'o');
    I.crit.forEach(c => { if (!c.flip && c.kind !== 'hole') B.note((c.kind === 'zero' ? 'Bei $x=' + nf(c.x) + '$ liegt eine doppelte Nullstelle: Der Graph berührt die x-Achse, das Vorzeichen bleibt.' : 'Bei $x=' + nf(c.x) + '$ liegt eine Polstelle ohne Vorzeichenwechsel.')); });
    B.p('**Probewerte:** In jedem Abschnitt genügt ein einziger Wert, denn dazwischen kann das Vorzeichen nicht wechseln.');
    I.iv.forEach(v => { const rng = v.a === null ? (v.b === null ? 'x\\in \\mathbb{R}' : 'x<' + nf(v.b)) : v.b === null ? 'x>' + nf(v.a) : nf(v.a) + '<x<' + nf(v.b); B.e(rng + ':\\quad f(' + nf(v.t) + ')' + eqd(v.v) + (v.s > 0 ? '>0' : v.s < 0 ? '<0' : ''), v.s > 0 ? 'g' : v.s < 0 ? 'r' : undefined); });
    if (I.asy) { B.p('**Für grosse** $|x|$ nähert sich der Graph der Asymptote.'); B.e(asyTex(I), 'o'); }
    B.res('Vorzeichen von links nach rechts: $' + I.iv.map(v => (v.s > 0 ? '+' : v.s < 0 ? '-' : '0')).join('\\ \\ ') + '$');
    return { title: 'Vorzeichen und Skizze', st: B.st };
  }
  const doc = (v, P) => ({ gaps: docGaps, asym: docAsym, div: docDiv, sign: docSign })[v](P);
  return { NMAX, MMAX, parse, clean, okNum, okDen, deg, isZero, pAdd, pMul, pScale, pEval, pDer, roots, mult, deflate, divmod, info, win, nf, dec, eqd, snapQ, polyTex, monoTex, fracTex, rawPoly, asyTex, domTex, fTex, WORD, doc };
})();

// ── Bilder ──
const ratRect = (W, H, C) => ({ x: C.fs * 0.4, y: C.fs * 1.1, w: W - C.fs * 0.8, h: H - C.fs * 1.4 });
// Rahmen, Polstellen, Graph, Lücken und Nullstellen
function ratBase(S, W, H, C, o) {
  const P = C.P, fs = C.fs, I = Rat.info(P.num, P.den), F = Rat.nf;
  const m = kitFrame(S, ratRect(W, H, C), C, Rat.win(I), { title: '\\col{b}{' + Rat.fTex(I) + '}', info: o.info ? o.info(I) : '' });
  if (o.under) o.under(m, I);
  I.gaps.forEach(g => { if (g.kind !== 'pole') return; difSeg(S, m, g.x, m.win.y0, g.x, m.win.y1, { col: ST_R, lw: 1.6, dash: [6, 4], hl: 'pole' }); if (difInside(m, m.X(g.x), m.T, 1)) difLabel(S, m, m.X(g.x) + fs * 2.3, m.T + fs * 0.9, '\\col{r}{x=' + F(g.x) + '}', C, {}); });
  if (o.mid) o.mid(m, I);
  difCurve(S, m, difRaw(I.fr, Rat.rawPoly(I.pr) + '/' + Rat.rawPoly(I.qr)), { col: ST_B, hl: 'f', exp: C.exp, lw: 2.4 });
  I.zeros.forEach(z => { const q = difDot(S, m, z.x, 0, { fill: ST_G, r: 5 }); if (q) shlC(S, 'zero', q[0], q[1], 12); });
  I.gaps.forEach(g => { if (g.kind !== 'hole') return; const px = m.X(g.x), py = m.Y(g.lim); if (!difInside(m, px, py, 1)) return; S.circ(px, py, 5.5, { fill: 'W', stroke: ST_O, lw: 2.2 }); shlC(S, 'hole', px, py, 13); difLabel(S, m, px + fs * 2.6, py + fs * (o.holeDy || -1.2), '\\col{o}{(' + F(g.x) + '\\,|\\,' + F(g.lim) + ')}', C, {}); });
  return { m, I };
}
// Ziehbarer Punkt P auf dem Graphen (am Rand festgehalten, wenn der Wert ausserhalb liegt)
function ratProbe(S, m, C, I) {
  const P = C.P, x0 = P.x0, y = I.fr(x0), ok = isFinite(y), yc = ok ? kitClamp(y, m.win.y0, m.win.y1) : 0;
  kitDragPt(S, m, C, 'P', x0, yc, { col: ST_V, hl: 'P', r: 6.5 }, x => { P.x0 = kitClamp(Math.round(x * 10) / 10, -60, 60); });
  if (difInside(m, m.X(x0), m.Y(yc), 2)) difLabel(S, m, m.X(x0) + C.fs * 0.9, m.Y(yc) - C.fs * 1.1, '\\col{v}{P}', C, {});
  return { x0, y, ok };
}
const ratInfoP = (I, P) => { const y = I.fr(P.x0); return '\\col{v}{f(' + Rat.dec(P.x0) + ')' + (isFinite(y) ? Rat.eqd(y) : '\\ \\text{ist nicht definiert}') + '}'; };
function ratSceneGaps(S, W, H, C) {
  const b = ratBase(S, W, H, C, { info: I => ratInfoP(I, C.P) });
  const pr = ratProbe(S, b.m, C, b.I); if (pr.ok) difSeg(S, b.m, pr.x0, 0, pr.x0, kitClamp(pr.y, b.m.win.y0, b.m.win.y1), { col: ST_V, lw: 1.2, dash: [4, 4] });
}
function ratSceneAsym(S, W, H, C) {
  const P = C.P, fs = C.fs;
  const b = ratBase(S, W, H, C, { holeDy: 1.5, info: I => (I.asy ? '\\col{o}{' + Rat.asyTex(I) + '}' : ''), mid: (m, I) => {
    if (!I.asy) return; const s = I.asy.s;
    if (Rat.deg(s) <= 1) difLine(S, m, 0, s[0], s[1] || 0, { col: ST_O, lw: 2, dash: [8, 5], hl: 'asy' });
    else difCurve(S, m, difRaw(x => Rat.pEval(s, x), Rat.rawPoly(s)), { col: ST_O, lw: 2, dash: [8, 5], hl: 'asy', exp: C.exp });
  } }), I = b.I, m = b.m;
  if (I.asy) { const fx = I.fr(P.x0), sx = Rat.pEval(I.asy.s, P.x0); if (isFinite(fx)) { difSeg(S, m, P.x0, sx, P.x0, fx, { col: ST_V, lw: 3, hl: 'diff' }); const py = m.Y(kitClamp((fx + sx) / 2, m.win.y0, m.win.y1)); if (difInside(m, m.X(P.x0), py, 2)) difLabel(S, m, m.X(P.x0) + fs * 3.2, py + fs * 1.3, '\\col{v}{' + Rat.eqd(fx - sx).replace(/^=/, '') + '}', C, {}); } }
  else S.text(m.L + fs * 2.4, m.T + fs * 1.1, Rat.WORD.none, { size: fs * 0.95, col: 'M', al: 'l', bs: 'm' });
  ratProbe(S, m, C, I);
}
function ratSceneSign(S, W, H, C) {
  const fs = C.fs;
  const b = ratBase(S, W, H, C, { holeDy: 1.5, info: I => (I.asy ? '\\col{o}{' + Rat.asyTex(I) + '}' : ''), under: (m, I) => {
    // Felder, in denen kein Graph verläuft
    const y0 = kitClamp(m.Y(0), m.T, m.B);
    I.iv.forEach(v => { const a = m.X(v.a === null ? m.win.x0 : Math.max(v.a, m.win.x0)), c = m.X(v.b === null ? m.win.x1 : Math.min(v.b, m.win.x1)); if (!(c - a > 0.5) || !v.s) return;
      const yy = v.s > 0 ? y0 : m.T, hh = v.s > 0 ? m.B - y0 : y0 - m.T; if (hh < 0.5) return; S.rect(a, yy, c - a, hh, { fill: 'M', a: 0.13 }); shlBox(S, 'gray', a, yy, c, yy + hh); });
  }, mid: (m, I) => { if (I.asy) { const s = I.asy.s; if (Rat.deg(s) <= 1) difLine(S, m, 0, s[0], s[1] || 0, { col: ST_O, lw: 1.6, dash: [8, 5] }); else difCurve(S, m, difRaw(x => Rat.pEval(s, x), Rat.rawPoly(s)), { col: ST_O, lw: 1.6, dash: [8, 5], exp: C.exp }); } } }), I = b.I, m = b.m;
  // Vorzeichenstreifen am unteren Rand
  const sh = fs * 1.5, sy = m.B - sh - 2;
  I.iv.forEach(v => { const a = m.X(v.a === null ? m.win.x0 : Math.max(v.a, m.win.x0)), c = m.X(v.b === null ? m.win.x1 : Math.min(v.b, m.win.x1)); if (!(c - a > 0.5)) return; const col = v.s > 0 ? ST_G : v.s < 0 ? ST_R : 'M';
    S.rect(a, sy, c - a, sh, { fill: col, stroke: col, lw: 1, a: 0.3 }); shlBox(S, 'strip', a, sy, c, sy + sh);
    if (c - a > fs * 1.2) S.text((a + c) / 2, sy + sh / 2, v.s > 0 ? '+' : v.s < 0 ? '−' : '0', { size: fs * 1.25, col, al: 'c', bs: 'm', bold: true }); });
  I.crit.forEach(c => { const px = m.X(c.x); if (!difInside(m, px, sy, 1)) return; S.line(px, sy - 3, px, sy + sh + 1, { col: 'T', lw: 1.6 }); if (c.kind === 'hole') { const py = m.Y(I.fr(c.x)); if (difInside(m, px, py, 1)) shlC(S, 'hole', px, py, 13); } });
}
// Polynomdivision als Schema: Dividend, Zeilen «−(Produkt)» und Reste, rechts der Quotient
function ratSceneDiv(S, W, H, C) {
  const P = C.P, I = Rat.info(P.dn, P.dd), D = I.D, n = I.n, nst = D.steps.length, k = C.t !== null && C.t !== undefined ? Math.min(nst, Math.floor(C.t * (nst + 1))) : Math.min(nst, P.k);
  const wOf = (s, size) => { let w = s.replace(/\\[a-z]+ ?/g, '').replace(/[{}^]/g, '').length * 0.56 * size; try { if (typeof finRichSize === 'function') { const q = finRichSize(s, size).w; if (isFinite(q) && q > 0) w = q; } } catch (e) { /* Schätzung */ } return w; };
  const terms = (c, top) => { const o = []; let first = true; for (let d = Math.min(c.length - 1, top); d >= 0; d--) if (Math.abs(c[d]) > 1e-9) { o.push([n - d, Rat.monoTex(c[d], d, first)]); first = false; } return o.length ? o : [[n, '0']]; };
  const rows = [{ t: terms(I.p, n), col: 'T' }];
  for (let i = 0; i < k; i++) { const s = D.steps[i]; rows.push({ t: terms(s.prod, s.lead[1]), col: ST_R, sub: true, hl: i === 0 ? 'prod' : null, cur: i === k - 1 }); rows.push({ t: terms(s.rem, s.lead[1] - 1), col: ST_B, hl: i === 0 ? 'rem' : null, cur: i === k - 1, last: i === nst - 1 }); }
  const frac = rows.some(r => r.t.some(q => /frac/.test(q[1]))), right0 = '\\ :\\ (' + Rat.polyTex(I.q) + ')\\ =\\ ';
  let quotS = ''; for (let i = 0; i < k; i++) quotS += Rat.monoTex(D.steps[i].a, D.steps[i].k, i === 0);
  const restS = k === nst && !Rat.isZero(D.rem) ? '+\\frac{' + Rat.polyTex(D.rem) + '}{' + Rat.polyTex(I.q) + '}' : '', full = nst === 0 ? '\\frac{' + Rat.polyTex(I.p) + '}{' + Rat.polyTex(I.q) + '}' : '';
  let quotAll = ''; D.steps.forEach((s, i) => { quotAll += Rat.monoTex(s.a, s.k, i === 0); });
  // Schriftgrösse so, dass alles Platz hat
  let size = C.fs * 1.35, cw = 0, total = 0, lh = 0;
  for (let pass = 0; pass < 2; pass++) {
    cw = 0; D.steps.forEach(s => { terms(s.prod, s.lead[1]).concat(terms(s.rem, s.lead[1] - 1)).forEach(q => { cw = Math.max(cw, wOf(q[1], size)); }); }); terms(I.p, n).forEach(q => { cw = Math.max(cw, wOf(q[1], size)); });
    cw += size * 0.55; lh = size * (frac ? 2.5 : 1.75);
    total = size * 1.6 + (n + 1) * cw + size * 0.9 + wOf(right0, size) + wOf((quotAll || full) + (Rat.isZero(D.rem) || !nst ? '' : '+\\frac{' + Rat.polyTex(D.rem) + '}{' + Rat.polyTex(I.q) + '}'), size) + size;
    const need = (2 * nst + 1) * lh + size * 3, f = Math.min(1, (W - C.fs * 2) / total, (H - C.fs * 2) / need); if (f >= 0.999) break; size *= f;
  }
  const x0 = Math.max(C.fs, (W - total) / 2) + size * 1.6, y0 = Math.max(C.fs * 2.2, Math.min(H * 0.16, (H - (2 * nst + 1) * lh) / 2));
  const colR = idx => x0 + (idx + 1) * cw;
  rows.forEach((r, ri) => {
    const y = y0 + ri * lh, i0 = r.t[0][0], i1 = r.t[r.t.length - 1][0];
    r.t.forEach(q => S.rich(colR(q[0]), y, q[1], { size, col: r.col, al: 'r', bs: 'm', bold: !!r.cur }));
    if (r.sub) { S.rich(colR(i0) - cw + size * 0.1, y, '-(', { size, col: r.col, al: 'r', bs: 'm' }); S.rich(colR(i1) + size * 0.12, y, ')', { size, col: r.col, al: 'l', bs: 'm' }); S.line(colR(i0) - cw - size * 0.6, y + lh * 0.52, colR(i1) + size * 0.5, y + lh * 0.52, { col: 'T', lw: 1.3 }); }
    if (r.hl) shlBox(S, r.hl, colR(i0) - cw - size * 0.8, y - lh * 0.45, colR(i1) + size * 0.6, y + lh * 0.45);
    if (r.last && !r.sub && !C.exp) S.text(colR(i1) + size * 0.9, y, 'Rest', { size: size * 0.7, col: 'M', al: 'l', bs: 'm' });
  });
  const xr = colR(n) + size * 0.3; S.rich(xr, y0, right0, { size, col: 'T', al: 'l', bs: 'm' });
  const xq = xr + wOf(right0, size), qs = (quotS || (nst ? '' : full)) + restS;
  if (qs) S.rich(xq, y0, qs, { size, col: ST_G, al: 'l', bs: 'm', bold: true });
  shlBox(S, 'quot', xq - size * 0.3, y0 - lh * 0.6, xq + Math.max(size * 2, wOf(qs || 'x', size)) + size * 0.3, y0 + lh * 0.6);
  if (!nst) S.text(W / 2, y0 + lh * 1.6, 'Der Zähler hat einen kleineren Grad als der Nenner: Es gibt nichts zu teilen.', { size: C.fs, col: 'M', al: 'c', bs: 'm' });
}

(function () {
  const ERR = 'Dieser Term wird nicht verstanden. Erlaubt sind x, Zahlen, Plus, Minus, Mal, Klammern und Potenzen; der Zähler höchstens vom Grad vier, der Nenner höchstens vom Grad drei und nicht null.';
  const KEYS = ['x', '^', '(', ')', '+', '-'];
  const fn = (num, den, more) => Object.assign({ num, den }, more || {});
  kitDefine({
    id: 'rat', icon: '1/x', title: 'Gebrochenrationale Funktionen', group: 'fn',
    desc: 'Definitionslücken (Polstellen mit und ohne Vorzeichenwechsel, hebbare Lücken) und Nullstellen, waagrechte und schiefe Asymptoten, Polynomdivision Schritt für Schritt, Vorzeichen und Gebietseinteilung für die Skizze',
    about: 'Brüche aus zwei ganzrationalen Funktionen: Wo ist die Funktion nicht definiert, was geschieht an einer Polstelle, welcher Geraden nähert sich der Graph, und wie skizziert man ihn von Hand?',
    tip: 'Tippe links Zähler und Nenner als Terme in x ein und bestätige mit «Übernehmen» oder der Eingabetaste. Die Beispiele zeigen, was möglich ist.',
    help: ['Zähler und Nenner gibst du als Term in x ein: Zahlen, x, + und −, Klammern und Potenzen mit dem Zeichen ^. Das Malzeichen darf vor x und vor Klammern fehlen.',
      'Der Zähler darf höchstens den Grad 4 haben, der Nenner höchstens den Grad 3. Die Polynomdivision hat eigene Eingabefelder.',
      'Den violetten Punkt P ziehst du dem Graphen entlang; der Ausschnitt lässt sich mit der Maus verschieben und zoomen.'],
    kw: { gaps: 'gebrochenrationale Funktion Bruchfunktion Definitionslücke Definitionsbereich Polstelle Pol hebbare Lücke kürzen Nullstelle senkrechte Asymptote', asym: 'Asymptote waagrecht schief Grenzwert unendlich Zählergrad Nennergrad Näherungskurve Verhalten im Unendlichen', div: 'Polynomdivision Division mit Rest Quotient Linearfaktor abspalten', sign: 'Vorzeichen Vorzeichentabelle Gebietseinteilung Felder Skizze Vorzeichenwechsel doppelte Nullstelle' },
    views: [['gaps', 'Definitionslücken und Nullstellen'], ['asym', 'Asymptoten: Verhalten im Unendlichen'], ['div', 'Polynomdivision'], ['sign', 'Vorzeichen und Skizze']],
    quiz: ['gaps', 'asym', 'div', 'sign'], shared: ['num', 'den'],
    descs: {
      gaps: ['Wo der Nenner null wird, ist die Funktion nicht definiert: An einer {{Polstelle (rot)|pole}} verschwindet der Graph nach oben oder unten, an einer {{hebbaren Lücke|hole}} fehlt nur ein einzelner Punkt. Die {{Nullstellen der Funktion|zero}} liegen dort, wo nur der Zähler null wird. Ziehe den {{violetten Punkt auf dem Graphen|P}} nahe an eine Lücke.',
        'Eine gebrochenrationale Funktion ist ein Bruch aus zwei ganzrationalen Funktionen. Nullstellen des Nenners sind Definitionslücken. Ist dort auch der Zähler null und lässt sich der gemeinsame Faktor ganz kürzen, ist die Lücke hebbar; sonst liegt eine Polstelle vor.'],
      asym: ['Für sehr grosse und sehr kleine x schmiegt sich der {{blaue Graph|f}} an die {{orange Asymptote|asy}}. Ziehe den {{Punkt P nach aussen|P}}: Der {{Abstand zur Asymptote|diff}} wird beliebig klein. Welche Asymptote entsteht, entscheiden die Grade von Zähler und Nenner.',
        'Zählergrad kleiner als Nennergrad: Die x-Achse ist Asymptote. Gleiche Grade: waagrechte Asymptote in der Höhe des Verhältnisses der höchsten Koeffizienten. Zählergrad um eins grösser: schiefe Asymptote; man findet sie mit der Polynomdivision.'],
      div: ['Die Polynomdivision läuft wie die schriftliche Division von Zahlen: höchste Potenzen teilen und das Ergebnis zum {{Quotienten (grün)|quot}} schreiben, {{zurückmultiplizieren|prod}}, {{abziehen|rem}} und von vorn beginnen, bis der Rest einen kleineren Grad hat als der Nenner. Stelle links ein, wie viele Schritte gezeigt werden.',
        'Jede gebrochenrationale Funktion, deren Zählergrad mindestens so gross ist wie der Nennergrad, lässt sich in eine ganzrationale Funktion und einen Restbruch zerlegen. Geht die Division ohne Rest auf, ist der Nenner ein Faktor des Zählers.'],
      sign: ['Zwischen {{Nullstellen und Polstellen|strip}} kann die Funktion ihr Vorzeichen nicht wechseln. Der Streifen unten zeigt das Vorzeichen für jeden Abschnitt; in den {{grauen Feldern|gray}} verläuft kein Graph. Zusammen mit {{Polgeraden|pole}} und Asymptote lässt sich der {{Verlauf des Graphen|f}} so von Hand skizzieren.',
        'Gebietseinteilung: An einfachen Nullstellen und an Polstellen ungerader Ordnung wechselt das Vorzeichen, an doppelten Nullstellen und an Polstellen gerader Ordnung nicht. Ein Probewert pro Abschnitt genügt.']
    },
    def: {
      gaps: fn('(x-2)(x+1)', '(x-2)(x+2)', { x0: -1.5, win: null }),
      asym: fn('(x-2)(x+1)', '(x-2)(x+2)', { x0: 4, win: null }),
      div: { dn: 'x^3-2x^2+3', dd: 'x-1', k: 3 },
      sign: fn('(x-2)(x+1)', '(x-2)(x+2)', { win: null })
    },
    controls(v, P) {
      if (v === 'div') { const I = Rat.info(P.dn, P.dd), n = I ? I.D.steps.length : 12; return [{ k: 'dn', t: 'text', l: 'Zähler (Dividend)', ok: Rat.okNum, keys: KEYS, err: ERR }, { k: 'dd', t: 'text', l: 'Nenner (Divisor)', ok: Rat.okDen, keys: KEYS, err: ERR }, { k: 'k', t: 'range', l: 'Gezeigte Schritte', min: 0, max: Math.max(1, n), step: 1, d: 0 }]; }
      const L = [{ k: 'num', t: 'text', l: 'Zähler p(x)', ok: Rat.okNum, keys: KEYS, err: ERR }, { k: 'den', t: 'text', l: 'Nenner q(x)', ok: Rat.okDen, keys: KEYS, err: ERR }];
      if (v !== 'sign') L.push({ k: 'x0', t: 'num', l: 'Stelle x₀ von P', min: -60, max: 60, step: 0.1 });
      return L;
    },
    presets: {
      gaps: [['Polstelle und hebbare Lücke', fn('(x-2)(x+1)', '(x-2)(x+2)', { x0: -1.5 })], ['Hyperbel mit verschobener Polstelle', fn('1', 'x-2', { x0: 2.5 })], ['Polstelle ohne Vorzeichenwechsel', fn('1', '(x-1)^2', { x0: 1.5 })], ['Zwei Polstellen', fn('x', 'x^2-4', { x0: 1 })], ['Keine Definitionslücke', fn('3', 'x^2+1', { x0: 1 })], ['Nur eine hebbare Lücke', fn('x^2-4', 'x-2', { x0: 1 })]],
      asym: [['Zählergrad kleiner: x-Achse als Asymptote', fn('3x', 'x^2+1', { x0: 4 })], ['Gleicher Grad: waagrechte Asymptote', fn('2x^2-1', 'x^2+1', { x0: 3 })], ['Zählergrad um eins grösser: schiefe Asymptote', fn('x^2+1', 'x-1', { x0: 4 })], ['Schiefe Asymptote und zwei Polstellen', fn('x^3', 'x^2-1', { x0: 3 })], ['Zählergrad um zwei grösser: Näherungsparabel', fn('x^3+2', '2x', { x0: 2 })]],
      div: [['Division mit Rest', { dn: 'x^3-2x^2+3', dd: 'x-1', k: 3 }], ['Division ohne Rest', { dn: 'x^3-2x^2-x+2', dd: 'x-1', k: 3 }], ['Fehlende Potenzen im Zähler', { dn: 'x^3+1', dd: 'x+2', k: 3 }], ['Nenner vom Grad zwei', { dn: '2x^3-x^2+4', dd: 'x^2+1', k: 2 }], ['Leitkoeffizient im Nenner', { dn: '4x^2+2x-1', dd: '2x-1', k: 2 }]],
      sign: [['Nullstelle, Polstelle und hebbare Lücke', fn('(x-2)(x+1)', '(x-2)(x+2)')], ['Zwei Polstellen und eine Nullstelle', fn('x', 'x^2-4')], ['Doppelte Nullstelle: kein Vorzeichenwechsel', fn('(x-1)^2', 'x+2')], ['Doppelte Polstelle: kein Vorzeichenwechsel', fn('x+1', '(x-2)^2')], ['Überall positiv', fn('3', 'x^2+1')]]
    },
    fix(v, P) {
      if (v === 'div') { if (!Rat.okNum(P.dn)) P.dn = 'x^3-2x^2+3'; if (!Rat.okDen(P.dd)) P.dd = 'x-1'; const n = Rat.info(P.dn, P.dd).D.steps.length; P.k = kitClamp(Math.round(P.k), 0, n); return; }
      if (!Rat.okNum(P.num)) P.num = '(x-2)(x+1)'; if (!Rat.okDen(P.den)) P.den = '(x-2)(x+2)';
      if ('x0' in P) P.x0 = kitClamp(Math.round(P.x0 * 10) / 10, -60, 60);
    },
    scene: { gaps: ratSceneGaps, asym: ratSceneAsym, div: ratSceneDiv, sign: ratSceneSign },
    anim: { div: ['▶ Schritt für Schritt', 7000] },
    doc: (v, P) => Rat.doc(v, P)
  });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { Rat };
