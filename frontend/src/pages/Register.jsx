import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MapPin } from 'lucide-react';

export const Register = ({ registerType }) => {
  const { registerDonor, registerHospital, setPage } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    bloodGroup: 'O+',
    age: '',
    lastDonationDate: '',
    regId: '',
    address: '',
    contactPerson: '',
    latitude: '',
    longitude: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    // Automatically attempt to fetch geolocation coordinates on load
    fetchCoordinates();
  }, []);

  const fetchCoordinates = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6)
          }));
          setLocating(false);
        },
        (err) => {
          console.error(err);
          // Set a default mock location (New York City center) for easy testing
          setFormData(prev => ({
            ...prev,
            latitude: '40.712800',
            longitude: '-74.006000'
          }));
          setLocating(false);
        }
      );
    } else {
      setFormData(prev => ({
        ...prev,
        latitude: '40.712800',
        longitude: '-74.006000'
      }));
      setLocating(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.latitude || !formData.longitude) {
      setError('Please provide latitude and longitude coordinates.');
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      location: {
        latitude: formData.latitude,
        longitude: formData.longitude
      }
    };

    let result;
    if (registerType === 'donor') {
      result = await registerDonor({
        ...payload,
        bloodGroup: formData.bloodGroup,
        age: formData.age,
        lastDonationDate: formData.lastDonationDate
      });
    } else {
      result = await registerHospital({
        ...payload,
        regId: formData.regId,
        address: formData.address,
        contactPerson: formData.contactPerson
      });
    }

    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  const isDonor = registerType === 'donor';

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', width: '100%' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>
          {isDonor ? 'Register as Blood Donor' : 'Register Hospital'}
        </h2>
        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Provide your details to set up your account.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{isDonor ? 'Full Name' : 'Hospital Name'}</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {isDonor ? (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select name="bloodGroup" className="form-control" value={formData.bloodGroup} onChange={handleChange}>
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
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    name="age"
                    className="form-control"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    min="18"
                    max="65"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Donation</label>
                  <input
                    type="date"
                    name="lastDonationDate"
                    className="form-control"
                    value={formData.lastDonationDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hospital Registration ID</label>
                  <input
                    type="text"
                    name="regId"
                    className="form-control"
                    value={formData.regId}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    className="form-control"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Hospital Address</label>
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <div className="card" style={{ padding: '16px', marginBottom: '24px', backgroundColor: 'var(--secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.9rem' }}>
                <MapPin size={16} />
                <span>Geospatial Location Coordinates</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={fetchCoordinates}
                disabled={locating}
                style={{ marginLeft: 'auto' }}
              >
                {locating ? 'Locating...' : 'Refresh GPS'}
              </button>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Longitude (X-axis)</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  className="form-control"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Latitude (Y-axis)</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  className="form-control"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
              * Coordinates are required to match hospitals with nearby donors. Feel free to customize these numbers to simulate different test distances.
            </p>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Submitting...' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); setPage('login'); }} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Login here
          </a>
        </div>
      </div>
    </div>
  );
};
