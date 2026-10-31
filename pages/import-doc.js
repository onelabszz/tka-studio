/**
 * TKA Studio — pages/import-doc.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useRef } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, ArrowRight, Upload, FileText, Loader2, Sparkles,
  Copy, Check, AlertTriangle, ExternalLink, Wand2, FileJson,
  ChevronDown, ChevronUp, BookOpen
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { extractTextFromFile } from '../lib/doc-extractor.js';
import { buildDocConversionPrompt } from '../lib/doc-prompt.js';
import { PageHero } from '../components/PageHero.js';

const html = htm.bind(h);

const MAPEL_OPTIONS = ['Umum', 'Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 'PPKn', 'Seni Budaya', 'PJOK', 'Informatika'];
const KELAS_OPTIONS = ['-', '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD', '7 SMP', '8 SMP', '9 SMP', '10 SMA', '11 SMA', '12 SMA'];

async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}

export function ImportDocPage({ navigate }) {
  const [step, setStep] = useState(1); // 1: upload, 2: preview + prompt, 3: cara pakai
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState(null);
  
  const [mapel, setMapel] = useState('Umum');
  const [kelas, setKelas] = useState('-');
  const [judul, setJudul] = useState('Paket dari Dokumen');
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (f) => {
    if (!f) return;
    setFile(f);
    setExtracting(true);
    setError(null);
    try {
      const text = await extractTextFromFile(f);
      if (!text || text.trim().length < 50) {
        throw new Error('Teks yang diekstrak terlalu pendek. Pastikan file PDF/DOCX berisi teks yang bisa dibaca (bukan hasil scan gambar).');
      }
      setExtractedText(text);
      setStep(2);
    } catch (e) {
      setError(e.message);
    }
    setExtracting(false);
  };

  const handleFileInput = (e) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleUpload(f);
  };

  const promptText = buildDocConversionPrompt(extractedText, { mapel, kelas, judul });

  const handleCopyPrompt = async () => {
    const ok = await copyToClipboard(promptText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return html`
    <div class="page">
      <div class="page-shell page-shell-wide">
        <${PageHero}
          icon=${FileText}
          title="Import Dokumen Bank Soal"
          subtitle="Ekstrak teks dari PDF/Word, lalu konversi ke JSON menggunakan AI gratis."
          accent="primary"
          topnav=${html`
            <button class="btn-back" onClick=${() => navigate('/paste')}>
              <${ArrowLeft} size=${16} /> Kembali ke Paste
            </button>
          `}
        />

        <!-- STEP 1: UPLOAD -->
        ${step === 1 && html`
          <div class="form-section">
            <div class="form-section-header">
              <${Upload} size=${18} strokeWidth=${2} />
              <h2>Langkah 1: Upload Dokumen</h2>
            </div>
            <div class="form-section-body">
              <div
                class="upload-dropzone"
                onClick=${() => fileRef.current?.click()}
                onDragOver=${(e) => e.preventDefault()}
                onDrop=${handleDrop}
                style="padding: 60px 24px;"
              >
                ${extracting ? html`
                  <div class="upload-dropzone-icon" style="background: var(--primary-light); color: var(--primary);">
                    <${Loader2} size=${28} class="spin" />
                  </div>
                  <h3>Mengekstrak teks dari dokumen...</h3>
                  <p>Proses ini berjalan di browser Anda, tidak ada file yang diunggah ke server.</p>
                ` : html`
                  <div class="upload-dropzone-icon"><${FileText} size=${28} /></div>
                  <h3>Pilih Dokumen PDF, DOCX, atau TXT</h3>
                  <p>Klik atau drag & drop file. Maks 20 MB.</p>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    ref=${fileRef}
                    onChange=${handleFileInput}
                    style="display:none;"
                  />
                `}
              </div>

              ${error && html`
                <div class="result-card result-error" style="margin-top: 16px;">
                  <div class="result-header">
                    <${AlertTriangle} size=${18} color="var(--danger)" />
                    <h2>Gagal Ekstrak Teks</h2>
                  </div>
                  <p class="text-muted text-sm" style="margin: 0;">${error}</p>
                </div>
              `}

              <div class="result-card result-warning" style="margin-top: 16px; padding: 14px 16px;">
                <div style="display: flex; gap: 10px; font-size: 12.5px; color: #92400e; line-height: 1.5;">
                  <${AlertTriangle} size=${16} style="flex-shrink: 0; margin-top: 1px;" />
                  <div>
                    <b>Catatan Penting:</b> Ekstraksi teks bekerja pada file PDF/DOCX yang berisi <b>teks asli</b> (bukan hasil scan gambar). 
                    Jika hasil ekstraksi kosong atau berantakan, simpan ulang dokumen Anda sebagai PDF (bukan gambar) atau ketik ulang soalnya.
                  </div>
                </div>
              </div>
            </div>
          </div>
        `}

        <!-- STEP 2: PREVIEW + PROMPT -->
        ${step === 2 && html`
          <!-- File Info -->
          <div class="result-card result-success mb-4" style="padding: 14px 16px;">
            <div style="display: flex; align-items: center; gap: 10px; font-size: 13px;">
              <${Check} size=${16} color="var(--success)" />
              <span>Berhasil ekstrak <b>${file?.name}</b> (${extractedText.length.toLocaleString()} karakter).</span>
              <button class="btn-back" onClick=${() => { setStep(1); setFile(null); setExtractedText(''); }} style="margin-left: auto; font-size: 12px;">
                Ganti File
              </button>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Judul Paket</label>
              <input class="form-input" value=${judul} onInput=${(e) => setJudul(e.target.value)} />
            </div>
            <div class="form-field">
              <label class="form-label">Mata Pelajaran</label>
              <select class="form-select" value=${mapel} onChange=${(e) => setMapel(e.target.value)}>
                ${MAPEL_OPTIONS.map(m => html`<option value=${m}>${m}</option>`)}
              </select>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">Kelas</label>
            <select class="form-select" value=${kelas} onChange=${(e) => setKelas(e.target.value)}>
              ${KELAS_OPTIONS.map(k => html`<option value=${k}>${k}</option>`)}
            </select>
          </div>

          <!-- Preview Text -->
          <div class="form-section" style="margin-top: 16px;">
            <div class="form-section-header">
              <${BookOpen} size=${18} strokeWidth=${2} />
              <h2>Pratinjau Teks (Bisa Diedit)</h2>
            </div>
            <div class="form-section-body">
              <textarea
                class="paste-textarea"
                value=${extractedText}
                onInput=${(e) => setExtractedText(e.target.value)}
                style="min-height: 300px; font-size: 13px;"
              />
            </div>
          </div>

          <!-- Prompt Card -->
          <div class="form-section" style="border: 2px solid var(--primary-mid);">
            <div class="form-section-header">
              <${Sparkles} size=${18} strokeWidth=${2} />
              <h2>Langkah 2: Salin Prompt ke AI</h2>
            </div>
            <div class="form-section-body">
              <p class="text-muted text-sm" style="margin: 0 0 16px;">
                Prompt di bawah sudah berisi <b>teks dokumen Anda</b> + <b>format JSON TKA v1.1</b>. Paste ke ChatGPT/Gemini/Claude.
              </p>
              
              <div class="ai-links" style="margin-bottom: 12px;">
                <a href="https://chat.openai.com" target="_blank" class="ai-link">ChatGPT <${ExternalLink} size=${12} /></a>
                <a href="https://gemini.google.com" target="_blank" class="ai-link">Gemini <${ExternalLink} size=${12} /></a>
                <a href="https://claude.ai" target="_blank" class="ai-link">Claude <${ExternalLink} size=${12} /></a>
              </div>

              <button 
                class="btn-primary btn-large" 
                onClick=${handleCopyPrompt}
                style="background: ${copied ? 'var(--success)' : 'var(--primary)'};"
              >
                ${copied ? html`<${Check} size=${18} /> Prompt Tersalin!` : html`<${Copy} size=${18} /> Salin Prompt untuk AI`}
              </button>

              <div class="accordion" style="margin-top: 16px;">
                <button class="accordion-toggle" onClick=${() => setShowPrompt(!showPrompt)}>
                  ${showPrompt ? html`<${ChevronUp} size=${16} />` : html`<${ChevronDown} size=${16} />`} 
                  Lihat prompt lengkap (${promptText.length.toLocaleString()} karakter)
                </button>
                ${showPrompt && html`<textarea class="prompt-textarea" readonly value=${promptText} style="min-height: 200px;" />`}
              </div>
            </div>
          </div>

          <!-- Step 3: Guide -->
          <div class="form-section">
            <div class="form-section-header">
              <${ArrowRight} size=${18} strokeWidth=${2} />
              <h2>Langkah 3: Setelah AI Selesai</h2>
            </div>
            <div class="form-section-body">
              <ol class="steps-list">
                <li><div class="step-line"><span class="step-num">1</span><div>Buka AI, paste prompt yang sudah Anda salin.</div></div></li>
                <li><div class="step-line"><span class="step-num">2</span><div>Tunggu AI selesai (30-90 detik), lalu <b>copy seluruh hasil JSON</b>.</div></div></li>
                <li><div class="step-line"><span class="step-num">3</span><div>Buka halaman <b>Tempel Hasil</b>, lalu paste JSON tersebut.</div></div></li>
                <li><div class="step-line"><span class="step-num">4</span><div>TKA Studio akan otomatis memvalidasi dan menampilkan preview.</div></div></li>
              </ol>

              <button class="btn-primary btn-large" onClick=${() => navigate('/paste')} style="margin-top: 16px;">
                <${FileJson} size=${18} /> Ke Halaman Tempel Hasil <${ArrowRight} size=${18} />
              </button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}
