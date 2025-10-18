<?php
require "db.php"; // deine DB-Verbindung

// Parameter abholen
$weapon = $_GET["weapon"] ?? "";
$property = $_GET["property"] ?? "";
$from = (int)($_GET["from"] ?? 1);
$to = (int)($_GET["to"] ?? 1);

// Prüfen: Ziel größer als Startlevel
if ($to <= $from) {
    echo json_encode(["cost" => 0]);
    exit;
}

// SQL: Summe der Kosten von Level (from+1) bis Level (to)
$stmt = $conn->prepare("
    SELECT SUM(cost) AS total_cost
    FROM tower_uw_costs
    WHERE weapon = ? AND property = ? AND level > ? AND level <= ?
");
$stmt->bind_param("ssii", $weapon, $property, $from, $to);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

$total = $row["total_cost"] ?? 0;

// Ausgabe als JSON
echo json_encode(["cost" => (int)$total]);
