import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Gamepad2,
  ArrowUp,
  ArrowDown,
  ArrowRight,
} from "lucide-react";

const GRID_SIZE = 20;
const CANVAS_SIZE = 600;
const TILE_COUNT = CANVAS_SIZE / GRID_SIZE;
const INITIAL_SPEED = 120;
const MINIMUM_SPEED = 40;
const SPEED_STEP = 5;

export default function SnakePage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [gameState, setGameState] = useState("start");
  const [score, setScore] = useState(0);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem("snakeHighScore")) || 0,
  );

  const snakeRef = useRef([]);
  const foodRef = useRef({ x: 0, y: 0 });
  const dirRef = useRef({ x: GRID_SIZE, y: 0 });
  const nextDirRef = useRef({ x: GRID_SIZE, y: 0 });
  const speedRef = useRef(INITIAL_SPEED);
  const gameTimeoutRef = useRef(null);
  const gameStateRef = useRef("start");

  const setBothGameStates = (newState) => {
    setGameState(newState);
    gameStateRef.current = newState;
  };

  const generateFood = useCallback(() => {
    let newFood = {
      x: Math.floor(Math.random() * TILE_COUNT) * GRID_SIZE,
      y: Math.floor(Math.random() * TILE_COUNT) * GRID_SIZE,
    };
    const isOnSnake = snakeRef.current.some(
      (segment) => segment.x === newFood.x && segment.y === newFood.y,
    );
    if (isOnSnake) {
      generateFood();
    } else {
      foodRef.current = newFood;
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff5252";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff5252";
    ctx.fillRect(
      foodRef.current.x + 2,
      foodRef.current.y + 2,
      GRID_SIZE - 4,
      GRID_SIZE - 4,
    );

    ctx.shadowBlur = 0;
    const snake = snakeRef.current;
    for (let i = 0; i < snake.length; i++) {
      ctx.fillStyle = i === 0 ? "#4caf50" : "#81c784";
      ctx.fillRect(
        snake[i].x + 1,
        snake[i].y + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
      );
    }
  }, []);

  const handleGameOver = useCallback(() => {
    if (gameTimeoutRef.current) clearTimeout(gameTimeoutRef.current);
    setBothGameStates("gameover");
  }, []);

  const update = useCallback(() => {
    dirRef.current = nextDirRef.current;
    const dx = dirRef.current.x;
    const dy = dirRef.current.y;
    const snake = snakeRef.current;

    if (!snake.length) return;

    let headX = snake[0].x + dx;
    let headY = snake[0].y + dy;

    if (headX < 0) headX = CANVAS_SIZE - GRID_SIZE;
    else if (headX >= CANVAS_SIZE) headX = 0;

    if (headY < 0) headY = CANVAS_SIZE - GRID_SIZE;
    else if (headY >= CANVAS_SIZE) headY = 0;

    const head = { x: headX, y: headY };

    for (let i = 0; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        handleGameOver();
        return;
      }
    }

    snake.unshift(head);

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      setScore((prevScore) => {
        const newScore = prevScore + 10;
        setHighScore((prevHigh) => {
          if (newScore > prevHigh) {
            localStorage.setItem("snakeHighScore", newScore);
            return newScore;
          }
          return prevHigh;
        });
        return newScore;
      });

      if (speedRef.current > MINIMUM_SPEED) {
        speedRef.current -= SPEED_STEP;
        setSpeedLevel(
          Math.floor((INITIAL_SPEED - speedRef.current) / SPEED_STEP) + 1,
        );
      }
      generateFood();
    } else {
      snake.pop();
    }

    draw();
  }, [draw, generateFood, handleGameOver]);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== "playing") return;
    update();
    gameTimeoutRef.current = setTimeout(gameLoop, speedRef.current);
  }, [update]);

  const initGame = () => {
    if (gameTimeoutRef.current) clearTimeout(gameTimeoutRef.current);
    snakeRef.current = [
      { x: GRID_SIZE * 5, y: GRID_SIZE * 15 },
      { x: GRID_SIZE * 4, y: GRID_SIZE * 15 },
      { x: GRID_SIZE * 3, y: GRID_SIZE * 15 },
    ];
    dirRef.current = { x: GRID_SIZE, y: 0 };
    nextDirRef.current = { x: GRID_SIZE, y: 0 };
    speedRef.current = INITIAL_SPEED;
    setScore(0);
    setSpeedLevel(1);
    generateFood();
    setBothGameStates("playing");

    // Defer the loop start slightly to guarantee canvas ref is mounted
    setTimeout(() => {
      gameLoop();
    }, 50);
  };

  const togglePause = () => {
    if (gameStateRef.current === "playing") {
      clearTimeout(gameTimeoutRef.current);
      setBothGameStates("paused");
    } else if (gameStateRef.current === "paused") {
      setBothGameStates("playing");
      gameLoop();
    }
  };

  const handleDirectionClick = (direction) => {
    if (gameStateRef.current !== "playing") return;
    const { x: dx, y: dy } = dirRef.current;

    switch (direction) {
      case "UP":
        if (dy === 0) nextDirRef.current = { x: 0, y: -GRID_SIZE };
        break;
      case "DOWN":
        if (dy === 0) nextDirRef.current = { x: 0, y: GRID_SIZE };
        break;
      case "LEFT":
        if (dx === 0) nextDirRef.current = { x: -GRID_SIZE, y: 0 };
        break;
      case "RIGHT":
        if (dx === 0) nextDirRef.current = { x: GRID_SIZE, y: 0 };
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      if (gameStateRef.current !== "playing") return;

      const { x: dx, y: dy } = dirRef.current;
      switch (e.key) {
        case "ArrowUp":
          if (dy === 0) nextDirRef.current = { x: 0, y: -GRID_SIZE };
          break;
        case "ArrowDown":
          if (dy === 0) nextDirRef.current = { x: 0, y: GRID_SIZE };
          break;
        case "ArrowLeft":
          if (dx === 0) nextDirRef.current = { x: -GRID_SIZE, y: 0 };
          break;
        case "ArrowRight":
          if (dx === 0) nextDirRef.current = { x: GRID_SIZE, y: 0 };
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (gameTimeoutRef.current) clearTimeout(gameTimeoutRef.current);
    };
  }, []);

  return (
    <div className="feed-col">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate(-1)}
          style={{ padding: "8px" }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "1.2rem",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          <Gamepad2 size={20} color="var(--accent)" /> Snake
        </h1>
      </div>

      <div className="snake-game-container">
        <header className="snake-score-board">
          <div className="snake-score-box">
            Score: <span>{score}</span>
          </div>
          <div className="snake-score-box">
            Speed Level: <span>{speedLevel}</span>
          </div>
          <div className="snake-score-box">
            High Score: <span>{highScore}</span>
          </div>
        </header>

        <div className="snake-canvas-wrapper">
          <canvas
            ref={canvasRef}
            id="snake-game-canvas"
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
          ></canvas>

          {gameState === "start" && (
            <div className="snake-overlay">
              <h1>SNAKE GAME</h1>
              <p className="snake-controls-hint">
                Control the snake using the <strong>Arrow Keys</strong> or{" "}
                <strong>On-Screen D-Pad</strong>. Walls are safe—you will wrap
                around them!
              </p>
              <button className="snake-menu-btn" onClick={initGame}>
                Start Game
              </button>
            </div>
          )}

          {gameState === "paused" && (
            <div className="snake-overlay">
              <h2>Game Paused</h2>
              <button
                className="snake-menu-btn snake-pause-btn"
                onClick={togglePause}
              >
                Continue
              </button>
              <button className="snake-menu-btn" onClick={initGame}>
                New Game
              </button>
            </div>
          )}

          {gameState === "gameover" && (
            <div className="snake-overlay">
              <h2>Game Over</h2>
              <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                Final Score: {score}
              </p>
              <button className="snake-menu-btn" onClick={initGame}>
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Mobile On-Screen D-Pad Controls */}
        <div className="snake-mobile-controls">
          <div className="snake-controls-row">
            <button
              className="snake-dpad-btn"
              onPointerDown={(e) => {
                e.preventDefault();
                handleDirectionClick("UP");
              }}
            >
              <ArrowUp size={28} />
            </button>
          </div>
          <div className="snake-controls-row">
            <button
              className="snake-dpad-btn"
              onPointerDown={(e) => {
                e.preventDefault();
                handleDirectionClick("LEFT");
              }}
            >
              <ArrowLeft size={28} />
            </button>
            <button
              className="snake-dpad-btn"
              onPointerDown={(e) => {
                e.preventDefault();
                handleDirectionClick("DOWN");
              }}
            >
              <ArrowDown size={28} />
            </button>
            <button
              className="snake-dpad-btn"
              onPointerDown={(e) => {
                e.preventDefault();
                handleDirectionClick("RIGHT");
              }}
            >
              <ArrowRight size={28} />
            </button>
          </div>
        </div>

        <footer
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          <button
            className="snake-action-btn"
            onClick={togglePause}
            disabled={gameState === "start" || gameState === "gameover"}
          >
            {gameState === "paused" ? "Resume Game" : "Pause Game"}
          </button>
        </footer>
      </div>
    </div>
  );
}
