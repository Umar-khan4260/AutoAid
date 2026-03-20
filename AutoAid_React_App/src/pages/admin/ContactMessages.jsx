import React, { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import StatusBadge from '../../components/admin/StatusBadge';

const ContactMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);

    const fetchMessages = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/contact', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setMessages(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch contact messages", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const filteredMessages = messages.filter(msg =>
        msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-500/20 text-blue-400';
            case 'read': return 'bg-yellow-500/20 text-yellow-400';
            case 'replied': return 'bg-green-500/20 text-green-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader title="Contact Messages">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white dark:bg-card-dark border border-gray-300 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 w-64 shadow-sm dark:shadow-none transition-colors"
                    />
                </div>
            </AdminPageHeader>

            <AdminTable headers={['Sender', 'Subject', 'Status', 'Date', 'Actions']}>
                {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500 dark:text-white">Loading...</td></tr>
                ) : (
                    filteredMessages.map((msg) => (
                        <tr key={msg._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0">
                            <td className="p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                                        {msg.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-gray-900 dark:text-white font-medium">{msg.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{msg.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-gray-700 dark:text-gray-300 text-sm max-w-[200px] truncate">{msg.subject}</td>
                            <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(msg.status)}`}>
                                    {msg.status}
                                </span>
                            </td>
                            <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{new Date(msg.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 text-right">
                                <button
                                    onClick={() => setSelectedMessage(msg)}
                                    className="text-primary hover:text-primary/70 text-sm font-medium transition-colors"
                                >
                                    View
                                </button>
                            </td>
                        </tr>
                    ))
                )}
                {!loading && filteredMessages.length === 0 && (
                    <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                            No contact messages found.
                        </td>
                    </tr>
                )}
            </AdminTable>

            {/* View Message Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-card-dark rounded-2xl p-6 w-full max-w-lg border border-gray-200 dark:border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Message Details</h3>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
                                    <p className="text-gray-900 dark:text-white font-medium">{selectedMessage.name}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                                    <p className="text-gray-900 dark:text-white text-sm">{selectedMessage.email}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subject</label>
                                <p className="text-gray-900 dark:text-white font-medium">{selectedMessage.subject}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Message</label>
                                <div className="bg-gray-50 dark:bg-background-dark rounded-lg p-4 border border-gray-200 dark:border-white/5">
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center space-x-2">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(selectedMessage.status)}`}>
                                        {selectedMessage.status}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(selectedMessage.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactMessages;
