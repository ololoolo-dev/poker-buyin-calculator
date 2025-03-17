const CACHE_NAME = 'poker-game-tracker-v1';
const urlsToCache = [
    '/poker-game-tracker/',
    '/poker-game-tracker/index.html',
    '/poker-game-tracker/styles.css',
    '/poker-game-tracker/script.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    '/poker-game-tracker/icon-192x192.png',
    '/poker-game-tracker/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
