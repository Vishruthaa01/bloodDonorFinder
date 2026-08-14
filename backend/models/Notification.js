const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['sent', 'read', 'responded'],
    default: 'sent'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
