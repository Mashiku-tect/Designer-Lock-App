// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  user_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  firstname: { type: DataTypes.STRING, allowNull: false },
  lastname: { type: DataTypes.STRING, allowNull: false },
  profileimage: DataTypes.STRING,
  phonenumber: DataTypes.STRING,
  website: { type: DataTypes.STRING, defaultValue: 'user.com' },
  instagram: { type: DataTypes.STRING, defaultValue: '@user' },
  x: { type: DataTypes.STRING, defaultValue: '@user' },
  bio: { type: DataTypes.STRING, defaultValue: 'Digital designer' },
  posts: { type: DataTypes.INTEGER, defaultValue: 0 },
  haseverloggedin: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'users',
  timestamps: false,
});

module.exports = User;
