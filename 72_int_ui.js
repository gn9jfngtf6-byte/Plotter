// ═══════════════════════════════════════════════════════════════════
// 72_int_ui.js — Integralrechnung: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 70_int.js, 70b_int_docs.js (Int). Bilder: 71_int_draw.js (Szenen). Wie die
// Differentialrechnung (62_dif_ui.js, von der Hilfsfunktionen und die Karte #dif-card übernommen werden).
// Zustand ITG: Ansicht, Funktionen f (und g), Grenzen a und b, Streifenzahl n, Stelle x, Ausschnitt, Optionen.
// Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «int»).
// ═══════════════════════════════════════════════════════════════════

const ITG_VIEWS = [['sum', 'Ober-/Untersumme → Integral'], ['hs', 'Integralfunktion und Hauptsatz'], ['rg', 'Stammfunktion mit Regeln'], ['ar', 'Flächen zwischen Kurven'], ['rot', 'Rotationskörper']];
const ITG_DESC = {
  sum: ['Zwischen f und der x-Achse liegen n gleich breite Rechtecke. Die Untersumme (grün) nimmt den kleinsten, die Obersumme (blau) den grössten Funktionswert jedes Streifens.', 'Erhöhe n: Beide Summen nähern sich demselben Wert, dem bestimmten Integral. Ziehe a und b, um die Grenzen zu ändern.'],
  hs: ['Oben der Graph von f mit der gefärbten Fläche von a bis x, unten die Integralfunktion Fa(x) = ∫ f. Ziehe den Punkt x: Der untere Punkt zeigt, wie viel Fläche bis dahin gesammelt wurde.', 'Die Steigung von Fa an der Stelle x ist f(x): Wo f positiv ist, steigt Fa (grün), wo f negativ ist, fällt Fa (orange). Das ist der Hauptsatz.'],
  rg: ['Die Stammfunktion wird Schritt für Schritt mit den Integrationsregeln bestimmt. Danach folgt das bestimmte Integral zwischen a und b.', 'Ziehe a und b auf der x-Achse. Die Stammfunktion ist nur bis auf eine Konstante C bestimmt: Alle Stammfunktionen sind gegeneinander verschoben.'],
  ar: ['Die Fläche zwischen f und der x-Achse (oder zwischen f und g) wird an den Schnittstellen in Stücke geteilt. Stücke über der Achse (bzw. über g) sind grün, darunter orange.', 'Flächen zählen immer positiv: Beim Integral heben sich grüne und orange Stücke teilweise auf, bei der Fläche nicht.'],
  rot: ['Dreht man den Graphen von f um die x-Achse, entsteht ein Körper aus lauter dünnen Kreisscheiben. Jede Scheibe hat das Volumen π · f(x)² · Δx.', 'Erhöhe die Zahl der Scheiben: Die Summe der Scheibenvolumen nähert sich dem Volumen V = π ∫ f².']
};
// Beispiele: [Funktion, Anzeige, a, b]
const ITG_EX = [['x^2', 'x²', 0, 2], ['x^3', 'x³', 0, 2], ['x^2-4', 'x² − 4', -2, 2], ['-x^2+4', '−x² + 4', -2, 2], ['x^3-3*x', 'x³ − 3x', -2, 2], ['3*x^2-4*x+1', '3x² − 4x + 1', 0, 2], ['sqrt(x)', '√x', 0, 4], ['1/x', '1/x', 1, 3], ['sin(x)', 'sin(x)', 0, 3.1416], ['exp(x)', 'eˣ', 0, 2], ['x*exp(x)', 'x · eˣ', 0, 1]];
// Beispiele für f und g: [f, g, a, b]
const ITG_PAIRS = [['x^2', 'x+2', -1, 2], ['x^2', '2*x', 0, 2], ['x^3', 'x', -1, 1], ['-x^2+4', 'x^2-4', -2, 2], ['sin(x)', 'cos(x)', 0.7854, 3.927]];
const ITG_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const ITG_SHOW0 = { lower: true, upper: true, shade: true, tangent: true, fill: true, anti: true, family: false, card: true };

function itgDefaults() { return { view: 'sum', raw: 'x^2', rawG: 'x+2', mode: 'axis', a: 0, b: 2, n: 6, x: 1.5, rotN: 12, win: Object.assign({}, ITG_WIN0), show: Object.assign({}, ITG_SHOW0) }; }
const ITG = Object.assign(itgDefaults(), { F: null, G: null, ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0 });

function itgActive() { return typeof ENV !== 'undefined' && ENV.cur === 'int'; }

// ── Funktion setzen ──
function itgFiniteOn(F, a, b) { const f = F.f(0), lo = Math.min(a, b), hi = Math.max(a, b); return a !== b && Int.finiteOn(f, lo, hi); }
function itgFixRange() {
  const F = ITG.F; if (!F) return;
  if (itgFiniteOn(F, ITG.a, ITG.b)) return;
  const c = [[0, 2], [1, 3], [0, 1], [-1, 1], [1, 4], [0, 3.1416], [2, 5], [-2, 0]].find(([a, b]) => itgFiniteOn(F, a, b));
  if (c) { ITG.a = c[0]; ITG.b = c[1]; }
}
function itgSetFn(raw, keep, ab) {
  const F = Dif.makeFn(raw);
  ITG.F = F; ITG.cardKey = '';
  if (F) {
    ITG.raw = F.raw;
    if (!keep) {
      ITG.win = Object.assign({}, ITG_WIN0);
      if (ab) { ITG.a = ab[0]; ITG.b = ab[1]; }
      itgFixRange();
      ITG.x = Math.min(ITG.b, Math.max(ITG.a, ITG.a + (ITG.b - ITG.a) * 0.75));
    }
  }
  return !!F;
}
function itgSetG(raw) { const G = Dif.makeFn(raw); ITG.G = G; ITG.cardKey = ''; if (G) ITG.rawG = G.raw; return !!G; }
const itgFieldRaw = id => { const inp = $dif(id); return inp ? (inp.getAttribute('data-raw') || '') : ''; };
function itgSyncFields() {
  const f = $dif('itg-fn-input'), g = $dif('itg-g-input');
  if (f && f._mlSetFromRaw && f.getAttribute('data-raw') !== ITG.raw) f._mlSetFromRaw(ITG.raw);
  if (g && g._mlSetFromRaw && g.getAttribute('data-raw') !== ITG.rawG) g._mlSetFromRaw(ITG.rawG);
}
function itgApplyField() {
  const raw = itgFieldRaw('itg-fn-input').trim(), err = $dif('itg-err');
  if (!raw) { if (err) err.textContent = ''; return; }
  if (raw === ITG.raw && ITG.F) return;
  if (itgSetFn(raw, false)) { if (err) err.textContent = ''; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); }
  else if (err) err.textContent = 'Diesen Ausdruck kann ich nicht auswerten. Erlaubt ist eine Funktion von x.';
}
function itgApplyGField() {
  const raw = itgFieldRaw('itg-g-input').trim(), err = $dif('itg-err');
  if (!raw || (raw === ITG.rawG && ITG.G)) return;
  if (itgSetG(raw)) { if (err) err.textContent = ''; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); }
  else if (err) err.textContent = 'Diesen Ausdruck kann ich nicht auswerten. Erlaubt ist eine Funktion von x.';
}
// Math-Felder einrichten (wie diffQuotSetupField)
function itgSetupFields() {
  [['itg-fn-input', itgApplyField], ['itg-g-input', itgApplyGField]].forEach(([id, apply]) => {
    const inp = $dif(id); if (!inp || inp._itgSetup) return; inp._itgSetup = true;
    try {
      inp.mathVirtualKeyboardPolicy = 'manual';
      if (inp.shadowRoot) { const st = document.createElement('style'); st.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}'; inp.shadowRoot.appendChild(st); }
      inp._mlSetFromRaw = raw => { let latex = ''; try { latex = (raw && raw.trim()) ? rawToLatex(raw) : ''; } catch (ex) { latex = ''; } inp.setAttribute('data-raw', raw || ''); inp.value = latex; if (typeof _mlMoveCursorToEnd === 'function') _mlMoveCursorToEnd(inp); };
      if (typeof mlPrewarmFocus === 'function') mlPrewarmFocus(inp);
      inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(inp, -1); try { inp.select(); } catch (e) {} });
      inp.addEventListener('focusout', () => { inp.style.borderColor = ''; setTimeout(apply, 0); });
      inp.addEventListener('input', () => { let raw; try { raw = asciiMathToRaw(inp.getValue('ascii-math')); } catch (ex) { return; } inp.setAttribute('data-raw', raw); inp.style.borderColor = ''; });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
    } catch (e) { /* MathLive nicht verfügbar */ }
  });
  itgSyncFields();
}

// ── Rechenweg-Karte (teilt sich das Element #dif-card mit der Differentialrechnung) ──
function itgCardDoc() {
  const F = ITG.F; if (!F) return null;
  const lo = Math.min(ITG.a, ITG.b), hi = Math.max(ITG.a, ITG.b);
  try {
    switch (ITG.view) {
      case 'sum': return { t: 'Rechenweg: Ober- und Untersumme', d: Int.sumDoc(F, lo, hi) };
      case 'hs': return { t: 'Rechenweg: Integralfunktion', d: Int.hsDoc(F, ITG.a, ITG.x) };
      case 'rg': { const A = Int.antiDoc(F), D = Int.defDoc(F, lo, hi), d = Dif.DOC(); d.b = A.b.concat(D.b); return { t: 'Rechenweg: Stammfunktion und Integral', d }; }
      case 'ar': return { t: 'Rechenweg: Fläche', d: Int.areaDoc(F, ITG.mode === 'g' ? ITG.G : null, lo, hi) };
      case 'rot': return { t: 'Rechenweg: Rotationsvolumen', d: Int.rotDoc(F, lo, hi) };
    }
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
  return null;
}
function itgCardKey() { const v = ITG.view; return [v, ITG.raw, v === 'ar' && ITG.mode === 'g' ? ITG.rawG : '', v === 'ar' ? ITG.mode : '', v === 'rg' || v === 'sum' || v === 'ar' || v === 'rot' ? ITG.a + ',' + ITG.b : '', v === 'hs' ? ITG.a + ',' + ITG.x : ''].join('|'); }
function itgCardSoon() { clearTimeout(ITG.cardT); ITG.cardT = setTimeout(itgCardRender, 40); }
function itgCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = itgActive() && ITG.show.card && ITG.F;
  if (itgActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = itgCardKey(); if (key === ITG.cardKey) return;
  ITG.cardKey = key;
  const r = itgCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  // Tabelle steht schon im Bild: in der Karte nicht noch einmal (im LaTeX-Rechenweg bleibt sie)
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(ITG.view === 'ar' ? Object.assign(Object.create(Object.getPrototypeOf(r.d)), r.d, { b: r.d.b.filter(b => b.k !== 'tab') }) : r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">' + (r && r.err ? 'Für diese Funktion gibt es hier keinen Rechenweg.' : 'Für diese Ansicht gibt es keinen Rechenweg.') + '</div></div>';
  body.scrollTop = 0;
}

// ── Zustand sichern / laden ──
function itgCapture() { return difCopy({ view: ITG.view, raw: ITG.raw, rawG: ITG.rawG, mode: ITG.mode, a: ITG.a, b: ITG.b, n: ITG.n, x: ITG.x, rotN: ITG.rotN, win: ITG.win, show: ITG.show }); }
function itgApply(s) {
  const d = itgDefaults();
  if (s && typeof s === 'object') {
    if (ITG_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    if (typeof s.raw === 'string' && s.raw.length < 400) d.raw = s.raw;
    if (typeof s.rawG === 'string' && s.rawG.length < 400) d.rawG = s.rawG;
    if (s.mode === 'g' || s.mode === 'axis') d.mode = s.mode;
    ['a', 'b', 'x'].forEach(k => { const v = Number(s[k]); if (isFinite(v)) d[k] = v; });
    ['n', 'rotN'].forEach(k => { const v = Math.round(Number(s[k])); if (isFinite(v) && v >= 1 && v <= 5000) d[k] = v; });
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1); if (a !== null && b !== null && b > a) { d.win.x0 = a; d.win.x1 = b; }
      const c = ok(w.y0), e = ok(w.y1); if (c !== null && e !== null && e > c) { d.win.y0 = c; d.win.y1 = e; }
    }
    if (s.show && typeof s.show === 'object') Object.keys(ITG_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  ITG.anim = null; ITG.drag = null;
  ITG.view = d.view; ITG.a = d.a; ITG.b = d.b; ITG.n = d.n; ITG.x = d.x; ITG.rotN = d.rotN; ITG.win = d.win; ITG.show = d.show; ITG.mode = d.mode;
  itgSetFn(d.raw, true); if (!ITG.F) ITG.raw = d.raw;
  itgSetG(d.rawG); if (!ITG.G) ITG.rawG = d.rawG;
  itgSyncFields(); itgRefreshUI(); difRedraw(); itgCardSoon();
}

// ── Zeichnen ──
function itgCtx(W, H, exp) {
  return { view: ITG.view, F: ITG.F, G: ITG.G, mode: ITG.mode, win: ITG.win, a: ITG.a, b: ITG.b, n: ITG.n, x: ITG.x, rotN: ITG.rotN, show: ITG.show, exp: !!exp,
    fs: exp ? exp.fs : stSceneFs(W, H, 46) };
}
const itgDock = w => (ITG.show.card && ITG.F && w >= 760 ? stCardW(w, 0.36) : 0);
const itgDockH = (w, h) => (ITG.show.card && ITG.F && w < 760 ? Math.round(h * 0.5) : 0);
function itgLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = itgDock(w), dh = itgDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function itgDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  itgLayoutCard(w, h); itgCardRender();
  const W = w - itgDock(w), Hs = h - itgDockH(w, h);
  if (!ITG.F) {
    ctx.font = '600 ' + bf(15) + 'px -apple-system,system-ui,sans-serif'; ctx.fillStyle = P.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(statTr('Gib links eine Funktion f(x) ein und drücke «Übernehmen».'), W / 2, Hs / 2);
    ITG.S = null; return;
  }
  const S = stSoloBuild(itgBuildScene, W, Hs, itgCtx(W, Hs), 'itg|' + ITG.view + '|' + JSON.stringify(ITG.show), W < w || Hs < h);   // Karte offen: nur Bild (41_stat_draw.js)
  ITG.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function itgLatex() {
  const view = ITG.view, W = 760, H = view === 'hs' ? 620 : view === 'sum' ? 520 : 460;
  if (!ITG.F) return '% Zuerst eine Funktion eingeben.';
  const S = itgBuildScene(W, H, itgCtx(W, H, { fs: 11 }));
  return stSceneTex(S, W, H, (ITG_VIEWS.find(q => q[0] === view) || [0, ''])[1], 11);
}
function itgCardLatex() {
  const r = itgCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.';
  return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d);
}
function itgMakeLatex(which) { const ui = ITG.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? itgCardLatex() : itgLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function itgCopyLatex() {
  const ui = ITG.ui; if (!ui) return; if (!ui.ta.value) itgMakeLatex('pic');
  const done = () => { ui.msg.textContent = (typeof t === 'function' ? t('msg_copied') : 'Kopiert'); setTimeout(() => { ui.msg.textContent = ''; }, 2500); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ui.ta.value).then(done).catch(() => { ui.ta.select(); document.execCommand('copy'); done(); });
  else { ui.ta.select(); document.execCommand('copy'); done(); }
}

// ── Ausschnitt ──
function itgResolvedWin() {
  const m = ITG.S && ITG.S.maps.main; if (m) return Object.assign({}, m.win);
  const w = ITG.win; return { x0: w.x0 === null ? -2 : w.x0, x1: w.x1 === null ? 4 : w.x1, y0: w.y0 === null ? -5 : w.y0, y1: w.y1 === null ? 5 : w.y1 };
}
function itgZoom(f, cx, cy) {
  const w = itgResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return;
  const manualY = ITG.win.y0 !== null;
  ITG.win = { x0: nx0, x1: nx1, y0: manualY ? cy - (cy - w.y0) * f : null, y1: manualY ? cy + (w.y1 - cy) * f : null };
}
function itgResetWin() { ITG.win = Object.assign({}, ITG_WIN0); itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); }
function itgStep(div) { const w = itgResolvedWin(); return Stat.niceStep(w.x1 - w.x0, div); }

// ── Zahl n (logarithmischer Regler) ──
const itgNToS = n => difClamp(Math.log10(Math.max(1, n)) / 3, 0, 1);
const itgSToN = s => Math.max(1, Math.round(Math.pow(10, 3 * s)));

// ── Panel ──
function itgBuildUI() {
  if (ITG.ui || !$dif('itg-panel')) return;
  const ui = ITG.ui = {}, body = $dif('itg-body');
  ui.sel = $dif('itg-view');
  ITG_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { ITG.view = ui.sel.value; ITG.anim = null; ITG.cardKey = ''; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); });
  ui.desc = $dif('itg-desc');
  ui.ex = $dif('itg-ex');
  ui.ex.appendChild(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
  ITG_EX.forEach(([raw, nm], i) => { const o = difEl('option', null, nm); o.value = String(i); o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });
  ui.ex.addEventListener('change', () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const e = ITG_EX[+i];
    if (itgSetFn(e[0], false, [e[2], e[3]])) { itgSyncFields(); const er = $dif('itg-err'); if (er) er.textContent = ''; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); }
  });
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec');
  det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => itgMakeLatex('pic')); ui.br.addEventListener('click', () => itgMakeLatex('calc')); ui.bc.addEventListener('click', itgCopyLatex);
  const ap = $dif('itg-apply'); if (ap) ap.addEventListener('click', itgApplyField);
  const ag = $dif('itg-g-apply'); if (ag) ag.addEventListener('click', itgApplyGField);
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!itgActive()) return; ITG.show.card = false; itgRefreshUI(); difRedraw(); itgCardRender(); difCommit(); });
  itgRefreshUI();
}

function itgRefreshUI() {
  const ui = ITG.ui; if (!ui) return;
  const v = ITG.view, sh = ITG.show;
  ui.sel.value = v;
  const d = ITG_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[0]), Object.assign(difEl('div', null, d[1]), { style: 'margin-top:5px;' }));
  const grow = $dif('itg-g-row'); if (grow) grow.style.display = v === 'ar' && ITG.mode === 'g' ? '' : 'none';
  ui.params.replaceChildren();
  const P = ui.params;
  const redo = () => { itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); };
  const check = (label, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get();
    lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); row.appendChild(lb);
    inp.addEventListener('change', () => { set(inp.checked); ITG.cardKey = ''; redo(); });
    P.appendChild(row);
  };
  const select = (label, opts, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label', null, label), sel = difEl('select');
    opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
    sel.value = get(); sel.addEventListener('change', () => { set(sel.value); redo(); });
    row.append(lb, sel); P.appendChild(row);
  };
  const numRow = (label, get, set, o) => {
    o = o || {}; const row = difEl('div', 'settings-row'); row.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no');
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x)) { set(x); difRedraw(); itgCardSoon(); difCommit(); } inp.value = difFmtIn(get()); };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const nudge = s => difBtn(s > 0 ? '▶' : '◀', () => { const st = itgStep(25); set(Math.round((get() + s * st) / st * 1e6) / 1e6 * st + 0); inp.value = difFmtIn(get()); difRedraw(); itgCardSoon(); difCommit(); }, s > 0 ? 'Nach rechts' : 'Nach links');
    row.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(row); return inp;
  };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const limits = () => { ui.ainp = numRow('Untere Grenze a', () => ITG.a, x => { ITG.a = x; ITG.cardKey = ''; }); ui.binp = numRow('Obere Grenze b', () => ITG.b, x => { ITG.b = x; ITG.cardKey = ''; }); };

  if (v === 'sum') {
    group('Grenzen');
    limits();
    group('Anzahl Streifen n');
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const val = difEl('b', null, 'n = ' + ITG.n); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    top.append(difEl('label', null, 'Je weiter rechts, desto feiner die Streifen'), val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = 0; sl.max = 1; sl.step = 0.002; sl.value = itgNToS(ITG.n); sl.style.width = '100%';
    sl.addEventListener('input', () => { ITG.anim = null; ITG.n = itgSToN(parseFloat(sl.value)); val.textContent = 'n = ' + ITG.n; difRedraw(); });
    sl.addEventListener('change', () => { itgRefreshUI(); difCommit(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1);
    numRow('Genauer Wert n', () => ITG.n, x => { ITG.n = Math.max(1, Math.min(5000, Math.round(x))); }, {});
    const ab = difEl('div'); ab.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px;';
    ab.append(difBtn(ITG.anim ? '⏸ Pause' : '▶ n → ∞', itgAnimToggle), difBtn('n = 4', () => { ITG.anim = null; ITG.n = 4; redo(); }));
    P.appendChild(ab);
    group('Anzeige');
    check('Untersumme zeigen (grün)', () => sh.lower, x => { sh.lower = x; });
    check('Obersumme zeigen (blau)', () => sh.upper, x => { sh.upper = x; });
  } else if (v === 'hs') {
    group('Untere Grenze und Stelle');
    ui.ainp = numRow('Untere Grenze a', () => ITG.a, x => { ITG.a = x; ITG.cardKey = ''; });
    ui.xinp = numRow('Stelle x', () => ITG.x, x => { ITG.x = x; ITG.cardKey = ''; });
    const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;';
    ab.append(difBtn(ITG.anim ? '⏸ Pause' : '▶ x wandert nach rechts', itgAnimToggle)); P.appendChild(ab);
    group('Anzeige');
    check('Fläche von a bis x färben', () => sh.shade, x => { sh.shade = x; });
    check('Tangente an Fa zeigen (Steigung f(x))', () => sh.tangent, x => { sh.tangent = x; });
  } else if (v === 'rg') {
    group('Grenzen');
    limits();
    group('Anzeige');
    check('Fläche von a bis b färben', () => sh.fill, x => { sh.fill = x; });
    check('Stammfunktion F einzeichnen', () => sh.anti, x => { sh.anti = x; });
    check('Schar F + C zeigen (andere Konstanten)', () => sh.family, x => { sh.family = x; });
  } else if (v === 'ar') {
    select('Fläche zwischen f und', [['axis', 'der x-Achse'], ['g', 'einer zweiten Funktion g']], () => ITG.mode, x => { ITG.mode = x; ITG.cardKey = ''; });
    group('Grenzen');
    limits();
    const ab = difEl('div'); ab.style.cssText = 'display:grid;grid-template-columns:1fr;gap:5px;margin-top:6px;';
    ab.append(difBtn(ITG.mode === 'g' ? 'Grenzen auf die Schnittstellen setzen' : 'Grenzen auf die Nullstellen setzen', itgSnapToRoots));
    P.appendChild(ab);
    if (ITG.mode === 'g') {
      const ex = difEl('select'); ex.style.cssText = 'width:100%;margin-top:6px;';
      ex.appendChild(Object.assign(difEl('option', null, 'Beispiel für f und g …'), { value: '' }));
      ITG_PAIRS.forEach((p, i) => { const o = difEl('option', null, 'f = ' + p[0].replace(/\*/g, '·') + ',  g = ' + p[1].replace(/\*/g, '·')); o.value = String(i); o.setAttribute('translate', 'no'); ex.appendChild(o); });
      ex.addEventListener('change', () => { const i = ex.value; if (i === '') return; const p = ITG_PAIRS[+i]; itgSetFn(p[0], false, [p[2], p[3]]); itgSetG(p[1]); ITG.a = p[2]; ITG.b = p[3]; itgSyncFields(); redo(); });
      P.appendChild(ex);
    }
  } else if (v === 'rot') {
    group('Grenzen');
    limits();
    group('Anzahl Scheiben');
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const val = difEl('b', null, ITG.rotN); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    top.append(difEl('label', null, 'Scheiben'), val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = 1; sl.max = 60; sl.step = 1; sl.value = ITG.rotN; sl.style.width = '100%';
    sl.addEventListener('input', () => { ITG.rotN = parseInt(sl.value, 10); val.textContent = ITG.rotN; difRedraw(); });
    sl.addEventListener('change', () => { difCommit(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1);
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { itgZoom(0.7); redo(); }, 'Hineinzoomen'), difBtn('－', () => { itgZoom(1 / 0.7); redo(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', itgResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; });
}

// Grenzen auf die Nullstellen von f (bzw. Schnittstellen von f und g) setzen: äusserste im sichtbaren Bereich
function itgSnapToRoots() {
  const F = ITG.F; if (!F) return;
  const G = ITG.mode === 'g' ? ITG.G : null, f = F.f(0), g = G ? G.f(0) : () => 0, w = itgResolvedWin();
  const lo = Math.min(w.x0, ITG.a, ITG.b) - 1, hi = Math.max(w.x1, ITG.a, ITG.b) + 1;
  let r = []; try { r = Dif.scanRoots(x => f(x) - g(x), lo, hi, 3000); } catch (e) { r = []; }
  if (r.length >= 2) { ITG.a = Math.round(r[0] * 1e6) / 1e6; ITG.b = Math.round(r[r.length - 1] * 1e6) / 1e6; }
  else if (r.length === 1) { ITG.a = Math.round(r[0] * 1e6) / 1e6; }
  ITG.cardKey = ''; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit();
}

// ── Animation: n → ∞ bzw. x läuft nach rechts ──
function itgAnimToggle() {
  if (ITG.anim) { ITG.anim = null; itgRefreshUI(); difCommit(); return; }
  if (ITG.view === 'sum') { if (ITG.n >= 1000) ITG.n = 2; ITG.anim = { last: 0, f: ITG.n }; }
  else { const w = itgResolvedWin(); if (ITG.x >= w.x1 - 1e-6) ITG.x = ITG.a; ITG.anim = { last: 0 }; }
  itgRefreshUI(); requestAnimationFrame(itgAnimFrame);
}
function itgAnimFrame(ts) {
  const a = ITG.anim; if (!a) return;
  if (!itgActive()) { ITG.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (ITG.view === 'sum') {
    a.f = Math.max(a.f + dt * 2, a.f * Math.pow(10, dt * 0.45));
    if (a.f >= 1000) { ITG.n = 1000; ITG.anim = null; itgRefreshUI(); difRedraw(); difCommit(); return; }
    ITG.n = Math.round(a.f);
  } else {
    const w = itgResolvedWin(), v = (w.x1 - w.x0) * 0.2 * dt;
    ITG.x += v;
    if (ITG.x >= w.x1) { ITG.x = w.x1; ITG.anim = null; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); return; }
    if (ITG.ui && ITG.ui.xinp) ITG.ui.xinp.value = difFmtIn(ITG.x);
    itgCardSoon();
  }
  difRedraw();
  const sl = ITG.ui && ITG.ui.params.querySelector('input[type=range]'); if (sl && ITG.view === 'sum') sl.value = itgNToS(ITG.n);
  requestAnimationFrame(itgAnimFrame);
}

// ── Maus und Berührung auf dem Canvas ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = ITG.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + 4 && d < bd) { bd = d; best = q; } }); return best; };
  const setVar = (id, x, shift) => {
    const m = ITG.S && ITG.S.maps.main; if (!m) return;
    const st = Stat.niceStep(m.win.x1 - m.win.x0, 25);
    let v = Math.round(difSnap(x, st, shift) * 1e6) / 1e6 + 0;
    if (ITG.view === 'ar' && !shift && (id === 'a' || id === 'b')) {            // an Schnittstellen einrasten
      const G = ITG.mode === 'g' ? ITG.G : null; let r = [];
      try { r = Dif.scanRoots(t => ITG.F.f(0)(t) - (G ? G.f(0)(t) : 0), m.win.x0 - 1, m.win.x1 + 1, 1500); } catch (e) { r = []; }
      const px = (m.R - m.L) / (m.win.x1 - m.win.x0); r.forEach(q => { if (Math.abs(q - x) * px < 9) v = Math.round(q * 1e6) / 1e6; });
    }
    ITG[id] = v; ITG.cardKey = '';
  };
  const syncInputs = () => { const u = ITG.ui; if (!u) return; if (u.ainp) u.ainp.value = difFmtIn(ITG.a); if (u.binp) u.binp.value = difFmtIn(ITG.b); if (u.xinp) u.xinp.value = difFmtIn(ITG.x); };
  const down = e => {
    if (!itgActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = ITG.S; if (!S || !ITG.F) return; const p = pos(e); if (ITG.anim) { ITG.anim = null; itgRefreshUI(); }
    const q = near(p);
    if (q) ITG.drag = { type: q.id };
    else if (ITG.view === 'hs' && (inMap(S.maps.main, p) || inMap(S.maps.sub, p)) && !e.altKey) { ITG.drag = { type: 'x' }; setVar('x', S.maps.main.IX(p.x), e.shiftKey); difRedraw(); itgCardSoon(); syncInputs(); }
    else if (inMap(S.maps.main, p) || inMap(S.maps.sub, p)) { const m = inMap(S.maps.main, p) ? S.maps.main : S.maps.sub; ITG.drag = { type: 'pan', px: p.x, py: p.y, w: itgResolvedWin(), sub: m === S.maps.sub }; }
    if (ITG.drag) cv.style.cursor = ITG.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!itgActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = ITG.S; if (!S) return; const p = pos(e), d = ITG.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) || inMap(S.maps.sub, p) ? 'crosshair' : ''); return; }
    const m = S.maps.main;
    if (d.type === 'a' || d.type === 'b' || d.type === 'x') setVar(d.type, m.IX(p.x), e.shiftKey);
    else if (d.type === 'pan') {
      const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0), keepY = ITG.win.y0 === null;
      ITG.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: keepY || d.sub ? null : w.y0 + dy, y1: keepY || d.sub ? null : w.y1 + dy };
    }
    difRedraw(); if (d.type !== 'pan') { itgCardSoon(); syncInputs(); }
  };
  const up = e => {
    if (!itgActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !ITG.drag) return;
    if (ITG.drag) { ITG.drag = null; cv.style.cursor = ''; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!itgActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = ITG.S; if (!S) return; const p = pos(e), m = S.maps.main, sub = S.maps.sub; if (!inMap(m, p) && !inMap(sub, p)) return;
    const f = stWheelF(e), mm = inMap(m, p) ? m : sub;
    itgZoom(f, mm.IX(p.x), inMap(m, p) ? m.IY(p.y) : undefined); difRedraw();
    clearTimeout(ITG._wt); ITG._wt = setTimeout(() => { itgRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!itgActive()) return; e.stopImmediatePropagation(); e.preventDefault(); itgResetWin(); };
  const stop = e => { if (itgActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { ITG.cardKey = ''; if (itgActive()) { itgCardRender(); itgRefreshUI(); difRedraw(); } }, ms)); });
itgBuildUI();
document.addEventListener('DOMContentLoaded', () => setTimeout(itgSetupFields, 150));
if (typeof module !== 'undefined' && module.exports) module.exports = {};
