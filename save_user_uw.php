<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

if(!isset($_SESSION['userId'])){
    echo json_encode(['success' => false, 'error' => 'Keine UserID in Session']);
    exit;
}

require 'db.php';

$user_id = $_SESSION['userId'];

// JSON vom Frontend empfangen
$data = json_decode(file_get_contents('php://input'), true);

if(!$data || !is_array($data)){
    echo json_encode(['success' => false, 'error' => 'Keine Daten erhalten']);
    exit;
}

// Prepared Statement vorbereiten
$stmt = $conn->prepare("
    INSERT INTO tower_user_uw
    (user_id, weapon, property, level, target_level, value, target_value, stones)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
        level = VALUES(level),
        target_level = VALUES(target_level),
        value = VALUES(value),
        target_value = VALUES(target_value),
        stones = VALUES(stones)
");

if(!$stmt){
    echo json_encode(['success' => false, 'error' => $conn->error]);
    exit;
}

foreach($data as $d){
    // Property 0 oder leer überspringen
    if(!isset($d['property']) || $d['property'] === "0" || trim($d['property']) === '') {
        continue;
    }

    $weapon = $d['weapon'] ?? '';
    $property = $d['property'] ?? '';
    $level = intval($d['level'] ?? 0);
    $target_level = intval($d['target_level'] ?? $level);
    $value = $d['value'] ?? '';
    $target_value = $d['target_value'] ?? $value;
    $stones = intval($d['stones'] ?? 0);

    $stmt->bind_param(
        "sssiissi",
        $user_id,
        $weapon,
        $property,
        $level,
        $target_level,
        $value,
        $target_value,
        $stones
    );

    $stmt->execute();
}

echo json_encode(['success' => true]);
