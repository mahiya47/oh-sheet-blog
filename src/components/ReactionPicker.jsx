import { useState, useRef, useEffect } from "react";

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
  const wrapperRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Desktop: hover-and-hold
  const openPicker = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setOpen(true), 400);
  };

  const cancelOpen = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  // Mobile: long-press. Quick tap (<400ms) falls through to the child
  // button's normal onClick (instant react). A hold past 400ms opens
  // the picker and suppresses the click that would otherwise fire.
  const handleTouchStart = () => {
    longPressFiredRef.current = false;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setOpen(true);
      longPressFiredRef.current = true;
    }, 400);
  };

  const handleTouchEnd = (e) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (longPressFiredRef.current) {
      // picker just opened via long-press — don't let the
      // trailing click also fire the default reaction
      e.preventDefault();
    }
  };

  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={openPicker}
      onMouseLeave={cancelOpen}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
            padding: 8,
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
