import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sheet } from "lucide-react";
import SheetCard from "./SheetCard.jsx";

export default function Feed({
  posts,
  emptyTitle = "No sheets here yet.",
  emptyHint,
  emptyTo,
  emptyToLabel,
  onLoadMore,
}) {
  const sentinelRef = useRef(null);
  const [fetching, setFetching] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!onLoadMore || done || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || fetching) return;
        setFetching(true);
        const hasMore = await onLoadMore();
        if (!hasMore) setDone(true);
        setFetching(false);
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onLoadMore, fetching, done]);

  if (!posts || posts.length === 0) {
    return (
      <div className="empty">
        <Sheet size={32} />
        <p>{emptyTitle}</p>
        {emptyHint && <p style={{ marginTop: 6 }}>{emptyHint}</p>}
        {emptyTo && (
          <p style={{ marginTop: 12 }}>
            <Link to={emptyTo}>{emptyToLabel || "Explore"}</Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="feed-col">
      {posts.map((post) => (
        <SheetCard key={post.id} post={post} />
      ))}
      {onLoadMore && !done && (
        <div
          ref={sentinelRef}
          style={{ textAlign: "center", padding: 16, opacity: 0.6 }}
        >
          {fetching ? "Loading more sheets…" : ""}
        </div>
      )}
    </div>
  );
}
