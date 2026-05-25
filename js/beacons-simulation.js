// ---------- Clase Beacon (Baliza) ----------
class Beacon {
    constructor(id, nombre, lat, lng) {
        this.id = id;
        this.nombre = nombre;
        this.lat = lat;
        this.lng = lng;
        this.errorBase = 2;           // error simulado en metros (±)
        this.marcador = null;          // marcador en el mapa (opcional)
    }

    // Distancia real desde este beacon a un punto (lat, lng)
    distanciaRealA(punto) {
        return distanciaMetros(this.lat, this.lng, punto.lat, punto.lng);
    }

    // Distancia simulada (con ruido) – simula la medición del hardware
    distanciaSimuladaA(punto) {
        let real = this.distanciaRealA(punto);
        let error = (Math.random() - 0.5) * 2 * this.errorBase;
        return Math.max(0, real + error);
    }

    // Agrega el marcador al mapa
    agregarAlMapa(map) {
        this.marcador = L.marker([this.lat, this.lng], {
            icon: L.divIcon({
                className: 'beacon-marker',
                html: `<div style="background:#00f; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
                iconSize: [12, 12]
            }),
            title: this.nombre
        }).addTo(map).bindTooltip(this.nombre);
        return this.marcador;
    }
}

// ---------- Clase UbicacionSimulada (Usuario movible) ----------
class UbicacionSimulada {
    constructor(map, latInicial, lngInicial) {
        this.map = map;
        this.lat = latInicial;
        this.lng = lngInicial;
        this.marcador = null;
        this.crearMarcador();
    }

    crearMarcador() {
        this.marcador = L.marker([this.lat, this.lng], {
            draggable: true,          // se puede arrastrar con mouse/dedo
            zIndexOffset: 1000,
            icon: L.divIcon({
                className: 'simulated-marker',
                html: `<div style="background:red; width:16px; height:16px; border-radius:50%; border:2px solid black; box-shadow: 0 0 6px rgba(0,0,0,0.6);"></div>`,
                iconSize: [16, 16]
            })
        }).addTo(this.map)
            .bindTooltip('Usuario simulado (arrastra)')
            .on('dragend', (e) => {
                let pos = e.target.getLatLng();
                this.lat = pos.lat;
                this.lng = pos.lng;
                this.actualizar();    // dispara eventos de actualización
            });
    }

    // Obtener posición actual como objeto {lat, lng}
    getPosicion() {
        return { lat: this.lat, lng: this.lng };
    }

    // Mover el marcador a nuevas coordenadas (sin arrastrar)
    moverA(lat, lng) {
        this.lat = lat;
        this.lng = lng;
        this.marcador.setLatLng([lat, lng]);
        this.actualizar();
    }

    // Método que se llamará cada vez que cambie la posición (puedes sobrescribirlo)
    actualizar() {
        if (typeof this.onChange === 'function') {
            this.onChange(this.getPosicion());
        }
    }

    // Ocultar/eliminar del mapa
    eliminar() {
        if (this.marcador) {
            this.map.removeLayer(this.marcador);
            this.marcador = null;
        }
    }
}

// ---------- Clase SimuladorBeacons ----------
class SimuladorBeacons {
    constructor(beacons) {
        this.beacons = beacons;   // array de instancias de Beacon
    }

    // Obtener distancias simuladas desde una posición a todas las balizas
    obtenerDistanciasSimuladas(posicion) {
        return this.beacons.map(beacon => ({
            id: beacon.id,
            lat: beacon.lat,
            lng: beacon.lng,
            distancia: beacon.distanciaSimuladaA(posicion)
        }));
    }

    // Realizar trilateración a partir de las distancias simuladas
    trilaterar(posicionReal) {
        let distancias = this.obtenerDistanciasSimuladas(posicionReal);
        // Ordenar por distancia ascendente para usar las 3 balizas más cercanas
        distancias.sort((a, b) => a.distancia - b.distancia);
        return trilaterar(distancias);
    }
}

// ---------- Función Geometría: Distancia en metros (Fórmula de Haversine) ----------
function distanciaMetros(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ---------- Trilateración (mínimos cuadrados para 3 balizas) ----------
function trilaterar(distancias) {
    if (distancias.length < 3) return null;

    // Usamos las tres primeras balizas para estimar la intersección
    let p1 = distancias[0], p2 = distancias[1], p3 = distancias[2];
    let d1 = p1.distancia, d2 = p2.distancia, d3 = p3.distancia;
    let x1 = p1.lng, y1 = p1.lat;
    let x2 = p2.lng, y2 = p2.lat;
    let x3 = p3.lng, y3 = p3.lat;

    let A = 2 * (x2 - x1);
    let B = 2 * (y2 - y1);
    let C = d1 * d1 - d2 * d2 - x1 * x1 + x2 * x2 - y1 * y1 + y2 * y2;
    let D = 2 * (x3 - x2);
    let E = 2 * (y3 - y2);
    let F = d2 * d2 - d3 * d3 - x2 * x2 + x3 * x3 - y2 * y2 + y3 * y3;

    let det = A * E - B * D;
    if (Math.abs(det) < 1e-10) return null;

    let x = (C * E - B * F) / det;
    let y = (A * F - C * D) / det;

    return { lat: y, lng: x };
}
