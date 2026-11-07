// ═══════════════════════════════════════════════════════════════════
// 51_fin_draw.js — Finanzmathematik: Bilder (Szenen) und Formelsatz
//
// Wie bei der Statistik baut jede Ansicht eine «Szene» (Rechteck, Linie, Kreis, Vieleck,
// Text), die auf den Canvas gemalt (42_stat_ui.js: statPaint) und als TikZ ausgegeben wird.
// Formeln stehen als «Rich»-Text in einer LaTeX-Teilmenge (\sum_{}^{}, ^{}, _{}, \frac{}{},
// \cdot, \col{b|r|v|g|o}{…} für Farben, \text{…}). Auf dem Canvas setzt sie finRichDraw,
// im TikZ-Export werden sie unverändert zu Mathematik ($\displaystyle …$).
// Treffer-Flächen (S.hits) dienen dem Überfahren/Anklicken in 52_fin_ui.js.
// ═══════════════════════════════════════════════════════════════════
const FIN_COL = { b: '#2f6fd0', r: '#d9486b', v: '#8a5cd0', g: '#2fa36b', o: '#f08a24' };
const FIN_TEXCOL = { b: 'blue!70!black', r: 'red!75!black', v: 'violet', g: 'green!50!black', o: 'orange!90!black' };

// ── Rich-Text: Parser ────────────────────────────────────────────────
const FIN_SYM = { cdot: '·', approx: '≈', le: '≤', ge: '≥', pm: '±', to: '→', dots: '...', ldots: '...', neq: '≠', infty: '∞', times: '×', Rightarrow: '⇒', Leftrightarrow: '⇔', pi: 'π', sigma: 'σ', mu: 'μ', log: 'log', ln: 'ln', div: '÷', cdots: '⋅⋅⋅', Delta: 'Δ', colon: ':', alpha: 'α', beta: 'β', gamma: 'γ', varphi: 'φ', phi: 'φ', theta: 'θ', lambda: 'λ', perp: '⊥', cap: '∩', circ: '∘', varepsilon: 'ε', delta: 'δ', setminus: '∖', infin: '∞', ne: '≠', mapsto: '↦', leftarrow: '←', in: '∈', notin: '∉', subset: '⊂', cup: '∪', emptyset: '∅', leftrightarrow: '↔', Leftarrow: '⇐', mid: '∣', sim: '∼', triangle: '△', parallel: '∥', angle: '∠' };
function finParse(s) {
  s = String(s).replace(/\^(?:\{\\circ\}|\\circ)/g, '°');                     // Gradzeichen: ^\circ bzw. ^{\circ}
  let i = 0;
  const name = () => { let n = ''; if (/[A-Za-z]/.test(s[i] || '')) { while (i < s.length && /[A-Za-z]/.test(s[i])) n += s[i++]; } else n = s[i++] || ''; return n; };
  // Klammerzeichen nach \left / \right: ( [ | . oder \{ \} \| \langle \rangle
  const delim = () => { const c = s[i++] || '.'; if (c !== '\\') return c; const n = name(); return n === '{' || n === 'lbrace' ? '{' : n === '}' || n === 'rbrace' ? '}' : n === '|' ? '‖' : n === 'langle' ? '⟨' : n === 'rangle' ? '⟩' : n === 'lfloor' ? '⌊' : n === 'rfloor' ? '⌋' : '.'; };
  const group = () => { while (s[i] === ' ') i++; if (s[i] === '{') { i++; return seq(true); } return [{ k: 't', s: s[i++] || '' }]; };
  function seq(stop, lr) {
    const out = [];
    while (i < s.length) {
      const c = s[i];
      if (c === '}') { i++; if (stop) return out; continue; }
      if (c === '{') { i++; out.push({ k: 'g', c: seq(true) }); continue; }
      if (c === '^' || c === '_') {
        i++; const arg = group(), key = c === '^' ? 'sup' : 'sub';
        { const l0 = out[out.length - 1]; if (l0 && l0.k === 't' && !l0.up && l0.s.length > 1) { const ch = l0.s.slice(-1); l0.s = l0.s.slice(0, -1); out.push({ k: 't', s: ch }); } }   // Hoch-/Tiefstellung gilt nur dem letzten Zeichen
        const last = out[out.length - 1];
        if (last && (last.k === 'sum')) { last[key === 'sup' ? 'hi' : 'lo'] = arg; continue; }
        if (last && last.k === 'ss' && !last[key]) { last[key] = arg; continue; }
        out.push({ k: 'ss', b: last ? [out.pop()] : [], sup: key === 'sup' ? arg : null, sub: key === 'sub' ? arg : null });
        continue;
      }
      if (c === '\\') {
        i++; const n = name();
        if (n === 'frac') { const a = group(), b = group(); out.push({ k: 'frac', n: a, d: b }); }
        else if (n === 'binom') { const a = group(), b = group(); out.push({ k: 'lr', l: '(', r: ')', b: [{ k: 'frac', n: a, d: b, nobar: true }] }); }
        else if (n === 'sum') out.push({ k: 'sum', hi: null, lo: null });
        else if (n === 'int') out.push({ k: 'sum', int: true, hi: null, lo: null });
        else if (n === 'col') { const cc = group(), body = group(); out.push({ k: 'col', c: cc[0] ? cc[0].s : 'b', b: body }); }
        else if (n === 'text') { const g = group(); out.push({ k: 't', s: g.map(x => x.s || '').join(''), up: true }); }
        else if (n === 'sqrt') { let idx = null; if (s[i] === '[') { i++; let t = ''; while (i < s.length && s[i] !== ']') t += s[i++]; i++; idx = finParse(t); } out.push({ k: 'sqrt', b: group(), idx }); }
        else if (n === 'mathbb') { const g = group(); const map = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ' }; out.push({ k: 't', s: g.map(x => (x.s || '').split('').map(ch => map[ch] || ch).join('')).join(''), up: true }); }
        else if (n === 'left') { const l = delim(), rr = { d: null }, inner = seq(false, rr); out.push({ k: 'lr', l, r: rr.d, b: inner }); }
        else if (n === 'right') { const d = delim(); if (lr) { lr.d = d; return out; } if (d !== '.') out.push({ k: 't', s: d }); }
        else if (n === 'Big' || n === 'big' || n === 'Bigg' || n === 'bigg') { /* Grössenbefehl: Zeichen folgt */ }
        else if (n === ',') out.push({ k: 't', s: '\u2009' });
        else if (n === ' ' || n === ';' || n === ':') out.push({ k: 't', s: '\u2004' });
        else if (n === 'quad') out.push({ k: 't', s: '\u2003' });
        else if (n === 'qquad') out.push({ k: 't', s: '\u2003\u2003' });
        else if (n === 'log' || n === 'ln' || n === 'lim' || n === 'sin' || n === 'cos' || n === 'tan' || n === 'arctan' || n === 'arcsin' || n === 'arccos' || n === 'min' || n === 'max') { out.push({ k: 't', s: n, up: true }); out.push({ k: 't', s: '\u2009' }); }
        else if (n === '%') out.push({ k: 't', s: '%' });
        else if (FIN_SYM[n] !== undefined) out.push({ k: 't', s: FIN_SYM[n] });
        else out.push({ k: 't', s: n });
        continue;
      }
      let j = i; while (j < s.length && '^_{}\\'.indexOf(s[j]) < 0) j++;
      out.push({ k: 't', s: s.slice(i, j) }); i = j;
    }
    return out;
  }
  return seq(false);
}

// ── Rich-Text: Messen und Zeichnen (LaTeX-nah: KaTeX-Schriften, Abstände wie TeX) ──
// Schriften: KaTeX_Main (Ziffern, Operatoren, \text), KaTeX_Math kursiv (Variablen), KaTeX_Size1–4 (grosse Klammern),
// KaTeX_Size2 (grosses ∑ im Display-Stil). Sie stammen aus mathlive-static.css (fonts/). Solange sie noch laden, gelten Ersatzschriften.
const FIN_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
const FIN_FM = 'KaTeX_Main,"Latin Modern Roman","STIX Two Text",Times,"Times New Roman",serif';
const FIN_FI = 'KaTeX_Math,"Latin Modern Math","STIX Two Text",Times,"Times New Roman",serif';
const FIN_MK = 1.1;                                   // KaTeX-Schriften wirken bei gleicher Grösse kleiner als Systemschrift
let _finMc = null;
function finMctx() { if (!_finMc && typeof document !== 'undefined') _finMc = document.createElement('canvas').getContext('2d'); return _finMc; }
function finMeasure(s, size, bold) {
  try {
    const c = finMctx();
    if (c) { c.font = (bold ? '600 ' : '') + size + 'px ' + FIN_FONT; return c.measureText(s).width; }
  } catch (e) {}
  let w = 0; for (const ch of s) w += /[\s ]/.test(ch) ? size * 0.3 : /[0-9.,]/.test(ch) ? size * 0.55 : size * 0.58; return w;
}
// Schrift-String für eine Mathe-Schriftart: 'm' Main, 'i' Math kursiv, '1'…'4' Size1…4
function finFontStr(f, px, bold) {
  if (f === 'i') return 'italic ' + (bold ? '700 ' : '400 ') + px + 'px ' + FIN_FI;
  if (f >= '1' && f <= '4') return '400 ' + px + 'px KaTeX_Size' + f + ',' + FIN_FM;
  return (bold ? '700 ' : '400 ') + px + 'px ' + FIN_FM;
}
function finMW(f, s, px, bold) {                      // Breite von s in Schriftart f
  try { const c = finMctx(); if (c) { c.font = finFontStr(f, px, bold); return c.measureText(s).width; } } catch (e) {}
  let w = 0; for (const ch of s) w += /[0-9]/.test(ch) ? px * 0.5 : /[\s ]/.test(ch) ? px * 0.25 : ch === '(' || ch === ')' ? px * 0.39 : /[+\-−=<>≈≤≥⇒·⋅±×÷]/.test(ch) ? px * 0.78 : px * 0.55; return w;
}
const FIN_BIN = '+−·⋅×÷±', FIN_REL = '=≈≤≥≠⇒⇔→<>';
const FIN_ITAL = { K: .07, N: .14, T: .14, V: .22, W: .14, Y: .22, X: .08, Z: .07, C: .07, D: .03, E: .06, F: .14, I: .14, J: .09, M: .14, O: .03, P: .14, R: .014, S: .07, U: .11, B: .05, r: .03, f: .11, k: .03, q: .04, y: .03, z: .04, l: .02, g: .03, j: .06, v: .04, w: .03, p: 0, n: 0, x: 0 };
// Letzter Teil «Operand»? (für die Entscheidung binäres/unäres Vorzeichen)
function finEndsOperand(n) {
  if (n.k === 't') { if (n.up) return true; const s = n.s.replace(/[\s  ]+$/, ''); return !!s && /[A-Za-z0-9α-ω)\].%]/.test(s[s.length - 1]); }
  if (n.k === 'g' || n.k === 'col') { const c = n.k === 'g' ? n.c : n.b; return c.length ? finEndsOperand(c[c.length - 1]) : false; }
  return n.k === 'ss' || n.k === 'frac' || n.k === 'sqrt' || n.k === 'lr';
}
function finBox(nodes, size, bold, M, sc) {
  const parts = []; let po = false;
  nodes.forEach(n => { const p = finBoxOne(n, size, bold, M, sc, po); parts.push(p); po = n.k === 'sum' ? false : finEndsOperand(n); });
  const m = size * FIN_MK;
  let w = 0, a = m * 0.5, d = m * 0.15; parts.forEach(p => { w += p.w; a = Math.max(a, p.a); d = Math.max(d, p.d); });
  return { w, a, d, draw(x, y, c) { let xx = x; parts.forEach(p => { p.draw(xx, y, c); xx += p.w; }); } };
}
// Wörter in \text{…} werden wie anderer Text übersetzt (Zahlen und Einheiten wie « CHF» bleiben)
function finTrText(s) {
  try {
    if (typeof statTr !== 'function' || !/[A-Za-zÄÖÜäöüß]{4,}/.test(s) || /^\s*CHF\s*$/.test(s)) return s;
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim();
    return lead + statTr(core) + trail;
  } catch (e) { return s; }
}
// Textknoten in Mathe-Satz zerlegen: Läufe (Schriftart, Text) und Abstände
function finTextItems(s, up, m, sc, po) {
  const items = []; let cur = null;
  const flush = () => { if (cur) { items.push(cur); cur = null; } };
  const put = (f, ch) => { if (cur && cur.f === f) cur.s += ch; else { flush(); cur = { f, s: ch }; } };
  const gap = em => { flush(); items.push({ gap: em * m }); };
  if (up) { put('m', s); flush(); return items; }
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === ' ') continue;                              // Leerzeichen zählen im Mathe-Satz nicht (\  steht als  )
    if (ch === ' ') { gap(0.28); po = false; continue; }
    if (ch === ' ') { gap(0.167); continue; }
    if (ch === ' ') { gap(0.222); continue; }
    if (FIN_BIN.indexOf(ch) >= 0) {
      const bin = po, g = (bin && !sc) ? 0.222 : 0; if (g) gap(g);
      put('m', ch === '·' ? '⋅' : ch); if (g) gap(g); po = false; continue;
    }
    if (FIN_REL.indexOf(ch) >= 0) { const g = sc ? 0 : 0.278; if (g) gap(g); put('m', ch); if (g) gap(g); po = false; continue; }
    if (/[A-Za-zα-ωΑ-Ω]/.test(ch)) { put('i', ch); po = true; continue; }
    put('m', ch);
    po = /[0-9)\].%]/.test(ch) || (ch.charCodeAt(0) > 127 && /\p{L}/u.test(ch));
    if (ch === ',') { gap(0.167); po = false; }
  }
  flush(); return items;
}
function finBoxOne(n, size, bold, M, sc, po) {
  const m = size * FIN_MK, ax = m * 0.25;
  if (n.k === 't') {
    const sx = n.up ? finTrText(n.s) : n.s.replace(/-/g, '−'), items = finTextItems(sx, !!n.up, m, sc, po);
    let w = 0; items.forEach(it => { it.x = w; it.w = it.gap !== undefined ? it.gap : finMW(it.f, it.s, m, bold); w += it.w; });
    return { w, a: m * 0.72, d: m * 0.2, draw(x, y, c) {
      ctx.fillStyle = c;
      items.forEach(it => { if (it.gap === undefined) { ctx.font = finFontStr(it.f, m, bold); ctx.fillText(it.s, x + it.x, y); } });
    } };
  }
  if (n.k === 'g') return finBox(n.c, size, bold, M, sc);
  if (n.k === 'col') { const bx = finBox(n.b, size, bold, M, sc), cc = FIN_COL[n.c] || n.c; return { w: bx.w, a: bx.a, d: bx.d, draw(x, y) { bx.draw(x, y, cc); } }; }
  if (n.k === 'ss') {
    const b = finBox(n.b, size, bold, M, sc), sp = n.sup ? finBox(n.sup, size * 0.7, bold, M, true) : null, sb = n.sub ? finBox(n.sub, size * 0.7, bold, M, true) : null;
    const chr = n.b.length === 1 && n.b[0].k === 't', last = chr ? n.b[0].s.slice(-1) : '';
    const ic = sp && chr && !n.b[0].up ? (FIN_ITAL[last] || 0) * m : 0;                 // Kursivkorrektur nur vor dem Exponenten
    let up = 0, dn = 0;
    if (sp) { up = Math.max(0.413 * m, chr ? 0 : b.a - 0.27 * m, sp.d + 0.108 * m); }
    if (sb) { dn = Math.max(sp ? 0.247 * m : 0.15 * m, chr ? 0 : b.d + 0.035 * m, sb.a - 0.8 * m); }
    const ws = Math.max(sp ? sp.w + ic : 0, sb ? sb.w : 0) + m * 0.03;
    return { w: b.w + ws, a: Math.max(b.a, sp ? sp.a + up : 0), d: Math.max(b.d, sb ? sb.d + dn : 0), draw(x, y, c) {
      b.draw(x, y, c); if (sp) sp.draw(x + b.w + ic, y - up, c); if (sb) sb.draw(x + b.w, y + dn, c); } };
  }
  if (n.k === 'frac') {
    const fz = size * 0.94, nu = finBox(n.n, fz, bold, M, sc), de = finBox(n.d, fz, bold, M, sc), t = n.nobar ? 0 : Math.max(1, m * 0.045), gp = n.nobar ? m * 0.12 : m * 0.16;
    const w = Math.max(nu.w, de.w) + m * 0.2, yn = ax + t / 2 + gp + nu.d, yd = -ax + t / 2 + gp + de.a;       // Grundlinien relativ zu y (nach oben positiv / nach unten positiv)
    return { w, a: yn + nu.a, d: yd + de.d, draw(x, y, c) {
      nu.draw(x + (w - nu.w) / 2, y - yn, c); de.draw(x + (w - de.w) / 2, y + yd, c);
      if (t) { ctx.fillStyle = c; ctx.fillRect(x + m * 0.05, y - ax - t / 2, w - m * 0.1, t); } } };
  }
  if (n.k === 'sqrt') {
    const b = finBox(n.b, size, bold, M, sc), sw = m * 0.6, t = Math.max(1, m * 0.05);
    const ix = n.idx && n.idx.length ? finBox(n.idx, size * 0.6, bold, M, sc) : null, iw = ix ? Math.max(0, ix.w - sw * 0.25) : 0;   // Wurzelexponent links oben
    return { w: b.w + sw + m * 0.05 + iw, a: Math.max(b.a + m * 0.12, ix ? ix.a + m * 0.35 : 0), d: b.d, draw(x, y, c) {
      if (ix) ix.draw(x, y - m * 0.35, c);
      x += iw;
      ctx.strokeStyle = c; ctx.lineWidth = t; ctx.lineJoin = 'miter'; ctx.beginPath();
      ctx.moveTo(x + m * 0.04, y - m * 0.28); ctx.lineTo(x + sw * 0.32, y - m * 0.3); ctx.lineTo(x + sw * 0.55, y + b.d * 0.7 + m * 0.02); ctx.lineTo(x + sw * 0.9, y - b.a - m * 0.08); ctx.lineTo(x + sw + b.w + m * 0.05, y - b.a - m * 0.08); ctx.stroke();
      b.draw(x + sw, y, c); } };
  }
  if (n.k === 'lr') {                                  // \left( … \right) mit wachsenden Klammern (KaTeX_Main → Size1…Size4)
    const b = finBox(n.b, size, bold, M, sc), delta = Math.max(b.a - ax, b.d + ax), need = Math.max(m, 2 * delta * 0.92);
    const H = [1.0, 1.2, 1.8, 2.4, 3.0], WID = [0.39, 0.46, 0.60, 0.74, 0.79];
    let lv = 0; while (lv < 4 && H[lv] * m < need) lv++;
    const sy = H[lv] * m < need ? need / (H[lv] * m) : 1, half = Math.max(need, H[lv] * m * sy) / 2;
    const wl = n.l === '.' ? 0 : WID[lv] * m, wr = n.r === '.' || !n.r ? 0 : WID[lv] * m;
    const fnt = finFontStr(lv === 0 ? 'm' : String(lv), m, bold), cm = { '<': '⟨', '>': '⟩' };
    const dr = (ch, x, y, c) => { if (!ch || ch === '.') return; ctx.font = fnt; ctx.fillStyle = c; if (sy === 1) ctx.fillText(ch, x, y); else { ctx.save(); ctx.translate(x, y - ax); ctx.scale(1, sy); ctx.fillText(ch, 0, ax); ctx.restore(); } };
    return { w: wl + b.w + wr , a: Math.max(b.a, ax + half), d: Math.max(b.d, half - ax), draw(x, y, c) {
      dr(cm[n.l] || n.l, x, y, c); b.draw(x + wl, y, c); dr(cm[n.r] || n.r, x + wl + b.w, y, c); } };
  }
  if (n.k === 'sum' && n.int) {                        // Integralzeichen (KaTeX_Size2): Grenzen rechts, oben und unten
    const gw = 0.56 * m, ga = 1.2 * m, gd = 0.75 * m, gap = 0.1 * m;
    const hi = n.hi ? finBox(n.hi, size * 0.7, bold, M, true) : null, lo = n.lo ? finBox(n.lo, size * 0.7, bold, M, true) : null;
    const xh = m * 0.95, xl = m * 0.6;
    const w = Math.max(xh + (hi ? hi.w : 0), xl + (lo ? lo.w : 0), m * 0.95) + m * 0.12;
    return { w, a: Math.max(ga, hi ? ga * 0.78 + hi.a : 0), d: Math.max(gd, lo ? gd * 0.9 + lo.d : 0), draw(x, y, c) {
      ctx.font = finFontStr('2', m, bold); ctx.fillStyle = c; ctx.fillText('\u222B', x, y + 0.14 * m);
      if (hi) hi.draw(x + xh, y - ga * 0.78, c);
      if (lo) lo.draw(x + xl, y + gd * 0.9, c); } };
  }
  if (n.k === 'sum') {                                 // Display-Stil: grosses ∑ (KaTeX_Size2, auf der Achse zentriert), Grenzen darüber/darunter
    const gw = 1.444 * m, ga = 0.95 * m, gd = 0.45 * m, gap = 0.12 * m;
    const hi = n.hi ? finBox(n.hi, size * 0.7, bold, M, true) : null, lo = n.lo ? finBox(n.lo, size * 0.7, bold, M, true) : null;
    const w = Math.max(gw, hi ? hi.w : 0, lo ? lo.w : 0) + m * 0.1;
    return { w, a: ga + (hi ? gap + hi.d + hi.a : 0), d: gd + (lo ? gap + lo.a + lo.d : 0), draw(x, y, c) {
      ctx.font = finFontStr('2', m, bold); ctx.fillStyle = c; ctx.fillText('∑', x + (w - gw) / 2, y);
      if (hi) hi.draw(x + (w - hi.w) / 2, y - ga - gap - hi.d, c);
      if (lo) lo.draw(x + (w - lo.w) / 2, y + gd + gap + lo.a, c); } };
  }
  return { w: 0, a: 0, d: 0, draw() {} };
}
// Schriften laden (erst beim ersten Zeichnen); danach neu zeichnen, damit die Formeln mit den richtigen Massen stehen
let _finFontsStarted = false;
function finLoadFonts() {
  _finFontsStarted = true;
  try {
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return;
    const L = ['400 20px KaTeX_Main', '700 20px KaTeX_Main', 'italic 400 20px KaTeX_Math', 'italic 700 20px KaTeX_Math', '400 20px KaTeX_Size1', '400 20px KaTeX_Size2', '400 20px KaTeX_Size3', '400 20px KaTeX_Size4'];
    Promise.all(L.map(f => document.fonts.load(f, 'x(∑1').catch(() => []))).then(() => { if (typeof scheduleDraw === 'function') scheduleDraw(); });
  } catch (e) {}
}
// Rich-Text messen: {w, a, d}
function finRichSize(s, size, bold) { const b = finBox(finParse(s), size, bold, finMeasure); return { w: b.w, a: b.a, d: b.d, h: b.a + b.d }; }
// Zeichnen (p: Szenenteil mit s, x, y, size, col, al, bold); colFn wandelt Farbtoken in Farbe
function finRichDraw(p, colFn) {
  if (!_finFontsStarted) finLoadFonts();
  const b = finBox(finParse(p.s), p.size, p.bold, finMeasure);
  const x = p.al === 'c' ? p.x - b.w / 2 : p.al === 'r' ? p.x - b.w : p.x;
  const by = p.bs === 't' ? p.y + b.a : p.bs === 'b' ? p.y - b.d : p.y + (b.a - b.d) / 2;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; b.draw(x, by, colFn(p.col));
}
// TikZ: Rich-Text ist schon LaTeX
function finTexBinom(o) {                              // \binom{a}{b} → {a \choose b} (ohne amsmath)
  let out = '', i = 0;
  while (i < o.length) {
    const j = o.indexOf('\\binom', i); if (j < 0) { out += o.slice(i); break; }
    out += o.slice(i, j); let p = j + 6;
    const grp = () => { while (o[p] === ' ') p++; if (o[p] !== '{') return o[p++] || ''; let d = 1; const st = ++p; while (p < o.length && d) { if (o[p] === '{') d++; else if (o[p] === '}') d--; p++; } return o.slice(st, p - 1); };
    const a = grp(), b = grp(); out += '{' + finTexBinom(a) + '\\choose ' + finTexBinom(b) + '}'; i = p;
  }
  return out;
}
function finRichTex(s) {
  let o = finTexBinom(String(s)).replace(/\\text\{([^{}]*)\}/g, (m, c) => '\\text{' + finTrText(c).replace(/°/g, '\\textdegree{}') + '}');
  o = o.replace(/\\col\{([a-z])\}/g, (m, c) => '\\textcolor{' + (FIN_TEXCOL[c] || 'black') + '}');
  o = o.replace(/\u2009/g, '\\,').replace(/−/g, '-').replace(/≈/g, '\\approx ').replace(/·/g, '\\cdot ').replace(/°/g, '^{\\circ}').replace(/✓/g, '\\checkmark ').replace(/✗/g, '\\times ');
  return '$\\displaystyle ' + o + '$';
}

// ── Szene mit Treffer-Flächen ────────────────────────────────────────
function finScene() {
  const S = stScene(); S.hits = [];
  S.hit = (x, y, w, h, o) => { S.hits.push(Object.assign({ x, y, w, h }, o)); };
  S.rich = (x, y, s, o) => { S.p.push(Object.assign({ t: 'text', x, y, s: String(s), rich: true }, o || {})); };
  return S;
}
// Zahlen für Rich-Text (Tausender mit \,; Minus ASCII)
const finRM = v => Fin.money(v).replace(/\u2009/g, '\\,').replace(/−/g, '-');
const finRN = (v, d) => Fin.num(v, d).replace(/−/g, '-');
const finRMr = v => Fin.money(v, 0).replace(/\u2009/g, '\\,').replace(/−/g, '-');   // ganze Franken
// Betrag ohne Rappen, wenn ganzzahlig
const finAmtR = v => (Math.abs(v - Math.round(v)) < 1e-9 ? finRMr(v) : finRM(v));
const finAmt = v => (Math.abs(v - Math.round(v)) < 1e-9 ? Fin.money(v, 0) : Fin.money(v));

// Umbruch von Rich-Summanden: Zeilen mit höchstens maxW Breite; Trennzeichen am Zeilenanfang
function finWrap(termsR, sep, maxW, size) {
  const lines = []; let cur = '', curW = 0;
  termsR.forEach((t, i) => {
    const piece = (i > 0 ? sep : '') + t, w = finRichSize(piece, size).w;
    if (cur && curW + w > maxW) { lines.push(cur); cur = (sep + t); curW = finRichSize(cur, size).w; }
    else { cur += piece; curW += w; }
  });
  if (cur) lines.push(cur);
  return lines;
}

// ── Zeitstrahl ───────────────────────────────────────────────────────
// o: {N, T, pay:[{t,a,label,i,col,k}], lab(t), axisY, hover, showAmt, tickHits, pad, unitLabel}
function finTimeline(S, r, o, C) {
  const fs = C.fs, N = Math.max(1, o.N), padL = o.padL === undefined ? fs * 3.6 : o.padL, padR = fs * 2.6;
  const X = t => r.x + padL + (r.w - padL - padR) * t / N, ay = o.axisY, L = fs * 2.5;
  S.line(r.x + fs * 0.6, ay, r.x + r.w - fs * 0.8, ay, { col: 'L', lw: 2 });
  S.poly([[r.x + r.w - fs * 0.8 - fs * 0.6, ay - fs * 0.3], [r.x + r.w - fs * 0.8, ay], [r.x + r.w - fs * 0.8 - fs * 0.6, ay + fs * 0.3]], { col: 'L', lw: 1.6, fill: 'L', close: true });
  const per = (r.w - padL - padR) / N, skip = Math.max(1, Math.ceil(fs * (o.labW || 3.0) / per));
  const negAt = {}; o.pay.forEach(z => { if (z.a < 0) negAt[z.t] = true; });
  for (let t = 0; t <= N; t++) {
    S.line(X(t), ay - 4, X(t), ay + 4, { col: 'L', lw: 1.4 });
    if (t % skip === 0 || t === N) S.text(X(t), negAt[t] ? ay - fs * 1.0 : ay + fs * 1.05, o.lab(t), { size: fs * 0.88, col: 'M', al: 'c', bs: 'm' });
    if (o.tickHits) S.hit(X(t) - per / 2, ay - L - fs * 2, per, L * 2 + fs * 4, { kind: 'tick', t });
  }
  if (o.unitLabel) S.text(r.x + r.w - fs * 0.8, ay - fs * (negAt[N] ? 2.1 : 1.1), o.unitLabel, { size: fs * 0.85, col: 'M', al: 'r', bs: 'm' });
  const maxArrows = o.maxArrows || 99;
  o.pay.forEach((z, idx) => {
    if (idx >= maxArrows) return;
    const x = X(z.t), up = z.a >= 0, hov = o.hover === z.i, c = z.col || (up ? ST_B : ST_O), lw = hov ? 3.4 : 2.2;
    const y0 = up ? ay - fs * 0.55 : ay + fs * 0.55, y1 = up ? ay - L : ay + L, hd = fs * 0.55;
    if (hov) S.rect(x - fs * 1.6, Math.min(y0, y1) - fs * 1.4, fs * 3.2, Math.abs(y1 - y0) + fs * 2.4, { fill: ST_V, a: 0.12, r: 6 });
    S.line(x, y0, x, y1, { col: c, lw });
    const tipY = up ? y0 : y1;                                 // Einzahlung: Spitze an der Achse; Auszahlung: Spitze am unteren Ende (beide zeigen nach unten)
    S.poly([[x - hd * 0.6, tipY - hd], [x, tipY + 1], [x + hd * 0.6, tipY - hd]], { col: c, lw: 1, fill: c, close: true });
    if (z.label !== undefined && z.label !== '') S.text(x, up ? y1 - fs * 0.5 : y1 + fs * 0.6, z.label, { size: fs * (z.big ? 1.0 : 0.88), col: z.lcol || c, al: 'c', bs: 'm', bold: !!z.bold });
    if (z.i !== undefined) S.hit(x - fs * 1.3, Math.min(y0, y1) - fs * 1.2, fs * 2.6, Math.abs(y1 - y0) + fs * 2.2, { kind: 'pay', i: z.i });
  });
  if (o.pay.length > maxArrows) S.text(r.x + r.w - fs * 3, ay - L * 0.5, '…', { size: fs * 1.4, col: 'M', al: 'c', bs: 'm' });
  if (o.T !== undefined && o.T !== null) {
    const x = X(o.T);
    if (o.dashBottom) S.line(x, ay + fs * 0.7, x, o.dashBottom, { col: ST_R, lw: 1.2, dash: true });
    S.circ(x, ay, fs * 0.62, { fill: '#ffe066', stroke: ST_R, lw: 1.6 });
    S.text(x, ay, o.Tlabel || '?', { size: fs * 0.9, col: '#6b2a00', al: 'c', bs: 'm', bold: true });
  }
  return { X, ay, per };
}

// ── Konten-Spuren: jede Zahlung hat ihr eigenes Konto (Linie von der Zahlung bis T) ──
function finLanes(S, r, y0, step, pay, T, rr, fmtFactor, o, C) {
  const fs = C.fs, Xf = o.X;
  pay.forEach((z, j) => {
    const y = y0 + j * step, x1 = Xf(z.t), x2 = Xf(T), hov = o.hover === z.i, c = z.col || (z.a >= 0 ? ST_B : ST_O);
    if (hov) S.rect(r.x + fs * 0.4, y - step * 0.5, r.w - fs * 0.8, step, { fill: ST_V, a: 0.12, r: 4 });
    S.circ(x1, y, fs * 0.32, { fill: c });
    S.text(x1 - fs * 0.6, y, z.label2 || z.label, { size: fs * 0.88, col: c, al: 'r', bs: 'm', bold: hov });
    if (z.t !== T) {
      const dir = x2 > x1 ? 1 : -1;
      S.line(x1, y, x2, y, { col: c, lw: hov ? 2.6 : 1.6, a: 0.9 });
      S.poly([[x2 - dir * fs * 0.6, y - fs * 0.3], [x2, y], [x2 - dir * fs * 0.6, y + fs * 0.3]], { col: c, lw: 1, fill: c, close: true });
      S.rich((x1 + x2) / 2, y - step * 0.32, fmtFactor(z), { size: fs * 0.88, col: 'T', al: 'c', bold: hov });
    } else S.rich(x1 + fs * 0.9, y, fmtFactor(z), { size: fs * 0.88, col: 'T', al: 'l' });
    S.hit(r.x, y - step * 0.5, r.w, step, { kind: 'pay', i: z.i });
  });
}

const FIN_SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '−': '⁻' };
const finSup = k => String(k).split('').map(c => FIN_SUP[c] || c).join('');
const finPow = (rt, k) => (k === 0 ? '1' : k === 1 ? rt : rt + '^{' + k + '}');          // Rich: Potenz ohne Exponent 1
const FIN_LAYOUT_PAD = fs => Math.round(fs * 0.7);

// ═══════════════════════════════════════════════════════════════════
// Ansicht 1: Zeitstrahl und verschiedene Konti
// ═══════════════════════════════════════════════════════════════════
const FIN_SCENES = {};
function finSceneLine(S, W, H, C) {
  const P = C.P, fs = C.fs, pad = FIN_LAYOUT_PAD(fs), q = Fin.factor(P.p), N = P.N, T = P.T, rt = Fin.rText(P.p);
  let pay = P.pay.map((z, i) => ({ t: z.t, a: z.a, i, x: !!(P.solve && P.xi === i) }));
  let xval = null;
  if (P.solve && pay[P.xi]) { pay[P.xi].a = 0; xval = Fin.solveUnknown(pay.map(z => ({ t: z.t, a: z.a })), P.xi, q, T, P.target); pay[P.xi].a = xval; }
  pay.sort((a, b) => a.t - b.t || a.i - b.i);
  const lab = t => (P.years ? String(P.startYear + t) : String(t));
  const hasNeg = pay.some(z => z.a < 0), L = fs * 2.5;
  pay.forEach(z => { z.label = z.x ? 'x' : finAmt(Math.abs(z.a)); z.label2 = z.x ? 'x' : finAmt(z.a); z.bold = z.x; });
  // oben: Zeitstrahl, darunter Spuren
  const tTop = pad, axisY = tTop + L + fs * 2.0, lane0 = axisY + (hasNeg ? L + fs * 2.4 : fs * 2.6);
  const laneStep = Math.max(fs * 1.5, Math.min(fs * 2.3, (H * 0.5 - lane0) / Math.max(1, pay.length)));
  const topH = lane0 + pay.length * laneStep + pad * 0.5;
  const rTop = { x: pad, y: 0, w: W - 2 * pad, h: topH };
  const tl = finTimeline(S, rTop, { N, T, pay, lab, axisY, hover: C.hover, tickHits: true, unitLabel: P.years ? '' : 'Jahre', dashBottom: lane0 + pay.length * laneStep - laneStep * 0.45 }, C);
  S.text(rTop.x + fs * 0.2, tTop + fs * 0.3, 'Zeitstrahl: Einzahlungen oberhalb, Auszahlungen unterhalb der Achse (Klick auf einen Zeitpunkt: Zahlung hinzufügen)', { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
  const factorR = z => finPow(rt, T - z.t);
  finLanes(S, rTop, lane0, laneStep, pay, T, q, factorR, { X: tl.X, hover: C.hover }, C);
  // unten: Tabelle und Rechnung
  const by = topH + pad, bh = H - by - pad;
  if (bh < fs * 6) return;
  const tm = Fin.terms(pay.map(z => ({ t: z.t, a: z.a })), q, T);
  const cols = [{ h: 'Zahlung', w: 6.2, al: 'l' }, { h: 'Zeit', w: 4.2 }, { h: 'k', w: 3 }, { h: 'Faktor', w: 6.6 }, { h: 'Wert bei ' + (P.years ? P.startYear + T : T), w: 7.8 }];
  const rows = tm.map((x, j) => { const rw = [pay[j].x ? 'x = ' + Fin.money(pay[j].a) : Fin.money(x.a), lab(x.t), String(x.k), (x.k === 0 ? '1' : x.k === 1 ? rt : rt + finSup(x.k)), Fin.money(x.v)]; rw.col = [pay[j].a >= 0 ? ST_B : ST_O, null, ST_V, null, null]; return rw; });
  rows.push(['Summe', '', '', '', Fin.money(tm.reduce((s, x) => s + x.v, 0))]);
  const rowsF = rows.length > 12 ? rows.slice(0, 11).concat([rows[rows.length - 1]]) : rows;
  const tw = Math.min(W * 0.55, cols.reduce((a, c) => a + c.w, 0) * fs), tfs = Math.min(fs, (bh - fs * 1.5) / ((rowsF.length + 1) * 1.75), tw / cols.reduce((a, c) => a + c.w, 0));
  const hl = rowsF.findIndex((x, j) => j < rowsF.length - 1 && C.hover === pay[j].i);
  stTable(S, rTop.x + fs * 0.2, by, cols, rowsF, { fs: tfs, hl: hl >= 0 ? hl : undefined, sum: true }, C);
  // Rechenausdruck
  const rx = rTop.x + tw + pad * 2, rw2 = W - rx - pad;
  if (rw2 > fs * 12) {
    let y = by;
    const total = tm.reduce((s, x) => s + x.v, 0), cm = '\\text{ CHF}';
    S.text(rx, y + fs * 0.5, 'Jede Zahlung liegt auf einem eigenen Konto:', { size: fs * 0.9, col: 'T', al: 'l', bs: 'm', bold: true }); y += fs * 1.5;
    S.text(rx, y + fs * 0.4, 'einzeln auf- bzw. abzinsen, am Schluss addieren.', { size: fs * 0.88, col: 'M', al: 'l', bs: 'm' }); y += fs * 1.9;
    const termsR = tm.map((x, j) => (pay[j].x ? 'x' : finAmtR(Math.abs(x.a))) + (x.k === 0 ? '' : '\\cdot' + finPow(rt, x.k)));
    const signs = tm.map(x => x.a < 0);
    let ex = ''; termsR.forEach((t, j) => { ex += (j === 0 ? (signs[j] ? '-' : '') : (signs[j] ? '-' : '+')) + t; });
    const parts = []; let acc = '', accW = 0;
    termsR.forEach((t, j) => { const piece = (j === 0 ? (signs[j] ? '-' : '') : (signs[j] ? '-' : '+')) + t, w = finRichSize(piece, fs).w; if (acc && accW + w > rw2) { parts.push(acc); acc = ''; accW = 0; } acc += piece; accW += w; });
    if (acc) parts.push(acc);
    parts.slice(0, 4).forEach(pt => { S.rich(rx, y + fs * 0.6, pt, { size: fs, col: 'T', al: 'l' }); y += fs * 1.9; });
    if (P.solve && xval !== null) {
      S.rich(rx, y + fs * 0.6, '\\col{g}{x}=' + finRM(xval) + cm, { size: fs * 1.25, col: 'T', al: 'l', bold: true }); y += fs * 2.2;
      S.text(rx, y + fs * 0.5, 'Wert zum Zeitpunkt ' + (P.years ? P.startYear + T : T) + ' soll ' + Fin.money(P.target) + ' CHF sein', { size: fs * 0.88, col: 'M', al: 'l', bs: 'm' });
    } else {
      S.rich(rx, y + fs * 0.7, '\\approx ' + finRM(total) + cm, { size: fs * 1.25, col: ST_V, al: 'l', bold: true }); y += fs * 2.2;
      S.text(rx, y + fs * 0.4, 'Zinssatz ' + Fin.pct(P.p, 3) + ' → Zinsfaktor r = ' + rt, { size: fs * 0.88, col: 'M', al: 'l', bs: 'm' });
      if (C.hoverInfo) { y += fs * 1.7; S.rich(rx, y + fs * 0.5, C.hoverInfo, { size: fs * 0.9, col: ST_V, al: 'l' }); }
    }
  }
}
FIN_SCENES.line = finSceneLine;

// ═══════════════════════════════════════════════════════════════════
// Ansicht 2: Zeitstrahl und Summenzeichen (Ratenfolge R, Auf- oder Abzinsen)
// ═══════════════════════════════════════════════════════════════════
function finSumSetup(P) {
  const H = P.H, t1 = P.first, t2 = P.last === 0 ? H - 1 : H, dir = P.dir, T = dir === 'auf' ? H : 0, q = Fin.factor(P.p);
  const lim = Fin.sumLimits(t1, t2, T);
  let R = P.R;
  if (P.solve) R = Fin.rateFor(P.target, q, t1, t2, T);
  return { H, t1, t2, T, q, lim, R, n: t2 - t1 + 1, value: Fin.rateSeries(R, q, t1, t2, T).value };
}
function finSceneSum(S, W, H0, C) {
  const P = C.P, fs = C.fs, pad = FIN_LAYOUT_PAD(fs), su = finSumSetup(P), q = su.q, rt = Fin.rText(P.p), lim = su.lim;
  const cm = '\\text{ CHF}', ab = su.lim.kind === 'ab', sg = ab ? '-' : '';
  const pay = []; for (let t = su.t1; t <= su.t2; t++) {
    const k = ab ? t - su.T : su.T - t;
    pay.push({ t, a: su.R, i: t - su.t1, k, label: (su.n <= 12 || t === su.t1 || t === su.t2) ? String(k) : '', col: t === su.t1 ? (ab ? ST_B : ST_R) : t === su.t2 ? (ab ? ST_R : ST_B) : ST_B, lcol: t === su.t1 ? (ab ? FIN_COL.b : FIN_COL.r) : t === su.t2 ? (ab ? FIN_COL.r : FIN_COL.b) : null, bold: t === su.t1 || t === su.t2 });
  }
  pay.forEach(z => { if (!z.lcol) z.lcol = null; });
  const L = fs * 2.5, axisY = pad + L + fs * 2.4, rTop = { x: pad, y: 0, w: W - 2 * pad, h: axisY + fs * 3 };
  const tl = finTimeline(S, rTop, { N: su.H, T: su.T, pay, lab: t => String(t), axisY, hover: C.hover, unitLabel: 'Jahre', maxArrows: 40 }, C);
  S.text(rTop.x + fs * 0.2, pad + fs * 0.3, 'Über jedem Pfeil: wie oft die Zahlung ' + (ab ? 'abgezinst' : 'verzinst') + ' wird (Exponent k)', { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
  const fx = Math.max(pad, rTop.x + fs * 0.2);
  let y = rTop.h + pad * 0.4;
  // Summe in Farben wie im Dossier
  const cs = '\\col{v}{k}', clo = '\\col{b}{' + lim.lo + '}', chi = '\\col{r}{' + lim.hi + '}';
  const term = '\\col{g}{' + finAmtR(su.R) + '\\cdot' + rt + '^{' + sg + 'k}}';
  const varName = lim.kind === 'mix' ? 't' : 'k';
  const sumR = lim.kind === 'mix' ? '\\sum_{t=' + lim.lo + '}^{' + lim.hi + '}' + finAmtR(su.R) + '\\cdot' + rt + '^{' + su.T + '-t}' : '\\sum_{' + cs + '=' + clo + '}^{' + chi + '}' + term;
  S.rich(fx, y + fs * 2.0, sumR + '\\approx ' + finRM(su.value) + cm, { size: fs * 1.45, col: 'T', al: 'l' });
  y += fs * 4.6;
  // ausgeschrieben
  const ks = []; for (let k = lim.lo; k <= lim.hi; k++) ks.push(k);
  const tr = k => finAmtR(su.R) + '\\cdot' + finPow(rt, ab ? -k : k);
  let ex;
  if (ks.length <= 5) ex = ks.map(tr).join('+');
  else ex = ks.slice(0, 3).map(tr).join('+') + '+\\dots+' + tr(ks[ks.length - 1]);
  S.rich(fx, y + fs * 0.6, '=' + ex, { size: fs, col: 'T', al: 'l' }); y += fs * 2.1;
  // Hover-Info
  const hv = C.hover !== undefined && C.hover >= 0 && pay[C.hover] ? pay[C.hover] : null;
  if (hv) { const v = su.R * Math.pow(q, ab ? -hv.k : hv.k); S.rich(fx, y + fs * 0.6, '\\col{v}{t=' + hv.t + '}:\\ k=' + hv.k + '\\ \\Rightarrow\\ ' + finAmtR(su.R) + '\\cdot' + finPow(rt, ab ? -hv.k : hv.k) + '=' + finRM(v) + cm, { size: fs * 0.95, col: 'T', al: 'l' }); }
  else S.text(fx, y + fs * 0.6, 'Fahre mit der Maus über einen Pfeil, um den zugehörigen Summanden zu sehen.', { size: fs * 0.85, col: 'M', al: 'l', bs: 'm' });
  y += fs * 2.2;
  // Erklärkarten
  const cw = (W - 2 * pad - pad) / 2, ch = H0 - y - pad;
  if (ch > fs * 6) {
    const r1 = { x: pad, y, w: cw, h: ch }, r2 = { x: pad + cw + pad, y, w: cw, h: ch };
    const L1 = [{ s: 'Summenzeichen mit vier Einträgen', bold: true }, null,
      { s: '■ Anfang (untere Grenze): ' + lim.lo, col: FIN_COL.b }, { s: '■ Ende (obere Grenze): ' + lim.hi, col: FIN_COL.r }, { s: '■ Laufvariable: ' + varName, col: FIN_COL.v }, { s: '■ summierter Term: ' + finAmt(su.R) + '·' + rt + (lim.kind === 'mix' ? '^(' + su.T + '−t)' : (ab ? '^(−k)' : '^k')), col: FIN_COL.g }, null,
      { s: 'Anzahl Summanden = Ende − Anfang + 1 = ' + lim.hi + ' − ' + lim.lo + ' + 1 = ' + su.n, col: 'M', size: 0.9 }];
    stLines(S, r1.x + fs * 0.4, r1.y + fs * 0.2, L1, C, { fs: stFitLines(L1, { w: r1.w, h: r1.h }, C) });
    const L2 = [{ s: 'Regel für die Grenzen', bold: true }, null];
    if (lim.kind === 'auf') L2.push({ s: 'Aufzinsen: Die erste Zahlung bestimmt die obere, die letzte die untere Grenze.', col: 'T' }, { s: 'Die erste Zahlung wird ' + lim.hi + '-mal verzinst, die letzte ' + lim.lo + '-mal.', col: 'M', size: 0.92 });
    else if (lim.kind === 'ab') L2.push({ s: 'Abzinsen: Die erste Zahlung bestimmt die untere, die letzte die obere Grenze.', col: 'T' }, { s: 'Die erste Zahlung wird ' + lim.lo + '-mal abgezinst, die letzte ' + lim.hi + '-mal.', col: 'M', size: 0.92 });
    L2.push(null, { s: 'Geometrische Summe (Summenformel):', bold: true }, { s: 'Σ q^k = q^' + lim.lo + '·(1 − q^' + su.n + ')/(1 − q)  mit q = ' + (ab ? '1/' + rt : rt), col: 'T', size: 0.92 },
      { s: 'Wert = ' + Fin.money(su.R) + ' · ' + Fin.num(Math.pow(ab ? 1 / q : q, lim.lo), 6) + ' · ' + Fin.num((1 - Math.pow(ab ? 1 / q : q, su.n)) / (1 - (ab ? 1 / q : q)), 6) + ' = ' + Fin.money(su.value), col: ST_V, size: 0.92 },
      null, { s: 'Taschenrechner: TI-30X Pro: math 5 · TI-nspire: Menü → Analysis → Summe', col: 'M', size: 0.82 });
    if (P.solve) L2.push({ s: 'Rate gesucht: R = Zielbetrag / Summe = ' + Fin.money(P.target) + ' / ' + Fin.num(Fin.rateSeries(1, q, su.t1, su.t2, su.T).value, 6) + ' = ' + Fin.money(su.R), col: ST_V, size: 0.9 });
    stLines(S, r2.x + fs * 0.4, r2.y + fs * 0.2, L2, C, { fs: stFitLines(L2, { w: r2.w, h: r2.h }, C) });
  }
}
FIN_SCENES.sum = finSceneSum;

// ═══════════════════════════════════════════════════════════════════
// Gemeinsam für Sparplan und Kredit: Raten pro Jahr m, Zinsfaktor je Periode
// ═══════════════════════════════════════════════════════════════════
function finPer(P) {
  const m = P.m || 1, n = P.years * m, iPct = m === 1 ? P.p : Fin.conformI(P.p, m), q = 1 + iPct / 100;
  return { m, n, iPct, q, due: P.due === 1 };
}
const finUnit = m => (m === 1 ? 'Jahr' : m === 2 ? 'Halbjahr' : m === 4 ? 'Quartal' : m === 12 ? 'Monat' : 'Teilperiode');
const finUnits = m => (m === 1 ? 'Jahre' : m === 2 ? 'Halbjahre' : m === 4 ? 'Quartale' : m === 12 ? 'Monate' : 'Teilperioden');

// Pfeile der Raten (bei vielen Raten verkürzt)
function finRateTimeline(S, rTop, pp, T, label, C, hover, axisY) {
  const fs = C.fs, N = pp.n, due = pp.due, t1 = due ? 0 : 1, t2 = due ? N - 1 : N;
  const pay = []; for (let t = t1; t <= t2; t++) pay.push({ t, a: 1, i: t - t1, label: '' });
  if (pay.length) { pay[0].label = label; pay[pay.length - 1].label = label; if (pay.length > 1) { pay[0].bold = true; } }
  return finTimeline(S, rTop, { N, T, pay, lab: t => String(t), axisY, hover, unitLabel: finUnits(pp.m), maxArrows: 60 }, C);
}

// ═══════════════════════════════════════════════════════════════════
// Ansicht 3: Sparplan
// ═══════════════════════════════════════════════════════════════════
function finSceneSave(S, W, H, C) {
  const P = C.P, fs = C.fs, pad = FIN_LAYOUT_PAD(fs), pp = finPer(P), q = pp.q, n = pp.n, cm = '\\text{ CHF}';
  const R = P.solve ? Fin.savingsRate(P.target, q, n, pp.due) : P.R, FV = Fin.savingsFV(R, q, n, pp.due), paid = R * n, rq = Fin.num(q, 6);
  const L = fs * 2.5, axisY = pad + L + fs * 2.2, rTop = { x: pad, y: 0, w: W - 2 * pad, h: axisY + fs * 2.5 };
  finRateTimeline(S, rTop, pp, n, Fin.money(R, 0 + (Math.abs(R - Math.round(R)) < 1e-9 ? 0 : 2)), C, undefined, axisY);
  S.text(rTop.x + fs * 0.2, pad + fs * 0.3, 'Sparplan: ' + n + ' Raten ' + (pp.due ? '(vorschüssig: erste Rate sofort)' : '(nachschüssig: erste Rate nach einer Periode)') + ', Endwert zum Zeitpunkt ' + n, { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
  const y0 = rTop.h + pad * 0.3, hh = H - y0 - pad;
  const lw = W * 0.46, r1 = { x: pad, y: y0, w: lw, h: hh }, r2 = { x: pad + lw + pad, y: y0, w: W - lw - 3 * pad, h: hh };
  // Formel
  const lo = pp.due ? 1 : 0, hi = pp.due ? n : n - 1, lines = [];
  let y = r1.y;
  S.rich(r1.x + fs * 0.3, y + fs * 1.5, '\\col{g}{\\text{Endwert}}=\\sum_{\\col{v}{k}=\\col{b}{' + lo + '}}^{\\col{r}{' + hi + '}}' + finAmtR(R) + '\\cdot' + rq + '^{k}', { size: fs * 1.25, col: 'T', al: 'l' }); y += fs * 4.4;
  S.rich(r1.x + fs * 0.3, y + fs * 0.7, '=' + finAmtR(R) + '\\cdot\\frac{' + rq + '^{' + n + '}-1}{' + rq + '-1}' + (pp.due ? '\\cdot' + rq : '') + '\\approx ' + finRM(FV) + cm, { size: fs * 1.15, col: ST_V, al: 'l', bold: true }); y += fs * 3.0;
  const info = [
    { s: (P.solve ? 'Gesuchte Rate: ' + Fin.money(R) + ' CHF pro ' + finUnit(pp.m) : 'Rate: ' + Fin.money(R) + ' CHF pro ' + finUnit(pp.m)), bold: true }, null,
    { s: 'Eingezahlt: ' + n + ' · ' + Fin.money(R) + ' = ' + Fin.money(paid) + ' CHF' }, { s: 'Zinsen: ' + Fin.money(FV - paid) + ' CHF', col: ST_G }, { s: 'Endwert: ' + Fin.money(FV) + ' CHF', bold: true, col: ST_V },
    null, { s: pp.m === 1 ? 'Jahreszins ' + Fin.pct(P.p, 3) + ', Zinsfaktor r = ' + rq : 'Jahreszins ' + Fin.pct(P.p, 3) + ' → konformer Zins ' + Fin.pct(pp.iPct, 4) + ' pro ' + finUnit(pp.m) + ', r = ' + rq, col: 'M', size: 0.9 },
    { s: 'Der Zeitpunkt der ersten Zahlung bestimmt die obere, der letzten die untere Summationsgrenze.', col: 'M', size: 0.85 }];
  stLines(S, r1.x + fs * 0.3, y, info, C, { fs: stFitLines(info, { w: r1.w, h: r1.y + r1.h - y }, C) });
  // Diagramm: Einzahlungen und Zinsen (gestapelt) am Ende jedes Jahres
  const ser = Fin.savingsSeries(R, q, n, pp.due), pts = [];
  for (let y2 = 1; y2 <= P.years; y2++) pts.push(ser[y2 * pp.m - 1]);
  finStacked(S, r2, pts.map((s, j) => ({ label: String(j + 1), a: s.paid, b: s.interest })), { title: 'Kontostand am Ende jedes Jahres', na: 'Einzahlungen', nb: 'Zinsen' }, C);
}
FIN_SCENES.save = finSceneSave;

// gestapeltes Säulendiagramm: a unten (blau), b oben (grün)
function finStacked(S, r, bars, o, C) {
  const fs = C.fs, left = fs * 4.4, right = fs * 0.8, top = fs * 3.2, bottom = fs * 2.4;
  const px = r.x + left, py = r.y + top, pw = Math.max(10, r.w - left - right), ph = Math.max(10, r.h - top - bottom);
  let mx = 0; bars.forEach(b => { mx = Math.max(mx, b.a + Math.max(0, b.b)); }); mx = Math.max(mx * 1.06, 1e-9);
  const tk = stTicks(mx, 4), ymax = Math.max(mx, tk.t[tk.t.length - 1]), Y = v => py + ph - v / ymax * ph;
  S.text(r.x + r.w / 2, r.y + fs * 0.9, o.title, { size: fs * 0.95, col: 'T', al: 'c', bs: 'm', bold: true });
  S.rect(px, r.y + fs * 1.6, fs * 0.8, fs * 0.8, { fill: ST_B, a: 0.85 }); S.text(px + fs * 1.1, r.y + fs * 2.0, o.na, { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
  const lx2 = px + fs * 1.1 + finMeasure(o.na, fs * 0.82) + fs * 1.2;
  S.rect(lx2, r.y + fs * 1.6, fs * 0.8, fs * 0.8, { fill: ST_G, a: 0.85 }); S.text(lx2 + fs * 1.1, r.y + fs * 2.0, o.nb, { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
  tk.t.forEach(v => { S.line(px, Y(v), px + pw, Y(v), { col: 'G', lw: 1 }); S.text(px - fs * 0.4, Y(v), Fin.money(v, 0), { size: fs * 0.78, col: 'M', al: 'r', bs: 'm' }); });
  const nb = bars.length, slot = pw / Math.max(1, nb), bw = slot * 0.78, skip = Math.max(1, Math.ceil(fs * 1.8 / slot));
  bars.forEach((b, i) => {
    const xc = px + slot * (i + 0.5), ha = b.a / ymax * ph, hb = Math.max(0, b.b) / ymax * ph;
    if (ha > 0) S.rect(xc - bw / 2, py + ph - ha, bw, ha, { fill: ST_B, a: 0.85 });
    if (hb > 0) S.rect(xc - bw / 2, py + ph - ha - hb, bw, hb, { fill: ST_G, a: 0.85 });
    if (i % skip === 0 || i === nb - 1) S.text(xc, py + ph + fs * 0.9, b.label, { size: fs * 0.8, col: 'M', al: 'c', bs: 'm' });
  });
  S.line(px, py + ph, px + pw, py + ph, { col: 'L', lw: 1.4 });
  S.text(px + pw / 2, r.y + r.h - fs * 0.2, 'Jahre', { size: fs * 0.82, col: 'M', al: 'c', bs: 'b' });
}

// ═══════════════════════════════════════════════════════════════════
// Ansicht 4: Kredit (Annuität) und Tilgungsplan; auch Rente (Barwert)
// ═══════════════════════════════════════════════════════════════════
function finSceneLoan(S, W, H, C) {
  const P = C.P, fs = C.fs, pad = FIN_LAYOUT_PAD(fs), pp = finPer(P), q = pp.q, n = pp.n, cm = '\\text{ CHF}', rq = Fin.num(q, 6);
  const K = P.K, sch = Fin.loanSchedule(K, q, n, pp.due), R = sch.R;
  const L = fs * 2.5, axisY = pad + L + fs * 2.2, rTop = { x: pad, y: 0, w: W - 2 * pad, h: axisY + fs * 2.5 };
  finRateTimeline(S, rTop, pp, 0, Fin.money(R, 2), C, undefined, axisY);
  S.text(rTop.x + fs * 0.2, pad + fs * 0.3, 'Kredit ' + Fin.money(K, 0) + ' CHF heute (Barwert), ' + n + ' Raten ' + (pp.due ? '(vorschüssig)' : '(nachschüssig)'), { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
  const y0 = rTop.h + pad * 0.3, hh = H - y0 - pad, wide = W >= 820;
  const lw = wide ? W * 0.5 : W - 2 * pad, r1 = { x: pad, y: y0, w: lw, h: wide ? hh : hh * 0.55 }, r2 = wide ? { x: pad + lw + pad, y: y0, w: W - lw - 3 * pad, h: hh } : { x: pad, y: y0 + r1.h + pad, w: W - 2 * pad, h: hh - r1.h - pad };
  const lo = pp.due ? 0 : 1, hi = pp.due ? n - 1 : n;
  let y = r1.y;
  S.rich(r1.x + fs * 0.3, y + fs * 1.5, '\\col{g}{' + finAmtR(K) + '}=R\\cdot\\sum_{\\col{v}{k}=\\col{b}{' + lo + '}}^{\\col{r}{' + hi + '}}' + rq + '^{-k}', { size: fs * 1.2, col: 'T', al: 'l' }); y += fs * 3.8;
  S.text(r1.x + fs * 0.3, y + fs * 0.6, 'Annuität:', { size: fs * 1.0, col: 'M', al: 'l', bs: 'm' });
  S.rich(r1.x + fs * 0.3 + finMeasure('Annuität:', fs) + fs * 0.6, y + fs * 0.6, 'R\\approx ' + finRM(R) + cm, { size: fs * 1.2, col: ST_V, al: 'l', bold: true }); y += fs * 2.5;
  // Tilgungsplan
  const tot = sch.rows.reduce((s, x) => s + x.interest, 0);
  const cols = [{ h: 'Nr.', w: 3, al: 'l' }, { h: 'Restschuld', w: 6.8 }, { h: 'Zins', w: 5.6 }, { h: 'Tilgung', w: 6.4 }, { h: 'Rest danach', w: 6.8 }];
  let rows = sch.rows.map(x => [String(x.k), Fin.money(x.begin), Fin.money(x.interest), Fin.money(x.repay), Fin.money(x.end)]);
  const maxRows = Math.max(4, Math.floor((r1.y + r1.h - y - fs * 3.2) / (fs * 1.75)) - 2);
  if (rows.length + 1 > maxRows) { const keep = Math.max(3, maxRows - 3); rows = rows.slice(0, keep).concat([['…', '', '', '', '']], rows.slice(-2)); }
  rows.push(['Σ', '', Fin.money(tot), Fin.money(K), '']);
  const tw0 = cols.reduce((a, c) => a + c.w, 0), tfs = Math.max(8, Math.min(fs, (r1.w - fs) / tw0, (r1.y + r1.h - y - fs * 0.5) / ((rows.length + 1) * 1.75)));
  S.text(r1.x + fs * 0.3, y + fs * 0.4, 'Tilgungsplan (CHF)', { size: fs * 0.92, col: 'T', al: 'l', bs: 'm', bold: true });
  stTable(S, r1.x + fs * 0.3, y + fs * 1.1, cols, rows, { fs: tfs, sum: true }, C);
  // Diagramm: Rate = Zins + Tilgung je Jahr
  const bars = []; for (let yr = 1; yr <= P.years; yr++) { let z = 0, t2 = 0; for (let k = (yr - 1) * pp.m; k < yr * pp.m; k++) { z += sch.rows[k].interest; t2 += sch.rows[k].repay; } bars.push({ label: String(yr), a: t2, b: z }); }
  finStacked(S, r2, bars, { title: 'Jahresraten: Tilgung und Zins', na: 'Tilgung', nb: 'Zins' }, C);
  S.hits.length = 0;
}
FIN_SCENES.loan = finSceneLoan;

// ═══════════════════════════════════════════════════════════════════
// Ansicht 5: Zeitwert des Geldes, Zinseszins
// ═══════════════════════════════════════════════════════════════════
function finValueCalc(P) {
  const q = Fin.factor(P.p), n = P.n, k = P.kind;
  if (k === 'auf') return { res: Fin.fv(P.K, q, n), K0: P.K, Kn: Fin.fv(P.K, q, n), p: P.p, n };
  if (k === 'ab') return { res: Fin.pv(P.K, q, n), K0: Fin.pv(P.K, q, n), Kn: P.K, p: P.p, n };
  if (k === 'abschr') return { res: P.K * Math.pow(1 - P.p / 100, n), K0: P.K, Kn: P.K * Math.pow(1 - P.p / 100, n), p: -P.p, n };
  if (k === 'rendite') { const p = Fin.rendite(P.K, P.K2, n); return { res: p, K0: P.K, Kn: P.K2, p, n }; }
  if (k === 'laufzeit') { const nn = Fin.laufzeit(P.K, P.K2, q); return { res: nn, K0: P.K, Kn: P.K2, p: P.p, n: nn }; }
  return { res: NaN, K0: P.K, Kn: P.K, p: P.p, n };
}
function finSceneValue(S, W, H, C) {
  const P = C.P, fs = C.fs, pad = FIN_LAYOUT_PAD(fs), vc = finValueCalc(P), q = Fin.factor(P.p), kind = P.kind, cm = '\\text{ CHF}';
  const nShow = kind === 'laufzeit' ? (isFinite(vc.n) ? Math.max(1, Math.ceil(vc.n)) : 10) : P.n;
  const pShow = kind === 'rendite' ? vc.p : kind === 'abschr' ? -P.p : P.p, qs = 1 + pShow / 100;
  // mini-Zeitstrahl
  const axisY = pad + fs * 5.2, rTop = { x: pad, y: 0, w: W - 2 * pad, h: axisY + fs * 3 };
  const X = t => rTop.x + fs * 3.5 + (rTop.w - fs * 7) * t / Math.max(1, nShow);
  S.line(rTop.x + fs, axisY, rTop.x + rTop.w - fs, axisY, { col: 'L', lw: 2 });
  const per = (rTop.w - fs * 7) / Math.max(1, nShow), skip = Math.max(1, Math.ceil(fs * 2.4 / per));
  for (let t = 0; t <= nShow; t++) { S.line(X(t), axisY - 4, X(t), axisY + 4, { col: 'L', lw: 1.4 }); if (t % skip === 0 || t === nShow) S.text(X(t), axisY + fs * 1.1, String(t), { size: fs * 0.85, col: 'M', al: 'c', bs: 'm' }); }
  S.text(rTop.x + rTop.w - fs, axisY + fs * 2.4, 'Jahre', { size: fs * 0.82, col: 'M', al: 'r', bs: 'm' });
  const isAb = kind === 'ab';
  const c0 = ST_B, c1 = ST_V, lab0 = kind === 'ab' ? '?' : finAmt(vc.K0), labn = kind === 'ab' ? finAmt(vc.Kn) : (kind === 'auf' || kind === 'abschr') ? '?' : finAmt(vc.Kn);
  S.circ(X(0), axisY, fs * 0.5, { fill: c0 }); S.circ(X(nShow), axisY, fs * 0.5, { fill: c1 });
  S.text(X(0), axisY - fs * 2.3, lab0, { size: fs, col: c0, al: 'c', bs: 'm', bold: true }); S.text(X(nShow), axisY - fs * 2.3, labn, { size: fs, col: c1, al: 'c', bs: 'm', bold: true });
  // Bogen
  const mid = (X(0) + X(nShow)) / 2, ah = fs * 2.4, arcY = axisY - fs * 0.7, pts = [];
  for (let s = 0; s <= 24; s++) { const u = s / 24; pts.push([X(0) + (X(nShow) - X(0)) * u, arcY - Math.sin(u * Math.PI) * ah]); }
  S.poly(pts, { col: ST_R, lw: 2 });
  { const a = pts[pts.length - 2], b2 = pts[pts.length - 1], dx = b2[0] - a[0], dy = b2[1] - a[1], ln = Math.hypot(dx, dy) || 1, ux = dx / ln, uy = dy / ln, hl = fs * 0.8;
    S.poly([[b2[0] - ux * hl - uy * hl * 0.4, b2[1] - uy * hl + ux * hl * 0.4], [b2[0], b2[1]], [b2[0] - ux * hl + uy * hl * 0.4, b2[1] - uy * hl - ux * hl * 0.4]], { col: ST_R, fill: ST_R, close: true, lw: 1 }); }
  const arcLab = kind === 'auf' ? '\\cdot ' + Fin.rText(P.p) + '^{' + P.n + '}' : kind === 'ab' ? ':' + Fin.rText(P.p) + '^{' + P.n + '}' : kind === 'abschr' ? '\\cdot ' + Fin.num(1 - P.p / 100, 6) + '^{' + P.n + '}' : '\\cdot r^{' + finRN(vc.n, 2) + '}';
  S.rich(mid, arcY - ah - fs * 0.9, arcLab, { size: fs, col: ST_R, al: 'c', bold: true });
  // Rechnung
  const y0 = rTop.h + pad * 0.2, hh = H - y0 - pad, wide = W >= 820, lw = wide ? W * 0.47 : W - 2 * pad;
  const r1 = { x: pad, y: y0, w: lw, h: wide ? hh : hh * 0.45 }, r2 = wide ? { x: pad + lw + pad, y: y0, w: W - lw - 3 * pad, h: hh } : { x: pad, y: y0 + r1.h + pad, w: W - 2 * pad, h: hh - r1.h - pad };
  let y = r1.y + fs * 0.4; const rt = Fin.rText(P.p), ok = isFinite(vc.res);
  const ln = (s, o) => { S.rich(r1.x + fs * 0.3, y + fs * 0.8, s, Object.assign({ size: fs * 1.15, col: 'T', al: 'l' }, o || {})); y += fs * 3.1; };
  if (kind === 'auf') { S.text(r1.x + fs * 0.3, y + fs * 0.5, 'Aufzinsen: Wert eines heutigen Betrags in ' + P.n + ' Jahren', { size: fs * 0.9, col: 'M', al: 'l', bs: 'm' }); y += fs * 1.8; ln('K_{n}=K_{0}\\cdot r^{n}'); ln('=' + finAmtR(P.K) + '\\cdot' + rt + '^{' + P.n + '}'); ln('\\approx ' + finRM(vc.res) + cm, { col: ST_V, bold: true, size: fs * 1.3 }); }
  else if (kind === 'ab') { S.text(r1.x + fs * 0.3, y + fs * 0.5, 'Abzinsen: heutiger Wert (Barwert) eines Betrags in ' + P.n + ' Jahren', { size: fs * 0.9, col: 'M', al: 'l', bs: 'm' }); y += fs * 1.8; ln('K_{0}=\\frac{K_{n}}{r^{n}}=K_{n}\\cdot r^{-n}'); ln('=\\frac{' + finAmtR(P.K) + '}{' + rt + '^{' + P.n + '}}'); ln('\\approx ' + finRM(vc.res) + cm, { col: ST_V, bold: true, size: fs * 1.3 }); }
  else if (kind === 'abschr') { S.text(r1.x + fs * 0.3, y + fs * 0.5, 'Degressive Abschreibung: jedes Jahr verliert der Wert ' + Fin.pct(P.p, 3), { size: fs * 0.9, col: 'M', al: 'l', bs: 'm' }); y += fs * 1.8; ln('W_{n}=W_{0}\\cdot r^{n},\\ r=1-\\frac{p}{100}=' + Fin.num(1 - P.p / 100, 6)); ln('=' + finAmtR(P.K) + '\\cdot' + Fin.num(1 - P.p / 100, 6) + '^{' + P.n + '}'); ln('\\approx ' + finRM(vc.res) + cm, { col: ST_V, bold: true, size: fs * 1.3 }); }
  else if (kind === 'rendite') { S.text(r1.x + fs * 0.3, y + fs * 0.5, 'Rendite: Zinssatz gesucht (Wurzel ziehen)', { size: fs * 0.9, col: 'M', al: 'l', bs: 'm' }); y += fs * 1.8; ln('r=\\left(\\frac{K_{n}}{K_{0}}\\right)^{1/n}'); ln('=\\left(\\frac{' + finAmtR(P.K2) + '}{' + finAmtR(P.K) + '}\\right)^{1/' + P.n + '}\\approx ' + (ok ? Fin.num(1 + vc.p / 100, 5) : '?')); ln('p\\approx ' + (ok ? finRN(vc.p, 3) : '?') + '\\,\\%', { col: ST_V, bold: true, size: fs * 1.3 }); }
  else if (kind === 'laufzeit') { S.text(r1.x + fs * 0.3, y + fs * 0.5, 'Laufzeit: Exponent gesucht (Logarithmus)', { size: fs * 0.9, col: 'M', al: 'l', bs: 'm' }); y += fs * 1.8; ln(rt + '^{n}=\\frac{' + finAmtR(P.K2) + '}{' + finAmtR(P.K) + '}'); ln('n=\\frac{\\log(K_{n}/K_{0})}{\\log r}=' + (ok ? finRN(vc.n, 3) : '?'), { col: ST_V, bold: true, size: fs * 1.3 }); }
  const extra = [];
  if (kind !== 'rendite' && kind !== 'abschr' && q > 1) extra.push({ s: 'Verdopplungszeit bei ' + Fin.pct(P.p, 3) + ': n = log 2 / log ' + Fin.rText(P.p) + ' = ' + Fin.num(Fin.verdopplung(q), 2) + ' Jahre', col: 'M', size: 0.88 });
  if (kind === 'auf' || kind === 'ab') extra.push({ s: 'Zinsfaktor r = 1 + p/100 = ' + rt + ' (Aufzinsfaktor)', col: 'M', size: 0.88 });
  const eb = { x: r1.x + fs * 0.3, y: Math.min(y + fs * 0.2, r1.y + r1.h - fs * 2), w: r1.w, h: Math.max(fs * 2, r1.y + r1.h - y) };
  stLines(S, eb.x, eb.y, extra, C, { fs: stFitLines(extra, eb, C) });
  // Diagramm: Kapital im Zeitverlauf, Zinseszins gegen einfachen Zins
  const base = kind === 'ab' ? vc.K0 : vc.K0, ser = [], lin = [];
  for (let t = 0; t <= nShow; t += Math.max(0.05, nShow / 120)) { ser.push([t, base * Math.pow(qs, t)]); lin.push([t, base * (1 + pShow / 100 * t)]); }
  ser.push([nShow, base * Math.pow(qs, nShow)]); lin.push([nShow, base * (1 + pShow / 100 * nShow)]);
  S.text(r2.x + r2.w / 2, r2.y + fs * 0.9, kind === 'abschr' ? 'Wert im Zeitverlauf' : 'Kapital im Zeitverlauf', { size: fs * 0.95, col: 'T', al: 'c', bs: 'm', bold: true });
  S.line(r2.x + fs * 4, r2.y + fs * 2.0, r2.x + fs * 5.6, r2.y + fs * 2.0, { col: ST_B, lw: 2.4 }); S.text(r2.x + fs * 5.9, r2.y + fs * 2.0, 'mit Zinseszins', { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
  const lx = r2.x + fs * 5.9 + finMeasure('mit Zinseszins', fs * 0.82) + fs * 1.2;
  S.line(lx, r2.y + fs * 2.0, lx + fs * 1.6, r2.y + fs * 2.0, { col: ST_O, lw: 2, dash: true }); S.text(lx + fs * 1.9, r2.y + fs * 2.0, 'nur einfacher Zins', { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
  const rch = { x: r2.x, y: r2.y + fs * 2.4, w: r2.w, h: r2.h - fs * 2.4 };
  const ymax = Math.max(base * Math.pow(qs, nShow), base * (1 + Math.max(0, pShow) / 100 * nShow), base) * 1.08;
  const ch = stLineChart(S, rch, [{ pts: lin, col: ST_O, lw: 1.8 }, { pts: ser, col: ST_B, lw: 2.6 }], { xmin: 0, xmax: nShow, ymin: 0, ymax, xlabel: 'Jahre', yfmt: v => Fin.money(v, 0) }, C);
  S.circ(ch.X(nShow), ch.Y(base * Math.pow(qs, nShow)), 5, { fill: ST_V });
  S.circ(ch.X(0), ch.Y(base), 5, { fill: ST_B });
  S.hits.length = 0;
}
FIN_SCENES.value = finSceneValue;

// ═══════════════════════════════════════════════════════════════════
// Ansicht 6: Marchzins mit Kalender (30/360)
// ═══════════════════════════════════════════════════════════════════
const FIN_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
function finSceneMarch(S, W, H, C) {
  const P = C.P, fs = C.fs, pad = FIN_LAYOUT_PAD(fs), cm = '\\text{ CHF}';
  const d1 = P.d1, m1 = P.m1, d2 = P.d2, m2 = P.m2, days = Fin.marchDays(d1, m1, d2, m2), z = Fin.marchZins(P.K, P.p, days);
  const a1 = Fin.dayAdj(d1, m1, 2023), a2 = Fin.dayAdj(d2, m2, 2023), wide = W >= 820;
  // Kalender 12 × 30
  const rc = wide ? { x: pad, y: pad, w: W * 0.56, h: H - 2 * pad } : { x: pad, y: pad, w: W - 2 * pad, h: H * 0.55 };
  const lx = rc.x + fs * 3.2, cw = (rc.w - fs * 3.4) / 30, chh = Math.min(cw * 1.1, (rc.h - fs * 3.2) / 12), gy = rc.y + fs * 2.4;
  S.text(rc.x + rc.w / 2, rc.y + fs * 0.9, 'Zinstage nach Schweizer Usanz: 12 Monate zu je 30 Tagen', { size: fs * 0.95, col: 'T', al: 'c', bs: 'm', bold: true });
  const start = (m1 - 1) * 30 + a1, inYear = k => ((k % 360) + 360) % 360;       // Tagesnummer (1…360) des Bringtags
  const inter = new Set(); for (let j = 1; j <= days; j++) inter.add(inYear(start - 1 + j));     // Zinstage: Tag nach dem Bringtag … Holtag
  for (let m = 0; m < 12; m++) {
    S.text(lx - fs * 0.4, gy + m * chh + chh / 2, FIN_MONTHS[m], { size: Math.min(fs * 0.85, chh * 0.9), col: 'M', al: 'r', bs: 'm' });
    for (let d = 1; d <= 30; d++) {
      const idx = m * 30 + d - 1, isIn = inter.has(idx), isBring = idx === inYear(start - 1), isHol = idx === inYear(start - 1 + days) && days > 0;
      const hv = C.hoverCal && C.hoverCal.d === d && C.hoverCal.m === m + 1;
      S.rect(lx + (d - 1) * cw + 0.6, gy + m * chh + 0.6, cw - 1.2, chh - 1.2, { fill: isIn ? (isHol ? ST_G : ST_B) : 'G', a: isIn ? 0.85 : 0.35, stroke: isBring ? ST_R : (hv ? ST_V : undefined), lw: hv ? 2.5 : 2, r: 2 });
      S.hit(lx + (d - 1) * cw, gy + m * chh, cw, chh, { kind: 'cal', d, m: m + 1 });
      if (hv && !isHol) S.text(lx + (d - 0.5) * cw, gy + m * chh + chh / 2, String(d), { size: Math.min(cw, chh) * 0.62, col: 'T', al: 'c', bs: 'm', bold: true });
      if (isHol) S.text(lx + (d - 0.5) * cw, gy + m * chh + chh / 2, '✓', { size: Math.min(cw, chh) * 0.75, col: '#ffffff', al: 'c', bs: 'm', bold: true });
    }
  }
  for (let d = 1; d <= 30; d++) if (d === 1 || d % 5 === 0) S.text(lx + (d - 0.5) * cw, gy - fs * 0.6, String(d), { size: fs * 0.78, col: 'M', al: 'c', bs: 'm' });
  // Legende
  const ly = gy + 12 * chh + fs * 0.9;
  const lg = (j, rect, txt) => { const yy = ly + j * fs * 1.35; S.rect(lx, yy - fs * 0.4, fs * 0.8, fs * 0.8, rect); S.text(lx + fs * 1.1, yy, txt, { size: fs * 0.8, col: 'M', al: 'l', bs: 'm' }); };
  lg(0, { stroke: ST_R, lw: 2, r: 2 }, 'Bringtag (zählt nicht)'); lg(1, { fill: ST_B, a: 0.85, r: 2 }, 'Zinstage'); lg(2, { fill: ST_G, a: 0.85, r: 2 }, 'Holtag (zählt)');
  S.text(lx, ly + fs * 4.6, C.calNext === 'd2' ? 'Nächster Klick: Holtag festlegen' : 'Nächster Klick: Bringtag festlegen', { size: fs * 0.82, col: C.calNext === 'd2' ? ST_G : ST_R, al: 'l', bs: 'm', bold: true });
  // Rechnung
  const rr = wide ? { x: rc.x + rc.w + pad, y: pad, w: W - rc.w - 3 * pad, h: H - 2 * pad } : { x: pad, y: rc.y + rc.h + pad, w: W - 2 * pad, h: H - rc.h - 3 * pad };
  let y = rr.y + fs * 0.2; const x = rr.x + fs * 0.3;
  const dm = (d, m) => d + '.' + m + '.';
  const step = (s, o) => { S.rich(x, y + fs * 0.8, s, Object.assign({ size: fs * 1.05, col: 'T', al: 'l' }, o || {})); y += fs * 2.3; };
  S.text(x, y + fs * 0.5, 'Zinstage von ' + dm(d1, m1) + ' bis ' + dm(d2, m2), { size: fs * 0.95, col: 'T', al: 'l', bs: 'm', bold: true }); y += fs * 1.9;
  step('d=(' + m2 + '-' + m1 + ')\\cdot30+(' + a2 + '-' + a1 + ')' + (days < 0 || (m2 - m1) * 30 + (a2 - a1) < 0 ? '+360' : '') + '=\\col{b}{' + days + '}\\ \\text{Tage}');
  if (d1 > 30 || d2 > 30 || Fin.dayAdj(d1, m1, 2023) !== d1 || Fin.dayAdj(d2, m2, 2023) !== d2) S.text(x, y - fs * 0.5, 'Der 31. und das Ende des Februars zählen als 30.', { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' }), y += fs * 0.9;
  step('z=\\frac{d}{360}\\cdot\\frac{p\\cdot K}{100}=\\frac{' + days + '}{360}\\cdot\\frac{' + finRN(P.p, 3) + '\\cdot' + finAmtR(P.K) + '}{100}');
  step('\\approx ' + finRM(z) + cm, { col: ST_V, bold: true, size: fs * 1.3 });
  const rest = [{ s: 'Kapital ' + Fin.money(P.K, 0) + ' CHF zu ' + Fin.pct(P.p, 3) + ' für ' + days + ' Tage.', col: 'M', size: 0.9 },
    { s: 'Ein ganzes Jahr hat 360 Tage; ' + days + ' Tage sind ' + Fin.num(days / 360, 4) + ' des Jahres.', col: 'M', size: 0.9 },
    { s: 'Kapital mit Zins am Ende: ' + Fin.money(P.K + z) + ' CHF', col: 'T', size: 0.95, bold: true }];
  stLines(S, x, y, rest, C, { fs: stFitLines(rest, { w: rr.w * 0.8, h: rr.y + rr.h - y }, C) });
}
FIN_SCENES.march = finSceneMarch;

// ═══════════════════════════════════════════════════════════════════
// Ansicht 7: Konformer Zins und effektiver Jahreszins
// ═══════════════════════════════════════════════════════════════════
function finSceneConform(S, W, H, C) {
  const P = C.P, fs = C.fs, pad = FIN_LAYOUT_PAD(fs), m = P.m, wide = W >= 820;
  const given = P.given;                                         // 'p': Jahreszins gegeben, 'i': Zins pro Teilperiode gegeben
  const pYear = given === 'p' ? P.p : Fin.effectiveP(P.i, m), iSub = given === 'p' ? Fin.conformI(P.p, m) : P.i;
  const yp = Fin.yearPath(P.K, pYear, m);
  const lw = wide ? W * 0.46 : W - 2 * pad, r1 = { x: pad, y: pad, w: lw, h: wide ? H - 2 * pad : H * 0.46 }, r2 = wide ? { x: pad + lw + pad, y: pad, w: W - lw - 3 * pad, h: H - 2 * pad } : { x: pad, y: r1.h + 2 * pad, w: W - 2 * pad, h: H - r1.h - 3 * pad };
  const un = finUnit(m), cm = '\\text{ CHF}';
  let y = r1.y + fs * 0.2; const x = r1.x + fs * 0.3;
  const ln = (s, o) => { S.rich(x, y + fs * 0.8, s, Object.assign({ size: fs * 1.1, col: 'T', al: 'l' }, o || {})); y += fs * 2.9; };
  S.text(x, y + fs * 0.4, given === 'p' ? 'Gegeben: Jahreszins ' + Fin.pct(P.p, 3) + ', Verzinsung ' + m + '-mal pro Jahr' : 'Gegeben: ' + Fin.pct(P.i, 4) + ' pro ' + un + ', ' + m + '-mal pro Jahr', { size: fs * 0.92, col: 'M', al: 'l', bs: 'm' }); y += fs * 1.9;
  if (given === 'p') {
    ln('(1+i)^{' + m + '}=1+\\frac{p}{100}\\ \\Rightarrow\\ i=\\left(1+\\frac{p}{100}\\right)^{1/' + m + '}-1');
    ln('i=' + Fin.rText(P.p) + '^{1/' + m + '}-1\\approx ' + finRN(iSub, 4) + '\\,\\%', { col: ST_V, bold: true, size: fs * 1.25 });
    S.text(x, y + fs * 0.3, 'konformer Zins pro ' + un, { size: fs * 0.88, col: 'M', al: 'l', bs: 'm' }); y += fs * 1.6;
    ln('\\text{zum Vergleich: }p/' + m + '=' + finRN(P.p / m, 4) + '\\,\\%', { col: ST_O, size: fs * 0.98 });
  } else {
    ln('p_{\\text{eff}}=(1+i)^{' + m + '}-1');
    ln('=(1+' + finRN(P.i / 100, 5) + ')^{' + m + '}-1\\approx ' + finRN(pYear, 4) + '\\,\\%', { col: ST_V, bold: true, size: fs * 1.25 });
    S.text(x, y + fs * 0.3, 'effektiver Jahreszins (nicht ' + Fin.num(P.i * m, 4) + ' %)', { size: fs * 0.88, col: 'M', al: 'l', bs: 'm' }); y += fs * 1.6;
  }
  // Tabelle der Monate
  const cols = [{ h: finUnit(m), w: 4.6, al: 'l' }, { h: 'konform', w: 7.6 }, { h: 'proportional', w: 7.6 }];
  const rows = []; for (let k = 0; k <= m; k++) rows.push([String(k), Fin.money(yp.conform[k]), Fin.money(yp.prop[k])]);
  const tfs = Math.max(8, Math.min(fs, (r1.w - fs) / cols.reduce((a, c) => a + c.w, 0), (r1.y + r1.h - y - fs * 1.6) / ((rows.length + 1) * 1.75)));
  S.text(x, y + fs * 0.4, 'Kapital ' + Fin.money(P.K, 0) + ' CHF im Lauf eines Jahres (CHF)', { size: fs * 0.9, col: 'T', al: 'l', bs: 'm', bold: true });
  if (rows.length <= 13) stTable(S, x, y + fs * 1.0, cols, rows, { fs: tfs }, C);
  else { const keep = rows.slice(0, 4).concat([['…', '', '']], rows.slice(-2)); stTable(S, x, y + fs * 1.0, cols, keep, { fs: tfs }, C); }
  // Diagramm
  S.text(r2.x + r2.w / 2, r2.y + fs * 0.9, 'Ein Jahr: konformer Zins gegen proportionalen Zins p/' + m, { size: fs * 0.95, col: 'T', al: 'c', bs: 'm', bold: true });
  const lo = yp.conform[0], hi = Math.max(yp.prop[m], yp.conform[m]);
  const rch = { x: r2.x, y: r2.y + fs * 1.4, w: r2.w, h: r2.h - fs * 1.4 };
  const stairs = a => { const o = []; a.forEach((v, k) => { if (k > 0) o.push([k, a[k - 1]]); o.push([k, v]); }); return o; };
  const d0 = Math.max(hi - lo, 1e-6), stp = Stat.niceStep(d0 * 1.6, 4), ymin = Math.floor((lo - d0 * 0.3) / stp) * stp, ymax = ymin + Math.ceil((hi + d0 * 0.2 - ymin) / stp) * stp;
  const ch = stLineChart(S, { x: rch.x, y: rch.y + fs * 2.4, w: rch.w, h: rch.h - fs * 2.4 }, [{ pts: stairs(yp.prop), col: ST_O, lw: 2 }, { pts: stairs(yp.conform), col: ST_B, lw: 2.6 }], { xmin: 0, xmax: m, ymin, ymax, xlabel: 'Zeit (' + finUnits(m) + ')', yfmt: v => Fin.money(v, stp < 1 ? 1 : 0) }, C);
  S.circ(ch.X(m), ch.Y(yp.conform[m]), 5, { fill: ST_B }); S.circ(ch.X(m), ch.Y(yp.prop[m]), 5, { fill: ST_O });
  const lg = rch.x + fs * 4.2; S.line(lg, rch.y + fs * 0.4, lg + fs * 1.4, rch.y + fs * 0.4, { col: ST_B, lw: 2.6 }); S.text(lg + fs * 1.7, rch.y + fs * 0.4, 'konform (genau ' + Fin.pct(pYear, 3) + ')', { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
  S.line(lg, rch.y + fs * 1.5, lg + fs * 1.4, rch.y + fs * 1.5, { col: ST_O, lw: 2 }); S.text(lg + fs * 1.7, rch.y + fs * 1.5, 'proportional (effektiv ' + Fin.pct(yp.prop[m] / P.K * 100 - 100, 3) + ')', { size: fs * 0.82, col: 'M', al: 'l', bs: 'm' });
  S.hits.length = 0;
}
FIN_SCENES.conform = finSceneConform;

// Gesamtszene
function finBuildScene(W, H, C) {
  const S = finScene(), f = FIN_SCENES[C.mode];
  if (f) f(S, W, H, C);
  return S;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { finParse, finRichTex, finBuildScene, FIN_SCENES };
