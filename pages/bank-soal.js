import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { ArrowLeft, FolderOpen, Trash2, Share2, Eye, Loader2 } from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getMyBank, deleteFromBank, togglePublic } from '../lib/bank-soal.js';
import { ConfirmModal } from '../components/ConfirmModal.js';

const html = htm.bind(h);

export function BankSoalPage({ navigate, profile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmData, setConfirmData] = useState(null); // State untuk modal

  useEffect(() => {
    if (!profile) { navigate('/login'); return; }
    loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getMyBank(profile.id);
      setItems(data);
    } catch (e) { alert('Gagal memuat: ' + e.message); }
    setLoading(false);
  };

  const handleDelete = (id) => {
    setConfirmData({
      title: 'Hapus Paket Soal?',
      message: 'Paket ini akan dihapus permanen dari Bank Soal Anda dan tidak bisa dikembalikan.',
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: async () => {
        setConfirmData(null);
        try {
          await deleteFromBank(id);
          loadData();
        } catch (e) { alert(e.message); }
      }
    });
  };

  const handleShare = async (item) => {
    const isPublic = !item.is_public;
    if (isPublic) {
      setConfirmData({
        title: 'Bagikan ke Pustaka?',
        message: 'Paket ini akan diterbitkan ke Pustaka Publik dan bisa diambil oleh guru lain.',
        confirmText: 'Ya, Bagikan',
        isDanger: false,
        onConfirm: async () => {
          setConfirmData(null);
          try {
            await togglePublic(item.id, isPublic);
            loadData();
          } catch (e) { alert(e.message); }
        }
      });
    } else {
      // Jika mau ditarik dari publik, langsung eksekusi
      try {
        await togglePublic(item.id, isPublic);
        loadData();
      } catch (e) { alert(e.message); }
    }
  };

  const handleOpen = (item) => {
    // BUG FIX: Pastikan data memiliki version dan field v1.1
    const payload = item.payload || {};
    const safePayload = {
      ...payload,
      version: '1.1', // Paksa versi terbaru
      acakMode: payload.acakMode || 'per-tipe',
      latihanMandiri: payload.latihanMandiri !== false,
    };

    localStorage.setItem('tka-studio-draft-v1', JSON.stringify({ paket: safePayload, warnings: [] }));
    navigate('/preview');
  };

  return html`
    <div class="page">
      <div class="page-shell">
        <div class="page-header">
          <button class="btn-back" onClick=${() => navigate('/')}><${ArrowLeft} size=${16} /> Beranda</button>
          <h1 class="page-title">Bank Soal Saya</h1>
          <p class="page-subtitle">Koleksi paket soal yang tersimpan di akun Anda.</p>
        </div>

        ${loading ? html`<div class="text-center mt-4"><${Loader2} class="spin" /></div>` : html`
          <div class="soal-list">
            ${items.length === 0 && html`<div class="empty-state"><${FolderOpen} size=${32}/><p>Belum ada soal tersimpan.</p></div>`}
            ${items.map(item => html`
              <div class="soal-card">
                <div class="soal-header">
                  <div class="soal-header-left">
                    <span class="badge-pg">${item.mapel}</span>
                    <b>${item.judul}</b>
                  </div>
                  <div class="soal-actions">
                    <button class="icon-btn" onClick=${() => handleOpen(item)} title="Buka"><${Eye} size=${16}/></button>
                    <button class="icon-btn ${item.is_public ? 'text-success' : ''}" onClick=${() => handleShare(item)} title="Bagikan ke Publik">
                      <${Share2} size=${16} />
                    </button>
                    <button class="icon-btn icon-danger" onClick=${() => handleDelete(item.id)} title="Hapus"><${Trash2} size=${16}/></button>
                  </div>
                </div>
                <div class="soal-body" style="padding: 12px 16px; font-size: 13px; color: var(--text-muted);">
                  ${item.payload.soal.length} soal · ${new Date(item.created_at).toLocaleDateString('id-ID')}
                  ${item.is_public ? html` · <span style="color:var(--success)">Publik</span>` : ''}
                </div>
              </div>
            `)}
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
