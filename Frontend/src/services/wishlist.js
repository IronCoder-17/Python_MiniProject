// services/wishlist.js
// Local wishlist store. Works instantly with zero backend changes.
// When a real /api/wishlist endpoint exists, swap the bodies below for
// API calls — the component-facing functions (isWishlisted, toggleWishlist,
// getWishlist) stay the same, so nothing else in the app needs to change.

const KEY = 'iconic_wishlist';
const EVENT = 'iconic:wishlist-changed';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(ids) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: ids }));
}

export function getWishlist() {
  return read();
}

export function isWishlisted(propertyId) {
  return read().includes(propertyId);
}

export function toggleWishlist(propertyId) {
  const current = read();
  const next = current.includes(propertyId)
    ? current.filter(id => id !== propertyId)
    : [...current, propertyId];
  write(next);
  return next.includes(propertyId);
}

export function wishlistCount() {
  return read().length;
}

export function onWishlistChange(handler) {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
