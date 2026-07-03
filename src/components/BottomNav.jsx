import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, Users, Flame, Bell, Trophy, MessageCircle } from "lucide-react";
import { useStore } from "../lib/store.jsx";

const cls = ({ isActive }) => (isActive ? "active" : undefined);

const badgeStyle = {
  position: "absolute",
  top: 0,
  right: "50%",
  marginRight: -18,
  minWidth: 15,
  height: 15,
  padding: "0 4px",
  borderRadius: 8,
  background: "var(--danger, #ff3e3e)",
  color: "#fff",
  fontSize: "0.55rem",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

export default function BottomNav() {
  const location = useLocation();
  const { getUnreadCount, getChatUnread, getDmUnread, currentUser } =
    useStore();
  const [unread, setUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    const load = async () => {
      const c = await getUnreadCount();
      const cc = await getChatUnread();
      const dm = await getDmUnread();
      if (active) {
        setUnread(c);
        setChatUnread(cc + dm);
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [currentUser, location.pathname]);

  return (
    <nav className="bottom-nav" aria-label="Primary">
      <NavLink to="/feed" className={cls}>
        <Home size={20} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/following" className={cls}>
        <Users size={20} />
        <span>Following</span>
      </NavLink>
      <NavLink to="/trending" className={cls}>
        <Flame size={20} />
        <span>Trending</span>
      </NavLink>
      <NavLink
        to="/notifications"
        className={cls}
        style={{ position: "relative" }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span style={badgeStyle}>{unread > 9 ? "9+" : unread}</span>
        )}
        <span>Alerts</span>
      </NavLink>
      <NavLink to="/leaderboard" className={cls}>
        <Trophy size={20} />
        <span>Ranks</span>
      </NavLink>
      <NavLink to="/chat" className={cls} style={{ position: "relative" }}>
        <MessageCircle size={20} />
        {chatUnread > 0 && (
          <span style={badgeStyle}>{chatUnread > 9 ? "9+" : chatUnread}</span>
        )}
        <span>Chat</span>
      </NavLink>
    </nav>
  );
}
