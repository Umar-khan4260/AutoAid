const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/upload');

// POST /api/services/request
router.post('/request', protect, serviceController.createServiceRequest);
router.post('/nearby', protect, serviceController.getNearbyProviders);
router.post('/assign', protect, serviceController.assignProvider);
router.get('/provider', protect, serviceController.getProviderRequests);

// PUT /api/services/request/:id/status
router.put('/request/:id/status', protect, serviceController.updateRequestStatus);

// POST /api/services/request/:id/rate
router.post('/request/:id/rate', protect, serviceController.submitRating);

// POST /api/services/request/:id/dispute
router.post('/request/:id/dispute', protect, upload.single('proofImage'), serviceController.submitDispute);

// GET /api/services/active-job
router.get('/active-job', protect, serviceController.getActiveJob);

// PUT /api/services/provider/location
router.put('/provider/location', protect, serviceController.updateProviderLocation);

// GET /api/services/nha-advisories
router.get('/nha-advisories', protect, serviceController.getNhaAdvisories);

module.exports = router;
