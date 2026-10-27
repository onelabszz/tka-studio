/**
 * TKA Studio — components/AppShell.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  GraduationCap, Wand2, Sparkles, FolderOpen, BookOpen,
  ShoppingCart, LogOut, Menu, Home, ExternalLink, MonitorPlay, Key
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getKotak } from '../lib/pustaka.js';

const html = htm.bind(h);

const MENU_ITEMS = [
  {
    section: 'DAPUR SOAL',
    items: [
      { path: '/build', label: 'Buat Soal (Basic)', icon: Wand2 },
      { path: '/expert', label: 'Mode Expert (Bertahap)', icon: Sparkles },
    ],
  },
  {
    section: 'ARSIP & KOMUNITAS',
    items: [
      { path: '/bank-soal', label: 'Koleksi Saya', icon: FolderOpen },
      { path: '/pustaka', label: 'Pustaka Soal', icon: BookOpen },
    ],
  },
  {
    section: 'ARSIP ONLINE',
    items: [
      { path: '/exam-list', label: 'Kode Ujian Saya', icon: Key },
    ],
  },
];

export function AppShell({ children, route, profile, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [route]);
  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const isActive = (path) => {
    if (path === '/expert') return route === '/expert' || route.startsWith('/expert/');
    if (path === '/bank-soal') return route === '/bank-soal' || route === '/kotak';
    return route === path || route.startsWith(path + '/');
  };

  const handleNav = (path) => {
    window.location.hash = path;
    setDrawerOpen(false);
  };

  const sidebarContent = html`
    <div class="sidebar-brand" onClick=${() => handleNav('/')}>
      <div class="sidebar-logo"><${GraduationCap} size=${22} strokeWidth=${2} /></div>
      <div>
        <div class="sidebar-brand-name">TKA Studio</div>
        <div class="sidebar-brand-sub">Wonogiri</div>
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <nav class="sidebar-nav">
      ${MENU_ITEMS.filter(group => {
        // Sembunyikan grup ARSIP ONLINE jika tidak punya izin
        if (group.section === 'ARSIP ONLINE') {
          return profile?.role === 'admin' || profile?.can_publish_exam === true;
        }
        return true;
      }).map(group => html`
        <div class="sidebar-section">
          <div class="sidebar-section-label">${group.section}</div>
          ${group.items.map(item => {
            // ...
            const Icon = item.icon;
            const active = isActive(item.path);
            return html`
              <a class=${'sidebar-item' + (active ? ' active' : '')}
                 onClick=${() => handleNav(item.path)}>
                <${Icon} size=${18} strokeWidth=${active ? 2.5 : 2} />
                <span>${item.label}</span>
              </a>
            `;
          })}
        </div>
      `)}
    </nav>

    <!-- Tombol Pintas ke TKA Local Host -->
    <div style="padding: 0 12px 16px;">
      <a href="https://onelabszz.github.io/tka-local/docs/" target="_blank" class="sidebar-item" style="background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.2); color: var(--amber-400);">
        <${MonitorPlay} size=${18} />
        <span>TKA Local Host</span>
        <${ExternalLink} size=${14} style="margin-left: auto; opacity: 0.7;" />
      </a>
    </div>

    <div class="sidebar-divider"></div>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-avatar">${(profile?.nama || 'U')[0].toUpperCase()}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${profile?.nama || 'Pengguna'}</div>
          <div class="sidebar-user-sub">${profile?.sekolah || profile?.email || ''}</div>
        </div>
      </div>
      <button class="sidebar-logout" onClick=${onLogout} title="Keluar"><${LogOut} size=${16} /></button>
    </div>
  `;

  return html`
    <div class="app-layout">
      <header class="app-mobile-header">
        <button class="app-mobile-menu-btn" onClick=${() => setDrawerOpen(true)} aria-label="Menu"><${Menu} size=${22} /></button>
        <div class="app-mobile-brand"><${GraduationCap} size=${20} /><span>TKA Studio</span></div>
        <div style="width: 36px;"></div>
      </header>

      <aside class=${'app-sidebar' + (drawerOpen ? ' drawer-open' : '')}>${sidebarContent}</aside>
      ${drawerOpen && html`<div class="app-overlay" onClick=${() => setDrawerOpen(false)}></div>`}
      <main class="app-main">${children}</main>
    </div>
  `;
}
