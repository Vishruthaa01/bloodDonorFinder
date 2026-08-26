const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const Notification = require('../models/Notification');
const notifyService = require('./notifyService');

const getCompatibleBloodGroups = (recipientGroup) => {
  const compatibility = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
  };
  return compatibility[recipientGroup] || [recipientGroup];
};

const matchAndNotifyNextDonor = async (requestId) => {
  try {
    const request = await BloodRequest.findById(requestId).populate('hospitalId');
    if (!request) return { success: false, message: 'Request not found' };

    if (request.status !== 'searching') {
      return { success: false, message: `Request is in status: ${request.status}` };
    }

    if (!request.hospitalId || !request.hospitalId.location || !request.hospitalId.location.coordinates) {
      console.error(`Hospital data missing or invalid for request ${requestId}`);
      return { success: false, message: 'Hospital data missing' };
    }

    const countPending = request.matchedDonors.filter(m => m.response === 'pending').length;
    const countAccepted = request.matchedDonors.filter(m => m.response === 'accepted').length;

    // Determine how many additional donors to notify simultaneously
    // For requests > 1 unit, we notify multiple donors (up to unitsNeeded) simultaneously
    const unitsToFulfill = Math.max(1, request.unitsNeeded || 1);
    const neededDonorsCount = unitsToFulfill - countAccepted - countPending;

    if (neededDonorsCount <= 0) {
      return { success: true, message: 'Sufficient donors already notified or accepted' };
    }

    const attemptedDonorIds = request.matchedDonors.map(m => m.donorId);
    const compatibleGroups = getCompatibleBloodGroups(request.bloodGroup);
    const maxDistanceMeters = request.radiusKm * 1000;
    const hospitalCoords = request.hospitalId.location.coordinates;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const nearbyDonors = await User.find({
      _id: { $nin: attemptedDonorIds },
      role: 'donor',
      bloodGroup: { $in: compatibleGroups },
      isAvailable: true,
      $or: [
        { lastDonationDate: { $exists: false } },
        { lastDonationDate: null },
        { lastDonationDate: "" },
        { lastDonationDate: { $lte: ninetyDaysAgo } }
      ],
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: hospitalCoords
          },
          $maxDistance: maxDistanceMeters
        }
      }
    }).limit(neededDonorsCount);

    if (nearbyDonors.length === 0) {
      const maxRadius = 100;
      if (request.radiusKm < maxRadius) {
        const nextRadius = Math.min(request.radiusKm + 10, maxRadius);
        request.radiusKm = nextRadius;
        request.statusHistory.push({
          status: 'searching',
          note: `No available compatible donors in initial radius. Expanding search radius to ${nextRadius} km.`
        });
        await request.save();

        console.log(`Expanding search radius to ${nextRadius} km for request ${requestId}...`);

        notifyService.notifyHospital(request.hospitalId._id.toString(), {
          type: 'REQUEST_UPDATED',
          requestId: request._id,
          status: request.status,
          message: `Expanding search radius to ${nextRadius} km.`
        });

        return matchAndNotifyNextDonor(requestId);
      }

      console.log(`No more compatible donors found near hospital for request ${requestId}`);
      
      request.statusHistory.push({
        status: 'searching',
        note: `Matching engine: No compatible available donors found within ${maxRadius} km maximum range.`
      });
      await request.save();

      notifyService.notifyHospital(request.hospitalId._id.toString(), {
        type: 'REQUEST_UPDATED',
        requestId: request._id,
        status: request.status,
        message: 'No compatible donors found within maximum range.'
      });

      return { success: false, message: 'No more donors found' };
    }

    const newlyNotifiedNames = [];
    for (const nextDonor of nearbyDonors) {
      request.matchedDonors.push({
        donorId: nextDonor._id,
        notifiedAt: new Date(),
        response: 'pending',
        eligibility: 'pending'
      });
      newlyNotifiedNames.push(nextDonor.name);

      const notificationMsg = `Urgent: Blood request for ${request.bloodGroup} at ${request.hospitalId.name}. Units needed: ${request.unitsNeeded}`;
      const notification = await Notification.create({
        requestId: request._id,
        donorId: nextDonor._id,
        message: notificationMsg,
        status: 'sent'
      });

      notifyService.notifyDonor(nextDonor._id.toString(), {
        notificationId: notification._id,
        requestId: request._id,
        hospitalName: request.hospitalId.name,
        hospitalCoords: hospitalCoords,
        bloodGroup: request.bloodGroup,
        unitsNeeded: request.unitsNeeded,
        urgency: request.urgency,
        message: notificationMsg
      });

      // 45s timeout per notified donor
      setTimeout(async () => {
        try {
          const freshRequest = await BloodRequest.findById(requestId);
          if (!freshRequest) return;

          const donorEntry = freshRequest.matchedDonors.find(
            d => d.donorId.toString() === nextDonor._id.toString()
          );

          if (donorEntry && donorEntry.response === 'pending' && freshRequest.status === 'searching') {
            donorEntry.response = 'rejected';
            freshRequest.statusHistory.push({
              status: 'searching',
              note: `Donor ${nextDonor.name} timed out. Resuming search for remaining units.`
            });
            await freshRequest.save();

            console.log(`Donor ${nextDonor.name} timed out for request ${requestId}. Attempting next donor...`);
            
            notifyService.notifyHospital(freshRequest.hospitalId.toString(), {
              type: 'REQUEST_UPDATED',
              requestId: freshRequest._id,
              status: freshRequest.status
            });

            await matchAndNotifyNextDonor(requestId);
          }
        } catch (err) {
          console.error('Error in timeout job:', err);
        }
      }, 45000);
    }

    request.statusHistory.push({
      status: 'searching',
      note: `Notified ${nearbyDonors.length} donor(s) (${newlyNotifiedNames.join(', ')}) simultaneously for ${request.unitsNeeded} unit(s) requirement.`
    });

    await request.save();

    notifyService.notifyHospital(request.hospitalId._id.toString(), {
      type: 'REQUEST_UPDATED',
      requestId: request._id,
      status: request.status,
      message: `Notified ${nearbyDonors.length} donor(s) simultaneously.`
    });

    return { success: true, countNotified: nearbyDonors.length, donors: nearbyDonors };
  } catch (error) {
    console.error('Matching service error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  matchAndNotifyNextDonor
};
