'use strict';
// Lädt die Lösungsweg-Engine (ohne Browser) in eine Node-VM.
// Die Projektdateien sind "plain global scripts" — sie werden hier in genau der Reihenfolge
// ausgeführt, die auch index.html verwendet.
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const FILES = ['14_mathinput.js', '16_calculus.js', '20_exact.js', '21_solver.js', '21b_equation.js', '22_steps.js', '22b_steps_asymptotes.js'];

function loadEngine() {
  const win = {};
  const noop = () => {};
  const el = () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, addEventListener: noop, appendChild: noop, setAttribute: noop, querySelector: () => null, querySelectorAll: () => [] });
  const ctx = {
    console, Math, BigInt, Number, String, Array, Object, JSON, Map, Set, Float64Array, Symbol, Promise,
    isFinite, isNaN, parseFloat, parseInt, RegExp, Error, TypeError, Date, setTimeout, clearTimeout,
    window: win, functions: [{ expr: '' }], params: {}, view: { xmin: -10, xmax: 10, ymin: -7, ymax: 7 },
    document: { getElementById: () => null, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], createElement: el, body: el() },
    localStorage: { getItem: () => null, setItem: noop }, navigator: {}
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8') + '\n;', ctx, { filename: f });
  const get = name => vm.runInContext(name, ctx);
  const eng = { ctx, EX: get('EX'), SV: get('SV'), ST: get('ST') };
  // Funktionsterm setzen (Index 0) → AST
  eng.setView = v => { Object.assign(ctx.view, v); };
  eng.setExpr = expr => { ctx.functions.length = 1; ctx.functions[0] = { expr }; };
  eng.ast = expr => { eng.setExpr(expr); return eng.ST.astOf(0); };
  // Lösungsweg zu einem Sonderpunkt → {doc, html, res, approx, blocks}
  eng.build = (expr, pt) => {
    eng.setExpr(expr);
    const d = eng.ST.buildFor(Object.assign({ fi: 0 }, pt));
    if (!d || !d.b.length) return null;
    const html = eng.ST.renderDoc(d);
    const resB = d.b.filter(b => b.k === 'res').pop();
    return { doc: d, html, res: resB ? resB.t : null, meta: d.meta || null, approx: JSON.stringify(d.b).indexOf('Näherung') >= 0 };
  };
  return eng;
}
module.exports = { loadEngine, ROOT };
