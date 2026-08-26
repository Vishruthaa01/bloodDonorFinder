const express = require('express');
const router = express.Router();
const {
  getStats,
  getDonors,
  getHospitals,
  getDonations,
  toggleVerifyHospital,
  toggleVerifyDonor
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes here are protected and restricted to the 'admin' role
router.get('/stats', protect, authorize('admin'), getStats);
router.get('/donors', protect, authorize('admin'), getDonors);
router.get('/hospitals', protect, authorize('admin'), getHospitals);
router.get('/donations', protect, authorize('admin'), getDonations);
router.patch('/donors/:id/verify', protect, authorize('admin'), toggleVerifyDonor);
router.patch('/hospitals/:id/verify', protect, authorize('admin'), toggleVerifyHospital);

module.exports = router;
