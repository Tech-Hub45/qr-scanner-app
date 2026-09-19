const CACHE_NAME = 'litescan-v4';
const urlsToCache = [
  './',
  './index.html',
  './data/help-guides.html',
  './components/footer.html',
  './css/styles/main.css',
  './js/app.js',
  './pwa/manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap',
  'https://unpkg.com/lucide@latest'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Failed to cache some files:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Warm up cache with offline-fallback just in case
      cache.add('./index.html');
    }),
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin) && 
      !request.url.includes('googleapis.com') &&
      !request.url.includes('jsdelivr.net') &&
      !request.url.includes('cdnjs.cloudflare.com') &&
      !request.url.includes('fonts.gstatic.com') &&
      !request.url.includes('unpkg.com')) {
    return;
  }

  // Network first for API calls, cache first for assets
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          // Don't cache invalid responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Offline fallback
          if (request.destination === 'document') {
            return caches.match('./index.html');
          }
          return null;
        });
      })
    );
  }
});
