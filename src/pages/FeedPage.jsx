import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PenLine } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import Feed from "../components/Feed.jsx";
import SortBar from "../components/SortBar.jsx";
import Avatar from "../components/Avatar.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";

export default function FeedPage() {
  const { getFeed, posts, loading, sortPosts, currentUser, loadMorePosts } =
    useStore();
  const [sort, setSort] = useState("new");
  const navigate = useNavigate();

  useEffect(() => {
    getFeed();
  }, [getFeed]);

  const sorted = sortPosts(posts, sort);

  return (
    <>
      <SortBar sort={sort} setSort={setSort} />

      {currentUser && (
        <button
          type="button"
          onClick={() => navigate("/create")}
          className="panel feed-composer-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 14,
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            border: "2px solid var(--border)",
            borderRadius: "var(--radius)",
            background: "var(--surface, transparent)",
          }}
        >
          <Avatar user={currentUser} size={40} />
          <span
            style={{
              flex: 1,
              color: "var(--text-muted)",
              padding: "10px 14px",
              borderRadius: "var(--radius, 10px)",
              border: "2px solid var(--border)",
            }}
          >
            Share a sheet, {currentUser.displayName || currentUser.username}…
          </span>
          <span
            className="btn btn-accent"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              pointerEvents: "none",
            }}
          >
            <PenLine size={16} /> Post
          </span>
        </button>
      )}

      {loading ? (
        <div className="feed-col">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <Feed
          posts={sorted}
          onLoadMore={loadMorePosts}
          emptyTitle="No sheets yet."
          emptyHint="Be the first to post one."
          emptyTo="/create"
          emptyToLabel="Create a sheet"
        />
      )}
    </>
  );
}
