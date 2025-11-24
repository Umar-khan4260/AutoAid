import React from 'react';

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="https://videos.pexels.com/video-files/4489760/4489760-uhd_2560_1440_25fps.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-background-dark/80"></div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-10"></div>

      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center p-4 relative z-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tighter">
            Fast, Reliable Roadside Assistance — Anytime, Anywhere.
          </h1>
          <h2 className="text-text-muted text-base sm:text-lg font-normal leading-normal max-w-2xl mx-auto">
            Connecting you with verified mechanics, AI-powered temporary drivers, fuel delivery, towing, and more. Instantly.
          </h2>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center mt-4">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-background-dark text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity shadow-glow-md">
              <span className="truncate">Get Help Now</span>
            </button>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-transparent border border-border-dark text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-white/10 transition-colors">
              <span className="truncate">Become a Provider</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
