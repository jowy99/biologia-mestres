// Utilitats compartides: emmagatzematge segur i tema clar/fosc
window.store = {
  get(k, d) { try { const v = localStorage.getItem('bio:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('bio:' + k, JSON.stringify(v)); } catch (e) { /* sense emmagatzematge */ } }
};
(function () {
  const t = store.get('theme', null);
  if (t) document.documentElement.dataset.theme = t;
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.querySelector('.theme-toggle');
    if (!b) return;
    const isDark = () => document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    const paint = () => { b.innerHTML = isDark() ? SUN : MOON; b.setAttribute('aria-label', isDark() ? 'Activa el mode clar' : 'Activa el mode fosc'); };
    paint();
    b.addEventListener('click', () => {
      const n = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = n; store.set('theme', n); paint();
    });
  });
})();

// Joc d'icones únic (traç, mateix gruix, color del text). Ús: ICON('nom')
window.ICON = (function () {
  const P = {
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>',
    microscope: '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>',
    scale: '<path d="m16 16 3-8 3 8c-.9.6-1.9 1-3 1s-2.1-.4-3-1Z"/><path d="m2 16 3-8 3 8c-.9.6-1.9 1-3 1s-2.1-.4-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    cards: '<rect x="2" y="7" width="14" height="14" rx="2"/><path d="M8 3h12a2 2 0 0 1 2 2v12"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    shapes: '<path d="M8.3 10a.7.7 0 0 1-.6-1.1L11.4 3a.7.7 0 0 1 1.2 0l3.7 5.9a.7.7 0 0 1-.6 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/>',
    type: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    eyeoff: '<path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"/><path d="M10.7 5.1A10 10 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-1.7 2.7"/><path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/><path d="M12 15v4"/>',
    shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
    swap: '<path d="M7 4 3 8l4 4"/><path d="M3 8h14"/><path d="m17 20 4-4-4-4"/><path d="M21 16H7"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    bars: '<path d="M5 20v-6M10 20V10M15 20V4M20 20v-8"/>',
    'd-book': '<path class="d" d="M3 5.5C5.5 4.5 8.5 4.5 12 6.5v13c-3.5-2-6.5-2-9-1zM21 5.5c-2.5-1-5.5-1-9 1v13c3.5-2 6.5-2 9-1z"/><path d="M3 5.5C5.5 4.5 8.5 4.5 12 6.5c3.5-2 6.5-2 9-1v13c-2.5-1-5.5-1-9 1-3.5-2-6.5-2-9-1z"/><path d="M12 6.5v13"/>',
    'd-cell': '<ellipse class="d" cx="12" cy="12" rx="9.5" ry="8"/><ellipse cx="12" cy="12" rx="9.5" ry="8"/><circle cx="10.5" cy="11" r="3" fill="currentColor" stroke="none"/><circle cx="16.5" cy="15" r="1"/><circle cx="7" cy="15.5" r=".8"/>',
    'd-trophy': '<path class="d" d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4M17 6h2.5a2.5 2.5 0 0 1-2.6 4"/><path d="M12 14v4M8 20h8"/>',
    'd-cards': '<rect class="d" x="3" y="7" width="13" height="14" rx="2"/><rect x="3" y="7" width="13" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3"/>',
    'd-bacteri': '<rect class="d" x="3.5" y="8" width="14" height="8" rx="4" transform="rotate(-30 10.5 12)"/><rect x="3.5" y="8" width="14" height="8" rx="4" transform="rotate(-30 10.5 12)"/><path d="M16.8 7.2c1.4-1.2 1.1-3 2.6-3.6s2.1.9 3.1.4"/><path d="M9 13h.01M12.5 10.5h.01"/>',
    'd-alga': '<path class="d" d="M12 21c-1.5-4 1.5-7 0-11s1-7 1-7c2.5 3 3.5 6.5 1.5 10s-.5 5-2.5 8z"/><path d="M12 21c-1.5-4 1.5-7 0-11s1-7 1-7"/><path d="M12 21c-4-2.5-6-6-5-10.5"/><path d="M12 21c4-2 6.5-5.5 6.5-10"/>',
    'd-bolet': '<path class="d" d="M3 12a9 7 0 0 1 18 0z"/><path d="M3 12a9 7 0 0 1 18 0z"/><path d="M9.5 12v6.5a2.5 2.5 0 0 0 5 0V12"/><circle cx="9" cy="8.5" r=".9" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7.5" r=".9" fill="currentColor" stroke="none"/>',
    'd-fulla': '<path class="d" d="M5 19C5 10 10 4 20 4c0 10-6 15-15 15z"/><path d="M5 19C5 10 10 4 20 4c0 10-6 15-15 15z"/><path d="M5 19 14 10"/>',
    'd-pota': '<ellipse class="d" cx="12" cy="16" rx="4.5" ry="3.8"/><ellipse cx="12" cy="16" rx="4.5" ry="3.8"/><circle cx="5.8" cy="10.8" r="1.8"/><circle cx="9.6" cy="6.8" r="1.8"/><circle cx="14.4" cy="6.8" r="1.8"/><circle cx="18.2" cy="10.8" r="1.8"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3"/><path d="m16 7 3 3"/><path d="m19 4 2 2"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    reset: '<path d="M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8"/><path d="M3 3v5h5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    tick: '<path d="M20 6 9 17l-5-5"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/>'
  };
  return name => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`;
})();
// Substitueix <i data-i="nom"></i> de l'HTML per la seva icona
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('i[data-i]').forEach(el => { el.outerHTML = ICON(el.dataset.i); });
});

// Registra el Service Worker (solo HTTPS)
(function () {
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  var src = document.currentScript ? document.currentScript.src : '';
  if (!src) return;
  var swUrl = new URL('../sw.js', src);
  navigator.serviceWorker.register(swUrl).catch(function () { /* SW no disponible */ });
})();
