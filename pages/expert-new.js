/**
 * TKA Studio — pages/expert-new.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { ArrowLeft, Save, Loader2 } from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { createWorkspace } from '../lib/expert-workspace.js';

const html = htm.bind(h);

const MAPEL_OPTIONS = ['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 'PPKn', 'Seni Budaya', 'PJOK', 'Informatika', 'Prakarya'];
const KELAS_OPTIONS = ['1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD', '7 SMP', '8 SMP', '9 SMP', '10 SMA', '11 SMA', '12 SMA'];

export function ExpertNewPage({ navigate, profile }) {
  const [judul, setJudul] = useState('');
  const [mapel, setMapel] = useState('Matematika');
  const [kelas, setKelas] = useState('6 SD');
  const [topik, setTopik] = useState('');
  const [target, setTarget] = useState(30);
  const [batch, setBatch] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await createWorkspace(profile.id, {
        judul, mapel, kelas, topik, target_soal: target, soal_per_batch: batch
      });
      navigate('/expert/' + res.id);
    } catch (err) {
      alert('Gagal membuat proyek: ' + err.message);
      setLoading(false);
    }
  };

  return html`
    <div class="page">
      <div class="page-shell">
        <div class="page-header">
          <button class="btn-back" onClick=${() => navigate('/expert')}><${ArrowLeft} size=${16} /> Ruang Kerja</button>
          <h1 class="page-title">Proyek Baru</h1>
          <p class="page-subtitle">Buat ruang kerja untuk menyusun soal secara bertahap.</p>
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
            <label class="form-label">Topik Spesifik</label>
            <input class="form-input" value=${topik} onInput=${(e) => setTopik(e.target.value)} placeholder="Contoh: Operasi Hitung Pecahan" />
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Target Total Soal</label>
              <input class="form-input" type="number" min="5" max="100" value=${target} onInput=${(e) => setTarget(Number(e.target.value))} />
            </div>
            <div class="form-field">
              <label class="form-label">Soal per Tahap (Batch)</label>
              <input class="form-input" type="number" min="2" max="10" value=${batch} onInput=${(e) => setBatch(Number(e.target.value))} />
              <div class="form-hint">Disarankan 5 soal per tahap agar kualitas maksimal.</div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-primary btn-large" type="submit" disabled=${loading || !judul.trim()}>
              ${loading ? html`<${Loader2} class="spin" />` : html`<${Save} size=${18} /> Buat Ruang Kerja`}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}
