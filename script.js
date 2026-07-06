(function () {
  "use strict";

  var scoreEl = document.getElementById("scoreDisplay");
  var balloonEl = document.getElementById("mainBalloon");
  var clickZone = document.querySelector(".click-zone");
  var body = document.body;

  var shopBtn = document.getElementById("shopBtn");
  var shopOverlay = document.getElementById("shopOverlay");
  var closeShopBtn = document.getElementById("closeShop");
  var shopBalanceEl = document.getElementById("shopBalance");
  var autoIndicatorEl = document.getElementById("autoIndicator");
  var rebirthBtn = document.getElementById("rebirthBtn");
  var rebirthIndicatorEl = document.getElementById("rebirthIndicator");
  var rebirthOverlay = document.getElementById("rebirthOverlay");
  var closeRebirthBtn = document.getElementById("closeRebirth");
  var rebirthBalanceEl = document.getElementById("rebirthBalance");
  var rebirthCountValueEl = document.getElementById("rebirthCountValue");
  var currentMultiplierValueEl = document.getElementById("currentMultiplierValue");
  var nextMultiplierValueEl = document.getElementById("nextMultiplierValue");
  var rebirthCostValueEl = document.getElementById("rebirthCostValue");
  var confirmRebirthBtn = document.getElementById("confirmRebirthBtn");

  // ---- Upgrade definitions ----
  // cost scales by GROWTH_RATE per unit already owned (rounded up), a common
  // and fair idle-game curve: early purchases stay cheap, later ones cost more.
  var GROWTH_RATE = 1.15;

  var upgrades = {
    bigger: {
      baseCost: 25,
      power: 1,   // click power granted per unit owned
      perSec: 0,
      owned: 0,
      btn: document.getElementById("buyBigger"),
      itemEl: document.getElementById("itemBigger"),
      levelEl: document.getElementById("biggerLevel"),
      levelText: function () { return "Owned: " + upgrades.bigger.owned + " · Click power: " + getClickPower(); }
    },
    mega: {
      baseCost: 75,
      power: 3,
      perSec: 0,
      owned: 0,
      btn: document.getElementById("buyMega"),
      itemEl: document.getElementById("itemMega"),
      levelEl: document.getElementById("megaLevel"),
      levelText: function (u) { return "Owned: " + u.owned; }
    },
    super: {
      baseCost: 200,
      power: 8,
      perSec: 0,
      owned: 0,
      btn: document.getElementById("buySuper"),
      itemEl: document.getElementById("itemSuper"),
      levelEl: document.getElementById("superLevel"),
      levelText: function (u) { return "Owned: " + u.owned; }
    },
    ultra: {
      baseCost: 500,
      power: 20,
      perSec: 0,
      owned: 0,
      btn: document.getElementById("buyUltra"),
      itemEl: document.getElementById("itemUltra"),
      levelEl: document.getElementById("ultraLevel"),
      levelText: function (u) { return "Owned: " + u.owned; }
    },
    cosmic: {
      baseCost: 1250,
      power: 50,
      perSec: 0,
      owned: 0,
      btn: document.getElementById("buyCosmic"),
      itemEl: document.getElementById("itemCosmic"),
      levelEl: document.getElementById("cosmicLevel"),
      levelText: function (u) { return "Owned: " + u.owned; }
    },
    auto: {
      baseCost: 50,
      power: 0,
      perSec: 1,
      owned: 0,
      btn: document.getElementById("buyAuto"),
      itemEl: document.getElementById("itemAuto"),
      levelEl: document.getElementById("autoLevel"),
      levelText: function (u) { return "Owned: " + u.owned; }
    },
    factory: {
      baseCost: 160,
      power: 0,
      perSec: 3,
      owned: 0,
      btn: document.getElementById("buyFactory"),
      itemEl: document.getElementById("itemFactory"),
      levelEl: document.getElementById("factoryLevel"),
      levelText: function (u) { return "Owned: " + u.owned; }
    },
    megafactory: {
      baseCost: 420,
      power: 0,
      perSec: 8,
      owned: 0,
      btn: document.getElementById("buyMegaFactory"),
      itemEl: document.getElementById("itemMegaFactory"),
      levelEl: document.getElementById("megaFactoryLevel"),
      levelText: function (u) { return "Owned: " + u.owned; }
    },
    skyfactory: {
      baseCost: 1050,
      power: 0,
      perSec: 20,
      owned: 0,
      btn: document.getElementById("buySkyFactory"),
      itemEl: document.getElementById("itemSkyFactory"),
      levelEl: document.getElementById("skyFactoryLevel"),
      levelText: function (u) { return "Owned: " + u.owned; }
    },
    empire: {
      baseCost: 2650,
      power: 0,
      perSec: 50,
      owned: 0,
      btn: document.getElementById("buyEmpire"),
      itemEl: document.getElementById("itemEmpire"),
      levelEl: document.getElementById("empireLevel"),
      levelText: function (u) { return "Owned: " + u.owned; }
    }
  };

  function upgradeCost(u) {
    return Math.ceil(u.baseCost * Math.pow(GROWTH_RATE, u.owned));
  }

  // ---- Load saved state ----
  var STORAGE_KEY = "balloonClickerScore";
  var UPGRADES_KEY = "balloonClickerUpgrades";
  var REBIRTH_KEY = "balloonClickerRebirths";

  var score = 0;
  var rebirths = 0;

  // Rebirthing wipes score + upgrades but permanently multiplies all future
  // balloon gains by 1.1x, stacking with every rebirth (1.1^rebirths).
  var REBIRTH_FACTOR = 1.1;      // permanent multiplier growth per rebirth
  var REBIRTH_BASE_COST = 100;   // cost of the first rebirth
  var REBIRTH_COST_GROWTH = 2.5; // each rebirth costs 2.5x the previous one

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) score = parseInt(saved, 10) || 0;

    var savedUpgrades = localStorage.getItem(UPGRADES_KEY);
    if (savedUpgrades !== null) {
      var parsed = JSON.parse(savedUpgrades);
      for (var key in parsed) {
        if (upgrades[key]) upgrades[key].owned = parseInt(parsed[key], 10) || 0;
      }
    }

    var savedRebirths = localStorage.getItem(REBIRTH_KEY);
    if (savedRebirths !== null) rebirths = parseInt(savedRebirths, 10) || 0;
  } catch (e) {
    /* localStorage unavailable or corrupted, ignore */
  }

  function getMultiplier() {
    return Math.pow(REBIRTH_FACTOR, rebirths);
  }

  function getRebirthCost() {
    return Math.ceil(REBIRTH_BASE_COST * Math.pow(REBIRTH_COST_GROWTH, rebirths));
  }

  function getClickPower() {
    return 1
      + upgrades.bigger.owned * upgrades.bigger.power
      + upgrades.mega.owned * upgrades.mega.power
      + upgrades.super.owned * upgrades.super.power
      + upgrades.ultra.owned * upgrades.ultra.power
      + upgrades.cosmic.owned * upgrades.cosmic.power;
  }

  function getPerSecond() {
    return upgrades.auto.owned * upgrades.auto.perSec
      + upgrades.factory.owned * upgrades.factory.perSec
      + upgrades.megafactory.owned * upgrades.megafactory.perSec
      + upgrades.skyfactory.owned * upgrades.skyfactory.perSec
      + upgrades.empire.owned * upgrades.empire.perSec;
  }

  updateScoreDisplay();
  updateShopUI();
  updateAutoIndicator();
  updateRebirthUI();

  function updateScoreDisplay() {
    scoreEl.innerHTML = score + "<span>balloon" + (score === 1 ? "" : "s") + "</span>";
  }

  function updateShopUI() {
    shopBalanceEl.textContent = score;
    for (var key in upgrades) {
      var u = upgrades[key];
      var cost = upgradeCost(u);
      u.levelEl.textContent = u.levelText(u);
      u.btn.textContent = cost + " 🎈";
      var canAfford = score >= cost;
      u.btn.disabled = !canAfford;
      u.itemEl.classList.toggle("affordable", canAfford);
    }
  }

  function updateAutoIndicator() {
    var perSec = getPerSecond() * getMultiplier();
    if (perSec > 0) {
      autoIndicatorEl.style.display = "block";
      var display = Math.round(perSec * 10) / 10; // trim to 1 decimal
      autoIndicatorEl.textContent = "🤖 +" + display + " / sec";
    } else {
      autoIndicatorEl.style.display = "none";
    }
  }

  function updateRebirthUI() {
    if (rebirths > 0) {
      rebirthIndicatorEl.style.display = "block";
      rebirthIndicatorEl.textContent = "✨ x" + getMultiplier().toFixed(2);
    } else {
      rebirthIndicatorEl.style.display = "none";
    }
    rebirthBtn.textContent = rebirths > 0 ? "🌟 Rebirth (x" + getMultiplier().toFixed(2) + ")" : "🌟 Rebirth";

    // Modal contents
    var cost = getRebirthCost();
    rebirthBalanceEl.textContent = score;
    rebirthCountValueEl.textContent = rebirths;
    currentMultiplierValueEl.textContent = "x" + getMultiplier().toFixed(2);
    nextMultiplierValueEl.textContent = "x" + (getMultiplier() * REBIRTH_FACTOR).toFixed(2);
    rebirthCostValueEl.textContent = cost;
    confirmRebirthBtn.disabled = score < cost;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, String(score));
      var toSave = {};
      for (var key in upgrades) toSave[key] = upgrades[key].owned;
      localStorage.setItem(UPGRADES_KEY, JSON.stringify(toSave));
      localStorage.setItem(REBIRTH_KEY, String(rebirths));
    } catch (e) { /* ignore */ }
  }

  // Debounced save so rapid clicking doesn't hammer localStorage
  var saveTimeout = null;
  function scheduleSave() {
    if (saveTimeout) return;
    saveTimeout = setTimeout(function () {
      saveState();
      saveTimeout = null;
    }, 400);
  }

  // ---- Shop interactions ----
  shopBtn.addEventListener("click", function () {
    updateShopUI();
    shopOverlay.classList.add("open");
  });
  closeShopBtn.addEventListener("click", function () {
    shopOverlay.classList.remove("open");
  });
  shopOverlay.addEventListener("click", function (e) {
    if (e.target === shopOverlay) shopOverlay.classList.remove("open");
  });

  function buyUpgrade(key) {
    var u = upgrades[key];
    var cost = upgradeCost(u);
    if (score < cost) return;
    score -= cost;
    u.owned += 1;
    updateScoreDisplay();
    updateShopUI();
    updateAutoIndicator();
    scheduleSave();
  }

  upgrades.bigger.btn.addEventListener("click", function () { buyUpgrade("bigger"); });
  upgrades.mega.btn.addEventListener("click", function () { buyUpgrade("mega"); });
  upgrades.super.btn.addEventListener("click", function () { buyUpgrade("super"); });
  upgrades.ultra.btn.addEventListener("click", function () { buyUpgrade("ultra"); });
  upgrades.cosmic.btn.addEventListener("click", function () { buyUpgrade("cosmic"); });
  upgrades.auto.btn.addEventListener("click", function () { buyUpgrade("auto"); });
  upgrades.factory.btn.addEventListener("click", function () { buyUpgrade("factory"); });
  upgrades.megafactory.btn.addEventListener("click", function () { buyUpgrade("megafactory"); });
  upgrades.skyfactory.btn.addEventListener("click", function () { buyUpgrade("skyfactory"); });
  upgrades.empire.btn.addEventListener("click", function () { buyUpgrade("empire"); });

  // ---- Rebirth ----
  rebirthBtn.addEventListener("click", function () {
    updateRebirthUI();
    rebirthOverlay.classList.add("open");
  });
  closeRebirthBtn.addEventListener("click", function () {
    rebirthOverlay.classList.remove("open");
  });
  rebirthOverlay.addEventListener("click", function (e) {
    if (e.target === rebirthOverlay) rebirthOverlay.classList.remove("open");
  });

  confirmRebirthBtn.addEventListener("click", function () {
    var cost = getRebirthCost();
    if (score < cost) return;

    rebirths += 1;
    score = 0;
    for (var key in upgrades) {
      upgrades[key].owned = 0;
    }

    updateScoreDisplay();
    updateShopUI();
    updateAutoIndicator();
    updateRebirthUI();
    saveState();

    rebirthOverlay.classList.remove("open");
  });

  // ---- Auto generation: balloons arrive individually, spaced out evenly ----
  // Instead of dumping N balloons once a second, we accumulate fractional
  // balloons every tick based on the current rate. At 2/sec you get one every
  // 0.5s; at 10/sec, one every 0.1s — the interval scales naturally with rate.
  var AUTO_TICK_MS = 100; // 10 ticks per second
  var autoAccumulator = 0;

  setInterval(function () {
    var perSec = getPerSecond() * getMultiplier();
    if (perSec <= 0) return;

    autoAccumulator += perSec * (AUTO_TICK_MS / 1000);

    var gained = 0;
    while (autoAccumulator >= 1) {
      autoAccumulator -= 1;
      gained++;
    }

    if (gained > 0) {
      score += gained;
      updateScoreDisplay();
      updateShopUI();
      scheduleSave();
      // Cap balloons spawned per tick so extreme rates can't cause lag —
      // the global MAX_FLYING cap also protects against pile-ups.
      var toSpawn = Math.min(gained, 6);
      for (var i = 0; i < toSpawn; i++) {
        spawnFlyingBalloon();
      }
    }
  }, AUTO_TICK_MS);

  // ---- Performance cap on simultaneous flying balloons ----
  var MAX_FLYING = 25;
  var flyingCount = 0;

  var balloonColors = ["#ff4d6d", "#ffb703", "#4cc9f0", "#8ac926", "#b388eb", "#ff8fab"];

  function spawnFlyingBalloon() {
    if (flyingCount >= MAX_FLYING) return;
    flyingCount++;

    var el = document.createElement("div");
    el.className = "fly-balloon";

    // Spawn from a random point spread across the whole base of the screen,
    // rather than always at the click location.
    var margin = 30;
    var originX = margin + Math.random() * (window.innerWidth - margin * 2);

    var color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
    el.innerHTML =
      '<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="50" cy="55" rx="38" ry="46" fill="' + color + '"/>' +
      '<ellipse cx="35" cy="35" rx="12" ry="16" fill="#ffffff" opacity="0.3"/>' +
      '<path d="M50 101 L46 112 L54 112 Z" fill="' + color + '"/>' +
      '<line x1="50" y1="112" x2="50" y2="140" stroke="#8a8a8a" stroke-width="2"/>' +
      '</svg>';

    var drift = (Math.random() * 160 - 80).toFixed(0) + "px";
    var rot = (Math.random() * 40 - 20).toFixed(0) + "deg";
    var duration = (3.2 + Math.random() * 1.6).toFixed(2) + "s";

    el.style.left = originX + "px";
    el.style.setProperty("--drift", drift);
    el.style.setProperty("--rot", rot);
    el.style.animationDuration = duration;

    el.addEventListener("animationend", function () {
      el.remove();
      flyingCount--;
    });

    body.appendChild(el);
  }

  function spawnPop(originX, originY, amount) {
    var pop = document.createElement("div");
    pop.className = "pop";
    pop.textContent = "+" + (amount || 1);
    pop.style.left = (originX - 10) + "px";
    pop.style.top = originY + "px";
    pop.addEventListener("animationend", function () {
      pop.remove();
    });
    body.appendChild(pop);
  }

  function handleClick(clientX, clientY) {
    var basePower = getClickPower();
    var gained = Math.max(1, Math.round(basePower * getMultiplier()));
    score += gained;
    updateScoreDisplay();
    updateShopUI();
    scheduleSave();

    // Press animation
    balloonEl.classList.remove("idle-bob");
    balloonEl.classList.add("pressed");
    setTimeout(function () {
      balloonEl.classList.remove("pressed");
      balloonEl.classList.add("idle-bob");
    }, 100);

    var originX = clientX !== undefined ? clientX : window.innerWidth / 2;
    var originY = clientY !== undefined ? clientY : window.innerHeight / 2;

    // Spawn one balloon per point gained (capped so huge power doesn't lag)
    var spawnCount = Math.min(gained, 8);
    for (var i = 0; i < spawnCount; i++) {
      spawnFlyingBalloon();
    }
    spawnPop(originX, originY, gained);
  }

  // Use a single pointerdown listener (works for mouse, touch, pen) — avoids double
  // firing that click + touchstart together can cause on mobile.
  balloonEl.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    handleClick(e.clientX, e.clientY);
  }, { passive: false });

  // Fallback for very old browsers without Pointer Events
  if (!window.PointerEvent) {
    balloonEl.addEventListener("click", function (e) {
      handleClick(e.clientX, e.clientY);
    });
  }

})();
