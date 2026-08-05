import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Crown, Info, Flame } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { CREATOR_ID } from "../lib/creator.js";
import Avatar from "../components/Avatar.jsx";

const POINTS_TABLE = [
  { action: "Post a sheet", points: "+10" },
  { action: "Someone likes your sheet", points: "+2" },
  { action: "Someone comments on your sheet", points: "+3" },
  { action: "You comment on a sheet", points: "+1" },
  { action: "Daily login", points: "+1" },
];

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
        Top 20 members by activity. Post, comment, like, and log in daily to
        climb.
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
                  {u.currentStreak > 2 && (
                    <span
                      style={{
                        color: "#ff8c3e",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        fontSize: "0.8rem",
                      }}
                    >
                      <Flame size={14} fill="currentColor" /> {u.currentStreak}
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

      <div className="panel" style={{ padding: 20 }}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "1rem",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          <Info size={16} /> How points work
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {POINTS_TABLE.map((row) => (
            <div
              key={row.action}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.9rem",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{row.action}</span>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                {row.points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
