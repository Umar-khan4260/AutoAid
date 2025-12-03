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

module.exports = router;
