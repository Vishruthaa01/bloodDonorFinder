import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [page, setPage] = useState('landing');
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
            setRole(data.role);
            setPage(data.role === 'donor' ? 'donor-dashboard' : 'hospital-dashboard');
          } else {
            logout();
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data);
      setRole(data.role);
      setPage(data.role === 'donor' ? 'donor-dashboard' : 'hospital-dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const registerDonor = async (donorData) => {
    try {
      const res = await fetch(`${API_URL}/auth/register/donor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donorData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data);
      setRole(data.role);
      setPage('donor-dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const registerHospital = async (hospitalData) => {
    try {
      const res = await fetch(`${API_URL}/auth/register/hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hospitalData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data);
      setRole(data.role);
      setPage('hospital-dashboard');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRole(null);
    setPage('landing');
  };

  const updateAvailability = async (isAvailable) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable })
      });
      if (res.ok) {
        setUser(prev => ({ ...prev, isAvailable }));
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      token,
      page,
      loading,
      selectedRequestId,
      API_URL,
      setPage,
      setSelectedRequestId,
      login,
      registerDonor,
      registerHospital,
      logout,
      updateAvailability
    }}>
      {children}
    </AuthContext.Provider>
  );
};
