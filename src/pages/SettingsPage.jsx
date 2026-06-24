import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Cog, Palette } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { GENDER_OPTIONS, ORIENTATION_OPTIONS } from "../lib/profileOptions.js";
import Avatar from "../components/Avatar.jsx";
import AvatarPicker from "../components/AvatarPicker.jsx";

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

const SELF = "Prefer to self-describe";

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
  const [birthday, setBirthday] = useState(
    currentUser?.birthday ? currentUser.birthday.slice(0, 10) : "",
  );

  // Gender — if the stored value isn't one of the presets, treat it as self-described
  const storedGender = currentUser?.gender || "";
  const genderIsPreset = GENDER_OPTIONS.includes(storedGender);
  const [genderChoice, setGenderChoice] = useState(
    storedGender ? (genderIsPreset ? storedGender : SELF) : "",
  );
  const [genderCustom, setGenderCustom] = useState(
    storedGender && !genderIsPreset ? storedGender : "",
  );
  const [showGender, setShowGender] = useState(!!currentUser?.showGender);

  // Orientation — same pattern
  const storedOri = currentUser?.orientation || "";
  const oriIsPreset = ORIENTATION_OPTIONS.includes(storedOri);
  const [oriChoice, setOriChoice] = useState(
    storedOri ? (oriIsPreset ? storedOri : SELF) : "",
  );
  const [oriCustom, setOriCustom] = useState(
    storedOri && !oriIsPreset ? storedOri : "",
  );
  const [showOrientation, setShowOrientation] = useState(
    !!currentUser?.showOrientation,
  );

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
    const gender = genderChoice === SELF ? genderCustom.trim() : genderChoice;
    const orientation = oriChoice === SELF ? oriCustom.trim() : oriChoice;

    const res = await updateProfile({
      name: displayName.trim() || currentUser.displayName,
      username: username.trim(),
      bio,
      avatarUrl,
      gender,
      orientation,
      showGender,
      showOrientation,
      birthday: birthday || undefined,
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
                  Upload photo
                </button>
              </div>

              <div className="field">
                <label htmlFor="bday">Birthday</label>
                <input
                  id="bday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
                <span className="hint">
                  A cake appears on your posts on your birthday.
                </span>
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

              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={genderChoice}
                  onChange={(e) => setGenderChoice(e.target.value)}
                >
                  <option value="">Select…</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {genderChoice === SELF && (
                  <input
                    type="text"
                    value={genderCustom}
                    onChange={(e) => setGenderCustom(e.target.value)}
                    placeholder="Describe your gender"
                    style={{ marginTop: 8 }}
                  />
                )}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 8,
                    fontSize: "0.85rem",
                    textTransform: "none",
                    fontWeight: 400,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showGender}
                    onChange={(e) => setShowGender(e.target.checked)}
                  />
                  Show on my profile
                </label>
              </div>

              <div className="field">
                <label htmlFor="orientation">Orientation</label>
                <select
                  id="orientation"
                  value={oriChoice}
                  onChange={(e) => setOriChoice(e.target.value)}
                >
                  <option value="">Select…</option>
                  {ORIENTATION_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {oriChoice === SELF && (
                  <input
                    type="text"
                    value={oriCustom}
                    onChange={(e) => setOriCustom(e.target.value)}
                    placeholder="Describe your orientation"
                    style={{ marginTop: 8 }}
                  />
                )}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 8,
                    fontSize: "0.85rem",
                    textTransform: "none",
                    fontWeight: 400,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showOrientation}
                    onChange={(e) => setShowOrientation(e.target.checked)}
                  />
                  Show on my profile
                </label>
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
