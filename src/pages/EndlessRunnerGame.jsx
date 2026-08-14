import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

// --- SIMULATION SPACE (unchanged physics logic from a normal horizontal
// runner — "x" is the obstacle-travel axis, "y" is the jump/dodge axis).
// We only change HOW this gets drawn to the screen. ---
const SIM_W = 600; // obstacle travel axis (maps to physical height on screen)
const SIM_H = 260; // jump/dodge axis (maps to physical width on screen)

const GROUND_Y = SIM_H - 30; // the "wall" the character rests against
const GRAVITY = 2600;
const JUMP_VELOCITY = -820;
const RUNNER_SIM_X = 60; // fixed distance-along-track (small = near top of screen)
const RUNNER_SIZE = 36;

const INITIAL_SPEED = 260;
const MAX_SPEED = 620;
const SPEED_RAMP = 8;

const OBSTACLE_TYPES = ["cactus", "rock", "bush", "tree"];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawObstacle(ctx, o) {
  const baseY = GROUND_Y;
  switch (o.type) {
    case "cactus": {
      const y = baseY - o.h;
      ctx.fillStyle = "#2e7d32";
      ctx.strokeStyle = "#1b5e20";
      ctx.lineWidth = 2;
      roundRect(ctx, o.x, y, o.w, o.h, 4);
      ctx.fill();
      ctx.stroke();
      const armY = y + o.h * 0.3;
      roundRect(ctx, o.x - 6, armY, 6, o.h * 0.35, 3);
      ctx.fill();
      ctx.stroke();
      roundRect(ctx, o.x + o.w, armY + o.h * 0.15, 6, o.h * 0.35, 3);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "rock": {
      const y = baseY - o.h;
      ctx.fillStyle = "#8d8d8d";
      ctx.strokeStyle = "#5c5c5c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(o.x, baseY);
      ctx.lineTo(o.x + o.w * 0.15, y + o.h * 0.3);
      ctx.lineTo(o.x + o.w * 0.5, y);
      ctx.lineTo(o.x + o.w * 0.85, y + o.h * 0.25);
      ctx.lineTo(o.x + o.w, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "bush": {
      ctx.fillStyle = "#388e3c";
      ctx.strokeStyle = "#1b5e20";
      ctx.lineWidth = 2;
      const r1 = o.h * 0.5;
      [0.25, 0.55, 0.85].forEach((frac, i) => {
        const cx = o.x + o.w * frac;
        const cy = baseY - r1 * (i === 1 ? 1.15 : 0.9);
        ctx.beginPath();
        ctx.arc(cx, cy, r1 * (i === 1 ? 1.05 : 0.85), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      break;
    }
    case "tree": {
      const trunkW = o.w * 0.22;
      const trunkH = o.h * 0.35;
      ctx.fillStyle = "#6d4c25";
      ctx.strokeStyle = "#4a3319";
      ctx.lineWidth = 2;
      roundRect(
        ctx,
        o.x + (o.w - trunkW) / 2,
        baseY - trunkH,
        trunkW,
        trunkH,
        2,
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#2e7d32";
      const topY = baseY - trunkH;
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2, topY - o.h);
      ctx.lineTo(o.x, topY - o.h * 0.35);
      ctx.lineTo(o.x + o.w, topY - o.h * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2, topY - o.h * 0.6);
      ctx.lineTo(o.x + o.w * 0.05, topY);
      ctx.lineTo(o.x + o.w * 0.95, topY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    default:
      break;
  }
}

function drawRunner(ctx, y, legPhase, onGround) {
  const cx = RUNNER_SIM_X + RUNNER_SIZE / 2;
  const cy = y + RUNNER_SIZE / 2 + RUNNER_SIZE * 0.08;
  const r = RUNNER_SIZE / 2;

  ctx.fillStyle = "#6b6560";
  ctx.strokeStyle = "#3f3b37";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(
    cx - r * 0.5,
    cy - r * 1.05,
    r * 0.3,
    r * 0.5,
    -0.15,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(
    cx + r * 0.5,
    cy - r * 1.05,
    r * 0.3,
    r * 0.5,
    0.15,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3f3b37";
  ctx.beginPath();
  ctx.ellipse(
    cx - r * 0.5,
    cy - r * 1.0,
    r * 0.14,
    r * 0.28,
    -0.15,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    cx + r * 0.5,
    cy - r * 1.0,
    r * 0.14,
    r * 0.28,
    0.15,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.fillStyle = "#8f8880";
  ctx.strokeStyle = "#3f3b37";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 1.05, r * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#efe6d2";
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.25, r * 0.62, r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#c9bda0";
  ctx.lineWidth = 1.4;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * r * 0.32, cy + r * 0.55, r * 0.14, Math.PI, 0);
    ctx.stroke();
  }

  ctx.fillStyle = "#3f3b37";
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        cx + side * r * (0.55 + i * 0.08),
        cy - r * 0.05 + i * r * 0.06,
        1,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.32, cy - r * 0.15, 4, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + r * 0.32, cy - r * 0.15, 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b2b2b";
  ctx.beginPath();
  ctx.arc(cx - r * 0.32, cy - r * 0.1, 2.6, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.32, cy - r * 0.1, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3f3b37";
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.1, 2.4, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (onGround) {
    ctx.fillStyle = "#57534e";
    const footY = cy + r * 1.05;
    if (legPhase === 0) {
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.4, footY, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.35, footY + 2, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.35, footY + 2, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.4, footY, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default function EndlessRunnerGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false,
  );

  // Desktop: classic landscape strip (obstacles move left, jump = up).
  // Mobile: rotated portrait (obstacles rise up, jump = sideways).
  const physW = isMobile ? SIM_H : SIM_W;
  const physH = isMobile ? SIM_W : SIM_H;

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
  const trackOffsetRef = useRef(0);

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
      setIsMobile(window.innerWidth <= 768);
      if (!wrapperRef.current) return;
      const availW = wrapperRef.current.offsetWidth;
      const mobile = window.innerWidth <= 768;
      const availH = mobile
        ? Math.min(window.innerHeight - 230, 780)
        : Math.min(window.innerHeight * 0.72, 560);
      const w = mobile ? SIM_H : SIM_W;
      const h = mobile ? SIM_W : SIM_H;
      const s = Math.min(availW / w, availH / h);
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

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, physW, physH);

    const grad = ctx.createLinearGradient(0, 0, 0, physH);
    grad.addColorStop(0, "#fdf6e3");
    grad.addColorStop(1, "#f4e9c9");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, physW, physH);

    if (isMobile) {
      // Wall on the side, dash texture scrolling vertically
      const wallX = GROUND_Y;
      ctx.strokeStyle = "#3a2b1a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wallX, 0);
      ctx.lineTo(wallX, physH);
      ctx.stroke();

      ctx.fillStyle = "#c9b876";
      const dashH = 18;
      const gap = 14;
      const offset = trackOffsetRef.current % (dashH + gap);
      for (let y = -offset; y < physH; y += dashH + gap) {
        ctx.fillRect(wallX + 6, y, 3, dashH);
      }

      // Transpose the simulation onto the screen: obstacle-travel axis (x)
      // becomes vertical, jump axis (y) becomes horizontal.
      ctx.save();
      ctx.transform(0, 1, 1, 0, 0, 0);
      obstaclesRef.current.forEach((o) => drawObstacle(ctx, o));
      const legPhase = Math.floor(trackOffsetRef.current / 8) % 2;
      drawRunner(ctx, runnerYRef.current, legPhase, onGroundRef.current);
      ctx.restore();
    } else {
      // Classic horizontal ground line, dash texture scrolling left
      ctx.strokeStyle = "#3a2b1a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(physW, GROUND_Y);
      ctx.stroke();

      ctx.fillStyle = "#c9b876";
      const dashW = 18;
      const gap = 14;
      const offset = trackOffsetRef.current % (dashW + gap);
      for (let x = -offset; x < physW; x += dashW + gap) {
        ctx.fillRect(x, GROUND_Y + 6, dashW, 3);
      }

      // No transform needed — simulation space already matches physical
      // space directly (obstacles/runner drawn using their normal x,y).
      obstaclesRef.current.forEach((o) => drawObstacle(ctx, o));
      const legPhase = Math.floor(trackOffsetRef.current / 8) % 2;
      drawRunner(ctx, runnerYRef.current, legPhase, onGroundRef.current);
    }
  }, [isMobile, physW, physH]);

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
    trackOffsetRef.current = 0;
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
      trackOffsetRef.current += speedRef.current * dt;

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
      obstaclesRef.current = obstacles.filter((o) => o.x > -o.w - 10);

      nextObstacleAtRef.current -= dt;
      if (nextObstacleAtRef.current <= 0) {
        const type =
          OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
        let w, h;
        switch (type) {
          case "tree":
            w = 34;
            h = 60 + Math.random() * 20;
            break;
          case "bush":
            w = 40;
            h = 22 + Math.random() * 8;
            break;
          case "rock":
            w = 26 + Math.random() * 10;
            h = 20 + Math.random() * 14;
            break;
          default:
            w = 16 + Math.random() * 14;
            h = 24 + Math.random() * 26;
        }
        obstaclesRef.current.push({ x: SIM_W + 10, w, h, type });
        const baseGap = Math.max(0.65, 1.35 - elapsedRef.current * 0.01);
        nextObstacleAtRef.current = baseGap + Math.random() * 0.5;
      }

      const runnerBox = {
        x: RUNNER_SIM_X + 6,
        y: runnerYRef.current + 6,
        w: RUNNER_SIZE - 12,
        h: RUNNER_SIZE - 12,
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
      if (e.code === "Space" || e.key === "ArrowUp" || e.key === "ArrowLeft") {
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

  const canvasCssW = physW * scale;
  const canvasCssH = physH * scale;

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
              width={physW}
              height={physH}
              style={{ width: "100%", height: "100%", display: "block" }}
            />

            {gameState === "waiting" && (
              <div className="snake-overlay">
                <h2 style={{ color: "#fff", margin: 0 }}>Endless Runner</h2>
                <p
                  style={{
                    color: "var(--arcade-text-dim)",
                    textAlign: "center",
                    maxWidth: 200,
                  }}
                >
                  {isMobile
                    ? "Tap or press Space to dodge sideways as obstacles rise up toward you!"
                    : "Tap or press Space to jump over trees, bushes, rocks and cacti!"}
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
