const USERNAME_MIN = 3;
const USERNAME_MAX = 50;
const EMAIL_MAX = 100;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^[a-zA-Z0-9]+$/;

const validateRegister = ({ username, email, password }) => {
  if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return { error: 'All fields required' };
  }

  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedUsername || !trimmedEmail || !password) {
    return { error: 'All fields required' };
  }

  if (trimmedUsername.length < USERNAME_MIN || trimmedUsername.length > USERNAME_MAX) {
    return { error: `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters` };
  }

  if (!USERNAME_RE.test(trimmedUsername)) {
    return { error: 'Username may only contain letters, numbers, underscores, and hyphens' };
  }

  if (trimmedEmail.length > EMAIL_MAX) {
    return { error: `Email must be at most ${EMAIL_MAX} characters` };
  }

  if (!EMAIL_RE.test(trimmedEmail)) {
    return { error: 'Invalid email address' };
  }

  if (password.length < PASSWORD_MIN) {
    return { error: `Password must be at least ${PASSWORD_MIN} characters` };
  }

  if (password.length > PASSWORD_MAX) {
    return { error: `Password must be at most ${PASSWORD_MAX} characters` };
  }

  if (!PASSWORD_RE.test(password)) {
    return { error: 'Password must contain only letters and numbers' };
  }

  return { username: trimmedUsername, email: trimmedEmail, password };
};

module.exports = {
  validateRegister,
  USERNAME_MIN,
  USERNAME_MAX,
  EMAIL_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
};
