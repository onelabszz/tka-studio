/**
 * TKA Studio — components/PageHero.js
 * © 2026 Ekwan Nugroho — Wonogiri
 *
 * Hero card konsisten untuk semua halaman.
 * Props:
 *   icon       - Lucide component
 *   title      - string
 *   subtitle   - string
 *   chips      - array of { icon?, text }
 *   accent     - 'primary' | 'success' | 'warning' (default: primary)
 *   topnav     - JSX elemen (optional, untuk back button + action)
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import htm from 'https://esm.sh/htm@3.1.1';

const html = htm.bind(h);

export function PageHero({ icon: Icon, title, subtitle, chips, accent = 'primary', topnav }) {
  return html`
    <div class="page-hero-wrap">
      ${topnav && html`<div class="page-hero-topnav">${topnav}</div>`}
      <div class=${'page-hero accent-' + accent}>
        <div class="page-hero-main">
          ${Icon && html`
            <div class="page-hero-icon"><${Icon} size=${22} /></div>
          `}
          <div class="page-hero-copy">
            <h1 class="page-hero-title">${title}</h1>
            ${subtitle && html`<p class="page-hero-sub">${subtitle}</p>`}
          </div>
        </div>
        ${chips && chips.length > 0 && html`
          <div class="page-hero-chips">
            ${chips.map(c => html`
              <span class="config-chip">
                ${c.icon && html`<${c.icon} size=${12} />`}
                <span>${c.text}</span>
              </span>
            `)}
          </div>
        `}
      </div>
    </div>
  `;
}
