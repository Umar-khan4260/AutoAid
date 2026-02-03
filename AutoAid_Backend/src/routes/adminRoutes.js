const express = require('express');
const router = express.Router();
const { getPendingProviders, updateProviderStatus, getAllUsers, updateUserStatus } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/providers/pending', getPendingProviders);
router.put('/providers/:id/status', updateProviderStatus);

router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);

module.exports = router;
