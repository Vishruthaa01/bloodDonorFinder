import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Plus, Eye, Award } from 'lucide-react';

export const HospitalDashboard = () => {
  const { user, token, API_URL, setPage, setSelectedRequestId } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    unitsNeeded: 1,
    urgency: 'medium',
    radiusKm: 10
  });
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchRequests();

    const handleUpdate = () => fetchRequests();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
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

      <div className="card">
        <h3>Active & Historical Blood Requests</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Track matching matching timelines and donor responses in real-time.
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
                      <button className="btn btn-secondary btn-sm" onClick={() => handleTrackRequest(req._id)}>
                        <Eye size={14} />
                        <span>Track Status</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
