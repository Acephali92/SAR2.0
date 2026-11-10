// Zwei-Klick-Video (guidelines.md §14.11, Komponente VideoConsent.astro).
// Der fremde Player wird erst nach einem Klick geladen. Vorher stellt die
// Seite keine Verbindung zum Anbieter her. Es wird nichts gespeichert: kein
// Cookie, kein localStorage, jeder Seitenaufruf beginnt wieder beim
// Vorschaubild.
//
// Nur Adressen aus dieser Liste werden geladen. Sie muss zur CSP passen
// (frame-src in deploy/nginx.conf.example und deploy/Caddyfile.example).
const ALLOWED_EMBED_PREFIXES = ['https://odysee.com/$/embed/'];

function isAllowed(src) {
  return ALLOWED_EMBED_PREFIXES.some((prefix) => src.startsWith(prefix)) && !src.includes('..');
}

for (const wrapper of document.querySelectorAll('[data-video-consent]')) {
  const trigger = wrapper.querySelector('[data-video-trigger]');
  const frame = wrapper.querySelector('[data-video-frame]');
  const src = wrapper.getAttribute('data-embed-src') || '';
  if (!trigger || !frame || !isAllowed(src)) continue;

  trigger.addEventListener('click', (event) => {
    // Strg-/Cmd-/Shift-Klick und mittlere Maustaste: Link wie gewohnt in neuem Tab öffnen
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();

    const url = new URL(src);
    url.searchParams.set('autoplay', 'true');

    const iframe = document.createElement('iframe');
    iframe.src = url.toString();
    iframe.title = wrapper.getAttribute('data-title') || 'Video';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.className = 'absolute inset-0 h-full w-full border-0';

    frame.replaceChildren(iframe);
    iframe.focus();
  });
}
