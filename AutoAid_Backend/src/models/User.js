const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'provider', 'admin'],
    default: 'user',
  },
  contactNumber: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: 'active'
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    lat: Number,
    lng: Number
  },
  isAdminApproved: {
    type: Boolean,
    default: false
  },
  providerDetails: {
    serviceType: String,
    age: Number,
    dob: Date,
    gender: String,
    profileImage: String,
    cnicImage: String,
    licenseImage: String,
    vehicleDetails: {
        number: String,
        make: String,
        model: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
