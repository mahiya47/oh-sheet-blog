import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import Feed from "../components/Feed.jsx";

export default function TagPage() {
  const { name } = useParams();
  const { getPostsByTag } = useStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPostsByTag(name).then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, [name]);

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
      {loading ? (
        <div className="loading">
          <div className="spinner" />
          Loading…
        </div>
      ) : (
        <Feed posts={posts} emptyTitle={`No sheets tagged #${name} yet.`} />
      )}
    </div>
  );
}
