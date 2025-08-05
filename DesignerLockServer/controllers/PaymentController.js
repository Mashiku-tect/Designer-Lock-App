//const { User, Product, Payment } = require('../models');
const db = require('../config/db');
const User = require('../models/User');
const Payment = require('../models/Payment'); // Assuming Payment is a model for payments  
const Product = require('../models/Product'); // Assuming Product is a model for products      
const jwt = require('jsonwebtoken');

exports.checkPaymentStatus = async (req, res) => {
  try {
    const user_id = req.user.id;
    const product_id = req.body.productId;

   // console.log('Checking payment status for user:', user_id, 'and product:', product_id);
     const product = await Product.findByPk(product_id);
     if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    //Allow The Owner To Access The Product
    if (product.user_id === user_id) {
        return res.json({ hasPaid: true });
        }

    const hasPaid = await Payment.findOne({
      where: { user_id, product_id },
    });

    res.json({ hasPaid: !!hasPaid });
  } catch (error) {
    console.error('Check payment error:', error);
    res.status(500).json({ error: 'Server error checking payment status' });
  }
};


exports.payForProduct = async (req, res) => {
  try {
    // Assuming req.user is set by the authenticateToken middleware
    const user_id = req.user.id;
    const  amount  = req.body.amount;
    const product_id = req.body.productId;
    //console.log("Product ID:", product_id);
    const product = await Product.findByPk(product_id);
   // console.log('Processing payment for user:', user_id, 'product:', product_id, 'amount:', amount);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Optional: match amount
    if (parseFloat(product.price) !== parseFloat(amount)) {
      return res.status(400).json({ error: 'Incorrect amount' });
    }

    const alreadyPaid = await Payment.findOne({ where: { user_id, product_id } });
    if (alreadyPaid) {
      return res.status(400).json({ error: 'Already paid for this product' });
    }

    await Payment.create({ user_id, product_id, amountpaid:amount });

    res.json({ success: true });

    //Mark the product as completed if the user(customer) has paid
    if (product.user_id === user_id) {
  // Mark as completed
  await Product.update(
    { status: 'Completed' },
    {
      where: {
        product_id: product_id,
        user_id: user_id
      }
    }
  );

  return res.json({ hasPaid: true });
}

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment failed' });
  }
};
