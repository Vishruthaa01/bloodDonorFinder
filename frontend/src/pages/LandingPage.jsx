import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Heart, Shield, Activity, MapPin } from 'lucide-react';

export const LandingPage = () => {
  const { setPage } = useContext(AuthContext);

  return (
    <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', gap: '60px' }}>
      <section style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '24px' }}>
          Seconds count. <br /><span style={{ color: 'var(--primary)' }}>Connect directly</span> with blood donors.
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          LifeShare uses real-time location mapping and smart routing to connect hospitals with eligible blood donors in under 3 minutes.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => setPage('register-donor')}>
            Become a Donor
          </button>
          <button className="btn btn-secondary" onClick={() => setPage('register-hospital')}>
            Register Hospital
          </button>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <MapPin size={24} />
          </div>
          <h3>Geospatial Search</h3>
          <p>Instantly calculates compatible donors within a 5-10 km radius for immediate dispatch.</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Activity size={24} />
          </div>
          <h3>Real-time Alerts</h3>
          <p>Uses WebSockets to ping nearby donors immediately. Next donor in line is auto-routed if there's no response.</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Shield size={24} />
          </div>
          <h3>Eligibility Verification</h3>
          <p>Strict clinical check before collection to ensure safety and record tracking compliance.</p>
        </div>
      </section>

      <footer style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        © 2026 LifeShare • Emergency Blood Matching Network •{' '}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setPage('admin-login'); }}
          style={{ color: 'inherit', textDecoration: 'none', cursor: 'default' }}
          title="Owner Access"
        >
          System Administration
        </a>
      </footer>
    </div>
  );
};
