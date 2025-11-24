import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const testimonials = [
    {
        name: 'Ahmed Khan',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDST2iVpTmwzvXOnCa66roPsk62QVHWFewABWvhiJUYqKYsZv87X0zB7VbIeHA-w0nR0V7Tu__fYR_z9oreDRIoy40e6CHcXcuc4h3hRfkHK2I-v8uyc1AHC3WhPAYjJNjsoQQB8_eKCTifRr3oTjn5iKpXfuEuRRVFxbvxP96oAZO2zorGzYQSkCXwN7Gzf0IB61Jvn17wMNj8rXX3oDgx1RrXVd5bci0KlVgFFfpF9oE-q64trTriv2Dvt1OILjCzs257Y1Iek3E',
        rating: 5,
        text: '"My car broke down on the motorway at midnight. AutoAid had a mechanic with me in under 20 minutes. Lifesavers!"',
    },
    {
        name: 'Fatima Ali',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4PcONV67aZNZ4CYgjRDz720cL8UExK5kFDfrIxBzPiHwrVXPlznJ_KcKW29QEWdWpVQ3Q3bgaQknQIfiqn4UenCBXfeUYWjHEoADC2LH2LvvxXdyMenfmHoqHiWNgXvhIfu7-QVWWbVnlpVKCWbPlo_3eb72N3VwDmtCL9ol1vsWy5aiBIBsrYI2466YGuR3QPtY8Qx7PjxxPmVyITN72nEWZQqqTlfBXR0sHccuc7H0w_-rYoPspV-BGPgVfHoMwTm7Ln-pDb9w',
        rating: 5,
        text: '"As a towing provider, the AutoAid platform has been incredible. It connects me with jobs efficiently and payments are always on time."',
    },
    {
        name: 'Usman Butt',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRsoMEK2QGIKIXQw0mTyY33eoS-5PbS3GLFvVALTi0JF4XxO9BMOAbiCC7-j5enqmE3LaM3F6FuxIfS0zvVtUjqIqJbD51du1_Q6iPZrcmiyubkHajK748-uXTEDw469mfYhNFneBCbYvl54Wi3eWWbJRxonv7kvRIGh1SVEw4jHK_4ue1IgHxAUuXNtTXia0hRH7w6ZWQgCBI9jNBHKSjzU7Z4_TRbtMhPcA_zzDGvGLrdF7MorU8dP78U4Lq-H18u3jfJ-6Dxg',
        rating: 4.5,
        text: '"The AI driver service is genius! I felt unwell during a long drive and was able to get a temporary driver to take over. Felt very safe."',
    },
];

const Testimonials = () => {
    // Duplicate testimonials to create a seamless scrolling effect
    const row1 = [...testimonials, ...testimonials, ...testimonials, ...testimonials];
    const row2 = [...testimonials, ...testimonials, ...testimonials, ...testimonials];

    return (
        <section className="py-16 sm:py-24 bg-background-dark overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                <div className="text-center">
                    <h2 className="text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight">Trusted by Drivers Across Pakistan</h2>
                    <p className="text-text-muted mt-4 max-w-2xl mx-auto">See what our users and providers have to say about their AutoAid experience.</p>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* First Row - Scrolls Left to Right */}
                <div className="relative w-full overflow-hidden">
                    <div className="flex gap-8 animate-scroll-right w-max pause-on-hover pl-4">
                        {row1.map((testimonial, index) => (
                            <div key={`row1-${index}`} className="glassmorphism p-6 rounded-xl flex flex-col w-[350px] shrink-0">
                                <div className="flex items-center mb-4">
                                    <img
                                        className="size-12 rounded-full mr-4 border-2 border-primary/50"
                                        alt={`Profile picture of ${testimonial.name}`}
                                        src={testimonial.image}
                                    />
                                    <div>
                                        <p className="font-bold text-white">{testimonial.name}</p>
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className="text-base">
                                                    {i < Math.floor(testimonial.rating) ? <FaStar /> : (i < testimonial.rating ? <FaStarHalfAlt /> : <FaRegStar />)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-text-muted text-sm italic">{testimonial.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Second Row - Scrolls Right to Left */}
                <div className="relative w-full overflow-hidden">
                    <div className="flex gap-8 animate-scroll-left w-max pause-on-hover pl-4">
                        {row2.map((testimonial, index) => (
                            <div key={`row2-${index}`} className="glassmorphism p-6 rounded-xl flex flex-col w-[350px] shrink-0">
                                <div className="flex items-center mb-4">
                                    <img
                                        className="size-12 rounded-full mr-4 border-2 border-primary/50"
                                        alt={`Profile picture of ${testimonial.name}`}
                                        src={testimonial.image}
                                    />
                                    <div>
                                        <p className="font-bold text-white">{testimonial.name}</p>
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className="text-base">
                                                    {i < Math.floor(testimonial.rating) ? <FaStar /> : (i < testimonial.rating ? <FaStarHalfAlt /> : <FaRegStar />)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-text-muted text-sm italic">{testimonial.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
