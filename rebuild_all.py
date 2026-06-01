#!/usr/bin/env python3
"""rebuild_all.py — Alle Patches in einem Schritt. In outputs/ gespeichert (bleibt erhalten)."""
import sys, os, subprocess

UP  = '/sessions/laughing-zealous-archimedes/mnt/uploads'
OUT = '/sessions/laughing-zealous-archimedes/mnt/outputs'

def read_up(n):
    with open(f'{UP}/{n}', 'r', encoding='utf-8') as f: return f.read()
def write_out(n, s):
    with open(f'{OUT}/{n}', 'w', encoding='utf-8') as f: f.write(s)
def patch(name, src, ops):
    for i,(old,new) in enumerate(ops):
        if old not in src:
            print(f'  FEHLER {name} op#{i}: nicht gefunden:\n  {repr(old[:120])}')
            sys.exit(1)
        src = src.replace(old, new, 1)
    return src

# ════════════════════════════════════════════════════════════════════
# 03_math.js  —  unary-minus fix  +  implicit mult
# ════════════════════════════════════════════════════════════════════
src = read_up('03_math.js')
src = patch('03_math.js', src, [
  # implicit multiplication helper wired into getEvalFn
  (
    'function getEvalFn(expr, pNames) {',
    r'''function insertImplicitMult(expr) {
  let r = expr;
  r = r.replace(/(\d)([a-zA-Z])/g, '$1*$2');
  r = r.replace(/(?<![a-zA-Z0-9_])(\d)\(/g, '$1*(');
  r = r.replace(/\)\(/g, ')*(');
  r = r.replace(/\)([a-zA-Z])/g, ')*$1');
  return r;
}

function getEvalFn(expr, pNames) {
  expr = insertImplicitMult(expr);'''
  ),
])
write_out('03_math.js', src)
print('OK  03_math.js')

# ════════════════════════════════════════════════════════════════════
# 04_analysis.js  —  simplifyRadical + exact zeros + Vieta + trig
# ════════════════════════════════════════════════════════════════════
src = read_up('04_analysis.js')

# ── A: Helper-Funktionen vor computeSpecials ────────────────────────
src = patch('04_analysis.js A', src, [(
  'function computeSpecials() {',
  r'''// GCD (ganzzahlig)
function gcdInt(a, b) { a=Math.abs(Math.round(a)); b=Math.abs(Math.round(b)); while(b){const t=b;b=a%b;a=t;} return a||1; }

// Zerlegt D in p²·q (q quadratfrei): gibt {coef:p, radicand:q} zurück
function simplifyRadical(D) {
  if (D <= 0) return null;
  let p = 1, q = Math.round(D);
  for (let k = 2; k * k <= q; k++) {
    while (q % (k*k) === 0) { q = q/(k*k); p *= k; }
  }
  return { coef: p, radicand: q };
}

// Bruch als Text: 3/2 → "3/2", 2/1 → "2"
function fmtExact(num, den) {
  den = den || 1;
  const g = gcdInt(Math.abs(num), Math.abs(den));
  const n = Math.round(num/g), d = Math.round(den/g);
  if (d === 1) return String(n);
  if (d < 0) return `${-n}/${-d}`;
  return `${n}/${d}`;
}

// Versucht analytische Nullstellen für Polynom-Ausdrücke (Scheitelpunkt + Standard)
function tryAnalyticalZerosEx(fi_idx, expr) {
  const a2 = deriv2(expr, 0);
  if (!isFinite(a2) || Math.abs(a2) < 1e-6) return [];

  const a = a2 / 2, b = deriv1(expr, 0), c = safeEval(expr, 0);
  if (!isFinite(a) || !isFinite(b) || !isFinite(c)) return [];
  const check = safeEval(expr, 1);
  if (!isFinite(check) || Math.abs(a + b + c - check) > 0.05) return [];

  const D = b*b - 4*a*c;
  if (D < -1e-8) return [];

  const col = functions[fi_idx] ? functions[fi_idx].color : '#000';

  // Scheitelpunktform erkennen: a*(x+h)^2 + k
  const vPm = expr.match(/^(-?[\d.]+)?\*?\(x([+-][\d.]+)?\)\^2([+-][\d.]+)?$/);
  if (vPm) {
    const aV = parseFloat(vPm[1] || '1');
    const hV = vPm[2] ? -parseFloat(vPm[2]) : 0;
    const kV = vPm[3] ? parseFloat(vPm[3]) : 0;
    if (Math.abs(aV) < 1e-9) return [];
    const innerD = -kV / aV;
    if (innerD < -1e-9) return [];
    if (Math.abs(innerD) < 1e-9) {
      const z = { kind:'zero', fi:fi_idx, x:hV, y:0, col };
      z.exactLabel = `(${fmtExact(Math.round(hV*1000),1000)} | 0)`;
      return [z];
    }
    const sr = simplifyRadical(innerD);
    const sqStr = sr && sr.radicand > 1
      ? (sr.coef > 1 ? `${sr.coef}√${sr.radicand}` : `√${sr.radicand}`)
      : `√${parseFloat(innerD.toFixed(6))}`;
    const numStr = (v) => {
      const g = gcdInt(Math.abs(Math.round(hV*1000)), 1000);
      const n = Math.round(hV*1000/g), d = Math.round(1000/g);
      return d === 1 ? String(n) : `${n}/${d}`;
    };
    const x1 = hV - Math.sqrt(innerD), x2 = hV + Math.sqrt(innerD);
    const hStr = Math.abs(hV) < 1e-9 ? '' : (hV < 0 ? `${fmtExact(Math.round(hV*1000),1000)} - ` : `${fmtExact(Math.round(hV*1000),1000)} + `);
    const hStrMinus = Math.abs(hV) < 1e-9 ? `-` : `${fmtExact(Math.round(hV*1000),1000)} - `;
    const z1 = { kind:'zero', fi:fi_idx, x:x1, y:0, col };
    const z2 = { kind:'zero', fi:fi_idx, x:x2, y:0, col };
    z1.exactLabel = `(${hStrMinus}${sqStr} | 0)`;
    z2.exactLabel = `(${hStr}${sqStr} | 0)`;
    return [z1, z2];
  }

  // Mitternachtsformel mit vereinfachter Wurzel
  if (Math.abs(D) < 1e-9) {
    const x0 = -b/(2*a);
    const z = { kind:'zero', fi:fi_idx, x:x0, y:0, col };
    z.exactLabel = `(${fmtExact(Math.round(-b*1000), Math.round(2*a*1000))} | 0)`;
    return [z];
  }
  const DI = Math.round(D * 1e6) / 1e6;
  const sr = simplifyRadical(Math.round(DI));
  if (!sr) return [];
  const aI = Math.round(a * 1e6) / 1e6;
  const bI = Math.round(b * 1e6) / 1e6;
  const den = 2 * aI;
  const sqStr = sr.radicand > 1
    ? (sr.coef > 1 ? `${sr.coef}√${sr.radicand}` : `√${sr.radicand}`)
    : String(sr.coef);
  const x1 = (-bI + Math.sqrt(DI)) / den, x2 = (-bI - Math.sqrt(DI)) / den;
  const z1 = { kind:'zero', fi:fi_idx, x:x1, y:0, col };
  const z2 = { kind:'zero', fi:fi_idx, x:x2, y:0, col };
  const nbStr = fmtExact(Math.round(-bI*100), Math.round(den*100));
  const sqFrac = (() => {
    const g = gcdInt(sr.coef, Math.abs(Math.round(den*100/100)));
    const dAbs = Math.abs(den); const sign = den < 0 ? '-' : '';
    if (Math.abs(dAbs - 1) < 1e-6) return `${sign}${sqStr}`;
    return `${sign}${sr.coef > 1 ? sr.coef+'√'+sr.radicand : '√'+sr.radicand}/${Math.round(dAbs*100)/100}`;
  })();
  const nbFmt = fmtExact(Math.round(-bI * 1e4), Math.round(den * 1e4));
  z1.exactLabel = `(${nbFmt} + ${sqFrac} | 0)`;
  z2.exactLabel = `(${nbFmt} - ${sqFrac} | 0)`;
  return [z1, z2];
}

function computeSpecials() {'''
)])

# ── B: In computeSpecials: analytische Nullstellen eintragen ────────
src = patch('04_analysis.js B', src, [(
  '    // ── y-Achsen-Schnittpunkt: f(0) wenn 0 im Sichtbereich ───────',
  '''    // ── Analytische Nullstellen (exakte Darstellung) ─────────────
    const _anaZeros = tryAnalyticalZerosEx(fi_idx, fi.expr);
    if (_anaZeros.length > 0) {
      const tol2 = 0.05;
      _anaZeros.forEach(az => {
        // Ersetze numerische Nullstelle durch analytische wenn nahe genug
        const existing = specials.findIndex(p => p.kind==='zero' && p.fi===fi_idx && Math.abs(p.x-az.x)<tol2);
        if (existing >= 0) specials[existing] = az;
        else if (!specials.some(p=>p.kind==='zero'&&p.fi===fi_idx&&Math.abs(p.x-az.x)<tol)) specials.push(az);
      });
    }

    // ── y-Achsen-Schnittpunkt: f(0) wenn 0 im Sichtbereich ───────'''
)])

# ── C: renderSpecialList: exactLabel berücksichtigen ────────────────
src = patch('04_analysis.js C', src, [(
  '    if (grp.length < 2) { grp.forEach(pt => addSPRow(el, pt, niceCoord(pt.x, pt.y))); return; }\n'
  '    const per = detectPeriod(grp.map(p => p.x));\n'
  '    if (!per) { grp.forEach(pt => addSPRow(el, pt, niceCoord(pt.x, pt.y))); return; }',

  '    if (grp.length < 2) { grp.forEach(pt => addSPRow(el, pt, pt.exactLabel || niceCoord(pt.x, pt.y))); return; }\n'
  '    if (grp.some(pt => pt.exactLabel)) { grp.forEach(pt => addSPRow(el, pt, pt.exactLabel || niceCoord(pt.x, pt.y))); return; }\n'
  '    const per = detectPeriod(grp.map(p => p.x));\n'
  '    if (!per) { grp.forEach(pt => addSPRow(el, pt, pt.exactLabel || niceCoord(pt.x, pt.y))); return; }'
)])

# ── D: addSPRow: exactLabel im Klick-Handler ────────────────────────
src = patch('04_analysis.js D', src, [(
  "    lbl.textContent = (pt.kind === 'isect' ? `f${pt.fi+1}∩f${pt.fj+1} ` : `f${pt.fi+1} `) + label;",
  "    lbl.innerHTML  = (pt.kind === 'isect' ? `f${pt.fi+1}∩f${pt.fj+1} ` : `f${pt.fi+1} `) + label;"
)])

# ── E: getLinCoeffs fix (false positive für sin(x)) ─────────────────
src = patch('04_analysis.js E', src, [(
  '  function getLinCoeffs() {\n'
  '    const a = deriv1(expr, 0), b = safeEval(expr, 0);\n'
  '    if (!isFinite(a) || !isFinite(b)) return null;\n'
  '    if (Math.abs(deriv2(expr, 0)) > 0.01) return null;\n'
  '    return { a: parseFloat(a.toFixed(6)), b: parseFloat(b.toFixed(6)) };\n'
  '  }',
  '  function getLinCoeffs() {\n'
  '    const a = deriv1(expr, 0), b = safeEval(expr, 0);\n'
  '    if (!isFinite(a) || !isFinite(b)) return null;\n'
  '    if (Math.abs(deriv2(expr, 0)) > 0.01) return null;\n'
  '    // Verifikation bei x=1 und x=2 (verhindert sin(x)-Fehlklassifikation)\n'
  '    const _c1 = safeEval(expr,1), _c2 = safeEval(expr,2);\n'
  '    if (isFinite(_c1) && Math.abs(a+b-_c1) > 0.05*Math.max(1,Math.abs(_c1))) return null;\n'
  '    if (isFinite(_c2) && Math.abs(2*a+b-_c2) > 0.05*Math.max(1,Math.abs(_c2))) return null;\n'
  '    return { a: parseFloat(a.toFixed(6)), b: parseFloat(b.toFixed(6)) };\n'
  '  }'
)])

# ── F: Mitternachtsformel — symbolische Wurzel im Lösungsweg ─────────
src = patch('04_analysis.js F', src, [(
  '        const sqD = Math.sqrt(D);\n'
  '        const x1 = (-b + sqD) / (2*a), x2 = (-b - sqD) / (2*a);\n'
  '        const isNiceRoot = (x) => Math.abs(x*100 - Math.round(x*100)) < 0.5 && Math.abs(x) <= 20;\n'
  '        if (isNiceRoot(x1) && isNiceRoot(x2)) {\n'
  '          steps += `<u>${t(\'solve_factor\')}:</u>\\n`;\n'
  '          steps += `x₁ = <b>${rr(x1)}</b>,  x₂ = <b>${rr(x2)}</b>\\n\\n`;\n'
  '          steps += `f(x) = ${rr(a)}·(x − ${rr(x1)})(x − ${rr(x2)})\\n\\n`;\n'
  '          steps += `<u>Probe:</u>\\n`;\n'
  '          steps += `  f(${rr(x1)}) = ${rr(safeEval(expr, x1))} ✓\\n`;\n'
  '          steps += `  f(${rr(x2)}) = ${rr(safeEval(expr, x2))} ✓`;\n'
  '        } else {\n'
  '          steps += `${t(\'solve_midnight\')}: x = (−b ± √D) / (2a)\\n\\n`;\n'
  '          steps += `  x = (−(${rr(b)}) ± √${rr(D)}) / (2·${rr(a)})\\n`;\n'
  '          steps += `  x = (${rr(-b)} ± ${rr(sqD)}) / ${rr(2*a)}\\n\\n`;\n'
  '          steps += `  x₁ = (${rr(-b)} + ${rr(sqD)}) / ${rr(2*a)} = <b>${rr(x1)}</b>\\n`;\n'
  '          steps += `  x₂ = (${rr(-b)} − ${rr(sqD)}) / ${rr(2*a)} = <b>${rr(x2)}</b>`;\n'
  '        }',

  '        const sqD = Math.sqrt(D);\n'
  '        const x1 = (-b + sqD) / (2*a), x2 = (-b - sqD) / (2*a);\n'
  '        const DI2 = Math.round(D); const srM = simplifyRadical(DI2);\n'
  '        const sqStr2 = srM && srM.radicand > 1\n'
  '          ? (srM.coef>1 ? `${srM.coef}√${srM.radicand}` : `√${srM.radicand}`)\n'
  '          : `√${rr(D)}`;\n'
  '        // Vieta: ganzzahlige oder einfache Wurzeln\n'
  '        const _xSr = rr(Math.min(x1,x2)), _xLr = rr(Math.max(x1,x2));\n'
  '        const _aF = Math.abs(a-1)<1e-5 ? "" : (Math.abs(a+1)<1e-5 ? "-" : rr(a)+"·");\n'
  '        const _fp1 = `(x${-Math.min(x1,x2)<0?" + "+rr(Math.abs(Math.min(x1,x2))):" − "+rr(Math.abs(Math.min(x1,x2)))})`;\n'
  '        const _fp2 = `(x${-Math.max(x1,x2)<0?" + "+rr(Math.abs(Math.max(x1,x2))):" − "+rr(Math.abs(Math.max(x1,x2)))})`;\n'
  '        const isInt = v => Math.abs(v - Math.round(v)) < 0.01;\n'
  '        if (isInt(x1) && isInt(x2)) {\n'
  '          steps += `<u>Faktorisierung (Vieta):</u>\\n\\n`;\n'
  '          steps += `  Gesucht: x₁, x₂  mit\\n`;\n'
  '          steps += `  x₁ + x₂ = ${rr(-b/a)}  und  x₁ · x₂ = ${rr(c/a)}\\n\\n`;\n'
  '          steps += `  → x₁ = ${_xSr},   x₂ = ${_xLr}\\n\\n`;\n'
  '          steps += `  f(x) = ${_aF}${_fp1}·${_fp2}\\n\\n`;\n'
  '          steps += `  Nullstellen: x₁ = <b>${_xSr}</b>,   x₂ = <b>${_xLr}</b>`;\n'
  '        } else {\n'
  '          steps += `${t(\'solve_midnight\')}: x = (−b ± √D) / (2a)\\n\\n`;\n'
  '          steps += `  x = (−(${rr(b)}) ± √${rr(D)}) / (2·${rr(a)})\\n`;\n'
  '          steps += `  D = ${rr(D)}  →  √D = ${sqStr2}\\n\\n`;\n'
  '          steps += `  x₁ = (${rr(-b)} + ${sqStr2}) / ${rr(2*a)}\\n`;\n'
  '          steps += `  x₂ = (${rr(-b)} − ${sqStr2}) / ${rr(2*a)}\\n\\n`;\n'
  '          steps += `  x₁ = <b>${rr(x1)}</b>,  x₂ = <b>${rr(x2)}</b>`;\n'
  '        }'
)])

# ── G: Fallback "Numerisch" → "keine analytische Lösung" ────────────
src = patch('04_analysis.js G', src, [(
  "        steps += `f(x) = 0\\nNumerisch: x ≈ <b>${r(pt.x, 3)}</b>`;",
  "        steps += `f(x) = 0\\n→ Keine analytische Lösung verfügbar.`;"
)])

write_out('04_analysis.js', src)
print('OK  04_analysis.js')

# ════════════════════════════════════════════════════════════════════
# 07_export.js  —  LaTeX-Einstellungen (scale, font, tick, bounds)
# ════════════════════════════════════════════════════════════════════
src = read_up('07_export.js')

# Finde generateLatex-Funktion und füge _ltxV/Bound-Overrides ein
src = patch('07_export.js C1', src, [(
  'function generateLatex() {\n'
  '  const v = isoView || view;\n'
  '  // Grenzen auf ganze Zahlen runden\n'
  '  const xminF = roundViewBound(v.xmin), xmaxF = roundViewBound(v.xmax);\n'
  '  const yminF = roundViewBound(v.ymin), ymaxF = roundViewBound(v.ymax);\n'
  '  const xRange = xmaxF - xminF, yRange = ymaxF - yminF;',

  'function generateLatex() {\n'
  '  const v = isoView || view;\n'
  '  const _ltxV = id => { const el=document.getElementById(id); return el&&el.value.trim()!==\'\'?parseFloat(el.value):null; };\n'
  '  const _ltxS = id => { const el=document.getElementById(id); return el?el.value:null; };\n'
  '  const xminF = _ltxV(\'ltx-xmin\') ?? roundViewBound(v.xmin);\n'
  '  const xmaxF = _ltxV(\'ltx-xmax\') ?? roundViewBound(v.xmax);\n'
  '  const yminF = _ltxV(\'ltx-ymin\') ?? roundViewBound(v.ymin);\n'
  '  const ymaxF = _ltxV(\'ltx-ymax\') ?? roundViewBound(v.ymax);\n'
  '  const xRange = xmaxF - xminF, yRange = ymaxF - yminF;'
)])

src = patch('07_export.js C2', src, [(
  '  const xGS = gridStep(xRange), yGS = gridStep(yRange);',
  '  const _xts = _ltxV(\'ltx-xtickstep\'), _yts = _ltxV(\'ltx-ytickstep\');\n'
  '  const xGS = (_xts && _xts > 0) ? _xts : gridStep(xRange);\n'
  '  const yGS = (_yts && _yts > 0) ? _yts : gridStep(yRange);'
)])

src = patch('07_export.js C3', src, [(
  "  axisLines.push('  xticklabel style={font=\\\\tiny},');\n"
  "  axisLines.push('  yticklabel style={font=\\\\tiny},');\n"
  "  axisLines.push(`  x=${xCm}cm, y=${yCm}cm,`);",

  "  const _ltxFont = _ltxS('ltx-tickfont') || '\\\\footnotesize';\n"
  "  const _ltxScale = (_ltxV('ltx-scale') ?? 1.0);\n"
  "  const _xCmS = (parseFloat(xCm)*_ltxScale).toFixed(2);\n"
  "  const _yCmS = (parseFloat(yCm)*_ltxScale).toFixed(2);\n"
  "  axisLines.push(`  xticklabel style={font=${_ltxFont}},`);\n"
  "  axisLines.push(`  yticklabel style={font=${_ltxFont}},`);\n"
  "  axisLines.push(`  x=${_xCmS}cm, y=${_yCmS}cm,`);"
)])

src = src.replace("'\\\\begin{tikzpicture}[scale=1.1]',", "'\\\\begin{tikzpicture}',", 1)

write_out('07_export.js', src)
print('OK  07_export.js')

# ════════════════════════════════════════════════════════════════════
# 08_draw.js  —  exactLabel + oblique/horiz improvements + x=N + dashed
# ════════════════════════════════════════════════════════════════════
src = read_up('08_draw.js')

# ── a: exactLabel in drawLabel (Spezielle Punkte im Canvas) ──────────
src = patch('08_draw.js a', src, [(
  "        drawLabel(ctx, niceCoord(pt.x, pt.y), cx, cy, C.anno, 'r');",
  "        drawLabel(ctx, pt.exactLabel || niceCoord(pt.x, pt.y), cx, cy, C.anno, 'r');"
)])

# ── b: horizontale Asymptote — Bruch-Format + _val ───────────────────
src = patch('08_draw.js b', src, [(
  "      if (typeof window._asymLines !== 'undefined')\n"
  "        window._asymLines.push({ type: 'horizontal', expr: String(parseFloat(haVal.toFixed(6))), label: haLbl, color: fn.color });",

  "      function _fmtHa(v) {\n"
  "        if (Math.abs(v) < 1e-9) return '0';\n"
  "        if (Number.isInteger(v)) return String(v);\n"
  "        for (let d=1;d<=24;d++){const n=Math.round(v*d);\n"
  "          if(n!==0&&Math.abs(n/d-v)<1e-5)return d===1?String(n):n+'/'+d;}\n"
  "        return String(parseFloat(v.toFixed(4))); }\n"
  "      const haExpr = _fmtHa(haVal);\n"
  "      if (typeof window._asymLines !== 'undefined')\n"
  "        window._asymLines.push({ type: 'horizontal', expr: haExpr, label: haLbl, color: fn.color, _val: haVal });"
)])

# ── c: oblique — lineare Funktion überspringen ───────────────────────
src = patch('08_draw.js c', src, [(
  "      if (!isFinite(fXt) || Math.abs(fXt - predicted) > 1e-3 * Math.abs(dir * Xt)) continue;\n"
  "      const slopeR = parseFloat(slope.toFixed(6)), intR = parseFloat(intercept.toFixed(4));",

  "      if (!isFinite(fXt) || Math.abs(fXt - predicted) > 1e-3 * Math.abs(dir * Xt)) continue;\n"
  "      // Lineare Funktion hat keine schiefe Asymptote\n"
  "      const _fLin1 = safeEval(fn.expr,1), _fLin2 = safeEval(fn.expr,2);\n"
  "      if (isFinite(_fLin1)&&isFinite(_fLin2)&&\n"
  "          Math.abs(_fLin1-(slope*1+intercept))<1e-4*(Math.abs(_fLin1)+1)&&\n"
  "          Math.abs(_fLin2-(slope*2+intercept))<1e-4*(Math.abs(_fLin2)+1)) continue;\n"
  "      const slopeR = parseFloat(slope.toFixed(6)), intR = parseFloat(intercept.toFixed(4));"
)])

# ── c2: oblique oaExpr — Bruch-Format ───────────────────────────────
src = patch('08_draw.js c2', src, [(
  "      const oaExpr = String(parseFloat(slope.toFixed(6))) + '*x' +\n"
  "                     (Math.abs(intR) < 1e-4 ? '' : (intR >= 0 ? '+' : '') + parseFloat(intR.toFixed(6)));",

  "      function _sE(s){if(Math.abs(s-1)<1e-5)return 'x';if(Math.abs(s+1)<1e-5)return '-x';\n"
  "        for(let d=1;d<=24;d++){const n=Math.round(s*d);if(n!==0&&Math.abs(n/d-s)<1e-5){\n"
  "          if(d===1)return n+'*x';const ns=Math.abs(n)===1?(n<0?'-':''):''+n+'*';return ns+'x/'+d;}}\n"
  "        return parseFloat(s.toFixed(6))+'*x';}\n"
  "      function _fE(v){if(Math.abs(v)<1e-6)return '0';\n"
  "        for(let d=1;d<=24;d++){const n=Math.round(v*d);if(n!==0&&Math.abs(n/d-v)<1e-5)return d===1?String(n):n+'/'+d;}\n"
  "        return String(parseFloat(v.toFixed(4)));}\n"
  "      const _iE=Math.abs(intR)<1e-4?'':(intR>=0?'+':'')+_fE(intR);\n"
  "      const oaExpr=_sE(slope)+_iE;"
)])

# ── e: x=N vertikale Linie + fn.dashed im Haupt-Zeichenloop ─────────
src = patch('08_draw.js e', src, [(
  '  functions.forEach(fn => {\n'
  '    if (!fn.expr.trim() || fn.visible === false) return;\n'
  '    ctx.strokeStyle = fn.color; ctx.lineWidth = 2.5; ctx.setLineDash([]);\n'
  '    ctx.beginPath();\n'
  '    let started = false, prevY = null;',

  '  functions.forEach(fn => {\n'
  '    if (!fn.expr.trim() || fn.visible === false) return;\n'
  '    // x=N: vertikale gestrichelte Linie\n'
  '    const _vm = fn.expr.trim().match(/^x\\s*=\\s*(-?[\\d.]+(?:\\/[\\d.]+)?)$/);\n'
  '    if (_vm) {\n'
  '      const _p = _vm[1].split(\'/\');\n'
  '      const _xv = _p.length===2 ? parseFloat(_p[0])/parseFloat(_p[1]) : parseFloat(_p[0]);\n'
  '      if (isFinite(_xv)) {\n'
  '        const {cx:_vcx} = toCanvas(_xv, 0);\n'
  '        ctx.save();\n'
  '        ctx.strokeStyle=fn.color; ctx.lineWidth=1.8; ctx.setLineDash([6,4]);\n'
  '        ctx.beginPath(); ctx.moveTo(_vcx,0); ctx.lineTo(_vcx,h); ctx.stroke();\n'
  "        ctx.font='11px system-ui'; ctx.fillStyle=fn.color+'dd';\n"
  "        ctx.textAlign='left'; ctx.textBaseline='top';\n"
  "        ctx.fillText('x = '+_vm[1], _vcx+4, 6);\n"
  '        ctx.restore();\n'
  '      }\n'
  '      return;\n'
  '    }\n'
  '    ctx.strokeStyle = fn.color;\n'
  '    ctx.lineWidth = fn.dashed ? 1.8 : 2.5;\n'
  '    ctx.setLineDash(fn.dashed ? [6,4] : []);\n'
  '    ctx.beginPath();\n'
  '    let started = false, prevY = null;'
)])

# ── f: setLineDash reset nach dashed-Stroke ──────────────────────────
src = patch('08_draw.js f', src, [(
  '      prevY = y;\n    }\n    ctx.stroke();\n  });\n\n  // ── 8. Steigungsdreieck',
  '      prevY = y;\n    }\n    ctx.stroke();\n    if (fn.dashed) ctx.setLineDash([]);\n  });\n\n  // ── 8. Steigungsdreieck'
)])

# ── g: drawFuncLabels: x=N überspringen ──────────────────────────────
src = patch('08_draw.js g', src, [(
  '    if (!fn.expr.trim() || fn.visible === false) return;\n\n    // Beste Position finden',
  '    if (!fn.expr.trim() || fn.visible === false) return;\n'
  '    if (/^x\\s*=/.test(fn.expr.trim())) return;\n\n    // Beste Position finden'
)])

write_out('08_draw.js', src)
print('OK  08_draw.js')

# ════════════════════════════════════════════════════════════════════
# index.html  —  LaTeX-Panel + updateAsymPills (setTimeout) + addFunctionExpr (opts)
# ════════════════════════════════════════════════════════════════════
src = read_up('index.html')

# ── iv: LaTeX-Einstellungen kompaktes Grid vor <textarea id="latex-out" ──
LTX_ANCHOR = '<textarea id="latex-out"'
LTX_INSERT = (
  '    <div style="font-size:10px;color:#6b7280;margin:4px 0 2px 0;">LaTeX-Achseneinstellungen:</div>\n'
  '    <div style="display:grid;grid-template-columns:auto 1fr auto 1fr;gap:3px 5px;align-items:center;font-size:10px;margin-bottom:3px;">\n'
  '      <label style="white-space:nowrap">Schrift:</label>\n'
  '      <select id="ltx-tickfont" style="font-size:10px;padding:1px 2px;grid-column:2/5;">\n'
  '        <option value="\\tiny">\\tiny</option>\n'
  '        <option value="\\scriptsize">\\scriptsize</option>\n'
  '        <option value="\\footnotesize" selected>\\footnotesize</option>\n'
  '        <option value="\\small">\\small</option>\n'
  '        <option value="\\normalsize">\\normalsize</option>\n'
  '      </select>\n'
  '      <label style="white-space:nowrap">Tick x:</label><input type="number" id="ltx-xtickstep" value="1" min="0.1" step="0.5" autocomplete="off" style="width:100%;font-size:10px;padding:1px 3px;">\n'
  '      <label style="white-space:nowrap">Tick y:</label><input type="number" id="ltx-ytickstep" value="1" min="0.1" step="0.5" autocomplete="off" style="width:100%;font-size:10px;padding:1px 3px;">\n'
  '      <label style="white-space:nowrap">Scale:</label><input type="number" id="ltx-scale" value="1" min="0.1" step="0.1" autocomplete="off" style="width:100%;font-size:10px;padding:1px 3px;grid-column:2/5;">\n'
  '      <label style="white-space:nowrap">x_min:</label><input type="number" id="ltx-xmin" placeholder="auto" autocomplete="off" style="width:100%;font-size:10px;padding:1px 3px;">\n'
  '      <label style="white-space:nowrap">x_max:</label><input type="number" id="ltx-xmax" placeholder="auto" autocomplete="off" style="width:100%;font-size:10px;padding:1px 3px;">\n'
  '      <label style="white-space:nowrap">y_min:</label><input type="number" id="ltx-ymin" placeholder="auto" autocomplete="off" style="width:100%;font-size:10px;padding:1px 3px;">\n'
  '      <label style="white-space:nowrap">y_max:</label><input type="number" id="ltx-ymax" placeholder="auto" autocomplete="off" style="width:100%;font-size:10px;padding:1px 3px;">\n'
  '    </div>\n'
)
assert LTX_ANCHOR in src, 'FEHLER: latex-out textarea nicht gefunden'
src = src.replace(LTX_ANCHOR, LTX_INSERT + LTX_ANCHOR, 1)

# ── v: updateAsymPills + addFunctionExpr ersetzen (setTimeout + dashed + opts) ──
OLD_SCRIPT = (
  'function updateAsymPills() {\n'
  '  const container = document.getElementById(\'asym-pills\');\n'
  '  if (!container) return;\n'
  '  container.innerHTML = \'\';\n'
  '  const lines = window._asymLines || [];\n'
  '  const seen = new Set();\n'
  '  lines.forEach(a => {\n'
  '    if (!a.expr || a.type === \'vertical\') return;\n'
  '    if (seen.has(a.expr)) return;\n'
  '    seen.add(a.expr);\n'
  '    const pill = document.createElement(\'span\');\n'
  '    pill.title = \'Als Funktion hinzufügen\';\n'
  "    pill.style.cssText = 'cursor:pointer;background:' + a.color + '22;border:1px solid ' + a.color + '88;border-radius:10px;padding:1px 8px;font-size:11px;color:' + a.color + ';white-space:nowrap;';\n"
  '    pill.textContent = a.label;\n'
  '    pill.onclick = () => addFunctionExpr(a.expr);\n'
  '    container.appendChild(pill);\n'
  '  });\n'
  '}\n'
  'function addFunctionExpr(expr) {\n'
  '  if (typeof functions === \'undefined\' || typeof renderFuncList === \'undefined\') return;\n'
  "  const colors = ['#e24b4a','#378ADD','#1D9E75','#D85A30','#8B5CF6','#EC4899'];\n"
  '  const col = colors[functions.length % colors.length];\n'
  '  functions.push({ expr: expr, color: col, visible: true });\n'
  '  renderFuncList();\n'
  '  if (typeof scheduleComputeSpecials === \'function\') scheduleComputeSpecials();\n'
  '  if (typeof scheduleDraw === \'function\') scheduleDraw();\n'
  '}\n'
  'document.addEventListener(\'DOMContentLoaded\', () => {\n'
  '  const main = document.getElementById(\'chk-asymptotes\');\n'
  '  const kbd  = document.getElementById(\'kbd-asym-chk\');\n'
  '  if (main && kbd) kbd.checked = main.checked;\n'
  '});\n'
)
NEW_SCRIPT = (
  'function updateAsymPills() {\n'
  '  const container = document.getElementById(\'asym-pills\');\n'
  '  if (!container) return;\n'
  '  container.innerHTML = \'\';\n'
  '  const lines = window._asymLines || [];\n'
  '  const seen = new Set();\n'
  '  const chkOn = document.getElementById(\'chk-asymptotes\')?.checked;\n'
  '  lines.forEach(a => {\n'
  '    if (!a.expr) return;\n'
  '    if (seen.has(a.expr)) return;\n'
  '    seen.add(a.expr);\n'
  '    if (chkOn) {\n'
  "      const _n = e => e.replace(/[\\s*]/g,'');\n"
  '      const _already = typeof functions !== \'undefined\' &&\n'
  '        functions.some(f => _n(f.expr) === _n(a.expr));\n'
  '      if (!_already) setTimeout(() => addFunctionExpr(a.expr, {dashed:true}), 0);\n'
  '    }\n'
  '    const pill = document.createElement(\'span\');\n'
  '    pill.title = \'Als Funktion hinzufügen\';\n'
  "    pill.style.cssText = 'cursor:pointer;background:' + a.color + '22;border:1px solid ' + a.color + '88;border-radius:10px;padding:1px 8px;font-size:11px;color:' + a.color + ';white-space:nowrap;';\n"
  '    pill.textContent = a.label;\n'
  '    pill.onclick = () => addFunctionExpr(a.expr);\n'
  '    container.appendChild(pill);\n'
  '  });\n'
  '}\n'
  'function addFunctionExpr(expr, opts) {\n'
  '  if (typeof functions === \'undefined\' || typeof renderFuncList === \'undefined\') return;\n'
  "  const colors = ['#e24b4a','#378ADD','#1D9E75','#D85A30','#8B5CF6','#EC4899'];\n"
  '  const col = colors[functions.length % colors.length];\n'
  '  functions.push(Object.assign({expr:expr, color:col, visible:true}, opts||{}));\n'
  '  renderFuncList();\n'
  '  if (typeof scheduleComputeSpecials === \'function\') scheduleComputeSpecials();\n'
  '  if (typeof scheduleDraw === \'function\') scheduleDraw();\n'
  '}\n'
  'document.addEventListener(\'DOMContentLoaded\', () => {\n'
  '  const main = document.getElementById(\'chk-asymptotes\');\n'
  '  const kbd  = document.getElementById(\'kbd-asym-chk\');\n'
  '  if (main && kbd) kbd.checked = main.checked;\n'
  "  ['ltx-xmin','ltx-xmax','ltx-ymin','ltx-ymax'].forEach(id => {\n"
  '    const el = document.getElementById(id); if (el) el.value = \'\';\n'
  '  });\n'
  '});\n'
)
assert OLD_SCRIPT in src, 'FEHLER: updateAsymPills/addFunctionExpr Block nicht gefunden'
src = src.replace(OLD_SCRIPT, NEW_SCRIPT, 1)

write_out('index.html', src)
print('OK  index.html')

# ════════════════════════════════════════════════════════════════════
# Syntax-Check
# ════════════════════════════════════════════════════════════════════
print('\nSyntax-Check:')
ok = True
for f in ['03_math.js','04_analysis.js','07_export.js','08_draw.js']:
    r = subprocess.run(['node','--check',f'{OUT}/{f}'], capture_output=True, text=True)
    s = 'OK' if r.returncode==0 else 'FEHLER'
    if r.returncode != 0: ok = False; print(f'  {s} {f}: {r.stderr.strip()[:200]}')
    else: print(f'  {s} {f}')
print('Fertig.' if ok else 'Es gibt Fehler!')
