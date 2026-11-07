// ═════════════════════════════════════════════════════════════════
// MODUL 109b: Rechenwege zur linearen Optimierung (zu 109_lop.js, ohne DOM)
//
// Schritte {k, s} wie bei den anderen Rechenwegen. Aufbau nach dem Dossier:
//   Lp.st.ung1(I)              Ungleichung mit einer Variablen umformen (Zeichen kehrt bei negativem Faktor), Intervall, Probe
//   Lp.st.half(I, T)           Halbebene: Grenzgerade (Achsenschnittpunkte), durchgezogen/gestrichelt, Testpunkt
//   Lp.st.poly(L, nn, ctx)     Ungleichungssystem: Bedingungen, Eckpunkte als Schnittpunkte zweier Grenzgeraden
//   Lp.st.opt(L, nn, O, mode, ctx)  Zielfunktion, Niveaulinie, Eckpunktprinzip, Ganzzahligkeit, Antwortsatz
// Lp.doc(r) → SV.Doc
// ═════════════════════════════════════════════════════════════════
(function () {
  const { DOC } = Dif;
  const q = Lp.q, B0 = Lp.big;
  const mkSt = () => { const st = []; const f = k => s => { st.push({ k, s }); }; return { st, h: f('h'), p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const pt = (x, y) => '(' + q(x) + '\\,|\\,' + q(y) + ')';
  const par = v => (v < 0 ? '(' + q(v) + ')' : q(v));
  const nm = (L, i) => (L[i].nn ? (L[i].a ? 'x=0' : 'y=0') : '(' + romanOf(i) + ')');
  // a·x + b·y mit eingesetzten Werten: «2\cdot 3+3\cdot 1»
  const subst = (a, b, x, y) => { let t = ''; [[a, x], [b, y]].forEach(([k, v]) => { if (Math.abs(k) < 1e-12) return; const neg = k < 0, ak = Math.abs(k); t += (t ? (neg ? '-' : '+') : (neg ? '-' : '')) + (Math.abs(ak - 1) < 1e-12 ? par(v) : B0(ak) + '\\cdot ' + par(v)); }); return t || '0'; };
  const romanOf = i => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][i] || String(i + 1);

  // ───────── eine Variable ─────────
  function ung1(I) {
    const B = mkSt(), R = Lp.solve1(I);
    B.p('**Umformen wie eine Gleichung:** Auf beiden Seiten dasselbe addieren oder subtrahieren ändert nichts.');
    B.e(Lp.texRaw(I));
    const l = I.l, r = I.r, kx = l.x - r.x, kc = r.c - l.c;
    if (Math.abs(r.x) > 1e-12 || Math.abs(l.c) > 1e-12) B.e(Lp.linTex(kx, 0) + Lp.REL[I.rel] + q(kc) + '\\qquad\\big|\\ ' + (Math.abs(r.x) > 1e-12 ? (r.x > 0 ? '-' : '+') + Lp.linTex(Math.abs(r.x), 0) : '') + (Math.abs(l.c) > 1e-12 ? (l.c > 0 ? '-' : '+') + q(Math.abs(l.c)) : ''));
    if (Math.abs(kx - 1) > 1e-12) {
      B.p(kx < 0 ? '**Achtung:** Durch die negative Zahl $' + q(kx) + '$ dividieren – dabei **kehrt sich das Ungleichheitszeichen um**.' : 'Durch die positive Zahl $' + q(kx) + '$ dividieren; das Zeichen bleibt.');
      B.e('x' + R.relTex + '\\frac{' + q(kc) + '}{' + q(kx) + '}=' + q(R.bound) + '\\qquad\\big|\\ :' + par(kx));
    }
    B.p('**Lösungsmenge** als Intervall' + (R.rel === '<' || R.rel === '>' ? ' (die Grenze gehört nicht dazu: runde Klammer)' : R.rel === '=' ? '' : ' (die Grenze gehört dazu: eckige Klammer)') + ':');
    B.e('\\mathbb{L}=' + R.iv);
    const t1 = Math.round(R.bound) - 2, t2 = Math.round(R.bound) + 2;
    const chk = x => { const L = l.x * x + l.c, Rr = r.x * x + r.c, okk = Lp.ok(I, x, 0); return 'x=' + q(x) + ':\\ ' + q(L) + Lp.REL[I.rel] + q(Rr) + '\\ ' + (okk ? '\\checkmark' : '\\text{falsch}'); };
    B.p('**Probe** mit je einer Zahl links und rechts der Grenze:');
    B.e(chk(t1) + ',\\qquad ' + chk(t2));
    B.res('$\\mathbb{L}=' + R.iv + '$');
    return { title: 'Lineare Ungleichung mit einer Variablen', st: B.st };
  }

  // ───────── Halbebene ─────────
  function half(I, T) {
    const B = mkSt(), strict = I.rel === '<' || I.rel === '>';
    B.e(Lp.texRaw(I) + (Lp.texRaw(I) !== Lp.tex(I) ? '\\quad\\Leftrightarrow\\quad ' + Lp.tex(I) : ''));
    const J = Lp.intForm(I);
    B.p('**1. Grenzgerade** zeichnen: Ungleichheitszeichen durch $=$ ersetzen.');
    B.e(Lp.linTex(J.a, J.b) + '=' + B0(J.c));
    const ax = [];
    if (Math.abs(J.a) > 1e-12) ax.push('y=0:\\ x=' + q(J.c / J.a) + '\\ \\Rightarrow\\ ' + pt(J.c / J.a, 0));
    if (Math.abs(J.b) > 1e-12) ax.push('x=0:\\ y=' + q(J.c / J.b) + '\\ \\Rightarrow\\ ' + pt(0, J.c / J.b));
    if (Math.abs(J.c) > 1e-12 && ax.length === 2) { B.p('Achsenschnittpunkte:'); B.e(ax.join(',\\qquad ')); }
    else if (Math.abs(J.b) > 1e-12) { B.p('Die Gerade geht durch den Ursprung; ein zweiter Punkt: $x=' + q(J.b) + '$ einsetzen.'); B.e(pt(0, 0) + ',\\ ' + pt(J.b, -J.a)); }
    B.note(strict ? 'Bei $<$ oder $>$ gehört die Gerade **nicht** dazu: gestrichelt zeichnen.' : 'Bei $\\le$ oder $\\ge$ gehört die Gerade dazu: durchgezogen zeichnen.');
    const okT = Lp.ok(I, T[0], T[1]);
    B.p('**2. Testpunkt** einsetzen, der nicht auf der Geraden liegt: $T' + pt(T[0], T[1]) + '$.');
    B.e(subst(J.a, J.b, T[0], T[1]) + '=' + q(J.a * T[0] + J.b * T[1]) + Lp.REL[J.rel] + B0(J.c) + '\\quad ' + (okT ? '\\text{wahr}' : '\\text{falsch}'));
    B.p(okT ? 'Die Seite **mit** dem Testpunkt gehört zur Lösungsmenge.' : 'Die Seite **ohne** den Testpunkt gehört zur Lösungsmenge.');
    if (Math.abs(I.b) > 1e-12) {
      const m = -I.a / I.b, c = I.c / I.b, FL = { '<=': '>=', '>=': '<=', '<': '>', '>': '<' }, rel = I.b < 0 ? FL[I.rel] : I.rel;
      B.p('**Alternativ** nach $y$ auflösen' + (I.b < 0 ? ' (durch die negative Zahl $' + q(I.b) + '$ dividieren: Zeichen kehrt)' : '') + ':');
      B.e('y' + Lp.REL[rel] + (Math.abs(m) > 1e-12 ? Lp.linTex(m, 0) + (c >= 0 ? '+' : '') : '') + q(c) + '\\qquad\\Rightarrow\\quad\\text{' + (rel === '<=' || rel === '<' ? 'unterhalb' : 'oberhalb') + ' der Geraden}');
    }
    B.res('Lösungsmenge: Halbebene ' + (okT ? 'mit' : 'ohne') + ' $T' + pt(T[0], T[1]) + '$' + (strict ? ', Gerade ausgeschlossen' : ', Gerade eingeschlossen'));
    return { title: 'Ungleichung mit zwei Variablen', st: B.st };
  }

  // ───────── Planungspolygon ─────────
  function poly(L0, nn, ctx) {
    const B = mkSt(), L = Lp.all(L0, nn), V = Lp.vertices(L0, nn), R = Lp.region(L0, nn);
    if (ctx && ctx.vars) B.p('**Variablen:** ' + ctx.vars);
    B.p('**Bedingungen** (Ungleichungssystem):');
    L0.forEach((I, i) => B.e('(' + romanOf(i) + ')\\quad ' + Lp.texRaw(I) + (Lp.texRaw(I) !== Lp.tex(I) ? '\\quad\\Leftrightarrow\\quad ' + Lp.tex(I) : '')));
    if (nn) B.e('x\\ge0,\\quad y\\ge0\\qquad\\text{(Nichtnegativität)}');
    if (ctx && ctx.int) B.note('Stückzahlen: $x,\\,y\\in\\mathbb{N}$ (nur ganzzahlige Punkte im Polygon kommen in Frage).');
    if (R.empty) { B.res('Keine Lösung: Die Halbebenen haben keinen gemeinsamen Punkt.'); return { title: 'Planungspolygon', st: B.st }; }
    B.p('**Planungspolygon** = Durchschnitt aller Halbebenen. Seine **Eckpunkte** sind Schnittpunkte von je zwei Grenzgeraden:');
    V.forEach((v, k) => B.e('E_{' + (k + 1) + '}=' + pt(v.x, v.y) + '\\qquad ' + v.on.slice(0, 2).map(i => nm(L, i)).join('\\cap ')));
    const hard = V.find(v => v.on.filter(i => !L[i].nn).length >= 2);
    if (hard) {
      const A = Lp.intForm(L[hard.on[0]]), C = Lp.intForm(L[hard.on[1]]);
      B.p('**Eckpunkt berechnen** (nicht genau ablesbar): Gleichungssystem der beiden Grenzgeraden lösen.');
      B.e('\\begin{aligned}' + Lp.linTex(A.a, A.b) + '&=' + B0(A.c) + '\\\\ ' + Lp.linTex(C.a, C.b) + '&=' + B0(C.c) + '\\end{aligned}\\qquad\\Rightarrow\\quad x=' + q(hard.x) + ',\\ y=' + q(hard.y));
    }
    if (!R.bounded) B.note('Das Gebiet ist **nicht beschränkt** (es reicht ins Unendliche).');
    B.res('Eckpunkte: ' + V.map(v => '$' + pt(v.x, v.y) + '$').join(', '));
    return { title: 'Ungleichungssystem und Planungspolygon', st: B.st };
  }

  // ───────── Zielfunktion und Optimum ─────────
  function opt(L0, nn, O, mode, ctx) {
    const B = mkSt(), r = Lp.optimum(L0, nn, O, mode), unit = ctx && ctx.unit ? '\\ \\text{' + ctx.unit + '}' : '';
    if (ctx && ctx.vars) B.p('**Variablen:** ' + ctx.vars);
    B.p('**Bedingungen:** ' + L0.map(I => '$' + Lp.texRaw(I) + '$').join(', ') + (nn ? ', $x\\ge0$, $y\\ge0$' : '') + (ctx && ctx.int ? ', $x,y\\in\\mathbb{N}$' : '') + '.');
    B.p('**Zielfunktion** (' + (mode === 'min' ? 'minimal' : 'maximal') + '):');
    B.e('Z=' + Lp.linTex(O.p, O.q).replace(/(\d{4,})/g, m => B0(+m)));
    if (r.empty) { B.res('Keine zulässigen Punkte – kein Optimum.'); return { title: 'Zielfunktion und Optimum', st: B.st }; }
    if (Math.abs(O.q) > 1e-12) {
      B.p('**Niveaulinien:** Alle Punkte mit gleichem $Z$ liegen auf einer Geraden mit der Steigung $-\\frac{p}{q}=' + q(-O.p / O.q) + '$. Man verschiebt sie parallel, bis sie das Polygon gerade noch berührt.');
      B.e('y=' + q(-O.p / O.q) + 'x+\\frac{Z}{' + q(O.q) + '}');
    }
    B.p('**Eckpunktprinzip:** $Z$ in allen Eckpunkten berechnen und vergleichen.');
    r.V.forEach((v, k) => B.e('Z' + pt(v.x, v.y) + '=' + subst(O.p, O.q, v.x, v.y) + '=' + B0(r.vals[k]) + (r.best.indexOf(v) >= 0 ? '\\quad\\leftarrow' : '')));
    if (r.unbounded) { B.res('Kein ' + (mode === 'min' ? 'Minimum' : 'Maximum') + ': Das Gebiet ist offen, und $Z$ wird beliebig ' + (mode === 'min' ? 'klein' : 'gross') + '.'); return { title: 'Zielfunktion und Optimum', st: B.st }; }
    if (r.edge) B.note('Die Niveaulinien sind parallel zu einer Kante: Das Optimum wird auf der **ganzen Kante** zwischen ' + r.best.map(v => '$' + pt(v.x, v.y) + '$').join(' und ') + ' angenommen.');
    let res = (mode === 'min' ? 'Minimum' : 'Maximum') + ' $Z=' + B0(r.value) + unit + '$ bei $' + r.best.map(v => pt(v.x, v.y)).join(',\\ ') + '$';
    if (ctx && ctx.int) {
      const io = Lp.intOpt(L0, nn, O, mode);
      const intBest = r.best.every(v => Math.abs(v.x - Math.round(v.x)) < 1e-9 && Math.abs(v.y - Math.round(v.y)) < 1e-9);
      if (io && !intBest) { B.p('**Ganzzahligkeit:** Der optimale Eckpunkt ist nicht ganzzahlig. Unter den ganzzahligen Punkten im Polygon ist der beste:'); B.e(io.pts.map(p => pt(p[0], p[1])).join(',\\ ') + ':\\quad Z=' + B0(io.value)); res = (mode === 'min' ? 'Minimum' : 'Maximum') + ' (ganzzahlig) $Z=' + B0(io.value) + unit + '$ bei $' + io.pts.map(p => pt(p[0], p[1])).join(',\\ ') + '$'; }
    }
    if (ctx && ctx.answer) { const b = r.best[0]; B.p('**Antwort:** ' + ctx.answer(b.x, b.y, r.value)); }
    B.res(res);
    return { title: 'Zielfunktion und Optimum', st: B.st };
  }

  function doc(r) {
    const d = DOC(); d.h(r.title);
    r.st.forEach(s => { if (s.k === 'h') d.h(s.s); else if (s.k === 'p') d.p(s.s); else if (s.k === 'e') d.e(s.s); else if (s.k === 'res') d.res(s.s); else if (s.k === 'note') d.note(s.s); });
    return d;
  }
  Lp.st = { ung1, half, poly, opt };
  Lp.doc = doc; Lp.roman = romanOf;
})();
