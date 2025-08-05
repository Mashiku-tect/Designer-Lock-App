const db = require('../config/db');
const Product = require('../models/Product');

exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Search query required' });

    const results = await Product.findAll({
      where: {
        product_id: {
          [db.Sequelize.Op.like]: `%${query}%`
        }
      }
    });

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
