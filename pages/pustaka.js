/**
 * TKA Studio — pages/pustaka.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  ArrowLeft, Search, Loader2, BookOpen, User, ShoppingCart, Check,
  Eye, X, Download, MessageCircle,
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
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(getKotak().length);
  const [added, setAdded] = useState({});
  const [previewItem, setPreviewItem] = useState(null);

  useEffect(() => {
    loadData(true);
  }, [search]);

  const loadData = async (reset) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 1 : page + 1;
      const res = await getPustakaItems({ search }, currentPage, LIMIT);
      
      if (reset) {
        setItems(res.data);
        setPage(1);
      } else {
        setItems([...items, ...res.data]);
        setPage(currentPage);
      }
      setTotal(res.total);
    } catch (e) {
      console.error('Load pustaka error:', e);
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
      await incrementDownload(item.id);
    }
  };

  const truncate = (text, max) => {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '...' : text;
  };

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

        <div class="search-wrapper mb-4">
          <${Search} size=${16} class="search-icon" />
          <input type="text" class="search-input" placeholder="Cari soal (contoh: pecahan, fotosintesis)..." 
                 value=${search} onInput=${(e) => setSearch(e.target.value)} />
        </div>

        ${!loading && items.length > 0 && html`
          <div class="text-muted text-sm mb-3">
            Menampilkan ${items.length} dari ${total} soal
          </div>
        `}

        ${loading ? html`
          <div class="text-center mt-4"><${Loader2} class="spin" /></div>
        ` : html`
          ${items.length === 0 && html`
            <div class="empty-state">
              <${BookOpen} size=${32}/>
              <p>Belum ada soal di Pustaka. Jadilah yang pertama menerbitkan!</p>
              <button class="btn-secondary mt-3" onClick=${() => navigate('/build')}>Buat Soal</button>
            </div>
          `}

          <div class="pustaka-grid">
            ${items.map(item => html`
              <div class="pustaka-card">
                <div class="pustaka-card-header">
                  <span class="badge-pg">${item.mapel}</span>
                  ${item.kelas && html`<span class="badge-muted">${item.kelas}</span>`}
                  <span class=${'soal-badge badge-' + item.tipe}>${item.tipe.toUpperCase()}</span>
                </div>
                
                <div class="pustaka-card-body">
                  <div class="pustaka-q">${truncate(item.konten.q, 120)}</div>
                </div>

                <div class="pustaka-card-meta">
                  <div class="pustaka-author">
                    <${User} size=${12} />
                    <span>${item.contributor_nama || 'Guru'}</span>
                  </div>
                  <div class="pustaka-downloads">
                    <${Download} size=${12} /> ${item.download_count || 0}
                  </div>
                </div>

                <div class="pustaka-card-actions">
                  <button class="btn-secondary btn-sm" onClick=${() => setPreviewItem(item)}>
                    <${Eye} size=${14} /> Preview
                  </button>
                  <button 
                    class="btn-primary btn-sm" 
                    onClick=${() => handleAmbil(item)} 
                    disabled=${added[item.id]}
                    style="flex: 1;"
                  >
                    ${added[item.id] 
                      ? html`<${Check} size=${14}/> Masuk` 
                      : html`<${ShoppingCart} size=${14}/> Ambil`}
                  </button>
                </div>
              </div>
            `)}
          </div>

          ${hasMore && html`
            <div class="text-center mt-4">
              <button class="btn-secondary" onClick=${() => loadData(false)} disabled=${loadingMore}>
                ${loadingMore ? html`<${Loader2} size=${16} class="spin" /> Memuat...` : 'Muat Lebih Banyak'}
              </button>
            </div>
          `}
        `}
      </div>

      ${previewItem && html`
        <div class="modal-backdrop" onClick=${() => setPreviewItem(null)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal-header">
              <div class="modal-title">
                <${Eye} size=${18} /> Detail Soal
              </div>
              <button class="modal-close" onClick=${() => setPreviewItem(null)}>
                <${X} size=${18} />
              </button>
            </div>

            <div class="modal-body">
              <div class="pustaka-preview-meta">
                <span class="badge-pg">${previewItem.mapel}</span>
                ${previewItem.kelas && html`<span class="badge-muted">${previewItem.kelas}</span>`}
                <span class=${'soal-badge badge-' + previewItem.tipe}>${previewItem.tipe.toUpperCase()}</span>
              </div>

              <div class="soal-question" style="margin-top: 16px; font-size: 15px;">
                ${previewItem.konten.q}
              </div>

              ${previewItem.tipe !== 'bs' && previewItem.konten.options && html`
                <div class="soal-options" style="margin-top: 12px;">
                  ${previewItem.konten.options.map((opt, oi) => {
                    const isCorrect = previewItem.tipe === 'pg'
                      ? previewItem.konten.key === oi
                      : (previewItem.konten.key || []).includes(oi);
                    return html`
                      <div class=${'soal-option' + (isCorrect ? ' correct' : '')}>
                        <span class="soal-option-letter">${'ABCD'[oi]}</span>
                        <span class="soal-option-text">${opt}</span>
                        ${isCorrect && html`<${Check} size=${14} class="soal-option-check" />`}
                      </div>
                    `;
                  })}
                </div>
              `}

              ${previewItem.tipe === 'bs' && previewItem.konten.pernyataan && html`
                <div class="soal-bs-list" style="margin-top: 12px;">
                  ${previewItem.konten.pernyataan.map((p, pi) => html`
                    <div class="soal-bs-item">
                      <span class="soal-bs-num">${pi + 1}.</span>
                      <span class="soal-bs-text">${p.teks}</span>
                      <span class=${'soal-bs-key ' + (p.key ? 'key-true' : 'key-false')}>
                        ${p.key ? 'Benar' : 'Salah'}
                      </span>
                    </div>
                  `)}
                </div>
              `}

              ${previewItem.konten.pembahasan && html`
                <div class="soal-explanation" style="margin-top: 12px;">
                  <${MessageCircle} size=${13} />
                  <span>${previewItem.konten.pembahasan}</span>
                </div>
              `}

              <div class="pustaka-preview-footer">
                <div>
                  <${User} size=${13} /> 
                  <b>${previewItem.contributor_nama}</b>
                  <span style="opacity: 0.7;"> · ${previewItem.contributor_sekolah || 'Indonesia'}</span>
                </div>
                <div>
                  <${Download} size=${13} /> ${previewItem.download_count || 0} kali diambil
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" onClick=${() => setPreviewItem(null)}>Tutup</button>
              <button 
                class="btn-primary" 
                onClick=${async () => { await handleAmbil(previewItem); setPreviewItem(null); }}
                disabled=${added[previewItem.id]}
              >
                ${added[previewItem.id] 
                  ? html`<${Check} size=${16}/> Sudah di Kotak` 
                  : html`<${ShoppingCart} size=${16}/> Ambil ke Kotak`}
              </button>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
