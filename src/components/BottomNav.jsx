import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  Flame,
  PenLine,
  Trophy,
  MessageCircle,
} from "lucide-react";

const cls = ({ isActive }) => (isActive ? "active" : undefined);

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <NavLink to="/feed" className={cls}>
        <Home size={20} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/following" className={cls}>
        <Users size={20} />
        <span>Following</span>
      </NavLink>
      <NavLink to="/trending" className={cls}>
        <Flame size={20} />
        <span>Trending</span>
      </NavLink>
      <NavLink to="/create" className={cls}>
        <PenLine size={20} />
        <span>Post</span>
      </NavLink>
      <NavLink to="/leaderboard" className={cls}>
        <Trophy size={20} />
        <span>Ranks</span>
      </NavLink>
      <NavLink to="/chat" className={cls}>
        <MessageCircle size={20} />
        <span>Chat</span>
      </NavLink>
    </nav>
  );
}
