/**
 * TKA Studio — pages/exam-list.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  Key, Copy, Check, Trash2, ArrowLeft, Loader2, PlayCircle, BookOpen
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getSupabase } from '../supabase/client.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { PageHero } from '../components/PageHero.js';

const html = htm.bind(h);

export function ExamListPage({ navigate, profile }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmData, setConfirmData] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const client = await getSupabase();
      const { data, error } = await client
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExams(data || []);
    } catch (e) {
      if (window.showToast) window.showToast('Gagal memuat data: ' + e.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!profile) { navigate('/login'); return; }
    loadData();
  }, [profile]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    if (window.showToast) window.showToast('Kode disalin!', 'success');
  };

  const handleDelete = (exam) => {
    setConfirmData({
      title: 'Hapus Ujian?',
      message: `Ujian dengan kode ${exam.code} akan dihapus permanen. Siswa tidak akan bisa mengaksesnya lagi.`,
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: async () => {
        setConfirmData(null);
        setLoading(true);
        try {
          const client = await getSupabase();
          const { error } = await client.functions.invoke('delete-exam', {
            body: { code: exam.code, examId: exam.id }
          });
          if (error) throw error;
          
          if (window.showToast) window.showToast('Ujian berhasil dihapus.', 'success');
          loadData();
        } catch (e) {
          if (window.showToast) window.showToast('Gagal menghapus: ' + e.message, 'error');
          setLoading(false);
        }
      }
    });
  };

  const shareUrl = window.location.origin + window.location.pathname + '#/play';

  return html`
    <div class="page">
      <div class="page-shell">
        <${PageHero}
          icon=${Key}
          title="Kode Latihan Saya"
          subtitle="Daftar ujian online yang bisa diakses siswa dengan kode."
          topnav=${html`
            <button class="btn-back" onClick=${() => navigate('/')}>
              <${ArrowLeft} size=${16} /> Beranda
            </button>
          `}
        />

        ${loading ? html`
          <div class="text-center mt-4"><${Loader2} class="spin" size=${32} color="var(--primary)" /></div>
        ` : exams.length === 0 ? html`
          <div class="empty-state">
            <div class="empty-state-icon"><${Key} size=${32} /></div>
            <h3>Belum ada ujian terbit</h3>
            <p>Buka menu Ekspor setelah membuat soal, lalu klik "Terbitkan & Dapatkan Kode".</p>
          </div>
        ` : html`
          <div class="pustaka-grid">
            ${exams.map(exam => html`
              <div class="expert-card is-done">
                <div class="expert-card-header">
                  <div class="expert-card-badges">
                    <span class="badge-done"><${Key} size=${11} /> Kode: ${exam.code}</span>
                  </div>
                </div>
                
                <div class="expert-card-body">
                  <h3 class="expert-card-title">${exam.judul}</h3>
                  <p class="expert-card-meta">
                    Dibuat: ${new Date(exam.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div class="expert-card-actions" style="margin-top: 12px;">
                  <button class="btn-primary btn-sm" onClick=${() => handleCopy(exam.code)}>
                    ${copiedCode === exam.code ? html`<${Check} size=${14} /> Tersalin` : html`<${Copy} size=${14} /> Salin Kode`}
                  </button>
                  <button class="btn-secondary btn-sm" onClick=${() => window.open(shareUrl, '_blank')} title="Buka halaman Player">
                    <${PlayCircle} size=${14} />
                  </button>
                  <button class="btn-danger btn-sm" onClick=${() => handleDelete(exam)} title="Hapus Ujian">
                    <${Trash2} size=${14} />
                  </button>
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
