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
  Link2, MessageCircle, MonitorPlay, Smartphone, Save, Key
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { loadDraft, saveDraft, clearDraft } from '../stores/studio.js';
import { toLocalHostFormat, slugify, validatePaket } from '../lib/tka-schema.js';
import { downloadCSV } from '../lib/csv-export.js';
import { saveToBank } from '../lib/bank-soal.js';
import { Stepper } from '../components/Stepper.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { PageHero } from '../components/PageHero.js';
import { publishExamToGithub } from '../lib/exam-share.js';

const html = htm.bind(h);

function copyText(text) {
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}

// Manual download trigger dengan custom filename
function triggerDownload(json, filename) {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportPage({ navigate, profile }) {
  const draft = useMemo(() => loadDraft(), []);
  const [paket, setPaket] = useState(draft?.paket || null);
  const [judul, setJudul] = useState(draft?.paket?.judul || '');
  const [durasi, setDurasi] = useState(draft?.paket?.durasiMenit || 30);
  const [acakMode, setAcakMode] = useState(draft?.paket?.acakMode || 'per-tipe');
  const [latihanMandiri, setLatihanMandiri] = useState(draft?.paket?.latihanMandiri !== false);

  const [downloaded, setDownloaded] = useState(false);
  const [downloadedVariant, setDownloadedVariant] = useState(null); // 'local' | 'player'
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [publishingExam, setPublishingExam] = useState(false);
  const [examCode, setExamCode] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  
  // Cek izin akses
  const canPublishExam = profile?.role === 'admin' || profile?.can_publish_exam === true;

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

  // Build paket final. withBase64=false → strip img_data (Local Host safe).
  const buildFinalPaket = (withBase64 = false) => {
    const id = slugify(judul) || slugify(paket.judul) || 'paket-soal';
    const soal = paket.soal.map((s, i) => {
      const clean = { ...s, id: `s${i + 1}` };
      if (!withBase64) delete clean.img_data;
      return clean;
    });
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

  // Deteksi apakah ada base64 di paket
  const hasBase64Images = paket.soal.some(s => s.img_data && String(s.img_data).startsWith('data:image/'));
  const base64Count = paket.soal.filter(s => s.img_data && String(s.img_data).startsWith('data:image/')).length;

  // ============================================================
  // Download handlers
  // ============================================================
  const handleDownload = (variant = 'local') => {
    try {
      setError(null);
      const withBase64 = variant === 'player';
      const final = buildFinalPaket(withBase64);
      const v = validatePaket(final);
      if (!v.valid) {
        setError(v.errors.map(e => e.message).join('; '));
        if (window.showToast) window.showToast('Validasi gagal. Periksa soal Anda.', 'error');
        return;
      }
      const json = toLocalHostFormat(final);
      const suffix = withBase64 ? '-player' : '';
      const filename = `${json.id}${suffix}.json`;
      triggerDownload(json, filename);

      // Save ke draft — SELALU simpan dengan base64 (agar img_data tidak hilang)
      const draftSave = buildFinalPaket(true);
      saveDraft({ ...draft, paket: draftSave });

      setDownloaded(true);
      setDownloadedVariant(variant);
      if (window.showToast) {
        window.showToast(
          variant === 'player'
            ? 'File Player diunduh — 1 file standalone untuk siswa.'
            : 'File Local Host diunduh — ringan & 100% kompatibel.',
          'success'
        );
      }
    } catch (e) {
      setError(String(e.message || e));
      if (window.showToast) window.showToast('Gagal mengunduh file.', 'error');
    }
  };

  const handleDownloadCSV = () => {
    try {
      setError(null);
      const final = buildFinalPaket(false);
      downloadCSV(final);
      if (window.showToast) window.showToast('File CSV berhasil diunduh.', 'success');
    } catch (e) {
      setError(String(e.message || e));
      if (window.showToast) window.showToast('Gagal mengunduh CSV.', 'error');
    }
  };

  const handleCopyCode = async () => {
    try {
      const final = buildFinalPaket(false);
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
      // Simpan tanpa base64 (lean storage)
      const final = buildFinalPaket(false);
      const v = validatePaket(final);
      if (!v.valid) {
        setError(v.errors.map(e => e.message).join('; '));
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

  const handlePublishExam = async () => {
    if (!profile) { navigate('/login'); return; }
    setPublishingExam(true);
    try {
      const final = buildFinalPaket(true);
      const res = await publishExamToGithub(profile.id, judul.trim() || paket.judul, final);
      setExamCode(res.code);
      if (window.showToast) window.showToast('Ujian berhasil diterbitkan!', 'success');
    } catch (e) {
      if (window.showToast) window.showToast('Gagal menerbitkan: ' + e.message, 'error');
    }
    setPublishingExam(false);
  };

  const handleCopyExamCode = () => {
    if (!examCode) return;
    navigator.clipboard.writeText(examCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

    setConfirmData({
      title: 'Duplikat Draf?',
      message: 'Paket ini akan disalin ke draf baru. Anda bisa mengubah topik tanpa kehilangan paket aslinya.',
      confirmText: 'Ya, Duplikat',
      isDanger: false,
      onConfirm: () => {
        setConfirmData(null);
        saveDraft({ ...draft, paket: buildFinalPaket(true), originalText: '', savedAt: Date.now() });
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
    if (!downloaded) {
      setConfirmData({
        title: 'Keluar tanpa download?',
        message: 'Draft akan dihapus dari browser. Pastikan Anda sudah mendownload file .json atau CSV sebelum keluar.',
        confirmText: 'Ya, Keluar',
        isDanger: true,
        onConfirm: () => { setConfirmData(null); doFinish(); }
      });
      return;
    }
    doFinish();
  };

  // ============================================================
  // Derived data
  // ============================================================
  const counts = {
    pg: paket.soal.filter(s => s.tipe === 'pg').length,
    mcma: paket.soal.filter(s => s.tipe === 'mcma').length,
    bs: paket.soal.filter(s => s.tipe === 'bs').length,
  };

  const gambarDibutuhkan = paket.soal
    .map((s, index) => ({ ...s, index }))
    .filter(s => s.img && String(s.img).trim() && !String(s.img).startsWith('data:'))
    .map(s => ({ nomor: s.index + 1, img: s.img, hasBase64: !!(s.img_data && String(s.img_data).startsWith('data:')) }));

  const finalId = slugify(judul) || slugify(paket.judul) || 'paket-soal';
  const filenameLocal = `${finalId}.json`;
  const filenamePlayer = `${finalId}-player.json`;

  const previewValidate = validatePaket(buildFinalPaket(false));
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

  const isActive = profile?.status === 'active';
  const isPending = profile && profile.status !== 'active';

  const hasImgWarning = gambarDibutuhkan.length > 0;
  const hasValidationError = !!error || !isReady;
  const heroAccent = hasValidationError || hasImgWarning ? 'warning'
    : isReady ? 'success' : 'primary';

  const chips = [
    { icon: FileJson, text: filenameLocal },
    { icon: Layers, text: `${totalSoal} soal` },
    { icon: Clock, text: `${durasi} menit` }
  ];

  const shareUrl = window.location.origin + window.location.pathname + '#/play';

  return html`
    <div class="page">
      <div class="page-shell">
        <${Stepper} current="export" />

        <${PageHero}
          icon=${isReady ? CheckCircle2 : Download}
          title="Ekspor Paket Soal"
          subtitle="Download file .json, lalu impor ke TKA Local Host atau bagikan ke siswa."
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

        <!-- Info: gambar butuh file untuk Local Host -->
        ${gambarDibutuhkan.length > 0 && html`
          <div class="result-card result-warning mb-4">
            <div class="result-header">
              <${ImageIcon} size=${18} color="var(--warning)" />
              <h2>${gambarDibutuhkan.length} Soal Bergambar</h2>
            </div>
            <p class="text-muted text-sm" style="margin-bottom: 6px;">
              Untuk <b>Local Host</b>: siapkan file berikut di folder <b>paket/gambar/</b>.
              Untuk <b>Player</b>: gambar sudah embedded otomatis.
            </p>
            <div class="img-warning-list">
              ${gambarDibutuhkan.map(g => html`
                <div class="img-warning-item">
                  <span class="img-warning-num">#${g.nomor}</span>
                  <span style="flex:1;">${g.img}</span>
                  ${g.hasBase64 && html`
                    <span class="img-warning-base64-tag">
                      <${Check} size=${9} strokeWidth=${3} /> base64
                    </span>
                  `}
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
              <div class="export-receipt-filename">${filenameLocal}</div>
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
            ${base64Count > 0 && html`
              <span class="config-chip is-success">
                <${ImageIcon} size=${11} /> ${base64Count} bergambar
              </span>
            `}
          </div>
        </div>

        <!-- Share to Student -->
        <div class="export-share-card">
          <div class="export-share-head">
            <div class="export-share-icon"><${Link2} size=${18} /></div>
            <div>
              <div class="export-share-title">Bagikan ke Siswa — Tryout Mandiri</div>
              <div class="export-share-desc">
                Kirim <b>link</b> + file <b>.json Player</b> ke WA siswa. Tanpa daftar, tanpa login.
              </div>
            </div>
          </div>

          <div class="export-share-steps">
            <div class="export-share-step">
              <span class="export-share-step-num">1</span>
              <span>Download <b>file .json Player</b> (tombol di bawah)</span>
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
            <code class="export-share-url">${shareUrl}</code>
            <button
              class=${'export-share-copy-btn ' + (shareCopied ? 'copied' : '')}
              onClick=${handleCopyShareLink}
            >
              ${shareCopied ? html`<${Check} size=${14} /> Tersalin!` : html`<${Copy} size=${14} /> Salin Link`}
            </button>
          </div>

          <div class="export-share-footer">
            <${Info} size=${11} />
            <span>Siswa tidak perlu daftar atau login. Buka link → upload file → kerjakan.</span>
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
              <label class="form-label">Judul Paket (Tampil di Local Host & Player)</label>
              <input class="form-input" value=${judul} onInput=${(e) => setJudul(e.target.value)} placeholder="Judul paket" />
              <span class="field-hint-inline">
                <${FileJson} size=${11} style="vertical-align:-2px; margin-right:3px;" />
                ${filenameLocal}
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

        <!-- Bridge: Pilih Tujuan Download -->
        <div class="export-download-panel">
          <div class="export-download-header">
            <div class="export-download-header-icon">
              <${Zap} size=${20} />
            </div>
            <div>
              <h3 class="export-download-title">Pilih Tujuan Download</h3>
              <p class="export-download-sub">Dua varian untuk dua kebutuhan berbeda</p>
            </div>
          </div>

          <div class="export-download-cards">

            <!-- Card 1: TKA Local Host -->
            <button
              type="button"
              class="export-download-card is-primary"
              onClick=${() => handleDownload('local')}
              aria-label="Download untuk TKA Local Host"
            >
              <div class="export-download-card-badge">
                <${Shield} size=${10} /> Rekomendasi
              </div>
              <div class="export-download-card-icon">
                <${MonitorPlay} size=${22} />
              </div>
              <h4 class="export-download-card-title">TKA Local Host</h4>
              <p class="export-download-card-desc">Untuk ujian offline di lab sekolah</p>
              <div class="export-download-card-features">
                <span class="export-download-feature is-success">
                  <${Check} size=${10} strokeWidth=${3} /> Kompatibel
                </span>
                <span class="export-download-feature">
                  <${FileJson} size=${10} /> JSON ringan
                </span>
              </div>
              <div class="export-download-card-cta">
                <${Download} size=${15} /> Download
                <${ArrowRight} size=${14} class="export-download-card-cta-arrow" />
              </div>
            </button>

            <!-- Card 2: TKA Player -->
            <button
              type="button"
              class=${'export-download-card is-secondary' + (hasBase64Images ? ' is-ready' : '')}
              onClick=${() => handleDownload('player')}
              aria-label="Download untuk TKA Player (Siswa)"
            >
              <div class="export-download-card-badge is-success">
                <${Smartphone} size=${10} /> Standalone
              </div>
              <div class="export-download-card-icon">
                <${Smartphone} size=${22} />
              </div>
              <h4 class="export-download-card-title">TKA Player</h4>
              <p class="export-download-card-desc">Untuk tryout mandiri di HP siswa</p>
              <div class="export-download-card-features">
                ${hasBase64Images
                  ? html`
                    <span class="export-download-feature is-success">
                      <${Check} size=${10} strokeWidth=${3} /> ${base64Count} gambar siap
                    </span>
                  `
                  : gambarDibutuhkan.length > 0
                    ? html`
                      <span class="export-download-feature is-warning">
                        <${AlertTriangle} size=${10} /> Belum ada gambar
                      </span>
                    `
                    : html`
                      <span class="export-download-feature">
                        <${Check} size=${10} /> Tanpa gambar
                      </span>
                    `}
                <span class="export-download-feature">
                  <${Layers} size=${10} /> 1 file JSON
                </span>
              </div>
              <div class="export-download-card-cta">
                <${Download} size=${15} /> Download
                <${ArrowRight} size=${14} class="export-download-card-cta-arrow" />
              </div>
            </button>

          </div>

          <!-- Secondary actions: CSV & Salin Kode -->
          <div class="export-download-secondary">
            <button type="button" class="export-secondary-btn" onClick=${handleDownloadCSV}>
              <${FileJson} size=${14} /> CSV untuk Excel
            </button>
            <button type="button" class="export-secondary-btn" onClick=${handleCopyCode}>
              ${copied ? html`<${Check} size=${14} />` : html`<${Copy} size=${14} />`}
              ${copied ? 'Tersalin!' : 'Salin Kode'}
            </button>
          </div>

          <!-- Tombol Terbitkan Ujian (Khusus Guru Berizin) -->
          ${canPublishExam && html`
            <div class="export-publish-section">
              <div class="export-publish-head">
                <${Key} size=${16} />
                <span>Ujian Online (Kode Akses)</span>
              </div>
              <p class="export-publish-desc">
                Terbitkan soal agar siswa bisa mengerjakan cukup dengan mengetik 6 huruf kode. Tanpa kirim file.
              </p>
              <button class="btn-primary w-full" onClick=${handlePublishExam} disabled=${publishingExam}>
                ${publishingExam
                  ? html`<${Loader2} size=${16} class="spin" /> Menerbitkan...`
                  : html`<${CloudUpload} size=${16} /> Terbitkan & Dapatkan Kode`}
              </button>
            </div>
          `}

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
                    Paket bisa diunduh bebas. Fitur simpan ke Koleksi aktif setelah admin menyetujui akun Anda.
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

        <!-- Instructions collapsible -->
        <details class="export-steps-details" open=${gambarDibutuhkan.length > 0}>
          <summary>
            <${Info} size=${16} />
            Cara Impor / Pakai File
          </summary>
          <div class="export-steps-details-body">

            <div class="export-instr-block">
              <div class="export-instr-heading">
                <${MonitorPlay} size=${14} /> Untuk TKA Local Host (Offline Ujian)
              </div>
              <ol class="steps-list">
                <li><div class="step-line"><span class="step-num">1</span><div>Buka <b>TKA Local Host</b> di laptop</div></div></li>
                <li><div class="step-line"><span class="step-num">2</span><div>Masuk menu <b>Paket Soal</b></div></div></li>
                <li><div class="step-line"><span class="step-num">3</span><div>Klik <b>Import JSON</b></div></div></li>
                <li><div class="step-line"><span class="step-num">4</span><div>Pilih file <b>${filenameLocal}</b></div></div></li>
                ${gambarDibutuhkan.length > 0 && html`
                  <li><div class="step-line"><span class="step-num">5</span><div>Copy gambar ke folder <b>paket/gambar/</b> (nama harus sama)</div></div></li>
                `}
              </ol>
            </div>

            <div class="export-instr-block">
              <div class="export-instr-heading">
                <${Smartphone} size=${14} /> Untuk Siswa (Player Online)
              </div>
              <ol class="steps-list">
                <li><div class="step-line"><span class="step-num">1</span><div>Download file <b>${filenamePlayer}</b></div></div></li>
                <li><div class="step-line"><span class="step-num">2</span><div>Salin link <b>${shareUrl}</b> (tombol "Salin Link" di atas)</div></div></li>
                <li><div class="step-line"><span class="step-num">3</span><div>Kirim ke WA siswa: link + file JSON</div></div></li>
                <li><div class="step-line"><span class="step-num">4</span><div>Siswa buka link → upload JSON → kerjakan</div></div></li>
              </ol>
            </div>

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

      <!-- Success Modal -->
      ${downloaded && html`
        <div class="modal-backdrop" onClick=${() => setDownloaded(false)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal-header">
              <div class="modal-title">
                <${CheckCircle2} size=${20} color="var(--success)" />
                <span>${downloadedVariant === 'player' ? 'File Player siap!' : 'File Local Host siap!'}</span>
              </div>
            </div>
            <div class="modal-body">
              <div style="text-align: center; margin-bottom: 24px;">
                <div class="export-success-icon">
                  ${downloadedVariant === 'player'
                    ? html`<${Smartphone} size=${36} />`
                    : html`<${FileJson} size=${36} />`}
                </div>
                <h3 style="font-size: 18px; font-weight: 800; color: var(--navy-900); margin: 0 0 8px;">
                  ${downloadedVariant === 'player' ? 'Standalone · siap untuk siswa' : 'Kompatibel · siap untuk Local Host'}
                </h3>
                <p class="text-muted text-sm" style="margin: 0;">
                  File <b style="font-family: monospace;">${downloadedVariant === 'player' ? filenamePlayer : filenameLocal}</b> tersimpan di folder Download Anda.
                </p>
              </div>

              <div style="background: var(--surface-muted); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px;">
                <div style="font-weight: 700; font-size: 13px; margin-bottom: 12px; color: var(--navy-900); display: flex; align-items: center; gap: 6px;">
                  <${ArrowRight} size=${14} color="var(--primary)" />
                  ${downloadedVariant === 'player' ? 'Langkah Selanjutnya untuk Siswa' : 'Langkah Selanjutnya di Local Host'}
                </div>
                <div class="steps-list">
                  ${downloadedVariant === 'player' ? html`
                    <div class="step-line"><span class="step-num">1</span><div>Klik <b>Salin Link</b> di card "Bagikan ke Siswa"</div></div>
                    <div class="step-line"><span class="step-num">2</span><div>Buka WhatsApp → pilih siswa / grup</div></div>
                    <div class="step-line"><span class="step-num">3</span><div>Kirim: link + file <b>${filenamePlayer}</b></div></div>
                    <div class="step-line"><span class="step-num">4</span><div>Siswa klik link → upload JSON → kerjakan</div></div>
                  ` : html`
                    <div class="step-line"><span class="step-num">1</span><div>Buka <b>TKA Local Host</b> di laptop</div></div>
                    <div class="step-line"><span class="step-num">2</span><div>Menu <b>Paket Soal</b> → <b>Import JSON</b></div></div>
                    <div class="step-line"><span class="step-num">3</span><div>Pilih file <b>${filenameLocal}</b></div></div>
                    ${gambarDibutuhkan.length > 0 && html`
                      <div class="step-line"><span class="step-num">4</span><div>Copy <b>${gambarDibutuhkan.length} gambar</b> ke <code>paket/gambar/</code></div></div>
                    `}
                  `}
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onClick=${() => setDownloaded(false)}>Tutup</button>
              ${downloadedVariant === 'player' ? html`
                <button class="btn-primary" onClick=${() => { setDownloaded(false); handleCopyShareLink(); }}>
                  <${MessageCircle} size=${16} /> Salin Link & Bagikan
                </button>
              ` : html`
                <button class="btn-primary" onClick=${handleFinish}>
                  <${CircleCheck} size=${16} /> Selesai
                </button>
              `}
            </div>
          </div>
        </div>
      `}

      <!-- Modal Kode Ujian -->
      ${examCode && html`
        <div class="modal-backdrop" onClick=${() => setExamCode(null)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()} style="max-width: 400px;">
            <div class="modal-header">
              <div class="modal-title">
                <${CheckCircle2} size=${20} color="var(--success)" /> Ujian Siap!
              </div>
              <button class="modal-close" onClick=${() => setExamCode(null)}><${X} size=${18} /></button>
            </div>
            <div class="modal-body" style="text-align: center;">
              <p class="text-muted text-sm mb-4">
                Bagikan kode ini ke siswa. Mereka cukup membuka <b>#/play</b> dan memasukkan kode.
              </p>
              
              <div class="exam-code-display" onClick=${handleCopyExamCode}>
                ${examCode}
              </div>
              
              <button class="btn-secondary w-full mt-3" onClick=${handleCopyExamCode}>
                ${codeCopied ? html`<${Check} size=${16} /> Tersalin!` : html`<${Copy} size=${16} /> Salin Kode`}
              </button>
            </div>
          </div>
        </div>
      `}

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
