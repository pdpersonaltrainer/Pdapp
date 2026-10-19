/* PDapp - Service Worker
   IMPORTANTE: este SW NO cachea nada a propósito.
   Solo maneja notificaciones push. Si cacheara archivos, rompería
   el auto-actualizador de versiones de la app en iOS.

   v2 (2026-10-19): tocar la notificación lleva al lugar exacto
   (chat, video, día del plan…) aunque la app ya esté abierta. */

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
  var url = d.url || '/';
  var opts = {
    body: d.body || '',
    icon: d.icon || '/icon.png',
    badge: '/icon.png',
    /* Una etiqueta por destino: los mensajes del mismo chat se agrupan,
       pero un video no pisa a un mensaje de otro alumno. */
    tag: d.tag || ('pd-' + url),
    renotify: true,
    data: { url: url }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

/* El usuario toca la notificación */
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || '/';
  var abs = new URL(target, self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
      for (var i=0; i<list.length; i++){
        var c = list[i];
        if ('focus' in c){
          /* La app ya está abierta: la traemos al frente y le decimos qué abrir */
          return c.focus().then(function(fc){
            try { (fc || c).postMessage({ type:'pd-open', url: abs }); } catch(err){}
            return fc;
          });
        }
      }
      /* La app estaba cerrada: se abre directo en el destino */
      if (self.clients.openWindow) return self.clients.openWindow(abs);
    })
  );
});
