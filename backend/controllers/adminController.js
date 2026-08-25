const User = require('../models/User');
const Hospital = require('../models/Hospital');
const BloodRequest = require('../models/BloodRequest');

// Get overall system stats
exports.getStats = async (req, res) => {
  try {
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalHospitals = await Hospital.countDocuments({});
    const totalRequests = await BloodRequest.countDocuments({});
    const completedRequests = await BloodRequest.countDocuments({ status: 'completed' });
    const activeRequests = await BloodRequest.countDocuments({
      status: { $in: ['searching', 'donor_found', 'eligibility_pending', 'confirmed', 'in_progress'] }
    });

    res.json({
      totalDonors,
      totalHospitals,
      totalRequests,
      completedRequests,
      activeRequests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching admin statistics' });
  }
};

// Get list of all donors
exports.getDonors = async (req, res) => {
  try {
    const donors = await User.find({ role: 'donor' })
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json(donors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching donors list' });
  }
};

// Get list of all hospitals
exports.getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({})
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching hospitals list' });
  }
};

// Get list of all blood requests
exports.getRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({})
      .populate('hospitalId', 'name email address phone')
      .populate('acceptedDonorId', 'name email phone bloodGroup')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching blood requests' });
  }
};

// Toggle hospital verification status
exports.toggleVerifyHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    hospital.verified = !hospital.verified;
    await hospital.save();

    res.json({
      message: `Hospital '${hospital.name}' verification status changed to ${hospital.verified}`,
      hospital
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating hospital verification status' });
  }
};
