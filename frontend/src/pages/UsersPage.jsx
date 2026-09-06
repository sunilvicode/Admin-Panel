import { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Search, Plus, Pencil, Trash2, X, Check, ChevronLeft, ChevronRight, AlertTriangle, Mail, User, Lock, Eye, EyeOff, Crown, Shield, Filter } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

/* ─── Helpers ─────────────────────────────────────────────────── */
const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
const PER_PAGE = 8;

/* ─── Role Config ─────────────────────────────────────────────── */
const ROLES = {
  superadmin: { label: 'Superadmin', color: '#f5a623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)' },
  admin: { label: 'Admin', color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.2)' },
  user: { label: 'User', color: '#4a5568', bg: 'rgba(74,85,104,0.15)', border: 'rgba(74,85,104,0.2)' },
};

function RolePill({ role }) {
  const r = ROLES[role] || ROLES.user;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 5, background: r.bg, border: `1px solid ${r.border}`, color: r.color, fontSize: 10, fontWeight: 700, fontFamily: 'Sora, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {role === 'superadmin' ? <Crown size={9} /> : role === 'admin' ? <Shield size={9} /> : <User size={9} />}
      {r.label}
    </span>
  );
}

function Avatar({ id = '', name = '' }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 12, color: '#00d4ff', flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

/* ─── Shared styles ───────────────────────────────────────────── */
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9,
  padding: '10px 14px', paddingLeft: 38, color: '#f0f6fc',
  fontFamily: 'Sora, sans-serif', fontSize: 13,
};
const labelStyle = { display: 'block', fontFamily: 'Sora, sans-serif', fontSize: 10, fontWeight: 700, color: '#2d3748', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 };

/* ─── User Modal ──────────────────────────────────────────────── */
function UserModal({ mode, user, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [showPw, setShowPw] = useState(false);

  const handleBlur = (field) => setTouched(t => ({ ...t, [field]: true }));
  const isNameValid = form.name.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const isPasswordValid = mode === 'edit' ? (!form.password || form.password.length >= 6) : (form.password.length >= 6);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });

    if (!isNameValid) return toast.error('Full name must be at least 2 characters');
    if (!isEmailValid) return toast.error('Please enter a valid email address');
    if (!isPasswordValid) return toast.error('Password must be at least 6 characters');

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      ...(form.password ? { password: form.password } : {}),
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="modal-enter" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {mode === 'create' ? <Plus size={15} style={{ color: '#00d4ff' }} /> : <Pencil size={15} style={{ color: '#00d4ff' }} />}
            </div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: '#f0f6fc' }}>{mode === 'create' ? 'Add User' : 'Edit User'}</h2>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a5568' }}>
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: touched.name && !isNameValid ? '#ff4d6d' : '#2d3748' }} />
              <input
                type="text"
                placeholder="John Doe"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                onBlur={() => handleBlur('name')}
                className="input-field"
                style={{
                  paddingLeft: 36,
                  borderColor: touched.name ? (isNameValid ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255, 77, 109, 0.5)') : undefined,
                }}
              />
            </div>
            {touched.name && !isNameValid && (
              <p style={{ fontSize: 11, color: '#ff4d6d', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={12} /> Name must be at least 2 characters
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: touched.email && !isEmailValid ? '#ff4d6d' : '#2d3748' }} />
              <input
                type="email"
                placeholder="john@company.com"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onBlur={() => handleBlur('email')}
                className="input-field"
                style={{
                  paddingLeft: 36,
                  borderColor: touched.email ? (isEmailValid ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255, 77, 109, 0.5)') : undefined,
                }}
              />
            </div>
            {touched.email && !isEmailValid && (
              <p style={{ fontSize: 11, color: '#ff4d6d', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={12} /> Please enter a valid email address
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>{mode === 'edit' ? 'New Password (optional)' : 'Password *'}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: touched.password && !isPasswordValid ? '#ff4d6d' : '#2d3748' }} />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={mode === 'edit' ? 'Leave blank to keep' : 'Min. 6 characters'}
                required={mode === 'create'}
                minLength={mode === 'create' ? 6 : 0}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onBlur={() => handleBlur('password')}
                className="input-field"
                style={{
                  paddingLeft: 36,
                  paddingRight: 36,
                  borderColor: touched.password ? (isPasswordValid ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255, 77, 109, 0.5)') : undefined,
                }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#2d3748', display: 'flex', alignItems: 'center', padding: 0 }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {touched.password && !isPasswordValid && (
              <p style={{ fontSize: 11, color: '#ff4d6d', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={12} /> Password must be at least 6 characters
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, color: '#4a5568', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', fontSize: 13 }}>
              {loading ? <><span className="spinner" /> Saving...</> : <><Check size={14} />{mode === 'create' ? 'Create' : 'Save'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete Modal ────────────────────────────────────────────── */
function DeleteModal({ user, onClose, onConfirm, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="modal-enter" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, width: '100%', maxWidth: 360, padding: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={16} style={{ color: '#ff4d6d' }} />
          </div>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: '#f0f6fc' }}>Delete User</h2>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: '#8b9ab0' }}>{user.name}</p>
          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, color: '#2d3748' }}>{user.email}</p>
        </div>
        <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, color: '#4a5568', marginBottom: 20, lineHeight: 1.6 }}>
          This action <span style={{ color: '#ff4d6d', fontWeight: 700 }}>cannot be undone</span>. User will be permanently removed.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, color: '#4a5568', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '10px', background: '#ff4d6d', border: 'none', borderRadius: 9, color: 'white', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.6 : 1 }}>
            {loading ? <><span className="spinner" /> Deleting...</> : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Role Modal ──────────────────────────────────────────────── */
function RoleModal({ user, onClose, onUpdate, loading }) {
  const [role, setRole] = useState(user.role || 'user');
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="modal-enter" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, width: '100%', maxWidth: 340, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: '#f0f6fc' }}>Change Role</h2>
          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, color: '#2d3748', marginTop: 2 }}>{user.name}</p>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['user', 'admin', 'superadmin'].map((r) => {
            const rc = ROLES[r];
            const selected = role === r;
            return (
              <button key={r} type="button" onClick={() => setRole(r)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                background: selected ? `${rc.color}12` : 'rgba(255,255,255,0.02)',
                border: selected ? `1px solid ${rc.color}30` : '1px solid rgba(255,255,255,0.06)',
                textAlign: 'left', fontFamily: 'Sora, sans-serif', transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: rc.bg, border: `1px solid ${rc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {r === 'superadmin' ? <Crown size={13} style={{ color: rc.color }} /> : r === 'admin' ? <Shield size={13} style={{ color: rc.color }} /> : <User size={13} style={{ color: rc.color }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#8b9ab0' }}>{rc.label}</p>
                    <p style={{ fontSize: 11, color: '#2d3748' }}>{r === 'superadmin' ? 'Full access' : r === 'admin' ? 'Manage users' : 'View only'}</p>
                  </div>
                </div>
                {selected && <Check size={14} style={{ color: rc.color, flexShrink: 0 }} />}
              </button>
            );
          })}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, color: '#4a5568', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => onUpdate(user._id, role)} disabled={loading || role === user.role} style={{ flex: 1, padding: '10px 16px', background: '#f5a623', border: 'none', borderRadius: 9, color: '#080c14', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: (loading || role === user.role) ? 0.5 : 1 }}>
              {loading ? <><span className="spinner" style={{ borderTopColor: '#080c14' }} /> Saving...</> : <><Check size={14} /> Apply</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Users Page ─────────────────────────────────────────── */
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('All');
  const { user: me } = useAuth();
  const isSuperAdmin = me?.role === 'superadmin';

  const debounceTimer = useRef(null);
  const [debSearch, setDebSearch] = useState('');
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { setDebSearch(search); setPage(1); }, 350);
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users?limit=200');
      setUsers(res.data.users || []);
    } catch { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const ms = !debSearch || u.name?.toLowerCase().includes(debSearch.toLowerCase()) || u.email?.toLowerCase().includes(debSearch.toLowerCase());
    const mr = roleFilter === 'All' || u.role === roleFilter;
    return ms && mr;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const doCreate = async (form) => {
    setActionLoading(true);
    try { await api.post('/users/register', form); toast.success('User created!'); setModal(null); fetchUsers(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const doUpdate = async (form) => {
    setActionLoading(true);
    const payload = { name: form.name, email: form.email };
    if (form.password) payload.password = form.password;
    try { await api.put(`/users/${selected._id}`, payload); toast.success('User updated!'); setModal(null); fetchUsers(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const doDelete = async () => {
    setActionLoading(true);
    try { await api.delete(`/users/${selected._id}`); toast.success('User deleted!'); setModal(null); fetchUsers(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const doRoleUpdate = async (id, role) => {
    setActionLoading(true);
    try { await api.patch(`/users/${id}/role`, { role }); toast.success(`Role changed to ${role}`); setModal(null); fetchUsers(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const cardStyle = { background: '#111720', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' };
  const thStyle = { padding: '12px 20px', textAlign: 'left', fontFamily: 'Sora, sans-serif', fontSize: 10, fontWeight: 700, color: '#2d3748', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' };
  const tdStyle = { padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header */}
      <div className="fade-up">
        <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>— User Management</p>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0f6fc', letterSpacing: '-0.03em', marginBottom: 4 }}>Users</h1>
        <p style={{ fontSize: 13, color: '#4a5568' }}>Full CRUD with role-based access control.</p>
      </div>

      {/* Table Card */}
      <div className="fade-up" style={{ ...cardStyle, animationDelay: '0.1s', animationFillMode: 'both' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Filter size={13} style={{ color: '#2d3748' }} />
            {['All', 'superadmin', 'admin', 'user'].map(r => (
              <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }} style={{
                padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 700,
                textTransform: r !== 'All' ? 'uppercase' : 'none', letterSpacing: '0.04em',
                background: roleFilter === r ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                border: roleFilter === r ? '1px solid rgba(0,212,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                color: roleFilter === r ? '#00d4ff' : '#4a5568', transition: 'all 0.15s',
              }}>{r}</button>
            ))}
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2d3748', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 8px' }}>{filtered.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#2d3748' }} />
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '8px 14px', paddingLeft: 32, color: '#f0f6fc', fontFamily: 'Sora, sans-serif', fontSize: 12, width: 180 }} />
              {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#2d3748', display: 'flex', padding: 0 }}><X size={12} /></button>}
            </div>
            <button onClick={() => { setSelected(null); setModal('create'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#00d4ff', border: 'none', borderRadius: 9, color: '#080c14', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(0,212,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <Plus size={14} /> Add User
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(0,212,255,0.15)', borderTopColor: '#00d4ff', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, color: '#2d3748' }}>Loading users...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
            <Users size={28} style={{ color: '#2d3748', marginBottom: 10 }} />
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, color: '#4a5568', fontWeight: 600 }}>No users found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {paged.map(u => (
                  <tr key={u._id} className="table-row">
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar id={u._id} name={u.name} />
                        <div>
                          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: '#8b9ab0' }}>{u.name}</p>
                          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#2d3748' }}>#{u._id?.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}><span style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, color: '#4a5568' }}>{u.email}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RolePill role={u.role || 'user'} />
                        {isSuperAdmin && (
                          <button onClick={() => { setSelected(u); setModal('role'); }} className="icon-btn warning" title="Change role" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 6, cursor: 'pointer', color: '#4a5568' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.12)'; e.currentTarget.style.color = '#f5a623'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.06)'; e.currentTarget.style.color = '#4a5568'; }}>
                            <Crown size={10} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#2d3748' }}>{fmtDate(u.createdAt)}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setSelected(u); setModal('edit'); }} style={{ width: 30, height: 30, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a5568', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.12)'; e.currentTarget.style.color = '#00d4ff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; e.currentTarget.style.color = '#4a5568'; }}>
                          <Pencil size={13} />
                        </button>
                        {isSuperAdmin && (
                          <button onClick={() => { setSelected(u); setModal('delete'); }} style={{ width: 30, height: 30, background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a5568', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.12)'; e.currentTarget.style.color = '#ff4d6d'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.06)'; e.currentTarget.style.color = '#4a5568'; }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, color: '#2d3748' }}>
              {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a5568', opacity: page===1?0.4:1 }}><ChevronLeft size={14} /></button>
              {Array.from({length: totalPages}, (_, i) => (
                <button key={i} onClick={() => setPage(i+1)} style={{ width: 30, height: 30, background: page===i+1?'#00d4ff':'rgba(255,255,255,0.03)', border: page===i+1?'1px solid #00d4ff':'1px solid rgba(255,255,255,0.07)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: page===i+1?'#080c14':'#4a5568', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700 }}>{i+1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a5568', opacity: page===totalPages?0.4:1 }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(modal === 'create') && <UserModal mode="create" onClose={() => setModal(null)} onSubmit={doCreate} loading={actionLoading} />}
      {(modal === 'edit') && selected && <UserModal mode="edit" user={selected} onClose={() => setModal(null)} onSubmit={doUpdate} loading={actionLoading} />}
      {(modal === 'delete') && selected && <DeleteModal user={selected} onClose={() => setModal(null)} onConfirm={doDelete} loading={actionLoading} />}
      {(modal === 'role') && selected && <RoleModal user={selected} onClose={() => setModal(null)} onUpdate={doRoleUpdate} loading={actionLoading} />}
    </div>
  );
}
