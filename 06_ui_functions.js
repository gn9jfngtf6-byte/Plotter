// CSS für Exponenten-Kursor-Hervorhebung und Anker-Darstellung injizieren
(function() {
  if (document.getElementById('sup-cursor-style')) return;
  const s = document.createElement('style'); s.id = 'sup-cursor-style';
  s.textContent =
    '.preview-sup.sup-cursor-active{outline:1.5px solid rgba(55,138,221,0.75);background:rgba(55,138,221,0.11);border-radius:2px;}' +
    '.func-inp-ce .pf-cursor-anchor{vertical-align:baseline!important;font-size:1em!important;}' +
    '.func-inp-ce .pf-inline{vertical-align:middle;display:inline;font-size:1em;}' +
    '.func-inp-ce::-webkit-scrollbar{height:3px;}' +
    '.func-inp-ce::-webkit-scrollbar-thumb{background:var(--border-input);border-radius:3px;}' +
    '.smart-btn-row{display:flex;flex-wrap:wrap;gap:3px;margin:2px 0 5px 28px;min-height:0;}' +
    '.smart-btn{font-size:10px;padding:2px 8px;border-radius:10px;border:1.5px solid;cursor:pointer;background:transparent;transition:background 0.15s,color 0.15s;white-space:nowrap;line-height:1.5;font-family:system-ui,sans-serif;}' +
    '.smart-btn:hover{filter:brightness(1.15);}' +
    '.smart-btn.sb-active{color:#fff!important;}';
  document.head.appendChild(s);
})();

// ═══════════════════════════════════════════════════════════════════
// DEFINITIONSBEREICH: automatische Erkennung
// ═══════════════════════════════════════════════════════════════════

// Speichert pro Funktionsobjekt: { timer, userSet }
// WeakMap: wird automatisch geleert wenn die Funktion aus dem Array entfernt wird
const _fnDomState = new WeakMap();
function _domSt(fn) {
  if (!_fnDomState.has(fn)) _fnDomState.set(fn, { timer: null, userSet: false });
  return _fnDomState.get(fn);
}

// Scannt den Ausdruck numerisch und sucht nach NaN↔finite-Übergängen.
// Gibt {domainMin, domainMax, excluded} zurück.
//   domainMin/domainMax: null = keine Grenze erkannt.
//   excluded: Array von x-Werten wo Polstellen/Lücken liegen (z.B. [0] für 1/x).
// Polstellen werden als excluded gemeldet, nicht als Domänengrenze.
function detectNaturalDomain(expr) {
  if (!expr || !expr.trim()) return { domainMin: null, domainMax: null, excluded: [] };
  const SMIN = -500, SMAX = 500, STEPS = 5000;
  const step = (SMAX - SMIN) / STEPS;
  let leftBnd = null, rightBnd = null;
  const excluded = [];
  let prevFin = null, prevX = null;
  let waitingForPoleEnd = false, poleStart = null;

  const snapRound = v => {
    const r = Math.round(v * 100) / 100;
    return Math.abs(v - r) < 0.005 ? r : parseFloat(v.toFixed(4));
  };

  for (let i = 0; i <= STEPS; i++) {
    const x = SMIN + i * step;
    const fin = isFinite(safeEval(expr, x));
    if (prevFin !== null) {
      if (!prevFin && fin) {
        // NaN → finite: linke Domänengrenze oder Ende einer Polstelle?
        let lo = prevX, hi = x;
        for (let k = 0; k < 50; k++) { const m=(lo+hi)/2; if(isFinite(safeEval(expr,m))) hi=m; else lo=m; }
        const bnd = (lo+hi)/2;
        if (!isFinite(safeEval(expr, Math.min(bnd-20, SMIN*0.9))) && leftBnd === null) {
          // Funktion links davon nicht definiert → echte linke Grenze
          leftBnd = snapRound(bnd);
          waitingForPoleEnd = false; poleStart = null;
        } else if (waitingForPoleEnd && poleStart !== null) {
          // Wir kommen aus einer NaN-Region heraus, die links von etwas Finitem war → Polstelle
          // Mittelpunkt der NaN-Region als Ausnahme-Punkt melden
          const poleMid = snapRound((poleStart + bnd) / 2);
          if (!excluded.includes(poleMid)) excluded.push(poleMid);
          waitingForPoleEnd = false; poleStart = null;
        }
      }
      if (prevFin && !fin) {
        // finite → NaN: rechte Domänengrenze oder Beginn einer Polstelle?
        let lo = prevX, hi = x;
        for (let k = 0; k < 50; k++) { const m=(lo+hi)/2; if(isFinite(safeEval(expr,m))) lo=m; else hi=m; }
        const bnd = (lo+hi)/2;
        if (!isFinite(safeEval(expr, Math.max(bnd+20, SMAX*0.9))) && rightBnd === null) {
          // Funktion rechts davon nicht definiert → echte rechte Grenze
          rightBnd = snapRound(bnd);
        } else {
          // Funktion ist rechts wieder definiert → Polstelle beginnt hier
          waitingForPoleEnd = true; poleStart = bnd;
        }
      }
    }
    prevFin = fin; prevX = x;
  }
  return { domainMin: leftBnd, domainMax: rightBnd, excluded };
}

// Erzeugt den Anzeigetext für den Domänen-Button, inklusive Ausnahmen (Polstellen).
function _domainLabel(fn) {
  const excl = fn.domainExcluded || [];
  const hasBounds = fn.domainMin != null || fn.domainMax != null;
  let exclStr = '';
  if (excl.length > 0 && excl.length <= 4) exclStr = ` \\ {${excl.join(', ')}}`;
  else if (excl.length > 4)               exclStr = ' \\ {…}';
  if (!hasBounds) return excl.length > 0 ? `D: ℝ${exclStr}` : 'D: ℝ';
  const dmn = fn.domainMin != null ? fn.domainMin : '−∞';
  const dmx = fn.domainMax != null ? fn.domainMax : '+∞';
  return `D: [${dmn}, ${dmx}]${exclStr}`;
}

// Wendet erkannten Definitionsbereich auf fn + UI-Elemente an
function _applyDetectedDomain(fn, domainToggle, vonInp, bisInp, rangeSpan) {
  const det = detectNaturalDomain(fn.expr);
  fn.domainMin = det.domainMin;
  fn.domainMax = det.domainMax;
  fn.domainExcluded = det.excluded || [];
  domainToggle.textContent = _domainLabel(fn);
  vonInp.value = fn.domainMin != null ? fn.domainMin : '';
  bisInp.value = fn.domainMax != null ? fn.domainMax : '';
  if (rangeSpan) _updateRangeSpan(fn.expr, fn.domainMin, fn.domainMax, rangeSpan);
  clearEvalCache(); scheduleComputeSpecials(); scheduleDraw();
}

// ═══════════════════════════════════════════════════════════════════
// WERTEMENGE: automatische Erkennung
// ═══════════════════════════════════════════════════════════════════

// Scannt numerisch und bestimmt den Wertebereich [rangeMin, rangeMax].
// null = unbeschränkt in diese Richtung.
function detectRange(expr, domainMin, domainMax) {
  if (!expr || !expr.trim()) return { rangeMin: null, rangeMax: null };

  const dMin = domainMin != null ? domainMin : -500;
  const dMax = domainMax != null ? domainMax : 500;
  const STEPS = 3000;
  const dx = (dMax - dMin) / STEPS;

  let yMin = Infinity, yMax = -Infinity;
  let prevFin = null, nanAfterFinite = false, hasInteriorNaN = false;
  let prevY = null, prevX = null, nanEnterX = null;
  let hasFiniteZeroCross = false, hasZeroDirect = false;
  const interiorPoles = []; // ungefähre x-Positionen der Polstellen

  for (let i = 0; i <= STEPS; i++) {
    const x = dMin + i * dx;
    const y = safeEval(expr, x);
    const fin = isFinite(y);
    if (fin) {
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
      if (Math.abs(y) < 1e-9) hasZeroDirect = true;
      if (prevY !== null && prevFin === true && ((prevY < 0 && y > 0) || (prevY > 0 && y < 0)))
        hasFiniteZeroCross = true;
      if (nanAfterFinite) {
        hasInteriorNaN = true;
        if (nanEnterX !== null) {
          interiorPoles.push((nanEnterX + x) / 2);
          nanEnterX = null;
        }
        nanAfterFinite = false; // Reset für nächste Polstelle
      }
      prevY = y;
    } else {
      if (prevFin === true) { nanAfterFinite = true; nanEnterX = prevX; }
      prevY = null;
    }
    prevFin = fin; prevX = x;
  }

  // Rundet auf sinnvolle Stellen
  const rnd = v => {
    if (Math.abs(v) < 1e-6) return 0;
    const a = Math.abs(v);
    return parseFloat(v.toFixed(a >= 100 ? 0 : a >= 10 ? 1 : 2));
  };

  // Funktion nirgends definiert
  if (!isFinite(yMin)) return { rangeMin: null, rangeMax: null, rangeExcluded: [] };

  // Polstellen im Inneren: Approach-Richtung durch Direktproben ermitteln
  if (hasInteriorNaN) {
    const zeroAchieved = hasZeroDirect || hasFiniteZeroCross;

    // Für jede Polstelle: testet ob f → +∞ oder f → −∞
    const EPS = 1e-7, THR = 100;
    let polePos = false, poleNeg = false;
    interiorPoles.forEach(px => {
      for (const tx of [px - EPS, px + EPS]) {
        if (tx <= dMin || tx >= dMax) continue;
        const ty = safeEval(expr, tx);
        if (!isFinite(ty)) continue;
        if (ty >  THR) polePos = true;
        if (ty < -THR) poleNeg = true;
      }
    });
    // Fallback wenn interiorPoles leer (Scan zu grob): Vorzeichen aus Scan ableiten
    if (!polePos && !poleNeg) { if (yMax > 10) polePos = true; if (yMin < -10) poleNeg = true; }

    // Grenzwert bei ±∞ (für Fälle mit unbeschränkter Domain)
    const farLimit = (findMin) => {
      const pts = [];
      const farVals = [500, 1000, 2000];
      farVals.forEach(fx => {
        if (domainMax == null || fx <= domainMax) { const v = safeEval(expr, fx); if (isFinite(v)) pts.push(v); }
        if (domainMin == null || -fx >= domainMin) { const v = safeEval(expr, -fx); if (isFinite(v)) pts.push(v); }
      });
      return pts.length ? (findMin ? Math.min(...pts) : Math.max(...pts)) : null;
    };

    if (polePos && poleNeg) {
      // Pol geht zu ±∞ → horizontale Asymptote bestimmen (= ausgeschlossener W-Wert)
      // z.B. 1/x → Asymptote 0 → W: ℝ\{0}; 1/x-1 → Asymptote -1 → W: ℝ\{-1}; tan → keine Asymptote → W: ℝ
      const farSmp = (xs) => xs
        .filter(x => (domainMin == null || x >= domainMin) && (domainMax == null || x <= domainMax))
        .map(x => safeEval(expr, x)).filter(isFinite);
      const rSamp = farSmp([1000, 2000, 5000]);
      const lSamp = farSmp([-1000, -2000, -5000]);
      const sprd = arr => arr.length >= 2 ? Math.max(...arr) - Math.min(...arr) : Infinity;
      const lastV = arr => arr.length ? arr[arr.length - 1] : null;

      const rConv = sprd(rSamp) < 0.5, lConv = sprd(lSamp) < 0.5;
      const rLim = lastV(rSamp), lLim = lastV(lSamp);

      let asymptote = null;
      if (rConv && lConv && rLim !== null && lLim !== null && Math.abs(rLim - lLim) < 1.0) {
        asymptote = rnd((rLim + lLim) / 2);         // beide Seiten konvergieren → Asymptote
      } else if (rConv && rLim !== null) {
        asymptote = rnd(rLim);                       // nur rechts konvergent
      } else if (lConv && lLim !== null) {
        asymptote = rnd(lLim);                       // nur links konvergent
      }
      // Keine Konvergenz (z.B. tan(x)): Asymptote = null → W: ℝ

      return asymptote !== null
        ? { rangeMin: null, rangeMax: null, rangeExcluded: [asymptote] }
        : { rangeMin: null, rangeMax: null, rangeExcluded: [] };
    }

    const domBounded = domainMin != null && domainMax != null;

    if (polePos) {
      // Pol → +∞; untere Grenze = asymptotischer Grenzwert bei ±∞
      if (!domBounded) {
        const lim = farLimit(true);
        if (lim !== null) {
          const limR = rnd(lim);
          return { rangeMin: limR, rangeMax: null, rangeExcluded: [limR] }; // W: (lim, +∞)
        }
      } else {
        // Beschränkte Domain: Minimum ist an den Grenzen erreichbar
        return { rangeMin: rnd(yMin), rangeMax: null, rangeExcluded: [] }; // W: [min, +∞)
      }
    }

    if (poleNeg) {
      // Pol → −∞; obere Grenze = asymptotischer Grenzwert bei ±∞
      if (!domBounded) {
        const lim = farLimit(false);
        if (lim !== null) {
          const limR = rnd(lim);
          return { rangeMin: null, rangeMax: limR, rangeExcluded: [limR] }; // W: (−∞, lim)
        }
      } else {
        return { rangeMin: null, rangeMax: rnd(yMax), rangeExcluded: [] }; // W: (−∞, max]
      }
    }

    return { rangeMin: null, rangeMax: null, rangeExcluded: [] };
  }

  let rangeMin = rnd(yMin), rangeMax = rnd(yMax);

  // Prüft ob Funktion zwischen zwei x-Werten monoton steigt/fällt (> 0.5 Differenz)
  const trend = (xa, xb) => {
    const ya = safeEval(expr, xa), yb = safeEval(expr, xb);
    if (!isFinite(ya) || !isFinite(yb)) return 0;
    return yb > ya + 0.5 ? 1 : yb < ya - 0.5 ? -1 : 0;
  };

  // Unbeschränktheit nach rechts prüfen (nur bei offener rechter Domain)
  if (domainMax == null) {
    const r = [trend(100,200), trend(200,400), trend(400,800)];
    if (r.every(v => v === 1))  rangeMax = null; // wächst nach +∞
    if (r.every(v => v === -1)) rangeMin = null; // fällt nach −∞
  }

  // Unbeschränktheit nach links prüfen (nur bei offener linker Domain)
  if (domainMin == null) {
    // Paare von innen nach außen (x wird kleiner): y(-400)<y(-200) → fällt nach −∞
    const yL100 = safeEval(expr, -100), yL200 = safeEval(expr, -200), yL400 = safeEval(expr, -400);
    if (isFinite(yL100) && isFinite(yL200) && isFinite(yL400)) {
      if (yL400 > yL200 + 0.5 && yL200 > yL100 + 0.5) rangeMax = null; // steigt nach +∞ links
      if (yL400 < yL200 - 0.5 && yL200 < yL100 - 0.5) rangeMin = null; // fällt nach −∞ links
    }
  }

  // Asymptotik an den Domain-Grenzen prüfen (z.B. log(x) nahe x=0)
  if (domainMin != null) {
    const eps = Math.max(dx / 1000, 1e-9);
    const y1 = safeEval(expr, dMin + eps);
    const y2 = safeEval(expr, dMin + eps * 100);
    if (isFinite(y1) && isFinite(y2)) {
      if (y1 < y2 - 2) rangeMin = null; // nähert sich −∞ von rechts
      if (y1 > y2 + 2) rangeMax = null; // nähert sich +∞ von rechts
    }
  }
  if (domainMax != null) {
    const eps = Math.max(dx / 1000, 1e-9);
    const y1 = safeEval(expr, dMax - eps);
    const y2 = safeEval(expr, dMax - eps * 100);
    if (isFinite(y1) && isFinite(y2)) {
      if (y1 > y2 + 2) rangeMax = null; // nähert sich +∞ von links
      if (y1 < y2 - 2) rangeMin = null; // nähert sich −∞ von links
    }
  }

  return { rangeMin, rangeMax, rangeExcluded: [] };
}

// Aktualisiert das rangeSpan-Element mit der berechneten Wertemenge
function _updateRangeSpan(expr, domainMin, domainMax, rangeSpan) {
  if (!expr || !expr.trim()) { rangeSpan.textContent = ''; return; }
  const { rangeMin, rangeMax, rangeExcluded } = detectRange(expr, domainMin, domainMax);
  const excl = rangeExcluded || [];
  if (rangeMin === null && rangeMax === null) {
    // ℝ mit möglichen Ausnahmen (z.B. ℝ\{0})
    const exclStr = excl.length > 0 && excl.length <= 3 ? ` \\ {${excl.join(', ')}}`
                  : excl.length > 3 ? ' \\ {…}' : '';
    rangeSpan.textContent = `W: ℝ${exclStr}`;
  } else {
    const lo = rangeMin != null ? rangeMin : '−∞';
    const hi = rangeMax != null ? rangeMax : '+∞';
    // Offene Klammer wenn der Grenzwert in excl enthalten ist (asymptotisch angenähert)
    const lB = (rangeMin == null || excl.includes(rangeMin)) ? '(' : '[';
    const rB = (rangeMax == null || excl.includes(rangeMax)) ? ')' : ']';
    // Nur solche excl-Werte im \{}-Teil anzeigen, die nicht schon als Intervallgrenze sichtbar sind
    const inner = excl.filter(v => v !== rangeMin && v !== rangeMax);
    const exclStr = inner.length > 0 && inner.length <= 3 ? ` \\ {${inner.join(', ')}}`
                  : inner.length > 3 ? ' \\ {…}' : '';
    rangeSpan.textContent = `W: ${lB}${lo}, ${hi}${rB}${exclStr}`;
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODUL: ui_functions — Funktionsliste in der Sidebar
// Enthält:  renderFuncList(), addFunction(), removeFunction()
//           syncAreaSelects(), renderPreview(), setActiveInput()
// Ändern:  Standardausdruck neuer Funktionen → addFunction()
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// ANZEIGEFORMATIERUNG DES FUNKTIONSAUSDRUCKS
// ═══════════════════════════════════════════════════════════════════

// Rundet alle Dezimalzahlen im Ausdruck auf die eingestellte Nachkommazahl.
// Nur für die Anzeige im Eingabefeld — fn.expr (volle Präzision) bleibt unberührt.
// Beispiel (precision=2): "5.65685424949*1.189207115^x" → "5.66*1.19^x"
function exprToDisplayStr(expr) {
  return expr.replace(/\d+\.\d+/g, m => parseFloat(parseFloat(m).toFixed(precision)).toString());
}

// ═══════════════════════════════════════════════════════════════════
// DOM → RAW-AUSDRUCK REKONSTRUKTION
// ═══════════════════════════════════════════════════════════════════

// Setzt den Cursor in einem contenteditable-Div auf Zeichen-Offset offset (im textContent).
function ceSetCursorAt(el, offset) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let rem = offset;
  while (walker.nextNode()) {
    const len = walker.currentNode.length;
    if (rem <= len) {
      const r = document.createRange();
      r.setStart(walker.currentNode, rem);
      r.collapse(true);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      return;
    }
    rem -= len;
  }
  // Fallback: ans Ende
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
  window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
}

// Rekonstruiert den Rohausdruck (für safeEval) aus dem gerenderten HTML des Eingabefeldes.
// Kehrt die Transformationen von exprToHtml um:
//   .preview-frac → (Zähler)/(Nenner)
//   .preview-sup  → ^Inhalt
//   ⋅ / ·         → *
//   π             → pi
//   alleinsteh. e → EC
// Wird aufgerufen wenn das Feld in "always-rendered"-Modus ist (oninput, onblur).
function ceRawFromDom(el) {
  function walk(node) {
    if (node.nodeType === 3 /* TEXT_NODE */) {
      return node.textContent
        .replace(/​/g, '')        // Zero-Width-Space (Cursor-Anker) entfernen
        .replace(/[⋅·]/g, '*')        // Mittelpunkt → Multiplikation
        .replace(/π/g, 'pi')           // π → pi
        .replace(/\be\b/g, 'EC');      // alleinsteh. e → EC (Eulersche Zahl)
    }
    if (node.nodeType === 1 /* ELEMENT_NODE */) {
      const cls = node.className || '';
      // Bruch: (Zähler)/(Nenner)
      if (cls.includes('preview-frac')) {
        const numEl = Array.from(node.children).find(c => c.classList.contains('pf-num'));
        const denEl = Array.from(node.children).find(c => c.classList.contains('pf-den'));
        const num = numEl ? Array.from(numEl.childNodes).map(walk).join('') : '';
        const den = denEl ? Array.from(denEl.childNodes).map(walk).join('') : '';
        return `(${num})/(${den})`;
      }
      // Hochgestellter Exponent: ^Inhalt
      // Komplexer Inhalt (mit Operatoren) in Klammern → ^(n+1)
      if (cls.includes('preview-sup')) {
        const inner = Array.from(node.childNodes).map(walk).join('');
        const needsParens = /[+\-*\/]/.test(inner) && !inner.startsWith('(');
        return needsParens ? `^(${inner})` : `^${inner}`;
      }
      // Platzhalter-Span ignorieren
      if (node.style && node.style.fontStyle === 'italic') return '';
      // Cursor-Anker: Inhalt zurückgeben (ZWS wird im Text-Knoten-Handler gestrippt)
      if (cls.includes('pf-cursor-anchor')) return Array.from(node.childNodes).map(walk).join('');
      // Sonstige Elemente: rekursiv
      return Array.from(node.childNodes).map(walk).join('');
    }
    return '';
  }
  return Array.from(el.childNodes).map(walk).join('');
}

// Öffentliche Funktion: CE-Feld von außen neu rendern (z.B. nach kbdInsert).
function ceRenderEl(el) {
  if (el._ceRender) { el._ceRender(); }
}

// ═══════════════════════════════════════════════════════════════════
// FUNKTIONSLISTE (Sidebar)
// ═══════════════════════════════════════════════════════════════════

// Rendert die Funktionsliste in der Sidebar.
// Live-Geraden (verknüpft mit Punkten) haben blauen Hintergrund.
function renderFuncList() {
  const el = document.getElementById('func-list'); el.innerHTML = '';
  functions.forEach((fn, i) => {
    if (fn.visible === undefined) fn.visible = true;
    const isLinked = linkedLines.some(ll => ll.fi === i);

    const row = document.createElement('div'); row.className = 'func-row';

    // Farbpunkt — klickbar zum Öffnen des Farbwählers
    const dot = document.createElement('div'); dot.className = 'dot';
    dot.style.background = fn.color; dot.style.opacity = fn.visible ? '1' : '0.3';
    dot.style.cursor = 'pointer'; dot.title = t('title_color');
    dot.onclick = e => { e.stopPropagation(); openColorPicker(e, i); };

    // Funktionsnummer-Label mit Subscript (HTML)
    const lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:11px;color:#6b7280;min-width:24px;flex-shrink:0;';
    lbl.innerHTML = `f<sub>${i+1}</sub>:`;

    // Contenteditable-Eingabefeld (zeigt Brüche als echte Brüche im Ruhezustand)
    const inp = document.createElement('div');
    inp.contentEditable = 'true';
    inp.spellcheck = false;
    inp.className = 'func-inp-ce';
    inp.setAttribute('inputmode', 'decimal');
    inp.setAttribute('data-raw', fn.expr);
    // overflow-x:clip statt overflow-x:hidden — clip erzwingt kein overflow-y:auto (CSS-Spezifikation),
    // sodass overflow-y:visible wirksam bleibt und das Feld bei Brüchen vertikal wächst.
    inp.style.cssText = `font-family:'Cascadia Code','Fira Mono',monospace;font-size:12px;padding:4px 8px;border:1px solid var(--border-input);border-radius:6px;background:var(--bg-input);color:var(--text);outline:none;flex:1;min-width:0;cursor:text;overflow-x:auto;overflow-y:visible;white-space:nowrap;line-height:normal;min-height:28px;${fn.visible ? '' : 'opacity:0.45;'}`;
    if (isLinked) { inp.style.background = '#f0f9ff'; inp.title = t('title_live_line'); }

    // Guard: verhindert dass oninput feuert wenn ceRender() das HTML programmatisch setzt
    let ceRendering = false;

    // Ruhezustand: formatierte Darstellung (Brüche + Exponenten, Dezimalzahlen gerundet)
    function ceRender() {
      const raw = inp.getAttribute('data-raw') || '';
      const disp = raw ? exprToDisplayStr(raw) : '';
      ceRendering = true;
      if (exprNeedsPreview(raw)) {
        inp.innerHTML = exprToHtml(disp || raw);
        // Wrap top-level text nodes in pf-inline for vertical alignment next to fractions
        Array.from(inp.childNodes).forEach(nd => {
          if (nd.nodeType === 3 && nd.textContent.replace(/​/g, '').length > 0) {
            const pli = document.createElement('span'); pli.className = 'pf-inline';
            inp.insertBefore(pli, nd); pli.appendChild(nd);
          }
        });
        // Cursor-Anker: Span am Ende sicherstellen — begrenzt Schreibmarken-Höhe auf Schriftgrösse
        if (!inp.lastChild || !inp.lastChild.classList?.contains('pf-cursor-anchor')) {
          const anchor = document.createElement('span');
          anchor.className = 'pf-cursor-anchor';
          anchor.textContent = '​';
          inp.appendChild(anchor);
        }
      }
      else { inp.textContent = disp || ''; if (!disp) { inp.innerHTML = `<span style="color:var(--text-muted);font-style:italic;">${t('eg_fn')}</span>`; } }
      ceRendering = false;
    }
    ceRender();
    inp._ceRender = ceRender;

    inp.onfocus = () => {
      // Feld bleibt immer gerendert — kein Wechsel auf Rohtext beim Fokussieren.
      inp.style.borderColor = '#378ADD';
      setActiveInput(inp, i);
      // Exponenten-Hervorhebung: aktiven sup blau umranden
      const onSelChange = () => {
        inp.querySelectorAll('.preview-sup').forEach(s => s.classList.remove('sup-cursor-active'));
        const sel = window.getSelection(); if (!sel.rangeCount) return;
        let nd = sel.getRangeAt(0).startContainer;
        while (nd && nd !== inp) {
          if (nd.nodeType === 1 && nd.classList?.contains('preview-sup')) { nd.classList.add('sup-cursor-active'); break; }
          nd = nd.parentNode;
        }
      };
      document.addEventListener('selectionchange', onSelChange);
      inp._onSelChange = onSelChange;
      // Leeres Feld: Platzhalter entfernen damit sofort getippt werden kann
      if (!(inp.getAttribute('data-raw') || '')) {
        ceRendering = true; inp.innerHTML = ''; ceRendering = false;
      }
      // Nach kbdFrac: Cursor in den Zähler des letzten Bruchs
      const nextCursor = inp.getAttribute('data-next-cursor');
      if (nextCursor) {
        inp.removeAttribute('data-next-cursor');
        const fracs = inp.querySelectorAll('.preview-frac');
        if (fracs.length > 0) {
          const numEl = fracs[fracs.length-1].querySelector('.pf-num');
          if (numEl) {
            const r = document.createRange(); r.selectNodeContents(numEl); r.collapse(false);
            window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
            return;
          }
        }
      }
      // Standardfall: Cursor ans Ende
      const r = document.createRange(); r.selectNodeContents(inp); r.collapse(false);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    };
    inp.onblur = () => {
      if (inp._onSelChange) { document.removeEventListener('selectionchange', inp._onSelChange); inp._onSelChange = null; }
      inp.querySelectorAll('.preview-sup').forEach(s => s.classList.remove('sup-cursor-active'));
      // Rohausdruck aus dem gerenderten DOM rekonstruieren und neu rendern
      const raw = ceRawFromDom(inp);
      inp.setAttribute('data-raw', raw);
      inp.style.borderColor = '';
      ceRender();
      if (!historyPaused) { clearTimeout(_histDebounce); _histDebounce = setTimeout(pushHistory, 100); }
    };
    inp.oninput = () => {
      if (ceRendering) return;
      let raw = ceRawFromDom(inp);
      // Einfache a/b-Muster automatisch als Bruch rendern (z.B. x/2 → (x)/(2))
      const converted = raw.replace(
        /([a-zA-Z0-9_.]+(?:\([^()]*\))?(?:\^(?:\([^)]*\)|[a-zA-Z0-9_.]+))?)\/([a-zA-Z0-9_.]+(?:\([^()]*\))?(?:\^(?:\([^)]*\)|[a-zA-Z0-9_.]+))?)/g,
        '($1)/($2)'
      );
      if (converted !== raw) {
        inp.setAttribute('data-raw', converted);
        ceRender();
        // Cursor ans Ende des Nenners des letzten Bruchs
        const fracs = inp.querySelectorAll('.preview-frac');
        if (fracs.length > 0) {
          const denEl = fracs[fracs.length-1].querySelector('.pf-den');
          if (denEl) {
            const r = document.createRange(); r.selectNodeContents(denEl); r.collapse(false);
            window.getSelection().removeAllRanges(); window.getSelection().addRange(r);
          }
        }
        raw = converted;
      }
      inp.setAttribute('data-raw', raw);
      fn.expr = raw;
      clearEvalCache(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
      if (showArea) updateAreaResult(); syncLinearExtra(); scheduleDraw();
      // Definitionsbereich bei Ausdrucksänderung neu erkennen (wenn nicht manuell gesetzt)
      const _ds = _domSt(fn);
      _ds.userSet = false;
      clearTimeout(_ds.timer);
      fn.domainMin = null; fn.domainMax = null; fn.domainExcluded = [];
      domainToggle.textContent = 'D: ℝ'; vonInp.value = ''; bisInp.value = '';
      if (raw.trim()) {
        _ds.timer = setTimeout(() => {
          if (_domSt(fn).userSet) return;
          _applyDetectedDomain(fn, domainToggle, vonInp, bisInp, rangeSpan);
        }, 700);
      } else {
        rangeSpan.textContent = '';
      }
    };
    // Keine Newlines; Brüche als Einheit löschen; Exponent-Escape mit ArrowRight
    inp.onkeydown = e => {
      if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
      // ArrowRight / Tab / ArrowDown / End: Aus dem Exponenten heraus navigieren (zwei Zustände)
      if (e.key === 'ArrowRight' || e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'End') {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          let nd = sel.getRangeAt(0).startContainer;
          let supEl = null, anchEl = null, tempNd = nd;
          while (tempNd && tempNd !== inp) {
            if (tempNd.nodeType === 1 && tempNd.classList?.contains('preview-sup')) { supEl = tempNd; break; }
            tempNd = tempNd.parentNode;
          }
          tempNd = nd;
          while (tempNd && tempNd !== inp) {
            if (tempNd.nodeType === 1 && tempNd.classList?.contains('pf-cursor-anchor')) { anchEl = tempNd; break; }
            tempNd = tempNd.parentNode;
          }
          const anchAfterSup = anchEl && anchEl.previousSibling?.classList?.contains('preview-sup');
          if (supEl) {
            // Zustand 1: Kursor im sup → in den Anker danach bewegen
            e.preventDefault();
            let anch = supEl.nextSibling;
            if (!anch || !anch.classList?.contains('pf-cursor-anchor')) {
              anch = document.createElement('span'); anch.className = 'pf-cursor-anchor'; anch.textContent = '​';
              supEl.parentNode.insertBefore(anch, supEl.nextSibling);
            }
            const nr = document.createRange();
            const tx = anch.firstChild;
            if (tx && tx.nodeType === 3) { nr.setStart(tx, tx.length); } else { nr.selectNodeContents(anch); nr.collapse(false); }
            nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr);
            return;
          }
          if (anchAfterSup) {
            // Zustand 2: Kursor im Anker → hinter den Anker bewegen
            e.preventDefault();
            const nr = document.createRange();
            const after = anchEl.nextSibling;
            if (after && after.nodeType === 3) { nr.setStart(after, 0); }
            else if (after) { nr.setStartBefore(after); }
            else { nr.selectNodeContents(inp); nr.collapse(false); }
            nr.collapse(true); sel.removeAllRanges(); sel.addRange(nr);
            return;
          }
        }
      }
      // Backspace direkt nach einem Bruch: Bruch als Ganzes entfernen
      if (e.key === 'Backspace') {
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
    };

    const preview = document.createElement('div'); // Dummy, nicht mehr verwendet
    preview.style.display = 'none';

    // Auge-Button
    const eye = document.createElement('button'); eye.className = 'del-btn';
    eye.innerHTML = fn.visible ? '&#128065;' : '&#x1F648;'; eye.title = fn.visible ? t('btn_hide_fn') : t('btn_show_fn');
    eye.onclick = () => { fn.visible = !fn.visible; renderFuncList(); scheduleComputeSpecials(); if (showArea) updateAreaResult(); scheduleDraw(); };

    // Löschen-Button — bereinigt auch zugehörige Graph-Punkte
    const del = document.createElement('button'); del.className = 'del-btn'; del.textContent = '✕';
    del.onclick = () => {
      // Graph-Punkte auf dieser Funktion entfernen
      graphPoints = graphPoints.filter(gp => gp.fi !== i);
      // Indizes der Graph-Punkte auf höheren Funktionen anpassen
      graphPoints.forEach(gp => { if (gp.fi > i) gp.fi--; });
      functions.splice(i, 1);
      linkedLines = linkedLines.filter(ll => ll.fi !== i);
      linkedLines.forEach(ll => { if (ll.fi > i) ll.fi--; });
      if (activeInput?.fi === i) activeInput = null;
      clearEvalCache(); renderFuncList(); syncParams(); syncAreaSelects(); scheduleComputeSpecials(); if (showArea) updateAreaResult();
      pushHistory(); scheduleDraw();
    };
    row.append(dot, lbl, inp, eye, del);
    const smartBtns = document.createElement('div');
    smartBtns.className = 'smart-btn-row';
    smartBtns.id = `smart-btns-${i}`;
    const solvePanel = document.createElement('div');
    solvePanel.id = `solve-panel-${i}`;
    // ── Definitionsbereich-Zeile ──────────────────────────────────────
    const domainRow = document.createElement('div');
    domainRow.style.cssText = 'margin:0 0 4px 28px;';

    const hasDomain = fn.domainMin != null || fn.domainMax != null;

    const domainToggle = document.createElement('button');
    domainToggle.className = 'smart-btn';
    domainToggle.style.cssText = `border-color:${fn.color}66;color:${fn.color};font-size:10px;padding:1px 7px;border-radius:10px;white-space:nowrap;background:transparent;border:1.5px solid;cursor:pointer;font-family:system-ui,sans-serif;line-height:1.5;`;
    domainToggle.textContent = _domainLabel(fn);
    domainToggle.title = 'Definitionsbereich einschränken';

    const domainLine1 = document.createElement('div');
    domainLine1.style.cssText = 'display:flex;align-items:center;gap:4px;';

    const domainInputs = document.createElement('div');
    domainInputs.style.cssText = `display:${hasDomain ? 'flex' : 'none'};align-items:center;gap:3px;flex-wrap:nowrap;margin-top:3px;`;

    const vonInp = document.createElement('input'); vonInp.type = 'number'; vonInp.step = '0.5';
    vonInp.placeholder = '−∞'; vonInp.style.cssText = 'width:52px;font-size:11px;padding:2px 4px;border:1px solid var(--border-input);border-radius:4px;background:var(--bg-input);color:var(--text);';
    if (fn.domainMin != null) vonInp.value = fn.domainMin;

    const bisInp = document.createElement('input'); bisInp.type = 'number'; bisInp.step = '0.5';
    bisInp.placeholder = '+∞'; bisInp.style.cssText = 'width:52px;font-size:11px;padding:2px 4px;border:1px solid var(--border-input);border-radius:4px;background:var(--bg-input);color:var(--text);';
    if (fn.domainMax != null) bisInp.value = fn.domainMax;

    const mkSpan = t => { const s = document.createElement('span'); s.textContent = t; s.style.cssText = 'font-size:11px;color:var(--text-muted);'; return s; };

    const domainClear = document.createElement('button'); domainClear.textContent = '✕';
    domainClear.style.cssText = 'font-size:10px;padding:1px 5px;border-radius:4px;border:1px solid var(--border-input);background:var(--bg-btn);color:var(--text-muted);cursor:pointer;';
    domainClear.title = 'Zurücksetzen (D = ℝ)';
    domainClear.onclick = () => {
      fn.domainMin = null; fn.domainMax = null;
      clearEvalCache(); scheduleComputeSpecials(); scheduleDraw();
      renderFuncList();
    };

    // rangeSpan VOR updateDomainFromInputs deklarieren (wird in Closure referenziert)
    const rangeSpan = document.createElement('span');
    rangeSpan.style.cssText = 'font-size:10px;color:var(--text-muted);white-space:nowrap;padding-left:6px;opacity:0.85;';

    const updateDomainFromInputs = () => {
      // Manuelle Eingabe → Auto-Erkennung stoppen
      const _ds = _domSt(fn); _ds.userSet = true; clearTimeout(_ds.timer);
      const minV = vonInp.value.trim() === '' ? null : parseFloat(vonInp.value);
      const maxV = bisInp.value.trim() === '' ? null : parseFloat(bisInp.value);
      fn.domainMin = (minV != null && isFinite(minV)) ? minV : null;
      fn.domainMax = (maxV != null && isFinite(maxV)) ? maxV : null;
      domainToggle.textContent = _domainLabel(fn);
      // Wertemenge nach kurzer Pause neu berechnen (rechenintensiv)
      clearTimeout(rangeSpan._rangeTimer);
      rangeSpan._rangeTimer = setTimeout(() =>
        _updateRangeSpan(fn.expr, fn.domainMin, fn.domainMax, rangeSpan), 300);
      clearEvalCache(); scheduleComputeSpecials();
      if (!historyPaused) { clearTimeout(_histDebounce); _histDebounce = setTimeout(pushHistory, 400); }
      scheduleDraw();
    };
    vonInp.oninput = updateDomainFromInputs;
    bisInp.oninput = updateDomainFromInputs;

    domainToggle.onclick = () => {
      const open = domainInputs.style.display === 'none';
      domainInputs.style.display = open ? 'flex' : 'none';
    };

    domainInputs.append(mkSpan('['), vonInp, mkSpan(','), bisInp, mkSpan(']'), domainClear);
    domainLine1.append(domainToggle, rangeSpan);
    domainRow.append(domainLine1, domainInputs);

    // Beim ersten Rendern mit befülltem Ausdruck aber ohne Domain: auto-erkennen
    if (fn.expr.trim() && fn.domainMin == null && fn.domainMax == null && !_domSt(fn).userSet) {
      const _ds = _domSt(fn);
      clearTimeout(_ds.timer);
      _ds.timer = setTimeout(() => {
        if (_domSt(fn).userSet) return;
        _applyDetectedDomain(fn, domainToggle, vonInp, bisInp, rangeSpan);
      }, 200);
    } else if (fn.expr.trim()) {
      // Domain bereits bekannt (z.B. nach manuellem Setzen oder Laden): Wertemenge sofort berechnen
      setTimeout(() => _updateRangeSpan(fn.expr, fn.domainMin, fn.domainMax, rangeSpan), 50);
    }

    const funcItem = document.createElement('div');
    funcItem.append(row, preview, domainRow, smartBtns, solvePanel);
    el.appendChild(funcItem);
  });
  // Steigungsdreieck-Sektion anzeigen wenn lineare Funktion vorhanden
  const le = document.getElementById('linear-extra');
  if (le) {
    const hasLinearFn = functions.some(fn => fn.expr && fn.expr.trim() && fn.visible !== false && isLinearFunc(fn.expr));
    if (hasLinearFn) le.style.display = 'block';
    // Nur verstecken wenn KEIN linear-live Typ und keine lineare Funktion
    else {
      const fitType = document.getElementById('fit-type')?.value;
      if (fitType !== 'linear_live' && fitType !== 'linear') le.style.display = 'none';
    }
  }
  // Smart-Buttons nach Neuaufbau der Liste aktualisieren
  if (typeof updateSmartButtons === 'function') updateSmartButtons();
  updateFuncLabelsOverlay();
}

// Synchronisiert die Sichtbarkeit der Steigungsdreieck-Sektion
function syncLinearExtra() {
  const le = document.getElementById('linear-extra');
  if (!le) return;
  const hasLinearFn = functions.some(fn => fn.expr && fn.expr.trim() && fn.visible !== false && isLinearFunc(fn.expr));
  const fitType = document.getElementById('fit-type')?.value;
  if (hasLinearFn || fitType === 'linear' || fitType === 'linear_live') {
    le.style.display = 'block';
  } else {
    le.style.display = 'none';
  }
}

// Öffnet den Farbwähler-Popup für Funktion i
let colorPickerFi = -1;
function openColorPicker(e, fi) {
  colorPickerFi = fi;
  const popup = document.getElementById('color-popup');
  popup.innerHTML = '';
  ALL_COLORS.forEach(col => {
    const sw = document.createElement('div'); sw.className = 'color-swatch';
    sw.style.background = col;
    if (col === functions[fi]?.color) sw.classList.add('selected');
    sw.onclick = ev => { ev.stopPropagation(); if (functions[colorPickerFi]) { functions[colorPickerFi].color = col; } renderFuncList(); scheduleDraw(); closeColorPicker(); };
    popup.appendChild(sw);
  });
  popup.classList.add('active');
  // Positionieren nahe dem Klick-Punkt
  const rect = e.target.getBoundingClientRect();
  popup.style.left = (rect.right + 4) + 'px';
  popup.style.top = Math.min(rect.top, window.innerHeight - 160) + 'px';
}
function closeColorPicker() {
  document.getElementById('color-popup').classList.remove('active');
  colorPickerFi = -1;
}
// Klick irgendwo sonst schliesst den Picker
document.addEventListener('click', e => {
  const popup = document.getElementById('color-popup');
  if (popup && popup.classList.contains('active') && !popup.contains(e.target)) closeColorPicker();
});

// Neue leere Funktion hinzufügen und Eingabefeld fokussieren
function addFunction() {
  functions.push({ expr: '', color: COLORS[functions.length % COLORS.length], visible: true });
  renderFuncList(); syncParams(); syncAreaSelects();
  document.getElementById('func-list').lastChild?.querySelector('input')?.focus();
}

// Alles löschen (Funktionen, Punkte, Geraden, Einheitskreis-Punkte, Graph-Punkte)
function clearAll() {
  functions = []; params = {}; points = []; specials = []; graphPoints = []; unitCirclePts = []; linkedLines = [];
  line2ptPicking = false; line2ptPts = []; slopeTriPts = []; slopeTriPtsMap = {}; showArea = false; clearEvalCache();
  document.getElementById('area-toggle-btn').classList.remove('active-btn');
  document.getElementById('area-toggle-btn').textContent = t('btn_area');
  document.getElementById('area-result').textContent = '';
  renderFuncList(); renderPointList(); syncParams(); syncAreaSelects(); renderSpecialList(); scheduleDraw();
}

// View auf Standardbereich zurücksetzen
function resetView() { view = { xmin:-10, xmax:10, ymin:-6, ymax:6 }; syncInputs(); scheduleComputeSpecials(); scheduleDraw(); }

// Bereich aus den Eingabefeldern übernehmen
function applyRange() {
  view.xmin = parseFloat(document.getElementById('xmin').value) || view.xmin;
  view.xmax = parseFloat(document.getElementById('xmax').value) || view.xmax;
  view.ymin = parseFloat(document.getElementById('ymin').value) || view.ymin;
  view.ymax = parseFloat(document.getElementById('ymax').value) || view.ymax;
  scheduleComputeSpecials(); if (showArea) updateAreaResult(); scheduleDraw();
}

// Schreibt den aktuellen View in die Eingabefelder
function syncInputs() {
  document.getElementById('xmin').value = parseFloat(view.xmin.toFixed(4));
  document.getElementById('xmax').value = parseFloat(view.xmax.toFixed(4));
  document.getElementById('ymin').value = parseFloat(view.ymin.toFixed(4));
  document.getElementById('ymax').value = parseFloat(view.ymax.toFixed(4));
}

// Zoom um Faktor: factor<1 = reinzoomen, factor>1 = rauszoomen
// Zoom-Zentrum: Mitte des aktuellen Views
// Anpassen: factor=1/2 für aggressiveres Zoomen
function zoomBy(factor) {
  const cx = (view.xmin + view.xmax) / 2, cy = (view.ymin + view.ymax) / 2;
  const hw = (view.xmax - view.xmin) / 2 * factor, hh = (view.ymax - view.ymin) / 2 * factor;
  view.xmin = cx - hw; view.xmax = cx + hw; view.ymin = cy - hh; view.ymax = cy + hh;
  syncInputs(); scheduleComputeSpecials(); if (showArea) updateAreaResult(); scheduleDraw();
}

// Wird aufgerufen wenn isometrische Checkbox geändert wird
function onIsometricChange() { syncInputs(); scheduleDraw(); }

// Punkt-setzen-Modus (Klick ohne Alt setzt Punkt)
function togglePointMode() {
  pointMode = !pointMode; if (pointMode) { graphPtMode = false; line2ptPicking = false; deleteMode = false; }
  document.getElementById('point-mode-btn').classList.toggle('active-btn', pointMode);
  document.getElementById('graph-pt-btn').classList.remove('active-btn');
  document.getElementById('line2pt-btn').classList.remove('active-btn');
  document.getElementById('delete-mode-btn').classList.remove('active-btn');
  document.body.classList.remove('delete-mode');
  canvas.style.cursor = pointMode ? 'crosshair' : 'grab';
}

// Graph-Punkt-Modus (Klick legt Punkt auf nächste Kurve)
function toggleGraphPtMode() {
  graphPtMode = !graphPtMode; if (graphPtMode) { pointMode = false; line2ptPicking = false; deleteMode = false; }
  document.getElementById('graph-pt-btn').classList.toggle('active-btn', graphPtMode);
  document.getElementById('point-mode-btn').classList.remove('active-btn');
  document.getElementById('line2pt-btn').classList.remove('active-btn');
  document.getElementById('delete-mode-btn').classList.remove('active-btn');
  document.body.classList.remove('delete-mode');
  canvas.style.cursor = graphPtMode ? 'crosshair' : 'grab';
}

// Laserpointer-Modus: Maus/Stift/Touch zeigt großen roten Leuchtpunkt, kein Pan/Drag
function togglePointerMode() {
  pointerMode = !pointerMode;
  if (pointerMode) {
    pointMode = false; graphPtMode = false; deleteMode = false; line2ptPicking = false;
    document.getElementById('point-mode-btn').classList.remove('active-btn');
    document.getElementById('graph-pt-btn').classList.remove('active-btn');
    document.getElementById('delete-mode-btn').classList.remove('active-btn');
    document.body.classList.remove('delete-mode');
  } else {
    pointerPos = null;
  }
  document.getElementById('pointer-mode-btn').classList.toggle('active-btn', pointerMode);
  canvas.style.cursor = pointerMode ? 'none' : 'grab';
  scheduleDraw();
}

// Lösch-Modus: Klick auf beliebiges Objekt im Plot löscht es
function toggleDeleteMode() {
  deleteMode = !deleteMode;
  if (deleteMode) { pointMode = false; graphPtMode = false; line2ptPicking = false; }
  document.getElementById('delete-mode-btn').classList.toggle('active-btn', deleteMode);
  document.getElementById('point-mode-btn').classList.remove('active-btn');
  document.getElementById('graph-pt-btn').classList.remove('active-btn');
  document.getElementById('line2pt-btn').classList.remove('active-btn');
  document.body.classList.toggle('delete-mode', deleteMode);
  canvas.style.cursor = deleteMode ? 'crosshair' : 'grab';
}

// Versucht im Lösch-Modus ein Objekt an Position (mx, my) zu löschen.
// Priorität: freier Punkt → Graph-Punkt → Funktion (nächster Graph)
// Gibt true zurück wenn etwas gelöscht wurde.
function tryDeleteAt(mx, my) {
  // Freier Punkt?
  const pi = findNearPoint(mx, my);
  if (pi >= 0) { deletePoint(pi); pushHistory(); return true; }
  // Graph-Punkt?
  const gi = findNearGP(mx, my);
  if (gi >= 0) { graphPoints.splice(gi, 1); scheduleDraw(); return true; }
  // Funktion (nächster Graph innerhalb 20px vertikal)?
  const pt = fromCanvas(mx, my);
  let bestFi = -1, bestDist = 20;
  functions.forEach((fn, i) => {
    if (!fn.expr.trim() || fn.visible === false) return;
    const y = safeEval(fn.expr, pt.x); if (!isFinite(y)) return;
    const dist = Math.abs(toCanvas(pt.x, y).cy - my);
    if (dist < bestDist) { bestDist = dist; bestFi = i; }
  });
  if (bestFi >= 0) {
    graphPoints = graphPoints.filter(gp => gp.fi !== bestFi);
    graphPoints.forEach(gp => { if (gp.fi > bestFi) gp.fi--; });
    functions.splice(bestFi, 1);
    linkedLines = linkedLines.filter(ll => ll.fi !== bestFi);
    linkedLines.forEach(ll => { if (ll.fi > bestFi) ll.fi--; });
    if (activeInput?.fi === bestFi) activeInput = null;
    clearEvalCache(); renderFuncList(); syncParams(); syncAreaSelects(); scheduleComputeSpecials();
    if (showArea) updateAreaResult(); pushHistory(); scheduleDraw(); return true;
  }
  return false;
}

// Nachkommastellen-Einstellung übernehmen
function setPrecision() { precision = parseInt(document.getElementById('precision-sel').value); rerender(); }

// Alles neu berechnen und zeichnen (z.B. nach Einstellungsänderung)
function rerender() { scheduleComputeSpecials(); if (showArea) updateAreaResult(); scheduleDraw(); }

// Gibt zurück welcher Label-Modus aktiv ist: 'all', 'none', 'hover'
function getLabelMode() { return document.getElementById('label-mode').value; }

// Prüft ob ein Punkt-Typ durch die globalen Checkboxen sichtbar ist (für Sidebar-Liste)
function isKindVisible(kind) {
  const map = { max:'show-max', min:'show-min', inf:'show-inf', zero:'show-zero', yaxis:'show-yaxis', isect:'show-isect', asymp:'show-asymp' };
  const id = map[kind]; if (!id) return true;
  const el = document.getElementById(id); return el ? el.checked : true;
}

// Prüft ob ein spezieller Punkt angezeigt werden soll.
// Smart-Buttons steuern NUR den Lösungsweg-Panel und die Asymptoten-Linien —
// sie blenden KEINE anderen Punkte (z.B. Hochpunkt) aus.
// Die Sichtbarkeit der Punkte wird ausschliesslich durch isKindVisible() (globale Checkboxen) gesteuert.
function isPointActive(pt) {
  return true; // Punkte immer anzeigen; isKindVisible() filtert nach Typ
}

// ═══════════════════════════════════════════════════════════════════
// SMART-BUTTONS — Relevante Sonderpunkte direkt unter der Funktion
// ═══════════════════════════════════════════════════════════════════

// Konfiguration für jeden Punkt-Typ: Beschriftung, Farbe, Checkbox-ID
const SMART_BTN_CONFIG = {
  zero:  { label: 'Nullstellen',  color: '#92400e', checkId: 'show-zero'  },
  yaxis: { label: 'y-Achse',      color: '#BD10E0', checkId: 'show-yaxis' },
  max:   { label: 'Hochpunkt',    color: '#e24b4a', checkId: 'show-max'   },
  min:   { label: 'Tiefpunkt',    color: '#1D9E75', checkId: 'show-min'   },
  inf:   { label: 'Wendepunkt',   color: '#7F77DD', checkId: 'show-inf'   },
  asymp: { label: 'Asymptoten',   color: '#f59e0b', checkId: 'show-asymp' },
  isect: { label: 'Schnittpunkt', color: '#378ADD', checkId: 'show-isect' },
};
const SMART_BTN_ORDER = ['zero', 'yaxis', 'max', 'min', 'inf', 'asymp', 'isect'];

// Aktualisiert die Smart-Buttons für alle Funktionen basierend auf dem specials-Array.
// Wird nach computeSpecials() / renderSpecialList() und nach renderFuncList() aufgerufen.
function updateSmartButtons() {
  functions.forEach((fn, i) => {
    const container = document.getElementById(`smart-btns-${i}`);
    if (!container) return;
    container.innerHTML = '';
    if (!fn.expr || !fn.expr.trim() || fn.visible === false) return;

    // Welche Typen kommen für diese Funktion vor?
    const foundKinds = new Set();
    specials.forEach(sp => {
      if (sp.fi === i) {
        foundKinds.add(sp.kind);
        // Polstellen zählen als "Asymptoten"-Kategorie im Smart-Button
        if (sp.kind === 'pole') foundKinds.add('asymp');
      }
      if (sp.fj === i) foundKinds.add(sp.kind); // Schnittpunkte: für beide Funktionen
    });
    if (foundKinds.size === 0) return;

    SMART_BTN_ORDER.forEach(kind => {
      if (!foundKinds.has(kind)) return;
      const cfg = SMART_BTN_CONFIG[kind];
      if (!cfg) return;

      const key = `${i}:${kind}`;
      const isActive = activeSpecials.has(key);

      const btn = document.createElement('button');
      btn.className = 'smart-btn' + (isActive ? ' sb-active' : '');
      btn.textContent = cfg.label;
      btn.style.borderColor = cfg.color;
      btn.title = `${cfg.label} für f${i+1} ${isActive ? 'ausblenden' : 'einblenden'}`;
      if (isActive) {
        btn.style.background = cfg.color;
        btn.style.color = '#fff';
      } else {
        btn.style.color = cfg.color;
        btn.style.background = 'transparent';
      }

      btn.onclick = () => {
        if (kind === 'asymp') {
          // Asymptoten: Linien ein-/ausblenden (toggle) + Lösungsweg-Tooltip
          const wasActive = activeSpecials.has(key);
          if (wasActive) activeSpecials.delete(key); else activeSpecials.add(key);
          updateSmartButtons();
          scheduleDraw();
          // Tooltip: beim Aktivieren ersten Lösungsweg zeigen, beim Deaktivieren schliessen
          const tooltip = document.getElementById('solve-tooltip');
          const activePt = window._activeTooltipPt;
          const tooltipIsThisAsymp = tooltip && tooltip.style.display !== 'none' &&
                                     activePt && activePt.fi === i &&
                                     (activePt.kind === 'asymp' || activePt.kind === 'pole');
          if (wasActive) {
            if (tooltipIsThisAsymp && typeof hideSolveTooltip === 'function') hideSolveTooltip();
          } else {
            const pts = specials.filter(sp => sp.fi === i && (sp.kind === 'asymp' || sp.kind === 'pole'));
            if (pts.length > 0 && typeof showSolveTooltip === 'function') showSolveTooltip(pts);
          }
        } else {
          // Alle anderen Typen: Lösungsweg-Tooltip für ersten sichtbaren Punkt öffnen
          // – zweiter Klick auf denselben Knopf: Tooltip wieder schliessen (Toggle)
          const tooltip = document.getElementById('solve-tooltip');
          const already = tooltip && tooltip.style.display !== 'none' &&
                          window._activeTooltipPt && window._activeTooltipPt.fi === i &&
                          window._activeTooltipPt.kind === kind;
          if (already) { if (typeof hideSolveTooltip === 'function') hideSolveTooltip(); return; }

          // activeSpecials toggeln für Canvas-Markierung
          if (activeSpecials.has(key)) activeSpecials.delete(key); else activeSpecials.add(key);
          updateSmartButtons();
          scheduleDraw();

          const pts = specials.filter(sp => sp.fi === i && sp.kind === kind);
          if (pts.length === 0) return;
          // Bevorzuge sichtbaren Punkt; Fallback: erster
          const pt = pts.find(p =>
            p.x >= view.xmin && p.x <= view.xmax &&
            p.y >= view.ymin && p.y <= view.ymax
          ) || pts[0];
          if (typeof showSolveTooltip === 'function') showSolveTooltip(pt);
        }
      };
      container.appendChild(btn);
    });

    // Solve-Panel leeren — Lösungswege erscheinen als Tooltip (Canvas-Overlay)
    const solvePanel = document.getElementById(`solve-panel-${i}`);
    if (solvePanel) solvePanel.innerHTML = '';
  });
}

// ═══════════════════════════════════════════════════════════════════
// LÖSUNGSWEG-TOOLTIP — erscheint oben rechts im Canvas
// ═══════════════════════════════════════════════════════════════════

// pts: einzelner Punkt ODER Array von Punkten (z.B. alle Asymptoten einer Funktion)
function showSolveTooltip(pts) {
  const tooltip = document.getElementById('solve-tooltip');
  const titleEl = document.getElementById('solve-tooltip-title');
  const content = document.getElementById('solve-tooltip-content');
  if (!tooltip || !titleEl || !content) return;

  const ptsArr = Array.isArray(pts) ? pts : [pts];
  if (ptsArr.length === 0) return;
  const pt = ptsArr[0];
  const fn = functions[pt.fi];

  const kindNames = {
    max: t('solve_max'), min: t('solve_min'), inf: t('solve_inf'),
    zero: t('solve_zero'), yaxis: t('solve_yaxis_sect'),
    isect: t('solve_isect'), asymp: t('solve_asymp'), pole: t('solve_pole')
  };

  // Titel: bei mehreren Punkten nur Art + Funktionsnummer, ohne Koordinate
  if (ptsArr.length > 1) {
    titleEl.innerHTML = `f<sub>${pt.fi+1}</sub>&thinsp;Asymptoten`;
  } else {
    let coordStr = '';
    if (pt.kind === 'asymp') {
      if (pt.oblique) {
        const sS = Math.abs(pt.slope-1)<1e-5?'':Math.abs(pt.slope+1)<1e-5?'−':niceNum(pt.slope)+'·';
        const bS = Math.abs(pt.intercept)<1e-5?'':(pt.intercept>0?` + ${niceNum(pt.intercept)}`:` − ${niceNum(Math.abs(pt.intercept))}`);
        coordStr = `y = ${sS}x${bS}`;
      } else { coordStr = `y = ${niceNum(pt.y)}`; }
    } else if (pt.kind === 'pole') {
      coordStr = `x = ${niceNum(pt.x)}`;
    } else {
      coordStr = pt.exactLabel || niceCoord(pt.x, pt.y);
    }
    titleEl.innerHTML = `f<sub>${pt.fi+1}</sub>&thinsp;${kindNames[pt.kind] || pt.kind}&ensp;<span style="font-weight:400;opacity:0.75">${coordStr}</span>`;
  }
  titleEl.style.color = fn ? fn.color : '';

  // Inhalt: alle Punkte mit Trennlinie
  if (ptsArr.length === 1) {
    content.innerHTML = generateSolveSteps(pt);
  } else {
    content.innerHTML = ptsArr.map((p, idx) => {
      const divider = idx > 0 ? `<div style="border-top:1px solid var(--border);margin:6px 0 4px;"></div>` : '';
      return divider + generateSolveSteps(p);
    }).join('');
  }

  window._activeTooltipPt = pt;
  tooltip.style.display = 'block';
}

function hideSolveTooltip() {
  const tooltip = document.getElementById('solve-tooltip');
  if (tooltip) tooltip.style.display = 'none';
  window._activeTooltipPt = null;
}

// ═══════════════════════════════════════════════════════════════════
// FUNKTIONS-LABEL-OVERLAY — HTML-Box oben rechts im Canvas
// Zeigt formatierte Ausdrücke (Brüche, Exponenten) statt Canvas-Text
// ═══════════════════════════════════════════════════════════════════
function updateFuncLabelsOverlay() {
  const el = document.getElementById('func-labels-overlay');
  if (!el) return;
  const show = document.getElementById('chk-funclabels')?.checked !== false;
  if (!show) { el.style.display = 'none'; return; }

  const rows = functions
    .map((fn, i) => ({ fn, i }))
    .filter(({ fn }) => fn.expr && fn.expr.trim() && fn.visible !== false);

  if (rows.length === 0) { el.style.display = 'none'; return; }

  el.innerHTML = rows.map(({ fn, i }) => {
    // Parameterwerte einsetzen + vereinfachen, dann als HTML formatieren
    const substituted = typeof exprWithValues === 'function'
      ? exprWithValues(fn.expr)
      : (typeof exprToDisplayStr === 'function' ? exprToDisplayStr(fn.expr) : fn.expr);
    const html = typeof exprToHtml === 'function' ? exprToHtml(substituted) : substituted;
    let domainSuffix = '';
    if (fn.domainMin != null || fn.domainMax != null) {
      const dlo = fn.domainMin != null ? fn.domainMin : '−∞';
      const dhi = fn.domainMax != null ? fn.domainMax : '+∞';
      domainSuffix = `<span style="font-size:0.85em;opacity:0.7;">&thinsp;, x ∈ [${dlo}, ${dhi}]</span>`;
    }
    return `<div class="flo-row">
      <span class="flo-dot" style="background:${fn.color};"></span>
      <span class="flo-expr">f<sub>${i+1}</sub>(x) = ${html}${domainSuffix}</span>
    </div>`;
  }).join('');
  el.style.display = 'block';
}

