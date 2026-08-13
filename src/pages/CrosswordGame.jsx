import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RotateCw, Delete } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

// A perfect symmetric 5x5 Mini Crossword!
const SOLUTION = [
  ["S", "T", "A", "R", "T"],
  ["T", "H", "R", "E", "E"],
  ["A", "R", "G", "U", "E"],
  ["R", "E", "U", "S", "E"],
  ["T", "E", "E", "T", "H"],
];

const NUMBERS = {
  "0,0": 1,
  "0,1": 2,
  "0,2": 3,
  "0,3": 4,
  "0,4": 5,
  "1,0": 6,
  "2,0": 7,
  "3,0": 8,
  "4,0": 9,
};

const CLUES = {
  across: {
    1: "Begin",
    6: "Number after two",
    7: "Debate loudly",
    8: "Recycle",
    9: "What a dentist checks",
  },
  down: {
    1: "Begin",
    2: "Number after two",
    3: "Debate loudly",
    4: "Recycle",
    5: "What a dentist checks",
  },
};

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", "DEL"],
];

export default function CrosswordGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const [grid, setGrid] = useState(Array(5).fill(Array(5).fill("")));
  const [selected, setSelected] = useState({ r: 0, c: 0 });
  const [direction, setDirection] = useState("across"); // 'across' or 'down'

  const [gameState, setGameState] = useState("playing");
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const timerRef = useRef(null);

  const fetchLeaderboard = useCallback(() => {
    api
      .get("/arcade/crossword/leaderboard")
      .then((res) => {
        if (res.data) {
          const sorted = res.data.sort((a, b) => a.score - b.score);
          setLeaderboard(sorted);
          if (currentUser) {
            const myBest = sorted.find(
              (entry) => entry.user?.username === currentUser.username,
            );
            if (myBest) setBestTime(myBest.score);
          }
        }
      })
      .catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setTimer((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // Global Keyboard Listener for Desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== "playing") return;

      if (e.key === "Backspace") {
        handleInput("DEL");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleInput(e.key.toUpperCase());
      } else if (e.key === "ArrowRight") {
        setSelected((p) => ({ r: p.r, c: Math.min(4, p.c + 1) }));
        setDirection("across");
      } else if (e.key === "ArrowLeft") {
        setSelected((p) => ({ r: p.r, c: Math.max(0, p.c - 1) }));
        setDirection("across");
      } else if (e.key === "ArrowDown") {
        setSelected((p) => ({ Math: Math.min(4, p.r + 1), c: p.c }));
        setDirection("down");
      } else if (e.key === "ArrowUp") {
        setSelected((p) => ({ r: Math.max(0, p.r - 1), c: p.c }));
        setDirection("down");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, direction, gameState, grid]);

  const validateGrid = (currentGrid) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (currentGrid[r][c] !== SOLUTION[r][c]) return false;
      }
    }
    return true;
  };

  const handleInput = async (char) => {
    if (gameState !== "playing") return;
    const { r, c } = selected;

    const newGrid = grid.map((row) => [...row]);

    if (char === "DEL") {
      newGrid[r][c] = "";
      setGrid(newGrid);
      // Move backwards
      if (direction === "across" && c > 0) setSelected({ r, c: c - 1 });
      if (direction === "down" && r > 0) setSelected({ r: r - 1, c });
    } else {
      newGrid[r][c] = char;
      setGrid(newGrid);

      // Check Win
      if (validateGrid(newGrid)) {
        setGameState("won");
        if (!bestTime || timer < bestTime) setBestTime(timer);
        try {
          await api.post("/arcade/crossword/score", { score: timer });
          fetchLeaderboard();
        } catch (err) {
          console.error("Failed to save crossword score");
        }
        return;
      }

      // Move forwards
      if (direction === "across" && c < 4) setSelected({ r, c: c + 1 });
      if (direction === "down" && r < 4) setSelected({ r: r + 1, c });
    }
  };

  const handleCellClick = (r, c) => {
    if (selected.r === r && selected.c === c) {
      setDirection((prev) => (prev === "across" ? "down" : "across"));
    } else {
      setSelected({ r, c });
    }
  };

  const resetGame = () => {
    setGrid(Array(5).fill(Array(5).fill("")));
    setSelected({ r: 0, c: 0 });
    setDirection("across");
    setGameState("playing");
    setTimer(0);
  };

  // Determine which clue is active
  const getActiveClue = () => {
    if (direction === "across") {
      const startNum = NUMBERS[`${selected.r},0`];
      return `${startNum} Across: ${CLUES.across[startNum]}`;
    } else {
      const startNum = NUMBERS[`0,${selected.c}`];
      return `${startNum} Down: ${CLUES.down[startNum]}`;
    }
  };

  return (
    <div style={{ padding: "0" }}>
      {/* MOBILE HEADER */}
      <div className="arcade-mobile-header mobile-only">
        <button
          className="arcade-mobile-back"
          onClick={() => navigate("/arcade")}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          Time <span>{timer}s</span>
        </div>
        <div>
          Best <span>{bestTime ? `${bestTime}s` : "-"}</span>
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
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "20px",
          }}
        >
          {/* ACTIVE CLUE DISPLAY */}
          <div
            style={{
              width: "100%",
              maxWidth: "450px",
              backgroundColor: "var(--arcade-surface)",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid var(--arcade-border)",
              textAlign: "center",
              color: "var(--arcade-orange)",
              fontWeight: "bold",
              fontSize: "1.1rem",
            }}
          >
            {getActiveClue()}
          </div>

          {/* CROSSWORD GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              width: "100%",
              maxWidth: "350px",
              aspectRatio: "1 / 1",
              backgroundColor: "#fff",
              border: "3px solid #000",
              userSelect: "none",
            }}
          >
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const isSelected = selected.r === r && selected.c === c;
                const isWordHighlight =
                  direction === "across" ? selected.r === r : selected.c === c;
                const cellNum = NUMBERS[`${r},${c}`];

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    style={{
                      position: "relative",
                      backgroundColor: isSelected
                        ? "#ffeb3b"
                        : isWordHighlight
                          ? "#fff9c4"
                          : "#fff",
                      border: "1px solid #000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "clamp(1.5rem, 6vw, 2.5rem)",
                      fontWeight: "bold",
                      color: "#000",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {cellNum && (
                      <span
                        style={{
                          position: "absolute",
                          top: "2px",
                          left: "4px",
                          fontSize: "0.7rem",
                          fontWeight: "normal",
                        }}
                      >
                        {cellNum}
                      </span>
                    )}
                    {letter}
                  </button>
                );
              }),
            )}
          </div>

          {/* ON-SCREEN QWERTY KEYBOARD (Great for Mobile) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              width: "100%",
              maxWidth: "450px",
              marginTop: "30px",
            }}
          >
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div
                key={rIdx}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleInput(key)}
                    className="snake-action-btn"
                    style={{
                      flex: key === "DEL" ? "1.5" : "1",
                      padding: "12px 0",
                      fontSize: key === "DEL" ? "0.9rem" : "1.1rem",
                      backgroundColor:
                        key === "DEL"
                          ? "var(--arcade-border)"
                          : "var(--arcade-surface)",
                      minWidth: key === "DEL" ? "50px" : "30px",
                    }}
                  >
                    {key === "DEL" ? (
                      <Delete size={20} style={{ margin: "0 auto" }} />
                    ) : (
                      key
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* WIN OVERLAY */}
          {gameState === "won" && (
            <div className="snake-overlay">
              <h2
                style={{
                  color: "var(--arcade-green)",
                  textShadow: "2px 2px 0 #000",
                }}
              >
                Puzzle Solved!
              </h2>
              <p style={{ color: "#fff", marginBottom: "15px" }}>
                Time: {timer}s
              </p>
              <button className="snake-action-btn" onClick={resetGame}>
                Clear Board
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP CONTROLS */}
        <div className="snake-wireframe-controls desktop-only">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Time <span>{timer}s</span>
            </div>
            <div className="snake-stat-row">
              Best Time <span>{bestTime ? `${bestTime}s` : "-"}</span>
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
            <button className="snake-action-btn" onClick={resetGame}>
              <RotateCw size={16} style={{ marginRight: "6px" }} /> Restart
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
