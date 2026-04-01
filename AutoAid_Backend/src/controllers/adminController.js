const User = require('../models/User');
const Dispute = require('../models/Dispute');
const ServiceRequest = require('../models/ServiceRequest');
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

// @desc    Get all disputes
// @route   GET /api/admin/disputes
// @access  Private/Admin
exports.getAllDisputes = async (req, res) => {
    try {
        const disputes = await Dispute.aggregate([
            {
                // Join with User for Reporter (matching userId string to User.uid)
                $lookup: {
                    from: 'users',
                    localField: 'userId', // The Firebase UID stored in Dispute
                    foreignField: 'uid',   // The Firebase UID stored in User
                    as: 'userId'
                }
            },
            {
                // Join with User for Provider (matching providerId ObjectId to User._id)
                $lookup: {
                    from: 'users',
                    localField: 'providerId',
                    foreignField: '_id',
                    as: 'providerId'
                }
            },
            { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$providerId', preserveNullAndEmptyArrays: true } },
            {
                // Project only needed fields and exclude sensitive data
                $project: {
                    'userId.password': 0,
                    'providerId.password': 0,
                }
            },
            { $sort: { timestamp: -1 } }
        ]);

        res.status(200).json({
            success: true,
            count: disputes.length,
            data: disputes
        });
    } catch (error) {
        console.error('Error fetching disputes:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Update dispute status
// @route   PUT /api/admin/disputes/:id/status
// @access  Private/Admin
exports.updateDisputeStatus = async (req, res) => {
    const { status } = req.body;

    if (!['Pending', 'Reviewed', 'Resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use Pending, Reviewed, or Resolved.' });
    }

    try {
        const dispute = await Dispute.findById(req.params.id);

        if (!dispute) {
            return res.status(404).json({ error: 'Dispute not found' });
        }

        dispute.status = status;
        await dispute.save();

        res.status(200).json({ success: true, data: dispute });
    } catch (error) {
        console.error('Error updating dispute status:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, activeProviders, pendingApprovals, activeDisputes] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'provider', isAvailable: true }),
            User.countDocuments({ role: 'provider', isAdminApproved: false }),
            Dispute.countDocuments({ status: 'Pending' })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeProviders,
                pendingApprovals,
                activeDisputes
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get service distribution stats
// @route   GET /api/admin/service-distribution
// @access  Private/Admin
exports.getServiceDistribution = async (req, res) => {
    const { period } = req.query; // 'this-month', 'last-month', 'last-6-months', 'overall'
    
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'this-month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth } };
    } else if (period === 'last-month') {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        dateFilter = { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } };
    } else if (period === 'last-6-months') {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        dateFilter = { createdAt: { $gte: sixMonthsAgo } };
    }
    // 'overall' leaves dateFilter as empty object {}

    try {
        const distribution = await ServiceRequest.aggregate([
            {
                $match: {
                    status: 'Completed',
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$serviceType',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: '$_id',
                    value: '$count',
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: distribution
        });
    } catch (error) {
        console.error('Error fetching service distribution:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get service requests trend (monthly)
// @route   GET /api/admin/service-trend
// @access  Private/Admin
exports.getServiceTrend = async (req, res) => {
    try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const trend = await ServiceRequest.aggregate([
            {
                $match: {
                    status: 'Completed',
                    createdAt: { $gte: startOfYear }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Map month numbers to names and ensure all 12 months are present
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedTrend = monthNames.map((month, index) => {
            const found = trend.find(t => t._id === index + 1);
            return {
                month,
                count: found ? found.count : 0
            };
        });

        res.status(200).json({
            success: true,
            data: formattedTrend
        });
    } catch (error) {
        console.error('Error fetching service trend:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};
