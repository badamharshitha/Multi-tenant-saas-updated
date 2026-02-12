const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { logAudit } = require('../services/audit.service');
const { v4: uuidv4 } = require('uuid');

exports.addUser = async (req, res) => {
  try {
    const { email, password, fullName, role = 'user' } = req.body;
    const { tenantId, userId } = req.user;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Get tenant info
    const tenantResult = await pool.query(
      "SELECT max_users FROM tenants WHERE id = $1",
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    const maxUsers = tenantResult.rows[0].max_users;

    // Count current users
    const userCountResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE tenant_id = $1",
      [tenantId]
    );

    const currentUsers = parseInt(userCountResult.rows[0].count);

    if (currentUsers >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: "Subscription user limit reached"
      });
    }

    // Check duplicate email per tenant
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND tenant_id = $2",
      [email, tenantId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists in this tenant"
      });
    }

    const newUserId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newUserId, tenantId, email, hashedPassword, fullName, role]
    );

    // 🔥 AUDIT LOG
    await logAudit({
      tenantId,
      userId, // who performed the action
      action: "CREATE_USER",
      entityType: "user",
      entityId: newUserId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: newUserId,
        email,
        fullName,
        role,
        tenantId
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
