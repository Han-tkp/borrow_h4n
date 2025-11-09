import React, { useState, useMemo } from 'react';

const CHECKLIST_ITEMS = [
    'ตรวจสอบสภาพภายนอก',
    'ตรวจสอบถังน้ำมันเชื้อเพลิง',
    'ตรวจสอบคาร์บูเรเตอร์',
    'ตรวจสอบหัวเทียน',
    'ตรวจสอบแบตเตอรี่',
    'ตรวจสอบท่อน้ำยาเคมี',
    'ตรวจสอบระบบพ่น',
];

interface PostAssessmentModalProps {
    borrowRecord: any;
    equipment: any;
    onClose: () => void;
    onSubmit: (assessmentData: any) => void;
}

const PostAssessmentModal: React.FC<PostAssessmentModalProps> = ({ borrowRecord, equipment, onClose, onSubmit }) => {
    const [assessments, setAssessments] = useState<Record<string, 'ปกติ' | 'ผิดปกติ'>>(
        CHECKLIST_ITEMS.reduce((acc, item) => ({ ...acc, [item]: 'ปกติ' }), {})
    );
    const [notes, setNotes] = useState('');
    const [damageDescription, setDamageDescription] = useState('');
    const [estimatedCost, setEstimatedCost] = useState('');
    const [lateReturnReason, setLateReturnReason] = useState('');

    const isAnyAbnormal = useMemo(() => Object.values(assessments).some(v => v === 'ผิดปกติ'), [assessments]);
    const isLate = useMemo(() => {
        if (!borrowRecord.due_date || !borrowRecord.returned_date) return false;
        return new Date(borrowRecord.returned_date) > new Date(borrowRecord.due_date);
    }, [borrowRecord]);

    const handleSubmit = () => {
        if (isLate && !lateReturnReason) {
            alert('กรุณาระบุเหตุผลที่คืนเครื่องล่าช้า');
            return;
        }
        if (isAnyAbnormal && !damageDescription) {
            alert('กรุณาระบุรายละเอียดอาการเสีย');
            return;
        }

        const assessmentData = {
            borrowRequestId: borrowRecord.id,
            equipmentId: equipment.id,
            assessments,
            isAbnormal: isAnyAbnormal,
            damageDescription: isAnyAbnormal ? damageDescription : null,
            estimatedCost: isAnyAbnormal ? parseFloat(estimatedCost) || 0 : null,
            isLate,
            lateReturnReason: isLate ? lateReturnReason : null,
            notes,
            assessedAt: new Date(),
        };
        onSubmit(assessmentData);
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">ตรวจสภาพหลังคืน: {equipment.name}</h3>
            <p className="text-sm text-gray-600 mb-4">S/N: {equipment.serial} (คืนโดย: {borrowRecord.user_name})</p>
            
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 -mr-2">
                {CHECKLIST_ITEMS.map((item, index) => (
                    <div key={item} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50">
                        <span className="font-medium text-sm">{index + 1}. {item}</span>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name={`assessment-${item}`} checked={assessments[item] === 'ปกติ'} onChange={() => setAssessments(prev => ({...prev, [item]: 'ปกติ'}))} className="h-4 w-4"/>ปกติ</label>
                            <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name={`assessment-${item}`} checked={assessments[item] === 'ผิดปกติ'} onChange={() => setAssessments(prev => ({...prev, [item]: 'ผิดปกติ'}))} className="h-4 w-4"/>ผิดปกติ</label>
                        </div>
                    </div>
                ))}

                {isLate && (
                    <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <label htmlFor="late-reason" className="text-sm font-medium text-yellow-800">! คืนเครื่องล่าช้า กรุณาระบุเหตุผล:</label>
                        <textarea id="late-reason" value={lateReturnReason} onChange={e => setLateReturnReason(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500" required />
                    </div>
                )}

                {isAnyAbnormal && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                        <label htmlFor="damage-desc" className="text-sm font-medium text-red-800">* พบความผิดปกติ กรุณากรอกรายละเอียดเพื่อส่งซ่อม:</label>
                        <textarea id="damage-desc" value={damageDescription} onChange={e => setDamageDescription(e.target.value)} placeholder="รายละเอียดอาการ..." rows={3} className="w-full mt-1 px-3 py-2 rounded-lg border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500" required />
                        <label htmlFor="estimated-cost" className="text-sm font-medium text-red-800 mt-2 block">ประเมินค่าซ่อม (บาท):</label>
                        <input id="estimated-cost" type="number" value={estimatedCost} onChange={e => {
                            const val = e.target.value;
                            if (/^\d*\.?\d*$/.test(val)) {
                                setEstimatedCost(val);
                            }
                        }} placeholder="0.00" className="w-full mt-1 px-3 py-2 rounded-lg border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                )}

                <div className="mt-4">
                    <label htmlFor="assessment-notes" className="text-sm font-medium">หมายเหตุเพิ่มเติม</label>
                    <textarea id="assessment-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">ยกเลิก</button>
                <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">ยืนยันการตรวจสภาพ</button>
            </div>
        </div>
    );
};

export default PostAssessmentModal;
