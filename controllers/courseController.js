const Course = require('../models/Course');

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    
    // Separate courses by type
    const primaryCourses = courses.filter(course => course.type === 'primary');
    const secondaryCourses = courses.filter(course => course.type === 'secondary');

    res.json({
      primaryCourses,
      secondaryCourses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch courses',
      details: error.message 
    });
  }
};

// Get courses by type
exports.getCoursesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const courses = await Course.find({ type }).sort('order');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
};

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      duration, 
      schedule, 
      image, 
      order,
      curriculum 
    } = req.body;

    // Validate curriculum data
    if (curriculum) {
      for (const item of curriculum) {
        if (!item.week || !item.topic) {
          return res.status(400).json({ 
            message: 'Each curriculum item must have a week number and topic' 
          });
        }
      }
    }

    const course = new Course({
      title,
      description,
      type,
      duration,
      schedule,
      image,
      order,
      curriculum: curriculum || []
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({ 
      message: 'Error creating course',
      error: error.message 
    });
  }
};

// Update a course
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate curriculum data if it's being updated
    if (updates.curriculum) {
      for (const item of updates.curriculum) {
        if (!item.week || !item.topic) {
          return res.status(400).json({ 
            message: 'Each curriculum item must have a week number and topic' 
          });
        }
      }
    }

    updates.updatedAt = new Date();
    
    const course = await Course.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Course update error:', error);
    res.status(500).json({ 
      message: 'Error updating course',
      error: error.message 
    });
  }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Course deletion error:', error);
    res.status(500).json({ 
      message: 'Error deleting course',
      error: error.message 
    });
  }
};

// Get course details with curriculum
exports.getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Course details error:', error);
    res.status(500).json({ 
      message: 'Error fetching course details',
      error: error.message 
    });
  }
}; 