<!DOCTYPE html>
<html>
    <head>
        <title>Mapa Interactivo ITL</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"integrity="sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H"crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"integrity="sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH"crossorigin=""></script>
        <script src="GeoTec.js"></script>
        <style type="text/css">
            body {margin: 0;padding: 0;} html, body, #map{width: 100%;height: 100%;}
        </style>
        <link rel="stylesheet" href="css/styles.css">
        <link rel="icon" type="image/x-icon" href="img/logo-tecnm.png">
    </head>
    <body>
        <div id="map"> </div>
        
        <div class="searchbar-container">
            <div class="searchbar-input-wrapper">
                <input 
                    type="text" 
                    id="searchbar-input" 
                    class="searchbar-input" 
                    placeholder="Buscar edificio o aula (ej: 19L, Edificio 19)..."
                    autocomplete="off"
                >
                <button type="button" class="searchbar-button" id="search-btn">🔍</button>
                <div id="searchbar-suggestions" class="searchbar-suggestions"></div>
            </div>
        </div>

        <script>
            var map = L.map('map', {attributionControl: false}).setView([25.5324, -103.436], 17);
            L.control.attribution({prefix: false}).addTo(map);
            var tilesource_layer = L.tileLayer('Teselas ITL Satelital//{z}/{x}/{y}.jpg', {minZoom: 15, maxZoom: 19, tms: false, attribution: 'Imagenes extraidas de Google Maps. Mapa disenado por Juan Pablo e informacion de los edificios recolectada por Angel Daniel'}).addTo(map);

            //Geometria del GEOJSON
            var infoEdificios = {};

            //variables de la busqueda
            var geoJSONLayer;
            var capasEdificios = {};
            var edificioDestacado = null;
            
            fetch('datos.json')
                .then(response => response.json())
                .then(data => {
                    infoEdificios = data;
                    console.log("exito");
                })
                .catch(error => console.error("error", error));

            L.geoJSON(datosTec, {
                style: function (feature){
                    return{
                        color: '#2F29D1',
                        weight: 0,
                        fillColor: '#3388FF',
                        fillOpacity: 0
                    };
                },
                onEachFeature: function (feature, layer){
                    if(feature.properties.id) {
                        capasEdificios[feature.properties.id] = layer;
                    }

                    if(feature.properties.Nombre) {
                        layer.bindTooltip(feature.properties.Nombre, {
                            permanent: false,
                            direction: 'top',
                            className: 'mi-tooltip-estilo'
                        });
                    }
                    if(feature.properties.id){
                        var centro = layer.getBounds().getCenter();
                        var iconoID = L.divIcon({
                            className: 'label-edificio',
                            html: feature.properties.id,
                            iconSize: [24, 24],
                            iconAnchor : [12,12]
                        });

                        L.marker(centro, {icon: iconoID, interactive: false}).addTo(map);
                    }

                    layer.on('click', function(){
                        var id = feature.properties.id;
                        var datos = infoEdificios[id];

                        if(datos){
                            const formData = new FormData();
                            formData.append('folder', datos.carpeta);

                            fetch('index.php?p=getimages', {
                                method: 'POST',
                                body: formData
                            })
                            .then(response => response.json())
                            .then(imagenes =>{
                                var imagenesHTML='';
                                if(imagenes.length > 0){
                                    imagenesHTML = '<div class="carousel-container">';
                                    imagenes.forEach(imgUrl => {
                                        imagenesHTML += `<img src="${imgUrl}">`;
                                    });
                                    imagenesHTML+='</div>';
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
                                    </div>
                                `;

                                layer.bindPopup(popupContent).openPopup();
                            })
                        }else{
                            layer.bindPopup(`<b>${id}</b><br>Información no disponible`).openPopup();
                        }
                    });
                }
            }).addTo(map);

            //Barra de busqueda metodo AJAX
            var searchInput = document.getElementById('searchbar-input');
            var suggestionsContainer = document.getElementById('searchbar-suggestions');
            var searchBtn = document.getElementById('search-btn');

            searchInput.addEventListener('input', function(){
                var query = this.value.toLowerCase().trim();

                if(query.length === 0){
                    suggestionsContainer.classList.remove('active');
                    return;
                }

                var resultados = buscarEdificiosYAulas(query);
                mostrarSugerencias(resultados, query);
            });

            searchBtn.addEventListener('click', function(){
                var query = searchInput.value.toLowerCase().trim();

                if(query.length>0){
                    var resultados = buscarEdificiosYAulas(query);
                    if(resultados.length>0){
                        seleccionarSugerencias(resultado[0].edificioId, resultados[0].aula);
                    }
                }
            });

            searchInput.addEventListener('keypress', function(e) {
                if(e.key === 'Enter') {
                    e.preventDefault();
                    searchBtn.click();
                }
            });

            function buscarEdificiosYAulas(query){
                var resultados = [];

                for(var edificioId in infoEdificios){
                    var edificio = infoEdificios[edificioId];
                    var nombreEdificio = edificio.nombre.toLowerCase();
                    var idMinusculas = edificioId.toLowerCase();

                    if(nombreEdificio.includes(query) || edificioId.includes(query)){
                        resultados.push({
                            tipo: 'edificio',
                            edificioId: edificioId,
                            nombre: edificio.nombre,
                            aula: null
                        });
                    }

                    if(edificio.aulas){
                        edificio.aulas.forEach(function(aula){
                            if(aula.toLowerCase().includes(query)){
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

            function mostrarSugerencias(resultados, query){
                suggestionsContainer.innerHTML = '';

                if(resultados.length === 0){
                    suggestionsContainer.classList.remove('active');
                    return;
                }

                var resultadosLimitados = resultados.slice(0, 10);

                resultados.forEach(function(resultado){
                    var item = document.createElement('div');
                    item.className = 'suggestion-item';

                    if(resultado.tipo === 'edificio'){
                        item.innerHTML = `<div class="suggestion-edificio">${resaltarTexto(resultado.nombre, query)}</div>`;
                    }else{
                        item.innerHTML = `
                            <div class="suggestion-edificio">${resultado.nombre}</div>
                            <div class="suggestion-aula">✒️ ${resaltarTexto(resultado.aula, query)}</div>
                        `;
                    }

                    item.addEventListener('click', function(){
                        seleccionarSugerencia(resultado.edificioId, resultado.aula);
                    });

                    suggestionsContainer.appendChild(item);
                });

                suggestionsContainer.classList.add('active');
            }

            function resaltarTexto(texto, query){
                var regex = new RegExp('('+query+')', 'gi');
                return texto.replace(regex, '<span class="highlight">$1</span>');
            }

            function seleccionarSugerencia(edificioId, aula) {

                suggestionsContainer.classList.remove('active');
                searchInput.value = aula || infoEdificios[edificioId].nombre;

                destacarEdificio(edificioId);

                if(capasEdificios[edificioId]) {
                    var bounds = capasEdificios[edificioId].getBounds();
                    map.fitBounds(bounds, {
                        padding: [50, 50],
                        maxZoom: 18
                    });

                    setTimeout(function() {
                        mostrarPopup(edificioId, capasEdificios[edificioId]);
                    }, 500);
                }
            }

            var edificioDestacado = null;

            function destacarEdificio(edificioId) {
                if(edificioDestacado) {
                    // Restaurar al estilo original
                    edificioDestacado.setStyle({
                        color: '#2F29D1',
                        weight: 0,
                        fillColor: '#3388FF',
                        fillOpacity: 0
                    });
                }

                // Destacar nuevo edificio
                if(capasEdificios[edificioId]) {
                    var layer = capasEdificios[edificioId];
                    layer.setStyle({
                        fillColor: '#2196F3',
                        fillOpacity: 0.6,
                        color: '#1976D2',
                        weight: 3
                    });
                    edificioDestacado = layer;

                    // Restaurar después de 3 segundos
                    setTimeout(function() {
                        if(edificioDestacado === layer) {
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
        </script>
    </body>
</html>;