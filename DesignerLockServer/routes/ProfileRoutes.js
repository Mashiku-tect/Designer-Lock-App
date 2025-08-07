// routes/profile.js

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile,uploadProfileImage } = require('../controllers/ProfileController');
const authenticateToken = require('../middleware/authMiddleware');
const upload = require('../middleware/ProfileImageMiddleware');

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/updateprofile', authenticateToken, updateProfile);
router.put('/profile/image', authenticateToken, upload.single('image'), uploadProfileImage);

module.exports = router;
