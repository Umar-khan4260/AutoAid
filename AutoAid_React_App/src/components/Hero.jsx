import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);

  return (
    <section className="relative overflow-hidden bg-background-dark">
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-50"
        >
          <source src="/AutoAid_video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

      </div>



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
            <Link to="/provider-signup" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-transparent border border-border-dark text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-white/10 transition-colors">
              <span className="truncate">Become a Provider</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
