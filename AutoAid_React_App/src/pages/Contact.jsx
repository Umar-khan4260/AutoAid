import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const [errors, setErrors] = useState({
        name: '',
        email: ''
    });

    const validateName = (name) => {
        if (/\d/.test(name)) {
            return 'Name cannot contain numbers';
        }
        return '';
    };

    const validateEmail = (email) => {
        // Check for @ symbol
        if (!email.includes('@')) {
            return 'Email must contain @';
        }

        // Email regex: validates format and domain structure
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }

        return '';
    };


    const handleChange = (e) => {
        const { name, value } = e.target;

        // For name field, filter out any numbers
        if (name === 'name') {
            const filteredValue = value.replace(/\d/g, '');
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
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate all fields
        const nameError = validateName(formData.name);
        const emailError = validateEmail(formData.email);

        if (nameError || emailError) {
            setErrors({
                name: nameError,
                email: emailError
            });
            return;
        }

        // If validation passes, show success message
        alert('Message sent successfully!');

        // Reset form
        setFormData({
            name: '',
            email: '',
            subject: '',
            message: ''
        });
    };

    return (
        <div className="pt-0">
            <section className="py-20 bg-background-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Get in Touch</h1>
                        <p className="text-xl text-text-muted max-w-2xl mx-auto">
                            Have questions or need support? We're here to help. Reach out to us through any of the channels below.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Contact Form */}
                        <div className="glassmorphism p-8 rounded-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-text-muted text-sm font-medium mb-2">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`w-full bg-[#121A2A] border ${errors.name ? 'border-red-500' : 'border-border-dark'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors`}
                                            placeholder="Your Name"
                                            required
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-text-muted text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="text"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`w-full bg-[#121A2A] border ${errors.email ? 'border-red-500' : 'border-border-dark'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors`}
                                            placeholder="your@email.com"
                                            required
                                        />
                                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-text-muted text-sm font-medium mb-2">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full bg-[#121A2A] border border-border-dark rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                        placeholder="How can we help?"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-text-muted text-sm font-medium mb-2">Message</label>
                                    <textarea
                                        rows="4"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full bg-[#121A2A] border border-border-dark rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                        placeholder="Your message..."
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-500 text-background-dark font-bold py-3 rounded-lg hover:shadow-button-glow transition-all">
                                    Send Message
                                </button>
                            </form>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div className="glassmorphism p-8 rounded-2xl flex items-start gap-6">
                                <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0 text-primary text-xl">
                                    <FaMapMarkerAlt />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Visit Us</h3>
                                    <p className="text-text-muted">123 Innovation Drive, Tech Park<br />Lahore, Pakistan</p>
                                </div>
                            </div>
                            <div className="glassmorphism p-8 rounded-2xl flex items-start gap-6">
                                <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0 text-primary text-xl">
                                    <FaPhone />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Call Us</h3>
                                    <p className="text-text-muted">+92 300 1234567<br />Mon-Fri, 9am - 6pm</p>
                                </div>
                            </div>
                            <div className="glassmorphism p-8 rounded-2xl flex items-start gap-6">
                                <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0 text-primary text-xl">
                                    <FaEnvelope />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Email Us</h3>
                                    <p className="text-text-muted">support@autoaid.pk<br />info@autoaid.pk</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
