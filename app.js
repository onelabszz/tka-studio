/**
 * TKA Studio — app.js
 * © 2026 Ekwan Nugroho — Wonogiri
 * All rights reserved.
 */
import { h, render, Component } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  GraduationCap, Sparkles, ArrowRight, FlaskConical, ClipboardPaste,
  FolderOpen, BookOpen, LogIn, LayoutDashboard, CheckCircle2, Image as ImageIcon
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
import './components/Toast.js'; // <-- TAMBAHKAN BARIS INI
import { getSession, getProfile, signOut } from './supabase/auth.js';

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
          <button onClick=${() => window.location.reload()} style="padding: 10px 16px; background: #0F766E; color: white; border: none; border-radius: 8px; cursor: pointer;">
            Muat Ulang
          </button>
        </div>
      `;
    }
    return this.props.children;
  }
}

// === HEADER STICKY GLOBAL ===
function Header({ profile }) {
  return html`
    <header class="landing-header">
      <div class="logo" onClick=${() => navigate('/')}>
        <${GraduationCap} size=${24} strokeWidth=${2} />
        <span>TKA Studio</span>
      </div>
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
      © 2026 Ekwan Nugroho — Wonogiri · TKA Studio · Pelengkap TKA Local Host
    </footer>
  `;
}

// === LANDING PAGE DENGAN HERO BARU ===
function Landing({ profile }) {
  return html`
    <div class="landing">
      <${Header} profile=${profile} />
      <main class="landing-main">
        <div class="landing-hero">
          <div class="landing-hero-grid">
            
            <div class="landing-hero-copy">
              <div class="badge-hero" style="display:inline-flex; align-items:center; gap:8px; background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.3); color:var(--amber-400); padding:6px 14px; border-radius:99px; font-size:13px; font-weight:600; margin-bottom:20px;">
                <span style="width:8px; height:8px; border-radius:50%; background:var(--amber-400); box-shadow:0 0 0 0 rgba(251,191,36,.7); animation:pulse-ring 2s infinite;"></span>
                Gratis & Tanpa API Key
              </div>
              <h1>Buat Bank Soal <br/><span style="color:var(--amber-400);">Tanpa Batas.</span></h1>
              <p>Tempel prompt ke AI (ChatGPT/Gemini), olah hasilnya dengan rapi, dan ekspor ke TKA Local Host. Standar Kemendikbud.</p>
              <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:28px;">
                <button class="cta-button" onClick=${() => navigate('/build')}>
                  <${Sparkles} size=${18} /> Mulai Buat Soal
                </button>
                <button class="btn-secondary" onClick=${() => navigate('/paste')} style="height:52px; padding:0 24px; border-radius:10px;">
                  <${ClipboardPaste} size=${18} /> Langsung Tempel
                </button>
              </div>
            </div>

            <!-- ILUSTRASI PREVIEW PREMIUM (STACKED CARDS) -->
            <div class="landing-hero-visual">
              <div class="hero-glow"></div>
              
              <!-- Card 1: Matematika (LaTeX) -->
              <div class="hero-card hero-card-math">
                <div class="hero-card-header">
                  <span class="hero-badge badge-pg">PG · Matematika</span>
                </div>
                <div class="hero-card-q">Tentukan akar dari persamaan berikut:</div>
                <div class="hero-math-display">
                  x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
                </div>
                <div class="hero-options">
                  <div class="hero-opt">A. 2</div>
                  <div class="hero-opt correct">B. 4</div>
                  <div class="hero-opt">C. 6</div>
                </div>
              </div>

              <!-- Card 2: Benar/Salah Mini -->
              <div class="hero-card hero-card-bs">
                <div class="hero-card-header">
                  <span class="hero-badge badge-bs">B/S · IPA</span>
                </div>
                <div class="hero-card-q" style="margin-bottom:8px;">Pernyataan tentang Bumi:</div>
                <div class="hero-bs-row">
                  <span>Bumi itu bulat</span>
                  <span class="hero-bs-key active">B</span>
                  <span class="hero-bs-key">S</span>
                </div>
                <div class="hero-bs-row">
                  <span>Bulan bercahaya</span>
                  <span class="hero-bs-key">B</span>
                  <span class="hero-bs-key active">S</span>
                </div>
              </div>

              <!-- Card 3: Gambar & Referensi -->
              <div class="hero-card hero-card-img">
                <div class="hero-card-header">
                  <span class="hero-badge badge-mcma">MCMA · Geometri</span>
                </div>
                <div style="display:flex; gap:8px; align-items:center; font-size:12px; color:var(--primary); font-weight:600; margin-bottom:4px;">
                  <${ImageIcon} size=${14} /> peta-indonesia.png
                </div>
                <div class="hero-img-preview">
                  <div class="hero-img-placeholder"></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- STEPS & LAINNYA -->
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">1</div>
            <h3 class="step-title">Susun Prompt</h3>
            <p class="step-desc">Isi form, dapatkan prompt siap pakai untuk AI kesayangan Anda.</p>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <h3 class="step-title">Tempel Hasil AI</h3>
            <p class="step-desc">Copy hasil dari AI, paste ke TKA Studio. JSON otomatis dikenali.</p>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <h3 class="step-title">Ekspor ke Local Host</h3>
            <p class="step-desc">Download file .json, impor ke TKA Local Host. Siap untuk ujian.</p>
          </div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 32px; flex-wrap: wrap; justify-content: center;">
            <button class="btn-secondary" onClick=${() => navigate('/expert')} style="border-color: var(--primary-mid); color: var(--primary);">
              <${Sparkles} size=${16} /> Mode Expert (Bertahap)
            </button>
            <button class="btn-secondary" onClick=${() => navigate('/bank-soal')}>
              <${FolderOpen} size=${16} /> Bank Soal Saya
            </button>
            <button class="btn-secondary" onClick=${() => navigate('/pustaka')}>
              <${BookOpen} size=${16} /> Pustaka Soal
            </button>
        </div>

        <div style="margin-top: var(--space-8); font-size: 12px; color: var(--text-subtle);">
          <a href="#/debug" style="display: inline-flex; align-items: center; gap: 4px; color: var(--text-muted); text-decoration: none;">
            <${FlaskConical} size=${14} /> Developer tools (test)
          </a>
        </div>
      </main>
      <${Footer} />
    </div>
  `;
}

// === LAYOUT UNTUK TAMU / MODE BASIC ===
function PublicLayout({ children, profile }) {
  return html`
    <div style="min-height: 100dvh; display: flex; flex-direction: column; background: var(--surface);">
      <${Header} profile=${profile} />
      <main style="flex: 1; position: relative;">
        ${children}
      </main>
    </div>
  `;
}

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
      </main>
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

  const handleLogout = async () => {
    await signOut(); setUser(null); setProfile(null); navigate('/');
  };

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
  
  // === RUTE PUBLIK (Dibungkus PublicLayout dengan Sticky Header) ===
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

  // === RUTE WAJIB LOGIN (AppShell / Sidebar) ===
  const AUTH_ROUTES = ['/bank-soal', '/pustaka', '/kotak', '/expert', '/expert/new'];
  const isAuthRoute = AUTH_ROUTES.some(r => route === r || route.startsWith(r + '/'));

  if (isAuthRoute) {
    if (!user) {
      navigate('/login');
      return html`<div style="padding: 40px; text-align: center;">Mengarahkan ke login...</div>`;
    }
    let PageComponent = null;
    let pageProps = { navigate, profile };

    if (route === '/bank-soal') PageComponent = BankSoalPage;
    else if (route === '/pustaka') PageComponent = PustakaPage;
    else if (route === '/kotak') PageComponent = KotakPage;
    else if (route === '/expert') PageComponent = ExpertListPage;
    else if (route === '/expert/new') PageComponent = ExpertNewPage;
    else if (route.startsWith('/expert/')) {
      PageComponent = ExpertDetailPage;
      pageProps = { navigate, profile, id: route.split('/')[2] };
    }

    if (PageComponent) {
      return html`
        <${AppShell} route=${route} profile=${profile} onLogout=${handleLogout}>
          <${PageComponent} ...${pageProps} />
        </${AppShell}>
      `;
    }
  }

  return html`<div style="text-align:center; padding:50px;"><h1>404</h1><button class="btn-primary" onClick=${() => navigate('/')}>Kembali</button></div>`;
}

render(html`<${ErrorBoundary}><${App} /></${ErrorBoundary}>`, document.getElementById('app'));
