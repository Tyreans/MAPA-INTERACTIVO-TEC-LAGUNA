# UNIMAP - Mapa Interactivo del ITL 📍🎓

> **Mapa interactivo del campus ITL (Instituto Tecnológico de La Laguna / TecNM) con búsqueda de aulas, edificios y soporte PWA Offline.**

[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-success?style=flat-square&logo=pwa)](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)
[![Deploy with GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?style=flat-square&logo=github)](https://pages.github.com/)
[![Leaflet](https://img.shields.io/badge/Map%20Engine-Leaflet%201.9.4-brightgreen?style=flat-square&logo=leaflet)](https://leafletjs.com/)
[![QGIS](https://img.shields.io/badge/GIS%20Processing-QGIS-93b023?style=flat-square&logo=qgis)](https://qgis.org/)

---

## 📖 Descripción del Proyecto

**UNIMAP** es una aplicación web progresiva (PWA) de mapas interactivos diseñada para guiar a la comunidad del **Instituto Tecnológico de La Laguna (ITL)**, especialmente a estudiantes de nuevo ingreso, docentes y visitantes.

Permite ubicar de manera inmediata e intuitiva cada edificio, aula, laboratorio, departamento administrativo, cafetería e instalación deportiva dentro del campus universitario.

El proyecto está construido bajo una arquitectura **100% estática (HTML5 + CSS3 + Vanilla JavaScript + GeoJSON/JSON)** sin dependencias de backend, optimizado específicamente para su despliegue continuo en **GitHub Pages** y diseñado con enfoque **Offline-First**, permitiendo su uso sin conexión a internet.

---

## 🌟 Características Principales

- 🗺️ **Mapa Satelital de Alta Resolución**: Renderizado local y optimizado de teselas satelitales del campus universitario procesadas en QGIS, sin depender de APIs de mapas externas de pago.
- 🔍 **Buscador Inteligente con Autocompletado**: Búsqueda en tiempo real por número de edificio (ej. `19`, `1A`, `CI`), nombre descriptivo o aula específica (ej. `19L`, `MYR`, `AA-1`, `Sistemas`). Incluye sugerencias dinámicas, resaltado de coincidencias y centrado automático en el edificio seleccionado.
- 🏢 **Fichas Informativas de Edificios**: Al hacer clic sobre cualquier edificio, se despliega un modal interactivo con:
  - Nombre oficial y departamento.
  - Descripción de las instalaciones.
  - Etiquetas visuales (badges) de todas las aulas contenidas.
  - Carrusel fotográfico con imágenes reales de las instalaciones.
- 📱 **PWA (Progressive Web App) Offline**:
  - Instalable en dispositivos móviles (Android / iOS) y computadoras de escritorio.
  - A través de un **Service Worker** (`sw.js`) y la **Cache API**, la aplicación descarga y almacena en caché local todo el código, geometrías vectoriales, base de datos de aulas y las **242 teselas del mapa satelital**.
  - Permite consultar el mapa y buscar aulas **completamente sin conexión a internet** (ideal en zonas del campus con baja cobertura móvil).

---

## 🏆 Créditos y Agradecimientos

Este proyecto hace uso de tecnologías Open Source fundamentales en la ciencia geoespacial y el desarrollo web:

### 🍃 [Leaflet](https://leafletjs.com/)
> *An open-source JavaScript library for mobile-friendly interactive maps.*
- **Leaflet** es el motor cartográfico central de UNIMAP. A través de su API se gestionan las capas de teselas rasterizadas (`L.tileLayer`), la renderización y estilizado de polígonos vectoriales (`L.geoJSON`), los marcadores personalizados con ID en el centroide de cada edificio (`L.divIcon`), los tooltips y los popups informativos.

### 🌐 [QGIS (Quantum GIS)](https://qgis.org/)
> *A Free and Open Source Geographic Information System.*
- **QGIS** fue la herramienta geoespacial imprescindible para la digitalización y preparación cartográfica del campus del ITL:
  1. Georreferenciación de la cartografía satelital del campus.
  2. Digitalización de la geometría poligonal de todos los edificios e infraestructuras (`json/GeoTec.js` / `json/GeometriaITL.geojson`).
  3. Generación y corte de la pirámide de **teselas XYZ (`Teselas/`)** en niveles de zoom 15 al 19 para permitir el renderizado satelital offline.

### 👥 Equipo Desarrollador
- **Juan Pablo Chávez Ramírez**: Diseño cartográfico en QGIS, procesamiento espacial y arquitectura de mapas.
- **Ángel Daniel Salinas Ortiz**: Recolección de información de edificios y aulas, desarrollo web de la interfaz y configuración de PWA offline.
- **Miguel Esparza**: Colaboración y asesoría técnica.
- **Instituto Tecnológico de La Laguna (ITL / TecNM)**: Alma máter y contexto de la aplicación.

---

## 🛠️ Arquitectura Estática (GitHub Pages Ready)

El proyecto es 100% estático (cero PHP, cero dependencias de servidor):

| Componente | Tecnología | Propósito |
|---|---|---|
| **Estructura** | HTML5 Semántico | Punto de entrada único (`index.html`) con metadatos PWA y viewport móvil |
| **Estilos** | CSS3 (`css/styles.css`) | Interfaz responsiva, buscador, carrusel y estilos de popups |
| **Lógica del Mapa** | Vanilla JavaScript | Integración de Leaflet, buscador, resaltado y popups |
| **Datos y Geometría** | GeoJSON & JSON (`json/`) | Polígonos de edificios (`GeoTec.js`) y base de datos de aulas/fotos (`datos.json`) |
| **PWA & Offline** | Service Worker (`sw.js`) | Cache-First con almacenamiento de las 242 teselas e imágenes |
| **Manifiesto** | Web App Manifest (`manifest.json`) | Configuración de instalación PWA en modo `standalone` |

---

## 🚀 Despliegue en GitHub Pages

1. **Sube los cambios a tu rama en GitHub**:
   ```bash
   git add .
   git commit -m "feat: versión estática pura para GitHub Pages con PWA offline"
   git push origin <tu-rama>
   ```

2. **Habilita GitHub Pages**:
   - En tu repositorio de GitHub, entra en **Settings** > **Pages**.
   - En **Build and deployment** > **Source**, selecciona `Deploy from a branch`.
   - Selecciona tu rama y la carpeta `/ (root)`.
   - Haz clic en **Save**.

3. **Accede a tu mapa**:
   En 1 o 2 minutos tu mapa estará en vivo en:
   ```
   https://<tu-usuario>.github.io/<nombre-del-repositorio>/
   ```

---

## 📲 Cómo Usar e Instalar la PWA Offline

### En Teléfonos Móviles (Android / iOS):
1. Abre el enlace del mapa en tu navegador móvil.
2. Toca en **"Agregar a la pantalla principal"** o **"Instalar aplicación"**:
   - En **Chrome (Android)**: Toca el menú `⋮` > **Instalar aplicación**.
   - En **Safari (iOS)**: Toca el botón Compartir `⎋` > **Agregar al inicio**.
3. La aplicación se instalará como una app nativa con su icono institucional.
4. **Prueba Offline**: Activa el Modo Avión o apaga tus datos móviles y Wi-Fi. Abre UNIMAP: podrás explorar el mapa satelital y buscar cualquier edificio o aula completamente sin conexión.

---

## 💻 Ejecución Local

Para probar localmente:

```bash
# Con Python:
python3 -m http.server 8080

# O con Node.js:
npx serve .
```
Abre en tu navegador `http://localhost:8080`.

---

## 📁 Estructura del Directorio

```text
MAPA-INTERACTIVO-TEC-LAGUNA/
│
├── index.html                   # Punto de entrada principal (HTML5 estático)
├── manifest.json                # Manifiesto de la PWA (Standalone, iconos, colores)
├── sw.js                        # Service Worker con estrategia de caché offline
├── README.md                    # Documentación del proyecto
├── .gitignore                   # Archivos ignorados por Git
│
├── css/
│   └── styles.css               # Estilos del mapa, buscador, sugerencias y popups
│
├── js/
│   └── main.js                  # Inicialización de Leaflet, capas de edificios y buscador
│
├── json/
│   ├── datos.json               # Información de edificios, aulas y rutas de fotografías
│   ├── GeoTec.js                # Polígonos de edificios en formato GeoJSON JS
│   ├── GeometriaITL.geojson     # Geometría pura del campus
│   └── Geometria_TEC_GOOGLE_EWI.geojson
│
├── img/                         # Logotipos y fotografías de los edificios
│   ├── logo.png
│   ├── logo-192.png
│   ├── logo-512.png
│   ├── logo-tecnm.png
│   └── [18, 19, 1A, 29, 34, 37, 38, 5, CI, D6]/  # Carpetas de fotografías
│
└── Teselas/                     # Pirámide de teselas satelitales (QGIS)
    ├── 15/                      # Zoom 15
    ├── 16/                      # Zoom 16
    ├── 17/                      # Zoom 17
    ├── 18/                      # Zoom 18
    └── 19/                      # Zoom 19 (máximo detalle local)
```

---

## 📜 Licencia

Desarrollado con fines educativos y de orientación comunitaria para el **Instituto Tecnológico de La Laguna**. Librerías Open Source: Leaflet (Licencia BSD-2-Clause) y QGIS (Licencia GNU GPL).
