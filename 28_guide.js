// ═══════════════════════════════════════════════════════════════════
// MODUL: guide — gemeinsame Hinweisleiste «Was wähle ich gerade?» unten im Plot
// ───────────────────────────────────────────────────────────────────
// Eine einzige Leiste (am unteren Rand der Zeichenfläche, auch auf dem Handy sichtbar, wenn die
// Seitenleiste zu ist) für ALLE klick-geführten Abläufe:
//   • Geometrie-Werkzeuge (27_geo_ui.js) – liefern ihren Text über geoHintText/geoHintWarn
//   • Gerade/Parabel aus Punkten («✏ Im Plot klicken», 11_fitting.js, fitPickMode)
//   • Steigungsdreieck (slopeTriPickMode), Senkrechte / Mittelsenkrechte (perpFlowKind)
//   • Gerade durch 2 Punkte (line2ptPicking), Punkt setzen, Punkt auf Graph, Löschen
// Die Leiste ZEIGT nur an (Schritt k/n, was als Nächstes zu wählen ist, was schon gewählt wurde)
// und bietet «Beenden». Die Abläufe selbst bleiben unverändert; der Zustand wird aus den
// bestehenden globalen Variablen gelesen (guideInfo()), daher keine Kopplung in die Gegenrichtung
// ausser den optionalen guideWarn()/guideFlash()-Aufrufen (immer per typeof abgesichert).
// Texte sind deutsch; die DOM-Auto-Übersetzung (23_autotranslate.js) übersetzt sie wie alle anderen.
// ═══════════════════════════════════════════════════════════════════

let guideTemp = null;          // {text, warn, until} — kurze Meldung (Warnung/Bestätigung), überlagert die Anleitung
let guideTempTimer = null;
let guideKey = null;

function guideNum(v) {
  if (!isFinite(v)) return '?';
  const r = Math.round(v * 100) / 100;
  return String(Object.is(r, -0) ? 0 : r).replace('-', '−');
}
function guidePt(p) { return '(' + guideNum(p.x) + ' | ' + guideNum(p.y) + ')'; }


// Liefert null oder {msg, warn, step, total, btns:[[Beschriftung, Funktion], …]}
function guideInfo() {
  const endBtn = fn => ['Beenden', fn];
  if (typeof deleteMode !== 'undefined' && deleteMode)
    return { msg: 'Löschen: Punkt, Graph oder Objekt anklicken, um es zu entfernen', btns: [endBtn(() => toggleDeleteMode())] };
  if (typeof pointMode !== 'undefined' && pointMode)
    return { msg: 'Punkt setzen: in den Plot klicken' + (typeof gridSnapOn === 'function' && gridSnapOn() ? ' (rastet am Gitter ein)' : '') + '. Punkte lassen sich danach ziehen.',
             btns: [endBtn(() => togglePointMode())] };
  if (typeof graphPtMode !== 'undefined' && graphPtMode)
    return { msg: 'Punkt auf Graph: auf eine Kurve klicken. Der Punkt bleibt auf dem Graphen und lässt sich daran entlang ziehen.',
             btns: [endBtn(() => toggleGraphPtMode())] };

  if (typeof line2ptPicking !== 'undefined' && line2ptPicking) {
    const n = line2ptPts.length, p1 = n ? points[line2ptPts[0].idx] : null;
    return { step: n + 1, total: 2,
             msg: n === 0 ? 'Gerade durch 2 Punkte: ersten Punkt wählen (bestehenden anklicken oder neu setzen)' : 'Gerade durch 2 Punkte: zweiten Punkt wählen',
             extra: p1 ? 'P₁ = ' + guidePt(p1) : '',
             btns: [endBtn(() => toggleLine2PtMode())] };
  }

  if (typeof slopeTriPickMode !== 'undefined' && slopeTriPickMode) {
    const n = slopeTriPts.length;
    return { step: n + 1, total: 2,
             msg: n === 0 ? 'Steigungsdreieck: ersten Punkt auf einer Geraden anklicken'
                          : 'Steigungsdreieck: zweiten Punkt auf derselben Geraden anklicken',
             btns: [endBtn(() => slopeTriStopPick())] };
  }

  if (typeof fitPickMode !== 'undefined' && fitPickMode && fitPickPanel) {
    const pd = fitPickPanel, k = Math.min(pd.pickNext, 2), N = pd.nPts;
    const type = typeof pd.getCurrentType === 'function' ? pd.getCurrentType() : (pd.type || 'linear');
    const MSG = {
      linear: ['Gerade durch 2 Punkte: ersten Punkt wählen (bestehenden anklicken oder neu setzen)', 'Gerade durch 2 Punkte: zweiten Punkt wählen'],
      quadratic: ['Parabel durch 3 Punkte: ersten Punkt wählen', 'Parabel durch 3 Punkte: zweiten Punkt wählen', 'Parabel durch 3 Punkte: dritten Punkt wählen'],
      vertex: ['Parabel aus Scheitelpunkt und Punkt: Scheitelpunkt S wählen', 'Parabel aus Scheitelpunkt und Punkt: Punkt P auf der Parabel wählen'],
      roots: ['Parabel aus Nullstellen und Punkt: erste Nullstelle wählen (liegt auf der x-Achse)', 'Parabel aus Nullstellen und Punkt: zweite Nullstelle wählen (liegt auf der x-Achse)', 'Parabel aus Nullstellen und Punkt: Punkt P auf der Parabel wählen']
    };
    const list = MSG[type] || MSG.linear;
    const name = i => ((pd.labels && pd.labels[i]) || 'P' + (i + 1)).replace(/^Nullstelle /, '').replace(/^Scheitelpunkt /, '');
    return { step: Math.min(pd.pickNext + 1, N), total: N, msg: list[Math.min(k, list.length - 1)],
             extra: fitPickPts.map((p, i) => name(i) + ' = ' + guidePt(p)).join(', '),
             btns: [endBtn(() => genericStopPick())] };
  }

  if (typeof perpFlowKind !== 'undefined' && perpFlowKind) {
    const s = Math.min(Math.max(perpFlowStep, 1), 2), perp = perpFlowKind === 'perp';
    const msgs = perp ? ['Senkrechte: Punkt wählen, durch den sie gehen soll', 'Senkrechte: Gerade anklicken, zu der sie senkrecht stehen soll']
                      : ['Mittelsenkrechte: ersten Punkt der Strecke wählen', 'Mittelsenkrechte: zweiten Punkt der Strecke wählen'];
    return { step: s, total: 2, msg: msgs[s - 1], extra: s === 2 && perpFlowPt1 ? (perp ? 'P = ' : 'P₁ = ') + guidePt(perpFlowPt1) : '',
             btns: [endBtn(() => _perpFlowStop())] };
  }

  if (typeof geoToolActive === 'function' && geoToolActive() && typeof geoTool !== 'undefined') {
    const tl = typeof geoToolById === 'function' ? geoToolById(geoTool) : null;
    const total = tl && tl.steps ? tl.steps.length : 1;
    const btns = [];
    if (geoTool === 'poly' && geoPicks.length >= 3) btns.push(['Schliessen', () => geoFinishPoly()]);
    btns.push(endBtn(() => geoSetTool('move')));
    return { msg: (typeof geoHintText !== 'undefined' && geoHintText) || (typeof geoStepText === 'function' ? geoStepText() : ''),
             warn: typeof geoHintWarn !== 'undefined' && geoHintWarn,
             step: total > 1 && geoTool !== 'poly' ? Math.min(geoPicks.length + 1, total) : 0, total, btns };
  }
  return null;
}

function guideBar() {
  let bar = document.getElementById('guide-bar');
  if (bar) return bar;
  const wrap = document.getElementById('canvas-wrap'); if (!wrap) return null;
  bar = document.createElement('div'); bar.id = 'guide-bar'; bar.className = 'geo-hint guide-bar';
  bar.setAttribute('role', 'status'); bar.setAttribute('aria-live', 'polite');
  wrap.appendChild(bar);
  return bar;
}

// Zeichnet die Leiste neu, wenn sich etwas geändert hat (billig: String-Vergleich).
function guideSync() {
  const bar = guideBar(); if (!bar) return;
  guideAppletCheck();
  let info = guideInfo();
  if (guideTemp) {
    if (Date.now() > guideTemp.until) guideTemp = null;
    else info = { msg: guideTemp.text, warn: guideTemp.warn, step: 0, total: 0, btns: info ? info.btns : [], temp: true, base: info };
  }
  const key = info ? JSON.stringify([info.msg, !!info.warn, info.step || 0, info.total || 0, (info.btns || []).map(b => b[0]), !!info.temp, info.extra || '']) : '';
  if (key === guideKey) return;
  guideKey = key;
  if (!info) { bar.style.display = 'none'; bar.textContent = ''; return; }
  bar.textContent = '';
  if (info.step && info.total > 1) {
    const st = document.createElement('span'); st.className = 'guide-step'; st.textContent = info.step + '/' + info.total; st.setAttribute('translate', 'no');
    bar.appendChild(st);
  }
  // Text und Zusatz (gewählte Koordinaten) sind getrennte Blöcke: so bleibt der Satz für die Auto-Übersetzung konstant
  const m = document.createElement('div'); m.className = 'geo-hint-msg guide-msg'; m.textContent = info.msg || '';
  if (info.warn) m.style.color = '#fca5a5';
  bar.appendChild(m);
  if (info.extra) { const x = document.createElement('div'); x.className = 'guide-extra'; x.setAttribute('translate', 'no'); x.textContent = info.extra; bar.appendChild(x); }
  (info.btns || []).forEach(([label, fn]) => {
    const b = document.createElement('button'); b.className = 'geo-hint-btn'; b.textContent = label;
    b.addEventListener('click', e => { e.stopPropagation(); try { fn(); } catch (err) { console.error(err); } guideTemp = null; guideKey = null; guideSync(); if (typeof scheduleDraw === 'function') scheduleDraw(); });
    bar.appendChild(b);
  });
  bar.style.display = 'flex';
}

// Kurze Meldung (Warnung oder Bestätigung); danach zeigt die Leiste wieder die Anleitung bzw. verschwindet.
function guideFlash(text, warn, ms) {
  if (!text) return;
  guideTemp = { text: String(text), warn: !!warn, until: Date.now() + (ms || (warn ? 3200 : 2600)) };
  clearTimeout(guideTempTimer);
  guideTempTimer = setTimeout(() => { guideTemp = null; guideKey = null; guideSync(); }, (ms || (warn ? 3200 : 2600)) + 30);
  guideKey = null; guideSync();
}
function guideWarn(text, ms) { guideFlash(text, true, ms); }

// Applets mit ziehbaren Griffen (kein «Modus», daher keine dauerhafte Leiste): beim Aufschalten einmal kurz erklären,
// was man im Plot ziehen kann.
const GUIDE_APPLETS = [
  { on: () => typeof diffQuot !== 'undefined' && !!diffQuot, text: 'Differenzenquotient: Die Punkte A und B auf dem Graphen ziehen. Rücken sie zusammen, wird die Sekante zur Tangente.' },
  { on: () => typeof riemann !== 'undefined' && !!riemann, text: 'Ober-/Untersummen: Die Grenzen a und b im Plot ziehen. Die Anzahl der Rechtecke stellst du im Panel ein.' },
  { on: () => typeof flaeche !== 'undefined' && !!flaeche, text: 'Fläche: Die Grenzen a und b im Plot ziehen (sie rasten an Schnittpunkten ein).' },
  { on: () => typeof loObjActive !== 'undefined' && !!loObjActive, text: 'Zielfunktion: Den Griff im Plot verschieben. Er rastet an den Ecken des Planungspolygons ein.' }
];
let guideAppletState = GUIDE_APPLETS.map(a => false), guideAppletInit = false;
function guideAppletCheck() {
  const now = GUIDE_APPLETS.map(a => { try { return a.on(); } catch (e) { return false; } });
  const fresh = guideAppletInit ? now.map((v, i) => v && !guideAppletState[i] ? i : -1).filter(i => i >= 0) : [];
  guideAppletState = now; guideAppletInit = true;          // Zustand ZUERST merken (guideFlash ruft guideSync → guideAppletCheck)
  if (fresh.length) guideFlash(GUIDE_APPLETS[fresh[0]].text, false, 7000);
}

// Sicherheitsnetz: Modi werden an vielen Stellen umgeschaltet (auch ohne neu zu zeichnen) → regelmässig abgleichen.
setInterval(guideSync, 200);
document.addEventListener('click', () => setTimeout(guideSync, 0), true);
document.addEventListener('keydown', e => {
  // Escape beendet jeden Klick-Ablauf (Geometrie macht das schon selbst)
  if (e.key !== 'Escape') return;
  const tg = e.target && e.target.tagName;
  if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'MATH-FIELD') return;
  if (typeof deleteMode !== 'undefined' && deleteMode) toggleDeleteMode();
  if (typeof pointMode !== 'undefined' && pointMode) togglePointMode();
  if (typeof graphPtMode !== 'undefined' && graphPtMode) toggleGraphPtMode();
  if (typeof line2ptPicking !== 'undefined' && line2ptPicking) toggleLine2PtMode();
  if (typeof slopeTriPickMode !== 'undefined' && slopeTriPickMode) slopeTriStopPick();
  if (typeof fitPickMode !== 'undefined' && fitPickMode) genericStopPick();
  if (typeof perpFlowKind !== 'undefined' && perpFlowKind) _perpFlowStop();
  guideSync();
});
