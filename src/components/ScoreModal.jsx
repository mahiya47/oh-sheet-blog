import { Trophy, X } from "lucide-react";

export default function ScoreModal({ isOpen, onClose, leaderboard }) {
  if (!isOpen) return null;

  return (
    <div className="arcade-modal-overlay" onClick={onClose}>
      <div
        className="arcade-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="arcade-modal-header">
          <h3 className="arcade-modal-title">
            <Trophy size={20} /> Top 10 High Scores
          </h3>
          <button className="arcade-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <p className="arcade-modal-empty">No scores logged yet.</p>
        ) : (
          <div className="arcade-modal-list">
            {leaderboard.map((entry, index) => (
              <div key={entry.id || index} className="arcade-modal-item">
                <span className="arcade-modal-rank">
                  #{index + 1} {entry.user?.username || "Player"}
                </span>
                <strong className="arcade-modal-score">
                  {entry.score} pts
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
