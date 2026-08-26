import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, Lock, ArrowLeft } from 'lucide-react';

export const AdminLogin = () => {
  const { login, setPage } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
    } else {
      // Check if logged in user is admin
      const token = localStorage.getItem('token');
      // If role is not admin, logout and show error
      fetch('http://127.0.0.1:5000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(userProfile => {
        if (userProfile.role !== 'admin') {
          setError('Access Denied: This portal is strictly restricted to administrator accounts.');
        }
      })
      .catch(() => {});
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '50px auto', width: '100%' }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setPage('landing')}
        style={{ marginBottom: '16px' }}
      >
        <ArrowLeft size={14} />
        <span>Back to Home</span>
      </button>

      <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '12px' }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Admin Portal Login</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Authorized system administrator access only.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@lifeshare.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            <Lock size={16} />
            <span>{loading ? 'Authenticating Admin...' : 'Login to Admin Dashboard'}</span>
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Are you a Donor or Hospital? </span>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setPage('login'); }}
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            User Login
          </a>
        </div>
      </div>
    </div>
  );
};
