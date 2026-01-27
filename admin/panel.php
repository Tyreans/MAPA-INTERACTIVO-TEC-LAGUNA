<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
if (!isset($_SESSION['admin'])) {
    header('Location: login.php');
    exit;
}

$rutaJson = __DIR__ . '/../datos.json';
$datos = file_exists($rutaJson)
    ? json_decode(file_get_contents($rutaJson), true)
    : [];

/* MODO EDICIÓN */
$editando = false;
$edificioEdit = [
    'nombre' => '',
    'descripcion' => '',
    'imagen' => '',
    'aulas' => []
];

if (isset($_GET['editar']) && isset($datos[$_GET['editar']])) {
    $editando = true;
    $edificioEdit = $datos[$_GET['editar']];
    $edificioEdit['aulas'] = $edificioEdit['aulas'] ?? [];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Panel Admin - IT Laguna</title>
</head>
<body>

<h1>Panel de administración</h1>
<a href="logout.php">Cerrar sesión</a>

<hr>

<h2>Edificios registrados</h2>
<ul>
<?php foreach ($datos as $id => $e): ?>
    <li>
        <strong><?= htmlspecialchars($e['nombre']) ?></strong>
        <a href="panel.php?editar=<?= $id ?>">✏️ Editar</a>
        <form action="procesar.php" method="post" style="display:inline">
            <input type="hidden" name="eliminar" value="<?= $id ?>">
            <button type="submit">🗑️ Eliminar</button>
        </form>
    </li>
<?php endforeach; ?>
</ul>

<hr>

<h2><?= $editando ? 'Editar edificio' : 'Agregar nuevo edificio' ?></h2>

<form action="procesar.php" method="post" enctype="multipart/form-data">

<?php if ($editando): ?>
    <input type="hidden" name="id" value="<?= htmlspecialchars($_GET['editar']) ?>">
<?php endif; ?>

<input
    type="text"
    name="nombre"
    placeholder="Nombre del edificio"
    value="<?= htmlspecialchars($edificioEdit['nombre']) ?>"
    required
><br><br>

<textarea
    name="descripcion"
    placeholder="Descripción"
><?= htmlspecialchars($edificioEdit['descripcion']) ?></textarea><br><br>

<?php if (!empty($edificioEdit['imagen'])): ?>
    <p>Imagen actual:</p>
    <img src="../<?= $edificioEdit['imagen'] ?>" width="150"><br>
    <label>
        <input type="checkbox" name="quitar_imagen"> Quitar imagen
    </label><br><br>
<?php endif; ?>

<input type="file" name="imagen" accept="image/*"><br><br>

<h3>Aulas</h3>
<p>Escribe una aula por línea</p>

<textarea
    name="aulas"
    rows="6"
    placeholder="Ejemplo:
A1
A2
Laboratorio 3"
><?= htmlspecialchars(implode("\n", $edificioEdit['aulas'])) ?></textarea><br><br>

<button type="submit">
    <?= $editando ? 'Guardar cambios' : 'Agregar edificio' ?>
</button>

<?php if ($editando): ?>
    <a href="panel.php">Cancelar edición</a>
<?php endif; ?>

</form>

</body>
</html>


