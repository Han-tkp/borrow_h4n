import React, { useState, useEffect } from 'react';
import { getEquipmentList } from '../../api/firestoreApi';

interface ChangeEquipmentModalProps {
    faultyEquipment: any;
    onClose: () => void;
    onConfirmChange: (replacementId: string) => void;
}

const ChangeEquipmentModal: React.FC<ChangeEquipmentModalProps> = ({ faultyEquipment, onClose, onConfirmChange }) => {
    const [availableReplacements, setAvailableReplacements] = useState<any[]>([]);
    const [selectedReplacement, setSelectedReplacement] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReplacements = async () => {
            if (!faultyEquipment?.type) return;
            setLoading(true);
            try {
                const available = await getEquipmentList({ f: 'available', t: faultyEquipment.type });
                setAvailableReplacements(available.filter(e => e.id !== faultyEquipment.id));
            } catch (error) {
                console.error("Error fetching replacement equipment:", error);
            }
            setLoading(false);
        };

        fetchReplacements();
    }, [faultyEquipment]);

    const handleSubmit = () => {
        if (!selectedReplacement) {
            alert('กรุณาเลือกเครื่องทดแทน');
            return;
        }
        onConfirmChange(selectedReplacement);
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">เปลี่ยนเครื่องทดแทน</h3>
            <p className="text-sm text-gray-600 mb-4">เครื่องที่พบปัญหา ({faultyEquipment.name}) จะถูกส่งซ่อม กรุณาเลือกเครื่องใหม่เพื่อทดแทน</p>

            {loading ? (
                <p>กำลังค้นหาเครื่องทดแทน...</p>
            ) : (
                <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {availableReplacements.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {availableReplacements.map(equip => (
                                <div 
                                    key={equip.id}
                                    onClick={() => setSelectedReplacement(equip.id)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedReplacement === equip.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                                    <img src={equip.typeImageUrl || 'https://via.placeholder.com/150'} alt={equip.name} className="w-full h-32 object-cover rounded-md mb-2" />
                                    <p className="font-semibold text-sm">{equip.name}</p>
                                    <p className="text-xs text-gray-500">S/N: {equip.serial}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-4">ไม่มีเครื่องทดแทนที่พร้อมใช้งาน</p>
                    )}
                </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">ยกเลิก</button>
                <button onClick={handleSubmit} disabled={!selectedReplacement || loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">ยืนยันการเปลี่ยนเครื่อง</button>
            </div>
        </div>
    );
};

export default ChangeEquipmentModal;
