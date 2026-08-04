import { useRef, useState, useEffect, useCallback } from "react";
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
  X,
} from "lucide-react";
import Cropper from "react-easy-crop";
import { useStore } from "../lib/store.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { GENDER_OPTIONS, ORIENTATION_OPTIONS } from "../lib/profileOptions.js";
import { COVERS } from "../lib/covers.js";
import Avatar from "../components/Avatar.jsx";
import AvatarPicker from "../components/AvatarPicker.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.4:5000/api";

const PRONOUN_OPTIONS = [
  "He/Him",
  "She/Her",
  "They/Them",
  "He/They",
  "She/They",
  "Ze/Zir",
  "Xe/Xem",
];

const SELF = "Prefer to self-describe";

// Custom Pinterest Icon matching Lucide sizing
const PinterestIcon = ({ size = 18, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={style}
  >
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.163 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.633 0 12.017 0z" />
  </svg>
);

function isValidUrl(value) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// --- Cropper Utility Functions ---
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getCroppedImageDataUrl(imageSrc, cropPixels, max = 1200) {
  const img = await loadImage(imageSrc);

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropPixels.width;
  cropCanvas.height = cropPixels.height;
  const cropCtx = cropCanvas.getContext("2d");
  cropCtx.drawImage(
    img,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height,
  );

  const scale = Math.min(
    1,
    max / Math.max(cropCanvas.width, cropCanvas.height),
  );
  const w = Math.round(cropCanvas.width * scale);
  const h = Math.round(cropCanvas.height * scale);
  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  outCanvas.getContext("2d").drawImage(cropCanvas, 0, 0, w, h);

  return outCanvas.toDataURL("image/jpeg", 0.85);
}
// ---------------------------------

export default function SettingsPage() {
  const {
    currentUser,
    updateProfile,
    resendVerification,
    getBlockedUsers,
    unblockUser,
    deleteAccount,
  } = useStore();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const coverFileRef = useRef(null);

  const [tab, setTab] = useState("profile");
  const [dirty, setDirty] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);

  // --- Crop Modal State ---
  const [cropSrc, setCropSrc] = useState(null);
  const [cropType, setCropType] = useState(null); // "avatar" or "cover"
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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

  const storedPronouns = currentUser?.pronouns || "";
  const pronounsIsPreset = PRONOUN_OPTIONS.includes(storedPronouns);
  const [pronounsChoice, setPronounsChoice] = useState(
    storedPronouns ? (pronounsIsPreset ? storedPronouns : SELF) : "",
  );
  const [pronounsCustom, setPronounsCustom] = useState(
    storedPronouns && !pronounsIsPreset ? storedPronouns : "",
  );

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
  const [pinterestUrl, setPinterestUrl] = useState(
    currentUser?.pinterestUrl || "",
  );

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
    pronounsChoice,
    pronounsCustom,
    currentCity,
    work,
    education,
    githubUrl,
    instagramUrl,
    linkedinUrl,
    twitterUrl,
    pinterestUrl,
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

  // --- Crop Triggers & Handlers ---
  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropType("avatar");
      setCropSrc(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch {
      toast("Couldn't load that image.", "danger");
    }
    e.target.value = "";
  };

  const onPickCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropType("cover");
      setCropSrc(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch {
      toast("Couldn't load that image.", "danger");
    }
    e.target.value = "";
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onConfirmCrop = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    try {
      // 256 for avatars, 1200 for cover images
      const maxSize = cropType === "avatar" ? 256 : 1200;
      const dataUrl = await getCroppedImageDataUrl(
        cropSrc,
        croppedAreaPixels,
        maxSize,
      );

      if (cropType === "avatar") {
        setAvatarUrl(dataUrl);
        toast("Photo ready — hit Save changes.", "accent");
      } else {
        setCoverUrl(dataUrl);
        toast("Cover ready — hit Save changes.", "accent");
      }

      setCropSrc(null);
      setCropType(null);
    } catch {
      toast("Couldn't crop that image.", "danger");
    }
  };

  const onCancelCrop = () => {
    setCropSrc(null);
    setCropType(null);
  };
  // --------------------------------

  const onSave = async () => {
    const urls = {
      githubUrl,
      twitterUrl,
      linkedinUrl,
      instagramUrl,
      pinterestUrl,
    };
    const hasInvalidUrl = Object.values(urls).some((u) => !isValidUrl(u));
    if (hasInvalidUrl) {
      toast("Please fix the invalid social links before saving.", "danger");
      return;
    }

    const gender = genderChoice === SELF ? genderCustom.trim() : genderChoice;
    const orientation = oriChoice === SELF ? oriCustom.trim() : oriChoice;
    const pronouns =
      pronounsChoice === SELF ? pronounsCustom.trim() : pronounsChoice;

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
      pinterestUrl,
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

  const onConnect = (provider) => {
    const token = localStorage.getItem("token");
    window.location.href = `${API_URL}/auth/${provider}/link?token=${encodeURIComponent(token)}`;
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
                <label htmlFor="pronouns">Pronouns</label>
                <select
                  id="pronouns"
                  value={pronounsChoice}
                  onChange={(e) => setPronounsChoice(e.target.value)}
                >
                  <option value="">Select…</option>
                  {PRONOUN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value={SELF}>{SELF}</option>
                </select>
                {pronounsChoice === SELF && (
                  <input
                    type="text"
                    value={pronounsCustom}
                    onChange={(e) => setPronounsCustom(e.target.value)}
                    placeholder="Describe your pronouns"
                    style={{ marginTop: 8 }}
                  />
                )}
                <span className="hint">
                  Shown next to your name on your profile.
                </span>
              </div>

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

                <div style={{ marginBottom: 8 }}>
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

                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <PinterestIcon
                      size={18}
                      style={{ flexShrink: 0, opacity: 0.7 }}
                    />
                    <input
                      type="url"
                      value={pinterestUrl}
                      onChange={(e) => setPinterestUrl(e.target.value)}
                      placeholder="https://pinterest.com/yourusername"
                      style={{
                        borderColor: !isValidUrl(pinterestUrl)
                          ? "var(--danger, #ff3e3e)"
                          : undefined,
                      }}
                    />
                  </div>
                  {!isValidUrl(pinterestUrl) && (
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

              <div className="field">
                <label>Connected accounts</label>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "2px solid var(--border-soft)",
                    borderRadius: "var(--radius)",
                    padding: "12px 14px",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </span>
                  {currentUser?.googleId ? (
                    <span
                      className="hint"
                      style={{ color: "var(--accent, #3eff8b)" }}
                    >
                      ✅ Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => onConnect("google")}
                    >
                      Connect
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "2px solid var(--border-soft)",
                    borderRadius: "var(--radius)",
                    padding: "12px 14px",
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <Github size={18} />
                    GitHub
                  </span>
                  {currentUser?.githubId ? (
                    <span
                      className="hint"
                      style={{ color: "var(--accent, #3eff8b)" }}
                    >
                      ✅ Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => onConnect("github")}
                    >
                      Connect
                    </button>
                  )}
                </div>
                <span className="hint">
                  Link an account to sign in faster next time.
                </span>
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

      {/* ============ CROP MODAL ============ */}
      {cropSrc && (
        <div className="overlay" onClick={onCancelCrop}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 420,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ position: "relative", width: "100%", height: 420 }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropType === "avatar" ? 1 : 3}
                cropShape={cropType === "avatar" ? "round" : "rect"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div style={{ padding: "var(--space-4)" }}>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={onConfirmCrop}
                  style={{ flex: 1 }}
                >
                  Crop & use
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onCancelCrop}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
