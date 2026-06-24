import { Link } from "react-router-dom";
import { X, Crown } from "lucide-react";
import { CREATOR_ID } from "../lib/creator.js";
import Avatar from "./Avatar.jsx";

export default function UserListModal({ title, users, onClose }) {
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: 440 }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="sheet-head" style={{ "--head": "var(--accent)" }}>
          <span className="sheet-author">
            <span className="names">
              <span className="display">{title}</span>
            </span>
          </span>
        </div>

        <div style={{ padding: "var(--space-3)" }}>
          {users.length === 0 ? (
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
            users.map((u) => (
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
                    {u.displayName}
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
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
