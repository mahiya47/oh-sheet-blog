import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sheet } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useModal } from "../context/ModalContext.jsx";

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

export default function RightSidebar() {
  const { currentUser, getFollowingSidebar, getTrending, getTrendingTags } =
    useStore();
  const [following, setFollowing] = useState([]);
  const trending = getTrending(4);
  const trendingTags = getTrendingTags(6);

  useEffect(() => {
    if (currentUser) {
      getFollowingSidebar(3).then(setFollowing);
    } else {
      setFollowing([]);
    }
  }, [currentUser]);

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
