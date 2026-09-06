import { useState, useEffect, useMemo } from 'react';
import { Users, Package, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('en-IN').format(n);
const fmtCurr = (n) => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
function getInitials(name = '') { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }
function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'; }

/* ─── Colors ──────────────────────────────────────────────────── */
const PALETTE = ['#00d4ff', '#0083ff', '#7c3aed', '#00e5a0', '#f5a623', '#ff4d6d', '#00b4d8', '#6366f1'];

/* ─── Custom Tooltip ──────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111720', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontFamily: 'Sora, sans-serif', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
      <p style={{ fontSize: 11, color: '#4a5568', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.name}: <span style={{ color: '#f0f6fc' }}>{p.value}</span></p>
      ))}
    </div>
  );
};

/* ─── Stat Card ───────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, accent, trend, delay = 0 }) {
  return (
    <div className="stat-card fade-up" style={{ animationDelay: `${delay}s`, animationFillMode: 'both' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700,
            padding: '3px 8px', borderRadius: 6,
            background: trend >= 0 ? 'rgba(0,229,160,0.1)' : 'rgba(255,77,109,0.1)',
            color: trend >= 0 ? '#00e5a0' : '#ff4d6d',
          }}>
            {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 600, color: '#4a5568', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#2d3748', marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

/* ─── Role colors ─────────────────────────────────────────────── */
const ROLE_STYLES = {
  superadmin: { bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)', color: '#f5a623' },
  admin: { bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.2)', color: '#00d4ff' },
  user: { bg: 'rgba(74,85,104,0.15)', border: 'rgba(74,85,104,0.2)', color: '#4a5568' },
};

function RolePill({ role }) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.user;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700, fontFamily: 'Sora, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 5, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {role}
    </span>
  );
}

/* ─── Avatar ──────────────────────────────────────────────────── */
function Avatar({ id = '', name = '', size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: size * 0.35,
      color: '#00d4ff',
    }}>
      {getInitials(name)}
    </div>
  );
}

/* ─── Section Header ──────────────────────────────────────────── */
function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 700, color: '#8b9ab0', marginBottom: 2 }}>{title}</h3>
        {sub && <p style={{ fontSize: 11, color: '#2d3748' }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────── */
export default function Overview() {
  const { user: me } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [productStats, setProductStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/stats'),
      api.get('/products/stats'),
      api.get('/users?limit=6'),
    ]).then(([us, ps, ur]) => {
      setUserStats(us.data.stats);
      setProductStats(ps.data.stats);
      setRecentUsers(ur.data.users || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const roleData = useMemo(() => userStats?.roleBreakdown?.map(r => ({ name: r._id, value: r.count })) || [], [userStats]);
  const catData = useMemo(() => productStats?.categoryBreakdown?.map(c => ({ name: c._id, value: c.count })) || [], [productStats]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(0,212,255,0.15)', borderTopColor: '#00d4ff', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#2d3748', fontSize: 13, fontFamily: 'Sora, sans-serif' }}>Fetching data...</p>
        </div>
      </div>
    );
  }

  const cardStyle = {
    background: '#111720',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Welcome ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            — Overview
          </p>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 800, color: '#f0f6fc', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Hello, {me?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#4a5568' }}>Here's a real-time summary of your platform.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 8, padding: '8px 14px' }}>
          <div className="glow-dot" style={{ background: '#00e5a0', width: 6, height: 6, flexShrink: 0 }} />
          <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600, color: '#00e5a0' }}>Live</span>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard icon={Users} label="Total Users" accent="#00d4ff"
          value={fmt(userStats?.totalUsers ?? 0)}
          sub={`+${userStats?.newThisMonth ?? 0} this month`}
          trend={userStats?.newToday > 0 ? 12 : 0} delay={0.04} />
        <StatCard icon={Activity} label="Active Today" accent="#00e5a0"
          value={fmt(userStats?.newToday ?? 0)}
          sub="New registrations" delay={0.08} />
        <StatCard icon={Package} label="Products" accent="#7c3aed"
          value={fmt(productStats?.totalProducts ?? 0)}
          sub={`${productStats?.activeProducts ?? 0} active`} delay={0.12} />
        <StatCard icon={DollarSign} label="Inventory" accent="#f5a623"
          value={fmtCurr(productStats?.totalInventoryValue ?? 0)}
          sub={`${productStats?.lowStockProducts ?? 0} low stock`} delay={0.16} />
      </div>

      {/* ── Charts Row 1 ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>

        {/* Registration trend */}
        <div className="fade-up" style={{ ...cardStyle, animationDelay: '0.2s', animationFillMode: 'both' }}>
          <SectionHeader title="User Registration Trend" sub="Last 7 days" />
          <div style={{ padding: 20 }}>
            {userStats?.registrationTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={userStats.registrationTrend} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: '#2d3748', fontSize: 11, fontFamily: 'Sora, sans-serif' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#2d3748', fontSize: 11, fontFamily: 'Sora, sans-serif' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" name="Users" stroke="#00d4ff" strokeWidth={2} fill="url(#ug)" dot={{ fill: '#00d4ff', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#00d4ff', strokeWidth: 0, boxShadow: '0 0 10px #00d4ff' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d3748', fontSize: 13, fontFamily: 'Sora, sans-serif' }}>No data yet</div>
            )}
          </div>
        </div>

        {/* Role breakdown */}
        <div className="fade-up" style={{ ...cardStyle, animationDelay: '0.24s', animationFillMode: 'both' }}>
          <SectionHeader title="Roles" sub="User distribution" />
          <div style={{ padding: 20 }}>
            {roleData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={roleData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                      {roleData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {roleData.map((r, i) => (
                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                        <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, color: '#4a5568', textTransform: 'capitalize' }}>{r.name}</span>
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#8b9ab0' }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d3748', fontSize: 13 }}>No data</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2 ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Recent Users */}
        <div className="fade-up" style={{ ...cardStyle, animationDelay: '0.28s', animationFillMode: 'both' }}>
          <SectionHeader title="Recent Users" sub="Latest registrations"
            action={
              <a href="/dashboard/users" style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 600, color: '#00d4ff', textDecoration: 'none', letterSpacing: '0.04em' }}>
                View all →
              </a>
            }
          />
          <div style={{ padding: '4px 0' }}>
            {recentUsers.slice(0, 5).map((u, i) => (
              <div key={u._id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
                borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar id={u._id} name={u.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: '#8b9ab0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, color: '#2d3748', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <RolePill role={u.role} />
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 10, color: '#2d3748', marginTop: 4 }}>{fmtDate(u.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products by category */}
        <div className="fade-up" style={{ ...cardStyle, animationDelay: '0.32s', animationFillMode: 'both' }}>
          <SectionHeader title="Products by Category" sub="Inventory breakdown" />
          <div style={{ padding: 20 }}>
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={catData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: '#2d3748', fontSize: 10, fontFamily: 'Sora, sans-serif' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#2d3748', fontSize: 10, fontFamily: 'Sora, sans-serif' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Products" radius={[5, 5, 0, 0]}>
                    {catData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Package size={28} style={{ color: '#2d3748' }} />
                <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 13, color: '#2d3748' }}>No products yet</p>
                <a href="/dashboard/products" style={{ fontFamily: 'Sora, sans-serif', fontSize: 12, color: '#00d4ff', textDecoration: 'none' }}>Add products →</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Inventory Health ─────────────────────────────────── */}
      {productStats && (
        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, animationDelay: '0.36s', animationFillMode: 'both' }}>
          {[
            { label: 'Active Products', value: productStats.activeProducts, accent: '#00e5a0' },
            { label: 'Inactive', value: productStats.inactiveProducts, accent: '#4a5568' },
            { label: 'Low Stock (≤5)', value: productStats.lowStockProducts, accent: '#f5a623' },
            { label: 'Out of Stock', value: productStats.outOfStock, accent: '#ff4d6d' },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{
              background: `${accent}0a`, border: `1px solid ${accent}20`,
              borderRadius: 12, padding: '16px 18px', textAlign: 'center',
            }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 700, color: accent, marginBottom: 4 }}>{value}</p>
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, color: '#4a5568' }}>{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
