document.addEventListener("DOMContentLoaded", async () => {
  try {
    // === Daten abrufen ===
    const allData = await (await fetch("get_uw.php")).json();
    const userData = await (await fetch("get_user_uw.php")).json();
    let StoneCost = "";

    const order = [
      "bonus",
      "research_multiplier",
      "multiplier",
      "angle",
      "damage",
      "research_duration",
      "duration",
      "slow",
      "quantity",
      "cooldown",
      "chance",
    ];
    const uwOrder = [
      "chain_lightning",
      "smart_missiles",
      "death_wave",
      "chrono_field",
      "inner_land_mines",
      "golden_tower",
      "poison_swamp",
      "black_hole",
      "spotlight",
    ];

    const container = document.getElementById("weapon-container");
    container.innerHTML = "";

    const overview = document.getElementById("overview-container");
    overview.innerHTML = "";

    // Alle Waffen
    const weapons = [...new Set(allData.map((d) => d.weapon))].sort(
      (a, b) => uwOrder.indexOf(a) - uwOrder.indexOf(b)
    );

    // Research-Level für Golden Tower und Chrono Field (initial aus Nutzerdaten)
    let researchDurationLevel_GT = 0;
    let researchMultiplierLevel = 0;
    let researchDurationLevel_CF = 0;

    const researchDurationUser_GT = userData.find(
      (u) => u.weapon === "golden_tower" && u.property === "research_duration"
    );
    const researchMultiplierUser = userData.find(
      (u) => u.weapon === "golden_tower" && u.property === "research_multiplier"
    );
    const researchDurationUser_CF = userData.find(
      (u) => u.weapon === "chrono_field" && u.property === "research_duration"
    );

    if (researchDurationUser_GT)
      researchDurationLevel_GT = parseInt(researchDurationUser_GT.level);
    if (researchMultiplierUser)
      researchMultiplierLevel = parseInt(researchMultiplierUser.level);
    if (researchDurationUser_CF)
      researchDurationLevel_CF = parseInt(researchDurationUser_CF.level);

    // Hilfsfunktionen, um Research-Werte auszulesen (robust gegenüber String/Number)
    const getResearchBonus = (property, level) => {
      if (typeof level === "undefined" || level === null) return null;
      const lvl = Number(level);
      return allData.find(
        (d) =>
          d.weapon === "golden_tower" &&
          d.property === property &&
          Number(d.level) === lvl
      );
    };

    const getResearchSecondsCF = () => {
      const entry = allData.find(
        (d) =>
          d.weapon === "chrono_field" &&
          d.property === "research_duration" &&
          Number(d.level) === researchDurationLevel_CF
      );
      if (!entry || !entry.value) return 0;
      return (
        parseFloat(String(entry.value).replace("+", "").replace("s", "")) || 0
      );
    };

    const getResearchSeconds = () => {
      const entry = getResearchBonus(
        "research_duration",
        researchDurationLevel
      );
      if (!entry || !entry.value) return 0;
      return (
        parseFloat(String(entry.value).replace("+", "").replace("s", "")) || 0
      );
    };

    const getResearchMultiplier = () => {
      const entry = getResearchBonus(
        "research_multiplier",
        researchMultiplierLevel
      );
      if (!entry || !entry.value) return 0;
      return parseFloat(String(entry.value).replace("x", "")) || 0;
    };

    // === Waffen durchgehen ===
    weapons.forEach((weapon) => {
      const fieldset = document.createElement("fieldset");
      const legend = document.createElement("legend");
      legend.textContent = weapon.replace(/_/g, " ").toUpperCase();
      fieldset.setAttribute("id", weapon);
      fieldset.appendChild(legend);

      const properties = [
        ...new Set(
          allData
            .filter((d) => d.weapon === weapon && d.property !== "0")
            .map((d) => d.property)
        ),
      ].sort((a, b) => order.indexOf(a) - order.indexOf(b));

      properties.forEach((prop) => {
        const label = document.createElement("label");
        const span = document.createElement("span");
        const displayNames = {
          research_multiplier: "Bonus Lab:",
          research_duration: "Time Lab:",
        };
        span.textContent = displayNames[prop] || prop;
        span.dataset.prop = prop;
        label.appendChild(span);

        // === Research Properties (nur 1 Dropdown) ===
        const isResearch =
          prop === "research_multiplier" || prop === "research_duration";

        if (isResearch) {
          const selectSingle = document.createElement("select");
          selectSingle.classList.add("current");

          allData
            .filter((d) => d.weapon === weapon && d.property === prop)
            .forEach((d) => {
              const opt = document.createElement("option");
              opt.value = d.level;
              opt.textContent = `${d.value}`;
              selectSingle.appendChild(opt);
            });

          const userValue = userData.find(
            (u) => u.weapon === weapon && u.property === prop
          );
          if (userValue) selectSingle.value = userValue.level;

          // Speichern der Research-Level zur Live-Aktualisierung
          if (weapon === "golden_tower" && prop === "research_duration") {
            researchDurationLevel = parseInt(selectSingle.value);
            selectSingle.addEventListener("change", () => {
              researchDurationLevel = parseInt(selectSingle.value);
              updateGoldenTowerDisplay();
            });
          }

          if (weapon === "golden_tower" && prop === "research_multiplier") {
            researchMultiplierLevel = parseInt(selectSingle.value);
            selectSingle.addEventListener("change", () => {
              researchMultiplierLevel = parseInt(selectSingle.value);
              updateGoldenTowerDisplay();
            });
          }

          if (weapon === "chrono_field" && prop === "research_duration") {
            researchDurationLevel_CF = parseInt(selectSingle.value);
            selectSingle.addEventListener("change", () => {
              researchDurationLevel_CF = parseInt(selectSingle.value);
              updateChronoFieldDisplay();
            });
          }

          label.appendChild(selectSingle);
          fieldset.appendChild(label);
          return;
        }

        // === Normale Properties (2 Dropdowns) ===
        const selectCurrent = document.createElement("select");
        selectCurrent.classList.add("current");
        const selectTarget = document.createElement("select");
        selectTarget.classList.add("target");

        allData
          .filter((d) => d.weapon === weapon && d.property === prop)
          .forEach((d) => {
            // Speichere den unveränderten Basis-Text (wie "38s" oder "1.50x")
            const baseText = d.value; // z.B. "38s" oder "1.50x"
            const stones = d.stones;

            const optCurrent = document.createElement("option");
            const optTarget = document.createElement("option");

            optCurrent.value = d.level;
            optTarget.value = d.level;

            // setze den sichtbaren Text **ohne Research** (wir passen später dynamisch an)
            optCurrent.textContent = `${baseText} (${stones} Stones)`;
            optTarget.textContent = `${baseText} (${stones} Stones)`;

            // sichere die Basiswerte, damit updateGoldenTowerDisplay immer darauf zurückgreift
            optCurrent.dataset.base = baseText;
            optCurrent.dataset.stones = stones;
            optTarget.dataset.base = baseText;
            optTarget.dataset.stones = stones;

            selectCurrent.appendChild(optCurrent);
            selectTarget.appendChild(optTarget);
          });

        const userValue = userData.find(
          (u) => u.weapon === weapon && u.property === prop
        );
        if (userValue) {
          selectCurrent.value = userValue.level;
          selectTarget.value = userValue.target_level || userValue.level;
          StoneCost = userValue.stones;
        }

        label.appendChild(selectCurrent);
        label.appendChild(document.createTextNode(" → "));
        label.appendChild(selectTarget);

        const costDiv = document.createElement("div");
        costDiv.classList.add("cost");
        costDiv.innerHTML = `Kosten: <span class="stones">${StoneCost}</span> Stones`;

        selectCurrent.addEventListener("change", () =>
          updateCost(
            selectCurrent,
            selectTarget,
            allData,
            weapon,
            prop,
            costDiv
          )
        );
        selectTarget.addEventListener("change", () =>
          updateCost(
            selectCurrent,
            selectTarget,
            allData,
            weapon,
            prop,
            costDiv
          )
        );

        fieldset.appendChild(label);
        fieldset.appendChild(costDiv);
      });

      container.appendChild(fieldset);
    });

    // auflistung für overview

    weapons.forEach((weapon) => {
      const fieldset = document.createElement("fieldset");
      const legend = document.createElement("legend");
      legend.textContent = weapon.replace(/_/g, " ").toUpperCase();
      fieldset.setAttribute("id", weapon);
      fieldset.appendChild(legend);

      const properties = [
        ...new Set(
          allData
            .filter((d) => d.weapon === weapon && d.property !== "0")
            .map((d) => d.property)
        ),
      ].sort((a, b) => order.indexOf(a) - order.indexOf(b));

      properties.forEach((prop) => {
        const label = document.createElement("label");
        const span = document.createElement("span");
        const displayNames = {
          research_multiplier: "Bonus Lab:",
          research_duration: "Time Lab:",
        };
        span.textContent = displayNames[prop] || prop;
        span.dataset.prop = prop;
        label.appendChild(span);

        // === Research Properties (nur 1 Dropdown) ===
        const isResearch =
          prop === "research_multiplier" || prop === "research_duration";

        if (isResearch) {
          const selectSingle = document.createElement("select");
          selectSingle.classList.add("current");

          allData
            .filter((d) => d.weapon === weapon && d.property === prop)
            .forEach((d) => {
              const opt = document.createElement("option");
              opt.value = d.level;
              opt.textContent = `${d.value}`;
              selectSingle.appendChild(opt);
            });

          const userValue = userData.find(
            (u) => u.weapon === weapon && u.property === prop
          );
          if (userValue) selectSingle.value = userValue.level;

          // Speichern der Research-Level zur Live-Aktualisierung
          if (weapon === "golden_tower" && prop === "research_duration") {
            researchDurationLevel = parseInt(selectSingle.value);
            selectSingle.addEventListener("change", () => {
              researchDurationLevel = parseInt(selectSingle.value);
              updateGoldenTowerDisplay();
            });
          }

          if (weapon === "golden_tower" && prop === "research_multiplier") {
            researchMultiplierLevel = parseInt(selectSingle.value);
            selectSingle.addEventListener("change", () => {
              researchMultiplierLevel = parseInt(selectSingle.value);
              updateGoldenTowerDisplay();
            });
          }

          if (weapon === "chrono_field" && prop === "research_duration") {
            researchDurationLevel_CF = parseInt(selectSingle.value);
            selectSingle.addEventListener("change", () => {
              researchDurationLevel_CF = parseInt(selectSingle.value);
              updateChronoFieldDisplay();
            });
          }

          label.appendChild(selectSingle);
          fieldset.appendChild(label);
          return;
        }

        // === Normale Properties (2 Dropdowns) ===
        const selectCurrent = document.createElement("select");
        selectCurrent.classList.add("current");
        const selectTarget = document.createElement("select");
        selectTarget.classList.add("target");

        allData
          .filter((d) => d.weapon === weapon && d.property === prop)
          .forEach((d) => {
            // Speichere den unveränderten Basis-Text (wie "38s" oder "1.50x")
            const baseText = d.value; // z.B. "38s" oder "1.50x"
            const stones = d.stones;

            const optCurrent = document.createElement("option");
            const optTarget = document.createElement("option");

            optCurrent.value = d.level;
            optTarget.value = d.level;

            // setze den sichtbaren Text **ohne Research** (wir passen später dynamisch an)
            optCurrent.textContent = `${baseText}`;

            // sichere die Basiswerte, damit updateGoldenTowerDisplay immer darauf zurückgreift
            optCurrent.dataset.base = baseText;
            optCurrent.dataset.stones = stones;
            optTarget.dataset.base = baseText;
            optTarget.dataset.stones = stones;

            selectCurrent.appendChild(optCurrent);
            selectTarget.appendChild(optTarget);
          });

        const userValue = userData.find(
          (u) => u.weapon === weapon && u.property === prop
        );
        if (userValue) {
          selectCurrent.value = userValue.level;
          selectTarget.value = userValue.target_level || userValue.level;
          StoneCost = userValue.stones;
        }

        label.appendChild(selectCurrent);

        fieldset.appendChild(label);
      });

      overview.appendChild(fieldset);
    });

    // nach dem Aufbau der UI einmal initial anwenden
    updateGoldenTowerDisplay();
    updateChronoFieldDisplay();

    // === Speichern ===
    document.getElementById("save-btn").addEventListener("click", async () => {
      const userDataToSave = [];

      container.querySelectorAll("fieldset").forEach((fieldset) => {
        const weapon = fieldset
          .querySelector("legend")
          .textContent.toLowerCase()
          .replace(/ /g, "_");

        fieldset.querySelectorAll("label").forEach((label) => {
          const prop = label
            .querySelector("span")
            ?.dataset?.prop?.toLowerCase();
          if (!prop || prop === "0") return;

          const currentSelect = label.querySelector("select.current");
          const targetSelect = label.querySelector("select.target");

          if (!currentSelect) return;

          const currentOption =
            currentSelect.options[currentSelect.selectedIndex];
          const targetOption =
            targetSelect?.options[targetSelect.selectedIndex] || currentOption;

          const cost = calculateStones(
            allData,
            weapon,
            prop,
            parseInt(currentSelect.value),
            parseInt(targetSelect?.value || currentSelect.value)
          );

          if (prop === "research_multiplier" || prop === "research_duration") {
            userDataToSave.push({
              weapon,
              property: prop,
              level: parseInt(currentSelect.value),
              target_level: parseInt(currentSelect.value),
              value: currentSelect.value,
              target_value: currentSelect.value,
              stones: 0,
            });
            return;
          }

          userDataToSave.push({
            weapon,
            property: prop,
            level: parseInt(currentSelect.value),
            target_level: parseInt(targetSelect.value),
            value: currentOption.textContent.split(" ")[0],
            target_value: targetOption.textContent.split(" ")[0],
            stones: cost,
          });
        });
      });

      try {
        const res = await fetch("save_user_uw.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userDataToSave),
        });
        const result = await res.json();
        const msgDiv = document.getElementById("save-msg");

        if (result.success) {
          msgDiv.textContent = "Erfolgreich gespeichert ✅";
          msgDiv.style.color = "green";
          setTimeout(() => {
            msgDiv.textContent = "";
            msgDiv.style.color = "";
          }, 4000);
        } else {
          msgDiv.textContent = "Fehler beim Speichern ❌";
          msgDiv.style.color = "red";
        }
      } catch (err) {
        console.error("Speicherfehler:", err);
      }
    });

    // === Logout ===
    document
      .getElementById("logout-btn")
      .addEventListener("click", async () => {
        const res = await fetch("logout.php");
        const result = await res.json();
        if (result.success) window.location.href = "index.html";
        else alert("Fehler beim Logout!");
      });

    // 🔁 Funktion zum Aktualisieren der Golden Tower Anzeige bei Research-Änderung
    function updateGoldenTowerDisplay() {
      const goldenTowerFieldset = document.getElementById("golden_tower");
      if (!goldenTowerFieldset) return;

      const bonusSeconds = getResearchSeconds();
      const bonusMultiplier = getResearchMultiplier();

      goldenTowerFieldset.querySelectorAll("label").forEach((label) => {
        const prop = label.querySelector("span")?.textContent;
        if (prop !== "duration" && prop !== "multiplier") return;

        // Alle selects (current + target) bearbeiten
        const selects = label.querySelectorAll("select");
        selects.forEach((sel) => {
          Array.from(sel.options).forEach((opt) => {
            // Basis aus dataset (fallback: try parse from text)
            const baseRaw = opt.dataset.base ?? opt.textContent.split(" ")[0];
            if (!baseRaw) return;

            if (prop === "duration") {
              const baseNum = parseFloat(String(baseRaw).replace("s", "")) || 0;
              const updated = baseNum + bonusSeconds;
              opt.textContent = `${updated}s (${
                opt.dataset.stones || "0"
              } Stones)`;
            }

            if (prop === "multiplier") {
              const baseNum = parseFloat(String(baseRaw).replace("x", "")) || 0;
              const updated = baseNum + bonusMultiplier;
              opt.textContent = `${updated.toFixed(2)}x (${
                opt.dataset.stones || "0"
              } Stones)`;
            }
          });
        });
      });
    }

    function updateChronoFieldDisplay() {
      const chronoFieldset = document.getElementById("chrono_field");
      if (!chronoFieldset) return;

      const bonusSeconds = getResearchSecondsCF();

      chronoFieldset.querySelectorAll("label").forEach((label) => {
        const prop = label.querySelector("span")?.textContent;
        if (prop !== "duration") return;

        const selects = label.querySelectorAll("select");
        selects.forEach((sel) => {
          Array.from(sel.options).forEach((opt) => {
            const baseRaw = opt.dataset.base ?? opt.textContent.split(" ")[0];
            if (!baseRaw) return;

            const baseNum = parseFloat(String(baseRaw).replace("s", "")) || 0;
            const updated = baseNum + bonusSeconds;

            opt.textContent = `${updated}s (${
              opt.dataset.stones || "0"
            } Stones)`;
          });
        });
      });
    }
  } catch (err) {
    console.error("Fehler beim Laden:", err);
    document.getElementById("weapon-container").textContent =
      "Fehler beim Laden der Daten.";
  }
});

// === Hilfsfunktionen ===
function updateCost(currentSelect, targetSelect, data, weapon, prop, costDiv) {
  const currentLevel = parseInt(currentSelect.value);
  const targetLevel = parseInt(targetSelect.value);

  const totalStones = calculateStones(
    data,
    weapon,
    prop,
    currentLevel,
    targetLevel
  );
  costDiv.innerHTML = `Kosten: <span class="stones">${totalStones}</span> Stones`;
}

function calculateStones(data, weapon, prop, currentLevel, targetLevel) {
  if (currentLevel === targetLevel) return 0;
  let total = 0;
  data
    .filter((d) => d.weapon === weapon && d.property === prop)
    .forEach((d) => {
      if (d.level > currentLevel && d.level <= targetLevel) {
        total += parseInt(d.stones) || 0;
      }
    });
  return total;
}

//toggle für overview

const overviewBtn = document.getElementById("overview-btn");
overviewBtn.addEventListener("click", () => {
  const overview = document.getElementById("overview-container");
  const container = document.getElementById("weapon-container");
  if (overview.classList.toggle("hidden"));
  if (container.classList.toggle("hidden"));
});
