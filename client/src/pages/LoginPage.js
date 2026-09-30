import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import rmsmLogo from '../assets/rmsm-logo.png';

export default function LoginPage() {
  const { login, admin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  if (admin) {
    navigate('/dashboard');
    return null;
  }

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.username.trim(), form.password);
      toast.success('Welcome to RMSM Admin Panel!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check credentials.';
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={rmsmLogo} alt="RMSM Logo" />
          <h1>RMSM Admin Portal</h1>
          <p>राष्ट्रीय मोदी सेवा मिशन</p>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
            संगठन संपूर्ण भारत
          </p>
        </div>

        <div className="login-stripe" />

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Username
              </span>
            </label>
            <input
              className={`form-control ${errors.username ? 'error' : ''}`}
              type="text"
              placeholder="Enter admin username"
              value={form.username}
              onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setErrors({}); }}
              autoFocus
              autoComplete="username"
            />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Password
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className={`form-control ${errors.password ? 'error' : ''}`}
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                value={form.password}
                onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors({}); }}
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          {errors.form && (
            <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.08)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#dc2626', textAlign: 'center' }}>
              ❌ {errors.form}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? (
              <><span className="spinner"></span> Signing in...</>
            ) : (
              '🔐 Sign In'
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', padding: '12px 16px', background: '#f9fafb', borderRadius: 10 }}>
          <p style={{ fontSize: 11, color: '#6b7280' }}>Default credentials</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 4 }}>
            Username: <code>admin</code> &nbsp;|&nbsp; Password: <code>rmsm@2024</code>
          </p>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#9ca3af' }}>
            सेवा | समर्पण | संस्कार
          </p>
        </div>
      </div>
    </div>
  );
}
