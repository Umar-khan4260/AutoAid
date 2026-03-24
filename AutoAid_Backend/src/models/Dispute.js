const mongoose = require('mongoose');

const DisputeSchema = new mongoose.Schema({
    userId: {
        type: String, // Firebase UID
        required: true,
        ref: 'User'
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    serviceType: {
        type: String,
        required: true
    },
    serviceRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'ServiceRequest'
    },
    reason: {
        type: String,
        required: true,
        enum: ['Late arrival', 'Overcharging', 'Misbehavior', 'Fake service', 'Safety issue']
    },
    description: {
        type: String,
        required: true
    },
    proofImage: {
        type: String
    },
    location: {
        lat: Number,
        lng: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved'],
        default: 'Pending'
    }
});

module.exports = mongoose.model('Dispute', DisputeSchema);
