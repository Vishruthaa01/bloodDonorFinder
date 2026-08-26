import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Plus, Eye, Award, MapPin, Users, Filter, Search, Phone, Download } from 'lucide-react';
import { MapView } from '../components/MapView';

const calcDist = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const HospitalDashboard = () => {
  const { user, token, API_URL, setPage, setSelectedRequestId } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donorsLoading, setDonorsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'requests'

  // Map Filter States
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('available');
  const [donorSearch, setDonorSearch] = useState('');

  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    unitsNeeded: 1,
    urgency: 'medium',
    radiusKm: 10
  });
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchDonors();

    const handleUpdate = () => {
      fetchRequests();
      fetchDonors();
    };
    window.addEventListener('requestUpdated', handleUpdate);
    return () => window.removeEventListener('requestUpdated', handleUpdate);
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/requests/hospital/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonors = async () => {
    try {
      setDonorsLoading(true);
      const res = await fetch(`${API_URL}/auth/donors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDonors(data);
      }
    } catch (err) {
      console.error('Error fetching donors:', err);
    } finally {
      setDonorsLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setModalError('');

    try {
      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        setFormData({
          bloodGroup: 'O+',
          unitsNeeded: 1,
          urgency: 'medium',
          radiusKm: 10
        });
        fetchRequests();
      } else {
        setModalError(data.message || 'Error creating request');
      }
    } catch (err) {
      console.error(err);
      setModalError('Network error creating request');
    }
  };

  const handleTrackRequest = (id) => {
    setSelectedRequestId(id);
    setPage('request-details');
  };

  const handleDownloadCertificate = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/requests/${requestId}/certificate`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Error downloading certificate');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Blood_Donation_Certificate_${requestId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Network error downloading certificate PDF');
    }
  };

  const handleQuickRequest = (bloodGroup) => {
    setFormData(prev => ({ ...prev, bloodGroup }));
    setShowModal(true);
  };

  // Filter donors logic
  const hospitalCoords = user.location?.coordinates;
  const filteredDonors = donors.filter(d => {
    const matchesBlood = selectedBloodGroup === 'ALL' || d.bloodGroup === selectedBloodGroup;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'available' && d.isAvailable) ||
      (selectedStatus === 'offline' && !d.isAvailable);
    const matchesSearch =
      d.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
      d.phone.includes(donorSearch) ||
      d.bloodGroup.toLowerCase().includes(donorSearch.toLowerCase());

    return matchesBlood && matchesStatus && matchesSearch;
  });

  const availableCount = donors.filter(d => d.isAvailable).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Hospital Portal</h2>
          <p style={{ margin: 0 }}>
            Welcome, <strong>{user.name}</strong> | Registration ID: <strong>{user.regId}</strong>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>New Blood Request</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '12px' }}>
        <button
          onClick={() => setActiveTab('map')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'map' ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeTab === 'map' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          <MapPin size={18} />
          <span>Available Donors Map ({availableCount} Available)</span>
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeTab === 'requests' ? 'var(--primary)' : 'var(--text-secondary)'
          }}
        >
          <Award size={18} />
          <span>Blood Requests ({requests.length})</span>
        </button>
      </div>

      {/* Available Donors Map View */}
      {activeTab === 'map' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} style={{ color: 'var(--primary)' }} />
                  Live Regional Donors Map
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  View real-time locations of compatible blood donors near your hospital.
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
                  <select
                    className="form-control"
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                    value={selectedBloodGroup}
                    onChange={(e) => setSelectedBloodGroup(e.target.value)}
                  >
                    <option value="ALL">All Blood Groups</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <select
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="available">Available Only</option>
                  <option value="all">All (Available & Offline)</option>
                  <option value="offline">Offline Only</option>
                </select>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search name/phone..."
                    className="form-control"
                    style={{ padding: '6px 10px 6px 30px', fontSize: '0.85rem', width: '180px' }}
                    value={donorSearch}
                    onChange={(e) => setDonorSearch(e.target.value)}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>

            {/* Leaflet Map Component */}
            {donorsLoading ? (
              <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-md)' }}>
                Loading live donor positions...
              </div>
            ) : (
              <MapView
                hospitalCoords={hospitalCoords}
                donors={filteredDonors}
                height="400px"
              />
            )}
          </div>

          {/* Filtered Donors Cards Grid */}
          <div className="card">
            <h3>Registered Donors Directory ({filteredDonors.length})</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Nearby donors matching your active filters. Click "Request Blood" to initiate match search for a specific donor group.
            </p>

            {filteredDonors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                No donors found matching the selected filter criteria.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Donor Name</th>
                      <th style={{ padding: '12px' }}>Blood Group</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Distance</th>
                      <th style={{ padding: '12px' }}>Contact Phone</th>
                      <th style={{ padding: '12px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonors.map((d) => {
                      const dLng = d.location?.coordinates?.[0];
                      const dLat = d.location?.coordinates?.[1];
                      const hLng = hospitalCoords?.[0];
                      const hLat = hospitalCoords?.[1];
                      const distKm = (hLat !== undefined && hLng !== undefined && dLat !== undefined && dLng !== undefined)
                        ? calcDist(hLat, hLng, dLat, dLng)
                        : null;

                      return (
                        <tr key={d._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{d.name}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ backgroundColor: '#ffe4e6', color: '#e11d48', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                              {d.bloodGroup}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {d.isAvailable ? (
                              <span className="badge badge-confirmed">Available</span>
                            ) : (
                              <span className="badge badge-closed">Offline</span>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {distKm !== null ? `${distKm.toFixed(1)} km` : 'N/A'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={14} style={{ color: 'var(--text-secondary)' }} />
                              <span>{d.phone}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleQuickRequest(d.bloodGroup)}
                            >
                              Request {d.bloodGroup}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blood Requests View */}
      {activeTab === 'requests' && (
        <div className="card">
          <h3>Active & Historical Blood Requests</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Track matching timelines and donor responses in real-time.
          </p>

          {loading ? (
            <div>Loading requests...</div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Award size={48} style={{ opacity: 0.2, marginBottom: '12px', color: 'var(--primary)' }} />
              <p>No blood requests raised yet. Click "New Blood Request" to start.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Request Date</th>
                    <th style={{ padding: '12px' }}>Blood Group</th>
                    <th style={{ padding: '12px' }}>Units</th>
                    <th style={{ padding: '12px' }}>Urgency</th>
                    <th style={{ padding: '12px' }}>Search Radius</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>
                        {new Date(req.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>{req.bloodGroup}</td>
                      <td style={{ padding: '12px' }}>{req.unitsNeeded}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge badge-urgency-${req.urgency?.toLowerCase()}`}>{req.urgency}</span>
                      </td>
                      <td style={{ padding: '12px' }}>{req.radiusKm} km</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge badge-${req.status}`}>{req.status}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleTrackRequest(req._id)}>
                            <Eye size={14} />
                            <span>Track Status</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* New Blood Request Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Raise New Blood Request</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              The system will search for compatible, available donors and notify them one-by-one.
            </p>

            {modalError && <div className="alert alert-error">{modalError}</div>}

            <form onSubmit={handleCreateRequest}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Blood Group Required</label>
                  <select
                    className="form-control"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Units Needed</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.unitsNeeded}
                    onChange={(e) => setFormData({ ...formData, unitsNeeded: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Urgency Level</label>
                  <select
                    className="form-control"
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  >
                    <option value="low">Low (Routine)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Urgent)</option>
                    <option value="critical">Critical (Immediate match)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Search Radius (Km)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="form-control"
                    value={formData.radiusKm}
                    onChange={(e) => setFormData({ ...formData, radiusKm: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Raise Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
