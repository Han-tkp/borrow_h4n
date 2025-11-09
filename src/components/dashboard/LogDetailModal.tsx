import React from 'react';
import { statusMap } from '../../utils/helpers';

const LogDetailModal = ({ log }) => {
    if (!log) return null;

    const { action, details, timestamp, adminName } = log;

    const renderContent = () => {
        try {
            switch (action) {
                case 'DELETE_EQUIPMENT':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-red-600">ลบอุปกรณ์</h4>
                            <p className="text-sm">ชื่ออุปกรณ์: <span className="font-medium">{log.name || 'N/A'}</span></p>
                        </div>
                    );
                case 'BATCH_DELETE_EQUIPMENT':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-red-600">ลบอุปกรณ์หลายรายการ</h4>
                            <p className="text-sm">จำนวน: <span className="font-medium">{log.count} รายการ</span></p>
                            <p className="text-sm">เหตุผล: <span className="font-medium">{log.reason || 'N/A'}</span></p>
                        </div>
                    );
                case 'ADD_EQUIPMENT':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-green-600">เพิ่มอุปกรณ์ใหม่</h4>
                            <p className="text-sm">ชื่ออุปกรณ์: <span className="font-medium">{log.name || 'N/A'}</span></p>
                        </div>
                    );
                case 'BATCH_UPDATE_STATUS':
                     return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-blue-600">อัปเดตสถานะหลายรายการ</h4>
                            <p className="text-sm">จำนวน: <span className="font-medium">{log.count} รายการ</span></p>
                            <p className="text-sm">สถานะใหม่: <span className="font-medium">{statusMap[log.newStatus]?.text || log.newStatus || 'N/A'}</span></p>
                        </div>
                    );
                case 'IMPORT_EQUIPMENT':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-green-600">นำเข้าข้อมูลอุปกรณ์</h4>
                            <p className="text-sm">จำนวน: <span className="font-medium">{log.count} รายการ</span></p>
                        </div>
                    );
                case 'CREATE_USER':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-green-600">สร้างผู้ใช้ใหม่</h4>
                            <p className="text-sm">ชื่อผู้ใช้: <span className="font-medium">{log.name || 'N/A'}</span></p>
                        </div>
                    );
                case 'DELETE_USER':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-red-600">ลบผู้ใช้</h4>
                            <p className="text-sm">ชื่อผู้ใช้: <span className="font-medium">{log.name || 'N/A'}</span></p>
                        </div>
                    );
                case 'UPDATE_USER':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-blue-600">แก้ไขผู้ใช้</h4>
                            <p className="text-sm">ชื่อผู้ใช้: <span className="font-medium">{log.newData?.name || log.oldData?.name || 'N/A'}</span></p>
                        </div>
                    );
                case 'CREATE_BORROW_REQUEST':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-green-600">สร้างคำขอยืม</h4>
                            <p className="text-sm">วัตถุประสงค์: <span className="font-medium">{log.purpose || 'N/A'}</span></p>
                        </div>
                    );
                case 'APPROVE_BORROW':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-green-600">อนุมัติคำขอยืม</h4>
                            <p className="text-sm">ID คำขอ: <code className="font-mono">{log.borrowId || 'N/A'}</code></p>
                        </div>
                    );
                case 'REJECT_BORROW':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-red-600">ปฏิเสธคำขอยืม</h4>
                            <p className="text-sm">ID คำขอ: <code className="font-mono">{log.borrowId || 'N/A'}</code></p>
                        </div>
                    );
                case 'APPROVE_REPAIR':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-green-600">อนุมัติซ่อม</h4>
                            <p className="text-sm">ชื่ออุปกรณ์: <span className="font-medium">{log.equipmentName || 'N/A'}</span></p>
                        </div>
                    );
                case 'REJECT_REPAIR':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-red-600">ปฏิเสธซ่อม</h4>
                            <p className="text-sm">ชื่ออุปกรณ์: <span className="font-medium">{log.equipmentName || 'N/A'}</span></p>
                        </div>
                    );
                case 'APPROVE_AND_AUTO_ASSIGN_BORROW':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-green-600">อนุมัติและจ่ายเครื่อง</h4>
                            <p className="text-sm">ID คำขอ: <code className="font-mono">{log.borrowId || 'N/A'}</code></p>
                            <p className="text-sm">จำนวน: <span className="font-medium">{log.assignedEquipment?.length || 0} รายการ</span></p>
                        </div>
                    );
                case 'PROCESS_RETURN':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-blue-600">รับคืนเครื่อง</h4>
                            <p className="text-sm">ID คำขอ: <code className="font-mono">{log.borrowId || 'N/A'}</code></p>
                        </div>
                    );
                case 'CONFIRM_DELIVERY':
                     return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-green-600">ยืนยันการส่งมอบ</h4>
                            <p className="text-sm">ID คำขอ: <code className="font-mono">{log.borrowRequestId || 'N/A'}</code></p>
                        </div>
                    );
                case 'COMPLETE_REPAIR':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-green-600">ซ่อมเสร็จสิ้น</h4>
                            <p className="text-sm">ID การซ่อม: <code className="font-mono">{log.repairId || 'N/A'}</code></p>
                        </div>
                    );
                case 'CHANGE_EQUIPMENT_AND_DELIVER':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-blue-600">เปลี่ยนเครื่องและส่งมอบ</h4>
                            <p className="text-sm">ID คำขอ: <code className="font-mono">{log.borrowRequestId || 'N/A'}</code></p>
                        </div>
                    );
                case 'POST_ASSESSMENT':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-blue-600">บันทึกผลตรวจสภาพหลังคืน</h4>
                            <p className="text-sm">ID อุปกรณ์: <code className="font-mono">{log.equipmentId || 'N/A'}</code></p>
                            <p className="text-sm">ผล: {log.isAbnormal ? <span className='text-red-600'>ผิดปกติ</span> : <span className='text-green-600'>ปกติ</span>}</p>
                        </div>
                    );
                case 'CREATE_REPAIR_REQUEST_FROM_ASSESSMENT':
                    return (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg text-orange-600">สร้างคำขอซ่อมจากผลตรวจ</h4>
                            <p className="text-sm">ID อุปกรณ์: <code className="font-mono">{log.equipmentId || 'N/A'}</code></p>
                        </div>
                    );
                default:
                    // Fallback for any other actions, including CLEAR_... actions
                    const { action: currentAction, timestamp, adminName, ...otherDetails } = log;
                    return (
                        <div className="space-y-2">
                            <h4 className="font-semibold text-lg">รายละเอียด: {currentAction}</h4>
                            <div className="overflow-x-auto max-h-80">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr className="text-left">
                                            <th className="py-1 px-2 font-semibold">Key</th>
                                            <th className="py-1 px-2 font-semibold">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {otherDetails && Object.entries(otherDetails).map(([key, value]) => (
                                            <tr key={key} className="border-b border-slate-200 last:border-b-0">
                                                <td className="py-2 px-2 font-medium align-top">{key}</td>
                                                <td className="py-2 px-2 font-mono text-xs align-top">
                                                    <pre className="whitespace-pre-wrap break-all bg-slate-50 p-2 rounded-md">
                                                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                                    </pre>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(!otherDetails || Object.keys(otherDetails).length === 0) && <p className="text-sm text-slate-500 p-2">ไม่มีรายละเอียดเพิ่มเติม</p>}
                            </div>
                        </div>
                    );
            }
        } catch (error) {
            console.error("Error rendering log detail:", error, log);
            return (
                <div className="space-y-2 text-red-500">
                    <h4 className="font-semibold text-lg">เกิดข้อผิดพลาดในการแสดงผลรายละเอียด</h4>
                    <p>ไม่สามารถแสดงรายละเอียดสำหรับ log นี้ได้</p>
                    <pre className="text-xs bg-gray-100 p-4 rounded-md overflow-x-auto text-black">{JSON.stringify(log, null, 2)}</pre>
                </div>
            );
        }
    };

    return (
        <div className="text-slate-800">
            {renderContent()}
            <div className="mt-4 pt-4 border-t text-xs text-slate-500">
                <p>ผู้ดำเนินการ: <span className="font-medium">{adminName || 'N/A'}</span></p>
                <p>เวลา: <span className="font-medium">{(timestamp && typeof timestamp.toDate === 'function') ? timestamp.toDate().toLocaleString('th-TH') : 'N/A'}</span></p>
            </div>
        </div>
    );
};

export default LogDetailModal;