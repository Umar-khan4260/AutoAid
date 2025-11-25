import React from 'react';

const About = () => {
    return (
        <div className="pt-0">
            {/* Hero Section */}
            <section className="relative py-20 bg-background-dark overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About AutoAid</h1>
                    <p className="text-xl text-text-muted max-w-3xl mx-auto">
                        Revolutionizing roadside assistance in Pakistan with AI-powered solutions and a trusted network of providers.
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-16 bg-[#121A2A]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="glassmorphism p-8 rounded-2xl">
                            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                            <p className="text-text-muted leading-relaxed">
                                To provide instant, reliable, and safe roadside assistance to every driver in Pakistan, ensuring that no one is ever left stranded. We aim to bridge the gap between drivers in distress and professional service providers through cutting-edge technology.
                            </p>
                        </div>
                        <div className="glassmorphism p-8 rounded-2xl">
                            <h2 className="text-2xl font-bold text-white mb-4">Our Vision</h2>
                            <p className="text-text-muted leading-relaxed">
                                To become Pakistan's leading digital platform for automotive services, creating a safer and more connected driving ecosystem where help is always just a tap away.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-16 bg-background-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white">Meet Our Team</h2>
                        <p className="text-text-muted mt-4">The passionate individuals driving AutoAid forward.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="glassmorphism p-6 rounded-xl text-center group hover:border-primary/50 transition-colors">
                                <div className="w-32 h-32 mx-auto bg-gray-700 rounded-full mb-4 overflow-hidden relative">
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                        <span className="text-4xl">?</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white">Team Member</h3>
                                <p className="text-primary text-sm mb-2">Position</p>
                                <p className="text-text-muted text-sm">Dedicated to bringing the best experience to our users.</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
