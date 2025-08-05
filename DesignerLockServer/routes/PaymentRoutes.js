const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/checkpayment',authenticateToken, paymentController.checkPaymentStatus);
router.post('/pay',authenticateToken, paymentController.payForProduct);

module.exports = router;
