import React, { useState, useEffect } from 'react';
import { getActivityLog } from '../../api/firestoreApi';
import { useAppContext } from '../../App';
import LogDetailModal from './LogDetailModal';

interface RepairHistoryTabProps {
    userId: string | null;
}

const RepairHistoryTab: React.FC<RepairHistoryTabProps> = ({ userId }) => {
    const { showModal } = useAppContext();
    const [activityLog, setActivityLog] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('all'); // all, assessment, repair

    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            try {
                const logs = await getActivityLog(dateFilter, false, userId);
                
                let filteredLogs = logs.filter(log => 
                    log.action.includes('ASSESSMENT') || 
                    log.action.includes('REPAIR') ||
                    log.action.includes('DELIVERY') ||
                    log.action.includes('CHANGE_EQUIPMENT')
                );

                if (actionFilter !== 'all') {
                    filteredLogs = filteredLogs.filter(log => log.action.toLowerCase().includes(actionFilter));
                }

                setActivityLog(filteredLogs);
            } catch (error) {
                console.error("Error fetching technician activity log:", error);
            }
            setLoading(false);
        };
        fetchActivity();
    }, [userId, dateFilter, actionFilter]);

    const showDetails = (log: any) => {
        showModal('รายละเอียดการกระทำ', <LogDetailModal log={log} key={log.id} />);
    };

    if (loading) {
        return <p>Loading history...</p>;
    }

    return (
        <div className="bg-white rounded-2xl p-6 text-[var(--text-color-dark)]">
            <h3 className="text-lg font-semibold">ประวัติการทำงาน{userId ? `ของฉัน` : `ทั้งหมด`}</h3>
            <div className="flex flex-wrap items-center gap-4 my-4">
                <div>
                    <label htmlFor="history-date-filter" className="text-sm font-medium text-gray-700">วันที่:</label>
                    <input 
                        type="date" 
                        id="history-date-filter" 
                        value={dateFilter} 
                        onChange={e => setDateFilter(e.target.value)} 
                        className="ml-2 px-3 py-2 rounded-lg border border-gray-300 text-sm bg-gray-50"
                    />
                </div>
                <div>
                    <label htmlFor="history-action-filter" className="text-sm font-medium text-gray-700">ประเภทงาน:</label>
                    <select 
                        id="history-action-filter"
                        value={actionFilter}
                        onChange={e => setActionFilter(e.target.value)}
                        className="ml-2 px-3 py-2 rounded-lg border border-gray-300 text-sm bg-gray-50"
                    >
                        <option value="all">ทั้งหมด</option>
                        <option value="assessment">ตรวจสภาพ</option>
                        <option value="repair">ซ่อมบำรุง</option>
                    </select>
                </div>
            </div>
            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                {activityLog.length === 0 ? (
                    <p className="text-gray-500">ไม่พบประวัติการทำงาน</p>
                ) : (
                    activityLog.map(log => (
                        <div key={log.id} className="p-3 rounded-lg border border-gray-200 text-sm">
                            <div className="flex justify-between items-start">
                                <p className="font-semibold text-gray-800">{log.action.replace(/_/g, ' ')}</p>
                                <button onClick={() => showDetails(log)} className="text-xs text-[var(--primary-color)] hover:underline">ดูรายละเอียด</button>
                            </div>
                            <p className="text-xs text-gray-500">เมื่อ: {new Date(log.timestamp?.toDate()).toLocaleString()}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RepairHistoryTab;
