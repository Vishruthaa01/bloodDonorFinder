import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import {
  Heart,
  LayoutDashboard,
  UserCheck,
  Building2,
  Droplet,
  LogOut,
  Search,
  Eye,
  Check,
  X
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user, token, API_URL, logout, setPage } = useContext(AuthContext);
  const { addToast } = useContext(SocketContext);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    totalDonors: 0,
    verifiedDonors: 0,
    pendingDonors: 0,
    totalHospitals: 0,
    verifiedHospitals: 0,
    pendingHospitals: 0,
    totalDonations: 0
  });

  // Data States
  const [donors, setDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [donations, setDonations] = useState([]);

  // Search & Filter States
  const [donorSearch, setDonorSearch] = useState('');
  const [donorFilter, setDonorFilter] = useState('all');

  const [hospitalSearch, setHospitalSearch] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('all');

  const [donationSearch, setDonationSearch] = useState('');

  // Details Modal State
  const [selectedDetail, setSelectedDetail] = useState(null);

  useEffect(() => {
    if (token) {
      fetchInitialData();
    }
  }, [token]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchDonors(),
        fetchHospitals(),
        fetchDonations()
      ]);
    } catch (err) {
      console.error(err);
      addToast('Error loading administrative data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDonors = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/donors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDonors(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/hospitals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHospitals(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/donations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDonations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyDonor = async (donorId, verified) => {
    try {
      const res = await fetch(`${API_URL}/admin/donors/${donorId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verified })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || `Donor ${verified ? 'verified' : 'rejected'} successfully`, 'success');
        setDonors(prev => prev.map(d => d._id === donorId ? { ...d, verified } : d));
        fetchStats();
      } else {
        addToast(data.message || 'Verification update failed', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error updating donor verification', 'error');
    }
  };

  const handleVerifyHospital = async (hospitalId, verified) => {
    try {
      const res = await fetch(`${API_URL}/admin/hospitals/${hospitalId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verified })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || `Hospital ${verified ? 'verified' : 'rejected'} successfully`, 'success');
        setHospitals(prev => prev.map(h => h._id === hospitalId ? { ...h, verified } : h));
        fetchStats();
      } else {
        addToast(data.message || 'Verification update failed', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error updating hospital verification', 'error');
    }
  };

  // Auth Protection Check
  if (!user || user.role !== 'admin') {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '12px' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          You must be logged in as an administrator to access the Admin Dashboard.
        </p>
        <button className="btn btn-primary" onClick={() => setPage('login')}>
          Go to Login
        </button>
      </div>
    );
  }

  // Filtered Donors List
  const filteredDonors = donors.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
      d.email.toLowerCase().includes(donorSearch.toLowerCase()) ||
      d.bloodGroup.toLowerCase().includes(donorSearch.toLowerCase());

    if (donorFilter === 'pending') return matchesSearch && d.verified === false;
    if (donorFilter === 'verified') return matchesSearch && d.verified === true;
    return matchesSearch;
  });

  // Filtered Hospitals List
  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch =
      h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      h.email.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
      h.regId.toLowerCase().includes(hospitalSearch.toLowerCase());

    if (hospitalFilter === 'pending') return matchesSearch && h.verified === false;
    if (hospitalFilter === 'verified') return matchesSearch && h.verified === true;
    return matchesSearch;
  });

  // Filtered Donations List
  const filteredDonations = donations.filter(d => {
    const donorName = d.acceptedDonorId?.name || '';
    const hospitalName = d.hospitalId?.name || '';
    const bloodGroup = d.bloodGroup || '';
    const id = d._id || '';

    return (
      donorName.toLowerCase().includes(donationSearch.toLowerCase()) ||
      hospitalName.toLowerCase().includes(donationSearch.toLowerCase()) ||
      bloodGroup.toLowerCase().includes(donationSearch.toLowerCase()) ||
      id.toLowerCase().includes(donationSearch.toLowerCase())
    );
  });

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Heart size={22} fill="currentColor" />
          <span>Blood Donor Finder</span>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'donor-verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('donor-verification')}
          >
            <UserCheck size={18} />
            <span>Donor Verification</span>
            {stats.pendingDonors > 0 && (
              <span className="badge badge-urgency-high" style={{ marginLeft: 'auto', padding: '2px 6px' }}>
                {stats.pendingDonors}
              </span>
            )}
          </button>

          <button
            className={`sidebar-link ${activeTab === 'hospital-verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('hospital-verification')}
          >
            <Building2 size={18} />
            <span>Hospital Verification</span>
            {stats.pendingHospitals > 0 && (
              <span className="badge badge-urgency-high" style={{ marginLeft: 'auto', padding: '2px 6px' }}>
                {stats.pendingHospitals}
              </span>
            )}
          </button>

          <button
            className={`sidebar-link ${activeTab === 'donations' ? 'active' : ''}`}
            onClick={() => setActiveTab('donations')}
          >
            <Droplet size={18} />
            <span>Donations</span>
          </button>
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-color)' }}>
          <button className="sidebar-link" onClick={logout} style={{ color: 'var(--primary)' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="admin-content">
        {loading ? (
          <div style={{ padding: '40px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Loading Admin Dashboard...
          </div>
        ) : (
          <>
            {/* 1. DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div>
                  <h2>Admin Dashboard</h2>
                  <p style={{ margin: 0 }}>System verification and completed donations statistics.</p>
                </div>

                {/* 7 Key Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Donors</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                      {stats.totalDonors}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--success)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Verified Donors</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                      {stats.verifiedDonors}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Donor Verifications</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
                      {stats.pendingDonors}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '18px', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Hospitals</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>
                      {stats.totalHospitals}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--success)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Verified Hospitals</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                      {stats.verifiedHospitals}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Hospital Verifications</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
                      {stats.pendingHospitals}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Donations</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                      {stats.totalDonations}
                    </div>
                  </div>
                </div>

                {/* Quick Pending Items Lists */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
                  {/* Pending Donors Quick List */}
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0 }}>Pending Donor Verifications</h3>
                      <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('donor-verification')}>
                        View All
                      </button>
                    </div>
                    {donors.filter(d => !d.verified).length === 0 ? (
                      <div style={{ padding: '20px 0', color: 'var(--success)', fontWeight: 600 }}>
                        ✓ All donor registrations are verified.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {donors.filter(d => !d.verified).slice(0, 4).map(donor => (
                          <div key={donor._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                            <div>
                              <strong>{donor.name}</strong> ({donor.bloodGroup})
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{donor.email}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn btn-primary btn-sm" onClick={() => handleVerifyDonor(donor._id, true)}>
                                Verify
                              </button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDetail({ type: 'donor', item: donor })}>
                                <Eye size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending Hospitals Quick List */}
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0 }}>Pending Hospital Verifications</h3>
                      <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('hospital-verification')}>
                        View All
                      </button>
                    </div>
                    {hospitals.filter(h => !h.verified).length === 0 ? (
                      <div style={{ padding: '20px 0', color: 'var(--success)', fontWeight: 600 }}>
                        ✓ All hospital registrations are verified.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {hospitals.filter(h => !h.verified).slice(0, 4).map(hospital => (
                          <div key={hospital._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                            <div>
                              <strong>{hospital.name}</strong>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {hospital.regId}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn btn-primary btn-sm" onClick={() => handleVerifyHospital(hospital._id, true)}>
                                Verify
                              </button>
                              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDetail({ type: 'hospital', item: hospital })}>
                                <Eye size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. DONOR VERIFICATION VIEW */}
            {activeTab === 'donor-verification' && (
              <div className="card">
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Donor Verification</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      View donor details and verify or reject registrations.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <select
                      className="form-control"
                      style={{ padding: '6px 12px', fontSize: '0.85rem', width: '140px' }}
                      value={donorFilter}
                      onChange={e => setDonorFilter(e.target.value)}
                    >
                      <option value="all">All Donors</option>
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                    </select>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search name, email, group..."
                        className="form-control"
                        style={{ padding: '6px 10px 6px 32px', fontSize: '0.85rem', width: '220px' }}
                        value={donorSearch}
                        onChange={e => setDonorSearch(e.target.value)}
                      />
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Donor Name</th>
                        <th style={{ padding: '12px' }}>Blood Group</th>
                        <th style={{ padding: '12px' }}>Email Address</th>
                        <th style={{ padding: '12px' }}>Phone</th>
                        <th style={{ padding: '12px' }}>Verification Status</th>
                        <th style={{ padding: '12px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDonors.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No donor accounts found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredDonors.map(donor => (
                          <tr key={donor._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 600 }}>{donor.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Age: {donor.age}</div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ backgroundColor: '#ffe4e6', color: '#e11d48', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                {donor.bloodGroup}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>{donor.email}</td>
                            <td style={{ padding: '12px' }}>{donor.phone}</td>
                            <td style={{ padding: '12px' }}>
                              {donor.verified ? (
                                <span className="badge badge-confirmed">Verified</span>
                              ) : (
                                <span className="badge badge-urgency-medium">Pending</span>
                              )}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {!donor.verified ? (
                                  <button className="btn btn-primary btn-sm" onClick={() => handleVerifyDonor(donor._id, true)}>
                                    <Check size={14} />
                                    <span>Verify</span>
                                  </button>
                                ) : (
                                  <button className="btn btn-secondary btn-sm" onClick={() => handleVerifyDonor(donor._id, false)}>
                                    <X size={14} />
                                    <span>Reject</span>
                                  </button>
                                )}
                                <button className="btn btn-outline btn-sm" onClick={() => setSelectedDetail({ type: 'donor', item: donor })}>
                                  <Eye size={14} />
                                  <span>Details</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. HOSPITAL VERIFICATION VIEW */}
            {activeTab === 'hospital-verification' && (
              <div className="card">
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Hospital Verification</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      View hospital details and verify or reject registration requests.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <select
                      className="form-control"
                      style={{ padding: '6px 12px', fontSize: '0.85rem', width: '140px' }}
                      value={hospitalFilter}
                      onChange={e => setHospitalFilter(e.target.value)}
                    >
                      <option value="all">All Hospitals</option>
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                    </select>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search name, reg ID, email..."
                        className="form-control"
                        style={{ padding: '6px 10px 6px 32px', fontSize: '0.85rem', width: '220px' }}
                        value={hospitalSearch}
                        onChange={e => setHospitalSearch(e.target.value)}
                      />
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Hospital Name</th>
                        <th style={{ padding: '12px' }}>Registration ID</th>
                        <th style={{ padding: '12px' }}>Contact Person</th>
                        <th style={{ padding: '12px' }}>Phone</th>
                        <th style={{ padding: '12px' }}>Verification Status</th>
                        <th style={{ padding: '12px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHospitals.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No hospital accounts found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredHospitals.map(hospital => (
                          <tr key={hospital._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 600 }}>{hospital.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{hospital.email}</div>
                            </td>
                            <td style={{ padding: '12px' }}><code>{hospital.regId}</code></td>
                            <td style={{ padding: '12px' }}>{hospital.contactPerson}</td>
                            <td style={{ padding: '12px' }}>{hospital.phone}</td>
                            <td style={{ padding: '12px' }}>
                              {hospital.verified ? (
                                <span className="badge badge-confirmed">Verified</span>
                              ) : (
                                <span className="badge badge-urgency-medium">Pending</span>
                              )}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {!hospital.verified ? (
                                  <button className="btn btn-primary btn-sm" onClick={() => handleVerifyHospital(hospital._id, true)}>
                                    <Check size={14} />
                                    <span>Verify</span>
                                  </button>
                                ) : (
                                  <button className="btn btn-secondary btn-sm" onClick={() => handleVerifyHospital(hospital._id, false)}>
                                    <X size={14} />
                                    <span>Reject</span>
                                  </button>
                                )}
                                <button className="btn btn-outline btn-sm" onClick={() => setSelectedDetail({ type: 'hospital', item: hospital })}>
                                  <Eye size={14} />
                                  <span>Details</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. DONATIONS VIEW */}
            {activeTab === 'donations' && (
              <div className="card">
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Completed Donations</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Overview of fulfilled blood donation records.
                    </p>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search donor, hospital, ID..."
                      className="form-control"
                      style={{ padding: '6px 10px 6px 32px', fontSize: '0.85rem', width: '240px' }}
                      value={donationSearch}
                      onChange={e => setDonationSearch(e.target.value)}
                    />
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Donation ID</th>
                        <th style={{ padding: '12px' }}>Donor Name</th>
                        <th style={{ padding: '12px' }}>Blood Group</th>
                        <th style={{ padding: '12px' }}>Hospital / Center</th>
                        <th style={{ padding: '12px' }}>Donation Date</th>
                        <th style={{ padding: '12px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDonations.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No completed donations recorded yet.
                          </td>
                        </tr>
                      ) : (
                        filteredDonations.map(donation => (
                          <tr key={donation._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px' }}>
                              <code style={{ fontSize: '0.8rem' }}>{donation._id}</code>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 600 }}>
                              {donation.acceptedDonorId?.name || 'Valued Donor'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ backgroundColor: '#ffe4e6', color: '#e11d48', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                {donation.bloodGroup}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              {donation.hospitalId?.name || 'Hospital'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {new Date(donation.updatedAt || donation.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <button className="btn btn-outline btn-sm" onClick={() => setSelectedDetail({ type: 'donation', item: donation })}>
                                <Eye size={14} />
                                <span>Details</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Minimal Details Modal */}
        {selectedDetail && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '480px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, textTransform: 'capitalize' }}>
                  {selectedDetail.type} Details
                </h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDetail(null)}>
                  <X size={16} />
                </button>
              </div>

              {selectedDetail.type === 'donor' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div><strong>Full Name:</strong> {selectedDetail.item.name}</div>
                  <div><strong>Email:</strong> {selectedDetail.item.email}</div>
                  <div><strong>Phone:</strong> {selectedDetail.item.phone}</div>
                  <div><strong>Blood Group:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{selectedDetail.item.bloodGroup}</span></div>
                  <div><strong>Age:</strong> {selectedDetail.item.age}</div>
                  <div><strong>Availability Status:</strong> {selectedDetail.item.isAvailable ? 'Available' : 'Offline'}</div>
                  <div><strong>Verification Status:</strong> {selectedDetail.item.verified ? 'Verified' : 'Pending'}</div>
                  <div><strong>Registered Date:</strong> {new Date(selectedDetail.item.createdAt).toLocaleDateString()}</div>
                </div>
              )}

              {selectedDetail.type === 'hospital' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div><strong>Hospital Name:</strong> {selectedDetail.item.name}</div>
                  <div><strong>Registration ID:</strong> <code>{selectedDetail.item.regId}</code></div>
                  <div><strong>Contact Person:</strong> {selectedDetail.item.contactPerson}</div>
                  <div><strong>Email:</strong> {selectedDetail.item.email}</div>
                  <div><strong>Phone:</strong> {selectedDetail.item.phone}</div>
                  <div><strong>Address:</strong> {selectedDetail.item.address}</div>
                  <div><strong>Verification Status:</strong> {selectedDetail.item.verified ? 'Verified' : 'Pending'}</div>
                </div>
              )}

              {selectedDetail.type === 'donation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div><strong>Donation ID:</strong> <code>{selectedDetail.item._id}</code></div>
                  <div><strong>Donor Name:</strong> {selectedDetail.item.acceptedDonorId?.name || 'N/A'}</div>
                  <div><strong>Blood Group:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{selectedDetail.item.bloodGroup}</span></div>
                  <div><strong>Units Donated:</strong> {selectedDetail.item.unitsNeeded} unit(s)</div>
                  <div><strong>Hospital / Center:</strong> {selectedDetail.item.hospitalId?.name || 'N/A'}</div>
                  <div><strong>Date Completed:</strong> {new Date(selectedDetail.item.updatedAt || selectedDetail.item.createdAt).toLocaleDateString()}</div>
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'end' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedDetail(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
