export const isSessionOwner = (session, userId) => {
  if (!session || userId == null) return false;
  const submitterId = session.submitter_id ?? session.submitterId;
  if (submitterId == null) return session.isOwner === true;
  return Number(submitterId) === Number(userId);
};
