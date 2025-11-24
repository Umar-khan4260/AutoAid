import React, { useState } from 'react';

const ProviderApprovals = () => {
    const [providers, setProviders] = useState([
        { id: 1, name: 'Ali Khan', type: 'Mechanic', location: 'Lahore', status: 'Pending', date: '2023-10-25', documents: ['License.pdf', 'Cert.jpg'] },
        { id: 2, name: 'Bilal Ahmed', type: 'Driver', location: 'Karachi', status: 'Pending', date: '2023-10-26', documents: ['License.pdf'] },
        { id: 3, name: 'City Towing', type: 'Towing', location: 'Islamabad', status: 'Pending', date: '2023-10-27', documents: ['Reg.pdf', 'Insurance.pdf'] },
        { id: 4, name: 'Shell Pump 12', type: 'Petrol Pump', location: 'Rawalpindi', status: 'Pending', date: '2023-10-28', documents: ['BusinessReg.pdf'] },
    ]);

    const handleApprove = (id) => {
        setProviders(providers.filter(p => p.id !== id));
        // API call to approve would go here
        alert(`Provider ${id} approved!`);
    };

    const handleReject = (id) => {
        setProviders(providers.filter(p => p.id !== id));
        // API call to reject would go here
        alert(`Provider ${id} rejected!`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Provider Approvals</h2>
                <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10">Filter</button>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10">Export</button>
                </div>
            </div>

            <div className="glassmorphism rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">Provider</th>
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Location</th>
                                <th className="p-4 font-medium">Date Applied</th>
                                <th className="p-4 font-medium">Documents</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {providers.map((provider) => (
                                <tr key={provider.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                {provider.name.charAt(0)}
                                            </div>
                                            <span className="text-white font-medium">{provider.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                            {provider.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-300">{provider.location}</td>
                                    <td className="p-4 text-gray-400 text-sm">{provider.date}</td>
                                    <td className="p-4">
                                        <div className="flex space-x-2">
                                            {provider.documents.map((doc, i) => (
                                                <span key={i} className="text-xs text-primary underline cursor-pointer hover:text-primary/80">{doc}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleApprove(provider.id)}
                                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors border border-green-500/30 text-sm"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(provider.id)}
                                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors border border-red-500/30 text-sm"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {providers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400">
                                        No pending approvals found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProviderApprovals;
