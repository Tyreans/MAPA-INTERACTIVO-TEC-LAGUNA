<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

$cred = require_once '../config/credenciales.php';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (
        $_POST['usuario'] === $cred['usuario'] &&
        password_verify($_POST['password'], $cred['password'])
    ) {
        $_SESSION['admin'] = true;
        header('Location: index.php?p=editar');
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
    <link rel="stylesheet" type="text/css" href="css/login.css">
</head>
<body>


<div class="login-wrap">
    <div class="login-html">
        <input id="tab-1" type="radio" name="tab" class="sign-in" checked>
        <label for="tab-1" class="tab">Acceso Administrador ITL</label>
        <p style="color:red"><?= $error ?></p> 
        <div class="login-form">
            <form method="post" class="sign-in-htm">
                <div class="group">
                    <label for="usuario" class="label">Nombre del usuario</label>
                    <input id="usuario" name="usuario" type="text" class="input" placeholder="Usuario" required>
                </div>
                <div class="group">
                    <label for="pass" class="label">Contraseña</label>
                    <input id="pass" name="password" type="password" class="input" data-type="password" placeholder="Contraseña" required>
                </div>
                <div class="group">
                    <input type="submit" class="button" value="Entrar">
                </div>
            </form>
        </div>
    </div>
</div>
</body>
</html>
