const mongoose = require('mongoose');

const MatchedDonorSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notifiedAt: { type: Date, default: Date.now },
  response: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  eligibility: {
    type: String,
    enum: ['pending', 'eligible', 'not_eligible'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['accepted', 'confirmed', 'in_progress', 'completed'],
    default: 'accepted'
  },
  contactConfirmed: { type: Boolean, default: false },
  donationCompleted: { type: Boolean, default: false }
}, { _id: false });

const StatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String }
}, { _id: false });

const BloodRequestSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  bloodGroup: { type: String, required: true },
  unitsNeeded: { type: Number, required: true, default: 1 },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  radiusKm: { type: Number, default: 10 },
  status: {
    type: String,
    enum: ['searching', 'donor_found', 'eligibility_pending', 'confirmed', 'in_progress', 'completed', 'closed'],
    default: 'searching'
  },
  matchedDonors: [MatchedDonorSchema],
  acceptedDonorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  statusHistory: [StatusHistorySchema],
  closedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
