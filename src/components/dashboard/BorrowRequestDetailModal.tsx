import React, { useState, useEffect } from 'react';
import { getEquipmentList } from '../../api/firestoreApi';

interface BorrowRequestDetailModalProps {
    borrow: any;
    onClose: () => void;
}

const BorrowRequestDetailModal: React.FC<BorrowRequestDetailModalProps> = ({ borrow, onClose }) => {
    const [equipmentImages, setEquipmentImages] = useState<Map<string, string>>(new Map());
    const [loadingImages, setLoadingImages] = useState(true);

    useEffect(() => {
        const fetchEquipmentImages = async () => {
            try {
                const allEquipment = await getEquipmentList();
                const imageMap = new Map<string, string>();
                allEquipment.forEach(equip => {
                    if (equip.type && equip.typeImageUrl && !imageMap.has(equip.type)) {
                        imageMap.set(equip.type, equip.typeImageUrl);
                    }
                });
                setEquipmentImages(imageMap);
            } catch (error) {
                console.error("Error fetching equipment images:", error);
            }
            setLoadingImages(false);
        };

        fetchEquipmentImages();
    }, []);

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">รายละเอียดคำขอยืม</h3>
            <div className="space-y-2 text-sm text-gray-700">
                <p><strong>ผู้ยืม:</strong> {borrow.user_name}</p>
                <p><strong>วันที่ยืม:</strong> {borrow.borrow_date}</p>
                <p><strong>วันที่คืนโดยประมาณ:</strong> {borrow.due_date}</p>
                <p><strong>วัตถุประสงค์/พื้นที่ปฏิบัติงาน:</strong> {borrow.purpose}</p>
                <p><strong>ผู้ประสานงาน:</strong> {borrow.contact_name}</p>
                <p><strong>เบอร์โทรติดต่อ:</strong> {borrow.contact_phone}</p>
                {borrow.notes && <p><strong>รายละเอียดเพิ่มเติม:</strong> {borrow.notes}</p>}
                
                <div className="mt-4 pt-4 border-t">
                    <p className="font-semibold mb-2">รายการอุปกรณ์ที่ยืม:</p>
                    <div className="space-y-3">
                        {borrow.equipment_requests && borrow.equipment_requests.map((req: any, index: number) => {
                            const imageUrl = equipmentImages.get(req.type);
                            return (
                                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                                    {loadingImages ? (
                                        <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                                    ) : (
                                        <img src={imageUrl || 'https://placehold.co/100x100?text=No+Image'} alt={req.type} className="w-12 h-12 object-cover rounded-md" />
                                    )}
                                    <div className="flex-grow">
                                        <p className="font-medium">{req.type}</p>
                                        <p className="text-xs text-gray-600">จำนวน: {req.quantity}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">ปิด</button>
            </div>
        </div>
    );
};

export default BorrowRequestDetailModal;
