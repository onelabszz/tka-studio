/**
 * TKA Studio — components/ScoreReport.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  Check, X, Circle, Trophy, Share2, RotateCcw, History, Home,
  ChevronDown, Timer, Sparkles, CircleDot, ListChecks, CheckCheck,
  MessageCircle, CheckCircle2, XCircle
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

export function ScoreReport({
  paket,
  answers,
  result,
  durationSec,
  timeUp = false,
  onShare,
  onRestart,
  onBackToHome,
  onBackToHistory,
}) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleOpen = (i) => {
    setOpenIndex(prev => (prev === i ? null : i));
  };

  const statKosong = result.total - result.answeredCount;
  const grade = result.pct >= 85 ? 'Luar biasa!' : result.pct >= 70 ? 'Bagus!' : result.pct >= 50 ? 'Cukup baik' : 'Perlu latihan lagi';

  return html`
    <div class="page">
      <div class="page-shell">

        <div class="score-hero">
          <div class="score-hero-label">${timeUp ? '⏱ Waktu Habis' : 'Skor Akhir'}</div>
          <div class="score-hero-value">${result.score}</div>
          <div class="score-hero-total">dari ${result.total} soal</div>
          <div class="score-hero-pct">
            <${Trophy} size=${14} style="vertical-align:-2px; margin-right:4px;" />
            ${result.pct}% · ${grade}
          </div>
        </div>

        <div class="score-stats">
          <div class="score-stat correct">
            <div class="score-stat-value">${result.score}</div>
            <div class="score-stat-label">Benar</div>
          </div>
          <div class="score-stat wrong">
            <div class="score-stat-value">${result.answeredCount - result.score}</div>
            <div class="score-stat-label">Salah</div>
          </div>
          <div class="score-stat">
            <div class="score-stat-value">${statKosong}</div>
            <div class="score-stat-label">Kosong</div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-header">
            <${Sparkles} size=${18} strokeWidth=${2} />
            <h2>Rincian per Tipe</h2>
          </div>
          <div class="form-section-body">
            ${['pg', 'mcma', 'bs'].map(t => {
              const data = result.perType[t];
              if (!data || data.total === 0) return null;
              const Icon = TIPE_ICON[t];
              const pct = Math.round((data.correct / data.total) * 100);
              return html`
                <div key=${t} class="score-type-row">
                  <div class="score-type-label">
                    <${Icon} size=${14} />
                    ${TIPE_LABEL[t]}
                  </div>
                  <div class="score-type-bar">
                    <div class="score-type-fill" style=${'width:' + pct + '%;'}></div>
                  </div>
                  <div class="score-type-value">
                    ${data.correct}/${data.total}
                  </div>
                </div>
              `;
            })}
          </div>
        </div>

        <div class="meta-strip">
          <span><${Timer} size=${12} /> ${fmtDuration(durationSec)}</span>
          <span>📅 ${fmtDate(new Date().toISOString())}</span>
          <span>📚 ${paket.mapel}</span>
        </div>

        <div class="form-section">
          <div class="form-section-header">
            <${MessageCircle} size=${18} strokeWidth=${2} />
            <h2>Review Jawaban (${result.total} soal)</h2>
          </div>
          <div class="form-section-body">
            <div class="review-list">
              ${result.detail.map((d) => {
                const isOpen = openIndex === d.index;
                const cls = d.correct ? 'correct' : d.answered ? 'wrong' : 'empty';
                return html`
                  <details
                    key=${d.soalId}
                    class=${'review-item ' + cls}
                    open=${isOpen}
                    onClick=${(e) => { e.preventDefault(); toggleOpen(d.index); }}
                  >
                    <summary>
                      <span class="review-item-icon">
                        ${d.correct
                          ? html`<${Check} size=${14} strokeWidth=${3} />`
                          : d.answered
                            ? html`<${X} size=${14} strokeWidth=${3} />`
                            : html`<${Circle} size=${12} />`}
                      </span>
                      <span class="review-item-text">
                        <b>#${d.index + 1}</b> · ${d.q.slice(0, 60)}${d.q.length > 60 ? '…' : ''}
                      </span>
                    </summary>
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
                  </details>
                `;
              })}
            </div>
          </div>
        </div>

        <div class="form-actions" style="display: flex; flex-direction: column; gap: 8px;">
          <button class="btn-primary btn-large" onClick=${onShare}>
            <${Share2} size=${18} /> Bagikan Skor ke WA
          </button>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-secondary" onClick=${onRestart} style="flex: 1;">
              <${RotateCcw} size=${16} /> Kerjakan Ulang
            </button>
            ${onBackToHistory && html`
              <button class="btn-secondary" onClick=${onBackToHistory} style="flex: 1;">
                <${History} size=${16} /> Riwayat
              </button>
            `}
            <button class="btn-secondary" onClick=${onBackToHome} style="flex: 1;">
              <${Home} size=${16} /> Beranda
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}