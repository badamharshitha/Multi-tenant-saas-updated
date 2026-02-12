const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { logAudit } = require('../services/audit.service');

/*
=========================================
CREATE TASK
=========================================
*/
exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description = "", assignedTo = null, priority = "medium", dueDate = null } = req.body;
    const { tenantId, userId } = req.user;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Task title is required"
      });
    }

    const projectResult = await pool.query(
      "SELECT tenant_id FROM projects WHERE id = $1",
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const projectTenantId = projectResult.rows[0].tenant_id;

    if (projectTenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: project does not belong to your tenant"
      });
    }

    if (assignedTo) {
      const userCheck = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND tenant_id = $2",
        [assignedTo, tenantId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Assigned user does not belong to this tenant"
        });
      }
    }

    const taskId = uuidv4();

    await pool.query(
      `INSERT INTO tasks 
       (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
       VALUES ($1,$2,$3,$4,$5,'todo',$6,$7,$8)`,
      [taskId, projectId, tenantId, title, description, priority, assignedTo, dueDate]
    );

    // 🔥 AUDIT LOG
    await logAudit({
      tenantId,
      userId,
      action: "CREATE_TASK",
      entityType: "task",
      entityId: taskId,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: {
        id: taskId,
        projectId,
        tenantId,
        title,
        description,
        status: "todo",
        priority,
        assignedTo,
        dueDate
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
LIST PROJECT TASKS
=========================================
*/
exports.listProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tenantId } = req.user;

    const projectCheck = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND tenant_id = $2",
      [projectId, tenantId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    const result = await pool.query(
      `SELECT t.id, t.title, t.description, t.status, t.priority,
              t.due_date, t.created_at,
              u.id as assigned_id,
              u.full_name as assigned_name,
              u.email as assigned_email
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = $1
       ORDER BY 
         CASE t.priority
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'low' THEN 3
         END,
         t.due_date ASC`,
      [projectId]
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
UPDATE TASK STATUS
=========================================
*/
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const { tenantId, userId } = req.user;

    const taskCheck = await pool.query(
      "SELECT tenant_id FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    if (taskCheck.rows[0].tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }

    await pool.query(
      "UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2",
      [status, taskId]
    );

    // 🔥 AUDIT LOG
    await logAudit({
      tenantId,
      userId,
      action: "UPDATE_TASK_STATUS",
      entityType: "task",
      entityId: taskId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: "Task status updated"
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
UPDATE TASK (FULL)
=========================================
*/
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const { tenantId, userId } = req.user;

    const taskCheck = await pool.query(
      "SELECT tenant_id FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    if (taskCheck.rows[0].tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }

    await pool.query(
      `UPDATE tasks SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         priority = COALESCE($4, priority),
         assigned_to = $5,
         due_date = $6,
         updated_at = NOW()
       WHERE id = $7`,
      [title, description, status, priority, assignedTo, dueDate, taskId]
    );

    // 🔥 AUDIT LOG
    await logAudit({
      tenantId,
      userId,
      action: "UPDATE_TASK",
      entityType: "task",
      entityId: taskId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: "Task updated successfully"
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
DELETE TASK
=========================================
*/
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tenantId, userId } = req.user;

    const taskCheck = await pool.query(
      "SELECT tenant_id FROM tasks WHERE id = $1",
      [taskId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    if (taskCheck.rows[0].tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }

    await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);

    // 🔥 AUDIT LOG
    await logAudit({
      tenantId,
      userId,
      action: "DELETE_TASK",
      entityType: "task",
      entityId: taskId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
