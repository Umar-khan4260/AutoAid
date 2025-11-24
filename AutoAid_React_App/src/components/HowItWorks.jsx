import React, { useState } from 'react';
import { FaExclamationCircle, FaSearchLocation, FaMapMarkedAlt } from 'react-icons/fa';

const steps = [
  {
    icon: <FaExclamationCircle />,
    title: '1. Select Emergency',
    description: 'Choose your service type from our list of emergency options.',
  },
  {
    icon: <FaSearchLocation />,
    title: '2. Get Matched',
    description: 'Our AI instantly matches you with the nearest, top-rated provider.',
  },
  {
    icon: <FaMapMarkedAlt />,
    title: '3. Track Live',
    description: "Track your provider's arrival in real-time with live GPS tracking.",
  },
];

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(-1);

  return (
    <section className="py-16 sm:py-24 bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight">How AutoAid Works</h2>
          <p className="text-text-muted mt-4 max-w-2xl mx-auto">Get back on the road in three simple steps. Our platform makes it easy to find and track help in real-time.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start relative">
          {/* Background Line */}
          <div className="absolute top-12 left-0 w-full h-0.5 hidden md:block bg-gray-800"></div>

          {/* Animated Progress Line */}
          <div
            className="absolute top-12 left-0 h-0.5 hidden md:block bg-primary transition-all duration-500 ease-out z-0"
            style={{ width: activeStep === -1 ? '0%' : `${((activeStep + 0.5) / steps.length) * 100}%` }}
          ></div>

          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center relative z-10">
              <div
                className={`flex items-center justify-center size-24 bg-card-dark border-2 rounded-full mb-4 transition-all duration-300 cursor-pointer ${index <= activeStep ? 'border-primary shadow-glow-md scale-110' : 'border-gray-700'}`}
                onMouseEnter={() => setActiveStep(index)}
                onMouseLeave={() => setActiveStep(-1)}
              >
                <span className={`text-5xl transition-colors duration-300 ${index <= activeStep ? 'text-primary' : 'text-gray-500'}`}>{step.icon}</span>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-text-muted text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
