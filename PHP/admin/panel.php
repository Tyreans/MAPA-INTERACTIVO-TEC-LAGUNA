<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
if (!isset($_SESSION['admin'])) {
    header('Location: index.php?p=login');
    exit;
}

$rutaJson = __DIR__ . '/../public/datos.json';
$datos = file_exists($rutaJson)
    ? json_decode(file_get_contents($rutaJson), true)
    : [];

/* MODO EDICIÓN */
$edificioEdit = [
    'nombre' => '',
    'descripcion' => '',
    'carpeta' => [],
    'aulas' => []
];

$edificioId = '';

if (isset($_GET['editar']) && isset($datos[$_GET['editar']])) {
    $edificioId = $_GET['editar'];
    $edificioEdit = $datos[$edificioId];
    $edificioEdit['aulas'] = $edificioEdit['aulas'] ?? [];
    $edificioEdit['carpeta'] = $edificioEdit['carpeta'] ?? [];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Panel Admin - ITL Laguna</title>
<link href="https://fonts.googleapis.com/css?family=Open+Sans:600" rel="stylesheet">
<link rel="stylesheet" href="css/panel.css">
</head>
<body>

<div class="admin-container">
    <div class="admin-header">
        <h1>Panel de administración - Edificios</h1>
        <a href="index.php?p=logout">Cerrar sesión</a>
    </div>

    <div class="panel-layout">
        <!-- Sidebar con lista de edificios -->
        <div class="edificios-sidebar">
            <h2>📍 Edificios</h2>
            <ul>
            <?php foreach ($datos as $id => $e): ?>
                <li>
                    <a href="index.php?p=editar&editar=<?= $id ?>" 
                       class="edificio-item <?= $edificioId === $id ? 'active' : '' ?>">
                        <strong><?= htmlspecialchars($e['nombre']) ?></strong>
                        <small><?= count($e['aulas'] ?? []) ?> aulas registradas</small>
                    </a>
                </li>
            <?php endforeach; ?>
            </ul>
        </div>

        <!-- Panel de edición -->
        <div class="form-section">
            <?php if ($edificioId): ?>
                <h2>Editar: <?= htmlspecialchars($edificioEdit['nombre']) ?></h2>

                <div id="message" class="message"></div>

                <form id="edificioForm">
                    <input type="hidden" name="id" value="<?= htmlspecialchars($edificioId) ?>">

                    <div class="form-group">
                        <label>Nombre del edificio</label>
                        <input
                            type="text"
                            name="nombre"
                            id="nombre"
                            placeholder="Nombre del edificio"
                            value="<?= htmlspecialchars($edificioEdit['nombre']) ?>"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea
                            name="descripcion"
                            id="descripcion"
                            placeholder="Descripción del edificio"
                            rows="4"
                        ><?= htmlspecialchars($edificioEdit['descripcion']) ?></textarea>
                    </div>

                    <!-- Carrusel de imágenes existentes -->
                    <div class="carousel-container" id="carouselContainer" style="display: none;">
                        <h3>Imágenes actuales (Carpeta: <span id="carpetaActual"></span>)</h3>
                        <div class="carousel" id="imagenesActuales">
                            <!-- Se cargará dinámicamente -->
                        </div>
                    </div>

                    <!-- Zona de carga de nuevas imágenes -->
                    <div class="upload-zone" id="uploadZone">
                        <input type="file" id="imageInput" accept="image/*" multiple>
                        <p>📁 Haz clic o arrastra imágenes aquí</p>
                        <p style="font-size: 12px; color: #666;">Formatos: JPG, PNG, GIF</p>
                    </div>

                    <!-- Previsualización de nuevas imágenes -->
                    <div class="preview-container" id="previewContainer">
                        <h3>Nuevas imágenes a cargar</h3>
                        <div id="previewList"></div>
                    </div>

                    <div class="form-group">
                        <label>Aulas</label>
                        <p style="font-size: 13px; color: #999; margin: 5px 0;">Escribe una aula por línea</p>
                        <textarea
                            name="aulas"
                            id="aulas"
                            rows="8"
                            placeholder="Ejemplo:&#10;19A&#10;19B&#10;Laboratorio 3"
                        ><?= htmlspecialchars(implode("\n", $edificioEdit['aulas'])) ?></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary">
                        💾 Guardar cambios
                    </button>
                </form>
            <?php else: ?>
                <div class="no-selection">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3>Selecciona un edificio</h3>
                    <p>Elige un edificio de la lista para editar su información</p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<script>
const uploadZone = document.getElementById('uploadZone');
const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('previewContainer');
const previewList = document.getElementById('previewList');
const form = document.getElementById('edificioForm');
const messageDiv = document.getElementById('message');
const carouselContainer = document.getElementById('carouselContainer');
const imagenesActuales = document.getElementById('imagenesActuales');
const carpetaActual = document.getElementById('carpetaActual');

let nuevasImagenes = [];
let imagenesAEliminar = [];
let edificioId = '<?= $edificioId ?>';
let imagenesExistentes = [];

// Cargar imágenes existentes si hay un edificio seleccionado
if (edificioId) {
    cargarImagenesExistentes();
}

async function cargarImagenesExistentes() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const edificioId = urlParams.get('editar');

        if (!edificioId) {
            return;
        }

        const datos = new FormData();
        datos.append('folder', edificioId);

        const response = await fetch('index.php?p=getimages', {
            method: 'POST',
            body: datos
        });

        const imagenes = await response.json();
        
        if (imagenes && imagenes.length > 0) {
            imagenesExistentes = imagenes;
            carpetaActual.textContent = edificioId;
            carouselContainer.style.display = 'block';
            mostrarImagenesExistentes();
        } else {
            carouselContainer.style.display = 'none';
        }

    } catch (error) {
        console.error('Error al cargar imágenes:', error);
    }
}

function mostrarImagenesExistentes() {
    imagenesActuales.innerHTML = '';
    
    imagenesExistentes.forEach((rutaImagen, index) => {
        if (!imagenesAEliminar.includes(rutaImagen)) {
            const div = document.createElement('div');
            div.className = 'carousel-item';
            div.setAttribute('data-imagen', rutaImagen);
            
            // ✅ SOLUCIÓN: Usar addEventListener en lugar de onclick inline
            const img = document.createElement('img');
            img.src = rutaImagen;
            img.alt = `Imagen ${index + 1}`;
            
            const btnDelete = document.createElement('button');
            btnDelete.type = 'button';
            btnDelete.className = 'delete-btn';
            btnDelete.textContent = '×';
            
            // Agregar event listener directamente (evita problemas con comillas en rutas)
            btnDelete.addEventListener('click', () => {
                eliminarImagen(rutaImagen);
            });
            
            div.appendChild(img);
            div.appendChild(btnDelete);
            imagenesActuales.appendChild(div);
        }
    });
    
    if (imagenesActuales.children.length === 0) {
        carouselContainer.style.display = 'none';
    }
}

if (uploadZone && imageInput) {
    uploadZone.addEventListener('click', () => imageInput.click());

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        procesarArchivos(files);
    });

    imageInput.addEventListener('change', (e) => {
        procesarArchivos(Array.from(e.target.files));
    });
}

function procesarArchivos(files) {
    files.forEach(file => {
        nuevasImagenes.push(file);
        mostrarPreview(file);
    });
}

function mostrarPreview(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Preview';
        
        const btnRemove = document.createElement('button');
        btnRemove.type = 'button';
        btnRemove.className = 'remove-preview';
        btnRemove.textContent = '×';
        
        // ✅ Event listener en lugar de onclick
        btnRemove.addEventListener('click', () => {
            removerPreview(btnRemove, file.name);
        });
        
        div.appendChild(img);
        div.appendChild(btnRemove);
        previewList.appendChild(div);
        previewContainer.classList.add('active');
    };
    
    reader.readAsDataURL(file);
}

function removerPreview(btn, fileName) {
    btn.parentElement.remove();
    nuevasImagenes = nuevasImagenes.filter(f => f.name !== fileName);
    
    console.log('Removiendo preview:', fileName); // Para debug
    console.log('Nuevas imágenes restantes:', nuevasImagenes.length); // Para debug
    
    if (nuevasImagenes.length === 0) {
        previewContainer.classList.remove('active');
    }
}

function eliminarImagen(rutaImagen) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    
    console.log('Agregando a eliminar:', rutaImagen); // Para debug
    imagenesAEliminar.push(rutaImagen);
    console.log('Lista de eliminación:', imagenesAEliminar); // Para debug
    
    mostrarImagenesExistentes();
}

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        
        const idEdificio = document.querySelector('input[name="id"]')?.value || '';
        formData.append('id', idEdificio);
        formData.append('nombre', document.getElementById('nombre').value);
        formData.append('descripcion', document.getElementById('descripcion').value);
        formData.append('aulas', document.getElementById('aulas').value);
        
        nuevasImagenes.forEach((file) => {
            formData.append('imagenes[]', file);
        });
        
        formData.append('imagenes_eliminar', JSON.stringify(imagenesAEliminar));
        
        try {
            const response = await fetch('index.php?p=saveData', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                mostrarMensaje('✓ ' + result.message, 'success');
                
                // Limpiar arrays
                nuevasImagenes = [];
                imagenesAEliminar = [];
                
                // Recargar imágenes
                setTimeout(() => cargarImagenesExistentes(), 500);
                
            } else {
                mostrarMensaje('✗ ' + result.message, 'error');
            }
            
        } catch (error) {
            mostrarMensaje('✗ Error al guardar: ' + error.message, 'error');
        }
    });
}

function mostrarMensaje(texto, tipo) {
    messageDiv.textContent = texto;
    messageDiv.className = `message ${tipo} show`;
    
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 5000);
}
</script>

</body>
</html>