import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Github } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.4:5000/api";

export default function Login() {
  const { currentUser, login } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (currentUser) return <Navigate to="/feed" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(email, password);
    if (res.ok) {
      toast("Welcome back!", "accent");
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
        <p className="subtitle">Welcome back.</p>
        <form className="auth-form" onSubmit={onSubmit}>
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
          </div>
          <div className="field" style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
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
          <button type="submit" className="btn btn-accent btn-block">
            Sign in
          </button>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "18px 0",
            color: "var(--text-dim)",
            fontSize: "0.8rem",
          }}
        >
          <div
            style={{ flex: 1, height: 1, background: "var(--border-soft)" }}
          />
          or
          <div
            style={{ flex: 1, height: 1, background: "var(--border-soft)" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a
            href={`${API_URL}/auth/google`}
            className="btn btn-ghost btn-block"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
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
            Continue with Google
          </a>

          <a
            href={`${API_URL}/auth/github`}
            className="btn btn-ghost btn-block"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Github size={16} />
            Continue with GitHub
          </a>
        </div>

        <div className="auth-foot">
          New here? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
