document.addEventListener("DOMContentLoaded", () => {
  const words = Array.from(document.querySelectorAll(".poster-word"));
  const objects = Array.from(document.querySelectorAll(".poster-object"));
  const navLinks = Array.from(document.querySelectorAll(".poster-nav__link"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  words.forEach((word) => {
    word.style.setProperty("--delay", `${word.dataset.delay || 0}ms`);
  });

  objects.forEach((object, index) => {
    object.style.setProperty("--delay", `${120 + index * 180}ms`);
  });

  if (reduceMotion) {
    words.forEach((word) => word.classList.add("is-settled"));
    objects.forEach((object) => object.classList.add("is-settled"));
  } else {
    runIntro(words);
    runIntro(objects, 1700);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const target = href ? document.querySelector(href) : null;

      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  });

  setupMaze();
  setupPlace();
  setupPairGame();
  setupPackage();
  setupCatch();
});

function runIntro(elements, duration = 1650) {
  elements.forEach((element) => {
    const delay = parseInt(element.style.getPropertyValue("--delay"), 10) || 0;

    element.classList.add("is-visible");
    window.setTimeout(() => {
      element.classList.remove("is-visible");
      element.classList.add("is-settled");
    }, delay + duration);
  });
}

function setupMaze() {
  const board = document.querySelector(".maze-board");
  const player = document.querySelector("[data-maze-player]");
  const buttons = Array.from(document.querySelectorAll(".labyrinth-control"));
  const items = Array.from(document.querySelectorAll("[data-maze-item]"));
  const foundCount = document.querySelector("[data-found-count]");
  const totalCount = document.querySelector("[data-total-count]");
  const status = document.querySelector(".labyrinth-status");

  if (!board || !player || buttons.length === 0) {
    return;
  }

  const walls = Array.from(board.querySelectorAll(".maze-wall"));
  const collected = new Set();
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  let playerX = 0;
  let playerY = 0;

  if (totalCount) {
    totalCount.textContent = String(items.length);
  }

  function getMazeData() {
    const boardRect = board.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    return {
      width: boardRect.width,
      height: boardRect.height,
      radius: playerRect.width * 0.34,
      step: Math.max(boardRect.width * 0.072, 28),
      walls: walls.map((wall) => ({
        left: wall.offsetLeft,
        top: wall.offsetTop,
        right: wall.offsetLeft + wall.offsetWidth,
        bottom: wall.offsetTop + wall.offsetHeight
      }))
    };
  }

  function drawPlayer() {
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
  }

  function updateMazeStatus() {
    if (foundCount) {
      foundCount.textContent = String(collected.size);
    }

    if (status && collected.size === items.length) {
      status.textContent = "Все ингредиенты собраны";
    }
  }

  function insideBoard(x, y, radius, width, height) {
    return (
      x - radius >= 0 &&
      x + radius <= width &&
      y - radius >= 0 &&
      y + radius <= height
    );
  }

  function hitsWall(x, y, radius, wallRects) {
    return wallRects.some((wall) => {
      const nearestX = Math.max(wall.left, Math.min(x, wall.right));
      const nearestY = Math.max(wall.top, Math.min(y, wall.bottom));
      const dx = x - nearestX;
      const dy = y - nearestY;

      return dx * dx + dy * dy < radius * radius;
    });
  }

  function collectMazeItems() {
    const { radius } = getMazeData();

    items.forEach((item) => {
      const name = item.dataset.mazeItem;

      if (!name || collected.has(name)) {
        return;
      }

      const itemCenterX = item.offsetLeft + item.offsetWidth / 2;
      const itemCenterY = item.offsetTop + item.offsetHeight / 2;
      const maxDistance = Math.max(item.offsetWidth, item.offsetHeight) * 0.42 + radius;
      const distance = Math.hypot(playerX - itemCenterX, playerY - itemCenterY);

      if (distance > maxDistance) {
        return;
      }

      collected.add(name);
      item.classList.add("is-collected");
      player.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.18)" },
          { transform: "scale(1)" }
        ],
        { duration: 260, easing: "ease-out" }
      );
    });

    updateMazeStatus();
  }

  function movePlayer(directionName) {
    const direction = directions[directionName];

    if (!direction) {
      return;
    }

    const { width, height, radius, step, walls: wallRects } = getMazeData();
    const microStep = step / 12;
    let moved = false;

    for (let i = 0; i < 12; i += 1) {
      const nextX = playerX + direction.x * microStep;
      const nextY = playerY + direction.y * microStep;

      if (!insideBoard(nextX, nextY, radius, width, height) || hitsWall(nextX, nextY, radius, wallRects)) {
        break;
      }

      playerX = nextX;
      playerY = nextY;
      moved = true;
    }

    if (!moved) {
      player.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(0.92)" },
          { transform: "scale(1)" }
        ],
        { duration: 180, easing: "ease-out" }
      );
      return;
    }

    drawPlayer();
    collectMazeItems();
  }

  function resetPlayer() {
    const { height, radius } = getMazeData();
    playerX = radius + 2;
    playerY = height * 0.446;
    drawPlayer();
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      movePlayer(button.dataset.move);
    });
  });

  window.addEventListener("keydown", (event) => {
    const keyboardMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right"
    };
    const direction = keyboardMap[event.key];

    if (!direction) {
      return;
    }

    event.preventDefault();
    movePlayer(direction);
  });

  window.addEventListener("resize", resetPlayer);
  resetPlayer();
  collectMazeItems();
}

function setupPlace() {
  const stage = document.querySelector(".place-stage");
  const bottles = Array.from(document.querySelectorAll("[data-place-bottle]"));
  const targets = Array.from(document.querySelectorAll("[data-place-target]"));

  if (!stage || bottles.length === 0 || targets.length === 0) {
    return;
  }

  const locked = {
    pink: false,
    blue: false,
    green: false
  };

  const lockConfig = {
    pink: { scale: 1.045, offsetX: 0, offsetY: 0.002, rotate: 21 },
    blue: { scale: 1.045, offsetX: 0, offsetY: 0.002, rotate: -28 },
    green: { scale: 1.045, offsetX: 0, offsetY: 0.002, rotate: -22 }
  };

  const targetsByColor = Object.fromEntries(
    targets.map((target) => [target.dataset.placeTarget, target])
  );

  function getBox(element) {
    const stageRect = stage.getBoundingClientRect();
    const rect = element.getBoundingClientRect();

    return {
      left: rect.left - stageRect.left,
      top: rect.top - stageRect.top,
      right: rect.right - stageRect.left,
      bottom: rect.bottom - stageRect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function highlightTarget(color) {
    targets.forEach((target) => {
      target.classList.toggle("is-active", target.dataset.placeTarget === color);
    });
  }

  function lockBottle(bottle, target, color) {
    const targetBox = getBox(target);
    const settings = lockConfig[color];
    const size = targetBox.width * settings.scale;
    const centerX = targetBox.left + targetBox.width * (0.5 + settings.offsetX);
    const centerY = targetBox.top + targetBox.height * (0.5 + settings.offsetY);

    bottle.classList.remove("is-dragging");
    bottle.classList.add("is-locked");
    bottle.style.width = `${size}px`;
    bottle.style.left = `${centerX - size / 2}px`;
    bottle.style.top = `${centerY - size / 2}px`;
    bottle.style.right = "auto";
    bottle.style.bottom = "auto";
    bottle.style.transform = `rotate(${settings.rotate}deg)`;

    locked[color] = true;
    highlightTarget(null);
  }

  bottles.forEach((bottle) => {
    const color = bottle.dataset.placeBottle;

    bottle.addEventListener("pointerdown", (event) => {
      if (!color || locked[color]) {
        return;
      }

      const stageRect = stage.getBoundingClientRect();
      const bottleRect = bottle.getBoundingClientRect();
      const startX = event.clientX - bottleRect.left;
      const startY = event.clientY - bottleRect.top;
      const target = targetsByColor[color];

      bottle.classList.add("is-dragging");
      bottle.style.right = "auto";
      bottle.style.bottom = "auto";
      bottle.setPointerCapture(event.pointerId);

      function moveBottle(moveEvent) {
        bottle.style.left = `${moveEvent.clientX - stageRect.left - startX}px`;
        bottle.style.top = `${moveEvent.clientY - stageRect.top - startY}px`;
        bottle.style.transform = "rotate(0deg)";

        if (!target) {
          return;
        }

        const bottleBox = getBox(bottle);
        const targetBox = getBox(target);
        const overlapX = Math.min(bottleBox.right, targetBox.right) - Math.max(bottleBox.left, targetBox.left);
        const overlapY = Math.min(bottleBox.bottom, targetBox.bottom) - Math.max(bottleBox.top, targetBox.top);

        if (overlapX > bottleBox.width * 0.32 && overlapY > bottleBox.height * 0.32) {
          lockBottle(bottle, target, color);
          stopDrag();
          return;
        }

        highlightTarget(color);
      }

      function stopDrag() {
        bottle.classList.remove("is-dragging");
        highlightTarget(null);
        bottle.removeEventListener("pointermove", moveBottle);
        bottle.removeEventListener("pointerup", stopDrag);
        bottle.removeEventListener("pointercancel", stopDrag);
      }

      bottle.addEventListener("pointermove", moveBottle);
      bottle.addEventListener("pointerup", stopDrag);
      bottle.addEventListener("pointercancel", stopDrag);
    });
  });
}

function setupPairGame() {
  const cards = Array.from(document.querySelectorAll(".pair-card"));

  if (cards.length === 0) {
    return;
  }

  let openCards = [];
  let blocked = false;

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      if (
        blocked ||
        card.classList.contains("is-flipped") ||
        card.classList.contains("is-matched")
      ) {
        return;
      }

      card.classList.add("is-flipped");
      openCards.push(card);

      if (openCards.length < 2) {
        return;
      }

      const [firstCard, secondCard] = openCards;
      const matched = firstCard.dataset.pairCard === secondCard.dataset.pairCard;

      if (matched) {
        firstCard.classList.add("is-matched");
        secondCard.classList.add("is-matched");
        openCards = [];
        return;
      }

      blocked = true;
      window.setTimeout(() => {
        firstCard.classList.remove("is-flipped");
        secondCard.classList.remove("is-flipped");
        openCards = [];
        blocked = false;
      }, 850);
    });
  });
}

function setupPackage() {
  const artwork = document.querySelector("[data-package-artwork]");
  const canvas = document.querySelector("[data-package-canvas]");
  const swatches = Array.from(document.querySelectorAll("[data-package-theme]"));
  const pen = document.querySelector("[data-package-pen]");

  if (!artwork || !canvas || swatches.length === 0) {
    return;
  }

  const workspace = artwork.parentElement;
  const themes = {
    green: "images/packaging green.svg?v=2",
    pink: "images/packaging pink.svg?v=2",
    blue: "images/packaging blue.svg?v=2"
  };

  let drawingEnabled = false;
  let isDrawing = false;

  function isMobile() {
    return window.matchMedia("(max-width: 560px)").matches;
  }

  function updateDrawingMode() {
    if (isMobile()) {
      drawingEnabled = true;
    }

    workspace.classList.toggle("is-drawing", drawingEnabled);

    if (pen) {
      pen.classList.toggle("is-active", !isMobile() && drawingEnabled);
    }
  }

  function resizeCanvas() {
    const rect = artwork.getBoundingClientRect();
    const context = canvas.getContext("2d");

    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "rgba(55, 55, 55, 0.92)";
    context.lineWidth = Math.max(rect.width * 0.005, 2.4);
  }

  function getPoint(event) {
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      const theme = swatch.dataset.packageTheme;

      if (!theme) {
        return;
      }

      artwork.src = themes[theme];
      swatches.forEach((item) => item.classList.toggle("is-active", item === swatch));
    });
  });

  if (pen) {
    pen.addEventListener("click", () => {
      if (isMobile()) {
        return;
      }

      drawingEnabled = !drawingEnabled;
      updateDrawingMode();
    });
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (!drawingEnabled) {
      return;
    }

    const context = canvas.getContext("2d");
    const point = getPoint(event);

    isDrawing = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drawingEnabled || !isDrawing) {
      return;
    }

    const context = canvas.getContext("2d");
    const point = getPoint(event);

    context.lineTo(point.x, point.y);
    context.stroke();
  });

  function stopDrawing() {
    isDrawing = false;
  }

  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointerleave", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("resize", updateDrawingMode);
  resizeCanvas();
  updateDrawingMode();
}

function setupCatch() {
  const stage = document.querySelector(".catch-stage");
  const field = document.querySelector("[data-catch-field]");
  const bottle = document.querySelector("[data-catch-bottle]");

  if (!stage || !field || !bottle) {
    return;
  }

  const runningSrc = "images/perfume lovi run.svg?v=2";
  const caughtSrc = "images/perfume lovi boom.png?v=2";

  let x = 420;
  let y = 260;
  let speedX = 7.4;
  let speedY = 6.2;
  let angle = -6;
  let angleSpeed = 0.18;
  let frameId = null;
  let caught = false;

  function getFieldData() {
    const fieldRect = field.getBoundingClientRect();
    const bottleRect = bottle.getBoundingClientRect();

    return {
      width: fieldRect.width,
      height: fieldRect.height,
      bottleWidth: bottleRect.width,
      bottleHeight: bottleRect.height
    };
  }

  function drawBottle() {
    bottle.style.left = `${x}px`;
    bottle.style.top = `${y}px`;
    bottle.style.transform = `rotate(${angle}deg)`;
  }

  function moveBottle() {
    if (caught) {
      return;
    }

    const fieldData = getFieldData();

    x += speedX;
    y += speedY;
    angle += angleSpeed;

    if (x <= 0 || x >= fieldData.width - fieldData.bottleWidth) {
      speedX *= -1;
      angleSpeed *= -1;
      x = Math.max(0, Math.min(x, fieldData.width - fieldData.bottleWidth));
    }

    if (y <= 0 || y >= fieldData.height - fieldData.bottleHeight) {
      speedY *= -1;
      y = Math.max(0, Math.min(y, fieldData.height - fieldData.bottleHeight));
    }

    drawBottle();
    frameId = window.requestAnimationFrame(moveBottle);
  }

  function resetCatch() {
    const fieldData = getFieldData();

    x = fieldData.width * 0.48;
    y = fieldData.height * 0.64;
    angle = -6;

    if (!caught) {
      bottle.src = runningSrc;
      drawBottle();
    }
  }

  bottle.addEventListener("click", () => {
    if (caught) {
      return;
    }

    caught = true;

    if (frameId) {
      window.cancelAnimationFrame(frameId);
    }

    stage.classList.add("is-caught");
    bottle.src = caughtSrc;
    bottle.classList.remove("is-running");
    bottle.classList.add("is-caught");
  });

  window.addEventListener("resize", resetCatch);
  resetCatch();
  frameId = window.requestAnimationFrame(moveBottle);
}
