const CACHE_NAME = 'khlp-v7';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/logo192.svg',
  '/logo512.svg',
  '/logo.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // For navigation requests, serve index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        
        return fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for beforeinstallprompt event
self.addEventListener('beforeinstallprompt', (event) => {
  // Store the event for the main thread to use
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'INSTALL_PROMPT_AVAILABLE',
          event: event
        });
      });
    })
  );
});

// Listen for appinstalled event
self.addEventListener('appinstalled', (event) => {
  console.log('PWA was installed');
  // Notify all clients that the app was installed
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'APP_INSTALLED'
        });
      });
    })
  );
});