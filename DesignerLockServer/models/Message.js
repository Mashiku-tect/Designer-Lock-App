// models/Message.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sender_id: { type: DataTypes.INTEGER, allowNull: false },
  receiver_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: 'messages',
  timestamps: true
});

module.exports = Message;
