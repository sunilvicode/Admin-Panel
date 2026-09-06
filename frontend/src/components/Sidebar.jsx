import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, Package, LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const NAV = [
  { path: '/dashboard', icon: LayoutGrid, label: 'Overview' },
  { path: '/dashboard/users', icon: Users, label: 'Users' },
  { path: '/dashboard/products', icon: Package, label: 'Products' },
];

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const ROLE_BADGES = {
  superadmin: { label: 'Superadmin', color: '#f5a623' },
  admin: { label: 'Admin', color: '#00d4ff' },
  user: { label: 'User', color: '#4a5568' },
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  const roleCfg = ROLE_BADGES[user?.role] || ROLE_BADGES.user;

  const SidebarContent = () => (
    <div style={{
      width: collapsed ? 60 : 220,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1117',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '20px 0' : '20px 18px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        minHeight: 64, flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, flexShrink: 0,
          background: 'linear-gradient(135deg, #00d4ff, #0083ff)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(0,212,255,0.3)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080c14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </div>
        {!collapsed && (
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: '#f0f6fc', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            NexusAdmin
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && (
          <p style={{ fontSize: 10, fontWeight: 700, color: '#2d3748', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 8px', marginBottom: 8 }}>
            Menu
          </p>
        )}
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '9px 0' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8, marginBottom: 2,
                textDecoration: 'none',
                fontFamily: 'Sora, sans-serif',
                fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? '#00d4ff' : '#4a5568',
                background: active ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                border: active ? '1px solid rgba(0,212,255,0.15)' : '1px solid transparent',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#8b9ab0'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a5568'; } }}
            >
              {active && !collapsed && (
                <div style={{ position: 'absolute', left: -1, top: '50%', transform: 'translateY(-50%)', width: 2, height: '60%', background: '#00d4ff', borderRadius: '0 2px 2px 0' }} />
              )}
              <Icon size={16} style={{ flexShrink: 0, color: active ? '#00d4ff' : '#4a5568' }} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 10px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 10, marginBottom: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #00d4ff22, #0083ff22)',
              border: '1px solid rgba(0,212,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 12, color: '#00d4ff',
            }}>
              {getInitials(user?.name || 'A')}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600, color: '#8b9ab0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: 10, fontWeight: 600, color: roleCfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {roleCfg.label}
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8, padding: collapsed ? '9px 0' : '9px 10px',
            background: 'transparent', border: '1px solid transparent',
            borderRadius: 8, cursor: 'pointer', fontFamily: 'Sora, sans-serif',
            fontSize: 13, fontWeight: 500, color: '#4a5568',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,77,109,0.15)'; e.currentTarget.style.color = '#ff4d6d'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#4a5568'; }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign out</span>}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="desktop-only"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8, padding: collapsed ? '8px 0' : '8px 10px',
            background: 'transparent', border: '1px solid transparent',
            borderRadius: 8, cursor: 'pointer', fontFamily: 'Sora, sans-serif',
            fontSize: 12, color: '#2d3748', marginTop: 4,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#4a5568'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2d3748'; }}
        >
          {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div style={{ display: 'none', position: 'sticky', top: 0, height: '100vh', flexShrink: 0, zIndex: 30 }} className="sidebar-desktop">
        <SidebarContent />
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="sidebar-mobile-btn"
        style={{ display: 'none', position: 'fixed', top: 16, left: 16, zIndex: 50, width: 38, height: 38, background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8b9ab0' }}
      >
        <Menu size={17} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'relative', width: 220 }}>
            <SidebarContent />
            <button
              onClick={() => setMobileOpen(false)}
              style={{ position: 'absolute', top: 14, right: -44, width: 34, height: 34, background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a5568' }}
            >
              <X size={15} />
            </button>
          </div>
          <div onClick={() => setMobileOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: block !important; }
        }
        @media (max-width: 767px) {
          .sidebar-mobile-btn { display: flex !important; }
        }
        .desktop-only {
          display: flex !important;
        }
        @media (max-width: 767px) {
          .desktop-only { display: none !important; }
        }
      `}</style>
    </>
  );
}
