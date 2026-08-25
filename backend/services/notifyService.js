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

      const uid = userId.toString();
      socket.userId = uid;
      socket.role = role;

      const cleanRole = role.toLowerCase();
      if (cleanRole === 'donor') {
        donorSockets.set(uid, socket.id);
        console.log(`Donor ${uid} registered to socket ${socket.id}`);
      } else if (cleanRole === 'hospital') {
        hospitalSockets.set(uid, socket.id);
        console.log(`Hospital ${uid} registered to socket ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId && socket.role) {
        const uid = socket.userId.toString();
        const cleanRole = socket.role.toLowerCase();
        if (cleanRole === 'donor') {
          if (donorSockets.get(uid) === socket.id) {
            donorSockets.delete(uid);
            console.log(`Donor ${uid} unregistered from socket ${socket.id}`);
          }
        } else if (cleanRole === 'hospital') {
          if (hospitalSockets.get(uid) === socket.id) {
            hospitalSockets.delete(uid);
            console.log(`Hospital ${uid} unregistered from socket ${socket.id}`);
          }
        }
      }
    });
  });
};

const notifyDonor = (donorId, payload) => {
  if (!donorId) return false;
  const targetId = donorId.toString();
  const socketId = donorSockets.get(targetId);
  if (socketId && io) {
    io.to(socketId).emit('new_blood_request', payload);
    console.log(`Emitted new_blood_request to donor ${targetId}`);
    return true;
  }
  return false;
};

const notifyHospital = (hospitalId, payload) => {
  if (!hospitalId) return false;
  const targetId = hospitalId.toString();
  const socketId = hospitalSockets.get(targetId);
  if (socketId && io) {
    io.to(socketId).emit('request_updated', payload);
    console.log(`Emitted request_updated to hospital ${targetId}`);
    return true;
  }
  return false;
};

module.exports = {
  init,
  notifyDonor,
  notifyHospital
};
