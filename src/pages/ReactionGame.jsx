import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

const TOTAL_ROUNDS = 3;
const BETWEEN_ROUND_DELAY = 900; // ms pause showing this round's time before the next starts

export default function ReactionGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  // waiting, ready, clicked, roundResult, finished
  const [gameState, setGameState] = useState("waiting");
  const [round, setRound] = useState(0); // 1-indexed while playing
  const [roundTimes, setRoundTimes] = useState([]);
  const [lastRoundTime, setLastRoundTime] = useState(null);
  const [averageTime, setAverageTime] = useState(null);
  const [bestTime, setBestTime] = useState(null);

  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const timeoutRef = useRef(null);
  const startTimeRef = useRef(0);
  const roundTimesRef = useRef([]);

  const fetchLeaderboardAndBest = useCallback(() => {
    api
      .get("/arcade/reaction/leaderboard")
      .then((res) => {
        if (res.data) {
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

  const armRound = () => {
    setGameState("ready");
    const delay = Math.floor(Math.random() * 3000) + 2000;
    timeoutRef.current = setTimeout(() => {
      setGameState("clicked");
      startTimeRef.current = Date.now();
    }, delay);
  };

  const startSequence = () => {
    roundTimesRef.current = [];
    setRoundTimes([]);
    setAverageTime(null);
    setLastRoundTime(null);
    setRound(1);
    armRound();
  };

  const finishSequence = async (times) => {
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    setAverageTime(avg);
    setGameState("finished");

    if (!bestTime || avg < bestTime) {
      setBestTime(avg);
    }
    try {
      await api.post("/arcade/reaction/score", { score: avg });
      fetchLeaderboardAndBest();
    } catch (err) {
      console.error("Failed to save reaction score:", err);
    }
  };

  const handleClick = async () => {
    if (gameState === "waiting" || gameState === "finished") {
      startSequence();
    } else if (gameState === "ready") {
      clearTimeout(timeoutRef.current);
      alert("Too early! Wait for green. Restarting all 3 rounds.");
      setGameState("waiting");
      setRound(0);
      roundTimesRef.current = [];
      setRoundTimes([]);
    } else if (gameState === "clicked") {
      const timeTaken = Date.now() - startTimeRef.current;
      const updatedTimes = [...roundTimesRef.current, timeTaken];
      roundTimesRef.current = updatedTimes;
      setRoundTimes(updatedTimes);
      setLastRoundTime(timeTaken);

      if (round < TOTAL_ROUNDS) {
        setGameState("roundResult");
        timeoutRef.current = setTimeout(() => {
          setRound((r) => r + 1);
          armRound();
        }, BETWEEN_ROUND_DELAY);
      } else {
        finishSequence(updatedTimes);
      }
    }
  };

  const getLightStyles = () => {
    let color = "#222222";
    let glow = "inset 0 5px 10px rgba(0,0,0,0.8)";

    if (gameState === "ready") {
      color = "#f44336";
      glow =
        "0 0 25px rgba(244, 67, 54, 0.8), inset 0 0 10px rgba(255,255,255,0.4)";
    } else if (gameState === "clicked") {
      color = "#4caf50";
      glow =
        "0 0 25px rgba(76, 175, 80, 0.8), inset 0 0 10px rgba(255,255,255,0.4)";
    } else if (gameState === "roundResult") {
      color = "#4caf50";
      glow = "inset 0 5px 10px rgba(0,0,0,0.8)";
    }

    return { color, glow };
  };

  const { color, glow } = getLightStyles();

  const roundLabel =
    gameState === "waiting"
      ? "Press the button to Start"
      : gameState === "ready"
        ? `Round ${round} of ${TOTAL_ROUNDS} — Wait for Green...`
        : gameState === "clicked"
          ? `Round ${round} of ${TOTAL_ROUNDS} — TAP NOW!`
          : gameState === "roundResult"
            ? `Round ${round}: ${lastRoundTime} ms`
            : null;

  return (
    <div style={{ padding: "0" }}>
      <div className="arcade-mobile-header mobile-only">
        <button
          className="arcade-mobile-back"
          onClick={() => navigate("/arcade")}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          Round <span>{round || "-"}/3</span>
        </div>
        <div>
          Best Avg <span>{bestTime ? `${bestTime}ms` : "-"}</span>
        </div>
        <button
          className="arcade-mobile-trophy"
          onClick={() => setIsModalOpen(true)}
        >
          Top Scorers
        </button>
      </div>

      <div className="snake-wireframe-container">
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
            aspectRatio: "auto",
            minHeight: "450px",
            width: "100%",
          }}
        >
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

          <div
            style={{
              minHeight: "60px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            {roundLabel && gameState !== "finished" && (
              <h2
                style={{
                  color:
                    gameState === "ready"
                      ? "#fff"
                      : gameState === "roundResult"
                        ? "var(--arcade-green)"
                        : "var(--arcade-text-dim)",
                  margin: 0,
                  fontSize: gameState === "waiting" ? "1.2rem" : "1.5rem",
                }}
              >
                {roundLabel}
              </h2>
            )}

            {gameState === "finished" && (
              <>
                <h2
                  style={{
                    color: "var(--arcade-green)",
                    fontSize: "2.2rem",
                    margin: 0,
                  }}
                >
                  Avg: {averageTime} ms
                </h2>
                <p
                  style={{
                    color: "var(--arcade-text-dim)",
                    fontSize: "0.85rem",
                    margin: "4px 0 0",
                  }}
                >
                  {roundTimes.map((t, i) => `R${i + 1}: ${t}ms`).join("  •  ")}
                </p>
              </>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            disabled={gameState === "roundResult"}
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
              cursor: gameState === "roundResult" ? "default" : "pointer",
              opacity: gameState === "roundResult" ? 0.6 : 1,
              boxShadow:
                gameState === "clicked"
                  ? "0 0 40px rgba(76, 175, 80, 0.6)"
                  : "0 8px 15px rgba(0,0,0,0.3)",
              transition: "all 0.1s ease",
            }}
          >
            {gameState === "waiting" && "Start Engine (3 Rounds)"}
            {gameState === "ready" && "Wait..."}
            {gameState === "clicked" && "TAP NOW!"}
            {gameState === "roundResult" && "Next round starting..."}
            {gameState === "finished" && "Run Again"}
          </button>
        </div>

        <div className="snake-wireframe-controls desktop-only">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Round <span>{round || "-"}/3</span>
            </div>
            <div className="snake-stat-row">
              This Run <span>{averageTime ? `${averageTime}ms` : "-"}</span>
            </div>
            <div className="snake-stat-row">
              Best Avg <span>{bestTime ? `${bestTime}ms` : "-"}</span>
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
