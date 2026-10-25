/**
 * TKA Studio — pages/expert-new.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, Save, Loader2, Image as ImageIcon, Settings2,
  ChevronDown, ChevronUp, Sparkles, FolderOpen, Target, Layers,
  BookOpen, CircleDot, ListChecks, CheckCheck, Wand2
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { createWorkspace } from '../lib/expert-workspace.js';
import { PageHero } from '../components/PageHero.js';

const html = htm.bind(h);

const MAPEL_OPTIONS = ['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 'PPKn', 'Seni Budaya', 'PJOK', 'Informatika', 'Prakarya'];
const KELAS_OPTIONS = ['1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD', '7 SMP', '8 SMP', '9 SMP', '10 SMA', '11 SMA', '12 SMA'];

const TIPE_FOKUS_OPTIONS = [
  { v: 'campur', l: 'Campur',   desc: 'PG + MCMA + B/S',      icon: Layers },
  { v: 'pg',     l: 'PG',       desc: 'Pilihan ganda',        icon: CircleDot },
  { v: 'mcma',   l: 'MCMA',     desc: 'Pilihan kompleks',     icon: ListChecks },
  { v: 'bs',     l: 'B/S',      desc: 'Benar / Salah',        icon: CheckCheck },
];

const LEVEL_KOGNITIF_OPTIONS = [
  { v: 'auto', l: 'Auto', code: 'C1–C6',  desc: 'Seimbang' },
  { v: 'c1c2', l: 'Hafalan', code: 'C1–C2', desc: 'Mengingat & memahami' },
  { v: 'c3',   l: 'Penerapan', code: 'C3',   desc: 'Menerapkan konsep' },
  { v: 'c4c6', l: 'Analisis', code: 'C4–C6', desc: 'Analisis & evaluasi' },
];

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

  const canSubmit = judul.trim() && target >= 5 && batch >= 1 && batch <= target;
  const batchCount = target > 0 && batch > 0 ? Math.ceil(target / batch) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile) { navigate('/login'); return; }
    if (!canSubmit) return;
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

  const chips = judul.trim()
    ? [
        { icon: BookOpen, text: mapel },
        { icon: Target, text: kelas },
        { icon: Layers, text: `${target} soal` }
      ]
    : null;

  return html`
    <div class="page">
      <div class="page-shell">
        <${PageHero}
          icon=${Sparkles}
          title="Buat Proyek Expert"
          subtitle="Susun soal berkualitas tinggi secara bertahap. AI bekerja per batch."
          chips=${chips}
          topnav=${html`
            <button class="btn-back" onClick=${() => navigate('/expert')}>
              <${ArrowLeft} size=${16} /> Ruang Kerja
            </button>
          `}
        />

        <form onSubmit=${handleSubmit}>
          <!-- Nama Proyek -->
          <div class="form-section">
            <div class="form-section-header">
              <${FolderOpen} size=${18} strokeWidth=${2} />
              <h2>Identitas Proyek</h2>
            </div>
            <div class="form-section-body">
              <div class="form-field">
                <label class="form-label">Nama Proyek</label>
                <input class="form-input" required value=${judul} onInput=${(e) => setJudul(e.target.value)} placeholder="Contoh: TKA Matematika Kelas 6" />
                <div class="form-hint">Nama ini muncul di daftar Ruang Kerja.</div>
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
            </div>
          </div>

          <!-- Tipe Fokus -->
          <div class="form-section">
            <div class="form-section-header">
              <${Wand2} size=${18} strokeWidth=${2} />
              <h2>Tipe Soal Fokus</h2>
            </div>
            <div class="form-section-body">
              <div class="option-cards-grid">
                ${TIPE_FOKUS_OPTIONS.map(({ v, l, desc, icon: Icon }) => html`
                  <button
                    type="button"
                    class=${'option-card' + (tipeFokus === v ? ' active' : '')}
                    onClick=${() => setTipeFokus(v)}
                  >
                    <div class="option-card-head">
                      <span class="option-card-title"><${Icon} size=${14} style="vertical-align:-2px; margin-right:2px;" /> ${l}</span>
                    </div>
                    <div class="option-card-desc">${desc}</div>
                  </button>
                `)}
              </div>
            </div>
          </div>

          <!-- Target & Batch -->
          <div class="form-section">
            <div class="form-section-header">
              <${Target} size=${18} strokeWidth=${2} />
              <h2>Target & Batch</h2>
              <span class="section-badge">${target} soal</span>
            </div>
            <div class="form-section-body">
              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">Target Total Soal</label>
                  <input class="form-input" type="number" min="5" max="100" value=${target} onInput=${(e) => setTarget(Number(e.target.value) || 0)} />
                  <div class="form-hint">Total soal yang ingin disusun (5–100).</div>
                </div>
                <div class="form-field">
                  <label class="form-label">Soal per Batch</label>
                  <input class="form-input" type="number" min="1" max="20" value=${batch} onInput=${(e) => setBatch(Number(e.target.value) || 0)} />
                  <div class="form-hint">Banyak soal per satu prompt AI (1–20).</div>
                </div>
              </div>
              ${target > 0 && batch > 0 && html`
                <div class="result-card result-success" style="margin: 0; padding: 12px 14px;">
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #065f46; font-weight: 600;">
                    <${Layers} size=${14} />
                    Akan ada <b>${batchCount} batch</b> · ${target} soal ÷ ${batch} soal/batch
                  </div>
                </div>
              `}
            </div>
          </div>

          <!-- Advanced Toggle -->
          <div class="advanced-toggle">
            <button type="button" class="accordion-toggle" onClick=${() => setShowAdvanced(!showAdvanced)}>
              ${showAdvanced ? html`<${ChevronUp} size=${16} />` : html`<${ChevronDown} size=${16} />`} <${Settings2} size=${14} /> Pengaturan Lanjutan
            </button>
          </div>

          ${showAdvanced && html`
            <div class="form-section">
              <div class="form-section-header">
                <${Settings2} size=${18} strokeWidth=${2} />
                <h2>Pengaturan Lanjutan</h2>
              </div>
              <div class="form-section-body">
                <div class="form-field">
                  <label class="form-label">Kompetensi (Pusmendik)</label>
                  <input class="form-input" value=${kompetensi} onInput=${(e) => setKompetensi(e.target.value)} placeholder="Contoh: Memahami, mengaplikasikan..." />
                  <div class="form-hint">Sesuaikan dengan Matriks Asesmen Kemendikbud.</div>
                </div>

                <div class="form-field">
                  <label class="form-label">Level Kognitif</label>
                  <div class="option-cards-grid">
                    ${LEVEL_KOGNITIF_OPTIONS.map(({ v, l, code, desc }) => html`
                      <button
                        type="button"
                        class=${'option-card' + (levelKognitif === v ? ' active' : '')}
                        onClick=${() => setLevelKognitif(v)}
                      >
                        <div class="option-card-head">
                          <span class="option-card-title">${l}</span>
                          <span class="option-card-code">${code}</span>
                        </div>
                        <div class="option-card-desc">${desc}</div>
                      </button>
                    `)}
                  </div>
                </div>

                <div class="form-field">
                  <label class="checkbox-label">
                    <input type="checkbox" checked=${sertakanGambar} onChange=${(e) => setSertakanGambar(e.target.checked)} />
                    <${ImageIcon} size=${16} class="mr-1" /> Sertakan soal bergambar
                  </label>
                  <div class="form-hint ml-6">AI akan menandai soal yang butuh gambar. Guru siapkan gambar manual.</div>
                </div>
              </div>
            </div>
          `}

          <div class="form-actions">
            <button class="btn-primary btn-large" type="submit" disabled=${loading || !canSubmit}>
              ${loading ? html`<${Loader2} class="spin" />` : html`<${Save} size=${18} /> Buat Proyek`}
            </button>
            ${!judul.trim() && html`<div class="form-warning">Isi nama proyek dulu untuk melanjutkan</div>`}
            ${judul.trim() && !canSubmit && html`<div class="form-warning">Periksa target & batch — pastikan batch ≤ target dan ≥ 1</div>`}
            ${canSubmit && html`
              <div class="cta-hint"><${Sparkles} size=${12} /> Proyek akan muncul di Ruang Kerja, siap disusun per batch.</div>
            `}
          </div>
        </form>
      </div>
    </div>
  `;
}
