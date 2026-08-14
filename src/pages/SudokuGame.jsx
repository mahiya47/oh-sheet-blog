import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Delete, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

const BASE_BOARD = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const EMPTY_CELLS = 45;

// --- Deterministic seeded RNG (mulberry32) so everyone gets the SAME
// puzzle on the same calendar date. Same technique as the daily crossword. ---
function hashStringToInt(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function shuffleSeeded(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateDailyPuzzle(dateKey) {
  const rng = mulberry32(hashStringToInt(dateKey));

  const numMap = shuffleSeeded([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  let board = BASE_BOARD.map((row) =>
    row.map((val) => ({ val: numMap[val - 1], isFixed: true, userVal: null })),
  );

  let removed = 0;
  let guard = 0;
  while (removed < EMPTY_CELLS && guard < 5000) {
    guard++;
    const r = Math.floor(rng() * 9);
    const c = Math.floor(rng() * 9);
    if (board[r][c].isFixed) {
      board[r][c].isFixed = false;
      removed++;
    }
  }
  return board;
}

const validateBoard = (board) => {
  const getVal = (cell) => (cell.isFixed ? cell.val : cell.userVal);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = getVal(board[r][c]);
      if (!val) return false;
      for (let i = 0; i < 9; i++) {
        if (i !== c && getVal(board[r][i]) === val) return false;
        if (i !== r && getVal(board[i][c]) === val) return false;
      }
      const startR = Math.floor(r / 3) * 3;
      const startC = Math.floor(c / 3) * 3;
      for (let i = startR; i < startR + 3; i++) {
        for (let j = startC; j < startC + 3; j++) {
          if ((i !== r || j !== c) && getVal(board[i][j]) === val) return false;
        }
      }
    }
  }
  return true;
};

export default function SudokuGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const dateKey = todayKey();
  const [board, setBoard] = useState(() => generateDailyPuzzle(dateKey));
  const [selectedCell, setSelectedCell] = useState(null);

  const alreadySolvedToday =
    typeof window !== "undefined" &&
    localStorage.getItem("sudoku-solved-date") === dateKey;

  const [gameState, setGameState] = useState(
    alreadySolvedToday ? "won" : "playing",
  );
  const [timer, setTimer] = useState(0);
  const [streak, setStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      .get("/arcade/sudoku/leaderboard")
      .then((res) => {
        if (res.data) {
          const sorted = res.data.sort((a, b) => b.score - a.score); // score = streak, highest first
          setLeaderboard(sorted);
          if (currentUser) {
            const mine = sorted.find(
              (entry) => entry.user?.username === currentUser.username,
            );
            if (mine) setStreak(mine.score);
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
      if (gameState !== "playing" || !selectedCell) return;
      if (document.activeElement === hiddenInputRef.current) return;

      if (e.key >= "1" && e.key <= "9") {
        handleInput(parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleInput(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, gameState, board]);

  const handleInput = async (num) => {
    if (gameState !== "playing" || !selectedCell) return;
    const { r, c } = selectedCell;
    if (board[r][c].isFixed) return;

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    newBoard[r][c].userVal = num;
    setBoard(newBoard);

    if (validateBoard(newBoard)) {
      setGameState("won");
      localStorage.setItem("sudoku-solved-date", dateKey);
      try {
        const res = await api.post("/arcade/sudoku/score", { score: timer });
        if (res.data?.streak != null) setStreak(res.data.streak);
        fetchLeaderboard();
      } catch (err) {
        console.error("Failed to save sudoku streak", err);
      }
    }
  };

  const handleCellClick = (r, c) => {
    if (gameState === "playing") setSelectedCell({ r, c });
    setTimeout(() => hiddenInputRef.current?.focus(), 10);
  };

  const boardMaxWidth = isMobile ? 400 : 450;

  const mobileKeyboardInput = (
    <input
      ref={hiddenInputRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      value=" "
      onChange={(e) => {
        const val = e.target.value;
        if (val === "") {
          handleInput(null);
        } else if (val.length > 1) {
          const char = val.slice(-1);
          if (/[1-9]/.test(char)) handleInput(parseInt(char));
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

  const sudokuGrid = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(9, 1fr)",
        gridTemplateRows: "repeat(9, 1fr)",
        width: "100%",
        maxWidth: boardMaxWidth,
        aspectRatio: "1 / 1",
        backgroundColor: "var(--arcade-surface)",
        userSelect: "none",
        boxSizing: "border-box",
        opacity: gameState === "playing" ? 1 : 0.55,
        pointerEvents: gameState === "playing" ? "auto" : "none",
      }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const isSelected = selectedCell?.r === r && selectedCell?.c === c;
          return (
            <button
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                backgroundColor: isSelected
                  ? "rgba(76, 175, 80, 0.3)"
                  : "transparent",
                borderTop:
                  r % 3 === 0
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border-soft, #333)",
                borderLeft:
                  c % 3 === 0
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border-soft, #333)",
                borderRight: c === 8 ? "2px solid var(--accent)" : "none",
                borderBottom: r === 8 ? "2px solid var(--accent)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? "clamp(1.2rem, 5vw, 1.5rem)" : "1.8rem",
                fontWeight: cell.isFixed ? "900" : "600",
                color: cell.isFixed ? "#fff" : "var(--arcade-orange)",
                cursor: cell.isFixed ? "default" : "pointer",
                padding: 0,
                margin: 0,
                outline: "none",
              }}
            >
              {cell.isFixed ? cell.val : cell.userVal ? cell.userVal : "\u00A0"}
            </button>
          );
        }),
      )}
    </div>
  );

  const onScreenNumpad = gameState === "playing" && (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "8px",
        marginTop: "15px",
        width: "100%",
        maxWidth: boardMaxWidth,
      }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          className="snake-action-btn"
          onClick={() => handleInput(num)}
          style={{ padding: "10px 0", fontSize: "1.2rem", fontWeight: "bold" }}
        >
          {num}
        </button>
      ))}
      <button
        className="snake-action-btn"
        onClick={() => handleInput(null)}
        style={{ padding: "10px 0", backgroundColor: "var(--arcade-border)" }}
      >
        <Delete size={20} style={{ margin: "0 auto" }} />
      </button>
    </div>
  );

  const winOverlay = gameState === "won" && (
    <div className="snake-overlay">
      <h2
        style={{ color: "var(--arcade-green)", textShadow: "2px 2px 0 #000" }}
      >
        {alreadySolvedToday && timer === 0
          ? "Already solved today!"
          : "Puzzle Solved!"}
      </h2>
      <p
        style={{
          color: "#fff",
          marginBottom: "6px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "center",
        }}
      >
        <Flame size={18} color="var(--arcade-orange)" />
        {streak} day streak
      </p>
      <p style={{ color: "var(--arcade-text-dim)", fontSize: "0.85rem" }}>
        Come back tomorrow for a new puzzle.
      </p>
    </div>
  );

  const statsHeader = isMobile ? (
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
        Streak <span>{streak}🔥</span>
      </div>
      <button
        className="arcade-mobile-trophy"
        onClick={() => setIsModalOpen(true)}
      >
        Top Streaks
      </button>
    </div>
  ) : null;

  if (isMobile) {
    return (
      <div style={{ padding: "0" }}>
        {statsHeader}
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
          {sudokuGrid}
          {onScreenNumpad}
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
          {sudokuGrid}
          {onScreenNumpad}
          {winOverlay}
        </div>
        <div className="snake-wireframe-controls desktop-only">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Time <span>{timer}s</span>
            </div>
            <div className="snake-stat-row">
              Streak <span>{streak}🔥</span>
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
