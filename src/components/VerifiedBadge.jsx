import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ size = 16 }) {
  return (
    <BadgeCheck
      size={size}
      color="#fff"
      fill="#1d9bf0"
      style={{ marginLeft: 4, verticalAlign: "middle", flexShrink: 0 }}
      aria-label="Verified"
    />
  );
}
