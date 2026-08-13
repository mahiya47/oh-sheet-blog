import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RotateCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

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

export default function CrosswordGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const [grid, setGrid] = useState(Array(5).fill(Array(5).fill("")));
  const [selected, setSelected] = useState({ r: 0, c: 0 });
  const [direction, setDirection] = useState("across");

  const [gameState, setGameState] = useState("playing");
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // COMPLETELY SEPARATE MOBILE AND PC LOGIC
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const timerRef = useRef(null);
  const hiddenInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== "playing") return;
      if (document.activeElement === hiddenInputRef.current) {
        if (
          !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        )
          return;
      }
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
        setSelected((p) => ({ r: Math.min(4, p.r + 1), c: p.c }));
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
      if (direction === "across" && c > 0) setSelected({ r, c: c - 1 });
      if (direction === "down" && r > 0) setSelected({ r: r - 1, c });
    } else {
      newGrid[r][c] = char;
      setGrid(newGrid);
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
    setTimeout(() => hiddenInputRef.current?.focus(), 10);
  };

  const resetGame = () => {
    setGrid(Array(5).fill(Array(5).fill("")));
    setSelected({ r: 0, c: 0 });
    setDirection("across");
    setGameState("playing");
    setTimer(0);
  };

  const getActiveClue = () => {
    if (direction === "across") {
      const startNum = NUMBERS[`${selected.r},0`];
      return `${startNum} Across: ${CLUES.across[startNum]}`;
    } else {
      const startNum = NUMBERS[`0,${selected.c}`];
      return `${startNum} Down: ${CLUES.down[startNum]}`;
    }
  };

  // --- REUSABLE UI BLOCKS ---
  const mobileKeyboardInput = (
    <input
      ref={hiddenInputRef}
      type="text"
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      value=" "
      onChange={(e) => {
        const val = e.target.value;
        if (val === "") {
          handleInput("DEL");
        } else if (val.length > 1) {
          const char = val.slice(-1);
          if (/^[a-zA-Z]$/.test(char)) {
            handleInput(char.toUpperCase());
          }
        }
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "1px",
        height: "1px",
        opacity: 0.01,
      }}
    />
  );

  const activeClueDisplay = (
    <div
      style={{
        width: "100%",
        maxWidth: isMobile ? "400px" : "450px",
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
  );

  const crosswordGrid = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        width: "100%",
        maxWidth: isMobile ? "400px" : "450px", // Full 450px on PC, responsive on Mobile
        aspectRatio: "1 / 1",
        backgroundColor: "#fff",
        border: "3px solid #000",
        userSelect: "none",
        boxSizing: "border-box",
      }}
    >
      {grid.map((row, r) =>
        row.map((letter, c) => {
          const isSelected = selected.r === r && selected.c === c;
          const isWordHighlight =
            direction === "across" ? selected.r === r : selected.c === c;
          const cellNum = NUMBERS[`${r},${c}`];

          return (
            <div
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
                aspectRatio: "1 / 1",
                boxSizing: "border-box",
                fontSize: isMobile ? "clamp(1.5rem, 6vw, 2.2rem)" : "2.8rem",
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
                    lineHeight: 1,
                  }}
                >
                  {cellNum}
                </span>
              )}
              {letter || "\u00A0"}
            </div>
          );
        }),
      )}
    </div>
  );

  const winOverlay = gameState === "won" && (
    <div className="snake-overlay">
      <h2
        style={{ color: "var(--arcade-green)", textShadow: "2px 2px 0 #000" }}
      >
        Puzzle Solved!
      </h2>
      <p style={{ color: "#fff", marginBottom: "15px" }}>Time: {timer}s</p>
      <button className="snake-action-btn" onClick={resetGame}>
        Play Again
      </button>
    </div>
  );

  // --- RENDER SEPARATE LAYOUTS ---
  if (isMobile) {
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

        {/* Strictly Mobile Wrapper: Zero height restrictions, zero clipping */}
        <div
          style={{
            width: "100%",
            padding: "15px",
            paddingBottom: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          {mobileKeyboardInput}
          {activeClueDisplay}
          {crosswordGrid}
          {winOverlay}
        </div>
        <ScoreModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          leaderboard={leaderboard}
        />
      </div>
    );
  }

  // Strictly PC Wrapper: Big, classic arcade box
  return (
    <div style={{ padding: "0" }}>
      <div className="snake-wireframe-container">
        <div
          className="snake-wireframe-board"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          {mobileKeyboardInput}
          {activeClueDisplay}
          {crosswordGrid}
          {winOverlay}
        </div>
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
