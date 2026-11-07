// ═══════════════════════════════════════════════════════════════════
// 34_alg_ui.js — Algebra: Panel, Zeichnung, Speichern, LaTeX (TikZ)
//
// Rechenkern und Beschreibung der Bilder: 33_alg_core.js (AlgCore).
// Hier: Zustand ALG, Panel (#alg-panel), Zeichnen auf dem Canvas, Anbindung an
// Rückgängig/Speichern (algCapture/algApply), Export (JPEG, TikZ).
// Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «alg»).
// ═══════════════════════════════════════════════════════════════════

const ALG_MODES = [['expand', 'Ausmultiplizieren'], ['factor', 'Faktorisieren'], ['complete', 'Quadratische Ergänzung'], ['binom', 'Binomischer Lehrsatz'], ['pow', 'Potenzen und Wurzeln'], ['log', 'Logarithmen'], ['frac', 'Bruchterme'], ['eq', 'Gleichungen'], ['sys', 'Gleichungssysteme']];
const ALG_MODE_SHORT = { expand: 'Ausmultiplizieren', factor: 'Faktorisieren', complete: 'Quadr. Ergänzung', binom: '(a+b)ⁿ', pow: 'Potenzen, Wurzeln', log: 'Logarithmen', frac: 'Bruchterme', eq: 'Gleichungen', sys: 'Gleichungssysteme' };
const ALG_MORE_MODES = ['pow', 'root', 'log', 'frac', 'eq', 'sys'];   // Darstellungen aus 35_alg_more.js
const ALG_HINTS = {
  pow: 'Potenzen mit ^ schreiben, z. B. (a^2·b)^3 / (a·b^2), 2^3·2^4 oder x^-2. Auch Wurzeln und gebrochene Hochzahlen: sqrt(12), root(3, x), 8^(2/3), x^(3/2).',
  eq: 'Gleichungen mit = schreiben, z. B. 3x+2 = x+8, x^2-5x+6 = 0, 1/x + 1/(x+1) = 1, √(x+2) = x oder 2^x = 20.',
  log: 'Logarithmen mit log_2(8), log(100) oder ln(x). Auch Gleichungen wie 2^x = 20 oder log_2(x+1) = 3.',
  sys: 'Eine Gleichung pro Zeile, z. B. 2x+3y=7 und x-y=1. Auch drei Gleichungen mit x, y und z sowie Brüche wie x/2+y/3=1.',
  frac: 'Bruchterme mit / schreiben, z. B. (x^2-4)/(x+2) oder 1/x + 1/(x+1). Auch reine Zahlen wie 12/18.'
};
const ALG_HUES = ['#378ADD', '#2fa36b', '#f08a24', '#8a5cd0', '#d9486b', '#13a5a5'];
const ALG_DEF_VALS = [2, 1.2, 1, 2.5, 1.4, 1.8];
const ALG = { text: '', mode: 'expand', vals: {}, opt: { tiles: false, style: 'area', explode: 0, method: 'add', card: true }, res: null, ui: null, cardKey: '' };

function algActive() { return typeof ENV !== 'undefined' && ENV.cur === 'alg'; }
const $alg = id => document.getElementById(id);
const algEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const algFmt = v => String(Math.round(v * 100) / 100);

// ── Zustand ──────────────────────────────────────────────────────────
function algCapture() {
  return JSON.parse(JSON.stringify({ text: ALG.text, mode: ALG.mode, vals: ALG.vals, opt: ALG.opt }));
}
function algApply(s) {
  const d = { text: '', mode: 'expand', vals: {}, opt: { tiles: false, style: 'area', explode: 0, method: 'add', card: true } };
  if (s && typeof s === 'object') {
    if (typeof s.text === 'string') d.text = s.text.slice(0, 300);
    if (s.mode === 'root') s.mode = 'pow';   // früher eigene Darstellung «Wurzeln»
    if (ALG_MODES.some(m => m[0] === s.mode)) d.mode = s.mode;
    if (s.vals && typeof s.vals === 'object') Object.keys(s.vals).forEach(k => { const v = Number(s.vals[k]); if (/^[A-Za-z]$/.test(k) && isFinite(v) && v > 0 && v <= 20) d.vals[k] = v; });
    if (s.opt && typeof s.opt === 'object') {
      d.opt.tiles = !!s.opt.tiles;
      if (s.opt.style === 'box' || s.opt.style === 'area') d.opt.style = s.opt.style;
      if (s.opt.method === 'add' || s.opt.method === 'sub' || s.opt.method === 'eq' || s.opt.method === 'gauss') d.opt.method = s.opt.method;
      const e = Number(s.opt.explode); if (isFinite(e)) d.opt.explode = Math.max(0, Math.min(1, e));
      if (s.opt.card === false) d.opt.card = false;
    }
  }
  ALG.text = d.text; ALG.mode = d.mode; ALG.vals = d.vals; ALG.opt = d.opt;
  algRefresh(true);
}

// ── Rechnen ──────────────────────────────────────────────────────────
function algRecompute() {
  if (ALG_MORE_MODES.indexOf(ALG.mode) >= 0 && typeof AlgMore !== 'undefined') { ALG.res = AlgMore.process(ALG.text, ALG.mode, ALG.vals, ALG.opt); return ALG.res; }
  let res = AlgCore.process(ALG.text, ALG.mode, ALG.vals, ALG.opt);
  let added = false;
  (res.vars || []).forEach((v, i) => { if (!(v in ALG.vals)) { ALG.vals[v] = ALG_DEF_VALS[i % ALG_DEF_VALS.length]; added = true; } });
  if (added) res = AlgCore.process(ALG.text, ALG.mode, ALG.vals, ALG.opt);
  ALG.res = res;
  return res;
}
// Passt die Darstellung an, wenn die Eingabe nicht mehr dazu passt (Klammern ↔ ausmultipliziert)
function algAutoMode() {
  if (ALG_MORE_MODES.indexOf(ALG.mode) >= 0) return;
  let info; try { info = AlgCore.expandInfo(ALG.text); } catch (e) { return; }
  const hasFactors = info.factors.length >= 2 || !!info.pw;
  if ((ALG.mode === 'expand' || ALG.mode === 'binom') && !hasFactors && info.result.length > 1 && ALG.mode === 'expand') ALG.mode = 'factor';
  else if (ALG.mode === 'binom' && !hasFactors && info.result.length > 1) ALG.mode = 'factor';
  else if ((ALG.mode === 'factor' || ALG.mode === 'complete') && hasFactors) ALG.mode = 'expand';
}

// ── Panel ────────────────────────────────────────────────────────────
function algBuildUI() {
  if (ALG.ui || !$alg('alg-panel')) return;
  const ui = ALG.ui = {};
  // Darstellung
  const mw = $alg('alg-modes');
  ALG_MODES.forEach(([id, label]) => {
    const b = algEl('button', 'alg-mode', ALG_MODE_SHORT[id]); b.type = 'button'; b.setAttribute('data-mode', id); b.title = label;
    b.addEventListener('click', () => {
      const wasMore = ALG_MORE_MODES.indexOf(ALG.mode) >= 0, toMore = ALG_MORE_MODES.indexOf(id) >= 0;
      if (wasMore && !toMore && typeof AlgMore !== 'undefined') { try { ALG.text = AlgMore.normalize(ALG.text); } catch (e) {} }
      const was = ALG.mode; let reset = false;
      if (id === 'sys' && was !== 'sys' && !/;/.test(ALG.text)) { ALG.text = ''; reset = true; }       // Gleichungssysteme: leer beginnen
      else if (was === 'sys' && id !== 'sys' && /;/.test(ALG.text)) { ALG.text = ''; reset = true; }
      ALG.mode = id; if (id === 'sys') { const d = $alg('alg-custom'); if (d) d.open = true; }
      algRefresh(wasMore !== toMore || reset); algCommit();
    });
    mw.appendChild(b);
  });
  // Term-Eingabe (wie bei den Folgen: math-field)
  const wrap = $alg('alg-inp-wrap');
  const inp = ui.inp = document.createElement('math-field');
  inp.className = 'func-inp-ce alg-inp';
  inp.style.cssText = 'font-size:15px;padding:4px 8px;border:1px solid var(--border-input);border-radius:6px;background:var(--bg-input);color:var(--text);flex:1;min-width:0;box-sizing:border-box;';
  inp.mathVirtualKeyboardPolicy = 'manual';
  if (inp.shadowRoot) { const f = document.createElement('style'); f.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}'; inp.shadowRoot.appendChild(f); }
  inp.setAttribute('placeholder', 'z. B. (3x-4y)^2');
  inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(inp, -1); });
  inp.addEventListener('focusout', () => { inp.style.borderColor = ''; });
  inp.addEventListener('input', () => {
    let raw;
    try { raw = ALG_MORE_MODES.indexOf(ALG.mode) >= 0 ? inp.getValue('latex') : asciiMathToRaw(inp.getValue('ascii-math')); } catch (e) { return; }
    ALG.text = raw; inp.setAttribute('data-raw', raw);
    algAutoMode(); algChanged(false, true);
  });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  inp.addEventListener('change', () => algCommit());
  wrap.appendChild(inp);
  // Gleichungssysteme: je Gleichung ein eigenes Eingabefeld ((I), (II), optional (III))
  const sw = ui.sysWrap = algEl('div', 'alg-sys-wrap'); sw.style.cssText = 'display:none;flex:1;min-width:0;flex-direction:column;gap:4px;';
  ui.sysRows = []; ui.sysN = 2;
  const ROMS = ['(I)', '(II)', '(III)'], PHS = ['z. B. 2x+3y=7', 'z. B. x-y=1', 'z. B. x+y+z=6'];
  const collect = () => {
    const parts = ui.sysRows.slice(0, ui.sysN).map(f => { try { return f.getValue('latex').trim(); } catch (e) { return ''; } }).filter(x => x);
    ALG.text = parts.join('; '); sw.setAttribute('data-raw', ALG.text);
  };
  for (let i = 0; i < 3; i++) {
    const row = algEl('div', 'alg-sys-row'); row.style.cssText = 'display:flex;align-items:center;gap:6px;';
    const lb = algEl('span', 'alg-sys-lb', ROMS[i]); lb.setAttribute('translate', 'no'); lb.style.cssText = 'width:30px;flex:none;font-size:12px;color:var(--text-muted, #888);font-style:italic;';
    const f = document.createElement('math-field');
    f.className = 'func-inp-ce alg-inp'; f.style.cssText = inp.style.cssText;
    f.mathVirtualKeyboardPolicy = 'manual';
    if (f.shadowRoot) { const st = document.createElement('style'); st.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}'; f.shadowRoot.appendChild(st); }
    f.setAttribute('placeholder', PHS[i]);
    f.addEventListener('focusin', () => { f.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(f, -1); });
    f.addEventListener('focusout', () => { f.style.borderColor = ''; });
    f.addEventListener('input', () => { collect(); algChanged(false, true); });
    f.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const nx = ui.sysRows[i + 1]; if (nx && i + 1 < ui.sysN) nx.focus(); else f.blur(); } });
    f.addEventListener('change', () => algCommit());
    row.appendChild(lb); row.appendChild(f); sw.appendChild(row);
    ui.sysRows.push(f); row.setAttribute('data-i', i);
  }
  const bar = algEl('div', 'alg-sys-bar'); bar.style.cssText = 'display:flex;gap:6px;margin-left:36px;';
  const bAdd = ui.sysAdd = algEl('button', 'alg-sys-btn', '+ 3. Gleichung'); bAdd.type = 'button';
  const bDel = ui.sysDel = algEl('button', 'alg-sys-btn', '− 3. Gleichung'); bDel.type = 'button';
  [bAdd, bDel].forEach(b => { b.style.cssText = 'font-size:11px;padding:2px 8px;border:1px solid var(--border-input);border-radius:6px;background:var(--bg-input);color:var(--text);cursor:pointer;'; bar.appendChild(b); });
  bAdd.addEventListener('click', () => { ui.sysN = 3; algRefresh(false); ui.sysRows[2].focus(); });
  bDel.addEventListener('click', () => { ui.sysN = 2; try { ui.sysRows[2].value = ''; } catch (e) {} collect(); algRefresh(false); algCommit(); });
  sw.appendChild(bar);
  wrap.appendChild(sw);
  // Optionen
  const tl = $alg('alg-tiles'); if (tl) tl.addEventListener('change', () => { ALG.opt.tiles = tl.checked; algChanged(false); algCommit(); });
  const st = $alg('alg-style'); if (st) st.addEventListener('change', () => { ALG.opt.style = st.value; algChanged(false); algCommit(); });
  const mt = $alg('alg-method'); if (mt) mt.addEventListener('change', () => { ALG.opt.method = mt.value; algChanged(false); algCommit(); });
  const ex = $alg('alg-explode'); if (ex) {
    ex.addEventListener('input', () => { ALG.opt.explode = parseFloat(ex.value) || 0; algChanged(false); });
    ex.addEventListener('change', () => algCommit());
  }
  // Export
  const bj = $alg('alg-jpeg'); if (bj) bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  const bl = $alg('alg-latex'); if (bl) bl.addEventListener('click', algMakeLatex);
  const bc = $alg('alg-latex-copy'); if (bc) bc.addEventListener('click', algCopyLatex);
  if (typeof algLearnBuild === 'function') algLearnBuild();
}

function algCommit() { if (typeof pushHistory === 'function') pushHistory(); }

// Nach jeder Änderung: neu rechnen, Oberfläche und Bild aktualisieren
function algChanged(rebuildInput, typing) {
  if (typing) { clearTimeout(algChanged._t); algChanged._t = setTimeout(() => { algRefresh(false); }, 120); return; }
  algRefresh(!!rebuildInput && false);
  algCommit();
}
function algRefresh(setInput) {
  algBuildUI();
  const ui = ALG.ui; if (!ui) { algRecompute(); if (typeof scheduleDraw === 'function') scheduleDraw(); return; }
  const res = algRecompute();
  if (setInput || (document.activeElement !== ui.inp && ui.inp.getAttribute('data-raw') !== ALG.text)) {
    const more = ALG_MORE_MODES.indexOf(ALG.mode) >= 0 && typeof AlgMore !== 'undefined';
    try { ui.inp.value = ALG.text.trim() ? (more ? AlgMore.fieldLatex(ALG.text) : rawToLatex(ALG.text)) : ''; } catch (e) { ui.inp.value = ALG.text; }
    ui.inp.setAttribute('data-raw', ALG.text);
  }
  // Darstellung wählen
  document.querySelectorAll('#alg-modes .alg-mode').forEach(b => b.classList.toggle('active-btn', b.getAttribute('data-mode') === ALG.mode));
  { // Gleichungssysteme: eigene Zeilen statt eines Feldes
    const sys = ALG.mode === 'sys';
    ui.inp.style.display = sys ? 'none' : ''; ui.sysWrap.style.display = sys ? 'flex' : 'none';
    if (sys) {
      const parts = ALG.text.split(/\s*(?:;|\\;|\\\\|\n)\s*/).filter(x => x.trim());
      ui.sysN = setInput ? (parts.length >= 3 ? 3 : 2) : Math.max(ui.sysN, parts.length >= 3 ? 3 : 2);
      if (setInput || (!ui.sysRows.includes(document.activeElement) && ui.sysWrap.getAttribute('data-raw') !== ALG.text)) {
        ui.sysRows.forEach((f, i) => { let v = ''; try { v = parts[i] ? AlgMore.fieldLatex(parts[i]) : ''; } catch (e) { v = parts[i] || ''; } f.value = v; });
        ui.sysWrap.setAttribute('data-raw', ALG.text);
      }
      ui.sysWrap.querySelectorAll('.alg-sys-row').forEach(r => { r.style.display = +r.getAttribute('data-i') < ui.sysN ? 'flex' : 'none'; });
      ui.sysAdd.style.display = ui.sysN === 2 ? '' : 'none'; ui.sysDel.style.display = ui.sysN === 3 ? '' : 'none';
    }
  }
  algRenderVars(res);
  const hint = $alg('alg-hint');
  if (hint) { if (!hint.hasAttribute('data-orig')) hint.setAttribute('data-orig', hint.textContent); const hv = ALG_HINTS[ALG.mode] || hint.getAttribute('data-orig'); if (hint.textContent !== hv) hint.textContent = hv; }
  algRenderSteps(res);
  algRenderOptions(res);
  const er = $alg('alg-err'); if (er) er.textContent = !ALG.text.trim() ? '' : (res.error || '');
  if (typeof algLearnRefresh === 'function') algLearnRefresh();
  if (typeof scheduleDraw === 'function') scheduleDraw();
}
// Werte der Variablen: keine Schieberegler; die Seitenlängen im Bild kommen aus festen Standardwerten (ALG_DEF_VALS)
function algRenderVars() { const box = $alg('alg-vars'); if (box && box.firstChild) box.replaceChildren(); }
// Der Rechenweg steht wie in allen anderen Umgebungen rechts in der Karte (#dif-card, algCardRender);
// in der Seitenleiste bleibt nur der Schalter dafür.
function algRenderSteps(res) {
  const box = $alg('alg-steps'); if (!box) return;
  let cb = $alg('alg-card-on');
  if (!cb) {
    const row = algEl('div', 'settings-row'); row.style.gap = '8px'; row.style.marginTop = '6px';
    const lb = algEl('label'); cb = algEl('input'); cb.type = 'checkbox'; cb.id = 'alg-card-on';
    lb.append(cb, document.createTextNode(' '), algEl('span', null, 'Rechenweg als Karte anzeigen')); row.appendChild(lb);
    cb.addEventListener('change', () => { ALG.opt.card = cb.checked; ALG.cardKey = ''; if (typeof scheduleDraw === 'function') scheduleDraw(); if (typeof difCommit === 'function') difCommit(); });
    box.replaceChildren(row);
  }
  cb.checked = ALG.opt.card !== false;
  ALG.cardKey = '';
}
// ── Rechenweg-Karte rechts ──
function algCardDoc(res) {
  if (!res || !res.ok || typeof Dif === 'undefined' || !((res.steps && res.steps.length) || res.caption)) return null;
  const d = Dif.DOC(), m = (typeof ALG_MODES !== 'undefined' ? ALG_MODES.find(q => q[0] === ALG.mode) : null);
  d.h(m ? m[1] : 'Rechenweg');
  (res.steps || []).forEach(st => { if (st.label) d.p('**' + String(st.label).replace(/\*/g, '') + '**'); if (st.tex) d.e(st.tex); });
  (res.hints || []).forEach(h => d.note(h));
  if (res.caption) d.res('$' + res.caption + '$');
  return d;
}
const algCardShown = () => algActive() && ALG.opt.card !== false && !!(ALG.res && ALG.res.ok && ((ALG.res.steps && ALG.res.steps.length) || ALG.res.caption));
const algDock = w => (algCardShown() && w >= 760 ? stCardW(w, 0.34) : 0);
const algDockH = (w, h) => (algCardShown() && w < 760 ? Math.round(h * 0.5) : 0);
function algCardRender(w, h) {
  const card = $alg('dif-card'), body = $alg('dif-card-body'); if (!card || !body) return;
  const show = algCardShown();
  if (algActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const dock = algDock(w), dh = algDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
  const key = ALG.mode + '|' + JSON.stringify([ALG.res.steps, ALG.res.caption, ALG.res.hints]);
  if (key === ALG.cardKey) return;
  ALG.cardKey = key;
  const d = algCardDoc(ALG.res), m = (typeof ALG_MODES !== 'undefined' ? ALG_MODES.find(q => q[0] === ALG.mode) : null);
  $alg('dif-card-title').textContent = 'Rechenweg: ' + (m ? m[1] : 'Algebra');
  body.innerHTML = d && typeof ST !== 'undefined' ? ST.renderDoc(d) : '<div class="sv"><div class="sv-p">Für diese Aufgabe gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}
(function () {
  const cl = typeof document !== 'undefined' ? document.getElementById('dif-card-close') : null;
  if (cl) cl.addEventListener('click', () => { if (!algActive()) return; ALG.opt.card = false; const cb = $alg('alg-card-on'); if (cb) cb.checked = false; algCardRender(1, 1); if (typeof scheduleDraw === 'function') scheduleDraw(); if (typeof difCommit === 'function') difCommit(); });
})();
function algRenderOptions(res) {
  const exp = res.expand, kind = res.kind;
  const show = (id, on) => { const e = $alg(id); if (e) e.style.display = on ? '' : 'none'; };
  const styleRelevant = ALG.mode === 'expand' && ((kind === 'sq' && exp && exp.sq && exp.sq.neg) || kind === 'diffsq');
  show('alg-style-row', styleRelevant);
  const tilesRelevant = (ALG.mode === 'expand' && (kind === 'sq' || kind === 'diffsq' || kind === 'prod')) || ALG.mode === 'factor';
  show('alg-tiles-row', tilesRelevant);
  show('alg-explode-row', ALG.mode === 'expand' && kind === 'cube' && !!res.fig);
  show('alg-method-row', ALG.mode === 'sys');
  const mt = $alg('alg-method');
  if (mt && ALG.mode === 'sys') {
    const n3 = (res.n || (ALG.ui && ALG.ui.sysN)) === 3, want = n3 ? ['add', 'sub', 'gauss'] : ['add', 'sub', 'eq'];
    if (!ALG.ui.mOpts) { ALG.ui.mOpts = {}; [...mt.options].forEach(o => { ALG.ui.mOpts[o.value] = o; }); }
    const have = [...mt.options].map(o => o.value).join();
    if (have !== want.join()) mt.replaceChildren(...want.map(k => ALG.ui.mOpts[k]).filter(Boolean));
    mt.value = want.indexOf(ALG.opt.method) >= 0 ? ALG.opt.method : 'add';
  }
  const tl = $alg('alg-tiles'); if (tl) tl.checked = !!ALG.opt.tiles;
  const st = $alg('alg-style'); if (st) st.value = ALG.opt.style;
  const ex = $alg('alg-explode'); if (ex && parseFloat(ex.value) !== ALG.opt.explode) ex.value = ALG.opt.explode;
  const note = $alg('alg-tiles-note');
  if (note) note.style.display = (tilesRelevant && ALG.opt.tiles && res.ok && res.fig && !res.fig.tiles) ? '' : 'none';
}

// ── Zeichnen ─────────────────────────────────────────────────────────
function algPal() {
  const dark = typeof darkMode !== 'undefined' && darkMode;
  return { dark, bg: dark ? '#16181d' : '#ffffff', text: dark ? '#e6e8ee' : '#1f2937', muted: dark ? '#9aa3b2' : '#6b7280', line: dark ? '#cbd2dd' : '#334155', alpha: dark ? 0.55 : 0.42 };
}
function algRgba(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
function algShade(hex, f) { // f>0 heller, f<0 dunkler
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f > 0 ? 255 : 0, k = Math.abs(f);
  r = Math.round(r + (t - r) * k); g = Math.round(g + (t - g) * k); b = Math.round(b + (t - b) * k);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
function algHatch(x, y, w, h, col, gap) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.beginPath();
  for (let d = -h; d < w; d += gap) { ctx.moveTo(x + d, y + h); ctx.lineTo(x + d + h, y); }
  ctx.stroke(); ctx.restore();
}
function algDrawText(s, x, y, size, col, align, base, bold) {
  ctx.font = (bold ? '600 ' : '') + size + 'px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
  ctx.fillStyle = col; ctx.textAlign = align || 'center'; ctx.textBaseline = base || 'middle';
  ctx.fillText(s, x, y);
}
function algMeasure(s, size, bold) { ctx.font = (bold ? '600 ' : '') + size + 'px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif'; return ctx.measureText(s).width; }

// ── Formelsatz auf dem Canvas: Brüche, Hochzahlen, mitwachsende Klammern ─────────
// Kleiner Setzer für die Teilmenge von LaTeX, die der Rechenkern erzeugt
// (\frac{}{}, ^{}, Klammern, + − = · und Buchstaben). Gibt Boxen {w, a, d, draw(x, y)} (y = Grundlinie).
const ALG_FONT = '"STIX Two Text","Times New Roman","Cambria Math",Georgia,serif';
function algLabelTex(s) { // Beschriftung (Unicode) → LaTeX-Teilmenge
  const SUP = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
  let out = '', run = '';
  for (const ch of String(s)) {
    if (ch in SUP) { run += SUP[ch]; continue; }
    if (run) { out += '^{' + run + '}'; run = ''; }
    out += ch === '−' ? '-' : ch === '·' ? '\\cdot ' : ch;
  }
  if (run) out += '^{' + run + '}';
  return out.replace(/\((-?\d+)\/(\d+)\)/g, '\\frac{$1}{$2}').replace(/(-?\d+)\/(\d+)/g, '\\frac{$1}{$2}');
}
function algTexParse(src) {
  const s = String(src).replace(/\\left|\\right/g, '').replace(/\\middle\|/g, '|').replace(/\\[,;:! ]/g, ' ');
  let i = 0;
  function seq(stop) { const out = []; while (i < s.length && s[i] !== stop) { const n = atom(); if (n) out.push(n); } return out; }
  function group() { i++; const r = seq('}'); i++; return r; }
  function post(n) {
    for (;;) {
      if (s[i] === '^' || s[i] === '_') {
        const kind = s[i] === '^' ? 'sup' : 'sub'; i++; let sp;
        if (s[i] === '{') sp = group(); else { sp = [{ t: 'ch', s: s[i] }]; i++; }
        n = { t: kind, b: n, p: sp };
        continue;
      }
      return n;
    }
  }
  function atom() {
    const c = s[i];
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i)); i += m[0].length; const cmd = m[1];
      if (cmd === 'frac') { const a = group(), b = group(); return post({ t: 'frac', a, b }); }
      if (cmd === 'cdot') return { t: 'op', s: '·', sp: 0.16 };
      if (cmd === 'quad') return { t: 'sp', w: 1 };
      if (cmd === 'in') return { t: 'op', s: '∈', sp: 0.25 };
      if (cmd === 'approx') return { t: 'op', s: '≈', sp: 0.25 };
      if (cmd === 'neq') return { t: 'op', s: '≠', sp: 0.25 };
      if (cmd === 'Rightarrow') return { t: 'op', s: '⇒', sp: 0.32 };
      if (cmd === 'setminus') return { t: 'op', s: '∖', sp: 0.18 };
      if (cmd === 'cancel') { if (s[i] === '{') return { t: 'cancel', a: group() }; return null; }
      if (cmd === 'sqrt') {
        let idx = null;
        if (s[i] === '[') { const j = s.indexOf(']', i); if (j > 0) { idx = s.slice(i + 1, j); i = j + 1; } }
        if (s[i] === '{') return post({ t: 'sqrt', a: group(), idx });
        return null;
      }
      if (cmd === 'mathbb') { const g = s[i] === '{' ? group() : []; const l = g.length && g[0].s; return { t: 'ch', s: { R: 'ℝ', D: 'D', N: 'ℕ', Z: 'ℤ', Q: 'ℚ' }[l] || l || '' }; }
      if (cmd === 'lg' || cmd === 'ln' || cmd === 'log') return post({ t: 'name', s: cmd });
      if (cmd === '{' || cmd === '}') return post({ t: 'ch', s: cmd });
      return null;
    }
    if (c === '{') { const g = group(); return post({ t: 'grp', a: g }); }
    if (c === '(') { i++; const inner = seq(')'); i++; return post({ t: 'paren', a: inner }); }
    if (c === ')') { i++; return null; }
    i++;
    if (c === ' ') return null;
    if (c === '+' || c === '-' || c === '=') return { t: 'op', s: c === '-' ? '−' : c, sp: 0.24, un: true };
    if (c === ',' || c === ';') return { t: 'ch', s: c, comma: true };
    if (c === '<' || c === '>') return { t: 'op', s: c, sp: 0.25 };
    return post({ t: 'ch', s: c });
  }
  return seq(null);
}
const _algBoxCache = new Map();
function algBox(nodes, size) {
  const font = it => (it ? 'italic ' : '') + size + 'px ' + ALG_FONT;
  const boxes = []; let prevOp = true;   // am Anfang ist ein Minus einstellig
  nodes.forEach(n => {
    let b;
    if (n.t === 'ch') {
      const it = /[A-Za-z]/.test(n.s); ctx.font = font(it);
      const w = ctx.measureText(n.s).width + (it ? size * 0.04 : 0);
      b = { w, a: size * 0.72, d: size * 0.2, draw: (x, y) => { ctx.font = font(it); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(n.s, x, y); } };
      if (n.comma) b.w += size * 0.2;
      prevOp = false;
    } else if (n.t === 'op') {
      const unary = prevOp && n.un; const sp = unary ? 0.02 : n.sp;
      ctx.font = font(false); const w = ctx.measureText(n.s).width;
      b = { w: w + size * (sp * (unary ? 1 : 2)), a: size * 0.66, d: size * 0.1, draw: (x, y) => { ctx.font = font(false); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(n.s, x + size * (unary ? 0.01 : sp), y); } };
      prevOp = true;
    } else if (n.t === 'name') {
      ctx.font = font(false); const w = ctx.measureText(n.s).width + size * 0.16;
      b = { w, a: size * 0.72, d: size * 0.2, draw: (x, y) => { ctx.font = font(false); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(n.s, x, y); } };
      prevOp = false;
    } else if (n.t === 'sub') {
      const base = algBox([n.b], size), sb = algBox(n.p, size * 0.7), lower = size * 0.2, trim = n.b.t === 'name' ? size * 0.16 : 0;
      b = { w: base.w - trim + sb.w + size * 0.03 + trim, a: base.a, d: Math.max(base.d, lower + sb.d), draw: (x, y) => { base.draw(x, y); sb.draw(x + base.w - trim + size * 0.03, y + lower); } };
      prevOp = false;
    } else if (n.t === 'cancel') {
      const inner = algBox(n.a, size);
      b = { w: inner.w, a: inner.a, d: inner.d, draw: (x, y) => {
        inner.draw(x, y); ctx.save(); ctx.beginPath(); ctx.moveTo(x - size * 0.05, y + inner.d); ctx.lineTo(x + inner.w + size * 0.05, y - inner.a);
        ctx.lineWidth = Math.max(1.4, size * 0.09); ctx.strokeStyle = '#d9486b'; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore(); } };
      prevOp = false;
    } else if (n.t === 'sqrt') {
      const inner = algBox(n.a, size), lw = size * 0.55, top = inner.a + size * 0.2;
      const ib = n.idx ? algBox(algTexParse(n.idx), size * 0.62) : null, iw = ib ? Math.max(0, ib.w - lw * 0.35) : 0;
      b = { w: inner.w + lw + size * 0.08 + iw, a: top + size * 0.05 + (ib ? Math.max(0, ib.a + ib.d - top * 0.45) : 0), d: inner.d, draw: (x0, y) => {
        const x = x0 + iw; if (ib) ib.draw(x0, y - top * 0.5 - ib.d);
        ctx.beginPath(); ctx.moveTo(x + lw * 0.05, y - inner.a * 0.25); ctx.lineTo(x + lw * 0.3, y + inner.d * 0.6); ctx.lineTo(x + lw * 0.8, y - top); ctx.lineTo(x + lw + inner.w + size * 0.06, y - top);
        ctx.lineWidth = Math.max(1, size * 0.065); ctx.strokeStyle = ctx.fillStyle; ctx.lineCap = 'butt'; ctx.lineJoin = 'round'; ctx.stroke(); inner.draw(x + lw, y); } };
      prevOp = false;
    } else if (n.t === 'sp') { b = { w: size * n.w, a: 0, d: 0, draw() {} }; prevOp = true; }
    else if (n.t === 'grp') { b = algBox(n.a, size); prevOp = false; }
    else if (n.t === 'paren') {
      const inner = algBox(n.a, size), pad = size * 0.06;
      const a = Math.max(inner.a, size * 0.72) + pad, d = Math.max(inner.d, size * 0.2) + pad, bw = size * 0.3;
      const arc = (x, y, left) => {
        const x0 = left ? x + bw * 0.78 : x + bw * 0.22, x1 = left ? x + bw * 0.12 : x + bw * 0.88, top = y - a, bot = y + d, h = a + d;
        ctx.beginPath(); ctx.moveTo(x0, top); ctx.bezierCurveTo(x1, top + h * 0.22, x1, bot - h * 0.22, x0, bot); ctx.lineWidth = Math.max(1, size * 0.065); ctx.strokeStyle = ctx.fillStyle; ctx.lineCap = 'round'; ctx.stroke();
      };
      b = { w: inner.w + 2 * bw, a, d, draw: (x, y) => { arc(x, y, true); inner.draw(x + bw, y); arc(x + bw + inner.w, y, false); } };
      prevOp = false;
    } else if (n.t === 'frac') {
      const ns = size * 0.86, nu = algBox(n.a, ns), de = algBox(n.b, ns), gap = size * 0.14, ax = size * 0.3;
      const w = Math.max(nu.w, de.w) + size * 0.24;
      b = { w, a: ax + gap + nu.d + nu.a, d: gap + de.a + de.d - ax,
        draw: (x, y) => {
          const by = y - ax;
          nu.draw(x + (w - nu.w) / 2, by - gap - nu.d); de.draw(x + (w - de.w) / 2, by + gap + de.a);
          ctx.beginPath(); ctx.moveTo(x + size * 0.04, by); ctx.lineTo(x + w - size * 0.04, by); ctx.lineWidth = Math.max(1, size * 0.06); ctx.strokeStyle = ctx.fillStyle; ctx.lineCap = 'butt'; ctx.stroke();
        } };
      prevOp = false;
    } else if (n.t === 'sup') {
      const base = algBox([n.b], size), sp = algBox(n.p, size * 0.7);
      const raise = Math.max(size * 0.42, base.a * 0.78 - sp.d * 0.2);
      b = { w: base.w + sp.w + size * 0.03, a: Math.max(base.a, raise + sp.a), d: base.d, draw: (x, y) => { base.draw(x, y); sp.draw(x + base.w + size * 0.03, y - raise); } };
      prevOp = false;
    } else return;
    boxes.push(b);
  });
  let w = 0, a = 0, d = 0; boxes.forEach(b => { w += b.w; a = Math.max(a, b.a); d = Math.max(d, b.d); });
  return { w, a, d, draw: (x, y) => { let cx = x; boxes.forEach(b => { b.draw(cx, y); cx += b.w; }); } };
}
function algMath(tex, size) {
  const k = size + '|' + tex;
  let b = _algBoxCache.get(k);
  if (!b) { b = algBox(algTexParse(tex), size); if (_algBoxCache.size > 400) _algBoxCache.clear(); _algBoxCache.set(k, b); }
  return b;
}
const algMathW = (tex, size) => algMath(tex, size).w;
// anchor: 'middle' | 'top' | 'bottom' (senkrecht), align: 'center' | 'left' | 'right'
function algDrawMath(tex, x, y, size, col, align, anchor) {
  const b = algMath(tex, size);
  const bx = align === 'left' ? x : align === 'right' ? x - b.w : x - b.w / 2;
  const by = anchor === 'top' ? y + b.a : anchor === 'bottom' ? y - b.d : y + (b.a - b.d) / 2;
  ctx.save(); ctx.fillStyle = col; b.draw(bx, by); ctx.restore();
  return b;
}
function algFitMath(tex, x, y, maxW, size, col) {
  let sz = size; while (sz > 9 && algMathW(tex, sz) > maxW) sz -= 1;
  algDrawMath(tex, x, y, sz, col, 'center', 'middle');
  return sz;
}

function algDraw(w0, h0) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w0, h0);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  if (!ALG.res) algRecompute();
  algCardRender(w0, h0);
  const w = w0 - algDock(w0), h = h0 - algDockH(w0, h0);                // Platz neben bzw. über der Rechenweg-Karte
  const res = ALG.res, fs = bf(14);
  if (res.error && !ALG.text.trim()) {
    // leere Eingabe: nichts zeigen
  } else if (res.error) {
    algDrawText(res.error, w / 2, h / 2, fs * 1.1, P.muted, 'center', 'middle');
  } else if (!res.fig) {
    if (res.steps && res.steps.length > 1) algDrawSteps(res, w, h, P, fs);
    else {
      if (res.caption) algFitMath(res.caption, w / 2, h / 2 - fs, w - 40, fs * 2.1, P.text);
      (res.hints || []).forEach((t, i) => algDrawText(t, w / 2, h / 2 + fs * 1.6 + i * fs * 1.5, fs, P.muted, 'center', 'middle'));
    }
  } else {
    algDrawFigure(res, w, h, P, fs);
  }
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}
// Rechenweg ohne Bild (Logarithmen, Bruchterme): Beschriftung links, Formel rechts, Ergebnis hervorgehoben
function algDrawSteps(res, w, h, P, fs) {
  const steps = res.steps, hints = res.hints || [];
  let size = fs * 1.9, rows, gap, lw, totalH, totalW;
  const label = (s) => { try { return (window.AI18N && AI18N.tr) ? AI18N.tr(s) : s; } catch (e) { return s; } };
  for (;;) {
    gap = size * 0.55;
    lw = 0; rows = steps.map(st => { const b = algMath(st.tex, size), lb = label(st.label || ''); lw = Math.max(lw, algMeasure(lb, size * 0.5)); return { b, lb, h: Math.max(b.a + b.d, size * 1.1) }; });
    totalH = rows.reduce((a, r) => a + r.h + gap, -gap) + (hints.length ? size * 0.5 * 1.6 * hints.length + gap : 0);
    totalW = lw + 24 + Math.max(...rows.map(r => r.b.w));
    if ((totalH <= h - 70 && totalW <= w - 60) || size <= 11) break;
    size -= 1;
  }
  const x0 = Math.max(20, (w - totalW) / 2), x1 = x0 + lw + 24;
  let y = Math.max(20, (h - totalH) / 2);
  rows.forEach((r, i) => {
    const last = i === rows.length - 1;
    if (last) { ctx.save(); ctx.fillStyle = algRgba(ALG_HUES[0], 0.1); ctx.strokeStyle = algRgba(ALG_HUES[0], 0.45); ctx.lineWidth = 1.5; const bx = x1 - 10, bw = r.b.w + 20; ctx.beginPath(); (ctx.roundRect ? ctx.roundRect(bx, y - 6, bw, r.h + 12, 8) : ctx.rect(bx, y - 6, bw, r.h + 12)); ctx.fill(); ctx.stroke(); ctx.restore(); }
    algDrawText(r.lb, x0 + lw, y + r.h / 2, size * 0.5, P.muted, 'right', 'middle');
    algDrawMath(steps[i].tex, x1, y + r.h / 2, size, last ? P.text : P.text, 'left', 'middle');
    y += r.h + gap;
  });
  hints.forEach((t, i) => { algDrawText(t, w / 2, y + size * 0.5 * 0.8 + i * size * 0.8, size * 0.5, P.muted, 'center', 'middle'); });
}
function algFitText(s, x, y, maxW, size, col, bold) {
  let sz = size; while (sz > 9 && algMeasure(s, sz, bold) > maxW) sz -= 1;
  algDrawText(s, x, y, sz, col, 'center', 'middle', bold);
  return sz;
}
// ── Szenen (Potenzen, Logarithmen, Bruchterme): Bausteine, Strecken, Klammern ─────
function algHueCol(P, h) { return h === undefined || h < 0 ? P.muted : ALG_HUES[h % 6]; }
function algDrawScene(res, w, h, P, fs) {
  const fig = res.fig, prims = fig.prims;
  const lineH = fs * 1.9;
  const capB = res.caption ? algMath(res.caption, fs * 1.9) : null;
  const capH = capB ? Math.max(lineH, capB.a + capB.d + 14) : lineH;
  const padX = 40, padT = 46, padB = 34 + capH;
  const aw = Math.max(40, w - 2 * padX), ah = Math.max(40, h - padT - padB);
  const s = Math.min(aw / fig.W, ah / fig.H, fs * 4.4);
  const ox = padX + (aw - fig.W * s) / 2 - fig.X0 * s, oy = padT + (ah - fig.H * s) / 2 - fig.Y0 * s;
  const X = x => ox + x * s, Y = y => oy + y * s;
  const rrect = (x, y, rw, rh, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, rw, rh, r); else ctx.rect(x, y, rw, rh); };
  // gefüllte Vielecke (z. B. Ebenen im Schrägbild)
  prims.forEach(p => {
    if (p.k !== 'fpoly' || p.pts.length < 3) return;
    const col = algHueCol(P, p.hue === undefined ? -1 : p.hue), base = col.startsWith('#') ? col : '#888888';
    ctx.save(); ctx.beginPath(); p.pts.forEach((q, i) => { if (i) ctx.lineTo(X(q[0]), Y(q[1])); else ctx.moveTo(X(q[0]), Y(q[1])); }); ctx.closePath();
    ctx.fillStyle = algRgba(base, (p.a === undefined ? 0.3 : p.a) * (P.dark ? 1.25 : 1)); ctx.fill();
    ctx.strokeStyle = algRgba(base, 0.85); ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
  });
  // Rahmen
  prims.forEach(p => {
    if (p.k !== 'rr') return;
    ctx.save(); ctx.setLineDash(p.dash ? [5, 4] : []); ctx.strokeStyle = algHueCol(P, p.hue === undefined ? -1 : p.hue); ctx.lineWidth = 1.4;
    rrect(X(p.x), Y(p.y), p.w * s, p.h * s, 8); ctx.stroke(); ctx.restore();
  });
  // Linien / Pfeile
  prims.forEach(p => {
    if (p.k !== 'line') return;
    const x1 = X(p.x1), y1 = Y(p.y1), x2 = X(p.x2), y2 = Y(p.y2), col = p.hue !== undefined ? algHueCol(P, p.hue) : P.line;
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = p.thick ? 2.6 : 1.3; ctx.setLineDash(p.dash ? [4, 4] : []); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
    if (p.arrow) {
      const ang = Math.atan2(y2 - y1, x2 - x1), L = 9;
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - L * Math.cos(ang - 0.4), y2 - L * Math.sin(ang - 0.4)); ctx.lineTo(x2 - L * Math.cos(ang + 0.4), y2 - L * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  });
  // Kurven
  prims.forEach(p => {
    if (p.k !== 'curve' || p.pts.length < 2) return;
    const col = p.hue !== undefined ? algHueCol(P, p.hue) : P.line;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = p.thick ? 2.8 : 1.6; ctx.setLineDash(p.dash ? [6, 5] : []); ctx.lineJoin = 'round'; ctx.beginPath();
    p.pts.forEach((q, i) => { if (i) ctx.lineTo(X(q[0]), Y(q[1])); else ctx.moveTo(X(q[0]), Y(q[1])); }); ctx.stroke(); ctx.restore();
  });
  // Bausteine
  prims.forEach(p => {
    if (p.k !== 'chip') return;
    const x = X(p.x), y = Y(p.y), cw = p.w * s, ch = p.h * s, col = algHueCol(P, p.hue);
    ctx.save();
    const cut = p.st === 'cut', fresh = p.st === 'new';
    rrect(x, y, cw, ch, Math.min(8, ch * 0.2));
    ctx.fillStyle = algRgba(col.startsWith('#') ? col : '#888888', cut ? 0.10 : fresh ? (P.dark ? 0.62 : 0.5) : (P.dark ? 0.5 : 0.36)); ctx.fill();
    ctx.setLineDash(fresh ? [5, 3] : []); ctx.strokeStyle = cut ? algRgba(col.startsWith('#') ? col : '#888888', 0.45) : col; ctx.lineWidth = fresh ? 2.2 : 1.5; ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    let fz = Math.min(s * 0.6, fs * 1.7); const tex = p.s;
    while (fz > 8 && algMathW(tex, fz) > cw - 6) fz -= 1;
    algDrawMath(tex, x + cw / 2, y + ch / 2, fz, cut ? P.muted : P.text, 'center', 'middle');
    if (cut) { ctx.save(); ctx.strokeStyle = '#d9486b'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 3, y + ch - 3); ctx.lineTo(x + cw - 3, y + 3); ctx.stroke(); ctx.restore(); }
  });
  // Punkte
  prims.forEach(p => {
    if (p.k !== 'dot') return;
    const col = algHueCol(P, p.hue === undefined ? 0 : p.hue);
    ctx.save(); ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 6, 0, Math.PI * 2); ctx.fillStyle = p.open ? P.bg : col; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.stroke(); ctx.restore();
  });
  // Klammern
  prims.forEach(p => {
    if (p.k === 'br') {
      const xa = X(p.x1), xb = X(p.x2), y = Y(p.y), t = p.dir === 'd' ? -6 : 6;
      ctx.save(); ctx.strokeStyle = P.muted; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(xa, y + t); ctx.lineTo(xa, y); ctx.lineTo(xb, y); ctx.lineTo(xb, y + t); ctx.stroke(); ctx.restore();
      if (p.s) algDrawMath(p.s, (xa + xb) / 2, y + (p.dir === 'd' ? 5 : -5), fs * 1.15, P.text, 'center', p.dir === 'd' ? 'top' : 'bottom');
    } else if (p.k === 'vbr') {
      const ya = Y(p.y1), yb = Y(p.y2), x = X(p.x), t = p.dir === 'r' ? -6 : 6;
      ctx.save(); ctx.strokeStyle = P.muted; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + t, ya); ctx.lineTo(x, ya); ctx.lineTo(x, yb); ctx.lineTo(x + t, yb); ctx.stroke(); ctx.restore();
      if (p.s) algDrawMath(p.s, x + (p.dir === 'r' ? 7 : -7), (ya + yb) / 2, fs * 1.15, P.text, p.dir === 'r' ? 'left' : 'right', 'middle');
    }
  });
  // Texte
  prims.forEach(p => {
    if (p.k !== 'text') return;
    const col = p.hue !== undefined ? algHueCol(P, p.hue) : (p.muted ? P.muted : P.text);
    const fz = p.big ? Math.min(fs * 2, Math.max(fs * 1.2, s * 0.8)) : fs * 1.15;
    const al = p.ax === 'l' ? 'left' : p.ax === 'r' ? 'right' : 'center', an = p.ay === 't' ? 'top' : p.ay === 'b' ? 'bottom' : 'middle';
    algDrawMath(p.s, X(p.x), Y(p.y), fz, col, al, an);
  });
  if (res.caption) algFitMath(res.caption, w / 2, h - capH / 2 - 4, w - 28, fs * 1.9, P.text);
}
// ── Würfel (a+b)³: durchsichtig und drehbar ───────────────────────────
const ALG_VIEW0 = { yaw: -0.62, pitch: 0.42 };
const ALG_VIEW = { yaw: ALG_VIEW0.yaw, pitch: ALG_VIEW0.pitch };
function algCubeActive() { return algActive() && ALG.res && ALG.res.fig && ((ALG.mode === 'expand' && ALG.res.fig.cube) || (ALG.mode === 'sys' && ALG.res.fig.planes)); }
function algDrawCube(res, w, h, P, fs) {
  const fig = res.fig, C = fig.cube, lineH = fs * 1.9;
  const capB = res.caption ? algMath(res.caption, fs * 1.9) : null;
  const capH = capB ? Math.max(lineH, capB.a + capB.d + 14) : lineH;
  const legH = fig.legend ? fs * 2 : 0, mT = 14, mB = 14 + capH + legH;
  const aw = Math.max(40, w - 28), ah = Math.max(40, h - mT - mB);
  const L = C.a + C.b + C.e, c0 = L / 2;               // Würfelmitte (Drehzentrum)
  const R = Math.sqrt(3) * L / 2;                        // Umkugel → Grösse bleibt beim Drehen gleich
  const sc = Math.min(aw, ah) / 2 * 0.94 / R, cx = w / 2, cy = mT + ah / 2;
  const cy_ = Math.cos(ALG_VIEW.yaw), sy_ = Math.sin(ALG_VIEW.yaw), cp = Math.cos(ALG_VIEW.pitch), sp = Math.sin(ALG_VIEW.pitch);
  const tr = (x, y, z) => {                              // Welt → Bild (x rechts, y Tiefe, z oben)
    const X = x - c0, Y = y - c0, Z = z - c0;
    const X1 = X * cy_ - Y * sy_, Y1 = X * sy_ + Y * cy_;
    return { x: cx + X1 * sc, y: cy - (Z * cp + Y1 * sp) * sc, d: Y1 * cp - Z * sp };
  };
  const trn = (x, y, z) => {                             // Richtungsvektor (ohne Verschiebung)
    const X1 = x * cy_ - y * sy_, Y1 = x * sy_ + y * cy_;
    return { x: X1, u: z * cp + Y1 * sp, d: Y1 * cp - z * sp };
  };
  const faces = [];
  const LIGHT = (() => { const v = [-0.35, -0.55, 0.75], m = Math.hypot(...v); return v.map(q => q / m); })();
  C.blocks.forEach(B => {
    const x0 = B.x0, x1 = B.x0 + B.dx, y0 = B.y0, y1 = B.y0 + B.dy, z0 = B.z0, z1 = B.z0 + B.dz;
    const V = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    const F = [[[0, 3, 2, 1], [0, 0, -1]], [[4, 5, 6, 7], [0, 0, 1]], [[0, 1, 5, 4], [0, -1, 0]], [[2, 3, 7, 6], [0, 1, 0]], [[1, 2, 6, 5], [1, 0, 0]], [[3, 0, 4, 7], [-1, 0, 0]]];
    F.forEach(([idx, n]) => {
      const pts = idx.map(i => tr(V[i][0], V[i][1], V[i][2]));
      const nn = trn(n[0], n[1], n[2]);                  // Normale in Betrachterkoordinaten (d<0 → zeigt zum Betrachter)
      const dep = pts.reduce((a, q) => a + q.d, 0) / 4;
      const lam = Math.abs(nn.x * LIGHT[0] + nn.u * LIGHT[2] + nn.d * LIGHT[1]);
      faces.push({ pts, dep, hue: B.nb, shade: -0.28 + lam * 0.5, front: nn.d < 0 });
    });
  });
  faces.sort((p, q) => q.dep - p.dep);                   // hinten zuerst
  const A = P.dark ? 0.42 : 0.38;
  const rgba = (hex, f, a) => algShade(hex, f).replace('rgb(', 'rgba(').replace(')', ',' + a + ')');
  ctx.save(); ctx.lineJoin = 'round';
  faces.forEach(f => {
    ctx.beginPath(); f.pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath();
    ctx.fillStyle = rgba(ALG_HUES[f.hue % 6], f.shade, f.front ? A + 0.1 : A - 0.08); ctx.fill();
    ctx.strokeStyle = P.dark ? (f.front ? 'rgba(235,240,250,.55)' : 'rgba(235,240,250,.25)') : (f.front ? 'rgba(30,41,59,.65)' : 'rgba(30,41,59,.28)');
    ctx.lineWidth = f.front ? 1.2 : 0.9; ctx.stroke();
  });
  ctx.restore();
  const baseY = mT + ah;
  if (fig.legend) {
    const items = fig.legend, ws = items.map(it => algMathW(algLabelTex(it.s), fs * 1.2) + fs * 1.6 + 14);
    let total = ws.reduce((a, b) => a + b, 0), x = (w - total) / 2;
    items.forEach((it, i) => {
      ctx.fillStyle = rgba(ALG_HUES[it.hue % 6], 0, 0.55); ctx.fillRect(x, baseY + fs * 0.6, fs, fs);
      ctx.strokeStyle = ALG_HUES[it.hue % 6]; ctx.lineWidth = 1.2; ctx.strokeRect(x, baseY + fs * 0.6, fs, fs);
      algDrawMath(algLabelTex(it.s), x + fs * 1.4, baseY + fs * 1.1, fs * 1.2, P.text, 'left', 'middle');
      x += ws[i];
    });
  }
  if (res.caption) algFitMath(res.caption, w / 2, h - capH / 2 - 4, w - 28, fs * 1.9, P.text);
}
(function () {   // Drehen per Maus/Finger; muss vor dem Sperr-Block unten registriert werden
  const cv = document.getElementById('canvas'); if (!cv) return;
  const blocked = () => typeof pointerMode !== 'undefined' && pointerMode;
  let drag = null;
  const redraw = () => { if (typeof scheduleDraw === 'function') scheduleDraw(); };
  const begin = (x, y, e) => { drag = { x, y }; cv.style.cursor = 'grabbing'; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault(); };
  const move = (x, y) => {
    if (!drag) return;
    ALG_VIEW.yaw += (x - drag.x) * 0.011;
    ALG_VIEW.pitch = Math.max(-1.5, Math.min(1.5, ALG_VIEW.pitch + (y - drag.y) * 0.011));
    drag.x = x; drag.y = y; redraw();
  };
  const end = () => { if (drag) { drag = null; cv.style.cursor = algCubeActive() ? 'grab' : ''; } };
  cv.addEventListener('mousedown', e => { if (e.button !== 0 || !algCubeActive() || blocked()) return; begin(e.clientX, e.clientY, e); }, { capture: true, passive: false });
  window.addEventListener('mousemove', e => { if (drag) { move(e.clientX, e.clientY); e.preventDefault(); } }, true);
  window.addEventListener('mouseup', end, true);
  cv.addEventListener('mousemove', e => { if (!drag) cv.style.cursor = algCubeActive() && !blocked() ? 'grab' : ''; }, { capture: true, passive: true });
  cv.addEventListener('dblclick', e => { if (!algCubeActive() || blocked()) return; ALG_VIEW.yaw = ALG_VIEW0.yaw; ALG_VIEW.pitch = ALG_VIEW0.pitch; redraw(); e.stopImmediatePropagation(); e.preventDefault(); }, { capture: true, passive: false });
  cv.addEventListener('touchstart', e => { if (!algCubeActive() || blocked() || e.touches.length !== 1) return; begin(e.touches[0].clientX, e.touches[0].clientY, e); }, { capture: true, passive: false });
  cv.addEventListener('touchmove', e => { if (!drag) return; if (e.touches.length === 1) move(e.touches[0].clientX, e.touches[0].clientY); e.stopImmediatePropagation(); e.preventDefault(); }, { capture: true, passive: false });
  ['touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, e => { if (drag) { end(); e.stopImmediatePropagation(); } }, { capture: true, passive: false }));
})();

function algDrawFigure(res, w, h, P, fs) {
  if (res.fig && res.fig.planes && typeof AlgMore !== 'undefined' && AlgMore.Sys) {
    const f = AlgMore.Sys.planesFig(res.fig.planes, ALG_VIEW.yaw, ALG_VIEW.pitch);
    return algDrawScene(Object.assign({}, res, { fig: f }), w, h, P, fs);
  }
  if (res.fig && res.fig.scene) return algDrawScene(res, w, h, P, fs);
  if (res.fig && res.fig.cube) return algDrawCube(res, w, h, P, fs);
  const fig = res.fig, prims = fig.prims;
  const lineH = fs * 1.9;
  // Ränder je nach Beschriftungen
  const widest = dock => Math.max(0, ...prims.filter(p => p.k === 'text' && p.dock === dock).map(p => algMathW(algLabelTex(p.s), fs * 1.25)));
  const has = dock => prims.some(p => p.k === 'text' && p.dock === dock);
  let mL = has('left') ? widest('left') + 16 : 14, mR = has('right') ? widest('right') + 16 : 14;
  const tallest = dock => Math.max(0, ...prims.filter(p => p.k === 'text' && p.dock === dock).map(p => { const b = algMath(algLabelTex(p.s), fs * 1.25); return b.a + b.d; }));
  const capB = res.caption ? algMath(res.caption, fs * 1.9) : null;
  const capH = capB ? Math.max(lineH, capB.a + capB.d + 14) : lineH;
  let mT = has('top') ? Math.max(fs + 18, tallest('top') + 14) : 14, mB = (has('bottom') ? Math.max(fs + 18, tallest('bottom') + 14) : 14) + capH + (fig.legend ? fs * 2 : 0);
  mL = Math.min(mL, w * 0.3); mR = Math.min(mR, w * 0.3);
  const aw = Math.max(40, w - mL - mR), ah = Math.max(40, h - mT - mB);
  const kind = prims.length && prims[0].k;
  let s, ox, oy;
  if (fig.prims[0] && fig.prims[0].k === 'cellnum') {
    const bw = 1.0, bh = 0.9;
    s = Math.min(aw / (fig.N + 1.2), ah / ((fig.N + 1) * bh + 0.2));
    ox = mL + aw / 2; oy = mT + (ah - (fig.N + 1) * bh * s) / 2 + bh * s / 2;
    prims.forEach(p => {
      if (p.k !== 'cellnum') return;
      const cx = ox + p.x * s, cy = oy + p.y * s, cw = s * 0.9, ch = s * 0.72;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, 6); else ctx.rect(cx - cw / 2, cy - ch / 2, cw, ch);
      if (p.hi) { ctx.fillStyle = algRgba(ALG_HUES[0], P.dark ? 0.7 : 0.6); ctx.fill(); ctx.strokeStyle = ALG_HUES[0]; ctx.lineWidth = 2; }
      else { ctx.fillStyle = algRgba(ALG_HUES[0], p.row < fig.n ? 0.07 : 0.03); ctx.fill(); ctx.strokeStyle = P.dark ? '#3a4050' : '#d5dae3'; ctx.lineWidth = 1; }
      ctx.stroke();
      const fz = Math.min(s * 0.38, fs * (p.hi ? 1.5 : 1.15), (cw - 4) / Math.max(1, String(p.s).length * 0.62));
      algDrawText(p.s, cx, cy, fz, p.hi ? P.text : P.muted, 'center', 'middle', p.hi);
    });
    // Zeilennummern am linken Rand
    for (let r = 0; r <= fig.N; r++) algDrawText('n=' + r, ox - (r / 2 + 0.75) * s, oy + r * 0.9 * s, Math.min(fs * 0.85, s * 0.3), r === fig.n ? P.text : P.muted, 'right', 'middle', r === fig.n);
  } else if (prims[0] && prims[0].k === 'poly') {
    s = Math.min(aw / fig.W, ah / fig.H); ox = mL + (aw - fig.W * s) / 2 - fig.X0 * s; oy = mT + (ah - fig.H * s) / 2 - fig.Y0 * s;
    prims.forEach(p => {
      if (p.k !== 'poly') return;
      const base = ALG_HUES[p.hue % 6], shade = [0, 0.28, -0.22][p.shade];
      ctx.beginPath(); p.pts.forEach((q, i) => { const X = ox + q[0] * s, Y = oy + q[1] * s; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath();
      ctx.fillStyle = algShade(base, shade); ctx.fill();
      ctx.strokeStyle = P.dark ? 'rgba(0,0,0,.65)' : 'rgba(30,41,59,.75)'; ctx.lineWidth = 1.2; ctx.stroke();
    });
  } else {
    s = Math.min(aw / fig.W, ah / fig.H); ox = mL + (aw - fig.W * s) / 2; oy = mT + (ah - fig.H * s) / 2;
    // erst Flächen, dann Texte
    prims.forEach(p => {
      if (p.k !== 'rect') return;
      const x = ox + p.x * s, y = oy + p.y * s, rw = p.w * s, rh = p.h * s;
      if (rw < 0.5 || rh < 0.5) return;
      const col = ALG_HUES[p.hue % 6] || ALG_HUES[0];
      if (p.outline) { ctx.strokeStyle = P.line; ctx.lineWidth = 2; ctx.strokeRect(x, y, rw, rh); return; }
      if (p.ghost || p.fresh) {
        ctx.fillStyle = algRgba(col, p.fresh ? 0.16 : 0.08); ctx.fillRect(x, y, rw, rh);
        ctx.setLineDash([6, 4]); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(x, y, rw, rh); ctx.setLineDash([]);
      } else {
        ctx.fillStyle = algRgba(col, p.neg ? P.alpha * 0.45 : P.alpha); ctx.fillRect(x, y, rw, rh);
        if (p.neg) algHatch(x, y, rw, rh, algRgba(col, 0.95), 7);
        ctx.strokeStyle = p.neg ? col : P.line; ctx.lineWidth = p.tile ? 1.1 : 1.6; ctx.strokeRect(x, y, rw, rh);
      }
      if (p.label) {
        // Beschriftung ggf. in einem Teilbereich (lbox), z. B. wenn sich Flächen überlagern
        let lx = x, ly = y, lw = rw, lh = rh;
        if (p.lbox) { lx = ox + p.lbox[0] * s; ly = oy + p.lbox[1] * s; lw = p.lbox[2] * s; lh = p.lbox[3] * s; }
        let fz = Math.min(fs * 1.25, lh * 0.5);
        fz = Math.min(fs * 1.5, lh * 0.55); const ltex = algLabelTex(p.label);
        while (fz > 9 && algMathW(ltex, fz) > lw - 4) fz -= 1;
        if (fz >= 8 && algMathW(ltex, fz) < lw - 4) {
          // Beschriftung mit Hintergrundfahne für die Lesbarkeit auf schraffierten Flächen
          if (p.neg) { const bx = algMath(ltex, fz); ctx.fillStyle = P.dark ? 'rgba(22,24,29,.78)' : 'rgba(255,255,255,.82)'; ctx.fillRect(lx + lw / 2 - bx.w / 2 - 3, ly + lh / 2 - (bx.a + bx.d) / 2 - 2, bx.w + 6, bx.a + bx.d + 4); }
          algDrawMath(ltex, lx + lw / 2, ly + lh / 2, fz, P.text, 'center', 'middle');
        }
      }
    });
    prims.forEach(p => {
      if (p.k !== 'text') return;
      const x = ox + p.x * s, y = oy + p.y * s;
      if (p.big) { algDrawText(p.s, x, y, fs * 2.2, P.muted, 'center', 'middle'); return; }
      const fz = fs * 1.25, tx = algLabelTex(p.s);
      if (p.dock === 'top') algDrawMath(tx, x, y - 7, fz, P.text, 'center', 'bottom');
      else if (p.dock === 'left') algDrawMath(tx, x - 8, y, fz, P.text, 'right', 'middle');
      else if (p.dock === 'right') algDrawMath(tx, x + 8, y, fz, P.text, 'left', 'middle');
      else if (p.dock === 'bottom') algDrawMath(tx, x, y + 7, fz, P.text, 'center', 'top');
    });
  }
  // Legende (Würfel)
  const baseY = mT + ah;
  if (fig.legend) {
    const items = fig.legend, ws = items.map(it => algMathW(algLabelTex(it.s), fs * 1.2) + fs * 1.6 + 14);
    let total = ws.reduce((a, b) => a + b, 0), x = (w - total) / 2;
    items.forEach((it, i) => {
      ctx.fillStyle = ALG_HUES[it.hue % 6]; ctx.fillRect(x, baseY + fs * 0.6, fs, fs);
      algDrawMath(algLabelTex(it.s), x + fs * 1.4, baseY + fs * 1.1, fs * 1.2, P.text, 'left', 'middle');
      x += ws[i];
    });
  }
  // Rechnung unter dem Bild
  if (res.caption) algFitMath(res.caption, w / 2, h - capH / 2 - 4, w - 28, fs * 1.9, P.text);
}

// ── LaTeX (TikZ) ─────────────────────────────────────────────────────
function algUniToTex(s) { return AlgCore.bigParens(algLabelTex(s)); }
function algLatex() {
  if (!ALG.res) algRecompute();
  const res = ALG.res, f = x => { const r = Math.round(x * 1e3) / 1e3; return String(Object.is(r, -0) ? 0 : r); };
  const L = [];
  if (res.error) return '% ' + res.error;
  L.push('% Algebra aus J\\sqrt{10} — benötigt \\usepackage{tikz} und \\usetikzlibrary{patterns}');
  L.push('% ' + (res.lineTxt || ''));
  if (!res.fig) {
    if (res.steps && res.steps.length > 1) {
      L.push('\\[ \\begin{array}{l}');
      res.steps.forEach((st, i) => { L.push('  % ' + (st.label || '')); L.push('  ' + st.tex + (i < res.steps.length - 1 ? ' \\\\[4pt]' : '')); });
      L.push('\\end{array} \\]');
    } else L.push('\\[ ' + (res.caption || '') + ' \\]');
    return L.join('\n');
  }
  if (res.fig.planes && typeof AlgMore !== 'undefined' && AlgMore.Sys) return algSceneLatex(Object.assign({}, res, { fig: AlgMore.Sys.planesFig(res.fig.planes, ALG_VIEW.yaw, ALG_VIEW.pitch) }), f);
  if (res.fig.scene) return algSceneLatex(res, f);
  const fig = res.fig, prims = fig.prims;
  const isPascal = prims[0] && prims[0].k === 'cellnum', isPoly = prims[0] && prims[0].k === 'poly';
  const W = isPoly ? fig.W : fig.W, H = fig.H;
  const u = isPascal ? 0.95 : Math.min(8 / Math.max(W, 1e-6), 6 / Math.max(H, 1e-6));
  const usedHues = new Set(); prims.forEach(p => { if (p.hue !== undefined) usedHues.add(p.hue % 6); });
  if (fig.legend) fig.legend.forEach(l => usedHues.add(l.hue % 6));
  usedHues.forEach(h => { const n = parseInt(ALG_HUES[h].slice(1), 16); L.push('\\definecolor{algH' + h + '}{RGB}{' + [n >> 16, (n >> 8) & 255, n & 255].join(',') + '}'); });
  L.push('\\begin{tikzpicture}[x=' + f(u) + 'cm, y=' + f(u) + 'cm, line cap=round, line join=round, font=\\small]');
  const ox = isPoly ? -fig.X0 : 0, oy = isPoly ? -fig.Y0 : 0;
  const P2 = (x, y) => '(' + f(x + ox) + ',' + f(-(y + oy)) + ')';
  prims.forEach(p => {
    if (p.k === 'rect') {
      if (p.outline) { L.push('\\draw[thick] ' + P2(p.x, p.y) + ' rectangle ' + P2(p.x + p.w, p.y + p.h) + ';'); return; }
      const hc = 'algH' + (p.hue % 6);
      let st;
      if (p.ghost || p.fresh) st = 'dashed, thick, draw=' + hc + ', fill=' + hc + '!' + (p.fresh ? 12 : 6);
      else if (p.neg) st = 'draw=' + hc + ', fill=' + hc + '!12, pattern=north east lines, pattern color=' + hc;
      else st = 'draw=black!70, fill=' + hc + '!45';
      L.push('\\draw[' + st + '] ' + P2(p.x, p.y) + ' rectangle ' + P2(p.x + p.w, p.y + p.h) + ';');
      if (p.label) {
        const lb = p.lbox || [p.x, p.y, p.w, p.h];
        if (lb[2] * u > 0.5 && lb[3] * u > 0.35) L.push('\\node[' + (p.neg ? 'fill=white, fill opacity=0.8, text opacity=1, inner sep=1pt' : '') + '] at ' + P2(lb[0] + lb[2] / 2, lb[1] + lb[3] / 2) + ' {$' + algUniToTex(p.label) + '$};');
      }
    } else if (p.k === 'text') {
      const anc = { top: 'south', left: 'east', right: 'west', bottom: 'north' }[p.dock] || 'center';
      L.push('\\node[anchor=' + anc + '] at ' + P2(p.x, p.y) + ' {$' + algUniToTex(p.s) + '$};');
    } else if (p.k === 'poly') {
      const hc = 'algH' + (p.hue % 6);
      const fillc = p.shade === 2 ? hc + '!80!black' : hc + '!' + (p.shade === 1 ? 35 : 60) + '!white';
      L.push('\\filldraw[fill=' + fillc + ', draw=black!70] ' + p.pts.map(q => P2(q[0], q[1])).join(' -- ') + ' -- cycle;');
    } else if (p.k === 'cellnum') {
      L.push('\\node[draw=' + (p.hi ? 'algH0' : 'black!25') + ', rounded corners=2pt, minimum width=0.85cm, minimum height=0.65cm, ' + (p.hi ? 'fill=algH0!30, thick' : '') + '] at ' + P2(p.x, p.y) + ' {' + p.s + '};');
    }
  });
  if (fig.legend) {
    let lx = 0; const ly = -(H + oy) - 0.8;
    fig.legend.forEach(l => { L.push('\\fill[algH' + (l.hue % 6) + '] (' + f(lx) + ',' + f(ly - 0.1) + ') rectangle (' + f(lx + 0.35) + ',' + f(ly + 0.25) + '); \\node[anchor=west] at (' + f(lx + 0.45) + ',' + f(ly + 0.08) + ') {$' + algUniToTex(l.s) + '$};'); lx += 2.6; });
  }
  L.push('\\node[anchor=north] at (' + f((isPascal ? 0 : W / 2) + ox) + ',' + f(-(H + oy) - (fig.legend ? 1.1 : 0.5)) + ') {$' + (res.caption || '') + '$};');
  L.push('\\end{tikzpicture}');
  return L.join('\n');
}
// TikZ für Szenen (Potenzen, Logarithmen, Bruchterme)
function algSceneLatex(res, f) {
  const fig = res.fig, prims = fig.prims, L = [];
  L.push('% Algebra aus J\\sqrt{10} — benötigt \\usepackage{tikz} und \\usepackage{amssymb}');
  L.push('% ' + (res.lineTxt || ''));
  const u = Math.min(0.85, 15 / fig.W, 8 / fig.H);
  const used = new Set(); prims.forEach(p => { if (p.hue !== undefined && p.hue >= 0) used.add(p.hue % 6); });
  used.forEach(h => { const n = parseInt(ALG_HUES[h].slice(1), 16); L.push('\\definecolor{algH' + h + '}{RGB}{' + [n >> 16, (n >> 8) & 255, n & 255].join(',') + '}'); });
  L.push('\\begin{tikzpicture}[x=' + f(u) + 'cm, y=' + f(u) + 'cm, line cap=round, line join=round, font=' + (u < 0.55 ? '\\scriptsize' : '\\small') + ']');
  const P2 = (x, y) => '(' + f(x - fig.X0) + ',' + f(-(y - fig.Y0)) + ')';
  const col = h => (h === undefined || h < 0 ? 'black!45' : 'algH' + (h % 6));
  prims.forEach(p => {
    if (p.k === 'rr') L.push('\\draw[rounded corners=3pt, ' + (p.dash ? 'dashed, ' : '') + 'black!45] ' + P2(p.x, p.y) + ' rectangle ' + P2(p.x + p.w, p.y + p.h) + ';');
    else if (p.k === 'fpoly') { if (p.pts.length > 2) L.push('\\filldraw[fill=' + col(p.hue) + ', fill opacity=' + (p.a === undefined ? 0.3 : p.a) + ', draw=' + col(p.hue) + '] ' + p.pts.map(q => P2(q[0], q[1])).join(' -- ') + ' -- cycle;'); }
    else if (p.k === 'line') L.push('\\draw[' + (p.arrow ? '->, ' : '') + (p.thick ? 'thick, ' : '') + (p.dash ? 'dashed, ' : '') + (p.hue !== undefined ? col(p.hue) : 'black!70') + '] ' + P2(p.x1, p.y1) + ' -- ' + P2(p.x2, p.y2) + ';');
    else if (p.k === 'curve') { if (p.pts.length > 1) L.push('\\draw[' + (p.thick ? 'thick, ' : '') + (p.dash ? 'dashed, ' : '') + col(p.hue) + '] ' + p.pts.map((q, i) => (i ? ' -- ' : '') + P2(q[0], q[1])).join('') + ';'); }
    else if (p.k === 'chip') {
      const c = col(p.hue), cut = p.st === 'cut';
      L.push('\\node[draw=' + c + ', rounded corners=2pt, fill=' + c + '!' + (cut ? 10 : p.st === 'new' ? 40 : 28) + (p.st === 'new' ? ', dashed' : '') + ', minimum width=' + f(p.w * u) + 'cm, minimum height=' + f(u) + 'cm, inner sep=0pt' + (cut ? ', text=black!50' : '') + '] at ' + P2(p.x + p.w / 2, p.y + 0.5) + ' {$' + p.s + '$};');
      if (cut) L.push('\\draw[red!70!black, thick] ' + P2(p.x + 0.08, p.y + 0.92) + ' -- ' + P2(p.x + p.w - 0.08, p.y + 0.08) + ';');
    } else if (p.k === 'dot') L.push('\\filldraw[draw=' + col(p.hue === undefined ? 0 : p.hue) + ', fill=' + (p.open ? 'white' : col(p.hue === undefined ? 0 : p.hue)) + ', thick] ' + P2(p.x, p.y) + ' circle (2.2pt);');
    else if (p.k === 'br') { const t = p.dir === 'd' ? -0.22 : 0.22; L.push('\\draw[black!55] ' + P2(p.x1, p.y + t) + ' -- ' + P2(p.x1, p.y) + ' -- ' + P2(p.x2, p.y) + ' -- ' + P2(p.x2, p.y + t) + ';'); if (p.s) L.push('\\node[anchor=' + (p.dir === 'd' ? 'north' : 'south') + '] at ' + P2((p.x1 + p.x2) / 2, p.y) + ' {$' + p.s + '$};'); }
    else if (p.k === 'vbr') { const t = p.dir === 'r' ? -0.22 : 0.22; L.push('\\draw[black!55] ' + P2(p.x + t, p.y1) + ' -- ' + P2(p.x, p.y1) + ' -- ' + P2(p.x, p.y2) + ' -- ' + P2(p.x + t, p.y2) + ';'); if (p.s) L.push('\\node[anchor=' + (p.dir === 'r' ? 'west' : 'east') + '] at ' + P2(p.x, (p.y1 + p.y2) / 2) + ' {$' + p.s + '$};'); }
    else if (p.k === 'text') {
      const a = (p.ay === 'b' ? 'south' : p.ay === 't' ? 'north' : '') + (p.ax === 'l' ? ' west' : p.ax === 'r' ? ' east' : '');
      L.push('\\node[' + (a.trim() ? 'anchor=' + a.trim() + ', ' : '') + (p.hue !== undefined ? 'text=' + col(p.hue) : p.muted ? 'text=black!55' : '') + (p.big ? ', scale=1.4' : '') + '] at ' + P2(p.x, p.y) + ' {$' + p.s + '$};');
    }
  });
  L.push('\\node[anchor=north] at (' + f(fig.W / 2) + ',' + f(-fig.H - 0.9) + ') {$' + (res.caption || '') + '$};');
  L.push('\\end{tikzpicture}');
  return L.join('\n').replace(/\n\\node\[\] /g, '\n\\node ').replace(/\[, /g, '[');
}
function algMakeLatex() { const ta = $alg('alg-latex-out'); if (!ta) return; ta.value = algLatex(); return ta.value; }
function algCopyLatex() {
  const ta = $alg('alg-latex-out'); if (!ta) return;
  if (!ta.value) algMakeLatex();
  const m = $alg('alg-latex-msg');
  const done = () => { if (m) { m.textContent = (typeof t === 'function' ? t('msg_copied') : 'Kopiert'); setTimeout(() => { m.textContent = ''; }, 2500); } };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done).catch(() => { ta.select(); document.execCommand('copy'); done(); });
  else { ta.select(); document.execCommand('copy'); done(); }
}

// ── Canvas in der Algebra-Umgebung: keine Verschiebe-/Zoom-/Punkt-Aktionen ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const stop = e => { if (algActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'mousemove', 'mouseup', 'mouseleave', 'dblclick', 'contextmenu', 'wheel', 'touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(ev =>
    cv.addEventListener(ev, stop, { capture: true, passive: false }));
})();

algBuildUI();
algRecompute();
