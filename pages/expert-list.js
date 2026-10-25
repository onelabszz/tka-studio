/**
 * TKA Studio — pages/expert-list.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, Plus, FolderOpen, Trash2, Loader2,
  CheckCircle2, Layers, Sparkles, Target
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
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
                const isDone = totalSoal >= ws.target_soal || ws.status === 'completed';

                return html`
                  <div class=${'expert-card' + (isDone ? ' is-done' : '')}>
                    
                    <div class="expert-card-header">
                      <div class="expert-card-badges">
                        <span class="badge-pg">${ws.mapel}</span>
                        <span class="badge-muted">${ws.kelas}</span>
                        ${isDone && html`
                          <span class="badge-done">
                            <${CheckCircle2} size=${11} strokeWidth=${2.5} /> Selesai
                          </span>
                        `}
                      </div>
                    </div>
                    
                    <div class="expert-card-body">
                      <h3 class="expert-card-title">${ws.judul}</h3>
                      <p class="expert-card-meta">
                        ${ws.topik || 'Tanpa topik spesifik'}
                      </p>
                      
                      <div class="expert-card-progress-header">
                        <span>${totalSoal} / ${ws.target_soal} soal</span>
                        <span class="expert-progress-pct">${progress}%</span>
                      </div>
                      <div class="expert-progress-bg">
                        <div class="expert-progress-bar" style="width: ${progress}%;"></div>
                      </div>
                    </div>

                    <div class="expert-card-footer">
                      <span class="expert-stat">
                        <${Sparkles} size=${11} />
                        ${(ws.tipe_fokus || 'campur').toUpperCase()}
                      </span>
                      <span class="expert-stat">
                        <${Layers} size=${11} />
                        Batch ${ws.soal_per_batch || 5}
                      </span>
                      ${ws.level_kognitif && ws.level_kognitif !== 'auto' && html`
                        <span class="expert-stat">
                          <${Target} size=${11} />
                          ${ws.level_kognitif.toUpperCase()}
                        </span>
                      `}
                    </div>

                    <div class="expert-card-actions">
                      <button class="btn-primary btn-sm" onClick=${() => navigate('/expert/' + ws.id)}>
                        ${isDone ? 'Lihat Hasil' : 'Lanjutkan'}
                      </button>
                      <button class="btn-danger btn-sm" onClick=${() => handleDelete(ws.id, ws.judul)} title="Hapus Proyek">
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
