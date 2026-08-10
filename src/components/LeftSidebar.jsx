import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Users,
  Flame,
  Info,
  ShieldCheck,
  Scale,
  FileText,
  Settings,
  Trophy,
  Gamepad2, // 👈 Added Arcade icon
  Bell,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";

const linkClass = ({ isActive }) => `icon-btn tip ${isActive ? "active" : ""}`;

const badgeStyle = {
  position: "absolute",
  top: 2,
  right: 2,
  minWidth: 16,
  height: 16,
  padding: "0 4px",
  borderRadius: 8,
  background: "var(--danger, #ff3e3e)",
  color: "#fff",
  fontSize: "0.6rem",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

export default function LeftSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  // 👇 Removed chat unread logic from here
  const { getUnreadCount, currentUser } = useStore();
  const [unread, setUnread] = useState(0);

  // poll unread counts (just notifications now)
  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    const load = async () => {
      const c = await getUnreadCount();
      if (active) {
        setUnread(c);
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
    <aside className="rail-left" aria-label="Secondary navigation">
      <div className="rail-group">
        <NavLink
          to="/following"
          className={linkClass}
          data-tip="Following"
          aria-label="Following"
        >
          <Users size={18} />
        </NavLink>
        <NavLink
          to="/trending"
          className={linkClass}
          data-tip="Trending"
          aria-label="Trending"
        >
          <Flame size={18} />
        </NavLink>
        <NavLink
          to="/notifications"
          className={linkClass}
          data-tip="Notifications"
          aria-label="Notifications"
          style={{ position: "relative" }}
        >
          <Bell size={18} />
          {unread > 0 && (
            <span style={badgeStyle}>{unread > 9 ? "9+" : unread}</span>
          )}
        </NavLink>
        <NavLink
          to="/leaderboard"
          className={linkClass}
          data-tip="Leaderboard"
          aria-label="Leaderboard"
        >
          <Trophy size={18} />
        </NavLink>
        {/* 👇 Replaced Chat with Arcade */}
        <NavLink
          to="/games"
          className={linkClass}
          data-tip="Arcade"
          aria-label="Arcade"
        >
          <Gamepad2 size={18} />
        </NavLink>
        <div className="rail-sep" />
        <NavLink
          to="/about"
          className={linkClass}
          data-tip="About Oh Sheet!"
          aria-label="About"
        >
          <Info size={18} />
        </NavLink>
      </div>

      <div className="rail-group">
        <div className="rail-sep" />
        <NavLink
          to="/privacy"
          className={linkClass}
          data-tip="Privacy policy"
          aria-label="Privacy policy"
        >
          <ShieldCheck size={18} />
        </NavLink>
        <NavLink
          to="/rules"
          className={linkClass}
          data-tip="Rules"
          aria-label="Rules"
        >
          <Scale size={18} />
        </NavLink>
        <NavLink
          to="/agreement"
          className={linkClass}
          data-tip="Agreement"
          aria-label="Agreement"
        >
          <FileText size={18} />
        </NavLink>
        <div className="rail-sep" />
        <NavLink
          to="/settings"
          className={linkClass}
          data-tip="Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </NavLink>
      </div>
    </aside>
  );
}
