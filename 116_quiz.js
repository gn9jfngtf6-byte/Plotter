// 116_quiz.js — Quiz zu den Ansichten der Themen (Single Choice: vier Antworten oder Wahr/Falsch)
//
// Die Fragen liegen je Thema in quiz_<thema>.js und werden erst beim Öffnen eines Quiz nachgeladen:
//   (window.QUIZ_DATA = window.QUIZ_DATA || {}).diff = { tan: [ … ], gr: [ … ], … }      (Schlüssel = Ansicht)
// Eine Frage:  { l, q, a, e }   l  Stufe: 1 Grundwissen, 2 Verständnis, 3 Knacknuss
//                               q  Frage (Formeln in $…$, **fett**)
//                               a  vier Antworten; die ERSTE ist die richtige (angezeigt wird gemischt)
//                               e  Begründung, erscheint nach der Antwort bzw. in der Auswertung
//         oder { l, q, tf, e }  Aussage mit tf: true (wahr) oder false (falsch)
// Neues Thema: Datei quiz_<thema>.js anlegen und die Ansichten unten in QUIZ_ENVS eintragen.
// Ablauf: immer alle Fragen in fester Reihenfolge, von leicht nach schwierig; «Üben» zeigt nach jeder Antwort die Begründung,
// «Prüfung» wertet erst am Schluss aus. Das Quiz gehört nicht zum Dokument (kein Rückgängig/Speichern nötig).
const QUIZ_ENVS = {
  intro: ['map', 'def', 'app'], lin: ['par', 'two', 'sys', 'app', 'perp'],
  quad: ['par', 'vtx', 'zer', 'cmb', 'opt'], pow: ['fam', 'neg', 'root', 'gen', 'eq'],
  exp: ['grow', 'e', 'log', 'eq', 'pct'], trig: ['circ', 'gen', 'tan', 'rt', 'tri'], inv: ['mirror', 'test', 'calc', 'pairs'],
  seq: ['def', 'ari', 'geo', 'sig', 'sum', 'lim', 'ind'], set: ['iv', 'op', 'venn', 'ex'],
  alg: ['expand', 'factor', 'complete', 'binom', 'pow', 'log', 'frac', 'eq', 'sys'], sim: ['map', 'test', 'ray', 'right'],
  '3d': ['pl', 'vec', 'line', 'dot', 'dist', 'sph'],
  stat: ['dice', 'dice2', 'galton', 'pi', 'buffon', 'monty', 'birthday', 'walk', 'clt', 'ci', 'urn', 'bayes'],
  prob: ['data', 'tree', 'bin', 'poi', 'ev', 'norm', 'lim', 'test'],
  fin: ['line', 'sum', 'save', 'loan', 'value', 'march', 'mline', 'conform'], lo: ['ung1', 'half', 'poly', 'opt'],
  diff: ['lim', 'tan', 'gr', 'rg', 'kd', 'ext', 'stb'], int: ['sum', 'hs', 'rg', 'pi', 'sub', 'ar', 'rot']
};
// Die Fragen gibt es nur auf Deutsch (die Oberfläche des Quiz ist übersetzt); in anderen Sprachen steht dazu ein Hinweis.
const QUIZ_LEVEL = ['', 'Grundwissen', 'Verständnis', 'Knacknuss'];
const QZ = { env: null, view: null, title: '', qs: [], i: 0, mode: 'learn', phase: 'start', el: null, tex: false };

(function () {
  const st = document.createElement('style');
  st.textContent = `
#j10quiz{position:fixed;inset:0;z-index:10050;background:rgba(20,26,44,.45);display:flex;align-items:center;justify-content:center;padding:14px}
#j10quiz .qz-box{background:var(--bg-canvas);color:var(--text);border:1px solid var(--border);border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.28);width:min(760px,100%);max-height:100%;display:flex;flex-direction:column;overflow:hidden}
#j10quiz .qz-head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border)}
#j10quiz .qz-title{font-weight:700;font-size:16px;flex:1;min-width:0}
#j10quiz .qz-head button{font-size:12.5px;padding:5px 10px;border-radius:8px;white-space:nowrap}
#j10quiz .qz-body{flex:1;padding:16px;overflow:auto;-webkit-overflow-scrolling:touch;font-size:15px;line-height:1.45}
#j10quiz .qz-nb{white-space:nowrap}
#j10quiz .qz-bar{height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin:0 0 12px}
#j10quiz .qz-bar i{display:block;height:100%;background:var(--accent);border-radius:3px}
#j10quiz .qz-meta{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--text-muted);margin-bottom:8px}
#j10quiz .qz-chip{font-weight:700;font-size:11.5px;letter-spacing:.03em;text-transform:uppercase;padding:2px 8px;border-radius:999px;background:var(--accent-soft);color:var(--active-text)}
#j10quiz .qz-chip.l2{background:rgba(232,150,30,.18);color:#a8650a}
#j10quiz .qz-chip.l3{background:rgba(214,60,90,.16);color:#b3263f}
body.dark #j10quiz .qz-chip.l2{color:#f3b862}
body.dark #j10quiz .qz-chip.l3{color:#ff9aae}
#j10quiz .qz-q{font-size:16.5px;font-weight:600;margin:4px 0 14px}
#j10quiz .qz-as{display:grid;gap:8px}
#j10quiz .qz-a{display:flex;align-items:center;gap:10px;text-align:left;width:100%;min-height:46px;padding:9px 12px;border-radius:10px;font-size:15px;line-height:1.35;white-space:normal}
#j10quiz .qz-a .qz-k{flex:0 0 26px;height:26px;border-radius:50%;border:1.5px solid var(--border-input);display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700;color:var(--text-muted)}
#j10quiz .qz-a.sel{border-color:var(--accent);background:var(--accent-soft)}
#j10quiz .qz-a.sel .qz-k{border-color:var(--accent);background:var(--accent);color:#fff}
#j10quiz .qz-a.ok{border-color:#2f9e5c;background:rgba(47,158,92,.14)}
#j10quiz .qz-a.ok .qz-k{border-color:#2f9e5c;background:#2f9e5c;color:#fff}
#j10quiz .qz-a.no{border-color:#d63c5a;background:rgba(214,60,90,.12)}
#j10quiz .qz-a.no .qz-k{border-color:#d63c5a;background:#d63c5a;color:#fff}
#j10quiz .qz-a[disabled]{opacity:1;cursor:default}
#j10quiz .qz-e{margin-top:12px;padding:10px 12px;border-radius:10px;background:var(--bg-app);font-size:14.5px}
#j10quiz .qz-e b.ok{color:#2f9e5c}
#j10quiz .qz-e b.no{color:#d63c5a}
#j10quiz .qz-foot{display:flex;gap:8px;align-items:center;padding:10px 16px;border-top:1px solid var(--border)}
#j10quiz .qz-foot .qz-sp{flex:1}
#j10quiz .qz-foot button{min-height:38px;padding:6px 14px;border-radius:9px;font-size:14px}
#j10quiz .qz-go{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}
#j10quiz .qz-go[disabled]{opacity:.45}
#j10quiz .qz-modes{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0 6px}
#j10quiz .qz-mode{display:block;text-align:left;padding:12px 14px;border-radius:12px;white-space:normal;line-height:1.35}
#j10quiz .qz-mode b{display:block;font-size:15.5px;margin-bottom:3px}
#j10quiz .qz-mode span{font-size:13px;color:var(--text-muted)}
#j10quiz .qz-mode.sel{border-color:var(--accent);background:var(--accent-soft)}
#j10quiz .qz-lv{display:grid;gap:4px;margin:10px 0;font-size:14px}
#j10quiz .qz-lv div{display:flex;gap:8px;align-items:center}
#j10quiz .qz-score{font-size:30px;font-weight:800;margin:2px 0 4px}
#j10quiz .qz-rows{display:grid;gap:6px;margin:10px 0 16px}
#j10quiz .qz-row{display:grid;grid-template-columns:118px 1fr 52px;gap:10px;align-items:center;font-size:13.5px}
#j10quiz .qz-row .qz-bar{margin:0;height:8px}
#j10quiz .qz-rev{border-top:1px solid var(--border);padding:12px 0}
#j10quiz .qz-rev .qz-q{font-size:15px;margin:4px 0 6px}
#j10quiz .qz-rev .qz-l{font-size:14px;margin:2px 0}
#j10quiz .qz-note{font-size:13px;color:var(--text-muted);margin-top:10px}
#j10quiz textarea{width:100%;height:46vh;font:12px/1.35 ui-monospace,Menlo,Consolas,monospace;border:1px solid var(--border-input);border-radius:8px;padding:8px;background:var(--bg-input);color:var(--text);box-sizing:border-box}
#quiz-btn{font-weight:700;color:#fff;background:var(--accent);border-color:var(--accent);padding-left:14px;padding-right:14px}
#quiz-btn:hover{filter:brightness(1.1)}
.env-hint.eh-bare{display:flow-root}.env-hint.eh-bare .eh-reset{margin-bottom:0}
@media (max-width:640px){#j10quiz{padding:0}#j10quiz .qz-box{border-radius:0;height:100%;width:100%;border:0}#j10quiz .qz-modes{grid-template-columns:1fr}#j10quiz .qz-row{grid-template-columns:96px 1fr 46px}}
`;
  document.head.appendChild(st);
})();

// aktuelle Ansicht (Thema, Ansicht, Titel) – null, wenn es dazu kein Quiz gibt
function quizCur() {
  const env = typeof ENV !== 'undefined' ? ENV.cur : null, vs = QUIZ_ENVS[env]; if (!vs) return null;
  const r = typeof ENV_RESET !== 'undefined' ? ENV_RESET[env] : null; if (!r) return null;
  let view = null; try { const c = window[r[0] + 'Capture'](); view = c ? c[r[1]] : null; } catch (e) { view = null; }
  if (!vs.includes(view)) return null;
  const tv = document.querySelector('#tp-groups .tp-card[data-env="' + env + '"] .tp-view[data-view="' + view + '"] span');
  return { env, view, title: tv ? tv.textContent : view };
}
if (typeof KIT !== 'undefined') KIT.order.forEach(id => { const q = KIT.envs[id].spec.quiz; if (q && q.length) QUIZ_ENVS[id] = q; });
function quizHas() { return !!quizCur(); }
// Knopf «Quiz» in der Leiste oben, gleich neben «? Hilfe zum Thema»; sichtbar, wenn es zur Ansicht Fragen gibt (Aufruf aus envHintShow)
function quizBtnSync() {
  const g = document.getElementById('env-group'); if (!g) return;
  let b = document.getElementById('quiz-btn');
  if (!b) {
    b = document.createElement('button'); b.id = 'quiz-btn'; b.type = 'button'; b.textContent = 'Quiz';
    b.title = 'Fragen zu dieser Ansicht: Grundwissen, Verständnis und Knacknüsse';
    b.addEventListener('click', () => quizOpen()); g.appendChild(b);
  }
  b.style.display = quizHas() ? '' : 'none';
}

function quizLoad(env, done) {
  if (window.QUIZ_DATA && window.QUIZ_DATA[env]) { done(true); return; }
  const s = document.createElement('script'); s.src = 'quiz_' + env + '.js';
  s.onload = () => done(!!(window.QUIZ_DATA && window.QUIZ_DATA[env])); s.onerror = () => done(false);
  document.head.appendChild(s);
}
function quizShuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
// Fragen einer Runde: nach Stufe geordnet, sonst in der Reihenfolge der Datei (Frage 16 ist immer dieselbe, auch auf dem
// Arbeitsblatt); gemischt werden nur die Antworten
// Intervalle stehen in den Fragen als ]a,b[; gezeigt werden sie in der Schreibweise, die im Thema «Mengen und Intervalle» gewählt ist
function quizIv(s) {
  const f = typeof SET !== 'undefined' && SET.st === 'f';
  return String(s).replace(/([\[\]])(-?(?:\\infty|[\d.]+|[a-z])),(-?(?:\\infty|[\d.]+|[a-z]))([\[\]])/g, (m, o, a, b, c) =>
    f ? '{{' + o + '}{' + a + '};\\,{' + b + '}{' + c + '}}' : (o === '[' ? '[' : '(') + a + ',\\,' + b + (c === ']' ? ']' : ')'));
}
function quizDeal(list) {
  const qs = [];
  [1, 2, 3].forEach(l => list.filter(q => q.l === l).forEach(q => {
    const iv = QZ.env === 'set' && !q.raw ? quizIv : s => s;
    const opts = 'tf' in q ? [{ t: 'Wahr', ok: q.tf === true }, { t: 'Falsch', ok: q.tf === false }] : quizShuffle(q.a.map((t, k) => ({ t: iv(t), ok: k === 0 })));
    qs.push({ l: q.l, q: iv(q.q), e: iv(q.e), tf: 'tf' in q, opts, pick: -1, shown: false });
  }));
  return qs;
}
function quizOpen() {
  const c = quizCur(); if (!c) return;
  quizLoad(c.env, ok => {
    const list = ok ? window.QUIZ_DATA[c.env][c.view] : null; if (!list || !list.length) return;
    Object.assign(QZ, { env: c.env, view: c.view, title: c.title, src: list, qs: [], i: 0, phase: 'start', tex: false });
    if (!QZ.el) {
      QZ.el = document.createElement('div'); QZ.el.id = 'j10quiz'; QZ.el.setAttribute('role', 'dialog'); QZ.el.setAttribute('aria-modal', 'true');
      QZ.el.addEventListener('click', e => { if (e.target === QZ.el) quizClose(); });
      document.body.appendChild(QZ.el);
    }
    QZ.el.style.display = 'flex'; quizRender();
  });
}
function quizClose() { if (QZ.el) QZ.el.style.display = 'none'; QZ.phase = 'start'; }
function quizStart() { QZ.qs = quizDeal(QZ.src); QZ.i = 0; QZ.phase = 'run'; QZ.tex = false; quizRender(); }
function quizRestart() { QZ.phase = 'start'; QZ.tex = false; quizRender(); }
function quizScore(l) { const qs = QZ.qs.filter(q => !l || q.l === l); return [qs.filter(q => q.pick >= 0 && q.opts[q.pick].ok).length, qs.length]; }

function quizRender() {
  const E = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const B = (txt, fn, cls) => { const b = E('button', cls, txt); b.type = 'button'; b.addEventListener('click', fn); return b; };
  // Text mit Formeln; ein Satzzeichen direkt nach einer Formel bleibt an ihr hängen (kein Zeilenumbruch davor)
  const M = (tag, cls, src) => {
    const e = E(tag, cls); e.setAttribute('translate', 'no');
    e.innerHTML = String(src).split(/(\$[^$]+\$[.,;:?!)]+)/).map(part => { const m = /^(\$[^$]+\$)([.,;:?!)]+)$/.exec(part); return m ? '<span class="qz-nb">' + ST.inline(m[1]) + ST.inline(m[2]) + '</span>' : ST.inline(part); }).join('');
    return e;
  };
  const box = E('div', 'qz-box'), head = E('div', 'qz-head'), body = E('div', 'qz-body'), foot = E('div', 'qz-foot');
  const ttl = E('div', 'qz-title'); ttl.append('Quiz: '); const tn = E('span', null, QZ.title); tn.setAttribute('translate', 'no'); ttl.append(tn);
  head.append(ttl);
  if (QZ.phase !== 'start') head.append(B('⟲ Neu starten', quizRestart));
  const x = B('✕', quizClose); x.title = 'Quiz schliessen'; head.append(x);
  box.append(head, body, foot);
  const n = QZ.qs.length || QZ.src.length;

  if (QZ.tex) {                                   // LaTeX-Fassung (Arbeitsblatt mit Lösungen)
    const ta = E('textarea'); ta.readOnly = true; ta.setAttribute('translate', 'no'); ta.value = quizLatex(); const msg = E('span', 'qz-note');
    body.append(ta);
    foot.append(B('Kopieren', () => texCopy({ ta, msg }, () => {})), msg, E('span', 'qz-sp'), B('Zurück', () => { QZ.tex = false; quizRender(); }));
  } else if (QZ.phase === 'start') {
    const cnt = l => QZ.src.filter(q => q.l === l).length;
    body.append(E('div', null, n + ' Fragen, von leicht nach schwierig. Zu jeder Frage ist genau eine Antwort richtig.'));
    const lv = E('div', 'qz-lv');
    [[1, 'das Wichtigste zur Ansicht'], [2, 'Zusammenhänge erkennen, typische Irrtümer vermeiden'], [3, 'für alle, die es genau wissen wollen']].forEach(([l, d]) => {
      const row = E('div'); row.append(E('span', 'qz-chip l' + l, QUIZ_LEVEL[l]), E('span', null, cnt(l) + ' Fragen: ' + d)); lv.append(row);
    });
    body.append(lv);
    const modes = E('div', 'qz-modes');
    [['learn', 'Üben', 'Nach jeder Antwort siehst du, ob sie stimmt, und die Begründung dazu.'], ['exam', 'Prüfung', 'Du beantwortest zuerst alle Fragen. Ausgewertet wird am Schluss.']].forEach(([m, t, d]) => {
      const b = B('', () => { QZ.mode = m; quizRender(); }, 'qz-mode' + (QZ.mode === m ? ' sel' : '')); b.append(E('b', null, t), E('span', null, d)); b.setAttribute('aria-pressed', QZ.mode === m ? 'true' : 'false'); modes.append(b);
    });
    body.append(modes);
    if (typeof currentLang !== 'undefined' && currentLang !== 'de') body.append(E('div', 'qz-note', 'Die Fragen gibt es nur auf Deutsch.'));
    foot.append(B('LaTeX', () => { QZ.tex = true; quizRender(); }), E('span', 'qz-sp'), B('Quiz starten', quizStart, 'qz-go'));
  } else if (QZ.phase === 'run') {
    const q = QZ.qs[QZ.i], learn = QZ.mode === 'learn', fixed = learn && q.shown;
    const bar = E('div', 'qz-bar'), fill = E('i'); fill.style.width = Math.round(100 * (QZ.i + (q.pick >= 0 ? 1 : 0)) / n) + '%'; bar.append(fill);
    const meta = E('div', 'qz-meta'); meta.append(E('span', 'qz-chip l' + q.l, QUIZ_LEVEL[q.l]), E('span', null, 'Frage ' + (QZ.i + 1) + ' von ' + n));
    if (q.tf) meta.append(E('span', null, 'Wahr oder falsch?'));
    const as = E('div', 'qz-as');
    q.opts.forEach((o, k) => {
      const b = B('', () => { if (fixed) return; q.pick = k; if (learn) q.shown = true; quizRender(); }, 'qz-a' + (fixed ? (o.ok ? ' ok' : k === q.pick ? ' no' : '') : k === q.pick ? ' sel' : ''));
      const key = E('span', 'qz-k', q.tf ? (k === 0 ? 'W' : 'F') : 'ABCD'[k]); key.setAttribute('translate', 'no');
      b.append(key, q.tf ? E('span', null, o.t) : M('span', null, o.t)); if (fixed) b.disabled = true; as.append(b);
    });
    body.append(bar, meta, M('div', 'qz-q', q.q), as);
    if (fixed) {
      const ok = q.opts[q.pick].ok, e = E('div', 'qz-e'); e.append(E('b', ok ? 'ok' : 'no', ok ? 'Richtig.' : 'Leider falsch.'), ' ', M('span', null, q.e)); body.append(e);
    }
    const last = QZ.i === n - 1;
    if (!learn && QZ.i > 0) foot.append(B('‹ Zurück', () => { QZ.i--; quizRender(); }));
    foot.append(E('span', 'qz-sp'));
    const go = B(last ? (learn ? 'Zur Auswertung' : 'Auswerten') : 'Weiter ›', () => { if (last) QZ.phase = 'done'; else QZ.i++; quizRender(); }, 'qz-go');
    go.disabled = learn ? !q.shown : q.pick < 0; foot.append(go);
  } else {
    const [r, t] = quizScore(), pct = Math.round(100 * r / t);
    body.append(E('div', 'qz-score', r + ' von ' + t + ' richtig'));
    body.append(E('div', null, pct >= 90 ? 'Ausgezeichnet – das sitzt.' : pct >= 70 ? 'Gut gemacht. Schau dir unten an, was noch nicht stimmt.' : pct >= 50 ? 'Ein guter Anfang. Die Begründungen unten zeigen, wo es noch hakt.' : 'Da ist noch Luft nach oben. Arbeite die Ansicht nochmals durch und lies die Begründungen unten.'));
    const rows = E('div', 'qz-rows');
    [1, 2, 3].forEach(l => { const [a, b] = quizScore(l); if (!b) return; const row = E('div', 'qz-row'), bar = E('div', 'qz-bar'), fill = E('i'); fill.style.width = Math.round(100 * a / b) + '%'; bar.append(fill); const c = E('span', null, a + ' / ' + b); c.setAttribute('translate', 'no'); row.append(E('span', 'qz-chip l' + l, QUIZ_LEVEL[l]), bar, c); rows.append(row); });
    body.append(rows);
    QZ.qs.forEach((q, k) => {
      const ok = q.pick >= 0 && q.opts[q.pick].ok, rev = E('div', 'qz-rev'), meta = E('div', 'qz-meta');
      meta.append(E('span', 'qz-chip l' + q.l, QUIZ_LEVEL[q.l]), E('span', null, 'Frage ' + (k + 1)), E('b', ok ? 'ok' : 'no', ok ? 'richtig beantwortet' : 'falsch beantwortet'));
      meta.lastChild.style.color = ok ? '#2f9e5c' : '#d63c5a';
      rev.append(meta, M('div', 'qz-q', q.q));
      const line = (lab, o) => { const d = E('div', 'qz-l'); d.append(E('b', null, lab), ' ', q.tf ? E('span', null, o.t) : M('span', null, o.t)); return d; };
      if (!ok && q.pick >= 0) rev.append(line('Deine Antwort:', q.opts[q.pick]));
      rev.append(line('Richtig ist:', q.opts.find(o => o.ok)), M('div', 'qz-e', q.e));
      body.append(rev);
    });
    foot.append(B('LaTeX', () => { QZ.tex = true; quizRender(); }), E('span', 'qz-sp'), B('Schliessen', quizClose), B('⟲ Neu starten', quizRestart, 'qz-go'));
  }
  QZ.el.replaceChildren(box);
  body.scrollTop = 0;
}

// Arbeitsblatt mit Lösungen als LaTeX: feste Reihenfolge (nach Stufe), richtige Antwort wechselt die Position
function quizLatex() {
  const tx = s => Dif.texInline(s), L = [], sol = [];
  L.push('% Quiz «' + QZ.title + '» aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}');
  L.push('\\section*{Quiz: ' + tx(QZ.title) + '}', '\\begin{enumerate}\\sloppy');
  let nr = 0;
  [1, 2, 3].forEach(l => {
    const qs = QZ.src.filter(q => q.l === l); if (!qs.length) return;
    L.push('\\item[] \\textbf{' + QUIZ_LEVEL[l] + '}'); sol.push('\\item[] \\textbf{' + QUIZ_LEVEL[l] + '}');
    qs.forEach(q => {
      nr++;
      if ('tf' in q) { L.push('\\item ' + tx(q.q) + ' \\hfill $\\square$ wahr \\quad $\\square$ falsch'); sol.push('\\item ' + (q.tf ? 'wahr' : 'falsch') + ' — ' + tx(q.e)); return; }
      const pos = (nr * 7 + 3) % 4, o = q.a.slice(1); o.splice(pos, 0, q.a[0]);
      L.push('\\item ' + tx(q.q) + '\\\\', o.map((t, k) => '(' + 'abcd'[k] + ')~' + tx(t)).join(' \\quad '));
      sol.push('\\item (' + 'abcd'[pos] + ') — ' + tx(q.e));
    });
  });
  L.push('\\end{enumerate}', '\\subsection*{Lösungen}', '\\begin{enumerate}');
  return Dif.texGuil(L.concat(sol, ['\\end{enumerate}']).join('\n'));
}

window.addEventListener('keydown', e => {
  if (!QZ.el || QZ.el.style.display === 'none') return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); quizClose(); return; }
  if (QZ.phase !== 'run' || QZ.tex || e.metaKey || e.ctrlKey || e.altKey) return;
  const q = QZ.qs[QZ.i], k = q.tf ? { w: 0, f: 1, '1': 0, '2': 1 }[e.key.toLowerCase()] : { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 }[e.key.toLowerCase()];
  if (k !== undefined) { const b = QZ.el.querySelectorAll('.qz-a')[k]; if (b && !b.disabled) { e.preventDefault(); b.click(); } }
  else if (e.key === 'Enter') { const g = QZ.el.querySelector('.qz-foot .qz-go'); if (g && !g.disabled) { e.preventDefault(); g.click(); } }
}, true);
// Überschrift und Quiz-Knopf aufbauen: Beim ersten Aufbau (32_env.js) war dieses Modul noch nicht geladen
(function () { const el = document.getElementById('env-hint'); if (el && typeof envHintShow === 'function') { el.dataset.t = ''; try { envHintShow(); } catch (e) { /* ohne Überschrift */ } } quizBtnSync(); })();
