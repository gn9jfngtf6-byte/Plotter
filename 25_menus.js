// ============================================================
// 25_menus.js — modernes Auswahl-Dropdown für ALLE <select>-Felder
// ------------------------------------------------------------
// Problem: native <select>-Felder zeigen je nach System (z.B. macOS) kleine
// Auf-/Ab-Pfeile und ein Betriebssystem-Menü, das nicht zum Rest der
// Oberfläche passt.
//
// Lösung: Das <select> bleibt das sichtbare Bedienelement (Layout, Grösse,
// Wert, Tastatur, change-Events, Übersetzung der Optionen funktionieren
// unverändert; das Aussehen kommt aus dem CSS-Block "Menüs & Auswahlfelder"
// in index.html). Nur das AUFKLAPPEN wird abgefangen und durch ein eigenes
// Popover ersetzt (gleiches Design wie Einstellungen-/Sprachmenü).
//
// Gilt automatisch für jedes <select>, auch für später dynamisch erzeugte
// (Event-Delegation, keine Verdrahtung pro Element nötig).
// Ausnahmen (bleiben nativ): select[multiple], select[size>1],
// select[data-native] und Touch-Geräte (dort ist das System-Rad besser).
//
// Tastatur: Pfeile ändern den Wert wie gewohnt; Leertaste / Enter /
// Alt+↓ öffnen das Popover; darin ↑ ↓ Home End Enter Esc Tab und
// Tipp-Suche (Buchstaben).
// ============================================================
(function () {
  'use strict';

  const CHECK = '<svg class="ds-chk" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>';
  const fine = () => { try { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) { return true; } };
  const eligible = s => !!s && s.tagName === 'SELECT' && !s.multiple && !(s.size > 1) && !s.hasAttribute('data-native') && fine();

  let pop = null, cur = null, rows = [], hi = -1, typed = '', typedAt = 0;

  function close(refocus) {
    if (!pop) return;
    const s = cur;
    pop.remove(); pop = null; cur = null; rows = []; hi = -1;
    if (s) { s.removeAttribute('aria-expanded'); if (refocus) try { s.focus({ preventScroll: true }); } catch (e) {} }
  }

  function setHi(i, scroll) {
    if (hi >= 0 && rows[hi]) rows[hi].el.classList.remove('hi');
    hi = i;
    if (hi >= 0 && rows[hi]) {
      rows[hi].el.classList.add('hi');
      if (scroll !== false) rows[hi].el.scrollIntoView({ block: 'nearest' });
    }
  }
  const enabledIdx = () => rows.map((r, i) => (r.opt && !r.opt.disabled ? i : -1)).filter(i => i >= 0);
  function move(dir) {
    const idx = enabledIdx(); if (!idx.length) return;
    const pos = idx.indexOf(hi);
    setHi(idx[pos < 0 ? (dir > 0 ? 0 : idx.length - 1) : Math.max(0, Math.min(idx.length - 1, pos + dir))]);
  }

  function choose(i) {
    const r = rows[i]; if (!r || !r.opt || r.opt.disabled) return;
    const s = cur, changed = s.selectedIndex !== r.opt.index;
    close(true);
    if (changed) {
      s.selectedIndex = r.opt.index;
      s.dispatchEvent(new Event('input', { bubbles: true }));
      s.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function open(s) {
    close(false);
    cur = s; s.setAttribute('aria-expanded', 'true');
    pop = document.createElement('div');
    pop.className = 'ds-pop'; pop.setAttribute('role', 'listbox'); pop.setAttribute('translate', 'no');
    rows = [];
    const addOpt = (o, indent) => {
      const el = document.createElement('div');
      el.className = 'ds-opt' + (indent ? ' ds-ind' : ''); el.setAttribute('role', 'option');
      el.setAttribute('aria-selected', o.selected ? 'true' : 'false');
      if (o.disabled) el.setAttribute('aria-disabled', 'true');
      const t = document.createElement('span'); t.className = 'ds-t'; t.textContent = (o.textContent || '').replace(/\s+/g, ' ').trim() || ' ';
      el.appendChild(t); el.insertAdjacentHTML('beforeend', CHECK);
      const idx = rows.push({ el, opt: o }) - 1;
      el.addEventListener('mousemove', () => { if (hi !== idx && !o.disabled) setHi(idx, false); });
      el.addEventListener('click', e => { e.stopPropagation(); choose(idx); });
      pop.appendChild(el);
    };
    [...s.children].forEach(ch => {
      if (ch.tagName === 'OPTGROUP') {
        const g = document.createElement('div'); g.className = 'ds-grp'; g.textContent = ch.label || ''; pop.appendChild(g);
        [...ch.children].forEach(o => { if (o.tagName === 'OPTION' && !o.hidden) addOpt(o, true); });
      } else if (ch.tagName === 'OPTION' && !ch.hidden) addOpt(ch, false);
    });
    pop.addEventListener('mousedown', e => e.preventDefault());   // Fokus bleibt am <select>
    pop.addEventListener('click', e => e.stopPropagation());      // schliesst z.B. das Einstellungen-Menü nicht
    document.body.appendChild(pop);

    // Positionieren: unter dem Feld, bei Platzmangel (und mehr Platz oben) darüber
    const r = s.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    pop.style.minWidth = Math.max(r.width, 96) + 'px';
    pop.style.maxHeight = '360px';
    const natural = pop.scrollHeight + 2;                 // Höhe ohne Begrenzung
    const below = vh - r.bottom - 12, above = r.top - 12;
    const up = natural > below && above > below;
    const room = up ? above : below;
    pop.style.maxHeight = Math.max(100, Math.min(360, room)) + 'px';
    const ph = pop.offsetHeight, pw = pop.offsetWidth;
    pop.style.top = (up ? Math.max(8, r.top - 4 - ph) : r.bottom + 4) + 'px';
    pop.style.left = Math.max(8, Math.min(r.left, vw - pw - 8)) + 'px';
    if (up) pop.classList.add('up');

    const sel = rows.findIndex(x => x.opt.selected);
    setHi(sel >= 0 ? sel : (enabledIdx()[0] ?? -1));
  }

  // Klick auf ein <select> → eigenes Popover statt Betriebssystem-Menü
  document.addEventListener('mousedown', e => {
    const s = e.target.closest && e.target.closest('select');
    if (pop && !(pop.contains(e.target)) && s !== cur) close(false);
    if (!eligible(s) || s.disabled || e.button !== 0) return;
    e.preventDefault();
    try { s.focus({ preventScroll: true }); } catch (err) {}
    if (pop && cur === s) close(false); else open(s);
  }, true);

  document.addEventListener('keydown', e => {
    if (pop) {
      const k = e.key;
      if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); return; }
      if (k === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); move(1); return; }
      if (k === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); move(-1); return; }
      if (k === 'Home') { e.preventDefault(); const i = enabledIdx(); if (i.length) setHi(i[0]); return; }
      if (k === 'End') { e.preventDefault(); const i = enabledIdx(); if (i.length) setHi(i[i.length - 1]); return; }
      if (k === 'Enter' || k === ' ') { e.preventDefault(); e.stopPropagation(); if (hi >= 0) choose(hi); else close(true); return; }
      if (k === 'Tab') { close(false); return; }
      if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { // Tipp-Suche
        const now = Date.now(); typed = (now - typedAt > 700 ? '' : typed) + k.toLowerCase(); typedAt = now;
        const idx = enabledIdx().find(i => rows[i].el.textContent.trim().toLowerCase().startsWith(typed));
        if (idx !== undefined) setHi(idx);
        e.preventDefault(); return;
      }
      return;
    }
    const s = e.target;
    if (s && s.tagName === 'SELECT' && eligible(s) && !s.disabled &&
        (e.key === ' ' || e.key === 'Enter' || (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')))) {
      e.preventDefault(); open(s);
    }
  }, true);

  window.addEventListener('resize', () => close(false));
  window.addEventListener('blur', () => close(false));
  document.addEventListener('scroll', e => { if (pop && !(e.target instanceof Node && pop.contains(e.target))) close(false); }, true);
  document.addEventListener('wheel', e => { if (pop && !pop.contains(e.target)) close(false); }, { passive: true, capture: true });

  window.DSelect = { open, close };
})();
