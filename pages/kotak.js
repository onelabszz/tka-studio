/**
 * TKA Studio — pages/kotak.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { 
  ArrowLeft, Trash2, Sparkles, FolderOpen, Eye, X, Check, MessageCircle 
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getKotak, removeFromKotak, clearKotak } from '../lib/pustaka.js';
import { saveDraft } from '../stores/studio.js';
import { ConfirmModal } from '../components/ConfirmModal.js';

const html = htm.bind(h);

export function KotakPage({ navigate }) {
  const [items, setItems] = useState(getKotak());
  const [previewItem, setPreviewItem] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  // --- LOGIKA HAPUS ---
  const handleRemove = (id, index) => {
    setConfirmData({
      title: 'Hapus dari Kotak?',
      message: 'Soal ini akan dihapus dari daftar Kotak Saya Anda.',
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: () => {
        setConfirmData(null);
        removeFromKotak(id);
        setItems(getKotak());
        if (window.showToast) window.showToast('Soal dihapus dari Kotak.', 'info');
      }
    });
  };

  const handleClear = () => {
    if (items.length === 0) return;
    setConfirmData({
      title: 'Kosongkan Kotak?',
      message: 'Semua soal di dalam Kotak Saya akan dihapus.',
      confirmText: 'Ya, Kosongkan',
      isDanger: true,
      onConfirm: () => {
        setConfirmData(null);
        clearKotak();
        setItems([]);
        if (window.showToast) window.showToast('Kotak berhasil dikosongkan.', 'info');
      }
    });
  };

  // --- LOGIKA RAKIT PAKET ---
  const handleRakit = () => {
    if (items.length === 0) return;
    
    // Ambil mapel terbanyak sebagai default judul
    const mapelCounts = {};
    items.forEach(i => { mapelCounts[i.mapel] = (mapelCounts[i.mapel] || 0) + 1; });
    const topMapel = Object.keys(mapelCounts).reduce((a, b) => mapelCounts[a] > mapelCounts[b] ? a : b, 'Campuran');

    // Gabungkan soal dari properti 'konten'
    const soalGabungan = items.map((item, idx) => ({ ...item.konten, id: `s${idx + 1}` }));

    const paketBaru = {
      version: '1.1',
      id: 'paket-rakitan-' + Date.now(),
      judul: 'Paket Rakitan Pustaka',
      mapel: topMapel,
      durasiMenit: soalGabungan.length * 2, 
      acakMode: 'per-tipe',
      latihanMandiri: true,
      soal: soalGabungan
    };

    saveDraft({ paket: paketBaru, warnings: [], originalText: '', savedAt: Date.now() });
    if (window.showToast) window.showToast('Paket berhasil dirakit!', 'success');
    navigate('/preview');
  };

  const truncate = (text, max) => (!text ? '' : (text.length > max ? text.slice(0, max) + '...' : text));

  return html`
    <div class="page">
      <div class="page-shell" style="padding-bottom: 100px;">
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div>
            <button class="btn-back" onClick=${() => navigate('/pustaka')}><${ArrowLeft} size=${16} /> Pustaka</button>
            <h1 class="page-title">Kotak Saya</h1>
            <p class="page-subtitle">${items.length} soal diambil dari Pustaka.</p>
          </div>
          ${items.length > 0 && html`
            <button class="btn-secondary" onClick=${handleClear} style="color: var(--danger); border-color: #fecaca;">
              <${Trash2} size=${16} /> Kosongkan
            </button>
          `}
        </div>

        ${items.length === 0 ? html`
          <div class="empty-state mt-4">
            <${FolderOpen} size=${48} strokeWidth=${1.5} color="var(--text-subtle)" style="margin-bottom: 16px;" />
            <h3 style="margin: 0 0 8px; font-size: 18px; color: var(--text);">Kotak masih kosong</h3>
            <p>Jelajahi Pustaka dan ambil soal-soal terbaik untuk dirakit menjadi paket ujian.</p>
            <button class="btn-primary mt-3" onClick=${() => navigate('/pustaka')}>Ke Pustaka Soal</button>
          </div>
        ` : html`
          <div class="pustaka-grid">
            ${items.map((item, index) => html`
              <div class="pustaka-card">
                <div class="pustaka-card-header">
                  <span class="badge-pg">${item.mapel}</span>
                  <span class="badge-muted">${item.kelas || '-'}</span>
                  <span class=${'soal-badge badge-' + item.tipe}>${item.tipe.toUpperCase()}</span>
                </div>
                
                <div class="pustaka-card-body">
                  <div class="pustaka-q">${truncate(item.konten.q, 120)}</div>
                </div>

                <div class="pustaka-card-actions">
                  <button class="btn-secondary btn-sm" onClick=${() => setPreviewItem(item)}>
                    <${Eye} size=${14} /> Preview
                  </button>
                  <button class="btn-danger btn-sm" onClick=${() => handleRemove(item.id, index)} style="flex: 1; border-color: transparent;">
                    <${Trash2} size=${14} /> Hapus
                  </button>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>

      <!-- STICKY BOTTOM BAR -->
      ${items.length > 0 && html`
        <div class="sticky-bottom no-print">
          <div class="page-shell" style="padding: 0 var(--space-4) var(--space-4); max-width: 860px;">
            <button class="btn-primary btn-large w-full" onClick=${handleRakit} style="box-shadow: 0 8px 24px rgba(30, 64, 175, 0.3);">
              <${Sparkles} size=${20} /> Susun ${items.length} Soal Jadi Paket Ujian
            </button>
          </div>
        </div>
      `}

      <!-- MODAL PREVIEW SOAL -->
      ${previewItem && html`
        <div class="modal-backdrop" onClick=${() => setPreviewItem(null)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal-header">
              <div class="modal-title"><${Eye} size=${18} /> Detail Soal</div>
              <button class="modal-close" onClick=${() => setPreviewItem(null)}><${X} size=${18} /></button>
            </div>
            <div class="modal-body">
              <div class="pustaka-preview-meta">
                <span class="badge-pg">${previewItem.mapel}</span>
                ${previewItem.kelas && html`<span class="badge-muted">${previewItem.kelas}</span>`}
                <span class=${'soal-badge badge-' + previewItem.tipe}>${previewItem.tipe.toUpperCase()}</span>
              </div>

              <div class="soal-question" style="margin-top: 16px; font-size: 15px;">
                ${previewItem.konten.q}
              </div>

              ${previewItem.tipe !== 'bs' && previewItem.konten.options && html`
                <div class="soal-options" style="margin-top: 12px;">
                  ${previewItem.konten.options.map((opt, oi) => {
                    const isCorrect = previewItem.tipe === 'pg'
                      ? previewItem.konten.key === oi
                      : (previewItem.konten.key || []).includes(oi);
                    return html`
                      <div class=${'soal-option' + (isCorrect ? ' correct' : '')}>
                        <span class="soal-option-letter">${'ABCD'[oi]}</span>
                        <span class="soal-option-text">${opt}</span>
                        ${isCorrect && html`<${Check} size=${14} class="soal-option-check" />`}
                      </div>
                    `;
                  })}
                </div>
              `}

              ${previewItem.tipe === 'bs' && previewItem.konten.pernyataan && html`
                <div class="soal-bs-list" style="margin-top: 12px;">
                  ${previewItem.konten.pernyataan.map((p, pi) => html`
                    <div class="soal-bs-item">
                      <span class="soal-bs-num">${pi + 1}.</span>
                      <span class="soal-bs-text">${p.teks}</span>
                      <span class=${'soal-bs-key ' + (p.key ? 'key-true' : 'key-false')}>
                        ${p.key ? 'Benar' : 'Salah'}
                      </span>
                    </div>
                  `)}
                </div>
              `}

              ${previewItem.konten.pembahasan && html`
                <div class="soal-explanation" style="margin-top: 12px;">
                  <${MessageCircle} size=${13} />
                  <span>${previewItem.konten.pembahasan}</span>
                </div>
              `}
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onClick=${() => setPreviewItem(null)}>Tutup</button>
            </div>
          </div>
        </div>
      `}

      <!-- CUSTOM CONFIRM MODAL -->
      ${confirmData && html`
        <${ConfirmModal} 
          title=${confirmData.title} 
          message=${confirmData.message} 
          confirmText=${confirmData.confirmText}
          isDanger=${confirmData.isDanger}
          onConfirm=${confirmData.onConfirm} 
          onCancel=${() => setConfirmData(null)} 
        />
      `}
    </div>
  `;
}
