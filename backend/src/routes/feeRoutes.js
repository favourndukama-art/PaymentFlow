'use strict';

const express = require('express');
const { validateQuery } = require('../middleware/validateQuery');
const queries = require('../middleware/schemas/routeQuerySchemas');
const router = express.Router();
const { createFeeStructure, getAllFeeStructures, getFeeByClass, deleteFeeStructure, updateFeeStructure } = require('../controllers/feeController');
const { validateFeeStructure } = require('../middleware/validate');
const { resolveSchool } = require('../middleware/schoolContext');
const { requireAdminAuth, requireSchoolAuth } = require('../middleware/auth');
const { auditContext } = require('../middleware/auditContext');
const { contractPaused } = require('../middleware/contractPaused');

// All fee routes require school context
router.use(resolveSchool);

const requireIncludeDeletedAccess = (req, res, next) => {
  if (req.query.includeDeleted) {
    return requireAdminAuth(req, res, next);
  }
  return next();
};

router.post('/',              requireAdminAuth, auditContext, contractPaused, validateFeeStructure, createFeeStructure);
router.get('/',               validateQuery(queries.feeList), requireIncludeDeletedAccess, getAllFeeStructures);
router.get('/:className',     requireSchoolAuth(), getFeeByClass);
router.put('/:className',     requireAdminAuth, auditContext, contractPaused, validateFeeStructure, updateFeeStructure);
router.delete('/:className',  requireAdminAuth, auditContext, contractPaused, validateQuery(queries.feeDelete), deleteFeeStructure);

module.exports = router;
