// ═══════════════════════════════════════════════════════════════════
// MODUL: sequences — Folgen (diskrete Funktionen auf ℕ)
// ═══════════════════════════════════════════════════════════════════

let sequences = [];

const SEQ_COLORS = ['#9333ea','#0891b2','#d97706','#be185d','#166534','#7c3aed'];

// Wertet aₙ = expr(n) aus. 'n' wird als Variable verwendet.
function evalSeqAt(expr, n) {
  if (!expr || !expr.trim()) return NaN;
  // Ersetze freistehende 'n' durch Zahlenwert (nicht in sin/ln/tan/min/nthroot/logn)
  const e = expr.replace(/\bn\b/g, '(' + n + ')');
  return safeEval(e, n);
}

// Berechnet die Glieder einer Folge.
// Automatisch bis zum rechten Bildrand (+ Puffer), max. 1000 Terme.
function computeSeqTerms(seq, previewOnly) {
  const pts = [];
  const n0 = Math.round(seq.nMin ?? 1);
  if (!isFinite(n0)) return pts;

  if (previewOnly) {
    // Nur erste 10 Glieder für die Vorschau
    for (let n = n0; n < n0 + 10; n++) {
      const y = evalSeqAt(seq.expr, n);
      if (isFinite(y)) pts.push({ n, y });
    }
    return pts;
  }

  // Automatisch: von n₀ bis zum rechten Bildrand + Puffer, max 1000
  const v = isoView || view;
  const nMax = Math.min(n0 + 1000, Math.max(n0 + 30, Math.ceil(v.xmax) + 5));
  for (let n = n0; n <= nMax; n++) {
    const y = evalSeqAt(seq.expr, n);
    if (isFinite(y)) pts.push({ n, y });
  }
  return pts;
}

// ── UI ───────────────────────────────────────────────────────────────

function renderSeqList() {
  const el = document.getElementById('seq-list');
  if (!el) return;
  el.innerHTML = '';

  sequences.forEach((seq, i) => {
    if (seq.visible === undefined) seq.visible = true;

    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:8px;';

    // Kopfzeile
    const head = document.createElement('div');
    head.className = 'func-row';

    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.background = seq.color;
    dot.style.opacity = seq.visible ? '1' : '0.3';
    dot.style.cursor = 'pointer';
    dot.title = t('title_color');
    dot.onclick = e => { e.stopPropagation(); openSeqColorPicker(e, i); };

    const lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:11px;color:#6b7280;min-width:24px;flex-shrink:0;';
    lbl.innerHTML = `a<sub>${i+1}</sub>:`;

    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = seq.expr;
    inp.placeholder = 'z.B. 1/n, n^2, (-1)^n/n';
    inp.style.cssText = 'flex:1;min-width:0;font-family:monospace;font-size:12px;';
    inp.oninput = () => {
      seq.expr = inp.value.trim();
      updateSeqTermsList(i);
      scheduleDraw();
    };

    const eye = document.createElement('button');
    eye.className = 'del-btn';
    eye.innerHTML = seq.visible ? '&#128065;' : '&#x1F648;';
    eye.title = seq.visible ? t('btn_hide_fn') : t('btn_show_fn');
    eye.onclick = () => { seq.visible = !seq.visible; renderSeqList(); scheduleDraw(); };

    const del = document.createElement('button');
    del.className = 'del-btn';
    del.textContent = '✕';
    del.title = t('title_del_pt');
    del.onclick = () => { sequences.splice(i, 1); renderSeqList(); scheduleDraw(); };

    head.append(dot, lbl, inp, eye, del);

    // n₀-Einstellung + Verbindungslinien
    const settings = document.createElement('div');
    settings.style.cssText = 'display:flex;gap:6px;align-items:center;margin:3px 0 3px 28px;font-size:11px;flex-wrap:wrap;';

    const nMinLbl = document.createElement('span');
    nMinLbl.textContent = 'n₀ =';
    nMinLbl.style.color = '#6b7280';

    const nMinInp = document.createElement('input');
    nMinInp.type = 'number';
    nMinInp.value = seq.nMin ?? 1;
    nMinInp.min = 0;
    nMinInp.step = 1;
    nMinInp.style.cssText = 'width:54px;font-size:11px;';
    nMinInp.oninput = () => {
      const v = parseInt(nMinInp.value);
      seq.nMin = isNaN(v) ? 1 : Math.max(0, v);
      updateSeqTermsList(i);
      scheduleDraw();
    };

    const lineLbl = document.createElement('label');
    lineLbl.style.cssText = 'display:flex;align-items:center;gap:3px;cursor:pointer;color:#6b7280;';
    const lineChk = document.createElement('input');
    lineChk.type = 'checkbox';
    lineChk.checked = seq.showLine ?? false;
    lineChk.onchange = () => { seq.showLine = lineChk.checked; scheduleDraw(); };
    lineLbl.append(lineChk, document.createTextNode(t('seq_connect')));

    settings.append(nMinLbl, nMinInp, lineLbl);

    // Termvorschau
    const preview = document.createElement('div');
    preview.id = `seq-preview-${i}`;
    preview.style.cssText = 'font-size:10.5px;color:var(--text-muted);margin:2px 0 0 28px;font-family:monospace;line-height:1.7;';

    row.append(head, settings, preview);
    el.appendChild(row);
    updateSeqTermsList(i);
  });
}

function updateSeqTermsList(i) {
  const el = document.getElementById(`seq-preview-${i}`);
  if (!el || !sequences[i]) return;
  const seq = sequences[i];
  if (!seq.expr.trim()) { el.textContent = ''; return; }
  const pts = computeSeqTerms(seq, true); // nur Preview
  el.innerHTML = pts.map(p =>
    `a<sub>${p.n}</sub> = ${niceNumDec(p.y)}`
  ).join('&ensp; ') + (pts.length >= 10 ? '&ensp;…' : '');
}

function addSeq() {
  const col = SEQ_COLORS[sequences.length % SEQ_COLORS.length];
  sequences.push({ expr: '', color: col, visible: true, nMin: 1, showLine: false });
  renderSeqList();
  const inputs = document.getElementById('seq-list')?.querySelectorAll('input[type=text]');
  if (inputs?.length) inputs[inputs.length - 1].focus();
}

// Farbwähler für Folgen
let _seqColorPickerIdx = -1;
function openSeqColorPicker(e, i) {
  _seqColorPickerIdx = i;
  colorPickerFi = -1;
  const popup = document.getElementById('color-popup');
  if (!popup) return;
  popup.innerHTML = '';
  ALL_COLORS.forEach(col => {
    const sw = document.createElement('div'); sw.className = 'color-swatch';
    sw.style.background = col;
    if (col === sequences[i]?.color) sw.classList.add('selected');
    sw.onclick = ev => {
      ev.stopPropagation();
      if (sequences[_seqColorPickerIdx]) sequences[_seqColorPickerIdx].color = col;
      renderSeqList(); scheduleDraw(); closeColorPicker();
      _seqColorPickerIdx = -1;
    };
    popup.appendChild(sw);
  });
  popup.classList.add('active');
  const rect = e.target.getBoundingClientRect();
  popup.style.left = (rect.right + 4) + 'px';
  popup.style.top = Math.min(rect.top, window.innerHeight - 160) + 'px';
}

// ── Zeichnen ─────────────────────────────────────────────────────────

function drawSequences(w, h) {
  if (!sequences.length) return;
  const v = isoView || view;
  const R = br(4.5);

  sequences.forEach(seq => {
    if (!seq.visible || !seq.expr.trim()) return;
    const pts = computeSeqTerms(seq, false);
    if (!pts.length) return;

    const col = seq.color;
    ctx.save();

    // Optionale Verbindungslinien
    if (seq.showLine) {
      ctx.strokeStyle = col + '55';
      ctx.lineWidth = bw(1);
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      let started = false;
      pts.forEach(p => {
        if (p.n < v.xmin - 1 || p.n > v.xmax + 1) { started = false; return; }
        const { cx, cy } = toCanvas(p.n, p.y);
        if (!started) { ctx.moveTo(cx, cy); started = true; } else { ctx.lineTo(cx, cy); }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Punkte
    pts.forEach(p => {
      if (p.n < v.xmin - 0.5 || p.n > v.xmax + 0.5) return;
      const { cx, cy } = toCanvas(p.n, p.y);
      if (cy < -10 || cy > h + 10) return; // ausserhalb y

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = bw(2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.38, 0, 2 * Math.PI);
      ctx.fillStyle = col;
      ctx.fill();
    });

    ctx.restore();
  });
}
