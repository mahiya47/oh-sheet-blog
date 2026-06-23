import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Cog, Palette } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Avatar from "../components/Avatar.jsx";

// Downscale an uploaded image to a small JPEG data URL before storing it.
function fileToAvatarDataUrl(file, max = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SettingsPage() {
  const { currentUser, updateProfile, resetDemo } = useStore();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [tab, setTab] = useState("profile");
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || "",
  );
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarUrl(dataUrl);
      toast("Photo ready — hit Save changes.", "accent");
    } catch {
      toast("Couldn't load that image.", "danger");
    }
  };

  const onSave = async () => {
    const res = await updateProfile({
      name: displayName.trim() || currentUser.displayName,
      username: username.trim(),
      bio,
      avatarUrl,
    });
    if (res.ok) {
      toast("Settings saved.", "accent");
      navigate("/profile");
    } else {
      toast(res.error || "Could not save.", "danger");
    }
  };

  const onReset = () => {
    resetDemo();
    toast("Demo data reset.", "default");
    navigate("/feed");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: Cog },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div>
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/feed" className="nav-logo wordmark">
            Oh <span>sheet!</span>
          </Link>
        </div>
        <div className="nav-right">
          <Link to="/feed" className="btn btn-ghost">
            <ArrowLeft size={16} /> Back to feed
          </Link>
        </div>
      </nav>

      <div className="settings">
        <aside className="settings-side">
          <h2>Settings</h2>
          <nav>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`tab ${tab === id ? "active" : ""}`}
                onClick={() => setTab(id)}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="settings-main">
          {tab === "profile" && (
            <>
              <h3>Public profile</h3>
              <div className="pfp-row">
                <Avatar user={{ ...currentUser, avatarUrl }} size={72} />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={onPickFile}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => fileRef.current?.click()}
                >
                  Change photo
                </button>
              </div>
              <div className="field">
                <label htmlFor="dn">Display name</label>
                <input
                  id="dn"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="field">
                <label htmlFor="un">Username</label>
                <input
                  id="un"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                />
                <span className="hint">Must be unique.</span>
              </div>
              <div className="field">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the world about yourself…"
                  style={{ minHeight: 110 }}
                />
              </div>
              <div className="editor-foot">
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={onSave}
                >
                  Save changes
                </button>
              </div>
            </>
          )}

          {tab === "account" && (
            <>
              <h3>Account</h3>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                />
                <span className="hint">
                  Email can’t be changed in this demo.
                </span>
              </div>
            </>
          )}

          {tab === "appearance" && (
            <>
              <h3>Appearance</h3>
              <div className="switch">
                <span>Dark mode</span>
                <button
                  type="button"
                  className={`toggle ${theme === "dark" ? "on" : ""}`}
                  onClick={toggleTheme}
                  role="switch"
                  aria-checked={theme === "dark"}
                  aria-label="Toggle dark mode"
                />
              </div>
              <span className="hint">
                Your theme preference is remembered on this device.
              </span>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
