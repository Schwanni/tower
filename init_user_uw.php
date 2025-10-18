<?php
session_start();
require 'db.php';

// Prüfen, ob ein Nutzer angemeldet ist
if (!isset($_SESSION['userId'])) {
    echo json_encode(['success' => false, 'error' => 'Nicht angemeldet']);
    exit;
}

$user_id = $_SESSION['userId'];

// Prüfen, ob der User schon Einträge hat
$stmtCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM tower_user_uw WHERE user_id = ?");
$stmtCheck->bind_param("s", $user_id);
$stmtCheck->execute();
$result = $stmtCheck->get_result();
$row = $result->fetch_assoc();

if ($row['cnt'] == 0) {
    // Alle Weapon + Property + Level Kombinationen aus tower_uw_costs holen
    $res = $conn->query("
        SELECT weapon, property, level, value, stones 
        FROM tower_uw_costs 
        ORDER BY weapon, property, level
    ");

    if ($res === false) {
        echo json_encode(['success' => false, 'error' => $conn->error]);
        exit;
    }

    // Prepared Statement für Einfügen in tower_user_uw
    $stmtInsert = $conn->prepare("
        INSERT INTO tower_user_uw
        (user_id, weapon, property, level, target_level, value, target_value, stones)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    while ($r = $res->fetch_assoc()) {
        $level = $r['level'];
        $value = $r['value'];
        $stones = $r['stones'];

        $stmtInsert->bind_param(
            "ssiiissi",
            $user_id,
            $r['weapon'],
            $r['property'],
            $level,
            $level,       // target_level = aktueller level
            $value,
            $value,       // target_value = aktueller value
            $stones
        );
        $stmtInsert->execute();
    }

    echo json_encode(['success' => true, 'message' => 'User UW initialisiert']);
} else {
    echo json_encode(['success' => true, 'message' => 'User UW bereits vorhanden']);
}

