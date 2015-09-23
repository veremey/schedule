<?php
if($_POST)
    {
    $to = "idea@raspisaniye-vuzov.ru"; 
    $from = $_POST['contact2']; 
	$subject = '=?UTF-8?B?'.base64_encode('Idea (support/contact) from '.$_POST['name2']).'?='; 
    $message = 'Имя: '.$_POST['name2'].';'."<br/>".' Email: '.$_POST['contact2'].';'."<br/>".' Cообщение: '.$_POST['text2'].';';
    $headers = "Content-type: text/html; charset=UTF-8 \r\n";
    $headers .= 'From: <'.$_POST['contact2'].'>\r\n';
    $result = mail($to, $subject, $message, $headers);
 
    if ($result){
        echo "<p>Cообщение успешно отправленно</p>";
    }
    }
?>