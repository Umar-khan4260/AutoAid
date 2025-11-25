import React, { useState } from 'react';
import { FaMapMarkedAlt, FaHandsHelping, FaMobileAlt } from 'react-icons/fa';
import ApplicationModal from '../components/ApplicationModal';

const Careers = () => {
    const [selectedJob, setSelectedJob] = useState(null);

    return (
        <div className="pt-0">
            {/* Hero Section */}
            <section className="relative py-20 bg-background-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Drive the Future of Roadside Assistance</h1>
                    <p className="text-xl text-text-muted max-w-3xl mx-auto">
                        Join AutoAid and help us build a safer, stress-free driving experience for everyone. We're connecting drivers with immediate help when they need it most.
                    </p>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-16 bg-[#121A2A]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="glassmorphism p-8 rounded-2xl text-center">
                            <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary text-2xl">
                                <FaHandsHelping />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Real-World Impact</h3>
                            <p className="text-text-muted">Every line of code you write helps someone stranded on the road get home safely.</p>
                        </div>
                        <div className="glassmorphism p-8 rounded-2xl text-center">
                            <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary text-2xl">
                                <FaMapMarkedAlt />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Innovation at Core</h3>
                            <p className="text-text-muted">Work on smart routing, real-time tracking, and seamless service matching algorithms.</p>
                        </div>
                        <div className="glassmorphism p-8 rounded-2xl text-center">
                            <div className="size-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary text-2xl">
                                <FaMobileAlt />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Mobile First</h3>
                            <p className="text-text-muted">Build intuitive experiences for drivers and service providers on the go.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section className="py-16 bg-background-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white mb-10 text-center">Open Positions</h2>
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {[
                            { title: 'Operations Manager', type: 'Remote / Hybrid • Full Time' },
                            { title: 'Customer Support Specialist', type: 'Remote • Shift Based' },
                            { title: 'Senior Mobile Developer (React Native)', type: 'Remote • Full Time' },
                            { title: 'Backend Engineer (Node.js/Geo)', type: 'Remote • Full Time' }
                        ].map((job, index) => (
                            <div key={index} className="glassmorphism p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{job.title}</h3>
                                    <p className="text-text-muted text-sm">{job.type}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedJob(job.title)}
                                    className="px-6 py-2 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary hover:text-background-dark transition-all"
                                >
                                    Apply Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <ApplicationModal
                isOpen={!!selectedJob}
                onClose={() => setSelectedJob(null)}
                jobTitle={selectedJob}
            />
        </div>
    );
};

export default Careers;
