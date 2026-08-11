import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import ScoreModal from "../components/ScoreModal";

const GRID_SIZE = 20;
const INITIAL_SPEED = 120;
const MINIMUM_SPEED = 40;
const SPEED_STEP = 5;

export default function SnakeGame() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [canvasPx, setCanvasPx] = useState(500);

  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const foodRef = useRef({ x: 15, y: 15 });
  const dirRef = useRef({ x: 0, y: -1 });
  const nextDirRef = useRef({ x: 0, y: -1 });
  const speedRef = useRef(INITIAL_SPEED); // <-- live speed, read fresh every tick

  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isStartedRef = useRef(false);
  const isPausedRef = useRef(false);
  const isGameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const tickTimeoutRef = useRef(null);

  useEffect(() => {
    const resize = () => {
      if (!wrapperRef.current) return;
      const size = Math.min(wrapperRef.current.offsetWidth, 520);
      setCanvasPx(size);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const fetchLeaderboard = useCallback(() => {
    api
      .get("/arcade/snake/leaderboard")
      .then((res) => {
        setLeaderboard(res.data);
        if (res.data.length > 0) {
          const topScore = Math.max(...res.data.map((entry) => entry.score));
          setHighScore((prev) => Math.max(prev, topScore));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cell = canvasPx / GRID_SIZE;

    ctx.clearRect(0, 0, canvasPx, canvasPx);

    ctx.fillStyle = "#ff5252";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff5252";
    ctx.fillRect(
      foodRef.current.x * cell + 2,
      foodRef.current.y * cell + 2,
      cell - 4,
      cell - 4,
    );
    ctx.shadowBlur = 0;

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
      await api.post("/arcade/snake/score", { score: scoreRef.current });
      fetchLeaderboard();
    }
  }, [fetchLeaderboard]);

  // The loop schedules itself using speedRef.current, read fresh every
  // single call — so speed changes take effect immediately, mid-loop,
  // exactly like the vanilla setTimeout(gameLoop, currentSpeed) version.
  const tick = useCallback(() => {
    if (!isStartedRef.current || isGameOverRef.current || isPausedRef.current)
      return;

    dirRef.current = nextDirRef.current;
    const snake = snakeRef.current;
    const head = snake[0];

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

      // Speed up on every apple, matching the vanilla script exactly
      if (speedRef.current > MINIMUM_SPEED) {
        speedRef.current -= SPEED_STEP;
        const level =
          Math.floor((INITIAL_SPEED - speedRef.current) / SPEED_STEP) + 1;
        setSpeedLevel(level);
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const resetGame = () => {
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
    if (tickTimeoutRef.current) {
      clearTimeout(tickTimeoutRef.current);
      tickTimeoutRef.current = null;
    }
    spawnFood();
    draw();
  };

  useEffect(() => {
    return () => {
      if (tickTimeoutRef.current) clearTimeout(tickTimeoutRef.current);
    };
  }, []);

  return (
    <div className="snake-page-container">
      <div className="snake-header-bar">
        <div className="snake-header-left">
          <button
            className="mobile-back-btn mobile-only"
            onClick={() => navigate("/arcade")}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="snake-stats-bar">
            <div className="snake-stat-box">
              Score: <span>{score}</span>
            </div>
            <div className="snake-stat-box">
              Speed Level: <span>{speedLevel}</span>
            </div>
            <div className="snake-stat-box">
              High Score: <span>{highScore}</span>
            </div>
          </div>
        </div>

        <button
          className="snake-btn-trophy"
          onClick={() => setIsModalOpen(true)}
        >
          <Trophy size={16} />
          <span className="desktop-only">Top 10 Scores</span>
        </button>
      </div>

      <div className="snake-main-layout">
        <div className="snake-board-wrapper" ref={wrapperRef}>
          <canvas
            ref={canvasRef}
            width={canvasPx}
            height={canvasPx}
            style={{ width: "100%", height: "100%", display: "block" }}
          />

          {!isStarted && !isGameOver && (
            <div className="snake-overlay">
              <h1>SNAKE GAME</h1>
              <p>
                Control the snake using <strong>Arrow Keys</strong> or the{" "}
                <strong>D-Pad</strong>. Walls are safe — you wrap around them!
              </p>
              <button className="btn" onClick={beginMoving}>
                Start Game
              </button>
            </div>
          )}
          {isPaused && !isGameOver && (
            <div className="snake-overlay">
              <h2>Game Paused</h2>
              <button className="btn" onClick={togglePause}>
                Continue
              </button>
            </div>
          )}
          {isGameOver && (
            <div className="snake-overlay">
              <h2>Game Over</h2>
              <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                Final Score: {score}
              </p>
              <button className="btn" onClick={resetGame}>
                Play Again
              </button>
            </div>
          )}
        </div>

        <div className="snake-side-controls">
          <button
            className="snake-btn-pause"
            onClick={togglePause}
            disabled={!isStarted || isGameOver}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>

          <div className="d-pad">
            <button className="d-pad-btn d-up" onClick={() => setDir(0, -1)}>
              <ArrowUp />
            </button>
            <button className="d-pad-btn d-left" onClick={() => setDir(-1, 0)}>
              <ArrowLeftIcon />
            </button>
            <button className="d-pad-btn d-right" onClick={() => setDir(1, 0)}>
              <ArrowRight />
            </button>
            <button className="d-pad-btn d-down" onClick={() => setDir(0, 1)}>
              <ArrowDown />
            </button>
          </div>
        </div>
      </div>

      <ScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leaderboard={leaderboard}
      />
    </div>
  );
}
