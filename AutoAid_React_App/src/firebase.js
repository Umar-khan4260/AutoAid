// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBFc4oXS-CxWXYXKoo-tQ6WXsazyu-GU5I",
  authDomain: "autoaid-auth.firebaseapp.com",
  projectId: "autoaid-auth",
  storageBucket: "autoaid-auth.firebasestorage.app",
  messagingSenderId: "611105589492",
  appId: "1:611105589492:web:84798d34e55090b72b36a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// const analytics = getAnalytics(app);

export default app;
