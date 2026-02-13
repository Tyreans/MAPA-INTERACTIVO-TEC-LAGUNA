<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

header('Content-Type: application/json');

// Verificar sesión
if (!isset($_SESSION['admin'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

try {
    $rutaJson = __DIR__ . '/../public/datos.json';
    $datos = file_exists($rutaJson) 
        ? json_decode(file_get_contents($rutaJson), true) 
        : [];
    
    $id = $_POST['id'] ?? '';
    $nombre = trim($_POST['nombre'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');
    $aulasTexto = trim($_POST['aulas'] ?? '');
    
    // Validaciones
    if (empty($nombre)) {
        throw new Exception('El nombre del edificio es requerido');
    }
    
    // Procesar aulas
    $aulas = array_filter(
        array_map('trim', explode("\n", $aulasTexto)),
        fn($a) => !empty($a)
    );
    
    // Determinar ID (extraer número del edificio)
    if (empty($id)) {
        // Nuevo edificio - extraer número del nombre
        preg_match('/\d+/', $nombre, $matches);
        $id = $matches[0] ?? uniqid();
        $carpeta = [$id];
    } else {
        // Edificio existente - mantener carpeta
        $carpeta = $datos[$id]['carpeta'] ?? [$id];
    }
    
    // Crear carpeta si no existe
    $carpetaImg = __DIR__ . '/../public/img/' . $id;
    if (!file_exists($carpetaImg)) {
        mkdir($carpetaImg, 0755, true);
    }
    
    // Procesar eliminación de imágenes
    $imagenesAEliminar = json_decode($_POST['imagenes_eliminar'] ?? '[]', true);
    
    foreach ($imagenesAEliminar as $rutaImagen) {
        $rutaCompleta = __DIR__ . '/../public/' . $rutaImagen;
        if (file_exists($rutaCompleta)) {
            unlink($rutaCompleta);
        }
    }
    
    // Procesar nuevas imágenes
    if (isset($_FILES['imagenes'])) {
        $archivos = $_FILES['imagenes'];
        
        for ($i = 0; $i < count($archivos['name']); $i++) {
            if ($archivos['error'][$i] === UPLOAD_ERR_OK) {
                $extension = strtolower(pathinfo($archivos['name'][$i], PATHINFO_EXTENSION));
                $permitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                
                if (!in_array($extension, $permitidas)) {
                    continue;
                }
                
                // Generar nombre único
                $nombreArchivo = uniqid('img_') . '.' . $extension;
                $rutaDestino = $carpetaImg . '/' . $nombreArchivo;
                
                if (!move_uploaded_file($archivos['tmp_name'][$i], $rutaDestino)) {
                    throw new Exception('Error al subir imagen: ' . $archivos['name'][$i]);
                }
            }
        }
    }
    
    // Guardar datos (solo nombre, descripcion, aulas y carpeta)
    $datos[$id] = [
        'nombre' => $nombre,
        'descripcion' => $descripcion,
        'aulas' => $aulas,
        'carpeta' => $carpeta
    ];
    
    // Guardar JSON
    if (!file_put_contents($rutaJson, json_encode($datos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        throw new Exception('Error al guardar el archivo JSON');
    }
    
    echo json_encode([
        'success' => true,
        'message' => empty($_POST['id']) 
            ? 'Edificio agregado correctamente' 
            : 'Cambios guardados correctamente',
        'id' => $id
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}