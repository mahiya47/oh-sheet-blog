import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

const LOGICAL_W = 288;
const LOGICAL_H = 512;

const GRAVITY = 1400;
const FLAP_VELOCITY = -420;
const PIPE_SPEED = 130;
const PIPE_GAP = 140;
const PIPE_SPACING = 190;
const PIPE_WIDTH = 54;
const BIRD_X = LOGICAL_W * 0.28;
const BIRD_SIZE = 28;
const GROUND_HEIGHT = 40;

function drawBird(ctx, angle) {
  ctx.save();
  ctx.translate(BIRD_X, 0);
  ctx.rotate(angle);

  ctx.fillStyle = "#2b2b2b";
  ctx.beginPath();
  ctx.moveTo(-BIRD_SIZE * 0.5, BIRD_SIZE * 0.1);
  ctx.lineTo(-BIRD_SIZE * 0.85, -BIRD_SIZE * 0.15);
  ctx.lineTo(-BIRD_SIZE * 0.8, BIRD_SIZE * 0.35);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#242424";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#6b6b6b";
  ctx.beginPath();
  ctx.ellipse(
    0,
    BIRD_SIZE * 0.18,
    BIRD_SIZE * 0.32,
    BIRD_SIZE * 0.28,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.fillStyle = "#242424";
  ctx.beginPath();
  ctx.moveTo(-BIRD_SIZE * 0.08, -BIRD_SIZE * 0.48);
  ctx.lineTo(BIRD_SIZE * 0.05, -BIRD_SIZE * 0.72);
  ctx.lineTo(BIRD_SIZE * 0.18, -BIRD_SIZE * 0.46);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(BIRD_SIZE * 0.02, -BIRD_SIZE * 0.28);
  ctx.lineTo(BIRD_SIZE * 0.28, -BIRD_SIZE * 0.16);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(
    BIRD_SIZE * 0.16,
    -BIRD_SIZE * 0.02,
    BIRD_SIZE * 0.16,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(BIRD_SIZE * 0.19, 0, BIRD_SIZE * 0.07, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff8f00";
  ctx.strokeStyle = "#c66900";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(BIRD_SIZE * 0.34, -BIRD_SIZE * 0.02);
  ctx.lineTo(BIRD_SIZE * 0.75, -BIRD_SIZE * 0.06);
  ctx.lineTo(BIRD_SIZE * 0.75, BIRD_SIZE * 0.14);
  ctx.lineTo(BIRD_SIZE * 0.34, BIRD_SIZE * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#ff8f00";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-BIRD_SIZE * 0.08, BIRD_SIZE * 0.45);
  ctx.lineTo(-BIRD_SIZE * 0.14, BIRD_SIZE * 0.62);
  ctx.moveTo(BIRD_SIZE * 0.1, BIRD_SIZE * 0.46);
  ctx.lineTo(BIRD_SIZE * 0.16, BIRD_SIZE * 0.64);
  ctx.stroke();

  ctx.restore();
}

function drawPipe(ctx, x, topH, bottomY, bottomH) {
  const drawStalk = (px, py, w, h) => {
    const grad = ctx.createLinearGradient(px, 0, px + w, 0);
    grad.addColorStop(0, "#6b8f3a");
    grad.addColorStop(0.5, "#8fbf4f");
    grad.addColorStop(1, "#5a7a30");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#3f5a22";
    ctx.lineWidth = 2;
    ctx.fillRect(px, py, w, h);
    ctx.strokeRect(px, py, w, h);

    ctx.strokeStyle = "#3f5a22";
    ctx.lineWidth = 2;
    const ringGap = 34;
    for (let ry = py + ringGap; ry < py + h; ry += ringGap) {
      ctx.beginPath();
      ctx.moveTo(px, ry);
      ctx.lineTo(px + w, ry);
      ctx.stroke();
    }
  };

  drawStalk(x, 0, PIPE_WIDTH, topH);
  ctx.fillStyle = "#3f7d2f";
  ctx.strokeStyle = "#2a561f";
  ctx.lineWidth = 1.5;
  [-0.15, 0.15, 0].forEach((off, i) => {
    ctx.beginPath();
    ctx.ellipse(
      x + PIPE_WIDTH / 2 + off * PIPE_WIDTH,
      topH - (i === 2 ? 4 : 10),
      PIPE_WIDTH * 0.32,
      10,
      off * 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
  });

  drawStalk(x, bottomY, PIPE_WIDTH, bottomH);
  ctx.fillStyle = "#3f7d2f";
  [-0.15, 0.15, 0].forEach((off, i) => {
    ctx.beginPath();
    ctx.ellipse(
      x + PIPE_WIDTH / 2 + off * PIPE_WIDTH,
      bottomY + (i === 2 ? 4 : 10),
      PIPE_WIDTH * 0.32,
      10,
      off * 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.stroke();
  });
}

export default function FlappyBirdGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false,
  );

  const [gameState, setGameState] = useState("waiting");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const gameStateRef = useRef("waiting");
  const birdYRef = useRef(LOGICAL_H / 2);
  const birdVelRef = useRef(0);
  const pipesRef = useRef([]);
  const scoreRef = useRef(0);
  const lastTimeRef = useRef(null);
  const rafRef = useRef(null);
  const groundOffsetRef = useRef(0);

  const fetchLeaderboard = useCallback(() => {
    api
      .get("/arcade/flappybird/leaderboard")
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
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!wrapperRef.current) return;
      const availW = wrapperRef.current.offsetWidth;
      const availH = mobile
        ? Math.min(window.innerHeight - 230, 780)
        : Math.min(window.innerHeight * 0.72, 620);
      const s = Math.min(availW / LOGICAL_W, availH / LOGICAL_H);
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

    const skyGrad = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    skyGrad.addColorStop(0, "#2e6b3e");
    skyGrad.addColorStop(0.55, "#4d9155");
    skyGrad.addColorStop(1, "#7fbf6a");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    ctx.fillStyle = "rgba(20, 50, 25, 0.35)";
    for (let i = 0; i < 5; i++) {
      const tx =
        (i * 70 - ((groundOffsetRef.current * 0.3) % 70)) % (LOGICAL_W + 60);
      ctx.beginPath();
      ctx.moveTo(tx, LOGICAL_H - GROUND_HEIGHT);
      ctx.lineTo(tx + 18, LOGICAL_H - GROUND_HEIGHT - 60);
      ctx.lineTo(tx + 36, LOGICAL_H - GROUND_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }

    pipesRef.current.forEach((pipe) => {
      const bottomY = pipe.gapY + PIPE_GAP / 2;
      drawPipe(
        ctx,
        pipe.x,
        pipe.gapY - PIPE_GAP / 2,
        bottomY,
        LOGICAL_H - GROUND_HEIGHT - bottomY,
      );
    });

    ctx.fillStyle = "#4a3418";
    ctx.fillRect(0, LOGICAL_H - GROUND_HEIGHT, LOGICAL_W, GROUND_HEIGHT);
    ctx.fillStyle = "#3f7d2f";
    const stripeW = 22;
    const offset = groundOffsetRef.current % stripeW;
    for (let x = -offset; x < LOGICAL_W; x += stripeW) {
      ctx.fillRect(x, LOGICAL_H - GROUND_HEIGHT, stripeW / 2, 5);
    }

    const angle = Math.max(-0.4, Math.min(0.9, birdVelRef.current / 500));
    ctx.save();
    ctx.translate(0, birdYRef.current);
    drawBird(ctx, angle);
    ctx.restore();
  }, []);

  const resetGame = () => {
    birdYRef.current = LOGICAL_H / 2;
    birdVelRef.current = 0;
    pipesRef.current = [
      { x: LOGICAL_W + 60, gapY: LOGICAL_H / 2, passed: false },
    ];
    scoreRef.current = 0;
    setScore(0);
    lastTimeRef.current = null;
    groundOffsetRef.current = 0;
  };

  const endGame = useCallback(
    async (finalScore) => {
      gameStateRef.current = "gameover";
      setGameState("gameover");
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (finalScore > 0) {
        try {
          await api.post("/arcade/flappybird/score", { score: finalScore });
          fetchLeaderboard();
        } catch (err) {
          console.error("Failed to save flappy bird score", err);
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

      birdVelRef.current += GRAVITY * dt;
      birdYRef.current += birdVelRef.current * dt;
      groundOffsetRef.current += PIPE_SPEED * dt;

      const pipes = pipesRef.current;
      pipes.forEach((p) => (p.x -= PIPE_SPEED * dt));
      if (
        pipes.length &&
        pipes[pipes.length - 1].x < LOGICAL_W - PIPE_SPACING
      ) {
        const margin = 70;
        const gapY =
          margin +
          PIPE_GAP / 2 +
          Math.random() * (LOGICAL_H - GROUND_HEIGHT - margin * 2 - PIPE_GAP);
        pipes.push({ x: LOGICAL_W + PIPE_WIDTH, gapY, passed: false });
      }
      pipesRef.current = pipes.filter((p) => p.x > -PIPE_WIDTH - 5);

      pipesRef.current.forEach((p) => {
        if (!p.passed && p.x + PIPE_WIDTH < BIRD_X) {
          p.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }
      });

      const birdTop = birdYRef.current - BIRD_SIZE / 2;
      const birdBottom = birdYRef.current + BIRD_SIZE / 2;
      let collided = false;
      if (birdBottom >= LOGICAL_H - GROUND_HEIGHT || birdTop <= 0) {
        collided = true;
      }
      if (!collided) {
        for (const p of pipesRef.current) {
          const birdLeft = BIRD_X - BIRD_SIZE / 2;
          const birdRight = BIRD_X + BIRD_SIZE / 2;
          const withinX = birdRight > p.x && birdLeft < p.x + PIPE_WIDTH;
          if (withinX) {
            const gapTop = p.gapY - PIPE_GAP / 2;
            const gapBottom = p.gapY + PIPE_GAP / 2;
            if (birdTop < gapTop || birdBottom > gapBottom) {
              collided = true;
              break;
            }
          }
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

  const flap = () => {
    const state = gameStateRef.current;
    if (state === "waiting" || state === "gameover") {
      startGame();
      return;
    }
    if (state === "playing") {
      birdVelRef.current = FLAP_VELOCITY;
    }
  };

  useEffect(() => {
    pipesRef.current = [];
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault();
        flap();
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
              flap();
            }}
            style={{
              position: "relative",
              width: canvasCssW,
              height: canvasCssH,
              borderRadius: "10px",
              overflow: "hidden",
              border: "3px solid #2e561f",
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
                <h2 style={{ color: "#fff", margin: 0 }}>Jungle Flap</h2>
                <p
                  style={{
                    color: "var(--arcade-text-dim)",
                    textAlign: "center",
                    maxWidth: 200,
                  }}
                >
                  Tap or press Space to flap. Dodge the bamboo stalks!
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
              onClick={flap}
              style={{ backgroundColor: "var(--arcade-green)", color: "#000" }}
            >
              Flap (or press Space)
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
