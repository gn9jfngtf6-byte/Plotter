// ═══════════════════════════════════════════════════════════════════
// 82_lin_ui.js — Lineare Funktionen: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 80_lin.js, 80b_lin_docs.js (Lin). Bilder: 81_lin_draw.js (Szenen). Wie die Integralrechnung
// (72_int_ui.js); Hilfsfunktionen und die Karte #dif-card kommen aus 62_dif_ui.js.
// Zustand LIN: Ansicht, Geraden f = m·x + q und g = m2·x + q2, Punkte, Anwendung, Ausschnitt, Optionen.
// Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «lin»).
// ═══════════════════════════════════════════════════════════════════

const LIN_VIEWS = [['par', 'Steigung und y-Achsenabschnitt'], ['two', 'Gerade aufstellen'], ['sys', 'Schnitt zweier Geraden'], ['app', 'Anwendungen (Tarife, Bewegung)'], ['perp', 'Nullstelle, Senkrechte, Mittelsenkrechte']];
const LIN_DESC = {
  par: ['Ziehe den {{Punkt S|q}} auf der y-Achse oder ändere m mit dem Regler: Die {{Gerade|g}} f(x) = m·x + q verschiebt oder dreht sich, und das {{Steigungsdreieck|tri,p}} zeigt, um wie viel y pro Schritt 1 nach rechts wächst.', 'Eine lineare Funktion f(x) = m·x + q hat als Graph eine Gerade. Die Steigung m sagt, um wie viel y pro Schritt 1 nach rechts wächst, q ist der y-Achsenabschnitt.'],
  two: ['Ziehe die {{Punkte P und Q|P1,P2}}: Die {{Gerade|g}} durch beide wird neu berechnet, aus {{Δx und Δy|tri}} folgt die Steigung m. Mit {{R|R}} zeigst du die {{Parallele|par}} und die {{Senkrechte|perp}} durch R.', 'Eine Gerade ist durch zwei Punkte oder durch einen Punkt und die Steigung festgelegt. Aus Δy und Δx folgt m, dann folgt q aus einem Punkt.'],
  sys: ['Ziehe die {{Punkte auf der y-Achse|y1,y2}}, um die Geraden {{f|g1}} und {{g|g2}} zu verschieben: Ihr Schnittpunkt löst beide Gleichungen gleichzeitig. Mit «▶ g drehen, bis sie parallel ist» läuft der Schnittpunkt davon: Bei gleicher Steigung gibt es keinen (oder unendlich viele) Schnittpunkte.', 'Der Schnittpunkt zweier Geraden löst beide Gleichungen gleichzeitig. Die Tabelle zeigt, wo die y-Werte von f und g übereinstimmen.'],
  app: ['Wähle ein Beispiel und ziehe den {{Punkt auf der x-Achse|xv}}: Die beiden Modelle {{A|g1}} und {{B|g2}} werden an dieser Stelle verglichen. Ihr Schnittpunkt ist der Break-even bzw. der Treffpunkt.', 'Zwei Modelle y = a + b·x werden verglichen: Preis oder Ort in Abhängigkeit von x. Der Schnittpunkt ist der Break-even bzw. der Treffpunkt.'],
  perp: ['Wähle die Aufgabe und ziehe die Punkte: bei der Nullstelle {{N|N}} auf der x-Achse, bei der Senkrechten den {{Punkt P|R}} (das {{Lot|lot}} trifft die {{Gerade|g}} im Fusspunkt F), bei der Mittelsenkrechten {{A|P1}} und {{B|P2}}.', 'Nullstelle: Wo schneidet die Gerade die x-Achse (N)? Senkrechte: Die Steigung der Senkrechten ist −1/m, der Lotfusspunkt F ist der Fusspunkt des Lotes von P. Mittelsenkrechte: Alle Punkte mit gleichem Abstand zu A und B.']
};
const LIN_EX = [['2*x+1', '2x + 1'], ['-x+3', '−x + 3'], ['0.5*x-2', '½x − 2'], ['-3/2*x+4', '−3/2·x + 4'], ['1/3*x-2/3', 'x/3 − 2/3'], ['x', 'x'], ['-2*x', '−2x'], ['3', '3']];
const LIN_PAIRS = [['x+1', '-x+5'], ['2*x-1', '-0.5*x+4'], ['3*x', '-x+8'], ['0.5*x+2', '2*x-1'], ['2*x+1', '2*x-3'], ['x-2', 'x-2']];
const LIN_TWO_EX = [[1, 2, 3, 6], [-2, 1, 2, -3], [-3, -2, 3, 1], [0, 3, 4, 3], [2, 1, 2, 5]];
const LIN_MID_EX = [[-3, -1, 3, 3], [-4, 2, 2, 2], [-2, -3, 4, 1], [1, 1, 5, -2]];
const LIN_WIN0 = { x0: null, x1: null, y0: null, y1: null };
const LIN_SHOW0 = { tri: true, zero: true, par: false, perp: false, card: true };

function linDefaults() {
  return { view: 'par', m: 2, q: 1, m2: -1, q2: 5, dx: 1, xp: 1, tmode: 'pts', p1: [1, 2], p2: [3, 6], tm: 2, R: [-2, 3], meth: 'eq', pi: 0,
    ap: { A: { a: 10, b: 0.05 }, B: { a: 0, b: 0.15 } }, xv: 100, pmode: 'zero', ma: [-3, -1], mb: [3, 3], win: Object.assign({}, LIN_WIN0), show: Object.assign({}, LIN_SHOW0) };
}
const LIN = Object.assign(linDefaults(), { ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0 });
function linActive() { return typeof ENV !== 'undefined' && ENV.cur === 'lin'; }

const linR6 = x => Math.round(x * 1e6) / 1e6 + 0;
// Gerade als Eingabetext («-3/2*x+4»)
function linRaw(m, q) {
  const L = Lin.mk(m, q), qr = z => { const n = Number(z.n), d = Number(z.d); return d === 1 ? String(n) : n + '/' + d; };
  let s = '';
  if (!Dif.E.qIsZero(L.mq)) s = Dif.E.qEq(L.mq, Dif.E.q1) ? 'x' : Dif.E.qEq(L.mq, Dif.E.qNeg(Dif.E.q1)) ? '-x' : qr(L.mq) + '*x';
  if (!Dif.E.qIsZero(L.qq) || s === '') s += (s === '' || Dif.E.qSgn(L.qq) < 0 ? '' : '+') + qr(L.qq);
  return s;
}
// Eingabetext → {m, q} (nur lineare Funktionen)
function linParseRaw(raw) {
  const F = Dif.makeFn(raw); if (!F || !F.P || F.P.length > 2 || !F.P.length) return null;
  const c = k => (k < F.P.length ? Dif.E.qNum(F.P[k]) : 0);
  const q = c(0), m = c(1); if (!isFinite(m) || !isFinite(q)) return null;
  return { m: linR6(m), q: linR6(q) };
}
const linFieldRaw = id => { const inp = $dif(id); return inp ? (inp.getAttribute('data-raw') || '') : ''; };
function linSyncFields() {
  [['lin-fn-input', LIN.m, LIN.q], ['lin-g-input', LIN.m2, LIN.q2]].forEach(([id, m, q]) => {
    const f = $dif(id); if (!f || !f._mlSetFromRaw) return;
    const raw = linRaw(m, q); if (f.getAttribute('data-raw') !== raw && document.activeElement !== f) f._mlSetFromRaw(raw);
  });
}
function linApplyField(which) {
  const id = which === 'g' ? 'lin-g-input' : 'lin-fn-input', raw = linFieldRaw(id).trim(), err = $dif('lin-err');
  if (!raw) { if (err) err.textContent = ''; return; }
  const r = linParseRaw(raw);
  if (!r) { if (err) err.textContent = 'Das ist keine lineare Funktion. Erlaubt ist m·x + q.'; return; }
  if (which === 'g') { if (r.m === LIN.m2 && r.q === LIN.q2) return; LIN.m2 = r.m; LIN.q2 = r.q; } else { if (r.m === LIN.m && r.q === LIN.q) return; LIN.m = r.m; LIN.q = r.q; LIN.win = Object.assign({}, LIN_WIN0); }
  if (err) err.textContent = '';
  LIN.cardKey = ''; linRefreshUI(); difRedraw(); linCardSoon(); difCommit();
}
function linSetupFields() {
  [['lin-fn-input', () => linApplyField('f')], ['lin-g-input', () => linApplyField('g')]].forEach(([id, apply]) => {
    const inp = $dif(id); if (!inp || inp._linSetup) return; inp._linSetup = true;
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
  linSyncFields();
}

// ── Anwendung: Modelle ──
function linPre() { return Lin.APPS[LIN.pi] || Lin.APPS[0]; }
function linAppObj() { return Lin.app(LIN.ap.A, LIN.ap.B); }
function linSetPreset(i) {
  const p = Lin.APPS[i]; if (!p) return;
  LIN.pi = i; LIN.ap = { A: { a: p.A.a, b: p.A.b }, B: { a: p.B.a, b: p.B.b } };
  const I = linAppObj().I; LIN.xv = I.kind === 'point' && I.x > 0 ? linR6(Math.max(1, Math.round(I.x * 0.5))) : 5;
  LIN.win = Object.assign({}, LIN_WIN0);
}

// ── Gerade(n) und Punkte des Zustands ──
const linL = () => Lin.mk(LIN.m, LIN.q), linG = () => Lin.mk(LIN.m2, LIN.q2);

// ── Rechenweg-Karte (teilt sich das Element #dif-card) ──
// Sachverhalt der Anwendung (mit den aktuell eingestellten Zahlen)
function linSituation() {
  const p = linPre(), A = LIN.ap.A, B = LIN.ap.B, n = v => '$' + (p.kind === 'cost' && Math.abs(v - Math.round(v)) > 1e-9 && Math.abs(v * 100 - Math.round(v * 100)) < 1e-9 ? Math.abs(v).toFixed(2) : Dif.fmtT(Math.abs(v), 4)) + '$';   // Geldbeträge mit zwei Stellen (3.20 CHF)
  const fee = (a, w) => (Math.abs(a) < 1e-12 ? 'keine ' + w : n(a) + ' CHF ' + w);
  const dir = (b, unit) => n(b) + ' ' + unit + (b < 0 ? ' zurück in Richtung Ort 0' : '');
  switch (p.id) {
    case 'phone': return ['Zwei Handy-Abos im Vergleich. **Tarif A:** ' + fee(A.a, 'Grundgebühr') + ' pro Monat und ' + n(A.b) + ' CHF pro Gesprächsminute. **Tarif B:** ' + fee(B.a, 'Grundgebühr') + ' und ' + n(B.b) + ' CHF pro Minute. $x$ = Anzahl Minuten pro Monat, $A(x)$ und $B(x)$ = Monatskosten in CHF.',
      'Bei wie vielen Minuten kosten beide Tarife gleich viel? Welcher Tarif ist für Wenig- und welcher für Vieltelefonierer günstiger?'];
    case 'taxi': return ['Zwei Taxiunternehmen. **Taxi A:** ' + fee(A.a, 'Grundtaxe') + ' und ' + n(A.b) + ' CHF pro Kilometer. **Taxi B:** ' + fee(B.a, 'Grundtaxe') + ' und ' + n(B.b) + ' CHF pro Kilometer. $x$ = Fahrstrecke in km, $A(x)$ und $B(x)$ = Fahrpreis in CHF.',
      'Bei welcher Fahrstrecke kosten beide gleich viel? Ab wann lohnt sich welches Taxi?'];
    case 'gym': return ['Ein Fitnesscenter bietet zwei Abos an. **' + p.A.n + ':** ' + fee(A.a, 'einmalige Gebühr') + ' und ' + n(A.b) + ' CHF pro Monat. **' + p.B.n + ':** ' + fee(B.a, 'einmalige Gebühr') + ' und ' + n(B.b) + ' CHF pro Monat. $x$ = Anzahl Monate, $A(x)$ und $B(x)$ = Gesamtkosten in CHF.',
      'Nach wie vielen Monaten sind beide Abos gleich teuer? Ab wann lohnt sich das ' + p.A.n + '?'];
    case 'move': return ['Auf derselben Strasse: Ein **' + p.A.n + '** startet am Ort $' + Dif.fmtT(A.a, 4) + '$ km und fährt mit ' + dir(A.b, 'km/h') + '. Gleichzeitig startet ein **' + p.B.n + '** am Ort $' + Dif.fmtT(B.a, 4) + '$ km und fährt mit ' + dir(B.b, 'km/h') + '. $x$ = Zeit in Stunden, $A(x)$ und $B(x)$ = Ort in km.',
      'Wann und wo treffen sich die beiden?'];
    case 'chase': return ['Ein **' + p.B.n + '** startet am Ort $' + Dif.fmtT(B.a, 4) + '$ km und fährt mit ' + dir(B.b, 'km/h') + '. Gleichzeitig fährt ein **' + p.A.n + '** am Ort $' + Dif.fmtT(A.a, 4) + '$ km mit ' + dir(A.b, 'km/h') + ' in dieselbe Richtung los. $x$ = Zeit in Stunden, $A(x)$ und $B(x)$ = Ort in km.',
      'Wann und wo holt der ' + p.A.n + ' das ' + p.B.n + ' ein?'];
    default: return ['', ''];
  }
}
function linCardDoc() {
  try {
    switch (LIN.view) {
      case 'par': return { t: 'Rechenweg: Steigung und Achsenabschnitt', d: Lin.parDoc(linL(), LIN.dx) };
      case 'two': {
        const ps = LIN.tmode === 'ps', p1 = LIN.p1, p2 = LIN.p2;
        const d = ps ? Lin.psDoc(p1[0], p1[1], LIN.tm) : Lin.twoDoc(p1[0], p1[1], p2[0], p2[1]);
        const L = ps ? Lin.fromPointSlope(p1[0], p1[1], LIN.tm) : Lin.fromPoints(p1[0], p1[1], p2[0], p2[1]);
        if (LIN.show.par) d.b = d.b.concat(Lin.relDoc(L, LIN.R[0], LIN.R[1], 'par').b);
        if (LIN.show.perp) d.b = d.b.concat(Lin.relDoc(L, LIN.R[0], LIN.R[1], 'perp').b);
        return { t: 'Rechenweg: Gerade aufstellen', d };
      }
      case 'sys': return { t: 'Rechenweg: Schnittpunkt', d: Lin.sysDoc(linL(), linG(), LIN.meth) };
      case 'app': { const S = linSituation(); return { t: 'Rechenweg: ' + (linPre().kind === 'move' ? 'Treffpunkt' : 'Break-even'), d: Dif.withSit(Lin.appDoc(linAppObj(), linPre()), S[0], S[1]) }; }
      case 'perp':
        if (LIN.pmode === 'zero') return { t: 'Rechenweg: Nullstelle', d: Lin.zeroDoc(linL()) };
        if (LIN.pmode === 'perp') return { t: 'Rechenweg: Senkrechte und Abstand', d: Lin.perpDoc(linL(), LIN.R[0], LIN.R[1]) };
        return { t: 'Rechenweg: Mittelsenkrechte', d: Lin.midDoc(LIN.ma[0], LIN.ma[1], LIN.mb[0], LIN.mb[1]) };
    }
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
  return null;
}
function linCardKey() {
  const v = LIN.view, S = LIN.show;
  const k = { par: [LIN.m, LIN.q, LIN.dx], two: [LIN.tmode, LIN.p1, LIN.p2, LIN.tm, S.par ? LIN.R : '', S.par, S.perp ? LIN.R : '', S.perp], sys: [LIN.m, LIN.q, LIN.m2, LIN.q2, LIN.meth],
    app: [LIN.pi, LIN.ap], perp: [LIN.pmode, LIN.m, LIN.q, LIN.R, LIN.ma, LIN.mb] }[v];
  return v + '|' + JSON.stringify(k);
}
function linCardSoon() { clearTimeout(LIN.cardT); LIN.cardT = setTimeout(linCardRender, 40); }
function linCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = linActive() && LIN.show.card;
  if (linActive()) card.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const key = linCardKey(); if (key === LIN.cardKey) return;
  LIN.cardKey = key;
  const r = linCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">Für diese Ansicht gibt es keinen Rechenweg.</div></div>';
  body.scrollTop = 0;
}

// ── Zustand sichern / laden ──
function linCapture() { return difCopy({ view: LIN.view, m: LIN.m, q: LIN.q, m2: LIN.m2, q2: LIN.q2, dx: LIN.dx, xp: LIN.xp, tmode: LIN.tmode, p1: LIN.p1, p2: LIN.p2, tm: LIN.tm, R: LIN.R, meth: LIN.meth, pi: LIN.pi, ap: LIN.ap, xv: LIN.xv, pmode: LIN.pmode, ma: LIN.ma, mb: LIN.mb, win: LIN.win, show: LIN.show }); }
function linApply(s) {
  const d = linDefaults(), num = (v, def) => { v = Number(v); return isFinite(v) ? v : def; }, pt = (a, def) => (Array.isArray(a) && a.length === 2 && isFinite(Number(a[0])) && isFinite(Number(a[1])) ? [Number(a[0]), Number(a[1])] : def);
  if (s && typeof s === 'object') {
    if (LIN_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    ['m', 'q', 'm2', 'q2', 'xp', 'tm', 'xv'].forEach(k => { d[k] = num(s[k], d[k]); });
    d.dx = num(s.dx, d.dx) || 1;
    if (s.tmode === 'ps' || s.tmode === 'pts') d.tmode = s.tmode;
    if (['eq', 'sub', 'add'].includes(s.meth)) d.meth = s.meth;
    if (['zero', 'perp', 'mid'].includes(s.pmode)) d.pmode = s.pmode;
    d.p1 = pt(s.p1, d.p1); d.p2 = pt(s.p2, d.p2); d.R = pt(s.R, d.R); d.ma = pt(s.ma, d.ma); d.mb = pt(s.mb, d.mb);
    const pi = Math.round(Number(s.pi)); if (pi >= 0 && pi < Lin.APPS.length) d.pi = pi;
    if (s.ap && s.ap.A && s.ap.B) ['A', 'B'].forEach(k => { d.ap[k] = { a: num(s.ap[k].a, 0), b: num(s.ap[k].b, 0) }; });
    else { const p = Lin.APPS[d.pi]; d.ap = { A: { a: p.A.a, b: p.A.b }, B: { a: p.B.a, b: p.B.b } }; }
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1), c = ok(w.y0), e = ok(w.y1);
      if (a !== null && b !== null && c !== null && e !== null && b > a && e > c) d.win = { x0: a, x1: b, y0: c, y1: e };
    }
    if (s.show && typeof s.show === 'object') Object.keys(LIN_SHOW0).forEach(k => { if (k in s.show) d.show[k] = !!s.show[k]; });
  }
  LIN.anim = null; LIN.drag = null;
  Object.keys(d).forEach(k => { LIN[k] = d[k]; });
  LIN.cardKey = '';
  linSyncFields(); linRefreshUI(); difRedraw(); linCardSoon();
}

// ── Zeichnen ──
function linCtx(W, H, exp) {
  const mid = LIN.view === 'perp' && LIN.pmode === 'mid';
  return { view: LIN.view, L: linL(), G: linG(), win: LIN.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, smooth: !exp, show: LIN.show,
    dx: LIN.dx, xp: LIN.xp, tmode: LIN.tmode, p1: mid ? LIN.ma : LIN.p1, p2: mid ? LIN.mb : LIN.p2, tm: LIN.tm, R: LIN.R, meth: LIN.meth, app: linAppObj(), pre: linPre(), xv: LIN.xv, pmode: LIN.pmode };
}
const linDock = w => (LIN.show.card && w >= 760 ? stCardW(w, 0.36) : 0);
const linDockH = (w, h) => (LIN.show.card && w < 760 ? Math.round(h * 0.5) : 0);
function linLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = linDock(w), dh = linDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function linDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  linLayoutCard(w, h); linCardRender();
  const W = w - linDock(w), Hs = h - linDockH(w, h);
  const S = stSoloBuild(linBuildScene, W, Hs, linCtx(W, Hs), 'lin|' + LIN.view + '|' + JSON.stringify(LIN.show), W < w || Hs < h);   // Karte offen: nur Bild (41_stat_draw.js)
  LIN.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function linLatex() {
  const W = 760, H = LIN.view === 'app' || LIN.view === 'sys' ? 480 : 520;
  const S = linBuildScene(W, H, linCtx(W, H, { fs: 11 }));
  return stSceneTex(S, W, H, (LIN_VIEWS.find(q => q[0] === LIN.view) || [0, ''])[1], 11);
}
function linCardLatex() {
  const r = linCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.';
  return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d);
}
function linMakeLatex(which) { const ui = LIN.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? linCardLatex() : linLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function linCopyLatex() { texCopy(LIN.ui, () => linMakeLatex('pic')); }

// ── Ausschnitt (immer alle vier Werte; gleicher Massstab bleibt beim Zoomen erhalten) ──
function linResolvedWin() {
  const m = LIN.S && LIN.S.maps.main; if (m) return Object.assign({}, m.win);
  const w = LIN.win; return isFinite(w.x0) && w.x0 !== null ? Object.assign({}, w) : { x0: -6, x1: 6, y0: -4, y1: 4 };
}
function linZoom(f, cx, cy) {
  const w = linResolvedWin(); cx = cx === undefined ? (w.x0 + w.x1) / 2 : cx; cy = cy === undefined ? (w.y0 + w.y1) / 2 : cy;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f, ny0 = cy - (cy - w.y0) * f, ny1 = cy + (w.y1 - cy) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return;
  LIN.win = { x0: nx0, x1: nx1, y0: ny0, y1: ny1 };
}
function linResetWin() { LIN.win = Object.assign({}, LIN_WIN0); linRefreshUI(); difRedraw(); linCardSoon(); difCommit(); }
function linStep(div) { const w = linResolvedWin(); return Stat.niceStep(w.x1 - w.x0, div); }

// ── Panel ──
function linBuildUI() {
  if (LIN.ui || !$dif('lin-panel')) return;
  const ui = LIN.ui = {}, body = $dif('lin-body');
  ui.sel = $dif('lin-view');
  LIN_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { LIN.view = ui.sel.value; LIN.anim = null; LIN.cardKey = ''; LIN.win = Object.assign({}, LIN_WIN0); linRefreshUI(); difRedraw(); linCardSoon(); difCommit(); });
  ui.desc = $dif('lin-desc');
  ui.ex = $dif('lin-ex');
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec');
  det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => linMakeLatex('pic')); ui.br.addEventListener('click', () => linMakeLatex('calc')); ui.bc.addEventListener('click', linCopyLatex);
  const ap = $dif('lin-apply'); if (ap) ap.addEventListener('click', () => linApplyField('f'));
  const ag = $dif('lin-g-apply'); if (ag) ag.addEventListener('click', () => linApplyField('g'));
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { if (!linActive()) return; LIN.show.card = false; linRefreshUI(); difRedraw(); linCardRender(); difCommit(); });
  linRefreshUI();
}

function linRefreshUI() {
  const ui = LIN.ui; if (!ui) return;
  const v = LIN.view, sh = LIN.show;
  ui.sel.value = v;
  const d = LIN_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[1])); if (typeof envHint === 'function') envHint('lin', d[0], () => LIN.S);   // Hinweis als Überschrift über dem Bild
  const frow = $dif('lin-f-row'), grow = $dif('lin-g-row'), fl = $dif('lin-f-label'), fh = $dif('lin-field-head');
  const showF = v === 'par' || v === 'sys' || (v === 'perp' && LIN.pmode !== 'mid');
  if (frow) frow.style.display = showF ? '' : 'none';
  if (grow) grow.style.display = v === 'sys' ? '' : 'none';
  if (fh) fh.style.display = showF ? '' : 'none';
  if (fl) fl.textContent = v === 'sys' ? 'f(x) =' : 'f(x) =';
  linSyncFields();
  // Beispiele
  ui.ex.replaceChildren(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
  const exs = v === 'sys' ? LIN_PAIRS.map(p => 'f = ' + p[0].replace(/\*/g, '·') + ',  g = ' + p[1].replace(/\*/g, '·'))
    : v === 'two' ? LIN_TWO_EX.map(p => 'P(' + p[0] + '|' + p[1] + '), Q(' + p[2] + '|' + p[3] + ')')
      : v === 'perp' && LIN.pmode === 'mid' ? LIN_MID_EX.map(p => 'A(' + p[0] + '|' + p[1] + '), B(' + p[2] + '|' + p[3] + ')')
        : v === 'app' ? Lin.APPS.map(p => p.name) : LIN_EX.map(p => p[1]);
  exs.forEach((nm, i) => { const o = difEl('option', null, nm); o.value = String(i); if (v !== 'app') o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const k = +i;
    if (v === 'sys') { const p = LIN_PAIRS[k], a = linParseRaw(p[0]), b = linParseRaw(p[1]); LIN.m = a.m; LIN.q = a.q; LIN.m2 = b.m; LIN.q2 = b.q; }
    else if (v === 'two') { const p = LIN_TWO_EX[k]; LIN.p1 = [p[0], p[1]]; LIN.p2 = [p[2], p[3]]; LIN.tm = p[2] !== p[0] ? linR6((p[3] - p[1]) / (p[2] - p[0])) : 1; }
    else if (v === 'perp' && LIN.pmode === 'mid') { const p = LIN_MID_EX[k]; LIN.ma = [p[0], p[1]]; LIN.mb = [p[2], p[3]]; }
    else if (v === 'app') linSetPreset(k);
    else { const a = linParseRaw(LIN_EX[k][0]); LIN.m = a.m; LIN.q = a.q; }
    LIN.win = Object.assign({}, LIN_WIN0); const er = $dif('lin-err'); if (er) er.textContent = '';
    linSyncFields(); LIN.cardKey = ''; linRefreshUI(); difRedraw(); linCardSoon(); difCommit();
  };
  ui.params.replaceChildren(); ui.params._sync = [];   // Regler, die denselben Wert wie ein Zahlfeld zeigen, gleichen sich hier ab
  const P = ui.params;
  const redo = () => { linRefreshUI(); difRedraw(); linCardSoon(); difCommit(); };
  const check = (label, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get();
    lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); row.appendChild(lb);
    inp.addEventListener('change', () => { set(inp.checked); LIN.cardKey = ''; redo(); });
    P.appendChild(row);
  };
  const select = (label, opts, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label', null, label), sel = difEl('select');
    opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
    sel.value = get(); sel.addEventListener('change', () => { set(sel.value); LIN.cardKey = ''; redo(); });
    row.append(lb, sel); P.appendChild(row);
  };
  // Zahl mit ◀ ▶; step: feste Schrittweite (sonst nach Ausschnitt)
  const numRow = (label, get, set, o) => {
    o = o || {}; const row = difEl('div', 'settings-row'); row.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no');
    lb.setAttribute('translate', 'no');
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x)) { set(linR6(x)); LIN.cardKey = ''; linSyncFields(); difRedraw(); linCardSoon(); difCommit(); } inp.value = difFmtIn(get()); (P._sync || []).forEach(f => f()); };
    inp.addEventListener('change', apply); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    const nudge = s => difBtn(s > 0 ? '▶' : '◀', () => { const st = o.step || linStep(25); set(linR6(Math.round((get() + s * st) / st * 1e6) / 1e6 * st)); LIN.cardKey = ''; inp.value = difFmtIn(get()); linSyncFields(); difRedraw(); linCardSoon(); difCommit(); (P._sync || []).forEach(f => f()); }, s > 0 ? 'Nach rechts' : 'Nach links');
    row.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(row); return inp;
  };
  const slider = (label, get, set, min, max, step, fmt) => {
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const val = difEl('b', null, fmt(get())); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    top.append(difEl('label', null, label), val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = get(); sl.style.width = '100%';
    sl.addEventListener('input', () => { LIN.anim = null; set(linR6(parseFloat(sl.value))); val.textContent = fmt(get()); LIN.cardKey = ''; difRedraw(); linCardSoon(); });
    P._sync.push(() => { sl.value = get(); val.textContent = fmt(get()); });
    // Während des Ziehens bleibt der Ausschnitt stehen; danach passt er sich einmal ruhig an
    const hold = () => { if (LIN.win.x0 === null) { LIN.win = linResolvedWin(); LIN._slAuto = true; } };
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => sl.addEventListener(ev, hold, { passive: true }));
    sl.addEventListener('change', () => { if (LIN._slAuto) { LIN.win = Object.assign({}, LIN_WIN0); LIN._slAuto = false; } linRefreshUI(); linSyncFields(); difCommit(); difRedraw(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1); return sl;
  };
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };
  const ptRows = (nx, ny, get, set) => { numRow(nx, () => get()[0], x => { const p = get(); set([x, p[1]]); }, { step: 1 }); numRow(ny, () => get()[1], y => { const p = get(); set([p[0], y]); }, { step: 1 }); };
  const fmt2 = x => difFmtIn(x);

  if (v === 'par') {
    group('Steigung m und y-Achsenabschnitt q');
    ui.msl = slider('m (Steigung)', () => LIN.m, x => { LIN.m = x; }, -5, 5, 0.1, fmt2);
    slider('q (y-Achsenabschnitt)', () => LIN.q, x => { LIN.q = x; }, -8, 8, 0.5, fmt2);
    numRow('m genau', () => LIN.m, x => { LIN.m = x; }, { step: 0.5 });
    numRow('q genau', () => LIN.q, x => { LIN.q = x; }, { step: 0.5 });
    group('Steigungsdreieck');
    numRow('Stelle x', () => LIN.xp, x => { LIN.xp = x; }, { step: 1 });
    numRow('Schritt Δx', () => LIN.dx, x => { LIN.dx = x || 1; }, { step: 1 });
    const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(LIN.anim ? '⏸ Pause' : '▶ Steigung m ändern', linAnimToggle)); P.appendChild(ab);
    group('Anzeige');
    check('Steigungsdreieck zeigen', () => sh.tri, x => { sh.tri = x; });
    check('Nullstelle zeigen', () => sh.zero, x => { sh.zero = x; });
  } else if (v === 'two') {
    select('Gegeben sind', [['pts', 'zwei Punkte'], ['ps', 'ein Punkt und die Steigung']], () => LIN.tmode, x => { LIN.tmode = x; if (x === 'ps') { LIN.tm = linR6(LIN.p2[0] !== LIN.p1[0] ? (LIN.p2[1] - LIN.p1[1]) / (LIN.p2[0] - LIN.p1[0]) : 1); } });
    group('Punkt P');
    ptRows('x von P', 'y von P', () => LIN.p1, x => { LIN.p1 = x; });
    if (LIN.tmode === 'ps') { group('Steigung'); numRow('Steigung m', () => LIN.tm, x => { LIN.tm = x; }, { step: 0.5 }); }
    else { group('Punkt Q'); ptRows('x von Q', 'y von Q', () => LIN.p2, x => { LIN.p2 = x; }); }
    group('Anzeige');
    if (LIN.tmode === 'pts') check('Steigungsdreieck zeigen', () => sh.tri, x => { sh.tri = x; });
    check('Parallele durch R zeigen', () => sh.par, x => { sh.par = x; });
    check('Senkrechte durch R zeigen', () => sh.perp, x => { sh.perp = x; });
    if (sh.par || sh.perp) ptRows('x von R', 'y von R', () => LIN.R, x => { LIN.R = x; });
  } else if (v === 'sys') {
    group('Verfahren');
    select('Rechenweg', [['eq', 'Gleichsetzen'], ['sub', 'Einsetzen'], ['add', 'Addieren']], () => LIN.meth, x => { LIN.meth = x; });
    group('Steigungen und Achsenabschnitte');
    numRow('m₁', () => LIN.m, x => { LIN.m = x; }, { step: 0.5 }); numRow('q₁', () => LIN.q, x => { LIN.q = x; }, { step: 0.5 });
    numRow('m₂', () => LIN.m2, x => { LIN.m2 = x; }, { step: 0.5 }); numRow('q₂', () => LIN.q2, x => { LIN.q2 = x; }, { step: 0.5 });
    { const par = Math.abs(LIN.m2 - LIN.m) < 1e-9, ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(LIN.anim ? '⏸ Pause' : par ? '▶ g zurückdrehen' : '▶ g drehen, bis sie parallel ist', linAnimToggle)); P.appendChild(ab); }
  } else if (v === 'app') {
    const pre = linPre(), mv = pre.kind === 'move';
    group(pre.A.n + ' (A)');
    numRow(pre.ua, () => LIN.ap.A.a, x => { LIN.ap.A.a = x; LIN.win = Object.assign({}, LIN_WIN0); }, { step: 1 });
    numRow(pre.ub, () => LIN.ap.A.b, x => { LIN.ap.A.b = x; LIN.win = Object.assign({}, LIN_WIN0); }, { step: 0.05 });
    group(pre.B.n + ' (B)');
    numRow(pre.ua, () => LIN.ap.B.a, x => { LIN.ap.B.a = x; LIN.win = Object.assign({}, LIN_WIN0); }, { step: 1 });
    numRow(pre.ub, () => LIN.ap.B.b, x => { LIN.ap.B.b = x; LIN.win = Object.assign({}, LIN_WIN0); }, { step: 0.05 });
    group(mv ? 'Zeitpunkt' : 'Vergleich an einer Stelle');
    numRow(pre.xl, () => LIN.xv, x => { LIN.xv = x; }, { step: 1 });
    const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(LIN.anim ? '⏸ Pause' : '▶ ' + (mv ? 'Zeit läuft' : 'x wandert nach rechts'), linAnimToggle)); P.appendChild(ab);
  } else if (v === 'perp') {
    select('Thema', [['zero', 'Nullstelle'], ['perp', 'Senkrechte und Lotfusspunkt'], ['mid', 'Mittelsenkrechte']], () => LIN.pmode, x => { LIN.pmode = x; LIN.win = Object.assign({}, LIN_WIN0); });
    if (LIN.pmode === 'zero') { group('Gerade'); numRow('m', () => LIN.m, x => { LIN.m = x; }, { step: 0.5 }); numRow('q', () => LIN.q, x => { LIN.q = x; }, { step: 0.5 }); }
    else if (LIN.pmode === 'perp') { group('Gerade g'); numRow('m', () => LIN.m, x => { LIN.m = x; }, { step: 0.5 }); numRow('q', () => LIN.q, x => { LIN.q = x; }, { step: 0.5 }); group('Punkt P'); ptRows('x von P', 'y von P', () => LIN.R, x => { LIN.R = x; }); }
    else { group('Punkt A'); ptRows('x von A', 'y von A', () => LIN.ma, x => { LIN.ma = x; }); group('Punkt B'); ptRows('x von B', 'y von B', () => LIN.mb, x => { LIN.mb = x; }); }
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { linZoom(0.7); redo(); }, 'Hineinzoomen'), difBtn('－', () => { linZoom(1 / 0.7); redo(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', linResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; });
}

// ── Animation: m läuft von −3 bis 3 (par) bzw. x läuft nach rechts (app) ──
function linAnimToggle() {
  if (LIN.anim) { if (LIN.anim.auto) LIN.win = Object.assign({}, LIN_WIN0); LIN.anim = null; linRefreshUI(); difRedraw(); difCommit(); return; }
  if (LIN.view === 'par') LIN.anim = { last: 0, t: Math.asin(Math.max(-1, Math.min(1, LIN.m / 3))) };
  else if (LIN.view === 'sys') {
    // g dreht sich um ihren Punkt auf der y-Achse, bis sie parallel zu f ist: Der Schnittpunkt läuft davon. Zurück: zur früheren Steigung.
    const par = Math.abs(LIN.m2 - LIN.m) < 1e-9, back = isFinite(LIN._sysM) && Math.abs(LIN._sysM - LIN.m) > 1e-9 ? LIN._sysM : LIN.m - 2;
    if (!par) LIN._sysM = LIN.m2;
    LIN.anim = { last: 0, sys: true, from: LIN.m2, to: par ? back : LIN.m, u: 0 };
    if (LIN.win.x0 === null) { LIN.win = linResolvedWin(); LIN.anim.auto = true; }           // Ausschnitt bleibt stehen
  } else { const w = linResolvedWin(); if (LIN.xv >= w.x1 - 1e-6) LIN.xv = 0; LIN.anim = { last: 0 }; }
  linRefreshUI(); requestAnimationFrame(linAnimFrame);
}
function linAnimFrame(ts) {
  const a = LIN.anim; if (!a) return;
  if (!linActive()) { LIN.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (LIN.view === 'par') { a.t += dt * 0.9; LIN.m = linR6(Math.round(3 * Math.sin(a.t) * 20) / 20); }
  else if (a.sys) {
    a.u = Math.min(1, a.u + dt / 5); const e = a.u * a.u * (3 - 2 * a.u);                   // weich an- und abfahren
    LIN.m2 = a.u >= 1 ? a.to : linR6(Math.round((a.from + (a.to - a.from) * e) * 100) / 100);
    if (a.u >= 1) { if (a.auto) LIN.win = Object.assign({}, LIN_WIN0); LIN.anim = null; LIN.cardKey = ''; linRefreshUI(); linSyncFields(); difRedraw(); linCardSoon(); difCommit(); return; }
    linSyncFields();
  } else {
    const w = linResolvedWin(); LIN.xv += (w.x1 - w.x0) * 0.15 * dt;
    if (LIN.xv >= w.x1) { LIN.xv = w.x1; LIN.anim = null; linRefreshUI(); difRedraw(); linCardSoon(); difCommit(); return; }
  }
  LIN.cardKey = ''; linCardSoon(); difRedraw();
  const sl = LIN.ui && LIN.view === 'par' && LIN.ui.params.querySelector('input[type=range]'); if (sl) sl.value = LIN.m;
  requestAnimationFrame(linAnimFrame);
}

// ── Maus und Berührung auf dem Canvas ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = LIN.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + hitR(4) && d < bd) { bd = d; best = q; } }); return best; };
  const setPt = (id, x, y, shift) => {
    const m = LIN.S && LIN.S.maps.main; if (!m) return;
    const st = Stat.niceStep(m.win.x1 - m.win.x0, 14), sx = difSnap(x, st, shift), sy = difSnap(y, st, shift), r = linR6;
    const mid = LIN.view === 'perp' && LIN.pmode === 'mid';
    if (id === 'q' || id === 'y1') LIN.q = r(sy);
    else if (id === 'y2') LIN.q2 = r(sy);
    else if (id === 'p') LIN.xp = r(sx);
    else if (id === 'xv') LIN.xv = r(sx);
    else if (id === 'N') { if (LIN.m !== 0) LIN.q = r(-LIN.m * sx); }
    else if (id === 'R') LIN.R = [r(sx), r(sy)];
    else if (id === 'P1') { if (mid) LIN.ma = [r(sx), r(sy)]; else LIN.p1 = [r(sx), r(sy)]; }
    else if (id === 'P2') { if (mid) LIN.mb = [r(sx), r(sy)]; else if (LIN.tmode === 'ps') LIN.tm = r(sy - LIN.p1[1]); else LIN.p2 = [r(sx), r(sy)]; }
    LIN.cardKey = '';
  };
  const down = e => {
    if (!linActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = LIN.S; if (!S) return; const p = pos(e); if (LIN.anim) { if (LIN.anim.auto) LIN.win = Object.assign({}, LIN_WIN0); LIN.anim = null; linRefreshUI(); }
    const q = near(p);
    if (q) { LIN.drag = { type: q.id }; if (LIN.win.x0 === null) { LIN.win = linResolvedWin(); LIN.drag.auto = true; } }   // Ausschnitt beim Ziehen festhalten
    else if (inMap(S.maps.main, p)) LIN.drag = { type: 'pan', px: p.x, py: p.y, w: linResolvedWin() };
    if (LIN.drag) cv.style.cursor = LIN.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!linActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = LIN.S; if (!S) return; const p = pos(e), d = LIN.drag;
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) ? 'crosshair' : ''); return; }
    const m = S.maps.main;
    if (d.type === 'pan') {
      const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0);
      LIN.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy };
    } else { setPt(d.type, m.IX(p.x), m.IY(p.y), e.shiftKey); linSyncFields(); }
    difRedraw(); if (d.type !== 'pan') linCardSoon();
  };
  const up = e => {
    if (!linActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !LIN.drag) return;
    if (LIN.drag) { if (LIN.drag.auto) LIN.win = Object.assign({}, LIN_WIN0); LIN.drag = null; cv.style.cursor = ''; linRefreshUI(); difRedraw(); linCardSoon(); difCommit(); }
  };
  const wheel = e => {
    if (!linActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = LIN.S; if (!S) return; const p = pos(e), m = S.maps.main; if (!inMap(m, p)) return;
    linZoom(stWheelF(e), m.IX(p.x), m.IY(p.y)); difRedraw();
    clearTimeout(LIN._wt); LIN._wt = setTimeout(() => { linRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!linActive()) return; e.stopImmediatePropagation(); e.preventDefault(); linResetWin(); };
  const stop = e => { if (linActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { LIN.cardKey = ''; if (linActive()) { linCardRender(); linRefreshUI(); difRedraw(); } }, ms)); });
linBuildUI();
document.addEventListener('DOMContentLoaded', () => setTimeout(linSetupFields, 150));
if (typeof module !== 'undefined' && module.exports) module.exports = {};
