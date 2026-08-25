const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { matchAndNotifyNextDonor } = require('../services/matchingService');
const notifyService = require('../services/notifyService');

exports.createRequest = async (req, res) => {
  try {
    if (req.userRole !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can create blood requests' });
    }

    const { bloodGroup, unitsNeeded, urgency, radiusKm } = req.body;

    const bloodRequest = await BloodRequest.create({
      hospitalId: req.user._id,
      bloodGroup,
      unitsNeeded: parseInt(unitsNeeded),
      urgency,
      radiusKm: parseFloat(radiusKm || 10),
      status: 'searching',
      statusHistory: [{ status: 'searching', note: 'Blood request raised by hospital.' }]
    });

    res.status(201).json(bloodRequest);

    // Run geospatial matching in the background to notify the first donor
    console.log(`Starting matching for request: ${bloodRequest._id}`);
    matchAndNotifyNextDonor(bloodRequest._id);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating request' });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('hospitalId', '-passwordHash')
      .populate('acceptedDonorId', '-passwordHash')
      .populate('matchedDonors.donorId', '-passwordHash');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching request' });
  }
};

exports.getHospitalRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ hospitalId: req.params.hospitalId })
      .populate('acceptedDonorId', '-passwordHash')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching hospital requests' });
  }
};

exports.getDonorRequests = async (req, res) => {
  try {
    const donorId = req.params.donorId;
    const requests = await BloodRequest.find({
      $or: [
        { 'matchedDonors.donorId': donorId },
        { acceptedDonorId: donorId }
      ]
    })
      .populate('hospitalId', '-passwordHash')
      .sort({ createdAt: -1 });

    const formatted = requests.map(req => {
      const match = req.matchedDonors.find(m => m && m.donorId && (m.donorId._id || m.donorId).toString() === donorId.toString());
      const isAcceptedDonor = req.acceptedDonorId && (req.acceptedDonorId._id || req.acceptedDonorId).toString() === donorId.toString();
      return {
        _id: req._id,
        hospital: req.hospitalId,
        bloodGroup: req.bloodGroup,
        unitsNeeded: req.unitsNeeded,
        urgency: req.urgency,
        status: req.status,
        acceptedDonorId: req.acceptedDonorId,
        response: match ? match.response : (isAcceptedDonor ? 'accepted' : 'pending'),
        eligibility: match ? match.eligibility : (isAcceptedDonor ? 'eligible' : 'pending'),
        notifiedAt: match ? match.notifiedAt : req.createdAt,
        createdAt: req.createdAt
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching donor requests' });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    if (req.userRole !== 'donor') {
      return res.status(403).json({ message: 'Only donors can respond to requests' });
    }

    const { response } = req.body; // 'accepted' or 'rejected'
    if (!['accepted', 'rejected'].includes(response)) {
      return res.status(400).json({ message: 'Invalid response action' });
    }

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const donorMatch = request.matchedDonors.find(
      m => m && m.donorId && m.donorId.toString() === req.user._id.toString()
    );

    if (!donorMatch) {
      return res.status(400).json({ message: 'Donor not matched for this request' });
    }

    if (donorMatch.response !== 'pending') {
      return res.status(400).json({ message: 'Already responded to this request' });
    }

    donorMatch.response = response;

    if (response === 'accepted') {
      if (req.user.lastDonationDate) {
        const lastDonation = new Date(req.user.lastDonationDate);
        const today = new Date();
        const diffTime = Math.abs(today - lastDonation);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 90) {
          const daysRemaining = 90 - diffDays;
          return res.status(400).json({ 
            message: `You are not eligible to donate yet. Please wait another ${daysRemaining} day(s) to complete the 90-day recovery period.` 
          });
        }
      }

      request.status = 'donor_found';
      request.acceptedDonorId = req.user._id;
      request.statusHistory.push({
        status: 'donor_found',
        note: `Request accepted by donor ${req.user.name}`
      });

      // Update notification status to responded
      await Notification.updateOne(
        { requestId: request._id, donorId: req.user._id },
        { status: 'responded' }
      );
    } else {
      request.statusHistory.push({
        status: 'searching',
        note: `Request rejected by donor ${req.user.name}. Resuming search.`
      });

      await Notification.updateOne(
        { requestId: request._id, donorId: req.user._id },
        { status: 'responded' }
      );
    }

    await request.save();

    // Emit live WebSocket event to Hospital
    notifyService.notifyHospital(request.hospitalId.toString(), {
      type: 'REQUEST_UPDATED',
      requestId: request._id,
      status: request.status,
      message: `Donor ${req.user.name} has ${response} the request.`
    });

    res.json({ message: `Successfully ${response} the request`, status: request.status });

    // If rejected, trigger search for the next donor
    if (response === 'rejected') {
      matchAndNotifyNextDonor(request._id);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error responding to request' });
  }
};

exports.checkEligibility = async (req, res) => {
  try {
    if (req.userRole !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can check eligibility' });
    }

    const { eligibility } = req.body; // 'eligible' or 'not_eligible'
    if (!['eligible', 'not_eligible'].includes(eligibility)) {
      return res.status(400).json({ message: 'Invalid eligibility status' });
    }

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const donorMatch = request.matchedDonors.find(
      m => m && m.donorId && request.acceptedDonorId && m.donorId.toString() === request.acceptedDonorId.toString()
    );

    if (donorMatch) {
      donorMatch.eligibility = eligibility;
    }

    if (eligibility === 'eligible') {
      request.status = 'confirmed';
      request.statusHistory.push({
        status: 'confirmed',
        note: 'Donor marked eligible after screening.'
      });
    } else {
      // Release this donor and search for another
      const previousDonorId = request.acceptedDonorId;
      request.status = 'searching';
      request.acceptedDonorId = null;
      request.statusHistory.push({
        status: 'searching',
        note: 'Donor marked not eligible. Resuming search.'
      });

      // Notify the released donor
      notifyService.notifyDonor(previousDonorId.toString(), {
        type: 'ELIGIBILITY_FAILED',
        requestId: request._id,
        message: 'You have been marked not eligible for this donation request.'
      });
    }

    await request.save();

    notifyService.notifyHospital(request.hospitalId.toString(), {
      type: 'REQUEST_UPDATED',
      requestId: request._id,
      status: request.status
    });

    res.json({ message: `Eligibility marked: ${eligibility}`, status: request.status });

    // If marked not eligible, match the next donor
    if (eligibility === 'not_eligible') {
      matchAndNotifyNextDonor(request._id);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating eligibility' });
  }
};

exports.confirmContact = async (req, res) => {
  try {
    if (req.userRole !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can contact donors' });
    }

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'in_progress';
    request.statusHistory.push({
      status: 'in_progress',
      note: 'Hospital has contacted the donor and coordinated ETA.'
    });

    await request.save();

    // Notify donor about progress
    if (request.acceptedDonorId) {
      notifyService.notifyDonor(request.acceptedDonorId.toString(), {
        type: 'CONTACT_CONFIRMED',
        requestId: request._id,
        message: 'Hospital has confirmed contact. Please coordinate your arrival.'
      });
    }

    res.json({ message: 'Contact confirmed, donation in progress', status: request.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error confirming contact' });
  }
};

exports.completeRequest = async (req, res) => {
  try {
    if (req.userRole !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can complete requests' });
    }

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'completed';
    request.statusHistory.push({
      status: 'completed',
      note: 'Blood donation completed successfully.'
    });

    await request.save();

    // Update donor's history and last donation date
    if (request.acceptedDonorId) {
      await User.findByIdAndUpdate(request.acceptedDonorId, {
        lastDonationDate: new Date(),
        // optional: set temporarily unavailable or let them toggle
      });

      notifyService.notifyDonor(request.acceptedDonorId.toString(), {
        type: 'DONATION_COMPLETED',
        requestId: request._id,
        message: 'Thank you for your life-saving blood donation!'
      });
    }

    res.json({ message: 'Request completed', status: request.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error completing request' });
  }
};

exports.closeRequest = async (req, res) => {
  try {
    if (req.userRole !== 'hospital') {
      return res.status(403).json({ message: 'Only hospitals can close requests' });
    }

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'closed';
    request.closedAt = new Date();
    request.statusHistory.push({
      status: 'closed',
      note: 'Request closed.'
    });

    await request.save();

    res.json({ message: 'Request closed', status: request.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error closing request' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ donorId: req.params.donorId })
      .populate({
        path: 'requestId',
        populate: { path: 'hospitalId', select: 'name address phone' }
      })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};
