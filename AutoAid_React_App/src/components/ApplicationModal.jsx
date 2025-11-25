import React, { useState, useRef } from 'react';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';

const ApplicationModal = ({ isOpen, onClose, jobTitle }) => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        coverLetter: ''
    });

    const [errors, setErrors] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const [resume, setResume] = useState(null);
    const [resumeError, setResumeError] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const validateName = (name) => {
        if (/\d/.test(name)) {
            return 'Name cannot contain numbers';
        }
        return '';
    };

    const validateEmail = (email) => {
        if (!email.includes('@')) {
            return 'Email must contain @';
        }
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return '';
    };

    const validatePhone = (phone) => {
        if (phone.length > 12) {
            return 'Phone number cannot exceed 12 digits';
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Filter input based on field
        if (name === 'name') {
            // Remove numbers from name
            const filteredValue = value.replace(/\d/g, '');
            setFormData(prev => ({ ...prev, [name]: filteredValue }));
        } else if (name === 'phone') {
            // Only allow numbers and limit to 12 digits
            const filteredValue = value.replace(/\D/g, '').slice(0, 12);
            setFormData(prev => ({ ...prev, [name]: filteredValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;

        if (name === 'name') {
            const error = validateName(value);
            setErrors(prev => ({ ...prev, name: error }));
        } else if (name === 'email') {
            const error = validateEmail(value);
            setErrors(prev => ({ ...prev, email: error }));
        } else if (name === 'phone') {
            const error = validatePhone(value);
            setErrors(prev => ({ ...prev, phone: error }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            setResumeError('Only PDF files are allowed');
            setResume(null);
            return;
        }

        // Validate file size (5MB = 5 * 1024 * 1024 bytes)
        if (file.size > 5 * 1024 * 1024) {
            setResumeError('File size exceeds 5MB');
            setResume(null);
            return;
        }

        // File is valid
        setResume(file);
        setResumeError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate all fields
        const nameError = validateName(formData.name);
        const emailError = validateEmail(formData.email);
        const phoneError = validatePhone(formData.phone);

        if (nameError || emailError || phoneError) {
            setErrors({
                name: nameError,
                email: emailError,
                phone: phoneError
            });
            return;
        }

        // Simulate API call
        setTimeout(() => {
            setIsSubmitted(true);
        }, 1000);
    };

    const handleClose = () => {
        setIsSubmitted(false);
        setFormData({ name: '', email: '', phone: '', coverLetter: '' });
        setErrors({ name: '', email: '', phone: '' });
        setResume(null);
        setResumeError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-[#121A2A] rounded-2xl border border-border-dark shadow-2xl overflow-hidden animate-fadeIn">

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
                >
                    <FaTimes className="text-xl" />
                </button>

                {isSubmitted ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="size-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 text-4xl animate-bounce-short">
                            <FaCheckCircle />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Application Sent!</h3>
                        <p className="text-text-muted mb-8">
                            Thanks for applying to be a <span className="text-primary">{jobTitle}</span>. We'll be in touch soon.
                        </p>
                        <button
                            onClick={handleClose}
                            className="px-8 py-3 rounded-full bg-primary text-background-dark font-bold hover:bg-primary-dark transition-all"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-white mb-1">Apply for this role</h2>
                        <p className="text-primary text-sm font-medium mb-6">{jobTitle}</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className={`w-full px-4 py-3 rounded-xl bg-background-dark border ${errors.name ? 'border-red-500' : 'border-border-dark'} text-white focus:outline-none focus:border-primary transition-colors`}
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                                    <input
                                        type="text"
                                        name="email"
                                        required
                                        className={`w-full px-4 py-3 rounded-xl bg-background-dark border ${errors.email ? 'border-red-500' : 'border-border-dark'} text-white focus:outline-none focus:border-primary transition-colors`}
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        required
                                        className={`w-full px-4 py-3 rounded-xl bg-background-dark border ${errors.phone ? 'border-red-500' : 'border-border-dark'} text-white focus:outline-none focus:border-primary transition-colors`}
                                        placeholder="+92 300 1234567"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-1">Cover Letter (Optional)</label>
                                <textarea
                                    rows="3"
                                    name="coverLetter"
                                    className="w-full px-4 py-3 rounded-xl bg-background-dark border border-border-dark text-white focus:outline-none focus:border-primary transition-colors resize-none"
                                    placeholder="Tell us why you're a great fit..."
                                    value={formData.coverLetter}
                                    onChange={handleChange}
                                />
                            </div>


                            <div className="pt-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full py-3 rounded-xl border-2 border-dashed ${resumeError ? 'border-red-500' : 'border-border-dark'} text-text-muted hover:text-white hover:border-primary/50 transition-colors mb-2 flex items-center justify-center gap-2`}
                                >
                                    <span>{resume ? resume.name : 'Upload Resume (PDF)'}</span>
                                </button>
                                {resumeError && <p className="text-red-500 text-xs mb-2">{resumeError}</p>}
                                {resume && !resumeError && <p className="text-green-500 text-xs mb-2">✓ Resume uploaded</p>}

                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-primary text-background-dark font-bold hover:bg-primary-dark hover:shadow-button-glow transition-all"
                                >
                                    Submit Application
                                </button>
                            </div>

                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicationModal;
