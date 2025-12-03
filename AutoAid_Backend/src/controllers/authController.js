const admin = require('../config/firebase');
const User = require('../models/User');
const Otp = require('../models/Otp');
const sendOtpEmail = require('../config/email');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  const { email, password, fullName, contactNumber, role, uid } = req.body;

  try {
    // Check if user already exists in MongoDB
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // 1. User is already created in Firebase (Client Side)
    // We expect 'uid' to be passed in the body
    if (!uid) {
        return res.status(400).json({ error: 'Missing UID from Firebase' });
    }

    // Extract Provider Details if role is provider
    let providerDetails = {};
    if (role === 'provider') {
        providerDetails = {
            serviceType: req.body.serviceType,
            dob: req.body.dob,
            gender: req.body.gender,
            profileImage: req.files['profileImage'] ? req.files['profileImage'][0].path : null,
            cnicImage: req.files['cnicImage'] ? req.files['cnicImage'][0].path : null,
            licenseImage: req.files['licenseImage'] ? req.files['licenseImage'][0].path : null,
            vehicleDetails: {
                number: req.body.towingVehicleNumber,
                make: req.body.towingMake,
                model: req.body.towingModel
            }
        };
    }

    // 2. Generate OTP
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save OTP with temporary user data
    await Otp.create({
        email: email,
        otp: otpValue,
        userData: {
            uid,
            fullName,
            contactNumber,
            role: role || 'user',
            providerDetails: role === 'provider' ? providerDetails : undefined
        }
    });

    // 4. Send OTP via Email
    await sendOtpEmail(email, otpValue);
    // console.log(`[OTP] Code for ${email}: ${otpValue}`);

    res.status(201).json({
      success: true,
      message: 'OTP sent. Please verify your email.',
      email: email
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error: ' + error.message });
  }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Find OTP
        const otpRecord = await Otp.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Create User from stored data
        const { uid, fullName, contactNumber, role, providerDetails } = otpRecord.userData;

        // Double check if user already exists (idempotency)
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                uid,
                email,
                fullName,
                contactNumber,
                role,
                isVerified: true,
                status: role === 'provider' ? 'pending' : 'active',
                isAdminApproved: false, // Default false
                providerDetails: providerDetails
            });
        } else {
             // If user exists but was unverified (edge case), just update
             user.isVerified = true;
             if (role === 'provider') {
                 user.status = 'pending';
                 user.isAdminApproved = false;
             }
             if (providerDetails) user.providerDetails = providerDetails;
             await user.save();
        }

        // Delete OTP
        await Otp.deleteOne({ _id: otpRecord._id });

        res.status(200).json({
            success: true,
            message: role === 'provider' ? 'Email verified. Account pending approval.' : 'Email verified and account created successfully',
            user: {
                uid: user.uid,
                email: user.email,
                fullName: user.fullName,
                isVerified: user.isVerified,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error: ' + error.message });
    }
};
