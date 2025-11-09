import React, { useState, useMemo } from 'react';
import { logAssessmentAndConfirmDelivery, logAssessmentAndChangeEquipment } from '../../api/firestoreApi';
import { useAppContext } from '../../App';
import ChangeEquipmentModal from './ChangeEquipmentModal';

const CHECKLIST_ITEMS = [
    'ตรวจสอบสภาพภายนอก',
    'ตรวจสอบถังน้ำมันเชื้อเพลิง',
    'ตรวจสอบคาร์บูเรเตอร์',
    'ตรวจสอบหัวเทียน',
    'ตรวจสอบแบตเตอรี่',
    'ตรวจสอบท่อน้ำยาเคมี',
    'ตรวจสอบระบบพ่น',
];

interface AssessmentModalProps {
    borrowRequest: any;
    equipment: any;
    onClose: () => void;
    onSuccess: () => void; // Simplified callback
}

const AssessmentModal: React.FC<AssessmentModalProps> = ({ borrowRequest, equipment, onClose, onSuccess }) => {
    const { showModal, hideModal, showToast } = useAppContext();
    const [assessments, setAssessments] = useState<Record<string, 'ปกติ' | 'ผิดปกติ'>>(
        CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item]: 'ปกติ' }), {})
    );
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAssessmentChange = (item: string, value: 'ปกติ' | 'ผิดปกติ') => {
        setAssessments(prev => ({ ...prev, [item]: value }));
    };

    const isAnyAbnormal = useMemo(() => Object.values(assessments).some(v => v === 'ผิดปกติ'), [assessments]);

    const handleConfirmChange = async (assessmentData: any, replacementId: string) => {
        setIsSubmitting(true);
        try {
            await logAssessmentAndChangeEquipment(assessmentData, replacementId);
            showToast('Success', 'ยืนยันการเปลี่ยนเครื่องเรียบร้อยแล้ว');
            onSuccess(); // This will hide modals and refresh data
        } catch (error) {
            console.error("Failed to change equipment:", error);
            showToast('Error', 'เกิดข้อผิดพลาดในการเปลี่ยนเครื่อง');
        }
        setIsSubmitting(false);
    };

    const showChangeModal = (assessmentData: any) => {
        // We close the current modal before opening the new one
        onClose(); 
        showModal('เปลี่ยนเครื่องทดแทน', 
            <ChangeEquipmentModal 
                faultyEquipment={equipment}
                onClose={() => showModal(null, null)} // Simply close the change modal
                onConfirmChange={(replacementId) => handleConfirmChange(assessmentData, replacementId)}
            />
        );
    };

    const handleSubmit = async () => {
        const assessmentData = {
            borrowRequestId: borrowRequest.id,
            equipmentId: equipment.id,
            assessments,
            notes,
            assessedAt: new Date(),
        };

        if (isAnyAbnormal) {
            showChangeModal(assessmentData);
        } else {
            setIsSubmitting(true);
            try {
                await logAssessmentAndConfirmDelivery(assessmentData);
                showToast('Success', 'ยืนยันการส่งมอบเรียบร้อยแล้ว');
                onSuccess(); // This will hide modal and refresh data
            } catch (error) {
                console.error("Failed to confirm delivery:", error);
                showToast('Error', 'เกิดข้อผิดพลาดในการยืนยันการส่งมอบ');
            }
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">ตรวจสภาพ: {equipment.name}</h3>
            <p className="text-sm text-gray-600 mb-4">S/N: {equipment.serial} (สำหรับ: {borrowRequest.user_name})</p>
            
            <div className="space-y-3">
                {CHECKLIST_ITEMS.map((item, index) => (
                    <div key={item} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50">
                        <span className="font-medium text-sm">{index + 1}. {item}</span>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name={`assessment-${item}`} checked={assessments[item] === 'ปกติ'} onChange={() => handleAssessmentChange(item, 'ปกติ')} className="h-4 w-4"/></label>
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name={`assessment-${item}`} checked={assessments[item] === 'ผิดปกติ'} onChange={() => handleAssessmentChange(item, 'ผิดปกติ')} className="h-4 w-4"/></label>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4">
                <label htmlFor="assessment-notes" className="text-sm font-medium">หมายเหตุเพิ่มเติม</label>
                <textarea id="assessment-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300"/>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50">ยกเลิก</button>
                {isAnyAbnormal ? (
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50">พบปัญหา/เปลี่ยนเครื่อง</button>
                ) : (
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">ยืนยันส่งมอบ (เครื่องปกติ)</button>
                )}
            </div>
        </div>
    );
};

export default AssessmentModal;
