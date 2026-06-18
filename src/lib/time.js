// Format an ISO timestamp into a compact "12m / 3h / 2d" relative string.
export function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

// The rotating neobrutalist header colors, matching the CSS tokens --c1..--c10.
const CARD_COLORS = [
  'var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)',
  'var(--c6)', 'var(--c7)', 'var(--c8)', 'var(--c9)', 'var(--c10)',
];

// Deterministic color from an id, so a given post always gets the same
// header color (the original picked randomly on every render, which made
// cards flicker between colors when the feed re-rendered).
export function colorFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

// Initials for the avatar fallback.
export function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
