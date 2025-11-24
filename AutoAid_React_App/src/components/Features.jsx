import React from 'react';
import { FaMapMarkedAlt, FaNetworkWired, FaUserCheck } from 'react-icons/fa';

const features = [
    {
        icon: <FaMapMarkedAlt />,
        title: 'Real-Time GPS Tracking',
        description: 'Know exactly where your help is and when it will arrive with our live map view.',
    },
    {
        icon: <FaNetworkWired />,
        title: 'AI-Based Matching',
        description: 'Our smart algorithm connects you to the best-suited provider based on location, rating, and service type.',
    },
    {
        icon: <FaUserCheck />,
        title: 'Provider Verification System',
        description: 'All our service providers are thoroughly vetted and background-checked for your peace of mind.',
    },
];

const Features = () => {
    return (
        <section className="py-16 sm:py-24 bg-card-dark/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-br from-primary to-blue-600 opacity-20 blur-2xl rounded-xl"></div>
                        <img
                            className="relative rounded-xl shadow-2xl shadow-black/30 w-full max-w-md mx-auto"
                            alt="A smartphone screen showing a map with a car's route and provider location"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ9YV584BhZ-xM_xfi85AKJKFkmTGEKS5jvGPcIIXIVG2sSJK7pBJGLSi5qdt6vFu6Naci3zTqBggdFIgso54_fYzGVCEuRwNpKaTZnPYMcE8c-e6X4UiSW03dPylsDFPeOAMQUS14PqwsAkUPThkY2MBsAPmdVf6-U4Vfpya_UHe4ad3auJ8BpnTnxgZo42rCl5WC9G5tPnrDrNgWsDFMZzeH-eyI_fo01xivu9Q71QEhXqsbJ2Y6jPR77KdY4jXSSYOaf6Lf5LQ"
                        />
                    </div>
                    <div>
                        <h2 className="text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-6">Powered by <span className="gradient-text">Smart Technology</span></h2>
                        <p className="text-text-muted mb-8">We use cutting-edge technology to ensure your safety and provide the fastest, most reliable service possible.</p>
                        <div className="flex flex-col gap-6">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-start gap-4">
                                    <div className="flex-shrink-0 size-10 flex items-center justify-center bg-card-dark rounded-lg border border-border-dark">
                                        <span className="text-primary text-xl">{feature.icon}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{feature.title}</h4>
                                        <p className="text-text-muted text-sm">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
