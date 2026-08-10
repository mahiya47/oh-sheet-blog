import { useRef, useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import {
  Home,
  PenLine,
  Headphones,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Hash,
  Menu,
  MessageCircle, // 👈 Added Message icon
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useClickAway } from "../lib/useClickAway.js";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import MobileDrawer from "./MobileDrawer.jsx";

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

export default function Navbar() {
  const { currentUser, logout, searchLive, getChatUnread, getDmUnread } =
    useStore(); // 👇 Added unread functions
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [chatUnread, setChatUnread] = useState(0); // 👇 Added state for chat badge

  const isChatActive = location.pathname === "/chat";

  const menuRef = useRef(null);
  const searchRef = useRef(null);
  useClickAway(menuRef, () => setMenuOpen(false), menuOpen);
  useClickAway(searchRef, () => setResults(null), !!results);

  // live search — debounced 300ms
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      const data = await searchLive(q);
      setResults(data);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // 👇 Poll chat unread counts (moved from LeftSidebar)
  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    const load = async () => {
      const cc = await getChatUnread();
      const dm = await getDmUnread();
      if (active) {
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

  const closeSearch = () => {
    setResults(null);
    setQuery("");
  };

  const onSearch = (e) => {
    if (e.key === "Enter") {
      const q = query.trim();
      closeSearch();
      navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/feed");
    }
    if (e.key === "Escape") setResults(null);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    toast("Signed out.", "default");
    navigate("/login");
  };

  const displayName = (u) =>
    u?.displayName ||
    u?.name ||
    u?.username ||
    u?.email?.split("@")[0] ||
    "User";

  const hasResults =
    results && (results.users?.length > 0 || results.tags?.length > 0);

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
        {/* 👇 Added Chat Icon here! */}
        <button
          className={`icon-btn tip tip-down ${isChatActive ? "active" : ""}`}
          data-tip="Chat"
          aria-label="Chat"
          onClick={() => navigate("/chat")}
          style={{ position: "relative" }}
        >
          <MessageCircle size={18} />
          {chatUnread > 0 && (
            <span style={badgeStyle}>{chatUnread > 9 ? "9+" : chatUnread}</span>
          )}
        </button>
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

        <div
          className="search search-desktop-only"
          ref={searchRef}
          style={{ position: "relative" }}
        >
          <Search size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearch}
            placeholder="Search sheets or people…"
            aria-label="Search"
          />

          {results && (
            <div className="search-dropdown">
              {!hasResults && (
                <div className="search-dropdown-empty">No matches found.</div>
              )}

              {results.users?.length > 0 && (
                <>
                  <div className="search-dropdown-label">People</div>
                  {results.users.map((u) => (
                    <Link
                      key={u.id}
                      to={`/profile/${u.id}`}
                      className="search-dropdown-item"
                      onClick={closeSearch}
                    >
                      <Avatar user={u} size={30} />
                      <span className="search-dropdown-name">
                        {displayName(u)}
                        {u.emailVerified && <VerifiedBadge size={12} />}
                        <span className="search-dropdown-handle">
                          @{u.username || u.email?.split("@")[0]}
                        </span>
                      </span>
                    </Link>
                  ))}
                </>
              )}

              {results.tags?.length > 0 && (
                <>
                  <div className="search-dropdown-label">Tags</div>
                  {results.tags.map((t) => (
                    <Link
                      key={t.id}
                      to={`/tag/${t.name}`}
                      className="search-dropdown-item"
                      onClick={closeSearch}
                    >
                      <span className="search-dropdown-tagicon">
                        <Hash size={14} />
                      </span>
                      <span className="search-dropdown-name">#{t.name}</span>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="profile-menu profile-menu-desktop" ref={menuRef}>
          <button
            type="button"
            className="profile-trigger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar user={currentUser} size={28} />
            <span>
              {currentUser?.displayName ||
                currentUser?.name ||
                currentUser?.username ||
                "guest"}
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
        <button
          type="button"
          className="nav-hamburger"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </nav>
  );
}
