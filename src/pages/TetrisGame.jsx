import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// --- TETRIS CONSTANTS ---
const COLS = 10;
const ROWS = 20;
const INITIAL_SPEED = 500;

// Tetromino shapes and their colors
const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: "#00f0f0" },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "#0000f0",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "#f0a000",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#f0f000",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "#00f000",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "#a000f0",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "#f00000",
  },
};

const getRandomPiece = () => {
  const keys = Object.keys(TETROMINOES);
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return {
    ...TETROMINOES[randKey],
    pos: {
      x:
        Math.floor(COLS / 2) -
        Math.floor(TETROMINOES[randKey].shape[0].length / 2),
      y: 0,
    },
  };
};

const createEmptyBoard = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(null));

export default function TetrisGame() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  // Fetch Leaderboard
  const fetchLeaderboard = useCallback(() => {
    api
      .get("/arcade/tetris/leaderboard")
      .then((res) => setLeaderboard(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => fetchLeaderboard(), [fetchLeaderboard]);

  // Collision Detection
  const checkCollision = (piece, newPos) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = newPos.y + y;
          const boardX = newPos.x + x;
          if (
            boardX < 0 ||
            boardX >= COLS || // Walls
            boardY >= ROWS || // Floor
            (boardY >= 0 && board[boardY][boardX] !== null) // Other pieces
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Movement Logic
  const movePlayer = (dirX, dirY) => {
    if (!isStarted || isGameOver || !currentPiece) return;
    const newPos = {
      x: currentPiece.pos.x + dirX,
      y: currentPiece.pos.y + dirY,
    };

    if (!checkCollision(currentPiece, newPos)) {
      setCurrentPiece((prev) => ({ ...prev, pos: newPos }));
    } else if (dirY > 0) {
      // If moving down and hit something, lock piece
      lockPiece();
    }
  };

  // Rotation Logic
  const rotatePlayer = () => {
    if (!isStarted || isGameOver || !currentPiece) return;

    const rotatedShape = currentPiece.shape[0].map((_, index) =>
      currentPiece.shape.map((row) => row[index]).reverse(),
    );

    const rotatedPiece = { ...currentPiece, shape: rotatedShape };

    if (!checkCollision(rotatedPiece, currentPiece.pos)) {
      setCurrentPiece(rotatedPiece);
    }
  };

  // Lock Piece & Clear Lines
  const lockPiece = useCallback(() => {
    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((row) => [...row]);

      // Add piece to board
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            const boardY = currentPiece.pos.y + y;
            if (boardY >= 0)
              newBoard[boardY][currentPiece.pos.x + x] = currentPiece.color;
          }
        });
      });

      // Clear Lines
      let linesCleared = 0;
      const finalBoard = newBoard.reduce((acc, row) => {
        if (row.every((cell) => cell !== null)) {
          linesCleared += 1;
          acc.unshift(Array(COLS).fill(null)); // Add empty row at top
          return acc;
        }
        acc.push(row);
        return acc;
      }, []);

      if (linesCleared > 0) {
        setScore((prev) => prev + linesCleared * 100); // Simple scoring
      }

      return finalBoard;
    });

    // Spawn new piece or trigger game over
    const nextPiece = getRandomPiece();
    if (checkCollision(nextPiece, nextPiece.pos)) {
      handleGameOver();
    } else {
      setCurrentPiece(nextPiece);
    }
  }, [currentPiece, board]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
        if (!isStarted && !isGameOver) startGame();
      }

      if (!isStarted || isGameOver) return;

      switch (e.key) {
        case "ArrowLeft":
          movePlayer(-1, 0);
          break;
        case "ArrowRight":
          movePlayer(1, 0);
          break;
        case "ArrowDown":
          movePlayer(0, 1);
          break;
        case "ArrowUp":
          rotatePlayer();
          break;
        case " ": // Hard drop
          let dropPos = { ...currentPiece.pos };
          while (
            !checkCollision(currentPiece, { x: dropPos.x, y: dropPos.y + 1 })
          ) {
            dropPos.y += 1;
          }
          setCurrentPiece((prev) => ({ ...prev, pos: dropPos }));
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPiece, isStarted, isGameOver]);

  // Game Loop (Gravity)
  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const interval = setInterval(() => {
      movePlayer(0, 1);
    }, INITIAL_SPEED);

    return () => clearInterval(interval);
  }, [currentPiece, isStarted, isGameOver]);

  const startGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPiece(getRandomPiece());
    setScore(0);
    setIsGameOver(false);
    setIsStarted(true);
  };

  const handleGameOver = async () => {
    setIsGameOver(true);
    setIsStarted(false);
    if (score > 0) {
      await api.post("/arcade/tetris/score", { score });
      fetchLeaderboard();
    }
  };

  // Render Helpers
  const renderCell = (x, y) => {
    let color = board[y][x];
    if (currentPiece && !color) {
      const pieceY = y - currentPiece.pos.y;
      const pieceX = x - currentPiece.pos.x;
      if (
        pieceY >= 0 &&
        pieceY < currentPiece.shape.length &&
        pieceX >= 0 &&
        pieceX < currentPiece.shape[pieceY].length &&
        currentPiece.shape[pieceY][pieceX]
      ) {
        color = currentPiece.color;
      }
    }
    return (
      <div
        key={`${x}-${y}`}
        className="tetris-cell"
        style={{ backgroundColor: color || "transparent" }}
      />
    );
  };

  return (
    <div className="feed-col" style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate("/arcade")}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: "1.2rem", margin: 0 }}>Tetris</h1>
        </div>
        <strong style={{ color: "var(--accent)", fontSize: "1.2rem" }}>
          Score: {score}
        </strong>
      </div>

      {/* GAME BOARD */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "300px",
          margin: "0 auto",
          aspectRatio: "1 / 2",
        }}
      >
        <div className="tetris-grid">
          {Array.from({ length: ROWS }).map((_, y) =>
            Array.from({ length: COLS }).map((_, x) => renderCell(x, y)),
          )}
        </div>

        {/* OVERLAYS */}
        {!isStarted && !isGameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.7)",
            }}
          >
            <button className="btn" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}
        {isGameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.8)",
            }}
          >
            <h2 style={{ color: "#f44336", textAlign: "center" }}>
              Game Over!
            </h2>
            <button
              className="btn"
              onClick={startGame}
              style={{ marginTop: 10 }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* MOBILE CONTROLS */}
      <div
        className="d-pad"
        style={{ maxWidth: "300px", margin: "20px auto 0 auto" }}
      >
        <button className="d-pad-btn d-left" onClick={() => movePlayer(-1, 0)}>
          <ArrowLeftIcon />
        </button>
        <button className="d-pad-btn d-right" onClick={() => movePlayer(1, 0)}>
          <ArrowRight />
        </button>
        <button className="d-pad-btn d-down" onClick={() => movePlayer(0, 1)}>
          <ArrowDown />
        </button>
        <button className="d-pad-btn rotate-btn" onClick={rotatePlayer}>
          <RotateCw size={20} /> Rotate
        </button>
      </div>

      {/* LEADERBOARD */}
      <div
        style={{
          marginTop: "30px",
          backgroundColor: "var(--surface)",
          padding: "20px",
          borderRadius: "12px",
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
          <Trophy size={20} /> Top 10 Tetris Players
        </h3>
        {leaderboard.length === 0 ? (
          <p>No scores yet.</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "8px",
                }}
              >
                <span>
                  #{index + 1} {entry.user.username}
                </span>
                <strong style={{ color: "var(--accent)" }}>
                  {entry.score} pts
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
