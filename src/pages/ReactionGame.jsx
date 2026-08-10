import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function ReactionGame() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState("waiting"); // waiting, ready, clicked, result
  const [reactionTime, setReactionTime] = useState(null);
  const [bestTime, setBestTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const timeoutRef = useRef(null);
  const startTimeRef = useRef(0);

  // Fetch leaderboard when component mounts OR when bestTime changes
  useEffect(() => {
    api
      .get("/arcade/reaction/leaderboard")
      .then((res) => setLeaderboard(res.data))
      .catch((err) => console.error("Failed to load leaderboard:", err));

    return () => clearTimeout(timeoutRef.current);
  }, [bestTime]);

  const startGame = () => {
    setGameState("ready");
    setReactionTime(null);
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
        // Save new high score, which will trigger the useEffect to refresh the leaderboard
        await api.post("/arcade/reaction/score", { score: timeTaken });
      }
    }
  };

  const getBackgroundColor = () => {
    switch (gameState) {
      case "ready":
        return "#f44336";
      case "clicked":
        return "#4caf50";
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
      {/* HEADER */}
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

      {/* GAME AREA */}
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

      {/* PERSONAL BEST */}
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

      {/* LEADERBOARD SECTION */}
      <div
        style={{
          marginTop: "30px",
          backgroundColor: "var(--surface)",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid var(--border)",
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
          <Trophy size={20} /> Top 10 Fastest
        </h3>

        {leaderboard.length === 0 ? (
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            No scores yet. Be the first!
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "12px",
                  borderBottom:
                    index !== leaderboard.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <strong style={{ width: "20px", color: "var(--text-muted)" }}>
                    #{index + 1}
                  </strong>
                  {entry.user.avatarUrl ? (
                    <img
                      src={entry.user.avatarUrl}
                      alt="avatar"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: "#555",
                      }}
                    />
                  )}
                  <span style={{ fontWeight: "500" }}>
                    {entry.user.name || entry.user.username}
                  </span>
                </div>

                <strong style={{ color: "var(--accent)" }}>
                  {entry.score} ms
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
