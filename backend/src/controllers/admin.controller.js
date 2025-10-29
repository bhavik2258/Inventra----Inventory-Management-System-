import Product from '../models/Product.js';
import User from '../models/User.js';

// System stats for admin dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockItems = await Product.countDocuments({ 
      status: { $in: ['low-stock', 'out-of-stock'] } 
    });
    const activeUsers = await User.countDocuments();
    
    // Calculate total inventory value
    const products = await Product.find();
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.stock * product.price);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        lowStockItems,
        activeUsers,
        totalValue: Math.round(totalValue * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard stats'
    });
  }
};

// Update user role (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'clerk', 'auditor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    // Prevent changing own role
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot change your own role'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User role updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user role'
    });
  }
};

