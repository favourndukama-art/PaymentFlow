'use strict';

const express = require('express');
const { validateQuery } = require('../middleware/validateQuery');
const queries = require('../middleware/schemas/routeQuerySchemas');
const router = express.Router();
const {
  registerStudent,
  getAllStudents,
  getStudent,
  getPublicStudentInfo,
  updateStudent,
  deleteStudent,
  restoreStudent,
  getDeletedStudentPayments,
  getPaymentSummary,
  bulkImportStudents,
  getOverdueStudents,
  resetPayment,
  reconcileStudent,
  getFeeHistory,
  exportStudents,
  adjustStudentCredit,
} = require('../controllers/studentController');
const { resubscribeReminders } = require('../controllers/reminderController');
const { getImportJobStatus } = require('../controllers/importJobController');
const { validateRegisterStudent, validateStudentIdParam, validateUpdateStudent } = require('../middleware/validate');
const { resolveSchool } = require('../middleware/schoolContext');
const { requireAdminAuth, requireSchoolAuth } = require('../middleware/auth');
const { auditContext } = require('../middleware/auditContext');
const { bulkImportLimiter } = require('../middleware/rateLimiter');
const streamingCsvUpload = require('../middleware/streamingCsvUpload');
const { contractPaused } = require('../middleware/contractPaused');

router.use(resolveSchool);

// Admin-only routes
router.post('/', requireAdminAuth, auditContext, validateRegisterStudent, registerStudent);
router.post('/bulk', requireAdminAuth, auditContext, bulkImportLimiter, express.json({ limit: '1mb' }), streamingCsvUpload({ requiredHeaders: ['studentId', 'name', 'class'] }), bulkImportStudents);
router.get('/', requireAdminAuth, validateQuery(queries.studentList, { includeDetails: true, legacyOffset: true }), getAllStudents);
router.get('/export', requireAdminAuth, validateQuery(queries.studentExport), exportStudents);

// Import job status — registered BEFORE /:studentId so Express does not
// capture the literal segment 'import' as a studentId parameter.
router.get('/import/:jobId', requireAdminAuth, getImportJobStatus);

// Authentication-required routes (Issue #1040: all student financial data requires auth)
router.get('/summary', requireSchoolAuth(), getPaymentSummary);
router.get('/overdue', requireSchoolAuth(), validateQuery(queries.pagination), getOverdueStudents);

// Public routes
router.get('/public/:studentId', validateStudentIdParam, getPublicStudentInfo);
router.get('/:studentId', requireAdminAuth, validateStudentIdParam, getStudent);
router.put('/:studentId', requireAdminAuth, auditContext, validateStudentIdParam, validateUpdateStudent, updateStudent);
router.delete('/:studentId', requireAdminAuth, auditContext, validateStudentIdParam, deleteStudent);
router.post('/:studentId/restore', requireAdminAuth, auditContext, validateStudentIdParam, restoreStudent);
router.get('/:studentId/payments/audit', requireAdminAuth, validateStudentIdParam, validateQuery(queries.pagination), getDeletedStudentPayments);
router.post('/:studentId/reset-payment', requireAdminAuth, auditContext, validateStudentIdParam, resetPayment);
router.post('/:studentId/reconcile', requireAdminAuth, auditContext, validateStudentIdParam, reconcileStudent);
router.post('/:studentId/reminders/resubscribe', requireAdminAuth, auditContext, validateStudentIdParam, resubscribeReminders);
router.get('/:studentId/fee-history', requireAdminAuth, validateStudentIdParam, validateQuery(queries.pagination), getFeeHistory);
router.post('/:studentId/credit-adjustments', requireAdminAuth, validateStudentIdParam, auditContext, contractPaused, adjustStudentCredit);

module.exports = router;
