const express = require('express');
const router = express.Router();
const { registerDonor, registerHospital, login, getProfile, updateAvailability, getAvailableDonors } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register/donor', registerDonor);
router.post('/register/hospital', registerHospital);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.patch('/availability', protect, updateAvailability);
router.get('/donors', protect, getAvailableDonors);

module.exports = router;
