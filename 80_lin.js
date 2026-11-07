// ═════════════════════════════════════════════════════════════════
// MODUL 80: lin — Rechenkern der Umgebung «Lineare Funktionen» (ohne DOM, node-testbar)
//
// Baut auf 60_dif.js (Dif.E = exakte Brüche, Dif.qOf, Dif.fmt …) auf. Alle Rechnungen laufen mit Brüchen,
// die Zahlen aus dem Bild (auf 6 Stellen gerundet) werden in Brüche umgewandelt.
//
// Gerade L = {m, q, mq, qq} (y = m·x + q; mq, qq exakt) oder senkrecht {vert:true, x, xq} (x = c).
//   Lin.mk(m, q)                      Gerade aus Zahlen
//   Lin.fromPoints(x1,y1,x2,y2)       Gerade durch zwei Punkte (gleiche x: senkrechte Gerade)
//   Lin.fromPointSlope(x1,y1,m)       Gerade durch einen Punkt mit gegebener Steigung
//   Lin.zero(L)                       Nullstelle {kind:'one'|'none'|'all'|'vert', xq, x}
//   Lin.intersect(L1, L2)             {kind:'point'|'parallel'|'same', xq, yq, x, y}
//   Lin.angle(L), Lin.angleBetween    Steigungswinkel, Schnittwinkel (Grad)
//   Lin.perpThrough(L, x, y)          Senkrechte zu L durch (x, y);  Lin.parallelThrough
//   Lin.foot(L, x, y)                 Lotfusspunkt und Abstand
//   Lin.bisector(x1,y1,x2,y2)         Mittelsenkrechte von AB (mit Mittelpunkt)
//   Lin.lineTex(L, lhs)               Gleichung als LaTeX;  Lin.APPS  Beispiele für Anwendungen
//   Lin.app(A, B)                     Break-even zweier Modelle y = a + b·x
//   Rechenwege (SV.Doc): 80b_lin_docs.js
// ═════════════════════════════════════════════════════════════════
const Lin = (function () {
  const E = Dif.E, { qOf } = Dif;
  const q0 = E.q0, q1 = E.q1, qm1 = E.qNeg(E.q1);
  const rnd = x => Math.round(x * 1e6) / 1e6 + 0;
  // Zahl → Bruch: zuerst ein einfacher Bruch (Nenner ≤ 100, z. B. 0.333333 → 1/3), sonst Dezimalbruch
  const simpleQ = x => { for (let d = 1; d <= 100; d++) { const n = Math.round(x * d); if (Math.abs(x - n / d) < 1e-6) return d === 1 ? E.Q(n) : E.qDiv(E.Q(n), E.Q(d)); } return null; };
  const Qn = x => { const r = rnd(x); return simpleQ(r) || qOf(r) || qOf(Math.round(r * 1e3) / 1e3) || E.Q(Math.round(r)); };
  const num = E.qNum, add = E.qAdd, sub = E.qSub, mul = E.qMul, div = E.qDiv, neg = E.qNeg, isZ = E.qIsZero;

  const mkQ = (mq, qq) => ({ m: num(mq), q: num(qq), mq, qq });
  const mk = (m, q) => mkQ(Qn(m), Qn(q));
  const vlineQ = xq => ({ vert: true, x: num(xq), xq });
  const vline = x => vlineQ(Qn(x));
  const fOf = L => (L.vert ? (() => NaN) : x => L.m * x + L.q);
  function fromPoints(x1, y1, x2, y2) {
    const X1 = Qn(x1), Y1 = Qn(y1), X2 = Qn(x2), Y2 = Qn(y2);
    if (isZ(sub(X2, X1))) return vlineQ(X1);
    const m = div(sub(Y2, Y1), sub(X2, X1));
    return mkQ(m, sub(Y1, mul(m, X1)));
  }
  function fromPointSlope(x1, y1, m) { const X1 = Qn(x1), Y1 = Qn(y1), M = Qn(m); return mkQ(M, sub(Y1, mul(M, X1))); }

  function zero(L) {
    if (L.vert) return { kind: 'vert' };
    if (isZ(L.mq)) return isZ(L.qq) ? { kind: 'all' } : { kind: 'none' };
    const xq = neg(div(L.qq, L.mq)); return { kind: 'one', xq, x: num(xq) };
  }
  function intersect(L1, L2) {
    if (L1.vert && L2.vert) return { kind: E.qEq(L1.xq, L2.xq) ? 'same' : 'parallel' };
    if (L1.vert || L2.vert) {
      const V = L1.vert ? L1 : L2, N = L1.vert ? L2 : L1, yq = add(mul(N.mq, V.xq), N.qq);
      return { kind: 'point', xq: V.xq, yq, x: V.x, y: num(yq) };
    }
    const dm = sub(L1.mq, L2.mq);
    if (isZ(dm)) return { kind: E.qEq(L1.qq, L2.qq) ? 'same' : 'parallel' };
    const xq = div(sub(L2.qq, L1.qq), dm), yq = add(mul(L1.mq, xq), L1.qq);
    return { kind: 'point', xq, yq, x: num(xq), y: num(yq) };
  }
  const angle = L => (L.vert ? 90 : Math.atan(L.m) * 180 / Math.PI);
  function angleBetween(L1, L2) {                                // spitzer Winkel zwischen zwei Geraden (Grad)
    if (L1.vert && L2.vert) return 0;
    if (L1.vert || L2.vert) { const N = L1.vert ? L2 : L1; return 90 - Math.abs(Math.atan(N.m) * 180 / Math.PI); }
    const d = 1 + L1.m * L2.m; if (Math.abs(d) < 1e-12) return 90;
    return Math.atan(Math.abs((L1.m - L2.m) / d)) * 180 / Math.PI;
  }
  function perpThrough(L, x, y) {                                // Senkrechte zu L durch (x, y)
    const X = Qn(x), Y = Qn(y);
    if (L.vert) return mkQ(q0, Y);
    if (isZ(L.mq)) return vlineQ(X);
    const mp = neg(div(q1, L.mq));
    return mkQ(mp, sub(Y, mul(mp, X)));
  }
  function parallelThrough(L, x, y) { const X = Qn(x), Y = Qn(y); return L.vert ? vlineQ(X) : mkQ(L.mq, sub(Y, mul(L.mq, X))); }
  function foot(L, x, y) {                                       // Lotfusspunkt F von P(x|y) auf L, Abstand
    const P = perpThrough(L, x, y), I = intersect(L, P);
    const px = Qn(x), py = Qn(y), fx = I.xq, fy = I.yq, dx = sub(fx, px), dy = sub(fy, py), d2 = add(mul(dx, dx), mul(dy, dy));
    return { perp: P, F: I, d2, dist: Math.sqrt(num(d2)) };
  }
  function bisector(x1, y1, x2, y2) {
    const X1 = Qn(x1), Y1 = Qn(y1), X2 = Qn(x2), Y2 = Qn(y2);
    if (E.qEq(X1, X2) && E.qEq(Y1, Y2)) return null;
    const two = E.Q(2), Mx = div(add(X1, X2), two), My = div(add(Y1, Y2), two), AB = fromPoints(x1, y1, x2, y2);
    return { M: { xq: Mx, yq: My, x: num(Mx), y: num(My) }, AB, line: perpThrough(AB, num(Mx), num(My)) };
  }

  // Gleichung als LaTeX
  function lineTex(L, lhs) {
    lhs = lhs === undefined ? 'y' : lhs;
    if (L.vert) return 'x=' + E.qTex(L.xq);
    const m = L.mq, q = L.qq; let s = '';
    if (!isZ(m)) s = E.qEq(m, q1) ? 'x' : E.qEq(m, qm1) ? '-x' : E.qTex(m) + 'x';
    if (!isZ(q) || s === '') s += s === '' ? E.qTex(q) : (E.qSgn(q) < 0 ? '-' : '+') + E.qTex(E.qAbs(q));
    return lhs + '=' + s;
  }

  // ───────────── Anwendungen: zwei lineare Modelle y = a + b·x ─────────────
  // Bewegung: Ort s = s0 + v·t (b darf negativ sein)
  const APPS = [
    { id: 'phone', name: 'Handytarife', xl: 'Minuten', yl: 'CHF', A: { n: 'Tarif A', a: 10, b: 0.05 }, B: { n: 'Tarif B', a: 0, b: 0.15 }, kind: 'cost', ua: 'Grundgebühr', ub: 'Preis pro Minute' },
    { id: 'taxi', name: 'Taxi', xl: 'Kilometer', yl: 'CHF', A: { n: 'Taxi A', a: 6, b: 3.2 }, B: { n: 'Taxi B', a: 3, b: 3.8 }, kind: 'cost', ua: 'Grundtaxe', ub: 'Preis pro Kilometer' },
    { id: 'gym', name: 'Fitness-Abo', xl: 'Monate', yl: 'CHF', A: { n: 'Jahresabo', a: 120, b: 35 }, B: { n: 'Monatsabo', a: 0, b: 55 }, kind: 'cost', ua: 'Einmalige Gebühr', ub: 'Preis pro Monat' },
    { id: 'move', name: 'Bewegung', xl: 'Stunden', yl: 'Kilometer', A: { n: 'Velo', a: 0, b: 20 }, B: { n: 'Auto', a: 90, b: -25 }, kind: 'move', ua: 'Startort', ub: 'Geschwindigkeit' },
    { id: 'chase', name: 'Verfolgung', xl: 'Stunden', yl: 'Kilometer', A: { n: 'Zug', a: 0, b: 90 }, B: { n: 'Velo', a: 60, b: 15 }, kind: 'move', ua: 'Startort', ub: 'Geschwindigkeit' }
  ];
  function app(A, B) {                                           // A, B: {a, b}
    const LA = mk(A.b, A.a), LB = mk(B.b, B.a), I = intersect(LA, LB);
    const out = { LA, LB, I };
    if (I.kind === 'point') {
      out.x = I.x; out.y = I.y;
      // wer ist vorher kleiner (bei x < x*): Vergleich bei x = x* − 1
      out.belowA = LA.m * (I.x - 1) + LA.q < LB.m * (I.x - 1) + LB.q;
      out.aLowerLeft = out.belowA;
    }
    return out;
  }

  return { Qn, mk, mkQ, vline, vlineQ, fOf, fromPoints, fromPointSlope, zero, intersect, angle, angleBetween, perpThrough, parallelThrough, foot, bisector, lineTex, APPS, app, rnd };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Lin;
