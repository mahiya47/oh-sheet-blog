import { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import Feed from "../components/Feed.jsx";

export default function FeedPage() {
  const { getFeed, posts, loading } = useStore();
  const [sort, setSort] = useState("hot");

  useEffect(() => {
    getFeed();
  }, [getFeed]);

  return (
    <>
      <div className="sortbar">
        <span className="label">
          <Flame size={16} /> Sort
        </span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort sheets"
        >
          <option value="hot">Hot</option>
          <option value="new">New</option>
          <option value="top">Top</option>
        </select>
      </div>

      {loading ? (
        <p
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-dim)",
          }}
        >
          Loading sheets…
        </p>
      ) : (
        <Feed
          posts={posts}
          emptyTitle="No sheets yet."
          emptyHint="Be the first to post one."
          emptyTo="/create"
          emptyToLabel="Create a sheet"
        />
      )}
    </>
  );
}
