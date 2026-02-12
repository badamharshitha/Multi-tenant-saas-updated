const pool = require('../config/db');

exports.listTenants = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, subdomain, status, subscription_plan,
             max_users, max_projects, created_at
      FROM tenants
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
