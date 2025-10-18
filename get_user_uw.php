<?php
header('Content-Type: application/json; charset=UTF-8');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
require 'db.php';

// Session prüfen
$user_id = $_SESSION['userId'] ?? null;
if (!$user_id) {
    echo json_encode([]);
    exit;
}

// DB-Verbindung prüfen
if (!isset($conn) || !$conn) {
    echo json_encode([]);
    exit;
}

// User-ID escapen
$safe_user_id = $conn->real_escape_string($user_id);

// Query vorbereiten
$sql = "SELECT weapon, property, level, target_level, value, target_value, stones
        FROM tower_user_uw
        WHERE user_id = '$safe_user_id'
        ORDER BY weapon, property";

// Query ausführen
$res = $conn->query($sql);
if (!$res) {
    echo json_encode([]);
    exit;
}

// Ergebnisse sammeln
$data = [];
while ($row = $res->fetch_assoc()) {
    // target_level ggf. auf level setzen, falls NULL
    if (!isset($row['target_level']) || $row['target_level'] === null) {
        $row['target_level'] = $row['level'];
    }

    // sicherstellen, dass stones numerisch ist
    if (!isset($row['stones']) || $row['stones'] === null) {
        $row['stones'] = 0;
    }

    $data[] = $row;
}

// JSON ausgeben und Fehler vermeiden
echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
