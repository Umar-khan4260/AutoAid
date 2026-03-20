import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTools, FaGasPump, FaUserTie, FaTruck, FaKey, FaUpload, FaCar } from 'react-icons/fa';
import { MdPerson, MdMail, MdCall, MdCalendarToday, MdLock } from 'react-icons/md';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const ProviderSignup = () => {
    const navigate = useNavigate();
    const [serviceType, setServiceType] = useState('');
    const [files, setFiles] = useState({});
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        contactNumber: '',
        dob: '',
        gender: '',
        towingVehicleNumber: '',
        towingMake: '',
        towingModel: '',
        password: '',
        confirmPassword: '',
    });

    const handleServiceSelect = (type) => {
        setServiceType(type);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'fullName') {
            // Only allow alphabets and spaces
            if (/^[a-zA-Z\s]*$/.test(value)) {
                setFormData((prev) => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e, id) => {
        const file = e.target.files[0];
        const fileName = file ? file.name : 'No file chosen';
        document.getElementById(`${id}-name`).textContent = fileName;
        
        // Map id to backend field name
        let fieldName = '';
        if (id === 'profile-pic') fieldName = 'profileImage';
        if (id === 'cnic-pic') fieldName = 'cnicImage';
        if (id === 'license-pic') fieldName = 'licenseImage';

        if (file && fieldName) {
            setFiles(prev => ({ ...prev, [fieldName]: file }));
        }
    };

    const calculateAge = (dob) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        const age = calculateAge(formData.dob);
        if (age < 18) {
            alert("You must be at least 18 years old to register as a provider.");
            return;
        }

        try {
            // 1. Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            console.log('Firebase User Created:', user.uid);

            // 2. Prepare FormData
            const data = new FormData();
            data.append('uid', user.uid);
            data.append('role', 'provider');
            data.append('serviceType', serviceType);
            data.append('age', age.toString());
            
            // Append text fields
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });

            // Append files
            Object.keys(files).forEach(key => {
                data.append(key, files[key]);
            });

            // 3. Send to Backend
            const response = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                body: data, // No Content-Type header needed for FormData
            });

            const result = await response.json();

            if (response.ok) {
                navigate('/verify-account', { state: { email: formData.email } });
            } else {
                alert(`Error: ${result.error}`);
            }

        } catch (error) {
            console.error("Signup Error:", error);
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-white font-display transition-colors duration-300">
            <header className="absolute top-0 left-0 right-0 z-10 p-4 sm:p-6">
                <div className="container mx-auto max-w-7xl">
                    <Link to="/" className="flex items-center gap-3 group w-fit">
                        <div className="size-12 text-primary group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300 flex items-center justify-center">
                            <FaCar className="text-4xl" />
                        </div>
                        <h2 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">
                            AutoAid
                        </h2>
                    </Link>
                </div>
            </header>
            <main className="flex flex-grow w-full">
                <div className="flex items-stretch w-full">
                    <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gray-100 dark:bg-gray-900 relative">
                        <img
                            alt="Service provider helping a motorist"
                            className="absolute h-full w-full object-cover opacity-30"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM-rLn82Hbq4z48Rm6B6xzCfVDn3Bd2Cw-0yoebQNSgXqIFfca1aPh3WcIt5iYjEWr5ld_mKVZZNoGxuVEmS_bmj8XLiMtywIl7DKFoiO6Yf10YmM235HnoUeOdmN-7faO_IncRwCPFZ3OeeYvgym6wlhC1TzCQUMTRMAer-skIgQqmiseNpEFQc_b61hu4aehiIbgV2nLxtRLTAmfurmzNe8Fk64BCcqkSQuddZomVPU01Q9XOK5LOMlGNFWTFy4dWkEmJEruAv5q"
                        />
                        <div className="relative z-10 text-center text-gray-900 dark:text-white p-12 max-w-lg">
                            <h2 className="text-4xl font-bold mb-4">Become an AutoAid Service Partner.</h2>
                            <p className="text-lg text-gray-700 dark:text-gray-300">
                                Join our network of trusted professionals and help drivers get back on the road. Your skills are needed.
                            </p>
                        </div>
                    </div>
                    <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
                        <div className="w-full max-w-md p-6 sm:p-8 space-y-4 bg-white dark:bg-card-dark rounded-lg shadow-xl border border-gray-200 dark:border-border-dark overflow-y-auto max-h-[95vh]">
                            <div className="text-center">
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-text-dark">Service Provider Registration</h1>
                                <p className="mt-2 text-gray-600 dark:text-subtle-dark">Join our network to provide assistance.</p>
                            </div>
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark mb-2">Service Type</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                                        {[
                                            { id: 'breakdown-assistance', icon: FaTools, label: 'Breakdown' },
                                            { id: 'fuel-provider', icon: FaGasPump, label: 'Fuel' },
                                            { id: 'temporary-driver', icon: FaUserTie, label: 'Driver' },
                                            { id: 'towing-service', icon: FaTruck, label: 'Towing' },
                                            { id: 'lockout-assistance', icon: FaKey, label: 'Lockout' },
                                        ].map((service) => (
                                            <div
                                                key={service.id}
                                                className={`flex flex-col items-center p-2 border rounded-lg cursor-pointer transition-colors ${serviceType === service.id
                                                    ? 'border-primary bg-primary/10 dark:bg-gray-700'
                                                    : 'border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                                onClick={() => handleServiceSelect(service.id)}
                                            >
                                                <service.icon className="w-8 h-8 mb-1 text-primary" />
                                                <span className="text-xs text-subtle-dark leading-tight">{service.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {serviceType && (
                                    <div className="space-y-4 animate-fadeIn">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="fullName">Full Name</label>
                                            <div className="mt-1 relative">
                                                <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-subtle-dark pointer-events-none text-xl" />
                                                <input
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-border-dark rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-text-dark"
                                                    id="fullName"
                                                    name="fullName"
                                                    placeholder="John Doe"
                                                    required
                                                    type="text"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-subtle-dark" htmlFor="email">Email Address</label>
                                            <div className="mt-1 relative">
                                                <MdMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-subtle-dark pointer-events-none text-xl" />
                                                <input
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-border-dark rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-text-dark"
                                                    id="email"
                                                    name="email"
                                                    placeholder="you@example.com"
                                                    required
                                                    type="email"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-subtle-dark" htmlFor="contactNumber">Contact Number</label>
                                            <div className="mt-1 relative">
                                                <MdCall className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-subtle-dark pointer-events-none text-xl" />
                                                <input
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-border-dark rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-text-dark"
                                                    id="contactNumber"
                                                    name="contactNumber"
                                                    placeholder="(123) 456-7890"
                                                    required
                                                    type="tel"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="dob">Date of Birth</label>
                                                <input
                                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-text-dark"
                                                    id="dob"
                                                    name="dob"
                                                    required
                                                    type="date"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="gender">Gender</label>
                                                <select
                                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-text-dark"
                                                    id="gender"
                                                    name="gender"
                                                    required
                                                    defaultValue=""
                                                    onChange={handleChange}
                                                >
                                                    <option disabled value="">Select</option>
                                                    <option>Male</option>
                                                    <option>Female</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* File Uploads */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark">Profile Picture</label>
                                            <div className="mt-1 flex items-center justify-between p-2 border border-gray-300 dark:border-border-dark rounded-md bg-white dark:bg-gray-700">
                                                <span className="flex-1 min-w-0 text-sm text-gray-600 dark:text-subtle-dark truncate" id="profile-pic-name">No file chosen</span>
                                                <label className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-subtle-dark bg-gray-200 dark:bg-gray-600 border border-transparent rounded-md cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500">
                                                    <FaUpload className="mr-2" /> Choose File
                                                    <input accept="image/*" className="hidden" type="file" onChange={(e) => handleFileChange(e, 'profile-pic')} />
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark">CNIC Picture</label>
                                            <div className="mt-1 flex items-center justify-between p-2 border border-gray-300 dark:border-border-dark rounded-md bg-white dark:bg-gray-700">
                                                <span className="flex-1 min-w-0 text-sm text-gray-600 dark:text-subtle-dark truncate" id="cnic-pic-name">No file chosen</span>
                                                <label className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-subtle-dark bg-gray-200 dark:bg-gray-600 border border-transparent rounded-md cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500">
                                                    <FaUpload className="mr-2" /> Choose File
                                                    <input accept="image/*" className="hidden" type="file" onChange={(e) => handleFileChange(e, 'cnic-pic')} />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Conditional Fields */}
                                        {serviceType === 'temporary-driver' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark">Driving License Picture</label>
                                                <div className="mt-1 flex items-center justify-between p-2 border border-gray-300 dark:border-border-dark rounded-md bg-white dark:bg-gray-700">
                                                    <span className="flex-1 min-w-0 text-sm text-gray-600 dark:text-subtle-dark truncate" id="license-pic-name">No file chosen</span>
                                                    <label className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-subtle-dark bg-gray-200 dark:bg-gray-600 border border-transparent rounded-md cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500">
                                                        <FaUpload className="mr-2" /> Choose File
                                                        <input accept="image/*" className="hidden" type="file" onChange={(e) => handleFileChange(e, 'license-pic')} />
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {serviceType === 'towing-service' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="towingVehicleNumber">Towing Vehicle Number</label>
                                                    <input
                                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-border-dark rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-text-dark"
                                                        id="towingVehicleNumber"
                                                        name="towingVehicleNumber"
                                                        placeholder="ABC-123"
                                                        type="text"
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="towingMake">Make</label>
                                                    <input
                                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-border-dark rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-text-dark"
                                                        id="towingMake"
                                                        name="towingMake"
                                                        placeholder="Ford"
                                                        type="text"
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="towingModel">Model</label>
                                                    <input
                                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-border-dark rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-text-dark"
                                                        id="towingModel"
                                                        name="towingModel"
                                                        placeholder="F-150"
                                                        type="text"
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="password">Password</label>
                                            <div className="mt-1 relative">
                                                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-subtle-dark pointer-events-none text-xl" />
                                                <input
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-border-dark rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-text-dark"
                                                    id="password"
                                                    name="password"
                                                    placeholder="••••••••"
                                                    required
                                                    type="password"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-subtle-dark" htmlFor="confirmPassword">Confirm Password</label>
                                            <div className="mt-1 relative">
                                                <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-subtle-dark pointer-events-none text-xl" />
                                                <input
                                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-border-dark rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-text-dark"
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    placeholder="••••••••"
                                                    required
                                                    type="password"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-primary hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-card-dark focus:ring-primary transition-colors duration-200"
                                                type="submit"
                                            >
                                                Sign Up
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>

                            {serviceType && (
                                <div className="animate-fadeIn">

                                    <div className="text-center text-sm text-gray-600 dark:text-subtle-dark mt-4">
                                        <p>
                                            Already have an account?{' '}
                                            <Link className="font-medium text-primary hover:underline" to="/login">
                                                Log In
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProviderSignup;
