import { BadgeCheck } from "lucide-react";

// variant: "verified" (blue, default) | "creator" (gold) | "pride" (rainbow ring)
export default function VerifiedBadge({ size = 14, variant = "verified" }) {
  if (variant === "pride") {
    const ringSize = size + 6;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: ringSize,
          height: ringSize,
          borderRadius: "50%",
          background:
            "conic-gradient(from 90deg, #ff3e3e, #ffa53e, #fff03e, #3eff8b, #3e54ff, #9d3eff, #ff3e3e)",
          marginLeft: 4,
          verticalAlign: "middle",
          flexShrink: 0,
        }}
        aria-label="Verified · LGBTQ+"
      >
        <BadgeCheck size={size} color="#fff" fill="#00000055" />
      </span>
    );
  }

  return (
    <BadgeCheck
      size={size}
      color="#fff"
      fill={variant === "creator" ? "#ffd700" : "#1d9bf0"}
      style={{ marginLeft: 4, verticalAlign: "middle", flexShrink: 0 }}
      aria-label={variant === "creator" ? "Creator" : "Verified"}
    />
  );
}
