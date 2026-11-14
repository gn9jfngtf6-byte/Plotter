// ═══════════════════════════════════════════════════════════════════
// 87_quad_ui.js — Quadratische Funktionen: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 85_quad.js, 85b_quad_docs.js (Quad). Bilder: 86_quad_draw.js (Szenen). Aufbau wie 82_lin_ui.js
// (Hilfsfunktionen aus 62_dif_ui.js, Karte #dif-card). Zustand QUAD: Ansicht, Parabel f = a·x² + b·x + c, Formen, Gerade,
// Punkte, Ausschnitt, Optionen. Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «quad»).
// ═══════════════════════════════════════════════════════════════════

const QUAD_VIEWS = [['par', 'Parameter und drei Formen'], ['vtx', 'Scheitelpunkt und quadratische Ergänzung'], ['zer', 'Nullstellen und Diskriminante'], ['cmb', 'Parabel und Gerade, Parabel aus Punkten'], ['opt', 'Optimierung: Preis, Umsatz, Gewinn']];
const QUAD_DESC = {
  opt: ['Ziehe den {{Preis p|p}} auf der Preisachse: Mit dem Preis sinkt die {{Nachfrage x(p)|xp}}. {{Umsatz U = p·x|U}} und {{Gewinn G = U − K|G}} sind Parabeln: Ihr Scheitel liefert den {{umsatzmaximalen|Um}} bzw. den {{gewinnmaximalen Preis|Gm}}, die Nullstellen von G die {{Gewinnschwelle und Gewinngrenze|GS,Gz}}.', 'Hängt die Nachfrage linear vom Preis ab, x(p) = A − B·p, so ist der Umsatz U(p) = p·x(p) eine nach unten geöffnete Parabel. Mit den Kosten K = Kf + kv·x (Fixkosten und variable Kosten pro Stück) ist auch der Gewinn G(p) = U(p) − K(p) eine Parabel; ihr Scheitel ist das Gewinnmaximum.'],
  par: ['Ziehe den {{Scheitel S|S}}, den {{roten Punkt a|A}}, den {{Achsenabschnitt c|c}} oder die {{Nullstellen|N1,N2}}: Die {{Parabel|f}} verändert sich, und rechts stehen Standard-, Scheitel- und Nullstellenform derselben Funktion.', 'Eine quadratische Funktion f(x) = ax² + bx + c hat eine Parabel als Graph. Der Faktor a streckt die Normalparabel (bei a < 0 gespiegelt), der Scheitel S ist der höchste oder tiefste Punkt.'],
  vtx: ['Bewege den Regler «Verschiebung» oder starte die Animation: Die {{Normalparabel|np}} wird Schritt für Schritt gestreckt und {{verschoben|sh}}, bis sie die gesuchte {{Parabel|f}} ist. Rechts entsteht dabei die Scheitelform.', 'Mit der quadratischen Ergänzung wird aus der Standardform die Scheitelform. Das zeigt, wie die Parabel aus der Normalparabel entsteht: strecken, nach rechts oder links und nach oben oder unten schieben.'],
  zer: ['Ziehe die {{Parabel|f}} an {{c|c}} oder am {{Scheitel|S}} nach oben und unten: Die Diskriminante D entscheidet, ob es zwei, eine oder keine {{Nullstelle|N1,N2}} gibt. «▶ Parabel durch die x-Achse schieben» zeigt den Übergang von zwei über eine zu keiner Nullstelle: Nahe der x-Achse wird sie langsamer und hält bei D = 0 an, bis du «▶ weiter» drückst. Wähle das Lösungsverfahren für den Rechenweg.', 'Die Nullstellen sind die Lösungen von ax² + bx + c = 0. Die Diskriminante D = b² − 4ac zeigt, ob es zwei, eine oder keine Lösung gibt.'],
  cmb: ['Ziehe die {{Gerade|L,y1,lm,lx}} und beobachte die Diskriminante: Sie schneidet die {{Parabel|f}} zweimal (Sekante), berührt sie (Tangente) oder verfehlt sie (Passante); «▶ Gerade parallel verschieben» fährt alle drei Fälle ab. Im zweiten Teil legen {{drei Punkte|P1,P2,P3}}, {{Scheitel|S}} und {{Punkt|P}} oder {{zwei Nullstellen|N1,N2}} eine Parabel fest.', 'Gerade und Parabel: Gleichsetzen gibt eine quadratische Gleichung, deren Diskriminante die Anzahl der Schnittpunkte bestimmt (Sekante, Tangente, Passante). Umgekehrt legen drei Punkte, oder Scheitel und Punkt, oder zwei Nullstellen und ein Punkt eine Parabel fest.']
};
// Beispiele: [a, b, c, Anzeige]
const QUAD_EX = [[1, 0, 0, 'x²'], [-1, 0, 4, '−x² + 4'], [1, -2, -3, 'x² − 2x − 3'], [2, -4, -6, '2x² − 4x − 6'], [1, 2, 1, 'x² + 2x + 1'], [1, 0, 1, 'x² + 1'], [-0.5, 0, 3, '−½x² + 3'], [1, -2, -1, 'x² − 2x − 1'], [3, -12, 9, '3x² − 12x + 9'], [-1, 4, -3, '−x² + 4x − 3'], [0.5, -1, -1.5, '½x² − x − 3/2']];
// Parabel und Gerade: [a, b, c, m, q, Anzeige]
const QUAD_LINE_EX = [[1, 0, 0, 2, -1, 'y = x²  und  y = 2x − 1'], [1, -2, -3, 1, -1, 'y = x² − 2x − 3  und  y = x − 1'], [-1, 0, 4, 0, 5, 'y = −x² + 4  und  y = 5'], [0.5, 0, 0, 1, 1, 'y = ½x²  und  y = x + 1']];
const QUAD_PTS_EX = [[[0, 1], [1, 0], [2, 3]], [[-2, 0], [0, -4], [2, 0]], [[-3, 5], [0, -1], [2, 1]], [[-1, 2], [1, 2], [3, 10]]];
const QUAD_VP_EX = [[[1, -4], [3, 0]], [[0, 3], [2, -1]], [[-2, 1], [0, -3]], [[2, 0], [4, 4]]];
const QUAD_NP_EX = [[-1, 3, 0, -3], [-2, 2, 0, 4], [1, 5, 3, 2], [0, 4, 2, 3]];
// Optimierung: [A, B, Kf, kv, Anzeige]  (Nachfrage x = A − B·p, Kosten K = Kf + kv·x)
const QUAD_OPT_EX = [[1200, 20, 6000, 10, 'Konzert: x = 1200 − 20p, K = 6000 + 10x'], [300, 10, 500, 4, 'Velomiete: x = 300 − 10p, K = 500 + 4x'], [800, 100, 300, 1.2, 'Kaffeebar: x = 800 − 100p, K = 300 + 1.2x'], [5000, 500, 2000, 2, 'Zeitschrift: x = 5000 − 500p, K = 2000 + 2x']];
const QUAD_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const QUAD_SHOW0 = { normal: true, axis: true, tan: false, card: true };
const QUAD_METHODS = [['mnf', 'Mitternachtsformel'], ['qe', 'Quadratische Ergänzung'], ['vieta', 'Satz von Vieta']];

function quadDefaults() {
  return { view: 'par', a: 1, b: -2, c: -3, form: 'std', method: 'mnf', mode: 'line', lm: 1, lq: -1, x0: 1, P: [[0, 1], [1, 0], [2, 3]], sv: [1, -4], pp: [3, 0], n1: -1, n2: 3, tt: 1, oA: 1200, oB: 20, oKf: 6000, okv: 10, op: 20,
    win: Object.assign({}, QUAD_WIN0), show: Object.assign({}, QUAD_SHOW0) };
}
const QUAD = Object.assign(quadDefaults(), { ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0 });
function quadActive() { return typeof ENV !== 'undefined' && ENV.cur === 'quad'; }

const quadR6 = x => Math.round(x * 1e6) / 1e6 + 0;
const quadQ = () => Quad.mk(QUAD.a, QUAD.b, QUAD.c);
const quadLn = () => Lin.mk(QUAD.lm, QUAD.lq);
function quadSetQ(Q) { if (!Q) return; QUAD.a = quadR6(Q.a); QUAD.b = quadR6(Q.b); QUAD.c = quadR6(Q.c); }
// Parabel des aktuellen Modus (für Bild und Rechenweg); null, wenn sie nicht festgelegt ist
function quadCurQ() {
  if (QUAD.view !== 'cmb' || QUAD.mode === 'line') return quadQ();
  if (QUAD.mode === 'pts') return Quad.fromPoints(QUAD.P[0], QUAD.P[1], QUAD.P[2]);
  if (QUAD.mode === 'vp') return Quad.fromVertexPoint(QUAD.sv, QUAD.pp);
  return Quad.fromRootsPoint([QUAD.n1, 0], [QUAD.n2, 0], QUAD.pp);
}

// ── Eingabefeld f(x) = ax² + bx + c ──
function quadRaw(Q) {
  const qr = z => { const n = Number(z.n), d = Number(z.d); return d === 1 ? String(n) : n + '/' + d; };
  let s = '';
  [[Q.aq, 'x^2'], [Q.bq, 'x'], [Q.cq, '']].forEach(([q, v]) => {
    if (Dif.E.qIsZero(q)) return;
    const one = v && (Dif.E.qEq(q, Dif.E.q1) || Dif.E.qEq(q, Dif.E.qNeg(Dif.E.q1))), body = one ? v : (v ? qr(q) + '*' + v : qr(q));
    s += (Dif.E.qSgn(q) < 0 ? (one ? '-' + v : body) : (s === '' ? '' : '+') + body);
  });
  return s === '' ? '0' : s;
}
function quadParseRaw(raw) {
  const F = Dif.makeFn(raw); if (!F || !F.P || F.P.length > 3 || !F.P.length) return null;
  const c = k => (k < F.P.length ? Dif.E.qNum(F.P[k]) : 0), a = c(2), b = c(1), cc = c(0);
  if (![a, b, cc].every(isFinite)) return null;
  return { a: quadR6(a), b: quadR6(b), c: quadR6(cc) };
}
const quadFieldRaw = id => { const inp = $dif(id); return inp ? (inp.getAttribute('data-raw') || '') : ''; };
function quadSyncFields() {
  const f = $dif('quad-fn-input'); if (!f || !f._mlSetFromRaw) return;
  const raw = quadRaw(quadQ()); if (f.getAttribute('data-raw') !== raw && document.activeElement !== f) f._mlSetFromRaw(raw);
}
function quadApplyField() {
  const raw = quadFieldRaw('quad-fn-input').trim(), err = $dif('quad-err');
  if (!raw) { if (err) err.textContent = ''; return; }
  const r = quadParseRaw(raw);
  if (!r) { if (err) err.textContent = 'Das ist keine quadratische Funktion. Erlaubt ist ax² + bx + c.'; return; }
  if (r.a === QUAD.a && r.b === QUAD.b && r.c === QUAD.c) return;
  QUAD.a = r.a; QUAD.b = r.b; QUAD.c = r.c; QUAD.win = Object.assign({}, QUAD_WIN0);
  if (err) err.textContent = r.a === 0 ? 'Für a = 0 ist es eine Gerade.' : '';
  QUAD.cardKey = ''; quadRefreshUI(); difRedraw(); quadCardSoon(); difCommit();
}
function quadSetupFields() {
  const inp = $dif('quad-fn-input'); if (!inp || inp._quadSetup) return; inp._quadSetup = true;
  try {
    inp.mathVirtualKeyboardPolicy = 'manual';
    if (inp.shadowRoot) { const st = document.createElement('style'); st.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}'; inp.shadowRoot.appendChild(st); }
    inp._mlSetFromRaw = raw => { let latex = ''; try { latex = (raw && raw.trim()) ? rawToLatex(raw) : ''; } catch (ex) { latex = ''; } inp.setAttribute('data-raw', raw || ''); inp.value = latex; if (typeof _mlMoveCursorToEnd === 'function') _mlMoveCursorToEnd(inp); };
    if (typeof mlPrewarmFocus === 'function') mlPrewarmFocus(inp);
    inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(inp, -1); try { inp.select(); } catch (e) {} });
    inp.addEventListener('focusout', () => { inp.style.borderColor = ''; setTimeout(quadApplyField, 0); });
    inp.addEventListener('input', () => { let raw; try { raw = asciiMathToRaw(inp.getValue('ascii-math')); } catch (ex) { return; } inp.setAttribute('data-raw', raw); inp.style.borderColor = ''; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  } catch (e) { /* MathLive nicht verfügbar */ }
  quadSyncFields();
}

// ── Rechenweg-Karte (teilt sich das Element #dif-card) ──
function quadCardDoc() {
  try {
    const Q = quadQ(), v = QUAD.view;
    if (v === 'opt') return { t: 'Rechenweg: Preis, Umsatz und Gewinn', d: Quad.optDoc(QUAD.oA, QUAD.oB, QUAD.oKf, QUAD.okv) };
    if (v === 'par') return { t: 'Rechenweg: Die drei Formen', d: Quad.formsDoc(Q) };
    if (v === 'vtx') return { t: 'Rechenweg: Quadratische Ergänzung', d: Quad.vtxDoc(Q) };
    if (v === 'zer') return { t: 'Rechenweg: Nullstellen', d: Quad.rootsDoc(Q, QUAD.method) };
    const m = QUAD.mode;
    if (m === 'line') { const d = Quad.lineDoc(Q, quadLn()); if (QUAD.show.tan) d.b = d.b.concat(Quad.tanDoc(Q, QUAD.x0).b); return { t: 'Rechenweg: Parabel und Gerade', d }; }
    if (m === 'pts') return { t: 'Rechenweg: Parabel durch drei Punkte', d: Quad.ptsDoc(QUAD.P[0], QUAD.P[1], QUAD.P[2]) };
    if (m === 'vp') return { t: 'Rechenweg: Scheitelpunkt und Punkt', d: Quad.vpDoc(QUAD.sv, QUAD.pp) };
    return { t: 'Rechenweg: Nullstellen und Punkt', d: Quad.npDoc([QUAD.n1, 0], [QUAD.n2, 0], QUAD.pp) };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
function quadCardKey() {
  const v = QUAD.view, S = QUAD.show, abc = [QUAD.a, QUAD.b, QUAD.c];
  const k = { opt: [QUAD.oA, QUAD.oB, QUAD.oKf, QUAD.okv], par: abc, vtx: abc, zer: [abc, QUAD.method], cmb: [QUAD.mode, QUAD.mode === 'line' ? [abc, QUAD.lm, QUAD.lq, S.tan, S.tan ? QUAD.x0 : ''] : QUAD.mode === 'pts' ? QUAD.P : QUAD.mode === 'vp' ? [QUAD.sv, QUAD.pp] : [QUAD.n1, QUAD.n2, QUAD.pp]] }[v];
  return v + '|' + JSON.stringify(k);
}
function quadCardSoon() { clearTimeout(QUAD.cardT); QUAD.cardT = setTimeout(quadCardRender, 40); }
function quadCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = quadActive() && QUAD.show.card;
  if (quadActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = quadCardKey(); if (key === QUAD.cardKey) return;
  QUAD.cardKey = key;
  const r = quadCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}

// ── Zustand sichern / laden ──
function quadCapture() { return difCopy({ view: QUAD.view, a: QUAD.a, b: QUAD.b, c: QUAD.c, form: QUAD.form, method: QUAD.method, mode: QUAD.mode, lm: QUAD.lm, lq: QUAD.lq, x0: QUAD.x0, P: QUAD.P, sv: QUAD.sv, pp: QUAD.pp, n1: QUAD.n1, n2: QUAD.n2, tt: QUAD.tt, oA: QUAD.oA, oB: QUAD.oB, oKf: QUAD.oKf, okv: QUAD.okv, op: QUAD.op, win: QUAD.win, show: QUAD.show }); }
function quadApply(s) {
  const d = quadDefaults(), num = (v, def) => { v = Number(v); return isFinite(v) ? v : def; }, pt = (a, def) => (Array.isArray(a) && a.length === 2 && isFinite(Number(a[0])) && isFinite(Number(a[1])) ? [Number(a[0]), Number(a[1])] : def);
  if (s && typeof s === 'object') {
    if (QUAD_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    ['a', 'b', 'c', 'lm', 'lq', 'x0', 'n1', 'n2', 'op', 'oKf', 'okv'].forEach(k => { d[k] = num(s[k], d[k]); });
    ['oA', 'oB'].forEach(k => { const x = num(s[k], d[k]); if (x > 0) d[k] = x; });
    d.tt = Math.max(0, Math.min(1, num(s.tt, 1)));
    if (['std', 'vert', 'fact'].includes(s.form)) d.form = s.form;
    if (QUAD_METHODS.some(m => m[0] === s.method)) d.method = s.method;
    if (['line', 'pts', 'vp', 'np'].includes(s.mode)) d.mode = s.mode;
    if (Array.isArray(s.P) && s.P.length === 3) d.P = s.P.map((p, i) => pt(p, d.P[i]));
    d.sv = pt(s.sv, d.sv); d.pp = pt(s.pp, d.pp);
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1), c = ok(w.y0), e = ok(w.y1);
      if (a !== null && b !== null && c !== null && e !== null && b > a && e > c) d.win = { x0: a, x1: b, y0: c, y1: e };
    }
    if (s.show && typeof s.show === 'object') Object.keys(QUAD_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  QUAD.anim = null; QUAD.drag = null;
  Object.keys(d).forEach(k => { QUAD[k] = d[k]; });
  QUAD.cardKey = '';
  quadSyncFields(); quadRefreshUI(); difRedraw(); quadCardSoon();
}

// ── Zeichnen ──
function quadCtx(W, H, exp) {
  return { view: QUAD.view, Q: quadCurQ(), win: QUAD.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, smooth: !exp, show: QUAD.show,
    zerAnim: QUAD.anim && QUAD.anim.sweep && !exp ? (QUAD.anim.pause ? 'stop' : 'run') : null,
    form: QUAD.form, method: QUAD.method, mode: QUAD.mode, L: quadLn(), x0: QUAD.x0, P: QUAD.P, sv: QUAD.sv, pp: QUAD.pp, n1: QUAD.n1, n2: QUAD.n2, tt: QUAD.tt, oA: QUAD.oA, oB: QUAD.oB, oKf: QUAD.oKf, okv: QUAD.okv, op: QUAD.op };
}
const quadDock = w => (QUAD.show.card && w >= 760 ? stCardW(w, 0.36) : 0);
const quadDockH = (w, h) => (QUAD.show.card && w < 760 ? Math.round(h * 0.5) : 0);
function quadLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = quadDock(w), dh = quadDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function quadDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  quadLayoutCard(w, h); quadCardRender();
  const W = w - quadDock(w), Hs = h - quadDockH(w, h);
  const S = stSoloBuild(quadBuildScene, W, Hs, quadCtx(W, Hs), 'quad|' + QUAD.view + '|' + JSON.stringify(QUAD.show), W < w || Hs < h);   // Karte offen: nur Bild (41_stat_draw.js)
  QUAD.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function quadLatex() {
  const W = 760, H = QUAD.view === 'cmb' ? 540 : 520;
  const S = quadBuildScene(W, H, quadCtx(W, H, { fs: 11 }));
  return stSceneTex(S, W, H, (QUAD_VIEWS.find(q => q[0] === QUAD.view) || [0, ''])[1], 11);
}
function quadCardLatex() {
  const r = quadCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.';
  return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d);
}
function quadMakeLatex(which) { const ui = QUAD.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? quadCardLatex() : quadLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function quadCopyLatex() { texCopy(QUAD.ui, () => quadMakeLatex('pic')); }

// ── Ausschnitt ──
function quadResolvedWin() {
  const m = QUAD.S && QUAD.S.maps.main; if (m) return Object.assign({}, m.win);
  const w = QUAD.win; return w.x0 !== null && isFinite(w.x0) ? Object.assign({}, w) : { x0: -6, x1: 6, y0: -4, y1: 4 };
}
function quadZoom(f, cx, cy) {
  const w = quadResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f, ny0 = cy - (cy - w.y0) * f, ny1 = cy + (w.y1 - cy) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return;
  QUAD.win = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 };
}
function quadResetWin() { QUAD.win = Object.assign({}, QUAD_WIN0); quadRefreshUI(); difRedraw(); quadCardSoon(); difCommit(); }
function quadStep(div) { const w = quadResolvedWin(); return Stat.niceStep(w.x1 - w.x0, div); }

// ── Panel ──
function quadBuildUI() {
  if (QUAD.ui || !$dif('quad-panel')) return;
  const ui = QUAD.ui = {}, body = $dif('quad-body');
  ui.sel = $dif('quad-view');
  QUAD_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { QUAD.view = ui.sel.value; QUAD.anim = null; QUAD.cardKey = ''; QUAD.win = Object.assign({}, QUAD_WIN0); quadRefreshUI(); difRedraw(); quadCardSoon(); difCommit(); });
  ui.desc = $dif('quad-desc');
  ui.ex = $dif('quad-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec');
  det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => quadMakeLatex('pic')); ui.br.addEventListener('click', () => quadMakeLatex('calc')); ui.bc.addEventListener('click', quadCopyLatex);
  const ap = $dif('quad-apply'); if (ap) ap.addEventListener('click', quadApplyField);
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!quadActive()) return; QUAD.show.card = false; quadRefreshUI(); difRedraw(); quadCardRender(); difCommit(); });
  quadRefreshUI();
}

function quadRefreshUI() {
  const ui = QUAD.ui; if (!ui) return;
  const v = QUAD.view, sh = QUAD.show, mode = QUAD.mode;
  ui.sel.value = v;
  const d = QUAD_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[1])); if (typeof envHint === 'function') envHint('quad', d[0], () => QUAD.S);   // Hinweis als Überschrift über dem Bild
  const showF = v !== 'opt' && (v !== 'cmb' || mode === 'line');
  ['quad-f-row', 'quad-field-head'].forEach(id => { const e = $dif(id); if (e) e.style.display = showF ? '' : 'none'; });
  quadSyncFields();
  // Beispiele
  ui.ex.replaceChildren(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
  const exs = v === 'opt' ? QUAD_OPT_EX.map(p => p[4]) : v !== 'cmb' ? QUAD_EX.map(p => p[3]) : mode === 'line' ? QUAD_LINE_EX.map(p => p[5])
    : mode === 'pts' ? QUAD_PTS_EX.map(p => p.map((q, i) => 'P' + (i + 1) + '(' + q[0] + '|' + q[1] + ')').join(', '))
      : mode === 'vp' ? QUAD_VP_EX.map(p => 'S(' + p[0][0] + '|' + p[0][1] + '), P(' + p[1][0] + '|' + p[1][1] + ')')
        : QUAD_NP_EX.map(p => 'x₁ = ' + p[0] + ', x₂ = ' + p[1] + ', P(' + p[2] + '|' + p[3] + ')');
  exs.forEach((nm, i) => { const o = difEl('option', null, nm); o.value = String(i); o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const k = +i;
    if (v === 'opt') { const e = QUAD_OPT_EX[k]; QUAD.oA = e[0]; QUAD.oB = e[1]; QUAD.oKf = e[2]; QUAD.okv = e[3]; QUAD.op = quadR6(e[0] / e[1] / 3); }
    else if (v !== 'cmb') { const e = QUAD_EX[k]; QUAD.a = e[0]; QUAD.b = e[1]; QUAD.c = e[2]; }
    else if (mode === 'line') { const e = QUAD_LINE_EX[k]; QUAD.a = e[0]; QUAD.b = e[1]; QUAD.c = e[2]; QUAD.lm = e[3]; QUAD.lq = e[4]; }
    else if (mode === 'pts') QUAD.P = QUAD_PTS_EX[k].map(p => p.slice());
    else if (mode === 'vp') { QUAD.sv = QUAD_VP_EX[k][0].slice(); QUAD.pp = QUAD_VP_EX[k][1].slice(); }
    else { const e = QUAD_NP_EX[k]; QUAD.n1 = e[0]; QUAD.n2 = e[1]; QUAD.pp = [e[2], e[3]]; }
    QUAD.win = Object.assign({}, QUAD_WIN0); QUAD.tt = 1; const er = $dif('quad-err'); if (er) er.textContent = '';
    quadSyncFields(); QUAD.cardKey = ''; quadRefreshUI(); difRedraw(); quadCardSoon(); difCommit();
  };
  ui.params.replaceChildren();
  const P = ui.params;
  const redo = () => { quadRefreshUI(); difRedraw(); quadCardSoon(); difCommit(); };
  const touch = () => { QUAD.cardKey = ''; quadSyncFields(); difRedraw(); quadCardSoon(); };
  const check = (label, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get();
    lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); row.appendChild(lb);
    inp.addEventListener('change', () => { set(inp.checked); QUAD.cardKey = ''; redo(); });
    P.appendChild(row);
  };
  const select = (label, opts, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label', null, label), sel = difEl('select');
    opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
    sel.value = get(); sel.addEventListener('change', () => { set(sel.value); QUAD.cardKey = ''; redo(); });
    row.append(lb, sel); P.appendChild(row);
  };
  const numRow = (label, get, set, o) => {
    o = o || {}; const row = difEl('div', 'settings-row'); row.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no');
    lb.setAttribute('translate', 'no');
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x)) { set(quadR6(x)); touch(); difCommit(); } inp.value = difFmtIn(get()); };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const nudge = s => difBtn(s > 0 ? '▶' : '◀', () => { const st = o.step || quadStep(25); set(quadR6(Math.round((get() + s * st) / st * 1e6) / 1e6 * st)); inp.value = difFmtIn(get()); touch(); difCommit(); }, s > 0 ? 'Nach rechts' : 'Nach links');
    row.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(row); return inp;
  };
  const slider = (label, get, set, min, max, step) => {
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const val = difEl('b', null, difFmtIn(get())); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    const lb = difEl('label', null, label); lb.setAttribute('translate', 'no');
    top.append(lb, val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = Math.max(min, Math.min(max, get())); sl.style.width = '100%';
    sl.addEventListener('input', () => { QUAD.anim = null; set(quadR6(parseFloat(sl.value))); val.textContent = difFmtIn(get()); QUAD.cardKey = ''; difRedraw(); quadCardSoon(); quadSyncFields(); });
    // Während des Ziehens bleibt der Ausschnitt stehen (sonst zoomt das Bild bei jedem Schritt); danach passt er sich einmal ruhig an
    const hold = () => { if (QUAD.win.x0 === null) { QUAD.win = quadResolvedWin(); QUAD._slAuto = true; } };
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => sl.addEventListener(ev, hold, { passive: true }));
    sl.addEventListener('change', () => { if (QUAD._slAuto) { QUAD.win = Object.assign({}, QUAD_WIN0); QUAD._slAuto = false; } quadRefreshUI(); difRedraw(); difCommit(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1); return sl;
  };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const ptRows = (nx, ny, get, set) => { numRow(nx, () => get()[0], x => { const p = get(); set([x, p[1]]); }, { step: 1 }); numRow(ny, () => get()[1], y => { const p = get(); set([p[0], y]); }, { step: 1 }); };
  const setA = x => { if (x !== 0) QUAD.a = x; };
  // Parameter a, b, c (Standardform) bzw. die der gewählten Form
  const abc = () => {
    slider('a', () => QUAD.a, x => setA(x || 0.1), -5, 5, 0.1);
    slider('b', () => QUAD.b, x => { QUAD.b = x; }, -10, 10, 0.5);
    slider('c', () => QUAD.c, x => { QUAD.c = x; }, -10, 10, 0.5);
  };
  const abcRows = () => { numRow('a', () => QUAD.a, setA, { step: 0.5 }); numRow('b', () => QUAD.b, x => { QUAD.b = x; }, { step: 1 }); numRow('c', () => QUAD.c, x => { QUAD.c = x; }, { step: 1 }); };

  if (v === 'opt') {
    group('Nachfrage x(p) = A − B·p');
    numRow('A', () => QUAD.oA, x => { if (x > 0) QUAD.oA = x; }, { step: 10 }); numRow('B', () => QUAD.oB, x => { if (x > 0) QUAD.oB = x; }, { step: 1 });
    group('Kosten K = Kf + kv·x');
    numRow('Kf', () => QUAD.oKf, x => { QUAD.oKf = x; }, { step: 100 }); numRow('kv', () => QUAD.okv, x => { QUAD.okv = x; }, { step: 1 });
    group('Preis');
    numRow('p', () => QUAD.op, x => { QUAD.op = Math.max(0, Math.min(QUAD.oA / QUAD.oB, x)); }, { step: 1 });
  } else if (v === 'par') {
    select('Parameter der', [['std', 'Standardform  ax² + bx + c'], ['vert', 'Scheitelform  a(x − xs)² + ys'], ['fact', 'Nullstellenform  a(x − x₁)(x − x₂)']], () => QUAD.form, x => { QUAD.form = x; });
    const Q = quadQ(), vt = Quad.vertex(Q), R = Quad.roots(Q);
    if (QUAD.form === 'std') { group('Parameter a, b, c'); abc(); }
    else if (QUAD.form === 'vert' && vt) {
      group('Parameter a, xs, ys');
      const st = f => () => { const q = quadQ(), w = Quad.vertex(q); return w ? quadR6(w[f]) : 0; };
      slider('a', () => QUAD.a, x => { const w = Quad.vertex(quadQ()); quadSetQ(Quad.fromVertex(x || 0.1, w.x, w.y)); }, -5, 5, 0.1);
      slider('xs', st('x'), x => { quadSetQ(Quad.fromVertex(QUAD.a, x, Quad.vertex(quadQ()).y)); }, -8, 8, 0.5);
      slider('ys', st('y'), x => { quadSetQ(Quad.fromVertex(QUAD.a, Quad.vertex(quadQ()).x, x)); }, -10, 10, 0.5);
    } else if (QUAD.form === 'fact') {
      group('Parameter a, x₁, x₂');
      if (R.kind === 'two' || R.kind === 'one') {
        slider('a', () => QUAD.a, x => { const r = Quad.roots(quadQ()); quadSetQ(Quad.fromRoots(x || 0.1, r.x1, r.x2)); }, -5, 5, 0.1);
        slider('x₁', () => quadR6(R.x1), x => { const r = Quad.roots(quadQ()); quadSetQ(Quad.fromRoots(QUAD.a, x, r.x2)); }, -8, 8, 0.5);
        slider('x₂', () => quadR6(R.x2), x => { const r = Quad.roots(quadQ()); quadSetQ(Quad.fromRoots(QUAD.a, r.x1, x)); }, -8, 8, 0.5);
      } else {
        P.appendChild(difEl('div', 'act-hint', 'Diese Parabel hat keine Nullstellen, deshalb gibt es keine Nullstellenform.'));
        const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn('Nullstellen −1 und 3 einsetzen', () => { quadSetQ(Quad.fromRoots(QUAD.a, -1, 3)); redo(); })); P.appendChild(ab);
      }
    }
    group('Anzeige');
    check('Normalparabel y = x² zeigen', () => sh.normal, x => { sh.normal = x; });
    check('Symmetrieachse zeigen', () => sh.axis, x => { sh.axis = x; });
  } else if (v === 'vtx') {
    group('Parabel');
    abcRows();
    group('Verschiebung der Normalparabel');
    slider('Verschiebung', () => QUAD.tt, x => { QUAD.tt = x; }, 0, 1, 0.01);
    const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:5px;';
    ab.append(difBtn(QUAD.anim ? '⏸ Pause' : '▶ Normalparabel verschieben', quadAnimToggle), difBtn('Fertig', () => { QUAD.anim = null; QUAD.tt = 1; redo(); })); P.appendChild(ab);
  } else if (v === 'zer') {
    select('Lösungsverfahren', QUAD_METHODS, () => QUAD.method, x => { QUAD.method = x; });
    group('Parameter a, b, c');
    abc();
    { const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(QUAD.anim ? (QUAD.anim.pause ? '▶ weiter' : '⏸ Pause') : '▶ Parabel durch die x-Achse schieben', quadAnimToggle)); P.appendChild(ab); }
  } else {
    select('Thema', [['line', 'Parabel und Gerade'], ['pts', 'Parabel durch drei Punkte'], ['vp', 'Scheitelpunkt und ein Punkt'], ['np', 'Zwei Nullstellen und ein Punkt']], () => QUAD.mode, x => { QUAD.mode = x; QUAD.win = Object.assign({}, QUAD_WIN0); });
    if (mode === 'line') {
      group('Parabel'); abcRows();
      group('Gerade y = m·x + q');
      numRow('m', () => QUAD.lm, x => { QUAD.lm = x; }, { step: 0.5 }); numRow('q', () => QUAD.lq, x => { QUAD.lq = x; }, { step: 0.5 });
      { const an = difEl('div'); an.style.cssText = 'margin-top:6px;'; an.append(difBtn(QUAD.anim ? (QUAD.anim.pause ? '▶ weiter' : '⏸ Pause') : '▶ Gerade parallel verschieben', quadAnimToggle)); P.appendChild(an); }
      const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn('Gerade berühren lassen (gleiche Steigung)', () => { const Q = quadQ(); if (!Q.deg) { QUAD.lq = quadR6(Dif.E.qNum(Quad.tangentIntercept(Q, QUAD.lm))); redo(); } })); P.appendChild(ab);
      group('Anzeige');
      check('Tangente in einem Punkt T zeigen', () => sh.tan, x => { sh.tan = x; });
      if (sh.tan) numRow('Stelle x von T', () => QUAD.x0, x => { QUAD.x0 = x; }, { step: 0.5 });
    } else if (mode === 'pts') {
      [0, 1, 2].forEach(i => { group('Punkt P' + (i + 1)); ptRows('x', 'y', () => QUAD.P[i], p => { QUAD.P[i] = p; }); });
    } else if (mode === 'vp') {
      group('Scheitelpunkt S'); ptRows('x von S', 'y von S', () => QUAD.sv, p => { QUAD.sv = p; });
      group('Punkt P'); ptRows('x von P', 'y von P', () => QUAD.pp, p => { QUAD.pp = p; });
    } else {
      group('Nullstellen'); numRow('x₁', () => QUAD.n1, x => { QUAD.n1 = x; }, { step: 1 }); numRow('x₂', () => QUAD.n2, x => { QUAD.n2 = x; }, { step: 1 });
      group('Punkt P'); ptRows('x von P', 'y von P', () => QUAD.pp, p => { QUAD.pp = p; });
    }
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { quadZoom(0.7); redo(); }, 'Hineinzoomen'), difBtn('－', () => { quadZoom(1 / 0.7); redo(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', quadResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; });
}

// ── Animationen ──
// vtx: Normalparabel verschieben. zer: die Parabel wandert durch die x-Achse (zwei → eine → keine Nullstelle, D wechselt das Vorzeichen).
// cmb/Gerade: die Gerade wandert parallel (Sekante → Tangente → Passante). Beide kehren am Schluss zum Ausgangswert zurück.
function quadAnimEnd() { const a = QUAD.anim; if (a && a.auto) QUAD.win = Object.assign({}, QUAD_WIN0); QUAD.anim = null; }
function quadAnimToggle() {
  if (QUAD.anim && QUAD.anim.pause) { QUAD.anim.pause = false; QUAD.anim.last = 0; quadRefreshUI(); difRedraw(); requestAnimationFrame(quadAnimFrame); return; }   // «▶ weiter» nach dem Halt
  if (QUAD.anim) { quadAnimEnd(); quadRefreshUI(); difRedraw(); difCommit(); return; }
  const Q = typeof quadQ === 'function' ? quadQ() : null, v = QUAD.view;
  if ((v === 'zer' || (v === 'cmb' && QUAD.mode === 'line')) && Q && !Q.deg && Math.abs(QUAD.a) > 1e-9) {
    const s = QUAD.a > 0 ? 1 : -1; let a;
    if (v === 'zer') {
      const k = QUAD.b * QUAD.b / (4 * QUAD.a), y0 = QUAD.c - k, A = Math.max(2, Math.abs(y0));       // y0: Höhe des Scheitels
      a = { path: [-s * A, 0, s * 0.7 * A, y0], hold: [0.5, 0, 0.9, 0], stop: 1, slow: 0, A, cur: y0, sp: A / 2.2, set: y => { QUAD.c = quadR6(Math.round((y + k) * 100) / 100); }, exact: y => { QUAD.c = quadR6(y + k); } };
    } else {
      const qt = Dif.E.qNum(Quad.tangentIntercept(Q, QUAD.lm)), q0 = QUAD.lq, A = Math.max(2, Math.abs(q0 - qt));
      a = { path: [qt + s * A, qt, qt - s * 0.7 * A, q0], hold: [0.5, 0, 0.9, 0], stop: 1, slow: qt, A, cur: q0, sp: A / 2.2, set: q => { QUAD.lq = quadR6(Math.round(q * 100) / 100); }, exact: q => { QUAD.lq = quadR6(q); } };
    }
    a.last = 0; a.i = 0; a.wait = 0; a.sweep = true;
    if (QUAD.win.x0 === null) { QUAD.win = quadResolvedWin(); a.auto = true; }                           // Ausschnitt bleibt stehen
    QUAD.anim = a; quadRefreshUI(); requestAnimationFrame(quadAnimFrame); return;
  }
  if (QUAD.tt >= 1) QUAD.tt = 0;
  QUAD.anim = { last: 0 }; quadRefreshUI(); requestAnimationFrame(quadAnimFrame);
}
function quadAnimFrame(ts) {
  const a = QUAD.anim; if (!a) return;
  if (!quadActive()) { QUAD.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (a.sweep) {
    if (a.wait > 0) { a.wait -= dt; requestAnimationFrame(quadAnimFrame); return; }
    if (a.pause) return;                                                    // wartet am besonderen Fall, bis man «▶ weiter» drückt
    // in der Nähe des besonderen Falls (Scheitel auf der x-Achse bzw. Berührung) immer langsamer
    const near = Math.abs(a.cur - a.slow) / (0.45 * a.A), k = Math.max(0.1, Math.min(1, near));
    const t = a.path[a.i], d = t - a.cur, st = a.sp * k * dt;
    let stopped = false;
    if (Math.abs(d) <= st) { a.cur = t; a.exact(t); a.wait = a.hold[a.i]; stopped = a.i === a.stop; a.i++; } else { a.cur += Math.sign(d) * st; a.set(a.cur); }
    QUAD.cardKey = ''; quadSyncFields(); difRedraw(); quadCardSoon();
    if (a.i >= a.path.length) { quadAnimEnd(); quadRefreshUI(); difRedraw(); difCommit(); return; }
    if (stopped) { a.pause = true; quadRefreshUI(); difRedraw(); return; }
    requestAnimationFrame(quadAnimFrame); return;
  }
  QUAD.tt = Math.min(1, QUAD.tt + dt / 6);
  if (QUAD.tt >= 1) { QUAD.anim = null; quadRefreshUI(); difRedraw(); difCommit(); return; }
  const all = QUAD.ui && QUAD.ui.params.querySelectorAll('input[type=range]'); if (all && all.length) { all[all.length - 1].value = QUAD.tt; const b = all[all.length - 1].parentNode.querySelector('b'); if (b) b.textContent = difFmtIn(quadR6(QUAD.tt)); }
  difRedraw(); requestAnimationFrame(quadAnimFrame);
}

// ── Maus und Berührung auf dem Canvas ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = QUAD.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + hitR(4) && d < bd) { bd = d; best = q; } }); return best; };
  const setPt = (id, x, y, shift) => {
    const m = QUAD.S && QUAD.S.maps.main; if (!m) return;
    const st = Stat.niceStep(m.win.x1 - m.win.x0, 14), sx = quadR6(difSnap(x, st, shift)), sy = quadR6(difSnap(y, st, shift)), view = QUAD.view, mode = QUAD.mode;
    if (view === 'opt') { if (id === 'p') QUAD.op = quadR6(Math.max(0, Math.min(QUAD.oA / QUAD.oB, difSnap(x, Stat.niceStep(m.win.x1 - m.win.x0, 40), shift)))); QUAD.cardKey = ''; return; }
    const Q = quadQ(), vt = Quad.vertex(Q);
    if (view !== 'cmb') {
      if (id === 'S' && vt) quadSetQ(Quad.fromVertex(Q.a, sx, sy));
      else if (id === 'c') QUAD.c = sy;
      else if (id === 'A' && vt) { let a = quadR6(difSnap(y - vt.y, st / 2, shift)); if (a === 0) a = y - vt.y >= 0 ? st / 2 : -st / 2; quadSetQ(Quad.fromVertex(a, vt.x, vt.y)); }
      else if ((id === 'N1' || id === 'N2')) { const r = Quad.roots(Q); if (r.kind === 'two' || r.kind === 'one') { const o = id === 'N1' ? r.x2 : r.x1, ro = r.rat ? o : quadR6(Math.round(o / st) * st); quadSetQ(id === 'N1' ? Quad.fromRoots(Q.a, sx, ro) : Quad.fromRoots(Q.a, ro, sx)); } }
    } else if (mode === 'line') {
      if (id === 'y1') QUAD.lq = sy; else if (id === 'lm') QUAD.lm = quadR6(difSnap(y - QUAD.lq, st / 2, shift)); else if (id === 'T') QUAD.x0 = sx;
    } else if (mode === 'pts') { const i = { P1: 0, P2: 1, P3: 2 }[id]; if (i !== undefined) QUAD.P[i] = [sx, sy]; }
    else if (mode === 'vp') { if (id === 'S') QUAD.sv = [sx, sy]; else if (id === 'P') QUAD.pp = [sx, sy]; }
    else { if (id === 'N1') QUAD.n1 = sx; else if (id === 'N2') QUAD.n2 = sx; else if (id === 'P') QUAD.pp = [sx, sy]; }
    QUAD.cardKey = '';
  };
  const down = e => {
    if (!quadActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = QUAD.S; if (!S) return; const p = pos(e); if (QUAD.anim) { quadAnimEnd(); quadRefreshUI(); }
    const q = near(p);
    if (q) { QUAD.drag = { type: q.id }; if (QUAD.win.x0 === null) { QUAD.win = quadResolvedWin(); QUAD.drag.auto = true; } }   // Ausschnitt beim Ziehen festhalten
    else if (inMap(S.maps.main, p)) QUAD.drag = { type: 'pan', px: p.x, py: p.y, w: quadResolvedWin() };
    if (QUAD.drag) cv.style.cursor = QUAD.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!quadActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = QUAD.S; if (!S) return; const p = pos(e), d = QUAD.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) ? 'crosshair' : ''); return; }
    const m = S.maps.main;
    if (d.type === 'pan') {
      const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0);
      QUAD.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy };
    } else { setPt(d.type, m.IX(p.x), m.IY(p.y), e.shiftKey); quadSyncFields(); }
    difRedraw(); if (d.type !== 'pan') quadCardSoon();
  };
  const up = e => {
    if (!quadActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !QUAD.drag) return;
    if (QUAD.drag) { if (QUAD.drag.auto) QUAD.win = Object.assign({}, QUAD_WIN0); QUAD.drag = null; cv.style.cursor = ''; quadRefreshUI(); difRedraw(); quadCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!quadActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = QUAD.S; if (!S) return; const p = pos(e), m = S.maps.main; if (!inMap(m, p)) return;
    quadZoom(stWheelF(e), m.IX(p.x), m.IY(p.y)); difRedraw();
    clearTimeout(QUAD._wt); QUAD._wt = setTimeout(() => { quadRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!quadActive()) return; e.stopImmediatePropagation(); e.preventDefault(); quadResetWin(); };
  const stop = e => { if (quadActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { QUAD.cardKey = ''; if (quadActive()) { quadCardRender(); quadRefreshUI(); difRedraw(); } }, ms)); });
quadBuildUI();
document.addEventListener('DOMContentLoaded', () => setTimeout(quadSetupFields, 150));
if (typeof module !== 'undefined' && module.exports) module.exports = {};
