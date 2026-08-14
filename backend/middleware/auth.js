const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const cleanRole = decoded.role.toLowerCase();
      if (cleanRole === 'donor') {
        req.user = await User.findById(decoded.id).select('-passwordHash');
        if (!req.user) {
          return res.status(401).json({ message: 'Donor not found, authorization failed' });
        }
      } else if (cleanRole === 'hospital') {
        req.user = await Hospital.findById(decoded.id).select('-passwordHash');
        if (!req.user) {
          return res.status(401).json({ message: 'Hospital not found, authorization failed' });
        }
      } else {
        return res.status(401).json({ message: 'Invalid role in token' });
      }

      req.userRole = cleanRole;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: `Role ${req.userRole} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };
