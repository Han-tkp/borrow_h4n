import React, { useState, useEffect } from 'react';
import { getAssessmentHistory } from '../../api/firestoreApi';

const AssessmentHistoryTab = () => {
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                setAssessments(await getAssessmentHistory());
            } catch (error) {
                console.error("Error fetching assessment history:", error);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return <p>Loading assessment history...</p>;
    }

    return (
        <div className="tab-content">
            <div className="card rounded-2xl p-6 text-slate-900">
                <h3 className="text-lg font-semibold">ประวัติการประเมินมาตรฐาน</h3>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {assessments.length > 0 ? assessments.map(a => (
                        <div key={a.id} className="p-3 rounded-lg border border-slate-200 text-sm">
                            <div className="flex justify-between items-start">
                                <span className="font-semibold">{a.equipment_name || 'N/A'}</span>
                                <span className="text-xs text-slate-500">{a.date?.toDate().toLocaleDateString('th-TH')}</span>
                            </div>
                            <p className="text-slate-600 mt-1">อัตราการไหล: {a.result_flow_rate || 'N/A'} มล./นาที | อุณหภูมิ: {a.result_temp || 'N/A'} °C</p>
                            <button className="mt-2 text-xs text-indigo-600 hover:underline">ดูรายละเอียด</button>
                        </div>
                    )) : <p className="text-slate-500">ไม่มีประวัติการประเมิน</p>}
                </div>
            </div>
        </div>
    );
};

export default AssessmentHistoryTab;
