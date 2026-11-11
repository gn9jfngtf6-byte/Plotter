// ═════════════════════════════════════════════════════════════════
// MODUL 103: Ähnlichkeit – Rechenkern (ohne DOM)
//
// Dreiecke als Eckpunkte [x, y]. Ähnlichkeitsabbildung T = {z, k, phi, refl, psi, v} aus den vier Grundabbildungen:
//   P′ = Z + k · (Drehung(phi) · Spiegelung(psi)(P) − Z) + v
//   (erst an der x-Achse (psi = 0) bzw. y-Achse (psi = 90) spiegeln, dann um den URSPRUNG drehen, dann von Z aus
//   zentrisch strecken, zuletzt verschieben). Z spielt nur bei der Streckung eine Rolle.
// Sim.tri(A, B, C)              Seiten a = |BC|, b = |CA|, c = |AB|, Winkel al, be, ga (Grad), Fläche, Umlaufsinn
// Sim.apply(T, P)               Bildpunkt; Sim.solveK(T, P, Q) / Sim.solvePhi(T, P, Q): Streckfaktor bzw. Drehwinkel so,
//                               dass das Bild von P möglichst nahe bei Q liegt (Ziehen einer Bildecke)
// Sim.kinds(T)                  beteiligte Abbildungen (Wörter)
// Sim.match(t1, t2)             beste Zuordnung der Ecken (gleiche Winkel), ähnlich ja/nein, Faktor
// Sim.ray(Z, A, B, t, s)        Strahlensatzfigur: C = Z + t(A − Z), D = Z + s(B − Z) (s = t: parallel)
// Sim.right(A, B, d)            rechtwinkliges Dreieck über AB mit Höhenfusspunkt D (|AD| = d), C auf dem Thaleskreis
// Zahlen: Sim.n(v, d) kurz (ASCII-Minus), Sim.ex(v, d) ob die Zahl mit d Stellen exakt ist
// Rechenwege: 103b_sim_docs.js. Bilder: 104_sim_draw.js. Panel: 105_sim_ui.js.
// ═════════════════════════════════════════════════════════════════
const Sim = (function () {
  const sub = (P, Q) => [P[0] - Q[0], P[1] - Q[1]];
  const add = (P, Q) => [P[0] + Q[0], P[1] + Q[1]];
  const mul = (P, k) => [P[0] * k, P[1] * k];
  const dist = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const normA = a => { a = ((a % 360) + 360) % 360; return a > 180 ? a - 360 : a; };     // (−180°, 180°]
  const R6 = x => Math.round(x * 1e6) / 1e6 + 0;

  function n(v, d) {
    d = d === undefined ? 2 : d;
    if (!isFinite(v)) return '\\text{–}';
    const f = Math.pow(10, d), r = Math.sign(v) * Math.round(Math.abs(v) * f) / f + 0;
    return String(r).replace(/^-/, '-');
  }
  const ex = (v, d) => Math.abs(v * Math.pow(10, d === undefined ? 2 : d) - Math.round(v * Math.pow(10, d === undefined ? 2 : d))) < 1e-6;

  function angleAt(P, Q, R) {                                          // Winkel bei Q
    const u = sub(P, Q), v = sub(R, Q), lu = Math.hypot(u[0], u[1]), lv = Math.hypot(v[0], v[1]);
    if (lu < 1e-12 || lv < 1e-12) return NaN;
    return deg(Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (lu * lv)))));
  }
  function tri(A, B, C) {
    const s = ((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2;
    return { A, B, C, a: dist(B, C), b: dist(C, A), c: dist(A, B), al: angleAt(B, A, C), be: angleAt(A, B, C), ga: angleAt(A, C, B), area: Math.abs(s), orient: Math.sign(s), ok: Math.abs(s) > 1e-6 };
  }
  const centroid = P => [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];

  // ── Abbildung ──
  const T0 = () => ({ z: [0, 0], k: 1, phi: 0, refl: false, psi: 0, v: [0, 0] });
  function reflU(T, u) { if (!T.refl) return u; return Math.abs(Math.cos(rad(T.psi))) >= Math.abs(Math.sin(rad(T.psi))) ? [u[0], -u[1] + 0] : [-u[0] + 0, u[1]]; }   // x-Achse: (x | −y), y-Achse: (−x | y)
  function rotU(phi, u) { const c = Math.cos(rad(phi)), s = Math.sin(rad(phi)); return [c * u[0] - s * u[1], s * u[0] + c * u[1]]; }
  const axisOf = T => (Math.abs(Math.cos(rad(T.psi))) >= Math.abs(Math.sin(rad(T.psi))) ? 'x' : 'y');   // Spiegelachse
  // Spiegeln und Drehen (beides um den Ursprung), noch ohne Streckung und Verschiebung
  const core = (T, P) => rotU(T.phi, reflU(T, P));
  function apply(T, P) { const u = core(T, P); return [T.z[0] + T.k * (u[0] - T.z[0]) + T.v[0], T.z[1] + T.k * (u[1] - T.z[1]) + T.v[1]]; }
  // Bild ohne Verschiebung
  const applyNoV = (T, P) => apply(Object.assign({}, T, { v: [0, 0] }), P);
  // Streckfaktor so, dass das Bild von P auf dem Strahl von Z aus möglichst nahe bei Q liegt
  function solveK(T, P, Q) {
    const d = sub(core(T, P), T.z), w = sub(sub(Q, T.v), T.z), l2 = d[0] * d[0] + d[1] * d[1];
    return l2 < 1e-12 ? null : (w[0] * d[0] + w[1] * d[1]) / l2;
  }
  // Drehwinkel so, dass das Bild von P (bei festem k) in Richtung Q liegt
  function solvePhi(T, P, Q) {
    const u = reflU(T, P), w = sub(sub(Q, T.v), T.z), g = [T.z[0] + w[0] / T.k, T.z[1] + w[1] / T.k];
    if (Math.hypot(u[0], u[1]) < 1e-9 || Math.hypot(g[0], g[1]) < 1e-9) return null;
    return normA(deg(Math.atan2(g[1], g[0]) - Math.atan2(u[1], u[0])));
  }
  function kinds(T) {
    const out = [];
    if (T.refl) out.push('refl');
    if (Math.abs(normA(T.phi)) > 1e-9) out.push('rot');
    if (Math.abs(T.k + 1) < 1e-9 && !out.length) out.push('point');
    else if (Math.abs(Math.abs(T.k) - 1) > 1e-9 || T.k < 0) out.push('dil');
    if (Math.hypot(T.v[0], T.v[1]) > 1e-9) out.push('trans');
    return out;
  }
  const KIND_DE = { refl: 'Spiegelung', rot: 'Drehung', point: 'Punktspiegelung', dil: 'zentrische Streckung', trans: 'Verschiebung' };

  // ── Zuordnung zweier Dreiecke über die Winkel ──
  const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  function match(t1, t2) {
    const a1 = [t1.al, t1.be, t1.ga], a2 = [t2.al, t2.be, t2.ga], s1 = [t1.a, t1.b, t1.c], s2 = [t2.a, t2.b, t2.c];
    let best = null;
    PERMS.forEach(p => {
      const err = Math.max(...[0, 1, 2].map(i => Math.abs(a1[i] - a2[p[i]])));
      const rs = [0, 1, 2].map(i => s2[p[i]] / s1[i]);                 // Seite gegenüber Ecke i ↔ gegenüber Ecke p[i]
      const spread = (Math.max(...rs) - Math.min(...rs)) / Math.max(...rs);
      const sc = err + spread * 10;
      if (!best || sc < best.sc - 1e-9) best = { p, err, rs, spread, sc };
    });
    const sim = t1.ok && t2.ok && best.err < 0.05 && best.spread < 1e-4;
    const near = !sim && t1.ok && t2.ok && best.err < 3;
    const odd = [1, 2, 5].indexOf(PERMS.findIndex(q => q.join() === best.p.join())) >= 0;   // ungerade Vertauschung
    const same = t1.orient * t2.orient * (odd ? -1 : 1) > 0;                 // gleichsinnig?
    return { p: best.p, err: best.err, rs: best.rs, spread: best.spread, sim, near, k: best.rs.reduce((a, b) => a + b, 0) / 3, same };
  }

  // ── Strahlensätze ──
  function ray(Z, A, B, t, s) {
    const C = add(Z, mul(sub(A, Z), t)), D = add(Z, mul(sub(B, Z), s === null || s === undefined ? t : s));
    const par = s === null || s === undefined || Math.abs(s - t) < 1e-9;
    return { Z, A, B, C, D, t, s: s === null || s === undefined ? t : s, par, ZA: dist(Z, A), ZB: dist(Z, B), ZC: dist(Z, C), ZD: dist(Z, D), AB: dist(A, B), CD: dist(C, D), AC: dist(A, C), BD: dist(B, D), cross: t < 0 };
  }

  // ── Rechtwinkliges Dreieck mit Höhe ──
  function right(A, B, d) {
    const c = dist(A, B), e = c > 1e-9 ? mul(sub(B, A), 1 / c) : [1, 0], nn = [-e[1], e[0]];
    d = Math.max(1e-6, Math.min(c - 1e-6, d));
    const h = Math.sqrt(Math.max(0, d * (c - d))), D = add(A, mul(e, d)), C = add(D, mul(nn, h));
    return { A, B, C, D, c, p: d, q: c - d, h, b: dist(A, C), a: dist(B, C), M: mul(add(A, B), 0.5), al: deg(Math.atan2(h, d)), be: deg(Math.atan2(h, c - d)) };
  }

  return { sub, add, mul, dist, rad, deg, normA, R6, n, ex, angleAt, tri, centroid, T0, apply, applyNoV, core, axisOf, solveK, solvePhi, reflU, rotU, kinds, KIND_DE, match, PERMS, ray, right };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = { Sim };
