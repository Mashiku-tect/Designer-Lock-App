// models/Payment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  payment_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.STRING, allowNull: false },
  amountpaid: { type: DataTypes.INTEGER, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;
