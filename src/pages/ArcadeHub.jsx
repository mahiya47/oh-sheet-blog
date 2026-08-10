import { Link } from "react-router-dom";
import { Gamepad2, Zap, Grid, Bomb, Hash, Scissors } from "lucide-react";

export default function ArcadeHub() {
  const games = [
    {
      title: "Reaction Tester",
      slug: "reaction",
      icon: <Zap size={32} color="#ffeb3b" />,
      type: "Single Player",
    },
    {
      title: "Snake",
      slug: "snake",
      icon: <Grid size={32} color="#4caf50" />,
      type: "Single Player",
    },
    {
      title: "Tetris",
      slug: "tetris",
      icon: <Grid size={32} color="#f44336" />,
      type: "Single Player",
    },
    {
      title: "Minesweeper",
      slug: "minesweeper",
      icon: <Bomb size={32} color="#9e9e9e" />,
      type: "Single Player",
    },
    {
      title: "Tic-Tac-Toe",
      slug: "tictactoe",
      icon: <Hash size={32} color="#4caf50" />,
      type: "Multiplayer",
    },
    {
      title: "RPS",
      slug: "rps",
      icon: <Scissors size={32} color="#e91e63" />,
      type: "Multiplayer",
    },
  ];

  return (
    <div className="feed-col" style={{ padding: "20px" }}>
      <h1 className="arcade-header">
        <Gamepad2 size={28} /> Oh Sheet Arcade
      </h1>
      <p style={{ color: "var(--text-muted)" }}>
        Compete for the high score or challenge your friends!
      </p>

      <div className="arcade-grid">
        {games.map((game) => (
          <Link
            key={game.slug}
            to={`/arcade/${game.slug}`}
            className="arcade-card"
          >
            {game.icon}
            <div style={{ textAlign: "center" }}>
              <span className="arcade-card-title">{game.title}</span>
              <span className="arcade-card-type">{game.type}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
