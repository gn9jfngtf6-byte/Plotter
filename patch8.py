#!/usr/bin/env python3
"""patch8.py — All patches (patch7) + vertical-align fix + horizontal scroll fix."""
import sys, subprocess

UP = '/sessions/clever-inspiring-carson/mnt/uploads'
OUT = '/sessions/clever-inspiring-carson/mnt/outputs'

def read(name):
    with open(f'{UP}/{name}', 'r', encoding='utf-8') as f:
        return f.read()

def write(name, content):
    with open(f'{OUT}/{name}', 'w', encoding='utf-8') as f:
        f.write(content)

def patch(name, src, ops):
    for i, (old, new) in enumerate(ops):
        if old not in src:
            print(f'  FEHLER {name} op#{i}: nicht gefunden: {repr(old[:100])}')
            sys.exit(1)
        src = src.replace(old, new, 1)
    return src

# ═══════════════════════════════════════════════════════════════════
# 03_math.js
# ═══════════════════════════════════════════════════════════════════
src = read('03_math.js')
src = patch('03_math.js', src, [

  # 1. _ceKbdSel + ceSelRawFromRange after evalCache
  (
    'const evalCache = new Map();',
    r'''const evalCache = new Map();

// Gespeicherte Selektion beim Mousedown (vor el.focus()-Reset).
let _ceKbdSel = null;

// Extrahiert den Rohausdruck der Selektion aus einem CE-Element.
function ceSelRawFromRange(range, el) {
  const children = Array.from(el.childNodes);
  const sel = children.filter(ch => {
    try { return range.intersectsNode(ch); } catch(e) { return false; }
  });
  if (!sel.length) return '';
  const tmp = document.createElement('div');
  sel.forEach(n => tmp.appendChild(n.cloneNode(true)));
  return typeof ceRawFromDom === 'function'
    ? ceRawFromDom(tmp)
    : tmp.textContent.replace(/​/g, '');
}'''
  ),

  # 2. Mousedown listener before kbdInsert
  (
    '// Fügt Text ins aktive Eingabefeld an der Cursor-Position ein.\nfunction kbdInsert(before, after, extraArg) {',
    '''// Selektion beim Mousedown merken (vor Focus-Reset durch Tastenklick).
document.addEventListener('mousedown', e => {
  if (!activeInput || activeInput.el.contentEditable !== 'true') return;
  const el = activeInput.el;
  const sel = window.getSelection();
  if (sel && sel.rangeCount) {
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;
    const fullRaw = el.getAttribute('data-raw') || '';
    const selRaw = !range.collapsed ? ceSelRawFromRange(range, el) : '';
    _ceKbdSel = { fullRaw, selRaw };
  }
}, true);

// Fügt Text ins aktive Eingabefeld an der Cursor-Position ein.
function kbdInsert(before, after, extraArg) {'''
  ),

  # 3. Replace kbdInsert CE block (two-path, no DOM deleteContents)
  (
    '''  const isCE = el.contentEditable === 'true';
  if (isCE) {
    const selObj = window.getSelection();
    let selTxt = selObj.toString();

    // Insert-Text bestimmen
    let insert;
    if (before === 'EC') insert = fi >= 0 ? 'EC' : String(Math.E.toFixed(10));
    else if (before === 'pi') insert = fi >= 0 ? 'pi' : String(Math.PI.toFixed(10));
    else if (extraArg !== undefined) insert = before + (selTxt || 'x') + ',' + extraArg + ')';
    else if (after !== undefined) insert = before + (selTxt || 'x') + after;
    else insert = before;

    // In contenteditable einfügen (immer als Text — kein Re-Render nötig)
    document.execCommand('insertText', false, insert);
    // Rohausdruck aus DOM rekonstruieren (berücksichtigt evt. vorhandene Bruchspans)
    const newRaw = typeof ceRawFromDom === 'function' ? ceRawFromDom(el) : el.textContent;
    el.setAttribute('data-raw', newRaw);
    if (fi >= 0 && functions[fi]) {
      functions[fi].expr = newRaw;
      syncParams(); syncAreaSelects(); scheduleComputeSpecials();
      if (showArea) updateAreaResult(); scheduleDraw();
    }
    return;
  }''',
    '''  const isCE = el.contentEditable === 'true';
  if (isCE) {
    // Selektion VOR el.focus() sichern (focus() setzt Selektion zurück).
    const selObj = window.getSelection();
    let selTxt = '';
    if (selObj && selObj.rangeCount > 0) {
      const r = selObj.getRangeAt(0);
      if (el.contains(r.commonAncestorContainer) && !r.collapsed)
        selTxt = ceSelRawFromRange(r, el);
    }
    if (!selTxt && _ceKbdSel && _ceKbdSel.selRaw) selTxt = _ceKbdSel.selRaw;
    el.focus();

    // Insert-Text bestimmen
    let insert;
    if (before === 'EC') insert = fi >= 0 ? 'EC' : String(Math.E.toFixed(10));
    else if (before === 'pi') insert = fi >= 0 ? 'pi' : String(Math.PI.toFixed(10));
    else if (extraArg !== undefined) insert = before + (selTxt || 'x') + ',' + extraArg + ')';
    else if (after !== undefined) insert = before + (selTxt || 'x') + after;
    else if (selTxt) insert = '(' + selTxt + ')' + before;
    else insert = before;

    if (selTxt) {
      // SELEKTION: Rohausdruck-String ersetzen (kein DOM-deleteContents).
      const fullRaw = el.getAttribute('data-raw') || (_ceKbdSel && _ceKbdSel.fullRaw) || '';
      const idx = fullRaw.indexOf(selTxt);
      const newRaw = idx >= 0
        ? fullRaw.slice(0, idx) + insert + fullRaw.slice(idx + selTxt.length)
        : fullRaw + insert;
      el.setAttribute('data-raw', newRaw);
      if (fi >= 0 && functions[fi]) {
        functions[fi].expr = newRaw;
        if (typeof ceRenderEl === 'function') ceRenderEl(el);
        syncParams(); syncAreaSelects(); scheduleComputeSpecials();
        if (showArea) updateAreaResult(); scheduleDraw();
      }
    } else {
      // KEIN SELECTION: execCommand an Cursor-Position
      document.execCommand('insertText', false, insert);
      const newRaw = typeof ceRawFromDom === 'function' ? ceRawFromDom(el) : el.textContent;
      el.setAttribute('data-raw', newRaw);
      if (fi >= 0 && functions[fi]) {
        functions[fi].expr = newRaw;
        syncParams(); syncAreaSelects(); scheduleComputeSpecials();
        if (showArea) updateAreaResult(); scheduleDraw();
      }
    }
    return;
  }'''
  ),

  # 4. insertImplicitMult + wire into getEvalFn
  (
    'function getEvalFn(expr, pNames) {',
    r'''// Fügt implizite Multiplikation ein: 2x → 2*x, 7(x-2) → 7*(x-2) usw.
function insertImplicitMult(expr) {
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
write('03_math.js', src)
print('OK  03_math.js')

# ═══════════════════════════════════════════════════════════════════
# 06_ui_functions.js
# ═══════════════════════════════════════════════════════════════════
src = read('06_ui_functions.js')
src = patch('06_ui_functions.js', src, [

  # NEW-A: CSS injection — add .pf-inline + thin scrollbar
  (
    "    '.func-inp-ce .pf-cursor-anchor{vertical-align:baseline!important;font-size:1em!important;}';\n  document.head.appendChild(s);\n})();",
    "    '.func-inp-ce .pf-cursor-anchor{vertical-align:baseline!important;font-size:1em!important;}' +\n    '.func-inp-ce .pf-inline{vertical-align:middle;display:inline;font-size:1em;}' +\n    '.func-inp-ce::-webkit-scrollbar{height:3px;}' +\n    '.func-inp-ce::-webkit-scrollbar-thumb{background:var(--border-input);border-radius:3px;}';\n  document.head.appendChild(s);\n})();"
  ),

  # 1. ceRenderEl before FUNKTIONSLISTE
  (
    '// ═══════════════════════════════════════════════════════════════════\n// FUNKTIONSLISTE (Sidebar)',
    '''// Öffentliche Funktion: CE-Feld von außen neu rendern (z.B. nach kbdInsert).
function ceRenderEl(el) {
  if (el._ceRender) { el._ceRender(); }
}

// ═══════════════════════════════════════════════════════════════════
// FUNKTIONSLISTE (Sidebar)'''
  ),

  # NEW-B: overflow-x: auto (enable horizontal scrolling)
  (
    'overflow-x:clip;overflow-y:visible;',
    'overflow-x:auto;overflow-y:visible;'
  ),

  # NEW-C: wrap top-level text nodes in pf-inline after innerHTML set
  (
    '        inp.innerHTML = exprToHtml(disp || raw);\n        // Cursor-Anker: Span am Ende sicherstellen',
    '''        inp.innerHTML = exprToHtml(disp || raw);
        // Wrap top-level text nodes in pf-inline for vertical alignment next to fractions
        Array.from(inp.childNodes).forEach(nd => {
          if (nd.nodeType === 3 && nd.textContent.replace(/​/g, '').length > 0) {
            const pli = document.createElement('span'); pli.className = 'pf-inline';
            inp.insertBefore(pli, nd); pli.appendChild(nd);
          }
        });
        // Cursor-Anker: Span am Ende sicherstellen'''
  ),

  # 2. Expose ceRender as el._ceRender after first ceRender() call
  (
    '    ceRender();\n\n    inp.onfocus',
    '    ceRender();\n    inp._ceRender = ceRender;\n\n    inp.onfocus'
  ),

  # 3. Update auto-fraction regex in oninput
  (
    "      const converted = raw.replace(/([a-zA-Z0-9_.]+)\\/([a-zA-Z0-9_.]+)/g, '($1)/($2)');",
    "      const converted = raw.replace(\n"
    "        /([a-zA-Z0-9_.]+(?:\\([^()]*\\))?(?:\\^(?:\\([^)]*\\)|[a-zA-Z0-9_.]+))?)\\/([a-zA-Z0-9_.]+(?:\\([^()]*\\))?(?:\\^(?:\\([^)]*\\)|[a-zA-Z0-9_.]+))?)/g,\n"
    "        '($1)/($2)'\n"
    "      );"
  ),

  # 4. Slash key escape from preview-sup + Backspace block
  (
    '''      if (e.key === 'Backspace') {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (!range.collapsed) return; // Selektion → Browser löscht normal
        const node = range.startContainer, offset = range.startOffset;
        let fracToDelete = null;
        if (node.nodeType === 3 && offset === 0 &&
            node.previousSibling?.classList?.contains('preview-frac'))
          fracToDelete = node.previousSibling;
        else if (node === inp && offset > 0 &&
                 inp.childNodes[offset-1]?.classList?.contains('preview-frac'))
          fracToDelete = inp.childNodes[offset-1];
        if (fracToDelete) {
          e.preventDefault();
          fracToDelete.remove();
          const raw = ceRawFromDom(inp);
          inp.setAttribute('data-raw', raw); fn.expr = raw;
          clearEvalCache(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
          if (showArea) updateAreaResult(); scheduleDraw();
        }
      }
    };''',
    '''      if (e.key === 'Backspace') {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (!range.collapsed) return;
        const node = range.startContainer, offset = range.startOffset;
        let fracToDelete = null;
        if (node.nodeType === 3 && offset === 0 &&
            node.previousSibling?.classList?.contains('preview-frac'))
          fracToDelete = node.previousSibling;
        else if (node === inp && offset > 0 &&
                 inp.childNodes[offset-1]?.classList?.contains('preview-frac'))
          fracToDelete = inp.childNodes[offset-1];
        if (fracToDelete) {
          e.preventDefault();
          fracToDelete.remove();
          const raw = ceRawFromDom(inp);
          inp.setAttribute('data-raw', raw); fn.expr = raw;
          clearEvalCache(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
          if (showArea) updateAreaResult(); scheduleDraw();
        }
      }
      // Slash innerhalb eines Exponenten: aus preview-sup heraus + / einfügen
      if (e.key === '/') {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          let nd = sel.getRangeAt(0).startContainer;
          while (nd && nd !== inp) {
            if (nd.nodeType === 1 && nd.classList?.contains('preview-sup')) {
              e.preventDefault();
              let anch = nd.nextSibling;
              if (!anch || !anch.classList?.contains('pf-cursor-anchor')) {
                anch = document.createElement('span');
                anch.className = 'pf-cursor-anchor'; anch.textContent = '​';
                nd.parentNode.insertBefore(anch, nd.nextSibling);
              }
              const nr = document.createRange();
              const tx = anch.firstChild;
              if (tx && tx.nodeType === 3) { nr.setStart(tx, tx.length); }
              else { nr.selectNodeContents(anch); nr.collapse(false); }
              nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr);
              document.execCommand('insertText', false, '/');
              const newRaw = ceRawFromDom(inp);
              inp.setAttribute('data-raw', newRaw); fn.expr = newRaw;
              clearEvalCache(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
              if (showArea) updateAreaResult(); scheduleDraw();
              return;
            }
            nd = nd.parentNode;
          }
        }
      }
    };'''
  ),
])
write('06_ui_functions.js', src)
print('OK  06_ui_functions.js')

# ═══════════════════════════════════════════════════════════════════
# 07_export.js
# ═══════════════════════════════════════════════════════════════════
src = read('07_export.js')
src = patch('07_export.js', src, [

  # 1. Implicit mult in exprToPgf
  (
    "  // Schritt 2: x → \\x (nur alleinstehende x-Variable, nicht in Funktionsnamen)\n"
    "  s = s.replace(/\\bx\\b/g, '\\\\x');",
    "  // Implizite Multiplikation (2x → 2*x) bevor x → \\x\n"
    "  s = s.replace(/(\\d)([a-zA-Z])/g, '$1*$2');\n"
    "  s = s.replace(/(\\d)\\(/g, '$1*(');\n"
    "  s = s.replace(/\\)\\(/g, ')*(');\n"
    "  s = s.replace(/\\)([a-zA-Z])/g, ')*$1');\n\n"
    "  // Schritt 2: x → \\x (nur alleinstehende x-Variable, nicht in Funktionsnamen)\n"
    "  s = s.replace(/\\bx\\b/g, '\\\\x');"
  ),

  # 2. exprToMath frac regex — nested parens
  (
    "    s = s.replace(/\\(([^()]*)\\)\\/\\(([^()]*)\\)/g, '\\\\frac{$1}{$2}');",
    "    s = s.replace(/\\(([^()]*(?:\\([^()]*\\)[^()]*)*)\\)\\/\\(([^()]*(?:\\([^()]*\\)[^()]*)*)\\)/g, '\\\\frac{$1}{$2}');"
  ),

  # 3. exprToHtml frac regex — nested parens
  (
    "    s = s.replace(/\\(([^()]*)\\)\\/\\(([^()]*)\\)/g,\n"
    "      '<span class=\"preview-frac\"><span class=\"pf-num\">$1</span><span class=\"pf-den\">$2</span></span>');",
    "    s = s.replace(/\\(([^()]*(?:\\([^()]*\\)[^()]*)*)\\)\\/\\(([^()]*(?:\\([^()]*\\)[^()]*)*)\\)/g,\n"
    "      '<span class=\"preview-frac\"><span class=\"pf-num\">$1</span><span class=\"pf-den\">$2</span></span>');"
  ),

  # 4. Large bracket scaling in exprToHtml
  (
    "  s = s.replace(/(span>)\\s*·\\s*([a-zA-Z])/g, '$1$2');\n  return s;",
    "  s = s.replace(/(span>)\\s*·\\s*([a-zA-Z])/g, '$1$2');\n"
    "  // Klammern neben Brüchen vergrössern (wie \\left( \\right) in LaTeX)\n"
    "  s = s.replace(/\\(<span class=\"preview-frac\"/g,\n"
    "    '<span class=\"paren-frac\">(</span><span class=\"preview-frac\"');\n"
    "  s = s.replace(/<\\/span><\\/span>\\)/g,\n"
    "    '</span></span><span class=\"paren-frac\">)</span>');\n"
    "  return s;"
  ),

  # 5. exprNeedsPreview — nested parens
  (
    "  return /\\([^()]*\\)\\/\\([^()]*\\)/.test(expr) || /\\^/.test(expr)\n"
    "    || /\\(-?\\d+\\/\\d+\\)/.test(expr); // einfache Zahlbrüche wie (1/4)",
    "  return /\\(.*\\)\\/\\(.*\\)/.test(expr) || /\\^/.test(expr)\n"
    "    || /\\(-?\\d+\\/\\d+\\)/.test(expr); // einfache Zahlbrüche wie (1/4)"
  ),

  # 6. getDomains bisection direction fix
  (
    "          // Pol per Bisektion verfeinern\n          let lo2 = prevX, hi2 = x;",
    "          // Pol per Bisektion verfeinern (Richtung: endlich→unendlich)\n"
    "          let lo2 = (prevY !== null) ? prevX : x;\n"
    "          let hi2 = (prevY !== null) ? x : prevX;"
  ),
])
write('07_export.js', src)
print('OK  07_export.js')

# ═══════════════════════════════════════════════════════════════════
# 08_draw.js
# ═══════════════════════════════════════════════════════════════════
src = read('08_draw.js')
src = patch('08_draw.js', src, [

  # 1. Reset _asymLines
  (
    'function drawAsymptotes(w, h) {\n  const v = isoView || view;',
    'function drawAsymptotes(w, h) {\n  window._asymLines = [];\n  const v = isoView || view;'
  ),

  # 2. Label + _asymLines in addPole
  (
    "      if (!poles.some(p => Math.abs(p - ax) < MERGE_DIST)) {\n"
    "        poles.push(ax);\n"
    "        const { cx } = toCanvas(ax, 0);\n"
    "        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();\n"
    "      }\n"
    "    };",
    "      if (!poles.some(p => Math.abs(p - ax) < MERGE_DIST)) {\n"
    "        poles.push(ax);\n"
    "        const { cx } = toCanvas(ax, 0);\n"
    "        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();\n"
    "        const lbl = 'x = ' + parseFloat(ax.toFixed(4));\n"
    "        ctx.save(); ctx.font = '10px system-ui'; ctx.fillStyle = fn.color + 'cc';\n"
    "        ctx.textAlign = 'left'; ctx.textBaseline = 'top';\n"
    "        ctx.fillText(lbl, cx + 3, 4); ctx.restore();\n"
    "        if (typeof window._asymLines !== 'undefined')\n"
    "          window._asymLines.push({ type: 'vertical', expr: null, label: lbl, color: fn.color });\n"
    "      }\n"
    "    };"
  ),

  # 3. Non-finite→finite detection branch
  (
    "      if (prevY !== null && prevX !== null) {\n"
    "        // Übergang endlich → unendlich\n"
    "        if (isFinite(prevY) && !isFinite(y)) {\n"
    "          addPole(prevX, x);\n"
    "        }\n"
    "        // Grosser Sprung mit Vorzeichenwechsel → Pol\n"
    "        else if (isFinite(prevY) && isFinite(y) &&\n"
    "                 Math.abs(y - prevY) > (v.ymax - v.ymin) * 6 &&\n"
    "                 Math.sign(y) !== Math.sign(prevY)) {\n"
    "          addPole(prevX, x);\n"
    "        }\n"
    "      }\n"
    "      prevY = isFinite(y) ? y : null; prevX = x;",

    "      if (prevY !== null && prevX !== null) {\n"
    "        if (isFinite(prevY) && !isFinite(y)) {\n"
    "          addPole(prevX, x);\n"
    "        } else if (isFinite(prevY) && isFinite(y) &&\n"
    "                 Math.abs(y - prevY) > (v.ymax - v.ymin) * 6 &&\n"
    "                 Math.sign(y) !== Math.sign(prevY)) {\n"
    "          addPole(prevX, x);\n"
    "        } else if (prevY === null && prevX !== null && isFinite(y)) {\n"
    "          const nextY = safeEval(fn.expr, x + dx);\n"
    "          if (Math.abs(y) > (v.ymax - v.ymin) * 0.1 ||\n"
    "              (isFinite(nextY) && Math.abs(y) > Math.abs(nextY) * 1.2 && Math.abs(y) > 0.5))\n"
    "            addPole(x, prevX);\n"
    "        }\n"
    "      }\n"
    "      prevY = isFinite(y) ? y : null; prevX = x;"
  ),

  # 4. Horiz labels + oblique asymptotes + updateAsymPills
  (
    "    hAsyms.forEach(haVal => {\n"
    "      const { cy: hy } = toCanvas(0, haVal);\n"
    "      ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(w, hy); ctx.stroke();\n"
    "    });\n"
    "  });\n"
    "  ctx.restore();\n"
    "}",

    "    hAsyms.forEach(haVal => {\n"
    "      const { cy: hy } = toCanvas(0, haVal);\n"
    "      ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(w, hy); ctx.stroke();\n"
    "      const haLbl = 'y = ' + parseFloat(haVal.toFixed(4));\n"
    "      ctx.save(); ctx.font = '10px system-ui'; ctx.fillStyle = fn.color + 'cc';\n"
    "      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';\n"
    "      ctx.fillText(haLbl, w - 4, hy - 2); ctx.restore();\n"
    "      if (typeof window._asymLines !== 'undefined')\n"
    "        window._asymLines.push({ type: 'horizontal', expr: String(parseFloat(haVal.toFixed(6))), label: haLbl, color: fn.color });\n"
    "    });\n"
    "\n"
    "    // ── Schräge (oblique) Asymptoten ─────────────────────────────────\n"
    "    const BIG2 = 1e6, BIG1 = 1e5, Xt = 5e5;\n"
    "    for (const dir of [1, -1]) {\n"
    "      const X1 = dir * BIG1, X2 = dir * BIG2;\n"
    "      const fX1 = safeEval(fn.expr, X1), fX2 = safeEval(fn.expr, X2);\n"
    "      if (!isFinite(fX1) || !isFinite(fX2)) continue;\n"
    "      const slope = (fX2 - fX1) / (X2 - X1);\n"
    "      if (!isFinite(slope) || Math.abs(slope) < 1e-9) continue;\n"
    "      const intercept = fX2 - slope * X2;\n"
    "      if (!isFinite(intercept)) continue;\n"
    "      const fXt = safeEval(fn.expr, dir * Xt);\n"
    "      const predicted = slope * (dir * Xt) + intercept;\n"
    "      if (!isFinite(fXt) || Math.abs(fXt - predicted) > 1e-3 * Math.abs(dir * Xt)) continue;\n"
    "      const slopeR = parseFloat(slope.toFixed(6)), intR = parseFloat(intercept.toFixed(4));\n"
    "      if (window._asymLines && window._asymLines.some(a =>\n"
    "          a.type === 'oblique' && Math.abs(a._slope - slopeR) < 1e-4 && Math.abs(a._int - intR) < 1e-4)) continue;\n"
    "      const x0 = v.xmin, x1v = v.xmax;\n"
    "      const y0 = slope * x0 + intercept, y1v = slope * x1v + intercept;\n"
    "      const { cx: cxA, cy: cyA } = toCanvas(x0, y0);\n"
    "      const { cx: cxB, cy: cyB } = toCanvas(x1v, y1v);\n"
    "      ctx.beginPath(); ctx.moveTo(cxA, cyA); ctx.lineTo(cxB, cyB); ctx.stroke();\n"
    "      const slopeStr = parseFloat(slope.toFixed(4)) === 1 ? '' :\n"
    "                       parseFloat(slope.toFixed(4)) === -1 ? '-' :\n"
    "                       String(parseFloat(slope.toFixed(4)));\n"
    "      const intStr = Math.abs(intR) < 1e-4 ? '' :\n"
    "                     intR > 0 ? ' + ' + parseFloat(intR.toFixed(4)) :\n"
    "                     ' - ' + Math.abs(parseFloat(intR.toFixed(4)));\n"
    "      const oaLbl = 'y = ' + slopeStr + 'x' + intStr;\n"
    "      const oaExpr = String(parseFloat(slope.toFixed(6))) + '*x' +\n"
    "                     (Math.abs(intR) < 1e-4 ? '' : (intR >= 0 ? '+' : '') + parseFloat(intR.toFixed(6)));\n"
    "      const midCx = (cxA + cxB) / 2, midCy = (cyA + cyB) / 2;\n"
    "      ctx.save(); ctx.font = '10px system-ui'; ctx.fillStyle = fn.color + 'cc';\n"
    "      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';\n"
    "      ctx.fillText(oaLbl, midCx, midCy - 4); ctx.restore();\n"
    "      if (typeof window._asymLines !== 'undefined')\n"
    "        window._asymLines.push({ type: 'oblique', expr: oaExpr, label: oaLbl, color: fn.color, _slope: slopeR, _int: intR });\n"
    "    }\n"
    "  });\n"
    "  ctx.restore();\n"
    "  if (typeof updateAsymPills === 'function') updateAsymPills();\n"
    "}"
  ),
])
write('08_draw.js', src)
print('OK  08_draw.js')

# ═══════════════════════════════════════════════════════════════════
# index.html
# ═══════════════════════════════════════════════════════════════════
src = read('index.html')
src = patch('index.html', src, [

  # 1. .paren-frac + .pf-inline CSS
  (
    '.func-inp-ce .preview-frac { cursor: default; margin: 0 1px; }',
    '.func-inp-ce .preview-frac { cursor: default; margin: 0 1px; }\n'
    '.paren-frac { display: inline-block; transform: scaleY(2.2); line-height: 1; vertical-align: middle; }\n'
    '.func-inp-ce .pf-inline { vertical-align: middle; display: inline; font-size: 1em; }'
  ),

  # 2. Asymptote checkbox below keyboard hint
  (
    '    <div class="hint" style="margin-top:4px;" data-i18n="lbl_kbd_hint">Klicke ins Funktionsfeld, dann auf eine Taste.<br><code>nthroot(x,n)</code>=ⁿ√x &nbsp;<code>logn(x,b)</code>=log<sub>b</sub>x &nbsp;<code>EC</code>=e</div>\n  </div>',
    '    <div class="hint" style="margin-top:4px;" data-i18n="lbl_kbd_hint">Klicke ins Funktionsfeld, dann auf eine Taste.<br><code>nthroot(x,n)</code>=ⁿ√x &nbsp;<code>logn(x,b)</code>=log<sub>b</sub>x &nbsp;<code>EC</code>=e</div>\n'
    '    <div style="margin-top:6px;"><label style="font-size:12px;display:flex;align-items:center;gap:5px;cursor:pointer;"><input type="checkbox" id="kbd-asym-chk" onchange="document.getElementById(\'chk-asymptotes\').checked=this.checked;scheduleDraw();"> <span data-i18n="chk_asymptotes">Asymptoten anzeigen</span></label></div>\n'
    '  </div>'
  ),

  # 3. asym-pills + sync chk-asymptotes
  (
    '    <div class="settings-row"><label><input type="checkbox" id="chk-asymptotes" onchange="scheduleDraw()"> <span data-i18n="chk_asymptotes">Asymptoten anzeigen</span></label></div>',
    '    <div class="settings-row"><label><input type="checkbox" id="chk-asymptotes" onchange="var k=document.getElementById(\'kbd-asym-chk\');if(k)k.checked=this.checked;scheduleDraw()"> <span data-i18n="chk_asymptotes">Asymptoten anzeigen</span></label></div>\n'
    '    <div id="asym-pills" style="display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 2px 0;"></div>'
  ),

  # 4. updateAsymPills + addFunctionExpr script before </body>
  (
    '</body>\n</html>',
    '<script>\n'
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
    '    pill.style.cssText = \'cursor:pointer;background:\' + a.color + \'22;border:1px solid \' + a.color + \'88;border-radius:10px;padding:1px 8px;font-size:11px;color:\' + a.color + \';white-space:nowrap;\';\n'
    '    pill.textContent = a.label;\n'
    '    pill.onclick = () => addFunctionExpr(a.expr);\n'
    '    container.appendChild(pill);\n'
    '  });\n'
    '}\n'
    'function addFunctionExpr(expr) {\n'
    '  if (typeof functions === \'undefined\' || typeof renderFuncList === \'undefined\') return;\n'
    '  const colors = [\'#e24b4a\',\'#378ADD\',\'#1D9E75\',\'#D85A30\',\'#8B5CF6\',\'#EC4899\'];\n'
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
    '</script>\n'
    '</body>\n</html>'
  ),
])
write('index.html', src)
print('OK  index.html')

print('\nSyntax-Check...')
for f in ['03_math.js', '06_ui_functions.js', '07_export.js', '08_draw.js']:
    r = subprocess.run(['node', '--check', f'{OUT}/{f}'], capture_output=True, text=True)
    status = '✓' if r.returncode == 0 else '✗'
    msg = '' if r.returncode == 0 else f': {r.stderr.strip()}'
    print(f'  {status} {f}{msg}')
print('Fertig.')
