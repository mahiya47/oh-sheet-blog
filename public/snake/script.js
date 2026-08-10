const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const currentScoreElement = document.getElementById("current-score");
const speedLevelElement = document.getElementById("speed-level");
const highScoreElement = document.getElementById("high-score");
const finalScoreElement = document.getElementById("final-score");

const startScreen = document.getElementById("start-screen");
const pauseScreen = document.getElementById("pause-screen");
const gameOverScreen = document.getElementById("game-over-screen");

const startBtn = document.getElementById("start-btn");
const continueBtn = document.getElementById("continue-btn");
const restartBtn = document.getElementById("restart-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const pauseBtn = document.getElementById("pause-btn");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [];
let food = { x: 0, y: 0 };
let dx = gridSize;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let isPaused = false;
let gameActive = false;
let nextDirection = { x: gridSize, y: 0 };

let gameTimeoutId = null;
let currentSpeed = 120;
const initialSpeed = 120;
const minimumSpeed = 40;
const speedStep = 5;

highScoreElement.innerText = highScore;

function initGame() {
  snake = [
    { x: gridSize * 5, y: gridSize * 15 },
    { x: gridSize * 4, y: gridSize * 15 },
    { x: gridSize * 3, y: gridSize * 15 },
  ];
  dx = gridSize;
  dy = 0;
  nextDirection = { x: gridSize, y: 0 };
  score = 0;
  currentSpeed = initialSpeed;
  currentScoreElement.innerText = score;
  speedLevelElement.innerText = 1;
  generateFood();
}

function startGame() {
  if (gameTimeoutId) clearTimeout(gameTimeoutId);
  initGame();
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  pauseBtn.disabled = false;
  gameActive = true;
  isPaused = false;
  gameLoop();
}

function gameLoop() {
  if (!gameActive || isPaused) return;

  update();
  gameTimeoutId = setTimeout(gameLoop, currentSpeed);
}

function generateFood() {
  food.x = Math.floor(Math.random() * tileCount) * gridSize;
  food.y = Math.floor(Math.random() * tileCount) * gridSize;

  for (let segment of snake) {
    if (segment.x === food.x && segment.y === food.y) {
      generateFood();
      break;
    }
  }
}

function update() {
  dx = nextDirection.x;
  dy = nextDirection.y;

  let headX = snake[0].x + dx;
  let headY = snake[0].y + dy;

  if (headX < 0) {
    headX = canvas.width - gridSize;
  } else if (headX >= canvas.width) {
    headX = 0;
  }

  if (headY < 0) {
    headY = canvas.height - gridSize;
  } else if (headY >= canvas.height) {
    headY = 0;
  }

  const head = { x: headX, y: headY };

  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      handleGameOver();
      return;
    }
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    currentScoreElement.innerText = score;

    if (currentSpeed > minimumSpeed) {
      currentSpeed -= speedStep;
      const speedLevel =
        Math.floor((initialSpeed - currentSpeed) / speedStep) + 1;
      speedLevelElement.innerText = speedLevel;
    }

    if (score > highScore) {
      highScore = score;
      highScoreElement.innerText = highScore;
      localStorage.setItem("snakeHighScore", highScore);
    }
    generateFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ff5252";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#ff5252";
  ctx.fillRect(food.x + 2, food.y + 2, gridSize - 4, gridSize - 4);

  ctx.shadowBlur = 0;
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? "#4caf50" : "#81c784";
    ctx.fillRect(snake[i].x + 1, snake[i].y + 1, gridSize - 2, gridSize - 2);
  }
}

function togglePause() {
  if (!gameActive) return;

  if (!isPaused) {
    clearTimeout(gameTimeoutId);
    isPaused = true;
    pauseScreen.classList.remove("hidden");
    pauseBtn.innerText = "Game Paused";
  } else {
    isPaused = false;
    pauseScreen.classList.add("hidden");
    pauseBtn.innerText = "Pause Game";
    gameLoop();
  }
}

function handleGameOver() {
  if (gameTimeoutId) clearTimeout(gameTimeoutId);
  gameActive = false;
  pauseBtn.disabled = true;
  finalScoreElement.innerText = score;
  gameOverScreen.classList.remove("hidden");
}

window.addEventListener("keydown", (e) => {
  if (!gameActive || isPaused) return;

  switch (e.key) {
    case "ArrowUp":
      if (dy === 0) nextDirection = { x: 0, y: -gridSize };
      break;
    case "ArrowDown":
      if (dy === 0) nextDirection = { x: 0, y: gridSize };
      break;
    case "ArrowLeft":
      if (dx === 0) nextDirection = { x: -gridSize, y: 0 };
      break;
    case "ArrowRight":
      if (dx === 0) nextDirection = { x: gridSize, y: 0 };
      break;
  }
});

startBtn.addEventListener("click", startGame);
continueBtn.addEventListener("click", togglePause);
restartBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);
