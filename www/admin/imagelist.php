<?php
header('Content-Type: application/json');

$folder = '';
if (isset($_GET['folder'])) {
    $folder = trim($_GET['folder']);
} elseif (isset($_POST['folder'])) {
    $folder = trim($_POST['folder']);
}
$folder = preg_replace('/[^A-Za-z0-9_-]/', '', $folder);

if ($folder === '') {
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