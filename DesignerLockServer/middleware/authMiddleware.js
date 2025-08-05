const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; // Use the same secret as in login

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // ✅ this attaches the user info (id, email) to req.user
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

module.exports = authenticateToken;
