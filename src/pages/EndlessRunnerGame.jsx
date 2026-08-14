import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

const LOGICAL_W = 600;
const LOGICAL_H = 220;

const GROUND_Y = LOGICAL_H - 30;
const GRAVITY = 2600;
const JUMP_VELOCITY = -820;
const RUNNER_X = 60;
const RUNNER_SIZE = 34;

const INITIAL_SPEED = 260;
const MAX_SPEED = 620;
const SPEED_RAMP = 8;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function EndlessRunnerGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);

  const [gameState, setGameState] = useState("waiting");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const gameStateRef = useRef("waiting");
  const runnerYRef = useRef(GROUND_Y - RUNNER_SIZE);
  const velYRef = useRef(0);
  const onGroundRef = useRef(true);
  const obstaclesRef = useRef([]);
  const speedRef = useRef(INITIAL_SPEED);
  const elapsedRef = useRef(0);
  const scoreRef = useRef(0);
  const lastTimeRef = useRef(null);
  const rafRef = useRef(null);
  const nextObstacleAtRef = useRef(0.8);
  const groundOffsetRef = useRef(0);

  const fetchLeaderboard = useCallback(() => {
    api
      .get("/arcade/runner/leaderboard")
      .then((res) => {
        if (res.data) {
          const sorted = [...res.data].sort((a, b) => b.score - a.score);
          setLeaderboard(sorted);
          if (currentUser) {
            const mine = sorted.find(
              (e) => e.user?.username === currentUser.username,
            );
            if (mine) {
              setHighScore(mine.score);
              return;
            }
          }
          if (sorted.length > 0) setHighScore(sorted[0].score);
        }
      })
      .catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    const resize = () => {
      if (!wrapperRef.current) return;
      const availW = wrapperRef.current.offsetWidth;
      const s = Math.min(availW / LOGICAL_W, 1);
      setScale(s > 0 ? s : 1);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    grad.addColorStop(0, "#fdf6e3");
    grad.addColorStop(1, "#f4e9c9");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    ctx.strokeStyle = "#3a2b1a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(LOGICAL_W, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = "#c9b876";
    const dashW = 18;
    const gap = 14;
    const offset = groundOffsetRef.current % (dashW + gap);
    for (let x = -offset; x < LOGICAL_W; x += dashW + gap) {
      ctx.fillRect(x, GROUND_Y + 6, dashW, 3);
    }

    obstaclesRef.current.forEach((o) => {
      ctx.fillStyle = "#2e7d32";
      ctx.strokeStyle = "#1b5e20";
      ctx.lineWidth = 2;
      const y = GROUND_Y - o.h;
      roundRect(ctx, o.x, y, o.w, o.h, 4);
      ctx.fill();
      ctx.stroke();
    });

    const y = runnerYRef.current;
    ctx.fillStyle = "#4caf50";
    ctx.strokeStyle = "#2e7d32";
    ctx.lineWidth = 2.5;
    roundRect(ctx, RUNNER_X, y, RUNNER_SIZE, RUNNER_SIZE, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(
      RUNNER_X + RUNNER_SIZE * 0.68,
      y + RUNNER_SIZE * 0.32,
      2.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    if (onGroundRef.current) {
      const legPhase = Math.floor(groundOffsetRef.current / 8) % 2;
      ctx.strokeStyle = "#2e7d32";
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (legPhase === 0) {
        ctx.moveTo(RUNNER_X + 8, y + RUNNER_SIZE);
        ctx.lineTo(RUNNER_X + 4, y + RUNNER_SIZE + 6);
        ctx.moveTo(RUNNER_X + RUNNER_SIZE - 8, y + RUNNER_SIZE);
        ctx.lineTo(RUNNER_X + RUNNER_SIZE - 4, y + RUNNER_SIZE + 4);
      } else {
        ctx.moveTo(RUNNER_X + 8, y + RUNNER_SIZE);
        ctx.lineTo(RUNNER_X + 4, y + RUNNER_SIZE + 4);
        ctx.moveTo(RUNNER_X + RUNNER_SIZE - 8, y + RUNNER_SIZE);
        ctx.lineTo(RUNNER_X + RUNNER_SIZE - 4, y + RUNNER_SIZE + 6);
      }
      ctx.stroke();
    }
  }, []);

  const resetGame = () => {
    runnerYRef.current = GROUND_Y - RUNNER_SIZE;
    velYRef.current = 0;
    onGroundRef.current = true;
    obstaclesRef.current = [];
    speedRef.current = INITIAL_SPEED;
    elapsedRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    lastTimeRef.current = null;
    nextObstacleAtRef.current = 0.9;
    groundOffsetRef.current = 0;
  };

  const endGame = useCallback(
    async (finalScore) => {
      gameStateRef.current = "gameover";
      setGameState("gameover");
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (finalScore > 0) {
        try {
          await api.post("/arcade/runner/score", { score: finalScore });
          fetchLeaderboard();
        } catch (err) {
          console.error("Failed to save runner score", err);
        }
      }
    },
    [fetchLeaderboard],
  );

  const step = useCallback(
    (time) => {
      if (gameStateRef.current !== "playing") return;
      if (lastTimeRef.current === null) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.033);
      lastTimeRef.current = time;

      elapsedRef.current += dt;
      speedRef.current = Math.min(
        MAX_SPEED,
        INITIAL_SPEED + elapsedRef.current * SPEED_RAMP,
      );
      groundOffsetRef.current += speedRef.current * dt;

      scoreRef.current = Math.floor(elapsedRef.current * 12);
      setScore(scoreRef.current);

      velYRef.current += GRAVITY * dt;
      runnerYRef.current += velYRef.current * dt;
      const groundLevel = GROUND_Y - RUNNER_SIZE;
      if (runnerYRef.current >= groundLevel) {
        runnerYRef.current = groundLevel;
        velYRef.current = 0;
        onGroundRef.current = true;
      } else {
        onGroundRef.current = false;
      }

      const obstacles = obstaclesRef.current;
      obstacles.forEach((o) => (o.x -= speedRef.current * dt));
      obstaclesRef.current = obstacles.filter((o) => o.x > -o.w - 5);

      nextObstacleAtRef.current -= dt;
      if (nextObstacleAtRef.current <= 0) {
        const h = 24 + Math.random() * 26;
        const w = 16 + Math.random() * 14;
        obstaclesRef.current.push({ x: LOGICAL_W + 10, w, h });
        const baseGap = Math.max(0.65, 1.35 - elapsedRef.current * 0.01);
        nextObstacleAtRef.current = baseGap + Math.random() * 0.5;
      }

      const runnerBox = {
        x: RUNNER_X + 4,
        y: runnerYRef.current + 4,
        w: RUNNER_SIZE - 8,
        h: RUNNER_SIZE - 8,
      };
      let collided = false;
      for (const o of obstaclesRef.current) {
        const oy = GROUND_Y - o.h;
        const overlapX =
          runnerBox.x < o.x + o.w && runnerBox.x + runnerBox.w > o.x;
        const overlapY =
          runnerBox.y < oy + o.h && runnerBox.y + runnerBox.h > oy;
        if (overlapX && overlapY) {
          collided = true;
          break;
        }
      }

      draw();

      if (collided) {
        endGame(scoreRef.current);
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    },
    [draw, endGame],
  );

  const startGame = () => {
    resetGame();
    gameStateRef.current = "playing";
    setGameState("playing");
    rafRef.current = requestAnimationFrame(step);
  };

  const jump = () => {
    const state = gameStateRef.current;
    if (state === "waiting" || state === "gameover") {
      startGame();
      return;
    }
    if (state === "playing" && onGroundRef.current) {
      velYRef.current = JUMP_VELOCITY;
      onGroundRef.current = false;
    }
  };

  useEffect(() => {
    obstaclesRef.current = [];
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const canvasCssW = LOGICAL_W * scale;
  const canvasCssH = LOGICAL_H * scale;

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
          Score <span>{score}</span>
        </div>
        <div>
          Best <span>{highScore}</span>
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
          ref={wrapperRef}
          className="snake-wireframe-board"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
            aspectRatio: "auto",
            width: "100%",
          }}
        >
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              jump();
            }}
            style={{
              position: "relative",
              width: canvasCssW,
              height: canvasCssH,
              borderRadius: "10px",
              overflow: "hidden",
              border: "3px solid #3a2b1a",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              touchAction: "none",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <canvas
              ref={canvasRef}
              width={LOGICAL_W}
              height={LOGICAL_H}
              style={{ width: "100%", height: "100%", display: "block" }}
            />

            {gameState === "waiting" && (
              <div className="snake-overlay">
                <h2 style={{ color: "#fff", margin: 0 }}>Endless Runner</h2>
                <p
                  style={{
                    color: "var(--arcade-text-dim)",
                    textAlign: "center",
                    maxWidth: 220,
                  }}
                >
                  Tap or press Space to jump over the cacti. Speed increases
                  over time!
                </p>
                <button
                  className="snake-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  style={{
                    backgroundColor: "var(--arcade-green)",
                    color: "#000",
                    padding: "12px 28px",
                  }}
                >
                  Tap to Start
                </button>
              </div>
            )}

            {gameState === "gameover" && (
              <div className="snake-overlay">
                <h2 style={{ color: "#ff5252", margin: 0 }}>Game Over</h2>
                <p
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: "1.3rem",
                    margin: "6px 0",
                  }}
                >
                  Score: {score}
                </p>
                {score >= highScore && score > 0 && (
                  <p
                    style={{
                      color: "var(--arcade-green)",
                      fontSize: "0.85rem",
                    }}
                  >
                    New Best!
                  </p>
                )}
                <button
                  className="snake-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  style={{
                    backgroundColor: "var(--arcade-green)",
                    color: "#000",
                    padding: "12px 28px",
                  }}
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="snake-wireframe-controls desktop-only">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Score <span>{score}</span>
            </div>
            <div className="snake-stat-row">
              Best <span>{highScore}</span>
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
              onClick={jump}
              style={{ backgroundColor: "var(--arcade-green)", color: "#000" }}
            >
              Jump (or press Space)
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
