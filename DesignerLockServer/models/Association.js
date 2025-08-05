// models/index.js
const User = require('./User');
const Product = require('./Product');
const Payment = require('./Payment');
const Message = require('./Message');

// Associations
User.hasMany(Product, { foreignKey: 'user_id' });
Product.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Payment, { foreignKey: 'user_id' });
Product.hasMany(Payment, { foreignKey: 'product_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });
Payment.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = {
  User,
  Product,
  Payment,
  Message
};
