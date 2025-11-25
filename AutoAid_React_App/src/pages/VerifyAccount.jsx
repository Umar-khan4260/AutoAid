import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCar } from 'react-icons/fa';
import { MdArrowBack } from 'react-icons/md';

const VerifyAccount = () => {
    const navigate = useNavigate();
    const [otp, setOtp] = useState(new Array(6).fill(''));
    const inputRefs = useRef([]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index, e) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        // Allow only one digit
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = () => {
        const otpValue = otp.join('');
        console.log('Verifying OTP:', otpValue);
        // Add verification logic here
        // Navigate to success page
        navigate('/account-success');
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-dark text-text-dark font-display items-center justify-center p-4">
            <main className="flex w-full max-w-md flex-col items-center gap-8">
                {/* Header Section */}
                <header className="flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-3 text-white">
                        <div className="size-12 text-primary flex items-center justify-center">
                            <FaCar className="text-4xl" />
                        </div>
                        <h2 className="text-white text-3xl font-bold tracking-tight">AutoAid</h2>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                            Verify Your Account
                        </p>
                        <p className="text-subtle-dark text-base font-normal leading-normal">
                            We've sent a 6-digit code to your email. The code expires in 1 minute.
                        </p>
                    </div>
                </header>

                {/* Input Form */}
                <div className="flex w-full flex-col items-center gap-6">
                    {/* OTP Input Field */}
                    <fieldset className="relative flex justify-center gap-2 sm:gap-4">
                        {otp.map((value, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                className="flex h-14 w-12 text-center text-xl font-bold bg-gray-800 text-text-dark border-2 border-border-dark rounded-lg focus:border-primary focus:ring-primary focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                maxLength="1"
                                type="text"
                                value={value}
                                onChange={(e) => handleChange(index, e)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                            />
                        ))}
                    </fieldset>

                    {/* Primary Button (CTA) */}
                    <button
                        onClick={handleVerify}
                        className="flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-background-dark text-base font-bold leading-normal tracking-[0.015em] hover:bg-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark"
                    >
                        <span className="truncate">Verify</span>
                    </button>
                </div>

                {/* Secondary Links */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-subtle-dark text-sm font-normal leading-normal">
                        Didn't receive the code?{' '}
                        <button className="font-semibold text-primary hover:underline bg-transparent border-none cursor-pointer">
                            Resend OTP
                        </button>{' '}
                        (0:30)
                    </p>
                    <Link
                        to="/signup"
                        className="flex items-center gap-2 text-sm font-semibold text-subtle-dark hover:text-primary transition-colors"
                    >
                        <MdArrowBack className="text-base" />
                        Go Back
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default VerifyAccount;
