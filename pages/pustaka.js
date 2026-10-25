import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, Search, Loader2, BookOpen, User, ShoppingCart, Check,
  Eye, X, Download, MessageCircle, SlidersHorizontal, AlertTriangle,
  Filter // <-- IMPORT DITAMBAHKAN DI SINI
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
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mapel, setMapel] = useState('');
  const [kelas, setKelas] = useState('');
  const [tipe, setTipe] = useState('');

  const [cartCount, setCartCount] = useState(0);
  const [added, setAdded] = useState({});
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const kotak = getKotak();
    setCartCount(kotak.length);
    const addedMap = {};
    kotak.forEach(item => { addedMap[item.id] = true; });
    setAdded(addedMap);
  }, []);

  useEffect(() => {
    loadData(true);
  }, [debouncedSearch, mapel, kelas, tipe]);

  useEffect(() => {
    if (previewItem) {
      setTimeout(() => {
        if (window.renderMath) window.renderMath();
      }, 100);
    }
  }, [previewItem]);

  const loadData = async (reset) => {
    if (reset) { setLoading(true); setPage(1); } else { setLoadingMore(true); }
    setError(null);
    try {
      const currentPage = reset ? 1 : page + 1;
      const res = await getPustakaItems({ search: debouncedSearch, mapel, kelas, tipe }, currentPage, LIMIT);
      if (reset) { setItems(res.data); setPage(1); } 
      else { 
        const newItems = res.data.filter(n => !items.some(o => o.id === n.id));
        setItems([...items, ...newItems]); setPage(currentPage); 
      }
      setTotal(res.total);
    } catch (e) {
      console.error(e);
      setError('Gagal memuat data.');
      if (window.showToast) window.showToast('Koneksi terputus. Gagal memuat Pustaka.', 'error');
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleAmbil = async (item) => {
    if (!profile) { navigate('/login'); return; }
    const success = addToKotak(item);
    if (success) {
      setCartCount(getKotak().length);
      setAdded({ ...added, [item.id]: true });
      if (window.showToast) window.showToast('Soal berhasil dimasukkan ke Kotak Saya.', 'success');
      incrementDownload(item.id).catch(console.error);
    } else {
      if (window.showToast) window.showToast('Soal ini sudah ada di Kotak Anda.', 'info');
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
            <h1 class="page-title">Pustaka Soal</h1>
            <p class="page-subtitle">Kumpulan soal berkualitas dari guru Indonesia.</p>
          </div>
          <button class="btn-primary" onClick=${() => navigate('/kotak')} style="display:flex; align-items:center; gap:8px;">
            <${ShoppingCart} size=${18} /> Kotak Saya 
            ${cartCount > 0 && html`<span class="cart-badge-inline">${cartCount}</span>`}
          </button>
        </div>

        <div class="search-filter-wrapper">
          <div class="search-main-box">
            <${Search} size=${20} color="var(--text-muted)" />
            <input type="text" placeholder="Cari topik, soal, atau kata kunci..." value=${searchTerm} onInput=${(e) => setSearchTerm(e.target.value)} />
          </div>
          
          <div class="filter-chips-row">
            <div class="filter-chip-group"><${Filter} size=${14} /> Filter:</div>
            <select class="filter-select" value=${mapel} onChange=${e => setMapel(e.target.value)}>
              <option value="">Semua Mapel</option>
              ${['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris'].map(m => html`<option value=${m}>${m}</option>`)}
            </select>
            <select class="filter-select" value=${kelas} onChange=${e => setKelas(e.target.value)}>
              <option value="">Semua Kelas</option>
              ${['1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD', '7 SMP', '8 SMP', '9 SMP'].map(k => html`<option value=${k}>${k}</option>`)}
            </select>
            <select class="filter-select" value=${tipe} onChange=${e => setTipe(e.target.value)}>
              <option value="">Semua Tipe</option>
              <option value="pg">PG</option>
              <option value="mcma">MCMA</option>
              <option value="bs">B/S</option>
            </select>
            ${(mapel || kelas || tipe) && html`<button class="btn-reset-filter" onClick=${() => { setMapel(''); setKelas(''); setTipe(''); }}>Reset</button>`}
          </div>
        </div>

        ${error && html`
          <div class="empty-state" style="border-color: var(--danger); background: #fef2f2;">
            <${AlertTriangle} size=${32} color="var(--danger)" />
            <p style="color: var(--danger); font-weight: bold;">${error}</p>
            <button class="btn-secondary mt-2" onClick=${() => loadData(true)}>Coba Lagi</button>
          </div>
        `}

        ${loading ? html`<div class="text-center mt-5"><${Loader2} class="spin" size=${32} color="var(--primary)" /></div>` : html`
          ${items.length === 0 && !error && html`
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
          
          ${hasMore && html`
            <div class="text-center mt-4">
              <button class="btn-secondary" onClick=${() => loadData(false)} disabled=${loadingMore}>
                ${loadingMore ? html`<${Loader2} class="spin" size=${16}/> Memuat...` : 'Muat Lebih Banyak'}
              </button>
            </div>
          `}
        `}
      </div>

      ${previewItem && html`
        <div class="modal-backdrop" onClick=${() => setPreviewItem(null)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal-header">
              <div class="modal-title"><${Eye} size=${18} /> Detail Soal</div>
              <button class="modal-close" onClick=${() => setPreviewItem(null)}><${X} size=${18} /></button>
            </div>
            <div class="modal-body">
              <div class="pustaka-preview-meta">
                <span class="badge-pg">${previewItem.mapel}</span>
                ${previewItem.kelas && html`<span class="badge-muted">${previewItem.kelas}</span>`}
                <span class=${'soal-badge badge-' + previewItem.tipe}>${previewItem.tipe.toUpperCase()}</span>
              </div>
              
              <div class="soal-question" style="margin-top: 16px; font-size: 15px;">${previewItem.konten.q}</div>
              
              ${previewItem.tipe !== 'bs' && previewItem.konten.options && html`
                <div class="soal-options" style="margin-top: 12px;">
                  ${previewItem.konten.options.map((opt, oi) => {
                    const isCorrect = previewItem.tipe === 'pg' ? previewItem.konten.key === oi : (previewItem.konten.key || []).includes(oi);
                    if (previewItem.tipe === 'pg') {
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

              ${previewItem.tipe === 'bs' && previewItem.konten.pernyataan && html`
                <div class="bs-table-wrapper" style="margin-top: 12px;">
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
                      ${previewItem.konten.pernyataan.map((p, pi) => html`
                        <tr>
                          <td class="bs-letter">${'ABCDEFG'[pi]}.</td>
                          <td class="bs-text">${p.teks}</td>
                          <td class="bs-radio"><span class=${'radio-circle ' + (p.key === true ? 'active' : '')}></span></td>
                          <td class="bs-radio"><span class=${'radio-circle ' + (p.key === false ? 'active' : '')}></span></td>
                        </tr>
                      `)}
                    </tbody>
                  </table>
                </div>
              `}

              ${previewItem.konten.pembahasan && html`
                <div class="soal-explanation" style="margin-top: 12px;">
                  <${MessageCircle} size=${13} />
                  <span>${previewItem.konten.pembahasan}</span>
                </div>
              `}

              <div class="pustaka-preview-footer">
                <div><${User} size=${13} /> <b>${previewItem.contributor_nama}</b> <span style="opacity: 0.7;">· ${previewItem.contributor_sekolah || 'Indonesia'}</span></div>
                <div><${Download} size=${13} /> ${previewItem.download_count || 0} kali diambil</div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onClick=${() => setPreviewItem(null)}>Tutup</button>
              <button class="btn-primary" onClick=${() => { handleAmbil(previewItem); setPreviewItem(null); }} disabled=${added[previewItem.id]}>
                ${added[previewItem.id] ? html`<${Check} size=${16}/> Sudah di Kotak` : html`<${ShoppingCart} size=${16}/> Ambil ke Kotak`}
              </button>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
