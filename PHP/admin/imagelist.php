<?php
header('Content-Type: application/json');

$folder = $_POST['folder'];

if (empty($folder)) {
    echo json_encode([]);
    exit;
}

$dir = "img/" . $folder; 
$images = [];

if (is_dir($dir)) {
    // Escaneamos la carpeta buscando extensiones comunes
    $files = scandir($dir);
    foreach ($files as $file) {
        if (preg_match('/\.(jpg|jpeg|png|gif)$/i', $file)) {
            $images[] = $dir . "/" . $file;
        }
    }
}

echo json_encode($images);
?>