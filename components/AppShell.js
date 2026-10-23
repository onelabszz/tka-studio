/**
 * TKA Studio — components/AppShell.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  GraduationCap, Wand2, Sparkles, FolderOpen, BookOpen,
  ShoppingCart, LogOut, Menu, Home,
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getKotak } from '../lib/pustaka.js';

const html = htm.bind(h);

const MENU_ITEMS = [
  {
    section: 'UTAMA',
    items: [
      { path: '/build', label: 'Buat Soal', icon: Wand2 },
      { path: '/expert', label: 'Mode Expert', icon: Sparkles },
    ],
  },
  {
    section: 'KOLEKSI',
    items: [
      { path: '/bank-soal', label: 'Bank Soal Saya', icon: FolderOpen },
      { path: '/pustaka', label: 'Pustaka Soal', icon: BookOpen },
      { path: '/kotak', label: 'Kotak Saya', icon: ShoppingCart, badge: 'kotak' },
    ],
  },
];

export function AppShell({ children, route, profile, onLogout }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [kotakCount, setKotakCount] = useState(0);

  useEffect(() => {
    setKotakCount(getKotak().length);
  }, [route]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [route]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const isActive = (path) => {
    if (path === '/expert') return route === '/expert' || route.startsWith('/expert/');
    return route === path || route.startsWith(path + '/');
  };

  const handleNav = (path) => {
    window.location.hash = path;
    setDrawerOpen(false);
  };

  const sidebarContent = html`
    <div class="sidebar-brand" onClick=${() => handleNav('/')}>
      <div class="sidebar-logo">
        <${GraduationCap} size=${22} strokeWidth=${2} />
      </div>
      <div>
        <div class="sidebar-brand-name">TKA Studio</div>
        <div class="sidebar-brand-sub">Wonogiri</div>
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <nav class="sidebar-nav">
      ${MENU_ITEMS.map(group => html`
        <div class="sidebar-section">
          <div class="sidebar-section-label">${group.section}</div>
          ${group.items.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const badge = item.badge === 'kotak' && kotakCount > 0 ? kotakCount : null;
            return html`
              <a class=${'sidebar-item' + (active ? ' active' : '')}
                 onClick=${() => handleNav(item.path)}>
                <${Icon} size=${18} strokeWidth=${active ? 2.5 : 2} />
                <span>${item.label}</span>
                ${badge !== null && html`<span class="sidebar-badge">${badge}</span>`}
              </a>
            `;
          })}
        </div>
      `)}
    </nav>

    <a class=${'sidebar-item sidebar-home' + (route === '/' ? ' active' : '')}
       onClick=${() => handleNav('/')}>
      <${Home} size=${18} strokeWidth=${2} />
      <span>Beranda</span>
    </a>

    <div class="sidebar-divider"></div>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-avatar">
          ${(profile?.nama || 'U')[0].toUpperCase()}
        </div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${profile?.nama || 'Pengguna'}</div>
          <div class="sidebar-user-sub">${profile?.sekolah || profile?.email || ''}</div>
        </div>
      </div>
      <button class="sidebar-logout" onClick=${onLogout} title="Keluar">
        <${LogOut} size=${16} />
      </button>
    </div>
  `;

  return html`
    <div class="app-layout">
      <header class="app-mobile-header">
        <button class="app-mobile-menu-btn" onClick=${() => setDrawerOpen(true)} aria-label="Menu">
          <${Menu} size=${22} />
        </button>
        <div class="app-mobile-brand">
          <${GraduationCap} size=${20} />
          <span>TKA Studio</span>
        </div>
        <div style="width: 36px;"></div>
      </header>

      <aside class=${'app-sidebar' + (drawerOpen ? ' drawer-open' : '')}>
        ${sidebarContent}
      </aside>

      ${drawerOpen && html`<div class="app-overlay" onClick=${() => setDrawerOpen(false)}></div>`}

      <main class="app-main">
        ${children}
      </main>
    </div>
  `;
}
