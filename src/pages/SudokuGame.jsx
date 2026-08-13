import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RotateCw, Delete } from "lucide-react";
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

const generatePuzzle = (emptyCells = 45) => {
  const numMap = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
  let board = BASE_BOARD.map((row) =>
    row.map((val) => ({ val: numMap[val - 1], isFixed: true, userVal: null })),
  );
  let removed = 0;
  while (removed < emptyCells) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (board[r][c].isFixed) {
      board[r][c].isFixed = false;
      removed++;
    }
  }
  return board;
};

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

  const [board, setBoard] = useState(generatePuzzle());
  const [selectedCell, setSelectedCell] = useState(null);
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
      .get("/arcade/sudoku/leaderboard")
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
      if (!bestTime || timer < bestTime) setBestTime(timer);
      try {
        await api.post("/arcade/sudoku/score", { score: timer });
        fetchLeaderboard();
      } catch (err) {
        console.error("Failed to save sudoku score", err);
      }
    }
  };

  const handleCellClick = (r, c) => {
    if (gameState === "playing") setSelectedCell({ r, c });
    // Force mobile keyboard to open!
    setTimeout(() => hiddenInputRef.current?.focus(), 10);
  };

  const resetGame = () => {
    setBoard(generatePuzzle());
    setSelectedCell(null);
    setGameState("playing");
    setTimer(0);
  };

  // --- REUSABLE UI BLOCKS ---
  const mobileKeyboardInput = (
    <input
      ref={hiddenInputRef}
      type="text"
      inputMode="numeric" // Forces numbers on mobile
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
          if (/[1-9]/.test(char)) {
            handleInput(parseInt(char));
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

  const sudokuGrid = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(9, 1fr)",
        gridTemplateRows: "repeat(9, 1fr)",
        width: "100%",
        maxWidth: isMobile ? "400px" : "450px", // Full 450px on PC, responsive on Mobile
        aspectRatio: "1 / 1",
        backgroundColor: "var(--arcade-surface)",
        userSelect: "none",
        boxSizing: "border-box",
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
                fontSize: isMobile ? "clamp(1.2rem, 5vw, 1.5rem)" : "1.8rem", // Proper sizing
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

  const onScreenNumpad = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "8px",
        marginTop: "15px",
        width: "100%",
        maxWidth: isMobile ? "400px" : "450px",
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
              <RotateCw size={16} style={{ marginRight: "6px" }} /> New Puzzle
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
