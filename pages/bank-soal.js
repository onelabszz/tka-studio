/**
 * TKA Studio — pages/bank-soal.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, FolderOpen, Trash2, Share2, Eye, Loader2, ShoppingCart,
  Folder, FileJson, Layers, Clock, Globe, Lock, CheckCircle2
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getKotak } from '../lib/pustaka.js';
import { getMyBank, deleteFromBank, togglePublic } from '../lib/bank-soal.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { PageHero } from '../components/PageHero.js';

const html = htm.bind(h);

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '-'; }
};

export function BankSoalPage({ navigate, profile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    if (!profile) { navigate('/login'); return; }
    loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getMyBank(profile.id);
      setItems(data);
    } catch (e) {
      if (window.showToast) window.showToast('Gagal memuat: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const handleDelete = (id, judul) => {
    setConfirmData({
      title: 'Hapus Paket Soal?',
      message: `Paket "${judul}" akan dihapus permanen dari Koleksi Saya. Tindakan ini tidak bisa dibatalkan.`,
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: async () => {
        setConfirmData(null);
        try {
          await deleteFromBank(id);
          await loadData();
          if (window.showToast) window.showToast('Paket berhasil dihapus.', 'success');
        } catch (e) {
          if (window.showToast) window.showToast('Gagal menghapus: ' + e.message, 'error');
        }
      }
    });
  };

  const handleShare = (item) => {
    const makePublic = !item.is_public;
    setConfirmData({
      title: makePublic ? 'Bagikan ke Pustaka?' : 'Tarik dari Pustaka?',
      message: makePublic
        ? 'Paket ini akan diterbitkan ke Pustaka Publik dan bisa diambil guru lain di seluruh Indonesia.'
        : 'Paket ini akan ditarik dari Pustaka Publik. Guru lain tidak bisa lagi mengambilnya.',
      confirmText: makePublic ? 'Ya, Bagikan' : 'Ya, Tarik',
      isDanger: !makePublic,
      onConfirm: async () => {
        setConfirmData(null);
        try {
          await togglePublic(item.id, makePublic);
          await loadData();
          if (window.showToast) {
            window.showToast(
              makePublic ? 'Paket berhasil dibagikan ke Pustaka.' : 'Paket berhasil ditarik dari Pustaka.',
              'success'
            );
          }
        } catch (e) {
          if (window.showToast) window.showToast('Gagal mengubah status: ' + e.message, 'error');
        }
      }
    });
  };

  const handleOpen = (item) => {
    const payload = item.payload || {};
    const safePayload = {
      ...payload,
      version: '1.1',
      acakMode: payload.acakMode || 'per-tipe',
      latihanMandiri: payload.latihanMandiri !== false,
    };
    localStorage.setItem('tka-studio-draft-v1', JSON.stringify({ paket: safePayload, warnings: [] }));
    navigate('/preview');
  };

  const kotakCount = getKotak().length;
  const totalSoal = items.reduce((sum, it) => sum + (it.payload?.soal?.length || 0), 0);
  const publicCount = items.filter(i => i.is_public).length;

  const chips = items.length > 0
    ? [
        { icon: Folder, text: `${items.length} paket` },
        { icon: Layers, text: `${totalSoal} soal` },
        ...(publicCount > 0 ? [{ icon: Globe, text: `${publicCount} publik` }] : [])
      ]
    : null;

  return html`
    <div class="page">
      <div class="page-shell page-shell-wide">
        <${PageHero}
          icon=${FolderOpen}
          title="Koleksi Saya"
          subtitle="Paket soal tersimpan di akun Anda. Bisa dibuka, dibagikan, atau dihapus kapan saja."
          chips=${chips}
          topnav=${html`
            <button class="btn-back" onClick=${() => navigate('/')}><${ArrowLeft} size=${16} /> Beranda</button>
            <button class="btn-secondary btn-sm" onClick=${() => navigate('/kotak')} style="position: relative; white-space: nowrap;">
              <${ShoppingCart} size=${14} /> Keranjang
              ${kotakCount > 0 && html`<span class="cart-badge-inline" style="margin-left: 6px;">${kotakCount}</span>`}
            </button>
          `}
        />

        ${loading ? html`
          <div class="text-center mt-4"><${Loader2} class="spin" size=${32} color="var(--primary)" /></div>
        ` : items.length === 0 ? html`
          <div class="empty-state">
            <div class="empty-state-icon"><${FolderOpen} size=${32} strokeWidth=${1.5} /></div>
            <h3>Belum ada paket tersimpan</h3>
            <p>Simpan paket soal dari halaman Ekspor, atau rakit dari Keranjang Soal.</p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 8px;">
              <button class="btn-primary" onClick=${() => navigate('/build')}>Buat Paket Baru</button>
              <button class="btn-secondary" onClick=${() => navigate('/pustaka')}>Jelajahi Pustaka</button>
            </div>
          </div>
        ` : html`
          <div class="pustaka-grid">
            ${items.map(item => {
              const soalCount = item.payload?.soal?.length || 0;
              const durasi = item.payload?.durasiMenit || 0;

              return html`
                <div class=${'expert-card' + (item.is_public ? ' is-done' : '')}>
                  <div class="expert-card-header">
                    <div class="expert-card-badges">
                      <span class="badge-pg">${item.mapel || '-'}</span>
                      ${item.is_public && html`
                        <span class="badge-done">
                          <${Globe} size=${11} strokeWidth=${2.5} /> Publik
                        </span>
                      `}
                    </div>
                  </div>

                  <div class="expert-card-body">
                    <h3 class="expert-card-title">${item.judul || 'Tanpa Judul'}</h3>
                    <p class="expert-card-meta">${soalCount} soal · ${durasi} menit · ${fmtDate(item.created_at)}</p>
                  </div>

                  <div class="paket-card-meta">
                    <span class="paket-stat">
                      <${FileJson} size=${11} /> ${soalCount} soal
                    </span>
                    <span class="paket-stat">
                      <${Clock} size=${11} /> ${durasi} menit
                    </span>
                    <span class=${'paket-stat' + (item.is_public ? ' is-public' : '')}>
                      ${item.is_public ? html`<${Globe} size=${11} /> Publik` : html`<${Lock} size=${11} /> Pribadi`}
                    </span>
                  </div>

                  <div class="expert-card-actions" style="margin-top: 12px;">
                    <button class="btn-primary btn-sm" onClick=${() => handleOpen(item)}>
                      <${Eye} size=${14} /> Buka
                    </button>
                    <button class="btn-secondary btn-sm" onClick=${() => handleShare(item)} title=${item.is_public ? 'Tarik dari Publik' : 'Bagikan ke Publik'} style="padding: 6px 12px; flex-shrink: 0;">
                      <${Share2} size=${14} />
                    </button>
                    <button class="btn-danger btn-sm" onClick=${() => handleDelete(item.id, item.judul)} title="Hapus" style="padding: 6px 12px; flex-shrink: 0;">
                      <${Trash2} size=${14} />
                    </button>
                  </div>
                </div>
              `;
            })}
          </div>
        `}
      </div>

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
