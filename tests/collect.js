#!/usr/bin/env node
'use strict';
// Sammelt Sonderpunkte (Nullstellen, Extrema, Pole …) aus der ECHTEN Anwendung und schreibt sie in cases.json.
// Wird nur gebraucht, wenn neue Testfunktionen hinzukommen. Voraussetzung: Playwright + Chromium
//   cd <Projektordner> && python3 -m http.server 8913 &
//   node tests/collect.js http://localhost:8913/index.html "x^2-4" "tan(x)" ...
//   node tests/collect.js http://localhost:8913/index.html -l tests/lists/basis.json
// Danach:  node tests/run.js --update
const fs = require('fs'), path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.error('Playwright nicht gefunden (npm i playwright).'); process.exit(2); }
const [url, ...rest] = process.argv.slice(2);
if (!url) { console.error('Aufruf: node tests/collect.js <URL der index.html> [-l liste.json] [Funktionen …]'); process.exit(2); }
let exprs = [];
for (let i = 0; i < rest.length; i++) { if (rest[i] === '-l') exprs = exprs.concat(JSON.parse(fs.readFileSync(rest[++i], 'utf8'))); else exprs.push(rest[i]); }
const file = path.join(__dirname, 'cases.json');
const store = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { view: null, cases: [] };

(async () => {
  const exe = process.env.CHROMIUM_PATH || undefined;
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const p = await (await b.newContext({ viewport: { width: 1300, height: 900 } })).newPage();
  await p.goto(url); await p.waitForTimeout(1500);
  store.view = await p.evaluate(() => ({ xmin: view.xmin, xmax: view.xmax, ymin: view.ymin, ymax: view.ymax }));
  for (const ex of exprs) {
    await p.evaluate(ex => { functions.length = 1; functions[0].expr = ex; renderFuncList(); scheduleComputeSpecials(); }, ex);
    await p.waitForTimeout(1200);
    let last = -1, stable = 0;
    for (let i = 0; i < 20 && stable < 3; i++) { const n = await p.evaluate(() => specials.length + ':' + functions[0].expr); if (n === last) stable++; else { stable = 0; last = n; } await p.waitForTimeout(350); }
    const pts = await p.evaluate(() => specials.filter(s => ['zero', 'yaxis', 'max', 'min', 'inf', 'pole', 'hole', 'asymp'].indexOf(s.kind) >= 0)
      .map(s => ({ kind: s.kind, x: s.x, y: s.y, dir: s.dir, oblique: s.oblique, slope: s.slope, intercept: s.intercept })));
    const i = store.cases.findIndex(c => c.expr === ex);
    if (i >= 0) store.cases[i] = { expr: ex, pts }; else store.cases.push({ expr: ex, pts });
    console.log(ex + '  [' + pts.length + ' Punkte]');
  }
  fs.writeFileSync(file, JSON.stringify(store, null, 1) + '\n');
  await b.close();
})();
