// ---------- Cola de Prioridad simple para Dijkstra ----------
class PriorityQueue {
    constructor() {
        this.values = [];
    }
    enqueue(val, priority) {
        this.values.push({ val, priority });
        this.sort();
    }
    dequeue() {
        return this.values.shift();
    }
    sort() {
        this.values.sort((a, b) => a.priority - b.priority);
    }
    isEmpty() {
        return this.values.length === 0;
    }
}

// ---------- Buscar nodo existente en un radio de snapping ----------
function findSnappedNode(lat, lng, existingNodes, toleranceMeters = 2.5) {
    for (let i = 0; i < existingNodes.length; i++) {
        let nodeKey = existingNodes[i];
        let [eLat, eLng] = nodeKey.split(',').map(Number);
        if (distanciaMetros(lat, lng, eLat, eLng) <= toleranceMeters) {
            return nodeKey;
        }
    }
    return null;
}

// ---------- Proyectar punto perpendicularmente sobre un segmento u-v ----------
function projectPointOnSegment(pLat, pLng, uLat, uLng, vLat, vLng) {
    const dy = (vLat - uLat) * 111139;
    const dx = (vLng - uLng) * 111139 * Math.cos(uLat * Math.PI / 180);
    
    const py = (pLat - uLat) * 111139;
    const px = (pLng - uLng) * 111139 * Math.cos(uLat * Math.PI / 180);
    
    const lenSq = dx*dx + dy*dy;
    if (lenSq === 0) return { dist: distanciaMetros(pLat, pLng, uLat, uLng), t: 0 };
    
    let t = (px * dx + py * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    
    const projX = dx * t;
    const projY = dy * t;
    const dist = Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
    
    return { dist, t };
}

// ---------- Construir Grafo desde caminitos GeoJSON ----------
function buildGraph(geojsonPaths, snappingToleranceMeters = 2.5) {
    let graph = {};
    let nodeKeysList = []; // Array para almacenar llaves registradas y hacer snapping
    let rawSegments = [];

    if (!geojsonPaths || !geojsonPaths.features) return graph;

    // Paso 1: Extraer segmentos y recolectar vértices iniciales
    geojsonPaths.features.forEach(feature => {
        let geom = feature.geometry;
        if (!geom) return;

        let lines = [];
        if (geom.type === "LineString") {
            lines.push(geom.coordinates);
        } else if (geom.type === "MultiLineString") {
            lines = geom.coordinates;
        }

        lines.forEach(coords => {
            for (let i = 0; i < coords.length - 1; i++) {
                let p1 = coords[i];   // [lng, lat]
                let p2 = coords[i+1]; // [lng, lat]
                
                rawSegments.push({
                    lat1: p1[1], lng1: p1[0],
                    lat2: p2[1], lng2: p2[0]
                });
                
                // Snapping a nodos existentes al recopilar
                let key1 = findSnappedNode(p1[1], p1[0], nodeKeysList, snappingToleranceMeters);
                if (!key1) {
                    key1 = `${p1[1].toFixed(6)},${p1[0].toFixed(6)}`;
                    nodeKeysList.push(key1);
                }
                let key2 = findSnappedNode(p2[1], p2[0], nodeKeysList, snappingToleranceMeters);
                if (!key2) {
                    key2 = `${p2[1].toFixed(6)},${p2[0].toFixed(6)}`;
                    nodeKeysList.push(key2);
                }
            }
        });
    });

    // Paso 2: Para cada segmento, buscar qué nodos lo tocan y dividirlo
    rawSegments.forEach(seg => {
        let uLat = seg.lat1;
        let uLng = seg.lng1;
        let vLat = seg.lat2;
        let vLng = seg.lng2;
        
        let splitPoints = [];
        
        nodeKeysList.forEach(vKey => {
            let [vLatVal, vLngVal] = vKey.split(',').map(Number);
            let proj = projectPointOnSegment(vLatVal, vLngVal, uLat, uLng, vLat, vLng);
            
            if (proj.dist <= snappingToleranceMeters) {
                splitPoints.push({
                    key: vKey,
                    t: proj.t
                });
            }
        });
        
        // Ordenar los puntos de corte a lo largo del segmento
        splitPoints.sort((a, b) => a.t - b.t);
        
        // Unir puntos de corte adyacentes en el grafo
        for (let i = 0; i < splitPoints.length - 1; i++) {
            let k1 = splitPoints[i].key;
            let k2 = splitPoints[i+1].key;
            
            if (k1 === k2) continue;
            
            let [lat1, lng1] = k1.split(',').map(Number);
            let [lat2, lng2] = k2.split(',').map(Number);
            let dist = distanciaMetros(lat1, lng1, lat2, lng2);
            
            if (!graph[k1]) graph[k1] = {};
            if (!graph[k2]) graph[k2] = {};
            
            graph[k1][k2] = dist;
            graph[k2][k1] = dist;
        }
    });

    return graph;
}

// ---------- Encontrar Nodo del Grafo más cercano a lat, lng ----------
function findClosestNode(lat, lng, graph) {
    let minNode = null;
    let minDist = Infinity;

    for (let nodeKey in graph) {
        let [nLat, nLng] = nodeKey.split(',').map(Number);
        let dist = distanciaMetros(lat, lng, nLat, nLng);
        if (dist < minDist) {
            minDist = dist;
            minNode = nodeKey;
        }
    }
    return minNode;
}

// ---------- Algoritmo Dijkstra para ruta más corta ----------
function dijkstra(graph, startKey, endKey) {
    let distances = {};
    let prev = {};
    let pq = new PriorityQueue();

    for (let node in graph) {
        distances[node] = Infinity;
        prev[node] = null;
    }
    distances[startKey] = 0;
    pq.enqueue(startKey, 0);

    let visited = new Set();

    while (!pq.isEmpty()) {
        let { val: currNode } = pq.dequeue();

        if (visited.has(currNode)) continue;
        visited.add(currNode);

        if (currNode === endKey) {
            // Reconstruir camino
            let path = [];
            let u = currNode;
            while (u) {
                path.unshift(u);
                u = prev[u];
            }
            return path.map(key => {
                let [lat, lng] = key.split(',').map(Number);
                return { lat, lng };
            });
        }

        let neighbors = graph[currNode] || {};
        for (let neighbor in neighbors) {
            if (visited.has(neighbor)) continue;
            let alt = distances[currNode] + neighbors[neighbor];
            if (alt < distances[neighbor]) {
                distances[neighbor] = alt;
                prev[neighbor] = currNode;
                pq.enqueue(neighbor, alt);
            }
        }
    }
    return null; // No hay ruta conectada
}

// ---------- Calcular Distancia Total de una Ruta Trazada ----------
function calcularDistanciaRuta(rutaArray) {
    let total = 0;
    for (let i = 0; i < rutaArray.length - 1; i++) {
        let p1 = rutaArray[i];
        let p2 = rutaArray[i+1];
        total += distanciaMetros(p1.lat, p1.lng, p2.lat, p2.lng);
    }
    return total;
}
