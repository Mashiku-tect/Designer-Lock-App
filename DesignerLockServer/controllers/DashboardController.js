const db = require('../config/db');
const Order = require('../models/Product'); // Assuming Order is a model for orders
const User = require('../models/User');

exports.getDashboardData = async (req, res) => {
  try {
    //const userId = req.user.id;
    const user_id = req.user.id;
     //console.log('User ID:', user_id); // debug // Assuming user ID is stored in req.user after authentication


    const user = await User.findByPk(user_id);

    // Get active orders (e.g., not completed)
    const activeOrders = await Order.count({
      where: { user_id, status: 'In Progress' }
    });

    // Calculate this month’s revenue
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyOrders = await Order.findAll({
      where: {
        user_id,
        status: 'Completed',
        createdAt: { [db.Sequelize.Op.gte]: startOfMonth }
      }
    });
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + parseFloat(order.price || 0), 0);

    // Get recent orders (latest 5)
    const recentOrders = await Order.findAll({
      where: { user_id },
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
   
    

    res.json({
      name: user.firstname,
      activeOrders:activeOrders,
      monthlyRevenue:monthlyRevenue,
      orders: recentOrders,
      haseverloggedin: user.haseverloggedin
    });

     //check user if has ever logged in before
    if(user.haseverloggedin === 0) {
      await User.update({ haseverloggedin: 1 }, { where: { user_id: user.user_id } });
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
