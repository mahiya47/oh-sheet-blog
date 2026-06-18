import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="content-card" style={{ textAlign: 'center' }}>
      <h1 style={{ borderBottom: 'none' }}>404 — Oh sheet.</h1>
      <p>That page doesn’t exist (or never did).</p>
      <p style={{ marginTop: 16 }}>
        <Link to="/feed" className="btn btn-accent">Back to the feed</Link>
      </p>
    </div>
  );
}
