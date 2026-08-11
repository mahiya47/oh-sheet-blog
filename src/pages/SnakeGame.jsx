import { useState, useEffect, useCallback } from "react";
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
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_SPEED = 150;

export default function SnakeGame() {
  const navigate = useNavigate();
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState({ x: 0, y: -1 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const speedLevel = Math.floor(score / 30) + 1;
  const currentSpeed = Math.max(50, INITIAL_SPEED - (speedLevel - 1) * 15);

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

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        if (!isStarted && !isGameOver) setIsStarted(true);
        if (isPaused) setIsPaused(false);
      }

      switch (e.key) {
        case "ArrowUp":
          setDirection((prev) => (prev.y === 1 ? prev : { x: 0, y: -1 }));
          break;
        case "ArrowDown":
          setDirection((prev) => (prev.y === -1 ? prev : { x: 0, y: 1 }));
          break;
        case "ArrowLeft":
          setDirection((prev) => (prev.x === 1 ? prev : { x: -1, y: 0 }));
          break;
        case "ArrowRight":
          setDirection((prev) => (prev.x === -1 ? prev : { x: 1, y: 0 }));
          break;
        case "p":
        case "Escape":
          setIsPaused((prev) => !prev);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStarted, isGameOver, isPaused]);

  const handleMobileDir = (newDir) => {
    if (!isStarted && !isGameOver) setIsStarted(true);
    if (isPaused) setIsPaused(false);
    if (newDir.x !== 0 && direction.x !== 0) return;
    if (newDir.y !== 0 && direction.y !== 0) return;
    setDirection(newDir);
  };

  useEffect(() => {
    if (!isStarted || isGameOver || isPaused) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          handleGameOver();
          return prevSnake;
        }

        if (
          prevSnake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y,
          )
        ) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => s + 10);
          setFood({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
          });
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, currentSpeed);
    return () => clearInterval(interval);
  }, [isStarted, isGameOver, isPaused, direction, food, currentSpeed]);

  const handleGameOver = async () => {
    setIsGameOver(true);
    setIsStarted(false);
    if (score > 0) {
      await api.post("/arcade/snake/score", { score });
      fetchLeaderboard();
    }
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection({ x: 0, y: -1 });
    setScore(0);
    setIsGameOver(false);
    setIsStarted(false);
    setIsPaused(false);
  };

  return (
    <div className="snake-page-container">
      {/* HEADER / NAVIGATION BAR */}
      <div className="snake-header-bar">
        <div className="snake-header-left">
          {/* Small back icon button visible on Mobile */}
          <button
            className="mobile-back-btn mobile-only"
            onClick={() => navigate("/arcade")}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Combined Top Stats Bar */}
          <div className="snake-stats-bar">
            <div className="snake-stat-box">Score: {score}</div>
            <div className="snake-stat-box">Speed: Lvl {speedLevel}</div>
            <div className="snake-stat-box">High: {highScore}</div>
          </div>
        </div>

        {/* Top Scores Button */}
        <button
          className="snake-btn-trophy"
          onClick={() => setIsModalOpen(true)}
        >
          <Trophy size={16} />
          <span className="desktop-only">Top 10 Scores</span>
        </button>
      </div>

      {/* MAIN GAME LAYOUT */}
      <div className="snake-main-layout">
        {/* GAME BOARD */}
        <div className="snake-board-wrapper">
          <div
            className="snake-grid-container"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isSnake = snake.some((s) => s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;

              let bgColor = "transparent";
              let shadow = "none";

              if (isSnake) {
                bgColor = "#81c784";
              } else if (isFood) {
                bgColor = "#e57373";
                shadow = "0 0 8px #e57373";
              }

              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: bgColor,
                    borderRadius: "2px",
                    boxShadow: shadow,
                  }}
                />
              );
            })}
          </div>

          {/* OVERLAYS */}
          {!isStarted && !isGameOver && (
            <div className="snake-overlay">
              <h3 style={{ textAlign: "center" }}>
                Press an arrow key / D-Pad to start
              </h3>
            </div>
          )}
          {isPaused && !isGameOver && (
            <div className="snake-overlay">
              <h2 style={{ textAlign: "center", letterSpacing: "2px" }}>
                PAUSED
              </h2>
            </div>
          )}
          {isGameOver && (
            <div className="snake-overlay">
              <h2 style={{ color: "#e57373", textAlign: "center" }}>
                Game Over!
              </h2>
              <button
                className="btn"
                onClick={resetGame}
                style={{ marginTop: 10 }}
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* CONTROLS (Positioned on the side for desktop) */}
        <div className="snake-side-controls">
          <button
            className="snake-btn-pause"
            onClick={() => setIsPaused(!isPaused)}
            disabled={!isStarted || isGameOver}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>

          {/* D-PAD CONTROLS */}
          <div className="d-pad">
            <button
              className="d-pad-btn d-up"
              onClick={() => handleMobileDir({ x: 0, y: -1 })}
            >
              <ArrowUp />
            </button>
            <button
              className="d-pad-btn d-left"
              onClick={() => handleMobileDir({ x: -1, y: 0 })}
            >
              <ArrowLeftIcon />
            </button>
            <button
              className="d-pad-btn d-right"
              onClick={() => handleMobileDir({ x: 1, y: 0 })}
            >
              <ArrowRight />
            </button>
            <button
              className="d-pad-btn d-down"
              onClick={() => handleMobileDir({ x: 0, y: 1 })}
            >
              <ArrowDown />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL COMPONENT FOR SCORES */}
      <ScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leaderboard={leaderboard}
      />
    </div>
  );
}
