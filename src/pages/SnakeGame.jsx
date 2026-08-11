import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// --- Score Modal Component (Inline for simplicity) ---
function ScoreModal({ isOpen, onClose, leaderboard }) {
  if (!isOpen) return null;
  return (
    <div className="arcade-modal-overlay" onClick={onClose}>
      <div
        className="arcade-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="arcade-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Trophy size={18} /> Top 10 Scores
          </div>
          <button className="arcade-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {leaderboard.length === 0 ? (
          <p style={{ color: "#777", textAlign: "center" }}>No scores yet.</p>
        ) : (
          <div>
            {leaderboard.map((entry, index) => (
              <div key={entry.id || index} className="arcade-modal-item">
                <span>
                  #{index + 1} {entry.user?.username || "Player"}
                </span>
                <span className="arcade-modal-score">{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Game Component ---
const GRID_SIZE = 20;
const INITIAL_SPEED = 120;
const MINIMUM_SPEED = 40;
const SPEED_STEP = 5;

export default function SnakeGame() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [canvasPx, setCanvasPx] = useState(700); // Increased default max-size

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
  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isStartedRef = useRef(false);
  const isPausedRef = useRef(false);
  const isGameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const tickTimeoutRef = useRef(null);

  // Resize canvas based on wrapper
  useEffect(() => {
    const resize = () => {
      if (!wrapperRef.current) return;
      const size = Math.min(wrapperRef.current.offsetWidth, 750); // Matches new CSS width
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

    // Draw Food
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

    // Draw Snake
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
      {/* MOBILE HEADER (Tiny, Inline, Back Button, Stats, Trophy) */}
      <div className="snake-mobile-header mobile-only">
        <button className="mobile-back-btn" onClick={() => navigate("/arcade")}>
          <ArrowLeft size={16} />
        </button>
        <div className="snake-stats-mobile">
          <div>
            Scr: <span>{score}</span>
          </div>
          <div>
            Spd: <span>{speedLevel}</span>
          </div>
          <div>
            Hi: <span>{highScore}</span>
          </div>
        </div>
        <button className="mobile-top-btn" onClick={() => setIsModalOpen(true)}>
          <Trophy size={16} />
        </button>
      </div>

      <div className="snake-desktop-layout">
        {/* LEFT COLUMN: Stats + Game Box */}
        <div className="snake-game-column">
          {/* DESKTOP STATS */}
          <div className="snake-stats-desktop desktop-only">
            <div className="snake-stat-box">
              Score: <span>{score}</span>
            </div>
            <div className="snake-stat-box">
              Speed: <span>{speedLevel}</span>
            </div>
            <div className="snake-stat-box">
              High Score: <span>{highScore}</span>
            </div>
          </div>

          {/* GAME CANVAS */}
          <div className="snake-board-wrapper" ref={wrapperRef}>
            <canvas ref={canvasRef} width={canvasPx} height={canvasPx} />

            {!isStarted && !isGameOver && (
              <div className="snake-overlay">
                <h1>SNAKE GAME</h1>
                <p>Use Arrow Keys or D-Pad. Wrap around walls!</p>
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
                <p>Final Score: {score}</p>
                <button className="btn" onClick={resetGame}>
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Modal Trigger, Controls, D-Pad */}
        <div className="snake-controls-column">
          {/* Top Scores Huge Box Button (Desktop Only) */}
          <button
            className="snake-btn-trophy-large desktop-only"
            onClick={() => setIsModalOpen(true)}
          >
            <Trophy size={32} />
            Show Top Scores
          </button>

          {/* Action Buttons */}
          <div className="snake-action-row">
            <button
              className="snake-btn-action"
              onClick={togglePause}
              disabled={!isStarted || isGameOver}
            >
              {isPaused ? "Resume" : "Play / Pause"}
            </button>
            <button className="snake-btn-action restart" onClick={resetGame}>
              Restart
            </button>
          </div>

          {/* D-Pad */}
          <div className="d-pad-container">
            <div className="d-pad">
              <button className="d-pad-btn d-up" onClick={() => setDir(0, -1)}>
                <ArrowUp />
              </button>
              <button
                className="d-pad-btn d-left"
                onClick={() => setDir(-1, 0)}
              >
                <ArrowLeftIcon />
              </button>
              <button
                className="d-pad-btn d-right"
                onClick={() => setDir(1, 0)}
              >
                <ArrowRight />
              </button>
              <button className="d-pad-btn d-down" onClick={() => setDir(0, 1)}>
                <ArrowDown />
              </button>
            </div>
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
