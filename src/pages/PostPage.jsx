import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  Eye,
  MoreHorizontal,
  Flag,
  Trash2,
  Pencil,
  UserRound,
  Repeat2,
  CornerDownRight,
  Cake,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { CREATOR_ID, isBirthday } from "../lib/creator.js";
import { timeAgo } from "../lib/time.js";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import { getVerifiedVariant } from "../lib/verifiedVariant.js";
import ReactionPicker from "../components/ReactionPicker.jsx";
import ReactionsModal from "../components/ReactionsModal.jsx";
import { useClickAway } from "../lib/useClickAway.js";

export default function PostPage() {
  const { id } = useParams();
  const {
    getPost,
    getComments,
    addComment,
    deleteComment,
    currentUser,
    reactToPost,
    getPostReactions,
    REACTION_EMOJI,
    toggleFollow,
    deletePost,
    editPost,
    createPost,
  } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reactionsModal, setReactionsModal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [reposting, setReposting] = useState(false);
  const [repostText, setRepostText] = useState("");
  const [justFollowed, setJustFollowed] = useState(false);
  const menuRef = useRef(null);
  const commentBoxRef = useRef(null);
  useClickAway(menuRef, () => setMenuOpen(false), menuOpen);

  const normalizeUser = (u) => ({
    ...u,
    username: u?.username || u?.email?.split("@")[0],
    displayName: u?.name || u?.email?.split("@")[0],
  });

  const loadComments = async (postId) => {
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

  const load = async () => {
    setLoading(true);
    const p = await getPost(id);
    setPost(p);
    setDraft(p?.content || "");
    if (p) await loadComments(p.id);
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
  const mine = currentUser && author.id === currentUser.id;
  const isCreatorProfile = author.id === CREATOR_ID;

  const totalComments = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0),
    0,
  );

  const stop = (e) => e.stopPropagation();

  const onShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(
      () => toast("Link copied!", "accent"),
      () => toast("Could not copy.", "danger"),
    );
  };

  const onShowReactions = async () => {
    if (!post || post.likeCount === 0) return;
    const data = await getPostReactions(post.id);
    setReactionsModal(data);
  };

  const onFollowAuthor = async () => {
    const ok = await toggleFollow(author.id, false);
    if (ok) {
      setJustFollowed(true);
      toast(`Following @${author.username}.`, "accent");
    }
  };

  const onDeletePost = async () => {
    setMenuOpen(false);
    await deletePost(post.id);
    toast("Sheet deleted.", "danger");
    navigate("/feed");
  };

  const onSaveEdit = async () => {
    if (!draft.trim()) return toast("Sheet can't be empty.", "danger");
    const ok = await editPost(post.id, draft.trim());
    if (ok) {
      toast("Sheet updated.", "accent");
      setEditing(false);
      load();
    } else {
      toast("Could not update.", "danger");
    }
  };

  const onRepost = () => {
    setRepostText("");
    setReposting(true);
  };

  const onConfirmRepost = async () => {
    const originalId = post.repostOfId || post.id;
    await createPost(repostText.trim(), [], "", originalId);
    setReposting(false);
    toast("Reposted to your profile.", "accent");
  };

  const onGoToComments = () => {
    commentBoxRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const submit = async () => {
    if (!text.trim()) return;
    await addComment(post.id, text.trim(), replyTo?.id || null);
    setText("");
    setReplyTo(null);
    loadComments(post.id);
  };

  const onDeleteComment = async (commentId) => {
    await deleteComment(post.id, commentId);
    loadComments(post.id);
  };

  const startReply = (comment) => {
    setReplyTo({ id: comment.id, username: comment.author?.username });
  };

  const renderComment = (c, isReply = false) => (
    <div
      className="comment"
      key={c.id}
      style={isReply ? { marginLeft: 38 } : undefined}
    >
      <div style={{ display: "flex", gap: 10, minWidth: 0, flex: 1 }}>
        <Avatar user={c.author} size={28} />
        <div style={{ minWidth: 0 }}>
          <Link to={`/profile/${c.author?.id}`} className="who">
            @{c.author?.username}
            {c.author?.emailVerified && (
              <VerifiedBadge
                size={12}
                variant={getVerifiedVariant(
                  c.author,
                  c.author?.id === CREATOR_ID,
                )}
              />
            )}
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
        <header
          className="sheet-head"
          style={{ "--head": post.color || "var(--accent)" }}
        >
          <Link to={`/profile/${author.id}`} className="sheet-author">
            <Avatar user={author} size={44} />
            <span className="names">
              <span className="display">
                {author.displayName}
                {author.emailVerified && (
                  <VerifiedBadge
                    size={14}
                    variant={getVerifiedVariant(author, isCreatorProfile)}
                  />
                )}
                {isBirthday(author) && (
                  <Cake
                    size={14}
                    color="#000"
                    style={{ marginLeft: 4, verticalAlign: "middle" }}
                  />
                )}
              </span>
              <span className="handle">
                @{author.username} · {timeAgo(post.createdAt)}
              </span>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!mine && !post.isFollowedByMe && !justFollowed && (
              <button
                type="button"
                className="btn btn-accent"
                onClick={onFollowAuthor}
                style={{ fontSize: "0.7rem", padding: "5px 10px" }}
              >
                Follow
              </button>
            )}
            <div className="more" ref={menuRef}>
              <button
                type="button"
                className="more-trigger"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="More options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <MoreHorizontal size={20} />
              </button>
              {menuOpen && (
                <div className="more-menu" role="menu">
                  <Link
                    to={`/profile/${author.id}`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserRound size={15} /> Visit profile
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      toast("Thanks — we'll take a look at this sheet.");
                    }}
                  >
                    <Flag size={15} /> Report
                  </button>
                  {mine && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        setDraft(post.content);
                        setEditing(true);
                      }}
                    >
                      <Pencil size={15} /> Edit
                    </button>
                  )}
                  {mine && (
                    <button
                      type="button"
                      className="danger"
                      role="menuitem"
                      onClick={onDeletePost}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {reposting && (
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "2px solid var(--border)",
            }}
          >
            <textarea
              value={repostText}
              onChange={(e) => setRepostText(e.target.value)}
              placeholder="Add a comment (optional)…"
              style={{ width: "100%", minHeight: 60 }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-accent"
                onClick={onConfirmRepost}
              >
                Repost
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setReposting(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="sheet-body">
          {editing ? (
            <div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                style={{ width: "100%", minHeight: 90 }}
                autoFocus
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={onSaveEdit}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "1.2rem" }}>{post.content}</p>
          )}

          {post.tags?.length > 0 && !editing && (
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
                >
                  #{pt.tag?.name}
                </Link>
              ))}
            </div>
          )}

          {post.imageUrl && !editing && (
            <div className="sheet-media">
              <img
                src={post.imageUrl}
                alt=""
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: 640,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          )}

          {post.repostOf && !editing && (
            <div
              onClick={() => navigate(`/post/${post.repostOf.id}`)}
              style={{
                marginTop: 12,
                padding: 12,
                border: "2px solid var(--border)",
                borderRadius: "var(--radius)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <Avatar user={post.repostOf.author} size={24} />
                <b style={{ fontSize: "0.85rem" }}>
                  {post.repostOf.author?.name || post.repostOf.author?.username}
                </b>
                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                  @{post.repostOf.author?.username} ·{" "}
                  {timeAgo(post.repostOf.createdAt)}
                </span>
              </div>
              <p style={{ fontSize: "0.9rem" }}>{post.repostOf.content}</p>
              {post.repostOf.imageUrl && (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 10",
                    marginTop: 8,
                    borderRadius: "var(--radius)",
                    background: "rgba(128, 128, 128, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={post.repostOf.imageUrl}
                    alt=""
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {post.repostOfId && !post.repostOf && !editing && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                border: "2px dashed var(--border)",
                borderRadius: "var(--radius)",
                opacity: 0.6,
                fontSize: "0.85rem",
              }}
            >
              This sheet was deleted.
            </div>
          )}
        </div>

        <footer
          className="sheet-foot"
          onClick={stop}
          onTouchStart={stop}
          onTouchEnd={stop}
          onContextMenu={stop}
          style={{
            display: "flex",
            width: "100%",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
            touchAction: "manipulation",
          }}
        >
          <ReactionPicker
            current={post.myReaction}
            onPick={(type) => reactToPost(post.id, type)}
          >
            <button
              type="button"
              className={`stat ${post.likedByMe ? "liked" : ""}`}
              onClick={(e) => {
                stop(e);
                reactToPost(post.id, post.myReaction || "heart");
              }}
              aria-pressed={post.likedByMe}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>
                {post.myReaction ? REACTION_EMOJI[post.myReaction] : "❤️"}
              </span>
              <span>{post.likeCount}</span>
            </button>
          </ReactionPicker>
          <button
            type="button"
            className="stat"
            onClick={(e) => {
              stop(e);
              onGoToComments();
            }}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <MessageCircle size={18} /> <span>{post.commentCount}</span>
          </button>
          <button
            type="button"
            className="stat"
            onClick={(e) => {
              stop(e);
              onRepost();
            }}
            aria-label="Repost"
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Repeat2 size={18} /> <span className="stat-label">Repost</span>
          </button>
          <button
            type="button"
            className="stat"
            onClick={onShare}
            aria-label="Share"
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Share2 size={18} /> <span className="stat-label">Share</span>
          </button>
          {post.likeCount > 0 && (
            <button
              type="button"
              className="stat"
              onClick={onShowReactions}
              aria-label="See reactions"
              style={{ flex: 1, justifyContent: "center" }}
            >
              <Eye size={16} />{" "}
              <span className="stat-label">See reactions</span>
            </button>
          )}
        </footer>
      </article>

      {currentUser && (
        <div className="comments" style={{ borderTop: "none" }}>
          {replyTo && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: 8,
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
          <div
            className="comment-form"
            style={{ marginTop: 0 }}
            ref={commentBoxRef}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
              }}
              placeholder={
                replyTo ? `Reply to @${replyTo.username}…` : "Write a comment"
              }
              aria-label="Write a comment"
            />
            <button type="button" className="btn btn-accent" onClick={submit}>
              {replyTo ? "Reply" : "Post"}
            </button>
          </div>
        </div>
      )}

      <div className="comments">
        <h3>Comments ({totalComments})</h3>
        {comments.length === 0 ? (
          <p style={{ color: "var(--text-dim)", padding: "8px 0" }}>
            No comments yet.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id}>
              {renderComment(c)}
              {c.replies?.map((r) => renderComment(r, true))}
            </div>
          ))
        )}
      </div>

      {reactionsModal && (
        <ReactionsModal
          counts={reactionsModal.counts}
          users={reactionsModal.users}
          onClose={() => setReactionsModal(null)}
        />
      )}
    </div>
  );
}
