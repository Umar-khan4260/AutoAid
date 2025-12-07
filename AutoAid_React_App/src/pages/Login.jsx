import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCar } from 'react-icons/fa';
import { MdMail, MdLock } from 'react-icons/md';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let isValid = true;

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address.');
            isValid = false;
        } else {
            setEmailError('');
        }

        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters.');
            isValid = false;
        } else {
            setPasswordError('');
        }

        if (!isValid) return;

        // Admin Bypass Check
        if (email === 'umar68408@gmail.com' && password === '123456') {
            console.log('Admin login detected');
            navigate('/admin');
            return;
        }

        try {
            // 1. Authenticate with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // 2. Get ID Token
            const token = await user.getIdToken();

            // 3. Verify with Backend
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for cookies
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login Success
                console.log('Login Successful:', data.user);
                // Store user info if needed (context/localStorage)
                // For now, just navigate
                navigate('/'); 
            } else {
                // Backend Error (e.g., pending approval)
                alert(data.error);
                // Optionally sign out from Firebase if backend rejects
                // await auth.signOut();
            }

        } catch (error) {
            console.error('Login Error:', error);
            // Handle Firebase Errors
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                alert('Invalid email or password.');
            } else {
                alert('Login failed: ' + error.message);
            }
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark text-text-dark font-display">
            <header className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6">
                <div className="container mx-auto max-w-7xl">
                    <Link to="/" className="flex items-center gap-3 group w-fit">
                        <div className="size-12 text-primary group-hover:text-white transition-colors duration-300 flex items-center justify-center">
                            <FaCar className="text-4xl" />
                        </div>
                        <h2 className="text-white text-3xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">AutoAid</h2>
                    </Link>
                </div>
            </header>
            <main className="flex flex-grow w-full">
                <div className="flex items-stretch w-full">
                    <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gray-900 relative">
                        <img
                            alt="Roadside assistance scene"
                            className="absolute h-full w-full object-cover opacity-30"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM-rLn82Hbq4z48Rm6B6xzCfVDn3Bd2Cw-0yoebQNSgXqIFfca1aPh3WcIt5iYjEWr5ld_mKVZZNoGxuVEmS_bmj8XLiMtywIl7DKFoiO6Yf10YmM235HnoUeOdmN-7faO_IncRwCPFZ3OeeYvgym6wlhC1TzCQUMTRMAer-skIgQqmiseNpEFQc_b61hu4aehiIbgV2nLxtRLTAmfurmzNe8Fk64BCcqkSQuddZomVPU01Q9XOK5LOMlGNFWTFy4dWkEmJEruAv5q"
                        />
                        <div className="relative z-10 text-center text-white p-12 max-w-lg">
                            <h2 className="text-4xl font-bold mb-4">Your reliable partner on the road.</h2>
                            <p className="text-lg text-gray-300">
                                Fast, efficient, and always ready to help. Get back on track in no time with AutoAid.
                            </p>
                        </div>
                    </div>
                    <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
                        <div className="w-full max-w-md p-8 space-y-6 bg-card-dark rounded-lg shadow-xl border border-border-dark">
                            <div className="text-center">
                                <h1 className="text-3xl font-bold tracking-tight text-text-dark">Welcome Back</h1>
                                <p className="mt-2 text-subtle-dark">Sign in to continue to your account.</p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-subtle-dark" htmlFor="email">
                                        Email address
                                    </label>
                                    <div className="mt-1 relative">
                                        <MdMail className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle-dark pointer-events-none text-xl" />
                                        <input
                                            autoComplete="email"
                                            className={`block w-full pl-10 pr-3 py-2 border ${emailError ? 'border-red-500' : 'border-border-dark'} rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-700 text-text-dark`}
                                            id="email"
                                            name="email"
                                            required
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (emailError) setEmailError('');
                                            }}
                                        />
                                    </div>
                                    {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium text-subtle-dark" htmlFor="password">
                                            Password
                                        </label>
                                        <Link className="text-sm text-primary hover:underline" to="/forgot-password">
                                            Forgot Password?
                                        </Link>
                                    </div>
                                    <div className="mt-1 relative">
                                        <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle-dark pointer-events-none text-xl" />
                                        <input
                                            autoComplete="current-password"
                                            className={`block w-full pl-10 pr-3 py-2 border ${passwordError ? 'border-red-500' : 'border-border-dark'} rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-700 text-text-dark`}
                                            id="password"
                                            name="password"
                                            required
                                            type="password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (passwordError) setPasswordError('');
                                            }}
                                        />
                                    </div>
                                    {passwordError && <p className="mt-1 text-sm text-red-500">{passwordError}</p>}
                                </div>
                                <div>
                                    <button
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-background-dark bg-primary hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-dark focus:ring-primary transition-colors duration-200"
                                        type="submit"
                                    >
                                        Login
                                    </button>
                                </div>
                            </form>

                            <div className="text-center text-sm text-subtle-dark">
                                <p>
                                    Don't have an account?{' '}
                                    <Link className="font-medium text-primary hover:underline" to="/signup">
                                        Sign Up Now
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Login;
