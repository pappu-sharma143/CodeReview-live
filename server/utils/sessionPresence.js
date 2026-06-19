let ioRef = null;

const setIo = (io) => {
  ioRef = io;
};

const isCreatorOnline = async (sessionId, creatorId) => {
  if (!ioRef || !creatorId) return false;

  const room = `session:${sessionId}`;
  const sockets = await ioRef.in(room).fetchSockets();
  return sockets.some((s) => s.user?.id === creatorId);
};

module.exports = { setIo, isCreatorOnline };
