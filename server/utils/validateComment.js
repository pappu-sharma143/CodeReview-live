const MAX_BODY_LENGTH = 2000;

const validateComment = ({ lineNumber, body }) => {
  if (typeof body !== 'string' || body.trim().length === 0) {
    return { error: 'Comment body is required' };
  }
  if (body.length > MAX_BODY_LENGTH) {
    return { error: `Comment body must be at most ${MAX_BODY_LENGTH} characters` };
  }
  const line = Number(lineNumber);
  if (!Number.isInteger(line) || line < 1) {
    return { error: 'lineNumber must be a positive integer' };
  }
  return { lineNumber: line, body };
};

module.exports = { validateComment, MAX_BODY_LENGTH };
