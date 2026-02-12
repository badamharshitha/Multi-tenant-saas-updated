const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function logAudit({
  tenantId = null,
  userId = null,
  action,
  entityType = null,
  entityId = null,
  ipAddress = null
}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs 
       (id, tenant_id, user_id, action, entity_type, entity_id, ip_address, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
      [
        uuidv4(),
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        ipAddress
      ]
    );
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

module.exports = { logAudit };
