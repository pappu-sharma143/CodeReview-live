const isSessionOwner = (submitterId, userId) => {
  if (submitterId == null || userId == null) return false;
  return Number(submitterId) === Number(userId);
};

module.exports = { isSessionOwner };
