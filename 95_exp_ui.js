// ═══════════════════════════════════════════════════════════════════
// 95_exp_ui.js — Exponential- und Logarithmusfunktionen: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 93_exp.js, 93b_exp_docs.js (Expo). Bilder: 94_exp_draw.js (Szenen). Aufbau wie 92_pow_ui.js
// (Hilfsfunktionen aus 62_dif_ui.js, Karte #dif-card). Zustand EXP: Ansicht, Funktion f(x) = a·b^x + d (eb: Basis e),
// Stelle xp, Berührstelle x0, rechte Seite c, Anwendung app, Ausschnitt, Optionen.
// Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «exp»).
// ═══════════════════════════════════════════════════════════════════

const EXP_VIEWS = [['grow', 'Wachstum und Zerfall a·b^x'], ['e', 'Die Zahl e und e^x'], ['log', 'Logarithmus als Umkehrung'], ['eq', 'Exponentialgleichungen und Anwendungen'], ['pct', 'Prozentrechnung: Faktor, rückwärts, mehrere Schritte']];
const EXP_DESC = {
  pct: ['Ziehe die {{Säulen|bars}} hoch oder runter (oder gib die Prozente ein): Jede Veränderung um p % ist eine Multiplikation mit dem {{Faktor|fac}} 1 ± p/100. Alle Faktoren zusammen ergeben den {{Gesamtfaktor|tot}}; rückwärts teilt man den Endwert durch ihn.', 'Eine Zunahme um p % bedeutet Multiplikation mit q = 1 + p/100, eine Abnahme mit q = 1 − p/100. Bei mehreren Veränderungen nacheinander werden die Faktoren multipliziert, nicht die Prozente addiert. Den Grundwert findet man, indem man den neuen Wert durch den Faktor teilt.'],
  grow: ['Ziehe die Punkte bei x = 0 ({{Anfangswert a|A}}) und x = 1 ({{Faktor b|B}}): Bei jedem Schritt um 1 wird mit b multipliziert ({{Faktor-Schritte|st}}). Für b > 1 wächst der {{Graph|f}}, für 0 < b < 1 zerfällt er; vergleiche mit dem {{linearen Wachstum|lin}} – «▶ Schritt für Schritt wachsen lassen» baut beide nebeneinander auf.', 'Exponentialfunktionen f(x) = a·bˣ + d: Der Anfangswert a wird bei jedem Schritt um 1 mit demselben Faktor b multipliziert. Für b > 1 wächst der Graph (Wachstum um (b−1)·100 %), für 0 < b < 1 fällt er (Zerfall). Die Gerade y = d ist Asymptote.'],
  e: ['Ziehe den {{Berührpunkt T|T}} auf dem {{Graphen von eˣ|f}}: Die Steigung der {{Tangente|tan}} ist überall genau gleich dem Funktionswert. Bei {{2ˣ und 3ˣ|cmp}} stimmt das nicht – nur die Basis e ≈ 2,71828 hat diese Eigenschaft. «▶ Basis von 2 bis 3 gleiten lassen» hält genau dort an.', 'Die Zahl e ≈ 2,71828 entsteht als Grenzwert von (1 + 1/n)ⁿ. Die Funktion eˣ hat eine besondere Eigenschaft: Die Steigung der Tangente ist an jeder Stelle gleich dem Funktionswert.'],
  log: ['Ziehe den {{Punkt P|P}} auf der {{Exponentialfunktion|f}}: Sein Spiegelpunkt {{P′|Q}} an der {{Winkelhalbierenden|diag}} liegt auf dem {{Logarithmus|lg}}. log_b(y) ist der Exponent, mit dem man b potenzieren muss, um y zu erhalten.', 'Der Logarithmus zur Basis b ist die Umkehrung von bˣ: log_b(y) ist der Exponent, mit dem man b potenzieren muss, um y zu erhalten. Der Graph von log_b x ist das Spiegelbild von bˣ an der Winkelhalbierenden y = x.'],
  eq: ['Ziehe die {{Gerade y = c|Y,yl}} auf und ab: Die Lösung von a·bˣ + d = c ist die Stelle, an der sie den {{Graphen|f}} schneidet. Rechts wird sie mit dem Logarithmus berechnet, bei Anwendungen auch gedeutet.', 'Exponentialgleichungen a·bˣ + d = c werden mit dem Logarithmus gelöst: Potenz isolieren, dann x = log_b(…) = ln(…)/ln(b). Anwendungen: Zinseszins, Bevölkerung, Zerfall, Abkühlung – überall, wo sich etwas pro Zeitschritt um denselben Faktor ändert.']
};
// Beispiele [a, b, d, Anzeige]  (b = 'e' für die Basis e)
const EXP_GROW_EX = [[1, 2, 0, '2^x'], [1, 0.5, 0, '(1/2)^x'], [3, 1.5, 0, '3·1,5^x'], [100, 1.05, 0, '100·1,05^x (5 % Wachstum)'], [2, 0.8, 0, '2·0,8^x (20 % Abnahme)'], [1, 3, 0, '3^x'], [1, 10, 0, '10^x'], [1, 2, 1, '2^x + 1'], [-1, 2, 4, '−2^x + 4'], [1, 'e', 0, 'e^x']];
const EXP_E_EX = [[0, 'T bei x = 0'], [1, 'T bei x = 1'], [-1, 'T bei x = −1'], [0.5, 'T bei x = 0,5'], [2, 'T bei x = 2']];
const EXP_LOG_EX = [[2, 'Basis 2'], [3, 'Basis 3'], [10, 'Basis 10 (lg)'], ['e', 'Basis e (ln)'], [0.5, 'Basis 1/2'], [4, 'Basis 4'], [1.5, 'Basis 1,5']];
// [a, b, d, c, Anzeige]
const EXP_EQ_EX = [[1, 2, 0, 8, '2^x = 8'], [1, 3, 0, 20, '3^x = 20'], [5, 2, 0, 80, '5·2^x = 80'], [1, 0.5, 0, 0.125, '(1/2)^x = 1/8'], [2, 3, 1, 55, '2·3^x + 1 = 55'], [1, 4, 0, 8, '4^x = 8'], [1, 'e', 0, 10, 'e^x = 10'], [100, 1.05, 0, 200, '100·1,05^x = 200'], [1, 2, 0, -4, '2^x = −4'], [3, 0.5, -1, 0.5, '3·(1/2)^x − 1 = 0,5']];
// Anwendungen: Funktion in Einheiten, Frage und Deutung
const EXP_APPS = [
  { id: 'zins', name: 'Zinseszins', fn: 'K', xv: 'n', xlab: 'n\\ \\text{(Jahre)}', ylab: 'K\\ \\text{(Fr.)}', a: 1000, b: 1.03, d: 0, c: 2000, xmax: 40, ymax: 3500, desc: 'Kapital 1000 Fr. zu 3 % Zins pro Jahr: K(n) = 1000·1,03ⁿ', q: 'Ein Kapital von 1000 Fr. wird jährlich mit 3 % verzinst. Nach wie vielen Jahren $n$ beträgt es $2000$ Fr.?', ans: (x, c) => 'Das Kapital erreicht ' + difFmtIn(c) + ' Fr. nach rund ' + difFmtIn(Math.round(x * 10) / 10) + ' Jahren, also im ' + Math.ceil(x) + '. Jahr' },
  { id: 'bev', name: 'Bevölkerungswachstum', fn: 'B', xv: 't', xlab: 't\\ \\text{(Jahre)}', ylab: 'B\\ \\text{(Mio.)}', a: 8.7, b: 1.012, d: 0, c: 10, xmax: 30, ymax: 13, desc: 'Bevölkerung 8,7 Mio., Wachstum 1,2 % pro Jahr: B(t) = 8,7·1,012ᵗ', q: 'Eine Bevölkerung von 8,7 Mio. wächst um 1,2 % pro Jahr. Wann erreicht sie $10$ Mio.?', ans: (x, c) => 'Die Bevölkerung erreicht ' + difFmtIn(c) + ' Mio. nach rund ' + difFmtIn(Math.round(x * 10) / 10) + ' Jahren' },
  { id: 'bakt', name: 'Bakterienkultur', fn: 'N', xv: 't', xlab: 't\\ \\text{(Stunden)}', ylab: 'N', a: 500, b: 2, d: 0, c: 16000, xmax: 7, ymax: 40000, desc: 'Anfangs 500 Bakterien, Verdoppelung jede Stunde: N(t) = 500·2ᵗ', q: 'Eine Kultur von 500 Bakterien verdoppelt sich jede Stunde. Wann sind es $16000$?', ans: (x, c) => 'Nach ' + difFmtIn(Math.round(x * 100) / 100) + ' Stunden sind es ' + difFmtIn(c) + ' Bakterien' },
  { id: 'med', name: 'Medikament im Blut', fn: 'M', xv: 't', xlab: 't\\ \\text{(Stunden)}', ylab: 'M\\ \\text{(mg)}', a: 200, b: 0.85, d: 0, c: 50, xmax: 14, ymax: 220, desc: 'Dosis 200 mg, Abbau um 15 % pro Stunde: M(t) = 200·0,85ᵗ', q: 'Von einer Dosis von 200 mg baut der Körper pro Stunde 15 % ab. Wann sind noch $50$ mg vorhanden?', ans: (x, c) => 'Nach rund ' + difFmtIn(Math.round(x * 10) / 10) + ' Stunden sind noch ' + difFmtIn(c) + ' mg vorhanden' },
  { id: 'zerf', name: 'Radioaktiver Zerfall', fn: 'N', xv: 't', xlab: 't\\ \\text{(Tage)}', ylab: 'N\\ \\text{(\\%)}', a: 100, b: 0.917, d: 0, c: 10, xmax: 30, ymax: 110, desc: 'Iod-131, Halbwertszeit 8 Tage: N(t) = 100·0,917ᵗ (in % der Anfangsmenge)', q: 'Von Iod-131 zerfallen pro Tag 8,3 % (Halbwertszeit 8 Tage). Nach welcher Zeit sind noch $10$ % übrig?', ans: (x, c) => 'Nach rund ' + difFmtIn(Math.round(x * 10) / 10) + ' Tagen sind noch ' + difFmtIn(c) + ' % übrig' },
  { id: 'kaff', name: 'Abkühlung', fn: 'T', xv: 't', xlab: 't\\ \\text{(Minuten)}', ylab: 'T\\ \\text{(°C)}', a: 60, b: 0.9, d: 20, c: 40, xmax: 30, ymax: 90, desc: 'Kaffee mit 80 °C im Raum mit 20 °C: T(t) = 20 + 60·0,9ᵗ', q: 'Kaffee von 80 °C kühlt in einem 20 °C warmen Raum ab; der Temperaturunterschied sinkt pro Minute um 10 %. Wann hat er $40$ °C?', ans: (x, c) => 'Nach rund ' + difFmtIn(Math.round(x * 10) / 10) + ' Minuten hat der Kaffee ' + difFmtIn(c) + ' °C' }
];
// Prozentrechnung: [Anzeige, Richtung, Grundwert bzw. Endwert, Veränderungen in %]
const EXP_PCT_EX = [['Preis 200 Fr.: +10 %, dann −10 %', 'fw', 200, [10, -10]], ['Lohn 5000 Fr.: dreimal +2 %', 'fw', 5000, [2, 2, 2]], ['80 Fr.: 25 % Rabatt, dann 8,1 % MWST', 'fw', 80, [-25, 8.1]], ['Aktie 100 Fr.: +50 %, dann −50 %', 'fw', 100, [50, -50]], ['Rückwärts: nach 20 % Rabatt 64 Fr.', 'bw', 64, [-20]], ['Rückwärts: inkl. 8,1 % MWST 270.25 Fr.', 'bw', 270.25, [8.1]], ['Rückwärts: nach +5 % und +4 % jetzt 5460 Fr.', 'bw', 5460, [5, 4]]];
const EXP_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const EXP_SHOW0 = { asym: true, lin: false, steps: true, cmp: true, tri: true, diag: true, card: true };

function expDefaults() {
  return { view: 'grow', a: 1, b: 2, d: 0, eb: false, xp: 2, x0: 1, c: 8, app: '', pG: 200, pE: 198, pc: [10, -10], pm: 'fw', win: Object.assign({}, EXP_WIN0), show: Object.assign({}, EXP_SHOW0) };
}
const EXP = Object.assign(expDefaults(), { ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0 });
function expActive() { return typeof ENV !== 'undefined' && ENV.cur === 'exp'; }

const expR6 = x => Math.round(x * 1e6) / 1e6 + 0;
function expF() { return Expo.mk(EXP.a, EXP.b, EXP.d, EXP.eb); }
function expSetF(F) { if (!F) return; EXP.a = expR6(F.a); EXP.eb = !!F.e; EXP.b = F.e ? EXP.b : expR6(F.b); EXP.d = expR6(F.d); }
function expApp() { return EXP.view === 'eq' && EXP.app ? EXP_APPS.find(p => p.id === EXP.app) || null : null; }
function expAppCtx() {
  const p = expApp(); if (!p) return null;
  return Object.assign({}, p, { q: p.q.replace(/\$[0-9.,]+\$/, '$' + Dif.fmtT(EXP.c, 4) + '$'), ans: x => p.ans(x, EXP.c) });
}
function expSetB(b) { if (!(b > 0) || Math.abs(b - 1) < 1e-6) return; EXP.b = expR6(b); EXP.eb = false; }

// ── Eingabefeld f(x) = a·b^x + d ──
function expParseRaw(raw) {
  let ast = null; try { ast = miParseRaw(String(raw || '').trim()); } catch (e) { return null; }
  const F = Expo.fromAst(ast); if (!F || F.deg) return null;
  if (F.b > 1e4 || F.b < 1e-4 || Math.abs(F.a) > 1e7 || Math.abs(F.d) > 1e7) return null;
  return F;
}
const expFieldRaw = id => { const inp = $dif(id); return inp ? (inp.getAttribute('data-raw') || '') : ''; };
function expSyncFields() {
  const f = $dif('exp-fn-input'); if (!f || !f._mlSetFromRaw) return;
  if (EXP.view !== 'grow' && EXP.view !== 'eq') return;
  const raw = Expo.raw(expF()); if (f.getAttribute('data-raw') !== raw && document.activeElement !== f) f._mlSetFromRaw(raw);
}
function expApplyField() {
  const raw = expFieldRaw('exp-fn-input').trim(), err = $dif('exp-err');
  if (!raw) { if (err) err.textContent = ''; return; }
  const F = expParseRaw(raw);
  if (!F) { if (err) err.textContent = 'Erlaubt sind a·b^x + d mit b > 0, b ≠ 1, z.B. 3·2^x − 1, 100·1,05^x, 0,5^x oder e^x.'; return; }
  const cur = expF();
  if (F.a === cur.a && F.d === cur.d && F.e === cur.e && Math.abs(F.b - cur.b) < 1e-9) return;
  expSetF(F); EXP.app = ''; EXP.win = Object.assign({}, EXP_WIN0);
  if (err) err.textContent = '';
  EXP.cardKey = ''; expRefreshUI(); difRedraw(); expCardSoon(); difCommit();
}
function expSetupFields() {
  const inp = $dif('exp-fn-input'); if (!inp || inp._expSetup) return; inp._expSetup = true;
  try {
    inp.mathVirtualKeyboardPolicy = 'manual';
    if (inp.shadowRoot) { const st = document.createElement('style'); st.textContent = '.ML__selection{background:var(--_selection-background-color, rgba(55,138,221,0.25)) !important;}'; inp.shadowRoot.appendChild(st); }
    inp._mlSetFromRaw = raw => { let latex = ''; try { latex = (raw && raw.trim()) ? rawToLatex(raw) : ''; } catch (ex) { latex = ''; } inp.setAttribute('data-raw', raw || ''); inp.value = latex; if (typeof _mlMoveCursorToEnd === 'function') _mlMoveCursorToEnd(inp); };
    if (typeof mlPrewarmFocus === 'function') mlPrewarmFocus(inp);
    inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(inp, -1); try { inp.select(); } catch (e) {} });
    inp.addEventListener('focusout', () => { inp.style.borderColor = ''; setTimeout(expApplyField, 0); });
    inp.addEventListener('input', () => { let raw; try { raw = asciiMathToRaw(inp.getValue('ascii-math')); } catch (ex) { return; } inp.setAttribute('data-raw', raw); inp.style.borderColor = ''; });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  } catch (e) { /* MathLive nicht verfügbar */ }
  expSyncFields();
}

// ── Rechenweg-Karte (teilt sich das Element #dif-card) ──
function expCardDoc() {
  try {
    const v = EXP.view;
    if (v === 'pct') return { t: 'Rechenweg: Prozentrechnung', d: Expo.pctDoc(EXP.pG, EXP.pE, EXP.pc, EXP.pm === 'bw') };
    if (v === 'grow') return { t: 'Rechenweg: Wachstum und Zerfall', d: Expo.growDoc(expF(), EXP.xp) };
    if (v === 'e') return { t: 'Rechenweg: Die Zahl e', d: Expo.eDoc(EXP.x0) };
    if (v === 'log') return { t: 'Rechenweg: Logarithmus', d: Expo.logDoc(Expo.mk(1, EXP.b, 0, EXP.eb), EXP.xp) };
    const A = expAppCtx(), d = Expo.eqDoc(expF(), EXP.c, A);
    if (A) {                                            // Sachverhalt und Frage trennen (letzter Satz mit «?»)
      const q = String(A.q); let cut = -1;
      for (let i = q.length - 2; i > 0; i--) if ((q[i] === '.' || q[i] === ';') && q[i + 1] === ' ' && /^[A-ZÄÖÜ]/.test(q.slice(i + 2)) && /\?\s*$/.test(q)) { cut = i; break; }
      if (cut > 0) Dif.withSit(d, q.slice(0, cut + 1), q.slice(cut + 2)); else Dif.withSit(d, q, '');
    }
    return { t: 'Rechenweg: Exponentialgleichung', d };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
function expCardKey() {
  const v = EXP.view, F = [EXP.a, EXP.b, EXP.d, EXP.eb];
  const k = { pct: [EXP.pG, EXP.pE, EXP.pc, EXP.pm], grow: [F, EXP.xp], e: [EXP.x0], log: [EXP.b, EXP.eb, EXP.xp], eq: [F, EXP.c, EXP.app] }[v];
  return v + '|' + JSON.stringify(k);
}
function expCardSoon() { clearTimeout(EXP.cardT); EXP.cardT = setTimeout(expCardRender, 40); }
function expCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = expActive() && EXP.show.card;
  if (expActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = expCardKey(); if (key === EXP.cardKey) return;
  EXP.cardKey = key;
  const r = expCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}

// ── Zustand sichern / laden ──
function expCapture() { return difCopy({ view: EXP.view, a: EXP.a, b: EXP.b, d: EXP.d, eb: EXP.eb, xp: EXP.xp, x0: EXP.x0, c: EXP.c, app: EXP.app, pG: EXP.pG, pE: EXP.pE, pc: EXP.pc, pm: EXP.pm, win: EXP.win, show: EXP.show }); }
function expApply(s) {
  EXP.anim = null;                                                       // laufende Animation beenden (Rückgängig, Laden, Zurücksetzen)
  const d = expDefaults(), num = (v, def) => { v = Number(v); return isFinite(v) ? v : def; };
  if (s && typeof s === 'object') {
    if (EXP_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    ['a', 'b', 'd', 'xp', 'x0', 'c'].forEach(key => { d[key] = num(s[key], d[key]); });
    ['pG', 'pE'].forEach(key => { const v = num(s[key], d[key]); if (v > 0) d[key] = v; });
    if (Array.isArray(s.pc) && s.pc.length >= 1 && s.pc.length <= 6 && s.pc.every(p => isFinite(Number(p)) && Number(p) > -100)) d.pc = s.pc.map(Number);
    if (s.pm === 'fw' || s.pm === 'bw') d.pm = s.pm;
    if (d.a === 0) d.a = 1;
    if (!(d.b > 0) || Math.abs(d.b - 1) < 1e-6) d.b = 2;
    d.eb = !!s.eb;
    if (typeof s.app === 'string' && (s.app === '' || EXP_APPS.some(p => p.id === s.app))) d.app = s.app;
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1), c = ok(w.y0), e = ok(w.y1);
      if (a !== null && b !== null && c !== null && e !== null && b > a && e > c) d.win = { x0: a, x1: b, y0: c, y1: e };
    }
    if (s.show && typeof s.show === 'object') Object.keys(EXP_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  EXP.drag = null;
  Object.keys(d).forEach(k => { EXP[k] = d[k]; });
  EXP.cardKey = '';
  expSyncFields(); expRefreshUI(); difRedraw(); expCardSoon();
}

// ── Zeichnen ──
function expCtx(W, H, exp) {
  return { view: EXP.view, F: expF(), xp: EXP.xp, x0: EXP.x0, c: EXP.c, app: expAppCtx(), pG: EXP.pG, pE: EXP.pE, pc: EXP.pc, pm: EXP.pm, win: EXP.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, smooth: !exp, show: EXP.show,
    growU: EXP.anim && EXP.anim.grow && !exp ? EXP.anim.u : null, eb: EXP.anim && EXP.anim.e && !exp ? EXP.anim.b : null };
}
// ── Animationen: Faktor-Schritte bauen sich auf (grow) bzw. die Basis gleitet von 2 nach 3 (e) ──
function expAnimStop() { if (EXP.anim) { if (EXP.anim.auto) EXP.win = Object.assign({}, EXP_WIN0); EXP.anim = null; expRefreshUI(); difRedraw(); } }
function expAnimToggle() {
  if (EXP.anim) { expAnimStop(); return; }
  if (EXP.view === 'grow') EXP.anim = { last: 0, grow: true, u: 0, wait: 0.5 };
  else if (EXP.view === 'e') EXP.anim = { last: 0, e: true, b: 2, wait: 0.6, done: false };
  else return;
  if (EXP.win.x0 === null && typeof expResolvedWin === 'function') { EXP.win = expResolvedWin(); EXP.anim.auto = true; }    // Ausschnitt bleibt stehen
  expRefreshUI(); difRedraw(); requestAnimationFrame(expAnimFrame);
}
function expAnimFrame(ts) {
  const a = EXP.anim; if (!a) return;
  if (!expActive() || (a.grow && EXP.view !== 'grow') || (a.e && EXP.view !== 'e')) { EXP.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (a.wait > 0) { a.wait -= dt; requestAnimationFrame(expAnimFrame); return; }
  if (a.grow) {
    const w = expResolvedWin(), kmax = Math.max(1, Math.min(6, Math.floor(w.x1))), before = Math.floor(a.u + 1e-9);
    a.u = Math.min(kmax, a.u + dt * 0.8);
    if (Math.floor(a.u + 1e-9) > before) { a.u = Math.floor(a.u + 1e-9); a.wait = 0.45; }           // nach jedem Schritt kurz halten
    if (a.u >= kmax) { const au = a.auto; EXP.anim = null; if (au) EXP.win = Object.assign({}, EXP_WIN0); EXP.show.steps = true; EXP.show.lin = true; expRefreshUI(); difRedraw(); difCommit(); return; }
  } else {
    const before = a.b; a.b = Math.min(3, a.b + dt * 0.16);
    if (!a.done && before < Math.E && a.b >= Math.E) { a.b = Math.E; a.done = true; a.wait = 2.2; }     // bei b = e anhalten
    if (a.b >= 3) { a.wait = 0; difRedraw(); const au = a.auto; setTimeout(() => { if (EXP.anim === a) { EXP.anim = null; if (au) EXP.win = Object.assign({}, EXP_WIN0); expRefreshUI(); difRedraw(); } }, 1200); return; }
  }
  difRedraw(); requestAnimationFrame(expAnimFrame);
}
const expDock = w => (EXP.show.card && w >= 760 ? stCardW(w, 0.36) : 0);
const expDockH = (w, h) => (EXP.show.card && w < 760 ? Math.round(h * 0.5) : 0);
function expLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = expDock(w), dh = expDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function expDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  expLayoutCard(w, h); expCardRender();
  const W = w - expDock(w), Hs = h - expDockH(w, h);
  const S = stSoloBuild(expBuildScene, W, Hs, expCtx(W, Hs), 'exp|' + EXP.view + '|' + JSON.stringify(EXP.show), W < w || Hs < h);   // Karte offen: nur Bild (41_stat_draw.js)
  EXP.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function expLatex() {
  const W = 760, H = 520;
  const S = expBuildScene(W, H, expCtx(W, H, { fs: 11 }));
  return stSceneTex(S, W, H, (EXP_VIEWS.find(q => q[0] === EXP.view) || [0, ''])[1], 11);
}
function expCardLatex() {
  const r = expCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.';
  return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d);
}
function expMakeLatex(which) { const ui = EXP.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? expCardLatex() : expLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function expCopyLatex() { texCopy(EXP.ui, () => expMakeLatex('pic')); }

// ── Ausschnitt ──
function expResolvedWin() {
  const m = EXP.S && EXP.S.maps.main; if (m) return Object.assign({}, m.win);
  const w = EXP.win; return w.x0 !== null && isFinite(w.x0) ? Object.assign({}, w) : { x0: -3, x1: 3, y0: -2, y1: 6 };
}
function expZoom(f, cx, cy) {
  const w = expResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f, ny0 = cy - (cy - w.y0) * f, ny1 = cy + (w.y1 - cy) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return;
  EXP.win = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 };
}
function expResetWin() { EXP.win = Object.assign({}, EXP_WIN0); expRefreshUI(); difRedraw(); expCardSoon(); difCommit(); }
function expStep(div) { const w = expResolvedWin(); return Stat.niceStep(w.x1 - w.x0, div); }

// ── Panel ──
function expBuildUI() {
  if (EXP.ui || !$dif('exp-panel')) return;
  const ui = EXP.ui = {}, body = $dif('exp-body');
  ui.sel = $dif('exp-view');
  EXP_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { EXP.view = ui.sel.value; EXP.anim = null; EXP.cardKey = ''; EXP.win = Object.assign({}, EXP_WIN0); if (EXP.view !== 'eq') EXP.app = ''; expRefreshUI(); difRedraw(); expCardSoon(); difCommit(); });
  ui.desc = $dif('exp-desc');
  ui.ex = $dif('exp-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec');
  det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => expMakeLatex('pic')); ui.br.addEventListener('click', () => expMakeLatex('calc')); ui.bc.addEventListener('click', expCopyLatex);
  const ap = $dif('exp-apply'); if (ap) ap.addEventListener('click', expApplyField);
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!expActive()) return; EXP.show.card = false; expRefreshUI(); difRedraw(); expCardRender(); difCommit(); });
  expRefreshUI();
}

function expRefreshUI() {
  const ui = EXP.ui; if (!ui) return;
  const v = EXP.view, sh = EXP.show;
  ui.sel.value = v;
  const d = EXP_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[1])); if (typeof envHint === 'function') envHint('exp', d[0], () => EXP.S);   // Hinweis als Überschrift über dem Bild
  const showF = v === 'grow' || v === 'eq';
  ['exp-f-row', 'exp-field-head'].forEach(id => { const e = $dif(id); if (e) e.style.display = showF ? '' : 'none'; });
  expSyncFields();
  // Beispiele
  ui.ex.replaceChildren(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
  const exs = v === 'pct' ? EXP_PCT_EX.map(p => p[0]) : v === 'grow' ? EXP_GROW_EX.map(p => p[3]) : v === 'e' ? EXP_E_EX.map(p => p[1]) : v === 'log' ? EXP_LOG_EX.map(p => p[1]) : EXP_EQ_EX.map(p => p[4]);
  exs.forEach((nm, i) => { const o = difEl('option', null, nm); o.value = String(i); o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const k = +i;
    const setB = b => { if (b === 'e') EXP.eb = true; else { EXP.eb = false; EXP.b = b; } };
    if (v === 'pct') { const e = EXP_PCT_EX[k]; EXP.pm = e[1]; if (e[1] === 'bw') EXP.pE = e[2]; else EXP.pG = e[2]; EXP.pc = e[3].slice(); }
    else if (v === 'grow') { const e = EXP_GROW_EX[k]; EXP.a = e[0]; setB(e[1]); EXP.d = e[2]; }
    else if (v === 'e') EXP.x0 = EXP_E_EX[k][0];
    else if (v === 'log') { setB(EXP_LOG_EX[k][0]); }
    else { const e = EXP_EQ_EX[k]; EXP.a = e[0]; setB(e[1]); EXP.d = e[2]; EXP.c = e[3]; EXP.app = ''; }
    EXP.win = Object.assign({}, EXP_WIN0); const er = $dif('exp-err'); if (er) er.textContent = '';
    expSyncFields(); EXP.cardKey = ''; expRefreshUI(); difRedraw(); expCardSoon(); difCommit();
  };
  ui.params.replaceChildren();
  const P = ui.params;
  const redo = () => { expRefreshUI(); difRedraw(); expCardSoon(); difCommit(); };
  const touch = () => { EXP.cardKey = ''; expSyncFields(); difRedraw(); expCardSoon(); };
  const check = (label, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get();
    lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); row.appendChild(lb);
    inp.addEventListener('change', () => { set(inp.checked); EXP.cardKey = ''; redo(); });
    P.appendChild(row);
  };
  const select = (label, opts, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label', null, label), sel = difEl('select');
    opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
    sel.value = get(); sel.addEventListener('change', () => { set(sel.value); EXP.cardKey = ''; redo(); });
    row.append(lb, sel); P.appendChild(row);
  };
  const numRow = (label, get, set, o) => {
    o = o || {}; const row = difEl('div', 'settings-row'); row.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no');
    lb.setAttribute('translate', 'no');
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x)) { set(expR6(x)); touch(); difCommit(); } inp.value = difFmtIn(get()); };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const nudge = s => difBtn(s > 0 ? '▶' : '◀', () => { const st = o.step || expStep(25); set(expR6(Math.round((get() + s * st) / st * 1e6) / 1e6 * st)); inp.value = difFmtIn(get()); touch(); difCommit(); }, s > 0 ? 'Nach rechts' : 'Nach links');
    row.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(row); return inp;
  };
  const slider = (label, get, set, min, max, step) => {
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const val = difEl('b', null, difFmtIn(get())); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    const lb = difEl('label', null, label); lb.setAttribute('translate', 'no');
    top.append(lb, val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = Math.max(min, Math.min(max, get())); sl.style.width = '100%';
    sl.addEventListener('input', () => { set(expR6(parseFloat(sl.value))); val.textContent = difFmtIn(get()); EXP.cardKey = ''; difRedraw(); expCardSoon(); expSyncFields(); });
    // Während des Ziehens bleibt der Ausschnitt stehen; danach passt er sich einmal ruhig an
    const hold = () => { if (EXP.win.x0 === null) { EXP.win = expResolvedWin(); EXP._slAuto = true; } };
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => sl.addEventListener(ev, hold, { passive: true }));
    sl.addEventListener('change', () => { if (EXP._slAuto) { EXP.win = Object.assign({}, EXP_WIN0); EXP._slAuto = false; } expRefreshUI(); difCommit(); difRedraw(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1); return sl;
  };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const setA = x => { if (x !== 0) EXP.a = x; };
  const baseRows = () => {
    check('Basis e (≈ 2,718)', () => EXP.eb, x => { EXP.eb = x; });
    if (!EXP.eb) slider('b', () => EXP.b, x => { if (Math.abs(x - 1) < 1e-6) x = 1.1; expSetB(x); }, 0.1, 5, 0.1);
  };

  if (v === 'pct') {
    select('Richtung', [['fw', 'Vorwärts: neuer Wert gesucht'], ['bw', 'Rückwärts: Grundwert gesucht']], () => EXP.pm, x => { const r = Expo.pctVals(EXP.pG, EXP.pE, EXP.pc, EXP.pm === 'bw'); if (x === 'bw') EXP.pE = expR6(r.v[r.v.length - 1]); else EXP.pG = expR6(r.v[0]); EXP.pm = x; });
    if (EXP.pm === 'bw') numRow('Endwert', () => EXP.pE, x => { if (x > 0) EXP.pE = x; }, { step: 10 }); else numRow('Grundwert', () => EXP.pG, x => { if (x > 0) EXP.pG = x; }, { step: 10 });
    group('Veränderungen in %  (+ Zunahme, − Abnahme)');
    EXP.pc.forEach((p, i) => { numRow((i + 1) + '. Schritt', () => EXP.pc[i], x => { if (x > -100) EXP.pc[i] = x; }, { step: 1 }); });
    const ab = difEl('div'); ab.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:4px;';
    if (EXP.pc.length < 6) ab.append(difBtn('＋ Schritt', () => { EXP.pc.push(10); EXP.cardKey = ''; redo(); }));
    if (EXP.pc.length > 1) ab.append(difBtn('− Schritt', () => { EXP.pc.pop(); EXP.cardKey = ''; redo(); }));
    P.appendChild(ab);
  } else if (v === 'grow') {
    group('a: Anfangswert, b: Faktor (Basis), d: Asymptote');
    slider('a', () => EXP.a, x => setA(x || 0.1), -5, 5, 0.1);
    baseRows();
    slider('d', () => EXP.d, x => { EXP.d = x; }, -5, 5, 0.5);
    group('Punkt P');
    numRow('Stelle x', () => EXP.xp, x => { EXP.xp = x; }, { step: 0.5 });
    group('Anzeige');
    check('Faktor-Schritte ·b zeigen', () => sh.steps, x => { sh.steps = x; });
    check('Vergleich mit linearem Wachstum', () => sh.lin, x => { sh.lin = x; });
    check('Asymptote y = d zeigen', () => sh.asym, x => { sh.asym = x; });
    { const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(EXP.anim ? '⏸ Pause' : '▶ Schritt für Schritt wachsen lassen', expAnimToggle)); P.appendChild(ab); }
  } else if (v === 'e') {
    group('Berührpunkt T der Tangente');
    numRow('Stelle x₀', () => EXP.x0, x => { EXP.x0 = Math.max(-6, Math.min(4, x)); }, { step: 0.5 });
    group('Anzeige');
    check('Steigungsdreieck zeigen', () => sh.tri, x => { sh.tri = x; });
    check('2^x und 3^x zum Vergleich', () => sh.cmp, x => { sh.cmp = x; });
    { const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(EXP.anim ? '⏸ Pause' : '▶ Basis von 2 bis 3 gleiten lassen', expAnimToggle)); P.appendChild(ab); }
  } else if (v === 'log') {
    group('Basis b');
    baseRows();
    group('Punkt P auf der Exponentialfunktion');
    numRow('Stelle x', () => EXP.xp, x => { EXP.xp = Math.max(-8, Math.min(8, x)); }, { step: 0.5 });
    group('Anzeige');
    check('Winkelhalbierende y = x zeigen', () => sh.diag, x => { sh.diag = x; });
    check('Asymptoten (Achsen) betonen', () => sh.asym, x => { sh.asym = x; });
  } else {
    group('Anwendung');
    select('Beispiel', [['', 'Freie Gleichung']].concat(EXP_APPS.map(p => [p.id, p.name])), () => EXP.app, x => { EXP.app = x; const p = EXP_APPS.find(q => q.id === x); if (p) { EXP.a = p.a; EXP.b = p.b; EXP.eb = false; EXP.d = p.d; EXP.c = p.c; } EXP.win = Object.assign({}, EXP_WIN0); expSyncFields(); });
    const app = expApp();

    group('a: Faktor, b: Basis, d: Verschiebung');
    if (app) { slider('a', () => EXP.a, x => setA(x || 1), Math.min(1, app.a / 4), app.a * 2, app.a / 100); slider('b', () => EXP.b, x => expSetB(x), app.b < 1 ? 0.5 : 1, app.b < 1 ? 0.99 : 1.5, 0.001); }
    else { slider('a', () => EXP.a, x => setA(x || 0.1), -5, 5, 0.1); baseRows(); slider('d', () => EXP.d, x => { EXP.d = x; }, -5, 5, 0.5); }
    group('Rechte Seite c der Gleichung ' + (app ? app.fn + '(' + app.xv + ') = c' : 'f(x) = c'));
    numRow('c', () => EXP.c, x => { EXP.c = x; }, { step: app ? app.ymax / 50 : 0.5 });
    check('Asymptote y = d zeigen', () => sh.asym, x => { sh.asym = x; });
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { expZoom(0.7); redo(); }, 'Hineinzoomen'), difBtn('－', () => { expZoom(1 / 0.7); redo(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', expResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; });
}

// ── Maus und Berührung auf dem Canvas ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = EXP.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + hitR(4) && d < bd) { bd = d; best = q; } }); return best; };
  const setPt = (id, x, y, shift) => {
    const m = EXP.S && EXP.S.maps.main; if (!m) return;
    const st = Stat.niceStep(m.win.x1 - m.win.x0, 14), sty = Stat.niceStep(m.win.y1 - m.win.y0, 14), sx = expR6(difSnap(x, st, shift)), sy = expR6(difSnap(y, sty, shift)), v = EXP.view;
    if (v === 'pct') {
      const k = /^b(\d+)$/.exec(id); if (!k) return; const i = +k[1], r = Expo.pctVals(EXP.pG, EXP.pE, EXP.pc, EXP.pm === 'bw'), yy = Math.max(y, 1e-6);
      if (i === 0) { if (EXP.pm !== 'bw') EXP.pG = expR6(difSnap(yy, sty / 2, shift) || sty / 2); }
      else if (EXP.pm === 'bw' && i === r.v.length - 1 && i === 1) EXP.pE = expR6(difSnap(yy, sty / 2, shift) || sty / 2);
      else { let p = (yy / r.v[i - 1] - 1) * 100; p = shift ? Math.round(p * 100) / 100 : Math.round(p); EXP.pc[i - 1] = Math.max(-99, p); }
      EXP.cardKey = ''; return;
    }
    if (v === 'grow') {
      if (id === 'P') EXP.xp = sx;
      else if (id === 'A') { const a = expR6(difSnap(y - EXP.d, sty / 2, shift)); if (a !== 0) EXP.a = a; }
      else if (id === 'B') { const b = (y - EXP.d) / EXP.a; if (b > 0.05 && Math.abs(b - 1) > 1e-3) expSetB(Math.round(b * 100) / 100); }
    } else if (v === 'e') { if (id === 'T') EXP.x0 = Math.max(-6, Math.min(4, sx)); }
    else if (v === 'log') { if (id === 'P') EXP.xp = Math.max(-8, Math.min(8, sx)); else if (id === 'Q') EXP.xp = Math.max(-8, Math.min(8, sy)); }
    else if (v === 'eq') { if (id === 'Y') EXP.c = sy; }
    EXP.cardKey = '';
  };
  const down = e => {
    if (!expActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = EXP.S; if (!S) return; if (EXP.anim) expAnimStop(); const p = pos(e);
    const q = near(p);
    if (q) { EXP.drag = { type: q.id }; if (EXP.win.x0 === null) { EXP.win = expResolvedWin(); EXP.drag.auto = true; } }
    else if (inMap(S.maps.main, p)) EXP.drag = { type: 'pan', px: p.x, py: p.y, w: expResolvedWin() };
    if (EXP.drag) cv.style.cursor = EXP.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!expActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = EXP.S; if (!S) return; const p = pos(e), d = EXP.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) ? 'crosshair' : ''); return; }
    const m = S.maps.main;
    if (d.type === 'pan') {
      const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0);
      EXP.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy };
    } else { setPt(d.type, m.IX(p.x), m.IY(p.y), e.shiftKey); expSyncFields(); }
    difRedraw(); if (d.type !== 'pan') expCardSoon();
  };
  const up = e => {
    if (!expActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !EXP.drag) return;
    if (EXP.drag) { if (EXP.drag.auto) EXP.win = Object.assign({}, EXP_WIN0); EXP.drag = null; cv.style.cursor = ''; expRefreshUI(); difRedraw(); expCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!expActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = EXP.S; if (!S) return; const p = pos(e), m = S.maps.main; if (!inMap(m, p)) return;
    expZoom(stWheelF(e), m.IX(p.x), m.IY(p.y)); difRedraw();
    clearTimeout(EXP._wt); EXP._wt = setTimeout(() => { expRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!expActive()) return; e.stopImmediatePropagation(); e.preventDefault(); expResetWin(); };
  const stop = e => { if (expActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { EXP.cardKey = ''; if (expActive()) { expCardRender(); expRefreshUI(); difRedraw(); } }, ms)); });
expBuildUI();
document.addEventListener('DOMContentLoaded', () => setTimeout(expSetupFields, 150));
if (typeof module !== 'undefined' && module.exports) module.exports = {};
