/**
 * TKA Studio — components/ScoreReport.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  Check, X, Trophy, Share2, RotateCcw, History, Home,
  Timer, CircleDot, ListChecks, CheckCheck, MessageCircle,
  CheckCircle2, XCircle, Circle, User
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { QuestionRunner } from './QuestionRunner.js';

const html = htm.bind(h);

const TIPE_LABEL = { pg: 'PG', mcma: 'MCMA', bs: 'B/S' };
const TIPE_ICON = { pg: CircleDot, mcma: ListChecks, bs: CheckCheck };

function fmtDuration(sec) {
  if (!sec || sec < 0) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '-'; }
}

// =====================================================
// DONE view
// =====================================================
export function DoneView({
  paket, result, durationSec, timeUp, studentName, studentClass,
  onReview, onFinish,
}) {
  const grade = result.pct >= 85 ? 'Luar biasa!'
    : result.pct >= 70 ? 'Bagus!'
    : result.pct >= 50 ? 'Cukup baik'
    : 'Perlu latihan lagi';

  return html`
    <div class="player-done-wrap">
      <div class="player-done-card">
        <div class="player-done-icon"><${Check} size=${40} strokeWidth=${3} /></div>
        <h1 class="player-done-title">${timeUp ? 'Waktu Habis' : 'Ujian Selesai'}</h1>
        <p class="player-done-sub">
          ${studentName ? html`<b>${studentName}</b>${studentClass ? ' · ' + studentClass : ''}` : 'Terima kasih sudah mengerjakan'}
        </p>

        <div class="player-done-score">
          <div class="player-done-score-label">Skor Kamu</div>
          <div class="player-done-score-value">${result.score}<small>/${result.total}</small></div>
          <div class="player-done-score-pct">
            <${Trophy} size=${14} /> ${result.pct}% · ${grade}
          </div>
        </div>

        <div class="player-done-stats">
          <div class="player-done-stat">
            <span>Benar</span><b style="color:var(--success)">${result.score}</b>
          </div>
          <div class="player-done-stat">
            <span>Salah</span><b style="color:var(--danger)">${result.answeredCount - result.score}</b>
          </div>
          <div class="player-done-stat">
            <span>Kosong</span><b>${result.total - result.answeredCount}</b>
          </div>
          <div class="player-done-stat">
            <span>Durasi</span><b>${fmtDuration(durationSec)}</b>
          </div>
        </div>

        <div class="player-done-actions">
          <button class="btn-primary btn-large" onClick=${onReview}>
            <${MessageCircle} size=${18} /> Lihat Pembahasan
          </button>
          <button class="btn-secondary w-full" onClick=${onFinish}>
            <${Home} size=${16} /> Selesai
          </button>
        </div>

        <p class="player-done-copyright">© 2026 Ekwan Nugroho · Wonogiri · TKA Studio</p>
      </div>
    </div>
  `;
}

// =====================================================
// REVIEW view (full page)
// =====================================================
export function ReviewView({
  paket, answers, result, studentName, studentClass,
  onClose, onShare, onRestart,
}) {
  const [filter, setFilter] = useState('all');
  const [openIndex, setOpenIndex] = useState(null);

  const toggleOpen = (i) => setOpenIndex(prev => prev === i ? null : i);

  const counts = {
    all: result.total,
    wrong: result.detail.filter(d => d.answered && !d.correct).length,
    empty: result.detail.filter(d => !d.answered).length,
  };
  const correctCount = result.score;

  const filters = [
    { k: 'all', label: 'Semua', n: counts.all },
    { k: 'correct', label: 'Benar', n: correctCount },
    { k: 'wrong', label: 'Salah', n: counts.wrong },
    { k: 'empty', label: 'Kosong', n: counts.empty },
  ].filter(f => f.k === 'all' || f.n > 0);

  const filtered = filter === 'all'
    ? result.detail
    : filter === 'correct'
      ? result.detail.filter(d => d.correct)
      : filter === 'wrong'
        ? result.detail.filter(d => d.answered && !d.correct)
        : result.detail.filter(d => !d.answered);

  return html`
    <div class="player-review-page">
      <header class="player-review-header">
        <button class="btn-secondary" onClick=${onClose}>
          <${X} size=${16} /> Tutup
        </button>
        <h1 class="player-review-title">Pembahasan</h1>
        <button class="btn-secondary" onClick=${onShare} title="Bagikan">
          <${Share2} size=${16} />
        </button>
      </header>

      <div class="player-review-meta">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="author-avatar" style="width:32px; height:32px; font-size:12px;">
            ${studentName ? studentName.charAt(0).toUpperCase() : '?'}
          </span>
          <div>
            <div style="font-weight:800; font-size:13.5px; color:var(--navy-900);">
              ${studentName || 'Siswa'}
            </div>
            <div style="font-size:11.5px; color:var(--text-muted);">
              ${studentClass ? studentClass + ' · ' : ''}${paket.judul} · ${paket.mapel}
            </div>
          </div>
        </div>
        <div class="player-review-score">
          <b>${result.score}</b><small>/${result.total}</small>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-chips">
          ${filters.map(f => html`
            <button
              class=${'filter-chip ' + (filter === f.k ? 'active' : '')}
              onClick=${() => setFilter(f.k)}
              key=${f.k}
            >
              ${f.label} <span class="filter-count">${f.n}</span>
            </button>
          `)}
        </div>
      </div>

      <div class="review-list">
        ${filtered.length === 0 && html`
          <div class="empty-state" style="padding: 32px 16px;">
            <p>Tidak ada soal dalam kategori ini.</p>
          </div>
        `}
        ${filtered.map((d) => {
          const isOpen = openIndex === d.index;
          const cls = d.correct ? 'correct' : d.answered ? 'wrong' : 'empty';
          return html`
            <div class=${'review-item ' + cls} key=${d.soalId}>
              <button
                class="review-item-summary"
                onClick=${() => toggleOpen(d.index)}
                type="button"
              >
                <span class="review-item-icon">
                  ${d.correct
                    ? html`<${Check} size=${14} strokeWidth=${3} />`
                    : d.answered
                      ? html`<${X} size=${14} strokeWidth=${3} />`
                      : html`<${Circle} size=${12} />`}
                </span>
                <span class="review-item-num">#${d.index + 1}</span>
                <span class="review-item-text">${d.q.slice(0, 70)}${d.q.length > 70 ? '…' : ''}</span>
                <span class="review-item-caret">${isOpen ? '▴' : '▾'}</span>
              </button>
              ${isOpen && html`
                <div class="review-item-body">
                  <${QuestionRunner}
                    soal=${{
                      id: d.soalId,
                      tipe: d.tipe,
                      q: d.q,
                      options: d.options,
                      key: d.key,
                      pernyataan: d.pernyataan,
                      pembahasan: d.pembahasan,
                    }}
                    nomor=${d.index + 1}
                    answer=${answers[d.soalId]}
                    onChange=${() => {}}
                    readOnly=${true}
                    showKey=${true}
                  />
                </div>
              `}
            </div>
          `;
        })}
      </div>

      <div class="player-review-actions">
        <button class="btn-primary btn-large" onClick=${onRestart}>
          <${RotateCcw} size=${18} /> Kerjakan Ulang
        </button>
      </div>

      <p class="player-done-copyright">© 2026 Ekwan Nugroho · Wonogiri · TKA Studio</p>
    </div>
  `;
}
