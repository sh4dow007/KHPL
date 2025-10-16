const CACHE_NAME = 'khlp-v2';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.svg',
  '/logo512.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  try {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Opened cache');
          return cache.addAll(urlsToCache);
        })
        .catch((error) => {
          console.error('Error caching resources:', error);
        })
    );
  } catch (error) {
    console.error('Error in install event:', error);
  }
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  try {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          if (response) {
            return response;
          }
          return fetch(event.request).catch(() => {
            // If fetch fails, return a basic offline page
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
        })
        .catch((error) => {
          console.error('Error in fetch event:', error);
          return fetch(event.request);
        })
    );
  } catch (error) {
    console.error('Error handling fetch:', error);
    return fetch(event.request);
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  try {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }).catch((error) => {
        console.error('Error cleaning up caches:', error);
      })
    );
  } catch (error) {
    console.error('Error in activate event:', error);
  }
});
