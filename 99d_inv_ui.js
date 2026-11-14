// ═══════════════════════════════════════════════════════════════════
// 99d_inv_ui.js — Umkehrfunktionen: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 99_inv.js, 99b_inv_docs.js (Inv). Bilder: 99c_inv_draw.js (Szenen). Aufbau wie 95_exp_ui.js.
// Zustand INV: Ansicht, Funktion fn (Rohausdruck des Eingabefelds), Stelle xp, Höhe k der waagrechten Geraden,
// Einschränkung r (null = natürliche Grenze), Paar pair mit Stelle x0, Ausschnitt, Optionen.
// Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «inv»).
// ═══════════════════════════════════════════════════════════════════

const INV_VIEWS = [['mirror', 'Begriff: Spiegelung an y = x'], ['test', 'Umkehrbarkeit und Einschränkung'], ['calc', 'Umkehrfunktion berechnen'], ['pairs', 'Bekannte Paare']];
const INV_DESC = {
  mirror: ['Ziehe den {{Punkt P|P}} auf dem {{Graphen von f|f}}: Sein Spiegelpunkt {{P′|Q}} an der {{Winkelhalbierenden y = x|diag}} liegt auf dem {{Graphen von f⁻¹|fi}}. Die Umkehrfunktion vertauscht x und y; «▶ Graph an y = x umklappen» zeigt die Spiegelung als Bewegung.', 'Die Umkehrfunktion f⁻¹ liest die Zuordnung rückwärts: Zu jedem Funktionswert y gehört wieder das x. In der Wertetabelle tauschen die Zeilen, im Graphen tauschen die Koordinaten – der Graph von f⁻¹ ist das Spiegelbild von f an der Winkelhalbierenden y = x.'],
  test: ['Ziehe die {{waagrechte Gerade y = k|K,kl}} auf und ab und zähle ihre Schnittpunkte mit dem {{Graphen|f}}: Ist es nie mehr als einer, ist f umkehrbar. Sonst schränkt man den Definitionsbereich ein (rote Grenze r).', 'Umkehrbar ist eine Funktion nur, wenn jeder Wert höchstens einmal vorkommt: Jede waagrechte Gerade darf den Graphen höchstens einmal schneiden. Streng monotone Funktionen erfüllen das. Sonst hilft eine Einschränkung des Definitionsbereichs.'],
  calc: ['Wähle eine Funktion: Rechts wird y = f(x) nach x aufgelöst, dann werden x und y vertauscht. Zur Probe ziehe {{P|P}} auf {{f|f}}: Der Spiegelpunkt {{P′|Q}} liegt auf {{f⁻¹|fi}}.', 'Die Umkehrfunktion berechnet man in drei Schritten: y = f(x) nach x auflösen (Rechenschritte rückgängig machen), dann x und y vertauschen, dann Definitions- und Wertebereich tauschen.'],
  pairs: ['Wähle ein Paar und ziehe den {{Punkt P|P}} auf {{f|f}}: Sein Spiegelpunkt {{P′|Q}} liegt auf {{f⁻¹|fi}} – erst f, dann f⁻¹ führt zum Ausgangswert zurück. Beachte die eingeschränkten Bereiche bei x², sin, cos und tan.', 'Wichtige Paare: x² und √x, x³ und ³√x, 2ˣ und log₂ x, eˣ und ln x, 10ˣ und lg x, 1/x und 1/x, sin und arcsin, cos und arccos, tan und arctan. Die Verkettung f⁻¹(f(x)) = x ist die Definition der Umkehrung.']
};
// Beispiele [Rohausdruck, Anzeige]
const INV_EX = [['2*x+1', '2x + 1'], ['(-1/2)*x+3', '−x/2 + 3'], ['x^3', 'x³'], ['x^2', 'x² (eingeschränkt)'], ['(x-1)^2+2', '(x − 1)² + 2 (eingeschränkt)'], ['sqrt(x-2)+1', '√(x − 2) + 1'], ['1/x', '1/x'], ['2/(x+1)-1', '2/(x + 1) − 1'], ['2^x', '2^x'], ['3*2^x-1', '3·2^x − 1'], ['EC^x', 'e^x'], ['log(x-1)', 'ln(x − 1)'], ['logn(x,2)', 'log₂ x'], ['2*log10(x)+1', '2·lg x + 1'], ['x^(1/3)', '³√x'], ['1/(x-1)^2', '1/(x − 1)² (eingeschränkt)'], ['x^4', 'x⁴ (eingeschränkt)']];
const INV_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const INV_SHOW0 = { diag: true, inv: true, pts: true, card: true };

function invDefaults() {
  return { view: 'mirror', fn: 'x^3', xp: 1.5, k: 2, r: null, pair: 'sq', x0: 2, win: Object.assign({}, INV_WIN0), show: Object.assign({}, INV_SHOW0) };
}
const INV = Object.assign(invDefaults(), { ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0, R: null });
function invActive() { return typeof ENV !== 'undefined' && ENV.cur === 'inv'; }
const invR6 = x => Math.round(x * 1e6) / 1e6 + 0;
function invParseRaw(raw) {
  let ast = null; try { ast = miParseRaw(String(raw || '').trim()); } catch (e) { return null; }
  const R = Inv.fromAst(ast); if (!R || R.deg) return null;
  return R;
}
function invR() { if (!INV.R || INV.R._fn !== INV.fn) { INV.R = invParseRaw(INV.fn) || invParseRaw('x^3'); INV.R._fn = INV.fn; } return INV.R; }
function invPair() { return Inv.PAIRS.find(p => p.id === INV.pair) || Inv.PAIRS[0]; }

// ── Eingabefeld ──
const invFieldRaw = id => { const inp = $dif(id); return inp ? (inp.getAttribute('data-raw') || '') : ''; };
function invSyncFields() {
  const f = $dif('inv-fn-input'); if (!f || !f._mlSetFromRaw) return;
  if (INV.view === 'pairs') return;
  const raw = Inv.raw(invR()); if (f.getAttribute('data-raw') !== raw && document.activeElement !== f) f._mlSetFromRaw(raw);
}
function invApplyField() {
  const raw = invFieldRaw('inv-fn-input').trim(), err = $dif('inv-err');
  if (!raw) { if (err) err.textContent = ''; return; }
  const R = invParseRaw(raw);
  if (!R) { if (err) err.textContent = 'Erlaubt sind lineare Funktionen, a·(x−v)^n + h, Wurzeln, a/(x−v)^n + h, a·b^x + d und a·log_b(x−v) + d (ln, lg).'; return; }
  const nr = Inv.raw(R); if (nr === Inv.raw(invR())) return;
  INV.fn = nr; INV.R = null; INV.r = null; INV.win = Object.assign({}, INV_WIN0);
  if (err) err.textContent = '';
  INV.cardKey = ''; invRefreshUI(); difRedraw(); invCardSoon(); difCommit();
}
function invSetupFields() {
  const inp = $dif('inv-fn-input'); if (!inp || inp._invSetup) return; inp._invSetup = true;
  try {
    inp.mathVirtualKeyboardPolicy = 'manual';
    if (inp.shadowRoot) { const st = document.createElement('style'); st.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}'; inp.shadowRoot.appendChild(st); }
    inp._mlSetFromRaw = raw => { let latex = ''; try { latex = (raw && raw.trim()) ? rawToLatex(raw) : ''; } catch (ex) { latex = ''; } inp.setAttribute('data-raw', raw || ''); inp.value = latex; if (typeof _mlMoveCursorToEnd === 'function') _mlMoveCursorToEnd(inp); };
    if (typeof mlPrewarmFocus === 'function') mlPrewarmFocus(inp);
    inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(inp, -1); try { inp.select(); } catch (e) {} });
    inp.addEventListener('focusout', () => { inp.style.borderColor = ''; setTimeout(invApplyField, 0); });
    inp.addEventListener('input', () => { let raw; try { raw = asciiMathToRaw(inp.getValue('ascii-math')); } catch (ex) { return; } inp.setAttribute('data-raw', raw); inp.style.borderColor = ''; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  } catch (e) { /* MathLive nicht verfügbar */ }
  invSyncFields();
}

// ── Rechenweg-Karte ──
function invHits() { const m = INV.S && INV.S.maps.main; const w = m ? m.win : { x0: -6, x1: 6 }; return Inv.hits(invR(), INV.k, w.x0, w.x1); }
function invCardDoc() {
  try {
    const v = INV.view, R = invR();
    if (v === 'mirror') return { t: 'Rechenweg: Begriff der Umkehrfunktion', d: Inv.mirrorDoc(R, invClampX(R, INV.xp)) };
    if (v === 'test') { const I = Inv.info(R); return { t: 'Rechenweg: Umkehrbarkeit', d: Inv.testDoc(I.inj ? R : Inv.restrict(R, INV.r), INV.k, invHits()) }; }
    if (v === 'calc') return { t: 'Rechenweg: Umkehrfunktion berechnen', d: Inv.calcDoc(R, invClampX(R, INV.xp)) };
    return { t: 'Rechenweg: Bekannte Paare', d: Inv.pairsDoc(invPair(), INV.x0) };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
function invCardKey() { const v = INV.view; const k = { mirror: [INV.fn, INV.xp], test: [INV.fn, INV.k, INV.r, INV.win], calc: [INV.fn, INV.xp], pairs: [INV.pair, INV.x0] }[v]; return v + '|' + JSON.stringify(k); }
function invCardSoon() { clearTimeout(INV.cardT); INV.cardT = setTimeout(invCardRender, 40); }
function invCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = invActive() && INV.show.card;
  if (invActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = invCardKey(); if (key === INV.cardKey) return;
  INV.cardKey = key;
  const r = invCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}

// ── Zustand sichern / laden ──
function invCapture() { return difCopy({ view: INV.view, fn: INV.fn, xp: INV.xp, k: INV.k, r: INV.r, pair: INV.pair, x0: INV.x0, win: INV.win, show: INV.show }); }
function invApply(s) {
  INV.anim = null;                                                       // laufende Animation beenden (Rückgängig, Laden, Zurücksetzen)
  const d = invDefaults(), num = (v, def) => { v = Number(v); return isFinite(v) ? v : def; };
  if (s && typeof s === 'object') {
    if (INV_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    if (typeof s.fn === 'string' && s.fn.length < 200 && invParseRaw(s.fn)) d.fn = s.fn;
    ['xp', 'k', 'x0'].forEach(key => { d[key] = num(s[key], d[key]); });
    d.r = s.r === null || s.r === undefined || !isFinite(Number(s.r)) ? null : Number(s.r);
    if (Inv.PAIRS.some(p => p.id === s.pair)) d.pair = s.pair;
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1), c = ok(w.y0), e = ok(w.y1);
      if (a !== null && b !== null && c !== null && e !== null && b > a && e > c) d.win = { x0: a, x1: b, y0: c, y1: e };
    }
    if (s.show && typeof s.show === 'object') Object.keys(INV_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  INV.drag = null; INV.R = null;
  Object.keys(d).forEach(k => { INV[k] = d[k]; });
  INV.cardKey = '';
  invSyncFields(); invRefreshUI(); difRedraw(); invCardSoon();
}

// ── Animation: Der Graph von f klappt um die Winkelhalbierende und wird zum Graphen von f⁻¹ ──
function invAnimToggle() {
  if (INV.anim) { INV.anim = null; invRefreshUI(); difRedraw(); return; }
  INV.show.diag = true;
  INV.anim = { last: 0, u: 0, k: 1 }; invRefreshUI(); requestAnimationFrame(invAnimFrame);
}
function invAnimFrame(ts) {
  const a = INV.anim; if (!a) return;
  if (!invActive() || INV.view !== 'mirror') { INV.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  a.u = Math.min(1, a.u + dt / 4); const e = a.u * a.u * (3 - 2 * a.u); a.k = Math.cos(Math.PI * e);
  if (a.u >= 1) { INV.anim = null; INV.show.inv = true; invRefreshUI(); difRedraw(); difCommit(); return; }
  difRedraw(); requestAnimationFrame(invAnimFrame);
}

// ── Zeichnen ──
function invCtx(W, H, exp) {
  const R = invR(), I = Inv.info(R);
  return { view: INV.view, R, xp: INV.xp, k: INV.k, r: INV.r === null ? I.r0 : INV.r, pair: invPair(), x0: INV.x0, win: INV.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, smooth: !exp, show: INV.show, flip: INV.anim && !exp ? INV.anim.k : null };
}
const invDock = w => (INV.show.card && w >= 760 ? stCardW(w, 0.36) : 0);
const invDockH = (w, h) => (INV.show.card && w < 760 ? Math.round(h * 0.5) : 0);
function invLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = invDock(w), dh = invDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function invDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  invLayoutCard(w, h);
  const W = w - invDock(w), Hs = h - invDockH(w, h);
  const S = stSoloBuild(invBuildScene, W, Hs, invCtx(W, Hs), 'inv|' + INV.view + '|' + JSON.stringify(INV.show), W < w || Hs < h);   // Karte offen: nur Bild (41_stat_draw.js)
  INV.S = S; statPaint(S, W, Hs);
  invCardRender();
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function invLatex() { const W = 760, H = 520; const S = invBuildScene(W, H, invCtx(W, H, { fs: 11 })); return stSceneTex(S, W, H, (INV_VIEWS.find(q => q[0] === INV.view) || [0, ''])[1], 11); }
function invCardLatex() { const r = invCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.'; return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d); }
function invMakeLatex(which) { const ui = INV.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? invCardLatex() : invLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function invCopyLatex() { texCopy(INV.ui, () => invMakeLatex('pic')); }

// ── Ausschnitt ──
function invResolvedWin() { const m = INV.S && INV.S.maps.main; if (m) return Object.assign({}, m.win); const w = INV.win; return w.x0 !== null && isFinite(w.x0) ? Object.assign({}, w) : { x0: -3, x1: 3, y0: -3, y1: 3 }; }
function invZoom(f, cx, cy) {
  const w = invResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f, ny0 = cy - (cy - w.y0) * f, ny1 = cy + (w.y1 - cy) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return;
  INV.win = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 };
}
function invResetWin() { INV.win = Object.assign({}, INV_WIN0); invRefreshUI(); difRedraw(); invCardSoon(); difCommit(); }
function invStep(div) { const w = invResolvedWin(); return Stat.niceStep(w.x1 - w.x0, div); }

// ── Panel ──
function invBuildUI() {
  if (INV.ui || !$dif('inv-panel')) return;
  const ui = INV.ui = {}, body = $dif('inv-body');
  ui.sel = $dif('inv-view');
  INV_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { INV.view = ui.sel.value; INV.cardKey = ''; INV.win = Object.assign({}, INV_WIN0); invRefreshUI(); difRedraw(); invCardSoon(); difCommit(); });
  ui.desc = $dif('inv-desc');
  ui.ex = $dif('inv-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec');
  det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => invMakeLatex('pic')); ui.br.addEventListener('click', () => invMakeLatex('calc')); ui.bc.addEventListener('click', invCopyLatex);
  const ap = $dif('inv-apply'); if (ap) ap.addEventListener('click', invApplyField);
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!invActive()) return; INV.show.card = false; invRefreshUI(); difRedraw(); invCardRender(); difCommit(); });
  invRefreshUI();
}

function invRefreshUI() {
  const ui = INV.ui; if (!ui) return;
  const v = INV.view, sh = INV.show, R = invR(), I = Inv.info(R);
  ui.sel.value = v;
  const d = INV_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[1])); if (typeof envHint === 'function') envHint('inv', d[0], () => INV.S);   // Hinweis als Überschrift über dem Bild
  const showF = v !== 'pairs';
  ['inv-f-row', 'inv-field-head'].forEach(id => { const e = $dif(id); if (e) e.style.display = showF ? '' : 'none'; });
  invSyncFields();
  ui.ex.replaceChildren(Object.assign(difEl('option', null, v === 'pairs' ? 'Paar wählen …' : 'Beispiel wählen …'), { value: '' }));
  const exs = v === 'pairs' ? Inv.PAIRS.map(p => p.name) : INV_EX.map(p => p[1]);
  exs.forEach((nm, i) => { const o = difEl('option', null, nm); o.value = String(i); if (!/eingeschränkt| und /.test(nm)) o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });   // reine Formeln bleiben, Namen mit deutschen Wörtern werden übersetzt
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const k = +i;
    if (v === 'pairs') { INV.pair = Inv.PAIRS[k].id; INV.x0 = Inv.PAIRS[k].x0; }
    else { INV.fn = INV_EX[k][0]; INV.R = null; INV.r = null; }
    INV.win = Object.assign({}, INV_WIN0); const er = $dif('inv-err'); if (er) er.textContent = '';
    invSyncFields(); INV.cardKey = ''; invRefreshUI(); difRedraw(); invCardSoon(); difCommit();
  };
  ui.params.replaceChildren();
  const P = ui.params;
  const redo = () => { invRefreshUI(); difRedraw(); invCardSoon(); difCommit(); };
  const touch = () => { INV.cardKey = ''; difRedraw(); invCardSoon(); };
  const check = (label, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get();
    lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); row.appendChild(lb);
    inp.addEventListener('change', () => { set(inp.checked); INV.cardKey = ''; redo(); });
    P.appendChild(row);
  };
  const select = (label, opts, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label', null, label), sel = difEl('select');
    opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
    sel.value = get(); sel.addEventListener('change', () => { set(sel.value); INV.cardKey = ''; redo(); });
    row.append(lb, sel); P.appendChild(row);
  };
  const numRow = (label, get, set, o) => {
    o = o || {}; const row = difEl('div', 'settings-row'); row.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no');
    lb.setAttribute('translate', 'no');
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x)) { set(invR6(x)); touch(); difCommit(); } inp.value = difFmtIn(get()); };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const nudge = s => difBtn(s > 0 ? '▶' : '◀', () => { const st = o.step || invStep(25); set(invR6(Math.round((get() + s * st) / st * 1e6) / 1e6 * st)); inp.value = difFmtIn(get()); touch(); difCommit(); }, s > 0 ? 'Nach rechts' : 'Nach links');
    row.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(row); return inp;
  };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const kindTxt = { lin: 'lineare Funktion', pow: 'Potenz-/Wurzelfunktion', exp: 'Exponentialfunktion', log: 'Logarithmusfunktion' }[R.type];

  if (v === 'mirror' || v === 'calc') {
    const h = difEl('div', 'act-hint', 'Erkannt: ' + kindTxt + (I.inj ? ' – auf D umkehrbar.' : ' – nur eingeschränkt umkehrbar (x ≥ ' + difFmtIn(I.r) + ', rechter Ast).')); h.style.margin = '2px 2px 4px'; P.appendChild(h);
    group('Punkt P auf f');
    numRow('Stelle x', () => INV.xp, x => { INV.xp = x; }, { step: 0.5 });
    group('Anzeige');
    check('Winkelhalbierende y = x zeigen', () => sh.diag, x => { sh.diag = x; });
    check('Umkehrfunktion f⁻¹ zeigen', () => sh.inv, x => { sh.inv = x; });
    if (v === 'mirror') check('Punkte der Wertetabelle zeigen', () => sh.pts, x => { sh.pts = x; });
    if (v === 'mirror') { const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(INV.anim ? '⏸ Pause' : '▶ Graph an y = x umklappen', invAnimToggle)); P.appendChild(ab); }
  } else if (v === 'test') {
    const h = difEl('div', 'act-hint', 'Erkannt: ' + kindTxt + (I.inj ? ' – streng monoton, umkehrbar.' : ' – nicht umkehrbar; Einschränkung nötig.')); h.style.margin = '2px 2px 4px'; P.appendChild(h);
    group('Waagrechte Gerade y = k');
    numRow('k', () => INV.k, x => { INV.k = x; }, { step: 0.5 });
    if (!I.inj) {
      group('Einschränkung: nur x ≥ r (natürlich: r = ' + difFmtIn(I.r0) + ')');
      numRow('r', () => (INV.r === null ? I.r0 : INV.r), x => { INV.r = x; }, { step: 0.5 });
      const rb = difBtn('⟲ r = ' + difFmtIn(I.r0) + ' (Scheitel)', () => { INV.r = null; redo(); }); rb.style.width = '100%'; P.appendChild(rb);
    }
    group('Anzeige');
    check('Umkehrfunktion des zugelassenen Astes zeigen', () => sh.inv, x => { sh.inv = x; });
    check('Winkelhalbierende y = x zeigen', () => sh.diag, x => { sh.diag = x; });
  } else {
    select('Paar', Inv.PAIRS.map(p => [p.id, p.name]), () => INV.pair, x => { INV.pair = x; INV.x0 = invPair().x0; INV.win = Object.assign({}, INV_WIN0); });
    const pr = invPair(); const h = difEl('div', 'act-hint', pr.note); h.style.margin = '2px 2px 4px'; P.appendChild(h);
    group('Stelle x₀ (Punkt P auf f)');
    numRow('x₀', () => INV.x0, x => { INV.x0 = x; }, { step: 0.25 });
    group('Anzeige');
    check('Winkelhalbierende y = x zeigen', () => sh.diag, x => { sh.diag = x; });
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { invZoom(0.7); redo(); }, 'Hineinzoomen'), difBtn('－', () => { invZoom(1 / 0.7); redo(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', invResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; });
}

// ── Maus und Berührung auf dem Canvas ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = INV.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + hitR(4) && d < bd) { bd = d; best = q; } }); return best; };
  const setPt = (id, x, y, shift) => {
    const m = INV.S && INV.S.maps.main; if (!m) return;
    const st = Stat.niceStep(m.win.x1 - m.win.x0, 14), sty = Stat.niceStep(m.win.y1 - m.win.y0, 14), sx = invR6(difSnap(x, st, shift)), sy = invR6(difSnap(y, sty, shift)), v = INV.view;
    if (v === 'pairs') { if (id === 'P') INV.x0 = sx; else if (id === 'Q') INV.x0 = sy; }
    else if (v === 'test') { if (id === 'K') INV.k = sy; else if (id === 'R') INV.r = sx; }
    else { if (id === 'P') INV.xp = sx; else if (id === 'Q') INV.xp = sy; }
    INV.cardKey = '';
  };
  const down = e => {
    if (!invActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = INV.S; if (!S) return; const p = pos(e); if (INV.anim) { INV.anim = null; invRefreshUI(); difRedraw(); }
    const q = near(p);
    if (q) { INV.drag = { type: q.id }; if (INV.win.x0 === null) { INV.win = invResolvedWin(); INV.drag.auto = true; } }
    else if (inMap(S.maps.main, p)) INV.drag = { type: 'pan', px: p.x, py: p.y, w: invResolvedWin() };
    if (INV.drag) cv.style.cursor = INV.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!invActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = INV.S; if (!S) return; const p = pos(e), d = INV.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) ? 'crosshair' : ''); return; }
    const m = S.maps.main;
    if (d.type === 'pan') { const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0); INV.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy }; }
    else setPt(d.type, m.IX(p.x), m.IY(p.y), e.shiftKey);
    difRedraw(); if (d.type !== 'pan') invCardSoon();
  };
  const up = e => {
    if (!invActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !INV.drag) return;
    if (INV.drag) { if (INV.drag.auto) INV.win = Object.assign({}, INV_WIN0); INV.drag = null; cv.style.cursor = ''; invRefreshUI(); difRedraw(); invCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!invActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = INV.S; if (!S) return; const p = pos(e), m = S.maps.main; if (!inMap(m, p)) return;
    invZoom(stWheelF(e), m.IX(p.x), m.IY(p.y)); difRedraw();
    clearTimeout(INV._wt); INV._wt = setTimeout(() => { invRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!invActive()) return; e.stopImmediatePropagation(); e.preventDefault(); invResetWin(); };
  const stop = e => { if (invActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { INV.cardKey = ''; if (invActive()) { invCardRender(); invRefreshUI(); difRedraw(); } }, ms)); });
invBuildUI();
document.addEventListener('DOMContentLoaded', () => setTimeout(invSetupFields, 150));
if (typeof module !== 'undefined' && module.exports) module.exports = {};
