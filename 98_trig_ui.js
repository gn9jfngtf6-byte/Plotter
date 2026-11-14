// ═══════════════════════════════════════════════════════════════════
// 98_trig_ui.js — Trigonometrische Funktionen: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 96_trig.js, 96b_trig_docs.js (Trig). Bilder: 97_trig_draw.js (Szenen). Aufbau wie 95_exp_ui.js
// (Hilfsfunktionen aus 62_dif_ui.js, Karte #dif-card). Zustand TRIG: Ansicht, Winkel deg, Einheit unit,
// Funktion f(x) = a·sin(b(x − c)) + d (kind sin|cos), Verwandlung tt, Ausschnitt, Optionen, Animation.
// Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «trig»).
// ═══════════════════════════════════════════════════════════════════

const TRIG_VIEWS = [['circ', 'Einheitskreis → Sinus und Kosinus'], ['gen', 'Allgemeine Sinusfunktion a·sin(b(x−c))+d'], ['tan', 'Tangens und Beziehungen'], ['rt', 'Rechtwinkliges Dreieck: sin, cos, tan'], ['tri', 'Allgemeines Dreieck: Sinus- und Kosinussatz']];
const TRIG_DESC = {
  rt: ['Ziehe die Ecken {{A|A}} und {{B|B}}: Für den Winkel {{α|al}} ist a die {{Gegenkathete|gk}}, b die {{Ankathete|ak}} und c die {{Hypotenuse|hy}}. sin α, cos α und tan α sind ihre Verhältnisse – sie hängen nur vom Winkel ab, nicht von der Grösse des Dreiecks. Wähle oben, was gegeben ist.', 'Im rechtwinkligen Dreieck gilt bezogen auf einen spitzen Winkel α: sin α = Gegenkathete : Hypotenuse, cos α = Ankathete : Hypotenuse, tan α = Gegenkathete : Ankathete. Mit zwei bekannten Stücken (darunter eine Seite) berechnet man alle anderen; dazu kommen Pythagoras und α + β = 90°.'],
  tri: ['Ziehe die Ecken {{A|A}}, {{B|B}} und {{C|C}} und wähle, was {{gegeben|giv}} ist: Die {{übrigen Stücke|unk}} berechnet der Rechenweg mit dem Sinus- oder Kosinussatz. Die Beispiele zeigen Aufgaben aus der Vermessung.', 'Im allgemeinen Dreieck gelten der Sinussatz a : sin α = b : sin β = c : sin γ und der Kosinussatz a² = b² + c² − 2bc·cos α. Den Kosinussatz braucht man bei SSS und SWS, den Sinussatz bei WSW und SSW; bei SSW mit a < b kann es zwei Dreiecke geben.'],
  circ: ['Ziehe den {{Punkt P|P}} auf dem Einheitskreis oder lass den Winkel drehen: Die Höhe sin φ zeichnet rechts die {{Sinuskurve|sin,G}}, der waagrechte Abstand cos φ die {{Kosinuskurve|cos,GC}}. Besondere Winkel wie 30°, 45° und 60° liefern exakte Werte.', 'Am Einheitskreis (Radius 1) wird der Winkel φ gegen den Uhrzeigersinn abgetragen. Der Punkt P hat die Koordinaten (cos φ | sin φ): Kosinus = waagrechter Abstand, Sinus = Höhe. Im Bogenmass misst man den Winkel als Bogenlänge: 360° entsprechen 2π.'],
  gen: ['Ziehe den {{Startpunkt S|S}} (c und d), den {{Hochpunkt H|A}} (Amplitude) oder das {{Periodenende|T}} (b), oder starte die Verwandlung: Die {{Grundfunktion|base}} wird Schritt für Schritt in {{f(x) = a·sin(b(x − c)) + d|f}} verwandelt.', 'Die allgemeine Sinusfunktion f(x) = a·sin(b(x − c)) + d entsteht aus sin x: a streckt (Amplitude |a|, Hochpunkt), b ändert die Periode T = 2π/b (Periodenende), c verschiebt in x-Richtung (Phase), d in y-Richtung (Mittellinie y = d); Startpunkt S(c | d).'],
  tan: ['Ziehe den {{Punkt P|P}} auf dem Kreis: Der Tangens ist die Steigung des Strahls durch P, abzulesen an der senkrechten Tangente bei x = 1. Rechts entsteht der {{Graph von tan|f,G}}; nahe 90° wächst er über alle Grenzen (Polstelle).', 'Der Tangens ist das Verhältnis sin φ / cos φ – die Steigung des Strahls durch P. Am Einheitskreis liest man ihn an der senkrechten Tangente bei x = 1 ab. Wo der Kosinus 0 ist (90°, 270°, …), hat der Tangens Polstellen; seine Periode ist nur π.']
};
const TRIG_ANG_EX = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
// [a, b, c, d, kind, Anzeige]
const TRIG_GEN_EX = [[1, 1, 0, 0, 'sin', 'sin x'], [2, 1, 0, 0, 'sin', '2·sin x'], [1, 2, 0, 0, 'sin', 'sin(2x)'], [1, 0.5, 0, 0, 'sin', 'sin(x/2)'], [1, 1, Math.PI / 2, 0, 'sin', 'sin(x − π/2)'], [1, 1, 0, 1, 'sin', 'sin x + 1'], [-1, 1, 0, 0, 'sin', '−sin x'], [2, 2, Math.PI / 4, -1, 'sin', '2·sin(2(x − π/4)) − 1'], [1, 1, 0, 0, 'cos', 'cos x'], [3, 0.5, -Math.PI / 2, 1, 'cos', '3·cos(½(x + π/2)) + 1'], [1, Math.PI, 0, 0, 'sin', 'sin(πx)'], [0.5, 3, 0, 2, 'sin', '½·sin(3x) + 2']];
// Rechtwinkliges Dreieck: [Anzeige, a, b, gegeben]; allgemeines Dreieck: [Anzeige, Fall, A, B, C]
const TRIG_RT_EX = [['Leiter 5 m, Neigungswinkel 70° – wie hoch reicht sie?', 4.698, 1.710, 'ca'], ['Strasse mit 12 % Steigung – Steigungswinkel?', 12, 100, 'ab'], ['Turm: 50 m entfernt, Höhenwinkel 32°', 31.24, 50, 'ba'], ['Rampe: 1.2 m hoch, 8 m lang', 1.2, 7.909, 'ac'], ['Drachen: Schnur 60 m, Höhe 45 m', 45, 39.69, 'ac'], ['Zelt: Höhe 1.5 m, Winkel 50°', 1.5, 1.259, 'aa']];
const TRIG_TRI_EX = (() => { const RD = Math.PI / 180, wsw = (c, al, be) => { const b = c * Math.sin(be * RD) / Math.sin((al + be) * RD); return [[0, 0], [c, 0], [b * Math.cos(al * RD), b * Math.sin(al * RD)]]; }, sws = (b, c, al) => [[0, 0], [c, 0], [b * Math.cos(al * RD), b * Math.sin(al * RD)]], sss = (a, b, c) => { const al = Math.acos((b * b + c * c - a * a) / (2 * b * c)); return [[0, 0], [c, 0], [b * Math.cos(al), b * Math.sin(al)]]; }, ssw = (a, b, al) => { const C = [b * Math.cos(al * RD), b * Math.sin(al * RD)], x = C[0] + Math.sqrt(a * a - C[1] * C[1]); return [[0, 0], [x, 0], C]; };
  return [['Flussbreite: Basis 50 m, Winkel 62° und 71°', 'wsw', ...wsw(50, 62, 71)], ['Distanz hinter einem Hindernis: 120 m, 85 m, Winkel 54°', 'sws', ...sws(120, 85, 54)], ['Dreieckiges Grundstück: 40 m, 55 m, 70 m', 'sss', ...sss(40, 55, 70)], ['Zwei Lösungen (SSW): a = 8, b = 10, α = 40°', 'ssw', ...ssw(8, 10, 40)], ['Höhe eines Berges: Basis 300 m, Winkel 35° und 120°', 'wsw', ...wsw(300, 35, 120)]]; })();
const TRIG_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const TRIG_SHOW0 = { cos: true, tab: true, base: true, mid: true, amp: true, per: true, sc: false, card: true };

function trigDefaults() {
  return { view: 'circ', deg: 60, unit: 'deg', a: 2, b: 2, c: Math.PI / 4, d: -1, kind: 'sin', tt: 1, ra: 3, rb: 4, rgv: 'ab', tA: [0, 0], tB: [6, 0], tC: [2, 4], tg: 'sss', win: Object.assign({}, TRIG_WIN0), show: Object.assign({}, TRIG_SHOW0) };
}
const TRIG = Object.assign(trigDefaults(), { ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0 });
function trigActive() { return typeof ENV !== 'undefined' && ENV.cur === 'trig'; }

const trigR6 = x => Math.round(x * 1e6) / 1e6 + 0;
function trigF() { return Trig.mk(TRIG.a, TRIG.b, TRIG.c, TRIG.d, TRIG.kind); }
function trigSetF(F) { if (!F) return; TRIG.a = trigR6(F.a); TRIG.b = trigR6(F.b); TRIG.c = trigR6(F.c); TRIG.d = trigR6(F.d); TRIG.kind = F.kind; }

// ── Eingabefeld f(x) = a·sin(b(x − c)) + d ──
function trigParseRaw(raw) {
  let ast = null; try { ast = miParseRaw(String(raw || '').trim()); } catch (e) { return null; }
  const F = Trig.fromAst(ast); if (!F || F.deg) return null;
  if (F.b > 50 || F.b < 0.01 || Math.abs(F.a) > 1e4 || Math.abs(F.c) > 1e3 || Math.abs(F.d) > 1e4) return null;
  return F;
}
const trigFieldRaw = id => { const inp = $dif(id); return inp ? (inp.getAttribute('data-raw') || '') : ''; };
function trigSyncFields() {
  const f = $dif('trig-fn-input'); if (!f || !f._mlSetFromRaw) return;
  if (TRIG.view !== 'gen') return;
  const raw = Trig.raw(trigF()); if (f.getAttribute('data-raw') !== raw && document.activeElement !== f) f._mlSetFromRaw(raw);
}
function trigApplyField() {
  const raw = trigFieldRaw('trig-fn-input').trim(), err = $dif('trig-err');
  if (!raw) { if (err) err.textContent = ''; return; }
  const F = trigParseRaw(raw);
  if (!F) { if (err) err.textContent = 'Erlaubt sind a·sin(b(x − c)) + d und a·cos(…) + d, z.B. 2sin(3(x−1))+1, −cos(2x) oder sin(x−pi/2).'; return; }
  const cur = trigF();
  if (F.a === cur.a && F.d === cur.d && F.kind === cur.kind && Math.abs(F.b - cur.b) < 1e-9 && Math.abs(F.c - cur.c) < 1e-9) return;
  trigSetF(F); TRIG.win = Object.assign({}, TRIG_WIN0); TRIG.tt = 1;
  if (err) err.textContent = '';
  TRIG.cardKey = ''; trigRefreshUI(); difRedraw(); trigCardSoon(); difCommit();
}
function trigSetupFields() {
  const inp = $dif('trig-fn-input'); if (!inp || inp._trigSetup) return; inp._trigSetup = true;
  try {
    inp.mathVirtualKeyboardPolicy = 'manual';
    if (inp.shadowRoot) { const st = document.createElement('style'); st.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}'; inp.shadowRoot.appendChild(st); }
    inp._mlSetFromRaw = raw => { let latex = ''; try { latex = (raw && raw.trim()) ? rawToLatex(raw) : ''; } catch (ex) { latex = ''; } inp.setAttribute('data-raw', raw || ''); inp.value = latex; if (typeof _mlMoveCursorToEnd === 'function') _mlMoveCursorToEnd(inp); };
    if (typeof mlPrewarmFocus === 'function') mlPrewarmFocus(inp);
    inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(inp, -1); try { inp.select(); } catch (e) {} });
    inp.addEventListener('focusout', () => { inp.style.borderColor = ''; setTimeout(trigApplyField, 0); });
    inp.addEventListener('input', () => { let raw; try { raw = asciiMathToRaw(inp.getValue('ascii-math')); } catch (ex) { return; } inp.setAttribute('data-raw', raw); inp.style.borderColor = ''; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  } catch (e) { /* MathLive nicht verfügbar */ }
  trigSyncFields();
}

// ── Rechenweg-Karte (teilt sich das Element #dif-card) ──
function trigCardDoc() {
  try {
    const v = TRIG.view;
    if (v === 'rt') return { t: 'Rechenweg: Rechtwinkliges Dreieck', d: Trig.rtDoc(TRIG.ra, TRIG.rb, TRIG.rgv) };
    if (v === 'tri') return { t: 'Rechenweg: Sinus- und Kosinussatz', d: Trig.triDoc(TRIG.tA, TRIG.tB, TRIG.tC, TRIG.tg) };
    if (v === 'circ') return { t: 'Rechenweg: Einheitskreis', d: Trig.circDoc(TRIG.deg) };
    if (v === 'gen') return { t: 'Rechenweg: Allgemeine Sinusfunktion', d: Trig.genDoc(trigF()) };
    return { t: 'Rechenweg: Tangens', d: Trig.tanDoc(TRIG.deg) };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
function trigCardKey() {
  const v = TRIG.view, F = [TRIG.a, TRIG.b, TRIG.c, TRIG.d, TRIG.kind];
  const k = { rt: [TRIG.ra, TRIG.rb, TRIG.rgv], tri: [TRIG.tA, TRIG.tB, TRIG.tC, TRIG.tg], circ: [TRIG.deg, TRIG.unit], gen: F, tan: [TRIG.deg, TRIG.unit] }[v];
  return v + '|' + JSON.stringify(k);
}
function trigCardSoon() { clearTimeout(TRIG.cardT); TRIG.cardT = setTimeout(trigCardRender, 40); }
function trigCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = trigActive() && TRIG.show.card;
  if (trigActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = trigCardKey(); if (key === TRIG.cardKey) return;
  TRIG.cardKey = key;
  const r = trigCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}

// ── Zustand sichern / laden ──
// Winkel auf ±10 Umdrehungen begrenzen: grössere Werte zeigen nichts Neues und bremsen das Zeichnen
const trigClampDeg = x => Math.max(-3600, Math.min(3600, x));
function trigCapture() { return difCopy({ view: TRIG.view, deg: TRIG.deg, unit: TRIG.unit, a: TRIG.a, b: TRIG.b, c: TRIG.c, d: TRIG.d, kind: TRIG.kind, tt: TRIG.tt, ra: TRIG.ra, rb: TRIG.rb, rgv: TRIG.rgv, tA: TRIG.tA, tB: TRIG.tB, tC: TRIG.tC, tg: TRIG.tg, win: TRIG.win, show: TRIG.show }); }
function trigApply(s) {
  const d = trigDefaults(), num = (v, def) => { v = Number(v); return isFinite(v) ? v : def; };
  if (s && typeof s === 'object') {
    if (TRIG_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    ['deg', 'a', 'b', 'c', 'd'].forEach(key => { d[key] = num(s[key], d[key]); });
    d.deg = trigClampDeg(d.deg);
    if (d.a === 0) d.a = 1;
    if (!(d.b > 0)) d.b = 1;
    d.tt = Math.max(0, Math.min(1, num(s.tt, 1)));
    if (s.unit === 'rad' || s.unit === 'deg') d.unit = s.unit;
    if (s.kind === 'cos' || s.kind === 'sin') d.kind = s.kind;
    ['ra', 'rb'].forEach(key => { const v = num(s[key], d[key]); if (v > 0) d[key] = v; });
    if (Trig.RT_GIVEN.some(g => g[0] === s.rgv)) d.rgv = s.rgv;
    if (Trig.TRI_CASES.some(g => g[0] === s.tg)) d.tg = s.tg;
    ['tA', 'tB', 'tC'].forEach(key => { const p = s[key]; if (Array.isArray(p) && p.length === 2 && p.every(v => isFinite(Number(v)))) d[key] = p.map(Number); });
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1), c = ok(w.y0), e = ok(w.y1);
      if (a !== null && b !== null && c !== null && e !== null && b > a && e > c) d.win = { x0: a, x1: b, y0: c, y1: e };
    }
    if (s.show && typeof s.show === 'object') Object.keys(TRIG_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  TRIG.anim = null; TRIG.drag = null;
  Object.keys(d).forEach(k => { TRIG[k] = d[k]; });
  TRIG.cardKey = '';
  trigSyncFields(); trigRefreshUI(); difRedraw(); trigCardSoon();
}

// ── Zeichnen ──
function trigCtx(W, H, exp) {
  return { view: TRIG.view, deg: TRIG.deg, unit: TRIG.unit, F: trigF(), tt: TRIG.tt, win: TRIG.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, smooth: !exp, show: TRIG.show, cardOpen: !exp && TRIG.show.card, ra: TRIG.ra, rb: TRIG.rb, rgv: TRIG.rgv, tA: TRIG.tA, tB: TRIG.tB, tC: TRIG.tC, tg: TRIG.tg };
}
// Einheitskreis und Graph brauchen die Breite nebeneinander: dort steht die Rechenweg-Karte unten
const trigBandView = () => TRIG.view === 'circ' || TRIG.view === 'tan';
const trigDock = w => (TRIG.show.card && w >= 760 && !trigBandView() ? stCardW(w, 0.36) : 0);
const trigDockH = (w, h) => (TRIG.show.card && (w < 760 || trigBandView()) ? Math.round(h * (w < 760 ? 0.5 : 0.38)) : 0);
function trigLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = trigDock(w), dh = trigDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function trigDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  trigLayoutCard(w, h); trigCardRender();
  const W = w - trigDock(w), Hs = h - trigDockH(w, h);
  const S = stSoloBuild(trigBuildScene, W, Hs, trigCtx(W, Hs), 'trig|' + TRIG.view + '|' + JSON.stringify(TRIG.show), W < w || Hs < h);   // Karte offen: nur Bild (41_stat_draw.js)
  TRIG.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function trigLatex() {
  const W = 760, H = 520;
  const S = trigBuildScene(W, H, trigCtx(W, H, { fs: 11 }));
  return stSceneTex(S, W, H, (TRIG_VIEWS.find(q => q[0] === TRIG.view) || [0, ''])[1], 11);
}
function trigCardLatex() {
  const r = trigCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.';
  return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d);
}
function trigMakeLatex(which) { const ui = TRIG.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? trigCardLatex() : trigLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function trigCopyLatex() { texCopy(TRIG.ui, () => trigMakeLatex('pic')); }

// ── Ausschnitt (Graph rechts bzw. Hauptbild) ──
function trigResolvedWin() {
  const m = TRIG.S && TRIG.S.maps.main; if (m) return Object.assign({}, m.win);
  const w = TRIG.win; return w.x0 !== null && isFinite(w.x0) ? Object.assign({}, w) : { x0: -1, x1: 7, y0: -2, y1: 2 };
}
function trigZoom(f, cx, cy) {
  const w = trigResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f, ny0 = cy - (cy - w.y0) * f, ny1 = cy + (w.y1 - cy) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return;
  TRIG.win = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 };
}
function trigResetWin() { TRIG.win = Object.assign({}, TRIG_WIN0); trigRefreshUI(); difRedraw(); trigCardSoon(); difCommit(); }

// ── Panel ──
function trigBuildUI() {
  if (TRIG.ui || !$dif('trig-panel')) return;
  const ui = TRIG.ui = {}, body = $dif('trig-body');
  ui.sel = $dif('trig-view');
  TRIG_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { TRIG.view = ui.sel.value; TRIG.anim = null; TRIG.cardKey = ''; TRIG.win = Object.assign({}, TRIG_WIN0); trigRefreshUI(); difRedraw(); trigCardSoon(); difCommit(); });
  ui.desc = $dif('trig-desc');
  ui.ex = $dif('trig-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec');
  det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => trigMakeLatex('pic')); ui.br.addEventListener('click', () => trigMakeLatex('calc')); ui.bc.addEventListener('click', trigCopyLatex);
  const ap = $dif('trig-apply'); if (ap) ap.addEventListener('click', trigApplyField);
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!trigActive()) return; TRIG.show.card = false; trigRefreshUI(); difRedraw(); trigCardRender(); difCommit(); });
  trigRefreshUI();
}

function trigRefreshUI() {
  const ui = TRIG.ui; if (!ui) return;
  const v = TRIG.view, sh = TRIG.show;
  ui.sel.value = v;
  const d = TRIG_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[1])); if (typeof envHint === 'function') envHint('trig', d[0], () => TRIG.S);   // Hinweis als Überschrift über dem Bild
  const showF = v === 'gen';
  ['trig-f-row', 'trig-field-head'].forEach(id => { const e = $dif(id); if (e) e.style.display = showF ? '' : 'none'; });
  trigSyncFields();
  // Beispiele
  ui.ex.replaceChildren(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
  const exs = v === 'rt' ? TRIG_RT_EX.map(p => p[0]) : v === 'tri' ? TRIG_TRI_EX.map(p => p[0]) : v === 'gen' ? TRIG_GEN_EX.map(p => p[5]) : TRIG_ANG_EX.map(a => 'φ = ' + a + '° = ' + (a === 0 ? '0' : a === 180 ? 'π' : a === 360 ? '2π' : (a / 180 === 0.5 ? 'π/2' : a / 180 === 1.5 ? '3π/2' : (() => { const q = Trig.piFrac(a); return q ? (q.n === 1n ? '' : q.n) + 'π/' + q.d : ''; })())));
  exs.forEach((nm, i) => { const o = difEl('option', null, nm); o.value = String(i); o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const k = +i;
    if (v === 'rt') { const e = TRIG_RT_EX[k]; TRIG.ra = e[1]; TRIG.rb = e[2]; TRIG.rgv = e[3]; }
    else if (v === 'tri') { const e = TRIG_TRI_EX[k]; TRIG.tg = e[1]; TRIG.tA = e[2].map(trigR6); TRIG.tB = e[3].map(trigR6); TRIG.tC = e[4].map(trigR6); }
    else if (v === 'gen') { const e = TRIG_GEN_EX[k]; TRIG.a = e[0]; TRIG.b = e[1]; TRIG.c = e[2]; TRIG.d = e[3]; TRIG.kind = e[4]; TRIG.tt = 1; }
    else TRIG.deg = TRIG_ANG_EX[k];
    TRIG.anim = null; TRIG.win = Object.assign({}, TRIG_WIN0); const er = $dif('trig-err'); if (er) er.textContent = '';
    trigSyncFields(); TRIG.cardKey = ''; trigRefreshUI(); difRedraw(); trigCardSoon(); difCommit();
  };
  ui.params.replaceChildren(); ui.params._sync = [];   // Regler, die denselben Wert wie ein Zahlfeld zeigen, gleichen sich hier ab
  const P = ui.params;
  const redo = () => { trigRefreshUI(); difRedraw(); trigCardSoon(); difCommit(); };
  const touch = () => { TRIG.cardKey = ''; trigSyncFields(); difRedraw(); trigCardSoon(); };
  const check = (label, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get();
    lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); row.appendChild(lb);
    inp.addEventListener('change', () => { set(inp.checked); TRIG.cardKey = ''; redo(); });
    P.appendChild(row);
  };
  const select = (label, opts, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label', null, label), sel = difEl('select');
    opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
    sel.value = get(); sel.addEventListener('change', () => { set(sel.value); TRIG.cardKey = ''; redo(); });
    row.append(lb, sel); P.appendChild(row);
  };
  const numRow = (label, get, set, o) => {
    o = o || {}; const row = difEl('div', 'settings-row'); row.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no');
    lb.setAttribute('translate', 'no');
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x)) { set(trigR6(x)); touch(); difCommit(); } inp.value = difFmtIn(get()); (P._sync || []).forEach(f => f()); };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const nudge = s => difBtn(s > 0 ? '▶' : '◀', () => { const st = o.step || 1; set(trigR6(Math.round((get() + s * st) / st * 1e6) / 1e6 * st)); inp.value = difFmtIn(get()); touch(); difCommit(); (P._sync || []).forEach(f => f()); }, s > 0 ? 'Nach rechts' : 'Nach links');
    row.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(row); return inp;
  };
  const slider = (label, get, set, min, max, step, fmt) => {
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const F = fmt || difFmtIn;
    const val = difEl('b', null, F(get())); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    const lb = difEl('label', null, label); lb.setAttribute('translate', 'no');
    top.append(lb, val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = Math.max(min, Math.min(max, get())); sl.style.width = '100%';
    sl.addEventListener('input', () => { TRIG.anim = null; set(trigR6(parseFloat(sl.value))); val.textContent = F(get()); TRIG.cardKey = ''; difRedraw(); trigCardSoon(); trigSyncFields(); });
    P._sync.push(() => { sl.value = Math.max(min, Math.min(max, get())); val.textContent = F(get()); });
    // Während des Ziehens bleibt der Ausschnitt stehen; danach passt er sich einmal ruhig an
    const hold = () => { if (TRIG.win.x0 === null) { TRIG.win = trigResolvedWin(); TRIG._slAuto = true; } };
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => sl.addEventListener(ev, hold, { passive: true }));
    sl.addEventListener('change', () => { if (TRIG._slAuto) { TRIG.win = Object.assign({}, TRIG_WIN0); TRIG._slAuto = false; } trigRefreshUI(); difCommit(); difRedraw(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1); return sl;
  };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const angleRows = () => {
    group('Winkel φ');
    slider('φ', () => TRIG.deg, x => { TRIG.deg = Math.round(x); }, -360, 720, 1, x => difFmtIn(x) + '°');
    numRow('φ in °', () => TRIG.deg, x => { TRIG.deg = trigClampDeg(x); }, { step: 5 });
    select('Einheit im Graphen', [['deg', 'Grad (°)'], ['rad', 'Bogenmass (π)']], () => TRIG.unit, x => { TRIG.unit = x; TRIG.win = Object.assign({}, TRIG_WIN0); });
    const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:5px;';
    ab.append(difBtn(TRIG.anim ? '⏸ Anhalten' : '▶ Winkel drehen', trigAnimToggle), difBtn('⟲ φ = 0°', () => { TRIG.anim = null; TRIG.deg = 0; redo(); })); P.appendChild(ab);
  };

  if (v === 'rt') {
    select('Gegeben', Trig.RT_GIVEN, () => TRIG.rgv, x => { TRIG.rgv = x; });
    group('Katheten');
    numRow('a', () => TRIG.ra, x => { if (x > 0) TRIG.ra = x; }, { step: 0.5 }); numRow('b', () => TRIG.rb, x => { if (x > 0) TRIG.rb = x; }, { step: 0.5 });
  } else if (v === 'tri') {
    select('Gegeben', Trig.TRI_CASES, () => TRIG.tg, x => { TRIG.tg = x; });
    [['A', 'tA'], ['B', 'tB'], ['C', 'tC']].forEach(([nm, k]) => { group('Ecke ' + nm); numRow('x', () => TRIG[k][0], x => { TRIG[k] = [x, TRIG[k][1]]; }, { step: 1 }); numRow('y', () => TRIG[k][1], y => { TRIG[k] = [TRIG[k][0], y]; }, { step: 1 }); });
  } else if (v === 'circ') {
    angleRows();
    group('Anzeige');
    check('Kosinus zeigen', () => sh.cos, x => { sh.cos = x; });
    check('Tabelle besonderer Winkel', () => sh.tab, x => { sh.tab = x; });
  } else if (v === 'gen') {
    select('Grundfunktion', [['sin', 'Sinus'], ['cos', 'Kosinus']], () => TRIG.kind, x => { TRIG.kind = x; });
    group('a: Amplitude, b: Periode 2π/b, c: Verschiebung in x, d: Mittellinie');
    slider('a', () => TRIG.a, x => { if (x !== 0) TRIG.a = x; }, -4, 4, 0.1);
    slider('b', () => TRIG.b, x => { TRIG.b = Math.max(0.1, x); }, 0.1, 6, 0.1);
    slider('c', () => TRIG.c, x => { TRIG.c = x; }, -2 * Math.PI, 2 * Math.PI, Math.PI / 12, x => (Trig.piFrac(Trig.rad2deg(x)) ? Trig.piTex(Trig.piFrac(Trig.rad2deg(x))).replace(/\\frac\{(.*?)\}\{(.*?)\}/, '$1/$2').replace(/\\pi/g, 'π') : difFmtIn(x)));
    slider('d', () => TRIG.d, x => { TRIG.d = x; }, -4, 4, 0.5);
    group('Verwandlung der Grundfunktion');
    slider('Verwandlung', () => TRIG.tt, x => { TRIG.tt = x; }, 0, 1, 0.01);
    const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:5px;';
    ab.append(difBtn(TRIG.anim ? '⏸ Pause' : '▶ Grundfunktion verwandeln', trigAnimToggle), difBtn('Fertig', () => { TRIG.anim = null; TRIG.tt = 1; redo(); })); P.appendChild(ab);
    group('Anzeige');
    check('Grundfunktion zeigen', () => sh.base, x => { sh.base = x; });
    check('Mittellinie y = d', () => sh.mid, x => { sh.mid = x; });
    check('Amplitude markieren', () => sh.amp, x => { sh.amp = x; });
    check('Periode markieren', () => sh.per, x => { sh.per = x; });
  } else {
    angleRows();
    group('Anzeige');
    check('Sinus und Kosinus im Graphen zeigen', () => sh.sc, x => { sh.sc = x; });
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { trigZoom(0.7); redo(); }, 'Hineinzoomen'), difBtn('－', () => { trigZoom(1 / 0.7); redo(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', trigResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; });
}

// ── Animation: Winkel drehen (circ, tan) bzw. Grundfunktion verwandeln (gen) ──
function trigAnimToggle() {
  if (TRIG.anim) { TRIG.anim = null; trigRefreshUI(); difCommit(); return; }
  if (TRIG.view === 'gen' && TRIG.tt >= 1) TRIG.tt = 0;
  TRIG.anim = { last: 0 }; trigRefreshUI(); requestAnimationFrame(trigAnimFrame);
}
function trigAnimFrame(ts) {
  const a = TRIG.anim; if (!a) return;
  if (!trigActive()) { TRIG.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (TRIG.view === 'gen') {
    TRIG.tt = Math.min(1, TRIG.tt + dt / 8);
    if (TRIG.tt >= 1) { TRIG.anim = null; trigRefreshUI(); difRedraw(); difCommit(); return; }
    const all = TRIG.ui && TRIG.ui.params.querySelectorAll('input[type=range]'); if (all && all.length) { const sl = all[all.length - 1]; sl.value = TRIG.tt; const b = sl.parentNode.querySelector('b'); if (b) b.textContent = difFmtIn(trigR6(TRIG.tt)); }
  } else {
    TRIG.deg = trigR6(TRIG.deg + dt * 45); if (TRIG.deg > 720) TRIG.deg -= 720;
    const all = TRIG.ui && TRIG.ui.params.querySelectorAll('input[type=range]'); if (all && all.length) { const sl = all[0]; sl.value = TRIG.deg; const b = sl.parentNode.querySelector('b'); if (b) b.textContent = difFmtIn(Math.round(TRIG.deg)) + '°'; }
    TRIG.cardKey = ''; trigCardSoon();
  }
  difRedraw(); requestAnimationFrame(trigAnimFrame);
}

// ── Maus und Berührung auf dem Canvas ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = TRIG.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + hitR(4) && d < bd) { bd = d; best = q; } }); return best; };
  const mapOf = id => (TRIG.S ? (id === 'P' && TRIG.S.maps.circ ? TRIG.S.maps.circ : TRIG.S.maps.main) : null);
  const snapDeg = (d, shift) => trigR6(shift ? Math.round(d) : Math.round(d / 5) * 5);
  const setPt = (id, x, y, shift) => {
    const v = TRIG.view;
    if (v === 'rt' || v === 'tri') {
      const m = TRIG.S.maps.main, st = shift ? 1e-3 : Stat.niceStep(m.win.x1 - m.win.x0, 40), sn = u => trigR6(Math.round(u / st) * st);
      if (v === 'rt') { if (id === 'A') TRIG.rb = Math.max(st, sn(x)); else if (id === 'B') TRIG.ra = Math.max(st, sn(y)); }
      else { const k = { A: 'tA', B: 'tB', C: 'tC' }[id]; if (k) { const np = [sn(x), sn(y)], o = ['tA', 'tB', 'tC'].filter(q => q !== k).map(q => TRIG[q]); const ar = Math.abs((o[0][0] - np[0]) * (o[1][1] - np[1]) - (o[1][0] - np[0]) * (o[0][1] - np[1])); if (ar > 1e-6) TRIG[k] = np; } }
      TRIG.cardKey = ''; return;
    }
    if (v === 'circ' || v === 'tan') {
      if (id === 'P') { let d = Trig.rad2deg(Math.atan2(y, x)); if (d < 0) d += 360; TRIG.deg = snapDeg(d, shift); }
      else TRIG.deg = snapDeg(TRIG.unit === 'deg' ? x : Trig.rad2deg(x), shift);
    } else if (v === 'gen') {
      const m = TRIG.S.maps.main, st = Stat.niceStep(m.win.x1 - m.win.x0, 14), sty = Stat.niceStep(m.win.y1 - m.win.y0, 14);
      const snapPi = u => (shift ? u : Math.round(u / (Math.PI / 12)) * (Math.PI / 12));
      if (id === 'S') { TRIG.c = trigR6(snapPi(x)); TRIG.d = trigR6(difSnap(y - (TRIG.kind === 'cos' ? TRIG.a : 0), sty, shift)); }
      else if (id === 'A') { const a = trigR6(difSnap(y - TRIG.d, sty / 2, shift)); if (a !== 0) TRIG.a = a; }
      else if (id === 'T') { const T = snapPi(x) - TRIG.c; if (T > 0.2) TRIG.b = trigR6(shift ? 2 * Math.PI / T : Math.round(2 * Math.PI / T * 10) / 10 || 0.1); }
    }
    TRIG.cardKey = '';
  };
  const down = e => {
    if (!trigActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = TRIG.S; if (!S) return; const p = pos(e); if (TRIG.anim) { TRIG.anim = null; trigRefreshUI(); }
    const q = near(p);
    if (q) { TRIG.drag = { type: q.id, m: mapOf(q.id) }; if (TRIG.win.x0 === null && TRIG.drag.m === S.maps.main) { TRIG.win = trigResolvedWin(); TRIG.drag.auto = true; } }
    else if (inMap(S.maps.main, p)) TRIG.drag = { type: 'pan', px: p.x, py: p.y, w: trigResolvedWin() };
    if (TRIG.drag) cv.style.cursor = TRIG.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!trigActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = TRIG.S; if (!S) return; const p = pos(e), d = TRIG.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) ? 'crosshair' : ''); return; }
    if (d.type === 'pan') {
      const m = S.maps.main, w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0);
      TRIG.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy };
    } else { const m = d.m || S.maps.main; setPt(d.type, m.IX(p.x), m.IY(p.y), e.shiftKey); trigSyncFields(); }
    difRedraw(); if (d.type !== 'pan') trigCardSoon();
  };
  const up = e => {
    if (!trigActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !TRIG.drag) return;
    if (TRIG.drag) { if (TRIG.drag.auto) TRIG.win = Object.assign({}, TRIG_WIN0); TRIG.drag = null; cv.style.cursor = ''; trigRefreshUI(); difRedraw(); trigCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!trigActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = TRIG.S; if (!S) return; const p = pos(e), m = S.maps.main; if (!inMap(m, p)) return;
    trigZoom(stWheelF(e), m.IX(p.x), m.IY(p.y)); difRedraw();
    clearTimeout(TRIG._wt); TRIG._wt = setTimeout(() => { trigRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!trigActive()) return; e.stopImmediatePropagation(); e.preventDefault(); trigResetWin(); };
  const stop = e => { if (trigActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { TRIG.cardKey = ''; if (trigActive()) { trigCardRender(); trigRefreshUI(); difRedraw(); } }, ms)); });
trigBuildUI();
document.addEventListener('DOMContentLoaded', () => setTimeout(trigSetupFields, 150));
if (typeof module !== 'undefined' && module.exports) module.exports = {};
