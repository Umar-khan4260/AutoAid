const express = require('express');
const router = express.Router();
const { getPendingProviders, updateProviderStatus, getAllUsers, updateUserStatus, getAllAdmins, addAdmin, removeAdmin } = require('../controllers/adminController');
const { protect, admin, superAdminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/providers/pending', getPendingProviders);
router.put('/providers/:id/status', updateProviderStatus);

router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);

// SuperAdmin-only routes for managing admins
router.get('/admins', superAdminOnly, getAllAdmins);
router.post('/admins', superAdminOnly, addAdmin);
router.delete('/admins/:id', superAdminOnly, removeAdmin);

module.exports = router;
