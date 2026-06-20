const CACHE_NAME = 'mapa-cache-v1';

const ARCHIVOS_ESTATICOS = [
    '/mapa.php',
    '/css/styles.css',
    '/json/datos.json',
    '/json/GeoTec.js', 
    '/img/logo.png',
    //leaflet
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

// ==========================================
//              INSTALACIÓN
// ==========================================
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caché abierto y guardando archivos base');
        return cache.addAll(ARCHIVOS_ESTATICOS);
      })
  );
  self.skipWaiting(); 
});

// ==========================================
//              ACTIVACIÓN
// ==========================================
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nombresDeCache) => {
      return Promise.all(
        nombresDeCache.map((nombreCache) => {
          if (nombreCache !== CACHE_NAME) {
            console.log('Borrando caché antiguo:', nombreCache);
            return caches.delete(nombreCache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ==========================================
//                  FETCH
// ==========================================
self.addEventListener('fetch', (evento) => {
  evento.respondWith(
    // Buscar en cache
    caches.match(evento.request)
      .then((respuestaCache) => {
        // retornar offline
        if (respuestaCache) {
          return respuestaCache;
        }

        // fetch web
        return fetch(evento.request).then((respuestaRed) => {
            if(!respuestaRed || respuestaRed.status !== 200 || respuestaRed.type !== 'basic') {
              return respuestaRed;
            }

            var respuestaAClonar = respuestaRed.clone();

            // save cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(evento.request, respuestaAClonar);
              });

            return respuestaRed;
        });
      })
  );
});