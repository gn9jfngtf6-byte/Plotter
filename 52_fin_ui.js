// ═══════════════════════════════════════════════════════════════════
// 52_fin_ui.js — Finanzmathematik: Panel, Zustand, Überfahren/Klicken, Speichern, LaTeX
//
// Rechenkern: 50_fin.js (Fin). Bilder: 51_fin_draw.js (Szenen). Zeichnen auf den Canvas
// und TikZ-Ausgabe teilen sich Funktionen mit der Statistik (42_stat_ui.js: statPaint,
// stSceneTex). Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «fin»).
// ═══════════════════════════════════════════════════════════════════
const FIN_MODES = [['line', 'Zeitstrahl und Konten'], ['sum', 'Zeitstrahl und Summenzeichen'], ['save', 'Sparplan'], ['loan', 'Kredit und Tilgungsplan'],
  ['value', 'Zeitwert und Zinseszins'], ['march', 'Marchzins (Kalender)'], ['mline', 'Marchzins: Zeitstrahl und Konten'], ['conform', 'Konformer Zins']];
const FIN_DEF = {
  line: { p: 2.5, N: 5, T: 4, years: true, startYear: 2016, pay: [{ t: 0, a: 12000 }, { t: 2, a: 8500 }, { t: 3, a: 5500 }], solve: false, xi: 2, target: 27813.57 },
  sum: { p: 5, H: 10, R: 1000, dir: 'auf', first: 1, last: 1, solve: false, target: 12577.89 },
  save: { p: 3, years: 10, m: 1, R: 1000, due: 0, solve: false, target: 20000 },
  loan: { p: 6, years: 5, m: 1, K: 20000, due: 0 },
  value: { kind: 'auf', K: 1000, K2: 2000, p: 3.25, n: 6 },
  march: { K: 23400, p: 3.5, d1: 1, m1: 4, d2: 23, m2: 8 },
  mline: { p: 1.5, K0: 10000, d2: 31, m2: 12, pay: [{ d: 15, m: 3, a: 4000 }, { d: 20, m: 6, a: -2500 }, { d: 1, m: 10, a: 3000 }] },
  conform: { given: 'p', p: 3, i: 0.25, m: 12, K: 1000 }
};
const FIN_DESC = {
  line: ['Jede Zahlung liegt auf einem eigenen Konto: Sie wird einzeln auf den gesuchten Zeitpunkt auf- oder abgezinst. Am Schluss werden die Werte addiert. «▶ Zahlungen wandern lassen» zeigt Jahr für Jahr, wie jede Zahlung wächst oder schrumpft.', 'Klicke auf einen Zeitpunkt der Achse, um eine Zahlung hinzuzufügen; Klick auf einen Pfeil entfernt sie. Die Beträge änderst du unten in der Liste.'],
  sum: ['Regelmässige Raten als Summe: Der Exponent k jeder Zahlung ist die Anzahl Verzinsungen (Aufzinsen) bzw. Abzinsungen (Abzinsen).', 'Beobachte, wie sich die Summationsgrenzen verschieben, wenn die erste oder letzte Zahlung wandert.'],
  save: ['Ein Sparplan: Jede Periode wird dieselbe Rate eingezahlt. Gesucht ist der Endwert oder die nötige Rate.', 'Mit Raten pro Jahr wird mit dem konformen Zinssatz gerechnet.'],
  loan: ['Ein Kredit wird mit gleichen Raten (Annuität) zurückbezahlt. Der Barwert der Raten ist der Kredit.', 'Im Tilgungsplan sinkt der Zinsanteil, der Tilgungsanteil steigt.'],
  value: ['Geld hat einen Zeitwert: Beträge zu verschiedenen Zeitpunkten werden mit dem Zinsfaktor auf- oder abgezinst.', 'Gesucht sein kann der Endwert, der Barwert, die Rendite, die Laufzeit oder der Wert bei Abschreibung.'],
  march: ['Marchzins: Wird ein Kapital nur einen Teil des Jahres verzinst, zählt man die Zinstage nach Schweizer Usanz (Monat = 30 Tage, Jahr = 360 Tage).', 'Der Bringtag zählt nicht, der Holtag zählt. Klicke im Kalender zuerst den Bringtag, dann den Holtag an.'],
  mline: ['Trage links jede {{Ein- oder Auszahlung|pay}} mit ihrem Datum ein: Jede liegt auf einem {{eigenen Konto|lanes}} und trägt Marchzins bis zum {{Stichtag|T}}. Die {{Tabelle|tab}} zeigt Zinstage und Zins je Konto, am Schluss werden {{Kapital und Zinsen addiert|z}}. «▶ Zinsen wachsen lassen» zeigt, wie der Zins Tag für Tag dazukommt.', 'Prinzip der verschiedenen Konti beim Marchzins: Der Saldo am Jahresanfang und jede Ein- oder Auszahlung werden wie ein eigenes Konto behandelt. Jedes trägt Zins für seine Zinstage bis zum Stichtag (Monat = 30 Tage, Jahr = 360 Tage). Eine Auszahlung zählt als Konto mit negativem Betrag, ihr Zins wird abgezogen. Kapital und Zinsen zusammen ergeben den Saldo am Stichtag.'],
  conform: ['Wird der Zins mehrmals pro Jahr gutgeschrieben, rechnet man mit dem konformen Zinssatz, der über das Jahr genau den Jahreszins ergibt.', 'Der proportionale Zins p/m ergibt dagegen einen höheren effektiven Jahreszins.']
};
const FIN_MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const FIN_PRESETS = [
  ['reto', 'Reto: drei Einzahlungen', { p: 2.5, N: 5, T: 4, years: true, startYear: 2016, pay: [{ t: 0, a: 12000 }, { t: 2, a: 8500 }, { t: 3, a: 5500 }] }],
  ['sparen', 'Sparen mit einer Abhebung', { p: 2, N: 6, T: 6, years: false, startYear: 2020, pay: [{ t: 0, a: 5000 }, { t: 1, a: 2000 }, { t: 2, a: 2000 }, { t: 4, a: -3000 }] }],
  ['stereo', 'Stereoanlage auf Raten (Barwert)', { p: 3, N: 4, T: 0, years: false, startYear: 2020, pay: [{ t: 0, a: -1000 }, { t: 2, a: -2500 }, { t: 4, a: -9700 }] }]
];
// Beispiele für «Marchzins: Zeitstrahl und Konten»
const FIN_PRESETS_M = [
  ['spar', 'Sparkonto: zwei Einzahlungen', { p: 1.5, K0: 8000, d2: 31, m2: 12, pay: [{ d: 31, m: 3, a: 4000 }, { d: 30, m: 6, a: 2000 }] }],
  ['bezug', 'Konto mit einem Bezug', { p: 2, K0: 10000, d2: 31, m2: 12, pay: [{ d: 30, m: 6, a: -4000 }] }],
  ['lohn', 'Lohnkonto: Eingänge und Bezüge', { p: 1, K0: 2500, d2: 31, m2: 12, pay: [{ d: 25, m: 1, a: 5200 }, { d: 10, m: 2, a: -3800 }, { d: 25, m: 2, a: 5200 }, { d: 12, m: 3, a: -4500 }] }],
  ['halb', 'Abschluss am 30. Juni', { p: 2.5, K0: 0, d2: 30, m2: 6, pay: [{ d: 10, m: 1, a: 6000 }, { d: 25, m: 2, a: 1500 }, { d: 12, m: 4, a: -2000 }] }]
];

function finRangeP() { return { k: 'p', t: 'range', l: 'Zinssatz p (% pro Jahr)', min: 0.25, max: 12, step: 0.25 }; }
const FIN_M_OPTS = [[1, 'jährlich (1×)'], [2, 'halbjährlich (2×)'], [4, 'vierteljährlich (4×)'], [12, 'monatlich (12×)']];
function finControls(mode, P) {
  switch (mode) {
    case 'line': {
      const o = []; for (let t = 0; t <= P.N; t++) o.push([t, String(P.years ? P.startYear + t : t)]);
      return [finRangeP(), { k: 'N', t: 'range', l: 'Anzahl Jahre', min: 2, max: 15, step: 1 },
        { k: 'T', t: 'select', l: 'Gesuchter Zeitpunkt «?»', o },
        { k: 'years', t: 'check', l: 'Jahreszahlen statt 0, 1, 2 …' }, { k: 'startYear', t: 'num', l: 'Startjahr', min: 1900, max: 2200, step: 1, show: P.years },
        { k: 'solve', t: 'check', l: 'Eine Zahlung ist gesucht (Gleichung)' }, { k: 'target', t: 'num', l: 'Wert zum Zeitpunkt «?» soll sein (CHF)', min: -1e9, max: 1e9, step: 100, show: P.solve }];
    }
    case 'sum': return [finRangeP(), { k: 'H', t: 'range', l: 'Laufzeit (Jahre)', min: 2, max: 20, step: 1 },
      { k: 'dir', t: 'select', l: 'Bewertung', o: [['auf', 'Aufzinsen (Wert am Ende, Sparplan)'], ['ab', 'Abzinsen (Barwert heute, Kredit, Rente)']] },
      { k: 'first', t: 'select', l: 'Erste Zahlung', o: [[0, 'jetzt (t = 0)'], [1, 'in einem Jahr (t = 1)']] },
      { k: 'last', t: 'select', l: 'Letzte Zahlung', o: [[0, 'in ' + (P.H - 1) + ' Jahren'], [1, 'in ' + P.H + ' Jahren']] },
      { k: 'R', t: 'num', l: 'Rate R (CHF)', min: 1, max: 1e8, step: 100, show: !P.solve },
      { k: 'solve', t: 'check', l: 'Rate gesucht (Zielbetrag vorgeben)' }, { k: 'target', t: 'num', l: P.dir === 'auf' ? 'Zielbetrag am Ende (CHF)' : 'Barwert heute (CHF)', min: 1, max: 1e9, step: 1000, show: P.solve }];
    case 'save': return [finRangeP(), { k: 'years', t: 'range', l: 'Laufzeit (Jahre)', min: 1, max: 40, step: 1 }, { k: 'm', t: 'select', l: 'Raten pro Jahr', o: FIN_M_OPTS },
      { k: 'due', t: 'select', l: 'Zahlungszeitpunkt', o: [[0, 'nachschüssig (Ende jeder Periode)'], [1, 'vorschüssig (Anfang jeder Periode)']] },
      { k: 'R', t: 'num', l: 'Rate pro Periode (CHF)', min: 1, max: 1e8, step: 50, show: !P.solve },
      { k: 'solve', t: 'check', l: 'Rate gesucht (Sparziel vorgeben)' }, { k: 'target', t: 'num', l: 'Sparziel am Ende (CHF)', min: 1, max: 1e9, step: 1000, show: P.solve }];
    case 'loan': return [finRangeP(), { k: 'K', t: 'num', l: 'Kredit (CHF)', min: 100, max: 1e8, step: 1000 }, { k: 'years', t: 'range', l: 'Laufzeit (Jahre)', min: 1, max: 30, step: 1 }, { k: 'm', t: 'select', l: 'Raten pro Jahr', o: FIN_M_OPTS },
      { k: 'due', t: 'select', l: 'Zahlungszeitpunkt', o: [[0, 'nachschüssig (Ende jeder Periode)'], [1, 'vorschüssig (Anfang jeder Periode)']] }];
    case 'value': return [{ k: 'kind', t: 'select', l: 'Gesucht ist', o: [['auf', 'Endwert (Aufzinsen)'], ['ab', 'Barwert (Abzinsen)'], ['rendite', 'Rendite (Zinssatz)'], ['laufzeit', 'Laufzeit'], ['abschr', 'Wert nach Abschreibung']] },
      { k: 'K', t: 'num', l: P.kind === 'ab' ? 'Betrag in der Zukunft (CHF)' : 'Anfangswert (CHF)', min: 1, max: 1e9, step: 100 },
      { k: 'K2', t: 'num', l: 'Endwert (CHF)', min: 1, max: 1e9, step: 100, show: P.kind === 'rendite' || P.kind === 'laufzeit' },
      { k: 'p', t: 'range', l: P.kind === 'abschr' ? 'Abschreibung p (% pro Jahr)' : 'Zinssatz p (% pro Jahr)', min: 0.25, max: 25, step: 0.25, show: P.kind !== 'rendite' },
      { k: 'n', t: 'range', l: 'Laufzeit n (Jahre)', min: 1, max: 40, step: 1, show: P.kind !== 'laufzeit' }];
    case 'march': {
      const dd = []; for (let d = 1; d <= 31; d++) dd.push([d, String(d)]); const mm = FIN_MON.map((n, i) => [i + 1, n]);
      return [{ k: 'K', t: 'num', l: 'Kapital (CHF)', min: 1, max: 1e9, step: 100 }, finRangeP(),
        { k: 'd1', t: 'select', l: 'Von: Tag (Bringtag)', o: dd }, { k: 'm1', t: 'select', l: 'Von: Monat', o: mm }, { k: 'd2', t: 'select', l: 'Bis: Tag (Holtag)', o: dd }, { k: 'm2', t: 'select', l: 'Bis: Monat', o: mm }];
    }
    case 'mline': {
      const dd = []; for (let d = 1; d <= Fin.dayMax(P.m2); d++) dd.push([d, String(d)]); const mm = FIN_MON.map((n, i) => [i + 1, n]);
      return [finRangeP(), { k: 'K0', t: 'num', l: 'Saldo am Jahresanfang (CHF)', min: 0, max: 1e9, step: 500 },
        { k: 'd2', t: 'select', l: 'Stichtag: Tag', o: dd }, { k: 'm2', t: 'select', l: 'Stichtag: Monat', o: mm }];
    }
    case 'conform': return [{ k: 'given', t: 'select', l: 'Gegeben ist', o: [['p', 'der Jahreszins p'], ['i', 'der Zins i pro Teilperiode']] },
      { k: 'p', t: 'range', l: 'Jahreszins p (%)', min: 0.25, max: 12, step: 0.25, show: P.given === 'p' }, { k: 'i', t: 'range', l: 'Zins i pro Teilperiode (%)', min: 0.05, max: 3, step: 0.05, show: P.given === 'i' },
      { k: 'm', t: 'select', l: 'Verzinsungen pro Jahr', o: [[2, 'halbjährlich (2×)'], [3, '3×'], [4, 'vierteljährlich (4×)'], [6, '6×'], [12, 'monatlich (12×)']] },
      { k: 'K', t: 'num', l: 'Kapital (CHF)', min: 1, max: 1e9, step: 100 }];
    default: return [];
  }
}

function finActive() { return typeof ENV !== 'undefined' && ENV.cur === 'fin'; }
const $fin = id => document.getElementById(id);
const finEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const finCopy = o => JSON.parse(JSON.stringify(o));

// ── Zustand ──
function finDefaults() { return { mode: 'line', P: finCopy(FIN_DEF) }; }
const FIN = Object.assign(finDefaults(), { hover: -1, hoverCal: null, calNext: 'd1', hits: [], ui: null, anim: null });

function finCapture() { return finCopy({ mode: FIN.mode, P: FIN.P }); }
function finSanitizeP(mode, src) {
  const P = finCopy(FIN_DEF[mode]);
  if (!src || typeof src !== 'object') return P;
  const tmp = Object.assign({}, P, src);
  finControls(mode, tmp).forEach(c => {
    if (!c.k || !(c.k in src)) return;
    const v = src[c.k];
    if (c.t === 'check') P[c.k] = !!v;
    else if (c.t === 'range' || c.t === 'num') { const x = Number(v); if (isFinite(x)) P[c.k] = Math.max(c.min, Math.min(c.max, x)); }
    else if (c.t === 'select') { const o = c.o.find(q => String(q[0]) === String(v)); if (o) P[c.k] = o[0]; }
  });
  if (mode === 'line') {
    P.N = Math.round(P.N); P.T = Math.max(0, Math.min(P.N, Math.round(Number(src.T) >= 0 ? Number(src.T) : P.T)));
    P.startYear = Math.round(P.startYear);
    if (Array.isArray(src.pay)) {
      P.pay = src.pay.filter(z => z && Number.isFinite(Number(z.t)) && Number.isFinite(Number(z.a))).slice(0, 12).map(z => ({ t: Math.max(0, Math.min(P.N, Math.round(Number(z.t)))), a: Math.max(-1e9, Math.min(1e9, Number(z.a))) }));
    }
    P.xi = Math.max(0, Math.min(P.pay.length - 1, Math.round(Number(src.xi) || 0)));
    if (!P.pay.length) P.solve = false;
  }
  if (mode === 'mline') {
    if (Array.isArray(src.pay)) P.pay = src.pay.filter(z => z && Number.isFinite(Number(z.d)) && Number.isFinite(Number(z.m)) && Number.isFinite(Number(z.a))).slice(0, 8).map(z => { const m = Math.max(1, Math.min(12, Math.round(Number(z.m)))); return { d: Math.max(1, Math.min(Fin.dayMax(m), Math.round(Number(z.d)))), m, a: Math.max(-1e9, Math.min(1e9, Number(z.a))) }; });
    P.d2 = Math.max(1, Math.min(Fin.dayMax(P.m2), Math.round(Number(src.d2) || P.d2)));
  }
  if (mode === 'sum') { P.H = Math.round(P.H); P.first = P.first ? 1 : 0; P.last = P.last ? 1 : 0; }
  if (mode === 'save' || mode === 'loan') { P.years = Math.round(P.years); P.due = P.due ? 1 : 0; if (P.years * P.m > 480) P.years = Math.floor(480 / P.m); }
  if (mode === 'value') P.n = Math.round(P.n);
  return P;
}
function finApply(s) {
  FIN.anim = null;                                                       // laufende Animation beenden (Rückgängig, Laden, Zurücksetzen)
  const d = finDefaults();
  if (s && typeof s === 'object') {
    if (FIN_MODES.some(m => m[0] === s.mode)) d.mode = s.mode;
    FIN_MODES.forEach(([id]) => { d.P[id] = finSanitizeP(id, s.P && s.P[id]); });
  }
  FIN.mode = d.mode; FIN.P = d.P; FIN.hover = -1; FIN.hoverCal = null; FIN.calNext = 'd1';
  finRefreshUI(); finRedraw();
}
function finRedraw() { if (typeof scheduleDraw === 'function') scheduleDraw(); }
function finCommit() { if (typeof pushHistory === 'function') pushHistory(); }

// ── Nach Änderungen: Abhängigkeiten gerade ziehen ──
function finFix(mode) {
  const P = FIN.P[mode];
  if (mode === 'line') {
    P.N = Math.max(2, Math.min(15, Math.round(P.N)));
    P.T = Math.max(0, Math.min(P.N, Math.round(P.T)));
    P.pay.forEach(z => { z.t = Math.max(0, Math.min(P.N, Math.round(z.t))); });
    if (P.xi >= P.pay.length) P.xi = Math.max(0, P.pay.length - 1);
    if (!P.pay.length) P.solve = false;
  }
  if (mode === 'save' || mode === 'loan') { if (P.years * P.m > 480) P.years = Math.floor(480 / P.m); }
  if (mode === 'mline') { P.d2 = Math.max(1, Math.min(Fin.dayMax(P.m2), Math.round(P.d2))); P.pay.forEach(z => { z.d = Math.max(1, Math.min(Fin.dayMax(z.m), Math.round(z.d))); }); }
}

// ── Panel ──
function finBuildUI() {
  if (FIN.ui || !$fin('fin-panel')) return;
  const ui = FIN.ui = {}, body = $fin('fin-body');
  ui.sel = finEl('select'); ui.sel.id = 'fin-mode';
  FIN_MODES.forEach(([id, nm]) => { const o = finEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { FIN.mode = ui.sel.value; FIN.hover = -1; FIN.hoverCal = null; FIN.calNext = 'd1'; finRefreshUI(); finRedraw(); finCommit(); });
  const lab = finEl('div', 'subpanel-label', 'Ansicht'); lab.style.marginTop = '0';
  ui.desc = finEl('div', 'act-hint'); ui.desc.style.cssText = 'margin:6px 2px 8px;';
  ui.params = finEl('div', 'alg-opts'); ui.extra = finEl('div'); ui.links = finEl('div');
  body.append(lab, ui.sel, ui.desc, ui.params, ui.extra, ui.links);
  const det = finEl('details', 'geo-box td-sec');
  det.append(finEl('summary', null, 'Export'));
  const ac = finEl('div', 'ex-actions');
  ui.bj = finEl('button', null, '📷 JPEG'); ui.bl = finEl('button', 'ex-primary', 'LaTeX'); ui.bc = finEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.bc);
  ui.ta = finEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code (TikZ) erscheint hier…'; ui.msg = finEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', finMakeLatex); ui.bc.addEventListener('click', finCopyLatex);
  finRefreshUI();
}
function finBtn(txt, fn, title) { const b = finEl('button', null, txt); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', fn); return b; }
function finShowVal(c, v) {
  if (c.k === 'p' || c.k === 'i') return Fin.num(v, 2) + ' %';
  return Fin.num(v, 2);
}
function finRefreshUI() {
  const ui = FIN.ui; if (!ui) return;
  const m = FIN.mode, P = FIN.P[m];
  ui.sel.value = m;
  const d = FIN_DESC[m]; ui.desc.replaceChildren(finEl('div', null, d[1])); if (typeof envHint === 'function') envHint('fin', d[0], () => FIN.S);   // Hinweis als Überschrift über dem Bild
  ui.params.replaceChildren();
  finControls(m, P).forEach(c => {
    if (c.show === false) return;
    const row = finEl('div', 'settings-row'); row.style.gap = '8px';
    const id = 'fin-c-' + c.k;
    const changed = (rebuild) => { finFix(m); if (rebuild) finRefreshUI(); finRedraw(); finCommit(); };
    if (c.t === 'check') {
      const lb = finEl('label'), inp = finEl('input'); inp.type = 'checkbox'; inp.id = id; inp.checked = !!P[c.k];
      lb.append(inp, document.createTextNode(' '), finEl('span', null, c.l)); row.appendChild(lb);
      inp.addEventListener('change', () => { P[c.k] = inp.checked; changed(true); });
      ui.params.appendChild(row);
    } else if (c.t === 'select') {
      const lb = finEl('label', null, c.l); lb.setAttribute('for', id);
      const sel = finEl('select'); sel.id = id; c.o.forEach(o => { const op = finEl('option', null, String(o[1])); op.value = String(o[0]); sel.appendChild(op); });
      sel.value = String(P[c.k]);
      sel.addEventListener('change', () => { const o = c.o.find(q => String(q[0]) === sel.value); if (o) P[c.k] = o[0]; changed(true); });
      row.append(lb, sel); ui.params.appendChild(row);
    } else if (c.t === 'num') {
      const lb = finEl('label', null, c.l); lb.setAttribute('for', id);
      const inp = finEl('input'); inp.type = 'number'; inp.id = id; inp.min = c.min; inp.max = c.max; inp.step = c.step; inp.value = String(Math.round(P[c.k] * 100) / 100); inp.style.width = '110px';
      inp.addEventListener('input', () => { const x = parseFloat(inp.value); if (isFinite(x)) { P[c.k] = Math.max(c.min, Math.min(c.max, x)); finFix(m); finRedraw(); } });
      inp.addEventListener('change', () => { const x = parseFloat(inp.value); if (isFinite(x)) P[c.k] = Math.max(c.min, Math.min(c.max, x)); changed(false); });
      row.append(lb, inp); ui.params.appendChild(row);
    } else if (c.t === 'range') {
      const wrap = finEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
      const top = finEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
      const lb = finEl('label', null, c.l); lb.setAttribute('for', id);
      const val = finEl('b', null, finShowVal(c, P[c.k])); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
      top.append(lb, val);
      const inp = finEl('input'); inp.type = 'range'; inp.id = id; inp.min = c.min; inp.max = c.max; inp.step = c.step; inp.value = P[c.k]; inp.style.width = '100%';
      inp.addEventListener('input', () => { P[c.k] = parseFloat(inp.value); finFix(m); val.textContent = finShowVal(c, P[c.k]); finRedraw(); });
      inp.addEventListener('change', () => { finFix(m); finRefreshUI(); finCommit(); });
      wrap.append(top, inp); row.appendChild(wrap); ui.params.appendChild(row);
    }
  });
  finRefreshExtra();
}
// Zahlungsliste (Zeitstrahl) und Verweise auf andere Umgebungen
function finRefreshExtra() {
  const ui = FIN.ui; if (!ui) return;
  ui.extra.replaceChildren(); ui.links.replaceChildren();
  const m = FIN.mode, P = FIN.P[m];
  if (m === 'line') {
    const box = finEl('div', 'td-sec');
    { const ab = finBtn(FIN.anim ? '⏸ Pause' : '▶ Zahlungen wandern lassen (auf-/abzinsen)', finAnimToggle); ab.style.cssText = 'width:100%;margin-bottom:6px;'; box.appendChild(ab); }
    box.appendChild(finEl('div', 'subpanel-label', 'Zahlungen'));
    P.pay.forEach((z, i) => {
      const row = finEl('div'); row.style.cssText = 'display:grid;grid-template-columns:1fr 1.2fr auto auto;gap:5px;align-items:center;margin-top:4px;';
      row.addEventListener('mouseenter', () => { FIN.hover = i; finRedraw(); }); row.addEventListener('mouseleave', () => { FIN.hover = -1; finRedraw(); });
      const ts = finEl('select'); for (let t = 0; t <= P.N; t++) { const o = finEl('option', null, String(P.years ? P.startYear + t : t)); o.value = String(t); ts.appendChild(o); } ts.value = String(z.t);
      ts.addEventListener('change', () => { z.t = parseInt(ts.value, 10); finRedraw(); finCommit(); });
      const inp = finEl('input'); inp.type = 'number'; inp.step = 100; inp.value = String(Math.round(z.a * 100) / 100); inp.title = 'positiv: Einzahlung, negativ: Auszahlung'; inp.style.width = '100%';
      if (P.solve && P.xi === i) { inp.disabled = true; inp.value = ''; inp.placeholder = 'x gesucht'; inp.title = 'gesuchte Zahlung x'; }
      inp.addEventListener('input', () => { const x = parseFloat(inp.value); if (isFinite(x)) { z.a = Math.max(-1e9, Math.min(1e9, x)); finRedraw(); } });
      inp.addEventListener('change', () => finCommit());
      row.append(ts, inp);
      if (P.solve) { const rb = finEl('input'); rb.type = 'radio'; rb.name = 'fin-xi'; rb.checked = P.xi === i; rb.title = 'diese Zahlung ist gesucht (x)'; rb.addEventListener('change', () => { P.xi = i; finRefreshExtra(); finRedraw(); finCommit(); }); row.appendChild(rb); } else row.appendChild(finEl('span'));
      const del = finBtn('×', () => { P.pay.splice(i, 1); finFix('line'); finRefreshExtra(); finRedraw(); finCommit(); }, 'Zahlung entfernen'); del.style.padding = '2px 8px';
      row.appendChild(del); box.appendChild(row);
    });
    const ar = finEl('div'); ar.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px;';
    ar.append(finBtn('+ Einzahlung', () => finAddPay(1)), finBtn('+ Auszahlung', () => finAddPay(-1)));
    box.appendChild(ar);
    const pl = finEl('div'); pl.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:8px;';
    const ps = finEl('select'); const o0 = finEl('option', null, 'Beispiel laden …'); o0.value = ''; ps.appendChild(o0);
    FIN_PRESETS.forEach(([id, nm]) => { const o = finEl('option', null, nm); o.value = id; ps.appendChild(o); });
    ps.addEventListener('change', () => { const pr = FIN_PRESETS.find(q => q[0] === ps.value); if (!pr) return; Object.assign(P, finCopy(pr[2])); P.solve = false; finFix('line'); finRefreshUI(); finRedraw(); finCommit(); });
    pl.appendChild(ps); box.appendChild(pl);
    ui.extra.appendChild(box);
  }
  if (m === 'mline') {
    const box = finEl('div', 'td-sec');
    { const ab = finBtn(FIN.anim ? '⏸ Pause' : '▶ Zinsen wachsen lassen (Tag für Tag)', finAnimToggle); ab.style.cssText = 'width:100%;margin-bottom:6px;'; box.appendChild(ab); }
    box.appendChild(finEl('div', 'subpanel-label', 'Zahlungen'));
    P.pay.forEach((z, i) => {
      const row = finEl('div'); row.style.cssText = 'display:grid;grid-template-columns:56px 1.15fr 1fr auto;gap:5px;align-items:center;margin-top:4px;';
      row.addEventListener('mouseenter', () => { FIN.hover = i; finRedraw(); }); row.addEventListener('mouseleave', () => { FIN.hover = -1; finRedraw(); });
      const ds = finEl('select'); ds.title = 'Tag'; for (let d = 1; d <= Fin.dayMax(z.m); d++) { const o = finEl('option', null, String(d)); o.value = String(d); ds.appendChild(o); } ds.value = String(z.d);
      ds.addEventListener('change', () => { z.d = parseInt(ds.value, 10); finRedraw(); finCommit(); });
      const ms = finEl('select'); ms.title = 'Monat'; FIN_MON.forEach((nm, k) => { const o = finEl('option', null, nm); o.value = String(k + 1); ms.appendChild(o); }); ms.value = String(z.m);
      ms.addEventListener('change', () => { z.m = parseInt(ms.value, 10); finFix('mline'); finRefreshExtra(); finRedraw(); finCommit(); });
      const inp = finEl('input'); inp.type = 'number'; inp.step = 100; inp.value = String(Math.round(z.a * 100) / 100); inp.title = 'positiv: Einzahlung, negativ: Auszahlung'; inp.style.width = '100%';
      inp.addEventListener('input', () => { const x = parseFloat(inp.value); if (isFinite(x)) { z.a = Math.max(-1e9, Math.min(1e9, x)); finRedraw(); } });
      inp.addEventListener('change', () => finCommit());
      const del = finBtn('×', () => { P.pay.splice(i, 1); FIN.anim = null; finRefreshExtra(); finRedraw(); finCommit(); }, 'Zahlung entfernen'); del.style.padding = '2px 8px';
      row.append(ds, ms, inp, del); box.appendChild(row);
    });
    const ar = finEl('div'); ar.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px;';
    ar.append(finBtn('+ Einzahlung', () => finAddPayM(1)), finBtn('+ Auszahlung', () => finAddPayM(-1)));
    box.appendChild(ar);
    const pl = finEl('div'); pl.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:8px;';
    const ps = finEl('select'); const o0 = finEl('option', null, 'Beispiel laden …'); o0.value = ''; ps.appendChild(o0);
    FIN_PRESETS_M.forEach(([id, nm]) => { const o = finEl('option', null, nm); o.value = id; ps.appendChild(o); });
    ps.addEventListener('change', () => { const pr = FIN_PRESETS_M.find(q => q[0] === ps.value); if (!pr) return; FIN.anim = null; Object.assign(P, finCopy(pr[2])); finFix('mline'); finRefreshUI(); finRedraw(); finCommit(); });
    pl.appendChild(ps); box.appendChild(pl);
    ui.extra.appendChild(box);
  }
  const lk = finEl('div', 'td-sec'); lk.appendChild(finEl('div', 'subpanel-label', 'Verwandte Umgebungen'));
  const lr = finEl('div'); lr.style.cssText = 'display:grid;grid-template-columns:1fr;gap:5px;margin-top:4px;';
  const go = (id) => () => { if (typeof envSwitch === 'function') envSwitch(id); };
  if (m === 'sum' || m === 'save' || m === 'loan' || m === 'line') lr.appendChild(finBtn('Folgen und Summen →', go('seq'), 'Zur Umgebung Folgen'));
  lr.appendChild(finBtn('Potenzen und Logarithmen (Algebra) →', go('alg'), 'Zur Umgebung Algebra'));
  lk.appendChild(lr); ui.links.appendChild(lk);
}
function finAddPay(sign) {
  const P = FIN.P.line; if (P.pay.length >= 12) return;
  const used = new Set(P.pay.map(z => z.t)); let t = 0; while (t < P.N && used.has(t)) t++;
  P.pay.push({ t, a: sign * (P.pay.length ? Math.abs(P.pay[P.pay.length - 1].a) : 1000) });
  finRefreshExtra(); finRedraw(); finCommit();
}
// Marchzins-Konten: neue Zahlung (höchstens 8); tag = 15. des Monats nach der letzten Zahlung
function finAddPayM(sign, month) {
  const P = FIN.P.mline; if (P.pay.length >= 8) return;
  const last = P.pay[P.pay.length - 1], m = month || Math.min(12, (last ? last.m : 0) + 1);
  P.pay.push({ d: 15, m, a: sign * (last ? Math.abs(last.a) : 1000) });
  FIN.anim = null; finRefreshExtra(); finRedraw(); finCommit();
}

// ── Zeichnen ──
// ── Animation (Zeitstrahl und Konten): jede Zahlung wandert zum Zielzeitpunkt, nach jedem Jahr wird einmal mit r multipliziert bzw. dividiert ──
function finAnimPay() { const P = FIN.P.line; return P.pay.map((z, i) => ({ t: z.t, i })).sort((a, b) => a.t - b.t || a.i - b.i); }
function finAnimToggle() {
  if (FIN.anim) { FIN.anim = null; finRefreshExtra(); finRedraw(); return; }
  if (FIN.mode === 'mline') {                                             // Marchzins: der Zins jedes Kontos wächst Tag für Tag bis zum Stichtag
    const rows = finAnimRowsM(); if (!rows.length) return;
    FIN.anim = { last: 0, j: 0, tau: rows[0].no, wait: 0.6 }; FIN.hover = -1;
    finRefreshExtra(); finRedraw(); requestAnimationFrame(finAnimFrameM); return;
  }
  const pay = finAnimPay(); if (!pay.length) return;
  FIN.anim = { last: 0, j: 0, tau: pay[0].t, wait: 0.8 }; FIN.hover = -1;
  finRefreshExtra(); finRedraw(); requestAnimationFrame(finAnimFrame);
}
function finAnimFrame(ts) {
  const a = FIN.anim; if (!a) return;
  if (!finActive() || FIN.mode !== 'line') { FIN.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (a.wait > 0) { a.wait -= dt; requestAnimationFrame(finAnimFrame); return; }
  const P = FIN.P.line, pay = finAnimPay(), z = pay[a.j];
  if (!z) { FIN.anim = null; finRefreshExtra(); finRedraw(); return; }
  const d = P.T - a.tau;
  if (Math.abs(d) < 1e-9) { a.j++; if (a.j >= pay.length) { finRedraw(); setTimeout(() => { if (FIN.anim === a) { FIN.anim = null; finRefreshExtra(); finRedraw(); } }, 1500); return; } a.tau = pay[a.j].t; a.wait = 0.7; finRedraw(); requestAnimationFrame(finAnimFrame); return; }
  const before = a.tau, st = dt * 1.1; a.tau += Math.sign(d) * Math.min(Math.abs(d), st);
  const kb = Math.floor(Math.abs(before - z.t) + 1e-9), ka = Math.floor(Math.abs(a.tau - z.t) + 1e-9);
  if (ka > kb) { a.tau = z.t + Math.sign(d) * ka; a.wait = 0.55; }               // nach jedem vollen Jahr kurz halten: ein Zinsschritt
  finRedraw(); requestAnimationFrame(finAnimFrame);
}
function finAnimRowsM() { const P = FIN.P.mline, R = Fin.marchKonti(P.K0, P.pay, P.p, P.d2, P.m2); return R.rows.filter(r => !r.late).map(r => ({ no: r.no, T: R.T })); }
function finAnimFrameM(ts) {
  const a = FIN.anim; if (!a) return;
  if (!finActive() || FIN.mode !== 'mline') { FIN.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (a.wait > 0) { a.wait -= dt; requestAnimationFrame(finAnimFrameM); return; }
  const rows = finAnimRowsM(), z = rows[a.j];
  if (!z) { FIN.anim = null; finRefreshExtra(); finRedraw(); return; }
  if (a.tau >= z.T - 1e-9) {
    a.j++;
    if (a.j >= rows.length) { finRedraw(); setTimeout(() => { if (FIN.anim === a) { FIN.anim = null; finRefreshExtra(); finRedraw(); } }, 2500); return; }
    a.tau = rows[a.j].no; a.wait = 0.6; finRedraw(); requestAnimationFrame(finAnimFrameM); return;
  }
  a.tau = Math.min(z.T, a.tau + dt * 110);                                // rund 110 Zinstage pro Sekunde
  finRedraw(); requestAnimationFrame(finAnimFrameM);
}
function finCtx(W, H, exp) {
  const m = FIN.mode, P = FIN.P[m], C = { mode: m, P, hover: exp ? -1 : FIN.hover, hoverCal: exp ? null : FIN.hoverCal, calNext: FIN.calNext, fs: exp ? exp.fs : stSceneFs(W, H, 52) };
  if (m === 'line' && C.hover >= 0 && P.pay[C.hover]) {
    const z = P.pay[C.hover], q = Fin.factor(P.p), k = P.T - z.t, a = (P.solve && P.xi === C.hover) ? null : z.a;
    if (a !== null) C.hoverInfo = '\\col{v}{' + finAmtR(a) + (k === 0 ? '' : '\\cdot' + Fin.rText(P.p) + '^{' + k + '}') + '=' + finRM(a * Math.pow(q, k)) + '\\text{ CHF}}';
  }
  if (m === 'mline' && C.hover >= 0) {
    const r = Fin.marchKonti(P.K0, P.pay, P.p, P.d2, P.m2).rows.find(q => (q.start ? 99 : q.i) === C.hover);
    if (r && !r.late) C.hoverInfo = '\\col{v}{\\frac{' + r.days + '}{360}\\cdot\\frac{' + finRN(P.p, 3) + '\\cdot' + (r.a < 0 ? '(' + finAmtR(r.a) + ')' : finAmtR(r.a)) + '}{100}=' + finRM(r.z) + '\\text{ CHF}}';
  }
  if ((m === 'line' || m === 'mline') && FIN.anim && !exp) C.lineAnim = { j: FIN.anim.j, tau: FIN.anim.tau };
  return C;
}
function finDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  const S = finBuildScene(w, h, finCtx(w, h));
  FIN.hits = S.hits; FIN.S = S;
  statPaint(S, w, h);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// Marchzins: Tag im Kalender anklicken (abwechselnd Bringtag und Holtag); Ende Februar zählt als 30. und wird als 28. gespeichert
function finPickDay(d, m) {
  const P = FIN.P.march; if (m === 2 && d >= 28) d = 28;
  if (FIN.calNext === 'd2') { P.d2 = d; P.m2 = m; FIN.calNext = 'd1'; } else { P.d1 = d; P.m1 = m; FIN.calNext = 'd2'; }
  finRefreshUI(); finRedraw(); finCommit();
}

// ── Überfahren und Klicken ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  // Treffer: genau im Feld; per Finger sonst das nächste Feld im Umkreis (kleine Kalendertage, schmale Marken)
  const hit = (x, y, kind) => {
    const L = FIN.hits.filter(h => !kind || h.kind === kind), ex = L.find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    if (ex || kind === 'pay' || !(typeof inputIsTouch !== 'undefined' && inputIsTouch)) return ex;   // Zahlungen (Antippen löscht) nur bei genauem Treffer
    let best, bd = 14; L.forEach(h => { const dx = Math.max(h.x - x, 0, x - h.x - h.w), dy = Math.max(h.y - y, 0, y - h.y - h.h), d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = h; } }); return best;
  };
  const setHover = i => { if (FIN.hover !== i) { FIN.hover = i; finRedraw(); } };
  const setCal = c => { const o = FIN.hoverCal; if ((o && c && o.d === c.d && o.m === c.m) || (!o && !c)) return; FIN.hoverCal = c; finRedraw(); };
  const move = e => {
    if (!finActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    if (e.type === 'mouseleave') { setHover(-1); setCal(null); return; }
    if (FIN.mode === 'march') { if (e.type === 'mousemove' || e.type === 'touchmove') { const p = pos(e), h = hit(p.x, p.y, 'cal'); setCal(h ? { d: (h.m === 2 && h.d >= 28) ? 30 : h.d, m: h.m } : null); cv.style.cursor = h ? 'pointer' : ''; } return; }
    if (e.type === 'mousemove' || e.type === 'touchmove') { const p = pos(e), h = hit(p.x, p.y, 'pay'); setHover(h ? h.i : -1); cv.style.cursor = h || ((FIN.mode === 'line' || FIN.mode === 'mline') && hit(p.x, p.y, 'tick')) ? 'pointer' : ''; }
  };
  const click = e => {
    if (!finActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (FIN.mode === 'march') { const hc = hit(pos(e).x, pos(e).y, 'cal'); if (hc) finPickDay(hc.d, hc.m); return; }
    if (FIN.mode === 'mline') {                                           // Zahlung antippen: entfernen; Monat antippen: Zahlung am 15. hinzufügen
      const q = pos(e), M = FIN.P.mline, hq = hit(q.x, q.y, 'pay');
      if (hq) { if (M.pay[hq.i]) { M.pay.splice(hq.i, 1); FIN.hover = -1; FIN.anim = null; finRefreshExtra(); finRedraw(); finCommit(); } return; }
      const hm = hit(q.x, q.y, 'tick'); if (hm) finAddPayM(1, hm.t);
      return;
    }
    if (FIN.mode !== 'line') return;
    const p = pos(e), P = FIN.P.line, hp = hit(p.x, p.y, 'pay');
    if (hp && P.pay[hp.i]) { P.pay.splice(hp.i, 1); FIN.hover = -1; finFix('line'); finRefreshExtra(); finRedraw(); finCommit(); return; }
    const ht = hit(p.x, p.y, 'tick');
    if (ht && P.pay.length < 12 && !P.pay.some(z => z.t === ht.t)) { P.pay.push({ t: ht.t, a: P.pay.length ? Math.abs(P.pay[P.pay.length - 1].a) : 1000 }); finRefreshExtra(); finRedraw(); finCommit(); }
  };
  const stop = e => { if (finActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousemove', 'mouseleave', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  cv.addEventListener('click', click, { capture: true, passive: false });
  // Antippen mit dem Finger: Weil touchstart abgefangen wird, erzeugt der Browser kein «click» – Kalendertage und
  // Zahlungen liessen sich auf Handy und Tablet gar nicht wählen. Ein kurzer Tipp ohne Bewegung zählt darum als Klick.
  let tap = null;
  // Im Kalender (Marchzins) sind die Tage auf dem Handy klein: Finger aufsetzen, zum Tag schieben (er wird markiert),
  // loslassen wählt ihn.
  const tdown = e => { if (!finActive()) return; tap = e.touches && e.touches.length === 1 ? pos(e) : null; if (tap && FIN.mode === 'march') move(e); stop(e); };
  const tup = e => { if (!finActive()) return; const t = tap; tap = null; if (t && e.type === 'touchend') { const p = pos(e); if (FIN.mode === 'march' || Math.hypot(p.x - t.x, p.y - t.y) < 12) { click(e); setCal(null); setHover(-1); return; } } setCal(null); stop(e); };
  cv.addEventListener('touchstart', tdown, { capture: true, passive: false });
  ['touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, tup, { capture: true, passive: false }));
  ['mousedown', 'mouseup', 'dblclick', 'contextmenu', 'wheel'].forEach(ev => cv.addEventListener(ev, stop, { capture: true, passive: false }));
})();

// ── LaTeX (TikZ) ──
function finLatex() {
  const W = 720, H = 460, m = FIN.mode, C = finCtx(W, H, { fs: 11 });
  return stSceneTex(finBuildScene(W, H, C), W, H, (FIN_MODES.find(q => q[0] === m) || [0, ''])[1], 11);
}
function finMakeLatex() { const ta = FIN.ui && FIN.ui.ta; if (!ta) return ''; try { ta.value = finLatex(); } catch (e) { ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ta.value; }
function finCopyLatex() { texCopy(FIN.ui, () => finMakeLatex()); }

// Sprachwechsel: Canvas-Texte werden asynchron übersetzt → nach kurzer Zeit neu zeichnen (gilt auch für die Statistik)
document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { if (finActive() || (typeof statActive === 'function' && statActive())) finRedraw(); }, ms)); });

finBuildUI();
