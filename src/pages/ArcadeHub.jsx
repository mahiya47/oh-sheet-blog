import { Link } from "react-router-dom";
import { Gamepad2 } from "lucide-react";

export default function ArcadeHub() {
  const games = [
    {
      title: "Snake",
      slug: "snake",
      image: "/snake.png",
      type: "Single Player",
      description:
        "Eat the red apples to grow longer and increase your speed. Don't bite your own tail or hit the walls!",
    },
    {
      title: "Tetris",
      slug: "tetris",
      image: "/tetris.png",
      type: "Single Player",
      description:
        "Rotate and drop falling blocks to clear lines. The more lines you clear, the faster it gets.",
    },
    {
      title: "Reaction Tester",
      slug: "reaction",
      image: "/reaction.png",
      type: "Single Player",
      description:
        "Test your reflexes! Wait for the screen to turn green and click as fast as humanly possible.",
    },
    {
      title: "Minesweeper",
      slug: "minesweeper",
      image: "/minesweeper.png",
      type: "Single Player",
      description:
        "Clear the board without detonating any hidden mines using numerical clues.",
    },
    {
      title: "Tic-Tac-Toe",
      slug: "tictactoe",
      image: "/tictactoe.png",
      type: "Multiplayer",
      description:
        "Classic X's and O's. Challenge a friend locally and be the first to get 3 in a row.",
    },
    {
      title: "Rock Paper Scissors",
      slug: "rps",
      image: "/rps.png",
      type: "Multiplayer",
      description:
        "A timeless battle of wits. Choose your weapon and defeat your opponent.",
    },
  ];

  return (
    <div className="feed-col arcade-hub-container">
      <div>
        <h1 className="arcade-hub-header">
          <Gamepad2 size={32} color="var(--accent)" /> Oh Sheet Arcade
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Compete for the global high score or challenge your friends!
        </p>
      </div>

      <div className="arcade-hub-grid">
        {games.map((game) => (
          <Link
            key={game.slug}
            to={`/arcade/${game.slug}`}
            className="arcade-game-card"
          >
            {/* Thumbnail Image */}
            <div className="arcade-card-img-wrapper">
              <img
                src={game.image}
                alt={`${game.title} thumbnail`}
                onError={(e) => {
                  // Failsafe: If the image isn't in the public folder yet, it hides the broken image icon
                  e.target.style.display = "none";
                }}
              />
            </div>

            {/* Card Info */}
            <div className="arcade-card-content">
              <div className="arcade-card-top">
                <h3 className="arcade-card-title">{game.title}</h3>
                <span className="arcade-badge">{game.type}</span>
              </div>

              <p className="arcade-card-desc">{game.description}</p>

              <div className="arcade-play-btn">Play Now</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
