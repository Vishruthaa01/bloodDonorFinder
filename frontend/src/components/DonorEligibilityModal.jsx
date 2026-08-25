import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Heart, ArrowRight } from 'lucide-react';

export const DonorEligibilityModal = ({ request, onConfirm, onCancel }) => {
  const [answers, setAnswers] = useState({
    ageAndWeight: null,       // Expected: true (Yes)
    goodHealth: null,         // Expected: true (Yes)
    ninetyDays: null,         // Expected: true (Yes)
    noRecentTattooOrSurgery: null, // Expected: true (No to tattoo/surgery risk)
    noChronicCondition: null, // Expected: true (Yes to healthy)
    noAlcohol24h: null        // Expected: true (Yes)
  });

  const [submitted, setSubmitted] = useState(false);

  const questions = [
    {
      id: 'ageAndWeight',
      title: 'Age & Weight Criteria',
      question: 'Are you between 18 – 65 years of age and weigh at least 50 kg (110 lbs)?',
      requiredValue: true,
      failReason: 'Donors must be between 18-65 years old and weigh at least 50 kg for safe donation.'
    },
    {
      id: 'goodHealth',
      title: 'Current Health Status',
      question: 'Are you feeling healthy and well today, without fever, cold, flu, or active infection?',
      requiredValue: true,
      failReason: 'Donors must be feeling completely healthy on donation day to avoid complications.'
    },
    {
      id: 'ninetyDays',
      title: 'Donation Frequency (90-Day Rule)',
      question: 'Has it been at least 90 days (3 months) since your last blood donation?',
      requiredValue: true,
      failReason: 'A minimum 90-day recovery interval is required between whole blood donations.'
    },
    {
      id: 'noRecentTattooOrSurgery',
      title: 'Recent Tattoos & Surgeries',
      question: 'Have you HAD any major surgery, blood transfusion, tattoo, or body piercing in the past 6 months?',
      requiredValue: false, // User answering "No" means no recent tattoo/surgery risk
      failReason: 'Tattoos, body piercings, or major surgeries in the last 6 months carry temporary deferral guidelines.'
    },
    {
      id: 'noChronicCondition',
      title: 'Medical Conditions & Medications',
      question: 'Are you FREE from severe cardiac conditions, active hepatitis, HIV, or ongoing antibiotic treatment?',
      requiredValue: true,
      failReason: 'Certain chronic health conditions or active antibiotic regimens require medical deferral.'
    },
    {
      id: 'noAlcohol24h',
      title: 'Alcohol & Substance Status',
      question: 'Have you refrained from consuming alcohol in the last 24 hours?',
      requiredValue: true,
      failReason: 'Donors must not consume alcohol 24 hours prior to blood donation.'
    }
  ];

  const handleSelect = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const allAnswered = questions.every(q => answers[q.id] !== null);

  const failedQuestions = questions.filter(q => answers[q.id] !== null && answers[q.id] !== q.requiredValue);
  const isEligible = allAnswered && failedQuestions.length === 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (isEligible) {
      onConfirm();
    }
  };

  return (
    <div className="modal-overlay" style={{ padding: '16px', zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
        {/* Header */}
        <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
            <ShieldCheck size={28} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
              Donor Pre-Donation Eligibility Test
            </h2>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Please complete this mandatory medical screening test before accepting the blood request from <strong>{request?.hospitalName || 'Hospital'}</strong> ({request?.bloodGroup}).
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {questions.map((q, idx) => {
              const currentVal = answers[q.id];
              const isAnswered = currentVal !== null;
              const isPass = isAnswered && currentVal === q.requiredValue;
              const isFail = isAnswered && currentVal !== q.requiredValue;

              return (
                <div
                  key={q.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid ' + (isFail ? 'var(--danger)' : isPass ? 'var(--success)' : 'var(--border-color)'),
                    backgroundColor: isFail ? '#fff5f5' : isPass ? '#f0fff4' : 'var(--bg-card)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Question {idx + 1}: {q.title}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '4px', color: 'var(--text-primary)' }}>
                        {q.question}
                      </div>
                    </div>
                    {isPass && <CheckCircle size={20} color="var(--success)" style={{ flexShrink: 0 }} />}
                    {isFail && <XCircle size={20} color="var(--danger)" style={{ flexShrink: 0 }} />}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name={q.id}
                        checked={currentVal === true}
                        onChange={() => handleSelect(q.id, true)}
                      />
                      <span>Yes</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name={q.id}
                        checked={currentVal === false}
                        onChange={() => handleSelect(q.id, false)}
                      />
                      <span>No</span>
                    </label>
                  </div>

                  {isFail && (
                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 500 }}>
                      ⚠️ {q.failReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Result Alert */}
          {allAnswered && (
            <div style={{ marginTop: '24px' }}>
              {isEligible ? (
                <div className="alert alert-success" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={24} />
                  <div>
                    <strong>Eligibility Test Passed!</strong> <br />
                    You meet all medical criteria for whole blood donation. Click below to confirm acceptance.
                  </div>
                </div>
              ) : (
                <div className="alert alert-error" style={{ padding: '14px', display: 'flex', alignItems: 'start', gap: '10px' }}>
                  <AlertTriangle size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Ineligibility Detected:</strong> <br />
                    Based on standard medical guidelines, you do not currently meet the eligibility criteria for this donation. Please decline this request so it can be routed to another candidate.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>

            {allAnswered && isEligible && (
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Heart size={16} fill="white" />
                <span>Confirm & Accept Request</span>
              </button>
            )}

            {allAnswered && !isEligible && (
              <button type="button" className="btn btn-danger" onClick={onCancel}>
                Decline Request
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
