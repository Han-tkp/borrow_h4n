import React, { useState, useEffect } from 'react';
import { getActivityLog } from '../../api/firestoreApi';

const ApprovalHistoryTab = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Filtering states can be added here

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                setLogs(await getActivityLog());
            } catch (error) {
                console.error("Error fetching approval history:", error);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return <p>Loading approval history...</p>;
    }

    return (
        <div className="tab-content">
            <div className="card rounded-2xl p-6 text-slate-900">
                <h3 className="text-lg font-semibold">ประวัติการดำเนินการอนุมัติ</h3>
                {/* Filter UI would go here */}
                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {logs.length > 0 ? logs.map(log => (
                        <div key={log.id} className="flex items-center gap-3 p-2.5 border-b border-slate-100">
                            <div className="flex-grow">
                                <p className="font-medium text-sm text-slate-800">{log.details}</p>
                                <p className="text-xs text-slate-500">{log.timestamp?.toDate().toLocaleString('th-TH')} by {log.admin_name}</p>
                            </div>
                        </div>
                    )) : <p className="text-slate-500">ไม่มีประวัติการอนุมัติ</p>}
                </div>
            </div>
        </div>
    );
};

export default ApprovalHistoryTab;
