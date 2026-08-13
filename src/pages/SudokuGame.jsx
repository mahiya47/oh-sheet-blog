import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RotateCw, Delete } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

// A valid, fully solved base board
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

// Randomizes numbers 1-9 to create a brand new valid board every time
const generatePuzzle = (emptyCells = 45) => {
  const numMap = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

  // Map base board to new numbers
  let board = BASE_BOARD.map((row) =>
    row.map((val) => ({ val: numMap[val - 1], isFixed: true, userVal: null })),
  );

  // Remove cells to create the puzzle
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

// Checks if the current board state is perfectly valid and complete
const validateBoard = (board) => {
  const getVal = (cell) => (cell.isFixed ? cell.val : cell.userVal);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = getVal(board[r][c]);
      if (!val) return false; // Incomplete

      // Check row & col
      for (let i = 0; i < 9; i++) {
        if (i !== c && getVal(board[r][i]) === val) return false;
        if (i !== r && getVal(board[i][c]) === val) return false;
      }

      // Check 3x3 block
      const startR = Math.floor(r / 3) * 3;
      const startC = Math.floor(c / 3) * 3;
      for (let i = startR; i < startR + 3; i++) {
        for (let j = startC; j < startC + 3; j++) {
          if ((i !== r || j !== c) && getVal(board[i][j]) === val) return false;
        }
      }
    }
  }
  return true; // Complete and Valid!
};

export default function SudokuGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const [board, setBoard] = useState(generatePuzzle());
  const [selectedCell, setSelectedCell] = useState(null); // { r, c }

  const [gameState, setGameState] = useState("playing"); // playing, won
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const timerRef = useRef(null);

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
  };

  const resetGame = () => {
    setBoard(generatePuzzle());
    setSelectedCell(null);
    setGameState("playing");
    setTimer(0);
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
        {/* GAME BOARD */}
        <div
          className="snake-wireframe-board"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(9, 1fr)",
              gridTemplateRows: "repeat(9, 1fr)",
              width: "100%",
              maxWidth: "450px",
              aspectRatio: "1 / 1",
              backgroundColor: "var(--arcade-surface)",
              border: "3px solid var(--accent)", // Outer thick border
              userSelect: "none",
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isSelected =
                  selectedCell?.r === r && selectedCell?.c === c;

                // Determine Thicker borders for the 3x3 blocks
                const borderRight =
                  c % 3 === 2 && c !== 8
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border-soft)";
                const borderBottom =
                  r % 3 === 2 && r !== 8
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border-soft)";

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    style={{
                      backgroundColor: isSelected
                        ? "rgba(76, 175, 80, 0.2)"
                        : "transparent",
                      border: "none",
                      borderRight,
                      borderBottom,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "clamp(1.2rem, 5vw, 2rem)",
                      fontWeight: cell.isFixed ? "bold" : "500",
                      color: cell.isFixed ? "#fff" : "var(--arcade-orange)",
                      cursor: cell.isFixed ? "default" : "pointer",
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {cell.isFixed ? cell.val : cell.userVal || ""}
                  </button>
                );
              }),
            )}
          </div>

          {/* ON-SCREEN NUMBER PAD */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "10px",
              marginTop: "20px",
              width: "100%",
              maxWidth: "450px",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                className="snake-action-btn"
                onClick={() => handleInput(num)}
                style={{
                  padding: "15px 0",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
              >
                {num}
              </button>
            ))}
            <button
              className="snake-action-btn"
              onClick={() => handleInput(null)}
              style={{
                padding: "15px 0",
                backgroundColor: "var(--arcade-border)",
              }}
            >
              <Delete size={24} style={{ margin: "0 auto" }} />
            </button>
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
                Play Again
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
