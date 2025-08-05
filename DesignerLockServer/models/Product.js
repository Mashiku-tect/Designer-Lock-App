// models/Product.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  product_id: { type: DataTypes.STRING, primaryKey: true },
  user_id: { type: DataTypes.INTEGER },
  productname: DataTypes.STRING,
  productimagepath: DataTypes.STRING,
  clientname: DataTypes.STRING,
  clientphonenumber: DataTypes.STRING,
  designtitle: DataTypes.STRING,
  price: DataTypes.INTEGER,
  additionalnotes: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: 'In Progress' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'products',
  timestamps: true
});

module.exports = Product;
