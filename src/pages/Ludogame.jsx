import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Users, Dices } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("https://api.ohsheet.blog");

const COLORS = ["#ef5350", "#4caf50", "#ffca28", "#42a5f5"];
const NAMES = ["Red", "Green", "Yellow", "Blue"];
const TRACK_LENGTH = 52;
const TOTAL_STEPS = 58; // step index 57 = finished
const START_OFFSETS = [0, 13, 26, 39];
const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

function absolutePos(seat, step) {
  if (step >= TRACK_LENGTH - 1) return null; // in home stretch / finished
  return (START_OFFSETS[seat] + step) % TRACK_LENGTH;
}

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
  const [awaitingTokenChoice, setAwaitingTokenChoice] = useState(false);
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

    socket.on("ludo_lobby_update", ({ playerCount }) => {
      setPlayerCount(playerCount);
    });

    socket.on("ludo_room_full", () => {
      setMessage("Room full or already started.");
    });

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
          setAwaitingTokenChoice(false);
          setLastEvent(`${NAMES[seat]} rolled ${roll} — no legal move.`);
        } else {
          setCurrentRoll(roll);
          setAwaitingTokenChoice(seat === mySeat);
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
        setAwaitingTokenChoice(false);
        if (captured) {
          setLastEvent(
            `${NAMES[seat]} captured ${NAMES[captured.seat]}'s token!`,
          );
        } else if (extraTurn) {
          setLastEvent(`${NAMES[seat]} gets another turn!`);
        } else {
          setLastEvent("");
        }
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
      setAwaitingTokenChoice(false);
      setLastEvent("");
    });

    socket.on("ludo_opponent_disconnected", () => {
      setDisconnected(true);
    });

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
  }, [mySeat]);

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
    if (step + currentRoll > TOTAL_STEPS - 1) return; // illegal
    if (step === TOTAL_STEPS - 1) return; // already home
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
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {disconnected && (
            <p style={{ color: "var(--arcade-red)" }}>
              A player disconnected. Room closed.
            </p>
          )}

          {/* Per-color progress tracks with tokens */}
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {Array.from({ length: playerCount }).map((_, seat) => (
              <div key={seat}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      backgroundColor: COLORS[seat],
                      border:
                        seat === turn
                          ? "2px solid #fff"
                          : "2px solid transparent",
                    }}
                  />
                  <span
                    style={{
                      color: "#fff",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    {NAMES[seat]}
                    {seat === mySeat ? " (You)" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {tokens[seat].map((step, tokenIdx) => {
                    const finished = step === TOTAL_STEPS - 1;
                    const inHomeStretch = step >= TRACK_LENGTH - 1 && !finished;
                    const canMove =
                      seat === mySeat &&
                      turn === mySeat &&
                      currentRoll !== null &&
                      step + currentRoll <= TOTAL_STEPS - 1 &&
                      !finished;

                    return (
                      <button
                        key={tokenIdx}
                        onClick={() => canMove && moveToken(tokenIdx)}
                        disabled={!canMove}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: "8px",
                          border: `2px solid ${canMove ? COLORS[seat] : "var(--arcade-border)"}`,
                          background: finished
                            ? "rgba(76,175,80,0.25)"
                            : canMove
                              ? `${COLORS[seat]}22`
                              : "var(--arcade-surface)",
                          color: "#fff",
                          fontSize: "0.7rem",
                          cursor: canMove ? "pointer" : "default",
                          boxShadow: canMove
                            ? `0 0 10px ${COLORS[seat]}66`
                            : "none",
                        }}
                      >
                        {finished
                          ? "🏠"
                          : inHomeStretch
                            ? `H${step - (TRACK_LENGTH - 1)}`
                            : step}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {winner === null ? (
            <>
              {turn === mySeat && currentRoll !== null && (
                <p style={{ color: "var(--arcade-green)", fontSize: "0.9rem" }}>
                  Tap a highlighted token to move it {currentRoll} step
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
                  padding: "14px 32px",
                  fontSize: "1.1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor:
                    turn === mySeat && !rolling && currentRoll === null
                      ? "pointer"
                      : "not-allowed",
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
            <p style={{ color: "var(--arcade-text-dim)", fontSize: "0.85rem" }}>
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
