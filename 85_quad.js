// ═════════════════════════════════════════════════════════════════
// MODUL 85: quad — Rechenkern der Umgebung «Quadratische Funktionen» (ohne DOM, node-testbar)
//
// Baut auf 60_dif.js (Dif.E = exakte Brüche und Wurzeln a + b√d) und 80_lin.js (Lin.Qn, Lin.mkQ) auf.
// Alles wird mit exakten Brüchen gerechnet; die Zahlen aus dem Bild (auf 6 Stellen gerundet) werden in Brüche umgewandelt.
//
// Parabel Q = {a, b, c, aq, bq, cq}  (y = a·x² + b·x + c; aq, bq, cq exakt)
//   Quad.mk(a,b,c)                  Parabel aus Zahlen (a darf 0 sein: dann ist es eine Gerade, Q.deg = true)
//   Quad.fromVertex(a,xs,ys)        Scheitelform   y = a(x − xs)² + ys
//   Quad.fromRoots(a,x1,x2)         Nullstellenform y = a(x − x1)(x − x2)
//   Quad.fromPoints(P1,P2,P3)       Parabel durch drei Punkte [x,y] (null bei gleichem x; Q.deg bei Punkten auf einer Geraden)
//   Quad.fromVertexPoint(S,P), Quad.fromRootsPoint(N1,N2,P)
//   Quad.vertex(Q)                  {xq,yq,x,y}
//   Quad.disc(Q)                    Diskriminante b² − 4ac (exakt)
//   Quad.roots(Q)                   {kind:'two'|'one'|'none'|'deg', Dq, D, fe1, fe2, x1, x2, rat}
//   Quad.withLine(Q, L)             Schnitt mit Gerade L (Lin): {kind:'secant'|'tangent'|'passant'|'vert', Dq, pts:[{x,y,fx,fy}]}
//   Quad.tangentAt(Q, x0)           Tangente (Lin) im Punkt x0;  Quad.tangentIntercept(Q, m)  q, für das y = m·x + q berührt
//   Quad.polyTex(aq,bq,cq,lhs)      Standardform als LaTeX;  Quad.vertexTex, Quad.factorTex
//   Rechenwege (Schritte und SV.Doc): 85b_quad_docs.js
// ═════════════════════════════════════════════════════════════════
const Quad = (function () {
  const E = Dif.E, Qn = Lin.Qn;
  const q0 = E.q0, q1 = E.q1, qm1 = E.qNeg(E.q1), two = E.Q(2), four = E.Q(4);
  const num = E.qNum, add = E.qAdd, sub = E.qSub, mul = E.qMul, div = E.qDiv, neg = E.qNeg, isZ = E.qIsZero;
  const rnd = x => Math.round(x * 1e6) / 1e6 + 0;

  const mkQ = (aq, bq, cq) => ({ a: num(aq), b: num(bq), c: num(cq), aq, bq, cq, deg: isZ(aq) });
  const mk = (a, b, c) => mkQ(Qn(a), Qn(b), Qn(c));
  const fOf = Q => x => Q.a * x * x + Q.b * x + Q.c;

  function fromVertex(a, xs, ys) {
    const A = Qn(a), X = Qn(xs), Y = Qn(ys);
    return mkQ(A, neg(mul(mul(two, A), X)), add(mul(A, mul(X, X)), Y));
  }
  function fromRoots(a, x1, x2) {
    const A = Qn(a), X1 = Qn(x1), X2 = Qn(x2);
    return mkQ(A, neg(mul(A, add(X1, X2))), mul(A, mul(X1, X2)));
  }
  function fromPoints(P1, P2, P3) {
    const X = [P1[0], P2[0], P3[0]].map(Qn), Y = [P1[1], P2[1], P3[1]].map(Qn);
    if (E.qEq(X[0], X[1]) || E.qEq(X[1], X[2]) || E.qEq(X[0], X[2])) return null;
    const m12 = div(sub(Y[1], Y[0]), sub(X[1], X[0])), m23 = div(sub(Y[2], Y[1]), sub(X[2], X[1]));
    const a = div(sub(m23, m12), sub(X[2], X[0])), b = sub(m12, mul(a, add(X[0], X[1])));
    const c = sub(Y[0], add(mul(a, mul(X[0], X[0])), mul(b, X[0])));
    const Q = mkQ(a, b, c); Q.m12 = m12; Q.m23 = m23; return Q;
  }
  function fromVertexPoint(S, P) {
    const xs = Qn(S[0]), ys = Qn(S[1]), px = Qn(P[0]), py = Qn(P[1]), d = sub(px, xs);
    if (isZ(d)) return null;
    const a = div(sub(py, ys), mul(d, d));
    return mkQ(a, neg(mul(mul(two, a), xs)), add(mul(a, mul(xs, xs)), ys));
  }
  function fromRootsPoint(N1, N2, P) {
    const x1 = Qn(N1[0]), x2 = Qn(N2[0]), px = Qn(P[0]), py = Qn(P[1]), d = mul(sub(px, x1), sub(px, x2));
    if (isZ(d)) return null;
    const a = div(py, d);
    return mkQ(a, neg(mul(a, add(x1, x2))), mul(a, mul(x1, x2)));
  }

  function vertex(Q) {
    if (Q.deg) return null;
    const xq = neg(div(Q.bq, mul(two, Q.aq))), yq = sub(Q.cq, div(mul(Q.bq, Q.bq), mul(four, Q.aq)));
    return { xq, yq, x: num(xq), y: num(yq) };
  }
  const disc = Q => sub(mul(Q.bq, Q.bq), mul(four, mul(Q.aq, Q.cq)));
  function roots(Q) {
    if (Q.deg) return { kind: 'deg' };
    const Dq = disc(Q), D = num(Dq), s = E.qSgn(Dq), a2 = mul(two, Q.aq);
    if (s < 0) return { kind: 'none', Dq, D };
    const sq = E.feSqrtQ(Dq), mb = E.feQ(neg(Q.bq)), den = E.feQ(a2);
    let f1 = E.feDiv(E.feSub(mb, sq), den), f2 = E.feDiv(E.feAdd(mb, sq), den);
    if (!f1 || !f2) return { kind: s === 0 ? 'one' : 'two', Dq, D };
    let x1 = E.feNum(f1), x2 = E.feNum(f2);
    if (x1 > x2) { const t = f1; f1 = f2; f2 = t; const u = x1; x1 = x2; x2 = u; }
    return { kind: s === 0 ? 'one' : 'two', Dq, D, fe1: f1, fe2: f2, x1, x2, rat: E.feIsRat(f1) && E.feIsRat(f2), sq };
  }

  // Schnitt mit einer Geraden L (Lin): a x² + (b − m) x + (c − q) = 0
  function withLine(Q, L) {
    if (L.vert) { const yq = add(add(mul(Q.aq, mul(L.xq, L.xq)), mul(Q.bq, L.xq)), Q.cq); return { kind: 'vert', pts: [{ x: L.x, y: num(yq), fx: E.feQ(L.xq), fy: E.feQ(yq) }] }; }
    const E2 = mkQ(Q.aq, sub(Q.bq, L.mq), sub(Q.cq, L.qq));
    if (E2.deg) return { kind: 'lin', pts: [] };
    const R = roots(E2), pts = [];
    const mk1 = f => { const fy = E.feAdd(E.feMul(E.feQ(L.mq), f), E.feQ(L.qq)); return { x: E.feNum(f), y: E.feNum(fy), fx: f, fy }; };
    if (R.kind === 'two' && R.fe1) { pts.push(mk1(R.fe1), mk1(R.fe2)); }
    else if (R.kind === 'one' && R.fe1) pts.push(mk1(R.fe1));
    return { kind: R.kind === 'two' ? 'secant' : R.kind === 'one' ? 'tangent' : 'passant', Dq: R.Dq, E2, R, pts };
  }
  function tangentAt(Q, x0) {
    const X = Qn(x0), m = add(mul(mul(two, Q.aq), X), Q.bq), q = sub(Q.cq, mul(Q.aq, mul(X, X)));
    return Lin.mkQ(m, q);
  }
  const tangentIntercept = (Q, m) => { const M = Qn(m), d = sub(Q.bq, M); return sub(Q.cq, div(mul(d, d), mul(four, Q.aq))); };

  // ── LaTeX ──
  const tx = q => E.qTex(q);
  function coefX(q, pw) {                                            // Term q·x^pw (ohne Vorzeichen davor; q ≠ 0)
    const a = E.qAbs(q), one = E.qEq(a, q1), x = pw === 2 ? 'x^2' : 'x';
    return (one ? '' : tx(a)) + x;
  }
  function polyTex(aq, bq, cq, lhs) {
    lhs = lhs === undefined ? 'y' : lhs;
    let s = '';
    const T = [[aq, 2], [bq, 1], [cq, 0]];
    T.forEach(([q, pw]) => {
      if (isZ(q)) return;
      const body = pw === 0 ? tx(E.qAbs(q)) : coefX(q, pw), sg = E.qSgn(q) < 0 ? '-' : '+';
      s += s === '' ? (sg === '-' ? '-' : '') + body : sg + body;
    });
    return lhs + '=' + (s === '' ? '0' : s);
  }
  const stdTex = (Q, lhs) => polyTex(Q.aq, Q.bq, Q.cq, lhs);
  const aPre = aq => (E.qEq(aq, q1) ? '' : E.qEq(aq, qm1) ? '-' : tx(aq));
  function vertexTex(Q, lhs) {
    lhs = lhs === undefined ? 'y' : lhs;
    const v = vertex(Q); if (!v) return stdTex(Q, lhs);
    let s = aPre(Q.aq) + (isZ(v.xq) ? 'x^2' : '(x' + (E.qSgn(v.xq) < 0 ? '+' : '-') + tx(E.qAbs(v.xq)) + ')^2');
    if (!isZ(v.yq)) s += (E.qSgn(v.yq) < 0 ? '-' : '+') + tx(E.qAbs(v.yq));
    return lhs + '=' + s;
  }
  // (x − r) für exakte Nullstelle r (Fe)
  function facTex(f) {
    if (E.feIsRat(f)) { const r = f.p; return isZ(r) ? 'x' : '(x' + (E.qSgn(r) < 0 ? '+' : '-') + tx(E.qAbs(r)) + ')'; }
    return '\\left(x-' + E.feTexP(f) + '\\right)';
  }
  function factorTex(Q, lhs) {
    lhs = lhs === undefined ? 'y' : lhs;
    const R = roots(Q); if (R.kind !== 'two' && R.kind !== 'one') return null;
    if (R.kind === 'one') return lhs + '=' + aPre(Q.aq) + (isZ(R.fe1.p) && E.feIsRat(R.fe1) ? 'x^2' : facTex(R.fe1) + '^2');
    return lhs + '=' + aPre(Q.aq) + facTex(R.fe1) + facTex(R.fe2);
  }

  return { rnd, Qn, mk, mkQ, fOf, fromVertex, fromRoots, fromPoints, fromVertexPoint, fromRootsPoint, vertex, disc, roots, withLine, tangentAt, tangentIntercept, polyTex, stdTex, vertexTex, factorTex, facTex, aPre };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Quad;
