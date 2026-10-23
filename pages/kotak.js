import { h } from 'https://esm.sh/preact@10.24.3';
import { useState } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { ArrowLeft, Trash2, Sparkles, FolderOpen } from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getKotak, removeFromKotak, clearKotak } from '../lib/pustaka.js';
import { saveDraft } from '../stores/studio.js';

const html = htm.bind(h);

export function KotakPage({ navigate }) {
  const [items, setItems] = useState(getKotak());

  const handleRemove = (id) => {
    removeFromKotak(id);
    setItems(getKotak());
  };

  const handleClear = () => {
    if (confirm('Kosongkan Kotak Saya?')) {
      clearKotak();
      setItems([]);
    }
  };

  const handleRakit = () => {
    if (items.length === 0) return;
    
    // Ambil mapel terbanyak sebagai default
    const mapelCounts = {};
    items.forEach(i => { mapelCounts[i.mapel] = (mapelCounts[i.mapel] || 0) + 1; });
    const topMapel = Object.keys(mapelCounts).reduce((a, b) => mapelCounts[a] > mapelCounts[b] ? a : b, 'Campuran');

    // Gabungkan soal
    const soalGabungan = items.map((item, idx) => ({ ...item.konten, id: `s${idx + 1}` }));

    const paketBaru = {
      version: '1.0',
      id: 'paket-rakitan-' + Date.now(),
      judul: 'Paket Rakitan Pustaka',
      mapel: topMapel,
      durasiMenit: soalGabungan.length * 2, // Estimasi 2 menit per soal
      acakMode: 'per-tipe',
      latihanMandiri: true,
      soal: soalGabungan
    };

    saveDraft({ paket: paketBaru, warnings: [], originalText: '', savedAt: Date.now() });
    navigate('/preview');
  };

  return html`
    <div class="page">
      <div class="page-shell">
        <div class="page-header">
          <button class="btn-back" onClick=${() => navigate('/pustaka')}><${ArrowLeft} size=${16} /> Pustaka</button>
          <h1 class="page-title">Kotak Saya</h1>
          <p class="page-subtitle">Soal-soal yang sudah Anda ambil dari Pustaka.</p>
        </div>

        <div class="soal-list">
          ${items.length === 0 && html`
            <div class="empty-state">
              <${FolderOpen} size=${32}/>
              <p>Kotak masih kosong. Jelajahi Pustaka dan ambil soal!</p>
              <button class="btn-secondary mt-3" onClick=${() => navigate('/pustaka')}>Ke Pustaka</button>
            </div>
          `}

          ${items.map(item => html`
            <div class="soal-card">
              <div class="soal-header">
                <div class="soal-header-left">
                  <span class="badge-pg">${item.mapel}</span>
                  <span class="soal-badge badge-${item.tipe}">${item.tipe.toUpperCase()}</span>
                </div>
                <button class="icon-btn icon-danger" onClick=${() => handleRemove(item.id)}><${Trash2} size=${16}/></button>
              </div>
              <div class="soal-body" style="padding: 16px;">
                <div class="soal-question" style="font-size: 14px; margin-bottom: 0;">${item.konten.q}</div>
              </div>
            </div>
          `)}
        </div>

        ${items.length > 0 && html`
          <div class="form-actions sticky-bottom" style="flex-direction: row; gap: 12px;">
            <button class="btn-secondary" onClick=${handleClear}>Kosongkan</button>
            <button class="btn-primary" onClick=${handleRakit} style="flex: 1;">
              <${Sparkles} size=${18}/> Susun jadi Paket Soal (${items.length})
            </button>
          </div>
        `}
      </div>
    </div>
  `;
}
