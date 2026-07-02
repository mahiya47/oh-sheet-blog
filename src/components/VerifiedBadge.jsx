import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ size = 14 }) {
  return (
    <BadgeCheck
      size={size}
      color="#1d9bf0"
      style={{ marginLeft: 4, verticalAlign: "middle", flexShrink: 0 }}
      aria-label="Verified"
    />
  );
}
