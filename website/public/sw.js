const CACHE_NAME = 'roaster-v1';
const STATIC_ASSETS = [
  '/m',
  '/m/schedule',
  '/m/clock',
  '/m/time-off',
  '/m/shifts',
  '/m/profile',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests (always go to network)
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    tag: data.tag,
    data: data.data,
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Roaster', options));
});

// Notification click event — route to the appropriate page based on notification type
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data || {};
  let url = '/dashboard';
  if (data.type === 'ROSTER_PUBLISHED') url = '/dashboard/rosters';
  if (data.type === 'SHIFT_CHANGED') url = '/dashboard/rosters';
  if (data.type === 'SHIFT_CLAIMED') url = '/dashboard/marketplace/approvals';
  if (data.type === 'APPROVAL_NEEDED') url = '/dashboard/marketplace/approvals';
  if (data.type === 'TIME_OFF_APPROVED' || data.type === 'TIME_OFF_REJECTED') url = '/m/time-off';
  event.waitUntil(clients.openWindow(url));
});

// Background sync for offline clock-in/out
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-clock-events') {
    event.waitUntil(syncClockEvents());
  }
});

async function syncClockEvents() {
  try {
    // Get pending clock events from IndexedDB
    const db = await openDB();
    const events = await getAll(db, 'pendingClockEvents');

    for (const clockEvent of events) {
      try {
        const response = await fetch('/api/mobile/clock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clockEvent),
        });

        if (response.ok) {
          // Remove synced event from IndexedDB
          await remove(db, 'pendingClockEvents', clockEvent.id);
        }
      } catch {
        // Keep in queue for next sync
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Simple IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('roaster-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingClockEvents')) {
        db.createObjectStore('pendingClockEvents', { keyPath: 'id' });
      }
    };
  });
}

function getAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function remove(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
