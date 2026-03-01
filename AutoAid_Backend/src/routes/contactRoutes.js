const express = require('express');
const router = express.Router();
const { submitContactMessage, getContactMessages } = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public - anyone can submit a contact message
router.post('/', submitContactMessage);

// Admin only - view all contact messages
router.get('/', protect, admin, getContactMessages);

module.exports = router;
