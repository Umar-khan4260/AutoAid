import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaBars, FaChevronDown, FaCar, FaTimes, FaUserCircle, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            setIsProfileOpen(false);
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full transition-all duration-300 bg-white/80 dark:bg-[#121A2A]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 shadow-sm dark:shadow-nav">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="size-12 text-primary group-hover:text-primary-dark transition-colors duration-300 flex items-center justify-center">
                                <FaCar className="text-4xl" />
                            </div>
                            <h2 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">AutoAid</h2>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-8">
                        <NavLink 
                            to="/" 
                            end
                            className={({ isActive }) => 
                                `text-base font-medium leading-normal transition-colors nav-link-underline ${
                                    isActive ? 'text-primary dark:text-white active' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white'
                                }`
                            }
                        >
                            Home
                        </NavLink>

                        {/* Services Dropdown */}
                        <div className="relative group">
                            <button
                                className={`text-base font-medium leading-normal transition-colors nav-link-underline flex items-center gap-1 focus:outline-none ${
                                    isServicesOpen ? 'text-primary dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white'
                                }`}
                            >
                                Services
                                <FaChevronDown className="text-xs transition-transform duration-300 group-hover:rotate-180" />
                            </button>
                            <div className="absolute left-0 mt-2 w-max min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 transform group-hover:translate-y-0 translate-y-2 z-50 pt-2">
                                <div className="bg-white dark:bg-[#121A2A] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-border-dark p-2 flex flex-col gap-1">
                                    {[
                                        { name: 'Breakdown Repair', path: '/services/breakdown-repair' },
                                        { name: 'Temporary Driver', path: '/services/temporary-driver' },
                                        { name: 'Fuel Delivery', path: '/services/fuel-delivery' },
                                        { name: 'Lockout Service', path: '/services/lockout-service' },
                                        { name: 'Towing Service', path: '/services/towing-service' },
                                        { name: 'Route Planning', path: '/services/route-planning' }
                                    ].map((item, index) => (
                                        <NavLink
                                            key={item.name}
                                            to={item.path}
                                            className={({ isActive }) => 
                                                `block px-4 py-2 text-sm transition-all duration-500 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group/item rounded-lg ${
                                                    isActive ? 'text-primary dark:text-white bg-gray-50 dark:bg-white/10' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                                }`
                                            }
                                            style={{ transitionDelay: `${index * 150}ms` }}
                                        >
                                            <span className="relative inline-block">
                                                {item.name}
                                                <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-[#13c8ec] transform scale-x-0 transition-transform duration-300 origin-bottom-right group-hover/item:scale-x-100 group-hover/item:origin-bottom-left"></span>
                                            </span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        </div>


                        <NavLink 
                            to="/careers" 
                            className={({ isActive }) => 
                                `text-base font-medium leading-normal transition-colors nav-link-underline ${
                                    isActive ? 'text-primary dark:text-white active' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white'
                                }`
                            }
                        >
                            Careers
                        </NavLink>
                        <NavLink 
                            to="/about" 
                            className={({ isActive }) => 
                                `text-base font-medium leading-normal transition-colors nav-link-underline ${
                                    isActive ? 'text-primary dark:text-white active' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white'
                                }`
                            }
                        >
                            About Us
                        </NavLink>
                        <NavLink 
                            to="/contact" 
                            className={({ isActive }) => 
                                `text-base font-medium leading-normal transition-colors nav-link-underline ${
                                    isActive ? 'text-primary dark:text-white active' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white'
                                }`
                            }
                        >
                            Contact
                        </NavLink>
                    </nav>

                    <div className="hidden lg:flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none mr-2"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
                        </button>
                        {currentUser ? (
                            <div className="relative group">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 text-gray-700 dark:text-white hover:text-primary transition-colors focus:outline-none"
                                >
                                    <FaUserCircle className="text-3xl" />
                                    <span className="text-sm font-medium">{currentUser.email}</span>
                                    <FaChevronDown className={`text-xs transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {/* Profile Dropdown */}
                                <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 pt-2">
                                    <div className="bg-white dark:bg-[#121A2A] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-border-dark p-2 flex flex-col gap-1">
                                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 rounded-md transition-colors">
                                            Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-white/10 rounded-md transition-colors flex items-center gap-2"
                                        >
                                            <FaSignOutAlt /> Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-5 text-gray-700 dark:text-white text-sm font-bold leading-normal tracking-wide hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-300 border border-gray-200 dark:border-white/20">
                                    <span className="truncate">Login</span>
                                </Link>
                                <Link to="/signup" className="relative flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-5 bg-gradient-to-r from-primary to-blue-500 text-white dark:text-background-dark text-sm font-bold leading-normal tracking-wide transition-all duration-300 hover:shadow-button-glow hover:scale-105">
                                    <span className="truncate">Sign Up</span>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden">
                        <button
                            className="text-gray-900 dark:text-white p-2 focus:outline-none"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <FaTimes className="text-3xl" /> : <FaBars className="text-3xl" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`lg:hidden absolute top-20 left-0 w-full bg-white dark:bg-[#121A2A] border-b border-gray-200 dark:border-border-dark shadow-xl transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                <div className="px-4 pt-2 pb-6 space-y-2">
                    <NavLink 
                        to="/" 
                        end
                        className={({ isActive }) => 
                            `block px-3 py-2 rounded-md text-base font-medium ${
                                isActive ? 'text-primary dark:text-white bg-primary/10' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                            }`
                        }
                    >
                        Home
                    </NavLink>

                    {/* Mobile Services Dropdown */}
                    <div>
                        <button
                            onClick={() => setIsServicesOpen(!isServicesOpen)}
                            className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium ${
                                isServicesOpen ? 'text-primary dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
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
                                { name: 'Route Planning', path: '/services/route-planning' }
                            ].map((item) => (
                                <NavLink 
                                    key={item.name} 
                                    to={item.path} 
                                    className={({ isActive }) => 
                                        `block px-3 py-2 rounded-md text-sm font-medium ${
                                            isActive ? 'text-primary dark:text-white bg-primary/10 dark:bg-white/10' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`
                                    }
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>
                    </div>


                    <NavLink 
                        to="/careers" 
                        className={({ isActive }) => 
                            `block px-3 py-2 rounded-md text-base font-medium ${
                                isActive ? 'text-primary dark:text-white bg-primary/10' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                            }`
                        }
                    >
                        Careers
                    </NavLink>
                    <NavLink 
                        to="/about" 
                        className={({ isActive }) => 
                            `block px-3 py-2 rounded-md text-base font-medium ${
                                isActive ? 'text-primary dark:text-white bg-primary/10' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                            }`
                        }
                    >
                        About Us
                    </NavLink>
                    <NavLink 
                        to="/contact" 
                        className={({ isActive }) => 
                            `block px-3 py-2 rounded-md text-base font-medium ${
                                isActive ? 'text-primary dark:text-white bg-primary/10' : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                            }`
                        }
                    >
                        Contact
                    </NavLink>

                    <div className="pt-4 flex flex-col gap-3">
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 w-full text-left"
                        >
                            {theme === 'dark' ? <><FaSun /> Light Mode</> : <><FaMoon /> Dark Mode</>}
                        </button>
                        {currentUser ? (
                            <>
                                <div className="flex items-center gap-3 px-3 py-2 text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 mb-2">
                                    <FaUserCircle className="text-2xl" />
                                    <span className="text-sm font-medium">{currentUser.email}</span>
                                </div>
                                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5">Profile</Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:text-red-400 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                                >
                                    <FaSignOutAlt /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="w-full flex items-center justify-center rounded-full h-10 px-5 text-gray-700 dark:text-white text-sm font-bold border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    Login
                                </Link>
                                <Link to="/signup" className="w-full flex items-center justify-center rounded-full h-10 px-5 bg-gradient-to-r from-primary to-blue-500 text-white dark:text-background-dark text-sm font-bold hover:shadow-button-glow transition-all">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
