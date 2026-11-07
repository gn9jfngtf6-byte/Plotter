// ═══════════════════════════════════════════════════════════════════
// 42_stat_ui.js — Wahrscheinlichkeit und Statistik: Panel, Animation, Speichern, LaTeX
//
// Rechenkern: 40_stat.js (Stat). Bilder: 41_stat_draw.js (Szenen).
// Hier: Zustand STAT (pro Experiment Einstellungen und Daten), Panel (#stat-panel),
// Dauerlauf und Kugel-Animation, Zeichnen auf den Canvas, Anbindung an
// Rückgängig/Speichern (statCapture/statApply) und TikZ-Export.
// Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «stat»).
// ═══════════════════════════════════════════════════════════════════

const STAT_MODES = [['dice', 'Würfel / Münze'], ['dice2', 'Zwei Würfel (Augensumme)'], ['galton', 'Galtonbrett'], ['pi', 'π mit Zufallspunkten'], ['buffon', 'Buffon: Nadelexperiment'],
  ['monty', 'Ziegenproblem'], ['birthday', 'Geburtstagsparadoxon'], ['walk', 'Zufallsspaziergang'], ['clt', 'Zentraler Grenzwertsatz'], ['ci', 'Konfidenzintervalle'], ['bayes', 'Test-Paradox (Bayes)'], ['urn', 'Urnenmodelle (Ziehen von Kugeln)']];
const STAT_UNIT = { dice: 'Wurf', dice2: 'Wurf', galton: 'Kugel', pi: 'Punkt', buffon: 'Nadel', monty: 'Spiel', birthday: 'Gruppe', walk: 'Schritt', clt: 'Stichprobe', ci: 'Stichprobe' };
const STAT_SPEEDS = [1, 2, 5, 10, 25, 50, 100, 300, 1000];
const STAT_FALL = 7;                                // Kugeln: Stufen pro Sekunde
const STAT_DEF = {
  dice: { sides: 6, nd: 1, biased: false, pb: 0.3, watch: 6 }, dice2: { sides: 6, nd: 2, biased: false, pb: 0.3, watch: 7 },
  galton: { rows: 10, p: 0.5 }, pi: {}, buffon: { l: 0.8 }, monty: {}, birthday: { k: 23, days: 365 }, walk: { walkers: 20, p: 0.5 },
  clt: { dist: 'dice', n: 5 }, ci: { kind: 'p', p: 0.5, n: 50, level: 0.95, mu: 100, sigma: 15 }, bayes: { prev: 0.01, sens: 0.9, spec: 0.95, N: 1000, mode: 'exact' },
  urn: { n: 5, k: 3, repl: false, ord: true, view: 'one' }
};
const STAT_DESC = {
  dice: ['Du würfelst (oder wirfst eine Münze) und zählst mit.', 'Beobachte: Die relative Häufigkeit h = H/n schwankt am Anfang stark und pendelt sich bei der Wahrscheinlichkeit ein (Gesetz der grossen Zahlen).'],
  dice2: ['Zwei Würfel, die Augensumme wird gezählt.', 'Beobachte: Die Summe 7 kommt am häufigsten, 2 und 12 am seltensten. Es entsteht eine «Dreiecksverteilung».'],
  galton: ['Jede Kugel fällt durch ein Dreieck aus Stiften und geht bei jedem Stift links oder rechts weiter. Unten sammeln sie sich in Fächern.', 'Beobachte: Es entsteht die Glockenkurve. Das ist die Binomialverteilung (rot), die sich der Normalverteilung (violett) annähert. Bei p ≠ 0.5 wird sie schief.'],
  pi: ['Zufallspunkte fallen in ein Quadrat der Seitenlänge 1. Der Anteil im Viertelkreis ist π/4.', 'Beobachte: Mit mehr Punkten nähert sich 4·k/n der Zahl π, aber langsam.'],
  buffon: ['Nadeln fallen auf ein Papier mit parallelen Linien im Abstand 1. Gezählt wird, wie oft eine Nadel eine Linie trifft.', 'Beobachte: Der Trefferanteil ist 2·l/π. Daraus lässt sich π schätzen.'],
  monty: ['Hinter einer von drei Türen steht ein Auto. Du wählst eine Tür, der Moderator öffnet eine Ziegen-Tür. Bleiben oder wechseln?', 'Beobachte: Wechseln gewinnt in 2 von 3 Fällen. Spiel selbst ein paar Runden und lass dann viele Spiele simulieren.'],
  birthday: ['In einer Gruppe von k Personen wird geprüft, ob zwei am selben Tag Geburtstag haben.', 'Beobachte: Schon bei 23 Personen ist die Wahrscheinlichkeit grösser als 50 %.'],
  walk: ['Jeder Läufer geht bei jedem Schritt mit Wahrscheinlichkeit p einen Schritt nach rechts (+1), sonst nach links (−1).', 'Beobachte: Die Streuung wächst nur wie √t, und die Orte der Läufer verteilen sich wie eine Normalverteilung.'],
  clt: ['Aus einer Verteilung werden Stichproben der Grösse n gezogen. Gezählt werden ihre Mittelwerte.', 'Beobachte: Egal wie die Ausgangsverteilung aussieht: Die Mittelwerte folgen einer Glockenkurve, die mit n schmaler wird (σ/√n).'],
  ci: ['Aus einer Grundgesamtheit mit bekanntem Wert wird immer wieder eine Stichprobe gezogen und daraus ein Konfidenzintervall gebildet.', 'Beobachte: Ungefähr der Anteil «Vertrauensniveau» der Intervalle überdeckt den wahren Wert. Die roten verfehlen ihn.'],
  urn: ['Aus einer Urne mit n nummerierten Kugeln werden k Kugeln gezogen. Zwei Fragen legen das Modell fest: Wird zurückgelegt? Zählt die Reihenfolge?', 'Beobachte: Die vier Kombinationen ergeben vier Zählformeln. Mit «Neue Ziehung» siehst du ein Beispiel; die Rechnung zeigt die Anzahl der Möglichkeiten und die Wahrscheinlichkeit.'],
  bayes: ['Ein Test für eine seltene Krankheit ist nicht perfekt. Wie sicher ist man nach einem positiven Test wirklich krank?', 'Beobachte: Bei seltenen Krankheiten sind die meisten positiv Getesteten gesund (violett), obwohl der Test gut ist.']
};

// Eingabeelemente je Experiment: t 'select' | 'range' | 'check' ; show = nur wenn Bedingung; reset = Daten neu beginnen
function statControls(mode, P) {
  const pct = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5];
  switch (mode) {
    case 'dice': return [
      { k: 'sides', t: 'select', l: 'Anzahl Seiten', o: [[2, '2 (Münze)'], [4, '4'], [6, '6'], [8, '8'], [12, '12'], [20, '20']], reset: true },
      { k: 'biased', t: 'check', l: 'Gezinkt (eine Seite bevorzugt)', reset: true },
      { k: 'pb', t: 'range', l: 'Wahrscheinlichkeit der höchsten Seite', min: 0.05, max: 0.9, step: 0.05, show: P.biased, reset: true },
      { k: 'watch', t: 'select', l: 'Im Verlauf beobachten', o: (() => { const a = []; for (let i = 1; i <= P.sides; i++) a.push([i, P.sides === 2 ? (i === 1 ? 'Kopf' : 'Zahl') : String(i)]); return a; })() },
      { s: 'theory', t: 'check', l: 'Theoretische Wahrscheinlichkeiten zeigen' }];
    case 'dice2': return [
      { k: 'sides', t: 'select', l: 'Seiten pro Würfel', o: [[4, '4'], [6, '6'], [8, '8'], [10, '10']], reset: true },
      { k: 'biased', t: 'check', l: 'Gezinkt (höchste Seite bevorzugt)', reset: true },
      { k: 'pb', t: 'range', l: 'Wahrscheinlichkeit der höchsten Seite', min: 0.05, max: 0.9, step: 0.05, show: P.biased, reset: true },
      { k: 'watch', t: 'select', l: 'Im Verlauf beobachten (Summe)', o: (() => { const a = []; for (let i = 2; i <= 2 * P.sides; i++) a.push([i, String(i)]); return a; })() },
      { s: 'theory', t: 'check', l: 'Theoretische Wahrscheinlichkeiten zeigen' }];
    case 'galton': return [
      { k: 'rows', t: 'range', l: 'Anzahl Stiftreihen n', min: 2, max: 20, step: 1, reset: true },
      { k: 'p', t: 'range', l: 'Wahrscheinlichkeit nach rechts p', min: 0.05, max: 0.95, step: 0.05, reset: true },
      { s: 'theory', t: 'check', l: 'Binomialverteilung einblenden' }, { s: 'normal', t: 'check', l: 'Normalverteilung einblenden' }];
    case 'buffon': return [{ k: 'l', t: 'range', l: 'Nadellänge l (Linienabstand 1)', min: 0.2, max: 1, step: 0.1, reset: true }];
    case 'birthday': return [{ k: 'k', t: 'range', l: 'Anzahl Personen k', min: 2, max: 60, step: 1, reset: true }];
    case 'walk': return [
      { k: 'walkers', t: 'select', l: 'Anzahl Läufer', o: [[1, '1'], [5, '5'], [20, '20'], [100, '100'], [500, '500']], reset: true },
      { k: 'p', t: 'range', l: 'Wahrscheinlichkeit für +1', min: 0.1, max: 0.9, step: 0.05, reset: true },
      { s: 'theory', t: 'check', l: 'Theorie einblenden (Hüllkurve, Normalverteilung)' }];
    case 'clt': return [
      { k: 'dist', t: 'select', l: 'Ausgangsverteilung', o: [['dice', 'Würfel'], ['uniform', 'Gleichverteilung'], ['exp', 'Exponentialverteilung (schief)'], ['arcsine', 'U-förmig']], reset: true },
      { k: 'n', t: 'range', l: 'Stichprobengrösse n', min: 1, max: 50, step: 1, reset: true },
      { s: 'normal', t: 'check', l: 'Normalverteilung einblenden' }];
    case 'ci': return [
      { k: 'kind', t: 'select', l: 'Gesucht ist', o: [['p', 'ein Anteil p'], ['mu', 'ein Mittelwert μ (σ bekannt)']], reset: true },
      { k: 'p', t: 'range', l: 'Wahrer Anteil p', min: 0.05, max: 0.95, step: 0.05, show: P.kind === 'p', reset: true },
      { k: 'n', t: 'select', l: 'Stichprobengrösse n', o: [10, 20, 30, 50, 100, 200, 500, 1000].map(v => [v, String(v)]), reset: true },
      { k: 'level', t: 'select', l: 'Vertrauensniveau', o: [[0.8, '80 %'], [0.9, '90 %'], [0.95, '95 %'], [0.99, '99 %']], reset: true }];
    case 'bayes': return [
      { k: 'prev', t: 'select', l: 'Krankheitshäufigkeit', o: pct.map(v => [v, Stat.fmt(v * 100, 1) + ' %']), reset: true },
      { k: 'sens', t: 'select', l: 'Sensitivität: P(positiv | krank)', o: [0.5, 0.7, 0.8, 0.9, 0.95, 0.99].map(v => [v, Stat.fmt(v * 100, 0) + ' %']), reset: true },
      { k: 'spec', t: 'select', l: 'Spezifität: P(negativ | gesund)', o: [0.5, 0.7, 0.8, 0.9, 0.95, 0.99].map(v => [v, Stat.fmt(v * 100, 0) + ' %']), reset: true },
      { k: 'mode', t: 'select', l: 'Personen', o: [['exact', 'Erwartete Zahlen (genau)'], ['random', 'Zufällig gezogen']], reset: true }];
    case 'urn': return [
      { k: 'view', t: 'select', l: 'Ansicht', o: [['one', 'Eine Variante erklären'], ['cmp', 'Alle vier vergleichen']] },
      { k: 'n', t: 'range', l: 'Kugeln in der Urne n', min: 2, max: 10, step: 1, reset: true },
      { k: 'k', t: 'range', l: 'Gezogene Kugeln k', min: 1, max: P.repl ? 8 : P.n, step: 1, reset: true },
      { k: 'repl', t: 'check', l: 'Mit Zurücklegen', reset: true }, { k: 'ord', t: 'check', l: 'Mit Reihenfolge', reset: true }];
    default: return [];
  }
}

function statActive() { return typeof ENV !== 'undefined' && ENV.cur === 'stat'; }
const $stat = id => document.getElementById(id);
const statEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const statCopy = o => JSON.parse(JSON.stringify(o));

// ── Zustand ──────────────────────────────────────────────────────────
function statDefaults() {
  return { mode: 'dice', P: statCopy(STAT_DEF), D: {}, seed: Stat.newSeed(), speed: 3, show: { theory: true, normal: true }, play: null, playStats: { n: 0, stay: 0, swap: 0, nStay: 0, nSwap: 0 } };
}
const STAT = Object.assign(statDefaults(), { running: false, fx: [], acc: 0, last: 0, raf: 0, histPending: false, ui: null });

function statInitData(mode, P) {
  switch (mode) {
    case 'dice': case 'dice2': return Stat.diceInit(P);
    case 'galton': return Stat.galtonInit(P);
    case 'pi': return Stat.piInit();
    case 'buffon': return Stat.buffonInit();
    case 'monty': return Stat.montyInit();
    case 'birthday': return Stat.birthdayInit();
    case 'walk': return Stat.walkInit(P);
    case 'clt': return Stat.cltInit(P);
    case 'ci': return Stat.ciInit();
    case 'bayes': return { counts: P.mode === 'random' ? Stat.bayesRandom(P, Stat.makeRng(STAT.seed)) : Stat.bayesExact(P) };
    case 'urn': { const r = Stat.makeRng(STAT.seed), D = Stat.urnInit(P, r); STAT.seed = r.state; return D; }
  }
  return {};
}
function statD(mode) { mode = mode || STAT.mode; if (!STAT.D[mode]) STAT.D[mode] = statInitData(mode, STAT.P[mode]); return STAT.D[mode]; }

function statCapture() {
  return statCopy({ mode: STAT.mode, P: STAT.P, D: STAT.D, seed: STAT.seed, speed: STAT.speed, show: STAT.show, play: STAT.play, playStats: STAT.playStats });
}
// Prüft einen gespeicherten Zustand und übernimmt nur Gültiges
function statSanitizeP(mode, src) {
  const P = statCopy(STAT_DEF[mode]);
  if (!src || typeof src !== 'object') return P;
  const tmp = Object.assign({}, P, src);
  statControls(mode, tmp).forEach(c => {
    if (!c.k || !(c.k in src)) return;
    const v = src[c.k];
    if (c.t === 'check') P[c.k] = !!v;
    else if (c.t === 'range') { const x = Number(v); if (isFinite(x)) P[c.k] = Math.max(c.min, Math.min(c.max, x)); }
    else if (c.t === 'select') { const o = c.o.find(q => String(q[0]) === String(v)); if (o) P[c.k] = o[0]; }
  });
  if (mode === 'urn') Stat.urnFix(P);
  if (mode === 'dice' || mode === 'dice2') { const lo = mode === 'dice2' ? 2 : 1, hi = mode === 'dice2' ? 2 * P.sides : P.sides; if (!(P.watch >= lo && P.watch <= hi)) P.watch = mode === 'dice2' ? P.sides + 1 : P.sides; }
  return P;
}
function statDataOk(mode, D, P) {
  try {
    if (!D || typeof D !== 'object') return false;
    switch (mode) {
      case 'dice': case 'dice2': return Array.isArray(D.counts) && D.counts.length === Stat.diceProbs(P).length && Array.isArray(D.hist);
      case 'galton': return Array.isArray(D.counts) && D.counts.length === P.rows + 1;
      case 'pi': return Array.isArray(D.pts) && Array.isArray(D.hist);
      case 'buffon': return Array.isArray(D.needles) && Array.isArray(D.hist);
      case 'monty': case 'birthday': return Array.isArray(D.hist);
      case 'walk': return Array.isArray(D.pos) && D.pos.length === Math.max(1, P.walkers | 0) && Array.isArray(D.paths);
      case 'clt': return Array.isArray(D.counts) && D.counts.length === Stat.cltBins(P).nb && Array.isArray(D.last);
      case 'ci': return Array.isArray(D.ivs) && Array.isArray(D.hist);
      case 'bayes': return Array.isArray(D.counts) && D.counts.length === 4 && D.counts.reduce((a, b) => a + b, 0) === P.N;
      case 'urn': return Array.isArray(D.draw) && D.draw.length === P.k && D.draw.every(v => Number.isInteger(v) && v >= 1 && v <= P.n) && (P.repl || new Set(D.draw).size === D.draw.length);
    }
  } catch (e) {}
  return false;
}
function statApply(s) {
  const d = statDefaults();
  if (s && typeof s === 'object') {
    if (STAT_MODES.some(m => m[0] === s.mode)) d.mode = s.mode;
    STAT_MODES.forEach(([id]) => {
      d.P[id] = statSanitizeP(id, s.P && s.P[id]);
      if (s.D && s.D[id] && statDataOk(id, s.D[id], d.P[id])) d.D[id] = s.D[id];
    });
    if (Number.isInteger(s.seed) && s.seed > 0) d.seed = s.seed;
    if (Number.isInteger(s.speed) && s.speed >= 0 && s.speed < STAT_SPEEDS.length) d.speed = s.speed;
    if (s.show && typeof s.show === 'object') { d.show.theory = s.show.theory !== false; d.show.normal = s.show.normal !== false; }
    if (s.play && typeof s.play === 'object' && ['pick', 'swap', 'done'].indexOf(s.play.phase) >= 0 && [s.play.car, s.play.pick, s.play.open].every(v => v === undefined || [0, 1, 2].indexOf(v) >= 0)) d.play = s.play;
    if (s.playStats && typeof s.playStats === 'object') ['n', 'stay', 'swap', 'nStay', 'nSwap'].forEach(k => { const v = Number(s.playStats[k]); if (isFinite(v) && v >= 0) d.playStats[k] = Math.floor(v); });
  }
  STAT.mode = d.mode; STAT.P = d.P; STAT.D = d.D; STAT.seed = d.seed; STAT.speed = d.speed; STAT.show = d.show; STAT.play = d.play; STAT.playStats = d.playStats;
  STAT.running = false; STAT.fx = []; STAT.acc = 0; STAT.histPending = false;
  statRefreshUI(); statRedraw();
}

// ── Versuche ausführen ───────────────────────────────────────────────
function statDo(k, running) {
  const m = STAT.mode, P = STAT.P[m], D = statD(m), r = Stat.makeRng(STAT.seed), rate = STAT_SPEEDS[STAT.speed];
  switch (m) {
    case 'dice': case 'dice2': Stat.diceStep(D, P, r, k); break;
    case 'galton': {
      const animate = running ? rate <= 60 : k <= 100, stagger = running ? 1 / rate : (k <= 10 ? 0.12 : 0.03);
      for (let i = 0; i < k; i++) {
        const bits = Stat.galtonBall(P.rows, P.p, r);
        if (animate && STAT.fx.length < 400) STAT.fx.push({ bits, u: -i * stagger * STAT_FALL });
        else Stat.galtonLand(D, bits);
      }
      break;
    }
    case 'pi': Stat.piStep(D, P, r, k); break;
    case 'buffon': Stat.buffonStep(D, P, r, k); break;
    case 'monty': Stat.montyStep(D, P, r, k); break;
    case 'birthday': Stat.birthdayStep(D, P, r, k); break;
    case 'walk': Stat.walkStep(D, P, r, k); break;
    case 'clt': Stat.cltStep(D, P, r, k); break;
    case 'ci': Stat.ciStep(D, P, r, k); break;
    case 'bayes': D.counts = Stat.bayesRandom(P, r); break;
    case 'urn': D.draw = Stat.urnDraw(P, r); break;
  }
  STAT.seed = r.state;
}
function statStopRun() { STAT.running = false; STAT.acc = 0; }
function statKick() { if (!STAT.raf) { STAT.last = 0; STAT.raf = requestAnimationFrame(statFrame); } }
function statFrame(ts) {
  STAT.raf = 0;
  if (!statActive()) { STAT.running = false; STAT.fx = []; return; }
  const dt = STAT.last ? Math.min(0.1, (ts - STAT.last) / 1000) : 0.016; STAT.last = ts;
  let keep = false;
  if (STAT.running) {
    STAT.acc += dt * STAT_SPEEDS[STAT.speed];
    let k = Math.floor(STAT.acc); STAT.acc -= k;
    if (k > 0) statDo(Math.min(k, 3000), true);
    keep = true;
    if (STAT.mode === 'walk' && statD().steps >= Stat.WALK_MAX) { statStopRun(); statSyncRun(); keep = false; STAT.histPending = true; }
  }
  if (STAT.fx.length) {
    const P = STAT.P.galton, D = statD('galton'), left = [];
    STAT.fx.forEach(b => { b.u += dt * STAT_FALL; if (b.u >= P.rows + 1) Stat.galtonLand(D, b.bits); else left.push(b); });
    STAT.fx = left; keep = keep || left.length > 0;
  }
  statRedraw();
  if (keep) STAT.raf = requestAnimationFrame(statFrame);
  else { STAT.last = 0; if (STAT.histPending && !STAT.running) { STAT.histPending = false; statCommit(); } }
}
function statRedraw() { if (typeof scheduleDraw === 'function') scheduleDraw(); }
function statCommit() {
  if (STAT.fx.length || STAT.running) { STAT.histPending = true; return; }
  if (typeof pushHistory === 'function') pushHistory();
}

// Aktion mit k Versuchen (Knöpfe +1 … +1000)
function statAdd(k) {
  if (STAT.mode === 'bayes' || STAT.mode === 'urn') return;
  statDo(k, false); statRedraw();
  if (STAT.fx.length) { STAT.histPending = true; statKick(); } else statCommit();
}
function statToggleRun() {
  STAT.running = !STAT.running; STAT.acc = 0;
  if (STAT.running) statKick(); else STAT.histPending = true;
  statSyncRun();
  if (!STAT.running) { if (!STAT.fx.length) { STAT.histPending = false; statCommit(); } else statKick(); }
}
function statNew() {
  statStopRun(); STAT.fx = []; delete STAT.D[STAT.mode]; statD();
  statSyncRun(); statRedraw(); statCommit();
}

// ── Ziegenproblem von Hand ───────────────────────────────────────────
function statPlayStart() {
  const r = Stat.makeRng(STAT.seed), car = Math.floor(r.next() * 3); STAT.seed = r.state;
  STAT.play = { phase: 'pick', car, pick: undefined, open: undefined }; statRefreshExtra(); statRedraw(); statCommit();
}
function statPlayPick(d) {
  const r = Stat.makeRng(STAT.seed), p = STAT.play; if (!p || p.phase !== 'pick') return;
  p.pick = d; p.open = Stat.montyHost(p.car, d, r); STAT.seed = r.state; p.phase = 'swap'; statRefreshExtra(); statRedraw(); statCommit();
}
function statPlayDecide(swap) {
  const p = STAT.play, ps = STAT.playStats; if (!p || p.phase !== 'swap') return;
  const fin = swap ? [0, 1, 2].find(d => d !== p.pick && d !== p.open) : p.pick;
  p.won = fin === p.car; p.fin = fin; p.phase = 'done';
  ps.n++; if (swap) { ps.nSwap++; if (p.won) ps.swap++; } else { ps.nStay++; if (p.won) ps.stay++; }
  statRefreshExtra(); statRedraw(); statCommit();
}

// ── Panel ────────────────────────────────────────────────────────────
function statBuildUI() {
  if (STAT.ui || !$stat('stat-panel')) return;
  const ui = STAT.ui = {}, body = $stat('stat-body');
  ui.sel = statEl('select'); ui.sel.id = 'stat-mode';
  STAT_MODES.forEach(([id, nm]) => { const o = statEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { statStopRun(); STAT.fx = []; STAT.mode = ui.sel.value; statD(); statRefreshUI(); statRedraw(); statCommit(); });
  const lab = statEl('div', 'subpanel-label', 'Experiment'); lab.style.marginTop = '0';
  ui.desc = statEl('div', 'act-hint'); ui.desc.style.cssText = 'margin:6px 2px 8px;';
  ui.params = statEl('div', 'alg-opts'); ui.extra = statEl('div');
  ui.btns = statEl('div'); ui.btns.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:10px;';
  ui.run = statEl('div'); ui.run.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px;';
  ui.speedRow = statEl('div', 'settings-row'); ui.speedRow.style.cssText = 'gap:8px;margin-top:8px;';
  body.append(lab, ui.sel, ui.desc, ui.params, ui.extra, ui.btns, ui.run, ui.speedRow);
  const det = statEl('details', 'geo-box td-sec');
  det.append(statEl('summary', null, 'Export'));
  const ac = statEl('div', 'ex-actions');
  ui.bj = statEl('button', null, '📷 JPEG'); ui.bl = statEl('button', 'ex-primary', 'LaTeX'); ui.bc = statEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.bc);
  ui.ta = statEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code (TikZ) erscheint hier…'; ui.msg = statEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', statMakeLatex); ui.bc.addEventListener('click', statCopyLatex);
  statRefreshUI();
}
function statBtn(txt, fn, title) { const b = statEl('button', null, txt); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', fn); return b; }

function statRefreshUI() {
  const ui = STAT.ui; if (!ui) return;
  const m = STAT.mode, P = STAT.P[m];
  ui.sel.value = m;
  const d = STAT_DESC[m]; ui.desc.replaceChildren(statEl('div', null, d[0]), Object.assign(statEl('div', null, d[1]), { style: 'margin-top:5px;' }));
  // Einstellungen
  ui.params.replaceChildren();
  statControls(m, P).forEach(c => {
    if (c.show === false) return;
    const row = statEl('div', 'settings-row'); row.style.gap = '8px';
    const id = 'stat-c-' + (c.k || c.s);
    if (c.t === 'check') {
      const lb = statEl('label'), inp = statEl('input'); inp.type = 'checkbox'; inp.id = id; inp.checked = c.s ? STAT.show[c.s] !== false : !!P[c.k];
      lb.append(inp, document.createTextNode(' '), statEl('span', null, c.l)); row.appendChild(lb);
      inp.addEventListener('change', () => {
        if (c.s) STAT.show[c.s] = inp.checked; else { P[c.k] = inp.checked; if (c.reset) statResetData(); }
        if (!c.s) statRefreshUI(); statRedraw(); statCommit();
      });
      ui.params.appendChild(row);
    } else if (c.t === 'select') {
      const lb = statEl('label', null, c.l); lb.setAttribute('for', id);
      const sel = statEl('select'); sel.id = id; c.o.forEach(o => { const op = statEl('option', null, String(o[1])); op.value = String(o[0]); sel.appendChild(op); });
      sel.value = String(P[c.k]);
      sel.addEventListener('change', () => {
        const o = c.o.find(q => String(q[0]) === sel.value); P[c.k] = o ? o[0] : P[c.k];
        statAfterParam(m, c.k); if (c.reset) statResetData();
        statRefreshUI(); statRedraw(); statCommit();
      });
      row.append(lb, sel); ui.params.appendChild(row);
    } else if (c.t === 'range') {
      const wrap = statEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
      const top = statEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
      const lb = statEl('label', null, c.l); lb.setAttribute('for', id);
      const val = statEl('b', null, Stat.fmt(P[c.k], 2)); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
      top.append(lb, val);
      const inp = statEl('input'); inp.type = 'range'; inp.id = id; inp.min = c.min; inp.max = c.max; inp.step = c.step; inp.value = P[c.k]; inp.style.width = '100%';
      inp.addEventListener('input', () => { P[c.k] = parseFloat(inp.value); val.textContent = Stat.fmt(P[c.k], 2); statAfterParam(m, c.k); if (c.reset) statResetData(); statRedraw(); });
      inp.addEventListener('change', () => { if (m === 'urn') statRefreshUI(); else statRefreshExtra(); statCommit(); });
      wrap.append(top, inp); row.appendChild(wrap); ui.params.appendChild(row);
    }
  });
  statRefreshExtra();
  // Knöpfe
  ui.btns.replaceChildren(); ui.run.replaceChildren(); ui.speedRow.replaceChildren();
  if (m === 'bayes') {
    if (P.mode === 'random') { ui.btns.style.display = 'block'; ui.btns.appendChild(Object.assign(statBtn('Neu würfeln', () => { statDo(1); statResetKeep(); statRedraw(); statCommit(); }), { style: 'width:100%;' })); }
    else ui.btns.style.display = 'none';
    ui.speedRow.style.display = 'none';
  } else if (m === 'urn') {
    ui.btns.style.display = 'block'; ui.speedRow.style.display = 'none';
    ui.btns.appendChild(Object.assign(statBtn('Neue Ziehung', () => { statDo(1); statRedraw(); statCommit(); }), { style: 'width:100%;' }));
  } else {
    ui.btns.style.display = 'grid'; ui.speedRow.style.display = '';
    const u = STAT_UNIT[m] || 'Versuch', ks = m === 'walk' ? [1, 10, 100] : [1, 10, 100, 1000];
    ui.btns.style.gridTemplateColumns = 'repeat(' + ks.length + ',1fr)';
    ks.forEach(k => ui.btns.appendChild(statBtn('+' + k, () => statAdd(k), '+' + k + ' ' + u)));
    ui.runBtn = statBtn('▶ Dauerlauf', statToggleRun); ui.run.append(ui.runBtn, statBtn('↺ Neu beginnen', statNew));
    const lb = statEl('label', null, 'Geschwindigkeit'), sp = statEl('input'); sp.type = 'range'; sp.min = 0; sp.max = STAT_SPEEDS.length - 1; sp.step = 1; sp.value = STAT.speed; sp.style.flex = '1';
    const v = statEl('b'); v.setAttribute('translate', 'no'); v.style.cssText = 'font-size:12px;min-width:78px;text-align:right;';
    const showV = () => { v.textContent = STAT_SPEEDS[STAT.speed] + ' / s'; };
    sp.addEventListener('input', () => { STAT.speed = parseInt(sp.value, 10); showV(); }); sp.addEventListener('change', () => statCommit());
    showV(); ui.speedRow.append(lb, sp, v);
    statSyncRun();
  }
}
function statSyncRun() { const ui = STAT.ui; if (ui && ui.runBtn) ui.runBtn.textContent = STAT.running ? '⏸ Pause' : '▶ Dauerlauf'; }
function statResetData() { statStopRun(); STAT.fx = []; delete STAT.D[STAT.mode]; statD(); statSyncRun(); }
function statResetKeep() { /* Bayes: neue Zufallsziehung wurde bereits in statDo gesetzt */ }
function statAfterParam(m, k) {
  const P = STAT.P[m];
  if (m === 'urn') Stat.urnFix(P);
  if ((m === 'dice' || m === 'dice2') && k === 'sides') P.watch = m === 'dice2' ? P.sides + 1 : P.sides;
}
function statRefreshExtra() {
  const ui = STAT.ui; if (!ui) return;
  ui.extra.replaceChildren();
  if (STAT.mode !== 'monty') return;
  const box = statEl('div', 'td-sec'), p = STAT.play;
  box.appendChild(statEl('div', 'subpanel-label', 'Selbst spielen'));
  const row = statEl('div'); row.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:4px;';
  const msg = statEl('div', 'act-hint'); msg.style.margin = '6px 2px 0';
  if (!p || p.phase === 'done') {
    if (p) msg.textContent = (p.won ? 'Gewonnen! Das Auto war hinter Tür ' : 'Leider eine Ziege. Das Auto war hinter Tür ') + (p.car + 1) + '.';
    row.style.gridTemplateColumns = '1fr'; row.appendChild(statBtn(p ? 'Nochmals spielen' : 'Neues Spiel starten', statPlayStart));
  } else if (p.phase === 'pick') {
    msg.textContent = 'Hinter welcher Tür steht das Auto?';
    [0, 1, 2].forEach(d => row.appendChild(statBtn('Tür ' + (d + 1), () => statPlayPick(d))));
  } else {
    msg.textContent = 'Du hast Tür ' + (p.pick + 1) + ' gewählt, der Moderator hat Tür ' + (p.open + 1) + ' geöffnet (Ziege).';
    row.style.gridTemplateColumns = '1fr 1fr'; row.append(statBtn('Bleiben', () => statPlayDecide(false)), statBtn('Wechseln', () => statPlayDecide(true)));
  }
  box.append(row, msg); ui.extra.appendChild(box);
}

// ── Zeichnen ─────────────────────────────────────────────────────────
function statCtx(W, H, exp) {
  const m = STAT.mode;
  return { mode: m, P: STAT.P[m], D: statD(m), show: STAT.show, fs: exp ? exp.fs : stSceneFs(W, H, 52), st: { fx: exp ? [] : STAT.fx, play: STAT.play, playStats: STAT.playStats } };
}
function statTr(s) { try { return (window.AI18N && AI18N.tr) ? AI18N.tr(s) : s; } catch (e) { return s; } }
function statPaint(S, W, H) {
  const P = algPal(), FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
  const col = (c, fill) => (c === 'T' ? P.text : c === 'M' ? P.muted : c === 'L' ? P.line : c === 'G' ? (fill ? P.muted : (P.dark ? '#2f343e' : '#e6e8ec')) : c || P.text);
  stAutoClip(S);
  S.p.forEach(p => {
    ctx.save();
    if (p.clip) { ctx.beginPath(); stClipRects(p.clip).forEach(c => ctx.rect(c[0], c[1], c[2], c[3])); ctx.clip(); }
    ctx.setLineDash(p.dash ? [6, 5] : []);
    const alpha = p.a === undefined ? 1 : p.a;
    if (p.t === 'rect') {
      ctx.beginPath(); if (p.r && ctx.roundRect) ctx.roundRect(p.x, p.y, p.w, p.h, p.r); else ctx.rect(p.x, p.y, p.w, p.h);
      if (p.fill && !p.nofill) { ctx.globalAlpha = alpha; ctx.fillStyle = col(p.fill, true); ctx.fill(); ctx.globalAlpha = 1; }
      if (p.stroke) { ctx.strokeStyle = col(p.stroke); ctx.lineWidth = p.lw || 1; ctx.stroke(); }
    } else if (p.t === 'line') { ctx.strokeStyle = col(p.col); ctx.lineWidth = p.lw || 1; ctx.globalAlpha = alpha; ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.stroke(); }
    else if (p.t === 'circ') {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
      if (p.fill) { ctx.globalAlpha = alpha; ctx.fillStyle = col(p.fill, true); ctx.fill(); ctx.globalAlpha = 1; }
      if (p.stroke) { ctx.strokeStyle = col(p.stroke); ctx.lineWidth = p.lw || 1; ctx.stroke(); }
    } else if (p.t === 'poly') {
      if (p.pts.length > 1) {
        ctx.beginPath(); p.pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); if (p.close) ctx.closePath();
        if (p.fill) { ctx.globalAlpha = alpha; ctx.fillStyle = col(p.fill, true); ctx.fill(); ctx.globalAlpha = 1; }
        ctx.strokeStyle = col(p.col); ctx.lineWidth = p.lw || 1.5; ctx.globalAlpha = p.fill ? 1 : alpha; ctx.stroke();
      }
    } else if (p.t === 'text' && p.rich && typeof finRichDraw === 'function') {
      finRichDraw(p, c => col(c));
    } else if (p.t === 'text') {
      ctx.font = (p.bold ? '600 ' : '') + p.size + 'px ' + FONT; ctx.fillStyle = col(p.col);
      ctx.textAlign = p.al === 'c' ? 'center' : p.al === 'r' ? 'right' : 'left';
      ctx.textBaseline = p.bs === 't' ? 'top' : p.bs === 'b' ? 'bottom' : 'middle';
      ctx.fillText(p.notr ? p.s : statTr(p.s), p.x, p.y);
    }
    ctx.restore();
  });
}
function statDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  const S = stBuildScene(w, h, statCtx(w, h));
  statPaint(S, w, h);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX (TikZ) ─────────────────────────────────────────────────────
const ST_TEX = { 'π': '$\\pi$', 'σ': '$\\sigma$', 'μ': '$\\mu$', '≈': '$\\approx$', '≤': '$\\le$', '≥': '$\\ge$', '±': '$\\pm$', '·': '$\\cdot$', '√': '$\\sqrt{}$', '−': '$-$', '×': '$\\times$', '∞': '$\\infty$', '²': '$^2$', '³': '$^3$', 'ⁿ': '$^n$', '→': '$\\to$', '°': '$^\\circ$', '…': '\\ldots{}', '–': '--', '|': '$|$', 'x̄': '$\\bar{x}$', 'p̂': '$\\hat{p}$', 'Σ': '$\\Sigma$', '■': '\\rule{0.8ex}{0.8ex}', '⇒': '$\\Rightarrow$', '÷': '$\\div$', 'α': '$\\alpha$', '✓': 'ok' };
function statTexText(s) {
  let o = String(s).replace(/[\\{}]/g, c => (c === '\\' ? '\\textbackslash{}' : '\\' + c)).replace(/([&%#_$^~])/g, (m, c) => (c === '^' ? '\\^{}' : c === '~' ? '\\~{}' : '\\' + c));
  const SUPM = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', 'ᵗ': 't', 'ˣ': 'x', 'ⁿ': 'n' };
  o = o.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻ᵗˣⁿ]+/g, m => '$^{' + m.split('').map(c => SUPM[c]).join('') + '}$').replace(/\u2009/g, '\\,').replace(/x̄|p̂/g, m => ST_TEX[m]).replace(/[πσμ≈≤≥±·√−×∞²³ⁿ→°…–|÷Σα✓■⇒]/g, m => ST_TEX[m] || m);
  return o;
}
function statLatex() {
  const fs0 = 11, f = v => String(Math.round(v * 1000) / 1000);
  const m = STAT.mode, P = STAT.P[m], D0 = statD(m), D = statCopy(D0);
  const W = 720, H = m === 'urn' ? (P.view === 'cmp' ? 720 : 600) : 460;     // Urnenmodelle brauchen mehr Höhe (Brüche, Binomialkoeffizienten)
  if (D.pts && D.pts.length > 500) D.pts = D.pts.slice(-500);
  const C = { mode: m, P, D, show: STAT.show, fs: fs0, st: { fx: [], play: STAT.play, playStats: STAT.playStats } };
  return stSceneTex(stBuildScene(W, H, C), W, H, (STAT_MODES.find(q => q[0] === m) || [0, ''])[1], fs0);
}
// Szene → TikZ (gemeinsam mit der Finanzmathematik, 52_fin_ui.js)
function stSceneTex(S, W, H, label, fs0) {
  const f = v => String(Math.round(v * 1000) / 1000), k = 16 / W, L = [], cols = {};
  const pal = { T: 'black', M: 'black!55', G: 'black!15', L: 'black!70' };
  const cn = c => { if (!c) return 'black'; if (pal[c]) return pal[c]; if (c === '#ffffff') return 'white'; if (!cols[c]) cols[c] = 'stC' + Object.keys(cols).length; return cols[c]; };
  const X = x => f(x * k), Y = y => f((H - y) * k), pt = (x, y) => '(' + X(x) + ',' + Y(y) + ')', lwp = w => f((w || 1) * k * 28.45) + 'pt';
  const body = [];
  stAutoClip(S);
  let clipKey = '';
  const closeClip = () => { if (clipKey) { body.push('\\end{scope}'); clipKey = ''; } };
  S.p.forEach(p => {
    const ck = p.clip ? stClipRects(p.clip).map(c => [X(c[0]), Y(c[1] + c[3]), X(c[0] + c[2]), Y(c[1])].join(',')).join(';') : '';
    if (ck !== clipKey) { closeClip(); if (ck) { body.push('\\begin{scope}\\clip ' + stClipRects(p.clip).map(c => pt(c[0], c[1] + c[3]) + ' rectangle ' + pt(c[0] + c[2], c[1])).join(' ') + ';'); clipKey = ck; } }
    if (p.t === 'rect') {
      if (p.w <= 0 || p.h <= 0) return;
      const fillPart = p.fill && !p.nofill ? 'fill=' + cn(p.fill === 'G' ? 'M' : p.fill) + ', fill opacity=' + f(p.a === undefined ? 1 : p.a) : '';
      const drPart = p.stroke ? 'draw=' + cn(p.stroke) + ', line width=' + lwp(p.lw) : 'draw=none';
      body.push('\\path[' + [fillPart, drPart, p.r ? 'rounded corners=' + f(p.r * k * 28.45) + 'pt' : ''].filter(Boolean).join(', ') + '] ' + pt(p.x, p.y + p.h) + ' rectangle ' + pt(p.x + p.w, p.y) + ';');
    } else if (p.t === 'line') {
      body.push('\\draw[' + cn(p.col) + ', line width=' + lwp(p.lw) + (p.dash ? ', dashed' : '') + (p.a !== undefined ? ', opacity=' + f(p.a) : '') + '] ' + pt(p.x1, p.y1) + ' -- ' + pt(p.x2, p.y2) + ';');
    } else if (p.t === 'circ') {
      const r = f(p.r * k) + 'cm';
      if (p.fill) body.push('\\fill[' + cn(p.fill === 'G' ? 'M' : p.fill) + (p.a !== undefined ? ', opacity=' + f(p.a) : '') + '] ' + pt(p.x, p.y) + ' circle (' + r + ');');
      if (p.stroke) body.push('\\draw[' + cn(p.stroke) + ', line width=' + lwp(p.lw) + '] ' + pt(p.x, p.y) + ' circle (' + r + ');');
    } else if (p.t === 'poly') {
      let pts = p.pts; if (pts.length > 160) { const stp = Math.ceil(pts.length / 160); pts = pts.filter((q, i) => i % stp === 0 || i === pts.length - 1); }
      if (pts.length < 2) return;
      body.push('\\draw[' + [p.fill ? 'fill=' + cn(p.fill) + ', fill opacity=' + f(p.a === undefined ? 0.3 : p.a) : '', cn(p.col), 'line width=' + lwp(p.lw || 1.5), p.dash ? 'dashed' : ''].filter(Boolean).join(', ') + '] ' + pts.map(q => pt(q[0], q[1])).join(' -- ') + (p.close ? ' -- cycle' : '') + ';');
    } else if (p.t === 'text') {
      const r = p.size / fs0, sz = r >= 1.45 ? '\\small ' : r >= 1.15 ? '\\footnotesize ' : r >= 0.92 ? '\\scriptsize ' : '\\tiny ';
      const a = (p.bs === 't' ? 'north' : p.bs === 'b' ? 'south' : '') + (p.al === 'l' ? ' west' : p.al === 'r' ? ' east' : '');
      let s = p.emoji ? (p.s === '🚗' ? 'Auto' : 'Ziege') : p.s;
      const txt = p.rich ? (typeof finRichTex === 'function' ? finRichTex(p.s) : s) : statTexText(s);
      body.push('\\node[' + [a.trim() ? 'anchor=' + a.trim() : '', 'text=' + cn(p.col), 'inner sep=0pt'].filter(Boolean).join(', ') + '] at ' + pt(p.x, p.y) + ' {' + sz + (p.bold ? '\\bfseries ' : '') + txt + '};');
    }
  });
  closeClip();
  L.push('% ' + label + ' aus J\\sqrt{10} — benötigt \\usepackage{tikz}');
  Object.keys(cols).forEach(c => { const n = parseInt(c.slice(1), 16); L.push('\\definecolor{' + cols[c] + '}{RGB}{' + [n >> 16, (n >> 8) & 255, n & 255].join(',') + '}'); });
  L.push('\\begin{tikzpicture}[line cap=round, line join=round]');
  return L.concat(body, ['\\end{tikzpicture}']).join('\n');
}
function statMakeLatex() { const ta = STAT.ui && STAT.ui.ta; if (!ta) return ''; try { ta.value = statLatex(); } catch (e) { ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ta.value; }
function statCopyLatex() {
  const ui = STAT.ui; if (!ui) return; if (!ui.ta.value) statMakeLatex();
  const done = () => { ui.msg.textContent = (typeof t === 'function' ? t('msg_copied') : 'Kopiert'); setTimeout(() => { ui.msg.textContent = ''; }, 2500); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ui.ta.value).then(done).catch(() => { ui.ta.select(); document.execCommand('copy'); done(); });
  else { ui.ta.select(); document.execCommand('copy'); done(); }
}

// ── Canvas in dieser Umgebung: keine Verschiebe-/Zoom-/Punkt-Aktionen ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const stop = e => { if (statActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'mousemove', 'mouseup', 'mouseleave', 'dblclick', 'contextmenu', 'wheel', 'touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, stop, { capture: true, passive: false }));
})();

statBuildUI();
