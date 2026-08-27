import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { ArrowLeft, User, Phone, Check, X, Clock, MapPin, CheckCircle, HelpCircle, Download } from 'lucide-react';
import { MapView } from '../components/MapView';

export const RequestTracking = () => {
  const { token, API_URL, selectedRequestId, setPage } = useContext(AuthContext);
  const { addToast } = useContext(SocketContext);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const steps = [
    { key: 'searching', label: 'Searching' },
    { key: 'donor_found', label: 'Donor Found' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' }
  ];

  useEffect(() => {
    fetchRequestDetails();

    const handleUpdate = (e) => {
      if (e.detail.requestId === selectedRequestId) {
        fetchRequestDetails();
      }
    };
    window.addEventListener('requestUpdated', handleUpdate);
    return () => window.removeEventListener('requestUpdated', handleUpdate);
  }, [selectedRequestId]);

  const fetchRequestDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/requests/${selectedRequestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (endpoint, body = {}) => {
    try {
      const res = await fetch(`${API_URL}/requests/${selectedRequestId}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, 'success');
        fetchRequestDetails();
      } else {
        addToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error performing action', 'error');
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

  if (loading) return <div>Loading request tracking timeline...</div>;
  if (!request) return <div>Request not found.</div>;

  // Calculate current step index
  const getStepStatus = (stepKey, currentStatus) => {
    const statusOrder = ['searching', 'donor_found', 'confirmed', 'in_progress', 'completed', 'closed'];
    const currentIdx = statusOrder.indexOf(currentStatus);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (currentStatus === 'closed') return 'completed';
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setPage('hospital-dashboard')}
          style={{ marginBottom: '16px' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Track Request ({request.bloodGroup})</h2>
            <p style={{ margin: 0 }}>
              ID: <code style={{ fontSize: '0.85rem' }}>{request._id}</code> | Urgency:{' '}
              <span className={`badge badge-urgency-${request.urgency?.toLowerCase()}`}>{request.urgency}</span>
            </p>
          </div>
          <div>
            <span className={`badge badge-${request.status}`}>{request.status}</span>
          </div>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="card">
        <div className="stepper">
          {steps.map((step) => {
            const state = getStepStatus(step.key, request.status);
            return (
              <div key={step.key} className={`step ${state}`}>
                <div className="step-circle">
                  {state === 'completed' ? <Check size={16} /> : null}
                  {state === 'active' ? '•' : null}
                  {state === 'pending' ? '' : null}
                </div>
                <div className="step-label">{step.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Map View */}
      {request.hospitalId?.location?.coordinates && (
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px' }}>Live Matching Map</h3>
          <MapView
            hospitalCoords={request.hospitalId.location.coordinates}
            donorCoords={request.acceptedDonorId?.location?.coordinates}
            radiusKm={request.radiusKm}
          />
        </div>
      )}

      {/* Active Phase Controls */}
      <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
        <h3>Current Action Items</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Manage the active state and update patient dispatch status below.
        </p>

        {request.status === 'searching' && (
          <div style={{ padding: '16px 0' }}>
            {request.radiusKm >= 100 && request.matchedDonors.length === 0 ? (
              <div style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: '#873800' }}>
                ⚠️ <strong>No Compatible Donors Found:</strong> The matching engine searched up to the maximum 100 km radius, but no available compatible donors were found near the hospital location. You can try raising a new request with different criteria or registering local donors.
              </div>
            ) : (
              <p>
                🔍 <strong>Status: Searching compatible donors...</strong> <br />
                {request.unitsNeeded > 1 ? (
                  <>The matching engine is notifying <strong>multiple donors ({request.unitsNeeded} donors required)</strong> simultaneously within {request.radiusKm} km.</>
                ) : (
                  <>The matching engine is currently analyzing available donors within {request.radiusKm} km. Once a nearby compatible donor is notified, they have 3 minutes to accept.</>
                )}
              </p>
            )}
            {request.matchedDonors.filter(m => m.response === 'pending').length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <strong>Currently notified ({request.matchedDonors.filter(m => m.response === 'pending').length} donor(s)):</strong>{' '}
                {request.matchedDonors
                  .filter(m => m.response === 'pending')
                  .map(m => `${m.donorId?.name || 'Donor'} (${m.donorId?.bloodGroup || request.bloodGroup})`)
                  .join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Separate Portal Cards for Accepted Donors */}
        {request.matchedDonors.filter(m => m.response === 'accepted').length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            <h4 style={{ margin: 0, color: 'var(--primary)' }}>
              Accepted Donors Confirmation Queue ({request.matchedDonors.filter(m => m.response === 'accepted').length} donor(s))
            </h4>

            {request.matchedDonors.filter(m => m.response === 'accepted').map((m, idx) => {
              const donor = m.donorId;
              const donorIdStr = donor?._id || donor;
              return (
                <div key={idx} className="card" style={{ backgroundColor: 'var(--secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ backgroundColor: 'var(--bg-card)', padding: '10px', borderRadius: '50%' }}>
                        <User size={24} />
                      </div>
                      <div>
                        <strong>{donor?.name || 'Accepted Donor'}</strong> has accepted 1 unit.
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Blood Group: <strong>{donor?.bloodGroup || request.bloodGroup}</strong> | Phone: <strong>{donor?.phone || 'N/A'}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge badge-${m.eligibility === 'eligible' ? 'confirmed' : m.eligibility === 'not_eligible' ? 'closed' : 'searching'}`}>
                        Eligibility: {m.eligibility || 'pending'}
                      </span>
                    </div>
                  </div>

                  {/* Specific Action Buttons for this Donor */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    {m.eligibility === 'pending' && (
                      <div>
                        <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                          🏥 <strong>Clinical Verification:</strong> Verify physical screening for <strong>{donor?.name}</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAction('eligibility', { eligibility: 'eligible', donorId: donorIdStr })}
                          >
                            <Check size={14} />
                            <span>Mark Eligible (Confirm {donor?.name})</span>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleAction('eligibility', { eligibility: 'not_eligible', donorId: donorIdStr })}
                          >
                            <X size={14} />
                            <span>Mark Ineligible</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {m.eligibility === 'eligible' && request.status === 'confirmed' && (
                      <div>
                        <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                          📞 <strong>Contact & Dispatch:</strong> Contact <strong>{donor?.name}</strong> at <strong>{donor?.phone}</strong> to confirm ETA.
                        </p>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAction('contact', { donorId: donorIdStr })}
                        >
                          Confirm Contact & {donor?.name} Traveling
                        </button>
                      </div>
                    )}

                    {request.status === 'in_progress' && (
                      <div>
                        <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                          💉 <strong>Donation In Progress:</strong> Collect blood from <strong>{donor?.name}</strong>.
                        </p>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAction('complete', { donorId: donorIdStr })}
                        >
                          Log Donation Completed for {donor?.name}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {request.status === 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <p>
              🎉 <strong>Donation Completed:</strong> All blood collections finished. Click below to close and archive this request.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => handleAction('close')}>
                Close & Archive Request
              </button>
            </div>
          </div>
        )}

        {request.status === 'closed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <p style={{ margin: 0 }}>
              ✅ <strong>Archived:</strong> This request was closed on{' '}
              {request.closedAt ? new Date(request.closedAt).toLocaleDateString() : 'N/A'}.
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        {/* Donor Matching Logs */}
        <div className="card">
          <h3>Matching History Log</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            History of matching engine attempts for this request.
          </p>
          {request.matchedDonors.length === 0 ? (
            <div>No matching notifications sent.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {request.matchedDonors.map((match, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'var(--secondary)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div>
                    <strong>{match.donorId?.name || 'Unknown Donor'}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Notified: {new Date(match.notifiedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {match.response === 'pending' && (
                      <span className="badge badge-searching" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>Awaiting Response</span>
                      </span>
                    )}
                    {match.response === 'accepted' && (
                      <span className="badge badge-confirmed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} />
                        <span>Accepted</span>
                      </span>
                    )}
                    {match.response === 'rejected' && (
                      <span className="badge badge-closed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <X size={12} />
                        <span>Rejected / Timed out</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Timeline */}
        <div className="card">
          <h3>Lifecycle Timeline</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            System state transitions.
          </p>
          {request.statusHistory.length === 0 ? (
            <div>No logs recorded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              {request.statusHistory.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize' }}>{log.status}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.note}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
