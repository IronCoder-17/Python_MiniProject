// services/compare.js
// Tracks up to 4 property IDs the visitor wants to compare side-by-side.
// Same localStorage + event pattern as wishlist.js.

const KEY = 'iconic_compare_list';
const EVENT = 'iconic:compare-changed';
export const MAX_COMPARE = 4;

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

export function getCompareList() {
  return read();
}

export function isInCompare(propertyId) {
  return read().includes(propertyId);
}

export function toggleCompare(propertyId) {
  const current = read();
  if (current.includes(propertyId)) {
    write(current.filter(id => id !== propertyId));
    return { added: false, list: current.filter(id => id !== propertyId) };
  }
  if (current.length >= MAX_COMPARE) {
    return { added: false, limitReached: true, list: current };
  }
  const next = [...current, propertyId];
  write(next);
  return { added: true, list: next };
}

export function removeFromCompare(propertyId) {
  write(read().filter(id => id !== propertyId));
}

export function clearCompare() {
  write([]);
}

export function onCompareChange(handler) {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
