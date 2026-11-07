// ═══════════════════════════════════════════════════════════════════
// 62_dif_ui.js — Differentialrechnung: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 60_dif.js, 60b_dif_rules.js, 60c_dif_kd.js (Dif). Bilder: 61_dif_draw.js (Szenen).
// Hier: Zustand DIF (Ansicht, Funktion, Stelle x0, Schrittweite h, Ausschnitt, Optionen), Panel
// (#dif-panel mit dem einen f(x)-Feld #diffquot-fn-input), Karte mit dem Rechenweg (#dif-card),
// Ziehen/Zoomen auf dem Canvas, Anbindung an Rückgängig/Speichern (difCapture/difApply) und
// TikZ-Export. Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «diff»).
// ═══════════════════════════════════════════════════════════════════

const DIF_VIEWS = [['tan', 'Sekante → Tangente'], ['gr', 'Graphisches Ableiten'], ['rg', 'Ableiten mit Regeln'], ['kd', 'Kurvendiskussion']];
const DIF_DESC = {
  tan: ['Der Punkt P liegt fest auf dem Graphen, der Punkt Q wandert. Die Sekante durch P und Q hat die Steigung ms = Δy / h.', 'Ziehe Q (oder benutze den Regler) gegen P: Die Sekante wird zur Tangente, und ms nähert sich der Ableitung f′(x₀). Ziehe P, um die Stelle zu ändern.'],
  gr: ['Oben der Graph von f, unten der Graph der Ableitung f′. Ziehe den Punkt: Die Höhe des unteren Punktes ist die Steigung der Tangente oben.', 'Wo f steigt, ist f′ positiv (grün), wo f fällt, ist f′ negativ (orange). Bei waagrechter Tangente ist f′ = 0.'],
  rg: ['Die Ableitung wird Schritt für Schritt mit den Ableitungsregeln berechnet. Danach folgen Tangente und Normale im Punkt P.', 'Ziehe P entlang der Kurve, um die Stelle x₀ zu ändern.'],
  kd: ['Alle Eigenschaften des Graphen: Symmetrie, Nullstellen, Extrempunkte, Wendepunkte, Monotonie und Krümmung.', 'Die Rechnung steht Schritt für Schritt im Rechenweg, die Punkte sind im Bild beschriftet.']
};
const DIF_EX = [['x^2', 'x²'], ['x^3-3*x', 'x³ − 3x'], ['x^3-6*x^2+9*x', 'x³ − 6x² + 9x'], ['x^4/4-2*x^2', 'x⁴/4 − 2x²'], ['sin(x)', 'sin(x)'], ['x*exp(x)', 'x · eˣ'], ['1/x', '1/x'], ['sqrt(x)', '√x'], ['abs(x)', '|x| (Knick)'], ['x^2*sin(x)', 'x² · sin(x)']];
const DIF_WIN0 = { x0: -5, x1: 5, y0: null, y1: null };
const DIF_SHOW0 = { tangent: true, triangle: true, color: 'mono', crit: false, hidefp: false, normal: false, deriv: false, d1: false, d2: false, card: true, hGen: false };

// Seite von Q (h darf 0 sein: dann merkt sich DIF.side, von wo Q kam)
function difSg() { return DIF.h < 0 ? -1 : (DIF.h > 0 ? 1 : (DIF.side < 0 ? -1 : 1)); }
function difSetH(h) { h = Math.round(h * 1e6) / 1e6 + 0; if (h !== 0) DIF.side = h < 0 ? -1 : 1; DIF.h = h; }
function difDefaults() { return { view: 'tan', raw: 'x^2', x0: 1, h: 1, win: Object.assign({}, DIF_WIN0), show: Object.assign({}, DIF_SHOW0), trace: [] }; }
const DIF = Object.assign(difDefaults(), { F: null, K: null, Kkey: '', ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0, cardTitle: '' });

function difActive() { return typeof ENV !== 'undefined' && ENV.cur === 'diff'; }
const $dif = id => document.getElementById(id);
const difEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const difCopy = o => JSON.parse(JSON.stringify(o));
const difClamp = (v, a, b) => Math.max(a, Math.min(b, v));
function difRedraw() { if (typeof scheduleDraw === 'function') scheduleDraw(); }
function difCommit() { if (typeof pushHistory === 'function') pushHistory(); }

// ── Funktion setzen ──
function difParseNum(s) {
  s = String(s).trim().replace(/,/g, '.'); if (!s) return NaN;
  try { const v = SV.evalNum(miParseRaw(s), 0); return isFinite(v) ? v : NaN; } catch (e) { return NaN; }
}
function difSetFn(raw, keep) {
  const F = Dif.makeFn(raw);
  DIF.F = F; DIF.K = null; DIF.Kkey = ''; DIF.cardKey = '';
  if (F) {
    DIF.raw = F.raw;
    if (!keep) {
      DIF.win = Object.assign({}, DIF_WIN0); DIF.trace = [];
      const f = F.f(0), d = F.f(1);
      const c = [1, 2, 0.5, -1, 3, 0.1, -2, 4, 0.7].find(x => isFinite(f(x)) && isFinite(d(x))) ;
      DIF.x0 = c !== undefined ? c : 1;
      if (!isFinite(DIF.h)) DIF.h = 1;
    }
  }
  return !!F;
}
function difFieldRaw() { const inp = $dif('diffquot-fn-input'); return inp ? (inp.getAttribute('data-raw') || '') : ''; }
function difSyncField() { const inp = $dif('diffquot-fn-input'); if (inp && inp._mlSetFromRaw && inp.getAttribute('data-raw') !== DIF.raw) inp._mlSetFromRaw(DIF.raw); }
function difApplyField() {
  const raw = difFieldRaw().trim(), err = $dif('dif-err');
  if (!raw) { if (err) err.textContent = ''; return; }
  if (raw === DIF.raw && DIF.F) return;
  if (difSetFn(raw, false)) { if (err) err.textContent = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); }
  else if (err) err.textContent = 'Diesen Ausdruck kann ich nicht auswerten. Erlaubt ist eine Funktion von x.';
}

// ── Rechenwege und Kurvendiskussion (zwischengespeichert) ──
function difWinX() { return [DIF.win.x0, DIF.win.x1]; }
function difKd() {
  const F = DIF.F; if (!F) return null;
  const key = DIF.raw + '|' + (F.P ? '' : DIF.win.x0 + ',' + DIF.win.x1);
  if (DIF.Kkey !== key) { DIF.Kkey = key; try { DIF.K = Dif.kd(F, difWinX()); } catch (e) { DIF.K = null; } }
  return DIF.K;
}
function difCardDoc() {
  const F = DIF.F; if (!F) return null;
  try {
    switch (DIF.view) {
      case 'tan': return { t: 'Rechenweg: h-Methode', d: Dif.hMethodDoc(F, DIF.show.hGen ? null : DIF.x0) };
      case 'gr': { const K = difKd(); return K ? { t: 'Rechenweg: Vorzeichen von f′', d: Dif.monoDoc(K) } : null; }
      case 'rg': {
        if (!DIF._rules || DIF._rulesRaw !== DIF.raw) { DIF._rules = Dif.rulesDoc(F); DIF._rulesRaw = DIF.raw; }
        const t = Dif.tangentDoc(F, DIF.x0), d = Dif.DOC(); d.b = DIF._rules.b.concat(t.b);
        return { t: 'Rechenweg: Ableiten, Tangente, Normale', d };
      }
      case 'kd': { const K = difKd(); return K ? { t: 'Rechenweg: Kurvendiskussion', d: Dif.kdDoc(K) } : null; }
    }
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
  return null;
}
function difCardKey() { return [DIF.view, DIF.raw, DIF.view === 'tan' || DIF.view === 'rg' ? DIF.x0 : '', DIF.view === 'tan' ? DIF.show.hGen : '', DIF.F && !DIF.F.P && (DIF.view === 'gr' || DIF.view === 'kd') ? DIF.win.x0 + ',' + DIF.win.x1 : ''].join('|'); }
function difCardSoon() { clearTimeout(DIF.cardT); DIF.cardT = setTimeout(difCardRender, 40); }
function difCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = difActive() && DIF.show.card && DIF.F;
  card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = difCardKey(); if (key === DIF.cardKey) return;
  DIF.cardKey = key;
  const r = difCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">' + (r && r.err ? 'Für diese Funktion gibt es hier keinen Rechenweg.' : 'Für diese Ansicht gibt es keinen Rechenweg.') + '</div></div>';
  body.scrollTop = 0;
}

// ── Zustand sichern / laden ──
function difCapture() {
  return difCopy({ view: DIF.view, raw: DIF.raw, x0: DIF.x0, h: DIF.h, side: difSg(), win: DIF.win, show: DIF.show, trace: DIF.trace.slice(-300) });
}
function difApply(s) {
  const d = difDefaults();
  if (s && typeof s === 'object') {
    if (DIF_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    if (typeof s.raw === 'string' && s.raw.length < 400) d.raw = s.raw;
    ['x0', 'h'].forEach(k => { const v = Number(s[k]); if (isFinite(v)) d[k] = v; });
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1);
      if (a !== null && b !== null && b > a) { d.win.x0 = a; d.win.x1 = b; }
      const c = ok(w.y0), e = ok(w.y1); if (c !== null && e !== null && e > c) { d.win.y0 = c; d.win.y1 = e; }
    }
    if (s.show && typeof s.show === 'object') {
      Object.keys(DIF_SHOW0).forEach(k => { if (k in s.show) d.show[k] = typeof DIF_SHOW0[k] === 'boolean' ? !!s.show[k] : (['none', 'mono', 'curv'].indexOf(s.show[k]) >= 0 ? s.show[k] : DIF_SHOW0[k]); });
    }
    if (Array.isArray(s.trace)) d.trace = s.trace.map(Number).filter(isFinite).slice(-300);
  }
  DIF.anim = null; DIF.drag = null;
  DIF.side = s && Number(s.side) < 0 ? -1 : 1;
  DIF.view = d.view; DIF.x0 = d.x0; DIF.h = d.h; DIF.win = d.win; DIF.show = d.show; DIF.trace = d.trace;
  difSetFn(d.raw, true);
  if (!DIF.F) { DIF.raw = d.raw; }
  difSyncField(); difRefreshUI(); difRedraw(); difCardSoon();
}

// ── Zeichnen ──
function difCtx(W, H, exp) {
  const v = DIF.view;
  return { view: v, F: DIF.F, win: DIF.win, x0: DIF.x0, h: DIF.h, show: DIF.show, trace: exp ? [] : DIF.trace, K: (v === 'kd' || (v === 'gr' && DIF.show.crit)) ? difKd() : null, exp: !!exp,
    fs: exp ? exp.fs : stSceneFs(W, H, 46) };
}
function difDock(w) { return DIF.show.card && DIF.F && w >= 760 ? stCardW(w, 0.36) : 0; }
// schmale Fenster (Handy hochkant): Karte als untere Hälfte, das Bild liegt darüber
function difDockH(w, h) { return DIF.show.card && DIF.F && w < 760 ? Math.round(h * 0.5) : 0; }
function difLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = difDock(w), dh = difDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function difDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  difLayoutCard(w, h); difCardRender();
  const W = w - difDock(w), Hs = h - difDockH(w, h);
  if (!DIF.F) {
    ctx.font = '600 ' + bf(15) + 'px -apple-system,system-ui,sans-serif'; ctx.fillStyle = P.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(statTr('Gib links eine Funktion f(x) ein und drücke «Übernehmen».'), W / 2, Hs / 2);
    DIF.S = null; return;
  }
  const S = stSoloBuild(difBuildScene, W, Hs, difCtx(W, Hs), 'dif|' + DIF.view + '|' + JSON.stringify(DIF.show), W < w || Hs < h);   // Karte offen: nur Bild (41_stat_draw.js)
  DIF.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function difLatex() {
  const view = DIF.view, W = 760, H = view === 'gr' ? 620 : view === 'tan' ? 520 : 460;
  if (!DIF.F) return '% Zuerst eine Funktion eingeben.';
  const S = difBuildScene(W, H, difCtx(W, H, { fs: 11 }));
  return stSceneTex(S, W, H, (DIF_VIEWS.find(q => q[0] === view) || [0, ''])[1], 11);
}
function difCardLatex() {
  const r = difCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.';
  return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d);
}
function difMakeLatex(which) { const ui = DIF.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? difCardLatex() : difLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function difCopyLatex() {
  const ui = DIF.ui; if (!ui) return; if (!ui.ta.value) difMakeLatex('pic');
  const done = () => { ui.msg.textContent = (typeof t === 'function' ? t('msg_copied') : 'Kopiert'); setTimeout(() => { ui.msg.textContent = ''; }, 2500); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ui.ta.value).then(done).catch(() => { ui.ta.select(); document.execCommand('copy'); done(); });
  else { ui.ta.select(); document.execCommand('copy'); done(); }
}

// ── Ausschnitt ──
function difResolvedWin() { const m = DIF.S && DIF.S.maps.main; return m ? Object.assign({}, m.win) : Object.assign({}, DIF.win, { y0: DIF.win.y0 === null ? -5 : DIF.win.y0, y1: DIF.win.y1 === null ? 5 : DIF.win.y1 }); }
function difZoom(f, cx, cy) {
  const w = difResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return;
  const manualY = DIF.view !== 'gr' || DIF.win.y0 !== null;
  DIF.win = { x0: nx0, x1: nx1, y0: manualY ? cy - (cy - w.y0) * f : null, y1: manualY ? cy + (w.y1 - cy) * f : null };
  DIF.Kkey = '';
}
function difResetWin() { DIF.win = Object.assign({}, DIF_WIN0); DIF.Kkey = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); }

// ── Panel ──
function difSnap(v, step, shift) { return shift ? v : Math.round(v / step) * step; }
function difStepFor(div) { const w = difResolvedWin(); return Stat.niceStep(w.x1 - w.x0, div); }
function difFmtIn(v) { return Dif.fmt(v, 4); }

function difBuildUI() {
  if (DIF.ui || !$dif('dif-panel')) return;
  const ui = DIF.ui = {}, body = $dif('dif-body');
  ui.sel = $dif('dif-view');
  DIF_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { DIF.view = ui.sel.value; DIF.anim = null; DIF.cardKey = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); });
  ui.desc = $dif('dif-desc');
  ui.ex = $dif('dif-ex');
  ui.ex.appendChild(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
  DIF_EX.forEach(([raw, nm]) => { const o = difEl('option', null, nm); o.value = raw; o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });
  ui.ex.addEventListener('change', () => { const raw = ui.ex.value; ui.ex.value = ''; if (!raw) return; if (difSetFn(raw, false)) { difSyncField(); const er = $dif('dif-err'); if (er) er.textContent = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); } });
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec');
  det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => difMakeLatex('pic')); ui.br.addEventListener('click', () => difMakeLatex('calc')); ui.bc.addEventListener('click', difCopyLatex);
  const ap = $dif('dif-apply'); if (ap) ap.addEventListener('click', difApplyField);
  const inp = $dif('diffquot-fn-input');
  if (inp) { inp.addEventListener('focusout', () => setTimeout(difApplyField, 0)); inp.addEventListener('focusin', () => { try { inp.select(); } catch (e) {} }); }
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { DIF.show.card = false; difRefreshUI(); difRedraw(); difCardRender(); difCommit(); });
  difSyncField(); difRefreshUI();
}
const difBtn = (txt, fn, title) => { const b = difEl('button', null, txt); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', fn); return b; };

function difRefreshUI() {
  const ui = DIF.ui; if (!ui) return;
  const v = DIF.view, sh = DIF.show;
  ui.sel.value = v;
  const d = DIF_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[0]), Object.assign(difEl('div', null, d[1]), { style: 'margin-top:5px;' }));
  ui.params.replaceChildren();
  const P = ui.params;
  const check = (label, get, set, after) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get();
    lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); row.appendChild(lb);
    inp.addEventListener('change', () => { set(inp.checked); if (after) after(); difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); });
    P.appendChild(row);
  };
  const select = (label, opts, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label', null, label), sel = difEl('select');
    opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
    sel.value = get(); sel.addEventListener('change', () => { set(sel.value); difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); });
    row.append(lb, sel); P.appendChild(row);
  };
  const numRow = (label, get, set, o) => {
    o = o || {}; const row = difEl('div', 'settings-row'); row.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no');
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x) && !(o.nonzero && x === 0)) { set(x); difRedraw(); difCardSoon(); difCommit(); } inp.value = difFmtIn(get()); };
    inp.addEventListener('change', apply); inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
    const nudge = (s) => difBtn(s > 0 ? '▶' : '◀', () => { const st = o.step || difStepFor(25); set(Math.round((get() + s * st) / st * 1e6) / 1e6 * st); inp.value = difFmtIn(get()); difRedraw(); difCardSoon(); difCommit(); }, s > 0 ? 'Nach rechts' : 'Nach links');
    row.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(row); ui.x0inp = inp;
  };
  const x0row = () => numRow('Stelle x₀', () => DIF.x0, x => { DIF.x0 = x; }, {});
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };

  if (v === 'tan') {
    x0row();
    group('Abstand h von P nach Q');
    // Regler für |h| (logarithmisch) und Seite
    const mag = Math.abs(DIF.h), s = mag === 0 ? 1 : difClamp(Math.log10(3 / Math.max(mag, 1e-4)) / 4, 0, 0.99);
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const val = difEl('b', null, 'h = ' + difFmtIn(DIF.h)); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    top.append(difEl('label', null, 'Je weiter rechts, desto näher bei P (ganz rechts: h = 0)'), val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = 0; sl.max = 1; sl.step = 0.002; sl.value = s; sl.style.width = '100%';
    sl.addEventListener('input', () => { DIF.anim = null; const sg = difSg(), v = parseFloat(sl.value), m = v >= 0.995 ? 0 : 3 * Math.pow(10, -4 * v); difSetH(sg * m); val.textContent = 'h = ' + difFmtIn(DIF.h); difRedraw(); });
    sl.addEventListener('change', () => { difRefreshUI(); difCommit(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1);
    select('Q liegt', [['r', 'rechts von P (h > 0)'], ['l', 'links von P (h < 0)']], () => (DIF.h < 0 ? 'l' : 'r'), x => { const sg = x === 'l' ? -1 : 1; DIF.side = sg; DIF.h = DIF.h === 0 ? 0 : sg * Math.abs(DIF.h); });
    numRow('Genauer Wert h', () => DIF.h, x => { difSetH(x); }, { step: 0.1 });
    const ab = difEl('div'); ab.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px;';
    ab.append(difBtn(DIF.anim ? '⏸ Pause' : '▶ h → 0', difAnimToggle), difBtn('h = 1', () => { DIF.anim = null; DIF.h = difSg(); difRefreshUI(); difRedraw(); difCommit(); }));
    P.appendChild(ab);
    group('Anzeige');
    check('Tangente zeigen', () => sh.tangent, x => { sh.tangent = x; });
    check('Steigungsdreieck zeigen', () => sh.triangle, x => { sh.triangle = x; });
    check('Rechenweg für beliebiges x (Ableitungsfunktion)', () => sh.hGen, x => { sh.hGen = x; DIF.cardKey = ''; });
  } else if (v === 'gr') {
    x0row();
    group('Anzeige');
    select('Färbung von f', [['mono', 'Steigen und Fallen'], ['none', 'keine']], () => (sh.color === 'none' ? 'none' : 'mono'), x => { sh.color = x; });
    check('Tangente zeigen', () => sh.tangent, x => { sh.tangent = x; });
    check('Stellen mit f′ = 0 markieren', () => sh.crit, x => { sh.crit = x; });
    check('f′ verstecken (selbst skizzieren)', () => sh.hidefp, x => { sh.hidefp = x; DIF.trace = []; });
    if (sh.hidefp) { const b = difEl('div'); b.style.marginTop = '6px'; b.appendChild(difBtn('Spur löschen', () => { DIF.trace = []; difRedraw(); difCommit(); })); P.appendChild(b); }
  } else if (v === 'rg') {
    x0row();
    group('Anzeige');
    check('Normale zeigen', () => sh.normal, x => { sh.normal = x; });
    check('Ableitungsfunktion f′ einzeichnen', () => sh.deriv, x => { sh.deriv = x; });
  } else if (v === 'kd') {
    group('Anzeige');
    select('Färbung von f', [['none', 'keine'], ['mono', 'Steigen und Fallen'], ['curv', 'Krümmung']], () => sh.color || 'none', x => { sh.color = x; });
    check('f′ einzeichnen', () => sh.d1, x => { sh.d1 = x; });
    check('f″ einzeichnen', () => sh.d2, x => { sh.d2 = x; });
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { difZoom(0.7); difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); }, 'Hineinzoomen'), difBtn('－', () => { difZoom(1 / 0.7); difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', difResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; DIF.cardKey = ''; });
}

// ── h → 0 (Animation) ──
function difAnimToggle() {
  if (DIF.anim) { DIF.anim = null; difRefreshUI(); difCommit(); return; }
  const sg = difSg(); if (Math.abs(DIF.h) <= 0.0015) DIF.h = sg * 3;
  DIF.anim = { last: 0 }; difRefreshUI(); requestAnimationFrame(difAnimFrame);
}
function difAnimFrame(ts) {
  const a = DIF.anim; if (!a) return;
  if (!difActive()) { DIF.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  const sg = difSg(); let m = Math.abs(DIF.h) * Math.pow(10, -dt * 0.55);
  if (m <= 0.001) { DIF.anim = null; DIF.side = sg; DIF.h = 0; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); return; }
  DIF.h = sg * m; difRedraw();
  const sl = DIF.ui && DIF.ui.params.querySelector('input[type=range]'); if (sl) sl.value = difClamp(Math.log10(3 / m) / 4, 0, 1);
  requestAnimationFrame(difAnimFrame);
}

// ── Maus und Berührung auf dem Canvas ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = DIF.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + 4 && d < bd) { bd = d; best = q; } }); return best; };
  const setX0 = (x, shift) => {
    const m = DIF.S && DIF.S.maps.main; if (!m) return;
    const st = Stat.niceStep(m.win.x1 - m.win.x0, 25);
    DIF.x0 = Math.round(difSnap(x, st, shift) * 1e6) / 1e6 + 0;
    if (DIF.view === 'gr' && DIF.show.hidefp && DIF.F) { const tr = DIF.trace, last = tr[tr.length - 1]; if (last === undefined || Math.abs(last - DIF.x0) > st * 0.2) { tr.push(DIF.x0); if (tr.length > 300) tr.shift(); } }
  };
  const down = e => {
    if (!difActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = DIF.S; if (!S || !DIF.F) return; const p = pos(e); if (DIF.anim) { DIF.anim = null; difRefreshUI(); }
    const q = near(p);
    if (q && DIF.view === 'tan') { DIF.drag = { type: q.id }; }
    else if (q) { DIF.drag = { type: 'x0' }; }
    else if ((DIF.view === 'gr' || DIF.view === 'rg') && (inMap(S.maps.main, p) || (DIF.view === 'gr' && inMap(S.maps.sub, p))) && !e.altKey) {
      const m = inMap(S.maps.main, p) ? S.maps.main : S.maps.sub; DIF.drag = { type: 'x0' }; setX0(m.IX(p.x), e.shiftKey); difRedraw(); difCardSoon();
    } else if (inMap(S.maps.main, p) || inMap(S.maps.sub, p)) {
      const m = inMap(S.maps.main, p) ? S.maps.main : S.maps.sub; DIF.drag = { type: 'pan', sub: m === S.maps.sub, px: p.x, py: p.y, w: difResolvedWin() };
    }
    if (DIF.drag) cv.style.cursor = DIF.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!difActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = DIF.S; if (!S) return; const p = pos(e), d = DIF.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) || inMap(S.maps.sub, p) ? 'crosshair' : ''); return; }
    const m = S.maps.main, shift = e.shiftKey;
    if (d.type === 'P' || d.type === 'x0') { setX0(m.IX(p.x), shift); }
    else if (d.type === 'Q') {
      const st = Stat.niceStep(m.win.x1 - m.win.x0, 100); let h = difSnap(m.IX(p.x) - DIF.x0, st, shift); if (Math.abs(h) < st * 0.02) h = 0; difSetH(h);
    } else if (d.type === 'pan') {
      const w = d.w, mm = d.sub ? S.maps.sub : m, dx = (p.x - d.px) / (mm.R - mm.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0);
      const keepY = DIF.view === 'gr' && DIF.win.y0 === null;
      DIF.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: keepY || d.sub ? null : w.y0 + dy, y1: keepY || d.sub ? null : w.y1 + dy }; DIF.Kkey = '';
    }
    difRedraw(); if (d.type !== 'pan') difCardSoon(); if (d.type === 'x0' || d.type === 'P') { const i = DIF.ui && DIF.ui.x0inp; if (i) i.value = difFmtIn(DIF.x0); }
  };
  const up = e => {
    if (!difActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !DIF.drag) return;
    if (DIF.drag) { DIF.drag = null; cv.style.cursor = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!difActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = DIF.S; if (!S) return; const p = pos(e), m = S.maps.main, sub = S.maps.sub; if (!inMap(m, p) && !inMap(sub, p)) return;
    const f = stWheelF(e), mm = inMap(m, p) ? m : sub;
    difZoom(f, mm.IX(p.x), inMap(m, p) ? m.IY(p.y) : undefined); difRedraw(); difCardSoon();
    clearTimeout(DIF._wt); DIF._wt = setTimeout(() => { difRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!difActive()) return; e.stopImmediatePropagation(); e.preventDefault(); difResetWin(); };
  const stop = e => { if (difActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { DIF.cardKey = ''; if (difActive()) { difCardRender(); difRefreshUI(); difRedraw(); } }, ms)); });
difBuildUI();
document.addEventListener('DOMContentLoaded', () => setTimeout(difSyncField, 150));
