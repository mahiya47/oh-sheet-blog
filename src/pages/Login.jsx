import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const { currentUser, login, loginAsDemo } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (currentUser) return <Navigate to="/feed" replace />;

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    const res = login(email, password);
    if (res.ok) {
      toast('Welcome back!', 'accent');
      navigate('/feed');
    } else {
      setError(res.error);
    }
  };

  const onDemo = () => {
    loginAsDemo();
    toast('Signed in as the demo account.', 'accent');
    navigate('/feed');
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="logo wordmark">Oh <span>sheet!</span></h1>
        <p className="subtitle">Welcome back.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" />
          </div>
          <div className="field">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-accent btn-block">Sign in</button>
        </form>

        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={onDemo}>
          Sign in as demo
        </button>

        <p className="demo-note">
          Demo build: sign in with any seeded email (e.g. <strong>debbie@ohsheet.dev</strong>) — passwords
          aren't checked — or just hit “Sign in as demo”.
        </p>

        <div className="auth-foot">
          New here? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
