import { useEffect, useState } from "react";
import { useStore } from "../lib/store.jsx";
import Feed from "../components/Feed.jsx";
import SortBar from "../components/SortBar.jsx";

export default function FollowingPage() {
  const { getFollowingFeed, posts, loading, sortPosts } = useStore();
  const [sort, setSort] = useState("hot");

  useEffect(() => {
    getFollowingFeed();
  }, [getFollowingFeed]);

  const sorted = sortPosts(posts, sort);

  return (
    <>
      <h1 style={{ textTransform: "uppercase", fontSize: "1.4rem" }}>
        Following feed
      </h1>
      <SortBar sort={sort} setSort={setSort} />
      {loading ? (
        <p
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-dim)",
          }}
        >
          Loading…
        </p>
      ) : (
        <Feed
          posts={sorted}
          emptyTitle="No sheets from people you follow yet."
          emptyHint="Follow some people and their sheets will show up here."
          emptyTo="/feed"
          emptyToLabel="Explore sheets"
        />
      )}
    </>
  );
}
