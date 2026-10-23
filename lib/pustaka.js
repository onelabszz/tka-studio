import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { ArrowLeft, Search, Download, Loader2, BookOpen, User, ShoppingCart, Check } from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getPustakaItems, addToKotak, getKotak, incrementDownload } from '../lib/pustaka.js';

const html = htm.bind(h);

export function PustakaPage({ navigate, profile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(getKotak().length);
  const [added, setAdded] = useState({});

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getPustakaItems({ search });
      setItems(res.data);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleAmbil = async (item) => {
    if (!profile) { navigate('/login'); return; }
    const success = addToKotak(item);
    if (success) {
      setCartCount(getKotak().length);
      setAdded({ ...added, [item.id]: true });
      await incrementDownload(item.id);
    }
  };

  return html`
    <div class="page">
      <div class="page-shell">
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <button class="btn-back" onClick=${() => navigate('/')}><${ArrowLeft} size=${16} /> Beranda</button>
            <h1 class="page-title">Pustaka Soal TKA</h1>
            <p class="page-subtitle">Kumpulan soal berkualitas dari guru-guru Indonesia.</p>
          </div>
          <button class="btn-primary" onClick=${() => navigate('/kotak')} style="position: relative;">
            <${ShoppingCart} size=${18} /> Kotak Saya
            ${cartCount > 0 && html`<span class="cart-badge">${cartCount}</span>`}
          </button>
        </div>

        <div class="search-wrapper mb-4">
          <${Search} size=${16} class="search-icon" />
          <input type="text" class="search-input" placeholder="Cari soal (contoh: pecahan, fotosintesis)..." 
                 value=${search} onInput=${(e) => setSearch(e.target.value)} />
        </div>

        ${loading ? html`<div class="text-center mt-4"><${Loader2} class="spin" /></div>` : html`
          <div class="soal-list">
            ${items.length === 0 && html`<div class="empty-state"><${BookOpen} size=${32}/><p>Tidak ada soal ditemukan.</p></div>`}
            
            ${items.map(item => html`
              <div class="soal-card">
                <div class="soal-header">
                  <div class="soal-header-left">
                    <span class="badge-pg">${item.mapel}</span>
                    <span class="badge-pg" style="background:#f1f5f9; color:#64748b;">${item.kelas}</span>
                    <span class="soal-badge badge-${item.tipe}">${item.tipe.toUpperCase()}</span>
                  </div>
                </div>
                <div class="soal-body" style="padding-bottom: 12px;">
                  <div class="soal-question">${item.konten.q}</div>
                  
                  ${item.tipe !== 'bs' && html`
                    <div class="soal-options" style="margin-bottom: 12px; pointer-events: none;">
                      ${item.konten.options.map((opt, oi) => {
                        const isCorrect = item.tipe === 'pg' ? item.konten.key === oi : item.konten.key.includes(oi);
                        return html`
                          <div class=${'soal-option' + (isCorrect ? ' correct' : '')}>
                            <span class="soal-option-letter">${'ABCD'[oi]}</span>
                            <span class="soal-option-text">${opt}</span>
                          </div>
                        `;
                      })}
                    </div>
                  `}
                  ${item.tipe === 'bs' && html`
                    <div class="soal-bs-list" style="margin-bottom: 12px;">
                      ${item.konten.pernyataan.map((p, pi) => html`
                        <div class="soal-bs-item">
                          <span class="soal-bs-num">${pi + 1}.</span>
                          <span class="soal-bs-text">${p.teks}</span>
                          <span class="soal-bs-key ${p.key ? 'key-true' : 'key-false'}">${p.key ? 'B' : 'S'}</span>
                        </div>
                      `)}
                    </div>
                  `}

                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 12px; margin-top: 12px;">
                    <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                      <${User} size=${14} /> ${item.contributor_nama} <br/> 
                      <span style="opacity:0.6">(${item.contributor_sekolah || 'Indonesia'})</span>
                    </div>
                    <div style="font-size: 12px; color: var(--success); font-weight: bold;">
                      ${item.download_count} kali diambil
                    </div>
                  </div>
                </div>
                <div class="form-actions" style="margin: 0; padding: 12px; background: var(--surface-muted); flex-direction: row; justify-content: flex-end;">
                  <button class="btn-secondary btn-sm" onClick=${() => {
                    localStorage.setItem('tka-studio-draft-v1', JSON.stringify({ paket: { id: 'preview-'+item.id, judul: 'Preview', mapel: item.mapel, durasiMenit: 10, soal: [item.konten] }, warnings: [] }));
                    navigate('/preview');
                  }}>Preview</button>
                  
                  <button class="btn-primary btn-sm" onClick=${() => handleAmbil(item)} disabled=${added[item.id]}>
                    ${added[item.id] ? html`<${Check} size=${14}/> Masuk Kotak` : html`<${ShoppingCart} size=${14}/> Ambil ke Kotak`}
                  </button>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    </div>
  `;
}
