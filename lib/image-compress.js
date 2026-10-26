/**
 * TKA Studio — lib/image-compress.js
 * © 2026 Ekwan Nugroho — Wonogiri
 *
 * Kompres gambar di browser: resize + WebP + quality reduction.
 * Zero server. Zero dependency.
 */

export const DEFAULT_OPTIONS = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.85,
  format: 'auto',
  maxSizeKb: 500,
};

const SKIP_TYPES = ['image/svg+xml', 'image/gif'];

// Cache WebP support detection
let _webpSupport = null;
function supportsWebP() {
  if (_webpSupport !== null) return _webpSupport;
  try {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    _webpSupport = c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch { _webpSupport = false; }
  return _webpSupport;
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gagal load gambar')); };
    img.src = url;
  });
}

function dataUrlKb(dataUrl) {
  return Math.round((dataUrl.length - 22) * 0.75 / 1024);
}

async function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Gagal baca file'));
    r.readAsDataURL(file);
  });
}

/**
 * Kompres gambar. Return { dataUrl, originalSize, compressedSize, width, height, quality, format, savedPct, skipped? }
 */
export async function compressImage(file, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip SVG/GIF
  if (SKIP_TYPES.includes(file.type)) {
    const dataUrl = await readAsDataURL(file);
    return {
      dataUrl,
      originalSize: file.size,
      compressedSize: Math.round(dataUrl.length * 0.75),
      width: 0, height: 0, quality: 1,
      format: file.type,
      savedPct: 0,
      skipped: true,
      skipReason: file.type === 'image/gif' ? 'GIF (animasi)' : 'SVG (vector)',
    };
  }

  const img = await loadImageElement(file);
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Compute target dimensions
  let targetW = origW;
  let targetH = origH;
  if (origW > opts.maxWidth || origH > opts.maxHeight) {
    const ratio = Math.min(opts.maxWidth / origW, opts.maxHeight / origH);
    targetW = Math.max(1, Math.round(origW * ratio));
    targetH = Math.max(1, Math.round(origH * ratio));
  }

  // Draw
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Format
  let format = opts.format;
  if (format === 'auto') format = supportsWebP() ? 'image/webp' : 'image/jpeg';

  // First attempt
  let quality = opts.quality;
  let dataUrl = canvas.toDataURL(format, quality);

  // WebP fallback detection (Safari <14 returns PNG)
  if (format === 'image/webp' && dataUrl.startsWith('data:image/png')) {
    format = 'image/jpeg';
    dataUrl = canvas.toDataURL(format, quality);
  }

  // Iteratively reduce if too big
  let attempts = 0;
  while (dataUrlKb(dataUrl) > opts.maxSizeKb && quality > 0.45 && attempts < 6) {
    quality = Math.max(0.45, quality - 0.08);
    dataUrl = canvas.toDataURL(format, quality);
    attempts++;
  }

  const compressedSize = Math.round(dataUrl.length * 0.75);
  const originalSize = file.size || 0;
  const savedPct = originalSize > 0
    ? Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))
    : 0;

  return {
    dataUrl,
    originalSize,
    compressedSize,
    originalWidth: origW,
    originalHeight: origH,
    width: targetW,
    height: targetH,
    quality,
    format,
    savedPct,
    resized: targetW !== origW || targetH !== origH,
    usedFallback: attempts > 0,
  };
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
