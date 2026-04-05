import React, { useEffect, useState } from 'react';
import { 
    FaCheckCircle, 
    FaExclamationCircle, 
    FaInfoCircle, 
    FaExclamationTriangle,
    FaTimes 
} from 'react-icons/fa';

const Toast = ({ notification, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);
    const { id, message, type, duration } = notification;

    const icons = {
        success: <FaCheckCircle className="text-green-500" />,
        error: <FaExclamationCircle className="text-red-500" />,
        warning: <FaExclamationTriangle className="text-yellow-500" />,
        info: <FaInfoCircle className="text-primary" />,
    };

    const colors = {
        success: 'border-green-500/20 dark:border-green-500/30',
        error: 'border-red-500/20 dark:border-red-500/30',
        warning: 'border-yellow-500/20 dark:border-yellow-500/30',
        info: 'border-primary/20 dark:border-primary/30',
    };

    useEffect(() => {
        if (duration !== Infinity) {
            const timer = setTimeout(() => {
                setIsExiting(true);
            }, duration - 400); // Start exit animation 400ms before removal
            return () => clearTimeout(timer);
        }
    }, [duration]);

    return (
        <div 
            className={`flex items-center gap-4 px-5 py-4 rounded-xl shadow-xl transition-all duration-300 border backdrop-blur-md 
            ${colors[type]} bg-white/90 dark:bg-surface-dark/90 
            ${isExiting ? 'opacity-0 translate-x-10 scale-95' : 'opacity-100 translate-x-0 scale-100'}
            animate-fade-in-right max-w-sm w-full group pointer-events-auto`}
        >
            <div className="text-2xl flex-shrink-0">
                {icons[type]}
            </div>
            
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                    {message}
                </p>
            </div>
            
            <button 
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => onRemove(id), 300);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
                <FaTimes size={14} />
            </button>

            {/* Progress Bar (optional visually) */}
            {duration !== Infinity && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 transition-all duration-linear"
                     style={{ 
                         width: isExiting ? '0%' : '100%', 
                         transitionDuration: isExiting ? '0ms' : `${duration}ms`,
                         color: type === 'info' ? 'var(--color-primary)' : type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'
                     }}
                />
            )}
        </div>
    );
};

export default Toast;
