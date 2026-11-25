'use strict';

const express = require('express');
const { validateQuery } = require('../middleware/validateQuery');
const queries = require('../middleware/schemas/routeQuerySchemas');
const router = express.Router();
const { getAuditLogsEndpoint, getRecentAuditLogsEndpoint, verifyChainEndpoint, exportAuditLogsEndpoint } = require('../controllers/auditController');
const { resolveSchool } = require('../middleware/schoolContext');
const { requireAdminAuth } = require('../middleware/auth');
const { validateAuditQuery, validatePagination } = require('../middleware/validate');

router.use(resolveSchool);
router.use(requireAdminAuth);

router.get('/',              validateAuditQuery, getAuditLogsEndpoint);
router.get('/recent',        validatePagination, getRecentAuditLogsEndpoint);
// #1370 — CSV / JSON export for compliance and handover use-cases
router.get('/export',        validateQuery(queries.auditExport, { includeDetails: true }), exportAuditLogsEndpoint);
// #885 — verify hash-chain integrity
router.get('/verify-chain',  validateQuery(queries.limitOnly), verifyChainEndpoint);

module.exports = router;
