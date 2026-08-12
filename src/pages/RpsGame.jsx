import { useState, useEffect } from "react";
import { ArrowLeft, RotateCw, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useStore } from "../lib/store.jsx";

const socket = io("https://api.ohsheet.blog");

const WEAPONS = {
  ROCK: { name: "Rock", icon: "✊" },
  PAPER: { name: "Paper", icon: "✋" },
  SCISSORS: { name: "Scissors", icon: "✌️" },
};

export default function RpsGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [playerRole, setPlayerRole] = useState(null); // 1 or 2

  const [gameState, setGameState] = useState("waiting"); // waiting, playing, reveal
  const [opponentConnected, setOpponentConnected] = useState(false);

  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);

  const [myChoice, setMyChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [opponentHasPicked, setOpponentHasPicked] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    socket.on("player_assigned", (role) => {
      setPlayerRole(role);
      setJoined(true);
    });

    socket.on("game_start", () => {
      setOpponentConnected(true);
      setGameState("playing");
      setMyChoice(null);
      setOpponentChoice(null);
      setOpponentHasPicked(false);
    });

    socket.on("opponent_moved", () => {
      setOpponentHasPicked(true);
    });

    socket.on("game_result", (data) => {
      setMyChoice(playerRole === 1 ? data.p1Choice : data.p2Choice);
      setOpponentChoice(playerRole === 1 ? data.p2Choice : data.p1Choice);
      setP1Score(data.p1Score);
      setP2Score(data.p2Score);

      if (data.winner === 0) setResultMessage("It's a Tie! 🤝");
      else if (data.winner === playerRole) setResultMessage("You Win! 🎉");
      else setResultMessage("You Lose! 💀");

      setGameState("reveal");
    });

    socket.on("next_round_start", () => {
      setGameState("playing");
      setMyChoice(null);
      setOpponentChoice(null);
      setOpponentHasPicked(false);
      setResultMessage("");
    });

    socket.on("opponent_disconnected", () => {
      setOpponentConnected(false);
      setGameState("waiting");
      setResultMessage("Opponent disconnected.");
    });

    return () => {
      socket.off("player_assigned");
      socket.off("game_start");
      socket.off("opponent_moved");
      socket.off("game_result");
      socket.off("next_round_start");
      socket.off("opponent_disconnected");
    };
  }, [playerRole]);

  const joinRoom = () => {
    if (room.trim()) {
      socket.emit("join_room", room);
    }
  };

  const handleChoice = (weaponKey) => {
    if (gameState === "playing" && !myChoice) {
      setMyChoice(weaponKey);
      socket.emit("play_move", { room, weaponKey });
    }
  };

  const requestNextRound = () => {
    socket.emit("request_next_round", room);
  };

  // --- UI SCREENS ---
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
          <div style={{ flex: 1, textAlign: "center" }}>Multiplayer RPS</div>
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
            <h2 style={{ color: "#fff", marginBottom: "20px" }}>
              Join a Match
            </h2>
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
              Battle!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0" }}>
      {/* MOBILE HEADER */}
      <div
        className="arcade-mobile-header mobile-only"
        style={{ gridTemplateColumns: "40px 1fr 1fr" }}
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
        <div>
          You <span>{playerRole === 1 ? p1Score : p2Score}</span>
        </div>
        <div>
          Enemy <span>{playerRole === 1 ? p2Score : p1Score}</span>
        </div>
      </div>

      <div className="snake-wireframe-container">
        {/* GAME BOARD */}
        <div
          className="snake-wireframe-board"
          style={{
            backgroundColor: "var(--arcade-surface-2, #1a1a1a)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            textAlign: "center",
            padding: "20px",
            gap: "20px",
            aspectRatio: "auto",
            minHeight: "450px",
            width: "100%",
          }}
        >
          {!opponentConnected ? (
            <div style={{ color: "var(--arcade-orange)" }}>
              <div
                className="spinner"
                style={{ fontSize: "3rem", marginBottom: "20px" }}
              >
                ⏳
              </div>
              <h2>Waiting for Player 2...</h2>
              <p>
                Tell your friend to enter code: <strong>{room}</strong>
              </p>
            </div>
          ) : (
            <>
              {/* Status Message */}
              <h2
                style={{
                  color: "var(--arcade-green)",
                  fontSize: "2rem",
                  margin: 0,
                }}
              >
                {gameState === "playing" && !myChoice && "Choose Your Weapon!"}
                {gameState === "playing" &&
                  myChoice &&
                  "Waiting on Opponent..."}
                {gameState === "reveal" && resultMessage}
              </h2>

              {/* Battle Arena */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  maxWidth: "400px",
                  marginTop: "20px",
                }}
              >
                {/* You */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ color: "#fff", fontWeight: "bold" }}>You</span>
                  <div
                    style={{
                      fontSize: "4rem",
                      width: "100px",
                      height: "100px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "var(--arcade-surface)",
                      border: "2px solid var(--arcade-border)",
                      borderRadius: "16px",
                    }}
                  >
                    {myChoice ? WEAPONS[myChoice].icon : "?"}
                  </div>
                </div>

                <h1
                  style={{
                    color: "var(--arcade-red)",
                    alignSelf: "center",
                    margin: 0,
                  }}
                >
                  VS
                </h1>

                {/* Opponent */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ color: "#fff", fontWeight: "bold" }}>
                    Enemy
                  </span>
                  <div
                    style={{
                      fontSize: "4rem",
                      width: "100px",
                      height: "100px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "var(--arcade-surface)",
                      border: "2px solid var(--arcade-border)",
                      borderRadius: "16px",
                    }}
                  >
                    {gameState === "reveal"
                      ? WEAPONS[opponentChoice].icon
                      : opponentHasPicked
                        ? "✅"
                        : "?"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {gameState === "playing" && !myChoice && (
                <div
                  style={{ display: "flex", gap: "15px", marginTop: "30px" }}
                >
                  {Object.keys(WEAPONS).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleChoice(key)}
                      style={{
                        fontSize: "2.5rem",
                        padding: "15px 20px",
                        backgroundColor: "var(--arcade-surface)",
                        border: "2px solid var(--arcade-border)",
                        borderRadius: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {WEAPONS[key].icon}
                    </button>
                  ))}
                </div>
              )}

              {gameState === "reveal" && (
                <button
                  className="snake-action-btn"
                  onClick={requestNextRound}
                  style={{
                    marginTop: "30px",
                    backgroundColor: "var(--arcade-green)",
                    color: "#000",
                    padding: "15px 40px",
                    fontSize: "1.2rem",
                  }}
                >
                  Play Again
                </button>
              )}
            </>
          )}
        </div>

        {/* DESKTOP CONTROLS */}
        <div className="snake-wireframe-controls desktop-only">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Your Score <span>{playerRole === 1 ? p1Score : p2Score}</span>
            </div>
            <div className="snake-stat-row">
              Enemy Score <span>{playerRole === 1 ? p2Score : p1Score}</span>
            </div>
            <div className="snake-stat-row">
              Room <span>{room}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
