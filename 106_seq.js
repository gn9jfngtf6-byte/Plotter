// ═════════════════════════════════════════════════════════════════
// MODUL 106: Folgen und Reihen – Rechenkern (ohne DOM)
//
// Aufbau nach dem Dossier «Folgen und Reihen»: Folgen (explizit/rekursiv), arithmetische und geometrische Folgen,
// Reihen und Summenzeichen, Grenzwert und unendliche geometrische Reihe, vollständige Induktion.
//   Sq.mkExp(raw)              explizite Folge a_n = Term in n          → {kind:'exp', raw, f(n), tex, F}
//   Sq.mkRec(a1, raw)          rekursive Folge a_{n+1} = Term in a (= a_n) und n → {kind:'rec', a1, raw, g(a, n), tex}
//   Sq.terms(S, N)             [a_1 … a_N]; Sq.termTex(S, n) exakt, wenn möglich (Fun.row)
//   Sq.detect(vals)            {ari: d | null, geo: q | null}
//   Sq.ari(a1, d) / Sq.geo(a1, q)  Folgen mit Formeln, Lösen a_n = t bzw. «ab welchem Glied»
//   Sq.sumAri / Sq.sumGeo / Sq.sumInf
//   Sq.limit(S)                numerischer Grenzwert {conv, L, Ltex, kind}; Sq.nEps(S, L, eps)
//   Sq.IND                     Aussagen für die vollständige Induktion
// Zahlen: Sq.q(v) Bruch (LaTeX), wenn er kurz ist, sonst Dezimalzahl.
// Rechenwege: 106b_seq_docs.js. Bilder: 107_seq_draw.js. Panel: 108_seq_ui.js.
// ═════════════════════════════════════════════════════════════════
const Sq = (function () {
  const E = Dif.E;
  const fmt = (v, d) => Dif.fmtT(v, d === undefined ? 4 : d);
  function q(v, d) {
    if (!isFinite(v)) return v > 0 ? '\\infty' : v < 0 ? '-\\infty' : '\\text{–}';
    if (Math.abs(v) >= 1e15) { const k = Math.floor(Math.log10(Math.abs(v))), mt = +(v / Math.pow(10, k)).toFixed(4); return String(mt) + '\\cdot10^{' + k + '}'; }   // sonst falsche Ziffern (2^63 → …776000)
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v) + 0);
    const r = E.qFromFloat(v);
    if (r && Math.abs(Number(r.d)) <= 1000 && Math.abs(Number(r.n)) < 1e7) return E.qTex(r);
    return fmt(v, d);
  }
  const isQ = v => isFinite(v) && (Math.abs(v - Math.round(v)) < 1e-9 || !!E.qFromFloat(v));
  // Variable n (bzw. a) ↔ x für den Funktionsparser
  const toX = (raw, v) => String(raw || '').replace(new RegExp('(?<![A-Za-z_])' + v + '(?![A-Za-z_(])', 'g'), 'x');
  const texBack = (tex, v) => String(tex || '').replace(/(?<!\\[A-Za-z]*)x/g, v);
  function mkFn(raw) {
    let F = null; try { F = Dif.makeFn(raw); } catch (e) { F = null; }
    if (!F || !F.fns || !F.fns[0]) return null;
    let tex = ''; try { tex = Dif.tex(F.ast); } catch (e) { tex = String(raw); }
    return { F, f: F.fns[0], tex, ast: F.ast };
  }
  function mkExp(raw) {
    raw = String(raw || '').trim(); if (!raw) return null;
    const M = mkFn(toX(raw, 'n')); if (!M) return null;
    const ok = [1, 2, 3, 4, 5].some(n => isFinite(M.f(n)));
    if (!ok) return null;
    return { kind: 'exp', raw, f: n => M.f(n), tex: texBack(M.tex, 'n'), M };
  }
  function mkRec(a1, raw) {
    raw = String(raw || '').trim(); if (!raw || !isFinite(a1)) return null;
    if (/(?<![A-Za-z_])n(?![A-Za-z_(])/.test(raw)) return null;              // nur a_n als Variable
    const M = mkFn(toX(raw, 'a')); if (!M) return null;
    if (!isFinite(M.f(a1))) return null;
    return { kind: 'rec', a1, raw, g: a => M.f(a), tex: texBack(M.tex, 'a_n'), M };
  }
  function terms(S, N) {
    N = Math.max(1, Math.min(2000, Math.round(N)));
    const out = [];
    if (S.kind === 'exp') for (let n = 1; n <= N; n++) out.push(S.f(n));
    else { let a = S.a1; for (let n = 1; n <= N; n++) { out.push(a); a = S.g(a); if (!isFinite(a) || Math.abs(a) > 1e15) { while (out.length < N) out.push(NaN); break; } } }
    return out;
  }
  // exakter Wert mit Einsetzen (explizit): {tex, sub}
  function termTex(S, n) {
    if (S.kind === 'exp' && typeof Fun !== 'undefined' && Fun.row) {
      try { const r = Fun.row({ ast: S.M.ast, f: S.M.f }, n); return { tex: r.yT, sub: r.sub ? texBack(r.sub, 'n') : '', exact: r.exact }; } catch (e) { /* unten */ }
    }
    const v = S.kind === 'exp' ? S.f(n) : terms(S, n)[n - 1];
    return { tex: q(v), sub: '', exact: isQ(v) };
  }
  function detect(v) {
    const ok = v.filter(isFinite); if (ok.length < 3 || ok.length < v.length) return { ari: null, geo: null };
    const d = v[1] - v[0], tol = 1e-9 * Math.max(1, ...v.map(Math.abs));
    const ari = v.every((x, i) => !i || Math.abs(x - v[i - 1] - d) < tol) ? d : null;
    let geo = null;
    if (v.every(x => Math.abs(x) > 1e-12)) { const r = v[1] / v[0]; if (v.every((x, i) => !i || Math.abs(x / v[i - 1] - r) < 1e-9)) geo = r; }
    return { ari, geo };
  }
  // arithmetisch / geometrisch
  const ari = (a1, d) => ({ a1, d, at: n => a1 + (n - 1) * d });
  const geo = (a1, q0) => ({ a1, q: q0, at: n => a1 * Math.pow(q0, n - 1) });
  // a_n = t (arithmetisch): n = (t − a1)/d + 1
  function solveAri(A, t) { if (Math.abs(A.d) < 1e-12) return { n: NaN, ok: false }; const n = (t - A.a1) / A.d + 1; return { n, ok: n >= 1 - 1e-9 && Math.abs(n - Math.round(n)) < 1e-9 }; }
  // erstes Glied, das t überschreitet (Wachstum) bzw. unterschreitet (Zerfall): Logarithmus
  function solveGeo(G, t) {
    if (!(G.a1 > 0 && G.q > 0 && t > 0) || Math.abs(G.q - 1) < 1e-12) return null;
    const grow = G.q > 1, x = Math.log(t / G.a1) / Math.log(G.q);          // n − 1 = x
    let n = Math.floor(x + 1e-12) + 2; if (n < 1) n = 1;
    while (n > 1 && (grow ? G.at(n - 1) > t : G.at(n - 1) < t)) n--;
    while (grow ? !(G.at(n) > t) : !(G.at(n) < t)) n++;
    return { x, n, grow };
  }
  const sumAri = (A, n) => n * (A.a1 + A.at(n)) / 2;
  const sumGeo = (G, n) => (Math.abs(G.q - 1) < 1e-12 ? n * G.a1 : G.a1 * (Math.pow(G.q, n) - 1) / (G.q - 1));
  const sumInf = G => (Math.abs(G.q) < 1 ? G.a1 / (1 - G.q) : NaN);
  // Grenzwert numerisch: Glieder weit hinten vergleichen
  function limit(S) {
    const at = n => (S.kind === 'exp' ? S.f(n) : NaN);
    let v;
    if (S.kind === 'exp') v = [1e3, 1e4, 1e5, 1e6, 1e6 + 1].map(at);
    else { const t = terms(S, 2000); v = [t[499], t[999], t[1499], t[1998], t[1999]]; }
    if (!v.every(isFinite)) { const big = v.filter(isFinite); return { conv: false, kind: big.length && Math.abs(big[big.length - 1]) > 1e6 ? 'inf' : 'none' }; }
    const a = v[3], b = v[4], c = v[2];
    if (Math.abs(a) > 1e6 && Math.abs(b) >= Math.abs(c)) return { conv: false, kind: a > 0 ? '+inf' : '-inf' };
    if (Math.abs(a - b) > 1e-3 * Math.max(1, Math.abs(a))) return { conv: false, kind: 'osc' };
    let L = (a + b) / 2;
    const r = E.qFromFloat(Math.round(L * 1e4) / 1e4);
    if (r && Math.abs(L - E.qNum(r)) < 2e-3 && Math.abs(Number(r.d)) <= 100) L = E.qNum(r);
    else if (Math.abs(L - Math.round(L)) < 2e-3) L = Math.round(L);
    return { conv: true, L, Ltex: q(L) };
  }
  // kleinstes N mit |a_n − L| < ε für alle n ≥ N: bis 2000 genau geprüft, darüber (explizite Folgen)
  // durch Verdoppeln und Halbieren gesucht (Annahme: der Abstand zu L wird auf Dauer kleiner)
  function nEps(S, L, eps) {
    const t = terms(S, 2000); let N = 1;
    for (let n = t.length; n >= 1; n--) if (!(Math.abs(t[n - 1] - L) < eps)) { N = n + 1; break; }
    if (N <= 2000) return N;
    return S.kind === 'exp' ? nEpsBig(n => S.f(n), L, eps, 2000) : null;
  }
  // kleine Zahlen (z. B. ε) lesbar: zwei gültige Ziffern statt «0»
  const qs = v => (!isFinite(v) || v === 0 || Math.abs(v) >= 0.001 ? q(v) : String(+v.toPrecision(2)).replace(/e-(\d+)/, (m, k) => '\\cdot10^{-' + k + '}'));
  function nEpsBig(f, L, eps, from, max) {
    max = max || 1e9; from = from || 1;
    const ok = n => Math.abs(f(n) - L) < eps, good = n => ok(n) && ok(n + 1);
    let hi = Math.max(1, from); while (hi <= max && !(good(hi) && good(2 * hi) && good(Math.round(hi * 1.5)))) hi *= 2;
    if (hi > max) return null;
    let a = Math.max(0, from - 1), b = hi;
    while (b - a > 1) { const m = Math.floor((a + b) / 2); if (good(m)) b = m; else a = m; }
    return b;
  }
  // vollständige Induktion: Summand s(k), rechte Seite r(n), Beweisschritte (LaTeX)
  const IND = [
    { id: 'odd', name: 'Summe der ungeraden Zahlen', s: k => 2 * k - 1, r: n => n * n, sTex: '2k-1', lhs: '1+3+5+\\ldots+(2n-1)', rhs: 'n^2', rhs1: '(n+1)^2', next: '2n+1',
      step: ['n^2+(2n+1)', '=n^2+2n+1', '=(n+1)^2'] },
    { id: 'gauss', name: 'Summe der ersten n Zahlen (Gauss)', s: k => k, r: n => n * (n + 1) / 2, sTex: 'k', lhs: '1+2+3+\\ldots+n', rhs: '\\frac{n(n+1)}{2}', rhs1: '\\frac{(n+1)(n+2)}{2}', next: 'n+1',
      step: ['\\frac{n(n+1)}{2}+(n+1)', '=\\frac{n(n+1)+2(n+1)}{2}', '=\\frac{(n+1)(n+2)}{2}'] },
    { id: 'sq', name: 'Summe der Quadratzahlen', s: k => k * k, r: n => n * (n + 1) * (2 * n + 1) / 6, sTex: 'k^2', lhs: '1^2+2^2+\\ldots+n^2', rhs: '\\frac{n(n+1)(2n+1)}{6}', rhs1: '\\frac{(n+1)(n+2)(2n+3)}{6}', next: '(n+1)^2',
      step: ['\\frac{n(n+1)(2n+1)}{6}+(n+1)^2', '=\\frac{(n+1)\\big(n(2n+1)+6(n+1)\\big)}{6}', '=\\frac{(n+1)(2n^2+7n+6)}{6}', '=\\frac{(n+1)(n+2)(2n+3)}{6}'] },
    { id: 'geo', name: 'Zweierpotenzen (Schachbrett)', s: k => Math.pow(2, k - 1), r: n => Math.pow(2, n) - 1, sTex: '2^{k-1}', lhs: '1+2+4+\\ldots+2^{n-1}', rhs: '2^n-1', rhs1: '2^{n+1}-1', next: '2^n',
      step: ['2^n-1+2^n', '=2\\cdot2^n-1', '=2^{n+1}-1'] },
    { id: 'prime', name: 'Warnung: n² − n + 41 ist immer prim?', prime: true, p: n => n * n - n + 41, lhs: 'n^2-n+41', rhs: '\\text{Primzahl}' }
  ];
  const isPrime = m => { if (m < 2 || m !== Math.round(m)) return false; for (let d = 2; d * d <= m; d++) if (m % d === 0) return false; return true; };
  const smallestFactor = m => { for (let d = 2; d * d <= m; d++) if (m % d === 0) return d; return m; };

  return { fmt, q, isQ, toX, texBack, mkExp, mkRec, terms, termTex, detect, ari, geo, solveAri, solveGeo, sumAri, sumGeo, sumInf, limit, nEps, nEpsBig, qs, IND, isPrime, smallestFactor };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = { Sq };
