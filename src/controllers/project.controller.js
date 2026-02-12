const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { logAudit } = require('../services/audit.service');

/*
=========================================
CREATE PROJECT
=========================================
*/
exports.createProject = async (req, res) => {
  try {
    const { name, description = "", status = "active" } = req.body;
    const { tenantId, userId } = req.user;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required"
      });
    }

    const tenantResult = await pool.query(
      "SELECT max_projects FROM tenants WHERE id = $1",
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    const maxProjects = tenantResult.rows[0].max_projects;

    const projectCountResult = await pool.query(
      "SELECT COUNT(*) FROM projects WHERE tenant_id = $1",
      [tenantId]
    );

    const currentProjects = parseInt(projectCountResult.rows[0].count);

    if (currentProjects >= maxProjects) {
      return res.status(403).json({
        success: false,
        message: "Subscription project limit reached"
      });
    }

    const projectId = uuidv4();

    await pool.query(
      `INSERT INTO projects (id, tenant_id, name, description, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [projectId, tenantId, name, description, status, userId]
    );

    await logAudit({
      tenantId,
      userId,
      action: "CREATE_PROJECT",
      entityType: "project",
      entityId: projectId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: {
        id: projectId,
        tenantId,
        name,
        description,
        status,
        createdBy: userId
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


/*
=========================================
LIST PROJECTS
=========================================
*/
exports.listProjects = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.status, p.created_at,
              u.full_name as creator_name
       FROM projects p
       JOIN users u ON p.created_by = u.id
       WHERE p.tenant_id = $1
       ORDER BY p.created_at DESC`,
      [tenantId]
    );

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


/*
=========================================
UPDATE PROJECT
=========================================
*/
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const { tenantId, userId, role } = req.user;

    const projectResult = await pool.query(
      "SELECT * FROM projects WHERE id = $1 AND tenant_id = $2",
      [projectId, tenantId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const project = projectResult.rows[0];

    if (role !== "tenant_admin" && project.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }

    await pool.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE id = $4`,
      [name, description, status, projectId]
    );

    await logAudit({
      tenantId,
      userId,
      action: "UPDATE_PROJECT",
      entityType: "project",
      entityId: projectId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


/*
=========================================
DELETE PROJECT
=========================================
*/
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId, userId, role } = req.user;

    const projectResult = await pool.query(
      "SELECT * FROM projects WHERE id = $1 AND tenant_id = $2",
      [projectId, tenantId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const project = projectResult.rows[0];

    if (role !== "tenant_admin" && project.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }

    await pool.query(
      "DELETE FROM projects WHERE id = $1",
      [projectId]
    );

    await logAudit({
      tenantId,
      userId,
      action: "DELETE_PROJECT",
      entityType: "project",
      entityId: projectId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
