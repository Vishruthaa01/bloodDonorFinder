const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequestById,
  getHospitalRequests,
  getDonorRequests,
  respondToRequest,
  checkEligibility,
  confirmContact,
  completeRequest,
  closeRequest,
  getNotifications
} = require('../controllers/requestController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createRequest);
router.get('/:id', protect, getRequestById);
router.get('/hospital/:hospitalId', protect, getHospitalRequests);
router.get('/donor/:donorId', protect, getDonorRequests);
router.post('/:id/respond', protect, respondToRequest);
router.patch('/:id/eligibility', protect, checkEligibility);
router.patch('/:id/contact', protect, confirmContact);
router.patch('/:id/complete', protect, completeRequest);
router.patch('/:id/close', protect, closeRequest);
router.get('/notifications/:donorId', protect, getNotifications);

module.exports = router;
