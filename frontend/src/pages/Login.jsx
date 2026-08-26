import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

export const Login = () => {
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
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', width: '100%' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>User Login</h2>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Portal access for Registered Donors and Hospitals.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
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
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <br />
          <a href="#" onClick={(e) => { e.preventDefault(); setPage('register-donor'); }} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Register as Donor</a>
          {' or '}
          <a href="#" onClick={(e) => { e.preventDefault(); setPage('register-hospital'); }} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Register as Hospital</a>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage('admin-login')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
            <span>Switch to Admin Portal Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
