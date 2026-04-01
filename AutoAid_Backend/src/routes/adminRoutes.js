const express = require('express');
const router = express.Router();
const { 
    getPendingProviders, 
    updateProviderStatus, 
    getAllUsers, 
    updateUserStatus, 
    getAllAdmins, 
    addAdmin, 
    removeAdmin,
    getAllDisputes,
    updateDisputeStatus,
    getDashboardStats,
    getServiceDistribution,
    getServiceTrend
} = require('../controllers/adminController');
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

router.get('/disputes', getAllDisputes);
router.put('/disputes/:id/status', updateDisputeStatus);
router.get('/stats', getDashboardStats);
router.get('/service-distribution', getServiceDistribution);
router.get('/service-trend', getServiceTrend);

module.exports = router;
