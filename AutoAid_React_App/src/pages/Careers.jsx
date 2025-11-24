import React from 'react';
import { FaRocket, FaHeart, FaLaptopCode } from 'react-icons/fa';

const Careers = () => {
    return (
        <div className="pt-20">
            {/* Hero Section */}
            <section className="relative py-20 bg-background-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Join Our Team</h1>
                    <p className="text-xl text-text-muted max-w-3xl mx-auto">
                        Build the future of roadside assistance with us. We're looking for passionate problem-solvers.
                    </p>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-16 bg-[#121A2A]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="glassmorphism p-8 rounded-2xl text-center">
                            <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary text-2xl">
                                <FaRocket />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Fast-Paced Growth</h3>
                            <p className="text-text-muted">Work in a dynamic environment where your impact is immediate and tangible.</p>
                        </div>
                        <div className="glassmorphism p-8 rounded-2xl text-center">
                            <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary text-2xl">
                                <FaHeart />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Inclusive Culture</h3>
                            <p className="text-text-muted">We value diversity and foster a supportive, collaborative workplace.</p>
                        </div>
                        <div className="glassmorphism p-8 rounded-2xl text-center">
                            <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary text-2xl">
                                <FaLaptopCode />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Cutting-Edge Tech</h3>
                            <p className="text-text-muted">Work with the latest technologies in AI, mobile, and web development.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section className="py-16 bg-background-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white mb-10 text-center">Open Positions</h2>
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {['Senior Full Stack Developer', 'Product Designer', 'Marketing Manager'].map((job, index) => (
                            <div key={index} className="glassmorphism p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{job}</h3>
                                    <p className="text-text-muted text-sm">Remote / Hybrid • Full Time</p>
                                </div>
                                <button className="px-6 py-2 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary hover:text-background-dark transition-all">
                                    Apply Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Careers;
