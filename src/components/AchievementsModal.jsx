import { X } from "lucide-react";
import Badge from "./Badge.jsx";

export default function AchievementsModal({ badges, onClose }) {
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
        aria-label="Achievements"
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
            textTransform: "uppercase",
            fontSize: "1.1rem",
            marginBottom: 16,
          }}
        >
          Achievements
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {badges.map((b) => (
            <Badge key={b.label} badge={b} />
          ))}
        </div>
      </div>
    </div>
  );
}
