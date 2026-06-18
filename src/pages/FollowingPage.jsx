import { useEffect } from "react";
import { useStore } from "../lib/store.jsx";
import Feed from "../components/Feed.jsx";

export default function FollowingPage() {
  const { getFollowingFeed, posts, loading } = useStore();

  useEffect(() => {
    getFollowingFeed();
  }, [getFollowingFeed]);

  return (
    <>
      <h1 style={{ textTransform: "uppercase", fontSize: "1.4rem" }}>
        Following feed
      </h1>
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
          posts={posts}
          emptyTitle="No sheets from people you follow yet."
          emptyHint="Follow some people and their sheets will show up here."
          emptyTo="/feed"
          emptyToLabel="Explore sheets"
        />
      )}
    </>
  );
}
