import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Users, Building2, GitPullRequest, ShieldCheck, Heart, Search, Check, X, ShieldAlert } from 'lucide-react';

export const AdminDashboard = () => {
  const { token, API_URL } = useContext(AuthContext);
  const { addToast } = useContext(SocketContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalHospitals: 0,
    totalRequests: 0,
    completedRequests: 0,
    activeRequests: 0
  });

  const [donors, setDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);

  // Search/Filter states
  const [donorSearch, setDonorSearch] = useState('');
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchHospitals(),
        fetchDonors(),
        fetchRequests()
      ]);
    } catch (err) {
      console.error(err);
      addToast('Error loading administrative data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const res = await fetch(`${API_URL.replace('/api', '')}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
  };

  const fetchHospitals = async () => {
    const res = await fetch(`${API_URL.replace('/api', '')}/api/admin/hospitals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setHospitals(data);
    }
  };

  const fetchDonors = async () => {
    const res = await fetch(`${API_URL.replace('/api', '')}/api/admin/donors`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setDonors(data);
    }
  };

  const fetchRequests = async () => {
    const res = await fetch(`${API_URL.replace('/api', '')}/api/admin/requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setRequests(data);
    }
  };

  const handleToggleVerify = async (hospitalId) => {
    try {
      const res = await fetch(`${API_URL.replace('/api', '')}/api/admin/hospitals/${hospitalId}/verify`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, 'success');
        // Refresh local hospitals state
        setHospitals(prev => prev.map(h => h._id === hospitalId ? { ...h, verified: !h.verified } : h));
        fetchStats();
      } else {
        addToast(data.message || 'Verification update failed', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error updating verification status', 'error');
    }
  };

  // Filtered lists
  const filteredDonors = donors.filter(d => 
    d.name.toLowerCase().includes(donorSearch.toLowerCase()) || 
    d.email.toLowerCase().includes(donorSearch.toLowerCase()) || 
    d.bloodGroup.toLowerCase().includes(donorSearch.toLowerCase())
  );

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) || 
    h.email.toLowerCase().includes(hospitalSearch.toLowerCase()) || 
    h.regId.toLowerCase().includes(hospitalSearch.toLowerCase())
  );

  const filteredRequests = requests.filter(r => 
    r.bloodGroup.toLowerCase().includes(requestSearch.toLowerCase()) ||
    (r.hospitalId?.name || '').toLowerCase().includes(requestSearch.toLowerCase()) ||
    r.status.toLowerCase().includes(requestSearch.toLowerCase())
  );

  if (loading) {
    return <div style={{ padding: '40px', fontWeight: 600 }}>Loading administrator dashboard...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ backgroundColor: '#fff0f3', padding: '12px', borderRadius: '50%', color: 'var(--primary)' }}>
          <ShieldAlert size={28} />
        </div>
        <div>
          <h2>System Control Panel</h2>
          <p style={{ margin: 0 }}>
            Global overview, credentials audit, database verify, and requests timeline logging.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '8px' }}>
        <button 
          onClick={() => setActiveTab('dashboard')} 
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'dashboard' ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          Overview Statistics
        </button>
        <button 
          onClick={() => setActiveTab('hospitals')} 
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'hospitals' ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'hospitals' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          Hospitals ({hospitals.length})
        </button>
        <button 
          onClick={() => setActiveTab('donors')} 
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'donors' ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'donors' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          Donors ({donors.length})
        </button>
        <button 
          onClick={() => setActiveTab('requests')} 
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'requests' ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'requests' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          Active Requests ({requests.filter(r => r.status !== 'closed').length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ backgroundColor: '#fff0f3', padding: '12px', borderRadius: '50%', color: 'var(--primary)' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Donors</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.totalDonors}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '50%', color: '#3b82f6' }}>
                <Building2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Hospitals</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{stats.totalHospitals}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid var(--warning)' }}>
              <div style={{ backgroundColor: 'var(--warning-light)', padding: '12px', borderRadius: '50%', color: 'var(--warning)' }}>
                <GitPullRequest size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Requests</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>{stats.activeRequests}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid var(--success)' }}>
              <div style={{ backgroundColor: 'var(--success-light)', padding: '12px', borderRadius: '50%', color: 'var(--success)' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed Requests</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{stats.completedRequests}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
            {/* Quick list of latest requests */}
            <div className="card">
              <h3>Latest Blood Requests</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Most recent operations throughout the region.</p>
              {requests.length === 0 ? (
                <div style={{ padding: '20px 0', color: 'var(--text-muted)' }}>No requests logged yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {requests.slice(0, 5).map(req => (
                    <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <strong>{req.hospitalId?.name || 'Hospital'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Blood Group: {req.bloodGroup} | Units: {req.unitsNeeded} | Urgency:{' '}
                          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{req.urgency}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className={`badge badge-${req.status}`}>{req.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick list of pending hospital verifications */}
            <div className="card">
              <h3>Unverified Hospitals</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hospitals requiring verification credentials check.</p>
              {hospitals.filter(h => !h.verified).length === 0 ? (
                <div style={{ padding: '20px 0', color: 'var(--success)', fontWeight: 600 }}>✅ All registered hospitals are verified.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {hospitals.filter(h => !h.verified).slice(0, 5).map(h => (
                    <div key={h._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <strong>{h.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {h.regId}</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => handleToggleVerify(h._id)}>
                        Verify
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hospitals' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Hospitals Audit Log</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Search by name, email, registration..." 
                className="form-control"
                style={{ width: '280px', padding: '8px 12px', fontSize: '0.85rem' }}
                value={hospitalSearch}
                onChange={e => setHospitalSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Hospital Name</th>
                  <th style={{ padding: '12px' }}>Registration ID</th>
                  <th style={{ padding: '12px' }}>Contact Email</th>
                  <th style={{ padding: '12px' }}>Phone Number</th>
                  <th style={{ padding: '12px' }}>Verification Status</th>
                  <th style={{ padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHospitals.map(h => (
                  <tr key={h._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{h.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{h.address}</div>
                    </td>
                    <td style={{ padding: '12px' }}><code>{h.regId}</code></td>
                    <td style={{ padding: '12px' }}>{h.email}</td>
                    <td style={{ padding: '12px' }}>{h.phone}</td>
                    <td style={{ padding: '12px' }}>
                      {h.verified ? (
                        <span className="badge badge-confirmed">Verified</span>
                      ) : (
                        <span className="badge badge-urgency-critical" style={{ animation: 'none' }}>Unverified</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        className={`btn ${h.verified ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                        onClick={() => handleToggleVerify(h._id)}
                      >
                        {h.verified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'donors' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Registered Blood Donors</h3>
            <input 
              type="text" 
              placeholder="Search by name, email, blood group..." 
              className="form-control"
              style={{ width: '280px', padding: '8px 12px', fontSize: '0.85rem' }}
              value={donorSearch}
              onChange={e => setDonorSearch(e.target.value)}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Donor Name</th>
                  <th style={{ padding: '12px' }}>Blood Group</th>
                  <th style={{ padding: '12px' }}>Email Address</th>
                  <th style={{ padding: '12px' }}>Phone Number</th>
                  <th style={{ padding: '12px' }}>Age</th>
                  <th style={{ padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonors.map(d => (
                  <tr key={d._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary)' }}>{d.bloodGroup}</td>
                    <td style={{ padding: '12px' }}>{d.email}</td>
                    <td style={{ padding: '12px' }}>{d.phone}</td>
                    <td style={{ padding: '12px' }}>{d.age}</td>
                    <td style={{ padding: '12px' }}>
                      {d.isAvailable ? (
                        <span className="badge badge-confirmed">Available</span>
                      ) : (
                        <span className="badge badge-closed">Offline</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Blood Operations Timeline</h3>
            <input 
              type="text" 
              placeholder="Search by hospital name, blood group, status..." 
              className="form-control"
              style={{ width: '280px', padding: '8px 12px', fontSize: '0.85rem' }}
              value={requestSearch}
              onChange={e => setRequestSearch(e.target.value)}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Hospital Name</th>
                  <th style={{ padding: '12px' }}>Blood Group</th>
                  <th style={{ padding: '12px' }}>Units Required</th>
                  <th style={{ padding: '12px' }}>Urgency</th>
                  <th style={{ padding: '12px' }}>Request Status</th>
                  <th style={{ padding: '12px' }}>Assigned Donor</th>
                  <th style={{ padding: '12px' }}>Date Raised</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{r.hospitalId?.name || 'Hospital'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {r._id}</div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>{r.bloodGroup}</td>
                    <td style={{ padding: '12px' }}>{r.unitsNeeded}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-urgency-${r.urgency?.toLowerCase()}`}>{r.urgency}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-${r.status}`}>{r.status}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {r.acceptedDonorId ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.acceptedDonorId.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ph: {r.acceptedDonorId.phone}</div>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {new Date(r.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
