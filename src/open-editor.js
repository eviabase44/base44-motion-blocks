// A classic script can run when index.html is opened directly from Finder.
// The editor itself needs HTTP for fonts, modules and its local AI endpoints.
(() => {
  const script = document.currentScript;
  if (location.protocol === 'file:') {
    const target = new URL('http://127.0.0.1:8782/index.html');
    target.search = location.search;
    target.hash = location.hash;
    // Preserve a saved edit made from a file tab, rebasing only this app's assets.
    const assetRoot = new URL('../assets/', script.src).href;
    const hash = new URLSearchParams(target.hash.slice(1));
    try {
      const encoded = hash.get('payload');
      if (encoded) {
        const payload = JSON.parse(encoded);
        const rebase = value => typeof value === 'string' && value.startsWith(assetRoot)
          ? new URL('assets/' + value.slice(assetRoot.length), target).href : value;
        if (payload.typography) payload.typography.src = rebase(payload.typography.src);
        const slots = [payload.media?.hero, payload.media?.feature, ...(payload.media?.features ?? []), ...(payload.cards ?? []).map(card => card.media)];
        for (const slot of slots) if (slot) slot.src = rebase(slot.src);
        hash.set('payload', JSON.stringify(payload));
        target.hash = hash.toString();
      }
    } catch { /* Let the HTTP editor report malformed saved content. */ }
    location.replace(target.href);
    return;
  }
  const module = document.createElement('script');
  module.type = 'module';
  module.src = new URL('./studio.js', script.src).href;
  document.body.append(module);
})();
