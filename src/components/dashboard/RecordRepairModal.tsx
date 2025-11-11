import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

interface RecordRepairModalProps {
    repairRequest: any;
    onClose: () => void;
    onSubmit: (repairData: any) => void;
}

const RecordRepairModal: React.FC<RecordRepairModalProps> = ({ repairRequest, onClose, onSubmit }) => {
    const { user } = useAppContext();
    const [repairDetails, setRepairDetails] = useState(repairRequest.repair_details || '');
    const [finalCost, setFinalCost] = useState(repairRequest.cost || '');
    const [replacedParts, setReplacedParts] = useState(repairRequest.replaced_parts || '');

    const handleSubmit = () => {
        if (!repairDetails) {
            alert('กรุณากรอกรายละเอียดการซ่อม');
            return;
        }

        console.log("User UID before submit:", user.uid); // Debugging line

        const repairData = {
            repairId: repairRequest.id,
            repairDetails,
            finalCost: parseFloat(finalCost) || 0,
            replacedParts,
            completedAt: new Date(),
            technicianId: user.uid,
            technicianName: user.name,
        };
        onSubmit(repairData);
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">บันทึกรายละเอียดการซ่อม</h3>
            
            <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                    <input 
                        type="text" 
                        value={new Date().toLocaleDateString('th-TH')} 
                        className="w-full px-3 py-2 rounded-lg border bg-gray-100" 
                        disabled 
                    />
                    <input 
                        type="text" 
                        value={user?.displayName || ''} 
                        className="w-full px-3 py-2 rounded-lg border bg-gray-100" 
                        disabled 
                    />
                </div>

                <div>
                    <label className="font-medium text-gray-700">อาการชำรุด (จากผู้แจ้ง):</label>
                    <p className="w-full mt-1 px-3 py-2 rounded-lg border bg-gray-100 min-h-[40px]">{repairRequest.damage_description}</p>
                </div>

                <div>
                    <label htmlFor="repair-details" className="font-medium text-gray-700">การดำเนินการซ่อม:</label>
                    <textarea id="repair-details" value={repairDetails} onChange={e => setRepairDetails(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" required />
                </div>
                <div>
                    <label htmlFor="replaced-parts" className="font-medium text-gray-700">รายการวัสดุ/อะไหล่ที่ใช้ (ถ้ามี):</label>
                    <textarea id="replaced-parts" value={replacedParts} onChange={e => setReplacedParts(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                </div>
                <div>
                    <label htmlFor="final-cost" className="font-medium text-gray-700">จำนวนเงิน (บาท):</label>
                    <input id="final-cost" type="number" value={finalCost} onChange={e => {
                        const val = e.target.value;
                        if (/^\d*\.?\d*$/.test(val)) {
                            setFinalCost(val);
                        }
                    }} placeholder="0.00" className="w-full mt-1 px-3 py-2 rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">ยกเลิก</button>
                <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">บันทึกการซ่อม</button>
            </div>
        </div>
    );
};

export default RecordRepairModal;
