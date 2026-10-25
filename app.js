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
  Save, ListChecks, MousePointerClick, Bot, Download, MonitorPlay
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
            <a href="#/fitur" onClick=${(e) => { e.preventDefault(); document.getElementById('fitur')?.scrollIntoView({behavior: 'smooth'}); }}>Fitur</a>
            <a href="#/ekosistem" onClick=${(e) => { e.preventDefault(); document.getElementById('ekosistem')?.scrollIntoView({behavior: 'smooth'}); }}>Ekosistem TKA</a>
            <a href="#/faq" onClick=${(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({behavior: 'smooth'}); }}>FAQ</a>
          </nav>
        `}

        <div class="header-actions">
          ${profile ? html`<button class="btn-nav-login" onClick=${() => navigate('/build')}><${LayoutDashboard} size=${16} /> Dashboard</button>`
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
            <div class="footer-desc">Alat bantu guru Indonesia untuk menyusun bank soal berkualitas. Langsung ekspor ke TKA Local Host.</div>
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
      <div class="footer-copy">© 2026 Ekwan Nugroho — Wonogiri · Dibuat untuk pendidikan Indonesia</div>
    </footer>
  `;
}

function Landing({ profile }) {
  return html`
    <div class="landing">
      <${Header} profile=${profile} isLanding=${true} />
      
      <!-- HERO SECTION FULL WIDTH -->
      <section class="hero-section">
        <div class="hero-bg-grid"></div>
        <div class="hero-bg-glow"></div>
        <div class="hero-bg-glow-2"></div>
        
        <div class="hero-container">
          <div class="hero-copy">
            <div class="badge-hero"><span class="dot"></span> Gratis · Tanpa API Key · Tanpa Login</div>
            <h1 class="hero-title">
              Buat Paket Soal <br/>
              <span class="highlight">Tryout TKA</span> dalam 15 Menit
            </h1>
            <p class="hero-desc">
              Alat bantu guru Indonesia untuk menyusun bank soal berkualitas. Langsung ekspor ke TKA Local Host.
            </p>
            <div class="hero-actions">
              <button class="cta-button" onClick=${() => navigate('/build')}>
                <${Sparkles} size=${20} /> Buat Soal (Basic)
              </button>
              <button class="btn-secondary" onClick=${() => navigate('/expert')} style="height: 56px; border-radius: 10px; padding: 0 24px; background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); color: white; font-weight: 600; font-size: 15px; display: inline-flex; align-items: center; gap: 8px;">
                <${Star} size=${18} /> Mode Expert (Bertahap)
              </button>
            </div>
            <div class="hero-guide-link">
              Belum tahu cara pakai? <a href="./panduan/">Baca Panduan Lengkap →</a>
            </div>
            <div class="hero-trust" style="margin-top: 24px;">
              <span><${Check} size=${16} /> Tanpa daftar</span>
              <span><${Check} size=${16} /> Data aman</span>
              <span><${Check} size=${16} /> Standar Asesmen</span>
            </div>
          </div>

          <div class="hero-visual">
            <div class="visual-glow"></div>
            <div class="v-card v-card-math">
              <div class="v-header"><span class="v-badge badge-pg">PG · Matematika</span></div>
              <div class="v-q">Tentukan hasil dari:</div>
              <div class="v-math-box">3 ½ + 2 ¼</div>
              <div class="v-opts">
                <div class="v-opt correct">A. 5 \frac{3}{4}</div>
                <div class="v-opt">B. 5 \frac{1}{2}</div>
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
        <!-- EKOSISTEM TKA (Jembatan) -->
        <section class="section-ekosistem" id="ekosistem" style="background: white; border-bottom: 1px solid var(--border);">
          <div class="section-container">
            <div class="section-header">
              <h2>Ekosistem TKA</h2>
              <p>Bagaimana TKA Studio terhubung dengan aplikasi ujian offline Anda.</p>
            </div>
            
            <div class="bridge-flow">
              <div class="bridge-node">
                <div class="bridge-icon" style="background: #dbeafe; color: #1e40af;"><${Sparkles} size=${32} /></div>
                <h3>TKA Studio</h3>
                <p>Menyusun soal dengan AI (Online)</p>
              </div>
              <div class="bridge-arrow">
                <${FileJson} size=${24} color="#64748b" />
                <span>File .json</span>
                <${ArrowRight} size=${24} color="#cbd5e1" />
              </div>
              <div class="bridge-node">
                <div class="bridge-icon" style="background: #fef3c7; color: #92400e;"><${MonitorPlay} size=${32} /></div>
                <h3>TKA Local Host</h3>
                <p>Menjalankan ujian (Offline)</p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://onelabszz.github.io/tka-local/docs/" target="_blank" class="btn-secondary" style="text-decoration: none;">
                Pelajari TKA Local Host <${ArrowRight} size=${16} />
              </a>
            </div>
          </div>
        </section>

        <!-- 3 LANGKAH -->
        <section class="section-steps" id="cara">
          <div class="section-container">
            <div class="section-header">
              <h2>Hanya 3 Langkah</h2>
              <p>Tidak perlu keahlian IT. Guru biasa pun bisa menjalankannya.</p>
            </div>
            <div class="grid-3">
              <div class="step-card">
                <div class="step-visual"><div class="mock-form"><div class="mock-input"></div><div class="mock-input"></div><div class="mock-btn">Buat Prompt</div></div></div>
                <div class="step-content"><div class="step-num">1</div><h3>Susun Prompt</h3><p>Isi form, AI siapkan prompt khusus untuk Anda copy.</p></div>
              </div>
              <div class="step-card">
                <div class="step-visual"><div class="mock-chat"><div class="mock-chat-bubble user"></div><div class="mock-chat-bubble bot"></div><div class="mock-chat-bubble bot short"></div></div></div>
                <div class="step-content"><div class="step-num">2</div><h3>Tempel ke AI</h3><p>Buka ChatGPT/Gemini, paste prompt, copy hasil JSON-nya.</p></div>
              </div>
              <div class="step-card">
                <div class="step-visual"><div class="mock-export"><${FileJson} size=${32} color="#1e40af" /><div class="mock-download-btn"><${Download} size=${14} /> .json</div></div></div>
                <div class="step-content"><div class="step-num">3</div><h3>Ekspor ke Local Host</h3><p>Paste di TKA Studio, download .json, impor ke Local Host.</p></div>
              </div>
            </div>
          </div>
        </section>

        <!-- FITUR -->
        <section class="section-features" id="fitur">
          <div class="section-container">
            <div class="section-header"><h2>Yang Membuat Berbeda</h2></div>
            <div class="grid-2">
              <div class="feature-card">
                <div class="feature-icon-wrapper"><${Star} size=${28} /></div>
                <h3>Mode Expert</h3>
                <p>Susun soal bertahap (5 soal/batch) agar kualitasnya maksimal. Cocok untuk ujian resmi.</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon-wrapper"><${Users} size=${28} /></div>
                <h3>Pustaka Gotong Royong</h3>
                <p>Berbagi soal terbaik dengan guru lain. Nama Anda tercatat sebagai penulis soal.</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon-wrapper"><${FileJson} size=${28} /></div>
                <h3>Dukungan Rumus (LaTeX)</h3>
                <p>Pecahan, akar, pangkat tampil cantik di preview dan file ekspor.</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon-wrapper"><${Save} size=${28} /></div>
                <h3>Format Standar</h3>
                <p>File JSON langsung terbaca. Mendukung soal wacana panjang dan soal bergambar.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- FAQ -->
        <section class="section-faq" id="faq">
          <div class="section-container">
            <div class="section-header"><h2>Pertanyaan Umum</h2></div>
            <div class="faq-list">
              <details class="faq-item"><summary>Apakah ini benar-benar gratis?</summary><p>Ya, 100% gratis untuk fitur dasar.</p></details>
              <details class="faq-item"><summary>Apakah ini terafiliasi dengan instansi pemerintah?</summary><p>Tidak. TKA Studio adalah alat bantu independen.</p></details>
              <details class="faq-item"><summary>Soal saya aman?</summary><p>Soal tersimpan di browser Anda. Hanya yang Anda bagikan ke Pustaka yang masuk server.</p></details>
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
  
  if (route === '/build' || route === '/paste' || route === '/preview' || route === '/export') {
    let PageComponent = null;
    let pageProps = { navigate, profile };
    if (route === '/build') PageComponent = BuildPage;
    else if (route === '/paste') PageComponent = PastePage;
    else if (route === '/preview') PageComponent = PreviewPage;
    else if (route === '/export') PageComponent = ExportPage;
    
    // Cek apakah draft datang dari Expert Mode
    let fromExpert = null;
    try {
      const d = JSON.parse(localStorage.getItem('tka-studio-draft-v1') || '{}');
      fromExpert = d?._fromExpert || null;
    } catch {}
    
    // Jika dari Expert dan user login → pakai AppShell (sidebar tetap)
    if (fromExpert && user) {
      return html`
        <${AppShell} route=${route} profile=${profile} onLogout=${handleLogout}>
          <${PageComponent} ...${pageProps} />
        </${AppShell}>
      `;
    }
    
    // Selain itu → PublicLayout (no sidebar)
    return html`<${PublicLayout} profile=${profile}><${PageComponent} ...${pageProps} /></${PublicLayout}>`;
  }

  if (route === '/pending') return html`<${PendingPage} navigate=${navigate} onLogout=${handleLogout} />`;

  const AUTH_ROUTES = ['/bank-soal', '/pustaka', '/kotak', '/expert', '/expert/new'];
  if (AUTH_ROUTES.some(r => route === r || route.startsWith(r + '/'))) {
    if (!user) { navigate('/login'); return html`<div style="padding: 40px; text-align: center;">Mengarahkan ke login...</div>`; }
    let PageComponent = null; let pageProps = { navigate, profile };
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
