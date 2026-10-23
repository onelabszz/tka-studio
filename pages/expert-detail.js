/**
 * TKA Studio — pages/expert-detail.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { 
  ArrowLeft, ArrowRight, Wand2, ClipboardPaste, CheckCircle2, 
  Loader2, Check, AlertTriangle, BookOpen, AlertCircle
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getWorkspaceById, updateWorkspaceSoal, updateTeksWacana } from '../lib/expert-workspace.js';
import { buildExpertPrompt } from '../lib/expert-prompt.js';
import { smartParse } from '../lib/parser/index.js';
import { normalizePaket } from '../lib/tka-schema.js';

const html = htm.bind(h);

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export function ExpertDetailPage({ navigate, profile, id }) {
  const [ws, setWs] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk UI
  const [promptText, setPromptText] = useState('');
  const [copied, setCopied] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [reviewItems, setReviewItems] = useState(null); // Menyimpan hasil parse sementara
  const [saving, setSaving] = useState(false);

  // State untuk Teks Wacana (B.Indo)
  const [wacanaText, setWacanaText] = useState('');
  const [editWacana, setEditWacana] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, [id]);

  const loadWorkspace = async () => {
    try {
      const data = await getWorkspaceById(id);
      if (data.user_id !== profile?.id) {
        alert('Anda tidak memiliki akses ke ruang kerja ini.');
        navigate('/expert');
        return;
      }
      setWs(data);
      setWacanaText(data.teks_wacana || '');
      generatePrompt(data);
    } catch (e) {
      alert('Gagal memuat proyek: ' + e.message);
      navigate('/expert');
    }
    setLoading(false);
  };

  const generatePrompt = (currentWs) => {
    const sisaTarget = currentWs.target_soal - (currentWs.soal?.length || 0);
    const batchSize = Math.min(currentWs.soal_per_batch, sisaTarget);
    
    if (batchSize <= 0) {
      setPromptText('');
      return;
    }

    const prompt = buildExpertPrompt(currentWs, batchSize);
    setPromptText(prompt);
  };

  const handleCopyPrompt = async () => {
    const ok = await copyText(promptText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimpanWacana = async () => {
    setSaving(true);
    try {
      await updateTeksWacana(ws.id, wacanaText);
      const updated = { ...ws, teks_wacana: wacanaText };
      setWs(updated);
      setEditWacana(false);
      generatePrompt(updated);
      alert('Teks wacana berhasil disimpan!');
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    setParsing(true);
    setTimeout(() => {
      const parsed = smartParse(pasteText);
      if (!parsed.ok) {
        alert('Format tidak dikenali: ' + parsed.error);
        setParsing(false);
        return;
      }
      
      const { paket, errors } = normalizePaket(parsed.raw);
      if (!paket) {
        alert('Soal tidak valid: ' + (errors[0]?.message || 'Unknown error'));
        setParsing(false);
        return;
      }

      // Beri ID sementara untuk review
      const itemsToReview = paket.soal.map((s, i) => ({
        ...s,
        tempId: 'temp-' + i,
        accepted: true
      }));

      setReviewItems(itemsToReview);
      setParsing(false);
    }, 300);
  };

  const handleSimpanBatch = async () => {
    const acceptedItems = reviewItems.filter(item => item.accepted).map(({tempId, accepted, ...rest}) => rest);
    if (acceptedItems.length === 0) {
      alert('Pilih minimal 1 soal untuk disimpan.');
      return;
    }

    setSaving(true);
    try {
      const updatedWs = await updateWorkspaceSoal(ws.id, acceptedItems);
      setWs(updatedWs);
      setReviewItems(null);
      setPasteText('');
      
      // Cek apakah target sudah terpenuhi
      if (updatedWs.soal.length >= updatedWs.target_soal) {
        await updateWorkspaceSoal(ws.id, [], 'completed');
        setWs({ ...updatedWs, status: 'completed' });
      } else {
        generatePrompt(updatedWs);
      }
    } catch (e) {
      alert('Gagal menyimpan: ' + e.message);
    }
    setSaving(false);
  };

  const handleSelesai = () => {
    // Pindahkan soal ke draft standard agar bisa di-preview/export
    localStorage.setItem('tka-studio-draft-v1', JSON.stringify({ 
      paket: { 
        version: '1.0',
        id: ws.id, 
        judul: ws.judul, 
        mapel: ws.mapel, 
        durasiMenit: ws.target_soal * 2, 
        acakMode: 'per-tipe',
        latihanMandiri: true,
        soal: ws.soal 
      }, 
      warnings: [] 
    }));
    navigate('/preview');
  };

  if (loading) return html`<div class="page"><div class="text-center mt-4"><${Loader2} class="spin" /></div></div>`;
  if (!ws) return null;

  const currentSoalCount = ws.soal?.length || 0;
  const isDone = currentSoalCount >= ws.target_soal || ws.status === 'completed';
  const progress = Math.min(100, Math.round((currentSoalCount / ws.target_soal) * 100));
  const isBahasa = ws.mapel === 'Bahasa Indonesia' || ws.mapel === 'Bahasa Inggris';

  return html`
    <div class="page">
      <div class="page-shell">
        <div class="page-header" style="margin-bottom: 20px;">
          <button class="btn-back" onClick=${() => navigate('/expert')}><${ArrowLeft} size=${16} /> Ruang Kerja</button>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px;">
            <div>
              <h1 class="page-title" style="margin:0;">${ws.judul}</h1>
              <p class="page-subtitle">${ws.mapel} · ${ws.kelas} · ${ws.topik || 'Umum'}</p>
            </div>
            ${isDone && html`
              <button class="btn-primary" onClick=${handleSelesai}>
                Lanjut ke Preview <${ArrowRight} size=${16} />
              </button>
            `}
          </div>
        </div>

        <div class="result-card result-success mb-4" style="padding: 16px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 8px;">
            <span>Progress Penyusunan</span>
            <span>${currentSoalCount} / ${ws.target_soal} Soal</span>
          </div>
          <div style="height: 10px; background: rgba(255,255,255,0.5); border-radius: 5px; overflow: hidden;">
            <div style="height: 100%; width: ${progress}%; background: var(--success); transition: width 0.3s;"></div>
          </div>
        </div>

        ${isBahasa && html`
          <div class="form-section">
            <div class="form-section-header">
              <${BookOpen} size=${18} /> Teks Wacana Acuan (Wajib untuk B.Indo)
            </div>
            <div class="form-section-body">
              ${editWacana ? html`
                <textarea class="form-textarea" rows=${6} value=${wacanaText} onInput=${e => setWacanaText(e.target.value)} placeholder="Paste teks wacana di sini..."></textarea>
                <div style="display:flex; gap:8px; margin-top:8px;">
                  <button class="btn-primary btn-sm" onClick=${handleSimpanWacana} disabled=${saving}>Simpan Teks</button>
                  <button class="btn-secondary btn-sm" onClick=${() => setEditWacana(false)}>Batal</button>
                </div>
              ` : html`
                <div style="background:var(--surface-muted); padding:12px; border-radius:8px; font-size:14px; line-height:1.6; font-style:italic; margin-bottom:12px;">
                  ${wacanaText || '(Belum ada teks wacana. AI akan membuatnya di soal pertama, atau Anda bisa paste manual di sini).'}
                </div>
                <button class="btn-secondary btn-sm" onClick=${() => setEditWacana(true)}>Edit Teks Wacana</button>
              `}
            </div>
          </div>
        `}

        ${!isDone && !reviewItems && html`
          <div class="form-section">
            <div class="form-section-header">
              <${Wand2} size=${18} /> Tahap ${Math.ceil((currentSoalCount + 1) / ws.soal_per_batch)}: Buat ${Math.min(ws.soal_per_batch, ws.target_soal - currentSoalCount)} Soal Baru
            </div>
            <div class="form-section-body">
              
              <div class="form-field">
                <label class="form-label">Langkah 1: Salin Prompt AI</label>
                <button class="btn-primary w-full" onClick=${handleCopyPrompt}>
                  ${copied ? html`<${Check} size=${16}/> Tersalin!` : html`<${Wand2} size=${16}/> Salin Prompt Batch`}
                </button>
                <div class="form-hint" style="margin-top:8px;">
                  Prompt ini sudah memuat instruksi agar AI tidak menduplikasi soal yang sudah ada.
                </div>
              </div>

              <div class="form-field mt-4">
                <label class="form-label">Langkah 2: Paste Hasil AI</label>
                <textarea class="form-textarea font-monospace" rows=${6} value=${pasteText} onInput=${e => setPasteText(e.target.value)} placeholder='{"soal": [...]}'></textarea>
              </div>

              <button class="btn-primary w-full mt-2" onClick=${handleParsePaste} disabled=${parsing || !pasteText.trim()}>
                ${parsing ? html`<${Loader2} class="spin" size=${16}/>` : html`<${ClipboardPaste} size=${16}/>`} Olah Hasil AI
              </button>

            </div>
          </div>
        `}

        ${reviewItems && html`
          <div class="form-section" style="border: 2px solid var(--primary-light);">
            <div class="form-section-header" style="color: var(--primary);">
              <${CheckCircle2} size=${18} /> Review Soal Baru (${reviewItems.length})
            </div>
            <div class="form-section-body">
              <p class="text-muted text-sm mb-3">Centang soal yang ingin disimpan ke proyek.</p>
              
              <div class="soal-list">
                ${reviewItems.map((item, idx) => html`
                  <div class="soal-card" style="border-color: ${item.accepted ? 'var(--success)' : 'var(--border)'}">
                    <div class="soal-header" style="background: ${item.accepted ? '#f0fdf4' : 'var(--surface-muted)'};">
                      <div class="soal-header-left">
                        <input type="checkbox" checked=${item.accepted} 
                          onChange=${e => {
                            const newItems = [...reviewItems];
                            newItems[idx].accepted = e.target.checked;
                            setReviewItems(newItems);
                          }} 
                          style="width:18px; height:18px; accent-color: var(--success); margin-right:8px;"
                        />
                        <span class="soal-badge badge-${item.tipe}">${item.tipe.toUpperCase()}</span>
                      </div>
                    </div>
                    <div class="soal-body" style="padding: 12px;">
                      <div class="soal-question" style="font-size: 14px;">${item.q}</div>
                    </div>
                  </div>
                `)}
              </div>

              <div class="form-actions" style="flex-direction: row; gap: 12px; margin-top: 20px;">
                <button class="btn-secondary" onClick=${() => setReviewItems(null)} style="flex: 1;">Batal</button>
                <button class="btn-primary" onClick=${handleSimpanBatch} disabled=${saving || !reviewItems.some(i => i.accepted)} style="flex: 2;">
                  ${saving ? html`<${Loader2} class="spin" size=${16}/>` : html`<${Check} size=${16}/>`} 
                  Simpan ${reviewItems.filter(i => i.accepted).length} Soal ke Proyek
                </button>
              </div>
            </div>
          </div>
        `}

        ${isDone && html`
          <div class="result-card result-success text-center" style="padding: 40px 20px;">
            <${CheckCircle2} size=${48} color="var(--success)" style="margin-bottom: 16px;" />
            <h2 style="font-size: 20px; margin-bottom: 8px;">Proyek Selesai!</h2>
            <p class="text-muted text-sm mb-4">Semua ${ws.target_soal} soal sudah berhasil disusun secara bertahap.</p>
            <button class="btn-primary" onClick=${handleSelesai}>
              Lanjut ke Preview & Edit Final
            </button>
          </div>
        `}

      </div>
    </div>
  `;
}
