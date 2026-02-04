const express = require('express');
const router = express.Router();
const { signup, verifyEmail } = require('../controllers/authController');
const upload = require('../middleware/upload');

router.post('/signup', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'cnicImage', maxCount: 1 },
    { name: 'licenseImage', maxCount: 1 }
]), signup);
router.post('/verify-email', verifyEmail);
router.post('/login', require('../controllers/authController').login);
router.post('/logout', require('../controllers/authController').logout);
router.get('/check', require('../middleware/authMiddleware').protect, (req, res) => {
    res.status(200).json({ success: true, user: req.user });
});
router.put('/profile', require('../middleware/authMiddleware').protect, require('../controllers/authController').updateProfile);

module.exports = router;
