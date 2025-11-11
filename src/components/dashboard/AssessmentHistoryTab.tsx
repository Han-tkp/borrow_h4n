import React, { useState, useEffect } from 'react';
import { getAssessmentHistory, reauthenticate, clearAssessmentHistory } from '../../api/firestoreApi';
import { useAppContext } from '../../context/AppContext';
import * as XLSX from 'xlsx';

interface AssessmentHistoryTabProps {
    userId: string | null;
}

const AssessmentHistoryTab: React.FC<AssessmentHistoryTabProps> = ({ userId }) => {
    const { user } = useAppContext();
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            setAssessments(await getAssessmentHistory(userId));
        } catch (error) {
            console.error("Error fetching assessment history:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    const handleExport = () => {
        const worksheet = XLSX.utils.json_to_sheet(assessments.map(a => ({
            Equipment: a.equipment_name || 'N/A',
            Date: a.date?.toDate().toLocaleDateString('th-TH'),
            FlowRate: a.result_flow_rate || 'N/A',
            Temperature: a.result_temp || 'N/A',
            Details: JSON.stringify(a.details, null, 2)
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Assessment History");
        XLSX.writeFile(workbook, "assessment_history.xlsx");
    };

    const handleClearHistory = async () => {
        const password = prompt("โปรดยืนยันรหัสผ่านของคุณเพื่อล้างประวัติ:");
        if (!password) return;

        try {
            await reauthenticate(password);
        } catch (error) {
            alert("การยืนยันตัวตนล้มเหลว โปรดตรวจสอบรหัสผ่านของคุณ");
            return;
        }

        if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการประเมินทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
            try {
                await clearAssessmentHistory();
                alert("ล้างประวัติการประเมินทั้งหมดเรียบร้อยแล้ว");
                fetchData(); // Refresh the data
            } catch (error) {
                console.error("Error clearing assessment history:", error);
                alert("เกิดข้อผิดพลาดในการล้างประวัติ");
            }
        }
    };

    const filteredAssessments = assessments.filter(a => {
        if (!dateFilter) return true;
        const assessmentDate = a.date?.toDate().toISOString().slice(0, 10);
        return assessmentDate === dateFilter;
    });

    if (loading) {
        return <p>Loading assessment history...</p>;
    }

    const isAdmin = user?.role === 'admin';

    return (
        <div className="tab-content">
            <div className="card rounded-2xl p-6 text-slate-900">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h3 className="text-lg font-semibold">ประวัติการประเมินมาตรฐาน{userId ? `ของฉัน` : `ทั้งหมด`}</h3>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">
                            <label htmlFor="date-filter" className="mr-2 text-sm font-medium text-gray-700">กรองตามวันที่:</label>
                            <input 
                                type="date" 
                                id="date-filter" 
                                value={dateFilter} 
                                onChange={e => setDateFilter(e.target.value)} 
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            />
                        </div>
                        {isAdmin && (
                            <>
                                <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm">Export to Excel</button>
                                <button onClick={handleClearHistory} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">Clear History</button>
                            </>
                        )}
                    </div>
                </div>
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {filteredAssessments.length > 0 ? filteredAssessments.map(a => (
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
