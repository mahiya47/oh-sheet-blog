import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
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

export default function Signup() {
  const { currentUser, signup, updateProfile } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState("");

  if (currentUser) return <Navigate to="/feed" replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    const res = await signup({
      username: form.username,
      email: form.email,
      password: form.password,
    });

    if (res.ok) {
      // if they picked/uploaded an avatar, save it after signup logs them in
      if (avatarUrl) {
        await updateProfile({
          name: form.username,
          username: form.username,
          bio: "",
          avatarUrl,
        });
      }
      toast("Account created. Welcome to Oh Sheet!", "accent");
      navigate("/feed");
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="logo wordmark">
          Oh <span>sheet!</span>
        </h1>
        <p className="subtitle">Create your account.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="field">
            <input
              type="text"
              value={form.username}
              onChange={set("username")}
              placeholder="Username"
              autoComplete="username"
            />
          </div>
          <div className="field">
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="Email address"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="Password"
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <input
              type="password"
              value={form.confirm}
              onChange={set("confirm")}
              placeholder="Confirm password"
              autoComplete="new-password"
            />
          </div>

          <div className="pfp-row">
            <Avatar
              user={{ username: form.username, email: form.email, avatarUrl }}
              size={64}
            />
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
            <label>Or choose an avatar (optional)</label>
            <AvatarPicker
              value={avatarUrl}
              onSelect={setAvatarUrl}
              seedBase={form.username || form.email || "newuser"}
            />
          </div>

          <button type="submit" className="btn btn-accent btn-block">
            Create account
          </button>
        </form>

        <p className="demo-note">
          Pick a unique username — you can change it later in Settings.
        </p>

        <div className="auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
