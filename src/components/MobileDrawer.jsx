import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  X,
  Users,
  Flame,
  Trophy,
  Info,
  ShieldCheck,
  Scale,
  FileText,
  HelpCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Avatar from "./Avatar.jsx";

export default function MobileDrawer({ open, onClose }) {
  const { currentUser, logout } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    onClose();
    logout();
    toast("Signed out.", "default");
    navigate("/login");
  };

  const item = ({ isActive }) => `drawer-item ${isActive ? "active" : ""}`;

  return (
    <>
      <div
        className={`drawer-overlay ${open ? "drawer-overlay--open" : ""}`}
        onClick={onClose}
      />
      <aside className={`drawer ${open ? "drawer--open" : ""}`}>
        <div className="drawer-head">
          {currentUser ? (
            <Link to="/profile" className="drawer-user" onClick={onClose}>
              <Avatar user={currentUser} size={40} />
              <div>
                <div className="drawer-user-name">
                  {currentUser.displayName || currentUser.username}
                </div>
                <div className="drawer-user-handle">
                  @{currentUser.username}
                </div>
              </div>
            </Link>
          ) : (
            <span className="drawer-user-name">Oh sheet!</span>
          )}
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="drawer-nav">
          <NavLink to="/following" className={item} onClick={onClose}>
            <Users size={18} /> Following
          </NavLink>
          <NavLink to="/trending" className={item} onClick={onClose}>
            <Flame size={18} /> Trending
          </NavLink>
          <NavLink to="/leaderboard" className={item} onClick={onClose}>
            <Trophy size={18} /> Leaderboard
          </NavLink>
          <NavLink
            to="/arcade"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Gamepad2 size={24} />
            <span>Arcade</span>
          </NavLink>

          <div className="drawer-sep" />

          <NavLink to="/about" className={item} onClick={onClose}>
            <Info size={18} /> About Oh Sheet!
          </NavLink>
          <NavLink to="/privacy" className={item} onClick={onClose}>
            <ShieldCheck size={18} /> Privacy policy
          </NavLink>
          <NavLink to="/rules" className={item} onClick={onClose}>
            <Scale size={18} /> Rules
          </NavLink>
          <NavLink to="/agreement" className={item} onClick={onClose}>
            <FileText size={18} /> Agreement
          </NavLink>
          <NavLink to="/support" className={item} onClick={onClose}>
            <HelpCircle size={18} /> Support
          </NavLink>

          <div className="drawer-sep" />

          <NavLink to="/settings" className={item} onClick={onClose}>
            <Settings size={18} /> Settings
          </NavLink>

          {currentUser && (
            <button
              type="button"
              className="drawer-item danger"
              onClick={handleLogout}
            >
              <LogOut size={18} /> Log out
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}
