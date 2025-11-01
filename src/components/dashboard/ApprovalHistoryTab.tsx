import React, { useState, useEffect } from 'react';
import { getActivityLog } from '../../api/firestoreApi';
import { useAppContext } from '../../App';

interface ApprovalHistoryTabProps {
    userId: string; // This userId refers to the admin's UID
}

const ApprovalHistoryTab: React.FC<ApprovalHistoryTabProps> = ({ userId }) => {
    const { user } = useAppContext();
    const [activityLog, setActivityLog] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(''); // New state for date filter

    useEffect(() => {
        const fetchActivity = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                // Fetch activity logs for the current admin, filtering for approval-related actions
                const logs = await getActivityLog(dateFilter, user?.role === 'admin', userId);
                const approvalLogs = logs.filter(log => 
                    log.action === 'APPROVE_BORROW' || 
                    log.action === 'REJECT_BORROW' ||
                    log.action === 'APPROVE_REPAIR' ||
                    log.action === 'REJECT_REPAIR' ||
                    log.action === 'APPROVE_USER' ||
                    log.action === 'REJECT_USER'
                );
                setActivityLog(approvalLogs);
            } catch (error) {
                console.error("Error fetching approval activity log:", error);
            }
            setLoading(false);
        };
        fetchActivity();
    }, [userId, user?.role, dateFilter]); // Add dateFilter to dependencies

    if (loading) {
        return <p>Loading approval history...</p>;
    }

    return (
        <div className="tab-content">
            <div className="card rounded-2xl p-6 text-slate-900">
                <h3 className="text-lg font-semibold">ประวัติการอนุมัติของฉัน</h3>
                <div className="mb-4">
                    <label htmlFor="approval-history-date" className="mr-2 text-sm font-medium text-gray-700">เลือกวันที่:</label>
                    <input 
                        type="date" 
                        id="approval-history-date" 
                        value={dateFilter} 
                        onChange={e => setDateFilter(e.target.value)} 
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                </div>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {activityLog.length === 0 ? (
                        <p className="text-slate-500">ไม่มีประวัติการอนุมัติ</p>
                    ) : (
                        activityLog.map(log => (
                            <div key={log.id} className="p-3 rounded-lg border border-slate-200 text-sm">
                                <p className="font-semibold">{log.action.replace(/_/g, ' ')}</p>
                                <p className="text-slate-600">โดย: {log.adminName} เมื่อ: {new Date(log.timestamp?.toDate()).toLocaleString()}</p>
                                {log.details && (
                                    <div className="text-xs text-slate-500 mt-1">
                                        {log.details.borrowId && <p>Borrow ID: {log.details.borrowId.substring(0, 6)}...</p>}
                                        {log.details.userId && <p>User ID: {log.details.userId.substring(0, 6)}...</p>}
                                        {log.details.equipmentRequests && (
                                            <div>
                                                <p>Equipment:</p>
                                                <ul className="list-disc pl-4">
                                                    {log.details.equipmentRequests.map((req, index) => (
                                                        <li key={index}>{req.type} (จำนวน: {req.quantity})</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {log.details.equipmentId && <p>Equipment ID: {log.details.equipmentId.substring(0, 6)}...</p>}
                                        {log.details.equipmentName && <p>Equipment Name: {log.details.equipmentName}</p>}
                                        {log.details.reason && <p>Reason: {log.details.reason}</p>}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApprovalHistoryTab;