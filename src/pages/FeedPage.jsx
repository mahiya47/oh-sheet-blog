import { useState, useEffect } from "react";
import { useStore } from "../lib/store.jsx";
import Feed from "../components/Feed.jsx";
import SortBar from "../components/SortBar.jsx";

export default function FeedPage() {
  const { getFeed, posts, loading, sortPosts } = useStore();
  const [sort, setSort] = useState("new");

  useEffect(() => {
    getFeed();
  }, [getFeed]);

  const sorted = sortPosts(posts, sort);

  return (
    <>
      <SortBar sort={sort} setSort={setSort} />

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
          posts={sorted}
          emptyTitle="No sheets yet."
          emptyHint="Be the first to post one."
          emptyTo="/create"
          emptyToLabel="Create a sheet"
        />
      )}
    </>
  );
}
