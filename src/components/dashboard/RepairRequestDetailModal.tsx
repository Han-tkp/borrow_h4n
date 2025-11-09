import React, { useState, useEffect } from 'react';
import { getAssessmentDetails } from '../../api/firestoreApi';

interface RepairRequestDetailModalProps {
    repair: any;
    onClose: () => void;
}

const RepairRequestDetailModal: React.FC<RepairRequestDetailModalProps> = ({ repair, onClose }) => {
    const [assessment, setAssessment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssessment = async () => {
            if (repair.assessment_id) {
                try {
                    const assessmentData = await getAssessmentDetails(repair.assessment_id);
                    setAssessment(assessmentData);
                } catch (error) {
                    console.error("Error fetching assessment details:", error);
                }
            }
            setLoading(false);
        };

        fetchAssessment();
    }, [repair.assessment_id]);

    const renderAssessmentChecklist = () => {
        if (!assessment?.assessments) return null;

        return (
            <div className="space-y-1">
                {Object.entries(assessment.assessments).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-xs">
                        <span>- {key}</span>
                        <span className={`${value === 'ปกติ' ? 'text-green-600' : 'text-red-600'} font-semibold`}>{value as string}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 text-gray-800">
            <h3 className="text-lg font-semibold mb-4">รายละเอียดคำขอซ่อม</h3>
            <div className="space-y-3 text-sm">
                <p><strong>อุปกรณ์:</strong> {repair.equipment_name} (S/N: {repair.equipment_serial})</p>
                <p><strong>ประเภท:</strong> {repair.equipment_type}</p>
                <p><strong>อาการที่แจ้ง:</strong> {repair.damage_description}</p>
                {repair.cost > 0 && <p><strong>ค่าซ่อมประเมิน:</strong> {repair.cost.toLocaleString()} บาท</p>}
                <p><strong>วันที่แจ้ง:</strong> {new Date(repair.request_date?.toDate()).toLocaleString('th-TH')}</p>
                
                {loading ? (
                    <p>Loading assessment details...</p>
                ) : assessment && (
                    <div className="mt-4 pt-3 border-t">
                        <p className="font-semibold mb-2">ผลการตรวจสภาพจากช่าง:</p>
                        {renderAssessmentChecklist()}
                        {assessment.notes && <p className="text-xs mt-2 text-gray-600"><strong>หมายเหตุจากช่าง:</strong> {assessment.notes}</p>}
                    </div>
                )}
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">ปิด</button>
            </div>
        </div>
    );
};

export default RepairRequestDetailModal;
