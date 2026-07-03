import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, MessageCircle, UserPlus, Mail } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { timeAgo } from "../lib/time.js";
import Avatar from "../components/Avatar.jsx";

const ICON = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  dm: Mail,
};
const TEXT = {
  like: "liked your sheet",
  comment: "commented on your sheet",
  follow: "started following you",
  dm: "sent you a message",
};

export default function NotificationsPage() {
  const { getNotifications, markNotificationsRead } = useStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then((data) => {
      setItems(data);
      setLoading(false);
      markNotificationsRead(); // mark read when the page is opened
    });
  }, []);

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
              n.type === "dm"
                ? `/chat?dm=${n.actor?.id}`
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
                  <b>{n.actor?.displayName}</b> {TEXT[n.type] || "interacted"}
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
