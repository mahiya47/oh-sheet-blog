import { useEffect } from "react";
import { useStore } from "../lib/store.jsx";
import Feed from "../components/Feed.jsx";

export default function TrendingPage() {
  const { getFeed, getTrending } = useStore();

  useEffect(() => {
    getFeed();
  }, [getFeed]);

  const posts = getTrending(20);

  return (
    <>
      <h1 style={{ textTransform: "uppercase", fontSize: "1.4rem" }}>
        Trending sheets
      </h1>
      <Feed posts={posts} emptyTitle="Nothing trending yet." />
    </>
  );
}
