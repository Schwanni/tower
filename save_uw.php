<?php
session_start();
require "db.php";

if (!isset($_SESSION["userId"])) {
    echo json_encode(["success" => false, "msg" => "Nicht eingeloggt"]);
    exit;
}

$userId = $_SESSION["userId"];
$input = json_decode(file_get_contents("php://input"), true);

$weapon = $input["weapon"];
$values = $input["data"];

foreach($values as $prop => $levels){
    $current = (int)$levels["current"];
    $desired = (int)$levels["desired"];

    $stmt = $conn->prepare("
        INSERT INTO tower_uw_levels (user_id, weapon, property, current_level, desired_level)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE current_level = VALUES(current_level), desired_level = VALUES(desired_level)
    ");
    $stmt->bind_param("sssii", $userId, $weapon, $prop, $current, $desired);
    $stmt->execute();
}

echo json_encode(["success" => true]);
