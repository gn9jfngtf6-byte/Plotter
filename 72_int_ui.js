// ═══════════════════════════════════════════════════════════════════
// 72_int_ui.js — Integralrechnung: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 70_int.js, 70b_int_docs.js (Int). Bilder: 71_int_draw.js (Szenen). Wie die
// Differentialrechnung (62_dif_ui.js, von der Hilfsfunktionen und die Karte #dif-card übernommen werden).
// Zustand ITG: Ansicht, Funktionen f (und g), Grenzen a und b, Streifenzahl n, Stelle x, Ausschnitt, Optionen.
// Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «int»).
// ═══════════════════════════════════════════════════════════════════

const ITG_VIEWS = [['sum', 'Ober-/Untersumme → Integral'], ['hs', 'Integralfunktion und Hauptsatz'], ['rg', 'Stammfunktion mit Regeln'], ['pi', 'Partielle Integration (Bild)'], ['sub', 'Substitution (Bild)'], ['ar', 'Flächen zwischen Kurven'], ['rot', 'Rotationskörper']];
const ITG_DESC = {
  sum: ['Erhöhe die Anzahl n der Streifen (oder starte die Animation): {{Untersumme|lo}} und {{Obersumme|up}} nähern sich demselben Wert – dem Integral von {{f|f}} zwischen {{a|a}} und {{b|b}}. Ziehe a und b, um die Grenzen zu ändern.', 'Zwischen f und der x-Achse liegen von a bis b n gleich breite Rechtecke. Die Untersumme (grün) nimmt den kleinsten, die Obersumme (blau) den grössten Funktionswert jedes Streifens.'],
  hs: ['Ziehe den {{Punkt x|x}} oder klicke ins Bild: Unten zeigt die {{Integralfunktion Fa|Fa}}, wie viel Fläche unter {{f|f}} von {{a|a}} bis x gesammelt ist. Ihre {{Steigung|tan}} ist an jeder Stelle f(x) – das ist der Hauptsatz.', 'Oben der Graph von f mit der gefärbten Fläche von a bis x, unten die Integralfunktion Fa(x) = ∫ f. Ziehe den Punkt x: Der untere Punkt zeigt, wie viel Fläche bis dahin gesammelt wurde.'],
  rg: ['Gib eine Funktion ein und ziehe {{a|a}} und {{b|b}}: Rechts wird die {{Stammfunktion F|F}} mit den Integrationsregeln bestimmt und das Integral als F(b) − F(a) berechnet. Stammfunktionen unterscheiden sich nur um eine Konstante C.', 'Die Stammfunktion wird Schritt für Schritt mit den Integrationsregeln bestimmt. Danach folgt das bestimmte Integral zwischen a und b.'],
  ar: ['Ziehe {{a|a}} und {{b|b}} (oder wähle «zwischen f und g»): Die Fläche zwischen {{f|f}} und der x-Achse bzw. {{g|g}} wird an den Schnittstellen geteilt – Stücke darüber sind grün, darunter orange. Flächen zählen immer positiv.', 'Die Fläche zwischen f und der x-Achse (oder zwischen f und g) von a bis b wird an den Schnittstellen in Stücke geteilt. Stücke über der Achse (bzw. über g) sind grün, darunter orange.'],
  pi: ['Ziehe {{a|pa}}, {{b|pb}} und {{x|t}} auf der {{Kurve (u(x) | v(x))|cur}}: Die {{blaue Fläche|udv}} ∫ u dv und die {{grüne Fläche|vdu}} ∫ v du ergeben zusammen das grosse Rechteck u(b)·v(b) ohne das {{kleine graue|rect}} – das ist die partielle Integration.', 'Partielle Integration: ∫ u·v′ dx = [u·v] − ∫ u′·v dx. Im Bild läuft der Punkt (u(x) | v(x)) für x von a bis b. Die blaue Fläche links der Kurve ist ∫ u dv = ∫ u·v′ dx, die grüne Fläche unter der Kurve ist ∫ v du = ∫ v·u′ dx.'],
  sub: ['Ziehe den {{violetten Punkt|st}} oder die Grenzen {{a|sa}} und {{b|sb}}, oder starte die Verformung: Jeder Streifen unter {{f(g(x))·g′(x)|h}} wird über {{u = g(x)|g}} zu einem Streifen unter {{f(u)|fu}} – g′(x)-mal so breit, g′(x)-mal so niedrig, gleiche Fläche.', 'Substitution: ∫ f(g(x)) · g′(x) dx = ∫ f(u) du mit u = g(x). Links ist die Fläche von a bis b in gleich breite, farbige Streifen geteilt. In der Mitte bildet u = g(x) jede Streifengrenze auf die u-Achse ab, rechts liegen dieselben Streifen unter f(u).'],
  rot: ['Ziehe {{a|a}} und {{b|b}} und erhöhe die Zahl der {{Scheiben|disc}} (oder starte «▶ Graph drehen, dann Scheiben»): Der {{Graph von f|f}} dreht sich um die x-Achse, jede Scheibe hat das Volumen π·f(x)²·Δx, und ihre Summe nähert sich V = π ∫ f(x)² dx.', 'Dreht man den Graphen von f zwischen a und b um die x-Achse, entsteht ein Körper aus lauter dünnen Kreisscheiben. Jede Scheibe hat das Volumen π · f(x)² · Δx.']
};
// Beispiele: [Funktion, Anzeige, a, b]
const ITG_EX = [['x^2', 'x²', 0, 2], ['x^3', 'x³', 0, 2], ['x^2-4', 'x² − 4', -2, 2], ['-x^2+4', '−x² + 4', -2, 2], ['x^3-3*x', 'x³ − 3x', -2, 2], ['3*x^2-4*x+1', '3x² − 4x + 1', 0, 2], ['sqrt(x)', '√x', 0, 4], ['1/x', '1/x', 1, 3], ['sin(x)', 'sin(x)', 0, 3.1416], ['exp(x)', 'eˣ', 0, 2], ['x*exp(x)', 'x · eˣ', 0, 1]];
// Partielle Integration: [Anzeige, u, v, a, b, Stammfunktion von u′·v (falls die Regeln sie nicht finden), Begründung]
const ITG_PI_EX = [
  ['∫ x · eˣ dx   (u = x, v = eˣ)', 'x', 'exp(x)', 0.5, 1.5],
  ['∫ ln x dx = ∫ ln x · 1 dx   (u = ln x, v = x)', 'log(x)', 'x', 1, Math.E],
  ['∫ x · cos x dx   (u = x, v = sin x)', 'x', 'sin(x)', 0.3, 1.4],
  ['∫ x · ln x dx   (u = ln x, v = x²/2)', 'log(x)', 'x^2/2', 1, 2.5, 'x^2/4', 'Stammfunktion'],
  ['∫ x² · eˣ dx   (u = x², v = eˣ, zweimal partiell)', 'x^2', 'exp(x)', 0.5, 1.5, '2*x*exp(x)-2*exp(x)', 'nochmals partiell'],
  ['∫ arctan x dx = ∫ arctan x · 1 dx   (u = arctan x, v = x)', 'atan(x)', 'x', 0.3, 2, 'log(1+x^2)/2', 'Substitution']
];
// Substitution: [Anzeige, äussere Funktion f (in u), innere Funktion g(x), a, b]
const ITG_SUB_EX = [
  ['∫ cos(x²) · 2x dx   (u = x²)', 'cos(u)', 'x^2', 0, 1.5],
  ['∫ e^(x²) · 2x dx   (u = x²)', 'exp(u)', 'x^2', 0, 1],
  ['∫ (2x + 1)³ · 2 dx   (u = 2x + 1)', 'u^3', '2*x+1', 0, 1],
  ['∫ sin x · cos x dx   (u = sin x)', 'u', 'sin(x)', 0, 1.4],
  ['∫ ln(x) / x dx   (u = ln x)', 'u', 'log(x)', 1, 4],
  ['∫ 2x / (1 + x²) dx   (u = 1 + x²)', '1/u', '1+x^2', 0, 2],
  ['∫ √(x + 1) dx   (u = x + 1)', 'sqrt(u)', 'x+1', 0, 3]
];
const itgUtoX = r => String(r || '').replace(/(?<![A-Za-z])u(?![A-Za-z])/g, 'x');       // f wird mit u eingegeben, intern in x gerechnet
const itgXtoU = r => String(r || '').replace(/(?<![A-Za-z])x(?![A-Za-z])/g, 'u');
// Beispiele für f und g: [f, g, a, b]
const ITG_PAIRS = [['x^2', 'x+2', -1, 2], ['x^2', '2*x', 0, 2], ['x^3', 'x', -1, 1], ['-x^2+4', 'x^2-4', -2, 2], ['sin(x)', 'cos(x)', 0.7854, 3.927]];
const ITG_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const ITG_SHOW0 = { lower: true, upper: true, shade: true, tangent: true, fill: true, anti: true, family: false, card: true };

function itgDefaults() { return { view: 'sum', raw: 'x^2', rawG: 'x+2', mode: 'axis', a: 0, b: 2, n: 6, x: 1.5, rotN: 12, pu: 'x', pv: 'exp(x)', pa: 0.5, pb: 1.5, pt: 1, pex: 0, sf: 'cos(x)', sg: 'x^2', sa: 0, sb: 1.5, sn: 6, st: 0.8, sm: 0, win: Object.assign({}, ITG_WIN0), show: Object.assign({}, ITG_SHOW0) }; }
const ITG = Object.assign(itgDefaults(), { F: null, G: null, U: null, V: null, SF: null, SG: null, ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0 });

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
// Partielle Integration: u und v setzen (pex: Nummer des Beispiels mit bekannter Stammfunktion von u′·v, sonst −1)
function itgSetPi(rawU, rawV) {
  const U = Dif.makeFn(rawU), V = Dif.makeFn(rawV); if (!U || !V) return false;
  ITG.U = U; ITG.V = V; ITG.pu = U.raw; ITG.pv = V.raw; ITG.cardKey = '';
  ITG.pex = ITG_PI_EX.findIndex(e => e[1] === ITG.pu && e[2] === ITG.pv);
  return true;
}
function itgPiOk() { return !!(ITG.U && ITG.V); }
// Substitution: äussere Funktion f (Rohausdruck in x) und innere Funktion g setzen
function itgSetSub(rawF, rawG) {
  const F = Dif.makeFn(rawF), G = Dif.makeFn(rawG); if (!F || !G || !Int.subFn(F, G)) return false;
  ITG.SF = F; ITG.SG = G; ITG.sf = F.raw; ITG.sg = G.raw; ITG.cardKey = '';
  return true;
}
function itgSubOk() { return !!(ITG.SF && ITG.SG); }
// Hat die aktuelle Ansicht, was sie zum Zeichnen braucht?
function itgViewOk() { return ITG.view === 'pi' ? itgPiOk() : ITG.view === 'sub' ? itgSubOk() : !!ITG.F; }
function itgSetG(raw) { const G = Dif.makeFn(raw); ITG.G = G; ITG.cardKey = ''; if (G) ITG.rawG = G.raw; return !!G; }
const itgFieldRaw = id => { const inp = $dif(id); return inp ? (inp.getAttribute('data-raw') || '') : ''; };
function itgSyncFields() {
  const f = $dif('itg-fn-input'), g = $dif('itg-g-input'), pi = ITG.view === 'pi', sb = ITG.view === 'sub';
  const fr = pi ? ITG.pu : sb ? itgXtoU(ITG.sf) : ITG.raw, gr = pi ? ITG.pv : sb ? ITG.sg : ITG.rawG;
  if (f && f._mlSetFromRaw && f.getAttribute('data-raw') !== fr) f._mlSetFromRaw(fr);
  if (g && g._mlSetFromRaw && g.getAttribute('data-raw') !== gr) g._mlSetFromRaw(gr);
}
function itgApplyPi() {
  const ru = itgFieldRaw('itg-fn-input').trim(), rv = itgFieldRaw('itg-g-input').trim(), err = $dif('itg-err');
  if (!ru || !rv || (ru === ITG.pu && rv === ITG.pv && itgPiOk())) return;
  if (itgSetPi(ru, rv)) { if (err) err.textContent = ''; ITG.win = Object.assign({}, ITG_WIN0); itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); }
  else if (err) err.textContent = 'Diesen Ausdruck kann ich nicht auswerten. Erlaubt sind Funktionen von x.';
}
function itgApplySub() {
  const rf = itgUtoX(itgFieldRaw('itg-fn-input').trim()), rg = itgFieldRaw('itg-g-input').trim(), err = $dif('itg-err');
  if (!rf || !rg || (rf === ITG.sf && rg === ITG.sg && itgSubOk())) return;
  if (itgSetSub(rf, rg)) { if (err) err.textContent = ''; ITG.win = Object.assign({}, ITG_WIN0); itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); }
  else if (err) err.textContent = 'Diesen Ausdruck kann ich nicht auswerten. f mit u eingeben (z.B. cos(u)), g mit x (z.B. x^2).';
}
function itgApplyField() {
  if (ITG.view === 'pi') { itgApplyPi(); return; }
  if (ITG.view === 'sub') { itgApplySub(); return; }
  const raw = itgFieldRaw('itg-fn-input').trim(), err = $dif('itg-err');
  if (!raw) { if (err) err.textContent = ''; return; }
  if (raw === ITG.raw && ITG.F) return;
  if (itgSetFn(raw, false)) { if (err) err.textContent = ''; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); }
  else if (err) err.textContent = 'Diesen Ausdruck kann ich nicht auswerten. Erlaubt ist eine Funktion von x.';
}
function itgApplyGField() {
  if (ITG.view === 'pi') { itgApplyPi(); return; }
  if (ITG.view === 'sub') { itgApplySub(); return; }
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
      case 'sub': { if (!itgSubOk()) return null; return { t: 'Rechenweg: Substitution', d: Int.subDoc(ITG.SF, ITG.SG, ITG.sa, ITG.sb) }; }
      case 'pi': { if (!itgPiOk()) return null; const e = ITG_PI_EX[ITG.pex]; return { t: 'Rechenweg: Partielle Integration', d: Int.piDoc(ITG.U, ITG.V, ITG.pa, ITG.pb, e && e[5] ? { G: e[5], Gop: e[6] } : null) }; }
    }
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
  return null;
}
function itgCardKey() { const v = ITG.view; if (v === 'pi') return ['pi', ITG.pu, ITG.pv, ITG.pa, ITG.pb].join('|'); if (v === 'sub') return ['sub', ITG.sf, ITG.sg, ITG.sa, ITG.sb].join('|'); return [v, ITG.raw, v === 'ar' && ITG.mode === 'g' ? ITG.rawG : '', v === 'ar' ? ITG.mode : '', v === 'rg' || v === 'sum' || v === 'ar' || v === 'rot' ? ITG.a + ',' + ITG.b : '', v === 'hs' ? ITG.a + ',' + ITG.x : ''].join('|'); }
function itgCardSoon() { clearTimeout(ITG.cardT); ITG.cardT = setTimeout(itgCardRender, 40); }
function itgCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = itgActive() && ITG.show.card && itgViewOk();
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
function itgCapture() { return difCopy({ view: ITG.view, raw: ITG.raw, rawG: ITG.rawG, mode: ITG.mode, a: ITG.a, b: ITG.b, n: ITG.n, x: ITG.x, rotN: ITG.rotN, pu: ITG.pu, pv: ITG.pv, pa: ITG.pa, pb: ITG.pb, pt: ITG.pt, sf: ITG.sf, sg: ITG.sg, sa: ITG.sa, sb: ITG.sb, sn: ITG.sn, st: ITG.st, sm: ITG.sm, win: ITG.win, show: ITG.show }); }
function itgApply(s) {
  const d = itgDefaults();
  if (s && typeof s === 'object') {
    if (ITG_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    if (typeof s.raw === 'string' && s.raw.length < 400) d.raw = s.raw;
    if (typeof s.rawG === 'string' && s.rawG.length < 400) d.rawG = s.rawG;
    if (s.mode === 'g' || s.mode === 'axis') d.mode = s.mode;
    ['a', 'b', 'x', 'pa', 'pb', 'pt', 'sa', 'sb', 'st'].forEach(k => { const v = Number(s[k]); if (isFinite(v)) d[k] = v; });
    { const v = Math.round(Number(s.sn)); if (isFinite(v) && v >= 1 && v <= 60) d.sn = v; }
    { const v = Number(s.sm); if (isFinite(v) && v >= 0 && v <= 1) d.sm = v; }
    if (typeof s.sf === 'string' && s.sf.length < 400) d.sf = s.sf;
    if (typeof s.sg === 'string' && s.sg.length < 400) d.sg = s.sg;
    if (typeof s.pu === 'string' && s.pu.length < 400) d.pu = s.pu;
    if (typeof s.pv === 'string' && s.pv.length < 400) d.pv = s.pv;
    ['n', 'rotN'].forEach(k => { const v = Math.round(Number(s[k])); if (isFinite(v) && v >= 1 && v <= 5000) d[k] = v; });
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1); if (a !== null && b !== null && b > a) { d.win.x0 = a; d.win.x1 = b; }
      const c = ok(w.y0), e = ok(w.y1); if (c !== null && e !== null && e > c) { d.win.y0 = c; d.win.y1 = e; }
      const s0 = ok(w.s0), s1 = ok(w.s1); if (d.win.x0 !== null && s0 !== null && s1 !== null && s1 > s0) { d.win.s0 = s0; d.win.s1 = s1; }
    }
    if (s.show && typeof s.show === 'object') Object.keys(ITG_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  ITG.anim = null; ITG.drag = null;
  ITG.view = d.view; ITG.a = d.a; ITG.b = d.b; ITG.n = d.n; ITG.x = d.x; ITG.rotN = d.rotN; ITG.win = d.win; ITG.show = d.show; ITG.mode = d.mode;
  itgSetFn(d.raw, true); if (!ITG.F) ITG.raw = d.raw;
  itgSetG(d.rawG); if (!ITG.G) ITG.rawG = d.rawG;
  ITG.pa = d.pa; ITG.pb = d.pb; ITG.pt = d.pt; if (!itgSetPi(d.pu, d.pv)) { ITG.pu = d.pu; ITG.pv = d.pv; }
  ITG.sa = d.sa; ITG.sb = d.sb; ITG.sn = d.sn; ITG.st = d.st; ITG.sm = d.sm; if (!itgSetSub(d.sf, d.sg)) { ITG.sf = d.sf; ITG.sg = d.sg; }
  itgSyncFields(); itgRefreshUI(); difRedraw(); itgCardSoon();
}

// ── Zeichnen ──
function itgCtx(W, H, exp) {
  return { view: ITG.view, F: ITG.F, G: ITG.G, mode: ITG.mode, win: ITG.win, smart: itgSmart(), a: ITG.a, b: ITG.b, n: ITG.n, x: ITG.x, rotN: ITG.rotN, show: ITG.show, exp: !!exp, rotAng: ITG.anim && ITG.anim.rot && ITG.anim.ang < 2 * Math.PI && !exp ? ITG.anim.ang : null,
    U: ITG.U, V: ITG.V, pa: ITG.pa, pb: ITG.pb, pt: ITG.pt, SF: ITG.SF, SG: ITG.SG, sa: ITG.sa, sb: ITG.sb, sn: ITG.sn, st: ITG.st, sm: ITG.sm,
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
  if (!itgViewOk()) {
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
  const view = ITG.view, W = 760, H = view === 'hs' ? 620 : view === 'sum' || view === 'pi' || view === 'sub' ? 520 : 460;
  if (!itgViewOk()) return '% Zuerst eine Funktion eingeben.';
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
// withSub: bei «Integralfunktion» auch den y-Bereich des unteren Bildes (s0, s1) mitgeben
function itgResolvedWin(withSub) {
  const m = ITG.S && ITG.S.maps.main, sub = withSub && ITG.view === 'hs' && ITG.S && ITG.S.maps.sub;
  if (m) { const w = Object.assign({}, m.win); if (sub && sub.win) { w.s0 = sub.win.y0; w.s1 = sub.win.y1; } return w; }
  const w = ITG.win; return { x0: w.x0 === null ? -2 : w.x0, x1: w.x1 === null ? 4 : w.x1, y0: w.y0 === null ? -5 : w.y0, y1: w.y1 === null ? 5 : w.y1 };
}
// Integralfunktion: schlauer Ausschnitt, solange der Benutzer nicht selbst verschoben oder gezoomt hat
function itgSmart() {
  const F = ITG.F; if (!F || ITG.view !== 'hs' || ITG.win.x0 !== null) return null;
  if (ITG.smKey !== ITG.raw) { ITG.smKey = ITG.raw; try { ITG.smBase = difSmartWin(F, Dif.kd(F, [-5, 5])); } catch (e) { ITG.smBase = null; } }
  try { return itgHsWin(F, ITG.smBase, ITG.a, ITG.x); } catch (e) { return null; }
}
function itgZoom(f, cx, cy, onSub) {
  if (ITG.view === 'hs') { const n = difZoomWin(itgResolvedWin(true), f, cx, cy, onSub); if (n) ITG.win = n; return; }   // beide Bilder, je eigener y-Bereich (wie «Graphisch ableiten»)
  const w = itgResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return;
  ITG.win = { x0: nx0, x1: nx1, y0: cy - (cy - w.y0) * f, y1: cy + (w.y1 - cy) * f };   // y mitzoomen (automatisches y würde beim Zoomen springen)
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
  ui.sel.addEventListener('change', () => { const was = ITG.view; ITG.view = ui.sel.value; if (was !== ITG.view && (was === 'pi' || was === 'sub' || ITG.view === 'pi' || ITG.view === 'sub')) { ITG.win = Object.assign({}, ITG_WIN0); itgSyncFields(); } ITG.anim = null; ITG.cardKey = ''; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); });
  ui.desc = $dif('itg-desc');
  ui.ex = $dif('itg-ex');
  ui.ex.addEventListener('change', () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return;
    if (ITG.view === 'sub') { const e = ITG_SUB_EX[+i]; if (itgSetSub(itgUtoX(e[1]), e[2])) { ITG.sa = e[3]; ITG.sb = e[4]; ITG.st = e[3] + (e[4] - e[3]) * 0.55; ITG.win = Object.assign({}, ITG_WIN0); itgSyncFields(); const er = $dif('itg-err'); if (er) er.textContent = ''; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); } return; }
    if (ITG.view === 'pi') { const e = ITG_PI_EX[+i]; if (itgSetPi(e[1], e[2])) { ITG.pa = e[3]; ITG.pb = e[4]; ITG.pt = (e[3] + e[4]) / 2; ITG.win = Object.assign({}, ITG_WIN0); itgSyncFields(); const er = $dif('itg-err'); if (er) er.textContent = ''; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); } return; }
    const e = ITG_EX[+i];
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
  const d = ITG_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[1])); if (typeof envHint === 'function') envHint('int', d[0], () => ITG.S);   // Hinweis als Überschrift über dem Bild
  const grow = $dif('itg-g-row'); if (grow) grow.style.display = (v === 'ar' && ITG.mode === 'g') || v === 'pi' || v === 'sub' ? '' : 'none';
  { const fl = $dif('itg-f-lab'), gl = $dif('itg-g-lab'), fh = $dif('itg-f-head');
    if (fl) fl.textContent = v === 'pi' ? 'u(x) =' : v === 'sub' ? 'f(u) =' : 'f(x) ='; if (gl) gl.textContent = v === 'pi' ? 'v(x) =' : 'g(x) =';
    if (fh) fh.textContent = v === 'pi' ? 'Funktionen u und v (gesucht ∫ u · v′ dx)' : v === 'sub' ? 'Äussere Funktion f und innere Funktion g (gesucht ∫ f(g(x)) · g′(x) dx)' : 'Funktion'; }
  // Beispiele: je nach Ansicht
  const exKind = v === 'pi' || v === 'sub' ? v : 'f';
  if (ui.exFor !== exKind) {
    ui.exFor = exKind;
    ui.ex.replaceChildren(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
    (v === 'pi' ? ITG_PI_EX.map(e => e[0]) : v === 'sub' ? ITG_SUB_EX.map(e => e[0]) : ITG_EX.map(e => e[1])).forEach((nm, i) => { const o = difEl('option', null, nm); o.value = String(i); o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });
  }
  ui.params.replaceChildren(); ui.params._sync = [];   // Regler, die denselben Wert wie ein Zahlfeld zeigen, gleichen sich hier ab
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
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x)) { set(x); difRedraw(); itgCardSoon(); difCommit(); } inp.value = difFmtIn(get()); (P._sync || []).forEach(f => f()); };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const nudge = s => difBtn(s > 0 ? '▶' : '◀', () => { const st = itgStep(25); set(Math.round((get() + s * st) / st * 1e6) / 1e6 * st + 0); inp.value = difFmtIn(get()); difRedraw(); itgCardSoon(); difCommit(); (P._sync || []).forEach(f => f()); }, s > 0 ? 'Nach rechts' : 'Nach links');
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
    P._sync.push(() => { sl.value = itgNToS(ITG.n); val.textContent = 'n = ' + ITG.n; });
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
  } else if (v === 'pi') {
    group('Grenzen und Stelle');
    numRow('Untere Grenze a', () => ITG.pa, x => { ITG.pa = x; ITG.cardKey = ''; });
    numRow('Obere Grenze b', () => ITG.pb, x => { ITG.pb = x; ITG.cardKey = ''; });
    ui.xinp = numRow('Stelle x', () => ITG.pt, x => { ITG.pt = x; });
  } else if (v === 'sub') {
    group('Grenzen und Streifen');
    numRow('Untere Grenze a', () => ITG.sa, x => { ITG.sa = x; ITG.cardKey = ''; });
    numRow('Obere Grenze b', () => ITG.sb, x => { ITG.sb = x; ITG.cardKey = ''; });
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const val = difEl('b', null, 'n = ' + ITG.sn); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    top.append(difEl('label', null, 'Anzahl Streifen'), val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = 1; sl.max = 40; sl.step = 1; sl.value = ITG.sn; sl.style.width = '100%';
    sl.addEventListener('input', () => { ITG.sn = parseInt(sl.value, 10); val.textContent = 'n = ' + ITG.sn; difRedraw(); });
    sl.addEventListener('change', () => { difCommit(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1);
    ui.xinp = numRow('Stelle x', () => ITG.st, x => { ITG.st = x; });
    group('Übergang x-Welt → u-Welt');
    { const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
      const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
      const val = difEl('b', null, Math.round(ITG.sm * 100) + ' %'); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
      top.append(difEl('label', null, 'Verformung'), val);
      const sl = difEl('input'); sl.type = 'range'; sl.min = 0; sl.max = 100; sl.step = 1; sl.value = Math.round(ITG.sm * 100); sl.style.width = '100%'; sl.id = 'itg-sm';
      sl.addEventListener('input', () => { ITG.anim = null; ITG.sm = parseInt(sl.value, 10) / 100; val.textContent = sl.value + ' %'; difRedraw(); });
      sl.addEventListener('change', () => { itgRefreshUI(); difCommit(); });
      ui.smVal = val; ui.smSl = sl;
      wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1); }
    const ab = difEl('div'); ab.style.cssText = 'display:grid;grid-template-columns:1fr;gap:5px;';
    ab.append(difBtn(ITG.anim ? '⏸ Pause' : ITG.sm >= 1 ? '◀ zurück in die x-Welt' : '▶ Streifen in die u-Welt verformen', itgAnimToggle)); P.appendChild(ab);
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
    ITG.ui.rotSl = sl; ITG.ui.rotVal = val;
    const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(ITG.anim ? '⏸ Pause' : '▶ Graph drehen, dann Scheiben', itgAnimToggle)); P.appendChild(ab);
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

// Partielle Integration: Parameter x des Kurvenpunkts (u(x) | v(x)), der dem Mauszeiger am nächsten liegt (auch auf der blassen Fortsetzung)
function itgPiParamAt(m, p, free) {
  if (!itgPiOk()) return NaN;
  const u = ITG.U.f(0), v = ITG.V.f(0), lo = Math.min(ITG.pa, ITG.pb), hi = Math.max(ITG.pa, ITG.pb), sp = (hi - lo) || 1, x0 = lo - sp * 0.6, x1 = hi + sp * 0.6;
  let best = NaN, bd = Infinity;
  for (let i = 0; i <= 600; i++) { const x = x0 + (x1 - x0) * i / 600, px = m.X(u(x)), py = m.Y(v(x)); if (!isFinite(px) || !isFinite(py)) continue; const dd = Math.hypot(px - p.x, py - p.y); if (dd < bd) { bd = dd; best = x; } }
  if (!isFinite(best)) return NaN;
  const st = free ? 1e-4 : Stat.niceStep(sp, 40);
  return Math.round(best / st) * st + 0;
}

// ── Animation: n → ∞ bzw. x läuft nach rechts ──
function itgAnimToggle() {
  if (ITG.anim) { ITG.anim = null; itgRefreshUI(); difCommit(); return; }
  if (ITG.view === 'sum') { if (ITG.n >= 1000) ITG.n = 2; ITG.anim = { last: 0, f: ITG.n }; }
  else if (ITG.view === 'sub') ITG.anim = { last: 0, dir: ITG.sm >= 1 ? -1 : 1 };
  else if (ITG.view === 'rot') ITG.anim = { last: 0, rot: true, ang: 0, f: 1, wait: 0 };
  else {
    // Integralfunktion: knapp vor dem rechten Rand anhalten — der schlaue Ausschnitt nimmt x sonst mit und liefe dem Punkt davon
    const w = itgResolvedWin(), to = ITG.view === 'hs' ? w.x1 - 0.07 * (w.x1 - w.x0) : w.x1;
    if (ITG.x >= to - 1e-6) ITG.x = ITG.a; ITG.anim = { last: 0, to };
  }
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
  } else if (a.rot) {
    // 1. der Graph dreht sich einmal um die x-Achse; 2. der Körper wird in immer mehr Scheiben geschnitten
    if (a.ang < 2 * Math.PI) { a.ang = Math.min(2 * Math.PI, a.ang + dt * 2 * Math.PI / 5); if (a.ang >= 2 * Math.PI) { a.wait = 0.8; ITG.rotN = 1; } }
    else if (a.wait > 0) a.wait -= dt;
    else {
      a.f = Math.max(a.f + dt * 2.5, a.f * Math.pow(10, dt * 0.35));
      if (a.f >= 60) { ITG.rotN = 60; ITG.anim = null; itgRefreshUI(); difRedraw(); difCommit(); return; }
      ITG.rotN = Math.round(a.f);
    }
    const u = ITG.ui; if (u && u.rotSl) { u.rotSl.value = ITG.rotN; u.rotVal.textContent = ITG.rotN; }
  } else if (ITG.view === 'sub') {
    ITG.sm = Math.max(0, Math.min(1, ITG.sm + a.dir * dt / 2.5));
    const u = ITG.ui; if (u && u.smSl) { u.smSl.value = Math.round(ITG.sm * 100); u.smVal.textContent = Math.round(ITG.sm * 100) + ' %'; }
    if (ITG.sm <= 0 || ITG.sm >= 1) { ITG.anim = null; itgRefreshUI(); difRedraw(); difCommit(); return; }
  } else {
    const w = itgResolvedWin(), v = (w.x1 - w.x0) * 0.2 * dt;
    ITG.x += v;
    const to = isFinite(a.to) ? Math.min(a.to, w.x1) : w.x1;
    if (ITG.x >= to) { ITG.x = Math.round(to * 1e6) / 1e6; ITG.anim = null; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); return; }
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
  // Integralfunktion: an der gestrichelten Linie durch x ziehen
  const onLine = p => { const S = ITG.S, m = S && S.maps.main, sub = S && S.maps.sub; if (!m || ITG.view !== 'hs') return false; const px = m.X(ITG.x); return isFinite(px) && px >= m.L && px <= m.R && Math.abs(p.x - px) <= 9 && (inMap(m, p) || inMap(sub, p)); };
  // Zwei Finger: zoomen und verschieben
  const pinchOf = e => { const r = cv.getBoundingClientRect(), a = e.touches[0], b = e.touches[1]; return { x: (a.clientX + b.clientX) / 2 - r.left, y: (a.clientY + b.clientY) / 2 - r.top, d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1 }; };
  const down = e => {
    if (!itgActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = ITG.S; if (!S || !itgViewOk()) return;
    if (ITG.view === 'hs' && e.touches && e.touches.length === 2) {
      const c = pinchOf(e), m = inMap(S.maps.sub, c) ? S.maps.sub : S.maps.main; if (!m || !inMap(m, c)) { ITG.drag = null; return; }
      ITG.anim = null; ITG.drag = { type: 'pinch', sub: m === S.maps.sub, c, w: itgResolvedWin(true), wx: m.IX(c.x), wy: m.IY(c.y), mw: (m.win.x1 - m.win.x0) / (m.R - m.L), mh: (m.win.y1 - m.win.y0) / (m.B - m.T) }; return;
    }
    const p = pos(e); if (ITG.anim) { ITG.anim = null; itgRefreshUI(); }
    const q = near(p);
    // Ausschnitt beim Ziehen festhalten: sonst passt er sich an a, b laufend an und läuft dem Mauszeiger davon (wie in 82_lin_ui.js)
    const hold = () => { if (ITG.win.x0 === null || ITG.win.y0 === null) { ITG.win = itgResolvedWin(); ITG.drag.auto = true; } };
    if (q) { ITG.drag = { type: q.id }; hold(); }
    else if (onLine(p)) { ITG.drag = { type: 'x' }; hold(); }
    else if (ITG.view === 'hs' && (inMap(S.maps.main, p) || inMap(S.maps.sub, p))) {
      // Ziehen verschiebt den Ausschnitt (oben den von f, unten den von F_a); ein Klick ohne Ziehen setzt die Stelle x
      const m = inMap(S.maps.main, p) ? S.maps.main : S.maps.sub;
      ITG.drag = { type: 'pan', hs: true, sub: m === S.maps.sub, px: p.x, py: p.y, w: itgResolvedWin(true), click: m.IX(p.x), shift: e.shiftKey, moved: false };
    }
    else if (inMap(S.maps.main, p) || inMap(S.maps.sub, p)) { const m = inMap(S.maps.main, p) ? S.maps.main : S.maps.sub; ITG.drag = { type: 'pan', px: p.x, py: p.y, w: itgResolvedWin(), sub: m === S.maps.sub }; ITG.win = itgResolvedWin(); }   // Verschieben = reines Verschieben (y nicht neu anpassen)
    if (ITG.drag) cv.style.cursor = ITG.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!itgActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = ITG.S; if (!S) return; const d = ITG.drag;
    if (d && d.type === 'pinch') {
      if (!(e.touches && e.touches.length === 2)) return;
      const c = pinchOf(e), n = difZoomWin(d.w, d.c.d / c.d, d.wx, d.wy, d.sub); if (!n) return;
      const dx = (c.x - d.c.x) * d.mw * (d.c.d / c.d), dy = (c.y - d.c.y) * d.mh * (d.c.d / c.d);     // Mitte der Finger wandert mit
      n.x0 -= dx; n.x1 -= dx; if (d.sub) { if (isFinite(n.s0)) { n.s0 += dy; n.s1 += dy; } } else { n.y0 += dy; n.y1 += dy; }
      ITG.win = n; difRedraw(); return;
    }
    const p = pos(e);
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : onLine(p) ? 'ew-resize' : (inMap(S.maps.main, p) || inMap(S.maps.sub, p) ? (ITG.view === 'hs' ? 'grab' : 'crosshair') : ''); return; }
    const m = S.maps.main;
    if (ITG.view === 'sub' && (d.type === 'sa' || d.type === 'sb' || d.type === 'st')) { const st = e.shiftKey ? 1e-4 : Stat.niceStep(m.win.x1 - m.win.x0, 40); ITG[d.type] = Math.round(m.IX(p.x) / st) * st + 0; ITG.cardKey = ''; if (ITG.ui && ITG.ui.xinp && d.type === 'st') ITG.ui.xinp.value = difFmtIn(ITG.st); }
    else if (ITG.view === 'pi' && (d.type === 'pa' || d.type === 'pb' || d.type === 't')) { const x = itgPiParamAt(m, p, e.shiftKey); if (isFinite(x)) ITG[d.type === 't' ? 'pt' : d.type] = x; ITG.cardKey = ''; if (ITG.ui && ITG.ui.xinp && d.type === 't') ITG.ui.xinp.value = difFmtIn(ITG.pt); }
    else if (d.type === 'a' || d.type === 'b' || d.type === 'x') setVar(d.type, m.IX(p.x), e.shiftKey);
    else if (d.type === 'pan' && d.hs) {
      if (!d.moved && Math.hypot(p.x - d.px, p.y - d.py) < 4) return;        // noch ein Klick, kein Ziehen
      d.moved = true;
      const w = d.w, mm = d.sub && S.maps.sub ? S.maps.sub : m, dx = (p.x - d.px) / (mm.R - mm.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (mm.B - mm.T);
      const n = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0, y1: w.y1 };        // reines Verschieben (y wird nicht neu angepasst)
      if (isFinite(w.s0) && isFinite(w.s1)) { n.s0 = w.s0; n.s1 = w.s1; }
      if (d.sub) { if (isFinite(w.s0)) { n.s0 = w.s0 + dy * (w.s1 - w.s0); n.s1 = w.s1 + dy * (w.s1 - w.s0); } } else { n.y0 = w.y0 + dy * (w.y1 - w.y0); n.y1 = w.y1 + dy * (w.y1 - w.y0); }
      ITG.win = n;
    }
    else if (d.type === 'pan') {
      const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = d.sub ? 0 : (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0);
      ITG.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy };
    }
    difRedraw(); if (d.type !== 'pan') { itgCardSoon(); syncInputs(); }
  };
  const up = e => {
    if (!itgActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !ITG.drag) return;
    if (ITG.drag && ITG.drag.type === 'pinch' && e.touches && e.touches.length) return;
    if (ITG.drag && ITG.drag.hs && !ITG.drag.moved && e.type !== 'mouseleave' && e.type !== 'touchcancel') { setVar('x', ITG.drag.click, ITG.drag.shift); syncInputs(); }   // Klick: Stelle x setzen
    if (ITG.drag) {
      // Nach dem Ziehen: Ausschnitt bleibt, solange a und b gut darin liegen (wie der ruhige Ausschnitt in 81_lin_draw.js); sonst neu einpassen
      if (ITG.drag.auto && (ITG.view === 'pi' || ITG.view === 'sub' || ITG.view === 'hs')) ITG.win = Object.assign({}, ITG_WIN0);   // hs: zurück zum schlauen Ausschnitt (er nimmt a und x mit)
      else if (ITG.drag.auto) { const w = ITG.win, mx = (w.x1 - w.x0) * 0.04, ok = v => v >= w.x0 + mx && v <= w.x1 - mx; if (!(ok(ITG.a) && ok(ITG.b))) ITG.win = Object.assign({}, ITG_WIN0); }
      ITG.drag = null; cv.style.cursor = ''; itgRefreshUI(); difRedraw(); itgCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!itgActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = ITG.S; if (!S) return; const p = pos(e), m = S.maps.main, sub = S.maps.sub; if (!inMap(m, p) && !inMap(sub, p)) return;
    const f = stWheelF(e), mm = inMap(m, p) ? m : sub;
    if (ITG.view === 'hs') itgZoom(f, mm.IX(p.x), mm.IY(p.y), mm === sub); else itgZoom(f, mm.IX(p.x), inMap(m, p) ? m.IY(p.y) : undefined);
    difRedraw();
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
