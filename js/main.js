// ==========================================
// CONFIGURACIÓN DE DESARROLLO
// ==========================================
const USE_GPS_LOCATION = false; // true = GPS real del navegador, false = Simulación por Beacons

// ==========================================
// VARIABLES GLOBALES
// ==========================================
var map = L.map('map', { attributionControl: false }).setView([25.5324, -103.436], 17);
L.control.attribution({ prefix: false }).addTo(map);

// Capa satelital local
var tilesource_layer = L.tileLayer('Teselas ITL Satelital//{z}/{x}/{y}.jpg', {
    minZoom: 15,
    maxZoom: 19,
    tms: false,
    attribution: 'Imagenes extraidas de Google Maps. Mapa disenado por Juan Pablo e informacion de los edificios recolectada por Angel Daniel'
}).addTo(map);

// Datos y capas del campus
var infoEdificios = {};
var capasEdificios = {};
var edificioDestacado = null;
var pathGraph = null;

// Ubicación y navegación
var currentPosition = null;      // Para GPS real [lat, lng]
var userMarker = null;           // Para GPS real
var accuracyCircle = null;       // Para GPS real
var watchId = null;              // ID de geolocalización real
var positionBuffer = [];
const MIN_ACCURACY = 60;
const MAX_BUFFER = 5;

// Variables de Simulación
var ubicacionSim = null;
var simulador = null;

// Variables de Ruta
var selectedDoorId = null;
var selectedDestinationId = null;
var activeRouteLine = null;
var startPointMarker = null;
var endPointMarker = null;

// Beacons en el campus (se cargan al inicializar si estamos en simulación o como referencia)
const beaconsData = [
    new Beacon('Beacon1', 'Beacon Edificio A', 25.535220, -103.43479),
    new Beacon('Beacon2', 'Beacon Biblioteca', 25.529297, -103.43632),
    new Beacon('Beacon3', 'Beacon Cafeteria', 25.534200, -103.435504),
    new Beacon('Beacon4', 'Beacon Computo', 25.532600, -103.436093),
    new Beacon('Beacon5', 'Beacon Alberca', 25.531000, -103.435500),
    new Beacon('Beacon6', 'Beacon Gimnasio', 25.530500, -103.435800),
    new Beacon('Beacon7', 'Beacon Ciencias Basicas', 25.533200, -103.436100),
    new Beacon('Beacon8', 'Beacon Vinculacion', 25.534900, -103.434300)
];

// ==========================================
// CARGA DE DATOS & GEOMETRÍA
// ==========================================

// 1. Cargar metadatos de los edificios
fetch('datos.json')
    .then(response => response.json())
    .then(data => {
        infoEdificios = data;
        console.log("Cargados metadatos de edificios con éxito.");
    })
    .catch(error => console.error("Error cargando datos.json:", error));

// 2. Renderizar edificios desde datosTec (definido en GeoTec.js)
L.geoJSON(datosTec, {
    style: function (feature) {
        return {
            color: '#2F29D1',
            weight: 0,
            fillColor: '#3388FF',
            fillOpacity: 0
        };
    },
    onEachFeature: function (feature, layer) {
        if (feature.properties.id) {
            capasEdificios[feature.properties.id] = layer;
        }

        if (feature.properties.Nombre) {
            layer.bindTooltip(feature.properties.Nombre, {
                permanent: false,
                direction: 'top',
                className: 'mi-tooltip-estilo'
            });
        }

        if (feature.properties.id) {
            var centro = layer.getBounds().getCenter();
            var iconoID = L.divIcon({
                className: 'label-edificio',
                html: feature.properties.id,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            L.marker(centro, { icon: iconoID, interactive: false }).addTo(map);
        }

        layer.on('click', function () {
            mostrarPopupEdificio(feature.properties.id, layer);
        });
    }
}).addTo(map);

// 3. Cargar caminos y construir el grafo para Dijkstra
fetch('caminitos.geojson')
    .then(resp => resp.json())
    .then(data => {
        // Dibujar caminos sutiles en blanco
        L.geoJSON(data, {
            style: {
                color: '#ffffff',
                weight: 4,
                opacity: 0.8,
                lineCap: 'round'
            }
        }).addTo(map);

        // Construir grafo en pathfinding.js
        pathGraph = buildGraph(data);
        console.log("Grafo para Dijkstra construido con éxito.");
    })
    .catch(err => console.error("Error cargando caminitos.geojson:", err));

// ==========================================
// INICIALIZACIÓN DE LOCALIZACIÓN
// ==========================================

if (USE_GPS_LOCATION) {
    console.log("Iniciando en modo GPS Real");
    startGeolocation();
} else {
    console.log("Iniciando en modo Simulación por Beacons");
    // Dibujar beacons en el mapa
    beaconsData.forEach(b => b.agregarAlMapa(map));

    // Crear simulador y ubicación simulada arrastrable en el centro del campus
    simulador = new SimuladorBeacons(beaconsData);
    ubicacionSim = new UbicacionSimulada(map, 25.5324, -103.436);

    // Escuchar el movimiento del marcador simulado
    ubicacionSim.onChange = (pos) => {
        let posEstimada = simulador.trilaterar(pos);
        if (posEstimada) {
            if (window.estimacionMarker) {
                window.estimacionMarker.setLatLng([posEstimada.lat, posEstimada.lng]);
            } else {
                window.estimacionMarker = L.circleMarker([posEstimada.lat, posEstimada.lng], {
                    color: 'orange',
                    fillColor: 'gold',
                    radius: 6,
                    weight: 2,
                    fillOpacity: 0.8
                }).addTo(map).bindTooltip('Estimado por beacons');
            }
        }

        // Si hay una ruta activa calculada desde la ubicación del usuario, actualizarla en tiempo real
        if (selectedDestinationId && !selectedDoorId) {
            calcularRuta(pos, selectedDestinationId, "Mi ubicación (Simulada)");
        }
    };

    // Ejecutar inicialización de la posición simulada
    ubicacionSim.actualizar();
}

// ==========================================
// GEOLOCALIZACIÓN REAL (Nativa)
// ==========================================

function startGeolocation() {
    if (!navigator.geolocation) {
        alert('Geolocalización no soportada por este navegador.');
        return;
    }

    watchId = navigator.geolocation.watchPosition(
        function (position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            var accuracy = position.coords.accuracy;

            if (accuracy > MIN_ACCURACY) {
                console.warn(`Precisión baja (${accuracy}m), ignorando...`);
                return;
            }

            positionBuffer.push({ lat: lat, lng: lng, accuracy: accuracy });
            if (positionBuffer.length > MAX_BUFFER) positionBuffer.shift();

            var sumLat = 0, sumLng = 0;
            for (var i = 0; i < positionBuffer.length; i++) {
                sumLat += positionBuffer[i].lat;
                sumLng += positionBuffer[i].lng;
            }
            var avgLat = sumLat / positionBuffer.length;
            var avgLng = sumLng / positionBuffer.length;
            var bestAccuracy = Math.min(...positionBuffer.map(p => p.accuracy));

            currentPosition = [avgLat, avgLng];

            if (userMarker) {
                userMarker.setLatLng([avgLat, avgLng]);
            } else {
                userMarker = L.circleMarker([avgLat, avgLng], {
                    color: 'red',
                    fillColor: 'red',
                    fillOpacity: 1,
                    radius: 8,
                    weight: 2
                }).addTo(map);
            }

            if (accuracyCircle) {
                accuracyCircle.setLatLng([avgLat, avgLng]);
                accuracyCircle.setRadius(bestAccuracy);
            } else {
                accuracyCircle = L.circle([avgLat, avgLng], {
                    color: 'red',
                    fillColor: 'red',
                    fillOpacity: 0.1,
                    radius: bestAccuracy,
                    weight: 1,
                    dashArray: '5, 5'
                }).addTo(map);
            }

            // Si hay ruta activa y no hay puerta seleccionada, recalculamos desde la nueva posición real
            if (selectedDestinationId && !selectedDoorId) {
                calcularRuta({ lat: avgLat, lng: avgLng }, selectedDestinationId, "Mi ubicación (GPS)");
            }
        },
        function (error) {
            console.error('Error de geolocalización:', error);
            var errorMsg = 'No se pudo obtener la ubicación.';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += ' Permiso denegado.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += ' Ubicación no disponible.';
                    break;
                case error.TIMEOUT:
                    errorMsg += ' Tiempo de espera agotado.';
                    break;
            }
            console.warn(errorMsg);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

function stopGeolocation() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }
    if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
        accuracyCircle = null;
    }
    currentPosition = null;
    positionBuffer = [];
}

function centerOnLocation() {
    if (USE_GPS_LOCATION) {
        if (currentPosition) {
            map.setView(currentPosition, 19);
        } else {
            alert('Ubicación real no disponible aún. Esperando lectura precisa del GPS...');
        }
    } else {
        if (ubicacionSim) {
            map.setView([ubicacionSim.lat, ubicacionSim.lng], 19);
        }
    }
}

// ==========================================
// INTERFAZ POPUP DE DETALLE DE EDIFICIOS
// ==========================================

function mostrarPopupEdificio(id, layer) {
    var datos = infoEdificios[id];
    if (datos) {
        var imagenesHTML = '';
        if (datos.imagenes && datos.imagenes.length > 0) {
            imagenesHTML = '<div class="carousel-container">';
            datos.imagenes.forEach(imgUrl => {
                imagenesHTML += `<img src="${imgUrl}">`;
            });
            imagenesHTML += '</div>';
        }

        var aulasHTML = '';
        if (datos.aulas && datos.aulas.length > 0) {
            aulasHTML = '<div class="aulas-container">';
            datos.aulas.forEach(aula => {
                aulasHTML += `<span class="badge-aula">${aula}</span>`;
            });
            aulasHTML += '</div>';
        }

        var popupContent = `
            <div class="popup-tec">
                <h3>${datos.nombre}</h3>
                ${imagenesHTML}
                <p>${datos.descripcion}</p>
                <strong>Aulas u otros:</strong>
                ${aulasHTML}
                <div class="popup-actions" style="margin-top: 12px; border-top: 1px solid #ddd; padding-top: 10px;">
                    <button class="como-llegar-btn" onclick="iniciarRuta('${id}')">
                        Cómo llegar
                    </button>
                </div>
            </div>
        `;

        layer.bindPopup(popupContent).openPopup();
    } else {
        layer.bindPopup(`
            <div class="popup-tec">
                <h3>Edificio ${id}</h3>
                <p>Información detallada no disponible.</p>
                <div class="popup-actions" style="margin-top: 12px; border-top: 1px solid #ddd; padding-top: 10px;">
                    <button class="como-llegar-btn" onclick="iniciarRuta('${id}')">
                        Cómo llegar
                    </button>
                </div>
            </div>
        `).openPopup();
    }
}

// Wrapper para que sea llamado externamente por la sugerencia de búsqueda
function mostrarPopup(edificioId, layer) {
    mostrarPopupEdificio(edificioId, layer);
}

// ==========================================
// SISTEMA DE NAVEGACIÓN DIJKSTRA
// ==========================================

// Función puente llamada desde el Popup "Cómo llegar"
window.iniciarRuta = function (destId) {
    selectedDestinationId = destId;

    let origCoors = null;
    let origName = "";

    // 1. Verificar si hay una puerta de acceso seleccionada como origen
    if (selectedDoorId) {
        origCoors = obtenerCentroPuerta(selectedDoorId);
        let selectEl = document.getElementById('doors-select');
        origName = selectEl.options[selectEl.selectedIndex].text;
    } else {
        // 2. Si no hay puerta, usar la ubicación del usuario
        if (USE_GPS_LOCATION) {
            if (currentPosition) {
                origCoors = { lat: currentPosition[0], lng: currentPosition[1] };
                origName = "Mi ubicación (GPS)";
            }
        } else {
            if (ubicacionSim) {
                origCoors = ubicacionSim.getPosicion();
                origName = "Mi ubicación (Simulada)";
            }
        }
    }

    // 3. CAPTURA DE ERROR: Si la ubicación no es accesible, lanzar alerta y sugerir puerta
    if (!origCoors) {
        alert("No pudimos obtener tu ubicación actual.\n\nPor favor, selecciona una puerta de acceso (Puertas P1 a P6) en el menú de la esquina inferior izquierda como punto de partida.");

        // Enfocar / parpadear visualmente el dropdown de puertas para guiar al usuario
        let selectEl = document.getElementById('doors-select');
        if (selectEl) {
            selectEl.style.outline = "3px solid #ff5722";
            setTimeout(() => {
                selectEl.style.outline = "none";
            }, 3000);
        }
        return;
    }

    // 4. Calcular y dibujar la ruta
    calcularRuta(origCoors, destId, origName);
};

function calcularRuta(origCoors, destId, origName) {
    if (!pathGraph) {
        alert("Los caminos aún se están cargando. Espera un momento.");
        return;
    }

    let destCapa = capasEdificios[destId];
    if (!destCapa) {
        alert("No se encontró la ubicación geométrica del destino.");
        return;
    }

    let destCoors = destCapa.getBounds().getCenter();
    let destName = infoEdificios[destId] ? infoEdificios[destId].nombre : `Edificio ${destId}`;

    // Encontrar nodos más cercanos del grafo de caminos
    let startNodeKey = findClosestNode(origCoors.lat, origCoors.lng, pathGraph);
    let endNodeKey = findClosestNode(destCoors.lat, destCoors.lng, pathGraph);

    if (!startNodeKey || !endNodeKey) {
        alert("No se pudo enlazar la ubicación de inicio o destino a los caminos peatonalizados.");
        return;
    }

    // Calcular ruta más corta con Dijkstra
    let path = dijkstra(pathGraph, startNodeKey, endNodeKey);

    if (!path || path.length === 0) {
        alert("No fue posible trazar un camino conectado para este destino.");
        return;
    }

    // Agregar coordenadas iniciales y finales para cerrar la brecha con la red
    path.unshift({ lat: origCoors.lat, lng: origCoors.lng });
    path.push({ lat: destCoors.lat, lng: destCoors.lng });

    // Limpiar capa de ruta anterior
    if (activeRouteLine) map.removeLayer(activeRouteLine);

    // Dibujar nueva polilínea con animación
    activeRouteLine = L.polyline(path, {
        color: '#1565c0',
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'animated-route-line'
    }).addTo(map);

    // Ajustar zoom para abarcar todo el recorrido
    map.fitBounds(activeRouteLine.getBounds(), { padding: [60, 60] });

    // Actualizar marcadores de inicio y fin de ruta
    if (startPointMarker) map.removeLayer(startPointMarker);
    if (endPointMarker) map.removeLayer(endPointMarker);

    startPointMarker = L.marker([origCoors.lat, origCoors.lng], {
        icon: L.divIcon({
            className: 'route-point-start',
            html: `<div style="background:#4CAF50; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
            iconSize: [16, 16]
        })
    }).addTo(map).bindTooltip(`Inicio: ${origName}`);

    endPointMarker = L.marker([destCoors.lat, destCoors.lng], {
        icon: L.divIcon({
            className: 'route-point-end',
            html: `<div style="background:#F44336; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
            iconSize: [16, 16]
        })
    }).addTo(map).bindTooltip(`Destino: ${destName}`);

    // Calcular distancia total de la ruta
    let distanciaTotal = Math.round(calcularDistanciaRuta(path));

    // Mostrar panel flotante con la información de navegación
    mostrarPanelNavegacion(origName, destName, distanciaTotal);

    // Cerrar cualquier popup abierto
    map.closePopup();
}

function mostrarPanelNavegacion(origen, destino, distancia) {
    let panel = document.getElementById('navigation-info-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'navigation-info-panel';
        panel.className = 'navigation-info-panel';
        document.body.appendChild(panel);
    }

    panel.innerHTML = `
        <div class="nav-info-header">Indicaciones de Ruta</div>
        <div class="nav-info-details">
            <div class="nav-info-item"><strong>Desde:</strong> <span>${origen}</span></div>
            <div class="nav-info-item"><strong>Hasta:</strong> <span>${destino}</span></div>
            <div class="nav-info-item"><strong>Distancia:</strong> <span class="nav-dist">${distancia} metros</span></div>
        </div>
        <button id="clear-route-btn" onclick="limpiarRuta()">Limpiar Recorrido</button>
    `;

    // Añadir estilo activo
    setTimeout(() => {
        panel.classList.add('active');
    }, 50);
}

window.limpiarRuta = function () {
    if (activeRouteLine) {
        map.removeLayer(activeRouteLine);
        activeRouteLine = null;
    }
    if (startPointMarker) {
        map.removeLayer(startPointMarker);
        startPointMarker = null;
    }
    if (endPointMarker) {
        map.removeLayer(endPointMarker);
        endPointMarker = null;
    }

    // Limpiar selecciones de puertas
    document.getElementById('doors-select').value = "";
    selectedDoorId = null;
    selectedDestinationId = null;

    let panel = document.getElementById('navigation-info-panel');
    if (panel) {
        panel.classList.remove('active');
    }
};

// ==========================================
// SELECTOR & CENTRADO DE PUERTAS
// ==========================================

function obtenerCentroPuerta(idPuerta) {
    let capa = capasEdificios[idPuerta];
    if (capa) {
        return capa.getBounds().getCenter();
    }

    // Coordenadas fallback precisas de las puertas en caso de no haberse mapeado la geometría aún
    const fallbacks = {
        "P1": { lat: 25.534749, lng: -103.434492 },
        "P2": { lat: 25.533321, lng: -103.434524 },
        "P3": { lat: 25.531002, lng: -103.435153 },
        "P4": { lat: 25.530236, lng: -103.435404 },
        "P5": { lat: 25.5294985, lng: -103.435666 },
        "P6": { lat: 25.535214, lng: -103.436398 }
    };
    return fallbacks[idPuerta];
}

// Escuchar cambios en el dropdown de puertas
document.getElementById('doors-select').addEventListener('change', function (e) {
    let doorId = e.target.value;
    selectedDoorId = doorId;

    let centro = obtenerCentroPuerta(doorId);
    if (centro) {
        // Centrar mapa
        map.setView([centro.lat, centro.lng], 19);

        // Poner marcador de partida en la puerta
        if (startPointMarker) map.removeLayer(startPointMarker);

        let doorName = e.target.options[e.target.selectedIndex].text;
        startPointMarker = L.marker([centro.lat, centro.lng], {
            icon: L.divIcon({
                className: 'route-point-start',
                html: `<div style="background:#4CAF50; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
                iconSize: [16, 16]
            })
        }).addTo(map).bindTooltip(`Partida: ${doorName}`).openTooltip();

        // Si hay un destino seleccionado actualmente, recalculamos la ruta desde la puerta elegida
        if (selectedDestinationId) {
            calcularRuta(centro, selectedDestinationId, doorName);
        }
    }
});

// ==========================================
// BUSCADOR & CONTROLES DE INTERFAZ
// ==========================================

var searchInput = document.getElementById('searchbar-input');
var suggestionsContainer = document.getElementById('searchbar-suggestions');
var searchBtn = document.getElementById('search-btn');

searchInput.addEventListener('input', function () {
    var query = this.value.toLowerCase().trim();

    if (query.length === 0) {
        suggestionsContainer.classList.remove('active');
        return;
    }

    var resultados = buscarEdificiosYAulas(query);
    mostrarSugerencias(resultados, query);
});

searchBtn.addEventListener('click', function () {
    var query = searchInput.value.toLowerCase().trim();

    if (query.length > 0) {
        var resultados = buscarEdificiosYAulas(query);
        if (resultados.length > 0) {
            seleccionarSugerencia(resultados[0].edificioId, resultados[0].aula);
        }
    }
});

searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchBtn.click();
    }
});

var centerBtn = document.getElementById('center-location-btn');
centerBtn.addEventListener('click', function () {
    centerOnLocation();
});

function buscarEdificiosYAulas(query) {
    var resultados = [];

    for (var edificioId in infoEdificios) {
        var edificio = infoEdificios[edificioId];
        var nombreEdificio = edificio.nombre.toLowerCase();
        var idMinusculas = edificioId.toLowerCase();

        if (nombreEdificio.includes(query) || idMinusculas.includes(query)) {
            resultados.push({
                tipo: 'edificio',
                edificioId: edificioId,
                nombre: edificio.nombre,
                aula: null
            });
        }

        if (edificio.aulas) {
            edificio.aulas.forEach(function (aula) {
                if (aula.toLowerCase().includes(query)) {
                    resultados.push({
                        tipo: 'aula',
                        edificioId: edificioId,
                        nombre: edificio.nombre,
                        aula: aula
                    });
                }
            });
        }
    }

    return resultados;
}

function mostrarSugerencias(resultados, query) {
    suggestionsContainer.innerHTML = '';

    if (resultados.length === 0) {
        suggestionsContainer.classList.remove('active');
        return;
    }

    // Limitar las sugerencias para no sobrecargar
    var resultadosLimitados = resultados.slice(0, 10);

    resultadosLimitados.forEach(function (resultado) {
        var item = document.createElement('div');
        item.className = 'suggestion-item';

        if (resultado.tipo === 'edificio') {
            item.innerHTML = `<div class="suggestion-edificio">${resaltarTexto(resultado.nombre, query)}</div>`;
        } else {
            item.innerHTML = `
                <div class="suggestion-edificio">${resultado.nombre}</div>
                <div class="suggestion-aula">✒️ ${resaltarTexto(resultado.aula, query)}</div>
            `;
        }

        item.addEventListener('click', function () {
            seleccionarSugerencia(resultado.edificioId, resultado.aula);
        });

        suggestionsContainer.appendChild(item);
    });

    suggestionsContainer.classList.add('active');
}

function resaltarTexto(texto, query) {
    var regex = new RegExp('(' + query + ')', 'gi');
    return texto.replace(regex, '<span class="highlight">$1</span>');
}

function seleccionarSugerencia(edificioId, aula) {
    suggestionsContainer.classList.remove('active');
    searchInput.value = aula || infoEdificios[edificioId].nombre;

    destacarEdificio(edificioId);

    if (capasEdificios[edificioId]) {
        var bounds = capasEdificios[edificioId].getBounds();
        map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 18
        });

        setTimeout(function () {
            mostrarPopup(edificioId, capasEdificios[edificioId]);
        }, 500);
    }
}

function destacarEdificio(edificioId) {
    if (edificioDestacado) {
        edificioDestacado.setStyle({
            color: '#2F29D1',
            weight: 0,
            fillColor: '#3388FF',
            fillOpacity: 0
        });
    }

    if (capasEdificios[edificioId]) {
        var layer = capasEdificios[edificioId];
        layer.setStyle({
            fillColor: '#2196F3',
            fillOpacity: 0.6,
            color: '#1976D2',
            weight: 3
        });
        edificioDestacado = layer;

        setTimeout(function () {
            if (edificioDestacado === layer) {
                layer.setStyle({
                    color: '#2F29D1',
                    weight: 0,
                    fillColor: '#3388FF',
                    fillOpacity: 0
                });
                edificioDestacado = null;
            }
        }, 3000);
    }
}
