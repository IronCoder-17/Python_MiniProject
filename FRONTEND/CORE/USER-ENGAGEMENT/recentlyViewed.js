// services/recentlyViewed.js
// Tracks the last few properties a visitor opened, purely client-side.
// Powers the "Recently Viewed Properties" conversion section.

const KEY = 'iconic_recently_viewed';
const MAX_ITEMS = 8;

export function trackView(propertyId) {
  if (!propertyId) return;
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
    const next = [propertyId, ...stored.filter(id => id !== propertyId)].slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore storage errors (e.g. private browsing) */ }
}

export function getRecentlyViewed(excludeId) {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
    return excludeId ? stored.filter(id => String(id) !== String(excludeId)) : stored;
  } catch {
    return [];
  }
}
