const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Check if serviceAccountKey is available or use environment variables
// For now, we will use a placeholder or check for a specific env var
// You should replace 'path/to/serviceAccountKey.json' with your actual file path
// or use environment variables to initialize the app.

try {
  // Option 1: Using a service account file
  // const serviceAccount = require('../../serviceAccountKey.json');
  // admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount)
  // });

  // Option 2: Using environment variables (Mock for now if not present)
  if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('Firebase Admin Initialized');
  } else {
      console.warn('Firebase credentials not found. Firebase features will not work.');
      // Initialize with mock for testing if needed, or just fail gracefully
  }

} catch (error) {
  console.error('Firebase Admin Initialization Error:', error);
}

module.exports = admin;
