import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Heart, Share2, Trash2, Crown } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { colorFor, timeAgo } from "../lib/time.js";
import Avatar from "./Avatar.jsx";
import { CREATOR_ID } from "../lib/creator.js";

export default function PostModal({ postId, onClose }) {
  const {
    currentUser,
    posts,
    getComments,
    toggleLike,
    addComment,
    deleteComment,
  } = useStore();
  const toast = useToast();
  const [text, setText] = useState("");
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const found = posts.find((p) => p.id === postId);
    if (!found) {
      onClose();
      return;
    }
    setPost(found);
    loadComments();
  }, [postId, posts]);

  const loadComments = async () => {
    const data = await getComments(postId);
    const normalized = data.map((c) => ({
      ...c,
      author: {
        ...c.user,
        username: c.user?.username || c.user?.email?.split("@")[0],
        displayName: c.user?.name || c.user?.email?.split("@")[0],
      },
    }));
    setComments(normalized);
  };

  const submit = async () => {
    if (!text.trim()) return;
    await addComment(postId, text);
    setText("");
    loadComments();
  };

  const onShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(
      () => toast("Link copied!", "accent"),
      () => toast("Could not copy link.", "danger"),
    );
  };

  const onDeleteComment = async (commentId) => {
    await deleteComment(postId, commentId);
    loadComments();
  };

  if (!post) return null;

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Sheet detail"
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <header className="sheet-head" style={{ "--head": post.color }}>
          <Link
            to={`/profile/${post.author?.id}`}
            className="sheet-author"
            onClick={onClose}
          >
            <Avatar user={post.author} size={44} />
            <span className="names">
              <span className="display">
                {post.author?.displayName}
                {post.author?.id === CREATOR_ID && (
                  <span className="creator-badge">
                    <Crown size={10} /> Creator
                  </span>
                )}
              </span>
              <span className="handle">
                @{post.author?.username} · {timeAgo(post.createdAt)}
              </span>
            </span>
          </Link>
        </header>

        <div className="sheet-body">
          <p style={{ fontSize: "1.2rem" }}>{post.content}</p>
          {post.tags?.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 12,
              }}
            >
              {post.tags.map((pt) => (
                <Link
                  key={pt.tag?.id || pt.tag?.name}
                  to={`/tag/${pt.tag?.name}`}
                  className="tag"
                  onClick={onClose}
                >
                  #{pt.tag?.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <footer className="sheet-foot">
          <button
            type="button"
            className={`stat ${post.likedByMe ? "liked" : ""}`}
            onClick={() => toggleLike(post.id, post.likedByMe)}
            aria-pressed={post.likedByMe}
          >
            <Heart size={18} fill={post.likedByMe ? "currentColor" : "none"} />{" "}
            <span>{post.likeCount}</span>
          </button>
          <button type="button" className="stat" onClick={onShare}>
            <Share2 size={18} /> <span>Share</span>
          </button>
        </footer>

        <div className="comments">
          <h3>Comments ({comments.length})</h3>

          {comments.length === 0 && (
            <p style={{ color: "var(--text-dim)", padding: "8px 0" }}>
              No comments yet. Start the thread.
            </p>
          )}

          {comments.map((c) => (
            <div className="comment" key={c.id}>
              <div style={{ display: "flex", gap: 10 }}>
                <Avatar user={c.author} size={28} />
                <div>
                  <Link
                    to={`/profile/${c.author?.id}`}
                    className="who"
                    onClick={onClose}
                  >
                    @{c.author?.username}
                  </Link>
                  <p className="what">{c.content}</p>
                </div>
              </div>
              {currentUser && c.userId === currentUser.id && (
                <button
                  type="button"
                  className="del"
                  onClick={() => onDeleteComment(c.id)}
                  aria-label="Delete comment"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}

          {currentUser ? (
            <div className="comment-form">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
                placeholder="Write a comment…  (⌘/Ctrl + Enter to post)"
                aria-label="Write a comment"
              />
              <button type="button" className="btn btn-accent" onClick={submit}>
                Post
              </button>
            </div>
          ) : (
            <p style={{ color: "var(--text-dim)", marginTop: 12 }}>
              Sign in to join the conversation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
