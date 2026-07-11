import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useBidirectionalSticky } from "../lib/useBidirectionalSticky.js";
import Avatar from "./Avatar.jsx";

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
        border: "none",
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
    <aside className="rail-right-wrapper" aria-label="Activity">
      <div className="rail-right" ref={railRef}>
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
          <Link to="/following" className="more-link">
            View following feed
          </Link>
        </section>

        <div className="rail-divider" />

        <section className="panel">
          <h2 className="panel-head">Trending sheets</h2>
          {trending.length > 0 ? (
            trending
              .slice(0, MAX_ITEMS)
              .map((p) => <MiniRow key={p.id} post={p} />)
          ) : (
            <p className="empty-note">Nothing trending yet.</p>
          )}
          <Link to="/trending" className="more-link">
            View all trending
          </Link>
        </section>

        <div className="rail-divider" />

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

        {visibleSuggestions.length > 0 && (
          <>
            <div className="rail-divider" />
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
          </>
        )}

        <div className="rail-divider" />

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
      </div>
    </aside>
  );
}

const MAX_ITEMS = 5;

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
          <Link to="/following" className="more-link">
            View following feed
          </Link>
        </section>

        <section className="panel">
          <h2 className="panel-head">Trending sheets</h2>
          {trending.length > 0 ? (
            trending
              .slice(0, MAX_ITEMS)
              .map((p) => <MiniRow key={p.id} post={p} />)
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

        {visibleSuggestions.length > 0 && (
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
      </div>
    </aside>
  );
}
