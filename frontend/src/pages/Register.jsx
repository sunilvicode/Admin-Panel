import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, Check, X, ShieldCheck } from 'lucide-react';
import api from '../api/api';
import { toast } from 'sonner';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  // Validation rules
  const isNameValid = form.name.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const hasMinLength = form.password.length >= 6;
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password);

  const pwStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (hasMinLength) score++;
    if (p.length >= 10) score++;
    if (hasUppercase) score++;
    if (hasNumberOrSymbol) score++;
    return score;
  })();

  const pwStrengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength];
  const pwStrengthColor = ['', '#ff4d6d', '#f5a623', '#00d4ff', '#00e5a0'][pwStrength];

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });

    if (!isNameValid) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!isEmailValid) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!hasMinLength) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* ── Left Panel ─────────────────────────────────────── */}
      <div className="auth-panel-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #00d4ff, #0083ff)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#080c14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: '#f0f6fc', letterSpacing: '-0.02em' }}>NexusAdmin</span>
          </div>

          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 38, color: '#f0f6fc', lineHeight: 1.15, letterSpacing: '-0.04em', marginBottom: 16 }}>
            Join the<br />
            <span style={{ background: 'linear-gradient(90deg, #00d4ff, #0083ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Platform.</span>
          </h1>
          <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.7, maxWidth: 320 }}>
            Create your admin account and start managing users, products, and analytics with built-in validation and enterprise security.
          </p>
        </div>

        {/* Stats */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { val: 'MERN', label: 'Tech Stack' },
              { val: 'JWT + Hash', label: 'Security' },
              { val: 'RBAC', label: 'Role Control' },
              { val: 'Express-Val', label: 'Data Validation' },
            ].map(({ val, label }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: '#00d4ff', marginBottom: 4 }}>{val}</p>
                <p style={{ fontSize: 11, color: '#4a5568' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────── */}
      <div className="auth-panel-right">
        <div style={{ width: '100%', maxWidth: 380 }} className="fade-up">

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0f6fc', letterSpacing: '-0.03em', marginBottom: 6 }}>
              Create account
            </h2>
            <p style={{ fontSize: 13, color: '#4a5568' }}>
              Fill in your details to get started with instant access.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name */}
            <div>
              <label className="floating-label">Full name</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: touched.name && !isNameValid ? '#ff4d6d' : '#4a5568' }} />
                <input
                  type="text"
                  placeholder="Sunil Panchal"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onBlur={() => handleBlur('name')}
                  required
                  className="input-field"
                  style={{
                    paddingLeft: 40,
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

            {/* Email */}
            <div>
              <label className="floating-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: touched.email && !isEmailValid ? '#ff4d6d' : '#4a5568' }} />
                <input
                  type="email"
                  placeholder="you@company.com"
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
            <div>
              <label className="floating-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: touched.password && !hasMinLength ? '#ff4d6d' : '#4a5568' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onBlur={() => handleBlur('password')}
                  required
                  minLength={6}
                  className="input-field"
                  style={{
                    paddingLeft: 40,
                    paddingRight: 40,
                    borderColor: touched.password ? (hasMinLength ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255, 77, 109, 0.5)') : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Password strength & requirements checklist */}
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= pwStrength ? pwStrengthColor : 'rgba(255,255,255,0.06)', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: pwStrengthColor, fontWeight: 600 }}>{pwStrengthLabel}</span>
                  </div>

                  {/* Criteria Checklist */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: hasMinLength ? '#00e5a0' : '#4a5568' }}>
                      {hasMinLength ? <Check size={11} /> : <span style={{ width: 11, height: 11, display: 'inline-block', borderRadius: '50%', border: '1px solid #4a5568' }} />}
                      6+ chars
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: hasUppercase ? '#00e5a0' : '#4a5568' }}>
                      {hasUppercase ? <Check size={11} /> : <span style={{ width: 11, height: 11, display: 'inline-block', borderRadius: '50%', border: '1px solid #4a5568' }} />}
                      Uppercase
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: hasNumberOrSymbol ? '#00e5a0' : '#4a5568' }}>
                      {hasNumberOrSymbol ? <Check size={11} /> : <span style={{ width: 11, height: 11, display: 'inline-block', borderRadius: '50%', border: '1px solid #4a5568' }} />}
                      Number / Symbol
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: isEmailValid ? '#00e5a0' : '#4a5568' }}>
                      {isEmailValid ? <Check size={11} /> : <span style={{ width: 11, height: 11, display: 'inline-block', borderRadius: '50%', border: '1px solid #4a5568' }} />}
                      Valid email
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><span className="spinner" /> Creating account...</> : <>Create account <ArrowRight size={15} /></>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: '#2d3748', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#4a5568' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00d4ff', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
