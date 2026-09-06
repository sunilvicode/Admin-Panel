import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, LogOut, Search, Plus, Pencil, Trash2,
  Shield, Activity, TrendingUp, X, Check,
  ChevronLeft, ChevronRight, Layers, AlertTriangle,
  Mail, User, Lock, Eye, EyeOff, BarChart3, Clock,
  Crown, UserCheck, UserX
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

/* ─── Helpers ─────────────────────────────────────── */
const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-fuchsia-500 to-purple-500',
];
const getGradient = (id = '') => {
  const code = id.charCodeAt(id.length - 1) || 0;
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const PER_PAGE = 6;

/* ─── Role Badge ──────────────────────────────────── */
const ROLE_CONFIG = {
  superadmin: {
    label: 'Superadmin',
    className: 'bg-amber-500/[0.12] border-amber-500/[0.25] text-amber-300',
    icon: <Crown size={10} />,
  },
  admin: {
    label: 'Admin',
    className: 'bg-violet-500/[0.12] border-violet-500/[0.25] text-violet-300',
    icon: <Shield size={10} />,
  },
  user: {
    label: 'User',
    className: 'bg-slate-500/[0.12] border-slate-500/[0.2] text-slate-400',
    icon: <User size={10} />,
  },
};

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  return (
    <span className={`inline-flex items-center gap-1 border text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${cfg.className}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

/* ─── Avatar ──────────────────────────────────────── */
function Avatar({ user, size = 'md' }) {
  const sz = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${getGradient(user._id)} flex items-center justify-center font-bold text-white shrink-0 shadow-md`}>
      {getInitials(user.name)}
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, gradient, delay }) {
  return (
    <div
      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 flex items-start gap-4 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg animate-fade-up"
      style={{ animationDelay: delay }}
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium mb-0.5">{label}</p>
        <p className="text-slate-100 text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Role Change Modal ───────────────────────────── */
function RoleModal({ user, currentUserRole, onClose, onUpdate, loading }) {
  const [role, setRole] = useState(user.role || 'user');
  const roles = ['user', 'admin', 'superadmin'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f0f1a] border border-white/[0.1] rounded-2xl w-full max-w-sm shadow-2xl modal-enter">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Crown size={15} className="text-amber-400" />
            </div>
            <h2 className="text-slate-100 font-semibold text-sm">Change Role</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-slate-100 transition-all">
            <X size={14} />
          </button>
        </div>

        <div className="p-5">
          {/* User preview */}
          <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] mb-5">
            <Avatar user={user} size="sm" />
            <div>
              <p className="text-slate-200 text-sm font-medium">{user.name}</p>
              <p className="text-slate-500 text-xs">{user.email}</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Select Role</p>
          <div className="space-y-2 mb-5">
            {roles.map((r) => {
              const cfg = ROLE_CONFIG[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left
                    ${role === r
                      ? 'border-violet-500/40 bg-violet-500/10'
                      : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.className} border`}>
                      {r === 'superadmin' ? <Crown size={13} /> : r === 'admin' ? <Shield size={13} /> : <User size={13} />}
                    </div>
                    <div>
                      <p className="text-slate-200 text-sm font-medium capitalize">{r}</p>
                      <p className="text-slate-600 text-xs">
                        {r === 'superadmin' ? 'Full access · Can delete & change roles'
                          : r === 'admin' ? 'Can view & edit users'
                          : 'Basic access only'}
                      </p>
                    </div>
                  </div>
                  {role === r && <Check size={14} className="text-violet-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2.5">
            <button onClick={onClose} className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-slate-300 text-sm font-medium rounded-xl transition-all">
              Cancel
            </button>
            <button
              onClick={() => onUpdate(user._id, role)}
              disabled={loading || role === user.role}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {loading ? <><span className="spinner" /> Saving...</> : <><Check size={14} /> Apply Role</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Create/Edit Modal ───────────────────────────── */
function Modal({ title, onClose, onSubmit, loading, formData, setFormData, mode }) {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f0f1a] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl modal-enter">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
              {mode === 'create' ? <Plus size={16} className="text-white" /> : <Pencil size={16} className="text-white" />}
            </div>
            <h2 className="text-slate-100 font-semibold">{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-slate-100 transition-all">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {formData.name && (
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white text-sm">
                {getInitials(formData.name)}
              </div>
              <div>
                <p className="text-slate-200 text-sm font-medium">{formData.name}</p>
                <p className="text-slate-500 text-xs">{formData.email || 'email preview'}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
            <div className="relative">
              <input type="text" placeholder="John Doe" required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 pl-10 text-slate-100 placeholder-slate-600 text-sm" />
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
            <div className="relative">
              <input type="email" placeholder="john@company.com" required value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 pl-10 text-slate-100 placeholder-slate-600 text-sm" />
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              {mode === 'edit' ? 'New Password (optional)' : 'Password'}
            </label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'}
                placeholder={mode === 'edit' ? 'Leave blank to keep current' : 'Min. 8 characters'}
                required={mode === 'create'} minLength={mode === 'create' ? 8 : undefined}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 pl-10 pr-10 text-slate-100 placeholder-slate-600 text-sm" />
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 text-sm font-medium rounded-xl transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/30 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><span className="spinner" /> Saving...</> : <><Check size={15} /> {mode === 'create' ? 'Create User' : 'Save Changes'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete Modal ────────────────────────────────── */
function DeleteModal({ user, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f0f1a] border border-white/[0.1] rounded-2xl w-full max-w-sm shadow-2xl modal-enter p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <h2 className="text-slate-100 font-semibold">Delete User</h2>
        </div>
        <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] mb-4">
          <Avatar user={user} size="sm" />
          <div>
            <p className="text-slate-200 text-sm font-medium">{user.name}</p>
            <p className="text-slate-500 text-xs">{user.email}</p>
          </div>
          <div className="ml-auto"><RoleBadge role={user.role} /></div>
        </div>
        <p className="text-slate-400 text-sm mb-5">
          Are you sure you want to delete this user? This action <span className="text-red-400 font-semibold">cannot be undone</span>.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 text-sm font-medium rounded-xl transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><span className="spinner" /> Deleting...</> : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────── */
export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'delete' | 'role'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const { logout, user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Derive current user's role from localStorage token (decoded) or from API
  // We store user obj in AuthContext
  const myRole = currentUser?.role || 'user';
  const isSuperAdmin = myRole === 'superadmin';
  const isAdmin = myRole === 'admin' || isSuperAdmin;

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/profile');
      setUsers(res.data.users || []);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openCreate = () => { setFormData({ name: '', email: '', password: '' }); setModal('create'); };
  const openEdit = (user) => { setSelectedUser(user); setFormData({ name: user.name, email: user.email, password: '' }); setModal('edit'); };
  const openDelete = (user) => { setSelectedUser(user); setModal('delete'); };
  const openRole = (user) => { setSelectedUser(user); setModal('role'); };

  const handleCreate = async (e) => {
    e.preventDefault(); setActionLoading(true);
    try {
      await api.post('/users/register', formData);
      toast.success('User created!'); setModal(null); fetchUsers();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault(); setActionLoading(true);
    const payload = { name: formData.name, email: formData.email };
    if (formData.password) payload.password = formData.password;
    try {
      await api.put(`/users/${selectedUser._id}`, payload);
      toast.success('User updated!'); setModal(null); fetchUsers();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/users/${selectedUser._id}`);
      toast.success('User deleted!'); setModal(null); fetchUsers();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success(`Role changed to ${newRole}!`); setModal(null); fetchUsers();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const today = new Date().toDateString();
  const newToday = users.filter((u) => new Date(u.createdAt).toDateString() === today).length;
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length;

  return (
    <div className="min-h-screen grid-bg relative flex flex-col">
      <div className="orb-1" /><div className="orb-2" />

      {/* ── Topbar ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.07] px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Sunilvi.dev Admin</span>
              <span className="text-slate-600 text-xs ml-2 hidden sm:inline">User Management</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live */}
            <div className="hidden sm:flex items-center gap-1.5 bg-green-500/[0.08] border border-green-500/[0.15] rounded-lg px-2.5 py-1.5">
              <span className="pulse-dot" style={{ width: 6, height: 6 }} />
              <span className="text-green-400 text-xs font-medium">Live</span>
            </div>

            {/* Current user role badge */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5">
                <Avatar user={{ _id: '000', name: currentUser.name || 'Admin', ...currentUser }} size="sm" />
                <div>
                  <p className="text-slate-200 text-xs font-medium leading-none mb-0.5">{currentUser.name}</p>
                  <RoleBadge role={currentUser.role || 'user'} />
                </div>
              </div>
            )}

            <button onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/[0.05] hover:bg-red-500/[0.1] border border-white/[0.07] hover:border-red-500/[0.2] text-slate-400 hover:text-red-400 rounded-xl text-xs font-medium transition-all">
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────── */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">

        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mb-1">User Management</h1>
          <p className="text-slate-500 text-sm">Full CRUD with role-based access control.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
          <StatCard icon={Users} label="Total Users" value={users.length} sub="All registered" gradient="from-violet-500 to-indigo-500" delay="0.05s" />
          <StatCard icon={Activity} label="Active Today" value={newToday || 0} sub="Joined today" gradient="from-blue-500 to-cyan-500" delay="0.1s" />
          <StatCard icon={TrendingUp} label="This Month" value={users.filter(u => new Date(u.createdAt).getMonth() === new Date().getMonth()).length} sub="New signups" gradient="from-emerald-500 to-teal-500" delay="0.15s" />
          <StatCard icon={Crown} label="Admins" value={adminCount} sub="Admin & Superadmin" gradient="from-amber-500 to-orange-500" delay="0.2s" />
        </div>

        {/* Table */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.25s' }}>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-violet-400" />
              <span className="text-slate-200 font-semibold text-sm">All Users</span>
              <span className="bg-violet-500/20 text-violet-300 text-xs px-2 py-0.5 rounded-full font-medium border border-violet-500/20">
                {filtered.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" placeholder="Search users..."
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full sm:w-52 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2 pl-9 text-slate-200 placeholder-slate-600 text-xs" />
              </div>
              <button onClick={openCreate}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white text-xs font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/30">
                <Plus size={14} /> <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading users...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center mb-3">
                <Users size={24} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">No users found</p>
              <p className="text-slate-600 text-sm mt-1">Try a different search or add a new user</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      {['User', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {paginated.map((user, i) => (
                      <tr key={user._id} className="user-row" style={{ animationDelay: `${i * 0.04}s` }}>
                        {/* User */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar user={user} />
                            <div>
                              <p className="text-slate-100 text-sm font-semibold leading-tight">{user.name}</p>
                              <p className="text-slate-500 text-xs">#{user._id?.slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        {/* Email */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Mail size={12} className="text-slate-600 shrink-0" />
                            <span className="text-slate-300 text-sm">{user.email}</span>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <RoleBadge role={user.role || 'user'} />
                            {/* Superadmin can change roles */}
                            {isSuperAdmin && (
                              <button
                                onClick={() => openRole(user)}
                                className="w-6 h-6 rounded-md bg-white/[0.05] hover:bg-amber-500/10 border border-white/[0.06] hover:border-amber-500/20 text-slate-600 hover:text-amber-400 flex items-center justify-center transition-all"
                                title="Change role"
                              >
                                <Crown size={10} />
                              </button>
                            )}
                          </div>
                        </td>
                        {/* Joined */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-600 shrink-0" />
                            <span className="text-slate-400 text-sm">{formatDate(user.createdAt)}</span>
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(user)}
                              className="w-8 h-8 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 flex items-center justify-center transition-all"
                              title="Edit">
                              <Pencil size={13} />
                            </button>
                            {isSuperAdmin && (
                              <button onClick={() => openDelete(user)}
                                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 flex items-center justify-center transition-all"
                                title="Delete">
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

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-white/[0.05]">
                {paginated.map((user) => (
                  <div key={user._id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors">
                    <Avatar user={user} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-slate-100 text-sm font-semibold truncate">{user.name}</p>
                        <RoleBadge role={user.role || 'user'} />
                      </div>
                      <p className="text-slate-500 text-xs truncate">{user.email}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openEdit(user)} className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                        <Pencil size={13} />
                      </button>
                      {isSuperAdmin && (
                        <>
                          <button onClick={() => openRole(user)} className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                            <Crown size={13} />
                          </button>
                          <button onClick={() => openDelete(user)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.05]">
                  <p className="text-xs text-slate-500">
                    Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-slate-400 flex items-center justify-center disabled:opacity-40 transition-all">
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button key={i} onClick={() => setPage(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium border transition-all ${
                          page === i + 1
                            ? 'bg-gradient-to-r from-violet-600 to-blue-500 border-violet-500/40 text-white shadow-md shadow-violet-500/20'
                            : 'bg-white/[0.05] hover:bg-white/[0.09] border-white/[0.07] text-slate-400'
                        }`}>
                        {i + 1}
                      </button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-slate-400 flex items-center justify-center disabled:opacity-40 transition-all">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Role legend */}
        <div className="mt-4 flex flex-wrap gap-3 px-1">
          {Object.entries(ROLE_CONFIG).map(([r, cfg]) => (
            <div key={r} className="flex items-center gap-1.5 text-xs text-slate-600">
              <RoleBadge role={r} />
              <span className="text-slate-600">
                {r === 'superadmin' ? '— Full access' : r === 'admin' ? '— View & edit' : '— Basic access'}
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* ── Modals ─────────────────────────────────── */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Add New User' : 'Edit User'} mode={modal}
          onClose={() => setModal(null)}
          onSubmit={modal === 'create' ? handleCreate : handleUpdate}
          loading={actionLoading} formData={formData} setFormData={setFormData} />
      )}
      {modal === 'delete' && selectedUser && (
        <DeleteModal user={selectedUser} onClose={() => setModal(null)} onConfirm={handleDelete} loading={actionLoading} />
      )}
      {modal === 'role' && selectedUser && (
        <RoleModal user={selectedUser} currentUserRole={myRole}
          onClose={() => setModal(null)} onUpdate={handleRoleUpdate} loading={actionLoading} />
      )}
    </div>
  );
}
