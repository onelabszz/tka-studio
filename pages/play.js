/**
 * TKA Studio — pages/play.js
 * © 2026 Ekwan Nugroho — Wonogiri
 *
 * Mode Siswa — Tryout Mandiri. Zero Supabase.
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect, useRef } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, ArrowRight, Upload, FileJson, Play, Timer, ChevronLeft,
  ChevronRight, Grid3x3, X, CheckCircle2, AlertTriangle, Sparkles,
  BookOpen, Layers, Trophy, RotateCcw, History, Home, ClipboardPaste,
  Loader2, User, Repeat, PlayCircle, CircleDot, ListChecks, CheckCheck,
  Clock, Trash2, GraduationCap
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { smartParse } from '../lib/parser/index.js';
import { normalizePaket } from '../lib/tka-schema.js';
import { scoreAttempt } from '../lib/player-scoring.js';
import {
  loadSession, saveSession, clearSession,
  loadHistory, pushHistory, clearHistory, deleteHistoryItem
} from '../lib/player-storage.js';
import { QuestionRunner } from '../components/QuestionRunner.js';
import { ScoreReport } from '../components/ScoreReport.js';
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
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
  } catch { return '-'; }
}
function fmtDuration(sec) {
  if (!sec) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

// =====================================================
// Upload Screen
// =====================================================
function UploadScreen({ onLoaded, navigate, pendingResume, onResume, onDiscardResume, history, onViewHistory, onDeleteHistory }) {
  const [dragover, setDragover] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const parseInput = (rawText) => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      try {
        const parsed = smartParse(rawText);
        if (!parsed.ok) {
          setError('Format tidak dikenali: ' + parsed.error);
          setLoading(false);
          return;
        }
        const { paket, errors } = normalizePaket(parsed.raw);
        if (!paket) {
          setError('Soal tidak valid: ' + (errors[0]?.message || 'Unknown'));
          setLoading(false);
          return;
        }
        onLoaded(paket);
      } catch (e) {
        setError(String(e.message || e));
      }
      setLoading(false);
    }, 250);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json') && !file.name.toLowerCase().endsWith('.txt')) {
      setError('File harus .json (atau .txt berisi JSON/CSV)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File terlalu besar (maks 5 MB)');
      return;
    }
    const text = await file.text();
    parseInput(text);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files && e.target.files[0];
    handleFile(file);
    e.target.value = '';
  };

  return html`
    <div class="page">
      <div class="page-shell">

        <div class="page-hero accent-primary" style="margin-bottom:16px;">
          <div class="page-hero-main">
            <div class="page-hero-icon"><${GraduationCap} size=${22} /></div>
            <div class="page-hero-copy">
              <h1 class="page-hero-title">Mode Siswa</h1>
              <p class="page-hero-sub">Kerjakan tryout mandiri dengan file dari guru Anda.</p>
            </div>
          </div>
        </div>

        ${pendingResume && html`
          <div class="result-card result-warning mb-4">
            <div class="result-header">
              <${Repeat} size=${18} color="var(--warning)" />
              <h2>Ada tryout yang belum selesai</h2>
            </div>
            <p class="text-muted text-sm mb-3">
              <b>${pendingResume.paketJudul}</b> · ${pendingResume.answeredCount || 0} dari ${pendingResume.totalSoal} soal dijawab.
            </p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn-primary" onClick=${onResume}>
                <${PlayCircle} size=${16} /> Lanjutkan
              </button>
              <button class="btn-secondary" onClick=${onDiscardResume}>
                <${Trash2} size=${16} /> Buang
              </button>
            </div>
          </div>
        `}

        <div
          class=${'upload-dropzone' + (dragover ? ' dragover' : '')}
          onClick=${() => fileInputRef.current?.click()}
          onDragOver=${(e) => { e.preventDefault(); setDragover(true); }}
          onDragLeave=${() => setDragover(false)}
          onDrop=${handleDrop}
        >
          <div class="upload-dropzone-icon"><${Upload} size=${28} /></div>
          <h3>Upload File .json dari Guru</h3>
          <p>Klik untuk pilih file, atau drag ke sini. Format harus <b>.json</b> yang diekspor dari TKA Studio.</p>
          <input
            type="file"
            accept=".json,.txt,application/json"
            ref=${fileInputRef}
            onChange=${handleFileInputChange}
            style="display:none;"
          />
        </div>

        ${loading && html`
          <div class="text-center mt-3">
            <${Loader2} class="spin" size=${24} color="var(--primary)" />
          </div>
        `}

        ${error && html`
          <div class="result-card result-error mt-3">
            <div class="result-header">
              <${AlertTriangle} size=${18} color="var(--danger)" />
              <h2>Gagal memuat paket</h2>
            </div>
            <p class="text-muted text-sm">${error}</p>
          </div>
        `}

        <div class="upload-paste-area">
          <button
            type="button"
            class="accordion-toggle"
            style="width:auto; padding:0; background:none; border:none;"
            onClick=${() => setShowPaste(v => !v)}
          >
            <${ClipboardPaste} size=${14} />
            ${showPaste ? 'Sembunyikan' : 'Atau tempel JSON langsung'}
          </button>
          ${showPaste && html`
            <div style="margin-top:10px;">
              <textarea
                value=${pasteText}
                onInput=${(e) => setPasteText(e.target.value)}
                placeholder='{"version":"1.1","soal":[...]}'
                rows=${6}
              />
              <button
                class="btn-primary btn-sm mt-2"
                disabled=${!pasteText.trim() || loading}
                onClick=${() => parseInput(pasteText)}
              >
                Olah & Lanjut
              </button>
            </div>
          `}
        </div>

        ${history.length > 0 && html`
          <div class="form-section" style="margin-top:16px;">
            <div class="form-section-header">
              <${History} size=${18} strokeWidth=${2} />
              <h2>Riwayat Tryout</h2>
              <button class="btn-back" onClick=${onViewHistory} style="margin-left:auto; font-size:12px;">
                Lihat Semua →
              </button>
            </div>
            <div class="form-section-body">
              <div class="history-list">
                ${history.slice(0, 3).map(h => html`
                  <div
                    class="history-item"
                    key=${h.id}
                    onClick=${() => onViewHistory(h)}
                  >
                    <div class="history-score-badge">
                      ${h.score}<small>/${h.total}</small>
                    </div>
                    <div class="history-info">
                      <div class="history-title">${h.judul}</div>
                      <div class="history-meta">${h.mapel} · ${fmtDateShort(h.submittedAt)} · ${h.mode}</div>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          </div>
        `}

        <div class="form-actions" style="margin-top:16px;">
          <button class="btn-secondary w-full" onClick=${() => navigate('/')}>
            <${ArrowLeft} size=${16} /> Kembali ke Beranda
          </button>
        </div>

      </div>
    </div>
  `;
}

// =====================================================
// Briefing Screen
// =====================================================
function BriefingScreen({ paket, onStart, onBack }) {
  const [mode, setMode] = useState('latihan');
  const counts = {
    pg: paket.soal.filter(s => s.tipe === 'pg').length,
    mcma: paket.soal.filter(s => s.tipe === 'mcma').length,
    bs: paket.soal.filter(s => s.tipe === 'bs').length,
  };
  const total = paket.soal.length;
  const durasi = paket.durasiMenit || 30;

  return html`
    <div class="page">
      <div class="page-shell">

        <button class="btn-back" onClick=${onBack} style="margin-bottom:12px;">
          <${ArrowLeft} size=${16} /> Pilih File Lain
        </button>

        <div class="briefing-card">
          <h1 class="page-title" style="font-size:22px; margin:0 0 8px;">${paket.judul}</h1>
          <div class="briefing-chips">
            <span class="config-chip"><${BookOpen} size=${12} /> ${paket.mapel}</span>
            <span class="config-chip"><${Layers} size=${12} /> ${total} soal</span>
            <span class="config-chip"><${Clock} size=${12} /> ${durasi} menit</span>
          </div>

          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px;">
            ${counts.pg > 0 && html`<span class="config-chip">PG ${counts.pg}</span>`}
            ${counts.mcma > 0 && html`<span class="config-chip is-warning">MCMA ${counts.mcma}</span>`}
            ${counts.bs > 0 && html`<span class="config-chip is-purple">B/S ${counts.bs}</span>`}
          </div>

          ${paket.wacana && html`
            <details style="margin-bottom:16px;">
              <summary style="cursor:pointer; font-weight:700; font-size:13px; color:var(--primary);">
                📖 Lihat teks wacana (${(paket.wacana.length || 0).toLocaleString()} karakter)
              </summary>
              <div style="margin-top:10px; padding:12px; background:var(--surface-muted); border-radius:8px; font-size:13px; line-height:1.6; white-space:pre-wrap;">
                ${paket.wacana_judul && html`<div style="font-weight:700; margin-bottom:6px;">${paket.wacana_judul}</div>`}
                ${paket.wacana}
              </div>
            </details>
          `}

          <div style="font-weight:700; font-size:13px; margin-bottom:8px;">Pilih mode:</div>
          <div class="briefing-modes">
            <button
              type="button"
              class=${'briefing-mode-card' + (mode === 'latihan' ? ' active' : '')}
              onClick=${() => setMode('latihan')}
            >
              <div class="briefing-mode-icon"><${Play} size=${20} /></div>
              <div class="briefing-mode-title">Latihan</div>
              <div class="briefing-mode-desc">Tanpa timer. Santai, bisa lihat pembahasan setelah submit.</div>
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

          <div class="result-card result-warning" style="margin:16px 0 0; padding:12px 14px;">
            <div style="display:flex; align-items:flex-start; gap:8px; font-size:12.5px; color:#92400e; line-height:1.5;">
              <${AlertTriangle} size=${14} style="flex-shrink:0; margin-top:1px;" />
              <div>
                <b>Catatan:</b> File ini berisi kunci jawaban (untuk mode latihan).
                Untuk ujian serius, gunakan TKA Local Host atau minta guru pakai Mode Kode.
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-primary btn-large" onClick=${() => onStart(mode)} disabled=${total === 0}>
            <${Play} size=${18} /> Mulai ${mode === 'latihan' ? 'Latihan' : 'Simulasi'}
          </button>
        </div>

      </div>
    </div>
  `;
}

// =====================================================
// Attempt Screen
// =====================================================
function AttemptScreen({
  paket, mode, answers, currentIndex, remaining, timeLimit,
  onAnswer, onNavigate, onSubmit, onExit,
}) {
  const [showGrid, setShowGrid] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const total = paket.soal.length;
  const soal = paket.soal[currentIndex];
  const answeredCount = paket.soal.filter(s => {
    const a = answers[s.id];
    if (s.tipe === 'pg') return Number.isInteger(a);
    if (s.tipe === 'mcma') return Array.isArray(a) && a.length > 0;
    if (s.tipe === 'bs') return Array.isArray(a) && a.length === s.pernyataan.length && a.every(v => typeof v === 'boolean');
    return false;
  }).length;

  const timerClass = timeLimit > 0
    ? (remaining <= 60 ? 'danger' : remaining <= 300 ? 'warn' : '')
    : '';

  const handleKumpulkan = () => {
    if (answeredCount < total) setConfirmSubmit(true);
    else onSubmit();
  };

  return html`
    <div class="player-shell">

      <div class="player-topbar">
        <button class="player-back" onClick=${onExit} title="Keluar">
          <${X} size=${18} />
        </button>
        <div class="player-progress-info">
          <div class="player-progress-label">
            Soal <b>${currentIndex + 1}</b> / ${total}
            <span style="margin-left:auto;">${answeredCount} dijawab</span>
          </div>
          <div class="player-progress-bar">
            <div class="player-progress-fill" style="width:${(answeredCount / total) * 100}%;"></div>
          </div>
        </div>
        ${mode === 'simulasi' && html`
          <span class=${'player-timer ' + timerClass}>
            <${Timer} size=${13} /> ${fmtTime(remaining)}
          </span>
        `}
      </div>

      <div class="player-content">
        <${QuestionRunner}
          soal=${soal}
          nomor=${currentIndex + 1}
          answer=${answers[soal.id]}
          onChange=${onAnswer}
          readOnly=${false}
          showKey=${false}
        />
      </div>

      <div class="player-footer">
        <div class="player-nav-row">
          <button
            class="player-nav-btn"
            disabled=${currentIndex === 0}
            onClick=${() => onNavigate(currentIndex - 1)}
          >
            <${ChevronLeft} size=${16} /> Sebelumnya
          </button>
          <button class="player-grid-btn" onClick=${() => setShowGrid(true)} title="Daftar soal">
            <${Grid3x3} size=${18} />
          </button>
          <button
            class="player-nav-btn"
            disabled=${currentIndex === total - 1}
            onClick=${() => onNavigate(currentIndex + 1)}
          >
            Berikutnya <${ChevronRight} size=${16} />
          </button>
        </div>
        <button class="btn-primary btn-large" onClick=${handleKumpulkan}>
          <${CheckCircle2} size=${18} /> Kumpulkan Jawaban
        </button>
      </div>

      ${showGrid && html`
        <div class="grid-bottom-sheet" onClick=${() => setShowGrid(false)}>
          <div class="grid-sheet-content" onClick=${(e) => e.stopPropagation()}>
            <div class="grid-sheet-header">
              <div class="grid-sheet-title">Daftar Soal</div>
              <button class="grid-sheet-close" onClick=${() => setShowGrid(false)}>
                <${X} size=${18} />
              </button>
            </div>
            <div class="grid-sheet-numbers">
              ${paket.soal.map((s, i) => {
                const a = answers[s.id];
                const isAnswered = (s.tipe === 'pg' && Number.isInteger(a))
                  || (s.tipe === 'mcma' && Array.isArray(a) && a.length > 0)
                  || (s.tipe === 'bs' && Array.isArray(a) && a.length === s.pernyataan.length && a.every(v => typeof v === 'boolean'));
                const isCurrent = i === currentIndex;
                return html`
                  <button
                    key=${s.id}
                    class=${'grid-num ' + (isAnswered ? 'answered ' : '') + (isCurrent ? 'current' : '')}
                    onClick=${() => { onNavigate(i); setShowGrid(false); }}
                  >
                    ${i + 1}
                  </button>
                `;
              })}
            </div>
            <div class="grid-sheet-legend">
              <span><i style="background:var(--primary);"></i> Sekarang</span>
              <span><i style="background:var(--primary-light);"></i> Dijawab</span>
              <span><i style="background:var(--surface-muted);"></i> Belum</span>
            </div>
          </div>
        </div>
      `}

      ${confirmSubmit && html`
        <${ConfirmModal}
          title="Kumpulkan sekarang?"
          message=${`Masih ada ${total - answeredCount} soal yang belum dijawab. Jawaban yang kosong akan dianggap salah.`}
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
// History Viewer (modal)
// =====================================================
function HistoryViewer({ history, onClose, onDelete, onOpen }) {
  return html`
    <div class="modal-backdrop" onClick=${onClose}>
      <div class="modal" onClick=${(e) => e.stopPropagation()} style="max-width:560px;">
        <div class="modal-header">
          <div class="modal-title"><${History} size=${18} /> Riwayat Tryout</div>
          <button class="modal-close" onClick=${onClose}><${X} size=${18} /></button>
        </div>
        <div class="modal-body">
          ${history.length === 0
            ? html`<div class="empty-state" style="padding:32px 16px; border:none;">
                <p>Belum ada riwayat tryout.</p>
              </div>`
            : html`
              <div class="history-list">
                ${history.map(h => html`
                  <div class="history-item" key=${h.id}>
                    <div class="history-score-badge" onClick=${() => onOpen(h)} style="cursor:pointer;">
                      ${h.score}<small>/${h.total}</small>
                    </div>
                    <div class="history-info" onClick=${() => onOpen(h)} style="cursor:pointer;">
                      <div class="history-title">${h.judul}</div>
                      <div class="history-meta">
                        ${h.mapel} · ${fmtDateShort(h.submittedAt)} · ${h.mode} · ${fmtDuration(h.durationSec)}
                      </div>
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
// Main PlayPage — state machine
// =====================================================
export function PlayPage({ navigate }) {
  const [state, setState] = useState('upload'); // upload | briefing | attempt | report
  const [paket, setPaket] = useState(null);
  const [mode, setMode] = useState('latihan');
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [timeLimit, setTimeLimit] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [timeUpFlag, setTimeUpFlag] = useState(false);
  const [history, setHistory] = useState(() => loadHistory());
  const [pendingResume, setPendingResume] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  // ---------- Init: load history + detect resume ----------
  useEffect(() => {
    setHistory(loadHistory());
    const sess = loadSession();
    if (sess && sess.paket && sess.state === 'attempt') {
      setPendingResume({
        paketJudul: sess.paket.judul,
        answeredCount: Object.keys(sess.answers || {}).length,
        totalSoal: sess.paket.soal.length,
        session: sess,
      });
    }
  }, []);

  // ---------- Timer tick ----------
  useEffect(() => {
    if (state !== 'attempt' || mode !== 'simulasi') return;
    const int = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(int);
  }, [state, mode]);

  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const remaining = timeLimit > 0 ? Math.max(0, timeLimit - elapsed) : 0;

  // ---------- Auto-submit saat waktu habis ----------
  useEffect(() => {
    if (state !== 'attempt' || mode !== 'simulasi') return;
    if (!startedAt || timeLimit <= 0) return;
    if (remaining > 0) return;
    setTimeUpFlag(true);
    finishAttempt(answersRef.current);
  }, [remaining, state, mode]);

  // ---------- beforeunload warning ----------
  useEffect(() => {
    if (state !== 'attempt') return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state]);

  // ---------- Persist session setiap ada perubahan ----------
  useEffect(() => {
    if (state !== 'attempt' || !paket) return;
    saveSession({
      state: 'attempt',
      paket,
      mode,
      answers,
      currentIndex,
      startedAt,
      timeLimit,
    });
  }, [answers, currentIndex, state]);

  // ---------- Handlers ----------
  const handleLoaded = (p) => {
    setPaket(p);
    setState('briefing');
    setPendingResume(null);
    clearSession();
  };

  const handleStart = (chosenMode) => {
    setMode(chosenMode);
    setAnswers({});
    setCurrentIndex(0);
    setStartedAt(Date.now());
    setNow(Date.now());
    setTimeLimit(chosenMode === 'simulasi' ? (paket.durasiMenit || 30) * 60 : 0);
    setTimeUpFlag(false);
    setState('attempt');
  };

  const handleResume = () => {
    const sess = pendingResume?.session;
    if (!sess) return;
    setPaket(sess.paket);
    setMode(sess.mode);
    setAnswers(sess.answers || {});
    setCurrentIndex(sess.currentIndex || 0);
    setStartedAt(sess.startedAt);
    setTimeLimit(sess.timeLimit || 0);
    setNow(Date.now());
    setPendingResume(null);
    setState('attempt');
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

  const handleExit = () => {
    setConfirmExit(true);
  };

  const finishAttempt = (currentAnswers) => {
    const scored = scoreAttempt(paket, currentAnswers);
    const submittedNow = new Date().toISOString();
    const duration = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    setResult(scored);
    setSubmittedAt(submittedNow);
    setState('report');
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
      durationSec: duration,
      submittedAt: submittedNow,
      answers: currentAnswers,
      detail: scored.detail,
      perType: scored.perType,
      paket,
    };
    setHistory(pushHistory(entry));
  };

  const handleSubmit = () => {
    finishAttempt(answers);
  };

  const handleRestart = () => {
    setState('upload');
    setPaket(null);
    setResult(null);
    setAnswers({});
    setStartedAt(null);
    setTimeLimit(0);
    setCurrentIndex(0);
    setTimeUpFlag(false);
    setPendingResume(null);
  };

  const handleShare = () => {
    if (!result || !paket) return;
    const text =
      `📝 Hasil Tryout TKA Studio\n` +
      `📚 ${paket.judul} (${paket.mapel})\n` +
      `🎯 Skor: ${result.score}/${result.total} (${result.pct}%)\n` +
      `⏱ ${fmtDuration(startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0)}\n\n` +
      `Dibuat dengan TKA Studio — tkastudio`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleOpenHistoryItem = (h) => {
    // Restore from history
    setPaket(h.paket);
    setAnswers(h.answers || {});
    setMode(h.mode);
    setSubmittedAt(h.submittedAt);
    setResult({
      score: h.score,
      total: h.total,
      pct: h.pct,
      answeredCount: h.detail.filter(d => d.answered).length,
      perType: h.perType,
      detail: h.detail,
    });
    setState('report');
    setShowHistory(false);
  };

  // ---------- Render ----------
  if (state === 'upload') {
    return html`
      <${UploadScreen}
        onLoaded=${handleLoaded}
        navigate=${navigate}
        pendingResume=${pendingResume}
        onResume=${handleResume}
        onDiscardResume=${handleDiscardResume}
        history=${history}
        onViewHistory=${(h) => {
          if (h && h.id) handleOpenHistoryItem(h);
          else setShowHistory(true);
        }}
      />
      ${showHistory && html`
        <${HistoryViewer}
          history=${history}
          onClose=${() => setShowHistory(false)}
          onDelete=${(id) => setHistory(deleteHistoryItem(id))}
          onOpen=${handleOpenHistoryItem}
        />
      `}
    `;
  }

  if (state === 'briefing' && paket) {
    return html`
      <${BriefingScreen}
        paket=${paket}
        onStart=${handleStart}
        onBack=${handleRestart}
      />
    `;
  }

  if (state === 'attempt' && paket) {
    return html`
      <${AttemptScreen}
        paket=${paket}
        mode=${mode}
        answers=${answers}
        currentIndex=${currentIndex}
        remaining=${remaining}
        timeLimit=${timeLimit}
        onAnswer=${handleAnswer}
        onNavigate=${(i) => setCurrentIndex(Math.max(0, Math.min(paket.soal.length - 1, i)))}
        onSubmit=${handleSubmit}
        onExit=${handleExit}
      />
      ${confirmExit && html`
        <${ConfirmModal}
          title="Keluar dari tryout?"
          message="Jawaban Anda tersimpan otomatis. Anda bisa lanjutkan nanti dari halaman Mode Siswa."
          confirmText="Ya, Keluar"
          isDanger=${true}
          onConfirm=${() => {
            setConfirmExit(false);
            navigate('/');
          }}
          onCancel=${() => setConfirmExit(false)}
        />
      `}
    `;
  }

  if (state === 'report' && paket && result) {
    return html`
      <${ScoreReport}
        paket=${paket}
        answers=${answers}
        result=${result}
        durationSec=${startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0}
        timeUp=${timeUpFlag}
        onShare=${handleShare}
        onRestart=${handleRestart}
        onBackToHome=${() => navigate('/')}
        onBackToHistory=${() => { setShowHistory(true); }}
      />
      ${showHistory && html`
        <${HistoryViewer}
          history=${history}
          onClose=${() => setShowHistory(false)}
          onDelete=${(id) => setHistory(deleteHistoryItem(id))}
          onOpen=${handleOpenHistoryItem}
        />
      `}
    `;
  }

  return null;
}