import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { notificationService } from './notification.controller.js';

/**
 * Stock In - Increase product quantity
 * @route POST /api/manager/stockIn
 * @access Manager
 */
export const stockIn = async (req, res) => {
  try {
    const { productId, quantity, reference } = req.body;
    
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and positive quantity are required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const previousStock = product.stock;
    const newStock = previousStock + quantity;

    // Update product stock
    product.stock = newStock;
    await product.save();

    // Create transaction record
    const transaction = await Transaction.create({
      product: productId,
      type: 'in',
      quantity,
      reference: reference || `STOCK-IN-${Date.now()}`,
      performedBy: req.user.userId,
      previousStock,
      newStock,
      status: 'completed'
    });

    // Send notification to clerks about successful restock
    const clerks = await User.find({ role: 'clerk' });
    await Promise.all(
      clerks.map(clerk =>
        notificationService.sendNotification(
          clerk._id,
          `${product.name} restocked successfully. New stock: ${newStock} units (${quantity} added). SKU: ${product.sku}`,
          'restock',
          req.user.userId,
          productId,
          {
            productName: product.name,
            sku: product.sku,
            previousStock,
            newStock,
            quantityAdded: quantity
          }
        )
      )
    );

    res.status(200).json({
      success: true,
      message: 'Stock added successfully',
      data: {
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku,
          previousStock,
          newStock
        },
        transaction: transaction._id,
        reference: transaction.reference
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add stock'
    });
  }
};

/**
 * Stock Out - Decrease product quantity
 * @route POST /api/manager/stockOut
 * @access Manager
 */
export const stockOut = async (req, res) => {
  try {
    const { productId, quantity, reference } = req.body;
    
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and positive quantity are required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const previousStock = product.stock;

    // Validate if sufficient stock is available
    if (previousStock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Available: ${previousStock}, Requested: ${quantity}`,
        data: {
          available: previousStock,
          requested: quantity
        }
      });
    }

    const newStock = previousStock - quantity;

    // Update product stock
    product.stock = newStock;
    await product.save();

    // Create transaction record
    const transaction = await Transaction.create({
      product: productId,
      type: 'out',
      quantity,
      reference: reference || `STOCK-OUT-${Date.now()}`,
      performedBy: req.user.userId,
      previousStock,
      newStock,
      status: 'completed'
    });

    res.status(200).json({
      success: true,
      message: 'Stock removed successfully',
      data: {
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku,
          previousStock,
          newStock
        },
        transaction: transaction._id,
        reference: transaction.reference
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove stock'
    });
  }
};

/**
 * Validate Stock Levels - Check for low stock issues
 * @route GET /api/manager/validateStock
 * @access Manager
 */
export const validateStockLevel = async (req, res) => {
  try {
    const products = await Product.find({});
    
    const issues = [];
    const summary = {
      totalProducts: products.length,
      lowStock: 0,
      outOfStock: 0,
      healthy: 0
    };

    products.forEach(product => {
      if (product.stock === 0) {
        summary.outOfStock++;
        issues.push({
          productId: product._id,
          name: product.name,
          sku: product.sku,
          issue: 'out-of-stock',
          currentStock: product.stock,
          threshold: product.lowStockThreshold
        });
      } else if (product.stock <= product.lowStockThreshold) {
        summary.lowStock++;
        issues.push({
          productId: product._id,
          name: product.name,
          sku: product.sku,
          issue: 'low-stock',
          currentStock: product.stock,
          threshold: product.lowStockThreshold
        });
      } else {
        summary.healthy++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        summary,
        issues,
        hasIssues: issues.length > 0,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate stock levels'
    });
  }
};

/**
 * Generate Report - Generate inventory report
 * @route GET /api/manager/generateReport
 * @access Manager
 */
export const generateReport = async (req, res) => {
  try {
    const { type = 'inventory' } = req.query;
    
    let reportData = {};

    switch (type) {
      case 'inventory':
        const products = await Product.find({}).sort({ name: 1 });
        const transactions = await Transaction.find({})
          .populate('product', 'name sku')
          .populate('performedBy', 'fullName email')
          .sort({ createdAt: -1 })
          .limit(100);

        reportData = {
          type: 'inventory',
          generatedAt: new Date(),
          summary: {
            totalProducts: products.length,
            totalStock: products.reduce((sum, p) => sum + p.stock, 0),
            inStock: products.filter(p => p.stock > 0).length,
            outOfStock: products.filter(p => p.stock === 0).length,
            lowStock: products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length
          },
          products: products.map(p => ({
            id: p._id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            stock: p.stock,
            price: p.price,
            status: p.status,
            lowStockThreshold: p.lowStockThreshold
          })),
          recentTransactions: transactions.map(t => ({
            id: t._id,
            product: t.product.name,
            sku: t.product.sku,
            type: t.type,
            quantity: t.quantity,
            date: t.createdAt,
            reference: t.reference,
            performedBy: t.performedBy.fullName,
            previousStock: t.previousStock,
            newStock: t.newStock
          }))
        };
        break;

      case 'transactions':
        const allTransactions = await Transaction.find({})
          .populate('product', 'name sku category')
          .populate('performedBy', 'fullName email role')
          .sort({ createdAt: -1 });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayTransactions = allTransactions.filter(t => t.createdAt >= today);
        
        reportData = {
          type: 'transactions',
          generatedAt: new Date(),
          summary: {
            totalTransactions: allTransactions.length,
            todayTransactions: todayTransactions.length,
            stockIn: allTransactions.filter(t => t.type === 'in').length,
            stockOut: allTransactions.filter(t => t.type === 'out').length,
            totalQuantityIn: allTransactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0),
            totalQuantityOut: allTransactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0)
          },
          transactions: allTransactions.map(t => ({
            id: t._id,
            product: t.product.name,
            productId: t.product._id,
            sku: t.product.sku,
            category: t.product.category,
            type: t.type,
            quantity: t.quantity,
            date: t.createdAt,
            reference: t.reference,
            performedBy: t.performedBy.fullName,
            performedByEmail: t.performedBy.email,
            role: t.performedBy.role,
            previousStock: t.previousStock,
            newStock: t.newStock,
            status: t.status
          }))
        };
        break;

      case 'lowStock':
        // Fetch all products and filter in JavaScript since we need to compare
        // stock against each product's own lowStockThreshold
        const allProductsForReport = await Product.find({}).sort({ stock: 1 });
        
        // Filter products that are out of stock or below their threshold
        const lowStockProducts = allProductsForReport.filter(p => 
          p.stock <= p.lowStockThreshold
        );

        reportData = {
          type: 'lowStock',
          generatedAt: new Date(),
          summary: {
            totalLowStockItems: lowStockProducts.length,
            criticalItems: lowStockProducts.filter(p => p.stock === 0).length,
            warningItems: lowStockProducts.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length
          },
          products: lowStockProducts.map(p => ({
            id: p._id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            stock: p.stock,
            lowStockThreshold: p.lowStockThreshold,
            status: p.status,
            needsAttention: p.stock <= p.lowStockThreshold
          }))
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid report type. Use: inventory, transactions, or lowStock'
        });
    }

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate report'
    });
  }
};

/**
 * Get Transaction History
 * @route GET /api/manager/transactions
 * @access Manager
 */
export const getTransactions = async (req, res) => {
  try {
    const { limit = 50, page = 1, type, productId } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (productId) query.product = productId;

    const transactions = await Transaction.find(query)
      .populate('product', 'name sku category')
      .populate('performedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transactions'
    });
  }
};

