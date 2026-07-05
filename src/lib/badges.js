// Account-age badge — Reddit-style tenure tiers
export function getAccountAgeBadge(createdAt) {
  if (!createdAt) return null;
  const days = Math.floor((Date.now() - new Date(createdAt)) / 86400000);

  if (days < 30) return { label: "New Sheeter", tier: "new", icon: "Sprout" };
  if (days < 180) return { label: "1 Month+", tier: "bronze", icon: "Medal" };
  if (days < 365) return { label: "6 Months+", tier: "silver", icon: "Medal" };
  if (days < 730) return { label: "1 Year+", tier: "gold", icon: "Trophy" };
  return {
    label: `${Math.floor(days / 365)} Years+`,
    tier: "platinum",
    icon: "Gem",
  };
}

// Score milestone badge — highest one earned
export function getScoreBadge(score = 0) {
  const milestones = [
    { min: 5000, label: "Legendary Sheep", tier: "platinum", icon: "Gem" },
    { min: 1000, label: "Sheep Master", tier: "gold", icon: "Trophy" },
    { min: 500, label: "Rising Star", tier: "silver", icon: "Star" },
    { min: 100, label: "Getting Started", tier: "bronze", icon: "Medal" },
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

export const TIER_GRADIENTS = {
  new: "linear-gradient(135deg, #6b6b6b, #a0a0a0)",
  bronze: "linear-gradient(135deg, #cd7f32, #e8a15c)",
  silver: "linear-gradient(135deg, #b0b0b0, #e8e8e8)",
  gold: "linear-gradient(135deg, #d4af37, #ffe98a)",
  platinum: "linear-gradient(135deg, #4fc3d9, #a8f0ff)",
};
