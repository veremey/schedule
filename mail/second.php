<?php
if($_POST)
    {
   $to = "partner@raspisaniye-vuzov.ru"; 
    $from = $_POST['contact']; 
    $subject = '=?UTF-8?B?'.base64_encode('University (support/contact) от '.$_POST['name']).'?=';  
	
    $message = 'Имя: '.$_POST['name'].';'."<br/>".' Email: '.$_POST['contact'].';';
    $headers = "Content-type: text/html; charset=UTF-8 \r\n";
    $headers .= 'From: <'.$_POST['contact'].'>\r\n';
    $result = mail($to, $subject, $message, $headers);
 
    if ($result){
        echo "<p>Cообщение успешно отправленно</p>";
    }
    }
?>