/// <reference lib="webworker" />

/**
 * Studek PWA Service Worker
 *
 * Implements:
 * - Cache-first strategy for static assets (CSS, JS, images)
 * - Network-first strategy for API calls with cache fallback
 * - Stale-while-revalidate for HTML pages
 * - Offline fallback page
 * - Background sync for failed API requests
 * - Periodic sync for data freshness
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `studek-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `studek-dynamic-${CACHE_VERSION}`;
const API_CACHE = `studek-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `studek-images-${CACHE_VERSION}`;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/study",
  "/create",
  "/analytics",
  "/library",
  "/explore",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/favicon.svg",
];

// Cache size limits
const CACHE_LIMITS = {
  [DYNAMIC_CACHE]: 50,
  [API_CACHE]: 100,
  [IMAGE_CACHE]: 100,
};

// Helper: Limit cache size
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxItems);
  }
}

// Helper: Check if request is for navigation
function isNavigationRequest(request) {
  return request.mode === "navigate";
}

// Helper: Check if request is for API
function isApiRequest(request) {
  return request.url.includes("/api/");
}

// Helper: Check if request is for static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/i) ||
    url.pathname.startsWith("/_next/static/")
  );
}

// Helper: Check if request is for image
function isImageRequest(request) {
  return request.destination === "image" || request.url.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i);
}

// Install event - Pre-cache essential assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);

      // Pre-cache assets individually to handle failures gracefully
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
          console.log(`[SW] Cached: ${asset}`);
        } catch (error) {
          console.warn(`[SW] Failed to cache: ${asset}`, error);
        }
      }

      // Activate immediately
      await self.skipWaiting();
      console.log("[SW] Installation complete");
    })()
  );
});

// Activate event - Clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    (async () => {
      // Get all cache names
      const cacheNames = await caches.keys();

      // Delete old caches
      await Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith("studek-") &&
              ![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE].includes(name)
            );
          })
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );

      // Claim all clients
      await self.clients.claim();
      console.log("[SW] Activation complete");
    })()
  );
});

// Fetch event - Handle requests with appropriate strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith("http")) {
    return;
  }

  // Handle different request types with appropriate strategies
  if (isApiRequest(request)) {
    // Network-first for API requests
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (isStaticAsset(request)) {
    // Cache-first for static assets
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (isImageRequest(request)) {
    // Cache-first for images
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (isNavigationRequest(request)) {
    // Stale-while-revalidate for navigation
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
  } else {
    // Network-first for everything else
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  }
});

// Strategy: Cache-first (static assets)
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Return cached response and update in background
    updateCacheInBackground(request, cacheName);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, CACHE_LIMITS[cacheName] || 50);
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] Cache-first fetch failed:", error);
    return createOfflineResponse();
  }
}

// Strategy: Network-first (API calls)
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, CACHE_LIMITS[cacheName] || 50);
    }

    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // For API requests, return a JSON error
    if (isApiRequest(request)) {
      return new Response(
        JSON.stringify({
          error: "offline",
          message: "You are currently offline. Please check your connection.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return createOfflineResponse();
  }
}

// Strategy: Stale-while-revalidate (navigation)
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Always try to fetch fresh version
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(async () => {
      // If network fails and we have cache, return that
      if (cachedResponse) {
        return cachedResponse;
      }
      // Otherwise return offline page
      return createOfflineResponse();
    });

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Background cache update
function updateCacheInBackground(request, cacheName) {
  fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(cacheName);
        await cache.put(request, response);
      }
    })
    .catch(() => {
      // Silently fail background updates
    });
}

// Create offline response
function createOfflineResponse() {
  const offlineHTML = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Studek</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    p {
      color: #a1a1aa;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    button {
      background: #6366f1;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #5558e3;
    }
    .status {
      margin-top: 20px;
      font-size: 14px;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
      </svg>
    </div>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Don't worry, your study progress is saved locally.</p>
    <button onclick="window.location.reload()">Try Again</button>
    <p class="status">Waiting for connection...</p>
  </div>
  <script>
    window.addEventListener('online', () => window.location.reload());
  </script>
</body>
</html>
  `;

  return new Response(offlineHTML, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] Skipping waiting...");
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
    );
  }
});

// Background Sync - Retry failed requests
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-reviews") {
    event.waitUntil(syncPendingReviews());
  }
});

// Sync pending reviews (placeholder for future implementation)
async function syncPendingReviews() {
  // This would sync any pending review data stored in IndexedDB
  console.log("[SW] Syncing pending reviews...");
}

// Periodic Background Sync - Keep data fresh
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "refresh-decks") {
    event.waitUntil(refreshDecksCache());
  }
});

// Refresh decks cache (placeholder for future implementation)
async function refreshDecksCache() {
  console.log("[SW] Refreshing decks cache...");
}

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error("[SW] Failed to parse push data:", e);
    return;
  }

  console.log("[SW] Received push notification:", data.title);

  // Build notification options based on type
  const options = {
    body: data.body || "Time to review your flashcards!",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/icon-96x96.png",
    vibrate: [100, 50, 100],
    tag: data.tag || "studek-notification",
    renotify: true,
    requireInteraction: data.tag === "streak_warning", // Keep streak warnings visible
    data: {
      url: data.url || "/study",
      type: data.tag || "general",
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: "study", title: "Study Now", icon: "/icons/study-action.png" },
      { action: "later", title: "Later", icon: "/icons/later-action.png" },
    ],
  };

  // Add image for weekly summary
  if (data.tag === "weekly_summary" && data.image) {
    options.image = data.image;
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Studek", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/study";
  const action = event.action;

  console.log("[SW] Notification clicked:", { action, url });

  // Handle different actions
  if (action === "later") {
    // User chose "Later" - just close the notification
    // Optionally, we could schedule a reminder here
    return;
  }

  // For "study" action or click on the notification body
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && "focus" in client) {
            // Navigate existing window to the URL
            client.navigate(url);
            return client.focus();
          }
        }
        // No window open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close (user dismissed without clicking)
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification dismissed:", event.notification.tag);
});

console.log("[SW] Service worker loaded");
