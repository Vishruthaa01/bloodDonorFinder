import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Heart, LogOut } from 'lucide-react';

export const Header = () => {
  const { user, logout, page, setPage } = useContext(AuthContext);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="logo" onClick={() => setPage(user ? (user.role === 'donor' ? 'donor-dashboard' : 'hospital-dashboard') : 'landing')}>
          <Heart size={28} fill="currentColor" />
          <span>LifeShare</span>
        </div>
        <nav className="nav-links">
          {user ? (
            <>
              <span className="user-email" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {user.name} ({user.role === 'donor' ? 'Donor' : 'Hospital'})
              </span>
              <button className="btn btn-secondary btn-sm" onClick={logout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              {page !== 'login' && (
                <button className="btn btn-secondary btn-sm" onClick={() => setPage('login')}>
                  Login
                </button>
              )}
              {page === 'login' && (
                <button className="btn btn-primary btn-sm" onClick={() => setPage('landing')}>
                  Home
                </button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
