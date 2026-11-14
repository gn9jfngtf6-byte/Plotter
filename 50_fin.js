// ═══════════════════════════════════════════════════════════════════
// 50_fin.js — Finanzmathematik: Rechenkern (ohne DOM, node-testbar)
//
// Begriffe wie im Dossier «Finanzmathematik» (HMS, 2. Jahr):
//   r = 1 + p/100 (Zinsfaktor), Aufzinsen K·rⁿ, Abzinsen K·r⁻ⁿ (Barwert),
//   Prinzip der verschiedenen Konti am Zeitstrahl, Summenzeichen mit
//   Summationsgrenzen, Sparplan (Endwert), Kredit/Rente (Barwert, Annuität),
//   Marchzins nach Schweizer Usanz (30/360), konformer Zins.
// Zeitpunkte sind ganze Perioden (0, 1, 2, …). Zahlungen: {t, a} (a > 0 Einzahlung,
// a < 0 Auszahlung).
// ═══════════════════════════════════════════════════════════════════
const Fin = (() => {
  const THIN = ' ';

  // ── Zahlen formatieren ──
  function fixed(v, d) { let s = (Math.round(v * Math.pow(10, d) + (v < 0 ? -1e-9 : 1e-9)) / Math.pow(10, d)).toFixed(d); if (/^-0(\.0*)?$/.test(s)) s = s.slice(1); return s; }
  function group(intStr) { let o = ''; for (let i = 0; i < intStr.length; i++) { if (i > 0 && (intStr.length - i) % 3 === 0) o += THIN; o += intStr[i]; } return o; }
  // Geldbetrag: 27 813.57 (ab 5 Stellen mit Tausendertrennung wie im Dossier: 12 000, 8500)
  function money(v, d) {
    if (d === undefined) d = 2;
    if (!isFinite(v)) return '–';
    const s = fixed(v, d), neg = s[0] === '-', body = neg ? s.slice(1) : s, parts = body.split('.');
    return (neg ? '−' : '') + (parts[0].length >= 5 ? group(parts[0]) : parts[0]) + (parts[1] !== undefined ? '.' + parts[1] : '');
  }
  // allgemeine Zahl ohne überflüssige Nullen
  function num(v, d) {
    if (d === undefined) d = 4;
    if (!isFinite(v)) return '–';
    let s = fixed(v, d); if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return (s[0] === '-' ? '−' + s.slice(1) : s);
  }
  const pct = (v, d) => num(v, d === undefined ? 3 : d) + ' %';
  const factor = p => 1 + p / 100;
  function rText(p) { return num(factor(p), 6); }                   // «1.025»

  // ── Auf-/Abzinsen, Wert von Zahlungen ──
  const fv = (K, r, n) => K * Math.pow(r, n);
  const pv = (K, r, n) => K / Math.pow(r, n);
  function terms(pay, r, T) { return pay.map(z => { const k = T - z.t; return { t: z.t, a: z.a, k, f: Math.pow(r, k), v: z.a * Math.pow(r, k) }; }); }
  function valueAt(pay, r, T) { return terms(pay, r, T).reduce((s, x) => s + x.v, 0); }
  // Gesuchte Zahlung x (Index idx): Σ übrige + x·r^(T−t) = Ziel  →  x
  function solveUnknown(pay, idx, r, T, target) {
    let rest = 0; pay.forEach((z, i) => { if (i !== idx) rest += z.a * Math.pow(r, T - z.t); });
    const f = Math.pow(r, T - pay[idx].t);
    return (target - rest) / f;
  }
  function rendite(K0, Kn, n) { return n > 0 && K0 > 0 && Kn > 0 ? (Math.pow(Kn / K0, 1 / n) - 1) * 100 : NaN; }
  function laufzeit(K0, Kn, r) { return K0 > 0 && Kn > 0 && r > 0 && r !== 1 ? Math.log(Kn / K0) / Math.log(r) : NaN; }
  const verdopplung = r => (r > 1 ? Math.log(2) / Math.log(r) : NaN);

  // ── Summenzeichen: Grenzen für gleichmässige Zahlungen t = t1 … t2, Bewertung bei T ──
  // kind 'auf'  (alle Zahlungen vor oder bei T):  Σ R·r^k,  k = T−t, k von (T−t2) bis (T−t1)
  //                                              erste Zahlung → obere, letzte → untere Grenze
  // kind 'ab'   (alle Zahlungen bei oder nach T): Σ R·r^(−k), k = t−T, k von (t1−T) bis (t2−T)
  //                                              erste Zahlung → untere, letzte → obere Grenze
  // kind 'mix'  sonst: Σ R·r^(T−t), Laufvariable t selbst
  function sumLimits(t1, t2, T) {
    if (t2 <= T) return { kind: 'auf', lo: T - t2, hi: T - t1, n: t2 - t1 + 1 };
    if (t1 >= T) return { kind: 'ab', lo: t1 - T, hi: t2 - T, n: t2 - t1 + 1 };
    return { kind: 'mix', lo: t1, hi: t2, n: t2 - t1 + 1 };
  }
  // Σ_{k=lo}^{hi} R·q^k direkt und mit der Summenformel
  function geoSumDirect(R, q, lo, hi) { let s = 0; for (let k = lo; k <= hi; k++) s += R * Math.pow(q, k); return s; }
  function geoSumFormula(R, q, lo, hi) { return q === 1 ? R * (hi - lo + 1) : R * Math.pow(q, lo) * (1 - Math.pow(q, hi - lo + 1)) / (1 - q); }
  // Wert einer Ratenfolge R bei t = t1…t2 (jede Periode), Bewertung bei T
  function rateSeries(R, r, t1, t2, T) {
    const L = sumLimits(t1, t2, T), q = L.kind === 'ab' ? 1 / r : (L.kind === 'auf' ? r : r);
    let value = 0; for (let t = t1; t <= t2; t++) value += R * Math.pow(r, T - t);
    return { limits: L, q, value, perPay: R, n: L.n };
  }
  // Rate R, damit Σ = Ziel
  function rateFor(target, r, t1, t2, T) { const f = rateSeries(1, r, t1, t2, T).value; return f !== 0 ? target / f : NaN; }

  // ── Sparplan: n Raten, Bewertung zum Zeitpunkt n (Ende der letzten Periode) ──
  // nachschüssig: Raten bei 1…n; vorschüssig: bei 0…n−1
  function savingsFV(R, q, n, due) {
    if (Math.abs(q - 1) < 1e-12) return R * n;
    const s = R * (Math.pow(q, n) - 1) / (q - 1);
    return due ? s * q : s;
  }
  function savingsSeries(R, q, n, due) {                   // Stand am Ende jeder Periode: [{k, paid, interest, bal}]
    const out = []; let bal = 0;
    for (let k = 1; k <= n; k++) {
      if (due) bal += R;
      const z = bal * (q - 1); bal += z;
      if (!due) bal += R;
      out.push({ k, paid: R * k, bal, interest: bal - R * k });
    }
    return out;
  }
  function savingsRate(target, q, n, due) { const f = savingsFV(1, q, n, due); return f ? target / f : NaN; }
  // ── Kredit / Rente: Barwert bei 0 ──
  function annuityPV(R, q, n, due) {
    if (Math.abs(q - 1) < 1e-12) return R * n;
    return due ? R * (1 - Math.pow(q, -n)) / (1 - 1 / q) : R * (1 - Math.pow(q, -n)) / (q - 1);
  }
  function annuityRate(K, q, n, due) { const f = annuityPV(1, q, n, due); return f ? K / f : NaN; }
  function loanSchedule(K, q, n, due) {
    const R = annuityRate(K, q, n, due), i = q - 1, rows = []; let bal = K;
    for (let k = 1; k <= n; k++) {
      const begin = bal, Z = due ? (begin - R) * i : begin * i;
      bal = due ? begin - R + Z : begin + Z - R;
      if (k === n && Math.abs(bal) < 1e-6) bal = 0;
      rows.push({ k, begin, interest: Z, repay: R - Z, rate: R, end: bal });
    }
    return { R, rows };
  }

  // ── Konformer und effektiver Zins ──
  const conformI = (p, m) => (Math.pow(1 + p / 100, 1 / m) - 1) * 100;       // Jahreszins p % → Zins pro Teilperiode in %
  const effectiveP = (i, m) => (Math.pow(1 + i / 100, m) - 1) * 100;         // Zins i % pro Teilperiode → Jahreszins in %
  // Kontostand innerhalb eines Jahres: 1 CHF mit konformem Zins bzw. mit proportionalem Zins p/m
  function yearPath(K, p, m) {
    const ic = conformI(p, m) / 100, ip = p / 100 / m, a = [], b = [];
    for (let k = 0; k <= m; k++) { a.push(K * Math.pow(1 + ic, k)); b.push(K * Math.pow(1 + ip, k)); }
    return { conform: a, prop: b, ic: ic * 100, ip: ip * 100 };
  }

  // ── Marchzins, Schweizer Usanz (30/360) ──
  function lastDayFeb(d, m, y) { const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; return m === 2 && d === (leap ? 29 : 28); }
  function dayAdj(d, m, y) { return (d >= 30 || lastDayFeb(d, m, y)) ? 30 : d; }
  function daysBetween(d1, m1, d2, m2, y1, y2) {
    if (y1 === undefined) y1 = 2023; if (y2 === undefined) y2 = y1;
    return (y2 - y1) * 360 + (m2 - m1) * 30 + (dayAdj(d2, m2, y2) - dayAdj(d1, m1, y1));
  }
  const marchZins = (K, p, days) => days / 360 * (p * K / 100);
  // Tage im 30/360-Kalender: Bringtag (Start) zählt nicht, Holtag (Ende) zählt
  function marchDays(d1, m1, d2, m2) {
    let n = daysBetween(d1, m1, d2, m2, 2023, 2023);
    if (n < 0) n += 360;
    return n;
  }

  // ── Marchzins mit verschiedenen Konti: Saldo K0 am Jahresanfang und Bewegungen pay = [{d, m, a}] (a < 0: Bezug) ──
  // Jede Bewegung liegt auf einem eigenen Konto und trägt Zins bis zum Stichtag (dT, mT). Tagesnummer im 30/360-Jahr:
  // 0 = Jahresanfang (Saldovortrag vom 31.12.), 30 = Ende Januar, …, 360 = 31.12. Bewegungen nach dem Stichtag zählen nicht (late).
  const dayNo = (d, m) => (m - 1) * 30 + dayAdj(d, m, 2023);
  const dayMax = m => (m === 2 ? 28 : (m === 4 || m === 6 || m === 9 || m === 11) ? 30 : 31);
  function marchKonti(K0, pay, p, dT, mT) {
    const T = dayNo(dT, mT), rows = [];
    if (K0) rows.push({ a: K0, no: 0, start: true, i: -1 });
    (pay || []).forEach((z, i) => rows.push({ a: z.a, d: z.d, m: z.m, no: dayNo(z.d, z.m), i }));
    rows.forEach(r => { r.days = T - r.no; r.late = r.days < 0; r.z = r.late ? 0 : Math.round(marchZins(r.a, p, r.days) * 100 + (r.a < 0 ? -1e-7 : 1e-7)) / 100; });
    rows.sort((x, y) => x.no - y.no || x.i - y.i);
    const act = rows.filter(r => !r.late);
    return { T, rows, cap: act.reduce((q, r) => q + r.a, 0), zins: Math.round(act.reduce((q, r) => q + r.z, 0) * 100) / 100 };
  }

  return { THIN, fixed, money, num, pct, factor, rText, fv, pv, terms, valueAt, solveUnknown, rendite, laufzeit, verdopplung,
    sumLimits, geoSumDirect, geoSumFormula, rateSeries, rateFor, savingsFV, savingsSeries, savingsRate, annuityPV, annuityRate, loanSchedule,
    conformI, effectiveP, yearPath, dayAdj, daysBetween, marchZins, marchDays, dayNo, dayMax, marchKonti };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = { Fin };
