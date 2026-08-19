// pages/admin/AdminLogin.js  — White & Gold theme + robust login
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const DEMO_EMAIL    = 'admin@iconicestates.in';
const DEMO_PASSWORD = 'Admin@1234';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      // Attempt real API login
      await login(email.trim().toLowerCase(), password);
      toast.success('Welcome back!');
      navigate('/admin/dashboard');
    } catch (apiErr) {
      // If backend is unavailable, allow demo login so the UI is testable
      const isNetworkErr = !apiErr.response;
      const isServerErr  = apiErr.response?.status >= 500;

      if ((isNetworkErr || isServerErr) &&
          email.trim().toLowerCase() === DEMO_EMAIL &&
          password === DEMO_PASSWORD) {
        // Inject demo session into AuthContext
        const demoUser  = { id: 1, name: 'Iconic Admin', email: DEMO_EMAIL, role: 'super_admin' };
        const demoToken = 'demo_token_' + Date.now();
        localStorage.setItem('iconic_token', demoToken);
        localStorage.setItem('iconic_demo_user', JSON.stringify(demoUser));
        // Force a page reload so AuthContext re-reads the stored user
        toast.success('Demo mode — welcome!');
        window.location.href = '/admin/dashboard';
        return;
      }

      // Surface the real error
      const msg = apiErr.response?.data?.error
        || (isNetworkErr ? 'Cannot reach the server. Check your backend is running.' : 'Login failed.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FAF7F2 0%, #F0EAE0 50%, #FAF7F2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      {/* Decorative gold orb */}
      <div style={{
        position: 'fixed', top: '-10%', right: '-5%', width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,162,75,.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', left: '-5%', width: 350, height: 350,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,162,75,.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{width: '100%', maxWidth: 440, position: 'relative', zIndex: 1}}>
        {/* Logo */}
        <div className="text-center" style={{marginBottom: 40}}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #C9A24B, #9A771E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(201,162,75,.35)',
          }}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <div style={{
            fontFamily: 'var(--ff-display)', fontSize: '1.9rem', fontWeight: 700,
            color: '#C9A24B', marginBottom: 4,
          }}>
            Iconic<span style={{color: '#1A1209'}}>Estates</span>
          </div>
          <p style={{color: 'var(--mist)', fontSize: '.88rem', letterSpacing: '.06em', textTransform: 'uppercase'}}>
            Admin Portal · Secure Login
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(201,162,75,.25)',
          borderRadius: 20,
          padding: 40,
          boxShadow: '0 12px 48px rgba(180,140,60,.14)',
        }}>
          <h2 style={{
            fontFamily: 'var(--ff-display)', fontSize: '1.5rem', fontWeight: 600,
            color: '#1A1209', marginBottom: 28,
          }}>Sign In</h2>

          <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="admin@iconicestates.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{position: 'relative'}}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  style={{paddingRight: 44}}
                />
                <button
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--mist)', background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              className="btn btn-gold btn-full btn-lg"
              onClick={submit}
              disabled={loading}
              style={{marginTop: 4}}
            >
              {loading
                ? <span style={{display:'flex',alignItems:'center',gap:8}}>
                    <span className="spinner" style={{width:18,height:18,borderWidth:2}} />
                    Signing in…
                  </span>
                : <><LogIn size={18} /> Sign In</>
              }
            </button>
          </div>

          {/* Hint */}
          <div style={{
            marginTop: 28, padding: '14px 16px',
            background: 'rgba(201,162,75,.06)',
            border: '1px solid rgba(201,162,75,.2)',
            borderRadius: 10,
          }}>
            <p style={{color: 'var(--mist)', fontSize: '.78rem', textAlign: 'center', lineHeight: 1.6}}>
              Default credentials:<br />
              <strong style={{color: 'var(--gold-dk)'}}>admin@iconicestates.in</strong>
              {' / '}
              <strong style={{color: 'var(--gold-dk)'}}>Admin@1234</strong>
              <br />
              <span style={{color: 'var(--gold)', fontWeight: 600}}>Change immediately after first login.</span>
            </p>
          </div>
        </div>

        <p style={{textAlign: 'center', marginTop: 24, color: 'var(--mist)', fontSize: '.78rem'}}>
          Iconic Estates India © {new Date().getFullYear()} · Secure Admin Portal
        </p>
      </div>
    </div>
  );
}
