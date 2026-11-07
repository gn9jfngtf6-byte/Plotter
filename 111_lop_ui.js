// ═══════════════════════════════════════════════════════════════════
// 111_lop_ui.js — Lineare Optimierung: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 109_lop.js, 109b_lop_docs.js (Lp). Bilder: 110_lop_draw.js. Aufbau wie 105_sim_ui.js.
// Umgebung «lo» (32_env.js). Das alte Werkzeug (17_linopt.js, #lo-old-panel) ist ausgeblendet.
// Zustand LOP: Ansicht; Ungleichung mit einer Variablen i1; Halbebene ih mit Testpunkt T; Ungleichungssystem list
// (Texte), Nichtnegativität nn, Ganzzahligkeit int, Testpunkt P; Zielfunktion obj, mode max/min, Niveau z (null = Optimum);
// Beispiel ex (Text zu den Variablen, Einheit, Antwortsatz); Ausschnitt; Anzeige.
// ═══════════════════════════════════════════════════════════════════

const LOP_VIEWS = [['ung1', 'Ungleichung mit einer Variablen'], ['half', 'Ungleichung mit zwei Variablen'], ['poly', 'Ungleichungssystem und Planungspolygon'], ['opt', 'Zielfunktion und Optimum']];
const LOP_DESC = {
  ung1: ['Ungleichungen formt man wie Gleichungen um. Aber: Multipliziert oder dividiert man mit einer negativen Zahl, kehrt sich das Ungleichheitszeichen um. Die Lösungsmenge ist ein Intervall.', 'Tippe eine Ungleichung mit x ein, z. B. −2x+5>=1 oder 20+0.1x>35. Oben siehst du beide Seiten als Geraden, unten das Intervall.'],
  half: ['Die Lösungen einer Ungleichung mit x und y bilden eine Halbebene. Grenzgerade zeichnen (bei ≤, ≥ durchgezogen, bei <, > gestrichelt), dann mit einem Testpunkt die richtige Seite bestimmen.', 'Tippe eine Ungleichung ein, z. B. 15x+6y<=60. Ziehe den Testpunkt T auf die andere Seite der Geraden.'],
  poly: ['Mehrere Ungleichungen gleichzeitig: Die Lösungsmenge ist der Durchschnitt der Halbebenen, das Planungspolygon. Seine Eckpunkte sind Schnittpunkte von zwei Grenzgeraden.', 'Gib die Ungleichungen ein (eine pro Zeile). Ziehe den Punkt P: Ist der Produktionsplan möglich?'],
  opt: ['Die Zielfunktion Z = px + qy soll maximal oder minimal werden. Punkte mit gleichem Z liegen auf einer Niveaulinie. Das Optimum liegt in einem Eckpunkt (oder auf einer ganzen Kante).', 'Ziehe die orange Niveaulinie parallel, bis sie das Polygon gerade noch berührt. Rechts stehen die Werte von Z in allen Eckpunkten.']
};
const LOP_EX1 = [['−2x + 5 ≥ 1', '-2x+5>=1'], ['Handyabo: 20 + 0.10·x > 35', '20+0.1x>35'], ['3x − 4 < 2x + 1', '3x-4<2x+1'], ['2(x − 1) ≤ 5x + 4', '2(x-1)<=5x+4'], ['x/2 + 3 > 1', 'x/2+3>1'], ['−3x ≤ 12', '-3x<=12']];
const LOP_EXH = [['Kino: 15x + 6y ≤ 60', '15x+6y<=60'], ['Tankstelle: 2x + 1.8y ≤ 60', '2x+1.8y<=60'], ['y > 2x − 1', 'y>2x-1'], ['x − 2y ≥ 4', 'x-2y>=4'], ['y ≤ −2/3·x + 4', 'y<=-2/3x+4'], ['x ≥ 3', 'x>=3']];
const LOP_EX = [
  { name: 'Computerhersteller (Dossier)', list: ['x+3y<=12', 'x+y<=6'], obj: '1000x+2000y', mode: 'max', nn: true, int: true, vars: '$x$ = Anzahl Computer A, $y$ = Anzahl Computer B', unit: 'CHF', xl: 'x\\ (A)', yl: 'y\\ (B)', P: [2, 4], ans: (x, y, z) => x + ' Computer A und ' + y + ' Computer B, Gewinn ' + z + ' CHF.' },
  { name: 'Schreinerei: Tische und Stühle', list: ['8x+4y<=40', '2x+6y<=30'], obj: '80x+60y', mode: 'max', nn: true, int: true, vars: '$x$ = Anzahl Tische, $y$ = Anzahl Stühle', unit: 'CHF', xl: 'x\\ (Tische)', yl: 'y\\ (Stühle)', P: [4, 3], ans: (x, y, z) => x + ' Tische und ' + y + ' Stühle, Gewinn ' + z + ' CHF.' },
  { name: 'Automobilwerk', list: ['x<=600', 'y<=300', 'x+y<=750'], obj: '2400x+3600y', mode: 'max', nn: true, int: true, vars: '$x$ = Anzahl Wagen A, $y$ = Anzahl Wagen B (pro Tag)', unit: 'CHF', xl: 'x\\ (A)', yl: 'y\\ (B)', P: [500, 250], ans: (x, y, z) => x + ' Wagen A und ' + y + ' Wagen B, Reingewinn ' + z + ' CHF.' },
  { name: 'Architekten: Einfamilien- und Mehrfamilienhäuser', list: ['500x+2000y<=30000', '750000x+2000000y<=36000000'], obj: '36000x+120000y', mode: 'max', nn: true, int: true, vars: '$x$ = Anzahl Einfamilienhäuser, $y$ = Anzahl Mehrfamilienhäuser', unit: 'CHF', xl: 'x\\ (EFH)', yl: 'y\\ (MFH)', P: [20, 10], ans: (x, y, z) => x + ' Einfamilien- und ' + y + ' Mehrfamilienhäuser, Honorar ' + z + ' CHF.' },
  { name: 'Kaffeehändler: zwei Mischungen', list: ['0.3x+0.4y<=360', '0.2x+0.4y<=320', '0.5x+0.2y<=390'], obj: '12x+18y', mode: 'max', nn: true, int: true, vars: '$x$ = Pakete Mischung A, $y$ = Pakete Mischung B', unit: 'CHF', xl: 'x\\ (A)', yl: 'y\\ (B)', P: [500, 500], ans: (x, y, z) => x + ' Pakete A und ' + y + ' Pakete B, Erlös ' + z + ' CHF.' },
  { name: 'Minimum: Futtermischung', list: ['2x+y>=8', 'x+3y>=9'], obj: '3x+2y', mode: 'min', nn: true, int: false, vars: '$x$, $y$ = Mengen der beiden Futtersorten (kg)', unit: 'CHF', P: [2, 2] },
  { name: 'Optimum auf einer ganzen Kante', list: ['x+3y<=12', 'x+y<=6'], obj: '2000x+2000y', mode: 'max', nn: true, int: true, vars: 'Computerhersteller, beide Modelle bringen je 2000 CHF', unit: 'CHF', P: [2, 2] },
  { name: 'Gebiet nicht beschränkt (kein Maximum)', list: ['x-y<=2', 'y-x<=3'], obj: 'x+y', mode: 'max', nn: true, int: false, P: [1, 1] }
];
const LOP_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const LOP_SHOW0 = { intpts: true, level: true, card: true };

function lopDefaults() {
  const E0 = LOP_EX[0];
  return { view: 'opt', i1: '-2x+5>=1', ih: '15x+6y<=60', T: [0, 0], list: E0.list.slice(), nn: true, int: true, obj: E0.obj, mode: 'max', z: null, P: E0.P.slice(), ex: 0, win: Object.assign({}, LOP_WIN0), show: Object.assign({}, LOP_SHOW0) };
}
const LOP = Object.assign(lopDefaults(), { ui: null, S: null, drag: null, cardKey: '', cardT: 0 });
function lopActive() { return typeof ENV !== 'undefined' && ENV.cur === 'lo'; }
const lopR6 = x => Math.round(x * 1e6) / 1e6 + 0;
const lopI1 = () => { const I = Lp.parseIneq(LOP.i1); return I && Math.abs(I.b) < 1e-12 ? I : Lp.parseIneq('-2x+5>=1'); };
const lopIh = () => Lp.parseIneq(LOP.ih) || Lp.parseIneq('15x+6y<=60');
const lopL = () => LOP.list.map(Lp.parseIneq).filter(Boolean);
const lopO = () => Lp.parseObj(LOP.obj) || Lp.parseObj('x+y');
function lopCtx0() {
  const E = LOP_EX[LOP.ex], same = E && JSON.stringify(E.list) === JSON.stringify(LOP.list) && E.obj === LOP.obj;
  const c = { int: LOP.int };
  if (same) { c.vars = E.vars; c.unit = E.unit; c.xl = E.xl; c.yl = E.yl; if (E.ans) c.answer = (x, y, z) => E.ans(Lp.q(x), Lp.q(y), String(Math.round(z * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, "'")); }
  return c;
}

// ── Rechenweg-Karte ──
function lopCardDoc() {
  try {
    const v = LOP.view;
    if (v === 'ung1') return { t: 'Rechenweg: Ungleichung', d: Lp.doc(Lp.st.ung1(lopI1())) };
    if (v === 'half') return { t: 'Rechenweg: Halbebene', d: Lp.doc(Lp.st.half(lopIh(), LOP.T)) };
    if (v === 'poly') return { t: 'Rechenweg: Planungspolygon', d: Lp.doc(Lp.st.poly(lopL(), LOP.nn, lopCtx0())) };
    return { t: 'Rechenweg: Optimum', d: Lp.doc(Lp.st.opt(lopL(), LOP.nn, lopO(), LOP.mode, lopCtx0())) };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
function lopCardKey() { return LOP.view + '|' + JSON.stringify([LOP.i1, LOP.ih, LOP.view === 'half' ? LOP.T : 0, LOP.list, LOP.nn, LOP.int, LOP.obj, LOP.mode, LOP.ex]); }
function lopCardSoon() { clearTimeout(LOP.cardT); LOP.cardT = setTimeout(lopCardRender, 40); }
function lopCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = lopActive() && LOP.show.card;
  if (lopActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = lopCardKey(); if (key === LOP.cardKey) return;
  LOP.cardKey = key;
  const r = lopCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  body.innerHTML = r && r.d && typeof ST !== 'undefined' ? ST.renderDoc(r.d) : '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}

// ── Zustand ──
function lopCapture() { return difCopy({ view: LOP.view, i1: LOP.i1, ih: LOP.ih, T: LOP.T, list: LOP.list, nn: LOP.nn, int: LOP.int, obj: LOP.obj, mode: LOP.mode, z: LOP.z, P: LOP.P, ex: LOP.ex, win: LOP.win, show: LOP.show }); }
function lopApply(s) {
  const d = lopDefaults(), num = (v, def) => { v = Number(v); return isFinite(v) && Math.abs(v) < 1e9 ? v : def; }, pt = (p, def) => (Array.isArray(p) && p.length === 2 ? [num(p[0], def[0]), num(p[1], def[1])] : def);
  const str = v => typeof v === 'string' && v.length < 120;
  if (s && typeof s === 'object') {
    if (LOP_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    if (str(s.i1) && Lp.parseIneq(s.i1)) d.i1 = s.i1; if (str(s.ih) && Lp.parseIneq(s.ih)) d.ih = s.ih;
    d.T = pt(s.T, d.T); d.P = pt(s.P, d.P);
    if (Array.isArray(s.list)) d.list = s.list.filter(x => str(x)).slice(0, 10);
    d.nn = s.nn !== false; d.int = !!s.int; if (str(s.obj) && Lp.parseObj(s.obj)) d.obj = s.obj;
    d.mode = s.mode === 'min' ? 'min' : 'max'; d.z = s.z === null || s.z === undefined ? null : num(s.z, null);
    d.ex = Number.isInteger(s.ex) && s.ex >= 0 && s.ex < LOP_EX.length ? s.ex : -1;
    if (s.win && typeof s.win === 'object') { const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null)); const a = ok(w.x0), b = ok(w.x1), c = ok(w.y0), e = ok(w.y1); if (a !== null && b !== null && c !== null && e !== null && b > a && e > c) d.win = { x0: a, x1: b, y0: c, y1: e }; }
    if (s.show && typeof s.show === 'object') Object.keys(LOP_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  LOP.drag = null; Object.keys(d).forEach(k => { LOP[k] = d[k]; }); LOP.cardKey = '';
  lopRefreshUI(); difRedraw(); lopCardSoon();
}

// ── Zeichnen ──
function lopCtx(W, H, exp) {
  const c0 = lopCtx0();
  return { view: LOP.view, I1: lopI1(), Ih: lopIh(), T: LOP.T, L: lopL(), nn: LOP.nn, int: LOP.int, O: lopO(), mode: LOP.mode, z: LOP.z, P: LOP.P, ctx: c0, win: LOP.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, smooth: !exp, show: LOP.show };
}
const lopDock = w => (LOP.show.card && w >= 760 ? stCardW(w, 0.36) : 0);
const lopDockH = (w, h) => (LOP.show.card && w < 760 ? Math.round(h * 0.5) : 0);
function lopLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = lopDock(w), dh = lopDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function lopDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  lopLayoutCard(w, h); lopCardRender();
  const W = w - lopDock(w), Hs = h - lopDockH(w, h);
  const S = stSoloBuild(lpBuildScene, W, Hs, lopCtx(W, Hs), 'lop|' + LOP.view + '|' + JSON.stringify(LOP.show), W < w || Hs < h);
  LOP.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function lopLatex() { const W = 760, H = 520; const S = lpBuildScene(W, H, lopCtx(W, H, { fs: 11 })); return stSceneTex(S, W, H, (LOP_VIEWS.find(q => q[0] === LOP.view) || [0, ''])[1], 11); }
function lopCardLatex() { const r = lopCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.'; return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d); }
function lopMakeLatex(which) { const ui = LOP.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? lopCardLatex() : lopLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function lopCopyLatex() {
  const ui = LOP.ui; if (!ui) return; if (!ui.ta.value) lopMakeLatex('pic');
  const done = () => { ui.msg.textContent = (typeof t === 'function' ? t('msg_copied') : 'Kopiert'); setTimeout(() => { ui.msg.textContent = ''; }, 2500); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ui.ta.value).then(done).catch(() => { ui.ta.select(); document.execCommand('copy'); done(); });
  else { ui.ta.select(); document.execCommand('copy'); done(); }
}

// ── Ausschnitt ──
function lopResolvedWin() { const m = LOP.S && LOP.S.maps.main; if (m) return Object.assign({}, m.win); const w = LOP.win; return w.x0 !== null && isFinite(w.x0) ? Object.assign({}, w) : { x0: -1, x1: 10, y0: -1, y1: 10 }; }
function lopZoom(f, cx, cy) {
  const w = lopResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f, ny0 = cy - (cy - w.y0) * f, ny1 = cy + (w.y1 - cy) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e7) return;
  LOP.win = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 };
}
function lopResetWin() { LOP.win = Object.assign({}, LOP_WIN0); lopRefreshUI(); difRedraw(); lopCardSoon(); difCommit(); }

// ── Panel ──
function lopBuildUI() {
  if (LOP.ui || !$dif('lo-panel')) return;
  const ui = LOP.ui = {}, body = $dif('lo-body');
  ui.sel = $dif('lo-view');
  LOP_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { LOP.view = ui.sel.value; LOP.cardKey = ''; LOP.win = Object.assign({}, LOP_WIN0); lopRefreshUI(); difRedraw(); lopCardSoon(); difCommit(); });
  ui.desc = $dif('lo-desc'); ui.ex = $dif('lo-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec'); det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => lopMakeLatex('pic')); ui.br.addEventListener('click', () => lopMakeLatex('calc')); ui.bc.addEventListener('click', lopCopyLatex);
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!lopActive()) return; LOP.show.card = false; lopRefreshUI(); difRedraw(); lopCardRender(); difCommit(); });
  lopRefreshUI();
}

function lopRefreshUI() {
  const ui = LOP.ui; if (!ui) return;
  const v = LOP.view, sh = LOP.show;
  ui.sel.value = v;
  const dd = LOP_DESC[v]; ui.desc.replaceChildren(difEl('div', null, dd[0]), Object.assign(difEl('div', null, dd[1]), { style: 'margin-top:5px;' }));
  const exs = v === 'ung1' ? LOP_EX1.map(e => [e[0], e[1]]) : v === 'half' ? LOP_EXH.map(e => [e[0], e[1]]) : LOP_EX.map(e => [e.name, e]);
  ui.ex.replaceChildren(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
  exs.forEach((e, i) => { const o = difEl('option', null, e[0]); o.value = String(i); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const e = exs[+i][1];
    if (v === 'ung1') LOP.i1 = e; else if (v === 'half') { LOP.ih = e; const I = Lp.parseIneq(e); LOP.T = I && Math.abs(I.c) < 1e-12 ? [1, 0] : [0, 0]; }
    else { LOP.list = e.list.slice(); LOP.obj = e.obj; LOP.mode = e.mode; LOP.nn = e.nn; LOP.int = e.int; LOP.P = e.P.slice(); LOP.ex = +i; LOP.z = null; }
    LOP.win = Object.assign({}, LOP_WIN0); LOP.cardKey = ''; lopRefreshUI(); difRedraw(); lopCardSoon(); difCommit();
  };
  ui.params.replaceChildren();
  const P = ui.params;
  const redo = () => { LOP.cardKey = ''; lopRefreshUI(); difRedraw(); lopCardSoon(); difCommit(); };
  const check = (label, get, set) => { const r = difEl('div', 'settings-row'); r.style.gap = '8px'; const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get(); lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); r.appendChild(lb); inp.addEventListener('change', () => { set(inp.checked); redo(); }); P.appendChild(r); };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const err = difEl('div', 'act-hint'); err.style.cssText = 'color:#d9486b;margin:2px 2px 0;';
  // Texteingabe mit Prüfung
  const textRow = (label, get, set, valid, ph, onDel) => {
    const r = difEl('div', 'settings-row'); r.style.gap = '6px';
    const lb = difEl('label', null, label); lb.setAttribute('translate', 'no'); lb.style.minWidth = '30px';
    const inp = difEl('input'); inp.type = 'text'; inp.value = get(); inp.placeholder = ph || ''; inp.autocomplete = 'off'; inp.spellcheck = false; inp.style.cssText = 'flex:1;min-width:0;font-family:var(--font-mono, monospace);'; inp.setAttribute('translate', 'no');
    const apply = () => { const s = inp.value.trim(); if (!s && onDel) { onDel(); return; } if (!valid(s)) { err.textContent = '«' + s + '» verstehe ich nicht. Beispiele: 2x+3y<=12, y>=x-1, x<=600.'; inp.style.borderColor = '#d9486b'; return; } err.textContent = ''; inp.style.borderColor = ''; if (s !== get()) { set(s); redo(); } };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    r.append(lb, inp);
    if (onDel) r.appendChild(difBtn('✕', onDel, 'Entfernen'));
    P.appendChild(r); return inp;
  };
  if (v === 'ung1') {
    group('Ungleichung (mit x)');
    textRow('', () => LOP.i1, s => { LOP.i1 = s; }, s => { const I = Lp.parseIneq(s); return !!I && Math.abs(I.b) < 1e-12; }, '-2x+5>=1');
  } else if (v === 'half') {
    group('Ungleichung (mit x und y)');
    textRow('', () => LOP.ih, s => { LOP.ih = s; }, s => !!Lp.parseIneq(s), '15x+6y<=60');
    const tp = difBtn('Testpunkt auf (0 | 0)', () => { LOP.T = [0, 0]; redo(); }); tp.style.width = '100%'; P.appendChild(tp);
  } else {
    const E = LOP_EX[LOP.ex];
    if (E && JSON.stringify(E.list) === JSON.stringify(LOP.list) && E.vars) { const h = difEl('div', 'act-hint', E.vars.replace(/\$/g, '')); h.style.margin = '2px 2px 4px'; P.appendChild(h); }
    group('Bedingungen');
    LOP.list.forEach((s, i) => textRow('(' + Lp.roman(i) + ')', () => LOP.list[i], x => { LOP.list[i] = x; }, x => !!Lp.parseIneq(x), '2x+3y<=12', () => { LOP.list.splice(i, 1); redo(); }));
    if (LOP.list.length < 8) { const add = difBtn('+ Ungleichung', () => { LOP.list.push('x+y<=10'); redo(); }); add.style.width = '100%'; P.appendChild(add); }
    check('x ≥ 0, y ≥ 0 (Nichtnegativität)', () => LOP.nn, x => { LOP.nn = x; });
    check('nur ganze Zahlen (Stückzahlen)', () => LOP.int, x => { LOP.int = x; });
    if (v === 'opt') {
      group('Zielfunktion');
      textRow('Z =', () => LOP.obj, s => { LOP.obj = s; LOP.z = null; }, s => !!Lp.parseObj(s), '1000x+2000y');
      const r = difEl('div'); r.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:4px;';
      ['max', 'min'].forEach(mm => { const b = difBtn(mm === 'max' ? 'Maximum' : 'Minimum', () => { LOP.mode = mm; LOP.z = null; redo(); }); if (LOP.mode === mm) b.classList.add('active'); r.appendChild(b); });
      P.appendChild(r);
      const zb = difBtn('Niveaulinie zum Optimum', () => { LOP.z = null; redo(); }); zb.style.cssText = 'width:100%;margin-top:5px;'; P.appendChild(zb);
    }
    group('Anzeige');
    if (LOP.int) check('ganzzahlige Punkte zeigen', () => sh.intpts, x => { sh.intpts = x; });
    if (v === 'opt') check('Optimale Niveaulinie mitzeichnen', () => sh.level, x => { sh.level = x; });
  }
  P.appendChild(err);
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { lopZoom(0.7); redo(); }, 'Hineinzoomen'), difBtn('－', () => { lopZoom(1 / 0.7); redo(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', lopResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; });
}

// ── Maus und Berührung ──
function lopDragTo(id, x, y, shift) {
  const m = LOP.S && LOP.S.maps.main; if (!m) return;
  const stx = Stat.niceStep(m.win.x1 - m.win.x0, 20), sty = Stat.niceStep(m.win.y1 - m.win.y0, 20);
  const sx = lopR6(difSnap(x, LOP.int && stx <= 1 ? 1 : stx, shift)), sy = lopR6(difSnap(y, LOP.int && sty <= 1 ? 1 : sty, shift));
  if (id === 'T') LOP.T = [sx, sy];
  else if (id === 'P') LOP.P = [sx, sy];
  else if (id === 'N') { const O = lopO(); LOP.z = lopR6(O.p * x + O.q * y + (O.c || 0)); const st = Stat.niceStep(Math.abs(LOP.z) || 1, 40); if (!shift) LOP.z = lopR6(Math.round(LOP.z / st) * st); }
  LOP.cardKey = '';
}
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = LOP.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + 4 && d < bd) { bd = d; best = q; } }); return best; };
  const down = e => {
    if (!lopActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = LOP.S; if (!S) return; const p = pos(e), q = near(p), m = S.maps.main;
    if (q) { LOP.drag = { type: q.id }; if (LOP.win.x0 === null) { LOP.win = lopResolvedWin(); LOP.drag.auto = true; } }
    else if (inMap(m, p)) LOP.drag = { type: 'pan', px: p.x, py: p.y, w: lopResolvedWin() };
    if (LOP.drag) cv.style.cursor = LOP.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!lopActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = LOP.S; if (!S) return; const p = pos(e), d = LOP.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) ? 'crosshair' : ''); return; }
    const m = S.maps.main;
    if (d.type === 'pan') { const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0); LOP.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy }; }
    else lopDragTo(d.type, m.IX(p.x), m.IY(p.y), e.shiftKey);
    difRedraw(); if (d.type !== 'pan') lopCardSoon();
  };
  const up = e => {
    if (!lopActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !LOP.drag) return;
    if (LOP.drag) { if (LOP.drag.auto) LOP.win = Object.assign({}, LOP_WIN0); LOP.drag = null; cv.style.cursor = ''; lopRefreshUI(); difRedraw(); lopCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!lopActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = LOP.S; if (!S) return; const p = pos(e), m = S.maps.main; if (!inMap(m, p)) return;
    lopZoom(stWheelF(e), m.IX(p.x), m.IY(p.y)); difRedraw();
    clearTimeout(LOP._wt); LOP._wt = setTimeout(() => { lopRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!lopActive()) return; e.stopImmediatePropagation(); e.preventDefault(); lopResetWin(); };
  const stop = e => { if (lopActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { LOP.cardKey = ''; if (lopActive()) { lopCardRender(); lopRefreshUI(); difRedraw(); } }, ms)); });
lopBuildUI();
if (typeof module !== 'undefined' && module.exports) module.exports = {};
