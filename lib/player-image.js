/**
 * TKA Studio — lib/player-image.js
 * © 2026 Ekwan Nugroho — Wonogiri
 * In-memory image store untuk Mode Siswa.
 */
const imageMap = new Map();

export function addImageFiles(files) {
  const promises = [];
  for (const file of files) {
    if (!file.type || !file.type.startsWith('image/')) continue;
    promises.push(new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const key = String(file.name || '').toLowerCase().trim();
        if (key) imageMap.set(key, reader.result);
        resolve();
      };
      reader.onerror = () => resolve();
      reader.readAsDataURL(file);
    }));
  }
  return Promise.all(promises);
}

export function getImage(imgField) {
  if (!imgField) return null;
  const s = String(imgField).trim();
  if (s.startsWith('data:image/')) return s;
  const lower = s.toLowerCase();
  if (imageMap.has(lower)) return imageMap.get(lower);
  const basename = lower.split(/[/\\]/).pop();
  if (basename && imageMap.has(basename)) return imageMap.get(basename);
  return null;
}

export function getImageCount() { return imageMap.size; }
export function clearImages() { imageMap.clear(); }
