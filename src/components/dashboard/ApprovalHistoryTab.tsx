import React, { useState, useEffect } from 'react';
import { getActivityLog } from '../../api/firestoreApi';
import { useAppContext } from '../../App';
import LogDetailModal from './LogDetailModal';

interface ApprovalHistoryTabProps {
    userId: string | null; // This userId refers to the admin's UID or null for all
}

const ApprovalHistoryTab: React.FC<ApprovalHistoryTabProps> = ({ userId }) => {
    const { user, showModal } = useAppContext();
    const [activityLog, setActivityLog] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('');
    const [actionTypeFilter, setActionTypeFilter] = useState('all'); // all, user, borrow, repair
    const [actionResultFilter, setActionResultFilter] = useState('all'); // all, approved, rejected

    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            try {
                const logs = await getActivityLog(dateFilter, user?.role === 'admin', userId);
                let approvalLogs = logs.filter(log => 
                    log.action.includes('APPROVE') || log.action.includes('REJECT')
                );

                // Filter by Action Type
                if (actionTypeFilter !== 'all') {
                    approvalLogs = approvalLogs.filter(log => log.action.toLowerCase().includes(actionTypeFilter));
                }

                // Filter by Action Result
                if (actionResultFilter !== 'all') {
                    if (actionResultFilter === 'approved') {
                        approvalLogs = approvalLogs.filter(log => log.action.startsWith('APPROVE'));
                    } else if (actionResultFilter === 'rejected') {
                        approvalLogs = approvalLogs.filter(log => log.action.startsWith('REJECT'));
                    }
                }

                setActivityLog(approvalLogs);
            } catch (error) {
                console.error("Error fetching approval activity log:", error);
            }
            setLoading(false);
        };
        fetchActivity();
    }, [userId, user?.role, dateFilter, actionTypeFilter, actionResultFilter]);

    const showDetails = (log: any) => {
        showModal('รายละเอียดการกระทำ', <LogDetailModal log={log} key={log.id} />);
    };

    if (loading) {
        return <p>Loading approval history...</p>;
    }

    return (
        <div className="tab-content">
            <div className="bg-white rounded-2xl p-6 text-[var(--text-color-dark)]">
                <h3 className="text-lg font-semibold">ประวัติการอนุมัติ{userId ? `ของฉัน` : `ทั้งหมด`}</h3>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div>
                        <label htmlFor="approval-history-date" className="text-sm font-medium text-gray-700">เลือกวันที่:</label>
                        <input 
                            type="date" 
                            id="approval-history-date" 
                            value={dateFilter} 
                            onChange={e => setDateFilter(e.target.value)} 
                            className="ml-2 px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm bg-gray-50"
                        />
                    </div>
                    <div>
                        <label htmlFor="action-type-filter" className="text-sm font-medium text-gray-700">ประเภท:</label>
                        <select 
                            id="action-type-filter"
                            value={actionTypeFilter}
                            onChange={e => setActionTypeFilter(e.target.value)}
                            className="ml-2 px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm bg-gray-50"
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="user">อนุมัติบัญชี</option>
                            <option value="borrow">อนุมัติการยืม</option>
                            <option value="repair">อนุมัติการซ่อม</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="action-result-filter" className="text-sm font-medium text-gray-700">ผลลัพธ์:</label>
                        <select 
                            id="action-result-filter"
                            value={actionResultFilter}
                            onChange={e => setActionResultFilter(e.target.value)}
                            className="ml-2 px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm bg-gray-50"
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="approved">อนุมัติ</option>
                            <option value="rejected">ไม่อนุมัติ</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {activityLog.length === 0 ? (
                        <p className="text-gray-500">ไม่พบประวัติการอนุมัติตามเงื่อนไขที่เลือก</p>
                    ) : (
                        activityLog.map(log => (
                            <div key={log.id} className="p-3 rounded-lg border border-[var(--border-color)] text-sm">
                                <div className="flex justify-between items-start">
                                    <p className={`font-semibold ${log.action.startsWith('APPROVE') ? 'text-green-600' : 'text-red-600'}`}>{log.action.replace(/_/g, ' ')}</p>
                                    <button onClick={() => showDetails(log)} className="text-xs text-[var(--primary-color)] hover:underline">ดูรายละเอียด</button>
                                </div>
                                <p className="text-gray-600">โดย: {log.adminName} เมื่อ: {new Date(log.timestamp?.toDate()).toLocaleString()}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApprovalHistoryTab;
