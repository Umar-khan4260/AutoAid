import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCar } from 'react-icons/fa';
import { MdMail, MdLock, MdPerson, MdCall } from 'react-icons/md';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        contactNumber: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const validatePakistaniContactNumber = (number) => {
        const re = /^(0)(3\d{9}|[1-9]\d{9})$/;
        return re.test(number);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'contactNumber') {
            // Only allow digits
            if (!/^\d*$/.test(value)) return;
            // Limit to 11 digits
            if (value.length > 11) return;
        }

        // Only allow alphabets and spaces for Full Name
        if (name === 'fullName') {
            if (!/^[a-zA-Z\s]*$/.test(value)) return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        // Full Name Validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full Name is required.';
        }

        if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        if (!validatePakistaniContactNumber(formData.contactNumber)) {
            newErrors.contactNumber = 'Please enter a valid 11-digit Pakistani contact number.';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
        }

        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Proceed with signup logic here
        console.log('Signup submitted with:', formData);

        try {
            // 1. Create user in Firebase (Client Side)
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            console.log('Firebase User Created:', user.uid);

            // 2. Send data to Backend
            const response = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    uid: user.uid // Send the UID to backend
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Navigate to OTP verification with email
                navigate('/verify-account', { state: { email: formData.email } });
            } else {
                setErrors({ ...errors, api: data.error || 'Signup failed' });
            }
        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = 'Network error. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email is already in use.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak.';
            }
            setErrors({ ...errors, api: errorMessage });
            // Temporary: Alert the actual error for debugging
            alert(`Debug Error: ${error.message}`);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-white font-display transition-colors duration-300">
            <header className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6">
                <div className="container mx-auto max-w-7xl">
                    <Link to="/" className="flex items-center gap-3 group w-fit">
                        <div className="size-12 text-primary group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300 flex items-center justify-center">
                            <FaCar className="text-4xl" />
                        </div>
                        <h2 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">
                            AutoAid
                        </h2>
                    </Link>
                </div>
            </header>
            <main className="flex flex-grow w-full">
                <div className="flex items-stretch w-full">
                    <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                        <img
                            alt="Roadside assistance scene"
                            className="absolute h-full w-full object-cover opacity-30"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM-rLn82Hbq4z48Rm6B6xzCfVDn3Bd2Cw-0yoebQNSgXqIFfca1aPh3WcIt5iYjEWr5ld_mKVZZNoGxuVEmS_bmj8XLiMtywIl7DKFoiO6Yf10YmM235HnoUeOdmN-7faO_IncRwCPFZ3OeeYvgym6wlhC1TzCQUMTRMAer-skIgQqmiseNpEFQc_b61hu4aehiIbgV2nLxtRLTAmfurmzNe8Fk64BCcqkSQuddZomVPU01Q9XOK5LOMlGNFWTFy4dWkEmJEruAv5q"
                        />
                        <div className="relative z-10 text-center text-white p-12 max-w-lg">
                            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white relative z-10">Join the community of safe drivers.</h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 relative z-10">
                                Create your account to get instant access to reliable roadside assistance whenever you need it.
                            </p>
                        </div>
                    </div>
                    <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
                        <div className="w-full max-w-md p-8 space-y-6 bg-surface-light dark:bg-card-dark rounded-lg shadow-xl border border-gray-200 dark:border-border-dark transition-all duration-300">
                            <div className="text-center">
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Create Your Account</h1>
                                <p className="mt-2 text-gray-500 dark:text-subtle-dark">Become a member in just a few steps.</p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="fullName">
                                        Full Name
                                    </label>
                                    <div className="mt-1 relative">
                                        <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-subtle-dark pointer-events-none text-xl" />
                                        <input
                                            autoComplete="name"
                                            className={`block w-full pl-10 pr-3 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-border-dark'} rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300`}
                                            id="fullName"
                                            name="fullName"
                                            placeholder="John Doe"
                                            required
                                            type="text"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="email">
                                        Email address
                                    </label>
                                    <div className="mt-1 relative">
                                        <MdMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-subtle-dark pointer-events-none text-xl" />
                                        <input
                                            autoComplete="email"
                                            className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-border-dark'
                                                } rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300`}
                                            id="email"
                                            name="email"
                                            placeholder="you@example.com"
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="contactNumber">
                                        Contact Number
                                    </label>
                                    <div className="mt-1 relative">
                                        <MdCall className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-subtle-dark pointer-events-none text-xl" />
                                        <input
                                            autoComplete="tel"
                                            className={`block w-full pl-10 pr-3 py-2 border ${errors.contactNumber ? 'border-red-500' : 'border-gray-300 dark:border-border-dark'} rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300`}
                                            id="contactNumber"
                                            name="contactNumber"
                                            placeholder="03001234567"
                                            required
                                            type="tel"
                                            value={formData.contactNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {errors.contactNumber && <p className="mt-1 text-sm text-red-500">{errors.contactNumber}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="password">
                                        Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-subtle-dark pointer-events-none text-xl" />
                                        <input
                                            autoComplete="new-password"
                                            className={`block w-full pl-10 pr-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-border-dark'} rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300`}
                                            id="password"
                                            name="password"
                                            placeholder="••••••••"
                                            required
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="confirmPassword">
                                        Confirm Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-subtle-dark pointer-events-none text-xl" />
                                        <input
                                            autoComplete="new-password"
                                            className={`block w-full pl-10 pr-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-border-dark'
                                                } rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300`}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="••••••••"
                                            required
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
                                </div>
                                <div className="pt-2">
                                    {errors.api && <p className="text-sm text-red-500 text-center mb-2">{errors.api}</p>}
                                    <button
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-background-dark bg-primary hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-dark focus:ring-primary transition-colors duration-200"
                                        type="submit"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </form>

                            <div className="text-center text-sm text-gray-500 dark:text-subtle-dark">
                                <p>
                                    Already have an account?{' '}
                                    <Link className="font-medium text-primary hover:underline" to="/login">
                                        Log In
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

export default Signup;
