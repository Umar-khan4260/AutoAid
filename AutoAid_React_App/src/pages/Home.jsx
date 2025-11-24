import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';

const Home = () => {
    return (
        <div className="flex flex-col">
            <Hero />
            <Services />
            <HowItWorks />
            <Features />
            <Testimonials />
            <CTA />
        </div>
    );
};

export default Home;
