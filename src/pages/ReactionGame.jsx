import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

export default function ReactionGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const [gameState, setGameState] = useState("waiting"); // waiting, ready, clicked, result
  const [reactionTime, setReactionTime] = useState(null);
  const [bestTime, setBestTime] = useState(null);

  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const timeoutRef = useRef(null);
  const startTimeRef = useRef(0);

  // --- FETCH LEADERBOARD & PERSONAL BEST ---
  const fetchLeaderboardAndBest = useCallback(() => {
    api
      .get("/arcade/reaction/leaderboard")
      .then((res) => {
        if (res.data) {
          // Reaction time scores are lowest = best (ascending sort)
          const sortedData = res.data.sort((a, b) => a.score - b.score);
          setLeaderboard(sortedData);

          if (currentUser) {
            const myBest = sortedData.find(
              (entry) => entry.user?.username === currentUser.username,
            );
            if (myBest) {
              setBestTime(myBest.score);
              return;
            }
          }
          if (sortedData.length > 0) {
            setBestTime(sortedData[0].score);
          }
        }
      })
      .catch((err) => console.error("Failed to load leaderboard:", err));
  }, [currentUser]);

  useEffect(() => {
    fetchLeaderboardAndBest();
    return () => clearTimeout(timeoutRef.current);
  }, [fetchLeaderboardAndBest]);

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
        try {
          await api.post("/arcade/reaction/score", { score: timeTaken });
          fetchLeaderboardAndBest();
        } catch (err) {
          console.error("Failed to save reaction score:", err);
        }
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
        return "var(--arcade-surface-2, #1a1a1a)";
    }
  };

  return (
    <div style={{ padding: "0" }}>
      {/* MOBILE HEADER (Hidden on Desktop) */}
      <div className="arcade-mobile-header mobile-only">
        <button
          className="arcade-mobile-back"
          onClick={() => navigate("/arcade")}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          State <span>{gameState.toUpperCase()}</span>
        </div>
        <div>
          Best <span>{bestTime ? `${bestTime}ms` : "-"}</span>
        </div>
        <button
          className="arcade-mobile-trophy"
          onClick={() => setIsModalOpen(true)}
        >
          Top Scorers
        </button>
      </div>

      <div className="snake-wireframe-container">
        {/* LEFT/MAIN: Reaction Click Area (Replaces the canvas board) */}
        <div
          className="snake-wireframe-board"
          onClick={handleClick}
          style={{
            backgroundColor: getBackgroundColor(),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none",
            textAlign: "center",
            padding: "20px",
          }}
        >
          {gameState === "waiting" && (
            <h2 style={{ color: "#fff" }}>Tap / Click to Start</h2>
          )}
          {gameState === "ready" && (
            <h2 style={{ color: "#fff" }}>Wait for Green...</h2>
          )}
          {gameState === "clicked" && (
            <h1 style={{ color: "#000", fontSize: "2.5rem" }}>TAP NOW!</h1>
          )}
          {gameState === "result" && (
            <>
              <h2 style={{ color: "var(--arcade-green)", fontSize: "2rem" }}>
                {reactionTime} ms
              </h2>
              <p style={{ color: "var(--arcade-text-dim)", marginTop: "10px" }}>
                Click to try again
              </p>
            </>
          )}
        </div>

        {/* RIGHT/MIDDLE: Stats & Controls (Desktop) */}
        <div className="snake-wireframe-controls desktop-only">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Status <span>{gameState.toUpperCase()}</span>
            </div>
            <div className="snake-stat-row">
              Result <span>{reactionTime ? `${reactionTime}ms` : "-"}</span>
            </div>
            <div className="snake-stat-row">
              Best <span>{bestTime ? `${bestTime}ms` : "-"}</span>
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
              onClick={startGame}
              style={{ backgroundColor: "var(--arcade-green)", color: "#000" }}
            >
              Start Test
            </button>
          </div>
        </div>

        {/* MOBILE CONTROLS (Hidden on Desktop) */}
        <div className="arcade-mobile-controls mobile-only">
          <div className="arcade-mobile-actions" style={{ width: "100%" }}>
            <button
              className="snake-action-btn"
              onClick={startGame}
              style={{
                backgroundColor: "var(--arcade-green)",
                color: "#000",
                width: "100%",
              }}
            >
              Start Test / Reset
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Top Scorers Modal */}
      <ScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leaderboard={leaderboard}
      />
    </div>
  );
}
