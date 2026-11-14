// ═══════════════════════════════════════════════════════════════════
// 92_pow_ui.js — Potenz- und Wurzelfunktionen: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 90_pow.js, 90b_pow_docs.js (Pow). Bilder: 91_pow_draw.js (Szenen). Aufbau wie 87_quad_ui.js
// (Hilfsfunktionen aus 62_dif_ui.js, Karte #dif-card). Zustand POW: Ansicht, Exponent n (und m), Stelle xp,
// allgemeine Funktion f(x) = a(x−v)^p + h (etype/k/rm), Gleichung y0, Animation tt, Ausschnitt, Optionen.
// Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «pow»).
// ═══════════════════════════════════════════════════════════════════

const POW_VIEWS = [['fam', 'Potenzfunktionen x^n'], ['neg', 'Negative Exponenten x^(−n)'], ['root', 'Wurzelfunktionen und Umkehrung'], ['gen', 'Allgemeine Form a·(x−v)^n + h'], ['eq', 'Potenz- und Wurzelgleichungen']];
const POW_DESC = {
  fam: ['Wähle n und ziehe den {{Punkt P|P}} auf dem {{Graphen von xⁿ|f}}: Der Spiegelpunkt P′ zeigt die Symmetrie – bei geradem n zur y-Achse, bei ungeradem n zum Ursprung. Alle gehen durch (0 | 0) und (1 | 1).', 'Potenzfunktionen f(x) = xⁿ mit natürlichem n. Für gerades n ist der Graph achsensymmetrisch zur y-Achse, für ungerades n punktsymmetrisch zum Ursprung. Alle gehen durch (0|0) und (1|1).'],
  neg: ['Ziehe den {{Punkt P|P}} nahe an die y-Achse und weit nach aussen: Der {{Graph von x⁻ⁿ|f}} wächst bei x = 0 über alle Grenzen und schmiegt sich aussen an die x-Achse – die Achsen sind Asymptoten.', 'Negative Exponenten: f(x) = x⁻ⁿ = 1/xⁿ. Bei x = 0 hat f eine Definitionslücke; die Achsen sind Asymptoten. Je grösser |x|, desto näher kommt f der 0.'],
  root: ['Ziehe den {{Punkt P|P}} auf der {{Potenzfunktion|pw}}: Sein Spiegelbild an der {{Winkelhalbierenden y = x|diag}} liegt auf der {{Wurzelfunktion|rt}}. Die Wurzel ist die Umkehrfunktion: ⁿ√x = x^(1/n); «▶ xⁿ an y = x umklappen» zeigt die Spiegelung als Bewegung.', 'Die Wurzelfunktion ⁿ√x ist die Umkehrfunktion von xⁿ: Ihr Graph ist das Spiegelbild an der Winkelhalbierenden y = x. In Potenzschreibweise ist ⁿ√x = x^(1/n), allgemein x^(m/n) = ⁿ√(xᵐ).'],
  gen: ['Ziehe den {{Punkt S|S}} (Verschiebung v und h) und den {{roten Punkt a|A}} (Streckung) oder starte die Animation: Die {{Grundfunktion|base}} wird Schritt für Schritt in {{f(x) = a·(x − v)ⁿ + h|f}} verwandelt.', 'Die allgemeine Form f(x) = a·(x−v)ⁿ + h entsteht aus der Grundfunktion xⁿ (oder ⁿ√x, 1/xⁿ) durch Strecken mit a (bei a < 0 gespiegelt), Verschieben um v nach rechts und um h nach oben (Punkt S(v | h)).'],
  eq: ['Ziehe die {{Gerade y = y₀|Y,yl}} auf und ab: Ihre Schnittpunkte mit dem {{Graphen|f}} sind die Lösungen von f(x) = y₀ – je nach Lage zwei, eine oder keine. Der Rechenweg rechts passt sich an.', 'Gleichung f(x) = y₀ lösen: Die Potenz wird isoliert, dann entscheidet die Fallunterscheidung (gerade/ungerade, Wurzel, negative rechte Seite), wie viele Lösungen es gibt. Die Lösungen sind die Schnittstellen mit der Geraden y = y₀.']
};
// Beispiele
const POW_FAM_EX = [[2, 'x²'], [3, 'x³'], [4, 'x⁴'], [5, 'x⁵'], [1, 'x'], [6, 'x⁶']];
const POW_NEG_EX = [[1, '1/x'], [2, '1/x²'], [3, '1/x³'], [4, '1/x⁴']];
const POW_ROOT_EX = [[2, 1, '√x'], [3, 1, '³√x'], [4, 1, '⁴√x'], [2, 3, 'x^(3/2) = √(x³)'], [3, 2, 'x^(2/3) = ³√(x²)'], [5, 1, '⁵√x']];
// [a, v, h, etype, k, rm, Anzeige]
const POW_GEN_EX = [[2, 1, -1, 'pos', 2, 1, '2(x − 1)² − 1'], [-1, 0, 4, 'pos', 3, 1, '−x³ + 4'], [0.5, -2, 0, 'pos', 4, 1, '½(x + 2)⁴'], [1, -1, 2, 'neg', 1, 1, '1/(x + 1) + 2'], [-2, 1, 0, 'neg', 2, 1, '−2/(x − 1)²'], [1, 2, -1, 'root', 2, 1, '√(x − 2) − 1'], [-1, 0, 3, 'root', 3, 1, '−³√x + 3'], [2, 0, 0, 'rat', 3, 2, '2·³√(x²)']];
// [a, v, h, etype, k, rm, y0, Anzeige]
const POW_EQ_EX = [[1, 0, 0, 'pos', 2, 1, 9, 'x² = 9'], [1, 0, 0, 'pos', 3, 1, -8, 'x³ = −8'], [2, 1, -1, 'pos', 2, 1, 7, '2(x − 1)² − 1 = 7'], [1, 0, 0, 'pos', 4, 1, -1, 'x⁴ = −1'], [1, 0, 0, 'neg', 2, 1, 0.25, '1/x² = 1/4'], [1, 0, 0, 'neg', 1, 1, 0, '1/x = 0'], [1, 2, 1, 'root', 2, 1, 4, '√(x − 2) + 1 = 4'], [1, 0, 0, 'root', 3, 1, -2, '³√x = −2'], [1, 0, 0, 'rat', 3, 2, 4, 'x^(2/3) = 4'], [1, 0, 0, 'pos', 2, 1, 5, 'x² = 5']];
const POW_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const POW_SHOW0 = { fam: true, mirror: true, diag: true, pow: true, rat: true, card: true };
const POW_ETYPES = [['pos', 'xⁿ (n natürlich)'], ['neg', '1/xⁿ (negativer Exponent)'], ['root', 'ⁿ√x (Wurzel)'], ['rat', 'x^(m/n) (rationaler Exponent)']];

function powDefaults() {
  return { view: 'fam', n: 3, m: 1, xp: 1.5, a: 2, v: 1, h: -1, etype: 'pos', k: 2, rm: 1, y0: 7, tt: 1, win: Object.assign({}, POW_WIN0), show: Object.assign({}, POW_SHOW0) };
}
const POW = Object.assign(powDefaults(), { ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0 });
function powActive() { return typeof ENV !== 'undefined' && ENV.cur === 'pow'; }

const powR6 = x => Math.round(x * 1e6) / 1e6 + 0;
// Exponent der allgemeinen Form aus etype/k/rm
function powExp() {
  const k = Math.max(1, Math.round(POW.k)), rm = Math.max(1, Math.round(POW.rm));
  return POW.etype === 'pos' ? [k, 1] : POW.etype === 'neg' ? [-k, 1] : POW.etype === 'root' ? [1, Math.max(2, k)] : [rm, Math.max(2, k)];
}
function powF() { const e = powExp(); return Pow.mk(POW.a, POW.v, POW.h, e[0], e[1]); }
function powSetF(F) {
  if (!F) return;
  POW.a = powR6(F.a); POW.v = powR6(F.v); POW.h = powR6(F.h);
  if (F.n === 1) { POW.etype = F.m > 0 ? 'pos' : 'neg'; POW.k = Math.abs(F.m); POW.rm = 1; }
  else if (F.m === 1) { POW.etype = 'root'; POW.k = F.n; POW.rm = 1; }
  else { POW.etype = 'rat'; POW.k = F.n; POW.rm = F.m; }
}
// n der Grundfunktion je Ansicht (Grenzen)
function powClampN() {
  if (POW.view === 'fam') POW.n = Math.max(1, Math.min(8, Math.round(POW.n)));
  else if (POW.view === 'neg') POW.n = Math.max(1, Math.min(4, Math.round(POW.n)));
  else if (POW.view === 'root') { POW.n = Math.max(2, Math.min(6, Math.round(POW.n))); POW.m = Math.max(1, Math.min(5, Math.round(POW.m))); }
}

// ── Eingabefeld f(x) = a·(x−v)^p + h ──
function powParseRaw(raw) {
  let ast = null; try { ast = miParseRaw(String(raw || '').trim()); } catch (e) { return null; }
  const F = Pow.fromAst(ast); if (!F || F.deg) return null;
  if (Math.abs(F.m) > 12 || F.n > 12) return null;
  return F;
}
const powFieldRaw = id => { const inp = $dif(id); return inp ? (inp.getAttribute('data-raw') || '') : ''; };
function powSyncFields() {
  const f = $dif('pow-fn-input'); if (!f || !f._mlSetFromRaw) return;
  if (POW.view !== 'gen' && POW.view !== 'eq') return;
  const raw = Pow.raw(powF()); if (f.getAttribute('data-raw') !== raw && document.activeElement !== f) f._mlSetFromRaw(raw);
}
function powApplyField() {
  const raw = powFieldRaw('pow-fn-input').trim(), err = $dif('pow-err');
  if (!raw) { if (err) err.textContent = ''; return; }
  const F = powParseRaw(raw);
  if (!F) { if (err) err.textContent = 'Erlaubt sind a·(x−v)^n + h, a/(x−v)^n + h, a·√(x−v) + h und (x−v)^(m/n) + h.'; return; }
  const cur = powF();
  if (F.a === cur.a && F.v === cur.v && F.h === cur.h && F.m === cur.m && F.n === cur.n) return;
  powSetF(F); POW.win = Object.assign({}, POW_WIN0); POW.tt = 1;
  if (err) err.textContent = '';
  POW.cardKey = ''; powRefreshUI(); difRedraw(); powCardSoon(); difCommit();
}
function powSetupFields() {
  const inp = $dif('pow-fn-input'); if (!inp || inp._powSetup) return; inp._powSetup = true;
  try {
    inp.mathVirtualKeyboardPolicy = 'manual';
    if (inp.shadowRoot) { const st = document.createElement('style'); st.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}'; inp.shadowRoot.appendChild(st); }
    inp._mlSetFromRaw = raw => { let latex = ''; try { latex = (raw && raw.trim()) ? rawToLatex(raw) : ''; } catch (ex) { latex = ''; } inp.setAttribute('data-raw', raw || ''); inp.value = latex; if (typeof _mlMoveCursorToEnd === 'function') _mlMoveCursorToEnd(inp); };
    if (typeof mlPrewarmFocus === 'function') mlPrewarmFocus(inp);
    inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(inp, -1); try { inp.select(); } catch (e) {} });
    inp.addEventListener('focusout', () => { inp.style.borderColor = ''; setTimeout(powApplyField, 0); });
    inp.addEventListener('input', () => { let raw; try { raw = asciiMathToRaw(inp.getValue('ascii-math')); } catch (ex) { return; } inp.setAttribute('data-raw', raw); inp.style.borderColor = ''; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  } catch (e) { /* MathLive nicht verfügbar */ }
  powSyncFields();
}

// ── Rechenweg-Karte (teilt sich das Element #dif-card) ──
function powCardDoc() {
  try {
    const v = POW.view;
    if (v === 'fam') return { t: 'Rechenweg: Potenzfunktion', d: Pow.famDoc(POW.n, POW.xp) };
    if (v === 'neg') return { t: 'Rechenweg: Negativer Exponent', d: Pow.negDoc(POW.n, POW.xp) };
    if (v === 'root') return { t: 'Rechenweg: Wurzelfunktion', d: Pow.rootDoc(POW.n, POW.m, POW.xp) };
    if (v === 'gen') return { t: 'Rechenweg: Allgemeine Form', d: Pow.genDoc(powF()) };
    return { t: 'Rechenweg: Gleichung', d: Pow.eqDoc(powF(), POW.y0) };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
function powCardKey() {
  const v = POW.view, F = [POW.a, POW.v, POW.h, POW.etype, POW.k, POW.rm];
  const k = { fam: [POW.n, POW.xp], neg: [POW.n, POW.xp], root: [POW.n, POW.m, POW.xp], gen: F, eq: [F, POW.y0] }[v];
  return v + '|' + JSON.stringify(k);
}
function powCardSoon() { clearTimeout(POW.cardT); POW.cardT = setTimeout(powCardRender, 40); }
function powCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = powActive() && POW.show.card;
  if (powActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = powCardKey(); if (key === POW.cardKey) return;
  POW.cardKey = key;
  const r = powCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}

// ── Zustand sichern / laden ──
function powCapture() { return difCopy({ view: POW.view, n: POW.n, m: POW.m, xp: POW.xp, a: POW.a, v: POW.v, h: POW.h, etype: POW.etype, k: POW.k, rm: POW.rm, y0: POW.y0, tt: POW.tt, win: POW.win, show: POW.show }); }
function powApply(s) {
  const d = powDefaults(), num = (v, def) => { v = Number(v); return isFinite(v) ? v : def; };
  if (s && typeof s === 'object') {
    if (POW_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    ['n', 'm', 'xp', 'a', 'v', 'h', 'k', 'rm', 'y0'].forEach(key => { d[key] = num(s[key], d[key]); });
    if (d.a === 0) d.a = 1;
    d.tt = Math.max(0, Math.min(1, num(s.tt, 1)));
    if (POW_ETYPES.some(e => e[0] === s.etype)) d.etype = s.etype;
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1), c = ok(w.y0), e = ok(w.y1);
      if (a !== null && b !== null && c !== null && e !== null && b > a && e > c) d.win = { x0: a, x1: b, y0: c, y1: e };
    }
    if (s.show && typeof s.show === 'object') Object.keys(POW_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  POW.anim = null; POW.drag = null;
  Object.keys(d).forEach(k => { POW[k] = d[k]; });
  powClampN();
  POW.cardKey = '';
  powSyncFields(); powRefreshUI(); difRedraw(); powCardSoon();
}

// ── Zeichnen ──
function powCtx(W, H, exp) {
  return { view: POW.view, F: powF(), n: POW.n, m: POW.m, xp: POW.xp, y0: POW.y0, tt: POW.tt, win: POW.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, smooth: !exp, show: POW.show, flip: POW.anim && POW.anim.flip && !exp ? POW.anim.k : null };
}
const powDock = w => (POW.show.card && w >= 760 ? stCardW(w, 0.36) : 0);
const powDockH = (w, h) => (POW.show.card && w < 760 ? Math.round(h * 0.5) : 0);
function powLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = powDock(w), dh = powDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function powDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  powLayoutCard(w, h); powCardRender();
  const W = w - powDock(w), Hs = h - powDockH(w, h);
  const S = stSoloBuild(powBuildScene, W, Hs, powCtx(W, Hs), 'pow|' + POW.view + '|' + JSON.stringify(POW.show), W < w || Hs < h);   // Karte offen: nur Bild (41_stat_draw.js)
  POW.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function powLatex() {
  const W = 760, H = 520;
  const S = powBuildScene(W, H, powCtx(W, H, { fs: 11 }));
  return stSceneTex(S, W, H, (POW_VIEWS.find(q => q[0] === POW.view) || [0, ''])[1], 11);
}
function powCardLatex() {
  const r = powCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.';
  return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d);
}
function powMakeLatex(which) { const ui = POW.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? powCardLatex() : powLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function powCopyLatex() { texCopy(POW.ui, () => powMakeLatex('pic')); }

// ── Ausschnitt ──
function powResolvedWin() {
  const m = POW.S && POW.S.maps.main; if (m) return Object.assign({}, m.win);
  const w = POW.win; return w.x0 !== null && isFinite(w.x0) ? Object.assign({}, w) : { x0: -3, x1: 3, y0: -3, y1: 3 };
}
function powZoom(f, cx, cy) {
  const w = powResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f, ny0 = cy - (cy - w.y0) * f, ny1 = cy + (w.y1 - cy) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return;
  POW.win = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 };
}
function powResetWin() { POW.win = Object.assign({}, POW_WIN0); powRefreshUI(); difRedraw(); powCardSoon(); difCommit(); }
function powStep(div) { const w = powResolvedWin(); return Stat.niceStep(w.x1 - w.x0, div); }

// ── Panel ──
function powBuildUI() {
  if (POW.ui || !$dif('pow-panel')) return;
  const ui = POW.ui = {}, body = $dif('pow-body');
  ui.sel = $dif('pow-view');
  POW_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { POW.view = ui.sel.value; POW.anim = null; POW.cardKey = ''; POW.win = Object.assign({}, POW_WIN0); powClampN(); powRefreshUI(); difRedraw(); powCardSoon(); difCommit(); });
  ui.desc = $dif('pow-desc');
  ui.ex = $dif('pow-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec');
  det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => powMakeLatex('pic')); ui.br.addEventListener('click', () => powMakeLatex('calc')); ui.bc.addEventListener('click', powCopyLatex);
  const ap = $dif('pow-apply'); if (ap) ap.addEventListener('click', powApplyField);
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!powActive()) return; POW.show.card = false; powRefreshUI(); difRedraw(); powCardRender(); difCommit(); });
  powRefreshUI();
}

function powRefreshUI() {
  const ui = POW.ui; if (!ui) return;
  const v = POW.view, sh = POW.show;
  ui.sel.value = v;
  const d = POW_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[1])); if (typeof envHint === 'function') envHint('pow', d[0], () => POW.S);   // Hinweis als Überschrift über dem Bild
  const showF = v === 'gen' || v === 'eq';
  ['pow-f-row', 'pow-field-head'].forEach(id => { const e = $dif(id); if (e) e.style.display = showF ? '' : 'none'; });
  powSyncFields();
  // Beispiele
  ui.ex.replaceChildren(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
  const exs = v === 'fam' ? POW_FAM_EX.map(p => p[1]) : v === 'neg' ? POW_NEG_EX.map(p => p[1]) : v === 'root' ? POW_ROOT_EX.map(p => p[2]) : v === 'gen' ? POW_GEN_EX.map(p => p[6]) : POW_EQ_EX.map(p => p[7]);
  exs.forEach((nm, i) => { const o = difEl('option', null, nm); o.value = String(i); o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const k = +i;
    if (v === 'fam') POW.n = POW_FAM_EX[k][0];
    else if (v === 'neg') POW.n = POW_NEG_EX[k][0];
    else if (v === 'root') { POW.n = POW_ROOT_EX[k][0]; POW.m = POW_ROOT_EX[k][1]; sh.rat = true; }
    else if (v === 'gen') { const e = POW_GEN_EX[k]; POW.a = e[0]; POW.v = e[1]; POW.h = e[2]; POW.etype = e[3]; POW.k = e[4]; POW.rm = e[5]; }
    else { const e = POW_EQ_EX[k]; POW.a = e[0]; POW.v = e[1]; POW.h = e[2]; POW.etype = e[3]; POW.k = e[4]; POW.rm = e[5]; POW.y0 = e[6]; }
    POW.win = Object.assign({}, POW_WIN0); POW.tt = 1; const er = $dif('pow-err'); if (er) er.textContent = '';
    powSyncFields(); POW.cardKey = ''; powRefreshUI(); difRedraw(); powCardSoon(); difCommit();
  };
  ui.params.replaceChildren();
  const P = ui.params;
  const redo = () => { powRefreshUI(); difRedraw(); powCardSoon(); difCommit(); };
  const touch = () => { POW.cardKey = ''; powSyncFields(); difRedraw(); powCardSoon(); };
  const check = (label, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get();
    lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); row.appendChild(lb);
    inp.addEventListener('change', () => { set(inp.checked); POW.cardKey = ''; redo(); });
    P.appendChild(row);
  };
  const select = (label, opts, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label', null, label), sel = difEl('select');
    opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
    sel.value = get(); sel.addEventListener('change', () => { set(sel.value); POW.cardKey = ''; redo(); });
    row.append(lb, sel); P.appendChild(row);
  };
  const numRow = (label, get, set, o) => {
    o = o || {}; const row = difEl('div', 'settings-row'); row.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no');
    lb.setAttribute('translate', 'no');
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x)) { set(powR6(x)); touch(); difCommit(); } inp.value = difFmtIn(get()); };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const nudge = s => difBtn(s > 0 ? '▶' : '◀', () => { const st = o.step || powStep(25); set(powR6(Math.round((get() + s * st) / st * 1e6) / 1e6 * st)); inp.value = difFmtIn(get()); touch(); difCommit(); }, s > 0 ? 'Nach rechts' : 'Nach links');
    row.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(row); return inp;
  };
  const slider = (label, get, set, min, max, step) => {
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const val = difEl('b', null, difFmtIn(get())); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    const lb = difEl('label', null, label); lb.setAttribute('translate', 'no');
    top.append(lb, val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = Math.max(min, Math.min(max, get())); sl.style.width = '100%';
    sl.addEventListener('input', () => { POW.anim = null; set(powR6(parseFloat(sl.value))); val.textContent = difFmtIn(get()); POW.cardKey = ''; difRedraw(); powCardSoon(); powSyncFields(); });
    // Während des Ziehens bleibt der Ausschnitt stehen; danach passt er sich einmal ruhig an
    const hold = () => { if (POW.win.x0 === null) { POW.win = powResolvedWin(); POW._slAuto = true; } };
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => sl.addEventListener(ev, hold, { passive: true }));
    sl.addEventListener('change', () => { if (POW._slAuto) { POW.win = Object.assign({}, POW_WIN0); POW._slAuto = false; } powRefreshUI(); difCommit(); difRedraw(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1); return sl;
  };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const setA = x => { if (x !== 0) POW.a = x; };
  // Parameter der allgemeinen Form
  const genParams = () => {
    select('Grundfunktion', POW_ETYPES, () => POW.etype, x => { POW.etype = x; if (x === 'root' || x === 'rat') POW.k = Math.max(2, POW.k); POW.win = Object.assign({}, POW_WIN0); });
    const kmax = POW.etype === 'neg' ? 4 : POW.etype === 'pos' ? 8 : 6;
    if (POW.etype === 'rat') group('Exponent m/n: m Zähler, n Nenner (Wurzel)');
    slider('n', () => POW.k, x => { POW.k = Math.max(POW.etype === 'root' || POW.etype === 'rat' ? 2 : 1, Math.round(x)); }, POW.etype === 'root' || POW.etype === 'rat' ? 2 : 1, kmax, 1);
    if (POW.etype === 'rat') slider('m', () => POW.rm, x => { POW.rm = Math.max(1, Math.round(x)); }, 1, 7, 1);
    group('a: Streckfaktor, v: Verschiebung in x, h: Verschiebung in y');
    slider('a', () => POW.a, x => setA(x || 0.1), -4, 4, 0.1);
    slider('v', () => POW.v, x => { POW.v = x; }, -6, 6, 0.5);
    slider('h', () => POW.h, x => { POW.h = x; }, -6, 6, 0.5);
  };

  if (v === 'fam') {
    group('Exponent');
    slider('n', () => POW.n, x => { POW.n = Math.max(1, Math.min(8, Math.round(x))); }, 1, 8, 1);
    group('Punkt P');
    numRow('Stelle x', () => POW.xp, x => { POW.xp = x; }, { step: 0.5 });
    group('Anzeige');
    check('Andere Potenzfunktionen zeigen', () => sh.fam, x => { sh.fam = x; });
    check('Spiegelpunkt P′ zeigen', () => sh.mirror, x => { sh.mirror = x; });
  } else if (v === 'neg') {
    group('Exponent n: f(x) = 1/xⁿ');
    slider('n', () => POW.n, x => { POW.n = Math.max(1, Math.min(4, Math.round(x))); }, 1, 4, 1);
    group('Punkt P');
    numRow('Stelle x', () => POW.xp, x => { POW.xp = x === 0 ? 0.5 : x; }, { step: 0.25 });
    group('Anzeige');
    check('Andere Exponenten zeigen', () => sh.fam, x => { sh.fam = x; });
    check('Spiegelpunkt P′ zeigen', () => sh.mirror, x => { sh.mirror = x; });
  } else if (v === 'root') {
    group('Wurzelexponent n und Zähler m von x^(m/n)');
    slider('n', () => POW.n, x => { POW.n = Math.max(2, Math.min(6, Math.round(x))); POW.win = Object.assign({}, POW_WIN0); }, 2, 6, 1);
    slider('m', () => POW.m, x => { POW.m = Math.max(1, Math.min(5, Math.round(x))); }, 1, 5, 1);
    group('Punkt P');
    numRow('Stelle x', () => POW.xp, x => { POW.xp = POW.n % 2 === 0 ? Math.max(0, x) : x; }, { step: 0.5 });
    group('Anzeige');
    check('Potenzfunktion xⁿ zeigen', () => sh.pow, x => { sh.pow = x; });
    check('Winkelhalbierende y = x zeigen', () => sh.diag, x => { sh.diag = x; });
    check('x^(m/n) zeigen', () => sh.rat, x => { sh.rat = x; });
    { const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(POW.anim ? '⏸ Pause' : '▶ xⁿ an y = x umklappen', powAnimToggle)); P.appendChild(ab); }
  } else if (v === 'gen') {
    genParams();
    group('Verwandlung der Grundfunktion');
    slider('Verwandlung', () => POW.tt, x => { POW.tt = x; }, 0, 1, 0.01);
    const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:5px;';
    ab.append(difBtn(POW.anim ? '⏸ Pause' : '▶ Grundfunktion verwandeln', powAnimToggle), difBtn('Fertig', () => { POW.anim = null; POW.tt = 1; redo(); })); P.appendChild(ab);
  } else {
    genParams();
    group('Rechte Seite y₀ der Gleichung f(x) = y₀');
    numRow('y₀', () => POW.y0, x => { POW.y0 = x; }, { step: 0.5 });
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { powZoom(0.7); redo(); }, 'Hineinzoomen'), difBtn('－', () => { powZoom(1 / 0.7); redo(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', powResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; });
}

// ── Animation: Grundfunktion verwandeln ──
function powAnimToggle() {
  if (POW.anim) { POW.anim = null; powRefreshUI(); difRedraw(); difCommit(); return; }
  if (POW.view === 'root') { POW.show.pow = true; POW.show.diag = true; POW.anim = { last: 0, flip: true, u: 0, k: 1 }; powRefreshUI(); requestAnimationFrame(powAnimFrame); return; }
  if (POW.tt >= 1) POW.tt = 0;
  POW.anim = { last: 0 }; powRefreshUI(); requestAnimationFrame(powAnimFrame);
}
function powAnimFrame(ts) {
  const a = POW.anim; if (!a) return;
  if (!powActive()) { POW.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (a.flip) {
    if (POW.view !== 'root') { POW.anim = null; return; }
    a.u = Math.min(1, a.u + dt / 4); const e = a.u * a.u * (3 - 2 * a.u); a.k = Math.cos(Math.PI * e);
    if (a.u >= 1) { POW.anim = null; powRefreshUI(); difRedraw(); difCommit(); return; }
    difRedraw(); requestAnimationFrame(powAnimFrame); return;
  }
  POW.tt = Math.min(1, POW.tt + dt / 6);
  if (POW.tt >= 1) { POW.anim = null; powRefreshUI(); difRedraw(); difCommit(); return; }
  const all = POW.ui && POW.ui.params.querySelectorAll('input[type=range]'); if (all && all.length) { all[all.length - 1].value = POW.tt; const b = all[all.length - 1].parentNode.querySelector('b'); if (b) b.textContent = difFmtIn(powR6(POW.tt)); }
  difRedraw(); requestAnimationFrame(powAnimFrame);
}

// ── Maus und Berührung auf dem Canvas ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = POW.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + hitR(4) && d < bd) { bd = d; best = q; } }); return best; };
  const setPt = (id, x, y, shift) => {
    const m = POW.S && POW.S.maps.main; if (!m) return;
    const st = Stat.niceStep(m.win.x1 - m.win.x0, 14), sty = Stat.niceStep(m.win.y1 - m.win.y0, 14), sx = powR6(difSnap(x, st, shift)), sy = powR6(difSnap(y, sty, shift)), v = POW.view;
    if (v === 'fam') POW.xp = sx;
    else if (v === 'neg') POW.xp = sx === 0 ? (x >= 0 ? st : -st) : sx;
    else if (v === 'root') { if (POW.show.pow) POW.xp = POW.n % 2 === 0 ? Math.max(0, sx) : sx; else POW.xp = powR6(Pow.pw(POW.n % 2 === 0 ? Math.max(0, sx) : sx, 1, POW.n)); }
    else if (v === 'gen') {
      if (id === 'S') { POW.v = sx; POW.h = sy; }
      else if (id === 'A') { let a = powR6(difSnap(y - POW.h, sty / 2, shift)); if (a === 0) a = y - POW.h >= 0 ? sty / 2 : -sty / 2; POW.a = a; }
    } else if (v === 'eq') { if (id === 'Y') POW.y0 = sy; }
    POW.cardKey = '';
  };
  const down = e => {
    if (!powActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = POW.S; if (!S) return; const p = pos(e); if (POW.anim) { POW.anim = null; powRefreshUI(); difRedraw(); }
    const q = near(p);
    if (q) { POW.drag = { type: q.id }; if (POW.win.x0 === null) { POW.win = powResolvedWin(); POW.drag.auto = true; } }   // Ausschnitt beim Ziehen festhalten
    else if (inMap(S.maps.main, p)) POW.drag = { type: 'pan', px: p.x, py: p.y, w: powResolvedWin() };
    if (POW.drag) cv.style.cursor = POW.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!powActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = POW.S; if (!S) return; const p = pos(e), d = POW.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) ? 'crosshair' : ''); return; }
    const m = S.maps.main;
    if (d.type === 'pan') {
      const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0);
      POW.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy };
    } else { setPt(d.type, m.IX(p.x), m.IY(p.y), e.shiftKey); powSyncFields(); }
    difRedraw(); if (d.type !== 'pan') powCardSoon();
  };
  const up = e => {
    if (!powActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !POW.drag) return;
    if (POW.drag) { if (POW.drag.auto) POW.win = Object.assign({}, POW_WIN0); POW.drag = null; cv.style.cursor = ''; powRefreshUI(); difRedraw(); powCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!powActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = POW.S; if (!S) return; const p = pos(e), m = S.maps.main; if (!inMap(m, p)) return;
    powZoom(stWheelF(e), m.IX(p.x), m.IY(p.y)); difRedraw();
    clearTimeout(POW._wt); POW._wt = setTimeout(() => { powRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!powActive()) return; e.stopImmediatePropagation(); e.preventDefault(); powResetWin(); };
  const stop = e => { if (powActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { POW.cardKey = ''; if (powActive()) { powCardRender(); powRefreshUI(); difRedraw(); } }, ms)); });
powBuildUI();
document.addEventListener('DOMContentLoaded', () => setTimeout(powSetupFields, 150));
if (typeof module !== 'undefined' && module.exports) module.exports = {};
