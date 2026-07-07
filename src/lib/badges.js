// Account-age badge — Reddit-style tenure tiers
export function getAccountAgeBadge(createdAt) {
  if (!createdAt) return null;
  const days = Math.floor((Date.now() - new Date(createdAt)) / 86400000);

  if (days < 180) return null; // no badge until 6 months — skip "New Sheeper"
  if (days < 365)
    return { label: "6 Months Club", tier: "bronze", icon: "Medal" };
  if (days < 730)
    return { label: "1 Year Sheep", tier: "silver", icon: "Trophy" };
  if (days < 1460)
    return { label: "2 Year Veteran", tier: "gold", icon: "Trophy" };
  return {
    label: `${Math.floor(days / 365)} Year OG`,
    tier: "platinum",
    icon: "Gem",
  };
}

// Score milestone badges — highest one earned
export function getScoreBadge(score = 0) {
  const milestones = [
    { min: 10000, label: "Sheet Legend", tier: "platinum", icon: "Gem" },
    { min: 5000, label: "Top Sheeter", tier: "gold", icon: "Crown" },
    { min: 2000, label: "Sheet Master", tier: "gold", icon: "Trophy" },
    { min: 1000, label: "Sheet Pro", tier: "silver", icon: "Star" },
    { min: 500, label: "Rising Star", tier: "silver", icon: "Star" },
    { min: 100, label: "Active Sheet", tier: "bronze", icon: "Medal" },
  ];
  return milestones.find((m) => score >= m.min) || null;
}

// Post-count badge — rewards content creators
export function getPostCountBadge(postCount = 0) {
  const milestones = [
    { min: 500, label: "Prolific Poster", tier: "platinum", icon: "Feather" },
    { min: 100, label: "Content Machine", tier: "gold", icon: "Feather" },
    { min: 25, label: "Regular Poster", tier: "silver", icon: "Feather" },
    { min: 5, label: "First Sheets", tier: "bronze", icon: "Feather" },
  ];
  return milestones.find((m) => postCount >= m.min) || null;
}

export const TIER_COLORS = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#7ee8fa",
};

export const TIER_GRADIENTS = {
  bronze: "linear-gradient(135deg, #cd7f32, #e8a15c)",
  silver: "linear-gradient(135deg, #b0b0b0, #e8e8e8)",
  gold: "linear-gradient(135deg, #d4af37, #ffe98a)",
  platinum: "linear-gradient(135deg, #4fc3d9, #a8f0ff)",
};
