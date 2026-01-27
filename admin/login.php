<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

$cred = require __DIR__ . '/../config/credenciales.php';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (
        $_POST['usuario'] === $cred['usuario'] &&
        password_verify($_POST['password'], $cred['password'])
    ) {
        $_SESSION['admin'] = true;
        header('Location: panel.php');
        exit;
    } else {
        $error = 'Credenciales incorrectas';
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Login Admin ITL</title>
</head>
<body>

<h2>Acceso administrador - IT Laguna</h2>

<form method="post">
    <input type="text" name="usuario" placeholder="Usuario" required><br>
    <input type="password" name="password" placeholder="Contraseña" required><br>
    <button type="submit">Entrar</button>
</form>

<p style="color:red"><?= $error ?></p>

</body>
</html>
