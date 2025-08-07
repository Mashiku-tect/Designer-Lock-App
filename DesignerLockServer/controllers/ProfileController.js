// controllers/profileController.js
const db = require("../config/db");
const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [ 'firstname', 'lastname', 'email', 'phonenumber', 'bio', 'x', 'instagram',  'website', 'profileimage','posts']
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log('getProfile user:', user);
    // Return user data without password    

    
    res.json({ user });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const payload = { ...req.body };

    await User.update(payload, { where: { id: req.user.id } });
    const updated = await User.findByPk(req.user.id, {
      attributes: ['firstname', 'lastname', 'email', 'phone', 'bio', 'twitter', 'whatsapp', 'instagram', 'location', 'website', 'profileImage']
    });

    res.json({ user: updated });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

//handle profile image upload
// controllers/profileController.js

exports.uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    // Update user's profileImage
    await User.update({ profileImage: imagePath }, { where: { id: userId } });

    res.json({ message: 'Profile image updated', profileImage: imagePath });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ error: 'Server error uploading image' });
  }
};
