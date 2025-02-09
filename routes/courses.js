const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authenticateToken = require('../middleware/auth');

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/type/:type', courseController.getCoursesByType);

// Protected routes
router.post('/', authenticateToken, courseController.createCourse);
router.put('/:id', authenticateToken, courseController.updateCourse);
router.delete('/:id', authenticateToken, courseController.deleteCourse);

module.exports = router;

