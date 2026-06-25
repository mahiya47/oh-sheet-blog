import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Crown,
  Cake,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { CREATOR_ID, isBirthday } from "../lib/creator.js";
import { timeAgo } from "../lib/time.js";
import Avatar from "../components/Avatar.jsx";

export default function PostPage() {
  const { id } = useParams();
  const { getPost, getComments, addComment, toggleLike, currentUser } =
    useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const p = await getPost(id);
    setPost(p);
    if (p) setComments(await getComments(p.id));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <p style={{ textAlign: "center", padding: 40, color: "var(--text-dim)" }}>
        Loading…
      </p>
    );
  }
  if (!post) {
    return (
      <div className="empty">
        <p>That sheet doesn’t exist.</p>
        <p style={{ marginTop: 12 }}>
          <Link to="/feed">Back to the feed</Link>
        </p>
      </div>
    );
  }

  const author = {
    ...post.author,
    displayName: post.author?.name || post.author?.email?.split("@")[0],
    username: post.author?.username || post.author?.email?.split("@")[0],
  };

  const onLike = async () => {
    await toggleLike(post.id, post.likedByMe);
    setPost({ ...post, likedByMe: !post.likedByMe });
  };

  const onShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(
      () => toast("Link copied!", "accent"),
      () => toast("Could not copy.", "danger"),
    );
  };

  const onComment = async () => {
    if (!text.trim()) return;
    await addComment(post.id, text.trim());
    setText("");
    setComments(await getComments(post.id));
  };

  return (
    <div className="feed-col">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => navigate(-1)}
        style={{ alignSelf: "flex-start" }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <article className="sheet">
        <header className="sheet-head" style={{ "--head": "var(--accent)" }}>
          <Link to={`/profile/${author.id}`} className="sheet-author">
            <Avatar user={author} size={44} />
            <span className="names">
              <span className="display">
                {author.displayName}
                {author.id === CREATOR_ID && (
                  <span className="creator-badge">
                    <Crown size={10} /> Creator
                  </span>
                )}
                {isBirthday(author) && (
                  <Cake size={14} color="#000" style={{ marginLeft: 4 }} />
                )}
              </span>
              <span className="handle">
                @{author.username} · {timeAgo(post.createdAt)}
              </span>
            </span>
          </Link>
        </header>

        <div className="sheet-body">
          <p style={{ fontSize: "1.2rem" }}>{post.content}</p>
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt=""
              style={{
                width: "100%",
                marginTop: 12,
                borderRadius: "var(--radius)",
                border: "2px solid var(--border)",
              }}
            />
          )}
        </div>

        <footer className="sheet-foot">
          <button
            type="button"
            className={`stat ${post.likedByMe ? "liked" : ""}`}
            onClick={onLike}
          >
            <Heart size={18} fill={post.likedByMe ? "currentColor" : "none"} />
          </button>
          <button type="button" className="stat">
            <MessageCircle size={18} /> <span>{comments.length}</span>
          </button>
          <button type="button" className="stat" onClick={onShare}>
            <Share2 size={18} /> <span>Share</span>
          </button>
        </footer>
      </article>

      {currentUser && (
        <div className="panel" style={{ display: "flex", gap: 8, padding: 12 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && onComment()}
          />
          <button type="button" className="btn btn-accent" onClick={onComment}>
            Reply
          </button>
        </div>
      )}

      <div className="panel">
        {comments.length === 0 ? (
          <p
            style={{
              padding: 16,
              color: "var(--text-dim)",
              textAlign: "center",
            }}
          >
            No comments yet.
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="mini-row"
              style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
            >
              <Avatar
                user={{
                  ...c.user,
                  displayName: c.user?.name || c.user?.email?.split("@")[0],
                }}
                size={32}
              />
              <div>
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                  {c.user?.name ||
                    c.user?.username ||
                    c.user?.email?.split("@")[0]}
                </span>
                <p style={{ margin: 0 }}>{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
