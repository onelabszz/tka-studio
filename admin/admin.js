/**
 * TKA Studio — Admin Panel
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h, render } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  GraduationCap, LogOut, RefreshCw, UserCheck, Clock, Check, Copy,
  ExternalLink, CheckCircle2, Users, Ban, Trash2, Search, X,
  ChevronLeft, ChevronRight, BookOpen, Shield, Download, FileText
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';

const html = htm.bind(h);

const SUPABASE_URL = 'https://zrzbitqfrvtgmxeqnyhi.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyemJpdHFmcnZ0Z214ZXFueWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NDA1ODUsImV4cCI6MjEwODIxNjU4NX0.xGZesUy6jrkcXGGg3N-uYgqNjRl7jtHEbqoBQN1IEpQ';

const PAGE_SIZE = 10;

let sb = null;
async function getSupabase() {
  if (sb) return sb;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'tka-admin-auth' },
  });
  return sb;
}

function formatDate(iso) {
  if (!iso) return '-';
  try { return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function waLink(wa, message) {
  if (!wa) return null;
  let num = String(wa).replace(/\D/g, '');
  if (num.startsWith('0')) num = '62' + num.slice(1);
  else if (num.startsWith('8')) num = '62' + num;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

function waMessage(nama, email, password) {
  return `Halo ${nama || 'Bapak/Ibu'}!\n\nAkun TKA Studio Anda sudah aktif. 🎉\n\nLogin di: https://onelabszz.github.io/tka-studio/#/login\nEmail: ${email}\nPassword: ${password}\n\nPassword ini digenerate otomatis. Mohon disimpan di tempat aman.\n\nTerima kasih,\nEkwan Nugroho\nTKA Studio — Wonogiri`;
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok;
  }
}

function exportToCSV(users) {
  const header = ['Nama', 'Email', 'WhatsApp', 'Sekolah', 'Status', 'Role', 'Tanggal Daftar'];
  const rows = users.map(u => [
    `"${u.nama || ''}"`, `"${u.email}"`, `"${u.wa || ''}"`, `"${u.sekolah || ''}"`,
    u.status, u.role, new Date(u.created_at).toLocaleDateString('id-ID')
  ]);
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Data_Guru_TKA_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const client = await getSupabase();
      const { data, error: err } = await client.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      const { data: profile, error: pErr } = await client.from('profiles').select('role,status,nama').eq('id', data.user.id).single();
      if (pErr || !profile) { setError('Profil tidak ditemukan.'); await client.auth.signOut(); setLoading(false); return; }
      if (profile.role !== 'admin') { setError('Akun ini bukan admin.'); await client.auth.signOut(); setLoading(false); return; }
      if (profile.status !== 'active') { setError('Akun admin belum aktif.'); await client.auth.signOut(); setLoading(false); return; }
      onLogin(data.session, profile);
    } catch (e) { setError(String(e?.message || e)); setLoading(false); }
  };

  return html`
    <div class="login-wrap">
      <div class="login-card">
        <div class="brand" style="margin-bottom: 20px; justify-content: center;">
          <${GraduationCap} size=${24} strokeWidth=${2} />
          <span>TKA Studio <small>Admin</small></span>
        </div>
        <h1>Masuk sebagai Admin</h1>
        <p>Panel ini hanya untuk pengelola TKA Studio.</p>
        ${error && html`<div class="alert alert-error">${error}</div>`}
        <form onSubmit=${handleSubmit}>
          <div class="field"><label>Email</label><input class="input" type="email" required value=${email} onInput=${(e) => setEmail(e.target.value)} placeholder="admin@example.com" /></div>
          <div class="field"><label>Password</label><input class="input" type="password" required value=${password} onInput=${(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
          <button class="btn btn-primary" type="submit" disabled=${loading}>${loading ? 'Memeriksa...' : 'Masuk'}</button>
        </form>
      </div>
    </div>
  `;
}

function PasswordModal({ data, onClose }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => { const ok = await copyText(data.password); if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); } };
  const link = waLink(data.wa, waMessage(data.nama, data.email, data.password));
  return html`
    <div class="modal-backdrop" onClick=${onClose}>
      <div class="modal" style="position: relative;" onClick=${(e) => e.stopPropagation()}>
        <button class="modal-close" onClick=${onClose}>×</button>
        <h2><${CheckCircle2} size=${20} color="var(--success)" /> Akun Aktif</h2>
        <div class="info-row"><span class="info-label">Nama</span><span>${data.nama || '-'}</span></div>
        <div class="info-row"><span class="info-label">Email</span><span>${data.email}</span></div>
        <div class="info-row"><span class="info-label">WhatsApp</span><span>${data.wa || '-'}</span></div>
        <div style="margin-top: 16px; font-size: 12px; color: var(--text-muted);">Password yang digenerate:</div>
        <div class="password-box"><span>${data.password}</span><button onClick=${handleCopy} title="Salin">${copied ? html`<${Check} size=${18} />` : html`<${Copy} size=${18} />`}</button></div>
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">Password ini hanya ditampilkan sekali. Salin dan kirim ke guru via WhatsApp sekarang.</div>
        ${link ? html`<a class="btn btn-primary" href=${link} target="_blank" rel="noopener"><${ExternalLink} size=${16} /> Kirim via WhatsApp</a>` : html`<div class="alert alert-error">Nomor WA tidak tersedia.</div>`}
        <button class="btn btn-secondary" style="margin-top: 8px; width: 100%;" onClick=${onClose}>Tutup</button>
      </div>
    </div>
  `;
}

function Dashboard({ session, profile, onLogout }) {
  const [view, setView] = useState('users'); // 'users' atau 'pustaka'
  
  // State User
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // State Pustaka
  const [pustaka, setPustaka] = useState([]);
  const [searchPustaka, setSearchPustaka] = useState('');
  const [pagePustaka, setPagePustaka] = useState(1);

  // State Global
  const [stats, setStats] = useState({ users: 0, pustaka: 0, workspaces: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(null);
  const [modalData, setModalData] = useState(null);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const client = await getSupabase();
      
      // Ambil Statistik
      const [{ count: cUsers }, { count: cPustaka }, { count: cWork }] = await Promise.all([
        client.from('profiles').select('*', { count: 'exact', head: true }),
        client.from('pustaka_soal').select('*', { count: 'exact', head: true }),
        client.from('expert_workspaces').select('*', { count: 'exact', head: true })
      ]);
      setStats({ users: cUsers || 0, pustaka: cPustaka || 0, workspaces: cWork || 0 });

      // Ambil Users
      const { data: uData, error: uErr } = await client.from('profiles').select('id,email,nama,wa,sekolah,kota,status,role,created_at,verified_at').order('created_at', { ascending: false });
      if (uErr) throw uErr;
      setUsers(uData || []);

      // Ambil Pustaka
      const { data: pData, error: pErr } = await client.from('pustaka_soal').select('*').order('created_at', { ascending: false });
      if (pErr) throw pErr;
      setPustaka(pData || []);

      setLoading(false);
    } catch (e) { setError(String(e?.message || e)); setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setPage(1); }, [tab, search]);
  useEffect(() => { setPagePustaka(1); }, [searchPustaka]);

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  // === LOGIKA USER ===
  const counts = useMemo(() => ({
    pending: users.filter(u => u.status === 'pending' && u.role !== 'admin').length,
    active: users.filter(u => u.status === 'active' && u.role !== 'admin').length,
    suspended: users.filter(u => u.status === 'suspended' && u.role !== 'admin').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    let list = users.filter(u => u.status === tab && u.role !== 'admin');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => String(u.nama||'').toLowerCase().includes(q) || String(u.email||'').toLowerCase().includes(q) || String(u.sekolah||'').toLowerCase().includes(q));
    }
    return list;
  }, [users, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleActivate = async (user) => {
    if (!confirm(`Aktifkan akun ${user.nama || user.email}?`)) return;
    setBusy(user.id);
    try {
      const client = await getSupabase();
      const res = await fetch(SUPABASE_URL + '/functions/v1/activate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token, 'apikey': SUPABASE_ANON },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setBusy(null); return; }
      setModalData({ ...data, wa: user.wa, nama: user.nama || data.nama });
      await loadData();
    } catch (e) { setError(String(e)); }
    setBusy(null);
  };

  const handleSuspend = async (user) => {
    if (!confirm(`Nonaktifkan ${user.nama}?`)) return;
    setBusy(user.id);
    const client = await getSupabase();
    await client.from('profiles').update({ status: 'suspended' }).eq('id', user.id);
    await loadData(); flashSuccess('User dinonaktifkan'); setBusy(null);
  };

  const handleReactivate = async (user) => {
    if (!confirm(`Aktifkan kembali ${user.nama}?`)) return;
    setBusy(user.id);
    const client = await getSupabase();
    await client.from('profiles').update({ status: 'active' }).eq('id', user.id);
    await loadData(); flashSuccess('User diaktifkan kembali'); setBusy(null);
  };

  const handleMakeAdmin = async (user) => {
    if (!confirm(`Jadikan ${user.nama} sebagai Admin?\n\nMereka akan bisa mengakses halaman admin ini.`)) return;
    setBusy(user.id);
    const client = await getSupabase();
    await client.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    await loadData(); flashSuccess('User diangkat menjadi Admin'); setBusy(null);
  };

  const handleDeleteUser = async (user) => {
    if (prompt(`Ketik "HAPUS" untuk menghapus permanen ${user.nama}`) !== 'HAPUS') return;
    setBusy(user.id);
    try {
      const res = await fetch(SUPABASE_URL + '/functions/v1/delete-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token, 'apikey': SUPABASE_ANON },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) { setError('Gagal hapus user'); setBusy(null); return; }
      await loadData(); flashSuccess('User dihapus permanen');
    } catch (e) { setError(String(e)); }
    setBusy(null);
  };

  // === LOGIKA PUSTAKA ===
  const filteredPustaka = useMemo(() => {
    if (!searchPustaka) return pustaka;
    const q = searchPustaka.toLowerCase();
    return pustaka.filter(p => String(p.q_text||'').toLowerCase().includes(q) || String(p.contributor_nama||'').toLowerCase().includes(q));
  }, [pustaka, searchPustaka]);

  const totalPagesPustaka = Math.max(1, Math.ceil(filteredPustaka.length / PAGE_SIZE));
  const paginatedPustaka = filteredPustaka.slice((pagePustaka - 1) * PAGE_SIZE, pagePustaka * PAGE_SIZE);

  const handleDeletePustaka = async (item) => {
    if (!confirm('Hapus soal ini dari Pustaka publik?')) return;
    setBusy(item.id);
    try {
      const client = await getSupabase();
      const { error: err } = await client.from('pustaka_soal').delete().eq('id', item.id);
      if (err) throw err;
      await loadData(); flashSuccess('Soal dihapus dari Pustaka');
    } catch (e) { setError(String(e)); }
    setBusy(null);
  };


  return html`
    <div class="shell">
      <div class="header">
        <div class="brand"><${GraduationCap} size=${22} strokeWidth=${2} /><span>TKA Studio <small>Admin</small></span></div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" onClick=${loadData} disabled=${loading}><${RefreshCw} size=${14} class=${loading ? 'spin' : ''} /> Refresh</button>
          <button class="btn btn-secondary btn-sm" onClick=${onLogout}><${LogOut} size=${14} /> Keluar</button>
        </div>
      </div>

      <div class="current-user">Login sebagai <b>${profile.nama || 'Admin'}</b></div>

      ${error && html`<div class="alert alert-error">${error}</div>`}
      ${success && html`<div class="alert alert-success">${success}</div>`}

      <!-- STATISTIK -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon users"><${Users} size=${20} /></div>
          <div class="stat-info"><span>Total Pengguna</span><b>${stats.users}</b></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pustaka"><${BookOpen} size=${20} /></div>
          <div class="stat-info"><span>Soal di Pustaka</span><b>${stats.pustaka}</b></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon expert"><${FileText} size=${20} /></div>
          <div class="stat-info"><span>Proyek Expert</span><b>${stats.workspaces}</b></div>
        </div>
      </div>

      <!-- TAB UTAMA -->
      <div class="tabs" style="margin-bottom: 20px; border-bottom: 1px solid var(--border);">
        <button class=${'tab' + (view === 'users' ? ' active' : '')} onClick=${() => setView('users')}><${Users} size=${16} class="tab-icon" /> Manajemen Pengguna</button>
        <button class=${'tab' + (view === 'pustaka' ? ' active' : '')} onClick=${() => setView('pustaka')}><${BookOpen} size=${16} class="tab-icon" /> Moderasi Pustaka</button>
      </div>

      <!-- KONTEN: MANAJEMEN USER -->
      ${view === 'users' && html`
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div class="tabs" style="margin-bottom: 0;">
            ${[{ k: 'pending', label: 'Menunggu', icon: Clock, count: counts.pending }, { k: 'active', label: 'Aktif', icon: Users, count: counts.active }, { k: 'suspended', label: 'Nonaktif', icon: Ban, count: counts.suspended }].map(t => html`
              <button class=${'tab' + (tab === t.k ? ' active' : '')} onClick=${() => setTab(t.k)}>
                <${t.icon} size=${14} class="tab-icon" /> ${t.label} <span class="count">${t.count}</span>
              </button>
            `)}
          </div>
          <button class="btn btn-secondary btn-sm" onClick=${() => exportToCSV(users)}>
            <${Download} size=${14} /> Ekspor CSV
          </button>
        </div>

        <div class="search-wrapper">
          <${Search} size=${16} class="search-icon" />
          <input class="search-input" type="text" placeholder="Cari nama, email, sekolah..." value=${search} onInput=${(e) => setSearch(e.target.value)} />
        </div>

        ${loading && users.length === 0 && html`<div class="empty"><p>Memuat data...</p></div>`}
        
        ${!loading && filteredUsers.length === 0 && html`
          <div class="empty">
            <${UserCheck} size=${32} color="var(--text-subtle)" />
            <p>${search ? `Tidak ada hasil untuk "${search}"` : 'Tidak ada data.'}</p>
          </div>
        `}

        ${filteredUsers.length > 0 && html`
          <div class="list">
            ${paginatedUsers.map((u) => html`
              <div class=${'list-item ' + u.status}>
                <div class="list-head">
                  <div>
                    <div class="list-title">${u.nama || '(tanpa nama)'}</div>
                    <div class="list-meta">
                      <span>📧 ${u.email}</span>
                      ${u.wa && html`<span>📱 ${u.wa}</span>`}
                      ${u.sekolah && html`<span>🏫 ${u.sekolah}</span>`}
                    </div>
                    <div class="list-meta"><span>📅 Daftar: ${formatDate(u.created_at)}</span></div>
                  </div>
                </div>
                <div class="list-actions">
                  ${u.status === 'pending' && html`
                    <button class="btn btn-primary btn-sm" disabled=${busy === u.id} onClick=${() => handleActivate(u)}>
                      ${busy === u.id ? 'Memproses...' : html`<${UserCheck} size=${14} /> Aktifkan`}
                    </button>
                  `}
                  ${u.status === 'active' && html`
                    <button class="btn btn-secondary btn-sm" disabled=${busy === u.id} onClick=${() => handleMakeAdmin(u)}>
                      <${Shield} size=${14} /> Jadikan Admin
                    </button>
                    <button class="btn btn-secondary btn-sm" disabled=${busy === u.id} onClick=${() => handleSuspend(u)}>
                      <${Ban} size=${14} /> Nonaktifkan
                    </button>
                  `}
                  ${u.status === 'suspended' && html`
                    <button class="btn btn-primary btn-sm" disabled=${busy === u.id} onClick=${() => handleReactivate(u)}>
                      <${UserCheck} size=${14} /> Aktifkan
                    </button>
                  `}
                  <button class="btn btn-danger btn-sm" disabled=${busy === u.id} onClick=${() => handleDeleteUser(u)}>
                    <${Trash2} size=${14} /> Hapus
                  </button>
                </div>
              </div>
            `)}
          </div>
          ${totalPages > 1 && html`
            <div class="pagination">
              <div class="pagination-info">Halaman <b>${page}</b> dari <b>${totalPages}</b></div>
              <div class="pagination-controls">
                <button class="pagination-btn" disabled=${page <= 1} onClick=${() => setPage(page - 1)}><${ChevronLeft} size=${16} /></button>
                <button class="pagination-btn" disabled=${page >= totalPages} onClick=${() => setPage(page + 1)}><${ChevronRight} size=${16} /></button>
              </div>
            </div>
          `}
        `}
      `}

      <!-- KONTEN: MODERASI PUSTAKA -->
      ${view === 'pustaka' && html`
        <div class="search-wrapper">
          <${Search} size=${16} class="search-icon" />
          <input class="search-input" type="text" placeholder="Cari soal atau nama guru..." value=${searchPustaka} onInput=${(e) => setSearchPustaka(e.target.value)} />
        </div>

        ${!loading && filteredPustaka.length === 0 && html`<div class="empty"><p>Tidak ada soal di Pustaka.</p></div>`}

        ${filteredPustaka.length > 0 && html`
          <div class="list">
            ${paginatedPustaka.map((p) => html`
              <div class="list-item">
                <div class="list-head">
                  <div>
                    <div class="list-title">[${p.tipe.toUpperCase()}] ${p.mapel} - ${p.kelas}</div>
                    <div style="font-size: 13px; margin: 8px 0; color: var(--text);">${p.q_text}</div>
                    <div class="list-meta">
                      <span>👤 ${p.contributor_nama} (${p.contributor_sekolah || '-'})</span>
                      <span>📅 ${formatDate(p.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div class="list-actions">
                  <button class="btn btn-danger btn-sm" disabled=${busy === p.id} onClick=${() => handleDeletePustaka(p)}>
                    <${Trash2} size=${14} /> Hapus Soal
                  </button>
                </div>
              </div>
            `)}
          </div>
          ${totalPagesPustaka > 1 && html`
            <div class="pagination">
              <div class="pagination-info">Halaman <b>${pagePustaka}</b> dari <b>${totalPagesPustaka}</b></div>
              <div class="pagination-controls">
                <button class="pagination-btn" disabled=${pagePustaka <= 1} onClick=${() => setPagePustaka(pagePustaka - 1)}><${ChevronLeft} size=${16} /></button>
                <button class="pagination-btn" disabled=${pagePustaka >= totalPagesPustaka} onClick=${() => setPagePustaka(pagePustaka + 1)}><${ChevronRight} size=${16} /></button>
              </div>
            </div>
          `}
        `}
      `}

      <div class="footer">© 2026 Ekwan Nugroho — Wonogiri · Panel Admin</div>

      ${modalData && html`<${PasswordModal} data=${modalData} onClose=${() => setModalData(null)} />`}
    </div>
  `;
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const client = await getSupabase();
      const { data } = await client.auth.getSession();
      if (data?.session) {
        const { data: prof } = await client.from('profiles').select('role,status,nama').eq('id', data.session.user.id).single();
        if (prof && prof.role === 'admin' && prof.status === 'active') { setSession(data.session); setProfile(prof); }
        else { await client.auth.signOut(); }
      }
      setChecking(false);
    })();
  }, []);

  if (checking) return html`<div class="login-wrap"><div class="login-card"><p>Memeriksa sesi...</p></div></div>`;
  if (!session || !profile) return html`<${LoginScreen} onLogin=${(s, p) => { setSession(s); setProfile(p); }} />`;
  return html`<${Dashboard} session=${session} profile=${profile} onLogout=${() => { setSession(null); setProfile(null); }} />`;
}

render(html`<${App} />`, document.getElementById('app'));
