
const CACHE_NAME = 'butterfly-ws-v15'; 

const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/game.js',
  '/audio/ambience/rain.mp3',
  '/audio/ambience/wind.mp3',
  '/audio/ambience/birds.mp3',
  '/audio/lofi/chill.mp3',
  '/audio/lofi/sleepy.mp3',
  '/audio/lofi/piano.mp3',
  '/images/icon-192.png',
  '/images/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keyList) => {
    return Promise.all(keyList.map((key) => {
      if (key !== CACHE_NAME) return caches.delete(key);
    }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((response) => response || fetch(e.request)));
});