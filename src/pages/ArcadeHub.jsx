import { Link } from "react-router-dom";
import {
  Gamepad2,
  Blocks,
  Timer, // <-- Imported Timer for Stopwatch
  Bomb,
  Hash,
  Scissors,
  LayoutGrid,
  Type,
} from "lucide-react";
import ArcadeChampions from "../components/ArcadeChampions";

// Custom Retro Snake Icon
const SnakeIcon = ({ size = 24, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
  >
    <path d="M3 18h6v-8h6V6h6v4h-3" />
    <rect x="16" y="8" width="1" height="1" fill={color} stroke="none" />
    <rect x="5" y="8" width="2" height="2" />
  </svg>
);

export default function ArcadeHub() {
  const games = [
    {
      title: "Snake",
      slug: "snake",
      icon: SnakeIcon,
      type: "Single Player",
      description:
        "Eat the red apples to grow longer and increase your speed. Don't bite your own tail or hit the walls!",
    },
    {
      title: "Tetris",
      slug: "tetris",
      icon: Blocks,
      type: "Single Player",
      description:
        "Rotate and drop falling blocks to clear lines. The more lines you clear, the faster it gets.",
    },
    {
      title: "Reaction Tester",
      slug: "reaction",
      icon: Timer, // <-- Changed from Zap to Timer (Stopwatch)
      type: "Single Player",
      description:
        "Test your reflexes! Wait for the screen to turn green and click as fast as humanly possible.",
    },
    {
      title: "Minesweeper",
      slug: "minesweeper",
      icon: Bomb,
      type: "Single Player",
      description:
        "Clear the board without detonating any hidden mines using numerical clues.",
    },
    {
      title: "Sudoku",
      slug: "sudoku",
      icon: LayoutGrid,
      type: "Single Player",
      description:
        "A logic-based number placement puzzle. Fill the 9x9 grid so every row, column, and 3x3 box contains 1 through 9.",
    },
    {
      title: "Crossword",
      slug: "crossword",
      icon: Type,
      type: "Single Player",
      description:
        "Test your vocabulary and trivia knowledge by filling in the intersecting words based on the given clues.",
    },
    {
      title: "Tic-Tac-Toe",
      slug: "tictactoe",
      icon: Hash,
      type: "Multiplayer",
      description:
        "Classic X's and O's. Challenge a friend locally and be the first to get 3 in a row.",
    },
    {
      title: "Rock Paper Scissors",
      slug: "rps",
      icon: Scissors,
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
        {games.map((game) => {
          const IconComponent = game.icon;

          return (
            <Link
              key={game.slug}
              to={`/arcade/${game.slug}`}
              className="arcade-game-card"
            >
              <div
                className="arcade-card-img-wrapper"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "160px",
                  backgroundColor: "var(--surface-sunken, #111)",
                  borderBottom: "1px solid var(--border-soft, #333)",
                }}
              >
                <IconComponent size={72} color="var(--accent, #4caf50)" />
              </div>

              <div className="arcade-card-content">
                <div className="arcade-card-top">
                  <h3 className="arcade-card-title">{game.title}</h3>
                  <span className="arcade-badge">{game.type}</span>
                </div>

                <p className="arcade-card-desc">{game.description}</p>

                <div className="arcade-play-btn">Play Now</div>
              </div>
            </Link>
          );
        })}
      </div>

      <div
        className="mobile-only"
        style={{
          width: "100%",
          marginTop: "30px",
          paddingBottom: "40px",
        }}
      >
        <ArcadeChampions />
      </div>
    </div>
  );
}
