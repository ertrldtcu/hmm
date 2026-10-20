'use strict';

(async () => {
  const b64 = (s, n) => typeof s === 'string' && s.length === n && /^[A-Za-z0-9_-]+$/.test(s);
  const valid = (p) => p && b64(p.d, 22) && b64(p.k, 43) && b64(p.b, 43);
  let pair = null;
  const q = new URLSearchParams(location.hash.slice(1));
  if (q.has('k')) {
    const p = { d: q.get('d'), k: q.get('k'), b: q.get('b') };
    if (valid(p)) {
      pair = p;
      try {
        localStorage.setItem('pair', JSON.stringify(p));
      } catch { }
    }
    history.replaceState(null, '', location.pathname + '#/');
  }
  if (!pair) {
    try {
      pair = JSON.parse(localStorage.getItem('pair'));
    } catch { }
  }
  if (!valid(pair)) return;
  navigator.storage?.persist?.();
  window.pair = pair;

  const bytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', bytes(pair.b), 'AES-GCM', false, ['decrypt']);
  const buf = new Uint8Array(await (await fetch('app.bin', { cache: 'no-cache' })).arrayBuffer());
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.subarray(0, 12),
    additionalData: new TextEncoder().encode('app') }, key, buf.subarray(12));
  const app = JSON.parse(new TextDecoder().decode(plain));
  document.head.append(Object.assign(document.createElement('style'), { textContent: app.css }));
  document.body.insertAdjacentHTML('afterbegin', app.html);
  for (const js of app.js) document.body.append(Object.assign(document.createElement('script'), { textContent: js }));
})();
