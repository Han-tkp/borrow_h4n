
import React, { useState, useEffect } from 'react';
import { getStandardAssessments, getEquipmentTypes } from '../../api/firestoreApi';
import { useAppContext } from '../../context/AppContext';
import StandardAssessmentModal from './StandardAssessmentModal';

const StandardAssessmentHistoryTab = () => {
    const { showModal, hideModal } = useAppContext();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
    const [dateFilter, setDateFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [assessmentHistory, types] = await Promise.all([
                getStandardAssessments(),
                getEquipmentTypes()
            ]);
            setHistory(assessmentHistory);
            setEquipmentTypes(types as string[]);
        } catch (error) {
            console.error("Error fetching standard assessment history:", error);
        }
        setLoading(false);
    };

    const handleViewDetails = (assessment: any) => {
        showModal('รายละเอียดการประเมินมาตรฐาน', 
            <StandardAssessmentModal 
                equipment={null} // Not needed for read-only view of historical data
                readOnlyData={assessment}
                onClose={hideModal} 
            />
        );
    };

    const filteredHistory = history.filter(assessment => {
        const date = assessment.assessedAt?.toDate();
        if (!date) return false;

        const dateMatch = !dateFilter || (date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2)) === dateFilter;
        const typeMatch = !typeFilter || assessment.equipmentType === typeFilter;
        
        return dateMatch && typeMatch;
    });

    if (loading) {
        return <p>Loading assessment history...</p>;
    }

    return (
        <div className="tab-content">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-[var(--text-color-dark)]">ประวัติการประเมินมาตรฐาน</h3>
                    <div className="flex items-center gap-2">
                        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
                            <option value="">ทุกประเภท</option>
                            {equipmentTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {filteredHistory.length === 0 ? (
                        <p className="text-gray-500">ไม่มีประวัติการประเมินที่ตรงกับตัวกรอง</p>
                    ) : (
                        filteredHistory.map(assessment => (
                            <div key={assessment.id} className="p-3 rounded-lg border border-[var(--border-color)] flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{assessment.equipmentName}</p>
                                    <p className="text-sm text-gray-500">ประเมินเมื่อ: {(assessment.assessedAt && typeof assessment.assessedAt.toDate === 'function') ? assessment.assessedAt.toDate().toLocaleString('th-TH') : 'N/A'}</p>
                                </div>
                                <button onClick={() => handleViewDetails(assessment)} className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300">ดูรายละเอียด</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default StandardAssessmentHistoryTab;
