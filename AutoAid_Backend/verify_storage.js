const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');

dotenv.config();

const verifyStorage = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const email = process.argv[2];
    if (!email) {
        console.log('Please provide an email to verify: node verify_storage.js <email>');
        process.exit(1);
    }

    const user = await User.findOne({ email });
    
    if (user) {
        console.log('--- User Data Verification ---');
        console.log(`UID: ${user.uid}`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.fullName}`);
        console.log(`Contact: ${user.contactNumber}`);
        console.log(`Verified: ${user.isVerified}`);
        console.log('------------------------------');
        
        if (user.uid && user.email && user.contactNumber) {
            console.log('SUCCESS: Critical fields are present.');
        } else {
            console.log('FAILURE: Missing critical fields.');
        }
    } else {
        console.log(`User with email ${email} not found.`);
    }

    mongoose.disconnect();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

verifyStorage();
