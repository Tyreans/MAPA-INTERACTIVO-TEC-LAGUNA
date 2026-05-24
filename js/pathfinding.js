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

// ---------- Construir Grafo desde caminitos GeoJSON ----------
function buildGraph(geojsonPaths, snappingToleranceMeters = 2.5) {
    let graph = {};
    let nodeKeysList = []; // Array para almacenar llaves registradas y hacer snapping
    
    if (!geojsonPaths || !geojsonPaths.features) return graph;

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

                let lat1 = p1[1];
                let lng1 = p1[0];
                let lat2 = p2[1];
                let lng2 = p2[0];

                // Snapping a nodos existentes para salvar desalineaciones menores del dibujo manual
                let key1 = findSnappedNode(lat1, lng1, nodeKeysList, snappingToleranceMeters);
                if (!key1) {
                    key1 = `${lat1.toFixed(6)},${lng1.toFixed(6)}`;
                    nodeKeysList.push(key1);
                }
                
                let key2 = findSnappedNode(lat2, lng2, nodeKeysList, snappingToleranceMeters);
                if (!key2) {
                    key2 = `${lat2.toFixed(6)},${lng2.toFixed(6)}`;
                    nodeKeysList.push(key2);
                }

                if (key1 === key2) continue; // Evita bucles a sí mismo si se snappean al mismo nodo

                // Calcular peso en base a la distancia real de los puntos snappeados
                let [k1Lat, k1Lng] = key1.split(',').map(Number);
                let [k2Lat, k2Lng] = key2.split(',').map(Number);
                let dist = distanciaMetros(k1Lat, k1Lng, k2Lat, k2Lng);

                if (!graph[key1]) graph[key1] = {};
                if (!graph[key2]) graph[key2] = {};

                graph[key1][key2] = dist;
                graph[key2][key1] = dist; // grafo bidireccional
            }
        });
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
