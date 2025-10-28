import React, { useState, useEffect } from 'react';
import { getRepairRequests } from '../../api/firestoreApi'; // Assuming this fetches all non-completed repairs
import { getRepairStatusTextAndColor } from '../../utils/helpers';

const TechTab = () => {
    const [repairs, setRepairs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRepairs = async () => {
            setLoading(true);
            try {
                // This should fetch all repairs assigned to the tech or all non-completed
                const repairList = await getRepairRequests(); 
                setRepairs(repairList);
            } catch (error) {
                console.error("Error fetching repair list:", error);
            }
            setLoading(false);
        };
        fetchRepairs();
    }, []);

    if (loading) {
        return <p>Loading repair list...</p>;
    }

    return (
        <div className="tab-content">
            <div className="card rounded-2xl p-6 text-slate-900">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">รายการซ่อมบำรุง</h3>
                    <button id="exportRepairsBtn"
                        className="px-3 py-1 text-xs rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300">Export</button>
                </div>
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
                                <div className="mt-2 flex justify-between items-center">
                                    <div>
                                        {r.status === 'repair_approved' && 
                                            <button className="px-3 py-1 text-xs rounded bg-indigo-500 text-white hover:bg-indigo-600">เริ่มการซ่อม</button>}
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <button className="text-xs text-indigo-600 hover:underline">ดูรายละเอียด</button>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : <div className="text-slate-500 text-center">ไม่มีรายการซ่อมปัจจุบัน</div>}
                </div>
            </div>
        </div>
    );
};

export default TechTab;
