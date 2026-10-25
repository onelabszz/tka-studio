/**
 * TKA Studio — app.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h, render, Component } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  GraduationCap, Sparkles, ArrowRight, FlaskConical, ClipboardPaste,
  FolderOpen, BookOpen, LogIn, LayoutDashboard, CheckCircle2, Image as ImageIcon,
  Check, Clock, Shield, Zap, FileJson, ChevronRight, PlayCircle, Star, Users, HelpCircle
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';

import { runSchemaTests } from './lib/tka-schema.test.js';
import { BuildPage } from './pages/build.js';
import { PastePage } from './pages/paste.js';
import { PreviewPage } from './pages/preview.js';
import { ExportPage } from './pages/export.js';
import { LoginPage, RegisterPage, PendingPage } from './pages/auth.js';
import { BankSoalPage } from './pages/bank-soal.js';
import { PustakaPage } from './pages/pustaka.js';
import { KotakPage } from './pages/kotak.js';
import { ExpertListPage } from './pages/expert-list.js';
import { ExpertNewPage } from './pages/expert-new.js';
import { ExpertDetailPage } from './pages/expert-detail.js';
import { AppShell } from './components/AppShell.js';
import { getSession, getProfile, signOut } from './supabase/auth.js';
import './components/Toast.js';

const html = htm.bind(h);

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const handler = () => setRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}
function navigate(path) { window.location.hash = path; }

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary:', error, info); }
  render() {
    if (this.state.error) {
      return html`
        <div style="padding: 24px; max-width: 720px; margin: 0 auto; font-family: system-ui;">
          <h1 style="color: #DC2626; font-size: 20px;">Terjadi Kesalahan</h1>
          <p style="color: #78716C; font-size: 14px;">Ada bug di aplikasi. Silakan laporkan dengan salinan pesan di bawah.</p>
          <pre style="background: #F5F4F0; padding: 12px; border-radius: 8px; overflow: auto; font-size: 12px; white-space: pre-wrap;">${String(this.state.error?.stack || this.state.error)}</pre>
          <button onClick=${() => window.location.reload()} style="padding: 10px 16px; background: #0F766E; color: white; border: none; border-radius: 8px; cursor: pointer;">Muat Ulang</button>
        </div>
      `;
    }
    return this.props.children;
  }
}

function Header({ profile }) {
  return html`
    <header class="landing-header">
      <div class="logo" onClick=${() => navigate('/')}>
        <${GraduationCap} size=${24} strokeWidth=${2} />
        <span>TKA Studio</span>
      </div>
      <nav class="header-nav">
        <a href="#/fitur" onClick=${(e) => { e.preventDefault(); document.getElementById('fitur').scrollIntoView({behavior: 'smooth'}); }}>Fitur</a>
        <a href="#/cara" onClick=${(e) => { e.preventDefault(); document.getElementById('cara').scrollIntoView({behavior: 'smooth'}); }}>Cara Kerja</a>
        <a href="#/faq" onClick=${(e) => { e.preventDefault(); document.getElementById('faq').scrollIntoView({behavior: 'smooth'}); }}>FAQ</a>
      </nav>
      <div class="header-actions">
        ${profile ? html`
          <button class="btn-secondary btn-sm" onClick=${() => navigate('/build')}>
            <${LayoutDashboard} size=${16} /> Dashboard
          </button>
        ` : html`
          <button class="btn-secondary btn-sm" onClick=${() => navigate('/login')}>
            <${LogIn} size=${16} /> Masuk
          </button>
        `}
      </div>
    </header>
  `;
}

function Footer() {
  return html`
    <footer class="landing-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="logo-icon">TKA</div>
          <div>
            <div class="footer-title">TKA Studio</div>
            <div class="footer-desc">Alat bantu guru Indonesia untuk menyusun bank soal berkualitas standar asesmen nasional. Langsung ekspor ke TKA Local Host.</div>
          </div>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <div class="footer-col-title">Produk</div>
            <a href="https://onelabszz.github.io/tka-local/docs/" target="_blank">TKA Local Host</a>
            <a href="./panduan/">Panduan Lengkap</a>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Kontak</div>
            <a href="https://wa.me/6281234567890" target="_blank">Bantuan WhatsApp</a>
            <a href="mailto:halo@tkastudio.id">Email</a>
          </div>
        </div>
      </div>
      <div class="footer-copy">
        © 2026 Ekwan Nugroho — Wonogiri · Dibuat untuk pendidikan Indonesia
      </div>
    </footer>
  `;
}

function Landing({ profile }) {
  return html`
    <div class="landing">
      <${Header} profile=${profile} />
      
      <main class="landing-main">
        <!-- HERO SECTION -->
        <section class="hero-section">
          <div class="hero-bg-grid"></div>
          <div class="hero-bg-glow"></div>
          
          <div class="hero-grid">
            <div class="hero-copy">
              <div class="badge-hero">
                <span class="dot"></span> Gratis · Tanpa API Key · Tanpa Login
              </div>
              <h1 class="hero-title">
                Buat Paket Soal <br/>
                <span class="highlight">Tryout TKA</span> dalam 15 Menit
              </h1>
              <p class="hero-desc">
                Alat bantu guru Indonesia untuk menyusun bank soal berkualitas standar asesmen nasional. Langsung ekspor ke TKA Local Host.
              </p>
              <div class="hero-actions">
                <button class="cta-button" onClick=${() => navigate('/build')}>
                  <${Sparkles} size=${20} /> Mulai Buat Soal
                </button>
                <button class="btn-secondary" onClick=${() => window.location.href = './panduan/'}>
                  <${BookOpen} size=${18} /> Lihat Panduan
                </button>
              </div>
              <div class="hero-trust">
                <span><${Check} size=${16} /> Tanpa daftar</span>
                <span><${Check} size=${16} /> Data aman</span>
                <span><${Check} size=${16} /> Standar Asesmen</span>
              </div>
            </div>

            <!-- VISUAL (STACKED CARDS) -->
            <div class="hero-visual">
              <div class="visual-glow"></div>
              
              <!-- Card 1: Math -->
              <div class="v-card v-card-math">
                <div class="v-header"><span class="v-badge badge-pg">PG · Matematika</span></div>
                <div class="v-q">Tentukan hasil dari:</div>
                <div class="v-math-box">3 \frac{1}{2} + 2 \frac{1}{4}</div>
                <div class="v-opts">
                  <div class="v-opt correct">A. 5 \frac{3}{4}</div>
                  <div class="v-opt">B. 5 \frac{1}{2}</div>
                </div>
              </div>

              <!-- Card 2: B/S -->
              <div class="v-card v-card-bs">
                <div class="v-header"><span class="v-badge badge-bs">B/S · IPA</span></div>
                <div class="v-q">Tentukan Benar atau Salah:</div>
                <div class="v-bs-row"><span>Bumi itu bulat</span><span class="v-radio active"></span></div>
                <div class="v-bs-row"><span>Bulan bercahaya</span><span class="v-radio"></span></div>
              </div>

              <!-- Card 3: MCMA -->
              <div class="v-card v-card-mcma">
                <div class="v-header"><span class="v-badge badge-mcma">MCMA · B.Indo</span></div>
                <div class="v-q">Manakah pernyataan yang benar?</div>
                <div class="v-checkbox-row"><span class="v-checkbox active"></span> Tokoh utama adalah Kentus</div>
                <div class="v-checkbox-row"><span class="v-checkbox"></span> Latar cerita di pantai</div>
              </div>
            </div>
          </div>
        </section>

        <!-- PAIN POINTS -->
        <section class="section-pain">
          <div class="section-header">
            <h2>Guru Bukan Malas. Guru Cuma Tidak Punya Waktu.</h2>
            <p>Menyusun soal manual butuh 3-4 jam. TKA Studio memangkasnya jadi 15 menit.</p>
          </div>
          <div class="grid-3">
            <div class="feature-card">
              <div class="feature-icon">⏱️</div>
              <h3>Hemat Waktu</h3>
              <p>Copy-paste ke AI, langsung jadi 40 soal rapi.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">✅</div>
              <h3>Kualitas Terjamin</h3>
              <p>Prompt dikunci agar sesuai standar asesmen nasional.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3>Privasi Aman</h3>
              <p>Data soal tersimpan di browser Anda, bukan di server kami.</p>
            </div>
          </div>
        </section>

        <!-- 3 LANGKAH -->
        <section class="section-steps" id="cara">
          <div class="section-header">
            <h2>Hanya 3 Langkah</h2>
            <p>Tidak perlu keahlian IT. Guru biasa pun bisa menjalankannya.</p>
          </div>
          <div class="grid-3">
            <div class="step-card">
              <div class="step-num">1</div>
              <h3>Susun Prompt</h3>
              <p>Isi form (mapel, kelas, topik). AI siapkan prompt khusus untuk Anda copy.</p>
            </div>
            <div class="step-card">
              <div class="step-num">2</div>
              <h3>Tempel ke AI</h3>
              <p>Buka ChatGPT/Gemini, paste prompt tadi. Copy hasil JSON-nya.</p>
            </div>
            <div class="step-card">
              <div class="step-num">3</div>
              <h3>Ekspor ke Local Host</h3>
              <p>Paste hasil di TKA Studio, download file .json, impor ke Local Host.</p>
            </div>
          </div>
        </section>

        <!-- FITUR UNGGULAN -->
        <section class="section-features" id="fitur">
          <div class="section-header">
            <h2>Yang Membuat Berbeda</h2>
          </div>
          <div class="grid-2">
            <div class="feature-card">
              <h3>🎯 Mode Expert</h3>
              <p>Susun soal sedikit demi sedikit (5 soal/batch) agar kualitasnya maksimal. Cocok untuk ujian resmi.</p>
            </div>
            <div class="feature-card">
              <h3>🤝 Pustaka Gotong Royong</h3>
              <p>Berbagi soal terbaik dengan guru lain. Nama Anda tercatat sebagai penulis soal.</p>
            </div>
            <div class="feature-card">
              <h3>📐 Dukungan Rumus (LaTeX)</h3>
              <p>Pecahan, akar, pangkat tampil cantik di preview dan file ekspor.</p>
            </div>
            <div class="feature-card">
              <h3>📤 Kompatibel Local Host</h3>
              <p>File JSON langsung terbaca. Mendukung soal wacana panjang (B.Indo) dan soal bergambar.</p>
            </div>
          </div>
        </section>

        <!-- DIBUAT OLEH -->
        <section class="section-creator">
          <div class="creator-card">
            <!-- Ganti src dengan URL foto asli nanti -->
            <img src="./assets/avatar.jpg" alt="Ekwan Nugroho" class="creator-avatar" onError=${(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
            <div class="creator-initial" style="display:none;">E</div>
            
            <div class="creator-content">
              <h3>Dibuat oleh Guru, untuk Guru</h3>
              <p>"Saya tahu rasanya menyusun soal sampai tengah malam. TKA Studio lahir dari kebutuhan saya sendiri, dan saya bagikan gratis untuk memajukan pendidikan Indonesia."</p>
              <div class="creator-name">Ekwan Nugroho</div>
              <div class="creator-role">Guru & Pengembang — Wonogiri</div>
            </div>
          </div>
        </section>

        <!-- FAQ -->
        <section class="section-faq" id="faq">
          <div class="section-header">
            <h2>Pertanyaan Umum</h2>
          </div>
          <div class="faq-list">
            <details class="faq-item">
              <summary>Apakah ini benar-benar gratis?</summary>
              <p>Ya, 100% gratis. Kami tidak memungut biaya, tidak menjual data, dan tidak memaksa Anda mendaftar untuk menggunakan Mode Basic.</p>
            </details>
            <details class="faq-item">
              <summary>Apakah ini terafiliasi dengan instansi pemerintah?</summary>
              <p>Tidak. TKA Studio adalah alat bantu independen. Namun, prompt kami dirancang mengikuti standar asesmen nasional (seperti soal berbasis teks, HOTS, dan distribusi kognitif).</p>
            </details>
            <details class="faq-item">
              <summary>Soal saya aman?</summary>
              <p>Sangat aman. Soal tersimpan di browser (LocalStorage) Anda. Hanya soal yang Anda klik "Terbitkan" yang akan masuk ke server Pustaka.</p>
            </details>
            <details class="faq-item">
              <summary>Saya tidak paham AI, apakah bisa pakai?</summary>
              <p>Bisa. TKA Studio sudah menyiapkan prompt khusus. Anda hanya perlu copy, paste ke ChatGPT/Gemini, lalu copy hasilnya kembali ke sini.</p>
            </details>
          </div>
        </section>
      </main>
      <${Footer} />
    </div>
  `;
}

// ... (fungsi DebugPageInner, DebugPage, PublicLayout, App tidak berubah, biarkan seperti sebelumnya) ...
// Salin sisa kode dari app.js sebelumnya untuk bagian DebugPageInner, PublicLayout, dan App().


function DebugPageInner() {
  const [result, setResult] = useState(null);
  useEffect(() => {
    try {
      const r = runSchemaTests();
      setResult(r);
    } catch (e) {
      console.error('runSchemaTests fatal:', e);
      setResult({ error: String(e?.stack || e), passed: 0, failed: 0, results: [] });
    }
  }, []);

  if (!result) return html`<div class="landing"><${Header} /><main class="landing-main"><p>Menjalankan test...</p></main></div>`;
  const results = result.results || [];
  return html`
    <div class="landing">
      <${Header} />
      <main class="landing-main" style="text-align: left; max-width: 900px;">
        <h1 style="font-size: 24px; margin-bottom: var(--space-4);">Schema Tests</h1>
        ${result.error && html`<p style="color: var(--danger);"><b>Fatal:</b> ${result.error}</p>`}
        <p><b style="color: var(--success);">${result.passed} lulus</b> ${result.failed > 0 && html` · <b style="color: var(--danger);">${result.failed} gagal</b>`}</p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${results.map((r) => html`<div style="padding: 12px; border: 1px solid ${r.ok ? '#BBF7D0' : '#FECACA'}; background: ${r.ok ? '#F0FDF4' : '#FEF2F2'}; border-radius: 8px; font-size: 13px;"><b>${r.ok ? '✓' : '✗'} ${r.name}</b>${!r.ok && html`<div style="color: #7F1D1D; font-size:12px;">${r.message}</div>`}</div>`)}
        </div>
        <button class="cta-button" style="margin-top: var(--space-6);" onClick=${() => navigate('/')}>Kembali</button>
      </main>
      <${Footer} />
    </div>
  `;
}

function PublicLayout({ children, profile }) {
  return html`
    <div style="min-height: 100dvh; display: flex; flex-direction: column; background: var(--surface);">
      <${Header} profile=${profile} />
      <main style="flex: 1; position: relative;">${children}</main>
      <${Footer} />
    </div>
  `;
}

function App() {
  const route = useHashRoute();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        if (session) {
          setUser(session.user);
          const prof = await getProfile(session.user.id);
          setProfile(prof);
        }
      } catch (e) { console.error(e); } finally { setAuthLoading(false); }
    })();
  }, []);

  const handleLogout = async () => { await signOut(); setUser(null); setProfile(null); navigate('/'); };
  const handleLoginSuccess = async () => {
    const session = await getSession();
    if (session) {
      setUser(session.user);
      const prof = await getProfile(session.user.id);
      setProfile(prof);
      navigate(prof?.status === 'pending' ? '/pending' : '/build');
    }
  };

  if (authLoading) return html`<div style="padding: 40px; text-align: center;">Memuat...</div>`;

  if (route === '/' || route === '') return html`<${Landing} profile=${profile} />`;
  if (route === '/login') return html`<${LoginPage} navigate=${navigate} onLoginSuccess=${handleLoginSuccess} />`;
  if (route === '/register') return html`<${RegisterPage} navigate=${navigate} />`;
  if (route === '/debug') return html`<${ErrorBoundary}><${DebugPageInner} /></${ErrorBoundary}>`;
  
  if (route === '/build' || route === '/paste' || route === '/preview' || route === '/export') {
    let PageComponent = null;
    let pageProps = { navigate, profile };
    if (route === '/build') PageComponent = BuildPage;
    else if (route === '/paste') PageComponent = PastePage;
    else if (route === '/preview') PageComponent = PreviewPage;
    else if (route === '/export') PageComponent = ExportPage;
    return html`<${PublicLayout} profile=${profile}><${PageComponent} ...${pageProps} /></${PublicLayout}>`;
  }

  if (route === '/pending') return html`<${PendingPage} navigate=${navigate} onLogout=${handleLogout} />`;

  const AUTH_ROUTES = ['/bank-soal', '/pustaka', '/kotak', '/expert', '/expert/new'];
  const isAuthRoute = AUTH_ROUTES.some(r => route === r || route.startsWith(r + '/'));

  if (isAuthRoute) {
    if (!user) { navigate('/login'); return html`<div style="padding: 40px; text-align: center;">Mengarahkan ke login...</div>`; }
    let PageComponent = null;
    let pageProps = { navigate, profile };
    if (route === '/bank-soal') PageComponent = BankSoalPage;
    else if (route === '/pustaka') PageComponent = PustakaPage;
    else if (route === '/kotak') PageComponent = KotakPage;
    else if (route === '/expert') PageComponent = ExpertListPage;
    else if (route === '/expert/new') PageComponent = ExpertNewPage;
    else if (route.startsWith('/expert/')) { PageComponent = ExpertDetailPage; pageProps = { navigate, profile, id: route.split('/')[2] }; }
    if (PageComponent) return html`<${AppShell} route=${route} profile=${profile} onLogout=${handleLogout}><${PageComponent} ...${pageProps} /></${AppShell}>`;
  }

  return html`<div style="text-align:center; padding:50px;"><h1>404</h1><button class="btn-primary" onClick=${() => navigate('/')}>Kembali</button></div>`;
}

render(html`<${ErrorBoundary}><${App} /></${ErrorBoundary}>`, document.getElementById('app'));
