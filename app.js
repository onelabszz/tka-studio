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
  Fingerprint, Network, Calculator, Target
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
            <a href="#fitur" onClick=${(e) => { e.preventDefault(); document.getElementById('fitur')?.scrollIntoView({behavior: 'smooth'}); }}>Fitur</a>
            <a href="#ekosistem" onClick=${(e) => { e.preventDefault(); document.getElementById('ekosistem')?.scrollIntoView({behavior: 'smooth'}); }}>Ekosistem</a>
            <a href="#changelog" onClick=${(e) => { e.preventDefault(); document.getElementById('changelog')?.scrollIntoView({behavior: 'smooth'}); }}>Pembaruan</a>
            <a href="./panduan/">Panduan</a>
          </nav>
        `}

        <div class="header-actions">
          ${profile 
            ? html`<button class="btn-nav-login" onClick=${() => navigate('/build')}><${LayoutDashboard} size=${16} /> Dasbor</button>`
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
              Platform penyusunan asesmen bertenaga AI. Membantu guru Indonesia menciptakan soal berkualitas dengan standar nasional.
            </div>
          </div>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <div class="footer-col-title">Produk</div>
            <a href="#/" onClick=${(e) => { e.preventDefault(); navigate('/'); }}>Beranda</a>
            <a href="#/build" onClick=${(e) => { e.preventDefault(); navigate('/build'); }}>Studio Asesmen</a>
            <a href="#/play" onClick=${(e) => { e.preventDefault(); navigate('/play'); }}>Ujian Mandiri</a>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">Ekosistem</div>
            <a href="https://onelabszz.github.io/tka-local/docs/" target="_blank">TKA Local Host</a>
            <a href="./panduan/">Panduan Lengkap</a>
            <a href="#/debug" onClick=${(e) => { e.preventDefault(); navigate('/debug'); }}>Uji Sistem</a>
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
            <div class="badge-hero"><span class="dot"></span> Platform Asesmen Terpadu</div>
            <h1 class="hero-title">
              Ciptakan Soal Asesmen <br/>
              <span class="highlight">Berkualitas Tinggi.</span>
            </h1>
            <p class="hero-desc">
              Susun bank soal HOTS (C1–C6) bertenaga AI dalam hitungan menit. Lengkap dengan dukungan rumus matematika, gambar, dan validasi format sesuai standar ujian nasional.
            </p>
            <div class="hero-actions">
              <button class="cta-button" onClick=${() => navigate('/build')}>
                <${Sparkles} size=${20} /> Mulai Susun Soal
              </button>
              ${!profile && html`
                <button class="cta-button-ghost" onClick=${() => navigate('/register')}>
                  <${Fingerprint} size=${18} /> Daftar Akun (SSO)
                </button>
              `}
            </div>
            <div class="hero-trust">
              <span><${Check} size=${16} /> 100% Gratis</span>
              <span><${Check} size=${16} /> Tanpa API Key</span>
              <span><${Check} size=${16} /> Siap Ekspor Local Host</span>
            </div>
          </div>

          <div class="hero-visual">
            <div class="visual-glow"></div>
            <div class="hero-float-badge">
              <${Zap} size=${13} /> Optimasi Gambar Otomatis
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
        
        <!-- FITUR KUALITAS SOAL -->
        <section class="section-features" id="fitur">
          <div class="section-container">
            <div class="section-header">
              <div class="section-eyebrow"><${Star} size=${12} /> Standar Kualitas</div>
              <h2>Dirancang untuk Standar Asesmen Nasional</h2>
              <p>Fokus pada kualitas soal, bukan sekadar kuantitas.</p>
            </div>

            <div class="grid-2">
              <div class="feature-card tone-blue">
                <div class="feature-icon-wrapper"><${Target} size=${28} /></div>
                <h3>Berbasis HOTS (C1–C6)</h3>
                <p>Prompt AI telah dikalibrasi dengan standar Pusmendik Kemendikbud. Hasilkan soal yang mengukur hafalan hingga analisis tingkat tinggi.</p>
              </div>

              <div class="feature-card tone-amber">
                <div class="feature-icon-wrapper"><${Calculator} size=${28} /></div>
                <h3>Dukungan Rumus (KaTeX)</h3>
                <p>Pecahan, matriks, atau persamaan kimia akan dirender dengan cantik dan presisi, baik di editor maupun saat ujian berlangsung.</p>
              </div>

              <div class="feature-card tone-purple">
                <div class="feature-icon-wrapper"><${ImageIcon} size=${28} /></div>
                <h3>Kompresi Gambar Otomatis</h3>
                <p>Unggah gambar pendukung, dan sistem akan otomatis mengompresnya ke format WebP agar ukuran file tetap ringan dan cepat diakses.</p>
              </div>

              <div class="feature-card tone-green">
                <div class="feature-icon-wrapper"><${FileJson} size=${28} /></div>
                <h3>Validasi Format Ketat</h3>
                <p>Tidak perlu pusing dengan format. Sistem akan memvalidasi setiap soal sebelum diekspor, memastikan 100% kompatibel dengan Local Host.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- EKOSISTEM & SSO -->
        <section class="section-ekosistem" id="ekosistem">
          <div class="section-container">
            <div class="section-header">
              <div class="section-eyebrow"><${Fingerprint} size=${12} /> Integrasi Sistem</div>
              <h2>Sinergi Asesmen: Web & Desktop</h2>
              <p>Alur kerja tanpa hambatan dari penyusunan soal hingga pelaksanaan ujian.</p>
            </div>

            <div class="bridge-flow">
              <div class="bridge-node" style="border-color: var(--primary-mid);">
                <div class="bridge-icon is-primary"><${Sparkles} size=${28} /></div>
                <h3>TKA Studio</h3>
                <p>Pusat penyusunan soal bertenaga AI (Online).</p>
              </div>

              <div class="bridge-arrow">
                <div class="bridge-arrow-line"></div>
                <div class="bridge-arrow-label" style="background: var(--primary-light); border-color: var(--primary-mid);">
                  <${ShieldCheck} size=${14} />
                  <span>Akun SSO Terhubung</span>
                </div>
                <div class="bridge-arrow-line"></div>
              </div>

              <div class="bridge-node" style="border-color: var(--warning);">
                <div class="bridge-icon is-amber"><${MonitorPlay} size=${28} /></div>
                <h3>TKA Local Host</h3>
                <p>Eksekusi ujian offline dengan pengawasan (Desktop).</p>
              </div>
            </div>

            <div style="margin-top: 40px; text-align: center;">
              <div class="auth-info-box" style="display: inline-block; max-width: 640px; text-align: left; background: white; border: 1px solid var(--border-strong); box-shadow: var(--shadow-sm);">
                <div class="auth-info-title" style="color: var(--primary); font-size: 15px; margin-bottom: 8px;">
                  <${Fingerprint} size=${18} /> Single Sign-On (SSO) Terpusat
                </div>
                <p style="margin: 0; font-size: 14px; color: var(--text-muted); line-height: 1.6;">
                  Cukup daftar satu kali di TKA Studio. Akun Anda akan otomatis dikenali oleh TKA Local Host. Tidak perlu membuat akun baru atau mengingat password tambahan saat berpindah aplikasi.
                </p>
              </div>
            </div>

          </div>
        </section>

        <!-- CHANGELOG / VERSI -->
        <section class="section-changelog" id="changelog" style="padding: 80px 0; background: var(--surface); border-top: 1px solid var(--border);">
          <div class="section-container" style="max-width: 800px;">
            <div class="section-header">
              <div class="section-eyebrow"><${History} size=${12} /> Timeline</div>
              <h2>Pembaruan Platform</h2>
            </div>
            
            <div class="changelog-timeline">
              <div class="changelog-item">
                <div class="changelog-date">Oktober 2026</div>
                <div class="changelog-content">
                  <div class="changelog-version">v1.3 <span class="badge-done">Terbaru</span></div>
                  <ul class="changelog-list">
                    <li><b>Sistem SSO:</b> Satu akun untuk TKA Studio dan TKA Local Host.</li>
                    <li><b>Manajemen Hak Akses:</b> Peningkatan keamanan data guru dan admin.</li>
                    <li><b>Sinkronisasi Profil:</b> Status akun otomatis sinkron antar aplikasi.</li>
                  </ul>
                </div>
              </div>

              <div class="changelog-item">
                <div class="changelog-date">September 2026</div>
                <div class="changelog-content">
                  <div class="changelog-version">v1.2</div>
                  <ul class="changelog-list">
                    <li><b>Antarmuka Ujian:</b> Tampilan PG, MCMA, dan B/S yang menyerupai ujian resmi.</li>
                    <li><b>Kode Latihan:</b> Distribusi soal ke siswa via kode 6 huruf.</li>
                    <li><b>Manajemen Gambar:</b> Kompresi WebP otomatis.</li>
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
                <h2>Tingkatkan Kualitas Asesmen Sekolah Anda</h2>
                <p>Gunakan AI secara bijak untuk meringkas waktu penyusunan soal, tanpa mengorbankan standar pendidikan.</p>
                <div class="final-cta-actions">
                  <button class="cta-button" onClick=${() => navigate('/build')}>
                    <${Sparkles} size=${20} /> Mulai Susun Soal
                  </button>
                  <a href="./panduan/" class="cta-button-ghost" style="text-decoration: none;">
                    <${BookOpen} size=${18} /> Lihat Panduan
                  </a>
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
          <h1>Uji Sistem (Schema Tests)</h1>
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
      if (['admin', 'superadmin'].includes(profile?.role) || profile?.can_publish_exam === true) {
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
