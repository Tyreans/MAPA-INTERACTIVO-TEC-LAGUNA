// ==========================================
// UNIMAP - Mapa Interactivo ITL
// Motor: Leaflet 1.9.4 & QGIS
// ==========================================

// 1. Inicialización del Mapa
var map = L.map('map', { attributionControl: false }).setView([25.5324, -103.436], 17);
L.control.attribution({ prefix: false }).addTo(map);

// Capa satelital local con teselas procesadas en QGIS
var tilesource_layer = L.tileLayer('Teselas/{z}/{x}/{y}.jpg', {
    minZoom: 15,
    maxZoom: 19,
    tms: false,
    attribution: 'Renderizado con tecnologías Open Source de <a href="https://leafletjs.com/" target="_blank">Leaflet</a> y <a href="https://qgis.org/" target="_blank">QGIS</a> | Imágenes Google Maps | Diseñado por Juan Pablo Chávez y Ángel Daniel Salinas'
}).addTo(map);

// Variables de datos y capas del campus
var infoEdificios = {};
var capasEdificios = {};
var edificioDestacado = null;

// 2. Cargar metadatos de los edificios (aulas, descripciones e imágenes)
fetch('json/datos.json')
    .then(response => response.json())
    .then(data => {
        infoEdificios = data;
        console.log("Metadatos de edificios cargados con éxito.");
    })
    .catch(error => console.error("Error cargando datos.json:", error));

// 3. Renderizar geometrías de los edificios desde datosTec (definido en json/GeoTec.js)
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
        var id = feature.properties.id;

        if (id) {
            capasEdificios[id] = layer;
        }

        if (feature.properties.Nombre) {
            layer.bindTooltip(feature.properties.Nombre, {
                permanent: false,
                direction: 'top',
                className: 'mi-tooltip-estilo'
            });
        }

        if (id) {
            var centro = layer.getBounds().getCenter();
            var iconoID = L.divIcon({
                className: 'label-edificio',
                html: id,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            L.marker(centro, { icon: iconoID, interactive: false }).addTo(map);
        }

        layer.on('click', function () {
            mostrarPopupEdificio(id, layer);
        });
    }
}).addTo(map);

// 4. Detalle y Popup Informativo del Edificio
function mostrarPopupEdificio(id, layer) {
    var datos = infoEdificios[id];
    if (datos) {
        var imagenesHTML = '';
        if (datos.imagenes && datos.imagenes.length > 0) {
            imagenesHTML = '<div class="carousel-container">';
            datos.imagenes.forEach(imgUrl => {
                imagenesHTML += `<img src="${imgUrl}" alt="${datos.nombre}">`;
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
                <p>${datos.descripcion || ''}</p>
                ${aulasHTML ? '<strong>Aulas u otros:</strong>' + aulasHTML : ''}
            </div>
        `;

        layer.bindPopup(popupContent).openPopup();
    } else {
        layer.bindPopup(`
            <div class="popup-tec">
                <h3>Edificio ${id}</h3>
                <p>Información detallada no disponible.</p>
            </div>
        `).openPopup();
    }
}

// Wrapper para abrir popups desde el buscador
function mostrarPopup(edificioId, layer) {
    mostrarPopupEdificio(edificioId, layer);
}

// 5. Barra de Búsqueda Inteligente
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

function buscarEdificiosYAulas(query) {
    var resultados = [];

    for (var edificioId in infoEdificios) {
        var edificio = infoEdificios[edificioId];
        var nombreEdificio = (edificio.nombre || '').toLowerCase();
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
