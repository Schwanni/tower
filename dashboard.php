<?php
session_start();
if (!isset($_SESSION['userId'])) {
    header('Location: index.html'); // Login-Seite
    exit;
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Tower UW Calculator</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
    <nav>
        <h1>Ultimate Weapons</h1>
            <div id="save-msg"></div>
        <div class="navbar">
            <ul>
                <li><a href="#black_hole">BLACK HOLE</a></li>
                <li><a href="#chain_lightning">Chain Lightning</a></li>
                <li><a href="#chrono_field">Chrono Field</a></li>
                <li><a href="#death_wave">Death Wave</a></li>
                <li><a href="#golden_tower">Golden Tower</a></li>
                <li><a href="#inner_land_mines">Inner Land Mines</a></li>
                <li><a href="#poison_swamp">Poisen Swamp</a></li>
                <li><a href="#smart_missiles">Smart Missiles</a></li>
                <li><a href="#spotlight">SPOTLIGHT</a></li>
                <!--
                <li><button class="overviewButton" id="overview">overview</button></li> 
                -->
                <button id="save-btn" class="save-btn">Save</button>
            </ul>
        </div>
    </nav>
    <main>
        <div id="weapon-container" class="weapon-container">
            <!-- Die Waffen werden hier per JS dynamisch eingefügt -->
        </div>
        <div id="overview-container" class="overview-container hidden">
            <!-- Die Waffen werden hier per JS dynamisch eingefügt -->
        </div>
    </main>
<footer>

    
    <div id="save-msg"></div>

    <!-- Logout Button -->
    <button id="logout-btn" class="logout-btn">Logout</button>
    <button id="overview-btn" class="overview-btn">Overview</button>
</footer>
<script src="uw.js"></script>
</body>
</html>
