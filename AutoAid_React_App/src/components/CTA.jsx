import { Link } from 'react-router-dom';

const CTA = () => {
    return (
        <section className="py-16 sm:py-24 bg-gray-50 dark:bg-card-dark/30 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-tr from-gray-100 to-transparent dark:from-card-dark dark:to-transparent p-12 rounded-xl border border-gray-200 dark:border-border-dark hover:scale-[1.02] hover:shadow-glow-lg transition-all duration-300 shadow-xl dark:shadow-none">
                <h2 className="text-gray-900 dark:text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight">Join Our Network of Providers</h2>
                <p className="text-gray-600 dark:text-text-muted mt-4 mb-8">Are you a skilled mechanic, driver, or service operator? Partner with AutoAid to grow your business, get more jobs, and help people in your community.</p>
                <Link to="/provider-signup" className="flex mx-auto min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-background-dark text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity shadow-glow-md">
                    <span className="truncate">Join as a Provider</span>
                </Link>
            </div>
        </section>
    );
};

export default CTA;
