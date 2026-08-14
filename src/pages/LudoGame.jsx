import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Users, Dices } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("https://api.ohsheet.blog");

const COLORS = ["#ef5350", "#4caf50", "#ffca28", "#42a5f5"];
const COLOR_SOFT = ["#ef535033", "#4caf5033", "#ffca2833", "#42a5f533"];
const NAMES = ["Red", "Green", "Yellow", "Blue"];
const TRACK_LENGTH = 52;
const TOTAL_STEPS = 58;
const START_OFFSETS = [0, 13, 26, 39];
const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

const TRACK_COORDS = [
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],
  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6],
  [1, 6],
  [0, 6],
  [0, 7],
  [0, 8],
  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [6, 13],
  [6, 14],
  [7, 14],
  [8, 14],
  [8, 13],
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  [14, 8],
  [14, 7],
  [14, 6],
  [13, 6],
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6],
  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2],
  [8, 1],
  [8, 0],
  [7, 0],
  [6, 0],
];

const HOME_STRETCH_COORDS = [
  [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6],
  ],
  [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
    [6, 7],
  ],
  [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
    [7, 8],
  ],
  [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
    [8, 7],
  ],
];

const YARD_COORDS = [
  [
    [1.7, 1.7],
    [1.7, 3.3],
    [3.3, 1.7],
    [3.3, 3.3],
  ],
  [
    [1.7, 10.7],
    [1.7, 12.3],
    [3.3, 10.7],
    [3.3, 12.3],
  ],
  [
    [10.7, 10.7],
    [10.7, 12.3],
    [12.3, 10.7],
    [12.3, 12.3],
  ],
  [
    [10.7, 1.7],
    [10.7, 3.3],
    [12.3, 1.7],
    [12.3, 3.3],
  ],
];

function tokenCoord(seat, step) {
  if (step === TOTAL_STEPS - 1) return [7, 7];
  if (step >= TRACK_LENGTH - 1) {
    const idx = step - (TRACK_LENGTH - 1);
    return HOME_STRETCH_COORDS[seat][idx];
  }
  const absIdx = (START_OFFSETS[seat] + step) % TRACK_LENGTH;
  return TRACK_COORDS[absIdx];
}

const trackCellSet = new Set(TRACK_COORDS.map(([r, c]) => `${r},${c}`));
const safeCellSet = new Set(
  SAFE_SQUARES.map((idx) => TRACK_COORDS[idx].join(",")),
);

export default function LudoGame() {
  const navigate = useNavigate();

  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [mySeat, setMySeat] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);

  const [started, setStarted] = useState(false);
  const [tokens, setTokens] = useState([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [turn, setTurn] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [currentRoll, setCurrentRoll] = useState(null);
  const [lastEvent, setLastEvent] = useState("");
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState("");
  const [disconnected, setDisconnected] = useState(false);

  const roomRef = useRef("");

  useEffect(() => {
    socket.on("ludo_player_assigned", ({ seat, playerCount }) => {
      setMySeat(seat);
      setPlayerCount(playerCount);
      setJoined(true);
    });
    socket.on("ludo_lobby_update", ({ playerCount }) =>
      setPlayerCount(playerCount),
    );
    socket.on("ludo_room_full", () =>
      setMessage("Room full or already started."),
    );
    socket.on("ludo_game_start", ({ playerCount }) => {
      setPlayerCount(playerCount);
      setStarted(true);
      setTokens([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      setTurn(0);
      setWinner(null);
    });
    socket.on(
      "ludo_roll_result",
      ({ seat, roll, noMove, nextTurn, tokens }) => {
        setRolling(false);
        setTokens(tokens);
        setTurn(nextTurn);
        if (noMove) {
          setCurrentRoll(null);
          setLastEvent(`${NAMES[seat]} rolled ${roll} — no legal move.`);
        } else {
          setCurrentRoll(roll);
          setLastEvent(`${NAMES[seat]} rolled a ${roll}.`);
        }
      },
    );
    socket.on(
      "ludo_move_applied",
      ({ seat, tokens, captured, nextTurn, extraTurn, winner }) => {
        setTokens(tokens);
        setTurn(nextTurn);
        setCurrentRoll(null);
        if (captured)
          setLastEvent(
            `${NAMES[seat]} captured ${NAMES[captured.seat]}'s token!`,
          );
        else if (extraTurn) setLastEvent(`${NAMES[seat]} gets another turn!`);
        else setLastEvent("");
        if (winner !== null && winner !== undefined) setWinner(winner);
      },
    );
    socket.on("ludo_rematch_start", () => {
      setTokens([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
      setWinner(null);
      setTurn(0);
      setCurrentRoll(null);
      setLastEvent("");
    });
    socket.on("ludo_opponent_disconnected", () => setDisconnected(true));

    return () => {
      socket.off("ludo_player_assigned");
      socket.off("ludo_lobby_update");
      socket.off("ludo_room_full");
      socket.off("ludo_game_start");
      socket.off("ludo_roll_result");
      socket.off("ludo_move_applied");
      socket.off("ludo_rematch_start");
      socket.off("ludo_opponent_disconnected");
    };
  }, []);

  const joinRoom = () => {
    if (room.trim()) {
      roomRef.current = room.trim();
      socket.emit("ludo_join_room", room.trim());
    }
  };
  const startGame = () => socket.emit("ludo_start_game", roomRef.current);
  const rollDice = () => {
    if (turn !== mySeat || rolling || currentRoll !== null || winner !== null)
      return;
    setRolling(true);
    socket.emit("ludo_roll_dice", roomRef.current);
  };
  const moveToken = (tokenIndex) => {
    if (turn !== mySeat || currentRoll === null) return;
    const step = tokens[mySeat][tokenIndex];
    if (step === 0 && currentRoll !== 6) return; // must roll a 6 to leave the yard
    if (step + currentRoll > TOTAL_STEPS - 1 || step === TOTAL_STEPS - 1)
      return;
    socket.emit("ludo_move_token", { room: roomRef.current, tokenIndex });
  };
  const requestRematch = () => socket.emit("ludo_rematch", roomRef.current);

  if (!joined) {
    return (
      <div style={{ padding: "0" }}>
        <div
          className="arcade-mobile-header mobile-only"
          style={{ display: "flex" }}
        >
          <button
            className="arcade-mobile-back"
            onClick={() => navigate("/arcade")}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>Ludo</div>
        </div>
        <div className="snake-wireframe-container">
          <div
            className="snake-wireframe-board"
            style={{
              padding: "40px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users
              size={64}
              color="var(--arcade-green)"
              style={{ marginBottom: "20px" }}
            />
            <h2 style={{ color: "#fff", marginBottom: "8px" }}>Join a Match</h2>
            <p
              style={{ color: "var(--arcade-text-dim)", marginBottom: "20px" }}
            >
              2-4 players, 4 tokens each
            </p>
            <input
              type="text"
              placeholder="Enter Room Code (e.g. 1234)"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              style={{
                padding: "15px",
                fontSize: "1.2rem",
                borderRadius: "8px",
                border: "2px solid var(--arcade-border)",
                background: "var(--arcade-surface)",
                color: "#fff",
                width: "80%",
                maxWidth: "300px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            />
            <button
              className="snake-action-btn"
              onClick={joinRoom}
              style={{
                backgroundColor: "var(--arcade-green)",
                color: "#000",
                padding: "15px 40px",
                fontSize: "1.2rem",
              }}
            >
              Join Room
            </button>
            {message && (
              <p style={{ color: "var(--arcade-orange)", marginTop: "16px" }}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    const isHost = mySeat === 0;
    return (
      <div style={{ padding: "0" }}>
        <div
          className="arcade-mobile-header mobile-only"
          style={{ display: "flex" }}
        >
          <button
            className="arcade-mobile-back"
            onClick={() => {
              socket.disconnect();
              navigate("/arcade");
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>Lobby</div>
        </div>
        <div className="snake-wireframe-container">
          <div
            className="snake-wireframe-board"
            style={{
              padding: "40px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
            }}
          >
            <h2 style={{ color: "#fff" }}>Waiting for players...</h2>
            <p style={{ color: "var(--arcade-text-dim)" }}>
              Room code:{" "}
              <strong style={{ color: "var(--arcade-green)" }}>{room}</strong>
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background:
                      i < playerCount ? COLORS[i] : "var(--arcade-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    color: "#000",
                    opacity: i < playerCount ? 1 : 0.4,
                  }}
                >
                  {i < playerCount ? "" : "?"}
                </div>
              ))}
            </div>
            <p style={{ color: "var(--arcade-text-dim)", fontSize: "0.9rem" }}>
              {playerCount} / 4 joined{" "}
              {mySeat !== null && `— you are ${NAMES[mySeat]}`}
            </p>
            {isHost ? (
              <button
                className="snake-action-btn"
                onClick={startGame}
                disabled={playerCount < 2}
                style={{
                  backgroundColor:
                    playerCount >= 2
                      ? "var(--arcade-green)"
                      : "var(--arcade-border)",
                  color: playerCount >= 2 ? "#000" : "var(--arcade-text-dim)",
                  padding: "15px 40px",
                  fontSize: "1.1rem",
                  cursor: playerCount >= 2 ? "pointer" : "not-allowed",
                }}
              >
                {playerCount >= 2 ? "Start Game" : "Need 2+ players"}
              </button>
            ) : (
              <p style={{ color: "var(--arcade-text-dim)" }}>
                Waiting for the host to start...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const boardCells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const key = `${r},${c}`;
      const isYard =
        (r < 6 && c < 6) ||
        (r < 6 && c > 8) ||
        (r > 8 && c < 6) ||
        (r > 8 && c > 8);
      const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
      const isTrack = trackCellSet.has(key);
      const isSafe = safeCellSet.has(key);

      let yardColor = null;
      if (r < 6 && c < 6) yardColor = COLORS[0];
      else if (r < 6 && c > 8) yardColor = COLORS[1];
      else if (r > 8 && c > 8) yardColor = COLORS[2];
      else if (r > 8 && c < 6) yardColor = COLORS[3];

      let homeStretchColor = null;
      HOME_STRETCH_COORDS.forEach((coords, seat) => {
        if (coords.some(([hr, hc]) => hr === r && hc === c))
          homeStretchColor = COLORS[seat];
      });

      boardCells.push({
        r,
        c,
        isYard,
        isCenter,
        isTrack,
        isSafe,
        yardColor,
        homeStretchColor,
      });
    }
  }

  return (
    <div style={{ padding: "0" }}>
      <div
        className="arcade-mobile-header mobile-only"
        style={{ display: "flex" }}
      >
        <button
          className="arcade-mobile-back"
          onClick={() => {
            socket.disconnect();
            navigate("/arcade");
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          {winner !== null
            ? `${NAMES[winner]} wins!`
            : turn === mySeat
              ? "Your Turn"
              : `${NAMES[turn]}'s Turn`}
        </div>
      </div>

      <div className="snake-wireframe-container">
        <div
          className="snake-wireframe-board"
          style={{
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            width: "100%",
          }}
        >
          {disconnected && (
            <p style={{ color: "var(--arcade-red)" }}>
              A player disconnected. Room closed.
            </p>
          )}

          <div
            style={{
              position: "relative",
              width: "min(100%, 480px, 90vh)",
              aspectRatio: "1 / 1",
              display: "grid",
              gridTemplateColumns: "repeat(15, 1fr)",
              gridTemplateRows: "repeat(15, 1fr)",
              border: "3px solid var(--arcade-border)",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#111",
              margin: "0 auto",
            }}
          >
            {boardCells.map((cell) => {
              let bg = "#1a1a1a";
              if (cell.isYard) bg = "#0d0d0d";
              if (cell.isTrack) bg = "#222";
              if (cell.homeStretchColor) bg = cell.homeStretchColor + "55";
              if (cell.isCenter) bg = "#2a2a2a";

              return (
                <div
                  key={`${cell.r}-${cell.c}`}
                  style={{
                    gridColumn: cell.c + 1,
                    gridRow: cell.r + 1,
                    backgroundColor: bg,
                    border:
                      cell.isTrack || cell.isCenter || cell.homeStretchColor
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {cell.isSafe && (
                    <div
                      style={{
                        width: "40%",
                        height: "40%",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.25)",
                      }}
                    />
                  )}
                  {cell.isYard && cell.yardColor && (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: cell.yardColor + "22",
                      }}
                    />
                  )}
                </div>
              );
            })}

            {[
              { seat: 0, gridRow: "1 / 7", gridCol: "1 / 7" },
              { seat: 1, gridRow: "1 / 7", gridCol: "10 / 16" },
              { seat: 2, gridRow: "10 / 16", gridCol: "10 / 16" },
              { seat: 3, gridRow: "10 / 16", gridCol: "1 / 7" },
            ].map((y) => (
              <div
                key={y.seat}
                style={{
                  gridRow: y.gridRow,
                  gridColumn: y.gridCol,
                  background: COLOR_SOFT[y.seat],
                  border: `2px solid ${COLORS[y.seat]}`,
                  borderRadius: "12px",
                  margin: "3px",
                  zIndex: 0,
                }}
              />
            ))}

            <div
              style={{
                gridRow: "7 / 10",
                gridColumn: "7 / 10",
                background:
                  "conic-gradient(from 0deg, #ef5350 0deg 90deg, #ffca28 90deg 180deg, #42a5f5 180deg 270deg, #4caf50 270deg 360deg)",
                zIndex: 1,
              }}
            />

            {Array.from({ length: playerCount }).map((_, seat) =>
              tokens[seat].map((step, tokenIdx) => {
                const finished = step === TOTAL_STEPS - 1;
                let coord;
                if (step === 0) {
                  coord = YARD_COORDS[seat][tokenIdx];
                } else {
                  coord = tokenCoord(seat, step);
                }
                const [row, col] = coord;
                const topPct = ((row + 0.5) / 15) * 100;
                const leftPct = ((col + 0.5) / 15) * 100;

                const canMove =
                  seat === mySeat &&
                  turn === mySeat &&
                  currentRoll !== null &&
                  (step !== 0 || currentRoll === 6) &&
                  step + currentRoll <= TOTAL_STEPS - 1 &&
                  !finished;

                return (
                  <div
                    key={`${seat}-${tokenIdx}`}
                    onClick={() => canMove && moveToken(tokenIdx)}
                    style={{
                      position: "absolute",
                      top: `${topPct}%`,
                      left: `${leftPct}%`,
                      transform: "translate(-50%, -50%)",
                      width: "6.2%",
                      aspectRatio: "1 / 1",
                      borderRadius: "50%",
                      background: COLORS[seat],
                      border: canMove ? "2px solid #fff" : "2px solid #000",
                      boxShadow: canMove
                        ? `0 0 8px 2px ${COLORS[seat]}`
                        : "0 1px 3px rgba(0,0,0,0.6)",
                      cursor: canMove ? "pointer" : "default",
                      zIndex: 2,
                      transition: "top 0.3s ease, left 0.3s ease",
                    }}
                  />
                );
              }),
            )}
          </div>

          {winner === null ? (
            <>
              {turn === mySeat && currentRoll !== null && (
                <p
                  style={{
                    color: "var(--arcade-green)",
                    fontSize: "0.85rem",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  Tap a glowing token to move it {currentRoll} step
                  {currentRoll > 1 ? "s" : ""}.
                </p>
              )}
              <button
                onClick={rollDice}
                disabled={turn !== mySeat || rolling || currentRoll !== null}
                className="snake-action-btn"
                style={{
                  backgroundColor:
                    turn === mySeat && !rolling && currentRoll === null
                      ? "var(--arcade-green)"
                      : "var(--arcade-border)",
                  color:
                    turn === mySeat && !rolling && currentRoll === null
                      ? "#000"
                      : "var(--arcade-text-dim)",
                  padding: "12px 28px",
                  fontSize: "1.05rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor:
                    turn === mySeat && !rolling && currentRoll === null
                      ? "pointer"
                      : "not-allowed",
                  width: "100%",
                  maxWidth: "300px",
                  justifyContent: "center",
                }}
              >
                <Dices size={20} />
                {rolling
                  ? "Rolling..."
                  : currentRoll !== null
                    ? `Rolled ${currentRoll}`
                    : turn === mySeat
                      ? "Roll Dice"
                      : "Waiting..."}
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <h2 style={{ color: COLORS[winner] }}>
                {NAMES[winner]} {winner === mySeat ? "(You) " : ""}Wins! 🎉
              </h2>
              <button
                className="snake-action-btn"
                onClick={requestRematch}
                style={{
                  backgroundColor: "var(--arcade-green)",
                  color: "#000",
                  padding: "12px 30px",
                  fontSize: "1.1rem",
                  marginTop: "10px",
                }}
              >
                Rematch
              </button>
            </div>
          )}

          {lastEvent && (
            <p
              style={{
                color: "var(--arcade-text-dim)",
                fontSize: "0.82rem",
                margin: 0,
                textAlign: "center",
              }}
            >
              {lastEvent}
            </p>
          )}
        </div>

        <div className="snake-wireframe-controls desktop-only">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Room <span>{room}</span>
            </div>
            <div className="snake-stat-row">
              You <span>{mySeat !== null ? NAMES[mySeat] : "-"}</span>
            </div>
            <div className="snake-stat-row">
              Players <span>{playerCount}/4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
