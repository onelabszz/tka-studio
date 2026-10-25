/**
 * TKA Studio — pages/preview.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useMemo, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, ArrowRight, CircleDot, ListChecks, CheckCheck,
  Pencil, Trash2, CopyPlus, X, Check, AlertTriangle, MessageCircle,
  Image as ImageIcon, Printer, Send, Loader2, Copy, Search, Save,
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { loadDraft, saveDraft } from '../stores/studio.js';
import { checkQuality } from '../lib/quality-checks.js';
import { Stepper } from '../components/Stepper.js';
import { publishSoal } from '../lib/pustaka.js';
import { ConfirmModal } from '../components/ConfirmModal.js';

const html = htm.bind(h);

const TIPE_META = {
  pg:   { label: 'PG',   Icon: CircleDot,  cls: 'badge-pg' },
  mcma: { label: 'MCMA', Icon: ListChecks, cls: 'badge-mcma' },
  bs:   { label: 'B/S',  Icon: CheckCheck, cls: 'badge-bs' },
};

function SoalBadge({ tipe }) {
  const meta = TIPE_META[tipe] || TIPE_META.pg;
  return html`
    <span class=${'soal-badge ' + meta.cls}>
      <${meta.Icon} size=${12} strokeWidth=${2} />
      ${meta.label}
    </span>
  `;
}

// =====================================================
// CopyChip — pill salin dengan feedback visual
// =====================================================
function CopyChip({ text, label = 'Salin' }) {
  const [state, setState] = useState('idle'); // 'idle' | 'copied' | 'error'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  return html`
    <button type="button" class=${'copy-chip ' + state} onClick=${handleCopy}>
      ${state === 'copied'
        ? html`<${Check} size=${11} strokeWidth=${2.5} /> Tersalin!`
        : state === 'error'
          ? html`<${X} size=${11} strokeWidth=${2.5} /> Gagal`
          : html`<${Copy} size=${11} /> ${label}`}
    </button>
  `;
}

// =====================================================
// ViewMode — tampilan read-only dengan CopyChip
// =====================================================
function ViewMode({ soal }) {
  return html`
    <div class="soal-body">
      ${soal.img && html`
        <div class="soal-img-badge">
          <div class="soal-img-row">
            <${ImageIcon} size=${14} />
            <span>Butuh gambar: <b>${soal.img}</b></span>
          </div>
          ${soal.img_ref && html`
            <div class="soal-img-ref">
              <span class="soal-img-ref-text">
                <${Search} size=${11} /> Cari: <i>"${soal.img_ref}"</i>
              </span>
              <${CopyChip} text=${soal.img_ref} label="Salin keyword" />
            </div>
          `}
        </div>
      `}
      <div class="soal-question">${soal.q}</div>

      ${soal.tipe === 'bs' && html`
        <div class="bs-table-wrapper">
          <table class="bs-table">
            <thead>
              <tr>
                <th width="40">#</th>
                <th>Pernyataan</th>
                <th width="60" style="text-align: center;">Benar</th>
                <th width="60" style="text-align: center;">Salah</th>
              </tr>
            </thead>
            <tbody>
              ${soal.pernyataan.map(function (p, pi) {
                return html`
                  <tr>
                    <td class="bs-letter">${'ABCDEFG'[pi]}.</td>
                    <td class="bs-text">${p.teks}</td>
                    <td class="bs-radio">
                      <span class=${'radio-circle ' + (p.key === true ? 'active' : '')}></span>
                    </td>
                    <td class="bs-radio">
                      <span class=${'radio-circle ' + (p.key === false ? 'active' : '')}></span>
                    </td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>
      `}

      ${(soal.tipe === 'pg' || soal.tipe === 'mcma') && html`
        <div class="soal-options">
          ${soal.options.map(function (opt, oi) {
            const isCorrect = soal.tipe === 'pg'
              ? soal.key === oi
              : soal.key.indexOf(oi) !== -1;

            if (soal.tipe === 'pg') {
              return html`
                <div class=${'soal-option' + (isCorrect ? ' correct' : '')}>
                  <span class="soal-option-letter">${'ABCD'[oi]}</span>
                  <span class="soal-option-text">${opt}</span>
                  ${isCorrect && html`<${Check} size=${14} class="soal-option-check" />`}
                </div>
              `;
            } else {
              return html`
                <div class=${'soal-option' + (isCorrect ? ' correct' : '')}>
                  <span class=${'option-indicator checkbox' + (isCorrect ? ' active' : '')}>
                    ${isCorrect && html`<${Check} size=${14} strokeWidth=${3} />`}
                  </span>
                  <span class="soal-option-text">${opt}</span>
                </div>
              `;
            }
          })}
        </div>
      `}

      ${soal.pembahasan && html`
        <div class="soal-explanation">
          <${MessageCircle} size=${13} />
          <span>${soal.pembahasan}</span>
        </div>
      `}
    </div>
  `;
}

// =====================================================
// SoalEditModal — edit soal dalam modal
// =====================================================
function SoalEditModal({ soal, index, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(soal)));
  const [confirmClose, setConfirmClose] = useState(false);

  const setField = (patch) => setDraft(d => ({ ...d, ...patch }));

  const handleOptionChange = (idx, val) => {
    const opts = draft.options.slice();
    opts[idx] = val;
    setField({ options: opts });
  };

  const handlePGCorrect = (idx) => setField({ key: idx });

  const handleMCMAToggle = (idx) => {
    const set = new Set(draft.key || []);
    if (set.has(idx)) set.delete(idx); else set.add(idx);
    const keys = Array.from(set).sort((a, b) => a - b);
    setField({ key: keys });
  };

  const handleBSPernyataan = (idx, patch) => {
    const list = draft.pernyataan.map((p, i) => (i !== idx ? p : { ...p, ...patch }));
    setField({ pernyataan: list });
  };

  // Validasi
  let canSave = false;
  if (draft.q && draft.q.trim()) {
    if (draft.tipe === 'pg' || draft.tipe === 'mcma') {
      if (draft.options && draft.options.length >= 2) {
        const hasEmpty = draft.options.some(o => !String(o).trim());
        if (!hasEmpty) {
          if (draft.tipe === 'pg') {
            if (Number.isInteger(draft.key) && draft.key >= 0 && draft.key < draft.options.length) canSave = true;
          } else {
            if (Array.isArray(draft.key) && draft.key.length >= 2) canSave = true;
          }
        }
      }
    } else if (draft.tipe === 'bs') {
      if (draft.pernyataan && draft.pernyataan.length >= 2) {
        const noEmpty = draft.pernyataan.every(p => String(p.teks || '').trim());
        if (noEmpty) canSave = true;
      }
    }
  }

  // Detect unsaved changes
  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(soal),
    [draft, soal]
  );

  const requestClose = () => {
    if (hasChanges) setConfirmClose(true);
    else onCancel();
  };

  const confirmDiscard = () => {
    setConfirmClose(false);
    onCancel();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) requestClose();
  };

  return html`
    <div class="modal-backdrop soal-edit-backdrop" onClick=${handleBackdropClick}>
      <div class="modal soal-edit-modal" onClick=${(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div class="modal-header">
          <div class="modal-title">
            <${Pencil} size=${18} />
            <span>Edit Soal #${index + 1}</span>
            <${SoalBadge} tipe=${draft.tipe} />
          </div>
          <button class="modal-close" onClick=${requestClose} aria-label="Tutup">
            <${X} size=${18} />
          </button>
        </div>

        <div class="modal-body">
          <div class="edit-mode">
            <div class="form-field">
              <label class="form-label">Pertanyaan</label>
              <textarea
                class="edit-textarea"
                value=${draft.q}
                onInput=${(e) => setField({ q: e.target.value })}
                rows=${3}
                autoFocus
                placeholder="Tulis pertanyaan di sini…"
              />
            </div>

            ${draft.tipe === 'bs' && html`
              <div class="form-field">
                <label class="form-label">Pernyataan (Benar / Salah)</label>
                <div class="edit-bs-list">
                  ${draft.pernyataan.map((p, pi) => html`
                    <div class="edit-bs-row" key=${pi}>
                      <span class="edit-bs-num">${pi + 1}.</span>
                      <input
                        class="edit-input"
                        value=${p.teks}
                        onInput=${(e) => handleBSPernyataan(pi, { teks: e.target.value })}
                        placeholder="Pernyataan ${pi + 1}"
                      />
                      <button
                        type="button"
                        class=${'edit-bs-toggle ' + (p.key ? 'active-true' : '')}
                        onClick=${() => handleBSPernyataan(pi, { key: true })}
                        title="Benar"
                      >B</button>
                      <button
                        type="button"
                        class=${'edit-bs-toggle ' + (!p.key ? 'active-false' : '')}
                        onClick=${() => handleBSPernyataan(pi, { key: false })}
                        title="Salah"
                      >S</button>
                    </div>
                  `)}
                </div>
              </div>
            `}

            ${(draft.tipe === 'pg' || draft.tipe === 'mcma') && html`
              <div class="form-field">
                <label class="form-label">
                  Pilihan Jawaban
                  <span class="form-hint" style="display:inline; margin-left:6px;">
                    ${draft.tipe === 'pg' ? '(klik huruf untuk kunci)' : '(klik huruf untuk pilih minimal 2 kunci)'}
                  </span>
                </label>
                <div class="edit-options">
                  ${draft.options.map((opt, oi) => {
                    const isCorrect = draft.tipe === 'pg'
                      ? draft.key === oi
                      : (draft.key || []).indexOf(oi) !== -1;
                    return html`
                      <div class="edit-option-row" key=${oi}>
                        <button
                          type="button"
                          class=${'edit-option-key ' + (isCorrect ? 'active' : '')}
                          onClick=${() => {
                            if (draft.tipe === 'pg') handlePGCorrect(oi);
                            else handleMCMAToggle(oi);
                          }}
                        >${'ABCD'[oi]}</button>
                        <input
                          class="edit-input"
                          value=${opt}
                          onInput=${(e) => handleOptionChange(oi, e.target.value)}
                          placeholder="Pilihan ${'ABCD'[oi]}"
                        />
                      </div>
                    `;
                  })}
                </div>
              </div>
            `}

            <div class="form-field">
              <label class="form-label">Pembahasan <span class="form-hint" style="display:inline; font-weight:400;">(opsional)</span></label>
              <textarea
                class="edit-textarea"
                value=${draft.pembahasan || ''}
                onInput=${(e) => setField({ pembahasan: e.target.value })}
                placeholder="Penjelasan singkat untuk siswa"
                rows=${2}
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" onClick=${requestClose}>
            <${X} size=${16} /> Batal
          </button>
          <button
            class="btn-primary"
            disabled=${!canSave || !hasChanges}
            onClick=${() => onSave(draft)}
          >
            <${Save} size=${16} /> Simpan Perubahan
          </button>
        </div>

        ${confirmClose && html`
          <div class="soal-edit-confirm">
            <div class="soal-edit-confirm-card">
              <h3>Batalkan perubahan?</h3>
              <p>Perubahan yang belum disimpan akan hilang.</p>
              <div class="soal-edit-confirm-actions">
                <button class="btn-secondary" onClick=${() => setConfirmClose(false)}>Lanjut Edit</button>
                <button class="btn-danger" onClick=${confirmDiscard}>Ya, Batalkan</button>
              </div>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

// =====================================================
// SoalCard — read-only, tombol edit pemicu modal
// =====================================================
function SoalCard({ soal, index, warnings, onEdit, onDelete, onDuplicate, onPublish, isPublishing }) {
  const hasWarning = warnings && warnings.length > 0;

  return html`
    <div class=${'soal-card' + (hasWarning ? ' has-warning' : '')}>
      <div class="soal-header">
        <div class="soal-header-left">
          <span class="soal-number">#${index + 1}</span>
          <${SoalBadge} tipe=${soal.tipe} />
        </div>
        <div class="soal-actions">
          <button class="icon-btn" onClick=${() => onPublish(index, soal)} aria-label="Terbitkan" title="Terbitkan ke Pustaka" disabled=${isPublishing}>
            ${isPublishing ? html`<${Loader2} size=${15} class="spin"/>` : html`<${Send} size=${15} />`}
          </button>
          <button class="icon-btn" onClick=${() => onEdit(index)} aria-label="Edit" title="Edit soal">
            <${Pencil} size=${15} />
          </button>
          <button class="icon-btn" onClick=${() => onDuplicate(index)} aria-label="Duplikat" title="Duplikat soal">
            <${CopyPlus} size=${15} />
          </button>
          <button class="icon-btn icon-danger" onClick=${() => onDelete(index)} aria-label="Hapus" title="Hapus soal">
            <${Trash2} size=${15} />
          </button>
        </div>
      </div>

      ${hasWarning && html`
        <div class="soal-warning">
          <${AlertTriangle} size=${13} />
          <div>${warnings.map((w, wi) => html`<div key=${wi}>${w}</div>`)}</div>
        </div>
      `}

      <${ViewMode} soal=${soal} />
    </div>
  `;
}

// =====================================================
// PreviewPage
// =====================================================
export function PreviewPage({ navigate, profile }) {
  const draft = useMemo(() => loadDraft(), []);
  const [paket, setPaket] = useState(draft && draft.paket ? draft.paket : null);
  const [baseWarnings] = useState(draft && draft.warnings ? draft.warnings : []);
  const [filter, setFilter] = useState('all');
  const [publishingIdx, setPublishingIdx] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const qualityWarnings = useMemo(() => (paket ? checkQuality(paket) : []), [paket]);
  const allWarnings = useMemo(() => baseWarnings.concat(qualityWarnings), [baseWarnings, qualityWarnings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.renderMath) window.renderMath();
    }, 100);
    return () => clearTimeout(timer);
  }, [paket, filter, editingIndex]);

  if (!draft || !paket) {
    return html`
      <div class="page">
        <div class="page-shell">
          <${Stepper} current="preview" />
          <div class="result-card result-warning mt-4">
            <h2>Tidak ada data soal</h2>
            <p>Silakan mulai dari langkah pertama.</p>
            <button class="btn-primary" onClick=${() => navigate('/paste')}>Ke Langkah 2</button>
          </div>
        </div>
      </div>
    `;
  }

  const persist = (updatedPaket) => {
    setPaket(updatedPaket);
    saveDraft({ ...draft, paket: updatedPaket });
  };

  const handleUpdate = (index, updated) => {
    const soal = paket.soal.map((s, i) => (i === index ? { ...updated, id: s.id } : s));
    persist({ ...paket, soal });
  };

  const handleSaveEdit = (updated) => {
    if (editingIndex === null) return;
    handleUpdate(editingIndex, updated);
    setEditingIndex(null);
    if (window.showToast) window.showToast('Soal berhasil diperbarui.', 'success');
  };

  const handleDelete = (index) => {
    if (paket.soal.length <= 1) {
      if (window.showToast) window.showToast('Minimal harus ada 1 soal.', 'info');
      return;
    }
    setConfirmData({
      title: 'Hapus Soal?',
      message: `Soal #${index + 1} akan dihapus dari draft Anda.`,
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: () => {
        setConfirmData(null);
        const soal = paket.soal
          .filter((_, i) => i !== index)
          .map((s, i) => ({ ...s, id: `s${i + 1}` }));
        persist({ ...paket, soal });
      }
    });
  };

  const handleDuplicate = (index) => {
    const src = paket.soal[index];
    const cloned = JSON.parse(JSON.stringify(src));
    const soal = paket.soal
      .slice(0, index + 1)
      .concat([cloned], paket.soal.slice(index + 1))
      .map((s, i) => ({ ...s, id: `s${i + 1}` }));
    persist({ ...paket, soal });
    if (window.showToast) window.showToast('Soal berhasil diduplikasi.', 'success');
  };

  const inferKelas = () => {
    if (paket.kelas) return paket.kelas;
    if (draft && draft.kelas) return draft.kelas;
    const m = String(paket.judul || '').match(/\b(\d{1,2})\s*(SD|SMP|SMA|SMK)\b/i);
    if (m) return `${m[1]} ${m[2].toUpperCase()}`;
    return '-';
  };

  const handlePublish = (index, soal) => {
    if (!profile) {
      if (window.showToast) window.showToast('Silakan login terlebih dahulu untuk menerbitkan soal.', 'info');
      navigate('/login');
      return;
    }
    setConfirmData({
      title: 'Terbitkan ke Pustaka?',
      message: 'Soal ini akan dibagikan ke Pustaka Publik dan bisa diambil oleh guru lain di seluruh Indonesia.',
      confirmText: 'Ya, Terbitkan',
      isDanger: false,
      onConfirm: async () => {
        setConfirmData(null);
        setPublishingIdx(index);
        try {
          await publishSoal(profile, paket, soal, {
            mapel: paket.mapel,
            kelas: inferKelas(),
            topik: paket.judul
          });
          if (window.showToast) window.showToast('Soal berhasil diterbitkan ke Pustaka!', 'success');
        } catch (e) {
          if (window.showToast) window.showToast('Gagal menerbitkan: ' + e.message, 'error');
        }
        setPublishingIdx(null);
      }
    });
  };

  const counts = {
    all: paket.soal.length,
    pg: paket.soal.filter(s => s.tipe === 'pg').length,
    mcma: paket.soal.filter(s => s.tipe === 'mcma').length,
    bs: paket.soal.filter(s => s.tipe === 'bs').length,
  };

  const indexed = paket.soal.map((s, i) => ({ soal: s, index: i }));
  const filtered = filter === 'all' ? indexed : indexed.filter(x => x.soal.tipe === filter);

  const filters = [
    { k: 'all', label: 'Semua', n: counts.all },
    { k: 'pg', label: 'PG', n: counts.pg },
    { k: 'mcma', label: 'MCMA', n: counts.mcma },
    { k: 'bs', label: 'B/S', n: counts.bs },
  ].filter(f => f.k === 'all' || f.n > 0);

  const backLabel = (draft && draft._fromExpert) ? 'Kembali ke Expert' : 'Tempel Hasil';

  return html`
    <div class="page">
      <div class="page-shell page-shell-wide">
        <${Stepper} current="preview" />
        <div class="page-header">
          <button class="btn-back" onClick=${() => {
            if (draft && draft._fromExpert) navigate('/expert/' + draft._fromExpert.id);
            else navigate('/paste');
          }}>
            <${ArrowLeft} size=${16} /> ${backLabel}
          </button>
          <h1 class="page-title">Preview Soal</h1>
          <p class="page-subtitle">${paket.soal.length} soal · ${paket.mapel} · ${paket.judul}</p>
        </div>

        ${allWarnings.length > 0 && html`
          <div class="result-card result-warning no-print">
            <div class="result-header">
              <${AlertTriangle} size=${18} color="var(--warning)" />
              <h2>${allWarnings.length} peringatan kualitas</h2>
            </div>
            <ul class="error-list" style="color: var(--warning);">
              ${allWarnings.slice(0, 5).map((w, i) => html`<li key=${i}>${w.message}</li>`)}
              ${allWarnings.length > 5 && html`<li>... dan ${allWarnings.length - 5} lainnya</li>`}
            </ul>
          </div>
        `}

        <div class="filter-bar no-print">
          <div class="filter-chips">
            ${filters.map(f => html`
              <button class=${'filter-chip' + (filter === f.k ? ' active' : '')} onClick=${() => setFilter(f.k)}>
                ${f.label} <span class="filter-count">${f.n}</span>
              </button>
            `)}
          </div>
          <button class="btn-secondary btn-sm print-btn" onClick=${() => window.print()}>
            <${Printer} size=${14} /> Cetak
          </button>
        </div>

        <div class="soal-list">
          ${filtered.length === 0 && html`
            <div class="empty-state">
              <${ListChecks} size=${32} strokeWidth=${1.5} />
              <p>Tidak ada soal dengan tipe ${filter === 'pg' ? 'PG' : filter === 'mcma' ? 'MCMA' : 'B/S'}.</p>
              <button class="btn-secondary" onClick=${() => setFilter('all')}>Tampilkan Semua</button>
            </div>
          `}
          ${filtered.map(item => {
            const warnMessages = allWarnings
              .filter(w => w.index === item.index)
              .map(w => w.message);
            return html`
              <${SoalCard}
                key=${item.soal.id}
                soal=${item.soal}
                index=${item.index}
                warnings=${warnMessages}
                onEdit=${setEditingIndex}
                onDelete=${handleDelete}
                onDuplicate=${handleDuplicate}
                onPublish=${handlePublish}
                isPublishing=${publishingIdx === item.index}
              />
            `;
          })}
        </div>

        <div class="form-actions sticky-bottom no-print">
          <button class="btn-primary btn-large" onClick=${() => navigate('/export')}>
            Lanjut ke Ekspor <${ArrowRight} size=${18} />
          </button>
        </div>
      </div>

      ${editingIndex !== null && paket.soal[editingIndex] && html`
        <${SoalEditModal}
          soal=${paket.soal[editingIndex]}
          index=${editingIndex}
          onSave=${handleSaveEdit}
          onCancel=${() => setEditingIndex(null)}
        />
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
