#!/usr/bin/env python3
"""patch9.py — LaTeX-Export: Bug Steigungsdreieck + Tick-Einstellungen (Schrift + Schrittweite)."""
import sys, subprocess

UP  = '/sessions/stoic-great-bohr/mnt/uploads'
OUT = '/sessions/stoic-great-bohr/mnt/outputs'

def read(name):
    # Versuche zuerst den _out-Dateinamen, dann den normalen
    import os
    for path in [f'{UP}/{name}', f'{OUT}/{name}']:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
    raise FileNotFoundError(f'{name} nicht gefunden')

def find_upload(prefix):
    """Findet eine Upload-Datei anhand des Dateinamens-Suffix (z.B. '07_export.js')."""
    import os, glob
    # Exakter Name im uploads-Verzeichnis
    for f in glob.glob(f'{UP}/*'):
        if os.path.basename(f).endswith(prefix):
            with open(f, 'r', encoding='utf-8') as fh:
                return fh.read()
    raise FileNotFoundError(f'Datei mit Suffix {prefix!r} nicht gefunden')

def write(name, content):
    with open(f'{OUT}/{name}', 'w', encoding='utf-8') as f:
        f.write(content)

def patch(name, src, ops):
    for i, (old, new) in enumerate(ops):
        if old not in src:
            print(f'  FEHLER {name} op#{i}: Zeichenkette nicht gefunden:')
            print(f'    {repr(old[:120])}')
            sys.exit(1)
        src = src.replace(old, new, 1)
    return src

# ═══════════════════════════════════════════════════════════════════
# 07_export.js
# ═══════════════════════════════════════════════════════════════════
src = find_upload('07_export.js')

src = patch('07_export.js', src, [

  # ── 1. BUG-FIX: Steigungsdreieck — Δy zeigt echten Wert, m zur Δx-Zeile ──
  (
    '      // Label Δx\n'
    '      const dxMid = coord((xA + xB) / 2);\n'
    '      const dxStr = latexNum(dx);\n'
    '      body += `  \\\\node[anchor=north, font=\\\\tiny, ${col}] at (axis cs:${dxMid},${yAf}) {$\\\\Delta x=${dxStr}$};\\n`;\n'
    '      // Label Δy (= Steigung)\n'
    '      const dyMid = coord((yA + yB) / 2);\n'
    '      const slopeLatex = latexNum(slope);\n'
    '      body += `  \\\\node[anchor=west, font=\\\\tiny, ${col}] at (axis cs:${xBf},${dyMid}) {$\\\\Delta y = m = ${slopeLatex}$};\\n`;',

    '      // Label Δx + Steigung m (unter der horizontalen Kathete)\n'
    '      const dxMid = coord((xA + xB) / 2);\n'
    '      const dxStr = latexNum(dx);\n'
    '      const slopeLatex = latexNum(slope);\n'
    '      body += `  \\\\node[anchor=north, font=\\\\tiny, ${col}] at (axis cs:${dxMid},${yAf}) {$\\\\Delta x=${dxStr},\\\\;m=${slopeLatex}$};\\n`;\n'
    '      // Label Δy = tatsächliche y-Änderung (rechts neben der vertikalen Kathete)\n'
    '      const dyMid = coord((yA + yB) / 2);\n'
    '      const dyLatex = latexNum(dy);\n'
    '      body += `  \\\\node[anchor=west, font=\\\\tiny, ${col}] at (axis cs:${xBf},${dyMid}) {$\\\\Delta y=${dyLatex}$};\\n`;'
  ),

  # ── 2. Tick-Label-Schrift aus UI-Einstellung lesen ────────────────
  (
    "  axisLines.push('  xticklabel style={font=\\\\tiny},');\n"
    "  axisLines.push('  yticklabel style={font=\\\\tiny},');",

    "  const ltxTickFont = document.getElementById('ltx-tickfont')?.value || '\\\\tiny';\n"
    "  axisLines.push(`  xticklabel style={font=${ltxTickFont}},`);\n"
    "  axisLines.push(`  yticklabel style={font=${ltxTickFont}},`);"
  ),

  # ── 3. Tick-Schrittweite aus UI-Feldern lesen ────────────────────
  (
    '  if (xtickStr) {\n'
    '    axisLines.push(xtickStr);\n'
    '    axisLines.push(xticklabelStr);\n'
    '  } else {\n'
    '    axisLines.push(`  xtick=${niceTickStr(xTickMin, xTickMax, xGS)},`);\n'
    '    axisLines.push(`  ytick=${niceTickStr(yTickMin, yTickMax, yGS)},`);\n'
    '  }',

    '  if (xtickStr) {\n'
    '    axisLines.push(xtickStr);\n'
    '    axisLines.push(xticklabelStr);\n'
    '  } else {\n'
    '    // Schrittweite: aus UI-Feldern oder automatisch via gridStep()\n'
    '    const xStepIn = parseFloat(document.getElementById(\'ltx-xtickstep\')?.value);\n'
    '    const yStepIn = parseFloat(document.getElementById(\'ltx-ytickstep\')?.value);\n'
    '    const xGS_eff = isFinite(xStepIn) && xStepIn > 0 ? xStepIn : xGS;\n'
    '    const yGS_eff = isFinite(yStepIn) && yStepIn > 0 ? yStepIn : yGS;\n'
    '    const xTickMin_eff = Math.ceil(xminF / xGS_eff) * xGS_eff;\n'
    '    const xTickMax_eff = Math.floor(xmaxF / xGS_eff) * xGS_eff;\n'
    '    const yTickMin_eff = Math.ceil(yminF / yGS_eff) * yGS_eff;\n'
    '    const yTickMax_eff = Math.floor(ymaxF / yGS_eff) * yGS_eff;\n'
    '    axisLines.push(`  xtick=${niceTickStr(xTickMin_eff, xTickMax_eff, xGS_eff)},`);\n'
    '    axisLines.push(`  ytick=${niceTickStr(yTickMin_eff, yTickMax_eff, yGS_eff)},`);\n'
    '  }'
  ),
])

write('07_export.js', src)
print('OK  07_export.js')

# ═══════════════════════════════════════════════════════════════════
# index.html — LaTeX-Achseneinstellungen im Export-Panel einfügen
# ═══════════════════════════════════════════════════════════════════
src = find_upload('index.html')

# Wir fügen den neuen Block VOR dem <textarea id="latex-out"> ein
NEW_SETTINGS = (
    '    <div style="margin-top:6px;padding-top:5px;border-top:1px solid var(--border);">\n'
    '      <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">LaTeX-Achseneinstellungen:</div>\n'
    '      <div class="settings-row">\n'
    '        <label style="font-size:10px;white-space:nowrap;">Tick-Label-Schrift:</label>\n'
    '        <select id="ltx-tickfont" style="font-size:11px;">\n'
    r'          <option value="\tiny">\tiny</option>' + '\n'
    r'          <option value="\scriptsize">\scriptsize</option>' + '\n'
    r'          <option value="\footnotesize">\footnotesize</option>' + '\n'
    r'          <option value="\small">\small</option>' + '\n'
    r'          <option value="\normalsize">\normalsize</option>' + '\n'
    '        </select>\n'
    '      </div>\n'
    '      <div class="settings-row" style="gap:5px;flex-wrap:wrap;">\n'
    '        <label style="font-size:10px;white-space:nowrap;">Tick-Abstand&nbsp;x:</label>\n'
    '        <input type="number" id="ltx-xtickstep" placeholder="Auto" style="width:50px;" step="0.5" min="0.1">\n'
    '        <label style="font-size:10px;">y:</label>\n'
    '        <input type="number" id="ltx-ytickstep" placeholder="Auto" style="width:50px;" step="0.5" min="0.1">\n'
    '      </div>\n'
    '    </div>\n'
)

TEXTAREA_LINE = (
    '    <textarea id="latex-out" readonly style="width:100%;height:90px;'
    "font-family:'Cascadia Code','Fira Mono',monospace;font-size:10px;padding:6px;"
    'border:1px solid #c8cdd6;border-radius:6px;background:#f7f8fa;color:#374151;'
    'resize:vertical;outline:none;line-height:1.5;" data-i18n-placeholder="ph_latex" '
    'placeholder="LaTeX-Code erscheint hier…"></textarea>'
)

src = patch('index.html', src, [
  (
    TEXTAREA_LINE,
    NEW_SETTINGS + TEXTAREA_LINE
  ),
])

write('index.html', src)
print('OK  index.html')

# ═══════════════════════════════════════════════════════════════════
# Syntax-Check
# ═══════════════════════════════════════════════════════════════════
print('\nSyntax-Check...')
for f in ['07_export.js']:
    r = subprocess.run(['node', '--check', f'{OUT}/{f}'], capture_output=True, text=True)
    status = '✓' if r.returncode == 0 else '✗'
    msg = '' if r.returncode == 0 else f': {r.stderr.strip()}'
    print(f'  {status} {f}{msg}')
print('Fertig.')
