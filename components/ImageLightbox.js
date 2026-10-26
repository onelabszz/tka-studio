/**
 * TKA Studio — components/ImageLightbox.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { X } from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';

const html = htm.bind(h);

export function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return html`
    <div class="lightbox-overlay" onClick=${onClose}>
      <button class="lightbox-close" onClick=${onClose} aria-label="Tutup">
        <${X} size=${22} />
      </button>
      <img
        src=${src}
        alt=${alt || 'Gambar soal'}
        class="lightbox-image"
        onClick=${(e) => e.stopPropagation()}
      />
    </div>
  `;
}
