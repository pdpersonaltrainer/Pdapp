/* PDapp - Service Worker
   IMPORTANTE: este SW NO cachea nada a propósito.
   Solo maneja notificaciones push. Si cacheara archivos, rompería
   el auto-actualizador de versiones de la app en iOS. */

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(self.clients.claim());
});

/* Llega una notificación push */
self.addEventListener('push', function(e){
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch(err){
    try { d = { body: e.data.text() }; } catch(err2){ d = {}; }
  }
  var title = d.title || 'PDapp';
  var opts = {
    body: d.body || '',
    icon: d.icon || '/icon.png',
    badge: '/icon.png',
    tag: d.tag || 'pdapp',
    renotify: true,
    data: { url: d.url || '/' }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

/* El usuario toca la notificación */
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
      for (var i=0; i<list.length; i++){
        if ('focus' in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
