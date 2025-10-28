import React from 'react';
import { statusMap } from '../../utils/helpers';

const LogDetailModal = ({ log }) => {
    if (!log) return null;

    const { action, details, timestamp, adminName } = log;

    const renderContent = () => {
        switch (action) {
            case 'DELETE_EQUIPMENT':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-red-600">ลบอุปกรณ์</h4>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">ชื่ออุปกรณ์:</td><td className="py-1">{details.name || 'N/A'}</td></tr>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">Serial No.:</td><td className="py-1">{details.serial || 'N/A'}</td></tr>
                                <tr><td className="py-1 pr-2 text-slate-500">เหตุผล:</td><td className="py-1">{details.reason || 'N/A'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'BATCH_DELETE_EQUIPMENT':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-red-600">ลบอุปกรณ์หลายรายการ</h4>
                        <table className="w-full text-sm mb-2">
                            <tbody>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">จำนวน:</td><td className="py-1">{details.count} รายการ</td></tr>
                                <tr><td className="py-1 pr-2 text-slate-500">เหตุผล:</td><td className="py-1">{details.reason || 'N/A'}</td></tr>
                            </tbody>
                        </table>
                        <div>
                            <p className="text-sm text-slate-500">อุปกรณ์ที่ถูกลบ:</p>
                            <div className="max-h-40 overflow-y-auto bg-slate-100 p-2 rounded-md text-xs">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left"><th className="py-1 pr-2">ชื่อ</th><th className="py-1">Serial No.</th></tr>
                                    </thead>
                                    <tbody>
                                        {details.details?.map((item, idx) => (
                                            <tr key={idx} className="border-b border-slate-200 last:border-b-0">
                                                <td className="py-1 pr-2">{item.name || 'N/A'}</td>
                                                <td className="py-1">{item.serial || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'ADD_EQUIPMENT':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-green-600">เพิ่มอุปกรณ์ใหม่</h4>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">ชื่ออุปกรณ์:</td><td className="py-1">{details.name || 'N/A'}</td></tr>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">Serial No.:</td><td className="py-1">{details.serial || 'N/A'}</td></tr>
                                <tr><td className="py-1 pr-2 text-slate-500">ประเภท:</td><td className="py-1">{details.type || 'N/A'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'BATCH_UPDATE_STATUS':
                 return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-blue-600">อัปเดตสถานะหลายรายการ</h4>
                        <table className="w-full text-sm mb-2">
                            <tbody>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">จำนวน:</td><td className="py-1">{details.count} รายการ</td></tr>
                                <tr><td className="py-1 pr-2 text-slate-500">สถานะใหม่:</td><td className="py-1">{statusMap[details.newStatus]?.text || details.newStatus || 'N/A'}</td></tr>
                            </tbody>
                        </table>
                        <div>
                            <p className="text-sm text-slate-500">อุปกรณ์ที่ถูกอัปเดต:</p>
                            <div className="max-h-40 overflow-y-auto bg-slate-100 p-2 rounded-md text-xs">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left"><th className="py-1 pr-2">ชื่อ</th><th className="py-1">Serial No.</th><th className="py-1">สถานะเดิม</th><th className="py-1">สถานะใหม่</th></tr>
                                    </thead>
                                    <tbody>
                                        {details.details?.map((item, idx) => (
                                            <tr key={idx} className="border-b border-slate-200 last:border-b-0">
                                                <td className="py-1 pr-2">{item.name || 'N/A'}</td>
                                                <td className="py-1">{item.serial || 'N/A'}</td>
                                                <td className="py-1">{statusMap[item.oldStatus]?.text || item.oldStatus || 'N/A'}</td>
                                                <td className="py-1">{statusMap[item.newStatus]?.text || item.newStatus || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'IMPORT_EQUIPMENT':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-green-600">นำเข้าข้อมูลอุปกรณ์</h4>
                        <table className="w-full text-sm mb-2">
                            <tbody>
                                <tr><td className="py-1 pr-2 text-slate-500">จำนวน:</td><td className="py-1">{details.count} รายการ</td></tr>
                            </tbody>
                        </table>
                        <div>
                            <p className="text-sm text-slate-500">อุปกรณ์ที่ถูกเพิ่ม:</p>
                            <div className="max-h-40 overflow-y-auto bg-slate-100 p-2 rounded-md text-xs">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left"><th className="py-1 pr-2">ชื่อ</th><th className="py-1">Serial No.</th></tr>
                                    </thead>
                                    <tbody>
                                        {details.details?.map((item, idx) => (
                                            <tr key={idx} className="border-b border-slate-200 last:border-b-0">
                                                <td className="py-1 pr-2">{item.name || 'N/A'}</td>
                                                <td className="py-1">{item.serial || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'CREATE_USER':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-green-600">สร้างผู้ใช้ใหม่</h4>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">ชื่อ:</td><td className="py-1">{details.name || 'N/A'}</td></tr>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">อีเมล:</td><td className="py-1">{details.email || 'N/A'}</td></tr>
                                <tr><td className="py-1 pr-2 text-slate-500">ID ผู้ใช้:</td><td className="py-1"><code className="font-mono">{details.uid || 'N/A'}</code></td></tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'DELETE_USER':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-red-600">ลบผู้ใช้</h4>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">ชื่อผู้ใช้:</td><td className="py-1">{details.name || 'N/A'}</td></tr>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">อีเมล:</td><td className="py-1">{details.email || 'N/A'}</td></tr>
                                <tr><td className="py-1 pr-2 text-slate-500">เหตุผล:</td><td className="py-1">{details.reason || 'N/A'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'APPROVE_USER':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-green-600">อนุมัติผู้ใช้</h4>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr><td className="py-1 pr-2 text-slate-500">ID ผู้ใช้:</td><td className="py-1"><code className="font-mono">{details.userId || 'N/A'}</code></td></tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'UPDATE_USER':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-blue-600">อัปเดตข้อมูลผู้ใช้</h4>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left"><th className="py-1 pr-2">ฟิลด์</th><th className="py-1">ค่าเดิม</th><th className="py-1">ค่าใหม่</th></tr>
                            </thead>
                            <tbody>
                                {Object.entries(details.changes || {}).map(([key, newValue]) => {
                                    const oldValue = details.oldData ? details.oldData[key] : 'N/A';
                                    // Only show changed fields, or all if oldData is not available
                                    if (JSON.stringify(oldValue) !== JSON.stringify(newValue) || !details.oldData) {
                                        return (
                                            <tr key={key} className="border-b border-slate-200 last:border-b-0">
                                                <td className="py-1 pr-2">{key}:</td>
                                                <td className="py-1">{JSON.stringify(oldValue)}</td>
                                                <td className="py-1">{JSON.stringify(newValue)}</td>
                                            </tr>
                                        );
                                    }
                                    return null;
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            case 'CREATE_BORROW_REQUEST':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-green-600">สร้างคำขอยืม</h4>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">วัตถุประสงค์:</td><td className="py-1">{details.purpose || 'N/A'}</td></tr>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">ID คำขอ:</td><td className="py-1"><code className="font-mono">{details.borrowId || 'N/A'}</code></td></tr>
                                <tr><td className="py-1 pr-2 text-slate-500">อุปกรณ์ที่ยืม:</td><td className="py-1">{details.equipmentIds?.join(', ') || 'N/A'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'APPROVE_BORROW':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-green-600">อนุมัติคำขอยืม</h4>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">ID คำขอ:</td><td className="py-1"><code className="font-mono">{details.borrowId || 'N/A'}</code></td></tr>
                                <tr><td className="py-1 pr-2 text-slate-500">อุปกรณ์ที่เกี่ยวข้อง:</td><td className="py-1">{details.equipmentIds?.join(', ') || 'N/A'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'REJECT_BORROW':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-red-600">ปฏิเสธคำขอยืม</h4>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">ID คำขอ:</td><td className="py-1"><code className="font-mono">{details.borrowId || 'N/A'}</code></td></tr>
                                <tr><td className="py-1 pr-2 text-slate-500">อุปกรณ์ที่เกี่ยวข้อง:</td><td className="py-1">{details.equipmentIds?.join(', ') || 'N/A'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'APPROVE_REPAIR':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-green-600">อนุมัติซ่อม</h4>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">ID การซ่อม:</td><td className="py-1"><code className="font-mono">{details.repairId || 'N/A'}</code></td></tr>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">ชื่ออุปกรณ์:</td><td className="py-1">{details.equipmentName || 'N/A'}</td></tr>
                                <tr><td className="py-1 pr-2 text-slate-500">ID อุปกรณ์:</td><td className="py-1"><code className="font-mono">{details.equipmentId || 'N/A'}</code></td></tr>
                            </tbody>
                        </table>
                    </div>
                );
            case 'REJECT_REPAIR':
                return (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-red-600">ปฏิเสธซ่อม</h4>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">ID การซ่อม:</td><td className="py-1"><code className="font-mono">{details.repairId || 'N/A'}</code></td></tr>
                                <tr className="border-b"><td className="py-1 pr-2 text-slate-500">ชื่ออุปกรณ์:</td><td className="py-1">{details.equipmentName || 'N/A'}</td></tr>
                                <tr><td className="py-1 pr-2 text-slate-500">ID อุปกรณ์:</td><td className="py-1"><code className="font-mono">{details.equipmentId || 'N/A'}</code></td></tr>
                            </tbody>
                        </table>
                    </div>
                );
            default:
                return (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-lg">รายละเอียด Log (ไม่ระบุประเภท)</h4>
                        <pre className="text-xs bg-gray-100 p-4 rounded-md overflow-x-auto">{JSON.stringify(details, null, 2)}</pre>
                    </div>
                );
        }
    };

    return (
        <div className="text-slate-800">
            {renderContent()}
            <div className="mt-4 pt-4 border-t text-xs text-slate-500">
                <p>ผู้ดำเนินการ: <span className="font-medium">{adminName || 'N/A'}</span></p>
                <p>เวลา: <span className="font-medium">{timestamp?.toDate().toLocaleString('th-TH') || 'N/A'}</span></p>
            </div>
        </div>
    );
};

export default LogDetailModal;