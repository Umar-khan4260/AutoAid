const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
    userId: {
        type: String, // Firebase UID
        required: true,
        ref: 'User' 
    },
    serviceType: {
        type: String,
        required: true,
        enum: [
            'Breakdown Repair', 
            'Fuel Delivery', 
            'Lockout Service', 
            'Towing Service', 
            'Temporary Driver', 
            'Route Planning'
        ]
    },
    contactNumber: {
        type: String,
        required: true
    },
    userLocation: {
        lat: Number,
        lng: Number
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    // Flexible schema for service-specific details
    details: {
        type: mongoose.Schema.Types.Mixed, 
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
