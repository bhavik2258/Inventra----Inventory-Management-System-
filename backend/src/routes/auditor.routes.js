import express from 'express';
import {
  createNewAudit,
  getAuditReports,
  exportAuditReport,
  getDashboardStats,
  scheduleAudit,
  getAuditById,
  completeAudit
} from '../controllers/auditor.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// All routes require auditor role
router.use(authorize('auditor'));

// Dashboard statistics
router.get('/stats', getDashboardStats);

// Create new audit
router.post('/auditInventory', createNewAudit);

// Schedule audit
router.post('/scheduleAudit', scheduleAudit);

// Get audit reports
router.get('/reports', getAuditReports);

// Get audit details by ID
router.get('/audits/:id', getAuditById);

// Complete audit
router.put('/audits/:id/complete', completeAudit);

// Export audit report
router.get('/exportReport', exportAuditReport);

export default router;

