const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');

exports.login = async (req, res) => {
  try {
    const { email, password, tenantSubdomain } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // First check if super_admin
    const superAdminCheck = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role = 'super_admin'",
      [email]
    );

    let user;
    let tenant = null;

    if (superAdminCheck.rows.length > 0) {
      user = superAdminCheck.rows[0];
    } else {
      // For tenant users, tenantSubdomain is required
      if (!tenantSubdomain) {
        return res.status(400).json({
          success: false,
          message: "Tenant subdomain required"
        });
      }

      const tenantResult = await pool.query(
        "SELECT * FROM tenants WHERE subdomain = $1",
        [tenantSubdomain]
      );

      if (tenantResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Tenant not found"
        });
      }

      tenant = tenantResult.rows[0];

      const userResult = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND tenant_id = $2",
        [email, tenant.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }

      user = userResult.rows[0];
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id
        },
        token,
        expiresIn: 86400
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


// GET ME
exports.getMe = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.is_active,
              t.id as tenant_id, t.name as tenant_name,
              t.subdomain, t.subscription_plan,
              t.max_users, t.max_projects
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        tenant: user.tenant_id ? {
          id: user.tenant_id,
          name: user.tenant_name,
          subdomain: user.subdomain,
          subscriptionPlan: user.subscription_plan,
          maxUsers: user.max_users,
          maxProjects: user.max_projects
        } : null
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

exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const { v4: uuidv4 } = require('uuid');

// REGISTER TENANT (Transaction Required)
exports.registerTenant = async (req, res) => {
  const client = await pool.connect();

  try {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    await client.query('BEGIN');

    // Check subdomain uniqueness
    const existingTenant = await client.query(
      "SELECT id FROM tenants WHERE subdomain = $1",
      [subdomain]
    );

    if (existingTenant.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: "Subdomain already exists"
      });
    }

    const tenantId = uuidv4();
    const adminId = uuidv4();

    // Insert tenant (default free plan)
    await client.query(
      `INSERT INTO tenants (id, name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, $3, 'active', 'free', 5, 3)`,
      [tenantId, tenantName, subdomain]
    );

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Insert tenant admin
    await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5, 'tenant_admin')`,
      [adminId, tenantId, adminEmail, hashedPassword, adminFullName]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Tenant registered successfully",
      data: {
        tenantId,
        subdomain,
        adminUser: {
          id: adminId,
          email: adminEmail,
          fullName: adminFullName,
          role: "tenant_admin"
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  } finally {
    client.release();
  }
};
