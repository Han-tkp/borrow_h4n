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
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-500">สถานะอุปกรณ์: <span className="font-semibold text-indigo-600">{statusMap[displayStatus]?.text || displayStatus}</span></p>
                {loading ? (
                    <div className="h-12 w-24 bg-slate-200 animate-pulse rounded-md mt-1"></div>
                ) : (
                    <p className="text-4xl font-bold text-slate-900">{stats.statusCounts[displayStatus] || 0}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                    {statusesToShow.map(status => (
                        <button 
                            key={status}
                            onClick={() => setDisplayStatus(status)}
                            className={`text-xs px-2 py-1 rounded-full ${displayStatus === status ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {statusMap[status]?.text || status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-500">ผู้ใช้ในระบบทั้งหมด</p>
                {loading ? (
                    <div className="h-8 w-16 bg-slate-200 animate-pulse rounded-md mt-1"></div>
                ) : (
                    <p className="text-2xl font-bold text-slate-900">{stats.userCount}</p>
                )}
            </div>
        </div>
    );
};

export default SummaryCards;