import { h, render } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { CheckCircle2, AlertTriangle, Info, X } from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';

const html = htm.bind(h);

// Fungsi global untuk memanggil toast dari mana saja
window.showToast = function(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('tka-toast', { detail: { message, type } }));
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message: e.detail.message, type: e.detail.type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    window.addEventListener('tka-toast', handleToast);
    return () => window.removeEventListener('tka-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return html`
    <div class="toast-container">
      ${toasts.map(t => html`
        <div class="toast toast-${t.type}">
          <div class="toast-icon">
            ${t.type === 'success' ? html`<${CheckCircle2} size=${18} />` : 
              t.type === 'error' ? html`<${AlertTriangle} size=${18} />` : 
              html`<${Info} size=${18} />`}
          </div>
          <div class="toast-msg">${t.message}</div>
          <button class="toast-close" onClick=${() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
            <${X} size=${14} />
          </button>
        </div>
      `)}
    </div>
  `;
}

// Render container ke dalam body (di luar app utama agar z-index aman)
const toastDiv = document.createElement('div');
document.body.appendChild(toastDiv);
render(html`<${ToastContainer} />`, toastDiv);
