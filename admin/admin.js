/**
 * TKA Studio — admin/admin.js
 * © 2026 Ekwan Nugroho — Wonogiri
 */
import { h, render } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import {
  Search, CheckCircle2, XCircle, Clock,
  Trash2, Key, Loader2, AlertTriangle, Copy, Check, Shield
} from 'https://esm.sh/lucide-preact@0.460.0?deps=preact@10.24.3';
import { getSupabase } from '../supabase/client.js';

const html = htm.bind(h);

function AdminPanel() {
  const [authState, setAuthState] = useState('loading'); // loading | unauthorized | authorized
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending'); 
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  
  const [confirmData, setConfirmData] = useState(null);
  const [passwordData, setPasswordData] = useState(null);
  const [copied, setCopied] = useState(false);

  // ==========================================
  // 1. CEK SESI LOGIN & ROLE ADMIN
  // ==========================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const client = await getSupabase();
        const { data: { session } } = await client.auth.getSession();
        
        if (!session) {
          setAuthState('unauthorized');
          setLoading(false);
          return;
        }

        // Cek apakah user ini admin
        const { data: profile } = await client
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile && profile.role === 'admin') {
          setAuthState('authorized');
          loadUsers();
        } else {
          setAuthState('unauthorized');
          setLoading(false);
        }
      } catch (e) {
        setAuthState('unauthorized');
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ==========================================
  // 2. AMBIL DATA GURU
  // ==========================================
  const loadUsers = async () => {
    setLoading(true);
    try {
      const client = await getSupabase();
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log("Data berhasil dimuat:", data); // Cek di F12 Console
      setUsers(data || []);
    } catch (e) {
      console.error("Error load:", e);
      if (window.showToast) window.showToast('Gagal memuat data: ' + e.message, 'error');
    }
    setLoading(false);
  };

  // ... (Fungsi handleActivate, handleSuspend, handleDelete, handleTogglePublish, copyPassword tetap sama seperti sebelumnya) ...
  const handleActivate = (user) => {
    setConfirmData({
      title: 'Aktifkan Akun?',
      message: `Akun ${user.nama} (${user.email}) akan diaktifkan dan password baru akan digenerate.`,
      confirmText: 'Ya, Aktifkan',
      isDanger: false,
      onConfirm: async () => {
        setConfirmData(null);
        setActionLoading(user.id);
        try {
          const client = await getSupabase();
          const { data, error } = await client.functions.invoke('activate', {
            body: { userId: user.id, email: user.email }
          });
          if (error) throw error;
          if (data.error) throw new Error(data.error);
          setPasswordData({ name: user.nama, email: user.email, password: data.password });
          loadUsers();
        } catch (e) {
          if (window.showToast) window.showToast('Gagal aktivasi: ' + e.message, 'error');
        }
        setActionLoading(null);
      }
    });
  };

  const handleSuspend = (user) => {
    setConfirmData({
      title: 'Tangguhkan Akun?',
      message: `Akun ${user.nama} tidak akan bisa login sampai diaktifkan kembali.`,
      confirmText: 'Ya, Tangguhkan',
      isDanger: true,
      onConfirm: async () => {
        setConfirmData(null);
        setActionLoading(user.id);
        try {
          const client = await getSupabase();
          await client.from('profiles').update({ status: 'suspended' }).eq('id', user.id);
          if (window.showToast) window.showToast('Akun ditangguhkan.', 'success');
          loadUsers();
        } catch (e) {
          if (window.showToast) window.showToast('Gagal menangguhkan: ' + e.message, 'error');
        }
        setActionLoading(null);
      }
    });
  };

  const handleDelete = (user) => {
    setConfirmData({
      title: 'Hapus Akun Permanen?',
      message: `Akun ${user.nama} beserta seluruh datanya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: async () => {
        setConfirmData(null);
        setActionLoading(user.id);
        try {
          const client = await getSupabase();
          const { error } = await client.functions.invoke('delete-user', {
            body: { userId: user.id }
          });
          if (error) throw error;
          if (window.showToast) window.showToast('Akun berhasil dihapus.', 'success');
          loadUsers();
        } catch (e) {
          if (window.showToast) window.showToast('Gagal menghapus: ' + e.message, 'error');
        }
        setActionLoading(null);
      }
    });
  };

  const handleTogglePublish = async (user) => {
    setActionLoading(user.id);
    try {
      const client = await getSupabase();
      const newStatus = !user.can_publish_exam;
      const { error } = await client
        .from('profiles')
        .update({ can_publish_exam: newStatus })
        .eq('id', user.id);
      if (error) throw error;
      if (window.showToast) {
        window.showToast(newStatus ? 'Izin Kode Latihan diberikan.' : 'Izin Kode Latihan dicabut.', 'success');
      }
      loadUsers();
    } catch (e) {
      if (window.showToast) window.showToast('Gagal mengubah izin: ' + e.message, 'error');
    }
    setActionLoading(null);
  };

  const copyPassword = () => {
    if (!passwordData) return;
    navigator.clipboard.writeText(passwordData.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================================
  // 3. RENDER UI
  // ==========================================
  if (authState === 'loading') {
    return html`
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--surface);">
        <${Loader2} class="spin" size=${40} color="var(--primary)" />
      </div>
    `;
  }

  if (authState === 'unauthorized') {
    return html`
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--surface); padding: 20px;">
        <div style="background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: var(--shadow-lift);">
          <${Shield} size=${48} color="var(--danger)" style="margin-bottom: 16px;" />
          <h1 style="font-size: 20px; margin-bottom: 8px;">Akses Ditolak</h1>
          <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 24px;">
            Anda belum login sebagai Admin, atau akun Anda tidak memiliki hak akses panel admin.
          </p>
          <a href="../" class="btn-primary" style="display: inline-block; text-decoration: none;">Kembali ke Aplikasi & Login</a>
        </div>
      </div>
    `;
  }

  // Jika Lolos (Authorized)
  const filteredUsers = users.filter(u => {
    if (tab === 'pending' && u.status !== 'pending') return false;
    if (tab === 'active' && u.status !== 'active') return false;
    if (tab === 'suspended' && u.status !== 'suspended') return false;
    
    if (search) {
      const q = search.toLowerCase();
      return (u.nama || '').toLowerCase().includes(q) || 
             (u.email || '').toLowerCase().includes(q) ||
             (u.sekolah || '').toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    pending: users.filter(u => u.status === 'pending').length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
  };

  return html`
    <div class="admin-container">
      
      <div class="admin-header">
        <div>
          <h1 class="admin-title">Panel Admin</h1>
          <p class="admin-subtitle">Kelola akun guru dan izin akses TKA Studio.</p>
        </div>
        <button class="btn-secondary" onClick=${() => window.location.href='../'}>Ke Aplikasi</button>
      </div>

      <div class="admin-tabs">
        <button class=${'admin-tab ' + (tab === 'pending' ? 'active' : '')} onClick=${() => setTab('pending')}>
          <${Clock} size=${16} /> Menunggu <span class="badge">${counts.pending}</span>
        </button>
        <button class=${'admin-tab ' + (tab === 'active' ? 'active' : '')} onClick=${() => setTab('active')}>
          <${CheckCircle2} size=${16} /> Aktif <span class="badge">${counts.active}</span>
        </button>
        <button class=${'admin-tab ' + (tab === 'suspended' ? 'active' : '')} onClick=${() => setTab('suspended')}>
          <${XCircle} size=${16} /> Suspend <span class="badge">${counts.suspended}</span>
        </button>
      </div>

      <div class="admin-search-bar">
        <${Search} size=${18} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Cari nama, email, atau sekolah..." 
          value=${search}
          onInput=${(e) => setSearch(e.target.value)}
        />
      </div>

      <div class="admin-card">
        ${loading ? html`
          <div style="padding: 40px; text-align: center;"><${Loader2} class="spin" size=${32} color="var(--primary)" /></div>
        ` : filteredUsers.length === 0 ? html`
          <div style="padding: 40px; text-align: center; color: var(--text-muted);">
            Tidak ada data ditemukan.
          </div>
        ` : html`
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Nama & Email</th>
                  <th>Sekolah / WA</th>
                  <th>Status</th>
                  <th>Izin Kode</th>
                  <th style="text-align: right;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${filteredUsers.map(user => html`
                  <tr key=${user.id}>
                    <td>
                      <div style="font-weight: 700; color: var(--navy-900);">${user.nama}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">${user.email}</div>
                      ${user.role === 'admin' && html`<span class="badge badge-purple">ADMIN</span>`}
                    </td>
                    <td>
                      <div style="font-size: 13px;">${user.sekolah || '-'}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">${user.wa || '-'}</div>
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
                      <div class="admin-actions">
                        ${actionLoading === user.id ? html`<${Loader2} class="spin" size=${16} />` : html`
                          ${user.status === 'pending' ? html`
                            <button class="btn-action btn-activate" onClick=${() => handleActivate(user)} title="Aktifkan"><${CheckCircle2} size=${16} /></button>
                            <button class="btn-action btn-delete" onClick=${() => handleDelete(user)} title="Hapus"><${Trash2} size=${16} /></button>
                          ` : ''}
                          
                          ${user.status === 'active' ? html`
                            <button 
                              class=${'btn-action ' + (user.can_publish_exam ? 'btn-warning' : 'btn-secondary')}
                              onClick=${() => handleTogglePublish(user)}
                              title=${user.can_publish_exam ? 'Cabut Izin Kode' : 'Beri Izin Kode'}
                            >
                              <${Key} size=${16} />
                            </button>
                            <button class="btn-action btn-delete" onClick=${() => handleSuspend(user)} title="Suspend"><${XCircle} size=${16} /></button>
                          ` : ''}

                          ${user.status === 'suspended' ? html`
                            <button class="btn-action btn-activate" onClick=${() => handleActivate(user)} title="Aktifkan Kembali"><${CheckCircle2} size=${16} /></button>
                            <button class="btn-action btn-delete" onClick=${() => handleDelete(user)} title="Hapus"><${Trash2} size=${16} /></button>
                          ` : ''}
                        `}
                      </div>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Modals (Confirm & Password) tetap sama -->
      ${confirmData && html`
        <div class="modal-backdrop" onClick=${() => setConfirmData(null)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()} style="max-width: 400px; text-align: center;">
            <div class="modal-header">
              <div class="modal-title" style="justify-content: center; width: 100%;">
                <${AlertTriangle} size=${20} color=${confirmData.isDanger ? 'var(--danger)' : 'var(--warning)'} />
                <span>${confirmData.title}</span>
              </div>
            </div>
            <div class="modal-body">
              <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6;">${confirmData.message}</p>
            </div>
            <div class="modal-footer" style="justify-content: center;">
              <button class="btn-secondary" onClick=${() => setConfirmData(null)}>Batal</button>
              <button class=${confirmData.isDanger ? 'btn-danger' : 'btn-primary'} onClick=${confirmData.onConfirm}>
                ${confirmData.confirmText}
              </button>
            </div>
          </div>
        </div>
      `}

      ${passwordData && html`
        <div class="modal-backdrop" onClick=${() => setPasswordData(null)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()} style="max-width: 400px;">
            <div class="modal-header">
              <div class="modal-title"><${Key} size=${20} color="var(--success)" /> Akun Berhasil Diaktifkan</div>
            </div>
            <div class="modal-body">
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                Berikan password ini ke <b>${passwordData.name}</b> via WhatsApp. Password ini hanya muncul sekali.
              </p>
              <div style="background: var(--surface-muted); padding: 16px; border-radius: 12px; text-align: center; border: 1px dashed var(--border-strong);">
                <div style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: var(--primary);">
                  ${passwordData.password}
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" onClick=${() => setPasswordData(null)}>Tutup</button>
              <button class="btn-primary" onClick=${copyPassword}>
                ${copied ? html`<${Check} size=${16} /> Tersalin!` : html`<${Copy} size=${16} /> Salin Password`}
              </button>
            </div>
          </div>
        </div>
      `}

    </div>
  `;
}

render(html`<${AdminPanel} />`, document.getElementById('app'));
