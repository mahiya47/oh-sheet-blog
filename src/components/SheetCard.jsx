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

export default function SheetCard({ post }) {
  const { currentUser, toggleLike, createPost, deletePost, editPost } =
    useStore();
  const { openPost } = useModal();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
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
    createPost(`Repost from @${post.author?.username}:\n${post.content}`);
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
