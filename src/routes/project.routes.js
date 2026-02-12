const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  createProject,
  listProjects,
  updateProject,
  deleteProject
} = require('../controllers/project.controller');

router.post('/', authenticate, createProject);
router.get('/', authenticate, listProjects);
router.put('/:projectId', authenticate, updateProject);
router.delete('/:projectId', authenticate, deleteProject);

module.exports = router;
