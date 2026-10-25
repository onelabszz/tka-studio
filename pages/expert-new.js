/**
 * TKA Studio — pages/expert-new.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Settings2, ChevronDown, ChevronUp } from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { createWorkspace } from '../lib/expert-workspace.js';

const html = htm.bind(h);

const MAPEL_OPTIONS = ['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 'PPKn', 'Seni Budaya', 'PJOK', 'Informatika', 'Prakarya'];
const KELAS_OPTIONS = ['1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD', '7 SMP', '8 SMP', '9 SMP', '10 SMA', '11 SMA', '12 SMA'];

export function ExpertNewPage({ navigate, profile }) {
  const [judul, setJudul] = useState('');
  const [mapel, setMapel] = useState('Matematika');
  const [kelas, setKelas] = useState('6 SD');
  const [submateri, setSubmateri] = useState('');
  const [kompetensi, setKompetensi] = useState('');
  const [target, setTarget] = useState(30);
  const [batch, setBatch] = useState(5);
  const [tipeFokus, setTipeFokus] = useState('campur');
  const [levelKognitif, setLevelKognitif] = useState('auto');
  const [sertakanGambar, setSertakanGambar] = useState(false);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await createWorkspace(profile.id, {
        judul, mapel, kelas, 
        topik: submateri, 
        kompetensi,
        target_soal: target, 
        soal_per_batch: batch,
        tipe_fokus: tipeFokus,
        level_kognitif: levelKognitif,
        sertakan_gambar: sertakanGambar
      });
      navigate('/expert/' + res.id);
    } catch (err) {
      if (window.showToast) window.showToast('Gagal membuat proyek: ' + err.message, 'error');
      setLoading(false);
    }
  };

  return html`
    <div class="page">
      <div class="page-shell">
        <div class="page-header">
          <button class="btn-back" onClick=${() => navigate('/expert')}><${ArrowLeft} size=${16} /> Ruang Kerja</button>
          <h1 class="page-title">Buat Proyek Expert</h1>
          <p class="page-subtitle">Susun soal berkualitas tinggi secara bertahap.</p>
        </div>

        <form class="form-section" onSubmit=${handleSubmit}>
          
          <div class="form-field">
            <label class="form-label">Nama Proyek</label>
            <input class="form-input" required value=${judul} onInput=${(e) => setJudul(e.target.value)} placeholder="Contoh: TKA Matematika Kelas 6" />
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Mata Pelajaran</label>
              <select class="form-select" value=${mapel} onChange=${(e) => setMapel(e.target.value)}>
                ${MAPEL_OPTIONS.map(m => html`<option value=${m}>${m}</option>`)}
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Kelas</label>
              <select class="form-select" value=${kelas} onChange=${(e) => setKelas(e.target.value)}>
                ${KELAS_OPTIONS.map(k => html`<option value=${k}>${k}</option>`)}
              </select>
            </div>
          </div>

          <div class="form-field">
            <label class="form-label">Topik / Submateri <span style="color:var(--text-muted); font-weight:400;">(Opsional)</span></label>
            <input class="form-input" value=${submateri} onInput=${(e) => setSubmateri(e.target.value)} placeholder="Contoh: Operasi Hitung Pecahan" />
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Tipe Soal Fokus</label>
              <select class="form-select" value=${tipeFokus} onChange=${(e) => setTipeFokus(e.target.value)}>
                <option value="campur">Campur (PG, MCMA, B/S)</option>
                <option value="pg">Khusus PG</option>
                <option value="mcma">Khusus MCMA</option>
                <option value="bs">Khusus B/S</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Target & Batch</label>
              <div style="display:flex; gap:8px; align-items:center;">
                <input class="form-input" type="number" min="5" max="100" value=${target} onInput=${(e) => setTarget(Number(e.target.value))} title="Target Total Soal" style="width: 80px;" />
                <span style="font-size:12px; color:var(--text-muted);">soal</span>
              </div>
            </div>
          </div>

          <div class="advanced-toggle mt-4">
            <button type="button" class="accordion-toggle" onClick=${() => setShowAdvanced(!showAdvanced)}>
              ${showAdvanced ? html`<${ChevronUp} size=${16} />` : html`<${ChevronDown} size=${16} />`} <${Settings2} size=${14} /> Pengaturan Lanjutan
            </button>
          </div>

          ${showAdvanced && html`
            <div style="background: var(--surface-muted); padding: 16px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 16px;">
              <div class="form-field mb-3">
                <label class="form-label">Kompetensi (Pusmendik)</label>
                <input class="form-input" value=${kompetensi} onInput=${(e) => setKompetensi(e.target.value)} placeholder="Contoh: Memahami, mengaplikasikan..." />
                <div class="form-hint">Sesuaikan dengan Matriks Asesmen Kemendikbud.</div>
              </div>
              <div class="form-field">
                <label class="form-label">Level Kognitif</label>
                <select class="form-select" value=${levelKognitif} onChange=${(e) => setLevelKognitif(e.target.value)}>
                  <option value="auto">Auto (Seimbang)</option>
                  <option value="c1c2">C1-C2 (Hafalan/Pemahaman)</option>
                  <option value="c3">C3 (Penerapan)</option>
                  <option value="c4c6">C4-C6 (Analisis/Evaluasi)</option>
                </select>
              </div>
              <div class="form-field mt-3">
                <label class="checkbox-label">
                  <input type="checkbox" checked=${sertakanGambar} onChange=${(e) => setSertakanGambar(e.target.checked)} />
                  <${ImageIcon} size=${16} class="mr-1" /> Sertakan soal bergambar
                </label>
              </div>
            </div>
          `}

          <div class="form-actions mt-4">
            <button class="btn-primary btn-large" type="submit" disabled=${loading || !judul.trim()}>
              ${loading ? html`<${Loader2} class="spin" />` : html`<${Save} size=${18} /> Buat Proyek`}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}
