<?php

/*

Это временное решение на дев сервере

*/

if( !empty( $_GET['q'] ) && !is_array( $_GET['q'] ) ){
    
    $content = file_get_contents( 'http://raspisaniye-vuzov.ru/api/' . $_GET['q'] );
    
    echo $content;
    
}

