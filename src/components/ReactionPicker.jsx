import { useState, useRef } from "react";
import { useClickAway } from "../lib/useClickAway.js";

const REACTIONS = [
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "thumbsup", emoji: "👍", label: "Like" },
  { type: "laugh", emoji: "😂", label: "Haha" },
  { type: "cry", emoji: "😢", label: "Sad" },
  { type: "poop", emoji: "💩", label: "Poop" },
  { type: "rainbow", emoji: "🌈", label: "Rainbow" },
  { type: "hug", emoji: "🤗", label: "Hug" },
  { type: "blast", emoji: "💥", label: "Blast" },
  { type: "kiss", emoji: "💋", label: "Kiss" },
];

export default function ReactionPicker({ current, onPick, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickAway(ref, () => setOpen(false), open);
  const hoverTimer = useRef(null);

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
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 4,
            width: 220,
            background: "var(--surface, #111)",
            border: "2px solid var(--border, #333)",
            borderRadius: 16,
            padding: "8px",
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
                fontSize: "1.3rem",
                lineHeight: 1,
                padding: 4,
                borderRadius: 8,
                transform: current === r.type ? "scale(1.2)" : "scale(1)",
                transition: "transform 0.12s ease, background 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(128,128,128,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
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
