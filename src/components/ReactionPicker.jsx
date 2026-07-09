import { useState, useRef } from "react";
import { useClickAway } from "../lib/useClickAway.js";

const REACTIONS = [
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "thumbsup", emoji: "👍", label: "Like" },
  { type: "laugh", emoji: "😂", label: "Haha" },
  { type: "cry", emoji: "😢", label: "Sad" },
  { type: "poop", emoji: "💩", label: "Poop" },
];

export default function ReactionPicker({ current, onPick, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickAway(ref, () => setOpen(false), open);
  let hoverTimer = useRef(null);

  const openPicker = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(true), 400);
  };
  const cancelOpen = () => clearTimeout(hoverTimer.current);

  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={openPicker}
      onMouseLeave={cancelOpen}
    >
      {children}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: 6,
            display: "flex",
            gap: 4,
            background: "var(--surface, #111)",
            border: "2px solid var(--border, #333)",
            borderRadius: 999,
            padding: "6px 8px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
            zIndex: 50,
          }}
        >
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onPick(r.type);
              }}
              aria-label={r.label}
              title={r.label}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.4rem",
                lineHeight: 1,
                transform: current === r.type ? "scale(1.2)" : "scale(1)",
                transition: "transform 0.12s ease",
              }}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
