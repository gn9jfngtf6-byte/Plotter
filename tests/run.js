#!/usr/bin/env node
'use strict';
// Testläufer für die Lösungsweg-Engine.
//   node tests/run.js            alle Tests (Einzeltests + Fälle)
//   node tests/run.js --update   erwartete Ergebnisse (expected.json) neu schreiben
//   node tests/run.js -f tan     nur Fälle, deren Funktion "tan" enthält
// Es werden keine zusätzlichen Pakete benötigt (nur Node ≥ 16).
const fs = require('fs'), path = require('path');
const { loadEngine } = require('./engine.js');

const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const fIdx = args.indexOf('-f'), FILTER = fIdx >= 0 ? args[fIdx + 1] : null;
const QUIET = args.includes('-q');

// ── kleine Test-Hilfen ──
const T = (() => {
  let pass = 0, fail = 0; const fails = [];
  const rec = (ok, label, got, want) => { if (ok) pass++; else { fail++; fails.push({ label, got, want }); } };
  return {
    group: n => { if (!QUIET) console.log('\n' + n); },
    ok: (l, c) => rec(!!c, l, c, true),
    eq: (l, a, b) => rec(JSON.stringify(a) === JSON.stringify(b), l, a, b),
    near: (l, a, b, tol) => rec(Math.abs(a - b) <= tol, l, a, b),
    stats: () => ({ pass, fail, fails })
  };
})();

// ── 1) Einzeltests ──
require('./unit.js')(T);

// ── 2) Fälle: Funktion + Sonderpunkte → Lösungsweg ──
const casesFile = path.join(__dirname, 'cases.json'), expFile = path.join(__dirname, 'expected.json');
const cases = JSON.parse(fs.readFileSync(casesFile, 'utf8'));
const expected = fs.existsSync(expFile) ? JSON.parse(fs.readFileSync(expFile, 'utf8')) : {};
const result = {};
const eng = loadEngine();
eng.setView(cases.view || {});
const keyOf = (expr, p) => [expr, p.kind, (+p.x).toFixed(3), p.dir || ''].join('|');
const BAD = /NaN|undefined|Infinity|\[object|\$\$/;
let nCase = 0, nFallback = 0, nApprox = 0;

T.group('Fälle (' + cases.cases.length + ' Funktionen)');
for (const c of cases.cases) {
  if (FILTER && c.expr.indexOf(FILTER) < 0) continue;
  for (const p of c.pts) {
    nCase++;
    const key = keyOf(c.expr, p);
    let r = null, err = null;
    try { r = eng.build(c.expr, p); } catch (e) { err = e.message; }
    if (err) { T.ok(key + ' wirft keinen Fehler: ' + err, false); continue; }
    if (!r) { nFallback++; result[key] = { fallback: true }; }
    else {
      if (r.approx) nApprox++;
      result[key] = { res: r.res, approx: r.approx };
      T.ok(key + ' – keine NaN/undefined im Text', !BAD.test(r.html.replace(/<[^>]+>/g, ' ')));
      // Rechenweg muss zum numerisch gefundenen Punkt passen
      const m = r.meta;
      if (m) {
        const tolx = (p.kind === 'inf' ? 2e-3 : 1e-4) * (1 + Math.abs(p.x));
        if (m.x !== undefined && p.kind !== 'asymp') T.ok(key + ' – x passt (' + m.x + ' vs ' + p.x + ')', Math.abs(m.x - p.x) <= tolx);
        if (m.y !== undefined && p.kind !== 'pole' && p.kind !== 'asymp') T.ok(key + ' – y passt', Math.abs(m.y - p.y) <= 2e-3 * (1 + Math.abs(p.y)));
        if (p.kind === 'asymp' && !p.oblique && m.y !== undefined) T.ok(key + ' – Asymptote y passt', Math.abs(m.y - p.y) <= 1e-4 * (1 + Math.abs(p.y)));
        if (p.kind === 'asymp' && p.oblique && m.slope !== undefined) T.ok(key + ' – schräge Asymptote passt', Math.abs(m.slope - p.slope) < 1e-4 && Math.abs(m.icpt - p.intercept) < 1e-4);
      }
    }
    if (!UPDATE && !FILTER) {
      const ex = expected[key];
      if (!ex) T.ok(key + ' – neu (in expected.json fehlt der Eintrag; --update ausführen)', false);
      else T.eq(key + ' – Ergebnis unverändert', result[key], ex);
    }
  }
}
if (UPDATE && !FILTER) { fs.writeFileSync(expFile, JSON.stringify(result, null, 1) + '\n'); console.log('expected.json geschrieben (' + Object.keys(result).length + ' Einträge)'); }

// ── Auswertung ──
const st = T.stats();
st.fails.slice(0, 40).forEach(f => console.log('  ✗ ' + f.label + '\n      erhalten: ' + JSON.stringify(f.got) + '\n      erwartet: ' + JSON.stringify(f.want)));
if (st.fails.length > 40) console.log('  … und ' + (st.fails.length - 40) + ' weitere');
console.log('\n' + st.pass + ' Prüfungen bestanden, ' + st.fail + ' fehlgeschlagen — ' + nCase + ' Lösungswege (' + nFallback + ' Rückfall auf die alte Variante, ' + nApprox + ' mit Näherung)');
process.exit(st.fail ? 1 : 0);
