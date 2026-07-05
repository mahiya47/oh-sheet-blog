// Account-age badge — Reddit-style tenure tiers
export function getAccountAgeBadge(createdAt) {
  if (!createdAt) return null;
  const days = Math.floor((Date.now() - new Date(createdAt)) / 86400000);

  if (days < 30) return { label: "New Sheeper", tier: "new" };
  if (days < 180) return { label: "1 Month+", tier: "bronze" };
  if (days < 365) return { label: "6 Months+", tier: "silver" };
  if (days < 730) return { label: "1 Year+", tier: "gold" };
  return { label: `${Math.floor(days / 365)} Years+`, tier: "platinum" };
}

// Score milestone badge — highest one earned
export function getScoreBadge(score = 0) {
  const milestones = [
    { min: 5000, label: "5,000 Points", tier: "platinum" },
    { min: 1000, label: "1,000 Points", tier: "gold" },
    { min: 500, label: "500 Points", tier: "silver" },
    { min: 100, label: "100 Points", tier: "bronze" },
  ];
  return milestones.find((m) => score >= m.min) || null;
}

export const TIER_COLORS = {
  new: "#8b8b8b",
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#7ee8fa",
};
