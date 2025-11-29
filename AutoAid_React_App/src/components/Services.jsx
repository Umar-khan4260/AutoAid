import React from 'react';
import { Link } from 'react-router-dom';
import { FaCarCrash, FaGasPump, FaRoute, FaUnlock } from 'react-icons/fa';
import driverIcon from '../assets/driver-icon.png';
import towingIcon from '../assets/towing-icon.png';

const services = [
  {
    icon: <FaCarCrash />,
    title: 'Breakdown Repair',
    description: 'Get instant mechanical help from verified professionals near you.',
    path: '/services/breakdown-repair',
  },
  {
    icon: (
      <div
        className="w-12 h-12 bg-primary"
        style={{
          maskImage: `url(${driverIcon})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: `url(${driverIcon})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center'
        }}
      />
    ),
    title: 'Temporary Driver',
    description: 'AI-powered drivers when you need a safe and reliable replacement.',
    path: '/services/temporary-driver',
  },
  {
    icon: <FaGasPump />,
    title: 'Fuel Delivery',
    description: "Out of gas? We'll deliver fuel directly to your location.",
    path: '/services/fuel-delivery',
  },
  {
    icon: <FaRoute />,
    title: 'Route Planning',
    description: 'Smart path planning for smooth and hassle-free trips.',
    path: '/services/route-planning',
  },
  {
    icon: <FaUnlock />,
    title: 'Lockout Service',
    description: "Locked out of your car? We'll get you back in, damage-free.",
    path: '/services/lockout-service',
  },
  {
    icon: (
      <div
        className="w-12 h-12 bg-primary"
        style={{
          maskImage: `url(${towingIcon})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: `url(${towingIcon})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center'
        }}
      />
    ),
    title: 'Towing Service',
    description: 'Reliable, professional towing to any destination you choose.',
    path: '/services/towing-service',
  },
];

const Services = () => {
  return (
    <section className="py-16 sm:py-24 bg-card-dark/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="flex flex-col gap-4 p-6 bg-card-dark text-center items-center hover:scale-105 hover:shadow-glow-lg transition-all duration-300 rounded-xl border border-transparent hover:border-primary/20">
              <span className="text-5xl text-primary flex items-center justify-center h-[48px]">{service.icon}</span>
              <p className="text-white text-xl font-bold leading-normal">{service.title}</p>
              <p className="text-text-muted text-sm font-normal leading-normal">{service.description}</p>
              <Link className="mt-2 text-primary font-bold text-sm hover:underline" to={service.path}>Request Now</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
