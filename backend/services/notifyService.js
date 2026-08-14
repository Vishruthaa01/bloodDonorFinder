let io;
const donorSockets = new Map();
const hospitalSockets = new Map();

const init = (socketIoInstance) => {
  io = socketIoInstance;

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('register', (data) => {
      const { userId, role } = data;
      if (!userId || !role) return;

      socket.userId = userId;
      socket.role = role;

      const cleanRole = role.toLowerCase();
      if (cleanRole === 'donor') {
        donorSockets.set(userId, socket.id);
        console.log(`Donor ${userId} registered to socket ${socket.id}`);
      } else if (cleanRole === 'hospital') {
        hospitalSockets.set(userId, socket.id);
        console.log(`Hospital ${userId} registered to socket ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId && socket.role) {
        const cleanRole = socket.role.toLowerCase();
        if (cleanRole === 'donor') {
          donorSockets.delete(socket.userId);
        } else if (cleanRole === 'hospital') {
          hospitalSockets.delete(socket.userId);
        }
      }
    });
  });
};

const notifyDonor = (donorId, payload) => {
  const socketId = donorSockets.get(donorId);
  if (socketId && io) {
    io.to(socketId).emit('new_blood_request', payload);
    console.log(`Emitted new_blood_request to donor ${donorId}`);
    return true;
  }
  return false;
};

const notifyHospital = (hospitalId, payload) => {
  const socketId = hospitalSockets.get(hospitalId);
  if (socketId && io) {
    io.to(socketId).emit('request_updated', payload);
    console.log(`Emitted request_updated to hospital ${hospitalId}`);
    return true;
  }
  return false;
};

module.exports = {
  init,
  notifyDonor,
  notifyHospital
};
