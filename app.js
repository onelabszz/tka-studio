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
  Check, Clock, Shield, Zap, FileJson
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
      <div style="margin-bottom: 16px;">
        <b>TKA Studio</b> · Pelengkap TKA Local Host
      </div>
      <div style="display: flex; gap: 16px; justify-content: center; margin-bottom: 16px; font-size: 13px;">
        <a href="#/panduan" onClick=${(e) => { e.preventDefault(); window.location.href = './panduan/'; }}>Panduan Lengkap</a>
        <a href="https://wa.me/6281234567890" target="_blank">Bantuan WhatsApp</a>
      </div>
      © 2026 Ekwan Nugroho — Wonogiri
    </footer>
  `;
}

function Landing({ profile }) {
  return html`
    <div class="landing">
      <${Header} profile=${profile} />
      
      <main class="landing-main" style="max-width: 1000px;">
        
        <!-- HERO -->
        <section class="landing-hero">
          <div class="landing-hero-grid">
            <div class="landing-hero-copy">
              <div class="badge-hero">
                <span class="dot"></span> Gratis · Tanpa API Key · Tanpa Login
              </div>
              <h1 style="font-size: 52px; line-height: 1.1; margin-bottom: 20px;">
                Buat 40 Soal TKA<br/>
                <span style="color: var(--amber-400);">dalam 15 Menit.</span>
              </h1>
              <p style="font-size: 18px; line-height: 1.6; color: rgba(255,255,255,0.8); margin-bottom: 32px;">
                Alat bantu guru Indonesia untuk menyusun bank soal TKA berkualitas standar Kemendikbud. Langsung ekspor ke TKA Local Host.
              </p>
              <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <button class="cta-button" onClick=${() => navigate('/build')} style="font-size: 16px; padding: 0 32px;">
                  <${Sparkles} size=${20} /> Mulai Buat Soal
                </button>
                <button class="btn-secondary" onClick=${() => window.location.href = './panduan/'} style="height: 52px; border-radius: 10px; color: white; border-color: rgba(255,255,255,0.3);">
                  <${BookOpen} size=${18} /> Lihat Panduan
                </button>
              </div>
              <div style="margin-top: 24px; display: flex; gap: 16px; font-size: 13px; color: rgba(255,255,255,0.6);">
                <span><${Check} size=${14} style="vertical-align:-2px;" /> Tanpa daftar</span>
                <span><${Check} size=${14} style="vertical-align:-2px;" /> Data aman</span>
                <span><${Check} size=${14} style="vertical-align:-2px;" /> Standar Kemendikbud</span>
              </div>
            </div>
            
            <!-- Ilustrasi Hero (CSS Based Placeholder) -->
            <div class="landing-hero-visual">
              <div class="hero-glow"></div>
              <div class="hero-card hero-card-math">
                <div class="hero-card-header"><span class="hero-badge badge-pg">PG · Matematika</span></div>
                <div class="hero-card-q">Tentukan hasil dari:</div>
                <div class="hero-math-display">3 \frac{1}{2} + 2 \frac{1}{4}</div>
                <div class="hero-options">
                  <div class="hero-opt correct">A. 5 \frac{3}{4}</div>
                  <div class="hero-opt">B. 5 \frac{1}{2}</div>
                </div>
              </div>
              <div class="hero-card hero-card-bs">
                <div class="hero-card-header"><span class="hero-badge badge-bs">B/S · IPA</span></div>
                <div class="hero-card-q">Pernyataan tentang Bumi:</div>
                <div class="hero-bs-row"><span>Bumi itu bulat</span><span class="hero-bs-key active">B</span></div>
                <div class="hero-bs-row"><span>Bulan bercahaya</span><span class="hero-bs-key active">S</span></div>
              </div>
            </div>
          </div>
        </section>

        <!-- PAIN POINTS -->
        <section style="padding: 60px 0;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="font-size: 28px; font-weight: 800; color: var(--navy-900);">Guru Bukan Malas. Guru Cuma Tidak Punya Waktu.</h2>
            <p style="color: var(--text-muted); font-size: 16px;">Menyusun soal manual butuh 3-4 jam. TKA Studio memangkasnya jadi 15 menit.</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
            <div class="step-card" style="text-align: center; padding: 32px 20px;">
              <div style="font-size: 40px; margin-bottom: 16px;">⏱️</div>
              <h3 style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">Hemat Waktu</h3>
              <p style="color: var(--text-muted); font-size: 14px;">Copy-paste ke AI, langsung jadi 40 soal rapi.</p>
            </div>
            <div class="step-card" style="text-align: center; padding: 32px 20px;">
              <div style="font-size: 40px; margin-bottom: 16px;">✅</div>
              <h3 style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">Kualitas Terjamin</h3>
              <p style="color: var(--text-muted); font-size: 14px;">Prompt dikunci agar sesuai standar HOTS Pusmendik.</p>
            </div>
            <div class="step-card" style="text-align: center; padding: 32px 20px;">
              <div style="font-size: 40px; margin-bottom: 16px;">🔒</div>
              <h3 style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">Privasi Aman</h3>
              <p style="color: var(--text-muted); font-size: 14px;">Data soal tersimpan di browser Anda, bukan di server kami.</p>
            </div>
          </div>
        </section>

        <!-- 3 LANGKAH -->
        <section style="padding: 40px 0; border-top: 1px solid var(--border);">
          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="font-size: 28px; font-weight: 800; color: var(--navy-900);">Hanya 3 Langkah</h2>
          </div>
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-number">1</div>
              <h3 class="step-title">Susun Prompt</h3>
              <p class="step-desc">Isi form (mapel, kelas, topik). AI siapkan prompt khusus untuk Anda copy.</p>
            </div>
            <div class="step-card">
              <div class="step-number">2</div>
              <h3 class="step-title">Tempel ke AI</h3>
              <p class="step-desc">Buka ChatGPT/Gemini, paste prompt tadi. Copy hasil JSON-nya.</p>
            </div>
            <div class="step-card">
              <div class="step-number">3</div>
              <h3 class="step-title">Ekspor ke Local Host</h3>
              <p class="step-desc">Paste hasil di TKA Studio, download file .json, impor ke Local Host.</p>
            </div>
          </div>
        </section>

        <!-- FITUR UNGGULAN -->
        <section style="padding: 60px 0; border-top: 1px solid var(--border);">
          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="font-size: 28px; font-weight: 800; color: var(--navy-900);">Yang Membuat Berbeda</h2>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <div class="step-card">
              <h3 class="step-title">🎯 Mode Expert</h3>
              <p class="step-desc">Susun soal sedikit demi sedikit (5 soal/batch) agar kualitasnya maksimal. Cocok untuk ujian resmi.</p>
            </div>
            <div class="step-card">
              <h3 class="step-title">🤝 Pustaka Gotong Royong</h3>
              <p class="step-desc">Berbagi soal terbaik dengan guru lain. Nama Anda tercatat sebagai penulis soal.</p>
            </div>
            <div class="step-card">
              <h3 class="step-title">📐 Dukungan Rumus (LaTeX)</h3>
              <p class="step-desc">Pecahan, akar, pangkat tampil cantik di preview dan file ekspor.</p>
            </div>
            <div class="step-card">
              <h3 class="step-title">📤 Kompatibel Local Host</h3>
              <p class="step-desc">File JSON langsung terbaca. Mendukung soal wacana panjang (B.Indo) dan soal bergambar.</p>
            </div>
          </div>
        </section>

        <!-- DIBUAT OLEH -->
        <section style="padding: 60px 0; border-top: 1px solid var(--border);">
          <div style="background: white; border: 1px solid var(--border); border-radius: 24px; padding: 40px; display: flex; align-items: center; gap: 32px; flex-wrap: wrap; justify-content: center;">
            <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--primary-mid)); color: white; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 800; box-shadow: 0 10px 24px rgba(30,64,175,0.3);">
              E
            </div>
            <div style="flex: 1; min-width: 280px;">
              <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">Dibuat oleh Guru, untuk Guru</h3>
              <p style="color: var(--text-muted); font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
                "Saya tahu rasanya menyusun soal sampai tengah malam. TKA Studio lahir dari kebutuhan saya sendiri, dan saya bagikan gratis untuk memajukan pendidikan Indonesia."
              </p>
              <div style="font-weight: 700; color: var(--navy-900);">Ekwan Nugroho</div>
              <div style="color: var(--text-muted); font-size: 13px;">Guru & Pengembang — Wonogiri</div>
            </div>
          </div>
        </section>

        <!-- FAQ -->
        <section style="padding: 60px 0; border-top: 1px solid var(--border); margin-bottom: 40px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="font-size: 28px; font-weight: 800; color: var(--navy-900);">Pertanyaan Umum</h2>
          </div>
          <div style="max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px;">
            <details class="faq-item">
              <summary>Apakah ini benar-benar gratis?</summary>
              <p>Ya, 100% gratis. Kami tidak memungut biaya, tidak menjual data, dan tidak memaksa Anda mendaftar untuk menggunakan Mode Basic.</p>
            </details>
            <details class="faq-item">
              <summary>Apakah ini terafiliasi dengan Kemendikbud?</summary>
              <p>Tidak. TKA Studio adalah alat bantu independen. Namun, prompt kami dirancang mengikuti standar Pusmendik (seperti soal berbasis teks, HOTS, dan distribusi kognitif).</p>
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
