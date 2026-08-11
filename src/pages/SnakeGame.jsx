import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight,
} from "lucide-react";
import api from "../api";

const GRID_SIZE = 20;
const INITIAL_SPEED = 120;
const SPEED_STEP = 5;

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [canvasPx, setCanvasPx] = useState(500);

  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const foodRef = useRef({ x: 15, y: 15 });
  const dirRef = useRef({ x: 0, y: -1 });
  const nextDirRef = useRef({ x: 0, y: -1 });
  const speedRef = useRef(INITIAL_SPEED);

  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);

  const isStartedRef = useRef(false);
  const isPausedRef = useRef(false);
  const isGameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const tickTimeoutRef = useRef(null);

  // Auto-resize canvas
  useEffect(() => {
    const resize = () => {
      if (!wrapperRef.current) return;
      setCanvasPx(wrapperRef.current.offsetWidth);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cell = canvasPx / GRID_SIZE;

    ctx.clearRect(0, 0, canvasPx, canvasPx);

    // Food
    ctx.fillStyle = "#ff5252";
    ctx.fillRect(
      foodRef.current.x * cell + 2,
      foodRef.current.y * cell + 2,
      cell - 4,
      cell - 4,
    );

    // Snake
    const snake = snakeRef.current;
    for (let i = 0; i < snake.length; i++) {
      ctx.fillStyle = i === 0 ? "#4caf50" : "#81c784";
      ctx.fillRect(
        snake[i].x * cell + 1,
        snake[i].y * cell + 1,
        cell - 2,
        cell - 2,
      );
    }
  }, [canvasPx]);

  useEffect(() => {
    draw();
  }, [draw, canvasPx]);

  const spawnFood = useCallback(() => {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeRef.current.some((s) => s.x === pos.x && s.y === pos.y));
    foodRef.current = pos;
  }, []);

  const handleGameOver = useCallback(async () => {
    if (tickTimeoutRef.current) clearTimeout(tickTimeoutRef.current);
    isGameOverRef.current = true;
    isStartedRef.current = false;
    setIsGameOver(true);
    setIsStarted(false);

    if (scoreRef.current > 0) {
      try {
        await api.post("/arcade/snake/score", { score: scoreRef.current });
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const tick = useCallback(() => {
    if (!isStartedRef.current || isGameOverRef.current || isPausedRef.current)
      return;

    dirRef.current = nextDirRef.current;
    const snake = snakeRef.current;
    const head = snake[0];

    // Wrap around logic
    let newX = head.x + dirRef.current.x;
    let newY = head.y + dirRef.current.y;
    if (newX < 0) newX = GRID_SIZE - 1;
    else if (newX >= GRID_SIZE) newX = 0;
    if (newY < 0) newY = GRID_SIZE - 1;
    else if (newY >= GRID_SIZE) newY = 0;

    const newHead = { x: newX, y: newY };

    if (snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      handleGameOver();
      return;
    }

    snake.unshift(newHead);

    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      if (speedRef.current > 40) {
        speedRef.current -= SPEED_STEP;
        setSpeedLevel(
          Math.floor((INITIAL_SPEED - speedRef.current) / SPEED_STEP) + 1,
        );
      }
      spawnFood();
    } else {
      snake.pop();
    }

    draw();
    tickTimeoutRef.current = setTimeout(tick, speedRef.current);
  }, [draw, spawnFood, handleGameOver]);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  const beginMoving = () => {
    if (!isStartedRef.current && !isGameOverRef.current) {
      isStartedRef.current = true;
      setIsStarted(true);
    }
    if (isPausedRef.current) {
      isPausedRef.current = false;
      setIsPaused(false);
    }
    if (!tickTimeoutRef.current) {
      tickTimeoutRef.current = setTimeout(tick, speedRef.current);
    }
  };

  const setDir = (nx, ny) => {
    const { x: dx, y: dy } = dirRef.current;
    if (nx !== 0 && dx !== 0) return;
    if (ny !== 0 && dy !== 0) return;
    nextDirRef.current = { x: nx, y: ny };
    beginMoving();
  };

  const togglePause = () => {
    if (!isStartedRef.current || isGameOverRef.current) return;
    if (isPausedRef.current) {
      isPausedRef.current = false;
      setIsPaused(false);
      tickTimeoutRef.current = setTimeout(tick, speedRef.current);
    } else {
      isPausedRef.current = true;
      setIsPaused(true);
      if (tickTimeoutRef.current) {
        clearTimeout(tickTimeoutRef.current);
        tickTimeoutRef.current = null;
      }
    }
  };

  const resetGame = async () => {
    if (tickTimeoutRef.current) clearTimeout(tickTimeoutRef.current);
    if (!isGameOverRef.current && scoreRef.current > 0) {
      try {
        await api.post("/arcade/snake/score", { score: scoreRef.current });
      } catch (err) {}
    }
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = { x: 0, y: -1 };
    nextDirRef.current = { x: 0, y: -1 };
    speedRef.current = INITIAL_SPEED;
    scoreRef.current = 0;
    setScore(0);
    setSpeedLevel(1);
    isGameOverRef.current = false;
    isStartedRef.current = false;
    isPausedRef.current = false;
    setIsGameOver(false);
    setIsStarted(false);
    setIsPaused(false);
    spawnFood();
    draw();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        e.preventDefault();
      switch (e.key) {
        case "ArrowUp":
          setDir(0, -1);
          break;
        case "ArrowDown":
          setDir(0, 1);
          break;
        case "ArrowLeft":
          setDir(-1, 0);
          break;
        case "ArrowRight":
          setDir(1, 0);
          break;
        case "p":
        case "Escape":
          togglePause();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ padding: "0" }}>
      <div className="snake-wireframe-container">
        {/* LEFT/MAIN: Game Box */}
        <div className="snake-wireframe-board" ref={wrapperRef}>
          <canvas
            ref={canvasRef}
            width={canvasPx}
            height={canvasPx}
            style={{ display: "block" }}
          />

          {!isStarted && !isGameOver && (
            <div className="snake-overlay">
              <button
                className="snake-action-btn"
                onClick={beginMoving}
                style={{
                  backgroundColor: "var(--accent)",
                  color: "black",
                  padding: "16px 32px",
                }}
              >
                Start Game
              </button>
            </div>
          )}
          {isGameOver && (
            <div className="snake-overlay">
              <h2>Game Over</h2>
              <button
                className="snake-action-btn"
                onClick={resetGame}
                style={{ marginTop: "10px" }}
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* RIGHT/MIDDLE: Stats & Controls */}
        <div className="snake-wireframe-controls">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Score <span>{score}</span>
            </div>
            <div className="snake-stat-row">
              Speed <span>{speedLevel}</span>
            </div>
            <div className="snake-stat-row">
              High Score <span>{highScore}</span>
            </div>
          </div>

          <div
            className="snake-action-buttons"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <button
              className="snake-action-btn"
              onClick={beginMoving}
              disabled={isStarted && !isPaused}
            >
              Play
            </button>
            <button
              className="snake-action-btn"
              onClick={togglePause}
              disabled={!isStarted || isGameOver}
            >
              Pause
            </button>
            <button className="snake-action-btn" onClick={resetGame}>
              Restart
            </button>
          </div>

          <div className="d-pad" style={{ marginTop: "10px" }}>
            <button className="d-pad-btn d-up" onClick={() => setDir(0, -1)}>
              <ArrowUp size={20} />
            </button>
            <button className="d-pad-btn d-left" onClick={() => setDir(-1, 0)}>
              <ArrowLeftIcon size={20} />
            </button>
            <button className="d-pad-btn d-right" onClick={() => setDir(1, 0)}>
              <ArrowRight size={20} />
            </button>
            <button className="d-pad-btn d-down" onClick={() => setDir(0, 1)}>
              <ArrowDown size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
