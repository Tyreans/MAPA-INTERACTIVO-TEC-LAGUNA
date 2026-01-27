<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
if (!isset($_SESSION['admin'])) exit;

$rutaJson = __DIR__ . '/../datos.json';
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
$imagen = $datos[$id]['imagen'] ?? '';

if (isset($_POST['quitar_imagen'])) {
    $imagen = '';
}

if (!empty($_FILES['imagen']['name'])) {
    $permitidos = ['image/jpeg','image/png','image/webp'];
    if (in_array($_FILES['imagen']['type'], $permitidos)) {
        $nombreImg = uniqid() . '_' . basename($_FILES['imagen']['name']);
        move_uploaded_file(
            $_FILES['imagen']['tmp_name'],
            __DIR__ . '/../img/edificios/' . $nombreImg
        );
        $imagen = 'img/edificios/' . $nombreImg;
    }
}

/* GUARDAR */
$datos[$id] = [
    'nombre' => $_POST['nombre'],
    'descripcion' => $_POST['descripcion'],
    'imagen' => $imagen,
    'aulas' => $aulas
];

file_put_contents(
    $rutaJson,
    json_encode($datos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

header('Location: panel.php');
