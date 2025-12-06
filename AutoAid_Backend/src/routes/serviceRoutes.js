const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// POST /api/services/request
router.post('/request', serviceController.createServiceRequest);

module.exports = router;
