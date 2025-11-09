import React, { useState, useEffect } from 'react';
import { getEquipmentList, getAllUsers } from '../../api/firestoreApi';
import { statusMap } from '../../utils/helpers';

const SummaryCards = () => {
    const [stats, setStats] = useState({
        userCount: 0,
        statusCounts: {},
    });
    const [loading, setLoading] = useState(true);
    const [displayStatus, setDisplayStatus] = useState('available');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [allEquipment, allUsers] = await Promise.all([
                    getEquipmentList(),
                    getAllUsers(),
                ]);

                const statusCounts = allEquipment.reduce((acc, item) => {
                    acc[item.status] = (acc[item.status] || 0) + 1;
                    return acc;
                }, {});

                setStats({
                    userCount: allUsers.length,
                    statusCounts: statusCounts,
                });
            } catch (error) {
                console.error("Failed to fetch summary stats:", error);
            }
            setLoading(false);
        };

        fetchStats();
    }, []);

    const statusesToShow = ['available', 'borrowed', 'under_maintenance', 'pending_repair_approval'];

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-[var(--border-color)] shadow-sm">
                <p className="text-sm text-gray-700">สถานะอุปกรณ์: <span className="font-semibold text-[var(--primary-color)]">{statusMap[displayStatus]?.text || displayStatus}</span></p>
                {loading ? (
                    <div className="h-12 w-24 bg-gray-200 animate-pulse rounded-md mt-1"></div>
                ) : (
                    <p className="text-4xl font-bold text-[var(--text-color-dark)]">{stats.statusCounts[displayStatus] || 0}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                    {statusesToShow.map(status => (
                        <button 
                            key={status}
                            onClick={() => setDisplayStatus(status)}
                            className={`text-xs px-2 py-1 rounded-full ${displayStatus === status ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                            {statusMap[status]?.text || status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[var(--border-color)] shadow-sm">
                <p className="text-sm text-gray-700">ผู้ใช้ในระบบทั้งหมด</p>
                {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded-md mt-1"></div>
                ) : (
                    <p className="text-2xl font-bold text-[var(--text-color-dark)]">{stats.userCount}</p>
                )}
            </div>
        </div>
    );
};

export default SummaryCards;