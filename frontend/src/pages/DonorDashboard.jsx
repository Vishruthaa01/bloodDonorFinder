import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Heart, Check, X } from 'lucide-react';

export const DonorDashboard = () => {
  const { user, token, API_URL, updateAvailability } = useContext(AuthContext);
  const { incomingRequest, setIncomingRequest, addToast } = useContext(SocketContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [incomingRequest]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/requests/donor/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, response) => {
    try {
      const res = await fetch(`${API_URL}/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response })
      });

      const data = await res.json();
      if (res.ok) {
        addToast(`You successfully ${response} the request!`, 'success');
        setIncomingRequest(null);
        fetchHistory();
      } else {
        addToast(data.message || 'Error sending response', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error responding to request', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Donor Dashboard</h2>
          <p style={{ margin: 0 }}>
            Blood Group: <strong style={{ color: 'var(--primary)' }}>{user.bloodGroup}</strong> | Age: <strong>{user.age}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 600 }}>Active Status:</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={user.isAvailable}
              onChange={(e) => updateAvailability(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <span style={{ fontWeight: 700, color: user.isAvailable ? 'var(--success)' : 'var(--text-secondary)' }}>
            {user.isAvailable ? 'AVAILABLE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {incomingRequest && (
        <div className="card" style={{ borderLeft: '6px solid var(--primary)', animation: 'pulse 3s infinite' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span className="badge badge-urgency-critical" style={{ marginBottom: '10px' }}>
                {incomingRequest.urgency || 'CRITICAL'} REQUEST
              </span>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
                Urgent Blood Match Required ({incomingRequest.bloodGroup})
              </h3>
              <p style={{ marginTop: '8px' }}>
                <strong>Hospital:</strong> {incomingRequest.hospitalName} <br />
                <strong>Units Needed:</strong> {incomingRequest.unitsNeeded} units <br />
                {incomingRequest.message}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={() => handleResponse(incomingRequest.requestId, 'accepted')}>
                <Check size={18} />
                <span>Accept</span>
              </button>
              <button className="btn btn-secondary" onClick={() => handleResponse(incomingRequest.requestId, 'rejected')}>
                <X size={18} />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>My Donation & Match History</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Record of all notifications and donations you responded to.
        </p>

        {loading ? (
          <div>Loading history...</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <Heart size={48} style={{ opacity: 0.2, marginBottom: '12px', color: 'var(--primary)' }} />
            <p>No donation requests matched yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Hospital</th>
                  <th style={{ padding: '12px' }}>Blood Group</th>
                  <th style={{ padding: '12px' }}>Units</th>
                  <th style={{ padding: '12px' }}>Urgency</th>
                  <th style={{ padding: '12px' }}>My Response</th>
                  <th style={{ padding: '12px' }}>Eligibility</th>
                  <th style={{ padding: '12px' }}>Request Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((req) => (
                  <tr key={req._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{req.hospital?.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.hospital?.address}</div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>{req.bloodGroup}</td>
                    <td style={{ padding: '12px' }}>{req.unitsNeeded}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-urgency-${req.urgency?.toLowerCase()}`}>{req.urgency}</span>
                    </td>
                    <td style={{ padding: '12px', textTransform: 'capitalize', fontWeight: 600 }}>
                      <span style={{ color: req.response === 'accepted' ? 'var(--success)' : req.response === 'rejected' ? 'var(--danger)' : 'var(--warning)' }}>
                        {req.response}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                      <span style={{ fontWeight: 600, color: req.eligibility === 'eligible' ? 'var(--success)' : req.eligibility === 'not_eligible' ? 'var(--danger)' : 'inherit' }}>
                        {req.eligibility}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-${req.status}`}>{req.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
