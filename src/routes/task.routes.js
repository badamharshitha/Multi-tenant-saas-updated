const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

const {
  createTask,
  listProjectTasks,
  updateTaskStatus,
  updateTask,
  deleteTask
} = require('../controllers/task.controller');

router.post('/projects/:projectId/tasks', authenticate, createTask);
router.get('/projects/:projectId/tasks', authenticate, listProjectTasks);
router.patch('/tasks/:taskId/status', authenticate, updateTaskStatus);
router.put('/tasks/:taskId', authenticate, updateTask);
router.delete('/tasks/:taskId', authenticate, deleteTask);

module.exports = router;
