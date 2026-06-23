import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Signup() {
  const { currentUser, signup } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  if (currentUser) return <Navigate to="/feed" replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await signup(form);
    if (res.ok) {
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
