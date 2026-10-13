'use strict';
// Einzeltests der exakten Rechenkerne (Brüche, Polynome, Wurzeln) und des Gleichungslösers.
const { loadEngine } = require('./engine.js');

module.exports = function unitTests(T) {
  const eng = loadEngine(), E = eng.EX, S = eng.SV, ST = eng.ST;
  const rootsOf = expr => {
    const d = new S.Doc();
    const r = S.solveZero(d, eng.ast(expr), { window: ST.winFor(0) });
    return { tex: r.roots.map(q => q.tex), exact: r.exact };
  };

  T.group('Brüche (Q)');
  T.eq('qFromFloat(0.75) = 3/4', E.qTex(E.qFromFloat(0.75)), '\\frac{3}{4}');
  T.eq('qTex(-3/4)', E.qTex(E.Q(-3, 4)), '-\\frac{3}{4}');
  T.eq('1/3 + 1/6 = 1/2', E.qTex(E.qAdd(E.Q(1, 3), E.Q(1, 6))), '\\frac{1}{2}');
  T.eq('(2/3)·(3/4) = 1/2', E.qTex(E.qMul(E.Q(2, 3), E.Q(3, 4))), '\\frac{1}{2}');
  T.eq('qFromFloat(0.1+0.2) ≈ 3/10', E.qTex(E.qFromFloat(0.1 + 0.2)), '\\frac{3}{10}');
  T.eq('qFromFloat(π) = null', E.qFromFloat(Math.PI), null);

  T.group('Polynome');
  T.eq('x²−4', E.pTex([E.Q(-4), E.q0, E.q1], 'x'), 'x^{2}-4');
  const dm = E.pDivmod([E.Q(-4), E.q0, E.q1], [E.Q(-2), E.q1]);
  T.eq('(x²−4):(x−2) = x+2', E.pTex(dm.q, 'x'), 'x+2');
  T.ok('… Rest 0', E.pIsZero(dm.r));
  const rr = E.ratReduce(E.ratFromAst(eng.ast('(x^2-1)/(x-1)')));
  T.eq('(x²−1)/(x−1) kürzen: Zähler', E.pTex(rr.N, 'x'), 'x+1');
  T.eq('(x²−1)/(x−1) kürzen: Nenner', E.pTex(rr.D, 'x'), '1');
  T.eq('Ableitung x³−3x', E.pTex(E.pDeriv([E.q0, E.Q(-3), E.q0, E.q1]), 'x'), '3x^{2}-3');

  T.group('Wurzeln (Fe)');
  const f8 = E.feSqrtQ(E.Q(8));
  T.eq('√8 = 2√2', E.feTex(f8), '2\\sqrt{2}');
  T.near('√8 numerisch', E.feNum(f8), Math.sqrt(8), 1e-12);
  T.eq('√16 = 4 (rational)', E.feTex(E.feSqrtQ(E.Q(16))), '4');
  T.eq('√(−1) = null', E.feSqrtQ(E.Q(-1)), null);

  T.group('Gleichungslöser  f(x)=0');
  const Z = (expr, tex, exact = true) => { const r = rootsOf(expr); T.eq(expr + ' = 0', r.tex, tex); T.eq('   exakt?', r.exact, exact); };
  Z('x^2-4', ['-2', '2']);
  Z('x^2-2', ['-\\sqrt{2}', '\\sqrt{2}']);
  Z('x^2-x-1', ['\\frac{1-\\sqrt{5}}{2}', '\\frac{1+\\sqrt{5}}{2}']);
  Z('x^3-x', ['-1', '0', '1']);
  Z('(x-1)*(x+3)', ['-3', '1']);
  Z('x^2+1', []);
  Z('2^x-4', ['2']);
  Z('EC^x-2', ['\\ln(2)']);
  Z('log(x)-1', ['e']);
  Z('sqrt(x+4)-2', ['0']);
  Z('cos(x)-1/2', ['-\\frac{7\\pi}{3}', '-\\frac{5\\pi}{3}', '-\\frac{\\pi}{3}', '\\frac{\\pi}{3}', '\\frac{5\\pi}{3}', '\\frac{7\\pi}{3}']);
  T.eq('sin(x)=0 im Fenster [−10,10]', rootsOf('sin(x)').tex.join(' '), '-3\\pi -2\\pi -\\pi 0 \\pi 2\\pi 3\\pi');
};
