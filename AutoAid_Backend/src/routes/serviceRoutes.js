const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

const { protect } = require('../middleware/authMiddleware');

// POST /api/services/request
router.post('/request', protect, serviceController.createServiceRequest);

module.exports = router;
