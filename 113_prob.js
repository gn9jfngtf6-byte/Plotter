// ═══════════════════════════════════════════════════════════════════
// 113_prob.js — Stochastik rechnen: Datenanalyse, Baumdiagramm, Binomialverteilung, Erwartungswert,
// Normalverteilung, Hypothesentest
//
// Rechenkern (Pb, ohne DOM): Kennwerte, Pfade im Baumdiagramm (exakte Brüche), Binomial- und Normalverteilung,
// Ablehnungsbereich, Erwartungswert. Bild und Oberfläche wie 112_set.js (Hilfsfunktionen aus 61/62_dif,
// Karte #dif-card). Zustand PB. Die Umgebung selbst steht in 32_env.js (Eintrag «prob»).
// Die Simulationen (Würfel, Galtonbrett, Urne …) bleiben in der Umgebung «stat».
// ═══════════════════════════════════════════════════════════════════

const Pb = (function () {
  const F = (v, d) => (typeof Dif !== 'undefined' ? Dif.fmt(v, d === undefined ? 4 : d) : String(parseFloat((+v).toFixed(d === undefined ? 4 : d))));
  // ── Brüche ──
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  const fr = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
  const fAdd = (a, b) => fr(a.n * b.d + b.n * a.d, a.d * b.d), fMul = (a, b) => fr(a.n * b.n, a.d * b.d), fSub = (a, b) => fAdd(a, { n: -b.n, d: b.d });
  const fVal = a => a.n / a.d;
  const fOk = a => !!a && Number.isSafeInteger(a.n) && Number.isSafeInteger(a.d) && a.d > 0 && a.d < 1e7;
  const fTex = a => (a.d === 1 ? String(a.n) : (a.n < 0 ? '-' : '') + '\\frac{' + Math.abs(a.n) + '}{' + a.d + '}');
  // Text → Bruch: «1/6», «0.25», «0,25», «25%», «-3»
  function parseQ(s) {
    s = String(s === undefined || s === null ? '' : s).trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
    let pct = false; if (/%$/.test(s)) { pct = true; s = s.slice(0, -1); }
    let q = null; const m = s.match(/^(-?\d+)\/(\d+)$/);
    if (m && +m[2] > 0) q = fr(+m[1], +m[2]);
    else if (/^-?\d*\.?\d+$/.test(s)) { const dec = (s.split('.')[1] || '').length; if (dec <= 6) q = fr(Math.round(parseFloat(s) * Math.pow(10, dec)), Math.pow(10, dec)); }
    if (q && pct) q = fMul(q, fr(1, 100));
    return q && fOk(q) ? q : null;
  }
  // Wahrscheinlichkeit: Bruch, wenn der Nenner klein ist, sonst Dezimalzahl
  const qTex = q => (q.d <= 1000 ? fTex(q) : F(fVal(q), 4));
  const pctTex = v => F(v * 100, 2) + '\\,\\%';

  // ═════ Datenanalyse ═════
  // Liste lesen: mit «;» getrennt → Komma ist Dezimalkomma; sonst trennen Komma und Leerzeichen
  function parseData(s) {
    s = String(s || ''); const semi = /;/.test(s), out = [];
    s.split(semi ? /[;\s]+/ : /[,\s]+/).filter(Boolean).forEach(p => { const v = parseFloat((semi ? p.replace(',', '.') : p).replace('−', '-')); if (isFinite(v)) out.push(v); });
    return out;
  }
  const med = a => { const n = a.length; return !n ? NaN : n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; };
  function stats(data) {
    const a = (data || []).filter(isFinite).slice().sort((u, v) => u - v), n = a.length; if (!n) return null;
    const sum = a.reduce((s, v) => s + v, 0), mean = sum / n, h = Math.floor(n / 2);
    const lo = a.slice(0, h), hi = a.slice(n % 2 ? h + 1 : h);
    const cnt = new Map(); a.forEach(v => cnt.set(v, (cnt.get(v) || 0) + 1));
    const mx = Math.max(...cnt.values()), modes = mx > 1 ? [...cnt.keys()].filter(k => cnt.get(k) === mx) : [];
    const ss = a.reduce((s, v) => s + (v - mean) * (v - mean), 0);
    return { a, n, sum, mean, med: med(a), lo, hi, q1: n > 1 ? med(lo) : a[0], q3: n > 1 ? med(hi) : a[0], min: a[0], max: a[n - 1], modes, mx, cnt, ss, sd: Math.sqrt(ss / n), s: n > 1 ? Math.sqrt(ss / (n - 1)) : NaN };
  }
  const listTex = (a, max) => (a.length <= max ? a.map(v => F(v)).join(';\\ ') : a.slice(0, max - 2).map(v => F(v)).join(';\\ ') + ';\\ \\ldots;\\ ' + F(a[a.length - 1]));
  function dataDoc(data) {
    const d = Dif.DOC(), st = stats(data);
    d.h('Kennwerte einer Datenreihe');
    if (!st) { d.p('Gib links mindestens eine Zahl ein.'); return d; }
    const n = st.n;
    d.p('**Geordnete Liste** ($n=' + n + '$ Werte):');
    d.e(listTex(st.a, 24));
    d.p('**Mittelwert** (arithmetisches Mittel): alle Werte addieren und durch die Anzahl teilen.');
    d.e('\\bar{x}=\\frac{' + (n <= 10 ? st.a.map(v => F(v)).join('+') : '\\text{Summe}') + '}{' + n + '}=\\frac{' + F(st.sum) + '}{' + n + '}' + (Math.abs(st.mean - +F(st.mean)) < 1e-12 ? '=' : '\\approx ') + F(st.mean));
    d.p('**Median** (Zentralwert): ' + (n % 2 ? 'Bei ungerader Anzahl ist es der mittlere Wert, hier der ' + (n + 1) / 2 + '. Wert.' : 'Bei gerader Anzahl ist es der Mittelwert der beiden mittleren Werte, hier des ' + n / 2 + '. und ' + (n / 2 + 1) + '. Werts.'));
    d.e('\\tilde{x}=' + (n % 2 ? F(st.med) : '\\frac{' + F(st.a[n / 2 - 1]) + '+' + F(st.a[n / 2]) + '}{2}=' + F(st.med)));
    d.p('**Modus** (häufigster Wert): ' + (st.modes.length ? '$' + st.modes.map(v => F(v)).join(';\\ ') + '$ (' + st.mx + '-mal)' : 'Jeder Wert kommt nur einmal vor, es gibt keinen Modus.') + '. **Spannweite:** $' + F(st.max) + '-' + (st.min < 0 ? '(' + F(st.min) + ')' : F(st.min)) + '=' + F(st.max - st.min) + '$.');
    if (n > 1) {
      d.p('**Quartile:** Der Median teilt die Liste in eine untere und eine obere Hälfte' + (n % 2 ? ' (der Median selbst gehört zu keiner Hälfte)' : '') + '. $Q_1$ ist der Median der unteren, $Q_3$ der Median der oberen Hälfte.');
      d.e('\\text{unten: }' + listTex(st.lo, 12) + '\\quad\\Rightarrow\\quad Q_1=' + F(st.q1));
      d.e('\\text{oben: }' + listTex(st.hi, 12) + '\\quad\\Rightarrow\\quad Q_3=' + F(st.q3));
      d.e('\\text{Quartilsabstand: }Q_3-Q_1=' + F(st.q3 - st.q1));
      d.note('Für die Quartile gibt es mehrere übliche Regeln; Taschenrechner und Programme können leicht abweichen.');
    }
    d.p('**Standardabweichung:** mittlere Abweichung vom Mittelwert. Man quadriert die Abweichungen, bildet den Mittelwert (Varianz) und zieht die Wurzel.');
    d.e('\\sigma=\\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(x_i-\\bar{x})^2}=\\sqrt{\\frac{' + F(st.ss) + '}{' + n + '}}\\approx ' + F(st.sd));
    if (n > 1) d.note('Bei einer Stichprobe teilt man oft durch $n-1$: $s=\\sqrt{\\frac{' + F(st.ss) + '}{' + (n - 1) + '}}\\approx ' + F(st.s) + '$.');
    if (st.cnt.size <= 12) d.b.push({ k: 'tab', head: ['Wert', 'absolute Häufigkeit', 'relative Häufigkeit'], rows: [...st.cnt.keys()].map(v => ['$' + F(v) + '$', '$' + st.cnt.get(v) + '$', '$' + F(st.cnt.get(v) / n, 3) + '=' + pctTex(st.cnt.get(v) / n) + '$']) });
    d.res('$\\bar{x}\\approx ' + F(st.mean) + ',\\ \\tilde{x}=' + F(st.med) + (n > 1 ? ',\\ Q_1=' + F(st.q1) + ',\\ Q_3=' + F(st.q3) : '') + ',\\ \\sigma\\approx ' + F(st.sd) + '$');
    return d;
  }

  // ═════ Baumdiagramm (Urne mit roten und blauen Kugeln) ═════
  const EV_TXT = { k: 'genau $k$ rote Kugeln', ge1: 'mindestens eine rote Kugel', same: 'alle Kugeln gleichfarbig' };
  const evTxt = (ev, k) => (ev === 'k' ? (k === 1 ? 'genau eine rote Kugel' : k === 0 ? 'keine rote Kugel' : 'genau ' + k + ' rote Kugeln') : EV_TXT[ev]);
  function tree(r, b, n, repl, ev, k) {
    const paths = [], edges = [];
    const rec = (s, rr, bb, steps, p) => {
      if (s.length === n) { const nr = s.split('').filter(c => c === 'r').length; paths.push({ s, steps, p, nr, inE: ev === 'k' ? nr === k : ev === 'ge1' ? nr >= 1 : (nr === 0 || nr === n) }); return; }
      const tot = rr + bb;
      [['r', rr], ['b', bb]].forEach(([c, cnt]) => {
        if (!cnt || !tot) return;
        const q = fr(cnt, tot); edges.push({ from: s, to: s + c, q, c });
        rec(s + c, repl || c !== 'r' ? rr : rr - 1, repl || c !== 'b' ? bb : bb - 1, steps.concat([q]), fMul(p, q));
      });
    };
    rec('', r, b, [], fr(1, 1));
    edges.forEach(e => { e.inE = paths.some(p => p.inE && p.s.indexOf(e.to) === 0); });
    const PE = paths.filter(p => p.inE).reduce((a, p) => fAdd(a, p.p), fr(0, 1));
    return { paths, edges, PE };
  }
  const pathTex = s => s.split('').join('');
  function treeDoc(r, b, n, repl, ev, k) {
    const T = tree(r, b, n, repl, ev, k), d = Dif.DOC(), E = T.paths.filter(p => p.inE);
    d.h('Baumdiagramm und Pfadregeln');
    d.p('In der Urne liegen $' + r + '$ rote ($r$) und $' + b + '$ blaue ($b$) Kugeln. Es wird ' + n + '-mal ' + (repl ? '**mit** Zurücklegen' : '**ohne** Zurücklegen') + ' gezogen. ' + (repl ? 'Die Wahrscheinlichkeiten bleiben auf jeder Stufe gleich.' : 'Nach jedem Zug liegt eine Kugel weniger in der Urne: Die Wahrscheinlichkeiten ändern sich von Stufe zu Stufe.'));
    d.p('**1. Pfadregel (Produktregel):** Die Wahrscheinlichkeit eines Pfades ist das Produkt der Wahrscheinlichkeiten entlang des Pfades.');
    d.b.push({ k: 'tab', head: ['Pfad', 'Rechnung', 'Wahrscheinlichkeit'], rows: T.paths.map(p => ['$' + (p.inE ? '\\mathbf{' + pathTex(p.s) + '}' : pathTex(p.s)) + '$', '$' + p.steps.map(fTex).join('\\cdot ') + '$', '$' + fTex(p.p) + '$']) });
    d.p('**2. Pfadregel (Summenregel):** Die Wahrscheinlichkeit eines Ereignisses ist die Summe der Wahrscheinlichkeiten aller Pfade, die zum Ereignis gehören. Ereignis $E$: ' + evTxt(ev, k) + '.');
    if (!E.length) d.e('P(E)=0').op('kein Pfad gehört zu E');
    else d.e('P(E)=' + E.map(p => fTex(p.p)).join('+') + (E.length > 1 ? '=' + fTex(T.PE) : '') + '\\approx ' + F(fVal(T.PE), 4));
    if (ev === 'ge1') { const none = T.paths.find(p => p.nr === 0); if (none) d.note('Schneller mit dem Gegenereignis «keine rote Kugel»: $P(E)=1-P(' + pathTex(none.s) + ')=1-' + fTex(none.p) + '=' + fTex(fSub(fr(1, 1), none.p)) + '$.'); }
    d.res('$P(E)=' + fTex(T.PE) + '\\approx ' + pctTex(fVal(T.PE)) + '$');
    return d;
  }

  // ═════ Binomialverteilung ═════
  const binRange = (n, q, k, k2) => (q === 'eq' ? [k, k] : q === 'le' ? [0, k] : q === 'ge' ? [k, n] : [Math.min(k, k2), Math.max(k, k2)]);
  const cdf = (n, p, k) => (k < 0 ? 0 : k >= n ? 1 : Stat.binomCdf(n, p, k));
  const binP = (n, p, q, k, k2) => { const [a, b] = binRange(n, q, k, k2); return Math.max(0, cdf(n, p, b) - cdf(n, p, a - 1)); };
  const QTEX = { eq: k => 'P(X=' + k + ')', le: k => 'P(X\\le ' + k + ')', ge: k => 'P(X\\ge ' + k + ')', bt: (k, k2) => 'P(' + Math.min(k, k2) + '\\le X\\le ' + Math.max(k, k2) + ')' };
  function binDoc(n, ps, q, k, k2) {
    const d = Dif.DOC(), Q = parseQ(ps), p = Q ? fVal(Q) : 0.5, pt = Q ? qTex(Q) : F(p), qt = Q ? qTex(fSub(fr(1, 1), Q)) : F(1 - p);
    const tx = QTEX[q](k, k2), P = binP(n, p, q, k, k2), mu = n * p, sg = Math.sqrt(n * p * (1 - p)), pk = j => Stat.binomPmf(n, p, j);
    d.h('Binomialverteilung');
    d.p('Ein Versuch mit «Treffer» (Wahrscheinlichkeit $p=' + pt + '$) und «Niete» wird $n=' + n + '$-mal unabhängig wiederholt (Bernoulli-Kette). $X$ zählt die Treffer: $X\\sim B(' + n + ';\\,' + pt + ')$.');
    d.p('**Formel von Bernoulli:** Für genau $k$ Treffer gibt es $\\binom{n}{k}$ Pfade, jeder mit der Wahrscheinlichkeit $p^k(1-p)^{n-k}$.');
    d.e('P(X=k)=\\binom{n}{k}\\,p^k\\,(1-p)^{n-k}');
    const one = j => '\\binom{' + n + '}{' + j + '}\\cdot\\left(' + pt + '\\right)^{' + j + '}\\cdot\\left(' + qt + '\\right)^{' + (n - j) + '}';
    if (q === 'eq') { d.e(tx + '=' + one(k) + '\\approx ' + F(P, 4)); }
    else if (q === 'le') { d.e(tx + '=P(X=0)+\\ldots+P(X=' + k + ')\\approx ' + F(P, 4)); if (k <= 5) d.e('=' + Array.from({ length: k + 1 }, (_, j) => F(pk(j), 4)).join('+')); }
    else if (q === 'ge') { d.p('Mit dem **Gegenereignis** ist es meist kürzer: «mindestens $' + k + '$» ist das Gegenteil von «höchstens $' + (k - 1) + '$».'); d.e(tx + '=1-P(X\\le ' + (k - 1) + ')=1-' + F(cdf(n, p, k - 1), 4) + '\\approx ' + F(P, 4)); }
    else { const a = Math.min(k, k2), b = Math.max(k, k2); d.e(tx + '=P(X\\le ' + b + ')-P(X\\le ' + (a - 1) + ')=' + F(cdf(n, p, b), 4) + '-' + F(cdf(n, p, a - 1), 4) + '\\approx ' + F(P, 4)); }
    d.p('**Erwartungswert und Standardabweichung:** Im Mittel erwartet man $\\mu=n\\cdot p$ Treffer; die Werte streuen um $\\sigma=\\sqrt{n\\cdot p\\cdot(1-p)}$.');
    d.e('\\mu=' + n + '\\cdot ' + pt + '\\approx ' + F(mu, 3) + ',\\qquad\\sigma=\\sqrt{' + n + '\\cdot ' + pt + '\\cdot ' + qt + '}\\approx ' + F(sg, 3));
    d.res('$' + tx + '\\approx ' + F(P, 4) + '=' + pctTex(P) + '$');
    return d;
  }

  // ═════ Zufallsgrösse, Erwartungswert, faires Spiel ═════
  function evCalc(rows, es) {
    const R = (rows || []).map(([xs, ps]) => ({ x: parseQ(xs), p: parseQ(ps), xs, ps })).filter(r => r.x && r.p);
    let E = fr(0, 1), sp = fr(0, 1), ok = R.length > 0;
    R.forEach(r => { E = fAdd(E, fMul(r.x, r.p)); sp = fAdd(sp, r.p); if (!fOk(E) || !fOk(sp)) ok = false; });
    const Ev = ok ? fVal(E) : R.reduce((a, r) => a + fVal(r.x) * fVal(r.p), 0), sum = ok ? fVal(sp) : R.reduce((a, r) => a + fVal(r.p), 0);
    const V = R.reduce((a, r) => a + fVal(r.p) * Math.pow(fVal(r.x) - Ev, 2), 0), e = parseQ(es);
    return { R, E: ok ? E : null, Ev, sum, sumQ: ok ? sp : null, V, sd: Math.sqrt(V), e, ev: e ? fVal(e) : NaN };
  }
  const xTex = q => (q.d === 1 ? String(q.n) : q.d <= 100 ? fTex(q) : F(fVal(q)));
  function evDoc(rows, es) {
    const c = evCalc(rows, es), d = Dif.DOC();
    d.h('Zufallsgrösse und Erwartungswert');
    if (!c.R.length) { d.p('Trage links Werte und Wahrscheinlichkeiten ein.'); return d; }
    d.p('Die Zufallsgrösse $X$ ist hier die Auszahlung pro Spiel. Ihre **Wahrscheinlichkeitsverteilung**:');
    d.b.push({ k: 'tab', head: ['$x_i$', '$P(X=x_i)$', '$x_i\\cdot P(X=x_i)$'], rows: c.R.map(r => ['$' + xTex(r.x) + '$', '$' + qTex(r.p) + '$', '$' + xTex(fMul(r.x, r.p)) + '$']) });
    if (Math.abs(c.sum - 1) > 1e-9) d.note('Achtung: Die Wahrscheinlichkeiten ergeben zusammen $' + (c.sumQ ? qTex(c.sumQ) : F(c.sum)) + '$ statt $1$.');
    d.p('**Erwartungswert:** jeden Wert mit seiner Wahrscheinlichkeit gewichten und addieren. Er ist der Mittelwert der Auszahlung auf lange Sicht (der Schwerpunkt der Verteilung).');
    d.e('E(X)=\\sum x_i\\cdot P(X=x_i)');
    d.e('E(X)=' + c.R.map(r => (fVal(r.x) < 0 ? '(' + xTex(r.x) + ')' : xTex(r.x)) + '\\cdot ' + qTex(r.p)).join('+') + '=' + (c.E ? xTex(c.E) + (c.E.d > 1 ? '\\approx ' + F(c.Ev, 4) : '') : F(c.Ev, 4)));
    d.e('\\sigma(X)=\\sqrt{\\sum (x_i-E(X))^2\\cdot P(X=x_i)}\\approx ' + F(c.sd, 4));
    if (c.e) {
      const g = c.Ev - c.ev;
      d.p('**Faires Spiel:** Ein Spiel ist fair, wenn der Einsatz gleich dem Erwartungswert der Auszahlung ist. Dann gewinnt auf lange Sicht niemand.');
      d.e('\\text{Gewinn pro Spiel: }E(X)-\\text{Einsatz}=' + F(c.Ev, 4) + '-' + F(c.ev, 4) + '=' + F(g, 4));
      d.p(Math.abs(g) < 1e-9 ? 'Das Spiel ist **fair**.' : g < 0 ? 'Der Spieler verliert im Mittel $' + F(-g, 4) + '$ pro Spiel: Das Spiel ist **nicht fair** (zu Gunsten des Anbieters). Fairer Einsatz: $' + F(c.Ev, 4) + '$.' : 'Der Spieler gewinnt im Mittel $' + F(g, 4) + '$ pro Spiel: Das Spiel ist **nicht fair** (zu Gunsten des Spielers). Fairer Einsatz: $' + F(c.Ev, 4) + '$.');
    }
    d.res('$E(X)=' + (c.E ? xTex(c.E) : F(c.Ev, 4)) + (c.E && c.E.d > 1 ? '\\approx ' + F(c.Ev, 4) : '') + (c.e ? ',\\ \\text{fairer Einsatz } ' + F(c.Ev, 4) : '') + '$');
    return d;
  }

  // ═════ Poissonverteilung ═════
  // P(X = k) = λ^k / k! · e^(−λ); λ = mittlere Anzahl im betrachteten Bereich (= Rate r pro Einheit · Anzahl Einheiten t)
  function poiPmf(lam, k) { if (!(lam > 0) || k < 0 || k !== Math.floor(k)) return 0; let lg = -lam + k * Math.log(lam); for (let i = 2; i <= k; i++) lg -= Math.log(i); return Math.exp(lg); }
  function poiCdf(lam, k) { if (k < 0) return 0; let s = 0; for (let i = 0; i <= Math.floor(k); i++) s += poiPmf(lam, i); return Math.min(1, s); }
  // Glatte Kurven durch die Säulen: k! = Γ(k + 1) gilt auch für nicht ganze k (ln Γ nach Lanczos)
  function lgam(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgam(1 - x);
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    x -= 1; let a = c[0]; const t = x + 7.5; for (let i = 1; i < 9; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  const poiF = (lam, x) => (x >= 0 ? Math.exp(-lam + x * Math.log(lam) - lgam(x + 1)) : NaN);                       // λ^x / x! · e^(−λ)
  const binF = (n, p, x) => (x >= 0 && x <= n ? Math.exp(lgam(n + 1) - lgam(x + 1) - lgam(n - x + 1) + x * Math.log(p) + (n - x) * Math.log(1 - p)) : NaN);
  const poiP = (lam, q, k, k2) => { const a = q === 'bt' ? Math.min(k, k2) : k, b = q === 'bt' ? Math.max(k, k2) : k; return Math.max(0, q === 'eq' ? poiPmf(lam, k) : q === 'le' ? poiCdf(lam, k) : q === 'ge' ? 1 - poiCdf(lam, k - 1) : poiCdf(lam, b) - poiCdf(lam, a - 1)); };
  const poiIn = (q, k, k2, j) => (q === 'eq' ? j === k : q === 'le' ? j <= k : q === 'ge' ? j >= k : j >= Math.min(k, k2) && j <= Math.max(k, k2));
  // cmp: Vergleich mit B(n; λ/n) (n = Anzahl Versuche)
  function poiDoc(r, t, q, k, k2, cmp, n) {
    const d = Dif.DOC(), lam = r * t, lt = F(lam, 4), tx = QTEX[q](k, k2), P = poiP(lam, q, k, k2), pk = j => poiPmf(lam, j);
    const one = j => '\\frac{' + lt + '^{' + j + '}}{' + j + '!}\\cdot e^{-' + lt + '}';
    d.h('Poissonverteilung');
    d.p('Die Poissonverteilung beschreibt, **wie oft ein Ereignis** in einem festen Zeitraum (oder auf einer Seite, einer Strecke, einer Fläche) eintritt, wenn die Ereignisse einzeln, unabhängig voneinander und im Mittel gleich häufig auftreten. $X$ zählt die Ereignisse, $\\lambda$ ist ihre **mittlere Anzahl**.');
    if (Math.abs(t - 1) > 1e-12) { d.p('Im Mittel sind es $' + F(r, 4) + '$ pro Einheit. Für $' + F(t, 4) + '$ Einheiten wird der Mittelwert entsprechend vervielfacht:'); d.e('\\lambda=' + F(r, 4) + '\\cdot ' + F(t, 4) + '=' + lt); }
    else d.e('\\lambda=' + lt);
    d.p('**Formel:**'); d.e('P(X=k)=\\frac{\\lambda^k}{k!}\\cdot e^{-\\lambda}');
    if (q === 'eq') d.e(tx + '=' + one(k) + '\\approx ' + F(P, 4));
    else if (q === 'le') { d.e(tx + '=P(X=0)+\\ldots+P(X=' + k + ')\\approx ' + F(P, 4)); if (k <= 5) d.e('=' + Array.from({ length: k + 1 }, (_, j) => F(pk(j), 4)).join('+')); }
    else if (q === 'ge') {
      if (k <= 0) d.e(tx + '=1');
      else if (k === 1) { d.p('«Mindestens ein Ereignis» ist das **Gegenereignis** von «kein Ereignis»:'); d.e(tx + '=1-P(X=0)=1-e^{-' + lt + '}\\approx 1-' + F(pk(0), 4) + '\\approx ' + F(P, 4)); }
      else { d.p('Mit dem **Gegenereignis** ist es kürzer: «mindestens $' + k + '$» ist das Gegenteil von «höchstens $' + (k - 1) + '$».'); d.e(tx + '=1-P(X\\le ' + (k - 1) + ')=1-' + F(poiCdf(lam, k - 1), 4) + '\\approx ' + F(P, 4)); if (k - 1 <= 4) d.e('P(X\\le ' + (k - 1) + ')=' + Array.from({ length: k }, (_, j) => F(pk(j), 4)).join('+')); }
    } else { const a = Math.min(k, k2), b = Math.max(k, k2); d.e(tx + '=P(X\\le ' + b + ')-P(X\\le ' + (a - 1) + ')=' + F(poiCdf(lam, b), 4) + '-' + F(poiCdf(lam, a - 1), 4) + '\\approx ' + F(P, 4)); }
    d.p('**Erwartungswert und Standardabweichung:** Bei der Poissonverteilung sind Erwartungswert und Varianz beide gleich $\\lambda$.');
    d.e('\\mu=\\lambda=' + lt + ',\\qquad\\sigma=\\sqrt{\\lambda}\\approx ' + F(Math.sqrt(lam), 3));
    if (cmp && n > lam) {
      const p = lam / n, PB2 = binP(n, p, q, Math.min(k, n), Math.min(k2, n));
      d.p('**Zusammenhang mit der Binomialverteilung:** Bei sehr vielen Versuchen $n$ mit kleiner Trefferwahrscheinlichkeit $p$ ist $B(n;\\,p)$ fast gleich der Poissonverteilung mit $\\lambda=n\\cdot p$ (Faustregel: $n\\ge 50$ und $p\\le 0.1$).');
      d.e('n=' + n + ',\\quad p=\\frac{\\lambda}{n}=\\frac{' + lt + '}{' + n + '}\\approx ' + F(p, 4));
      d.e('\\text{binomial: }' + tx + '\\approx ' + F(PB2, 4) + '\\qquad\\text{Poisson: }' + F(P, 4));
    }
    d.note('Typische Beispiele: Anrufe pro Minute, Druckfehler pro Seite, Tore pro Spiel, Zerfälle pro Sekunde. Doppelter Zeitraum heisst doppeltes $\\lambda$.');
    d.res('$' + tx + '\\approx ' + F(P, 4) + '=' + pctTex(P) + '$');
    return d;
  }

  // ═════ Normalverteilung: Grenze x ↔ Anzahl σ (z) ↔ Prozent ═════
  // q: 'l' linksseitig P(X ≤ μ+zσ), 'r' rechtsseitig P(X ≥ μ+zσ), 'bt' zwischen zwei Grenzen μ+zσ und μ+z2σ,
  //    'in' beidseitig innerhalb μ ± zσ, 'out' beidseitig ausserhalb. Alle Grenzen werden in Einheiten von σ geführt.
  const Phi = z => Stat.normCdf(z, 0, 1);
  const sigP = (q, z, z2) => (q === 'l' ? Phi(z) : q === 'r' ? 1 - Phi(z) : q === 'bt' ? Phi(Math.max(z, z2)) - Phi(Math.min(z, z2)) : q === 'in' ? 2 * Phi(Math.abs(z)) - 1 : 2 * (1 - Phi(Math.abs(z))));
  const sigZ = (q, p) => (q === 'l' ? Stat.normInv(p) : q === 'r' ? Stat.normInv(1 - p) : q === 'in' ? Stat.normInv((1 + p) / 2) : Stat.normInv(1 - p / 2));
  const SIG_Z = [1, 1.282, 1.645, 1.96, 2, 2.326, 2.576, 3];             // Merkzahlen der Ablesetabelle (ganze σ; 90 %, 95 %, 99 % ein- und beidseitig)
  const sigPct = p => { const v = p * 100; return F(v, v >= 99.9 ? 4 : v >= 1 ? 2 : v >= 0.01 ? 3 : 5); };   // Prozentzahl, bei kleinen Anteilen mehr Stellen
  const sigX = (mu, s, z) => Math.round((mu + z * s) * 1e6) / 1e6 + 0;
  // Grenzwert x passend zur Grösse von σ runden (σ = 7 → 2 Stellen, σ = 100 → 1 Stelle, σ = 0.05 → 4 Stellen)
  const sigXF = (mu, s, z) => F(sigX(mu, s, z), Math.max(1, Math.min(6, 2 - Math.floor(Math.log10(s)))));
  // Aussage mit den wirklichen Grenzen, z. B. P(70 ≤ X ≤ 130)
  function sigTex(q, z, mu, s, z2) {
    const za = Math.abs(z), a = sigXF(mu, s, -za), b = sigXF(mu, s, za), x = sigXF(mu, s, z);
    if (q === 'bt') return 'P(' + sigXF(mu, s, Math.min(z, z2)) + '\\le X\\le ' + sigXF(mu, s, Math.max(z, z2)) + ')';
    return q === 'l' ? 'P(X\\le ' + x + ')' : q === 'r' ? 'P(X\\ge ' + x + ')' : q === 'in' ? 'P(' + a + '\\le X\\le ' + b + ')' : 'P(X\\le ' + a + '\\ \\text{oder}\\ X\\ge ' + b + ')';
  }
  const SIG_NAME = { l: 'linksseitig', r: 'rechtsseitig', bt: 'zwischen zwei Grenzen', in: 'beidseitig (innerhalb)', out: 'beidseitig (ausserhalb)' };
  // Zeilen der Ablesetabelle: Merkzahlen und (falls nicht dabei) der aktuelle Wert
  function sigRows(z, q) {
    if (q === 'bt') return SIG_Z.map(v => ({ z: v, cur: false, l: Phi(v), r: 1 - Phi(v), in: 2 * Phi(v) - 1, out: 2 * (1 - Phi(v)) }));
    const neg = z < -1e-9 && (q === 'l' || q === 'r'), zc = Math.round((neg ? z : Math.abs(z)) * 1e6) / 1e6, zs = SIG_Z.slice(); let cur = zs.findIndex(v => Math.abs(v - zc) < 5e-4);
    if (cur < 0 && Math.abs(zc) > 1e-9) { zs.push(zc); zs.sort((a, b) => a - b); cur = zs.indexOf(zc); }   // einseitig mit negativem z: eigene Zeile mit Vorzeichen
    return zs.map((v, i) => ({ z: v, cur: i === cur, l: Phi(v), r: 1 - Phi(v), in: 2 * Phi(Math.abs(v)) - 1, out: 2 * (1 - Phi(Math.abs(v))) }));
  }
  // dir: was gegeben ist — 'x' Grenze als wirklicher Wert, 'z' Anzahl σ, 'p' Prozent (dann ist die Grenze gesucht)
  function sigDoc(mu, s, q, z, dir, unit, z2) {
    const d = Dif.DOC(), za = Math.abs(z), P = sigP(q, z, z2), two = q === 'in' || q === 'out', u = unit ? '\\,\\text{' + unit + '}' : '';
    const zz = two ? za : z, zt = F(zz, 3), std = Math.abs(mu) < 1e-12 && Math.abs(s - 1) < 1e-12, par = v => (v < 0 ? '(' + F(v, 3) + ')' : F(v, 3));
    const xe = v => '\\mu' + (v < 0 ? '-' : '+') + F(Math.abs(v), 3) + '\\sigma=' + F(mu) + (v < 0 ? '-' : '+') + F(Math.abs(v), 3) + '\\cdot ' + F(s) + '\\approx ' + sigXF(mu, s, v) + u;
    const ze = (nm, v) => nm + '=\\frac{' + sigXF(mu, s, v) + '-' + (mu < 0 ? '(' + F(mu) + ')' : F(mu)) + '}{' + F(s) + '}\\approx ' + F(v, 3);   // standardisieren
    d.h('Normalverteilung');
    d.p('$X$ ist normalverteilt mit Mittelwert $\\mu=' + F(mu) + '$ und Standardabweichung $\\sigma=' + F(s) + '$. Wahrscheinlichkeiten sind **Flächen unter der Glockenkurve**; sie hängen nur davon ab, wie viele Standardabweichungen die Grenze vom Mittelwert entfernt ist: $z=\\frac{x-\\mu}{\\sigma}$.');
    if (q === 'bt') {
      const lo = Math.min(z, z2), hi = Math.max(z, z2);
      d.p('**Gegeben** sind zwei Grenzen, **gesucht** ist der Anteil dazwischen.');
      if (!std) { d.p('**Standardisieren:**'); d.e(ze('z_1', lo)); d.e(ze('z_2', hi)); }
      d.e(sigTex(q, z, mu, s, z2) + '=\\Phi(' + F(hi, 3) + ')-\\Phi(' + F(lo, 3) + ')'); d.e('=' + F(Phi(hi), 4) + '-' + F(Phi(lo), 4) + '\\approx ' + F(P, 4));
    } else if (dir === 'p') {
      d.p('**Gegeben** ist der Anteil $' + pctTex(P) + '$ (' + SIG_NAME[q] + '), **gesucht** ist die Grenze.');
      if (q === 'l') d.e('\\Phi(z)=' + F(P, 4) + '\\quad\\Rightarrow\\quad z\\approx ' + zt).op('Tabelle rückwärts lesen');
      else if (q === 'r') { d.e('1-\\Phi(z)=' + F(P, 4) + '\\quad\\Rightarrow\\quad \\Phi(z)=' + F(1 - P, 4)); d.e('z\\approx ' + zt).op('Tabelle rückwärts lesen'); }
      else if (q === 'in') { d.p('Die übrigen $' + pctTex(1 - P) + '$ verteilen sich je zur Hälfte auf beide Seiten.'); d.e('2\\,\\Phi(z)-1=' + F(P, 4) + '\\quad\\Rightarrow\\quad \\Phi(z)=\\frac{1+' + F(P, 4) + '}{2}=' + F((1 + P) / 2, 4)); d.e('z\\approx ' + zt).op('Tabelle rückwärts lesen'); }
      else { d.p('Auf jeder Seite liegt die Hälfte, also je $' + pctTex(P / 2) + '$.'); d.e('2\\,(1-\\Phi(z))=' + F(P, 4) + '\\quad\\Rightarrow\\quad \\Phi(z)=1-\\frac{' + F(P, 4) + '}{2}=' + F(1 - P / 2, 4)); d.e('z\\approx ' + zt).op('Tabelle rückwärts lesen'); }
      if (!std) { d.p('**Zurück zur wirklichen Grösse:** $x=\\mu+z\\cdot\\sigma$.'); if (two) { d.e('x_1=' + xe(-za)); d.e('x_2=' + xe(za)); } else d.e('x=' + xe(z)); }
    } else {
      if (dir === 'x' && !std) {
        d.p('**Gegeben** ' + (two ? 'sind die Grenzen $' + sigXF(mu, s, -za) + u + '$ und $' + sigXF(mu, s, za) + u + '$' : 'ist die Grenze $x=' + sigXF(mu, s, z) + u + '$') + ', **gesucht** ist der Anteil (' + SIG_NAME[q] + ').');
        d.p('**Standardisieren:** Mit $z=\\frac{x-\\mu}{\\sigma}$ wird jede Normalverteilung zur Standardnormalverteilung; deren Flächen $\\Phi(z)=P(Z\\le z)$ stehen in der Tabelle oder im Rechner.');
        d.e(ze('z', zz));
      } else {
        d.p('**Gegeben** ' + (two ? 'sind die Grenzen' : 'ist die Grenze') + ' bei $z=' + (two ? '\\pm ' : '') + zt + '$ Standardabweichungen, **gesucht** ist der Anteil (' + SIG_NAME[q] + ').');
        if (!std) { if (two) { d.e('x_1=' + xe(-za)); d.e('x_2=' + xe(za)); } else d.e('x=' + xe(z)); }
      }
      const ph = F(Phi(zz), 4);
      if (q === 'l') d.e(sigTex(q, z, mu, s) + '=\\Phi(' + zt + ')\\approx ' + F(P, 4));
      else if (q === 'r') d.e(sigTex(q, z, mu, s) + '=1-\\Phi(' + zt + ')=1-' + ph + '\\approx ' + F(P, 4));
      else if (q === 'in') { d.e(sigTex(q, z, mu, s) + '=\\Phi(' + zt + ')-\\Phi(-' + zt + ')=2\\,\\Phi(' + zt + ')-1'); d.e('=2\\cdot ' + ph + '-1\\approx ' + F(P, 4)); }
      else { d.e('P(|X-\\mu|\\ge ' + zt + '\\sigma)=2\\,(1-\\Phi(' + zt + '))'); d.e('=2\\cdot(1-' + ph + ')\\approx ' + F(P, 4)); }
    }
    d.p('**Zum Ablesen** (Anteile in Prozent; $z$ = Anzahl Standardabweichungen). links: $X\\le\\mu+z\\sigma$, rechts: $X\\ge\\mu+z\\sigma$, innen: $\\mu-z\\sigma\\le X\\le\\mu+z\\sigma$, aussen: der Rest.');
    const b = (r, t) => (r.cur ? '$\\mathbf{' + t + '}$' : '$' + t + '$');
    d.b.push({ k: 'tab', head: ['$z$', 'links', 'rechts', 'innen', 'aussen'], rows: sigRows(z, q).map(r => [b(r, F(r.z, 3)), b(r, sigPct(r.l)), b(r, sigPct(r.r)), b(r, sigPct(r.in)), b(r, sigPct(r.out))]) });
    d.note('Die Glockenkurve ist symmetrisch: $\\Phi(-z)=1-\\Phi(z)$. Linksseitig und rechtsseitig ergänzen sich zu $100\\,\\%$, innerhalb und ausserhalb ebenfalls. Merkzahlen beidseitig: $1\\sigma\\to 68.3\\,\\%$, $2\\sigma\\to 95.4\\,\\%$, $3\\sigma\\to 99.7\\,\\%$ sowie $90\\,\\%\\to 1.645\\sigma$, $95\\,\\%\\to 1.96\\sigma$, $99\\,\\%\\to 2.576\\sigma$. Bei stetigen Grössen ist $P(X=x)=0$, darum ist es egal, ob $<$ oder $\\le$ steht.');
    d.res(q !== 'bt' && dir === 'p' ? (two ? '$' + pctTex(P) + (q === 'in' ? '\\text{ liegen in }' : '\\text{ liegen ausserhalb von }') + '\\mu\\pm ' + zt + '\\sigma' + (std ? '' : '=[' + sigXF(mu, s, -za) + ';\\,' + sigXF(mu, s, za) + ']') + '$' : '$z\\approx ' + zt + (std ? '' : ',\\ x\\approx ' + sigXF(mu, s, z) + u) + '$') : '$' + (q === 'out' ? 'P(|X-\\mu|\\ge ' + zt + '\\sigma)' : sigTex(q, z, mu, s, z2)) + '\\approx ' + F(P, 4) + '=' + sigPct(P) + '\\,\\%$');
    return d;
  }

  // ═════ Grenzübergänge: Binomial → Poisson (n gross, p klein, n·p = λ) und Binomial → Normal (n gross) ═════
  // Grösste Abweichung zwischen B(n; λ/n) und Poisson(λ) über alle k
  function limPoiDev(lam, n) { let d = 0; const p = lam / n, K = Math.max(8, Math.ceil(lam + 6 * Math.sqrt(lam))); for (let k = 0; k <= K; k++) d = Math.max(d, Math.abs((k <= n ? Stat.binomPmf(n, p, k) : 0) - poiPmf(lam, k))); return d; }
  // Die drei Faktoren der Herleitung für ein festes k
  function limPoiFac(lam, n, k) { let pr = 1; for (let j = 0; j < k; j++) pr *= (n - j) / n; return { prod: k <= n ? pr : 0, pow: Math.pow(1 - lam / n, n), rest: Math.pow(1 - lam / n, -k) }; }
  // Grösste Abweichung zwischen den standardisierten Säulen σ·P(X = k) und der Glockenkurve φ(z)
  function limNormDev(n, p) { const mu = n * p, sg = Math.sqrt(n * p * (1 - p)); let d = 0; for (let k = Math.max(0, Math.floor(mu - 5 * sg)); k <= Math.min(n, Math.ceil(mu + 5 * sg)); k++) d = Math.max(d, Math.abs(sg * Stat.binomPmf(n, p, k) - Stat.normPdf((k - mu) / sg, 0, 1))); return d; }
  function limDoc(mode, lam, ps, n, k) {
    const d = Dif.DOC();
    if (mode === 'poi') {
      const lt = F(lam, 4), p = lam / n, fc = limPoiFac(lam, n, k), pb = k <= n ? Stat.binomPmf(n, p, k) : 0, pp = poiPmf(lam, k);
      d.h('Von der Binomial- zur Poissonverteilung');
      d.p('**Idee:** Ein Zeitraum wird in $n$ kurze Abschnitte geteilt. In jedem Abschnitt tritt das Ereignis mit der kleinen Wahrscheinlichkeit $p=\\frac{\\lambda}{n}$ ein (und höchstens einmal). Die Anzahl $X$ der Ereignisse ist dann binomialverteilt mit dem Erwartungswert $n\\cdot p=\\lambda$. Je feiner die Unterteilung, desto genauer – gesucht ist der Grenzwert für $n\\to\\infty$.');
      d.p('**Schritt 1:** Formel von Bernoulli mit $p=\\frac{\\lambda}{n}$.');
      d.e('P(X=k)=\\binom{n}{k}\\left(\\frac{\\lambda}{n}\\right)^{k}\\left(1-\\frac{\\lambda}{n}\\right)^{n-k}');
      d.p('**Schritt 2:** Binomialkoeffizient ausschreiben, $\\binom{n}{k}=\\frac{n(n-1)\\cdots(n-k+1)}{k!}$, und die Faktoren neu ordnen.');
      d.e('P(X=k)=\\frac{\\lambda^{k}}{k!}\\cdot\\frac{n(n-1)\\cdots(n-k+1)}{n^{k}}\\cdot\\ldots');
      d.e('\\ldots\\cdot\\left(1-\\frac{\\lambda}{n}\\right)^{n}\\cdot\\left(1-\\frac{\\lambda}{n}\\right)^{-k}');
      d.p('**Schritt 3:** Grenzwert jedes Faktors für $n\\to\\infty$ (bei festem $k$).');
      d.e('\\frac{n}{n}\\cdot\\frac{n-1}{n}\\cdots\\frac{n-k+1}{n}\\ \\to\\ 1').op('k Brüche, jeder geht gegen 1');
      d.e('\\left(1-\\frac{\\lambda}{n}\\right)^{n}\\ \\to\\ e^{-\\lambda}').op('Definition von e');
      d.e('\\left(1-\\frac{\\lambda}{n}\\right)^{-k}\\ \\to\\ 1').op('Basis geht gegen 1');
      d.p('Die Zahl $e$ ist gerade so definiert: $\\left(1+\\frac{x}{n}\\right)^{n}\\to e^{x}$, hier mit $x=-\\lambda$.');
      d.p('**Ergebnis:**');
      d.e('P(X=k)\\ \\to\\ \\frac{\\lambda^{k}}{k!}\\cdot e^{-\\lambda}');
      d.p('**Mit den Zahlen im Bild** ($\\lambda=' + lt + '$, $n=' + n + '$, $p=' + F(p, 4) + '$, $k=' + k + '$):');
      d.b.push({ k: 'tab', head: ['Faktor', 'für $n=' + n + '$', 'Grenzwert'], rows: [
        ['$\\frac{n(n-1)\\cdots(n-k+1)}{n^{k}}$', '$' + F(fc.prod, 4) + '$', '$1$'],
        ['$\\left(1-\\frac{\\lambda}{n}\\right)^{n}$', '$' + F(fc.pow, 4) + '$', '$e^{-' + lt + '}\\approx ' + F(Math.exp(-lam), 4) + '$'],
        ['$\\left(1-\\frac{\\lambda}{n}\\right)^{-k}$', '$' + F(fc.rest, 4) + '$', '$1$'],
        ['$P(X=' + k + ')$', '$' + F(pb, 4) + '$', '$' + F(pp, 4) + '$']] });
      d.note('Faustregel: Für $n\\ge 50$ und $p\\le 0.1$ darf man die Binomial- durch die Poissonverteilung ersetzen. Auch die Varianz passt: $n\\,p\\,(1-p)=\\lambda\\left(1-\\frac{\\lambda}{n}\\right)\\to\\lambda$.');
      d.res('$B\\!\\left(n;\\,\\frac{\\lambda}{n}\\right)\\ \\to\\ \\text{Poisson}(\\lambda)$ für $n\\to\\infty$: $P(X=k)=\\frac{\\lambda^{k}}{k!}\\,e^{-\\lambda}$');
      return d;
    }
    const Q = parseQ(ps), p = Q ? fVal(Q) : 0.5, q = 1 - p, pt = Q ? qTex(Q) : F(p), mu = n * p, sg = Math.sqrt(n * p * q), f = x => Stat.normPdf(x, mu, sg);
    d.h('Von der Binomial- zur Normalverteilung');
    d.p('**Idee:** Für grosses $n$ hat die Binomialverteilung sehr viele Säulen. Misst man in Einheiten von $\\sigma=\\sqrt{n\\,p\\,(1-p)}$, ist jede Säule nur noch $\\frac{1}{\\sigma}$ breit: Die Säulen verschmelzen zu einer glatten Kurve, aus der **diskreten** wird eine **stetige** Zufallsgrösse. Gesucht ist die Gleichung dieser Kurve.');
    d.p('**Schritt 1:** Zwei benachbarte Säulen vergleichen ($q=1-p$).');
    d.e('\\frac{P(X=k+1)}{P(X=k)}=\\frac{n-k}{k+1}\\cdot\\frac{p}{q}');
    d.p('**Schritt 2:** Vom Erwartungswert aus messen: $k=\\mu+x$ mit $\\mu=n\\,p$ und $\\sigma^{2}=n\\,p\\,q$.');
    d.e('(n-k)\\,p=(n\\,q-x)\\,p=\\sigma^{2}-p\\,x');
    d.e('(k+1)\\,q=(n\\,p+x+1)\\,q=\\sigma^{2}+q\\,(x+1)');
    d.e('\\frac{P(X=k+1)}{P(X=k)}=\\frac{\\sigma^{2}-p\\,x}{\\sigma^{2}+q\\,(x+1)}=\\frac{1-\\frac{p\\,x}{\\sigma^{2}}}{1+\\frac{q\\,(x+1)}{\\sigma^{2}}}');
    d.p('**Schritt 3:** Logarithmieren. Für grosses $n$ ist $\\sigma^{2}$ gross, die Brüche sind klein, und für kleine $u$ gilt $\\ln(1+u)\\approx u$.');
    d.e('\\ln P(X=k+1)-\\ln P(X=k)\\approx-\\frac{p\\,x}{\\sigma^{2}}-\\frac{q\\,(x+1)}{\\sigma^{2}}');
    d.e('=-\\frac{x+q}{\\sigma^{2}}\\approx-\\frac{x}{\\sigma^{2}}').op('x gross gegenüber q < 1');
    d.p('**Schritt 4:** Die Säulen rücken zusammen. Der Unterschied zweier Nachbarn (Schritt $1$, klein gegenüber $\\sigma$) wird zur **Ableitung** der Kurve $f$.');
    d.e('\\bigl(\\ln f(x)\\bigr)\'=-\\frac{x}{\\sigma^{2}}');
    d.p('**Schritt 5:** Integrieren und nach $f$ auflösen.');
    d.e('\\ln f(x)=-\\frac{x^{2}}{2\\sigma^{2}}+c\\quad\\Rightarrow\\quad f(x)=C\\cdot e^{-\\frac{x^{2}}{2\\sigma^{2}}}');
    d.p('**Schritt 6:** $C$ so wählen, dass die ganze Fläche unter der Kurve $1$ ist (alle Wahrscheinlichkeiten zusammen).');
    d.e('\\int_{-\\infty}^{\\infty}e^{-\\frac{x^{2}}{2\\sigma^{2}}}\\,dx=\\sigma\\sqrt{2\\pi}\\quad\\Rightarrow\\quad C=\\frac{1}{\\sigma\\sqrt{2\\pi}}');
    d.p('**Ergebnis** (mit $x=k-\\mu$): die Dichte der Normalverteilung.');
    d.e('P(X=k)\\approx f(k)=\\frac{1}{\\sigma\\sqrt{2\\pi}}\\cdot e^{-\\frac{(k-\\mu)^{2}}{2\\sigma^{2}}}');
    d.p('**Mit den Zahlen im Bild** ($n=' + n + '$, $p=' + pt + '$): $\\mu=' + F(mu, 3) + '$, $\\sigma\\approx ' + F(sg, 3) + '$, Säulenbreite $\\frac{1}{\\sigma}\\approx ' + F(1 / sg, 3) + '$.');
    const ks = [...new Set([Math.round(mu - sg), Math.round(mu), Math.round(mu + sg), Math.round(mu + 2 * sg)].map(v => Math.max(0, Math.min(n, v))))];
    d.b.push({ k: 'tab', head: ['$k$', 'binomial $P(X=k)$', 'Kurve $f(k)$'], rows: ks.map(j => ['$' + j + '$', '$' + F(Stat.binomPmf(n, p, j), 4) + '$', '$' + F(f(j), 4) + '$']) });
    d.note('Faustregel: brauchbar, sobald $\\sigma>3$ ist, also $n\\,p\\,(1-p)>9$. Das ist der Satz von de Moivre und Laplace. Der Wert des Integrals in Schritt 6 (Gauss-Integral) wird hier ohne Beweis verwendet.');
    d.res('$B(n;\\,p)\\ \\to$ Normalverteilung mit $\\mu=n\\,p$ und $\\sigma=\\sqrt{n\\,p\\,(1-p)}$: $f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}\\,e^{-\\frac{(x-\\mu)^{2}}{2\\sigma^{2}}}$');
    return d;
  }

  // ═════ Hypothesentest (Binomialtest) ═════
  // side: 'r' rechtsseitig (H1: p > p0), 'l' linksseitig (H1: p < p0), 'z' zweiseitig (H1: p ≠ p0)
  function testReg(n, p0, al, side) {
    const a = side === 'z' ? al / 2 : al; let L = -1, R = n + 1;
    if (side !== 'r') while (L + 1 <= n && cdf(n, p0, L + 1) <= a) L++;
    if (side !== 'l') while (R - 1 >= 0 && 1 - cdf(n, p0, R - 2) <= a + 1e-15) R--;
    const aL = L >= 0 ? cdf(n, p0, L) : 0, aR = R <= n ? 1 - cdf(n, p0, R - 1) : 0;
    return { L, R, aL, aR, act: aL + aR };
  }
  const regTex = (T, n) => { const s = []; if (T.L >= 0) s.push('\\{0,\\ldots,' + T.L + '\\}'); if (T.R <= n) s.push('\\{' + T.R + ',\\ldots,' + n + '\\}'); return s.length ? s.join('\\cup ') : '\\{\\,\\}'; };
  function testDoc(n, ps, al, side, k) {
    const d = Dif.DOC(), Q = parseQ(ps), p0 = Q ? fVal(Q) : 0.5, pt = Q ? qTex(Q) : F(p0), T = testReg(n, p0, al, side), rej = k <= T.L || k >= T.R;
    const H1 = { r: 'p>' + pt, l: 'p<' + pt, z: 'p\\ne ' + pt }[side];
    d.h('Hypothesentest (Binomialtest)');
    d.p('**1. Hypothesen:** Nullhypothese $H_0\\colon p=' + pt + '$, Gegenhypothese $H_1\\colon ' + H1 + '$ (' + { r: 'rechtsseitiger', l: 'linksseitiger', z: 'zweiseitiger' }[side] + ' Test).');
    d.p('**2. Testgrösse:** $X$ = Anzahl Treffer bei $n=' + n + '$. Falls $H_0$ stimmt, gilt $X\\sim B(' + n + ';\\,' + pt + ')$ mit $\\mu=' + F(n * p0, 3) + '$.');
    d.p('**3. Ablehnungsbereich** zum Signifikanzniveau $\\alpha=' + F(al) + '$: ' + (side === 'z' ? 'auf beiden Seiten je höchstens $\\frac{\\alpha}{2}=' + F(al / 2) + '$' : 'höchstens $\\alpha$') + ' Wahrscheinlichkeit, ganz ' + (side === 'l' ? 'links' : side === 'r' ? 'rechts' : 'aussen') + ' in der Verteilung.');
    if (T.L >= 0) d.e('P(X\\le ' + T.L + ')\\approx ' + F(T.aL, 4) + '\\le ' + F(side === 'z' ? al / 2 : al) + ',\\quad P(X\\le ' + (T.L + 1) + ')\\approx ' + F(cdf(n, p0, T.L + 1), 4));
    if (T.R <= n) d.e('P(X\\ge ' + T.R + ')\\approx ' + F(T.aR, 4) + '\\le ' + F(side === 'z' ? al / 2 : al) + ',\\quad P(X\\ge ' + (T.R - 1) + ')\\approx ' + F(1 - cdf(n, p0, T.R - 2), 4));
    d.e('K=' + regTex(T, n)).op('Ablehnungsbereich');
    if (T.L < 0 && T.R > n) d.note('Der Ablehnungsbereich ist leer: Bei so wenigen Versuchen kann $H_0$ auf diesem Niveau nie verworfen werden.');
    d.p('**4. Entscheidung:** Beobachtet wurden $k=' + k + '$ Treffer. ' + (rej ? '$k$ liegt im Ablehnungsbereich: $H_0$ wird **verworfen**; die Daten sprechen signifikant für $H_1$.' : '$k$ liegt nicht im Ablehnungsbereich: $H_0$ wird **nicht verworfen** (das beweist aber nicht, dass $H_0$ stimmt).'));
    d.note('Fehler 1. Art: $H_0$ stimmt, wird aber verworfen. Seine Wahrscheinlichkeit ist hier $' + F(T.act, 4) + '\\le\\alpha$.');
    d.res('$K=' + regTex(T, n) + ',\\ k=' + k + '\\ \\Rightarrow\\ ' + (rej ? 'H_0\\text{ verwerfen}' : 'H_0\\text{ beibehalten}') + '$');
    return d;
  }
  return { F, fr, fVal, fTex, qTex, parseQ, parseData, stats, dataDoc, tree, treeDoc, EV_TXT, evTxt, binRange, binP, cdf, QTEX, binDoc, poiPmf, poiCdf, poiP, poiIn, poiDoc, lgam, poiF, binF, limPoiDev, limPoiFac, limNormDev, limDoc, evCalc, evDoc, xTex, sigP, sigZ, sigRows, sigPct, sigX, sigXF, sigTex, sigDoc, SIG_NAME, SIG_Z, testReg, regTex, testDoc };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Pb;

// ═════════════ Bild ═════════════
const PB_HUES = [ST_B, ST_O, ST_G, ST_V, ST_R, ST_T];
// Zahlengerade ohne Gitter als Rahmen (Boxplot, Kreisdiagramm-Zelle): x-Abbildung zum Ziehen
function pbAxisFrame(S, r, win, C, title) {
  const fs = C.fs, L = r.x + fs * 2.9, R = r.x + r.w - fs * 1.0, T = r.y + fs * 2.4, B = r.y + r.h - fs * 1.9;
  const m = { L, R, T, B, win, r, X: x => L + (x - win.x0) / (win.x1 - win.x0) * (R - L), Y: () => (T + B) / 2, IX: p => win.x0 + (p - L) / (R - L) * (win.x1 - win.x0), IY: () => 0 };
  if (typeof stKeepFrame === 'function') stKeepFrame(r);
  if (title) S.rich(L, r.y + fs * 1.1, title, { size: fs * 1.05, col: 'T', al: 'l', bs: 'm' });
  const st = Stat.niceStep(win.x1 - win.x0, Math.max(3, Math.min(12, (R - L) / (fs * 4.5))));
  S.line(L, B, R, B, { col: 'L', lw: 1.4 });
  for (let k = Math.ceil(win.x0 / st - 1e-9); k * st <= win.x1 + 1e-9; k++) { const x = m.X(k * st); S.line(x, B - 3, x, B + 3, { col: 'L', lw: 1 }); S.text(x, B + fs * 1.0, stTickLabel(k * st, st).replace('-', '−'), { size: fs * 0.82, col: 'M', al: 'c', bs: 'm' }); }
  return m;
}
const pbFixWin = (C, w) => (C.fix ? { x0: C.fix.x0, x1: C.fix.x1 } : w);
// Datenanalyse: Punktdiagramm (Werte ziehbar) und darunter Boxplot, Histogramm, Säulen- oder Kreisdiagramm
function pbSceneData(S, W, H, C) {
  const st = Pb.stats(C.data), fs = C.fs, F = Pb.F, two = C.dia !== 'dot';
  const R = stLayout(W, H, [{ w: 0.68, rows: two ? [1, C.dia === 'box' ? 0.62 : 1.05] : [1] }, { w: 0.32, rows: [1] }]);
  if (!st) { stKeepFrame(R[0]); S.rich(R[0].x + fs, R[0].y + fs * 2, '\\text{Keine Daten: links Zahlen eingeben}', { size: fs, col: 'M', al: 'l', bs: 'm' }); return; }
  const sp = Math.max(st.max - st.min, 1), pad = Math.max(sp * 0.12, 0.6);
  const win = pbFixWin(C, { x0: st.min - pad, x1: st.max + pad });
  const m = difFrame(S, R[0], { x0: win.x0, x1: win.x1, y0: 0, y1: Math.max(3, st.mx + 1) }, C, { title: '\\text{Punktdiagramm (n = ' + st.n + ')}', xlab: C.unit ? '\\text{' + C.unit + '}' : 'x', ylab: '\\text{Anzahl}', ystep: st.mx > 12 ? 0 : 1 });
  S.maps.main = m;
  const seen = new Map(), dr = Math.max(3.5, Math.min(7, (m.B - m.T) / (st.mx + 1) * 0.32));
  C.data.forEach((v, i) => { const k = seen.get(v) || 0; seen.set(v, k + 1); linPt(S, m, 'd' + i, v, k + 1, C, { fill: ST_B, r: dr, hl: 'd' }); });
  const vline = (x, col, lab, hl, row, dx) => { const px = m.X(x); if (px < m.L || px > m.R) return; S.line(px, m.T, px, m.B, { col, lw: 2, dash: true }); shl(S, hl, [[px, m.T], [px, m.B]]); difLabel(S, m, px, m.T + fs * (0.9 + row * 1.3), lab, C, { dx: dx || 0, size: 0.85, hl }); };
  // Beschriftungen links/rechts der Linie versetzen, wenn Mittelwert und Median nahe beieinander liegen
  const close = Math.abs(m.X(st.mean) - m.X(st.med)) < fs * 7, side = st.mean >= st.med ? 1 : -1;
  vline(st.mean, ST_R, '\\col{r}{\\text{Mittelwert }' + F(st.mean, 2) + '}', 'mean', 0, close ? side * fs * 4.2 : 0);
  vline(st.med, ST_G, '\\col{g}{\\text{Median }' + F(st.med, 2) + '}', 'med', 1, close ? -side * fs * 4.2 : 0);
  if (two) {
    const r2 = R[1];
    if (C.dia === 'box') {
      const b = pbAxisFrame(S, r2, win, C, '\\text{Boxplot}'), h = Math.max(fs * 1.2, Math.min(fs * 3, (b.B - b.T) - fs * 3.4)), yc = b.B - fs * 1.9 - h / 2, X = b.X;
      S.line(X(st.min), yc, X(st.q1), yc, { col: 'T', lw: 1.6 }); S.line(X(st.q3), yc, X(st.max), yc, { col: 'T', lw: 1.6 });
      [st.min, st.max].forEach(v => S.line(X(v), yc - h * 0.3, X(v), yc + h * 0.3, { col: 'T', lw: 1.6 }));
      S.rect(X(st.q1), yc - h / 2, X(st.q3) - X(st.q1), h, { fill: ST_B, a: 0.18, stroke: ST_B, lw: 1.8 });
      shl(S, 'box', [[X(st.q1), yc - h / 2], [X(st.q3), yc - h / 2], [X(st.q3), yc + h / 2], [X(st.q1), yc + h / 2]], true);
      S.line(X(st.med), yc - h / 2, X(st.med), yc + h / 2, { col: ST_G, lw: 3 }); shl(S, 'med', [[X(st.med), yc - h / 2], [X(st.med), yc + h / 2]]);
      shl(S, 'q', [[X(st.q1), yc - h / 2], [X(st.q1), yc + h / 2]]); shl(S, 'q', [[X(st.q3), yc - h / 2], [X(st.q3), yc + h / 2]]);
      [[st.min, '\\text{Min}', 1], [st.q1, 'Q_1', -1], [st.med, '\\tilde{x}', 1], [st.q3, 'Q_3', -1], [st.max, '\\text{Max}', 1]].forEach(([v, t, s], i) => {
        if (t === '\\tilde{x}') t = '\\text{Median}';
        difLabel(S, b, X(v), yc + s * (h / 2 + fs * 0.9), t + '\\,' + F(v, 2), C, { size: 0.78 });
      });
    } else if (C.dia === 'hist') {
      const w = C.cw > 0 ? C.cw : Stat.niceStep(sp, 6), c0 = Math.floor(st.min / w + 1e-9) * w, nb = Math.max(1, Math.floor((st.max - c0) / w + 1e-9) + 1), cnt = new Array(nb).fill(0);
      st.a.forEach(v => { const j = Math.min(nb - 1, Math.floor((v - c0) / w + 1e-9)); cnt[j]++; });
      const hw = { x0: Math.min(win.x0, c0 - w * 0.2), x1: Math.max(win.x1, c0 + nb * w + w * 0.2) }, mx = Math.max(...cnt);
      const b = difFrame(S, r2, { x0: hw.x0, x1: hw.x1, y0: 0, y1: mx * 1.25 + 0.5 }, C, { title: '\\text{Histogramm (Klassenbreite ' + F(w) + ')}', xlab: C.unit ? '\\text{' + C.unit + '}' : 'x', ylab: '\\text{Anzahl}', ystep: mx > 12 ? 0 : 1 });
      cnt.forEach((c, j) => { const x0 = b.X(c0 + j * w), x1 = b.X(c0 + (j + 1) * w), y = b.Y(c); S.rect(x0, y, x1 - x0, b.B - y, { fill: PB_HUES[j % 2 ? 0 : 5], a: 0.45, stroke: 'T', lw: 1 }); if (c) S.text((x0 + x1) / 2, y - fs * 0.6, String(c), { size: fs * 0.85, col: 'T', al: 'c', bs: 'm' }); if (j === 0) shlBox(S, 'cls', x0, y, x1, b.B); });
    } else if (C.dia === 'bar') {
      const keys = [...st.cnt.keys()], mx = st.mx / st.n;
      const b = difFrame(S, r2, { x0: win.x0, x1: win.x1, y0: 0, y1: Math.min(1, mx * 1.3 + 0.02) }, C, { title: '\\text{Säulendiagramm (relative Häufigkeit)}', xlab: C.unit ? '\\text{' + C.unit + '}' : 'x', ylab: 'h' });
      const bw = Math.max(4, Math.min(fs * 2.2, (b.R - b.L) / Math.max(8, (win.x1 - win.x0) / Math.max(1e-9, minGap(keys)) * 1.6)));
      keys.forEach(v => { const h = st.cnt.get(v) / st.n, x = b.X(v), y = b.Y(h); S.rect(x - bw / 2, y, bw, b.B - y, { fill: ST_B, a: 0.55, stroke: ST_B, lw: 1 }); if (keys.length <= 14) S.text(x, y - fs * 0.6, F(h * 100, 1) + ' %', { size: fs * 0.72, col: 'T', al: 'c', bs: 'm' }); });
    } else if (C.dia === 'pie') {
      stKeepFrame(r2); S.rich(r2.x + fs * 2.9, r2.y + fs * 1.1, '\\text{Kreisdiagramm (Anteile)}', { size: fs * 1.05, col: 'T', al: 'l', bs: 'm' });
      const keys = [...st.cnt.keys()], rad = Math.max(10, Math.min(r2.h * 0.36, r2.w * 0.22)), cx = r2.x + r2.w * 0.32, cy = r2.y + r2.h * 0.55;
      let a0 = -Math.PI / 2;
      keys.forEach((v, j) => {
        const fr = st.cnt.get(v) / st.n, a1 = a0 + fr * 2 * Math.PI, pts = [[cx, cy]], N = Math.max(2, Math.ceil(fr * 90));
        for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N; pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]); }
        S.poly(pts, { fill: PB_HUES[j % PB_HUES.length], a: 0.75, col: 'W', lw: 1.5, close: true, noclip: true });
        const ly = r2.y + fs * 2.6 + j * fs * 1.35;
        if (ly < r2.y + r2.h - fs * 0.5) { S.rect(cx + rad + fs * 1.5, ly - fs * 0.4, fs * 0.8, fs * 0.8, { fill: PB_HUES[j % PB_HUES.length], a: 0.75 }); S.rich(cx + rad + fs * 2.7, ly, F(v) + ':\\ ' + F(fr * 100, 1) + '\\,\\%\\ (' + F(fr * 360, 1) + '°)', { size: fs * 0.82, col: 'T', al: 'l', bs: 'm' }); }
        a0 = a1;
      });
    }
  }
  const L = [{ s: 'n=' + st.n }, { s: '\\col{r}{\\text{Mittelwert } ' + F(st.mean, 3) + '}', hl: 'mean' }, { s: '\\col{g}{\\text{Median } ' + F(st.med, 3) + '}', hl: 'med' },
    { s: '\\text{Modus } ' + (st.modes.length ? st.modes.map(v => F(v)).join(';\\ ') : '\\text{–}') }, { s: '\\text{Spannweite } ' + F(st.max - st.min) },
    { s: 'Q_1=' + F(st.q1) + ',\\ Q_3=' + F(st.q3), hl: 'q' }, { s: '\\sigma\\approx ' + F(st.sd, 3) }];
  difLines(S, R[two ? 2 : 1], L, C, { max: fs * 1.1 });
}
function minGap(keys) { const k = keys.slice().sort((a, b) => a - b); let g = Infinity; for (let i = 1; i < k.length; i++) g = Math.min(g, k[i] - k[i - 1]); return isFinite(g) ? g : 1; }

// Baumdiagramm
function pbSceneTree(S, W, H, C) {
  const fs = C.fs, n = C.tn, T = Pb.tree(C.tr, C.tb, n, C.tk === 'mit', C.te, C.tkk), F = Pb.F;
  const R = stLayout(W, H, [{ w: 0.7, rows: [1] }, { w: 0.3, rows: [1] }]), r = R[0];
  stKeepFrame(r);
  S.rich(r.x + fs * 0.5, r.y + fs * 1.1, '\\text{Urne: }\\col{r}{' + C.tr + '\\text{ rot}},\\ \\col{b}{' + C.tb + '\\text{ blau}};\\ ' + n + '\\text{ Züge ' + (C.tk === 'mit' ? 'mit' : 'ohne') + ' Zurücklegen}', { size: fs * 1.0, col: 'T', al: 'l', bs: 'm' });
  const leafW = fs * (n === 3 ? 9.5 : 8.5), x0 = r.x + fs * 1.2, dx = (r.w - leafW - fs * 2.2) / n, top = r.y + fs * 2.8, slots = Math.pow(2, n), sh = (r.y + r.h - fs * 0.8 - top) / slots;
  const idx = s => s.split('').reduce((a, c) => a * 2 + (c === 'b' ? 1 : 0), 0);
  const pos = s => { const d = s.length, span = Math.pow(2, n - d), i0 = idx(s) * span; return [x0 + d * dx, top + (i0 + span / 2) * sh]; };
  const ball = (x, y, c, rr) => S.circ(x, y, rr, { fill: c === 'r' ? ST_R : ST_B, stroke: 'W', lw: 1.5 });
  S.circ(pos('')[0], pos('')[1], 4, { fill: 'T' });
  const sz = Math.max(0.62, Math.min(0.85, sh / fs * 0.5));
  // Animation (C.treeStep): die Pfade des Ereignisses leuchten nacheinander auf, ihre Produkte werden addiert
  const EA = T.paths.filter(p => p.inE), stp = typeof C.treeStep === 'number' ? C.treeStep : null, shown = stp === null ? EA : EA.slice(0, stp + 1), cur = stp === null ? null : EA[stp] || null;
  const lit = s2 => shown.some(p => p.s.indexOf(s2) === 0), isCur = s2 => !!cur && cur.s.indexOf(s2) === 0;
  T.edges.forEach(e => {
    const [ax, ay] = pos(e.from), [bx, by] = pos(e.to), g = e.inE && lit(e.to);
    S.line(ax, ay, bx - 9, by, { col: g ? ST_G : 'M', lw: g ? (isCur(e.to) ? 4.6 : 3) : 1.4, a: g ? 0.9 : 0.8 });
    if (g) shl(S, 'ev', [[ax, ay], [bx, by]]);
    const t = 0.55, mx = ax + (bx - ax) * t, my = ay + (by - ay) * t;
    S.rich(mx, my + (e.c === 'r' ? -1 : 1) * fs * 0.95, Pb.fTex(e.q), { size: fs * sz, col: 'T', al: 'c', bs: 'm' });
    ball(bx, by, e.c, Math.max(5, Math.min(8, sh * 0.28)));
  });
  T.paths.forEach((p, i) => {
    const [x, y] = pos(p.s), lx = x + fs * 1.1;
    const lab = p.s.split('').map(c => (c === 'r' ? '\\col{r}{r}' : '\\col{b}{b}')).join('') + ':\\ ' + Pb.fTex(p.p);
    const on = p.inE && shown.indexOf(p) >= 0;
    S.rich(lx, y, on ? '\\col{g}{' + lab + '}' : lab, { size: fs * sz * 1.05, col: 'T', al: 'l', bs: 'm', bold: on });
    if (on) shlBox(S, 'ev', lx - 3, y - fs * 0.9, lx + fs * 6.5, y + fs * 0.9);
    if (i === T.paths.findIndex(q => q.inE)) { const pts = []; for (let d = 0; d <= n; d++) pts.push(pos(p.s.slice(0, d))); shl(S, 'path', pts); }
  });
  const E = T.paths.filter(p => p.inE), ev = Pb.evTxt(C.te, C.tkk), part = stp !== null && shown.length < E.length;
  const curQ = cur ? T.edges.filter(e => cur.s.indexOf(e.to) === 0).sort((p, q) => p.to.length - q.to.length).map(e => Pb.fTex(e.q)) : [];
  difLines(S, R[1], [{ s: '\\text{Ereignis E: ' + ev + '}' }, { s: '\\text{Pfade: ' + (shown.length ? shown.map(p => p.s).join(', ') : '–') + (part ? ', …' : '') + '}', hl: 'ev' },
    cur ? { s: '\\col{v}{\\text{Pfad ' + cur.s + ': }' + curQ.join('\\cdot ') + '=' + Pb.fTex(cur.p) + '}' } : null,
    { s: 'P(E)=' + (shown.length ? shown.map(p => Pb.fTex(p.p)).join('+') : '0') + (part ? '+\\ldots' : '') }, part ? null : { s: '\\col{g}{=' + Pb.fTex(T.PE) + '\\approx ' + F(Pb.fVal(T.PE) * 100, 2) + '\\,\\%}', bold: true }], C, { max: fs * 1.1 });
}
// Balken einer Binomialverteilung; col(k) → Farbe
function pbBars(S, m, n, p, col) { pbBarsOf(S, m, n, k => Stat.binomPmf(n, p, k), col); }
// Säulen einer diskreten Verteilung (pmf: k → Wahrscheinlichkeit) für k = 0 … n
function pbBarsOf(S, m, n, pmf, col) {
  const w = Math.max(1.5, Math.min((m.X(1) - m.X(0)) * 0.78, 60));
  for (let k = Math.max(0, Math.ceil(m.win.x0)); k <= Math.min(n, Math.floor(m.win.x1)); k++) { const y = m.Y(pmf(k)), x = m.X(k); if (m.B - y > 0.3) { S.rect(x - w / 2, y, w, m.B - y, { fill: 'W' }); } if (m.B - y > 0.3) S.rect(x - w / 2, y, w, m.B - y, { fill: col(k), a: col(k) === ST_B ? 0.35 : 0.8, stroke: col(k), lw: 0.8 }); }
}
function pbBinWin(n, p, C) {
  const mu = n * p, sg = Math.sqrt(n * p * (1 - p)), lo = n <= 40 ? -0.7 : Math.max(-0.7, Math.floor(mu - 4.5 * sg) - 0.7), hi = n <= 40 ? n + 0.7 : Math.min(n + 0.7, Math.ceil(mu + 4.5 * sg) + 0.7);
  let mx = 0; for (let k = 0; k <= n; k++) mx = Math.max(mx, Stat.binomPmf(n, p, k));
  const w = pbFixWin(C, { x0: lo, x1: hi }); return { x0: w.x0, x1: w.x1, y0: 0, y1: mx * 1.28 };
}
function pbSceneBin(S, W, H, C) {
  const fs = C.fs, F = Pb.F, Q = Pb.parseQ(C.bp), p = Q ? Pb.fVal(Q) : 0.5, n = C.bn, [a, b] = Pb.binRange(n, C.bq, C.bk, C.bk2), P = Pb.binP(n, p, C.bq, C.bk, C.bk2), tx = Pb.QTEX[C.bq](C.bk, C.bk2);
  const R = stLayout(W, H, [{ w: 0.66, rows: [1] }, { w: 0.34, rows: [1] }]);
  const win = pbBinWin(n, p, C), m = difFrame(S, R[0], win, C, { title: 'X\\sim B(' + n + ';\\,' + (Q ? Pb.qTex(Q) : F(p)) + ')', info: C.binAnim ? '' : '\\col{g}{' + tx + '\\approx ' + F(P, 4) + '}', xlab: 'k', ylab: 'P(X=k)' });
  S.maps.main = m;
  if (C.binAnim) {
    // Animation «n wächst»: nur die Verteilung, darüber die Glockenkurve mit gleichem μ und σ
    pbBars(S, m, n, p, () => ST_B);
    const mu2 = n * p, sg2 = Math.sqrt(n * p * (1 - p));
    if (sg2 > 0.5) difCurve(S, m, x => Math.exp(-0.5 * Math.pow((x - mu2) / sg2, 2)) / (sg2 * Math.sqrt(2 * Math.PI)), { col: ST_R, lw: 2 });
    difLines(S, R[1], [{ s: 'n=' + n, bold: true, col: ST_B }, { s: '\\col{r}{\\mu=n\\cdot p\\approx ' + F(mu2, 2) + '}' }, { s: '\\col{r}{\\sigma=\\sqrt{n\\cdot p\\cdot(1-p)}\\approx ' + F(sg2, 2) + '}' }, null,
      { s: '\\text{Je grösser } n\\text{, desto besser passt die}' }, { s: '\\col{r}{\\text{Glockenkurve (Normalverteilung).}}' }], C, { max: fs * 1.1 });
    return;
  }
  pbBars(S, m, n, p, k => (k >= a && k <= b ? ST_G : ST_B));
  shlBox(S, 'ev', m.X(Math.max(a, win.x0) - 0.45), m.T, m.X(Math.min(b, win.x1) + 0.45), m.B);
  const mu = n * p, sg = Math.sqrt(n * p * (1 - p)), ym = m.T + fs * 2.6;
  if (m.X(mu) > m.L && m.X(mu) < m.R) { S.line(m.X(mu), ym, m.X(mu), m.B, { col: ST_R, lw: 1.6, dash: true }); shl(S, 'mu', [[m.X(mu), ym], [m.X(mu), m.B]]); }
  S.line(m.X(mu - sg), ym, m.X(mu + sg), ym, { col: ST_R, lw: 2 }); shl(S, 'sig', [[m.X(mu - sg), ym], [m.X(mu + sg), ym]]);
  difLabel(S, m, m.X(mu), ym - fs * 0.9, '\\col{r}{\\mu\\pm\\sigma}', C, { size: 0.85 });
  linPt(S, m, 'k', C.bk, 0, C, { fill: ST_O, r: 6.5, hl: 'k' });
  if (C.bq === 'bt') linPt(S, m, 'k2', C.bk2, 0, C, { fill: ST_O, r: 6.5, hl: 'k' });
  const pt = Q ? Pb.qTex(Q) : F(p), qt = Q ? Pb.qTex(Pb.fr(Q.d - Q.n, Q.d)) : F(1 - p);
  difLines(S, R[1], [{ s: 'P(X=k)=\\binom{' + n + '}{k}\\cdot\\left(' + pt + '\\right)^k\\cdot\\left(' + qt + '\\right)^{' + n + '-k}' }, null, { s: '\\col{g}{' + tx + '\\approx ' + F(P, 4) + '}', bold: true, hl: 'ev' },
    { s: '\\col{r}{\\mu=n\\cdot p\\approx ' + F(mu, 2) + '}', hl: 'mu' }, { s: '\\col{r}{\\sigma=\\sqrt{n\\cdot p\\cdot(1-p)}\\approx ' + F(sg, 2) + '}', hl: 'sig' }], C, { max: fs * 1.1 });
}
// ── Poissonverteilung: Säulen, gesuchter Bereich grün, μ ± σ; auf Wunsch B(n; λ/n) als rote Kurve zum Vergleich ──
function pbScenePoi(S, W, H, C) {
  const fs = C.fs, F = Pb.F, lam = C.pr * C.pt, q = C.pq, k = C.pk, k2 = C.pk2, P = Pb.poiP(lam, q, k, k2), tx = Pb.QTEX[q](k, k2), sg = Math.sqrt(lam);
  const n = C.pn, cmp = C.pcmp && n > lam, pb = cmp ? lam / n : 0;
  const R = stLayout(W, H, [{ w: 0.66, rows: [1] }, { w: 0.34, rows: [1] }]);
  const kmax = Math.max(6, Math.ceil(lam + 4.5 * sg), k + 1, q === 'bt' ? k2 + 1 : 0);
  let mx = 0; for (let j = 0; j <= kmax; j++) mx = Math.max(mx, Pb.poiPmf(lam, j), cmp && j <= n ? Stat.binomPmf(n, pb, j) : 0);
  const w = pbFixWin(C, { x0: -0.7, x1: kmax + 0.7 }), win = { x0: w.x0, x1: w.x1, y0: 0, y1: mx * 1.28 };
  const m = difFrame(S, R[0], win, C, { title: 'X\\sim \\text{Poisson}(\\lambda=' + F(lam, 4) + ')', info: '\\col{g}{' + tx + '\\approx ' + F(P, 4) + '}', xlab: 'k', ylab: 'P(X=k)' });
  S.maps.main = m;
  const K1 = Math.floor(win.x1);
  pbBarsOf(S, m, K1, j => Pb.poiPmf(lam, j), j => (Pb.poiIn(q, k, k2, j) ? ST_G : ST_B));
  { const a = q === 'le' ? 0 : q === 'bt' ? Math.min(k, k2) : k, b = q === 'ge' ? K1 : q === 'bt' ? Math.max(k, k2) : k; shlBox(S, 'ev', m.X(Math.max(a, win.x0) - 0.45), m.T, m.X(Math.min(b, win.x1) + 0.45), m.B); }
  if (cmp) {                                                           // Binomialverteilung mit gleichem Mittelwert: glatte Kurve durch ihre Werte
    difCurve(S, m, x => Pb.binF(n, pb, x), { col: ST_R, lw: 2.2, hl: 'bin', exp: C.exp });
  }
  const ym = m.T + fs * 2.6;
  if (m.X(lam) > m.L && m.X(lam) < m.R) { S.line(m.X(lam), ym, m.X(lam), m.B, { col: ST_R, lw: 1.6, dash: true }); shl(S, 'mu', [[m.X(lam), ym], [m.X(lam), m.B]]); }
  S.line(Math.max(m.L, m.X(lam - sg)), ym, Math.min(m.R, m.X(lam + sg)), ym, { col: ST_R, lw: 2 }); shl(S, 'sig', [[Math.max(m.L, m.X(lam - sg)), ym], [Math.min(m.R, m.X(lam + sg)), ym]]);
  difLabel(S, m, m.X(lam), ym - fs * 0.9, '\\col{r}{\\mu\\pm\\sigma}', C, { size: 0.85 });
  linPt(S, m, 'pk', k, 0, C, { fill: ST_O, r: 6.5, hl: 'k' }); if (q === 'bt') linPt(S, m, 'pk2', k2, 0, C, { fill: ST_O, r: 6.5, hl: 'k' });
  const L = [{ s: 'P(X=k)=\\frac{\\lambda^k}{k!}\\cdot e^{-\\lambda},\\quad\\lambda=' + F(lam, 4) }, null];
  L.push({ s: '\\col{g}{' + tx + '\\approx ' + F(P, 4) + '}', bold: true, hl: 'ev' }, { s: '\\col{g}{=' + F(P * 100, 2) + '\\,\\%}', hl: 'ev' });
  L.push({ s: '\\col{r}{\\mu=\\lambda=' + F(lam, 4) + '}', hl: 'mu' }, { s: '\\col{r}{\\sigma=\\sqrt{\\lambda}\\approx ' + F(sg, 2) + '}', hl: 'sig' });
  if (cmp) L.push(null, { s: '\\col{r}{B(' + n + ';\\,' + F(pb, 4) + ')\\text{: }' + F(Pb.binP(n, pb, q, Math.min(k, n), Math.min(k2, n)), 4) + '}', hl: 'bin' }, { s: '\\text{gleicher Mittelwert } n\\cdot p=\\lambda', size: 0.85 });
  difLines(S, R[1], L, C, { max: fs * 1.1 });
}
// ── Grenzübergänge: Säulen der Binomialverteilung (blau) und die Grenzverteilung (rot) ──
// 'poi': B(n; λ/n) gegen die Kurve λ^k/k!·e^(−λ) über k. 'norm': standardisierte Säulen (Breite 1/σ, Höhe σ·P) gegen die Glockenkurve φ(z).
function pbSceneLim(S, W, H, C) {
  const fs = C.fs, F = Pb.F, n = C.ln, R = stLayout(W, H, [{ w: 0.66, rows: [1] }, { w: 0.34, rows: [1] }]);
  if (C.lm === 'poi') {
    const lam = C.ll, p = lam / n, k = C.lk, sg = Math.sqrt(lam), kmax = Math.max(6, Math.ceil(lam + 4.5 * sg), k + 1);
    // Höhe so, dass auch die Binomialverteilung mit dem kleinsten n Platz hat: Der Massstab bleibt beim Wachsen von n fest
    const n0 = Math.floor(lam) + 1; let mx = 0; for (let j = 0; j <= kmax; j++) mx = Math.max(mx, Pb.poiPmf(lam, j), Stat.binomPmf(n0, lam / n0, j), Stat.binomPmf(n, p, j));
    const w = pbFixWin(C, { x0: -0.7, x1: kmax + 0.7 }), win = { x0: w.x0, x1: w.x1, y0: 0, y1: mx * 1.2 }, dev = Pb.limPoiDev(lam, n);
    const m = difFrame(S, R[0], win, C, { title: '\\col{b}{B(' + n + ';\\,' + F(p, 4) + ')}\\ \\to\\ \\col{r}{\\text{Poisson}(' + F(lam, 4) + ')}', info: '\\text{grösste Abweichung } ' + F(dev, 4), xlab: 'k', ylab: 'P(X=k)' });
    S.maps.main = m;
    const K1 = Math.floor(win.x1);
    pbBarsOf(S, m, Math.min(n, K1), j => Stat.binomPmf(n, p, j), j => (j === k ? ST_O : ST_B));
    shlBox(S, 'bars', m.L, m.T, m.R, m.B);
    // Poissonverteilung als glatte Kurve λ^k/k! · e^(−λ) (k! = Γ(k + 1) zwischen den ganzen Zahlen)
    difCurve(S, m, x => Pb.poiF(lam, x), { col: ST_R, lw: 2.4, hl: 'lim', exp: C.exp });
    S.rich(m.R - fs * 0.7, m.T + fs * 1.7, '\\col{r}{\\frac{\\lambda^{k}}{k!}\\cdot e^{-\\lambda}}', { size: fs * 1.05, col: 'T', al: 'r', bs: 'm' });
    linPt(S, m, 'lk', k, 0, C, { fill: ST_O, r: 6.5, hl: 'k' });
    const fc = Pb.limPoiFac(lam, n, k), pb = k <= n ? Stat.binomPmf(n, p, k) : 0;
    difLines(S, R[1], [{ s: '\\col{b}{n=' + n + ',\\quad p=\\frac{\\lambda}{n}=' + F(p, 4) + '}', bold: true, hl: 'n' }, { s: 'n\\cdot p=\\lambda=' + F(lam, 4) + '\\ \\text{bleibt fest}', size: 0.9 }, null,
      { s: '\\frac{n(n-1)\\cdots(n-k+1)}{n^k}=' + F(fc.prod, 4) + '\\ \\to\\ 1', size: 0.9 }, { s: '\\left(1-\\frac{\\lambda}{n}\\right)^{n}=' + F(fc.pow, 4) + '\\ \\to\\ e^{-\\lambda}=' + F(Math.exp(-lam), 4), size: 0.9 }, { s: '\\left(1-\\frac{\\lambda}{n}\\right)^{-k}=' + F(fc.rest, 4) + '\\ \\to\\ 1', size: 0.9 }, null,
      { s: '\\col{o}{k=' + k + '}:\\ \\col{b}{' + F(pb, 4) + '}\\ \\to\\ \\col{r}{\\frac{\\lambda^k}{k!}e^{-\\lambda}=' + F(Pb.poiPmf(lam, k), 4) + '}', bold: true, hl: 'k' }], C, { max: fs * 1.05 });
    return;
  }
  const Q = Pb.parseQ(C.lp), p = Q ? Pb.fVal(Q) : 0.5, mu = n * p, sg = Math.sqrt(n * p * (1 - p)), xm = 4.2, g = t => Stat.normPdf(t, 0, 1), dev = Pb.limNormDev(n, p);
  const r0 = { x: R[0].x, y: R[0].y, w: R[0].w, h: R[0].h - fs * 1.25 };
  const m = difFrame(S, r0, { x0: -xm, x1: xm, y0: 0, y1: Math.max(0.56, Math.min(1.4, sg * Stat.binomPmf(n, p, Math.round(mu)) * 1.15)) }, C, { title: '\\col{b}{B(' + n + ';\\,' + (Q ? Pb.qTex(Q) : F(p)) + ')}\\ \\to\\ \\col{r}{\\text{Normalverteilung}}', info: '\\text{grösste Abweichung } ' + F(dev, 4),
    xstep: 1, xfmt: j => (Math.abs(j) < 1e-9 ? '\\mu' : (j < 0 ? '-' : '+') + (Math.abs(Math.abs(j) - 1) < 1e-9 ? '' : F(Math.abs(j))) + '\\sigma'), xlab: '\\ ', ylab: '\\ ', ystep: 1 });
  S.maps.main = m;
  for (let j = -4; j <= 4; j++) S.rich(m.X(j), m.B + fs * 2.15, 'k=' + F(mu + j * sg, sg >= 10 ? 0 : 1), { size: fs * 0.72, col: 'T', al: 'c', bs: 'm' });
  // Säulen: Breite 1/σ, Höhe σ·P(X = k) — die Fläche jeder Säule ist P(X = k)
  const bw = (m.X(1) - m.X(0)) / sg, k0 = Math.max(0, Math.floor(mu - xm * sg)), k1 = Math.min(n, Math.ceil(mu + xm * sg));
  for (let k = k0; k <= k1; k++) {
    const z = (k - mu) / sg, x0 = Math.max(m.L, m.X(z) - bw / 2), x1 = Math.min(m.R, m.X(z) + bw / 2), y = Math.max(m.T, m.Y(sg * Stat.binomPmf(n, p, k)));
    if (x1 - x0 > 0.2 && m.B - y > 0.3) S.rect(x0, y, x1 - x0, m.B - y, { fill: ST_B, a: 0.38, stroke: bw > 3 ? ST_B : null, lw: 0.7 });
  }
  shlBox(S, 'bars', m.L, m.T, m.R, m.B);
  difCurve(S, m, g, { col: ST_R, lw: 2.4, hl: 'lim', exp: C.exp });
  difLines(S, R[1], [{ s: '\\col{b}{n=' + n + ',\\quad p=' + (Q ? Pb.qTex(Q) : F(p)) + '}', bold: true, hl: 'n' }, { s: '\\mu=n\\,p=' + F(mu, 2) + ',\\quad \\sigma=\\sqrt{n\\,p\\,(1-p)}\\approx ' + F(sg, 2), size: 0.9 }, null,
    { s: '\\text{Säulenbreite } \\frac{1}{\\sigma}\\approx ' + F(1 / sg, 3) + '\\ \\to\\ 0', hl: 'bars' }, { s: '\\text{Säulenhöhe } \\sigma\\cdot P(X=k)', size: 0.9 }, { s: '\\text{Fläche jeder Säule} = P(X=k)', size: 0.9 }, null,
    { s: '\\col{r}{\\varphi(z)=\\frac{1}{\\sqrt{2\\pi}}\\,e^{-\\frac{z^2}{2}},\\quad z=\\frac{k-\\mu}{\\sigma}}', hl: 'lim' }, { s: sg > 3 ? '\\col{g}{\\sigma>3\\text{: Näherung brauchbar}}' : '\\col{o}{\\sigma\\le 3\\text{: noch zu grob}}', size: 0.9 }], C, { max: fs * 1.05 });
}
function pbSceneTest(S, W, H, C) {
  const fs = C.fs, F = Pb.F, Q = Pb.parseQ(C.hp), p0 = Q ? Pb.fVal(Q) : 0.5, n = C.hn, T = Pb.testReg(n, p0, C.hal, C.hs), k = C.hk, rej = k <= T.L || k >= T.R, pt = Q ? Pb.qTex(Q) : F(p0);
  const R = stLayout(W, H, [{ w: 0.66, rows: [1] }, { w: 0.34, rows: [1] }]);
  const win = pbBinWin(n, p0, C), m = difFrame(S, R[0], win, C, { title: '\\text{unter } H_0:\\ X\\sim B(' + n + ';\\,' + pt + ')', xlab: 'k', ylab: 'P(X=k)' });
  S.maps.main = m;
  pbBars(S, m, n, p0, j => (j <= T.L || j >= T.R ? ST_R : ST_B));
  if (T.L >= 0) shlBox(S, 'rej', m.X(Math.max(-0.45, win.x0)), m.T, m.X(Math.min(T.L, win.x1) + 0.45), m.B);
  if (T.R <= n) shlBox(S, 'rej', m.X(Math.max(T.R, win.x0) - 0.45), m.T, m.X(Math.min(n + 0.45, win.x1)), m.B);
  const px = m.X(k);
  if (px >= m.L && px <= m.R) { S.line(px, m.T + fs * 1.6, px, m.B, { col: ST_O, lw: 2.2 }); difLabel(S, m, px, m.T + fs * 0.9, '\\col{o}{k=' + k + '}', C, { size: 0.9 }); }
  linPt(S, m, 'k', k, 0, C, { fill: ST_O, r: 6.5, hl: 'k' });
  const H1 = { r: 'p>' + pt, l: 'p<' + pt, z: 'p\\ne ' + pt }[C.hs];
  difLines(S, R[1], [{ s: 'H_0:\\ p=' + pt + ',\\quad H_1:\\ ' + H1 }, { s: '\\alpha=' + F(C.hal) + ',\\ n=' + n }, null,
    { s: '\\col{r}{\\text{Ablehnungsbereich}}', hl: 'rej' }, { s: '\\col{r}{K=' + Pb.regTex(T, n) + '}', hl: 'rej' }, { s: '\\text{tatsächlich: } P\\approx ' + F(T.act, 4), size: 0.9 }, null,
    { s: '\\col{o}{k=' + k + '}\\ \\Rightarrow\\ ' + (rej ? '\\col{r}{H_0\\text{ verwerfen}}' : '\\col{g}{H_0\\text{ nicht verwerfen}}'), bold: true, hl: 'k' }], C, { max: fs * 1.1 });
}
// ── Normalverteilung: Glockenkurve in Einheiten von σ (darunter die wirklichen Werte), gesuchte Fläche, Anteile der σ-Streifen und Ablesetabelle ──
function pbSceneNorm(S, W, H, C) {
  const fs = C.fs, F = Pb.F, mu = C.sm, s = C.ss, q = C.sq, z = C.sz, z2 = C.sz2, za = Math.abs(z), two = q === 'in' || q === 'out', bt = q === 'bt', P = Pb.sigP(q, z, z2), pc = Pb.sigPct;
  const std = Math.abs(mu) < 1e-12 && Math.abs(s - 1) < 1e-12, un = C.sunit ? '\\,\\text{' + C.sunit + '}' : '';   // Einheit steht im Titel (unten rechts kollidiert sie mit der Grenze)
  const R = stLayout(W, H, [{ w: 0.62, rows: [1] }, { w: 0.38, rows: [1] }]);
  const r0 = std ? R[0] : { x: R[0].x, y: R[0].y, w: R[0].w, h: R[0].h - fs * 1.25 };   // Platz für die zweite Zeile mit den wirklichen Werten
  const xm = Math.max(4.2, Math.min(6.2, Math.max(za, bt ? Math.abs(z2) : 0) + 0.5)), g = t => Stat.normPdf(t, 0, 1), top = g(0);
  const m = difFrame(S, r0, { x0: -xm, x1: xm, y0: 0, y1: top * 1.34 }, C, { title: std ? '\\text{Standardnormalverteilung}' : '\\mu=' + F(mu) + un + ',\\ \\sigma=' + F(s) + un, info: '\\col{g}{' + (q === 'out' && std ? 'P(|X|\\ge ' + F(za, 3) + ')' : Pb.sigTex(q, z, mu, s, z2)) + '\\approx ' + pc(P) + '\\,\\%}',
    xstep: 1, xfmt: j => (Math.abs(j) < 1e-9 ? '\\mu' : (j < 0 ? '-' : '+') + (Math.abs(Math.abs(j) - 1) < 1e-9 ? '' : F(Math.abs(j))) + '\\sigma'), xlab: std ? 'z' : '\\ ', ylab: '\\ ', ystep: 1 });
  S.maps.main = m;
  if (!std) for (let j = -Math.floor(xm); j <= Math.floor(xm); j++) S.rich(m.X(j), m.B + fs * 2.15, Pb.sigXF(mu, s, j), { size: fs * 0.8, col: 'T', al: 'c', bs: 'm' });
  const area = (a, b) => { a = Math.max(a, -xm); b = Math.min(b, xm); if (!(b > a)) return; const pts = [[m.X(a), m.B]], n = Math.max(12, Math.round((b - a) * 24)); for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n; pts.push([m.X(t), m.Y(g(t))]); } pts.push([m.X(b), m.B]); S.poly(pts, { fill: ST_G, a: 0.38, col: ST_G, lw: 0.8, close: true }); shl(S, 'area', pts, true); };
  if (q === 'l') area(-xm, z); else if (q === 'r') area(z, xm); else if (bt) area(Math.min(z, z2), Math.max(z, z2)); else if (q === 'in') area(-za, za); else { area(-xm, -za); area(za, xm); }
  // Anteile der σ-Streifen (zum Ablesen): 34.1 | 13.6 | 2.1 | 0.1 %
  if (C.sbands) {
    for (let j = -3; j <= 3; j++) { const x = m.X(j); S.line(x, m.Y(g(j)), x, m.B, { col: 'M', lw: 1, dash: true }); }
    const lab = (t, y, txt) => { S.rich(m.X(t), m.Y(y), txt, { size: fs * 0.74, col: 'M', al: 'c', bs: 'm' }); shlC(S, 'bands', m.X(t), m.Y(y), fs * 1.3); };
    [-1, 1].forEach(sg => { lab(sg * 0.5, 0.13, '34.1\\,\\%'); lab(sg * 1.5, 0.045, '13.6\\,\\%'); lab(sg * 2.52, g(2.5) + 0.03, '2.1\\,\\%'); lab(sg * 3.55, 0.03, '0.1\\,\\%'); });
  }
  difCurve(S, m, g, { col: 'T', lw: 2.4, hl: 'f', exp: C.exp });
  // Grenzen: Linie bis zur Kurve, Griff auf der Achse, Beschriftung mit z und (falls μ, σ gegeben) dem wirklichen Wert
  const bound = (id, t) => {
    const x = m.X(t); S.line(x, m.Y(g(t)), x, m.B, { col: ST_O, lw: 2 });
    linPt(S, m, id, t, 0, C, { fill: ST_O, r: 6.5, hl: 'z', lab: '\\col{o}{' + (std ? 'z=' + F(t, 3) : Pb.sigXF(mu, s, t)) + '}', dy: -fs * 1.15, dx: fs * 1.9 * (q === 'l' ? 1 : q === 'r' ? -1 : bt ? (t <= Math.min(z, z2) ? -1 : 1) : q === 'in' ? (t < 0 ? -1 : 1) : (t < 0 ? 1 : -1)) });   // Beschriftung neben, nicht in der grünen Fläche
  };
  if (two) { bound('sz2', -za); bound('sz', za); } else if (bt) { bound('sz', z); bound('szb', z2); } else bound('sz', z);
  // Ergebnis gross im Bild: über der Glocke (innen), in den freien Ecken (links / rechts / aussen)
  const big = (px, txt, al) => S.rich(px, m.T + fs * 1.5, '\\col{g}{' + txt + '}', { size: fs * 1.25, col: 'T', al, bs: 'm', bold: true });
  const yl = m.T + fs * 3.1, sub = (px, txt, al) => S.rich(px, yl, txt, { size: fs * 0.82, col: 'M', al, bs: 'm' });
  if (q === 'in' || bt) { big(m.X(0), pc(P) + '\\,\\%', 'c'); }
  else if (q === 'out') { big(m.L + fs * 2.6, pc(P / 2) + '\\,\\%', 'l'); big(m.R - fs * 0.8, pc(P / 2) + '\\,\\%', 'r'); sub(m.L + fs * 2.6, '\\text{links}', 'l'); sub(m.R - fs * 0.8, '\\text{rechts}', 'r'); }
  else if (q === 'l') { big(m.L + fs * 2.6, pc(P) + '\\,\\%', 'l'); sub(m.L + fs * 2.6, '\\text{links der Grenze}', 'l'); }
  else { big(m.R - fs * 0.8, pc(P) + '\\,\\%', 'r'); sub(m.R - fs * 0.8, '\\text{rechts der Grenze}', 'r'); }
  // ── rechts: Ablesetabelle ──
  const r1 = R[1]; if (!r1) return;
  const rows = Pb.sigRows(z, q), cols = ['l', 'r', 'in', 'out'], heads = ['\\text{links}', '\\text{rechts}', '\\text{innen}', '\\text{aussen}'];
  const tf = Math.min(fs * 0.92, r1.w / 21), rh = Math.min(tf * 2.0, (r1.h - tf * 2.6) / (rows.length + 6.5));
  const cw = [0.17, 0.215, 0.2, 0.215, 0.2].map(v => v * r1.w), cx = i => r1.x + cw.slice(0, i + 1).reduce((a, b) => a + b, 0) - tf * 0.35;
  let y = r1.y + tf * 1.2;
  S.rich(r1.x + tf * 0.3, y, '\\text{Anteile in Prozent, } z=\\text{Anzahl }\\sigma', { size: tf * 0.95, col: 'T', al: 'l', bs: 'm', bold: true }); y += rh * 1.25;
  const ci = cols.indexOf(q);
  if (ci >= 0) S.rect(cx(ci + 1) - cw[ci + 1] + tf * 0.45, y - rh * 0.55, cw[ci + 1] - tf * 0.2, rh * (rows.length + 1), { fill: ST_G, a: 0.13, stroke: ST_G, lw: 0.6 });   // Spalte der gewählten Art
  S.rich(cx(0), y, 'z', { size: tf, col: 'M', al: 'r', bs: 'm' }); heads.forEach((h, i) => S.rich(cx(i + 1), y, i === ci ? '\\col{g}{' + h + '}' : h, { size: tf * 0.9, col: 'M', al: 'r', bs: 'm', bold: i === ci }));
  S.line(r1.x + tf * 0.2, y + rh * 0.5, r1.x + r1.w - tf * 0.2, y + rh * 0.5, { col: 'L', lw: 1 }); y += rh;
  rows.forEach(r => {
    if (r.cur) { S.rect(r1.x + tf * 0.2, y - rh * 0.5, r1.w - tf * 0.4, rh, { fill: ST_O, a: 0.16, stroke: ST_O, lw: 0.6 }); shl(S, 'z', [[r1.x + tf * 0.2, y], [r1.x + r1.w - tf * 0.2, y]]); }
    S.rich(cx(0), y, (r.cur ? '\\col{o}{' : '{') + F(r.z, 3) + '}', { size: tf, col: 'T', al: 'r', bs: 'm', bold: r.cur });
    cols.forEach((c, i) => S.rich(cx(i + 1), y, (i === ci ? '\\col{g}{' : '{') + pc(r[c]) + '}', { size: tf, col: 'T', al: 'r', bs: 'm', bold: r.cur && i === ci }));
    y += rh;
  });
  y += rh * 0.3;
  const L = [{ s: '\\text{links: }X\\le\\mu+z\\sigma\\qquad\\text{rechts: }X\\ge\\mu+z\\sigma', size: 0.8 }, { s: '\\text{innen: }\\mu-z\\sigma\\le X\\le\\mu+z\\sigma\\qquad\\text{aussen: der Rest}', size: 0.8 }, null];
  const zf = (nm, v) => '\\col{o}{' + nm + '=\\frac{' + Pb.sigXF(mu, s, v) + '-' + F(mu) + '}{' + F(s) + '}\\approx ' + F(v, 3) + '}';
  if (bt) { if (!std) L.push({ s: zf('z_1', Math.min(z, z2)), hl: 'z' }, { s: zf('z_2', Math.max(z, z2)), hl: 'z' }); }
  else if (!std) L.push(C.sdir === 'x' && !two ? { s: zf('z', z), hl: 'z' } : { s: '\\col{o}{' + (two ? 'x=\\mu\\pm ' + F(za, 3) + '\\sigma=' + F(mu) + '\\pm ' + F(za * s, 3) : 'x=\\mu' + (z < 0 ? '-' : '+') + F(za, 3) + '\\sigma=' + Pb.sigXF(mu, s, z)) + '}', hl: 'z' });
  L.push({ s: '\\col{g}{' + (q === 'out' ? 'P(|X-\\mu|\\ge ' + F(za, 3) + '\\sigma)' : Pb.sigTex(q, z, mu, s, z2)) + '\\approx ' + pc(P) + '\\,\\%}', bold: true, hl: 'area' });
  if (r1.y + r1.h - y > fs * 3) difLines(S, { x: r1.x + tf * 0.3, y, w: r1.w - tf * 0.6, h: r1.y + r1.h - y }, L, C, { max: fs * 1.0, oneCol: true });
}
function pbSceneEv(S, W, H, C) {
  const fs = C.fs, F = Pb.F, c = Pb.evCalc(C.er, C.ee);
  const R = stLayout(W, H, [{ w: 0.66, rows: [1] }, { w: 0.34, rows: [1] }]);
  if (!c.R.length) { stKeepFrame(R[0]); S.rich(R[0].x + fs, R[0].y + fs * 2, '\\text{Keine gültigen Zeilen}', { size: fs, col: 'M', al: 'l', bs: 'm' }); return; }
  const xs = c.R.map(r => Pb.fVal(r.x)).concat(isFinite(c.ev) ? [c.ev] : []), lo = Math.min(...xs), hi = Math.max(...xs), pad = Math.max((hi - lo) * 0.12, 1);
  const mp = Math.max(...c.R.map(r => Pb.fVal(r.p))), w0 = pbFixWin(C, { x0: lo - pad, x1: hi + pad });
  const m = difFrame(S, R[0], { x0: w0.x0, x1: w0.x1, y0: 0, y1: Math.min(1.05, mp * 1.3 + 0.02) }, C, { title: '\\text{Verteilung der Auszahlung}', info: '\\col{r}{E(X)\\approx ' + F(c.Ev, 3) + '}', xlab: 'x', ylab: 'P' });
  S.maps.main = m;
  c.R.forEach((r, i) => { const x = Pb.fVal(r.x), p = Pb.fVal(r.p), px = m.X(x), py = m.Y(p); S.line(px, m.B, px, py, { col: ST_B, lw: 6, a: 0.6 }); shl(S, 'dist', [[px, m.B], [px, py]]); linPt(S, m, 'x' + i, x, p, C, { fill: ST_B, r: 5.5, lab: Pb.qTex(r.p), dy: py - fs * 2.2 < m.T ? fs * 2.2 : -fs * 2.0 }); });
  const ex = m.X(c.Ev);
  if (ex >= m.L && ex <= m.R) { const tri = [[ex, m.B], [ex - fs * 0.7, m.B + fs * 1.1], [ex + fs * 0.7, m.B + fs * 1.1]]; S.poly(tri, { fill: ST_R, col: ST_R, close: true, lw: 1, noclip: true }); shl(S, 'E', tri, true); S.line(ex, m.T + fs * 2, ex, m.B, { col: ST_R, lw: 1.4, dash: true }); }
  if (isFinite(c.ev)) { const px = m.X(c.ev); if (px >= m.L && px <= m.R) { S.line(px, m.T + fs * 2, px, m.B, { col: ST_O, lw: 2, dash: true }); shl(S, 'e', [[px, m.T + fs * 2], [px, m.B]]); difLabel(S, m, px, m.T + fs * 1.3, '\\col{o}{\\text{Einsatz}}', C, { size: 0.85, hl: 'e' }); } }
  const g = c.Ev - c.ev, L = [{ s: '\\col{r}{E(X)=\\sum x_i\\cdot P(X=x_i)}', hl: 'E' }, { s: '\\col{r}{=' + (c.E ? Pb.xTex(c.E) + (c.E.d > 1 ? '\\approx ' + F(c.Ev, 3) : '') : F(c.Ev, 3)) + '}', bold: true, hl: 'E' }];
  if (Math.abs(c.sum - 1) > 1e-9) L.push({ s: '\\col{r}{\\sum P=' + F(c.sum, 4) + '\\ne 1}', size: 0.9 });
  if (isFinite(c.ev)) L.push(null, { s: '\\col{o}{\\text{Einsatz } ' + F(c.ev) + '}', hl: 'e' }, { s: '\\text{Gewinn/Spiel } ' + F(g, 3) }, { s: Math.abs(g) < 1e-9 ? '\\col{g}{\\text{faires Spiel}}' : '\\text{nicht fair; fairer Einsatz } ' + F(c.Ev, 3), bold: true });
  difLines(S, R[1], L, C, { max: fs * 1.1 });
}
const PB_SCENES = { data: pbSceneData, tree: pbSceneTree, bin: pbSceneBin, ev: pbSceneEv, poi: pbScenePoi, norm: pbSceneNorm, lim: pbSceneLim, test: pbSceneTest };
function pbBuildScene(W, H, C) { const S = linScene(), fn = PB_SCENES[C.view]; if (fn) fn(S, W, H, C); return S; }

// ═════════════ Oberfläche ═════════════
const PB_VIEWS = [['data', 'Datenanalyse: Kennwerte und Diagramme'], ['tree', 'Baumdiagramm und Pfadregeln'], ['bin', 'Binomialverteilung'], ['poi', 'Poissonverteilung'], ['ev', 'Erwartungswert und faire Spiele'], ['norm', 'Normalverteilung: Grenzen, σ und Prozent'], ['lim', 'Grenzwerte: Binomial → Poisson und → Normal'], ['test', 'Hypothesentest']];
const PB_DESC = {
  data: ['Ziehe die {{Datenpunkte|d}} oder tippe links eine Liste ein: {{Mittelwert|mean}} und {{Median|med}} wandern mit, der {{Boxplot|box}} zeigt die {{Quartile|q}}. Wie stark zieht ein Ausreisser den Mittelwert, wie wenig den Median?', 'Lagemasse: Mittelwert (Summe durch Anzahl), Median (Wert in der Mitte der geordneten Liste), Modus (häufigster Wert). Streumasse: Spannweite, Quartilsabstand Q₃ − Q₁ und Standardabweichung. Diagramme: Punkt-, Säulen-, Kreisdiagramm, Histogramm (Klassen) und Boxplot.'],
  tree: ['Stelle links die Kugeln in der Urne, die Anzahl Züge und das Ereignis ein: Die {{Pfade des Ereignisses|ev}} werden grün. Längs eines {{Pfades|path}} wird multipliziert, die grünen Pfade werden addiert («▶ Pfade nacheinander zeigen» macht das Schritt für Schritt).', 'Mehrstufige Zufallsexperimente zeichnet man als Baumdiagramm. 1. Pfadregel: Wahrscheinlichkeiten entlang eines Pfades multiplizieren. 2. Pfadregel: Wahrscheinlichkeiten aller Pfade eines Ereignisses addieren. Ohne Zurücklegen ändern sich die Wahrscheinlichkeiten von Stufe zu Stufe.'],
  bin: ['Ziehe {{k|k}} auf der Achse oder ändere links n und p: Die {{grünen Balken|ev}} sind die gesuchte Wahrscheinlichkeit. Beobachte, wie sich die Verteilung um {{μ = n·p|mu}} mit der Breite {{σ|sig}} legt; «▶ n wachsen lassen» zeigt, wie daraus die Glockenkurve wird.', 'Eine Bernoulli-Kette ist ein Versuch mit Treffer (p) und Niete, n-mal unabhängig wiederholt. Die Trefferzahl X ist binomialverteilt: P(X = k) = (n über k)·pᵏ·(1 − p)ⁿ⁻ᵏ. Erwartungswert μ = n·p, Standardabweichung σ = √(n·p·(1 − p)).'],
  poi: ['Ziehe {{k|k}} auf der Achse oder ändere links den Mittelwert λ: Die {{grünen Säulen|ev}} sind die gesuchte Wahrscheinlichkeit. Die Verteilung liegt um {{μ = λ|mu}} mit der Breite {{σ = √λ|sig}}; mit dem Vergleich siehst du, wie gut die {{Binomialverteilung|bin}} mit vielen Versuchen dazu passt.', 'Die Poissonverteilung zählt, wie oft ein Ereignis in einem festen Zeitraum (oder auf einer Seite, Strecke, Fläche) eintritt, wenn die Ereignisse unabhängig und im Mittel gleich häufig auftreten: P(X = k) = λᵏ/k! · e^(−λ). Dabei ist λ die mittlere Anzahl; Erwartungswert und Varianz sind beide λ. Für grosses n und kleines p nähert sie die Binomialverteilung mit λ = n·p an.'],
  ev: ['Ziehe die {{Werte|dist}} der Auszahlung oder ändere links die Tabelle: Der {{Erwartungswert|E}} ist der Schwerpunkt der Verteilung. Liegt der {{Einsatz|e}} genau dort, ist das Spiel fair.', 'Eine Zufallsgrösse ordnet jedem Ergebnis eine Zahl zu (z. B. eine Auszahlung). Erwartungswert E(X) = Σ xᵢ·P(X = xᵢ): der Mittelwert auf lange Sicht. Ein Spiel ist fair, wenn der Einsatz gleich dem Erwartungswert der Auszahlung ist.'],
  norm: ['Ziehe die {{Grenzen|z}} oder gib links eine Grenze, die Anzahl σ oder die Prozentzahl ein: Die {{grüne Fläche|area}} unter der Glockenkurve ist die gesuchte Wahrscheinlichkeit – linksseitig, rechtsseitig, beidseitig oder zwischen zwei Grenzen. In den {{σ-Streifen|bands}} und in der Tabelle liest du ab, wie viele σ wie viel Prozent ergeben.', 'Viele Messgrössen (Körpergrösse, Messfehler, Abfüllmengen) sind annähernd normalverteilt. Wahrscheinlichkeiten sind Flächen unter der Glockenkurve; sie hängen nur davon ab, wie viele Standardabweichungen σ die Grenze vom Mittelwert μ entfernt ist: z = (x − μ)/σ. Beidseitig: μ ± 1σ enthält 68.3 %, μ ± 2σ 95.4 %, μ ± 3σ 99.7 %. Umgekehrt gehören zu 90 %, 95 % und 99 % die Grenzen 1.645σ, 1.96σ und 2.576σ.'],
  lim: ['Lass {{n|n}} wachsen (Regler oder «▶ n wachsen lassen»): Die {{blauen Säulen|bars}} der Binomialverteilung nähern sich der {{roten Grenzkurve|lim}} – der Poissonverteilung (n gross, p klein, n·p fest) oder der Glockenkurve (die Säulen werden schmal, aus diskret wird stetig). Im Rechenweg steht die Herleitung der Formel.', 'Poissonverteilung: Grenzfall der Binomialverteilung für n → ∞ und p → 0 bei festem Mittelwert λ = n·p. Normalverteilung: Für grosses n rücken die Säulen der Binomialverteilung, in Einheiten von σ gemessen, immer dichter zusammen und bilden die Glockenkurve; die Zufallsgrösse wird stetig (Satz von de Moivre und Laplace).'],
  test: ['Ziehe das {{Ergebnis k|k}} oder wähle links Test und Niveau: Fällt k in den roten {{Ablehnungsbereich|rej}}, wird die Nullhypothese verworfen. Ein kleineres α macht den Bereich kleiner.', 'Ein Hypothesentest prüft eine Annahme H₀ über eine Wahrscheinlichkeit p. Unter H₀ ist die Trefferzahl binomialverteilt. Der Ablehnungsbereich enthält die Werte, die unter H₀ zusammen höchstens die Wahrscheinlichkeit α (Signifikanzniveau) haben. Fehler 1. Art: H₀ wird verworfen, obwohl sie stimmt.']
};
// Beispiele je Ansicht: [Anzeige, Zustand]
const PB_EX = {
  data: [['Noten einer Prüfung', { data: [4, 4.5, 5, 3.5, 5.5, 4, 6, 4.5, 5, 3, 4.5, 5, 5.5, 4], unit: 'Note', dia: 'box' }], ['Körpergrössen (cm)', { data: [158, 162, 165, 165, 168, 170, 171, 172, 174, 175, 177, 180, 183, 186, 191], unit: 'cm', dia: 'hist', cw: 5 }],
    ['Wartezeiten mit Ausreisser (min)', { data: [3, 4, 4, 5, 5, 5, 6, 6, 7, 25], unit: 'min', dia: 'box' }], ['20 Würfelwürfe', { data: [3, 6, 1, 4, 4, 2, 6, 5, 3, 3, 1, 6, 2, 4, 5, 6, 3, 2, 4, 6], unit: 'Augen', dia: 'bar' }],
    ['Lieblingszahl in der Klasse', { data: [1, 3, 3, 7, 7, 7, 7, 8, 8, 9, 9, 9], unit: '', dia: 'pie' }]],
  tree: [['3 rote, 2 blaue; 2 Züge ohne Zurücklegen: genau 1 rote', { tr: 3, tb: 2, tn: 2, tk: 'ohne', te: 'k', tkk: 1 }], ['3 rote, 2 blaue; 2 Züge mit Zurücklegen: genau 1 rote', { tr: 3, tb: 2, tn: 2, tk: 'mit', te: 'k', tkk: 1 }],
    ['4 rote, 6 blaue; 3 Züge ohne Zurücklegen: mindestens eine rote', { tr: 4, tb: 6, tn: 3, tk: 'ohne', te: 'ge1', tkk: 1 }], ['Münze 3-mal (1 rot = Kopf, 1 blau = Zahl): alle gleich', { tr: 1, tb: 1, tn: 3, tk: 'mit', te: 'same', tkk: 0 }],
    ['5 Lose, 2 Gewinne (rot); 2 ziehen: genau 2 Gewinne', { tr: 2, tb: 3, tn: 2, tk: 'ohne', te: 'k', tkk: 2 }]],
  bin: [['Multiple Choice: 10 Fragen, je 4 Antworten; mindestens 5 richtig geraten', { bn: 10, bp: '1/4', bq: 'ge', bk: 5 }], ['12-mal würfeln: genau 2 Sechser', { bn: 12, bp: '1/6', bq: 'eq', bk: 2 }],
    ['Ausschuss 5 %: 50 Teile, höchstens 2 defekt', { bn: 50, bp: '0.05', bq: 'le', bk: 2 }], ['Münze 20-mal: 8 bis 12-mal Kopf', { bn: 20, bp: '1/2', bq: 'bt', bk: 8, bk2: 12 }], ['Keimrate 90 %: 30 Samen, mindestens 25 keimen', { bn: 30, bp: '0.9', bq: 'ge', bk: 25 }]],
  poi: [['Telefonzentrale: im Mittel 3 Anrufe pro Minute; genau 5 Anrufe in einer Minute', { pr: 3, pt: 1, pq: 'eq', pk: 5, pk2: 7, pcmp: false }],
    ['Druckfehler: im Mittel 0.8 pro Seite; mindestens ein Fehler auf einer Seite', { pr: 0.8, pt: 1, pq: 'ge', pk: 1, pk2: 3, pcmp: false }],
    ['Druckfehler: im Mittel 0.8 pro Seite; höchstens 2 Fehler auf 5 Seiten', { pr: 0.8, pt: 5, pq: 'le', pk: 2, pk2: 5, pcmp: false }],
    ['Fussball: im Mittel 2.7 Tore pro Spiel; 2 bis 4 Tore', { pr: 2.7, pt: 1, pq: 'bt', pk: 2, pk2: 4, pcmp: false }],
    ['Notaufnahme: im Mittel 4 Patienten pro Stunde; mindestens 10 in zwei Stunden', { pr: 4, pt: 2, pq: 'ge', pk: 10, pk2: 12, pcmp: false }],
    ['Radioaktiver Zerfall: im Mittel 6 Zerfälle pro Sekunde; höchstens 3', { pr: 6, pt: 1, pq: 'le', pk: 3, pk2: 6, pcmp: false }],
    ['Seltene Krankheit: 1000 Personen, p = 0.002 (λ = 2); mindestens 3 Fälle – Vergleich mit der Binomialverteilung', { pr: 2, pt: 1, pq: 'ge', pk: 3, pk2: 5, pcmp: true, pn: 1000 }],
    ['Ausschuss: 200 Teile, p = 1.5 % (λ = 3); kein defektes Teil – Vergleich mit der Binomialverteilung', { pr: 3, pt: 1, pq: 'eq', pk: 0, pk2: 2, pcmp: true, pn: 200 }]],
  ev: [['Glücksrad: 0, 2 oder 5 Fr., Einsatz 2 Fr.', { er: [['0', '1/2'], ['2', '1/3'], ['5', '1/6']], ee: '2' }], ['Würfelspiel: Sechs bringt 10 Fr., Einsatz 2 Fr.', { er: [['10', '1/6'], ['0', '5/6']], ee: '2' }],
    ['Losbude: 100 Lose (1×50, 5×10, 20×2 Fr.), Einsatz 1.50 Fr.', { er: [['50', '1/100'], ['10', '5/100'], ['2', '20/100'], ['0', '74/100']], ee: '1.5' }], ['Zwei Münzen: 2× Kopf +3, sonst −1', { er: [['3', '1/4'], ['-1', '3/4']], ee: '0' }],
    ['Versicherung: Schaden 20 000 Fr. mit 0.1 %, Prämie 30 Fr.', { er: [['20000', '0.001'], ['0', '0.999']], ee: '30' }]],
  norm: [['Körpergrösse (μ = 178 cm, σ = 7 cm): grösser als 190 cm', { sm: 178, ss: 7, sunit: 'cm', sq: 'r', sz: 12 / 7, sdir: 'x' }],
    ['Abfüllung (μ = 500 g, σ = 4 g): weniger als 495 g', { sm: 500, ss: 4, sunit: 'g', sq: 'l', sz: -1.25, sdir: 'x' }],
    ['IQ (μ = 100, σ = 15): zwischen 90 und 120', { sm: 100, ss: 15, sunit: '', sq: 'bt', sz: -2 / 3, sz2: 4 / 3, sdir: 'x' }],
    ['IQ (μ = 100, σ = 15): Wie viele liegen über 130?', { sm: 100, ss: 15, sunit: '', sq: 'r', sz: 2, sdir: 'x' }],
    ['Lebensdauer (μ = 1200 h, σ = 100 h): Wie viele halten höchstens 1000 h?', { sm: 1200, ss: 100, sunit: 'h', sq: 'l', sz: -2, sdir: 'x' }],
    ['Faustregel: innerhalb von μ ± 2σ', { sm: 0, ss: 1, sunit: '', sq: 'in', sz: 2, sdir: 'z' }],
    ['Fertigung (μ = 20 mm, σ = 0.05 mm): Ausschuss ausserhalb von μ ± 3σ', { sm: 20, ss: 0.05, sunit: 'mm', sq: 'out', sz: 3, sdir: 'z' }],
    ['Körpergrösse (μ = 178 cm, σ = 7 cm): In welchem Bereich liegen die mittleren 95 %?', { sm: 178, ss: 7, sunit: 'cm', sq: 'in', sz: Pb.sigZ('in', 0.95), sdir: 'p' }],
    ['Abfüllung (μ = 500 g, σ = 4 g): Welche Menge unterschreiten nur 2.5 %?', { sm: 500, ss: 4, sunit: 'g', sq: 'l', sz: Pb.sigZ('l', 0.025), sdir: 'p' }],
    ['Prüfung (μ = 60 Punkte, σ = 12): Ab wie vielen Punkten gehört man zu den besten 10 %?', { sm: 60, ss: 12, sunit: 'Punkte', sq: 'r', sz: Pb.sigZ('r', 0.1), sdir: 'p' }],
    ['Standardnormalverteilung: P(Z ≤ 1.96)', { sm: 0, ss: 1, sunit: '', sq: 'l', sz: 1.96, sdir: 'z' }]],
  lim: [['Poisson: λ = 3 (z. B. 3 Anrufe pro Minute)', { lm: 'poi', ll: 3, ln: 6, lk: 2 }], ['Poisson: λ = 0.8 (z. B. Druckfehler pro Seite)', { lm: 'poi', ll: 0.8, ln: 3, lk: 1 }], ['Poisson: λ = 8', { lm: 'poi', ll: 8, ln: 12, lk: 8 }],
    ['Normal: Münzwurf, p = 1/2', { lm: 'norm', lp: '1/2', ln: 6 }], ['Normal: Sechs würfeln, p = 1/6 (anfangs schief)', { lm: 'norm', lp: '1/6', ln: 12 }], ['Normal: seltener Treffer, p = 0.05 (braucht grosses n)', { lm: 'norm', lp: '0.05', ln: 20 }]],
  test: [['Ist die Münze fair? 50 Würfe, 32-mal Kopf (zweiseitig, 5 %)', { hn: 50, hp: '1/2', hal: 0.05, hs: 'z', hk: 32 }], ['Zu viele Sechser? 60 Würfe, 16 Sechser (rechtsseitig, 5 %)', { hn: 60, hp: '1/6', hal: 0.05, hs: 'r', hk: 16 }],
    ['Neues Medikament wirkt bei mehr als 60 %? 40 Patienten, 30 Erfolge', { hn: 40, hp: '0.6', hal: 0.05, hs: 'r', hk: 30 }], ['Ausschuss unter 10 % gesunken? 100 Teile, 4 defekt (linksseitig)', { hn: 100, hp: '0.1', hal: 0.05, hs: 'l', hk: 4 }], ['Raten beim Test: 20 Fragen, 4 Antworten, 9 richtig (1 %)', { hn: 20, hp: '1/4', hal: 0.01, hs: 'r', hk: 9 }]]
};
function pbDefaults() {
  return { view: 'data', data: PB_EX.data[0][1].data.slice(), unit: 'Note', dia: 'box', cw: 0, tr: 3, tb: 2, tn: 2, tk: 'ohne', te: 'k', tkk: 1, bn: 10, bp: '1/4', bq: 'ge', bk: 5, bk2: 7,
    pr: 3, pt: 1, pq: 'eq', pk: 5, pk2: 7, pcmp: false, pn: 100, lm: 'poi', ll: 3, lp: '1/2', ln: 6, lk: 2,
    sm: 178, ss: 7, sunit: 'cm', sq: 'r', sz: 1.714286, sz2: 2.5, sdir: 'x', sbands: true, hn: 50, hp: '1/2', hal: 0.05, hs: 'z', hk: 32, er: [['0', '1/2'], ['2', '1/3'], ['5', '1/6']], ee: '2', show: { card: true } };
}
const PB = Object.assign(pbDefaults(), { ui: null, S: null, drag: null, fix: null, anim: null, cardKey: '', cardT: 0 });
const PB_KEYS = Object.keys(pbDefaults());
function probActive() { return typeof ENV !== 'undefined' && ENV.cur === 'prob'; }
const pbInt = (v, lo, hi, d) => { v = Math.round(Number(v)); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
const pbProbOk = s => { const q = Pb.parseQ(s); return !!q && Pb.fVal(q) > 0 && Pb.fVal(q) < 1; };
// Zustand in gültige Grenzen bringen
function pbFix(o) {
  const d = pbDefaults();
  if (!Array.isArray(o.data)) o.data = d.data; o.data = o.data.map(Number).filter(isFinite).slice(0, 300);
  if (!['dot', 'box', 'hist', 'bar', 'pie'].includes(o.dia)) o.dia = 'box';
  o.cw = Math.max(0, Number(o.cw) || 0); o.unit = String(o.unit || '').slice(0, 20);
  o.tr = pbInt(o.tr, 0, 20, 3); o.tb = pbInt(o.tb, 0, 20, 2); if (o.tr + o.tb < 1) o.tr = 1; o.tn = pbInt(o.tn, 1, 3, 2);
  if (o.tk !== 'mit') o.tk = 'ohne'; if (o.tk === 'ohne' && o.tr + o.tb < o.tn) o.tn = Math.max(1, o.tr + o.tb);
  if (!['k', 'ge1', 'same'].includes(o.te)) o.te = 'k'; o.tkk = pbInt(o.tkk, 0, o.tn, 1);
  o.bn = pbInt(o.bn, 1, 200, 10); if (!pbProbOk(o.bp)) o.bp = d.bp; if (!['eq', 'le', 'ge', 'bt'].includes(o.bq)) o.bq = 'ge'; o.bk = pbInt(o.bk, 0, o.bn, 0); o.bk2 = pbInt(o.bk2, 0, o.bn, o.bn);
  o.pr = +o.pr > 0 ? Math.min(100, +o.pr) : d.pr; o.pt = +o.pt > 0 ? +o.pt : 1; if (o.pr * o.pt > 100) o.pt = Math.round(100 / o.pr * 1e6) / 1e6;   // λ höchstens 100 (zu grosse Eingaben werden begrenzt)
  if (!['eq', 'le', 'ge', 'bt'].includes(o.pq)) o.pq = 'eq'; o.pk = pbInt(o.pk, 0, 250, 0); o.pk2 = pbInt(o.pk2, 0, 250, o.pk + 2); o.pcmp = !!o.pcmp; o.pn = pbInt(o.pn, 2, 5000, 100);
  if (o.lm !== 'norm') o.lm = 'poi'; o.ll = +o.ll > 0 ? Math.min(30, +o.ll) : d.ll; if (!pbProbOk(o.lp)) o.lp = d.lp; o.ln = pbInt(o.ln, o.lm === 'poi' ? Math.floor(o.ll) + 1 : 1, 1000, 6); o.lk = pbInt(o.lk, 0, 80, 2);
  o.sm = isFinite(+o.sm) ? +o.sm : d.sm; o.ss = +o.ss > 0 ? +o.ss : d.ss; o.sunit = String(o.sunit || '').slice(0, 12); if (!['l', 'r', 'bt', 'in', 'out'].includes(o.sq)) o.sq = 'r';
  o.sz = isFinite(+o.sz) ? Math.max(-6, Math.min(6, Math.round(+o.sz * 1e6) / 1e6)) : 2; if (o.sq === 'in' || o.sq === 'out') o.sz = Math.abs(o.sz);
  o.sz2 = isFinite(+o.sz2) ? Math.max(-6, Math.min(6, Math.round(+o.sz2 * 1e6) / 1e6)) : o.sz + 1; if (o.sq === 'bt' && o.sz2 < o.sz) { const t = o.sz; o.sz = o.sz2; o.sz2 = t; }
  if (!['x', 'z', 'p'].includes(o.sdir)) o.sdir = 'z'; if (o.sq === 'bt') o.sdir = 'x'; o.sbands = o.sbands !== false;
  o.hn = pbInt(o.hn, 1, 300, 50); if (!pbProbOk(o.hp)) o.hp = d.hp; if (![0.01, 0.05, 0.1].includes(+o.hal)) o.hal = 0.05; o.hal = +o.hal; if (!['r', 'l', 'z'].includes(o.hs)) o.hs = 'z'; o.hk = pbInt(o.hk, 0, o.hn, 0);
  if (!Array.isArray(o.er) || !o.er.length) o.er = d.er; o.er = o.er.slice(0, 10).map(r => [String(Array.isArray(r) ? r[0] : ''), String(Array.isArray(r) ? r[1] : '')]); o.ee = String(o.ee === undefined ? '' : o.ee);
  if (!o.show || typeof o.show !== 'object') o.show = { card: true }; o.show = { card: o.show.card !== false };
  return o;
}
function pbCardDoc() {
  try {
    const P = PB, v = P.view;
    if (v === 'data') return { t: 'Rechenweg: Kennwerte', d: Pb.dataDoc(P.data) };
    if (v === 'tree') return { t: 'Rechenweg: Baumdiagramm', d: Pb.treeDoc(P.tr, P.tb, P.tn, P.tk === 'mit', P.te, P.tkk) };
    if (v === 'bin') return { t: 'Rechenweg: Binomialverteilung', d: Pb.binDoc(P.bn, P.bp, P.bq, P.bk, P.bk2) };
    if (v === 'ev') return { t: 'Rechenweg: Erwartungswert', d: Pb.evDoc(P.er, P.ee) };
    if (v === 'lim') return { t: P.lm === 'poi' ? 'Herleitung: Poissonverteilung' : 'Herleitung: Normalverteilung', d: Pb.limDoc(P.lm, P.ll, P.lp, P.ln, P.lk) };
    if (v === 'poi') return { t: 'Rechenweg: Poissonverteilung', d: Pb.poiDoc(P.pr, P.pt, P.pq, P.pk, P.pk2, P.pcmp, P.pn) };
    if (v === 'norm') return { t: 'Rechenweg: Normalverteilung', d: Pb.sigDoc(P.sm, P.ss, P.sq, P.sz, P.sdir, P.sunit, P.sz2) };
    return { t: 'Rechenweg: Hypothesentest', d: Pb.testDoc(P.hn, P.hp, P.hal, P.hs, P.hk) };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
const pbKeyOf = () => JSON.stringify(PB_KEYS.filter(k => k !== 'show').map(k => PB[k]));
function pbCardSoon() { clearTimeout(PB.cardT); PB.cardT = setTimeout(pbCardRender, 40); }
function pbCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = probActive() && PB.show.card;
  if (probActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  if (PB.cardHold) return;                                              // Regler wird gezogen: Karte erst danach neu setzen (lange Herleitung)
  const key = pbKeyOf(); if (key === PB.cardKey) return;
  PB.cardKey = key;
  const r = pbCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d); else body.innerHTML = '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}
function probCapture() { const o = {}; PB_KEYS.forEach(k => { o[k] = PB[k]; }); return difCopy(o); }
function probApply(s) {
  PB.anim = null;                                                       // laufende Animation beenden (Rückgängig, Laden, Zurücksetzen)
  const d = pbDefaults();
  if (s && typeof s === 'object') {
    s = Object.assign({}, s); if (s.view === 'sig') s.view = 'norm';                 // frühere eigene Ansicht «σ-Bereiche»
    // Ältere Dateien führten die Normalverteilung mit wirklichen Grenzen a, b (nm, ns, nq, na, nb): in Einheiten von σ umrechnen
    if ('nm' in s && !('sm' in s) && +s.ns > 0) { const zz = x => (Number(x) - Number(s.nm)) / Number(s.ns); s.sm = s.nm; s.ss = s.ns; s.sunit = s.nunit || ''; s.sdir = 'x'; s.sbands = true;
      if (s.nq === 'le') { s.sq = 'l'; s.sz = zz(s.nb); } else if (s.nq === 'ge') { s.sq = 'r'; s.sz = zz(s.na); } else { s.sq = 'bt'; s.sz = zz(s.na); s.sz2 = zz(s.nb); } }
  }
  if (s && typeof s === 'object') { PB_KEYS.forEach(k => { if (k in s && s[k] !== undefined && s[k] !== null) d[k] = difCopy(s[k]); }); if (!PB_VIEWS.some(v => v[0] === d.view)) d.view = 'data'; }
  pbFix(d); PB.drag = null; PB.fix = null; Object.keys(d).forEach(k => { PB[k] = d[k]; }); PB.cardKey = '';
  pbRefreshUI(); difRedraw(); pbCardSoon();
}
function pbCtx(W, H, exp) {
  const c = { fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, fix: exp ? null : PB.fix }; PB_KEYS.forEach(k => { c[k] = PB[k]; });
  const a = exp ? null : PB.anim;
  if (a && a.bin && PB.view === 'bin') { c.bn = a.n; c.binAnim = true; c.fix = null; }
  if (a && a.tree && PB.view === 'tree') c.treeStep = a.i;
  if (a && a.lim && PB.view === 'lim') c.ln = a.n;
  return c;
}
// ── Animationen: Binomialverteilung (n wächst → Glockenkurve), Grenzwerte (n wächst → Poisson bzw. Normal) und Baumdiagramm (Pfade nacheinander) ──
function pbAnimStop() { if (PB.anim) { const a = PB.anim; PB.anim = null; if (a.lim && PB.view === 'lim') { PB.ln = a.n; PB.cardKey = ''; pbCardSoon(); difCommit(); } pbRefreshUI(); difRedraw(); } }
function pbAnimToggle() {
  if (PB.anim) { pbAnimStop(); return; }
  if (PB.view === 'bin') PB.anim = { last: 0, bin: true, f: 1, n: 1, wait: 0.5 };
  else if (PB.view === 'tree') PB.anim = { last: 0, tree: true, i: -1, wait: 0.9 };
  else if (PB.view === 'lim') { const n0 = PB.ln >= 1000 ? (PB.lm === 'poi' ? Math.floor(PB.ll) + 1 : 1) : PB.ln; PB.anim = { last: 0, lim: true, f: n0, n: n0, wait: 0.4 }; }
  else return;
  pbRefreshUI(); difRedraw(); requestAnimationFrame(pbAnimFrame);
}
function pbAnimFrame(ts) {
  const a = PB.anim; if (!a) return;
  if (!probActive() || (a.bin && PB.view !== 'bin') || (a.tree && PB.view !== 'tree') || (a.lim && PB.view !== 'lim')) { PB.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (a.wait > 0) { a.wait -= dt; requestAnimationFrame(pbAnimFrame); return; }
  if (a.lim) {
    a.f = Math.max(a.f + dt * 1.6, a.f * Math.pow(10, dt * 0.28));
    if (a.f >= 1000) { a.n = 1000; pbAnimStop(); return; }
    const n = Math.round(a.f); if (n !== a.n) { a.n = n; difRedraw(); const u = PB.ui; if (u && u.limSl) { u.limSl.value = Math.log10(n) / 3; u.limVal.textContent = 'n = ' + n; } }
  } else if (a.bin) {
    a.f = Math.max(a.f + dt * 2.2, a.f * Math.pow(10, dt * 0.3));
    if (a.f >= 200) { a.n = 200; difRedraw(); setTimeout(() => { if (PB.anim === a) pbAnimStop(); }, 2000); return; }
    const n = Math.round(a.f); if (n !== a.n) { a.n = n; difRedraw(); }
  } else {
    const T = Pb.tree(PB.tr, PB.tb, PB.tn, PB.tk === 'mit', PB.te, PB.tkk), cnt = T.paths.filter(q => q.inE).length;
    a.i++;
    if (a.i >= cnt) { pbAnimStop(); return; }
    a.wait = 1.7; difRedraw();
  }
  requestAnimationFrame(pbAnimFrame);
}
const pbDock = w => (PB.show.card && w >= 760 ? stCardW(w, 0.36) : 0);
const pbDockH = (w, h) => (PB.show.card && w < 760 ? Math.round(h * 0.5) : 0);
function probDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  const card = $dif('dif-card'); if (card) { const dock = pbDock(w), dh = pbDockH(w, h); card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh); card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : ''; }
  pbCardRender();
  const W = w - pbDock(w), Hs = h - pbDockH(w, h);
  const S = stSoloBuild(pbBuildScene, W, Hs, pbCtx(W, Hs), 'prob|' + PB.view + '|' + PB.dia + '|' + PB.show.card, W < w || Hs < h);
  PB.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}
function probLatex() { const W = 760, H = PB.view === 'data' && PB.dia !== 'dot' ? 520 : 400; return stSceneTex(pbBuildScene(W, H, pbCtx(W, H, { fs: 11 })), W, H, (PB_VIEWS.find(q => q[0] === PB.view) || [0, ''])[1], 11); }
function probCardLatex() { const r = pbCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.'; return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d); }
function probMakeLatex(which) { const ui = PB.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? probCardLatex() : probLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }

function pbBuildUI() {
  if (PB.ui || !$dif('prob-panel')) return;
  const ui = PB.ui = {}, body = $dif('prob-body');
  ui.sel = $dif('prob-view');
  PB_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { PB.view = ui.sel.value; PB.anim = null; PB.cardKey = ''; pbRefreshUI(); difRedraw(); pbCardSoon(); difCommit(); });
  ui.desc = $dif('prob-desc'); ui.ex = $dif('prob-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec'); det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => probMakeLatex('pic')); ui.br.addEventListener('click', () => probMakeLatex('calc'));
  ui.bc.addEventListener('click', () => { if (!ui.ta.value) probMakeLatex('pic'); const done = () => { ui.msg.textContent = 'Kopiert'; setTimeout(() => { ui.msg.textContent = ''; }, 2500); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ui.ta.value).then(done).catch(() => { ui.ta.select(); document.execCommand('copy'); done(); }); else { ui.ta.select(); document.execCommand('copy'); done(); } });
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!probActive()) return; PB.show.card = false; pbRefreshUI(); difRedraw(); pbCardRender(); difCommit(); });
  pbRefreshUI();
}
function pbRefreshUI() {
  const ui = PB.ui; if (!ui) return;
  const v = PB.view;
  ui.sel.value = v;
  const dd = PB_DESC[v]; ui.desc.replaceChildren(difEl('div', null, dd[1])); if (typeof envHint === 'function') envHint('prob', dd[0], () => PB.S);
  ui.ex.replaceChildren(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
  PB_EX[v].forEach((e, i) => { const o = difEl('option', null, e[0]); o.value = String(i); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const e = PB_EX[v][+i][1];
    Object.keys(e).forEach(k => { PB[k] = difCopy(e[k]); }); if (v === 'data' && !('cw' in e)) PB.cw = 0;
    pbFix(PB); PB.cardKey = ''; pbRefreshUI(); difRedraw(); pbCardSoon(); difCommit();
  };
  const P = ui.params; P.replaceChildren();
  const redo = () => { pbFix(PB); PB.cardKey = ''; pbRefreshUI(); difRedraw(); pbCardSoon(); difCommit(); };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const row = (label, el) => { const r = difEl('div', 'settings-row'); r.style.gap = '8px'; const lb = difEl('label', null, label); lb.style.minWidth = '74px'; r.append(lb, el); P.appendChild(r); return r; };
  const select = (label, opts, k, num) => { const sel = difEl('select'); opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: String(o[0]) }))); sel.value = String(PB[k]); sel.addEventListener('change', () => { PB[k] = num ? Number(sel.value) : sel.value; redo(); }); return row(label, sel); };
  const input = (label, k, o) => { o = o || {}; const inp = difEl('input'); inp.type = 'text'; inp.inputMode = o.num ? 'decimal' : 'text'; inp.value = o.num ? difFmtIn(PB[k]) : String(PB[k]); inp.style.width = o.w || '80px'; if (o.ph) inp.placeholder = o.ph; inp.addEventListener('change', () => { if (o.num) { const x = difParseNum(inp.value); if (isFinite(x) && (!o.pos || x > 0)) PB[k] = x; } else PB[k] = inp.value.trim(); redo(); }); return row(label, inp); };
  const check = (label, k) => { const r = difEl('div', 'settings-row'), lb = difEl('label'), cb = difEl('input'); cb.type = 'checkbox'; cb.checked = !!PB[k]; lb.append(cb, document.createTextNode(' ' + label)); cb.addEventListener('change', () => { PB[k] = cb.checked; redo(); }); r.appendChild(lb); P.appendChild(r); };
  if (v === 'data') {
    group('Daten');
    const ta = difEl('textarea'); ta.rows = 3; ta.style.cssText = 'width:100%;box-sizing:border-box;font-family:inherit;font-size:13px;'; ta.placeholder = 'z.B. 4, 4.5, 5, 3.5 (mit «;» getrennt: Dezimalkomma)'; ta.value = PB.data.map(x => difFmtIn(x)).join(', ');
    ta.addEventListener('change', () => { PB.data = Pb.parseData(ta.value); redo(); }); P.appendChild(ta);
    input('Einheit', 'unit', { w: '90px' });
    select('Diagramm', [['box', 'Boxplot'], ['hist', 'Histogramm'], ['bar', 'Säulendiagramm'], ['pie', 'Kreisdiagramm'], ['dot', 'nur Punktdiagramm']], 'dia');
    if (PB.dia === 'hist') input('Klassenbreite', 'cw', { num: true, ph: 'automatisch' });
  } else if (v === 'tree') {
    group('Urne und Ereignis');
    input('rote Kugeln', 'tr', { num: true }); input('blaue Kugeln', 'tb', { num: true });
    select('Züge', [[1, '1'], [2, '2'], [3, '3']], 'tn', true); select('Ziehen', [['ohne', 'ohne Zurücklegen'], ['mit', 'mit Zurücklegen']], 'tk');
    select('Ereignis', [['k', 'genau k rote'], ['ge1', 'mindestens eine rote'], ['same', 'alle gleichfarbig']], 'te');
    if (PB.te === 'k') select('k', Array.from({ length: PB.tn + 1 }, (_, i) => [i, String(i)]), 'tkk', true);
    { const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(PB.anim ? '⏸ Pause' : '▶ Pfade nacheinander zeigen', pbAnimToggle)); P.appendChild(ab); }
  } else if (v === 'bin') {
    group('Verteilung und Frage');
    input('n', 'bn', { num: true }); input('p', 'bp', { ph: 'z.B. 1/6 oder 0.2' });
    select('gesucht', [['eq', 'P(X = k)'], ['le', 'P(X ≤ k)'], ['ge', 'P(X ≥ k)'], ['bt', 'P(k₁ ≤ X ≤ k₂)']], 'bq');
    input(PB.bq === 'bt' ? 'k₁' : 'k', 'bk', { num: true }); if (PB.bq === 'bt') input('k₂', 'bk2', { num: true });
    { const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(PB.anim ? '⏸ Pause' : '▶ n wachsen lassen (bis 200)', pbAnimToggle)); P.appendChild(ab); }
  } else if (v === 'poi') {
    group('Verteilung und Frage');
    input('Mittelwert pro Einheit', 'pr', { num: true, pos: true }); input('Anzahl Einheiten', 'pt', { num: true, pos: true });
    { const h = difEl('div', 'act-hint', 'λ = ' + difFmtIn(Math.round(PB.pr * PB.pt * 1e6) / 1e6) + (PB.pt !== 1 ? ' (Mittelwert für alle Einheiten zusammen, z. B. 5 Seiten oder 2 Stunden)' : ' (mittlere Anzahl Ereignisse)')); h.style.margin = '2px 2px 4px'; P.appendChild(h); }
    select('gesucht', [['eq', 'P(X = k)'], ['le', 'P(X ≤ k)'], ['ge', 'P(X ≥ k)'], ['bt', 'P(k₁ ≤ X ≤ k₂)']], 'pq');
    input(PB.pq === 'bt' ? 'k₁' : 'k', 'pk', { num: true }); if (PB.pq === 'bt') input('k₂', 'pk2', { num: true });
    group('Vergleich mit der Binomialverteilung');
    check('B(n; p) mit n·p = λ als Kurve einzeichnen', 'pcmp');
    if (PB.pcmp) input('n (Versuche)', 'pn', { num: true });
    { const h = difEl('div', 'act-hint', 'Wie die Binomialverteilung für wachsendes n in die Poissonverteilung übergeht, zeigt die Ansicht «Grenzwerte».'); h.style.margin = '4px 2px'; P.appendChild(h); }
  } else if (v === 'ev') {
    group('Auszahlung x und Wahrscheinlichkeit');
    PB.er.forEach((r, i) => {
      const rr = difEl('div', 'settings-row'); rr.style.gap = '5px';
      const a = difEl('input'), b = difEl('input'); a.type = b.type = 'text'; a.value = r[0]; b.value = r[1]; a.style.width = '70px'; b.style.width = '70px'; a.placeholder = 'x'; b.placeholder = 'P';
      a.addEventListener('change', () => { PB.er[i][0] = a.value.trim(); redo(); }); b.addEventListener('change', () => { PB.er[i][1] = b.value.trim(); redo(); });
      const del = difBtn('✕', () => { if (PB.er.length > 1) { PB.er.splice(i, 1); redo(); } }, 'Zeile löschen');
      rr.append(difEl('span', null, 'x =') , a, difEl('span', null, 'P ='), b, del); P.appendChild(rr);
    });
    if (PB.er.length < 10) { const add = difBtn('+ Zeile', () => { PB.er.push(['0', '0']); redo(); }, 'Zeile hinzufügen'); P.appendChild(add); }
    input('Einsatz', 'ee', { ph: 'leer: ohne' });
  } else if (v === 'norm') {
    // Eigenes Zahlfeld (nicht an einen Zustandsschlüssel gebunden): Grenze x, Anzahl σ und Prozent hängen voneinander ab
    const field = (label, val, set, w) => { const inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.value = val; inp.style.width = w || '80px'; inp.setAttribute('translate', 'no'); inp.addEventListener('change', () => { const x = difParseNum(String(inp.value).replace('%', '')); if (isFinite(x)) set(x); redo(); }); return row(label, inp); };
    const q = PB.sq, two = q === 'in' || q === 'out', r6 = x => Math.round(x * 1e6) / 1e6 + 0, xOf = z => difFmtIn(r6(Math.round((PB.sm + z * PB.ss) * 1e4) / 1e4)), zOf = x => r6((x - PB.sm) / PB.ss);
    group('Verteilung');
    input('μ', 'sm', { num: true }); input('σ', 'ss', { num: true, pos: true }); input('Einheit', 'sunit', { w: '90px' });
    group('Gesucht');
    { // Art wechseln: die Grenzen sinnvoll mitnehmen
      const sel = difEl('select'); [['l', 'linksseitig: P(X ≤ x)'], ['r', 'rechtsseitig: P(X ≥ x)'], ['bt', 'zwischen zwei Grenzen: P(a ≤ X ≤ b)'], ['in', 'beidseitig: innerhalb μ ± z·σ'], ['out', 'beidseitig: ausserhalb μ ± z·σ']].forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
      sel.value = q; sel.addEventListener('change', () => {
        const n = sel.value, z = PB.sz, za = Math.abs(z);
        if (n === 'bt') { if (two) { PB.sz = -za; PB.sz2 = za; } else if (q === 'l') { PB.sz = z - 1; PB.sz2 = z; } else { PB.sz = z; PB.sz2 = z + 1; } }
        else if (q === 'bt') PB.sz = n === 'l' ? PB.sz2 : n === 'r' ? PB.sz : Math.max(za, Math.abs(PB.sz2));
        PB.sq = n; redo();
      }); row('Art', sel);
    }
    if (q === 'bt') {
      field('untere Grenze a', xOf(PB.sz), x => { PB.sz = zOf(x); });
      field('obere Grenze b', xOf(PB.sz2), x => { PB.sz2 = zOf(x); });
    } else {
      field(two ? 'obere Grenze x' : 'Grenze x', xOf(PB.sz), x => { PB.sz = zOf(x); PB.sdir = 'x'; });
      field('Anzahl σ (z)', difFmtIn(r6(Math.round(PB.sz * 1e4) / 1e4)), x => { PB.sz = x; PB.sdir = 'z'; });
      field('Prozent', difFmtIn(parseFloat(Pb.sigPct(Pb.sigP(q, PB.sz)))), x => { if (x > 0 && x < 100) { PB.sz = r6(Pb.sigZ(q, x / 100)); PB.sdir = 'p'; } });
      const quick = (items, f) => { const b = difEl('div'); b.style.cssText = 'display:grid;grid-template-columns:repeat(' + items.length + ',1fr);gap:5px;margin-top:5px;'; items.forEach(it => b.appendChild(difBtn(it[0], () => { f(it[1]); redo(); }))); P.appendChild(b); };
      quick([['1σ', 1], ['2σ', 2], ['3σ', 3]], k => { PB.sz = k; PB.sdir = 'z'; });
      quick([['90 %', 0.9], ['95 %', 0.95], ['99 %', 0.99]], p => { PB.sz = r6(Pb.sigZ(q, q === 'out' || q === 'r' ? 1 - p : p)); PB.sdir = 'p'; });
      { const h = difEl('div', 'act-hint', 'Die Prozent-Knöpfe meinen den Anteil im «Hauptteil»: bei «ausserhalb» und «rechtsseitig» bleiben 10 %, 5 % bzw. 1 % übrig.'); h.style.margin = '4px 2px'; P.appendChild(h); }
    }
    group('Anzeige');
    check('Anteile der σ-Streifen zeigen', 'sbands');
  } else if (v === 'lim') {
    group('Grenzübergang');
    select('Art', [['poi', 'Binomial → Poisson (n gross, p klein)'], ['norm', 'Binomial → Normal (n gross, p fest)']], 'lm');
    if (PB.lm === 'poi') { input('λ = n·p', 'll', { num: true, pos: true }); input('k (Zahlen)', 'lk', { num: true }); }
    else input('p', 'lp', { ph: 'z.B. 1/6 oder 0.2' });
    input('n', 'ln', { num: true });
    { // Regler für n (logarithmisch, 1 … 1000)
      const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;margin-top:4px;';
      const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
      const val = difEl('b', null, 'n = ' + PB.ln); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
      top.append(difEl('label', null, 'Je weiter rechts, desto grösser n'), val);
      const sl = difEl('input'); sl.type = 'range'; sl.min = 0; sl.max = 1; sl.step = 0.002; sl.value = Math.log10(Math.max(1, PB.ln)) / 3; sl.style.width = '100%';
      const nmin = PB.lm === 'poi' ? Math.floor(PB.ll) + 1 : 1;
      sl.addEventListener('input', () => { if (PB.anim) PB.anim = null; PB.cardHold = true; PB.ln = Math.max(nmin, Math.min(1000, Math.round(Math.pow(10, 3 * parseFloat(sl.value))))); val.textContent = 'n = ' + PB.ln; difRedraw(); });
      sl.addEventListener('change', () => { PB.cardHold = false; redo(); });
      wrap.append(top, sl); P.appendChild(wrap); ui.limSl = sl; ui.limVal = val;
    }
    { const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(PB.anim ? '⏸ Pause' : '▶ n wachsen lassen (bis 1000)', pbAnimToggle)); P.appendChild(ab); }
    { const h = difEl('div', 'act-hint', PB.lm === 'poi' ? 'p = λ/n = ' + difFmtIn(Math.round(PB.ll / PB.ln * 1e5) / 1e5) + ': n·p bleibt fest, p wird immer kleiner.' : 'Die Säulen sind in Einheiten von σ gezeichnet (Breite 1/σ): So bleibt die Form vergleichbar, während n wächst.'); h.style.margin = '4px 2px'; P.appendChild(h); }
  } else if (v === 'test') {
    group('Test');
    input('n', 'hn', { num: true }); input('p₀ (H₀)', 'hp', { ph: 'z.B. 1/2' });
    select('Gegenhyp.', [['r', 'H₁: p > p₀ (rechtsseitig)'], ['l', 'H₁: p < p₀ (linksseitig)'], ['z', 'H₁: p ≠ p₀ (zweiseitig)']], 'hs');
    select('Niveau α', [[0.1, '10 %'], [0.05, '5 %'], [0.01, '1 %']], 'hal', true);
    input('Treffer k', 'hk', { num: true });
  }
  group('Rechenweg');
  const r = difEl('div', 'settings-row'); const lb = difEl('label'), cb = difEl('input'); cb.type = 'checkbox'; cb.checked = PB.show.card; lb.append(cb, document.createTextNode(' Rechenweg als Karte anzeigen')); cb.addEventListener('change', () => { PB.show.card = cb.checked; redo(); }); r.appendChild(lb); P.appendChild(r);
}
// Maus: Punkte ziehen (Datenwerte, k, Grenzen, Auszahlungen); Fenster bleibt während des Ziehens fest
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const near = p => { const S = PB.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + 4 && d < bd) { bd = d; best = q; } }); return best; };
  const snapData = () => { const a = PB.data; return a.every(v => Number.isInteger(v)) ? 1 : a.every(v => Number.isInteger(v * 2)) ? 0.5 : 0.1; };
  const down = e => {
    if (!probActive()) return; const S = PB.S; if (!S) return; if (PB.anim) pbAnimStop(); const p = pos(e), q = near(p);
    if (!q) return;
    e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const m = S.maps.main; PB.drag = { type: q.id }; PB.fix = m ? { x0: m.win.x0, x1: m.win.x1 } : null; cv.style.cursor = 'pointer';
  };
  const move = e => {
    if (!probActive()) return; const S = PB.S, d = PB.drag, p = pos(e);
    if (!d) { if (S) cv.style.cursor = near(p) ? 'pointer' : ''; return; }
    e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const m = S && S.maps.main; if (!m) return; const x = m.IX(p.x), t = d.type, r6 = v => Math.round(v * 1e6) / 1e6;
    if (t[0] === 'd' && PB.view === 'data') { const st = e.shiftKey ? 0.1 : snapData(); PB.data[+t.slice(1)] = r6(Math.round(x / st) * st); }
    else if (t === 'k' && PB.view === 'bin') PB.bk = pbInt(x, 0, PB.bn, 0);
    else if (t === 'k2') PB.bk2 = pbInt(x, 0, PB.bn, 0);
    else if (t === 'pk') PB.pk = pbInt(x, 0, 250, 0);
    else if (t === 'lk') PB.lk = pbInt(x, 0, 80, 0);
    else if (t === 'pk2') PB.pk2 = pbInt(x, 0, 250, 0);
    else if (t === 'k' && PB.view === 'test') PB.hk = pbInt(x, 0, PB.hn, 0);
    else if (t === 'sz' || t === 'sz2' || t === 'szb') {
      // Grenze der Normalverteilung (in Einheiten von σ). Standardnormalverteilung: Raster 0.05; sonst ein rundes Raster der
      // wirklichen Grösse. Ganze σ und die Merkzahlen 1.645, 1.96, 2.576 rasten ein. Shift: fein.
      const two = PB.sq === 'in' || PB.sq === 'out', std = PB.sm === 0 && PB.ss === 1; let zv = Math.max(-6, Math.min(6, x));
      if (std) { const st = e.shiftKey ? 0.01 : 0.05; zv = Math.round(zv / st) * st; }
      else { const st = Stat.niceStep(8 * PB.ss, e.shiftKey ? 600 : 60); zv = (Math.round((PB.sm + zv * PB.ss) / st) * st - PB.sm) / PB.ss; }
      if (!e.shiftKey) [1, 2, 3, 1.645, 1.96, 2.576].forEach(q => { if (Math.abs(Math.abs(x) - q) < 0.05) zv = (x > 0 ? 1 : -1) * q; });
      if (two) zv = Math.abs(zv);
      if (t === 'szb') PB.sz2 = r6(zv); else PB.sz = r6(zv);
      PB.sdir = std || Math.abs(zv - Math.round(zv * 1000) / 1000) < 1e-9 && [1, 2, 3, 1.645, 1.96, 2.576].includes(Math.abs(zv)) ? 'z' : 'x';
    }
    else if (t[0] === 'x' && PB.view === 'ev') { const i = +t.slice(1), st = e.shiftKey ? 0.1 : 1, row = PB.er.filter(r => Pb.parseQ(r[0]) && Pb.parseQ(r[1]))[i]; if (row) row[0] = String(r6(Math.round(x / st) * st)); }
    PB.cardKey = ''; difRedraw(); pbCardSoon();
  };
  const up = e => {
    if (!probActive() || !PB.drag) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    PB.drag = null; PB.fix = null; cv.style.cursor = ''; pbFix(PB); pbRefreshUI(); difRedraw(); pbCardSoon(); difCommit();
  };
  const stop = e => { if (probActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, e => { down(e); if (probActive()) stop(e); }, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, e => { move(e); if (probActive()) stop(e); }, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, e => { up(e); if (probActive()) stop(e); }, { capture: true, passive: false }));
  ['wheel', 'dblclick', 'contextmenu'].forEach(ev => cv.addEventListener(ev, stop, { capture: true, passive: false }));
})();
document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { PB.cardKey = ''; if (probActive()) { pbCardRender(); pbRefreshUI(); difRedraw(); } }, ms)); });
pbBuildUI();
