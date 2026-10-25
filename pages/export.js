/**
 * TKA Studio — pages/export.js
 * © 2026 Ekwan Nugroho — Wonogiri
 * All rights reserved.
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useMemo } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, Download, CheckCircle2, ExternalLink, Copy, Check,
  FileJson, Settings2, Info, RefreshCw, Lock, AlertTriangle, CopyPlus,
  CloudUpload, Loader2, MonitorPlay
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { loadDraft, saveDraft, clearDraft } from '../stores/studio.js';
import { downloadPaket, toLocalHostFormat, slugify, validatePaket } from '../lib/tka-schema.js';
import { downloadCSV } from '../lib/csv-export.js';
import { saveToBank } from '../lib/bank-soal.js';
import { Stepper } from '../components/Stepper.js';
import { ConfirmModal } from '../components/ConfirmModal.js';

const html = htm.bind(h);

function copyText(text) {
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}

export function ExportPage({ navigate, profile }) {
  const draft = useMemo(() => loadDraft(), []);
  const [paket, setPaket] = useState(draft?.paket || null);
  const [judul, setJudul] = useState(draft?.paket?.judul || '');
  const [durasi, setDurasi] = useState(draft?.paket?.durasiMenit || 30);
  const [acakMode, setAcakMode] = useState(draft?.paket?.acakMode || 'per-tipe');
  const [latihanMandiri, setLatihanMandiri] = useState(draft?.paket?.latihanMandiri !== false);
  
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  if (!draft || !paket) {
    return html`
      <div class="page">
        <div class="page-shell">
          <${Stepper} current="export" />
          <div class="result-card result-warning mt-4">
            <h2>Tidak ada data soal</h2>
            <button class="btn-primary" onClick=${() => navigate('/paste')}>Ke Langkah 2</button>
          </div>
        </div>
      </div>
    `;
  }

  const buildFinalPaket = () => {
    const id = slugify(judul) || slugify(paket.judul) || 'paket-soal';
    const soal = paket.soal.map((s, i) => ({ ...s, id: `s${i + 1}` }));
    return {
      ...paket,
      version: '1.1',
      id,
      judul: judul.trim() || paket.judul,
      durasiMenit: Math.max(1, Math.round(durasi)),
      acakMode,
      latihanMandiri,
      soal,
    };
  };

  const handleDownload = () => {
    try {
      setError(null);
      const final = buildFinalPaket();
      const v = validatePaket(final);
      if (!v.valid) {
        setError(v.errors.map((e) => e.message).join('; '));
        if (window.showToast) window.showToast('Validasi gagal. Periksa soal Anda.', 'error');
        return;
      }
      downloadPaket(final);
      const updated = { ...draft, paket: final };
      saveDraft(updated);
      setPaket(final);
      setDownloaded(true);
    } catch (e) {
      setError(String(e.message || e));
      if (window.showToast) window.showToast('Gagal mengunduh file.', 'error');
    }
  };

  const handleDownloadCSV = () => {
    try {
      setError(null);
      const final = buildFinalPaket();
      downloadCSV(final);
      if (window.showToast) window.showToast('File CSV berhasil diunduh.', 'success');
    } catch (e) {
      setError(String(e.message || e));
      if (window.showToast) window.showToast('Gagal mengunduh CSV.', 'error');
    }
  };

  const handleCopyCode = async () => {
    try {
      const final = buildFinalPaket();
      const json = toLocalHostFormat(final);
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(json))));
      const ok = await copyText(encoded);
      if (ok) { 
        setCopied(true); 
        setTimeout(() => setCopied(false), 2000); 
        if (window.showToast) window.showToast('Kode berhasil disalin ke clipboard.', 'success');
      }
    } catch (e) { 
      setError(String(e.message || e)); 
      if (window.showToast) window.showToast('Gagal menyalin kode.', 'error');
    }
  };

  const handleSaveToCloud = async () => {
    if (!profile) { navigate('/login'); return; }
    setSaving(true); setError(null);
    try {
      const final = buildFinalPaket();
      const v = validatePaket(final);
      if (!v.valid) { 
        setError(v.errors.map((e) => e.message).join('; ')); 
        setSaving(false); 
        return; 
      }
      await saveToBank(profile.id, final);
      if (window.showToast) window.showToast('Paket berhasil disimpan ke Koleksi Saya!', 'success');
      navigate('/bank-soal');
    } catch (e) {
      setError('Gagal menyimpan ke cloud: ' + (e.message || e));
      if (window.showToast) window.showToast('Gagal menyimpan ke cloud.', 'error');
    }
    setSaving(false);
  };

  const handleDuplicateDraft = () => {
    setConfirmData({
      title: 'Duplikat Draf?',
      message: 'Paket ini akan disalin ke draf baru. Anda bisa mengubah topik tanpa kehilangan paket aslinya.',
      confirmText: 'Ya, Duplikat',
      isDanger: false,
      onConfirm: () => {
        setConfirmData(null);
        saveDraft({ ...draft, originalText: '', savedAt: Date.now() });
        if (window.showToast) window.showToast('Draf berhasil diduplikasi.', 'success');
        navigate('/build');
      }
    });
  };

  const handleFinish = () => {
    clearDraft();
    navigate('/');
  };

  const counts = {
    pg: paket.soal.filter((s) => s.tipe === 'pg').length,
    mcma: paket.soal.filter((s) => s.tipe === 'mcma').length,
    bs: paket.soal.filter((s) => s.tipe === 'bs').length,
  };

  const gambarDibutuhkan = paket.soal
    .map((s, index) => ({ ...s, index }))
    .filter((s) => s.img && String(s.img).trim())
    .map((s) => ({ nomor: s.index + 1, img: s.img }));

  const finalId = slugify(judul) || slugify(paket.judul) || 'paket-soal';
  const filename = `${finalId}.json`;

  return html`
    <div class="page">
      <div class="page-shell">
        <${Stepper} current="export" />
        <div class="page-header">
          <button class="btn-back" onClick=${() => navigate('/preview')}>
            <${ArrowLeft} size=${16} /> Preview
          </button>
          <h1 class="page-title">Ekspor Paket Soal</h1>
          <p class="page-subtitle">Siapkan file .json untuk dijalankan di TKA Local Host.</p>
        </div>

        ${gambarDibutuhkan.length > 0 && html`
          <div class="result-card result-warning mb-4">
            <div class="result-header">
              <${AlertTriangle} size=${18} color="var(--warning)" />
              <h2>${gambarDibutuhkan.length} Soal Butuh Gambar</h2>
            </div>
            <p class="text-muted text-sm mb-3">
              Sebelum mengimpor ke Local Host, siapkan file berikut di folder <b>paket/gambar/</b>:
            </p>
            <ul class="error-list font-monospace mb-3">
              ${gambarDibutuhkan.map((g) => html`<li>Soal #${g.nomor} &rarr; ${g.img}</li>`)}
            </ul>
          </div>
        `}

        <div class="export-section">
          <div class="export-section-header">
            <${FileJson} size=${18} />
            <h2>Ringkasan Paket</h2>
          </div>
          <div class="export-summary">
            <div class="summary-item">
              <span class="summary-label">Nama File</span>
              <span class="summary-value" style="font-family: monospace;">${filename}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Total Soal</span>
              <span class="summary-value">${paket.soal.length}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Komposisi</span>
              <span class="summary-value summary-value-sm">
                PG ${counts.pg} · MCMA ${counts.mcma} · B/S ${counts.bs}
              </span>
            </div>
          </div>
        </div>

        <div class="export-section">
          <div class="export-section-header">
            <${Settings2} size=${18} />
            <h2>Pengaturan Ujian</h2>
          </div>

          <div class="form-field">
            <label class="form-label">Judul Paket (Tampil di Local Host)</label>
            <input class="form-input" value=${judul} onInput=${(e) => setJudul(e.target.value)} placeholder="Judul paket" />
          </div>

          <div class="form-field">
            <label class="form-label">Durasi Ujian (menit)</label>
            <input class="form-input" type="number" min=${1} max=${300} value=${durasi} onInput=${(e) => setDurasi(Number(e.target.value) || 30)} />
          </div>

          <div class="form-field">
            <label class="form-label">Mode Acak Soal</label>
            <div class="radio-group">
              ${[{ v: 'per-tipe', l: 'Per Tipe' }, { v: 'full', l: 'Penuh' }, { v: 'none', l: 'Tidak Diacak' }].map(({ v, l }) => html`
                <button type="button" class=${`radio-card ${acakMode === v ? 'active' : ''}`} onClick=${() => setAcakMode(v)}>${l}</button>
              `)}
            </div>
          </div>

          <label class="checkbox-label mt-3">
            <input type="checkbox" checked=${latihanMandiri} onChange=${(e) => setLatihanMandiri(e.target.checked)} />
            Bisa dipakai untuk latihan mandiri siswa
          </label>
        </div>

        ${error && html`
          <div class="result-card result-error">
            <div class="result-header">
              <${Info} size=${18} color="var(--danger)" />
              <h2>Gagal mengekspor</h2>
            </div>
            <pre class="pre-wrap text-sm">${error}</pre>
          </div>
        `}

        <!-- EKSPOR ACTIONS: JEMBATAN KE LOCAL HOST -->
        <div class="export-actions" style="background: var(--surface-muted); padding: 24px; border-radius: 16px; border: 1px solid var(--border); margin-bottom: 24px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-weight: 800; font-size: 18px; color: var(--navy-900); margin-bottom: 6px;">Kirim ke TKA Local Host</div>
            <div style="font-size: 14px; color: var(--text-muted); max-width: 400px; margin: 0 auto;">Download file di bawah ini, lalu impor ke aplikasi ujian offline Anda.</div>
          </div>
          
          <button class="btn-primary btn-large" onClick=${handleDownload} style="height: 56px; font-size: 16px; box-shadow: 0 8px 24px rgba(30, 64, 175, 0.3);">
            <${Download} size=${20} /> Download File .json
          </button>
          
          <div style="display: flex; gap: 12px; margin-top: 12px; flex-wrap: wrap;">
            <button class="btn-secondary" onClick=${handleDownloadCSV} style="flex: 1; height: 44px;">
              <${FileJson} size=${16} /> Download CSV
            </button>
            <button class="btn-secondary" onClick=${handleCopyCode} style="flex: 1; height: 44px;">
              ${copied ? html`<${Check} size=${16} />` : html`<${Copy} size=${16} />`}
              ${copied ? 'Tersalin!' : 'Salin Kode'}
            </button>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px dashed var(--border-strong);">
            ${profile?.status === 'active' ? html`
              <button class="btn-secondary w-full" onClick=${handleSaveToCloud} disabled=${saving} style="border-color: var(--success); color: var(--success); height: 44px; font-weight: 600;">
                ${saving ? html`<${Loader2} size=${16} class="spin" /> Menyimpan...` : html`<${CloudUpload} size=${16} /> Simpan ke Koleksi Saya`}
              </button>
            ` : html`
              <div style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 16px; text-align: center;">
                <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
                  Ingin menyimpan paket ini ke akun Anda agar bisa diedit kapan saja?
                </div>
                <button class="btn-primary w-full" onClick=${() => navigate('/login')} style="height: 44px;">
                  <${Lock} size=${16} /> Daftar / Masuk untuk Menyimpan
                </button>
              </div>
            `}
          </div>
        </div>

        <div class="export-section export-instructions">
          <div class="export-section-header">
            <${Info} size=${18} />
            <h2>Cara Impor ke TKA Local Host</h2>
          </div>
          <ol class="steps-list">
            <li><div class="step-line"><span class="step-num">1</span><div>Buka TKA Local Host di laptop Anda</div></div></li>
            <li><div class="step-line"><span class="step-num">2</span><div>Masuk menu <b>Paket Soal</b></div></div></li>
            <li><div class="step-line"><span class="step-num">3</span><div>Klik tombol <b>Import JSON</b> (atau Import CSV)</div></div></li>
            <li><div class="step-line"><span class="step-num">4</span><div>Pilih file <b>${filename}</b> yang baru diunduh</div></div></li>
            ${gambarDibutuhkan.length > 0 && html`
              <li><div class="step-line"><span class="step-num">5</span><div>Upload gambar ke folder <b>paket/gambar/</b></div></div></li>
            `}
            <li><div class="step-line"><span class="step-num">${gambarDibutuhkan.length > 0 ? '6' : '5'}</span><div>Selesai — paket siap dipakai ujian</div></div></li>
          </ol>
        </div>

        <div class="form-actions" style="display: flex; flex-direction: column; gap: 8px;">
          ${profile?.status === 'active' && html`
            <button class="btn-secondary w-full" onClick=${handleDuplicateDraft}>
              <${CopyPlus} size=${16} /> Duplikat Draf (Ubah Topik)
            </button>
          `}
          <button class="btn-secondary w-full" onClick=${handleFinish}>
            <${RefreshCw} size=${16} /> Selesai & Buat Soal Baru
          </button>
        </div>
      </div>

      <!-- MODAL SUKSES DENGAN PENDEKATAN JEMBATAN -->
      ${downloaded && html`
        <div class="modal-backdrop" onClick=${() => setDownloaded(false)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal-header">
              <div class="modal-title"><${CheckCircle2} size=${20} color="var(--success)" /><span>File berhasil diunduh!</span></div>
            </div>
            <div class="modal-body">
              
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 64px; height: 64px; background: #dcfce7; color: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                  <${FileJson} size=${32} />
                </div>
                <h3 style="font-size: 18px; font-weight: 800; color: var(--navy-900); margin: 0 0 8px;">File siap diimpor!</h3>
                <p class="text-muted text-sm">File <b>${filename}</b> tersimpan di folder Download HP/laptop Anda.</p>
              </div>
              
              <div style="background: var(--surface-muted); border: 1px solid var(--border); border-radius: 12px; padding: 20px;">
                <div style="font-weight: 700; font-size: 14px; margin-bottom: 16px; color: var(--navy-900);">Langkah Selanjutnya di TKA Local Host:</div>
                <div class="steps-list">
                  <div class="step-line"><span class="step-num">1</span><div>Buka aplikasi <b>TKA Local Host</b>.</div></div>
                  <div class="step-line"><span class="step-num">2</span><div>Masuk ke menu <b>Paket Soal</b> → Klik <b>Import JSON</b>.</div></div>
                  <div class="step-line"><span class="step-num">3</span><div>Pilih file <b>${filename}</b> yang baru saja diunduh.</div></div>
                  ${gambarDibutuhkan.length > 0 && html`
                    <div class="step-line"><span class="step-num">4</span><div>Upload <b>${gambarDibutuhkan.length} file gambar</b> ke folder <code>paket/gambar/</code>.</div></div>
                  `}
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onClick=${() => setDownloaded(false)}>Tutup</button>
              <button class="btn-primary" onClick=${handleFinish}>Buat Soal Baru</button>
            </div>
          </div>
        </div>
      `}

      <!-- CUSTOM CONFIRM MODAL -->
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
