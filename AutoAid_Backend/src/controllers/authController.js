const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../config/email');

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
            age: req.body.age,
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
                status: user.status,
                isAvailable: user.isAvailable
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error: ' + error.message });
    }
};
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { token } = req.body;

    try {
        // 1. Verify Firebase Token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const { uid, email } = decodedToken;

        // 2. Check if user exists in MongoDB
        const user = await User.findOne({ uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found in database' });
        }

        // 3. Check Status
        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'Account suspended. Please contact support.' });
        }

        // Removed pending check to allow redirection to PendingApproval page on frontend
        // if (user.role === 'provider' && user.status === 'pending') {
        //     return res.status(403).json({ error: 'Account pending approval. Please wait for admin verification.' });
        // }

        // 4. Return User Details
        // 4. Generate JWT
        const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        // 5. Set Cookie
        const options = {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            // secure: true, // Enable in production with HTTPS
        };

        res.status(200)
            .cookie('token', jwtToken, options)
            .json({
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    status: user.status,
                    isAvailable: user.isAvailable,
                    currentLocation: user.currentLocation,
                    providerDetails: user.providerDetails
                }
            });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ success: true, message: 'User logged out' });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, contactNumber, location, services, bio } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Update fields if provided
        if (fullName) user.fullName = fullName;
        if (contactNumber) user.contactNumber = contactNumber;
        if (location) user.location = location;
        
        // Update provider specific details
        if (user.role === 'provider') {
            if (services) {
                if (Array.isArray(services) && services.length >= 0) {
                     user.providerDetails.serviceType = services.join(', '); // Store as comma separated if multiple
                } else {
                    user.providerDetails.serviceType = services;
                }
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Update provider status and location
// @route   PUT /api/auth/status
// @access  Private
exports.updateStatus = async (req, res) => {
    try {
        const { isAvailable, location } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (typeof isAvailable !== 'undefined') {
            user.isAvailable = isAvailable;
        }

        if (location) {
            user.currentLocation = {
                lat: location.lat,
                lng: location.lng
            };
        }

        await user.save();

        res.status(200).json({
            success: true,
            user: {
                id: user._id, 
                isAvailable: user.isAvailable,
                currentLocation: user.currentLocation
            }
        });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
