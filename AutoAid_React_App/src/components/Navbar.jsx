import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaChevronDown, FaCar, FaTimes } from 'react-icons/fa';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isServicesOpen, setIsServicesOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full transition-all duration-300 glassmorphism shadow-nav">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="size-12 text-primary group-hover:text-white transition-colors duration-300 flex items-center justify-center">
                                <FaCar className="text-4xl" />
                            </div>
                            <h2 className="text-white text-3xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">AutoAid</h2>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link to="/" className="text-white text-base font-medium leading-normal transition-colors nav-link-underline active">Home</Link>

                        {/* Services Dropdown */}
                        <div className="relative group">
                            <button
                                className="text-text-muted text-base font-medium leading-normal hover:text-white transition-colors nav-link-underline flex items-center gap-1 focus:outline-none"
                            >
                                Services
                                <FaChevronDown className="text-xs transition-transform duration-300 group-hover:rotate-180" />
                            </button>
                            <div className="absolute left-0 mt-2 w-max min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 transform group-hover:translate-y-0 translate-y-2 z-50 pt-2">
                                <div className="glassmorphism rounded-xl overflow-hidden shadow-glow-lg border border-border-dark p-2 flex flex-col gap-1 bg-[#121A2A]">
                                    {[
                                        { name: 'Breakdown Repair', path: '/services/breakdown-repair' },
                                        { name: 'Temporary Driver', path: '/services/temporary-driver' },
                                        { name: 'Fuel Delivery', path: '/services/fuel-delivery' },
                                        { name: 'Lockout Service', path: '/services/lockout-service' },
                                        { name: 'Towing Service', path: '/services/towing-service' },
                                        { name: 'Route Planning', path: '#' }
                                    ].map((item, index) => (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            className="block px-4 py-2 text-sm text-text-muted hover:text-white transition-all duration-500 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group/item"
                                            style={{ transitionDelay: `${index * 150}ms` }}
                                        >
                                            <span className="relative inline-block">
                                                {item.name}
                                                <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-[#13c8ec] transform scale-x-0 transition-transform duration-300 origin-bottom-right group-hover/item:scale-x-100 group-hover/item:origin-bottom-left"></span>
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>


                        <Link to="/careers" className="text-text-muted text-base font-medium leading-normal hover:text-white transition-colors nav-link-underline">Careers</Link>
                        <Link to="/about" className="text-text-muted text-base font-medium leading-normal hover:text-white transition-colors nav-link-underline">About Us</Link>
                        <Link to="/contact" className="text-text-muted text-base font-medium leading-normal hover:text-white transition-colors nav-link-underline">Contact</Link>
                    </nav>

                    <div className="hidden lg:flex items-center gap-3">
                        <Link to="/login" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-5 text-white text-sm font-bold leading-normal tracking-wide hover:bg-white/10 transition-colors duration-300">
                            <span className="truncate">Login</span>
                        </Link>
                        <Link to="/signup" className="relative flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-5 bg-gradient-to-r from-primary to-blue-500 text-background-dark text-sm font-bold leading-normal tracking-wide transition-all duration-300 hover:shadow-button-glow hover:scale-105">
                            <span className="truncate">Sign Up</span>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden">
                        <button
                            className="text-white p-2 focus:outline-none"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <FaTimes className="text-3xl" /> : <FaBars className="text-3xl" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`lg:hidden absolute top-20 left-0 w-full bg-[#121A2A] border-b border-border-dark shadow-xl transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                <div className="px-4 pt-2 pb-6 space-y-2">
                    <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-white bg-primary/10">Home</Link>

                    {/* Mobile Services Dropdown */}
                    <div>
                        <button
                            onClick={() => setIsServicesOpen(!isServicesOpen)}
                            className="flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium text-text-muted hover:text-white hover:bg-white/5"
                        >
                            Services
                            <FaChevronDown className={`text-xs transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`${isServicesOpen ? 'block' : 'hidden'} pl-4 space-y-1 mt-1`}>
                            {[
                                { name: 'Breakdown Repair', path: '/services/breakdown-repair' },
                                { name: 'Temporary Driver', path: '/services/temporary-driver' },
                                { name: 'Fuel Delivery', path: '/services/fuel-delivery' },
                                { name: 'Lockout Service', path: '/services/lockout-service' },
                                { name: 'Towing Service', path: '/services/towing-service' },
                                { name: 'Route Planning', path: '#' }
                            ].map((item) => (
                                <Link key={item.name} to={item.path} className="block px-3 py-2 rounded-md text-sm font-medium text-text-muted hover:text-white hover:bg-white/5">
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>


                    <Link to="/careers" className="block px-3 py-2 rounded-md text-base font-medium text-text-muted hover:text-white hover:bg-white/5">Careers</Link>
                    <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-text-muted hover:text-white hover:bg-white/5">About Us</Link>
                    <Link to="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-text-muted hover:text-white hover:bg-white/5">Contact</Link>

                    <div className="pt-4 flex flex-col gap-3">
                        <Link to="/login" className="w-full flex items-center justify-center rounded-full h-10 px-5 text-white text-sm font-bold border border-white/20 hover:bg-white/10 transition-colors">
                            Login
                        </Link>
                        <Link to="/signup" className="w-full flex items-center justify-center rounded-full h-10 px-5 bg-gradient-to-r from-primary to-blue-500 text-background-dark text-sm font-bold hover:shadow-button-glow transition-all">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
