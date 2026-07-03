import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
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
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useModal } from "../context/ModalContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useClickAway } from "../lib/useClickAway.js";
import { colorFor, timeAgo } from "../lib/time.js";
import Avatar from "./Avatar.jsx";
import { CREATOR_ID, isBirthday } from "../lib/creator.js";
import VerifiedBadge from "./VerifiedBadge.jsx";

export default function SheetCard({ post }) {
  const { currentUser, toggleLike, createPost, deletePost, editPost } =
    useStore();
  const { openPost } = useModal();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reposting, setReposting] = useState(false);
  const [repostText, setRepostText] = useState("");
  const [draft, setDraft] = useState(post.content);
  const menuRef = useRef(null);
  useClickAway(menuRef, () => setMenuOpen(false), menuOpen);

  const mine = currentUser && post.author?.id === currentUser.id;
  const stop = (e) => e.stopPropagation();

  const open = () => openPost(post.id);
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  const onLike = (e) => {
    stop(e);
    toggleLike(post.id, post.likedByMe);
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
      onClick={editing ? undefined : open}
      onKeyDown={editing ? undefined : onKey}
      aria-label={`Open sheet by ${post.author?.displayName}`}
    >
      <header className="sheet-head" style={{ "--head": post.color }}>
        <Link
          to={`/profile/${post.author?.id}`}
          className="sheet-author"
          onClick={stop}
        >
          <Avatar user={post.author} size={40} />
          <span className="names">
            <span className="display">
              {post.author?.displayName || "User"}
              {post.author?.emailVerified && <VerifiedBadge />}
              {post.author?.id === CREATOR_ID && (
                <span className="creator-badge">
                  <Crown size={10} /> Creator
                </span>
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
        {post.imageUrl && !editing && (
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 10",
              marginTop: 12,
              borderRadius: "var(--radius)",
              border: "2px solid var(--border)",
              background: "rgba(128, 128, 128, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={post.imageUrl}
              alt=""
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        )}
        {post.repostOf && !editing && (
          <Link
            to={`/post/${post.repostOf.id}`}
            onClick={stop}
            style={{
              display: "block",
              marginTop: 12,
              padding: 12,
              border: "2px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "inherit",
              textDecoration: "none",
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
              <img
                src={post.repostOf.imageUrl}
                alt=""
                style={{
                  width: "100%",
                  aspectRatio: "16 / 10",
                  objectFit: "cover",
                  marginTop: 8,
                  borderRadius: "var(--radius)",
                }}
              />
            )}
          </Link>
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
      </div>

      <footer className="sheet-foot">
        <button
          type="button"
          className={`stat ${post.likedByMe ? "liked" : ""}`}
          onClick={onLike}
          aria-pressed={post.likedByMe}
        >
          <Heart size={18} fill={post.likedByMe ? "currentColor" : "none"} />{" "}
          <span>{post.likeCount}</span>
        </button>
        <button
          type="button"
          className="stat"
          onClick={(e) => {
            stop(e);
            open();
          }}
        >
          <MessageCircle size={18} /> <span>{post.commentCount}</span>
        </button>
        <button type="button" className="stat" onClick={onRepost}>
          <Repeat2 size={18} /> <span>Repost</span>
        </button>
        <button type="button" className="stat" onClick={onShare}>
          <Share2 size={18} /> <span>Share</span>
        </button>
      </footer>
    </article>
  );
}
