import React, { useState, useEffect } from 'react';
import { getTechnicianRepairQueue, getDeliveryQueue, getBorrowedQueue, getReturnQueue, processReturn, startRepair, submitPostAssessment, completeRepair } from '../../api/firestoreApi';
import { getRepairStatusTextAndColor } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import AssessmentModal from './AssessmentModal';
import PostAssessmentModal from './PostAssessmentModal';
import RecordRepairModal from './RecordRepairModal';
import RepairRequestDetailModal from './RepairRequestDetailModal';

const TechTab = () => {
    const { showModal, hideModal, showToast } = useAppContext();
    const [repairs, setRepairs] = useState<any[]>([]);
    const [deliveryQueue, setDeliveryQueue] = useState<any[]>([]);
    const [borrowedQueue, setBorrowedQueue] = useState<any[]>([]);
    const [returnQueue, setReturnQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [repairList, deliveryList, borrowedList, returnList] = await Promise.all([
                getTechnicianRepairQueue(),
                getDeliveryQueue(),
                getBorrowedQueue(),
                getReturnQueue(),
            ]);
            setRepairs(repairList);
            setDeliveryQueue(deliveryList);
            setBorrowedQueue(borrowedList);
            setReturnQueue(returnList);
        } catch (error) {
            console.error("Error fetching tech data:", error);
            showToast('Error', 'Failed to fetch technician data.');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Handlers ---
    const showRepairDetails = (repair: any) => {
        showModal('รายละเอียดคำขอซ่อม', <RepairRequestDetailModal repair={repair} onClose={hideModal} />);
    };

    const handleProcessReturn = async (borrowId: string) => {
        try {
            await processReturn(borrowId);
            showToast('Success', 'รับคืนเครื่องเรียบร้อย');
            fetchData();
        } catch (error) {
            console.error("Failed to process return:", error);
            showToast('Error', 'เกิดข้อผิดพลาดในการรับคืนเครื่อง');
        }
    };

    const handlePreDeliveryAssess = (borrowRequest: any, equipment: any) => {
        showModal(`ตรวจสภาพก่อนส่งมอบ: ${equipment.name}`,
            <AssessmentModal 
                borrowRequest={borrowRequest}
                equipment={equipment}
                onClose={hideModal}
                onSuccess={() => { hideModal(); fetchData(); }}
            />
        );
    };

    const handleSubmitPostAssessment = async (assessmentData: any) => {
        try {
            await submitPostAssessment(assessmentData);
            showToast('Success', 'บันทึกผลการตรวจสภาพหลังคืนเรียบร้อยแล้ว');
            hideModal();
            fetchData();
        } catch (error) {
            console.error("Failed to submit post-assessment:", error);
            showToast('Error', 'เกิดข้อผิดพลาดในการบันทึกผล');
        }
    };

    const handlePostReturnAssess = (borrowRecord: any, equipment: any) => {
        showModal('ตรวจสภาพหลังการคืน',
            <PostAssessmentModal 
                borrowRecord={borrowRecord}
                equipment={equipment}
                onClose={hideModal}
                onSubmit={handleSubmitPostAssessment}
            />
        );
    };

    const handleCompleteRepair = async (repairData: any) => {
        try {
            await completeRepair(repairData);
            showToast('Success', 'บันทึกการซ่อมเรียบร้อยแล้ว');
            hideModal();
            fetchData();
        } catch (error) {
            console.error("Failed to complete repair:", error);
            showToast('Error', 'เกิดข้อผิดพลาดในการบันทึกการซ่อม');
        }
    };

    const handleRecordRepair = (repair: any) => {
        showModal('บันทึกรายละเอียดการซ่อม',
            <RecordRepairModal 
                repairRequest={repair}
                onClose={hideModal}
                onSubmit={handleCompleteRepair}
            />
        );
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="tab-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* 1. Pre-Delivery Queue */}
                <div className="bg-white rounded-2xl p-4 text-[var(--text-color-dark)]">
                    <h3 className="text-base font-semibold">1. รายการรอส่งมอบ</h3>
                    <div className="mt-3 space-y-3 max-h-[70vh] overflow-y-auto pr-2 -mr-2">
                        {deliveryQueue.length === 0
                            ? <p className="text-gray-500 text-center py-4">ไม่มีรายการรอส่งมอบ</p>
                            : deliveryQueue.map(b => (
                            <div key={b.id} className="p-3 rounded-lg border border-[var(--border-color)] bg-white shadow-sm text-sm">
                                <p className="font-semibold text-gray-800">ถึง: {b.user_name}</p>
                                <p className="text-xs text-gray-500 mb-2">วันที่ขอยืม: {b.borrow_date}</p>
                                {b.equipment_assigned?.map(equip => (
                                    <div key={equip.id} className="p-2 mt-2 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-between">
                                        <div><p className="font-medium text-gray-700">{equip.name}</p><p className="text-xs text-gray-500">S/N: {equip.serial}</p></div>
                                        <button onClick={() => handlePreDeliveryAssess(b, equip)} className="px-3 py-1 text-xs rounded-md bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color-dark)] transition-colors">ตรวจสภาพ</button>
                                    </div>
                                )) || <p className="text-xs text-red-500 mt-2">ยังไม่ได้ระบุเครื่อง</p>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Borrowed Queue (Awaiting Return) */}
                <div className="bg-white rounded-2xl p-4 text-[var(--text-color-dark)]">
                    <h3 className="text-base font-semibold">2. ที่ถูกยืม (รอรับคืน)</h3>
                    <div className="mt-3 space-y-3 max-h-[70vh] overflow-y-auto pr-2 -mr-2">
                        {borrowedQueue.length === 0
                            ? <p className="text-gray-500 text-center py-4">ไม่มีรายการที่ถูกยืม</p>
                            : borrowedQueue.map(b => (
                            <div key={b.id} className="p-3 rounded-lg border border-[var(--border-color)] bg-white shadow-sm text-sm">
                                <p className="font-semibold text-gray-800">ยืมโดย: {b.user_name}</p>
                                <p className="text-xs text-gray-500 mb-2">กำหนดคืน: {b.due_date}</p>
                                <ul className="list-disc list-inside text-xs pl-1 space-y-1 mb-3 text-gray-700">
                                    {b.equipment_assigned?.map(e => <li key={e.id}>{e.name} (S/N: {e.serial})</li>)}
                                </ul>
                                <button onClick={() => handleProcessReturn(b.id)} className="w-full px-3 py-1.5 text-sm rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors">รับคืนเครื่อง</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Post-Return Assessment Queue */}
                <div className="bg-white rounded-2xl p-4 text-[var(--text-color-dark)]">
                    <h3 className="text-base font-semibold">3. รอตรวจสภาพหลังคืน</h3>
                     <div className="mt-3 space-y-3 max-h-[70vh] overflow-y-auto pr-2 -mr-2">
                        {returnQueue.length === 0
                            ? <p className="text-gray-500 text-center py-4">ไม่มีรายการรอตรวจสภาพ</p>
                            : returnQueue.map(b => (
                            <div key={b.id} className="p-3 rounded-lg border border-[var(--border-color)] bg-white shadow-sm text-sm">
                                <p className="font-semibold text-gray-800">จาก: {b.user_name}</p>
                                <p className="text-xs text-gray-500 mb-2">วันที่คืน: {b.returned_date?.toDate().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) || 'N/A'}</p>
                                {b.equipment_returned?.map(equip => (
                                    <div key={equip.id} className="p-2 mt-2 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-between">
                                        <div><p className="font-medium text-gray-700">{equip.name}</p><p className="text-xs text-gray-500">S/N: {equip.serial}</p></div>
                                        <button onClick={() => handlePostReturnAssess(b, equip)} className="px-3 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors">ตรวจสภาพ</button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Repair List Section */}
                <div className="bg-white rounded-2xl p-4 text-[var(--text-color-dark)]">
                    <h3 className="text-base font-semibold">4. รายการซ่อมบำรุง</h3>
                    <div className="mt-3 space-y-3 max-h-[70vh] overflow-y-auto pr-2 -mr-2">
                        {repairs.length === 0
                            ? <p className="text-gray-500 text-center py-4">ไม่มีรายการซ่อมบำรุง</p>
                            : repairs.map(r => {
                            const { text, color } = getRepairStatusTextAndColor(r.status);
                            return (
                                <div key={r.id} className="p-3 rounded-lg border border-[var(--border-color)] bg-white shadow-sm text-sm">
                                    <div className="flex justify-between items-start mb-1"><span className="font-semibold text-gray-800">{r.equipment_name}</span><span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{text}</span></div>
                                    <p className="text-gray-600 truncate">อาการ: {r.damage_description}</p>
                                    <p className="text-xs text-gray-500">แจ้งเมื่อ: {r.request_date?.toDate().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                    <div className="mt-3 flex justify-end items-center gap-2">
                                        {(r.status === 'repair_approved' || r.status === 'repair_in_progress') && 
                                            <button onClick={() => handleRecordRepair(r)} className="px-3 py-1 text-xs rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors">บันทึกการซ่อม</button>}
                                        <button onClick={() => showRepairDetails(r)} className="px-3 py-1 text-xs rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">ดูรายละเอียด</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechTab;

