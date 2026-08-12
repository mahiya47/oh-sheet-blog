import { useState, useEffect } from "react";
import { ArrowLeft, RotateCw, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useStore } from "../lib/store.jsx";

// Connect to your production backend
const socket = io("https://api.ohsheet.blog");

export default function TicTacToeGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [playerRole, setPlayerRole] = useState(null); // 1 (X) or 2 (O)

  const [gameState, setGameState] = useState("waiting"); // waiting, playing, result
  const [opponentConnected, setOpponentConnected] = useState(false);

  const [p1Score, setP1Score] = useState(0); // Player 1 (X)
  const [p2Score, setP2Score] = useState(0); // Player 2 (O)

  const [board, setBoard] = useState(Array(9).fill(null));
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    socket.on("ttt_player_assigned", (role) => {
      setPlayerRole(role);
      setJoined(true);
    });

    socket.on("ttt_game_start", () => {
      setOpponentConnected(true);
      setGameState("playing");
      setBoard(Array(9).fill(null));
      // Player 1 (X) always goes first
      setIsMyTurn(playerRole === 1);
    });

    socket.on("ttt_update_board", ({ newBoard, nextTurn }) => {
      setBoard(newBoard);
      setIsMyTurn(playerRole === nextTurn);
    });

    socket.on("ttt_game_result", (data) => {
      setBoard(data.finalBoard);
      setP1Score(data.p1Score);
      setP2Score(data.p2Score);

      if (data.winner === 0) setResultMessage("It's a Draw! 🤝");
      else if (data.winner === playerRole) setResultMessage("You Win! 🎉");
      else setResultMessage("You Lose! 💀");

      setGameState("result");
      setIsMyTurn(false);
    });

    socket.on("ttt_next_round_start", (startingPlayer) => {
      setGameState("playing");
      setBoard(Array(9).fill(null));
      setResultMessage("");
      setIsMyTurn(playerRole === startingPlayer);
    });

    socket.on("ttt_opponent_disconnected", () => {
      setOpponentConnected(false);
      setGameState("waiting");
      setResultMessage("Opponent disconnected.");
      setBoard(Array(9).fill(null));
    });

    return () => {
      socket.off("ttt_player_assigned");
      socket.off("ttt_game_start");
      socket.off("ttt_update_board");
      socket.off("ttt_game_result");
      socket.off("ttt_next_round_start");
      socket.off("ttt_opponent_disconnected");
    };
  }, [playerRole]);

  const joinRoom = () => {
    if (room.trim()) {
      socket.emit("ttt_join_room", room);
    }
  };

  const handleCellClick = (index) => {
    if (gameState === "playing" && isMyTurn && !board[index]) {
      // Optimistic UI update
      const newBoard = [...board];
      newBoard[index] = playerRole === 1 ? "X" : "O";
      setBoard(newBoard);
      setIsMyTurn(false);

      socket.emit("ttt_play_move", { room, index });
    }
  };

  const requestNextRound = () => {
    socket.emit("ttt_request_next_round", room);
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
          <div style={{ flex: 1, textAlign: "center" }}>
            Multiplayer Tic-Tac-Toe
          </div>
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
          You ({playerRole === 1 ? "X" : "O"}){" "}
          <span>{playerRole === 1 ? p1Score : p2Score}</span>
        </div>
        <div>
          Enemy ({playerRole === 1 ? "O" : "X"}){" "}
          <span>{playerRole === 1 ? p2Score : p1Score}</span>
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
                  fontSize: "1.5rem",
                  margin: 0,
                  minHeight: "35px",
                }}
              >
                {gameState === "playing" && isMyTurn && "Your Turn!"}
                {gameState === "playing" &&
                  !isMyTurn &&
                  "Waiting on Opponent..."}
                {gameState === "result" && resultMessage}
              </h2>

              {/* 3x3 Grid Arena */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                  width: "100%",
                  maxWidth: "350px",
                  aspectRatio: "1 / 1",
                  backgroundColor: "var(--arcade-border)",
                  padding: "10px",
                  borderRadius: "16px",
                }}
              >
                {board.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => handleCellClick(index)}
                    disabled={gameState !== "playing" || !isMyTurn || cell}
                    style={{
                      backgroundColor: "var(--arcade-surface)",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "4rem",
                      fontWeight: "bold",
                      color:
                        cell === "X"
                          ? "var(--arcade-orange)"
                          : cell === "O"
                            ? "var(--arcade-green)"
                            : "#fff",
                      cursor:
                        gameState === "playing" && isMyTurn && !cell
                          ? "pointer"
                          : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background-color 0.2s",
                    }}
                  >
                    {cell}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              {gameState === "result" && (
                <button
                  className="snake-action-btn"
                  onClick={requestNextRound}
                  style={{
                    marginTop: "20px",
                    backgroundColor: "var(--arcade-green)",
                    color: "#000",
                    padding: "12px 30px",
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
