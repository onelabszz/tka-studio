import { h } from 'https://esm.sh/preact@10.24.3';
import htm from 'https://esm.sh/htm@3.1.1';
import { AlertTriangle, Info, X } from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';

const html = htm.bind(h);

export function ConfirmModal({ title, message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', onConfirm, onCancel, isDanger = false }) {
  return html`
    <div class="modal-backdrop" onClick=${onCancel}>
      <div class="modal confirm-modal" onClick=${e => e.stopPropagation()}>
        <button class="modal-close" onClick=${onCancel} aria-label="Tutup">
          <${X} size=${18} />
        </button>
        
        <div class="confirm-icon-wrapper ${isDanger ? 'danger' : 'info'}">
          ${isDanger ? html`<${AlertTriangle} size=${32} strokeWidth=${2.5} />` : html`<${Info} size=${32} strokeWidth=${2.5} />`}
        </div>
        
        <h2 class="confirm-title">${title}</h2>
        <p class="confirm-message">${message}</p>
        
        <div class="confirm-actions">
          <button class="btn-secondary" onClick=${onCancel}>${cancelText}</button>
          <button class=${isDanger ? 'btn-danger' : 'btn-primary'} onClick=${onConfirm}>${confirmText}</button>
        </div>
      </div>
    </div>
  `;
}