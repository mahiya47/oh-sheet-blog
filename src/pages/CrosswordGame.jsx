import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useStore } from "../lib/store.jsx";
import ScoreModal from "../components/ScoreModal";

const WORD_BANK = [
  { word: "APPLE", clue: "Common fruit, often red or green" },
  { word: "TIGER", clue: "Big striped cat" },
  { word: "PLANET", clue: "Earth is one" },
  { word: "GUITAR", clue: "Six-stringed instrument" },
  { word: "CASTLE", clue: "Medieval fortress" },
  { word: "PENCIL", clue: "Writing tool with graphite" },
  { word: "GARDEN", clue: "Place to grow plants" },
  { word: "WINTER", clue: "Coldest season" },
  { word: "BRIDGE", clue: "Structure crossing a river" },
  { word: "COFFEE", clue: "Morning caffeine drink" },
  { word: "ROBOT", clue: "Mechanical automaton" },
  { word: "DESERT", clue: "Sandy, dry region" },
  { word: "ISLAND", clue: "Land surrounded by water" },
  { word: "SILVER", clue: "Precious metal, symbol Ag" },
  { word: "MARKET", clue: "Place to buy goods" },
  { word: "ORANGE", clue: "Citrus fruit and a color" },
  { word: "PIRATE", clue: "Seafaring outlaw" },
  { word: "ROCKET", clue: "Vehicle that goes to space" },
  { word: "CANDLE", clue: "Wax stick with a wick" },
  { word: "JUNGLE", clue: "Dense tropical forest" },
  { word: "PUZZLE", clue: "Brain teaser, like this game" },
  { word: "WIZARD", clue: "Magic-user in fantasy tales" },
  { word: "VOLCANO", clue: "Mountain that erupts" },
  { word: "DIAMOND", clue: "Hardest natural gemstone" },
  { word: "AIRPORT", clue: "Where planes take off" },
  { word: "LIBRARY", clue: "Building full of books" },
  { word: "PAINTER", clue: "Someone who makes art with a brush" },
  { word: "MONSTER", clue: "Scary fictional creature" },
  { word: "CAPTAIN", clue: "Leader of a ship or team" },
  { word: "KITCHEN", clue: "Room where meals are cooked" },
  { word: "TORNADO", clue: "Violent spinning windstorm" },
  { word: "OCEAN", clue: "Vast body of salt water" },
  { word: "RIVER", clue: "Flowing body of fresh water" },
  { word: "CLOUD", clue: "Fluffy thing in the sky" },
  { word: "STORM", clue: "Severe weather event" },
  { word: "TRAIN", clue: "Vehicle that runs on rails" },
  { word: "PLANE", clue: "Flies through the air" },
  { word: "MOUSE", clue: "Small rodent, or a computer device" },
  { word: "HOUSE", clue: "Place where people live" },
  { word: "MUSIC", clue: "Organized sound, art form" },
  { word: "PIZZA", clue: "Italian dish with cheese and toppings" },
  { word: "CHESS", clue: "Strategy game with kings and pawns" },
  { word: "SNAKE", clue: "Legless reptile" },
  { word: "SPACE", clue: "The final frontier" },
  { word: "EARTH", clue: "Our home planet" },
  { word: "BREAD", clue: "Baked staple food" },
  { word: "LEMON", clue: "Sour yellow citrus fruit" },
  { word: "HONEY", clue: "Sweet substance made by bees" },
  { word: "MAGIC", clue: "Supernatural power" },
  { word: "NIGHT", clue: "Opposite of day" },
  { word: "LIGHT", clue: "Opposite of dark" },
];

const MAX_WORDS = 12;
const GENERATION_ATTEMPTS = 12;

// --- Deterministic seeded RNG so everyone gets the SAME puzzle on the
// same calendar date (mulberry32 PRNG, seeded from a hash of the date). ---
function hashStringToInt(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD", UTC-based
}

function shuffleSeeded(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function placeWords(pool, rng) {
  const cellMap = new Map();
  const placed = [];

  const canPlace = (word, row, col, dir) => {
    for (let i = 0; i < word.length; i++) {
      const r = dir === "D" ? row + i : row;
      const c = dir === "A" ? col + i : col;
      const key = `${r},${c}`;
      if (cellMap.has(key) && cellMap.get(key) !== word[i]) return false;
    }
    const beforeR = dir === "D" ? row - 1 : row;
    const beforeC = dir === "A" ? col - 1 : col;
    if (cellMap.has(`${beforeR},${beforeC}`)) return false;
    const afterR = dir === "D" ? row + word.length : row;
    const afterC = dir === "A" ? col + word.length : col;
    if (cellMap.has(`${afterR},${afterC}`)) return false;
    return true;
  };

  const place = (word, row, col, dir, clue) => {
    for (let i = 0; i < word.length; i++) {
      const r = dir === "D" ? row + i : row;
      const c = dir === "A" ? col + i : col;
      cellMap.set(`${r},${c}`, word[i]);
    }
    placed.push({ word, row, col, dir, clue });
  };

  const first = pool[0];
  place(first.word, 0, 0, "A", first.clue);

  for (let idx = 1; idx < pool.length && placed.length < MAX_WORDS; idx++) {
    const { word, clue } = pool[idx];
    if (placed.some((p) => p.word === word)) continue;

    const tryList = [];
    for (const [key, letter] of cellMap.entries()) {
      const [er, ec] = key.split(",").map(Number);
      for (let li = 0; li < word.length; li++) {
        if (word[li] === letter) tryList.push({ er, ec, li });
      }
    }
    shuffleSeeded(tryList, rng);

    let placedThis = false;
    for (const t of tryList) {
      for (const dir of shuffleSeeded(["A", "D"], rng)) {
        const row = dir === "D" ? t.er - t.li : t.er;
        const col = dir === "A" ? t.ec - t.li : t.ec;
        if (canPlace(word, row, col, dir)) {
          place(word, row, col, dir, clue);
          placedThis = true;
          break;
        }
      }
      if (placedThis) break;
    }
  }

  return placed;
}

function buildDailyPuzzle(dateKey) {
  const rng = mulberry32(hashStringToInt(dateKey));
  let best = null;
  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt++) {
    const pool = shuffleSeeded(WORD_BANK, rng);
    const placed = placeWords(pool, rng);
    if (!best || placed.length > best.length) best = placed;
    if (best.length >= MAX_WORDS) break;
  }

  let minR = Infinity,
    minC = Infinity,
    maxR = -Infinity,
    maxC = -Infinity;
  for (const p of best) {
    for (let i = 0; i < p.word.length; i++) {
      const r = p.dir === "D" ? p.row + i : p.row;
      const c = p.dir === "A" ? p.col + i : p.col;
      minR = Math.min(minR, r);
      minC = Math.min(minC, c);
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
    }
  }

  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const solution = Array.from({ length: rows }, () => Array(cols).fill(null));
  const placements = best.map((p) => ({
    ...p,
    row: p.row - minR,
    col: p.col - minC,
  }));

  for (const p of placements) {
    for (let i = 0; i < p.word.length; i++) {
      const r = p.dir === "D" ? p.row + i : p.row;
      const c = p.dir === "A" ? p.col + i : p.col;
      solution[r][c] = p.word[i];
    }
  }

  const sortedStartCoords = [
    ...new Set(placements.map((p) => `${p.row},${p.col}`)),
  ].sort((a, b) => {
    const [ar, ac] = a.split(",").map(Number);
    const [br, bc] = b.split(",").map(Number);
    return ar - br || ac - bc;
  });
  const starts = new Map();
  sortedStartCoords.forEach((key, i) => starts.set(key, i + 1));

  const numbers = {};
  starts.forEach((num, key) => {
    numbers[key] = num;
  });

  const clues = { across: {}, down: {} };
  for (const p of placements) {
    const num = starts.get(`${p.row},${p.col}`);
    if (p.dir === "A") clues.across[num] = p.clue;
    else clues.down[num] = p.clue;
  }

  return { solution, numbers, clues, rows, cols, placements };
}

function firstOpenCell(p) {
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (p.solution[r][c]) return { r, c };
    }
  }
  return { r: 0, c: 0 };
}

function isOpenStatic(p, r, c) {
  return (
    r >= 0 && r < p.rows && c >= 0 && c < p.cols && p.solution[r][c] !== null
  );
}

function sameAcrossWord(puzzle, r, c, selectedC) {
  const lo = Math.min(c, selectedC);
  const hi = Math.max(c, selectedC);
  for (let x = lo; x <= hi; x++) {
    if (!isOpenStatic(puzzle, r, x)) return false;
  }
  return true;
}
function sameDownWord(puzzle, r, c, selectedR) {
  const lo = Math.min(r, selectedR);
  const hi = Math.max(r, selectedR);
  for (let y = lo; y <= hi; y++) {
    if (!isOpenStatic(puzzle, y, c)) return false;
  }
  return true;
}

export default function CrosswordGame() {
  const navigate = useNavigate();
  const { currentUser } = useStore();

  const dateKey = todayKey();
  const [puzzle] = useState(() => buildDailyPuzzle(dateKey));
  const [grid, setGrid] = useState(() =>
    Array.from({ length: puzzle.rows }, () => Array(puzzle.cols).fill("")),
  );
  const [selected, setSelected] = useState(() => firstOpenCell(puzzle));
  const [direction, setDirection] = useState("across");

  const alreadySolvedToday =
    typeof window !== "undefined" &&
    localStorage.getItem("crossword-solved-date") === dateKey;

  const [gameState, setGameState] = useState(
    alreadySolvedToday ? "won" : "playing",
  );
  const [timer, setTimer] = useState(0);
  const [streak, setStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const timerRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const selectedRef = useRef(selected);
  const directionRef = useRef(direction);
  const gridRef = useRef(grid);
  const puzzleRef = useRef(puzzle);

  const isOpen = (p, r, c) => isOpenStatic(p, r, c);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);
  useEffect(() => {
    puzzleRef.current = puzzle;
  }, [puzzle]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchLeaderboard = useCallback(() => {
    api
      .get("/arcade/crossword/leaderboard")
      .then((res) => {
        if (res.data) {
          const sorted = res.data.sort((a, b) => b.score - a.score); // score = streak, highest first
          setLeaderboard(sorted);
          if (currentUser) {
            const mine = sorted.find(
              (entry) => entry.user?.username === currentUser.username,
            );
            if (mine) setStreak(mine.score);
          }
        }
      })
      .catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setTimer((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  useEffect(() => {
    if (!alreadySolvedToday) hiddenInputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== "playing") return;
      const p = puzzleRef.current;
      const { r, c } = selectedRef.current;

      const step = (dr, dc, dir) => {
        let nr = r + dr;
        let nc = c + dc;
        while (
          nr >= 0 &&
          nr < p.rows &&
          nc >= 0 &&
          nc < p.cols &&
          !isOpen(p, nr, nc)
        ) {
          nr += dr;
          nc += dc;
        }
        if (isOpen(p, nr, nc)) {
          setSelected({ r: nr, c: nc });
          setDirection(dir);
        }
      };

      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(0, 1, "across");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(0, -1, "across");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        step(1, 0, "down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        step(-1, 0, "down");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  const validateGrid = (currentGrid, p) => {
    for (let r = 0; r < p.rows; r++) {
      for (let c = 0; c < p.cols; c++) {
        if (p.solution[r][c] === null) continue;
        if (currentGrid[r][c] !== p.solution[r][c]) return false;
      }
    }
    return true;
  };

  const advance = (dr, dc) => {
    const p = puzzleRef.current;
    const { r, c } = selectedRef.current;
    const nr = r + dr;
    const nc = c + dc;
    if (isOpen(p, nr, nc)) setSelected({ r: nr, c: nc });
  };

  const handleInput = async (char) => {
    if (gameState !== "playing") return;
    const p = puzzleRef.current;
    const { r, c } = selectedRef.current;
    const direction = directionRef.current;
    const newGrid = gridRef.current.map((row) => [...row]);

    if (char === "DEL") {
      if (newGrid[r][c]) {
        newGrid[r][c] = "";
        setGrid(newGrid);
      } else {
        if (direction === "across") advance(0, -1);
        else advance(-1, 0);
      }
      return;
    }

    if (!isOpen(p, r, c)) return;
    newGrid[r][c] = char;
    setGrid(newGrid);

    if (validateGrid(newGrid, p)) {
      setGameState("won");
      localStorage.setItem("crossword-solved-date", dateKey);
      try {
        const res = await api.post("/arcade/crossword/score", {
          score: timer,
        });
        if (res.data?.streak != null) setStreak(res.data.streak);
        fetchLeaderboard();
      } catch (err) {
        console.error("Failed to save crossword streak", err);
      }
      return;
    }

    if (direction === "across") advance(0, 1);
    else advance(1, 0);
  };

  const handleCellClick = (r, c) => {
    if (!isOpen(puzzleRef.current, r, c)) return;
    if (selected.r === r && selected.c === c) {
      setDirection((prev) => (prev === "across" ? "down" : "across"));
    } else {
      setSelected({ r, c });
    }
    hiddenInputRef.current?.focus();
  };

  const getActiveClue = () => {
    const p = puzzleRef.current;
    const { r, c } = selected;
    let sr = r,
      sc = c;
    if (direction === "across") {
      while (isOpen(p, sr, sc - 1)) sc -= 1;
    } else {
      while (isOpen(p, sr - 1, sc)) sr -= 1;
    }
    const num = p.numbers[`${sr},${sc}`];
    if (!num) return "";
    const clueText =
      direction === "across" ? p.clues.across[num] : p.clues.down[num];
    return clueText
      ? `${num} ${direction === "across" ? "Across" : "Down"}: ${clueText}`
      : "";
  };

  const boardMaxWidth = isMobile ? 400 : 480;

  const hiddenInput = (
    <input
      ref={hiddenInputRef}
      type="text"
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      value=" "
      onChange={(e) => {
        const val = e.target.value;
        if (val === "") {
          handleInput("DEL");
        } else if (val.length > 1) {
          const char = val.slice(-1);
          if (/^[a-zA-Z]$/.test(char)) handleInput(char.toUpperCase());
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Backspace") {
          e.preventDefault();
          handleInput("DEL");
        }
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "1px",
        height: "1px",
        opacity: 0.01,
      }}
    />
  );

  const activeClueDisplay = (
    <div
      style={{
        width: "100%",
        maxWidth: boardMaxWidth,
        backgroundColor: "var(--arcade-surface)",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid var(--arcade-border)",
        textAlign: "center",
        color: "var(--arcade-orange)",
        fontWeight: "bold",
        fontSize: "1.05rem",
        minHeight: "1.4em",
      }}
    >
      {gameState === "playing" ? getActiveClue() : "Today's puzzle complete!"}
    </div>
  );

  const crosswordGrid = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
        gridTemplateRows: `repeat(${puzzle.rows}, 1fr)`,
        width: "100%",
        maxWidth: boardMaxWidth,
        aspectRatio: `${puzzle.cols} / ${puzzle.rows}`,
        backgroundColor: "#000",
        border: "3px solid #000",
        gap: "1px",
        userSelect: "none",
        boxSizing: "border-box",
        opacity: gameState === "playing" ? 1 : 0.55,
        pointerEvents: gameState === "playing" ? "auto" : "none",
      }}
    >
      {grid.map((row, r) =>
        row.map((letter, c) => {
          const open = isOpen(puzzle, r, c);
          if (!open) {
            return (
              <div key={`${r}-${c}`} style={{ backgroundColor: "#000" }} />
            );
          }
          const isSelected = selected.r === r && selected.c === c;
          const isWordHighlight =
            direction === "across"
              ? selected.r === r && sameAcrossWord(puzzle, r, c, selected.c)
              : selected.c === c && sameDownWord(puzzle, r, c, selected.r);
          const cellNum = puzzle.numbers[`${r},${c}`];
          const displayLetter =
            gameState === "playing" ? letter : puzzle.solution[r][c];

          return (
            <div
              key={`${r}-${c}`}
              onClick={() => handleCellClick(r, c)}
              style={{
                position: "relative",
                backgroundColor: isSelected
                  ? "#ffeb3b"
                  : isWordHighlight
                    ? "#fff9c4"
                    : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? "clamp(1rem, 4.5vw, 1.6rem)" : "1.9rem",
                fontWeight: "bold",
                color: "#000",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {cellNum && (
                <span
                  style={{
                    position: "absolute",
                    top: "1px",
                    left: "3px",
                    fontSize: "0.55rem",
                    fontWeight: "normal",
                    lineHeight: 1,
                  }}
                >
                  {cellNum}
                </span>
              )}
              {displayLetter || ""}
            </div>
          );
        }),
      )}
    </div>
  );

  const winOverlay = gameState === "won" && (
    <div className="snake-overlay">
      <h2
        style={{ color: "var(--arcade-green)", textShadow: "2px 2px 0 #000" }}
      >
        {alreadySolvedToday && timer === 0
          ? "Already solved today!"
          : "Puzzle Solved!"}
      </h2>
      <p
        style={{
          color: "#fff",
          marginBottom: "6px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "center",
        }}
      >
        <Flame size={18} color="var(--arcade-orange)" />
        {streak} day streak
      </p>
      <p style={{ color: "var(--arcade-text-dim)", fontSize: "0.85rem" }}>
        Come back tomorrow for a new puzzle.
      </p>
    </div>
  );

  const statsHeader = isMobile ? (
    <div className="arcade-mobile-header mobile-only">
      <button
        className="arcade-mobile-back"
        onClick={() => navigate("/arcade")}
      >
        <ArrowLeft size={20} />
      </button>
      <div>
        Time <span>{timer}s</span>
      </div>
      <div>
        Streak <span>{streak}🔥</span>
      </div>
      <button
        className="arcade-mobile-trophy"
        onClick={() => setIsModalOpen(true)}
      >
        Top Streaks
      </button>
    </div>
  ) : null;

  if (isMobile) {
    return (
      <div style={{ padding: "0" }}>
        {statsHeader}
        <div
          style={{
            width: "100%",
            padding: "15px",
            paddingBottom: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
          onClick={() => hiddenInputRef.current?.focus()}
        >
          {hiddenInput}
          {activeClueDisplay}
          {crosswordGrid}
          {winOverlay}
        </div>
        <ScoreModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          leaderboard={leaderboard}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "0" }}>
      <div className="snake-wireframe-container">
        <div
          className="snake-wireframe-board"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          {hiddenInput}
          {activeClueDisplay}
          {crosswordGrid}
          {winOverlay}
        </div>
        <div className="snake-wireframe-controls desktop-only">
          <div className="snake-wireframe-stats">
            <div className="snake-stat-row">
              Time <span>{timer}s</span>
            </div>
            <div className="snake-stat-row">
              Streak <span>{streak}🔥</span>
            </div>
          </div>
        </div>
      </div>
      <ScoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leaderboard={leaderboard}
      />
    </div>
  );
}
