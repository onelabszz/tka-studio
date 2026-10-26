/**
 * TKA Studio — pages/image-tool.js
 * © 2026 Ekwan Nugroho — Wonogiri
 *
 * Tool untuk embed gambar ke JSON (base64).
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useRef } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, Upload, Image as ImageIcon, FileJson, Download,
  Check, X, AlertTriangle, Loader2, Zap, Copy, Info, Trash2
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { smartParse } from '../lib/parser/index.js';
import { normalizePaket } from '../lib/tka-schema.js';
import { compressImage, formatBytes } from '../lib/image-compress.js';

const html = htm.bind(h);

function fmtSize(bytes) {
  if (!bytes) return '0';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Gagal baca ' + file.name));
    reader.readAsDataURL(file);
  });
}

async function readFileAsText(file) {
  return await file.text();
}

export function ImageToolPage({ navigate }) {
  const [paket, setPaket] = useState(null);
  const [paketFile, setPaketFile] = useState(null);
  const [images, setImages] = useState([]); // { name, base64, size, preview }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloaded, setDownloaded] = useState(false);

  const jsonInputRef = useRef(null);
  const imgInputRef = useRef(null);

  // ---------- Detect matches ----------
  const analyze = () => {
    if (!paket) return { matches: [], stats: { needed: 0, matched: 0, missing: 0, already: 0 } };

    const matches = paket.soal.map((s, index) => {
      if (!s.img || !String(s.img).trim()) return null;

      const imgField = String(s.img).trim();
      if (imgField.startsWith('data:image/')) {
        return { index, soal: s, status: 'already', imageName: '(base64 sudah ada)' };
      }

      const found = images.find(im =>
        im.name.toLowerCase() === imgField.toLowerCase()
        || im.name.toLowerCase() === imgField.toLowerCase().replace(/\.[^.]+$/, '')
        || imgField.toLowerCase().endsWith(im.name.toLowerCase())
      );

      return {
        index, soal: s, status: found ? 'matched' : 'missing',
        imageName: imgField, image: found,
      };
    }).filter(Boolean);

    const stats = {
      needed: matches.length,
      matched: matches.filter(m => m.status === 'matched').length,
      missing: matches.filter(m => m.status === 'missing').length,
      already: matches.filter(m => m.status === 'already').length,
    };
    return { matches, stats };
  };

  const { matches, stats } = analyze();

  // ---------- Total size estimate ----------
  const originalJsonSize = paket ? new Blob([JSON.stringify(paket)]).size : 0;
  const addedSize = matches
    .filter(m => m.status === 'matched' && m.image)
    .reduce((sum, m) => sum + (m.image.base64.length - m.imageName.length), 0);
  const estimatedFinalSize = originalJsonSize + addedSize;
  const sizeWarning = estimatedFinalSize > 2 * 1024 * 1024;

  // ---------- Handlers ----------
  const handleJsonUpload = async (file) => {
    setError(null);
    setLoading(true);
    try {
      const text = await readFileAsText(file);
      const parsed = smartParse(text);
      if (!parsed.ok) throw new Error('Format JSON tidak dikenali: ' + parsed.error);
      const { paket: normalized, errors } = normalizePaket(parsed.raw);
      if (!normalized) throw new Error(errors[0]?.message || 'Soal tidak valid');
      setPaket(normalized);
      setPaketFile(file.name);
    } catch (e) {
      setError(String(e.message || e));
    }
    setLoading(false);
  };

  const handleImagesUpload = async (files) => {
    setError(null);
    setLoading(true);
    try {
      const newImages = [...images];
      let totalOriginal = 0;
      let totalCompressed = 0;

      for (const f of files) {
        if (!f.type || !f.type.startsWith('image/')) continue;
        if (newImages.some(im => im.name === f.name)) continue;

        // Skip compression for tiny files (< 100KB) & SVG/GIF
        const skip = f.size < 100 * 1024
          || f.type === 'image/svg+xml'
          || f.type === 'image/gif';

        let base64, size, compressed, info = null;

        if (skip) {
          base64 = await readFileAsDataURL(f);
          size = base64.length;
          compressed = false;
        } else {
          info = await compressImage(f, { maxWidth: 1600, maxHeight: 1600, quality: 0.85, maxSizeKb: 500 });
          base64 = info.dataUrl;
          size = info.compressedSize;
          compressed = !info.skipped;
          if (compressed) {
            totalOriginal += info.originalSize;
            totalCompressed += info.compressedSize;
          }
        }

        newImages.push({
          name: f.name,
          base64,
          size,
          preview: base64,
          compressed,
          originalSize: f.size,
          compressInfo: info,
        });
      }

      setImages(newImages);

      // Show total savings
      if (totalOriginal > 0 && totalCompressed > 0 && window.showToast) {
        const saved = totalOriginal - totalCompressed;
        const pct = Math.round((saved / totalOriginal) * 100);
        window.showToast(
          `Gambar dikompres: hemat ${formatBytes(saved)} (${pct}%)`,
          'success'
        );
      }
    } catch (e) {
      setError(String(e.message || e));
    }
    setLoading(false);
  };

  const removeImage = (name) => {
    setImages(prev => prev.filter(im => im.name !== name));
  };

  const clearAll = () => {
    setPaket(null);
    setPaketFile(null);
    setImages([]);
    setError(null);
    setDownloaded(false);
  };

  const handleInject = () => {
    if (!paket) return;
    setLoading(true);
    try {
      const cloned = JSON.parse(JSON.stringify(paket));
      let injected = 0;

      cloned.soal = cloned.soal.map(s => {
        if (!s.img || String(s.img).trim().startsWith('data:image/')) return s;
        const imgField = String(s.img).trim();
        const found = images.find(im =>
          im.name.toLowerCase() === imgField.toLowerCase()
          || im.name.toLowerCase() === imgField.toLowerCase().replace(/\.[^.]+$/, '')
          || imgField.toLowerCase().endsWith(im.name.toLowerCase())
        );
        if (found) {
          injected++;
          return { ...s, img: found.base64 };
        }
        return s;
      });

      // Download
      const blob = new Blob([JSON.stringify(cloned, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (paket.id || 'paket') + '-dengan-gambar.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      if (window.showToast) window.showToast(`${injected} gambar berhasil di-embed ke JSON!`, 'success');
    } catch (e) {
      setError(String(e.message || e));
      if (window.showToast) window.showToast('Gagal inject: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const copyBase64 = async (b64) => {
    try {
      await navigator.clipboard.writeText(b64);
      if (window.showToast) window.showToast('Base64 disalin', 'success');
    } catch {
      if (window.showToast) window.showToast('Gagal menyalin', 'error');
    }
  };

  return html`
    <div class="page">
      <div class="page-shell">

        <${PageHero}
          icon=${ImageIcon}
          title="Embed Gambar ke JSON"
          subtitle="Convert gambar jadi base64 dan masukkan otomatis ke soal yang cocok."
          chips=${paket ? [
            { icon: FileJson, text: paketFile },
            { icon: ImageIcon, text: `${images.length} gambar` },
            { icon: Check, text: `${stats.matched} cocok` }
          ] : null}
          topnav=${html`
            <button class="btn-back" onClick=${() => navigate('/')}>
              <${ArrowLeft} size=${16} /> Beranda
            </button>
          `}
        />

        <!-- Step 1: Upload JSON -->
        <div class="form-section">
          <div class="form-section-header">
            <${FileJson} size=${18} strokeWidth=${2} />
            <h2>1. Upload File JSON</h2>
            ${paket && html`
              <button class="btn-back" style="margin-left:auto; font-size:12px; color:var(--danger);" onClick=${clearAll}>
                <${Trash2} size=${12} /> Reset
              </button>
            `}
          </div>
          <div class="form-section-body">
            ${!paket ? html`
              <div
                class="upload-dropzone"
                onClick=${() => jsonInputRef.current?.click()}
              >
                <div class="upload-dropzone-icon"><${FileJson} size=${24} /></div>
                <h3>Pilih file .json</h3>
                <p>File paket soal dari TKA Studio</p>
                <input
                  type="file"
                  accept=".json,.txt"
                  ref=${jsonInputRef}
                  onChange=${(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleJsonUpload(f);
                    e.target.value = '';
                  }}
                  style="display:none;"
                />
              </div>
            ` : html`
              <div class="imgtool-file-info">
                <div class="imgtool-file-icon"><${FileJson} size=${18} /></div>
                <div style="flex:1; min-width:0;">
                  <div class="imgtool-file-name">${paketFile}</div>
                  <div class="imgtool-file-meta">
                    ${paket.soal.length} soal · ${paket.mapel} · ${stats.needed} soal butuh gambar
                  </div>
                </div>
              </div>
            `}
          </div>
        </div>

        <!-- Step 2: Upload Images -->
        ${paket && html`
          <div class="form-section">
            <div class="form-section-header">
              <${ImageIcon} size=${18} strokeWidth=${2} />
              <h2>2. Upload Gambar</h2>
              <span class="section-badge">${images.length} file</span>
            </div>
            <div class="form-section-body">

              <div
                class="upload-dropzone"
                onClick=${() => imgInputRef.current?.click()}
              >
                <div class="upload-dropzone-icon"><${Upload} size=${24} /></div>
                <h3>Pilih gambar (.jpg, .png, .webp)</h3>
                <p>Nama file harus <b>sama persis</b> dengan field <code>img</code> di JSON</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref=${imgInputRef}
                  onChange=${(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) handleImagesUpload(files);
                    e.target.value = '';
                  }}
                  style="display:none;"
                />
              </div>

              ${images.length > 0 && html`
                <div class="imgtool-image-grid">
                  ${images.map(im => html`
                    <div class="imgtool-image-card" key=${im.name}>
                      <div class="imgtool-image-preview">
                        <img src=${im.preview} alt=${im.name} loading="lazy" />
                      </div>
                      <div class="imgtool-image-info">
                        <div class="imgtool-image-name" title=${im.name}>${im.name}</div>
                        <div class="imgtool-image-size">
                          ${fmtSize(im.size)}
                          ${im.compressed && im.compressInfo && html`
                            <span class="imgtool-save-badge">-${im.compressInfo.savedPct}%</span>
                          `}
                        </div>
                      </div>
                      <div class="imgtool-image-actions">
                        <button class="icon-btn" onClick=${() => copyBase64(im.base64)} title="Copy base64">
                          <${Copy} size=${13} />
                        </button>
                        <button class="icon-btn icon-danger" onClick=${() => removeImage(im.name)} title="Hapus">
                          <${X} size=${13} />
                        </button>
                      </div>
                    </div>
                  `)}
                </div>
              `}

            </div>
          </div>
        `}

        <!-- Step 3: Preview Matches -->
        ${paket && stats.needed > 0 && html`
          <div class="form-section">
            <div class="form-section-header">
              <${Zap} size=${18} strokeWidth=${2} />
              <h2>3. Cek Kecocokan</h2>
              <span class="section-badge">
                ${stats.matched} / ${stats.needed} cocok
              </span>
            </div>
            <div class="form-section-body">

              <div class="imgtool-stats">
                <div class="imgtool-stat is-success">
                  <div class="imgtool-stat-value">${stats.matched}</div>
                  <div class="imgtool-stat-label">Cocok</div>
                </div>
                <div class="imgtool-stat is-warning">
                  <div class="imgtool-stat-value">${stats.missing}</div>
                  <div class="imgtool-stat-label">Hilang</div>
                </div>
                <div class="imgtool-stat is-neutral">
                  <div class="imgtool-stat-value">${stats.already}</div>
                  <div class="imgtool-stat-label">Sudah base64</div>
                </div>
              </div>

              <div class="imgtool-match-list">
                ${matches.map(m => html`
                  <div class=${'imgtool-match-item is-' + m.status} key=${m.soal.id}>
                    <div class="imgtool-match-icon">
                      ${m.status === 'matched' && html`<${Check} size=${14} strokeWidth=${3} />`}
                      ${m.status === 'missing' && html`<${AlertTriangle} size=${14} />`}
                      ${m.status === 'already' && html`<${Check} size=${14} strokeWidth=${3} />`}
                    </div>
                    <div class="imgtool-match-body">
                      <div class="imgtool-match-title">
                        Soal #${m.index + 1} <span class="imgtool-match-type">${m.soal.tipe.toUpperCase()}</span>
                      </div>
                      <div class="imgtool-match-desc">
                        ${m.status === 'matched' && html`<b>${m.imageName}</b> → ${m.image.name}`}
                        ${m.status === 'missing' && html`Butuh file: <b>${m.imageName}</b>`}
                        ${m.status === 'already' && html`Sudah punya base64 di JSON`}
                      </div>
                    </div>
                  </div>
                `)}
              </div>

              ${sizeWarning && html`
                <div class="result-card result-warning" style="padding:12px 14px; margin:12px 0 0;">
                  <div style="display:flex; gap:8px; font-size:12.5px; color:#92400e;">
                    <${AlertTriangle} size=${14} style="flex-shrink:0; margin-top:2px;" />
                    <div>
                      <b>JSON final ~${fmtSize(estimatedFinalSize)}.</b> Ukuran ini cukup besar.
                      Pertimbangkan kompres gambar ke WebP (max 50KB) sebelum upload.
                    </div>
                  </div>
                </div>
              `}

            </div>
          </div>
        `}

        ${error && html`
          <div class="result-card result-error">
            <div class="result-header">
              <${AlertTriangle} size=${18} color="var(--danger)" />
              <h2>Error</h2>
            </div>
            <p class="text-muted text-sm">${error}</p>
          </div>
        `}

        <!-- Step 4: Inject & Download -->
        ${paket && stats.matched > 0 && html`
          <div class="form-actions">
            <button
              class="btn-primary btn-large"
              onClick=${handleInject}
              disabled=${loading}
            >
              ${loading
                ? html`<${Loader2} size=${18} class="spin" /> Memproses...`
                : html`<${Download} size=${18} /> Download JSON + Gambar`}
            </button>
            ${downloaded && html`
              <div class="imgtool-success-hint">
                <${Check} size=${12} /> File sudah diunduh. Test di <b>/play</b> sebelum kirim ke siswa.
              </div>
            `}
          </div>
        `}

        ${paket && stats.needed === 0 && html`
          <div class="result-card result-success">
            <div class="result-header">
              <${Check} size=${18} color="var(--success)" />
              <h2>Tidak ada soal bergambar</h2>
            </div>
            <p class="text-muted text-sm">
              Semua soal di JSON ini tidak punya field <code>img</code>.
              Tidak perlu embed gambar.
            </p>
          </div>
        `}

        <!-- Info box -->
        <div class="result-card" style="background: var(--primary-light); border-color: rgba(30, 64, 175, 0.15); padding: 14px 16px;">
          <div style="display:flex; gap:10px; font-size:12.5px; color: var(--primary-dark); line-height:1.55;">
            <${Info} size=${14} style="flex-shrink:0; margin-top:2px;" />
            <div>
              <b>Tips kompres gambar dulu</b> di <a href="https://squoosh.app" target="_blank" style="color:var(--primary); text-decoration:underline;">squoosh.app</a> —
              pilih format <b>WebP</b>, quality 80, lebar max 800px → biasanya < 50KB per gambar.
              10 gambar × 50KB = ~650KB JSON (aman untuk HP).
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
