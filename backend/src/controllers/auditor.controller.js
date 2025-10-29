import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import Audit from '../models/Audit.js';

/**
 * Class representing the Auditor functionality for auditing inventory and generating reports
 */
class Auditor {
  /**
   * Audit inventory and identify discrepancies
   * @param {Object} products - Array of products to audit
   * @returns {string} - Audit summary as string
   */
  auditInventory(products) {
    const discrepancies = [];
    
    products.forEach(product => {
      // Check for negative stock
      if (product.stock < 0) {
        discrepancies.push(`Product ${product.name} (${product.sku}) has negative stock: ${product.stock}`);
      }
      
      // Check for status mismatch
      if (product.stock === 0 && product.status !== 'out-of-stock') {
        discrepancies.push(`Product ${product.name} (${product.sku}) has 0 stock but status is ${product.status}`);
      }
      
      // Check for low stock threshold mismatch
      if (product.stock > 0 && product.stock <= product.lowStockThreshold && product.status !== 'low-stock') {
        discrepancies.push(`Product ${product.name} (${product.sku}) is below threshold but status is ${product.status}`);
      }
      
      // Check for missing price
      if (!product.price || product.price <= 0) {
        discrepancies.push(`Product ${product.name} (${product.sku}) has invalid price: ${product.price}`);
      }
    });
    
    return discrepancies.length > 0 
      ? `Audit completed. Found ${discrepancies.length} discrepancy(ies):\n${discrepancies.join('\n')}`
      : 'Audit completed. No discrepancies found.';
  }

  /**
   * Export audit reports
   * @param {Object} auditData - Audit data to export
   * @param {string} format - Export format (csv or pdf)
   * @returns {boolean} - Success status
   */
  exportReports(auditData, format) {
    // For now, return success
    // In a production app, this would generate actual CSV/PDF files
    return true;
  }
}

const auditorInstance = new Auditor();

/**
 * Create new audit (audit inventory)
 * @route POST /api/auditor/auditInventory
 * @access Auditor
 */
export const createNewAudit = async (req, res) => {
  try {
    // Fetch all products
    const allProducts = await Product.find({});
    
    const discrepancies = [];
    const auditResults = [];
    
    // Perform audit on each product
    allProducts.forEach(product => {
      const productDiscrepancies = [];
      
      // Check for negative stock
      if (product.stock < 0) {
        productDiscrepancies.push({
          type: 'negative_stock',
          message: `Negative stock: ${product.stock}`,
          severity: 'high'
        });
      }
      
      // Check for status mismatch
      if (product.stock === 0 && product.status !== 'out-of-stock') {
        productDiscrepancies.push({
          type: 'status_mismatch',
          message: `Stock is 0 but status is ${product.status}`,
          severity: 'medium'
        });
      }
      
      // Check for low stock threshold mismatch
      if (product.stock > 0 && product.stock <= product.lowStockThreshold && product.status !== 'low-stock' && product.status !== 'out-of-stock') {
        productDiscrepancies.push({
          type: 'low_stock_mismatch',
          message: `Stock (${product.stock}) is below threshold (${product.lowStockThreshold}) but status is ${product.status}`,
          severity: 'low'
        });
      }
      
      // Check for missing price
      if (!product.price || product.price <= 0) {
        productDiscrepancies.push({
          type: 'invalid_price',
          message: `Invalid or missing price: ${product.price}`,
          severity: 'medium'
        });
      }
      
      if (productDiscrepancies.length > 0) {
        auditResults.push({
          productId: product._id,
          name: product.name,
          sku: product.sku,
          currentStock: product.stock,
          status: product.status,
          discrepancies: productDiscrepancies
        });
        discrepancies.push(...productDiscrepancies);
      }
    });

    // Create new audit record
    const currentDate = new Date();
    const auditTitle = `Inventory Audit - ${currentDate.toLocaleDateString()}`;
    
    const newAudit = await Audit.create({
      title: auditTitle,
      date: currentDate,
      status: 'in-progress',
      discrepancies: discrepancies.length,
      discrepancyDetails: auditResults,
      createdBy: req.user.userId,
      notes: 'Audit started by auditor'
    });

    // Count different severity levels
    const highSeverity = discrepancies.filter(d => d.severity === 'high').length;
    const mediumSeverity = discrepancies.filter(d => d.severity === 'medium').length;
    const lowSeverity = discrepancies.filter(d => d.severity === 'low').length;
    
    const auditSummary = auditorInstance.auditInventory(allProducts);

    res.status(200).json({
      success: true,
      message: `New audit started successfully — ${discrepancies.length} discrepancies found.`,
      data: {
        auditId: newAudit._id,
        totalDiscrepancies: discrepancies.length,
        discrepancyBreakdown: {
          high: highSeverity,
          medium: mediumSeverity,
          low: lowSeverity
        },
        auditResults,
        summary: auditSummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform audit'
    });
  }
};

/**
 * Get audit history (audit reports)
 * @route GET /api/auditor/reports
 * @access Auditor
 */
export const getAuditReports = async (req, res) => {
  try {
    // Fetch all audits from the database
    const audits = await Audit.find({})
      .populate('createdBy', 'fullName email')
      .sort({ date: -1 })
      .limit(50);

    // Transform to match frontend expected format
    const auditReports = audits.map(audit => ({
      id: audit._id.toString(),
      title: audit.title,
      date: audit.date.toISOString(),
      status: audit.status,
      discrepancies: audit.discrepancies || 0
    }));

    res.status(200).json({
      success: true,
      count: auditReports.length,
      data: auditReports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch audit reports'
    });
  }
};

/**
 * Schedule a new audit
 * @route POST /api/auditor/scheduleAudit
 * @access Auditor
 */
export const scheduleAudit = async (req, res) => {
  try {
    const { title, date } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        error: 'Audit title and date are required'
      });
    }

    // Create new audit record with status 'scheduled'
    const newAudit = await Audit.create({
      title,
      date: new Date(date),
      status: 'scheduled',
      discrepancies: 0,
      createdBy: req.user.userId,
      notes: 'Audit scheduled by auditor.'
    });

    res.status(201).json({
      success: true,
      message: `Audit scheduled for ${new Date(date).toLocaleDateString()} successfully.`,
      data: {
        auditId: newAudit._id,
        title: newAudit.title,
        date: newAudit.date,
        status: newAudit.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to schedule audit'
    });
  }
};

/**
 * Get audit details by ID
 * @route GET /api/auditor/audits/:id
 * @access Auditor
 */
export const getAuditById = async (req, res) => {
  try {
    const { id } = req.params;

    const audit = await Audit.findById(id)
      .populate('createdBy', 'fullName email')
      .populate('discrepancyDetails.productId', 'name sku category stock status');

    if (!audit) {
      return res.status(404).json({
        success: false,
        error: 'Audit not found'
      });
    }

    res.status(200).json({
      success: true,
      data: audit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch audit details'
    });
  }
};

/**
 * Complete an audit
 * @route PUT /api/auditor/audits/:id/complete
 * @access Auditor
 */
export const completeAudit = async (req, res) => {
  try {
    const { id } = req.params;

    const audit = await Audit.findById(id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        error: 'Audit not found'
      });
    }

    if (audit.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Audit is already completed'
      });
    }

    audit.status = 'completed';
    await audit.save();

    res.status(200).json({
      success: true,
      message: 'Audit marked as completed successfully',
      data: audit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete audit'
    });
  }
};

/**
 * Export audit report
 * @route GET /api/auditor/exportReport
 * @access Auditor
 */
export const exportAuditReport = async (req, res) => {
  try {
    const { format = 'csv', reportId } = req.query;
    
    // Fetch all products for audit
    const allProducts = await Product.find({});
    
    if (format === 'csv') {
      // Generate CSV content
      const csvRows = [];
      csvRows.push(['Product Name', 'SKU', 'Current Stock', 'Status', 'Discrepancies']);
      
      allProducts.forEach(product => {
        const discrepancies = [];
        if (product.stock < 0) discrepancies.push('Negative stock');
        if (product.stock === 0 && product.status !== 'out-of-stock') discrepancies.push('Status mismatch');
        if (product.price <= 0) discrepancies.push('Invalid price');
        
        csvRows.push([
          product.name,
          product.sku,
          product.stock,
          product.status,
          discrepancies.length > 0 ? discrepancies.join('; ') : 'None'
        ]);
      });
      
      const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-report-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
      
      // Generate success status
      auditorInstance.exportReports({ format: 'csv' }, 'csv');
      
    } else if (format === 'pdf') {
      // For PDF, we'd need a PDF generation library
      // For now, return JSON data
      res.status(200).json({
        success: true,
        message: 'PDF export not yet implemented. Please use CSV format.',
        data: {
          format: 'pdf',
          reportId: reportId || 'default',
          timestamp: new Date().toISOString()
        }
      });
      
      auditorInstance.exportReports({ format: 'pdf' }, 'pdf');
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid format. Use "csv" or "pdf"'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export report'
    });
  }
};

/**
 * Get dashboard statistics
 * @route GET /api/auditor/stats
 * @access Auditor
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Fetch all products
    const allProducts = await Product.find({});
    
    // Perform audit to get discrepancy count
    let totalDiscrepancies = 0;
    allProducts.forEach(product => {
      if (product.stock < 0) totalDiscrepancies++;
      if (product.stock === 0 && product.status !== 'out-of-stock') totalDiscrepancies++;
      if (product.price <= 0) totalDiscrepancies++;
    });
    
    // Get total products
    const totalProducts = allProducts.length;
    
    // Get audit statistics from Audit collection
    const totalAudits = await Audit.countDocuments({});
    const completedAudits = await Audit.countDocuments({ status: 'completed' });
    const inProgressAudits = await Audit.countDocuments({ status: 'in-progress' });
    
    res.status(200).json({
      success: true,
      data: {
        totalAudits,
        completedAudits,
        inProgressAudits,
        totalDiscrepancies,
        totalProducts
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
  auditInventory: auditorInstance.auditInventory.bind(auditorInstance),
  exportReports: auditorInstance.exportReports.bind(auditorInstance)
};

