const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

const { protect } = require('../middleware/authMiddleware');

// POST /api/services/request
router.post('/request', protect, serviceController.createServiceRequest);
router.post('/nearby', protect, serviceController.getNearbyProviders);
router.post('/assign', protect, serviceController.assignProvider);
router.get('/provider', protect, serviceController.getProviderRequests);

// PUT /api/services/request/:id/status
router.put('/request/:id/status', protect, serviceController.updateRequestStatus);

// GET /api/services/active-job
router.get('/active-job', protect, serviceController.getActiveJob);

// GET /api/services/nha-advisories
router.get('/nha-advisories', protect, serviceController.getNhaAdvisories);

module.exports = router;
