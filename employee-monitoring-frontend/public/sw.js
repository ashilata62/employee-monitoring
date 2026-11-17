// Service Worker for Employee Monitoring System
const CACHE_NAME = 'ems-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strictly NetworkOnly for all API endpoints, Socket.IO, and non-GET requests
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/socket.io') ||
    event.request.method !== 'GET'
  ) {
    return; // Pass through directly to network
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
