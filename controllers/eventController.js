const Event = require('../models/Event');

const eventController = {
  createEvent: async (req, res) => {
    try {
      // Validate required fields
      const { title, description, date, time, location } = req.body;
      if (!title || !description || !date || !time || !location) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate date format
      const eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }

      const event = await Event.create(req.body);
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(400).json({ message: error.message });
    }
  },

  getAllEvents: async (req, res) => {
    try {
      const events = await Event.find({ isActive: true })
        .sort({ date: 1 })
        .lean(); // Convert to plain JavaScript objects
      
      // Ensure we always return an array
      const eventsArray = Array.isArray(events) ? events : [];
      
      res.json(eventsArray);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ message: 'Error fetching events' });
    }
  },

  updateEvent: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: 'Event ID is required' });
      }

      const event = await Event.findByIdAndUpdate(id, req.body, { new: true });
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(400).json({ message: error.message });
    }
  },

  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: 'Event ID is required' });
      }

      const event = await Event.findByIdAndDelete(id);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ message: 'Error deleting event' });
    }
  }
};

module.exports = eventController; 