<?php
if($_POST)
    {
    $to = "support@raspisaniye-vuzov.ru"; 
    $from = $_POST['contact1']; 
	$subject = '=?UTF-8?B?'.base64_encode('Problem (support/contact) from '.$_POST['name1']).'?='; 
    $message = 'Имя: '.$_POST['name1'].';'."<br/>".' Email: '.$_POST['contact1'].';'."<br/>".' Cообщение: '.$_POST['text1'].';';
    $headers = "Content-type: text/html; charset=UTF-8 \r\n";
    $headers .= 'From: <'.$_POST['contact1'].'>\r\n';
    $result = mail($to, $subject, $message, $headers);
 
    if ($result){
        echo "<p>Cообщение успешно отправленно</p>";
    } 
    }


?>