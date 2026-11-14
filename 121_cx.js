// ═══════════════════════════════════════════════════════════════════
// 121_cx.js — Komplexe Zahlen (Thema aus dem Baukasten 120_kit.js)
//
// Cx: Rechenkern ohne DOM (Betrag, Argument, Produkt, Quotient, Potenzen, Wurzeln, quadratische
// Gleichung, Formelsatz, Rechenwege). Darunter die Bilder der sechs Ansichten und die Anmeldung.
// Winkel liegen im Bereich [0°, 360°) und werden in Grad oder im Bogenmass angezeigt (Schalter «Winkel im Bogenmass», gilt für alle Ansichten).
// ═══════════════════════════════════════════════════════════════════
const Cx = (function () {
  const fmt = (v, d) => { d = d === undefined ? 2 : d; const s = String(parseFloat((+v).toFixed(d))); return s === '-0' ? '0' : s; };
  const rd = (v, d) => +(+v).toFixed(d === undefined ? 2 : d) + 0;
  const eq = (v, d) => (Math.abs(v - rd(v, d)) < 1e-9 ? '=' : '\\approx ') + fmt(v, d);
  const pn = (v, d) => (rd(v, d) < 0 ? '(' + fmt(v, d) + ')' : fmt(v, d));
  const abs = (a, b) => Math.hypot(a, b);
  const arg = (a, b) => { if (!a && !b) return 0; let p = Math.atan2(b, a); if (p < 0) p += 2 * Math.PI; return p >= 2 * Math.PI - 1e-12 ? 0 : p; };
  const deg = p => p * 180 / Math.PI;
  // Winkelanzeige: Grad mit einer Stelle oder Bogenmass (Vielfache von π/12 als Bruchteil von π, sonst drei Stellen)
  let RAD = false;
  const gcd = (x, y) => (y ? gcd(y, x % y) : x);
  function piT(p) {
    const k = p * 12 / Math.PI, r = Math.round(k); if (Math.abs(k - r) > 1e-9) return null; if (!r) return '0';
    const g = gcd(Math.abs(r), 12), n = Math.abs(r) / g, d = 12 / g, num = (n === 1 ? '' : n) + '\\pi';
    return (r < 0 ? '-' : '') + (d === 1 ? num : '\\frac{' + num + '}{' + d + '}');
  }
  const dg = (p, d) => (RAD ? (piT(p) || fmt(p, 3)) : fmt(deg(p), d === undefined ? 1 : d) + '^\\circ');
  const angExact = p => (RAD ? piT(p) !== null || Math.abs(p - rd(p, 3)) < 1e-9 : Math.abs(deg(p) - rd(deg(p), 1)) < 1e-9);
  const eqd = p => (angExact(p) ? '=' : '\\approx ') + dg(p);
  const TAU = 2 * Math.PI;
  const mul = (z, w) => [z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0]];
  const div = (z, w) => { const n = w[0] * w[0] + w[1] * w[1]; return n ? [(z[0] * w[0] + z[1] * w[1]) / n, (z[1] * w[0] - z[0] * w[1]) / n] : null; };
  const pol = (r, p) => [r * Math.cos(p), r * Math.sin(p)];
  const pow = (z, n) => { let r = [1, 0]; for (let k = 0; k < n; k++) r = mul(r, z); return r; };
  const roots = (w, n) => { const r = Math.pow(abs(w[0], w[1]), 1 / n), p = arg(w[0], w[1]); return Array.from({ length: n }, (_, k) => pol(r, (p + 2 * Math.PI * k) / n)); };
  function quad(a, b, c) {
    const D = b * b - 4 * a * c, xs = -b / (2 * a), ys = c - b * b / (4 * a);
    if (D >= 0) { const s = Math.sqrt(D) / (2 * Math.abs(a)); return { D, xs, ys, z: [[xs - s, 0], [xs + s, 0]] }; }
    const s = Math.sqrt(-D) / (2 * Math.abs(a)); return { D, xs, ys, z: [[xs, s], [xs, -s]] };
  }
  // Formelsatz: a + bi (gerundet auf d Stellen)
  function tex(a, b, d) {
    const x = rd(a, d), y = rd(b, d), im = (Math.abs(y) === 1 ? '' : fmt(Math.abs(y), d)) + 'i';
    if (y === 0) return fmt(x, d); if (x === 0) return (y < 0 ? '-' : '') + im;
    return fmt(x, d) + (y < 0 ? '-' : '+') + im;
  }
  const par = (a, b, d) => { const x = rd(a, d), y = rd(b, d); return (x !== 0 && y !== 0) || x < 0 || (x === 0 && y < 0) ? '(' + tex(a, b, d) + ')' : tex(a, b, d); };
  const polT = (a, b) => fmt(abs(a, b)) + '\\,(\\cos' + dg(arg(a, b)) + '+i\\sin' + dg(arg(a, b)) + ')';
  const exact = (a, b) => Math.abs(a - rd(a)) < 1e-9 && Math.abs(b - rd(b)) < 1e-9;
  const eqz = (a, b) => (exact(a, b) ? '=' : '\\approx ') + tex(a, b);

  // ── Rechenwege ──
  const mk = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  function docPlane(P) {
    const B = mk(), a = P.a, b = P.b, r = abs(a, b), ph = arg(a, b), z = tex(a, b);
    B.p('**Normalform:** $z=a+b\\,i$ mit dem Realteil $a$ und dem Imaginärteil $b$; für die imaginäre Einheit gilt $i^2=-1$.');
    B.e('z=' + z + ':\\qquad \\text{Re}(z)=' + fmt(a) + ',\\quad \\text{Im}(z)=' + fmt(b), 'b');
    B.p('**Betrag:** Der Zeiger ist die Hypotenuse eines rechtwinkligen Dreiecks mit den Katheten $|a|$ und $|b|$ (Satz des Pythagoras).');
    B.e('|z|=\\sqrt{a^2+b^2}=\\sqrt{' + pn(a) + '^2+' + pn(b) + '^2}=\\sqrt{' + fmt(a * a + b * b, 4) + '}' + (Math.abs(r - rd(r)) < 1e-9 ? '=' + fmt(r) : '\\approx ' + fmt(r)), 'b');
    B.p('**Argument:** Der Winkel $\\varphi$ wird von der positiven reellen Achse aus im Gegenuhrzeigersinn gemessen. Der Taschenrechner liefert aus $\\tan\\varphi=\\frac{b}{a}$ nur Winkel zwischen $' + dg(-Math.PI / 2) + '$ und $' + dg(Math.PI / 2) + '$; der Quadrant von $z$ entscheidet, was dazukommt.');
    if (!a && !b) B.note('Für $z=0$ ist kein Winkel festgelegt.');
    else if (!a) B.e('a=0:\\quad z\\text{ liegt auf der imaginären Achse}\\ \\Rightarrow\\ \\varphi=' + dg(ph), 'v');
    else {
      const t = Math.atan(b / a), add = a < 0 ? Math.PI : (b < 0 ? TAU : 0), q = a > 0 ? (b >= 0 ? '1' : '4') : (b >= 0 ? '2' : '3');
      B.e('\\arctan\\frac{' + fmt(b) + '}{' + fmt(a) + '}' + eqd(t), 'v');
      B.e(add ? '\\text{' + q + '. Quadrant:}\\quad\\varphi' + eqd(t) + '+' + dg(add) + (angExact(ph) ? '=' : '\\approx ') + dg(ph) : '\\text{' + (b ? '1. Quadrant' : 'positive reelle Achse') + ':}\\quad\\varphi' + eqd(ph), 'v');
    }
    B.p('**Polarform:** Mit dem Betrag $r=|z|$ und dem Winkel $\\varphi$ gilt $a=r\\cos\\varphi$ und $b=r\\sin\\varphi$.');
    B.e('z=r\\,(\\cos\\varphi+i\\sin\\varphi)\\approx ' + polT(a, b));
    B.p('**Konjugierte Zahl:** $\\overline{z}$ hat denselben Realteil und den entgegengesetzten Imaginärteil. Das Produkt $z\\cdot\\overline{z}$ ist reell.');
    B.e('\\overline{z}=' + tex(a, -b) + ',\\qquad z\\cdot\\overline{z}=a^2+b^2=' + fmt(a * a + b * b, 4) + '=|z|^2', 'r');
    B.res('$z=' + z + '$ hat den Betrag $' + fmt(r) + '$ und das Argument $' + dg(ph) + '$');
    return { title: 'Zahl in der Gauss-Ebene', st: B.st };
  }
  function docAdd(P) {
    const B = mk(), m = P.op === '-', s = m ? -1 : 1, x = P.a1 + s * P.a2, y = P.b1 + s * P.b2, o = m ? '-' : '+';
    B.p('**Getrennt rechnen:** Realteile und Imaginärteile werden je für sich ' + (m ? 'subtrahiert' : 'addiert') + '.');
    B.e('(' + tex(P.a1, P.b1) + ')' + o + '(' + tex(P.a2, P.b2) + ')=(' + fmt(P.a1) + o + pn(P.a2) + ')+(' + fmt(P.b1) + o + pn(P.b2) + ')\\,i=' + tex(x, y), 'r');
    if (m) {
      B.p('**Im Bild:** Subtrahieren heisst, die Gegenzahl $-z_2$ zu addieren. Der Zeiger $-z_2$ wird an die Spitze von $z_1$ gehängt.');
      B.p('**Abstand:** Die Differenz ist der Zeiger von $z_2$ nach $z_1$; ihr Betrag ist der Abstand der beiden Punkte.');
      B.e('|z_1-z_2|=\\sqrt{' + pn(x) + '^2+' + pn(y) + '^2}' + eq(abs(x, y)), 'r');
    } else {
      B.p('**Im Bild:** Der Zeiger $z_2$ wird an die Spitze von $z_1$ gehängt. Die Summe ist die Diagonale des Parallelogramms mit den Seiten $z_1$ und $z_2$.');
      B.note('Die Beträge darf man nicht einfach addieren: $|z_1+z_2|\\le|z_1|+|z_2|$ (Dreiecksungleichung). Hier: $' + fmt(abs(x, y)) + '\\le' + fmt(abs(P.a1, P.b1)) + '+' + fmt(abs(P.a2, P.b2)) + '$.');
    }
    B.res('$z_1' + o + 'z_2=' + tex(x, y) + '$');
    return { title: m ? 'Subtrahieren' : 'Addieren', st: B.st };
  }
  function docMul(P) {
    const B = mk(), a = P.a1, b = P.b1, c = P.a2, d = P.b2, r1 = abs(a, b), r2 = abs(c, d), p1 = arg(a, b), p2 = arg(c, d);
    if (P.op === '/') {
      const q = div([a, b], [c, d]);
      if (!q) { B.note('Durch $0$ kann man nicht dividieren. Wähle $z_2\\neq0$.'); return { title: 'Dividieren', st: B.st }; }
      const n = mul([a, b], [c, -d]), nn = c * c + d * d;
      B.p('**Mit der konjugierten Zahl erweitern:** So wird der Nenner reell, denn $z_2\\cdot\\overline{z_2}=|z_2|^2$.');
      B.e('\\frac{' + tex(a, b) + '}{' + tex(c, d) + '}=\\frac{' + par(a, b) + '\\cdot ' + par(c, -d) + '}{' + par(c, d) + '\\cdot ' + par(c, -d) + '}=\\frac{' + tex(n[0], n[1], 4) + '}{' + fmt(nn, 4) + '}' + eqz(q[0], q[1]), 'r');
      B.p('**Polarform:** Beträge dividieren, Winkel subtrahieren.');
      B.e('\\frac{|z_1|}{|z_2|}\\approx\\frac{' + fmt(r1) + '}{' + fmt(r2) + '}\\approx ' + fmt(r1 / r2), 'r');
      if (r1 > 0) { B.e('\\varphi_1-\\varphi_2\\approx ' + dg(p1) + '-' + dg(p2) + '=' + dg(p1 - p2), 'v'); if (p1 < p2 - 1e-12) B.note('Negative Winkel werden um $' + dg(TAU) + '$ vergrössert: $' + dg(p1 - p2) + '+' + dg(TAU) + '=' + dg(arg(q[0], q[1])) + '$.'); }
      B.p('**Im Bild:** Dividieren durch $z_2$ dreht den Zeiger $z_1$ um $\\varphi_2$ zurück und staucht ihn mit dem Faktor $\\frac{1}{|z_2|}$. Das Dreieck $0,\\,z_2,\\,z_1$ ist ähnlich zum Dreieck $0,\\,1,\\,\\frac{z_1}{z_2}$.');
      B.res('$z_1:z_2' + eqz(q[0], q[1]) + '$');
      return { title: 'Dividieren', st: B.st };
    }
    const z = mul([a, b], [c, d]);
    B.p('**Ausmultiplizieren:** Jeder Summand wird mit jedem multipliziert, dann setzt man $i^2=-1$ ein.');
    B.e(par(a, b) + '\\cdot ' + par(c, d) + '=' + pn(a) + '\\cdot ' + pn(c) + '+' + pn(a) + '\\cdot ' + pn(d) + '\\,i+' + pn(b) + '\\cdot ' + pn(c) + '\\,i+' + pn(b) + '\\cdot ' + pn(d) + '\\,i^2');
    B.e('=(' + fmt(a * c, 4) + '-' + pn(b * d, 4) + ')+(' + fmt(a * d, 4) + '+' + pn(b * c, 4) + ')\\,i=' + tex(z[0], z[1], 4), 'r');
    B.p('**Polarform:** Beträge multiplizieren, Winkel addieren.');
    B.e('|z_1|\\cdot|z_2|\\approx ' + fmt(r1) + '\\cdot ' + fmt(r2) + '\\approx ' + fmt(r1 * r2), 'r');
    if (r1 > 0 && r2 > 0) { B.e('\\varphi_1+\\varphi_2\\approx ' + dg(p1) + '+' + dg(p2) + '=' + dg(p1 + p2), 'v'); if (p1 + p2 >= TAU - 1e-9) B.note('Winkel ab $' + dg(TAU) + '$ werden um $' + dg(TAU) + '$ verkleinert: $' + dg(p1 + p2) + '-' + dg(TAU) + '=' + dg(arg(z[0], z[1])) + '$.'); }
    B.p('**Im Bild:** Multiplizieren mit $z_2$ dreht den Zeiger $z_1$ um $\\varphi_2$ und streckt ihn mit dem Faktor $|z_2|$ (Drehstreckung). Das Dreieck $0,\\,1,\\,z_2$ ist ähnlich zum Dreieck $0,\\,z_1,\\,z_1z_2$.');
    B.res('$z_1\\cdot z_2=' + tex(z[0], z[1], 4) + '$');
    return { title: 'Multiplizieren', st: B.st };
  }
  function docPow(P) {
    const B = mk(), a = P.a, b = P.b, n = P.n, r = abs(a, b), ph = arg(a, b), z = pow([a, b], n);
    B.p('**Formel von Moivre:** Beim Potenzieren wird der Betrag potenziert und der Winkel vervielfacht.');
    B.e('z^n=r^n\\,(\\cos(n\\varphi)+i\\sin(n\\varphi))');
    B.e('z=' + tex(a, b) + ':\\qquad r' + eq(r) + ',\\quad\\varphi' + eqd(ph), 'b');
    B.e('r^{' + n + '}\\approx ' + fmt(r) + '^{' + n + '}\\approx ' + fmt(Math.pow(r, n)) + ',\\qquad ' + n + '\\cdot\\varphi\\approx ' + dg(n * ph), 'r');
    B.e('z^{' + n + '}' + eqz(z[0], z[1]), 'r');
    let w = [a, b]; const L = [];
    if (n > 2) B.p('**Schritt für Schritt:** Jede Multiplikation mit $z$ dreht um $\\varphi$ weiter und streckt mit dem Faktor $r$.');
    for (let k = 2; k <= Math.min(n - 1, 7); k++) { w = mul(w, [a, b]); L.push('z^{' + k + '}' + eqz(w[0], w[1])); }
    for (let i = 0; i < L.length; i += 2) B.e(L.slice(i, i + 2).join(',\\qquad '));
    B.note(Math.abs(r - 1) < 1e-9 ? 'Wegen $|z|=1$ bleiben alle Potenzen auf dem Einheitskreis.' : r > 1 ? 'Wegen $|z|>1$ wachsen die Beträge: Die Potenzen laufen auf einer Spirale nach aussen.' : 'Wegen $|z|<1$ schrumpfen die Beträge: Die Potenzen laufen auf einer Spirale nach innen.');
    B.res('$z^{' + n + '}' + eqz(z[0], z[1]) + '$');
    return { title: 'Potenzen', st: B.st };
  }
  function docRoot(P) {
    const B = mk(), n = P.n, r = abs(P.a, P.b), ph = arg(P.a, P.b), R = roots([P.a, P.b], n), rho = Math.pow(r, 1 / n);
    B.p('**Ansatz in Polarform:** Aus $z^n=w$ folgt für die Beträge $|z|^n=|w|$ und für die Winkel $n\\cdot\\varphi_z=\\varphi_w+k\\cdot ' + dg(TAU) + '$.');
    B.e('w=' + tex(P.a, P.b) + ':\\qquad |w|' + eq(r) + ',\\quad\\varphi_w' + eqd(ph), 'v');
    if (!r) { B.note('Für $w=0$ ist $z=0$ die einzige Lösung.'); B.res('$z=0$'); return { title: 'Wurzeln', st: B.st }; }
    B.e('|z|=\\sqrt[' + n + ']{' + fmt(r) + '}' + eq(rho), 'b');
    B.e('\\varphi_k=\\frac{' + dg(ph) + '+k\\cdot ' + dg(TAU) + '}{' + n + '}' + eqd(ph / n) + '+k\\cdot ' + dg(TAU / n) + '\\qquad(k=0,\\dots,' + (n - 1) + ')', 'b');
    const L = R.map((z, k) => 'z_{' + k + '}' + eqz(z[0], z[1]));
    for (let i = 0; i < L.length; i += 2) B.e(L.slice(i, i + 2).join(',\\qquad '), i === 0 ? 'r' : undefined);
    B.p('**Im Bild:** Die Lösungen liegen auf einem Kreis um $0$ und teilen ihn in $n$ gleiche Teile. Benachbarte Lösungen schliessen den Winkel $\\frac{' + dg(TAU) + '}{n}$ ein.');
    if (Math.abs(P.a - 1) < 1e-9 && Math.abs(P.b) < 1e-9) B.note('Für $w=1$ heissen die Lösungen $n$-te Einheitswurzeln. Ihre Summe ist $0$.');
    B.res('Die Gleichung $z^{' + n + '}=' + tex(P.a, P.b) + '$ hat ' + n + ' Lösungen mit dem Betrag $' + fmt(rho) + '$');
    return { title: 'Wurzeln', st: B.st };
  }
  function docQuad(P) {
    const B = mk(), a = P.a, b = P.b, c = P.c, Q = quad(a, b, c), D = Q.D, z = Q.z;
    const term = (k, s) => (rd(k) === 0 ? '' : (rd(k) < 0 ? '-' : '+') + (Math.abs(rd(k)) === 1 && s ? '' : fmt(Math.abs(k))) + s);
    const eqn = ((Math.abs(rd(a)) === 1 ? (a < 0 ? '-' : '') : fmt(a)) + 'z^2' + term(b, 'z') + term(c, '')) + '=0';
    B.e(eqn);
    B.p('**Diskriminante:** Sie entscheidet über die Art der Lösungen.');
    B.e('D=b^2-4ac=' + pn(b) + '^2-4\\cdot ' + pn(a) + '\\cdot ' + pn(c) + '=' + fmt(D, 4), 'b');
    if (D < 0) {
      const s = Math.sqrt(-D);
      B.p('**Wurzel aus einer negativen Zahl:** Wegen $i^2=-1$ ist $\\sqrt{D}=i\\cdot\\sqrt{|D|}$.');
      B.e('\\sqrt{' + fmt(D, 4) + '}=\\sqrt{' + fmt(-D, 4) + '}\\cdot i' + eq(s) + '\\,i', 'v');
      B.e('z_{1,2}=\\frac{-b\\pm\\sqrt{D}}{2a}=\\frac{' + fmt(-b) + '\\pm ' + fmt(s) + '\\,i}{' + fmt(2 * a) + '}' + (exact(z[0][0], z[0][1]) ? '=' : '\\approx ') + fmt(Q.xs) + '\\pm ' + (Math.abs(rd(z[0][1])) === 1 ? '' : fmt(Math.abs(z[0][1]))) + 'i', 'r');
      B.p('**Probe mit dem Satz von Vieta:** Summe und Produkt der Lösungen sind reell.');
      B.e('z_1+z_2' + eq(2 * Q.xs) + '=-\\frac{b}{a},\\qquad z_1\\cdot z_2' + eq(Q.xs * Q.xs + z[0][1] * z[0][1]) + '=\\frac{c}{a}');
      B.p('**Im Bild:** Die Parabel schneidet die x-Achse nicht. Die beiden Lösungen sind konjugiert zueinander; ihr Realteil ist die Stelle des Scheitels.');
      B.res('Zwei konjugiert komplexe Lösungen: $z_{1,2}' + (exact(z[0][0], z[0][1]) ? '=' : '\\approx ') + fmt(Q.xs) + '\\pm ' + (Math.abs(rd(z[0][1])) === 1 ? '' : fmt(Math.abs(z[0][1]))) + 'i$');
    } else if (D === 0) {
      B.e('z=\\frac{-b}{2a}=\\frac{' + fmt(-b) + '}{' + fmt(2 * a) + '}' + eq(Q.xs), 'r');
      B.p('**Im Bild:** Die Parabel berührt die x-Achse im Scheitel.');
      B.res('Eine doppelte reelle Lösung: $z' + eq(Q.xs) + '$');
    } else {
      B.e('z_{1,2}=\\frac{-b\\pm\\sqrt{D}}{2a}=\\frac{' + fmt(-b) + '\\pm ' + fmt(Math.sqrt(D)) + '}{' + fmt(2 * a) + '}', 'r');
      B.p('**Im Bild:** Die Parabel schneidet die x-Achse zweimal; beide Lösungen liegen auf der reellen Achse der Gauss-Ebene.');
      B.res('Zwei reelle Lösungen: $z_1' + eq(z[0][0]) + '$ und $z_2' + eq(z[1][0]) + '$');
    }
    return { title: 'Quadratische Gleichung', st: B.st };
  }
  const doc = (v, P) => { RAD = !!P.rad; return ({ plane: docPlane, add: docAdd, mul: docMul, pow: docPow, root: docRoot, quad: docQuad })[v](P); };
  return { rad: on => { RAD = !!on; }, eqd, piT, fmt, rd, eq, abs, arg, deg, dg, mul, div, pol, pow, roots, quad, tex, par, eqz, doc };
})();

// ── Bilder ──
function cxFrame(S, W, H, C, half, o) {
  const fs = C.fs;
  return kitFrameSq(S, { x: fs * 0.4, y: fs * 0.3, w: W - fs * 0.8, h: H - fs * 0.6 }, C, 0, 0, half, Object.assign({ xlab: '\\text{Re}', ylab: '\\text{Im}' }, o));
}
// Zeiger von 0 nach z mit Beschriftung ausserhalb der Spitze
function cxPtr(S, m, C, z, col, lab, o) {
  o = o || {}; const fs = C.fs, r = Math.hypot(z[0], z[1]) || 1;
  kitArrow(S, m, 0, 0, z[0], z[1], { col, lw: o.lw || 2.6, dash: o.dash, a: o.a, hl: o.hl });
  if (lab && difInside(m, m.X(z[0]), m.Y(z[1]), 2)) difLabel(S, m, m.X(z[0]), m.Y(z[1]), lab, C, { dx: z[0] / r * fs * 1.5 + (Math.abs(z[0]) < 1e-9 ? fs * 1.2 : 0), dy: -z[1] / r * fs * 1.25 - (Math.abs(z[1]) < 1e-9 ? fs * 0.95 : 0), hl: o.lhl });
}
function cxCircle(S, m, rad, o) { const P = []; for (let i = 0; i <= 96; i++) P.push([rad * Math.cos(i * Math.PI / 48), rad * Math.sin(i * Math.PI / 48)]); difPath(S, m, P, o); }
function cxScenePlane(S, W, H, C) {
  const P = C.P, fs = C.fs, a = P.a, b = P.b, r = Cx.abs(a, b), ph = Cx.arg(a, b); Cx.rad(P.rad);
  const m = cxFrame(S, W, H, C, 5.5, { title: '\\col{b}{z=' + Cx.tex(a, b) + '}', info: '|z|' + Cx.eq(r) + ',\\quad\\col{v}{\\varphi' + Cx.eqd(ph) + '}' });
  difSeg(S, m, 0, b, a, b, { col: 'M', lw: 1, dash: [4, 4] });
  if (a) difSeg(S, m, 0, 0, a, 0, { col: ST_G, lw: 4.5, hl: 're' });
  if (b) difSeg(S, m, a, 0, a, b, { col: ST_O, lw: 4.5, hl: 'im' });
  if (a) difLabel(S, m, m.X(a / 2), m.Y(0) + (b >= 0 ? 1 : -1) * fs * 1.05, '\\col{g}{a=' + Cx.fmt(a) + '}', C, {});
  if (b) difLabel(S, m, m.X(a) + (a >= 0 ? 1 : -1) * fs * 2.3, m.Y(b / 2), '\\col{o}{b=' + Cx.fmt(b) + '}', C, {});
  if (r > 0 && ph > 0) { kitArc(S, m, 0, 0, 0, ph, fs * 2.1, { col: ST_V, hl: 'arg' }); difLabel(S, m, m.X(0) + fs * 3.1 * Math.cos(ph / 2), m.Y(0) - fs * 3.1 * Math.sin(ph / 2), '\\col{v}{\\varphi}', C, {}); }
  if (P.neg && r > 0) { S.circ(m.X(-a), m.Y(-b), 4.5, { fill: 'M', stroke: 'M' }); difLabel(S, m, m.X(-a), m.Y(-b), '-z', C, { dx: -a / r * fs * 1.4, dy: b / r * fs * 1.2 + (b ? 0 : fs), col: 'M' }); difSeg(S, m, 0, 0, -a, -b, { col: 'M', lw: 1.2, dash: [3, 4] }); }
  if (P.conj) {
    if (b) difSeg(S, m, a, b, a, -b, { col: ST_R, lw: 1.2, dash: [3, 4] });
    const q = [m.X(a), m.Y(-b)]; if (difInside(m, q[0], q[1], 2)) { S.circ(q[0], q[1], 5, { fill: ST_R, stroke: 'W', lw: 1.5 }); shlC(S, 'conj', q[0], q[1], 13); difLabel(S, m, q[0], q[1], '\\col{r}{\\overline{z}=' + Cx.tex(a, -b) + '}', C, { dx: (a >= 0 ? 1 : -1) * fs * 2.6, dy: (b >= 0 ? 1 : -1) * fs * 1.2 }); }
  }
  if (r > 0) kitArrow(S, m, 0, 0, a, b, { col: ST_B, hl: 'abs' });
  kitDragPt(S, m, C, 'z', a, b, { col: ST_B, hl: 'z', step: 0.5 }, (x, y) => { P.a = kitClamp(x, -20, 20); P.b = kitClamp(y, -20, 20); });
  difLabel(S, m, m.X(a), m.Y(b), '\\col{b}{z}', C, { dx: (a >= 0 ? 1 : -1) * fs * 1.1, dy: (b >= 0 ? -1 : 1) * fs * 1.1 });
}
function cxSceneAdd(S, W, H, C) {
  const P = C.P, s = P.op === '-' ? -1 : 1, z1 = [P.a1, P.b1], z2 = [P.a2, P.b2], w = [s * P.a2, s * P.b2], z = [z1[0] + w[0], z1[1] + w[1]];
  const m = cxFrame(S, W, H, C, 5, { title: '\\col{b}{z_1=' + Cx.tex(z1[0], z1[1]) + '},\\quad\\col{g}{z_2=' + Cx.tex(z2[0], z2[1]) + '}', info: '\\col{r}{z_1' + (s < 0 ? '-' : '+') + 'z_2=' + Cx.tex(z[0], z[1]) + '}' });
  const pp = [[m.X(0), m.Y(0)], [m.X(z1[0]), m.Y(z1[1])], [m.X(z[0]), m.Y(z[1])], [m.X(w[0]), m.Y(w[1])]];
  S.poly(pp, { col: 'M', fill: ST_R, a: 0.07, lw: 0.5, close: true }); shl(S, 'par', pp, true);
  kitArrow(S, m, z1[0], z1[1], z[0], z[1], { col: ST_G, lw: 1.8, dash: [6, 4], a: 0.85 });
  kitArrow(S, m, w[0], w[1], z[0], z[1], { col: ST_B, lw: 1.8, dash: [6, 4], a: 0.85 });
  if (s < 0) { cxPtr(S, m, C, w, ST_G, '\\col{g}{-z_2}', { lw: 1.8, dash: [2, 4] }); kitArrow(S, m, z2[0], z2[1], z1[0], z1[1], { col: ST_R, lw: 1.6, dash: [6, 4], a: 0.7 }); }
  cxPtr(S, m, C, z1, ST_B, '\\col{b}{z_1}'); cxPtr(S, m, C, z2, ST_G, '\\col{g}{z_2}');
  cxPtr(S, m, C, z, ST_R, '\\col{r}{z_1' + (s < 0 ? '-' : '+') + 'z_2}', { lw: 3, hl: 'res' });
  kitDragPt(S, m, C, 'z1', z1[0], z1[1], { col: ST_B, hl: 'z1', step: 0.5 }, (x, y) => { P.a1 = kitClamp(x, -20, 20); P.b1 = kitClamp(y, -20, 20); });
  kitDragPt(S, m, C, 'z2', z2[0], z2[1], { col: ST_G, hl: 'z2', step: 0.5 }, (x, y) => { P.a2 = kitClamp(x, -20, 20); P.b2 = kitClamp(y, -20, 20); });
}
function cxSceneMul(S, W, H, C) {
  const P = C.P, fs = C.fs, dv = P.op === '/', z1 = [P.a1, P.b1], z2 = [P.a2, P.b2], z = dv ? Cx.div(z1, z2) : Cx.mul(z1, z2);
  const r1 = Cx.abs(z1[0], z1[1]), r2 = Cx.abs(z2[0], z2[1]), p1 = Cx.arg(z1[0], z1[1]), p2 = Cx.arg(z2[0], z2[1]);
  const m = cxFrame(S, W, H, C, 4.5, { title: '\\col{b}{z_1=' + Cx.tex(z1[0], z1[1]) + '},\\quad\\col{g}{z_2=' + Cx.tex(z2[0], z2[1]) + '}', info: z ? '\\col{r}{z_1' + (dv ? ':' : '\\cdot ') + 'z_2' + Cx.eqz(z[0], z[1]) + '}' : '\\col{r}{z_2=0:\\ \\text{nicht definiert}}' });
  const tri = (A, B2, col) => { const q = [[m.X(0), m.Y(0)], [m.X(A[0]), m.Y(A[1])], [m.X(B2[0]), m.Y(B2[1])]]; S.poly(q, { col, fill: col, a: 0.13, lw: 1, close: true }); shl(S, 'tri', q, true); };
  if (P.tri && z && r1 > 0 && r2 > 0) { if (dv) { tri(z2, z1, ST_G); tri([1, 0], z, ST_R); } else { tri([1, 0], z2, ST_G); tri(z1, z, ST_R); } S.circ(m.X(1), m.Y(0), 3.5, { fill: 'M', stroke: 'M' }); difLabel(S, m, m.X(1), m.Y(0) + fs * 0.95, '1', C, { col: 'M' }); }
  if (r1 > 0 && p1 > 0) kitArc(S, m, 0, 0, 0, p1, fs * 1.9, { col: ST_B });
  if (r2 > 0 && p2 > 0) kitArc(S, m, 0, 0, 0, p2, fs * 2.6, { col: ST_G });
  if (z && r1 > 0 && r2 > 0) {
    const e = dv ? -1 : 1, t = C.t === null ? 1 : C.t, path = [];
    for (let i = 0; i <= 60; i++) { const u = t * i / 60; path.push(Cx.pol(r1 * Math.pow(r2, e * u), p1 + e * p2 * u)); }
    difPath(S, m, path, { col: ST_R, lw: 1.4, dash: [3, 4] });
    kitArc(S, m, 0, 0, p1, p1 + e * p2 * t, fs * 3.5, { col: ST_G, lw: 2.4, hl: 'arg' }); if (p1 > 0) kitArc(S, m, 0, 0, 0, p1, fs * 3.5, { col: ST_B, lw: 2.4, hl: 'arg' });
    if (C.t !== null) cxPtr(S, m, C, path[path.length - 1], ST_R, null, { lw: 3 });
  }
  cxPtr(S, m, C, z1, ST_B, '\\col{b}{z_1}'); cxPtr(S, m, C, z2, ST_G, '\\col{g}{z_2}');
  if (z && C.t === null) cxPtr(S, m, C, z, ST_R, '\\col{r}{z_1' + (dv ? ':' : '\\cdot ') + 'z_2}', { lw: 3, hl: 'res' });
  kitDragPt(S, m, C, 'z1', z1[0], z1[1], { col: ST_B, hl: 'z1', step: 0.5 }, (x, y) => { P.a1 = kitClamp(x, -20, 20); P.b1 = kitClamp(y, -20, 20); });
  kitDragPt(S, m, C, 'z2', z2[0], z2[1], { col: ST_G, hl: 'z2', step: 0.5 }, (x, y) => { P.a2 = kitClamp(x, -20, 20); P.b2 = kitClamp(y, -20, 20); });
}
function cxScenePow(S, W, H, C) {
  const P = C.P, fs = C.fs, n = P.n, z = [P.a, P.b], r = Cx.abs(P.a, P.b), ph = Cx.arg(P.a, P.b), Z = [[1, 0]];
  for (let k = 1; k <= n; k++) Z.push(Cx.mul(Z[k - 1], z));
  const m = cxFrame(S, W, H, C, 4.6, { title: '\\col{b}{z=' + Cx.tex(P.a, P.b) + '}', info: '\\col{r}{z^{' + n + '}' + Cx.eqz(Z[n][0], Z[n][1]) + '}' });
  cxCircle(S, m, 1, { col: 'M', lw: 1.2, dash: [5, 4], hl: 'unit' });
  const fin = q => isFinite(m.X(q[0])) && isFinite(m.Y(q[1])) && Math.abs(q[0]) < 1e6 && Math.abs(q[1]) < 1e6;
  for (let k = 0; k < n; k++) if (fin(Z[k]) && fin(Z[k + 1])) { const q = [[m.X(0), m.Y(0)], [m.X(Z[k][0]), m.Y(Z[k][1])], [m.X(Z[k + 1][0]), m.Y(Z[k + 1][1])]]; S.poly(q, { col: k % 2 ? ST_R : ST_B, fill: k % 2 ? ST_R : ST_B, a: 0.1, lw: 0.8, close: true }); }
  if (r > 0 && ph > 0) { kitArc(S, m, 0, 0, 0, ph, fs * 2.0, { col: ST_V, hl: 'arg' }); difLabel(S, m, m.X(0) + fs * 3.0 * Math.cos(ph / 2), m.Y(0) - fs * 3.0 * Math.sin(ph / 2), '\\col{v}{\\varphi}', C, {}); }
  S.circ(m.X(1), m.Y(0), 3.5, { fill: 'M', stroke: 'M' }); difLabel(S, m, m.X(1), m.Y(0) + fs * 0.95, '1', C, { col: 'M' });
  for (let k = 2; k <= n; k++) {
    const q = Z[k], px = m.X(q[0]), py = m.Y(q[1]); if (!fin(q) || !difInside(m, px, py, 2)) continue;
    S.circ(px, py, k === n ? 5.5 : 4.2, { fill: ST_R, stroke: 'W', lw: 1.5 }); shlC(S, 'pw', px, py, 12);
    const rr = Math.hypot(q[0], q[1]) || 1; difLabel(S, m, px, py, '\\col{r}{z^{' + k + '}}', C, { dx: q[0] / rr * fs * 1.3, dy: -q[1] / rr * fs * 1.2 - (Math.abs(q[1]) < 1e-9 ? fs * 0.9 : 0) });
  }
  if (r > 0) cxPtr(S, m, C, z, ST_B, '\\col{b}{z}');
  kitDragPt(S, m, C, 'z', P.a, P.b, { col: ST_B, hl: 'z', step: 0.1 }, (x, y) => { P.a = kitClamp(x, -5, 5); P.b = kitClamp(y, -5, 5); });
}
function cxSceneRoot(S, W, H, C) {
  const P = C.P, fs = C.fs, n = P.n, R = Cx.roots([P.a, P.b], n), rho = Math.pow(Cx.abs(P.a, P.b), 1 / n);
  const m = cxFrame(S, W, H, C, 3.3, { title: '\\col{r}{z^{' + n + '}}=\\col{v}{' + Cx.tex(P.a, P.b) + '}', info: '\\col{b}{|z|=\\sqrt[' + n + ']{' + Cx.fmt(Cx.abs(P.a, P.b)) + '}' + Cx.eq(rho) + '}' });
  cxCircle(S, m, 1, { col: 'M', lw: 1, dash: [2, 4] });
  if (rho > 0) {
    cxCircle(S, m, rho, { col: ST_B, lw: 1.4, dash: [5, 4], hl: 'circ' });
    const pg = R.map(z => [m.X(z[0]), m.Y(z[1])]); if (n > 2) { S.poly(pg, { col: ST_R, fill: ST_R, a: 0.1, lw: 1.2, close: true }); shl(S, 'poly', pg, true); } else difSeg(S, m, R[0][0], R[0][1], R[1][0], R[1][1], { col: ST_R, lw: 1.2, hl: 'poly' });
    R.forEach(z => difSeg(S, m, 0, 0, z[0], z[1], { col: ST_R, lw: 1, a: 0.6 }));
    const p0 = Cx.arg(R[0][0], R[0][1]); if (p0 > 0.02) kitArc(S, m, 0, 0, 0, p0, fs * 2.0, { col: ST_V });
  }
  const wx = m.X(P.a), wy = m.Y(P.b);
  if (difInside(m, wx, wy, 2)) difLabel(S, m, wx, wy, '\\col{v}{w}', C, { dx: fs * 0.9, dy: -fs * 0.9 });
  kitDragPt(S, m, C, 'w', P.a, P.b, { col: ST_V, step: 0.5, r: 5 }, (x, y) => { P.a = x; P.b = y; });
  const setRoot = (x, y) => { const w = Cx.pow([x, y], n); P.a = kitClamp(kitR(w[0], 4), -1000, 1000); P.b = kitClamp(kitR(w[1], 4), -1000, 1000); };
  R.forEach((z, k) => {
    kitDragPt(S, m, C, 'root', z[0], z[1], { col: ST_R, hl: k ? 'roots' : 'z0', step: 0.25 }, rho > 0 || !k ? setRoot : null);
    if (rho > 0 && difInside(m, m.X(z[0]), m.Y(z[1]), 2)) difLabel(S, m, m.X(z[0]), m.Y(z[1]), '\\col{r}{z_{' + k + '}}', C, { dx: z[0] / rho * fs * 1.3, dy: -z[1] / rho * fs * 1.2 - (Math.abs(z[1]) < 1e-9 ? fs * 0.9 : 0) });
  });
}
function cxSceneQuad(S, W, H, C) {
  const P = C.P, fs = C.fs, a = P.a, b = P.b, c = P.c, Q = Cx.quad(a, b, c), f = x => a * x * x + b * x + c, wide = W >= 860;
  const r1 = wide ? { x: fs * 0.4, y: fs * 0.3, w: W * 0.5 - fs * 0.6, h: H - fs * 0.6 } : { x: fs * 0.4, y: fs * 0.3, w: W - fs * 0.8, h: H * 0.5 - fs * 0.5 };
  const r2 = wide ? { x: W * 0.5 + fs * 0.2, y: fs * 0.3, w: W * 0.5 - fs * 0.6, h: H - fs * 0.6 } : { x: fs * 0.4, y: H * 0.5 + fs * 0.2, w: W - fs * 0.8, h: H * 0.5 - fs * 0.5 };
  const win = { x0: Math.floor(Q.xs - 4.5), x1: Math.ceil(Q.xs + 4.5), y0: a > 0 ? Math.floor(Math.min(-1.5, Q.ys - 1.5)) : Math.floor(Math.min(Q.ys, 0) - 9), y1: a > 0 ? Math.ceil(Math.max(Q.ys, 0) + 9) : Math.ceil(Math.max(1.5, Q.ys + 1.5)) };
  const tm = (k, s) => (Cx.rd(k) === 0 ? '' : (k < 0 ? '-' : '+') + (Math.abs(Cx.rd(k)) === 1 && s ? '' : Cx.fmt(Math.abs(k))) + s);
  const m1 = difFrame(S, r1, win, C, { title: '\\col{b}{y=' + (Math.abs(a) === 1 ? (a < 0 ? '-' : '') : Cx.fmt(a)) + 'x^2' + tm(b, 'x') + tm(c, '') + '}', info: 'D=' + Cx.fmt(Q.D, 4) });
  difCurve(S, m1, difRaw(f, difRN(a) + '*x^2+' + difRN(b) + '*x+' + difRN(c)), { col: ST_B, hl: 'par', exp: C.exp });
  difSeg(S, m1, Q.xs, win.y0, Q.xs, win.y1, { col: ST_O, lw: 1.3, dash: [5, 4], hl: 'vx' });
  const sp = difDot(S, m1, Q.xs, Q.ys, { fill: ST_O }); if (sp) difLabel(S, m1, sp[0], sp[1], '\\col{o}{S(' + Cx.fmt(Q.xs) + '\\,|\\,' + Cx.fmt(Q.ys) + ')}', C, { dx: fs * 3.4, dy: (a > 0 ? 1 : -1) * fs * 1.0 });
  if (Q.D >= 0) Q.z.forEach(z => difDot(S, m1, z[0], 0, { fill: ST_R }));
  const im = Math.abs(Q.z[0][1]), half = Math.max(2.6, im + 1.3, Q.D > 0 ? Math.abs(Q.z[1][0] - Q.xs) + 1.3 : 0);
  const m = kitFrameSq(S, r2, C, Q.xs, 0, half, { xlab: '\\text{Re}', ylab: '\\text{Im}', title: Q.D < 0 ? '\\col{r}{z_{1,2}' + (Math.abs(im - Cx.rd(im)) < 1e-9 && Math.abs(Q.xs - Cx.rd(Q.xs)) < 1e-9 ? '=' : '\\approx ') + Cx.fmt(Q.xs) + '\\pm ' + (Cx.rd(im) === 1 ? '' : Cx.fmt(im)) + 'i}' : Q.D === 0 ? '\\col{r}{z' + Cx.eq(Q.xs) + '}' : '\\col{r}{z_1' + Cx.eq(Q.z[0][0]) + ',\\ z_2' + Cx.eq(Q.z[1][0]) + '}' });
  difSeg(S, m, Q.xs, m.win.y0, Q.xs, m.win.y1, { col: ST_O, lw: 1.3, dash: [5, 4], hl: 'vx' });
  if (Q.D < 0) difSeg(S, m, Q.z[0][0], Q.z[0][1], Q.z[1][0], Q.z[1][1], { col: ST_R, lw: 1.6, dash: [3, 4] });
  Q.z.forEach((z, i) => { if (Q.D === 0 && i) return; const p = difDot(S, m, z[0], z[1], { fill: ST_R, r: 5.5 }); if (!p) return; shlC(S, 'sol', p[0], p[1], 13); difLabel(S, m, p[0], p[1], '\\col{r}{z' + (Q.D === 0 ? '' : '_{' + (i + 1) + '}') + '}', C, { dx: fs * 1.2, dy: Q.D < 0 ? (i ? 1 : -1) * fs * 0.2 : -fs * 1.0 }); });
}

kitDefine({
  id: 'cx', icon: 'ℂ', title: 'Komplexe Zahlen', group: 'alg',
  desc: 'Gauss-Ebene mit Betrag und Argument, Addieren und Subtrahieren als Zeiger, Multiplizieren und Dividieren als Drehstreckung, Potenzen (Moivre), Wurzeln und Einheitswurzeln, quadratische Gleichungen mit komplexen Lösungen',
  about: 'Komplexe Zahlen als Punkte und Zeiger in der Gauss-Ebene: Betrag und Argument, Rechnen als Drehen und Strecken, Potenzen und Wurzeln, quadratische Gleichungen ohne reelle Lösung.',
  tip: 'Ziehe die farbigen Punkte in der Gauss-Ebene: Zeiger, Winkel und Rechenweg rechnen mit. Links wählst du die Ansicht.',
  help: ['Die Punkte rasten beim Ziehen auf runden Werten ein; genaue Werte tippst du links in die Felder.',
    'Winkel werden von der positiven reellen Achse aus im Gegenuhrzeigersinn gemessen. Mit «Winkel im Bogenmass» wechselst du in allen Ansichten zwischen Grad und Bogenmass.',
    'Bei «Wurzeln» kannst du jede Lösung ziehen: Die Zahl w wird dann als n-te Potenz dieser Lösung neu berechnet.'],
  kw: { plane: 'komplexe Zahl Gauss-Ebene Gausssche Zahlenebene Realteil Imaginärteil Betrag Argument Polarform konjugiert imaginäre Einheit', add: 'komplexe Zahlen addieren subtrahieren Zeiger Parallelogramm Abstand', mul: 'komplexe Zahlen multiplizieren dividieren Drehstreckung Winkel addieren Beträge multiplizieren konjugiert erweitern', pow: 'Potenz komplexe Zahl Moivre Spirale Einheitskreis', root: 'Wurzel komplexe Zahl Einheitswurzeln n-Eck Kreisteilung', quad: 'quadratische Gleichung komplexe Lösungen Diskriminante negativ konjugiert komplex Vieta' },
  views: [['plane', 'Zahl in der Gauss-Ebene'], ['add', 'Addieren und Subtrahieren'], ['mul', 'Multiplizieren und Dividieren'], ['pow', 'Potenzen (Formel von Moivre)'], ['root', 'Wurzeln und Einheitswurzeln'], ['quad', 'Quadratische Gleichungen']],
  quiz: ['plane', 'add', 'mul', 'pow', 'root', 'quad'], shared: ['rad'],
  descs: {
    plane: ['Ziehe die {{Zahl z|z}} in der Gauss-Ebene: Ihr {{Realteil|re}} ist die Koordinate nach rechts, ihr {{Imaginärteil|im}} die Koordinate nach oben. Der {{Betrag von z|abs}} ist die Länge des Zeigers, das {{Argument φ|arg}} sein Winkel zur positiven reellen Achse. Die {{konjugierte Zahl|conj}} liegt gespiegelt an der reellen Achse.', 'Eine komplexe Zahl z = a + bi besteht aus zwei reellen Zahlen: dem Realteil a und dem Imaginärteil b. Die imaginäre Einheit i erfüllt i² = −1. Man zeichnet z als Punkt (a | b) oder als Zeiger vom Ursprung aus. Die Polarform beschreibt denselben Punkt durch Betrag und Winkel.'],
    add: ['Ziehe {{z₁|z1}} und {{z₂|z2}}: Die {{Summe oder Differenz|res}} entsteht, indem man den zweiten Zeiger an die Spitze des ersten hängt ({{Parallelogramm|par}}). Beim Subtrahieren wird die Gegenzahl −z₂ angehängt.', 'Komplexe Zahlen addiert und subtrahiert man getrennt nach Realteil und Imaginärteil, genau wie Vektoren in der Ebene. Der Betrag der Differenz ist der Abstand der beiden Punkte.'],
    mul: ['Ziehe {{z₁|z1}} und {{z₂|z2}}: Beim {{Produkt|res}} werden die Beträge multipliziert und die {{Winkel addiert|arg}}. Die beiden {{Dreiecke|tri}} sind ähnlich, denn Multiplizieren mit z₂ dreht um den Winkel von z₂ und streckt mit dessen Betrag. «▶ Drehen und strecken» zeigt die Bewegung.', 'Gerechnet wird wie mit Klammern, mit i² = −1. In der Polarform ist das Produkt eine Drehstreckung: Beträge multiplizieren, Winkel addieren. Beim Dividieren ist es umgekehrt: Beträge dividieren, Winkel subtrahieren; in der Normalform erweitert man mit der konjugierten Zahl des Nenners.'],
    pow: ['Ziehe {{z|z}} und wähle den Exponenten: Jede {{Potenz|pw}} dreht um den {{Winkel von z|arg}} weiter und streckt mit demselben Faktor. Liegt z auf dem {{gestrichelten Einheitskreis|unit}}, bleiben alle Potenzen darauf.', 'Formel von Moivre: Die n-te Potenz hat den n-fachen Winkel, und ihr Betrag ist die n-te Potenz des Betrags. Ist der Betrag grösser als 1, laufen die Potenzen auf einer Spirale nach aussen, ist er kleiner als 1, nach innen.'],
    root: ['Wähle den Grad n und die Zahl w: Die {{n Lösungen|roots}} von zⁿ = w liegen auf einem {{Kreis um den Ursprung|circ}} und bilden ein {{regelmässiges n-Eck|poly}}. Ziehe die {{Lösung z₀|z0}}: Die anderen wandern mit.', 'Aus der Formel von Moivre folgt: Alle n-ten Wurzeln von w haben denselben Betrag, und ihre Winkel unterscheiden sich um den n-ten Teil des Vollwinkels. Für w = 1 heissen sie Einheitswurzeln.'],
    quad: ['Stelle a, b und c ein: Hat die {{zugehörige Parabel|par}} keine Nullstelle, so hat die Gleichung zwei {{konjugiert komplexe Lösungen|sol}}. Ihr Realteil ist die {{Stelle des Scheitels|vx}}; in der Gauss-Ebene liegen sie spiegelbildlich zur reellen Achse.', 'Ist die Diskriminante negativ, zieht man die Wurzel mit Hilfe der imaginären Einheit. Jede quadratische Gleichung mit reellen Koeffizienten hat damit zwei Lösungen (oder eine doppelte). Die Sätze von Vieta für Summe und Produkt der Lösungen gelten weiter.']
  },
  def: {
    plane: { a: 3, b: 2, conj: true, neg: false, rad: false, win: null },
    add: { op: '+', a1: 3, b1: 1, a2: 1, b2: 2, win: null },
    mul: { op: '*', a1: 2, b1: 1, a2: 1, b2: 1, tri: true, rad: false, win: null },
    pow: { a: 1, b: 1, n: 4, rad: false, win: null },
    root: { n: 3, a: 8, b: 0, rad: false, win: null },
    quad: { a: 1, b: -2, c: 5 }
  },
  controls(v, P) {
    const z = (k, l, lim, st) => ({ k, t: 'num', l, min: -(lim || 20), max: lim || 20, step: st || 0.5 });
    const rad = { k: 'rad', t: 'check', l: 'Winkel im Bogenmass' };
    const two = () => [z('a1', 'z₁: Realteil'), z('b1', 'z₁: Imaginärteil'), z('a2', 'z₂: Realteil'), z('b2', 'z₂: Imaginärteil')];
    if (v === 'plane') return [z('a', 'Realteil a'), z('b', 'Imaginärteil b'), { k: 'conj', t: 'check', l: 'Konjugierte Zahl zeigen' }, { k: 'neg', t: 'check', l: 'Gegenzahl −z zeigen' }, rad];
    if (v === 'add') return [{ k: 'op', t: 'select', l: 'Rechnung', o: [['+', 'Addieren'], ['-', 'Subtrahieren']] }].concat(two());
    if (v === 'mul') return [{ k: 'op', t: 'select', l: 'Rechnung', o: [['*', 'Multiplizieren'], ['/', 'Dividieren']] }].concat(two(), [{ k: 'tri', t: 'check', l: 'Ähnliche Dreiecke zeigen' }, rad]);
    if (v === 'pow') return [{ k: 'n', t: 'range', l: 'Exponent n', min: 2, max: 12, step: 1, d: 0 }, z('a', 'Realteil a', 5, 0.1), z('b', 'Imaginärteil b', 5, 0.1), rad];
    if (v === 'root') return [{ k: 'n', t: 'range', l: 'Grad n der Wurzel', min: 2, max: 12, step: 1, d: 0 }, z('a', 'w: Realteil', 1000, 1), z('b', 'w: Imaginärteil', 1000, 1), rad];
    return [{ k: 'a', t: 'range', l: 'a', min: -5, max: 5, step: 0.5 }, { k: 'b', t: 'range', l: 'b', min: -10, max: 10, step: 0.5 }, { k: 'c', t: 'range', l: 'c', min: -10, max: 20, step: 0.5 }];
  },
  presets: {
    plane: [['3 + 2i', { a: 3, b: 2 }], ['−2 + 3i (2. Quadrant)', { a: -2, b: 3 }], ['−3 − 3i (3. Quadrant)', { a: -3, b: -3 }], ['4 − 3i (Betrag 5)', { a: 4, b: -3 }], ['i (rein imaginär)', { a: 0, b: 1 }], ['−4 (reell)', { a: -4, b: 0 }]],
    add: [['(3 + i) + (1 + 2i)', { a1: 3, b1: 1, a2: 1, b2: 2 }], ['(2 + 3i) − (4 + i)', { op: '-', a1: 2, b1: 3, a2: 4, b2: 1 }], ['Zahl plus konjugierte Zahl: reell', { a1: 2, b1: 3, a2: 2, b2: -3 }], ['Zahl minus konjugierte Zahl: rein imaginär', { op: '-', a1: 2, b1: 3, a2: 2, b2: -3 }]],
    mul: [['(2 + i) · (1 + i)', { a1: 2, b1: 1, a2: 1, b2: 1 }], ['Multiplizieren mit i: Drehung um 90°', { a1: 3, b1: 1, a2: 0, b2: 1 }], ['Zahl mal konjugierte Zahl: reell', { a1: 2, b1: 1, a2: 2, b2: -1 }], ['i · i = −1', { a1: 0, b1: 1, a2: 0, b2: 1 }], ['(3 + 4i) : (1 + 2i)', { op: '/', a1: 3, b1: 4, a2: 1, b2: 2 }], ['Dividieren durch i: Drehung um −90°', { op: '/', a1: 2, b1: 3, a2: 0, b2: 1 }]],
    pow: [['(1 + i)⁴ = −4', { a: 1, b: 1, n: 4 }], ['Potenzen von i', { a: 0, b: 1, n: 4 }], ['Auf dem Einheitskreis: Winkel 30°', { a: 0.866025, b: 0.5, n: 12 }], ['Spirale nach innen', { a: 0.8, b: 0.4, n: 10 }], ['Spirale nach aussen', { a: 1.1, b: 0.4, n: 8 }]],
    root: [['z³ = 8', { n: 3, a: 8, b: 0 }], ['z² = −4', { n: 2, a: -4, b: 0 }], ['z⁴ = −16', { n: 4, a: -16, b: 0 }], ['z² = i', { n: 2, a: 0, b: 1 }], ['z³ = −8i', { n: 3, a: 0, b: -8 }], ['Einheitswurzeln: z⁵ = 1', { n: 5, a: 1, b: 0 }], ['Einheitswurzeln: z⁶ = 1', { n: 6, a: 1, b: 0 }]],
    quad: [['z² − 2z + 5 = 0', { a: 1, b: -2, c: 5 }], ['z² + 4 = 0', { a: 1, b: 0, c: 4 }], ['z² + 2z + 2 = 0', { a: 1, b: 2, c: 2 }], ['2z² − 4z + 10 = 0', { a: 2, b: -4, c: 10 }], ['−z² + 2z − 3 = 0', { a: -1, b: 2, c: -3 }], ['z² − 4z + 4 = 0 (doppelte Lösung)', { a: 1, b: -4, c: 4 }], ['z² − 2z − 3 = 0 (reelle Lösungen)', { a: 1, b: -2, c: -3 }]]
  },
  fix(v, P) {
    if (v === 'pow' || v === 'root') P.n = kitClamp(Math.round(P.n), 2, 12);
    if (v === 'quad' && !P.a) P.a = 0.5;
  },
  anim: { mul: ['▶ Drehen und strecken', 3500] },
  scene: { plane: cxScenePlane, add: cxSceneAdd, mul: cxSceneMul, pow: cxScenePow, root: cxSceneRoot, quad: cxSceneQuad },
  doc: (v, P) => Cx.doc(v, P)
});

if (typeof module !== 'undefined' && module.exports) module.exports = { Cx };
