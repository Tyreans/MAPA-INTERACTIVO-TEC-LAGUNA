// ============================================================
// Service Worker para UNIMAP - Mapa Interactivo ITL
// Cache Offline completo para despliegue en GitHub Pages
// ============================================================

const CACHE_NAME = 'unimap-cache-v3';

// Recursos esenciales de la aplicación
const ARCHIVOS_CORE = [
    "./",
    "./index.html",
    "./css/styles.css",
    "./manifest.json",
    "./json/datos.json",
    "./json/GeoTec.js",
    "./js/main.js",
    "./img/logo-tecnm.png",
    "./img/logo.png",
    "./img/logo-192.png",
    "./img/logo-512.png",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
];

// Imágenes de edificios y logos del campus
const IMAGENES_CAMPUS = [
    "./img/18/1.jpeg",
    "./img/18/2.jpeg",
    "./img/19/1.jpg",
    "./img/19/2.jpg",
    "./img/19/3.jpg",
    "./img/19/4.jpg",
    "./img/19/img_6a174baa7d930.jpg",
    "./img/1A/img_6a34d5bfc1e8c.jpg",
    "./img/29/img_6a174ac73a269.jpg",
    "./img/34/1.jpg",
    "./img/37/img_6a172d5515020.jpg",
    "./img/38/img_6a17479a24489.png",
    "./img/5/1.jpeg",
    "./img/5/2.jpg",
    "./img/CI/img_6a17093fc202e.jpg",
    "./img/CI/img_6a17164fa8907.jpg",
    "./img/CI/img_6a17169a50be9.jpg",
    "./img/CI/img_6a1716dc24291.jpg",
    "./img/D6/img_6a17248c03b34.jpg",
    "./img/D6/img_6a1724911280e.jpg",
    "./img/login.jpg",
    "./img/logo-192.png",
    "./img/logo-512.png",
    "./img/logo-tecnm.png",
    "./img/logo.png"
];

// Teselas satelitales procesadas en QGIS para renderizado offline completo
const TESELAS_MAPA = [
    "./Teselas/15/6968/13978.jpg",
    "./Teselas/15/6968/13979.jpg",
    "./Teselas/15/6969/13978.jpg",
    "./Teselas/15/6969/13979.jpg",
    "./Teselas/16/13937/27957.jpg",
    "./Teselas/16/13937/27958.jpg",
    "./Teselas/16/13938/27957.jpg",
    "./Teselas/16/13938/27958.jpg",
    "./Teselas/17/27874/55914.jpg",
    "./Teselas/17/27874/55915.jpg",
    "./Teselas/17/27874/55916.jpg",
    "./Teselas/17/27874/55917.jpg",
    "./Teselas/17/27875/55914.jpg",
    "./Teselas/17/27875/55915.jpg",
    "./Teselas/17/27875/55916.jpg",
    "./Teselas/17/27875/55917.jpg",
    "./Teselas/17/27876/55914.jpg",
    "./Teselas/17/27876/55915.jpg",
    "./Teselas/17/27876/55916.jpg",
    "./Teselas/17/27876/55917.jpg",
    "./Teselas/17/27877/55914.jpg",
    "./Teselas/17/27877/55915.jpg",
    "./Teselas/17/27877/55916.jpg",
    "./Teselas/17/27877/55917.jpg",
    "./Teselas/18/55749/111829.jpg",
    "./Teselas/18/55749/111830.jpg",
    "./Teselas/18/55749/111831.jpg",
    "./Teselas/18/55749/111832.jpg",
    "./Teselas/18/55749/111833.jpg",
    "./Teselas/18/55749/111834.jpg",
    "./Teselas/18/55749/111835.jpg",
    "./Teselas/18/55750/111829.jpg",
    "./Teselas/18/55750/111830.jpg",
    "./Teselas/18/55750/111831.jpg",
    "./Teselas/18/55750/111832.jpg",
    "./Teselas/18/55750/111833.jpg",
    "./Teselas/18/55750/111834.jpg",
    "./Teselas/18/55750/111835.jpg",
    "./Teselas/18/55751/111829.jpg",
    "./Teselas/18/55751/111830.jpg",
    "./Teselas/18/55751/111831.jpg",
    "./Teselas/18/55751/111832.jpg",
    "./Teselas/18/55751/111833.jpg",
    "./Teselas/18/55751/111834.jpg",
    "./Teselas/18/55751/111835.jpg",
    "./Teselas/18/55752/111829.jpg",
    "./Teselas/18/55752/111830.jpg",
    "./Teselas/18/55752/111831.jpg",
    "./Teselas/18/55752/111832.jpg",
    "./Teselas/18/55752/111833.jpg",
    "./Teselas/18/55752/111834.jpg",
    "./Teselas/18/55752/111835.jpg",
    "./Teselas/18/55753/111829.jpg",
    "./Teselas/18/55753/111830.jpg",
    "./Teselas/18/55753/111831.jpg",
    "./Teselas/18/55753/111832.jpg",
    "./Teselas/18/55753/111833.jpg",
    "./Teselas/18/55753/111834.jpg",
    "./Teselas/18/55753/111835.jpg",
    "./Teselas/18/55754/111829.jpg",
    "./Teselas/18/55754/111830.jpg",
    "./Teselas/18/55754/111831.jpg",
    "./Teselas/18/55754/111832.jpg",
    "./Teselas/18/55754/111833.jpg",
    "./Teselas/18/55754/111834.jpg",
    "./Teselas/18/55754/111835.jpg",
    "./Teselas/18/55755/111829.jpg",
    "./Teselas/18/55755/111830.jpg",
    "./Teselas/18/55755/111831.jpg",
    "./Teselas/18/55755/111832.jpg",
    "./Teselas/18/55755/111833.jpg",
    "./Teselas/18/55755/111834.jpg",
    "./Teselas/18/55755/111835.jpg",
    "./Teselas/19/111498/223658.jpg",
    "./Teselas/19/111498/223659.jpg",
    "./Teselas/19/111498/223660.jpg",
    "./Teselas/19/111498/223661.jpg",
    "./Teselas/19/111498/223662.jpg",
    "./Teselas/19/111498/223663.jpg",
    "./Teselas/19/111498/223664.jpg",
    "./Teselas/19/111498/223665.jpg",
    "./Teselas/19/111498/223666.jpg",
    "./Teselas/19/111498/223667.jpg",
    "./Teselas/19/111498/223668.jpg",
    "./Teselas/19/111498/223669.jpg",
    "./Teselas/19/111498/223670.jpg",
    "./Teselas/19/111499/223658.jpg",
    "./Teselas/19/111499/223659.jpg",
    "./Teselas/19/111499/223660.jpg",
    "./Teselas/19/111499/223661.jpg",
    "./Teselas/19/111499/223662.jpg",
    "./Teselas/19/111499/223663.jpg",
    "./Teselas/19/111499/223664.jpg",
    "./Teselas/19/111499/223665.jpg",
    "./Teselas/19/111499/223666.jpg",
    "./Teselas/19/111499/223667.jpg",
    "./Teselas/19/111499/223668.jpg",
    "./Teselas/19/111499/223669.jpg",
    "./Teselas/19/111499/223670.jpg",
    "./Teselas/19/111500/223658.jpg",
    "./Teselas/19/111500/223659.jpg",
    "./Teselas/19/111500/223660.jpg",
    "./Teselas/19/111500/223661.jpg",
    "./Teselas/19/111500/223662.jpg",
    "./Teselas/19/111500/223663.jpg",
    "./Teselas/19/111500/223664.jpg",
    "./Teselas/19/111500/223665.jpg",
    "./Teselas/19/111500/223666.jpg",
    "./Teselas/19/111500/223667.jpg",
    "./Teselas/19/111500/223668.jpg",
    "./Teselas/19/111500/223669.jpg",
    "./Teselas/19/111500/223670.jpg",
    "./Teselas/19/111501/223658.jpg",
    "./Teselas/19/111501/223659.jpg",
    "./Teselas/19/111501/223660.jpg",
    "./Teselas/19/111501/223661.jpg",
    "./Teselas/19/111501/223662.jpg",
    "./Teselas/19/111501/223663.jpg",
    "./Teselas/19/111501/223664.jpg",
    "./Teselas/19/111501/223665.jpg",
    "./Teselas/19/111501/223666.jpg",
    "./Teselas/19/111501/223667.jpg",
    "./Teselas/19/111501/223668.jpg",
    "./Teselas/19/111501/223669.jpg",
    "./Teselas/19/111501/223670.jpg",
    "./Teselas/19/111502/223658.jpg",
    "./Teselas/19/111502/223659.jpg",
    "./Teselas/19/111502/223660.jpg",
    "./Teselas/19/111502/223661.jpg",
    "./Teselas/19/111502/223662.jpg",
    "./Teselas/19/111502/223663.jpg",
    "./Teselas/19/111502/223664.jpg",
    "./Teselas/19/111502/223665.jpg",
    "./Teselas/19/111502/223666.jpg",
    "./Teselas/19/111502/223667.jpg",
    "./Teselas/19/111502/223668.jpg",
    "./Teselas/19/111502/223669.jpg",
    "./Teselas/19/111502/223670.jpg",
    "./Teselas/19/111503/223658.jpg",
    "./Teselas/19/111503/223659.jpg",
    "./Teselas/19/111503/223660.jpg",
    "./Teselas/19/111503/223661.jpg",
    "./Teselas/19/111503/223662.jpg",
    "./Teselas/19/111503/223663.jpg",
    "./Teselas/19/111503/223664.jpg",
    "./Teselas/19/111503/223665.jpg",
    "./Teselas/19/111503/223666.jpg",
    "./Teselas/19/111503/223667.jpg",
    "./Teselas/19/111503/223668.jpg",
    "./Teselas/19/111503/223669.jpg",
    "./Teselas/19/111503/223670.jpg",
    "./Teselas/19/111504/223658.jpg",
    "./Teselas/19/111504/223659.jpg",
    "./Teselas/19/111504/223660.jpg",
    "./Teselas/19/111504/223661.jpg",
    "./Teselas/19/111504/223662.jpg",
    "./Teselas/19/111504/223663.jpg",
    "./Teselas/19/111504/223664.jpg",
    "./Teselas/19/111504/223665.jpg",
    "./Teselas/19/111504/223666.jpg",
    "./Teselas/19/111504/223667.jpg",
    "./Teselas/19/111504/223668.jpg",
    "./Teselas/19/111504/223669.jpg",
    "./Teselas/19/111504/223670.jpg",
    "./Teselas/19/111505/223658.jpg",
    "./Teselas/19/111505/223659.jpg",
    "./Teselas/19/111505/223660.jpg",
    "./Teselas/19/111505/223661.jpg",
    "./Teselas/19/111505/223662.jpg",
    "./Teselas/19/111505/223663.jpg",
    "./Teselas/19/111505/223664.jpg",
    "./Teselas/19/111505/223665.jpg",
    "./Teselas/19/111505/223666.jpg",
    "./Teselas/19/111505/223667.jpg",
    "./Teselas/19/111505/223668.jpg",
    "./Teselas/19/111505/223669.jpg",
    "./Teselas/19/111505/223670.jpg",
    "./Teselas/19/111506/223658.jpg",
    "./Teselas/19/111506/223659.jpg",
    "./Teselas/19/111506/223660.jpg",
    "./Teselas/19/111506/223661.jpg",
    "./Teselas/19/111506/223662.jpg",
    "./Teselas/19/111506/223663.jpg",
    "./Teselas/19/111506/223664.jpg",
    "./Teselas/19/111506/223665.jpg",
    "./Teselas/19/111506/223666.jpg",
    "./Teselas/19/111506/223667.jpg",
    "./Teselas/19/111506/223668.jpg",
    "./Teselas/19/111506/223669.jpg",
    "./Teselas/19/111506/223670.jpg",
    "./Teselas/19/111507/223658.jpg",
    "./Teselas/19/111507/223659.jpg",
    "./Teselas/19/111507/223660.jpg",
    "./Teselas/19/111507/223661.jpg",
    "./Teselas/19/111507/223662.jpg",
    "./Teselas/19/111507/223663.jpg",
    "./Teselas/19/111507/223664.jpg",
    "./Teselas/19/111507/223665.jpg",
    "./Teselas/19/111507/223666.jpg",
    "./Teselas/19/111507/223667.jpg",
    "./Teselas/19/111507/223668.jpg",
    "./Teselas/19/111507/223669.jpg",
    "./Teselas/19/111507/223670.jpg",
    "./Teselas/19/111508/223658.jpg",
    "./Teselas/19/111508/223659.jpg",
    "./Teselas/19/111508/223660.jpg",
    "./Teselas/19/111508/223661.jpg",
    "./Teselas/19/111508/223662.jpg",
    "./Teselas/19/111508/223663.jpg",
    "./Teselas/19/111508/223664.jpg",
    "./Teselas/19/111508/223665.jpg",
    "./Teselas/19/111508/223666.jpg",
    "./Teselas/19/111508/223667.jpg",
    "./Teselas/19/111508/223668.jpg",
    "./Teselas/19/111508/223669.jpg",
    "./Teselas/19/111508/223670.jpg",
    "./Teselas/19/111509/223658.jpg",
    "./Teselas/19/111509/223659.jpg",
    "./Teselas/19/111509/223660.jpg",
    "./Teselas/19/111509/223661.jpg",
    "./Teselas/19/111509/223662.jpg",
    "./Teselas/19/111509/223663.jpg",
    "./Teselas/19/111509/223664.jpg",
    "./Teselas/19/111509/223665.jpg",
    "./Teselas/19/111509/223666.jpg",
    "./Teselas/19/111509/223667.jpg",
    "./Teselas/19/111509/223668.jpg",
    "./Teselas/19/111509/223669.jpg",
    "./Teselas/19/111509/223670.jpg",
    "./Teselas/19/111510/223658.jpg",
    "./Teselas/19/111510/223659.jpg",
    "./Teselas/19/111510/223660.jpg",
    "./Teselas/19/111510/223661.jpg",
    "./Teselas/19/111510/223662.jpg",
    "./Teselas/19/111510/223663.jpg",
    "./Teselas/19/111510/223664.jpg",
    "./Teselas/19/111510/223665.jpg",
    "./Teselas/19/111510/223666.jpg",
    "./Teselas/19/111510/223667.jpg",
    "./Teselas/19/111510/223668.jpg",
    "./Teselas/19/111510/223669.jpg",
    "./Teselas/19/111510/223670.jpg"
];

// ==========================================
//               INSTALACIÓN
// ==========================================
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[SW] Cache abierto. Guardando archivos core...');
            await cache.addAll(ARCHIVOS_CORE);

            // Guardar teselas e imágenes secundarias en segundo plano de manera tolerante a fallos
            const secundarios = [...IMAGENES_CAMPUS, ...TESELAS_MAPA];
            return Promise.allSettled(
                secundarios.map(url => 
                    fetch(url)
                        .then(res => {
                            if (res.ok) return cache.put(url, res);
                        })
                        .catch(err => {
                            // Ignorar fallas individuales silenciosamente para no abortar el cache
                        })
                )
            );
        })
    );
    self.skipWaiting();
});

// ==========================================
//               ACTIVACIÓN
// ==========================================
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((nombresDeCache) => {
            return Promise.all(
                nombresDeCache.map((nombre) => {
                    if (nombre !== CACHE_NAME) {
                        console.log('[SW] Eliminando cache obsoleto:', nombre);
                        return caches.delete(nombre);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// ==========================================
//             ESTRATEGIA FETCH
// ==========================================
// Cache-First con Network Fallback y Cache Dinámico
self.addEventListener('fetch', (evento) => {
    if (evento.request.method !== 'GET') return;

    evento.respondWith(
        caches.match(evento.request, { ignoreSearch: true }).then((respuestaCache) => {
            if (respuestaCache) {
                return respuestaCache;
            }

            return fetch(evento.request)
                .then((respuestaRed) => {
                    if (!respuestaRed || respuestaRed.status !== 200) {
                        return respuestaRed;
                    }

                    const respuestaAClonar = respuestaRed.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(evento.request, respuestaAClonar);
                    });

                    return respuestaRed;
                })
                .catch(() => {
                    return caches.match(evento.request);
                });
        })
    );
});
