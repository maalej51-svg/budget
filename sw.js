// sw.js — Service Worker for Budget Famille PWA
const CACHE  = ‘budget-famille-v2’;
const ASSETS = [
‘./’,
‘./index.html’,
‘./manifest.json’,
‘https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap’
];

// ── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener(‘install’, e => {
e.waitUntil(
caches.open(CACHE)
.then(c => c.addAll(ASSETS).catch(() => {}))
);
self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener(‘activate’, e => {
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
)
);
self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener(‘fetch’, e => {

// ── Google Apps Script API : network-first, fallback silencieux ──
if (e.request.url.includes(‘script.google.com’)) {
e.respondWith(
fetch(e.request)
.then(resp => resp)
.catch(() =>
// Retourne une reponse vide valide — PAS d’erreur affichee
new Response(
JSON.stringify({ ok:false, offline:true, rev:[], dep:[], goals:[] }),
{ status:200, headers:{ ‘Content-Type’:‘application/json’ } }
)
)
);
return;
}

// ── Google Fonts : network-first, fallback cache ──
if (e.request.url.includes(‘fonts.googleapis.com’) || e.request.url.includes(‘fonts.gstatic.com’)) {
e.respondWith(
fetch(e.request)
.then(resp => {
const clone = resp.clone();
caches.open(CACHE).then(c => c.put(e.request, clone));
return resp;
})
.catch(() => caches.match(e.request))
);
return;
}

// ── App shell : cache-first ──
e.respondWith(
caches.match(e.request).then(cached => {
if (cached) return cached;
return fetch(e.request)
.then(resp => {
const clone = resp.clone();
caches.open(CACHE).then(c => c.put(e.request, clone));
return resp;
})
.catch(() => caches.match(’./index.html’));
})
);
});