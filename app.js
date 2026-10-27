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
  Check, Clock, Shield, Zap, FileJson, ChevronRight, PlayCircle, Star, Users, HelpCircle,
  Save, ListChecks, MousePointerClick, Bot, Download, MonitorPlay, Heart, MapPin,
  Github, MessageCircle, Repeat, Terminal, ShieldCheck, Share2, Library, Smartphone, History,
  Menu, X, Loader2, ArrowLeft, Key
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
import { PlayPage } from './pages/play.js';
import { ExamListPage } from './pages/exam-list.js';
import { ImageToolPage } from './pages/image-tool.js';
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
  constructor(props) { super(props); this.state = { error: null }; }
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

function Header({ profile, isLanding }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return html`
    <header class=${'landing-header' + (scrolled || !isLanding ? ' scrolled' : '')}>
      <div class="header-container">
        <div class="logo" onClick=${() => navigate('/')}>
          <${GraduationCap} size=${24} strokeWidth=${2} /><span>TKA Studio</span>
        </div>
        
        ${isLanding && html`
          <nav class="header-nav">
            <a href="#ekosistem" onClick=${(e) => { e.preventDefault(); document.getElementById('ekosistem')?.scrollIntoView({behavior: 'smooth'}); }}>Ekosistem</a>
            <a href="#fitur" onClick=${(e) => { e.preventDefault(); document.getElementById('fitur')?.scrollIntoView({behavior: 'smooth'}); }}>Fitur</a>
            <a href="#changelog" onClick=${(e) => { e.preventDefault(); document.getElementById('changelog')?.scrollIntoView({behavior: 'smooth'}); }}>Changelog</a>
            <a href="./panduan/">Panduan</a>
          </nav>
        `}

        <div class="header-actions">
          ${profile 
            ? html`<button class="btn-nav-login" onClick=${() => navigate('/build')}><${LayoutDashboard} size=${16} /> Dashboard</button>`
            : html`<button class="btn-nav-login" onClick=${() => navigate('/login')}><${LogIn} size=${16} /> Masuk</button>`}
        </div>
      </div>
    </header>
  `;
}

function Footer() {
  return html`
    <footer class="landing-footer">
      <div class="footer-container">
        <div class="footer-brand">
          <div class="logo-icon">TKA</div>
          <div>
            <div class="footer-title">TKA Studio</div>
            <div class="footer-desc">
              Ekosistem pembuat soal TKA bertenaga AI. Gratis, tanpa API key, dan fokus pada kemudahan guru Indonesia.
            </div>
          </div>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <div class="footer-col-title">Produk</div>
            <a href="#/" onClick=${(e) => { e.preventDefault(); navigate('/'); }}>Beranda</a>
            <a href="#/build" onClick=${(e) => { e.preventDefault(); navigate('/build'); }}>Buat Soal (Dapur)</a>
            <a href="#/play" onClick=${(e) => { e.preventDefault(); navigate('/play'); }}>Player Siswa</a>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Ekosistem</div>
            <a href="https://onelabszz.github.io/tka-local/docs/" target="_blank">TKA Local Host</a>
            <a href="./panduan/">Panduan Lengkap</a>
            <a href="#/debug" onClick=${(e) => { e.preventDefault(); navigate('/debug'); }}>Schema Tests</a>
          </div>
        </div>
      </div>
      <div class="footer-copy">
        © 2026 <b>Ekwan Nugroho</b> — Wonogiri · Dibuat untuk pendidikan Indonesia 🇮🇩
      </div>
    </footer>
  `;
}

function Landing({ profile }) {
  return html`
    <div class="landing">
      <${Header} profile=${profile} isLanding=${true} />

      <!-- HERO -->
      <section class="hero-section">
        <div class="hero-bg-grid"></div>
        <div class="hero-bg-glow"></div>
        <div class="hero-bg-glow-2"></div>

        <div class="hero-container">
          <div class="hero-copy">
            <div class="badge-hero"><span class="dot"></span> Ekosistem TKA v1.2 Terbaru</div>
            <h1 class="hero-title">
              Dapur Soal AI <br/>
              <span class="highlight">Tanpa API Key.</span>
            </h1>
            <p class="hero-desc">
              Buat bank soal berkualitas dalam hitungan menit. Ekspor ke TKA Local Host untuk ujian resmi, atau bagikan Kode Latihan ke siswa untuk tryout mandiri di rumah.
            </p>
            <div class="hero-actions">
              <button class="cta-button" onClick=${() => navigate('/build')}>
                <${Sparkles} size=${20} /> Mulai Buat Soal
              </button>
              <button class="cta-button-ghost" onClick=${() => navigate('/play')}>
                <${PlayCircle} size=${18} /> Masuk Mode Siswa
              </button>
            </div>
            <div class="hero-trust">
              <span><${Check} size=${16} /> 100% Gratis</span>
              <span><${Check} size=${16} /> Tanpa Server Berat</span>
              <span><${Check} size=${16} /> Standar Asesmen</span>
            </div>
          </div>

          <div class="hero-visual">
            <div class="visual-glow"></div>
            <div class="hero-float-badge">
              <${Zap} size=${13} /> Auto-Compress Gambar
            </div>

            <div class="v-card v-card-math">
              <div class="v-header"><span class="v-badge badge-pg">PG · Matematika</span></div>
              <div class="v-q">Tentukan hasil dari:</div>
              <div class="v-math-box">3½ + 2¼ = ?</div>
              <div class="v-opts">
                <div class="v-opt correct">A. 5¾</div>
                <div class="v-opt">B. 5½</div>
              </div>
            </div>

            <div class="v-card v-card-bs">
              <div class="v-header"><span class="v-badge badge-bs">B/S · IPA</span></div>
              <div class="v-q">Tentukan Benar atau Salah:</div>
              <div class="v-bs-row"><span>Bumi itu bulat</span><span class="v-radio active"></span></div>
              <div class="v-bs-row"><span>Bulan bercahaya</span><span class="v-radio"></span></div>
            </div>

            <div class="v-card v-card-mcma">
              <div class="v-header"><span class="v-badge badge-mcma">MCMA · B.Indo</span></div>
              <div class="v-q">Manakah pernyataan yang benar?</div>
              <div class="v-checkbox-row"><span class="v-checkbox active"></span> Tokoh utama adalah Kentus</div>
              <div class="v-checkbox-row"><span class="v-checkbox"></span> Latar cerita di pantai</div>
            </div>
          </div>
        </div>
      </section>

      <main class="landing-main">

        <!-- EKOSISTEM -->
        <section class="section-ekosistem" id="ekosistem">
          <div class="section-container">
            <div class="section-header">
              <div class="section-eyebrow"><${Terminal} size=${12} /> Alur Kerja</div>
              <h2>Bagaimana Ekosistem Ini Bekerja?</h2>
              <p>Satu file JSON, dua cara mengeksekusi. Pilih sesuai kebutuhan Anda.</p>
            </div>

            <div class="bridge-flow">
              <!-- Node 1 -->
              <div class="bridge-node">
                <div class="bridge-icon is-primary"><${Sparkles} size=${28} /></div>
                <h3>1. TKA Studio</h3>
                <p>Dapur pembuatan soal dengan AI (Mode Basic & Expert).</p>
                <div class="bridge-chips">
                  <span class="config-chip">Prompt AI</span>
                  <span class="config-chip">Validasi</span>
                </div>
              </div>

              <!-- Arrow -->
              <div class="bridge-arrow">
                <div class="bridge-arrow-line"></div>
                <div class="bridge-arrow-label">
                  <${FileJson} size=${14} />
                  <span>File .json</span>
                </div>
                <div class="bridge-arrow-line"></div>
              </div>

              <!-- Node 2 -->
              <div class="bridge-node">
                <div class="bridge-icon is-amber"><${MonitorPlay} size=${28} /></div>
                <h3>2. TKA Local Host</h3>
                <p>Aplikasi ujian offline di lab sekolah (dengan pengawasan ketat).</p>
                <div class="bridge-chips">
                  <span class="config-chip is-warning">Ujian Resmi</span>
                  <span class="config-chip is-warning">Offline</span>
                </div>
              </div>
            </div>

            <!-- Jalur Alternatif -->
            <div class="bridge-flow" style="margin-top: 24px;">
               <div class="bridge-node" style="background: var(--surface-muted); border-style: dashed;">
                <div class="bridge-icon" style="background: #e2e8f0; color: #475569;"><${Smartphone} size=${28} /></div>
                <h3>TKA Player (Online)</h3>
                <p>Latihan mandiri di rumah. Siswa cukup mengetik Kode Latihan.</p>
                <div class="bridge-chips">
                  <span class="config-chip">Kode Akses</span>
                  <span class="config-chip">Tanpa Install</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- FITUR BARU -->
        <section class="section-features" id="fitur">
          <div class="section-container">
            <div class="section-header">
              <div class="section-eyebrow"><${Star} size=${12} /> Fitur Unggulan v1.2</div>
              <h2>Dirancang untuk Guru Modern</h2>
              <p>Tanpa biaya server, tanpa API Key, namun tetap bertenaga.</p>
            </div>

            <div class="grid-2">
              <div class="feature-card tone-blue">
                <div class="feature-icon-wrapper"><${Share2} size=${28} /></div>
                <h3>Bagikan Kode Latihan</h3>
                <p>Terbitkan soal ke server GitHub dan bagikan Kode 6 huruf ke siswa. Mereka bisa berlatih mandiri langsung dari HP tanpa perlu file .json.</p>
              </div>

              <div class="feature-card tone-amber">
                <div class="feature-icon-wrapper"><${ImageIcon} size=${28} /></div>
                <h3>Auto-Compress Gambar</h3>
                <p>Unggah gambar di editor soal, dan sistem akan otomatis mengompresnya ke format WebP (max 500KB) agar file JSON tetap ringan.</p>
              </div>

              <div class="feature-card tone-purple">
                <div class="feature-icon-wrapper"><${Library} size=${28} /></div>
                <h3>Pustaka Kolaborasi</h3>
                <p>Berbagi soal terbaik ke Pustaka Publik. Guru lain di seluruh Indonesia bisa mengunduh dan merakitnya menjadi paket baru.</p>
              </div>

              <div class="feature-card tone-green">
                <div class="feature-icon-wrapper"><${FileJson} size=${28} /></div>
                <h3>Ekspor JSON & CSV</h3>
                <p>File JSON kompatibel 100% dengan TKA Local Host. Dilengkapi ekspor CSV 14 kolom untuk arsip Excel guru.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- CHANGELOG / VERSI -->
        <section class="section-changelog" id="changelog" style="padding: 80px 0; background: var(--surface); border-top: 1px solid var(--border);">
          <div class="section-container" style="max-width: 800px;">
            <div class="section-header">
              <div class="section-eyebrow"><${History} size=${12} /> Timeline</div>
              <h2>Riwayat Pembaruan</h2>
            </div>
            
            <div class="changelog-timeline">
              <div class="changelog-item">
                <div class="changelog-date">Oktober 2026</div>
                <div class="changelog-content">
                  <div class="changelog-version">v1.2 <span class="badge-done">Terbaru</span></div>
                  <ul class="changelog-list">
                    <li><b>TKA Player:</b> UI/UX ujian resmi (Radio, Checkbox, Tabel B/S).</li>
                    <li><b>Kode Latihan:</b> Integrasi GitHub Edge Function untuk share tanpa file.</li>
                    <li><b>Admin Panel:</b> Dashboard analitik, edit profil, dan reset password.</li>
                    <li><b>Image Tool:</b> Auto-compress WebP dan embed base64.</li>
                  </ul>
                </div>
              </div>

              <div class="changelog-item">
                <div class="changelog-date">September 2026</div>
                <div class="changelog-content">
                  <div class="changelog-version">v1.1</div>
                  <ul class="changelog-list">
                    <li>Peluncuran <b>Mode Expert</b> (Generate batch per 5 soal).</li>
                    <li>Dukungan render rumus Matematika (KaTeX).</li>
                    <li>Fitur validasi JSON v1.1 yang lebih ketat.</li>
                    <li>Pustaka Soal Publik (Gotong Royong).</li>
                  </ul>
                </div>
              </div>

              <div class="changelog-item">
                <div class="changelog-date">Agustus 2026</div>
                <div class="changelog-content">
                  <div class="changelog-version">v1.0</div>
                  <ul class="changelog-list">
                    <li>Rilis perdana TKA Studio (Mode Basic).</li>
                    <li>Parser pintar AI (JSON/CSV).</li>
                    <li>Ekspor file `.json` untuk TKA Local Host.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- FINAL CTA -->
        <section class="section-final-cta">
          <div class="section-container">
            <div class="final-cta-card">
              <div class="final-cta-bg-1"></div>
              <div class="final-cta-bg-2"></div>
              <div class="final-cta-content">
                <h2>Siap buat paket soal pertama Anda?</h2>
                <p>Gunakan AI gratis (ChatGPT/Gemini) untuk menyusun soal. Kami yang merapikan formatnya.</p>
                <div class="final-cta-actions">
                  <button class="cta-button" onClick=${() => navigate('/build')}>
                    <${Sparkles} size=${20} /> Mulai Sekarang
                  </button>
                  <button class="cta-button-ghost" onClick=${() => navigate('/panduan/')}>
                    <${BookOpen} size=${18} /> Baca Panduan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <${Footer} />
    </div>
  `;
}

function DebugPageInner() {
  const [result, setResult] = useState(null);
  useEffect(() => {
    try { setResult(runSchemaTests()); } catch (e) { setResult({ error: String(e), passed: 0, failed: 0, results: [] }); }
  }, []);
  if (!result) return html`<div class="landing"><${Header} isLanding=${false} /><main class="landing-main"><p style="text-align:center;padding:40px;">Menjalankan test...</p></main></div>`;
  return html`
    <div class="landing">
      <${Header} isLanding=${false} />
      <main class="landing-main" style="padding: 40px 20px;">
        <div class="section-container" style="text-align: left; max-width: 900px; background: white; padding: 32px; border-radius: 16px;">
          <h1>Schema Tests</h1>
          <p><b style="color: var(--success);">${result.passed} lulus</b> ${result.failed > 0 && html` · <b style="color: var(--danger);">${result.failed} gagal</b>`}</p>
          <button class="cta-button" style="margin-top: 20px;" onClick=${() => navigate('/')}>Kembali</button>
        </div>
      </main>
    </div>
  `;
}

function PublicLayout({ children, profile }) {
  return html`
    <div style="min-height: 100dvh; display: flex; flex-direction: column; background: var(--surface);">
      <${Header} profile=${profile} isLanding=${false} />
      <main style="flex: 1; padding-top: 80px;">${children}</main>
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
        if (session) { setUser(session.user); setProfile(await getProfile(session.user.id)); }
      } catch (e) { console.error(e); } finally { setAuthLoading(false); }
    })();
  }, []);

  const handleLogout = async () => { await signOut(); setUser(null); setProfile(null); navigate('/'); };
  const handleLoginSuccess = async () => {
    const session = await getSession();
    if (session) { setUser(session.user); const prof = await getProfile(session.user.id); setProfile(prof); navigate(prof?.status === 'pending' ? '/pending' : '/build'); }
  };

  if (authLoading) return html`<div style="padding: 40px; text-align: center;">Memuat...</div>`;

  if (route === '/' || route === '') return html`<${Landing} profile=${profile} />`;
  if (route === '/login') return html`<${LoginPage} navigate=${navigate} onLoginSuccess=${handleLoginSuccess} />`;
  if (route === '/register') return html`<${RegisterPage} navigate=${navigate} />`;
  if (route === '/debug') return html`<${ErrorBoundary}><${DebugPageInner} /></${ErrorBoundary}>`;
  
  // PLAY PAGE (Standalone, no header/footer)
  if (route === '/play') return html`<${PlayPage} />`;
  if (route === '/image-tool') return html`<${PublicLayout} profile=${profile}><${ImageToolPage} navigate=${navigate} /></${PublicLayout}>`;

  if (route === '/build' || route === '/paste' || route === '/preview' || route === '/export') {
    let PageComponent = null;
    let pageProps = { navigate, profile };
    if (route === '/build') PageComponent = BuildPage;
    else if (route === '/paste') PageComponent = PastePage;
    else if (route === '/preview') PageComponent = PreviewPage;
    else if (route === '/export') PageComponent = ExportPage;

    let fromExpert = null;
    try {
      const d = JSON.parse(localStorage.getItem('tka-studio-draft-v1') || '{}');
      fromExpert = d && d._fromExpert ? d._fromExpert : null;
    } catch (e) { fromExpert = null; }

    if (fromExpert && user) {
      return html`
        <${AppShell} route=${route} profile=${profile} onLogout=${handleLogout}>
          <${PageComponent} ...${pageProps} />
        </${AppShell}>
      `;
    }

    return html`<${PublicLayout} profile=${profile}><${PageComponent} ...${pageProps} /></${PublicLayout}>`;
  }

  if (route === '/pending') return html`<${PendingPage} navigate=${navigate} onLogout=${handleLogout} />`;

  const AUTH_ROUTES = ['/bank-soal', '/pustaka', '/kotak', '/expert', '/expert/new', '/exam-list'];
  if (AUTH_ROUTES.some(r => route === r || route.startsWith(r + '/'))) {
    if (!user) { navigate('/login'); return html`<div style="padding: 40px; text-align: center;">Mengarahkan ke login...</div>`; }
    
    let PageComponent = null; 
    let pageProps = { navigate, profile };
    
    if (route === '/bank-soal') PageComponent = BankSoalPage;
    else if (route === '/pustaka') PageComponent = PustakaPage;
    else if (route === '/kotak') PageComponent = KotakPage;
    else if (route === '/expert') PageComponent = ExpertListPage;
    else if (route === '/expert/new') PageComponent = ExpertNewPage;
    else if (route.startsWith('/expert/')) { PageComponent = ExpertDetailPage; pageProps = { navigate, profile, id: route.split('/')[2] }; }
    else if (route === '/exam-list') {
      if (profile?.role === 'admin' || profile?.can_publish_exam === true) {
        PageComponent = ExamListPage;
      } else {
        if (window.showToast) window.showToast('Anda tidak memiliki akses ke halaman ini.', 'error');
        navigate('/');
        return null;
      }
    }
    
    if (PageComponent) return html`<${AppShell} route=${route} profile=${profile} onLogout=${handleLogout}><${PageComponent} ...${pageProps} /></${AppShell}>`;
  }

  return html`<div style="text-align:center; padding:50px;"><h1>404</h1><button class="btn-primary" onClick=${() => navigate('/')}>Kembali</button></div>`;
}

render(html`<${ErrorBoundary}><${App} /></${ErrorBoundary}>`, document.getElementById('app'));