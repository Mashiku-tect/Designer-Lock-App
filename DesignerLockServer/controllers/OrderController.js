const Product  = require('../models/Product');
const slugify = require('slugify'); // install this package with `npm install slugify`

// Helper to generate a unique productId
async function generateUniqueProductId(clientName, designTitle) {
  const baseId = `${clientName.trim().toLowerCase().replace(/\s+/g, '_')}_${designTitle.trim().toLowerCase().replace(/\s+/g, '_')}`;
  let product_id = baseId;
  let suffix = 1;

  while (await Product.findOne({ where: { product_id } })) {
    product_id = `${baseId}${suffix}`;
    suffix++;
  }

  return product_id;
}

//end of function
// Controller function to create a new order

exports.createOrder = async (req, res) => {
  const {
      designtitle,
      clientname,
      clientphonenumber,
      price,
      additionalnotes
    } = req.body;

  try {
    if (!clientname) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    const product_id = await generateUniqueProductId(clientname,designtitle);
    const productiPath = req.files.map((file) => file.path); // array of paths

    const newProduct = await Product.create({

     productname: designtitle,
      clientname,
      clientphonenumber,
      price,
      additionalnotes,
      user_id: req.user.id, // make sure auth middleware sets this
      product_id,
      designtitle,
      productimagepath:productiPath.join(',') // join paths into a string
      
    });

    return res.status(201).json({
      message: `Product created successfully with ID: ${product_id}`,
      productId: product_id,
    });

  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

//handle delete of some orders
// exports.deleteOrder = async (req, res) => {
//   const { product_id } = req.params;

//   try {
//     const product = await Product.findOne({ where: { product_id } });

//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     // Check if the user is authorized to delete this product
//     if (product.user_id !== req.user.id) {
//       return res.status(403).json({ message: 'Unauthorized to delete this product' });
//     }

//     await Product.destroy({ where: { product_id } });

//     return res.status(200).json({ message: 'Product deleted successfully' });
//   } catch (error) {
//     console.error('Delete product error:', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };


// DELETE /api/orders/:productId
exports.deleteOrder = async (req, res) => {
  const user_id = req.user.id;
  const { productId } = req.params;

  try {
    const deleted = await Product.destroy({
      where: { product_id: productId, user_id }
    });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Order not found or unauthorized' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};
//end of delete order function
