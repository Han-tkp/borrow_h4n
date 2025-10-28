import React, { useState, useEffect } from 'react';
import { getAllRepairs } from '../../api/firestoreApi';
import { getRepairStatusTextAndColor } from '../../utils/helpers';

const RepairHistoryTab = () => {
    const [repairs, setRepairs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                setRepairs(await getAllRepairs());
            } catch (error) {
                console.error("Error fetching repair history:", error);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return <p>Loading repair history...</p>;
    }

    return (
        <div className="tab-content">
            <div className="card rounded-2xl p-6 text-slate-900">
                <h3 className="text-lg font-semibold">ประวัติการซ่อมทั้งหมด</h3>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {repairs.length > 0 ? repairs.map(r => {
                        const { text, color } = getRepairStatusTextAndColor(r.status);
                        return (
                            <div key={r.id} className="p-3 rounded-lg border border-slate-200 text-sm">
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold">{r.equipment_name}</span>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{text}</span>
                                </div>
                                <p className="text-slate-600 truncate">อาการ: {r.damage_description}</p>
                                <p className="text-xs text-slate-500">แจ้งเมื่อ: {r.request_date?.toDate().toLocaleDateString('th-TH')}</p>
                                <div className="mt-2 flex justify-end items-center">
                                    <button className="text-xs text-indigo-600 hover:underline">ดูรายละเอียด</button>
                                </div>
                            </div>
                        );
                    }) : <p className="text-slate-500">ไม่มีประวัติการซ่อม</p>}
                </div>
            </div>
        </div>
    );
};

export default RepairHistoryTab;
