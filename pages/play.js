/**
 * TKA Studio — pages/play.js
 * © 2026 Ekwan Nugroho — Wonogiri
 * Mode Siswa — Latihan Mandiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect, useRef } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, ArrowRight, Upload, FileJson, Play, Timer, ChevronLeft,
  ChevronRight, Grid3x3, X, CheckCircle2, AlertTriangle, Sparkles,
  BookOpen, Layers, History, Home, ClipboardPaste, Loader2, User,
  Repeat, PlayCircle, Clock, Trash2, GraduationCap, Flag, Check,
  Menu, FileText, Shield, Key, MonitorPlay
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { smartParse } from '../lib/parser/index.js';
import { normalizePaket } from '../lib/tka-schema.js';
import { scoreAttempt } from '../lib/player-scoring.js';
import {
  loadSession, saveSession, clearSession,
  loadHistory, pushHistory, deleteHistoryItem
} from '../lib/player-storage.js';
import { addImageFiles, getImageCount, clearImages } from '../lib/player-image.js';
import { QuestionRunner } from '../components/QuestionRunner.js';
import { DoneView, ReviewView } from '../components/ScoreReport.js';
import { ConfirmModal } from '../components/ConfirmModal.js';

const html = htm.bind(h);

// ---------- Helpers ----------
function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function fmtDateShort(iso) {
  try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }); }
  catch { return '-'; }
}
function fmtDuration(sec) {
  if (!sec) return '-';
  const m = Math.floor(sec / 60); const s = sec % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
function isAnswered(soal, ans) {
  if (soal.tipe === 'pg') return Number.isInteger(ans);
  if (soal.tipe === 'mcma') return Array.isArray(ans) && ans.length > 0;
  if (soal.tipe === 'bs') return Array.isArray(ans) && ans.length === soal.pernyataan.length && ans.every(v => typeof v === 'boolean');
  return false;
}

// =====================================================
// Welcome (Login-style card)
// =====================================================
function WelcomeView({ onLoaded, pendingResume, onResume, onDiscardResume, history, onViewHistory }) {
  const [dragover, setDragover] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [examCodeInput, setExamCodeInput] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [imgCount, setImgCount] = useState(getImageCount());
  const fileRef = useRef(null);

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    const code = examCodeInput.trim().toUpperCase();
    if (code.length < 6) return;
    
    setLoadingCode(true);
    setError(null);
    try {
      // Tembak langsung ke CDN GitHub
      const url = `https://raw.githubusercontent.com/onelabszz/tka-exams/main/exams/${code}.json`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error(`Kode latihan tidak ditemukan (HTTP ${res.status}).`);
      
      const paketJson = await res.json();
      if (!paketJson.soal || !Array.isArray(paketJson.soal)) {
        throw new Error('Format file soal rusak.');
      }

      onLoaded(paketJson);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
    setLoadingCode(false);
  };

  const parseInput = (raw) => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      try {
        const parsed = smartParse(raw);
        if (!parsed.ok) { setError('Format tidak dikenali: ' + parsed.error); setLoading(false); return; }
        const { paket, errors } = normalizePaket(parsed.raw);
        if (!paket) { setError('Soal tidak valid: ' + (errors[0]?.message || 'Unknown')); setLoading(false); return; }
        onLoaded(paket);
      } catch (e) { setError(String(e.message || e)); }
      setLoading(false);
    }, 200);
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const jsonFiles = [];
    const imageFiles = [];
    for (const f of files) {
      const name = (f.name || '').toLowerCase();
      if (name.endsWith('.json') || name.endsWith('.txt')) jsonFiles.push(f);
      else if (f.type && f.type.startsWith('image/')) imageFiles.push(f);
    }
    if (imageFiles.length > 0) {
      await addImageFiles(imageFiles);
      setImgCount(getImageCount());
    }
    if (jsonFiles.length > 0) {
      const text = await jsonFiles[0].text();
      parseInput(text);
    } else if (imageFiles.length > 0) {
      setError(`Terupload ${imageFiles.length} gambar. Tapi file JSON belum dipilih. Pilih JSON + gambar sekaligus.`);
    } else {
      setError('File harus .json atau gambar (.png/.jpg/.webp)');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    handleFiles(Array.from(e.dataTransfer.files || []));
  };

  const handleInput = (e) => {
    handleFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  return html`
    <div class="player-welcome-wrap">
      <div class="player-welcome-card">

        <div class="player-welcome-header">
          <span class="player-welcome-kemen">TKA Studio</span>
          <h1 class="player-welcome-title">Latihan Mandiri</h1>
          <p class="player-welcome-sub">Masukkan kode dari guru, atau upload file soal.</p>
        </div>

        ${pendingResume && html`
          <div class="player-resume-card">
            <div class="player-resume-icon"><${Repeat} size=${18} /></div>
            <div class="player-resume-body">
              <b>${pendingResume.paketJudul}</b>
              <span>${pendingResume.answeredCount} dari ${pendingResume.totalSoal} dijawab</span>
            </div>
            <div class="player-resume-actions">
              <button class="btn-primary btn-sm" onClick=${onResume}>Lanjut</button>
              <button class="btn-secondary btn-sm" onClick=${onDiscardResume}>Buang</button>
            </div>
          </div>
        `}

        <!-- Input Kode Latihan -->
        <div class="player-code-section">
          <div class="player-code-head">
            <${Key} size=${16} />
            <span>Punya Kode Latihan dari Guru?</span>
          </div>
          <form onSubmit=${handleCodeSubmit} class="player-code-form">
            <input 
              type="text" 
              placeholder="KETIK 6 HURUF..." 
              value=${examCodeInput}
              onInput=${(e) => setExamCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength="6"
              class="player-code-input"
            />
            <button 
              type="submit" 
              class="btn-primary" 
              disabled=${loadingCode || examCodeInput.length < 6}
            >
              ${loadingCode ? html`<${Loader2} class="spin" size=${18}/>` : html`<${ArrowRight} size=${18} />`}
            </button>
          </form>
        </div>

        <!-- Tombol Toggle Upload (Secondary Action) -->
        <div style="text-align: center; margin-top: 24px; margin-bottom: 16px;">
          <button 
            class="btn-secondary" 
            style="background: transparent; border: 1px dashed var(--border-strong); font-size: 12px; color: var(--text-muted); width: 100%;"
            onClick=${() => setShowUpload(!showUpload)}
          >
            <${Upload} size=${14} /> 
            ${showUpload ? 'Tutup Upload File' : 'Siswa/Guru: Upload File .json (Offline)'}
          </button>
        </div>

        <!-- Area Upload File (Disembunyikan secara default) -->
        ${showUpload && html`
          <div style="animation: fadeIn 0.3s ease;">
            <div
              class=${'player-dropzone' + (dragover ? ' dragover' : '')}
              onClick=${() => fileRef.current?.click()}
              onDragOver=${(e) => { e.preventDefault(); setDragover(true); }}
              onDragLeave=${() => setDragover(false)}
              onDrop=${handleDrop}
            >
              <div class="player-dropzone-icon"><${Upload} size=${26} /></div>
              <div class="player-dropzone-title">Upload File Soal (Offline)</div>
              <div class="player-dropzone-desc">
                Pilih file <b>JSON</b> + gambar (opsional).<br/>
                Bisa klik atau drag & drop.
              </div>
              <input
                type="file"
                accept=".json,.txt,image/*"
                multiple
                ref=${fileRef}
                onChange=${handleInput}
                style="display:none;"
              />
            </div>

            ${imgCount > 0 && html`
              <div class="player-img-info" style="margin-top:12px;">
                <${FileText} size=${12} /> ${imgCount} gambar terupload
                <button
                  class="player-img-clear"
                  onClick=${() => { clearImages(); setImgCount(0); }}
                ><${X} size=${11} /></button>
              </div>
            `}

            <button
              type="button"
              class="player-paste-toggle"
              onClick=${() => setShowPaste(v => !v)}
            >
              <${ClipboardPaste} size=${13} />
              ${showPaste ? 'Sembunyikan' : 'Atau tempel teks JSON langsung'}
            </button>

            ${showPaste && html`
              <div class="player-paste-area">
                <textarea
                  value=${pasteText}
                  onInput=${(e) => setPasteText(e.target.value)}
                  placeholder='{"version":"1.1","soal":[...]}'
                  rows=${5}
                />
                <button
                  class="btn-primary btn-sm mt-2 w-full"
                  disabled=${!pasteText.trim() || loading}
                  onClick=${() => parseInput(pasteText)}
                >
                  Olah & Lanjut
                </button>
              </div>
            `}
          </div>
        `}

        ${loading && html`
          <div class="text-center mt-3">
            <${Loader2} class="spin" size=${22} color="var(--primary)" />
          </div>
        `}

        ${error && html`
          <div class="result-card result-error" style="margin-top:12px; padding:12px;">
            <div style="display:flex; gap:8px; font-size:12.5px;">
              <${AlertTriangle} size=${14} color="var(--danger)" />
              <span>${error}</span>
            </div>
          </div>
        `}

        ${history.length > 0 && html`
          <div class="player-history-preview">
            <div class="player-history-preview-header">
              <${History} size=${14} /> Riwayat Latihan
              <button class="player-history-more" onClick=${onViewHistory}>
                Lihat Semua →
              </button>
            </div>
            ${history.slice(0, 3).map(h => html`
              <div class="history-item" key=${h.id} onClick=${() => onViewHistory(h)} style="cursor:pointer;">
                <div class="history-score-badge">
                  ${h.score}<small>/${h.total}</small>
                </div>
                <div class="history-info">
                  <div class="history-title">${h.judul}</div>
                  <div class="history-meta">${h.mapel} · ${fmtDateShort(h.submittedAt)}</div>
                </div>
              </div>
            `)}
          </div>
        `}

        <div class="player-standalone-hint">
          <${Shield} size=${11} /> Mode Siswa · Tidak perlu daftar
        </div>

        <p class="player-welcome-copyright">© 2026 Ekwan Nugroho · Wonogiri</p>
      </div>
    </div>
  `;
}

// =====================================================
// Briefing (login-card style)
// =====================================================
function BriefingView({ paket, onStart, onBack }) {
  const [mode, setMode] = useState('latihan');
  const [name, setName] = useState('');
  const [kelas, setKelas] = useState('');

  const total = paket.soal.length;
  const durasi = paket.durasiMenit || 30;
  const counts = {
    pg: paket.soal.filter(s => s.tipe === 'pg').length,
    mcma: paket.soal.filter(s => s.tipe === 'mcma').length,
    bs: paket.soal.filter(s => s.tipe === 'bs').length,
  };
  const canStart = name.trim() && total > 0;

  return html`
    <div class="player-welcome-wrap">
      <div class="player-welcome-card" style="max-width: 560px;">
        <div class="player-welcome-header">
          <span class="player-welcome-kemen">Latihan TKA</span>
          <h1 class="player-welcome-title" style="font-size:20px;">${paket.judul}</h1>
          <p class="player-welcome-sub">${paket.mapel} · ${total} soal · ${durasi} menit</p>
        </div>

        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; justify-content:center;">
          ${counts.pg > 0 && html`<span class="config-chip">PG ${counts.pg}</span>`}
          ${counts.mcma > 0 && html`<span class="config-chip is-warning">MCMA ${counts.mcma}</span>`}
          ${counts.bs > 0 && html`<span class="config-chip is-purple">B/S ${counts.bs}</span>`}
        </div>

        ${paket.wacana && html`
          <details style="margin-bottom:16px; padding:10px 14px; background:var(--surface-muted); border-radius:8px;">
            <summary style="cursor:pointer; font-weight:700; font-size:13px; color:var(--primary);">
              📖 Lihat teks wacana
            </summary>
            <div style="margin-top:10px; font-size:13px; line-height:1.6; white-space:pre-wrap;">
              ${paket.wacana_judul && html`<b style="display:block; margin-bottom:6px;">${paket.wacana_judul}</b>`}
              ${paket.wacana}
            </div>
          </details>
        `}

        <div class="player-field">
          <label>Nama Lengkap</label>
          <input
            type="text"
            value=${name}
            onInput=${(e) => setName(e.target.value)}
            placeholder="Nama sesuai absen"
            autocomplete="name"
          />
        </div>

        <div class="player-field">
          <label>Kelas</label>
          <input
            type="text"
            value=${kelas}
            onInput=${(e) => setKelas(e.target.value)}
            placeholder="Contoh: XI IPA 1"
            autocomplete="off"
          />
        </div>

        <div style="font-weight:700; font-size:12.5px; margin:16px 0 8px;">Pilih Mode:</div>
        <div class="briefing-modes">
          <button
            type="button"
            class=${'briefing-mode-card' + (mode === 'latihan' ? ' active' : '')}
            onClick=${() => setMode('latihan')}
          >
            <div class="briefing-mode-icon"><${Play} size=${20} /></div>
            <div class="briefing-mode-title">Latihan</div>
            <div class="briefing-mode-desc">Tanpa timer. Lihat pembahasan setelah selesai.</div>
          </button>
          <button
            type="button"
            class=${'briefing-mode-card' + (mode === 'simulasi' ? ' active' : '')}
            onClick=${() => setMode('simulasi')}
          >
            <div class="briefing-mode-icon"><${Timer} size=${20} /></div>
            <div class="briefing-mode-title">Simulasi</div>
            <div class="briefing-mode-desc">Dengan timer ${durasi} menit. Auto-submit saat waktu habis.</div>
          </button>
        </div>

        <div class="form-actions" style="margin-top:16px;">
          <button
            class="btn-primary btn-large"
            disabled=${!canStart}
            onClick=${() => onStart({ mode, name: name.trim(), kelas: kelas.trim() })}
          >
            <${Play} size=${18} /> Mulai ${mode === 'latihan' ? 'Latihan' : 'Simulasi'}
          </button>
          <button class="btn-secondary w-full" onClick=${onBack}>
            <${ArrowLeft} size=${15} /> Pilih File Lain
          </button>
        </div>

        <p class="player-welcome-copyright">© 2026 Ekwan Nugroho · Wonogiri</p>
      </div>
    </div>
  `;
}

// =====================================================
// Exam View (Dashboard Operator UI)
// =====================================================
function ExamView({
  paket, mode, answers, flagged, currentIndex, remaining, timeLimit,
  studentName, studentClass, onAnswer, onNavigate, onToggleFlag,
  onSubmit, onExit,
}) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showWacana, setShowWacana] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [fontSize, setFontSize] = useState('normal');

  const total = paket.soal.length;
  const soal = paket.soal[currentIndex];
  const answeredCount = paket.soal.filter(s => isAnswered(s, answers[s.id])).length;
  const flaggedCount = flagged.size;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  const timerClass = timeLimit > 0
    ? (remaining <= 60 ? 'danger' : remaining <= 300 ? 'warn' : '')
    : '';

  const handleKumpul = () => {
    if (answeredCount < total || flaggedCount > 0) setConfirmSubmit(true);
    else onSubmit();
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        if(window.showToast) window.showToast("Gagal masuk mode layar penuh.", "error");
      });
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const confirmMsg = answeredCount < total
    ? `Masih ada ${total - answeredCount} soal kosong${flaggedCount > 0 ? ` dan ${flaggedCount} soal ditandai ragu` : ''}. Tetap kumpulkan?`
    : `Ada ${flaggedCount} soal ditandai ragu. Yakin kumpulkan?`;

  const fontSizeClass = fontSize === 'small' ? 'fs-small' : fontSize === 'large' ? 'fs-large' : '';

  return html`
    <div class="player-exam-shell">

      <!-- HEADER OPERATOR -->
      <header class="player-exam-header">
        <div class="player-exam-header-left">
          <div class="player-exam-badge">TKA</div>
          <div class="player-exam-user">
            <div class="player-exam-user-name">${studentName || 'Siswa'}</div>
            <div class="player-exam-user-sub">${studentClass || paket.mapel}</div>
          </div>
        </div>
        
        <div class="player-exam-header-center">
          <div class=${'player-exam-timer ' + timerClass}>
            <${Timer} size=${18} /> ${mode === 'simulasi' ? fmtTime(remaining) : 'Latihan'}
          </div>
        </div>

        <div class="player-exam-header-right">
          <button class="player-exam-icon-btn" onClick=${handleFullscreen} title="Layar Penuh">
            <${MonitorPlay} size=${20} />
          </button>
          <button class="player-exam-menu-btn" onClick=${() => setShowSidebar(!showSidebar)}>
            <${Grid3x3} size=${18} /> <span>Navigasi</span>
          </button>
        </div>
      </header>

      <div class="player-exam-body">
        
        <!-- KONTEN SOAL -->
        <main class="player-exam-content">
          ${paket.wacana && html`
            <div style="margin-bottom: 16px;">
              <button class="player-wacana-pill" onClick=${() => setShowWacana(true)}>
                <${BookOpen} size=${14} /> Buka Teks Wacana
              </button>
            </div>
          `}

          <div class=${'player-question-card ' + fontSizeClass}>
            <div class="player-question-header">
              <span class="player-q-num">Soal ${currentIndex + 1} <span style="color:var(--text-subtle); font-weight:500;">dari ${total}</span></span>
              <div class="player-q-tools">
                <button class=${'player-tool-btn ' + (fontSize === 'small' ? 'active' : '')} onClick=${() => setFontSize('small')} style="font-size:11px;">A-</button>
                <button class=${'player-tool-btn ' + (fontSize === 'normal' ? 'active' : '')} onClick=${() => setFontSize('normal')} style="font-size:13px;">A</button>
                <button class=${'player-tool-btn ' + (fontSize === 'large' ? 'active' : '')} onClick=${() => setFontSize('large')} style="font-size:15px;">A+</button>
              </div>
            </div>

            <${QuestionRunner}
              key=${soal.id}
              soal=${soal}
              nomor=${currentIndex + 1}
              answer=${answers[soal.id]}
              onChange=${onAnswer}
              readOnly=${false}
              showKey=${false}
              flagged=${flagged.has(soal.id)}
            />
          </div>
        </main>

        <!-- SIDEBAR NAVIGASI (Desktop) / DRAWER (Mobile) -->
        <aside class=${'player-exam-sidebar' + (showSidebar ? ' show' : '')}>
          <div class="player-sidebar-top">
            <h3>Navigasi Soal</h3>
            <button class="player-sidebar-close" onClick=${() => setShowSidebar(false)}><${X} size=${18} /></button>
          </div>

          <div class="player-sidebar-stats">
            <div><b>${answeredCount}</b><span>Dijawab</span></div>
            <div><b>${flaggedCount}</b><span>Ragu</span></div>
            <div><b>${total - answeredCount}</b><span>Kosong</span></div>
          </div>

          <div class="player-nav-grid-sidebar">
            ${paket.soal.map((s, i) => {
              const answered = isAnswered(s, answers[s.id]);
              const isFlagged = flagged.has(s.id);
              const isCurrent = i === currentIndex;
              const cls = 'player-nav-num '
                + (isCurrent ? 'current ' : '')
                + (isFlagged ? 'ragu ' : (answered ? 'answered' : 'empty'));
              return html`
                <button
                  class=${cls}
                  onClick=${() => { onNavigate(i); if(window.innerWidth < 1024) setShowSidebar(false); }}
                  key=${s.id}
                >${i + 1}</button>
              `;
            })}
          </div>

          <div class="player-sidebar-bottom">
            <button class="btn-primary btn-large w-full" onClick=${handleKumpul} style="height: 48px; box-shadow: 0 4px 12px rgba(30,64,175,0.3);">
              <${CheckCircle2} size=${18} /> Selesai & Kirim
            </button>
          </div>
        </aside>
        ${showSidebar && html`<div class="player-exam-sidebar-overlay" onClick=${() => setShowSidebar(false)}></div>`}

      </div>

      <!-- FOOTER NAVIGASI -->
      <footer class="player-exam-footer-bar">
        <div class="player-footer-inner">
          <button
            class="player-nav-btn"
            disabled=${currentIndex === 0}
            onClick=${() => onNavigate(currentIndex - 1)}
          >
            <${ChevronLeft} size=${18} /> <span>Sebelumnya</span>
          </button>
          
          <button
            class=${'player-ragu-btn ' + (flagged.has(soal.id) ? 'active' : '')}
            onClick=${() => onToggleFlag(soal.id)}
          >
            <${Flag} size=${18} /> <span>Tandai Ragu</span>
          </button>

          ${currentIndex === total - 1
            ? html`
              <button class="player-nav-btn primary" onClick=${handleKumpul}>
                <span>Selesai</span> <${CheckCircle2} size=${18} />
              </button>
            `
            : html`
              <button
                class="player-nav-btn primary"
                onClick=${() => onNavigate(currentIndex + 1)}
              >
                <span>Selanjutnya</span> <${ChevronRight} size=${18} />
              </button>
            `}
        </div>
      </footer>

      ${showWacana && paket.wacana && html`
        <div class="modal-backdrop" onClick=${() => setShowWacana(false)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()} style="max-width:680px;">
            <div class="modal-header">
              <div class="modal-title"><${BookOpen} size=${18} /> ${paket.wacana_judul || 'Teks Wacana'}</div>
              <button class="modal-close" onClick=${() => setShowWacana(false)}><${X} size=${18} /></button>
            </div>
            <div class="modal-body" style="font-size:15px; line-height:1.8; white-space:pre-wrap;">
              ${paket.wacana}
            </div>
          </div>
        </div>
      `}

      ${confirmSubmit && html`
        <${ConfirmModal}
          title="Kumpulkan jawaban?"
          message=${confirmMsg}
          confirmText="Ya, Kumpulkan"
          isDanger=${false}
          onConfirm=${() => { setConfirmSubmit(false); onSubmit(); }}
          onCancel=${() => setConfirmSubmit(false)}
        />
      `}
    </div>
  `;
}

// =====================================================
// History Modal
// =====================================================
function HistoryViewer({ history, onClose, onDelete, onOpen }) {
  return html`
    <div class="modal-backdrop" onClick=${onClose}>
      <div class="modal" onClick=${(e) => e.stopPropagation()} style="max-width:560px;">
        <div class="modal-header">
          <div class="modal-title"><${History} size=${18} /> Riwayat Latihan</div>
          <button class="modal-close" onClick=${onClose}><${X} size=${18} /></button>
        </div>
        <div class="modal-body">
          ${history.length === 0
            ? html`<div style="padding:32px 16px; text-align:center; color:var(--text-muted);">Belum ada riwayat latihan.</div>`
            : html`
              <div class="history-list">
                ${history.map(h => html`
                  <div class="history-item" key=${h.id}>
                    <div class="history-score-badge" onClick=${() => onOpen(h)} style="cursor:pointer;">
                      ${h.score}<small>/${h.total}</small>
                    </div>
                    <div class="history-info" onClick=${() => onOpen(h)} style="cursor:pointer;">
                      <div class="history-title">${h.judul}</div>
                      <div class="history-meta">${h.mapel} · ${fmtDateShort(h.submittedAt)} · ${h.mode} · ${fmtDuration(h.durationSec)}</div>
                    </div>
                    <button class="icon-btn icon-danger" onClick=${() => onDelete(h.id)} title="Hapus">
                      <${Trash2} size=${15} />
                    </button>
                  </div>
                `)}
              </div>
            `}
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onClick=${onClose}>Tutup</button>
        </div>
      </div>
    </div>
  `;
}

// =====================================================
// MAIN PlayPage
// =====================================================
export function PlayPage() {
  const [view, setView] = useState('welcome');
  const [paket, setPaket] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [mode, setMode] = useState('latihan');
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [timeLimit, setTimeLimit] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [timeUpFlag, setTimeUpFlag] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [history, setHistory] = useState(() => loadHistory());
  const [pendingResume, setPendingResume] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const answersRef = useRef(answers);
  const flaggedRef = useRef(flagged);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { flaggedRef.current = flagged; }, [flagged]);

  useEffect(() => {
    setHistory(loadHistory());
    const sess = loadSession();
    if (sess && sess.paket && sess.view === 'exam') {
      setPendingResume({
        paketJudul: sess.paket.judul,
        answeredCount: Object.keys(sess.answers || {}).length,
        totalSoal: sess.paket.soal.length,
        session: sess,
      });
    }
  }, []);

  useEffect(() => {
    if (view !== 'exam' || mode !== 'simulasi') return;
    const int = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(int);
  }, [view, mode]);

  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const remaining = timeLimit > 0 ? Math.max(0, timeLimit - elapsed) : 0;

  useEffect(() => {
    if (view !== 'exam' || mode !== 'simulasi') return;
    if (!startedAt || timeLimit <= 0) return;
    if (remaining > 0) return;
    setTimeUpFlag(true);
    finishAttempt(answersRef.current, flaggedRef.current);
  }, [remaining, view, mode]);

  useEffect(() => {
    if (view !== 'exam') return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [view]);

  useEffect(() => {
    if (view !== 'exam' || !paket) return;
    saveSession({
      view: 'exam',
      paket, mode, answers,
      flagged: Array.from(flagged),
      currentIndex, startedAt, timeLimit,
      studentName, studentClass,
    });
  }, [answers, flagged, currentIndex, view]);

  const handleLoaded = (p) => {
    setPaket(p);
    setView('briefing');
    setPendingResume(null);
    clearSession();
  };

  const handleStart = ({ mode: m, name, kelas }) => {
    setMode(m);
    setStudentName(name);
    setStudentClass(kelas);
    setAnswers({});
    setFlagged(new Set());
    setCurrentIndex(0);
    setStartedAt(Date.now());
    setNow(Date.now());
    setTimeLimit(m === 'simulasi' ? (paket.durasiMenit || 30) * 60 : 0);
    setTimeUpFlag(false);
    setView('exam');
  };

  const handleResume = () => {
    const s = pendingResume?.session;
    if (!s) return;
    setPaket(s.paket);
    setMode(s.mode);
    setAnswers(s.answers || {});
    setFlagged(new Set(s.flagged || []));
    setCurrentIndex(s.currentIndex || 0);
    setStartedAt(s.startedAt);
    setTimeLimit(s.timeLimit || 0);
    setStudentName(s.studentName || '');
    setStudentClass(s.studentClass || '');
    setNow(Date.now());
    setPendingResume(null);
    setView('exam');
  };

  const handleDiscardResume = () => {
    clearSession();
    setPendingResume(null);
  };

  const handleAnswer = (soalId, val) => {
    setAnswers(prev => {
      const next = { ...prev };
      if (val === undefined || (Array.isArray(val) && val.length === 0)) {
        delete next[soalId];
      } else {
        next[soalId] = val;
      }
      return next;
    });
  };

  const handleToggleFlag = (soalId) => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(soalId)) next.delete(soalId); else next.add(soalId);
      return next;
    });
  };

  const finishAttempt = (finalAnswers, finalFlagged) => {
    const scored = scoreAttempt(paket, finalAnswers);
    const nowIso = new Date().toISOString();
    const dur = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;

    setResult(scored);
    setSubmittedAt(nowIso);
    setDurationSec(dur);
    setView('done');
    clearSession();

    const entry = {
      id: 'att-' + Date.now(),
      paketId: paket.id,
      judul: paket.judul,
      mapel: paket.mapel,
      mode,
      score: scored.score,
      total: scored.total,
      pct: scored.pct,
      durationSec: dur,
      submittedAt: nowIso,
      answers: finalAnswers,
      flagged: Array.from(finalFlagged || []),
      detail: scored.detail,
      perType: scored.perType,
      studentName,
      studentClass,
      paket,
    };
    setHistory(pushHistory(entry));
  };

  const handleShare = () => {
    if (!result || !paket) return;
    const text =
      `📝 Hasil Latihan — TKA Studio\n` +
      `👤 ${studentName || 'Siswa'}${studentClass ? ' (' + studentClass + ')' : ''}\n` +
      `📚 ${paket.judul} · ${paket.mapel}\n` +
      `🎯 Skor: ${result.score}/${result.total} (${result.pct}%)\n` +
      `⏱ ${fmtDuration(durationSec)}`;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  };

  const handleFinish = () => {
    setView('welcome');
    setPaket(null);
    setResult(null);
    setAnswers({});
    setFlagged(new Set());
    setStartedAt(null);
    setTimeLimit(0);
    setCurrentIndex(0);
    setStudentName('');
    setStudentClass('');
    setPendingResume(null);
  };

  const handleOpenHistory = (h) => {
    setPaket(h.paket);
    setAnswers(h.answers || {});
    setMode(h.mode);
    setSubmittedAt(h.submittedAt);
    setDurationSec(h.durationSec || 0);
    setStudentName(h.studentName || '');
    setStudentClass(h.studentClass || '');
    setResult({
      score: h.score,
      total: h.total,
      pct: h.pct,
      answeredCount: h.detail.filter(d => d.answered).length,
      perType: h.perType,
      detail: h.detail,
    });
    setView('review');
    setShowHistory(false);
  };

  if (view === 'welcome') {
    return html`
      <${WelcomeView}
        onLoaded=${handleLoaded}
        pendingResume=${pendingResume}
        onResume=${handleResume}
        onDiscardResume=${handleDiscardResume}
        history=${history}
        onViewHistory=${(h) => {
          if (h && h.id) handleOpenHistory(h);
          else setShowHistory(true);
        }}
      />
      ${showHistory && html`
        <${HistoryViewer}
          history=${history}
          onClose=${() => setShowHistory(false)}
          onDelete=${(id) => setHistory(deleteHistoryItem(id))}
          onOpen=${handleOpenHistory}
        />
      `}
    `;
  }

  if (view === 'briefing' && paket) {
    return html`
      <${BriefingView} paket=${paket} onStart=${handleStart} onBack=${() => setView('welcome')} />
    `;
  }

  if (view === 'exam' && paket) {
    return html`
      <${ExamView}
        paket=${paket}
        mode=${mode}
        answers=${answers}
        flagged=${flagged}
        currentIndex=${currentIndex}
        remaining=${remaining}
        timeLimit=${timeLimit}
        studentName=${studentName}
        studentClass=${studentClass}
        onAnswer=${handleAnswer}
        onNavigate=${(i) => setCurrentIndex(Math.max(0, Math.min(paket.soal.length - 1, i)))}
        onToggleFlag=${handleToggleFlag}
        onSubmit=${() => finishAttempt(answers, flagged)}
        onExit=${() => setConfirmExit(true)}
      />
      ${confirmExit && html`
        <${ConfirmModal}
          title="Keluar dari latihan?"
          message="Jawaban Anda tersimpan otomatis. Bisa dilanjutkan nanti dari halaman awal Mode Siswa."
          confirmText="Ya, Keluar"
          isDanger=${true}
          onConfirm=${() => { setConfirmExit(false); handleFinish(); }}
          onCancel=${() => setConfirmExit(false)}
        />
      `}
    `;
  }

  if (view === 'done' && paket && result) {
    return html`
      <${DoneView}
        paket=${paket}
        result=${result}
        durationSec=${durationSec}
        timeUp=${timeUpFlag}
        studentName=${studentName}
        studentClass=${studentClass}
        onReview=${() => setView('review')}
        onFinish=${handleFinish}
      />
    `;
  }

  if (view === 'review' && paket && result) {
    return html`
      <${ReviewView}
        paket=${paket}
        answers=${answers}
        result=${result}
        studentName=${studentName}
        studentClass=${studentClass}
        onClose=${() => setView('done')}
        onShare=${handleShare}
        onRestart=${handleFinish}
      />
    `;
  }

  return null;
}