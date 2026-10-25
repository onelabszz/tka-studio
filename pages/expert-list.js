/**
 * TKA Studio — pages/expert-list.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { ArrowLeft, Plus, FolderOpen, Trash2, Loader2 } from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getWorkspaces, deleteWorkspace } from '../lib/expert-workspace.js';
import { ConfirmModal } from '../components/ConfirmModal.js';

const html = htm.bind(h);

export function ExpertListPage({ navigate, profile }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    if (!profile) { navigate('/login'); return; }
    loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getWorkspaces(profile.id);
      setWorkspaces(data);
    } catch (e) {
      console.error(e);
      if (window.showToast) window.showToast('Gagal memuat ruang kerja: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const handleDelete = (id, judul) => {
    setConfirmData({
      title: 'Hapus Ruang Kerja?',
      message: `Proyek "${judul}" beserta semua soal di dalamnya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: async () => {
        setConfirmData(null);
        try {
          await deleteWorkspace(id);
          await loadData();
          if (window.showToast) window.showToast('Ruang kerja berhasil dihapus.', 'success');
        } catch (e) {
          if (window.showToast) window.showToast('Gagal menghapus: ' + e.message, 'error');
        }
      }
    });
  };

  return html`
    <div class="page">
      <div class="page-shell">
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <button class="btn-back" onClick=${() => navigate('/')}><${ArrowLeft} size=${16} /> Beranda</button>
            <h1 class="page-title">Ruang Kerja Expert</h1>
            <p class="page-subtitle">Susun soal berkualitas tinggi secara bertahap.</p>
          </div>
          <button class="btn-primary" onClick=${() => navigate('/expert/new')}>
            <${Plus} size=${18} /> Proyek Baru
          </button>
        </div>

        ${loading ? html`
          <div class="text-center mt-4"><${Loader2} class="spin" size=${32} color="var(--primary)" /></div>
        ` : html`
          ${workspaces.length === 0 ? html`
            <div class="empty-state">
              <${FolderOpen} size=${48} strokeWidth=${1.5} color="var(--text-subtle)" style="margin-bottom: 16px;" />
              <h3 style="margin: 0 0 8px; font-size: 18px; color: var(--text);">Belum ada ruang kerja</h3>
              <p>Buat proyek pertama Anda untuk mulai menyusun soal secara bertahap.</p>
              <button class="btn-primary mt-3" onClick=${() => navigate('/expert/new')}>
                <${Plus} size=${16} /> Mulai Proyek Baru
              </button>
            </div>
          ` : html`
            <div class="pustaka-grid">
              ${workspaces.map(ws => {
                const totalSoal = ws.soal ? ws.soal.length : 0;
                const progress = Math.min(100, Math.round((totalSoal / ws.target_soal) * 100));
                const isDone = totalSoal >= ws.target_soal;

                return html`
                  <div class=${'expert-card' + (isDone ? ' is-done' : '')}>
                    <div class="expert-card-header">
                      <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-bottom: 8px;">
                        <span class="badge-pg">${ws.mapel}</span>
                        <span class="badge-muted">${ws.kelas}</span>
                        <span class="badge-muted" style="background: var(--primary-light); color: var(--primary);">
                          ${(ws.tipe_fokus || 'campur').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div style="flex: 1;">
                      <h3 class="expert-card-title">${ws.judul}</h3>
                      <div class="expert-card-meta">
                        Topik: ${ws.topik || '-'}
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-top: 16px; margin-bottom: 6px;">
                        <span style="color: var(--text-muted);">Progress</span>
                        <span style="color: var(--text);">${totalSoal} / ${ws.target_soal} soal</span>
                      </div>
                      <div class="expert-progress-bg">
                        <div class="expert-progress-bar" style="width: ${progress}%; background: ${isDone ? 'var(--success)' : 'var(--primary-mid)'};"></div>
                      </div>
                    </div>

                    <div class="pustaka-card-actions" style="margin-top: 16px;">
                      <button class="btn-primary btn-sm" onClick=${() => navigate('/expert/' + ws.id)} style="flex: 1;">
                        ${isDone ? 'Lihat Hasil' : 'Lanjutkan'}
                      </button>
                      <button class="btn-danger btn-sm" onClick=${() => handleDelete(ws.id, ws.judul)} title="Hapus Proyek" style="padding: 6px 12px;">
                        <${Trash2} size=${14} />
                      </button>
                    </div>
                  </div>
                `;
              })}
            </div>
          `}
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
