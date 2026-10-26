/**
 * TKA Studio — lib/player-image.js
 * © 2026 Ekwan Nugroho — Wonogiri
 *
 * Image store + resolver untuk Mode Siswa & Preview Guru.
 * Support:
 *   - img_data (base64 inline) → primary
 *   - img (base64) → backwards compat
 *   - img (filename) → lookup di in-memory map
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

/**
 * Resolve src gambar untuk 1 soal.
 * @param {object} soal - objek soal (butuh img_data atau img)
 * @returns {string|null} data URL atau null
 */
export function getImage(soal) {
  if (!soal) return null;

  // Priority 1: img_data (base64 inline)
  if (soal.img_data && typeof soal.img_data === 'string' && soal.img_data.startsWith('data:image/')) {
    return soal.img_data;
  }

  // Priority 2: img yang sudah base64
  if (!soal.img) return null;
  const s = String(soal.img).trim();
  if (!s) return null;
  if (s.startsWith('data:image/')) return s;

  // Priority 3: img sebagai filename → lookup di imageMap
  const lower = s.toLowerCase();
  if (imageMap.has(lower)) return imageMap.get(lower);
  const basename = lower.split(/[/\\]/).pop();
  if (basename && imageMap.has(basename)) return imageMap.get(basename);

  return null;
}

export function getImageCount() { return imageMap.size; }
export function clearImages() { imageMap.clear(); }
