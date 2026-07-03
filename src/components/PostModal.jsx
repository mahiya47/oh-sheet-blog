import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Heart, Share2, Trash2, Crown, CornerDownRight } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { colorFor, timeAgo } from "../lib/time.js";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
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
  const [replyTo, setReplyTo] = useState(null); // { id, username } or null

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

  const normalizeUser = (u) => ({
    ...u,
    username: u?.username || u?.email?.split("@")[0],
    displayName: u?.name || u?.email?.split("@")[0],
  });

  const loadComments = async () => {
    const data = await getComments(postId);
    const normalized = data.map((c) => ({
      ...c,
      author: normalizeUser(c.user),
      replies: (c.replies || []).map((r) => ({
        ...r,
        author: normalizeUser(r.user),
      })),
    }));
    setComments(normalized);
  };

  const submit = async () => {
    if (!text.trim()) return;
    await addComment(postId, text, replyTo?.id || null);
    setText("");
    setReplyTo(null);
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

  const startReply = (comment) => {
    setReplyTo({ id: comment.id, username: comment.author?.username });
  };

  if (!post) return null;

  const totalComments = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0),
    0,
  );

  const renderComment = (c, isReply = false) => (
    <div
      className="comment"
      key={c.id}
      style={isReply ? { marginLeft: 38 } : undefined}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <Avatar user={c.author} size={28} />
        <div>
          <Link
            to={`/profile/${c.author?.id}`}
            className="who"
            onClick={onClose}
          >
            @{c.author?.username}
            {c.author?.emailVerified && <VerifiedBadge size={12} />}
          </Link>
          <p className="what">{c.content}</p>
          {currentUser && !isReply && (
            <button
              type="button"
              onClick={() => startReply(c)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                padding: 0,
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <CornerDownRight size={12} /> Reply
            </button>
          )}
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
  );

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
                {post.author?.emailVerified && <VerifiedBadge size={14} />}
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
          <h3>Comments ({totalComments})</h3>

          {comments.length === 0 && (
            <p style={{ color: "var(--text-dim)", padding: "8px 0" }}>
              No comments yet. Start the thread.
            </p>
          )}

          {comments.map((c) => (
            <div key={c.id}>
              {renderComment(c)}
              {c.replies?.map((r) => renderComment(r, true))}
            </div>
          ))}

          {currentUser ? (
            <div>
              {replyTo && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    marginBottom: 6,
                  }}
                >
                  <CornerDownRight size={13} />
                  Replying to @{replyTo.username}
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--danger, #ff3e3e)",
                      fontSize: "0.8rem",
                      padding: 0,
                    }}
                  >
                    ✕ cancel
                  </button>
                </div>
              )}
              <div className="comment-form">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                  }}
                  placeholder={
                    replyTo
                      ? `Reply to @${replyTo.username}…`
                      : "Write a comment"
                  }
                  aria-label="Write a comment"
                />
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={submit}
                >
                  {replyTo ? "Reply" : "Post"}
                </button>
              </div>
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
