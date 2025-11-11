import React from 'react';
import { useAppContext } from '../context/AppContext';

const Sidebar = ({ isOpen, onClose, visibleTabs, activeTab, setActiveTab }) => {
    const { user, handleLogout } = useAppContext();

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        onClose();
    };

    return (
        <div id="sidebar" className={`fixed inset-0 z-40 md:hidden ${isOpen ? '' : 'pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            ></div>
            {/* Sidebar Content */}
            <div
                className={`relative z-10 w-72 bg-gray-800 text-white h-full p-4 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg">เมนู</h3>
                    <button onClick={onClose} className="p-2 text-2xl leading-none">&times;</button>
                </div>

                <nav className="flex-grow">
                    <ul className="flex flex-col gap-2">
                        {visibleTabs.map(tab => (
                            <li key={tab.id}>
                                <button
                                    onClick={() => handleTabClick(tab.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'}`}
                                >
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {user && (
                    <div className="mt-auto pt-6 border-t border-gray-700">
                        <div className="flex flex-col items-start gap-2">
                            <span className="text-sm font-semibold">{user.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white">{user.role}</span>
                            <button
                                onClick={() => {
                                    handleLogout();
                                    onClose();
                                }}
                                className="mt-4 w-full px-4 py-2 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition text-sm"
                            >
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
