const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authenticateToken = require('../middleware/auth');

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/type/:type', courseController.getCoursesByType);

// Protected routes
router.use(authenticateToken);
router.post('/', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;

