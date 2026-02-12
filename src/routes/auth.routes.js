const express = require('express');
const router = express.Router();

const { login, getMe, logout, registerTenant } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public routes
router.post('/register-tenant', registerTenant);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;
