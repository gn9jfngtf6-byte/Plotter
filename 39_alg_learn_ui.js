// ═══════════════════════════════════════════════════════════════════
// 39_alg_learn_ui.js — Algebra: Oberfläche für Beispiele, Merkblatt und Üben
//
// Inhalte und Prüfung: 38_alg_learn.js (AlgLearn). Hier: Reiter unter der Darstellungs-Wahl.
// Wird von 34_alg_ui.js aufgerufen (algLearnBuild beim Aufbau, algLearnRefresh nach jeder Änderung).
// ═══════════════════════════════════════════════════════════════════
const ALG_LEARN = { tab: 'ex', idx: {}, task: null, pkind: 'expr', fb: null, level: 1, score: { ok: 0, n: 0 }, key: '', ans: null, seq: 0, open: true };

(function () {
  const css = `
.alg-learn{margin:2px 0 10px;border:1px solid var(--border-input,#d5dae3);border-radius:8px;overflow:hidden;background:var(--bg-input,#fff)}
.alg-ltabs{display:flex;border-bottom:1px solid var(--border-input,#d5dae3)}
.alg-ltab{flex:1;border:0;background:transparent;padding:6px 4px;font-size:12px;font-weight:600;cursor:pointer;color:var(--text-muted,#667);border-radius:0}
.alg-ltab.on{background:rgba(55,138,221,.12);color:#378ADD}
.alg-lbody{padding:8px}
.alg-lintro{font-size:11.5px;color:var(--text-muted,#667);margin:0 0 6px}
.alg-cards{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin}
.alg-card{flex:0 0 auto;max-width:150px;text-align:left;border:1px solid var(--border-input,#d5dae3);background:transparent;border-radius:7px;padding:5px 7px;cursor:pointer;color:var(--text,#222);font-size:11px;line-height:1.25}
.alg-card.on{border-color:#378ADD;background:rgba(55,138,221,.12)}
.alg-card b{display:block;font-size:11px;font-weight:600;margin-bottom:2px}
.alg-card .m{font-size:12px;white-space:nowrap}
.alg-lnav{display:flex;align-items:center;gap:6px;margin:6px 0 2px}
.alg-lnav button{border:1px solid var(--border-input,#d5dae3);background:transparent;border-radius:6px;padding:1px 9px;cursor:pointer;color:var(--text,#222)}
.alg-lnav span{flex:1;text-align:center;font-size:11px;color:var(--text-muted,#667)}
.alg-lnote{font-size:12px;line-height:1.4;margin:4px 0 0;color:var(--text,#222)}
.alg-law{display:flex;align-items:center;gap:6px;padding:4px 0;border-top:1px solid var(--border-input,#e5e8ee)}
.alg-law:first-child{border-top:0}
.alg-law .t{flex:1;min-width:0}
.alg-law .n{font-size:11.5px;font-weight:600}
.alg-law .f{font-size:13px;overflow-x:auto;overflow-y:hidden}
.alg-law button{flex:0 0 auto;font-size:11px;border:1px solid var(--border-input,#d5dae3);background:transparent;border-radius:6px;padding:2px 7px;cursor:pointer;color:var(--text,#222)}
.alg-ptitle{font-size:11.5px;font-weight:600;margin:0 0 4px}
.alg-ptask{font-size:16px;padding:6px 8px;border-radius:6px;background:rgba(55,138,221,.08);overflow-x:auto;margin-bottom:6px}
.alg-pbtns{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 4px}
.alg-pbtns button{font-size:11.5px;border:1px solid var(--border-input,#d5dae3);background:transparent;border-radius:6px;padding:3px 9px;cursor:pointer;color:var(--text,#222)}
.alg-pbtns button.pri{background:#378ADD;border-color:#378ADD;color:#fff}
.alg-pbtns button.ok{background:#2fa36b;border-color:#2fa36b;color:#fff}
.alg-pbtns button.bad{background:#d9486b;border-color:#d9486b;color:#fff}
.alg-pfb{font-size:12px;min-height:16px;margin:2px 0}
.alg-pfb.ok{color:#2fa36b;font-weight:600}.alg-pfb.bad{color:#d9486b}
.alg-pscore{font-size:11px;color:var(--text-muted,#667);margin-top:2px}
.alg-psub{display:flex;gap:4px;margin-bottom:6px}
.alg-psub button{flex:1;font-size:11px;border:1px solid var(--border-input,#d5dae3);background:transparent;border-radius:6px;padding:2px;cursor:pointer;color:var(--text,#222)}
.alg-psub button.on{border-color:#378ADD;background:rgba(55,138,221,.12)}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();

function algLHtml(tex) {
  if (typeof latexToMathLiveHtml !== 'function') return tex;
  // \neq wird von MathLive mit Überlappung gesetzt (hier unsauber) → eigenes Zeichen
  if (tex.indexOf('\\neq') >= 0) return tex.split('\\neq').map(t => latexToMathLiveHtml(t)).join('<span style="font-family:KaTeX_Main;margin:0 0.28em">\u2260</span>');
  return latexToMathLiveHtml(tex);
}
function algLMath(tex, cls) { const d = document.createElement('span'); d.setAttribute('translate', 'no'); if (cls) d.className = cls; d.innerHTML = algLHtml(tex); return d; }
function algLTex(x) { try { return AlgMore.fieldLatex(x); } catch (e) { return x; } }

function algLearnBuild() {
  if (typeof AlgLearn === 'undefined') return;
  const modes = $alg('alg-modes'); if (!modes || $alg('alg-learn')) return;
  const box = algEl('div', 'alg-learn'); box.id = 'alg-learn';
  const tabs = algEl('div', 'alg-ltabs');
  [['ex', 'Beispiele'], ['law', 'Gesetze'], ['prac', 'Üben']].forEach(([id, label]) => {
    const b = algEl('button', 'alg-ltab', label); b.type = 'button'; b.setAttribute('data-tab', id);
    b.addEventListener('click', () => { ALG_LEARN.tab = id; ALG_LEARN.key = ''; algLearnRefresh(); });
    tabs.appendChild(b);
  });
  const body = algEl('div', 'alg-lbody'); body.id = 'alg-lbody';
  box.appendChild(tabs); box.appendChild(body);
  modes.parentNode.insertBefore(box, modes.nextSibling);
}

function algLoadExample(mode, x, opt) {
  ALG.mode = mode; ALG.text = x;
  ALG.opt = Object.assign({ tiles: false, style: 'area', explode: 0, method: 'add' }, opt || {});
  algRefresh(true); algCommit();
}

// ── Beispiele ────────────────────────────────────────────────────────
function algLearnExamples(body) {
  const mode = ALG.mode, list = AlgLearn.EXAMPLES[mode] || [];
  const cur = list.findIndex(e => e[1] === ALG.text);
  if (cur >= 0) ALG_LEARN.idx[mode] = cur;
  const i = ALG_LEARN.idx[mode] === undefined ? -1 : ALG_LEARN.idx[mode];
  body.appendChild(algEl('div', 'alg-lintro', AlgLearn.INTRO[mode] || ''));
  const row = algEl('div', 'alg-cards');
  list.forEach((e, k) => {
    const c = algEl('button', 'alg-card' + (k === cur ? ' on' : '')); c.type = 'button';
    c.appendChild(algEl('b', '', e[0])); c.appendChild(algLMath(algLTex(e[1]), 'm'));
    c.addEventListener('click', () => { ALG_LEARN.idx[mode] = k; algLoadExample(mode, e[1], e[3]); });
    row.appendChild(c);
  });
  body.appendChild(row);
  const nav = algEl('div', 'alg-lnav');
  const mkBtn = (txt, d) => { const b = algEl('button', '', txt); b.type = 'button'; b.addEventListener('click', () => { const n = list.length, k = ((i < 0 ? (d > 0 ? -1 : 0) : i) + d + n) % n; ALG_LEARN.idx[mode] = k; algLoadExample(mode, list[k][1], list[k][3]); }); return b; };
  nav.appendChild(mkBtn('‹', -1)); nav.appendChild(algEl('span', '', (i >= 0 ? (i + 1) : '–') + ' / ' + list.length)); nav.appendChild(mkBtn('›', 1));
  body.appendChild(nav);
  if (cur >= 0) body.appendChild(algEl('div', 'alg-lnote', list[cur][2]));
  const act = row.querySelector('.alg-card.on'); if (act && act.scrollIntoView) { try { row.scrollLeft = act.offsetLeft - row.offsetLeft - 8; } catch (e) { /* egal */ } }
}

// ── Gesetze (Merkblatt) ──────────────────────────────────────────────
function algLearnLaws(body) {
  const mode = ALG.mode, list = AlgLearn.LAWS[mode] || [];
  body.appendChild(algEl('div', 'alg-lintro', 'Tippe auf «Beispiel», dann wird es vorgerechnet und gezeichnet.'));
  list.forEach(l => {
    const r = algEl('div', 'alg-law'), t = algEl('div', 't');
    t.appendChild(algEl('div', 'n', l[0])); const f = algEl('div', 'f'); f.appendChild(algLMath(l[1])); t.appendChild(f); r.appendChild(t);
    if (l[2]) { const b = algEl('button', '', 'Beispiel'); b.type = 'button'; b.addEventListener('click', () => algLoadExample(mode, l[2])); r.appendChild(b); }
    body.appendChild(r);
  });
}

// ── Üben ─────────────────────────────────────────────────────────────
function algLearnNewTask() {
  const L = ALG_LEARN;
  L.task = AlgLearn.newTask(ALG.mode, Math.random, (L.pkind === 'law' && AlgLearn.LAW_MODES.indexOf(ALG.mode) >= 0) ? 'law' : undefined, L.level);
  L.fb = null; L.seq++; L.answered = false; L.shown = false;
}
function algLearnAnswerField() {
  const inp = document.createElement('math-field');
  inp.className = 'func-inp-ce alg-inp';
  inp.style.cssText = 'font-size:15px;padding:4px 8px;border:1px solid var(--border-input);border-radius:6px;background:var(--bg-input);color:var(--text);width:100%;box-sizing:border-box;';
  inp.mathVirtualKeyboardPolicy = 'manual';
  inp.setAttribute('placeholder', 'Antwort');
  inp.addEventListener('focusin', () => { inp.style.borderColor = '#378ADD'; if (typeof setActiveInput === 'function') setActiveInput(inp, -1); });
  inp.addEventListener('focusout', () => { inp.style.borderColor = ''; });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); algLearnCheck(); } });
  return inp;
}
function algLearnCheck() {
  const L = ALG_LEARN, t = L.task; if (!t || !L.ans) return;
  let v = ''; try { v = L.ans.getValue('latex'); } catch (e) { v = L.ans.value || ''; }
  const r = AlgLearn.check(t, v);
  L.fb = r; if (!L.answered && (r.ok || true)) { /* Zählung nur beim ersten Versuch */ }
  if (!L.counted) { L.score.n++; if (r.ok) L.score.ok++; L.counted = true; }
  algLearnRefresh(true);
}
function algLearnPractice(body) {
  const L = ALG_LEARN, mode = ALG.mode;
  const hasLaw = AlgLearn.LAW_MODES.indexOf(mode) >= 0;
  if (!hasLaw) L.pkind = 'expr';
  if (hasLaw) {
    const sub = algEl('div', 'alg-psub');
    [['expr', 'Aufgaben'], ['law', 'Gesetz erkennen']].forEach(([id, label]) => {
      const b = algEl('button', L.pkind === id ? 'on' : '', label); b.type = 'button';
      b.addEventListener('click', () => { L.pkind = id; L.task = null; L.counted = false; L.key = ''; algLearnRefresh(); });
      sub.appendChild(b);
    });
    body.appendChild(sub);
  }
  if (L.pkind === 'expr') {
    const lev = algEl('div', 'alg-psub');
    [['leicht', 1], ['mittel', 2], ['schwer', 3]].forEach(([label, n]) => {
      const b = algEl('button', L.level === n ? 'on' : '', label); b.type = 'button';
      b.addEventListener('click', () => { L.level = n; L.task = null; L.counted = false; L.key = ''; L.fb = null; L.score = { ok: 0, n: 0 }; algLearnRefresh(); });
      lev.appendChild(b);
    });
    body.appendChild(lev);
  }
  if (!L.task || L.task.mode !== mode || (L.pkind === 'law') !== (L.task.kind === 'law') || (L.task.kind !== 'law' && L.task.level !== L.level)) { algLearnNewTask(); L.counted = false; }
  const t = L.task;
  if (!t) { body.appendChild(algEl('div', 'alg-lintro', 'Hier gibt es leider keine Aufgabe.')); return; }
  body.appendChild(algEl('div', 'alg-ptitle', t.title));
  const tk = algEl('div', 'alg-ptask'); tk.appendChild(algLMath(t.tex)); body.appendChild(tk);
  const btns = algEl('div', 'alg-pbtns');
  const next = () => { algLearnNewTask(); L.counted = false; L.key = ''; algLearnRefresh(); };
  if (t.kind === 'law') {
    t.options.forEach(o => {
      const b = algEl('button', L.fb && L.fb.pick === o ? (L.fb.ok ? 'ok' : 'bad') : '', o); b.type = 'button';
      b.addEventListener('click', () => {
        const r = AlgLearn.check(t, o); L.fb = Object.assign({ pick: o }, r);
        if (!L.counted) { L.score.n++; if (r.ok) L.score.ok++; L.counted = true; }
        algLearnRefresh(true);
        if (r.ok) { const law = (AlgLearn.LAWS[mode] || []).find(x => x[0] === t.expect); if (law && law[2]) algLoadExample(mode, law[2]); }
      });
      btns.appendChild(b);
    });
    body.appendChild(btns);
  } else {
    const f = L.ans = algLearnAnswerField(); body.appendChild(f);
    if (L.lastAns && L.lastAns.seq === L.seq) { try { f.value = L.lastAns.v; } catch (e) { /* egal */ } }
    f.addEventListener('input', () => { try { L.lastAns = { seq: L.seq, v: f.getValue('latex') }; } catch (e) { /* egal */ } });
    const chk = algEl('button', 'pri', 'Prüfen'); chk.type = 'button'; chk.addEventListener('click', algLearnCheck); btns.appendChild(chk);
    const sol = algEl('button', '', 'Lösung zeigen'); sol.type = 'button';
    sol.addEventListener('click', () => { if (!L.counted) { L.score.n++; L.counted = true; } L.shown = true; algLoadExample(t.solMode, t.solText); });
    btns.appendChild(sol);
    body.appendChild(btns);
  }
  const nb = algEl('button', '', 'Neue Aufgabe'); nb.type = 'button'; nb.addEventListener('click', next); if (t.kind === 'law') btns.appendChild(nb); else btns.appendChild(nb);
  const fb = algEl('div', 'alg-pfb' + (L.fb ? (L.fb.ok ? ' ok' : ' bad') : ''), L.fb ? L.fb.msg : '');
  body.appendChild(fb);
  if (L.fb && t.kind === 'law' && !L.fb.ok) { /* nochmals wählen */ }
  if (L.fb && t.kind === 'law' && L.fb.ok) body.appendChild(algEl('div', 'alg-lnote', 'So ist es: ' + t.expect + '.'));
  body.appendChild(algEl('div', 'alg-pscore', 'Richtig: ' + L.score.ok + ' von ' + L.score.n));
}

function algLearnRefresh(force) {
  if (typeof AlgLearn === 'undefined') return;
  const box = $alg('alg-learn'), body = $alg('alg-lbody'); if (!box || !body) return;
  const L = ALG_LEARN;
  const mode = ALG.mode, cur = L.tab === 'ex' ? (AlgLearn.EXAMPLES[mode] || []).findIndex(e => e[1] === ALG.text) : -2;
  const key = [L.tab, mode, cur, L.pkind, L.seq, L.level, L.task && L.task.kind].join('|');
  box.querySelectorAll('.alg-ltab').forEach(b => b.classList.toggle('on', b.getAttribute('data-tab') === L.tab));
  if (!force && key === L.key) return;
  // Eingabefeld nicht zerstören, solange man darin tippt
  if (!force && L.tab === 'prac' && body.contains(document.activeElement)) return;
  L.key = key;
  body.replaceChildren();
  if (L.tab === 'ex') algLearnExamples(body);
  else if (L.tab === 'law') algLearnLaws(body);
  else algLearnPractice(body);
}
