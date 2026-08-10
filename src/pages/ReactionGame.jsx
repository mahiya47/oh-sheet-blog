import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function ReactionGame() {
  const navigate = useNavigate();
  // States: waiting, ready, clicked, result
  const [gameState, setGameState] = useState("waiting");
  const [reactionTime, setReactionTime] = useState(null);
  const [bestTime, setBestTime] = useState(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    // Fetch personal best on load
    api.get("/arcade/reaction/leaderboard").then((res) => {
      // Logic to find user's best if you return it, or just display leaderboard
    });
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const startGame = () => {
    setGameState("ready");
    setReactionTime(null);
    // Random delay between 2 and 5 seconds
    const delay = Math.floor(Math.random() * 3000) + 2000;

    timeoutRef.current = setTimeout(() => {
      setGameState("clicked");
      startTimeRef.current = Date.now();
    }, delay);
  };

  const handleClick = async () => {
    if (gameState === "waiting" || gameState === "result") {
      startGame();
    } else if (gameState === "ready") {
      clearTimeout(timeoutRef.current);
      setGameState("waiting");
      alert("Too early! Wait for green.");
    } else if (gameState === "clicked") {
      const endTime = Date.now();
      const timeTaken = endTime - startTimeRef.current;
      setReactionTime(timeTaken);
      setGameState("result");

      if (!bestTime || timeTaken < bestTime) {
        setBestTime(timeTaken);
        await api.post("/arcade/reaction/score", { score: timeTaken });
      }
    }
  };

  const getBackgroundColor = () => {
    switch (gameState) {
      case "ready":
        return "#f44336"; // Red
      case "clicked":
        return "#4caf50"; // Green
      default:
        return "var(--surface, #1e1e1e)";
    }
  };

  return (
    <div
      className="feed-col"
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
      }}
    >
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
        <h1 style={{ fontSize: "1.2rem", margin: 0 }}>Reaction Tester</h1>
      </div>

      <div
        className="reaction-game-area"
        onClick={handleClick}
        style={{ backgroundColor: getBackgroundColor() }}
      >
        {gameState === "waiting" && <h2>Tap to Start</h2>}
        {gameState === "ready" && <h2>Wait for Green...</h2>}
        {gameState === "clicked" && <h1>TAP NOW!</h1>}
        {gameState === "result" && (
          <>
            <h2>{reactionTime} ms</h2>
            <p style={{ marginTop: "10px" }}>Tap to try again</p>
          </>
        )}
      </div>

      {bestTime && (
        <div
          style={{
            textAlign: "center",
            padding: "15px",
            marginTop: "10px",
            fontSize: "1.1rem",
          }}
        >
          Personal Best:{" "}
          <strong style={{ color: "var(--accent)" }}>{bestTime} ms</strong>
        </div>
      )}
    </div>
  );
}
