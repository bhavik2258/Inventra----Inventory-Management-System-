import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { notificationService } from './notification.controller.js';

/**
 * Class representing the Clerk functionality for monitoring stock and processing orders
 */
class Clerk {
  /**
   * Check if a product has low stock
   * @param {Object} product - Product object
   * @returns {boolean} - True if stock is below reorder level
   */
  checkLowStock(product) {
    return product.stock <= product.lowStockThreshold;
  }
}

const clerkInstance = new Clerk();

/**
 * Get all low stock products
 * @route GET /api/clerk/lowStock
 * @access Clerk
 */
export const getLowStockProducts = async (req, res) => {
  try {
    // Fetch all products
    const allProducts = await Product.find({});
    
    // Filter products using the checkLowStock method
    const lowStockProducts = allProducts
      .filter(product => clerkInstance.checkLowStock(product))
      .map(product => ({
        id: product._id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        reorderLevel: product.lowStockThreshold, // Alias for consistency
        category: product.category,
        status: product.status,
        price: product.price,
        description: product.description
      }));

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch low stock products'
    });
  }
};

/**
 * Get all pending orders (transactions with pending status)
 * @route GET /api/clerk/orders
 * @access Clerk
 */
export const getPendingOrders = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    // Fetch transactions with specified status
    const transactions = await Transaction.find({ status })
      .populate('product', 'name sku category price')
      .populate('performedBy', 'fullName email role')
      .sort({ createdAt: -1 });

    const formattedOrders = transactions.map((transaction, index) => ({
      id: transaction._id,
      orderNo: `ORD-${String(transaction._id).slice(-6).toUpperCase()}`,
      productId: transaction.product._id,
      productName: transaction.product.name,
      sku: transaction.product.sku,
      category: transaction.product.category,
      quantity: transaction.quantity,
      type: transaction.type,
      previousStock: transaction.previousStock,
      newStock: transaction.newStock,
      reference: transaction.reference || `REF-${Date.now()}-${index}`,
      status: transaction.status,
      customer: transaction.performedBy?.fullName || 'System',
      performedBy: {
        name: transaction.performedBy?.fullName || 'System',
        email: transaction.performedBy?.email,
        role: transaction.performedBy?.role
      },
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedOrders.length,
      data: formattedOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch orders'
    });
  }
};

/**
 * Update order status
 * @route PUT /api/clerk/orders/:id/status
 * @access Clerk
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: pending, completed, or rejected'
      });
    }

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('product', 'name sku category')
     .populate('performedBy', 'fullName email role');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        id: transaction._id,
        orderNo: `ORD-${String(transaction._id).slice(-6).toUpperCase()}`,
        productName: transaction.product.name,
        sku: transaction.product.sku,
        previousStatus: transaction.status === status ? 'unchanged' : 'updated',
        status: transaction.status,
        updatedAt: transaction.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order status'
    });
  }
};

/**
 * Request reorder for a product
 * @route POST /api/clerk/reorder
 * @access Clerk
 */
export const requestReorder = async (req, res) => {
  try {
    const { productId } = req.body;
    const clerkId = req.user?.userId;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Find all managers to notify them
    const managers = await User.find({ role: 'manager' });

    // Send notification to each manager
    const notifications = await Promise.all(
      managers.map(manager => 
        notificationService.sendNotification(
          manager._id,
          `Reorder request for ${product.name} (current stock: ${product.stock} units). SKU: ${product.sku}`,
          'reorder',
          clerkId,
          productId,
          {
            productName: product.name,
            sku: product.sku,
            currentStock: product.stock,
            reorderLevel: product.lowStockThreshold,
            category: product.category
          }
        )
      )
    );

    res.status(200).json({
      success: true,
      message: 'Reorder request sent successfully',
      data: {
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku,
          stock: product.stock,
          reorderLevel: product.lowStockThreshold
        },
        notificationsSent: notifications.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send reorder request'
    });
  }
};

/**
 * Get dashboard statistics
 * @route GET /api/clerk/stats
 * @access Clerk
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Get all products
    const allProducts = await Product.find({});
    
    // Get low stock products
    const lowStockProducts = allProducts.filter(product => 
      clerkInstance.checkLowStock(product)
    );

    // Get pending transactions
    const pendingTransactions = await Transaction.countDocuments({ 
      status: 'pending' 
    });

    res.status(200).json({
      success: true,
      data: {
        lowStockItems: lowStockProducts.length,
        pendingOrders: pendingTransactions,
        totalProducts: allProducts.length,
        outOfStock: allProducts.filter(p => p.stock === 0).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard statistics'
    });
  }
};

export default {
  checkLowStock: clerkInstance.checkLowStock.bind(clerkInstance)
};
