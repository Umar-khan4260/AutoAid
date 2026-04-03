const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
    userId: {
        type: String, // Firebase UID
        required: true,
        ref: 'User' 
    },
    providerId: {
        type: String, // Provider's Firebase UID
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
        enum: ['Pending', 'Countered', 'Accepted', 'Rejected', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    // Negotiation block — only set for Temporary Driver requests
    negotiation: {
        originalRate:  { type: Number },   // rate driver registered with
        offeredRate:   { type: Number },   // rate user agreed to pay (from estimatedCost)
        counterRate:   { type: Number },   // rate driver proposes
        finalRate:     { type: Number },   // rate both settled on
        counterSent:   { type: Boolean, default: false }  // one-time guard
    },
    // Flexible schema for service-specific details
    details: {
        type: mongoose.Schema.Types.Mixed, 
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    rating: {
        score: { type: Number, min: 1, max: 5 },
        comment: { type: String }
    },
    issueReport: {
        type: String
    }
});

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
