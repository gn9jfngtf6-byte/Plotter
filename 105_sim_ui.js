// ═══════════════════════════════════════════════════════════════════
// 105_sim_ui.js — Ähnlichkeit: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 103_sim.js, 103b_sim_docs.js (Sim). Bilder: 104_sim_draw.js. Aufbau wie 99d_inv_ui.js.
// Zustand SIM: Ansicht; Dreieck P (fix, Ecken ziehbar); Abbildung T = {z, k, phi, refl, psi, v};
// zweites Dreieck Q (Ansicht «Ähnlich oder nicht?»); Strahlensatzfigur ray; rechtwinkliges Dreieck rt; Ausschnitt; Anzeige.
// Ziehen: Ecken und Z frei (Raster 0.5, Shift = frei); A′, B′, C′: im Kreis um den Ursprung ziehen dreht, von Z weg bzw.
// zu Z hin ziehen streckt (je Ziehbewegung eines von beiden); Inneres des Bildes verschiebt;
// C (bzw. D) gleitet auf dem Strahl; C im rechtwinkligen Dreieck auf dem Thaleskreis.
// Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «sim»).
// ═══════════════════════════════════════════════════════════════════

const SIM_VIEWS = [['map', 'Ähnlichkeitsabbildungen'], ['test', 'Ähnlich oder nicht?'], ['ray', 'Strahlensätze'], ['right', 'Rechtwinkliges Dreieck mit Höhe']];
const SIM_DESC = {
  map: ['Wähle links eine Abbildung und vergleiche das Bild {{A′B′C′|A2,B2,C2}} mit dem Original {{ABC|A,B,C}}: Verschiebung, Drehung um den Ursprung, Spiegelung an der x- oder y-Achse und zentrische Streckung lassen alle Winkel gleich, alle Seiten stehen im Verhältnis |k|.', 'Das Dreieck ABC bleibt fest. Sein Bild A′B′C′ entsteht durch Verschieben, Drehen um den Ursprung O, Spiegeln an der x- oder y-Achse und zentrisches Strecken von Z aus. Die ersten drei Abbildungen erhalten alle Längen (Bild und Original sind kongruent), die Streckung multipliziert jede Länge mit |k|. Die Winkel bleiben immer gleich.'],
  test: ['Ziehe die Ecken von {{ABC|A,B,C}} und {{PQR|P,Q,R}}: Stimmen alle Winkel überein, sind die Dreiecke ähnlich, und alle entsprechenden Seitenverhältnisse sind gleich. Gleiche Farben zeigen, was sich entspricht.', 'Zwei Dreiecke (ABC und PQR) sind ähnlich, wenn sie in allen Winkeln übereinstimmen. Dann sind auch alle entsprechenden Seitenverhältnisse gleich. Gleiche Farben zeigen, welche Ecken und Seiten sich entsprechen.'],
  ray: ['Ziehe {{Z|Z}}, {{A|A}}, {{B|B}} und {{C|C}}: Zwei Parallelen schneiden die Strahlen aus Z, die Dreiecke ZAB und ZCD sind ähnlich – daraus folgen die Strahlensätze. Mit «D frei» siehst du, dass es ohne Parallelen nicht mehr stimmt.', 'Werden zwei Strahlen mit Anfangspunkt Z von zwei Parallelen geschnitten, so sind die Dreiecke ZAB und ZCD ähnlich. Daraus folgen die Strahlensätze.'],
  right: ['Ziehe {{C|C}} auf dem Thaleskreis oder die Ecken {{A|A}} und {{B|B}}: Die Höhe CD teilt das rechtwinklige Dreieck in zwei Teildreiecke, alle drei sind ähnlich (Winkel α, β, 90°). Rechts stehen sie in gleicher Lage nebeneinander.', 'Die Höhe CD teilt das rechtwinklige Dreieck ABC in zwei Teildreiecke. Alle drei Dreiecke haben die Winkel α, β und 90° und sind deshalb ähnlich: ΔADC ∼ ΔCDB ∼ ΔACB.']
};
const SIM_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const SIM_SHOW0 = { angles: true, lens: true, rays: true, card: true };
const SIM_P0 = [[1, 1], [4, 1], [2, 3]];     // im ersten Quadranten, weg von den Achsen: Spiegelbilder und Drehbilder überdecken das Original nicht
// Vorführungen der Abbildungen [Name, Abbildung]: zuerst die vier Grundabbildungen einzeln, dann Verknüpfungen
const SIM_DEMO = [
  ['Verschiebung', { z: [-1, -1], k: 1, phi: 0, refl: false, psi: 0, v: [4, 1.5] }],
  ['Drehung um den Ursprung (90°)', { z: [-1, -1], k: 1, phi: 90, refl: false, psi: 0, v: [0, 0] }],
  ['Drehung um den Ursprung (180°)', { z: [-1, -1], k: 1, phi: 180, refl: false, psi: 0, v: [0, 0] }],
  ['Spiegelung an der x-Achse', { z: [-1, -1], k: 1, phi: 0, refl: true, psi: 0, v: [0, 0] }],
  ['Spiegelung an der y-Achse', { z: [-1, -1], k: 1, phi: 0, refl: true, psi: 90, v: [0, 0] }],
  ['Zentrische Streckung (k = 2)', { z: [-1, -1], k: 2, phi: 0, refl: false, psi: 0, v: [0, 0] }],
  ['Zentrische Streckung (k = 0.5)', { z: [-1, -1], k: 0.5, phi: 0, refl: false, psi: 0, v: [0, 0] }],
  ['Streckung mit negativem k (k = −1.5)', { z: [0, 0], k: -1.5, phi: 0, refl: false, psi: 0, v: [0, 0] }],
  ['Punktspiegelung an Z (k = −1)', { z: [0, 0], k: -1, phi: 0, refl: false, psi: 0, v: [0, 0] }],
  ['Drehstreckung um den Ursprung (90°, k = 1.5)', { z: [0, 0], k: 1.5, phi: 90, refl: false, psi: 0, v: [0, 0] }],
  ['Spiegelung und Verschiebung', { z: [-1, -1], k: 1, phi: 0, refl: true, psi: 90, v: [0, -4] }],
  ['Keine Abbildung (Bild = Original)', { z: [-1, -1], k: 1, phi: 0, refl: false, psi: 0, v: [0, 0] }]
];
const SIM_T0 = SIM_DEMO[5][1];                                        // Anfangsbild: zentrische Streckung
// Art der Abbildung (SIM.mk): EINE Grundabbildung — dann sind alle anderen Anteile ausgeschaltet, damit das Bild genau
// diese Abbildung zeigt (eine Drehung um O, die zusätzlich gestreckt oder verschoben ist, sieht nicht mehr wie eine
// Drehung um O aus) — oder 'mix': mehrere nacheinander.
const SIM_KINDS = [['trans', 'Verschiebung'], ['rot', 'Drehung um den Ursprung'], ['rx', 'Spiegelung an der x-Achse'], ['ry', 'Spiegelung an der y-Achse'], ['dil', 'Zentrische Streckung'], ['mix', 'Mehrere nacheinander']];
function simKindOf(T) {
  const K = Sim.kinds(T);
  if (K.length > 1) return 'mix';
  const k = K[0];
  return k === 'trans' ? 'trans' : k === 'rot' ? 'rot' : k === 'refl' ? (Sim.axisOf(T) === 'x' ? 'rx' : 'ry') : 'dil';
}
// Auf eine Grundabbildung umstellen: deren Werte bleiben (oder bekommen einen sichtbaren Startwert), alles andere wird neutral
function simSetKind(mk) {
  const T = SIM.T, o = { z: T.z.slice(), k: 1, phi: 0, refl: false, psi: 0, v: [0, 0] };
  if (mk === 'trans') o.v = Math.hypot(T.v[0], T.v[1]) > 1e-9 ? T.v.slice() : [4, 1.5];
  else if (mk === 'rot') o.phi = Math.abs(Sim.normA(T.phi)) > 1e-9 ? T.phi : 90;
  else if (mk === 'rx' || mk === 'ry') { o.refl = true; o.psi = mk === 'rx' ? 0 : 90; }
  else if (mk === 'dil') o.k = Math.abs(T.k - 1) > 1e-9 ? T.k : 2;
  else { SIM.mk = 'mix'; return; }
  SIM.T = o; SIM.mk = mk;
}
// Beispiele für «Ähnlich oder nicht?» [Name, P, Q]
const SIM_TEST = [
  ['Ähnlich: gedreht und gestreckt', [[-4, 0], [-1, 0], [-3, 2]], [[4, -2], [4, 2.5], [1, -0.5]]],
  ['Ähnlich: gespiegelt', [[-4, 0], [-1, 0], [-3, 2]], [[5, 0], [0.5, 0], [3.5, 3]]],
  ['Ähnlich: verkleinert', [[-4, -1], [0, -1], [-1, 2]], [[2, 1], [4, 1], [3.5, 2.5]]],
  ['Kongruent (k = 1)', [[-4, 0], [-1, 0], [-3, 2]], [[2, 2], [2, -1], [0, 1]]],
  ['Fast ähnlich – aber nicht', [[-4, 0], [-1, 0], [-3, 2]], [[1, -0.5], [5.5, -0.5], [2, 3]]],
  ['Nicht ähnlich', [[-4, 0], [-1, 0], [-3, 2]], [[1, -1], [5, -1], [1, 2]]]
];
const SIM_RAY = [
  ['V-Figur', { Z: [-4, -2], A: [-1, 1], B: [0, -2], t: 2, s: 2, free: false }],
  ['V-Figur, C zwischen Z und A', { Z: [-4, -2], A: [1, 2], B: [2, -2], t: 0.5, s: 0.5, free: false }],
  ['X-Figur (C hinter Z)', { Z: [0, 0], A: [3, 2], B: [3, -1], t: -0.75, s: -0.75, free: false }],
  ['Nicht parallel (D frei)', { Z: [-4, -2], A: [-1, 1], B: [0, -2], t: 2, s: 1.6, free: true }]
];
const SIM_RT = [
  ['|AD| = 4, |DB| = 2.25 (wie im Dossier 16 : 9)', { A: [-3, 0], B: [3.25, 0], d: 4 }],
  ['Gleichschenklig (|AD| = |DB|)', { A: [-3, 0], B: [3, 0], d: 3 }],
  ['|AD| = 1, |DB| = 4', { A: [-2.5, 0], B: [2.5, 0], d: 1 }],
  ['Schräg liegend', { A: [-3, -1], B: [3, 2], d: 2.5 }]
];

function simDefaults() {
  return { view: 'map', P: SIM_P0.map(p => p.slice()), T: JSON.parse(JSON.stringify(SIM_T0)), mk: 'dil', Q: SIM_TEST[0][2].map(p => p.slice()), QP: SIM_TEST[0][1].map(p => p.slice()), ray: JSON.parse(JSON.stringify(SIM_RAY[0][1])), rt: JSON.parse(JSON.stringify(SIM_RT[0][1])), win: Object.assign({}, SIM_WIN0), show: Object.assign({}, SIM_SHOW0) };
}
const SIM = Object.assign(simDefaults(), { ui: null, S: null, drag: null, cardKey: '', cardT: 0 });
function simActive() { return typeof ENV !== 'undefined' && ENV.cur === 'sim'; }
const simR6 = x => Math.round(x * 1e6) / 1e6 + 0;
const simCopyP = P => P.map(p => [p[0], p[1]]);

// ── Rechenweg-Karte ──
function simCardDoc() {
  try {
    const v = SIM.view;
    if (v === 'map') return { t: 'Rechenweg: Ähnlichkeitsabbildung', d: Sim.doc(Sim.st.map(SIM.P, SIM.T)) };
    if (v === 'test') return { t: 'Rechenweg: Ähnlich oder nicht?', d: Sim.doc(Sim.st.test(SIM.QP, SIM.Q)) };
    if (v === 'ray') { const r = SIM.ray; return { t: 'Rechenweg: Strahlensätze', d: Sim.doc(Sim.st.ray(Sim.ray(r.Z, r.A, r.B, r.t, r.free ? r.s : null))) }; }
    const r = SIM.rt; return { t: 'Rechenweg: Rechtwinkliges Dreieck mit Höhe', d: Sim.doc(Sim.st.right(Sim.right(r.A, r.B, r.d))) };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
function simCardKey() { const v = SIM.view; const k = { map: [SIM.P, SIM.T], test: [SIM.QP, SIM.Q], ray: [SIM.ray], right: [SIM.rt] }[v]; return v + '|' + JSON.stringify(k); }
function simCardSoon() { clearTimeout(SIM.cardT); SIM.cardT = setTimeout(simCardRender, 40); }
function simCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = simActive() && SIM.show.card;
  if (simActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = simCardKey(); if (key === SIM.cardKey) return;
  SIM.cardKey = key;
  const r = simCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}

// ── Zustand sichern / laden ──
function simCapture() { return difCopy({ view: SIM.view, P: SIM.P, T: SIM.T, mk: SIM.mk, Q: SIM.Q, QP: SIM.QP, ray: SIM.ray, rt: SIM.rt, win: SIM.win, show: SIM.show }); }
function simApply(s) {
  const d = simDefaults(), num = (v, def) => { v = Number(v); return isFinite(v) && Math.abs(v) < 1e5 ? v : def; };
  const pt = (p, def) => (Array.isArray(p) && p.length === 2 ? [num(p[0], def[0]), num(p[1], def[1])] : def);
  const tri = (P, def) => (Array.isArray(P) && P.length === 3 ? P.map((p, i) => pt(p, def[i])) : def);
  if (s && typeof s === 'object') {
    if (SIM_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    d.P = tri(s.P, d.P); d.Q = tri(s.Q, d.Q); d.QP = tri(s.QP, d.QP);
    if (s.T && typeof s.T === 'object') { const T = s.T; d.T = { z: pt(T.z, d.T.z), k: num(T.k, d.T.k), phi: num(T.phi, 0), refl: !!T.refl, psi: num(T.psi, 0), v: pt(T.v, [0, 0]) }; d.T.psi = Sim.axisOf(d.T) === 'x' ? 0 : 90; /* nur x- oder y-Achse */ const kd = simKindOf(d.T); d.mk = SIM_KINDS.some(q => q[0] === s.mk) && (s.mk === 'mix' || s.mk === kd || !Sim.kinds(d.T).length) ? s.mk : kd; if (Math.abs(d.T.k) < 0.05) d.T.k = 1; }
    if (s.ray && typeof s.ray === 'object') { const r = s.ray; d.ray = { Z: pt(r.Z, d.ray.Z), A: pt(r.A, d.ray.A), B: pt(r.B, d.ray.B), t: num(r.t, d.ray.t), s: num(r.s, d.ray.s), free: !!r.free }; }
    if (s.rt && typeof s.rt === 'object') { const r = s.rt; d.rt = { A: pt(r.A, d.rt.A), B: pt(r.B, d.rt.B), d: num(r.d, d.rt.d) }; }
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1), c = ok(w.y0), e = ok(w.y1);
      if (a !== null && b !== null && c !== null && e !== null && b > a && e > c) d.win = { x0: a, x1: b, y0: c, y1: e };
    }
    if (s.show && typeof s.show === 'object') Object.keys(SIM_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  SIM.drag = null;
  Object.keys(d).forEach(k => { SIM[k] = d[k]; });
  SIM.cardKey = '';
  simRefreshUI(); difRedraw(); simCardSoon();
}

// ── Zeichnen ──
function simCtx(W, H, exp) {
  return { view: SIM.view, P: SIM.view === 'test' ? SIM.QP : SIM.P, T: SIM.T, mk: SIM.mk, Q: SIM.Q, ray: SIM.ray, rt: SIM.rt, win: SIM.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, smooth: !exp, show: SIM.show };
}
const simDock = w => (SIM.show.card && w >= 760 ? stCardW(w, 0.34) : 0);
const simDockH = (w, h) => (SIM.show.card && w < 760 ? Math.round(h * 0.5) : 0);
function simLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = simDock(w), dh = simDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function simDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  simLayoutCard(w, h);
  const W = w - simDock(w), Hs = h - simDockH(w, h);
  const S = stSoloBuild(simBuildScene, W, Hs, simCtx(W, Hs), 'sim|' + SIM.view + '|' + JSON.stringify(SIM.show), W < w || Hs < h);   // Karte offen: nur Bild (41_stat_draw.js)
  SIM.S = S; statPaint(S, W, Hs);
  simCardRender();
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function simLatex() { const W = 760, H = 520; const S = simBuildScene(W, H, simCtx(W, H, { fs: 11 })); return stSceneTex(S, W, H, (SIM_VIEWS.find(q => q[0] === SIM.view) || [0, ''])[1], 11); }
function simCardLatex() { const r = simCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.'; return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d); }
function simMakeLatex(which) { const ui = SIM.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? simCardLatex() : simLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function simCopyLatex() {
  const ui = SIM.ui; if (!ui) return; if (!ui.ta.value) simMakeLatex('pic');
  const done = () => { ui.msg.textContent = (typeof t === 'function' ? t('msg_copied') : 'Kopiert'); setTimeout(() => { ui.msg.textContent = ''; }, 2500); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ui.ta.value).then(done).catch(() => { ui.ta.select(); document.execCommand('copy'); done(); });
  else { ui.ta.select(); document.execCommand('copy'); done(); }
}

// ── Ausschnitt ──
function simResolvedWin() { const m = SIM.S && SIM.S.maps.main; if (m) return Object.assign({}, m.win); const w = SIM.win; return w.x0 !== null && isFinite(w.x0) ? Object.assign({}, w) : { x0: -6, x1: 6, y0: -4, y1: 4 }; }
function simZoom(f, cx, cy) {
  const w = simResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f, ny0 = cy - (cy - w.y0) * f, ny1 = cy + (w.y1 - cy) * f;
  if (nx1 - nx0 < 0.5 || nx1 - nx0 > 1e4) return;
  SIM.win = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 };
}
function simResetWin() { SIM.win = Object.assign({}, SIM_WIN0); if (typeof AUTOWIN !== 'undefined') delete AUTOWIN.sim; simRefreshUI(); difRedraw(); simCardSoon(); difCommit(); }

// ── Panel ──
function simBuildUI() {
  if (SIM.ui || !$dif('sim-panel')) return;
  const ui = SIM.ui = {}, body = $dif('sim-body');
  ui.sel = $dif('sim-view');
  SIM_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { SIM.view = ui.sel.value; SIM.cardKey = ''; SIM.win = Object.assign({}, SIM_WIN0); simRefreshUI(); difRedraw(); simCardSoon(); difCommit(); });
  ui.desc = $dif('sim-desc');
  ui.ex = $dif('sim-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec');
  det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => simMakeLatex('pic')); ui.br.addEventListener('click', () => simMakeLatex('calc')); ui.bc.addEventListener('click', simCopyLatex);
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!simActive()) return; SIM.show.card = false; simRefreshUI(); difRedraw(); simCardRender(); difCommit(); });
  simRefreshUI();
}

function simRefreshUI() {
  const ui = SIM.ui; if (!ui) return;
  const v = SIM.view, sh = SIM.show, T = SIM.T;
  ui.sel.value = v;
  const d = SIM_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[1])); if (typeof envHint === 'function') envHint('sim', d[0], () => SIM.S);   // Hinweis als Überschrift über dem Bild
  const exs = v === 'map' ? SIM_DEMO : v === 'test' ? SIM_TEST : v === 'ray' ? SIM_RAY : SIM_RT;
  ui.ex.replaceChildren(Object.assign(difEl('option', null, v === 'map' ? 'Abbildung vorführen …' : 'Beispiel wählen …'), { value: '' }));
  exs.forEach((e, i) => { const o = difEl('option', null, e[0]); o.value = String(i); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const e = exs[+i];
    if (v === 'map') { SIM.T = JSON.parse(JSON.stringify(e[1])); SIM.mk = simKindOf(SIM.T); }
    else if (v === 'test') { SIM.QP = simCopyP(e[1]); SIM.Q = simCopyP(e[2]); }
    else if (v === 'ray') SIM.ray = JSON.parse(JSON.stringify(e[1]));
    else SIM.rt = JSON.parse(JSON.stringify(e[1]));
    SIM.win = Object.assign({}, SIM_WIN0); SIM.cardKey = ''; if (typeof AUTOWIN !== 'undefined') delete AUTOWIN.sim;   // neues Beispiel: Ausschnitt frisch einpassen
    simRefreshUI(); difRedraw(); simCardSoon(); difCommit();
  };
  ui.params.replaceChildren();
  const P = ui.params;
  const redo = () => { simRefreshUI(); difRedraw(); simCardSoon(); difCommit(); };
  const touch = () => { SIM.cardKey = ''; difRedraw(); simCardSoon(); };
  const check = (label, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get();
    lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); row.appendChild(lb);
    inp.addEventListener('change', () => { set(inp.checked); SIM.cardKey = ''; redo(); });
    P.appendChild(row);
  };
  const numRow = (label, get, set, o) => {
    o = o || {}; const row = difEl('div', 'settings-row'); row.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no');
    lb.setAttribute('translate', 'no'); lb.style.minWidth = '62px';
    const ok = x => (o.ok ? o.ok(x) : true);
    const kinds0 = v === 'map' ? Sim.kinds(SIM.T).join() : '';
    const kindsChanged = () => v === 'map' && SIM.mk === 'mix' && Sim.kinds(SIM.T).join() !== kinds0;   // andere Abbildungsart: Hinweis und Felder neu aufbauen
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x) && ok(x)) { set(simR6(x)); touch(); difCommit(); if (kindsChanged()) { simRefreshUI(); return; } } inp.value = difFmtIn(get()); };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const nudge = s => difBtn(s > 0 ? '▶' : '◀', () => { const st = o.step || 0.5, x = simR6(Math.round((get() + s * st) / st) * st); if (ok(x)) { set(x); inp.value = difFmtIn(get()); touch(); difCommit(); if (kindsChanged()) simRefreshUI(); } }, s > 0 ? 'Grösser' : 'Kleiner');
    row.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(row); return inp;
  };
  const select = (label, opts, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label', null, label), sel = difEl('select'); sel.style.cssText = 'flex:1;min-width:0;';
    opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
    sel.value = get(); sel.addEventListener('change', () => { set(sel.value); SIM.cardKey = ''; redo(); });
    row.append(lb, sel); P.appendChild(row);
  };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const hint = txt => { const h = difEl('div', 'act-hint', txt); h.style.margin = '2px 2px 4px'; P.appendChild(h); };

  if (v === 'map') {
    const mk = SIM.mk;
    select('Abbildung', SIM_KINDS, () => SIM.mk, x => { simSetKind(x); SIM.win = Object.assign({}, SIM_WIN0); if (typeof AUTOWIN !== 'undefined') delete AUTOWIN.sim; });
    const rowsV = () => { numRow('nach rechts', () => T.v[0], x => { T.v[0] = x; }, { step: 0.5 }); numRow('nach oben', () => T.v[1], x => { T.v[1] = x; }, { step: 0.5 }); };
    const rowPhi = () => numRow('Winkel φ°', () => T.phi, x => { T.phi = Sim.normA(x); }, { step: 15 });
    const rowsK = () => { numRow('Faktor k', () => T.k, x => { T.k = x; }, { step: 0.25, ok: x => Math.abs(x) >= 0.1 && Math.abs(x) <= 10 }); numRow('Zentrum Z: x', () => T.z[0], x => { T.z[0] = x; }, { step: 0.5 }); numRow('Zentrum Z: y', () => T.z[1], x => { T.z[1] = x; }, { step: 0.5 }); };
    if (mk === 'trans') { group('Verschiebung'); rowsV(); hint('Du kannst das Bild auch mit der Maus verschieben.'); }
    else if (mk === 'rot') { group('Drehung um den Ursprung O'); rowPhi(); hint('Positiver Winkel: gegen den Uhrzeigersinn. Du kannst das Bild auch an einer Ecke drehen.'); }
    else if (mk === 'rx' || mk === 'ry') hint('Jede Ecke und ihr Bild liegen gleich weit von der ' + (mk === 'rx' ? 'x' : 'y') + '-Achse entfernt. Ziehe die Ecken von ABC.');
    else if (mk === 'dil') { group('Zentrische Streckung von Z aus'); rowsK(); hint('Du kannst Z und die Ecken des Bildes auch ziehen.'); }
    else {
      const K = Sim.kinds(T);
      hint('Reihenfolge: zuerst spiegeln, dann um O drehen, dann von Z aus strecken, zuletzt verschieben. Jetzt: ' + (K.length ? K.map(k => Sim.KIND_DE[k]).join(', dann ') : 'keine Abbildung') + '.');
      group('Spiegelung');
      select('Spiegeln an der', [['', 'nicht spiegeln'], ['x', 'x-Achse'], ['y', 'y-Achse']], () => (T.refl ? Sim.axisOf(T) : ''), x => { T.refl = !!x; if (x) T.psi = x === 'x' ? 0 : 90; });
      group('Drehung um den Ursprung O'); rowPhi();
      group('Zentrische Streckung von Z aus'); rowsK();
      group('Verschiebung'); rowsV();
    }
    if (mk !== 'rx' && mk !== 'ry') { const rb = difBtn('⟲ Bild auf das Original legen', () => { SIM.T = { z: T.z.slice(), k: 1, phi: 0, refl: false, psi: 0, v: [0, 0] }; redo(); }); rb.style.width = '100%'; rb.style.marginTop = '6px'; P.appendChild(rb); }
    group('Anzeige');
    check('Winkel markieren', () => sh.angles, x => { sh.angles = x; });
    check('Seitenlängen anzeigen', () => sh.lens, x => { sh.lens = x; });
    check('Hilfslinien vom Original zum Bild', () => sh.rays, x => { sh.rays = x; });
  } else if (v === 'test') {
    const t1 = Sim.tri(SIM.QP[0], SIM.QP[1], SIM.QP[2]), t2 = Sim.tri(SIM.Q[0], SIM.Q[1], SIM.Q[2]), M = Sim.match(t1, t2);
    hint(M.sim ? 'Die Dreiecke sind ähnlich (Faktor ' + Sim.n(M.k) + ').' : M.near ? 'Fast ähnlich: Die Winkel unterscheiden sich noch um bis zu ' + Sim.n(M.err, 1) + '°.' : 'Die Dreiecke sind nicht ähnlich.');
    group('Anzeige');
    check('Winkel anzeigen', () => sh.angles, x => { sh.angles = x; });
    check('Seitenlängen anzeigen', () => sh.lens, x => { sh.lens = x; });
    const sw = difBtn('⇄ Dreiecke tauschen', () => { const a = SIM.QP; SIM.QP = SIM.Q; SIM.Q = a; redo(); }); sw.style.width = '100%'; P.appendChild(sw);
  } else if (v === 'ray') {
    const r = SIM.ray;
    group('Lage von C und D');
    numRow('|ZC| : |ZA|', () => r.t, x => { r.t = x; if (!r.free) r.s = x; }, { step: 0.25, ok: x => Math.abs(x) >= 0.1 && Math.abs(x) <= 10 });
    check('D frei ziehen (CD nicht parallel)', () => r.free, x => { r.free = x; if (!x) r.s = r.t; });
    if (r.free) { numRow('|ZD| : |ZB|', () => r.s, x => { r.s = x; }, { step: 0.25, ok: x => Math.abs(x) >= 0.1 && Math.abs(x) <= 10 }); const pb = difBtn('∥ D auf die Parallele setzen', () => { r.s = r.t; redo(); }); pb.style.width = '100%'; P.appendChild(pb); }
    group('Anzeige');
    check('Winkel markieren', () => sh.angles, x => { sh.angles = x; });
    check('Längen anzeigen', () => sh.lens, x => { sh.lens = x; });
  } else {
    const r = SIM.rt, c = Sim.dist(r.A, r.B);
    group('Höhenfusspunkt D');
    numRow('|AD|', () => r.d, x => { r.d = x; }, { step: 0.25, ok: x => x > 0.05 && x < c - 0.05 });
    group('Anzeige');
    check('Winkel markieren', () => sh.angles, x => { sh.angles = x; });
    check('Längen anzeigen', () => sh.lens, x => { sh.lens = x; });
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { simZoom(0.7); redo(); }, 'Hineinzoomen'), difBtn('－', () => { simZoom(1 / 0.7); redo(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', simResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; });
}

// ── Maus und Berührung auf dem Canvas ──
function simInTri(q, p) {
  const s = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = s(q[0], q[1], p), d2 = s(q[1], q[2], p), d3 = s(q[2], q[0], p);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
// Ziehen: id → Zustand ändern (Weltkoordinaten x, y; d = Ziehzustand)
function simDragTo(id, x, y, shift, d) {
  const g = 0.5, sn = v => simR6(difSnap(v, g, shift)), v = SIM.view, P = [sn(x), sn(y)];
  if (v === 'map') {
    const T = SIM.T, idx = { A: 0, B: 1, C: 2 }[id], jdx = { A2: 0, B2: 1, C2: 2 }[id];
    if (idx !== undefined) SIM.P[idx] = P;
    else if (id === 'Z') T.z = P;
    else if (jdx !== undefined || id === 'IMG') {
      const mk = SIM.mk, vert = jdx !== undefined, Pj = vert ? SIM.P[jdx] : Sim.centroid(SIM.P);
      const move = () => { T.v = [sn(d.v0[0] + x - d.x0), sn(d.v0[1] + y - d.y0)]; };
      const turn = () => {                                              // um den Ursprung drehen: Winkel der Maus gegenüber dem Start
        if (Math.hypot(x, y) < 1e-9 || Math.hypot(d.x0, d.y0) < 1e-9) return;
        let phi = d.phi0 + Sim.deg(Math.atan2(y, x) - Math.atan2(d.y0, d.x0)); if (!shift) phi = Math.round(phi / 5) * 5; T.phi = simR6(Sim.normA(phi));
      };
      const stretch = () => {                                           // von Z aus strecken: Abstand der Maus von Z gegenüber dem Start
        const a = [d.x0 - T.v[0] - T.z[0], d.y0 - T.v[1] - T.z[1]], w = [x - T.v[0] - T.z[0], y - T.v[1] - T.z[1]], l2 = a[0] * a[0] + a[1] * a[1]; if (l2 < 1e-6) return;
        let k = d.k0 * (w[0] * a[0] + w[1] * a[1]) / l2; if (!shift) k = Math.round(k / 0.05) * 0.05; if (Math.abs(k) >= 0.1 && Math.abs(k) <= 10) T.k = simR6(k);
      };
      if (mk === 'trans') move();
      else if (mk === 'rot') turn();
      else if (mk === 'dil') stretch();
      else if (mk === 'mix') {
        if (!vert) move();
        else {
          // Eine Ziehbewegung dreht ODER streckt: Die Richtung der ersten Bewegung entscheidet (im Kreis → drehen; von Z weg → strecken)
          if (!d.mode) {
            const mx = x - d.x0, my = y - d.y0, ml = Math.hypot(mx, my); if (ml < (d.eps || 0.08)) return;
            const c = Sim.core(T, Pj), ray = Sim.sub(c, T.z), tan = [-c[1], c[0]];
            const cs = u => { const l = Math.hypot(u[0], u[1]); return l < 1e-9 ? 0 : Math.abs(mx * u[0] + my * u[1]) / (ml * l); };
            d.mode = Math.abs(T.k - 1) > 1e-9 && cs(ray) > cs(tan) ? 'k' : 'phi';
          }
          if (d.mode === 'k') { let k = Sim.solveK(T, Pj, [x, y]); if (k === null) return; if (!shift) k = Math.round(k / 0.05) * 0.05; if (Math.abs(k) >= 0.1 && Math.abs(k) <= 10) T.k = simR6(k); }
          else { let phi = Sim.solvePhi(T, Pj, [x, y]); if (phi === null) return; if (!shift) phi = Math.round(phi / 5) * 5; T.phi = simR6(Sim.normA(phi)); }
        }
      }                                                                 // Spiegelung: am Bild gibt es nichts zu ziehen
    }
  } else if (v === 'test') {
    const i = { A: 0, B: 1, C: 2 }[id], j = { P: 0, Q: 1, R: 2 }[id];
    if (i !== undefined) SIM.QP[i] = P; else if (j !== undefined) SIM.Q[j] = P;
    else if (id === 'T1' || id === 'T2') { const dx = sn(x - d.x0), dy = sn(y - d.y0), base = d.P0; const out = base.map(p => [simR6(p[0] + dx), simR6(p[1] + dy)]); if (id === 'T1') SIM.QP = out; else SIM.Q = out; }
  } else if (v === 'ray') {
    const r = SIM.ray;
    if (id === 'Z' || id === 'A' || id === 'B') { const old = r[id]; r[id] = P; if (Sim.dist(r.Z, r.A) < 0.2 || Sim.dist(r.Z, r.B) < 0.2) r[id] = old; }
    else if (id === 'C' || id === 'D') {
      const U = id === 'C' ? r.A : r.B, e = Sim.sub(U, r.Z), l2 = e[0] * e[0] + e[1] * e[1]; if (l2 < 1e-9) return;
      let t = ((x - r.Z[0]) * e[0] + (y - r.Z[1]) * e[1]) / l2;
      if (!shift) t = Math.round(t / 0.25) * 0.25;                       // schöne Verhältnisse |ZC| : |ZA|
      if (Math.abs(t) < 0.1 || Math.abs(t) > 10) return;
      t = simR6(t);
      if (id === 'C') { r.t = t; if (!r.free) r.s = t; } else r.s = t;
    }
  } else {
    const r = SIM.rt;
    if (id === 'A' || id === 'B') { const old = r[id], c0 = Sim.dist(r.A, r.B), q0 = r.d / c0; r[id] = P; const c = Sim.dist(r.A, r.B); if (c < 1) { r[id] = old; return; } r.d = simR6(Math.max(0.1, Math.min(c - 0.1, shift ? q0 * c : Math.round(q0 * c / 0.25) * 0.25))); }
    else if (id === 'C') {
      const c = Sim.dist(r.A, r.B), e = Sim.mul(Sim.sub(r.B, r.A), 1 / c);
      let dd = (x - r.A[0]) * e[0] + (y - r.A[1]) * e[1]; if (!shift) dd = Math.round(dd / 0.25) * 0.25;
      r.d = simR6(Math.max(Math.min(0.1, c / 4), Math.min(c - Math.min(0.1, c / 4), dd)));
    }
  }
  SIM.cardKey = '';
}
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = SIM.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + 4 && d < bd) { bd = d; best = q; } }); return best; };
  const inside = p => { const S = SIM.S; if (!S || !S.tris) return null; return S.tris.find(t => simInTri(t.q, [p.x, p.y])) || null; };
  const down = e => {
    if (!simActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = SIM.S; if (!S) return; const p = pos(e), m = S.maps.main;
    const q = near(p), tr = q ? null : inside(p);
    if (q || tr) {
      SIM.drag = { type: q ? q.id : tr.id, x0: m.IX(p.x), y0: m.IY(p.y), v0: SIM.T.v.slice(), P0: tr ? simCopyP(tr.id === 'T1' ? SIM.QP : SIM.Q) : null, phi0: SIM.T.phi, k0: SIM.T.k, eps: Math.abs(m.IX(p.x + 5) - m.IX(p.x)) };
      if (SIM.win.x0 === null) { SIM.win = simResolvedWin(); SIM.drag.auto = true; }
    } else if (inMap(m, p)) SIM.drag = { type: 'pan', px: p.x, py: p.y, w: simResolvedWin() };
    if (SIM.drag) cv.style.cursor = SIM.drag.type === 'pan' ? 'grabbing' : (tr ? 'move' : 'pointer');
  };
  const move = e => {
    if (!simActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = SIM.S; if (!S) return; const p = pos(e), d = SIM.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : inside(p) ? 'move' : (inMap(S.maps.main, p) ? 'crosshair' : ''); return; }
    const m = S.maps.main;
    if (d.type === 'pan') { const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0); SIM.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy }; }
    else simDragTo(d.type, m.IX(p.x), m.IY(p.y), e.shiftKey, d);
    difRedraw(); if (d.type !== 'pan') simCardSoon();
  };
  const up = e => {
    if (!simActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !SIM.drag) return;
    if (SIM.drag) { if (SIM.drag.auto) SIM.win = Object.assign({}, SIM_WIN0); SIM.drag = null; cv.style.cursor = ''; simRefreshUI(); difRedraw(); simCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!simActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = SIM.S; if (!S) return; const p = pos(e), m = S.maps.main; if (!inMap(m, p)) return;
    simZoom(stWheelF(e), m.IX(p.x), m.IY(p.y)); difRedraw();
    clearTimeout(SIM._wt); SIM._wt = setTimeout(() => { simRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!simActive()) return; e.stopImmediatePropagation(); e.preventDefault(); simResetWin(); };
  const stop = e => { if (simActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { SIM.cardKey = ''; if (simActive()) { simCardRender(); simRefreshUI(); difRedraw(); } }, ms)); });
simBuildUI();
if (typeof module !== 'undefined' && module.exports) module.exports = {};
