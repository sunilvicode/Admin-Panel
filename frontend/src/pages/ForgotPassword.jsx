import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  CheckCircle2, ShieldCheck, RefreshCw, Copy, Check, X, ShieldAlert
} from 'lucide-react';
import api from '../api/api';
import { toast } from 'sonner';

/* ── Step Progress Indicator ──────────────────────────── */
function StepProgress({ step }) {
  const steps = [
    { num: 1, label: 'Email' },
    { num: 2, label: 'Verify OTP' },
    { num: 3, label: 'New Password' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {steps.map((s, i) => {
        const isDone = step > s.num;
        const isActive = step === s.num;
        return (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, fontFamily: 'Sora, sans-serif',
                background: isDone
                  ? 'linear-gradient(135deg, #00d4ff, #0083ff)'
                  : isActive
                  ? 'rgba(0, 212, 255, 0.15)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: isDone
                  ? '1px solid #00d4ff'
                  : isActive
                  ? '1px solid #00d4ff'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                color: isDone ? '#080c14' : isActive ? '#00d4ff' : '#4a5568',
                boxShadow: isActive ? '0 0 12px rgba(0, 212, 255, 0.35)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                {isDone ? <Check size={13} strokeWidth={3} /> : s.num}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, fontFamily: 'Sora, sans-serif',
                color: isActive ? '#00d4ff' : isDone ? '#8b9ab0' : '#2d3748',
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 8px', marginBottom: 16,
                background: isDone ? 'linear-gradient(90deg, #00d4ff, #0083ff)' : 'rgba(255, 255, 255, 0.06)',
                transition: 'background 0.4s ease',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── OTP 6-Digit Box Input ────────────────────────────── */
function OTPInput({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (e, i) => {
    const key = e.key;
    if (key === 'Backspace') {
      const next = [...digits];
      if (next[i]) {
        next[i] = '';
        onChange(next.join(''));
      } else if (i > 0) {
        next[i - 1] = '';
        onChange(next.join(''));
        refs.current[i - 1]?.focus();
      }
      return;
    }
    if (key === 'ArrowLeft' && i > 0) { refs.current[i - 1]?.focus(); return; }
    if (key === 'ArrowRight' && i < 5) { refs.current[i + 1]?.focus(); return; }
    if (/^\d$/.test(key)) {
      const next = [...digits];
      next[i] = key;
      onChange(next.join(''));
      if (i < 5) refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '20px 0' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={{
            width: 44, height: 50,
            textAlign: 'center', fontSize: 20, fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
            background: d ? 'rgba(0, 212, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: d ? '1px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            color: '#f0f6fc',
            outline: 'none',
            boxShadow: d ? '0 0 10px rgba(0, 212, 255, 0.2)' : 'none',
            transition: 'all 0.2s',
          }}
        />
      ))}
    </div>
  );
}

/* ── Main ForgotPassword Component ─────────────────────── */
export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Validations
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const hasMinLength = newPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isPasswordMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const pwStrength = (() => {
    if (!newPassword) return 0;
    let score = 0;
    if (hasMinLength) score++;
    if (newPassword.length >= 10) score++;
    if (hasUppercase) score++;
    if (hasNumberOrSymbol) score++;
    return score;
  })();

  const pwStrengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength];
  const pwStrengthColor = ['', '#ff4d6d', '#f5a623', '#00d4ff', '#00e5a0'][pwStrength];

  /* Step 1: Request OTP */
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setTouched((t) => ({ ...t, email: true }));
    if (!isEmailValid) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/users/forgot-password', { email: email.trim() });
      const { otp: returnedOtp, mode } = res.data;

      if (mode === 'email') {
        setDemoOtp('');
        toast.success(`OTP sent to ${email}! Check your inbox.`);
      } else {
        setDemoOtp(returnedOtp || '');
        toast.success('OTP generated (Demo Mode)');
      }
      setStep(2);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || 'Email not found';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* Step 2: Verify OTP */
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }
    setStep(3);
  };

  /* Step 3: Reset Password */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirm: true });

    if (!hasMinLength) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!isPasswordMatch) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/reset-password', {
        email: email.trim(),
        otp,
        newPassword,
      });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || 'Reset failed';
      toast.error(msg);
      if (msg?.includes('expired') || msg?.includes('Invalid OTP')) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyOtp = () => {
    navigator.clipboard.writeText(demoOtp);
    toast.success('OTP copied to clipboard!');
  };

  return (
    <div className="auth-layout">
      {/* ── Left Branding Panel ──────────────────────────────── */}
      <div className="auth-panel-left">
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
                Account Recovery
              </span>
            </div>
            <h1 style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '38px',
              color: '#f0f6fc', lineHeight: 1.15, letterSpacing: '-0.04em',
              marginBottom: 16,
            }}>
              Reset Your<br />
              <span style={{
                background: 'linear-gradient(90deg, #00d4ff, #0083ff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Password.</span>
            </h1>
            <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.7, maxWidth: 360 }}>
              Secure 3-step verification process with automated OTP token delivery and bcrypt salt hashing.
            </p>
          </div>

          {/* Feature list */}
          <div>
            {[
              { label: 'Time-based OTP', sub: '15-minute validity window for security' },
              { label: 'Nodemailer Dispatch', sub: 'Production-ready SMTP email delivery' },
              { label: 'Bcrypt 12 Rounds', sub: 'Military-grade cryptographic password hash' },
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

        {/* Security badge */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <ShieldCheck size={18} style={{ color: '#00e5a0' }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#8b9ab0' }}>Protected by Rate-Limiting</p>
              <p style={{ fontSize: 11, color: '#2d3748' }}>Brute-force protection enabled</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────── */}
      <div className="auth-panel-right">
        <div style={{ width: '100%', maxWidth: 400 }} className="fade-up">

          {/* Success Screen */}
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(0, 229, 160, 0.1)', border: '1px solid rgba(0, 229, 160, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 30px rgba(0, 229, 160, 0.25)'
              }}>
                <CheckCircle2 size={32} style={{ color: '#00e5a0' }} />
              </div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0f6fc', marginBottom: 8 }}>
                Password Updated!
              </h2>
              <p style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.6, marginBottom: 28 }}>
                Your account password has been successfully reset. You can now sign in with your new credentials.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Go to Sign In <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0f6fc', letterSpacing: '-0.03em', marginBottom: 6 }}>
                  {step === 1 && 'Forgot Password'}
                  {step === 2 && 'Verify OTP Code'}
                  {step === 3 && 'Set New Password'}
                </h2>
                <p style={{ fontSize: 13, color: '#4a5568' }}>
                  {step === 1 && 'Enter your registered email address to receive an OTP.'}
                  {step === 2 && `Enter the 6-digit code sent to ${email}.`}
                  {step === 3 && 'Create a strong, new password for your account.'}
                </p>
              </div>

              {/* Step indicator */}
              <StepProgress step={step} />

              {/* ── Step 1: Email Form ── */}
              {step === 1 && (
                <form onSubmit={handleRequestOtp} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="floating-label">Registered Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: touched.email && !isEmailValid ? '#ff4d6d' : '#4a5568' }} />
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
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

                  <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {loading ? <><span className="spinner" /> Sending OTP...</> : <>Send OTP Code <ArrowRight size={15} /></>}
                  </button>
                </form>
              )}

              {/* ── Step 2: OTP Verification ── */}
              {step === 2 && (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Demo mode badge */}
                  {demoOtp && (
                    <div style={{
                      background: 'rgba(245, 166, 35, 0.08)',
                      border: '1px solid rgba(245, 166, 35, 0.25)',
                      borderRadius: 12, padding: 14,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#f5a623', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Demo Mode — OTP Generated
                        </span>
                        <button
                          type="button"
                          onClick={copyOtp}
                          style={{
                            background: 'rgba(245, 166, 35, 0.15)', border: 'none', borderRadius: 6,
                            padding: '3px 8px', color: '#f5a623', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          <Copy size={11} /> Copy
                        </button>
                      </div>
                      <div style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 800,
                        color: '#f5a623', letterSpacing: '0.25em', textAlign: 'center',
                        padding: '6px 0'
                      }}>
                        {demoOtp}
                      </div>
                      <p style={{ fontSize: 10.5, color: '#4a5568', textAlign: 'center', marginTop: 4 }}>
                        Expires in 15 minutes · Paste code below
                      </p>
                    </div>
                  )}

                  {!demoOtp && (
                    <div style={{
                      background: 'rgba(0, 212, 255, 0.06)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      borderRadius: 12, padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 10
                    }}>
                      <Mail size={18} style={{ color: '#00d4ff', flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: '#8b9ab0', lineHeight: 1.5 }}>
                        OTP has been sent to <span style={{ color: '#00d4ff', fontWeight: 600 }}>{email}</span>. Check your inbox and spam folder.
                      </p>
                    </div>
                  )}

                  <OTPInput value={otp} onChange={setOtp} />

                  <button
                    type="submit"
                    disabled={otp.length < 6}
                    className="btn-primary"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: otp.length < 6 ? 0.4 : 1,
                      cursor: otp.length < 6 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Verify Code <ArrowRight size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(''); }}
                    style={{
                      background: 'none', border: 'none', color: '#4a5568',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      marginTop: 4
                    }}
                  >
                    <RefreshCw size={12} /> Resend OTP to different email
                  </button>
                </form>
              )}

              {/* ── Step 3: New Password ── */}
              {step === 3 && (
                <form onSubmit={handleResetPassword} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* New password */}
                  <div>
                    <label className="floating-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: touched.password && !hasMinLength ? '#ff4d6d' : '#4a5568' }} />
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        required
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

                    {/* Strength bar */}
                    {newPassword && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= pwStrength ? pwStrengthColor : 'rgba(255,255,255,0.06)', transition: 'background 0.3s' }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: pwStrengthColor, fontWeight: 600 }}>{pwStrengthLabel}</span>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="floating-label">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: touched.confirm && !isPasswordMatch ? '#ff4d6d' : '#4a5568' }} />
                      <input
                        type={showCPw ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                        required
                        className="input-field"
                        style={{
                          paddingLeft: 40,
                          paddingRight: 40,
                          borderColor: touched.confirm ? (isPasswordMatch ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255, 77, 109, 0.5)') : undefined,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCPw(!showCPw)}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', display: 'flex', alignItems: 'center', padding: 0 }}
                      >
                        {showCPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {touched.confirm && !isPasswordMatch && (
                      <p style={{ fontSize: 11, color: '#ff4d6d', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <X size={12} /> Passwords do not match
                      </p>
                    )}
                    {confirmPassword && isPasswordMatch && (
                      <p style={{ fontSize: 11, color: '#00e5a0', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={12} /> Passwords match perfectly
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !hasMinLength || !isPasswordMatch}
                    className="btn-primary"
                    style={{
                      marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: (!hasMinLength || !isPasswordMatch) ? 0.4 : 1,
                      cursor: (!hasMinLength || !isPasswordMatch) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? <><span className="spinner" /> Resetting...</> : <>Save New Password <ArrowRight size={15} /></>}
                  </button>
                </form>
              )}

              {/* Divider & back link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}>
                  <ArrowLeft size={13} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
