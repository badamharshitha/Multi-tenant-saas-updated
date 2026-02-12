const express = require('express');
const router = express.Router();

const { listTenants } = require('../controllers/tenant.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticate, authorizeRoles('super_admin'), listTenants);

module.exports = router;
