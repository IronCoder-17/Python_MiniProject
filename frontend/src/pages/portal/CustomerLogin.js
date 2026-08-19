// pages/portal/CustomerLogin.js
import React, { useState } from 'react';
import { portalAuthAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Phone, KeyRound } from 'lucide-react';

export default function CustomerLogin() {
  const [step, setStep] = useState('mobile'); // 'mobile' | 'otp'
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestOtp = async (e) => {
    e.preventDefault();
    if (mobile.replace(/\D/g, '').length < 10) return toast.error('Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      const { data } = await portalAuthAPI.requestOtp(mobile);
      toast.success(data.message);
      if (data.dev_otp) setDevOtp(data.dev_otp); // shown only when no SMS/email delivery is configured
      setStep('otp');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not send code');
    }
    setLoading(false);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await portalAuthAPI.verifyOtp(mobile, otp);
      localStorage.setItem('iconic_customer_token', data.token);
      toast.success('Welcome back!');
      navigate('/portal');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Invalid code');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink, #070E1A)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(201,162,75,.2)', borderRadius: 16, padding: 36 }}>
        <h2 style={{ color: '#C9A24B', fontSize: '1.6rem', marginBottom: 6 }}>Iconic<span style={{color:'#fff'}}>Estates</span></h2>
        <p style={{ color: '#8B9BAD', marginBottom: 28, fontSize: '.9rem' }}>Track your enquiry, site visits & documents</p>

        {step === 'mobile' && (
          <form onSubmit={requestOtp}>
            <label style={{ color: '#8B9BAD', fontSize: '.8rem', display: 'block', marginBottom: 6 }}>Mobile Number</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(201,162,75,.3)', borderRadius: 8, padding: '10px 12px', marginBottom: 20 }}>
              <Phone size={16} style={{ color: '#8B9BAD' }} />
              <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="9876543210" maxLength={10}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', width: '100%', fontSize: '.95rem' }} />
            </div>
            <button disabled={loading} type="submit" style={{ width: '100%', padding: '12px', background: '#C9A24B', color: '#0A1220', fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              {loading ? 'Sending…' : 'Send Login Code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOtp}>
            <label style={{ color: '#8B9BAD', fontSize: '.8rem', display: 'block', marginBottom: 6 }}>Enter Code</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(201,162,75,.3)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <KeyRound size={16} style={{ color: '#8B9BAD' }} />
              <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', width: '100%', fontSize: '.95rem', letterSpacing: 2 }} />
            </div>
            {devOtp && <p style={{ color: '#F39C12', fontSize: '.78rem', marginBottom: 16 }}>Dev mode — your code is <strong>{devOtp}</strong> (no SMS/email gateway configured yet)</p>}
            <button disabled={loading} type="submit" style={{ width: '100%', padding: '12px', background: '#C9A24B', color: '#0A1220', fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 10 }}>
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
            <button type="button" onClick={() => setStep('mobile')} style={{ width: '100%', background: 'none', border: 'none', color: '#8B9BAD', fontSize: '.8rem', cursor: 'pointer' }}>
              ← Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
