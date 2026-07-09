import { useState } from "react";
import { X, Flag } from "lucide-react";

const REASONS = [
  "Spam",
  "Harassment or bullying",
  "Hate speech",
  "Impersonation",
  "Inappropriate content",
  "Something else",
];

export default function ReportModal({ username, onClose, onSubmit }) {
  const [reason, setReason] = useState(REASONS[0]);

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
        aria-label="Report user"
        style={{ maxWidth: 380, padding: 20 }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textTransform: "uppercase",
            fontSize: "1.05rem",
            marginBottom: 6,
          }}
        >
          <Flag size={17} /> Report @{username}
        </h3>
        <p className="hint" style={{ marginBottom: 16 }}>
          Tell us what's going on. We'll review this account.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {REASONS.map((r) => (
            <label
              key={r}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: "var(--radius)",
                border: "2px solid var(--border-soft)",
                cursor: "pointer",
                fontSize: "0.88rem",
                fontWeight: reason === r ? 700 : 400,
              }}
            >
              <input
                type="radio"
                name="report-reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
              />
              {r}
            </label>
          ))}
        </div>

        <div className="editor-foot" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onSubmit(reason)}
          >
            Submit report
          </button>
        </div>
      </div>
    </div>
  );
}
