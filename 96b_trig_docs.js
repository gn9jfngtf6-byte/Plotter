// ═════════════════════════════════════════════════════════════════
// MODUL 96b: Rechenwege der trigonometrischen Funktionen (zu 96_trig.js, ohne DOM)
//
// Schritte {k, s, sc} wie bei 93b_exp_docs.js: k 'h' Überschrift, 'p' Text (**fett**, $Formel$), 'e' Formelzeile,
// 'res' Ergebnis, 'note' Hinweis; sc = Farbbuchstabe, wenn die Zeile auch im Bild erscheint.
//   Trig.st.circ(deg)        Einheitskreis: Punkt P(cos φ | sin φ), Bogenmass, Werte (exakt an besonderen Winkeln), Quadrant, sin² + cos² = 1
//   Trig.st.gen(F)           allgemeine Sinusfunktion a·sin(b(x − c)) + d: Amplitude, Periode, Verschiebungen, Hoch-/Tiefpunkte, Nullstellen
//   Trig.st.tan(deg)         Tangens: Definition sin/cos, Steigung, Polstellen, Periode π, Beziehungen und Symmetrien
// Trig.doc(r) → SV.Doc, Trig.sceneLines(r) → Zeilen im Bild
// ═════════════════════════════════════════════════════════════════
(function () {
  const E = Dif.E, { DOC, fmtT } = Dif;
  const q1 = E.q1;
  const T = q => E.qTex(q);
  const nv = (v, d) => fmtT(v, d === undefined ? 4 : d), ap = (v, d) => '\\approx' + nv(v, d);
  const isZ = E.qIsZero;
  const mkSt = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, h: f('h'), p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const QUAD = ['auf einer Achse', 'im 1. Quadranten (beide positiv)', 'im 2. Quadranten (Sinus positiv, Kosinus negativ)', 'im 3. Quadranten (beide negativ)', 'im 4. Quadranten (Sinus negativ, Kosinus positiv)'];
  const eqOr = v => (v.exact ? '=' : '\\approx');

  // ───────── Einheitskreis: Sinus und Kosinus ─────────
  function circ(deg) {
    const B = mkSt(), v = Trig.vals(deg), d = Trig.norm(deg), dT = Trig.degTex(deg), rT = Trig.radTex(deg);
    B.p('**Einheitskreis:** Kreis mit Radius $1$ um den Ursprung. Der Winkel $\\varphi$ wird von der positiven $x$-Achse aus **gegen den Uhrzeigersinn** gemessen. Der Strahl trifft den Kreis im Punkt $P$.');
    B.e('P(\\cos\\varphi\\,|\\,\\sin\\varphi)', 'b');
    B.p('**Definition:** Der Kosinus ist die $x$-Koordinate von $P$ (waagrechter Abstand), der Sinus die $y$-Koordinate (Höhe). Weil der Radius $1$ ist, stimmt das mit Ankathete/Hypotenuse und Gegenkathete/Hypotenuse im rechtwinkligen Dreieck überein.');
    B.p('**Bogenmass:** Statt in Grad misst man den Winkel durch die **Länge des Bogens** auf dem Einheitskreis. Der ganze Kreis hat den Umfang $2\\pi$, also entspricht $360^\\circ$ dem Bogen $2\\pi$ und $180^\\circ$ dem Bogen $\\pi$.');
    B.e('x=\\varphi\\cdot\\frac{\\pi}{180^\\circ}\\colon\\quad ' + dT + '=' + rT + (Trig.piFrac(deg) ? ap(Trig.deg2rad(deg), 3) : ''), 'v');
    B.p('**Werte bei** $\\varphi=' + dT + '$' + (v.exact ? ' (besonderer Winkel, exakte Werte aus dem halben Quadrat bzw. dem halben gleichseitigen Dreieck):' : ' (kein besonderer Winkel: Taschenrechner):'));
    B.e('\\sin ' + dT + eqOr(v) + v.sinT + ',\\qquad \\cos ' + dT + eqOr(v) + v.cosT, 'r');
    if (d % 90 === 0) B.p('**Lage:** $P$ liegt auf einer Koordinatenachse; eine der beiden Koordinaten ist $0$, die andere $\\pm1$.');
    else B.p('**Vorzeichen:** $P$ liegt ' + QUAD[v.quad] + '.');
    B.p('**Pythagoras im Einheitskreis:** Die Koordinaten von $P$ sind die Katheten eines rechtwinkligen Dreiecks mit Hypotenuse $1$:');
    B.e('\\sin^2\\varphi+\\cos^2\\varphi=1\\colon\\quad ' + (v.exact ? '\\left(' + v.sinT + '\\right)^2+\\left(' + v.cosT + '\\right)^2=1' : nv(v.sin * v.sin, 4) + '+' + nv(v.cos * v.cos, 4) + '\\approx1'), 'g');
    B.p('**Periodizität und Symmetrie:** Eine volle Umdrehung ändert nichts; Spiegeln an der $y$-Achse lässt den Sinus gleich, Spiegeln an der $x$-Achse den Kosinus.');
    B.e('\\sin(\\varphi+360^\\circ)=\\sin\\varphi,\\qquad \\sin(180^\\circ-\\varphi)=\\sin\\varphi,\\qquad \\cos(-\\varphi)=\\cos\\varphi');
    B.note('Dreht sich $P$ gleichmässig, so beschreibt seine Höhe die Sinuskurve und sein waagrechter Abstand die Kosinuskurve – das Bild rechts.');
    B.res('Sinus = Höhe, Kosinus = waagrechter Abstand des Punktes $P$ auf dem Einheitskreis; $\\sin ' + dT + eqOr(v) + v.sinT + '$, $\\cos ' + dT + eqOr(v) + v.cosT + '$');
    return { title: 'Einheitskreis: Sinus und Kosinus', st: B.st };
  }

  // ───────── allgemeine Sinusfunktion ─────────
  function gen(F) {
    const B = mkSt(), P = Trig.props(F), base = '\\' + F.kind + '(x)', bt = Trig.bTex(F), a = F.aq, sa = E.qAbs(a);
    if (F.deg) { B.note('Für $a=0$ ist $f$ konstant: $f(x)=' + T(F.dq) + '$.'); return { title: 'Allgemeine Sinusfunktion', st: B.st }; }
    const one = E.qEq(sa, q1), bOne = !F.bpi && E.qEq(F.bq, q1), cz = Trig.cSgn(F) === 0, cAbs = F.cpi ? Trig.piTex(E.qAbs(F.cpi)) : T(E.qAbs(F.cq));
    B.e(Trig.fTex(F, 'f(x)'), 'b');
    B.p('**Grundfunktion:** $g(x)=' + base + '$ mit Amplitude $1$, Periode $2\\pi$ und Mittellinie $y=0$. Daraus entsteht $f$ in vier Schritten.');
    B.p('**Schritt 1 – Amplitude** $|a|=' + T(sa) + '$: ' + (one ? 'Keine Streckung in $y$-Richtung.' : (E.qCmp(sa, q1) > 0 ? 'Strecken' : 'Stauchen') + ' in $y$-Richtung mit dem Faktor $' + T(sa) + '$.') + (E.qSgn(a) < 0 ? ' Wegen $a<0$ zusätzlich **Spiegeln an der x-Achse**.' : ''));
    B.e('y=' + Trig.aPre(a) + base, 'r');
    B.p('**Schritt 2 – Periode:** Der Faktor $b=' + bt + '$ im Argument ' + (bOne ? 'ist $1$: Die Periode bleibt $2\\pi$.' : (F.b > 1 ? 'staucht' : 'streckt') + ' den Graphen in $x$-Richtung mit dem Faktor $\\frac{1}{b}$. Eine volle Schwingung dauert jetzt'));
    B.e('T=\\frac{2\\pi}{b}=\\frac{2\\pi}{' + bt + '}=' + P.TTex + ap(P.T, 3), 'v');
    B.p('**Schritt 3 – Verschiebung in x-Richtung** (Phase): ' + (cz ? 'Keine Verschiebung ($c=0$).' : 'Der Graph wird um $' + cAbs + '$ nach ' + (Trig.cSgn(F) > 0 ? 'rechts' : 'links') + ' geschoben; dazu wird $x$ durch $(x' + (Trig.cSgn(F) > 0 ? '-' : '+') + cAbs + ')$ ersetzt.'));
    B.e('y=' + Trig.fTex(Trig.mk(F.a, F.b, F.c, 0, F.kind), ''), 'b');
    B.p('**Schritt 4 – Verschiebung in y-Richtung:** ' + (isZ(F.dq) ? 'Keine Verschiebung ($d=0$).' : 'Um $' + T(E.qAbs(F.dq)) + '$ nach ' + (E.qSgn(F.dq) > 0 ? 'oben' : 'unten') + ': Die Mittellinie wird $y=' + T(F.dq) + '$.'));
    B.e(Trig.fTex(F, 'y'), 'g');
    B.p('**Wertebereich:** Die Funktion schwingt um die Mittellinie $y=' + T(F.dq) + '$ mit der Amplitude $' + T(sa) + '$: Der grösste Wert ist $' + T(E.qAdd(F.dq, sa)) + '$, der kleinste $' + T(E.qSub(F.dq, sa)) + '$.');
    B.e('W=[' + T(E.qSub(F.dq, sa)) + ';\\,' + T(E.qAdd(F.dq, sa)) + '],\\qquad D=\\mathbb{R}', 'o');
    const k = '\\quad(k\\in\\mathbb{Z})';
    B.p('**Besondere Stellen:** Der erste Hochpunkt liegt bei $x=' + Trig.xTex(P.maxAt(0)) + '$, dann alle $T$. Nullstellen (Schnitt mit der Mittellinie) liegen alle $\\frac{T}{2}$ auseinander.');
    B.e('\\text{Hochpunkte: } x=' + Trig.xTex(P.maxAt(0)) + '+k\\cdot' + P.TTex + k);
    B.e('\\text{Mittellinie geschnitten: } x=' + Trig.xTex(P.zeroAt(0)) + '+k\\cdot' + P.T2Tex + k);
    B.res('Amplitude $' + T(sa) + '$, Periode $T=' + P.TTex + '$, Verschiebung ' + (cz ? 'keine' : '$' + Trig.cTex(F) + '$') + ' in $x$, Mittellinie $y=' + T(F.dq) + '$');
    return { title: 'Allgemeine Sinusfunktion: Amplitude, Periode, Verschiebung', st: B.st };
  }

  // ───────── Tangens und Beziehungen ─────────
  function tan(deg) {
    const B = mkSt(), v = Trig.vals(deg), dT = Trig.degTex(deg), rT = Trig.radTex(deg);
    B.p('**Definition:** Der Tangens ist das Verhältnis von Sinus zu Kosinus, im rechtwinkligen Dreieck also Gegenkathete durch Ankathete. Im Einheitskreis ist $\\tan\\varphi$ die **Steigung** des Strahls durch $P$: Er schneidet die senkrechte Tangente bei $x=1$ in der Höhe $\\tan\\varphi$.');
    B.e('\\tan\\varphi=\\frac{\\sin\\varphi}{\\cos\\varphi}', 'b');
    B.p('**Werte bei** $\\varphi=' + dT + '=' + rT + '$:');
    if (v.pole) {
      B.e('\\cos ' + dT + '=0\\ \\Rightarrow\\ \\tan ' + dT + '\\ \\text{nicht definiert}', 'r');
      B.p('**Polstelle:** Der Strahl verläuft senkrecht und trifft die Tangente bei $x=1$ nie. Nähert sich $\\varphi$ dem Winkel $' + dT + '$, wird $|\\tan\\varphi|$ beliebig gross: Die Gerade $x=' + rT + '$ ist eine **senkrechte Asymptote**.');
    } else {
      const par = t => (/^-/.test(t) ? '\\left(' + t + '\\right)' : t);
      B.e('\\tan ' + dT + '=\\frac{\\sin ' + dT + '}{\\cos ' + dT + '}=' + par(v.sinT) + ':' + par(v.cosT) + eqOr(v) + v.tanT, 'r');
      B.p('**Vorzeichen:** ' + (v.quad === 0 ? 'Auf der $x$-Achse ist der Sinus $0$, also $\\tan\\varphi=0$.' : v.quad === 1 || v.quad === 3 ? 'Sinus und Kosinus haben dasselbe Vorzeichen: $\\tan\\varphi>0$ (' + (v.quad === 1 ? '1.' : '3.') + ' Quadrant).' : 'Sinus und Kosinus haben verschiedene Vorzeichen: $\\tan\\varphi<0$ (' + (v.quad === 2 ? '2.' : '4.') + ' Quadrant).'));
    }
    B.p('**Definitionsbereich:** Der Tangens ist nicht definiert, wo der Kosinus $0$ ist, also bei $90^\\circ$, $270^\\circ$, … Dort hat der Graph Polstellen.');
    B.e('D=\\mathbb{R}\\setminus\\left\\{\\frac{\\pi}{2}+k\\cdot\\pi\\ \\mid\\ k\\in\\mathbb{Z}\\right\\}', 'v');
    B.e('W=\\mathbb{R}', 'v');
    B.p('**Periode:** Nach einer halben Drehung zeigt der Strahl in die Gegenrichtung; Sinus und Kosinus wechseln beide das Vorzeichen, ihr Quotient bleibt gleich. Der Tangens hat darum schon die Periode $\\pi$ (Sinus und Kosinus: $2\\pi$).');
    B.e('\\tan(\\varphi+180^\\circ)=\\frac{-\\sin\\varphi}{-\\cos\\varphi}=\\tan\\varphi', 'g');
    B.p('**Beziehungen zwischen den Funktionen:**');
    B.e('\\sin^2\\varphi+\\cos^2\\varphi=1\\qquad\\text{(Pythagoras im Einheitskreis)}', 'o');
    B.e('\\sin(-\\varphi)=-\\sin\\varphi,\\quad \\cos(-\\varphi)=\\cos\\varphi,\\quad \\tan(-\\varphi)=-\\tan\\varphi');
    B.e('\\cos\\varphi=\\sin(\\varphi+90^\\circ),\\qquad \\sin\\varphi=\\cos(90^\\circ-\\varphi)');
    B.p('**Probe mit den Werten:** $' + (v.exact ? '\\left(' + v.sinT + '\\right)^2+\\left(' + v.cosT + '\\right)^2=1' : nv(v.sin * v.sin, 4) + '+' + nv(v.cos * v.cos, 4) + '\\approx1') + '$' + (v.pole ? '' : ', $\\tan(' + dT + ')' + eqOr(v) + v.tanT + '$') + '.');
    B.res(v.pole ? 'Bei $\\varphi=' + dT + '$ hat der Tangens eine Polstelle; Periode $\\pi$' : 'Der Tangens ist die Steigung des Strahls: $\\tan ' + dT + eqOr(v) + v.tanT + '$; Periode $\\pi$, Polstellen bei $\\frac{\\pi}{2}+k\\pi$');
    return { title: 'Tangens und Beziehungen', st: B.st };
  }

  // ───────── Ausgabe ─────────
  function doc(r) {
    const d = DOC(); d.h(r.title);
    r.st.forEach(s => { if (s.k === 'h') d.h(s.s); else if (s.k === 'p') d.p(s.s); else if (s.k === 'e') d.e(s.s); else if (s.k === 'res') d.res(s.s); else if (s.k === 'note') d.note(s.s); });
    return d;
  }
  function sceneLines(r) {
    const out = [];
    r.st.forEach(s => {
      if (!s.sc || (s.k !== 'e' && s.k !== 'res')) return;
      const body = s.k === 'res' ? s.s.replace(/\$/g, '') : s.s;
      out.push({ s: typeof s.sc === 'string' && s.sc !== 'true' ? '\\col{' + s.sc + '}{' + body + '}' : body, bold: s.k === 'res' });
    });
    return out;
  }
  Trig.st = { circ, gen, tan };
  Trig.doc = doc; Trig.sceneLines = sceneLines;
  Trig.circDoc = d => doc(circ(d)); Trig.genDoc = F => doc(gen(F)); Trig.tanDoc = d => doc(tan(d));
})();
