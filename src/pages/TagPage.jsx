import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import Feed from "../components/Feed.jsx";
import SortBar from "../components/SortBar.jsx";

export default function TagPage() {
  const { name } = useParams();
  const { getPostsByTag, sortPosts } = useStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("hot");

  useEffect(() => {
    setLoading(true);
    getPostsByTag(name).then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, [name]);

  const sorted = sortPosts(posts, sort);

  return (
    <div className="feed-col">
      <Link
        to="/feed"
        className="btn btn-ghost"
        style={{ alignSelf: "flex-start" }}
      >
        <ArrowLeft size={16} /> Back to feed
      </Link>
      <h2 style={{ textTransform: "uppercase" }}>#{name}</h2>
      <SortBar sort={sort} setSort={setSort} />
      {loading ? (
        <div className="loading">
          <div className="spinner" />
          Loading…
        </div>
      ) : (
        <Feed posts={sorted} emptyTitle={`No sheets tagged #${name} yet.`} />
      )}
    </div>
  );
}
