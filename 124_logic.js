// ═══════════════════════════════════════════════════════════════════
// 124_logic.js — Aussagenlogik (Thema aus dem Baukasten 120_kit.js)
//
// Lg: Rechenkern ohne DOM (Aussagen einlesen, auswerten, Wahrheitstafel, Rechenwege).
// Zeichen: ¬ nicht, ∧ und, ∨ oder, ⊕ entweder–oder, → wenn–dann, ↔ genau dann wenn.
// Eingabe auch mit ! & | ^ -> <-> oder den Wörtern nicht, und, oder, xor.
// Die Mengenbilder zeichnet setVenn (112a_set_venn.js).
// ═══════════════════════════════════════════════════════════════════
const Lg = (function () {
  const PREC = { eq: 1, imp: 2, or: 3, xor: 3, and: 4, not: 5, v: 6, c: 6 };   // Vorrang beim Einlesen
  const SYM = { and: '∧', or: '∨', xor: '⊕', imp: '→', eq: '↔' }, TEX = { and: '\\,\\land\\,', or: '\\,\\lor\\,', xor: '\\,\\oplus\\,', imp: '\\to ', eq: '\\leftrightarrow ' };
  function tokens(src) {
    let s = ' ' + String(src) + ' ';
    s = s.replace(/<->|<=>|⇔/g, '↔').replace(/->|=>|⇒/g, '→').replace(/&&|[&*·]/g, '∧').replace(/\|\||[|+]/g, '∨').replace(/[!~]/g, '¬').replace(/[\^⊻]/g, '⊕');
    s = s.replace(/\b(nicht|not)\b/gi, '¬').replace(/\b(und|and)\b/gi, '∧').replace(/\b(oder|or)\b/gi, '∨').replace(/\bxor\b/gi, '⊕');
    const out = [];
    for (const ch of s) { if (/\s/.test(ch)) continue; if ('¬∧∨⊕→↔()01'.indexOf(ch) >= 0) out.push(ch); else if (/[A-Za-z]/.test(ch)) out.push(ch.toUpperCase()); else return null; }
    return out;
  }
  // Aussage einlesen → Baum oder null (Fehler, mehr als 4 Variablen, leer)
  function parse(src) {
    const T = tokens(src); if (!T || !T.length || T.length > 80) return null;
    let i = 0, ok = true;
    const bin = (k, a, b) => ({ k, a, b });
    function atom() { const t = T[i++]; if (t === '(') { const e = eq(); if (T[i++] !== ')') ok = false; return e; } if (t === '0' || t === '1') return { k: 'c', v: t === '1' }; if (t && /^[A-Z]$/.test(t)) return { k: 'v', n: t }; ok = false; return { k: 'c', v: false }; }
    function not() { if (T[i] === '¬') { i++; return { k: 'not', a: not() }; } return atom(); }
    function and() { let a = not(); while (T[i] === '∧') { i++; a = bin('and', a, not()); } return a; }
    function or() { let a = and(); while (T[i] === '∨' || T[i] === '⊕') { const k = T[i++] === '∨' ? 'or' : 'xor'; a = bin(k, a, and()); } return a; }
    function imp() { const a = or(); if (T[i] === '→') { i++; return bin('imp', a, imp()); } return a; }
    function eq() { let a = imp(); while (T[i] === '↔') { i++; a = bin('eq', a, imp()); } return a; }
    const e = eq(); if (!ok || i !== T.length || vars(e).length > 4) return null;
    return e;
  }
  function vars(e, acc) { acc = acc || []; if (e.k === 'v') { if (acc.indexOf(e.n) < 0) acc.push(e.n); } else { if (e.a) vars(e.a, acc); if (e.b) vars(e.b, acc); } return acc.sort(); }
  function ev(e, env) {
    switch (e.k) { case 'v': return !!env[e.n]; case 'c': return e.v; case 'not': return !ev(e.a, env); case 'and': return ev(e.a, env) && ev(e.b, env); case 'or': return ev(e.a, env) || ev(e.b, env);
      case 'xor': return ev(e.a, env) !== ev(e.b, env); case 'imp': return !ev(e.a, env) || ev(e.b, env); default: return ev(e.a, env) === ev(e.b, env); }
  }
  function show(e, S, neg) {
    if (e.k === 'v') return e.n; if (e.k === 'c') return e.v ? '1' : '0';
    // Klammern: jede zusammengesetzte Teilaussage wird geklammert, ausser links in einer Kette derselben Verknüpfung (A ∧ B ∧ C)
    const w = (c, need) => (need ? '(' + show(c, S, neg) + ')' : show(c, S, neg)), bin = c => PREC[c.k] < 5;
    if (e.k === 'not') return neg + w(e.a, bin(e.a));
    return w(e.a, bin(e.a) && !(e.a.k === e.k && e.k !== 'imp')) + (S === SYM ? ' ' + S[e.k] + ' ' : S[e.k]) + w(e.b, bin(e.b));
  }
  const str = e => show(e, SYM, '¬'), tex = e => show(e, TEX, '\\neg ');
  const norm = src => { const e = parse(src); return e ? str(e) : null; };           // bereinigte Schreibweise oder null
  // alle Belegungen, wahr zuerst: [{A: true, B: true}, {A: true, B: false}, …]
  function rows(vs) { const n = vs.length, out = []; for (let m = 0; m < (1 << n); m++) { const env = {}; vs.forEach((v, k) => { env[v] = !(m & (1 << (n - 1 - k))); }); out.push(env); } return out; }
  // Teilaussagen von innen nach aussen (ohne Variablen und Konstanten), höchstens die letzten 6
  function subs(e) { const out = [], seen = {}; (function walk(x) { if (x.a) walk(x.a); if (x.b) walk(x.b); if (x.k !== 'v' && x.k !== 'c') { const s = str(x); if (!seen[s]) { seen[s] = 1; out.push(x); } } })(e); return out.slice(-6); }
  function table(e, vs) { vs = vs || vars(e); const R = rows(vs), col = R.map(env => ev(e, env)), nT = col.filter(Boolean).length; return { vs, R, col, nT, kind: nT === col.length ? 'taut' : nT === 0 ? 'contra' : 'sat' }; }
  // Felder des Mengenbilds (2 oder 3 Variablen), in denen die Aussage wahr ist: Bitmenge für setVenn
  function venn(e, vs) { let bits = 0; rows(vs).forEach(env => { if (ev(e, env)) { let m = 0; vs.forEach((v, k) => { if (env[v]) m |= 1 << k; }); bits |= 1 << m; } }); return bits; }
  const val = (v, bits) => (bits === '10' ? (v ? '1' : '0') : (v ? 'w' : 'f'));
  const OPS = {
    not: ['¬A', 'Negation (nicht)', 'Die Negation kehrt den Wahrheitswert um: Aus wahr wird falsch, aus falsch wird wahr.', 'Gelesen «nicht A». Beispiel: A «Es regnet.» wird zu «Es regnet nicht.»'],
    and: ['A ∧ B', 'Konjunktion (und)', 'Die Konjunktion ist nur wahr, wenn beide Aussagen wahr sind.', 'Gelesen «A und B». Beispiel: «Es regnet, und es ist kalt.»'],
    or: ['A ∨ B', 'Disjunktion (oder)', 'Die Disjunktion ist wahr, wenn mindestens eine der beiden Aussagen wahr ist. Auch beide dürfen wahr sein (einschliessendes Oder).', 'Gelesen «A oder B». Beispiel: «Zum Kaffee nehme ich Milch oder Zucker» schliesst beides zusammen nicht aus.'],
    xor: ['A ⊕ B', 'Entweder – oder', 'Das ausschliessende Oder ist wahr, wenn genau eine der beiden Aussagen wahr ist.', 'Gelesen «entweder A oder B». Beispiel: «Ich fahre entweder mit dem Zug oder mit dem Auto.»'],
    imp: ['A → B', 'Implikation (wenn – dann)', 'Die Implikation ist nur falsch, wenn A wahr und B falsch ist. Ist A falsch, gilt sie als wahr.', 'Gelesen «wenn A, dann B». Beispiel: «Wenn es regnet, ist die Strasse nass.» Bei trockenem Wetter ist dieses Versprechen nicht gebrochen.'],
    eq: ['A ↔ B', 'Äquivalenz (genau dann, wenn)', 'Die Äquivalenz ist wahr, wenn beide Aussagen denselben Wahrheitswert haben.', 'Gelesen «A genau dann, wenn B». Beispiel: «Eine Zahl ist genau dann gerade, wenn ihre letzte Ziffer gerade ist.»']
  };
  // Beispiele für Implikation, Umkehrung, Kontraposition, Inversion, Verneinung (ganze Sätze)
  const IMPL = {
    regen: ['Wenn es regnet, ist die Strasse nass.', 'Wenn die Strasse nass ist, regnet es.', 'Wenn die Strasse nicht nass ist, regnet es nicht.', 'Wenn es nicht regnet, ist die Strasse nicht nass.', 'Es regnet, und die Strasse ist nicht nass.'],
    teil: ['Wenn eine Zahl durch 4 teilbar ist, ist sie gerade.', 'Wenn eine Zahl gerade ist, ist sie durch 4 teilbar.', 'Wenn eine Zahl nicht gerade ist, ist sie nicht durch 4 teilbar.', 'Wenn eine Zahl nicht durch 4 teilbar ist, ist sie nicht gerade.', 'Die Zahl ist durch 4 teilbar und nicht gerade.'],
    quad: ['Wenn ein Viereck ein Quadrat ist, hat es vier rechte Winkel.', 'Wenn ein Viereck vier rechte Winkel hat, ist es ein Quadrat.', 'Wenn ein Viereck nicht vier rechte Winkel hat, ist es kein Quadrat.', 'Wenn ein Viereck kein Quadrat ist, hat es nicht vier rechte Winkel.', 'Das Viereck ist ein Quadrat und hat nicht vier rechte Winkel.']
  };
  const FORMS = [['imp', 'A → B', 'Implikation'], ['rev', 'B → A', 'Umkehrung'], ['con', '¬B → ¬A', 'Kontraposition'], ['inv', '¬A → ¬B', 'Inversion'], ['neg', 'A ∧ ¬B', 'Verneinung']];

  // ── Rechenwege ──
  const mk = () => { const st = []; const f = k => (s, sc) => { st.push({ k, s, sc }); }; return { st, p: f('p'), e: f('e'), res: f('res'), note: f('note') }; };
  const tv = (v, bits) => '\\,\\text{' + val(v, bits) + '}';
  function docOps(P) {
    const B = mk(), o = OPS[P.op], e = parse(o[0]), un = P.op === 'not', vs = un ? ['A'] : ['A', 'B'];
    B.p('**' + o[1] + ':** ' + o[2]);
    rows(vs).forEach(env => B.e(vs.map(v => v + '=' + tv(env[v], P.bits)).join(',\\ ') + ':\\quad ' + tex(e) + '=' + tv(ev(e, env), P.bits), ev(e, env) ? 'g' : 'r'));
    B.p(o[3]);
    B.p('**Mengenbild:** Im Kreis A ist die Aussage A wahr, ausserhalb ist sie falsch. Schraffiert sind die Felder, in denen die verknüpfte Aussage wahr ist.');
    const env = { A: P.a, B: P.b };
    B.res('Aktuelle Zeile: $' + tex(e) + '$ ist ' + (ev(e, env) ? 'wahr' : 'falsch'));
    return { title: 'Verknüpfungen', st: B.st };
  }
  function docTable(P) {
    const B = mk(), e = parse(P.f), T = table(e), S = subs(e);
    B.p('**Belegungen:** Bei $n$ Variablen gibt es $2^n$ Zeilen, weil jede Variable wahr oder falsch sein kann.');
    B.e('n=' + T.vs.length + ':\\quad 2^{' + T.vs.length + '}=' + T.R.length + '\\text{ Zeilen}', 'b');
    if (S.length > 1) { B.p('**Reihenfolge:** Man rechnet von innen nach aussen, jede Teilaussage in einer eigenen Spalte.'); S.forEach((s, k) => B.e((k + 1) + '.\\quad ' + tex(s), k === S.length - 1 ? 'v' : undefined)); }
    B.p('**Auswertung:** Die letzte Spalte zeigt, für welche Belegungen die Aussage wahr ist.');
    const tr = T.R.filter((env, k) => T.col[k]);
    if (T.kind === 'sat') tr.slice(0, 8).forEach(env => B.e(T.vs.map(v => v + '=' + tv(env[v], P.bits)).join(',\\ '), 'g'));
    B.res(T.kind === 'taut' ? 'Die Aussage ist in allen ' + T.R.length + ' Zeilen wahr: eine Tautologie' : T.kind === 'contra' ? 'Die Aussage ist in keiner Zeile wahr: ein Widerspruch' : 'Die Aussage ist in ' + T.nT + ' von ' + T.R.length + ' Zeilen wahr: erfüllbar, aber keine Tautologie');
    return { title: 'Wahrheitstafel einer Aussage', st: B.st };
  }
  function eqInfo(P) { const f = parse(P.f), g = parse(P.g), vs = vars({ k: 'and', a: f, b: g }), R = rows(vs), cf = R.map(env => ev(f, env)), cg = R.map(env => ev(g, env)), bad = []; cf.forEach((v, k) => { if (v !== cg[k]) bad.push(k); }); return { f, g, vs, R, cf, cg, bad }; }
  function docEquiv(P) {
    const B = mk(), I = eqInfo(P);
    B.p('**Gleichwertig** heissen zwei Aussagen, wenn sie bei jeder Belegung denselben Wahrheitswert haben. Man vergleicht ihre Spalten in der Wahrheitstafel Zeile für Zeile.');
    B.e(tex(I.f), 'b'); B.e(tex(I.g), 'g');
    if (I.bad.length) { B.p('**Unterschied:** Bei diesen Belegungen haben die beiden Aussagen verschiedene Wahrheitswerte.'); I.bad.slice(0, 8).forEach(k => B.e(I.vs.map(v => v + '=' + tv(I.R[k][v], P.bits)).join(',\\ ') + ':\\quad ' + tv(I.cf[k], P.bits) + '\\neq ' + tv(I.cg[k], P.bits), 'r')); }
    else B.p('**Vergleich:** In allen ' + I.R.length + ' Zeilen stimmen die beiden Spalten überein. Im Mengenbild sind dieselben Felder schraffiert.');
    B.note('Gleichwertige Aussagen darf man gegeneinander austauschen, so wie man in der Algebra Terme umformt.');
    B.res(I.bad.length ? 'Die Aussagen sind nicht gleichwertig: Unterschied in ' + I.bad.length + ' von ' + I.R.length + ' Zeilen' : 'Die Aussagen sind gleichwertig');
    return { title: 'Gleichwertige Aussagen', st: B.st };
  }
  function docImpl(P) {
    const B = mk();
    B.p('**Implikation** $A\\to B$: «wenn A, dann B». Sie ist nur falsch, wenn A wahr und B falsch ist.');
    B.p('**Kontraposition** $\\neg B\\to\\neg A$: «wenn nicht B, dann nicht A». Sie hat dieselbe Spalte wie die Implikation und ist darum gleichwertig. Darauf beruht der indirekte Beweis.');
    B.e('A\\to B\\quad\\Leftrightarrow\\quad\\neg B\\to \\neg A', 'b');
    B.p('**Umkehrung** $B\\to A$ und **Inversion** $\\neg A\\to\\neg B$ sind zueinander gleichwertig, aber nicht zur Implikation. Aus «wenn A, dann B» folgt nicht «wenn B, dann A».');
    B.e('B\\to A\\quad\\Leftrightarrow\\quad\\neg A\\to \\neg B', 'o');
    B.p('**Verneinung** der Implikation: A ist wahr und B trotzdem falsch.');
    B.e('\\neg(A\\to B)\\quad\\Leftrightarrow\\quad A\\land\\neg B', 'r');
    B.p('**Sprechweise:** Gilt $A\\to B$, so heisst A **hinreichend** für B und B **notwendig** für A.');
    const env = { A: P.a, B: P.b };
    B.res('Aktuelle Belegung: ' + FORMS.map(f => '$' + tex(parse(f[1])) + '$ ' + (ev(parse(f[1]), env) ? 'wahr' : 'falsch')).slice(0, 2).join(', '));
    return { title: 'Implikation und Umkehrung', st: B.st };
  }
  const doc = (v, P) => ({ ops: docOps, table: docTable, equiv: docEquiv, impl: docImpl })[v](P);
  return { parse, vars, ev, str, tex, norm, rows, subs, table, venn, val, eqInfo, OPS, IMPL, FORMS, doc };
})();

// ── Bilder ──
// Wahrheitstafel in das Rechteck r: heads [{s (Rich), res: Ergebnisspalte, col}], rows [[bool …]]; o: {bits, hl: Zeile, bad: [Zeilen], hit: Zeile → id, hlId}
function lgTable(S, r, C, heads, rows, o) {
  o = o || {}; const fs0 = C.fs, wch = h => { let w = h.s.replace(/\\[a-z]+ ?/g, 'xx').replace(/\\,/g, '').length * 0.6; try { if (typeof finRichSize === 'function') { const q = finRichSize(h.s, 10, true).w / 10; if (isFinite(q) && q > 0) w = q * 0.95; } } catch (e) { /* Schätzung */ } return Math.max(2.4, w + 1.3); }, ws = heads.map(wch), tw = ws.reduce((a, b) => a + b, 0);
  const fs = Math.max(6, Math.min(fs0 * (o.max || 1.15), r.w / tw, r.h / ((rows.length + 1) * 1.75))), rh = fs * 1.75, x0 = r.x + (r.w - tw * fs) / 2, W = tw * fs;
  S.rect(x0, r.y, W, rh, { fill: ST_B, a: 0.12 });
  let x = x0; const xs = [];
  heads.forEach((h, j) => { const w = ws[j] * fs; xs.push([x, w]); if (h.res) S.rect(x, r.y, w, rh * (rows.length + 1), { fill: h.col || ST_V, a: 0.08 }); S.rich(x + w / 2, r.y + rh / 2, h.s, { size: fs * 0.95, col: h.col || 'T', al: 'c', bs: 'm', bold: true }); if (h.hl) shlBox(S, h.hl, x, r.y, x + w, r.y + rh * (rows.length + 1)); x += w; });
  S.line(x0, r.y + rh, x0 + W, r.y + rh, { col: 'L', lw: 1.2 });
  rows.forEach((row, i) => {
    const y = r.y + rh * (i + 1), bad = o.bad && o.bad.indexOf(i) >= 0;
    if (bad) S.rect(x0, y, W, rh, { fill: ST_R, a: 0.16 });
    if (o.hl === i) { S.rect(x0, y, W, rh, { fill: ST_O, stroke: ST_O, lw: 1.6, a: 0.16 }); shlBox(S, 'row', x0, y, x0 + W, y + rh); }
    if (i) S.line(x0, y, x0 + W, y, { col: 'G', lw: 1 });
    row.forEach((v, j) => S.text(xs[j][0] + xs[j][1] / 2, y + rh / 2, Lg.val(v, o.bits), { size: fs, col: v ? ST_G : ST_R, al: 'c', bs: 'm', bold: !!heads[j].res, notr: true }));
    if (o.hit && !C.exp) S.hits.push({ id: 'r' + i, x: x0, y, w: W, h: rh, on: () => o.hit(i) });
  });
  if (o.hlId) shlBox(S, o.hlId, x0, r.y, x0 + W, r.y + rh * (rows.length + 1));
  return { x0, W, y1: r.y + rh * (rows.length + 1), fs, rh, xs };
}
const lgWide = (W, H) => W > H * 1.15 && W > 520;
function lgSceneOps(S, W, H, C) {
  const P = C.P, fs = C.fs, o = Lg.OPS[P.op], e = Lg.parse(o[0]), un = P.op === 'not', vs = un ? ['A'] : ['A', 'B'], R = Lg.rows(vs), wide = lgWide(W, H);
  const rT = wide ? { x: fs, y: fs * 3.4, w: W * 0.42 - fs, h: H - fs * 7 } : { x: fs, y: fs * 3.4, w: W - fs * 2, h: H * 0.42 - fs * 3.4 };
  const rV = wide ? { x: W * 0.42, y: fs * 2.2, w: W * 0.58 - fs * 0.5, h: H - fs * 3.2 } : { x: fs, y: H * 0.44, w: W - fs * 2, h: H * 0.56 - fs * 0.5 };
  S.rich(fs, fs * 1.5, '\\col{v}{' + Lg.tex(e) + '}', { size: fs * 1.5, col: 'T', al: 'l', bs: 'm', bold: true }); S.text(fs * (un ? 5.5 : 8.5), fs * 1.5, o[1], { size: fs * 1.05, col: 'M', al: 'l', bs: 'm' });
  shlBox(S, 'op', fs * 0.6, fs * 0.4, Math.min(W - fs, fs * 24), fs * 2.6);
  const cur = R.findIndex(env => env.A === P.a && (un || env.B === P.b));
  const tb = lgTable(S, rT, C, vs.map(v => ({ s: v })).concat([{ s: Lg.tex(e), res: true, col: ST_V }]), R.map(env => vs.map(v => env[v]).concat([Lg.ev(e, env)])), { bits: P.bits, max: 1.7, hl: cur, hlId: 'tab', hit: i => { P.a = R[i].A; if (!un) P.b = R[i].B; } });
  S.text(tb.x0, tb.y1 + fs * 1.3, 'Zeile anklicken', { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
  const m = (P.a ? 1 : 0) | (P.b ? 2 : 0), V = setVenn(S, rV, C, { n: 2, hatch: Lg.venn(e, ['A', 'B']), hcol: ST_V, names: ['A', 'B'], hl: 'venn' });
  const an = setVAnchors(2)[m]; if (an) { S.circ(V.X(an.x), V.Y(an.y), fs * 0.62, { fill: ST_O, stroke: 'W', lw: 2 }); shlC(S, 'row', V.X(an.x), V.Y(an.y), fs * 1.3); }
}
function lgSceneTable(S, W, H, C) {
  const P = C.P, fs = C.fs, e = Lg.parse(P.f), T = Lg.table(e), sub = Lg.subs(e), nv = T.vs.length, venn = nv === 2 || nv === 3, wide = lgWide(W, H);
  const kc = T.kind === 'taut' ? ST_G : T.kind === 'contra' ? ST_R : ST_V;
  S.rich(fs, fs * 1.5, '\\col{v}{' + Lg.tex(e) + '}', { size: fs * 1.4, col: 'T', al: 'l', bs: 'm', bold: true }); shlBox(S, 'f', fs * 0.6, fs * 0.4, W - fs, fs * 2.6);
  const rT = !venn ? { x: fs, y: fs * 3.2, w: W - fs * 2, h: H - fs * 6.6 } : wide ? { x: fs, y: fs * 3.2, w: W * 0.58 - fs, h: H - fs * 6.6 } : { x: fs, y: fs * 3.2, w: W - fs * 2, h: H * 0.56 - fs * 5.6 };
  const heads = T.vs.map(v => ({ s: v })).concat(sub.map((s, k) => (k === sub.length - 1 ? { s: Lg.tex(s), res: true, col: ST_V, hl: 'res' } : { s: Lg.tex(s), hl: 'sub' })));
  if (!sub.length) heads.push({ s: Lg.tex(e), res: true, col: ST_V, hl: 'res' });
  const tb = lgTable(S, rT, C, heads, T.R.map(env => T.vs.map(v => env[v]).concat(sub.length ? sub.map(s => Lg.ev(s, env)) : [Lg.ev(e, env)])), { bits: P.bits, hlId: 'tab' });
  S.text(tb.x0, tb.y1 + fs * 1.4, T.kind === 'taut' ? 'Tautologie: in jeder Zeile wahr' : T.kind === 'contra' ? 'Widerspruch: in keiner Zeile wahr' : 'Erfüllbar, aber nicht immer wahr', { size: fs * 1.05, col: kc, al: 'l', bs: 'm', bold: true });
  if (venn) setVenn(S, wide ? { x: W * 0.58, y: fs * 2.6, w: W * 0.42 - fs * 0.5, h: H - fs * 3.4 } : { x: fs, y: H * 0.56, w: W - fs * 2, h: H * 0.44 - fs * 0.5 }, C, { n: nv, hatch: Lg.venn(e, T.vs), hcol: ST_V, names: T.vs });
}
function lgSceneEquiv(S, W, H, C) {
  const P = C.P, fs = C.fs, I = Lg.eqInfo(P), nv = I.vs.length, venn = nv === 2 || nv === 3, wide = lgWide(W, H), same = !I.bad.length;
  S.rich(fs, fs * 1.5, '\\col{b}{' + Lg.tex(I.f) + '}', { size: fs * 1.3, col: 'T', al: 'l', bs: 'm', bold: true }); shlBox(S, 'f', fs * 0.6, fs * 0.4, W * 0.5 - fs * 0.5, fs * 2.6);
  S.rich(W * 0.5 + fs * 0.5, fs * 1.5, '\\col{g}{' + Lg.tex(I.g) + '}', { size: fs * 1.3, col: 'T', al: 'l', bs: 'm', bold: true }); shlBox(S, 'g', W * 0.5, fs * 0.4, W - fs * 0.6, fs * 2.6);
  const rT = !venn ? { x: fs, y: fs * 3.2, w: W - fs * 2, h: H - fs * 6.6 } : wide ? { x: fs, y: fs * 3.2, w: W * 0.5 - fs, h: H - fs * 6.6 } : { x: fs, y: fs * 3.2, w: W - fs * 2, h: H * 0.58 - fs * 5.6 };
  const tb = lgTable(S, rT, C, I.vs.map(v => ({ s: v })).concat([{ s: Lg.tex(I.f), res: true, col: ST_B }, { s: Lg.tex(I.g), res: true, col: ST_G }]), I.R.map((env, k) => I.vs.map(v => env[v]).concat([I.cf[k], I.cg[k]])), { bits: P.bits, bad: I.bad, hlId: 'tab' });
  S.text(tb.x0, tb.y1 + fs * 1.4, same ? 'Gleichwertig: beide Spalten stimmen überein' : 'Nicht gleichwertig: rote Zeilen unterscheiden sich', { size: fs * 1.05, col: same ? ST_G : ST_R, al: 'l', bs: 'm', bold: true });
  if (!venn) return;
  const rv = wide ? { x: W * 0.5, y: fs * 2.8, w: W * 0.5 - fs * 0.5, h: H - fs * 3.6 } : { x: fs, y: H * 0.58, w: W - fs * 2, h: H * 0.42 - fs * 0.5 }, half = wide ? { w: rv.w, h: rv.h / 2 } : { w: rv.w / 2, h: rv.h };
  setVenn(S, { x: rv.x, y: rv.y, w: half.w, h: half.h }, C, { n: nv, hatch: Lg.venn(I.f, I.vs), hcol: ST_B, names: I.vs, hl: 'venn' });
  setVenn(S, wide ? { x: rv.x, y: rv.y + half.h, w: half.w, h: half.h } : { x: rv.x + half.w, y: rv.y, w: half.w, h: half.h }, C, { n: nv, hatch: Lg.venn(I.g, I.vs), hcol: ST_G, names: I.vs, hl: 'venn' });
}
function lgSceneImpl(S, W, H, C) {
  const P = C.P, fs = C.fs, R = Lg.rows(['A', 'B']), sent = Lg.IMPL[P.ex] || Lg.IMPL.regen, cur = R.findIndex(env => env.A === P.a && env.B === P.b);
  const COL = { imp: ST_B, con: ST_B, rev: ST_O, inv: ST_O, neg: ST_R }, n = Lg.FORMS.length;
  const xT = Math.max(W * 0.56, W - fs * 15), cw = (W - fs - xT) / 4, y0 = fs * 3.4, rh = Math.min((H - y0 - fs * 1.2) / n, fs * 6.2), fz = Math.min(fs, (xT - fs * 2) / 24);
  S.text(fs, fs * 1.8, 'Belegung anklicken', { size: fs * 0.85, col: 'M', al: 'l', bs: 'm' });
  R.forEach((env, j) => {
    const x = xT + cw * j;
    if (j === cur) { S.rect(x, fs * 0.5, cw, y0 + rh * n - fs * 0.5, { fill: ST_O, stroke: ST_O, lw: 1.4, a: 0.14 }); }
    shlBox(S, 'col', x, fs * 0.5, x + cw, y0 - fs * 0.3);
    S.text(x + cw / 2, fs * 1.2, 'A: ' + Lg.val(env.A, P.bits), { size: fs * 0.85, col: env.A ? ST_G : ST_R, al: 'c', bs: 'm', notr: true }); S.text(x + cw / 2, fs * 2.4, 'B: ' + Lg.val(env.B, P.bits), { size: fs * 0.85, col: env.B ? ST_G : ST_R, al: 'c', bs: 'm', notr: true });
    if (!C.exp) S.hits.push({ id: 'c' + j, x, y: fs * 0.3, w: cw, h: y0 + rh * n, on: () => { P.a = env.A; P.b = env.B; } });
  });
  S.line(fs, y0, W - fs, y0, { col: 'L', lw: 1.2 });
  Lg.FORMS.forEach((f, i) => {
    const y = y0 + rh * i, e = Lg.parse(f[1]), col = COL[f[0]];
    S.rect(fs * 0.6, y + rh * 0.12, fs * 0.35, rh * 0.76, { fill: col, a: 0.9 });
    S.text(fs * 1.5, y + rh * 0.26, f[2], { size: fz * 1.0, col, al: 'l', bs: 'm', bold: true });
    S.rich(fs * 1.5 + fz * 9.5, y + rh * 0.26, Lg.tex(e), { size: fz * 1.1, col: 'T', al: 'l', bs: 'm', bold: true });
    S.text(fs * 1.5, y + rh * 0.66, sent[i], { size: Math.min(fz * 0.92, (xT - fs * 2.2) / (sent[i].length * 0.5)), col: 'T', al: 'l', bs: 'm' });
    shlBox(S, f[0], fs * 0.5, y + 2, W - fs, y + rh - 2);
    R.forEach((env, j) => { const v = Lg.ev(e, env); S.text(xT + cw * j + cw / 2, y + rh / 2, Lg.val(v, P.bits), { size: fs * 1.15, col: v ? ST_G : ST_R, al: 'c', bs: 'm', bold: true, notr: true }); });
    if (i < n - 1) S.line(fs, y + rh, W - fs, y + rh, { col: 'G', lw: 1 });
  });
}

kitDefine({
  id: 'logic', icon: '∧', title: 'Aussagenlogik', group: 'alg',
  desc: 'Verknüpfungen (nicht, und, oder, entweder–oder, wenn–dann, genau dann wenn) mit Wahrheitstafel und Mengenbild, Wahrheitstafel beliebiger Aussagen, Tautologie und Widerspruch, gleichwertige Aussagen und Gesetze, Implikation mit Umkehrung und Kontraposition',
  about: 'Aussagen verknüpfen und auswerten: Wahrheitstafeln Schritt für Schritt, das passende Mengenbild dazu, die wichtigsten Gesetze zum Umformen und der Unterschied zwischen einer Implikation und ihrer Umkehrung.',
  tip: 'Klicke eine Zeile der Wahrheitstafel an oder tippe links eine eigene Aussage ein. Das Mengenbild zeigt, wo sie wahr ist.',
  help: ['Aussagen tippst du mit den Knöpfen unter dem Feld oder über die Tastatur: ! für nicht, & für und, | für oder, ^ für entweder–oder; die Pfeile als Minus- und Grösser-Zeichen. Auch die Wörter nicht, und, oder werden verstanden.',
    'Ohne Klammern gilt: zuerst nicht, dann und, dann oder, dann wenn–dann, zuletzt genau dann wenn. Erlaubt sind bis zu vier Variablen; ein Mengenbild gibt es bei zwei oder drei.',
    'Die Wahrheitswerte stehen als w und f oder als 1 und 0; die Wahl gilt für alle Ansichten.'],
  kw: { ops: 'Aussage Verknüpfung Junktor Negation Konjunktion Disjunktion Implikation Äquivalenz und oder nicht entweder oder Wahrheitswert', table: 'Wahrheitstafel Wahrheitstabelle Tautologie Widerspruch Kontradiktion erfüllbar Belegung Aussageform', equiv: 'gleichwertig äquivalent logische Gesetze De Morgan Distributivgesetz doppelte Verneinung Absorption umformen', impl: 'Implikation Umkehrung Kontraposition Inversion notwendig hinreichend indirekter Beweis wenn dann Verneinung' },
  views: [['ops', 'Verknüpfungen'], ['table', 'Wahrheitstafel einer Aussage'], ['equiv', 'Gleichwertige Aussagen und Gesetze'], ['impl', 'Implikation, Umkehrung, Kontraposition']],
  quiz: ['ops', 'table', 'equiv', 'impl'], shared: ['bits'],
  descs: {
    ops: ['Wähle links eine {{logische Verknüpfung|op}} und klicke eine Zeile der {{Wahrheitstafel|tab}} an: Die {{markierte Zeile|row}} gehört zu einem Feld im {{Mengenbild|venn}}. Schraffiert sind die Felder, in denen die verknüpfte Aussage wahr ist.', 'Eine Aussage ist entweder wahr oder falsch. Verknüpfungen bilden aus Aussagen neue Aussagen; die Wahrheitstafel legt für jede Kombination der Wahrheitswerte fest, ob die neue Aussage wahr ist. Im Mengenbild bedeutet «im Kreis A»: A ist wahr.'],
    table: ['Tippe links eine {{eigene Aussage|f}} ein: Die {{Wahrheitstafel|tab}} rechnet sie für alle Belegungen aus, von den {{Teilaussagen|sub}} bis zur {{letzten Spalte|res}}. Steht dort überall «wahr», ist die Aussage eine Tautologie.', 'Bei n Variablen hat die Wahrheitstafel 2ⁿ Zeilen. Man rechnet von innen nach aussen: zuerst Klammern und Verneinungen, dann «und», dann «oder», zuletzt die Pfeile. Eine Tautologie ist immer wahr, ein Widerspruch immer falsch.'],
    equiv: ['Vergleiche die {{blaue|f}} und die {{grüne Aussage|g}}: Stimmen ihre Spalten in der {{Wahrheitstafel|tab}} überall überein, sind sie gleichwertig; dann sind auch die {{Mengenbilder|venn}} gleich schraffiert. Unter «Beispiel wählen …» stehen die wichtigsten Gesetze.', 'Zwei Aussagen sind gleichwertig (äquivalent), wenn sie bei jeder Belegung denselben Wahrheitswert haben. Wichtige Gesetze: De Morgan, Distributivgesetze, doppelte Verneinung, Kontraposition. Mit ihnen formt man Aussagen um wie Terme in der Algebra.'],
    impl: ['Wähle ein Beispiel und klicke eine {{Belegung|col}} an: Die {{Implikation A → B|imp}} ist nur falsch, wenn A wahr und B falsch ist. Die {{Kontraposition ¬B → ¬A|con}} hat dieselben Wahrheitswerte und ist gleichwertig, die {{Umkehrung B → A|rev}} nicht. Die {{Verneinung A ∧ ¬B|neg}} ist genau dann wahr, wenn die Implikation falsch ist.', 'Aus «wenn A, dann B» folgt nicht «wenn B, dann A». Gleichwertig ist nur die Kontraposition «wenn nicht B, dann nicht A»; darauf beruht der indirekte Beweis. A heisst hinreichend für B, B notwendig für A.']
  },
  def: {
    ops: { op: 'and', a: true, b: false, bits: 'wf' },
    table: { f: '(A → B) ∧ ¬B', bits: 'wf' },
    equiv: { f: '¬(A ∧ B)', g: '¬A ∨ ¬B', bits: 'wf' },
    impl: { ex: 'regen', a: true, b: true, bits: 'wf' }
  },
  controls(v) {
    const bits = { k: 'bits', t: 'select', l: 'Wahrheitswerte', o: [['wf', 'w / f'], ['10', '1 / 0']] }, keys = ['¬', '∧', '∨', '⊕', '→', '↔', '(', ')'], err = 'Diese Aussage wird nicht verstanden. Erlaubt sind höchstens vier Variablen (Buchstaben), die Zeichen der Knöpfe und Klammern.';
    const ab = [{ k: 'a', t: 'check', l: 'A ist wahr' }, { k: 'b', t: 'check', l: 'B ist wahr' }];
    if (v === 'ops') return [{ k: 'op', t: 'select', l: 'Verknüpfung', o: Object.keys(Lg.OPS).map(k => [k, Lg.OPS[k][1]]) }].concat(ab, [bits]);
    if (v === 'table') return [{ k: 'f', t: 'text', l: 'Aussage', ok: Lg.norm, keys, err }, bits];
    if (v === 'equiv') return [{ k: 'f', t: 'text', l: 'Erste Aussage (blau)', ok: Lg.norm, keys, err }, { k: 'g', t: 'text', l: 'Zweite Aussage (grün)', ok: Lg.norm, keys, err }, bits];
    return [{ k: 'ex', t: 'select', l: 'Beispiel', o: [['regen', 'Regen und nasse Strasse'], ['teil', 'Teilbar durch 4 und gerade'], ['quad', 'Quadrat und rechte Winkel']] }].concat(ab, [bits]);
  },
  presets: {
    table: [['Modus tollens: (A → B) ∧ ¬B', { f: '(A → B) ∧ ¬B' }], ['Tautologie: A ∨ ¬A', { f: 'A ∨ ¬A' }], ['Widerspruch: A ∧ ¬A', { f: 'A ∧ ¬A' }], ['Drei Variablen: (A ∧ B) ∨ C', { f: '(A ∧ B) ∨ C' }], ['Immer wahr: A → (B → A)', { f: 'A → (B → A)' }], ['Kettenschluss', { f: '((A → B) ∧ (B → C)) → (A → C)' }], ['Entweder – oder mit ∧ und ∨', { f: '(A ∨ B) ∧ ¬(A ∧ B)' }]],
    equiv: [['De Morgan: ¬(A ∧ B) und ¬A ∨ ¬B', { f: '¬(A ∧ B)', g: '¬A ∨ ¬B' }], ['De Morgan: ¬(A ∨ B) und ¬A ∧ ¬B', { f: '¬(A ∨ B)', g: '¬A ∧ ¬B' }], ['Implikation ohne Pfeil: ¬A ∨ B', { f: 'A → B', g: '¬A ∨ B' }], ['Kontraposition', { f: 'A → B', g: '¬B → ¬A' }], ['Umkehrung: nicht gleichwertig', { f: 'A → B', g: 'B → A' }], ['Distributivgesetz: ∧ über ∨', { f: 'A ∧ (B ∨ C)', g: '(A ∧ B) ∨ (A ∧ C)' }], ['Distributivgesetz: ∨ über ∧', { f: 'A ∨ (B ∧ C)', g: '(A ∨ B) ∧ (A ∨ C)' }], ['Doppelte Verneinung', { f: '¬¬A', g: 'A' }], ['Äquivalenz als zwei Implikationen', { f: 'A ↔ B', g: '(A → B) ∧ (B → A)' }], ['Absorption', { f: 'A ∨ (A ∧ B)', g: 'A' }], ['Klammern falsch gesetzt', { f: '(A ∧ B) ∨ C', g: 'A ∧ (B ∨ C)' }]]
  },
  sanitize(v, P, src) { if (v === 'impl' && !Lg.IMPL[P.ex]) P.ex = 'regen'; },
  scene: { ops: lgSceneOps, table: lgSceneTable, equiv: lgSceneEquiv, impl: lgSceneImpl },
  doc: (v, P) => Lg.doc(v, P)
});

if (typeof module !== 'undefined' && module.exports) module.exports = { Lg };
