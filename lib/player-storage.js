/**
 * TKA Studio — lib/player-storage.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */

const SESSION_KEY = 'tka-player-session-v1';
const HISTORY_KEY = 'tka-player-history-v1';
const MAX_HISTORY = 10;

// ---------- Session (attempt yang sedang berjalan) ----------
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch (e) {
    console.warn('saveSession failed:', e);
    return false;
  }
}

export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

// ---------- History ----------
export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function pushHistory(entry) {
  const history = loadHistory();
  const next = [entry, ...history].slice(0, MAX_HISTORY);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch (e) {
    console.warn('pushHistory failed:', e);
  }
  return next;
}

export function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

export function deleteHistoryItem(id) {
  const next = loadHistory().filter(h => h.id !== id);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
  return next;
}