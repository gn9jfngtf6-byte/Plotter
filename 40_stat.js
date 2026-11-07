// ═══════════════════════════════════════════════════════════════════
// 40_stat.js — Wahrscheinlichkeit und Statistik: Rechenkern (kein DOM, node-testbar)
//
// Enthält: Zufallszahlen mit Startwert (Seed), Verteilungen (Binomial, Normal),
// und die Zufallsexperimente als reine Funktionen auf einfachen Datenobjekten
// (JSON-fähig, damit Rückgängig/Speichern funktionieren):
//   dice     Würfel / Münze (1 oder 2 Würfel, Augensumme), auch gezinkt
//   galton   Galtonbrett (Kugeln fallen durch ein Dreieck aus Stiften)
//   pi       Monte-Carlo-Näherung von π
//   buffon   Buffon'sches Nadelexperiment
//   monty    Ziegenproblem (Monty Hall)
//   birthday Geburtstagsparadoxon
//   walk     Zufallsspaziergang (eindimensional)
//   clt      Zentraler Grenzwertsatz (Mittelwerte von Stichproben)
//   ci       Konfidenzintervalle (Anteil p oder Mittelwert μ bei bekanntem σ)
//   bayes    Test-Paradox (Vierfeldertafel, Bayes)
// Jedes Experiment: init(P) → Daten, step(D, P, rng, k) → k Versuche mehr.
// Die Oberfläche steht in 41_stat_draw.js / 42_stat_ui.js.
// ═══════════════════════════════════════════════════════════════════
const Stat = (() => {
  // ── Zufallszahlen (mulberry32), Zustand ist eine Zahl und lässt sich speichern ──
  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    return {
      next() { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; },
      get state() { return s; }
    };
  }
  const newSeed = () => (Math.floor(Math.random() * 4294967295) + 1) >>> 0;
  const zeros = n => { const a = new Array(n); for (let i = 0; i < n; i++) a[i] = 0; return a; };

  // ── Verteilungen ──
  function normPdf(x, mu, s) { mu = mu || 0; s = s === undefined ? 1 : s; const z = (x - mu) / s; return Math.exp(-z * z / 2) / (s * Math.sqrt(2 * Math.PI)); }
  function normCdf(x, mu, s) {                       // Hart/West: Genauigkeit ≈ 1e-15
    mu = mu || 0; s = s === undefined ? 1 : s;
    const z = (x - mu) / s, a = Math.abs(z); let c;
    if (a > 37) c = 0;
    else {
      const e = Math.exp(-a * a / 2);
      if (a < 7.07106781186547) {
        let b = 3.52624965998911e-02 * a + 0.700383064443688; b = b * a + 6.37396220353165; b = b * a + 33.912866078383; b = b * a + 112.079291497871; b = b * a + 221.213596169931; b = b * a + 220.206867912376;
        c = e * b;
        let d = 8.83883476483184e-02 * a + 1.75566716318264; d = d * a + 16.064177579207; d = d * a + 86.7807322029461; d = d * a + 296.564248779674; d = d * a + 637.333633378831; d = d * a + 793.826512519948; d = d * a + 440.413735824752;
        c = c / d;
      } else { let b = a + 0.65; b = a + 4 / b; b = a + 3 / b; b = a + 2 / b; b = a + 1 / b; c = e / b / 2.506628274631; }
    }
    return z > 0 ? 1 - c : c;
  }
  function normInv(p) {                              // Umkehrfunktion von Φ (Acklam, danach ein Newton-Schritt)
    if (!(p > 0 && p < 1)) return p <= 0 ? -Infinity : Infinity;
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    let x, q, r;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    const e = normCdf(x) - p; x -= e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    return x;
  }
  const zFor = level => normInv((1 + level) / 2);   // zweiseitig: 0.95 → 1.96
  function binomPmf(n, p, k) {
    if (k < 0 || k > n) return 0;
    if (p <= 0) return k === 0 ? 1 : 0; if (p >= 1) return k === n ? 1 : 0;
    let lc = 0; for (let i = 1; i <= k; i++) lc += Math.log((n - k + i) / i);
    return Math.exp(lc + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  const binomAll = (n, p) => { const a = []; for (let k = 0; k <= n; k++) a.push(binomPmf(n, p, k)); return a; };
  function binomCdf(n, p, k) { let s = 0; for (let i = 0; i <= Math.min(n, Math.floor(k)); i++) s += binomPmf(n, p, i); return Math.min(1, s); }
  function binomSample(n, p, r) { let x = 0; for (let i = 0; i < n; i++) if (r.next() < p) x++; return x; }
  function normSample(r) { let u = r.next(); if (u < 1e-12) u = 1e-12; return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r.next()); }

  // ── Verlauf (relative Häufigkeit über der Anzahl Versuche), in geometrischen Schritten ──
  function record(D, vals) {
    const n = D.n !== undefined ? D.n : D.m;
    if (n <= 20 || n >= (D.next || 0)) { D.hist.push([n].concat(vals)); D.next = Math.max(n + 1, Math.ceil(n * 1.03)); }
  }

  // ═════════ dice ═════════
  // P = {sides, nd (1|2), biased, pb (Wahrscheinlichkeit der höchsten Seite), watch (Augenzahl bzw. Summe)}
  function faceProbs(P) {
    const s = P.sides, f = [];
    if (P.biased && s > 1) { const pb = Math.min(0.95, Math.max(0.01, P.pb)); for (let i = 1; i <= s; i++) f.push(i === s ? pb : (1 - pb) / (s - 1)); }
    else for (let i = 1; i <= s; i++) f.push(1 / s);
    return f;
  }
  function diceProbs(P) {                           // Wahrscheinlichkeiten der Ergebnisse lo..hi
    const f = faceProbs(P);
    if (P.nd !== 2) return f;
    const out = zeros(2 * P.sides - 1);
    for (let i = 0; i < f.length; i++) for (let j = 0; j < f.length; j++) out[i + j] += f[i] * f[j];
    return out;
  }
  const diceLo = P => (P.nd === 2 ? 2 : 1);
  function diceInit(P) { return { n: 0, counts: zeros(diceProbs(P).length), last: [], hist: [], next: 0 }; }
  function diceStep(D, P, r, k) {
    const f = faceProbs(P), lo = diceLo(P);
    const roll = () => { let u = r.next(), c = 0; for (let i = 0; i < f.length; i++) { c += f[i]; if (u < c) return i + 1; } return f.length; };
    for (let t = 0; t < k; t++) {
      const a = roll(), b = P.nd === 2 ? roll() : 0, v = a + b;
      D.counts[v - lo]++; D.n++; D.last = P.nd === 2 ? [a, b] : [a];
      record(D, [D.counts[(P.watch || lo) - lo] / D.n]);
    }
  }

  // ═════════ galton ═════════
  // P = {rows, p}
  function galtonBall(rows, p, r) { const bits = []; for (let i = 0; i < rows; i++) bits.push(r.next() < p ? 1 : 0); return bits; }
  const galtonInit = P => ({ n: 0, counts: zeros(P.rows + 1) });
  function galtonLand(D, bits) { let k = 0; for (const b of bits) k += b; D.counts[k]++; D.n++; return k; }
  function galtonStep(D, P, r, k) { for (let t = 0; t < k; t++) galtonLand(D, galtonBall(P.rows, P.p, r)); }
  function histStats(counts, valueOf) {             // Mittelwert und Standardabweichung aus Häufigkeiten
    let n = 0, s = 0, s2 = 0;
    counts.forEach((c, i) => { const v = valueOf(i); n += c; s += c * v; s2 += c * v * v; });
    if (!n) return { n: 0, mean: 0, sd: 0 };
    const m = s / n; return { n, mean: m, sd: Math.sqrt(Math.max(0, s2 / n - m * m)) };
  }

  // ═════════ pi ═════════
  const PI_KEEP = 1500;
  const piInit = () => ({ n: 0, inside: 0, pts: [], hist: [], next: 0 });
  function piStep(D, P, r, k) {
    for (let t = 0; t < k; t++) {
      const x = r.next(), y = r.next(), ins = x * x + y * y <= 1 ? 1 : 0;
      D.n++; D.inside += ins;
      D.pts.push([Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4, ins]);
      record(D, [4 * D.inside / D.n]);
    }
    if (D.pts.length > PI_KEEP) D.pts.splice(0, D.pts.length - PI_KEEP);
  }

  // ═════════ buffon ═════════
  // Linien im Abstand d = 1 (waagrecht, y = 0, 1, 2 …), Nadellänge P.l ≤ 1; Feld Breite 6, Höhe 4
  const BUF_W = 6, BUF_H = 4, BUF_KEEP = 250;
  const buffonInit = () => ({ n: 0, cross: 0, needles: [], hist: [], next: 0 });
  function buffonStep(D, P, r, k) {
    const l = P.l;
    for (let t = 0; t < k; t++) {
      const x = r.next() * BUF_W, y = r.next() * BUF_H, th = r.next() * Math.PI, h = Math.sin(th) * l / 2;
      const c = Math.floor(y - h) !== Math.floor(y + h) ? 1 : 0;
      D.n++; D.cross += c;
      D.needles.push([Math.round(x * 1e3) / 1e3, Math.round(y * 1e3) / 1e3, Math.round(th * 1e3) / 1e3, c]);
      record(D, [D.cross > 0 ? 2 * l * D.n / D.cross : null]);
    }
    if (D.needles.length > BUF_KEEP) D.needles.splice(0, D.needles.length - BUF_KEEP);
  }
  const buffonProb = l => 2 * l / Math.PI;

  // ═════════ monty ═════════
  function montyHost(car, pick, r) { const o = [0, 1, 2].filter(d => d !== pick && d !== car); return o.length === 1 ? o[0] : o[Math.floor(r.next() * 2)]; }
  const montyInit = () => ({ n: 0, stay: 0, swap: 0, last: null, hist: [], next: 0 });
  function montyStep(D, P, r, k) {
    for (let t = 0; t < k; t++) {
      const car = Math.floor(r.next() * 3), pick = Math.floor(r.next() * 3), open = montyHost(car, pick, r);
      D.n++; if (pick === car) D.stay++; else D.swap++;
      D.last = { car, pick, open };
      record(D, [D.stay / D.n, D.swap / D.n]);
    }
  }

  // ═════════ birthday ═════════
  // P = {k (Personen), days}
  function birthdayProb(k, days) {
    days = days || 365; let q = 1;
    for (let i = 0; i < k; i++) q *= (days - i) / days;
    return 1 - Math.max(0, q);
  }
  const birthdayInit = () => ({ n: 0, hits: 0, last: [], hist: [], next: 0 });
  function birthdayStep(D, P, r, m) {
    for (let t = 0; t < m; t++) {
      const seen = new Set(); let hit = 0; const g = [];
      for (let i = 0; i < P.k; i++) { const d = Math.floor(r.next() * P.days); g.push(d); if (seen.has(d)) hit = 1; seen.add(d); }
      D.n++; D.hits += hit; D.last = g;
      record(D, [D.hits / D.n]);
    }
  }
  function birthdayHasMatch(g) { const s = new Set(); for (const d of g) { if (s.has(d)) return true; s.add(d); } return false; }

  // ═════════ walk ═════════
  // P = {walkers, p}; Pfade für die ersten WALK_PATHS Läufer
  const WALK_PATHS = 20, WALK_MAX = 400;
  function walkInit(P) { const w = Math.max(1, P.walkers | 0); return { steps: 0, pos: zeros(w), paths: Array.from({ length: Math.min(w, WALK_PATHS) }, () => [0]) }; }
  function walkStep(D, P, r, m) {
    for (let t = 0; t < m && D.steps < WALK_MAX; t++) {
      for (let i = 0; i < D.pos.length; i++) {
        D.pos[i] += r.next() < P.p ? 1 : -1;
        if (i < D.paths.length) D.paths[i].push(D.pos[i]);
      }
      D.steps++;
    }
  }

  // ═════════ clt ═════════
  // P = {dist: 'dice'|'uniform'|'exp'|'arcsine', n}
  const CLT_DISTS = {
    dice: { name: 'Würfel', mu: 3.5, sd: Math.sqrt(35 / 12), lo: 1, hi: 6, draw: r => Math.floor(r.next() * 6) + 1 },
    uniform: { name: 'Gleichverteilung', mu: 0.5, sd: Math.sqrt(1 / 12), lo: 0, hi: 1, draw: r => r.next() },
    exp: { name: 'Exponentialverteilung', mu: 1, sd: 1, lo: 0, hi: Infinity, draw: r => -Math.log(1 - r.next()) },
    arcsine: { name: 'U-förmig', mu: 0.5, sd: Math.sqrt(1 / 8), lo: 0, hi: 1, draw: r => { const s = Math.sin(Math.PI * r.next() / 2); return s * s; } }
  };
  function cltBins(P) {                              // Klassen für die Mittelwerte (fest, solange dist und n gleich bleiben)
    const d = CLT_DISTS[P.dist], n = P.n, s = d.sd / Math.sqrt(n);
    if (P.dist === 'dice') {
      const m = n <= 12 ? 1 : Math.ceil(n / 8), w = m / n, lo = 1 - 0.5 / n, nb = Math.ceil((5 * n + 1) / m);
      return { lo, w, nb };
    }
    const lo = Math.max(d.lo, d.mu - 4.5 * s), hi = Math.min(d.hi, d.mu + 4.5 * s), nb = 40;
    return { lo, w: (hi - lo) / nb, nb };
  }
  function cltInit(P) { const b = cltBins(P); return { m: 0, counts: zeros(b.nb), sum: 0, sum2: 0, last: [], hist: [] }; }
  function cltStep(D, P, r, k) {
    const d = CLT_DISTS[P.dist], b = cltBins(P);
    for (let t = 0; t < k; t++) {
      let s = 0; const smp = [];
      for (let i = 0; i < P.n; i++) { const v = d.draw(r); s += v; if (i < 12) smp.push(Math.round(v * 1e3) / 1e3); }
      const mean = s / P.n;
      let j = Math.floor((mean - b.lo) / b.w + 1e-9); j = Math.max(0, Math.min(b.nb - 1, j));
      D.counts[j]++; D.m++; D.sum += mean; D.sum2 += mean * mean; D.last = smp;
    }
  }

  // ═════════ ci ═════════
  // P = {kind: 'p'|'mu', p, n, level, mu, sigma}
  const CI_KEEP = 100;
  const ciInit = () => ({ m: 0, hit: 0, ivs: [], hist: [], next: 0 });
  function ciOne(P, r) {
    const z = zFor(P.level);
    if (P.kind === 'mu') {
      const xbar = P.mu + P.sigma / Math.sqrt(P.n) * normSample(r), h = z * P.sigma / Math.sqrt(P.n);
      return { lo: xbar - h, hi: xbar + h, est: xbar, ok: Math.abs(xbar - P.mu) <= h };
    }
    const ph = binomSample(P.n, P.p, r) / P.n, h = z * Math.sqrt(ph * (1 - ph) / P.n);
    return { lo: ph - h, hi: ph + h, est: ph, ok: Math.abs(ph - P.p) <= h };
  }
  function ciStep(D, P, r, k) {
    for (let t = 0; t < k; t++) {
      const v = ciOne(P, r);
      D.m++; if (v.ok) D.hit++;
      record(D, [D.hit / D.m]);
      D.ivs.push([Math.round(v.lo * 1e5) / 1e5, Math.round(v.hi * 1e5) / 1e5, Math.round(v.est * 1e5) / 1e5, v.ok ? 1 : 0]);
    }
    if (D.ivs.length > CI_KEEP) D.ivs.splice(0, D.ivs.length - CI_KEEP);
  }

  // ═════════ bayes ═════════
  // P = {prev, sens, spec, N, mode: 'exact'|'random'}; Reihenfolge: [krank+positiv, krank+negativ, gesund+positiv, gesund+negativ]
  function bayesExact(P) {
    const N = P.N, w = [P.prev * P.sens, P.prev * (1 - P.sens), (1 - P.prev) * (1 - P.spec), (1 - P.prev) * P.spec].map(x => x * N);
    const c = w.map(Math.floor); let rest = N - c.reduce((a, b) => a + b, 0);
    const order = w.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
    for (let i = 0; rest > 0; i = (i + 1) % 4, rest--) c[order[i][1]]++;
    return c;
  }
  function bayesRandom(P, r) {
    const c = [0, 0, 0, 0];
    for (let i = 0; i < P.N; i++) {
      const sick = r.next() < P.prev, pos = r.next() < (sick ? P.sens : 1 - P.spec);
      c[sick ? (pos ? 0 : 1) : (pos ? 2 : 3)]++;
    }
    return c;
  }
  function bayesPosterior(P) { const a = P.prev * P.sens, b = (1 - P.prev) * (1 - P.spec); return a + b > 0 ? a / (a + b) : 0; }

  // ── Urnenmodelle: k Kugeln aus einer Urne mit n nummerierten Kugeln ──
  // repl: mit Zurücklegen, ord: mit Reihenfolge  →  Variation mit/ohne Wiederholung, Kombination ohne/mit Wiederholung
  const URN_MAX_N = 10, URN_MAX_K = 8;
  function fact(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
  function fall(n, k) { if (k < 0 || k > n) return 0; let r = 1; for (let i = 0; i < k; i++) r *= n - i; return r; }       // n·(n−1)·…·(n−k+1) = n!/(n−k)!
  function binom(n, k) { if (k < 0 || k > n) return 0; k = Math.min(k, n - k); let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
  function urnKind(P) { return P.repl ? (P.ord ? 'vmw' : 'kmw') : (P.ord ? 'vow' : 'kow'); }
  function urnCount(P) {
    const n = P.n | 0, k = P.k | 0;
    switch (urnKind(P)) {
      case 'vmw': return Math.pow(n, k);
      case 'vow': return fall(n, k);
      case 'kow': return binom(n, k);
      default: return binom(n + k - 1, k);
    }
  }
  function urnFix(P) { P.n = Math.max(2, Math.min(URN_MAX_N, Math.round(P.n))); P.k = Math.max(1, Math.min(URN_MAX_K, Math.round(P.k))); if (!P.repl) P.k = Math.min(P.k, P.n); return P; }
  function urnDraw(P, r) {                           // ein Beispiel-Zug in der gezogenen Reihenfolge
    const n = P.n | 0, k = P.k | 0, out = [];
    if (P.repl) { for (let i = 0; i < k; i++) out.push(1 + Math.floor(r.next() * n)); return out; }
    const a = []; for (let i = 1; i <= n; i++) a.push(i);
    for (let i = 0; i < k; i++) { const j = i + Math.floor(r.next() * (n - i)), t = a[i]; a[i] = a[j]; a[j] = t; out.push(a[i]); }
    return out;
  }
  function urnMult(P, draw) { const c = zeros(P.n | 0); draw.forEach(v => { c[v - 1]++; }); return c; }
  // Wahrscheinlichkeit, genau dieses Ergebnis zu erhalten, als Bruch num/den.
  // Gleich wahrscheinlich sind Folgen (mit Reihenfolge) und Teilmengen (ohne Zurücklegen). Nur bei «Kombination mit Wiederholung»
  // haben die Möglichkeiten verschiedene Wahrscheinlichkeiten: k!/(k₁!·…·kₙ!) von n^k Folgen gehören zur gleichen Menge.
  function urnProb(P, draw) {
    if (urnKind(P) !== 'kmw') return { num: 1, den: urnCount(P) };
    const c = urnMult(P, draw); let num = fact(P.k | 0); c.forEach(v => { num /= fact(v); });
    return { num: Math.round(num), den: Math.pow(P.n | 0, P.k | 0) };
  }
  function urnInit(P, r) { return { draw: urnDraw(P, r) }; }

  // ── Hilfen für die Anzeige ──
  const fmt = (v, d) => { if (v === null || v === undefined || !isFinite(v)) return '–'; const f = Math.pow(10, d === undefined ? 3 : d); return String(Math.round(v * f) / f); };
  function niceStep(range, target) {               // schöner Abstand für Achsenstriche
    const raw = range / (target || 5), p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }

  return {
    makeRng, newSeed, zeros, normPdf, normCdf, normInv, zFor, binomPmf, binomAll, binomCdf, binomSample, normSample, record,
    faceProbs, diceProbs, diceLo, diceInit, diceStep,
    galtonBall, galtonInit, galtonLand, galtonStep, histStats,
    PI_KEEP, piInit, piStep, BUF_W, BUF_H, BUF_KEEP, buffonInit, buffonStep, buffonProb,
    montyHost, montyInit, montyStep, birthdayProb, birthdayInit, birthdayStep, birthdayHasMatch,
    WALK_PATHS, WALK_MAX, walkInit, walkStep, CLT_DISTS, cltBins, cltInit, cltStep, CI_KEEP, ciInit, ciOne, ciStep,
    bayesExact, bayesRandom, bayesPosterior, URN_MAX_N, URN_MAX_K, fact, fall, binom, urnKind, urnCount, urnFix, urnDraw, urnMult, urnProb, urnInit, fmt, niceStep
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Stat;
