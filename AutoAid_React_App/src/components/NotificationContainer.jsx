import React from 'react';
import { useNotification } from '../context/NotificationContext';
import Toast from './Toast';

const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-4 pointer-events-none max-w-sm w-full">
            {notifications.map((notification) => (
                <Toast 
                    key={notification.id} 
                    notification={notification} 
                    onRemove={removeNotification} 
                />
            ))}
        </div>
    );
};

export default NotificationContainer;
