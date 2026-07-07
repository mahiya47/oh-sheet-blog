import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sheet } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useModal } from "../context/ModalContext.jsx";
import Avatar from "./Avatar.jsx";

function MiniRow({ post }) {
  const { openPost } = useModal();
  return (
    <button
      type="button"
      className="mini-row"
      style={{
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
      }}
      onClick={() => openPost(post.id)}
    >
      <span className="meta">@{post.author?.username || "anon"}</span>
      <span className="snippet">{post.content}</span>
    </button>
  );
}

function SuggestionRow({ user, onFollowed }) {
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
        padding: "10px var(--space-4)",
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
        className="btn btn-ghost"
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
  const trending = getTrending(4);
  const trendingTags = getTrendingTags(6);

  useEffect(() => {
    if (currentUser) {
      getFollowingSidebar(3).then(setFollowing);
    } else {
      setFollowing([]);
    }
    getSuggestedUsers().then(setSuggestions);
  }, [currentUser]);

  const dismissSuggestion = (userId) => {
    setSuggestions((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <aside className="rail-right" aria-label="Activity">
      <section className="panel">
        <h2 className="panel-head">Following activity</h2>
        {following.length > 0 ? (
          following.map((p) => <MiniRow key={p.id} post={p} />)
        ) : (
          <p className="empty-note">No recent posts from people you follow.</p>
        )}
        <Link to="/following" className="more-link">
          View following feed
        </Link>
      </section>

      <section className="panel">
        <h2 className="panel-head">Trending sheets</h2>
        {trending.length > 0 ? (
          trending.map((p) => <MiniRow key={p.id} post={p} />)
        ) : (
          <p className="empty-note">Nothing trending yet.</p>
        )}
        <Link to="/trending" className="more-link">
          View all trending
        </Link>
      </section>

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
            {trendingTags.map((t) => (
              <Link key={t.name} to={`/tag/${t.name}`} className="tag">
                #{t.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-note">No tags yet.</p>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="panel">
          <h2 className="panel-head">People you may know</h2>
          {suggestions.map((u) => (
            <SuggestionRow key={u.id} user={u} onFollowed={dismissSuggestion} />
          ))}
        </section>
      )}

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
    </aside>
  );
}
