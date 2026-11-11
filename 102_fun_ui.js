// ═══════════════════════════════════════════════════════════════════
// 102_fun_ui.js — Funktionen: Einführung: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 100_fun.js, 100b_fun_docs.js (Fun). Bilder: 101_fun_draw.js (Szenen). Aufbau wie 95_exp_ui.js.
// Zustand FUN: Ansicht, Funktion fn (Rohausdruck), Wertetabelle (x0, step, n), Balkenabstand h (sstep: Schrittweite des Schiebers),
// senkrechte Gerade t, Anwendung app mit Markierung xm, Ausschnitt, Optionen. Umgebung «intro» in 32_env.js.
// ═══════════════════════════════════════════════════════════════════

const FUN_VIEWS = [['map', 'Zuordnung und Wertetabelle'], ['def', 'Funktionsbegriff und Eigenschaften'], ['app', 'Anwendungen mit Einheiten']];
const FUN_DESC = {
  map: ['Gib oben eine Funktion ein und ziehe den {{Punkt P|P}}: Jede Stelle x wird eingesetzt, das Ergebnis f(x) ergibt einen {{Punkt (x | f(x))|pts}} im Bild. Rechts steht das Einsetzen Schritt für Schritt.', 'Eine Funktion ordnet jeder Zahl x genau eine Zahl y = f(x) zu. Die Rechenvorschrift sagt, wie aus x der Wert entsteht. Setzt man Stellen ein, entsteht die Wertetabelle; jede Zeile ist ein Punkt (x | f(x)) im Koordinatensystem.'],
  bars: ['Schiebe den Abstand h langsam gegen 0 (oder starte die Animation): Die {{Balken|bar}} über den Stellen x rücken zusammen, und ihre Enden bilden am Schluss den Graphen der Funktion.', 'Über jeder Stelle x im Abstand h steht ein Balken bis zur Höhe f(x). Verkleinert man den Abstand, rücken die Balken zusammen; bei h → 0 werden ihre Enden zur Kurve: Das ist der Graph der Funktion.'],
  def: ['Ziehe die {{senkrechte Gerade x = t|T,vl}} über das Bild: Sie trifft den {{Graphen|f}} nie mehr als einmal – darum ist er ein Funktionsgraph. Markiert sind Nullstellen, y-Achsenabschnitt, Hoch- und Tiefpunkte.', 'Begriffe am Graphen: Definitionsbereich (welche x darf man einsetzen), Wertebereich (welche Werte kommen heraus), Nullstellen, y-Achsenabschnitt, steigend und fallend, Hoch- und Tiefpunkte. Jede senkrechte Gerade trifft den Graphen höchstens einmal.'],
  app: ['Wähle eine Anwendung und ziehe den {{Punkt|X}} auf dem Graphen: An den Achsen liest du die beiden Grössen mit Einheiten ab ({{Ablesehilfen|ab}}), rechts steht, was der Wert bedeutet.', 'Funktionen beschreiben Zusammenhänge zwischen Grössen: Weg und Zeit, Kosten und Minuten, Temperatur und Uhrzeit. Die Achsen tragen dann Grössen mit Einheiten, und jeder Funktionswert hat eine Bedeutung.']
};
const FUN_EX = [['x^2-2x', 'x² − 2x'], ['2*x+1', '2x + 1'], ['(-1/2)*x+2', '−x/2 + 2'], ['x^3-3x', 'x³ − 3x'], ['-x^2+4', '−x² + 4'], ['x^2/4-1', 'x²/4 − 1'], ['sqrt(x)', '√x'], ['1/x', '1/x'], ['2^x', '2^x'], ['sin(x)', 'sin x'], ['abs(x)-2', '|x| − 2'], ['x^2*(x-2)', 'x²(x − 2)']];
const FUN_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const FUN_SHOW0 = { curve: true, coords: false, vals: true, dots: false, mono: true, pts: true, rel: false, card: true };

function funDefaults() {
  return { view: 'map', fn: 'x^2-2x', x0: -2, step: 1, n: 7, h: 1, sstep: 0.1, t: 1.5, app: 'fall', xm: 3, win: Object.assign({}, FUN_WIN0), show: Object.assign({}, FUN_SHOW0) };
}
const FUN = Object.assign(funDefaults(), { ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0, Fx: null });
function funActive() { return typeof ENV !== 'undefined' && ENV.cur === 'intro'; }
const funR6 = x => Math.round(x * 1e6) / 1e6 + 0;
function funApp() { return Fun.APPS.find(a => a.id === FUN.app) || Fun.APPS[0]; }
function funFx() {
  const raw = FUN.view === 'app' ? funApp().raw : FUN.fn;
  if (!FUN.Fx || FUN.Fx.raw !== raw) { FUN.Fx = Fun.mk(raw) || Fun.mk('x^2-2x'); }
  return FUN.Fx;
}

// ── Eingabefeld ──
const funFieldRaw = id => { const inp = $dif(id); return inp ? (inp.getAttribute('data-raw') || '') : ''; };
function funSyncFields() {
  const f = $dif('intro-fn-input'); if (!f || !f._mlSetFromRaw) return;
  if (FUN.view === 'app') return;
  if (f.getAttribute('data-raw') !== FUN.fn && document.activeElement !== f) f._mlSetFromRaw(FUN.fn);
}
function funApplyField() {
  const raw = funFieldRaw('intro-fn-input').trim(), err = $dif('intro-err');
  if (!raw) { if (err) err.textContent = ''; return; }
  const Fx = Fun.mk(raw);
  if (!Fx) { if (err) err.textContent = 'Das konnte ich nicht lesen. Erlaubt ist ein Term in x, z.B. x^2-2x, 2x+1, sqrt(x), 1/x, 2^x oder sin(x).'; return; }
  if (Fx.raw === FUN.fn) return;
  FUN.fn = Fx.raw; FUN.Fx = null; FUN.win = Object.assign({}, FUN_WIN0);
  if (err) err.textContent = '';
  FUN.cardKey = ''; funRefreshUI(); difRedraw(); funCardSoon(); difCommit();
}
function funSetupFields() {
  const inp = $dif('intro-fn-input'); if (!inp || inp._funSetup) return; inp._funSetup = true;
  try {
    inp.mathVirtualKeyboardPolicy = 'manual';
    if (inp.shadowRoot) { const st = document.createElement('style'); st.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}'; inp.shadowRoot.appendChild(st); }
    inp._mlSetFromRaw = raw => { let latex = ''; try { latex = (raw && raw.trim()) ? rawToLatex(raw) : ''; } catch (ex) { latex = ''; } inp.setAttribute('data-raw', raw || ''); inp.value = latex; if (typeof _mlMoveCursorToEnd === 'function') _mlMoveCursorToEnd(inp); };
    if (typeof mlPrewarmFocus === 'function') mlPrewarmFocus(inp);
    inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(inp, -1); try { inp.select(); } catch (e) {} });
    inp.addEventListener('focusout', () => { inp.style.borderColor = ''; setTimeout(funApplyField, 0); });
    inp.addEventListener('input', () => { let raw; try { raw = asciiMathToRaw(inp.getValue('ascii-math')); } catch (ex) { return; } inp.setAttribute('data-raw', raw); inp.style.borderColor = ''; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  } catch (e) { /* MathLive nicht verfügbar */ }
  funSyncFields();
}

// ── Rechenweg-Karte ──
function funWinNow() { const m = FUN.S && FUN.S.maps.main; return m ? m.win : { x0: -4, x1: 4, y0: -3, y1: 5 }; }
function funCardDoc() {
  try {
    const v = FUN.view, Fx = funFx();
    if (v === 'map') return { t: 'Rechenweg: Wertetabelle', d: Fun.mapDoc(Fx, FUN.x0, FUN.step, FUN.n) };
    if (v === 'bars') { const w = funWinNow(); return { t: 'Rechenweg: Balken und Graph', d: Fun.barsDoc(Fx, FUN.h, FUN.h > 0 ? Fun.bars(Fx, FUN.h, w.x0, w.x1) : []) }; }
    if (v === 'def') { const w = funWinNow(); return { t: 'Rechenweg: Funktionsbegriff', d: Fun.defDoc(Fx, Fun.props(Fx, w.x0, w.x1), w.x0, w.x1, FUN.t) }; }
    const A = funApp(); return { t: 'Rechenweg: Anwendung', d: Fun.appDoc(A, Fx, Math.max(A.xmin, Math.min(A.xmax, FUN.xm))) };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
function funCardKey() { const v = FUN.view, w = funWinNow(); const k = { map: [FUN.fn, FUN.x0, FUN.step, FUN.n], bars: [FUN.fn, FUN.h, w.x0, w.x1], def: [FUN.fn, FUN.t, w.x0, w.x1], app: [FUN.app, FUN.xm] }[v]; return v + '|' + JSON.stringify(k); }
function funCardSoon() { clearTimeout(FUN.cardT); FUN.cardT = setTimeout(funCardRender, 40); }
function funCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = funActive() && FUN.show.card;
  if (funActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = funCardKey(); if (key === FUN.cardKey) return;
  FUN.cardKey = key;
  const r = funCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  // Tabelle steht schon im Bild: in der Karte nicht noch einmal (im LaTeX-Rechenweg bleibt sie)
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(FUN.view === 'map' ? Object.assign(Object.create(Object.getPrototypeOf(r.d)), r.d, { b: r.d.b.filter(b => b.k !== 'tab') }) : r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}

// ── Zustand sichern / laden ──
function funCapture() { return difCopy({ view: FUN.view, fn: FUN.fn, x0: FUN.x0, step: FUN.step, n: FUN.n, h: FUN.h, sstep: FUN.sstep, t: FUN.t, app: FUN.app, xm: FUN.xm, win: FUN.win, show: FUN.show }); }
function funApply(s) {
  const d = funDefaults(), num = (v, def) => { v = Number(v); return isFinite(v) ? v : def; };
  if (s && typeof s === 'object') {
    if (FUN_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    if (typeof s.fn === 'string' && s.fn.length < 300 && Fun.mk(s.fn)) d.fn = s.fn;
    ['x0', 'step', 'n', 'h', 'sstep', 't', 'xm'].forEach(key => { d[key] = num(s[key], d[key]); });
    if (!(d.step > 0)) d.step = 1; d.n = Math.max(2, Math.min(40, Math.round(d.n))); d.h = Math.max(0, Math.min(4, d.h)); if (!(d.sstep > 0)) d.sstep = 0.1;
    if (Fun.APPS.some(a => a.id === s.app)) d.app = s.app;
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1), c = ok(w.y0), e = ok(w.y1);
      if (a !== null && b !== null && c !== null && e !== null && b > a && e > c) d.win = { x0: a, x1: b, y0: c, y1: e };
    }
    if (s.show && typeof s.show === 'object') Object.keys(FUN_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  FUN.anim = null; FUN.drag = null; FUN.Fx = null;
  Object.keys(d).forEach(k => { FUN[k] = d[k]; });
  FUN.cardKey = '';
  funSyncFields(); funRefreshUI(); difRedraw(); funCardSoon();
}

// ── Zeichnen ──
function funCtx(W, H, exp) {
  return { view: FUN.view, Fx: funFx(), x0: FUN.x0, step: FUN.step, n: FUN.n, h: FUN.h, t: FUN.t, app: funApp(), xm: FUN.xm, win: FUN.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, smooth: !exp, show: FUN.show };
}
const funDock = w => (FUN.show.card && w >= 760 ? stCardW(w, 0.36) : 0);
const funDockH = (w, h) => (FUN.show.card && w < 760 ? Math.round(h * 0.5) : 0);
function funLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = funDock(w), dh = funDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function funDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  funLayoutCard(w, h);
  const W = w - funDock(w), Hs = h - funDockH(w, h);
  const S = stSoloBuild(funBuildScene, W, Hs, funCtx(W, Hs), 'fun|' + FUN.view + '|' + JSON.stringify(FUN.show), W < w || Hs < h);   // Karte offen: nur Bild (41_stat_draw.js)
  FUN.S = S; statPaint(S, W, Hs);
  funCardRender();
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function funLatex() { const W = 760, H = 520; const S = funBuildScene(W, H, funCtx(W, H, { fs: 11 })); return stSceneTex(S, W, H, (FUN_VIEWS.find(q => q[0] === FUN.view) || [0, ''])[1], 11); }
function funCardLatex() { const r = funCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.'; return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d); }
function funMakeLatex(which) { const ui = FUN.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? funCardLatex() : funLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function funCopyLatex() {
  const ui = FUN.ui; if (!ui) return; if (!ui.ta.value) funMakeLatex('pic');
  const done = () => { ui.msg.textContent = (typeof t === 'function' ? t('msg_copied') : 'Kopiert'); setTimeout(() => { ui.msg.textContent = ''; }, 2500); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ui.ta.value).then(done).catch(() => { ui.ta.select(); document.execCommand('copy'); done(); });
  else { ui.ta.select(); document.execCommand('copy'); done(); }
}

// ── Ausschnitt ──
function funResolvedWin() { const m = FUN.S && FUN.S.maps.main; if (m) return Object.assign({}, m.win); const w = FUN.win; return w.x0 !== null && isFinite(w.x0) ? Object.assign({}, w) : { x0: -4, x1: 4, y0: -3, y1: 5 }; }
function funZoom(f, cx, cy) {
  const w = funResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f, ny0 = cy - (cy - w.y0) * f, ny1 = cy + (w.y1 - cy) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return;
  FUN.win = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 };
}
function funResetWin() { FUN.win = Object.assign({}, FUN_WIN0); funRefreshUI(); difRedraw(); funCardSoon(); difCommit(); }
function funStep(div) { const w = funResolvedWin(); return Stat.niceStep(w.x1 - w.x0, div); }

// ── Panel ──
function funBuildUI() {
  if (FUN.ui || !$dif('intro-panel')) return;
  const ui = FUN.ui = {}, body = $dif('intro-body');
  ui.sel = $dif('intro-view');
  FUN_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { FUN.view = ui.sel.value; FUN.anim = null; FUN.cardKey = ''; FUN.win = Object.assign({}, FUN_WIN0); funRefreshUI(); difRedraw(); funCardSoon(); difCommit(); });
  ui.desc = $dif('intro-desc');
  ui.ex = $dif('intro-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec');
  det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => funMakeLatex('pic')); ui.br.addEventListener('click', () => funMakeLatex('calc')); ui.bc.addEventListener('click', funCopyLatex);
  const ap = $dif('intro-apply'); if (ap) ap.addEventListener('click', funApplyField);
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!funActive()) return; FUN.show.card = false; funRefreshUI(); difRedraw(); funCardRender(); difCommit(); });
  funRefreshUI();
}

function funRefreshUI() {
  const ui = FUN.ui; if (!ui) return;
  const v = FUN.view, sh = FUN.show;
  ui.sel.value = v;
  const d = FUN_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[1])); if (typeof envHint === 'function') envHint('intro', d[0], () => FUN.S);   // Hinweis als Überschrift über dem Bild
  const showF = v !== 'app';
  ['intro-f-row', 'intro-field-head'].forEach(id => { const e = $dif(id); if (e) e.style.display = showF ? '' : 'none'; });
  funSyncFields();
  ui.ex.replaceChildren(Object.assign(difEl('option', null, v === 'app' ? 'Anwendung wählen …' : 'Beispiel wählen …'), { value: '' }));
  const exs = v === 'app' ? Fun.APPS.map(a => a.name) : FUN_EX.map(p => p[1]);
  exs.forEach((nm, i) => { const o = difEl('option', null, nm); o.value = String(i); o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const k = +i;
    if (v === 'app') { FUN.app = Fun.APPS[k].id; FUN.xm = Fun.APPS[k].x0; }
    else { FUN.fn = FUN_EX[k][0]; }
    FUN.Fx = null; FUN.anim = null; FUN.win = Object.assign({}, FUN_WIN0); const er = $dif('intro-err'); if (er) er.textContent = '';
    funSyncFields(); FUN.cardKey = ''; funRefreshUI(); difRedraw(); funCardSoon(); difCommit();
  };
  ui.params.replaceChildren();
  const P = ui.params;
  const redo = () => { funRefreshUI(); difRedraw(); funCardSoon(); difCommit(); };
  const touch = () => { FUN.cardKey = ''; difRedraw(); funCardSoon(); };
  const check = (label, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get();
    lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); row.appendChild(lb);
    inp.addEventListener('change', () => { set(inp.checked); FUN.cardKey = ''; redo(); });
    P.appendChild(row);
  };
  const select = (label, opts, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label', null, label), sel = difEl('select');
    opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
    sel.value = get(); sel.addEventListener('change', () => { set(sel.value); FUN.cardKey = ''; redo(); });
    row.append(lb, sel); P.appendChild(row);
  };
  const numRow = (label, get, set, o) => {
    o = o || {}; const row = difEl('div', 'settings-row'); row.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no');
    lb.setAttribute('translate', 'no');
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x)) { set(funR6(x)); touch(); difCommit(); } inp.value = difFmtIn(get()); };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const nudge = s => difBtn(s > 0 ? '▶' : '◀', () => { const st = o.step || funStep(25); set(funR6(Math.round((get() + s * st) / st * 1e6) / 1e6 * st)); inp.value = difFmtIn(get()); touch(); difCommit(); }, s > 0 ? 'Nach rechts' : 'Nach links');
    row.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(row); return inp;
  };
  const slider = (label, get, set, min, max, step) => {
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const val = difEl('b', null, difFmtIn(get())); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    const lb = difEl('label', null, label); lb.setAttribute('translate', 'no');
    top.append(lb, val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = Math.max(min, Math.min(max, get())); sl.style.width = '100%';
    sl.addEventListener('input', () => { FUN.anim = null; set(funR6(parseFloat(sl.value))); val.textContent = difFmtIn(get()); FUN.cardKey = ''; difRedraw(); funCardSoon(); });
    // Während des Ziehens bleibt der Ausschnitt stehen; danach passt er sich einmal ruhig an
    const hold = () => { if (FUN.win.x0 === null) { FUN.win = funResolvedWin(); FUN._slAuto = true; } };
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => sl.addEventListener(ev, hold, { passive: true }));
    sl.addEventListener('change', () => { if (FUN._slAuto) { FUN.win = Object.assign({}, FUN_WIN0); FUN._slAuto = false; } funRefreshUI(); difCommit(); difRedraw(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1); return sl;
  };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };

  if (v === 'map') {
    group('Wertetabelle: Start x₀, Schrittweite, Anzahl');
    numRow('x₀', () => FUN.x0, x => { FUN.x0 = x; }, { step: 0.5 });
    select('Schrittweite', [['0.25', '0,25'], ['0.5', '0,5'], ['1', '1'], ['2', '2'], ['5', '5']], () => String(FUN.step), x => { FUN.step = parseFloat(x); });
    slider('Anzahl', () => FUN.n, x => { FUN.n = Math.max(2, Math.min(15, Math.round(x))); }, 2, 15, 1);
    group('Anzeige');
    check('Kurve schwach zeigen', () => sh.curve, x => { sh.curve = x; });
    check('Koordinaten (x | y) der Punkte', () => sh.coords, x => { sh.coords = x; });
  } else if (v === 'bars') {
    group('Balken über den Stellen');
    const opts = difEl('div', 'settings-row td-opts');
    const cb = (label, get, set) => { const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get(); lb.append(inp, document.createTextNode(' ' + label)); inp.addEventListener('change', () => { set(inp.checked); FUN.cardKey = ''; redo(); }); opts.appendChild(lb); };
    cb('Koordinaten (x | y) der Stellen', () => sh.coords, x => { sh.coords = x; });
    cb('Funktionswerte beschriften', () => sh.vals, x => { sh.vals = x; });
    cb('Nur Punkte (ohne Balken)', () => sh.dots, x => { sh.dots = x; });
    cb('Kurve zeigen', () => sh.curve, x => { sh.curve = x; });
    P.appendChild(opts);
    const hint = difEl('div', 'act-hint', 'Jeder Stelle x im gewählten Abstand gehört ein Funktionswert f(x). Der Balken reicht von der x-Achse bis zum Graphen. Verkleinere den Abstand: bei 0 erscheint die ganze Funktion.'); hint.style.margin = '4px 2px 6px'; P.appendChild(hint);
    slider('Abstand der Stellen h', () => FUN.h, x => { FUN.h = Math.max(0, x); }, 0, 4, FUN.sstep);
    select('Schrittweite des Schiebers', [['0.01', '0,01'], ['0.05', '0,05'], ['0.1', '0,1'], ['0.25', '0,25'], ['0.5', '0,5'], ['1', '1']], () => String(FUN.sstep), x => { FUN.sstep = parseFloat(x); });
    const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:5px;';
    ab.append(difBtn(FUN.anim ? '⏸ Anhalten' : '▶ Abstand gegen 0', funAnimToggle), difBtn('⟲ h = 1', () => { FUN.anim = null; FUN.h = 1; redo(); })); P.appendChild(ab);
  } else if (v === 'def') {
    group('Senkrechte Gerade x = t');
    numRow('t', () => FUN.t, x => { FUN.t = x; }, { step: 0.5 });
    group('Anzeige');
    check('Steigend/fallend farbig', () => sh.mono, x => { sh.mono = x; });
    check('Nullstellen, y-Achsenabschnitt, Hoch-/Tiefpunkte', () => sh.pts, x => { sh.pts = x; });
    check('Gegenbeispiel Kreis (keine Funktion)', () => sh.rel, x => { sh.rel = x; });
  } else {
    select('Anwendung', Fun.APPS.map(a => [a.id, a.name]), () => FUN.app, x => { FUN.app = x; FUN.xm = funApp().x0; FUN.Fx = null; FUN.win = Object.assign({}, FUN_WIN0); });
    const A = funApp();   // der Sachverhalt steht als «Situation» im Rechenweg
    group('Markierung auf dem Graphen');
    numRow(A.xv, () => FUN.xm, x => { FUN.xm = Math.max(A.xmin, Math.min(A.xmax, x)); }, { step: A.step / 2 });
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { funZoom(0.7); redo(); }, 'Hineinzoomen'), difBtn('－', () => { funZoom(1 / 0.7); redo(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', funResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; });
}

// ── Animation: Abstand h gegen 0 ──
function funAnimToggle() {
  if (FUN.anim) { FUN.anim = null; funRefreshUI(); difCommit(); return; }
  if (FUN.h <= 0.011) FUN.h = 2;
  FUN.anim = { last: 0 }; funRefreshUI(); requestAnimationFrame(funAnimFrame);
}
function funAnimFrame(ts) {
  const a = FUN.anim; if (!a) return;
  if (!funActive() || FUN.view !== 'bars') { FUN.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  FUN.h = Math.max(0, FUN.h - dt * Math.max(0.08, FUN.h * 0.45));
  if (FUN.h <= 0.011) { FUN.h = 0; FUN.anim = null; FUN.cardKey = ''; funRefreshUI(); difRedraw(); funCardSoon(); difCommit(); return; }
  const sl = FUN.ui && FUN.ui.params.querySelector('input[type=range]'); if (sl) { sl.value = FUN.h; const b = sl.parentNode.querySelector('b'); if (b) b.textContent = difFmtIn(funR6(FUN.h)); }
  FUN.cardKey = ''; difRedraw(); funCardSoon(); requestAnimationFrame(funAnimFrame);
}

// ── Maus und Berührung auf dem Canvas ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = FUN.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + 4 && d < bd) { bd = d; best = q; } }); return best; };
  const setPt = (id, x, y, shift) => {
    const m = FUN.S && FUN.S.maps.main; if (!m) return;
    const st = Stat.niceStep(m.win.x1 - m.win.x0, 14), sx = funR6(difSnap(x, st, shift)), v = FUN.view;
    if (v === 'map' && id === 'P') FUN.x0 = funR6(difSnap(x, FUN.step, shift));
    else if (v === 'def' && id === 'T') FUN.t = sx;
    else if (v === 'app' && id === 'X') { const A = funApp(); FUN.xm = Math.max(A.xmin, Math.min(A.xmax, funR6(difSnap(x, A.step / 4, shift)))); }
    FUN.cardKey = '';
  };
  const down = e => {
    if (!funActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = FUN.S; if (!S) return; const p = pos(e); if (FUN.anim) { FUN.anim = null; funRefreshUI(); }
    const q = near(p);
    if (q) { FUN.drag = { type: q.id }; if (FUN.win.x0 === null) { FUN.win = funResolvedWin(); FUN.drag.auto = true; } }
    else if (inMap(S.maps.main, p)) FUN.drag = { type: 'pan', px: p.x, py: p.y, w: funResolvedWin() };
    if (FUN.drag) cv.style.cursor = FUN.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!funActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = FUN.S; if (!S) return; const p = pos(e), d = FUN.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) ? 'crosshair' : ''); return; }
    const m = S.maps.main;
    if (d.type === 'pan') { const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0); FUN.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy }; }
    else setPt(d.type, m.IX(p.x), m.IY(p.y), e.shiftKey);
    difRedraw(); if (d.type !== 'pan') funCardSoon();
  };
  const up = e => {
    if (!funActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !FUN.drag) return;
    if (FUN.drag) { if (FUN.drag.auto) FUN.win = Object.assign({}, FUN_WIN0); FUN.drag = null; cv.style.cursor = ''; funRefreshUI(); difRedraw(); funCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!funActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = FUN.S; if (!S) return; const p = pos(e), m = S.maps.main; if (!inMap(m, p)) return;
    funZoom(stWheelF(e), m.IX(p.x), m.IY(p.y)); difRedraw();
    clearTimeout(FUN._wt); FUN._wt = setTimeout(() => { funRefreshUI(); FUN.cardKey = ''; funCardSoon(); difCommit(); }, 400);
  };
  const dbl = e => { if (!funActive()) return; e.stopImmediatePropagation(); e.preventDefault(); funResetWin(); };
  const stop = e => { if (funActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { FUN.cardKey = ''; if (funActive()) { funCardRender(); funRefreshUI(); difRedraw(); } }, ms)); });
funBuildUI();
document.addEventListener('DOMContentLoaded', () => setTimeout(funSetupFields, 150));
if (typeof module !== 'undefined' && module.exports) module.exports = {};
