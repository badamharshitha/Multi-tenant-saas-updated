const express = require('express');
const router = express.Router();

const { addUser } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.post('/', authenticate, authorizeRoles('tenant_admin'), addUser);

module.exports = router;
