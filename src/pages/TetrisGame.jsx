import { useState, useEffect, useCallback } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight,
  RotateCw,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

const COLS = 16;
const ROWS = 20;
const INITIAL_SPEED = 500;

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
  const { currentUser } = useStore();

  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);

  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- FETCH LEADERBOARD & HIGH SCORE ---
  const fetchLeaderboardAndBest = useCallback(() => {
    api
      .get("/arcade/tetris/leaderboard")
      .then((res) => {
        if (res.data) {
          const sortedData = res.data.sort((a, b) => b.score - a.score);
          setLeaderboard(sortedData);

          if (currentUser) {
            const myBest = sortedData.find(
              (entry) => entry.user?.username === currentUser.username,
            );
            if (myBest) {
              setHighScore(myBest.score);
              return;
            }
          }
          if (sortedData.length > 0) {
            setHighScore(sortedData[0].score);
          }
        }
      })
      .catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    fetchLeaderboardAndBest();
  }, [fetchLeaderboardAndBest]);
  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  const checkCollision = (piece, newPos) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = newPos.y + y;
          const boardX = newPos.x + x;
          if (
            boardX < 0 ||
            boardX >= COLS ||
            boardY >= ROWS ||
            (boardY >= 0 && board[boardY][boardX] !== null)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const movePlayer = (dirX, dirY) => {
    if (!isStarted || isGameOver || isPaused || !currentPiece) return;
    const newPos = {
      x: currentPiece.pos.x + dirX,
      y: currentPiece.pos.y + dirY,
    };

    if (!checkCollision(currentPiece, newPos)) {
      setCurrentPiece((prev) => ({ ...prev, pos: newPos }));
    } else if (dirY > 0) {
      lockPiece();
    }
  };

  const rotatePlayer = () => {
    if (!isStarted || isGameOver || isPaused || !currentPiece) return;
    const rotatedShape = currentPiece.shape[0].map((_, index) =>
      currentPiece.shape.map((row) => row[index]).reverse(),
    );
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };
    if (!checkCollision(rotatedPiece, currentPiece.pos)) {
      setCurrentPiece(rotatedPiece);
    }
  };

  const lockPiece = useCallback(() => {
    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((row) => [...row]);
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            const boardY = currentPiece.pos.y + y;
            if (boardY >= 0)
              newBoard[boardY][currentPiece.pos.x + x] = currentPiece.color;
          }
        });
      });

      let linesCleared = 0;
      const finalBoard = newBoard.reduce((acc, row) => {
        if (row.every((cell) => cell !== null)) {
          linesCleared += 1;
          acc.unshift(Array(COLS).fill(null));
          return acc;
        }
        acc.push(row);
        return acc;
      }, []);

      if (linesCleared > 0) {
        setScore((prev) => prev + linesCleared * 100);
        setLines((prev) => prev + linesCleared);
      }
      return finalBoard;
    });

    const nextPiece = getRandomPiece();
    if (checkCollision(nextPiece, nextPiece.pos)) {
      handleGameOver();
    } else {
      setCurrentPiece(nextPiece);
    }
  }, [currentPiece, board]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
      if (!isStarted || isGameOver || isPaused) return;

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
        case " ":
          let dropPos = { ...currentPiece.pos };
          while (
            !checkCollision(currentPiece, { x: dropPos.x, y: dropPos.y + 1 })
          ) {
            dropPos.y += 1;
          }
          setCurrentPiece((prev) => ({ ...prev, pos: dropPos }));
          break;
        case "p":
        case "Escape":
          setIsPaused((prev) => !prev);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPiece, isStarted, isGameOver, isPaused]);

  useEffect(() => {
    if (!isStarted || isGameOver || isPaused) return;
    const speed = Math.max(100, INITIAL_SPEED - lines * 10);
    const interval = setInterval(() => {
      movePlayer(0, 1);
    }, speed);
    return () => clearInterval(interval);
  }, [currentPiece, isStarted, isGameOver, isPaused, lines]);

  const startGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPiece(getRandomPiece());
    setScore(0);
    setLines(0);
    setIsGameOver(false);
    setIsStarted(true);
    setIsPaused(false);
  };

  const handleGameOver = async () => {
    setIsGameOver(true);
    setIsStarted(false);
    if (score > 0) {
      try {
        await api.post("/arcade/tetris/score", { score });
        fetchLeaderboardAndBest();
      } catch (err) {
        console.error(err);
      }
    }
  };

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
        style={{
          backgroundColor: color || "transparent",
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      />
    );
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
          Score <span>{score}</span>
        </div>
        <div>
          Lines <span>{lines}</span>
        </div>
        <div>
          High <span>{highScore}</span>
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
            aspectRatio: `${COLS} / ${ROWS}`,
            flex: "0 1 440px",
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          }}
        >
          {Array.from({ length: ROWS }).map((_, y) =>
            Array.from({ length: COLS }).map((_, x) => renderCell(x, y)),
          )}

          {!isStarted && !isGameOver && (
            <div className="snake-overlay">
              <button
                className="snake-action-btn"
                onClick={startGame}
                style={{
                  backgroundColor: "var(--accent)",
                  color: "black",
                  padding: "16px 32px",
                }}
              >
                Start Game
              </button>
            </div>
          )}
          {isPaused && !isGameOver && (
            <div className="snake-overlay">
              <h2>Paused</h2>
              <button
                className="snake-action-btn"
                onClick={() => setIsPaused(false)}
              >
                Continue
              </button>
            </div>
          )}
          {isGameOver && (
            <div className="snake-overlay">
              <h2>Game Over</h2>
              <button
                className="snake-action-btn"
                onClick={startGame}
                style={{ marginTop: "10px" }}
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP CONTROLS (Hidden on Mobile) */}
        <div className="snake-wireframe-controls desktop-only">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Score <span>{score}</span>
            </div>
            <div className="snake-stat-row">
              Lines <span>{lines}</span>
            </div>
            <div className="snake-stat-row">
              High Score <span>{highScore}</span>
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
              onClick={() => {
                if (!isStarted) startGame();
                else setIsPaused(false);
              }}
              disabled={isStarted && !isPaused}
            >
              Play
            </button>
            <button
              className="snake-action-btn"
              onClick={() => setIsPaused(true)}
              disabled={!isStarted || isGameOver}
            >
              Pause
            </button>
            <button className="snake-action-btn" onClick={startGame}>
              Restart
            </button>
          </div>
          <div className="d-pad" style={{ marginTop: "10px" }}>
            <button className="d-pad-btn d-up" onClick={rotatePlayer}>
              <RotateCw size={20} />
            </button>
            <button
              className="d-pad-btn d-left"
              onClick={() => movePlayer(-1, 0)}
            >
              <ArrowLeftIcon size={20} />
            </button>
            <button
              className="d-pad-btn d-right"
              onClick={() => movePlayer(1, 0)}
            >
              <ArrowRight size={20} />
            </button>
            <button
              className="d-pad-btn d-down"
              onClick={() => movePlayer(0, 1)}
            >
              <ArrowDown size={20} />
            </button>
          </div>
        </div>

        {/* MOBILE CONTROLS (Hidden on Desktop) */}
        <div className="arcade-mobile-controls mobile-only">
          <div className="arcade-mobile-actions">
            <button
              className="snake-action-btn"
              onClick={() => {
                if (!isStarted) startGame();
                else setIsPaused(false);
              }}
              disabled={isStarted && !isPaused}
            >
              Play
            </button>
            <button
              className="snake-action-btn"
              onClick={() => setIsPaused(true)}
              disabled={!isStarted || isGameOver}
            >
              Pause
            </button>
            <button className="snake-action-btn" onClick={startGame}>
              Restart
            </button>
          </div>
          <div className="d-pad">
            <button className="d-pad-btn d-up" onClick={rotatePlayer}>
              <RotateCw size={20} />
            </button>
            <button
              className="d-pad-btn d-left"
              onClick={() => movePlayer(-1, 0)}
            >
              <ArrowLeftIcon size={20} />
            </button>
            <button
              className="d-pad-btn d-right"
              onClick={() => movePlayer(1, 0)}
            >
              <ArrowRight size={20} />
            </button>
            <button
              className="d-pad-btn d-down"
              onClick={() => movePlayer(0, 1)}
            >
              <ArrowDown size={20} />
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
