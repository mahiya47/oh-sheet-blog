import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Github, Check, X } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getPasswordStrength } from "../lib/passwordStrength.js";
import api from "../api.js";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.4:5000/api";

export default function Signup() {
  const { currentUser, signup } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  if (currentUser) return <Navigate to="/feed" replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const strength = getPasswordStrength(form.password);

  // Live username availability check
  useEffect(() => {
    const uname = form.username.trim();
    if (uname.length < 3) {
      setUsernameAvailable(null);
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
  }, [form.username]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!form.username.trim() || form.username.trim().length < 3) {
      setError("Please choose a username (at least 3 characters).");
      return;
    }
    if (usernameAvailable === false) {
      setError("That username is already taken.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const res = await signup({
      firstName: form.firstName,
      lastName: form.lastName,
      username: form.username.trim(),
      email: form.email,
      password: form.password,
    });

    if (res.ok) {
      toast("Account created. Let's set up your profile!", "accent");
      navigate("/onboarding");
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
            Sign up with Google
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
              value={form.firstName}
              onChange={set("firstName")}
              placeholder="First name"
              autoComplete="given-name"
              style={{ width: "100%" }}
            />
          </div>

          <div className="field">
            <input
              type="text"
              value={form.lastName}
              onChange={set("lastName")}
              placeholder="Last name"
              autoComplete="family-name"
              style={{ width: "100%" }}
            />
          </div>

          <div className="field">
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="text"
                value={form.username}
                onChange={set("username")}
                placeholder="Username"
                autoComplete="username"
                style={{ width: "100%", paddingRight: 36 }}
              />
              {form.username.trim().length >= 3 && (
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
            {usernameAvailable === true && (
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
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="Email address"
              autoComplete="email"
              style={{ width: "100%" }}
            />
          </div>

          <div className="field">
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="Password"
                autoComplete="new-password"
                style={{ width: "100%", paddingRight: 42 }}
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

            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    marginBottom: 4,
                  }}
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background:
                          i < strength.score
                            ? strength.color
                            : "var(--border-soft)",
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "0.75rem", color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <div className="field">
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={set("confirm")}
                placeholder="Confirm password"
                autoComplete="new-password"
                style={{ width: "100%", paddingRight: 42 }}
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
          </div>

          <button
            type="submit"
            className="btn btn-accent btn-block"
            disabled={usernameAvailable === false}
          >
            Create account
          </button>
        </form>

        <div className="auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
