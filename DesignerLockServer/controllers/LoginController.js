// controllers/authController.js

const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJpYXQiOjE2MzAwMDAwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Store in .env in production

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email or phone
    const user = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ email }, { phonenumber: email }],
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or phone number' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.user_id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phonenumber: user.phonenumber,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
