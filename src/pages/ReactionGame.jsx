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

  // --- F1 LIGHT RIG STYLES ---
  const getLightStyles = () => {
    let color = "#222222"; // Off (Dim Grey)
    let glow = "inset 0 5px 10px rgba(0,0,0,0.8)";

    if (gameState === "ready") {
      color = "#f44336"; // Red
      glow =
        "0 0 25px rgba(244, 67, 54, 0.8), inset 0 0 10px rgba(255,255,255,0.4)";
    } else if (gameState === "clicked") {
      color = "#4caf50"; // Green
      glow =
        "0 0 25px rgba(76, 175, 80, 0.8), inset 0 0 10px rgba(255,255,255,0.4)";
    }

    return { color, glow };
  };

  const { color, glow } = getLightStyles();

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
        {/* LEFT/MAIN: Reaction Click Area */}
        <div
          className="snake-wireframe-board"
          style={{
            backgroundColor: "var(--arcade-surface-2, #1a1a1a)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            textAlign: "center",
            padding: "40px 20px",
            gap: "30px",
            aspectRatio: "auto", // Overrides the square box to make it wider
            minHeight: "450px", // Gives it a nice vertical stretch
            width: "100%", // Stretches it fully
          }}
        >
          {/* --- THE F1 LIGHT RIG --- */}
          <div
            style={{
              display: "flex",
              gap: "clamp(10px, 3vw, 20px)",
              backgroundColor: "#0a0a0a",
              padding: "clamp(15px, 3vw, 25px)",
              borderRadius: "50px",
              border: "3px solid #333",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            }}
          >
            {[1, 2, 3].map((lightIndex) => (
              <div
                key={lightIndex}
                style={{
                  width: "clamp(50px, 12vw, 80px)",
                  height: "clamp(50px, 12vw, 80px)",
                  borderRadius: "50%",
                  backgroundColor: color,
                  boxShadow: glow,
                  border: "2px solid #000",
                  transition: "background-color 0.1s, box-shadow 0.1s",
                }}
              />
            ))}
          </div>

          {/* --- INSTRUCTIONS / RESULTS --- */}
          <div
            style={{
              height: "60px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {gameState === "waiting" && (
              <h2 style={{ color: "var(--arcade-text-dim)", margin: 0 }}>
                Press the button to Start
              </h2>
            )}
            {gameState === "ready" && (
              <h2 style={{ color: "#fff", margin: 0 }}>Wait for Green...</h2>
            )}
            {gameState === "result" && (
              <>
                <h2
                  style={{
                    color: "var(--arcade-green)",
                    fontSize: "2.5rem",
                    margin: 0,
                  }}
                >
                  {reactionTime} ms
                </h2>
              </>
            )}
          </div>

          {/* --- NEW HUGE ACTION BUTTON --- */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            style={{
              marginTop: "10px",
              padding: "20px 40px",
              width: "80%",
              maxWidth: "400px",
              fontSize: "1.5rem",
              fontWeight: "900",
              letterSpacing: "2px",
              textTransform: "uppercase",
              backgroundColor:
                gameState === "clicked"
                  ? "var(--arcade-green)"
                  : "var(--arcade-surface)",
              color: gameState === "clicked" ? "#000" : "#fff",
              border: `4px solid ${gameState === "clicked" ? "var(--arcade-green)" : "var(--arcade-border)"}`,
              borderRadius: "16px",
              cursor: "pointer",
              boxShadow:
                gameState === "clicked"
                  ? "0 0 40px rgba(76, 175, 80, 0.6)"
                  : "0 8px 15px rgba(0,0,0,0.3)",
              transition: "all 0.1s ease",
            }}
          >
            {gameState === "waiting" && "Start Engine"}
            {gameState === "ready" && "Wait..."}
            {gameState === "clicked" && "TAP NOW!"}
            {gameState === "result" && "Try Again"}
          </button>
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
