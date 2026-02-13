<?php
// 1. Definimos la carpeta donde guardaremos las secciones (por orden)

// 2. Capturamos la variable de la URL (ej: index.php?p=pagina1)
// // Si no hay variable, por defecto cargamos 'inicio'
// $pagina = isset($_GET['p']) ? $_GET['p'] : 'mapa';
if(!isset($_GET['p'])){
    $pagina = 'mapa';
    $archivo =  $pagina . '.php';
}else if($_GET['p']=='editar'){
    $archivo =  '../admin/panel.php';
}else if($_GET['p']=='login'){
    $archivo =  '../admin/login.php';
}else if($_GET['p']=='logout'){
    $archivo =  '../admin/logout.php';
}else if($_GET['p']=='getimages'){
    $archivo =  '../admin/imagelist.php';
}else if($_GET['p']=='saveData'){
    $archivo =  '../admin/saveEdificio.php';
}else{
    $archivo = '404.php';
}

// // 3. Limpieza de seguridad (Evita que alguien intente saltar de carpetas)
// $pagina = str_replace(array('.', '/'), '', $pagina);

// // 4. Verificamos si el archivo existe
// $archivo =  $pagina . '.php';

if (file_exists($archivo)) {
    include($archivo);
} else {
    // Si la página no existe, cargamos un error 404 personalizado
    include($directorio_paginas . '404.php');
}
?>