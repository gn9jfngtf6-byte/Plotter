// ═════════════════════════════════════════════════════════════════
// MODUL 109: Lineare Optimierung – Rechenkern (ohne DOM)
//
// Aufbau nach dem Dossier «Lineare Optimierung» (HMS): lineare Ungleichungen mit einer Variablen, Ungleichungen mit
// zwei Variablen (Halbebene, Testpunkt), Ungleichungssysteme und Planungspolygon (Eckpunkte), Zielfunktion und Optimum
// (Niveaulinie, Eckpunktprinzip, Ganzzahligkeit).
//   Lp.parseLin(s)            linearer Term in x, y → {x, y, c} oder null
//   Lp.parseIneq(s)           «2x+3y<=12» → {a, b, c, rel, src} mit a·x + b·y rel c  (rel: '<=', '>=', '<', '>', '=')
//   Lp.tex(I)                 LaTeX der Ungleichung
//   Lp.ok(I, x, y)            erfüllt?
//   Lp.region(list, nonneg)   Planungspolygon {poly, bounded, empty}
//   Lp.vertices(list, nonneg) Eckpunkte mit den beiden Grenzgeraden, die sich dort schneiden
//   Lp.parseObj(s)            «Z = 1000x + 2000y» → {p, q}
//   Lp.optimum(...)           bester Eckpunkt bzw. Kante; unbeschränkt
//   Lp.intPoints / Lp.intOpt  ganzzahlige Punkte und ganzzahliges Optimum
//   Lp.solve1(I)              Ungleichung mit einer Variablen: Grenze, Umkehr des Zeichens, Intervall
// Rechenwege: 109b_lop_docs.js. Bilder: 110_lop_draw.js. Panel: 111_lop_ui.js.
// ═════════════════════════════════════════════════════════════════
const Lp = (function () {
  const E = Dif.E;
  const fmt = (v, d) => Dif.fmtT(v, d === undefined ? 4 : d);
  function q(v) {
    if (!isFinite(v)) return v > 0 ? '\\infty' : v < 0 ? '-\\infty' : '\\text{–}';
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v) + 0);
    if (Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6) return String(Math.round(v * 1000) / 1000).replace(/^-/, '-');   // kurze Dezimalzahl (0.3, 1.5, 0.125)
    const r = E.qFromFloat(v);
    if (r && Math.abs(Number(r.d)) <= 1000 && Math.abs(Number(r.n)) < 1e9) return E.qTex(r);
    return fmt(v);
  }
  const big = v => (Math.abs(v) >= 1e4 && Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : q(v));

  // ── Parser ──
  function lex(s) {
    s = String(s || '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, '');
    const out = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; const v = Number(s.slice(i, j)); if (!isFinite(v)) return null; out.push({ t: 'n', v }); i = j; }
      else if (c === 'x' || c === 'y') { out.push({ t: 'v', v: c }); i++; }
      else if ('+-*/()'.indexOf(c) >= 0) { out.push({ t: c }); i++; }
      else return null;
    }
    return out;
  }
  function parseLin(s) {
    const tk = lex(s); if (!tk || !tk.length) return null;
    let i = 0;
    const L = (x, y, c) => ({ x, y, c });
    const isConst = a => Math.abs(a.x) < 1e-12 && Math.abs(a.y) < 1e-12;
    const add = (a, b, s0) => L(a.x + s0 * b.x, a.y + s0 * b.y, a.c + s0 * b.c);
    const mul = (a, b) => (isConst(a) ? L(a.c * b.x, a.c * b.y, a.c * b.c) : isConst(b) ? L(b.c * a.x, b.c * a.y, b.c * a.c) : null);
    function factor() {
      const t = tk[i]; if (!t) return null;
      if (t.t === '-' || t.t === '+') { i++; const f = factor(); return f && (t.t === '-' ? L(-f.x, -f.y, -f.c) : f); }
      if (t.t === 'n') { i++; return L(0, 0, t.v); }
      if (t.t === 'v') { i++; return t.v === 'x' ? L(1, 0, 0) : L(0, 1, 0); }
      if (t.t === '(') { i++; const e = expr(); if (!e || !tk[i] || tk[i].t !== ')') return null; i++; return e; }
      return null;
    }
    function term() {
      let a = factor(); if (!a) return null;
      for (;;) {
        const t = tk[i]; if (!t) break;
        if (t.t === '*' || t.t === '/') { i++; const b = factor(); if (!b) return null; if (t.t === '*') { a = mul(a, b); if (!a) return null; } else { if (!isConst(b) || Math.abs(b.c) < 1e-15) return null; a = L(a.x / b.c, a.y / b.c, a.c / b.c); } }
        else if (t.t === 'n' || t.t === 'v' || t.t === '(') { const b = factor(); if (!b) return null; a = mul(a, b); if (!a) return null; }
        else break;
      }
      return a;
    }
    function expr() {
      let a = term(); if (!a) return null;
      while (tk[i] && (tk[i].t === '+' || tk[i].t === '-')) { const s0 = tk[i].t === '+' ? 1 : -1; i++; const b = term(); if (!b) return null; a = add(a, b, s0); }
      return a;
    }
    const r = expr(); return r && i === tk.length ? r : null;
  }
  const REL = { '<=': '\\le', '>=': '\\ge', '<': '<', '>': '>', '=': '=' };
  function parseIneq(src) {
    const s = String(src || '').replace(/≤|=<|⩽/g, '<=').replace(/≥|=>|⩾/g, '>=');
    const m = s.match(/^(.*?)(<=|>=|<|>|=)(.*)$/); if (!m) return null;
    if (/(<=|>=|<|>|=)/.test(m[3])) return null;
    const l = parseLin(m[1]), r = parseLin(m[3]); if (!l || !r) return null;
    const a = l.x - r.x, b = l.y - r.y, c = r.c - l.c;
    if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) return null;
    return { a: a + 0, b: b + 0, c: c + 0, rel: m[2], src: String(src).trim(), l, r };
  }
  // a·x + b·y als LaTeX (ganzzahlige/gekürzte Koeffizienten)
  function linTex(a, b, vx, vy) {
    vx = vx || 'x'; vy = vy || 'y'; let s = '';
    const part = (k, v) => { if (Math.abs(k) < 1e-12) return; const neg = k < 0, ak = Math.abs(k), t = Math.abs(ak - 1) < 1e-12 ? '' : q(ak); s += (s ? (neg ? '-' : '+') : (neg ? '-' : '')) + t + v; };
    part(a, vx); part(b, vy);
    return s || '0';
  }
  // ganzzahlige Darstellung (mit positivem Faktor erweitert, gekürzt): ⅔x + y ≤ 4 → 2x + 3y ≤ 12
function intForm(I) {
  const den = v => { const r = E.qFromFloat(v); return r ? Math.abs(Number(r.d)) : 1; };
  let k = 1; [I.a, I.b, I.c].forEach(v => { const d = den(v); if (d > 1 && d <= 1000) k = k * d / gcd(k, d); });
  const A = Math.round(I.a * k * 1e6) / 1e6, B = Math.round(I.b * k * 1e6) / 1e6, Cc = Math.round(I.c * k * 1e6) / 1e6;
  if ([A, B, Cc].every(v => Math.abs(v - Math.round(v)) < 1e-9)) { const g = [A, B, Cc].map(v => Math.abs(Math.round(v))).filter(v => v).reduce((x, y) => gcd(x, y), 0) || 1; return { a: A / g, b: B / g, c: Cc / g, rel: I.rel }; }
  return I;
}
function gcd(a, b) { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
const tex = I => { const J = intForm(I); return linTex(J.a, J.b) + REL[J.rel] + big(J.c); };
  const lhs = (I, x, y) => I.a * x + I.b * y;
  function ok(I, x, y, tol) {
    tol = tol === undefined ? 1e-9 : tol; const v = lhs(I, x, y) - I.c;
    return I.rel === '<=' ? v <= tol : I.rel === '>=' ? v >= -tol : I.rel === '<' ? v < -1e-12 : I.rel === '>' ? v > 1e-12 : Math.abs(v) <= tol;
  }
  const NONNEG = [{ a: 1, b: 0, c: 0, rel: '>=', src: 'x>=0', nn: true }, { a: 0, b: 1, c: 0, rel: '>=', src: 'y>=0', nn: true }];
  const all = (list, nonneg) => (nonneg ? list.concat(NONNEG) : list.slice());

  // ── Planungspolygon (Sutherland–Hodgman auf grossem Quadrat) ──
  const BOX = 1e5;
  function clip(poly, a, b, c) {                                       // behält a·x + b·y ≤ c
    const out = [], f = p => a * p[0] + b * p[1] - c;
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i], Q = poly[(i + 1) % poly.length], fp = f(P), fq = f(Q);
      if (fp <= 1e-9) out.push(P);
      if ((fp < -1e-9 && fq > 1e-9) || (fp > 1e-9 && fq < -1e-9)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
    }
    return out;
  }
  function region(list, nonneg) {
    let poly = [[-BOX, -BOX], [BOX, -BOX], [BOX, BOX], [-BOX, BOX]];
    all(list, nonneg).forEach(I => {
      if (I.rel === '<=' || I.rel === '<' || I.rel === '=') poly = clip(poly, I.a, I.b, I.c);
      if (I.rel === '>=' || I.rel === '>' || I.rel === '=') poly = clip(poly, -I.a, -I.b, -I.c);
    });
    const empty = poly.length < 3;
    const bounded = !empty && poly.every(p => Math.abs(p[0]) < BOX * 0.99 && Math.abs(p[1]) < BOX * 0.99);
    return { poly, empty, bounded };
  }
  function vertices(list, nonneg) {
    const L = all(list, nonneg), out = [];
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const A = L[i], B = L[j], det = A.a * B.b - A.b * B.a; if (Math.abs(det) < 1e-12) continue;
      const x = (A.c * B.b - A.b * B.c) / det, y = (A.a * B.c - A.c * B.a) / det;
      if (!L.every(I => ok(I, x, y, 1e-7) || ((I.rel === '<' || I.rel === '>') && Math.abs(lhs(I, x, y) - I.c) < 1e-7))) continue;
      const X = Math.round(x * 1e9) / 1e9 + 0, Y = Math.round(y * 1e9) / 1e9 + 0;
      const old = out.find(v => Math.abs(v.x - X) < 1e-7 && Math.abs(v.y - Y) < 1e-7);
      if (old) { if (old.on.indexOf(i) < 0) old.on.push(i); if (old.on.indexOf(j) < 0) old.on.push(j); continue; }
      out.push({ x: X, y: Y, on: [i, j] });
    }
    // im Gegenuhrzeigersinn um den Schwerpunkt ordnen
    if (out.length > 2) { const cx = out.reduce((s, v) => s + v.x, 0) / out.length, cy = out.reduce((s, v) => s + v.y, 0) / out.length; out.sort((u, v) => Math.atan2(u.y - cy, u.x - cx) - Math.atan2(v.y - cy, v.x - cx)); }
    return out;
  }
  function parseObj(s) {
    const t = String(s || '').replace(/^\s*[zZ]\s*=/, ''); const L = parseLin(t); if (!L) return null;
    return { p: L.x, q: L.y, c: L.c };
  }
  const Z = (O, x, y) => O.p * x + O.q * y + (O.c || 0);
  // Optimum über den Eckpunkten; unbeschränkt, wenn das Polygon offen ist und Z in eine offene Richtung wächst
  function optimum(list, nonneg, O, mode) {
    const R = region(list, nonneg), V = vertices(list, nonneg);
    if (R.empty || !V.length) return { empty: true, V };
    const sg = mode === 'min' ? -1 : 1;
    let unb = false;
    if (!R.bounded) { const zs = R.poly.map(p => sg * Z(O, p[0], p[1])), best = Math.max(...V.map(v => sg * Z(O, v.x, v.y))); unb = zs.some(z => z > best + 1e-6 * Math.max(1, Math.abs(best))); }
    const vals = V.map(v => Z(O, v.x, v.y)), bestV = sg > 0 ? Math.max(...vals) : Math.min(...vals);
    const best = V.filter((v, i) => Math.abs(vals[i] - bestV) < 1e-9 * Math.max(1, Math.abs(bestV)));
    return { empty: false, V, vals, best, value: bestV, unbounded: unb, edge: best.length > 1, bounded: R.bounded, R };
  }
  function intPoints(list, nonneg, max) {
    const V = vertices(list, nonneg), R = region(list, nonneg); if (R.empty || !R.bounded || !V.length) return null;
    const x0 = Math.ceil(Math.min(...V.map(v => v.x)) - 1e-9), x1 = Math.floor(Math.max(...V.map(v => v.x)) + 1e-9), y0 = Math.ceil(Math.min(...V.map(v => v.y)) - 1e-9), y1 = Math.floor(Math.max(...V.map(v => v.y)) + 1e-9);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > (max || 4000)) return null;
    const L = all(list, nonneg), out = [];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (L.every(I => ok(I, x, y, 1e-9))) out.push([x, y]);
    return out;
  }
  function intOpt(list, nonneg, O, mode) {
    const P = intPoints(list, nonneg, 200000); if (!P || !P.length) return null;
    const sg = mode === 'min' ? -1 : 1; let best = null, bv = -Infinity;
    P.forEach(p => { const z = sg * Z(O, p[0], p[1]); if (z > bv + 1e-9) { bv = z; best = [p]; } else if (Math.abs(z - bv) < 1e-9) best.push(p); });
    return { pts: best, value: sg * bv, n: P.length };
  }
  // ── eine Variable: a·x rel c ──
  function solve1(I) {
    if (Math.abs(I.b) > 1e-12 || Math.abs(I.a) < 1e-12) return null;
    const flip = I.a < 0, bound = I.c / I.a;
    const FL = { '<=': '>=', '>=': '<=', '<': '>', '>': '<', '=': '=' };
    const rel = flip ? FL[I.rel] : I.rel, open = rel === '<' || rel === '>';
    let iv;
    if (rel === '=') iv = '\\{' + q(bound) + '\\}';
    else if (rel === '<=' || rel === '<') iv = '(-\\infty,\\,' + q(bound) + (open ? ')' : ']');
    else iv = (open ? '(' : '[') + q(bound) + ',\\,\\infty)';
    return { flip, bound, rel, iv, relTex: REL[rel] };
  }
  // Ungleichung so, wie sie eingegeben wurde (beide Seiten)
function sideTex(L) { let t = Math.abs(L.x) > 1e-12 || Math.abs(L.y) > 1e-12 ? linTex(L.x, L.y) : ''; if (Math.abs(L.c) > 1e-12 || !t) t += (t && L.c > 0 ? '+' : '') + (t && L.c < 0 ? '-' + big(-L.c) : big(L.c)); return t; }
const texRaw = I => (I.l && I.r ? sideTex(I.l) + REL[I.rel] + sideTex(I.r) : tex(I));
return { sideTex, texRaw, fmt, q, big, intForm, gcd, lex, parseLin, parseIneq, linTex, tex, REL, lhs, ok, NONNEG, all, BOX, clip, region, vertices, parseObj, Z, optimum, intPoints, intOpt, solve1 };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = { Lp };
