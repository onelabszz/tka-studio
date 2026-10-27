/**
 * TKA Studio — components/QuestionRunner.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  CircleDot, ListChecks, CheckCheck, MessageCircle,
  Image as ImageIcon, Search, Flag, Check, X
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getImage } from '../lib/player-image.js';
import { ImageLightbox } from './ImageLightbox.js';

const html = htm.bind(h);

const TIPE_META = {
  pg:   { label: 'Pilihan Ganda',   Icon: CircleDot,  cls: 'badge-pg' },
  mcma: { label: 'Pilihan Ganda Kompleks', Icon: ListChecks, cls: 'badge-mcma' },
  bs:   { label: 'Benar / Salah',   Icon: CheckCheck, cls: 'badge-bs' },
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

function SoalImage({ soal }) {
  const [zoom, setZoom] = useState(false);
  if (!soal.img && !soal.img_data) return null;

  const src = getImage(soal);
  const caption = soal.img_caption;

  if (src) {
    return html`
      <div class="exam-image-container">
        <img
          src=${src}
          alt=${caption || 'Gambar soal'}
          class="exam-image"
          onClick=${() => setZoom(true)}
          loading="lazy"
        />
        ${caption && html`<div class="exam-image-caption">${caption}</div>`}
        ${zoom && html`<${ImageLightbox} src=${src} alt=${caption} onClose=${() => setZoom(false)} />`}
      </div>
    `;
  }

  return html`
    <div class="exam-image-placeholder">
      <${ImageIcon} size=${24} color="var(--warning)" />
      <div>
        <div style="font-weight:700; color:#92400e;">Gambar: ${soal.img}</div>
        <div style="font-size:12px; color:#b45309;">(Gambar tidak tersedia)</div>
      </div>
    </div>
  `;
}

export function QuestionRunner({
  soal, nomor, answer, onChange, readOnly = false, showKey = false, flagged = false,
}) {
  useEffect(() => {
    if (!soal) return;
    const timer = setTimeout(() => {
      if (window.renderMath) window.renderMath();
    }, 60);
    return () => clearTimeout(timer);
  }, [soal?.id]);

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
    <div class="exam-question-wrapper">
      
      <!-- Header Soal -->
      <div class="exam-q-header">
        <div class="exam-q-number">Soal No. ${nomor}</div>
        <${Badge} tipe=${soal.tipe} />
        ${flagged && html`
          <span class="exam-q-flag"><${Flag} size=${12} /> Ragu-ragu</span>
        `}
      </div>

      <!-- Konten Soal -->
      <div class="exam-q-body">
        <${SoalImage} soal=${soal} />
        <div class="exam-q-text">${soal.q}</div>

        <!-- PG & MCMA -->
        ${(soal.tipe === 'pg' || soal.tipe === 'mcma') && html`
          <div class="exam-options-list">
            ${soal.options.map((opt, oi) => {
              const isSelected = soal.tipe === 'pg' 
                ? answer === oi 
                : Array.isArray(answer) && answer.includes(oi);
                
              const isKey = showKey && (
                soal.tipe === 'pg' ? soal.key === oi : Array.isArray(soal.key) && soal.key.includes(oi)
              );
              const isWrong = showKey && isSelected && !isKey;

              let cls = 'exam-option';
              if (isSelected) cls += ' is-selected';
              if (showKey && isKey) cls += ' is-correct';
              if (isWrong) cls += ' is-wrong';

              return html`
                <label class=${cls} key=${oi}>
                  <input 
                    type=${soal.tipe === 'pg' ? 'radio' : 'checkbox'}
                    name=${'q-' + soal.id}
                    checked=${isSelected}
                    onChange=${() => soal.tipe === 'pg' ? handlePg(oi) : handleMcma(oi)}
                    disabled=${readOnly}
                  />
                  <span class="exam-option-letter">${'ABCD'[oi]}.</span>
                  <span class="exam-option-text">${opt}</span>
                  ${showKey && isKey && html`<${Check} size=${18} class="exam-icon-correct" />`}
                  ${isWrong && html`<${X} size=${18} class="exam-icon-wrong" />`}
                </label>
              `;
            })}
          </div>
        `}

        <!-- B/S Table -->
        ${soal.tipe === 'bs' && html`
          <div class="exam-bs-wrapper">
            <table class="exam-bs-table">
              <thead>
                <tr>
                  <th width="40" style="text-align:center;">No</th>
                  <th>Pernyataan</th>
                  <th width="70" style="text-align:center;">Benar</th>
                  <th width="70" style="text-align:center;">Salah</th>
                </tr>
              </thead>
              <tbody>
                ${soal.pernyataan.map((p, pi) => {
                  const userVal = Array.isArray(answer) ? answer[pi] : null;
                  const keyVal = p.key;
                  const isWrong = showKey && typeof userVal === 'boolean' && userVal !== keyVal;
                  const isCorrect = showKey && typeof userVal === 'boolean' && userVal === keyVal;
                  
                  return html`
                    <tr key=${pi} class=${showKey ? (isCorrect ? 'row-correct' : isWrong ? 'row-wrong' : '') : ''}>
                      <td style="text-align:center; font-weight:600;">${pi + 1}.</td>
                      <td class="exam-bs-text">${p.teks}</td>
                      <td style="text-align:center;">
                        <label class="exam-bs-radio">
                          <input 
                            type="radio" 
                            name=${'bs-' + soal.id + '-' + pi} 
                            checked=${userVal === true}
                            onChange=${() => handleBs(pi, true)}
                            disabled=${readOnly}
                          />
                          <span class="exam-bs-mark"></span>
                        </label>
                      </td>
                      <td style="text-align:center;">
                        <label class="exam-bs-radio">
                          <input 
                            type="radio" 
                            name=${'bs-' + soal.id + '-' + pi} 
                            checked=${userVal === false}
                            onChange=${() => handleBs(pi, false)}
                            disabled=${readOnly}
                          />
                          <span class="exam-bs-mark"></span>
                        </label>
                      </td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
            ${showKey && html`
              <div class="exam-bs-key">
                Kunci: ${soal.pernyataan.map((p, i) => `${i+1}. ${p.key ? 'B' : 'S'}`).join(' | ')}
              </div>
            `}
          </div>
        `}

        <!-- Pembahasan -->
        ${showKey && soal.pembahasan && html`
          <div class="exam-explanation">
            <div class="exam-explanation-title"><${MessageCircle} size=${16} /> Pembahasan</div>
            <div class="exam-explanation-text">${soal.pembahasan}</div>
          </div>
        `}
      </div>
    </div>
  `;
}
