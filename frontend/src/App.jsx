import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DonorDashboard } from './pages/DonorDashboard';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { RequestTracking } from './pages/RequestTracking';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  const { page, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ fontWeight: 600 }}>Loading LifeShare portal...</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <Login />;
      case 'register-donor':
        return <Register registerType="donor" />;
      case 'register-hospital':
        return <Register registerType="hospital" />;
      case 'donor-dashboard':
        return <DonorDashboard />;
      case 'hospital-dashboard':
        return <HospitalDashboard />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'request-details':
        return <RequestTracking />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
