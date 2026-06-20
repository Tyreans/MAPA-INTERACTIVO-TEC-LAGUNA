<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
if (!isset($_SESSION['admin'])) exit;

$rutaJson = __DIR__ . '/../public/json/datos.json';
$datos = file_exists($rutaJson)
    ? json_decode(file_get_contents($rutaJson), true)
    : [];

/* ELIMINAR */
if (isset($_POST['eliminar'])) {
    unset($datos[$_POST['eliminar']]);
    file_put_contents(
        $rutaJson,
        json_encode($datos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );
    header('Location: panel.php');
    exit;
}

/* ID */
$id = $_POST['id'] ?? uniqid();

$existing = $datos[$id] ?? [];
$carpeta = $existing['carpeta'] ?? $id;
if (is_array($carpeta)) {
    $carpeta = $carpeta[0] ?? $id;
}

/* AULAS */
$aulas = [];
if (!empty($_POST['aulas'])) {
    $lineas = explode("\n", $_POST['aulas']);
    foreach ($lineas as $aula) {
        $aula = trim($aula);
        if ($aula !== '') {
            $aulas[] = $aula;
        }
    }
}

/* IMAGEN */
$imagen = $existing['imagen'] ?? '';

if (isset($_POST['quitar_imagen'])) {
    $imagen = '';
}

$carpetaImg = __DIR__ . '/../public/img/' . $id;
if (!file_exists($carpetaImg)) {
    mkdir($carpetaImg, 0755, true);
}

if (!empty($_FILES['imagen']['name'])) {
    $permitidos = ['image/jpeg','image/png','image/webp'];
    if (in_array($_FILES['imagen']['type'], $permitidos)) {
        $nombreImg = uniqid() . '_' . basename($_FILES['imagen']['name']);
        move_uploaded_file(
            $_FILES['imagen']['tmp_name'], 
            $carpetaImg . '/' . $nombreImg
        );
        $imagen = 'img/' . $id . '/' . $nombreImg;
    }
}

/* GUARDAR */
$datos[$id] = [
    'nombre' => $_POST['nombre'],
    'descripcion' => $_POST['descripcion'],
    'imagen' => $imagen,
    'aulas' => $aulas,
    'carpeta' => $carpeta
];
if (!empty($existing['imagenes'])) {
    $datos[$id]['imagenes'] = $existing['imagenes'];
}

file_put_contents(
    $rutaJson,
    json_encode($datos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

header('Location: panel.php');
