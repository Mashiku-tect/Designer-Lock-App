const express = require('express');
const app = express();
require('dotenv').config();
const sequelize = require('./config/db');
const User = require('./models/User');
const Product=require('./models/Product');
const Payment =require('./models/Payment');
const Message=require('./models/Message');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


//Routes
const authRoutes = require('./routes/RegisterRoutes');
const loginRoutes = require('./routes/LoginRoutes');
const dashboardRoutes = require('./routes/DashboardRoutes');
const searchRoutes = require('./routes/SearchRoutes');
const checkpayment= require('./routes/PaymentRoutes');
const orderRoutes = require('./routes/OrderRoutes');
const profileRoutes = require('./routes/ProfileRoutes');

app.use('/uploads', express.static('uploads'));

app.use('/api', orderRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', searchRoutes);
app.use('/api', loginRoutes);
app.use('/api', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', checkpayment);

// Test DB connection
sequelize.authenticate()
  .then(() => console.log('✅ MySQL connected...'))
  .catch(err => console.error('❌ DB connection error:', err));

// Sync models (optional: use only during development)
sequelize.sync() // or sequelize.sync({ force: true }) for resetting DB
  .then(() => console.log('✅ Models synced'))
  .catch(err => console.error('❌ Sync error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
