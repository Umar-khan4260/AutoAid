import React from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

const Contact = () => {
    return (
        <div className="pt-20">
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
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-text-muted text-sm font-medium mb-2">Name</label>
                                        <input type="text" className="w-full bg-[#121A2A] border border-border-dark rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="Your Name" />
                                    </div>
                                    <div>
                                        <label className="block text-text-muted text-sm font-medium mb-2">Email</label>
                                        <input type="email" className="w-full bg-[#121A2A] border border-border-dark rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="your@email.com" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-text-muted text-sm font-medium mb-2">Subject</label>
                                    <input type="text" className="w-full bg-[#121A2A] border border-border-dark rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="How can we help?" />
                                </div>
                                <div>
                                    <label className="block text-text-muted text-sm font-medium mb-2">Message</label>
                                    <textarea rows="4" className="w-full bg-[#121A2A] border border-border-dark rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="Your message..."></textarea>
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
