// ═══════════════════════════════════════════════════════════════════
// 108_seq_ui.js — Folgen und Reihen: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 106_seq.js, 106b_seq_docs.js (Sq). Bilder: 107_seq_draw.js. Aufbau wie 99d_inv_ui.js.
// Umgebung «seq» (32_env.js). Die alte Folgen-Liste (13_sequences.js, #seq-old-panel) ist ausgeblendet.
// Zustand SEQ: Ansicht; Folge (explizit fn bzw. rekursiv a1 + rule), Glied k, Anzahl N; arithmetisch A, geometrisch G
// mit Zielwerten; Reihe sum; Grenzwert lim; Induktion ind; Ausschnitt; Anzeige.
// ═══════════════════════════════════════════════════════════════════

const SEQ_VIEWS = [['def', 'Folgen: explizit und rekursiv'], ['ari', 'Arithmetische Folgen'], ['geo', 'Geometrische Folgen'], ['sig', 'Summenzeichen verstehen'], ['sum', 'Arithmetische und geometrische Reihen'], ['lim', 'Grenzwert und unendliche Reihe'], ['ind', 'Vollständige Induktion']];
const SEQ_DESC = {
  sig: ['Lies das Summenzeichen: Die {{untere Grenze|m}} sagt, bei welchem k du beginnst, die {{obere Grenze|n}}, wo du aufhörst. Den {{Summanden|f}} rechnest du für jedes k aus und addierst alle. Ziehe im Bild die Grenzen m und n und die {{Laufvariable k|k}}: Der Balken von k leuchtet, oben steht sein Summand. «▶ k von m bis n laufen lassen» addiert die Summanden der Reihe nach.', 'Das Summenzeichen ist eine Kurzschrift: ∑ von k = m bis n über aₖ bedeutet aₘ + aₘ₊₁ + … + aₙ. Die Laufvariable (meist k, i oder j) durchläuft alle ganzen Zahlen von der unteren bis zur oberen Grenze; es gibt n − m + 1 Summanden. Der Name der Laufvariablen spielt keine Rolle, und man kann den Index verschieben: ∑ von k = 3 bis 8 über (k − 2) = ∑ von j = 1 bis 6 über j.'],
  def: ['Tippe einen Term in n ein (z. B. 3n+1) oder eine rekursive Regel: Die Glieder erscheinen als Punkte (n | aₙ). Ziehe den {{violetten Punkt|K}} auf ein anderes Glied, rechts steht seine Berechnung.', 'Eine Folge ist eine durchnummerierte Liste von Zahlen a₁, a₂, a₃, … Explizit berechnet man jedes Glied direkt aus n, rekursiv aus dem Vorgänger. Die Glieder erscheinen als Punkte (n | aₙ).'],
  ari: ['Ziehe {{a₁|A1}} und {{a₂|A2}}: Die Differenz d bleibt von Glied zu Glied gleich, durch die Punkte geht eine {{Gerade|dl}}. Mit der {{roten Zielgeraden t|T}} suchst du, welches Glied {{aₙ|K}} diesen Wert hat.', 'Bei einer arithmetischen Folge ist die Differenz d benachbarter Glieder (a₁, a₂) konstant: aₙ = a₁ + (n − 1)·d. Die Punkte liegen auf einer Geraden (lineares Wachstum).'],
  geo: ['Ziehe {{a₁|A1}} und {{a₂|A2}}: Der Quotient q bleibt von Glied zu Glied gleich – Wachstum für q > 1, Zerfall für 0 < q < 1 ({{Kurve|dl}}). Mit der {{roten Zielgeraden t|T}} suchst du, ab welchem Glied {{aₙ|K}} sie überschritten wird.', 'Bei einer geometrischen Folge ist der Quotient q benachbarter Glieder (a₁, a₂) konstant: aₙ = a₁·qⁿ⁻¹. Für q > 1 exponentielles Wachstum, für 0 < q < 1 Zerfall.'],
  sum: ['Ziehe den {{violetten Punkt sₙ|N}} im unteren Bild nach links oder rechts, um n zu ändern: Oben kommen {{Glieder aₖ|bars}} dazu oder fallen weg, unten wächst sₙ = a₁ + … + aₙ. Beim Gauss-Trick ergänzt die rückwärts gelesene Folge die Balken zu einem Rechteck («▶ Gauss-Trick als Bewegung» zeigt, wie sie sich umdreht).', 'Die Summe der ersten n Glieder heisst Reihe: sₙ = a₁ + … + aₙ. Arithmetisch: sₙ = n·(a₁ + aₙ)/2 (Trick von Gauss), geometrisch: sₙ = a₁·(qⁿ − 1)/(q − 1).'],
  lim: ['Ziehe den {{grünen Punkt ε|E}}, um den {{ε-Streifen|eps}} um den {{Grenzwert|lim}} schmaler zu machen: Ab einem Index N liegen alle Glieder im Streifen – je kleiner ε, desto weiter rechts liegt N. Mit «▶ Animation: ε → 0» wird der Streifen immer schmaler, und es kommen immer mehr Glieder dazu.', 'Kommen die Glieder für grosse n einer Zahl beliebig nahe, ist das der Grenzwert. Zu jedem ε gibt es ein N, ab dem alle Glieder im ε-Streifen liegen. Eine unendliche geometrische Reihe hat für |q| < 1 den Wert a₁/(1 − q).'],
  ind: ['Wähle eine Aussage und lass mit «Schritt» die Dominosteine fallen: Gilt A(1) und folgt aus A(n) stets A(n + 1), dann gilt die Aussage für alle n. Die letzte Aussage zeigt, warum Beispiele allein nichts beweisen.', 'Vollständige Induktion: Gilt die Aussage für n = 1 (Anfang) und folgt sie für n + 1, wenn sie für n gilt (Schritt), dann gilt sie für alle n – wie bei fallenden Dominosteinen.']
};
const SEQ_EX = {
  sig: [['∑ k für k = 1 … 100 (Gauss)', { fn: 'k', m: 1, n: 100 }], ['∑ (2k − 1) für k = 1 … 10: ungerade Zahlen', { fn: '2*k-1', m: 1, n: 10 }], ['∑ (2k + 1) für k = 1 … 10', { fn: '2*k+1', m: 1, n: 10 }],
    ['∑ k² für k = 1 … 20', { fn: 'k^2', m: 1, n: 20 }], ['∑ 2ᵏ für k = 0 … 10', { fn: '2^k', m: 0, n: 10 }], ['∑ (1/2)ᵏ für k = 1 … 30', { fn: '(1/2)^k', m: 1, n: 30 }],
    ['∑ 1/k für k = 1 … 50 (harmonische Reihe)', { fn: '1/k', m: 1, n: 50 }], ['∑ (−1)ᵏ · k für k = 1 … 12', { fn: '(-1)^k*k', m: 1, n: 12 }],
    ['∑ (k − 2) für k = 3 … 8 (Indexverschiebung)', { fn: 'k-2', m: 3, n: 8 }], ['∑ 5 für k = 1 … 6 (konstanter Summand)', { fn: '5', m: 1, n: 6 }], ['∑ 3(k + 1) für k = 0 … 9', { fn: '3*(k+1)', m: 0, n: 9 }]],
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
    sig: { fn: '2*k+1', m: 1, n: 10, k: 3 }, sum: { type: 'ari', a1: 1, d: 1, q: 2, n: 10 }, lim: { type: 'seq', fn: '(3*n+1)/(n+2)', a1: 8, q: 0.5, eps: 0.1 }, NL: 40, ind: { id: 'odd', n: 3 },
    win: Object.assign({}, SEQ_WIN0), show: Object.assign({}, SEQ_SHOW0) };
}
const SEQ = Object.assign(seqDefaults(), { ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0 });
function seqActive() { return typeof ENV !== 'undefined' && ENV.cur === 'seq'; }
const seqR6 = x => Math.round(x * 1e6) / 1e6 + 0;
const seqClean = raw => String(raw || '').replace(/a_\{?\(?n\)?\}?/g, 'a');
function seqDefS() { return (SEQ.mode === 'rec' ? Sq.mkRec(SEQ.a1, SEQ.rule) : Sq.mkExp(SEQ.fn)) || Sq.mkExp('3*n+1'); }
// Summand in k: intern als Folge in n (Sq.mkExp), LaTeX wieder mit k
const seqK2N = raw => String(raw || '').replace(/(?<![A-Za-z_])k(?![A-Za-z_(])/g, 'n');
function seqSigMk(raw) { if (/(?<![A-Za-z_])n(?![A-Za-z_(])/.test(String(raw || ''))) return null; const S = Sq.mkExp(seqK2N(raw)); return S ? { S, tex: Sq.texBack(S.M.tex, 'k') } : null; }
function seqSigG() { const o = SEQ.sig, M = seqSigMk(o.fn) || seqSigMk('2*k+1'); return { S: M.S, tex: M.tex, m: o.m, n: o.n, k: Math.max(o.m, Math.min(o.n, o.k)) }; }
function seqLimS() { return Sq.mkExp(SEQ.lim.fn) || Sq.mkExp('1/n'); }
const seqFieldUsed = () => SEQ.view === 'def' || SEQ.view === 'sig' || (SEQ.view === 'lim' && SEQ.lim.type === 'seq');
function seqFieldRawState() { return SEQ.view === 'sig' ? SEQ.sig.fn : SEQ.view === 'lim' ? SEQ.lim.fn : SEQ.mode === 'rec' ? SEQ.rule : SEQ.fn; }

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
  if (SEQ.view === 'sig') {
    if (!seqSigMk(raw)) { if (err) err.textContent = 'Bitte einen Term in k eingeben, z. B. 2k+1, k², 1/k, 2^k.'; return; }
    if (err) err.textContent = ''; if (raw === SEQ.sig.fn) return; SEQ.sig.fn = raw;
    SEQ.win = Object.assign({}, SEQ_WIN0); SEQ.cardKey = ''; seqRefreshUI(); difRedraw(); seqCardSoon(); difCommit(); return;
  }
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
// Sachverhalte der Anwendungsbeispiele: gelten, solange die Kernzahlen des Beispiels eingestellt sind
const seqN = v => '$' + Sq.fmt(v) + '$';
const SEQ_SIT = [
  { v: 'def', is: () => SEQ.mode === 'exp' && SEQ.fn.replace(/\s/g, '') === '3*n+1',
    sit: 'Mit Streichhölzern wird eine Reihe von Quadraten gelegt; benachbarte Quadrate teilen sich eine Seite. Für 1 Quadrat braucht man 4 Hölzer, für jedes weitere 3 Hölzer mehr. $a_n$ = Anzahl Hölzer für $n$ Quadrate.',
    ask: () => 'Wie viele Hölzer braucht man für ' + seqN(Math.min(SEQ.k, SEQ.N)) + ' Quadrate?' },
  { v: 'def', is: () => SEQ.mode === 'rec' && SEQ.a1 === 0.1 && SEQ.rule.replace(/\s/g, '') === '2*a',
    sit: 'Ein Blatt Papier ist 0.1 mm dick. Bei jedem Falten verdoppelt sich die Dicke. $a_n$ = Dicke in mm nach $n-1$ Faltungen.',
    ask: () => 'Wie dick ist das Papier nach ' + seqN(Math.min(SEQ.k, SEQ.N) - 1) + ' Faltungen?' },
  { v: 'ari', is: () => SEQ.A.a1 === 18 && SEQ.A.d === 2,
    sit: 'Ein Kinosaal hat in der ersten Reihe 18 Plätze, jede weitere Reihe hat 2 Plätze mehr. $a_n$ = Anzahl Plätze in Reihe $n$.',
    ask: () => 'Wie viele Plätze hat Reihe ' + seqN(SEQ.kA) + '?' + (isFinite(SEQ.tA) && SEQ.tA !== null ? ' In welcher Reihe gibt es ' + seqN(SEQ.tA) + ' Plätze?' : '') },
  { v: 'ari', is: () => SEQ.A.a1 === 4 && SEQ.A.d === 3,
    sit: 'Mit Streichhölzern wird eine Reihe von Quadraten gelegt; benachbarte Quadrate teilen sich eine Seite. Für 1 Quadrat braucht man 4 Hölzer, für jedes weitere 3 Hölzer mehr. $a_n$ = Anzahl Hölzer für $n$ Quadrate.',
    ask: () => 'Wie viele Hölzer braucht man für ' + seqN(SEQ.kA) + ' Quadrate?' + (isFinite(SEQ.tA) && SEQ.tA !== null ? ' Für wie viele Quadrate reichen ' + seqN(SEQ.tA) + ' Hölzer genau?' : '') },
  { v: 'geo', is: () => SEQ.G.a1 === 0.1 && SEQ.G.q === 2,
    sit: 'Ein Blatt Papier ist 0.1 mm dick. Bei jedem Falten verdoppelt sich die Dicke. $a_n$ = Dicke in mm nach $n-1$ Faltungen.',
    ask: () => 'Wie dick ist das Papier nach ' + seqN(SEQ.kG - 1) + ' Faltungen?' + (isFinite(SEQ.tG) && SEQ.tG !== null ? ' Ab welchem Glied ist es mindestens ' + seqN(SEQ.tG) + ' mm dick?' : '') },
  { v: 'geo', is: () => SEQ.G.a1 === 100 && SEQ.G.q === 1.5,
    sit: 'Eine Bakterienkultur besteht zu Beginn aus 100 Bakterien und wächst pro Stunde um 50 %. $a_n$ = Anzahl Bakterien zu Beginn der $n$-ten Stunde.',
    ask: () => 'Wie viele Bakterien sind es zu Beginn der ' + seqN(SEQ.kG) + '. Stunde?' + (isFinite(SEQ.tG) && SEQ.tG !== null ? ' Ab welcher Stunde sind es mindestens ' + seqN(SEQ.tG) + '?' : '') },
  { v: 'geo', is: () => SEQ.G.a1 === 80 && SEQ.G.q === 0.5,
    sit: 'Von einem radioaktiven Stoff sind anfangs 80 mg vorhanden. Nach jeder Halbwertszeit ist nur noch die Hälfte übrig. $a_n$ = Menge in mg nach $n-1$ Halbwertszeiten.',
    ask: () => 'Wie viel ist nach ' + seqN(SEQ.kG - 1) + ' Halbwertszeiten noch vorhanden?' + (isFinite(SEQ.tG) && SEQ.tG !== null ? ' Ab welchem Glied ist es höchstens noch ' + seqN(SEQ.tG) + ' mg?' : '') },
  { v: 'sum', is: () => SEQ.sum.type === 'ari' && SEQ.sum.a1 === 1 && SEQ.sum.d === 1,
    sit: 'Der neunjährige Carl Friedrich Gauss sollte in der Schule alle natürlichen Zahlen von 1 bis 100 zusammenzählen.',
    ask: () => 'Wie gross ist die Summe $1+2+3+\\ldots+' + Sq.fmt(SEQ.sum.n) + '$?' },
  { v: 'sum', is: () => SEQ.sum.type === 'ari' && SEQ.sum.a1 === 18 && SEQ.sum.d === 2,
    sit: 'Ein Kinosaal hat in der ersten Reihe 18 Plätze, jede weitere Reihe hat 2 Plätze mehr.',
    ask: () => 'Wie viele Plätze hat der Saal mit ' + seqN(SEQ.sum.n) + ' Reihen insgesamt?' },
  { v: 'sum', is: () => SEQ.sum.type === 'geo' && SEQ.sum.a1 === 1 && SEQ.sum.q === 2,
    sit: 'Legende vom Schachbrett: Auf das erste Feld legt man 1 Reiskorn, auf jedes weitere Feld doppelt so viele wie auf das vorherige. Ein Schachbrett hat 64 Felder.',
    ask: () => 'Wie viele Reiskörner liegen auf den ersten ' + seqN(SEQ.sum.n) + ' Feldern zusammen?' },
  { v: 'sum', is: () => SEQ.sum.type === 'geo' && SEQ.sum.a1 === 0.5 && SEQ.sum.q === 0.5,
    sit: 'Jemand geht die Hälfte eines 1 km langen Weges, dann die Hälfte des restlichen Weges, dann wieder die Hälfte des Rests und so weiter.',
    ask: () => 'Wie viele km hat er nach ' + seqN(SEQ.sum.n) + ' Teilstrecken zurückgelegt?' },
  { v: 'lim', is: () => SEQ.lim.type === 'ser' && SEQ.lim.a1 === 0.5 && SEQ.lim.q === 0.5,
    sit: 'Jemand geht die Hälfte eines 1 km langen Weges, dann die Hälfte des restlichen Weges, dann wieder die Hälfte des Rests und so weiter.',
    ask: () => 'Gegen welchen Wert strebt der zurückgelegte Weg? Kommt er je am Ziel an?' }
];
function seqSituation() { const S = SEQ_SIT.find(q => q.v === SEQ.view && (() => { try { return q.is(); } catch (e) { return false; } })()); return S ? [S.sit, S.ask()] : ['', '']; }
// Rechenweg zum Summenzeichen: Bedeutung, ausgeschrieben (erste und letzte 5 Summanden), Anzahl, Wert, Formel falls arithmetisch/geometrisch
function seqSigDoc() {
  const G = seqSigG(), T = seqSigTerms(G), d = Dif.DOC(), cnt = T.all.length, f = T.f;
  const sig = '\\sum_{k=' + G.m + '}^{' + G.n + '}' + (seqTopPM(G.tex) ? '\\left(' + G.tex + '\\right)' : G.tex);
  const par = t => (seqTopPM(t) ? '\\left(' + t + '\\right)' : t);
  d.h('Summenzeichen');
  d.p('$' + sig + '$ heisst: Setze für die Laufvariable $k$ nacheinander alle ganzen Zahlen von der **unteren Grenze** $k=' + G.m + '$ bis zur **oberen Grenze** $' + G.n + '$ in den **Summanden** $a_k=' + G.tex + '$ ein und addiere die Ergebnisse.');
  d.p('**Ausgeschrieben** (' + (cnt <= 10 ? 'alle Summanden' : 'die ersten 5 und die letzten 5 Summanden') + '):');
  // in Zeilen zu je 4 Summanden, damit nichts über den Rand der Karte hinausläuft
  const rows = (list, first, last) => { const wide = list.some(t => t.replace(/\\[a-z]+|[{}]/g, '').length > 9); let i = 0; while (i < list.length) { const n = (i ? 4 : 3) - (wide ? 1 : 0), part = list.slice(i, i + n).join('+'), more = i + n < list.length; d.e((i ? '\\qquad' : first) + part + (more ? '+' : last)); i += n; } };
  rows(T.show.map(k => (k === null ? '\\ldots' : par(seqSigSub(G, k)))), sig + '=', '');
  rows(T.show.map(k => (k === null ? '\\ldots' : (f(k) < 0 ? '\\left(' + seqSigQ(f(k)) + '\\right)' : seqSigQ(f(k))))), '=', '=' + seqSigQ(T.total));
  d.p('**Anzahl Summanden:** $n-m+1=' + G.n + '-' + (G.m < 0 ? '(' + G.m + ')' : G.m) + '+1=' + cnt + '$.');
  if (cnt >= 3) {
    const v = T.all.map(f), dd = v[1] - v[0], qq = v[0] !== 0 ? v[1] / v[0] : NaN;
    const ari = v.every((x, i) => !i || Math.abs(x - v[i - 1] - dd) < 1e-9 * (1 + Math.abs(x))), geo = !ari && isFinite(qq) && v.every((x, i) => !i || Math.abs(x - v[i - 1] * qq) < 1e-9 * (1 + Math.abs(x)));
    if (ari && Math.abs(dd) > 1e-12) d.note('Die Summanden wachsen jedes Mal um $d=' + seqSigQ(dd) + '$ (arithmetische Reihe). Schneller mit Gauss: $\\text{Anzahl}\\cdot\\frac{\\text{erster}+\\text{letzter}}{2}=' + cnt + '\\cdot\\frac{' + seqSigQ(v[0]) + '+' + seqSigQ(v[cnt - 1]) + '}{2}=' + seqSigQ(T.total) + '$.');
    else if (ari) d.note('Alle Summanden sind gleich: $' + cnt + '\\cdot ' + seqSigQ(v[0]) + '=' + seqSigQ(T.total) + '$.');
    else if (geo && Math.abs(qq - 1) > 1e-12) d.note('Jeder Summand ist das $q=' + seqSigQ(qq) + '$-fache des vorherigen (geometrische Reihe). Formel: $a_{' + G.m + '}\\cdot\\frac{q^{' + cnt + '}-1}{q-1}=' + seqSigQ(T.total) + '$.');
  }
  if (G.m !== 1) { const sh = G.m - 1; d.note('**Indexverschiebung:** Mit $j=k' + (sh < 0 ? '+' + (-sh) : '-' + sh) + '$ läuft $j$ von $1$ bis $' + cnt + '$; der Wert der Summe bleibt gleich.'); }
  d.res('$' + sig + '=' + seqSigQ(T.total) + '$');
  return d;
}
function seqCardDoc() {
  const r = seqCardDoc0(); if (r && r.d) { const S = seqSituation(); Dif.withSit(r.d, S[0], S[1]); } return r;
}
function seqCardDoc0() {
  try {
    const v = SEQ.view;
    if (v === 'def') { const S = seqDefS(); return { t: 'Rechenweg: Folge', d: Sq.doc(Sq.st.def(S, Math.min(SEQ.k, SEQ.N))) }; }
    if (v === 'ari') return { t: 'Rechenweg: Arithmetische Folge', d: Sq.doc(Sq.st.ari(Sq.ari(SEQ.A.a1, SEQ.A.d), SEQ.kA, SEQ.tA === null ? NaN : SEQ.tA)) };
    if (v === 'geo') return { t: 'Rechenweg: Geometrische Folge', d: Sq.doc(Sq.st.geo(Sq.geo(SEQ.G.a1, SEQ.G.q), SEQ.kG, SEQ.tG === null ? NaN : SEQ.tG)) };
    if (v === 'sig') return { t: 'Rechenweg: Summenzeichen', d: seqSigDoc() };
    if (v === 'sum') return { t: 'Rechenweg: Reihe', d: Sq.doc(Sq.st.sum({ type: SEQ.sum.type, A: seqSumF(), G: seqSumF(), n: SEQ.sum.n })) };
    if (v === 'lim') return { t: 'Rechenweg: Grenzwert', d: Sq.doc(Sq.st.lim({ type: SEQ.lim.type, S: seqLimS(), G: Sq.geo(SEQ.lim.a1, SEQ.lim.q), eps: SEQ.lim.eps, n: SEQ.NL })) };
    return { t: 'Rechenweg: Vollständige Induktion', d: Sq.doc(Sq.st.ind(seqIndI(), Math.max(1, SEQ.ind.n))) };
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
}
function seqCardKey() { return SEQ.view + '|' + JSON.stringify([SEQ.mode, SEQ.fn, SEQ.a1, SEQ.rule, SEQ.k, SEQ.N, SEQ.A, SEQ.kA, SEQ.tA, SEQ.G, SEQ.kG, SEQ.tG, SEQ.sum, SEQ.lim, SEQ.NL, SEQ.ind, SEQ.sig]); }
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
function seqCapture() { return difCopy({ sig: SEQ.sig, view: SEQ.view, mode: SEQ.mode, fn: SEQ.fn, a1: SEQ.a1, rule: SEQ.rule, k: SEQ.k, N: SEQ.N, A: SEQ.A, kA: SEQ.kA, tA: SEQ.tA, G: SEQ.G, kG: SEQ.kG, tG: SEQ.tG, NA: SEQ.NA, NG: SEQ.NG, sum: SEQ.sum, lim: SEQ.lim, NL: SEQ.NL, ind: SEQ.ind, win: SEQ.win, show: SEQ.show }); }
function seqApply(s) {
  SEQ.anim = null;                                                       // laufende Animation beenden (Rückgängig, Laden, Zurücksetzen)
  if (typeof SEQ_LA !== "undefined" && SEQ_LA.on) seqLimAnimStop(true);
  const d = seqDefaults(), num = (v, def, lo, hi) => { v = Number(v); return isFinite(v) && v >= (lo === undefined ? -1e9 : lo) && v <= (hi === undefined ? 1e9 : hi) ? v : def; };
  const str = (v, def) => (typeof v === 'string' && v.length < 200 ? v : def);
  if (s && typeof s === 'object') {
    if (SEQ_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    d.mode = s.mode === 'rec' ? 'rec' : 'exp';
    d.fn = Sq.mkExp(str(s.fn, '')) ? s.fn : d.fn; d.a1 = num(s.a1, d.a1); d.rule = Sq.mkRec(d.a1, str(s.rule, '')) ? s.rule : d.rule;
    d.k = Math.round(num(s.k, d.k, 1, 200)); d.N = Math.round(num(s.N, d.N, 2, 200)); d.kA = Math.round(num(s.kA, d.kA, 1, 200)); d.kG = Math.round(num(s.kG, d.kG, 1, 200));
    d.NA = Math.round(num(s.NA, d.NA, 2, 200)); d.NG = Math.round(num(s.NG, d.NG, 2, 200)); d.NL = Math.round(num(s.NL, d.NL, 5, 1000000));
    if (s.A && typeof s.A === 'object') d.A = { a1: num(s.A.a1, d.A.a1), d: num(s.A.d, d.A.d) };
    if (s.G && typeof s.G === 'object') { d.G = { a1: num(s.G.a1, d.G.a1), q: num(s.G.q, d.G.q) }; if (Math.abs(d.G.a1) < 1e-12) d.G.a1 = 1; if (Math.abs(d.G.q) < 1e-12) d.G.q = 2; }
    d.tA = s.tA === null ? null : num(s.tA, d.tA); d.tG = s.tG === null ? null : num(s.tG, d.tG);
    if (s.sum && typeof s.sum === 'object') d.sum = { type: s.sum.type === 'geo' ? 'geo' : 'ari', a1: num(s.sum.a1, 1), d: num(s.sum.d, 1), q: num(s.sum.q, 2), n: Math.round(num(s.sum.n, 10, 1, 1000)) };
    if (s.lim && typeof s.lim === 'object') d.lim = { type: s.lim.type === 'ser' ? 'ser' : 'seq', fn: Sq.mkExp(str(s.lim.fn, '')) ? s.lim.fn : d.lim.fn, a1: num(s.lim.a1, 8), q: num(s.lim.q, 0.5), eps: num(s.lim.eps, 0.1, 1e-6, 1e6) };
    if (s.sig && typeof s.sig === 'object') { const fn = seqSigMk(str(s.sig.fn, '')) ? s.sig.fn : d.sig.fn, mm = Math.round(num(s.sig.m, 1, -50, 1000)), nn = Math.round(num(s.sig.n, 10, mm, mm + 1000)); d.sig = { fn, m: mm, n: nn, k: Math.round(num(s.sig.k, mm, mm, nn)) }; }
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
    sig: v === 'sig' ? seqSigG() : null, sum: { type: SEQ.sum.type, A: seqSumF(), G: seqSumF(), n: SEQ.sum.n }, lim: { type: SEQ.lim.type, S: seqLimS(), G: Sq.geo(SEQ.lim.a1, SEQ.lim.q), eps: SEQ.lim.eps }, ind: { I: seqIndI(), n: SEQ.ind.n },
    win: SEQ.win, fs: exp ? exp.fs : stSceneFs(W, H, 46), exp: !!exp, smooth: !exp, show: SEQ.show,
    limA: v === 'lim' && SEQ_LA.on && SEQ_LA.cur ? SEQ_LA.cur : null, gaussAng: v === 'sum' && SEQ.anim && SEQ.anim.gauss && !exp ? SEQ.anim.ang : null };
}
// ── Animationen: Summenzeichen (k läuft von der unteren zur oberen Grenze) und Gauss-Trick (Treppe dreht sich) ──
function seqAnimStop() { if (SEQ.anim) { SEQ.anim = null; seqRefreshUI(); difRedraw(); } }
function seqAnimToggle() {
  if (SEQ.anim) { SEQ.anim = null; seqRefreshUI(); difRedraw(); difCommit(); return; }
  if (SEQ.view === 'sig') { const o = SEQ.sig, cnt = o.n - o.m + 1; o.k = o.m; SEQ.anim = { last: 0, sig: true, acc: 0, step: Math.max(0.05, Math.min(0.75, 9 / cnt)), wait: 0.6 }; }
  else if (SEQ.view === 'sum' && SEQ.sum.type === 'ari') SEQ.anim = { last: 0, gauss: true, ang: 0, u: 0, wait: 0.8 };
  else return;
  SEQ.cardKey = ''; seqRefreshUI(); difRedraw(); requestAnimationFrame(seqAnimFrame);
}
function seqAnimFrame(ts) {
  const a = SEQ.anim; if (!a) return;
  if (!seqActive() || (a.sig && SEQ.view !== 'sig') || (a.gauss && SEQ.view !== 'sum')) { SEQ.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (a.wait > 0) { a.wait -= dt; requestAnimationFrame(seqAnimFrame); return; }
  if (a.sig) {
    const o = SEQ.sig; a.acc += dt; let ch = false;
    while (a.acc >= a.step && o.k < o.n) { a.acc -= a.step; o.k++; ch = true; }
    if (ch) { seqSyncFields(); difRedraw(); }
    if (o.k >= o.n) { SEQ.anim = null; SEQ.cardKey = ''; seqRefreshUI(); difRedraw(); seqCardSoon(); difCommit(); return; }
  } else {
    a.u = Math.min(1, a.u + dt / 5); a.ang = a.u;
    if (a.u >= 1) { SEQ.anim = null; SEQ.show.gauss = true; seqRefreshUI(); difRedraw(); difCommit(); return; }
    difRedraw();
  }
  requestAnimationFrame(seqAnimFrame);
}
// ── Animation «ε → 0»: Streifen wird schmaler (eine Zehnerpotenz in gut 2 s), die Bildhöhe zoomt mit (Wurzel),
//    die Breite wächst bis über N(ε) hinaus: Es kommen immer mehr Glieder dazu, die wieder im Streifen liegen ──
const SEQ_LA = { on: false, cur: null, raf: 0 };
function seqLimAnimStart() {
  if (SEQ.view !== 'lim') return;
  // Immer von einem «normalen» Anfang aus: nach einer früheren Animation (winziges ε, eine Million Glieder,
  // fester Ausschnitt) würde sie sonst sofort wieder aufhören
  const d0 = seqDefaults();
  if (!(SEQ.lim.eps >= 1e-3)) SEQ.lim.eps = SEQ.lim.type === 'ser' ? 0.5 : d0.lim.eps;
  if (!(SEQ.NL <= 400)) SEQ.NL = d0.NL;
  SEQ.win = Object.assign({}, SEQ_WIN0);
  const C = seqCtx(800, 600), o = C.lim, isSer = o.type === 'ser';
  const L = isSer ? Sq.sumInf(o.G) : (Sq.limit(o.S).conv ? Sq.limit(o.S).L : NaN);
  if (!isFinite(L)) { const er = $dif('seq-err'); if (er) er.textContent = 'Die Folge ist divergent: Es gibt keinen Streifen, in dem am Ende alle Glieder liegen.'; return; }
  const at = n => (isSer ? seqGeoPart(o.G, n) : o.S.f(n));
  let h0 = o.eps * 3; for (let n = 1; n <= Math.min(SEQ.NL, 400); n++) { const v = Math.abs(at(n) - L); if (isFinite(v) && v < 1e6) h0 = Math.max(h0, v * 1.1); }
  Object.assign(SEQ_LA, { on: true, t0: performance.now(), eps0: o.eps, h0, L, x10: Math.max(10, SEQ.NL), o });
  seqRefreshUI(); seqLimAnimFrame();
}
function seqLimAnimFrame() {
  if (!SEQ_LA.on) return;
  if (!seqActive() || SEQ.view !== 'lim') { seqLimAnimStop(true); return; }
  // Ablauf: zuerst nah an den Streifen heranzoomen (1 s); dann je Zehnerpotenz: 2 s lang wird der Streifen bei festem
  // Ausschnitt schmaler (ε : 10), danach zoomt das Bild 1 s lang nach (Höhe : 10) – der Streifen ist wieder breit,
  // und rechts sind neue Glieder dazugekommen, die wieder darin liegen.
  const A = SEQ_LA, t = (performance.now() - A.t0) / 1000, ease = u => u * u * (3 - 2 * u), H0 = 4 * A.eps0;
  let eps, h;
  if (t < 1) { eps = A.eps0; h = A.h0 > H0 ? A.h0 * Math.pow(H0 / A.h0, ease(t)) : H0; }
  else { const u = t - 1, k = Math.floor(u / 3), r = u - 3 * k;
    if (r < 2) { eps = A.eps0 * Math.pow(10, -(k + ease(r / 2))); h = H0 * Math.pow(10, -k); }
    else { eps = A.eps0 * Math.pow(10, -(k + 1)); h = H0 * Math.pow(10, -(k + ease(r - 2))); } }
  const Ne = seqLimN(A.o, A.L, eps) || 1, x1 = Math.min(1e6, Math.max(A.x10, Ne * 1.6)), N = Math.ceil(x1);
  SEQ.lim.eps = eps;
  A.cur = { N, win: { x0: -x1 * 0.02, x1, y0: A.L - h, y1: A.L + h } };
  difRedraw();
  if (eps < Math.max(1e-6, A.eps0 * 1e-5) || Ne * 1.6 >= 1e6) { seqLimAnimStop(); return; }
  A.raf = requestAnimationFrame(seqLimAnimFrame);
}
function seqLimAnimStop(silent) {
  if (!SEQ_LA.on) return;
  cancelAnimationFrame(SEQ_LA.raf);
  const c = SEQ_LA.cur; SEQ_LA.on = false; SEQ_LA.cur = null;
  // Endbild behalten: ε (zwei gültige Ziffern), Anzahl und Ausschnitt übernehmen
  const e = SEQ.lim.eps, k = Math.pow(10, Math.floor(Math.log10(e)) - 1); SEQ.lim.eps = Math.round(e / k) * k;
  if (c) { SEQ.NL = Math.max(5, Math.min(1000000, c.N)); SEQ.win = Object.assign({}, c.win); }
  SEQ.cardKey = '';
  if (!silent) { seqRefreshUI(); difRedraw(); seqCardSoon(); difCommit(); }
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
function seqCopyLatex() { texCopy(SEQ.ui, () => seqMakeLatex('pic')); }

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
  ui.sel.addEventListener('change', () => { SEQ.view = ui.sel.value; SEQ.anim = null; SEQ.cardKey = ''; SEQ.win = Object.assign({}, SEQ_WIN0); const er = $dif('seq-err'); if (er) er.textContent = ''; seqSyncFields(); seqRefreshUI(); difRedraw(); seqCardSoon(); difCommit(); });
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
  const dd = SEQ_DESC[v]; ui.desc.replaceChildren(difEl('div', null, dd[1])); if (typeof envHint === 'function') envHint('seq', dd[0], () => SEQ.S);   // Hinweis als Überschrift über dem Bild
  // Eingabefeld
  const showF = seqFieldUsed();
  ['seq-f-row', 'seq-field-head', 'seq-err'].forEach(id => { const e = $dif(id); if (e) e.style.display = showF ? '' : 'none'; });
  const head = $dif('seq-field-head'); if (head) head.textContent = v === 'sig' ? 'Summand (Term in k)' : v === 'def' && SEQ.mode === 'rec' ? 'Regel (a steht für aₙ)' : 'Folge';
  const row = $dif('seq-f-row'); if (row && row.firstElementChild) { row.firstElementChild.textContent = v === 'sig' ? 'aₖ =' : v === 'def' && SEQ.mode === 'rec' ? 'aₙ₊₁ =' : 'aₙ ='; row.firstElementChild.setAttribute('translate', 'no'); }
  { const fi = $dif('seq-fn-input'); if (fi) fi.setAttribute('placeholder', v === 'sig' ? '2k+1' : '3n+1'); }
  seqSyncFields();
  // Beispiele
  const exs = v === 'ind' ? Sq.IND.map(i => [i.name, { id: i.id }]) : SEQ_EX[v];
  ui.ex.replaceChildren(Object.assign(difEl('option', null, v === 'ind' ? 'Aussage wählen …' : 'Beispiel wählen …'), { value: '' }));
  exs.forEach((e, i) => { const o = difEl('option', null, e[0]); o.value = String(i); ui.ex.appendChild(o); });
  ui.ex.onchange = () => {
    const i = ui.ex.value; ui.ex.value = ''; if (i === '') return; const e = exs[+i][1];
    if (v === 'sig') SEQ.sig = { fn: e.fn, m: e.m, n: e.n, k: Math.min(e.n, e.m + 2) };
    else if (v === 'def') { SEQ.mode = e.mode; if (e.mode === 'exp') SEQ.fn = e.fn; else { SEQ.a1 = e.a1; SEQ.rule = e.rule; } }
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
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = get() === null ? '' : (o.fmt || difFmtIn)(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no'); lb.setAttribute('translate', 'no'); lb.style.minWidth = '46px';
    const ok = x => (o.ok ? o.ok(x) : true), fix = x => (o.int ? Math.round(x) : seqR6(x));
    const apply = () => { if (o.empty && inp.value.trim() === '') { set(null); touch(); difCommit(); seqRefreshUI(); return; } const x = difParseNum(inp.value); if (isFinite(x) && ok(fix(x))) { set(fix(x)); touch(); difCommit(); } inp.value = get() === null ? '' : (o.fmt || difFmtIn)(get()); };
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
    if (o.type === 'ari') { const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(SEQ.anim ? '⏸ Pause' : '▶ Gauss-Trick als Bewegung', seqAnimToggle)); P.appendChild(ab); }
  } else if (v === 'sig') {
    const o = SEQ.sig;
    group('Grenzen und Laufvariable');
    numRow('untere Grenze m', () => o.m, x => { o.m = x; if (o.n < x) o.n = x; o.k = Math.max(o.m, Math.min(o.n, o.k)); }, { int: true, ok: x => x >= -50 && x <= 1000 });
    numRow('obere Grenze n', () => o.n, x => { o.n = x; o.k = Math.max(o.m, Math.min(o.n, o.k)); }, { int: true, ok: x => x >= o.m && x <= o.m + 1000 });
    numRow('Laufvariable k', () => o.k, x => { o.k = x; }, { int: true, ok: x => x >= o.m && x <= o.n });
    { const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;'; ab.append(difBtn(SEQ.anim ? '⏸ Pause' : '▶ k von m bis n laufen lassen', seqAnimToggle)); P.appendChild(ab); }
  } else if (v === 'lim') {
    const o = SEQ.lim;
    select('Art', [['seq', 'Grenzwert einer Folge'], ['ser', 'unendliche geometrische Reihe']], () => o.type, x => { o.type = x; o.eps = x === 'ser' ? 0.5 : 0.1; });
    if (o.type === 'ser') { numRow('a₁', () => o.a1, x => { o.a1 = x; }, { step: 1 }); numRow('q', () => o.q, x => { o.q = x; }, { step: 0.1, ok: x => Math.abs(x) > 1e-9 && Math.abs(x) < 5 }); }
    group('Streifen und Anzahl');
    numRow('ε', () => o.eps, x => { o.eps = x; }, { step: 2, mul: true, ok: x => x >= 1e-6 && x < 1e6, fmt: e => (e > 0 && e < 0.001 ? String(+e.toPrecision(2)) : difFmtIn(e)) });
    numRow('Anzahl', () => SEQ.NL, x => { SEQ.NL = x; }, { int: true, step: 10, ok: intIn(5, 1000000) });
    const ab = difBtn(SEQ_LA.on ? '⏸ Animation anhalten' : '▶ Animation: ε → 0', () => { if (SEQ_LA.on) seqLimAnimStop(); else seqLimAnimStart(); }, 'Der Streifen wird immer schmaler, und es kommen immer mehr Glieder dazu');
    ab.style.cssText = 'width:100%;margin-top:6px;'; P.appendChild(ab);
    const ah = difEl('div', 'act-hint', 'Der ε-Streifen wird laufend schmaler (die Höhe des Bildes zoomt mit), und es werden so viele Glieder gezeigt, dass man sieht: Ab N liegen wieder alle im Streifen.'); ah.style.margin = '2px 2px 4px'; P.appendChild(ah);
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
  } else if (v === 'sig' && (id === 'm' || id === 'n' || id === 'k')) {
    const o = SEQ.sig, kk = Math.round(x);
    if (id === 'm') { o.m = Math.max(-50, Math.min(o.n, kk)); o.k = Math.max(o.m, o.k); }
    else if (id === 'n') { o.n = Math.max(o.m, Math.min(o.m + 1000, kk)); o.k = Math.min(o.n, o.k); }
    else o.k = Math.max(o.m, Math.min(o.n, kk));
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
  const near = p => { const S = SEQ.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + hitR(4) && d < bd) { bd = d; best = q; } }); return best; };
  const down = e => {
    if (!seqActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = SEQ.S; if (!S) return; if (SEQ.anim) seqAnimStop(); const p = pos(e), q = near(p), m = S.maps.main;
    if (q) { SEQ.drag = { type: q.id }; if (SEQ.win.x0 === null) { SEQ.win = seqResolvedWin(); SEQ.drag.auto = true; } }
    else if (inMap(m, p)) SEQ.drag = { type: 'pan', px: p.x, py: p.y, w: seqResolvedWin() };
    if (SEQ.drag) cv.style.cursor = SEQ.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!seqActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = SEQ.S; if (!S) return; const p = pos(e), d = SEQ.drag;
    if (!d) {
      cv.style.cursor = near(p) ? 'pointer' : (inMap(S.maps.main, p) ? 'crosshair' : '');
      // Summenzeichen: Maus über Grenze, Summand oder einzelnem Summanden → zugehörige Teile überall hervorheben
      if (SEQ.view === 'sig' && S.sigHot && typeof envHintOn === 'function') {
        const h = S.sigHot.find(q => p.x >= q.b[0] && p.x <= q.b[2] && p.y >= q.b[1] && p.y <= q.b[3]), key = h ? h.ids.join(',') : '';
        if (key !== SEQ._hov) { SEQ._hov = key; if (h) envHintOn(h.ids); else envHintOff(); }
      }
      return;
    }
    const m = S.maps.main;
    if (d.type === 'pan') { const w = d.w, dx = (p.x - d.px) / (m.R - m.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (m.B - m.T) * (w.y1 - w.y0); SEQ.win = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0 + dy, y1: w.y1 + dy }; }
    else seqDragTo(d.type, m.IX(p.x), m.IY(p.y), e.shiftKey);
    difRedraw(); if (d.type !== 'pan') seqCardSoon();
  };
  // Maus verlässt das Bild: Hervorhebung aus
  cv.addEventListener('mouseleave', () => { if (SEQ._hov) { SEQ._hov = ''; if (typeof envHintOff === 'function') envHintOff(); } });
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
