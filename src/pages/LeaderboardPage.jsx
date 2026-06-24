import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Crown } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { CREATOR_ID } from "../lib/creator.js";
import Avatar from "../components/Avatar.jsx";

export default function LeaderboardPage() {
  const { getLeaderboard } = useStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="feed-col">
      <h1
        style={{
          textTransform: "uppercase",
          fontSize: "1.4rem",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Trophy size={22} /> Leaderboard
      </h1>
      <p style={{ color: "var(--text-muted)", marginTop: -8 }}>
        Top members by activity. Post, comment, like, and log in daily to climb.
      </p>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          Loading…
        </div>
      ) : users.length === 0 ? (
        <div className="empty">
          <p>No rankings yet.</p>
        </div>
      ) : (
        <div className="panel">
          {users.map((u, i) => (
            <Link
              key={u.id}
              to={`/profile/${u.id}`}
              className="mini-row"
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <span
                style={{
                  fontWeight: 700,
                  width: 24,
                  color: i < 3 ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {i + 1}
              </span>
              <Avatar user={u} size={36} />
              <span
                style={{
                  flex: 1,
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
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                {u.score} pts
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
