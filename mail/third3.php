<?php
if($_POST)
    {
    $to = "contact@raspisaniye-vuzov.ru"; 
    $from = $_POST['contact3']; 
	$subject = '=?UTF-8?B?'.base64_encode('Raspisaniye (support/contact) from '.$_POST['name3']).'?='; 
    $message = 'Имя: '.$_POST['name3'].';'."<br/>".' Email: '.$_POST['contact3'].';'."<br/>".' Cообщение: '.$_POST['text3'].';';
    $headers = "Content-type: text/html; charset=UTF-8 \r\n";
    $headers .= 'From: <'.$_POST['contact3'].'>\r\n';
    $result = mail($to, $subject, $message, $headers);
 
    if ($result){
        echo "<p>Cообщение успешно отправленно</p>";
    }
    }
?>