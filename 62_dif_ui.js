// ═══════════════════════════════════════════════════════════════════
// 62_dif_ui.js — Differentialrechnung: Panel, Rechenweg-Karte, Maus, Speichern, LaTeX
//
// Rechenkern: 60_dif.js, 60b_dif_rules.js, 60c_dif_kd.js (Dif). Bilder: 61_dif_draw.js (Szenen).
// Hier: Zustand DIF (Ansicht, Funktion, Stelle x0, Schrittweite h, Ausschnitt, Optionen), Panel
// (#dif-panel mit dem einen f(x)-Feld #diffquot-fn-input), Karte mit dem Rechenweg (#dif-card),
// Ziehen/Zoomen auf dem Canvas, Anbindung an Rückgängig/Speichern (difCapture/difApply) und
// TikZ-Export. Die Umgebung selbst (Umschalten) steht in 32_env.js (Eintrag «diff»).
// ═══════════════════════════════════════════════════════════════════

const DIF_VIEWS = [['lim', 'Grenzwerte von Funktionen'], ['tan', 'Sekante → Tangente'], ['gr', 'Graphisches Ableiten'], ['rg', 'Ableiten mit Regeln'], ['kd', 'Kurvendiskussion'], ['ext', 'Extremwertprobleme'], ['stb', 'Polynom aus Bedingungen']];
const DIF_DESC = {
  lim: ['Ziehe den {{orangen|hl}} oder {{blauen Punkt|hr}} gegen die Stelle {{a|x0,a}} (oder drücke «▶ h → 0»): Die Funktionswerte von links und rechts nähern sich dem {{Grenzwert|L}}. Wähle «x → ±∞», um das Verhalten für grosse x und die waagrechte Asymptote zu sehen.', 'Der Grenzwert lim f(x) für x → a ist die Zahl, der sich f(x) beliebig nähert, wenn x von links und von rechts gegen a geht – auch wenn f an der Stelle a selbst nicht definiert ist. Ergibt das Einsetzen 0/0, kürzt man zuerst den gemeinsamen Faktor. Für x → ±∞ entscheiden die höchsten Potenzen.'],
  ext: ['Wähle eine Situation und ziehe den {{Punkt|ex}} auf der {{Zielfunktion|Z}} (oder ändere x): Das {{Bild|pic}} zeigt die Figur zur Variablen {{x|x}}. Wo die {{Tangente|tan}} waagrecht wird, liegt das {{Optimum|opt}}. «▶ x durchlaufen lassen» fährt alle Möglichkeiten ab und zeichnet dabei die Zielfunktion.', 'Extremwertprobleme löst man in fünf Schritten: Variable wählen, Nebenbedingung aufstellen, Zielfunktion mit nur einer Variablen und Definitionsbereich angeben, Ableitung null setzen, Art des Extremums prüfen und das Ergebnis deuten.'],
  stb: ['Lege den Grad fest und gib die Bedingungen an – {{Punkte|Pp}}, {{Extrempunkte|Pe}}, {{Wendepunkte|Pw}} oder {{Steigungen|Ps}} – und ziehe sie im Bild: Sobald es gleich viele Gleichungen wie Unbekannte sind, erscheint das {{Polynom|f}}.', 'Ein Polynom vom Grad n hat n + 1 Koeffizienten. Jede Bedingung (Punkt, Steigung, Extremum f′ = 0, Wendepunkt f″ = 0) liefert eine lineare Gleichung; das Gleichungssystem bestimmt die Koeffizienten.'],
  tan: ['Ziehe {{Q|Q}} langsam zu {{P|P}} (oder drücke «▶ h → 0»): Die {{Sekante|sec}} durch P und Q dreht sich in die {{Tangente|tan}}, ihre Steigung {{m_s = Δy/h|ms,dy,h}} nähert sich der Ableitung f′(x₀). Mit {{P|P}} wechselst du die Stelle x₀.', 'Der Punkt P liegt fest auf dem Graphen, der Punkt Q wandert. Die Sekante durch P und Q hat die Steigung ms = Δy / h.'],
  gr: ['Ziehe den {{Punkt|x0}} entlang von {{f|f}} oder lass die Tangente wandern: Die Steigung der {{Tangente|tan}} oben ist die Höhe des Punktes auf {{f′|fp}} unten. An {{Hoch-, Tief- und Wendepunkten|mk}} rastet der Punkt ein, und die Animation wartet, bis du «▶ weiter» drückst.', 'Oben der Graph von f, unten der Graph der Ableitung f′. Ziehe den Punkt: Die Höhe des unteren Punktes ist die Steigung der Tangente oben. Der Ausschnitt richtet sich nach den Nullstellen, Extrem- und Wendepunkten. Ziehen im Bild verschiebt ihn, Mausrad oder zwei Finger zoomen, ein Klick setzt die Stelle; «⟲ Ausschnitt» stellt ihn wieder her.'],
  rg: ['Gib eine Funktion ein und ziehe den {{Punkt P|x0}} auf dem {{Graphen|f}}: Rechts wird f′(x) mit den Ableitungsregeln berechnet, daraus die Steigung und die Gleichung der {{Tangente|tan}} in P (optional auch {{Normale|nor}} und {{f′|fp}}).', 'Die Ableitung wird Schritt für Schritt mit den Ableitungsregeln berechnet. Danach folgen Tangente und Normale im Punkt P.'],
  kd: ['Gib eine Funktion ein oder wähle ein Beispiel: Am {{Graphen|f}} sind {{Nullstellen|N}}, {{Extrempunkte|ext}} und {{Wendepunkte|W}} markiert, rechts stehen alle Ergebnisse. Der Rechenweg zeigt Schritt für Schritt, wie man sie findet.', 'Alle Eigenschaften des Graphen: Symmetrie, Nullstellen, Extrempunkte, Wendepunkte, Monotonie und Krümmung.']
};
const DIF_EX = [['x^2', 'x²'], ['x^3-3*x', 'x³ − 3x'], ['x^3-6*x^2+9*x', 'x³ − 6x² + 9x'], ['x^4/4-2*x^2', 'x⁴/4 − 2x²'], ['sin(x)', 'sin(x)'], ['x*exp(x)', 'x · eˣ'], ['1/x', '1/x'], ['sqrt(x)', '√x'], ['abs(x)', '|x| (Knick)'], ['x^2*sin(x)', 'x² · sin(x)']];
const DIF_WIN0 = { x0: -5, x1: 5, y0: null, y1: null };
const DIF_SHOW0 = { tangent: true, triangle: true, color: 'mono', crit: false, hidefp: false, normal: false, deriv: false, d1: false, d2: false, card: true, hGen: false };

// Seite von Q (h darf 0 sein: dann merkt sich DIF.side, von wo Q kam)
function difSg() { return DIF.h < 0 ? -1 : (DIF.h > 0 ? 1 : (DIF.side < 0 ? -1 : 1)); }
function difSetH(h) { h = Math.round(h * 1e6) / 1e6 + 0; if (h !== 0) DIF.side = h < 0 ? -1 : 1; DIF.h = h; }
const DIF_LIM_EX = [['(x^2-4)/(x-2)', 2, 'a', '(x² − 4)/(x − 2), x → 2'], ['(x^3-8)/(x-2)', 2, 'a', '(x³ − 8)/(x − 2), x → 2'], ['(x^2+x-6)/(x^2-4)', 2, 'a', '(x² + x − 6)/(x² − 4), x → 2'], ['sin(x)/x', 0, 'a', 'sin(x)/x, x → 0'], ['(exp(x)-1)/x', 0, 'a', '(eˣ − 1)/x, x → 0'], ['1/x^2', 0, 'a', '1/x², x → 0 (Polstelle)'], ['abs(x)/x', 0, 'a', '|x|/x, x → 0 (Sprung)'], ['(2*x^2+1)/(x^2-3)', 0, 'inf', '(2x² + 1)/(x² − 3), x → ±∞'], ['(3*x-1)/(x+2)', 0, 'inf', '(3x − 1)/(x + 2), x → ±∞'], ['(x+1)/(x^2+1)', 0, 'inf', '(x + 1)/(x² + 1), x → ±∞'], ['exp(-x)*x', 0, 'inf', 'x·e⁻ˣ, x → ±∞']];
const DIF_STB_EX = [['Parabel durch drei Punkte', 2, [{ t: 'p', x: 0, y: 1 }, { t: 'p', x: 1, y: 0 }, { t: 'p', x: 3, y: 4 }]], ['Brückenbogen: Scheitel S(0 | 8), Fusspunkt (10 | 0)', 2, [{ t: 'e', x: 0, y: 8 }, { t: 'p', x: 10, y: 0 }]], ['Hochpunkt H(−1 | 4), Extremstelle 1, durch (0 | 2)', 3, [{ t: 'e', x: -1, y: 4 }, { t: 'ex', x: 1, y: 0 }, { t: 'p', x: 0, y: 2 }]], ['Wendepunkt W(1 | 2) mit Steigung −3, durch (0 | 4)', 3, [{ t: 'w', x: 1, y: 2 }, { t: 's', x: 1, y: -3 }, { t: 'p', x: 0, y: 4 }]], ['Sattelpunkt S(0 | 1), durch (1 | 2)', 3, [{ t: 'e', x: 0, y: 1 }, { t: 'wx', x: 0, y: 0 }, { t: 'p', x: 1, y: 2 }]], ['Grad 4: Tiefpunkt (0 | 0), Hochpunkte bei ±2 mit y = 4', 4, [{ t: 'e', x: 0, y: 0 }, { t: 'e', x: 2, y: 4 }, { t: 'ex', x: -2, y: 0 }]]];
function difDefaults() { return { view: 'tan', raw: 'x^2', x0: 1, h: 1, lmode: 'a', ek: 'box', ep: [30, 20], ex: 3, sn: 3, sc: DIF_STB_EX[3][2].map(c => Object.assign({}, c)), win: Object.assign({}, DIF_WIN0), show: Object.assign({}, DIF_SHOW0), trace: [] }; }
const DIF = Object.assign(difDefaults(), { F: null, K: null, Kkey: '', ui: null, S: null, drag: null, anim: null, cardKey: '', cardT: 0, cardTitle: '' });

function difActive() { return typeof ENV !== 'undefined' && ENV.cur === 'diff'; }
const $dif = id => document.getElementById(id);
const difEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const difCopy = o => JSON.parse(JSON.stringify(o));
const difClamp = (v, a, b) => Math.max(a, Math.min(b, v));
function difRedraw() { if (typeof scheduleDraw === 'function') scheduleDraw(); }
function difCommit() { if (typeof pushHistory === 'function') pushHistory(); }

// ── Funktion setzen ──
function difParseNum(s) {
  s = String(s).trim().replace(/,/g, '.'); if (!s) return NaN;
  try { const v = SV.evalNum(miParseRaw(s), 0); return isFinite(v) ? v : NaN; } catch (e) { return NaN; }
}
function difSetFn(raw, keep) {
  const F = Dif.makeFn(raw);
  DIF.F = F; DIF.K = null; DIF.Kkey = ''; DIF.cardKey = '';
  if (F) {
    DIF.raw = F.raw;
    if (!keep) {
      DIF.win = Object.assign({}, DIF_WIN0); DIF.trace = [];
      const f = F.f(0), d = F.f(1);
      const c = [1, 2, 0.5, -1, 3, 0.1, -2, 4, 0.7].find(x => isFinite(f(x)) && isFinite(d(x))) ;
      DIF.x0 = c !== undefined ? c : 1;
      if (!isFinite(DIF.h)) DIF.h = 1;
      difFitX0();
    }
  }
  return !!F;
}
function difFieldRaw() { const inp = $dif('diffquot-fn-input'); return inp ? (inp.getAttribute('data-raw') || '') : ''; }
function difSyncField() { const inp = $dif('diffquot-fn-input'); if (inp && inp._mlSetFromRaw && inp.getAttribute('data-raw') !== DIF.raw) inp._mlSetFromRaw(DIF.raw); }
function difApplyField() {
  const raw = difFieldRaw().trim(), err = $dif('dif-err');
  if (!raw) { if (err) err.textContent = ''; return; }
  if (raw === DIF.raw && DIF.F) return;
  if (difSetFn(raw, false)) { if (err) err.textContent = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); }
  else if (err) err.textContent = 'Diesen Ausdruck kann ich nicht auswerten. Erlaubt ist eine Funktion von x.';
}

// ── Rechenwege und Kurvendiskussion (zwischengespeichert) ──
// Graphisch ableiten: passender Ausschnitt um die interessanten Stellen, solange man nicht selbst gezoomt hat (y0 === null)
function difSmart() {
  const F = DIF.F; if (!F || DIF.view !== 'gr' || DIF.win.y0 !== null) return null;
  if (DIF.smKey !== DIF.raw) { DIF.smKey = DIF.raw; try { DIF.sm = difSmartWin(F, Dif.kd(F, [DIF_WIN0.x0, DIF_WIN0.x1])); } catch (e) { DIF.sm = null; } }
  return DIF.sm;
}
// Punkt x₀ in den sichtbaren Ausschnitt holen (neue Funktion, neues Beispiel, Ausschnitt zurückgesetzt)
function difFitX0() {
  const w = difSmart(), F = DIF.F; if (!w || !F) return;
  const sp = w.x1 - w.x0; if (DIF.x0 > w.x0 + sp * 0.04 && DIF.x0 < w.x1 - sp * 0.04) return;
  const st = Stat.niceStep(sp, 20), f = F.f(0), d = F.f(1);
  const c = [0.6, 0.7, 0.5, 0.8, 0.4, 0.3, 0.2, 0.9].map(t => Math.round(Math.round((w.x0 + sp * t) / st) * st * 1e9) / 1e9 + 0).find(x => isFinite(f(x)) && isFinite(d(x)));
  if (c !== undefined) DIF.x0 = c;
}
function difWinX() { const w = difSmart(); return w ? [w.x0, w.x1] : [DIF.win.x0, DIF.win.x1]; }
function difKd() {
  const F = DIF.F; if (!F) return null;
  const key = DIF.raw + '|' + (F.P ? '' : difWinX().join(','));
  if (DIF.Kkey !== key) { DIF.Kkey = key; try { DIF.K = Dif.kd(F, difWinX()); } catch (e) { DIF.K = null; } }
  return DIF.K;
}
function difCardDoc() {
  const F = DIF.F; if (!F) return null;
  try {
    switch (DIF.view) {
      case 'lim': return { t: 'Rechenweg: Grenzwert', d: Dif.limDoc(F, DIF.x0, DIF.lmode === 'inf') };
      case 'ext': return { t: 'Rechenweg: Extremwertproblem', d: Dif.extDoc(DIF.ek, DIF.ep) };
      case 'stb': return { t: 'Rechenweg: Polynom aus Bedingungen', d: Dif.stbDoc(DIF.sn, DIF.sc) };
      case 'tan': { const d = Dif.secDoc(F, DIF.x0, DIF.h); d.b = d.b.concat(Dif.hMethodDoc(F, DIF.show.hGen ? null : DIF.x0).b); return { t: 'Rechenweg: Sekante, Tangente, h-Methode', d }; }
      case 'gr': { const K = difKd(); return K ? { t: 'Rechenweg: Vorzeichen von f′', d: Dif.monoDoc(K) } : null; }
      case 'rg': {
        if (!DIF._rules || DIF._rulesRaw !== DIF.raw) { DIF._rules = Dif.rulesDoc(F); DIF._rulesRaw = DIF.raw; }
        const t = Dif.tangentDoc(F, DIF.x0), d = Dif.DOC(); d.b = DIF._rules.b.concat(t.b);
        return { t: 'Rechenweg: Ableiten, Tangente, Normale', d };
      }
      case 'kd': { const K = difKd(); return K ? { t: 'Rechenweg: Kurvendiskussion', d: Dif.kdDoc(K) } : null; }
    }
  } catch (e) { return { t: 'Rechenweg', d: null, err: e }; }
  return null;
}
function difCardKey() { return [DIF.view, DIF.view === 'lim' ? DIF.lmode : '', DIF.view === 'ext' ? DIF.ek + JSON.stringify(DIF.ep) : '', DIF.view === 'stb' ? DIF.sn + JSON.stringify(DIF.sc) : '', DIF.raw, DIF.view === 'tan' || DIF.view === 'rg' ? DIF.x0 : '', DIF.view === 'tan' ? DIF.show.hGen + ',' + DIF.h : '', DIF.F && !DIF.F.P && (DIF.view === 'gr' || DIF.view === 'kd') ? DIF.win.x0 + ',' + DIF.win.x1 : ''].join('|'); }
function difCardSoon() { clearTimeout(DIF.cardT); DIF.cardT = setTimeout(difCardRender, 40); }
function difCardRender() {
  const card = $dif('dif-card'), body = $dif('dif-card-body'); if (!card || !body) return;
  const show = difActive() && DIF.show.card && DIF.F;
  if (show || !(typeof vgOn === 'function' && vgOn())) card.style.display = show ? 'flex' : 'none';   // 3D-Vektorgeometrie besitzt die Karte selbst
  if (!show) return;
  const key = difCardKey(); if (key === DIF.cardKey) return;
  DIF.cardKey = key;
  const r = difCardDoc();
  $dif('dif-card-title').textContent = r ? r.t : 'Rechenweg';
  if (r && r.d && typeof ST !== 'undefined') body.innerHTML = ST.renderDoc(r.d);
  else body.innerHTML = '<div class="sv"><div class="sv-p">' + (r && r.err ? 'Für diese Funktion gibt es hier keinen Rechenweg.' : 'Für diese Ansicht gibt es keinen Rechenweg.') + '</div></div>';
  body.scrollTop = 0;
}

// ── Zustand sichern / laden ──
function difCapture() {
  return difCopy({ view: DIF.view, raw: DIF.raw, x0: DIF.x0, h: DIF.h, lmode: DIF.lmode, ek: DIF.ek, ep: DIF.ep, ex: DIF.ex, sn: DIF.sn, sc: DIF.sc, side: difSg(), win: DIF.win, show: DIF.show, trace: DIF.trace.slice(-300) });
}
function difApply(s) {
  DIF.anim = null;                                                       // laufende Animation beenden (Rückgängig, Laden, Zurücksetzen)
  const d = difDefaults();
  if (s && typeof s === 'object') {
    if (DIF_VIEWS.some(v => v[0] === s.view)) d.view = s.view;
    if (typeof s.raw === 'string' && s.raw.length < 400) d.raw = s.raw;
    ['x0', 'h', 'ex'].forEach(k => { const v = Number(s[k]); if (isFinite(v)) d[k] = v; });
    if (s.lmode === 'a' || s.lmode === 'inf') d.lmode = s.lmode;
    if (Dif.EXT[s.ek]) { d.ek = s.ek; if (Array.isArray(s.ep) && s.ep.length === Dif.EXT[s.ek].pv.length && s.ep.every(v => isFinite(Number(v)) && Number(v) > 0)) d.ep = s.ep.map(Number); else d.ep = Dif.EXT[s.ek].pv.slice(); }
    if ([2, 3, 4].indexOf(Number(s.sn)) >= 0) d.sn = Number(s.sn);
    if (Array.isArray(s.sc) && s.sc.length <= 8) d.sc = s.sc.filter(c => c && Dif.STB_T.some(t => t[0] === c.t) && isFinite(Number(c.x)) && isFinite(Number(c.y))).map(c => ({ t: c.t, x: Number(c.x), y: Number(c.y) }));
    if (s.win && typeof s.win === 'object') {
      const w = s.win, ok = v => (v === null || v === undefined ? null : (isFinite(Number(v)) ? Number(v) : null));
      const a = ok(w.x0), b = ok(w.x1);
      if (a !== null && b !== null && b > a) { d.win.x0 = a; d.win.x1 = b; }
      const c = ok(w.y0), e = ok(w.y1); if (c !== null && e !== null && e > c) { d.win.y0 = c; d.win.y1 = e; const g = ok(w.s0), h = ok(w.s1); if (g !== null && h !== null && h > g) { d.win.s0 = g; d.win.s1 = h; } }
    }
    if (s.show && typeof s.show === 'object') {
      Object.keys(DIF_SHOW0).forEach(k => { if (k in s.show) d.show[k] = typeof DIF_SHOW0[k] === 'boolean' ? !!s.show[k] : (['none', 'mono', 'curv'].indexOf(s.show[k]) >= 0 ? s.show[k] : DIF_SHOW0[k]); });
    }
    if (Array.isArray(s.trace)) d.trace = s.trace.map(Number).filter(isFinite).slice(-300);
  }
  DIF.anim = null; DIF.drag = null;
  DIF.side = s && Number(s.side) < 0 ? -1 : 1;
  DIF.view = d.view; DIF.x0 = d.x0; DIF.h = d.h; DIF.lmode = d.lmode; DIF.ek = d.ek; DIF.ep = d.ep; DIF.ex = d.ex; DIF.sn = d.sn; DIF.sc = d.sc; DIF.win = d.win; DIF.show = d.show; DIF.trace = d.trace;
  difSetFn(d.raw, true);
  if (!DIF.F) { DIF.raw = d.raw; }
  difSyncField(); difRefreshUI(); difRedraw(); difCardSoon();
}

// ── Zeichnen ──
function difCtx(W, H, exp) {
  const v = DIF.view;
  return { view: v, F: DIF.F, win: DIF.win, smart: v === 'gr' ? difSmart() : null, x0: DIF.x0, h: DIF.h, lmode: DIF.lmode, ek: DIF.ek, ep: DIF.ep, ex: DIF.ex, sn: DIF.sn, sc: DIF.sc, show: DIF.show, trace: exp ? [] : DIF.trace, K: (v === 'kd' || (v === 'gr' && DIF.show.crit)) ? difKd() : null, exp: !!exp, marks: v === 'gr' ? difGrMarks() : [],
    reveal: !exp && DIF.anim && DIF.anim.walk ? [DIF.anim.start, DIF.x0] : null, extRev: !exp && DIF.anim && DIF.anim.ext && DIF.anim.ph === 0 ? DIF.ex : null,
    fs: exp ? exp.fs : stSceneFs(W, H, 46) };
}
function difDock(w) { return DIF.show.card && DIF.F && w >= 760 ? stCardW(w, 0.36) : 0; }
// schmale Fenster (Handy hochkant): Karte als untere Hälfte, das Bild liegt darüber
function difDockH(w, h) { return DIF.show.card && DIF.F && w < 760 ? Math.round(h * 0.5) : 0; }
function difLayoutCard(w, h) {
  const card = $dif('dif-card'); if (!card) return;
  const dock = difDock(w), dh = difDockH(w, h);
  card.classList.remove('dif-card-float'); card.classList.toggle('dif-card-sheet', !!dh);
  card.style.width = dock ? dock + 'px' : ''; card.style.height = dh ? dh + 'px' : '';
}
function difDraw(w, h) {
  const P = algPal();
  ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = P.bg; ctx.fillRect(0, 0, w, h);
  try { if (typeof clearMathLabelOverlay === 'function') clearMathLabelOverlay(); } catch (e) {}
  difLayoutCard(w, h); difCardRender();
  const W = w - difDock(w), Hs = h - difDockH(w, h);
  if (!DIF.F) {
    ctx.font = '600 ' + bf(15) + 'px -apple-system,system-ui,sans-serif'; ctx.fillStyle = P.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(statTr('Gib links eine Funktion f(x) ein und drücke «Übernehmen».'), W / 2, Hs / 2);
    DIF.S = null; return;
  }
  const S = stSoloBuild(difBuildScene, W, Hs, difCtx(W, Hs), 'dif|' + DIF.view + '|' + JSON.stringify(DIF.show), W < w || Hs < h);   // Karte offen: nur Bild (41_stat_draw.js)
  DIF.S = S; statPaint(S, W, Hs);
  if (typeof drawLaserPointer === 'function') drawLaserPointer();
}

// ── LaTeX ──
function difLatex() {
  const view = DIF.view, W = 760, H = view === 'gr' ? 620 : view === 'tan' || view === 'ext' || view === 'lim' ? 520 : 460;
  if (!DIF.F) return '% Zuerst eine Funktion eingeben.';
  const S = difBuildScene(W, H, difCtx(W, H, { fs: 11 }));
  return stSceneTex(S, W, H, (DIF_VIEWS.find(q => q[0] === view) || [0, ''])[1], 11);
}
function difCardLatex() {
  const r = difCardDoc(); if (!r || !r.d) return '% Für diese Ansicht gibt es keinen Rechenweg.';
  return '% ' + r.t + ' aus J\\sqrt{10} — benötigt \\usepackage{amsmath,amssymb}\n' + Dif.docTex(r.d);
}
function difMakeLatex(which) { const ui = DIF.ui; if (!ui) return ''; try { ui.ta.value = which === 'calc' ? difCardLatex() : difLatex(); } catch (e) { ui.ta.value = '% Fehler beim Erzeugen: ' + e.message; } return ui.ta.value; }
function difCopyLatex() {
  const ui = DIF.ui; if (!ui) return; if (!ui.ta.value) difMakeLatex('pic');
  const done = () => { ui.msg.textContent = (typeof t === 'function' ? t('msg_copied') : 'Kopiert'); setTimeout(() => { ui.msg.textContent = ''; }, 2500); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ui.ta.value).then(done).catch(() => { ui.ta.select(); document.execCommand('copy'); done(); });
  else { ui.ta.select(); document.execCommand('copy'); done(); }
}

// ── Ausschnitt ──
function difResolvedWin() {
  const S = DIF.S, m = S && S.maps.main, sub = DIF.view === 'gr' && S && S.maps.sub;
  const w = m ? Object.assign({}, m.win) : Object.assign({}, DIF.win, { y0: DIF.win.y0 === null ? -5 : DIF.win.y0, y1: DIF.win.y1 === null ? 5 : DIF.win.y1 });
  if (sub && sub.win) { w.s0 = sub.win.y0; w.s1 = sub.win.y1; }          // y-Bereich von f′ (Graphisch ableiten)
  return w;
}
// Zoom um (cx, cy); w: Ausgangsausschnitt. onSub: Mausrad im unteren Bild (f′) – dann zoomt dessen y-Bereich statt dem von f.
// Ohne cx/cy (Knöpfe ＋/－) zoomen beide Bilder um ihre Mitte.
function difZoomWin(w, f, cx, cy, onSub) {
  const all = cx === undefined; cx = all ? (w.x0 + w.x1) / 2 : cx;
  const nx0 = cx - (cx - w.x0) * f, nx1 = cx + (w.x1 - cx) * f;
  if (nx1 - nx0 < 1e-4 || nx1 - nx0 > 1e5) return null;
  const z = (lo, hi, c) => { c = c === undefined ? (lo + hi) / 2 : c; return [c - (c - lo) * f, c + (hi - c) * f]; };
  const n = { x0: nx0, x1: nx1, y0: w.y0, y1: w.y1 };                     // y mitzoomen (automatisches y würde springen)
  if (all || !onSub) { const y = z(w.y0, w.y1, all ? undefined : cy); n.y0 = y[0]; n.y1 = y[1]; }
  if (isFinite(w.s0) && isFinite(w.s1)) { const q = all || onSub ? z(w.s0, w.s1, all ? undefined : cy) : [w.s0, w.s1]; n.s0 = q[0]; n.s1 = q[1]; }
  return n;
}
function difZoom(f, cx, cy, onSub) { const n = difZoomWin(difResolvedWin(), f, cx, cy, onSub); if (n) { DIF.win = n; DIF.Kkey = ''; } }
function difResetWin() { DIF.win = Object.assign({}, DIF_WIN0); DIF.Kkey = ''; difFitX0(); difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); }

// ── Panel ──
// Graphisches Ableiten: besondere Stellen (Extrema von f = Nullstellen von f′, Wendepunkte = Extrema von f′)
function difGrMarks() {
  const K = difKd(), F = DIF.F; if (!K || !F) return [];
  const f2 = F.f(2), out = [];
  (K.crit || []).forEach(c => { if (isFinite(c.x)) out.push({ x: c.x, kind: c.type === 'max' || c.type === 'min' ? c.type : 'saddle' }); });
  (K.infl || []).forEach(c => {
    if (!isFinite(c.x) || out.some(o => Math.abs(o.x - c.x) < 1e-7 * (1 + Math.abs(c.x)))) return;
    const e = 1e-4 * (1 + Math.abs(c.x)), l = f2(c.x - e), r = f2(c.x + e);
    if (l > 0 && r < 0) out.push({ x: c.x, kind: 'wmax' }); else if (l < 0 && r > 0) out.push({ x: c.x, kind: 'wmin' });
  });
  return out.sort((a, b) => a.x - b.x);
}
function difSnap(v, step, shift) { return shift ? v : Math.round(v / step) * step; }
function difStepFor(div) { const w = difResolvedWin(); return Stat.niceStep(w.x1 - w.x0, div); }
function difFmtIn(v) { return Dif.fmt(v, 4); }

function difBuildUI() {
  if (DIF.ui || !$dif('dif-panel')) return;
  const ui = DIF.ui = {}, body = $dif('dif-body');
  ui.sel = $dif('dif-view');
  DIF_VIEWS.forEach(([id, nm]) => { const o = difEl('option', null, nm); o.value = id; ui.sel.appendChild(o); });
  ui.sel.addEventListener('change', () => { DIF.view = ui.sel.value; DIF.anim = null; if (DIF.view === 'lim' && DIF.raw === 'x^2') { const e = DIF_LIM_EX[0]; difSetFn(e[0], false); DIF.x0 = e[1]; DIF.lmode = e[2]; DIF.h = 1; difSyncField(); } difFitX0(); DIF.cardKey = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); });
  ui.desc = $dif('dif-desc');
  ui.ex = $dif('dif-ex');
  ui.ex.appendChild(Object.assign(difEl('option', null, 'Beispiel wählen …'), { value: '' }));
  DIF_EX.forEach(([raw, nm]) => { const o = difEl('option', null, nm); o.value = raw; o.setAttribute('translate', 'no'); ui.ex.appendChild(o); });
  ui.ex.addEventListener('change', () => { const raw = ui.ex.value; ui.ex.value = ''; if (!raw) return; if (difSetFn(raw, false)) { difSyncField(); const er = $dif('dif-err'); if (er) er.textContent = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); } });
  ui.params = difEl('div', 'alg-opts'); body.appendChild(ui.params);
  const det = difEl('details', 'geo-box td-sec');
  det.append(difEl('summary', null, 'Export'));
  const ac = difEl('div', 'ex-actions');
  ui.bj = difEl('button', null, '📷 JPEG'); ui.bl = difEl('button', 'ex-primary', 'LaTeX (Bild)'); ui.br = difEl('button', null, 'LaTeX (Rechenweg)'); ui.bc = difEl('button', null, 'Kopieren');
  ac.append(ui.bj, ui.bl, ui.br, ui.bc);
  ui.ta = difEl('textarea', 'ex-out'); ui.ta.readOnly = true; ui.ta.placeholder = 'LaTeX-Code erscheint hier…'; ui.msg = difEl('div', 'ex-msg');
  det.append(ac, ui.ta, ui.msg); body.appendChild(det);
  ui.bj.addEventListener('click', () => { if (typeof exportJPEG === 'function') exportJPEG(); });
  ui.bl.addEventListener('click', () => difMakeLatex('pic')); ui.br.addEventListener('click', () => difMakeLatex('calc')); ui.bc.addEventListener('click', difCopyLatex);
  const ap = $dif('dif-apply'); if (ap) ap.addEventListener('click', difApplyField);
  const inp = $dif('diffquot-fn-input');
  if (inp) { inp.addEventListener('focusout', () => setTimeout(difApplyField, 0)); inp.addEventListener('focusin', () => { try { inp.select(); } catch (e) {} }); }
  const cl = $dif('dif-card-close'); if (cl) cl.addEventListener('click', () => { DIF.show.card = false; difRefreshUI(); difRedraw(); difCardRender(); difCommit(); });
  difSyncField(); difRefreshUI();
}
const difBtn = (txt, fn, title) => { const b = difEl('button', null, txt); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', fn); return b; };

function difRefreshUI() {
  const ui = DIF.ui; if (!ui) return;
  const v = DIF.view, sh = DIF.show;
  ui.sel.value = v;
  const d = DIF_DESC[v]; ui.desc.replaceChildren(difEl('div', null, d[1])); if (typeof envHint === 'function') envHint('diff', d[0], () => DIF.S);   // Hinweis als Überschrift über dem Bild
  ui.params.replaceChildren(); ui.params._sync = [];   // Regler, die denselben Wert wie ein Zahlfeld zeigen, gleichen sich hier ab
  const P = ui.params;
  const check = (label, get, set, after) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label'), inp = difEl('input'); inp.type = 'checkbox'; inp.checked = !!get();
    lb.append(inp, document.createTextNode(' '), difEl('span', null, label)); row.appendChild(lb);
    inp.addEventListener('change', () => { set(inp.checked); if (after) after(); difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); });
    P.appendChild(row);
  };
  const select = (label, opts, get, set) => {
    const row = difEl('div', 'settings-row'); row.style.gap = '8px';
    const lb = difEl('label', null, label), sel = difEl('select');
    opts.forEach(o => sel.appendChild(Object.assign(difEl('option', null, o[1]), { value: o[0] })));
    sel.value = get(); sel.addEventListener('change', () => { set(sel.value); difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); });
    P._sync.push(() => { sel.value = get(); }); row.append(lb, sel); P.appendChild(row);
  };
  const numRow = (label, get, set, o) => {
    o = o || {}; const row = difEl('div', 'settings-row'); row.style.gap = '6px';
    const lb = difEl('label', null, label), inp = difEl('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.value = difFmtIn(get()); inp.style.cssText = 'flex:1;min-width:0;'; inp.setAttribute('translate', 'no');
    const apply = () => { const x = difParseNum(inp.value); if (isFinite(x) && !(o.nonzero && x === 0)) { set(x); difRedraw(); difCardSoon(); difCommit(); } inp.value = difFmtIn(get()); (P._sync || []).forEach(f => f()); };
    inp.addEventListener('change', apply); inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
    const nudge = (s) => difBtn(s > 0 ? '▶' : '◀', () => { const st = o.step || difStepFor(25); set(Math.round((get() + s * st) / st * 1e6) / 1e6 * st); inp.value = difFmtIn(get()); difRedraw(); difCardSoon(); difCommit(); (P._sync || []).forEach(f => f()); }, s > 0 ? 'Nach rechts' : 'Nach links');
    row.append(lb, nudge(-1), inp, nudge(1)); P.appendChild(row); ui.x0inp = inp;
  };
  const x0row = () => numRow('Stelle x₀', () => DIF.x0, x => { DIF.x0 = x; }, {});
  const group = txt => { const g = difEl('div', 'subpanel-label', txt); g.style.marginTop = '8px'; P.appendChild(g); };

  // Eigene Situation statt Funktionseingabe (Extremwertprobleme, Polynom aus Bedingungen); eigene Beispiele bei den Grenzwerten
  { const own = v === 'ext' || v === 'stb', inp = $dif('diffquot-fn-input'), row = inp && inp.parentNode, head = row && row.previousElementSibling;
    [row, head, $dif('dif-err')].forEach(e => { if (e) e.style.display = own ? 'none' : ''; });
    if (ui.ex) ui.ex.style.display = own || v === 'lim' ? 'none' : ''; }
  const presets = (label, names, pick) => {
    const sel = difEl('select'); sel.style.cssText = 'width:100%;margin:2px 0 4px;';
    sel.appendChild(Object.assign(difEl('option', null, label), { value: '' }));
    names.forEach((nm, i) => { const o = difEl('option', null, nm); o.value = String(i); o.setAttribute('translate', 'no'); sel.appendChild(o); });
    sel.addEventListener('change', () => { const i = sel.value; sel.value = ''; if (i === '') return; pick(+i); DIF.win = Object.assign({}, DIF_WIN0); difFitX0(); DIF.cardKey = ''; difSyncField(); difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); });
    P.appendChild(sel);
  };
  if (v === 'lim') {
    presets('Beispiel wählen …', DIF_LIM_EX.map(e => e[3]), i => { const e = DIF_LIM_EX[i]; difSetFn(e[0], false); DIF.x0 = e[1]; DIF.lmode = e[2]; DIF.h = 1; });
    select('Grenzwert', [['a', 'x → a (an einer Stelle)'], ['inf', 'x → ±∞ (für grosse x)']], () => DIF.lmode, x => { DIF.lmode = x; DIF.h = 1; DIF.cardKey = ''; });
    if (DIF.lmode === 'a') numRow('Stelle a', () => DIF.x0, x => { DIF.x0 = x; DIF.cardKey = ''; }, {});
    group(DIF.lmode === 'a' ? 'Abstand h der beiden Punkte von a' : 'Die Punkte liegen bei x = ±1/h');
    const mag = Math.abs(DIF.h) || 1, s0 = Math.max(0, Math.min(0.99, Math.log10(1 / Math.max(mag, 1e-4)) / 4));
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const val = difEl('b', null, 'h = ' + difFmtIn(mag)); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    top.append(difEl('label', null, 'Je weiter rechts, desto kleiner ist h'), val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = 0; sl.max = 1; sl.step = 0.002; sl.value = s0; sl.style.width = '100%';
    sl.addEventListener('input', () => { DIF.anim = null; difSetH(Math.pow(10, -4 * parseFloat(sl.value))); val.textContent = 'h = ' + difFmtIn(DIF.h); difRedraw(); });
    sl.addEventListener('change', () => { difRefreshUI(); difCommit(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1);
    const ab = difEl('div'); ab.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px;';
    ab.append(difBtn(DIF.anim ? '⏸ Pause' : '▶ h → 0', difAnimToggle), difBtn('h = 1', () => { DIF.anim = null; DIF.h = 1; difRefreshUI(); difRedraw(); difCommit(); }));
    P.appendChild(ab);
  } else if (v === 'ext') {
    const keys = Object.keys(Dif.EXT);
    presets('Situation wählen …', keys.map(k => Dif.EXT[k].t), i => { DIF.ek = keys[i]; DIF.ep = Dif.EXT[DIF.ek].pv.slice(); const r = Dif.extSolve(DIF.ek, DIF.ep); DIF.ex = r ? Math.round((r.dom[0] + (r.dom[1] - r.dom[0]) * 0.3) * 100) / 100 : 1; });
    const E0 = Dif.EXT[DIF.ek];
    group(E0.t);
    E0.pn.forEach((nm, i) => numRow(nm, () => DIF.ep[i], x => { if (x > 0) { DIF.ep = DIF.ep.slice(); DIF.ep[i] = x; DIF.cardKey = ''; } }, { step: 1 }));
    group('Variable');
    numRow('x', () => DIF.ex, x => { const r = Dif.extSolve(DIF.ek, DIF.ep); if (r) DIF.ex = Math.max(r.dom[0] + 1e-3, Math.min(r.dom[1] - 1e-3, x)); }, { step: 0.1 });
    const ab = difEl('div'); ab.style.cssText = 'margin-top:6px;';
    ab.append(difBtn(DIF.anim && DIF.anim.ext ? '⏸ Pause' : '▶ x durchlaufen lassen', difExtAnimToggle));
    ab.append(difBtn('Zum Optimum', () => { DIF.anim = null; const r = Dif.extSolve(DIF.ek, DIF.ep); if (r && r.best) DIF.ex = r.best.x; difRefreshUI(); difRedraw(); difCommit(); })); P.appendChild(ab);
  } else if (v === 'stb') {
    presets('Beispiel wählen …', DIF_STB_EX.map(e => e[0]), i => { const e = DIF_STB_EX[i]; DIF.sn = e[1]; DIF.sc = e[2].map(c => Object.assign({}, c)); });
    select('Grad des Polynoms', [['2', '2 (Parabel): 3 Unbekannte'], ['3', '3 (kubisch): 4 Unbekannte'], ['4', '4: 5 Unbekannte']], () => String(DIF.sn), x => { DIF.sn = +x; DIF.cardKey = ''; });
    const need = DIF.sn + 1, have = Dif.stbSolve(DIF.sn, DIF.sc).rows.length;
    group('Bedingungen');
    P.appendChild(Object.assign(difEl('div', 'act-hint', have + ' von ' + need + ' Gleichungen' + (have === need ? '' : have < need ? ' – es fehlen noch ' + (need - have) : ' – ' + (have - need) + ' zu viel')), { style: 'color:' + (have === need ? '#2fa36b' : '#d9486b') + ';margin:0 2px 4px;' }));
    DIF.sc.forEach((c, i) => {
      const row = difEl('div', 'settings-row'); row.style.cssText = 'gap:4px;flex-wrap:wrap;';
      const sel = difEl('select'); sel.style.cssText = 'flex:1 1 100%;';
      Dif.STB_T.forEach(t => sel.appendChild(Object.assign(difEl('option', null, t[1]), { value: t[0] }))); sel.value = c.t;
      sel.addEventListener('change', () => { c.t = sel.value; if (c.t === 'ex' || c.t === 'wx') c.y = 0; DIF.cardKey = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); });
      const inp = (lab, k) => { const l = difEl('label', null, lab); l.setAttribute('translate', 'no'); const e = difEl('input'); e.type = 'text'; e.inputMode = 'decimal'; e.value = difFmtIn(c[k]); e.style.cssText = 'width:54px;'; e.addEventListener('change', () => { const x = difParseNum(e.value); if (isFinite(x)) { c[k] = x; DIF.cardKey = ''; difRedraw(); difCardSoon(); difCommit(); } e.value = difFmtIn(c[k]); }); return [l, e]; };
      row.append(sel, ...inp('x', 'x'));
      if (c.t !== 'ex' && c.t !== 'wx') row.append(...inp(c.t === 's' ? 'm' : 'y', 'y'));
      row.append(difBtn('✕', () => { DIF.sc.splice(i, 1); DIF.cardKey = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); }, 'Bedingung entfernen'));
      P.appendChild(row);
    });
    const ab = difEl('div'); ab.style.cssText = 'margin-top:4px;';
    if (DIF.sc.length < 8) ab.append(difBtn('＋ Bedingung', () => { DIF.sc.push({ t: 'p', x: DIF.sc.length, y: 0 }); DIF.cardKey = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); }));
    P.appendChild(ab);
  } else if (v === 'tan') {
    x0row();
    group('Abstand h von P nach Q');
    // Regler für |h| (logarithmisch) und Seite
    const mag = Math.abs(DIF.h), s = mag === 0 ? 1 : difClamp(Math.log10(3 / Math.max(mag, 1e-4)) / 4, 0, 0.99);
    const wrap = difEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:100%;';
    const top = difEl('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;';
    const val = difEl('b', null, 'h = ' + difFmtIn(DIF.h)); val.setAttribute('translate', 'no'); val.style.fontSize = '12px';
    top.append(difEl('label', null, 'Je weiter rechts, desto näher bei P (ganz rechts: h = 0)'), val);
    const sl = difEl('input'); sl.type = 'range'; sl.min = 0; sl.max = 1; sl.step = 0.002; sl.value = s; sl.style.width = '100%';
    sl.addEventListener('input', () => { DIF.anim = null; const sg = difSg(), v = parseFloat(sl.value), m = v >= 0.995 ? 0 : 3 * Math.pow(10, -4 * v); difSetH(sg * m); val.textContent = 'h = ' + difFmtIn(DIF.h); difRedraw(); difCardSoon(); });
    P._sync.push(() => { const mg = Math.abs(DIF.h); sl.value = mg === 0 ? 1 : difClamp(Math.log10(3 / Math.max(mg, 1e-4)) / 4, 0, 0.99); val.textContent = 'h = ' + difFmtIn(DIF.h); });
    sl.addEventListener('change', () => { difRefreshUI(); difCommit(); });
    wrap.append(top, sl); const r1 = difEl('div', 'settings-row'); r1.appendChild(wrap); P.appendChild(r1);
    select('Q liegt', [['r', 'rechts von P (h > 0)'], ['l', 'links von P (h < 0)']], () => (DIF.h < 0 ? 'l' : 'r'), x => { const sg = x === 'l' ? -1 : 1; DIF.side = sg; DIF.h = DIF.h === 0 ? 0 : sg * Math.abs(DIF.h); });
    numRow('Genauer Wert h', () => DIF.h, x => { difSetH(x); }, { step: 0.1 });
    const ab = difEl('div'); ab.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px;';
    ab.append(difBtn(DIF.anim ? '⏸ Pause' : '▶ h → 0', difAnimToggle), difBtn('h = 1', () => { DIF.anim = null; DIF.h = difSg(); difRefreshUI(); difRedraw(); difCommit(); }));
    P.appendChild(ab);
    group('Anzeige');
    check('Tangente zeigen', () => sh.tangent, x => { sh.tangent = x; });
    check('Steigungsdreieck zeigen', () => sh.triangle, x => { sh.triangle = x; });
    check('Rechenweg für beliebiges x (Ableitungsfunktion)', () => sh.hGen, x => { sh.hGen = x; DIF.cardKey = ''; });
  } else if (v === 'gr') {
    x0row();
    { const ab = difEl('div'); ab.style.cssText = 'display:grid;grid-template-columns:1fr;gap:5px;margin-top:4px;';
      const a = DIF.anim && DIF.anim.walk ? DIF.anim : null;
      ab.append(difBtn(!a ? '▶ Tangente wandern lassen' : a.wait ? '▶ weiter' : '⏸ Pause', difAnimToggle)); P.appendChild(ab); }
    group('Anzeige');
    select('Färbung von f', [['mono', 'Steigen und Fallen'], ['none', 'keine']], () => (sh.color === 'none' ? 'none' : 'mono'), x => { sh.color = x; });
    check('Tangente zeigen', () => sh.tangent, x => { sh.tangent = x; });
    check('Stellen mit f′ = 0 markieren', () => sh.crit, x => { sh.crit = x; });
    check('f′ verstecken (selbst skizzieren)', () => sh.hidefp, x => { sh.hidefp = x; DIF.trace = []; });
    if (sh.hidefp) { const b = difEl('div'); b.style.marginTop = '6px'; b.appendChild(difBtn('Spur löschen', () => { DIF.trace = []; difRedraw(); difCommit(); })); P.appendChild(b); }
  } else if (v === 'rg') {
    x0row();
    group('Anzeige');
    check('Normale zeigen', () => sh.normal, x => { sh.normal = x; });
    check('Ableitungsfunktion f′ einzeichnen', () => sh.deriv, x => { sh.deriv = x; });
  } else if (v === 'kd') {
    group('Anzeige');
    select('Färbung von f', [['none', 'keine'], ['mono', 'Steigen und Fallen'], ['curv', 'Krümmung']], () => sh.color || 'none', x => { sh.color = x; });
    check('f′ einzeichnen', () => sh.d1, x => { sh.d1 = x; });
    check('f″ einzeichnen', () => sh.d2, x => { sh.d2 = x; });
  }
  group('Ausschnitt und Rechenweg');
  const zr = difEl('div'); zr.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;';
  zr.append(difBtn('＋', () => { difZoom(0.7); difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); }, 'Hineinzoomen'), difBtn('－', () => { difZoom(1 / 0.7); difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); }, 'Herauszoomen'), difBtn('⟲ Ausschnitt', difResetWin, 'Ausschnitt zurücksetzen'));
  zr.lastChild.style.gridColumn = 'span 2'; P.appendChild(zr);
  check('Rechenweg als Karte anzeigen', () => sh.card, x => { sh.card = x; DIF.cardKey = ''; });
}

// ── Extremwertproblem: x läuft durch den erlaubten Bereich, die Zielfunktion zeichnet sich dabei selbst ──
function difExtAnimToggle() {
  if (DIF.anim) { DIF.anim = null; difRefreshUI(); difRedraw(); difCommit(); return; }
  const r = Dif.extSolve(DIF.ek, DIF.ep); if (!r) return;
  const sp = r.dom[1] - r.dom[0];
  DIF.ex = r.dom[0] + sp * 0.01;
  DIF.anim = { last: 0, ext: true, ph: 0, wait: 0.5, lo: r.dom[0] + sp * 0.01, hi: r.dom[1] - sp * 0.01, best: r.best ? r.best.x : null, hit: false, sp };
  difRefreshUI(); difRedraw(); requestAnimationFrame(difExtAnimFrame);
}
function difExtAnimFrame(ts) {
  const a = DIF.anim; if (!a || !a.ext) return;
  if (!difActive() || DIF.view !== 'ext') { DIF.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (a.wait > 0) { a.wait -= dt; requestAnimationFrame(difExtAnimFrame); return; }
  if (a.ph === 0) {                                                        // einmal von links nach rechts, am Optimum kurz halten
    const before = DIF.ex; DIF.ex = Math.min(a.hi, DIF.ex + a.sp * dt / 7);
    if (a.best !== null && !a.hit && before < a.best && DIF.ex >= a.best) { DIF.ex = a.best; a.hit = true; a.wait = 1.6; }
    if (DIF.ex >= a.hi) { a.ph = 1; a.wait = 0.6; }
  } else {                                                                 // zurück zum Optimum
    const to = a.best !== null ? a.best : (a.lo + a.hi) / 2, d = to - DIF.ex, st = a.sp * dt / 1.5;
    if (Math.abs(d) <= st) { DIF.ex = to; DIF.anim = null; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); return; }
    DIF.ex += Math.sign(d) * st;
  }
  difRedraw(); difCardSoon(); requestAnimationFrame(difExtAnimFrame);
}

// ── h → 0 (Animation) ──
function difAnimToggle() {
  const wa = DIF.anim && DIF.anim.walk ? DIF.anim : null;
  if (wa) {                                                              // Tangente wandert: Pause / weiter (der Verlauf von f′ bleibt stehen)
    wa.wait = !wa.wait; wa.last = 0; difRefreshUI(); if (!wa.wait) requestAnimationFrame(difAnimFrame); return;
  }
  if (DIF.anim) { DIF.anim = null; difRefreshUI(); difCommit(); return; }
  if (DIF.view === 'gr') {
    const w = difResolvedWin(), sp = w.x1 - w.x0; if (DIF.x0 >= w.x1 - sp * 0.02 || DIF.x0 < w.x0) DIF.x0 = w.x0 + sp * 0.01;
    DIF.anim = { last: 0, walk: true, start: DIF.x0, hold: 0 }; difRefreshUI(); requestAnimationFrame(difAnimFrame); return;
  }
  const sg = difSg(); if (Math.abs(DIF.h) <= 0.0015) DIF.h = sg * 3;
  DIF.anim = { last: 0 }; difRefreshUI(); requestAnimationFrame(difAnimFrame);
}
function difAnimFrame(ts) {
  const a = DIF.anim; if (!a) return;
  if (!difActive()) { DIF.anim = null; return; }
  const dt = a.last ? Math.min(0.1, (ts - a.last) / 1000) : 0.016; a.last = ts;
  if (a.walk) {                                                          // Tangente wandert; an besonderen Stellen kurz anhalten
    if (a.wait) return;                                                  // wartet, bis man «weiter» drückt
    const w = difResolvedWin(), x1 = DIF.x0 + (w.x1 - w.x0) * 0.12 * dt;
    const c = difGrMarks().find(c => c.x > DIF.x0 + 1e-9 && c.x <= x1);
    if (c) { DIF.x0 = c.x; a.wait = true; } else DIF.x0 = x1;          // an besonderer Stelle anhalten
    if (DIF.show.hidefp) { const tr = DIF.trace; tr.push(DIF.x0); if (tr.length > 300) tr.shift(); }
    const i = DIF.ui && DIF.ui.x0inp; if (i) i.value = difFmtIn(DIF.x0);
    if (a.wait) { difRefreshUI(); difRedraw(); return; }
    if (DIF.x0 >= w.x1) { DIF.x0 = w.x1; DIF.anim = null; difRefreshUI(); difRedraw(); difCommit(); return; }
    difRedraw(); requestAnimationFrame(difAnimFrame); return;
  }
  const sg = difSg(); let m = Math.abs(DIF.h) * Math.pow(10, -dt * 0.55);
  if (m <= 0.001) { DIF.anim = null; DIF.side = sg; DIF.h = 0; difRefreshUI(); difRedraw(); difCardSoon(); difCommit(); return; }
  DIF.h = sg * m; difRedraw();
  const sl = DIF.ui && DIF.ui.params.querySelector('input[type=range]'); if (sl) sl.value = difClamp(Math.log10(3 / m) / 4, 0, 1);
  requestAnimationFrame(difAnimFrame);
}

// ── Maus und Berührung auf dem Canvas ──
(function () {
  const cv = document.getElementById('canvas'); if (!cv) return;
  const pos = e => { const r = cv.getBoundingClientRect(), t = e.touches && e.touches[0] ? e.touches[0] : (e.changedTouches && e.changedTouches[0]) || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const inMap = (m, p) => m && p.x >= m.L && p.x <= m.R && p.y >= m.T && p.y <= m.B;
  const near = p => { const S = DIF.S; if (!S) return null; let best = null, bd = 1e9; S.pts.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d <= q.r + 4 && d < bd) { bd = d; best = q; } }); return best; };
  const setX0 = (x, shift) => {
    const m = DIF.S && DIF.S.maps.main; if (!m) return;
    const st = Stat.niceStep(m.win.x1 - m.win.x0, 25);
    DIF.x0 = Math.round(difSnap(x, st, shift) * 1e6) / 1e6 + 0;
    if (DIF.view === 'gr' && !shift) { const px = (m.R - m.L) / (m.win.x1 - m.win.x0); let bd = 10; difGrMarks().forEach(c => { const d = Math.abs(c.x - x) * px; if (d < bd) { bd = d; DIF.x0 = c.x; } }); }   // an besonderen Stellen einrasten
    if (DIF.view === 'gr' && DIF.show.hidefp && DIF.F) { const tr = DIF.trace, last = tr[tr.length - 1]; if (last === undefined || Math.abs(last - DIF.x0) > st * 0.2) { tr.push(DIF.x0); if (tr.length > 300) tr.shift(); } }
  };
  const onLine = p => { const S = DIF.S, m = S && S.maps.main, sub = S && S.maps.sub; if (!m || (DIF.view !== 'gr' && DIF.view !== 'rg')) return false; const px = m.X(DIF.x0); return isFinite(px) && px >= m.L && px <= m.R && Math.abs(p.x - px) <= 9 && (inMap(m, p) || inMap(sub, p)); };
  // Zwei Finger: zoomen und verschieben
  const pinchOf = e => { const r = cv.getBoundingClientRect(), a = e.touches[0], b = e.touches[1]; return { x: (a.clientX + b.clientX) / 2 - r.left, y: (a.clientY + b.clientY) / 2 - r.top, d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1 }; };
  const down = e => {
    if (!difActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    const S = DIF.S; if (!S || !DIF.F) return;
    if (e.touches && e.touches.length === 2) {
      const c = pinchOf(e), m = inMap(S.maps.sub, c) ? S.maps.sub : S.maps.main; if (!m || !inMap(m, c)) { DIF.drag = null; return; }
      DIF.anim = null; DIF.drag = { type: 'pinch', sub: m === S.maps.sub, c, w: difResolvedWin(), wx: m.IX(c.x), wy: m.IY(c.y), mw: (m.win.x1 - m.win.x0) / (m.R - m.L), mh: (m.win.y1 - m.win.y0) / (m.B - m.T) }; return;
    }
    const p = pos(e); if (DIF.anim) { DIF.anim = null; difRefreshUI(); }
    const q = near(p);
    if (q && (DIF.view === 'tan' || DIF.view === 'lim' || DIF.view === 'ext' || DIF.view === 'stb')) { DIF.drag = { type: q.id }; if ((DIF.view === 'ext' || DIF.view === 'stb') && DIF.win.y0 === null) { DIF.win = difResolvedWin(); DIF.drag.auto = true; } }
    else if (q) { DIF.drag = { type: 'x0' }; }
    else if (onLine(p)) { DIF.drag = { type: 'x0' }; }                       // Graphisch ableiten: an der gestrichelten Linie durch x₀ ziehen
    else if (inMap(S.maps.main, p) || inMap(S.maps.sub, p)) {
      // Ziehen verschiebt den Ausschnitt; ein Klick ohne Ziehen setzt (bei «Graphisch ableiten» und «Regeln») die Stelle x₀
      const m = inMap(S.maps.main, p) ? S.maps.main : S.maps.sub, gr = DIF.view === 'gr' || DIF.view === 'rg';
      DIF.drag = { type: 'pan', sub: m === S.maps.sub, px: p.x, py: p.y, w: difResolvedWin(), click: gr ? m.IX(p.x) : null, shift: e.shiftKey, moved: false };
    }
    if (DIF.drag) cv.style.cursor = DIF.drag.type === 'pan' ? 'grabbing' : 'pointer';
  };
  const move = e => {
    if (!difActive()) return; e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault();
    const S = DIF.S; if (!S) return; const d = DIF.drag;
    if (d && d.type === 'pinch') {
      if (!(e.touches && e.touches.length === 2)) return;
      const c = pinchOf(e), n = difZoomWin(d.w, d.c.d / c.d, d.wx, d.wy, d.sub); if (!n) return;
      const dx = (c.x - d.c.x) * d.mw * (d.c.d / c.d), dy = (c.y - d.c.y) * d.mh * (d.c.d / c.d);     // Mitte der Finger wandert mit
      n.x0 -= dx; n.x1 -= dx; if (d.sub) { if (isFinite(n.s0)) { n.s0 += dy; n.s1 += dy; } } else { n.y0 += dy; n.y1 += dy; }
      DIF.win = n; DIF.Kkey = ''; difRedraw(); return;
    }
    const p = pos(e);
    if (!d) { cv.style.cursor = near(p) ? 'pointer' : onLine(p) ? 'ew-resize' : (inMap(S.maps.main, p) || inMap(S.maps.sub, p) ? 'grab' : ''); return; }
    const m = S.maps.main, shift = e.shiftKey;
    if (d.type === 'hl' || d.type === 'hr') {                              // Grenzwert: Abstand h zur Stelle a bzw. x → ±∞
      const x = m.IX(p.x); let hh = DIF.lmode === 'inf' ? 1 / Math.max(1e-3, Math.abs(x)) : Math.abs(x - DIF.x0);
      if (!shift) { const st = Stat.niceStep(hh, 4); hh = Math.round(hh / st) * st || st; }
      difSetH(Math.max(1e-4, Math.min(DIF.lmode === 'inf' ? 1 : 5, hh))); DIF.cardKey = '';
    } else if (d.type === 'ex') {
      const r = Dif.extSolve(DIF.ek, DIF.ep); if (r) { const st = shift ? 1e-4 : Stat.niceStep(r.dom[1] - r.dom[0], 60); DIF.ex = Math.max(r.dom[0] + st, Math.min(r.dom[1] - st, Math.round(m.IX(p.x) / st) * st)); }
    } else if (/^c\d+$/.test(d.type)) {                                         // Bedingung der Steckbriefaufgabe
      const c = DIF.sc[+d.type.slice(1)]; if (c) { const st = shift ? 1e-4 : Stat.niceStep(m.win.x1 - m.win.x0, 40); c.x = Math.round(m.IX(p.x) / st) * st + 0; if (c.t === 'p' || c.t === 'e' || c.t === 'w') c.y = Math.round(m.IY(p.y) / st) * st + 0; DIF.cardKey = ''; }
    } else if (d.type === 'P' || d.type === 'x0') { setX0(m.IX(p.x), shift); }
    else if (d.type === 'Q') {
      const st = Stat.niceStep(m.win.x1 - m.win.x0, 100); let h = difSnap(m.IX(p.x) - DIF.x0, st, shift); if (Math.abs(h) < st * 0.02) h = 0; difSetH(h);
    } else if (d.type === 'pan') {
      if (!d.moved && Math.hypot(p.x - d.px, p.y - d.py) < 4) return;        // noch ein Klick, kein Ziehen
      d.moved = true;
      const w = d.w, mm = d.sub ? S.maps.sub : m, dx = (p.x - d.px) / (mm.R - mm.L) * (w.x1 - w.x0), dy = (p.y - d.py) / (mm.B - mm.T);
      const n = { x0: w.x0 - dx, x1: w.x1 - dx, y0: w.y0, y1: w.y1 };        // reines Verschieben (y wird nicht neu angepasst)
      if (isFinite(w.s0) && isFinite(w.s1)) { n.s0 = w.s0; n.s1 = w.s1; }
      if (d.sub) { if (isFinite(w.s0)) { n.s0 = w.s0 + dy * (w.s1 - w.s0); n.s1 = w.s1 + dy * (w.s1 - w.s0); } } else { n.y0 = w.y0 + dy * (w.y1 - w.y0); n.y1 = w.y1 + dy * (w.y1 - w.y0); }
      DIF.win = n; DIF.Kkey = '';
    }
    difRedraw(); if (d.type !== 'pan') difCardSoon(); if (d.type === 'x0' || d.type === 'P') { const i = DIF.ui && DIF.ui.x0inp; if (i) i.value = difFmtIn(DIF.x0); }
  };
  const up = e => {
    if (!difActive()) return; e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'mouseleave' && !DIF.drag) return;
    if (DIF.drag && DIF.drag.type === 'pinch' && e.touches && e.touches.length) return;
    if (DIF.drag) {
      const d = DIF.drag;
      if (d.type === 'pan' && !d.moved && d.click !== null && e.type !== 'mouseleave' && e.type !== 'touchcancel') { setX0(d.click, d.shift); const i = DIF.ui && DIF.ui.x0inp; if (i) i.value = difFmtIn(DIF.x0); }   // Klick: Stelle x₀ setzen
      if (d.auto) DIF.win = Object.assign({}, DIF_WIN0); DIF.drag = null; cv.style.cursor = ''; difRefreshUI(); difRedraw(); difCardSoon(); difCommit();
    }
  };
  const wheel = e => {
    if (!difActive()) return; e.stopImmediatePropagation(); e.preventDefault();
    const S = DIF.S; if (!S) return; const p = pos(e), m = S.maps.main, sub = S.maps.sub; if (!inMap(m, p) && !inMap(sub, p)) return;
    const f = stWheelF(e), onSub = !inMap(m, p), mm = onSub ? sub : m;
    difZoom(f, mm.IX(p.x), DIF.view === 'gr' ? mm.IY(p.y) : onSub ? (m.win.y0 + m.win.y1) / 2 : m.IY(p.y), DIF.view === 'gr' && onSub); difRedraw(); difCardSoon();
    clearTimeout(DIF._wt); DIF._wt = setTimeout(() => { difRefreshUI(); difCommit(); }, 400);
  };
  const dbl = e => { if (!difActive()) return; e.stopImmediatePropagation(); e.preventDefault(); difResetWin(); };
  const stop = e => { if (difActive()) { e.stopImmediatePropagation(); if (e.cancelable && e.type !== 'wheel') e.preventDefault(); } };
  ['mousedown', 'touchstart'].forEach(ev => cv.addEventListener(ev, down, { capture: true, passive: false }));
  ['mousemove', 'touchmove'].forEach(ev => cv.addEventListener(ev, move, { capture: true, passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => cv.addEventListener(ev, up, { capture: true, passive: false }));
  cv.addEventListener('wheel', wheel, { capture: true, passive: false });
  cv.addEventListener('dblclick', dbl, { capture: true, passive: false });
  cv.addEventListener('contextmenu', stop, { capture: true, passive: false });
})();

document.addEventListener('langchange', () => { [60, 400, 1200].forEach(ms => setTimeout(() => { DIF.cardKey = ''; if (difActive()) { difCardRender(); difRefreshUI(); difRedraw(); } }, ms)); });
difBuildUI();
document.addEventListener('DOMContentLoaded', () => setTimeout(difSyncField, 150));
