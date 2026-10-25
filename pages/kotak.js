/**
 * TKA Studio — pages/kotak.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, Trash2, Sparkles, FolderOpen, Eye, X, Check, MessageCircle,
  ShoppingCart, User, Download, Layers, Clock, BookOpen
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getKotak, removeFromKotak, clearKotak } from '../lib/pustaka.js';
import { saveDraft } from '../stores/studio.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { PageHero } from '../components/PageHero.js';

const html = htm.bind(h);

function initials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function KotakPage({ navigate }) {
  const [items, setItems] = useState(getKotak());
  const [previewItem, setPreviewItem] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    if (previewItem) {
      const timer = setTimeout(() => {
        if (window.renderMath) window.renderMath();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [previewItem]);

  const handleRemove = (id) => {
    setConfirmData({
      title: 'Hapus dari Kotak?',
      message: 'Soal ini akan dihapus dari daftar Keranjang Soal Anda.',
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: () => {
        setConfirmData(null);
        removeFromKotak(id);
        setItems(getKotak());
        if (window.showToast) window.showToast('Soal dihapus dari keranjang.', 'info');
      }
    });
  };

  const handleClear = () => {
    if (items.length === 0) return;
    setConfirmData({
      title: 'Kosongkan Keranjang?',
      message: 'Semua soal di dalam Keranjang Soal akan dihapus. Tindakan ini tidak bisa dibatalkan.',
      confirmText: 'Ya, Kosongkan',
      isDanger: true,
      onConfirm: () => {
        setConfirmData(null);
        clearKotak();
        setItems([]);
        if (window.showToast) window.showToast('Keranjang berhasil dikosongkan.', 'info');
      }
    });
  };

  const handleRakit = () => {
    if (items.length === 0) return;

    const mapelCounts = {};
    items.forEach(i => { mapelCounts[i.mapel] = (mapelCounts[i.mapel] || 0) + 1; });
    const topMapel = Object.keys(mapelCounts).reduce((a, b) => mapelCounts[a] > mapelCounts[b] ? a : b, 'Campuran');

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
    if (window.showToast) window.showToast('Paket berhasil dirakit! Lanjut preview.', 'success');
    navigate('/preview');
  };

  const truncate = (text, max) => (!text ? '' : (text.length > max ? text.slice(0, max) + '...' : text));

  const mapelUnique = new Set(items.map(i => i.mapel)).size;
  const estimasiMenit = items.length * 2;

  const chips = items.length > 0
    ? [
        { icon: ShoppingCart, text: `${items.length} soal` },
        { icon: BookOpen, text: `${mapelUnique} mapel` },
        { icon: Clock, text: `~${estimasiMenit} menit` }
      ]
    : null;

  return html`
    <div class="page">
      <div class="page-shell page-shell-wide" style="padding-bottom: 20px;">
        <${PageHero}
          icon=${ShoppingCart}
          title="Keranjang Soal"
          subtitle="Soal-soal pilihan dari Pustaka. Rakit menjadi paket ujian sekali klik."
          chips=${chips}
          topnav=${html`
            <button class="btn-back" onClick=${() => navigate('/pustaka')}><${ArrowLeft} size=${16} /> Pustaka</button>
            ${items.length > 0 && html`
              <button class="btn-secondary btn-sm" onClick=${handleClear} style="color: var(--danger); border-color: #fecaca;">
                <${Trash2} size=${14} /> Kosongkan
              </button>
            `}
          `}
        />

        ${items.length === 0 ? html`
          <div class="empty-state">
            <div class="empty-state-icon"><${ShoppingCart} size=${32} strokeWidth=${1.5} /></div>
            <h3>Keranjang masih kosong</h3>
            <p>Jelajahi Pustaka dan ambil soal-soal terbaik untuk dirakit menjadi paket ujian.</p>
            <button class="btn-primary" onClick=${() => navigate('/pustaka')} style="margin-top: 8px;">
              <${Sparkles} size=${16} /> Ke Pustaka Soal
            </button>
          </div>
        ` : html`
          <div class="pustaka-grid">
            ${items.map((item) => html`
              <div class="pustaka-card">
                <div class="pustaka-card-header">
                  <span class="badge-pg">${item.mapel}</span>
                  <span class="badge-muted">${item.kelas || '-'}</span>
                  <span class=${'soal-badge badge-' + item.tipe}>${item.tipe.toUpperCase()}</span>
                </div>

                <div class="pustaka-meta-row">
                  <span class="author-pill" title=${item.contributor_nama || 'Anonim'}>
                    <span class="author-avatar">${initials(item.contributor_nama)}</span>
                    <span style="overflow: hidden; text-overflow: ellipsis;">${item.contributor_nama || 'Anonim'}</span>
                  </span>
                  ${(item.download_count != null) && html`
                    <span class="download-count" title="${item.download_count} kali diambil">
                      <${Download} size=${11} /> ${item.download_count}
                    </span>
                  `}
                </div>

                <div class="pustaka-card-body">
                  <div class="pustaka-q">${truncate(item.konten.q, 120)}</div>
                </div>

                <div class="pustaka-card-actions">
                  <button class="btn-secondary btn-sm" onClick=${() => setPreviewItem(item)}>
                    <${Eye} size=${14} /> Preview
                  </button>
                  <button class="btn-danger btn-sm" onClick=${() => handleRemove(item.id)} style="flex: 1; border-color: transparent;">
                    <${Trash2} size=${14} /> Hapus
                  </button>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>

      <!-- STICKY BAR -->
      ${items.length > 0 && html`
        <div class="cart-sticky-bar no-print">
          <div class="page-shell page-shell-wide" style="padding: 0 var(--space-4) var(--space-4);">
            <div class="cart-sticky-inner">
              <div class="cart-sticky-stats">
                <div class="cart-sticky-stat">
                  <span>Total Soal</span>
                  <b>${items.length}</b>
                </div>
                <div class="cart-sticky-stat">
                  <span>Mapel</span>
                  <b>${mapelUnique}</b>
                </div>
                <div class="cart-sticky-stat">
                  <span>Estimasi</span>
                  <b>${estimasiMenit} mnt</b>
                </div>
              </div>
              <button class="btn-primary btn-large" onClick=${handleRakit}>
                <${Sparkles} size=${18} /> Rakit Jadi Paket
              </button>
            </div>
          </div>
        </div>
      `}

      <!-- MODAL PREVIEW -->
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
                    if (previewItem.tipe === 'pg') {
                      return html`
                        <div class=${'soal-option' + (isCorrect ? ' correct' : '')}>
                          <span class="soal-option-letter">${'ABCD'[oi]}</span>
                          <span class="soal-option-text">${opt}</span>
                          ${isCorrect && html`<${Check} size=${14} class="soal-option-check" />`}
                        </div>
                      `;
                    } else {
                      return html`
                        <div class=${'soal-option' + (isCorrect ? ' correct' : '')}>
                          <span class=${'option-indicator checkbox' + (isCorrect ? ' active' : '')}>
                            ${isCorrect && html`<${Check} size=${14} strokeWidth=${3} />`}
                          </span>
                          <span class="soal-option-text">${opt}</span>
                        </div>
                      `;
                    }
                  })}
                </div>
              `}

              ${previewItem.tipe === 'bs' && previewItem.konten.pernyataan && html`
                <div class="bs-table-wrapper" style="margin-top: 12px;">
                  <table class="bs-table">
                    <thead>
                      <tr>
                        <th width="40">#</th>
                        <th>Pernyataan</th>
                        <th width="60" style="text-align: center;">Benar</th>
                        <th width="60" style="text-align: center;">Salah</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${previewItem.konten.pernyataan.map((p, pi) => html`
                        <tr>
                          <td class="bs-letter">${'ABCDEFG'[pi]}.</td>
                          <td class="bs-text">${p.teks}</td>
                          <td class="bs-radio"><span class=${'radio-circle ' + (p.key === true ? 'active' : '')}></span></td>
                          <td class="bs-radio"><span class=${'radio-circle ' + (p.key === false ? 'active' : '')}></span></td>
                        </tr>
                      `)}
                    </tbody>
                  </table>
                </div>
              `}

              ${previewItem.konten.pembahasan && html`
                <div class="soal-explanation" style="margin-top: 12px;">
                  <${MessageCircle} size=${13} />
                  <span>${previewItem.konten.pembahasan}</span>
                </div>
              `}

              <div class="pustaka-preview-footer">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="author-avatar" style="width: 24px; height: 24px; font-size: 11px;">${initials(previewItem.contributor_nama)}</span>
                  <div>
                    <b>${previewItem.contributor_nama || 'Anonim'}</b>
                    <div style="font-size: 11px; opacity: 0.7;">${previewItem.contributor_sekolah || 'Indonesia'}</div>
                  </div>
                </div>
                ${(previewItem.download_count != null) && html`
                  <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #c2410c;">
                    <${Download} size=${13} /> ${previewItem.download_count} kali diambil
                  </div>
                `}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onClick=${() => setPreviewItem(null)}>Tutup</button>
            </div>
          </div>
        </div>
      `}

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
