// ═══════════════════════════════════════════════════════════════════
// MODUL: icons — moderne Linien-Icons statt Emojis
// Ersetzt die bunten System-Emojis in Knöpfen, Panel-Titeln und Menüs
// automatisch durch einheitliche, einfarbige SVG-Icons (Stil: Lucide/
// Feather, 2px Linie, runde Enden). Die Icons übernehmen die Textfarbe
// (currentColor) und passen sich so Hell/Dunkel/Beamer automatisch an.
//
// Funktionsweise: Die Texte (01_i18n.js, index.html, 06_ui_functions.js ...)
// bleiben UNVERÄNDERT mit ihren Emoji-Zeichen — dieses Modul ersetzt beim
// Laden und danach bei JEDER DOM-Änderung (MutationObserver, z.B. nach einem
// Sprachwechsel oder renderFuncList()) die Zeichen im Text durch <i class="ic">.
// Neues Icon: Zeichen + SVG-Pfad in ICONS eintragen. Fehlt ein Zeichen in
// ICONS, bleibt es unverändert als Text stehen.
// ═══════════════════════════════════════════════════════════════════
(function () {
  const ICONS = {
    '📐': '<path d="M3 20 20 3v17z"/><path d="M14 20v-4 M17 20v-8"/>',
    '📏': '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z"/><path d="m14.5 12.5 2-2 M11.5 9.5l2-2 M8.5 6.5l2-2 M17.5 15.5l2-2"/>',
    '📈': '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
    '📉': '<path d="M22 17 13.5 8.5 8.5 13.5 2 7"/><path d="M16 17h6v-6"/>',
    '📊': '<path d="M12 20V10 M18 20V4 M6 20v-4"/>',
    '🔢': '<path d="M4 9h16 M4 15h16 M10 3 8 21 M16 3l-2 18"/>',
    '🧮': '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8 M8 10h.01 M12 10h.01 M16 10h.01 M8 14h.01 M12 14h.01 M16 14h.01 M8 18h.01 M12 18h4"/>',
    '📶': '<path d="M3 3v18h18"/><path d="M7 17v-4 M11 17V9 M15 17v-6 M19 17V6"/>',
    '🟦': '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6v10H7z"/>',
    '📂': '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.2 10H20a2 2 0 0 1 1.9 2.5l-1.5 6a2 2 0 0 1-2 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.7.9l.8 1.2a2 2 0 0 0 1.7.9H18a2 2 0 0 1 2 2v2"/>',
    '💾': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8 M7 3v5h8"/>',
    '📋': '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6 M9 16h4"/>',
    '✏': '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/><path d="m15 5 4 4"/>',
    '📍': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    '🗑': '<path d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6"/>',
    '📤': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12"/>',
    '📷': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    '🎚': '<path d="M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6"/>',
    '🔴': '<path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/>',
    '🌙': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
    '☀': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2 M12 20v2 m4.93 4.93 1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 m6.34 17.66-1.41 1.41 M19.07 4.93l-1.41 1.41"/>',
    '📺': '<path d="M5 7 3 5 M9 6V3 m4 4 2-2"/><circle cx="9" cy="13" r="3"/><path d="M11.8 12H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2.2 M16 16h2"/>',
    '⚙': '<path d="M21 4h-7 M10 4H3 M21 12h-9 M8 12H3 M21 20h-5 M12 20H3 M14 2v4 M8 10v4 M16 18v4"/>',
    '🌐': '<circle cx="12" cy="12" r="10"/><path d="M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    '⌨': '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01 M10 8h.01 M14 8h.01 M18 8h.01 M8 12h.01 M12 12h.01 M16 12h.01 M7 16h10"/>',
    '☰': '<path d="M4 6h16 M4 12h16 M4 18h16"/>',
    '📖': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    '↩': '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    '↪': '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    '👁': '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    '🙈': '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.4 0 10 7 10 7a17 17 0 0 1-2.2 3.2 M6.6 6.6A17 17 0 0 0 2 11s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6 M2 2l20 20 M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    '⊙': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
    '✕': '<path d="M18 6 6 18 M6 6l12 12"/>',
    // Nur am Anfang eines Panel-Titels (sonst Mathe-Zeichen im Text!)
    'ƒ': '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17c2 0 2-1 2-3V9c0-2 .5-3 3-3 M8 12h6"/>',
    '∑': '<path d="M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2"/>',
    '∿': '<path d="M2 12c2.5-8 5.5-8 8 0s5.5 8 8 0 M18 12h4"/>'
  };
  const TITLE_ONLY = new Set(['ƒ', '∑', '∿']);

  const esc = c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RX = new RegExp('(' + Object.keys(ICONS).map(esc).join('|') + ')\\uFE0F?\\s?', 'u');
  const RX_G = new RegExp(RX.source, 'gu');

  // CSS (einmalig): Icon = einfarbige Maske, Farbe = currentColor
  const css = document.createElement('style');
  css.textContent = `
    i.ic { display:inline-block; width:1.18em; height:1.18em; vertical-align:-0.22em; margin-right:0.5em;
           background-color:currentColor; font-style:normal; flex-shrink:0;
           -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat;
           -webkit-mask-position:center; mask-position:center;
           -webkit-mask-size:contain; mask-size:contain; }
    i.ic.ic-solo { margin-right:0; }
    .panel-title { justify-content:flex-start !important; }
    .panel-title .panel-arrow { margin-left:auto; }
    .panel-title i.ic { margin-right:0; color:var(--accent); width:1.25em; height:1.25em; vertical-align:-0.28em; }
    button i.ic { vertical-align:-0.2em; }
    .del-btn i.ic { width:1.05em; height:1.05em; vertical-align:-0.15em; }
    #pointer-mode-btn i.ic { color:#e24b4a; }
  `;
  document.head.appendChild(css);

  const uriCache = {};
  function maskUrl(ch) {
    if (!uriCache[ch]) {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[ch] + '</svg>';
      uriCache[ch] = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
    }
    return uriCache[ch];
  }
  function makeIcon(ch) {
    const i = document.createElement('i');
    i.className = 'ic';
    i.setAttribute('aria-hidden', 'true');
    const u = maskUrl(ch);
    i.style.webkitMaskImage = u; i.style.maskImage = u;
    return i;
  }

  const SKIP = new Set(['OPTION', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'TITLE', 'MATH-FIELD', 'SELECT']);
  function skipNode(n) {
    const p = n.parentNode;
    if (!p || p.nodeType !== 1) return true;
    if (SKIP.has(p.tagName)) return true;
    if (p.closest && p.closest('#canvas-wrap, math-field, .ML__container')) return true;
    return false;
  }

  function convertTextNode(node) {
    const data = node.data;
    if (!RX.test(data) || skipNode(node)) return;
    const inTitle = !!(node.parentNode.closest && node.parentNode.closest('.panel-title'));
    const frag = document.createDocumentFragment();
    let last = 0, changed = false, m;
    RX_G.lastIndex = 0;
    while ((m = RX_G.exec(data))) {
      const ch = m[1];
      if (TITLE_ONLY.has(ch) && !(inTitle && m.index === 0)) continue;
      if (m.index > last) frag.appendChild(document.createTextNode(data.slice(last, m.index)));
      frag.appendChild(makeIcon(ch));
      last = m.index + m[0].length;
      changed = true;
    }
    if (!changed) return;
    if (last < data.length) frag.appendChild(document.createTextNode(data.slice(last)));
    else if (frag.lastChild && frag.lastChild.nodeType === 1 && !node.nextSibling) frag.lastChild.classList.add('ic-solo'); // Icon ohne Text dahinter → kein Abstand
    node.parentNode.replaceChild(frag, node);
  }

  function iconize(root) {
    if (!root) return;
    if (root.nodeType === 3) { convertTextNode(root); return; }
    if (root.nodeType !== 1 || SKIP.has(root.tagName)) return;
    if (root.closest && root.closest('#canvas-wrap')) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const list = [];
    let n;
    while ((n = w.nextNode())) { if (RX.test(n.data)) list.push(n); }
    list.forEach(convertTextNode);
  }

  const obs = new MutationObserver(muts => {
    obs.disconnect();
    try {
      for (const m of muts) {
        if (m.type === 'characterData') iconize(m.target);
        else m.addedNodes.forEach(iconize);
      }
    } finally {
      obs.observe(document.body, { childList: true, characterData: true, subtree: true });
    }
  });

  iconize(document.body);
  obs.observe(document.body, { childList: true, characterData: true, subtree: true });
  window.iconize = iconize; // für manuelle Aufrufe / Tests
})();
