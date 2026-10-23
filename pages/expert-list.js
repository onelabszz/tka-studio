/**
 * TKA Studio — pages/expert-list.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { ArrowLeft, Plus, FolderOpen, Trash2, Loader2 } from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getWorkspaces, deleteWorkspace } from '../lib/expert-workspace.js';

const html = htm.bind(h);

export function ExpertListPage({ navigate, profile }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

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
      alert('Gagal memuat ruang kerja: ' + e.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id, judul) => {
    if (!confirm(`Hapus ruang kerja "${judul}"? Semua soal di dalamnya akan hilang permanen.`)) return;
    try {
      await deleteWorkspace(id);
      loadData();
    } catch (e) {
      alert('Gagal menghapus: ' + e.message);
    }
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
          <div class="text-center mt-4"><${Loader2} class="spin" /></div>
        ` : html`
          ${workspaces.length === 0 ? html`
            <div class="empty-state">
              <${FolderOpen} size=${32} strokeWidth=${1.5} />
              <p>Belum ada ruang kerja. Buat proyek pertama Anda!</p>
              <button class="btn-primary mt-3" onClick=${() => navigate('/expert/new')}>Mulai Proyek</button>
            </div>
          ` : html`
            <div class="pustaka-grid">
              ${workspaces.map(ws => {
                const totalSoal = ws.soal ? ws.soal.length : 0;
                const progress = Math.min(100, Math.round((totalSoal / ws.target_soal) * 100));
                const isDone = totalSoal >= ws.target_soal;

                return html`
                  <div class="pustaka-card" style="border-left: 4px solid ${isDone ? 'var(--success)' : 'var(--primary-mid)'};">
                    <div class="pustaka-card-header">
                      <span class="badge-pg">${ws.mapel}</span>
                      <span class="badge-muted">${ws.kelas}</span>
                      <span class="badge-muted" style="background: var(--primary-light); color: var(--primary);">
                        ${(ws.tipe_fokus || 'campur').toUpperCase()}
                      </span>
                    </div>
                    
                    <div class="pustaka-card-body">
                      <h3 style="font-size: 16px; margin: 0 0 8px; color: var(--navy-900);">${ws.judul}</h3>
                      <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
                        Topik: ${ws.topik || '-'}
                      </div>
                      
                      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 4px;">
                        <span>Progress</span>
                        <span>${totalSoal} / ${ws.target_soal} soal</span>
                      </div>
                      <div style="height: 8px; background: var(--surface-muted); border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${progress}%; background: ${isDone ? 'var(--success)' : 'var(--primary-mid)'}; transition: width 0.3s;"></div>
                      </div>
                    </div>

                    <div class="pustaka-card-actions">
                      <button class="btn-primary btn-sm" onClick=${() => navigate('/expert/' + ws.id)} style="flex: 1;">
                        ${isDone ? 'Lihat Hasil' : 'Lanjutkan'}
                      </button>
                      <button class="btn-secondary btn-sm" onClick=${() => handleDelete(ws.id, ws.judul)} title="Hapus">
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
    </div>
  `;
}
