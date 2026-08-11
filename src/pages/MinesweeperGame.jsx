import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Trophy, Flag, Bomb, RotateCw, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

const BOARD_SIZE = 9; // 9x9 Grid
const TOTAL_MINES = 10;

// Color coding for neighbor numbers
const NUMBER_COLORS = [
  "",
  "#2196f3", // 1: Blue
  "#4caf50", // 2: Green
  "#f44336", // 3: Red
  "#9c27b0", // 4: Purple
  "#ff9800", // 5: Orange
  "#00bcd4", // 6: Teal
  "#e91e63", // 7: Pink
  "#ffffff", // 8: White
];

const createEmptyBoard = () =>
  Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      hasMine: false,
      revealed: false,
      flagged: false,
      count: 0,
    })),
  );

export default function MinesweeperGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const [board, setBoard] = useState(createEmptyBoard());
  const [gameState, setGameState] = useState("idle"); // idle, playing, won, lost
  const [flagMode, setFlagMode] = useState(false); // Mobile dig vs flag toggle
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState(null);

  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const timerRef = useRef(null);

  // --- FETCH LEADERBOARD & BEST TIME ---
  const fetchLeaderboardAndBest = useCallback(() => {
    api
      .get("/arcade/minesweeper/leaderboard")
      .then((res) => {
        if (res.data) {
          // Lowest time in seconds is best
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
    return () => clearInterval(timerRef.current);
  }, [fetchLeaderboardAndBest]);

  // --- TIMER EFFECT ---
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // Count placed flags
  const flaggedCount = board.reduce(
    (acc, row) => acc + row.filter((cell) => cell.flagged).length,
    0,
  );
  const minesLeft = TOTAL_MINES - flaggedCount;

  // --- GENERATE MINES AFTER FIRST CLICK (SAFE START) ---
  const initializeMines = (startR, startC) => {
    const newBoard = createEmptyBoard();
    let placed = 0;

    // Place mines randomly excluding initial clicked area
    while (placed < TOTAL_MINES) {
      const r = Math.floor(Math.random() * BOARD_SIZE);
      const c = Math.floor(Math.random() * BOARD_SIZE);

      // Keep starting cell and its adjacent cells mine-free for a good opening
      const isStartArea =
        Math.abs(r - startR) <= 1 && Math.abs(c - startC) <= 1;

      if (!newBoard[r][c].hasMine && !isStartArea) {
        newBoard[r][c].hasMine = true;
        placed++;
      }
    }

    // Calculate neighboring mine counts
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!newBoard[r][c].hasMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (
                nr >= 0 &&
                nr < BOARD_SIZE &&
                nc >= 0 &&
                nc < BOARD_SIZE &&
                newBoard[nr][nc].hasMine
              ) {
                count++;
              }
            }
          }
          newBoard[r][c].count = count;
        }
      }
    }

    return newBoard;
  };

  // --- RECURSIVE REVEAL FOR ZERO-COUNT CELLS ---
  const revealEmptyNeighbors = (grid, startR, startC) => {
    const stack = [[startR, startC]];

    while (stack.length > 0) {
      const [r, c] = stack.pop();

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;

          if (
            nr >= 0 &&
            nr < BOARD_SIZE &&
            nc >= 0 &&
            nc < BOARD_SIZE &&
            !grid[nr][nc].revealed &&
            !grid[nr][nc].flagged
          ) {
            grid[nr][nc].revealed = true;
            if (grid[nr][nc].count === 0 && !grid[nr][nc].hasMine) {
              stack.push([nr, nc]);
            }
          }
        }
      }
    }
  };

  // --- CHECK WIN CONDITION ---
  const checkWin = (grid) => {
    let unrevealedSafeCells = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!grid[r][c].hasMine && !grid[r][c].revealed) {
          unrevealedSafeCells++;
        }
      }
    }
    return unrevealedSafeCells === 0;
  };

  // --- CELL CLICK HANDLER ---
  const handleCellClick = async (r, c) => {
    if (gameState === "won" || gameState === "lost") return;

    let currentGrid = board;

    // Start Game on First Click
    if (gameState === "idle") {
      currentGrid = initializeMines(r, c);
      setGameState("playing");
    }

    const cell = currentGrid[r][c];

    // FLAG MODE ACTIVE
    if (flagMode) {
      if (!cell.revealed) {
        const updated = currentGrid.map((rowArr, rowIdx) =>
          rowArr.map((colCell, colIdx) => {
            if (rowIdx === r && colIdx === c) {
              return { ...colCell, flagged: !colCell.flagged };
            }
            return colCell;
          }),
        );
        setBoard(updated);
      }
      return;
    }

    // DIG MODE ACTIVE
    if (cell.flagged || cell.revealed) return;

    const nextGrid = currentGrid.map((row) => row.map((item) => ({ ...item })));

    // HIT A MINE!
    if (nextGrid[r][c].hasMine) {
      // Reveal all mines
      for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
          if (nextGrid[i][j].hasMine) nextGrid[i][j].revealed = true;
        }
      }
      setBoard(nextGrid);
      setGameState("lost");
      return;
    }

    // REVEAL SAFE CELL
    nextGrid[r][c].revealed = true;

    if (nextGrid[r][c].count === 0) {
      revealEmptyNeighbors(nextGrid, r, c);
    }

    setBoard(nextGrid);

    // CHECK WIN
    if (checkWin(nextGrid)) {
      setGameState("won");
      const finalTime = timer;

      if (!bestTime || finalTime < bestTime) {
        setBestTime(finalTime);
      }

      try {
        await api.post("/arcade/minesweeper/score", { score: finalTime });
        fetchLeaderboardAndBest();
      } catch (err) {
        console.error("Failed to save minesweeper score:", err);
      }
    }
  };

  // Right click toggles flag on desktop
  const handleContextMenu = (e, r, c) => {
    e.preventDefault();
    if (gameState === "won" || gameState === "lost" || board[r][c].revealed)
      return;

    const updated = board.map((rowArr, rowIdx) =>
      rowArr.map((colCell, colIdx) => {
        if (rowIdx === r && colIdx === c) {
          return { ...colCell, flagged: !colCell.flagged };
        }
        return colCell;
      }),
    );
    setBoard(updated);
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setGameState("idle");
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
          Mines <span>{minesLeft}</span>
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
            display: "grid",
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
            aspectRatio: "1 / 1",
            gap: "2px",
            padding: "4px",
            backgroundColor: "var(--arcade-border, #333)",
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleContextMenu(e, r, c)}
                  style={{
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    fontSize: "clamp(0.8rem, 2.5vw, 1.2rem)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    userSelect: "none",
                    backgroundColor: cell.revealed
                      ? cell.hasMine
                        ? "#f44336"
                        : "var(--arcade-surface-2, #1a1a1a)"
                      : "var(--arcade-surface, #2c2c2c)",
                    boxShadow: !cell.revealed
                      ? "inset 1px 1px 0 rgba(255,255,255,0.2), inset -1px -1px 0 rgba(0,0,0,0.5)"
                      : "none",
                  }}
                >
                  {cell.revealed ? (
                    cell.hasMine ? (
                      <Bomb size={18} color="#fff" />
                    ) : cell.count > 0 ? (
                      <span style={{ color: NUMBER_COLORS[cell.count] }}>
                        {cell.count}
                      </span>
                    ) : null
                  ) : cell.flagged ? (
                    <Flag size={16} color="var(--arcade-orange, #ff9800)" />
                  ) : null}
                </button>
              );
            }),
          )}

          {/* OVERLAYS FOR WIN / LOSS */}
          {gameState === "won" && (
            <div className="snake-overlay">
              <h2 style={{ color: "var(--arcade-green)" }}>You Win!</h2>
              <p style={{ color: "#fff", marginBottom: "15px" }}>
                Time: {timer}s
              </p>
              <button className="snake-action-btn" onClick={resetGame}>
                Play Again
              </button>
            </div>
          )}

          {gameState === "lost" && (
            <div className="snake-overlay">
              <h2>BOOM! Game Over</h2>
              <button
                className="snake-action-btn"
                onClick={resetGame}
                style={{ marginTop: "10px" }}
              >
                Try Again
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
              Mines Left <span>{minesLeft}</span>
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
            {/* DIG / FLAG MODE TOGGLE FOR DESKTOP */}
            <button
              className="snake-action-btn"
              onClick={() => setFlagMode((prev) => !prev)}
              style={{
                backgroundColor: flagMode
                  ? "var(--arcade-orange, #ff9800)"
                  : "var(--arcade-surface)",
                color: flagMode ? "#000" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {flagMode ? <Flag size={18} /> : <Eye size={18} />}
              {flagMode ? "Mode: Flag" : "Mode: Dig"}
            </button>

            <button className="snake-action-btn" onClick={resetGame}>
              <RotateCw size={16} style={{ marginRight: "6px" }} /> Restart
            </button>
          </div>
        </div>

        {/* MOBILE CONTROLS */}
        <div
          className="arcade-mobile-controls mobile-only"
          style={{ width: "100%", marginTop: "15px" }}
        >
          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            <button
              className="snake-action-btn"
              onClick={() => setFlagMode((prev) => !prev)}
              style={{
                flex: 1,
                backgroundColor: flagMode
                  ? "var(--arcade-orange, #ff9800)"
                  : "var(--arcade-surface)",
                color: flagMode ? "#000" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px",
              }}
            >
              {flagMode ? <Flag size={18} /> : <Eye size={18} />}
              {flagMode ? "Mode: Flag" : "Mode: Dig"}
            </button>

            <button
              className="snake-action-btn"
              onClick={resetGame}
              style={{ flex: 1, padding: "12px" }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Top Scorers Modal */}
      <ScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leaderboard={leaderboard}
      />
    </div>
  );
}
