
import React, { useState } from 'react';

const DisputeResolution = () => {
    const [disputes, setDisputes] = useState([
        { id: 1, reporter: 'John Doe', reported: 'Ali Khan (Mechanic)', issue: 'Overcharged', status: 'Open', date: '2023-10-25', description: 'Mechanic charged 5000 PKR instead of 3000 PKR agreed upon.' },
        { id: 2, reporter: 'Jane Smith', reported: 'Bilal Ahmed (Driver)', issue: 'Late Arrival', status: 'Resolved', date: '2023-10-20', description: 'Driver was 45 minutes late.' },
        { id: 3, reporter: 'Mike Ross', reported: 'City Towing', issue: 'Vehicle Damage', status: 'In Progress', date: '2023-10-22', description: 'Scratch on bumper during towing.' },
    ]);

    const handleResolve = (id) => {
        setDisputes(disputes.map(d => d.id === id ? { ...d, status: 'Resolved' } : d));
        // API call would go here
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Dispute Resolution</h2>
                <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10">Filter</button>
                </div>
            </div>

            <div className="glassmorphism rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">Reporter</th>
                                <th className="p-4 font-medium">Reported User</th>
                                <th className="p-4 font-medium">Issue</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {disputes.map((dispute) => (
                                <tr key={dispute.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-white font-medium">{dispute.reporter}</td>
                                    <td className="p-4 text-gray-300">{dispute.reported}</td>
                                    <td className="p-4">
                                        <div className="text-white">{dispute.issue}</div>
                                        <div className="text-xs text-gray-400 truncate max-w-xs">{dispute.description}</div>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm">{dispute.date}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${dispute.status === 'Open' ? 'bg-red-500/20 text-red-400' :
                                                dispute.status === 'Resolved' ? 'bg-green-500/20 text-green-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {dispute.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {dispute.status !== 'Resolved' && (
                                            <button
                                                onClick={() => handleResolve(dispute.id)}
                                                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors border border-blue-500/30 text-sm"
                                            >
                                                Mark Resolved
                                            </button>
                                        )}
                                        {dispute.status === 'Resolved' && (
                                            <span className="text-gray-500 text-sm italic">No actions</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DisputeResolution;
