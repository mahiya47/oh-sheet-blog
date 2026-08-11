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
  const [direction, setDirection] = useState({ x: 0, y: -1 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  // Calculate speed level (increases every 30 points)
  const speedLevel = Math.floor(score / 30) + 1;
  const currentSpeed = Math.max(50, INITIAL_SPEED - (speedLevel - 1) * 15);

  // Fetch Leaderboard
  const fetchLeaderboard = useCallback(() => {
    api
      .get("/arcade/snake/leaderboard")
      .then((res) => {
        setLeaderboard(res.data);
        // Set local high score based on leaderboard if it's higher
        if (res.data.length > 0) {
          const topScore = Math.max(...res.data.map((entry) => entry.score));
          if (topScore > highScore) setHighScore(topScore);
        }
      })
      .catch(console.error);
  }, [highScore]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Update high score in real-time if current score beats it
  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  // Handle Keyboard Input
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

  // Mobile Controls
  const handleMobileDir = (newDir) => {
    if (!isStarted && !isGameOver) setIsStarted(true);
    if (isPaused) setIsPaused(false);
    if (newDir.x !== 0 && direction.x !== 0) return;
    if (newDir.y !== 0 && direction.y !== 0) return;
    setDirection(newDir);
  };

  // Game Loop
  useEffect(() => {
    if (!isStarted || isGameOver || isPaused) return;

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

  // UI Styles matching the screenshot
  const statBoxStyle = {
    backgroundColor: "#161616",
    border: "1px solid #333",
    padding: "8px 16px",
    borderRadius: "8px",
    fontWeight: "bold",
    color: "#fff",
    fontSize: "0.95rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
  };

  return (
    <div className="feed-col" style={{ padding: "20px" }}>
      {/* HEADER WITH BACK BUTTON */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button className="btn btn-ghost" onClick={() => navigate("/arcade")}>
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: "1.2rem", margin: 0 }}>Snake</h1>
      </div>

      {/* TOP STATS BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div style={statBoxStyle}>Score: {score}</div>
        <div style={statBoxStyle}>Speed Level: {speedLevel}</div>
        <div style={statBoxStyle}>High Score: {highScore}</div>
      </div>

      {/* GAME BOARD */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          margin: "0 auto",
          aspectRatio: "1 / 1",
          backgroundColor: "#1a1a1a", // Dark grey background
          borderRadius: "12px",
          padding: "8px",
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.8)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            height: "100%",
            gap: "2px", // Creates the distinct separated squares effect
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
              bgColor = "#81c784"; // Lighter green for the snake
            } else if (isFood) {
              bgColor = "#e57373"; // Redish food
              shadow = "0 0 8px #e57373"; // Subtle glow
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
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ textAlign: "center" }}>Press an arrow key to start</h3>
          </div>
        )}
        {isPaused && !isGameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: "12px",
            }}
          >
            <h2 style={{ textAlign: "center", letterSpacing: "2px" }}>
              PAUSED
            </h2>
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
              borderRadius: "12px",
            }}
          >
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

      {/* PAUSE BUTTON */}
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
      >
        <button
          style={{
            backgroundColor: "#d87093", // Pinkish button color
            color: "white",
            border: "none",
            padding: "10px 24px",
            borderRadius: "24px",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            opacity: !isStarted || isGameOver ? 0.5 : 1,
          }}
          onClick={() => setIsPaused(!isPaused)}
          disabled={!isStarted || isGameOver}
        >
          {isPaused ? "Resume Game" : "Pause Game"}
        </button>
      </div>

      {/* MOBILE D-PAD */}
      <div className="d-pad" style={{ marginTop: "30px" }}>
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
          marginTop: "40px",
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
