<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');

require 'db.php';

$data = [];

$result = $conn->query("
    SELECT weapon, property, level, value, stones
    FROM tower_uw_costs
    WHERE property != '0'
    ORDER BY weapon, property, level
");

if (!$result) {
    echo json_encode(["success" => false, "error" => $conn->error]);
    exit;
}

while ($row = $result->fetch_assoc()) {
    $row['value'] = mb_convert_encoding($row['value'], 'UTF-8', 'auto');
    $data[] = $row;
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);
