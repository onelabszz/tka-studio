/**
 * TKA Studio — Admin Panel (v1.2 Premium Layout)
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h, render } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  GraduationCap, LogOut, RefreshCw, UserCheck, Clock, Check, Copy,
  ExternalLink, CheckCircle2, Users, Ban, Trash2, Search, X,
  ChevronLeft, ChevronRight, BookOpen, Shield, Download, FileText,
  Menu, LayoutDashboard
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
        <div style="display:flex; justify-content:center; margin-bottom:24px;">
          <div class="sidebar-logo" style="width:48px; height:48px; font-size:18px;">TKA</div>
        </div>
        <h1 style="text-align:center;">Admin Panel</h1>
        <p style="text-align:center;">Masuk untuk mengelola TKA Studio.</p>
        ${error && html`<div class="alert alert-error">${error}</div>`}
        <form onSubmit=${handleSubmit}>
          <div class="field"><label>Email</label><input class="input" type="email" required value=${email} onInput=${(e) => setEmail(e.target.value)} /></div>
          <div class="field"><label>Password</label><input class="input" type="password" required value=${password} onInput=${(e) => setPassword(e.target.value)} /></div>
          <button class="btn btn-primary" style="width:100%;" type="submit" disabled=${loading}>${loading ? 'Memeriksa...' : 'Masuk'}</button>
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
      <div class="modal" onClick=${(e) => e.stopPropagation()}>
        <button style="position:absolute; top:16px; right:16px;" onClick=${onClose}>×</button>
        <h2 style="color:var(--success); display:flex; align-items:center; gap:8px;"><${CheckCircle2} size=${24} /> Akun Aktif</h2>
        <div style="margin: 16px 0; font-size:14px; line-height:1.6;">
          <div><b>Nama:</b> ${data.nama || '-'}</div>
          <div><b>Email:</b> ${data.email}</div>
          <div><b>WA:</b> ${data.wa || '-'}</div>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">Password yang digenerate:</div>
        <div class="password-box">
          <span>${data.password}</span>
          <button onClick=${handleCopy}>${copied ? html`<${Check} size=${20} />` : html`<${Copy} size=${20} />`}</button>
        </div>
        ${link ? html`<a class="btn btn-primary" style="width:100%;" href=${link} target="_blank"><${ExternalLink} size=${16} /> Kirim via WhatsApp</a>` : html`<div class="alert alert-error">Nomor WA tidak tersedia.</div>`}
      </div>
    </div>
  `;
}

function Dashboard({ session, profile, onLogout }) {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'users', 'pustaka'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State Data
  const [users, setUsers] = useState([]);
  const [pustaka, setPustaka] = useState([]);
  const [stats, setStats] = useState({ users: 0, pustaka: 0, workspaces: 0 });
  
  // State UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(null);
  const [modalData, setModalData] = useState(null);

  // State Filter & Pagination
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const client = await getSupabase();
      const [{ count: cUsers }, { count: cPustaka }, { count: cWork }] = await Promise.all([
        client.from('profiles').select('*', { count: 'exact', head: true }),
        client.from('pustaka_soal').select('*', { count: 'exact', head: true }),
        client.from('expert_workspaces').select('*', { count: 'exact', head: true })
      ]);
      setStats({ users: cUsers || 0, pustaka: cPustaka || 0, workspaces: cWork || 0 });

      const { data: uData } = await client.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(uData || []);

      const { data: pData } = await client.from('pustaka_soal').select('*').order('created_at', { ascending: false });
      setPustaka(pData || []);

      setLoading(false);
    } catch (e) { setError(String(e?.message || e)); setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setPage(1); }, [tab, search, view]);
  useEffect(() => { setSidebarOpen(false); }, [view]);

  const flashSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

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
    if (!confirm(`Jadikan ${user.nama} sebagai Admin?`)) return;
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

  const handleDeletePustaka = async (item) => {
    if (!confirm('Hapus soal ini dari Pustaka publik?')) return;
    setBusy(item.id);
    try {
      const client = await getSupabase();
      await client.from('pustaka_soal').delete().eq('id', item.id);
      await loadData(); flashSuccess('Soal dihapus dari Pustaka');
    } catch (e) { setError(String(e)); }
    setBusy(null);
  };

  // Filter Data
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

  const filteredPustaka = useMemo(() => {
    if (!search) return pustaka;
    const q = search.toLowerCase();
    return pustaka.filter(p => String(p.q_text||'').toLowerCase().includes(q) || String(p.contributor_nama||'').toLowerCase().includes(q));
  }, [pustaka, search]);

  const currentList = view === 'users' ? filteredUsers : filteredPustaka;
  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const paginatedData = currentList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return html`
    <div class="app-layout">
      ${sidebarOpen && html`<div class="overlay" onClick=${() => setSidebarOpen(false)}></div>`}
      
      <aside class=${'app-sidebar' + (sidebarOpen ? ' open' : '')}>
        <div class="sidebar-brand">
          <div class="sidebar-logo">TKA</div>
          <div>
            <div class="sidebar-title">TKA Studio</div>
            <div class="sidebar-subtitle">Admin Panel</div>
          </div>
        </div>
        
        <div class="sidebar-nav">
          <button class=${'nav-item' + (view === 'dashboard' ? ' active' : '')} onClick=${() => setView('dashboard')}>
            <${LayoutDashboard} size=${18} /> Dashboard
          </button>
          <button class=${'nav-item' + (view === 'users' ? ' active' : '')} onClick=${() => setView('users')}>
            <${Users} size=${18} /> Manajemen Pengguna
          </button>
          <button class=${'nav-item' + (view === 'pustaka' ? ' active' : '')} onClick=${() => setView('pustaka')}>
            <${BookOpen} size=${18} /> Moderasi Pustaka
          </button>
        </div>

        <div class="sidebar-footer">
          <div class="admin-profile">
            <div>
              <div class="admin-name">${profile.nama || 'Admin'}</div>
              <div class="admin-role">Administrator</div>
            </div>
          </div>
          <button class="btn-logout" onClick=${onLogout}><${LogOut} size=${16} /> Keluar</button>
        </div>
      </aside>

      <main class="app-main">
        <header class="mobile-header">
          <div style="display:flex; align-items:center; gap:8px; font-weight:700;">
            <div class="sidebar-logo" style="width:24px; height:24px; font-size:10px;">TKA</div> Admin
          </div>
          <button class="mobile-menu-btn" onClick=${() => setSidebarOpen(true)}><${Menu} size=${24} /></button>
        </header>

        <div class="page-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px;">
          <div>
            <h1 class="page-title">
              ${view === 'dashboard' ? 'Ringkasan Sistem' : view === 'users' ? 'Manajemen Pengguna' : 'Moderasi Pustaka'}
            </h1>
            <p class="page-subtitle">
              ${view === 'dashboard' ? 'Pantau aktivitas TKA Studio secara keseluruhan.' : view === 'users' ? 'Kelola akun guru yang mendaftar.' : 'Kelola soal yang dibagikan ke publik.'}
            </p>
          </div>
          <button class="btn btn-secondary" onClick=${loadData} disabled=${loading}>
            <${RefreshCw} size=${16} class=${loading ? 'spin' : ''} /> Refresh Data
          </button>
        </div>

        ${error && html`<div class="alert alert-error">${error}</div>`}
        ${success && html`<div class="alert alert-success">${success}</div>`}

        ${view === 'dashboard' && html`
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon blue"><${Users} size=${24} /></div>
              <div class="stat-info"><span>Total Pengguna</span><b>${stats.users}</b></div>
            </div>
            <div class="stat-card">
              <div class="stat-icon green"><${BookOpen} size=${24} /></div>
              <div class="stat-info"><span>Soal di Pustaka</span><b>${stats.pustaka}</b></div>
            </div>
            <div class="stat-card">
              <div class="stat-icon amber"><${FileText} size=${24} /></div>
              <div class="stat-info"><span>Proyek Expert</span><b>${stats.workspaces}</b></div>
            </div>
          </div>
          <div class="card" style="justify-content:center; text-align:center; padding:60px 20px;">
            <div>
              <${LayoutDashboard} size=${48} color="var(--text-subtle)" style="margin-bottom:16px;" />
              <h2 style="margin:0 0 8px;">Selamat Datang, Admin!</h2>
              <p style="color:var(--text-muted); margin:0;">Pilih menu di sebelah kiri untuk mulai mengelola data.</p>
            </div>
          </div>
        `}

        ${(view === 'users' || view === 'pustaka') && html`
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px;">
            <div class="tabs" style="margin:0; border:none; padding:0;">
              ${view === 'users' ? html`
                ${[{ k: 'pending', label: 'Menunggu', icon: Clock, count: counts.pending }, { k: 'active', label: 'Aktif', icon: Users, count: counts.active }, { k: 'suspended', label: 'Nonaktif', icon: Ban, count: counts.suspended }].map(t => html`
                  <button class=${'tab' + (tab === t.k ? ' active' : '')} onClick=${() => setTab(t.k)}>
                    <${t.icon} size=${16} /> ${t.label} <span class="tab-count">${t.count}</span>
                  </button>
                `)}
              ` : ''}
            </div>
            ${view === 'users' && html`
              <button class="btn btn-secondary" onClick=${() => exportToCSV(users)}>
                <${Download} size=${16} /> Ekspor CSV
              </button>
            `}
          </div>

          <div class="search-box">
            <${Search} size=${18} class="search-icon" />
            <input class="search-input" type="text" placeholder="Cari nama, email, atau sekolah..." value=${search} onInput=${(e) => setSearch(e.target.value)} />
          </div>

          ${loading && currentList.length === 0 && html`<div class="empty-state"><p>Memuat data...</p></div>`}
          
          ${!loading && currentList.length === 0 && html`
            <div class="empty-state">
              <${UserCheck} size=${48} color="var(--text-subtle)" style="margin-bottom:16px;" />
              <p>${search ? 'Tidak ada hasil yang cocok dengan pencarian.' : 'Tidak ada data di kategori ini.'}</p>
            </div>
          `}

          ${currentList.length > 0 && html`
            <div class="list">
              ${paginatedData.map((item) => html`
                <div class="card">
                  <div class="card-left">
                    ${view === 'users' ? html`
                      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <div class="card-title">${item.nama || '(tanpa nama)'}</div>
                        <span class="badge badge-${item.status}">${item.status}</span>
                      </div>
                      <div class="card-meta">
                        <span>📧 ${item.email}</span>
                        ${item.wa && html`<span>📱 ${item.wa}</span>`}
                        ${item.sekolah && html`<span>🏫 ${item.sekolah}</span>`}
                        <span>📅 ${formatDate(item.created_at)}</span>
                      </div>
                    ` : html`
                      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <span class="badge badge-active" style="background:var(--primary-light); color:var(--primary);">${item.tipe.toUpperCase()}</span>
                        <span class="badge badge-pending" style="background:#f1f5f9; color:var(--text-muted);">${item.mapel}</span>
                        <div class="card-title" style="margin:0;">${item.kelas}</div>
                      </div>
                      <div style="font-size:14px; margin-bottom:12px; color:var(--text);">${item.q_text}</div>
                      <div class="card-meta">
                        <span>👤 ${item.contributor_nama} (${item.contributor_sekolah || '-'})</span>
                        <span>📅 ${formatDate(item.created_at)}</span>
                      </div>
                    `}
                  </div>
                  
                  <div class="card-actions">
                    ${view === 'users' && html`
                      ${item.status === 'pending' && html`
                        <button class="btn btn-primary" disabled=${busy === item.id} onClick=${() => handleActivate(item)}>
                          <${UserCheck} size=${16} /> Aktifkan
                        </button>
                      `}
                      ${item.status === 'active' && html`
                        <button class="btn btn-secondary" disabled=${busy === item.id} onClick=${() => handleMakeAdmin(item)}>
                          <${Shield} size=${16} /> Jadikan Admin
                        </button>
                        <button class="btn btn-secondary" disabled=${busy === item.id} onClick=${() => handleSuspend(item)}>
                          <${Ban} size=${16} /> Suspend
                        </button>
                      `}
                      ${item.status === 'suspended' && html`
                        <button class="btn btn-primary" disabled=${busy === item.id} onClick=${() => handleReactivate(item)}>
                          <${UserCheck} size=${16} /> Pulihkan
                        </button>
                      `}
                      <button class="btn btn-danger" disabled=${busy === item.id} onClick=${() => handleDeleteUser(item)}>
                        <${Trash2} size=${16} />
                      </button>
                    `}

                    ${view === 'pustaka' && html`
                      <button class="btn btn-danger" disabled=${busy === item.id} onClick=${() => handleDeletePustaka(item)}>
                        <${Trash2} size=${16} /> Hapus Soal
                      </button>
                    `}
                  </div>
                </div>
              `)}
            </div>

            ${totalPages > 1 && html`
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; background:white; padding:16px; border-radius:12px; border:1px solid var(--border);">
                <div style="font-size:13px; color:var(--text-muted);">
                  Halaman <b>${page}</b> dari <b>${totalPages}</b>
                </div>
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-secondary" disabled=${page <= 1} onClick=${() => setPage(page - 1)}>
                    <${ChevronLeft} size=${16} /> Prev
                  </button>
                  <button class="btn btn-secondary" disabled=${page >= totalPages} onClick=${() => setPage(page + 1)}>
                    Next <${ChevronRight} size=${16} />
                  </button>
                </div>
              </div>
            `}
          `}
        `}

      </main>

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

  if (checking) return html`<div class="login-wrap"><div class="login-card"><p style="text-align:center;">Memeriksa sesi...</p></div></div>`;
  if (!session || !profile) return html`<${LoginScreen} onLogin=${(s, p) => { setSession(s); setProfile(p); }} />`;
  return html`<${Dashboard} session=${session} profile=${profile} onLogout=${() => { setSession(null); setProfile(null); }} />`;
}

render(html`<${App} />`, document.getElementById('app'));
