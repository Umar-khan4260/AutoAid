const User = require('../models/User');
const { sendEmail } = require('../config/email');

// @desc    Get all pending provider approvals
// @route   GET /api/admin/providers/pending
// @access  Private/Admin
exports.getPendingProviders = async (req, res) => {
    try {
        const providers = await User.find({ role: 'provider', status: 'pending' }).select('-password');
        res.status(200).json({ success: true, count: providers.length, data: providers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Approve or Reject a provider
// @route   PUT /api/admin/providers/:id/status
// @access  Private/Admin
exports.updateProviderStatus = async (req, res) => {
    const { status } = req.body; // 'active' (approve) or 'suspended' (reject/suspend)

    if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use active or suspended.' });
    }

    try {
        const provider = await User.findById(req.params.id);

        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        if (provider.role !== 'provider') {
            return res.status(400).json({ error: 'User is not a provider' });
        }

        provider.status = status;
        if (status === 'active') {
            provider.isAdminApproved = true;
            
            // Send Approval Email
            await sendEmail(
                provider.email,
                'AutoAid Provider Application Approved',
                `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #28a745;">Application Approved!</h2>
                    <p>Dear ${provider.fullName},</p>
                    <p>Congratulations! Your application to become a service provider on AutoAid has been approved.</p>
                    <p>You can now log in to your provider dashboard and start accepting service requests.</p>
                    <a href="http://localhost:5173/login" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Login Now</a>
                </div>
                `
            );

        } else {
            provider.isAdminApproved = false;

            // Send Rejection Email
            await sendEmail(
                provider.email,
                'AutoAid Provider Application Update',
                `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #dc3545;">Application Rejected</h2>
                    <p>Dear ${provider.fullName},</p>
                    <p>We regret to inform you that your application to become a service provider on AutoAid has been rejected.</p>
                    <p>This may be due to incomplete documentation or not meeting our requirements.</p>
                    <p>Please contact support for more information.</p>
                </div>
                `
            );
        }

        await provider.save();

        res.status(200).json({ success: true, data: provider });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get all users (excluding admins, or include if needed)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        let query = {};
        if (req.query.role) {
            query.role = req.query.role;
        }

        // Fetch users sorted by creation date
        const users = await User.find(query).sort({ createdAt: -1 }).select('-password');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Update any user status (Suspend/Activate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
    const { status } = req.body; // 'active', 'suspended'

    if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent suspending self (though middleware prevents non-admins, an admin shouldn't suspend themselves this way usually)
        // Check if req.user exists (set by auth middleware)
        if (req.user && user._id.toString() === req.user._id.toString()) {
             return res.status(400).json({ error: 'Cannot update your own status' });
        }

        user.status = status;
        await user.save();

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get all admins
// @route   GET /api/admin/admins
// @access  Private/SuperAdmin
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 }).select('-password');
        res.status(200).json({ success: true, count: admins.length, data: admins });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Add (promote) user to admin
// @route   POST /api/admin/admins
// @access  Private/SuperAdmin
exports.addAdmin = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found with that email' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ error: 'User is already an admin' });
        }

        if (user.role === 'superadmin') {
            return res.status(400).json({ error: 'Cannot modify a super admin' });
        }

        user.role = 'admin';
        user.status = 'active';
        await user.save();

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Remove (demote) admin back to user
// @route   DELETE /api/admin/admins/:id
// @access  Private/SuperAdmin
exports.removeAdmin = async (req, res) => {
    try {
        const admin = await User.findById(req.params.id);

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        if (admin.role !== 'admin') {
            return res.status(400).json({ error: 'User is not an admin' });
        }

        if (admin.role === 'superadmin') {
            return res.status(400).json({ error: 'Cannot demote a super admin' });
        }

        // Prevent demoting self
        if (req.user && admin._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot demote yourself' });
        }

        admin.role = 'user';
        await admin.save();

        res.status(200).json({ success: true, message: 'Admin removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};
