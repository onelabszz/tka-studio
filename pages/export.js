/**
 * TKA Studio — pages/export.js
 * © 2026 Ekwan Nugroho — Wonogiri
 * All rights reserved.
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useMemo } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, Download, CheckCircle2, Copy, Check,
  FileJson, Settings2, Info, RefreshCw, Lock, AlertTriangle, CopyPlus,
  CloudUpload, Loader2, Layers, Clock, ArrowRight, Sparkles,
  CircleCheck, Image as ImageIcon, Shield, Zap, Clock as ClockIcon,
  Link2, MessageCircle
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { loadDraft, saveDraft, clearDraft } from '../stores/studio.js';
import { downloadPaket, toLocalHostFormat, slugify, validatePaket } from '../lib/tka-schema.js';
import { downloadCSV } from '../lib/csv-export.js';
import { saveToBank } from '../lib/bank-soal.js';
import { Stepper } from '../components/Stepper.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { PageHero } from '../components/PageHero.js';

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
  const [shareCopied, setShareCopied] = useState(false);

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

  const handleCopyShareLink = async () => {
    try {
      const base = window.location.origin + window.location.pathname;
      const url = base + '#/play';
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
      if (window.showToast) window.showToast('Link disalin — tempel ke WA siswa', 'success');
    } catch (e) {
      if (window.showToast) window.showToast('Gagal menyalin link', 'error');
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

  const doFinish = () => {
    const fromExpert = draft && draft._fromExpert;
    clearDraft();
    if (fromExpert) {
      if (window.showToast) window.showToast('Paket berhasil diekspor. Kembali ke Expert Mode.', 'success');
      navigate('/expert/' + fromExpert.id);
    } else {
      navigate('/');
    }
  };

  const handleFinish = () => {
    // Konfirmasi kalau belum download
    if (!downloaded) {
      setConfirmData({
        title: 'Keluar tanpa download?',
        message: 'Draft akan dihapus dari browser. Pastikan Anda sudah mendownload file .json atau CSV sebelum keluar.',
        confirmText: 'Ya, Keluar',
        isDanger: true,
        onConfirm: () => {
          setConfirmData(null);
          doFinish();
        }
      });
      return;
    }
    doFinish();
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

  const previewValidate = validatePaket(buildFinalPaket());
  const isReady = previewValidate.valid;

  const totalSoal = paket.soal.length;
  const detikPerSoal = totalSoal > 0 && durasi > 0 ? Math.round((durasi * 60) / totalSoal) : 0;
  const hintDurasiClass = detikPerSoal > 0 && detikPerSoal < 30 ? 'is-warn'
    : detikPerSoal > 180 ? 'is-info' : '';
  const hintDurasiText = detikPerSoal > 0
    ? detikPerSoal < 30
      ? `~${detikPerSoal} dtk/soal — terlalu cepat untuk soal HOTS`
      : detikPerSoal > 180
        ? `~${detikPerSoal} dtk/soal — terlalu longgar`
        : `~${detikPerSoal} dtk/soal — wajar`
    : '';

  // Status login
  const isActive = profile?.status === 'active';
  const isPending = profile && profile.status !== 'active';

  // Aksen PageHero dinamis
  const hasImgWarning = gambarDibutuhkan.length > 0;
  const hasValidationError = !!error || !isReady;
  const heroAccent = hasValidationError || hasImgWarning ? 'warning'
    : isReady ? 'success' : 'primary';

  const chips = [
    { icon: FileJson, text: filename },
    { icon: Layers, text: `${totalSoal} soal` },
    { icon: Clock, text: `${durasi} menit` }
  ];

  return html`
    <div class="page">
      <div class="page-shell">
        <${Stepper} current="export" />

        <${PageHero}
          icon=${isReady ? CheckCircle2 : Download}
          title="Ekspor Paket Soal"
          subtitle="Download file .json, lalu impor ke TKA Local Host."
          chips=${chips}
          accent=${heroAccent}
          topnav=${html`
            <button class="btn-back" onClick=${() => navigate('/preview')}>
              <${ArrowLeft} size=${16} /> Preview
            </button>
            ${draft._fromExpert && html`
              <span class="config-chip is-success">
                <${Sparkles} size=${12} /> Dari Mode Expert
              </span>
            `}
          `}
        />

        ${gambarDibutuhkan.length > 0 && html`
          <div class="result-card result-warning mb-4">
            <div class="result-header">
              <${ImageIcon} size=${18} color="var(--warning)" />
              <h2>${gambarDibutuhkan.length} Soal Butuh Gambar</h2>
            </div>
            <p class="text-muted text-sm" style="margin-bottom: 6px;">
              Siapkan file berikut di folder <b>paket/gambar/</b> sebelum impor:
            </p>
            <div class="img-warning-list">
              ${gambarDibutuhkan.map((g) => html`
                <div class="img-warning-item">
                  <span class="img-warning-num">#${g.nomor}</span>
                  <span>${g.img}</span>
                </div>
              `)}
            </div>
          </div>
        `}

        <!-- Receipt -->
        <div class="export-receipt">
          <div class="export-receipt-head">
            <div class="export-receipt-icon"><${FileJson} size=${22} /></div>
            <div class="export-receipt-headinfo">
              <div class="export-receipt-title">File Output</div>
              <div class="export-receipt-filename">${filename}</div>
            </div>
          </div>
          <div class="export-receipt-stats">
            <div class="export-receipt-stat">
              <span class="export-receipt-stat-label">Total Soal</span>
              <span class="export-receipt-stat-value">${totalSoal}</span>
            </div>
            <div class="export-receipt-stat">
              <span class="export-receipt-stat-label">Durasi</span>
              <span class="export-receipt-stat-value">${durasi} mnt</span>
            </div>
            <div class="export-receipt-stat">
              <span class="export-receipt-stat-label">Versi</span>
              <span class="export-receipt-stat-value">v1.1</span>
            </div>
          </div>
          <div class="export-receipt-compo">
            <span class="config-chip"><b>PG</b> ${counts.pg}</span>
            <span class="config-chip is-warning"><b>MCMA</b> ${counts.mcma}</span>
            <span class="config-chip is-purple"><b>B/S</b> ${counts.bs}</span>
          </div>
        </div>

        <!-- Settings -->
        <div class="form-section">
          <div class="form-section-header">
            <${Settings2} size=${18} strokeWidth=${2} />
            <h2>Pengaturan Ujian</h2>
          </div>
          <div class="form-section-body">
            <div class="form-field">
              <label class="form-label">Judul Paket (Tampil di Local Host)</label>
              <input class="form-input" value=${judul} onInput=${(e) => setJudul(e.target.value)} placeholder="Judul paket" />
              <span class="field-hint-inline">
                <${FileJson} size=${11} style="vertical-align:-2px; margin-right:3px;" />
                ${filename}
              </span>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Durasi Ujian (menit)</label>
                <input class="form-input" type="number" min=${1} max=${300} value=${durasi} onInput=${(e) => setDurasi(Number(e.target.value) || 30)} />
                ${hintDurasiText && html`
                  <span class=${'field-hint-inline ' + hintDurasiClass}>
                    <${ClockIcon} size=${11} style="vertical-align:-2px; margin-right:3px;" />
                    ${hintDurasiText}
                  </span>
                `}
              </div>
              <div class="form-field">
                <label class="form-label">Mode Acak Soal</label>
                <div class="radio-group">
                  ${[
                    { v: 'per-tipe', l: 'Per Tipe' },
                    { v: 'full', l: 'Penuh' },
                    { v: 'none', l: 'Tidak' }
                  ].map(({ v, l }) => html`
                    <button type="button" class=${'radio-card ' + (acakMode === v ? 'active' : '')} onClick=${() => setAcakMode(v)}>
                      ${l}
                    </button>
                  `)}
                </div>
              </div>
            </div>
            <label class="checkbox-label">
              <input type="checkbox" checked=${latihanMandiri} onChange=${(e) => setLatihanMandiri(e.target.checked)} />
              Bisa dipakai untuk latihan mandiri siswa
            </label>
          </div>
        </div>

        ${error && html`
          <div class="result-card result-error">
            <div class="result-header">
              <${AlertTriangle} size=${18} color="var(--danger)" />
              <h2>Gagal mengekspor</h2>
            </div>
            <pre class="pre-wrap text-sm">${error}</pre>
          </div>
        `}

        <!-- Bagikan ke Siswa -->
        <div class="export-share-card">
          <div class="export-share-head">
            <div class="export-share-icon"><${Link2} size=${18} /></div>
            <div>
              <div class="export-share-title">Bagikan ke Siswa — Tryout Mandiri</div>
              <div class="export-share-desc">
                Kirim <b>link</b> + file <b>.json</b> ini ke WA siswa. Siswa buka link → upload file → kerjakan.
              </div>
            </div>
          </div>

          <div class="export-share-steps">
            <div class="export-share-step">
              <span class="export-share-step-num">1</span>
              <span>Download file <b>.json</b> (tombol di bawah)</span>
            </div>
            <div class="export-share-step">
              <span class="export-share-step-num">2</span>
              <span>Klik <b>Salin Link Siswa</b> di bawah</span>
            </div>
            <div class="export-share-step">
              <span class="export-share-step-num">3</span>
              <span>Kirim via WA: <i>"Ini link + soal tryout kamu"</i></span>
            </div>
          </div>

          <div class="export-share-link-row">
            <code class="export-share-url">${window.location.origin + window.location.pathname}#/play</code>
            <button
              class=${'export-share-copy-btn ' + (shareCopied ? 'copied' : '')}
              onClick=${handleCopyShareLink}
            >
              ${shareCopied ? html`<${Check} size=${14} /> Tersalin!` : html`<${Copy} size=${14} /> Salin Link`}
            </button>
          </div>

          <div class="export-share-footer">
            <${Info} size=${11} />
            <span>Siswa tidak perlu daftar atau login. Buka link → langsung bisa kerjakan.</span>
          </div>
        </div>

        <!-- Bridge -->
        <div class="export-bridge">
          <div class="export-bridge-head">
            <div class="export-bridge-title">
              <${Zap} size=${18} color="var(--amber-400)" />
              Kirim ke TKA Local Host
            </div>
            <div class="export-bridge-sub">
              Download file di bawah ini, lalu impor ke aplikasi ujian offline Anda.
            </div>
          </div>
          <div class="export-bridge-actions">
            <button class="btn-primary w-full" onClick=${handleDownload} style="background: white; color: var(--primary);">
              <${Download} size=${20} /> Download File .json
            </button>
            <div class="export-bridge-split">
              <button class="btn-glass" onClick=${handleDownloadCSV}>
                <${FileJson} size=${16} /> Download CSV
              </button>
              <button class="btn-glass" onClick=${handleCopyCode}>
                ${copied ? html`<${Check} size=${16} />` : html`<${Copy} size=${16} />`}
                ${copied ? 'Tersalin!' : 'Salin Kode'}
              </button>
            </div>
          </div>

          <div class="export-bridge-divider">
            ${isActive ? html`
              <button class="btn-glass w-full" onClick=${handleSaveToCloud} disabled=${saving}>
                ${saving
                  ? html`<${Loader2} size=${16} class="spin" /> Menyimpan...`
                  : html`<${CloudUpload} size=${16} /> Simpan ke Koleksi Saya`}
              </button>
            ` : isPending ? html`
              <div class="export-status-card">
                <div class="export-status-card-icon"><${ClockIcon} size=${16} /></div>
                <div class="export-status-card-body">
                  <div class="export-status-card-title">Akun menunggu verifikasi</div>
                  <div class="export-status-card-desc">
                    Paket bisa diunduh bebas. Fitur simpan ke Koleksi Saya aktif setelah admin menyetujui akun Anda.
                  </div>
                </div>
              </div>
            ` : html`
              <div class="save-hint">
                <div style="margin-bottom: 4px;">
                  <${Lock} size=${14} style="vertical-align: -2px; margin-right: 4px;" />
                  Ingin menyimpan paket ini ke akun Anda?
                </div>
                <div style="font-size: 11.5px; opacity: 0.75; margin-bottom: 6px;">
                  Daftar gratis — bisa diedit kapan saja & dibagikan ke Pustaka.
                </div>
                <button class="btn-primary w-full" onClick=${() => navigate('/login')} style="background: white; color: var(--primary); height: 40px; font-size: 13px;">
                  <${Shield} size=${14} /> Daftar / Masuk
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- Instructions -->
        <details class="export-steps-details" open=${gambarDibutuhkan.length > 0}>
          <summary>
            <${Info} size=${16} />
            Cara Impor ke TKA Local Host
          </summary>
          <div class="export-steps-details-body">
            <ol class="steps-list">
              <li><div class="step-line"><span class="step-num">1</span><div>Buka <b>TKA Local Host</b> di laptop Anda</div></div></li>
              <li><div class="step-line"><span class="step-num">2</span><div>Masuk menu <b>Paket Soal</b></div></div></li>
              <li><div class="step-line"><span class="step-num">3</span><div>Klik <b>Import JSON</b> (atau Import CSV)</div></div></li>
              <li><div class="step-line"><span class="step-num">4</span><div>Pilih file <b>${filename}</b> yang baru diunduh</div></div></li>
              ${gambarDibutuhkan.length > 0 && html`
                <li><div class="step-line"><span class="step-num">5</span><div>Upload gambar ke folder <b>paket/gambar/</b></div></div></li>
              `}
              <li><div class="step-line"><span class="step-num">${gambarDibutuhkan.length > 0 ? '6' : '5'}</span><div>Selesai — paket siap dipakai ujian</div></div></li>
            </ol>
          </div>
        </details>

        <div class="form-actions" style="display: flex; flex-direction: column; gap: 8px;">
          ${isActive && html`
            <button class="btn-secondary w-full" onClick=${handleDuplicateDraft}>
              <${CopyPlus} size=${16} /> Duplikat Draf (Ubah Topik)
            </button>
          `}
          <button class="btn-secondary w-full" onClick=${handleFinish}>
            <${RefreshCw} size=${16} /> Selesai & Buat Soal Baru
          </button>
        </div>
      </div>

      ${downloaded && html`
        <div class="modal-backdrop" onClick=${() => setDownloaded(false)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal-header">
              <div class="modal-title"><${CheckCircle2} size=${20} color="var(--success)" /><span>File berhasil diunduh!</span></div>
            </div>
            <div class="modal-body">
              <div style="text-align: center; margin-bottom: 24px;">
                <div class="export-success-icon"><${FileJson} size=${36} /></div>
                <h3 style="font-size: 18px; font-weight: 800; color: var(--navy-900); margin: 0 0 8px;">File siap diimpor!</h3>
                <p class="text-muted text-sm">File <b style="font-family: monospace;">${filename}</b> tersimpan di folder Download Anda.</p>
              </div>

              <div style="background: var(--surface-muted); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px;">
                <div style="font-weight: 700; font-size: 13px; margin-bottom: 12px; color: var(--navy-900); display: flex; align-items: center; gap: 6px;">
                  <${ArrowRight} size=${14} color="var(--primary)" />
                  Langkah Selanjutnya di TKA Local Host
                </div>
                <div class="steps-list">
                  <div class="step-line"><span class="step-num">1</span><div>Buka aplikasi <b>TKA Local Host</b>.</div></div>
                  <div class="step-line"><span class="step-num">2</span><div>Masuk ke menu <b>Paket Soal</b> → Klik <b>Import JSON</b>.</div></div>
                  <div class="step-line"><span class="step-num">3</span><div>Pilih file <b>${filename}</b>.</div></div>
                  ${gambarDibutuhkan.length > 0 && html`
                    <div class="step-line"><span class="step-num">4</span><div>Upload <b>${gambarDibutuhkan.length} file gambar</b> ke folder <code>paket/gambar/</code>.</div></div>
                  `}
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onClick=${() => setDownloaded(false)}>Tutup</button>
              <button class="btn-primary" onClick=${() => { setDownloaded(false); handleCopyShareLink(); }}>
                <${MessageCircle} size=${16} /> Salin Link & Bagikan
              </button>
            </div>
          </div>
        </div>
      `}

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
