import { useState, useEffect, useRef, useCallback } from "react";
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

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_SPEED = 150;

export default function SnakeGame() {
  const navigate = useNavigate();
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState({ x: 0, y: -1 }); // Moving up initially
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  // Fetch Leaderboard
  const fetchLeaderboard = useCallback(() => {
    api
      .get("/arcade/snake/leaderboard")
      .then((res) => setLeaderboard(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault(); // Stop screen from scrolling
        if (!isStarted && !isGameOver) setIsStarted(true);
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
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStarted, isGameOver]);

  // Mobile Controls
  const handleMobileDir = (newDir) => {
    if (!isStarted && !isGameOver) setIsStarted(true);
    if (newDir.x !== 0 && direction.x !== 0) return; // Prevent reversing
    if (newDir.y !== 0 && direction.y !== 0) return; // Prevent reversing
    setDirection(newDir);
  };

  // Game Loop
  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        // Collision with walls
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          handleGameOver();
          return prevSnake;
        }

        // Collision with self
        if (
          prevSnake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y,
          )
        ) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Eat food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => s + 10);
          setFood({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
          });
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, INITIAL_SPEED);
    return () => clearInterval(interval);
  }, [isStarted, isGameOver, direction, food]);

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
  };

  return (
    <div className="feed-col" style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate("/arcade")}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: "1.2rem", margin: 0 }}>Snake</h1>
        </div>
        <strong style={{ color: "var(--accent)", fontSize: "1.2rem" }}>
          Score: {score}
        </strong>
      </div>

      {/* GAME BOARD */}
      <div
        style={{ position: "relative", maxWidth: "400px", margin: "0 auto" }}
      >
        <div className="snake-grid">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isSnake = snake.some((s) => s.x === x && s.y === y);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className="snake-cell"
                style={{
                  backgroundColor: isHead
                    ? "#4caf50"
                    : isSnake
                      ? "#388e3c"
                      : isFood
                        ? "#f44336"
                        : "transparent",
                  borderRadius: isFood ? "50%" : "2px",
                }}
              />
            );
          })}
        </div>

        {/* OVERLAYS */}
        {!isStarted && !isGameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
          >
            <h3>Press an arrow key to start</h3>
          </div>
        )}
        {isGameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.8)",
            }}
          >
            <h2 style={{ color: "#f44336" }}>Game Over!</h2>
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

      {/* MOBILE D-PAD */}
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

      {/* LEADERBOARD */}
      <div
        style={{
          marginTop: "30px",
          backgroundColor: "var(--surface)",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: "0 0 16px 0",
            color: "var(--accent)",
          }}
        >
          <Trophy size={20} /> Top 10 Snakes
        </h3>
        {leaderboard.length === 0 ? (
          <p>No scores yet.</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "8px",
                }}
              >
                <span>
                  #{index + 1} {entry.user.username}
                </span>
                <strong style={{ color: "var(--accent)" }}>
                  {entry.score} pts
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
