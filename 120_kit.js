// ═══════════════════════════════════════════════════════════════════
// 120_kit.js — Baukasten für Themen, die nur aus einer Beschreibung bestehen
//
// Ein Thema meldet sich mit kitDefine(spec) an (siehe 121_cx.js). Der Baukasten übernimmt alles,
// was bei jedem Thema gleich ist: Panel, Zustand (Rückgängig, Speichern, Zurücksetzen), Maus und
// Finger (Ziehen, Klicken, Ausschnitt verschieben und zoomen), Rechenweg-Karte, LaTeX-Export,
// Eintrag in Themenübersicht, Suche, Hilfe und Quiz. Gezeichnet wird mit den Szenen der
// Differentialrechnung (61_dif_draw.js: difFrame, difCurve …; 42_stat_ui.js: statPaint, stSceneTex).
//
// spec = {
//   id, icon, title, desc           Eintrag der Umgebung (32_env.js)
//   group, before                   Gruppe der Themenübersicht; before: vor diesem Thema einreihen
//   about, tip, help[], kw{view}    Texte für Übersicht, Hinweis, Hilfe, Suche (33_topics.js)
//   views [[id, Name]]              Ansichten
//   descs {view: [Überschrift mit {{Wort|id}}, Theorie]}
//   def {view: {…}}                 Anfangswerte; ein Schlüssel «win: null» schaltet Verschieben/Zoomen ein
//   controls(view, P) → [{k, t: 'range'|'num'|'select'|'check', l, min, max, step, o, show, u}]
//                                   oder {k, t: 'text', l, ok(text) → bereinigter Text oder null, keys: [Zeichen …], err}
//   presets {view: [[Name, {…}]]}   Beispiele
//   fix(view, P)                    Abhängigkeiten nach jeder Änderung gerade ziehen
//   sanitize(view, P, src)          zusätzliche Schlüssel (Listen …) aus gespeicherten Daten übernehmen
//   scene {view: (S, W, H, C)}      Bild; C = {view, P, fs, exp, hover, t (Animation 0…1 oder null)}
//                                   Treffer: S.hits.push({id, x, y, w, h, move(px, py), on(px, py)})
//   doc(view, P) → {title, st}      Rechenweg (Schritte wie 99b_inv_docs.js) oder null
//   anim {view: [Knopftext, ms]}    Animation
//   extra(view, P, box, api)        eigene Bedienelemente (Listen); api = {el, btn, changed(rebuild)}
//   quiz [view …]                   Ansichten mit Quiz (quiz_<id>.js)
//   shared [key …]                  Schlüssel, die in allen Ansichten denselben Wert haben (z. B. Winkelmass)
// }
// ═══════════════════════════════════════════════════════════════════
const KIT = { envs: {}, order: [] };
const kitCopy = o => JSON.parse(JSON.stringify(o));
const kitEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const kitClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const kitR = (v, d) => { const f = Math.pow(10, d === undefined ? 6 : d); return Math.round(v * f) / f + 0; };
function kitCur() { try { return (typeof ENV !== 'undefined' && KIT.envs[ENV.cur]) || null; } catch (e) { return null; } }
function kitActive() { return !!kitCur(); }
function kitRedraw() { if (typeof scheduleDraw === 'function') scheduleDraw(); }
function kitCommit() { if (typeof pushHistory === 'function') pushHistory(); }
const kitViewName = E => (E.spec.views.find(v => v[0] === E.view) || [0, ''])[1];
const kitHasWin = E => 'win' in E.spec.def[E.view];

function kitDefine(spec) {
  const E = { spec, view: spec.views[0][0], P: kitCopy(spec.def), card: true, hover: null, anim: null, ui: null, S: null, cardKey: '', cardT: 0, wt: 0 };
  KIT.envs[spec.id] = E; KIT.order.push(spec.id);
  window[spec.id + 'Capture'] = () => kitCapture(E);
  window[spec.id + 'Apply'] = s => kitApply(E, s);
  if (typeof document === 'undefined') return E;
  // Wie bei den anderen Themen: fremde Panels, 2D-Werkzeuge und Beschriftungen des Plotters ausblenden
  const q = 'body[data-env="' + spec.id + '"] ';
  const st = kitEl('style'); st.textContent = q + '#sidebar > .panel:not([data-envs~="' + spec.id + '"]) { display:none !important; }\n' +
    q + '.tb-2d button:not(#pointer-mode-btn) { display:none !important; }\n' +
    ['#canvas-label-overlay', '#func-labels-overlay', '#solve-tooltip', '#tooltip'].map(s => q + s).join(', ') + ' { display:none !important; }';
  document.head.appendChild(st);
  const ref = document.getElementById('fin-panel'); if (!ref) return E;
  const panel = kitEl('div', 'panel'); panel.id = spec.id + '-panel'; panel.setAttribute('data-envs', spec.id);
  const body = kitEl('div'); body.id = spec.id + '-body';
  panel.append(kitEl('div', 'panel-title', spec.icon + ' ' + spec.title), body);
  let last = ref; KIT.order.forEach(id => { const p = document.getElementById(id + '-panel'); if (p) last = p; });
  last.parentNode.insertBefore(panel, last.nextSibling);
  kitBuildUI(E, body);
  return E;
}

// ── Zustand ──
function kitWinOk(w) { return !!w && typeof w === 'object' && ['x0', 'x1', 'y0', 'y1'].every(k => Number.isFinite(Number(w[k]))) && Number(w.x1) - Number(w.x0) > 1e-6 && Number(w.y1) - Number(w.y0) > 1e-6 && Math.abs(Number(w.x0)) < 1e7 && Math.abs(Number(w.x1)) < 1e7 && Math.abs(Number(w.y0)) < 1e7 && Math.abs(Number(w.y1)) < 1e7; }
function kitSanitize(E, view, src) {
  const sp = E.spec, P = kitCopy(sp.def[view]);
  if (!src || typeof src !== 'object') return P;
  const tmp = Object.assign({}, P, src);
  let cs = []; try { cs = sp.controls(view, tmp) || []; } catch (e) { cs = sp.controls(view, P) || []; }
  cs.forEach(c => {
    if (!c.k || !(c.k in src)) return;
    const v = src[c.k];
    if (c.t === 'check') P[c.k] = !!v;
    else if (c.t === 'range' || c.t === 'num') { const x = Number(v); if (isFinite(x)) P[c.k] = kitClamp(x, c.min, c.max); }
    else if (c.t === 'select') { const o = c.o.find(q => String(q[0]) === String(v)); if (o) P[c.k] = o[0]; }
    else if (c.t === 'text') { const n = typeof v === 'string' && v.length <= 200 ? c.ok(v) : null; if (n !== null && n !== undefined) P[c.k] = n; }
  });
  if ('win' in P) P.win = kitWinOk(src.win) ? { x0: Number(src.win.x0), x1: Number(src.win.x1), y0: Number(src.win.y0), y1: Number(src.win.y1) } : null;
  try { if (sp.sanitize) sp.sanitize(view, P, src); if (sp.fix) sp.fix(view, P); } catch (e) { return kitCopy(sp.def[view]); }
  return P;
}
function kitCapture(E) { return kitCopy({ view: E.view, P: E.P, card: E.card }); }
function kitApply(E, s) {
  E.anim = null; E.hover = null; E.cardKey = '';
  const sp = E.spec; let view = sp.views[0][0], card = true; const P = {};
  if (s && typeof s === 'object') { if (sp.views.some(v => v[0] === s.view)) view = s.view; if ('card' in s) card = !!s.card; }
  sp.views.forEach(([id]) => { P[id] = kitSanitize(E, id, s && s.P && s.P[id]); });
  E.view = view; E.P = P; E.card = card;
  kitRefreshUI(E); kitRedraw(); kitCardSoon(E);
}
function kitCaptureAll() { const o = {}; KIT.order.forEach(id => { o[id] = kitCapture(KIT.envs[id]); }); return o; }
function kitApplyAll(s) { KIT.order.forEach(id => kitApply(KIT.envs[id], s && typeof s === 'object' ? s[id] : null)); }
function kitFix(E) {
  try { if (E.spec.fix) E.spec.fix(E.view, E.P[E.view]); } catch (e) { /* bleibt */ }
  const cur = E.P[E.view]; (E.spec.shared || []).forEach(k => { if (k in cur) Object.keys(E.P).forEach(v => { if (k in E.P[v]) E.P[v][k] = cur[k]; }); });
}

// ── Panel ──
function kitBuildUI(E, body) {
  const sp = E.spec, ui = E.ui = {};
  ui.sel = kitEl('select'); ui.sel.id = sp.id + '-view';
  sp.views.forEach(([id, nm]) => { const o = kitEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { E.view = ui.sel.value; E.anim = null; E.hover = null; E.cardKey = ''; kitFix(E); kitRefreshUI(E); kitRedraw(); kitCardSoon(E); kitCommit(); });
  const lab = kitEl('div', 'subpanel-label', 'Ansicht'); lab.style.marginTop = '0';
  ui.desc = kitEl('div', 'act-hint'); ui.desc.style.cssText = 'margin:6px 2px 8px;';
  ui.ex = kitEl('select'); ui.ex.style.cssText = 'width:100%;margin-bottom:8px;';
  ui.ex.addEventListener('change', () => {
    const L = (sp.presets && sp.presets[E.view]) || [], p = L[parseInt(ui.ex.value, 10)]; ui.ex.value = '';
    if (!p) return;
    const old = E.P[E.view], P = E.P[E.view] = Object.assign(kitCopy(sp.def[E.view]), kitCopy(p[1]));
    (sp.shared || []).forEach(k => { if (k in old && !(k in p[1])) P[k] = old[k]; });   // gemeinsame Einstellungen bleiben, ausser das Beispiel setzt sie selbst
    if ('win' in P && !p[1].win) P.win = null;
    E.anim = null; kitFix(E); kitRefreshUI(E); kitRedraw(); kitCardSoon(E); kitCommit();
  });
  ui.params = kitEl('div', 'alg-opts'); ui.extra = kitEl('div'); ui.tools = kitEl('div', 'alg-opts');
  body.append(lab, ui.sel, ui.desc, ui.ex, ui.params, ui.extra, ui.tools);
  const det = kitEl('details', 'geo-box td-sec');
  det.append(kitEl('summary', null, 'Export'));
  const ac = kitEl('div', 'ex-actions');
  ui.bj = kitEl('button', null, '📷 JPEG'); ui.bl = kitEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = kitEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = kitEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = kitEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = kitEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => kitMakeLatex(E, 'pic')); ui.br.addEventListener('click', () => kitMakeLatex(E, 'calc'));
  ui.bc.addEventListener('click', () => texCopy(ui, () => kitMakeLatex(E, 'pic')));
  kitRefreshUI(E);
}
function kitBtn(txt, fn, title) { const b = kitEl('button', null, txt); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', fn); return b; }
function kitShowVal(c, v) { const s = (typeof Dif !== 'undefined' ? Dif.fmt(v, c.d === undefined ? 3 : c.d) : String(v)); return c.u ? s + ' ' + c.u : s; }
function kitRefreshUI(E) {
  const ui = E.ui; if (!ui) return;
  const sp = E.spec, m = E.view, P = E.P[m];
  ui.sel.value = m;
  const d = sp.descs[m]; ui.desc.replaceChildren(kitEl('div', null, d[1]));
  if (typeof envHint === 'function') envHint(sp.id, d[0], () => E.S);   // Überschrift über dem Bild
  const L = (sp.presets && sp.presets[m]) || [];
  ui.ex.replaceChildren(); ui.ex.style.display = L.length ? '' : 'none';
  if (L.length) { const o0 = kitEl('option', null, 'Beispiel wählen …'); o0.value = ''; ui.ex.appendChild(o0); L.forEach((p, i) => { const o = kitEl('option', null, p[0]); o.value = String(i); ui.ex.appendChild(o); }); ui.ex.value = ''; }
  ui.params.replaceChildren();
  const changed = rebuild => { kitFix(E); if (rebuild) kitRefreshUI(E); kitRedraw(); kitCardSoon(E); kitCommit(); };
  const live = () => { kitFix(E); kitRedraw(); kitCardSoon(E); };
  (sp.controls(m, P) || []).forEach(c => {
    if (c.show === false) return;
    const row = kitEl('div', 'settings-row'); row.style.gap = '8px';
    const id = sp.id + '-c-' + c.k;
    if (c.t === 'check') {
      const lb = kitEl('label'), inp = kitEl('input'); inp.type = 'checkbox'; inp.id = id; inp.checked = !!P[c.k];
      lb.append(inp, document.createTextNode(' '), kitEl('span', null, c.l)); row.appendChild(lb);
      inp.addEventListener('change', () => { P[c.k] = inp.checked; changed(true); });
    } else if (c.t === 'select') {
      const lb = kitEl('label', null, c.l); lb.setAttribute('for', id);
      const sel = kitEl('select'); sel.id = id; c.o.forEach(o => { const op = kitEl('option', null, String(o[1])); op.value = String(o[0]); sel.appendChild(op); });
      sel.value = String(P[c.k]);
      sel.addEventListener('change', () => { const o = c.o.find(q => String(q[0]) === sel.value); if (o) P[c.k] = o[0]; changed(true); });
      row.append(lb, sel);
    } else if (c.t === 'num') {
      const lb = kitEl('label', null, c.l); lb.setAttribute('for', id);
      const inp = kitEl('input'); inp.type = 'number'; inp.id = id; inp.min = c.min; inp.max = c.max; inp.step = c.step; inp.value = String(kitR(P[c.k], 4)); inp.style.width = '110px';
      inp.addEventListener('input', () => { const x = parseFloat(inp.value); if (isFinite(x)) { P[c.k] = kitClamp(x, c.min, c.max); live(); } });
      inp.addEventListener('change', () => { const x = parseFloat(inp.value); if (isFinite(x)) P[c.k] = kitClamp(x, c.min, c.max); changed(!!c.rebuild); });
      row.append(lb, inp);
    } else if (c.t === 'range') {
      const wrap = kitEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
      const top = kitEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
      const lb = kitEl('label', null, c.l); lb.setAttribute('for', id);
      const val = kitEl('b', null, kitShowVal(c, P[c.k])); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
      top.append(lb, val);
      const inp = kitEl('input'); inp.type = 'range'; inp.id = id; inp.min = c.min; inp.max = c.max; inp.step = c.step; inp.value = P[c.k]; inp.style.width = '100%';
      inp.addEventListener('input', () => { P[c.k] = parseFloat(inp.value); val.textContent = kitShowVal(c, P[c.k]); live(); });
      inp.addEventListener('change', () => { kitFix(E); kitRefreshUI(E); kitCommit(); });
      wrap.append(top, inp); row.appendChild(wrap);
    } else if (c.t === 'text') {
      const wrap = kitEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;width:100%;';
      const lb = kitEl('label', null, c.l); lb.setAttribute('for', id);
      const inp = kitEl('input'); inp.type = 'text'; inp.id = id; inp.value = P[c.k]; inp.style.width = '100%'; inp.setAttribute('data-kb-skip', '1'); inp.setAttribute('translate', 'no'); inp.autocomplete = 'off'; inp.spellcheck = false;
      const msg = kitEl('div', 'ex-msg'); msg.style.color = '#d9486b';
      const take = () => { const n = c.ok(inp.value); if (n === null || n === undefined) { inp.style.borderColor = '#d9486b'; msg.textContent = c.err || 'Diese Eingabe wird nicht verstanden.'; return; } inp.style.borderColor = ''; msg.textContent = ''; if (n !== P[c.k]) { P[c.k] = n; changed(true); } else inp.value = n; };
      inp.addEventListener('change', take); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); take(); } });
      wrap.append(lb, inp);
      if (c.keys) { const bar = kitEl('div'); bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;'; c.keys.forEach(ch => { const b = kitBtn(ch, () => { const a = inp.selectionStart === null ? inp.value.length : inp.selectionStart, e2 = inp.selectionEnd === null ? a : inp.selectionEnd; inp.value = inp.value.slice(0, a) + ch + inp.value.slice(e2); inp.focus(); inp.setSelectionRange(a + ch.length, a + ch.length); }); b.setAttribute('translate', 'no'); b.style.minWidth = '34px'; b.addEventListener('mousedown', e => e.preventDefault()); bar.appendChild(b); }); bar.appendChild(kitBtn('Übernehmen', take)); wrap.appendChild(bar); }
      wrap.appendChild(msg); row.appendChild(wrap);
    } else return;
    ui.params.appendChild(row);
  });
  ui.extra.replaceChildren();
  if (sp.extra) { try { sp.extra(m, P, ui.extra, { el: kitEl, btn: kitBtn, changed }); } catch (e) { console.warn('kit extra', e); } }
  ui.tools.replaceChildren();
  const an = sp.anim && sp.anim[m];
  if (an) { const row = kitEl('div', 'settings-row'); ui.ba = kitBtn(E.anim ? '⏸ Pause' : an[0], () => kitAnimToggle(E)); ui.ba.style.width = '100%'; row.appendChild(ui.ba); ui.tools.appendChild(row); } else ui.ba = null;
  if (kitHasDoc(E)) {
    const row = kitEl('div', 'settings-row'), lb = kitEl('label'), inp = kitEl('input'); inp.type = 'checkbox'; inp.id = sp.id + '-card'; inp.checked = !!E.card;
    lb.append(inp, document.createTextNode(' '), kitEl('span', null, 'Rechenweg als Karte anzeigen')); row.appendChild(lb);
    inp.addEventListener('change', () => { E.card = inp.checked; E.cardKey = ''; kitRedraw(); kitCardRender(E); kitCommit(); });
    ui.tools.appendChild(row);
  }
  if (kitHasWin(E) && P.win) { const row = kitEl('div', 'settings-row'); row.appendChild(kitBtn('Ausschnitt zurücksetzen', () => { P.win = null; kitRefreshUI(E); kitRedraw(); kitCommit(); })); ui.tools.appendChild(row); }
  ui.br.style.display = kitHasDoc(E) ? '' : 'none';
}

// ── Animation: C.t läuft von 0 bis 1 ──
function kitAnimToggle(E) {
  const an = E.spec.anim && E.spec.anim[E.view]; if (!an) return;
  if (E.anim) { E.anim = null; if (E.ui.ba) E.ui.ba.textContent = an[0]; kitRedraw(); return; }
  E.anim = { t: 0, last: 0, ms: an[1] || 5000, view: E.view }; if (E.ui.ba) E.ui.ba.textContent = '⏸ Pause';
  requestAnimationFrame(ts => kitAnimFrame(E, ts));
}
function kitAnimFrame(E, ts) {
  const a = E.anim; if (!a || kitCur() !== E || a.view !== E.view) { if (E.anim) { E.anim = null; kitRefreshUI(E); } return; }
  if (a.last) a.t += (ts - a.last) / a.ms; a.last = ts;
  if (a.t >= 1) { E.anim = null; const an = E.spec.anim[E.view]; if (E.ui.ba) E.ui.ba.textContent = an[0]; kitRedraw(); return; }
  kitRedraw(); requestAnimationFrame(t2 => kitAnimFrame(E, t2));
}

// ── Rechenweg-Karte (gemeinsames Element #dif-card) ──
function kitDocRaw(E) { try { return E.spec.doc ? E.spec.doc(E.view, E.P[E.view]) : null; } catch (e) { return null; } }
function kitHasDoc(E) { return !!(E.spec.doc && (!E.spec.nodoc || E.spec.nodoc.indexOf(E.view) < 0)); }
function kitCardDoc(E) { const r = kitDocRaw(E); if (!r || typeof Dif === 'undefined') return null; return { t: 'Rechenweg', d: Dif.stDoc(r) }; }
function kitCardSoon(E) { clearTimeout(E.cardT); E.cardT = setTimeout(() => kitCardRender(E), 40); }
function kitCardRender(E) {
  const card = document.getElementById('dif-card'), body = document.getElementById('dif-card-body'); if (!card || !body || kitCur() !== E) return;
  const show = E.card && kitHasDoc(E);
  card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = E.view + '|' + JSON.stringify(E.P[E.view]); if (key === E.cardKey) return;
  E.cardKey = key;
  const r = kitCardDoc(E), ti = document.getElementById('dif-card-title'); if (ti) ti.textContent = 'Rechenweg';
  const top = body.scrollTop;
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = E.cardView === E.view ? top : 0; E.cardView = E.view;
}
const kitDock = (E, w) => (E.card && kitHasDoc(E) && w >= 760 ? stCardW(w, 0.36) : 0);
const kitDockH = (E, w, h) => (E.card && kitHasDoc(E) && w < 760 ? Math.round(h * 0.5) : 0);

// ── Zeichnen ──
function kitCtx(E, W, H, exp) { return { view: E.view, P: E.P[E.view], fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, hover: exp ? null : E.hover, t: E.anim && !exp ? E.anim.t : null }; }
function kitBuildScene(E, W, H, C) {
  const S = difScene(), fn = E.spec.scene[C.view];
  try { if (fn) fn(S, W, H, C); } catch (e) { console.warn('kit scene', e); S.text(W / 2, H / 2, 'Mit diesen Werten lässt sich kein Bild zeichnen.', { size: C.fs, col: 'M', al: 'c' }); }
  return S;
}
function kitDraw(w, h) {
  const E = kitCur(); if (!E) return;
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  const card = document.getElementById('dif-card'), dock = kitDock(E, w), dh = kitDockH(E, w, h);
  if (card) { card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh); card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : ''; }
  const W = w - dock, Hs = h - dh;
  const S = kitBuildScene(E, W, Hs, kitCtx(E, W, Hs));
  E.S = S; statPaint(S, W, Hs);
  kitCardRender(E);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function kitLatex(E) { const W = 760, H = 520; return stSceneTex(kitBuildScene(E, W, H, kitCtx(E, W, H, { fs: 11 })), W, H, kitViewName(E), 11); }
function kitCardLatex(E) { const r = kitCardDoc(E); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.'; return '% Rechenweg: ' + kitViewName(E) + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d); }
function kitMakeLatex(E, which) { const ui = E.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? kitCardLatex(E) : kitLatex(E); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }

// ── Hilfen für Szenen ──
// Rahmen mit gleichem Massstab in x und y (Gauss-Ebene, Vektoren): Mitte (cx, cy), mindestens ±half sichtbar; P.win (Verschieben, Zoomen) geht vor
function kitFrameSq(S, r, C, cx, cy, half, o) {
  o = o || {}; const fs = C.fs, head = (o.title || o.info) ? fs * 2.0 : 0, pw = r.w - fs * 3.9, ph = r.h - fs * 2.5 - head, w = C.P.win;
  if (w) { cx = (w.x0 + w.x1) / 2; cy = (w.y0 + w.y1) / 2; half = Math.min(w.x1 - w.x0, w.y1 - w.y0) / 2; }
  const u = Math.max(1e-9, Math.min(pw, ph)) / (2 * half), hx = Math.max(pw, 1) / (2 * u), hy = Math.max(ph, 1) / (2 * u);
  const m = difFrame(S, r, { x0: cx - hx, x1: cx + hx, y0: cy - hy, y1: cy + hy }, C, o);
  m.sq = true; S.maps.main = m; return m;
}
// Rahmen mit freiem Ausschnitt; P.win geht vor
function kitFrame(S, r, C, win, o) { const m = difFrame(S, r, C.P.win || win, C, o); S.maps.main = m; return m; }
// Pfeil in Weltkoordinaten (Vektor, Zeiger)
function kitArrow(S, m, x1, y1, x2, y2, o) {
  o = o || {}; const a = [m.X(x1), m.Y(y1)], b = [m.X(x2), m.Y(y2)], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!(len > 0.5) || !isFinite(len)) return;
  const ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len, hl = Math.min(o.head || 11, len * 0.6), hw = hl * 0.42, lw = o.lw || 2.4;
  const bx = b[0] - ux * hl, by = b[1] - uy * hl;
  S.line(a[0], a[1], bx + ux * 1, by + uy * 1, { col: o.col, lw, dash: o.dash, a: o.a });
  S.poly([[b[0], b[1]], [bx - uy * hw, by + ux * hw], [bx + uy * hw, by - ux * hw]], { col: o.col, fill: o.col, lw: 1, close: true, a: o.a });
  if (o.hl) shl(S, o.hl, [a, b]);
}
// Ziehbarer Punkt: zeichnet ihn und meldet den Treffer an; set(x, y) bekommt Weltkoordinaten (auf step gerastet)
function kitDragPt(S, m, C, id, x, y, o, set) {
  o = o || {}; const px = m.X(x), py = m.Y(y); if (!isFinite(px) || !isFinite(py)) return;
  const hot = C.hover === id, r = (o.r || 6) + (hot ? 2 : 0);
  if (difInside(m, px, py, 2)) { if (hot && !C.exp) S.circ(px, py, r + 5, { fill: o.col || 'T', stroke: o.col || 'T', lw: 0, a: 0.18 }); S.circ(px, py, C.exp ? 3.5 : r, { fill: o.col || 'T', stroke: 'W', lw: 1.5 }); }
  if (o.hl) shlC(S, o.hl, px, py, 13);
  if (C.exp || !set) return;
  const st = o.step || 0, sn = v => (st ? Math.round(v / st) * st : v);
  S.hits.push({ id, x: px - 16, y: py - 16, w: 32, h: 32, move: (qx, qy) => set(kitR(sn(m.IX(kitClamp(qx, m.L, m.R)))), kitR(sn(m.IY(kitClamp(qy, m.T, m.B))))) });
}
// Winkelbogen um (x, y) von a0 bis a1 (Bogenmass, Gegenuhrzeigersinn) mit Radius rp (Pixel)
function kitArc(S, m, x, y, a0, a1, rp, o) {
  const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 0.08)), pts = [], cx = m.X(x), cy = m.Y(y);
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + rp * Math.cos(a), cy - rp * Math.sin(a)]); }
  S.poly(pts, Object.assign({ lw: 1.8 }, o || {})); if (o && o.hl) shl(S, o.hl, pts);
}

// ── Maus und Finger ──
(function () {
  if (typeof document === 'undefined') return;
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const touch = () => typeof inputIsTouch !== 'undefined' && inputIsTouch;
  const hitAt = (E, p, pred) => {
    const L = ((E.S && E.S.hits) || []).filter(pred);
    for (let i = L.length - 1; i >= 0; i--) { const h = L[i]; if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h) return h; }
    if (!touch()) return null;
    let best = null, bd = 14; L.forEach(h => { if (h.bg) return; const dx = Math.max(h.x - p.x, 0, p.x - h.x - h.w), dy = Math.max(h.y - p.y, 0, p.y - h.y - h.h), d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = h; } }); return best;
  };
  const stop = e => { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); };
  let down = null;
  const start = e => {
    const E = kitCur(); if (!E) return; stop(e);
    if (e.touches && e.touches.length !== 1) { down = null; return; }
    if (e.type === 'mousedown' && e.button) return;
    const p = pos(e), h = hitAt(E, p, q => !!q.move), m = E.S && E.S.maps.main;
    down = { p, moved: false, id: h ? h.id : null, pan: null };
    if (h) { E.hover = h.id; cv.style.cursor = 'grabbing'; }
    else if (kitHasWin(E) && m && difInside(m, p.x, p.y)) down.pan = { m, win: Object.assign({}, m.win) };
  };
  const move = e => {
    const E = kitCur(); if (!E) return; stop(e);
    if (e.type === 'mouseleave') { if (!down && E.hover !== null) { E.hover = null; kitRedraw(); } return; }
    const p = pos(e);
    if (down) {
      if (Math.hypot(p.x - down.p.x, p.y - down.p.y) > 4) down.moved = true;
      if (!down.moved) return;
      if (down.id !== null) {
        const h = ((E.S && E.S.hits) || []).find(q => q.move && q.id === down.id);
        if (h) { h.move(p.x, p.y); kitFix(E); kitRedraw(); kitCardSoon(E); }
      } else if (down.pan) {
        const m = down.pan.m, w = down.pan.win, dx = (p.x - down.p.x) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - down.p.y) / (m.B - m.T) * (w.y1 - w.y0);
        E.P[E.view].win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy }; kitRedraw();
      }
      return;
    }
    const h = hitAt(E, p, q => q.id !== undefined && !q.bg), id = h ? h.id : null;
    if (E.hover !== id) { E.hover = id; kitRedraw(); }
    cv.style.cursor = h ? (h.move ? 'grab' : 'pointer') : (hitAt(E, p, q => !!q.on) ? 'pointer' : '');
  };
  const end = e => {
    const E = kitCur(); if (!E) return; if (e.type !== 'mouseup' || e.target === cv) stop(e);
    const d = down; down = null; if (!d) return;
    cv.style.cursor = '';
    if (d.moved) { if (d.id !== null || d.pan) { kitRefreshUI(E); kitCommit(); } if (touch()) { E.hover = null; kitRedraw(); } return; }
    if (e.type === 'touchcancel') return;
    const h = hitAt(E, d.p, q => !!q.on);
    if (h) { h.on(d.p.x, d.p.y); kitFix(E); kitRefreshUI(E); kitRedraw(); kitCardSoon(E); kitCommit(); }
    if (touch() && E.hover !== null) { E.hover = null; kitRedraw(); }
  };
  const wheel = e => {
    const E = kitCur(); if (!E) return; stop(e); e.preventDefault();
    const m = E.S && E.S.maps.main; if (!kitHasWin(E) || !m) return;
    const p = pos(e); if (!difInside(m, p.x, p.y)) return;
    const f = stWheelF(e), cx = m.IX(p.x), cy = m.IY(p.y), w = m.win;
    const n = { x0: cx - (cx - w.x0) * f, x1: cx + (w.x1 - cx) * f, y0: cy - (cy - w.y0) * f, y1: cy + (w.y1 - cy) * f };
    if (n.x1 - n.x0 < 1e-3 || n.x1 - n.x0 > 1e5 || n.y1 - n.y0 < 1e-3 || n.y1 - n.y0 > 1e5) return;
    E.P[E.view].win = n; kitRedraw();
    clearTimeout(E.wt); E.wt = setTimeout(() => { if (kitCur() === E) { kitRefreshUI(E); kitCommit(); } }, 450);
  };
  const block = e => { if (kitActive()) stop(e); };
  cv.addEventListener('mousedown', start, { capture: true, passive: false });
  cv.addEventListener('touchstart', start, { capture: true, passive: false });
  ['mousemove', 'mouseleave', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, end, { capture: true, passive: false }));
  window.addEventListener('mouseup', e => { if (down && e.target !== cv) end(e); });
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  ['click', 'dblclick', 'contextmenu'].forEach(ev => cv.addEventListener(ev, block, { capture: true, passive: false }));
  const cl = document.getElementById('dif-card-close');
  if (cl) cl.addEventListener('click', () => { const E = kitCur(); if (!E) return; E.card = false; kitRefreshUI(E); kitRedraw(); kitCardRender(E); kitCommit(); });
  document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { const E = kitCur(); if (E) { E.cardKey = ''; kitRedraw(); } }, ms)); });
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { KIT, kitDefine, kitSanitize, kitCapture, kitApply, kitBuildScene, kitCtx };
