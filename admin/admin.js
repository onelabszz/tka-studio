/**
 * TKA Studio — admin/admin.js (Premium Dashboard + Bulk Approve)
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h, render } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  LayoutDashboard, Users, BookOpen, Search, CheckCircle2,
  XCircle, Clock, Trash2, Key, Loader2, AlertTriangle, Copy, Check,
  Shield, Download, LogOut, Pencil, UserX, RefreshCw
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getSupabase } from '../supabase/client.js';

const html = htm.bind(h);

function AdminApp() {
  const [authState, setAuthState] = useState('loading');
  const [currentUserRole, setCurrentUserRole] = useState('user');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentMenu, setCurrentMenu] = useState('users'); 
  
  // Data
  const [users, setUsers] = useState([]);
  const [pustaka, setPustaka] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [userTab, setUserTab] = useState('active');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  
  // Bulk Actions State
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkPasswords, setBulkPasswords] = useState(null); // Menyimpan hasil generate massal

  // Modals
  const [confirmData, setConfirmData] = useState(null);
  const [passwordData, setPasswordData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const client = await getSupabase();
        const { data: { session } } = await client.auth.getSession();
        if (!session) { setAuthState('unauthorized'); setLoading(false); return; }
        
        const { data: profile } = await client.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile && ['admin', 'superadmin'].includes(profile.role)) {
          setCurrentUserRole(profile.role);
          setCurrentUserId(session.user.id);
          setAuthState('authorized');
          loadAllData();
        } else {
          setAuthState('unauthorized'); setLoading(false);
        }
      } catch (e) { setAuthState('unauthorized'); setLoading(false); }
    };
    checkAuth();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const client = await getSupabase();
      
      const { data: u } = await client.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(u || []);
      
      const { data: p } = await client.from('pustaka_soal').select('*').order('created_at', { ascending: false });
      setPustaka(p || []);
      
    } catch (e) {
      if (window.showToast) window.showToast('Gagal memuat data: ' + e.message, 'error');
    }
    setLoading(false);
  };

  // ==========================================
  // BULK ACTIONS
  // ==========================================
  const toggleSelect = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = (filteredList) => {
    if (selectedUsers.length === filteredList.length) setSelectedUsers([]);
    else setSelectedUsers(filteredList.map(u => u.id));
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.length === 0) return;
    setBulkLoading(true);
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedUsers) {
      const user = users.find(u => u.id === id);
      if (!user) continue;
      
      try {
        const client = await getSupabase();
        const { data, error } = await client.functions.invoke('activate', { 
          body: { userId: user.id, email: user.email } 
        });
        
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        
        results.push({ name: user.nama, email: user.email, password: data.password });
        successCount++;
      } catch (e) {
        console.error("Gagal aktivasi massal:", user.nama, e);
        failCount++;
      }
    }
    
    setBulkPasswords(results);
    setSelectedUsers([]);
    loadAllData();
    setBulkLoading(false);
    
    if (window.showToast) {
      window.showToast(`${successCount} akun diaktifkan. ${failCount} gagal.`, successCount > 0 ? 'success' : 'error');
    }
  };

  // ==========================================
  // SINGLE USER ACTIONS
  // ==========================================
  
  const handleGeneratePassword = (user) => {
    const isReset = user.status === 'active';
    setConfirmData({
      title: isReset ? 'Reset Password?' : 'Aktifkan Akun?', 
      message: `Sistem akan membuatkan password baru untuk ${user.nama}. Password lama tidak akan berlaku lagi.`, 
      confirmText: isReset ? 'Ya, Reset' : 'Ya, Aktifkan', 
      isDanger: isReset,
      onConfirm: async () => {
        setConfirmData(null); setActionLoading(user.id);
        try {
          const client = await getSupabase();
          const { data, error } = await client.functions.invoke('activate', { 
            body: { userId: user.id, email: user.email } 
          });
          if (error) throw error;
          if (data.error) throw new Error(data.error);
          
          setPasswordData({ name: user.nama, email: user.email, password: data.password });
          loadAllData();
        } catch (e) { 
          alert('GAGAL RESET PASSWORD:\n\n' + (e.message || e));
        }
        setActionLoading(null);
      }
    });
  };

  const handleSuspend = (user) => {
    setConfirmData({
      title: 'Tangguhkan Akun?', message: `Akun ${user.nama} tidak akan bisa login.`, confirmText: 'Ya, Tangguhkan', isDanger: true,
      onConfirm: async () => {
        setConfirmData(null); setActionLoading(user.id);
        try {
          const client = await getSupabase();
          await client.from('profiles').update({ status: 'suspended' }).eq('id', user.id);
          if (window.showToast) window.showToast('Akun ditangguhkan.', 'success');
          loadAllData();
        } catch (e) { if (window.showToast) window.showToast('Gagal: ' + e.message, 'error'); }
        setActionLoading(null);
      }
    });
  };

  const handleDeleteUser = (user) => {
    setConfirmData({
      title: 'Hapus Akun Permanen?', message: `Akun ${user.nama} beserta seluruh datanya akan dihapus. Tindakan ini tidak bisa dibatalkan.`, confirmText: 'Ya, Hapus', isDanger: true,
      onConfirm: async () => {
        setConfirmData(null); setActionLoading(user.id);
        try {
          const client = await getSupabase();
          const { error } = await client.functions.invoke('delete-user', { body: { userId: user.id } });
          if (error) throw error;
          if (window.showToast) window.showToast('Akun dihapus.', 'success');
          loadAllData();
        } catch (e) { if (window.showToast) window.showToast('Gagal: ' + e.message, 'error'); }
        setActionLoading(null);
      }
    });
  };

  const handleTogglePublish = async (user) => {
    setActionLoading(user.id);
    try {
      const client = await getSupabase();
      await client.from('profiles').update({ can_publish_exam: !user.can_publish_exam }).eq('id', user.id);
      loadAllData();
    } catch (e) { if (window.showToast) window.showToast('Gagal.', 'error'); }
    setActionLoading(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setActionLoading(editData.id);
    try {
      const client = await getSupabase();
      const { error } = await client.from('profiles').update({
        nama: editData.nama, sekolah: editData.sekolah, wa: editData.wa, role: editData.role
      }).eq('id', editData.id);
      
      if (error) throw error;
      if (window.showToast) window.showToast('Profil berhasil diperbarui.', 'success');
      setEditData(null);
      loadAllData();
    } catch (e) {
      if (window.showToast) window.showToast('Gagal update: ' + e.message, 'error');
    }
    setActionLoading(null);
  };

  const copyPassword = () => {
    if (!passwordData) return;
    navigator.clipboard.writeText(passwordData.password);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const copyBulkPasswords = () => {
    if (!bulkPasswords) return;
    const text = bulkPasswords.map(p => `Nama: ${p.name}\nEmail: ${p.email}\nPassword: ${p.password}\n`).join('\n---\n');
    navigator.clipboard.writeText(text);
    if (window.showToast) window.showToast('Semua password disalin ke clipboard!', 'success');
  };

  if (authState === 'loading') return html`<div style="height:100vh; display:flex; align-items:center; justify-content:center;"><${Loader2} class="spin" size=${40} color="var(--primary)"/></div>`;
  
  if (authState === 'unauthorized') {
    return html`
      <div style="height:100vh; display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:white; padding:40px; border-radius:16px; text-align:center; max-width:400px; box-shadow:var(--shadow-lift);">
          <${Shield} size=${48} color="var(--danger)" style="margin-bottom:16px;" />
          <h1 style="font-size:20px; margin-bottom:8px;">Akses Ditolak</h1>
          <p style="font-size:14px; color:var(--text-muted); margin-bottom:24px;">Anda belum login sebagai Admin.</p>
          <a href="../" class="btn-primary" style="display:inline-block; text-decoration:none;">Kembali ke Aplikasi</a>
        </div>
      </div>
    `;
  }

  const stats = {
    total: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    active: users.filter(u => u.status === 'active').length,
    pustaka: pustaka.length
  };

  const filteredUsers = users.filter(u => {
    if (userTab === 'pending' && u.status !== 'pending') return false;
    if (userTab === 'active' && u.status !== 'active') return false;
    if (userTab === 'suspended' && u.status !== 'suspended') return false;
    if (search) {
      const q = search.toLowerCase();
      return (u.nama || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.sekolah || '').toLowerCase().includes(q);
    }
    return true;
  });

  return html`
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="admin-sidebar-brand">
          <div class="admin-sidebar-brand-icon"><${Shield} size=${20} /></div>
          <div class="admin-sidebar-brand-text">
            <h1>Admin Panel</h1>
            <p>TKA Studio</p>
          </div>
        </div>
        <nav class="admin-menu">
          <button class=${'admin-menu-item ' + (currentMenu === 'overview' ? 'active' : '')} onClick=${() => setCurrentMenu('overview')}>
            <${LayoutDashboard} size=${18} /> <span>Ringkasan</span>
          </button>
          <button class=${'admin-menu-item ' + (currentMenu === 'users' ? 'active' : '')} onClick=${() => setCurrentMenu('users')}>
            <${Users} size=${18} /> <span>Kelola Guru</span>
          </button>
          <button class=${'admin-menu-item ' + (currentMenu === 'pustaka' ? 'active' : '')} onClick=${() => setCurrentMenu('pustaka')}>
            <${BookOpen} size=${18} /> <span>Moderasi Pustaka</span>
          </button>
          <a href="../" class="admin-menu-item" style="margin-top:auto;">
            <${LogOut} size=${18} /> <span>Ke Aplikasi</span>
          </a>
        </nav>
      </aside>

      <main class="admin-main">
        
        <!-- MENU: OVERVIEW -->
        ${currentMenu === 'overview' && html`
          <div class="admin-header">
            <div>
              <h1 class="admin-title">Ringkasan Sistem</h1>
              <p class="admin-subtitle">Pantau aktivitas dan pertumbuhan pengguna TKA Studio.</p>
            </div>
          </div>
          <div class="admin-stats-grid">
            <div class="admin-stat-card">
              <div class="admin-stat-icon" style="background:#eff6ff; color:var(--primary);"><${Users} size=${24} /></div>
              <div class="admin-stat-info"><p>Total Guru</p><h3>${stats.total}</h3></div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon" style="background:#fffbeb; color:var(--warning);"><${Clock} size=${24} /></div>
              <div class="admin-stat-info"><p>Menunggu Verifikasi</p><h3>${stats.pending}</h3></div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon" style="background:#ecfdf5; color:var(--success);"><${CheckCircle2} size=${24} /></div>
              <div class="admin-stat-info"><p>Guru Aktif</p><h3>${stats.active}</h3></div>
            </div>
          </div>
        `}

        <!-- MENU: KELOLA GURU -->
        ${currentMenu === 'users' && html`
          <div class="admin-header">
            <div>
              <h1 class="admin-title">Kelola Guru</h1>
              <p class="admin-subtitle">Verifikasi akun, edit profil, reset password, dan atur akses guru.</p>
            </div>
          </div>

          <div class="admin-card">
            <div class="admin-toolbar">
              <div class="admin-search-box">
                <${Search} size=${16} color="var(--text-muted)" />
                <input type="text" placeholder="Cari nama, email, sekolah..." value=${search} onInput=${(e) => setSearch(e.target.value)} />
              </div>
              
              <div class="admin-tabs">
                <button class=${'admin-tab ' + (userTab === 'pending' ? 'active' : '')} onClick=${() => { setUserTab('pending'); setSelectedUsers([]); }}>
                  Pending <span class="badge" style="background:rgba(0,0,0,0.1);">${stats.pending}</span>
                </button>
                <button class=${'admin-tab ' + (userTab === 'active' ? 'active' : '')} onClick=${() => { setUserTab('active'); setSelectedUsers([]); }}>
                  Aktif <span class="badge" style="background:rgba(0,0,0,0.1);">${stats.active}</span>
                </button>
                <button class=${'admin-tab ' + (userTab === 'suspended' ? 'active' : '')} onClick=${() => { setUserTab('suspended'); setSelectedUsers([]); }}>
                  Suspend
                </button>
              </div>
            </div>

            <!-- BULK ACTION BAR -->
            ${userTab === 'pending' && selectedUsers.length > 0 && html`
              <div style="background: var(--primary-light); padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 13.5px; font-weight: 700; color: var(--primary-dark);">
                  ${selectedUsers.length} guru terpilih
                </div>
                <button class="btn-primary" onClick=${handleBulkApprove} disabled=${bulkLoading}>
                  ${bulkLoading ? html`<${Loader2} class="spin" size=${16} /> Memproses...` : html`<${CheckCircle2} size=${16} /> Aktifkan Semua`}
                </button>
              </div>
            `}

            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <!-- CHECKBOX HEADER -->
                    <th width="40" style="text-align:center;">
                      ${userTab === 'pending' && filteredUsers.length > 0 && html`
                        <input type="checkbox" 
                          checked=${selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange=${() => toggleSelectAll(filteredUsers)}
                          style="width: 16px; height: 16px; cursor: pointer;"
                        />
                      `}
                    </th>
                    <th>Nama & Email</th>
                    <th>Sekolah / WA</th>
                    <th>Status</th>
                    <th>Izin Kode</th>
                    <th style="text-align:right;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${loading ? html`<tr><td colspan="6" style="text-align:center; padding:40px;"><${Loader2} class="spin" size=${24}/></td></tr>` : 
                    filteredUsers.length === 0 ? html`<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">Tidak ada data ditemukan.</td></tr>` :
                    filteredUsers.map(user => html`
                    <tr key=${user.id} class=${selectedUsers.includes(user.id) ? 'row-selected' : ''}>
                      <!-- CHECKBOX ROW -->
                      <td style="text-align:center;">
                        ${userTab === 'pending' && html`
                          <input type="checkbox" 
                            checked=${selectedUsers.includes(user.id)}
                            onChange=${() => toggleSelect(user.id)}
                            style="width: 16px; height: 16px; cursor: pointer;"
                          />
                        `}
                      </td>
                      <td>
                        <div style="font-weight:700; color:var(--navy-900);">
                          ${user.nama} ${user.id === currentUserId ? html`<span style="font-weight:400; color:var(--text-muted);">(Anda)</span>` : ''}
                        </div>
                        <div style="font-size:12px; color:var(--text-muted);">${user.email}</div>
                        
                        ${user.role === 'admin' && html`<span class="badge badge-primary" style="margin-top:4px;">ADMIN</span>`}
                        ${user.role === 'superadmin' && html`<span class="badge badge-danger" style="margin-top:4px;">SUPERADMIN</span>`}
                        ${user.role === 'user' && html`<span class="badge badge-muted" style="margin-top:4px;">GURU</span>`}
                      </td>
                      <td>
                        <div>${user.sekolah || '-'}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${user.wa || '-'}</div>
                      </td>
                      <td>
                        ${user.status === 'active' ? html`<span class="badge badge-success">Aktif</span>` : ''}
                        ${user.status === 'pending' ? html`<span class="badge badge-warning">Pending</span>` : ''}
                        ${user.status === 'suspended' ? html`<span class="badge badge-danger">Suspend</span>` : ''}
                      </td>
                      <td>
                        ${user.can_publish_exam ? html`<span class="badge badge-primary">Diizinkan</span>` : html`<span class="badge badge-muted">Tidak</span>`}
                      </td>
                      <td>
                        <div style="display:flex; gap:6px; justify-content:flex-end;">
                          ${actionLoading === user.id ? html`<${Loader2} class="spin" size=${18} color="var(--primary)" />` : html`
                            
                            <button class="btn-icon" onClick=${() => setEditData({...user})} title="Edit Profil">
                              <${Pencil} size=${16}/>
                            </button>

                            <button class="btn-icon btn-key" onClick=${() => handleGeneratePassword(user)} title=${user.status === 'active' ? 'Reset Password' : 'Aktifkan & Buat Password'}>
                              <${Key} size=${16}/>
                            </button>

                            ${user.status === 'active' && html`
                              <button class=${'btn-icon btn-key ' + (user.can_publish_exam ? 'active' : '')} onClick=${() => handleTogglePublish(user)} title="Izin Kode Latihan">
                                <${BookOpen} size=${16}/>
                              </button>
                            `}

                            ${user.status === 'active' && user.id !== currentUserId && html`
                              <button class="btn-icon btn-delete" onClick=${() => handleSuspend(user)} title="Tangguhkan">
                                <${UserX} size=${16}/>
                              </button>
                            `}

                            ${user.id !== currentUserId && html`
                              <button class="btn-icon btn-delete" onClick=${() => handleDeleteUser(user)} title="Hapus Permanen">
                                <${Trash2} size=${16}/>
                              </button>
                            `}
                          `}
                        </div>
                      </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>
        `}

        <!-- MENU: MODERASI PUSTAKA -->
        ${currentMenu === 'pustaka' && html`
          <div class="admin-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 class="admin-title">Moderasi Pustaka</h1>
              <p class="admin-subtitle">Awasi soal-soal publik yang dibagikan oleh guru.</p>
            </div>
            <button class="btn-primary" onClick=${loadAllData} disabled=${loading}>
              <${RefreshCw} size=${16} class=${loading ? 'spin' : ''} /> Refresh Data
            </button>
          </div>

          <div class="admin-card">
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Mapel & Kelas</th>
                    <th>Soal</th>
                    <th>Penulis</th>
                    <th style="text-align:right;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${loading ? html`<tr><td colspan="4" style="text-align:center; padding:40px;"><${Loader2} class="spin" size=${24}/></td></tr>` :
                    pustaka.length === 0 ? html`<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--text-muted);">Belum ada soal publik.</td></tr>` :
                    pustaka.map(item => html`
                    <tr key=${item.id}>
                      <td>
                        <div style="font-weight:700;">${item.mapel}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${item.kelas || '-'} · ${item.tipe.toUpperCase()}</div>
                      </td>
                      <td>
                        <div style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:13px;">
                          ${item.q_text || item.konten?.q || '(Teks soal tidak terbaca)'}
                        </div>
                      </td>
                      <td>${item.contributor_nama || 'Anonim'}</td>
                      <td style="text-align:right;">
                        ${actionLoading === item.id ? html`<${Loader2} class="spin" size=${16} />` : html`
                          <button class="btn-icon btn-delete" onClick=${() => handleDeletePustaka(item)} title="Hapus Soal">
                            <${Trash2} size=${16}/>
                          </button>
                        `}
                      </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>
        `}
      </main>

      <!-- MODAL CONFIRM -->
      ${confirmData && html`
        <div class="modal-backdrop" onClick=${() => setConfirmData(null)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal-header">
              <div class="modal-title"><${AlertTriangle} size=${20} color=${confirmData.isDanger ? 'var(--danger)' : 'var(--warning)'} /> ${confirmData.title}</div>
            </div>
            <div class="modal-body">
              <p style="font-size:14px; color:var(--text-muted); line-height:1.6; margin:0;">${confirmData.message}</p>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" onClick=${() => setConfirmData(null)}>Batal</button>
              <button class=${confirmData.isDanger ? 'btn-danger' : 'btn-success'} onClick=${confirmData.onConfirm}>${confirmData.confirmText}</button>
            </div>
          </div>
        </div>
      `}

      <!-- MODAL PASSWORD BARU (SINGLE) -->
      ${passwordData && html`
        <div class="modal-backdrop" onClick=${() => setPasswordData(null)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal-header">
              <div class="modal-title"><${Key} size=${20} color="var(--success)" /> Password Baru</div>
            </div>
            <div class="modal-body">
              <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">Berikan password ini ke <b>${passwordData.name}</b> via WhatsApp.</p>
              <div style="background:var(--surface-muted); padding:16px; border-radius:12px; text-align:center; border:1px dashed var(--border-strong);">
                <div style="font-size:24px; font-weight:800; letter-spacing:2px; color:var(--primary);">${passwordData.password}</div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" onClick=${() => setPasswordData(null)}>Tutup</button>
              <button class="btn-success" onClick=${copyPassword}>${copied ? 'Tersalin!' : 'Salin Password'}</button>
            </div>
          </div>
        </div>
      `}

      <!-- MODAL PASSWORD BARU (BULK) -->
      ${bulkPasswords && html`
        <div class="modal-backdrop" onClick=${() => setBulkPasswords(null)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()} style="max-width: 500px;">
            <div class="modal-header">
              <div class="modal-title"><${CheckCircle2} size=${20} color="var(--success)" /> Aktivasi Massal Berhasil</div>
            </div>
            <div class="modal-body">
              <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
                Berikut adalah daftar password baru untuk ${bulkPasswords.length} guru. Salin dan kirimkan via WhatsApp.
              </p>
              <div style="background:var(--surface-muted); padding:16px; border-radius:12px; max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 13px;">
                ${bulkPasswords.map((p, i) => html`
                  <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed var(--border);">
                    <div style="font-weight: 700; color: var(--navy-900);">${p.name}</div>
                    <div style="color: var(--text-muted); font-size: 11px;">${p.email}</div>
                    <div style="color: var(--primary); font-weight: 800; font-size: 16px; margin-top: 4px;">${p.password}</div>
                  </div>
                `)}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" onClick=${() => setBulkPasswords(null)}>Tutup</button>
              <button class="btn-success" onClick=${copyBulkPasswords}>
                <${Copy} size=${16}/> Salin Semua Password
              </button>
            </div>
          </div>
        </div>
      `}

      <!-- MODAL EDIT PROFIL -->
      ${editData && html`
        <div class="modal-backdrop" onClick=${() => setEditData(null)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal-header">
              <div class="modal-title"><${Pencil} size=${20} color="var(--primary)" /> Edit Profil Guru</div>
            </div>
            <form onSubmit=${handleSaveEdit}>
              <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
                <div>
                  <label style="font-size:12px; font-weight:700; color:var(--text-muted);">Nama Lengkap</label>
                  <input type="text" value=${editData.nama} onInput=${(e) => setEditData({...editData, nama: e.target.value})} required style="width:100%; padding:10px; border:1px solid var(--border-strong); border-radius:8px; margin-top:4px;" />
                </div>
                <div>
                  <label style="font-size:12px; font-weight:700; color:var(--text-muted);">Asal Sekolah</label>
                  <input type="text" value=${editData.sekolah} onInput=${(e) => setEditData({...editData, sekolah: e.target.value})} style="width:100%; padding:10px; border:1px solid var(--border-strong); border-radius:8px; margin-top:4px;" />
                </div>
                <div>
                  <label style="font-size:12px; font-weight:700; color:var(--text-muted);">No. WhatsApp</label>
                  <input type="text" value=${editData.wa} onInput=${(e) => setEditData({...editData, wa: e.target.value})} style="width:100%; padding:10px; border:1px solid var(--border-strong); border-radius:8px; margin-top:4px;" />
                </div>
                <div>
                  <label style="font-size:12px; font-weight:700; color:var(--text-muted);">Role Akses</label>
                  <select 
                    value=${editData.role} 
                    onInput=${(e) => setEditData({...editData, role: e.target.value})} 
                    disabled=${editData.id === currentUserId}
                    style="width:100%; padding:10px; border:1px solid var(--border-strong); border-radius:8px; margin-top:4px; background: ${editData.id === currentUserId ? 'var(--surface-muted)' : 'white'};"
                  >
                    <option value="user">Guru (User)</option>
                    <option value="admin">Admin</option>
                    ${currentUserRole === 'superadmin' && html`<option value="superadmin">Superadmin</option>`}
                  </select>
                  ${editData.id === currentUserId && html`<div style="font-size:11px; color:var(--warning); margin-top:4px;">Anda tidak dapat mengubah role Anda sendiri.</div>`}
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-cancel" onClick=${() => setEditData(null)}>Batal</button>
                <button type="submit" class="btn-primary" disabled=${actionLoading}>Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      `}
    </div>
  `;
}

render(html`<${AdminApp} />`, document.getElementById('app'));
