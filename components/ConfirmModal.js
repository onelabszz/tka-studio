import { h } from 'https://esm.sh/preact@10.24.3';
import htm from 'https://esm.sh/htm@3.1.1';
import { AlertTriangle } from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';

const html = htm.bind(h);

export function ConfirmModal({ title, message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', onConfirm, onCancel, isDanger = false }) {
  return html`
    <div class="modal-backdrop" onClick=${onCancel}>
      <div class="modal" onClick=${e => e.stopPropagation()} style="max-width: 400px; text-align: center; padding: 32px 24px;">
        <div class="modal-icon" style="background: ${isDanger ? '#fee2e2' : 'var(--primary-light)'}; color: ${isDanger ? 'var(--danger)' : 'var(--primary)'};">
          <${AlertTriangle} size=${28} />
        </div>
        <h2 style="font-size: 20px; margin: 0 0 8px; color: var(--navy-900); font-weight: 800;">${title}</h2>
        <p style="color: var(--text-muted); font-size: 14px; margin: 0 0 24px; line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="btn-secondary" onClick=${onCancel} style="flex: 1; height: 44px;">${cancelText}</button>
          <button class=${isDanger ? 'btn-danger' : 'btn-primary'} onClick=${onConfirm} style="flex: 1; height: 44px;">${confirmText}</button>
        </div>
      </div>
    </div>
  `;
}
