import React from 'react';

const CTA = () => {
    return (
        <section className="py-16 sm:py-24 bg-card-dark/30">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-tr from-card-dark to-transparent p-12 rounded-xl border border-border-dark hover:scale-[1.02] hover:shadow-glow-lg transition-all duration-300">
                <h2 className="text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight">Join Our Network of Providers</h2>
                <p className="text-text-muted mt-4 mb-8">Are you a skilled mechanic, driver, or service operator? Partner with AutoAid to grow your business, get more jobs, and help people in your community.</p>
                <button className="flex mx-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-background-dark text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity shadow-glow-md">
                    <span className="truncate">Join as a Provider</span>
                </button>
            </div>
        </section>
    );
};

export default CTA;
