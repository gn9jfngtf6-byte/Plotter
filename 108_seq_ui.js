// ═══════════════════════════════════════════════════════════════════
// 108_seq_ui.js — Folgen und Reihen: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 106_seq.js, 106b_seq_docs.js (Sq). Bilder: 107_seq_draw.js. Aufbau wie 99d_inv_ui.js.
// Umgebung «seq» (32_env.js). Die alte Folgen-Liste (13_sequences.js, #seq-old-panel) ist ausgeblendet.
// Zustand SEQ: Ansicht; Folge (explizit fn bzw. rekursiv a1 + rule), Glied k, Anzahl N; arithmetisch A, geometrisch G
// mit Zielwerten; Reihe sum; Grenzwert lim; Induktion ind; Ausschnitt; Anzeige.
// ═══════════════════════════════════════════════════════════════════

const SEQ_VIEWS = [['def', 'Folgen: explizit und rekursiv'], ['ari', 'Arithmetische Folgen'], ['geo', 'Geometrische Folgen'], ['sum', 'Reihen und Summenzeichen'], ['lim', 'Grenzwert und unendliche Reihe'], ['ind', 'Vollständige Induktion']];
const SEQ_DESC = {
  def: ['Eine Folge ist eine durchnummerierte Liste von Zahlen a₁, a₂, a₃, … Explizit berechnet man jedes Glied direkt aus n, rekursiv aus dem Vorgänger. Die Glieder erscheinen als Punkte (n | aₙ).', 'Tippe einen Term in n ein (z. B. 3n+1) oder wähle «rekursiv» und gib die Regel mit a für aₙ ein (z. B. a+3). Ziehe den violetten Punkt auf ein anderes Glied.'],
  ari: ['Bei einer arithmetischen Folge ist die Differenz d benachbarter Glieder konstant: aₙ = a₁ + (n − 1)·d. Die Punkte liegen auf einer Geraden (lineares Wachstum).', 'Ziehe a₁ und a₂ (das ändert d) oder die rote Zielgerade t: Welches Glied hat diesen Wert?'],
  geo: ['Bei einer geometrischen Folge ist der Quotient q benachbarter Glieder konstant: aₙ = a₁·qⁿ⁻¹. Für q > 1 exponentielles Wachstum, für 0 < q < 1 Zerfall.', 'Ziehe a₁ und a₂ (das ändert q) oder die rote Zielgerade t: Ab welchem Glied wird t überschritten?'],
  sum: ['Die Summe der ersten n Glieder heisst Reihe: sₙ = a₁ + … + aₙ. Arithmetisch: sₙ = n·(a₁ + aₙ)/2 (Trick von Gauss), geometrisch: sₙ = a₁·(qⁿ − 1)/(q − 1).', 'Ziehe den violetten Punkt bei den Partialsummen, um n zu ändern. Beim Gauss-Trick ergänzt die Folge rückwärts die Balken zu einem Rechteck.'],
  lim: ['Kommen die Glieder für grosse n einer Zahl beliebig nahe, ist das der Grenzwert. Zu jedem ε gibt es ein N, ab dem alle Glieder im ε-Streifen liegen. Eine unendliche geometrische Reihe hat für |q| < 1 den Wert a₁/(1 − q).', 'Ziehe den grünen Punkt, um den Streifen schmaler zu machen: Das N wandert nach rechts.'],
  ind: ['Vollständige Induktion: Gilt die Aussage für n = 1 (Anfang) und folgt sie für n + 1, wenn sie für n gilt (Schritt), dann gilt sie für alle n – wie bei fallenden Dominosteinen.', 'Wähle eine Aussage und lass mit «Schritt» die Dominosteine fallen. Die letzte Aussage zeigt, warum Beispiele allein nichts beweisen.']
};
const SEQ_EX = {
  def: [['Streichhölzer: aₙ = 3n + 1', { mode: 'exp', fn: '3*n+1' }], ['Quadratzahlen: aₙ = n²', { mode: 'exp', fn: 'n^2' }], ['aₙ = 1/n', { mode: 'exp', fn: '1/n' }], ['aₙ = (−1)ⁿ', { mode: 'exp', fn: '(-1)^n' }], ['aₙ = n/(n + 1)', { mode: 'exp', fn: 'n/(n+1)' }], ['aₙ = 2ⁿ', { mode: 'exp', fn: '2^n' }],
    ['rekursiv: a₁ = 4, aₙ₊₁ = aₙ + 3', { mode: 'rec', a1: 4, rule: 'a+3' }], ['rekursiv: a₁ = 1, aₙ₊₁ = 2aₙ + 1', { mode: 'rec', a1: 1, rule: '2*a+1' }], ['rekursiv: a₁ = 10, aₙ₊₁ = aₙ/2 + 1', { mode: 'rec', a1: 10, rule: 'a/2+1' }], ['rekursiv: a₁ = 0.1, aₙ₊₁ = 2·aₙ (Papier falten)', { mode: 'rec', a1: 0.1, rule: '2*a' }]],
  ari: [['Kinosaal: 18 Plätze, +2 pro Reihe', { a1: 18, d: 2, t: 70 }], ['Streichhölzer: 4, 7, 10, …', { a1: 4, d: 3, t: 100 }], ['a₃ = 10, a₈ = 30 (d = 4, a₁ = 2)', { a1: 2, d: 4, t: 30 }], ['Abnehmend: 50, 46, 42, …', { a1: 50, d: -4, t: 2 }]],
  geo: [['Papier falten: 0.1 mm, ·2 (Ziel 1 m)', { a1: 0.1, q: 2, t: 1000 }], ['a₂ = 6, a₅ = 162 (q = 3): ab wann > 10⁶?', { a1: 2, q: 3, t: 1000000 }], ['Bakterien: 100, +50 % pro Stunde', { a1: 100, q: 1.5, t: 10000 }], ['Zerfall: 80, halbiert sich', { a1: 80, q: 0.5, t: 1 }], ['Wechselnde Vorzeichen: 3, −6, 12, …', { a1: 3, q: -2, t: null }]],
  sum: [['Gauss: 1 + 2 + … + 100', { type: 'ari', a1: 1, d: 1, n: 100 }], ['Kinosaal: Plätze in 20 Reihen', { type: 'ari', a1: 18, d: 2, n: 20 }], ['Σ (3k + 1), k = 1 … 20', { type: 'ari', a1: 4, d: 3, n: 20 }], ['Schachbrett: 1 + 2 + 4 + … (64 Felder)', { type: 'geo', a1: 1, q: 2, n: 64 }], ['Σ 5·2ᵏ⁻¹, k = 1 … 6', { type: 'geo', a1: 5, q: 2, n: 6 }], ['Halber Weg: 1/2 + 1/4 + …', { type: 'geo', a1: 0.5, q: 0.5, n: 10 }]],
  lim: [['aₙ = (3n + 1)/(n + 2)', { type: 'seq', fn: '(3*n+1)/(n+2)', eps: 0.1 }], ['aₙ = 1/n', { type: 'seq', fn: '1/n', eps: 0.05 }], ['aₙ = (2n² + 1)/(5n² − n)', { type: 'seq', fn: '(2*n^2+1)/(5*n^2-n)', eps: 0.02 }], ['aₙ = (−1)ⁿ/n', { type: 'seq', fn: '(-1)^n/n', eps: 0.1 }], ['aₙ = (1 + 1/n)ⁿ → e', { type: 'seq', fn: '(1+1/n)^n', eps: 0.05 }], ['aₙ = n² (divergent)', { type: 'seq', fn: 'n^2', eps: 0.1 }], ['aₙ = (−1)ⁿ (divergent)', { type: 'seq', fn: '(-1)^n', eps: 0.1 }],
    ['Reihe 8 + 4 + 2 + 1 + …', { type: 'ser', a1: 8, q: 0.5, eps: 0.5 }], ['Reihe 1/2 + 1/4 + 1/8 + … (halber Weg)', { type: 'ser', a1: 0.5, q: 0.5, eps: 0.05 }], ['Reihe 1 − 1/2 + 1/4 − …', { type: 'ser', a1: 1, q: -0.5, eps: 0.05 }]]
};
const SEQ_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const SEQ_SHOW0 = { steps: true, stem: false, line: true, gauss: true, vals: true, card: true };

function seqDefaults() {
  return { view: 'def', mode: 'exp', fn: '3*n+1', a1: 4, rule: 'a+3', k: 5, N: 12, A: { a1: 18, d: 2 }, kA: 5, tA: 70, G: { a1: 0.1, q: 2 }, kG: 5, tG: 1000, NA: 30, NG: 15,
    sum: { type: 'ari', a1: 1, d: 1, q: 2, n: 10 }, lim: { type: 'seq', fn: '(3*n+1)/(n+2)', a1: 8, q: 0.5, eps: 0.1 }, NL: 40, ind: { id: 'odd', n: 3 },
    win: Object.assign({}, SEQ_WIN0), show: Object.assign({}, SEQ_SHOW0) };
}
const SEQ = Object.assign(seqDefaults(), { ui: null, S: null, drag: null, cardKey: '', cardT: 0 });
function seqActive() { return typeof ENV !== 'undefined' && ENV.cur === 'seq'; }
const seqR6 = x => Math.round(x * 1e6) / 1e6 + 0;
const seqClean = raw => String(raw || '').replace(/a_\{?\(?n\)?\}?/g, 'a');
function seqDefS() { return (SEQ.mode === 'rec' ? Sq.mkRec(SEQ.a1, SEQ.rule) : Sq.mkExp(SEQ.fn)) || Sq.mkExp('3*n+1'); }
function seqLimS() { return Sq.mkExp(SEQ.lim.fn) || Sq.mkExp('1/n'); }
const seqFieldUsed = () => SEQ.view === 'def' || (SEQ.view === 'lim' && SEQ.lim.type === 'seq');
function seqFieldRawState() { return SEQ.view === 'lim' ? SEQ.lim.fn : SEQ.mode === 'rec' ? SEQ.rule : SEQ.fn; }

// ── Eingabefeld ──
function seqSyncFields() {
  const f = $dif('seq-fn-input'); if (!f || !f._mlSetFromRaw) return;
  const raw = seqFieldRawState(); if (f.getAttribute('data-raw') !== raw && document.activeElement !== f) f._mlSetFromRaw(raw);
}
function seqApplyField() {
  const inp = $dif('seq-fn-input'), err = $dif('seq-err'); if (!inp) return;
  const raw = seqClean((inp.getAttribute('data-raw') || '').trim());
  if (!raw) { if (err) err.textContent = ''; return; }
  const rec = SEQ.view === 'def' && SEQ.mode === 'rec';
  const ok = rec ? Sq.mkRec(SEQ.a1, raw) : Sq.mkExp(raw);
  if (!ok) { if (err) err.textContent = rec ? 'Die Regel darf nur a (für aₙ) enthalten, z. B. a+3, 2a, a/2+1.' : 'Bitte einen Term in n eingeben, z. B. 3n+1, n², 1/n, (−1)ⁿ.'; return; }
  if (err) err.textContent = '';
  if (rec) { if (raw === SEQ.rule) return; SEQ.rule = raw; } else if (SEQ.view === 'lim') { if (raw === SEQ.lim.fn) return; SEQ.lim.fn = raw; } else { if (raw === SEQ.fn) return; SEQ.fn = raw; }
  SEQ.win = Object.assign({}, SEQ_WIN0); SEQ.cardKey = ''; seqRefreshUI(); difRedraw(); seqCardSoon(); difCommit();
}
function seqSetupFields() {
  const inp = $dif('seq-fn-input'); if (!inp || inp._seqSetup) return; inp._seqSetup = true;
  try {
    inp.mathVirtualKeyboardPolicy = 'manual';
    if (inp.shadowRoot) { const st = document.createElement('style'); st.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}'; inp.shadowRoot.appendChild(st); }
    inp._mlSetFromRaw = raw => { let latex = ''; try { latex = (raw && raw.trim()) ? rawToLatex(raw) : ''; } catch (ex) { latex = ''; } inp.setAttribute('data-raw', raw || ''); inp.value = latex; if (typeof _mlMoveCursorToEnd === 'function') _mlMoveCursorToEnd(inp); };
    if (typeof mlPrewarmFocus === 'function') mlPrewarmFocus(inp);
    inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(inp, -1); try { inp.select(); } catch (e) {} });
    inp.addEventListener('focusout', () => { inp.style.borderColor = ''; setTimeout(seqApplyField, 0); });
    inp.addEventListener('input', () => { let raw; try { raw = asciiMathToRaw(inp.getValue('ascii-math')); } catch (ex) { return; } inp.setAttribute('data-raw', raw); inp.style.borderColor = ''; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  } catch (e) { /* MathLive nicht verfügbar */ }
  seqSyncFields();
}

// ── Objekte für Szene und Rechenweg ──
const seqSumF = () => (SEQ.sum.type === 'ari' ? Sq.ari(SEQ.sum.a1, SEQ.sum.d) : Sq.geo(SEQ.sum.a1, SEQ.sum.q));
const seqIndI = () => Sq.IND.find(i => i.id === SEQ.ind.id) || Sq.IND[0];
function seqCardDoc() {
  try {
    const v = SEQ.view;
    if (v === 'def') { const S = seqDefS(); return { t: 'Rechenweg: Folge', d: Sq.doc(Sq.st.def(S, Math.min(SEQ.k, SEQ.N))) }; }
    if (v === 'ari') return { t: 'Rechenweg: Arithmetische Folge', d: Sq.doc(Sq.st.ari(Sq.ari(SEQ.A.a1, SEQ.A.d), SEQ.kA, SEQ.tA === null ? NaN : SEQ.tA)) };
    if (v === 'geo') return { t: 'Rechenweg: Geometrische Folge', d: Sq.doc(Sq.st.geo(Sq.geo(SEQ.G.a1, SEQ.G.q), SEQ.kG, SEQ.tG === null ? NaN : SEQ.tG)) };
    if (v === 'sum') return { t: 'Rechenweg: Reihe', d: Sq.doc(Sq.st.sum({ type: SEQ.sum.type, A: seqSumF(), G: seqSumF(), n: SEQ.sum.n })) };
    if (v === 'lim') return { t: 'Rechenweg: Grenzwert', d: Sq.doc(Sq.st.lim({ type: SEQ.lim.type, S: seqLimS(), G: Sq.geo(SEQ.lim.a1, SEQ.lim.q), eps: SEQ.lim.eps, n: SEQ.NL })) };
    return { t: 'Rechenweg: Vollständige Induktion', d: Sq.doc(Sq.st.ind(seqIndI(), Math.max(1, SEQ.ind.n))) };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
function seqCardKey() { return SEQ.view + '|' + JSON.stringify([SEQ.mode, SEQ.fn, SEQ.a1, SEQ.rule, SEQ.k, SEQ.N, SEQ.A, SEQ.kA, SEQ.tA, SEQ.G, SEQ.kG, SEQ.tG, SEQ.sum, SEQ.lim, SEQ.NL, SEQ.ind]); }
function seqCardSoon() { clearTimeout(SEQ.cardT); SEQ.cardT = setTimeout(seqCardRender, 40); }
function seqCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = seqActive() && SEQ.show.card;
  if (seqActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = seqCardKey(); if (key === SEQ.cardKey) return;
  SEQ.cardKey = key;
  const r = seqCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  body.innerHTML = r && r.d && typeof ST !== 'undefined' ? ST.renderDoc(r.d) : '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}

// ── Zustand ──
function seqCapture() { return difCopy({ view: SEQ.view, mode: SEQ.mode, fn: SEQ.fn, a1: SEQ.a1, rule: SEQ.rule, k: SEQ.k, N: SEQ.N, A: SEQ.A, kA: SEQ.kA, tA: SEQ.tA, G: SEQ.G, kG: SEQ.kG, tG: SEQ.tG, NA: SEQ.NA, NG: SEQ.NG, sum: SEQ.sum, lim: SEQ.lim, NL: SEQ.NL, ind: SEQ.ind, win: SEQ.win, show: SEQ.show }); }
function seqApply(s) {
  const d = seqDefaults(), num = (v, def, lo, hi) => { v = Number(v); return isFinite(v) && v >= (lo === undefined ? -1e9 : lo) && v <= (hi === undefined ? 1e9 : hi) ? v : def; };
  const str = (v, def) => (typeof v === 'string' && v.length < 200 ? v : def);
  if (s && typeof s === 'object') {
    if (SEQ_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    d.mode = s.mode === 'rec' ? 'rec' : 'exp';
    d.fn = Sq.mkExp(str(s.fn, '')) ? s.fn : d.fn; d.a1 = num(s.a1, d.a1); d.rule = Sq.mkRec(d.a1, str(s.rule, '')) ? s.rule : d.rule;
    d.k = Math.round(num(s.k, d.k, 1, 200)); d.N = Math.round(num(s.N, d.N, 2, 200)); d.kA = Math.round(num(s.kA, d.kA, 1, 200)); d.kG = Math.round(num(s.kG, d.kG, 1, 200));
    d.NA = Math.round(num(s.NA, d.NA, 2, 200)); d.NG = Math.round(num(s.NG, d.NG, 2, 200)); d.NL = Math.round(num(s.NL, d.NL, 5, 400));
    if (s.A && typeof s.A === 'object') d.A = { a1: num(s.A.a1, d.A.a1), d: num(s.A.d, d.A.d) };
    if (s.G && typeof s.G === 'object') { d.G = { a1: num(s.G.a1, d.G.a1), q: num(s.G.q, d.G.q) }; if (Math.abs(d.G.a1) < 1e-12) d.G.a1 = 1; if (Math.abs(d.G.q) < 1e-12) d.G.q = 2; }
    d.tA = s.tA === null ? null : num(s.tA, d.tA); d.tG = s.tG === null ? null : num(s.tG, d.tG);
    if (s.sum && typeof s.sum === 'object') d.sum = { type: s.sum.type === 'geo' ? 'geo' : 'ari', a1: num(s.sum.a1, 1), d: num(s.sum.d, 1), q: num(s.sum.q, 2), n: Math.round(num(s.sum.n, 10, 1, 1000)) };
    if (s.lim && typeof s.lim === 'object') d.lim = { type: s.lim.type === 'ser' ? 'ser' : 'seq', fn: Sq.mkExp(str(s.lim.fn, '')) ? s.lim.fn : d.lim.fn, a1: num(s.lim.a1, 8), q: num(s.lim.q, 0.5), eps: num(s.lim.eps, 0.1, 1e-6, 1e6) };
    if (s.ind && typeof s.ind === 'object') d.ind = { id: Sq.IND.some(i => i.id === s.ind.id) ? s.ind.id : 'odd', n: Math.round(num(s.ind.n, 3, 0, 8)) };
    if (s.win && typeof s.win === 'object') { const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null)); const a = ok(w.x0), b = ok(w.x1), c = ok(w.y0), e = ok(w.y1); if (a !== null && b !== null && c !== null && e !== null && b > a && e > c) d.win = { x0: a, x1: b, y0: c, y1: e }; }
    if (s.show && typeof s.show === 'object') Object.keys(SEQ_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  SEQ.drag = null; Object.keys(d).forEach(k => { SEQ[k] = d[k]; }); SEQ.cardKey = '';
  seqSyncFields(); seqRefreshUI(); difRedraw(); seqCardSoon();
}

// ── Zeichnen ──
function seqCtx(W, H, exp) {
  const v = SEQ.view;
  return { view: v, S: seqDefS(), k: SEQ.k, N: v === 'ari' ? SEQ.NA : v === 'geo' ? SEQ.NG : v === 'lim' ? SEQ.NL : SEQ.N, A: Sq.ari(SEQ.A.a1, SEQ.A.d), G: Sq.geo(SEQ.G.a1, SEQ.G.q), kA: SEQ.kA, kG: SEQ.kG, tA: SEQ.tA === null ? NaN : SEQ.tA, tG: SEQ.tG === null ? NaN : SEQ.tG,
    sum: { type: SEQ.sum.type, A: seqSumF(), G: seqSumF(), n: SEQ.sum.n }, lim: { type: SEQ.lim.type, S: seqLimS(), G: Sq.geo(SEQ.lim.a1, SEQ.lim.q), eps: SEQ.lim.eps }, ind: { I: seqIndI(), n: SEQ.ind.n },
    win: SEQ.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, smooth: !exp, show: SEQ.show };
}
const seqDock = w => (SEQ.show.card && w >= 760 ? stCardW(w, 0.36) : 0);
const seqDockH = (w, h) => (SEQ.show.card && w < 760 ? Math.round(h * 0.5) : 0);
function seqLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = seqDock(w), dh = seqDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function seqDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  seqLayoutCard(w, h); seqCardRender();
  const W = w - seqDock(w), Hs = h - seqDockH(w, h);
  const S = stSoloBuild(seqBuildScene, W, Hs, seqCtx(W, Hs), 'seq|' + SEQ.view + '|' + JSON.stringify(SEQ.show), W < w || Hs < h);
  SEQ.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function seqLatex() { const W = 760, H = 520; const S = seqBuildScene(W, H, seqCtx(W, H, { fs: 11 })); return stSceneTex(S, W, H, (SEQ_VIEWS.find(q => q[0] === SEQ.view) || [0, ''])[1], 11); }
function seqCardLatex() { const r = seqCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.'; return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d); }
function seqMakeLatex(which) { const ui = SEQ.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? seqCardLatex() : seqLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function seqCopyLatex() {
  const ui = SEQ.ui; if (!ui) return; if (!ui.ta.value) seqMakeLatex('pic');
  const done = () => { ui.msg.textContent = (typeof t === 'function' ? t('msg_copied') : 'Kopiert'); setTimeout(() => { ui.msg.textContent = ''; }, 2500); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ui.ta.value).then(done).catch(() => { ui.ta.select(); document.execCommand('copy'); done(); });
  else { ui.ta.select(); document.execCommand('copy'); done(); }
}

// ── Ausschnitt ──
function seqResolvedWin() { const m = SEQ.S && SEQ.S.maps.main; if (m) return Object.assign({}, m.win); const w = SEQ.win; return w.x0 !== null && isFinite(w.x0) ? Object.assign({}, w) : { x0: 0, x1: 12, y0: -2, y1: 10 }; }
function seqZoom(f, cx, cy) {
  const w = seqResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f, ny0 = cy - (cy - w.y0) * f, ny1 = cy + (w.y1 - cy) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return;
  SEQ.win = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 };
}
function seqResetWin() { SEQ.win = Object.assign({}, SEQ_WIN0); seqRefreshUI(); difRedraw(); seqCardSoon(); difCommit(); }

// ── Panel ──
function seqBuildUI() {
  if (SEQ.ui || !$dif('seq-panel')) return;
  const ui = SEQ.ui = {}, body = $dif('seq-body');
  ui.sel = $dif('seq-view');
  SEQ_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { SEQ.view = ui.sel.value; SEQ.cardKey = ''; SEQ.win = Object.assign({}, SEQ_WIN0); const er = $dif('seq-err'); if (er) er.textContent = ''; seqSyncFields(); seqRefreshUI(); difRedraw(); seqCardSoon(); difCommit(); });
  ui.desc = $dif('seq-desc'); ui.ex = $dif('seq-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec'); det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => seqMakeLatex('pic')); ui.br.addEventListener('click', () => seqMakeLatex('calc')); ui.bc.addEventListener('click', seqCopyLatex);
  const ap = $dif('seq-apply'); if (ap) ap.addEventListener('click', seqApplyField);
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!seqActive()) return; SEQ.show.card = false; seqRefreshUI(); difRedraw(); seqCardRender(); difCommit(); });
  seqRefreshUI();
}

function seqRefreshUI() {
  const ui = SEQ.ui; if (!ui) return;
  const v = SEQ.view, sh = SEQ.show;
  ui.sel.value = v;
  const dd = SEQ_DESC[v]; ui.desc.replaceChildren(difEl('div', null, dd[0]), Object.assign(difEl('div', null, dd[1]), { style: 'margin-top:5px;' }));
  // Eingabefeld
  const showF = seqFieldUsed();
  ['seq-f-row', 'seq-field-head', 'seq-err'].forEach(id => { const e = $dif(id); if (e) e.style.display = showF ? '' : 'none'; });
  const head = $dif('seq-field-head'); if (head) head.textContent = v === 'def' && SEQ.mode === 'rec' ? 'Regel (a steht für aₙ)' : 'Folge';
  const row = $dif('seq-f-row'); if (row && row.firstElementChild) { row.firstElementChild.textContent = v === 'def' && SEQ.mode === 'rec' ? 'aₙ₊₁ =' : 'aₙ ='; row.firstElementChild.setAttribute('translate', 'no'); }
  seqSyncFields();
  // Beispiele
  const exs = v === 'ind' ? Sq.IND.map(i => [i.name, { id: i.id }]) : SEQ_EX[v];
  ui.ex.replaceChildren(Object.assign(difEl('option', null, v === 'ind' ? 'Aussage wählen …' : 'Beispiel wählen …'), { value: '' }));
  exs.forEach((e, i) => { const o = difEl('option', null, e[0]); o.value = String(i); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const e = exs[+i][1];
    if (v === 'def') { SEQ.mode = e.mode; if (e.mode === 'exp') SEQ.fn = e.fn; else { SEQ.a1 = e.a1; SEQ.rule = e.rule; } }
    else if (v === 'ari') { SEQ.A = { a1: e.a1, d: e.d }; SEQ.tA = e.t; }
    else if (v === 'geo') { SEQ.G = { a1: e.a1, q: e.q }; SEQ.tG = e.t; if (e.t) { const r = Sq.solveGeo(Sq.geo(e.a1, e.q), e.t); SEQ.NG = Math.max(8, Math.min(60, r ? r.n + 2 : 15)); } }
    else if (v === 'sum') SEQ.sum = { type: e.type, a1: e.a1, d: e.d === undefined ? 1 : e.d, q: e.q === undefined ? 2 : e.q, n: e.n };
    else if (v === 'lim') SEQ.lim = Object.assign({}, SEQ.lim, e);
    else SEQ.ind = { id: e.id, n: 3 };
    if (v === 'ari' && isFinite(SEQ.tA)) { const r = Sq.solveAri(Sq.ari(SEQ.A.a1, SEQ.A.d), SEQ.tA); SEQ.NA = Math.max(8, Math.min(80, r.ok ? Math.round(r.n) + 3 : 20)); }
    const er = $dif('seq-err'); if (er) er.textContent = '';
    SEQ.win = Object.assign({}, SEQ_WIN0); SEQ.cardKey = ''; seqSyncFields(); seqRefreshUI(); difRedraw(); seqCardSoon(); difCommit();
  };
  ui.params.replaceChildren();
  const P = ui.params;
  const redo = () => { seqRefreshUI(); difRedraw(); seqCardSoon(); difCommit(); };
  const touch = () => { SEQ.cardKey = ''; difRedraw(); seqCardSoon(); };
  const check = (label, get, set) => { const r = difEl('div', 'settings-row'); r.style.gap = '8px'; const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get(); lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); r.appendChild(lb); inp.addEventListener('change', () => { set(inp.checked); SEQ.cardKey = ''; redo(); }); P.appendChild(r); };
  const select = (label, opts, get, set) => { const r = difEl('div', 'settings-row'); r.style.gap = '8px'; const lb = difEl('label', null, label), sel = difEl('select'); opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] }))); sel.value = get(); sel.addEventListener('change', () => { set(sel.value); SEQ.cardKey = ''; SEQ.win = Object.assign({}, SEQ_WIN0); seqSyncFields(); redo(); }); r.append(lb, sel); P.appendChild(r); };
  const numRow = (label, get, set, o) => {
    o = o || {}; const r = difEl('div', 'settings-row'); r.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = get() === null ? '' : difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no'); lb.setAttribute('translate', 'no'); lb.style.minWidth = '46px';
    const ok = x => (o.ok ? o.ok(x) : true), fix = x => (o.int ? Math.round(x) : seqR6(x));
    const apply = () => { if (o.empty && inp.value.trim() === '') { set(null); touch(); difCommit(); seqRefreshUI(); return; } const x = difParseNum(inp.value); if (isFinite(x) && ok(fix(x))) { set(fix(x)); touch(); difCommit(); } inp.value = get() === null ? '' : difFmtIn(get()); };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const nudge = s => difBtn(s > 0 ? '▶' : '◀', () => { const cur = get() === null ? 0 : get(), st = typeof o.step === 'function' ? o.step(cur, s) : (o.step || 1), x = fix(o.mul ? cur * Math.pow(st, s) : cur + s * st); if (ok(x)) { set(x); inp.value = difFmtIn(get()); touch(); difCommit(); } }, s > 0 ? 'Grösser' : 'Kleiner');
    r.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(r); return inp;
  };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const intIn = (lo, hi) => x => x >= lo && x <= hi;

  if (v === 'def') {
    select('Darstellung', [['exp', 'explizit: aₙ = Term in n'], ['rec', 'rekursiv: aₙ₊₁ aus aₙ']], () => SEQ.mode, x => { SEQ.mode = x; });
    if (SEQ.mode === 'rec') numRow('a₁', () => SEQ.a1, x => { SEQ.a1 = x; }, { step: 1, ok: x => !!Sq.mkRec(x, SEQ.rule) });
    group('Glieder');
    numRow('Glied k', () => SEQ.k, x => { SEQ.k = x; }, { int: true, ok: intIn(1, SEQ.N) });
    numRow('Anzahl', () => SEQ.N, x => { SEQ.N = x; SEQ.k = Math.min(SEQ.k, x); }, { int: true, step: 5, ok: intIn(2, 200) });
    group('Anzeige');
    if (SEQ.mode === 'rec') check('Pfeile vom Vorgänger zum Nachfolger', () => sh.steps, x => { sh.steps = x; });
    check('Senkrechte Stäbe zur n-Achse', () => sh.stem, x => { sh.stem = x; });
    check('Werte an den Punkten', () => sh.vals, x => { sh.vals = x; });
  } else if (v === 'ari' || v === 'geo') {
    const geo = v === 'geo', F = geo ? SEQ.G : SEQ.A;
    group(geo ? 'Startwert und Faktor' : 'Startwert und Differenz');
    numRow('a₁', () => F.a1, x => { F.a1 = x; }, { step: geo ? 0.5 : 1, ok: x => !geo || Math.abs(x) > 1e-9 });
    if (geo) numRow('q', () => F.q, x => { F.q = x; }, { step: 0.1, ok: x => Math.abs(x) > 1e-9 && Math.abs(x) < 100 });
    else numRow('d', () => F.d, x => { F.d = x; }, { step: 0.5 });
    group('Glieder und Zielwert');
    numRow('Glied k', () => (geo ? SEQ.kG : SEQ.kA), x => { if (geo) SEQ.kG = x; else SEQ.kA = x; }, { int: true, ok: intIn(1, 200) });
    numRow('Anzahl', () => (geo ? SEQ.NG : SEQ.NA), x => { if (geo) SEQ.NG = x; else SEQ.NA = x; }, { int: true, step: 5, ok: intIn(3, 200) });
    numRow('Ziel t', () => (geo ? SEQ.tG : SEQ.tA), x => { if (geo) SEQ.tG = x; else SEQ.tA = x; }, { step: geo ? 10 : 1, empty: true });
    group('Anzeige');
    check(geo ? 'Kurve durch die Punkte (für q > 0)' : 'Gerade durch die Punkte', () => sh.line, x => { sh.line = x; });
    check('Werte an den Punkten', () => sh.vals, x => { sh.vals = x; });
  } else if (v === 'sum') {
    const o = SEQ.sum;
    select('Art', [['ari', 'arithmetische Reihe'], ['geo', 'geometrische Reihe']], () => o.type, x => { o.type = x; });
    numRow('a₁', () => o.a1, x => { o.a1 = x; }, { step: 1 });
    if (o.type === 'ari') numRow('d', () => o.d, x => { o.d = x; }, { step: 1 });
    else numRow('q', () => o.q, x => { o.q = x; }, { step: 0.5, ok: x => Math.abs(x) > 1e-9 && Math.abs(x) < 20 });
    numRow('n', () => o.n, x => { o.n = x; }, { int: true, ok: intIn(1, 1000) });
    group('Anzeige');
    if (o.type === 'ari') check('Gauss-Trick: Folge rückwärts darüber', () => sh.gauss, x => { sh.gauss = x; });
  } else if (v === 'lim') {
    const o = SEQ.lim;
    select('Art', [['seq', 'Grenzwert einer Folge'], ['ser', 'unendliche geometrische Reihe']], () => o.type, x => { o.type = x; o.eps = x === 'ser' ? 0.5 : 0.1; });
    if (o.type === 'ser') { numRow('a₁', () => o.a1, x => { o.a1 = x; }, { step: 1 }); numRow('q', () => o.q, x => { o.q = x; }, { step: 0.1, ok: x => Math.abs(x) > 1e-9 && Math.abs(x) < 5 }); }
    group('Streifen und Anzahl');
    numRow('ε', () => o.eps, x => { o.eps = x; }, { step: 2, mul: true, ok: x => x > 1e-6 && x < 1e6 });
    numRow('Anzahl', () => SEQ.NL, x => { SEQ.NL = x; }, { int: true, step: 10, ok: intIn(5, 400) });
  } else {
    const I = seqIndI();
    if (!I.prime) { group('Dominosteine'); numRow('Schritt', () => SEQ.ind.n, x => { SEQ.ind.n = x; }, { int: true, ok: intIn(0, 8) }); }
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { seqZoom(0.7); redo(); }, 'Hineinzoomen'), difBtn('－', () => { seqZoom(1 / 0.7); redo(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', seqResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; });
}

// ── Maus und Berührung ──
function seqDragTo(id, x, y, shift) {
  const m = SEQ.S && SEQ.S.maps.main; if (!m) return;
  const sty = Stat.niceStep(m.win.y1 - m.win.y0, 40), sn = v => seqR6(difSnap(v, sty, shift)), v = SEQ.view, n = Math.max(1, Math.round(x));
  if (v === 'def' && id === 'K') SEQ.k = Math.min(SEQ.N, n);
  else if (v === 'ari' || v === 'geo') {
    const geo = v === 'geo', F = geo ? SEQ.G : SEQ.A;
    if (id === 'A1') { const a = sn(y); if (!geo || Math.abs(a) > 1e-9) F.a1 = a; }
    else if (id === 'A2') { const a2 = sn(y); if (!geo) F.d = seqR6(a2 - F.a1); else if (Math.abs(F.a1) > 1e-9) { let q0 = y / F.a1; if (!shift) q0 = Math.round(q0 * 20) / 20; q0 = Math.max(-10, Math.min(10, q0)); if (Math.abs(q0) >= 0.05) F.q = seqR6(q0); } }
    else if (id === 'K') { if (geo) SEQ.kG = Math.min(SEQ.NG, n); else SEQ.kA = Math.min(SEQ.NA, n); }
    else if (id === 'T') { if (geo) SEQ.tG = sn(y); else SEQ.tA = sn(y); }
  } else if (v === 'sum' && id === 'N') SEQ.sum.n = Math.min(40, n);
  else if (v === 'lim' && id === 'E') {
    const L = SEQ.lim.type === 'ser' ? Sq.sumInf(Sq.geo(SEQ.lim.a1, SEQ.lim.q)) : Sq.limit(seqLimS()).L;
    let e = Math.abs(y - L); if (!(e > 0)) return;
    if (!shift) { const p = Math.pow(10, Math.floor(Math.log10(e))); e = Math.round(e / p * 2) / 2 * p; }
    if (e > 1e-6) SEQ.lim.eps = seqR6(e);
  }
  SEQ.cardKey = '';
}
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = SEQ.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + 4 && d < bd) { bd = d; best = q; } }); return best; };
  const down = e => {
    if (!seqActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = SEQ.S; if (!S) return; const p = pos(e), q = near(p), m = S.maps.main;
    if (q) { SEQ.drag = { type: q.id }; if (SEQ.win.x0 === null) { SEQ.win = seqResolvedWin(); SEQ.drag.auto = true; } }
    else if (inMap(m, p)) SEQ.drag = { type: 'pan', px: p.x, py: p.y, w: seqResolvedWin() };
    if (SEQ.drag) cv.style.cursor = SEQ.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!seqActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = SEQ.S; if (!S) return; const p = pos(e), d = SEQ.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) ? 'crosshair' : ''); return; }
    const m = S.maps.main;
    if (d.type === 'pan') { const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0); SEQ.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy }; }
    else seqDragTo(d.type, m.IX(p.x), m.IY(p.y), e.shiftKey);
    difRedraw(); if (d.type !== 'pan') seqCardSoon();
  };
  const up = e => {
    if (!seqActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !SEQ.drag) return;
    if (SEQ.drag) { if (SEQ.drag.auto) SEQ.win = Object.assign({}, SEQ_WIN0); SEQ.drag = null; cv.style.cursor = ''; seqRefreshUI(); difRedraw(); seqCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!seqActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = SEQ.S; if (!S) return; const p = pos(e), m = S.maps.main; if (!inMap(m, p)) return;
    seqZoom(stWheelF(e), m.IX(p.x), m.IY(p.y)); difRedraw();
    clearTimeout(SEQ._wt); SEQ._wt = setTimeout(() => { seqRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!seqActive()) return; e.stopImmediatePropagation(); e.preventDefault(); seqResetWin(); };
  const stop = e => { if (seqActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { SEQ.cardKey = ''; if (seqActive()) { seqCardRender(); seqRefreshUI(); difRedraw(); } }, ms)); });
seqBuildUI();
document.addEventListener('DOMContentLoaded', () => setTimeout(seqSetupFields, 150));
if (typeof module !== 'undefined' && module.exports) module.exports = {};
