import { colorFor, initials } from "../lib/time.js";

export default function Avatar({ user, size = 40 }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };

  if (user?.avatarUrl) {
    return (
      <span className="avatar" style={style}>
        <img src={user.avatarUrl} alt={user.displayName || "avatar"} />
      </span>
    );
  }

  const seed = encodeURIComponent(
    user?.username ||
      user?.displayName ||
      user?.email ||
      String(user?.id || "guest"),
  );
  const fallbackUrl = `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}`;

  return (
    <span className="avatar" style={style}>
      <img src={fallbackUrl} alt={user?.displayName || "avatar"} />
    </span>
  );
}
