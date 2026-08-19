import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { timeAgo } from "../lib/time.js";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import { getVerifiedVariant } from "../lib/verifiedVariant.js";
import { CREATOR_ID } from "../lib/creator.js";

import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  BadgeCheck,
  X,
  RefreshCcw,
} from "lucide-react";

const ICON = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  reply: MessageCircle,
  tagged: UserPlus,
  verified: BadgeCheck,
  reactivated: RefreshCcw,
};
const TEXT = {
  like: "liked your sheet",
  comment: "commented on your sheet",
  follow: "started following you",
  reply: "replied to your comment",
  tagged: "tagged you in a post",
  verified: "🎉 You're verified! Enjoy your blue tick.",
  reactivated: "👋 Welcome back! Your account has been reactivated.",
};

export default function NotificationsPage() {
  const { getNotifications, markNotificationsRead, deleteNotification } =
    useStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then((data) => {
      setItems(data);
      setLoading(false);
      markNotificationsRead(); // mark read when the page is opened
    });
  }, []);

  const onRemove = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await deleteNotification(id);
    if (ok) {
      setItems((prev) => prev.filter((n) => n.id !== id));
    }
  };

  return (
    <div className="feed-col">
      <h1
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textTransform: "uppercase",
          fontSize: "1.4rem",
        }}
      >
        <Bell size={22} /> Notifications
      </h1>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="panel">
          {items.map((n) => {
            const Icon = ICON[n.type] || Bell;
            const to =
              n.type === "verified" || n.type === "reactivated"
                ? "/settings"
                : (n.type === "like" ||
                      n.type === "comment" ||
                      n.type === "reply" ||
                      n.type === "tagged") &&
                    n.postId
                  ? `/post/${n.postId}`
                  : `/profile/${n.actor?.id}`;
            return (
              <Link
                key={n.id}
                to={to}
                className="mini-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: n.read
                    ? "transparent"
                    : "var(--surface-2, rgba(62,255,139,0.08))",
                }}
              >
                <Avatar user={n.actor} size={40} />
                <span style={{ flex: 1 }}>
                  {n.type === "verified" || n.type === "reactivated" ? (
                    TEXT[n.type]
                  ) : (
                    <>
                      <b>
                        {n.actor?.displayName}
                        {n.actor?.emailVerified && (
                          <VerifiedBadge
                            size={12}
                            variant={getVerifiedVariant(
                              n.actor,
                              n.actor?.id === CREATOR_ID,
                            )}
                          />
                        )}
                      </b>{" "}
                      {TEXT[n.type] || "interacted"}
                    </>
                  )}
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {timeAgo(n.createdAt)}
                  </span>
                </span>
                <Icon size={18} />
                <button
                  type="button"
                  onClick={(e) => onRemove(e, n.id)}
                  aria-label="Remove notification"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={16} />
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
