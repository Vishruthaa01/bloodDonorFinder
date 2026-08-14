const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.registerDonor = async (req, res) => {
  try {
    const { name, phone, email, password, bloodGroup, location, age, lastDonationDate } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Donor with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const formattedLocation = {
      type: 'Point',
      coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
    };

    const user = await User.create({
      name,
      phone,
      email,
      passwordHash,
      bloodGroup,
      location: formattedLocation,
      age: parseInt(age),
      lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
      role: 'donor'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error registering donor' });
  }
};

exports.registerHospital = async (req, res) => {
  try {
    const { name, regId, address, location, contactPerson, phone, email, password } = req.body;

    const hospitalExists = await Hospital.findOne({ $or: [{ email }, { regId }] });
    if (hospitalExists) {
      return res.status(400).json({ message: 'Hospital with this email or Reg ID already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const formattedLocation = {
      type: 'Point',
      coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
    };

    const hospital = await Hospital.create({
      name,
      regId,
      address,
      location: formattedLocation,
      contactPerson,
      phone,
      email,
      passwordHash,
      role: 'hospital',
      verified: true
    });

    res.status(201).json({
      _id: hospital._id,
      name: hospital.name,
      email: hospital.email,
      role: hospital.role,
      token: generateToken(hospital._id, hospital.role)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error registering hospital' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    let role = 'donor';

    if (!user) {
      user = await Hospital.findOne({ email });
      role = 'hospital';
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: role,
      token: generateToken(user._id, role)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error logging in' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    if (req.userRole !== 'donor') {
      return res.status(403).json({ message: 'Only donors can update availability' });
    }
    const { isAvailable } = req.body;
    req.user.isAvailable = isAvailable;
    await req.user.save();
    res.json({ message: 'Availability updated successfully', isAvailable: req.user.isAvailable });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating availability' });
  }
};
