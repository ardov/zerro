<?php

header('Content-Type: application/json');

$body = file_get_contents('php://input');
// $token = $_SERVER['HTTP_AUTHORIZATION'];
$token = "Bearer " . $_GET["token"];

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://api.zenmoney.ru/v8/diff/",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 60,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => $body,
  CURLOPT_HTTPHEADER => array(
    "authorization: $token",
    "cache-control: no-cache",
    "content-type: application/json",
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo '{ "error": "cURL Error #:' . $err . '"}';
} else if ($response === "Unauthorized") {
  echo '{ "error": "Unauthorized" }';
} else {
  echo $response;
}
