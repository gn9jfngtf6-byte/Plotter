// ═══════════════════════════════════════════════════════════════════
// MODUL 14: MathInput — robuster Konverter zwischen MathLive (ASCIIMath/
// LaTeX) und dem Rohausdruck-Format des Plotters.
//
// Statt Regex-Ketten wird ein kleiner, korrekter Parser verwendet:
// Text → Tokens → AST → Zieltext. Das ist robust gegenüber beliebiger
// Verschachtelung (Brüche in Brüchen, Klammern in Klammern, ...), was
// mit reinen Regex-Ersetzungen strukturell nicht zuverlässig möglich ist.
// ═══════════════════════════════════════════════════════════════════

// BUG (Nutzer-Meldung, September 2026): "^2 wird zu \2" -- reproduzierbar in
// JEDEM Eingabefeld, SOFORT beim Tippen. Per Konsolen-Diagnose direkt beim
// Nutzer (nicht nur vermutet -- tatsächlich gemessen) geklärt:
//
//   COMPOSITIONSTART  {data:""}
//   COMPOSITIONUPDATE {data:"^"}
//   BEFOREINPUT       {data:"^", inputType:"insertCompositionText"}   <- Vorschau
//   KEYDOWN           {key:"Dead", code:"Equal", isComposing:true}
//   BEFOREINPUT       {data:null, inputType:"deleteCompositionText"}  <- Vorschau löschen
//   BEFOREINPUT       {data:"^", inputType:"insertFromComposition"}   <- ENDGÜLTIGE Eingabe
//   COMPOSITIONEND    {data:"^"}
//   KEYDOWN           {key:"2", code:"Digit2"}
//   BEFOREINPUT       {data:"2", inputType:"insertText"}
//
// "^" ist auf dieser Tastatur also technisch eine "tote"/kombinierende Taste
// (macOS-Zirkumflex, meist zum Bilden von ê/â gedacht) -- auch wenn sie sich
// für den Nutzer wie ein normaler, sofortiger Tastendruck anfühlt. Das
// Zeichen kommt deshalb NIE als normaler "keydown mit key:'^'" an (das hätte
// der frühere Fix unten abgefangen), sondern ausschliesslich über diesen
// mehrstufigen Kompositions-Mechanismus, zuletzt als "insertFromComposition".
// MathLive interpretiert offenbar nur Zeichen, die über den einfachen
// "insertText"-Weg ankommen, als Tastenkürzel (^ -> Hochstellung); über
// "insertFromComposition" ankommende Zeichen werden dagegen ganz offenbar nur
// als reiner (literaler) Text eingefügt -- das erklärt exakt das beobachtete
// Verhalten: "^" erscheint zunächst wie ein normales Zeichen, "2" danach
// landet als literaler Folgetext dahinter, sichtbar als "\2" (das "\" dürfte
// aus einer internen Fallback-Darstellung für dieses nicht interpretierte
// Zeichen stammen).
//
// (Ein früherer Versuch, das Problem über MathLive.setKeyboardLayoutLocale()
// zu beheben, war NICHT die Ursache und wurde wieder entfernt -- er erzeugte
// beim Nutzer sogar einen zusätzlichen, nutzlosen Konsolenfehler "Invalid
// keybindings for current keyboard layout".)
//
// Fix, Version 2 (Version 1 -- nur die "beforeinput"/"input"-Nachkorrektur
// unten -- hat das Problem laut Nutzer-Rückmeldung NICHT vollständig gelöst:
// statt "\2" erschien danach eine verschachtelte Doppel-Hochstellung, "2"
// als winziger Exponent OBEN AN "^" selbst statt an "x". Grund: preventDefault()
// auf dem "beforeinput" (insertFromComposition) greift auf diesem Browser
// offenbar NICHT zuverlässig, sodass zusätzlich zu unserer eigenen
// Hochstellung noch ein literales "^" landete -- und DARAUF baute die
// "input"-Nachkorrektur eine ZWEITE, verschachtelte Hochstellung).
//
// Version 2 setzt stattdessen so früh wie möglich an: bereits beim
// ALLERERSTEN "keydown" mit key:"Dead" (dem Start der Komposition) wird
// abgefangen und preventDefault() aufgerufen -- das verhindert im Idealfall,
// dass die ganze mehrstufige Kompositions-Sequenz (siehe oben) überhaupt
// erst losläuft. Da dies ein reines MATHEMATIK-Eingabefeld ist, in dem echte
// Akzentbuchstaben (é, ñ, ü als Fliesstext) praktisch nie vorkommen, wird
// JEDE "Dead"-Taste innerhalb eines math-field als "^" behandelt -- das ist
// für diesen Anwendungsfall ein sicherer, eng genug gefasster Kompromiss.
// Die spätere "beforeinput"/"input"-Nachkorrektur bleibt zusätzlich als
// Sicherheitsnetz bestehen (falls preventDefault() auf dem "Dead"-keydown
// die Komposition doch nicht stoppt), verzichtet dann aber -- über ein
// Flag pro Feld -- bewusst auf eine ZWEITE Hochstellung, falls der
// "Dead"-Abfang oben bereits gehandelt hat, und räumt in diesem Fall nur
// noch ein eventuell zusätzlich eingefügtes literales "^" wieder weg.
// Fix, Version 6 -- ROOT CAUSE DES SCHWARZEN KASTENS GEFUNDEN (per Konsolen-
// Diagnose beim Nutzer: kompletter interner Shadow-DOM-Inhalt des Feldes
// direkt nach dem Bug). Es ist weder ein natives Betriebssystem-Overlay
// (Versionen 3/4 haben das fälschlich vermutet) noch ein zusätzliches,
// gespeichertes Zeichen im exportierten LaTeX. Es ist ein echtes, aber
// VERWAISTES MathLive-internes Element:
//
//   <span class="ML__mathit">x</span>
//   <span class="ML__composition">^</span>   <-- genau das ist der Kasten
//   <span class="ML__msubsup">...2...</span>
//
// MathLive legt bei jedem "compositionupdate" intern einen eigenen
// "CompositionAtom" (Klasse "ML__composition", dafür siehe die CSS-Variable
// "--_composition-background-color" -- daher die dunkle Hintergrundfarbe)
// als Vorschau an der Cursor-Position an (Quelle: updateComposition() in
// MathLives editor-model/composition.ts). Bei "compositionend" entfernt
// MathLive ihn eigentlich wieder -- ABER nur, wenn das Atom an der
// AKTUELLEN Cursor-Position noch genau dieser CompositionAtom ist
// (removeComposition() prüft exakt das). Unser Fix ruft aber schon VORHER,
// direkt im "Dead"-keydown-Handler, moveToSuperscript() auf -- das bewegt
// den Cursor bereits in die neu erzeugte Hochstellung hinein. Wenn später
// (nach unserem Eingriff) trotzdem noch ein "compositionend" nachkommt,
// zeigt der Cursor dann nicht mehr auf den CompositionAtom, MathLives eigene
// Aufräum-Logik greift ins Leere, und der CompositionAtom bleibt für immer
// als Karteileiche im Modell hängen -- sichtbar als der schwarze Kasten.
//
// Der Fix: BEVOR wir in die Hochstellung wechseln, selbst prüfen, ob an der
// aktuellen Cursor-Position gerade ein CompositionAtom sitzt (er wurde durch
// das vorausgehende "compositionupdate" ja bereits eingefügt, siehe die
// gemessene Ereignis-Reihenfolge oben) -- und falls ja, ihn zuerst selbst
// entfernen (per "deleteBackward", da er exakt an der Cursor-Position sitzt
// -- das ist die öffentliche API-Entsprechung dessen, was MathLive intern
// bei "compositionend" auch tun würde). Erst danach in die Hochstellung
// wechseln. Die Prüfung, ob es das Element WIRKLICH gibt, ist wichtig,
// damit wir NIE versehentlich ein echtes, bereits getipptes Zeichen löschen,
// falls die Kompositions-Vorschau in einem Randfall doch noch nicht angelegt
// wurde.
function _mlRemovePendingCompositionAtom(mf) {
  // ANLAUF 1 (fehlgeschlagen, Nutzer-Rückmeldung "immer noch gleich"): Prüfung
  // über "mf.shadowRoot.querySelector('.ML__composition')" -- das gerenderte
  // Markup. Grund für den Fehlschlag, per Quellcode-Analyse gefunden:
  // MathLive rendert nach "compositionupdate" NICHT sofort synchron, sondern
  // nur verzögert über requestAnimationFrame (Funktion "requestUpdate()" in
  // MathLives Quellcode). Zum Zeitpunkt unseres "Dead"-keydown-Handlers (der
  // unmittelbar synchron danach läuft) stand das ".ML__composition"-Element
  // im Shadow-DOM also noch gar nicht -- die Prüfung fand deshalb IMMER
  // nichts und griff nie ein.
  //
  // ANLAUF 2: stattdessen direkt das interne Datenmodell abfragen (das wird
  // von "updateComposition()" SOFORT synchron aktualisiert, unabhängig vom
  // verzögerten Rendering). "mf.model" selbst ist von aussen nicht
  // zugänglich (liefert "undefined") -- aber "mf._mathfield.model" ist es
  // (per Test bestätigt: "_mathfield" ist zwar mit Unterstrich als intern
  // markiert, aber nicht wirklich privat/verborgen). Darüber lässt sich exakt
  // wie in MathLives eigener "removeComposition()"-Funktion prüfen, ob das
  // Atom an der aktuellen Cursor-Position gerade eine Kompositions-Vorschau
  // ist -- und falls ja, sie per "deleteBackward" entfernen, bevor wir in die
  // Hochstellung wechseln.
  try {
    const model = mf._mathfield && mf._mathfield.model;
    const atom = model && typeof model.at === 'function' ? model.at(model.position) : null;
    if (atom && atom.type === 'composition') {
      mf.executeCommand('deleteBackward');
      return true;
    }
  } catch (ex) { /* defensiv */ }
  return false;
}
// Steht das Feld gerade im LaTeX-Modus (der Nutzer hat "\\" getippt und schreibt z.B. gerade
// "\\frac{x^2")? Dann ist "^" ein ganz normales LaTeX-Zeichen und darf NICHT in eine
// Hochstellung umgewandelt werden — sonst wird das Zeichen verschluckt, die "2" landet
// als gewöhnlicher Text neben dem "x" und der Befehl lässt sich nicht mehr sauber abschliessen.
function _mlInLatexMode(mf) {
  try {
    if (mf.mode === 'latex') return true;
    const model = mf._mathfield && mf._mathfield.model;
    let atom = model && typeof model.at === 'function' ? model.at(model.position) : null;
    // Eine laufende Kompositions-Vorschau (macOS-Tottaste "^") sitzt als eigenes Atom am Cursor -- ihr
    // Modus ist nicht verlässlich; massgeblich ist das Atom davor.
    if (atom && atom.type === 'composition') atom = model.at(model.position - 1);
    return !!(atom && (atom.mode === 'latex' || atom.type === 'latex' || atom.type === 'latexgroup'));
  } catch (ex) { return false; }
}
function _mlHandleCaret(mf, isDeadCaret) {
  try {
    if (isDeadCaret) _mlRemovePendingCompositionAtom(mf);
    if (_mlInLatexMode(mf)) mf.executeCommand(['typedText', '^']);   // literales Zeichen im LaTeX-Text
    else mf.executeCommand('moveToSuperscript');
  } catch (ex) { /* defensiv */ }
}
// ───────────── Komfort im LaTeX-Modus (Eingabe von "\sin(x)", "\pi", "\cdot" … per Tastatur) ─────────────
// MathLive beendet den LaTeX-Modus von sich aus nur bei Leerzeichen/Enter oder wenn eine Klammerstruktur
// wie \frac{…}{…} vollständig ist. Wer "\ln(x)" oder "\pi+1" tippt, bliebe sonst im LaTeX-Text stecken
// (Ausdruck bleibt unausgewertet bzw. wird falsch gelesen). Darum: steht im LaTeX-Text genau EIN fertiges
// Kommando OHNE Argumente (\ln, \sin, \pi, \cdot …) und kommt ein Zeichen, das das Kommando beendet
// (Klammer, Ziffer, Operator, Hoch-/Tiefstellung …), wird das Kommando zuerst abgeschlossen.
const ML_NOARG_CMDS = new Set(['sin','cos','tan','cot','sec','csc','arcsin','arccos','arctan','sinh','cosh','tanh','coth',
  'ln','log','lg','exp','abs','min','max','pi','cdot','times','div','pm','infty','alpha','beta','gamma','delta','epsilon',
  'varepsilon','theta','vartheta','lambda','mu','sigma','tau','phi','varphi','omega','rho','eta','kappa','nu','psi','chi','xi','zeta',
  'Delta','Gamma','Sigma','Omega','Theta','Phi','Pi','Lambda','Psi','le','leq','ge','geq','ne','neq','approx','ldots','dots','cdots',
  'ast','star','circ','bullet','lt','gt','to','rightarrow','Rightarrow','in','cap','cup','subset','subseteq','mid','sim','equiv']);
function _mlLatexZoneText(mf) {
  try {
    const mm = mf._mathfield.model, a = mm.at(mm.position);
    if (!a || a.mode !== 'latex') return null;
    return mm.atoms.filter(x => x.parent === a.parent && x.type === 'latex').map(x => x.value).join('');
  } catch (ex) { return null; }
}
document.addEventListener('keydown', function (e) {
  if (e.defaultPrevented || e.metaKey || (e.ctrlKey && !e.altKey)) return;   // Alt allein: auf dem Mac nötig für \ { } | [ ]
  if (!e.key || e.key.length !== 1 || /[A-Za-z\s{}\[\]]/.test(e.key)) return;   // Buchstaben/Leerzeichen/Klammern des Befehls selbst: MathLive; ein "\" dagegen beendet das vorige Kommando
  const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
  const mf = path.find(n => n && n.tagName === 'MATH-FIELD');
  if (!mf || mf.mode !== 'latex') return;
  const T = _mlLatexZoneText(mf);
  const m = T && /^\\([A-Za-z]+)$/.exec(T);
  if (m && ML_NOARG_CMDS.has(m[1])) { try { mf.executeCommand('complete'); } catch (ex) { /* defensiv */ } }
}, true);
// \left( … \right) : nach dem schliessenden Begrenzer ist der Ausdruck vollständig
document.addEventListener('input', function (e) {
  const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
  const mf = path.find(n => n && n.tagName === 'MATH-FIELD');
  if (!mf || mf.mode !== 'latex') return;
  const T = _mlLatexZoneText(mf);
  if (T && /\\right[)\]|.]$/.test(T) && (T.match(/\\left/g) || []).length === (T.match(/\\right/g) || []).length) {
    try { mf.executeCommand('complete'); } catch (ex) { /* defensiv */ }
  }
}, true);

// ───────────── Weitere Robustheit des Eingabefelds ─────────────
// (a) Störende MathLive-Kürzel entfernen: Wer "dx", "ee", "mm", "log" … tippt, will in diesem Programm
//     fast nie ein Differential, die imaginäre Einheit, eine Einheit oder einen Logarithmus mit Platzhalter-
//     Basis, sondern Variablen/Parameter bzw. einen normalen Logarithmus. Wird beim ersten Fokus je Feld gesetzt.
const ML_DROP_SHORTCUTS = ['ee', 'ii', 'jj', 'dx', 'dy', 'dt', 'sint', 'xin', 'in', 'of', 'mod', '(mod', 'del', 'deg',
  'mm', 'cm', 'km', 'kg', 'ft', 'inch', 'mi', 'oo', 'xx', 'ch', 'sh', 'th', 'tg', 'ctg', 'cth', 'lb', '@', '//', '||', 'sub', 'sup', 'or', 'and', 'not', 'union'];
function _mlPatchShortcuts(mf) {
  if (!mf || mf.__mlShortcutsPatched) return;
  mf.__mlShortcutsPatched = true;
  try {
    const cur = mf.inlineShortcuts;
    if (!cur) return;
    const sc = Object.assign({}, cur);
    ML_DROP_SHORTCUTS.forEach(k => { delete sc[k]; });
    sc.log = '\\log';          // statt "\log_{#?}": log(x) und log_2(x) müssen beide natürlich tippbar sein
    mf.inlineShortcuts = sc;
  } catch (ex) { /* defensiv */ }
}
function _mlFieldFromEvent(e) {
  const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
  return path.find(n => n && n.tagName === 'MATH-FIELD') || null;
}
document.addEventListener('focusin', function (e) { _mlPatchShortcuts(_mlFieldFromEvent(e)); }, true);

// (b) Hoch-/Tiefstellung: Informationen zur aktuellen Cursor-Position
function _mlBranchInfo(mf) {
  try {
    const m = mf._mathfield.model, a = m.at(m.position);
    if (!a || (a.parentBranch !== 'superscript' && a.parentBranch !== 'subscript') || !a.parent) return null;
    const list = a.parent.branch(a.parentBranch) || [];
    const content = list.filter(x => x.type !== 'first' && x.type !== 'placeholder');
    return { branch: a.parentBranch, owner: a.parent, count: content.length, atEnd: list[list.length - 1] === a };
  } catch (ex) { return null; }
}
function _mlStop(e) {
  e.preventDefault(); e.stopPropagation();
  if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
}
function _mlBraceReset(mf) {
  mf.__mlBraceDepth = 0;
  try { mf.smartSuperscript = true; } catch (ex) { /* defensiv */ }
}
// Geschweifte Klammern im Math-Modus: "x^{2}", "e^{-x}", "x^{x^{2}}", "\log_{10}". "{" direkt am Anfang
// einer Hoch-/Tiefstellung öffnet eine Gruppe (kein Auto-Austritt nach der ersten Ziffer mehr), "}" verlässt sie.
// Überall sonst werden { und } verschluckt (sie würden sonst als \lbrace/\rbrace im Ausdruck landen).
document.addEventListener('keydown', function (e) {
  if (e.defaultPrevented || e.isComposing || !e.key || e.key.length !== 1) return;
  if (e.metaKey || (e.ctrlKey && !e.altKey)) return;          // Alt allein ist auf dem Mac nötig, um { } \ | [ ] zu tippen
  const mf = _mlFieldFromEvent(e);
  if (!mf) return;
  const k = e.key;
  if (_mlInLatexMode(mf)) {
    // Leerzeichen innerhalb einer noch offenen Klammer (\frac{\sin x}{…}) beendet den LaTeX-Text NICHT.
    if (k === ' ') {
      const T = _mlLatexZoneText(mf);
      if (T && (T.match(/\{/g) || []).length > (T.match(/\}/g) || []).length) {
        _mlStop(e);
        try { mf.executeCommand(['typedText', ' ']); } catch (ex) { /* defensiv */ }
      }
    }
    return;
  }
  const info = _mlBranchInfo(mf);
  if (k === '{') {
    _mlStop(e);
    if (info && info.count === 0) {
      mf.__mlBraceDepth = (mf.__mlBraceDepth || 0) + 1;
      try { mf.smartSuperscript = false; } catch (ex) { /* defensiv */ }
    }
    return;
  }
  if (k === '}') {
    _mlStop(e);
    if (info) {
      try { mf.executeCommand('moveAfterParent'); } catch (ex) { /* defensiv */ }
      mf.__mlBraceDepth = Math.max(0, (mf.__mlBraceDepth || 0) - 1);
      if (!mf.__mlBraceDepth) _mlBraceReset(mf);
    }
    return;
  }
  // Funktionsnamen (sin, cos, log …) mit Hoch-/Tiefstellung: "sin^2(x)" bzw. "log_2(x)" — nach der
  // ersten Ziffer/dem ersten Zeichen im Exponenten/Index endet dieser bei "(" oder einem Buchstaben.
  if (info && /^(mop|operator|operatorname|mopover)$/.test(info.owner.type) && !(mf.__mlBraceDepth > 0) && info.count > 0 && info.atEnd &&
      (k === '(' || /[A-Za-z]/.test(k))) {
    try { mf.executeCommand('moveAfterParent'); } catch (ex) { /* defensiv */ }
  }
}, true);
// Klammer-Zustand zurücksetzen, sobald der Cursor die Hoch-/Tiefstellung verlassen hat bzw. das Feld den Fokus verliert
function _mlSyncBraces(mf) {
  if (mf && mf.__mlBraceDepth && !_mlBranchInfo(mf)) _mlBraceReset(mf);
}
['input', 'keyup', 'click'].forEach(ev => document.addEventListener(ev, function (e) { _mlSyncBraces(_mlFieldFromEvent(e)); }, true));
// Beim Verlassen des Feldes einen noch offenen LaTeX-Text abschließen, damit er nicht als "\frac{…" stehen bleibt
document.addEventListener('focusout', function (e) {
  const mf = _mlFieldFromEvent(e);
  if (!mf) return;
  _mlBraceReset(mf);
  try { if (_mlInLatexMode(mf)) mf.executeCommand('complete'); } catch (ex) { /* defensiv */ }
}, true);

document.addEventListener('keydown', function (e) {
  if (e.defaultPrevented) return;
  const isCaret = e.key === '^';
  const isDeadCaret = e.key === 'Dead';
  if (!isCaret && !isDeadCaret) return;
  const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
  const mf = path.find(n => n && n.tagName === 'MATH-FIELD');
  if (!mf) return;
  // Im LaTeX-Modus ist "^" ein ganz normales Textzeichen: weder die normale Taste noch die macOS-Tottaste
  // wird abgefangen -- MathLive fügt das Zeichen (auch aus der Komposition) selbst literal in den LaTeX-Text ein.
  if (_mlInLatexMode(mf)) return;
  // Andere Tottasten (´ ` ¨ ~ …) sind kein Hochzeichen. Safari meldet das Zeichen der Tottaste schon VOR
  // diesem keydown (compositionupdate) → dann hier gar nicht eingreifen.
  if (isDeadCaret && mf.__mlCompAt && Date.now() - mf.__mlCompAt < 250 && ML_OTHER_DEAD.test(mf.__mlCompData || '')) return;
  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  // Normale Taste "^" direkt nach einer bereits behandelten Tottaste: das ist nur deren Abschluss
  // (Windows/Firefox: Tottaste + Leertaste liefert "^" als eigene Taste) → keine zweite Hochstellung.
  if (isCaret && _mlDeadPending(mf)) { mf.__mlDeadAt = 0; return; }
  // Stand vor dem Eingriff merken: Chrome/Edge melden das Zeichen der Tottaste erst NACH diesem keydown.
  if (isDeadCaret) { try { mf.__mlDeadUndo = { latex: mf.getValue('latex'), pos: mf.position, at: Date.now() }; } catch (ex) { mf.__mlDeadUndo = null; } }
  _mlHandleCaret(mf, isDeadCaret);
  if (isDeadCaret) { mf.__mlDeadCaretHandled = true; mf.__mlDeadAt = Date.now(); _mlPatchDeadCaret(mf); }
}, true);
// Jede Tottaste meldet sich als key:"Dead" — welche es war, steht erst im compositionupdate. Ist es sicher
// KEIN Zirkumflex (Akut, Gravis, Trema, Tilde, Apostroph/Anführungszeichen der US-International-Belegung …),
// wird die eben geöffnete Hochstellung zurückgenommen; das Zeichen läuft dann normal durch MathLive.
// Der Weg der Taste "^" selbst bleibt unverändert (nur ausdrücklich erkannte ANDERE Zeichen lösen das aus).
const ML_OTHER_DEAD = /^[\u00b4`\u00a8~\u02c7\u00b0\u02d8\u00b8\u02dd\u02db\u02d9\u00af'"\u0300\u0301\u0303\u0308\u030c]/;
document.addEventListener('compositionupdate', function (e) {
  const mf = _mlFieldFromEvent(e);
  if (!mf) return;
  const d = e.data || '';
  mf.__mlCompData = d; mf.__mlCompAt = Date.now();
  if (!d || !ML_OTHER_DEAD.test(d)) return;
  const u = mf.__mlDeadUndo;
  mf.__mlDeadUndo = null;
  if (!u || Date.now() - u.at > 1500) return;
  mf.__mlDeadAt = 0; mf.__mlDeadCaretHandled = false;
  try {
    if (mf.getValue('latex') !== u.latex) mf.setValue(u.latex, { silenceNotifications: true });
    mf.position = u.pos;
  } catch (ex) { /* defensiv */ }
}, true);
document.addEventListener('compositionend', function (e) {
  const mf = _mlFieldFromEvent(e);
  if (mf) { mf.__mlCompData = ''; mf.__mlCompAt = 0; }
}, true);
// Windows (Chrome/Edge): Die Tottaste "^" startet die Komposition erst NACH unserem keydown-Abfang. Die
// Komposition endet dann mit "^" bzw. "^2" (Tottaste + Ziffer), und MathLive tippt diesen Text nach —
// das "^" darin erzeugte eine ZWEITE, verschachtelte Hochstellung (x^{^2}). Darum: Text, der unmittelbar
// nach einer schon behandelten Tottaste ankommt, verliert sein führendes "^".
function _mlDeadPending(mf) { return !!(mf && mf.__mlDeadAt && Date.now() - mf.__mlDeadAt < 4000); }
function _mlStripDead(mf, text) {
  if (typeof text !== 'string' || text[0] !== '^' || !_mlDeadPending(mf) || _mlInLatexMode(mf)) return text;
  mf.__mlDeadAt = 0;
  return text.slice(1);
}
function _mlPatchDeadCaret(mf) {
  const M = mf && mf._mathfield;
  if (!M || M.__mlDeadPatched) return;
  M.__mlDeadPatched = true;
  try {
    const ce = M.onCompositionEnd, oi = M.onInput;
    if (typeof ce === 'function') M.onCompositionEnd = function (c) { return ce.call(this, _mlStripDead(mf, c)); };
    if (typeof oi === 'function') M.onInput = function (t) { const s = _mlStripDead(mf, t); return s === '' ? undefined : oi.call(this, s); };
  } catch (ex) { /* defensiv */ }
}
// Jede andere Taste beendet das Zeitfenster der Tottaste (danach ist "^" wieder eine neue Hochstellung).
document.addEventListener('keyup', function (e) {
  if (!e.key || e.key === 'Dead' || e.key === '^' || e.key === 'Process' || e.key.length !== 1) return;
  const mf = _mlFieldFromEvent(e);
  if (mf && mf.__mlDeadAt && !e.isComposing) setTimeout(() => { mf.__mlDeadAt = 0; }, 0);
}, true);

document.addEventListener('beforeinput', function (e) {
  if (e.inputType !== 'insertFromComposition' || e.data !== '^') return;
  const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
  const mf = path.find(n => n && n.tagName === 'MATH-FIELD');
  if (!mf) return;
  if (_mlInLatexMode(mf)) return;   // LaTeX-Text: "^" bleibt ein literales Zeichen (siehe keydown-Handler)
  const alreadyHandled = !!mf.__mlDeadCaretHandled;
  mf.__mlDeadCaretHandled = false;
  e.preventDefault();
  if (e.defaultPrevented) {
    // Browser hat die Einfügung tatsächlich abgebrochen.
    if (!alreadyHandled) _mlHandleCaret(mf);
    // sonst: der "Dead"-keydown-Abfang oben hat schon alles erledigt.
  } else {
    // preventDefault() wirkungslos -- Korrektur nachholen, sobald das
    // "input"-Ereignis bestätigt, dass das Zeichen trotzdem eingefügt wurde.
    mf.__mlPendingCaretFixMode = alreadyHandled ? 'cleanup-only' : 'full';
  }
}, true);
// Sicherheitsnetz: Kam im LaTeX-Text ein "^" per Tottaste (Komposition), ist aber danach nicht im Text gelandet,
// wird es hier nachgetragen.
document.addEventListener('compositionend', function (e) {
  if (e.data !== '^') return;
  const mf = _mlFieldFromEvent(e);
  if (!mf || !_mlInLatexMode(mf)) return;
  setTimeout(function () {
    try {
      const T = _mlLatexZoneText(mf);
      if (T != null && !/\^$/.test(T)) mf.executeCommand(['typedText', '^']);
    } catch (ex) { /* defensiv */ }
  }, 0);
}, true);
document.addEventListener('input', function (e) {
  const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
  const mf = path.find(n => n && n.tagName === 'MATH-FIELD');
  if (!mf || !mf.__mlPendingCaretFixMode) return;
  const mode = mf.__mlPendingCaretFixMode;
  mf.__mlPendingCaretFixMode = null;
  // Das eben zusätzlich eingefügte literale "^" wieder entfernen -- entweder
  // um danach ("full") sauber selbst in die Hochstellung zu wechseln, oder
  // ("cleanup-only") nur das Überbleibsel neben einer bereits vom
  // "Dead"-Abfang oben korrekt erstellten Hochstellung wegzuräumen.
  try { mf.executeCommand('deleteBackward'); } catch (ex) { /* defensiv */ }
  if (mode === 'full') _mlHandleCaret(mf);
}, true);

// BUG (Nutzer-Meldung, September 2026): "ich schreibe x^2 (das läuft super) und
// anschliessend /2 und es kommt zum Ausdruck x, und dann Bruch mit dem einsamen
// Index 2 im Zähler" -- reproduzierbar z.B. beim FRISCH GEÖFFNETEN Flächen-Panel,
// dessen Feld mit dem Standardbeispiel "x^2" VORBELEGT ist (mlSetFromRaw('x^2'),
// NICHT getippt) -- klickt man hinein und tippt sofort "/2", entsteht fälschlich
// x·(2-über-2) statt (x^2)/2.
//
// Root Cause (per Quellcode-Analyse von mathlive.js, MathModeEditor.insert()):
// "mf.value = ..." (das mlSetFromRaw() an allen Stellen im Projekt verwendet)
// ruft intern setValue() -> ModeEditor.insert() auf, OHNE options.selectionMode
// zu setzen -- Default dort ist "placeholder". Für eingefügten Text ohne
// \placeholder{} (wie "x^{2}") landet der Code im "else if (lastNewAtom)"-Zweig
// und setzt model.position = model.offsetOf(lastNewAtom) -- lastNewAtom ist hier
// der "x"-Atom samt seiner angehängten Hochstellungs-Branch (^{2}). Der
// resultierende Offset zeigt dabei NICHT "nach dem ganzen x^2-Konstrukt" (wie man
// erwarten würde), sondern faktisch INNERHALB der Hochstellung, hinter der "2" --
// exakt das beobachtete Symptom: ein "/" direkt danach wrapped nur die "2" (den
// Inhalt der aktuellen Branch), "x" bleibt aussen vor.
//
// Bei INTERAKTIV getipptem "x^2" tritt der Bug NICHT auf: dort läuft NIE
// setValue(), sondern MathLives eigene "smartSuperscript"-Logik
// (insertMathModeChar() in mathlive.js) springt nach der ERSTEN Ziffer im
// Exponenten automatisch per moveAfterParent() aus der Hochstellung heraus --
// deshalb "läuft x^2 super", wenn man es selbst tippt, aber nicht bei
// vorbelegten Feldern.
//
// Fix: nach JEDEM programmatischen "mf.value = ..." explizit den Cursor ans
// ECHTE Ende des Feldes setzen -- dieselbe Aktion, die [End] bzw. cmd+Rechts
// auslöst. Laut mathlive.js reine Modell-Zustandsänderung (setzt nur
// model.position = model.lastOffset), KEIN Fokus-Seiteneffekt -- sicher auch für
// Felder, die gerade NICHT fokussiert sind (z.B. beim initialen Aufbau vieler
// Felder auf einmal beim Start). Wird von allen mlSetFromRaw()-Implementierungen
// im Projekt direkt nach "inp.value = latex;" aufgerufen.
function _mlMoveCursorToEnd(mf) {
  // nur bewegen, wenn der Cursor nicht schon am Ende steht (sonst «Plonk»-Ton von MathLive)
  try { if (typeof mf.position === 'number' && typeof mf.lastOffset === 'number' && mf.position >= mf.lastOffset) return; mf.executeCommand('moveToMathfieldEnd'); } catch (ex) { /* defensiv */ }
}
// MathLive: keine Töne (Tastenklick der virtuellen Tastatur, «Plonk» bei nicht möglichen Befehlen).
// Der Plonk erklang z. B. beim Ziehen eines Schiebers, weil das Formelfeld laufend neu gesetzt wird.
(function mlMute() {
  const off = () => { const M = typeof window !== 'undefined' ? window.MathfieldElement : null; if (!M) return; ['plonkSound', 'keypressSound', 'soundsDirectory'].forEach(k => { try { M[k] = null; } catch (e) { /* ältere Version */ } }); };
  try { off(); if (typeof customElements !== 'undefined' && customElements.whenDefined) customElements.whenDefined('math-field').then(off); } catch (e) { /* ohne MathLive */ }
})();

const MI_FNAMES = new Set([
  'sin', 'cos', 'tan', 'sqrt', 'abs', 'log', 'exp',
  'nthroot', 'logn', 'log10', 'logbase',
  'asin', 'acos', 'atan'
]);
// Funktionen, die der Auswerter nicht kennt, die der Parser aber über bekannte
// Funktionen ausdrückt (sinh(u) = (e^u - e^-u)/2 usw.).
const MI_EXPAND_FNAMES = new Set(['sinh', 'cosh', 'tanh', 'coth', 'cot', 'sec', 'csc']);
function miIsFuncName(v) { return MI_FNAMES.has(v) || MI_EXPAND_FNAMES.has(v); }

// ---------- Tokenizer ----------
// strict=true (nur für MathLive-Eingabe): unbekannte Zeichen (z.B. "!", "%", "<=",
// "{", "⌊") führen zu einem Fehler statt stillschweigend überlesen zu werden —
// sonst wird aus "x÷2" ohne Warnung "x-2" bzw. aus "x≤2" ein "x*2". Der Aufrufer
// behält bei einem Fehler den bisherigen Ausdruck.
function miTokenize(s, strict) {
  const toks = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\u00a0') { i++; continue; }
    if (strict) {
      if (c === '-' && s[i + 1] === ':') { toks.push({ t: '/', v: '/' }); i += 2; continue; }   // ÷ (ASCIIMath: "-:")
      if (c === '\u2223' || c === '\u2016') { toks.push({ t: '|', v: '|' }); i++; continue; }
    }
    // Typografische Rechenzeichen gelten in BEIDEN Modi: Früher wurden sie im nachsichtigen Modus (Zahlfelder,
    // Rohausdrücke) als «unbekannt» übersprungen — aus «−2» (Minuszeichen U+2212, so zeigt das Programm negative
    // Zahlen selbst an) wurde stillschweigend 2, aus «6÷2» wurde 62.
    if (c === '\u00f7') { toks.push({ t: '/', v: '/' }); i++; continue; }
    if (c === '\u00d7' || c === '\u00b7' || c === '\u22c5' || c === '\u2217') { toks.push({ t: '*', v: '*' }); i++; continue; }
    if (c === '\u2212' || c === '\u2013' || c === '\u2014' || c === '\u2010' || c === '\u2011' || c === '\ufe63' || c === '\uff0d') { toks.push({ t: '-', v: '-' }); i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i + 1] || ''))) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      toks.push({ t: 'num', v: s.slice(i, j) });
      i = j; continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      // Bezeichner dürfen nach dem ersten Buchstaben auch Ziffern enthalten
      // (wichtig für "log10" als EIN Token, nicht "log"+"10").
      let j = i + 1;
      while (j < s.length && /[a-zA-Z0-9]/.test(s[j])) j++;
      toks.push({ t: 'id', v: s.slice(i, j) });
      i = j; continue;
    }
    if ('+-*/^(),_|'.includes(c)) { toks.push({ t: c, v: c }); i++; continue; }
    if (strict) throw new Error('Unbekanntes Zeichen "' + c + '"');
    i++; // unbekanntes Zeichen defensiv überspringen
  }
  return toks;
}

// ---------- ASCIIMath-Dialekt-Kanonisierung (nur für MathLive-Input) ----------
// root(N)(X) -> nthroot(X,N) | log_B(X) -> logn(X,B) | ln(X) -> log(X) |
// bare log(X) -> log10(X) | bare e -> EC | |X| -> abs(X)
function miMatchParen(tokens, openIdx) {
  let depth = 0;
  for (let j = openIdx; j < tokens.length; j++) {
    if (tokens[j].t === '(') depth++;
    else if (tokens[j].t === ')') { depth--; if (depth === 0) return j; }
  }
  return null;
}

function miCanonicalizeAsciiMath(tokens) {
  let t = tokens.slice();
  let guard = 0;
  outer:
  while (guard++ < 1000) {
    for (let i = 0; i < t.length; i++) {
      const tok = t[i];

      if (tok.t === 'id' && tok.v === 'root' && t[i + 1] && t[i + 1].t === '(') {
        const closeN = miMatchParen(t, i + 1);
        if (closeN != null && t[closeN + 1] && t[closeN + 1].t === '(') {
          const closeX = miMatchParen(t, closeN + 1);
          if (closeX != null) {
            const nToks = t.slice(i + 2, closeN);
            const xToks = t.slice(closeN + 2, closeX);
            const repl = [{ t: 'id', v: 'nthroot' }, { t: '(', v: '(' }, ...xToks, { t: ',', v: ',' }, ...nToks, { t: ')', v: ')' }];
            t.splice(i, closeX - i + 1, ...repl);
            continue outer;
          }
        }
      }

      if (tok.t === 'id' && tok.v === 'log' && t[i + 1] && t[i + 1].t === '_') {
        if (t[i + 2] && t[i + 2].t === '(') {
          const closeB = miMatchParen(t, i + 2);
          if (closeB != null && t[closeB + 1] && t[closeB + 1].t === '(') {
            const closeX = miMatchParen(t, closeB + 1);
            if (closeX != null) {
              const bToks = t.slice(i + 3, closeB);
              const xToks = t.slice(closeB + 2, closeX);
              const repl = [{ t: 'id', v: 'logn' }, { t: '(', v: '(' }, ...xToks, { t: ',', v: ',' }, ...bToks, { t: ')', v: ')' }];
              t.splice(i, closeX - i + 1, ...repl);
              continue outer;
            }
          }
        } else if (t[i + 2] && (t[i + 2].t === 'num' || t[i + 2].t === 'id')) {
          const bTok = t[i + 2];
          if (t[i + 3] && t[i + 3].t === '(') {
            const closeX = miMatchParen(t, i + 3);
            if (closeX != null) {
              const xToks = t.slice(i + 4, closeX);
              const repl = [{ t: 'id', v: 'logn' }, { t: '(', v: '(' }, ...xToks, { t: ',', v: ',' }, bTok, { t: ')', v: ')' }];
              t.splice(i, closeX - i + 1, ...repl);
              continue outer;
            }
          }
        }
      }

      // MathLive hat für "abs" kein Kürzel: getippt wird a·b·s(…); "abs(" meinen wir als Betragsfunktion.
      if (tok.t === 'id' && tok.v === 'a' && t[i + 1] && t[i + 1].t === 'id' && t[i + 1].v === 'b' &&
          t[i + 2] && t[i + 2].t === 'id' && t[i + 2].v === 's' && t[i + 3] && t[i + 3].t === '(') {
        t.splice(i, 3, { t: 'id', v: 'abs' });
        continue outer;
      }

      if (tok.t === 'id' && tok.v === 'ln') {
        // natürlicher Logarithmus: Rohsyntax "log"; das Flag verhindert, dass die
        // Regel "nacktes log = log10" ihn gleich wieder umbenennt.
        t[i] = { t: 'id', v: 'log', nat: true };
        continue outer;
      }

      // MathLive kann den Arkusfunktionen-Namen je nach Version/Dialekt als
      // "arcsin"/"arccos"/"arctan" statt unserem "asin"/"acos"/"atan" ausgeben.
      if (tok.t === 'id' && (tok.v === 'arcsin' || tok.v === 'arccos' || tok.v === 'arctan')) {
        t[i] = { t: 'id', v: 'a' + tok.v.slice(3) };     // arcsin -> asin
        continue outer;
      }

      // nacktes "log" (auch ohne Klammer, z.B. "log x") = Zehnerlogarithmus;
      // "log_b ..." bleibt für den Parser stehen.
      if (tok.t === 'id' && tok.v === 'log' && !tok.nat && !(t[i + 1] && t[i + 1].t === '_')) {
        t[i] = { t: 'id', v: 'log10' };
        continue outer;
      }

      if (tok.t === 'id' && tok.v === 'e') {
        t[i] = { t: 'id', v: 'EC' };
        continue outer;
      }

      if (tok.t === '|') {
        let depth = 0, close = -1;
        for (let j = i + 1; j < t.length; j++) {
          if (t[j].t === '(') depth++;
          else if (t[j].t === ')') depth--;
          else if (t[j].t === '|' && depth === 0) { close = j; break; }
        }
        if (close !== -1) {
          const inner = t.slice(i + 1, close);
          const repl = [{ t: 'id', v: 'abs' }, { t: '(', v: '(' }, ...inner, { t: ')', v: ')' }];
          t.splice(i, close - i + 1, ...repl);
          continue outer;
        }
      }
    }
    break;
  }
  return t;
}

// ---------- Parser (rekursiver Abstieg) mit impliziter Multiplikation ----------
// expr := term (('+'|'-') term)*
// term := factor ( ('*'|'/') factor | factor )*      [Lücke ohne Operator = implizite '*']
// unary := '-' unary | power
// power := primary ('^' unary)?
// primary := NUM | ID ['(' args ')']  (nur bei bekanntem Funktionsnamen!) | '(' expr ')'
function miCanStartPrimary(tok) {
  return !!tok && (tok.t === 'num' || tok.t === 'id' || tok.t === '(');
}

// strict=true (MathLive-Eingabe): Funktionen dürfen ohne Klammern stehen ("sin x",
// "ln 2x", "sin^2(x)", "log_2 x") und eine nackte Funktion ohne Argument ist ein Fehler.
// strict=false (Rohausdruck der App): wie bisher nur die Form name(...).
function miParse(tokens, strict) {
  let p = 0;
  function peek() { return tokens[p]; }
  function next() { return tokens[p++]; }
  function expect(t) {
    if (!peek() || peek().t !== t) throw new Error('Parse-Fehler: erwartet "' + t + '", gefunden ' + JSON.stringify(peek()) + ' bei Position ' + p);
    return next();
  }
  const N = (v) => ({ type: 'num', v: String(v) });
  const C = (name, ...args) => ({ type: 'call', name, args });
  const isFnTok = (tok) => !!tok && tok.t === 'id' && miIsFuncName(tok.v);

  function parseExpr() {
    let node = parseTerm();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = next().t;
      const rhs = parseTerm();
      node = { type: op === '+' ? 'add' : 'sub', a: node, b: rhs };
    }
    return node;
  }
  function parseTerm() {
    let node = parseUnary();
    while (peek() && (peek().t === '*' || peek().t === '/' || miCanStartPrimary(peek()))) {
      if (peek().t === '*' || peek().t === '/') {
        const op = next().t;
        const rhs = parseUnary();
        node = { type: op === '*' ? 'mul' : 'div', a: node, b: rhs };
      } else {
        const rhs = parseUnary();
        node = { type: 'mul', a: node, b: rhs };
      }
    }
    return node;
  }
  function parseUnary() {
    if (peek() && peek().t === '-') {
      next();
      return { type: 'neg', x: parseUnary() };
    }
    if (peek() && peek().t === '+') {   // führendes Plus: "+x" = "x"
      next();
      return parseUnary();
    }
    return parsePower();
  }
  function parsePower() {
    let node = parsePrimary();
    if (peek() && peek().t === '^') {
      next();
      const exp = parseUnary();
      node = { type: 'pow', a: node, b: exp };
    }
    return node;
  }
  // Exponent direkt hinter einem Funktionsnamen: sin^2(x), sin^(-1)(x), sin^2 x
  function parseFuncExponent() {
    if (peek() && peek().t === '-') { next(); return { type: 'neg', x: parseFuncExponent() }; }
    if (peek() && peek().t === 'num') return N(next().v);
    if (peek() && peek().t === 'id') return { type: 'id', v: next().v };
    if (peek() && peek().t === '(') { next(); const e = parseExpr(); expect(')'); return e; }
    throw new Error('Parse-Fehler: Exponent erwartet');
  }
  // Argument ohne Klammern: "sin x", "sin 2x", "ln x^2", "cos -x"
  function parseBareArg() {
    let node = parseUnary();
    if (node.type === 'num') {
      // Koeffizient: "sin 2x" = sin(2x); bei einer weiteren Funktion ("sin 2 cos x") ist Schluss
      while (peek() && ((peek().t === 'id' && !isFnTok(peek())) || peek().t === '(')) {
        node = { type: 'mul', a: node, b: parseUnary() };
      }
    }
    return node;
  }
  function inverseOf(name) { return name === 'sin' ? 'asin' : name === 'cos' ? 'acos' : name === 'tan' ? 'atan' : null; }
  function expandFn(name, u) {
    const e1 = () => C('exp', u), e2 = () => C('exp', { type: 'neg', x: u });
    switch (name) {
      case 'sinh': return { type: 'div', a: { type: 'sub', a: e1(), b: e2() }, b: N(2) };
      case 'cosh': return { type: 'div', a: { type: 'add', a: e1(), b: e2() }, b: N(2) };
      case 'tanh': return { type: 'div', a: { type: 'sub', a: e1(), b: e2() }, b: { type: 'add', a: e1(), b: e2() } };
      case 'coth': return { type: 'div', a: { type: 'add', a: e1(), b: e2() }, b: { type: 'sub', a: e1(), b: e2() } };
      case 'cot': return { type: 'div', a: C('cos', u), b: C('sin', u) };
      case 'sec': return { type: 'div', a: N(1), b: C('cos', u) };
      case 'csc': return { type: 'div', a: N(1), b: C('sin', u) };
    }
    return C(name, u);
  }
  function parseFunction(tok) {
    const name = tok.v;
    // log_b x / log_(b) x
    let base = null;
    if (strict && name === 'log' && peek() && peek().t === '_') {
      next();
      if (peek() && peek().t === '(') { next(); base = parseExpr(); expect(')'); }
      else if (peek() && (peek().t === 'num' || peek().t === 'id')) base = peek().t === 'num' ? N(next().v) : { type: 'id', v: next().v };
      else throw new Error('Parse-Fehler: Basis des Logarithmus fehlt');
    }
    let powExp = null;
    if (strict && peek() && peek().t === '^') { next(); powExp = parseFuncExponent(); }
    let args;
    if (peek() && peek().t === '(') {
      next();
      args = [];
      if (!(peek() && peek().t === ')')) {
        args.push(parseExpr());
        while (peek() && peek().t === ',') { next(); args.push(parseExpr()); }
      }
      expect(')');
    } else if (strict) {
      if (name === 'nthroot' || name === 'logn' || name === 'logbase') throw new Error('Parse-Fehler: Klammer erwartet nach ' + name);
      if (!peek() || !(peek().t === 'num' || peek().t === 'id' || peek().t === '-' || peek().t === '+')) throw new Error('Parse-Fehler: Argument fehlt für ' + name);
      args = [parseBareArg()];
    } else {
      return { type: 'id', v: name };   // lenient: Funktionsname ohne Klammer = Bezeichner (wie bisher)
    }
    if (strict && args.length === 0 && name !== 'nthroot') throw new Error('Parse-Fehler: leeres Argument bei ' + name);
    let node;
    if (base) node = (base.type === 'num' && base.v === '10') ? C('log10', args[0]) : C('logn', args[0], base);
    else if (MI_EXPAND_FNAMES.has(name)) node = expandFn(name, args[0]);
    else node = { type: 'call', name, args };
    if (powExp) {
      const inv = powExp.type === 'neg' && powExp.x.type === 'num' && powExp.x.v === '1' ? inverseOf(name) : null;
      node = inv ? C(inv, args[0]) : { type: 'pow', a: node, b: powExp };
    }
    return node;
  }
  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('Parse-Fehler: unerwartetes Ende');
    if (tok.t === 'num') { next(); return { type: 'num', v: tok.v }; }
    if (tok.t === '(') {
      next();
      const inner = parseExpr();
      expect(')');
      return inner;
    }
    if (tok.t === 'id') {
      next();
      if (miIsFuncName(tok.v) && (strict || (peek() && peek().t === '('))) return parseFunction(tok);
      return { type: 'id', v: tok.v };
    }
    throw new Error('Parse-Fehler: unerwartetes Token ' + JSON.stringify(tok) + ' bei Position ' + p);
  }

  const result = parseExpr();
  if (p < tokens.length) throw new Error('Parse-Fehler: Rest nicht verarbeitet ab Position ' + p + ' (' + JSON.stringify(tokens.slice(p)) + ')');
  return result;
}

function miParseRaw(s) { return miParse(miTokenize(s), false); }
function miParseAsciiMath(s) { return miParse(miCanonicalizeAsciiMath(miTokenize(s, true)), true); }

// ---------- Drucker: AST → Rohausdruck-Format ----------
// Konvention: Brüche werden IMMER als (Zähler)/(Nenner) gedruckt — beide
// Seiten geklammert — damit der Bruch beim erneuten Einlesen (miParseRaw)
// eindeutig als EIN div-Knoten erkannt wird, unabhängig von Operator-
// Vorrang-Regeln im Kontext drumherum.
const MI_PREC = { add: 1, sub: 1, mul: 2, div: 2, neg: 3, pow: 4 };
function miIsAtomic(n) { return n.type === 'num' || n.type === 'id' || n.type === 'call'; }

function miToRaw(node, parentPrec, side, parentType) {
  parentPrec = parentPrec || 0;
  side = side || 'l';
  let out, myPrec;
  switch (node.type) {
    case 'num': return node.v;
    case 'id': return node.v;
    case 'call':
      return node.name + '(' + node.args.map(a => miToRaw(a, 0)).join(',') + ')';
    case 'neg': {
      out = '-' + (miIsAtomic(node.x) ? miToRaw(node.x, 0) : '(' + miToRaw(node.x, 0) + ')');
      myPrec = MI_PREC.neg;
      break;
    }
    case 'pow': {
      const baseStr = miIsAtomic(node.a) ? miToRaw(node.a, 0) : '(' + miToRaw(node.a, 0) + ')';
      const expStr = miIsAtomic(node.b) ? miToRaw(node.b, 0) : '(' + miToRaw(node.b, 0) + ')';
      out = baseStr + '^' + expStr;
      myPrec = MI_PREC.pow;
      break;
    }
    case 'div': {
      out = '(' + miToRaw(node.a, 0) + ')/(' + miToRaw(node.b, 0) + ')';
      myPrec = MI_PREC.div;
      break;
    }
    case 'add': case 'sub': case 'mul': {
      const opChar = node.type === 'add' ? '+' : node.type === 'sub' ? '-' : '*';
      const myP = MI_PREC[node.type];
      const aStr = miToRaw(node.a, myP, 'l', node.type);
      let bStr = miToRaw(node.b, myP, 'r', node.type);
      // Sicherheitsnetz gegen "x--1.5" statt "x-(-1.5)" (z.B. bei "x-(-1.5)"
      // eingetippt, oder bei automatisch aus einem negativen Wert gebauten
      // Ausdrücken wie einer Tangentengleichung an einer Stelle x0<0):
      // miParseRaw() (der eigene AST-Parser) toleriert "--" problemlos als
      // zwei aufeinanderfolgende Minus, aber safeEval() kompiliert den
      // Rohtext über JAVASCRIPTS EIGENEN Compiler (new Function(...), siehe
      // getEvalFn() in 03_math.js) — dort ist "--" der Dekrement-Operator,
      // die Kompilierung schlägt fehl (SyntaxError, abgefangen -> überall
      // NaN). Beginnt die rechte Seite mit "-" und der Operator ist
      // ebenfalls "-", deshalb IMMER klammern (unabhängig von der sonstigen
      // Präzedenz-Logik unten, die nur "sieht", DASS b ein 'neg'-Knoten ist,
      // nicht WELCHES Zeichen b am Anfang tatsächlich druckt).
      if (opChar === '-' && bStr.charAt(0) === '-') bStr = '(' + bStr + ')';
      out = aStr + opChar + bStr;
      myPrec = myP;
      break;
    }
    default:
      throw new Error('miToRaw: unbekannter Knotentyp ' + node.type);
  }
  // Rechte Seite bei GLEICHER Präzedenz: nur bei nicht-assoziativen Kombinationen
  // sind Klammern zwingend nötig — sonst würde z.B. "5-(2+3)" fälschlich als
  // "5-2+3" (=6 statt 0) gedruckt. "a-(b-c)" und "a/(b/c)" ebenso zwingend;
  // "a+(b-c)"/"a*(b/c)" sind mathematisch auch ungeklammert korrekt, werden
  // hier aber (harmlos) trotzdem geklammert, wenn der Kindtyp sub/div/pow ist.
  const needsWrap = myPrec < parentPrec ||
    (myPrec === parentPrec && side === 'r' && (
      node.type === 'sub' || node.type === 'div' || node.type === 'pow' ||
      (node.type === 'add' && parentType === 'sub')
    ));
  return needsWrap ? '(' + out + ')' : out;
}

// ---------- Drucker: AST → LaTeX (für mf.setValue bei programmatischem Schreiben) ----------
function miToLatex(node, parentPrec, side, parentType) {
  parentPrec = parentPrec || 0;
  side = side || 'l';
  let out, myPrec;
  switch (node.type) {
    case 'num': return node.v;
    case 'id':
      if (node.v === 'pi') return '\\pi ';
      if (node.v === 'EC') return 'e';
      return node.v;
    case 'call': {
      const a0 = node.args[0];
      const l0 = a0 ? miToLatex(a0, 0) : '';
      switch (node.name) {
        case 'sin': return '\\sin(' + l0 + ')';
        case 'cos': return '\\cos(' + l0 + ')';
        case 'tan': return '\\tan(' + l0 + ')';
        case 'asin': return '\\arcsin(' + l0 + ')';
        case 'acos': return '\\arccos(' + l0 + ')';
        case 'atan': return '\\arctan(' + l0 + ')';
        case 'sqrt': return '\\sqrt{' + l0 + '}';
        case 'abs': return '\\left|' + l0 + '\\right|';
        case 'exp': return 'e^{' + l0 + '}';
        case 'nthroot': return '\\sqrt[' + miToLatex(node.args[1], 0) + ']{' + l0 + '}';
        case 'logn': case 'logbase':
          return '\\log_{' + miToLatex(node.args[1], 0) + '}(' + l0 + ')';
        case 'log10': return '\\log_{10}(' + l0 + ')';
        case 'log': return '\\ln(' + l0 + ')';
        default: return '\\operatorname{' + node.name + '}(' + node.args.map(a => miToLatex(a, 0)).join(',') + ')';
      }
    }
    case 'neg': {
      out = '-' + (miIsAtomic(node.x) ? miToLatex(node.x, 0) : '(' + miToLatex(node.x, 0) + ')');
      myPrec = MI_PREC.neg;
      break;
    }
    case 'pow': {
      // Bruch als Basis immer klammern: (1/2)^k → \left(\frac{1}{2}\right)^{k} (sonst sähe es aus wie 1^k/2)
      out = (node.a.type === 'div' ? '\\left(' + miToLatex(node.a, 0) + '\\right)' : '{' + miToLatex(node.a, 100) + '}') + '^{' + miToLatex(node.b, 0) + '}';
      myPrec = MI_PREC.pow;
      break;
    }
    case 'div': {
      out = '\\frac{' + miToLatex(node.a, 0) + '}{' + miToLatex(node.b, 0) + '}';
      myPrec = 100;
      break;
    }
    case 'mul': {
      const aStr = miToLatex(node.a, MI_PREC.mul, 'l');
      // "5x", "5\sin(x)", "5x^2" dürfen ohne \cdot nebeneinander stehen (liest
      // sich eindeutig) — ABER "5*0.2^x" NICHT: node.b ist zwar 'pow', doch die
      // BASIS der Potenz (0.2) ist selbst eine Zahl, und "5" gefolgt von "0.2^x"
      // ohne \cdot sieht in MathLive/KaTeX wie "50.2^x" aus (Leerzeichen
      // zwischen zwei Ziffern-Atomen wird beim Rendern nicht dargestellt) —
      // Nutzerwunsch/Bugreport: "im Eingabefeld erscheint 50.2^x - es sollte
      // 5 · 0.2^x". Daher: bei 'pow' zusätzlich prüfen, ob die Basis selbst
      // eine Zahl ist, und in dem Fall NICHT juxtaposen.
      const juxtaposeOk = node.a.type === 'num' && (
        node.b.type === 'id' || node.b.type === 'call' ||
        (node.b.type === 'pow' && node.b.a.type !== 'num')
      );
      const bStr = miToLatex(node.b, MI_PREC.mul, 'r');
      out = aStr + (juxtaposeOk ? ' ' : ' \\cdot ') + bStr;
      myPrec = MI_PREC.mul;
      break;
    }
    case 'add': case 'sub': {
      const opChar = node.type === 'add' ? '+' : '-';
      const myP = MI_PREC[node.type];
      const aStr = miToLatex(node.a, myP, 'l', node.type);
      const bStr = miToLatex(node.b, myP, 'r', node.type);
      out = aStr + opChar + bStr;
      myPrec = myP;
      break;
    }
    default:
      throw new Error('miToLatex: unbekannter Knotentyp ' + node.type);
  }
  // Siehe miToRaw() für die Begründung: "a-(b+c)" braucht auf der rechten
  // Seite einer Subtraktion zwingend Klammern, sonst kippt das Vorzeichen.
  const needsWrap = myPrec < parentPrec ||
    (myPrec === parentPrec && side === 'r' && (
      node.type === 'sub' || node.type === 'pow' ||
      (node.type === 'add' && parentType === 'sub')
    ));
  return needsWrap ? '\\left(' + out + '\\right)' : out;
}

// ---------- Kontextmenü des math-field (die "⋮"/3-Strich-Menü-Schaltfläche) ----------
// Reduziert MathLives Standardmenü auf das, was für diese App sinnvoll ist:
// keine Matrizen (kein Matrix-Editor im Einsatz), kein separates "Einfügen"-
// Untermenü (Betrag/Wurzel/Logarithmus-Basis stehen bereits über die
// bestehende Tastatur-Sektion bereit), keine Schriftstil-/Text-/Hintergrund-
// farb-Optionen, und keine Compute-Engine-Befehle (Auswerten/Vereinfachen/
// Lösen) — die zugehörige Bibliothek ist hier gar nicht eingebunden, die
// Einträge würden also ohnehin nichts tun.
const ML_MENU_REMOVE_IDS = new Set([
  // Matrix-Bearbeitung (Zeilen/Spalten, Matrix einfügen)
  'add-row-above', 'add-row-below', 'add-column-before', 'add-column-after',
  'delete-row', 'delete-column', 'insert-matrix',
  // "Einfügen"-Untermenü (Betrag/Wurzel/Log-Basis etc. — bereits in der App-Tastatur)
  'insert',
  // Schriftstil / Textfarbe / Hintergrundfarbe
  'variant', 'color', 'background-color',
  // Compute Engine (nicht eingebunden, Einträge wären wirkungslos)
  'ce-evaluate', 'ce-simplify', 'ce-solve',
]);

function mlFilterMenuItems(items) {
  if (!Array.isArray(items)) return items;
  let out = items.filter(it => {
    if (it.id && ML_MENU_REMOVE_IDS.has(it.id)) return false;
    // Das Umgebungs-Untermenü (Klammerstil einer Matrix) hat selbst keine id,
    // nur seine Kinder ("environment-...") — nur relevant innerhalb einer Matrix.
    if (!it.id && Array.isArray(it.submenu) && it.submenu[0]?.id?.startsWith('environment-')) return false;
    return true;
  });
  // Überflüssige Trenner aufräumen (führend/doppelt/abschliessend)
  const cleaned = [];
  for (const it of out) {
    if (it.type === 'divider') {
      if (cleaned.length === 0) continue;
      if (cleaned[cleaned.length - 1].type === 'divider') continue;
    }
    cleaned.push(it);
  }
  if (cleaned.length && cleaned[cleaned.length - 1].type === 'divider') cleaned.pop();
  return cleaned;
}

// ---------- Einmaliger Fokus-"Warm-up" pro <math-field> ----------
// BUG (Nutzer-Meldung, September 2026): "g(x) wird ignoriert", "Funktion
// sqrt(x) wird nicht angezeigt", "^2/^3 wird zu \2/\3" — alle drei liessen
// sich auf dieselbe Ursache zurückführen: MathLive baut beim ALLERERSTEN
// Fokussieren eines neu ins DOM eingehängten <math-field>-Elements intern
// offenbar etwas asynchron auf (siehe auch den Kommentar bei
// queueMicrotask(...menuItems...) in renderFuncList(), 06_ui_functions.js,
// der dieselbe asynchrone Mount-Eigenart schon für einen anderen Zweck
// dokumentiert). Tippt man SOFORT nach diesem allerersten Fokussieren
// weiter (typischer Nutzer-Workflow: Feld anklicken und direkt den
// Ausdruck eintippen), gehen die ersten ein bis zwei Zeichen dabei
// nachweislich verloren bzw. werden falsch interpretiert — reproduziert
// z.B. mit "x^2" sofort nach Fokus eingetippt: das führende "x" ging
// verloren UND der Hochstellungs-Operator "^" blieb als literaler Text
// statt einer echten Hochstellung stehen. Beim zweiten und jedem weiteren
// Fokus desselben Elements tritt das Problem nicht mehr auf.
// Fix: jedes math-field-Element GENAU EINMAL (direkt nachdem es ins DOM
// eingehängt wurde) programmatisch fokussieren und sofort wieder
// unfokussieren — dieser interne Aufbau läuft dann VOR der ersten
// echten Nutzerinteraktion ab statt währenddessen. Der vorherige Fokus
// wird danach wiederhergestellt, damit dieser "Warm-up" nie sichtbar
// den Fokus stiehlt. Rein defensiv — darf niemals einen Fehler werfen
// (z.B. falls MathLive in einer zukünftigen Version .focus()/.blur()
// anders handhabt).
//
// WICHTIG: viele math-field-Elemente (z.B. f(x)/g(x) im Ober-/Untersummen-
// Panel) stecken in einem standardmässig EINGEKLAPPTEN, also unsichtbaren
// (display:none) Panel (siehe die "Zusammenklappbare Panels"-Sektion weiter
// unten in dieser Datei). .focus() auf einem nicht sichtbaren Element ist
// laut Spec wirkungslos (document.activeElement ändert sich nicht) — ABER
// (empirisch geprüft, nicht nur Spekulation): bei MathLive ist .focus() auf
// einem unsichtbaren <math-field> KEIN harmloses No-op — es hinterlässt das
// Element in einem kaputten internen Zustand, der auch NACH dem späteren
// Sichtbarwerden jeden weiteren echten Fokusversuch (Klick des Nutzers)
// verhindert (reproduziert: nach so einem verfrühten .focus()-Aufruf liess
// sich das betroffene Feld nie wieder fokussieren, Klicks blieben komplett
// wirkungslos). Deshalb HIER, VOR jedem .focus()-Aufruf, Sichtbarkeit
// prüfen (offsetParent !== null) und bei Unsichtbarkeit sofort abbrechen,
// OHNE .focus() überhaupt anzufassen — nicht erst danach über
// document.activeElement kontrollieren. _mlPrewarmed bleibt in diesem Fall
// ungesetzt, sodass ein SPÄTERER Aufruf (siehe Panel-Klick-Handler weiter
// unten in dieser Sektion, der nach dem Aufklappen erneut prewarmt) es
// erfolgreich nachholen kann, sobald das Element tatsächlich sichtbar ist.
function _mlPrewarmFocusNow(el) {
  if (!el || el.tagName !== 'MATH-FIELD' || el._mlPrewarmed) return;
  if (el.offsetParent === null) return; // unsichtbar (z.B. eingeklapptes Panel) -- .focus() NICHT anfassen
  try {
    const prevActive = document.activeElement;
    el.focus();
    if (document.activeElement !== el) return; // aus anderem Grund nicht fokussierbar -- später erneut versuchen
    el._mlPrewarmed = true;
    el.blur();
    if (prevActive && prevActive !== el && prevActive !== document.body && typeof prevActive.focus === 'function') {
      prevActive.focus();
    }
  } catch (ex) { /* ignorieren — siehe Kommentar oben */ }
}

// Öffentlicher Einstiegspunkt: verzögert den eigentlichen Warm-up (siehe
// oben) über zwei requestAnimationFrame-Ticks. Ein frisch ins DOM
// eingehängtes <math-field> "mountet" sich intern nachweislich nicht
// innerhalb desselben Microtask-Durchlaufs (führte vereinzelt zu einer
// von MathLive selbst geworfenen "Mathfield not mounted"-Fehlermeldung,
// wenn direkt danach fokussiert wurde) — zwei rAF-Ticks (statt nur
// queueMicrotask) geben dem Mount-Vorgang zuverlässig genug Zeit. Alle
// Aufrufer rufen einfach mlPrewarmFocus(el) auf, ohne sich selbst um
// Verzögerung/Zeitpunkt kümmern zu müssen.
function mlPrewarmFocus(el) {
  requestAnimationFrame(() => requestAnimationFrame(() => _mlPrewarmFocusNow(el)));
}

// ---------- Öffentliche API ----------
// Wirft bei unvollständigen/ungültigen Zwischenzuständen (z.B. während des
// Tippens: "2+", leerer Bruchnenner) bewusst eine Exception — der Aufrufer
// (06_ui_functions.js) fängt das ab und lässt den bisherigen Rohausdruck
// unverändert, statt die Funktion/den Graphen kaputtzumachen.
function asciiMathToRaw(asciiStr) {
  if (asciiStr == null || !asciiStr.trim()) return '';
  const ast = miParseAsciiMath(asciiStr);
  return miToRaw(ast, 0);
}
function rawToLatex(rawStr) {
  if (rawStr == null || !rawStr.trim()) return '';
  const ast = miParseRaw(rawStr);
  return miToLatex(ast, 0);
}

if (typeof module !== 'undefined') {
  module.exports = { miTokenize, miParse, miParseRaw, miParseAsciiMath, miToRaw, miToLatex, asciiMathToRaw, rawToLatex, miCanonicalizeAsciiMath, mlFilterMenuItems };
}


// ═════════════ Allgemeine Robustheit der Text- und Zahlfelder (alle Umgebungen) ═════════════
// (1) Panel-Neuaufbau, während ein Feld noch den Fokus hat. Chrome/Edge feuern beim ENTFERNEN eines
//     fokussierten <input>/<select> noch «change»/«blur». Folge vorher: Der (veraltete) Feldinhalt wurde ein
//     zweites Mal übernommen — z.B. Winkel 30 eintippen + Enter, dann den Punkt am Kreis auf 90° ziehen: beim
//     Loslassen sprang er auf 30 zurück; Rückgängig (Strg+Z) im Feld «tat nichts»; ein leeres Feld + Enter warf
//     «The node to be removed is no longer a child». Darum verliert das Feld den Fokus VOR dem Neuaufbau,
//     und zwar still (ohne dass seine Übernahme-Funktion nochmals läuft). Formelfelder (math-field) sind nicht
//     betroffen: sie lesen nach dem Aufbau das NEUE Feld und bleiben daher unberührt.
function uiQuietBlur(root) {
  const a = document.activeElement;
  if (!a || a === document.body || a === root || !root || typeof root.contains !== 'function' || !root.contains(a)) return;
  if (a.tagName !== 'INPUT' && a.tagName !== 'SELECT' && a.tagName !== 'TEXTAREA') return;
  const stop = function (e) { e.stopImmediatePropagation(); };
  const T = ['change', 'blur', 'focusout'];
  T.forEach(function (t) { window.addEventListener(t, stop, true); });
  try { a.blur(); } catch (ex) { /* defensiv */ }
  T.forEach(function (t) { window.removeEventListener(t, stop, true); });
}
(function () {
  const P = typeof Element !== 'undefined' && Element.prototype;
  if (!P || typeof P.replaceChildren !== 'function' || P.__j10QuietBlur) return;
  const rc = P.replaceChildren;
  P.__j10QuietBlur = true;
  P.replaceChildren = function () {
    try {
      const a = document.activeElement;
      // bleibt das fokussierte Element erhalten (wird gleich wieder eingehängt), nichts tun
      let keep = false;
      for (let i = 0; i < arguments.length && !keep; i++) { const n = arguments[i]; keep = !!(n && n.contains && a && n.contains(a)); }
      if (!keep) uiQuietBlur(this);
    } catch (ex) { /* defensiv */ }
    return rc.apply(this, arguments);
  };
})();
// (2) Wer nach einer Eingabe direkt in die Zeichenfläche greift (Maus, Finger, Stift), schliesst damit das Feld
//     ab: Der getippte Wert wird übernommen, die Bildschirmtastatur von Tablet/Handy klappt zu. In einigen
//     Umgebungen (Trigonometrie, Wahrscheinlichkeit, Finanzmathematik, 3D) und bei Wischgesten blieb der Fokus
//     sonst im Feld stehen.
document.addEventListener('pointerdown', function (e) {
  const a = document.activeElement, t = e.target;
  if (!a || a === document.body || !t || typeof t.closest !== 'function') return;
  if (a.tagName !== 'INPUT' && a.tagName !== 'TEXTAREA' && a.tagName !== 'SELECT' && a.tagName !== 'MATH-FIELD') return;
  if (a === t || a.contains(t) || !a.closest('#sidebar') || !t.closest('#canvas-wrap')) return;
  try { a.blur(); } catch (ex) { /* defensiv */ }
}, true);
// (3) Dezimalkomma in <input type="number">: Chrome/Edge lassen je nach Sprache des Browsers nur EIN
//     Dezimalzeichen zu und verschlucken das andere kommentarlos (aus «1000,5» wurde 10005). Das Komma wird
//     darum als Punkt eingefügt; der Punkt gilt in allen Browsern.
document.addEventListener('keydown', function (e) {
  const t = e.target;
  if (e.key !== ',' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || !t || t.tagName !== 'INPUT' || t.type !== 'number') return;
  e.preventDefault();
  try { if (!document.execCommand('insertText', false, '.')) throw 0; }
  catch (ex) { try { t.value = String(t.value) + '.'; t.dispatchEvent(new Event('input', { bubbles: true })); } catch (ex2) { /* defensiv */ } }
}, true);
// (4) iPhone: Die Zifferntastatur (inputmode="decimal") hat dort kein Minuszeichen und keinen Bruchstrich —
//     negative Werte, «1/4» oder «pi» liessen sich nicht eingeben. Auf dem iPhone erscheint darum die normale
//     Tastatur (iPad und Android zeigen bei "decimal" ohnehin eine Tastatur mit Minus).
(function () {
  let phone = false;
  try { phone = /iPhone|iPod/.test(navigator.userAgent || ''); } catch (ex) { /* defensiv */ }
  if (!phone) return;
  const fix = function (e) { const t = e.target; if (t && t.tagName === 'INPUT' && (t.inputMode === 'decimal' || t.getAttribute('inputmode') === 'decimal')) { t.inputMode = 'text'; t.setAttribute('autocapitalize', 'off'); t.setAttribute('autocorrect', 'off'); } };
  document.addEventListener('touchstart', fix, { capture: true, passive: true });
  document.addEventListener('focusin', fix, true);
})();
