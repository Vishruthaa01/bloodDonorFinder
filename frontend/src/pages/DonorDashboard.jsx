import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Heart, Check, X, Award, Printer, Download } from 'lucide-react';
import { MapView } from '../components/MapView';
import { DonorEligibilityModal } from '../components/DonorEligibilityModal';

export const DonorDashboard = () => {
  const { user, token, API_URL, updateAvailability } = useContext(AuthContext);
  const { incomingRequest, setIncomingRequest, addToast } = useContext(SocketContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);

  const getEligibilityDaysRemaining = () => {
    if (!user.lastDonationDate) return 0;
    const lastDonation = new Date(user.lastDonationDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastDonation);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 90 ? 90 - diffDays : 0;
  };

  const daysRemaining = getEligibilityDaysRemaining();
  const isEligible = daysRemaining === 0;

  useEffect(() => {
    if (user?._id) {
      fetchHistory();
    }
  }, [user?._id]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/requests/donor/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);

        // Automatically load pending request if any exists in DB history
        const activeMatch = data.find(req => req.status === 'searching' && req.response === 'pending');
        if (activeMatch) {
          setIncomingRequest({
            requestId: activeMatch._id,
            hospitalName: activeMatch.hospital?.name || 'Hospital',
            hospitalCoords: activeMatch.hospital?.location?.coordinates,
            bloodGroup: activeMatch.bloodGroup,
            unitsNeeded: activeMatch.unitsNeeded,
            urgency: activeMatch.urgency,
            message: `Urgent: Blood request for ${activeMatch.bloodGroup} at ${activeMatch.hospital?.name || 'Hospital'}.`
          });
        }
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

  const handleDownloadCertificate = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/requests/${requestId}/certificate`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        addToast(data.message || 'Error downloading certificate', 'error');
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
      addToast('Certificate downloaded successfully!', 'success');
    } catch (err) {
      console.error('Error downloading certificate:', err);
      addToast('Network error downloading certificate PDF', 'error');
    }
  };

  const completedDonationsCount = history.filter(h => h.status === 'completed' || h.status === 'closed').length;
  const acceptedRequestsCount = history.filter(h => h.response === 'accepted' || h.status === 'completed' || h.status === 'closed').length;
  const livesSavedCount = completedDonationsCount * 3;
  const completedDonationsList = history.filter(h => h.status === 'completed' || h.status === 'closed');

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

      {/* Donation History Overview Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ backgroundColor: '#fff0f3', padding: '12px', borderRadius: '50%', color: 'var(--primary)' }}>
            <Heart size={24} fill="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed Donations</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{completedDonationsCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ backgroundColor: '#f0fff4', padding: '12px', borderRadius: '50%', color: 'var(--success)' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Estimated Lives Saved</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{livesSavedCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '50%', color: '#3b82f6' }}>
            <Check size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Accepted Matches</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{acceptedRequestsCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ backgroundColor: '#f5f3ff', padding: '12px', borderRadius: '50%', color: '#8b5cf6' }}>
            <Printer size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Donation Status</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isEligible ? 'var(--success)' : 'var(--danger)' }}>
              {isEligible ? 'Eligible Today' : `${daysRemaining} Days Cooldown`}
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Banner for Completed Donations & Certificate Download */}
      {completedDonationsList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {completedDonationsList.map(completedReq => (
            <div key={completedReq._id} className="card" style={{ borderLeft: '6px solid var(--success)', backgroundColor: 'var(--success-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge badge-completed" style={{ marginBottom: '8px' }}>
                  DONATION COMPLETED 🎉
                </span>
                <h3 style={{ margin: 0, color: 'var(--success)' }}>
                  Thank you for saving lives! Your donation certificate is ready.
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Hospital: <strong>{completedReq.hospital?.name || 'Authorized Donation Center'}</strong> | Date: <strong>{new Date(completedReq.updatedAt || completedReq.createdAt).toLocaleDateString()}</strong> | Blood Group: <strong>{completedReq.bloodGroup}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownloadCertificate(completedReq._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700 }}
                >
                  <Download size={18} />
                  <span>Download Certificate PDF</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedCert(completedReq)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Award size={16} />
                  <span>Preview Certificate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {incomingRequest && (
        <div className="card" style={{ borderLeft: '6px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span className="badge badge-urgency-critical" style={{ marginBottom: '10px' }}>
                {incomingRequest.urgency || 'CRITICAL'} REQUEST
              </span>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
                Urgent Blood Match Required ({incomingRequest.bloodGroup})
              </h3>
              <p style={{ marginTop: '8px', marginBottom: 0 }}>
                <strong>Hospital:</strong> {incomingRequest.hospitalName} <br />
                <strong>Units Needed:</strong> {incomingRequest.unitsNeeded} units <br />
                {incomingRequest.message}
              </p>
              
              {!isEligible && (
                <div className="alert alert-error" style={{ marginTop: '16px', marginBottom: 0, padding: '10px 14px' }}>
                  <span>⚠️ <b>Medical Ineligibility Alert:</b> You cannot accept this request. Your last donation was on <b>{new Date(user.lastDonationDate).toLocaleDateString()}</b>. You must wait another <b>{daysRemaining} day(s)</b> to complete the standard 90-day recovery interval. Please decline this request to route it to the next candidate.</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={`btn ${isEligible ? 'btn-primary' : 'btn-disabled'}`} 
                onClick={() => isEligible && setShowEligibilityModal(true)}
                disabled={!isEligible}
                title={!isEligible ? `Ineligible to donate for another ${daysRemaining} days` : 'Accept match request'}
              >
                <Check size={18} />
                <span>Accept</span>
              </button>
              <button className="btn btn-secondary" onClick={() => handleResponse(incomingRequest.requestId, 'rejected')}>
                <X size={18} />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* Map view showing hospital location and donor's own location */}
          {incomingRequest.hospitalCoords && user.location?.coordinates && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Routing Map:
              </div>
              <MapView
                hospitalCoords={incomingRequest.hospitalCoords}
                donorCoords={user.location.coordinates}
              />
            </div>
          )}
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
                  <th style={{ padding: '12px' }}>Certificate</th>
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
                    <td style={{ padding: '12px' }}>
                      {req.status === 'completed' || req.status === 'closed' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleDownloadCertificate(req._id)}
                            style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Download size={13} />
                            <span>Download Certificate</span>
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedCert(req)}
                            style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Award size={13} />
                            <span>Preview</span>
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCert && (
        <div className="modal-overlay" style={{ padding: '16px' }}>
          <div className="modal-content" style={{ maxWidth: '650px', padding: '32px', border: '8px double var(--primary-light)', position: 'relative' }}>
            <div style={{ border: '2px solid var(--primary)', padding: '24px', textAlign: 'center' }}>
              <Heart size={44} fill="var(--primary)" color="var(--primary)" style={{ marginBottom: '12px' }} />
              <h2 style={{ fontFamily: 'Georgia, serif', color: 'var(--text-primary)', fontSize: '1.8rem', marginBottom: '4px' }}>
                Blood Donation Certificate
              </h2>
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Presented to a life saver
              </p>
              
              <h3 style={{ fontSize: '1.6rem', color: 'var(--primary)', marginBottom: '12px' }}>
                {user.name}
              </h3>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '480px', margin: '0 auto 20px auto' }}>
                For voluntarily donating <b>{selectedCert.unitsNeeded} unit(s)</b> of <b>{selectedCert.bloodGroup}</b> blood to <b>{selectedCert.hospital?.name}</b> on {new Date(selectedCert.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}. Your selfless contribution has helped save lives.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '30px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    DONATION ID
                  </div>
                  <code style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
                    {selectedCert._id}
                  </code>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '20px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCert(null)}>
                Close
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => handleDownloadCertificate(selectedCert._id)}>
                <Download size={14} />
                <span>Download PDF Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showEligibilityModal && incomingRequest && (
        <DonorEligibilityModal
          request={incomingRequest}
          onConfirm={() => {
            setShowEligibilityModal(false);
            handleResponse(incomingRequest.requestId, 'accepted');
          }}
          onCancel={() => {
            setShowEligibilityModal(false);
          }}
        />
      )}
    </div>
  );
};
