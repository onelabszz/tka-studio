import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, Search, Loader2, BookOpen, User, ShoppingCart, Check,
  Eye, X, Download, MessageCircle, SlidersHorizontal
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getPustakaItems, addToKotak, getKotak, incrementDownload } from '../lib/pustaka.js';

const html = htm.bind(h);
const LIMIT = 20;

export function PustakaPage({ navigate, profile }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // State Filter
  const [search, setSearch] = useState('');
  const [mapel, setMapel] = useState('');
  const [kelas, setKelas] = useState('');
  const [tipe, setTipe] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const [cartCount, setCartCount] = useState(getKotak().length);
  const [added, setAdded] = useState({});
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    loadData(true);
  }, [search, mapel, kelas, tipe]);

  const loadData = async (reset) => {
    if (reset) { setLoading(true); setPage(1); } else { setLoadingMore(true); }
    try {
      const currentPage = reset ? 1 : page + 1;
      const res = await getPustakaItems({ search, mapel, kelas, tipe }, currentPage, LIMIT);
      
      if (reset) { setItems(res.data); setPage(1); } 
      else { setItems([...items, ...res.data]); setPage(currentPage); }
      setTotal(res.total);
    } catch (e) { console.error(e); }
    setLoading(false);
    setLoadingMore(false);
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

  const truncate = (text, max) => (!text ? '' : (text.length > max ? text.slice(0, max) + '...' : text));
  const hasMore = items.length < total;

  return html`
    <div class="page">
      <div class="page-shell">
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
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

        <div class="search-wrapper mb-3">
          <${Search} size=${16} class="search-icon" />
          <input type="text" class="search-input" placeholder="Cari soal (contoh: pecahan, fotosintesis)..." 
                 value=${search} onInput=${(e) => setSearch(e.target.value)} />
          <button class="search-clear" onClick=${() => setShowFilter(!showFilter)} style="right: 12px; color: ${showFilter ? 'var(--primary)' : 'inherit'};">
            <${SlidersHorizontal} size=${16} />
          </button>
        </div>

        ${showFilter && html`
          <div class="filter-panel mb-4">
            <div class="form-row">
              <div class="form-field">
                <select class="form-select" value=${mapel} onChange=${e => setMapel(e.target.value)}>
                  <option value="">Semua Mapel</option>
                  ${['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris'].map(m => html`<option value=${m}>${m}</option>`)}
                </select>
              </div>
              <div class="form-field">
                <select class="form-select" value=${kelas} onChange=${e => setKelas(e.target.value)}>
                  <option value="">Semua Kelas</option>
                  ${['1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD', '7 SMP', '8 SMP', '9 SMP'].map(k => html`<option value=${k}>${k}</option>`)}
                </select>
              </div>
              <div class="form-field">
                <select class="form-select" value=${tipe} onChange=${e => setTipe(e.target.value)}>
                  <option value="">Semua Tipe</option>
                  <option value="pg">PG (Pilihan Ganda)</option>
                  <option value="mcma">MCMA (Kompleks)</option>
                  <option value="bs">B/S (Benar/Salah)</option>
                </select>
              </div>
            </div>
          </div>
        `}

        ${loading ? html`<div class="text-center mt-4"><${Loader2} class="spin" /></div>` : html`
          ${items.length === 0 && html`
            <div class="empty-state">
              <${BookOpen} size=${32} color="var(--text-subtle)" />
              <p>Tidak ada soal ditemukan. Coba ubah kata kunci atau filter.</p>
            </div>
          `}
          <div class="pustaka-grid">
            ${items.map(item => html`
              <div class="pustaka-card">
                <div class="pustaka-card-header">
                  <span class="badge-pg">${item.mapel}</span>
                  <span class="badge-muted">${item.kelas || '-'}</span>
                  <span class=${'soal-badge badge-' + item.tipe}>${item.tipe.toUpperCase()}</span>
                </div>
                <div class="pustaka-card-body"><div class="pustaka-q">${truncate(item.konten.q, 120)}</div></div>
                <div class="pustaka-card-meta">
                  <div class="pustaka-author"><${User} size=${12} /><span>${item.contributor_nama}</span></div>
                  <div class="pustaka-downloads"><${Download} size=${12} /> ${item.download_count || 0}</div>
                </div>
                <div class="pustaka-card-actions">
                  <button class="btn-secondary btn-sm" onClick=${() => setPreviewItem(item)}><${Eye} size=${14} /> Preview</button>
                  <button class="btn-primary btn-sm" onClick=${() => handleAmbil(item)} disabled=${added[item.id]} style="flex: 1;">
                    ${added[item.id] ? html`<${Check} size=${14}/> Masuk` : html`<${ShoppingCart} size=${14}/> Ambil`}
                  </button>
                </div>
              </div>
            `)}
          </div>
          ${hasMore && html`<div class="text-center mt-4"><button class="btn-secondary" onClick=${() => loadData(false)} disabled=${loadingMore}>Muat Lebih Banyak</button></div>`}
        `}
      </div>
      ${previewItem && html`... (Modal Preview sama seperti sebelumnya, tidak perlu diubah) ...`}
    </div>
  `;
}
