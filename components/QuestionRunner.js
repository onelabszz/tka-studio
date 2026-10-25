/**
 * TKA Studio — components/QuestionRunner.js
 * © 2026 Ekwan Nugroho — Wonogiri
 *
 * Render 1 soal. Bisa interaktif (attempt) atau read-only (review).
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  Check, X, CircleDot, ListChecks, CheckCheck, MessageCircle
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';

const html = htm.bind(h);

const TIPE_META = {
  pg:   { label: 'PG',   Icon: CircleDot,  cls: 'badge-pg' },
  mcma: { label: 'MCMA', Icon: ListChecks, cls: 'badge-mcma' },
  bs:   { label: 'B/S',  Icon: CheckCheck, cls: 'badge-bs' },
};

function Badge({ tipe }) {
  const meta = TIPE_META[tipe] || TIPE_META.pg;
  return html`
    <span class=${'soal-badge ' + meta.cls}>
      <${meta.Icon} size=${12} strokeWidth=${2} />
      ${meta.label}
    </span>
  `;
}

export function QuestionRunner({
  soal,
  nomor,
  answer,
  onChange,
  readOnly = false,
  showKey = false,
}) {
  if (!soal) return null;

  const handlePg = (idx) => {
    if (readOnly) return;
    onChange(soal.id, idx);
  };

  const handleMcma = (idx) => {
    if (readOnly) return;
    const current = Array.isArray(answer) ? answer : [];
    const set = new Set(current);
    if (set.has(idx)) set.delete(idx); else set.add(idx);
    const next = Array.from(set).sort((a, b) => a - b);
    onChange(soal.id, next.length ? next : undefined);
  };

  const handleBs = (pi, val) => {
    if (readOnly) return;
    const current = Array.isArray(answer)
      ? [...answer]
      : new Array(soal.pernyataan.length).fill(null);
    current[pi] = val;
    onChange(soal.id, current);
  };

  return html`
    <div class="qr-wrap">
      <div class="qr-header">
        <span class="qr-number">Soal ${nomor}</span>
        <${Badge} tipe=${soal.tipe} />
      </div>

      <div class="qr-question">${soal.q}</div>

      ${(soal.tipe === 'pg' || soal.tipe === 'mcma') && html`
        <div class="qr-options">
          ${soal.options.map((opt, oi) => {
            const isSelected = soal.tipe === 'pg'
              ? answer === oi
              : Array.isArray(answer) && answer.includes(oi);
            const isKey = showKey && (
              soal.tipe === 'pg' ? soal.key === oi : Array.isArray(soal.key) && soal.key.includes(oi)
            );
            const isWrong = showKey && isSelected && !isKey;

            const cls = [
              'qr-option',
              soal.tipe === 'mcma' ? 'checkbox' : '',
              isSelected ? 'selected' : '',
              isKey ? 'correct' : '',
              isWrong ? 'wrong' : '',
            ].filter(Boolean).join(' ');

            return html`
              <button
                type="button"
                class=${cls}
                onClick=${() => soal.tipe === 'pg' ? handlePg(oi) : handleMcma(oi)}
                disabled=${readOnly}
              >
                <span class="qr-option-key">
                  ${isKey ? html`<${Check} size=${14} strokeWidth=${3} />` : 'ABCD'[oi]}
                </span>
                <span class="qr-option-text">${opt}</span>
                ${isWrong && html`<${X} size=${16} color="var(--danger)" />`}
              </button>
            `;
          })}
        </div>
      `}

      ${soal.tipe === 'bs' && html`
        <div class="qr-bs-list">
          ${soal.pernyataan.map((p, pi) => {
            const userVal = Array.isArray(answer) ? answer[pi] : null;
            const keyVal = p.key;
            const isWrong = showKey && typeof userVal === 'boolean' && userVal !== keyVal;
            const isCorrect = showKey && typeof userVal === 'boolean' && userVal === keyVal;

            const cls = [
              'qr-bs-item',
              isCorrect ? 'correct' : '',
              isWrong ? 'wrong' : '',
            ].filter(Boolean).join(' ');

            return html`
              <div class=${cls}>
                <div class="qr-bs-teks">
                  <b>${pi + 1}.</b> ${p.teks}
                </div>
                <div class="qr-bs-actions">
                  <button
                    type="button"
                    class=${'qr-bs-btn ' + (userVal === true ? 'active-true' : '')}
                    onClick=${() => handleBs(pi, true)}
                    disabled=${readOnly}
                  >Benar</button>
                  <button
                    type="button"
                    class=${'qr-bs-btn ' + (userVal === false ? 'active-false' : '')}
                    onClick=${() => handleBs(pi, false)}
                    disabled=${readOnly}
                  >Salah</button>
                </div>
                ${showKey && html`
                  <div class="qr-bs-key-info">
                    Kunci: <b>${keyVal ? 'Benar' : 'Salah'}</b>
                    ${typeof userVal === 'boolean' && !isCorrect && html` · Jawaban Anda: <b style="color:var(--danger);">${userVal ? 'Benar' : 'Salah'}</b>`}
                  </div>
                `}
              </div>
            `;
          })}
        </div>
      `}

      ${showKey && soal.pembahasan && html`
        <div class="soal-explanation" style="margin-top: 16px;">
          <${MessageCircle} size=${13} />
          <span>${soal.pembahasan}</span>
        </div>
      `}
    </div>
  `;
}