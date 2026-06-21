import { useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  PenLine,
  Headphones,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useClickAway } from "../lib/useClickAway.js";
import Avatar from "./Avatar.jsx";

export default function Navbar() {
  const { currentUser, logout } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef(null);
  useClickAway(menuRef, () => setMenuOpen(false), menuOpen);

  const onSearch = (e) => {
    if (e.key === "Enter") {
      const q = query.trim();
      navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/feed");
    }
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    toast("Signed out.", "default");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link
          to="/feed"
          className="nav-logo wordmark"
          aria-label="Oh Sheet home"
        >
          Oh <span>sheet!</span>
        </Link>
      </div>

      <div className="nav-center">
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            `icon-btn tip tip-down ${isActive ? "active" : ""}`
          }
          data-tip="Home"
          aria-label="Home"
        >
          <Home size={18} />
        </NavLink>
        <NavLink
          to="/create"
          className={({ isActive }) =>
            `icon-btn tip tip-down ${isActive ? "active" : ""}`
          }
          data-tip="Create a sheet"
          aria-label="Create a sheet"
        >
          <PenLine size={18} />
        </NavLink>
        <NavLink
          to="/support"
          className={({ isActive }) =>
            `icon-btn tip tip-down ${isActive ? "active" : ""}`
          }
          data-tip="Support"
          aria-label="Support"
        >
          <Headphones size={18} />
        </NavLink>
      </div>

      <div className="nav-right">
        <NavLink
          to="/search"
          className="icon-btn nav-search-mobile"
          aria-label="Search"
        >
          <Search size={18} />
        </NavLink>

        <div className="search">
          <Search size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearch}
            placeholder="Search sheets or people…"
            aria-label="Search"
          />
        </div>

        <div className="profile-menu" ref={menuRef}>
          <button
            type="button"
            className="profile-trigger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar user={currentUser} size={28} />
            <span>
              {currentUser?.displayName || currentUser?.username || "guest"}
            </span>
            <ChevronDown size={14} />
          </button>

          {menuOpen && (
            <div className="menu" role="menu">
              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <User size={16} /> Visit profile
              </Link>
              <Link
                to="/settings"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <Settings size={16} /> Settings
              </Link>
              <button
                type="button"
                className="danger"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
