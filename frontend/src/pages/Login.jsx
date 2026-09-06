import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Lock, Mail, X } from 'lucide-react';
import api from '../api/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: 'admin@gmail.com', password: 'admin123' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const isPasswordValid = form.password.length >= 6;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!isEmailValid) {
      toast.error('Enter a valid email address');
      return;
    }
    if (!form.password) {
      toast.error('Password is required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/users/login', {
        email: form.email.trim(),
        password: form.password,
      });
      login(res.data.token, res.data.user);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* ── Left Branding Panel ──────────────────────────────── */}
      <div className="auth-panel-left">
        {/* Top brand mark */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '64px' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #00d4ff, #0083ff)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#080c14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '15px', color: '#f0f6fc', letterSpacing: '-0.02em' }}>
              NexusAdmin
            </span>
          </div>

          {/* Main headline */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: 20, padding: '4px 12px', marginBottom: 20,
            }}>
              <div className="glow-dot" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#00d4ff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                v2.0 — Now Live
              </span>
            </div>
            <h1 style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '38px',
              color: '#f0f6fc', lineHeight: 1.15, letterSpacing: '-0.04em',
              marginBottom: 16,
            }}>
              The Admin Panel<br />
              <span style={{
                background: 'linear-gradient(90deg, #00d4ff, #0083ff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Built Different.</span>
            </h1>
            <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.7, maxWidth: 360 }}>
              Full-stack MERN application with JWT auth, role-based access control, real-time analytics, and validation.
            </p>
          </div>

          {/* Feature list */}
          <div>
            {[
              { label: 'JWT Authentication', sub: 'Secure token-based auth with 7-day expiry' },
              { label: 'Role-Based Access', sub: 'User · Admin · Superadmin permissions' },
              { label: 'Email OTP Reset', sub: 'Nodemailer with Gmail App Password' },
              { label: 'Form & API Validation', sub: 'Client feedback + express-validator backend' },
            ].map((f) => (
              <div key={f.label} className="feature-item">
                <div className="feature-dot" />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#8b9ab0', marginBottom: 2 }}>{f.label}</p>
                  <p style={{ fontSize: 12, color: '#2d3748' }}>{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tech stack */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 10, color: '#2d3748', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            Built with
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['MongoDB', 'Express', 'React', 'Node.js', 'JWT', 'Bcrypt', 'Express-Validator'].map((t) => (
              <span key={t} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#4a5568',
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────── */}
      <div className="auth-panel-right">
        <div style={{ width: '100%', maxWidth: 380 }} className="fade-up">

          {/* Mobile logo */}
          <div style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 40 }} className="mobile-brand">
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #00d4ff, #0083ff)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#080c14" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#f0f6fc' }}>NexusAdmin</span>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0f6fc', letterSpacing: '-0.03em', marginBottom: 6 }}>
              Sign in
            </h2>
            <p style={{ fontSize: 13, color: '#4a5568' }}>
              Enter your credentials to access the dashboard.
            </p>
          </div>

          {/* Status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 10, marginBottom: 28,
            background: 'rgba(0, 229, 160, 0.06)', border: '1px solid rgba(0, 229, 160, 0.15)',
          }}>
            <div className="glow-dot" style={{ background: '#00e5a0' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#00e5a0' }}>
              All systems operational
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label className="floating-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: touched.email && !isEmailValid ? '#ff4d6d' : '#4a5568' }} />
                <input
                  type="email"
                  placeholder="admin@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onBlur={() => handleBlur('email')}
                  required
                  className="input-field"
                  style={{
                    paddingLeft: 40,
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

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <label className="floating-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: touched.password && !form.password ? '#ff4d6d' : '#4a5568' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onBlur={() => handleBlur('password')}
                  required
                  className="input-field"
                  style={{
                    paddingLeft: 40,
                    paddingRight: 40,
                    borderColor: touched.password ? (form.password ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255, 77, 109, 0.5)') : undefined,
                  }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568',
                  display: 'flex', alignItems: 'center', padding: 0,
                }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {touched.password && !form.password && (
                <p style={{ fontSize: 11, color: '#ff4d6d', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <X size={12} /> Password is required
                </p>
              )}
            </div>

            {/* Forgot */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
              <Link to="/forgot-password" style={{ fontSize: 12, fontWeight: 500, color: '#00d4ff', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading
                ? <><span className="spinner" /> Signing in...</>
                : <>Sign in <ArrowRight size={15} /></>
              }
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: '#2d3748', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Register link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: '#4a5568' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#00d4ff', fontWeight: 600, textDecoration: 'none' }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
