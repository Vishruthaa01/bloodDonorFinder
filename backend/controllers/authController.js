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

    if (!email || !password || !name || !phone || !bloodGroup || !age) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Donor with this email already exists' });
    }

    if (!location || isNaN(parseFloat(location.longitude)) || isNaN(parseFloat(location.latitude))) {
      return res.status(400).json({ message: 'Valid location coordinates (longitude & latitude) are required' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const formattedLocation = {
      type: 'Point',
      coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
    };

    const user = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
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

    if (!email || !password || !name || !regId || !address || !contactPerson || !phone) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRegId = regId.trim().toUpperCase();

    const hospitalExists = await Hospital.findOne({ $or: [{ email: normalizedEmail }, { regId: normalizedRegId }] });
    if (hospitalExists) {
      return res.status(400).json({ message: 'Hospital with this email or Reg ID already exists' });
    }

    if (!location || isNaN(parseFloat(location.longitude)) || isNaN(parseFloat(location.latitude))) {
      return res.status(400).json({ message: 'Valid location coordinates (longitude & latitude) are required' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const formattedLocation = {
      type: 'Point',
      coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)]
    };

    const hospital = await Hospital.create({
      name: name.trim(),
      regId: normalizedRegId,
      address: address.trim(),
      location: formattedLocation,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
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

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });
    let role = 'donor';

    if (!user) {
      user = await Hospital.findOne({ email: normalizedEmail });
      role = 'hospital';
    } else {
      role = user.role || 'donor';
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

exports.getAvailableDonors = async (req, res) => {
  try {
    const { bloodGroup, isAvailable } = req.query;
    let query = { role: 'donor' };

    if (bloodGroup && bloodGroup !== 'ALL') {
      query.bloodGroup = bloodGroup;
    }

    if (isAvailable === 'true') {
      query.isAvailable = true;
    } else if (isAvailable === 'false') {
      query.isAvailable = false;
    }

    const donors = await User.find(query)
      .select('-passwordHash')
      .sort({ isAvailable: -1, createdAt: -1 });

    res.json(donors);
  } catch (error) {
    console.error('Error fetching available donors:', error);
    res.status(500).json({ message: 'Server error fetching available donors' });
  }
};

