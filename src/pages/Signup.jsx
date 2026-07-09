import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Github } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { GENDER_OPTIONS, ORIENTATION_OPTIONS } from "../lib/profileOptions.js";
import Avatar from "../components/Avatar.jsx";
import AvatarPicker from "../components/AvatarPicker.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.4:5000/api";

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
    birthday: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [genderChoice, setGenderChoice] = useState("");
  const [genderCustom, setGenderCustom] = useState("");
  const [oriChoice, setOriChoice] = useState("");
  const [oriCustom, setOriCustom] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      const gender = genderChoice === SELF ? genderCustom.trim() : genderChoice;
      const orientation = oriChoice === SELF ? oriCustom.trim() : oriChoice;

      if (avatarUrl || gender || orientation || form.birthday) {
        await updateProfile({
          name: form.username,
          username: form.username,
          bio: "",
          avatarUrl,
          gender,
          orientation,
          showGender: false,
          showOrientation: false,
          birthday: form.birthday || undefined,
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 18,
          }}
        >
          href={`${API_URL}/auth/google`}
          className="btn btn-ghost btn-block" style=
          {{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          <a>
            <svg width="16" height="16" viewBox="0 0 24 24">
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
            Sign up with Google
          </a>
          href={`${API_URL}/auth/github`}
          className="btn btn-ghost btn-block" style=
          {{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          <a>
            <Github size={16} />
            Sign up with GitHub
          </a>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "0 0 18px",
            color: "var(--text-dim)",
            fontSize: "0.8rem",
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: "var(--border-soft)" }}
          />
          or sign up with email
          <div
            style={{ flex: 1, height: 1, background: "var(--border-soft)" }}
          />
        </div>

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
          <div className="field" style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              placeholder="Password"
              autoComplete="new-password"
              style={{ paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <div className="field" style={{ position: "relative" }}>
            <input
              type={showConfirm ? "text" : "password"}
              value={form.confirm}
              onChange={set("confirm")}
              placeholder="Confirm password"
              autoComplete="new-password"
              style={{ paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
              }}
            >
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <div className="field">
            <label htmlFor="su-bday">Birthday (optional)</label>
            <input
              id="su-bday"
              type="date"
              value={form.birthday}
              onChange={set("birthday")}
            />
          </div>

          <div className="field">
            <label htmlFor="su-gender">Gender (optional)</label>
            <select
              id="su-gender"
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
            <label htmlFor="su-ori">Orientation (optional)</label>
            <select
              id="su-ori"
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
