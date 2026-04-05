import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const sequenceRef = useRef(0);

    const showNotification = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++sequenceRef.current;
        setNotifications((prev) => [...prev, { id, message, type, duration }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, []);

    const success = useCallback((msg, dur) => showNotification(msg, 'success', dur), [showNotification]);
    const error = useCallback((msg, dur) => showNotification(msg, 'error', dur), [showNotification]);
    const warn = useCallback((msg, dur) => showNotification(msg, 'warning', dur), [showNotification]);
    const info = useCallback((msg, dur) => showNotification(msg, 'info', dur), [showNotification]);

    return (
        <NotificationContext.Provider value={{ showNotification, removeNotification, notifications, success, error, warn, info }}>
            {children}
        </NotificationContext.Provider>
    );
};
