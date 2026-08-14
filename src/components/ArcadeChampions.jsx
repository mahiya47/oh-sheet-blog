import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import api from "../api";

const GAME_NAMES = {
  snake: "Snake",
  tetris: "Tetris",
  reaction: "Reaction Timer",
  minesweeper: "Minesweeper",
  sudoku: "Sudoku",
  crossword: "Crossword",
  tictactoe: "Tic-Tac-Toe",
  rps: "Rock Paper Scissors",
  snakeandladder: "Snake & Ladder",
  ludo: "Ludo",
  flappybird: "Flappy Bird",
  runner: "Endless Runner",
  pictureslide: "Picture Slide",
  wordladder: "Word Ladder",
};

const STREAK_GAMES = ["crossword", "sudoku"];

const formatScore = (slug, score) => {
  if (STREAK_GAMES.includes(slug)) return `${score}🔥 streak`;
  if (slug === "reaction") return `${score} ms`;
  if (slug === "minesweeper") return `${score}s`;
  if (
    slug === "tictactoe" ||
    slug === "rps" ||
    slug === "snakeandladder" ||
    slug === "ludo"
  )
    return `${score} wins`;
  return `${score} pts`;
};

export default function ArcadeChampions() {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/arcade/top-players")
      .then((res) => {
        setChampions(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load champions", err);
        setLoading(false);
      });
  }, []);

  return (
    <div
      style={{
        backgroundColor: "var(--arcade-surface, #1a1a1a)",
        border: "1px solid var(--arcade-border, #333)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        color: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
          borderBottom: "1px solid #333",
          paddingBottom: "10px",
        }}
      >
        <Trophy size={20} color="var(--arcade-orange, #ff9800)" />
        <h3
          style={{
            margin: 0,
            fontSize: "1.1rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Arcade Champions
        </h3>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading champions...</p>
      ) : champions.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          No high scores yet. Be the first!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {champions.map((champ) => (
            <div
              key={champ.gameSlug}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                >
                  {GAME_NAMES[champ.gameSlug] || champ.gameSlug}
                </span>
                <span
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginTop: "2px",
                  }}
                >
                  @{champ.user.username}
                </span>
              </div>
              <div
                style={{
                  color: "var(--arcade-green, #4caf50)",
                  fontWeight: "900",
                  fontSize: "1rem",
                }}
              >
                {formatScore(champ.gameSlug, champ.score)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
