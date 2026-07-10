import { useState } from "react";
import { Link } from "react-router-dom";
import { X, Crown } from "lucide-react";
import { CREATOR_ID } from "../lib/creator.js";
import Avatar from "./Avatar.jsx";

const REACTION_ORDER = [
  "heart",
  "thumbsup",
  "laugh",
  "cry",
  "poop",
  "rainbow",
  "hug",
  "blast",
  "kiss",
];

const REACTION_EMOJI = {
  heart: "❤️",
  thumbsup: "👍",
  laugh: "😂",
  cry: "😢",
  poop: "💩",
  rainbow: "🌈",
  hug: "🤗",
  blast: "💥",
  kiss: "💋",
};

export default function ReactionsModal({ counts, users, onClose }) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const activeTypes = REACTION_ORDER.filter((t) => counts[t] > 0);
  const [filter, setFilter] = useState("all");

  const shownUsers =
    filter === "all" ? users : users.filter((u) => u.reaction === filter);

  return (
    <div
      className="overlay"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Reactions"
        style={{ maxWidth: 440 }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="sheet-head" style={{ "--head": "var(--accent)" }}>
          <span className="sheet-author">
            <span className="names">
              <span className="display">Reactions</span>
            </span>
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "10px var(--space-3) 0",
          }}
        >
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="tag"
            style={{
              cursor: "pointer",
              background: filter === "all" ? "var(--accent)" : "transparent",
              color: filter === "all" ? "var(--accent-ink)" : "inherit",
            }}
          >
            All {totalCount}
          </button>
          {activeTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className="tag"
              style={{
                cursor: "pointer",
                background: filter === t ? "var(--accent)" : "transparent",
                color: filter === t ? "var(--accent-ink)" : "inherit",
              }}
            >
              {REACTION_EMOJI[t]} {counts[t]}
            </button>
          ))}
        </div>

        <div style={{ padding: "var(--space-3)" }}>
          {shownUsers.length === 0 ? (
            <p
              style={{
                color: "var(--text-dim)",
                padding: "var(--space-4)",
                textAlign: "center",
              }}
            >
              Nobody here yet.
            </p>
          ) : (
            shownUsers.map((u) => (
              <Link
                key={u.id}
                to={`/profile/${u.id}`}
                onClick={onClose}
                className="mini-row"
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <Avatar user={u} size={40} />
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {u.displayName || u.name}
                    {u.id === CREATOR_ID && (
                      <span className="creator-badge">
                        <Crown size={10} /> Creator
                      </span>
                    )}
                  </span>
                  <span
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  >
                    @{u.username}
                  </span>
                </span>
                <span style={{ fontSize: "1.2rem" }}>
                  {REACTION_EMOJI[u.reaction]}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
