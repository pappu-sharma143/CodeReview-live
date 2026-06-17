const editAccessBySession = new Map();
const pendingEditRequests = new Map();

const grantEditAccess = (sessionId, userId) => {
  if (!editAccessBySession.has(sessionId)) {
    editAccessBySession.set(sessionId, new Set());
  }
  editAccessBySession.get(sessionId).add(userId);
  pendingEditRequests.get(sessionId)?.delete(userId);
};

const revokeEditAccess = (sessionId, userId) => {
  editAccessBySession.get(sessionId)?.delete(userId);
  pendingEditRequests.get(sessionId)?.delete(userId);
};

const hasEditAccess = (sessionId, userId) =>
  editAccessBySession.get(sessionId)?.has(userId) ?? false;

const addPendingEditRequest = (sessionId, userId, username) => {
  if (!pendingEditRequests.has(sessionId)) {
    pendingEditRequests.set(sessionId, new Map());
  }
  pendingEditRequests.get(sessionId).set(userId, { username });
};

const getPendingEditRequests = (sessionId) => {
  const map = pendingEditRequests.get(sessionId);
  if (!map) return [];
  return [...map.entries()].map(([userId, data]) => ({
    userId,
    username: data.username,
  }));
};

const clearSessionPermissions = (sessionId) => {
  editAccessBySession.delete(sessionId);
  pendingEditRequests.delete(sessionId);
};

module.exports = {
  grantEditAccess,
  revokeEditAccess,
  hasEditAccess,
  addPendingEditRequest,
  getPendingEditRequests,
  clearSessionPermissions,
};
