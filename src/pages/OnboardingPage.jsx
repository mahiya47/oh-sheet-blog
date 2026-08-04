import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { GENDER_OPTIONS, ORIENTATION_OPTIONS } from "../lib/profileOptions.js";
import Avatar from "../components/Avatar.jsx";
import AvatarPicker from "../components/AvatarPicker.jsx";
import api from "../api.js";

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

export default function OnboardingPage() {
  const { currentUser, updateProfile } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // If the backend generated a temporary username starting with "user_", clear it out so they can pick their own.
  const initialUsername = currentUser?.username?.startsWith("user_")
    ? ""
    : currentUser?.username || "";

  const [username, setUsername] = useState(initialUsername);
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [bio, setBio] = useState("");
  const [birthday, setBirthday] = useState("");

  const [genderChoice, setGenderChoice] = useState("");
  const [genderCustom, setGenderCustom] = useState("");
  const [oriChoice, setOriChoice] = useState("");
  const [oriCustom, setOriCustom] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // Check username availability as they type
  useEffect(() => {
    const uname = username.trim();
    if (uname.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    // Don't re-check if they just left their current username alone
    if (uname === currentUser?.username) {
      setUsernameAvailable(true);
      return;
    }

    setCheckingUsername(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get(
          `/users/check-username/${encodeURIComponent(uname)}`,
        );
        setUsernameAvailable(res.data.available);
      } catch {
        setUsernameAvailable(null);
      }
      setCheckingUsername(false);
    }, 400);
    return () => clearTimeout(t);
  }, [username, currentUser?.username]);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarUrl(dataUrl);
      toast("Photo ready.", "accent");
    } catch {
      toast("Couldn't load that image.", "danger");
    }
  };

  const onSave = async () => {
    if (!username.trim() || username.length < 3) {
      setError(
        "Please pick a valid username (at least 3 characters) to continue.",
      );
      return;
    }
    if (usernameAvailable === false) {
      setError("That username is already taken.");
      return;
    }

    setSaving(true);
    setError("");

    const gender = genderChoice === SELF ? genderCustom.trim() : genderChoice;
    const orientation = oriChoice === SELF ? oriCustom.trim() : oriChoice;

    const res = await updateProfile({
      username: username.trim(),
      bio,
      avatarUrl,
      birthday: birthday || undefined,
      gender,
      orientation,
      showGender: false,
      showOrientation: false,
    });
    setSaving(false);

    if (res.ok) {
      toast("You're all set!", "accent");
      navigate("/feed");
    } else {
      setError(res.error || "Could not save. Try a different username.");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="logo wordmark">
          Oh <span>sheet!</span>
        </h1>
        <p className="subtitle">Welcome! Let's set up your profile.</p>

        {error && <div className="form-error">{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="pfp-row">
            <Avatar user={{ username, avatarUrl }} size={72} />
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
              onSelect={setAvatarUrl}
              seedBase={username || "newuser"}
            />
          </div>

          <div className="field">
            <label htmlFor="ob-username">Choose your Username</label>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                id="ob-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                autoComplete="username"
                style={{ width: "100%", paddingRight: 36 }}
              />
              {username.trim().length >= 3 && (
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  {checkingUsername ? (
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid var(--border-soft)",
                        borderTopColor: "var(--accent)",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                  ) : usernameAvailable === true ? (
                    <Check size={16} color="#3eff8b" />
                  ) : usernameAvailable === false ? (
                    <X size={16} color="#ff3e3e" />
                  ) : null}
                </span>
              )}
            </div>
            {usernameAvailable === false && (
              <span
                style={{ fontSize: "0.75rem", color: "var(--danger, #ff3e3e)" }}
              >
                That username is taken.
              </span>
            )}
            {usernameAvailable === true &&
              username !== currentUser?.username && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--accent, #3eff8b)",
                  }}
                >
                  Available!
                </span>
              )}
          </div>

          <div className="field">
            <label htmlFor="ob-bio">Bio (optional)</label>
            <textarea
              id="ob-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              placeholder="Tell the world about yourself…"
              style={{ minHeight: 90 }}
              maxLength={160}
            />
          </div>

          <div className="field">
            <label htmlFor="ob-bday">Birthday (optional)</label>
            <input
              id="ob-bday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="ob-gender">Gender (optional)</label>
            <select
              id="ob-gender"
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
          </div>

          <div className="field">
            <label htmlFor="ob-ori">Orientation (optional)</label>
            <select
              id="ob-ori"
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
          </div>

          <button
            type="button"
            className="btn btn-accent btn-block"
            onClick={onSave}
            disabled={saving || usernameAvailable === false}
          >
            {saving ? "Saving…" : "Continue to Oh Sheet!"}
          </button>
        </div>
      </div>
    </div>
  );
}
