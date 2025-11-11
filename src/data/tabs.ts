export const allTabs = [
    { id: 'profileTab', label: 'ข้อมูลส่วนตัว', roles: ['admin', 'user', 'technician', 'approver'] },
    { id: 'equipmentTab', label: 'ภาพรวมอุปกรณ์', roles: ['admin', 'user', 'technician', 'approver'] },
    { id: 'borrowTab', label: 'ยืมอุปกรณ์', roles: ['user'] },
    { id: 'borrowHistoryTab', label: 'ประวัติการยืม', roles: ['user', 'admin'] },
    { id: 'approvalTab', label: 'จัดการคำขอ', roles: ['approver'] },
    { id: 'techTab', label: 'งานของช่าง', roles: ['technician'] },
    { id: 'repairHistoryTab', label: 'ประวัติการซ่อม', roles: ['technician', 'admin'] },
    { id: 'approvalHistoryTab', label: 'ประวัติการอนุมัติ', roles: ['approver', 'admin'] },
    { id: 'assessmentTab', label: 'ประเมินมาตรฐาน', roles: ['technician'] },
    { id: 'standardAssessmentHistoryTab', label: 'ประวัติการประเมินมาตรฐาน', roles: ['technician', 'admin'] },
    { id: 'reportTab', label: 'รายงาน', roles: ['admin', 'approver', 'technician'] },
    { id: 'adminTab', label: 'ส่วนผู้ดูแลระบบ', roles: ['admin'] }
];
