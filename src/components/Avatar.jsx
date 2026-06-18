import { colorFor, initials } from '../lib/time.js';

// Renders a user's avatar image, or a colored initials block when there isn't
// one. The original app fell back to a single shared dp.jpg for everyone.
export default function Avatar({ user, size = 40 }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };

  if (user?.avatarUrl) {
    return (
      <span className="avatar" style={style}>
        <img src={user.avatarUrl} alt={user.displayName || 'avatar'} />
      </span>
    );
  }

  return (
    <span
      className="avatar"
      style={{ ...style, background: colorFor(user?.id || '?'), color: '#000', borderColor: '#000' }}
      aria-hidden="true"
    >
      {initials(user?.displayName || user?.username)}
    </span>
  );
}
