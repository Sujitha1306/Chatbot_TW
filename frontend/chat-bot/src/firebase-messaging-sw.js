importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyA4GogMguLRpd0wSXG8HfGbqW2pb_-Ko0g",
  authDomain: "twfirebase-v1.firebaseapp.com",
  projectId: "twfirebase-v1",
  storageBucket: "twfirebase-v1.appspot.com",
  messagingSenderId: "412793295863",
  appId: "1:412793295863:web:0a7dbaf93140f58f6ad4f2",
  measurementId: "G-73D8MBGX9F",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  const msgType = JSON.parse(payload.data?.additionalInfo);
  const notificationTitle = payload.notification?.title;
  let actions = [];
  if (msgType.isCalling) {
    actions = [
      { action: 'attend', title: '✔ Join Meeting' },
      { action: 'reject', title: '✖ Dismiss' }
    ];
  }

  const notificationOptions = {
    body: payload.notification?.body,
    icon: payload.notification?.icon,
    data: {
      ...payload.data,
      fcmOptions: payload.fcmOptions
    },
    requireInteraction: true,
    actions
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data = JSON.parse(event.data?.additionalInfo) || {};
  let targetUrl = '';
  if(data.identifyingType === 'RQT-AMB'){
    targetUrl = '/ovitag/workflow/ambulance';
  }
  if (action === 'attend') {
    if (data && targetUrl) {
      let callData = {
        "channelName": data.channelName,
        "token": data.token,
        "meetingId": data.meetingId
      }
      targetUrl += `?callId=${encodeURIComponent(callData)}`;
    }
  } else if (action === 'reject') {
    targetUrl
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/ovitag/workflow')) {
          client.postMessage({ action, data });
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// Cache OpenStreetMap and basemap tiles to speed up reloading
const MAP_TILES_CACHE = 'osm-map-tiles-v1';

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  if (url.includes('tile.openstreetmap.org') || url.includes('basemaps.cartocdn.com')) {
    event.respondWith(
      caches.open(MAP_TILES_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
  }
});