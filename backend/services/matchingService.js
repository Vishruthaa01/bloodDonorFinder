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

    const attemptedDonorIds = request.matchedDonors.map(m => m.donorId);
    const compatibleGroups = getCompatibleBloodGroups(request.bloodGroup);
    const maxDistanceMeters = request.radiusKm * 1000;
    const hospitalCoords = request.hospitalId.location.coordinates;

    const nearbyDonors = await User.find({
      _id: { $nin: attemptedDonorIds },
      bloodGroup: { $in: compatibleGroups },
      isAvailable: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: hospitalCoords
          },
          $maxDistance: maxDistanceMeters
        }
      }
    }).limit(1);

    if (nearbyDonors.length === 0) {
      console.log(`No more compatible donors found near hospital for request ${requestId}`);
      return { success: false, message: 'No more donors found' };
    }

    const nextDonor = nearbyDonors[0];

    request.matchedDonors.push({
      donorId: nextDonor._id,
      notifiedAt: new Date(),
      response: 'pending',
      eligibility: 'pending'
    });

    await request.save();

    const notificationMsg = `Urgent: Blood request for ${request.bloodGroup} at ${request.hospitalId.name}. Units: ${request.unitsNeeded}`;
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
      bloodGroup: request.bloodGroup,
      unitsNeeded: request.unitsNeeded,
      urgency: request.urgency,
      message: notificationMsg
    });

    // Timeout: 3 minutes (180000ms) to auto-reject if donor doesn't respond
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
            note: `Donor ${nextDonor.name} timed out. Resuming search.`
          });
          await freshRequest.save();

          console.log(`Donor ${nextDonor.name} timed out. Attempting next donor...`);
          
          // Notify hospital about update
          notifyService.notifyHospital(freshRequest.hospitalId.toString(), {
            type: 'REQUEST_UPDATED',
            requestId: freshRequest._id,
            status: freshRequest.status
          });

          // Match next
          await matchAndNotifyNextDonor(requestId);
        }
      } catch (err) {
        console.error('Error in timeout job:', err);
      }
    }, 180000);

    return { success: true, donor: nextDonor };
  } catch (error) {
    console.error('Matching service error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  matchAndNotifyNextDonor
};
