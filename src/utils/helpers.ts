export const formatTimeAgo = (date: string | Date): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " ปีที่แล้ว";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " เดือนที่แล้ว";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " วันที่แล้ว";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ชั่วโมงที่แล้ว";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " นาทีที่แล้ว";
    return "เมื่อสักครู่";
}

export const statusMap: { [key: string]: { text: string; color: string } } = {
    available: { text: 'ว่าง', color: 'bg-green-100 text-green-800' },
    borrowed: { text: 'ถูกยืม', color: 'bg-blue-100 text-blue-800' },
    under_maintenance: { text: 'ซ่อมบำรุง', color: 'bg-yellow-100 text-yellow-800' },
    pending_repair_approval: { text: 'รออนุมัติซ่อม', color: 'bg-orange-100 text-orange-800' },
    deleted: { text: 'ถูกลบ', color: 'bg-gray-200 text-gray-600' }
};

export const roleMap: { [key: string]: string } = { admin: 'ผู้ดูแลระบบ', approver: 'ผู้อนุมัติ', technician: 'ช่างเทคนิค', user: 'ผู้ใช้ทั่วไป' };

export const getBorrowStatusTextAndColor = (status: string): { text: string; color: string } => {
    switch (status) {
        case 'pending_borrow_approval': return { text: 'รออนุมัติ', color: 'bg-yellow-100 text-yellow-800' };
        case 'pending_delivery': return { text: 'อนุมัติแล้ว', color: 'bg-cyan-100 text-cyan-800' };
        case 'borrowed': return { text: 'ยืมอยู่', color: 'bg-blue-100 text-blue-800' };
        case 'rejected': return { text: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-800' };
        case 'cancelled': return { text: 'ยกเลิก', color: 'bg-gray-100 text-gray-800' };
        case 'returned_early': return { text: 'คืนก่อนกำหนด', color: 'bg-blue-100 text-blue-800' };
        case 'returned_late': return { text: 'คืนล่าช้า', color: 'bg-orange-100 text-orange-800' };
        case 'returned': return { text: 'คืนแล้ว', color: 'bg-blue-100 text-blue-800' };
        case 'returned_damaged': return { text: 'คืน (ชำรุด)', color: 'bg-orange-100 text-orange-800' };
        default: return { text: 'ไม่ทราบสถานะ', color: 'bg-gray-100 text-gray-800' };
    }
}

export const getRepairStatusTextAndColor = (status: string): { text: string; color: string } => {
    switch (status) {
        case 'pending_repair_approval': return { text: 'รออนุมัติซ่อม', color: 'bg-yellow-100 text-yellow-800' };
        case 'repair_approved': return { text: 'กำลังซ่อม', color: 'bg-blue-100 text-blue-800' };
        case 'repair_rejected': return { text: 'ไม่อนุมัติซ่อม', color: 'bg-red-100 text-red-800' };
        case 'completed': return { text: 'ซ่อมเสร็จ', color: 'bg-green-100 text-green-800' };
        default: return { text: 'ไม่ทราบสถานะ', color: 'bg-gray-100 text-gray-800' };
    }
}
