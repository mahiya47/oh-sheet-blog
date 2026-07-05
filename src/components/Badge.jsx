import { Sprout, Medal, Trophy, Gem, Star } from "lucide-react";
import { TIER_GRADIENTS } from "../lib/badges.js";

const ICONS = { Sprout, Medal, Trophy, Gem, Star };

export default function Badge({ badge }) {
  if (!badge) return null;
  const Icon = ICONS[badge.icon] || Medal;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px 4px 4px",
        borderRadius: 999,
        background: "var(--surface-2, rgba(255,255,255,0.05))",
        border: "1px solid var(--border, #333)",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: TIER_GRADIENTS[badge.tier],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={12} color="#000" strokeWidth={2.5} />
      </span>
      <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>
        {badge.label}
      </span>
    </div>
  );
}
