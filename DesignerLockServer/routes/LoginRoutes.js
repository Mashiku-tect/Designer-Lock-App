// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/LoginController');

// POST /api/login
router.post('/login', authController.login);

module.exports = router;
