import React from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaTimesCircle } from 'react-icons/fa';

const AccountUnsuccess = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background-dark text-text-dark font-display items-center justify-center p-4">
            <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
                <header className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 text-white">
                        <div className="size-12 text-primary flex items-center justify-center">
                            <FaCar className="text-4xl" />
                        </div>
                        <h2 className="text-white text-3xl font-bold tracking-tight">AutoAid</h2>
                    </div>
                </header>

                <div className="flex w-full flex-col items-center gap-6">
                    <div className="flex size-20 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <FaTimesCircle className="text-5xl" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                            Verification Failed
                        </p>
                        <p className="text-subtle-dark text-base font-normal leading-normal">
                            We couldn't verify your account. Please check your OTP and try again.
                        </p>
                    </div>
                </div>

                <Link
                    to="/verify-account"
                    className="flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-background-dark text-base font-bold leading-normal tracking-[0.015em] hover:bg-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark"
                >
                    <span className="truncate">Try Again</span>
                </Link>
            </main>
        </div>
    );
};

export default AccountUnsuccess;
