const http = require('http');

const email = 'testflow' + Date.now() + '@example.com';
let otpCode = '';

// 1. Signup Request
const signupData = JSON.stringify({
  email: email,
  password: 'password123',
  fullName: 'Flow User',
  contactNumber: '03001234567',
  role: 'user'
});

const signupOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': signupData.length
  }
};

console.log('--- Starting Signup Flow ---');

const signupReq = http.request(signupOptions, (res) => {
  console.log(`Signup Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Signup Response:', data);
    
    // In a real scenario, we would read the OTP from the server logs.
    // Since we can't easily read the server console from here, 
    // we will manually query the DB or just assume success if 201.
    // For this automated test, we can't proceed to verify without the OTP 
    // unless we expose it in the response (which we shouldn't in prod) 
    // or mock the DB access here.
    
    // For now, we will just verify the signup part works.
    // To fully test, I would need to read the OTP from the DB directly.
  });
});

signupReq.write(signupData);
signupReq.end();
