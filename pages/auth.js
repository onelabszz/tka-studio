/**
 * TKA Studio — pages/auth.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h } from 'https://esm.sh/preact@10.24.3';
import { useState } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  GraduationCap, ArrowLeft, Loader2, CheckCircle2, Clock,
  Sparkles, Shield, CloudUpload, X, Check
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { signIn, registerUser } from '../supabase/auth.js';

const html = htm.bind(h);

function AuthBrand() {
  return html`
    <div class="auth-brand">
      <div class="auth-brand-mark"><${GraduationCap} size=${24} /></div>
      <div>
        <div class="auth-brand-name">TKA Studio</div>
        <div class="auth-brand-sub">Jembatan Guru → AI → Local Host</div>
      </div>
    </div>
  `;
}

export function LoginPage({ navigate, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return html`
    <div class="auth-wrap">
      <div class="auth-card">
        <button class="btn-back" onClick=${() => navigate('/')} style="margin-bottom: 20px;">
          <${ArrowLeft} size=${16} /> Beranda
        </button>
        <${AuthBrand} />

        <h1 style="text-align: center; font-size: 20px; margin-bottom: 6px; color: var(--navy-900);">Selamat Datang Kembali</h1>
        <p style="text-align: center; color: var(--text-muted); font-size: 13.5px; margin-bottom: 24px;">
          Masuk untuk mengakses Koleksi Saya dan Mode Expert.
        </p>

        ${error && html`<div class="alert alert-error">${error}</div>`}

        <form onSubmit=${handleSubmit}>
          <div class="form-field">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" required value=${email} onInput=${(e) => setEmail(e.target.value)} placeholder="email@sekolah.com" autoComplete="email" />
          </div>
          <div class="form-field">
            <label class="form-label">Password</label>
            <input class="form-input" type="password" required value=${password} onInput=${(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          <button class="btn-primary btn-large" type="submit" disabled=${loading} style="margin-top: 8px;">
            ${loading ? html`<${Loader2} size=${18} class="spin" /> Memeriksa…` : 'Masuk'}
          </button>
        </form>

        <div class="auth-foot">
          Belum punya akun? <a href="#/register">Daftar Gratis</a>
        </div>
      </div>
    </div>
  `;
}

export function RegisterPage({ navigate }) {
  const [form, setForm] = useState({ nama: '', email: '', wa: '', sekolah: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUser(form.nama, form.email, form.wa, form.sekolah);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (success) {
    return html`
      <div class="auth-wrap">
        <div class="auth-card" style="text-align: center;">
          <div class="auth-status-icon is-success"><${CheckCircle2} size=${40} /></div>
          <h1 style="font-size: 22px; margin-bottom: 10px; color: var(--navy-900);">Pendaftaran Berhasil!</h1>
          <p style="color: var(--text-muted); font-size: 13.5px; line-height: 1.6; margin-bottom: 4px;">
            Akun Anda sedang ditinjau oleh Admin.
          </p>
          <p style="color: var(--text-muted); font-size: 13.5px; line-height: 1.6; margin-bottom: 0;">
            Password akan dikirim via <b style="color: var(--text);">WhatsApp</b> dalam 1×24 jam.
          </p>

          <div class="auth-info-box">
            <div class="auth-info-title"><${Sparkles} size=${14} /> Sambil menunggu, Anda bisa:</div>
            <ul class="auth-info-list">
              <li class="auth-info-item is-yes"><${Check} size=${14} /> Membuat soal dengan Mode Basic</li>
              <li class="auth-info-item is-yes"><${Check} size=${14} /> Mendownload file .json</li>
              <li class="auth-info-item is-no"><${X} size=${14} /> Belum bisa simpan ke Koleksi Saya</li>
            </ul>
          </div>

          <button class="btn-primary btn-large" onClick=${() => navigate('/build')}>
            <${Sparkles} size=${18} /> Mulai Buat Soal
          </button>
        </div>
      </div>
    `;
  }

  return html`
    <div class="auth-wrap">
      <div class="auth-card">
        <button class="btn-back" onClick=${() => navigate('/')} style="margin-bottom: 20px;">
          <${ArrowLeft} size=${16} /> Beranda
        </button>
        <${AuthBrand} />

        <h1 style="text-align: center; font-size: 20px; margin-bottom: 6px; color: var(--navy-900);">Daftar Akun Guru</h1>
        <p style="text-align: center; color: var(--text-muted); font-size: 13.5px; margin-bottom: 24px;">
          Dapatkan akses penuh untuk menyimpan dan membagikan soal.
        </p>

        ${error && html`<div class="alert alert-error">${error}</div>`}

        <form onSubmit=${handleSubmit}>
          <div class="form-field">
            <label class="form-label">Nama Lengkap</label>
            <input class="form-input" required value=${form.nama} onInput=${(e) => setForm({...form, nama: e.target.value})} placeholder="Contoh: Budi Santoso" />
          </div>
          <div class="form-field">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" required value=${form.email} onInput=${(e) => setForm({...form, email: e.target.value})} placeholder="email@sekolah.com" autoComplete="email" />
          </div>
          <div class="form-field">
            <label class="form-label">No. WhatsApp</label>
            <input class="form-input" type="tel" required value=${form.wa} onInput=${(e) => setForm({...form, wa: e.target.value})} placeholder="08123456789" />
            <div class="form-hint">Password akan dikirim ke nomor ini.</div>
          </div>
          <div class="form-field">
            <label class="form-label">Asal Sekolah <span style="color:var(--text-muted); font-weight:400;">(Opsional)</span></label>
            <input class="form-input" value=${form.sekolah} onInput=${(e) => setForm({...form, sekolah: e.target.value})} placeholder="SD Negeri 1" />
          </div>
          <button class="btn-primary btn-large" type="submit" disabled=${loading} style="margin-top: 8px;">
            ${loading ? html`<${Loader2} size=${18} class="spin" /> Mengirim…` : 'Kirim Pendaftaran'}
          </button>
        </form>

        <div class="auth-foot">
          Sudah punya akun? <a href="#/login">Masuk</a>
        </div>
      </div>
    </div>
  `;
}

export function PendingPage({ navigate, onLogout }) {
  return html`
    <div class="auth-wrap">
      <div class="auth-card" style="text-align: center;">
        <div class="auth-status-icon is-pending"><${Clock} size=${40} /></div>
        <h1 style="font-size: 22px; margin-bottom: 10px; color: var(--navy-900);">Menunggu Verifikasi</h1>
        <p style="color: var(--text-muted); font-size: 13.5px; line-height: 1.6; margin-bottom: 0;">
          Terima kasih sudah mendaftar! Saat ini akun Anda sedang ditinjau oleh Admin.
          Password akan dikirim via WhatsApp jika disetujui.
        </p>

        <div class="auth-info-box">
          <div class="auth-info-title"><${Sparkles} size=${14} /> Sambil menunggu, Anda bisa:</div>
          <ul class="auth-info-list">
            <li class="auth-info-item is-yes"><${Check} size=${14} /> Menyusun prompt soal (Mode Basic)</li>
            <li class="auth-info-item is-yes"><${Check} size=${14} /> Melihat preview & quality check</li>
            <li class="auth-info-item is-yes"><${Check} size=${14} /> Download .json untuk Local Host</li>
            <li class="auth-info-item is-no"><${X} size=${14} /> Belum bisa simpan ke Koleksi Saya</li>
            <li class="auth-info-item is-no"><${X} size=${14} /> Belum bisa akses Mode Expert</li>
          </ul>
        </div>

        <button class="btn-primary btn-large" onClick=${() => navigate('/build')} style="margin-bottom: 8px;">
          <${Sparkles} size=${18} /> Mulai Buat Soal
        </button>
        <button class="btn-secondary w-full" onClick=${onLogout} style="height: 44px;">
          Keluar Akun
        </button>
      </div>
    </div>
  `;
}
