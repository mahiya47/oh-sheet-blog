import { Sparkles, X } from "lucide-react";

export default function WelcomeModal({ onClose }) {
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
        aria-label="Welcome"
        style={{ maxWidth: 520 }}
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
            <Sparkles size={22} color="#000" />
            <span className="names">
              <span className="display">Welcome to Oh Sheet!</span>
            </span>
          </span>
        </div>

        <div
          style={{
            padding: "var(--space-5)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <p>Hey, glad you're here! A few quick things to know:</p>

          <div>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>📝 Post "sheets"</p>
            <p style={{ color: "var(--text-muted)" }}>
              Share short thoughts through sheets. Click any tag to see related
              posts.
            </p>
          </div>

          <div>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>
              🎨 Colorful by design
            </p>
            <p style={{ color: "var(--text-muted)" }}>
              The colored bar on each post is random — it changes every time the
              page refreshes. That's normal, not a bug!
            </p>
          </div>

          <div>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>🏆 Earn points</p>
            <p style={{ color: "var(--text-muted)" }}>
              Posting, commenting, getting likes, and logging in daily all earn
              points. Climb the Leaderboard!
            </p>
          </div>

          <div>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>🤝 Be kind</p>
            <p style={{ color: "var(--text-muted)" }}>
              Keep it friendly — no hate, harassment, or bad language. Treat
              people the way you'd want to be treated.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-accent btn-block"
            onClick={onClose}
          >
            Got it — let's go!
          </button>
        </div>
      </div>
    </div>
  );
}
