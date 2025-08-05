const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/dashboard', authenticateToken, DashboardController.getDashboardData);

module.exports = router;
