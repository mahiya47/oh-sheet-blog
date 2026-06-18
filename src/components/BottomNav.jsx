import { NavLink } from 'react-router-dom';
import { Home, Users, Flame, PenLine, User } from 'lucide-react';

const cls = ({ isActive }) => (isActive ? 'active' : undefined);

// Shown only on narrow screens (see .bottom-nav in index.css), since the left
// rail is hidden there.
export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <NavLink to="/feed" className={cls}><Home size={20} /><span>Home</span></NavLink>
      <NavLink to="/following" className={cls}><Users size={20} /><span>Following</span></NavLink>
      <NavLink to="/trending" className={cls}><Flame size={20} /><span>Trending</span></NavLink>
      <NavLink to="/create" className={cls}><PenLine size={20} /><span>Post</span></NavLink>
      <NavLink to="/profile" className={cls}><User size={20} /><span>Profile</span></NavLink>
    </nav>
  );
}
