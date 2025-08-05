const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const orderController = require('../controllers/OrderController');

router.post(
  '/orders',
  verifyToken,
  upload.array('files', 10),
  orderController.createOrder
);
//route to delete an order
router.delete('/orders/:productId', verifyToken, orderController.deleteOrder);
//router.delete('/orders/:productId', authenticateToken, deleteOrder);

module.exports = router;
