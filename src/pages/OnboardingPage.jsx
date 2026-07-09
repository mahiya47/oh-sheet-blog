import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
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

export default function OnboardingPage() {
  const { currentUser, updateProfile } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [username, setUsername] = useState(currentUser?.username || "");
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || "",
  );
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    if (!username.trim()) {
      setError("Pick a username to continue.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await updateProfile({
      name: displayName.trim() || username.trim(),
      username: username.trim(),
      bio,
      avatarUrl,
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
          <label htmlFor="ob-username">Username</label>
          <input
            id="ob-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
        </div>

        <div className="field">
          <label htmlFor="ob-name">Display name</label>
          <input
            id="ob-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
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

        <button
          type="button"
          className="btn btn-accent btn-block"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Continue to Oh Sheet!"}
        </button>
      </div>
    </div>
  );
}
