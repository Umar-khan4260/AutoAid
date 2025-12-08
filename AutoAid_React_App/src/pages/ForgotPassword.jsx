import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCar } from 'react-icons/fa';
import { MdMail } from 'react-icons/md';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address.');
            return;
        }
        setEmailError('');

        try {
            const actionCodeSettings = {
                // URL you want to redirect back to. The domain (www.example.com) for this
                // URL must be in the authorized domains list in the Firebase Console.
                url: 'http://localhost:5173/reset-password',
                handleCodeInApp: true,
            };

            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            alert('Password reset email sent! Please check your inbox.');
            navigate('/login');
        } catch (error) {
            console.error('Error sending password reset email:', error);
            if (error.code === 'auth/user-not-found') {
                setEmailError('No user found with this email address.');
            } else {
                setEmailError('Failed to send reset email. Please try again.');
            }
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
                        <h2 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">AutoAid</h2>
                    </Link>
                </div>
            </header>
            <main className="flex flex-grow w-full">
                <div className="flex items-stretch w-full">
                    <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gray-100 dark:bg-gray-900 relative">
                        <img
                            alt="Roadside assistance scene"
                            className="absolute h-full w-full object-cover opacity-30"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM-rLn82Hbq4z48Rm6B6xzCfVDn3Bd2Cw-0yoebQNSgXqIFfca1aPh3WcIt5iYjEWr5ld_mKVZZNoGxuVEmS_bmj8XLiMtywIl7DKFoiO6Yf10YmM235HnoUeOdmN-7faO_IncRwCPFZ3OeeYvgym6wlhC1TzCQUMTRMAer-skIgQqmiseNpEFQc_b61hu4aehiIbgV2nLxtRLTAmfurmzNe8Fk64BCcqkSQuddZomVPU01Q9XOK5LOMlGNFWTFy4dWkEmJEruAv5q"
                        />
                        <div className="relative z-10 text-center text-gray-900 dark:text-white p-12 max-w-lg">
                            <h2 className="text-4xl font-bold mb-4">Your reliable partner on the road.</h2>
                            <p className="text-lg text-gray-700 dark:text-gray-300">
                                Fast, efficient, and always ready to help. Get back on track in no time with AutoAid.
                            </p>
                        </div>
                    </div>
                    <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
                        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-card-dark rounded-lg shadow-xl border border-gray-200 dark:border-border-dark">
                            <div className="text-center">
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-text-dark">Forgot Password</h1>
                                <p className="mt-2 text-gray-600 dark:text-subtle-dark">Enter your email to reset your password.</p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="email">
                                        Email address
                                    </label>
                                    <div className="mt-1 relative">
                                        <MdMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-subtle-dark pointer-events-none text-xl" />
                                        <input
                                            autoComplete="email"
                                            className={`block w-full pl-10 pr-3 py-2 border ${emailError ? 'border-red-500' : 'border-gray-300 dark:border-border-dark'} rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-text-dark`}
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
                                    <button
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-primary hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-card-dark focus:ring-primary transition-colors duration-200"
                                        type="submit"
                                    >
                                        Reset Password
                                    </button>
                                </div>
                            </form>
                            <div className="text-center text-sm text-gray-600 dark:text-subtle-dark">
                                <p>
                                    Remember your password?{' '}
                                    <Link className="font-medium text-primary hover:underline" to="/login">
                                        Login
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

export default ForgotPassword;
