import { useMemo } from "react";

// The avatar styles the user can pick from (DiceBear).
const STYLES = ["identicon", "glass", "thumbs", "pixel-art", "bottts"];

// A few seeds so each style shows several distinct options.
const SEEDS = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"];

function buildUrl(style, seed) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export default function AvatarPicker({ value, onSelect, seedBase = "" }) {
  // Build the full grid of options once.
  const options = useMemo(() => {
    const list = [];
    for (const style of STYLES) {
      for (const seed of SEEDS) {
        list.push(buildUrl(style, `${seedBase}-${seed}`));
      }
    }
    return list;
  }, [seedBase]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))",
        gap: 10,
        maxHeight: 260,
        overflowY: "auto",
        padding: 8,
        border: "2px solid var(--border-soft)",
        borderRadius: "var(--radius)",
      }}
    >
      {options.map((url) => {
        const selected = url === value;
        return (
          <button
            key={url}
            type="button"
            onClick={() => onSelect(url)}
            style={{
              padding: 2,
              background: selected ? "var(--accent)" : "transparent",
              border: selected
                ? "2px solid #000"
                : "2px solid var(--border-soft)",
              borderRadius: "50%",
              cursor: "pointer",
              aspectRatio: "1 / 1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Choose avatar"
          >
            <img
              src={url}
              alt=""
              style={{ width: "100%", height: "100%", borderRadius: "50%" }}
            />
          </button>
        );
      })}
    </div>
  );
}
