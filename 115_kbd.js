// ═══════════════════════════════════════════════════════════════════
// 115_kbd.js — Bildschirmtastatur für Handy, Tablet und Touchscreen
//
// EINE Tastatur für alle Eingaben: Formelfelder (math-field), Zahlenfelder und Textfelder mit Termen
// (Ungleichungen, Koordinaten «1 | 2 | 3», Listen). Sie erscheint unten am Bildschirm, sobald ein solches Feld
// mit dem Finger oder Stift angetippt wird; die Tastatur des Geräts bleibt dabei zu (inputmode="none").
// Felder für Wörter (Suche, Einheiten, Namen) behalten die Tastatur des Geräts.
//
//   Art des Feldes   kbdKind(el): 'math' (Formelfeld), 'num' (Zahl), 'expr' (Term als Text), '' (keine)
//                    Ein Feld kann sie mit data-kb="…" festlegen («os» = Tastatur des Geräts) und mit
//                    data-kb-vars="n k" die Variablen-Tasten der ersten Seite bestimmen; sonst sind es die
//                    Buchstaben, die im Feld (oder in seinem Muster) vorkommen: «3n+1» → n, «2x+3y−z=6» → x y z.
//   Öffnen           Antippen eines Feldes (Finger/Stift) oder das Tastatur-Symbol im Formelfeld
//   Schliessen       Taste «⌄», Eingabetaste «↵», Antippen ausserhalb, Esc; wer auf einer echten Tastatur tippt,
//                    bekommt die Bildschirmtastatur in dieser Sitzung nicht mehr von selbst (KBD.hw)
//   Sichtbarkeit     Das Feld wird über die Tastatur geschoben (kbdReveal); das Blatt im Hochformat rückt über
//                    die Tastatur (sbKbSync in index.html liest window.kbdHeight()).
// ═══════════════════════════════════════════════════════════════════
const KBD = { el: null, target: null, kind: '', pages: [], page: 0, shift: false, open: false, hw: false, ptr: '', ptrT: 0, ptrEl: null, ptrSb: false, init: '', rep: 0, repT: 0, pad: null, closeT: 0 };

// ── Tasten: [Beschriftung, Text für Textfelder, LaTeX für Formelfelder, Klasse] oder Name einer Sondertaste ──
const KBD_KEYS = {
  '(': ['(', '(', '('], ')': [')', ')', ')'], '[': ['[', '[', '\\lbrack '], ']': [']', ']', '\\rbrack '],
  '+': ['+', '+', '+', 'op'], '-': ['−', '-', '-', 'op'], '*': ['<span class="j10kb-dot">·</span>', '*', '\\cdot ', 'op'],
  frac: ['<span class="j10kb-fr"><i></i><i></i></span>', '/', '\\frac{#@}{#?}', 'op'],
  '/': ['/', '/', '\\frac{#@}{#?}', 'op'],
  sq: ['<i>x</i><sup>2</sup>', '^2', '#@^{2}'], pow: ['<i>x</i><sup>n</sup>', '^', '#@^{#?}'],
  sqrt: ['√', 'sqrt(', '\\sqrt{#?}'], nroot: ['<sup>n</sup>√', 'nthroot(', '\\sqrt[3]{#?}'],
  abs: ['|<i>x</i>|', '|', '\\left|#?\\right|'], bar: ['|', ' | ', '\\mid '],
  '=': ['=', '=', '='], '<': ['&lt;', '<', '<'], '>': ['&gt;', '>', '>'], le: ['≤', '<=', '\\le '], ge: ['≥', '>=', '\\ge '],
  '.': ['.', '.', '.'], ',': [',', ', ', ','], ';': [';', '; ', ';'], "'": ['′', "'", "'"],
  pi: ['π', 'pi', '\\pi '], e: ['e', 'e', 'e'], inf: ['∞', '∞', '\\infty '],
  sin: ['sin', 'sin(', '\\sin(#?)', 'fn'], cos: ['cos', 'cos(', '\\cos(#?)', 'fn'], tan: ['tan', 'tan(', '\\tan(#?)', 'fn'],
  ln: ['ln', 'log(', '\\ln(#?)', 'fn'], lg: ['log<sub>10</sub>', 'log10(', '\\log_{10}(#?)', 'fn'], logn: ['log<sub>n</sub>', 'logn(', '\\log_{2}(#?)', 'fn'],
  exp: ['e<sup><i>x</i></sup>', 'exp(', 'e^{#?}', 'fn'],
  cup: ['∪', '∪', '\\cup ', 'op'], cap: ['∩', '∩', '\\cap ', 'op'], sdiff: ['∖', '\\', '\\setminus ', 'op'], empty: ['∅', '∅', '\\emptyset '],
  '{': ['{', '{', '\\{'], '}': ['}', '}', '\\}'], '%': ['%', '%', '\\%']
};
const KBD_ACT = { bs: '⌫', left: '←', right: '→', up: '↑', down: '↓', enter: '↵', undo: '↶', redo: '↷', shift: '⇧' };
// Seiten: Zeilen aus Tastennamen; «v1 v2 v3» sind die Variablen des Feldes, einzelne Buchstaben/Ziffern stehen für sich
const KBD_PAGES = {
  main: { tab: '123', cols: 8, rows: ['v1 ( ) 7 8 9 frac bs', 'v2 sq pow 4 5 6 * left', 'v3 sqrt abs 1 2 3 - right', '= < > 0 . , + enter'] },
  fx: { tab: 'ƒ ≤', cols: 8, rows: ['sin cos tan ln lg logn exp bs', 'e pi nroot le ge ; inf left', '[ ] { } cup cap sdiff right', 'undo redo up down empty \' % enter'] },
  abc: { tab: 'abc', cols: 8, rows: ['a b c d e f g bs', 'h i j k l m n left', 'o p q r s t u right', 'shift v w x y z = enter'] },
  num: { tab: '123', cols: 5, rows: ['7 8 9 - bs', '4 5 6 / left', '1 2 3 pi right', '0 0 . * enter'] }
};
const KBD_KIND = { math: ['main', 'fx', 'abc'], expr: ['main', 'fx', 'abc'], num: ['num'] };

(function () {
  const css = `
#j10kb{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:none;background:var(--bg-sidebar,#f3f5f9);border-top:1px solid var(--border,#d5dae3);box-shadow:0 -6px 24px rgba(0,0,0,.16);padding:6px max(6px,env(safe-area-inset-right)) calc(6px + env(safe-area-inset-bottom)) max(6px,env(safe-area-inset-left));touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;--kh:46px;--kf:19px;font-family:var(--font-ui,system-ui,sans-serif)}
#j10kb.on{display:block}
#j10kb .j10kb-in{max-width:780px;margin:0 auto}
#j10kb .j10kb-bar{display:flex;align-items:center;gap:5px;height:32px;margin-bottom:5px}
#j10kb .j10kb-tab{height:100%;min-width:54px;padding:0 10px;border-radius:8px;border:1px solid transparent;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:var(--text-muted,#667)}
#j10kb .j10kb-tab.on{background:var(--accent-soft,rgba(55,138,221,.14));color:var(--accent,#378ADD)}
#j10kb .j10kb-echo{flex:1;min-width:0;height:100%;display:flex;align-items:center;justify-content:center;font:500 15px/1 var(--font-mono,ui-monospace,monospace);color:var(--text,#222);overflow:hidden;white-space:nowrap}
#j10kb .j10kb-echo b{font:600 12px/1 var(--font-ui,system-ui,sans-serif);color:var(--text-muted,#667);margin-right:8px;overflow:hidden;text-overflow:ellipsis;flex:0 1 auto}
#j10kb .j10kb-echo span{overflow:hidden;text-overflow:ellipsis;direction:rtl;unicode-bidi:plaintext}
#j10kb .j10kb-grid{display:grid;gap:5px;grid-template-columns:repeat(var(--kc,8),minmax(0,1fr))}
#j10kb .j10kb-k{height:var(--kh);border-radius:9px;border:1px solid var(--border-input,#d5dae3);background:var(--bg-input,#fff);color:var(--text,#222);font-size:var(--kf);font-weight:500;line-height:1;display:flex;align-items:center;justify-content:center;min-width:0;overflow:hidden;cursor:pointer}
#j10kb .j10kb-k sup,#j10kb .j10kb-k sub{font-size:.62em;line-height:0;position:relative;vertical-align:baseline;font-style:normal}
#j10kb .j10kb-k sup{top:-.55em}#j10kb .j10kb-k sub{top:.3em}
#j10kb .j10kb-k i{font-style:italic;font-family:Georgia,'Times New Roman',serif}
#j10kb .j10kb-k .j10kb-dot{font-size:1.7em;line-height:.5}
#j10kb .j10kb-k.k-d{font-weight:600;font-size:calc(var(--kf) + 2px)}
#j10kb .j10kb-k.k-v{font-style:italic;font-family:Georgia,'Times New Roman',serif;font-size:calc(var(--kf) + 2px)}
#j10kb .j10kb-k.k-op{background:var(--accent-soft,rgba(55,138,221,.14));border-color:transparent;color:var(--accent,#378ADD);font-weight:600;font-size:calc(var(--kf) + 3px)}
#j10kb .j10kb-k.k-fn{font-size:calc(var(--kf) - 3px)}
#j10kb .j10kb-k.k-a{background:var(--bg-btn,#e6e9f0);font-size:calc(var(--kf) + 2px)}
#j10kb .j10kb-k.k-enter{background:var(--accent,#378ADD);border-color:var(--accent,#378ADD);color:#fff;font-weight:600}
#j10kb .j10kb-k.k-on{background:var(--accent,#378ADD);color:#fff}
#j10kb .j10kb-k.off{opacity:.3;pointer-events:none}
#j10kb .j10kb-k.dn,#j10kb .j10kb-tab.dn{transform:scale(.93);filter:brightness(.86)}
#j10kb .j10kb-fr{display:inline-flex;flex-direction:column;gap:2px;align-items:center}
#j10kb .j10kb-fr i{display:block;width:11px;height:9px;border:1.5px solid currentColor;border-radius:2px;box-sizing:border-box}
#j10kb .j10kb-fr i:first-child{position:relative;margin-bottom:3px}
#j10kb .j10kb-fr i:first-child::after{content:'';position:absolute;left:-4px;right:-4px;bottom:-5px;border-top:1.5px solid currentColor}
#j10kb.k5 .j10kb-in{max-width:430px}
@media (max-height:500px){#j10kb{--kh:34px;--kf:17px;padding-top:4px}#j10kb .j10kb-bar{height:26px;margin-bottom:4px}#j10kb .j10kb-grid{gap:4px}#j10kb .j10kb-in{max-width:none}#j10kb.k5 .j10kb-in{max-width:520px}}
@media (min-width:700px) and (min-height:620px){#j10kb{--kh:52px;--kf:21px}#j10kb .j10kb-bar{height:36px}}
@media (max-width:480px){#j10kb .j10kb-tab{min-width:44px;padding:0 6px}#j10kb .j10kb-echo b{display:none}}
@media (max-width:360px){#j10kb{--kf:17px}#j10kb .j10kb-grid{gap:4px}}
body.j10kb-open math-field::part(virtual-keyboard-toggle){color:var(--accent,#378ADD)}
@media (pointer:coarse){#kbd-panel{display:none !important}}
`;
  const st = document.createElement('style'); st.id = 'j10kb-css'; st.textContent = css; document.head.appendChild(st);
})();

// ── Art des Feldes ───────────────────────────────────────────────────
const KBD_MATHY = /^[\d\s.,;:|+\-−*·\/^=<>()≤≥∞%°a-cknp-z]+$/i;
function kbdKind(el) {
  if (!el || !el.tagName || el.disabled || el.readOnly) return '';
  const d = el.getAttribute('data-kb');
  if (el.tagName === 'MATH-FIELD') return d === 'os' ? '' : (d && KBD_KIND[d] ? d : 'math');
  if (el.tagName !== 'INPUT') return '';
  if (d) return KBD_KIND[d] ? d : '';
  const ty = el.getAttribute('data-kb-type') || el.type;
  if (ty === 'number') return 'num';
  if (ty !== 'text') return '';
  const im = el.getAttribute('data-kb-im') !== null ? el.getAttribute('data-kb-im') : (el.getAttribute('inputmode') || '');
  if (im === 'decimal' || im === 'numeric') return 'num';
  if (im && im !== 'text' && im !== 'none') return '';
  if (!el.closest || !el.closest('#sidebar, .dif-card, #dif-card')) return '';
  const v = String(el.value || '').trim() || String(el.placeholder || '').trim();   // Inhalt (oder Muster) aus Zahlen, Zeichen und einzelnen Variablen → Term
  return v && v.length <= 60 && KBD_MATHY.test(v) && !/[a-z]{3,}/i.test(v.replace(/pi|sqrt|sin|cos|tan|log|exp|abs/gi, '')) ? 'expr' : '';
}
// Tastatur des Geräts für dieses Feld abschalten (muss VOR dem Fokus geschehen) bzw. wieder zulassen
function kbdTake(el) {
  if (el.tagName !== 'INPUT') return;
  if (el.getAttribute('data-kb-im') === null) el.setAttribute('data-kb-im', el.getAttribute('inputmode') || '');
  if (el.type === 'number') { el.setAttribute('data-kb-type', 'number'); try { el.type = 'text'; } catch (e) { /* defensiv */ } }   // Zahlenfelder kennen keine Schreibmarke und nehmen «−» allein nicht an
  el.setAttribute('inputmode', 'none');
}
function kbdGive(el) {
  if (!el || el.tagName !== 'INPUT') return;
  const im = el.getAttribute('data-kb-im');
  if (im !== null) { if (im) el.setAttribute('inputmode', /iPhone|iPod/.test(navigator.userAgent || '') && im === 'decimal' ? 'text' : im); else el.removeAttribute('inputmode'); el.removeAttribute('data-kb-im'); }
  if (el.getAttribute('data-kb-type') === 'number') { el.removeAttribute('data-kb-type'); const v = el.value; try { el.type = 'number'; el.value = isFinite(parseFloat(v)) ? String(parseFloat(v)) : ''; } catch (e) { /* defensiv */ } }
}

// ── Aufbau ───────────────────────────────────────────────────────────
function kbdVars(el) {
  const a = (el.getAttribute('data-kb-vars') || '').trim(); let v = a ? a.split(/\s+/) : [];
  if (!v.length) {                                        // Buchstaben aus Inhalt oder Muster des Feldes
    const of = s => { const out = []; String(s || '').replace(/\\[a-zA-Z]+/g, ' ').replace(/z\.\s?B\.|sqrt|nthroot|logn|log|sin|cos|tan|exp|abs|pi|ln|EC/g, ' ').replace(/[a-zA-Z]{3,}/g, ' ').replace(/[a-df-zA-Z]/g, c => { if (out.indexOf(c) < 0) out.push(c); return c; }); return out; };
    v = of(el.value); if (!v.length) v = of(el.getAttribute('placeholder'));
    for (const d of ['x', 'y']) if (v.length < 2 && v.indexOf(d) < 0) v.push(d);
  }
  return [v[0] || 'x', v[1] || 'y', v[2] || 'pi'];
}
function kbdKeyHtml(name, vars, plain) {
  if (/^v[123]$/.test(name)) name = vars[+name[1] - 1];
  if (name === 'abs' && plain) name = 'bar';
  const abc = KBD.pages[KBD.page] === 'abc';
  if (abc && /^[a-z]$/.test(name)) { const c = KBD.shift ? name.toUpperCase() : name; return '<div class="j10kb-k k-v" data-k="' + c + '">' + c + '</div>'; }
  if (KBD_ACT[name]) return '<div class="j10kb-k k-a' + (name === 'enter' ? ' k-enter' : '') + (name === 'shift' && KBD.shift ? ' k-on' : '') + (plain && /^(undo|redo|up|down)$/.test(name) ? ' off' : '') + '" data-k="' + name + '">' + KBD_ACT[name] + '</div>';
  const k = KBD_KEYS[name];
  if (k) return '<div class="j10kb-k' + (k[3] ? ' k-' + k[3] : '') + (plain && /^(nroot|logn)$/.test(name) ? ' off' : '') + '" data-k="' + name + '">' + k[0] + '</div>';
  if (/^\d$/.test(name)) return '<div class="j10kb-k k-d" data-k="' + name + '">' + name + '</div>';
  return '<div class="j10kb-k k-v" data-k="' + name + '">' + name + '</div>';
}
function kbdRender() {
  const el = KBD.el, t = KBD.target; if (!el || !t) return;
  const plain = t.tagName !== 'MATH-FIELD', P = KBD_PAGES[KBD.pages[KBD.page]] || KBD_PAGES.main, vars = kbdVars(t);
  let h = '<div class="j10kb-in"><div class="j10kb-bar">';
  if (KBD.pages.length > 1) KBD.pages.forEach((p, i) => { h += '<div class="j10kb-tab' + (i === KBD.page ? ' on' : '') + '" data-k="page:' + i + '">' + KBD_PAGES[p].tab + '</div>'; });
  h += '<div class="j10kb-echo"></div>';
  if (plain) h += '<div class="j10kb-tab" data-k="os">Aa</div>';
  h += '<div class="j10kb-tab" data-k="hide">⌄</div></div><div class="j10kb-grid" style="--kc:' + P.cols + '">';
  P.rows.forEach(r => {
    const ks = r.split(' ');
    for (let i = 0; i < ks.length; i++) {
      let span = 1; while (ks[i + span] === ks[i] && /^\d$/.test(ks[i])) span++;
      const one = kbdKeyHtml(ks[i], vars, plain);
      h += span > 1 ? one.replace('class="', 'style="grid-column:span ' + span + '" class="') : one;
      i += span - 1;
    }
  });
  el.innerHTML = h + '</div></div>';
  el.classList.toggle('k5', P.cols <= 5);
  kbdEcho();
}
// Anzeige in der Kopfzeile: Name und Inhalt des Feldes (bei Textfeldern) – man sieht, was man tippt, auch wenn das Feld knapp über der Tastatur steht
function kbdEcho() {
  const e = KBD.el && KBD.el.querySelector('.j10kb-echo'), t = KBD.target; if (!e || !t) return;
  if (t.tagName === 'MATH-FIELD') { e.textContent = ''; return; }
  let lab = '';
  try { const row = t.closest('.settings-row, .param-row, label'); const l = row && row.querySelector('label, .param-name'); lab = (l && l !== t ? l.textContent : (t.getAttribute('aria-label') || '')).replace(/[◀▶]/g, '').trim().slice(0, 28); } catch (ex) { /* defensiv */ }
  e.innerHTML = ''; if (lab) { const b = document.createElement('b'); b.textContent = lab; e.appendChild(b); }
  const s = document.createElement('span'); s.textContent = t.value === '' ? ' ' : t.value; e.appendChild(s);
}
function kbdBuild() {
  if (KBD.el) return;
  const el = KBD.el = document.createElement('div'); el.id = 'j10kb'; el.setAttribute('translate', 'no'); el.setAttribute('role', 'group');
  document.body.appendChild(el);
  const keyOf = e => (e.target && e.target.closest ? e.target.closest('[data-k]') : null);
  const stop = () => { clearTimeout(KBD.repT); clearInterval(KBD.rep); KBD.rep = 0; el.querySelectorAll('.dn').forEach(k => k.classList.remove('dn')); };
  el.addEventListener('pointerdown', e => {
    e.preventDefault();                                   // der Fokus bleibt im Feld
    const k = keyOf(e); if (!k) return;
    const name = k.getAttribute('data-k'); k.classList.add('dn'); clearTimeout(KBD.closeT);
    kbdPress(name);
    if (/^(bs|left|right)$/.test(name)) { clearTimeout(KBD.repT); clearInterval(KBD.rep); KBD.repT = setTimeout(() => { KBD.rep = setInterval(() => kbdPress(name), 70); }, 420); }   // gedrückt halten wiederholt
    else setTimeout(() => k.classList.remove('dn'), 130);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => el.addEventListener(n, stop));
  ['mousedown', 'touchstart', 'touchend', 'click', 'dblclick', 'contextmenu'].forEach(n => el.addEventListener(n, e => { if (e.cancelable) e.preventDefault(); }, { passive: false }));
}

// ── Öffnen, Schliessen, Sichtbarkeit ─────────────────────────────────
function kbdHeight() { return KBD.open && KBD.el ? Math.round(KBD.el.getBoundingClientRect().height) : 0; }
window.kbdHeight = kbdHeight;
function kbdOpen(t, kind) {
  kind = kind || kbdKind(t); if (!kind) return;
  kbdBuild(); clearTimeout(KBD.closeT);
  if (KBD.target && KBD.target !== t) kbdCommit(KBD.target);
  const fresh = KBD.target !== t || !KBD.open;
  if (fresh) { KBD.pages = KBD_KIND[kind]; KBD.page = 0; KBD.shift = false; KBD.init = t.tagName === 'INPUT' ? t.value : null; }
  KBD.target = t; KBD.kind = kind; KBD.open = true;
  try { if (window.mathVirtualKeyboard && window.mathVirtualKeyboard.visible) window.mathVirtualKeyboard.hide(); } catch (e) { /* defensiv */ }
  kbdRender(); KBD.el.classList.add('on'); document.body.classList.add('j10kb-open');
  if (fresh && kind === 'num' && t.tagName === 'INPUT') { const sel = () => { try { if (KBD.target === t && document.activeElement === t) t.setSelectionRange(0, t.value.length); } catch (e) { /* defensiv */ } }; sel(); setTimeout(sel, 60); }   // Zahlenfeld: alles markiert, die erste Taste ersetzt den alten Wert
  kbdLayout();
}
function kbdLayout() {
  if (!KBD.open) return;
  document.documentElement.style.setProperty('--j10kb-h', kbdHeight() + 'px');
  try { if (typeof sbKbSync === 'function') sbKbSync(); } catch (e) { /* defensiv */ }
  requestAnimationFrame(() => { kbdReveal(); setTimeout(kbdReveal, 260); });
}
// Das Feld über die Tastatur holen: den nächsten rollbaren Vorfahren unten polstern und rollen
function kbdReveal() {
  const t = KBD.target; if (!KBD.open || !t || !t.isConnected) return;
  const kb = KBD.el.getBoundingClientRect(), limit = kb.top - 12;
  let sc = t.parentElement;
  while (sc && sc !== document.body) { const cs = getComputedStyle(sc); if (/(auto|scroll)/.test(cs.overflowY) && sc.clientHeight > 0) break; sc = sc.parentElement; }
  if (!sc || sc === document.body) return;
  const sr = sc.getBoundingClientRect();
  const need = Math.max(0, Math.round(sr.bottom - kb.top));                // so viel des rollbaren Bereichs liegt unter der Tastatur
  if (KBD.pad && KBD.pad.el !== sc) kbdUnpad();
  if (need > 0 && !KBD.pad) KBD.pad = { el: sc, old: sc.style.paddingBottom };
  if (KBD.pad) sc.style.paddingBottom = (need + 16) + 'px';
  const r = t.getBoundingClientRect(), top = Math.max(sr.top, 0) + 8;
  if (r.bottom > limit) sc.scrollTop += Math.round(r.bottom - limit);
  else if (r.top < top) sc.scrollTop -= Math.round(top - r.top);
}
function kbdUnpad() { if (KBD.pad) { try { KBD.pad.el.style.paddingBottom = KBD.pad.old; } catch (e) { /* defensiv */ } KBD.pad = null; } }
// Abschluss eines Textfeldes: wie beim Verlassen nach dem Tippen ein «change» auslösen
function kbdCommit(t) {
  if (!t || t.tagName !== 'INPUT') return;
  const changed = KBD.init !== null && t.value !== KBD.init; KBD.init = t.value;
  kbdGive(t);
  if (changed && t.isConnected) { try { t.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) { /* defensiv */ } }
}
function kbdClose(blur) {
  if (!KBD.open) return;
  const t = KBD.target; clearTimeout(KBD.repT); clearInterval(KBD.rep); clearTimeout(KBD.closeT);
  KBD.open = false; KBD.target = null; KBD.el.classList.remove('on'); document.body.classList.remove('j10kb-open');
  document.documentElement.style.setProperty('--j10kb-h', '0px'); kbdUnpad();
  if (t) { if (blur) { try { t.blur(); } catch (e) { /* defensiv */ } } kbdCommit(t); }
  try { if (typeof sbKbSync === 'function') sbKbSync(); } catch (e) { /* defensiv */ }
}

// Formelfeld wirklich fokussieren. Die Formelbibliothek merkt sich den Fokus in einem eigenen Schalter; war das Feld
// beim Laden fokussiert und wurde dann samt Leiste ausgeblendet (Handy), blieb der Schalter stehen: Das Feld hielt
// sich für fokussiert, nahm aber weder Tippen noch Tasten an. Darum zählt hier nur document.activeElement.
function kbdMfFocus(mf) {
  if (document.activeElement === mf) return false;
  try {
    const sink = mf.shadowRoot && mf.shadowRoot.querySelector('[part=keyboard-sink], .ML__keyboard-sink');
    if (mf.hasFocus() && sink) sink.focus({ preventScroll: true }); else mf.focus();
    if (document.activeElement !== mf && sink) sink.focus({ preventScroll: true });
  } catch (e) { /* defensiv */ }
  return true;
}

// ── Tastendruck ──────────────────────────────────────────────────────
function kbdPress(name) {
  const t = KBD.target;
  if (!t || !t.isConnected) { kbdClose(false); return; }
  if (name === 'hide') { kbdClose(true); return; }
  if (name.indexOf('page:') === 0) { KBD.page = +name.slice(5) || 0; kbdRender(); kbdLayout(); return; }
  if (name === 'shift') { KBD.shift = !KBD.shift; kbdRender(); return; }
  if (name === 'os') {                                    // Tastatur des Geräts für dieses Feld
    const el = t; kbdClose(true); el.setAttribute('data-kb-skip', '1');
    setTimeout(() => { try { el.focus(); } catch (e) { /* defensiv */ } }, 60); return;
  }
  if (t.tagName === 'MATH-FIELD') kbdPressMath(t, name); else kbdPressPlain(t, name);
  if (KBD.shift && /^[A-Z]$/.test(name)) { KBD.shift = false; kbdRender(); }
  kbdEcho(); if (KBD.open) kbdReveal();
}
function kbdEnterKey(t) {
  let ok = true;
  try { ok = t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true, composed: true })); } catch (e) { /* defensiv */ }
  try { t.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, composed: true })); } catch (e) { /* defensiv */ }
  return ok;
}
function kbdPressMath(mf, name) {
  const cmd = { bs: 'deleteBackward', left: 'moveToPreviousChar', right: 'moveToNextChar', up: 'moveUp', down: 'moveDown', undo: 'undo', redo: 'redo' }[name];
  try {
    if (kbdMfFocus(mf)) { try { mf.executeCommand('moveToMathfieldEnd'); } catch (e) { /* defensiv */ } }   // ohne Fokus wählt das Feld sonst alles aus und die Taste ersetzt den Inhalt
    if (name === 'enter') { kbdEnterKey(mf); if (KBD.target === mf) kbdClose(true); return; }
    if (cmd) { mf.executeCommand(cmd); return; }
    const k = KBD_KEYS[name], latex = k ? k[2] : name;
    mf.executeCommand(['insert', latex, { focus: true, feedback: false, scrollIntoView: true, mode: 'math', format: 'latex' }]);
  } catch (e) { /* defensiv */ }
}
function kbdPressPlain(inp, name) {
  if (name === 'enter') { kbdEnterKey(inp); if (KBD.target === inp) kbdClose(true); return; }
  if (/^(undo|redo|up|down)$/.test(name)) return;
  let a = inp.value.length, b = a;
  try { if (document.activeElement === inp && inp.selectionStart !== null) { a = inp.selectionStart; b = inp.selectionEnd; } } catch (e) { /* Feld ohne Schreibmarke */ }
  const v = inp.value; let nv = v, pos = a;
  if (name === 'left') pos = Math.max(0, a - 1);
  else if (name === 'right') pos = Math.min(v.length, b + 1);
  else if (name === 'bs') { if (a !== b) { nv = v.slice(0, a) + v.slice(b); } else if (a > 0) { let n = 1; if (/ [|,;] $/.test(v.slice(0, a))) n = 3; else if (/[,;] $/.test(v.slice(0, a))) n = 2; nv = v.slice(0, a - n) + v.slice(a); pos = a - n; } }
  else {
    const k = KBD_KEYS[name]; let s = k ? k[1] : name;
    if (KBD.kind === 'num') s = s.trim();
    if (s === ' | ' && / $/.test(v.slice(0, a))) s = '| ';
    nv = v.slice(0, a) + s + v.slice(b); pos = a + s.length;
  }
  if (nv !== v) { inp.value = nv; }
  try { if (document.activeElement !== inp) inp.focus({ preventScroll: true }); inp.setSelectionRange(pos, pos); } catch (e) { /* defensiv */ }
  if (nv !== v) { try { inp.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { /* defensiv */ } }
}

// ── Anbindung: Antippen öffnet, Verlassen schliesst ──────────────────
(function () {
  const touchOnly = () => { try { return navigator.maxTouchPoints > 0 && window.matchMedia('(hover: none)').matches; } catch (e) { return false; } };
  // Von selbst öffnet die Tastatur nur, wenn das Feld eben mit Finger oder Stift angetippt wurde – oder ein «+»-Knopf der
  // Leiste, der ein neues, sichtbares Feld fokussiert («+ Funktion»). Ein Fokus beim Laden oder beim Themenwechsel zählt nicht.
  const visible = t => { try { const r = t.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth; } catch (e) { return false; } };
  const byTouch = t => !KBD.hw && (KBD.ptr === 'touch' || KBD.ptr === 'pen' || touchOnly()) && Date.now() - KBD.ptrT < 1500 && (!t || KBD.ptrEl === t || (KBD.ptrSb && visible(t)));
  const field = e => { const p = e.composedPath ? e.composedPath() : [e.target]; for (const n of p) { if (n && n.tagName && (n.tagName === 'INPUT' || n.tagName === 'MATH-FIELD')) return n; } return null; };
  window.addEventListener('pointerdown', e => {
    if (KBD.el && KBD.el.contains(e.target)) return;
    KBD.ptr = e.pointerType || ''; KBD.ptrT = Date.now();
    let t = field(e);
    if (!t) { try { const lab = e.target.closest && e.target.closest('label'); if (lab && lab.control && lab.control.tagName === 'INPUT') t = lab.control; } catch (ex) { /* defensiv */ } }
    KBD.ptrEl = t; KBD.ptrSb = false;
    try { const bt = e.target.closest && e.target.closest('#sidebar button'); KBD.ptrSb = !!(bt && /^\s*\+/.test(bt.textContent || '')); } catch (ex) { /* defensiv */ }   // «+ Funktion», «+ Ungleichung»: das neue Feld darf die Tastatur öffnen
    if (t && t.tagName === 'INPUT' && byTouch(t)) {
      if (t.getAttribute('data-kb-skip')) { if (document.activeElement !== t) t.removeAttribute('data-kb-skip'); else return; }
      if (kbdKind(t)) kbdTake(t);
    }
  }, true);
  // Loslassen über einem Feld:
  // – Formelfeld, das höher ist als sein Inhalt (z. B. neben gestapelten Knöpfen): Ein Tipp in die leere Fläche setzte
  //   bisher keinen Fokus – jetzt landet die Schreibmarke am Ende.
  // – Feld, das schon den Fokus hat (das Thema «Funktionen» fokussiert sein Feld beim Öffnen): Es kommt kein neues
  //   «focusin», die Tastatur öffnet darum hier.
  window.addEventListener('pointerup', e => {
    if (KBD.el && KBD.el.contains(e.target)) return;
    const t = field(e); if (!t || t.disabled || t.readOnly) return;
    const p = e.composedPath ? e.composedPath() : [], empty = p[0] === t;
    for (const n of p) { if (n === t) break; if (n && n.getAttribute && n.getAttribute('part') === 'virtual-keyboard-toggle') return; }   // das Tastatur-Symbol schaltet selbst
    setTimeout(() => {
      if (!t.isConnected) return;
      if (t.tagName === 'MATH-FIELD' && document.activeElement !== t && kbdMfFocus(t) && empty) { try { t.executeCommand('moveToMathfieldEnd'); } catch (ex) { /* defensiv */ } }
      if ((KBD.open && KBD.target === t) || document.activeElement !== t || t.getAttribute('data-kb-skip') || !byTouch(t)) return;
      const kind = kbdKind(t); if (!kind) return;
      if (t.tagName === 'INPUT' && t.getAttribute('inputmode') !== 'none') kbdTake(t);
      kbdOpen(t, kind);
    }, 0);
  }, true);
  document.addEventListener('focusin', e => {
    const t = e.target; if (!t || (KBD.el && KBD.el.contains(t))) return;
    if (t.getAttribute && t.getAttribute('data-kb-skip')) return;
    const kind = kbdKind(t);
    if (kind && (KBD.open || byTouch(t))) {
      if (t.tagName === 'INPUT' && t.getAttribute('inputmode') !== 'none') {       // Fokus kam nicht durch Antippen des Feldes: Gerätetastatur abschalten und neu fokussieren
        if (t.__kbRefocus) return; t.__kbRefocus = true; kbdTake(t);
        try { t.blur(); } catch (ex) { /* defensiv */ }
        setTimeout(() => { try { t.focus({ preventScroll: true }); } catch (ex) { /* defensiv */ } t.__kbRefocus = false; }, 0); return;
      }
      kbdOpen(t, kind);
    }
    else if (KBD.open) kbdClose(false);
  });
  document.addEventListener('focusout', e => {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute('data-kb-skip') && t !== KBD.target) { setTimeout(() => { if (document.activeElement !== t) { t.removeAttribute('data-kb-skip'); kbdGive(t); } }, 80); }
    if (!KBD.open || t !== KBD.target) return;
    clearTimeout(KBD.closeT);
    KBD.closeT = setTimeout(() => { const a = document.activeElement; if (KBD.open && KBD.target === t && a !== t && !(a && kbdKind(a))) kbdClose(false); }, 180);
  });
  // Wer auf einer echten Tastatur tippt, braucht die Bildschirmtastatur nicht
  document.addEventListener('keydown', e => {
    if (!e.isTrusted || !KBD.open) return;
    if (e.key === 'Escape') { kbdClose(true); return; }
    if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) { KBD.hw = true; const t = KBD.target; kbdClose(false); if (t && t.tagName === 'INPUT') { /* Feld bleibt im Fokus, Tippen geht weiter */ } }
  }, true);
  // Tastatur-Symbol im Formelfeld: öffnet/schliesst diese Tastatur statt jener der Formelbibliothek
  const hook = () => {
    try {
      const vk = window.mathVirtualKeyboard; if (!vk || vk.__j10) return; vk.__j10 = true;
      vk.addEventListener('before-virtual-keyboard-toggle', ev => {
        if (!ev.detail || !ev.detail.visible) return;
        ev.preventDefault();
        let a = document.activeElement; while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
        const mf = (a && a.closest && a.closest('math-field')) || (document.activeElement && document.activeElement.tagName === 'MATH-FIELD' ? document.activeElement : null) || (typeof activeInput !== 'undefined' && activeInput && activeInput.el && activeInput.el.tagName === 'MATH-FIELD' ? activeInput.el : null);
        if (KBD.open && (!mf || KBD.target === mf)) { kbdClose(false); return; }
        if (mf && kbdKind(mf)) { KBD.hw = false; kbdOpen(mf); }
      });
    } catch (e) { /* defensiv */ }
  };
  hook(); document.addEventListener('DOMContentLoaded', hook); window.addEventListener('load', hook);
  let rt = 0; const relay = () => { if (!KBD.open) return; cancelAnimationFrame(rt); rt = requestAnimationFrame(kbdLayout); };
  window.addEventListener('resize', relay); window.addEventListener('orientationchange', relay);
  try { window.visualViewport.addEventListener('resize', relay); } catch (e) { /* defensiv */ }
})();
