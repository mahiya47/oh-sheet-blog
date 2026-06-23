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
  UserRound,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useModal } from "../context/ModalContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useClickAway } from "../lib/useClickAway.js";
import { colorFor, timeAgo } from "../lib/time.js";
import Avatar from "./Avatar.jsx";

export default function SheetCard({ post }) {
  const { currentUser, toggleLike, createPost, deletePost } = useStore();
  const { openPost } = useModal();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
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

  return (
    <article
      className="sheet clickable"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={onKey}
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
        <p>{post.content}</p>
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
