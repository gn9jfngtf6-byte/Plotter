// ═════════════════════════════════════════════════════════════════
// MODUL 80b: lin_docs — Rechenwege der Umgebung «Lineare Funktionen» (ohne DOM, node-testbar)
//
//   Lin.parDoc(L, dx)                  Steigung, y-Achsenabschnitt, Nullstelle, Winkel
//   Lin.twoDoc(x1,y1,x2,y2)            Gerade durch zwei Punkte
//   Lin.psDoc(x1,y1,m)                 Gerade durch einen Punkt mit Steigung
//   Lin.relDoc(L, x, y, kind)          Parallele ('par') oder Senkrechte ('perp') zu L durch P
//   Lin.sysDoc(L1, L2, method)         Schnitt zweier Geraden: 'eq' Gleichsetzen, 'sub' Einsetzen, 'add' Addition; Schnittwinkel
//   Lin.appDoc(ap, preset)             Zwei Modelle vergleichen (Break-even / Treffpunkt)
//   Lin.zeroDoc(L)                     Nullstelle und Achsenabschnitte
//   Lin.perpDoc(L, x, y)               Senkrechte durch P, Lotfusspunkt, Abstand
//   Lin.midDoc(x1,y1,x2,y2)            Mittelsenkrechte
// Ergebnis ist jeweils ein SV.Doc (Blöcke h/p/e/res/note), dargestellt mit ST.renderDoc und für den
// LaTeX-Export mit Dif.docTex in Text umgewandelt.
// ═════════════════════════════════════════════════════════════════
(function () {
  const E = Dif.E, { DOC, fmtT } = Dif;
  const q0 = E.q0, q1 = E.q1;
  const t = q => E.qTex(q), tp = q => E.qTexP(q);
  const pt = (x, y) => '(' + t(x) + '\\,|\\,' + t(y) + ')';
  const rhs = L => Lin.lineTex(L, '').slice(1);
  const nv = v => fmtT(v, 4);
  const sgnAdd = q => (E.qSgn(q) < 0 ? '-' : '+') + t(E.qAbs(q));
  const fr = (nq, dq_, resq) => { const s = '\\frac{' + t(nq) + '}{' + t(dq_) + '}'; return s + (s === t(resq) ? '' : '=' + t(resq)); };
  const deg = v => nv(v) + '^{\\circ}';
  const ex = (q, tag) => (E.qIsInt(q) ? '' : '\\approx' + nv(E.qNum(q)));

  // ───────── Steigung, y-Achsenabschnitt, Nullstelle ─────────
  function zeroSteps(d, L) {
    const Z = Lin.zero(L);
    d.p('**Nullstelle:** Hier ist $f(x)=0$.');
    if (L.vert) { d.note('Eine senkrechte Gerade ist keine Funktion.'); return Z; }
    if (Z.kind === 'none') { d.e('0\\cdot x' + sgnAdd(L.qq) + '=0\\ \\Rightarrow\\ ' + t(L.qq) + '=0'); d.note('Die Gerade verläuft parallel zur $x$-Achse und hat keine Nullstelle.'); return Z; }
    if (Z.kind === 'all') { d.note('Die Gerade ist die $x$-Achse selbst: Jede Stelle ist eine Nullstelle.'); return Z; }
    d.e(rhs(L) + '=0');
    if (!E.qIsZero(L.qq)) d.e(E.qEq(L.mq, q1) ? 'x=' + t(E.qNeg(L.qq)) : t(L.mq) + 'x=' + t(E.qNeg(L.qq)));
    if (!E.qEq(L.mq, q1) && !E.qEq(L.mq, E.qNeg(q1))) d.e('x=' + fr(E.qNeg(L.qq), L.mq, Z.xq));
    else if (E.qEq(L.mq, E.qNeg(q1)) && !E.qIsZero(L.qq)) d.e('x=' + t(Z.xq));
    d.res('Nullstelle $x_0=' + t(Z.xq) + (E.qIsInt(Z.xq) ? '' : '\\approx' + nv(Z.x)) + '$, also $N(' + t(Z.xq) + '\\,|\\,0)$');
    return Z;
  }
  function parDoc(L, dx) {
    const d = DOC();
    d.h('Die Gerade $y=mx+q$');
    d.e(Lin.lineTex(L, 'f(x)'));
    if (L.vert) { d.note('Eine senkrechte Gerade ist keine Funktion.'); return d; }
    const DX = Lin.Qn(dx || 1), DY = E.qMul(L.mq, DX);
    d.p('**Steigung** $m$: Wächst $x$ um $\\Delta x$, so ändert sich $y$ um $\\Delta y=m\\cdot\\Delta x$.');
    d.e('m=\\frac{\\Delta y}{\\Delta x}=' + fr(DY, DX, L.mq));
    d.p('**y-Achsenabschnitt** $q$: Der Wert bei $x=0$.');
    d.e('f(0)=' + (E.qIsZero(L.mq) ? t(L.qq) : t(L.mq) + '\\cdot0' + (E.qIsZero(L.qq) ? '' : sgnAdd(L.qq)) + '=' + t(L.qq)));
    zeroSteps(d, L);
    d.p('**Steigungswinkel:** Die Gerade bildet mit der $x$-Achse den Winkel $\\alpha$.');
    d.e('\\tan\\alpha=m\\ \\Rightarrow\\ \\alpha=\\arctan\\left(' + t(L.mq) + '\\right)\\approx' + deg(Lin.angle(L)));
    d.note(E.qSgn(L.mq) > 0 ? 'Die Steigung ist positiv: Die Gerade steigt.' : E.qSgn(L.mq) < 0 ? 'Die Steigung ist negativ: Die Gerade fällt.' : 'Die Steigung ist null: Die Gerade verläuft waagrecht.');
    return d;
  }
  function zeroDoc(L) {
    const d = DOC();
    d.h('Nullstelle und Achsenabschnitte');
    d.e(Lin.lineTex(L, 'f(x)'));
    if (L.vert) { d.note('Eine senkrechte Gerade ist keine Funktion.'); return d; }
    const Z = zeroSteps(d, L);
    d.p('**y-Achsenabschnitt:** Der Schnittpunkt mit der $y$-Achse liegt bei $x=0$.');
    d.res('$S(0\\,|\\,' + t(L.qq) + ')$' + (Z.kind === 'one' ? ', $N(' + t(Z.xq) + '\\,|\\,0)$' : ''));
    return d;
  }

  // ───────── Gerade aufstellen ─────────
  function twoDoc(x1, y1, x2, y2) {
    const d = DOC(), X1 = Lin.Qn(x1), Y1 = Lin.Qn(y1), X2 = Lin.Qn(x2), Y2 = Lin.Qn(y2);
    d.h('Gerade durch zwei Punkte');
    d.e('P' + pt(X1, Y1) + ',\\qquad Q' + pt(X2, Y2));
    if (E.qEq(X1, X2)) {
      d.p('Beide Punkte haben dieselbe $x$-Koordinate: Die Gerade ist senkrecht und keine Funktion.');
      d.res('$x=' + t(X1) + '$'); return d;
    }
    const L = Lin.fromPoints(x1, y1, x2, y2), dY = E.qSub(Y2, Y1), dX = E.qSub(X2, X1);
    d.p('**Schritt 1:** Steigung aus den beiden Punkten berechnen.');
    d.e('m=\\frac{y_Q-y_P}{x_Q-x_P}=\\frac{' + t(Y2) + (E.qSgn(Y1) < 0 ? '-\\left(' + t(Y1) + '\\right)' : E.qIsZero(Y1) ? '' : '-' + t(Y1)) + '}{' + t(X2) + (E.qSgn(X1) < 0 ? '-\\left(' + t(X1) + '\\right)' : E.qIsZero(X1) ? '' : '-' + t(X1)) + '}=' + fr(dY, dX, L.mq));
    d.p('**Schritt 2:** Punkt $P$ in $y=mx+q$ einsetzen und nach $q$ auflösen.');
    d.e(t(Y1) + '=' + tp(L.mq) + '\\cdot' + tp(X1) + '+q');
    d.e('q=' + t(Y1) + '-' + tp(E.qMul(L.mq, X1)) + '=' + t(L.qq));
    d.p('**Schritt 3:** Gleichung aufschreiben.');
    d.res('$' + Lin.lineTex(L) + '$');
    d.note('Probe mit $Q$: $' + tp(L.mq) + '\\cdot' + tp(X2) + (E.qSgn(L.qq) < 0 ? '-' : '+') + t(E.qAbs(L.qq)) + '=' + t(Y2) + '$.');
    return d;
  }
  function psDoc(x1, y1, m) {
    const d = DOC(), X1 = Lin.Qn(x1), Y1 = Lin.Qn(y1), M = Lin.Qn(m), L = Lin.fromPointSlope(x1, y1, m);
    d.h('Gerade durch einen Punkt mit gegebener Steigung');
    d.e('P' + pt(X1, Y1) + ',\\qquad m=' + t(M));
    d.p('**Schritt 1:** Punkt $P$ und Steigung $m$ in $y=mx+q$ einsetzen.');
    d.e(t(Y1) + '=' + tp(M) + '\\cdot' + tp(X1) + '+q');
    d.p('**Schritt 2:** Nach $q$ auflösen.');
    d.e('q=' + t(Y1) + '-' + tp(E.qMul(M, X1)) + '=' + t(L.qq));
    d.p('**Schritt 3:** Gleichung aufschreiben.');
    d.res('$' + Lin.lineTex(L) + '$');
    return d;
  }
  function relDoc(L, x, y, kind) {                      // Parallele oder Senkrechte zu L durch R(x|y)
    const d = DOC(), X = Lin.Qn(x), Y = Lin.Qn(y), par = kind === 'par';
    d.h(par ? 'Parallele durch einen Punkt' : 'Senkrechte durch einen Punkt');
    d.e('g\\colon\\ ' + Lin.lineTex(L) + ',\\qquad R' + pt(X, Y));
    if (L.vert) { d.note('Die Gerade $g$ ist senkrecht.'); return d; }
    const N = par ? Lin.parallelThrough(L, x, y) : Lin.perpThrough(L, x, y);
    if (par) {
      d.p('**Schritt 1:** Parallele Geraden haben dieselbe Steigung.');
      d.e('m=' + t(L.mq));
    } else if (E.qIsZero(L.mq)) {
      d.p('**Schritt 1:** $g$ verläuft waagrecht, also ist die Senkrechte eine senkrechte Gerade.');
      d.res('$x=' + t(X) + '$'); return d;
    } else {
      d.p('**Schritt 1:** Senkrechte Geraden haben Steigungen mit Produkt $-1$.');
      d.e('m\\cdot m_{\\perp}=-1\\ \\Rightarrow\\ m_{\\perp}=-\\frac{1}{' + t(L.mq) + '}=' + t(N.mq));
    }
    d.p('**Schritt 2:** Punkt $R$ einsetzen und $q$ bestimmen.');
    d.e(t(Y) + '=' + tp(N.mq) + '\\cdot' + tp(X) + '+q\\ \\Rightarrow\\ q=' + t(N.qq));
    d.res('$' + Lin.lineTex(N) + '$');
    return d;
  }

  // ───────── Schnitt zweier Geraden ─────────
  function sysDoc(L1, L2, method) {
    const d = DOC(), I = Lin.intersect(L1, L2), m = method || 'eq';
    d.h('Schnittpunkt zweier Geraden');
    d.e('g_1\\colon\\ ' + Lin.lineTex(L1) + ',\\qquad g_2\\colon\\ ' + Lin.lineTex(L2));
    if (L1.vert || L2.vert) { d.note('Eine der Geraden ist senkrecht.'); if (I.kind === 'point') d.res('$S' + pt(I.xq, I.yq) + '$'); return d; }
    const dm = E.qSub(L1.mq, L2.mq), dq = E.qSub(L2.qq, L1.qq);
    if (m === 'eq') {
      d.p('**Schritt 1:** Die beiden Funktionsterme gleichsetzen.');
      d.e(rhs(L1) + '=' + rhs(L2));
      d.p('**Schritt 2:** Nach $x$ auflösen: Alle $x$-Terme nach links, alle Zahlen nach rechts.');
      d.e('\\left(' + t(L1.mq) + '-' + tp(L2.mq) + '\\right)x=' + t(L2.qq) + '-' + tp(L1.qq));
      d.e(t(dm) + '\\cdot x=' + t(dq));
    } else if (m === 'sub') {
      d.p('**Schritt 1:** $g_2$ so umformen, dass links nur $y-m_2x$ steht.');
      d.e('y-' + tp(L2.mq) + 'x=' + t(L2.qq));
      d.p('**Schritt 2:** $y=' + rhs(L1) + '$ aus $g_1$ einsetzen und nach $x$ auflösen.');
      d.e('\\left(' + rhs(L1) + '\\right)-' + tp(L2.mq) + 'x=' + t(L2.qq));
      d.e(t(E.qSub(L1.mq, L2.mq)) + '\\cdot x+' + tp(L1.qq) + '=' + t(L2.qq));
      d.e(t(dm) + '\\cdot x=' + t(dq));
    } else {
      d.p('**Schritt 1:** Beide Gleichungen in die Form $y-mx=q$ bringen.');
      d.e('\\text{(I)}\\quad y-' + tp(L1.mq) + 'x=' + t(L1.qq));
      d.e('\\text{(II)}\\quad y-' + tp(L2.mq) + 'x=' + t(L2.qq));
      d.p('**Schritt 2:** Gleichung (II) von Gleichung (I) subtrahieren: $y$ fällt weg.');
      d.e('\\left(-' + tp(L1.mq) + '+' + tp(L2.mq) + '\\right)x=' + t(L1.qq) + '-' + tp(L2.qq));
      d.e(t(E.qNeg(dm)) + '\\cdot x=' + t(E.qNeg(dq)));
    }
    if (I.kind === 'parallel') { d.res('Die Gleichung hat keine Lösung: Die Geraden sind **parallel** und haben keinen Schnittpunkt.'); }
    else if (I.kind === 'same') { d.res('Die Gleichung ist immer erfüllt: Die Geraden sind **identisch**.'); }
    else {
      d.e('x=' + fr(dq, dm, I.xq));
      d.p('**Schritt 3:** $x$ in $g_1$ einsetzen, um $y$ zu berechnen.');
      d.e('y=' + tp(L1.mq) + '\\cdot' + tp(I.xq) + (E.qSgn(L1.qq) < 0 ? '-' : '+') + t(E.qAbs(L1.qq)) + '=' + t(I.yq));
      d.res('Schnittpunkt $S(' + t(I.xq) + '\\,|\\,' + t(I.yq) + ')$' + (E.qIsInt(I.xq) && E.qIsInt(I.yq) ? '' : ', also $S\\approx(' + nv(I.x) + '\\,|\\,' + nv(I.y) + ')$'));
      d.note('Probe mit $g_2$: $' + tp(L2.mq) + '\\cdot' + tp(I.xq) + (E.qSgn(L2.qq) < 0 ? '-' : '+') + t(E.qAbs(L2.qq)) + '=' + t(I.yq) + '$.');
      d.p('**Schnittwinkel:** Der spitze Winkel $\\varphi$ zwischen den Geraden folgt aus den Steigungen.');
      const den = E.qAdd(q1, E.qMul(L1.mq, L2.mq));
      if (E.qIsZero(den)) d.res('Es gilt $m_1\\cdot m_2=-1$: Die Geraden stehen senkrecht aufeinander, $\\varphi=90^{\\circ}$.');
      else { d.e('\\tan\\varphi=\\left|\\frac{m_1-m_2}{1+m_1m_2}\\right|=\\left|\\frac{' + t(dm) + '}{' + t(den) + '}\\right|'); d.res('$\\varphi\\approx' + deg(Lin.angleBetween(L1, L2)) + '$'); }
    }
    return d;
  }

  // ───────── Anwendungen ─────────
  function appDoc(ap, pre) {
    const d = DOC(), A = ap.LA, B = ap.LB, I = ap.I, move = pre && pre.kind === 'move';
    d.h(move ? 'Treffpunkt zweier Bewegungen' : 'Zwei Angebote vergleichen');
    d.e('A(x)=' + rhs(A).replace(/^/, '') + ',\\qquad B(x)=' + rhs(B));
    d.p(move ? '**Schritt 1:** Die Orte gleichsetzen: Zur Zeit $x$ sind beide am selben Ort.' : '**Schritt 1:** Gleichsetzen: Bei welchem $x$ kosten beide gleich viel (Break-even)?');
    d.e(rhs(A) + '=' + rhs(B));
    d.p('**Schritt 2:** Nach $x$ auflösen.');
    const dm = E.qSub(A.mq, B.mq), dq = E.qSub(B.qq, A.qq);
    d.e(t(dm) + '\\cdot x=' + t(dq));
    if (I.kind === 'parallel') { d.res(move ? 'Die Geschwindigkeiten sind gleich, aber die Startorte verschieden: Die beiden treffen sich nie.' : 'Die Preise pro Einheit sind gleich, die Grundbeträge verschieden: Ein Angebot ist immer günstiger.'); return d; }
    if (I.kind === 'same') { d.res('Beide Modelle sind identisch.'); return d; }
    d.e('x=' + fr(dq, dm, I.xq));
    d.p('**Schritt 3:** $x$ in einen der beiden Terme einsetzen.');
    d.e('A(' + t(I.xq) + ')=' + tp(A.mq) + '\\cdot' + tp(I.xq) + (E.qSgn(A.qq) < 0 ? '-' : '+') + t(E.qAbs(A.qq)) + '=' + t(I.yq));
    d.res((move ? 'Treffpunkt' : 'Break-even') + ' $(' + t(I.xq) + '\\,|\\,' + t(I.yq) + ')\\approx(' + nv(I.x) + '\\,|\\,' + nv(I.y) + ')$');
    if (!move) d.note(ap.belowA ? 'Links vom Break-even ist $A$ günstiger, rechts davon $B$.' : 'Links vom Break-even ist $B$ günstiger, rechts davon $A$.');
    if (I.x < 0) d.note('Der Schnittpunkt liegt bei negativem $x$: Im Sachzusammenhang gibt es keinen Break-even.');
    return d;
  }

  // ───────── Senkrechte, Lot, Mittelsenkrechte ─────────
  function perpDoc(L, x, y) {
    const d = DOC(), X = Lin.Qn(x), Y = Lin.Qn(y);
    d.h('Senkrechte, Lotfusspunkt und Abstand');
    d.e('g\\colon\\ ' + Lin.lineTex(L) + ',\\qquad P' + pt(X, Y));
    if (L.vert) { d.note('Die Gerade $g$ ist senkrecht.'); return d; }
    const o = Lin.foot(L, x, y), N = o.perp;
    if (E.qIsZero(L.mq)) { d.p('**Schritt 1:** $g$ verläuft waagrecht, also ist die Senkrechte durch $P$ die senkrechte Gerade $x=' + t(X) + '$.'); }
    else {
      d.p('**Schritt 1:** Die Steigung der Senkrechten: Das Produkt der Steigungen ist $-1$.');
      d.e('m_{\\perp}=-\\frac{1}{' + t(L.mq) + '}=' + t(N.mq));
      d.p('**Schritt 2:** Die Gerade durch $P$ mit dieser Steigung aufstellen.');
      d.e(t(Y) + '=' + tp(N.mq) + '\\cdot' + tp(X) + '+q\\ \\Rightarrow\\ q=' + t(N.qq));
      d.e('n\\colon\\ ' + Lin.lineTex(N));
    }
    d.p('**Schritt 3:** Der Lotfusspunkt $F$ ist der Schnittpunkt von $g$ und der Senkrechten.');
    if (!E.qIsZero(L.mq)) d.e(rhs(L) + '=' + rhs(N) + '\\ \\Rightarrow\\ x_F=' + t(o.F.xq));
    d.e('F' + pt(o.F.xq, o.F.yq));
    d.p('**Schritt 4:** Der Abstand von $P$ zu $g$ ist die Länge der Strecke $PF$.');
    const fe = E.feSqrtQ(o.d2);
    d.e('d=\\overline{PF}=\\sqrt{\\left(' + t(E.qSub(o.F.xq, X)) + '\\right)^{2}+\\left(' + t(E.qSub(o.F.yq, Y)) + '\\right)^{2}}=\\sqrt{' + t(o.d2) + '}');
    d.res('$d=' + (fe ? E.feTex(fe) : nv(o.dist)) + '\\approx' + nv(o.dist) + '$');
    return d;
  }
  function midDoc(x1, y1, x2, y2) {
    const d = DOC(), X1 = Lin.Qn(x1), Y1 = Lin.Qn(y1), X2 = Lin.Qn(x2), Y2 = Lin.Qn(y2);
    d.h('Mittelsenkrechte');
    d.e('A' + pt(X1, Y1) + ',\\qquad B' + pt(X2, Y2));
    const o = Lin.bisector(x1, y1, x2, y2);
    if (!o) { d.note('$A$ und $B$ fallen zusammen: Es gibt keine Mittelsenkrechte.'); return d; }
    d.p('**Schritt 1:** Der Mittelpunkt $M$ der Strecke $AB$ liegt in der Mitte der Koordinaten.');
    d.e('M\\left(\\frac{x_A+x_B}{2}\\,\\middle|\\,\\frac{y_A+y_B}{2}\\right)=M\\left(\\frac{' + t(X1) + '+' + tp(X2) + '}{2}\\,\\middle|\\,\\frac{' + t(Y1) + '+' + tp(Y2) + '}{2}\\right)=M' + pt(o.M.xq, o.M.yq));
    if (o.AB.vert) { d.p('**Schritt 2:** $AB$ ist senkrecht, also ist die Mittelsenkrechte waagrecht durch $M$.'); }
    else if (E.qIsZero(o.AB.mq)) { d.p('**Schritt 2:** $AB$ ist waagrecht, also ist die Mittelsenkrechte senkrecht durch $M$.'); }
    else {
      d.p('**Schritt 2:** Die Steigung von $AB$, dann die Steigung der Senkrechten (Produkt $-1$).');
      d.e('m_{AB}=\\frac{' + t(Y2) + '-' + tp(Y1) + '}{' + t(X2) + '-' + tp(X1) + '}=' + t(o.AB.mq) + ',\\qquad m=-\\frac{1}{' + t(o.AB.mq) + '}=' + t(o.line.mq));
    }
    d.p('**Schritt 3:** Die Gerade durch $M$ mit dieser Steigung aufstellen.');
    if (!o.line.vert && !E.qIsZero(o.line.mq)) d.e(t(o.M.yq) + '=' + tp(o.line.mq) + '\\cdot' + tp(o.M.xq) + '+q\\ \\Rightarrow\\ q=' + t(o.line.qq));
    d.res('$m_{AB}\\colon\\ ' + Lin.lineTex(o.line) + '$');
    d.note('Jeder Punkt der Mittelsenkrechten ist von $A$ und $B$ gleich weit entfernt.');
    return d;
  }

  Object.assign(Lin, { parDoc, zeroDoc, twoDoc, psDoc, relDoc, sysDoc, appDoc, perpDoc, midDoc });
})();
