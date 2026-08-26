const User = require('../models/User');
const Hospital = require('../models/Hospital');
const BloodRequest = require('../models/BloodRequest');

// Get overall system stats
exports.getStats = async (req, res) => {
  try {
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const verifiedDonors = await User.countDocuments({ role: 'donor', verified: true });
    const pendingDonors = await User.countDocuments({ role: 'donor', verified: false });

    const totalHospitals = await Hospital.countDocuments({});
    const verifiedHospitals = await Hospital.countDocuments({ verified: true });
    const pendingHospitals = await Hospital.countDocuments({ verified: false });

    const totalDonations = await BloodRequest.countDocuments({
      status: { $in: ['completed', 'closed'] }
    });

    res.json({
      totalDonors,
      verifiedDonors,
      pendingDonors,
      totalHospitals,
      verifiedHospitals,
      pendingHospitals,
      totalDonations
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

// Get list of completed donations
exports.getDonations = async (req, res) => {
  try {
    const donations = await BloodRequest.find({
      status: { $in: ['completed', 'closed'] }
    })
      .populate('hospitalId', 'name email address phone')
      .populate('acceptedDonorId', 'name email phone bloodGroup')
      .sort({ updatedAt: -1, createdAt: -1 });
    res.json(donations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching completed donations' });
  }
};

// Verify or reject donor account
exports.toggleVerifyDonor = async (req, res) => {
  try {
    const donor = await User.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    const { verified } = req.body;
    if (typeof verified === 'boolean') {
      donor.verified = verified;
    } else {
      donor.verified = !donor.verified;
    }

    await donor.save();

    res.json({
      message: `Donor '${donor.name}' verification status updated to ${donor.verified ? 'Verified' : 'Rejected/Pending'}`,
      donor
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating donor verification status' });
  }
};

// Verify or reject hospital account
exports.toggleVerifyHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const { verified } = req.body;
    if (typeof verified === 'boolean') {
      hospital.verified = verified;
    } else {
      hospital.verified = !hospital.verified;
    }

    await hospital.save();

    res.json({
      message: `Hospital '${hospital.name}' verification status updated to ${hospital.verified ? 'Verified' : 'Rejected/Pending'}`,
      hospital
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating hospital verification status' });
  }
};
