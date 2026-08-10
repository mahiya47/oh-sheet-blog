import { Link } from "react-router-dom";
import { X, Trophy } from "lucide-react";
import Avatar from "./Avatar.jsx";

export default function GameLeaderboardModal({ title, scores = [], onClose }) {
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
        aria-label="Leaderboard"
        style={{ maxWidth: 400, position: "relative" }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
        >
          <X size={18} />
        </button>

        <div className="sheet-head" style={{ "--head": "var(--accent)" }}>
          <span className="sheet-author">
            <span className="names">
              <span
                className="display"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Trophy size={18} color="var(--accent)" /> Top 3 — {title}
              </span>
            </span>
          </span>
        </div>

        <div style={{ padding: "var(--space-3)" }}>
          {scores.length === 0 ? (
            <p
              style={{
                color: "var(--text-dim)",
                padding: "var(--space-4)",
                textAlign: "center",
              }}
            >
              No high scores yet. Be the first!
            </p>
          ) : (
            scores.map((u, idx) => (
              <Link
                key={u.id}
                to={`/profile/${u.id}`}
                onClick={onClose}
                className="mini-row"
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    width: 20,
                    textAlign: "center",
                    color: idx === 0 ? "#ffD700" : "inherit",
                  }}
                >
                  #{idx + 1}
                </span>
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
                    {u.name || u.username}
                  </span>
                  <span
                    style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                  >
                    @{u.username}
                  </span>
                </span>
                <span style={{ fontWeight: 800, color: "var(--accent)" }}>
                  {u.score} pts
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
