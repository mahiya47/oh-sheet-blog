import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Repeat2,
  Share2,
  MoreHorizontal,
  Flag,
  Trash2,
  Pencil,
  UserRound,
  Crown,
  Cake,
  Eye,
  Heart,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useClickAway } from "../lib/useClickAway.js";
import { colorFor, timeAgo } from "../lib/time.js";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import { getVerifiedVariant } from "../lib/verifiedVariant.js";
import { CREATOR_ID, isBirthday } from "../lib/creator.js";
import ReactionPicker from "./ReactionPicker.jsx";
import ReactionsModal from "./ReactionsModal.jsx";

const DOUBLE_TAP_DELAY = 350;

export default function SheetCard({ post }) {
  const {
    currentUser,
    toggleLike,
    createPost,
    deletePost,
    editPost,
    toggleFollow,
    getPostReactions,
    reactToPost,
    REACTION_EMOJI,
  } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [reposting, setReposting] = useState(false);
  const [repostText, setRepostText] = useState("");
  const [reactionsModal, setReactionsModal] = useState(null);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const menuRef = useRef(null);
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  useClickAway(menuRef, () => setMenuOpen(false), menuOpen);

  const mine = currentUser && post.author?.id === currentUser.id;
  const stop = (e) => e.stopPropagation();
  const [justFollowed, setJustFollowed] = useState(false);
  const open = () => navigate(`/post/${post.id}`);
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  const handleTap = () => {
    const now = Date.now();
    const delta = now - lastTapRef.current;

    if (delta > 0 && delta < DOUBLE_TAP_DELAY) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      lastTapRef.current = 0;
      if (!post.likedByMe) {
        reactToPost(post.id, post.myReaction || "heart");
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 700);
    } else {
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        open();
      }, DOUBLE_TAP_DELAY);
    }
  };

  const onImageClick = (e) => {
    stop(e);
    handleTap();
  };

  const onImageTouchStart = (e) => {
    const t = e.touches[0];
    touchStartPosRef.current = { x: t.clientX, y: t.clientY };
  };

  const onImageTouchEnd = (e) => {
    stop(e);
    const t = e.changedTouches[0];
    const dx = Math.abs(t.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(t.clientY - touchStartPosRef.current.y);
    const moved = dx > 10 || dy > 10;

    if (moved) {
      // this was a scroll/swipe, not a tap — let it scroll, don't treat as tap
      return;
    }
    e.preventDefault(); // suppress the synthetic click mobile would fire next
    handleTap();
  };

  const onShowReactions = async (e) => {
    stop(e);
    if (post.likeCount === 0) return;
    const data = await getPostReactions(post.id);
    setReactionsModal(data);
  };

  const onFollowAuthor = async (e) => {
    stop(e);
    const ok = await toggleFollow(post.author.id, false);
    if (ok) {
      setJustFollowed(true);
      toast(`Following @${post.author.username}.`, "accent");
    }
  };

  const onRepost = (e) => {
    stop(e);
    setRepostText("");
    setReposting(true);
  };

  const onConfirmRepost = async (e) => {
    stop(e);
    const originalId = post.repostOfId || post.id;
    await createPost(repostText.trim(), [], "", originalId);
    setReposting(false);
    toast("Reposted to your profile.", "accent");
  };

  const onShare = (e) => {
    stop(e);
    navigator.clipboard?.writeText(window.location.href).then(
      () => toast("Link copied!", "accent"),
      () => toast("Could not copy link.", "danger"),
    );
  };
  const onReport = () => {
    setMenuOpen(false);
    toast("Thanks — we'll take a look at this sheet.");
  };
  const onDelete = () => {
    setMenuOpen(false);
    deletePost(post.id);
    toast("Sheet deleted.", "danger");
  };
  const onEdit = () => {
    setMenuOpen(false);
    setDraft(post.content);
    setEditing(true);
  };
  const onSaveEdit = async (e) => {
    stop(e);
    if (!draft.trim()) return toast("Sheet can't be empty.", "danger");
    const ok = await editPost(post.id, draft.trim());
    if (ok) {
      toast("Sheet updated.", "accent");
      setEditing(false);
    } else {
      toast("Could not update.", "danger");
    }
  };
  const onCancelEdit = (e) => {
    stop(e);
    setEditing(false);
  };

  return (
    <article
      className="sheet clickable"
      role="button"
      tabIndex={0}
      onClick={editing || reposting ? undefined : open}
      onKeyDown={editing || reposting ? undefined : onKey}
      aria-label={`Open sheet by ${post.author?.displayName}`}
    >
      <header
        className="sheet-head"
        style={{
          "--head": post.color, // Keeps your random color fallback!
          backgroundImage: post.author?.coverImg
            ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${post.author.coverImg})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          // Optional: Forces text to be white if they have a cover image so it's readable
          color: post.author?.coverImg ? "#ffffff" : "inherit",
        }}
      >
        <Link
          to={`/profile/${post.author?.id}`}
          className="sheet-author"
          onClick={stop}
        >
          <Avatar user={post.author} size={40} />
          <span className="names">
            <span className="display">
              {post.author?.displayName || "User"}
              {post.author?.emailVerified && (
                <VerifiedBadge
                  size={14}
                  variant={getVerifiedVariant(
                    post.author,
                    post.author?.id === CREATOR_ID,
                  )}
                />
              )}
              {isBirthday(post.author) && (
                <Cake
                  size={14}
                  color="#000"
                  style={{ marginLeft: 4, verticalAlign: "middle" }}
                />
              )}
            </span>
            <span className="handle">
              @{post.author?.username} · {timeAgo(post.createdAt)}
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
          <div className="more" ref={menuRef} onClick={stop}>
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
                  to={`/profile/${post.author?.id}`}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserRound size={15} /> Visit profile
                </Link>
                <button type="button" role="menuitem" onClick={onReport}>
                  <Flag size={15} /> Report
                </button>
                {mine && (
                  <button type="button" role="menuitem" onClick={onEdit}>
                    <Pencil size={15} /> Edit
                  </button>
                )}
                {mine && (
                  <button
                    type="button"
                    className="danger"
                    role="menuitem"
                    onClick={onDelete}
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
          onClick={stop}
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
              onClick={(e) => {
                stop(e);
                setReposting(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="sheet-body">
        {editing ? (
          <div onClick={stop}>
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
                onClick={onCancelEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p>{post.content}</p>
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
                onClick={stop}
              >
                #{pt.tag?.name}
              </Link>
            ))}
          </div>
        )}

        {post.imageUrl && !editing && (
          <div
            className="sheet-media"
            onClick={onImageClick}
            onTouchStart={onImageTouchStart}
            onTouchEnd={onImageTouchEnd}
            style={{
              position: "relative",
              cursor: "pointer",
              touchAction: "pan-y",
            }}
          >
            <img
              src={post.imageUrl}
              alt=""
              style={{
                width: "100%",
                height: "auto",
                maxHeight: 560,
                objectFit: "contain",
                display: "block",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              draggable={false}
            />
            {showHeartBurst && (
              <Heart
                className="heart-burst"
                size={90}
                fill="#fff"
                color="#fff"
              />
            )}
          </div>
        )}

        {post.repostOf && !editing && (
          <div
            onClick={(e) => {
              stop(e);
              navigate(`/post/${post.repostOf.id}`);
            }}
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
            open();
          }}
          style={{ flex: 1, justifyContent: "center" }}
        >
          <MessageCircle size={18} /> <span>{post.commentCount}</span>
        </button>
        <button
          type="button"
          className="stat"
          onClick={onRepost}
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
            <Eye size={16} /> <span className="stat-label">See reactions</span>
          </button>
        )}
      </footer>

      {reactionsModal && (
        <ReactionsModal
          counts={reactionsModal.counts}
          users={reactionsModal.users}
          onClose={() => setReactionsModal(null)}
        />
      )}
    </article>
  );
}
