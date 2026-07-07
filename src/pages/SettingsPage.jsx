import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Info,
  Link2,
  ShieldAlert,
  Cog,
  Palette,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  MapPin,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { GENDER_OPTIONS, ORIENTATION_OPTIONS } from "../lib/profileOptions.js";
import { COVERS } from "../lib/covers.js";
import Avatar from "../components/Avatar.jsx";
import AvatarPicker from "../components/AvatarPicker.jsx";

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

function fileToCoverDataUrl(file, maxW = 1200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
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

function isValidUrl(value) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SettingsPage() {
  const {
    currentUser,
    updateProfile,
    resendVerification,
    getBlockedUsers,
    unblockUser,
    deleteAccount,
    logout,
  } = useStore();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const coverFileRef = useRef(null);

  const [tab, setTab] = useState("profile");
  const [dirty, setDirty] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);

  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || "",
  );
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [coverUrl, setCoverUrl] = useState(currentUser?.coverUrl || "");
  const [birthday, setBirthday] = useState(
    currentUser?.birthday ? currentUser.birthday.slice(0, 10) : "",
  );
  const [pronouns, setPronouns] = useState(currentUser?.pronouns || "");

  const [currentCity, setCurrentCity] = useState(
    currentUser?.currentCity || "",
  );
  const [work, setWork] = useState(currentUser?.work || "");
  const [education, setEducation] = useState(currentUser?.education || "");

  const [githubUrl, setGithubUrl] = useState(currentUser?.githubUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(
    currentUser?.instagramUrl || "",
  );
  const [linkedinUrl, setLinkedinUrl] = useState(
    currentUser?.linkedinUrl || "",
  );
  const [twitterUrl, setTwitterUrl] = useState(currentUser?.twitterUrl || "");

  const storedGender = currentUser?.gender || "";
  const genderIsPreset = GENDER_OPTIONS.includes(storedGender);
  const [genderChoice, setGenderChoice] = useState(
    storedGender ? (genderIsPreset ? storedGender : SELF) : "",
  );
  const [genderCustom, setGenderCustom] = useState(
    storedGender && !genderIsPreset ? storedGender : "",
  );
  const [showGender, setShowGender] = useState(!!currentUser?.showGender);

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

  // ---- Privacy & Safety ----
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (tab !== "privacy") return;
    setLoadingBlocked(true);
    getBlockedUsers().then((list) => {
      setBlockedUsers(list);
      setLoadingBlocked(false);
    });
  }, [tab]);

  const onUnblock = async (userId, name) => {
    const ok = await unblockUser(userId);
    if (ok) {
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      toast(`Unblocked ${name}.`, "accent");
    } else {
      toast("Could not unblock. Try again.", "danger");
    }
  };

  const onDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    const res = await deleteAccount();
    setDeleting(false);
    if (res.ok) {
      toast(
        "Account deleted. Log back in within 7 days to undo this.",
        "danger",
      );
      navigate("/login");
    } else {
      toast(res.error || "Could not delete account.", "danger");
    }
  };

  useEffect(() => {
    setDirty(true);
  }, [
    displayName,
    username,
    bio,
    avatarUrl,
    coverUrl,
    birthday,
    pronouns,
    currentCity,
    work,
    education,
    githubUrl,
    instagramUrl,
    linkedinUrl,
    twitterUrl,
    genderChoice,
    genderCustom,
    showGender,
    oriChoice,
    oriCustom,
    showOrientation,
  ]);

  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

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

  const onPickCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToCoverDataUrl(file);
      setCoverUrl(dataUrl);
      toast("Cover ready — hit Save changes.", "accent");
    } catch {
      toast("Couldn't load that image.", "danger");
    }
  };

  const onSave = async () => {
    const urls = { githubUrl, twitterUrl, linkedinUrl, instagramUrl };
    const hasInvalidUrl = Object.values(urls).some((u) => !isValidUrl(u));
    if (hasInvalidUrl) {
      toast("Please fix the invalid social links before saving.", "danger");
      return;
    }

    const gender = genderChoice === SELF ? genderCustom.trim() : genderChoice;
    const orientation = oriChoice === SELF ? oriCustom.trim() : oriChoice;

    const res = await updateProfile({
      name: displayName.trim() || currentUser.displayName,
      username: username.trim(),
      bio,
      avatarUrl,
      coverUrl,
      gender,
      orientation,
      showGender,
      showOrientation,
      birthday: birthday || undefined,
      pronouns,
      githubUrl,
      instagramUrl,
      linkedinUrl,
      twitterUrl,
      currentCity,
      work,
      education,
    });
    if (res.ok) {
      setDirty(false);
      toast("Settings saved.", "accent");
      navigate("/profile");
    } else {
      toast(res.error || "Could not save.", "danger");
    }
  };

  const onVerifyEmail = async () => {
    if (sendingVerify) return;
    setSendingVerify(true);
    const res = await resendVerification();
    toast(
      res.ok ? "Verification email sent — check your inbox." : res.error,
      res.ok ? "accent" : "danger",
    );
    setSendingVerify(false);
  };

  const isImageCover =
    coverUrl?.startsWith("data:") || coverUrl?.startsWith("http");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "about", label: "About", icon: Info },
    { id: "social", label: "Social Links", icon: Link2 },
    { id: "privacy", label: "Privacy & Safety", icon: ShieldAlert },
    { id: "account", label: "Account", icon: Cog },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  const showStickySave = ["profile", "about", "social"].includes(tab);

  const goBack = () => {
    if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) {
      return;
    }
    navigate("/feed");
  };

  return (
    <div>
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/feed" className="nav-logo wordmark">
            Oh <span>sheet!</span>
          </Link>
        </div>
        <div className="nav-right">
          <button type="button" className="btn btn-ghost" onClick={goBack}>
            <ArrowLeft size={16} /> Back to feed
          </button>
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
          {/* ============ PROFILE TAB ============ */}
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
                <label>Or choose an avatar</label>
                <AvatarPicker
                  value={avatarUrl}
                  onSelect={(url) => {
                    setAvatarUrl(url);
                    toast("Avatar selected — hit Save changes.", "accent");
                  }}
                  seedBase={
                    currentUser?.username || currentUser?.email || "user"
                  }
                />
                <span className="hint">Pick one, then hit Save changes.</span>
              </div>

              <div className="field">
                <label>Profile cover</label>

                <div
                  style={{
                    height: 80,
                    borderRadius: 8,
                    border: "2px solid var(--border, #333)",
                    marginBottom: 8,
                    background: isImageCover
                      ? `url(${coverUrl}) center/cover no-repeat`
                      : coverUrl || COVERS[0],
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 8,
                  }}
                >
                  {COVERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setCoverUrl(c);
                        toast("Cover selected — hit Save changes.", "accent");
                      }}
                      aria-label="Select cover"
                      style={{
                        background: c,
                        height: 40,
                        borderRadius: 8,
                        cursor: "pointer",
                        border:
                          coverUrl === c
                            ? "3px solid var(--accent, #3eff8b)"
                            : "2px solid var(--border, #333)",
                      }}
                    />
                  ))}
                </div>

                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={onPickCover}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: 8 }}
                  onClick={() => coverFileRef.current?.click()}
                >
                  Upload your own cover
                </button>
                <span className="hint">
                  Pick a preset or upload a photo, then hit Save changes.
                </span>
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
                <label htmlFor="pronouns">Pronouns</label>
                <input
                  id="pronouns"
                  type="text"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="e.g. he/him, she/her, they/them"
                />
                <span className="hint">
                  Shown next to your name on your profile.
                </span>
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
                  onChange={(e) => setBio(e.target.value.slice(0, 160))}
                  placeholder="Tell the world about yourself…"
                  style={{ minHeight: 110 }}
                  maxLength={160}
                />
                <span
                  className="char-count"
                  style={{
                    color:
                      bio.length > 140 ? "var(--danger, #ff3e3e)" : undefined,
                  }}
                >
                  {bio.length}/160
                </span>
              </div>
            </>
          )}

          {/* ============ ABOUT TAB ============ */}
          {tab === "about" && (
            <>
              <h3>About</h3>

              <div className="field">
                <label>Life details</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <MapPin size={18} style={{ flexShrink: 0, opacity: 0.7 }} />
                  <input
                    type="text"
                    value={currentCity}
                    onChange={(e) => setCurrentCity(e.target.value)}
                    placeholder="Current city"
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <Briefcase
                    size={18}
                    style={{ flexShrink: 0, opacity: 0.7 }}
                  />
                  <input
                    type="text"
                    value={work}
                    onChange={(e) => setWork(e.target.value)}
                    placeholder="Where do you work?"
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <GraduationCap
                    size={18}
                    style={{ flexShrink: 0, opacity: 0.7 }}
                  />
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="Where did you study?"
                  />
                </div>
                <span className="hint">
                  Shown in the About tab on your profile. Leave blank to hide.
                </span>
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
            </>
          )}

          {/* ============ SOCIAL LINKS TAB ============ */}
          {tab === "social" && (
            <>
              <h3>Social links</h3>

              <div className="field">
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Github size={18} style={{ flexShrink: 0, opacity: 0.7 }} />
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/yourusername"
                      style={{
                        borderColor: !isValidUrl(githubUrl)
                          ? "var(--danger, #ff3e3e)"
                          : undefined,
                      }}
                    />
                  </div>
                  {!isValidUrl(githubUrl) && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--danger, #ff3e3e)",
                        marginLeft: 26,
                      }}
                    >
                      That doesn't look like a valid URL.
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Twitter
                      size={18}
                      style={{ flexShrink: 0, opacity: 0.7 }}
                    />
                    <input
                      type="url"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      placeholder="https://x.com/yourusername"
                      style={{
                        borderColor: !isValidUrl(twitterUrl)
                          ? "var(--danger, #ff3e3e)"
                          : undefined,
                      }}
                    />
                  </div>
                  {!isValidUrl(twitterUrl) && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--danger, #ff3e3e)",
                        marginLeft: 26,
                      }}
                    >
                      That doesn't look like a valid URL.
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Linkedin
                      size={18}
                      style={{ flexShrink: 0, opacity: 0.7 }}
                    />
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourusername"
                      style={{
                        borderColor: !isValidUrl(linkedinUrl)
                          ? "var(--danger, #ff3e3e)"
                          : undefined,
                      }}
                    />
                  </div>
                  {!isValidUrl(linkedinUrl) && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--danger, #ff3e3e)",
                        marginLeft: 26,
                      }}
                    >
                      That doesn't look like a valid URL.
                    </span>
                  )}
                </div>

                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Instagram
                      size={18}
                      style={{ flexShrink: 0, opacity: 0.7 }}
                    />
                    <input
                      type="url"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/yourusername"
                      style={{
                        borderColor: !isValidUrl(instagramUrl)
                          ? "var(--danger, #ff3e3e)"
                          : undefined,
                      }}
                    />
                  </div>
                  {!isValidUrl(instagramUrl) && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--danger, #ff3e3e)",
                        marginLeft: 26,
                      }}
                    >
                      That doesn't look like a valid URL.
                    </span>
                  )}
                </div>

                <span className="hint">
                  Leave blank to hide any icon from your profile.
                </span>
              </div>
            </>
          )}

          {/* sticky save — only for tabs with editable fields */}
          {showStickySave && (
            <div className="settings-sticky-save">
              <button type="button" className="btn btn-accent" onClick={onSave}>
                Save changes
              </button>
            </div>
          )}

          {/* ============ PRIVACY & SAFETY TAB ============ */}
          {tab === "privacy" && (
            <>
              <h3>Blocked users</h3>
              {loadingBlocked ? (
                <p className="hint">Loading…</p>
              ) : blockedUsers.length === 0 ? (
                <p className="hint">You haven't blocked anyone.</p>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {blockedUsers.map((u) => (
                    <div
                      key={u.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        border: "2px solid var(--border-soft)",
                        borderRadius: "var(--radius)",
                        padding: "10px 14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Avatar user={u} size={36} />
                        <span>{u.displayName}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => onUnblock(u.id, u.displayName)}
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <h3 style={{ marginTop: 32, color: "var(--danger, #ff3e3e)" }}>
                Delete account
              </h3>
              <p className="hint" style={{ marginBottom: 12 }}>
                Deleting your account hides it immediately. You have 7 days to
                change your mind — just log back in during that window to undo
                it. After 7 days, your account and all your data are permanently
                deleted and can't be recovered.
              </p>
              <div className="field">
                <label htmlFor="delConfirm">Type DELETE to confirm</label>
                <input
                  id="delConfirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleteConfirmText !== "DELETE" || deleting}
                onClick={onDeleteAccount}
              >
                {deleting ? "Deleting…" : "Delete my account"}
              </button>
            </>
          )}

          {/* ============ ACCOUNT TAB ============ */}
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

              <div className="field">
                <label>Email verification</label>
                {currentUser?.emailVerified ? (
                  <span className="hint">✅ Your email is verified.</span>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-accent"
                      onClick={onVerifyEmail}
                      disabled={sendingVerify}
                    >
                      {sendingVerify ? "Sending…" : "Verify email"}
                    </button>
                    <span className="hint">
                      Get a blue tick by verifying your email address.
                    </span>
                  </>
                )}
              </div>
            </>
          )}

          {/* ============ APPEARANCE TAB ============ */}
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
