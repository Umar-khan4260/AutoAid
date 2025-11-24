import React, { useState } from 'react';

const AuditLogs = () => {
    const [logs] = useState([
        { id: 1, admin: 'Admin User', action: 'Approved Provider', target: 'Ali Khan', date: '2023-10-25 10:30 AM', details: 'Verified documents and approved application.' },
        { id: 2, admin: 'Admin User', action: 'Suspended User', target: 'Mike Ross', date: '2023-10-24 02:15 PM', details: 'Suspended due to multiple reports.' },
        { id: 3, admin: 'Super Admin', action: 'Resolved Dispute', target: 'Dispute #2', date: '2023-10-23 09:45 AM', details: 'Refund issued to user.' },
        { id: 4, admin: 'Admin User', action: 'Updated Settings', target: 'System', date: '2023-10-22 11:20 AM', details: 'Changed default commission rate.' },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Audit Logs</h2>
                <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10">Export Logs</button>
                </div>
            </div>

            <div className="glassmorphism rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">Date & Time</th>
                                <th className="p-4 font-medium">Admin</th>
                                <th className="p-4 font-medium">Action</th>
                                <th className="p-4 font-medium">Target</th>
                                <th className="p-4 font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-gray-400 text-sm whitespace-nowrap">{log.date}</td>
                                    <td className="p-4 text-white font-medium">{log.admin}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary border border-primary/30">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-300">{log.target}</td>
                                    <td className="p-4 text-gray-400 text-sm">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
