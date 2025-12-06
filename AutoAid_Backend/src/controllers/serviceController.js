const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

exports.createServiceRequest = async (req, res) => {
    try {
        const { uid, serviceType, contactNumber, details } = req.body;

        if (!uid || !serviceType || !contactNumber || !details) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify user exists (optional but recommended)
        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newRequest = new ServiceRequest({
            userId: uid,
            serviceType,
            contactNumber,
            details
        });

        await newRequest.save();

        res.status(201).json({ 
            message: 'Service request created successfully', 
            requestId: newRequest._id,
            request: newRequest 
        });

    } catch (error) {
        console.error('Error creating service request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
