import React from "react";
import { Link } from "react-router-dom";
import { FaCar } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-black/50 border-t border-solid border-gray-200 dark:border-border-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="size-8 text-primary flex items-center justify-center">
                <FaCar className="text-2xl" />
              </div>
              <h2 className="text-gray-900 dark:text-white text-lg font-bold">
                AutoAid
              </h2>
            </div>
            <p className="text-gray-600 dark:text-text-muted text-sm mt-4">
              Your trusted partner on the road. Available 24/7 across Pakistan.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white tracking-wider uppercase text-sm">
              Services
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                  href="/services/breakdown-repair"
                >
                  Breakdown Repair
                </a>
              </li>
              <li>
                <a
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                  href="/services/temporary-driver"
                >
                  Temporary Driver
                </a>
              </li>
              <li>
                <a
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                  href="/services/towing-service"
                >
                  Towing
                </a>
              </li>
              <li>
                <a
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                  href="/services/fuel-delivery"
                >
                  Fuel Delivery
                </a>
              </li>
              <li>
                <a
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                  href="/services/route-planning"
                >
                  Route Planning
                </a>
              </li>
              <li>
                <a
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                  href="/services/lockout-service"
                >
                  Lockout
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white tracking-wider uppercase text-sm">
              Company
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <a
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                  href="#"
                >
                  {/* Providers */}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white tracking-wider uppercase text-sm">
              Legal
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                  href="#"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  className="text-gray-600 dark:text-text-muted hover:text-primary text-sm transition-colors"
                  href="#"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white tracking-wider uppercase text-sm">
              Follow Us
            </h4>
            <div className="flex mt-4 space-x-4">
              <a
                className="text-gray-600 dark:text-text-muted hover:text-primary transition-colors"
                href="#"
              >
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.67.88-.53 1.56-1.37 1.88-2.38-.83.49-1.74.85-2.7 1.03A4.5 4.5 0 0 0 16.5 4a4.49 4.49 0 0 0-4.49 4.49c0 .34.04.67.11.98C8.07 9.09 4.28 7.06 1.76 4.15a4.47 4.47 0 0 0-.6 2.27c0 1.56.8 2.94 2 3.75-.74-.02-1.44-.23-2.05-.57v.06c0 2.18 1.55 4 3.6 4.4-.37.1-.77.15-1.18.15-.29 0-.57-.03-.85-.08.57 1.78 2.23 3.08 4.2 3.12a9 9 0 0 1-5.57 1.92c-.36 0-.72-.02-1.07-.06A12.65 12.65 0 0 0 8.85 20c7.85 0 12.14-6.5 12.14-12.14 0-.18 0-.37-.01-.55.83-.6 1.56-1.35 2.13-2.22z"></path>
                </svg>
              </a>
              <a
                className="text-gray-600 dark:text-text-muted hover:text-primary transition-colors"
                href="#"
              >
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"></path>
                </svg>
              </a>
              <a
                className="text-gray-600 dark:text-text-muted hover:text-primary transition-colors"
                href="#"
              >
                <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8A3.6 3.6 0 0 0 20 16.4V7.6A3.6 3.6 0 0 0 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-border-dark pt-8 text-center text-sm text-gray-600 dark:text-text-muted">
          <p>© 2024 AutoAid. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
