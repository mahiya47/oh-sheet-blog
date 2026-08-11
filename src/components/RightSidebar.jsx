import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sheet, Trophy } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useBidirectionalSticky } from "../lib/useBidirectionalSticky.js";
import Avatar from "./Avatar.jsx";
import api from "../api";

const MAX_ITEMS = 5;

function MiniRow({ post }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="mini-row"
      style={{
        width: "100%",
        textAlign: "left",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
      onClick={() => navigate(`/post/${post.id}`)}
    >
      <span className="meta">@{post.author?.username || "anon"}</span>
      <span className="snippet">{post.content}</span>
    </button>
  );
}

function SuggestionRow({ user, onFollowed, isLast }) {
  const { toggleFollow } = useStore();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  const onFollow = async () => {
    setBusy(true);
    const ok = await toggleFollow(user.id, false);
    setBusy(false);
    if (ok) {
      setFollowing(true);
      onFollowed?.(user.id);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px var(--space-4)",
        borderBottom: isLast ? "none" : "1px solid var(--border-soft)",
      }}
    >
      <Link to={`/profile/${user.id}`} style={{ flexShrink: 0 }}>
        <Avatar user={user} size={36} />
      </Link>
      <Link
        to={`/profile/${user.id}`}
        style={{ flex: 1, minWidth: 0, color: "inherit" }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.85rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user.displayName}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          @{user.username}
        </div>
      </Link>
      <button
        type="button"
        className="btn btn-accent"
        onClick={onFollow}
        disabled={busy || following}
        style={{ fontSize: "0.7rem", padding: "6px 10px", flexShrink: 0 }}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

export default function RightSidebar() {
  const {
    currentUser,
    getFollowingSidebar,
    getTrending,
    getTrendingTags,
    getSuggestedUsers,
  } = useStore();
  const [following, setFollowing] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const trending = getTrending(MAX_ITEMS);
  const trendingTags = getTrendingTags(MAX_ITEMS);
  const railRef = useBidirectionalSticky(72, 16);

  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "/feed";
  const isChat = location.pathname.startsWith("/chat");
  const isSnakeGame = location.pathname === "/arcade/snake";
  const isOther = !isHome && !isChat && !isSnakeGame;

  // --- SNAKE LEADERBOARD STATE & FETCH ---
  const [topScores, setTopScores] = useState([]);

  useEffect(() => {
    if (isSnakeGame) {
      api
        .get("/arcade/snake/leaderboard")
        .then((res) => {
          const sortedData = res.data.sort((a, b) => b.score - a.score);
          setTopScores(sortedData.slice(0, 5)); // Keep only top 5 for sidebar
        })
        .catch(console.error);
    }
  }, [isSnakeGame]);

  // Home: everything. Chat: following + suggestions only.
  // Snake: Leaderboard only. Everywhere else: trending + tags.
  const showFollowingActivity = !isSnakeGame && (isHome || isChat);
  const showTrending = !isSnakeGame && (isHome || isOther);
  const showTags = !isSnakeGame && (isHome || isOther);
  const showSuggestions = !isSnakeGame && (isHome || isChat);
  const showFooter = true; // Footer always shows everywhere

  useEffect(() => {
    if (currentUser) {
      getFollowingSidebar(MAX_ITEMS).then(setFollowing);
    } else {
      setFollowing([]);
    }
    getSuggestedUsers().then(setSuggestions);
  }, [currentUser]);

  const dismissSuggestion = (userId) => {
    setSuggestions((prev) => prev.filter((u) => u.id !== userId));
  };

  const visibleSuggestions = suggestions.slice(0, MAX_ITEMS);

  return (
    <aside className="rail-right-wrapper" aria-label="Activity">
      <div className="rail-right" ref={railRef}>
        {/* --- SNAKE GAME LEADERBOARD PANEL --- */}
        {isSnakeGame && (
          <section className="panel">
            <h2
              className="panel-head"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Trophy size={16} style={{ color: "var(--accent)" }} /> Top 5
              Scores
            </h2>
            {topScores.length === 0 ? (
              <p className="empty-note">No scores yet.</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "0 var(--space-4) var(--space-4) var(--space-4)",
                }}
              >
                {topScores.map((entry, index) => (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom:
                        index === topScores.length - 1
                          ? "none"
                          : "1px solid var(--border-soft)",
                      padding: "10px 0",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      #{index + 1} {entry.user?.username || "Player"}
                    </span>
                    <strong
                      style={{ color: "var(--accent)", fontSize: "0.85rem" }}
                    >
                      {entry.score}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {showFollowingActivity && (
          <section className="panel">
            <h2 className="panel-head">Following activity</h2>
            {following.length > 0 ? (
              following
                .slice(0, MAX_ITEMS)
                .map((p) => <MiniRow key={p.id} post={p} />)
            ) : (
              <p className="empty-note">
                No recent posts from people you follow.
              </p>
            )}
          </section>
        )}

        {showTrending && (
          <section className="panel">
            <h2 className="panel-head">Trending sheets</h2>
            {trending.length > 0 ? (
              trending
                .slice(0, MAX_ITEMS)
                .map((p) => <MiniRow key={p.id} post={p} />)
            ) : (
              <p className="empty-note">Nothing trending yet.</p>
            )}
          </section>
        )}

        {showTags && (
          <section className="panel">
            <h2 className="panel-head">Trending tags</h2>
            {trendingTags.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  padding: "var(--space-4)",
                }}
              >
                {trendingTags.slice(0, MAX_ITEMS).map((t) => (
                  <Link key={t.name} to={`/tag/${t.name}`} className="tag">
                    #{t.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty-note">No tags yet.</p>
            )}
          </section>
        )}

        {showSuggestions && visibleSuggestions.length > 0 && (
          <section className="panel">
            <h2 className="panel-head">People you may know</h2>
            {visibleSuggestions.map((u, i) => (
              <SuggestionRow
                key={u.id}
                user={u}
                onFollowed={dismissSuggestion}
                isLast={i === visibleSuggestions.length - 1}
              />
            ))}
          </section>
        )}

        {showFooter && (
          <section className="panel mini-footer">
            <div className="links">
              <Link to="/about">About</Link>
              <Link to="/rules">Rules</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/agreement">Agreement</Link>
            </div>
            <div className="copy">
              <Sheet size={14} />
              <span>© 2026 Oh Sheet! Inc.</span>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
