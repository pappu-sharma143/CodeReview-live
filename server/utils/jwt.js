const jwt = require('jsonwebtoken');

const TOKEN_EXPIRY = '7d';

const assertJwtSecret = () => {
  if (!process.env.JWT_SECRET?.trim()) {
    throw new Error('JWT_SECRET is not configured');
  }
};

const signUserToken = (user) => {
  assertJwtSecret();
  return jwt.sign(
    { userId: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

module.exports = { TOKEN_EXPIRY, signUserToken, assertJwtSecret };
