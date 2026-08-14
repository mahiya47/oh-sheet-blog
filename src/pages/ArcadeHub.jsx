import { Link } from "react-router-dom";
import {
  Gamepad2,
  Blocks,
  Timer,
  Bomb,
  Hash,
  Scissors,
  LayoutGrid,
  Type,
  Dices,
  Bird,
  Rabbit,
  Grid3x3,
  SpellCheck2,
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
      color: "#4caf50",
      type: "Single Player",
      description:
        "Eat the red apples to grow longer and increase your speed. Don't bite your own tail or hit the walls!",
    },
    {
      title: "Tetris",
      slug: "tetris",
      icon: Blocks,
      color: "#00b0ff",
      type: "Single Player",
      description:
        "Rotate and drop falling blocks to clear lines. The more lines you clear, the faster it gets.",
    },
    {
      title: "Reaction Tester",
      slug: "reaction",
      icon: Timer,
      color: "#ffca28",
      type: "Single Player",
      description:
        "Three rounds of F1-style lights. Wait for green and click as fast as possible \u2014 your average time is the score.",
    },
    {
      title: "Minesweeper",
      slug: "minesweeper",
      icon: Bomb,
      color: "#ef5350",
      type: "Single Player",
      description:
        "Clear the board without detonating any hidden mines using numerical clues.",
    },
    {
      title: "Sudoku",
      slug: "sudoku",
      icon: LayoutGrid,
      color: "#26a69a",
      type: "Daily \u00b7 Streak",
      description:
        "A fresh 9x9 puzzle every day, the same for everyone. Solve it to keep your streak alive.",
    },
    {
      title: "Crossword",
      slug: "crossword",
      icon: Type,
      color: "#8d6e63",
      type: "Daily \u00b7 Streak",
      description:
        "A new crossword every day, generated fresh. Solve it to build your streak.",
    },
    {
      title: "Tic-Tac-Toe",
      slug: "tictactoe",
      icon: Hash,
      color: "#ab47bc",
      type: "Multiplayer",
      description:
        "Classic X's and O's. Challenge a friend locally and be the first to get 3 in a row.",
    },
    {
      title: "Rock Paper Scissors",
      slug: "rps",
      icon: Scissors,
      color: "#ec407a",
      type: "Multiplayer",
      description:
        "A timeless battle of wits. Choose your weapon and defeat your opponent.",
    },
    {
      title: "Snake & Ladder",
      slug: "snakeandladder",
      icon: Dices,
      color: "#fb8c00",
      type: "Multiplayer",
      description:
        "The classic board game. Climb ladders, avoid snakes, and race friends to square 100.",
    },
    {
      title: "Ludo",
      slug: "ludo",
      icon: Dices,
      color: "#5c6bc0",
      type: "Multiplayer",
      description:
        "Roll the dice, race your tokens home, and send your opponents back to base.",
    },
    {
      title: "Flappy Bird",
      slug: "flappybird",
      icon: Bird,
      color: "#ffee58",
      type: "Single Player",
      description:
        "Tap to flap and dodge the pipes. One touch and it's game over \u2014 how far can you get?",
    },
    {
      title: "Endless Runner",
      slug: "runner",
      icon: Rabbit,
      color: "#8bc34a",
      type: "Single Player",
      description:
        "Jump and duck through obstacles as the game speeds up. Survive as long as you can.",
    },
    {
      title: "Picture Slide",
      slug: "pictureslide",
      icon: Grid3x3,
      color: "#29b6f6",
      type: "Single Player",
      description:
        "Slide the scrambled tiles back into place to reveal the hidden picture.",
      comingSoon: true,
    },
    {
      title: "Word Ladder",
      slug: "wordladder",
      icon: SpellCheck2,
      color: "#ff7043",
      type: "Daily \u00b7 Streak",
      description:
        "A themed set of clues, one letter bank. Fill in every word before time runs out.",
      comingSoon: true,
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

          const cardInner = (
            <>
              <div
                className="arcade-card-icon-wrapper"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${game.color}33, transparent 60%),
                               radial-gradient(circle at 70% 70%, ${game.color}22, transparent 60%),
                               var(--surface-sunken, #111)`,
                }}
              >
                <div
                  className="arcade-card-icon-pattern"
                  style={{
                    backgroundImage: `radial-gradient(${game.color}26 1.5px, transparent 1.5px)`,
                    backgroundSize: "16px 16px",
                  }}
                />
                <IconComponent
                  size={60}
                  color={game.color}
                  strokeWidth={1.7}
                  style={{ position: "relative", zIndex: 1 }}
                />
              </div>

              <div className="arcade-card-content">
                <div className="arcade-card-top">
                  <h3 className="arcade-card-title">{game.title}</h3>
                  <span className="arcade-badge">{game.type}</span>
                </div>

                <p className="arcade-card-desc">{game.description}</p>

                {game.comingSoon ? (
                  <div className="arcade-play-btn arcade-play-btn--soon">
                    Coming Soon
                  </div>
                ) : (
                  <div className="arcade-play-btn">Play Now</div>
                )}
              </div>
            </>
          );

          return game.comingSoon ? (
            <div
              key={game.slug}
              className="arcade-game-card arcade-game-card--soon"
              aria-disabled="true"
            >
              {cardInner}
            </div>
          ) : (
            <Link
              key={game.slug}
              to={`/arcade/${game.slug}`}
              className="arcade-game-card"
            >
              {cardInner}
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
