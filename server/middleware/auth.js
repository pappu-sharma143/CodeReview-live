const jwt = require('jsonwebtoken');

const extractBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

const authMiddleware = (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
module.exports.extractBearerToken = extractBearerToken;
