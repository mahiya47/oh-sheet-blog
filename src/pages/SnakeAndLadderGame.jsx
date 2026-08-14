import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Users, Dices } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("https://api.ohsheet.blog");

const SNAKES = {
  16: 6,
  46: 25,
  49: 11,
  62: 19,
  64: 60,
  74: 53,
  89: 68,
  92: 88,
  95: 75,
  99: 80,
};
const LADDERS = {
  2: 38,
  7: 14,
  8: 31,
  15: 26,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  78: 98,
};

const PLAYER_COLORS = ["#ef5350", "#4caf50", "#ffca28", "#42a5f5"];
const PLAYER_NAMES = ["Red", "Green", "Yellow", "Blue"];

function buildCellOrder() {
  const rows = [];
  for (let r = 9; r >= 0; r--) {
    const rowStart = r * 10 + 1;
    const row = Array.from({ length: 10 }, (_, i) => rowStart + i);
    if ((9 - r) % 2 === 1) row.reverse();
    rows.push(row);
  }
  return rows.flat();
}
const CELL_ORDER = buildCellOrder();

export default function SnakeAndLadderGame() {
  const navigate = useNavigate();

  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [mySeat, setMySeat] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);

  const [started, setStarted] = useState(false);
  const [positions, setPositions] = useState([0, 0, 0, 0]);
  const [turn, setTurn] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState("");
  const [disconnected, setDisconnected] = useState(false);

  const roomRef = useRef("");

  useEffect(() => {
    socket.on("snl_player_assigned", ({ seat, playerCount }) => {
      setMySeat(seat);
      setPlayerCount(playerCount);
      setJoined(true);
    });

    socket.on("snl_lobby_update", ({ playerCount }) => {
      setPlayerCount(playerCount);
    });

    socket.on("snl_room_full", () => {
      setMessage("Room full or already started.");
    });

    socket.on("snl_game_start", ({ playerCount }) => {
      setPlayerCount(playerCount);
      setStarted(true);
      setPositions([0, 0, 0, 0]);
      setTurn(0);
      setWinner(null);
    });

    socket.on(
      "snl_move_result",
      ({ seat, roll, bust, positions, nextTurn, winner }) => {
        setPositions(positions);
        setLastRoll({ seat, roll, bust });
        setRolling(false);
        setTurn(nextTurn);
        if (winner !== null && winner !== undefined) setWinner(winner);
      },
    );

    socket.on("snl_rematch_start", () => {
      setPositions([0, 0, 0, 0]);
      setWinner(null);
      setTurn(0);
      setLastRoll(null);
    });

    socket.on("snl_opponent_disconnected", () => {
      setDisconnected(true);
    });

    return () => {
      socket.off("snl_player_assigned");
      socket.off("snl_lobby_update");
      socket.off("snl_room_full");
      socket.off("snl_game_start");
      socket.off("snl_move_result");
      socket.off("snl_rematch_start");
      socket.off("snl_opponent_disconnected");
    };
  }, []);

  const joinRoom = () => {
    if (room.trim()) {
      roomRef.current = room.trim();
      socket.emit("snl_join_room", room.trim());
    }
  };

  const startGame = () => {
    socket.emit("snl_start_game", roomRef.current);
  };

  const rollDice = () => {
    if (turn !== mySeat || rolling || winner !== null) return;
    setRolling(true);
    socket.emit("snl_roll_dice", roomRef.current);
  };

  const requestRematch = () => {
    socket.emit("snl_rematch", roomRef.current);
  };

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
          <div style={{ flex: 1, textAlign: "center" }}>Snake & Ladder</div>
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
              2-4 players per room
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
                      i < playerCount
                        ? PLAYER_COLORS[i]
                        : "var(--arcade-border)",
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
              {mySeat !== null && `— you are ${PLAYER_NAMES[mySeat]}`}
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
        <div style={{ flex: 1, textAlign: "center", fontWeight: 600 }}>
          {winner !== null
            ? `${PLAYER_NAMES[winner]} wins!`
            : turn === mySeat
              ? "Your Turn"
              : `${PLAYER_NAMES[turn]}'s Turn`}
        </div>
      </div>
      <div
        className="mobile-only"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "14px",
          padding: "6px 0 0",
          fontSize: "0.72rem",
          color: "var(--arcade-text-dim)",
        }}
      >
        <span>
          Room: <strong style={{ color: "#fff" }}>{room}</strong>
        </span>
        <span>
          You:{" "}
          <strong style={{ color: PLAYER_COLORS[mySeat] }}>
            {PLAYER_NAMES[mySeat]}
          </strong>
        </span>
        <span>
          Players:{" "}
          <strong style={{ color: "var(--arcade-green)" }}>
            {playerCount}/4
          </strong>
        </span>
      </div>

      <div
        className="snake-wireframe-container"
        style={{
          minHeight: "calc(100dvh - 160px)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="snake-wireframe-board"
          style={{
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
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
              display: "grid",
              gridTemplateColumns: "repeat(10, 1fr)",
              gridTemplateRows: "repeat(10, 1fr)",
              width: "min(100%, 480px, 90vh)",
              aspectRatio: "1 / 1",
              border: "3px solid #3a2b1a",
              borderRadius: "6px",
              overflow: "hidden",
              boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
              margin: "0 auto",
            }}
          >
            {Array.from({ length: 100 }).map((_, idx) => {
              const cellNumber = CELL_ORDER[idx];
              const isSnakeHead = !!SNAKES[cellNumber];
              const isLadderBase = !!LADDERS[cellNumber];
              const row = Math.floor(idx / 10);
              const checker = (row + idx) % 2 === 0;

              const tokensHere = positions
                .map((pos, seat) => ({ pos, seat }))
                .filter((p) => p.pos === cellNumber && p.seat < playerCount);

              let bg = checker ? "#f0e6d2" : "#e3d5b8";
              if (isSnakeHead) bg = "#f8c9c5";
              if (isLadderBase) bg = "#c9e8c9";

              return (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    border: "1px solid rgba(0,0,0,0.12)",
                    backgroundColor: bg,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    padding: "2px 3px",
                    fontSize: "clamp(0.5rem, 1.6vw, 0.65rem)",
                    fontWeight: 700,
                    color: "#3a2b1a",
                  }}
                >
                  {cellNumber}
                  {isSnakeHead && (
                    <span
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        fontSize: "clamp(0.9rem, 3vw, 1.3rem)",
                      }}
                    >
                      🐍
                    </span>
                  )}
                  {isLadderBase && (
                    <span
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%)",
                        fontSize: "clamp(0.9rem, 3vw, 1.3rem)",
                      }}
                    >
                      🪜
                    </span>
                  )}
                  {tokensHere.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        display: "flex",
                        gap: "1px",
                        flexWrap: "wrap",
                        maxWidth: "80%",
                      }}
                    >
                      {tokensHere.map((t) => (
                        <div
                          key={t.seat}
                          style={{
                            width: "22%",
                            aspectRatio: "1 / 1",
                            minWidth: 7,
                            borderRadius: "50%",
                            backgroundColor: PLAYER_COLORS[t.seat],
                            border: "1px solid #000",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.5)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              justifyContent: "center",
              width: "100%",
              margin: 0,
            }}
          >
            {Array.from({ length: playerCount }).map((_, seat) => (
              <div
                key={seat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: `2px solid ${seat === turn ? PLAYER_COLORS[seat] : "var(--arcade-border)"}`,
                  background: "var(--arcade-surface)",
                  boxShadow:
                    seat === turn ? `0 0 8px ${PLAYER_COLORS[seat]}66` : "none",
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: PLAYER_COLORS[seat],
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: "#fff",
                    fontSize: "0.78rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {PLAYER_NAMES[seat]}
                  {seat === mySeat ? " (You)" : ""}: {positions[seat]}
                </span>
              </div>
            ))}
          </div>

          {winner === null ? (
            <button
              onClick={rollDice}
              disabled={turn !== mySeat || rolling}
              className="snake-action-btn"
              style={{
                backgroundColor:
                  turn === mySeat && !rolling
                    ? "var(--arcade-green)"
                    : "var(--arcade-border)",
                color:
                  turn === mySeat && !rolling
                    ? "#000"
                    : "var(--arcade-text-dim)",
                padding: "12px 28px",
                fontSize: "1.05rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: turn === mySeat && !rolling ? "pointer" : "not-allowed",
                width: "100%",
                maxWidth: "300px",
                justifyContent: "center",
                margin: 0,
              }}
            >
              <Dices size={20} />
              {rolling
                ? "Rolling..."
                : turn === mySeat
                  ? "Roll Dice"
                  : "Waiting..."}
            </button>
          ) : (
            <div style={{ textAlign: "center" }}>
              <h2 style={{ color: PLAYER_COLORS[winner] }}>
                {PLAYER_NAMES[winner]} {winner === mySeat ? "(You) " : ""}Wins!
                🎉
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

          {lastRoll && (
            <p
              style={{
                color: "var(--arcade-text-dim)",
                fontSize: "0.82rem",
                textAlign: "center",
                margin: 0,
              }}
            >
              {PLAYER_NAMES[lastRoll.seat]} rolled a {lastRoll.roll}
              {lastRoll.bust ? " — overshoot, no move!" : ""}
            </p>
          )}
        </div>

        <div className="snake-wireframe-controls desktop-only">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Room <span>{room}</span>
            </div>
            <div className="snake-stat-row">
              You <span>{mySeat !== null ? PLAYER_NAMES[mySeat] : "-"}</span>
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
