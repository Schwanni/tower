<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');

require "db.php";

// Prüfen ob POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Ungültige Anfrage."]);
    exit;
}

// User-ID aus POST
$userId = trim($_POST["userId"] ?? '');
if (empty($userId)) {
    echo json_encode(["success" => false, "message" => "ID darf nicht leer sein."]);
    exit;
}

// Prüfen ob User existiert
$stmt = $conn->prepare("SELECT id FROM tower_users WHERE user_id = ?");
$stmt->bind_param("s", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // User existiert → Login
    $_SESSION["userId"] = $userId;
    echo json_encode(["success" => true, "message" => "Login erfolgreich."]);
    exit;
}

// Neuen User anlegen
$stmt = $conn->prepare("INSERT INTO tower_users (user_id) VALUES (?)");
$stmt->bind_param("s", $userId);
if (!$stmt->execute()) {
    echo json_encode(["success" => false, "message" => "DB-Fehler beim Anlegen des Users: " . $stmt->error]);
    exit;
}

// Ultimate Weapons für neuen User vorbelegen (nur Level 1)
$stmt = $conn->prepare("
    INSERT INTO tower_user_uw (user_id, weapon, property, level, target_level, value, target_value, stones)
    SELECT ?, weapon, property, level, level, value, value, stones
    FROM tower_uw_costs
    WHERE level = 1
");
$stmt->bind_param("s", $userId);
$stmt->execute();

// === Research-Einträge für neuen User (Level 0) ===
$stmt = $conn->prepare("
    INSERT INTO tower_user_uw (user_id, weapon, property, level, target_level, value, target_value, stones)
    SELECT ?, weapon, property, level, level, value, value, stones
    FROM tower_uw_costs
    WHERE level = 0
      AND property LIKE 'research_%'
");
$stmt->bind_param("s", $userId);
$stmt->execute();

if (!$stmt->execute()) {
    echo json_encode(["success" => false, "message" => "DB-Fehler beim Vorbelegen der Waffen: " . $stmt->error]);
    exit;
}

// Login erfolgreich
$_SESSION["userId"] = $userId;
echo json_encode(["success" => true, "message" => "Neue ID erstellt und Waffen vorbelegt."]);

// Kein schließendes PHP-Tag am Ende
