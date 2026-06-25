import { useEffect, useState } from "react";
import { useStore } from "../lib/store.jsx";
import Feed from "../components/Feed.jsx";
import SortBar from "../components/SortBar.jsx";

export default function TrendingPage() {
  const { getFeed, getTrending, sortPosts } = useStore();
  const [sort, setSort] = useState("new");

  useEffect(() => {
    getFeed();
  }, [getFeed]);

  const sorted = sortPosts(getTrending(20), sort);

  return (
    <>
      <h1 style={{ textTransform: "uppercase", fontSize: "1.4rem" }}>
        Trending sheets
      </h1>
      <SortBar sort={sort} setSort={setSort} />
      <Feed posts={sorted} emptyTitle="Nothing trending yet." />
    </>
  );
}
