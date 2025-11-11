import React, { useState, useEffect } from 'react';
import { getDeliveryQueue, getReturnQueue, updateBorrowStatus, getEquipmentStatus, submitPostAssessment } from '../../api/firestoreApi';
import { useAppContext } from '../../context/AppContext';
import AssessmentModal from './AssessmentModal';
import ChangeEquipmentModal from './ChangeEquipmentModal';
import PostAssessmentModal from './PostAssessmentModal'; // Import PostAssessmentModal

const DeliveryTab = () => {
    const { showModal, hideModal, showToast } = useAppContext(); // Added showToast
    const [deliveryQueue, setDeliveryQueue] = useState<any[]>([]);
    const [returnQueue, setReturnQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBorrowRequest, setSelectedBorrowRequest] = useState<any>(null);
    const [selectedEquipmentForChange, setSelectedEquipmentForChange] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [delivery, returns] = await Promise.all([
                getDeliveryQueue(),
                getReturnQueue()
            ]);
            setDeliveryQueue(delivery);
            setReturnQueue(returns);
        } catch (error) {
            console.error("Error fetching technician queues:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssessOrChange = (borrowRequest: any, equipmentItem: any) => {
        setSelectedBorrowRequest(borrowRequest);
        setSelectedEquipmentForChange(equipmentItem);
        showModal('ตรวจสภาพและเปลี่ยนอุปกรณ์', 
            <AssessmentModal
                borrowRequest={borrowRequest}
                equipment={equipmentItem}
                onClose={() => hideModal()}
                onSuccess={async (borrowRequestId, equipmentId) => {
                    hideModal();
                    // Re-fetch the specific borrow request to get its latest assigned equipment statuses
                    const updatedDeliveryQueue = await getDeliveryQueue();
                    const currentBorrowRequest = updatedDeliveryQueue.find(br => br.id === borrowRequestId);

                    if (currentBorrowRequest && currentBorrowRequest.equipment_assigned) {
                        const allItemsProcessed = await Promise.all(
                            currentBorrowRequest.equipment_assigned.map(async (eq: any) => {
                                const status = await getEquipmentStatus(eq.id);
                                return status !== 'pending_delivery'; // True if processed
                            })
                        );

                        if (allItemsProcessed.every(Boolean)) {
                            // All items processed, update borrow request status to 'borrowed'
                            await updateBorrowStatus(borrowRequestId, 'borrowed');
                            showToast('Success', `คำขอยืม #${borrowRequestId.substring(0,6)}... ได้รับการยืนยันส่งมอบทั้งหมดแล้ว`);
                        }
                    }
                    fetchData(); // Re-fetch all data to update UI
                }}
            />
        );
    };

    const handleProcessReturn = (borrowRecord: any, equipmentItem: any) => {
        showModal('ตรวจสภาพหลังคืน', 
            <PostAssessmentModal
                borrowRecord={borrowRecord}
                equipment={equipmentItem}
                onClose={() => hideModal()}
                onSubmit={async (assessmentData) => {
                    try {
                        await submitPostAssessment(assessmentData);
                        showToast('Success', 'บันทึกการตรวจสภาพหลังคืนเรียบร้อยแล้ว');
                        hideModal();
                        fetchData(); // Re-fetch data to update UI
                    } catch (error) {
                        console.error("Error submitting post-assessment:", error);
                        showToast('Error', 'เกิดข้อผิดพลาดในการบันทึกการตรวจสภาพหลังคืน');
                    }
                }}
            />
        );
    };

    return (
        <div className="tab-content">
            <div className="grid lg:grid-cols-2 gap-6 grid-mobile-1">
                <div className="card rounded-2xl p-6 text-slate-900">
                    <h3 className="text-lg font-semibold">รายการก่อนส่งมอบ (Pre-Delivery)</h3>
                    <div className="mt-4 overflow-auto max-h-[60vh]">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3">ID การยืม</th>
                                    <th scope="col" className="px-4 py-3">ผู้ยืม</th>
                                    <th scope="col" className="px-4 py-3">รายการอุปกรณ์</th>
                                    <th scope="col" className="px-4 py-3">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveryQueue.length > 0 ? deliveryQueue.map(b => (
                                    <tr key={b.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium text-slate-900">#{b.id.substring(0,6)}...</td>
                                        <td className="px-4 py-2">{b.user_name}</td>
                                        <td className="px-4 py-2">
                                            <ul className="list-disc list-inside text-xs">
                                                {b.equipment_assigned?.map((eq:any) => (
                                                    <li key={eq.id}>{eq.name} ({eq.serial})</li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col gap-1.5">
                                                {b.equipment_assigned?.map((eq:any) => (
                                                    <button 
                                                        key={`assess-${eq.id}`}
                                                        onClick={() => handleAssessOrChange(b, eq)} 
                                                        className="px-3 py-1.5 text-xs rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 mt-1"
                                                    >
                                                        ตรวจสภาพ/เปลี่ยน ({eq.name})
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={4} className="text-center p-4 text-slate-500">ไม่มีรายการรอส่งมอบ</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card rounded-2xl p-6 text-slate-900">
                    <h3 className="text-lg font-semibold">รายการรอตรวจสภาพ (หลังคืน)</h3>
                    <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                         {returnQueue.length > 0 ? returnQueue.map(b => (
                            <div key={b.id} className="p-3 rounded-lg border border-slate-200 text-sm">
                                <p><span className="font-semibold">{b.user_name}</span> คืนเครื่อง</p>
                                <ul className="text-slate-600 list-disc list-inside">
                                    {b.equipment_assigned?.map((eq:any) => (
                                        <li key={eq.id}>{eq.name} ({eq.serial})</li>
                                    ))}
                                </ul>
                                <p className="text-slate-600">กำหนดคืน: {b.due_date}</p>
                                <div className="flex flex-col gap-1.5 mt-2">
                                    {b.equipment_assigned?.map((eq:any) => (
                                        <button
                                            key={`return-${eq.id}`}
                                            onClick={() => handleProcessReturn(b, eq)}
                                            className="px-3 py-1.5 text-xs rounded-lg bg-orange-500 text-white hover:bg-orange-600"
                                        >
                                            ดำเนินการคืน ({eq.name})
                                        </button>
                                    ))}
                                </div>
                            </div>
                         )) : <p className="text-slate-500">ไม่มีรายการรอตรวจสภาพ</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryTab;
