import { NavLink } from "react-router-dom";
import {
  Users,
  Flame,
  Info,
  ShieldCheck,
  Scale,
  FileText,
  Settings,
  Trophy,
  MessageCircle,
} from "lucide-react";
import { useChat } from "../context/ChatContext";

const linkClass = ({ isActive }) => `icon-btn tip ${isActive ? "active" : ""}`;

export default function LeftSidebar() {
  const { chatOpen, setChatOpen } = useChat();

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
          to="/leaderboard"
          className={linkClass}
          data-tip="Leaderboard"
          aria-label="Leaderboard"
        >
          <Trophy size={18} />
        </NavLink>
        <button
          className={`icon-btn tip ${chatOpen ? "active" : ""}`}
          data-tip="Global Chat"
          aria-label="Global Chat"
          onClick={() => setChatOpen((o) => !o)}
        >
          <MessageCircle size={18} />
        </button>
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
